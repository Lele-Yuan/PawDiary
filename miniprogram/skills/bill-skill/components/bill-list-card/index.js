Component({
  data: {
    categoryEmojiMap: { food: '🍖', medical: '💊', toy: '🧸', grooming: '✂️', daily: '🧴', other: '📦' },
    data: {}
  },
  lifetimes: {
    created() {
      const modelCtx = wx.modelContext.getContext(this);
      const { NotificationType } = wx.modelContext;
      modelCtx.on(NotificationType.Result, (d) => {
        this.setData({ data: (d && d.structuredContent) || {} });
      });
    }
  }
});
