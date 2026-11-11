const r = require('../../_shared/runtime');
const { entry, unit, money } = require('./_split');
module.exports = r.handler(async () => {
  const data = await r.call('splitManage', 'listActivities');
  const active = r.array(data.active), settled = r.array(data.settled);
  const activities = active.concat(settled).map(a => ({ ...r.pick(a, ['_id', 'name', 'status']), ...entry(a._id) }));
  return r.success(`本次查到 ${activities.length} 个分账活动。请选择 activityId 查询概况、账单或已有结算。待结算金额是活动合计，不是你个人欠款。`, {
    activities, total: activities.length, activityPendingAmount: money(data.summary.pendingAmount), ...unit,
    title: '打开分账助手', pagePath: '/pages/splitpal/index/index'
  });
});
