const TYPE_TEXT_MAP = {
  weight: '体重', diet: '饮食', water: '饮水',
  deworm: '驱虫', vaccine: '疫苗', checkup: '体检', illness: '生病',
  bath: '洗澡', nail: '剪指甲', ear: '清耳', paw: '修毛', gland: '挤腺', teeth: '刷牙', beauty: '美容',
  disinfect: '消毒', litter: '换砂', toy: '换玩具', cage: '清笼'
};

function daysDiff(target) {
  const t = new Date(target).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / 86400000);
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
  const start = new Date(now.getTime() - 365 * 86400000);
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

function mapReminder(r) {
  const d = daysDiff(r.nextDate);
  return {
    _id: r._id,
    type: r.type,
    typeText: TYPE_TEXT_MAP[r.type] || r.type,
    title: r.title,
    nextDate: r.nextDate,
    daysDiff: d,
    diffLabel: diffLabel(d)
  };
}

module.exports = { queryReminders, mapReminder, daysDiff, diffLabel, TYPE_TEXT_MAP };
