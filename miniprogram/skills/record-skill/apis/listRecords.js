const { resolvePet, bizErrorResult } = require('./_resolvePet');

const TYPE_NAME_MAP = {
  weight: '体重', poop: '排便', diet: '饮食', water: '饮水',
  deworm: '驱虫', vaccine: '疫苗', checkup: '体检', illness: '生病',
  bath: '洗澡', nail: '剪指甲', ear: '清耳', paw: '修毛', gland: '挤腺', teeth: '刷牙', beauty: '美容',
  disinfect: '消毒', litter: '换砂', toy: '玩具', cage: '清笼',
  abnormal: '异常', heat: '发情', trouble: '捅娄子', stealfood: '偷吃'
};

// 仅日期 YYYY-MM-DD → 当天 00:00:00（本地时区）
function expandStart(d) {
  if (!d) return d;
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00`;
  return s;
}
// 仅日期 YYYY-MM-DD → 当天 23:59:59.999（本地时区）
function expandEnd(d) {
  if (!d) return d;
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T23:59:59.999`;
  return s;
}

async function listRecords(params) {
  try {
    const { petName, type, startDate, endDate, limit } = params || {};
    const { petId, petName: resolvedName } = await resolvePet(petName);

    const res = await wx.cloud.callFunction({
      name: 'recordManage',
      data: {
        action: 'list',
        data: {
          petId,
          type: type || 'all',
          startDate: expandStart(startDate),
          endDate: expandEnd(endDate),
          limit: limit || 20
        }
      }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizErrorResult(r.message || '查询失败');

    const all = r.data || [];
    const records = all.slice(0, 5).map(rec => ({
      _id: rec._id,
      type: rec.type,
      typeName: TYPE_NAME_MAP[rec.type] || rec.type,
      title: rec.title,
      date: rec.date,
      weight: rec.weight,
      weightUnit: rec.weightUnit,
      cost: rec.cost
    }));

    const typeText = type ? TYPE_NAME_MAP[type] || type : '全部类型';
    let text;
    if (all.length === 0) {
      text = `${resolvedName} 暂无${typeText}的记录`;
    } else {
      const latest = all[0];
      const latestText = `${TYPE_NAME_MAP[latest.type] || latest.type} · ${latest.title}（${(latest.date || '').slice(0, 10)}）`;
      text = `查询到 ${resolvedName} 的${typeText}记录共 ${all.length} 条，最新一条：${latestText}`;
    }

    return {
      isError: false,
      content: [{ type: 'text', text }],
      structuredContent: {
        petName: resolvedName,
        type: type || 'all',
        typeName: typeText,
        total: all.length,
        records
      }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizErrorResult(e.message);
    return bizErrorResult('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

module.exports = listRecords;
