const { showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');

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
    // 登录相关
    isGuest: true,
    showLoginModal: false,
    tempAvatarUrl: '',
    tempNickName: '',
    tempPhone: ''
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
      const isGuest = !userInfo.nickName || userInfo.nickName === '宠物主人';
      this.setData({ userInfo, isGuest });
    } else {
      // 等待初始化完成
      app.userInfoReadyCallback = (userInfo) => {
        const isGuest = !userInfo.nickName || userInfo.nickName === '宠物主人';
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
      const pets = (res.result && res.result.code === 0) ? res.result.data : [];

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

  // 登录 - 打开登录弹窗
  onLogin() {
    if (!this.data.isGuest) return;
    this.setData({
      showLoginModal: true,
      tempAvatarUrl: '',
      tempNickName: '',
      tempPhone: ''
    });
  },

  // 关闭登录弹窗
  closeLoginModal() {
    this.setData({ showLoginModal: false });
  },

  // 选择头像
  onChooseAvatar(e) {
    this.setData({ tempAvatarUrl: e.detail.avatarUrl });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ tempNickName: e.detail.value });
  },

  // 获取手机号
  async onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') return;
    try {
      const res = await wx.cloud.callFunction({
        name: 'userManage',
        data: { action: 'getPhoneNumber', data: { code: e.detail.code } }
      });
      if (res.result && res.result.code === 0) {
        this.setData({ tempPhone: res.result.data.purePhoneNumber || res.result.data.phoneNumber });
        showSuccess('手机号已获取');
      } else {
        showError('获取手机号失败');
      }
    } catch (err) {
      console.error('获取手机号失败：', err);
      showError('获取手机号失败');
    }
  },

  // 确认登录
  async confirmLogin() {
    const { tempAvatarUrl, tempNickName, tempPhone } = this.data;
    if (!tempNickName || !tempNickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    showLoading('登录中...');
    try {
      const app = getApp();
      const db = wx.cloud.database();

      // 上传头像到云存储
      let avatarUrl = tempAvatarUrl;
      if (tempAvatarUrl && (tempAvatarUrl.startsWith('http://tmp') || tempAvatarUrl.startsWith('wxfile://'))) {
        const ext = tempAvatarUrl.includes('.') ? tempAvatarUrl.split('.').pop().split('?')[0] : 'jpg';
        const cloudPath = `avatars/${app.globalData.openid}_${Date.now()}.${ext}`;
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath: tempAvatarUrl
        });
        avatarUrl = uploadRes.fileID;
      }

      // 更新数据库
      const { data: users } = await db.collection('users')
        .where({ _openid: app.globalData.openid })
        .limit(1)
        .get();

      const updateData = {
        nickName: tempNickName.trim(),
        updatedAt: new Date()
      };
      // 只在上传新头像时更新 avatarUrl
      if (tempAvatarUrl && (tempAvatarUrl.startsWith('http://tmp') || tempAvatarUrl.startsWith('wxfile://'))) {
        updateData.avatarUrl = avatarUrl;
      } else if (users.length > 0 && users[0].avatarUrl) {
        // 保持原有头像不变
        updateData.avatarUrl = users[0].avatarUrl;
      } else {
        updateData.avatarUrl = '';
      }
      if (tempPhone) updateData.phone = tempPhone;

      if (users.length > 0) {
        await db.collection('users').doc(users[0]._id).update({ data: updateData });
      }

      // 更新全局状态
      const userInfo = { ...app.globalData.userInfo, ...updateData };
      app.globalData.userInfo = userInfo;
      this.setData({
        userInfo,
        isGuest: false,
        showLoginModal: false
      });

      hideLoading();

      // 检查游客数据
      await this.checkGuestData();
    } catch (err) {
      hideLoading();
      console.error('登录失败：', err);
      showError('登录失败');
    }
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

      wx.showModal({
        title: '发现已有数据',
        content: `检测到您在游客模式下已录入 ${total} 条数据（包括宠物、记录、账单、清单），是否保留这些数据到当前账户？`,
        confirmText: '保留数据',
        cancelText: '清除数据',
        success: async (res) => {
          if (res.cancel) {
            showLoading('清除中...');
            await this.clearAllGuestData();
            hideLoading();
            this.loadStats();
            this.loadPets();
          }
          showSuccess('登录成功');
        }
      });
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
                  nickName: '宠物主人',
                  avatarUrl: '',
                  phone: '',
                  updatedAt: new Date()
                }
              });
            }

            app.globalData.userInfo = {
              ...app.globalData.userInfo,
              nickName: '宠物主人',
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