const r = require('../../_shared/runtime');
function coordinates(p) {
  if (p.latitude === undefined && p.longitude === undefined) return {};
  if (typeof p.latitude !== 'number' || !Number.isFinite(p.latitude) || Math.abs(p.latitude) > 90 ||
      typeof p.longitude !== 'number' || !Number.isFinite(p.longitude) || Math.abs(p.longitude) > 180) {
    throw new Error('经纬度必须同时提供有效数字。可打开地图授权定位，不要猜测坐标。');
  }
  return { latitude: p.latitude, longitude: p.longitude };
}
function format(place, coords) {
  const data = r.pick(place, ['_id', 'name', 'category', 'description', 'address', 'latitude', 'longitude']);
  // The legacy backend treats latitude/longitude zero as missing. Calculate from
  // public venue coordinates here so valid equator/meridian positions also work.
  if (coords.latitude !== undefined && Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
    const rad = n => n * Math.PI / 180;
    const a = Math.sin(rad(place.latitude - coords.latitude) / 2) ** 2 +
      Math.cos(rad(coords.latitude)) * Math.cos(rad(place.latitude)) * Math.sin(rad(place.longitude - coords.longitude) / 2) ** 2;
    data.distance = Math.round(6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, a))));
  }
  return { ...data, title: place.name, pagePath: r.page('pages/map/place-detail/place-detail', { id: place._id }) };
}
module.exports = { coordinates, format };
