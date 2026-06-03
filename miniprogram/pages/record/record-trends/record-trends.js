const { formatDate, calcAge } = require('../../../utils/util');

// 健康异常事件类型
const ABNORMAL_TYPES = [
  { key: 'poop', emoji: '💩', label: '尿便异常', color: '#8D6E63', light: '#EFE4DD' },
  { key: 'illness', emoji: '🏥', label: '给药', color: '#E53935', light: '#FBD9D8' },
  { key: 'checkup', emoji: '🩺', label: '就医', color: '#3C6663', light: '#D4E4E2' }
];

// 美容护理类型
const GROOMING_DEFS = [
  { key: 'bath', emoji: '🛁', label: '洗澡', color: '#9C27B0', light: '#EFD9F2' },
  { key: 'nail', emoji: '💅', label: '剪指甲', color: '#795548', light: '#E5DCD5' },
  { key: 'ear', emoji: '👂', label: '洗耳朵', color: '#8D6E63', light: '#EBE0DA' },
  { key: 'paw', emoji: '🐾', label: '剃脚毛', color: '#A1887F', light: '#EFE5E0' },
  { key: 'gland', emoji: '💉', label: '挤肛门腺', color: '#FF5722', light: '#FBDBCF' },
  { key: 'teeth', emoji: '🦷', label: '刷牙', color: '#78909C', light: '#DDE4E8' },
  { key: 'beauty', emoji: '✂️', label: '美容', color: '#E91E63', light: '#F9D5E2' }
];

const ABNORMAL_MAP = ABNORMAL_TYPES.reduce((m, t) => (m[t.key] = t, m), {});
const GROOMING_MAP_DEF = GROOMING_DEFS.reduce((m, t) => (m[t.key] = t, m), {});
const GROOMING_TYPES = GROOMING_DEFS.map(t => t.key);

const RANGE_OPTIONS = [
  { key: '7d', label: '7d', days: 7 },
  { key: '30d', label: '30d', days: 30 },
  { key: '90d', label: '90d', days: 90 },
  { key: 'custom', label: '自定义', days: 0 }
];

