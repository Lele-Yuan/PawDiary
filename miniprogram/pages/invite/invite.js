const { calcAge } = require('../../utils/util');

Page({
  data: {
    invitePetId: '',
    pet: null,
    age: '',
    loading: true,
    loaded: false,
    hasOwnPet: false,
    isJoined: false,
    isCurrentPet: false,
    userReady: false
  },

  onLoad(options) {
    var that = this;
    var invitePetId = options.id || '';
    that.setData({ invitePetId: invitePetId });

    // 等待用户信息就绪
    var app = getApp();
    if (typeof app.waitForUserReady === 'function') {
      app.waitForUserReady().then(function () {
        that.setData({ userReady: true });
        that.loadPetInfo(invitePetId);
      });
    } else {
      // 向后兼容，直接加载
      that.setData({ userReady: true });
      that.loadPetInfo(invitePetId);
    }
  },

  // 加载宠物信息
  async loadPetInfo(petId) {
    var that = this;
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
      var db = wx.cloud.database();
      var petRes = await wx.cloud.callFunction({
        name: 'petManage',
        data: { action: 'get', data: { _id: petId } }
      });
      var pet = (petRes.result && petRes.result.code === 0) ? petRes.result.data : null;

      if (!pet) {
        that.setData({ loading: false, loaded: true });
        wx.showToast({ title: '宠物不存在或已失效', icon: 'none' });
        setTimeout(function () {
          wx.reLaunch({
            url: '/pages/home/home'
          });
        }, 1500);
        return;
      }

      // 计算年龄
      var age = calcAge(pet.birthday) || '';

      // 检查用户是否已经是该宠物家庭成员
      var app = getApp();
      var isJoined = false;
      var isCurrentPet = false;

      if (app.globalData.openid) {
        // 查询用户是否已加入该宠物
        var memberRes = await db.collection('pet_members')
          .where({ _openid: app.globalData.openid, petId: petId })
          .limit(1)
          .get();
        isJoined = memberRes.data && memberRes.data.length > 0;

        // 检查是否是当前选中的宠物
        if (app.globalData.currentPetId === petId) {
          isCurrentPet = true;
        }
      }

      // 检查用户是否有自己的宠物（用于判断取消时跳转）
      var hasOwnPet = false;
      if (app.globalData.openid) {
        var ownRes = await db.collection('pets')
          .where({ _openid: app.globalData.openid, status: 'active' })
          .limit(1)
          .get();
        hasOwnPet = ownRes.data && ownRes.data.length > 0;
      }

      that.setData({
        pet: pet,
        age: age,
        loading: false,
        loaded: true,
        hasOwnPet: hasOwnPet,
        isJoined: isJoined,
        isCurrentPet: isCurrentPet
      });
    } catch (err) {
      console.error('invite加载宠物信息失败', err);
      that.setData({ loading: false, loaded: true });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 加入宠物家庭
  async onJoin() {
    var that = this;
    var invitePetId = this.data.invitePetId;

    wx.showLoading({ title: '加入中...', mask: true });

    try {
      var res = await wx.cloud.callFunction({
        name: 'familyManage',
        data: { action: 'join', data: { petId: invitePetId } }
      });

      wx.hideLoading();

      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '加入成功', icon: 'success' });
        // 更新全局当前宠物 ID
        var app = getApp();
        app.globalData.currentPetId = invitePetId;
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
    } catch (err) {
      wx.hideLoading();
      console.error('加入失败', err);
      wx.showToast({ title: '加入失败', icon: 'none' });
    }
  },

  // 取消邀请
  onCancel() {
    var hasOwnPet = this.data.hasOwnPet;

    if (hasOwnPet) {
      // 有宠物，跳转到宠物首页
      wx.reLaunch({
        url: '/pages/home/home'
      });
    } else {
      // 无宠物，显示欢迎页（即 home 页面的欢迎状态）
      wx.reLaunch({
        url: '/pages/home/home?noPet=true'
      });
    }
  },

  // 预览宠物图片
  onPreviewImage() {
    var pet = this.data.pet;
    if (pet && pet.avatar) {
      wx.previewImage({
        current: pet.avatar,
        urls: [pet.avatar]
      });
    }
  }
});
