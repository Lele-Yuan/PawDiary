// pages/index/index.js —— 约饭首页：我的饭局列表 / 创建 / 加入
const app = getApp();
const api = require('../utils/api.js');
const { MEAL_STATUS } = require('../utils/util.js');

Page({
  onPageScroll(e) {
    const opacity = Math.max(0, 1 - e.scrollTop / 150);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  data: {
    navTitleOpacity: 1,
    userInfo: null,
    families: [],
    loading: true,
    showCreate: false,
    showJoin: false,
    inputName: '',
    inputCode: '',
    statusMap: MEAL_STATUS
  },

  onLoad(options) {
    app.waitForUserReady().then(() => app.globalData.userInfo).then(u => {
      this.setData({ userInfo: u });
      if (u) api.user.syncProfile({ nickName: u.nickName, avatarUrl: u.avatarUrl });
      // 通过转发卡片进入：自动凭邀请码加入
      if (options && options.inviteCode) {
        this.joinByCode(options.inviteCode);
      }
    });
  },
  onShow() {
    this.loadList();
  },
  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    return { title: '来我家吃饭 · 一起约个饭🍚', path: '/pages/mealtime/index/index' };
  },

  loadList() {
    this.setData({ loading: true });
    return api.family.myList().then(list => {
      this.setData({ families: list || [], loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  // 弹窗开关
  openCreate() { this.setData({ showCreate: true, inputName: '' }); },
  openJoin() { this.setData({ showJoin: true, inputCode: '' }); },
  closeModal() { this.setData({ showCreate: false, showJoin: false }); },
  onName(e) { this.setData({ inputName: e.detail.value }); },
  onCode(e) { this.setData({ inputCode: e.detail.value }); },
  stop() {},

  // 创建饭局
  doCreate() {
    const name = (this.data.inputName || '').trim();
    if (!name) return wx.showToast({ title: '请输入饭局名称', icon: 'none' });
    api.family.create(name).then(res => {
      this.closeModal();
      wx.showToast({ title: '创建成功' });
      this.goFamily(res.familyId);
    });
  },

  // 加入饭局
  doJoin() {
    const code = (this.data.inputCode || '').trim();
    if (!code) return wx.showToast({ title: '请输入邀请码', icon: 'none' });
    this.closeModal();
    this.joinByCode(code);
  },

  // 凭邀请码加入（弹窗输入与转发进入共用）
  joinByCode(rawCode) {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) return;
    api.family.join(code).then(res => {
      if (res.status === 0) {
        wx.showModal({ title: '已提交申请', content: '等待管理员审批通过后即可加入', showCancel: false });
        this.loadList();
      } else {
        wx.showToast({ title: '加入成功' });
        this.goFamily(res.familyId);
      }
    }).catch(() => {});
  },

  goFamily(familyId) {
    app.globalData.currentFamilyId = familyId;
    wx.navigateTo({ url: `/pages/mealtime/family/family?id=${familyId}` });
  },
  onTapFamily(e) {
    this.goFamily(e.currentTarget.dataset.id);
  },
  goMenu() {
    wx.navigateTo({ url: '/pages/mealtime/menu/menu' });
  }
});
