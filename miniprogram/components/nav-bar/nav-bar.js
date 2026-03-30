Component({
  options: {
    multipleSlots: true
  },

  properties: {
    title: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: false
    }
  },

  data: {
    statusBarHeight: 20,
    navBarHeight: 44
  },

  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20,
        navBarHeight: 44
      });
    }
  },

  methods: {
    onBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.switchTab({ url: '/pages/home/home' });
      }
    }
  }
});