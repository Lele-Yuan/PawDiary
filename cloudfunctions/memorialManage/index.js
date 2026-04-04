const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'add':
      return await addMemorial(OPENID, data);
    case 'list':
      return await listMemorials(OPENID);
    case 'getRandom':
      return await getRandom(OPENID, data);
    case 'addBlessing':
      return await addBlessing(OPENID, data);
    case 'getBlessings':
      return await getBlessings(OPENID, data);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

// 新增纪念宠物
async function addMemorial(openid, data) {
  if (!data || !data.petName || !data.passDate) {
    return { code: -1, message: '宠物名字和离开日期为必填项' };
  }

  // 查询用户信息（冗余存储）
  var ownerNickName = '未知用户';
  var ownerAvatar = '';
  try {
    var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
    if (userRes.data.length > 0) {
      ownerNickName = userRes.data[0].nickName || '未知用户';
      ownerAvatar = userRes.data[0].avatarUrl || '';
    }
  } catch (e) {
    console.warn('查询用户信息失败：', e);
  }

  var memorialData = {
    _openid: openid,
    petName: data.petName,
    petAvatar: data.petAvatar || '',
    species: data.species || '其他',
    gender: data.gender || 'unknown',
    birthday: data.birthday || '',
    passDate: data.passDate,
    description: data.description || '',
    ownerNickName: ownerNickName,
    ownerAvatar: ownerAvatar,
    blessingsCount: 0,
    createdAt: new Date()
  };

  var res = await db.collection('memorial_pets').add({ data: memorialData });
  return { code: 0, message: '添加成功', data: { _id: res._id } };
}

// 获取自己的纪念宠物列表
async function listMemorials(openid) {
  var res = await db.collection('memorial_pets')
    .where({ _openid: openid })
    .orderBy('passDate', 'desc')
    .limit(50)
    .get();
  return { code: 0, data: res.data };
}

// 随机获取他人的纪念宠物（排除自己和已展示过的）
async function getRandom(openid, data) {
  var excludeIds = (data && data.excludeIds) ? data.excludeIds : [];

  // 查询所有他人的纪念宠物 _id
  var allRes = await db.collection('memorial_pets')
    .where({ _openid: _.neq(openid) })
    .field({ _id: true })
    .limit(500)
    .get();

  if (allRes.data.length === 0) {
    return { code: 1, message: '暂无其他小天使', data: null };
  }

  // 排除已展示过的 id
  var candidates = allRes.data.filter(function(item) {
    return excludeIds.indexOf(item._id) === -1;
  });

  // 若所有都展示过，则重置
  if (candidates.length === 0) {
    candidates = allRes.data;
  }

  // 随机取一条
  var randomIndex = Math.floor(Math.random() * candidates.length);
  var randomId = candidates[randomIndex]._id;

  var petRes = await db.collection('memorial_pets').doc(randomId).get();
  var pet = petRes.data;

  // 获取最新5条祝福
  var blessingsRes = await db.collection('memorial_blessings')
    .where({ memorialPetId: randomId })
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  return {
    code: 0,
    data: {
      pet: pet,
      blessings: blessingsRes.data,
      total: allRes.data.length
    }
  };
}

// 添加祝福语（每人对同一宠物只保留一条）
async function addBlessing(openid, data) {
  if (!data || !data.memorialPetId || !data.content) {
    return { code: -1, message: '缺少必要参数' };
  }
  if (data.content.length > 100) {
    return { code: -1, message: '祝福语最多100个字' };
  }

  // 查询当前用户信息
  var nickName = '匿名用户';
  var avatarUrl = '';
  try {
    var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
    if (userRes.data.length > 0) {
      nickName = userRes.data[0].nickName || '匿名用户';
      avatarUrl = userRes.data[0].avatarUrl || '';
    }
  } catch (e) {
    console.warn('查询用户信息失败：', e);
  }

  // 检查是否已留过言
  var existRes = await db.collection('memorial_blessings')
    .where({ _openid: openid, memorialPetId: data.memorialPetId })
    .limit(1)
    .get();

  var isNew = existRes.data.length === 0;

  if (isNew) {
    // 新增
    await db.collection('memorial_blessings').add({
      data: {
        _openid: openid,
        memorialPetId: data.memorialPetId,
        content: data.content,
        nickName: nickName,
        avatarUrl: avatarUrl,
        createdAt: new Date()
      }
    });
    // 更新计数
    await db.collection('memorial_pets').doc(data.memorialPetId).update({
      data: { blessingsCount: _.inc(1) }
    });
  } else {
    // 更新已有留言
    await db.collection('memorial_blessings').doc(existRes.data[0]._id).update({
      data: {
        content: data.content,
        updatedAt: new Date()
      }
    });
  }

  return { code: 0, message: isNew ? '祝福已送出' : '祝福已更新', isNew: isNew };
}

// 获取指定纪念宠物的祝福语列表
async function getBlessings(openid, data) {
  if (!data || !data.memorialPetId) {
    return { code: -1, message: '缺少 memorialPetId' };
  }
  var limit = data.limit || 20;

  var res = await db.collection('memorial_blessings')
    .where({ memorialPetId: data.memorialPetId })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return { code: 0, data: res.data };
}
