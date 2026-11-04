// pages/order/order.js —— 点菜页（参考奶茶点单：左大厨分类 / 右菜品 / 底部结算）
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
    familyId: '',
    meal: null,          // {_id,status,isAdmin,seq} 或 null
    groups: [],          // [{ownerId, ownerName, dishes:[...]}]
    counts: {},          // {dishId: 次数}
    myPicks: {},         // {dishId: true}
    collapsed: {},       // {ownerId: true 收起}
    keyword: '',
    pickCount: 0,        // 我点的菜数
    starting: false
  },

  onLoad(options) {
    this.setData({ familyId: options.familyId });
  },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },

  load() {
    return Promise.all([
      api.meal.current(this.data.familyId),
      api.dish.poolList(this.data.familyId)
    ]).then(([cur, pool]) => {
      // 分组：按大厨
      const map = {};
      (pool.dishes || []).forEach(d => {
        if (!map[d.ownerId]) map[d.ownerId] = { ownerId: d.ownerId, ownerName: pool.ownerMap[d.ownerId] || '匿名', dishes: [] };
        map[d.ownerId].dishes.push(d);
      });
      const groups = Object.values(map);
      const myPicks = {};
      (cur.myPicks || []).forEach(id => { myPicks[id] = true; });
      this.setData({
        meal: cur.meal, counts: cur.counts || {}, myPicks,
        groups, pickCount: (cur.myPicks || []).length
      });
    });
  },

  // 开桌
  startMeal() {
    if (this.data.starting) return;
    this.setData({ starting: true });
    api.meal.start(this.data.familyId).then(() => {
      this.setData({ starting: false });
      wx.showToast({ title: '约饭开始啦' });
      this.load();
    }).catch(() => this.setData({ starting: false }));
  },

  toggleGroup(e) {
    const id = e.currentTarget.dataset.id;
    const collapsed = { ...this.data.collapsed };
    collapsed[id] = !collapsed[id];
    this.setData({ collapsed });
  },
  onSearch(e) { this.setData({ keyword: e.detail.value }); },

  // 点 / 取消
  togglePick(e) {
    if (!this.data.meal || this.data.meal.status !== 0) {
      return wx.showToast({ title: '当前不可点菜', icon: 'none' });
    }
    const dishId = e.currentTarget.dataset.id;
    const mealId = this.data.meal._id;
    const picked = this.data.myPicks[dishId];
    const op = picked ? api.meal.unpick(mealId, dishId) : api.meal.pick(mealId, dishId);
    op.then(() => this.load());
  },

  // 下单（管理员）
  submit() {
    wx.showModal({
      title: '确认下单',
      content: '下单后本次约饭将锁定，不能再增减菜品',
      success: (r) => {
        if (!r.confirm) return;
        api.meal.submit(this.data.meal._id).then(() => {
          wx.navigateTo({ url: `/pages/mealtime/receipt/receipt?mealId=${this.data.meal._id}` });
          this.load();
        });
      }
    });
  },

  // 查看小票
  viewReceipt() {
    wx.navigateTo({ url: `/pages/mealtime/receipt/receipt?mealId=${this.data.meal._id}` });
  }
});
