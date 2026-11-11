// pages/menu/menu.js —— 我的菜单（全局菜品资产）
const app = getApp();
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
    userInfo: null,
    dishes: [],
    loading: true
  },

  onLoad() {
    app.waitForUserReady().then(() => app.globalData.userInfo).then(u => this.setData({ userInfo: u }));
  },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  load() {
    this.setData({ loading: true });
    return api.dish.myList().then(list => {
      this.setData({ dishes: list || [], loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  addDish() {
    wx.navigateTo({ url: '/pages/mealtime/dishEdit/dishEdit' });
  },
  editDish(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/mealtime/dishEdit/dishEdit?id=${id}` });
  },
  removeDish(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除菜品',
      content: `确定删除「${name}」？`,
      success: (r) => {
        if (!r.confirm) return;
        api.dish.remove(id).then(() => {
          wx.showToast({ title: '已删除' });
          this.load();
        });
      }
    });
  }
});
