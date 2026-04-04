# 纪念馆功能实现总结

## 完成情况

所有 5 个任务已全部完成。

---

## 新增文件清单

| 文件 | 说明 |
|---|---|
| `cloudfunctions/memorialManage/index.js` | 纪念馆云函数，含 5 个 action |
| `cloudfunctions/memorialManage/package.json` | 云函数依赖配置 |
| `miniprogram/pages/memorial/memorial.js` | 纪念馆主页逻辑 |
| `miniprogram/pages/memorial/memorial.wxml` | 纪念馆主页结构 |
| `miniprogram/pages/memorial/memorial.wxss` | 纪念馆主页样式 |
| `miniprogram/pages/memorial/memorial.json` | 纪念馆主页配置 |
| `miniprogram/pages/memorial/memorial-add/memorial-add.js` | 新增纪念宠物页逻辑 |
| `miniprogram/pages/memorial/memorial-add/memorial-add.wxml` | 新增纪念宠物页结构 |
| `miniprogram/pages/memorial/memorial-add/memorial-add.wxss` | 新增纪念宠物页样式 |
| `miniprogram/pages/memorial/memorial-add/memorial-add.json` | 新增纪念宠物页配置 |

## 修改文件清单

| 文件 | 改动内容 |
|---|---|
| `miniprogram/app.json` | 新增两条页面路由 |
| `miniprogram/pages/profile/profile.wxml` | 在「设置与支持」菜单中插入「纪念馆」入口 |
| `miniprogram/pages/profile/profile.js` | 新增 `goMemorial()` 跳转方法 |

---

## 数据库（需在云开发控制台手动创建集合）

- `memorial_pets` — 纪念宠物
- `memorial_blessings` — 祝福语

---

## 核心功能说明

### 我的纪念
- 展示自己添加的所有已逝宠物卡片（灰度头像 + 蜡烛角标）
- 点击「记录一位小天使」跳转填写页，支持上传照片、物种/性别/日期/寄语
- 头像上传至云存储 `memorial/` 路径

### 随机探访
- 进入 Tab 自动随机加载他人宠物卡片
- 展示宠物基本信息、主人昵称、离开日期、纪念寄语
- 展示最新 5 条祝福语
- 输入框最多 100 字，实时字数统计，≥90 字时计数变橙色警示
- 游客点击发送时提示先登录
- 每人对同一宠物只保留最新一条祝福（覆盖更新）
- 「换一位小天使」按钮维护 `excludedIds` 避免重复，全部展示完后自动重置

### 部署注意事项
1. 在微信云开发控制台上传并部署 `memorialManage` 云函数
2. 在数据库中创建 `memorial_pets` 和 `memorial_blessings` 两个集合，并配置安全规则（建议 `memorial_pets` 所有人可读，自己可写；`memorial_blessings` 所有人可读，登录用户可写）
