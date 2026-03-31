# 修复清单选中态、导航栏返回按钮、标题滚动渐隐

- [x] Task 1: 切换宠物时清空清单展开状态
    - 1.1: checklist.js 的 loadData 开头重置 expandedId、detailChecklist、detailNewItemName

- [x] Task 2: 修复 nav-bar 返回按钮点击无响应
    - 2.1: nav-bar.wxss 将 .nav-bar-inner 改为 fixed 定位并设置正 z-index
    - 2.2: nav-bar.wxml 将 statusBarHeight padding 移到 .nav-bar-inner 上
    - 2.3: 调整 .nav-bar-left/.nav-bar-right 的定位方式适配新布局

- [x] Task 3: nav-bar 组件支持标题透明度属性
    - 3.1: nav-bar.js properties 新增 titleOpacity（Number，默认 1）
    - 3.2: nav-bar.wxml 的 .nav-bar-title 绑定 opacity style
    - 3.3: nav-bar.wxss 为 .nav-bar-title 添加 transition 过渡

- [x] Task 4: 各页面添加 onPageScroll 监听实现标题渐隐
    - 4.1: home.js 新增 onPageScroll 和 navTitleOpacity data
    - 4.2: checklist.js 新增 onPageScroll 和 navTitleOpacity data
    - 4.3: record.js 新增 onPageScroll 和 navTitleOpacity data
    - 4.4: bill.js 新增 onPageScroll 和 navTitleOpacity data
    - 4.5: profile.js 新增 onPageScroll 和 navTitleOpacity data
    - 4.6: 各页面 wxml 的 nav-bar 标签添加 titleOpacity="{{navTitleOpacity}}" 属性
