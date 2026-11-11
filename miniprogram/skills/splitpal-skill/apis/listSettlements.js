const r = require('../../_shared/runtime');
const { activityId, entry, money, unit } = require('./_split');
module.exports = r.handler(async p => {
  const id = activityId(p);
  const detail = await r.call('splitManage', 'getActivity', { _id: id });
  const names = {};
  r.array(detail.members).forEach(m => { names[m.openid] = m.nickName || '未命名成员'; });
  const data = await r.call('splitManage', 'listSettlements', { activityId: id });
  const settlements = r.array(data.settlements).map(s => ({ ...r.pick(s, ['_id', 'status', 'paidAt']), fromName: names[s.fromOpenid] || '未知成员', toName: names[s.toOpenid] || '未知成员', amount: money(s.amount) }));
  return r.success(settlements.length ? '已查询保存的结算记录，金额单位为分。记录状态不代表银行到账，请在活动页面核实。' : '暂无保存的结算记录，不代表没有欠款。请打开活动页面生成结算。', { settlements, total: data.total, paid: data.paid, ...unit, ...entry(id) });
});
