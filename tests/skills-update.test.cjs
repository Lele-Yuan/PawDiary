const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function runtime({ role = 'creator', pets, failure, malformed = false } = {}) {
  const calls = [], cache = new Map();
  const wx = { cloud: { init() {}, async callFunction(req) {
    calls.push(req); const d = req.data;
    if (d.action === 'list') return { result: { code: 0, data: pets || [{ _id: 'p1', name: '葫芦', role }] } };
    if (failure) return { result: { code: -1, message: failure } };
    return { result: { code: 0, data: malformed ? {} : { petId: d.data._id, previousName: d.data.expectedName, name: d.data.name === undefined ? '葫芦' : d.data.name, changed: d.data.name !== d.data.expectedName, updatedFields: d.data.name === d.data.expectedName ? [] : Object.keys(d.data).filter(k => !['_id', 'expectedName'].includes(k)) } } };
  } } };
  function load(file) {
    if (!file.endsWith('.js')) file += '.js';
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    vm.runInNewContext(`(function(require,module,exports){${fs.readFileSync(file, 'utf8')}\n})`, { wx, Date })(dep => load(path.resolve(path.dirname(file), dep)), module, module.exports);
    return module.exports;
  }
  return { rename: load(path.join(root, 'miniprogram/skills/pet-profile-skill/apis/updatePetProfile.js')), calls };
}
for (const role of ['creator', 'admin']) test(`update skill supports ${role} and sends only intended fields`, async () => {
  const { rename, calls } = runtime({ role });
  const result = await rename({ petName: '葫芦', updates: { name: ' 小葫芦 ' } });
  assert.equal(result.isError, false); assert.equal(result.structuredContent.petName, '小葫芦');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1].data)), { action: 'update', data: { _id: 'p1', expectedName: '葫芦', name: '小葫芦' } });
});
test('invalid names and missing target never write', async () => {
  for (const params of [{ petName: '葫芦' }, { updates: { name: '小葫芦' } }, { petName: '葫芦', updates: { name: ' ' } }, { petName: '葫芦', updates: { name: 'x'.repeat(21) } }, { petName: '葫芦', updates: { name: 'a\nb' } }]) {
    const { rename, calls } = runtime(); assert.equal((await rename(params)).isError, true); assert.equal(calls.length, 0);
  }
});
test('member, ambiguous, unknown and foreign pet never write', async () => {
  for (const [options, params] of [[{ role: 'member' }, { petName: '葫芦' }], [{ pets: [{ _id: 'p1', name: '葫芦', role: 'creator' }, { _id: 'p2', name: '葫芦', role: 'creator' }] }, { petName: '葫芦' }], [{}, { petName: '不存在' }], [{}, { petId: 'foreign' }]]) {
    const { rename, calls } = runtime(options); assert.equal((await rename({ ...params, updates: { name: '小葫芦' } })).isError, true); assert.ok(calls.every(c => c.data.action === 'list'));
  }
});
test('cloud errors and incomplete acknowledgements do not claim success', async () => {
  for (const options of [{ failure: '无权修改' }, { failure: '名字已变化' }, { failure: '内容不通过' }, { malformed: true }]) {
    const { rename } = runtime(options); const r = await rename({ petName: '葫芦', updates: { name: '小葫芦' } }); assert.equal(r.isError, true); assert.equal(r.structuredContent, undefined);
  }
});
test('same name is an explicit no-op', async () => {
  const result = await runtime().rename({ petName: '葫芦', updates: { name: '葫芦' } }); assert.equal(result.structuredContent.changed, false); assert.match(result.content[0].text, /无需修改/);
});
const updateServer = require('../cloudfunctions/petManage/updatePet');
function server(options = {}) {
  const writes = [], checks = [];
  const pet = { _id: 'p1', _openid: 'owner', name: '葫芦', status: 'active', weight: 3, birthday: '2020-01-01', ...options.pet };
  const db = { command: { push: value => ({ $push: value }) }, collection(name) { return {
    doc: () => ({ get: async () => ({ data: options.missing ? null : pet }) }),
    where(query) { return { get: async () => ({ data: options.members || [] }), update: async ({ data }) => { writes.push({ query, data }); return { stats: { updated: options.conflict ? 0 : 1 } }; } }; }
  }; } };
  const security = { checkText: async (_, openid, name) => { checks.push({ openid, name }); return { pass: !options.unsafe }; }, violationResult: () => ({ code: -9, message: '内容不通过' }) };
  return { run: data => updateServer({ db, cloud: {}, security }, options.actor || 'owner', data), writes, checks };
}
const input = { _id: 'p1', expectedName: '葫芦', name: '小葫芦' };
for (const options of [{}, { actor: 'admin', members: [{ role: 'admin' }] }]) test('server authorizes owner/admin and conditionally updates name only', async () => {
  const s = server(options), r = await s.run(input); assert.equal(r.code, 0); assert.equal(r.data.name, '小葫芦');
  assert.deepEqual(Object.keys(s.writes[0].data).sort(), ['name', 'updatedAt']);
  assert.deepEqual(s.writes[0].query, { _id: 'p1', status: 'active', name: '葫芦' });
  assert.equal(s.checks[0].name, '小葫芦');
});
test('server denies ordinary/removed members, missing/archived pets, stale names and unsafe content', async () => {
  for (const options of [{ actor: 'member', members: [{ role: 'member' }] }, { actor: 'removed' }, { missing: true }, { pet: { status: 'archived' } }, { pet: { name: '新葫芦' } }, { unsafe: true }]) {
    const s = server(options); assert.notEqual((await s.run(input)).code, 0); assert.equal(s.writes.length, 0);
  }
});
test('server validates inputs independently of skill', async () => {
  for (const data of [null, {}, { ...input, name: '' }, { ...input, name: 1 }, { ...input, name: 'x'.repeat(21) }, { ...input, name: 'a\nb' }, { ...input, expectedName: '' }]) {
    const s = server(); assert.notEqual((await s.run(data)).code, 0); assert.equal(s.writes.length, 0);
  }
});
test('server reports concurrent changes and handles identical name without writes', async () => {
  assert.equal((await server({ conflict: true }).run(input)).code, -409);
  const s = server(); const r = await s.run({ ...input, name: '葫芦' }); assert.equal(r.data.changed, false); assert.equal(s.writes.length, 0); assert.equal(s.checks.length, 0);
});
test('skill sends multiple explicit fields without replacing unrelated profile data', async () => {
  const updates = { name: '小葫芦', breed: '玳瑁', gender: 'female', species: 'cat', birthday: '2020-02-29', adoptDate: null, weight: 4.2, remarks: [{ type: 'taboo', content: '怕雷' }] };
  const { rename, calls } = runtime();
  const result = await rename({ petId: 'p1', updates });
  assert.equal(result.isError, false, JSON.stringify(result));
  const sent = JSON.parse(JSON.stringify(calls[1].data.data));
  assert.deepEqual(sent, { _id: 'p1', expectedName: '葫芦', ...updates, remarks: [{ type: 'taboo', customType: '', content: '怕雷' }] });
  assert.equal(result.structuredContent.updatedFields.length, 8);
});
test('skill rejects unsupported fields, invalid calendar dates, weight and remarks before access', async () => {
  for (const updates of [{}, { _openid: 'owner' }, { avatar: 'cloud://photo' }, { birthday: '2023-02-29' }, { birthday: '2024-02-30' }, { adoptDate: '昨天' }, { gender: 'unknown' }, { species: 'bird' }, { weight: '3' }, { weight: 0 }, { weight: NaN }, { remarks: [{ type: 'custom', content: '谨慎' }] }, { remarks: [{ type: 'other', content: '' }] }, { remarks: Array(11).fill({ type: 'other', content: '注意' }) }]) {
    const { rename, calls } = runtime(); assert.equal((await rename({ petName: '葫芦', updates })).isError, true, JSON.stringify(updates)); assert.equal(calls.length, 0);
  }
});
test('server updates valid fields atomically and appends history only for changed positive weight', async () => {
  const s = server({ pet: { updatedAt: new Date('2026-11-10'), adoptDate: new Date('2021-01-01') } });
  const result = await s.run({ _id: 'p1', expectedName: '葫芦', breed: '玳瑁', gender: 'female', birthday: '2020-02-29', adoptDate: null, weight: 4.2, remarks: [{ type: 'custom', customType: '偏好', content: '吃鱼' }] });
  assert.equal(result.code, 0);
  const write = s.writes[0];
  assert.equal(write.data.birthday.toISOString(), '2020-02-29T00:00:00.000Z');
  assert.equal(write.data.adoptDate, null);
  assert.equal(write.data.name, undefined);
  assert.equal(write.data._openid, undefined);
  assert.equal(write.data.weightHistory.$push[0].weight, 4.2);
  assert.equal(write.query.updatedAt.toISOString(), '2026-11-10T00:00:00.000Z');
  assert.match(s.checks[0].name, /玳瑁/); assert.match(s.checks[0].name, /吃鱼/);
  const same = server(); assert.equal((await same.run({ _id: 'p1', weight: 3 })).data.changed, false); assert.equal(same.writes.length, 0);
});
test('server supports existing edit page payload, clearing dates and remarks, but rejects protected or invalid fields', async () => {
  const s = server();
  assert.equal((await s.run({ _id: 'p1', name: '葫芦', species: 'cat', breed: '', gender: 'female', birthday: null, adoptDate: null, weight: '4.5', avatar: '', remarks: [] })).code, 0);
  assert.equal(s.writes[0].data.weight, 4.5);
  assert.deepEqual(s.writes[0].data.remarks, []);
  for (const fields of [{}, { _openid: 'attacker' }, { status: 'archived' }, { birthday: '2023-02-29' }, { weight: 'not number' }, { weight: -1 }, { gender: 'other' }, { species: 'bird' }, { avatar: '/tmp/photo' }, { remarks: [{ type: 'invalid', content: 'test' }] }]) {
    const denied = server(); assert.notEqual((await denied.run({ _id: 'p1', ...fields })).code, 0, JSON.stringify(fields)); assert.equal(denied.writes.length, 0);
  }
});
test('only unified update is registered and old rename files/action are removed', () => {
  const manifest = require('../miniprogram/skills/pet-profile-skill/mcp.json');
  assert.ok(manifest.apis.some(a => a.name === 'updatePetProfile'));
  assert.ok(!manifest.apis.some(a => a.name === 'renamePet'));
  assert.ok(!fs.existsSync(path.join(root, 'cloudfunctions/petManage/renamePet.js')));
  assert.ok(!fs.existsSync(path.join(root, 'miniprogram/skills/pet-profile-skill/apis/renamePet.js')));
  const index = fs.readFileSync(path.join(root, 'cloudfunctions/petManage/index.js'), 'utf8');
  assert.doesNotMatch(index, /case 'rename'/);
  assert.match(index, /case 'update':[\s\S]*require\('\.\/updatePet'\)/);
});
