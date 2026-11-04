// pages/dishEdit/dishEdit.js —— 新增/编辑菜品
const app = getApp();
const api = require('../utils/api.js');

Page({
  onPageScroll(e) {
    const opacity = Math.max(0, 1 - e.scrollTop / 150);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  data: {
    navTitleOpacity: 1,
    navTitle: '添加菜品',
    dishId: '',
    name: '',
    imageUrl: '',
    duration: '',
    remark: '',
    ingLib: [],        // 系统食材库
    ingGroups: [],     // 按类型分组后的食材
    tasteLib: [],      // 系统口味库
    pickedIng: {},     // {name: {name, emoji}}
    pickedTaste: {},   // {name: {name, emoji}}
    uploading: false
  },

  onLoad(options) {
    Promise.all([api.base.ingredients(), api.base.tastes()]).then(([ing, taste]) => {
      this.setData({ ingLib: ing || [], ingGroups: this.groupByCategory(ing || []), tasteLib: taste || [] });
      if (options.id) this.loadDish(options.id);
    });
  },

  // 按 category 分组，顺序沿用云端返回（已按 sort 升序）
  groupByCategory(list) {
    const order = [], map = {};
    (list || []).forEach(it => {
      const cat = it.category || '其他';
      if (!map[cat]) { map[cat] = []; order.push(cat); }
      map[cat].push(it);
    });
    return order.map(cat => ({ category: cat, items: map[cat] }));
  },

  // 编辑时回填
  loadDish(id) {
    this.setData({ dishId: id, navTitle: '编辑菜品' });
    api.dish.myList().then(list => {
      const d = (list || []).find(x => x._id === id);
      if (!d) return;
      const pickedIng = {}, pickedTaste = {};
      (d.ingredients || []).forEach(g => { pickedIng[g.name] = g; });
      (d.tastes || []).forEach(t => { pickedTaste[t.name] = t; });
      this.setData({
        name: d.name, imageUrl: d.imageUrl || '',
        duration: d.duration || '', remark: d.remark || '',
        pickedIng, pickedTaste
      });
    });
  },

  onName(e) { this.setData({ name: e.detail.value }); },
  onDuration(e) { this.setData({ duration: e.detail.value }); },
  onRemark(e) { this.setData({ remark: e.detail.value }); },

  // 选择食材（多选 toggle）
  toggleIng(e) {
    const g = e.currentTarget.dataset.item;
    const picked = { ...this.data.pickedIng };
    if (picked[g.name]) delete picked[g.name];
    else picked[g.name] = { name: g.name, emoji: g.emoji };
    this.setData({ pickedIng: picked });
  },
  // 选择口味（多选 toggle）
  toggleTaste(e) {
    const t = e.currentTarget.dataset.item;
    const picked = { ...this.data.pickedTaste };
    if (picked[t.name]) delete picked[t.name];
    else picked[t.name] = { name: t.name, emoji: t.emoji };
    this.setData({ pickedTaste: picked });
  },

  // 上传菜品图片到云存储
  chooseImage() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'],
      success: (res) => {
        const file = res.tempFiles[0].tempFilePath;
        this.setData({ uploading: true });
        wx.showLoading({ title: '上传中' });
        const cloudPath = `dishes/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${file.match(/\.(\w+)$/) ? file.match(/\.(\w+)$/)[1] : 'jpg'}`;
        wx.cloud.uploadFile({ cloudPath, filePath: file }).then(up => {
          wx.hideLoading();
          this.setData({ imageUrl: up.fileID, uploading: false });
        }).catch(() => {
          wx.hideLoading();
          this.setData({ uploading: false });
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },
  removeImage() { this.setData({ imageUrl: '' }); },

  save() {
    const name = (this.data.name || '').trim();
    if (!name) return wx.showToast({ title: '请填写菜品名称', icon: 'none' });
    const ingredients = Object.values(this.data.pickedIng);
    if (!ingredients.length) return wx.showToast({ title: '请至少选择一种食材', icon: 'none' });
    const dish = {
      name,
      imageUrl: this.data.imageUrl,
      duration: Number(this.data.duration) || 0,
      remark: this.data.remark,
      ingredients,
      tastes: Object.values(this.data.pickedTaste)
    };
    if (this.data.dishId) dish._id = this.data.dishId;
    api.dish.save(dish).then(() => {
      wx.showToast({ title: '已保存' });
      setTimeout(() => wx.navigateBack(), 500);
    });
  }
});
