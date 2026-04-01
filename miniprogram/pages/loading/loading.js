Page({
  data: {
    loading: true
  },

  onLoad() {
    // 等待用户信息就绪
    var app = getApp();
    var checkCount = 0;
    var maxCount = 50; // 最多检查 50 次防止无限循环

    var checkReady = function () {
      if (app.globalData.userReady) {
        // 用户信息已加载，可以开始加载页面
        return true;
      }
      return false;
    };

    var startCheck = function () {
      if (checkCount < maxCount) {
        setTimeout(function () {
          if (checkReady()) {
            // 可以加载页面了，跳转到首页
            wx.reLaunch({
              url: '/pages/home/home'
            });
          } else {
            // 继续检查
            startCheck();
          }
        }, 100);
        checkCount++;
      } else {
        // 超时了，用户信息可能有问题，直接跳转
        wx.reLaunch({
          url: '/pages/home/home'
        });
      }
    };

    this.setData({ loading: false });
    setTimeout(function () {
      startCheck();
    }, 500);
  }
});