// 工具：日期处理
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function dayKey(d) {
  return formatDate(d, 'YYYY-MM-DD');
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
// 解析重量字符串 "200g" "1.5kg" 等 -> 数值（统一为g）
function parseWeightAmount(amount, unit) {
  if (!amount && amount !== 0) return 0;
  let v = parseFloat(amount);
  if (isNaN(v)) return 0;
  if (unit === 'kg') v *= 1000;
  return v;
}
function parseVolume(amount) {
  if (!amount && amount !== 0) return 0;
  const v = parseFloat(amount);
  return isNaN(v) ? 0 : v;
}

Page({
  data: {
    loaded: false,
    rangeOptions: RANGE_OPTIONS,
    range: '90d',
    customStart: '',
    customEnd: '',
    petInfo: { name: '', ageText: '-', weightText: '-', conditionText: '-' },
    todayLabel: '',
    daysWithUs: 0,
    hasWeight: false,
    hasIntake: false,
    hasPoop: false,
    hasGrooming: false,
    abnormalLegend: ABNORMAL_TYPES,
    groomingLegend: GROOMING_DEFS
  },

  onLoad() {
    const today = new Date();
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const todayLabel = `${weekdays[today.getDay()]} · ${months[today.getMonth()]} ${today.getDate()}`;
    this.setData({ todayLabel });
  },

  async onShow() {
    await this.loadPetInfo();
    await this.loadData();
  },

  onReady() {
    this._ready = true;
    if (this._pendingDraw) {
      this._pendingDraw = false;
      this.redrawAll();
    }
  },

  async loadPetInfo() {
    const app = getApp();
    const pet = app.globalData.currentPet;
    if (!pet) return;
    let ageText = '-';
    try {
      if (pet.birthday) {
        const a = calcAge(pet.birthday);
        if (a) ageText = a;
      }
    } catch (e) {}
    let daysWithUs = 0;
    if (pet.adoptDate || pet.birthday) {
      const start = new Date(pet.adoptDate || pet.birthday);
      daysWithUs = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000));
    }
    this.setData({
      petInfo: {
        name: pet.name || '宝贝',
        ageText,
        weightText: pet.weight ? `${pet.weight} kg` : '-',
        conditionText: pet.breed || pet.species || '健康'
      },
      daysWithUs
    });
  },

  computeDateRange() {
    const range = this.data.range;
    const now = new Date();
    let end = startOfDay(now);
    end.setHours(23, 59, 59, 999);
    let start;
    if (range === 'custom' && this.data.customStart && this.data.customEnd) {
      start = startOfDay(new Date(this.data.customStart));
      end = startOfDay(new Date(this.data.customEnd));
      end.setHours(23, 59, 59, 999);
    } else {
      const opt = RANGE_OPTIONS.find(o => o.key === range) || RANGE_OPTIONS[2];
      const days = opt.days || 90;
      start = startOfDay(addDays(now, -(days - 1)));
    }
    return { start, end };
  },

  async loadData() {
    const app = getApp();
    const petId = app.globalData.currentPetId;
    if (!petId) {
      this.setData({ loaded: true });
      return;
    }

    const { start, end } = this.computeDateRange();

    try {
      const res = await wx.cloud.callFunction({
        name: 'recordManage',
        data: {
          action: 'list',
          data: {
            petId,
            type: 'all',
            limit: 1000,
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }
        }
      });

      const records = (res.result && res.result.code === 0) ? res.result.data : [];
      this.processRecords(records, start, end);
      this.setData({ loaded: true }, () => {
        if (this._ready) {
          this.redrawAll();
        } else {
          this._pendingDraw = true;
        }
      });
    } catch (e) {
      console.error('加载趋势数据失败', e);
      this.setData({ loaded: true });
    }
  },

  processRecords(records, start, end) {
    // 体重序列（统一归一为 kg）
    const weightArr = records
      .filter(r => r.type === 'weight' && r.weight)
      .map(r => {
        let v = parseFloat(r.weight) || 0;
        if (r.weightUnit === 'g') v = v / 1000;
        return { date: new Date(r.date), value: v };
      })
      .sort((a, b) => a.date - b.date);

    // 食物 / 饮水：按日期聚合
    const intakeMap = {};
    records.forEach(r => {
      const k = dayKey(r.date);
      if (!intakeMap[k]) intakeMap[k] = { date: new Date(r.date), food: 0, water: 0 };
      if (r.type === 'diet') {
        intakeMap[k].food += parseWeightAmount(r.foodAmount, 'g');
      } else if (r.type === 'water') {
        intakeMap[k].water += parseVolume(r.waterAmount);
      }
    });
    const intakeArr = Object.keys(intakeMap)
      .map(k => intakeMap[k])
      .filter(b => b.food > 0 || b.water > 0)
      .sort((a, b) => a.date - b.date);

    // 健康异常：尿便异常 / 给药 / 就医，按 day 分类型累计
    const poopMap = {};
    records.forEach(r => {
      let key = '';
      if (r.type === 'poop' && r.poopStatus === 'abnormal') key = 'poop';
      else if (r.type === 'illness') key = 'illness';
      else if (r.type === 'checkup') key = 'checkup';
      if (!key) return;
      const k = dayKey(r.date);
      if (!poopMap[k]) poopMap[k] = { poop: 0, illness: 0, checkup: 0, total: 0 };
      poopMap[k][key]++;
      poopMap[k].total++;
    });

    // 美容：按 day 分类型累计
    const groomingMap = {};
    records.filter(r => GROOMING_TYPES.indexOf(r.type) !== -1).forEach(r => {
      const k = dayKey(r.date);
      if (!groomingMap[k]) {
        groomingMap[k] = { total: 0 };
        GROOMING_TYPES.forEach(t => groomingMap[k][t] = 0);
      }
      groomingMap[k][r.type]++;
      groomingMap[k].total++;
    });

    this._weightArr = weightArr;
    this._intakeArr = intakeArr;
    this._poopMap = poopMap;
    this._groomingMap = groomingMap;
    this._range = { start, end };

    this.setData({
      hasWeight: weightArr.length > 0,
      hasIntake: intakeArr.length > 0,
      hasPoop: Object.keys(poopMap).length > 0,
      hasGrooming: Object.keys(groomingMap).length > 0
    });
  },

  // ===== Canvas 准备 =====
  getCanvasCtx(id) {
    return new Promise((resolve, reject) => {
      wx.createSelectorQuery().in(this)
        .select('#' + id)
        .fields({ node: true, size: true })
        .exec(res => {
          if (!res || !res[0] || !res[0].node) {
            reject(new Error('canvas not found: ' + id));
            return;
          }
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio || 2;
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
          resolve({ ctx, width: res[0].width, height: res[0].height, canvas });
        });
    });
  },

  redrawAll() {
    if (this.data.hasWeight) this.drawWeightChart();
    if (this.data.hasIntake) this.drawIntakeChart();
    if (this.data.hasPoop) this.drawPoopHeatmap();
    if (this.data.hasGrooming) this.drawGroomingHeatmap();
  },

  // ===== 体重折线图 =====
  async drawWeightChart() {
    try {
      const { ctx, width, height } = await this.getCanvasCtx('weightCanvas');
      const arr = this._weightArr;
      ctx.clearRect(0, 0, width, height);

      const padding = { top: 30, right: 24, bottom: 28, left: 44 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      let min = Math.min.apply(null, arr.map(p => p.value));
      let max = Math.max.apply(null, arr.map(p => p.value));
      if (min === max) { min -= 0.1; max += 0.1; }
      const yPad = (max - min) * 0.2 || 0.1;
      min -= yPad; max += yPad;

      const { start, end } = this._range;
      const totalMs = end.getTime() - start.getTime() || 1;

      const xOf = (d) => padding.left + (new Date(d).getTime() - start.getTime()) / totalMs * chartW;
      const yOf = (v) => padding.top + (1 - (v - min) / (max - min)) * chartH;

      // Y 轴刻度（3 条）
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#888888';
      ctx.strokeStyle = '#EEE6DC';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 2; i++) {
        const v = min + (max - min) * i / 2;
        const y = yOf(v);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.toFixed(1), padding.left - 6, y);
      }

      // X 轴日期标签（左中右）
      ctx.fillStyle = '#999999';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(formatDate(start, 'MM-DD'), padding.left, height - padding.bottom + 8);
      ctx.textAlign = 'center';
      ctx.fillText(formatDate(new Date((start.getTime() + end.getTime()) / 2), 'MM-DD'), padding.left + chartW / 2, height - padding.bottom + 8);
      ctx.textAlign = 'right';
      ctx.fillText(formatDate(end, 'MM-DD'), width - padding.right, height - padding.bottom + 8);

      // 折线
      ctx.strokeStyle = '#2D2D2D';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      arr.forEach((p, i) => {
        const x = xOf(p.date), y = yOf(p.value);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 数据点 + 数值标签
      ctx.fillStyle = '#FFFFFF';
      arr.forEach(p => {
        const x = xOf(p.date), y = yOf(p.value);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.fillStyle = '#2D2D2D';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      arr.forEach(p => {
        ctx.fillText(p.value.toFixed(1), xOf(p.date), yOf(p.value) - 6);
      });
    } catch (e) {
      console.error('drawWeightChart failed', e);
    }
  },

  // ===== 食水量双折线 =====
  async drawIntakeChart() {
    try {
      const { ctx, width, height } = await this.getCanvasCtx('intakeCanvas');
      const arr = this._intakeArr;
      ctx.clearRect(0, 0, width, height);

      const padding = { top: 20, right: 38, bottom: 28, left: 44 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      const foodMax = Math.max(1, ...arr.map(b => b.food));
      const waterMax = Math.max(1, ...arr.map(b => b.water));

      const { start, end } = this._range;
      const totalMs = end.getTime() - start.getTime() || 1;
      const xOf = (d) => padding.left + (new Date(d).getTime() - start.getTime()) / totalMs * chartW;
      const yFood = (v) => padding.top + (1 - v / foodMax) * chartH;
      const yWater = (v) => padding.top + (1 - v / waterMax) * chartH;

      // 水平网格
      ctx.strokeStyle = '#F0E8DC';
      ctx.lineWidth = 1;
      ctx.font = '10px sans-serif';
      for (let i = 0; i <= 3; i++) {
        const y = padding.top + chartH * i / 3;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }
      // 左 Y 轴（食物 g）
      ctx.fillStyle = '#7CB342';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(foodMax) + 'g', padding.left - 4, padding.top);
      ctx.fillText('0', padding.left - 4, padding.top + chartH);
      // 右 Y 轴（水 ml）
      ctx.fillStyle = '#42A5F5';
      ctx.textAlign = 'left';
      ctx.fillText(Math.round(waterMax) + 'ml', width - padding.right + 4, padding.top);
      ctx.fillText('0', width - padding.right + 4, padding.top + chartH);

      // X 轴
      ctx.fillStyle = '#999999';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(formatDate(start, 'MM-DD'), padding.left, height - padding.bottom + 8);
      ctx.textAlign = 'right';
      ctx.fillText(formatDate(end, 'MM-DD'), width - padding.right, height - padding.bottom + 8);

      // 食物折线
      ctx.strokeStyle = '#7CB342';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      arr.forEach(b => {
        if (b.food <= 0) return;
        const x = xOf(b.date), y = yFood(b.food);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 水折线
      ctx.strokeStyle = '#42A5F5';
      ctx.beginPath();
      started = false;
      arr.forEach(b => {
        if (b.water <= 0) return;
        const x = xOf(b.date), y = yWater(b.water);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 数据点
      arr.forEach(b => {
        if (b.food > 0) {
          ctx.fillStyle = '#7CB342';
          ctx.beginPath();
          ctx.arc(xOf(b.date), yFood(b.food), 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (b.water > 0) {
          ctx.fillStyle = '#42A5F5';
          ctx.beginPath();
          ctx.arc(xOf(b.date), yWater(b.water), 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } catch (e) {
      console.error('drawIntakeChart failed', e);
    }
  },

  // ===== 计算热力图矩阵 =====
  buildHeatmapMatrix(start, end) {
    // 找到第一个周日
    const firstSun = startOfDay(start);
    firstSun.setDate(firstSun.getDate() - firstSun.getDay());
    const lastSat = startOfDay(end);
    lastSat.setDate(lastSat.getDate() + (6 - lastSat.getDay()));
    const totalDays = Math.round((lastSat - firstSun) / 86400000) + 1;
    const cols = totalDays / 7;
    const cells = [];
    for (let row = 0; row < 7; row++) {
      const rowCells = [];
      for (let col = 0; col < cols; col++) {
        const d = new Date(firstSun);
        d.setDate(d.getDate() + col * 7 + row);
        rowCells.push({
          date: d,
          inRange: d >= startOfDay(start) && d <= startOfDay(end),
          isToday: dayKey(d) === dayKey(new Date()),
          key: dayKey(d)
        });
      }
      cells.push(rowCells);
    }
    return { cells, cols, firstSun, lastSat };
  },

  // ===== 健康异常热力图 =====
  async drawPoopHeatmap() {
    try {
      const { ctx, width, height } = await this.getCanvasCtx('poopCanvas');
      ctx.clearRect(0, 0, width, height);
      const { start, end } = this._range;
      const matrix = this.buildHeatmapMatrix(start, end);
      const dataMap = this._poopMap;
      let maxC = 1;
      Object.keys(dataMap).forEach(k => { if (dataMap[k].total > maxC) maxC = dataMap[k].total; });
      this._drawHeat(ctx, width, height, matrix, (cell) => {
        const v = dataMap[cell.key];
        if (!v || v.total === 0) return null;
        // 找出当日记录数最多的类型
        let dom = ABNORMAL_TYPES[0];
        let domCount = 0;
        ABNORMAL_TYPES.forEach(t => {
          if (v[t.key] > domCount) { domCount = v[t.key]; dom = t; }
        });
        const t = Math.min(1, v.total / maxC);
        return { fill: mixColor(dom.light, dom.color, t), emoji: dom.emoji };
      });
    } catch (e) {
      console.error('drawPoopHeatmap failed', e);
    }
  },

  // ===== 美容热力图 =====
  async drawGroomingHeatmap() {
    try {
      const { ctx, width, height } = await this.getCanvasCtx('groomingCanvas');
      ctx.clearRect(0, 0, width, height);
      const { start, end } = this._range;
      const matrix = this.buildHeatmapMatrix(start, end);
      const dataMap = this._groomingMap;
      let maxC = 1;
      Object.keys(dataMap).forEach(k => { if (dataMap[k].total > maxC) maxC = dataMap[k].total; });
      this._drawHeat(ctx, width, height, matrix, (cell) => {
        const v = dataMap[cell.key];
        if (!v || v.total === 0) return null;
        let dom = GROOMING_DEFS[0];
        let domCount = 0;
        GROOMING_DEFS.forEach(t => {
          if (v[t.key] > domCount) { domCount = v[t.key]; dom = t; }
        });
        const t = Math.min(1, v.total / maxC);
        return { fill: mixColor(dom.light, dom.color, t), emoji: dom.emoji };
      });
    } catch (e) {
      console.error('drawGroomingHeatmap failed', e);
    }
  },

  _drawHeat(ctx, width, height, matrix, colorFn) {
    const padding = { top: 24, right: 8, bottom: 8, left: 28 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const cols = matrix.cols;
    const cellSize = Math.min(chartW / cols, chartH / 7);
    const gap = Math.max(2, cellSize * 0.12);
    const inner = cellSize - gap;
    const radius = Math.max(2, inner * 0.22);
    const offsetX = padding.left + (chartW - cellSize * cols) / 2;
    const offsetY = padding.top;

    // 月份标签
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    let lastMonth = -1;
    for (let c = 0; c < cols; c++) {
      const d = matrix.cells[0][c].date;
      if (d.getMonth() !== lastMonth) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        ctx.fillText(months[d.getMonth()], offsetX + c * cellSize, offsetY - 4);
        lastMonth = d.getMonth();
      }
    }

    // 星期标签（S M T W T F S）
    const weekChars = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < 7; r++) {
      ctx.fillText(weekChars[r], offsetX - 6, offsetY + r * cellSize + inner / 2);
    }

    // 单元格
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = matrix.cells[r][c];
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        if (!cell.inRange) {
          continue;
        }
        const result = colorFn(cell);
        let fill = '#EFE9DD';
        let emoji = '';
        if (result) {
          if (typeof result === 'string') {
            fill = result;
          } else {
            fill = result.fill || '#EFE9DD';
            emoji = result.emoji || '';
          }
        }
        roundRect(ctx, x, y, inner, inner, radius);
        ctx.fillStyle = fill;
        ctx.fill();
        if (emoji) {
          const fontSize = Math.max(10, Math.floor(inner * 0.62));
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, x + inner / 2, y + inner / 2 + 1);
        }
        if (cell.isToday) {
          ctx.strokeStyle = '#2D2D2D';
          ctx.lineWidth = 1.2;
          roundRect(ctx, x, y, inner, inner, radius);
          ctx.stroke();
        }
      }
    }
  },

  // ===== 时间区间切换 =====
  onRangeTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === 'custom') {
      this.openCustomPicker();
      return;
    }
    if (key === this.data.range) return;
    this.setData({ range: key, loaded: false });
    this.loadData();
  },

  openCustomPicker() {
    const that = this;
    const today = formatDate(new Date(), 'YYYY-MM-DD');
    const start = that.data.customStart || formatDate(addDays(new Date(), -29), 'YYYY-MM-DD');
    wx.showActionSheet({
      itemList: ['选择起始日期', '选择结束日期'],
      success(res) {
        const isStart = res.tapIndex === 0;
        wx.showModal({
          title: isStart ? '请输入起始日期' : '请输入结束日期',
          editable: true,
          placeholderText: 'YYYY-MM-DD',
          content: isStart ? start : (that.data.customEnd || today),
          success(r) {
            if (!r.confirm) return;
            const v = (r.content || '').trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
              wx.showToast({ title: '日期格式不正确', icon: 'none' });
              return;
            }
            const patch = { range: 'custom' };
            if (isStart) patch.customStart = v;
            else patch.customEnd = v;
            that.setData(patch);
            const cs = isStart ? v : that.data.customStart;
            const ce = isStart ? that.data.customEnd : v;
            if (cs && ce) {
              that.setData({ loaded: false });
              that.loadData();
            }
          }
        });
      }
    });
  }
});

// 工具：颜色混合
function mixColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgba(${r},${g},${bl},0.6)`;
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
