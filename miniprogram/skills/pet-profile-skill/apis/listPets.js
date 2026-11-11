const r = require('../../_shared/runtime');
const { listMyPets, formatPet } = require('./_resolvePet');
module.exports = r.handler(async () => {
  const pets = (await listMyPets()).map(formatPet);
  return r.success(pets.length ? `查到 ${pets.length} 只可访问的宠物。请选择一只查看档案或共养成员。` : '暂无可访问的宠物，请在首页添加或接受共养邀请。', { total: pets.length, pets });
});
