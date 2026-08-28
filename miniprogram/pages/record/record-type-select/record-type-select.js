const { RECORD_TYPE_MAP } = require('../../../utils/constants');

Page({
  data: {
    healthTypes: [
      RECORD_TYPE_MAP.weight,
      RECORD_TYPE_MAP.poop,
      RECORD_TYPE_MAP.diet,
      RECORD_TYPE_MAP.water,
      RECORD_TYPE_MAP.deworm,
      RECORD_TYPE_MAP.vaccine,
      RECORD_TYPE_MAP.checkup,
      RECORD_TYPE_MAP.illness,
      RECORD_TYPE_MAP.heat,
    ],
    groomingTypes: [
      RECORD_TYPE_MAP.bath,
      RECORD_TYPE_MAP.nail,
      RECORD_TYPE_MAP.ear,
      RECORD_TYPE_MAP.paw,
      RECORD_TYPE_MAP.gland,
      RECORD_TYPE_MAP.teeth,
      RECORD_TYPE_MAP.beauty,
    ],
    cleaningTypes: [
      RECORD_TYPE_MAP.disinfect,
      RECORD_TYPE_MAP.litter,
      RECORD_TYPE_MAP.toy,
      RECORD_TYPE_MAP.cage,
    ],
    abnormalTypes: [
      RECORD_TYPE_MAP.abnormal,
      RECORD_TYPE_MAP.trouble,
      RECORD_TYPE_MAP.stealfood,
    ],
    currentPet: null,
    allPets: []
  },

  onLoad() {
    this.loadPets();
  },

  // 加载宠物列表（仅本页使用，不改写 globalData）
  async loadPets() {
    const app = getApp();
    try {
      const res = await wx.cloud.callFunction({
        name: 'petManage',
        data: { action: 'list' }
      });
      if (res.result && res.result.code === 0) {
        const allPets = (res.result.data || []).filter(p => {
          const role = p.role || 'member';
          return role === 'creator' || role === 'admin';
        });
        const globalPetId = app.globalData.currentPetId;
        const currentPet = allPets.find(p => p._id === globalPetId) || allPets[0] || null;
        this.setData({ allPets, currentPet });
      }
    } catch (e) {
      console.error('加载宠物列表失败:', e);
    }
  },

  // 本页切换宠物（不写 globalData）
  onSwitchPet(e) {
    const { petId } = e.detail;
    const pet = this.data.allPets.find(p => p._id === petId);
    if (pet) this.setData({ currentPet: pet });
  },

  // 选择记录类型，携带当前选中的 petId
  selectType(e) {
    const type = e.currentTarget.dataset.key;
    const petId = this.data.currentPet && this.data.currentPet._id;
    const url = petId
      ? `/pages/record/record-add/record-add?type=${type}&petId=${petId}`
      : `/pages/record/record-add/record-add?type=${type}`;
    wx.navigateTo({ url });
  }
});
