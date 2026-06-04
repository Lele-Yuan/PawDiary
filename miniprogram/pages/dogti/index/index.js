const { PERSONALITIES } = require('../data/dgti-data');

Page({
  data: {
    personalities: [],
    history: [],
    models: [
      { code: 'M1', name: '社交能量', en: 'Social Paw', icon: '🐾', bg: '#FFF1ED' },
      { code: 'M2', name: '情绪表达', en: 'Emotional Tail', icon: '💫', bg: '#CFE99F' },
      { code: 'M3', name: '行动策略', en: 'Action Drive', icon: '⚡', bg: '#FFB59E' },
      { code: 'M4', name: '脑回路', en: 'Brain Circuit', icon: '🧠', bg: '#F0E0C8' },
      { code: 'M5', name: '生活价值观', en: 'Life Philosophy', icon: '✨', bg: '#EFDfDB' },
    ],
    statusBarHeight: 20
  },

  onLoad() {
    this.setData({ personalities: PERSONALITIES.slice(0, 4) });
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (err) {
      this.setData({ statusBarHeight: 20 });
    }
  },

  onShow() {
    // 每次回到首页刷新历史（答题返回时）
    this._loadHistory();
  },

  _loadHistory() {
    const HISTORY_KEY = 'dgti_history';
    try {
      const list = wx.getStorageSync(HISTORY_KEY) || [];
      this.setData({ history: list });
    } catch (e) {
      this.setData({ history: [] });
    }
  },

  _formatTime(ts) {
    const d = new Date(ts);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hour}:${min}`;
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/home/home' });
    }
  },

  startTest() {
    wx.navigateTo({ url: '/pages/dogti/test/test' });
  },

  viewAll() {
    wx.navigateTo({ url: '/pages/dogti/atlas/atlas' });
  },

  viewPersonality(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/dogti/result/result?id=${id}&preview=true` });
  },

  // 查看历史记录结果
  viewHistory(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.history[index];
    if (!item) return;
    wx.navigateTo({
      url: `/pages/dogti/result/result?id=${item.id}&from=history`,
    });
  },

  // 删除历史记录
  deleteHistory(e) {
    const { index } = e.currentTarget.dataset;
    const list = this.data.history;
    list.splice(index, 1);
    wx.setStorageSync('dgti_history', list);
    this.setData({ history: list });
  },

  onShareAppMessage() {
    return {
      title: '每只狗都有隐藏人格，快来测测你家狗格！',
      path: '/pages/dogti/index/index',
    };
  },
});
