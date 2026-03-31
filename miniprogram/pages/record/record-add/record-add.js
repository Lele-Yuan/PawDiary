const { RECORD_TYPES } = require('../../../utils/constants');
const { showLoading, hideLoading, showSuccess, showError } = require('../../../utils/util');
const { uploadFile } = require('../../../utils/cloud');

Page({
  data: {
    typeList: RECORD_TYPES,
    today: '',
    submitting: false,
    form: {
      type: '',
      date: '',
      title: '',
      description: '',
      location: '',
      cost: '',
      nextDate: '',
      images: []
    }
  },

  onLoad() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.setData({
      today: todayStr,
      'form.date': todayStr
    });
  },

  // 选择类型
  onSelectType(e) {
    const type = e.currentTarget.dataset.key;
    this.setData({ 'form.type': type });
  },

  // 通用输入
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 日期选择
  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 选择图片
  chooseImage() {
    const remaining = 9 - this.data.form.images.length;
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        const images = this.data.form.images.concat(newImages).slice(0, 9);
        this.setData({ 'form.images': images });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.form.images;
    images.splice(index, 1);
    this.setData({ 'form.images': images });
  },

  // 表单校验
  validateForm() {
    var form = this.data.form;
    if (!form.type) {
      showError('请选择记录类型');
      return false;
    }
    if (!form.date) {
      showError('请选择日期');
      return false;
    }
    if (!form.title || !form.title.trim()) {
      showError('请输入标题');
      return false;
    }
    return true;
  },

  // 提交
  async onSubmit() {
    if (!this.validateForm()) return;
    if (this.data.submitting) return;

    const app = getApp();
    const petId = app.globalData.currentPetId;
    if (!petId) {
      showError('请先添加宠物');
      return;
    }

    this.setData({ submitting: true });
    showLoading('保存中...');

    try {
      const { form } = this.data;

      // 上传图片
      const uploadedImages = [];
      for (const img of form.images) {
        if (img.startsWith('cloud://')) {
          uploadedImages.push(img);
        } else {
          const fileID = await uploadFile(img, 'records');
          if (fileID) uploadedImages.push(fileID);
        }
      }

      // 写入数据库
      const db = wx.cloud.database();
      await db.collection('records').add({
        data: {
          petId,
          type: form.type,
          date: new Date(form.date),
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          cost: form.cost ? Number(form.cost) : 0,
          nextDate: form.nextDate ? new Date(form.nextDate) : null,
          images: uploadedImages,
          createdAt: new Date()
        }
      });

      hideLoading();
      showSuccess('记录成功');
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      console.error('保存记录失败：', err);
      hideLoading();
      showError('保存失败，请重试');
    }

    this.setData({ submitting: false });
  }
});