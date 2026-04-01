# 修复邀请页面加载其他用户宠物信息权限问题

- [x] Task 1: 在 petManage 云函数中新增 `get` action
    - 1.1: 在 switch 语句中新增 `case 'get'` 分支
    - 1.2: 新增 `getPet(openid, data)` 函数，通过管理员权限按 `_id` 获取宠物文档

- [x] Task 2: 修改邀请页面 `loadPetInfo` 方法，改用云函数获取宠物信息
    - 2.1: 将 `db.collection('pets').doc(petId).get()` 替换为 `wx.cloud.callFunction` 调用 `petManage` 的 `get` action
    - 2.2: 适配云函数返回值结构，正确提取 pet 数据
    - 2.3: 移除不再需要的 `db` 变量声明
