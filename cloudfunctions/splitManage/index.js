const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const security = require('./contentSecurity');

const C_ACT = 'split_activities';
const C_MEM = 'split_members';
const C_BILL = 'split_bills';
const C_SET = 'split_settlements';

const VALID_CATEGORIES = ['food', 'transport', 'hotel', 'shopping', 'fun', 'medical', 'gift', 'other'];

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'createActivity':  return await createActivity(OPENID, data);
    case 'updateActivity':  return await updateActivity(OPENID, data);
    case 'listActivities':  return await listActivities(OPENID, data);
    case 'getActivity':     return await getActivity(OPENID, data);
    case 'joinActivity':    return await joinActivity(OPENID, data);
    case 'joinByCode':      return await joinByCode(OPENID, data);
    case 'addBill':         return await addBill(OPENID, data);
    case 'updateBill':      return await updateBill(OPENID, data);
    case 'deleteBill':      return await deleteBill(OPENID, data);
    case 'listBills':       return await listBills(OPENID, data);
    case 'getStats':        return await getStats(OPENID, data);
    case 'calcSettlement':  return await calcSettlement(OPENID, data);
    case 'listSettlements': return await listSettlements(OPENID, data);
    case 'markPaid':        return await markPaid(OPENID, data);
    default:                return { code: -1, message: '未知操作类型' };
  }
};

// ============ 工具函数 ============

// 校验用户是否为活动成员，返回成员记录或 null
async function getMember(activityId, openid) {
  if (!activityId) return null;
  const res = await db.collection(C_MEM)
    .where({ activityId, openid })
    .limit(1)
    .get();
  return res.data.length ? res.data[0] : null;
}

// 读取当前用户资料（昵称/头像）
async function getUserProfile(openid) {
  try {
    const res = await db.collection('users').where({ _openid: openid }).limit(1).get();
    if (res.data.length) {
      return { nickName: res.data[0].nickName || '微信用户', avatarUrl: res.data[0].avatarUrl || '' };
    }
  } catch (e) {
    console.warn('[splitManage] getUserProfile 失败：', e && e.errMsg || e);
  }
  return { nickName: '微信用户', avatarUrl: '' };
}

// 生成邀请码
function genInviteCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + Date.now().toString(36).slice(-4).toUpperCase();
}

// ============ 活动相关 ============

// 创建活动
async function createActivity(openid, data) {
  if (!data || !data.name) {
    return { code: -1, message: '活动名称为必填项' };
  }
  const textRes = await security.checkText(cloud, openid, data.name);
  if (!textRes.pass) return security.violationResult();

  const profile = await getUserProfile(openid);
  const inviteCode = genInviteCode();
  const now = new Date();

  const actData = {
    _openid: openid,
    name: data.name,
    coverEmoji: data.coverEmoji || '🧾',
    inviteCode,
    currency: 'CNY',
    status: 'active',
    memberCount: 1,
    totalAmount: 0,
    billCount: 0,
    createdAt: now,
    updatedAt: now
  };
  const res = await db.collection(C_ACT).add({ data: actData });

  await db.collection(C_MEM).add({
    data: {
      activityId: res._id,
      openid,
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl,
      role: 'creator',
      joinedAt: now
    }
  });

  return { code: 0, message: '创建成功', data: { _id: res._id, inviteCode } };
}

// 更新活动（仅 creator）
async function updateActivity(openid, data) {
  if (!data || !data._id) return { code: -1, message: '缺少活动ID' };
  const member = await getMember(data._id, openid);
  if (!member) return { code: -1, message: '无权访问' };
  if (member.role !== 'creator') return { code: -1, message: '仅创建者可修改活动' };

  if (data.name) {
    const textRes = await security.checkText(cloud, openid, data.name);
    if (!textRes.pass) return security.violationResult();
  }

  const update = { updatedAt: new Date() };
  if (data.name !== undefined) update.name = data.name;
  if (data.coverEmoji !== undefined) update.coverEmoji = data.coverEmoji;

  await db.collection(C_ACT).doc(data._id).update({ data: update });
  return { code: 0, message: '更新成功' };
}

