# 宠物友好地图功能重构 (map-online-redesign)

## 1. 需求概述

对现有宠物友好地图模块进行四项重构：

1. **在线人数按地点统计**：每个地点显示距该地点 1km 以内的在线用户数，而非全局在线人数
2. **默认列表模式**：打开地图页优先展示列表模式
3. **地点详情页**：点击列表中的地点跳转详情页，显示完整信息；仅创建者可编辑/删除
4. **修复地图 marker 不显示**：微信小程序 `<map>` 组件的 `iconPath` 不支持以 `/` 开头的绝对路径，需改为相对路径或使用 label 替代

## 2. 架构变更

### 2.1 新增页面
| 页面 | 路径 | 说明 |
|---|---|---|
| 地点详情 | `pages/map/place-detail/place-detail` | 查看地点完整信息、在线人数、创建者可编辑/删除 |

### 2.2 云函数变更 (mapManage)

#### 移除 `nearbyOnlineUsers` action
不再需要独立查询附近在线用户的接口。

#### 修改 `listPlaces` action
在返回每个地点数据时，额外附带该地点 1km 内的在线用户数 `onlineCount`。

#### 新增 `getPlace` action
获取单个地点详情，包含 1km 内在线用户列表。

#### 新增 `updatePlace` action
允许创建者编辑地点信息（名称、描述、分类、图片）。

## 3. 云函数详细设计

### 3.1 listPlaces 改造

```javascript
async function listPlaces(openid, data) {
  // 1. 查询所有 active 地点
  // 2. 查询 5 分钟内活跃的所有在线用户
  // 3. 对每个地点，计算 1km 内在线用户数
  // 4. 返回地点列表，每个地点附带 onlineCount 字段
}
```

### 3.2 getPlace（新增）

参数：`{ placeId, latitude?, longitude? }`
返回：地点完整信息 + 1km 内在线用户列表 `onlineUsers[]`

```javascript
async function getPlace(openid, data) {
  // 1. 查询地点详情
  // 2. 查询 5 分钟内活跃的在线用户
  // 3. 筛选距该地点 1km 内的用户
  // 4. 返回 { place, onlineUsers }
}
```

### 3.3 updatePlace（新增）

参数：`{ placeId, name?, description?, category?, images? }`
逻辑：验证 `_openid === openid`，仅创建者可更新。

## 4. 页面设计

### 4.1 地图主页 (map.js) 改动

- `viewMode` 默认值改为 `'list'`
- 移除 `onlineUsers`、`onlineCount` 全局数据和相关 `refreshOnlineUsers` 定时器
- 移除顶部栏的全局在线人数 badge
- 列表中每个地点卡片显示 `item.onlineCount` 在线人数
- 点击地点卡片跳转到 `place-detail` 页面，传递 `placeId`
- 修复 marker 的 `iconPath`：微信 `<map>` 组件不支持 `/` 开头绝对路径，改用相对路径 `../../images/...` 或自定义 label
- 移除列表中的在线用户横向滚动区域
- 列表中地点卡片精简（去掉图片和详细描述，留给详情页），只显示名称、分类、距离、在线人数
- 移除列表中的删除按钮（移到详情页）

### 4.2 地点详情页 (place-detail) 新建

#### 数据
```javascript
data: {
  place: null,
  onlineUsers: [],
  loaded: false,
  isOwner: false
}
```

#### 功能
- 展示地点完整信息：名称、分类、地址、描述、图片、创建者
- 展示该地点 1km 内在线用户列表（头像 + 昵称 + 距离）
- 创建者显示「编辑」和「删除」按钮
- 编辑跳转 `place-add?mode=edit&id=xxx`
- 删除调用 `mapManage.deletePlace`

### 4.3 添加地点页 (place-add) 改造

- 支持编辑模式：通过 `options.mode === 'edit' && options.id` 进入
- 编辑模式下加载已有数据填充表单
- 提交时根据模式调用 `addPlace` 或 `updatePlace`
- 编辑模式下位置不可更改（已选定的位置仅展示不可点击）

### 4.4 Marker 修复

微信小程序 `<map>` 的 `iconPath` 要求相对于当前页面的路径，不支持 `/` 开头的绝对路径。方案：使用 `label` 属性代替自定义图标，用 emoji + 文字作为标记显示内容，无需依赖图片文件。

## 5. 受影响文件清单

| 文件路径 | 修改类型 | 说明 |
|---|---|---|
| `cloudfunctions/mapManage/index.js` | 修改 | listPlaces 加 onlineCount；新增 getPlace、updatePlace；移除 nearbyOnlineUsers |
| `miniprogram/app.json` | 修改 | 注册 place-detail 页面路径 |
| `miniprogram/pages/map/map.js` | 修改 | 默认列表模式、简化数据流、修复 marker、点击跳转详情 |
| `miniprogram/pages/map/map.wxml` | 修改 | 移除全局在线 badge 和用户横滑区；卡片加 onlineCount；卡片可点击 |
| `miniprogram/pages/map/map.wxss` | 修改 | 移除在线用户横滑样式，新增在线人数样式 |
| `miniprogram/pages/map/place-add/place-add.js` | 修改 | 支持编辑模式 |
| `miniprogram/pages/map/place-add/place-add.wxml` | 修改 | 编辑模式 UI 适配 |
| `miniprogram/pages/map/place-detail/place-detail.js` | 新增 | 详情页逻辑 |
| `miniprogram/pages/map/place-detail/place-detail.wxml` | 新增 | 详情页模板 |
| `miniprogram/pages/map/place-detail/place-detail.wxss` | 新增 | 详情页样式 |
| `miniprogram/pages/map/place-detail/place-detail.json` | 新增 | 详情页配置 |

## 6. 边界条件

- 地点无在线用户时显示「0人在线」
- 详情页加载失败（地点被删除）时提示并返回
- 编辑模式下位置不可更改，避免误操作
- marker 使用 label 方案兼容所有机型
