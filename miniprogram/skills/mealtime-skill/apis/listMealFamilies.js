const r = require('../../_shared/runtime');
const { entry } = require('./_meal');
module.exports = r.handler(async () => {
  const families = r.array(await r.call('mealManage', 'family.myList')).map(f => ({ ...r.pick(f, ['_id', 'name', 'memberCount', 'cookCount', 'isAdmin', 'kitchenRole', 'mealStatus']), ...entry(f._id) }));
  return r.success(families.length ? `本次查到 ${families.length} 个家庭饭局。请选择 familyId 查询菜单、当前约饭或历史小票。` : '暂无加入的家庭饭局，可打开来吃饭创建或加入。', { families, total: families.length, title: '打开来吃饭', pagePath: '/pages/mealtime/index/index' });
});
