const { PERSONALITIES } = require('../data/dgti-data');

// 雷达图5个维度配置（五大人格轴）
const RADAR_AXES = [
  { key: 'social',   labelEn: ['Social', 'Skill'],     labelCn: '社交能力', color: '#77321C' },
  { key: 'clingy',   labelEn: ['Cling', 'Index'],      labelCn: '依赖指数', color: '#FF8C69' },
  { key: 'action',   labelEn: ['Action', 'Drive'],     labelCn: '行动力',   color: '#E07B54' },
  { key: 'strategy', labelEn: ['Strategy', 'Mind'],    labelCn: '策略值',   color: '#CFE99F' },
  { key: 'freedom',  labelEn: ['Freedom', 'Spirit'],   labelCn: '自由度',   color: '#B6D088' },
];

// 旧版历史 radar 字段映射（destroy→action, mental→freedom，danger 丢弃）
function migrateRadar(r) {
  if (!r) return null;
  // 已是新结构
  if (typeof r.action === 'number' || typeof r.strategy === 'number' || typeof r.freedom === 'number') {
    return {
      social: r.social != null ? r.social : 50,
      clingy: r.clingy != null ? r.clingy : 50,
      action: r.action != null ? r.action : 50,
      strategy: r.strategy != null ? r.strategy : 50,
      freedom: r.freedom != null ? r.freedom : 50,
    };
  }
  // 旧结构：social/danger/destroy/clingy/mental
  if (r.danger != null || r.destroy != null || r.mental != null) {
    return {
      social: r.social != null ? r.social : 50,
      clingy: r.clingy != null ? r.clingy : 50,
      action: r.destroy != null ? r.destroy : 50,
      strategy: 50,
      freedom: r.mental != null ? r.mental : 50,
    };
  }
  return {
    social: r.social != null ? r.social : 50,
    clingy: r.clingy != null ? r.clingy : 50,
    action: 50, strategy: 50, freedom: 50,
  };
}

