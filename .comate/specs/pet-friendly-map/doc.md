# 宠物友好地图模块 (pet-friendly-map)

## 1. 需求概述

在 PawDiary 小程序中新增「宠物友好地图」模块，用户可以：
- 在地图上添加宠物友好地点（定位、名称、图片等基本信息）
- 查看附近的宠物友好地点（地图模式 + 列表模式切换）
- 在地图上查看当前位置 1 公里以内的在线用户
- 从首页快捷入口进入地图页面

由于微信小程序 TabBar 最多支持 5 个，当前已占满，地图模块作为非 Tab 页面，通过首页快捷入口 `navigateTo` 进入。

## 2. 架构设计

### 2.1 新增页面
| 页面 | 路径 | 说明 |
|---|---|---|
| 宠物友好地图 | `pages/map/map` | 主页面，含地图模式和列表模式 |
| 添加地点 | `pages/map/place-add/place-add` | 添加/编辑宠物友好地点 |

### 2.2 新增云函数
| 云函数 | 说明 |
|---|---|
| `mapManage` | 地点 CRUD、附近在线用户查询、用户位置/在线状态上报 |

### 2.3 新增数据库集合
| 集合名 | 说明 |
|---|---|
| `pet_places` | 宠物友好地点数据 |
| `user_locations` | 用户位置与在线状态数据 |

## 3. 数据模型