// 我参与的活动列表
async function listActivities(openid, data) {
  const memRes = await db.collection(C_MEM).where({ openid }).get();
  const ids = memRes.data.map(m => m.activityId);
  if (ids.length === 0) {
    return { code: 0, data: { active: [], settled: [], summary: { activeCount: 0, pendingAmount: 0, historyCount: 0 } } };
  }

  const { data: acts } = await db.collection(C_ACT)
    .where({ _id: _.in(ids) })
    .orderBy('updatedAt', 'desc')
    .get();

  const active = acts.filter(a => a.status === 'active');
  const settled = acts.filter(a => a.status === 'settled');

  // 待结算金额：进行中活动的未结清转账总额
  let pendingAmount = 0;
  if (active.length) {
    const { data: sets } = await db.collection(C_SET)
      .where({ activityId: _.in(active.map(a => a._id)), status: 'pending' })
      .get();
    pendingAmount = sets.reduce((s, x) => s + x.amount, 0);
  }

  return {
    code: 0,
    data: {
      active,
      settled,
      summary: { activeCount: active.length, pendingAmount, historyCount: settled.length }
    }
  };
}

// 活动详情 + 成员列表
async function getActivity(openid, data) {
  if (!data || !data._id) return { code: -1, message: '缺少活动ID' };
  const member = await getMember(data._id, openid);
  if (!member) return { code: -1, message: '无权访问' };

  const { data: act } = await db.collection(C_ACT).doc(data._id).get();
  if (!act) return { code: -1, message: '活动不存在' };

  const { data: members } = await db.collection(C_MEM)
    .where({ activityId: data._id })
    .orderBy('joinedAt', 'asc')
    .get();

  // 刷新成员昵称/头像为 users 集合的最新值（成员加入后再登录/改资料时同步）
  const openids = members.map(m => m.openid);
  if (openids.length) {
    const { data: users } = await db.collection('users').where({ _openid: _.in(openids) }).get();
    const uMap = {};
    users.forEach(u => { uMap[u._openid] = u; });
    const writes = [];
    members.forEach(m => {
      const u = uMap[m.openid];
      if (!u) return;
      const newNick = u.nickName || m.nickName;
      const newAva = u.avatarUrl !== undefined ? u.avatarUrl : m.avatarUrl;
      if (newNick !== m.nickName || newAva !== m.avatarUrl) {
        m.nickName = newNick;
        m.avatarUrl = newAva;
        writes.push(db.collection(C_MEM).doc(m._id).update({ data: { nickName: newNick, avatarUrl: newAva } }));
      }
    });
    if (writes.length) await Promise.all(writes.map(p => p.catch(() => {})));
  }

  return { code: 0, data: { activity: act, members, myRole: member.role } };
}

// 加入活动（inviteCode，幂等）
async function joinActivity(openid, data) {
  if (!data || !data.activityId || !data.inviteCode) {
    return { code: -1, message: '缺少活动ID或邀请码' };
  }
  const { data: act } = await db.collection(C_ACT).doc(data.activityId).get().catch(() => ({ data: null }));
  if (!act) return { code: -1, message: '活动不存在或已删除' };
  if (act.inviteCode !== data.inviteCode) return { code: -1, message: '邀请码无效' };

  const existing = await getMember(data.activityId, openid);
  if (existing) return { code: 0, message: '已加入', data: { _id: data.activityId } };

  const profile = await getUserProfile(openid);
  await db.collection(C_MEM).add({
    data: {
      activityId: data.activityId,
      openid,
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl,
      role: 'member',
      joinedAt: new Date()
    }
  });
  await db.collection(C_ACT).doc(data.activityId).update({ data: { memberCount: _.inc(1), updatedAt: new Date() } });

  return { code: 0, message: '加入成功', data: { _id: data.activityId } };
}

