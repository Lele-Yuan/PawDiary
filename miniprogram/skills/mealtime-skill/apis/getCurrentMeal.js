const r = require('../../_shared/runtime');
const { familyId, entry } = require('./_meal');
module.exports = r.handler(async p => {
  const id = familyId(p);
  const data = await r.call('mealManage', 'meal.current', { familyId: id });
  const meal = data.meal === null ? null : r.pick(data.meal, ['_id', 'status', 'seq', 'isAdmin']);
  const counts = data.counts;
  if (!counts || typeof counts !== 'object' || Array.isArray(counts) || Object.values(counts).some(n => !Number.isInteger(n) || n < 0)) throw new Error('点菜数量格式异常，请打开饭局核实。');
  return r.success(meal ? `当前第 ${meal.seq} 次约饭，${meal.status === 0 ? '正在点菜' : '已下单'}。菜名请结合菜单查询；选菜和下单请打开饭局页面。` : '当前没有进行中的约饭，可打开饭局页面开桌。', { familyId: id, meal, myPicks: r.array(data.myPicks), counts, ...entry(id) });
});