### 3.1 pet_places 集合
```json
{
  "_id": "自动生成",
  "_openid": "创建者openid",
  "name": "宠物友好咖啡馆",
  "description": "描述信息",
  "category": "cafe",          // 分类：cafe/park/hospital/shop/other
  "latitude": 39.908,
  "longitude": 116.397,
  "address": "xx路xx号",
  "images": ["cloud://fileID1", "cloud://fileID2"],
  "creatorName": "用户昵称",
  "creatorAvatar": "头像URL",
  "status": "active",           // active / archived
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 3.2 user_locations 集合
```json
{
  "_id": "自动生成",
  "_openid": "用户openid",
  "latitude": 39.908,
  "longitude": 116.397,
  "nickName": "用户昵称",
  "avatarUrl": "头像URL",
  "lastActiveTime": "Date",    // 最近活跃时间
  "updatedAt": "Date"
}
```

### 3.3 在线状态判断逻辑
- **在线定义**：`lastActiveTime` 距当前时间不超过 5 分钟
- **上报机制**：用户进入地图页面时立即上报位置，之后每 30 秒上报一次
- **离开清理**：用户离开地图页面（`onHide`/`onUnload`）时停止上报，不主动删除记录（自然过期即可）
- **查询逻辑**：云函数查询 `lastActiveTime` 在 5 分钟以内且距当前用户 1 公里以内的记录，排除自己

### 3.4 距离计算
云函数端使用 Haversine 公式计算两点间球面距离，筛选 1 公里以内的用户。微信云开发数据库不支持 GEO 查询，因此在云函数中取全部近 5 分钟活跃的用户后进行内存过滤。考虑到同时在线用户数量有限，这种方案可行。

## 4. 云函数 mapManage 设计

路径：`cloudfunctions/mapManage/index.js`

### Actions:
| action | 说明 | 参数 |
|---|---|---|
| `addPlace` | 添加宠物友好地点 | `{ name, description, category, latitude, longitude, address, images }` |
| `listPlaces` | 查询附近地点 | `{ latitude, longitude, radius? }` 默认半径 5km |
| `deletePlace` | 删除自己创建的地点 | `{ placeId }` |
| `reportLocation` | 上报用户位置 | `{ latitude, longitude }` |
| `nearbyOnlineUsers` | 查询 1km 内在线用户 | `{ latitude, longitude }` |

### 关键实现

#### Haversine 距离计算函数
```javascript
function getDistance(lat1, lng1, lat2, lng2) {
  var R = 6371000; // 地球半径（米）
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

#### reportLocation 实现要点
- 使用 `_openid` 作为唯一键，存在则 update，不存在则 add
- 同时从 users 集合获取最新昵称和头像写入

#### nearbyOnlineUsers 实现要点
- 查询 `lastActiveTime >= 5分钟前` 的所有记录
- 内存中用 Haversine 过滤距离 <= 1000 米的记录
- 排除当前用户自己

## 5. 页面设计

### 5.1 地图主页面 (pages/map/map)

#### 页面数据
```javascript
data: {
  viewMode: 'map',         // 'map' | 'list'
  places: [],              // 宠物友好地点列表
  onlineUsers: [],         // 附近在线用户
  myLatitude: 0,
  myLongitude: 0,
  markers: [],             // 地图标记点（地点 + 在线用户）
  loaded: false,
  locationReportTimer: null
}
```

#### 功能逻辑
1. **进入页面**：调用 `wx.getLocation` 获取当前位置，加载附近地点和在线用户
2. **模式切换**：顶部 Tab 切换地图/列表模式
3. **地图模式**：使用 `<map>` 组件，markers 包含地点（橙色图钉）和在线用户（蓝色头像）
4. **列表模式**：以卡片列表展示地点，显示距离、分类、图片缩略图
5. **添加地点**：右下角 FAB 按钮，点击进入 place-add 页面
6. **定时上报**：`onShow` 开始每 30 秒上报位置，`onHide`/`onUnload` 清除定时器
7. **点击标记**：点击地点标记弹出简要信息气泡（callout）

### 5.2 添加地点页面 (pages/map/place-add/place-add)

#### 功能逻辑
1. **选择位置**：调用 `wx.chooseLocation` 让用户在地图上选点，获取经纬度和地址
2. **填写信息**：名称（必填）、描述（选填）、分类（选择器）
3. **上传图片**：最多 3 张图片，使用 `wx.chooseMedia` + 云存储上传
4. **提交**：调用 `mapManage` 的 `addPlace` action

## 6. 受影响的现有文件

### 6.1 miniprogram/app.json
- 新增页面路径：`pages/map/map`、`pages/map/place-add/place-add`
- 新增位置权限声明 `permission.scope.userLocation`

### 6.2 miniprogram/utils/constants.js
- 新增 `COLLECTIONS.PET_PLACES: 'pet_places'`
- 新增 `COLLECTIONS.USER_LOCATIONS: 'user_locations'`
- 新增 `PLACE_CATEGORIES` 地点分类常量

### 6.3 miniprogram/pages/home/home.wxml
- 在快捷入口区域新增「地图」入口项

### 6.4 miniprogram/pages/home/home.js
- 新增 `goMap()` 导航方法

## 7. 新增文件清单

| 文件路径 | 说明 |
|---|---|
| `cloudfunctions/mapManage/index.js` | 地图模块云函数 |
| `cloudfunctions/mapManage/package.json` | 云函数依赖配置 |
| `miniprogram/pages/map/map.js` | 地图主页面逻辑 |
| `miniprogram/pages/map/map.wxml` | 地图主页面模板 |
| `miniprogram/pages/map/map.wxss` | 地图主页面样式 |
| `miniprogram/pages/map/map.json` | 地图主页面配置 |
| `miniprogram/pages/map/place-add/place-add.js` | 添加地点页面逻辑 |
| `miniprogram/pages/map/place-add/place-add.wxml` | 添加地点页面模板 |
| `miniprogram/pages/map/place-add/place-add.wxss` | 添加地点页面样式 |
| `miniprogram/pages/map/place-add/place-add.json` | 添加地点页面配置 |

## 8. 地点分类定义

```javascript
const PLACE_CATEGORIES = [
  { key: 'cafe', label: '咖啡厅', icon: '☕' },
  { key: 'park', label: '公园', icon: '🌳' },
  { key: 'hospital', label: '宠物医院', icon: '🏥' },
  { key: 'shop', label: '宠物店', icon: '🏪' },
  { key: 'restaurant', label: '餐厅', icon: '🍽️' },
  { key: 'other', label: '其他', icon: '📍' }
];
```

## 9. 边界条件与异常处理

1. **位置权限拒绝**：用户拒绝位置授权时，显示引导提示，提供打开设置的按钮
2. **无网络**：云函数调用失败时显示错误提示，支持下拉刷新重试
3. **空数据**：附近无地点时使用 `empty-state` 组件显示友好提示
4. **图片上传失败**：单张失败不阻断，提示用户重试
5. **定时器泄漏**：确保 `onUnload` 中清除位置上报定时器
6. **并发上报**：避免定时器回调在页面已销毁后仍然执行

## 10. 数据流路径

```
用户进入地图页
  → wx.getLocation 获取位置
  → 并行调用: mapManage.listPlaces + mapManage.nearbyOnlineUsers + mapManage.reportLocation
  → 渲染地图标记 / 列表
  → 每30秒: mapManage.reportLocation
  → 每60秒: 刷新 nearbyOnlineUsers

用户添加地点
  → wx.chooseLocation 选点
  → 填写信息 + 上传图片
  → mapManage.addPlace
  → 返回地图页自动刷新
```
