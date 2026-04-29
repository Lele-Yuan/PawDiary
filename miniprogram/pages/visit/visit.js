Page({
  data: {
    list: [],
    loading: true,
    statusBarHeight: 20,
    navHeight: 0,
    featureEnabled: false  // 功能是否开启
  },

  onLoad() {
    var systemInfo = wx.getSystemInfoSync();
    var statusBarHeight = systemInfo.statusBarHeight || 20;
    this.setData({
      statusBarHeight,
      navHeight: statusBarHeight + 44
    });
    this._loadConfig();
  },

  // 加载云配置
  async _loadConfig() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('app_config').limit(1).get();

      if (res.data.length > 0) {
        const config = res.data[0];
        var enabled = config.quickEntryVisit && config.quickEntryVisit.enabled !== false;
        this.setData({ featureEnabled: enabled });
      }
    } catch (e) {
      // 读取失败，默认开启
      console.error('加载配置失败，使用默认值', e);
    }
  },

  onShow() {
    if (this.data.featureEnabled) {
      this._loadList();
    }
  },

  async _loadList() {
    this.setData({ loading: true });
    try {
      var res = await wx.cloud.callFunction({
        name: 'visitManage',
        data: { action: 'list', data: {} }
      });
      if (res.result && res.result.code === 0) {
        var list = (res.result.data.list || []).map(function (item) {
          var total = (item.visitTimes && item.visitTimes.length) || 0;
          var done = item.checkinCount || 0;
          // 下一次待上门的时间（全部完成则不显示）
          var nextVisit = (done < total) ? item.visitTimes[done] : null;
          var nextVisitTime = nextVisit
            ? nextVisit.date + (nextVisit.time ? ' ' + nextVisit.time : '')
            : '';
          // 次数文字：需上门X次 · 已上门Y次
          var visitCountText = total
            ? '需上门 ' + total + ' 次 · 已上门 ' + done + ' 次'
            : '';
          return Object.assign({}, item, {
            statusLabel: _statusLabel(item.status),
            statusColor: _statusColor(item.status),
            nextVisitTime: nextVisitTime,
            visitCountText: visitCountText
          });
        });
        this.setData({ list });
      } else {
        wx.showToast({ title: res.result.message || '加载失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
    this.setData({ loading: false });
  },

  goCreate() {
    if (!this.data.featureEnabled) return;
    wx.navigateTo({ url: '/pages/visit/visit-add/visit-add' });
  },

  onTapItem(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/visit/visit-add/visit-add?editId=' + id });
  }
});

function _statusLabel(status) {
  var map = {
    pending: '待确认',
    preparing: '准备中',
    serving: '服务中',
    completed: '已完成'
  };
  return map[status] || status;
}

function _statusColor(status) {
  var map = {
    pending: '#E8875A',
    preparing: '#5B8DEF',
    serving: '#9B7FE8',
    completed: '#5BC47A'
  };
  return map[status] || '#999';
}
