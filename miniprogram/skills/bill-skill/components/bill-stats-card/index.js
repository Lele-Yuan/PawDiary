Component({
  data: {
    categoryEmojiMap: { food: '🍖', medical: '💊', toy: '🧸', grooming: '✂️', daily: '🧴', other: '📦' },
    categoryNameMap:  { food: '食物', medical: '医疗', toy: '玩具', grooming: '美容', daily: '日用', other: '其他' },
    data: {},
    showDiff: false,
    diffUp: false,
    diffText: '',
    trendBars: []
  },
  lifetimes: {
    created() {
      const modelCtx = wx.modelContext.getContext(this);
      const { NotificationType } = wx.modelContext;
      modelCtx.on(NotificationType.Result, (d) => {
        const sc = (d && d.structuredContent) || {};
        const monthTotal = Number(sc.monthTotal) || 0;
        const lastMonthTotal = Number(sc.lastMonthTotal) || 0;
        let showDiff = false, diffUp = false, diffText = '';
        if (lastMonthTotal > 0) {
          showDiff = true;
          const ratio = ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100;
          diffUp = monthTotal >= lastMonthTotal;
          diffText = (diffUp ? '+' : '') + ratio.toFixed(0) + '%';
        }
        const trends = Array.isArray(sc.trends) ? sc.trends : [];
        const maxTotal = trends.reduce((m, t) => Math.max(m, Number(t.total) || 0), 0);
        const trendBars = trends.map(t => {
          const total = Number(t.total) || 0;
          const height = maxTotal > 0 ? Math.max(8, Math.round(total / maxTotal * 140)) : 4;
          return { label: t.label, height };
        });
        this.setData({ data: sc, showDiff, diffUp, diffText, trendBars });
      });
    }
  }
});
