// record-skill/index.js
// 宠物日常记录 SKILL 接口实现

const skill = require('skill');

if (!wx.cloud.__inited) {
  wx.cloud.init({ env: wx.cloud.DYNAMIC_CURRENT_ENV });
  wx.cloud.__inited = true;
}

/**
 * 解析 petId：
 * - 若传入 petName：拉取用户名下所有宠物按 name 精确匹配
 *     命中 → 返回 petId
 *     未命中 → 抛出业务错误对象
 * - 若未传 petName：使用 currentPetId → 首只宠物兜底；都没有则报错
 */
async function resolvePetId(petName) {
  // 拉一次宠物列表
  const listRes = await wx.cloud.callFunction({
    name: 'petManage',
    data: { action: 'list', data: {} }
  });
  const pets = (listRes.result && listRes.result.data) || [];

  if (petName && String(petName).trim()) {
    const target = String(petName).trim().toLowerCase();
    const hit = pets.find(p => (p.name || '').trim().toLowerCase() === target);
    if (!hit) {
      const err = new Error(`对不起没找到宠物 ${petName}，请核实是否已添加 ${petName}`);
      err.__skillBiz = true;
      throw err;
    }
    return { petId: hit._id, petName: hit.name };
  }

  // 未传 petName：currentPetId 兜底
  let currentPetId = '';
  try { currentPetId = wx.getStorageSync('currentPetId') || ''; } catch (e) {}
  if (currentPetId) {
    const cur = pets.find(p => p._id === currentPetId);
    if (cur) return { petId: cur._id, petName: cur.name };
  }
  if (pets.length > 0) {
    return { petId: pets[0]._id, petName: pets[0].name };
  }
  const err = new Error('请先在首页添加并选择宠物');
  err.__skillBiz = true;
  throw err;
}

function bizError(message) {
  return { isError: true, message };
}

// ---- 接口实现 ----

async function addRecord(params) {
  try {
    const { petName, ...rest } = params || {};
    const { petId, petName: resolvedName } = await resolvePetId(petName);

    const data = {
      petId,
      type: rest.type,
      title: rest.title,
      date: rest.date || new Date().toISOString(),
      description: rest.description || '',
      cost: rest.cost || 0,
      weight: rest.weight,
      weightUnit: rest.weightUnit || 'kg',
      waterAmount: rest.waterAmount,
      waterUnit: rest.waterUnit || 'ml',
      foodType: rest.foodType,
      foodAmount: rest.foodAmount,
      dewormType: rest.dewormType,
      vaccineType: rest.vaccineType,
      hospitalName: rest.hospitalName
    };

    const res = await wx.cloud.callFunction({
      name: 'recordManage',
      data: { action: 'add', data }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizError(r.message || '添加失败');

    return {
      isError: false,
      card: 'record-card',
      data: {
        _id: r.data && r.data._id,
        petName: resolvedName,
        type: data.type,
        title: data.title,
        date: data.date,
        weight: data.weight,
        weightUnit: data.weightUnit,
        cost: data.cost,
        description: data.description
      }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizError(e.message);
    return bizError('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

async function listRecords(params) {
  try {
    const { petName, type, startDate, endDate, limit } = params || {};
    const { petId, petName: resolvedName } = await resolvePetId(petName);

    const res = await wx.cloud.callFunction({
      name: 'recordManage',
      data: {
        action: 'list',
        data: {
          petId,
          type: type || 'all',
          startDate,
          endDate,
          limit: limit || 20
        }
      }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizError(r.message || '查询失败');

    const records = (r.data || []).slice(0, 5).map(rec => ({
      _id: rec._id,
      type: rec.type,
      title: rec.title,
      date: rec.date,
      weight: rec.weight,
      weightUnit: rec.weightUnit,
      cost: rec.cost
    }));

    return {
      isError: false,
      card: 'record-list-card',
      data: {
        petName: resolvedName,
        type: type || 'all',
        total: (r.data || []).length,
        records
      }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizError(e.message);
    return bizError('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

async function deleteRecord(params) {
  try {
    const { recordId } = params || {};
    if (!recordId) return bizError('缺少 recordId');
    const res = await wx.cloud.callFunction({
      name: 'recordManage',
      data: { action: 'delete', data: { _id: recordId } }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizError(r.message || '删除失败');
    return {
      isError: false,
      card: 'record-card',
      data: { _id: recordId, deleted: true, title: '已删除该记录' }
    };
  } catch (e) {
    return bizError('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

skill.use('addRecord', addRecord);
skill.use('listRecords', listRecords);
skill.use('deleteRecord', deleteRecord);
