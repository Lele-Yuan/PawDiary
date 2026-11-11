const r = require('../../_shared/runtime');
async function listMyPets() { return r.array(await r.call('petManage', 'list')); }
async function resolvePet(petName, petId) {
  const id = r.text(petId, 'petId');
  const name = r.text(petName, 'petName');
  const pets = await listMyPets();
  if (id) {
    const pet = pets.find(p => p._id === id);
    if (!pet) throw new Error('该宠物不在你的可访问列表中，请重新调用 listPets 选择。');
    if (name && pet.name !== name) throw new Error('petId 与 petName 不匹配，请重新选择。');
    return pet;
  }
  if (name) {
    const matches = pets.filter(p => String(p.name || '').trim().toLowerCase() === name.toLowerCase());
    if (!matches.length) throw new Error(`没找到宠物 ${name}，请调用 listPets 核实。`);
    if (matches.length > 1) throw new Error('存在同名宠物，请调用 listPets 并让用户选定 petId。');
    return matches[0];
  }
  let current = ''; try { current = wx.getStorageSync('currentPetId') || ''; } catch (e) {}
  const selected = pets.find(p => p._id === current);
  if (selected) return selected;
  if (pets.length === 1) return pets[0];
  if (pets.length > 1) throw new Error('尚未选择当前宠物，请调用 listPets 并让用户选定 petId。');
  return null;
}
function formatPet(pet) {
  const data = r.pick(pet, ['_id', 'name', 'species', 'breed', 'gender', 'role']);
  data.remarks = r.array(pet.remarks || []).map(item => r.pick(item, ['type', 'customType', 'content']));
  data.petName = pet.name;
  data.weight = typeof pet.weight === 'number' && pet.weight > 0 ? pet.weight : null;
  for (const key of ['birthday', 'adoptDate']) {
    const raw = pet[key];
    data[key] = raw instanceof Date ? raw.toISOString() : typeof raw === 'string' ? raw : null;
  }
  return data;
}
module.exports = { listMyPets, resolvePet, formatPet, bizErrorResult: r.error };
