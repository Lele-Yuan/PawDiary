const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const app = require('../miniprogram/app.json');

function runtime(skill, { pets = [{ _id: 'pet-1', name: '来福' }], failure = false } = {}) {
  const calls = [], handlers = {}, cache = new Map();
  const records = [{ _id: 'record-1', type: 'weight', title: '体重 17.7kg', date: '2026-11-03T08:00:00+08:00', weight: '17.7', weightUnit: 'kg' }];
  const bills = [{ _id: 'bill-1', title: '狗粮', category: 'food', amount: 199, date: '2026-11-03' }];
  const nextDate = new Date(); nextDate.setDate(nextDate.getDate() + 1); nextDate.setHours(12, 0, 0, 0);
  const reminders = [{ _id: 'reminder-1', type: 'vaccine', title: '疫苗', nextDate }];
  const compare = value => ({ value, and(other) { return { lower: value, upper: other.value }; } });
  const dbQuery = {
    where(query) { calls.push({ query }); return this; },
    orderBy() { return this; }, limit() { return this; },
    async get() { if (failure) throw new Error('database unavailable'); return { data: reminders }; }
  };
  const wx = {
    getStorageSync: () => 'pet-1',
    cloud: {
      DYNAMIC_CURRENT_ENV: 'test-env', init() {},
      database: () => ({ command: { gte: compare, lte: compare }, collection: () => dbQuery }),
      async callFunction({ name, data }) {
        calls.push({ name, ...data });
        if (name === 'petManage') return { result: { code: 0, data: pets } };
        if (failure) return { result: { code: -1, message: '无权操作' } };
        let result;
        if (name === 'recordManage') result = data.action === 'list' ? records : { _id: 'record-new' };
        if (name === 'billManage') result = data.action === 'list' ? bills : data.action === 'stats'
          ? { monthTotal: 199, lastMonthTotal: 100, categoryStats: [{ category: 'food', total: 199 }], trends: [] }
          : { _id: 'bill-new' };
        return { result: { code: 0, data: result } };
      }
    },
    modelContext: { createSkill(skillPath) {
      assert.equal(skillPath, skill.path);
      return { registerAPI(name, fn) { handlers[name] = fn; } };
    } }
  };
  function load(file) {
    if (!file.endsWith('.js')) file += '.js';
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    vm.runInNewContext(`(function(require,module,exports){${fs.readFileSync(file, 'utf8')}\n})`, { wx, console, Date })(
      dependency => { assert.ok(dependency.startsWith('.')); return load(path.resolve(path.dirname(file), dependency)); }, module, module.exports);
    return module.exports;
  }
  load(path.join(root, 'miniprogram', skill.path, 'index.js'));
  return { handlers, calls };
}

test('dynamic skill entries are retained by development and upload compilers', () => {
  const shared = require('../project.config.json').setting;
  const local = require('../project.private.config.json').setting;
  assert.equal(local.ignoreDevUnusedFiles ?? shared.ignoreDevUnusedFiles, false);
  assert.equal(shared.ignoreUploadUnusedFiles, false);
  for (const skill of app.agent.skills) {
    assert.ok(app.subPackages.some(pkg => pkg.independent && skill.path.replace(/^\//, '').startsWith(pkg.root + '/')));
    const { handlers } = runtime(skill);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram', skill.path, 'mcp.json')));
    assert.deepEqual(Object.keys(handlers).sort(), manifest.apis.map(api => api.name).sort());
  }
});

const cases = {
  recordSkill: [
    ['listRecords', { petName: '来福', type: 'weight', limit: 1 }, result => {
      assert.equal(result.structuredContent.records[0].weight, '17.7');
      assert.equal(result.structuredContent.records[0].date, '2026-11-03T08:00:00+08:00');
    }],
    ['addRecord', { petName: '来福', type: 'weight', title: '体重 17.7kg', weight: '17.7' }],
    ['deleteRecord', { recordId: 'record-1' }, result => assert.equal(result.structuredContent.deleted, true)]
  ],
  billSkill: [
    ['listBills', { petName: '来福' }, result => assert.equal(result.structuredContent.bills[0].amount, 199)],
    ['addBill', { petName: '来福', title: '狗粮', category: 'food', amount: 199 }],
    ['getMonthlyStats', { petName: '来福', year: 2026, month: 11 }, result => assert.equal(result.structuredContent.monthTotal, 199)]
  ],
  reminderSkill: [
    ['listUpcomingReminders', { petName: '来福' }, result => assert.equal(result.structuredContent.reminders[0].diffLabel, '明天')],
    ['getNextReminderByType', { petName: '来福', type: 'vaccine' }, result => {
      assert.equal(result.structuredContent.total, 1);
      assert.equal(result.structuredContent.reminders[0].daysDiff, 1);
    }]
  ]
};
for (const skill of app.agent.skills) {
  if (!cases[skill.name]) {
    test(`${skill.name} registers all declared APIs`, async () => {
      const { handlers } = runtime(skill);
      const manifest = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram', skill.path, 'mcp.json')));
      assert.deepEqual(Object.keys(handlers).sort(), manifest.apis.map(api => api.name).sort());
    });
    continue;
  }
  for (const [name, args, verify] of cases[skill.name]) {
    test(`${skill.name}.${name} executes registered handler`, async () => {
      const { handlers, calls } = runtime(skill);
      const result = await handlers[name](args);
      assert.equal(result.isError, false, JSON.stringify(result));
      assert.ok(result.content[0].text);
      verify?.(result);
      if (name === 'listRecords') {
        const call = calls.find(call => call.name === 'recordManage');
        assert.equal(call.data.petId, 'pet-1'); assert.equal(call.data.type, 'weight'); assert.equal(call.data.limit, 1);
      }
    });
  }
  test(`${skill.name} rejects unknown pet without executing business operation`, async () => {
    const { handlers, calls } = runtime(skill);
    const [name, args] = cases[skill.name][0];
    const result = await handlers[name]({ ...args, petName: '不存在的宠物' });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /没找到宠物/);
    assert.ok(calls.every(call => call.name === 'petManage'));
  });
  test(`${skill.name} handles default pet and empty pet list`, async () => {
    const [name, args] = cases[skill.name][0];
    const { petName, ...withoutName } = args;
    assert.equal((await runtime(skill).handlers[name](withoutName)).isError, false);
    const empty = await runtime(skill, { pets: [] }).handlers[name](withoutName);
    assert.equal(empty.isError, true);
    assert.match(empty.content[0].text, /请先在首页添加并选择宠物/);
  });
  for (const [name, args] of cases[skill.name]) {
    test(`${skill.name}.${name} reports cloud failure instead of success`, async () => {
      const result = await runtime(skill, { failure: true }).handlers[name](args);
      assert.equal(result.isError, true);
      assert.ok(!result.structuredContent);
    });
  }
}

test('write handlers reject missing required fields without writing', async () => {
  for (const skill of app.agent.skills) {
    const { handlers, calls } = runtime(skill);
    for (const name of ['addRecord', 'addBill', 'deleteRecord']) {
      if (handlers[name]) assert.equal((await handlers[name]({})).isError, true);
    }
    assert.equal(calls.length, 0);
  }
});
