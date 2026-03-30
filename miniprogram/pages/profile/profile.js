const { showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    userInfo: {},
    petCount: 0,
    recordCount: 0,
    billCount: 0,
    pets: [],
    currentPetId: '',
    showPetList: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    this.loadUserInfo();
    this.loadStats();
    this.loadPets();
  },

  // 加载用户信息
  async loadUserInfo() {
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo });
    } else {
      // 等待初始化完成
      app.userInfoReadyCallback = (userInfo) => {
        this.setData({ userInfo });
      };
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      const db = wx.cloud.database();

      // 宠物数量
      const { total: petCount } = await db.collection('pets')
        .where({ status: 'active' })
        .count();

      // 记录数量
      const { total: recordCount } = await db.collection('records').count();

      // 账单数量
      const { total: billCount } = await db.collection('bills').count();

      this.setData({ petCount, recordCount, billCount });
    } catch (err) {
      console.error('加载统计失败：', err);
    }
  },

  // 加载宠物列表
  async loadPets() {
    try {
      const app = getApp();
      const db = wx.cloud.database();
      const { data: pets } = await db.collection('pets')
        .where({ status: 'active' })
        .orderBy('createdAt', 'asc')
        .get();

      let currentPetId = app.globalData.currentPetId;
      if (!currentPetId || !pets.find(p => p._id === currentPetId)) {
        currentPetId = pets.length ? pets[0]._id : '';
        if (currentPetId) app.globalData.currentPetId = currentPetId;
      }

      this.setData({ pets, currentPetId });
    } catch (err) {
      console.error('加载宠物列表失败：', err);
    }
  },

  // 切换宠物（来自宠物卡片 bindtap）
  onSwitchPet(e) {
    const petId = e.currentTarget.dataset.petId || e.detail?.petId;
    if (!petId) return;
    const app = getApp();
    this.setData({ currentPetId: petId });
    app.globalData.currentPetId = petId;
    app.switchPet(petId);
  },

  // 编辑宠物（来自 pet-switcher 的 edit 事件）
  onEditPet(e) {
    const { petId } = e.detail;
    wx.navigateTo({
      url: `/pages/pet-edit/pet-edit?mode=edit&id=${petId}`
    });
  },

  // 登录
  onLogin() {
    if (this.data.userInfo && this.data.userInfo.nickName && this.data.userInfo.nickName !== '宠物主人') {
      return; // 已登录
    }

    wx.getUserProfile({
      desc: '用于展示个人信息',
      success: async (res) => {
        const { nickName, avatarUrl } = res.userInfo;
        try {
          const app = getApp();
          const db = wx.cloud.database();

          // 更新用户信息
          const { data: users } = await db.collection('users')
            .where({ _openid: app.globalData.openid })
            .limit(1)
            .get();

          if (users.length > 0) {
            await db.collection('users').doc(users[0]._id).update({
              data: { nickName, avatarUrl, updatedAt: new Date() }
            });
          }

          const userInfo = { ...this.data.userInfo, nickName, avatarUrl };
          this.setData({ userInfo });
          app.globalData.userInfo = userInfo;

          showSuccess('登录成功');
        } catch (err) {
          console.error('更新用户信息失败：', err);
          showError('登录失败');
        }
      },
      fail: () => {
        // 用户拒绝授权
      }
    });
  },

  // 我的宠物
  async goMyPets() {
    showLoading('加载中...');
    try {
      const db = wx.cloud.database();
      const { data: pets } = await db.collection('pets')
        .where({ status: 'active' })
        .orderBy('createdAt', 'asc')
        .get();

      this.setData({ pets, showPetList: true });
    } catch (err) {
      console.error('加载宠物列表失败：', err);
      showError('加载失败');
    }
    hideLoading();
  },

  hidePetList() {
    this.setData({ showPetList: false });
  },

  // 编辑宠物
  editPet(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ showPetList: false });
    wx.navigateTo({
      url: `/pages/pet-edit/pet-edit?mode=edit&id=${id}`
    });
  },

  // 添加宠物
  addPet() {
    this.setData({ showPetList: false });
    wx.navigateTo({
      url: '/pages/pet-edit/pet-edit?mode=add'
    });
  },

  // 消费统计
  goStats() {
    wx.navigateTo({
      url: '/pages/bill/bill-stats/bill-stats'
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除本地缓存数据吗？不会影响云端数据。',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          showSuccess('缓存已清除');
        }
      }
    });
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于宠物管家',
      content: '宠物管家 v1.0.0\n\n一站式宠物生活管理小程序，帮助您记录毛孩子的成长点滴、管理日常事务、追踪健康记录和消费账单。\n\n用爱陪伴，用心记录 🐾',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后需要重新授权，确定退出吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const app = getApp();
            const db = wx.cloud.database();
            const { data: users } = await db.collection('users')
              .where({ _openid: app.globalData.openid })
              .limit(1)
              .get();

            if (users.length > 0) {
              await db.collection('users').doc(users[0]._id).update({
                data: {
                  nickName: '宠物主人',
                  avatarUrl: '',
                  updatedAt: new Date()
                }
              });
            }

            app.globalData.userInfo = {
              ...app.globalData.userInfo,
              nickName: '宠物主人',
              avatarUrl: ''
            };

            this.setData({
              userInfo: app.globalData.userInfo
            });

            wx.clearStorageSync();
            showSuccess('已退出');
          } catch (err) {
            console.error('退出登录失败：', err);
            showError('操作失败');
          }
        }
      }
    });
  }
});