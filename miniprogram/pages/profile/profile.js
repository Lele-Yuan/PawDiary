const { showLoading, hideLoading, showSuccess, showError, calcAge } = require('../../utils/util');

Page({
  data: {
    userInfo: {},
    petCount: 0,
    recordCount: 0,
    billCount: 0,
    pets: [],
    currentPetId: '',
    showPetList: false,
    navTitleOpacity: 1,
    isGuest: true,
    showLoginModal: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    this.loadUserInfo();
    this.loadStats();
    this.loadPets();
  },

  onPageScroll(e) {
    const threshold = 150;
    const opacity = Math.max(0, 1 - e.scrollTop / threshold);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    const app = getApp();
    if (app.globalData.userInfo) {
      const userInfo = app.globalData.userInfo;
      const isGuest = !userInfo.nickName || userInfo.nickName === '未知游客';
      this.setData({ userInfo, isGuest });
    } else {
      // 等待初始化完成
      app.userInfoReadyCallback = (userInfo) => {
        const isGuest = !userInfo.nickName || userInfo.nickName === '未知游客';
        this.setData({ userInfo, isGuest });
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
      const res = await wx.cloud.callFunction({
        name: 'petManage',
        data: { action: 'list' }
      });
      const pets = ((res.result && res.result.code === 0) ? res.result.data : []).map(pet => {
        return {
          ...pet,
          age: calcAge(pet.birthday) || ''
        };
      });

      let currentPetId = app.globalData.currentPetId;
      if (!currentPetId || !pets.find(p => p._id === currentPetId)) {
        currentPetId = pets.length ? pets[0]._id : '';
        if (currentPetId) app.globalData.currentPetId = currentPetId;
      }

      this.setData({ pets, currentPetId });
      console.log('pets: ', pets);
    } catch (err) {
      console.error('加载宠物列表失败：', err);
    }
  },

  // 切换宠物（来自宠物卡片 bindtap）
  async onSwitchPet(e) {
    const petId = e.currentTarget.dataset.petId || e.detail?.petId;
    if (!petId || petId === this.data.currentPetId) return;

    showLoading('切换中...');
    try {
      const app = getApp();
      this.setData({ currentPetId: petId });
      app.globalData.currentPetId = petId;

      // 等待切换完成
      await app.switchPet(petId);

      hideLoading();
      // 跳转到首页
      wx.switchTab({ url: '/pages/home/home' });
    } catch (err) {
      hideLoading();
      console.error('切换宠物失败：', err);
      showError('切换失败');
    }
  },

  // 编辑宠物（来自 pet-switcher 的 edit 事件）
  onEditPet(e) {
    const { petId } = e.detail;
    wx.navigateTo({
      url: `/pages/pet-edit/pet-edit?mode=edit&id=${petId}`
    });
  },

  // 登录 - 打开登录弹窗
  onLogin() {
    if (!this.data.isGuest) return;
    this.setData({ showLoginModal: true });
  },

  // 登录成功回调
  onLoginSuccess(e) {
    const { avatarUrl, nickName, phone } = e.detail;
    const app = getApp();

    // 更新全局状态
    const userInfo = { ...app.globalData.userInfo, avatarUrl, nickName, phone };
    app.globalData.userInfo = userInfo;

    this.setData({
      userInfo,
      isGuest: false
    });

    // 重新加载数据
    this.loadStats();
    this.loadPets();

    // 检查游客数据
    this.checkGuestData();
  },

  // 关闭登录弹窗
  onLoginClose() {
    this.setData({ showLoginModal: false });
  },

  // 检查游客期间的数据
  async checkGuestData() {
    try {
      const db = wx.cloud.database();
      const results = await Promise.all([
        db.collection('pets').where({ status: 'active' }).count(),
        db.collection('records').count(),
        db.collection('bills').count(),
        db.collection('checklists').count()
      ]);
      const total = results[0].total + results[1].total + results[2].total + results[3].total;

      if (total === 0) {
        showSuccess('登录成功');
        return;
      }

      // wx.showModal({
      //   title: '发现已有数据',
      //   content: `检测到您在游客模式下已录入 ${total} 条数据（包括宠物、记录、账单、清单），是否保留这些数据到当前账户？`,
      //   confirmText: '保留数据',
      //   cancelText: '清除数据',
      //   success: async (res) => {
      //     if (res.cancel) {
      //       showLoading('清除中...');
      //       await this.clearAllGuestData();
      //       hideLoading();
      //       this.loadStats();
      //       this.loadPets();
      //     }
      //     showSuccess('登录成功');
      //   }
      // });
    } catch (err) {
      console.error('检查游客数据失败：', err);
      showSuccess('登录成功');
    }
  },

  // 清除所有游客数据
  async clearAllGuestData() {
    try {
      const db = wx.cloud.database();
      const collections = ['pets', 'records', 'bills', 'checklists'];

      for (var i = 0; i < collections.length; i++) {
        var col = collections[i];
        var res = await db.collection(col).limit(100).get();
        for (var j = 0; j < res.data.length; j++) {
          await db.collection(col).doc(res.data[j]._id).remove();
        }
      }

      // 重置当前宠物
      const app = getApp();
      app.globalData.currentPetId = '';
      app.globalData.currentPet = null;
      this.setData({ currentPetId: '', pets: [] });
    } catch (err) {
      console.error('清除数据失败：', err);
    }
  },

  // 我的宠物
  async goMyPets() {
    showLoading('加载中...');
    try {
      const res = await wx.cloud.callFunction({
        name: 'petManage',
        data: { action: 'list' }
      });
      const pets = (res.result && res.result.code === 0) ? res.result.data : [];

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
    var app = getApp();

    // 检查是否登录
    if (!app.globalData.openid) {
      wx.showModal({
        title: '提示',
        content: '登录后可同步数据至云端，是否登录？',
        confirmText: '登录',
        cancelText: '跳过',
        success: function (res) {
          if (res.confirm) {
            // 点击登录，重新初始化用户
            app.initUser().then(function () {
              this.setData({ showPetList: false });
              wx.navigateTo({
                url: '/pages/pet-edit/pet-edit?mode=add'
              });
            }.bind(this));
          } else if (res.cancel) {
            // 点击跳过，直接跳转添加页面（本地模式）
            this.setData({ showPetList: false });
            wx.navigateTo({
              url: '/pages/pet-edit/pet-edit?mode=add'
            });
          }
        }.bind(this)
      });
      return;
    }

    this.setData({ showPetList: false });
    wx.navigateTo({
      url: '/pages/pet-edit/pet-edit?mode=add'
    });
  },

  // 纪念馆
  goMemorial() {
    wx.navigateTo({ url: '/pages/memorial/memorial' });
  },

  // 消费统计
  goStats() {
    wx.navigateTo({
      url: '/pages/bill/bill-stats/bill-stats'
    });
  },

  // 跳转地图
  goToMap() {
    wx.navigateTo({ url: '/pages/map/map' });
  },

  // 上门沟通
  goToVisit() {
    wx.navigateTo({ url: '/pages/visit/visit' });
  },

  // 客服反馈（跳转公众号文章）
  goToCustomerService() {
    wx.navigateTo({
      url: '/pages/webview/webview?url=' + encodeURIComponent('https://mp.weixin.qq.com/s/iNC9psvhJEQ_f0YWqD-O_w')
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

  // 帮助中心
  showHelp() {
    wx.showModal({
      title: '帮助中心',
      content: '如遇问题或需要帮助，请联系管理员\n\n微信号：AdminPawDiary\n\n工作时间：9:00 - 18:00',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后将恢复游客身份，已有数据不会被删除，确定退出吗？',
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
                  nickName: '',
                  avatarUrl: '',
                  phone: '',
                  updatedAt: new Date()
                }
              });
            }

            app.globalData.userInfo = {
              ...app.globalData.userInfo,
              nickName: '',
              avatarUrl: '',
              phone: ''
            };

            this.setData({
              userInfo: app.globalData.userInfo,
              isGuest: true
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
  },


  // 头像加载失败处理
  onAvatarError(e) {
    var openid = e.currentTarget.dataset.openid;
    var members = this.data.familyMembers;
    var updated = false;

    console.log('头像加载失败 openid:', openid, 'error:', e.detail);

    for (var i = 0; i < members.length; i++) {
      if (members[i]._openid === openid) {
        // 将该成员的头像 URL 设置为空字符串，触发重新渲染为默认头像
        members[i].avatarUrl = '';
        updated = true;
        break;
      }
    }

    if (updated) {
      this.setData({ familyMembers: members });
    }
  }
});