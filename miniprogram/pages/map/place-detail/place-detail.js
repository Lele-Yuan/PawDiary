var { PLACE_CATEGORY_MAP } = require('../../../utils/constants');

// 计算两点间距离（米），使用 Haversine 公式
function getDistance(lat1, lng1, lat2, lng2) {
  var R = 6371000;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Page({
  data: {
    place: null,
    onlineUsers: [],
    loaded: false,
    isOwner: false,
    isOnline: false,
    deleting: false
  },

  // 地点坐标（从导航参数获取，用于判断是否需要先上报位置）
  _placeLat: 0,
  _placeLng: 0,

  onLoad(options) {
    var placeId = options.id;
    this._placeLat = parseFloat(options.placeLat) || 0;
    this._placeLng = parseFloat(options.placeLng) || 0;
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

      // 判断用户是否在地点 1km 以内，若在范围内先上报位置
      // 确保自己能出现在在线用户列表中
      var placeLat = this._placeLat || (this.data.place && this.data.place.latitude) || 0;
      var placeLng = this._placeLng || (this.data.place && this.data.place.longitude) || 0;
      if (latitude && longitude && placeLat && placeLng) {
        var dist = getDistance(latitude, longitude, placeLat, placeLng);
        if (dist <= 1000) {
          // 先静默上报位置，让自己出现在在线列表
          try {
            await wx.cloud.callFunction({
              name: 'mapManage',
              data: { action: 'reportLocation', data: { latitude: latitude, longitude: longitude } }
            });
          } catch (e) {
            console.warn('上报位置失败', e);
          }
        }
      }

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

        // 同步地点坐标供下次 onShow 刷新时使用
        this._placeLat = place.latitude;
        this._placeLng = place.longitude;

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
          isOnline: !!(latitude && longitude && place.distance <= 1000),
          loaded: true
        });

        // 激活右上角「转发」菜单
        wx.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage'] });
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
  },

  // 分享给狗友
  onShareAppMessage() {
    var userInfo = getApp().globalData.userInfo;
    var nickName = (userInfo && userInfo.nickName) || '一位狗友';
    var place = this.data.place;
    return {
      title: nickName + '喊你到' + place.name + '遛狗去',
      path: '/pages/map/place-detail/place-detail?id=' + place._id,
      imageUrl: (place.images && place.images[0]) || ''
    };
  }
});

