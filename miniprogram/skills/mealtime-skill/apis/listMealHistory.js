const r = require('../../_shared/runtime');
const { familyId, entry } = require('./_meal');
module.exports = r.handler(async p => {
  const id = familyId(p), limit = r.limit(p.limit);
  const data = await r.call('mealManage', 'meal.history', { familyId: id });
  const rows = r.array(data.list);
  const meals = rows.slice(0, limit).map(m => ({ ...r.pick(m, ['mealId', 'seq', 'dishCount', 'pickTotal', 'totalDuration', 'memberCount', 'finishedAt', 'createdAt']), title: `第 ${m.seq} 次约饭小票`, pagePath: r.page('pages/mealtime/receipt/receipt', { mealId: m.mealId }) }));
  return r.success(meals.length ? `返回 ${meals.length} 次已完成约饭。后端最多查询最近 50 次，可选择 mealId 查看小票。` : '暂无已完成约饭，可查询当前约饭。', { familyId: id, meals, hasMore: rows.length > limit, sourceMayBeTruncated: rows.length >= 50, durationUnit: 'minute', ...entry(id) });
});
