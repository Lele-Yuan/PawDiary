# 我的毛孩子模块显示创建和加入的宠物 - 完成总结

## 问题

加入其他用户的宠物家庭后，"我的毛孩子"列表和首页均不显示加入的宠物。原因是客户端直接查 `pets` 集合受微信云数据库权限限制，只能获取自己创建的文档。

## 修改内容

### 1. cloudfunctions/petManage/index.js
- 改造 `listPets` 函数：查询自己创建的宠物 + 通过 `pet_members` 获取加入的宠物，合并返回
- 每个宠物对象附带 `role` 字段（`creator` / `admin` / `member`）
- 自动补建缺失的 `creator` 成员记录

### 2. miniprogram/pages/profile/profile.js
- `loadPets()` 和 `goMyPets()` 改为调用 `petManage` 云函数的 `list` action，替代客户端直接查库

### 3. miniprogram/pages/profile/profile.wxml
- 宠物卡片名字旁添加角色标签，`member` 角色显示"已加入"标签

### 4. miniprogram/pages/profile/profile.wxss
- 新增 `.pet-card-name-row`、`.pet-role-tag`、`.pet-role-joined` 样式

### 5. miniprogram/pages/home/home.js
- `loadData()` 改为调用 `petManage` 云函数的 `list` action，替代原有的多步客户端查库逻辑
- 从云函数返回的 `role` 字段构建 `memberRoleMap`，保留角色判断和权限逻辑

## 效果

- "我的毛孩子"列表同时显示用户创建的和加入的宠物
- 加入的宠物名字旁显示"已加入"标签以区分
- 首页也能正确加载和切换加入的宠物
