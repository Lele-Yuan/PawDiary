const { resolvePet, bizErrorResult } = require('./_resolvePet');

const CATEGORY_NAME_MAP = { food: '食物', medical: '医疗', toy: '玩具', grooming: '美容', daily: '日用', other: '其他' };

async function addBill(params) {
  try {
    const { petName, amount, category, title, date, note } = params || {};
    if (amount === undefined || amount === null || isNaN(Number(amount))) return bizErrorResult('缺少必填参数 amount');
    if (!category) return bizErrorResult('缺少必填参数 category');
    if (!title) return bizErrorResult('缺少必填参数 title');

    const { petId, petName: resolvedName } = await resolvePet(petName);
    const data = {
      petId,
      amount: Number(amount),
      category,
      title,
      date: date || new Date().toISOString(),
      note: note || ''
    };

    const res = await wx.cloud.callFunction({
      name: 'billManage',
      data: { action: 'add', data }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizErrorResult(r.message || '添加失败');

    const cat = CATEGORY_NAME_MAP[category] || category;
    const text = `已为 ${resolvedName} 记一笔${cat}：${title} ¥${data.amount}`;

    return {
      isError: false,
      content: [{ type: 'text', text }],
      structuredContent: {
        _id: r.data && r.data._id,
        petName: resolvedName,
        amount: data.amount,
        category,
        categoryName: cat,
        title,
        date: data.date,
        note: data.note
      }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizErrorResult(e.message);
    return bizErrorResult('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

module.exports = addBill;
