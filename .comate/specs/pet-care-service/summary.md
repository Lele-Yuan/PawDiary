# 代铲屎遛狗模块 — 实现总结

## 完成情况

所有 5 个任务均已完成。

---

## 新增/修改的文件清单

### 新增文件

| 文件 | 说明 |
|---|---|
| `cloudfunctions/careManage/index.js` | 云函数，7 个 action：publish / list / get / applyContact / update / delete / myPosts |
| `cloudfunctions/careManage/config.json` | 云函数环境配置 |
| `cloudfunctions/careManage/package.json` | 云函数依赖配置 |
| `miniprogram/pages/care/care.js` | 列表页逻辑：位置获取、筛选/排序、申请联系、上拉加载 |
| `miniprogram/pages/care/care.wxml` | 列表页模板：导航栏、筛选栏、帖子卡片、悬浮发布按钮 |
| `miniprogram/pages/care/care.wxss` | 列表页样式：卡片设计、role-badge、service-tag、contact-btn |
| `miniprogram/pages/care/care.json` | 列表页配置 |
| `miniprogram/pages/care/care-add/care-add.js` | 发布页逻辑：表单绑定、地点选择、验证、云函数调用 |
| `miniprogram/pages/care/care-add/care-add.wxml` | 发布页模板：角色卡片选择、服务类型、地点、半径slider、时间、联系方式 |
| `miniprogram/pages/care/care-add/care-add.wxss` | 发布页样式 |
| `miniprogram/pages/care/care-add/care-add.json` | 发布页配置 |

### 修改的文件

| 文件 | 改动内容 |
|---|---|
| `miniprogram/utils/constants.js` | 新增 CARE_ROLE_TYPES、CARE_SERVICE_TYPES、CARE_ROLE_MAP、CARE_SERVICE_MAP 常量 |
| `miniprogram/app.json` | 新增 `pages/care/care` 和 `pages/care/care-add/care-add` 路由 |
| `miniprogram/pages/home/home.wxml` | guide-links 之后新增「代铲屎遛狗」入口卡片 |
| `miniprogram/pages/home/home.wxss` | 新增 `.care-entry-wrap` 及相关入口卡片样式 |
| `miniprogram/pages/home/home.js` | 新增 `goToCare()` 方法 |

---

## 核心设计要点

### 数据安全
- `list` 接口服务端删除 `contactInfo` 和 `applicants` 字段，联系方式仅通过 `applyContact` 接口返回
- `applyContact` 服务端校验：帖子状态必须为 active、不能申请自己的帖子
- 申请记录幂等写入（同一 openid + postId 不重复插入）

### 视觉一致性
- 导航栏背景复用全局 `#f9d568`
- 卡片圆角、阴影、背景色与 `app.wxss` 中 `.card` 类保持一致
- 临时主使用 `#E8875A`（primary-color），需求方使用 `#8ECFC9`（teal-color）
- 列表入场动画复用 `fadeInUp`，骨架屏复用 `shimmer` 动画
- 首页入口卡片渐变色 `#FFF6EE → #FDE8D8`，与地图入口卡片风格统一

### 边界处理
- 拒绝地理位置授权时距离显示 `--`，功能不受影响
- 帖子列表支持 role / serviceType 双维度筛选 + 距离/最新 排序切换
- 上拉分页（pageSize=20），有更多数据时显示"上拉加载更多"提示
- 发布页表单提交防重（submitting 状态锁）

---

## 使用前提（云开发配置）

在微信云开发控制台需手动创建两个数据库集合：
1. `pet_care_posts` — 帖子主表
2. `pet_care_contacts` — 申请联系记录表

集合权限建议：
- `pet_care_posts`：所有用户可读，仅创建者可写
- `pet_care_contacts`：仅创建者可读写
