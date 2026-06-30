Page({
  data: {
    petId: '',
    tab: 'admin',
    members: [],
    filteredMembers: [],
    adminCount: 0,
    memberCount: 0,
    isCreator: false,
    loading: true
  },

  onLoad(options) {
    this.setData({ petId: options.petId || '' });
  },

  onShow() {
    if (this.data.petId) {
      this.loadMembers();
    }
  },

  async loadMembers() {
    const app = getApp();
    if (!this.data.petId) return;
    try {
      const res = await wx.cloud.callFunction({
        name: 'familyManage',
        data: { action: 'list', data: { petId: this.data.petId } }
      });
      const members = (res.result && res.result.data) || [];
      const me = members.find(m => m._openid === app.globalData.openid);
      const isCreator = !!me && me.role === 'creator';
      const adminCount = members.filter(m => m.role === 'admin' || m.role === 'creator').length;
      const memberCount = members.filter(m => m.role === 'member').length;
      this.setData({ members, isCreator, adminCount, memberCount, loading: false }, () => this.applyFilter());
    } catch (err) {
      console.error('加载家庭成员失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  applyFilter() {
    const tab = this.data.tab;
    const list = this.data.members.filter(m => tab === 'admin'
      ? (m.role === 'admin' || m.role === 'creator')
      : m.role === 'member');
    // 创建者排在最前
    list.sort((a, b) => {
      if (a.role === 'creator') return -1;
      if (b.role === 'creator') return 1;
      return 0;
    });
    this.setData({ filteredMembers: list });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.setData({ tab }, () => this.applyFilter());
  },

  async onChangeRole(e) {
    const { openid, role } = e.currentTarget.dataset;
    const tipContent = role === 'admin' ? '将该成员设为共养人？共养人可与你一同管理宠物数据。' : '将该成员改为亲友团？亲友团仅可查看宠物数据。';
    const confirm = await wx.showModal({ title: '确认操作', content: tipContent });
    if (!confirm.confirm) return;
    try {
      const res = await wx.cloud.callFunction({
        name: 'familyManage',
        data: { action: 'updateRole', data: { petId: this.data.petId, targetOpenid: openid, role } }
      });
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '已更新', icon: 'success' });
        this.loadMembers();
      } else {
        wx.showToast({ title: (res.result && res.result.message) || '操作失败', icon: 'none' });
      }
    } catch (err) {
      console.error('更新角色失败', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  }
});
