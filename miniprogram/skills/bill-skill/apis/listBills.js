const { resolvePet, bizErrorResult } = require('./_resolvePet');

const CATEGORY_NAME_MAP = { food: '食物', medical: '医疗', toy: '玩具', grooming: '美容', daily: '日用', other: '其他' };

async function listBills(params) {
  try {
    const { petName, year, month, limit } = params || {};
    const { petId, petName: resolvedName } = await resolvePet(petName);

    const res = await wx.cloud.callFunction({
      name: 'billManage',
      data: { action: 'list', data: { petId, year, month, limit: limit || 20 } }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizErrorResult(r.message || '查询失败');

    const all = r.data || [];
    const bills = all.slice(0, 5).map(b => ({
      _id: b._id,
      amount: b.amount,
      category: b.category,
      categoryName: CATEGORY_NAME_MAP[b.category] || b.category,
      title: b.title,
      date: b.date
    }));

    const monthText = (year && month) ? `${year}/${month}` : '近期';
    const text = all.length === 0
      ? `${resolvedName} 在${monthText}暂无账单`
      : `查询到 ${resolvedName} 在${monthText}的账单共 ${all.length} 条`;

    return {
      isError: false,
      content: [{ type: 'text', text }],
      structuredContent: { petName: resolvedName, year, month, total: all.length, bills }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizErrorResult(e.message);
    return bizErrorResult('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

module.exports = listBills;
