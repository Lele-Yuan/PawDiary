Component({
  properties: {
    data: { type: Object, value: {} }
  },
  data: {
    categoryEmojiMap: { food: '🍖', medical: '💊', toy: '🧸', grooming: '✂️', daily: '🧴', other: '📦' },
    categoryNameMap:  { food: '食物', medical: '医疗', toy: '玩具', grooming: '美容', daily: '日用', other: '其他' },
    showDiff: false,
    diffUp: false,
    diffText: '',
    trendBars: []
  },
  observers: {
    'data': function (data) {
      if (!data) return;
      const monthTotal = Number(data.monthTotal) || 0;
      const lastMonthTotal = Number(data.lastMonthTotal) || 0;
      let showDiff = false;
      let diffUp = false;
      let diffText = '';
      if (lastMonthTotal > 0) {
        showDiff = true;
        const ratio = ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        diffUp = monthTotal >= lastMonthTotal;
        diffText = (diffUp ? '+' : '') + ratio.toFixed(0) + '%';
      }
      const trends = Array.isArray(data.trends) ? data.trends : [];
      const trendBars = trends.map(t => {
        const total = Number(t.total) || 0;
        const height = total > 0 ? Math.max(8, Math.round(total / 1000 * 100)) : 4;
        return { label: t.label, height };
      });
      this.setData({ showDiff, diffUp, diffText, trendBars });
    }
  }
});
