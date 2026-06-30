Component({
  data: {
    typeEmojiMap: {
      weight: '⚖️', poop: '💩', diet: '🍖', water: '💧',
      deworm: '🪲', vaccine: '💉', checkup: '🩺', illness: '🤒',
      bath: '🛁', nail: '✂️', ear: '👂', paw: '🐾', gland: '🍑', teeth: '🪥', beauty: '💇',
      disinfect: '🧴', litter: '🪣', toy: '🧸', cage: '🏠',
      abnormal: '⚠️', heat: '🌡️', trouble: '💥', stealfood: '🍗'
    },
    data: {}
  },
  lifetimes: {
    created() {
      const modelCtx = wx.modelContext.getContext(this);
      const { NotificationType } = wx.modelContext;
      modelCtx.on(NotificationType.Result, (data) => {
        const sc = (data && data.structuredContent) || {};
        this.setData({ data: sc });
      });
    }
  }
});
