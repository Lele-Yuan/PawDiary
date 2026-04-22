# 代铲屎遛狗模块 — 详细设计方案

## 1. 需求概述

在首页"宠好地图"入口之后新增「代铲屎遛狗」模块入口。核心功能分两类角色发布：

| 角色 | 发布内容 | 标识色 |
|---|---|---|
| **临时主**（Helper） | 我在哪、什么时间、可服务半径内帮忙铲屎/遛狗 | 主色 `#E8875A`（橙） |
| **铲屎官**（Owner） | 我在哪、什么时间、需要人帮我代铲屎/遛狗 | 青色 `#8ECFC9`（teal） |

两类帖子在同一列表中展示，支持按距离、类型、服务类别筛选。用户"申请联系"后可查看发布人联系方式。

---

## 2. 页面架构

```
miniprogram/pages/
├── care/                         # 代铲屎遛狗主列表页（tabBar 级或从首页进入）
│   ├── care.js
│   ├── care.wxml
│   ├── care.wxss
│   └── care.json
└── care/care-add/                # 发布帖子页
    ├── care-add.js
    ├── care-add.wxml
    ├── care-add.wxss
    └── care-add.json

cloudfunctions/careManage/
├── index.js                      # 云函数
├── config.json
└── package.json
```

app.json 需新增页面路由，首页 home.wxml 新增入口卡片。

---

## 3. 数据模型

### 集合：`pet_care_posts`

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 云数据库自动生成 |
| `_openid` | string | 发布人 openid（云数据库权限） |
| `role` | `'helper'` \| `'owner'` | 临时主 / 铲屎官 |
| `serviceType` | `'poop'` \| `'walk'` \| `'other'` | 铲屎 / 遛狗 / 异宠 |
| `title` | string | 帖子标题（自动生成或用户填写） |
| `description` | string | 补充说明（可选） |
| `location` | `{ address: string, latitude: number, longitude: number }` | 服务地点 |
| `radius` | number | helper 可服务半径（km），owner 填 0 |
| `availableTime` | `{ startTime: string, endTime: string, dateType: 'once'\|'weekly'\|'custom', dateDesc: string }` | 时间安排 |
| `contactInfo` | `{ phone?: string, wechat?: string }` | 联系方式（仅申请后可见） |
| `petInfo` | `{ name?: string, breed?: string, weight?: number }` | 宠物信息（owner 填写） |
| `status` | `'active'` \| `'done'` \| `'archived'` | 帖子状态 |
| `applicants` | `string[]` | 已申请联系的 openid 列表 |
| `publisherInfo` | `{ nickname: string, avatarUrl: string }` | 快照（发布时保存） |
| `createTime` | date | 发布时间 |
| `updateTime` | date | 更新时间 |

### 集合：`pet_care_contacts`（申请记录，独立集合便于权限控制）

| 字段 | 类型 | 说明 |
|---|---|---|
| `postId` | string | 关联帖子 id |
| `applicantOpenid` | string | 申请人 openid |
| `applicantInfo` | `{ nickname, avatarUrl }` | 申请人快照 |
| `status` | `'pending'` \| `'revealed'` | pending=已申请 / revealed=已查看 |
| `createTime` | date | 申请时间 |

---

## 4. 云函数设计（careManage）

### actions

| action | 入参 | 出参 | 说明 |
|---|---|---|---|
| `publish` | `{ role, serviceType, title, description, location, radius, availableTime, contactInfo, petInfo }` | `{ code, data: post }` | 发布帖子 |
| `list` | `{ latitude, longitude, radius?, roleFilter?, serviceTypeFilter?, pageSize?, page? }` | `{ code, data: { list, total } }` | 列表（含距离计算） |
| `get` | `{ postId }` | `{ code, data: post }` | 帖子详情（联系方式脱敏） |
| `applyContact` | `{ postId }` | `{ code, data: { contactInfo } }` | 申请联系（写 contacts 集合，返回联系方式） |
| `update` | `{ postId, ...fields }` | `{ code }` | 编辑（仅本人） |
| `delete` | `{ postId }` | `{ code }` | 软删除（仅本人） |
| `myPosts` | `{ status? }` | `{ code, data: list }` | 我发布的帖子 |

### list 核心逻辑（伪代码）

```js
async function listPosts(openid, data) {
  const { latitude, longitude, roleFilter, serviceTypeFilter, pageSize = 20, page = 0 } = data;
  let query = db.collection('pet_care_posts').where({ status: 'active' });
  if (roleFilter)        query = query.where({ role: roleFilter });
  if (serviceTypeFilter) query = query.where({ serviceType: _.in([serviceTypeFilter, 'other']) });

  const { data: posts } = await query
    .orderBy('createTime', 'desc')
    .skip(page * pageSize)
    .limit(pageSize)
    .get();

  // 计算距离（Haversine，复用 mapManage 逻辑）
  posts.forEach(post => {
    post.distance = haversine(latitude, longitude, post.location.latitude, post.location.longitude);
    post.distanceText = post.distance < 1000 ? `${Math.round(post.distance)}m` : `${(post.distance/1000).toFixed(1)}km`;
    // 脱敏：不返回 contactInfo、applicants
    delete post.contactInfo;
    delete post.applicants;
  });

  // 按距离排序（客户端可覆盖）
  posts.sort((a, b) => a.distance - b.distance);
  return { code: 0, data: { list: posts, total: posts.length } };
}
```

