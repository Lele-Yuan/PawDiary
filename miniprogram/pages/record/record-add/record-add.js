const { RECORD_TYPES } = require('../../../utils/constants');
const { showLoading, hideLoading, showSuccess, showError } = require('../../../utils/util');
const { uploadFile } = require('../../../utils/cloud');
const { MAX_PHOTOS_PER_DETAIL, checkPhotoLimit, incrementPhotoCount, checkImageSize } = require('../../../utils/limit');

Page({
  data: {
    typeList: RECORD_TYPES,
    typeIndex: null,
    today: '',
    submitting: false,
    customInterval: '',
    editId: '',
    pageTitle: '添加记录',
    titlePlaceholder: '标题',
    // 体重单位
    weightUnits: [
      { key: 'kg', label: 'kg' },
      { key: 'g', label: 'g' }
    ],
    weightUnitIndex: 0,
    // 尿便状态
    poopStatuses: [
      { key: 'normal', label: '正常' },
      { key: 'abnormal', label: '异常' }
    ],
    poopStatusIndex: null,
    isPoopAbnormal: false,
    // 食物类型
    foodTypes: [
      { key: 'dry', label: '干粮' },
      { key: 'wet', label: '湿粮' },
      { key: 'homemade', label: '自制' }
    ],
    foodTypeIndex: null,
    // 驱虫类型
    dewormTypes: [
      { key: 'external', label: '体外驱虫' },
      { key: 'internal', label: '体内驱虫' },
      { key: 'both', label: '内外同驱' }
    ],
    dewormTypeIndex: null,
    // 疫苗类型
    vaccineTypes: [
      { key: 'rabies', label: '狂犬疫苗' },
      { key: 'infectious', label: '传染病疫苗' }
    ],
    vaccineTypeIndex: null,
    // 给药方式
    medicationTypes: [
      { key: 'oral', label: '口服' },
      { key: 'external', label: '外用' },
      { key: 'rectal', label: '直肠' },
      { key: 'injection', label: '注射' }
    ],
    medicationTypeIndex: null,
    // 是否隐藏标题
    hideTitle: false,
    // 日期
    form: {
      type: '',
      date: '',
      displayDateTime: '',
      title: '',
      description: '',
      location: '',
      cost: '',
      nextDate: '',
      enableRemind: false,
      remindInterval: 0,
      images: [],
      // 类型特定字段
      weight: '',
      weightUnit: '',
      poopStatus: '',
      abnormalDesc: '',
      waterAmount: '',
      foodType: '',
      foodAmount: '',
      dewormType: '',
      vaccineType: '',
      medicationType: '',
      dosage: '',
      hospitalName: '',
      // 发情专用字段
      heatStage: ''
    },
    // 发情阶段选项
    heatStageOptions: [
      { key: 'started', label: '发情开始' },
      { key: 'ended', label: '发情结束' }
    ]
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
    } else if (options.prefill === '1' && options.sourceId) {
      // 从"立即完成"跳转，先获取完整记录数据再预填
      this.loadSourceRecord(options.sourceId);
    } else if (options.type) {
      // 从类型选择页面跳转，预选类型
      var typeIndex = this.data.typeList.findIndex(function(t) { return t.key === options.type; });
      var typeInfo = this.data.typeList[typeIndex];
      this.setData({
        'form.date': todayStr,
        'form.type': options.type,
        typeIndex: typeIndex >= 0 ? typeIndex : null,
        titlePlaceholder: typeInfo ? typeInfo.titlePlaceholder : '标题',
        hideTitle: typeInfo ? !!typeInfo.hideTitle : false
      });
    } else if (options.prefill === '1') {
      // 兼容旧版本的URL参数方式（如果还有使用）
      this.setData({
        'form.date': todayStr,
        'form.type': decodeURIComponent(options.type || ''),
        'form.title': decodeURIComponent(options.title || '')
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
      // 预填类型特定数据
      if (options.weight) {
        this.setData({ 'form.weight': decodeURIComponent(options.weight) });
        var weightUnit = decodeURIComponent(options.weightUnit || 'kg');
        var unitIndex = this.data.weightUnits.findIndex(function(u) { return u.key === weightUnit; });
        this.setData({
          'form.weightUnit': weightUnit,
          weightUnitIndex: unitIndex >= 0 ? unitIndex : 0
        });
      }
      if (options.poopStatus) {
        var poopStatus = decodeURIComponent(options.poopStatus);
        var poopStatusIndex = this.data.poopStatuses.findIndex(function(s) { return s.key === poopStatus; });
        this.setData({
          'form.poopStatus': poopStatus,
          poopStatusIndex: poopStatusIndex >= 0 ? poopStatusIndex : 0
        });
      }
      if (options.abnormalDesc) {
        this.setData({ 'form.abnormalDesc': decodeURIComponent(options.abnormalDesc) });
      }
      if (options.waterAmount) {
        this.setData({ 'form.waterAmount': decodeURIComponent(options.waterAmount) });
        var waterUnit = decodeURIComponent(options.waterUnit || 'ml');
        this.setData({ 'form.waterUnit': waterUnit });
      }
      if (options.foodType) {
        var foodType = decodeURIComponent(options.foodType);
        var foodTypeIndex = this.data.foodTypes.findIndex(function(t) { return t.key === foodType; });
        this.setData({
          'form.foodType': foodType,
          foodTypeIndex: foodTypeIndex >= 0 ? foodTypeIndex : 0
        });
      }
      if (options.dewormType) {
        var dewormType = decodeURIComponent(options.dewormType);
        var dewormTypeIndex = this.data.dewormTypes.findIndex(function(t) { return t.key === dewormType; });
        this.setData({
          'form.dewormType': dewormType,
          dewormTypeIndex: dewormTypeIndex >= 0 ? dewormTypeIndex : 0
        });
      }
      if (options.vaccineType) {
        var vaccineType = decodeURIComponent(options.vaccineType);
        var vaccineTypeIndex = this.data.vaccineTypes.findIndex(function(t) { return t.key === vaccineType; });
        this.setData({
          'form.vaccineType': vaccineType,
          vaccineTypeIndex: vaccineTypeIndex >= 0 ? vaccineTypeIndex : 0
        });
      }
      if (options.medicationType) {
        var medicationType = decodeURIComponent(options.medicationType);
        var medicationTypeIndex = this.data.medicationTypes.findIndex(function(t) { return t.key === medicationType; });
        this.setData({
          'form.medicationType': medicationType,
          medicationTypeIndex: medicationTypeIndex >= 0 ? medicationTypeIndex : 0
        });
      }
      if (options.notes) {
        this.setData({ 'form.notes': decodeURIComponent(options.notes) });
      }
      // 保存来源记录 ID，提交后关闭其提醒
      if (options.sourceId) {
        this._sourceRecordId = options.sourceId;
      }
    } else {
      this.setData({ 'form.date': todayStr });
    }
  },

  // 加载来源记录数据（用于立即完成）
  async loadSourceRecord(sourceId) {
    showLoading('加载中...');
    try {
      const res = await wx.cloud.callFunction({
        name: 'recordManage',
        data: { action: 'get', data: { _id: sourceId } }
      });

      if (res.result && res.result.code === 0) {
        var record = res.result.data;
        var type = record.type || '';
        var typeIndex = this.data.typeList.findIndex(function(t) { return t.key === type; });
        var typeInfo = this.data.typeList[typeIndex >= 0 ? typeIndex : 0];

        var today = new Date();
        var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        this.setData({
          'form.date': todayStr,
          'form.type': type,
          'form.title': record.title || '',
          typeIndex: typeIndex >= 0 ? typeIndex : null,
          titlePlaceholder: typeInfo ? typeInfo.titlePlaceholder : '标题',
          hideTitle: typeInfo ? !!typeInfo.hideTitle : false
        });

        // 继承提醒设置
        if (record.enableRemind && record.remindInterval && record.remindInterval > 0) {
          this.setData({
            'form.enableRemind': true,
            'form.remindInterval': record.remindInterval
          });
          // 自定义间隔回显
          if ([30, 60, 90, 180].indexOf(record.remindInterval) === -1) {
            this.setData({ customInterval: String(record.remindInterval) });
          }
          this.calcNextDate(record.remindInterval);
        }

        // 预填类型特定数据
        if (record.weight) this.setData({ 'form.weight': record.weight });
        if (record.weightUnit) {
          var weightUnit = record.weightUnit;
          var unitIndex = this.data.weightUnits.findIndex(function(u) { return u.key === weightUnit; });
          this.setData({
            'form.weightUnit': weightUnit,
            weightUnitIndex: unitIndex >= 0 ? unitIndex : 0
          });
        }
        if (record.poopStatus) {
          var poopStatus = record.poopStatus;
          var poopStatusIndex = this.data.poopStatuses.findIndex(function(s) { return s.key === poopStatus; });
          this.setData({
            'form.poopStatus': poopStatus,
            poopStatusIndex: poopStatusIndex >= 0 ? poopStatusIndex : 0
          });
        }
        if (record.abnormalDesc) this.setData({ 'form.abnormalDesc': record.abnormalDesc });
        if (record.waterAmount) this.setData({ 'form.waterAmount': record.waterAmount });
        if (record.waterUnit) this.setData({ 'form.waterUnit': record.waterUnit });
        if (record.foodType) {
          var foodType = record.foodType;
          var foodTypeIndex = this.data.foodTypes.findIndex(function(t) { return t.key === foodType; });
          this.setData({
            'form.foodType': foodType,
            foodTypeIndex: foodTypeIndex >= 0 ? foodTypeIndex : 0
          });
        }
        if (record.dewormType) {
          var dewormType = record.dewormType;
          var dewormTypeIndex = this.data.dewormTypes.findIndex(function(t) { return t.key === dewormType; });
          this.setData({
            'form.dewormType': dewormType,
            dewormTypeIndex: dewormTypeIndex >= 0 ? dewormTypeIndex : 0
          });
        }
        if (record.vaccineType) {
          var vaccineType = record.vaccineType;
          var vaccineTypeIndex = this.data.vaccineTypes.findIndex(function(t) { return t.key === vaccineType; });
          this.setData({
            'form.vaccineType': vaccineType,
            vaccineTypeIndex: vaccineTypeIndex >= 0 ? vaccineTypeIndex : 0
          });
        }
        if (record.medicationType) {
          var medicationType = record.medicationType;
          var medicationTypeIndex = this.data.medicationTypes.findIndex(function(t) { return t.key === medicationType; });
          this.setData({
            'form.medicationType': medicationType,
            medicationTypeIndex: medicationTypeIndex >= 0 ? medicationTypeIndex : 0
          });
        }
        if (record.notes) this.setData({ 'form.notes': record.notes });
        // 处理发情阶段
        if (record.heatStage) {
          var heatStage = record.heatStage;
          var heatStageIndex = this.data.heatStageOptions.findIndex(function(s) { return s.key === heatStage; });
          this.setData({
            'form.heatStage': heatStage,
            heatStageIndex: heatStageIndex >= 0 ? heatStageIndex : 0
          });
        }

        // 保存来源记录 ID，提交后关闭其提醒
        this._sourceRecordId = sourceId;
      } else {
        showError('获取记录数据失败');
      }
    } catch (err) {
      console.error('加载来源记录失败：', err);
      showError('加载记录数据失败');
    }
    hideLoading();
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
      var typeIndex = this.data.typeList.findIndex(function(t) { return t.key === r.type; });
      var typeInfo = this.data.typeList[typeIndex];
      this.setData({
        form: {
          type: r.type || '',
          date: formatD(r.date),
          title: r.title || '',
          description: r.description || '',
          nextDate: formatD(r.nextDate),
          enableRemind: !!r.enableRemind,
          remindInterval: r.remindInterval || 0,
          images: r.images || [],
          // 类型特定字段
          weight: r.weight || '',
          weightUnit: r.weightUnit || 'kg',
          poopStatus: r.poopStatus || '',
          abnormalDesc: r.abnormalDesc || '',
          waterAmount: r.waterAmount || '',
          foodType: r.foodType || '',
          foodAmount: r.foodAmount || '',
          dewormType: r.dewormType || '',
          vaccineType: r.vaccineType || '',
          medicationType: r.medicationType || '',
          dosage: r.dosage || '',
          hospitalName: r.hospitalName || '',
          // 发情专用字段
          heatStage: r.heatStage || ''
        },
        typeIndex: typeIndex >= 0 ? typeIndex : null,
        titlePlaceholder: typeInfo ? typeInfo.titlePlaceholder : '标题',
        hideTitle: typeInfo ? !!typeInfo.hideTitle : false,
        // 设置类型特定索引
        weightUnitIndex: r.weightUnit === 'kg' ? 0 : (r.weightUnit === 'g' ? 1 : null),
        poopStatusIndex: r.poopStatus === 'normal' ? 0 : (r.poopStatus === 'abnormal' ? 1 : null),
        foodTypeIndex: r.foodType === 'dry' ? 0 : (r.foodType === 'wet' ? 1 : (r.foodType === 'homemade' ? 2 : null)),
        dewormTypeIndex: r.dewormType === 'external' ? 0 : (r.dewormType === 'internal' ? 1 : (r.dewormType === 'both' ? 2 : null)),
        vaccineTypeIndex: r.vaccineType === 'rabies' ? 0 : (r.vaccineType === 'infectious' ? 1 : null),
        medicationTypeIndex: r.medicationType === 'oral' ? 0 : r.medicationType === 'external' ? 1 : (r.medicationType === 'rectal' ? 2 : (r.medicationType === 'injection' ? 3 : null)),
        // 发情阶段索引
        heatStageIndex: r.heatStage === 'ended' ? 1 : 0
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
    const index = e.detail.value;
    const type = this.data.typeList[index].key;
    const typeInfo = this.data.typeList[index];
    this.setData({
      'form.type': type,
      typeIndex: index,
      titlePlaceholder: typeInfo ? typeInfo.titlePlaceholder : '标题',
      hideTitle: typeInfo ? !!typeInfo.hideTitle : false,
      // 重置其他类型的索引
      weightUnitIndex: null,
      poopStatusIndex: null,
      isPoopAbnormal: false,
      foodTypeIndex: null,
      dewormTypeIndex: null,
      vaccineTypeIndex: null,
      medicationTypeIndex: null,
      // 发情类型时设置阶段索引
      heatStageIndex: (type === 'heat') ? 0 : null
    });
  },

  // 选择发情阶段
  onHeatStageChange(e) {
    const index = e.detail.value;
    const stage = this.data.heatStageOptions[index].key;
    this.setData({ heatStageIndex: index, 'form.heatStage': stage });
  },

  // 通用输入
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 体重单位选择
  onWeightUnitChange(e) {
    const index = e.detail.value;
    const unit = this.data.weightUnits[index].key;
    this.setData({ weightUnitIndex: index, 'form.weightUnit': unit });
  },

  // 尿便状态选择
  onPoopStatusChange(e) {
    const index = e.detail.value;
    const status = this.data.poopStatuses[index].key;
    this.setData({ poopStatusIndex: index, 'form.poopStatus': status, isPoopAbnormal: status === 'abnormal' });
  },

  // 食物类型选择
  onFoodTypeChange(e) {
    const index = e.detail.value;
    const type = this.data.foodTypes[index].key;
    this.setData({ foodTypeIndex: index, 'form.foodType': type });
  },

  // 驱虫类型选择
  onDewormTypeChange(e) {
    const index = e.detail.value;
    const type = this.data.dewormTypes[index].key;
    this.setData({ dewormTypeIndex: index, 'form.dewormType': type });
  },

  // 疫苗类型选择
  onVaccineTypeChange(e) {
    const index = e.detail.value;
    const type = this.data.vaccineTypes[index].key;
    this.setData({ vaccineTypeIndex: index, 'form.vaccineType': type });
  },

  // 给药方式选择
  onMedicationTypeChange(e) {
    const index = e.detail.value;
    const type = this.data.medicationTypes[index].key;
    this.setData({ medicationTypeIndex: index, 'form.medicationType': type });
  },

  // 日期选择（用于下次预计日期）
  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
    // 选择下次预计日期时，清空提醒间隔
    if (field === 'nextDate') {
      this.setData({ 'form.remindInterval': 0, customInterval: '' });
    }
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
    this.setData({ 'form.remindInterval': days, customInterval: '', 'form.nextDate': '' });
    this.calcNextDate(days);
  },

  // 自定义间隔输入
  onCustomInterval(e) {
    var val = e.detail.value;
    var days = Number(val);
    this.setData({ customInterval: val, 'form.nextDate': '' });
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
    const currentCount = this.data.form.images.length;
    if (currentCount >= MAX_PHOTOS_PER_DETAIL) {
      wx.showToast({ title: `最多上传${MAX_PHOTOS_PER_DETAIL}张图片`, icon: 'none' });
      return;
    }
    const photoCheck = checkPhotoLimit(1);
    if (!photoCheck.ok) {
      wx.showToast({ title: '今日上传照片已达上限（5张）', icon: 'none' });
      return;
    }
    const remaining = Math.min(MAX_PHOTOS_PER_DETAIL - currentCount, photoCheck.remaining);
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function(res) {
        const sizeResult = checkImageSize(res.tempFiles);
        if (sizeResult.oversizedCount > 0) {
          wx.showToast({ title: `${sizeResult.oversizedCount}张图片超过500KB，已过滤`, icon: 'none' });
        }
        if (sizeResult.validFiles.length === 0) return;
        var newImages = sizeResult.validFiles.map(function(f) { return f.tempFilePath; });
        const images = this.data.form.images.concat(newImages).slice(0, MAX_PHOTOS_PER_DETAIL);
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
    // 根据类型验证必填项
    switch (form.type) {
      case 'weight':
        if (!form.weight || !form.weight.trim()) {
          showError('请输入体重');
          return false;
        }
        break;
      case 'poop':
        if (!form.poopStatus) {
          showError('请选择尿便状态');
          return false;
        }
        if (form.poopStatus === 'abnormal' && (!form.abnormalDesc || !form.abnormalDesc.trim())) {
          showError('请输入异常描述');
          return false;
        }
        break;
      case 'water':
        if (!form.waterAmount || !form.waterAmount.trim()) {
          showError('请输入饮水量');
          return false;
        }
        break;
      case 'diet':
        break;
      case 'deworm':
        break;
      case 'vaccine':
        break;
      case 'illness':
        break;
      case 'checkup':
        break;
    }
    // 如果开启了提醒，必须填写下次预计日期
    if (form.enableRemind && !form.nextDate) {
      showError('请填写下次预计日期');
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

      // 统计本次新增图片（非已上传的 cloud:// 图片）
      var newPhotoCount = form.images.filter(function(img) { return !img.startsWith('cloud://'); }).length;
      if (newPhotoCount > 0) {
        const photoCheck = checkPhotoLimit(newPhotoCount);
        if (!photoCheck.ok) {
          hideLoading();
          showError('今日上传照片已达上限（5张）');
          this.setData({ submitting: false });
          return;
        }
      }

      // 上传图片
      var uploadedImages = [];
      var actualUploadCount = 0;
      for (var i = 0; i < form.images.length; i++) {
        var img = form.images[i];
        if (img.startsWith('cloud://')) {
          uploadedImages.push(img);
        } else {
          var fileID = await uploadFile(img, 'records');
          if (fileID) {
            uploadedImages.push(fileID);
            actualUploadCount++;
          }
        }
      }

      // 构建日期
      var fullDateStr = form.date;

      // 获取类型标签用于默认标题
      var typeLabel = '';
      var typeItem = this.data.typeList.find(function(t) { return t.key === form.type; });
      if (typeItem) {
        typeLabel = typeItem.label;
      }

      var fields = {
        type: form.type,
        date: new Date(fullDateStr),
        title: form.title ? form.title.trim() : typeLabel,
        description: (form.description || '').trim(),
        nextDate: form.nextDate ? new Date(form.nextDate + ' 12:00') : null,
        enableRemind: !!form.enableRemind,
        remindInterval: form.enableRemind ? (form.remindInterval || 0) : 0,
        images: uploadedImages,
        // 类型特定字段
        weight: form.weight,
        weightUnit: form.weightUnit,
        poopStatus: form.poopStatus,
        abnormalDesc: form.abnormalDesc,
        waterAmount: form.waterAmount,
        foodType: form.foodType,
        foodAmount: form.foodAmount,
        dewormType: form.dewormType,
        vaccineType: form.vaccineType,
        medicationType: form.medicationType,
        dosage: form.dosage,
        hospitalName: form.hospitalName,
        // 发情专用字段
        heatStage: form.heatStage
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
      if (actualUploadCount > 0) incrementPhotoCount(actualUploadCount);
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