// 通过邀请码加入（无需 activityId，按 inviteCode 查活动）
async function joinByCode(openid, data) {
  const code = ((data && data.inviteCode) || '').trim().toUpperCase();
  if (!code) return { code: -1, message: '请输入邀请码' };

  const { data: acts } = await db.collection(C_ACT).where({ inviteCode: code }).limit(1).get();
  if (!acts.length) return { code: -1, message: '邀请码无效，请核对后重试' };
  const act = acts[0];

  const existing = await getMember(act._id, openid);
  if (existing) return { code: 0, message: '已加入', data: { _id: act._id } };

  const profile = await getUserProfile(openid);
  await db.collection(C_MEM).add({
    data: {
      activityId: act._id,
      openid,
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl,
      role: 'member',
      joinedAt: new Date()
    }
  });
  await db.collection(C_ACT).doc(act._id).update({ data: { memberCount: _.inc(1), updatedAt: new Date() } });

  return { code: 0, message: '加入成功', data: { _id: act._id } };
}

// ============ 账单相关 ============

// 计算分摊明细：AA 均摊（余数补给前几名），或校验自定义 splits
function buildSplits(amount, isAA, participants, customSplits) {
  if (isAA) {
    const n = participants.length;
    const base = Math.floor(amount / n);
    const remainder = amount - base * n;
    return participants.map((id, idx) => ({ memberId: id, amount: base + (idx < remainder ? 1 : 0) }));
  }
  // 自定义：直接使用传入 splits
  return customSplits.map(s => ({ memberId: s.memberId, amount: Number(s.amount) }));
}

// 校验账单入参，返回 { ok, msg, amount, splits, participants }
function validateBillInput(data) {
  const amount = Number(data.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, msg: '金额必须为正整数（单位：分）' };
  }
  if (!VALID_CATEGORIES.includes(data.category)) {
    return { ok: false, msg: '无效的消费分类' };
  }
  const participants = Array.isArray(data.participants) ? data.participants : [];
  if (participants.length === 0) {
    return { ok: false, msg: '请至少选择一名参与成员' };
  }
  const isAA = data.isAA !== false;
  let splits;
  if (isAA) {
    splits = buildSplits(amount, true, participants);
  } else {
    const custom = Array.isArray(data.splits) ? data.splits : [];
    if (custom.length === 0) return { ok: false, msg: '请填写自定义分摊金额' };
    const sum = custom.reduce((s, x) => s + Number(x.amount || 0), 0);
    if (sum !== amount) return { ok: false, msg: '分摊金额合计必须等于账单金额' };
    splits = buildSplits(amount, false, participants, custom);
  }
  return { ok: true, amount, splits, participants, isAA };
}

// 添加账单
async function addBill(openid, data) {
  if (!data || !data.activityId || !data.title || data.amount === undefined) {
    return { code: -1, message: '活动ID、金额、描述为必填项' };
  }
  const member = await getMember(data.activityId, openid);
  if (!member) return { code: -1, message: '无权操作' };

  const v = validateBillInput(data);
  if (!v.ok) return { code: -1, message: v.msg };

  const textRes = await security.checkText(cloud, openid, data.title);
  if (!textRes.pass) return security.violationResult();

  const payerId = data.payerId || openid;
  const now = new Date();
  const billData = {
    _openid: openid,
    activityId: data.activityId,
    category: data.category,
    title: data.title,
    amount: v.amount,
    payerId,
    payerName: data.payerName || '',
    isAA: v.isAA,
    participants: v.participants,
    splits: v.splits,
    billDate: data.billDate ? new Date(data.billDate) : now,
    createdAt: now
  };
  const res = await db.collection(C_BILL).add({ data: billData });

  await db.collection(C_ACT).doc(data.activityId).update({
    data: { totalAmount: _.inc(v.amount), billCount: _.inc(1), updatedAt: now }
  });

  return { code: 0, message: '添加成功', data: { _id: res._id } };
}

