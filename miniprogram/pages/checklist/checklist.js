const { showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    checklists: [],
    templates: [],
    currentPetName: '',
    navTitleOpacity: 1,
    canEdit: true,
    showModal: false,
    customTitle: '',
    loaded: false,
    // 详情展开
    expandedId: null,
    detailChecklist: null,
    detailProgress: 0,
    detailCheckedCount: 0,
    detailTotalCount: 0,
    detailNewItemName: ''
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    var app = getApp();
    var role = app.globalData.currentPetRole || 'creator';
    this.setData({ canEdit: role === 'creator' || role === 'admin' });
    this.loadData();
  },

  onPageScroll(e) {
    const threshold = 150;
    const opacity = Math.max(0, 1 - e.scrollTop / threshold);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  async loadData() {
    // 切换宠物时清空展开状态
    this.setData({ expandedId: null, detailChecklist: null, detailNewItemName: '' });

    const app = getApp();
    const petId = app.globalData.currentPetId;

    if (app.globalData.currentPet) {
      this.setData({ currentPetName: app.globalData.currentPet.name });
    } else {
      try {
        const db = wx.cloud.database();
        if (petId) {
          const { data: pet } = await db.collection('pets').doc(petId).get();
          this.setData({ currentPetName: pet.name || '' });
        }
      } catch (e) {
        console.error('获取宠物名称失败', e);
      }
    }

    await this.loadChecklists();
    this.setData({ loaded: true });
  },

  async loadChecklists() {
    try {
      const app = getApp();
      const db = wx.cloud.database();
      const petId = app.globalData.currentPetId;

      if (!petId) {
        this.setData({ checklists: [] });
        return;
      }

      const { data } = await db.collection('checklists')
        .where({ petId })
        .orderBy('createdAt', 'desc')
        .get();

      const checklists = data.map(cl => ({
        ...cl,
        progress: cl.items.length > 0
          ? Math.round(cl.items.filter(i => i.checked).length / cl.items.length * 100)
          : 0,
        checkedCount: cl.items.filter(i => i.checked).length,
        totalCount: cl.items.length
      }));

      this.setData({ checklists });
    } catch (err) {
      console.error('加载清单失败：', err);
    }
  },

  // ==================== 展开/折叠详情 ====================

  async toggleDetail(e) {
    const id = e.currentTarget.dataset.id;

    if (this.data.expandedId === id) {
      // 收起
      this.setData({ expandedId: null, detailChecklist: null });
      return;
    }

    // 展开：先标记，再加载
    this.setData({ expandedId: id, detailChecklist: null });
    await this.loadDetail(id);
  },

  async loadDetail(id) {
    try {
      const db = wx.cloud.database();
      const { data: checklist } = await db.collection('checklists').doc(id).get();
      const totalCount = checklist.items.length;
      const checkedCount = checklist.items.filter(i => i.checked).length;
      const progress = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0;

      this.setData({
        detailChecklist: checklist,
        detailProgress: progress,
        detailCheckedCount: checkedCount,
        detailTotalCount: totalCount
      });
    } catch (err) {
      console.error('加载详情失败：', err);
      showError('加载失败');
    }
  },

  // ==================== 详情操作（与 checklist-detail.js 一致） ====================

  updateDetailProgress() {
    const items = this.data.detailChecklist.items;
    const totalCount = items.length;
    const checkedCount = items.filter(i => i.checked).length;
    const progress = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0;
    this.setData({ detailProgress: progress, detailCheckedCount: checkedCount, detailTotalCount: totalCount });
  },

  async saveDetailItems() {
    try {
      const db = wx.cloud.database();
      const items = this.data.detailChecklist.items;
      const totalCount = items.length;
      const checkedCount = items.filter(i => i.checked).length;
      const progress = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0;

      await db.collection('checklists').doc(this.data.expandedId).update({
        data: { items, progress, updatedAt: new Date() }
      });

      // 同步更新卡片列表中的进度数据
      const checklists = this.data.checklists.map(cl => {
        if (cl._id === this.data.expandedId) {
          return { ...cl, items, progress, checkedCount, totalCount };
        }
        return cl;
      });
      this.setData({ checklists });
    } catch (err) {
      console.error('保存清单失败：', err);
    }
  },

  // 修改标题
  async onTitleBlur(e) {
    const title = e.detail.value.trim();
    if (!title || title === this.data.detailChecklist.title) return;

    try {
      const db = wx.cloud.database();
      await db.collection('checklists').doc(this.data.expandedId).update({
        data: { title, updatedAt: new Date() }
      });
      this.setData({ 'detailChecklist.title': title });

      // 同步更新卡片列表标题
      const checklists = this.data.checklists.map(cl =>
        cl._id === this.data.expandedId ? { ...cl, title } : cl
      );
      this.setData({ checklists });
    } catch (err) {
      console.error('更新标题失败：', err);
    }
  },

  // 勾选/取消勾选
  toggleItem(e) {
    const index = e.currentTarget.dataset.index;
    const key = `detailChecklist.items[${index}].checked`;
    const currentVal = this.data.detailChecklist.items[index].checked;

    this.setData({ [key]: !currentVal });
    this.updateDetailProgress();
    this.saveDetailItems();
  },

  // 新项目名称输入
  onNewItemInput(e) {
    this.setData({ detailNewItemName: e.detail.value });
  },

  // 聚焦添加输入框
  focusAddInput() {
    // input 已通过 bindconfirm 处理，此处仅作容器点击响应
  },

  // 添加新项目
  addItem() {
    const name = this.data.detailNewItemName.trim();
    if (!name) return;

    const items = this.data.detailChecklist.items;
    items.push({ name, checked: false, note: '' });

    this.setData({
      'detailChecklist.items': items,
      detailNewItemName: ''
    });
    this.updateDetailProgress();
    this.saveDetailItems();
  },

  // 删除项目
  deleteItem(e) {
    const index = e.currentTarget.dataset.index;
    const itemName = this.data.detailChecklist.items[index].name;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${itemName}"吗？`,
      success: (res) => {
        if (res.confirm) {
          const items = this.data.detailChecklist.items;
          items.splice(index, 1);
          this.setData({ 'detailChecklist.items': items });
          this.updateDetailProgress();
          this.saveDetailItems();
        }
      }
    });
  },

  // 删除整个清单
  deleteChecklist() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个清单吗？',
      confirmColor: '#F44336',
      success: async (res) => {
        if (res.confirm) {
          showLoading('删除中...');
          try {
            const db = wx.cloud.database();
            await db.collection('checklists').doc(this.data.expandedId).remove();
            hideLoading();
            showSuccess('已删除');
            this.setData({ expandedId: null, detailChecklist: null });
            await this.loadChecklists();
          } catch (err) {
            hideLoading();
            showError('删除失败');
            console.error(err);
          }
        }
      }
    });
  },

  // ==================== 创建清单 ====================

  async showCreateOptions() {
    var app = getApp();
    if (!app.globalData.currentPetId) {
      wx.showToast({ title: '请先添加宠物', icon: 'none' });
      return;
    }
    if (!this.data.templates.length) {
      try {
        await wx.cloud.callFunction({
          name: 'checklistManage',
          data: { action: 'initTemplates' }
        });
        const res = await wx.cloud.callFunction({
          name: 'checklistManage',
          data: { action: 'getTemplates' }
        });
        if (res.result && res.result.data) {
          this.setData({ templates: res.result.data });
        }
      } catch (err) {
        console.error('加载模板失败：', err);
      }
    }
    this.setData({ showModal: true, customTitle: '' });
  },

  hideModal() {
    this.setData({ showModal: false });
  },

  async createFromTemplate(e) {
    const templateId = e.currentTarget.dataset.id;
    const app = getApp();
    const petId = app.globalData.currentPetId;

    if (!petId) { showError('请先添加宠物'); return; }

    showLoading('创建中...');
    try {
      await wx.cloud.callFunction({
        name: 'checklistManage',
        data: { action: 'createFromTemplate', data: { templateId, petId } }
      });
      hideLoading();
      showSuccess('创建成功');
      this.setData({ showModal: false });
      await this.loadChecklists();
    } catch (err) {
      hideLoading();
      showError('创建失败');
      console.error(err);
    }
  },

  onCustomTitleInput(e) {
    this.setData({ customTitle: e.detail.value });
  },

  async createCustom() {
    const title = this.data.customTitle.trim();
    if (!title) { showError('请输入清单名称'); return; }

    const app = getApp();
    const petId = app.globalData.currentPetId;
    if (!petId) { showError('请先添加宠物'); return; }

    showLoading('创建中...');
    try {
      await wx.cloud.callFunction({
        name: 'checklistManage',
        data: { action: 'create', data: { title, petId, icon: '📋', items: [] } }
      });
      hideLoading();
      showSuccess('创建成功');
      this.setData({ showModal: false, customTitle: '' });
      await this.loadChecklists();
    } catch (err) {
      hideLoading();
      showError('创建失败');
      console.error(err);
    }
  }
});
