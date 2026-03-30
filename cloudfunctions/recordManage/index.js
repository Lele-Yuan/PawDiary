const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'add':
      return await addRecord(OPENID, data);
    case 'list':
      return await listRecords(OPENID, data);
    case 'delete':
      return await deleteRecord(OPENID, data);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

// 添加记录
async function addRecord(openid, data) {
  if (!data || !data.petId || !data.type || !data.title || !data.date) {
    return { code: -1, message: '宠物ID、记录类型、标题和日期为必填项' };
  }

  const validTypes = ['deworm', 'checkup', 'vaccine', 'bath'];
  if (!validTypes.includes(data.type)) {
    return { code: -1, message: '无效的记录类型' };
  }

  const recordData = {
    _openid: openid,
    petId: data.petId,
    type: data.type,
    date: new Date(data.date),
    title: data.title,
    description: data.description || '',
    location: data.location || '',
    cost: data.cost ? Number(data.cost) : 0,
    nextDate: data.nextDate ? new Date(data.nextDate) : null,
    images: data.images || [],
    createdAt: new Date()
  };

  const res = await db.collection('records').add({ data: recordData });
  return { code: 0, message: '添加成功', data: { _id: res._id } };
}

// 获取记录列表
async function listRecords(openid, data) {
  if (!data || !data.petId) {
    return { code: -1, message: '缺少宠物ID' };
  }

  const where = {
    _openid: openid,
    petId: data.petId
  };

  // 按类型筛选
  if (data.type && data.type !== 'all') {
    where.type = data.type;
  }

  const limit = data.limit || 50;
  const skip = data.skip || 0;

  const { data: records } = await db.collection('records')
    .where(where)
    .orderBy('date', 'desc')
    .skip(skip)
    .limit(limit)
    .get();

  return { code: 0, data: records };
}

// 删除记录
async function deleteRecord(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少记录ID' };
  }

  await db.collection('records').doc(data._id).remove();
  return { code: 0, message: '删除成功' };
}