Page({
  data: {
    personality: null,
    secondaryPersonality: null,
    primaryFit: 0,
    secondaryFit: 0,
    showSecondary: false,
    scores: null,
    isPreview: false,
    radarData: [],
    dynamicRadar: null,
    statusBarHeight: 20,
    // 海报相关
    showPosterModal: false,
    posterStep: 'input', // input | loading | preview
    dogName: '',
    posterImagePath: '',
  },

  onLoad(options) {
    let { id, scores, radar, preview, scene, dogName, from, secondaryId, primaryFit, secondaryFit } = options;
    // 小程序码扫码进入：scene 形如 "p=qi-tian"
    if (!id && scene) {
      try {
        const decoded = decodeURIComponent(scene);
        const m = decoded.match(/p=([^&]+)/);
        if (m) { id = m[1]; preview = 'true'; }
      } catch (e) {}
    }
    const personality = PERSONALITIES.find(p => p.id === id) || PERSONALITIES[0];
    const secondaryPersonality = secondaryId ? PERSONALITIES.find(p => p.id === secondaryId) : null;
    const pFit = primaryFit ? parseInt(primaryFit, 10) : 0;
    const sFit = secondaryFit ? parseInt(secondaryFit, 10) : 0;
    const showSecondary = !!(secondaryPersonality && sFit >= 60);

    // 从历史记录进入：根据 id 查 storage 获取 radar 与 dogName
    if (from === 'history' && id) {
      try {
        const list = wx.getStorageSync('dgti_history') || [];
        const hist = list.find(h => h.id === id);
        if (hist) {
          if (hist.radar && !radar) {
            radar = decodeURIComponent(hist.radar);
          }
          if (hist.dogName && !dogName) {
            dogName = decodeURIComponent(hist.dogName);
          }
        }
        console.log('hist: ', hist);
      } catch (e) {}
      preview = 'true';
    }

    const rawRadar = radar ? JSON.parse(decodeURIComponent(radar)) : {
      social: personality.social,
      clingy: personality.clingy,
      action: 50,
      strategy: 50,
      freedom: 50,
    };
    const dynamicRadar = migrateRadar(rawRadar);

    const radarData = RADAR_AXES.map(ax => ({
      key: ax.key,
      label: ax.labelCn,
      labelEn: ax.labelEn.join(' '),
      value: dynamicRadar[ax.key] || 0,
      color: ax.color,
    }));

    if (preview !== 'true' && radar) {
      this._pendingSave = { personality, radar };
    }

    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20
      });
    } catch (err) {
      console.error('读取状态栏高度失败：', err);
      this.setData({ statusBarHeight: 20 });
    }

    this.setData({
      personality,
      secondaryPersonality: showSecondary ? secondaryPersonality : null,
      primaryFit: pFit,
      secondaryFit: sFit,
      showSecondary,
      radarData,
      dynamicRadar,
      scores: scores ? JSON.parse(decodeURIComponent(scores)) : null,
      isPreview: preview === 'true',
      dogName: dogName || ''
    }, () => {
      wx.nextTick(() => this._drawRadar());
    });
  },

  // 绘制雷达图
  _drawRadar() {
    const { dynamicRadar: radar } = this.data;
    if (!radar) return;
    const query = wx.createSelectorQuery().in(this);
    query.select('#radar-canvas').fields({ node: true, size: true }).exec(res => {
      if (!res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const canvasWidth = res[0].width;
      const canvasHeight = res[0].height;

      const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio;
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      const size = Math.min(canvasWidth, canvasHeight);
      const cx = canvasWidth / 2;
      const cy = canvasHeight * 0.46;
      const maxR  = size * 0.25;
      const labelR = size * 0.36;

      const n = 5;
      const angleStep = (Math.PI * 2) / n;
      const startAngle = -Math.PI / 2;

      const getPoint = (r, i) => ({
        x: cx + r * Math.cos(startAngle + angleStep * i),
        y: cy + r * Math.sin(startAngle + angleStep * i),
      });

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      for (let lvl = 4; lvl >= 1; lvl--) {
        const r = maxR * (lvl / 4);
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const p = getPoint(r, i);
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = lvl % 2 === 0 ? 'rgba(255,241,237,0.7)' : 'rgba(255,248,246,0.5)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(119,50,28,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(119,50,28,0.18)';
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const outer = getPoint(maxR, i);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(outer.x, outer.y);
        ctx.stroke();
      }

      const values = RADAR_AXES.map(ax => (radar[ax.key] || 0) / 100);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p = getPoint(maxR * values[i], i);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, 'rgba(119,50,28,0.38)');
      grad.addColorStop(1, 'rgba(119,50,28,0.08)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#77321C';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      for (let i = 0; i < n; i++) {
        const p = getPoint(maxR * values[i], i);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#77321C';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const labelFontSize  = Math.round(size * 0.044);
      const pctFontSize    = Math.round(size * 0.036);
      const lineH = labelFontSize * 1.3;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let i = 0; i < n; i++) {
        const lp = getPoint(labelR, i);
        const ax = RADAR_AXES[i];
        const blockH = 2 * lineH + pctFontSize * 1.4;
        let startY = lp.y - blockH / 2;

        ctx.font = `bold ${labelFontSize}px sans-serif`;
        ctx.fillStyle = '#54433E';
        ctx.fillText(ax.labelCn, lp.x, startY);

        ctx.font = `${labelFontSize * 0.85}px sans-serif`;
        ctx.fillStyle = '#77321C';
        ctx.fillText(ax.labelEn.join(' '), lp.x, startY + lineH);

        ctx.font = `${pctFontSize}px sans-serif`;
        ctx.fillStyle = '#54433E';
        ctx.fillText(`${Math.round(values[i] * 100)}%`, lp.x, startY + lineH * 2);
      }
    });
  },

  goBack() {
    wx.navigateBack();
  },

  goAtlas() {
    wx.navigateBack({ delta: this.data.isPreview ? 1 : 2 });
  },

  _saveHistory(personality, radar, dogName) {
    const HISTORY_KEY = 'dgti_history';
    try {
      const list = wx.getStorageSync(HISTORY_KEY) || [];
      const existing = list.findIndex(h => h.id === personality.id);
      if (existing >= 0) {
        list[existing].radar = radar;
        list[existing].dogName = dogName || list[existing].dogName;
        list[existing].time = Date.now();
      } else {
        list.unshift({
          id: personality.id,
          name: personality.name,
          identity: personality.identity,
          tagline: personality.tagline,
          rarity: personality.rarity,
          rarityBg: personality.rarityBg,
          rarityColor: personality.rarityColor,
          iconBg: personality.iconBg,
          code: personality.code,
          radar: radar,
          dogName: dogName || '',
          time: Date.now(),
        });
      }
      wx.setStorageSync(HISTORY_KEY, list.slice(0, 20));
    } catch (e) {
      console.error('保存历史失败', e);
    }
  },

  // ===== 海报相关 =====

  onShare() {
    const { personality, dogName } = this.data;
    // 优先用当前已有的 dogName（从历史记录传入或之前设置过）
    const savedName = decodeURIComponent(dogName) || this._getHistoryDogName(personality.id);
    this.setData({ showPosterModal: true, posterStep: 'input', dogName: savedName, posterImagePath: '' });
  },

  _getHistoryDogName(personalityId) {
    const HISTORY_KEY = 'dgti_history';
    try {
      const list = wx.getStorageSync(HISTORY_KEY) || [];
      const item = list.find(h => h.id === personalityId);
      return item && item.dogName ? item.dogName : '';
    } catch (e) { return ''; }
  },

  onDogNameInput(e) {
    this.setData({ dogName: e.detail.value });
  },

  closePosterModal() {
    this.setData({ showPosterModal: false, posterStep: 'input' });
  },

  confirmDogName() {
    const { dogName } = this.data;
    if (!dogName || !dogName.trim()) {
      wx.showToast({ title: '请输入狗狗的名字', icon: 'none' });
      return;
    }
    const name = dogName.trim();
    // 保存测试记录（包含狗名）
    if (this._pendingSave) {
      this._saveHistory(this._pendingSave.personality, this._pendingSave.radar, name);
      this._pendingSave = null;
    }
    this.setData({ posterStep: 'loading' });
    wx.nextTick(() => this._drawPoster(name));
  },

  // 绘制海报主函数
  _drawPoster(dogName) {
    const { personality, dynamicRadar } = this.data;
    const query = wx.createSelectorQuery().in(this);
    query.select('#poster-canvas').fields({ node: true, size: true }).exec(res => {
      if (!res[0] || !res[0].node) {
        this._posterFail('海报生成失败，请重试');
        return;
      }

      const canvas = res[0].node;
      const W = 750;
      const H = 1334;
      const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio;
      canvas.width = W * dpr;
      canvas.height = H * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      const self = this;
      // 并行加载 iconImg 和小程序码
      Promise.all([
        self._loadImageOnCanvas(canvas, personality.iconImg),
        self._loadWxacode(canvas, personality.id),
      ]).then(function(imgs) {
        try {
          self._renderPoster(ctx, W, H, personality, dogName, dynamicRadar, imgs[0], imgs[1]);
          self._exportPoster(canvas, W, H);
        } catch (e) {
          console.error('海报绘制异常', e);
          self._posterFail('海报生成失败，请重试');
        }
      });
    });
  },

  // 加载图片到 Canvas（支持 cloud:// 和 https://）
  _loadImageOnCanvas(canvas, src) {
    return new Promise(function(resolve) {
      if (!src) { resolve(null); return; }
      const loadFromUrl = function(url) {
        const img = canvas.createImage();
        img.onload = function() { resolve(img); };
        img.onerror = function() { resolve(null); };
        img.src = url;
      };
      if (src.indexOf('cloud://') === 0) {
        wx.cloud.getTempFileURL({
          fileList: [src],
          success: function(tempRes) {
            const tempUrl = tempRes.fileList && tempRes.fileList[0] && tempRes.fileList[0].tempFileURL;
            if (!tempUrl) { resolve(null); return; }
            loadFromUrl(tempUrl);
          },
          fail: function() { resolve(null); },
        });
      } else {
        loadFromUrl(src);
      }
    });
  },

  // 调用云函数生成小程序码并加载
  _loadWxacode(canvas, personalityId) {
    const self = this;
    return new Promise(function(resolve) {
      // 缓存：同一狗格类型只生成一次小程序码
      const cacheKey = 'dgti_wxacode_' + personalityId;
      try {
        const cachedFileID = wx.getStorageSync(cacheKey);
        if (cachedFileID) {
          self._loadImageOnCanvas(canvas, cachedFileID).then(resolve);
          return;
        }
      } catch (e) {}

      wx.cloud.callFunction({
        name: 'dgtiWxacode',
        data: {
          page: 'pages/dogti/index/index',
          scene: 'dgti',
        },
        success: function(res) {
          if (res.result && res.result.code === 0 && res.result.fileID) {
            try { wx.setStorageSync(cacheKey, res.result.fileID); } catch (e) {}
            self._loadImageOnCanvas(canvas, res.result.fileID).then(resolve);
          } else {
            console.warn('生成小程序码失败', res.result);
            resolve(null);
          }
        },
        fail: function(err) {
          console.warn('生成小程序码云函数调用失败', err);
          resolve(null);
        },
      });
    });
  },

  _exportPoster(canvas, W, H) {
    setTimeout(() => {
      wx.canvasToTempFilePath({
        canvas: canvas,
        width: W,
        height: H,
        destWidth: W * 2,
        destHeight: H * 2,
        fileType: 'png',
        quality: 1,
        success: (res) => {
          this.setData({ posterImagePath: res.tempFilePath, posterStep: 'preview' });
        },
        fail: () => {
          this._posterFail('海报导出失败，请重试');
        },
      });
    }, 300);
  },

  // 海报渲染细节
  _renderPoster(ctx, W, H, p, dogName, radar, iconImage, wxacodeImage) {
    // 1. 底色
    ctx.fillStyle = '#FFF8F6';
    ctx.fillRect(0, 0, W, H);

    // 2. 顶部渐变背景区
    const gradBg = ctx.createLinearGradient(0, 0, W, H * 0.4);
    gradBg.addColorStop(0, p.iconBg || '#CFE99F');
    gradBg.addColorStop(1, '#FFF1ED');
    ctx.fillStyle = gradBg;
    roundRect(ctx, 0, 0, W, H * 0.36, 0);
    ctx.fill();

    // 3. 顶部装饰圆
    ctx.beginPath();
    ctx.arc(W * 0.8, H * 0.06, 80, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W * 0.15, H * 0.35, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();

    // 4. DGTI 品牌标识（顶部） 狗狗名字
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = 'rgba(119,50,28,0.5)';
    ctx.fillText('DGTI · ' + dogName + ' 的狗格', W / 2, H * 0.03);

    // 5. 狗格类型名称（大号）
    ctx.font = 'bold 64px sans-serif';
    ctx.fillStyle = '#221A17';
    ctx.fillText(p.name, W / 2, H * 0.06);

    // 5.1 绘制狗格 iconImg（居中，名称下方）
    if (iconImage) {
      var iconSize = 180;
      var iconX = (W - iconSize) / 2;
      var iconY = H * 0.06 + 76;
      // 绘制圆形裁剪区域
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    }

    // 6. 标签语
    ctx.font = 'italic 26px sans-serif';
    ctx.fillStyle = '#77321C';
    ctx.fillText('"' + p.tagline + '"', W / 2, H * 0.26);

    // 7. 稀有度 + 灵魂等级徽章
    const badgeY = H * 0.30;
    const badgeW = 160;
    const badgeH = 52;
    const badgeGap = 24;
    const totalW = badgeW * 2 + badgeGap;
    const startX = (W - totalW) / 2;

    // 稀有度徽章
    roundRect(ctx, startX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = p.rarityBg || '#CFE99F';
    ctx.fill();
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = p.rarityColor || '#77321C';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.rarity, startX + badgeW / 2, badgeY + badgeH / 2);

    // 灵魂等级徽章
    roundRect(ctx, startX + badgeW + badgeGap, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = '#77321C';
    ctx.fill();
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(p.soulRank, startX + badgeW + badgeGap + badgeW / 2, badgeY + badgeH / 2);

    // 8. 白色卡片区域（放雷达图）
    const cardTop = H * 0.38;
    const cardPad = 60;
    const cardW = W - cardPad * 2;
    const cardH = 420;
    roundRect(ctx, cardPad, cardTop, cardW, cardH, 32);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(218,193,186,0.3)';
    ctx.lineWidth = 2;
    roundRect(ctx, cardPad, cardTop, cardW, cardH, 32);
    ctx.stroke();

    // 卡片标题
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#77321C';
    ctx.fillText('Soul DNA Breakdown · 灵魂基因解析', W / 2, cardTop + 24);

    // 10. 小型雷达图
    this._drawMiniRadar(ctx, W / 2, cardTop + 240, 140, radar);

    // 11. 底部信息区
    const bottomY = cardTop + cardH + 40;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 狗狗职业 + 隐藏属性
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#221A17';
    ctx.fillText('狗届职业：' + p.job, W / 2, bottomY);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#54433E';
    ctx.fillText('隐藏属性：' + (p.tags && p.tags[0] || ''), W / 2, bottomY + 40);

    // 12. 小程序码 + 扫码提示
    const qrY = H - 260;
    const qrSize = 140;
    const qrX = (W - qrSize) / 2;
    if (wxacodeImage) {
      ctx.drawImage(wxacodeImage, qrX, qrY, qrSize, qrSize);
    } else {
      // 兜底：占位框
      roundRect(ctx, qrX, qrY, qrSize, qrSize, 12);
      ctx.fillStyle = '#F0E0C8';
      ctx.fill();
      ctx.strokeStyle = '#77321C';
      ctx.lineWidth = 2;
      roundRect(ctx, qrX, qrY, qrSize, qrSize, 12);
      ctx.stroke();
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#77321C';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('小程序码', W / 2, qrY + qrSize / 2);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(119,50,28,0.7)';
    ctx.fillText('长按识别 · 测测你家狗的狗格', W / 2, qrY + qrSize + 16);

    // 13. PawDiary 品牌水印
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(119,50,28,0.3)';
    ctx.fillText('PawDiary · 爪日记', W / 2, H - 60);
  },

  // 小型雷达图绘制（用于海报内）
  _drawMiniRadar(ctx, cx, cy, maxR, radar) {
    const n = 5;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    const getPoint = (r, i) => ({
      x: cx + r * Math.cos(startAngle + angleStep * i),
      y: cy + r * Math.sin(startAngle + angleStep * i),
    });

    // 背景网格（3层）
    for (let lvl = 3; lvl >= 1; lvl--) {
      const r = maxR * (lvl / 3);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p = getPoint(r, i);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = lvl % 2 === 0 ? 'rgba(255,241,237,0.7)' : 'rgba(255,248,246,0.5)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(119,50,28,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 轴线
    ctx.strokeStyle = 'rgba(119,50,28,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const outer = getPoint(maxR, i);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(outer.x, outer.y);
      ctx.stroke();
    }

    // 数据多边形
    const values = RADAR_AXES.map(ax => (radar[ax.key] || 0) / 100);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = getPoint(maxR * values[i], i);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grad.addColorStop(0, 'rgba(119,50,28,0.35)');
    grad.addColorStop(1, 'rgba(119,50,28,0.08)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#77321C';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 顶点
    for (let i = 0; i < n; i++) {
      const p = getPoint(maxR * values[i], i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#77321C';
      ctx.fill();
    }

    // 标签（中文 + 百分比）
    const labelR = maxR + 40;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < n; i++) {
      const lp = getPoint(labelR, i);
      const ax = RADAR_AXES[i];
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#54433E';
      ctx.fillText(ax.labelCn, lp.x, lp.y - 10);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#77321C';
      ctx.fillText(Math.round(values[i] * 100) + '%', lp.x, lp.y + 12);
    }
  },

  // 保存海报到相册
  savePoster() {
    const { posterImagePath } = this.data;
    if (!posterImagePath) return;
    wx.saveImageToPhotosAlbum({
      filePath: posterImagePath,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
        this.setData({ showPosterModal: false, posterStep: 'input' });
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要授权保存图片到相册，请在设置中开启',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            },
          });
        } else {
          wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        }
      },
    });
  },

  _posterFail(msg) {
    wx.showToast({ title: msg || '海报生成失败', icon: 'none' });
    this.setData({ posterStep: 'input' });
  },

  onShareAppMessage() {
    const { personality } = this.data;
    return {
      title: `我家狗的狗格是「${personality.name}」！${personality.tagline}`,
      path: `/pages/dogti/result/result?id=${personality.id}&preview=true`,
    };
  },
});

// 辅助函数：绘制圆角矩形路径
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
