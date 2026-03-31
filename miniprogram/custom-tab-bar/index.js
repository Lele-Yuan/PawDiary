Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/home/home',
        text: '首页',
        iconPath: '/images/tab/tab-home.png',
        selectedIconPath: '/images/tab/tab-home-active.png'
      },
      {
        pagePath: '/pages/checklist/checklist',
        text: '清单',
        iconPath: '/images/tab/tab-checklist.png',
        selectedIconPath: '/images/tab/tab-checklist-active.png'
      },
      {
        pagePath: '/pages/record/record',
        text: '记录',
        iconPath: '/images/tab/tab-record.png',
        selectedIconPath: '/images/tab/tab-record-active.png'
      },
      {
        pagePath: '/pages/bill/bill',
        text: '账单',
        iconPath: '/images/tab/tab-bill.png',
        selectedIconPath: '/images/tab/tab-bill-active.png'
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        iconPath: '/images/tab/tab-profile.png',
        selectedIconPath: '/images/tab/tab-profile-active.png'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      wx.switchTab({ url: path });
      this.setData({ selected: index });
    }
  }
});
