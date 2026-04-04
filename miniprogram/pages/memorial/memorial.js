const { showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    activeTab: 0,
    // 我的纪念
    myMemorials: [],
    // 随机探访
    randomPet: null,
    randomBlessings: [],
    blessingInput: '',
    blessingLength: 0,
    excludedIds: [],
    loadingRandom: false,
    submitting: false
  },

  onShow() {
    if (this.data.activeTab === 0) {
      this.loadMyMemorials();
    }
  },

  // Tab 切换
  onTabChange(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (index === this.data.activeTab) return;
    this.setData({ activeTab: index });

    if (index === 0) {
      this.loadMyMemorials();
    } else if (index === 1 && !this.data.randomPet) {
      this.loadRandom();
    }
  },

  // 加载我的纪念列表
  async loadMyMemorials() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'memorialManage',
        data: { action: 'list' }
      });
      if (res.result && res.result.code === 0) {
        this.setData({ myMemorials: res.result.data });
      }
    } catch (err) {
      console.error('加载纪念列表失败：', err);
    }
  },

  // 跳转祝福详情页
  goBlessingDetail(e) {
    const { id, name, avatar, count } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/memorial/blessing-detail/blessing-detail?memorialPetId=${id}&petName=${encodeURIComponent(name)}&petAvatar=${encodeURIComponent(avatar || '')}&blessingsCount=${count}`
    });
  },

  // 跳转新增纪念宠物页
  goAddMemorial() {
    wx.navigateTo({ url: '/pages/memorial/memorial-add/memorial-add' });
  },

  // 加载随机宠物
  async loadRandom() {
    if (this.data.loadingRandom) return;
    this.setData({ loadingRandom: true, blessingInput: '', blessingLength: 0 });

    try {
      const res = await wx.cloud.callFunction({
        name: 'memorialManage',
        data: {
          action: 'getRandom',
          data: { excludeIds: this.data.excludedIds }
        }
      });

      if (res.result && res.result.code === 0) {
        const { pet, blessings } = res.result.data;
        // 记录已展示的 id
        const excludedIds = this.data.excludedIds.concat([pet._id]);
        this.setData({
          randomPet: pet,
          randomBlessings: blessings || [],
          excludedIds: excludedIds
        });
      } else {
        // code === 1：暂无其他宠物
        this.setData({ randomPet: null, randomBlessings: [] });
      }
    } catch (err) {
      console.error('随机获取失败：', err);
      showError('加载失败，请重试');
    }

    this.setData({ loadingRandom: false });
  },

  // 祝福语输入
  onBlessingInput(e) {
    const val = e.detail.value;
    this.setData({
      blessingInput: val,
      blessingLength: val.length
    });
  },

  // 发送祝福
  async onSendBlessing() {
    const { blessingInput, randomPet, submitting } = this.data;
    if (submitting || !blessingInput || !blessingInput.trim()) return;
    if (!randomPet) return;

    // 检查是否游客（昵称为「未知游客」表示游客）
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    if (!userInfo || !userInfo.nickName || userInfo.nickName === '未知游客') {
      wx.showToast({ title: '请先登录后再留言', icon: 'none', duration: 2000 });
      return;
    }

    this.setData({ submitting: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'memorialManage',
        data: {
          action: 'addBlessing',
          data: {
            memorialPetId: randomPet._id,
            content: blessingInput.trim()
          }
        }
      });

      if (res.result && res.result.code === 0) {
        showSuccess(res.result.message || '祝福已送出');
        this.setData({ blessingInput: '', blessingLength: 0 });
        // 刷新祝福列表和计数
        await this.refreshBlessings(randomPet._id, res.result.isNew);
      } else {
        showError(res.result ? res.result.message : '操作失败');
      }
    } catch (err) {
      console.error('发送祝福失败：', err);
      showError('发送失败，请重试');
    }

    this.setData({ submitting: false });
  },

  // 刷新当前宠物的祝福列表
  async refreshBlessings(memorialPetId, isNew) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'memorialManage',
        data: { action: 'getBlessings', data: { memorialPetId: memorialPetId, limit: 5 } }
      });
      if (res.result && res.result.code === 0) {
        const pet = this.data.randomPet;
        if (pet && isNew) {
          pet.blessingsCount = (pet.blessingsCount || 0) + 1;
        }
        this.setData({
          randomBlessings: res.result.data,
          randomPet: pet
        });
      }
    } catch (err) {
      console.error('刷新祝福列表失败：', err);
    }
  }
});
