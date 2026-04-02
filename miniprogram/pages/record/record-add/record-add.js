const { RECORD_TYPES } = require('../../../utils/constants');
const { showLoading, hideLoading, showSuccess, showError } = require('../../../utils/util');
const { uploadFile } = require('../../../utils/cloud');

Page({
  data: {
    typeList: RECORD_TYPES,
    today: '',
    submitting: false,
    customInterval: '',
    editId: '',
    pageTitle: '添加记录',
    form: {
      type: '',
      date: '',
      title: '',
      description: '',
      location: '',
      cost: '',
      nextDate: '',
      enableRemind: false,
      remindInterval: 0,
      images: []
    }
  },

  onLoad(options) {
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    this.setData({ today: todayStr });

    // 权限校验
    var app = getApp();
    var role = app.globalData.currentPetRole || '';
    if (role === 'member') {
      wx.showToast({ title: '无权限请联系宠物主', icon: 'none' });
      setTimeout(function () { wx.navigateBack(); }, 1500);
      return;
    }

    if (options.id) {
      this.setData({ editId: options.id, pageTitle: '编辑记录' });
      this.loadRecord(options.id);
    } else if (options.prefill === '1') {
      // 从"立即完成"跳转，预填充数据
      this.setData({
        'form.date': todayStr,
        'form.type': decodeURIComponent(options.type || ''),
        'form.title': decodeURIComponent(options.title || ''),
        'form.location': decodeURIComponent(options.location || '')
      });
      // 继承提醒设置
      var enableRemind = options.enableRemind === '1';
      var remindInterval = Number(options.remindInterval) || 0;
      if (enableRemind && remindInterval > 0) {
        this.setData({
          'form.enableRemind': true,
          'form.remindInterval': remindInterval
        });
        // 自定义间隔回显
        if ([30, 60, 90, 180].indexOf(remindInterval) === -1) {
          this.setData({ customInterval: String(remindInterval) });
        }
        this.calcNextDate(remindInterval);
      }
      // 保存来源记录 ID，提交后关闭其提醒
      if (options.sourceId) {
        this._sourceRecordId = options.sourceId;
      }
    } else {
      this.setData({ 'form.date': todayStr });
    }
  },

  // 加载已有记录（编辑模式）
  async loadRecord(id) {
    try {
      showLoading('加载中...');

      // 通过云函数获取详情
      const res = await wx.cloud.callFunction({
        name: 'recordManage',
        data: { action: 'get', data: { _id: id } }
      });

      if (!res.result || res.result.code !== 0) {
        hideLoading();
        showError('加载失败');
        return;
      }

      var r = res.result.data;
      var formatD = function(d) {
        if (!d) return '';
        var dt = new Date(d);
        return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      };
      this.setData({
        form: {
          type: r.type || '',
          date: formatD(r.date),
          title: r.title || '',
          description: r.description || '',
          location: r.location || '',
          cost: r.cost ? String(r.cost) : '',
          nextDate: formatD(r.nextDate),
          enableRemind: !!r.enableRemind,
          remindInterval: r.remindInterval || 0,
          images: r.images || []
        },
        customInterval: (r.remindInterval > 0 && [30, 60, 90, 180].indexOf(r.remindInterval) === -1) ? String(r.remindInterval) : ''
      });
      hideLoading();
    } catch (err) {
      console.error('加载记录失败', err);
      hideLoading();
      showError('加载失败');
    }
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
    this.setData({ ['form.' + field]: e.detail.value });
    // 修改记录日期时，如果已开启提醒，重新计算 nextDate
    if (field === 'date' && this.data.form.enableRemind && this.data.form.remindInterval > 0) {
      this.calcNextDate(this.data.form.remindInterval);
    }
  },

  // 提醒开关切换
  onRemindChange(e) {
    var enabled = e.detail.value;
    this.setData({ 'form.enableRemind': enabled });
    if (!enabled) {
      this.setData({ 'form.nextDate': '', 'form.remindInterval': 0, customInterval: '' });
    }
  },

  // 选择预设间隔
  onSelectInterval(e) {
    var days = Number(e.currentTarget.dataset.days);
    this.setData({ 'form.remindInterval': days, customInterval: '' });
    this.calcNextDate(days);
  },

  // 自定义间隔输入
  onCustomInterval(e) {
    var val = e.detail.value;
    var days = Number(val);
    this.setData({ customInterval: val });
    if (days > 0) {
      this.setData({ 'form.remindInterval': days });
      this.calcNextDate(days);
    }
  },

  // 根据间隔天数计算下次提醒日期
  calcNextDate(days) {
    if (!this.data.form.date || !days) return;
    var base = new Date(this.data.form.date);
    base.setDate(base.getDate() + days);
    var y = base.getFullYear();
    var m = String(base.getMonth() + 1).padStart(2, '0');
    var d = String(base.getDate()).padStart(2, '0');
    this.setData({ 'form.nextDate': y + '-' + m + '-' + d });
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

    var app = getApp();
    var petId = app.globalData.currentPetId;
    if (!petId) {
      showError('请先添加宠物');
      return;
    }

    this.setData({ submitting: true });
    showLoading('保存中...');

    try {
      var form = this.data.form;

      // 上传图片
      var uploadedImages = [];
      for (var i = 0; i < form.images.length; i++) {
        var img = form.images[i];
        if (img.startsWith('cloud://')) {
          uploadedImages.push(img);
        } else {
          var fileID = await uploadFile(img, 'records');
          if (fileID) uploadedImages.push(fileID);
        }
      }

      var fields = {
        type: form.type,
        date: new Date(form.date),
        title: form.title.trim(),
        description: (form.description || '').trim(),
        location: (form.location || '').trim(),
        cost: form.cost ? Number(form.cost) : 0,
        nextDate: form.nextDate ? new Date(form.nextDate) : null,
        enableRemind: !!form.enableRemind,
        remindInterval: form.enableRemind ? (form.remindInterval || 0) : 0,
        images: uploadedImages
      };

      if (this.data.editId) {
        // 编辑模式：通过云函数更新
        fields._id = this.data.editId;
        await wx.cloud.callFunction({
          name: 'recordManage',
          data: { action: 'update', data: fields }
        });
      } else {
        // 新增模式：通过云函数添加
        fields.petId = petId;
        fields.createdAt = new Date();
        await wx.cloud.callFunction({
          name: 'recordManage',
          data: { action: 'add', data: fields }
        });

        // 如果来自"立即完成"，关闭原记录的提醒
        if (this._sourceRecordId) {
          try {
            await wx.cloud.callFunction({
              name: 'recordManage',
              data: {
                action: 'update',
                data: { _id: this._sourceRecordId, enableRemind: false, nextDate: null }
              }
            });
          } catch (e) {
            console.error('关闭原记录提醒失败', e);
          }
        }
      }

      hideLoading();
      showSuccess(this.data.editId ? '修改成功' : '记录成功');
      setTimeout(function() { wx.navigateBack(); }, 1500);
    } catch (err) {
      console.error('保存记录失败：', err);
      hideLoading();
      showError('保存失败，请重试');
    }

    this.setData({ submitting: false });
  },

  // 删除记录（编辑模式）
  onDelete() {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      confirmColor: '#C0392B',
      success: function(res) {
        if (res.confirm) {
          showLoading('删除中...');
          // 通过云函数删除
          wx.cloud.callFunction({
            name: 'recordManage',
            data: { action: 'delete', data: { _id: that.data.editId } }
          }).then(function() {
            hideLoading();
            showSuccess('已删除');
            setTimeout(function() { wx.navigateBack(); }, 1500);
          }).catch(function(err) {
            console.error('删除失败', err);
            hideLoading();
            showError('删除失败');
          });
        }
      }
    });
  }
});