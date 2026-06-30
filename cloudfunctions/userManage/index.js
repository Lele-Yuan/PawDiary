const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const security = require('./contentSecurity');

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'login':
      return await loginOrRegister(OPENID, data);
    case 'update':
      return await updateUser(OPENID, data);
    case 'getInfo':
      return await getUserInfo(OPENID);
    case 'getPhoneNumber':
      return await getPhoneNumber(event);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

// 登录或注册
async function loginOrRegister(openid, data) {
  const { data: users } = await db.collection('users')
    .where({ _openid: openid })
    .limit(1)
    .get();

  if (users.length > 0) {
    // 已有用户，返回信息
    return { code: 0, message: '登录成功', data: users[0] };
  }

  const nickName = (data && data.nickName) || '';
  const avatarUrl = (data && data.avatarUrl) || '';

  // 内容安全校验
  if (nickName) {
    const r = await security.checkText(cloud, openid, nickName);
    if (!r.pass) return security.violationResult();
  }
  if (avatarUrl) {
    const r = await security.checkImageByFileId(cloud, avatarUrl);
    if (!r.pass) {
      await security.deleteFiles(cloud, [avatarUrl]);
      return security.violationResult();
    }
  }

  // 新用户注册
  const newUser = {
    _openid: openid,
    nickName: nickName,
    avatarUrl: avatarUrl,
    phone: '',
    currentPetId: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const res = await db.collection('users').add({ data: newUser });
  newUser._id = res._id;

  return { code: 0, message: '注册成功', data: newUser };
}

// 更新用户信息
async function updateUser(openid, data) {
  if (!data) {
    return { code: -1, message: '缺少更新数据' };
  }

  const { data: users } = await db.collection('users')
    .where({ _openid: openid })
    .limit(1)
    .get();

  if (users.length === 0) {
    return { code: -1, message: '用户不存在' };
  }

  // 内容安全校验
  if (data.nickName !== undefined && data.nickName) {
    const r = await security.checkText(cloud, openid, data.nickName);
    if (!r.pass) return security.violationResult();
  }
  if (data.avatarUrl !== undefined && data.avatarUrl) {
    const r = await security.checkImageByFileId(cloud, data.avatarUrl);
    if (!r.pass) {
      await security.deleteFiles(cloud, [data.avatarUrl]);
      return security.violationResult();
    }
  }

  const updateData = { updatedAt: new Date() };
  if (data.nickName !== undefined) updateData.nickName = data.nickName;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.currentPetId !== undefined) updateData.currentPetId = data.currentPetId;

  await db.collection('users').doc(users[0]._id).update({ data: updateData });

  return { code: 0, message: '更新成功' };
}

// 获取用户信息
async function getUserInfo(openid) {
  const { data: users } = await db.collection('users')
    .where({ _openid: openid })
    .limit(1)
    .get();

  if (users.length === 0) {
    return { code: -1, message: '用户不存在' };
  }

  return { code: 0, data: users[0] };
}

// 获取手机号（通过云开发内置能力解密）
async function getPhoneNumber(event) {
  try {
    const res = await cloud.getPhoneNumber({
      event
    });
    return {
      code: 0,
      data: {
        phoneNumber: res.phoneNumber,
        purePhoneNumber: res.purePhoneNumber,
        countryCode: res.countryCode
      }
    };
  } catch (err) {
    return { code: -1, message: '获取手机号失败', error: err.message };
  }
}