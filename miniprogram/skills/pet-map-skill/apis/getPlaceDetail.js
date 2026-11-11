const r = require('../../_shared/runtime');
const { coordinates, format } = require('./_places');
module.exports = r.handler(async p => {
  const placeId = r.text(p.placeId, 'placeId', true);
  const coords = coordinates(p);
  const result = await r.call('mapManage', 'getPlace', { placeId, ...coords });
  if (!result.place || result.place._id !== placeId) throw new Error('地点已不可用，请重新搜索地点。');
  return r.success('已查询地点详情。营业情况及宠物准入规则请向商家核实；可打开地点页面查看。', format(result.place, coords));
});
