Page({
  data: {
    statusBarHeight: 20,
    navHeight: 64,
    submitting: false,
    editId: '',    // 编辑模式时的帖子 ID

    // 角色选项
    roleOptions: [
      { key: 'helper', label: '临时主', desc: '我来帮忙', icon: '🙋' },
      { key: 'owner', label: '需求方', desc: '我需要帮助', icon: '🐾' }
    ],
    // 服务类型选项
    serviceOptions: [
      { key: 'poop', label: '铲屎', icon: '💩' },
      { key: 'walk', label: '遛狗', icon: '🦮' },
      { key: 'other', label: '异宠', icon: '🐜' }
    ],
    // 时间模式
    timeModes: [
      { key: 'range', label: '时间区间' },
      { key: 'multi', label: '多选日期' }
    ],
    weekLabels: ['一', '二', '三', '四', '五', '六', '日'],
    calendarYear: 2026,
    calendarMonth: 1,
    calendarDays: [],

    // 表单数据
    role: '',
    serviceType: '',
    exoticPetType: '',
    locationAddress: '',
    locationLatitude: 0,
    locationLongitude: 0,
    radius: 3,
    availableTime: {
      mode: 'range',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      selectedDates: [],
      timeDesc: ''
    },
    petInfo: {
      name: '',
      breed: '',
      weight: ''
    },
    contactInfo: {
      phone: '',
      wechat: ''
    },
    description: '',
    // 宠物选择
    myPets: [],
    filteredPets: [],
    selectedPetId: ''
  },

  onLoad(options) {
    try {
      var systemInfo = wx.getSystemInfoSync();
      var statusBarHeight = systemInfo.statusBarHeight || 20;
      this.setData({
        statusBarHeight,
        navHeight: statusBarHeight + 44
      });
    } catch (e) {}
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    this.setData({
      calendarYear: year,
      calendarMonth: month,
      calendarDays: this._generateCalendar(year, month)
    });
    if (options && options.editId) {
      this.setData({ editId: options.editId });
      this._loadPostForEdit(options.editId);
    }
  },

  // 加载帖子数据用于编辑
  async _loadPostForEdit(postId) {
    wx.showLoading({ title: '加载中...' });
    try {
      var res = await wx.cloud.callFunction({
        name: 'careManage',
        data: { action: 'get', data: { postId } }
      });
      wx.hideLoading();
      if (res.result && res.result.code === 0) {
        var post = res.result.data;
        var t = post.availableTime || {};
        var availableTime = {
          mode: t.mode || 'range',
          startDate: t.startDate || '',
          endDate: t.endDate || '',
          startTime: t.startTime || '',
          endTime: t.endTime || '',
          selectedDates: t.selectedDates || [],
          timeDesc: t.timeDesc || t.dateDesc || ''
        };
        var calendarYear = this.data.calendarYear;
        var calendarMonth = this.data.calendarMonth;
        if (availableTime.mode === 'multi' && availableTime.selectedDates.length) {
          var parts = availableTime.selectedDates[0].split('-');
          calendarYear = parseInt(parts[0]);
          calendarMonth = parseInt(parts[1]);
        }
        this.setData({
          role: post.role || '',
          serviceType: post.serviceType || '',
          exoticPetType: post.exoticPetType || '',
          locationAddress: (post.location && post.location.address) || '',
          locationLatitude: (post.location && post.location.latitude) || 0,
          locationLongitude: (post.location && post.location.longitude) || 0,
          radius: post.radius || 3,
          availableTime,
          petInfo: post.petInfo || { name: '', breed: '', weight: '' },
          contactInfo: post.contactInfo || { phone: '', wechat: '' },
          description: post.description || '',
          calendarYear,
          calendarMonth,
          calendarDays: this._generateCalendar(calendarYear, calendarMonth, availableTime.selectedDates)
        });
        if (post.role === 'owner') {
          this._loadMyPets();
        }
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 返回
  onBack() {
    wx.navigateBack();
  },

  // 切换角色：切换到需求方时加载宠物列表
  onRoleChange(e) {
    var key = e.currentTarget.dataset.key;
    this.setData({ role: key });
    if (key === 'owner' && !this.data.myPets.length) {
      this._loadMyPets();
    }
  },

  // 拉取宠物列表（仅 creator / admin）
  async _loadMyPets() {
    try {
      var res = await wx.cloud.callFunction({
        name: 'petManage',
        data: { action: 'list' }
      });
      if (res.result && res.result.code === 0) {
        var pets = (res.result.data || []).filter(function (p) {
          return p.role === 'creator' || p.role === 'admin';
        });
        this.setData({ myPets: pets });
        this._updateFilteredPets(pets);
      }
    } catch (e) {}
  },

  // 根据服务类型筛选对应物种的宠物
  _updateFilteredPets(pets) {
    var speciesMap = { poop: 'cat', walk: 'dog', other: 'other' };
    var targetSpecies = speciesMap[this.data.serviceType];
    var source = pets || this.data.myPets;
    var filtered = targetSpecies
      ? source.filter(function (p) { return p.species === targetSpecies; })
      : source;
    // 若当前选中的宠物不在过滤结果中，取消选中
    var selectedPetId = this.data.selectedPetId;
    var stillValid = filtered.some(function (p) { return p._id === selectedPetId; });
    this.setData({
      filteredPets: filtered,
      selectedPetId: stillValid ? selectedPetId : '',
      petInfo: stillValid ? this.data.petInfo : { name: '', breed: '', weight: '' }
    });
  },

  // 选择宠物：回填 petInfo，再次点击取消选择
  onSelectPet(e) {
    var petId = e.currentTarget.dataset.id;
    if (this.data.selectedPetId === petId) {
      this.setData({ selectedPetId: '', petInfo: { name: '', breed: '', weight: '' } });
      return;
    }
    var pet = null;
    for (var i = 0; i < this.data.myPets.length; i++) {
      if (this.data.myPets[i]._id === petId) { pet = this.data.myPets[i]; break; }
    }
    if (!pet) return;
    this.setData({
      selectedPetId: petId,
      petInfo: {
        name: pet.name || '',
        breed: pet.breed || '',
        weight: pet.weight ? String(pet.weight) : ''
      }
    });
  },

  // 切换服务类型
  onServiceChange(e) {
    var key = e.currentTarget.dataset.key;
    this.setData({ serviceType: key, exoticPetType: key === 'other' ? this.data.exoticPetType : '' });
    // 同步刷新宠物过滤列表
    if (this.data.myPets.length) {
      this._updateFilteredPets();
    }
  },

  // 选择地点
  async onChooseLocation() {
    try {
      var res = await wx.chooseLocation({});
      this.setData({
        locationAddress: res.address || res.name || '',
        locationLatitude: res.latitude,
        locationLongitude: res.longitude
      });
    } catch (e) {
      // 用户取消选择
    }
  },

  // 半径 slider 变更
  onSliderChange(e) {
    this.setData({ radius: e.detail.value });
  },

  // 生成日历数据
  _generateCalendar(year, month, selectedDates) {
    selectedDates = selectedDates || this.data.availableTime.selectedDates || [];
    var firstDay = new Date(year, month - 1, 1).getDay();
    var daysInMonth = new Date(year, month, 0).getDate();
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    var startOffset = (firstDay + 6) % 7; // 周一起始
    var days = [];
    for (var i = 0; i < startOffset; i++) {
      days.push({ empty: true });
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      days.push({
        day: d,
        date: dateStr,
        selected: selectedDates.indexOf(dateStr) !== -1,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr
      });
    }
    return days;
  },

  // 切换时间模式
  onTimeModeChange(e) {
    var mode = e.currentTarget.dataset.key;
    var availableTime = Object.assign({}, this.data.availableTime, { mode });
    this.setData({ availableTime });
  },

  // 开始日期
  onStartDateChange(e) {
    var availableTime = Object.assign({}, this.data.availableTime, { startDate: e.detail.value });
    this.setData({ availableTime });
  },

  // 结束日期
  onEndDateChange(e) {
    var availableTime = Object.assign({}, this.data.availableTime, { endDate: e.detail.value });
    this.setData({ availableTime });
  },

  // 开始时间
  onStartTimeChange(e) {
    var availableTime = Object.assign({}, this.data.availableTime, { startTime: e.detail.value });
    this.setData({ availableTime });
  },

  // 结束时间
  onEndTimeChange(e) {
    var availableTime = Object.assign({}, this.data.availableTime, { endTime: e.detail.value });
    this.setData({ availableTime });
  },

  // 日历上个月
  onCalendarPrev() {
    var year = this.data.calendarYear;
    var month = this.data.calendarMonth - 1;
    if (month < 1) { month = 12; year--; }
    this.setData({ calendarYear: year, calendarMonth: month, calendarDays: this._generateCalendar(year, month) });
  },

  // 日历下个月
  onCalendarNext() {
    var year = this.data.calendarYear;
    var month = this.data.calendarMonth + 1;
    if (month > 12) { month = 1; year++; }
    this.setData({ calendarYear: year, calendarMonth: month, calendarDays: this._generateCalendar(year, month) });
  },

  // 点击日期（多选）
  onToggleDate(e) {
    var date = e.currentTarget.dataset.date;
    if (!date) return;
    var selectedDates = (this.data.availableTime.selectedDates || []).slice();
    var idx = selectedDates.indexOf(date);
    if (idx === -1) {
      selectedDates.push(date);
      selectedDates.sort();
    } else {
      selectedDates.splice(idx, 1);
    }
    var availableTime = Object.assign({}, this.data.availableTime, { selectedDates });
    var calendarDays = this._generateCalendar(this.data.calendarYear, this.data.calendarMonth, selectedDates);
    this.setData({ availableTime, calendarDays });
  },

  // 清空多选日期
  onClearDates() {
    var availableTime = Object.assign({}, this.data.availableTime, { selectedDates: [] });
    var calendarDays = this._generateCalendar(this.data.calendarYear, this.data.calendarMonth, []);
    this.setData({ availableTime, calendarDays });
  },

  // 时间补充说明
  onTimeDescInput(e) {
    var availableTime = Object.assign({}, this.data.availableTime, { timeDesc: e.detail.value });
    this.setData({ availableTime });
  },

  // 异宠类型输入
  onExoticPetTypeInput(e) {
    this.setData({ exoticPetType: e.detail.value });
  },

  // 宠物信息输入
  onPetInfoInput(e) {
    var field = e.currentTarget.dataset.field;
    var petInfo = Object.assign({}, this.data.petInfo);
    petInfo[field] = e.detail.value;
    this.setData({ petInfo });
  },

  // 联系方式输入
  onContactInput(e) {
    var field = e.currentTarget.dataset.field;
    var contactInfo = Object.assign({}, this.data.contactInfo);
    contactInfo[field] = e.detail.value;
    this.setData({ contactInfo });
  },

  // 补充说明输入
  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  // 表单验证
  _validate() {
    if (!this.data.role) {
      wx.showToast({ title: '请选择您的角色', icon: 'none' });
      return false;
    }
    if (!this.data.serviceType) {
      wx.showToast({ title: '请选择服务类型', icon: 'none' });
      return false;
    }
    if (this.data.serviceType === 'other' && !this.data.exoticPetType.trim()) {
      wx.showToast({ title: '请填写异宠类型', icon: 'none' });
      return false;
    }
    if (!this.data.locationLatitude || !this.data.locationLongitude) {
      wx.showToast({ title: '请选择服务地点', icon: 'none' });
      return false;
    }
    var t = this.data.availableTime;
    if (t.mode === 'range' && !t.startDate) {
      wx.showToast({ title: '请选择开始日期', icon: 'none' });
      return false;
    }
    if (t.mode === 'multi' && (!t.selectedDates || !t.selectedDates.length)) {
      wx.showToast({ title: '请选择至少一个日期', icon: 'none' });
      return false;
    }
    if (!this.data.contactInfo.phone && !this.data.contactInfo.wechat) {
      wx.showToast({ title: '请至少填写一种联系方式', icon: 'none' });
      return false;
    }
    return true;
  },

  // 提交发布 / 保存编辑
  async onSubmit() {
    if (this.data.submitting) return;
    if (!this._validate()) return;

    this.setData({ submitting: true });
    var isEdit = !!this.data.editId;

    try {
      var payload = {
        role: this.data.role,
        serviceType: this.data.serviceType,
        exoticPetType: this.data.serviceType === 'other' ? this.data.exoticPetType : '',
        location: {
          address: this.data.locationAddress,
          latitude: this.data.locationLatitude,
          longitude: this.data.locationLongitude
        },
        radius: this.data.radius,
        availableTime: this.data.availableTime,
        contactInfo: this.data.contactInfo,
        petInfo: this.data.petInfo,
        description: this.data.description
      };
      if (isEdit) {
        payload.postId = this.data.editId;
      }

      var res = await wx.cloud.callFunction({
        name: 'careManage',
        data: { action: isEdit ? 'update' : 'publish', data: payload }
      });

      if (res.result && res.result.code === 0) {
        wx.showToast({ title: isEdit ? '已保存' : '发布成功', icon: 'success' });
        setTimeout(function () {
          wx.navigateBack();
        }, 1200);
      } else {
        wx.showToast({ title: (res.result && res.result.message) || (isEdit ? '保存失败' : '发布失败'), icon: 'none' });
        this.setData({ submitting: false });
      }
    } catch (e) {
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
