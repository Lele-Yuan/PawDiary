# 首页重构 & 宠物切换器迁移 — 完成总结

## 变更概览

| 文件 | 操作 | 说明 |
|------|------|------|
| `miniprogram/pages/home/home.wxml` | 删除 | 移除顶部 `<pet-switcher>` 组件块 |
| `miniprogram/pages/profile/profile.json` | 修改 | 注册 pet-switcher usingComponents |
| `miniprogram/pages/profile/profile.js` | 修改 | 新增 `currentPetId`、`loadPets()`、`onSwitchPet()`、`onEditPet()` |
| `miniprogram/pages/profile/profile.wxml` | 修改 | user-card 后插入 `<pet-switcher>` 组件 |

## 数据流

- profile `onShow` → `loadPets()` 从 DB 读取宠物列表，与 `globalData.currentPetId` 同步
- 用户在 profile 页切换宠物 → `onSwitchPet()` 更新 `globalData.currentPetId`
- 用户切换到首页 → `onShow` → `loadData()` 读取 `globalData.currentPetId`，pet-card 自动展示正确宠物

## 边界处理

- 无宠物时 pet-switcher 不渲染（`wx:if="{{pets.length}}"`）
- `loadPets()` 若 globalData 中无有效 currentPetId，自动回退到第一只宠物
