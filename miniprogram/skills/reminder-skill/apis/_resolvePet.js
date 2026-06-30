if (!wx.cloud.__inited) {
  wx.cloud.init({ env: wx.cloud.DYNAMIC_CURRENT_ENV });
  wx.cloud.__inited = true;
}

async function listMyPets() {
  const res = await wx.cloud.callFunction({
    name: 'petManage',
    data: { action: 'list', data: {} }
  });
  return (res.result && res.result.data) || [];
}

async function resolvePet(petName) {
  const pets = await listMyPets();
  if (petName && String(petName).trim()) {
    const target = String(petName).trim().toLowerCase();
    const hit = pets.find(p => (p.name || '').trim().toLowerCase() === target);
    if (!hit) {
      const err = new Error(`对不起没找到宠物 ${petName}，请核实是否已添加 ${petName}`);
      err.__skillBiz = true;
      throw err;
    }
    return { petId: hit._id, petName: hit.name };
  }
  let currentPetId = '';
  try { currentPetId = wx.getStorageSync('currentPetId') || ''; } catch (e) {}
  if (currentPetId) {
    const cur = pets.find(p => p._id === currentPetId);
    if (cur) return { petId: cur._id, petName: cur.name };
  }
  if (pets.length > 0) return { petId: pets[0]._id, petName: pets[0].name };

  const err = new Error('请先在首页添加并选择宠物');
  err.__skillBiz = true;
  throw err;
}

function bizErrorResult(message) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

module.exports = { resolvePet, bizErrorResult };
