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
    case 'get':
      return await getRecord(OPENID, data);
    case 'update':
      return await updateRecord(OPENID, data);
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

  // 验证用户权限
  const memberRes = await db.collection('pet_members')
    .where({ petId: data.petId, _openid: openid })
    .limit(1)
    .get();

  if (memberRes.data.length === 0) {
    return { code: -1, message: '无权操作' };
  }

  const role = memberRes.data[0].role || 'member';
  if (role !== 'creator' && role !== 'admin') {
    return { code: -1, message: '无权限请联系宠物主' };
  }

  const validTypes = [
    'weight', 'poop', 'diet', 'water',
    'deworm', 'vaccine', 'checkup', 'illness',
    'bath', 'nail', 'ear', 'paw', 'gland', 'teeth', 'beauty',
    'disinfect', 'litter', 'toy', 'cage', 'abnormal', 'heat'
  ];
  if (!validTypes.includes(data.type)) {
    return { code: -1, message: '无效的记录类型' };
  }

  // 查询宠物名称（冗余存储，供通知消息使用）
  var petName = '';
  try {
    const petRes = await db.collection('pets').doc(data.petId).get();
    if (petRes.data) petName = petRes.data.name || '';
  } catch (e) {}

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
    enableRemind: data.enableRemind || false,
    remindInterval: data.remindInterval || 0,
    remindAdvance: data.remindAdvance !== undefined ? data.remindAdvance : 0,
    remindTime: data.remindTime || '',
    remindSendAt: data.remindSendAt ? new Date(data.remindSendAt) : null,
    remindSentAt: null,
    petName: petName,
    images: data.images || [],
    // 类型特定字段
    weight: data.weight || '',
    weightUnit: data.weightUnit || 'kg',
    poopStatus: data.poopStatus || '',
    abnormalDesc: data.abnormalDesc || '',
    waterAmount: data.waterAmount || '',
    waterUnit: data.waterUnit || 'ml',
    foodType: data.foodType || '',
    foodAmount: data.foodAmount || '',
    dewormType: data.dewormType || '',
    vaccineType: data.vaccineType || '',
    medicationType: data.medicationType || '',
    dosage: data.dosage || '',
    hospitalName: data.hospitalName || '',
    notes: data.notes || '',
    hour: data.hour !== undefined ? data.hour : 12,
    // 发情专用字段
    heatStage: data.heatStage || '',
    createdAt: new Date()
  };

  const res = await db.collection('records').add({ data: recordData });

  // 体重记录：检查是否是最新日期，若是则同步更新宠物基本信息中的体重
  if (data.type === 'weight' && data.weight) {
    try {
      const recordDate = new Date(data.date);
      // 查询该宠物是否存在比此次更晚的体重记录
      const newerRes = await db.collection('records')
        .where({ petId: data.petId, type: 'weight', date: _.gt(recordDate) })
        .limit(1)
        .get();

      if (newerRes.data.length === 0) {
        // 是最新日期，更新宠物档案中的当前体重和历史记录
        const newWeight = Number(data.weight);
        await db.collection('pets').doc(data.petId).update({
          data: {
            weight: newWeight,
            weightHistory: _.push([{ date: recordDate, weight: newWeight }]),
            updatedAt: new Date()
          }
        });
      }
    } catch (e) {
      // 体重同步失败不影响记录写入结果
    }
  }

  return { code: 0, message: '添加成功', data: { _id: res._id } };
}

