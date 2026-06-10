// reminder-skill/index.js
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

function daysDiff(target) {
  const t = new Date(target).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((t - today.getTime()) / 86400000);
  return diff;
}

function diffLabel(diff) {
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff > 1) return `${diff} 天后`;
  return `已过期 ${-diff} 天`;
}

async function queryReminders(petId, { withinDays = 30, type } = {}) {
  const db = wx.cloud.database();
  const _ = db.command;
  const now = new Date();
  const start = new Date(now.getTime() - 365 * 86400000); // 含已过期一年内
  const end = new Date(now.getTime() + (withinDays || 30) * 86400000);

  const where = {
    petId,
    enableRemind: true,
    nextDate: _.gte(start).and(_.lte(end))
  };
  if (type) where.type = type;

  const { data } = await db.collection('records')
    .where(where)
    .orderBy('nextDate', 'asc')
    .limit(20)
    .get();
  return data || [];
}

async function listUpcomingReminders(params) {
  try {
    const { petName, withinDays, type } = params || {};
    const { petId, petName: resolvedName } = await resolvePetId(petName);
    const records = await queryReminders(petId, { withinDays, type });
    const reminders = records.map(r => {
      const d = daysDiff(r.nextDate);
      return {
        _id: r._id,
        type: r.type,
        title: r.title,
        nextDate: r.nextDate,
        daysDiff: d,
        diffLabel: diffLabel(d)
      };
    });
    return {
      isError: false,
      card: 'reminder-list-card',
      data: { petName: resolvedName, total: reminders.length, reminders }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizError(e.message);
    return bizError('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

async function getNextReminderByType(params) {
  try {
    const { petName, type } = params || {};
    if (!type) return bizError('缺少 type');
    const { petId, petName: resolvedName } = await resolvePetId(petName);
    const records = await queryReminders(petId, { withinDays: 365, type });
    const next = records.length > 0 ? records[0] : null;
    if (!next) {
      return {
        isError: false,
        card: 'reminder-list-card',
        data: { petName: resolvedName, type, total: 0, reminders: [] }
      };
    }
    const d = daysDiff(next.nextDate);
    return {
      isError: false,
      card: 'reminder-list-card',
      data: {
        petName: resolvedName,
        type,
        total: 1,
        reminders: [{
          _id: next._id,
          type: next.type,
          title: next.title,
          nextDate: next.nextDate,
          daysDiff: d,
          diffLabel: diffLabel(d)
        }]
      }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizError(e.message);
    return bizError('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

skill.use('listUpcomingReminders', listUpcomingReminders);
skill.use('getNextReminderByType', getNextReminderByType);
