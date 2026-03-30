# 首页移除宠物切换器 & 迁移至个人中心

- [x] Task 1: 首页移除 pet-switcher 组件
    - 1.1: 删除 `home.wxml` 中的 `<pet-switcher>` 组件块（含注释共5行）

- [x] Task 2: 个人中心注册 pet-switcher 组件
    - 2.1: 更新 `profile.json`，在 `usingComponents` 中添加 pet-switcher 路径

- [x] Task 3: 个人中心 JS 新增宠物数据与切换逻辑
    - 3.1: `data` 中新增 `pets: []` 和 `currentPetId: ''`
    - 3.2: 新增 `loadPets()` 方法，从数据库读取宠物列表并同步 `globalData.currentPetId`
    - 3.3: 新增 `onSwitchPet(e)` 方法，更新 `currentPetId` 并同步 `globalData`
    - 3.4: 新增 `onEditPet(e)` 方法，跳转宠物编辑页
    - 3.5: 在 `onShow` 中调用 `loadPets()`

- [x] Task 4: 个人中心 WXML 插入 pet-switcher 组件
    - 4.1: 在 `user-card` 之后、`stats-card` 之前插入 `<pet-switcher>` 组件，绑定 switch 和 edit 事件
