// cloudfunctions/mealManage/index.js —— 来我家吃饭模块统一云函数（合并原 login/family/dish/meal/initData）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const COL_U = 'meal_users';

// 获取当前用户（按 openid 查 meal_users，不存在则懒创建）
async function getMe() {
  const { OPENID } = cloud.getWXContext();
  const col = db.collection(COL_U);
  const r = await col.where({ openid: OPENID }).get();
  if (r.data.length) return r.data[0];
  const add = await col.add({
    data: { openid: OPENID, nickName: '干饭人', avatarUrl: '', createdAt: db.serverDate(), updatedAt: db.serverDate() }
  });
  return { _id: add._id, openid: OPENID, nickName: '干饭人', avatarUrl: '' };
}

// 我在某家庭的有效成员关系
async function myMembership(familyId, userId) {
  const r = await db.collection('meal_memberships').where({ familyId, userId, status: 1 }).get();
  return r.data[0] || null;
}

const helpers = { myMembership };
const familyActions = require('./family.js')(db, _, helpers);
const dishActions = require('./dish.js')(db, _, helpers);
const mealActions = require('./meal.js')(db, _, helpers);

// 同步宿主昵称/头像进 meal_users，保证成员展示真实昵称
async function syncProfile(event, me) {
  const data = {};
  if (event.nickName) data.nickName = event.nickName;
  if (event.avatarUrl) data.avatarUrl = event.avatarUrl;
  if (Object.keys(data).length) {
    data.updatedAt = db.serverDate();
    await db.collection(COL_U).doc(me._id).update({ data });
  }
  return { ok: true };
}

// 初始化系统食材库 / 口味库（部署后手动触发一次：action=base.seed）
const INGREDIENTS = [
  { name: '番茄', emoji: '🍅', category: '蔬菜', sort: 10 },
  { name: '青菜', emoji: '🥬', category: '蔬菜', sort: 11 },
  { name: '土豆', emoji: '🥔', category: '蔬菜', sort: 12 },
  { name: '茄子', emoji: '🍆', category: '蔬菜', sort: 13 },
  { name: '青椒', emoji: '🫑', category: '蔬菜', sort: 14 },
  { name: '玉米', emoji: '🌽', category: '蔬菜', sort: 15 },
  { name: '西兰花', emoji: '🥦', category: '蔬菜', sort: 16 },
  { name: '胡萝卜', emoji: '🥕', category: '蔬菜', sort: 17 },
  { name: '黄瓜', emoji: '🥒', category: '蔬菜', sort: 18 },
  { name: '蘑菇', emoji: '🍄', category: '蔬菜', sort: 19 },
  { name: '洋葱', emoji: '🧅', category: '蔬菜', sort: 20 },
  { name: '菠菜', emoji: '🥬', category: '蔬菜', sort: 21 },
  { name: '白菜', emoji: '🥬', category: '蔬菜', sort: 22 },
  { name: '生菜', emoji: '🥗', category: '蔬菜', sort: 23 },
  { name: '豆角', emoji: '🫛', category: '蔬菜', sort: 24 },
  { name: '冬瓜', emoji: '🥒', category: '蔬菜', sort: 25 },
  { name: '南瓜', emoji: '🎃', category: '蔬菜', sort: 26 },
  { name: '莲藕', emoji: '🪷', category: '蔬菜', sort: 27 },
  { name: '芹菜', emoji: '🌿', category: '蔬菜', sort: 28 },
  { name: '韭菜', emoji: '🌱', category: '蔬菜', sort: 29 },
  { name: '豆腐', emoji: '🧈', category: '蔬菜', sort: 30 },
  { name: '山药', emoji: '🥔', category: '蔬菜', sort: 31 },
  { name: '鸡肉', emoji: '🐔', category: '肉类', sort: 40 },
  { name: '猪肉', emoji: '🥩', category: '肉类', sort: 41 },
  { name: '牛肉', emoji: '🐄', category: '肉类', sort: 42 },
  { name: '羊肉', emoji: '🐑', category: '肉类', sort: 43 },
  { name: '鸭肉', emoji: '🦆', category: '肉类', sort: 44 },
  { name: '培根', emoji: '🥓', category: '肉类', sort: 45 },
  { name: '香肠', emoji: '🌭', category: '肉类', sort: 46 },
  { name: '排骨', emoji: '🍖', category: '肉类', sort: 47 },
  { name: '鸡翅', emoji: '🍗', category: '肉类', sort: 48 },
  { name: '肉丸', emoji: '🧆', category: '肉类', sort: 49 },
  { name: '虾', emoji: '🦐', category: '水产', sort: 50 },
  { name: '鱼', emoji: '🐟', category: '水产', sort: 51 },
  { name: '螃蟹', emoji: '🦀', category: '水产', sort: 52 },
  { name: '鱿鱼', emoji: '🦑', category: '水产', sort: 53 },
  { name: '蛤蜊', emoji: '🦪', category: '水产', sort: 54 },
  { name: '扇贝', emoji: '🐚', category: '水产', sort: 55 },
  { name: '龙虾', emoji: '🦞', category: '水产', sort: 56 },
  { name: '带鱼', emoji: '🐟', category: '水产', sort: 57 },
  { name: '鸡蛋', emoji: '🥚', category: '蛋奶', sort: 60 },
  { name: '牛奶', emoji: '🥛', category: '蛋奶', sort: 61 },
  { name: '奶酪', emoji: '🧀', category: '蛋奶', sort: 62 },
  { name: '黄油', emoji: '🧈', category: '蛋奶', sort: 63 },
  { name: '酸奶', emoji: '🥛', category: '蛋奶', sort: 64 },
  { name: '米饭', emoji: '🍚', category: '主食', sort: 70 },
  { name: '面条', emoji: '🍜', category: '主食', sort: 71 },
  { name: '面包', emoji: '🍞', category: '主食', sort: 72 },
  { name: '饺子', emoji: '🥟', category: '主食', sort: 73 },
  { name: '馒头', emoji: '🍞', category: '主食', sort: 74 },
  { name: '粥', emoji: '🥣', category: '主食', sort: 75 },
  { name: '年糕', emoji: '🍡', category: '主食', sort: 76 },
  { name: '米粉', emoji: '🍜', category: '主食', sort: 77 },
  { name: '盐', emoji: '🧂', category: '调料', sort: 80 },
  { name: '酱油', emoji: '🥢', category: '调料', sort: 81 },
  { name: '食用油', emoji: '🫗', category: '调料', sort: 82 },
  { name: '大蒜', emoji: '🧄', category: '调料', sort: 83 },
  { name: '生姜', emoji: '🫚', category: '调料', sort: 84 },
  { name: '小葱', emoji: '🧅', category: '调料', sort: 85 },
  { name: '醋', emoji: '🍶', category: '调料', sort: 86 },
  { name: '糖', emoji: '🍬', category: '调料', sort: 87 },
  { name: '蚝油', emoji: '🦪', category: '调料', sort: 88 },
  { name: '辣椒', emoji: '🌶️', category: '调料', sort: 89 },
  { name: '花椒', emoji: '🌰', category: '调料', sort: 90 },
  { name: '八角', emoji: '🌟', category: '调料', sort: 91 },
  { name: '料酒', emoji: '🍶', category: '调料', sort: 92 }
];

