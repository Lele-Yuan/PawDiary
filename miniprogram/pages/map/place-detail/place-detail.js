var { PLACE_CATEGORY_MAP } = require('../../../utils/constants');

Page({
  data: {
    place: null,
    onlineUsers: [],
    loaded: false,
    isOwner: false,
    deleting: false
  },

  onLoad(options) {
    var placeId = options.id;
    if (placeId) {
      this.loadPlaceDetail(placeId);
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow() {
    // 从编辑页返回时刷新数据
    if (this.data.place) {
      this.loadPlaceDetail(this.data.place._id);
    }
  },

  // 加载地点详情
  async loadPlaceDetail(placeId) {
    var that = this;
    wx.showLoading({ title: '加载中...', mask: true });

    try {
      // 获取当前位置用于计算距离
      var location = await this.getLocation();
      var latitude = location.latitude;
      var longitude = location.longitude;

      var res = await wx.cloud.callFunction({
        name: 'mapManage',
        data: {
          action: 'getPlace',
          data: { placeId: placeId, latitude: latitude, longitude: longitude }
        }
      });

      wx.hideLoading();

      if (res.result && res.result.code === 0) {
        var result = res.result.data;
        var place = result.place;
        var onlineUsers = result.onlineUsers || [];

        // 格式化地点信息
        var cat = PLACE_CATEGORY_MAP[place.category] || PLACE_CATEGORY_MAP['other'];
        place.categoryLabel = cat.label;
        place.categoryIcon = cat.icon;
        place.distanceText = place.distance >= 1000
          ? (place.distance / 1000).toFixed(1) + 'km'
          : place.distance + 'm';

        // 格式化在线用户距离
        for (var i = 0; i < onlineUsers.length; i++) {
          var u = onlineUsers[i];
          u.distanceText = u.distance >= 1000
            ? (u.distance / 1000).toFixed(1) + 'km'
            : u.distance + 'm';
        }

        that.setData({
          place: place,
          onlineUsers: onlineUsers,
          isOwner: place.isOwner,
          loaded: true
        });
      } else {
        wx.showToast({
          title: (res.result && res.result.message) || '加载失败',
          icon: 'none'
        });
        setTimeout(function () {
          wx.navigateBack();
        }, 1500);
      }
    } catch (err) {
      wx.hideLoading();
      console.error('加载地点详情失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 获取当前位置
  getLocation() {
    return new Promise(function (resolve, reject) {
      wx.getLocation({ type: 'gcj02' })
        .then(resolve)
        .catch(function (err) {
          // 没有位置权限返回空
          console.error('获取位置失败', err);
          resolve({ latitude: 0, longitude: 0 });
        });
    });
  },

  // 编辑地点
  onEdit() {
    var placeId = this.data.place._id;
    wx.navigateTo({
      url: '/pages/map/place-add/place-add?mode=edit&id=' + placeId
    });
  },

  // 删除地点
  async onDelete() {
    var that = this;
    if (this.data.deleting) return;

    var confirmRes = await wx.showModal({
      title: '确认删除',
      content: '确定要删除该地点吗？删除后无法恢复',
      confirmColor: '#C0392B'
    });
    if (!confirmRes.confirm) return;

    this.setData({ deleting: true });
    wx.showLoading({ title: '删除中...', mask: true });

    try {
      var res = await wx.cloud.callFunction({
        name: 'mapManage',
        data: { action: 'deletePlace', data: { placeId: this.data.place._id } }
      });
      wx.hideLoading();

      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '已删除', icon: 'success' });
        setTimeout(function () {
          wx.navigateBack();
        }, 1500);
      } else {
        this.setData({ deleting: false });
        wx.showToast({ title: (res.result && res.result.message) || '删除失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ deleting: false });
      console.error('删除地点失败', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  // 预览图片
  onPreviewImage(e) {
    var url = e.currentTarget.dataset.url;
    var images = this.data.place.images || [];
    wx.previewImage({
      current: url,
      urls: images
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadPlaceDetail(this.data.place._id).then(function () {
      wx.stopPullDownRefresh();
    });
  },

  // 头像加载失败处理（在线用户）
  onOnlineAvatarError(e) {
    var index = e.currentTarget.dataset.index;
    var onlineUsers = this.data.onlineUsers;
    if (onlineUsers[index]) {
      onlineUsers[index].avatarUrl = '';
      this.setData({ onlineUsers: onlineUsers });
      console.log('在线用户头像加载失败 index:', index);
    }
  },

  // 头像加载失败处理（创建者）
  onCreatorAvatarError() {
    var place = this.data.place;
    if (place && place.creatorAvatar) {
      place.creatorAvatar = '';
      this.setData({ place: place });
      console.log('创建者头像加载失败');
    }
  }
});
