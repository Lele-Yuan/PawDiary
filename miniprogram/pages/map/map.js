var { PLACE_CATEGORY_MAP } = require('../../utils/constants');

Page({
  data: {
    viewMode: 'list',
    places: [],
    myLatitude: 0,
    myLongitude: 0,
    markers: [],
    loaded: false
  },

  _reportTimer: null,

  onLoad() {
    this.getLocation();
  },

  onShow() {
    this.startLocationReport();
  },

  onHide() {
    this.stopTimers();
  },

  onUnload() {
    this.stopTimers();
  },

  // 获取当前位置
  async getLocation() {
    var that = this;
    try {
      var res = await wx.getLocation({ type: 'gcj02' });
      that.setData({
        myLatitude: res.latitude,
        myLongitude: res.longitude
      });
      that.loadData();
    } catch (err) {
      console.error('获取位置失败', err);
      wx.showModal({
        title: '需要位置权限',
        content: '请在设置中允许获取位置信息，以使用地图功能',
        confirmText: '去设置',
        success: function (modalRes) {
          if (modalRes.confirm) {
            wx.openSetting();
          } else {
            wx.navigateBack();
          }
        }
      });
    }
  },

  // 加载地点列表
  async loadData() {
    var lat = this.data.myLatitude;
    var lng = this.data.myLongitude;
    if (!lat || !lng) return;

    try {
      var placesRes = await wx.cloud.callFunction({
        name: 'mapManage',
        data: { action: 'listPlaces', data: { latitude: lat, longitude: lng } }
      });

      var places = (placesRes.result && placesRes.result.data) || [];

      // 格式化地点显示信息
      for (var i = 0; i < places.length; i++) {
        var p = places[i];
        var cat = PLACE_CATEGORY_MAP[p.category] || PLACE_CATEGORY_MAP['other'];
        places[i].categoryLabel = cat.label;
        places[i].categoryIcon = cat.icon;
        places[i].distanceText = p.distance >= 1000
          ? (p.distance / 1000).toFixed(1) + 'km'
          : p.distance + 'm';
      }

      this.setData({
        places: places,
        loaded: true
      });

      this.buildMarkers();
    } catch (err) {
      console.error('加载数据失败', err);
      this.setData({ loaded: true });
    }
  },

  // 生成地图标记
  buildMarkers() {
    var markers = [];
    var places = this.data.places;

    // 地点标记 - 使用 label 替代 iconPath
    for (var i = 0; i < places.length; i++) {
      var p = places[i];
      var cat = PLACE_CATEGORY_MAP[p.category] || PLACE_CATEGORY_MAP['other'];
      markers.push({
        id: i + 1,
        latitude: p.latitude,
        longitude: p.longitude,
        label: {
          content: cat.icon + '\n' + p.name,
          color: '#313333',
          fontSize: 12,
          borderWidth: 0,
          borderRadius: 8,
          bgColor: '#FFFFFF',
          padding: 6,
          textAlign: 'center',
          x: 0,
          y: -20
        },
        width: 30,
        height: 30
      });
    }

    this.setData({ markers: markers });
  },

  // 切换视图模式
  onSwitchMode(e) {
    var mode = e.currentTarget.dataset.mode;
    this.setData({ viewMode: mode });
  },

  // 点击地点卡片
  onTapPlace(e) {
    var placeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/map/place-detail/place-detail?id=' + placeId
    });
  },

  // 定时上报位置
  startLocationReport() {
    this.stopTimers();
    this.reportLocation();

    var that = this;
    this._reportTimer = setInterval(function () {
      that.reportLocation();
    }, 30000);
  },

  stopTimers() {
    if (this._reportTimer) {
      clearInterval(this._reportTimer);
      this._reportTimer = null;
    }
  },

  async reportLocation() {
    var lat = this.data.myLatitude;
    var lng = this.data.myLongitude;
    if (!lat || !lng) return;

    try {
      await wx.cloud.callFunction({
        name: 'mapManage',
        data: {
          action: 'reportLocation',
          data: { latitude: lat, longitude: lng }
        }
      });
    } catch (err) {
      console.error('上报位置失败', err);
    }
  },

  // 跳转添加地点
  goAddPlace() {
    var lat = this.data.myLatitude;
    var lng = this.data.myLongitude;
    wx.navigateTo({
      url: '/pages/map/place-add/place-add?lat=' + lat + '&lng=' + lng
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(function () {
      wx.stopPullDownRefresh();
    });
  },

  // 回到当前位置
  onMoveToLocation() {
    var mapCtx = wx.createMapContext('petMap');
    mapCtx.moveToLocation();
  }
});