### applyContact 逻辑

```js
async function applyContact(openid, data) {
  const { postId } = data;
  const post = await db.collection('pet_care_posts').doc(postId).get();
  if (post.data.status !== 'active') return { code: -1, message: '帖子已关闭' };
  if (post.data._openid === openid) return { code: -1, message: '不能申请自己的帖子' };

  // 写入申请记录（幂等：已存在则更新 status）
  const existing = await db.collection('pet_care_contacts')
    .where({ postId, applicantOpenid: openid }).get();
  if (!existing.data.length) {
    await db.collection('pet_care_contacts').add({
      data: { postId, applicantOpenid: openid, status: 'revealed', createTime: db.serverDate() }
    });
    // 同步更新帖子的 applicants 数组
    await db.collection('pet_care_posts').doc(postId).update({
      data: { applicants: _.push(openid), updateTime: db.serverDate() }
    });
  }
  // 返回联系方式
  return { code: 0, data: { contactInfo: post.data.contactInfo } };
}
```

---

## 5. 前端页面设计

### 5.1 首页入口（home.wxml）

在现有 `guide-links`（宠好地图横幅卡）之后，新增「代铲屎遛狗」入口卡片：

```xml
<!-- 代铲屎遛狗入口（home.wxml 中 guide-links 之后） -->
<view class="section-title">宠物互助</view>
<view class="care-entry-card" bindtap="goToCare">
  <view class="care-entry-left">
    <view class="care-entry-icon">🐾</view>
    <view class="care-entry-text">
      <text class="care-entry-title">代铲屎遛狗</text>
      <text class="care-entry-desc">附近宠物互助，轻松找搭子</text>
    </view>
  </view>
  <view class="care-entry-arrow">›</view>
</view>
```

**样式**（与 guide-links 保持一致）：
- 背景：`linear-gradient(135deg, #FFF6EE, #FDE8D8)`
- 圆角：`64rpx`，padding `36rpx`，box-shadow `0 8rpx 32rpx rgba(232,135,90,0.12)`
- icon 圆形容器：`background: rgba(232,135,90,0.15)`，尺寸 `88rpx`，圆角 `50%`

---

### 5.2 代铲屎遛狗列表页（care.wxml）

```
care-page
├── custom nav-bar（标题"代铲屎遛狗"，右上角"+"发布按钮）
├── filter-bar（吸顶）
│   ├── filter-chip: 全部 / 临时主 / 需求方    （role 筛选）
│   ├── filter-chip: 全部 / 铲屎 / 遛狗 / 都可  （serviceType 筛选）
│   └── sort-btn: 距离排序 / 最新发布           （排序切换）
├── care-list（scroll-view）
│   └── care-card × N
│       ├── card-header
│       │   ├── role-badge（"临时主"橙 / "需求方"青）
│       │   ├── service-tags（铲屎/遛狗 pill）
│       │   └── distance-text（右对齐，灰色）
│       ├── card-body
│       │   ├── publisher-avatar + nickname
│       │   ├── location-row（📍 地址文字）
│       │   ├── time-row（🕐 时间描述）
│       │   └── radius-row（helper：📡 可服务Xkm；owner：宠物信息）
│       └── card-footer
│           ├── create-time（发布时间，灰色小字）
│           └── contact-btn（"申请联系"橙色按钮 / 已申请则显示联系方式）
└── fab-btn（"+ 发布"悬浮按钮，复用 .fab-btn 样式）
```

**care-card 样式**：
- 容器：复用 `.card` 类（`border-radius: 64rpx`，白底，轻阴影）
- role-badge：临时主 `background: rgba(232,135,90,0.12); color: #E8875A; border: 1px solid #E8875A`，需求方 `background: rgba(142,207,201,0.15); color: #3C6663; border: 1px solid #8ECFC9`；圆角 `24rpx`，padding `6rpx 18rpx`
- service-tags：小圆角 pill，铲屎用 `#F5EDD0` 底色 `#6B2D1A` 字，遛狗用 `#E8F5F4` 底色 `#3C6663` 字
- contact-btn：已申请状态变为展示微信号/手机号的文本框（灰底），"申请联系"用 `.btn-primary` 样式（`background: #6B2D1A`，圆角 `64rpx`）

---

### 5.3 发布页（care-add.wxml）

