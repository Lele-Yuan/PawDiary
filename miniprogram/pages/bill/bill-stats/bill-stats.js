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
    loaded: false
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    this.loadStats();
  },

  // 切换月度/年度
  switchPeriod(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ period });
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
      const db = wx.cloud.database();
      const _ = db.command;
      const { currentYear, currentMonth, period } = this.data;

      let startDate, endDate;
      if (period === 'month') {
        startDate = new Date(currentYear, currentMonth - 1, 1);
        endDate = new Date(currentYear, currentMonth, 1);
      } else {
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear + 1, 0, 1);
      }

      // 查询时段内所有账单
      const { data: bills } = await db.collection('bills')
        .where({
          petId,
          date: _.gte(startDate).and(_.lt(endDate))
        })
        .limit(1000)
        .get();

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
      const db = wx.cloud.database();
      const _ = db.command;
      const now = new Date();
      const trends = [];
      let maxTotal = 0;

      for (let i = 5; i >= 0; i--) {
        let m = now.getMonth() + 1 - i;
        let y = now.getFullYear();
        if (m <= 0) { m += 12; y--; }

        const mStart = new Date(y, m - 1, 1);
        const mEnd = new Date(y, m, 1);

        const { data: mBills } = await db.collection('bills')
          .where({
            petId,
            date: _.gte(mStart).and(_.lt(mEnd))
          })
          .get();

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