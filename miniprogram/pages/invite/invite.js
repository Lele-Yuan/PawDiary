const { calcAge } = require('../../utils/util');

Page({
  data: {
    invitePetId: '',
    pet: null,
    age: '',
    loading: true,
    loaded: false,
    isJoined: false,
    isCurrentPet: false,
    userReady: false,
    isGuest: true,
    showLoginModal: false
  },

  onLoad(options) {
    const that = this;
    const invitePetId = options.id || '';
    that.setData({ invitePetId: invitePetId });

    // 等待用户信息就绪
    const app = getApp();
    if (typeof app.waitForUserReady === 'function') {
      app.waitForUserReady().then(function () {
        // 检查是否为游客
        const userInfo = app.globalData.userInfo || {};
        const isGuest = !userInfo.nickName || userInfo.nickName === '未知游客';
        that.setData({ userReady: true, isGuest: isGuest });
        that.loadPetInfo(invitePetId);
      });
    } else {
      // 向后兼容，直接加载
      const userInfo = app.globalData.userInfo || {};
      const isGuest = !userInfo.nickName || userInfo.nickName === '未知游客';
      that.setData({ userReady: true, isGuest: isGuest });
      that.loadPetInfo(invitePetId);
    }
  },

  // 加载宠物信息
  async loadPetInfo(petId) {
    // 等待用户信息就绪
    const app = getApp();

    const that = this;
    if (!petId) {
      that.setData({ loading: false, loaded: true });
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(function () {
        wx.reLaunch({
          url: '/pages/home/home'
        });
      }, 1500);
      return;
    }

    try {
      const db = wx.cloud.database();
      const petRes = await wx.cloud.callFunction({
        name: 'petManage',
        data: { action: 'get', data: { _id: petId } }
      });

      if (!petRes.result || petRes.result.code !== 0) {
        that.setData({ loading: false, loaded: true });
        wx.showToast({ title: '宠物不存在或已失效', icon: 'none' });
        setTimeout(function () {
          wx.reLaunch({
            url: '/pages/home/home'
          });
        }, 1500);
        return;
      }

      const pet = petRes.result.data || null;
      const age = calcAge(pet.birthday) || '';

      // 检查用户是否已经是该宠物家庭成员
      const memberRes = await db.collection('pet_members')
        .where({ _openid: app.globalData.openid, petId: petId })
        .limit(1)
        .get();

      const isJoined = memberRes.data && memberRes.data.length > 0;

      // 检查是否是当前选中的宠物
      const isCurrentPet = app.globalData.currentPetId === petId;

      that.setData({
        pet: pet,
        age: age,
        loading: false,
        loaded: true,
        isJoined: isJoined,
        isCurrentPet: isCurrentPet
      });
    } catch (err) {
      console.error('invite加载宠物信息失败', err);
      that.setData({ loading: false, loaded: true });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 预览宠物图片
  onPreviewImage() {
    const pet = this.data.pet;
    if (pet && pet.avatar) {
      wx.previewImage({
        current: pet.avatar,
        urls: [pet.avatar]
      });
    }
  },

  // 加入宠物家庭
  onJoin() {
    const { isGuest, isJoined, isCurrentPet } = this.data;

    // 已加入且是当前宠物，无需操作
    if (isJoined && isCurrentPet) {
      return;
    }

    // 已加入但非当前宠物，直接切换
    if (isJoined && !isCurrentPet) {
      this.onSwitchPet();
      return;
    }

    // 未加入，如果是游客则显示登录弹窗
    if (isGuest) {
      this.setData({ showLoginModal: true });
      return;
    }

    // 已登录，直接调用加入云函数
    this.doJoin();
  },

  // 切换当前宠物
  onSwitchPet() {
    const app = getApp();
    app.globalData.currentPetId = this.data.invitePetId;
    app.globalData.currentPet = this.data.pet;
    app.globalData.currentPetRole = 'member';

    wx.showToast({ title: '切换成功', icon: 'success' });
    setTimeout(function () {
      wx.reLaunch({
        url: '/pages/home/home'
      });
    }, 1500);
  },

  // 执行加入操作
  doJoin() {
    const that = this;
    wx.cloud.callFunction({
      name: 'familyManage',
      data: { action: 'join', data: { petId: this.data.invitePetId } }
    }).then(function(res) {
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '加入成功', icon: 'success' });

        const app = getApp();
        app.globalData.currentPetId = that.data.invitePetId;
        app.globalData.currentPet = that.data.pet;
        app.globalData.currentPetRole = 'member';

        setTimeout(function () {
          wx.reLaunch({
            url: '/pages/home/home'
          });
        }, 1500);
      } else {
        wx.showToast({
          title: (res.result && res.result.message) || '加入失败',
          icon: 'none'
        });
      }
    });
  },

  // 登录成功回调
  onLoginSuccess(e) {
    const app = getApp();

    // 更新全局状态
    const userInfo = { ...app.globalData.userInfo, ...e.detail };
    app.globalData.userInfo = userInfo;
    this.setData({ isGuest: false });

    // 执行加入操作
    this.doJoin();
  },

  // 登录关闭
  onLoginClose() {
    this.setData({ showLoginModal: false });
  },

  // 取消邀请
  onCancel() {
    wx.reLaunch({
      url: '/pages/home/home'
    });
  }
});
