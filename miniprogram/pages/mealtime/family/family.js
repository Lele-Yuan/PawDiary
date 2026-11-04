// pages/family/family.js —— 饭局详情：成员 / 角色切换 / 入口
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
    navTitle: '饭局详情',
    familyId: '',
    detail: null,
    statusMap: MEAL_STATUS,
    showEdit: false,
    editName: '',
    editApproval: true
  },

  onLoad(options) {
    this.setData({ familyId: options.id });
    app.globalData.currentFamilyId = options.id;
  },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  load() {
    return api.family.detail(this.data.familyId).then(d => {
      this.setData({ detail: d, navTitle: (d && d.family && d.family.name) || '饭局详情' });
    });
  },

  // 切换自己的角色：干饭人 <-> 大厨
  toggleRole() {
    const next = this.data.detail.me.kitchenRole ? 0 : 1;
    api.family.switchRole(this.data.familyId, next).then(() => {
      wx.showToast({ title: next ? '已成为大厨' : '已成为干饭人' });
      this.load();
    });
  },

  // 复制邀请码
  copyCode() {
    wx.setClipboardData({ data: this.data.detail.family.inviteCode });
  },

  // 编辑饭局信息（管理员）
  openEdit() {
    const f = this.data.detail.family;
    this.setData({ showEdit: true, editName: f.name, editApproval: f.needApproval !== false });
  },
  closeEdit() { this.setData({ showEdit: false }); },
  onEditName(e) { this.setData({ editName: e.detail.value }); },
  toggleApproval(e) { this.setData({ editApproval: e.detail.value }); },
  stopEdit() {},
  saveEdit() {
    const name = (this.data.editName || '').trim();
    if (!name) return wx.showToast({ title: '请填写饭局名称', icon: 'none' });
    api.family.updateInfo(this.data.familyId, name, this.data.editApproval).then(() => {
      this.setData({ showEdit: false });
      wx.showToast({ title: '已保存' });
      this.load();
    });
  },

  // 转发邀请（微信卡片，点开自动带邀请码加入）
  onShareAppMessage() {
    const f = (this.data.detail && this.data.detail.family) || {};
    return {
      title: `「${f.name || '来我家吃饭'}」约你来家里吃饭🍚`,
      path: `/pages/mealtime/index/index?inviteCode=${f.inviteCode || ''}`
    };
  },

  // 刷新邀请码（管理员）
  refreshCode() {
    wx.showModal({
      title: '刷新邀请码',
      content: '刷新后旧邀请码立即失效，确定继续？',
      success: (r) => {
        if (!r.confirm) return;
        api.family.refreshCode(this.data.familyId).then(() => {
          wx.showToast({ title: '已刷新' });
          this.load();
        });
      }
    });
  },

  // 退出饭局（非发起人）
  leaveFamily() {
    wx.showModal({
      title: '退出饭局',
      content: '退出后将不再是本饭局成员，确定退出？',
      success: (r) => {
        if (!r.confirm) return;
        api.family.leave(this.data.familyId).then(() => {
          wx.showToast({ title: '已退出' });
          setTimeout(() => wx.navigateBack(), 500);
        });
      }
    });
  },

  // 解散饭局（发起人）
  dissolveFamily() {
    wx.showModal({
      title: '解散饭局',
      content: '解散后将删除本饭局的全部成员与约饭记录，且不可恢复，确定解散？',
      success: (r) => {
        if (!r.confirm) return;
        api.family.dissolve(this.data.familyId).then(() => {
          wx.showToast({ title: '已解散' });
          setTimeout(() => wx.navigateBack(), 500);
        });
      }
    });
  },

  goOrder() {
    wx.navigateTo({ url: `/pages/mealtime/order/order?familyId=${this.data.familyId}` });
  },
  goMembers() {
    wx.navigateTo({ url: `/pages/mealtime/members/members?familyId=${this.data.familyId}` });
  },
  goHistory() {
    wx.navigateTo({ url: `/pages/mealtime/history/history?familyId=${this.data.familyId}` });
  }
});
