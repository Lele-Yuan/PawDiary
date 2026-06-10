// bill-skill/index.js
const skill = require('skill');

if (!wx.cloud.__inited) {
  wx.cloud.init({ env: wx.cloud.DYNAMIC_CURRENT_ENV });
  wx.cloud.__inited = true;
}

async function resolvePetId(petName) {
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

  let currentPetId = '';
  try { currentPetId = wx.getStorageSync('currentPetId') || ''; } catch (e) {}
  if (currentPetId) {
    const cur = pets.find(p => p._id === currentPetId);
    if (cur) return { petId: cur._id, petName: cur.name };
  }
  if (pets.length > 0) return { petId: pets[0]._id, petName: pets[0].name };

  const err = new Error('请先在首页添加并选择宠物');
  err.__skillBiz = true;
  throw err;
}

function bizError(message) { return { isError: true, message }; }

async function addBill(params) {
  try {
    const { petName, amount, category, title, date, note } = params || {};
    if (!amount || !category || !title) return bizError('金额、分类、标题均为必填');
    const { petId, petName: resolvedName } = await resolvePetId(petName);
    const res = await wx.cloud.callFunction({
      name: 'billManage',
      data: {
        action: 'add',
        data: { petId, amount: Number(amount), category, title, date: date || new Date().toISOString(), note: note || '' }
      }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizError(r.message || '添加失败');
    return {
      isError: false,
      card: 'bill-card',
      data: {
        _id: r.data && r.data._id,
        petName: resolvedName,
        amount: Number(amount),
        category, title,
        date: date || new Date().toISOString(),
        note: note || ''
      }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizError(e.message);
    return bizError('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

async function listBills(params) {
  try {
    const { petName, year, month, limit } = params || {};
    const { petId, petName: resolvedName } = await resolvePetId(petName);
    const res = await wx.cloud.callFunction({
      name: 'billManage',
      data: { action: 'list', data: { petId, year, month, limit: limit || 20 } }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizError(r.message || '查询失败');
    const bills = (r.data || []).slice(0, 5).map(b => ({
      _id: b._id, amount: b.amount, category: b.category, title: b.title, date: b.date
    }));
    return {
      isError: false,
      card: 'bill-list-card',
      data: { petName: resolvedName, year, month, total: (r.data || []).length, bills }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizError(e.message);
    return bizError('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

async function getMonthlyStats(params) {
  try {
    const { petName, year, month, trend } = params || {};
    const { petId, petName: resolvedName } = await resolvePetId(petName);
    const now = new Date();
    const y = year || now.getFullYear();
    const m = month || (now.getMonth() + 1);
    const res = await wx.cloud.callFunction({
      name: 'billManage',
      data: { action: 'stats', data: { petId, year: y, month: m, trend: !!trend } }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizError(r.message || '查询失败');
    return {
      isError: false,
      card: 'bill-stats-card',
      data: {
        petName: resolvedName,
        year: y,
        month: m,
        monthTotal: (r.data && r.data.monthTotal) || 0,
        lastMonthTotal: (r.data && r.data.lastMonthTotal) || 0,
        categoryStats: (r.data && r.data.categoryStats) || [],
        trends: (r.data && r.data.trends) || []
      }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizError(e.message);
    return bizError('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

skill.use('addBill', addBill);
skill.use('listBills', listBills);
skill.use('getMonthlyStats', getMonthlyStats);
