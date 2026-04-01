const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'add':
      return await addPet(OPENID, data);
    case 'update':
      return await updatePet(OPENID, data);
    case 'delete':
      return await deletePet(OPENID, data);
    case 'get':
      return await getPet(OPENID, data);
    case 'list':
      return await listPets(OPENID);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

// 添加宠物
async function addPet(openid, data) {
  if (!data || !data.name || !data.species) {
    return { code: -1, message: '宠物名称和物种为必填项' };
  }

  const petData = {
    _openid: openid,
    name: data.name,
    avatar: data.avatar || '',
    species: data.species,
    breed: data.breed || '',
    gender: data.gender || 'male',
    birthday: data.birthday ? new Date(data.birthday) : null,
    adoptDate: data.adoptDate ? new Date(data.adoptDate) : new Date(),
    weight: data.weight ? Number(data.weight) : 0,
    weightHistory: data.weight ? [{ date: new Date(), weight: Number(data.weight) }] : [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const res = await db.collection('pets').add({ data: petData });

  // 自动创建 creator 的家庭成员记录（pet_members 集合可能不存在，不影响主流程）
  try {
    var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
    var user = userRes.data.length > 0 ? userRes.data[0] : {};
    await db.collection('pet_members').add({
      data: {
        _openid: openid,
        petId: res._id,
        role: 'creator',
        nickName: user.nickName || '宠物主人',
        avatarUrl: user.avatarUrl || '',
        createdAt: new Date()
      }
    });
  } catch (e) {
    console.warn('创建 creator 成员记录失败（pet_members 集合可能未创建）：', e);
  }

  // 如果是用户的第一只宠物，自动设为当前宠物
  var countRes = await db.collection('pets').where({
    _openid: openid,
    status: 'active'
  }).count();
  var total = countRes ? countRes.total : 0;

  if (total === 1) {
    await db.collection('users').where({ _openid: openid }).update({
      data: { currentPetId: res._id, updatedAt: new Date() }
    });
  }

  return { code: 0, message: '添加成功', data: { _id: res._id } };
}

// 更新宠物
async function updatePet(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少宠物ID' };
  }

  const petId = data._id;
  const updateData = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.species !== undefined) updateData.species = data.species;
  if (data.breed !== undefined) updateData.breed = data.breed;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.birthday !== undefined) updateData.birthday = data.birthday ? new Date(data.birthday) : null;
  if (data.adoptDate !== undefined) updateData.adoptDate = data.adoptDate ? new Date(data.adoptDate) : null;

  // 体重更新时追加历史记录
  if (data.weight !== undefined) {
    const newWeight = Number(data.weight);
    updateData.weight = newWeight;
    updateData.weightHistory = _.push([{ date: new Date(), weight: newWeight }]);
  }

  await db.collection('pets').doc(petId).update({ data: updateData });

  return { code: 0, message: '更新成功' };
}

// 归档宠物（软删除）
async function deletePet(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少宠物ID' };
  }

  await db.collection('pets').doc(data._id).update({
    data: { status: 'archived', updatedAt: new Date() }
  });

  // 如果归档的是当前选中宠物，切换到另一只
  const { data: users } = await db.collection('users').where({ _openid: openid }).limit(1).get();
  if (users.length > 0 && users[0].currentPetId === data._id) {
    const { data: activePets } = await db.collection('pets').where({
      _openid: openid,
      status: 'active'
    }).limit(1).get();

    const newCurrentId = activePets.length > 0 ? activePets[0]._id : '';
    await db.collection('users').doc(users[0]._id).update({
      data: { currentPetId: newCurrentId, updatedAt: new Date() }
    });
  }

  return { code: 0, message: '归档成功' };
}

// 按ID获取单个宠物
async function getPet(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少宠物ID' };
  }

  try {
    const res = await db.collection('pets').doc(data._id).get();
    return { code: 0, data: res.data };
  } catch (e) {
    return { code: -1, message: '宠物不存在或已失效' };
  }
}

// 获取宠物列表（包含创建的和加入的）
async function listPets(openid) {
  // 1. 查询自己创建的活跃宠物
  const { data: ownPets } = await db.collection('pets').where({
    _openid: openid,
    status: 'active'
  }).orderBy('createdAt', 'asc').get();

  // 2. 查询 pet_members 获取角色映射
  var roleMap = {};
  var joinedPetIds = [];
  try {
    const { data: members } = await db.collection('pet_members')
      .where({ _openid: openid })
      .get();
    for (var i = 0; i < members.length; i++) {
      roleMap[members[i].petId] = members[i].role;
      joinedPetIds.push(members[i].petId);
    }
  } catch (e) {
    // pet_members 集合可能不存在
  }

  // 3. 为自有宠物标记角色，补建缺失的 creator 记录
  var ownIdSet = {};
  for (var j = 0; j < ownPets.length; j++) {
    var pid = ownPets[j]._id;
    ownIdSet[pid] = true;
    ownPets[j].role = roleMap[pid] || 'creator';
    if (!roleMap[pid]) {
      db.collection('pet_members').add({
        data: {
          _openid: openid,
          petId: pid,
          role: 'creator',
          createdAt: new Date()
        }
      }).catch(function() {});
    }
  }

  // 4. 查询加入但非自己创建的宠物
  var extraIds = [];
  for (var k = 0; k < joinedPetIds.length; k++) {
    if (!ownIdSet[joinedPetIds[k]]) {
      extraIds.push(joinedPetIds[k]);
    }
  }
  var joinedPets = [];
  if (extraIds.length > 0) {
    const { data: extraPets } = await db.collection('pets')
      .where({ _id: _.in(extraIds), status: 'active' })
      .get();
    for (var m = 0; m < extraPets.length; m++) {
      extraPets[m].role = roleMap[extraPets[m]._id] || 'member';
    }
    joinedPets = extraPets;
  }

  return { code: 0, data: ownPets.concat(joinedPets) };
}