// 更新记录（支持家庭成员操作）
async function updateRecord(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少记录ID' };
  }

  // 验证用户是否是该宠物的成员
  const { data: record } = await db.collection('records').doc(data._id).get();
  if (!record) {
    return { code: -1, message: '记录不存在' };
  }

  const memberRes = await db.collection('pet_members')
    .where({ petId: record.petId, _openid: openid })
    .limit(1)
    .get();

  if (memberRes.data.length === 0) {
    return { code: -1, message: '无权操作' };
  }

  const role = memberRes.data[0].role || 'member';
  if (role !== 'creator' && role !== 'admin') {
    return { code: -1, message: '无权限请联系宠物主' };
  }

  const updateData = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.cost !== undefined) updateData.cost = Number(data.cost);
  if (data.nextDate !== undefined) updateData.nextDate = data.nextDate ? new Date(data.nextDate) : null;
  if (data.enableRemind !== undefined) updateData.enableRemind = data.enableRemind;
  if (data.remindInterval !== undefined) updateData.remindInterval = data.remindInterval;
  if (data.remindAdvance !== undefined) updateData.remindAdvance = data.remindAdvance;
  if (data.remindTime !== undefined) updateData.remindTime = data.remindTime;
  if (data.remindSendAt !== undefined) {
    updateData.remindSendAt = data.remindSendAt ? new Date(data.remindSendAt) : null;
    // remindSendAt 变更时重置已发送标记，确保新时间点能正常推送
    updateData.remindSentAt = null;
  }
  if (data.images !== undefined) updateData.images = data.images;
  // 类型特定字段
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.weightUnit !== undefined) updateData.weightUnit = data.weightUnit;
  if (data.poopStatus !== undefined) updateData.poopStatus = data.poopStatus;
  if (data.abnormalDesc !== undefined) updateData.abnormalDesc = data.abnormalDesc;
  if (data.waterAmount !== undefined) updateData.waterAmount = data.waterAmount;
  if (data.waterUnit !== undefined) updateData.waterUnit = data.waterUnit;
  if (data.foodType !== undefined) updateData.foodType = data.foodType;
  if (data.foodAmount !== undefined) updateData.foodAmount = data.foodAmount;
  if (data.dewormType !== undefined) updateData.dewormType = data.dewormType;
  if (data.vaccineType !== undefined) updateData.vaccineType = data.vaccineType;
  if (data.medicationType !== undefined) updateData.medicationType = data.medicationType;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.hour !== undefined) updateData.hour = data.hour;
  // 发情专用字段
  if (data.heatStage !== undefined) updateData.heatStage = data.heatStage;

  await db.collection('records').doc(data._id).update({ data: updateData });
  return { code: 0, message: '更新成功' };
}

// 获取记录详情（支持家庭成员查看）
async function getRecord(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少记录ID' };
  }

  // 验证用户是否是该宠物的成员
  const { data: record } = await db.collection('records').doc(data._id).get();
  if (!record) {
    return { code: -1, message: '记录不存在' };
  }

  const memberRes = await db.collection('pet_members')
    .where({ petId: record.petId, _openid: openid })
    .limit(1)
    .get();

  if (memberRes.data.length === 0) {
    return { code: -1, message: '无权访问' };
  }

  return { code: 0, data: record };
}

// 获取记录列表（支持家庭成员查看）
async function listRecords(openid, data) {
  if (!data || !data.petId) {
    return { code: -1, message: '缺少宠物ID' };
  }

  // 验证用户是否是该宠物的成员
  const memberRes = await db.collection('pet_members')
    .where({ petId: data.petId, _openid: openid })
    .limit(1)
    .get();

  if (memberRes.data.length === 0) {
    return { code: -1, message: '无权访问' };
  }

  // 成员可以查看该宠物的所有记录
  const where = { petId: data.petId };

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

  // 验证用户是否是该宠物的成员
  const { data: record } = await db.collection('records').doc(data._id).get();
  if (!record) {
    return { code: -1, message: '记录不存在' };
  }

  const memberRes = await db.collection('pet_members')
    .where({ petId: record.petId, _openid: openid })
    .limit(1)
    .get();

  if (memberRes.data.length === 0) {
    return { code: -1, message: '无权操作' };
  }

  const role = memberRes.data[0].role || 'member';
  if (role !== 'creator' && role !== 'admin') {
    return { code: -1, message: '无权限请联系宠物主' };
  }

  await db.collection('records').doc(data._id).remove();
  return { code: 0, message: '删除成功' };
}