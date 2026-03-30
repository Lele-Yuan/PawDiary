const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 系统预设清单模板
const DEFAULT_TEMPLATES = [
  {
    title: '接宠物必备',
    icon: '🏠',
    description: '迎接新成员回家前的必备物品清单',
    isSystem: true,
    sortOrder: 1,
    items: [
      { name: '猫粮/狗粮', category: 'food' },
      { name: '食碗水碗', category: 'daily' },
      { name: '猫砂/尿垫', category: 'daily' },
      { name: '航空箱', category: 'daily' },
      { name: '玩具', category: 'toy' },
      { name: '牵引绳', category: 'daily' },
      { name: '项圈', category: 'daily' },
      { name: '驱虫药', category: 'medical' },
      { name: '宠物沐浴露', category: 'grooming' }
    ]
  },
  {
    title: '徒步必备',
    icon: '🥾',
    description: '和毛孩子一起户外徒步需要准备的物品',
    isSystem: true,
    sortOrder: 2,
    items: [
      { name: '牵引绳', category: 'daily' },
      { name: '水壶水碗', category: 'daily' },
      { name: '零食', category: 'food' },
      { name: '拾便袋', category: 'daily' },
      { name: '急救包', category: 'medical' },
      { name: '防蚊喷雾', category: 'medical' },
      { name: '雨衣', category: 'daily' },
      { name: '脚套', category: 'daily' }
    ]
  },
  {
    title: '去医院必备',
    icon: '🏥',
    description: '带宠物去医院看诊需要准备的物品和资料',
    isSystem: true,
    sortOrder: 3,
    items: [
      { name: '病历本', category: 'medical' },
      { name: '疫苗本', category: 'medical' },
      { name: '航空箱', category: 'daily' },
      { name: '尿垫', category: 'daily' },
      { name: '零食（安抚用）', category: 'food' },
      { name: '牵引绳', category: 'daily' },
      { name: '毛巾', category: 'daily' }
    ]
  },
  {
    title: '出行必备',
    icon: '✈️',
    description: '带宠物出行旅游需要准备的物品和证件',
    isSystem: true,
    sortOrder: 4,
    items: [
      { name: '航空箱/车载笼', category: 'daily' },
      { name: '粮食', category: 'food' },
      { name: '折叠碗', category: 'daily' },
      { name: '牵引绳', category: 'daily' },
      { name: '疫苗证明', category: 'medical' },
      { name: '狂犬证', category: 'medical' },
      { name: '玩具', category: 'toy' },
      { name: '尿垫', category: 'daily' }
    ]
  }
];

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'initTemplates':
      return await initTemplates();
    case 'getTemplates':
      return await getTemplates();
    case 'createFromTemplate':
      return await createFromTemplate(OPENID, data);
    case 'create':
      return await createChecklist(OPENID, data);
    case 'update':
      return await updateChecklist(OPENID, data);
    case 'delete':
      return await deleteChecklist(OPENID, data);
    case 'list':
      return await listChecklists(OPENID, data);
    default:
      return { code: -1, message: '未知操作类型' };
  }
};

// 初始化系统预设模板（幂等操作）
async function initTemplates() {
  const countRes = await db.collection('checklist_templates')
    .where({ isSystem: true })
    .count();

  if (countRes.total > 0) {
    return { code: 0, message: '模板已存在' };
  }

  const tasks = DEFAULT_TEMPLATES.map(tpl => {
    return db.collection('checklist_templates').add({
      data: { ...tpl, createdAt: new Date() }
    });
  });

  await Promise.all(tasks);
  return { code: 0, message: '模板初始化成功' };
}

// 获取所有模板
async function getTemplates() {
  const { data: templates } = await db.collection('checklist_templates')
    .orderBy('sortOrder', 'asc')
    .get();
  return { code: 0, data: templates };
}

// 从模板创建用户清单
async function createFromTemplate(openid, data) {
  if (!data || !data.templateId || !data.petId) {
    return { code: -1, message: '缺少模板ID或宠物ID' };
  }

  // 获取模板
  const { data: template } = await db.collection('checklist_templates')
    .doc(data.templateId)
    .get();

  if (!template) {
    return { code: -1, message: '模板不存在' };
  }

  // 创建清单实例
  const checklistItems = template.items.map(item => ({
    name: item.name,
    checked: false,
    note: ''
  }));

  const res = await db.collection('checklists').add({
    data: {
      _openid: openid,
      petId: data.petId,
      templateId: data.templateId,
      title: template.title,
      icon: template.icon,
      items: checklistItems,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  return { code: 0, message: '创建成功', data: { _id: res._id } };
}

// 自定义新建清单
async function createChecklist(openid, data) {
  if (!data || !data.title || !data.petId) {
    return { code: -1, message: '清单标题和宠物ID为必填项' };
  }

  const res = await db.collection('checklists').add({
    data: {
      _openid: openid,
      petId: data.petId,
      templateId: '',
      title: data.title,
      icon: data.icon || '📋',
      items: data.items || [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  return { code: 0, message: '创建成功', data: { _id: res._id } };
}

// 更新清单（标题、项目列表等）
async function updateChecklist(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少清单ID' };
  }

  const updateData = { updatedAt: new Date() };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.items !== undefined) {
    updateData.items = data.items;
    // 自动计算进度
    const total = data.items.length;
    const checked = data.items.filter(i => i.checked).length;
    updateData.progress = total > 0 ? Math.round(checked / total * 100) : 0;
  }

  await db.collection('checklists').doc(data._id).update({ data: updateData });

  return { code: 0, message: '更新成功' };
}

// 删除清单
async function deleteChecklist(openid, data) {
  if (!data || !data._id) {
    return { code: -1, message: '缺少清单ID' };
  }

  await db.collection('checklists').doc(data._id).remove();
  return { code: 0, message: '删除成功' };
}

// 获取用户清单列表
async function listChecklists(openid, data) {
  const where = { _openid: openid };
  if (data && data.petId) {
    where.petId = data.petId;
  }

  const { data: checklists } = await db.collection('checklists')
    .where(where)
    .orderBy('createdAt', 'desc')
    .get();

  return { code: 0, data: checklists };
}