// 更新账单（记录人或 creator）
async function updateBill(openid, data) {
  if (!data || !data._id) return { code: -1, message: '缺少账单ID' };
  const { data: bill } = await db.collection(C_BILL).doc(data._id).get().catch(() => ({ data: null }));
  if (!bill) return { code: -1, message: '账单不存在' };

  const member = await getMember(bill.activityId, openid);
  if (!member) return { code: -1, message: '无权操作' };
  if (bill._openid !== openid && member.role !== 'creator') {
    return { code: -1, message: '仅记录人或创建者可修改' };
  }

  const v = validateBillInput({
    amount: data.amount !== undefined ? data.amount : bill.amount,
    category: data.category !== undefined ? data.category : bill.category,
    participants: data.participants !== undefined ? data.participants : bill.participants,
    isAA: data.isAA !== undefined ? data.isAA : bill.isAA,
    splits: data.splits !== undefined ? data.splits : bill.splits
  });
  if (!v.ok) return { code: -1, message: v.msg };

  if (data.title !== undefined) {
    const textRes = await security.checkText(cloud, openid, data.title);
    if (!textRes.pass) return security.violationResult();
  }

  const update = {
    amount: v.amount,
    participants: v.participants,
    isAA: v.isAA,
    splits: v.splits
  };
  if (data.category !== undefined) update.category = data.category;
  if (data.title !== undefined) update.title = data.title;
  if (data.payerId !== undefined) update.payerId = data.payerId;
  if (data.payerName !== undefined) update.payerName = data.payerName;
  if (data.billDate !== undefined) update.billDate = new Date(data.billDate);

  await db.collection(C_BILL).doc(data._id).update({ data: update });

  // 同步活动 totalAmount 差额
  const diff = v.amount - bill.amount;
  if (diff !== 0) {
    await db.collection(C_ACT).doc(bill.activityId).update({ data: { totalAmount: _.inc(diff), updatedAt: new Date() } });
  }

  return { code: 0, message: '更新成功' };
}

// 删除账单
async function deleteBill(openid, data) {
  if (!data || !data._id) return { code: -1, message: '缺少账单ID' };
  const { data: bill } = await db.collection(C_BILL).doc(data._id).get().catch(() => ({ data: null }));
  if (!bill) return { code: -1, message: '账单不存在' };

  const member = await getMember(bill.activityId, openid);
  if (!member) return { code: -1, message: '无权操作' };
  if (bill._openid !== openid && member.role !== 'creator') {
    return { code: -1, message: '仅记录人或创建者可删除' };
  }

  await db.collection(C_BILL).doc(data._id).remove();
  await db.collection(C_ACT).doc(bill.activityId).update({
    data: { totalAmount: _.inc(-bill.amount), billCount: _.inc(-1), updatedAt: new Date() }
  });

  return { code: 0, message: '删除成功' };
}

// 账单列表（按日期倒序）
async function listBills(openid, data) {
  if (!data || !data.activityId) return { code: -1, message: '缺少活动ID' };
  const member = await getMember(data.activityId, openid);
  if (!member) return { code: -1, message: '无权访问' };

  const { data: bills } = await db.collection(C_BILL)
    .where({ activityId: data.activityId })
    .orderBy('billDate', 'desc')
    .orderBy('createdAt', 'desc')
    .limit(data.limit || 200)
    .get();

  return { code: 0, data: bills };
}

// ============ 结算与统计 ============

// 生成结算清单（贪心双指针，最小化转账笔数）
async function calcSettlement(openid, data) {
  if (!data || !data.activityId) return { code: -1, message: '缺少活动ID' };
  const member = await getMember(data.activityId, openid);
  if (!member) return { code: -1, message: '无权访问' };

  const { data: bills } = await db.collection(C_BILL).where({ activityId: data.activityId }).get();

  // 1. 汇总每人净余额（分）
  const net = {};
  for (const b of bills) {
    net[b.payerId] = (net[b.payerId] || 0) + b.amount;
    for (const s of (b.splits || [])) {
      net[s.memberId] = (net[s.memberId] || 0) - s.amount;
    }
  }

  // 2. 债权人 / 债务人降序
  const creditors = [], debtors = [];
  for (const [id, bal] of Object.entries(net)) {
    if (bal > 0) creditors.push({ id, amount: bal });
    else if (bal < 0) debtors.push({ id, amount: -bal });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // 3. 双指针配对
  const now = new Date();
  const items = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const pay = Math.min(creditors[i].amount, debtors[j].amount);
    if (pay > 0) {
      items.push({
        activityId: data.activityId,
        fromOpenid: debtors[j].id,
        toOpenid: creditors[i].id,
        amount: pay,
        status: 'pending',
        paidAt: null,
        createdAt: now
      });
    }
    creditors[i].amount -= pay;
    debtors[j].amount -= pay;
    if (creditors[i].amount === 0) i++;
    if (debtors[j].amount === 0) j++;
  }

  // 4. 覆盖写入
  await db.collection(C_SET).where({ activityId: data.activityId }).remove();
  for (const it of items) {
    await db.collection(C_SET).add({ data: it });
  }

  return { code: 0, message: '结算完成', data: { count: items.length } };
}

