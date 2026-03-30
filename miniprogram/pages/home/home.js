const { daysBetween, formatDate } = require('../../utils/util');
const { RECORD_TYPE_MAP } = require('../../utils/constants');

// 将宠物对象中的 Date 字段序列化为 ISO 字符串，避免 setData 跨线程传输时 Date → {} 的问题
function serializePet(pet) {
  if (!pet) return pet;
  const result = { ...pet };
  ['birthday', 'adoptDate', 'createdAt', 'updatedAt'].forEach(key => {
    if (result[key] instanceof Date) {
      result[key] = result[key].toISOString();
    }
  });
  return result;
}

Page({
  data: {
    pets: [],
    currentPetId: '',
    currentPet: null,
    upcomingReminders: [],
    loaded: false,
    statusBarHeight: 20
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20
      });
    } catch (err) {
      console.error('读取状态栏高度失败：', err);
      this.setData({ statusBarHeight: 20 });
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.loadData();
  },

  // 加载所有数据
  async loadData() {
    try {
      const app = getApp();
      const db = wx.cloud.database();

      // 获取宠物列表
      const { data: pets } = await db.collection('pets')
        .where({ status: 'active' })
        .orderBy('createdAt', 'asc')
        .get();

      if (pets.length === 0) {
        this.setData({ pets: [], currentPet: null, loaded: true });
        return;
      }

      // 确定当前选中的宠物
      let currentPetId = app.globalData.currentPetId;
      if (!currentPetId || !pets.find(p => p._id === currentPetId)) {
        currentPetId = pets[0]._id;
        app.globalData.currentPetId = currentPetId;
      }

      const currentPet = pets.find(p => p._id === currentPetId) || pets[0];

      this.setData({
        pets,
        currentPetId,
        currentPet: serializePet(currentPet),
        loaded: true
      });

      // 加载近期提醒
      this.loadReminders(currentPetId);
    } catch (err) {
      console.error('加载首页数据失败：', err);
      this.setData({ loaded: true });
    }
  },

  // 加载近期提醒（来自 records 表中有 nextDate 的记录）
  async loadReminders(petId) {
    try {
      const db = wx.cloud.database();
      const _ = db.command;
      const now = new Date();

      const { data: reminders } = await db.collection('records')
        .where({
          petId,
          nextDate: _.gte(now)
        })
        .orderBy('nextDate', 'asc')
        .limit(3)
        .get();

      // 格式化提醒数据
      const upcomingReminders = reminders.map(r => {
        const typeInfo = RECORD_TYPE_MAP[r.type] || {};
        const daysLeft = daysBetween(now, r.nextDate);
        const tagClassMap = {
          deworm: 'tag-success',
          checkup: 'tag-info',
          vaccine: 'tag-warning',
          bath: 'tag-purple'
        };

        return {
          ...r,
          typeLabel: typeInfo.label || r.type,
          typeColor: typeInfo.color || '#999',
          tagClass: tagClassMap[r.type] || 'tag-primary',
          nextDateStr: formatDate(r.nextDate, 'MM-DD'),
          daysLeft
        };
      });

      this.setData({ upcomingReminders });
    } catch (err) {
      console.error('加载提醒失败：', err);
    }
  },

  // 切换宠物
  async onSwitchPet(e) {
    const { petId } = e.detail;
    const app = getApp();

    this.setData({ currentPetId: petId });
    app.globalData.currentPetId = petId;

    const currentPet = this.data.pets.find(p => p._id === petId);
    this.setData({ currentPet: serializePet(currentPet) });

    // 更新数据库中的 currentPetId
    app.switchPet(petId);

    // 刷新提醒
    this.loadReminders(petId);
  },

  // 编辑宠物
  onEditPet(e) {
    const { petId } = e.detail;
    wx.navigateTo({
      url: `/pages/pet-edit/pet-edit?mode=edit&id=${petId}`
    });
  },

  // 添加宠物
  goAddPet() {
    wx.navigateTo({
      url: '/pages/pet-edit/pet-edit?mode=add'
    });
  },

  // 快捷入口 - 清单
  goChecklist() {
    wx.switchTab({ url: '/pages/checklist/checklist' });
  },

  // 快捷入口 - 记录
  goRecord() {
    wx.switchTab({ url: '/pages/record/record' });
  },

  // 快捷入口 - 账单
  goBill() {
    wx.switchTab({ url: '/pages/bill/bill' });
  },

  // 快捷入口 - 体重记录（跳转编辑当前宠物）
  goEditWeight() {
    if (this.data.currentPetId) {
      wx.navigateTo({
        url: `/pages/pet-edit/pet-edit?mode=edit&id=${this.data.currentPetId}`
      });
    }
  }
});