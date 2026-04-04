var cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
var db = cloud.database();
var _ = db.command;

exports.main = async function (event, context) {
  var OPENID = cloud.getWXContext().OPENID;
  var action = event.action;
  var data = event.data || {};

  switch (action) {
    case 'join':
      return await joinFamily(OPENID, data);
    case 'list':
      return await listMembers(OPENID, data);
    case 'updateRole':
      return await updateRole(OPENID, data);
    case 'remove':
      return await removeMember(OPENID, data);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

// 加入宠物家庭
async function joinFamily(openid, data) {
  var petId = data.petId;
  if (!petId) {
    return { code: -1, message: '缺少宠物ID' };
  }

  // 检查宠物是否存在
  try {
    var petRes = await db.collection('pets').doc(petId).get();
    if (!petRes.data || petRes.data.status !== 'active') {
      return { code: -1, message: '宠物不存在或已归档' };
    }
  } catch (e) {
    return { code: -1, message: '宠物不存在' };
  }

  // 检查是否已是成员
  var existRes = await db.collection('pet_members')
    .where({ petId: petId, _openid: openid })
    .count();
  if (existRes.total > 0) {
    return { code: 0, message: '已是家庭成员' };
  }

  // 获取用户信息
  var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
  var user = userRes.data.length > 0 ? userRes.data[0] : {};

  // 创建成员记录
  await db.collection('pet_members').add({
    data: {
      _openid: openid,
      petId: petId,
      role: 'member',
      nickName: user.nickName || '未知游客',
      avatarUrl: user.avatarUrl || '',
      createdAt: new Date()
    }
  });

  return { code: 0, message: '加入成功' };
}

// 获取宠物的所有家庭成员（从 users 集合获取最新头像昵称）
async function listMembers(openid, data) {
  var petId = data.petId;
  if (!petId) {
    return { code: -1, message: '缺少宠物ID' };
  }

  var res = await db.collection('pet_members')
    .where({ petId: petId })
    .orderBy('createdAt', 'asc')
    .get();

  var members = res.data;

  // 批量获取成员最新用户信息
  for (var i = 0; i < members.length; i++) {
    var m = members[i];
    try {
      var userRes = await db.collection('users')
        .where({ _openid: m._openid })
        .limit(1)
        .get();
      if (userRes.data.length > 0) {
        var user = userRes.data[0];
        members[i].nickName = user.nickName || m.nickName || '未知游客';
        members[i].avatarUrl = user.avatarUrl || m.avatarUrl || '';
      }
    } catch (e) {
      // 查询失败则保留快照数据
      console.error('查询用户信息失败:', e);
    }
  }

  return { code: 0, data: members };
}

// 更新成员角色（仅创建者可操作）
async function updateRole(openid, data) {
  var petId = data.petId;
  var targetOpenid = data.targetOpenid;
  var newRole = data.role;

  if (!petId || !targetOpenid || !newRole) {
    return { code: -1, message: '参数不完整' };
  }

  if (newRole !== 'admin' && newRole !== 'member') {
    return { code: -1, message: '无效的角色' };
  }

  // 检查操作者是否为创建者
  var callerRes = await db.collection('pet_members')
    .where({ petId: petId, _openid: openid, role: 'creator' })
    .count();
  if (callerRes.total === 0) {
    return { code: -1, message: '仅创建者可修改角色' };
  }

  // 检查目标不是创建者
  var targetRes = await db.collection('pet_members')
    .where({ petId: petId, _openid: targetOpenid })
    .limit(1)
    .get();
  if (targetRes.data.length === 0) {
    return { code: -1, message: '目标成员不存在' };
  }
  if (targetRes.data[0].role === 'creator') {
    return { code: -1, message: '不能修改创建者的角色' };
  }

  // 更新角色
  await db.collection('pet_members').doc(targetRes.data[0]._id).update({
    data: { role: newRole }
  });

  return { code: 0, message: '角色更新成功' };
}

// 移除成员（仅创建者可操作）
async function removeMember(openid, data) {
  var petId = data.petId;
  var targetOpenid = data.targetOpenid;

  if (!petId || !targetOpenid) {
    return { code: -1, message: '参数不完整' };
  }

  // 不可移除自己（创建者）
  if (targetOpenid === openid) {
    return { code: -1, message: '创建者不能移除自己' };
  }

  // 检查操作者是否为创建者
  var callerRes = await db.collection('pet_members')
    .where({ petId: petId, _openid: openid, role: 'creator' })
    .count();
  if (callerRes.total === 0) {
    return { code: -1, message: '仅创建者可移除成员' };
  }

  // 删除成员记录
  var targetRes = await db.collection('pet_members')
    .where({ petId: petId, _openid: targetOpenid })
    .limit(1)
    .get();
  if (targetRes.data.length === 0) {
    return { code: -1, message: '成员不存在' };
  }

  await db.collection('pet_members').doc(targetRes.data[0]._id).remove();

  return { code: 0, message: '移除成功' };
}