// 结算清单 + 进度
async function listSettlements(openid, data) {
  if (!data || !data.activityId) return { code: -1, message: '缺少活动ID' };
  const member = await getMember(data.activityId, openid);
  if (!member) return { code: -1, message: '无权访问' };

  const { data: sets } = await db.collection(C_SET)
    .where({ activityId: data.activityId })
    .orderBy('createdAt', 'asc')
    .get();

  const paid = sets.filter(s => s.status === 'paid').length;
  return { code: 0, data: { settlements: sets, total: sets.length, paid } };
}

// 标记还款（全部结清则活动置 settled）
async function markPaid(openid, data) {
  if (!data || !data._id) return { code: -1, message: '缺少结算ID' };
  const { data: set } = await db.collection(C_SET).doc(data._id).get().catch(() => ({ data: null }));
  if (!set) return { code: -1, message: '结算记录不存在' };

  const member = await getMember(set.activityId, openid);
  if (!member) return { code: -1, message: '无权操作' };

  const nextStatus = data.status === 'pending' ? 'pending' : 'paid';
  await db.collection(C_SET).doc(data._id).update({
    data: { status: nextStatus, paidAt: nextStatus === 'paid' ? new Date() : null }
  });

  // 复核是否全部结清
  const remain = await db.collection(C_SET)
    .where({ activityId: set.activityId, status: 'pending' })
    .count();
  const total = await db.collection(C_SET).where({ activityId: set.activityId }).count();
  const allPaid = total.total > 0 && remain.total === 0;
  await db.collection(C_ACT).doc(set.activityId).update({
    data: { status: allPaid ? 'settled' : 'active', updatedAt: new Date() }
  });

  return { code: 0, message: '操作成功', data: { allSettled: allPaid } };
}

// 统计：分类占比 + 各成员应付
async function getStats(openid, data) {
  if (!data || !data.activityId) return { code: -1, message: '缺少活动ID' };
  const member = await getMember(data.activityId, openid);
  if (!member) return { code: -1, message: '无权访问' };

  const { data: bills } = await db.collection(C_BILL).where({ activityId: data.activityId }).get();
  const { data: members } = await db.collection(C_MEM).where({ activityId: data.activityId }).get();

  const total = bills.reduce((s, b) => s + b.amount, 0);

  // 分类占比
  const catMap = {};
  bills.forEach(b => { catMap[b.category] = (catMap[b.category] || 0) + b.amount; });
  const categoryStats = Object.entries(catMap)
    .map(([category, amount]) => ({ category, amount, percent: total > 0 ? Math.round(amount / total * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);

  // 各成员应付（分摊合计）
  const oweMap = {};
  bills.forEach(b => {
    (b.splits || []).forEach(s => { oweMap[s.memberId] = (oweMap[s.memberId] || 0) + s.amount; });
  });
  const memberStats = members.map(m => ({
    openid: m.openid,
    nickName: m.nickName,
    avatarUrl: m.avatarUrl,
    owe: oweMap[m.openid] || 0
  })).sort((a, b) => b.owe - a.owe);

  return {
    code: 0,
    data: {
      total,
      avg: members.length ? Math.round(total / members.length) : 0,
      billCount: bills.length,
      memberCount: members.length,
      categoryStats,
      memberStats
    }
  };
}
