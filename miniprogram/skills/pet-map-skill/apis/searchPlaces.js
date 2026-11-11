const r = require('../../_shared/runtime');
const { coordinates, format } = require('./_places');
module.exports = r.handler(async p => {
  const keyword = r.text(p.keyword, 'keyword');
  const category = r.text(p.category, 'category');
  if (category && !['cafe', 'park', 'hospital', 'shop', 'restaurant', 'other'].includes(category)) throw new Error('无效地点分类，请使用接口声明的分类。');
  const count = r.limit(p.limit);
  const coords = coordinates(p);
  const all = r.array(await r.call('mapManage', 'listPlaces', coords));
  const matches = all.filter(x => (!category || x.category === category) && (!keyword || `${x.name || ''} ${x.address || ''} ${x.description || ''}`.toLowerCase().includes(keyword.toLowerCase())));
  const places = matches.slice(0, count).map(x => format(x, coords));
  return r.success(`本次地点样本中匹配 ${matches.length} 个，返回 ${places.length} 个。${coords.latitude === undefined ? '未提供位置，不能判断附近或距离。' : '距离单位为米。'}${places.length ? '可选取 placeId 查看详情。' : '可更换关键词或打开地图查询。'}`, {
    places, total: matches.length, hasMore: matches.length > count, sourceMayBeTruncated: all.length >= 100,
    locationProvided: coords.latitude !== undefined, distanceUnit: 'm', title: '打开宠物地图', pagePath: '/pages/map/map'
  });
});
