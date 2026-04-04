Page({
  data: {
    memorialPetId: '',
    petName: '',
    petAvatar: '',
    blessingsCount: 0,
    blessings: [],
    currentIndex: 0,
    loading: true,
    showHint: false
  },

  onLoad(options) {
    this.setData({
      memorialPetId: options.memorialPetId || '',
      petName: options.petName ? decodeURIComponent(options.petName) : '',
      petAvatar: options.petAvatar ? decodeURIComponent(options.petAvatar) : '',
      blessingsCount: parseInt(options.blessingsCount || '0')
    });
    if (options.memorialPetId) {
      this.loadBlessings(options.memorialPetId);
    }
  },

  async loadBlessings(memorialPetId) {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'memorialManage',
        data: {
          action: 'getBlessings',
          data: { memorialPetId: memorialPetId, limit: 50 }
        }
      });
      if (res.result && res.result.code === 0) {
        const blessings = res.result.data.map(item => ({
          ...item,
          createdAtStr: item.createdAt ? this.formatDate(new Date(item.createdAt)) : ''
        }));
        this.setData({
          blessings,
          // 多于1条时显示滑动提示
          showHint: blessings.length > 1
        });
        // 提示3秒后隐藏
        if (blessings.length > 1) {
          setTimeout(() => {
            this.setData({ showHint: false });
          }, 3200);
        }
      }
    } catch (err) {
      console.error('加载祝福列表失败：', err);
    }
    this.setData({ loading: false });
  },

  onSwiperChange(e) {
    this.setData({ currentIndex: e.detail.current });
  },

  formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return minutes + '分钟前';
    if (hours < 24) return hours + '小时前';
    if (days < 30) return days + '天前';
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return m + '月' + d + '日';
  }
});
