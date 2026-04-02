const { BILL_CATEGORIES } = require('../../../utils/constants');
const { showLoading, hideLoading, showSuccess, showError } = require('../../../utils/util');

Page({
  data: {
    categoryList: BILL_CATEGORIES,
    today: '',
    submitting: false,
    form: {
      amount: '',
      category: '',
      title: '',
      date: '',
      note: ''
    }
  },

  onLoad() {
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
      const { form } = this.data;

      // 通过云函数添加账单
      await wx.cloud.callFunction({
        name: 'billManage',
        data: {
          action: 'add',
          data: {
            petId,
            amount: Number(form.amount),
            category: form.category,
            title: form.title.trim(),
            date: form.date,
            note: form.note.trim()
          }
        }
      });

      hideLoading();
      showSuccess('记录成功');
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      console.error('保存账单失败：', err);
      hideLoading();
      showError('保存失败，请重试');
    }

    this.setData({ submitting: false });
  }
});