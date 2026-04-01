var { PLACE_CATEGORIES, PLACE_CATEGORY_MAP } = require('../../../utils/constants');
var { uploadFile } = require('../../../utils/cloud');

Page({
  data: {
    categoryList: PLACE_CATEGORIES,
    submitting: false,
    mode: 'add', // 'add' or 'edit'
    placeId: null,
    form: {
      name: '',
      description: '',
      category: 'cafe',
      latitude: 0,
      longitude: 0,
      address: '',
      images: []
    },
    locationPicked: false
  },

  onLoad(options) {
    // 编辑模式
    if (options.mode === 'edit' && options.id) {
      this.setData({ mode: 'edit', placeId: options.id });
      this.loadPlaceDetail(options.id);
    } else {
      // 添加模式 - 预设位置
      if (options.lat && options.lng) {
        this.setData({
          'form.latitude': parseFloat(options.lat),
          'form.longitude': parseFloat(options.lng)
        });
      }
    }
  },

  // 加载地点详情（编辑模式）
  async loadPlaceDetail(placeId) {
    var that = this;
    wx.showLoading({ title: '加载中...', mask: true });

    try {
      var res = await wx.cloud.callFunction({
        name: 'mapManage',
        data: {
          action: 'getPlace',
          data: { placeId: placeId }
        }
      });

      wx.hideLoading();

      if (res.result && res.result.code === 0) {
        var place = res.result.data.place;
        that.setData({
          'form.name': place.name || '',
          'form.description': place.description || '',
          'form.category': place.category || 'cafe',
          'form.latitude': place.latitude,
          'form.longitude': place.longitude,
          'form.address': place.address || '',
          'form.images': place.images || [],
          locationPicked: true
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

  // 选择位置
  async onChooseLocation() {
    // 编辑模式下不可更改位置
    if (this.data.mode === 'edit') return;

    try {
      var res = await wx.chooseLocation({
        latitude: this.data.form.latitude || undefined,
        longitude: this.data.form.longitude || undefined
      });
      this.setData({
        'form.latitude': res.latitude,
        'form.longitude': res.longitude,
        'form.address': res.address || res.name || '',
        locationPicked: true
      });
      if (!this.data.form.name && res.name) {
        this.setData({ 'form.name': res.name });
      }
    } catch (err) {
      console.error('选择位置失败', err);
    }
  },

  // 选择分类
  onSelectCategory(e) {
    var key = e.currentTarget.dataset.key;
    this.setData({ 'form.category': key });
  },

  // 输入变更
  onInputChange(e) {
    var field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  // 选择图片
  async chooseImage() {
    var that = this;
    var currentCount = this.data.form.images.length;
    if (currentCount >= 3) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' });
      return;
    }
    try {
      var res = await wx.chooseMedia({
        count: 3 - currentCount,
        mediaType: ['image'],
        sizeType: ['compressed']
      });
      var newImages = that.data.form.images.slice();
      for (var i = 0; i < res.tempFiles.length; i++) {
        newImages.push(res.tempFiles[i].tempFilePath);
      }
      that.setData({ 'form.images': newImages });
    } catch (err) {
      console.error('选择图片失败', err);
    }
  },

  // 删除图片
  deleteImage(e) {
    var index = e.currentTarget.dataset.index;
    var images = this.data.form.images.slice();
    images.splice(index, 1);
    this.setData({ 'form.images': images });
  },

  // 提交
  async onSubmit() {
    var form = this.data.form;

    if (!form.name.trim()) {
      wx.showToast({ title: '请输入地点名称', icon: 'none' });
      return;
    }
    if (!form.latitude || !form.longitude) {
      wx.showToast({ title: '请选择地点位置', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      // 上传图片
      var imageFileIDs = [];
      for (var i = 0; i < form.images.length; i++) {
        var filePath = form.images[i];
        if (filePath.indexOf('cloud://') === 0) {
          imageFileIDs.push(filePath);
        } else {
          var fileID = await uploadFile(filePath, 'places');
          if (fileID) imageFileIDs.push(fileID);
        }
      }

      var action = this.data.mode === 'edit' ? 'updatePlace' : 'addPlace';
      var data = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        latitude: form.latitude,
        longitude: form.longitude,
        address: form.address,
        images: imageFileIDs
      };

      // 编辑模式需要 placeId
      if (this.data.mode === 'edit') {
        data.placeId = this.data.placeId;
      }

      var res = await wx.cloud.callFunction({
        name: 'mapManage',
        data: { action: action, data: data }
      });

      wx.hideLoading();
      this.setData({ submitting: false });

      if (res.result && res.result.code === 0) {
        var msg = this.data.mode === 'edit' ? '更新成功' : '添加成功';
        wx.showToast({ title: msg, icon: 'success' });
        setTimeout(function () {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: (res.result && res.result.message) || '提交失败',
          icon: 'none'
        });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('提交地点失败', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  }
});
