/**
 * 记录类型
 */
const RECORD_TYPES = [
  // 健康记录
  { key: 'weight', label: '体重', hideTitle: true, color: '#607D8B', icon: '⚖️' },
  { key: 'poop', label: '尿便', hideTitle: true, color: '#8D6E63', icon: '💩' },
  { key: 'diet', label: '饮食', hideTitle: true, color: '#FF7043', icon: '🍖' },
  { key: 'water', label: '喝水', hideTitle: true, color: '#42A5F5', icon: '💧' },
  { key: 'deworm', label: '驱虫', titlePlaceholder: '驱虫药名称', color: '#249654', icon: '🐜' },
  { key: 'vaccine', label: '疫苗', titlePlaceholder: '疫苗名称', color: '#F5A623', icon: '💉' },
  { key: 'checkup', label: '就医', titlePlaceholder: '就医记录', color: '#3C6663', icon: '🩺' },
  { key: 'illness', label: '给药', titlePlaceholder: '药品名称', color: '#E53935', icon: '🏥' },
  { key: 'heat', label: '发情', hideTitle: true, color: '#E91E63', icon: '💓' },
  // 洗护记录
  { key: 'bath', label: '洗澡', hideTitle: true, color: '#9C27B0', icon: '🛁' },
  { key: 'nail', label: '剪指甲', hideTitle: true, color: '#795548', icon: '💅' },
  { key: 'ear', label: '洗耳朵', hideTitle: true, color: '#8D6E63', icon: '👂' },
  { key: 'paw', label: '剃脚毛', hideTitle: true, color: '#A1887F', icon: '🐾' },
  { key: 'gland', label: '挤肛门腺', hideTitle: true, color: '#FF5722', icon: '💉' },
  { key: 'teeth', label: '刷牙', hideTitle: true, color: '#78909C', icon: '🦷' },
  { key: 'beauty', label: '美容', hideTitle: true, color: '#9C27B0', icon: '✂️' },
  // 清洁记录
  { key: 'disinfect', label: '消毒', hideTitle: true, color: '#66BB6A', icon: '🧴' },
  { key: 'litter', label: '换猫砂', titlePlaceholder: '猫砂名', color: '#D4A373', icon: '🏝️' },
  { key: 'toy', label: '洗玩具', hideTitle: true, color: '#FFA726', icon: '🧸' },
  { key: 'cage', label: '清洁窝笼', hideTitle: true, color: '#8D6E63', icon: '🏠' },
  // 异常情况
  { key: 'abnormal', label: '异常情况', titlePlaceholder: '异常情况记录', color: '#F44336', icon: '⚠️' }
];

/**
 * 记录类型映射（方便快速查找）
 */
const RECORD_TYPE_MAP = {};
RECORD_TYPES.forEach(item => {
  RECORD_TYPE_MAP[item.key] = item;
});

/**
 * 账单分类
 */
const BILL_CATEGORIES = [
  { key: 'food', label: '粮食', icon: '🍖' },
  { key: 'medical', label: '医疗', icon: '💊' },
  { key: 'toy', label: '玩具', icon: '🎾' },
  { key: 'grooming', label: '美容', icon: '✂️' },
  { key: 'daily', label: '日用', icon: '🧹' },
  { key: 'other', label: '其他', icon: '📦' }
];

/**
 * 账单分类映射
 */
const BILL_CATEGORY_MAP = {};
BILL_CATEGORIES.forEach(item => {
  BILL_CATEGORY_MAP[item.key] = item;
});

/**
 * 账单分类颜色（用于图表）
 */
const BILL_CATEGORY_COLORS = {
  food: '#FF6B35',
  medical: '#249654',
  toy: '#F5A623',
  grooming: '#9C27B0',
  daily: '#3C6663',
  other: '#607D8B'
};

/**
 * 宠物物种
 */
const PET_SPECIES = [
  { key: 'cat', label: '猫咪', icon: '🐱' },
  { key: 'dog', label: '狗狗', icon: '🐶' },
  { key: 'other', label: '其他', icon: '🐾' }
];

/**
 * 宠物性别
 */
