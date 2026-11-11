const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../miniprogram');
const app = require('../miniprogram/app.json');
const privateData = { _openid: 'private-openid', inviteCode: 'private-invite', avatarUrl: 'private-avatar' };
const fixtures = {
  'petManage:list': [{ _id: 'p1', name: '来福', weight: 0, birthday: new Date('2020-01-01'), role: 'creator', remarks: [{ type: 'custom', content: '怕雷', ...privateData }], ...privateData }],
  'familyManage:list': [{ _id: 'u1', nickName: '家人', role: 'creator', ...privateData }],
  'checklistManage:list': [{ _id: 'c1', title: '出行', progress: 50, items: [{ name: '水', checked: true }], ...privateData }],
  'mapManage:listPlaces': [{ _id: 'place1', name: '绿地公园', category: 'park', address: '东路', distance: 23, ...privateData }],
  'mapManage:getPlace': { place: { _id: 'place1', name: '绿地公园', category: 'park', distance: 23, ...privateData }, onlineUsers: [{ ...privateData, latitude: 1 }] },
  'splitManage:listActivities': { active: [{ _id: 'a1', name: '露营', status: 'active', ...privateData }], settled: [], summary: { pendingAmount: 12345 } },
  'splitManage:getActivity': { activity: { _id: 'a1', name: '露营', status: 'active', ...privateData }, members: [{ _id: 'u1', openid: 'private-openid', nickName: '甲', role: 'creator', ...privateData }], myRole: 'creator' },
  'splitManage:getStats': { total: 12345, avg: 12345, billCount: 1, memberCount: 1, categoryStats: [{ category: 'food', amount: 12345, percent: 100 }], memberStats: [{ nickName: '甲', owe: 12345, ...privateData }] },
  'splitManage:listBills': [{ _id: 'b1', title: '晚饭', category: 'food', amount: 12345, billDate: '2026-11-06', ...privateData }],
  'splitManage:listSettlements': { settlements: [{ _id: 's1', fromOpenid: 'private-openid', toOpenid: 'private-openid', amount: 12345, status: 'pending', paidAt: null, ...privateData }], total: 1, paid: 0 },
  'mealManage:family.myList': [{ _id: 'f1', name: '周末', kitchenRole: 1, mealStatus: 0, memberCount: 2, ...privateData }],
  'mealManage:dish.poolList': { dishes: [{ _id: 'd1', name: '番茄炒蛋', duration: 10, ingredients: [{ name: '番茄', emoji: '🍅', ...privateData }], tastes: ['鲜'], ...privateData }], ownerMap: { 'private-openid': '甲' } },
  'mealManage:meal.current': { meal: { _id: 'm1', status: 0, seq: 1, isAdmin: true, ...privateData }, myPicks: ['d1'], counts: { d1: 1 } },
  'mealManage:meal.history': { list: [{ mealId: 'm1', seq: 1, finishedAt: new Date('2026-11-05'), ...privateData }] },
  'mealManage:meal.receipt': { mealId: 'm1', familyName: '周末', seq: 1, status: 2, orderedAt: new Date('2026-11-05'), dishes: [{ dishId: 'd1', name: '番茄炒蛋', duration: 10, count: 1, pickers: ['private-openid'], ...privateData }], ...privateData }
};
function runtime(folder, overrides = {}, failure, current = 'p1') {
  const handlers = {}, calls = [], cache = new Map();
  const wx = { getStorageSync: () => current, cloud: {
    DYNAMIC_CURRENT_ENV: 'test', init() {},
    async callFunction(request) {
      calls.push(request);
      const { name, data } = request, key = `${name}:${data.action}`;
      if (name === 'mealManage') assert.equal(data.data, undefined, 'mealManage requires flat event');
      else assert.ok(data.data && typeof data.data === 'object');
      if (failure) return failure === 'throw' ? Promise.reject(new Error('network unavailable')) : { result: { code: 403, msg: '无权访问' } };
      return { result: { code: 0, data: Object.hasOwn(overrides, key) ? overrides[key] : fixtures[key] } };
    }
  }, modelContext: { createSkill: () => ({ registerAPI: (name, fn) => { handlers[name] = fn; } }) } };
  function load(file) {
    if (!file.endsWith('.js')) file += '.js';
    assert.ok(file.startsWith(path.join(root, 'skills') + path.sep), 'independent skill cannot import main package');
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    vm.runInNewContext(`(function(require,module,exports){${fs.readFileSync(file, 'utf8')}\n})`, { wx, Date, console })(
      dependency => { assert.ok(dependency.startsWith('.')); return load(path.resolve(path.dirname(file), dependency)); }, module, module.exports);
    return module.exports;
  }
  load(path.join(root, 'skills', folder, 'index.js'));
  return { handlers, calls };
}
function checkSchema(schema, value, label) {
  if (schema.oneOf) { assert.ok(schema.oneOf.some(s => { try { checkSchema(s, value, label); return true; } catch { return false; } }), `${label}: no matching schema`); return; }
  const types = [].concat(schema.type || []);
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  assert.ok(types.includes(actual) || (types.includes('integer') && Number.isInteger(value)), `${label}: expected ${types}, got ${actual}`);
  if (actual === 'object') {
    for (const required of schema.required || []) assert.ok(Object.hasOwn(value, required), `${label}.${required} missing`);
    for (const [key, child] of Object.entries(value)) {
      const childSchema = schema.properties?.[key] || schema.additionalProperties;
      if (childSchema && typeof childSchema === 'object') checkSchema(childSchema, child, `${label}.${key}`);
      else assert.ok(schema.additionalProperties !== false, `${label}.${key}: undeclared`);
    }
  }
  if (actual === 'array' && schema.items) value.forEach((v, i) => checkSchema(schema.items, v, `${label}[${i}]`));
  if (schema.enum) assert.ok(schema.enum.includes(value));
}
const suites = {
  'checklist-skill': { listChecklists: {} },
  'pet-profile-skill': { listPets: {}, getPetProfile: { petId: 'p1' } },
  'family-skill': { listFamilyMembers: { petId: 'p1' } },
  'pet-map-skill': { searchPlaces: { keyword: '公园', category: 'park' }, getPlaceDetail: { placeId: 'place1' } },
  'splitpal-skill': { listActivities: {}, getActivityOverview: { activityId: 'a1' }, listActivityBills: { activityId: 'a1' }, listSettlements: { activityId: 'a1' } },
  'mealtime-skill': { listMealFamilies: {}, listFamilyDishes: { familyId: 'f1' }, getCurrentMeal: { familyId: 'f1' }, listMealHistory: { familyId: 'f1' }, getMealReceipt: { mealId: 'm1' } }
};
for (const [folder, cases] of Object.entries(suites)) {
  const manifest = require(`../miniprogram/skills/${folder}/mcp.json`);
  for (const [name, params] of Object.entries(cases)) {
    test(`${folder}.${name}: handler, schema, privacy, page and read-only action`, async () => {
      const { handlers, calls } = runtime(folder);
      const result = await handlers[name](params);
      assert.equal(result.isError, false, JSON.stringify(result));
      assert.ok(result.content[0].text);
      checkSchema(manifest.apis.find(a => a.name === name).outputSchema, result.structuredContent, name);
      assert.doesNotMatch(JSON.stringify(result), /private-openid|private-avatar|private-invite/);
      function pages(value) {
        if (!value || typeof value !== 'object') return;
        if (value.pagePath) {
          assert.ok(value.title);
          assert.ok(app.pages.includes(value.pagePath.split('?')[0].slice(1)), value.pagePath);
        }
        Object.values(value).forEach(pages);
      }
      pages(result.structuredContent);
      const allowed = new Set(Object.keys(fixtures));
      calls.forEach(c => assert.ok(allowed.has(`${c.name}:${c.data.action}`), 'no business writes'));
    });
    for (const failure of ['cloud', 'throw']) test(`${folder}.${name}: ${failure} failure`, async () => {
      const result = await runtime(folder, {}, failure).handlers[name](params);
      assert.equal(result.isError, true); assert.equal(result.structuredContent, undefined);
    });
  }
}
test('pet selection rejects foreign IDs, mismatches, ambiguity and does not query family', async () => {
  for (const params of [{ petId: 'foreign' }, { petId: 'p1', petName: '别的' }, { petId: 1 }, { petName: [] }]) {
    const { handlers, calls } = runtime('family-skill');
    assert.equal((await handlers.listFamilyMembers(params)).isError, true);
    assert.ok(calls.every(c => c.name === 'petManage'));
  }
  const pets = [{ _id: 'p1', name: '来福' }, { _id: 'p2', name: '来福' }];
  for (const params of [{ petName: '来福' }, {}]) {
    const result = await runtime('pet-profile-skill', { 'petManage:list': pets }, undefined, '').handlers.getPetProfile(params);
    assert.equal(result.isError, true); assert.match(result.content[0].text, /选择|选定/);
  }
  const selected = await runtime('pet-profile-skill', { 'petManage:list': pets }).handlers.getPetProfile({ petId: 'p2' });
  assert.equal(selected.structuredContent._id, 'p2');
  const profile = await runtime('pet-profile-skill').handlers.getPetProfile({});
  assert.equal(profile.structuredContent.weight, null);
  assert.equal(profile.structuredContent.birthday, '2020-01-01T00:00:00.000Z');
});
test('map validates coordinates, categories and limits without cloud access; absence of location hides fake zero distance', async () => {
  for (const p of [{ latitude: 20 }, { latitude: 91, longitude: 1 }, { latitude: NaN, longitude: 1 }, { latitude: '20', longitude: 1 }, { category: 'invalid' }, { keyword: 1 }, { limit: 0 }, { limit: 1.5 }, { limit: 51 }]) {
    const { handlers, calls } = runtime('pet-map-skill');
    assert.equal((await handlers.searchPlaces(p)).isError, true); assert.equal(calls.length, 0);
  }
  const { handlers } = runtime('pet-map-skill');
  const unlocated = await handlers.searchPlaces({});
  assert.equal(unlocated.structuredContent.locationProvided, false);
  assert.equal(unlocated.structuredContent.places[0].distance, undefined);
  const located = await runtime('pet-map-skill', { 'mapManage:listPlaces': [{ _id: 'x', name: '地点', latitude: 0, longitude: 0, distance: 999 }] }).handlers.searchPlaces({ latitude: 0, longitude: 0 });
  assert.equal(located.structuredContent.places[0].distance, 0);
  assert.equal((await handlers.searchPlaces({ keyword: '不存在' })).structuredContent.total, 0);
});
test('required IDs are checked before cloud access', async () => {
  for (const [folder, cases] of Object.entries(suites)) {
    const manifest = require(`../miniprogram/skills/${folder}/mcp.json`);
    for (const name of Object.keys(cases)) if (manifest.apis.find(a => a.name === name).inputSchema.required.length) {
      for (const p of [{}, { activityId: 1, familyId: 1, placeId: 1, mealId: 1 }]) {
        const { handlers, calls } = runtime(folder);
        assert.equal((await handlers[name](p)).isError, true, name); assert.equal(calls.length, 0);
      }
    }
  }
});
test('money stays in integer fen; collective pending amount and settlements preserve meaning', async () => {
  const { handlers } = runtime('splitpal-skill');
  assert.equal((await handlers.listActivities({})).structuredContent.activityPendingAmount, 12345);
  const overview = (await handlers.getActivityOverview({ activityId: 'a1' })).structuredContent;
  assert.equal(overview.total, 12345); assert.equal(overview.amountUnit, 'fen');
  const result = await handlers.listSettlements({ activityId: 'a1' });
  assert.equal(result.structuredContent.settlements[0].fromName, '甲');
  assert.equal((await runtime('splitpal-skill', { 'splitManage:listBills': [{ amount: 1.5 }] }).handlers.listActivityBills({ activityId: 'a1' })).isError, true);
});
test('empty data gives useful next step instead of fabricated records', async () => {
  const cases = [
    ['pet-profile-skill', 'listPets', {}, { 'petManage:list': [] }],
    ['pet-profile-skill', 'getPetProfile', {}, { 'petManage:list': [] }],
    ['family-skill', 'listFamilyMembers', {}, { 'familyManage:list': [] }],
    ['pet-map-skill', 'searchPlaces', {}, { 'mapManage:listPlaces': [] }],
    ['splitpal-skill', 'listActivities', {}, { 'splitManage:listActivities': { active: [], settled: [], summary: { pendingAmount: 0 } } }],
    ['splitpal-skill', 'listActivityBills', { activityId: 'a1' }, { 'splitManage:listBills': [] }],
    ['splitpal-skill', 'listSettlements', { activityId: 'a1' }, { 'splitManage:listSettlements': { settlements: [], total: 0, paid: 0 } }],
    ['mealtime-skill', 'listMealFamilies', {}, { 'mealManage:family.myList': [] }],
    ['mealtime-skill', 'listFamilyDishes', { familyId: 'f1' }, { 'mealManage:dish.poolList': { dishes: [] } }],
    ['mealtime-skill', 'getCurrentMeal', { familyId: 'f1' }, { 'mealManage:meal.current': { meal: null, myPicks: [], counts: {} } }],
    ['mealtime-skill', 'listMealHistory', { familyId: 'f1' }, { 'mealManage:meal.history': { list: [] } }]
  ];
  for (const [folder, name, params, overrides] of cases) {
    const result = await runtime(folder, overrides).handlers[name](params);
    assert.ok(result.content[0].text.length > 10);
    assert.equal(result.isError, name === 'getPetProfile', name);
  }
});
test('malformed cloud data cannot become successful query', async () => {
  for (const [folder, name, params, key] of [
    ['pet-profile-skill', 'listPets', {}, 'petManage:list'],
    ['family-skill', 'listFamilyMembers', {}, 'familyManage:list'],
    ['pet-map-skill', 'searchPlaces', {}, 'mapManage:listPlaces'],
    ['splitpal-skill', 'listActivities', {}, 'splitManage:listActivities'],
    ['mealtime-skill', 'listMealFamilies', {}, 'mealManage:family.myList'],
    ['mealtime-skill', 'listFamilyDishes', { familyId: 'f1' }, 'mealManage:dish.poolList'],
    ['mealtime-skill', 'getCurrentMeal', { familyId: 'f1' }, 'mealManage:meal.current']
  ]) for (const data of [undefined, {}, 'invalid']) {
    assert.equal((await runtime(folder, { [key]: data }).handlers[name](params)).isError, true, `${name} ${JSON.stringify(data)}`);
  }
});
test('pagination, encoded page links and wrong receipt identity', async () => {
  const places = Array.from({ length: 100 }, (_, i) => ({ _id: `p&${i}`, name: '地点' }));
  const maps = (await runtime('pet-map-skill', { 'mapManage:listPlaces': places }).handlers.searchPlaces({ limit: 1 })).structuredContent;
  assert.equal(maps.hasMore, true); assert.equal(maps.sourceMayBeTruncated, true);
  assert.ok(maps.places[0].pagePath.endsWith('id=p%260'));
  const history = Array.from({ length: 50 }, (_, i) => ({ mealId: `m${i}`, seq: i }));
  const meals = (await runtime('mealtime-skill', { 'mealManage:meal.history': { list: history } }).handlers.listMealHistory({ familyId: 'f1', limit: 1 })).structuredContent;
  assert.equal(meals.hasMore, true); assert.equal(meals.sourceMayBeTruncated, true);
  assert.equal((await runtime('mealtime-skill', { 'mealManage:meal.receipt': { mealId: 'other' } }).handlers.getMealReceipt({ mealId: 'm1' })).isError, true);
});
