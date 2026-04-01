# 邀请页面加载其他用户宠物信息失败修复 - 完成总结

## 问题

打开其他用户宠物的邀请页面时，控制台报错 `document.get:fail cannot find document`，原因是客户端直接查库受微信云数据库权限规则限制，非创建者无法读取他人的宠物文档。

## 修改内容

### 1. cloudfunctions/petManage/index.js
- switch 中新增 `case 'get'` 分支
- 新增 `getPet(openid, data)` 函数，以管理员权限按 `_id` 获取宠物文档，不受客户端权限限制

### 2. miniprogram/pages/invite/invite.js
- `loadPetInfo` 方法中，将 `db.collection('pets').doc(petId).get()` 替换为 `wx.cloud.callFunction({ name: 'petManage', data: { action: 'get', data: { _id: petId } } })`
- 适配云函数返回值结构提取 pet 数据
- 保留 `db` 变量供后续查询 `pet_members` 和 `pets`（查当前用户自身数据，无权限问题）

## 修复效果

任意用户打开其他用户宠物的邀请链接时，能正常加载并显示宠物信息页面。
