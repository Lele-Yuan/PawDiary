const { PERSONALITIES } = require('../data/dgti-data');

Page({
  data: {
    all: [],
    filtered: [],
    activeFilter: 'all',
    filterTabs: [
      { label: '全部', value: 'all' },
      { label: 'SSR', value: 'SSR' },
      { label: 'SR', value: 'SR' },
      { label: 'R', value: 'R' },
    ],
    statusBarHeight: 20
  },

  onLoad() {
    this.setData({ all: PERSONALITIES, filtered: PERSONALITIES });

    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20
      });
    } catch (err) {
      console.error('读取状态栏高度失败：', err);
      this.setData({ statusBarHeight: 20 });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  onFilter(e) {
    const value = e.currentTarget.dataset.value;
    const filtered = value === 'all'
      ? this.data.all
      : this.data.all.filter(p => p.rarity === value);
    this.setData({ activeFilter: value, filtered });
  },

  viewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/dogti/result/result?id=${id}&preview=true` });
  },
});
