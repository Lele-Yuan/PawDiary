const { BILL_CATEGORIES } = require('../../../utils/constants');
const { showLoading, hideLoading, showSuccess, showError } = require('../../../utils/util');

Page({
  data: {
    categoryList: BILL_CATEGORIES,
    today: '',
    submitting: false,
    editId: '',
    pageTitle: '记一笔',
    form: {
      amount: '',
      category: '',
      title: '',
      date: '',
      note: ''
    }
  },

  onLoad(options) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.setData({
      today: todayStr,
      'form.date': todayStr
    });

    // 权限校验
    const app = getApp();
    const role = app.globalData.currentPetRole || '';
    if (role === 'member') {
      wx.showToast({ title: '无权限请联系宠物主', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 编辑模式
    if (options.id) {
      this.setData({ editId: options.id, pageTitle: '编辑账单' });
      this.loadBill(options.id);
    }
  },

  // 金额输入
  onAmountInput(e) {
    let value = e.detail.value;
    // 限制两位小数
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
      }
    }
    this.setData({ 'form.amount': value });
  },

  // 选择分类
  onSelectCategory(e) {
    const category = e.currentTarget.dataset.key;
    this.setData({ 'form.category': category });
  },

  // 通用输入
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ 'form.date': e.detail.value });
  },

  // 加载账单数据（编辑模式）
  async loadBill(id) {
    showLoading('加载中...');
    try {
      const res = await wx.cloud.callFunction({
        name: 'billManage',
        data: { action: 'get', data: { _id: id } }
      });

      if (res.result && res.result.code === 0) {
        const bill = res.result.data;
        const dateStr = bill.date ? new Date(bill.date).toISOString().split('T')[0] : '';

        this.setData({
          'form.amount': bill.amount || '',
          'form.category': bill.category || '',
          'form.title': bill.title || '',
          'form.date': dateStr || this.data.today,
          'form.note': bill.note || ''
        });
      } else {
        showError('获取账单数据失败');
      }
    } catch (err) {
      console.error('加载账单失败：', err);
      showError('加载账单数据失败');
    }
    hideLoading();
  },

  // 校验
  validateForm() {
    const { amount, category, title } = this.data.form;
    if (!amount || Number(amount) <= 0) {
      showError('请输入有效金额');
      return false;
    }
    if (!category) {
      showError('请选择消费分类');
      return false;
    }
    if (!title || !title.trim()) {
      showError('请输入消费描述');
      return false;
    }
    return true;
  },

  // 提交
  async onSubmit() {
    if (!this.validateForm()) return;
    if (this.data.submitting) return;

    const app = getApp();
    const petId = app.globalData.currentPetId;
    if (!petId) {
      showError('请先添加宠物');
      return;
    }

    this.setData({ submitting: true });
    showLoading('保存中...');

    try {
      const { form, editId } = this.data;
      const isEdit = !!editId;

      // 通过云函数添加或更新账单
      const action = isEdit ? 'update' : 'add';
      const data = isEdit ? {
        _id: editId,
        amount: Number(form.amount),
        category: form.category,
        title: form.title.trim(),
        date: form.date,
        note: form.note.trim()
      } : {
        petId,
        amount: Number(form.amount),
        category: form.category,
        title: form.title.trim(),
        date: form.date,
        note: form.note.trim()
      };

      await wx.cloud.callFunction({
        name: 'billManage',
        data: { action, data }
      });

      hideLoading();
      showSuccess(isEdit ? '修改成功' : '记录成功');
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      console.error('保存账单失败：', err);
      hideLoading();
      showError('保存失败，请重试');
    }

    this.setData({ submitting: false });
  }
});