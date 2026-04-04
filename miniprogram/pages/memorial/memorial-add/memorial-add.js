const { showLoading, hideLoading, showSuccess, showError } = require('../../../utils/util');

Page({
  data: {
    form: {
      petName: '',
      petAvatar: '',
      species: '狗',
      gender: 'unknown',
      birthday: '',
      passDate: '',
      description: ''
    },
    speciesList: ['狗', '猫', '兔', '鸟', '鱼', '其他'],
    speciesIndex: 0,
    today: new Date().toISOString().split('T')[0],
    submitting: false
  },

  // 选择头像
  async chooseAvatar() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });
      if (res.tempFiles && res.tempFiles.length > 0) {
        this.setData({ 'form.petAvatar': res.tempFiles[0].tempFilePath });
      }
    } catch (e) {
      // 用户取消选择，不处理
    }
  },

  // 输入事件
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  // 物种选择
  onSpeciesChange(e) {
    const index = e.detail.value;
    this.setData({
      speciesIndex: index,
      'form.species': this.data.speciesList[index]
    });
  },

  // 性别选择
  onGenderChange(e) {
    this.setData({ 'form.gender': e.currentTarget.dataset.value });
  },

  // 日期选择
  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  // 提交
  async onSubmit() {
    const { form, submitting } = this.data;
    if (submitting) return;

    if (!form.petName || !form.petName.trim()) {
      wx.showToast({ title: '请填写宠物名字', icon: 'none' });
      return;
    }
    if (!form.passDate) {
      wx.showToast({ title: '请选择离开日期', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    showLoading('记录中...');

    try {
      const app = getApp();
      let petAvatar = form.petAvatar;

      // 上传头像到云存储
      if (petAvatar && (petAvatar.startsWith('http://tmp') || petAvatar.startsWith('wxfile://'))) {
        const ext = petAvatar.includes('.') ? petAvatar.split('.').pop().split('?')[0] : 'jpg';
        const cloudPath = 'memorial/' + app.globalData.openid + '_' + Date.now() + '.' + ext;
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: petAvatar
        });
        petAvatar = uploadRes.fileID;
      }

      const res = await wx.cloud.callFunction({
        name: 'memorialManage',
        data: {
          action: 'add',
          data: {
            petName: form.petName.trim(),
            petAvatar: petAvatar,
            species: form.species,
            gender: form.gender,
            birthday: form.birthday,
            passDate: form.passDate,
            description: form.description
          }
        }
      });

      hideLoading();
      this.setData({ submitting: false });

      if (res.result && res.result.code === 0) {
        showSuccess('已记录');
        setTimeout(() => {
          wx.navigateBack();
        }, 1200);
      } else {
        showError(res.result ? res.result.message : '操作失败');
      }
    } catch (err) {
      hideLoading();
      this.setData({ submitting: false });
      console.error('添加纪念宠物失败：', err);
      showError('操作失败，请重试');
    }
  }
});
