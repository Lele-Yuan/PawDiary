const r = require('../../_shared/runtime');
const { resolvePet, formatPet } = require('./_resolvePet');
module.exports = r.handler(async p => {
  const pet = await resolvePet(p.petName, p.petId);
  if (!pet) throw new Error('请先在首页添加并选择宠物。');
  const data = formatPet(pet);
  return r.success(`已查询 ${pet.name} 的档案。档案体重不代表最近一次称重；查询最近体重请使用 recordSkill。编辑请打开宠物管理页面。`, { ...data, title: '管理宠物档案', pagePath: '/pages/profile/profile' });
});
