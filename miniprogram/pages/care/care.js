const { formatDate } = require('../../utils/util');

// 格式化日期文本
function formatDateText(t) {
  if (!t) return '';
  if (t.mode === 'range') {
    var s = t.startDate || '';
    if (t.endDate && t.endDate !== t.startDate) s += ' ~ ' + t.endDate;
    return s || t.timeDesc || '';
  }
  if (t.mode === 'multi') {
    var dates = t.selectedDates || [];
    if (!dates.length) return t.timeDesc || '';
    var shown = dates.slice(0, 3).map(function (d) { return d.slice(5); }); // MM-DD
    var label = shown.join('、');
    if (dates.length > 3) label += ' 等' + dates.length + '天';
    else label += ' 共' + dates.length + '天';
    return label;
  }
  // 旧格式
  return t.dateDesc || t.timeDesc || '';
}

// 格式化时间段文本
function formatTimeSlotText(t) {
  if (!t || !t.startTime) return '';
  return t.startTime + (t.endTime ? ' ~ ' + t.endTime : '');
}

Page({
  data: {
    list: [],
    loading: true,
    hasMore: false,
    page: 0,
    roleFilter: 'all',
    serviceFilter: 'all',
    roleFilterIndex: 0,
    serviceFilterIndex: 0,
    dateFilter: '',
    onlyMine: false,
    sortType: 'distance',  // 'distance' | 'newest'
    statusBarHeight: 20,
    navHeight: 0,
    latitude: 0,
    longitude: 0,
    roleOptions: [
      { key: 'all', label: '所有人' },
      { key: 'helper', label: '临时主' },
      { key: 'owner', label: '需求方' }
    ],
    serviceOptions: [
      { key: 'all', label: '所有服务', icon: '' },
      { key: 'poop', label: '铲屎', icon: '💩' },
      { key: 'walk', label: '遛狗', icon: '🦮' },
      { key: 'other', label: '异宠', icon: '🐜' }
    ],
    featureEnabled: false  // 功能是否开启
  },

  onLoad() {
    try {
      var systemInfo = wx.getSystemInfoSync();
      var statusBarHeight = systemInfo.statusBarHeight || 20;
      var navBarHeight = 44;
      this.setData({
        statusBarHeight,
        navHeight: statusBarHeight + navBarHeight
      });
    } catch (e) {}
    this._loadConfig();
  },

  // 加载云配置
  async _loadConfig() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('app_config').limit(1).get();

      if (res.data.length > 0) {
        const config = res.data[0];
        var enabled = config.quickEntryCare && config.quickEntryCare.enabled !== false;
        this.setData({ featureEnabled: enabled });
      }
    } catch (e) {
      // 读取失败，默认开启
      console.error('加载配置失败，使用默认值', e);
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: -1 });
    }
    if (this.data.featureEnabled) {
      this._getLocationAndLoad();
    }
  },

  // 获取位置后加载列表
  async _getLocationAndLoad() {
    try {
      var res = await wx.getLocation({ type: 'gcj02' });
      this.setData({ latitude: res.latitude, longitude: res.longitude });
    } catch (e) {
      // 拒绝授权也可继续，距离显示 '--'
    }
    this.setData({ page: 0, list: [] });
    this._loadList(true);
  },

  // 加载列表
  async _loadList(reset) {
    this.setData({ loading: true });
    try {
      var page = reset ? 0 : this.data.page;
      var res = await wx.cloud.callFunction({
        name: 'careManage',
        data: {
          action: 'list',
          data: {
            latitude: this.data.latitude,
            longitude: this.data.longitude,
            roleFilter: this.data.roleFilter,
            serviceTypeFilter: this.data.serviceFilter,
            dateFilter: this.data.dateFilter,
            onlyMine: this.data.onlyMine,
            page,
            pageSize: 20
          }
        }
      });

      if (res.result && res.result.code === 0) {
        var newList = res.result.data.list || [];

        // 格式化时间
        newList.forEach(function (item) {
          item.createTimeStr = formatDate(item.createTime, 'MM-DD HH:mm');
          item.dateText = formatDateText(item.availableTime);
          item.timeSlotText = formatTimeSlotText(item.availableTime);
        });

        // 客户端二次排序
        if (this.data.sortType === 'newest') {
          newList.sort(function (a, b) {
            return new Date(b.createTime) - new Date(a.createTime);
          });
        }

        var list = reset ? newList : this.data.list.concat(newList);
        this.setData({
          list,
          page: page + 1,
          hasMore: newList.length === 20
        });
      }
    } catch (e) {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
    this.setData({ loading: false });
  },

  // 角色筛选选择器
  onRolePickerChange(e) {
    var index = Number(e.detail.value);
    var key = this.data.roleOptions[index].key;
    this.setData({ roleFilterIndex: index, roleFilter: key, page: 0, list: [] });
    this._loadList(true);
  },

  // 服务类型筛选选择器
  onServicePickerChange(e) {
    var index = Number(e.detail.value);
    var key = this.data.serviceOptions[index].key;
    this.setData({ serviceFilterIndex: index, serviceFilter: key, page: 0, list: [] });
    this._loadList(true);
  },

  // 日期筛选
  onDatePickerChange(e) {
    this.setData({ dateFilter: e.detail.value, page: 0, list: [] });
    this._loadList(true);
  },

  onClearDateFilter() {
    this.setData({ dateFilter: '', page: 0, list: [] });
    this._loadList(true);
  },

  // 编辑帖子（跳转发布页带 editId）
  onEditPost(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/care/care-add/care-add?editId=' + id });
  },

  // 删除帖子
  onDeletePost(e) {
    var id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    var self = this;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条发布吗？',
      confirmText: '删除',
      confirmColor: '#E8454A',
      success: async function (res) {
        if (!res.confirm) return;
        try {
          var result = await wx.cloud.callFunction({
            name: 'careManage',
            data: { action: 'delete', data: { postId: id } }
          });
          if (result.result && result.result.code === 0) {
            wx.showToast({ title: '已删除', icon: 'success' });
            var list = self.data.list.slice();
            list.splice(index, 1);
            self.setData({ list });
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        } catch (err) {
          wx.showToast({ title: '网络异常', icon: 'none' });
        }
      }
    });
  },
  // 切换"只看我发布"
  onToggleOnlyMine() {
    this.setData({ onlyMine: !this.data.onlyMine, page: 0, list: [] });
    this._loadList(true);
  },

  // 切换排序方式
  onSortChange() {
    var newSort = this.data.sortType === 'distance' ? 'newest' : 'distance';
    var list = this.data.list.slice();
    if (newSort === 'newest') {
      list.sort(function (a, b) {
        return new Date(b.createTime) - new Date(a.createTime);
      });
    } else {
      list.sort(function (a, b) { return a.distance - b.distance; });
    }
    this.setData({ sortType: newSort, list });
  },

  // 申请联系
  async onApplyContact(e) {
    var app = getApp();
    if (!app.globalData.openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    var postId = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;

    // 防重复点击
    var key = 'list[' + index + '].applying';
    var obj = {};
    obj[key] = true;
    this.setData(obj);

    try {
      var res = await wx.cloud.callFunction({
        name: 'careManage',
        data: { action: 'applyContact', data: { postId } }
      });

      if (res.result && res.result.code === 0) {
        var contactKey = 'list[' + index + '].contactInfo';
        var applyKey = 'list[' + index + '].applying';
        var update = {};
        update[contactKey] = res.result.data.contactInfo;
        update[applyKey] = false;
        this.setData(update);
        wx.showToast({ title: '已获取联系方式', icon: 'success' });
      } else {
        var applyKey2 = 'list[' + index + '].applying';
        var update2 = {};
        update2[applyKey2] = false;
        this.setData(update2);
        wx.showToast({ title: res.result.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      var applyKey3 = 'list[' + index + '].applying';
      var update3 = {};
      update3[applyKey3] = false;
      this.setData(update3);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    }
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this._loadList(false);
    }
  },

  // 跳转发布页
  onTapPublish() {
    if (!this.data.featureEnabled) return;
    wx.navigateTo({ url: '/pages/care/care-add/care-add' });
  }
});
