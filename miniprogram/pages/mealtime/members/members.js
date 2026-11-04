// pages/members/members.js —— 成员管理：审批 / 设管理员 / 移除
const api = require('../utils/api.js');

Page({
  onPageScroll(e) {
    const opacity = Math.max(0, 1 - e.scrollTop / 150);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  data: {
    navTitleOpacity: 1,
    familyId: '',
    detail: null
  },

  onLoad(options) {
    this.setData({ familyId: options.familyId });
  },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  load() {
    return api.family.detail(this.data.familyId).then(d => this.setData({ detail: d }));
  },

  // 审批（通过/拒绝）
  approve(e) {
    const { id, pass } = e.currentTarget.dataset;
    api.family.approve(this.data.familyId, id, !!pass).then(() => {
      wx.showToast({ title: pass ? '已通过' : '已拒绝' });
      this.load();
    });
  },

  // 设置/取消管理员
  toggleAdmin(e) {
    const { id, admin } = e.currentTarget.dataset;
    api.family.setAdmin(this.data.familyId, id, !admin).then(() => {
      wx.showToast({ title: !admin ? '已设为管理员' : '已取消' });
      this.load();
    });
  },

  // 移除成员
  removeMember(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '移除成员',
      content: `确定将「${name}」移出饭局？TA 的菜品将不再进入本饭局可点池`,
      success: (r) => {
        if (!r.confirm) return;
        api.family.removeMember(this.data.familyId, id).then(() => {
          wx.showToast({ title: '已移除' });
          this.load();
        });
      }
    });
  }
});
