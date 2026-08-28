const { formatMoney } = require('../../../utils/util');
const { BILL_CATEGORY_MAP, BILL_CATEGORY_COLORS } = require('../../../utils/constants');

Page({
  // 统计请求序号，声明在 Page 对象上而非 data，既避免自增触发视图层通信，
  // 也不依赖生命周期执行顺序。若为 undefined，++ 会得到 NaN 使守卫恒判过期
  _statsSeq: 0,

  data: {
    period: 'month',
    currentYear: 2026,
    currentMonth: 3,
    totalStr: '0.00',
    categoryStats: [],
    trends: [],
    loaded: false,
    statsLoading: false,
    loadFailed: false,
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

  onUnload() {
    // 推进序号使在途请求全部失效，避免离页后仍对已卸载页面 setData 或弹出 toast
    this._statsSeq++;
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
    this.setData({ selectedPayer: payer });
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

    // 请求序号守卫：每次进入自增，只有最新一次请求的结果允许写入页面。
    // loadStats 内部有多次 await，云函数返回耗时不稳定，先发起的请求
    // 完全可能后返回，若不做守卫就会用旧月份数据覆盖新月份数据
    const seq = ++this._statsSeq;

    if (!petId) {
      this.setData({
        totalStr: '0.00',
        categoryStats: [],
        trends: [],
        loaded: true,
        statsLoading: false,
        loadFailed: false
      });
      return;
    }

    // 先清空上次数据，避免新旧数据混杂展示
    this.setData({
      statsLoading: true,
      loadFailed: false,
      totalStr: '0.00',
      categoryStats: [],
      trends: []
    });

    try {
      const { currentYear, currentMonth, period, selectedPayer } = this.data;
      const payerOpenid = selectedPayer === 'all' ? '' : selectedPayer;

      // 通过云函数查询账单（与 bill.js 保持一致，避免客户端权限限制）
      let bills;
      if (period === 'month') {
        bills = await this._fetchBills({ petId, year: currentYear, month: currentMonth, payerOpenid }, seq);
        if (!bills) return;
      } else {
        // 年度：12 个月并发拉取后合并
        const months = [];
        for (let m = 1; m <= 12; m++) {
          months.push({ petId, year: currentYear, month: m, payerOpenid });
        }
        const results = await this._fetchBillsBatch(months, seq);
        if (!results) return;
        bills = results.reduce((all, monthBills) => all.concat(monthBills), []);
      }

      const total = bills.reduce((sum, b) => sum + b.amount, 0);

      // 分类统计
      const categoryMap = {};
      bills.forEach(b => {
        categoryMap[b.category] = (categoryMap[b.category] || 0) + b.amount;
      });

      const categoryStats = Object.entries(categoryMap)
        .map(([category, amount]) => {
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

      if (this._isStale(seq)) return;
      const totalStr = formatMoney(total);
      this.setData({
        totalStr,
        categoryStats,
        loaded: true
      }, () => {
        // canvas 节点常驻（模板用 hidden 而非 wx:if），此处仅需等本次数据渲染完成
        if (categoryStats.length && !this._isStale(seq)) {
          this.drawPieChart(categoryStats, total, totalStr);
        }
      });

      // 趋势区块仅在年度模式渲染，月度模式无需发起这 6 次请求
      if (period === 'year') {
        await this.loadTrends({ petId, year: currentYear, month: currentMonth, payerOpenid }, seq);
      }
    } catch (err) {
      console.error('加载统计失败：', err);
      if (this._isStale(seq)) return;
      // 必须区分「加载失败」与「确实没有数据」，否则失败会被读成本月没有消费
      this.setData({ loaded: true, loadFailed: true });
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      // 复位统一收口在此，不在成功路径中提前撤下遮罩，
      // 否则会在剩余请求进行中放开交互，重新打开并发窗口。
      // 过期请求不得复位，否则会把最新请求的遮罩提前关掉
      if (!this._isStale(seq)) {
        this.setData({ statsLoading: false });
      }
    }
  },

  // 判断本次请求是否已被后续请求取代
  _isStale(seq) {
    return seq !== this._statsSeq;
  },

  // 查询单月账单。把发请求、判过期、解包绑定在一起，
  // 避免新增调用点时漏掉守卫导致竞态静默回归。
  // 返回 null 表示本次请求已过期，调用方应立即 return
  async _fetchBills({ petId, year, month, payerOpenid }, seq) {
    const queryData = { petId, year, month };
    if (payerOpenid) queryData.payerOpenid = payerOpenid;
    const res = await wx.cloud.callFunction({
      name: 'billManage',
      data: { action: 'list', data: queryData }
    });
    if (this._isStale(seq)) return null;
    // 业务失败必须抛出而非降级为空数组。并发拉取时有多个入口，
    // 静默降级会让用户看到一个偏低却看不出异常的总额
    if (!res.result || res.result.code !== 0) {
      throw new Error((res.result && res.result.message) || '账单查询失败');
    }
    return res.result.data || [];
  },

  // 并发查询多个月份的账单，结果顺序与入参一致。
  // 把「过期即中止」的判断一并收进来，调用方只需判空
  async _fetchBillsBatch(queries, seq) {
    const results = await Promise.all(queries.map(q => this._fetchBills(q, seq)));
    return results.some(r => !r) ? null : results;
  },

  // 加载近6个月趋势。月份与付款人由调用方快照传入，不再现读 this.data，
  // 使本方法不依赖调用时序
  async loadTrends({ petId, year, month, payerOpenid }, seq) {
    try {
      // 基于传入月份往前推 6 个月，并发拉取
      const range = [];
      for (let i = 5; i >= 0; i--) {
        let m = month - i;
        let y = year;
        if (m <= 0) { m += 12; y--; }
        range.push({ year: y, month: m });
      }

      const results = await this._fetchBillsBatch(
        range.map(r => ({ petId, year: r.year, month: r.month, payerOpenid })),
        seq
      );
      if (!results) return;

      let maxTotal = 0;
      const trends = range.map((r, idx) => {
        const mTotal = results[idx].reduce((sum, b) => sum + b.amount, 0);
        if (mTotal > maxTotal) maxTotal = mTotal;
        return {
          year: r.year,
          month: r.month,
          label: `${r.month}月`,
          total: mTotal,
          totalStr: mTotal > 0 ? formatMoney(mTotal) : ''
        };
      });

      // 计算高度百分比
      const trendsWithHeight = trends.map(t => Object.assign({}, t, {
        heightPercent: maxTotal > 0 ? Math.max(Math.round(t.total / maxTotal * 100), 2) : 2
      }));

      if (this._isStale(seq)) return;
      this.setData({ trends: trendsWithHeight });
    } catch (err) {
      console.error('加载趋势失败：', err);
    }
  },

  // 遮罩阻止滚动穿透
  noop() {},

  // 使用 Canvas 绘制简易饼图。total 与 totalStr 由调用方传入，
  // 保证扇形比例与圆心文案来自同一批数据。
  // 无需手动 clearRect：末尾的 ctx.draw() 默认 reserve 为 false，本次绘制前会清空画布
  drawPieChart(stats, total, totalStr) {
    const ctx = wx.createCanvasContext('pieChart', this);
    const centerX = 187;
    const centerY = 90;
    const radius = 75;

    let startAngle = -Math.PI / 2;

    stats.forEach(item => {
      // 用原始金额而非四舍五入后的 percent 计算角度，
      // 否则各扇形角度之和不等于 360 度，会留下白楔或末尾扇形覆盖首个扇形
      const angle = total > 0 ? (item.amount / total) * Math.PI * 2 : 0;
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
    ctx.fillText('¥' + totalStr, centerX, centerY);

    ctx.draw();
  }
});