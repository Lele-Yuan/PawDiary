App({
  globalData: {
    userInfo: null,
    currentPetId: '',
    currentPetRole: '',
    openid: '',
    userReady: false
  },

  _initUserPromise: null,

  onLaunch: function (options) {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'dev-5gfdj03w258c6084',
      traceUser: true
    });

    // 检测分享邀请参数（保留给邀请页面使用）
    if (options && options.query && options.query.invitePetId) {
      this.globalData.pendingInvite = options.query.invitePetId;
    }

    this._initUserPromise = this.initUser();
  },

  onShow: function (options) {
    // 检测分享邀请参数（保留给邀请页面使用）
    if (options && options.query && options.query.invitePetId) {
      this.globalData.pendingInvite = options.query.invitePetId;
    }
  },

  // 等待用户初始化完成
  async waitForUserReady() {
    if (this.globalData.userReady) {
      return true;
    }
    if (this._initUserPromise) {
      await this._initUserPromise;
    }
    return this.globalData.userReady;
  },

  // 初始化用户信息
  async initUser() {
    // 标记用户初始化开始
    this.globalData.userReady = false;

    try {
      // 调用登录云函数获取 openid
      const loginRes = await wx.cloud.callFunction({ name: 'login' });
      const openid = loginRes.result.openid;
      this.globalData.openid = openid;

      // 查询用户记录
      const db = wx.cloud.database();
      const { data: users } = await db.collection('users').where({
        _openid: openid
      }).limit(1).get();

      if (users.length > 0) {
        // 已有用户记录
        this.globalData.userInfo = users[0];
        this.globalData.currentPetId = users[0].currentPetId || '';
      } else {
        // 首次登录，创建用户记录
        const newUser = {
          nickName: '未知游客',
          avatarUrl: '',
          phone: '',
          currentPetId: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const addRes = await db.collection('users').add({ data: newUser });
        newUser._id = addRes._id;
        newUser._openid = openid;
        this.globalData.userInfo = newUser;
      }

      // 标记用户初始化完成
      this.globalData.userReady = true;

      // 触发回调
      if (this.userInfoReadyCallback) {
        this.userInfoReadyCallback(this.globalData.userInfo);
      }
    } catch (err) {
      console.error('用户初始化失败：', err);
      // 即使失败也标记为完成，避免无限等待
      this.globalData.userReady = true;
    }
  },

  // 加载当前宠物信息
  async loadCurrentPet() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'petManage',
        data: { action: 'get', data: { _id: this.globalData.currentPetId } }
      });
      if (res.result && res.result.code === 0) {
        this.globalData.currentPet = res.result.data;
      } else {
        this.globalData.currentPetId = '';
      }
      // 跳转到首页
      wx.switchTab({
        url: '/pages/home/home'
      });
    } catch (err) {
      console.error('加载宠物信息失败：', err);
      this.globalData.currentPetId = '';
    }
  },

  // 切换当前宠物
  async switchPet(petId) {
    this.globalData.currentPetId = petId;
    const db = wx.cloud.database();
    const { data: users } = await db.collection('users').where({
      _openid: this.globalData.openid
    }).limit(1).get();

    if (users.length > 0) {
      await db.collection('users').doc(users[0]._id).update({
        data: {
          currentPetId: petId,
          updatedAt: new Date()
        }
      });
    }
    await this.loadCurrentPet();
  }
});