const TASTES = [
  { name: '酸', emoji: '😖', sort: 1 },
  { name: '甜', emoji: '😋', sort: 2 },
  { name: '苦', emoji: '😣', sort: 3 },
  { name: '辣', emoji: '🥵', sort: 4 },
  { name: '咸', emoji: '🧂', sort: 5 },
  { name: '鲜', emoji: '😛', sort: 6 },
  { name: '麻', emoji: '🌀', sort: 7 },
  { name: '香', emoji: '😚', sort: 8 },
  { name: '清淡', emoji: '🍃', sort: 9 },
  { name: '重口', emoji: '🔥', sort: 10 },
  { name: '蒜香', emoji: '🧄', sort: 11 },
  { name: '孜然', emoji: '🫘', sort: 12 },
  { name: '糖醋', emoji: '🍯', sort: 13 },
  { name: '五香', emoji: '🌟', sort: 14 }
];

async function resetCol(col, rows) {
  let total;
  do {
    const r = await db.collection(col).limit(100).get();
    total = r.data.length;
    for (const d of r.data) await db.collection(col).doc(d._id).remove();
  } while (total === 100);
  for (const row of rows) await db.collection(col).add({ data: row });
  return rows.length;
}

async function seedBaseData() {
  const ing = await resetCol('meal_ingredients', INGREDIENTS);
  const taste = await resetCol('meal_tastes', TASTES);
  return { code: 0, msg: `已初始化 ${ing} 种食材、${taste} 种口味` };
}

exports.main = async (event) => {
  try {
    const action = event.action || '';
    if (action === 'base.seed') return await seedBaseData();
    const me = await getMe();
    if (action === 'user.syncProfile') return { code: 0, data: await syncProfile(event, me) };
    const dot = action.indexOf('.');
    const domain = dot >= 0 ? action.slice(0, dot) : '';
    const name = dot >= 0 ? action.slice(dot + 1) : '';
    const table = { family: familyActions, dish: dishActions, meal: mealActions }[domain];
    const fn = table && table[name];
    if (!fn) return { code: 404, msg: '未知操作' };
    return { code: 0, data: await fn(event, me) };
  } catch (e) {
    return { code: e.code || 500, msg: e.msg || e.message || '服务异常' };
  }
};
