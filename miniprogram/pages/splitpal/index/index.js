const { SPLIT_CATEGORY_MAP } = require('../../../utils/constants');

// 分转元展示
function fen2yuan(fen) {
  return ((fen || 0) / 100).toFixed(2);
}

Page({
  data: {
    navTitleOpacity: 1,
    loading: true,
    active: [],
    settled: [],
    summary: { activeCount: 0, pendingAmount: '0.00', historyCount: 0 }
  },

  onShow() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList(() => wx.stopPullDownRefresh());
  },

  onPageScroll(e) {
    const opacity = Math.max(0, 1 - e.scrollTop / 150);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  loadList(done) {
    wx.cloud.callFunction({
      name: 'splitManage',
      data: { action: 'listActivities', data: {} }
    }).then(res => {
      const r = res.result || {};
      if (r.code === 0) {
        const d = r.data;
        this.setData({
          loading: false,
          active: this.decorate(d.active),
          settled: this.decorate(d.settled),
          summary: {
            activeCount: d.summary.activeCount,
            pendingAmount: fen2yuan(d.summary.pendingAmount),
            historyCount: d.summary.historyCount
          }
        });
      } else {
        this.setData({ loading: false });
        wx.showToast({ title: r.message || '加载失败', icon: 'none' });
      }
    }).catch(() => {
      this.setData({ loading: false });
      wx.showToast({ title: '网络异常', icon: 'none' });
    }).then(() => { if (done) done(); });
  },

  decorate(list) {
    return (list || []).map(a => ({
      ...a,
      totalStr: fen2yuan(a.totalAmount)
    }));
  },

  goCreate() {
    wx.navigateTo({
      url: '/pages/splitpal/activity-edit/activity-edit',
      fail: (err) => {
        console.error('navigateTo activity-edit 失败:', err);
        wx.showToast({ title: '页面打开失败:' + (err.errMsg || ''), icon: 'none' });
      }
    });
  },

  joinByCode() {
    wx.showModal({
      title: '输入邀请码加入',
      editable: true,
      placeholderText: '粘贴邀请信息或输入邀请码',
      success: (m) => {
        if (!m.confirm) return;
        // 兼容直接粘贴整段邀请文案：截取“邀请码”之后并只保留字母数字
        let raw = (m.content || '').trim();
        const marker = raw.indexOf('邀请码');
        if (marker >= 0) raw = raw.slice(marker);
        const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!code) {
          wx.showToast({ title: '请输入邀请码', icon: 'none' });
          return;
        }
        wx.showLoading({ title: '加入中...', mask: true });
        wx.cloud.callFunction({
          name: 'splitManage',
          data: { action: 'joinByCode', data: { inviteCode: code } }
        }).then(res => {
          wx.hideLoading();
          const r = res.result || {};
          if (r.code === 0) {
            wx.navigateTo({ url: `/pages/splitpal/activity-detail/activity-detail?id=${r.data._id}` });
          } else {
            wx.showToast({ title: r.message || '加入失败', icon: 'none' });
          }
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '网络异常', icon: 'none' });
        });
      }
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/splitpal/activity-detail/activity-detail?id=${id}` });
  }
});
