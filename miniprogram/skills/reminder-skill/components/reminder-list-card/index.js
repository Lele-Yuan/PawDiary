Component({
  data: {
    typeEmojiMap: {
      weight: '⚖️', diet: '🍖', water: '💧',
      deworm: '🪲', vaccine: '💉', checkup: '🩺', illness: '🤒',
      bath: '🛁', nail: '✂️', ear: '👂', paw: '🐾', gland: '🍑', teeth: '🪥', beauty: '💇',
      disinfect: '🧴', litter: '🪣', toy: '🧸', cage: '🏠'
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
