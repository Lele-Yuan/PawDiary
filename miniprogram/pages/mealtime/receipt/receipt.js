// pages/receipt/receipt.js —— 小票详情
const api = require('../utils/api.js');
const { formatTime } = require('../utils/util.js');

Page({
  onPageScroll(e) {
    const opacity = Math.max(0, 1 - e.scrollTop / 150);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  data: {
    navTitleOpacity: 1,
    mealId: '',
    r: null,
    isAdmin: false,
    orderedAtText: ''
  },

  onLoad(options) {
    this.setData({ mealId: options.mealId });
    this.load();
  },

  load() {
    api.meal.receipt(this.data.mealId).then(r => {
      this.setData({
        r,
        orderedAtText: r.orderedAt ? formatTime(r.orderedAt) : ''
      });
    });
  },

  // 完成本次约饭（管理员）
  finish() {
    wx.showModal({
      title: '完成约饭',
      content: '确认本次约饭已完成？',
      success: (res) => {
        if (!res.confirm) return;
        api.meal.finish(this.data.mealId).then(() => {
          wx.showToast({ title: '已完成' });
          this.load();
        });
      }
    });
  }
});
