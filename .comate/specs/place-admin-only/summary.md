# 宠物友好地点管理员权限 总结

## 改动概览
将「宠物友好地点」(`pet_places`) 的新增/编辑/删除收敛为平台管理员专属能力，普通用户仅保留浏览。

## 实现细节

### 管理员识别
- 通过 `users.role === 'admin'` 字段识别。开发者在云开发控制台手动给指定 openid 加上该字段
- `users` 集合查询返回完整记录，`role` 字段自动透传至 `app.globalData.userInfo`

### 云端鉴权（硬约束）
`cloudfunctions/mapManage/index.js`：
- 新增 `requireAdmin(openid)` 工具函数
- `addPlace` / `updatePlace` / `deletePlace` 入口前置 `requireAdmin` 校验，非管理员返回 `{ code: -403, message: '仅管理员可操作' }`
- `updatePlace` / `deletePlace` 移除原"仅创建者"逻辑（`_openid` 比对），管理员可管理任意地点

### 前端入口隐藏（UX）
- `miniprogram/pages/map/map.js`：onShow 中读取 `globalData.userInfo.role` → `setData({ isAdmin })`
- `miniprogram/pages/map/map.wxml`：
  - 右下角 `+` FAB 包 `wx:if="{{isAdmin}}"`
  - empty-state 通过 `canEdit="{{isAdmin}}"` 控制按钮显隐，描述文案区分管理员/普通用户
- `miniprogram/pages/map/place-detail/place-detail.js`：onShow 注入 `isAdmin`
- `miniprogram/pages/map/place-detail/place-detail.wxml`：编辑/删除按钮容器 `wx:if` 由 `isOwner` 改为 `isAdmin`
- `miniprogram/pages/map/place-add/place-add.js`：onLoad 兜底鉴权，非管理员 Toast 后 `navigateBack`

## 部署与验证
1. 在微信开发者工具/云开发控制台**重新部署 `mapManage` 云函数**
2. 在云开发控制台 `users` 集合中给指定测试账号手动添加 `role: 'admin'` 字段
3. 真机回归：
   - 普通账号：地图页看不到 `+` 按钮，列表空态无按钮，详情页无编辑/删除按钮
   - 普通账号绕过前端直接调云函数 `addPlace/updatePlace/deletePlace` → 返回 -403
   - 管理员账号：完整入口可见，可正常增删改任意地点

## 影响范围
- 已存在的 `pet_places` 数据保持不动，普通用户既往创建的地点也将由管理员统一管理
- 内容安全 (msgSecCheck/imgSecCheck) 不受影响，管理员提交内容仍走审核