```
care-add-page
├── nav-bar（"发布互助"，左侧返回）
├── scroll-view（表单主体）
│   ├── role-section（我是？）
│   │   └── radio-group: [临时主 我来帮忙] [铲屎官 我需要帮助]  ← 卡片式单选
│   ├── service-section（服务类型）
│   │   └── checkbox-group: [铲屎] [遛狗]
│   ├── location-section（服务地点）
│   │   └── location-picker（调用 wx.chooseLocation 或显示当前位置）
│   ├── radius-section（可服务半径，仅 helper 显示）
│   │   └── slider: 0.5km ─────●───── 10km
│   ├── time-section（可用时间）
│   │   ├── date-type: [单次] [每周] [自定义]
│   │   ├── time-picker: 开始时间 ~ 结束时间
│   │   └── date-desc（文字补充，如"每周六日上午"）
│   ├── pet-section（宠物信息，仅 owner 显示）
│   │   ├── pet-name input
│   │   ├── pet-breed input（品种）
│   │   └── pet-weight input
│   ├── contact-section（联系方式，至少填一项）
│   │   ├── phone input
│   │   └── wechat input
│   ├── description-section（补充说明，textarea，可选）
│   └── publish-btn（"立即发布"，.btn-primary）
└──（底部安全区 padding）
```

**表单验证规则**：
- role 必选
- serviceType 至少选一项
- location 必填（经纬度 + 地址文字）
- availableTime startTime 必填
- contactInfo 至少填 phone 或 wechat 之一

---

## 6. 视觉规范（与现有页面一致）

### 色彩映射

| 用途 | 值 |
|---|---|
| 临时主角色主色 | `#E8875A`（复用 primary-color） |
| 需求方角色主色 | `#8ECFC9`（复用 teal-color） |
| 铲屎服务 tag | `#F5EDD0` 底 / `#6B2D1A` 字 |
| 遛狗服务 tag | `#E8F5F4` 底 / `#3C6663` 字 |
| 页面背景 | `#FBF9F7`（--bg-color） |
| 卡片背景 | `#FFFFFF` |

### 卡片样式继承

直接复用 `app.wxss` 中的 `.card` 类，不另写 box-shadow。

### 动画

列表加载使用 `fadeInUp`（已在 app.wxss 中定义），delay 依序 `0ms / 60ms / 120ms ...`

### 空状态

复用已有 `<empty-state>` 组件，文案根据筛选条件动态显示：
- 全部空：「附近暂无互助信息，成为第一个发布的人吧~」
- 筛选后空：「该筛选条件下暂无结果，换个试试？」

---

## 7. 数据流

```
用户打开 care 页
    ↓
wx.getLocation() 获取当前坐标
    ↓
callFunction('careManage', { action:'list', latitude, longitude, ...filters })
    ↓
云函数查询 pet_care_posts (status=active) → Haversine 计算距离 → 返回列表
    ↓
前端按 sortType 二次排序（距离 or 时间） → 渲染列表
    ↓
用户点击「申请联系」
    ↓
callFunction('careManage', { action:'applyContact', postId })
    ↓
云函数写 pet_care_contacts → 返回 contactInfo
    ↓
前端卡片内联展示联系方式
```

---

## 8. 权限与安全

- `pet_care_posts` 集合权限：仅创建者可写，所有人可读（配置自定义安全规则）
- `contactInfo` 字段在 `list` 接口中不返回；仅 `applyContact` 接口在服务端验证通过后返回
- `applyContact` 防刷：同一 openid 对同一 postId 幂等（已申请不重复写）
- 自己的帖子不可申请联系（服务端校验 openid 匹配）

---

## 9. 需要修改的现有文件

| 文件 | 改动类型 | 改动内容 |
|---|---|---|
| `miniprogram/app.json` | 修改 | 新增 `pages/care/care` 和 `pages/care/care-add/care-add` 路由 |
| `miniprogram/pages/home/home.wxml` | 修改 | 在 guide-links 之后新增「代铲屎遛狗」入口卡片 |
| `miniprogram/pages/home/home.js` | 修改 | 新增 `goToCare()` 跳转方法 |
| `miniprogram/pages/home/home.wxss` | 修改 | 新增入口卡片样式 |
| `miniprogram/utils/constants.js` | 修改 | 新增 `CARE_ROLE_TYPES`、`CARE_SERVICE_TYPES` 常量 |

---

## 10. 边界条件与异常处理

| 场景 | 处理方式 |
|---|---|
| 用户拒绝地理位置授权 | 展示授权提示弹窗，引导开启；拒绝后仍可发布帖子（无法显示距离，显示"--"） |
| 网络异常 | 加载失败时显示 retry 按钮 |
| 帖子被删除后有人申请联系 | 云函数校验 status，返回 `{ code: -1, message: '该帖子已关闭' }` |
| 发布时 location picker 失败 | 表单验证拦截，提示"请选择服务地点" |
| contactInfo 为空（历史数据） | 前端展示"发布者未填写联系方式" |
| 列表超过 20 条 | 支持上拉加载更多（分页参数 page） |
