const EMOJIS = ['🧾', '🧳', '🍜', '🎉', '🏕️', '🎢', '🏨', '🍻', '🎂', '⛰️', '🏖️', '🚗'];

Page({
  data: {
    mode: 'add',
    _id: '',
    name: '',
    coverEmoji: '🧾',
    emojis: EMOJIS,
    saving: false
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({
        mode: 'edit',
        _id: options.id,
        name: options.name ? decodeURIComponent(options.name) : '',
        coverEmoji: options.emoji ? decodeURIComponent(options.emoji) : '🧾'
      });
      wx.setNavigationBarTitle({ title: '编辑活动' });
    } else {
      wx.setNavigationBarTitle({ title: '发起活动' });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onPickEmoji(e) {
    this.setData({ coverEmoji: e.currentTarget.dataset.emoji });
  },

  onSave() {
    const name = (this.data.name || '').trim();
    if (!name) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' });
      return;
    }
    if (this.data.saving) return;
    this.setData({ saving: true });
    wx.showLoading({ title: '保存中...', mask: true });

    const isEdit = this.data.mode === 'edit';
    const action = isEdit ? 'updateActivity' : 'createActivity';
    const data = isEdit
      ? { _id: this.data._id, name, coverEmoji: this.data.coverEmoji }
      : { name, coverEmoji: this.data.coverEmoji };

    wx.cloud.callFunction({ name: 'splitManage', data: { action, data } })
      .then(res => {
        wx.hideLoading();
        this.setData({ saving: false });
        const r = res.result || {};
        if (r.code === 0) {
          wx.showToast({ title: isEdit ? '已更新' : '创建成功', icon: 'success' });
          if (isEdit) {
            setTimeout(() => wx.navigateBack(), 600);
          } else {
            const id = r.data._id;
            setTimeout(() => {
              wx.redirectTo({ url: `/pages/splitpal/activity-detail/activity-detail?id=${id}` });
            }, 600);
          }
        } else if (r.code === -1001) {
          wx.showToast({ title: '内容包含违规信息', icon: 'none' });
        } else {
          wx.showToast({ title: r.message || '保存失败', icon: 'none' });
        }
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({ saving: false });
        wx.showToast({ title: '网络异常', icon: 'none' });
      });
  }
});
