const r = require('../../_shared/runtime');
const activityId = p => r.text(p.activityId, 'activityId', true);
const entry = id => ({ title: '查看分账活动', pagePath: r.page('pages/splitpal/activity-detail/activity-detail', { id }) });
function money(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('分账金额格式异常，请在活动页面核实，不能按元直接解释原始金额。');
  return value;
}
const unit = { currency: 'CNY', amountUnit: 'fen' };
module.exports = { activityId, entry, money, unit };
