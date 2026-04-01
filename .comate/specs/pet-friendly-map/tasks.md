# 宠物友好地图模块实现任务

- [x] Task 1: 新增常量定义与 app.json 页面注册
    - 1.1: 在 constants.js 中新增 `PLACE_CATEGORIES` 地点分类常量及映射
    - 1.2: 在 constants.js 的 `COLLECTIONS` 中新增 `PET_PLACES` 和 `USER_LOCATIONS`
    - 1.3: 在 constants.js 的 `module.exports` 中导出新增常量
    - 1.4: 在 app.json 中注册 `pages/map/map` 和 `pages/map/place-add/place-add` 页面路径
    - 1.5: 在 app.json 中添加 `permission.scope.userLocation` 位置权限声明

- [x] Task 2: 创建 mapManage 云函数
    - 2.1: 创建 `cloudfunctions/mapManage/package.json`
    - 2.2: 创建 `cloudfunctions/mapManage/index.js`，实现 action 路由分发
    - 2.3: 实现 Haversine 距离计算工具函数
    - 2.4: 实现 `addPlace` — 添加宠物友好地点
    - 2.5: 实现 `listPlaces` — 查询附近地点（按距离筛选和排序）
    - 2.6: 实现 `deletePlace` — 删除自己创建的地点
    - 2.7: 实现 `reportLocation` — 上报用户位置（upsert 逻辑）
    - 2.8: 实现 `nearbyOnlineUsers` — 查询 1km 内 5 分钟内活跃用户

- [x] Task 3: 创建地图主页面（pages/map/map）
    - 3.1: 创建 map.json 页面配置（引用 nav-bar、empty-state 组件）
    - 3.2: 创建 map.js 页面逻辑：数据定义、生命周期、位置获取、数据加载
    - 3.3: 实现地图/列表模式切换逻辑
    - 3.4: 实现 markers 生成逻辑（地点标记 + 在线用户标记）
    - 3.5: 实现位置定时上报（30 秒间隔）与在线用户定时刷新（60 秒间隔）
    - 3.6: 实现删除自己创建的地点功能
    - 3.7: 创建 map.wxml 模板：地图视图、列表视图、模式切换、FAB 按钮
    - 3.8: 创建 map.wxss 样式

- [x] Task 4: 创建添加地点页面（pages/map/place-add/place-add）
    - 4.1: 创建 place-add.json 页面配置
    - 4.2: 创建 place-add.js：位置选择、表单数据、图片上传、提交逻辑
    - 4.3: 创建 place-add.wxml 模板：位置选择区、表单输入、图片上传、提交按钮
    - 4.4: 创建 place-add.wxss 样式

- [x] Task 5: 首页添加地图入口
    - 5.1: 在 home.wxml 快捷入口区域新增「地图」入口项
    - 5.2: 在 home.js 中新增 `goMap` 导航方法