const PET_GENDERS = [
  { key: 'male', label: '弟弟', icon: '♂' },
  { key: 'female', label: '妹妹', icon: '♀' }
];

/**
 * 系统预设清单模板
 */
const DEFAULT_CHECKLIST_TEMPLATES = [
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

/**
 * 数据库集合名
 */
const COLLECTIONS = {
  USERS: 'users',
  PETS: 'pets',
  CHECKLIST_TEMPLATES: 'checklist_templates',
  CHECKLISTS: 'checklists',
  RECORDS: 'records',
  BILLS: 'bills',
  FAMILY_MEMBERS: 'pet_members',
  PET_PLACES: 'pet_places',
  USER_LOCATIONS: 'user_locations'
};

/**
 * 家庭成员角色
 */
const MEMBER_ROLES = {
  CREATOR: 'creator',
  ADMIN: 'admin',
  MEMBER: 'member'
};

const MEMBER_ROLE_LABELS = {
  creator: '创建者',
  admin: '管理员',
  member: '成员'
};

/**
 * 宠物友好地点分类
 */
const PLACE_CATEGORIES = [
  { key: 'cafe', label: '咖啡厅', icon: '☕' },
  { key: 'park', label: '公园', icon: '🌳' },
  { key: 'hospital', label: '宠物医院', icon: '🏥' },
  { key: 'shop', label: '宠物店', icon: '🏪' },
  { key: 'restaurant', label: '餐厅', icon: '🍽️' },
  { key: 'other', label: '其他', icon: '📍' }
];

/**
 * 地点分类映射
 */
const PLACE_CATEGORY_MAP = {};
PLACE_CATEGORIES.forEach(item => {
  PLACE_CATEGORY_MAP[item.key] = item;
});

/**
 * 订阅消息模板 ID（下次提醒推送通知）
 * 需在微信公众平台「功能 → 订阅消息」申请后替换此处占位值
 */
const NOTIFY_TEMPLATE_ID = 'ZuML7GbjCpKkV5ZvAy1BSvxTa0ns0RhPEZrAGa5MnG8';

/**
 * 代铲屎遛狗 - 角色类型
 */
const CARE_ROLE_TYPES = [
  { key: 'helper', label: '临时主', desc: '我来帮忙', icon: '🙋', color: '#E8875A', bgColor: 'rgba(232,135,90,0.12)', borderColor: '#E8875A' },
  { key: 'owner', label: '需求方', desc: '我需要帮助', icon: '🐾', color: '#3C6663', bgColor: 'rgba(142,207,201,0.15)', borderColor: '#8ECFC9' }
];

/**
 * 代铲屎遛狗 - 服务类型
 */
const CARE_SERVICE_TYPES = [
  { key: 'poop', label: '铲屎', icon: '💩', bgColor: '#F5EDD0', textColor: '#6B2D1A' },
  { key: 'walk', label: '遛狗', icon: '🦮', bgColor: '#E8F5F4', textColor: '#3C6663' },
  { key: 'other', label: '异宠', icon: '🐜', bgColor: '#F0F0F0', textColor: '#555555' }
];

/**
 * 代铲屎遛狗 - 角色/服务类型映射
 */
const CARE_ROLE_MAP = {};
CARE_ROLE_TYPES.forEach(item => { CARE_ROLE_MAP[item.key] = item; });

const CARE_SERVICE_MAP = {};
CARE_SERVICE_TYPES.forEach(item => { CARE_SERVICE_MAP[item.key] = item; });

module.exports = {
  RECORD_TYPES,
  RECORD_TYPE_MAP,
  BILL_CATEGORIES,
  BILL_CATEGORY_MAP,
  BILL_CATEGORY_COLORS,
  PET_SPECIES,
  PET_GENDERS,
  DEFAULT_CHECKLIST_TEMPLATES,
  COLLECTIONS,
  MEMBER_ROLES,
  MEMBER_ROLE_LABELS,
  PLACE_CATEGORIES,
  PLACE_CATEGORY_MAP,
  NOTIFY_TEMPLATE_ID,
  CARE_ROLE_TYPES,
  CARE_SERVICE_TYPES,
  CARE_ROLE_MAP,
  CARE_SERVICE_MAP
};
