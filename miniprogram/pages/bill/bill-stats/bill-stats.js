const { formatMoney } = require('../../../utils/util');
const { BILL_CATEGORY_MAP, BILL_CATEGORY_COLORS } = require('../../../utils/constants');

Page({
  data: {
    period: 'month',
    currentYear: 2026,
    currentMonth: 3,
    total: 0,
    totalStr: '0.00',
    categoryStats: [],
    trends: [],
    loaded: false,
    maxYear: 2026,
    maxMonth: 3,
    members: [],
    selectedPayer: 'all'
  },

  onLoad(options) {
    const now = new Date();
    const maxYear = now.getFullYear();
    const maxMonth = now.getMonth() + 1;

    // 从参数获取初始月份，否则使用当前月份
    const initialYear = options.year ? parseInt(options.year) : maxYear;
    const initialMonth = options.month ? parseInt(options.month) : maxMonth;

    this.setData({
      currentYear: initialYear,
      currentMonth: initialMonth,
      maxYear,
      maxMonth
    });
    this.loadMembers();
    this.loadStats();
  },

  // 加载共养人列表
  async loadMembers() {
    const app = getApp();
    const petId = app.globalData.currentPetId;
    if (!petId) return;
    try {
      const res = await wx.cloud.callFunction({
        name: 'familyManage',
        data: { action: 'list', data: { petId } }
      });
      if (res.result && res.result.code === 0) {
        const members = (res.result.data || [])
          .filter(m => m.role === 'creator' || m.role === 'admin')
          .map(m => ({
            openid: m._openid,
            nickName: m.nickName || '未知'
          }));
        this.setData({ members });
      }
    } catch (e) {
      console.error('加载付款人筛选列表失败:', e);
    }
  },

  // 选择付款人筛选
  onSelectPayer(e) {
    const payer = e.currentTarget.dataset.payer;
    this.setData({ selectedPayer: payer, loaded: false });
    this.loadStats();
  },

  // 切换月度/年度
  switchPeriod(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ period });
    this.loadStats();
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
    this.loadStats();
  },

  // 下一月
  nextMonth() {
    let { currentYear, currentMonth, maxYear, maxMonth } = this.data;
    // 不能超过当前月份
    if (currentYear === maxYear && currentMonth >= maxMonth) {
      return;
    }
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    this.setData({ currentYear, currentMonth });
    this.loadStats();
  },

  // 加载统计数据
  async loadStats() {
    const app = getApp();
    const petId = app.globalData.currentPetId;

    if (!petId) {
      this.setData({ categoryStats: [], trends: [], total: 0, totalStr: '0.00', loaded: true });
      return;
    }

    try {
      const { currentYear, currentMonth, period, selectedPayer } = this.data;
      const payerOpenid = selectedPayer === 'all' ? '' : selectedPayer;

      // 通过云函数查询账单（与 bill.js 保持一致，避免客户端权限限制）
      let bills = [];
      if (period === 'month') {
        const queryData = { petId, year: currentYear, month: currentMonth };
        if (payerOpenid) queryData.payerOpenid = payerOpenid;
        const res = await wx.cloud.callFunction({
          name: 'billManage',
          data: { action: 'list', data: queryData }
        });
        bills = res.result && res.result.code === 0 ? res.result.data : [];
      } else {
        // 年度：逐月拉取并合并
        const allBills = [];
        for (let m = 1; m <= 12; m++) {
          const queryData = { petId, year: currentYear, month: m };
          if (payerOpenid) queryData.payerOpenid = payerOpenid;
          const res = await wx.cloud.callFunction({
            name: 'billManage',
            data: { action: 'list', data: queryData }
          });
          const monthBills = res.result && res.result.code === 0 ? res.result.data : [];
          allBills.push(...monthBills);
        }
        bills = allBills;
      }

      const total = bills.reduce((sum, b) => sum + b.amount, 0);

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
            percent: total > 0 ? Math.round(amount / total * 100) : 0
          };
        })
        .sort((a, b) => b.amount - a.amount);

      this.setData({
        total,
        totalStr: formatMoney(total),
        categoryStats,
        loaded: true
      });

      // 绘制饼图
      if (categoryStats.length) {
        this.drawPieChart(categoryStats);
      }

      // 加载趋势
      await this.loadTrends(petId);
    } catch (err) {
      console.error('加载统计失败：', err);
      this.setData({ loaded: true });
    }
  },

  // 加载近6个月趋势
  async loadTrends(petId) {
    try {
      const { currentYear, currentMonth, selectedPayer } = this.data;
      const payerOpenid = selectedPayer === 'all' ? '' : selectedPayer;
      const trends = [];
      let maxTotal = 0;

      // 基于当前选择的月份往前推6个月
      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m <= 0) { m += 12; y--; }

        const queryData = { petId, year: y, month: m };
        if (payerOpenid) queryData.payerOpenid = payerOpenid;
        const res = await wx.cloud.callFunction({
          name: 'billManage',
          data: { action: 'list', data: queryData }
        });
        const mBills = res.result && res.result.code === 0 ? res.result.data : [];

        const mTotal = mBills.reduce((sum, b) => sum + b.amount, 0);
        if (mTotal > maxTotal) maxTotal = mTotal;

        trends.push({
          year: y,
          month: m,
          label: `${m}月`,
          total: mTotal,
          totalStr: mTotal > 0 ? formatMoney(mTotal) : ''
        });
      }

      // 计算高度百分比
      var trendsWithHeight = trends.map(function (t) {
        var item = { year: t.year, month: t.month, label: t.label, total: t.total, totalStr: t.totalStr };
        item.heightPercent = maxTotal > 0 ? Math.max(Math.round(t.total / maxTotal * 100), 2) : 2;
        return item;
      });

      this.setData({ trends: trendsWithHeight });
    } catch (err) {
      console.error('加载趋势失败：', err);
    }
  },

  // 使用 Canvas 绘制简易饼图
  drawPieChart(stats) {
    const ctx = wx.createCanvasContext('pieChart', this);
    const centerX = 187;
    const centerY = 90;
    const radius = 75;

    let startAngle = -Math.PI / 2;

    stats.forEach(item => {
      const angle = (item.percent / 100) * Math.PI * 2;
      const endAngle = startAngle + angle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.setFillStyle(item.color);
      ctx.fill();

      startAngle = endAngle;
    });

    // 中心白色圆（环形效果）
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
    ctx.setFillStyle('#FFFFFF');
    ctx.fill();

    // 中心文字
    ctx.setFillStyle('#333333');
    ctx.setFontSize(14);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.fillText('¥' + this.data.totalStr, centerX, centerY);

    ctx.draw();
  }
});