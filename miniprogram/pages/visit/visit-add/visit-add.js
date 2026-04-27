var app = getApp();

Page({
  data: {
    // 页面状态
    statusBarHeight: 20,
    navHeight: 0,
    isEdit: false,
    recordId: '',
    noPermission: false,
    submitting: false,

    // 当前用户身份
    myRole: '',            // 'owner' | 'helper' | ''

    // 表单字段
    creatorRole: '',
    ownerNickname: '',
    helperNickname: '',
    serviceName: '上门喂猫',
    visitTimes: [],
    location: { address: '', addressDetail: '', latitude: 0, longitude: 0 },
    pets: [],
    message: '',
    ownerNote: '',
    helperNote: '',

    // 状态字段
    status: 'pending',
    ownerConfirmed: false,
    helperConfirmed: false,
    ownerOpenid: null,
    helperOpenid: null,
    statusLabel: '待确认',
    statusColor: '#E8875A',
    checkinCount: 0,        // 临时主已上门次数
    ownerConfirmCount: 0,   // 铲屎官已确认次数
    draggingIndex: -1,      // 正在拖拽的行索引
    dragOverIndex: -1,      // 拖拽目标位置索引

    // 是否是创建者（用于废弃按钮显示）
    isCreator: false
  },

  onLoad(options) {
    var systemInfo = wx.getSystemInfoSync();
    var statusBarHeight = systemInfo.statusBarHeight || 20;
    this.setData({ statusBarHeight, navHeight: statusBarHeight + 44 });

    if (options && options.editId) {
      this.setData({ isEdit: true, recordId: options.editId });
      this._loadRecord(options.editId);
    } else {
      var userInfo = app.globalData && app.globalData.userInfo;
      this._defaultNickname = (userInfo && userInfo.nickName) || '';
    }
  },

  // ===================== 数据加载 =====================

  async _loadRecord(recordId) {
    wx.showLoading({ title: '加载中...' });
    try {
      var res = await wx.cloud.callFunction({
        name: 'visitManage',
        data: { action: 'get', data: { recordId } }
      });
      wx.hideLoading();
      if (!res.result) return;

      if (res.result.code === -2) {
        this.setData({ noPermission: true });
        return;
      }
      if (res.result.code !== 0) {
        wx.showToast({ title: res.result.message || '加载失败', icon: 'none' });
        return;
      }

      var record = res.result.data.record;
      var myRole = res.result.data.myRole;
      var userInfo = app.globalData && app.globalData.userInfo;
      var myOpenid = userInfo && userInfo.openid;
      var myNick = (userInfo && userInfo.nickName) || '';

      // 被分享者打开时，若对应角色昵称为空则自动填入
      var ownerNickname = record.ownerNickname || '';
      var helperNickname = record.helperNickname || '';
      if (myNick) {
        if (myRole === 'owner' && !ownerNickname) ownerNickname = myNick;
        if (myRole === 'helper' && !helperNickname) helperNickname = myNick;
      }

      this.setData({
        myRole,
        isCreator: record._openid === myOpenid,
        creatorRole: record.creatorRole,
        ownerNickname,
        helperNickname,
        serviceName: record.serviceName || '上门喂猫',
        visitTimes: record.visitTimes || [],
        location: record.location || { address: '', addressDetail: '', latitude: 0, longitude: 0 },
        pets: record.pets || [],
        message: record.message || '',
        ownerNote: record.ownerNote || '',
        helperNote: record.helperNote || '',
        status: record.status,
        ownerConfirmed: record.ownerConfirmed,
        helperConfirmed: record.helperConfirmed,
        ownerOpenid: record.ownerOpenid,
        helperOpenid: record.helperOpenid,
        checkinCount: record.checkinCount || 0,
        ownerConfirmCount: record.ownerConfirmCount || 0,
        statusLabel: _statusLabel(record.status),
        statusColor: _statusColor(record.status)
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  // ===================== 角色选择（仅新建） =====================

  onSelectRole(e) {
    var role = e.currentTarget.dataset.role;
    var userNick = this._defaultNickname || '';
    this.setData({
      creatorRole: role,
      myRole: role,
      ownerNickname: role === 'owner' ? userNick : '',
      helperNickname: role === 'helper' ? userNick : ''
    });
  },

  // ===================== 基础字段输入 =====================

  onInputOwnerNickname(e) { this.setData({ ownerNickname: e.detail.value }); },
  onInputHelperNickname(e) { this.setData({ helperNickname: e.detail.value }); },
  onInputServiceName(e) { this.setData({ serviceName: e.detail.value }); },
  onInputMessage(e) { this.setData({ message: e.detail.value }); },
  onInputOwnerNote(e) { this.setData({ ownerNote: e.detail.value }); },
  onInputHelperNote(e) { this.setData({ helperNote: e.detail.value }); },

  // ===================== 上门时间 =====================

  // ---- 拖拽排序 ----
  onTimeDragStart(e) {
    var idx = +e.currentTarget.dataset.index;
    this._dragOriginalIndex = idx;
    this._dragStartY = e.touches[0].clientY;
    this.setData({ draggingIndex: idx, dragOverIndex: idx });
  },

  onTimeDragMove(e) {
    if (this._dragOriginalIndex < 0) return;
    var deltaY = e.touches[0].clientY - this._dragStartY;
    // time-row 高度约 52px（88rpx × 0.5 + 实际内容）
    var rowHeight = 52;
    var delta = Math.round(deltaY / rowHeight);
    var total = this.data.visitTimes.length;
    var minIdx = this.data.ownerConfirmCount; // 已完成的行不参与排序
    var newIdx = Math.max(minIdx, Math.min(total - 1, this._dragOriginalIndex + delta));
    if (newIdx !== this.data.dragOverIndex) {
      this.setData({ dragOverIndex: newIdx });
    }
  },

  onTimeDragEnd() {
    var from = this._dragOriginalIndex;
    var to = this.data.dragOverIndex;
    this._dragOriginalIndex = -1;
    if (from !== to && from >= 0 && to >= 0) {
      var times = this.data.visitTimes.slice();
      var item = times.splice(from, 1)[0];
      times.splice(to, 0, item);
      this.setData({ visitTimes: times });
    }
    this.setData({ draggingIndex: -1, dragOverIndex: -1 });
  },

  onAddTime() {
    var times = this.data.visitTimes.concat([{ date: '', time: '' }]);
    this.setData({ visitTimes: times });
  },

  onRemoveTime(e) {
    var idx = e.currentTarget.dataset.index;
    var times = this.data.visitTimes.slice();
    times.splice(idx, 1);
    this.setData({ visitTimes: times });
  },

  onTimeDateChange(e) {
    var idx = e.currentTarget.dataset.index;
    var times = this.data.visitTimes.slice();
    times[idx] = Object.assign({}, times[idx], { date: e.detail.value });
    this.setData({ visitTimes: times });
  },

  onTimeTimeChange(e) {
    var idx = e.currentTarget.dataset.index;
    var times = this.data.visitTimes.slice();
    times[idx] = Object.assign({}, times[idx], { time: e.detail.value });
    this.setData({ visitTimes: times });
  },

  // ===================== 位置 =====================

  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          location: {
            address: (res.address || res.name || ''),
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
      }
    });
  },

  onInputAddressDetail(e) {
    var loc = Object.assign({}, this.data.location, { addressDetail: e.detail.value });
    this.setData({ location: loc });
  },

  // ===================== 宠物信息 =====================

  onAddPet() {
    var pets = this.data.pets.concat([{ nickname: '', type: '', specialNeeds: '' }]);
    this.setData({ pets: pets });
  },

  onRemovePet(e) {
    var idx = e.currentTarget.dataset.index;
    var pets = this.data.pets.slice();
    pets.splice(idx, 1);
    this.setData({ pets: pets });
  },

  onPetFieldChange(e) {
    var idx = e.currentTarget.dataset.index;
    var field = e.currentTarget.dataset.field;
    var pets = this.data.pets.slice();
    pets[idx] = Object.assign({}, pets[idx]);
    pets[idx][field] = e.detail.value;
    this.setData({ pets: pets });
  },

  // ===================== 保存 =====================

  _validate() {
    if (!this.data.isEdit && !this.data.creatorRole) {
      wx.showToast({ title: '请选择您的角色', icon: 'none' });
      return false;
    }
    if (!this.data.serviceName.trim()) {
      wx.showToast({ title: '请填写服务名称', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSave() {
    if (this.data.submitting) return;
    if (!this._validate()) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    try {
      var d = this.data;
      var payload = {
        ownerNickname: d.ownerNickname,
        helperNickname: d.helperNickname,
        serviceName: d.serviceName,
        visitTimes: d.visitTimes,
        location: d.location,
        pets: d.pets,
        message: d.message
      };
      if (d.myRole === 'owner') payload.ownerNote = d.ownerNote;
      if (d.myRole === 'helper') payload.helperNote = d.helperNote;

      var res;
      if (!d.isEdit) {
        payload.creatorRole = d.creatorRole;
        res = await wx.cloud.callFunction({
          name: 'visitManage',
          data: { action: 'add', data: payload }
        });
        if (res.result && res.result.code === 0) {
          var newId = res.result.data._id;
          this.setData({ isEdit: true, recordId: newId, isCreator: true });
          wx.hideLoading();
          this.setData({ submitting: false });
          wx.showModal({
            title: '创建成功',
            content: '是否立即分享给对方？',
            confirmText: '分享',
            cancelText: '稍后',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.showShareMenu({ withShareTicket: true });
              }
            }
          });
          return;
        }
      } else {
        payload.recordId = d.recordId;
        res = await wx.cloud.callFunction({
          name: 'visitManage',
          data: { action: 'update', data: payload }
        });
      }

      wx.hideLoading();
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' });
      } else {
        wx.showToast({ title: (res.result && res.result.message) || '保存失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
    this.setData({ submitting: false });
  },

  // ===================== 确认 =====================

  async onConfirm() {
    var d = this.data;
    var alreadyConfirmed = d.myRole === 'owner' ? d.ownerConfirmed : d.helperConfirmed;
    if (alreadyConfirmed) {
      wx.showToast({ title: '您已确认过了', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '确认中...' });
    try {
      var res = await wx.cloud.callFunction({
        name: 'visitManage',
        data: { action: 'confirm', data: { recordId: d.recordId } }
      });
      wx.hideLoading();
      if (res.result && res.result.code === 0) {
        var update = {};
        if (d.myRole === 'owner') update.ownerConfirmed = true;
        if (d.myRole === 'helper') update.helperConfirmed = true;
        var newStatus = res.result.data && res.result.data.status;
        if (newStatus && newStatus !== d.status) {
          update.status = newStatus;
          update.statusLabel = _statusLabel(newStatus);
          update.statusColor = _statusColor(newStatus);
        }
        this.setData(update);
        wx.showToast({ title: '已确认', icon: 'success' });
      } else {
        wx.showToast({ title: (res.result && res.result.message) || '操作失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  // ===================== 已上门（临时主，分步） =====================

  onCheckin() {
    var d = this.data;
    var total = d.visitTimes.length || 1;
    var current = d.checkinCount;
    wx.showModal({
      title: '确认上门',
      content: '确认第 ' + (current + 1) + ' 次上门（共 ' + total + ' 次）？',
      success: async (modalRes) => {
        if (!modalRes.confirm) return;
        wx.showLoading({ title: '提交中...' });
        try {
          var res = await wx.cloud.callFunction({
            name: 'visitManage',
            data: { action: 'checkin', data: { recordId: d.recordId } }
          });
          wx.hideLoading();
          if (res.result && res.result.code === 0) {
            // 优先用服务端返回值，容错时本地自增
            var newCount = (res.result.data && res.result.data.checkinCount != null)
              ? res.result.data.checkinCount
              : (d.checkinCount + 1);
            var newStatus = (res.result.data && res.result.data.status) || 'serving';
            var update = { checkinCount: newCount };
            if (newStatus !== d.status) {
              update.status = newStatus;
              update.statusLabel = _statusLabel(newStatus);
              update.statusColor = _statusColor(newStatus);
            }
            this.setData(update);
            wx.showToast({ title: '第 ' + newCount + '/' + total + ' 次上门已记录', icon: 'success' });
          } else {
            wx.showToast({ title: (res.result && res.result.message) || '操作失败', icon: 'none' });
          }
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: '网络异常', icon: 'none' });
        }
      }
    });
  },

  // ===================== 铲屎官逐次确认上门 =====================

  onConfirmVisit() {
    var d = this.data;
    var confirmNo = d.ownerConfirmCount + 1;
    var total = d.visitTimes.length || 1;
    wx.showModal({
      title: '确认上门',
      content: '确认临时主已完成第 ' + confirmNo + ' 次上门（共 ' + total + ' 次）？',
      success: async (modalRes) => {
        if (!modalRes.confirm) return;
        wx.showLoading({ title: '确认中...' });
        try {
          var res = await wx.cloud.callFunction({
            name: 'visitManage',
            data: { action: 'confirmVisit', data: { recordId: d.recordId } }
          });
          wx.hideLoading();
          if (res.result && res.result.code === 0) {
            var newConfirmCount = res.result.data.ownerConfirmCount;
            var newStatus = res.result.data.status;
            var update = { ownerConfirmCount: newConfirmCount };
            if (newStatus !== d.status) {
              update.status = newStatus;
              update.statusLabel = _statusLabel(newStatus);
              update.statusColor = _statusColor(newStatus);
            }
            this.setData(update);
            if (newStatus === 'completed') {
              wx.showToast({ title: '全部上门任务已完成！', icon: 'success' });
            } else {
              wx.showToast({ title: '第 ' + newConfirmCount + '/' + total + ' 次上门已确认', icon: 'success' });
            }
          } else {
            wx.showToast({ title: (res.result && res.result.message) || '操作失败', icon: 'none' });
          }
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: '网络异常', icon: 'none' });
        }
      }
    });
  },

  // ===================== 废弃（创建者） =====================

  onDelete() {
    wx.showModal({
      title: '废弃沟通',
      content: '废弃后不可恢复，确认废弃？',
      confirmColor: '#E54D42',
      success: async (modalRes) => {
        if (!modalRes.confirm) return;
        wx.showLoading({ title: '操作中...' });
        try {
          var res = await wx.cloud.callFunction({
            name: 'visitManage',
            data: { action: 'delete', data: { recordId: this.data.recordId } }
          });
          wx.hideLoading();
          if (res.result && res.result.code === 0) {
            wx.showToast({ title: '已废弃', icon: 'success' });
            setTimeout(() => { wx.navigateBack(); }, 1000);
          } else {
            wx.showToast({ title: (res.result && res.result.message) || '操作失败', icon: 'none' });
          }
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: '网络异常', icon: 'none' });
        }
      }
    });
  },

  // ===================== 分享 =====================

  onShareAppMessage() {
    var d = this.data;
    var isCreatorOwner = d.creatorRole === 'owner';
    return {
      title: isCreatorOwner
        ? (d.ownerNickname || '铲屎官') + ' 邀请您作为临时主上门照看宠物 · ' + (d.serviceName || '上门服务')
        : (d.helperNickname || '临时主') + ' 发起了上门照看宠物沟通 · ' + (d.serviceName || '上门服务'),
      path: '/pages/visit/visit-add/visit-add?editId=' + d.recordId,
      imageUrl: '/images/guide/illust-main.png'
    };
  }
});

function _statusLabel(status) {
  var map = { pending: '待确认', preparing: '准备中', serving: '服务中', completed: '已完成' };
  return map[status] || status;
}

function _statusColor(status) {
  var map = { pending: '#E8875A', preparing: '#5B8DEF', serving: '#9B7FE8', completed: '#5BC47A' };
  return map[status] || '#999';
}
