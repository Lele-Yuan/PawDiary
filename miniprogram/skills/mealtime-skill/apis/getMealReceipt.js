const r = require('../../_shared/runtime');
const { dish } = require('./_meal');
module.exports = r.handler(async p => {
  const mealId = r.text(p.mealId, 'mealId', true);
  const data = await r.call('mealManage', 'meal.receipt', { mealId });
  if (data.mealId !== mealId) throw new Error('小票返回的约饭不匹配，请重新选择。');
  return r.success('已查询约饭小票，耗时单位为分钟。小票是点菜汇总，不是支付凭证；可打开小票页面核实。', { ...r.pick(data, ['mealId', 'familyName', 'seq', 'status', 'dishCount', 'pickTotal', 'totalDuration', 'memberCount', 'orderedAt', 'finishedAt']), dishes: r.array(data.dishes).map(dish), durationUnit: 'minute', title: '查看约饭小票', pagePath: r.page('pages/mealtime/receipt/receipt', { mealId }) });
});
