const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'add':
      return await addBill(OPENID, data);
    case 'list':
      return await listBills(OPENID, data);
    case 'stats':
      return await getStats(OPENID, data);
    case 'delete':
      return await deleteBill(OPENID, data);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

// 添加账单
async function addBill(openid, data) {
  if (!data || !data.petId || !data.amount || !data.category || !data.title || !data.date) {
    return { code: -1, message: '宠物ID、金额、分类、描述和日期为必填项' };
  }

  const validCategories = ['food', 'medical', 'toy', 'grooming', 'daily', 'other'];
  if (!validCategories.includes(data.category)) {
    return { code: -1, message: '无效的消费分类' };
  }

  const billData = {
    _openid: openid,
    petId: data.petId,
    amount: Number(data.amount),
    category: data.category,
    title: data.title,
    date: new Date(data.date),
    note: data.note || '',
    createdAt: new Date()
  };

  const res = await db.collection('bills').add({ data: billData });
  return { code: 0, message: '添加成功', data: { _id: res._id } };
}

// 获取账单列表（按月份）
async function listBills(openid, data) {
  if (!data || !data.petId) {
    return { code: -1, message: '缺少宠物ID' };
  }

  const where = {
    _openid: openid,
    petId: data.petId
  };

  // 按月份筛选
  if (data.year && data.month) {
    const startDate = new Date(data.year, data.month - 1, 1);
    const endDate = new Date(data.year, data.month, 1);
    where.date = _.gte(startDate).and(_.lt(endDate));
  }

  const limit = data.limit || 100;
  const skip = data.skip || 0;

  const { data: bills } = await db.collection('bills')
    .where(where)
    .orderBy('date', 'desc')
    .skip(skip)
    .limit(limit)
    .get();

  return { code: 0, data: bills };
}

// 统计数据
async function getStats(openid, data) {
  if (!data || !data.petId) {
    return { code: -1, message: '缺少宠物ID' };
  }

  const result = {};

  // 当前月份统计
  if (data.year && data.month) {
    const startDate = new Date(data.year, data.month - 1, 1);
    const endDate = new Date(data.year, data.month, 1);

    const { data: bills } = await db.collection('bills')
      .where({
        _openid: openid,
        petId: data.petId,
        date: _.gte(startDate).and(_.lt(endDate))
      })
      .get();

    // 总额
    result.monthTotal = bills.reduce((sum, b) => sum + b.amount, 0);

    // 分类统计
    const categoryMap = {};
    bills.forEach(b => {
      categoryMap[b.category] = (categoryMap[b.category] || 0) + b.amount;
    });
    result.categoryStats = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: result.monthTotal > 0 ? Math.round(amount / result.monthTotal * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // 上个月数据
    const prevMonth = data.month === 1 ? 12 : data.month - 1;
    const prevYear = data.month === 1 ? data.year - 1 : data.year;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 1);

    const { data: prevBills } = await db.collection('bills')
      .where({
        _openid: openid,
        petId: data.petId,
        date: _.gte(prevStartDate).and(_.lt(prevEndDate))
      })
      .get();

    result.lastMonthTotal = prevBills.reduce((sum, b) => sum + b.amount, 0);
  }

  // 近6个月趋势
  if (data.trend) {
    const trends = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      let m = now.getMonth() + 1 - i;
      let y = now.getFullYear();
      if (m <= 0) { m += 12; y--; }

      const mStart = new Date(y, m - 1, 1);
      const mEnd = new Date(y, m, 1);

      const { data: mBills } = await db.collection('bills')
        .where({
          _openid: openid,
          petId: data.petId,
          date: _.gte(mStart).and(_.lt(mEnd))
        })
        .get();

      trends.push({
        year: y,
        month: m,
        label: `${m}月`,
        total: mBills.reduce((sum, b) => sum + b.amount, 0)
      });
    }
    result.trends = trends;
  }

  return { code: 0, data: result };
}

// 删除账单
async function deleteBill(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少账单ID' };
  }

  await db.collection('bills').doc(data._id).remove();
  return { code: 0, message: '删除成功' };
}