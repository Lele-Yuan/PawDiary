const r = require('../../_shared/runtime');
const familyId = p => r.text(p.familyId, 'familyId', true);
const entry = id => ({ title: '打开家庭饭局', pagePath: r.page('pages/mealtime/family/family', { id }) });
function dish(d) {
  return { ...r.pick(d, ['_id', 'dishId', 'name', 'duration', 'remark', 'count']),
    ingredients: r.array(d.ingredients || []).map(x => typeof x === 'string' ? x : r.pick(x, ['name', 'emoji'])),
    tastes: r.array(d.tastes || []).map(x => typeof x === 'string' ? x : r.pick(x, ['name', 'emoji'])) };
}
module.exports = { familyId, entry, dish };
