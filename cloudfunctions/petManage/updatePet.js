function cleanText(value, label, max, empty = false) {
  if (typeof value !== 'string' || (!empty && !value.trim()) || value.trim().length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new Error(`${label}格式无效`);
  return value.trim();
}
function dateValue(value, label) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label}必须为YYYY-MM-DD或null`);
  const date = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error(`${label}不是有效日期`);
  return date;
}
function validate(data) {
  const allowed = ['name', 'species', 'breed', 'gender', 'birthday', 'adoptDate', 'weight', 'remarks', 'avatar'];
  const unknown = Object.keys(data).filter(k => !['_id', 'expectedName', ...allowed].includes(k));
  if (unknown.length) throw new Error('包含不支持修改的字段：' + unknown.join('、'));
  const patch = {};
  for (const key of allowed) {
    if (data[key] === undefined) continue;
    const v = data[key];
    if (key === 'name') patch[key] = cleanText(v, '名字', 20);
    if (key === 'breed') patch[key] = cleanText(v, '品种', 20, true);
    if (key === 'avatar') {
      patch[key] = cleanText(v, '头像', 1024, true);
      if (patch[key] && !patch[key].startsWith('cloud://')) throw new Error('头像必须先上传云存储');
    }
    if (key === 'species' || key === 'gender') {
      if (!(key === 'species' ? ['cat', 'dog', 'other'] : ['male', 'female']).includes(v)) throw new Error(`${key}取值无效`);
      patch[key] = v;
    }
    if (key === 'birthday' || key === 'adoptDate') patch[key] = dateValue(v, key);
    if (key === 'weight') {
      // Existing edit page sends a numeric string or null for an empty weight.
      if (v !== null && typeof v !== 'number' && (typeof v !== 'string' || !v.trim())) throw new Error('体重必须为有效数字');
      const n = v === null ? 0 : Number(v);
      if (!Number.isFinite(n) || n < 0) throw new Error('体重必须为非负公斤数');
      patch[key] = n;
    }
    if (key === 'remarks') {
      if (!Array.isArray(v) || v.length > 10) throw new Error('备注最多10条');
      patch[key] = v.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(k => !['type', 'customType', 'content'].includes(k))) throw new Error('备注格式无效');
        if (!['preference', 'taboo', 'caution', 'other', 'custom'].includes(item.type)) throw new Error('备注类型无效');
        return { type: item.type, customType: item.type === 'custom' ? cleanText(item.customType, '自定义类型', 10) : '', content: cleanText(item.content, '备注内容', 100) };
      });
    }
  }
  if (!Object.keys(patch).length) throw new Error('请至少提供一个要修改的档案字段');
  return patch;
}
module.exports = async function updatePet({ db, cloud, security }, openid, data) {
  let patch;
  try {
    if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data._id !== 'string' || !data._id.trim()) throw new Error('缺少有效宠物ID');
    if (data.expectedName !== undefined) cleanText(data.expectedName, '旧名字', 20);
    patch = validate(data);
  } catch (e) { return { code: -1, message: e.message }; }
  const pet = await db.collection('pets').doc(data._id).get().then(r => r.data).catch(() => null);
  if (!pet || pet.status !== 'active') return { code: -1, message: '宠物不存在或已归档，请重新查询宠物列表' };
  if (pet._openid !== openid) {
    const members = await db.collection('pet_members').where({ petId: pet._id, _openid: openid }).get();
    if (!members.data.some(m => m.role === 'creator' || m.role === 'admin')) return { code: -403, message: '仅宠物创建者或共养管理员可修改档案' };
  }
  if (data.expectedName !== undefined && pet.name !== data.expectedName) return { code: -409, message: '宠物名字已变化，请重新查询确认目标，不要自动重试修改' };
  const changedFields = Object.keys(patch).filter(k => JSON.stringify(patch[k]) !== JSON.stringify(pet[k] === undefined && patch[k] === null ? null : pet[k]));
  const resultData = { petId: pet._id, previousName: pet.name, name: patch.name === undefined ? pet.name : patch.name, changed: changedFields.length > 0, updatedFields: changedFields };
  if (!changedFields.length) return { code: 0, data: resultData };
  const text = [patch.name, patch.breed, ...(patch.remarks || []).map(item => [item.customType, item.content].join(' '))].filter(Boolean).join('\n');
  if (text) {
    const result = await security.checkText(cloud, openid, text);
    if (!result.pass) return security.violationResult();
  }
  if (patch.avatar && changedFields.includes('avatar')) {
    const result = await security.checkImageByFileId(cloud, patch.avatar);
    if (!result.pass) return security.violationResult();
  }
  const update = { updatedAt: new Date() };
  changedFields.forEach(k => { update[k] = patch[k]; });
  if (changedFields.includes('weight') && patch.weight > 0) update.weightHistory = db.command.push([{ date: new Date(), weight: patch.weight }]);
  const query = { _id: pet._id, status: 'active', name: pet.name };
  // Guard all profile changes, including concurrent edits that do not rename.
  if (pet.updatedAt) query.updatedAt = pet.updatedAt;
  const result = await db.collection('pets').where(query).update({ data: update });
  if (!result.stats || result.stats.updated !== 1) return { code: -409, message: '档案已变化，请重新查询确认，不要自动重试修改' };
  return { code: 0, message: '更新成功', data: resultData };
};
