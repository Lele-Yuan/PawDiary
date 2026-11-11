const r = require('../../_shared/runtime');
const { resolvePet } = require('../../pet-profile-skill/apis/_resolvePet');
module.exports = r.handler(async p => {
  // familyManage.list itself does not enforce membership: verify against petManage.list first.
  const pet = await resolvePet(p.petName, p.petId);
  if (!pet) throw new Error('请先在首页添加并选择宠物。');
  const members = r.array(await r.call('familyManage', 'list', { petId: pet._id }))
    .map(m => r.pick(m, ['_id', 'nickName', 'role']));
  return r.success(`查到 ${pet.name} 的 ${members.length} 位共养成员。邀请、移除或调整权限请进入共养管理页面。`, {
    petId: pet._id, petName: pet.name, myRole: pet.role || '', total: members.length, members,
    title: '管理共养成员', pagePath: r.page('pages/family-members/family-members', { petId: pet._id })
  });
});
