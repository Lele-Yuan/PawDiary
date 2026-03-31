const { formatDate, formatMoney } = require('../../utils/util');
const { BILL_CATEGORY_MAP, BILL_CATEGORY_COLORS } = require('../../utils/constants');

Page({
  data: {
    currentPetName: '',
    navTitleOpacity: 1,
    canEdit: true,
    currentYear: 2026,
    currentMonth: 3,
    monthTotal: 0,
    monthTotalStr: '0.00',
    monthTotalMain: '0',
    monthTotalCents: '.00',
    lastMonthTotal: 0,
    monthCompare: 0,
    monthComparePercent: 0,
    categoryStats: [],
    groupedBills: [],
    loaded: false
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    var app = getApp();
    var role = app.globalData.currentPetRole || 'creator';
    this.setData({ canEdit: role === 'creator' || role === 'admin' });
    this.loadMonthData();
  },

  onPageScroll(e) {
    const threshold = 150;
    const opacity = Math.max(0, 1 - e.scrollTop / threshold);
    if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
      this.setData({ navTitleOpacity: Math.round(opacity * 100) / 100 });
    }
  },

  // 上一月
  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    this.setData({ currentYear, currentMonth });
    this.loadMonthData();
  },

  // 下一月
  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    const now = new Date();
    // 不能超过当前月份
    if (currentYear === now.getFullYear() && currentMonth >= now.getMonth() + 1) {
      return;
    }
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    this.setData({ currentYear, currentMonth });
    this.loadMonthData();
  },

  // 加载月度数据
  async loadMonthData() {
    const app = getApp();
    const petId = app.globalData.currentPetId;

    // 获取当前宠物名称
    if (app.globalData.currentPet) {
      this.setData({ currentPetName: app.globalData.currentPet.name });
    } else if (petId) {
      try {
        const { data: pet } = await wx.cloud.database().collection('pets').doc(petId).get();
        this.setData({ currentPetName: pet.name || '' });
      } catch (e) {
        console.error('获取宠物名称失败', e);
      }
    }

    if (!petId) {
      this.setData({ groupedBills: [], categoryStats: [], monthTotal: 0, monthTotalStr: '0.00', loaded: true });
      return;
    }

    try {
      const { currentYear, currentMonth } = this.data;
      const db = wx.cloud.database();
      const _ = db.command;

      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 1);

      // 查询当月账单
      const { data: bills } = await db.collection('bills')
        .where({
          petId,
          date: _.gte(startDate).and(_.lt(endDate))
        })
        .orderBy('date', 'desc')
        .get();

      const monthTotal = bills.reduce((sum, b) => sum + b.amount, 0);

      // 查询上月账单
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
      const prevEndDate = new Date(prevYear, prevMonth, 1);

      const { data: prevBills } = await db.collection('bills')
        .where({
          petId,
          date: _.gte(prevStartDate).and(_.lt(prevEndDate))
        })
        .get();

      const lastMonthTotal = prevBills.reduce((sum, b) => sum + b.amount, 0);

      // 对比计算
      let monthCompare = 0;
      let monthComparePercent = 0;
      if (lastMonthTotal > 0) {
        monthCompare = monthTotal - lastMonthTotal;
        monthComparePercent = Math.abs(Math.round(monthCompare / lastMonthTotal * 100));
      }

      // 分类统计
      const categoryMap = {};
      bills.forEach(b => {
        categoryMap[b.category] = (categoryMap[b.category] || 0) + b.amount;
      });

      const categoryStats = Object.entries(categoryMap)
        .map(function (entry) {
          var category = entry[0];
          var amount = entry[1];
          const info = BILL_CATEGORY_MAP[category] || {};
          return {
            category,
            label: info.label || category,
            icon: info.icon || '📦',
            color: BILL_CATEGORY_COLORS[category] || '#607D8B',
            amount,
            amountStr: formatMoney(amount),
            percent: monthTotal > 0 ? Math.round(amount / monthTotal * 100) : 0
          };
        })
        .sort((a, b) => b.amount - a.amount);

      // 按日期分组
      const grouped = this.groupBillsByDate(bills);

      const monthTotalFormatted = formatMoney(monthTotal);
      const dotIndex = monthTotalFormatted.indexOf('.');
      const monthTotalMain = dotIndex >= 0 ? monthTotalFormatted.slice(0, dotIndex) : monthTotalFormatted;
      const monthTotalCents = dotIndex >= 0 ? monthTotalFormatted.slice(dotIndex) : '.00';

      this.setData({
        monthTotal,
        monthTotalStr: monthTotalFormatted,
        monthTotalMain,
        monthTotalCents,
        lastMonthTotal,
        monthCompare,
        monthComparePercent,
        categoryStats,
        groupedBills: grouped,
        loaded: true
      });
    } catch (err) {
      console.error('加载账单失败：', err);
      this.setData({ loaded: true });
    }
  },

  // 按日期分组
  groupBillsByDate(bills) {
    const groups = {};
    bills.forEach(b => {
      const dateStr = formatDate(b.date, 'MM-DD');
      if (!groups[dateStr]) {
        groups[dateStr] = { date: dateStr, bills: [], total: 0 };
      }
      const info = BILL_CATEGORY_MAP[b.category] || {};
      groups[dateStr].bills.push({
        ...b,
        categoryIcon: info.icon || '📦',
        categoryLabel: info.label || b.category,
        categoryColor: BILL_CATEGORY_COLORS[b.category] || '#607D8B',
        dateStr,
        amountStr: formatMoney(b.amount)
      });
      groups[dateStr].total += b.amount;
    });

    return Object.values(groups).map(g => ({
      ...g,
      totalStr: formatMoney(g.total)
    }));
  },

  // 跳转统计页
  goStats() {
    wx.navigateTo({
      url: '/pages/bill/bill-stats/bill-stats'
    });
  },

  // 跳转添加
  goAdd() {
    var app = getApp();
    if (!app.globalData.currentPetId) {
      wx.showToast({ title: '请先添加宠物', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/bill/bill-add/bill-add'
    });
  },

  // 长按删除
  onLongPressBill(e) {
    const id = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['删除此账单'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: '确认删除',
            content: '删除后无法恢复，确定要删除吗？',
            confirmColor: '#F44336',
            success: async (modalRes) => {
              if (modalRes.confirm) {
                try {
                  const db = wx.cloud.database();
                  await db.collection('bills').doc(id).remove();
                  wx.showToast({ title: '已删除', icon: 'success' });
                  this.loadMonthData();
                } catch (err) {
                  console.error('删除失败：', err);
                  wx.showToast({ title: '删除失败', icon: 'none' });
                }
              }
            }
          });
        }
      }
    });
  }
});