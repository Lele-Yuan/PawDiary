const r = require('../../_shared/runtime');
const { activityId, entry, money, unit } = require('./_split');
module.exports = r.handler(async p => {
  const id = activityId(p), limit = r.limit(p.limit);
  const rows = r.array(await r.call('splitManage', 'listBills', { activityId: id, limit: limit + 1 }));
  const bills = rows.slice(0, limit).map(b => ({ ...r.pick(b, ['_id', 'title', 'category', 'billDate']), amount: money(b.amount) }));
  return r.success(bills.length ? `返回 ${bills.length} 笔活动账单，金额单位为分。列表不能代替活动总额；总额请查询活动概况。` : '暂无活动账单，可打开活动页面添加。', { bills, hasMore: rows.length > limit, ...unit, ...entry(id) });
});
