const r = require('../../_shared/runtime');
const { familyId, entry, dish } = require('./_meal');
module.exports = r.handler(async p => {
  const id = familyId(p), keyword = r.text(p.keyword, 'keyword'), limit = r.limit(p.limit);
  const data = await r.call('mealManage', 'dish.poolList', { familyId: id });
  const matches = r.array(data.dishes).filter(d => !keyword || String(d.name || '').toLowerCase().includes(keyword.toLowerCase()));
  const dishes = matches.slice(0, limit).map(dish);
  return r.success(dishes.length ? `菜单样本中匹配 ${matches.length} 道菜，返回 ${dishes.length} 道。耗时单位为分钟；食材信息不构成过敏安全保证。点菜请打开饭局页面。` : '菜单中没有匹配菜品，可更换关键词或打开饭局维护菜单。', { familyId: id, dishes, hasMore: matches.length > limit, durationUnit: 'minute', ...entry(id) });
});
