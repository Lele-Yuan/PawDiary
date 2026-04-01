# 宠物友好地图功能重构任务

- [x] Task 1: 重构 mapManage 云函数
    - 1.1: 修改 listPlaces，查询在线用户并为每个地点计算 1km 内 onlineCount
    - 1.2: 新增 getPlace action，返回地点详情 + 1km 内在线用户列表
    - 1.3: 新增 updatePlace action，仅创建者可编辑地点信息
    - 1.4: 移除 nearbyOnlineUsers action

- [x] Task 2: 注册新页面并创建地点详情页
    - 2.1: 在 app.json 中注册 pages/map/place-detail/place-detail
    - 2.2: 创建 place-detail.json 页面配置
    - 2.3: 创建 place-detail.js，实现加载详情、在线用户列表、编辑跳转、删除功能
    - 2.4: 创建 place-detail.wxml 模板，展示完整地点信息、在线用户、创建者操作区
    - 2.5: 创建 place-detail.wxss 样式

- [x] Task 3: 重构地图主页面
    - 3.1: map.js 中 viewMode 默认改为 list，移除 onlineUsers/onlineCount 全局数据和 refreshOnlineUsers 定时器
    - 3.2: map.js 中 loadData 只调用 listPlaces（已含 onlineCount），移除 nearbyOnlineUsers 调用
    - 3.3: map.js 中修复 buildMarkers，使用 label 属性替代 iconPath 解决 marker 不显示问题
    - 3.4: map.js 新增 onTapPlace 方法，点击卡片跳转 place-detail
    - 3.5: map.wxml 移除全局在线 badge 和在线用户横滑区，卡片精简并显示 onlineCount，卡片绑定点击跳转
    - 3.6: map.wxss 移除在线用户横滑样式，新增地点在线人数样式

- [x] Task 4: 改造 place-add 页面支持编辑模式
    - 4.1: place-add.js 中 onLoad 解析 mode=edit&id=xxx，加载已有地点数据填充表单
    - 4.2: place-add.js 中 onSubmit 根据模式调用 addPlace 或 updatePlace
    - 4.3: place-add.wxml 编辑模式下位置区域改为仅展示不可点击，按钮文案动态切换
