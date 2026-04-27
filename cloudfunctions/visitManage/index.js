var cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
var db = cloud.database();
var _ = db.command;

exports.main = async function (event, context) {
  var OPENID = cloud.getWXContext().OPENID;
  var action = event.action;
  var data = event.data || {};

  switch (action) {
    case 'add':
      return await addRecord(OPENID, data);
    case 'list':
      return await listRecords(OPENID, data);
    case 'get':
      return await getRecord(OPENID, data);
    case 'update':
      return await updateRecord(OPENID, data);
    case 'confirm':
      return await confirmRecord(OPENID, data);
    case 'checkin':
      return await checkinRecord(OPENID, data);
    case 'confirmVisit':
      return await confirmVisitRecord(OPENID, data);
    case 'delete':
      return await deleteRecord(OPENID, data);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

/**
 * 新建上门沟通记录
 */
async function addRecord(OPENID, data) {
  try {
    var creatorRole = data.creatorRole; // 'owner' | 'helper'
    if (!creatorRole) {
      return { code: -1, message: '请选择您的角色' };
    }

    var now = db.serverDate();
    var record = {
      _openid: OPENID,
      creatorRole: creatorRole,
      ownerOpenid: creatorRole === 'owner' ? OPENID : null,
      helperOpenid: creatorRole === 'helper' ? OPENID : null,
      ownerNickname: data.ownerNickname || '',
      helperNickname: data.helperNickname || '',
      serviceName: data.serviceName || '上门喂猫',
      visitTimes: data.visitTimes || [],
      location: data.location || { address: '', latitude: 0, longitude: 0 },
      pets: data.pets || [],
      message: data.message || '',
      ownerNote: data.ownerNote || '',
      helperNote: data.helperNote || '',
      ownerConfirmed: false,
      helperConfirmed: false,
      checkinCount: 0,
      ownerConfirmCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    var res = await db.collection('visit_records').add({ data: record });
    return { code: 0, data: { _id: res._id } };
  } catch (e) {
    return { code: -1, message: '创建失败：' + e.message };
  }
}

/**
 * 查询我参与的记录（作为 owner 或 helper）
 */
async function listRecords(OPENID, data) {
  try {
    var res = await db.collection('visit_records')
      .where(_.or([
        { ownerOpenid: OPENID },
        { helperOpenid: OPENID }
      ]))
      .where({ status: _.neq('archived') })
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get();

    return { code: 0, data: { list: res.data } };
  } catch (e) {
    return { code: -1, message: '查询失败：' + e.message };
  }
}

/**
 * 获取单条记录，处理权限和自动绑定
 */
async function getRecord(OPENID, data) {
  try {
    var recordId = data.recordId;
    if (!recordId) {
      return { code: -1, message: '缺少记录ID' };
    }

    var res = await db.collection('visit_records').doc(recordId).get();
    var record = res.data;

    var isOwner = record.ownerOpenid === OPENID;
    var isHelper = record.helperOpenid === OPENID;
    var ownerEmpty = !record.ownerOpenid;
    var helperEmpty = !record.helperOpenid;

    // 双方均已绑定，校验权限
    if (!ownerEmpty && !helperEmpty) {
      if (!isOwner && !isHelper) {
        return { code: -2, message: 'NO_PERMISSION' };
      }
    } else {
      // 有空缺 openid，自动绑定当前用户到空缺角色
      if (!isOwner && !isHelper) {
        if (ownerEmpty) {
          await db.collection('visit_records').doc(recordId).update({
            data: { ownerOpenid: OPENID, updatedAt: db.serverDate() }
          });
          record.ownerOpenid = OPENID;
          isOwner = true;
        } else if (helperEmpty) {
          await db.collection('visit_records').doc(recordId).update({
            data: { helperOpenid: OPENID, updatedAt: db.serverDate() }
          });
          record.helperOpenid = OPENID;
          isHelper = true;
        }
      }
    }

    // 按身份过滤私密备注
    var myRole = isOwner ? 'owner' : 'helper';
    if (isOwner) {
      delete record.helperNote;
    } else {
      delete record.ownerNote;
    }

    return { code: 0, data: { record, myRole } };
  } catch (e) {
    if (e.errCode === -502001 || (e.message && e.message.includes('not exist'))) {
      return { code: -1, message: '记录不存在' };
    }
    return { code: -1, message: '获取失败：' + e.message };
  }
}

/**
 * 更新表单内容（双方可操作，仅 pending/preparing 状态）
 */
async function updateRecord(OPENID, data) {
  var recordId = data.recordId;
  if (!recordId) return { code: -1, message: '缺少记录ID' };

  var record;
  try {
    var res = await db.collection('visit_records').doc(recordId).get();
    record = res.data;
  } catch (e) {
    return { code: -1, message: '记录不存在' };
  }

  var isOwner = record.ownerOpenid === OPENID;
  var isHelper = record.helperOpenid === OPENID;
  if (!isOwner && !isHelper) {
    return { code: -2, message: 'NO_PERMISSION' };
  }
  if (record.status !== 'pending' && record.status !== 'preparing') {
    return { code: -1, message: '当前状态不可编辑' };
  }

  try {
    var updateData = { updatedAt: db.serverDate() };
    var allowed = ['ownerNickname', 'helperNickname', 'serviceName', 'visitTimes', 'location', 'pets', 'message'];
    allowed.forEach(function (key) {
      if (data[key] !== undefined) updateData[key] = data[key];
    });
    // 私密备注仅本人可更新
    if (isOwner && data.ownerNote !== undefined) updateData.ownerNote = data.ownerNote;
    if (isHelper && data.helperNote !== undefined) updateData.helperNote = data.helperNote;

    await db.collection('visit_records').doc(recordId).update({ data: updateData });
    return { code: 0, message: '保存成功' };
  } catch (e) {
    return { code: -1, message: '保存失败：' + e.message };
  }
}

/**
 * 确认信息（双方分别确认，均确认后 status → preparing）
 */
async function confirmRecord(OPENID, data) {
  var recordId = data.recordId;
  if (!recordId) return { code: -1, message: '缺少记录ID' };

  var record;
  try {
    var res = await db.collection('visit_records').doc(recordId).get();
    record = res.data;
  } catch (e) {
    return { code: -1, message: '记录不存在' };
  }

  var isOwner = record.ownerOpenid === OPENID;
  var isHelper = record.helperOpenid === OPENID;
  if (!isOwner && !isHelper) {
    return { code: -2, message: 'NO_PERMISSION' };
  }
  if (record.status !== 'pending') {
    return { code: -1, message: '当前状态无法确认' };
  }

  try {
    var updateData = { updatedAt: db.serverDate() };
    if (isOwner) updateData.ownerConfirmed = true;
    if (isHelper) updateData.helperConfirmed = true;

    // 判断确认后双方是否都已确认
    var ownerConfirmed = isOwner ? true : record.ownerConfirmed;
    var helperConfirmed = isHelper ? true : record.helperConfirmed;
    if (ownerConfirmed && helperConfirmed) {
      updateData.status = 'preparing';
    }

    await db.collection('visit_records').doc(recordId).update({ data: updateData });
    return { code: 0, data: { status: updateData.status || record.status } };
  } catch (e) {
    return { code: -1, message: '确认失败：' + e.message };
  }
}

/**
 * 临时主上门（分步）
 * - preparing 状态：第一次上门，status → serving
 * - serving 状态：上一次已被铲屎官确认（checkinCount === ownerConfirmCount）才可再次上门
 */
async function checkinRecord(OPENID, data) {
  var recordId = data.recordId;
  if (!recordId) return { code: -1, message: '缺少记录ID' };

  var record;
  try {
    var res = await db.collection('visit_records').doc(recordId).get();
    record = res.data;
  } catch (e) {
    return { code: -1, message: '记录不存在' };
  }

  if (record.helperOpenid !== OPENID) {
    return { code: -2, message: '仅临时主可操作' };
  }

  var checkinCount = record.checkinCount || 0;
  var ownerConfirmCount = record.ownerConfirmCount || 0;
  var total = (record.visitTimes || []).length || 1;

  var canCheckin = record.status === 'preparing' ||
    (record.status === 'serving' && checkinCount === ownerConfirmCount && checkinCount < total);

  if (!canCheckin) {
    if (checkinCount > ownerConfirmCount) {
      return { code: -1, message: '请等待铲屎官确认第 ' + (ownerConfirmCount + 1) + ' 次上门' };
    }
    return { code: -1, message: '当前状态无法上门' };
  }

  var newCount = checkinCount + 1;

  try {
    await db.collection('visit_records').doc(recordId).update({
      data: { checkinCount: newCount, status: 'serving', updatedAt: db.serverDate() }
    });
    return { code: 0, data: { checkinCount: newCount, status: 'serving' } };
  } catch (e) {
    return { code: -1, message: '操作失败：' + e.message };
  }
}

/**
 * 铲屎官逐次确认上门（每确认一次完成一次上门任务，全部完成后 status → completed）
 */
async function confirmVisitRecord(OPENID, data) {
  var recordId = data.recordId;
  if (!recordId) return { code: -1, message: '缺少记录ID' };

  var record;
  try {
    var res = await db.collection('visit_records').doc(recordId).get();
    record = res.data;
  } catch (e) {
    return { code: -1, message: '记录不存在' };
  }

  if (record.ownerOpenid !== OPENID) {
    return { code: -2, message: '仅铲屎官可操作' };
  }
  if (record.status !== 'serving') {
    return { code: -1, message: '当前状态无法确认' };
  }

  var checkinCount = record.checkinCount || 0;
  var ownerConfirmCount = record.ownerConfirmCount || 0;
  var total = (record.visitTimes || []).length || 1;

  if (ownerConfirmCount >= checkinCount) {
    return { code: -1, message: '暂无待确认的上门记录' };
  }

  var newConfirmCount = ownerConfirmCount + 1;
  var newStatus = newConfirmCount >= total ? 'completed' : 'serving';

  try {
    await db.collection('visit_records').doc(recordId).update({
      data: { ownerConfirmCount: newConfirmCount, status: newStatus, updatedAt: db.serverDate() }
    });
    return { code: 0, data: { ownerConfirmCount: newConfirmCount, status: newStatus } };
  } catch (e) {
    return { code: -1, message: '操作失败：' + e.message };
  }
}

/**
 * 废弃记录（仅创建者，pending/preparing 状态）
 */
async function deleteRecord(OPENID, data) {
  var recordId = data.recordId;
  if (!recordId) return { code: -1, message: '缺少记录ID' };

  var record;
  try {
    var res = await db.collection('visit_records').doc(recordId).get();
    record = res.data;
  } catch (e) {
    return { code: -1, message: '记录不存在' };
  }

  if (record._openid !== OPENID) {
    return { code: -2, message: '仅创建者可废弃' };
  }
  if (record.status !== 'pending' && record.status !== 'preparing') {
    return { code: -1, message: '服务中或已完成的记录无法废弃' };
  }

  try {
    await db.collection('visit_records').doc(recordId).update({
      data: { status: 'archived', updatedAt: db.serverDate() }
    });
    return { code: 0, message: '已废弃' };
  } catch (e) {
    return { code: -1, message: '操作失败：' + e.message };
  }
}
