const { showLoading, hideLoading, showSuccess, showError } = require('../../../utils/util');

Page({
  data: {
    checklistId: '',
    checklist: { title: '', icon: '', items: [] },
    newItemName: '',
    progress: 0,
    checkedCount: 0,
    totalCount: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ checklistId: options.id });
      this.loadChecklist(options.id);
    }
  },

  // 加载清单详情
  async loadChecklist(id) {
    try {
      const db = wx.cloud.database();
      const { data: checklist } = await db.collection('checklists').doc(id || this.data.checklistId).get();

      const totalCount = checklist.items.length;
      const checkedCount = checklist.items.filter(i => i.checked).length;
      const progress = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0;

      this.setData({
        checklist,
        progress,
        checkedCount,
        totalCount
      });
    } catch (err) {
      console.error('加载清单详情失败：', err);
      showError('加载失败');
    }
  },

  // 更新进度计算
  updateProgress() {
    const items = this.data.checklist.items;
    const totalCount = items.length;
    const checkedCount = items.filter(i => i.checked).length;
    const progress = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0;
    this.setData({ progress, checkedCount, totalCount });
  },

  // 保存清单项到数据库
  async saveItems() {
    try {
      const db = wx.cloud.database();
      const items = this.data.checklist.items;
      const totalCount = items.length;
      const checkedCount = items.filter(i => i.checked).length;
      const progress = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0;

      await db.collection('checklists').doc(this.data.checklistId).update({
        data: {
          items,
          progress,
          updatedAt: new Date()
        }
      });
    } catch (err) {
      console.error('保存清单失败：', err);
    }
  },

  // 修改标题
  async onTitleBlur(e) {
    const title = e.detail.value.trim();
    if (!title || title === this.data.checklist.title) return;

    try {
      const db = wx.cloud.database();
      await db.collection('checklists').doc(this.data.checklistId).update({
        data: { title, updatedAt: new Date() }
      });
      this.setData({ 'checklist.title': title });
    } catch (err) {
      console.error('更新标题失败：', err);
    }
  },

  // 勾选/取消勾选
  toggleItem(e) {
    const index = e.currentTarget.dataset.index;
    const key = `checklist.items[${index}].checked`;
    const currentVal = this.data.checklist.items[index].checked;

    this.setData({ [key]: !currentVal });
    this.updateProgress();
    this.saveItems();
  },

  // 备注修改
  onNoteBlur(e) {
    const index = e.currentTarget.dataset.index;
    const note = e.detail.value;
    const key = `checklist.items[${index}].note`;

    this.setData({ [key]: note });
    this.saveItems();
  },

  // 新项目名称输入
  onNewItemInput(e) {
    this.setData({ newItemName: e.detail.value });
  },

  // 添加新项目
  addItem() {
    const name = this.data.newItemName.trim();
    if (!name) {
      showError('请输入项目名称');
      return;
    }

    const items = this.data.checklist.items;
    items.push({ name, checked: false, note: '' });

    this.setData({
      'checklist.items': items,
      newItemName: ''
    });
    this.updateProgress();
    this.saveItems();
  },

  // 删除项目
  deleteItem(e) {
    const index = e.currentTarget.dataset.index;
    const itemName = this.data.checklist.items[index].name;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${itemName}"吗？`,
      success: (res) => {
        if (res.confirm) {
          const items = this.data.checklist.items;
          items.splice(index, 1);
          this.setData({ 'checklist.items': items });
          this.updateProgress();
          this.saveItems();
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
            await db.collection('checklists').doc(this.data.checklistId).remove();
            hideLoading();
            showSuccess('已删除');
            setTimeout(() => wx.navigateBack(), 1500);
          } catch (err) {
            hideLoading();
            showError('删除失败');
            console.error(err);
          }
        }
      }
    });
  }
});