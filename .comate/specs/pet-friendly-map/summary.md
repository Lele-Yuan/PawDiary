# 宠物友好地图模块 - 实现总结

## 完成内容

### 1. 常量与配置
- **constants.js**: 新增 `PLACE_CATEGORIES`（6 种地点分类）、`PLACE_CATEGORY_MAP`、`COLLECTIONS.PET_PLACES`、`COLLECTIONS.USER_LOCATIONS`
- **app.json**: 注册 `pages/map/map` 和 `pages/map/place-add/place-add` 两个新页面；添加 `permission.scope.userLocation` 和 `requiredPrivateInfos` 位置权限声明

### 2. 云函数 mapManage
路径: `cloudfunctions/mapManage/index.js`

5 个 action:
- **addPlace**: 添加宠物友好地点，自动关联创建者昵称头像
- **listPlaces**: 查询 5km 内所有 active 地点，Haversine 计算距离并排序
- **deletePlace**: 软删除（仅创建者本人）
- **reportLocation**: 用户位置 upsert，同步最新昵称头像
- **nearbyOnlineUsers**: 查询 5 分钟内活跃 + 1km 内的用户，排除自己

在线判断逻辑: `lastActiveTime >= Date.now() - 5min`

### 3. 地图主页面 (pages/map/map)
- 地图模式: `<map>` 组件展示地点标记（callout 气泡）和在线用户标记
- 列表模式: 在线用户横向滚动 + 地点卡片列表（含距离、分类、图片、创建者信息）
- 顶部模式切换 Tab + 在线人数 Badge
- 每 30 秒上报位置，每 60 秒刷新在线用户
- `onHide`/`onUnload` 清除定时器防止泄漏
- 位置权限拒绝时引导用户前往设置

### 4. 添加地点页面 (pages/map/place-add/place-add)
- `wx.chooseLocation` 地图选点，自动回填地址和名称
- 6 种分类选择（咖啡厅/公园/宠物医院/宠物店/餐厅/其他）
- 最多 3 张图片上传至云存储
- 表单校验 + 提交反馈

### 5. 首页入口
- home.wxml 快捷入口区域新增「地图」入口项
- home.js 新增 `goMap()` 方法 (`wx.navigateTo`)

## 新增文件
| 文件 | 说明 |
|---|---|
| `cloudfunctions/mapManage/index.js` | 云函数主逻辑 |
| `cloudfunctions/mapManage/package.json` | 云函数依赖 |
| `miniprogram/pages/map/map.js` | 地图页逻辑 |
| `miniprogram/pages/map/map.wxml` | 地图页模板 |
| `miniprogram/pages/map/map.wxss` | 地图页样式 |
| `miniprogram/pages/map/map.json` | 地图页配置 |
| `miniprogram/pages/map/place-add/place-add.js` | 添加地点逻辑 |
| `miniprogram/pages/map/place-add/place-add.wxml` | 添加地点模板 |
| `miniprogram/pages/map/place-add/place-add.wxss` | 添加地点样式 |
| `miniprogram/pages/map/place-add/place-add.json` | 添加地点配置 |

## 修改文件
| 文件 | 修改 |
|---|---|
| `miniprogram/app.json` | 新增页面路径、位置权限声明 |
| `miniprogram/utils/constants.js` | 新增地点分类常量、集合名 |
| `miniprogram/pages/home/home.wxml` | 快捷入口新增「地图」 |
| `miniprogram/pages/home/home.js` | 新增 goMap 方法 |

## 数据库集合（需在云开发控制台创建）
- `pet_places`: 宠物友好地点数据
- `user_locations`: 用户位置与在线状态
