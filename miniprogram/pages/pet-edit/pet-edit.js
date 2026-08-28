const { PET_SPECIES, PET_GENDERS, PET_REMARK_TYPES } = require('../../utils/constants');
const { showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');
const { uploadFile } = require('../../utils/cloud');
const { checkPetLimit, incrementPetCount, checkImageSize } = require('../../utils/limit');

Page({
  data: {
    mode: 'add', // add 或 edit
    petId: '',
    speciesList: PET_SPECIES,
    genderList: PET_GENDERS,
    remarkTypes: PET_REMARK_TYPES,
    today: '',
    submitting: false,
    form: {
      avatar: '',
      name: '',
      species: '',
      breed: '',
      gender: 'male',
      birthday: '',
      adoptDate: '',
      weight: '',
      remarks: []
    }
  },

  onLoad(options) {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    this.setData({ today: todayStr });

    if (options.mode === 'edit' && options.id) {
      // 编辑模式下检查权限
      var app = getApp();
      var role = app.globalData.currentPetRole || '';
      if (role === 'member') {
        wx.showToast({ title: '暂无编辑权限', icon: 'none' });
        setTimeout(function () { wx.navigateBack(); }, 1500);
        return;
      }
      this.setData({ mode: 'edit', petId: options.id });
      this.loadPetInfo(options.id);
    }
  },

  // 加载宠物信息（编辑模式）
  async loadPetInfo(petId) {
    showLoading('加载中...');
    const app = getApp();
    try {
      // 通过云函数获取宠物信息
      const res = await wx.cloud.callFunction({
        name: 'petManage',
        data: { action: 'get', data: { _id: app.globalData.currentPetId } }
      });
      if (res.result && res.result.code === 0) {
        const pet = res.result.data;

        const formatDate = (d) => {
          if (!d) return '';
          const date = new Date(d);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        this.setData({
          form: {
            avatar: pet.avatar || '',
            name: pet.name || '',
            species: pet.species || '',
            breed: pet.breed || '',
            gender: pet.gender || 'male',
            birthday: formatDate(pet.birthday),
            adoptDate: formatDate(pet.adoptDate),
            weight: pet.weight ? String(pet.weight) : '',
            remarks: pet.remarks || []
          }
        });
      } else {
        showError('宠物不存在');
      }

    } catch (err) {
      console.error('加载宠物信息失败：', err);
      showError('加载失败');
    }
    hideLoading();
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const sizeResult = checkImageSize(res.tempFiles);
        if (sizeResult.oversizedCount > 0) {
          wx.showToast({ title: '图片超过500KB，请选择更小的图片', icon: 'none' });
          return;
        }
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ 'form.avatar': tempFilePath });
      }
    });
  },

  // 通用输入处理
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 选择物种
  onSelectSpecies(e) {
    const species = e.currentTarget.dataset.key;
    this.setData({ 'form.species': species });
  },

  // 选择性别
  onSelectGender(e) {
    const gender = e.currentTarget.dataset.key;
    this.setData({ 'form.gender': gender });
  },

  // 日期选择
  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 添加备注
  onAddRemark() {
    const remarks = this.data.form.remarks || [];
    if (remarks.length >= 10) {
      wx.showToast({ title: '最多添加10条备注', icon: 'none' });
      return;
    }
    const newRemarks = remarks.concat([{ type: 'preference', customType: '', content: '' }]);
    this.setData({ 'form.remarks': newRemarks });
  },

  // 删除备注
  onRemoveRemark(e) {
    const index = e.currentTarget.dataset.index;
    const remarks = (this.data.form.remarks || []).slice();
    remarks.splice(index, 1);
    this.setData({ 'form.remarks': remarks });
  },

  // 选择备注类型
  onRemarkTypeChange(e) {
    const index = e.currentTarget.dataset.index;
    const type = e.currentTarget.dataset.type;
    const remarks = (this.data.form.remarks || []).slice();
    remarks[index] = Object.assign({}, remarks[index], { type, customType: type === 'custom' ? (remarks[index].customType || '') : '' });
    this.setData({ 'form.remarks': remarks });
  },

  // 备注内容输入
  onRemarkContentInput(e) {
    const index = e.currentTarget.dataset.index;
    const remarks = (this.data.form.remarks || []).slice();
    remarks[index] = Object.assign({}, remarks[index], { content: e.detail.value });
    this.setData({ 'form.remarks': remarks });
  },

  // 自定义类型名输入
  onRemarkCustomTypeInput(e) {
    const index = e.currentTarget.dataset.index;
    const remarks = (this.data.form.remarks || []).slice();
    remarks[index] = Object.assign({}, remarks[index], { customType: e.detail.value });
    this.setData({ 'form.remarks': remarks });
  },

  // 表单校验
  validateForm() {
    const { name, species, remarks } = this.data.form;
    if (!name || !name.trim()) {
      showError('请输入宠物名称');
      return false;
    }
    if (!species) {
      showError('请选择宠物物种');
      return false;
    }
    for (let i = 0; i < (remarks || []).length; i++) {
      const r = remarks[i];
      if (!r.content || !r.content.trim()) {
        showError(`第${i + 1}条备注内容不能为空`);
        return false;
      }
      if (r.type === 'custom' && (!r.customType || !r.customType.trim())) {
        showError(`第${i + 1}条备注的自定义类型名不能为空`);
        return false;
      }
    }
    return true;
  },

  // 提交表单
  async onSubmit() {
    if (!this.validateForm()) return;
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    showLoading('保存中...');

    try {
      const { form, mode, petId } = this.data;

      // 新增模式：校验每日宠物限额
      if (mode === 'add' && !checkPetLimit()) {
        hideLoading();
        showError('今日已达新增宠物上限（2个）');
        this.setData({ submitting: false });
        return;
      }

      let avatarUrl = form.avatar;

      // 如果是本地图片路径（非云存储），则上传
      if (avatarUrl && !avatarUrl.startsWith('cloud://')) {
        const fileID = await uploadFile(avatarUrl, 'pet-avatars');
        avatarUrl = fileID || '';
      }

      const petData = {
        name: form.name.trim(),
        avatar: avatarUrl,
        species: form.species,
        breed: form.breed.trim(),
        gender: form.gender,
        birthday: form.birthday || null,
        adoptDate: form.adoptDate || null,
        weight: form.weight || null,
        remarks: (form.remarks || []).map(r => ({
          type: r.type,
          customType: r.type === 'custom' ? (r.customType || '').trim() : '',
          content: (r.content || '').trim()
        }))
      };

      if (mode === 'add') {
        const addRes = await wx.cloud.callFunction({
          name: 'petManage',
          data: { action: 'add', data: petData }
        });
        if (addRes && addRes.result && addRes.result.code === -1001) {
          if (petData.avatar) { try { await wx.cloud.deleteFile({ fileList: [petData.avatar] }); } catch (_) {} }
          hideLoading();
          this.setData({ submitting: false });
          wx.showToast({ title: '内容包含违规信息，请修改后重试', icon: 'none' });
          return;
        }
        incrementPetCount();
        showSuccess('添加成功');
      } else {
        petData._id = petId;
        const upRes = await wx.cloud.callFunction({
          name: 'petManage',
          data: { action: 'update', data: petData }
        });
        if (upRes && upRes.result && upRes.result.code === -1001) {
          if (petData.avatar) { try { await wx.cloud.deleteFile({ fileList: [petData.avatar] }); } catch (_) {} }
          hideLoading();
          this.setData({ submitting: false });
          wx.showToast({ title: '内容包含违规信息，请修改后重试', icon: 'none' });
          return;
        }
        showSuccess('保存成功');
      }

      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      console.error('保存宠物失败：', err);
      showError('保存失败，请重试');
    }

    hideLoading();
    this.setData({ submitting: false });
  },

  // 归档宠物
  onArchive() {
    wx.showModal({
      title: '确认归档',
      content: '归档后该宠物将不再显示在首页，确定要归档吗？',
      confirmColor: '#F44336',
      success: async (res) => {
        if (res.confirm) {
          showLoading('处理中...');
          try {
            await wx.cloud.callFunction({
              name: 'petManage',
              data: { action: 'delete', data: { _id: this.data.petId } }
            });
            showSuccess('已归档');
            setTimeout(() => wx.navigateBack(), 1500);
          } catch (err) {
            console.error('归档失败：', err);
            showError('归档失败');
          }
          hideLoading();
        }
      }
    });
  }
});
