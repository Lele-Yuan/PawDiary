const r = require('../../_shared/runtime');
const { activityId, entry, money, unit } = require('./_split');
module.exports = r.handler(async p => {
  const id = activityId(p);
  const detail = await r.call('splitManage', 'getActivity', { _id: id });
  const stats = await r.call('splitManage', 'getStats', { activityId: id });
  const members = r.array(detail.members).map(m => r.pick(m, ['_id', 'nickName', 'role', 'removed']));
  return r.success('已查询活动概况。所有金额单位为分，显示人民币元时除以 100。成员应分摊金额不等于尚欠金额，付款状态请查询已有结算。', {
    activity: r.pick(detail.activity, ['_id', 'name', 'status']), myRole: detail.myRole, members,
    total: money(stats.total), average: money(stats.avg), billCount: stats.billCount, memberCount: stats.memberCount,
    categories: r.array(stats.categoryStats).map(c => ({ category: c.category, amount: money(c.amount), percent: c.percent })),
    memberShares: r.array(stats.memberStats).map(m => ({ nickName: m.nickName, amount: money(m.owe), removed: !!m.removed })),
    ...unit, ...entry(id)
  });
});
