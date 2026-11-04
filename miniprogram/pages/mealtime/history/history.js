// pages/history/history.js —— 历史小票列表
const api = require('../utils/api.js');
const { formatDate } = require('../utils/util.js');

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
    list: [],
    loading: true
  },

  onLoad(options) {
    this.setData({ familyId: options.familyId });
    this.load();
  },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  load() {
    this.setData({ loading: true });
    return api.meal.history(this.data.familyId).then(res => {
      const list = (res.list || []).map(m => ({
        ...m,
        dateText: formatDate(m.finishedAt || m.createdAt)
      }));
      this.setData({ list, loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  openReceipt(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/mealtime/receipt/receipt?mealId=${id}` });
  }
});
