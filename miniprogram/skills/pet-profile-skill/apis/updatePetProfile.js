const r = require('../../_shared/runtime');
const { resolvePet } = require('./_resolvePet');
const fields = ['name', 'species', 'breed', 'gender', 'birthday', 'adoptDate', 'weight', 'remarks'];
function validate(updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates) || !Object.keys(updates).length) throw new Error('请明确至少一个要修改的档案字段。');
  const patch = {};
  for (const key of Object.keys(updates)) {
    if (!fields.includes(key)) throw new Error('不支持修改字段：' + key);
    const v = updates[key];
    if (key === 'name' || key === 'breed') {
      if (typeof v !== 'string' || (key === 'name' && !v.trim()) || v.trim().length > 20 || /[\u0000-\u001f\u007f]/.test(v)) throw new Error('名字和品种必须为20字符以内文本，名字不能为空。');
      patch[key] = v.trim();
    } else if (key === 'species' || key === 'gender') {
      if (!(key === 'species' ? ['cat', 'dog', 'other'] : ['male', 'female']).includes(v)) throw new Error(key + '取值无效。');
      patch[key] = v;
    } else if (key === 'birthday' || key === 'adoptDate') {
      if (v !== null) {
        if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error('日期必须为YYYY-MM-DD，明确清空时传null。');
        const d = new Date(v + 'T00:00:00.000Z');
        if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw new Error('日期无效。');
      }
      patch[key] = v;
    } else if (key === 'weight') {
      if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) throw new Error('档案体重必须为大于0的公斤数。新增称重记录请使用记录技能。');
      patch[key] = v;
    } else {
      if (!Array.isArray(v) || v.length > 10) throw new Error('备注必须为最多10条的完整数组。');
      patch[key] = v.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(k => !['type', 'customType', 'content'].includes(k))) throw new Error('备注格式无效。');
        if (!['preference', 'taboo', 'caution', 'other', 'custom'].includes(item.type) || typeof item.content !== 'string' || !item.content.trim() || item.content.length > 100) throw new Error('备注类型或内容无效。');
        if (item.type === 'custom' && (typeof item.customType !== 'string' || !item.customType.trim() || item.customType.length > 10)) throw new Error('自定义备注类型必须为1到10字符。');
        return { type: item.type, customType: item.type === 'custom' ? item.customType.trim() : '', content: item.content.trim() };
      });
    }
  }
  return patch;
}
module.exports = r.handler(async p => {
  const updates = validate(p.updates);
  if (p.petId === undefined && p.petName === undefined) throw new Error('请明确要修改的宠物，先调用 listPets 让用户选择。');
  const pet = await resolvePet(p.petName, p.petId);
  if (!pet) throw new Error('请先查询并选定要修改的宠物。');
  if (!['creator', 'admin'].includes(pet.role)) throw new Error('仅宠物创建者或共养管理员可修改档案。');
  const result = await r.call('petManage', 'update', { _id: pet._id, expectedName: pet.name, ...updates });
  const expectedName = updates.name === undefined ? pet.name : updates.name;
  if (result.petId !== pet._id || result.name !== expectedName || result.previousName !== pet.name || typeof result.changed !== 'boolean' || !Array.isArray(result.updatedFields) || result.updatedFields.some(k => !Object.keys(updates).includes(k)) || result.changed !== (result.updatedFields.length > 0)) {
    throw new Error('档案更新返回信息不完整，暂不能确认结果。请重新查询核实，不要重复提交。');
  }
  const labels = { name: '名字', species: '物种', breed: '品种', gender: '性别', birthday: '生日', adoptDate: '到家日期', weight: '档案体重', remarks: '备注' };
  const text = result.changed ? `已更新 ${result.name} 的${result.updatedFields.map(k => labels[k]).join('、')}。${result.updatedFields.includes('name') ? `原名 ${result.previousName}，新名 ${result.name}。` : ''}` : `${result.name} 的指定档案信息已与要求一致，无需修改。`;
  return r.success(text, { petId: result.petId, previousName: result.previousName, petName: result.name, name: result.name, changed: result.changed, updatedFields: result.updatedFields, title: '查看宠物档案', pagePath: '/pages/profile/profile' });
});
