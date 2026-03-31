# 完成总结：在记录和账单页面增加当前选中宠物标签

## 修改文件

### 记录页面 (record)
- **record.wxml**: 在 `<nav-bar>` 后插入 `.top-bar` > `.pet-tag` 结构，显示 `🐾 {{currentPetName}}`
- **record.wxss**: 添加 `.top-bar` 和 `.pet-tag` 样式，与清单页面完全一致
- **record.js**: data 中增加 `currentPetName`，在 `loadRecords` 方法中从全局状态或云数据库获取宠物名称

### 账单页面 (bill)
- **bill.wxml**: 在 `<nav-bar>` 后插入 `.top-bar` > `.pet-tag` 结构
- **bill.wxss**: 添加 `.top-bar` 和 `.pet-tag` 样式
- **bill.js**: data 中增加 `currentPetName`，在 `loadMonthData` 方法中加载宠物名称

## 样式规格
- 字号: 26rpx
- 文字色: #6B2D1A (深棕)
- 背景色: #F5EDD0 (米黄)
- 内边距: 8rpx 20rpx
- 圆角: 20rpx
- 前缀: 🐾 emoji

三个页面（清单、记录、账单）的宠物标签样式完全统一。
