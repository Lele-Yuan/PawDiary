# 地点分享功能任务清单

- [x] Task 1: 在 place-detail.js 中实现分享逻辑
    - 1.1: 在 loadPlaceDetail 的 setData 成功后调用 wx.showShareMenu，激活右上角「转发」菜单
    - 1.2: 新增 onShareAppMessage 生命周期函数，读取 globalData.userInfo.nickName 和 place 数据，返回 title / path / imageUrl

- [x] Task 2: 在 place-detail.wxml 中添加分享按钮
    - 2.1: 在页面底部（loaded && place 条件块内）新增 open-type="share" 的分享按钮「🐕 喊狗友遛狗」

- [x] Task 3: 在 place-detail.wxss 中添加分享按钮样式
    - 3.1: 新增 .share-btn 样式，橙色渐变背景，与现有 action-btn 风格一致
