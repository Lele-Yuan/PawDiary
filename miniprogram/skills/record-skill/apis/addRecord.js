const { resolvePet, bizErrorResult } = require('./_resolvePet');

const TYPE_NAME_MAP = {
  weight: '体重', poop: '排便', diet: '饮食', water: '饮水',
  deworm: '驱虫', vaccine: '疫苗', checkup: '体检', illness: '生病',
  bath: '洗澡', nail: '剪指甲', ear: '清耳', paw: '修毛', gland: '挤腺', teeth: '刷牙', beauty: '美容',
  disinfect: '消毒', litter: '换砂', toy: '玩具', cage: '清笼',
  abnormal: '异常', heat: '发情', trouble: '捅娄子', stealfood: '偷吃'
};

async function addRecord(params) {
  try {
    const { petName, type, title, date, description, cost,
      weight, weightUnit, waterAmount, waterUnit,
      foodType, foodAmount, dewormType, vaccineType, hospitalName } = params || {};

    if (!type) return bizErrorResult('缺少必填参数 type');
    if (!title) return bizErrorResult('缺少必填参数 title');

    const { petId, petName: resolvedName } = await resolvePet(petName);

    const data = {
      petId,
      type,
      title,
      date: date || new Date().toISOString(),
      description: description || '',
      cost: cost || 0,
      weight,
      weightUnit: weightUnit || 'kg',
      waterAmount,
      waterUnit: waterUnit || 'ml',
      foodType,
      foodAmount,
      dewormType,
      vaccineType,
      hospitalName
    };

    const res = await wx.cloud.callFunction({
      name: 'recordManage',
      data: { action: 'add', data }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizErrorResult(r.message || '添加失败');

    const typeName = TYPE_NAME_MAP[type] || type;
    const text = `已为 ${resolvedName} 记录${typeName}：${title}` + (date ? `（${data.date.slice(0, 10)}）` : '');

    return {
      isError: false,
      content: [{ type: 'text', text }],
      structuredContent: {
        _id: r.data && r.data._id,
        petName: resolvedName,
        type,
        typeName,
        title,
        date: data.date,
        weight: data.weight,
        weightUnit: data.weightUnit,
        cost: data.cost,
        description: data.description
      }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizErrorResult(e.message);
    return bizErrorResult('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

module.exports = addRecord;
