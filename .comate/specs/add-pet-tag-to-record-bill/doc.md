# 在记录和账单页面增加当前选中宠物模块

## 需求场景

清单页面（checklist）左上角已有一个显示当前选中宠物名称的 `.pet-tag` 标签，样式为米黄底色 + 深棕文字 + 圆角药丸形。需要在记录页面（record）和账单页面（bill）的顶部同样增加这个"当前选中宠物"模块，样式与清单页面保持一致。

## 参考样式（清单页面）

WXML 结构：
```xml
<view class="top-bar">
  <view class="current-pet" wx:if="{{currentPetName}}">
    <text class="pet-tag">🐾 {{currentPetName}}</text>
  </view>
</view>
```

WXSS 样式：
```css
.top-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 24rpx 32rpx 8rpx;
}
.pet-tag {
  font-size: 26rpx;
  color: #6B2D1A;
  background-color: #F5EDD0;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}
```

JS 逻辑：从 `getApp().globalData.currentPet.name` 获取宠物名，回退到云数据库查询。

## 技术方案

在记录页面和账单页面中，分别添加相同的顶部栏结构、样式和数据加载逻辑。

### 影响文件

| 文件 | 修改类型 | 说明 |
|---|---|---|
| `miniprogram/pages/record/record.wxml` | 修改 | 在 `<nav-bar>` 后插入 `.top-bar` + `.pet-tag` 结构 |
| `miniprogram/pages/record/record.wxss` | 修改 | 添加 `.top-bar` 和 `.pet-tag` 样式 |
| `miniprogram/pages/record/record.js` | 修改 | data 中增加 `currentPetName`，`onShow` 中加载宠物名称 |
| `miniprogram/pages/bill/bill.wxml` | 修改 | 在 `<nav-bar>` 后插入 `.top-bar` + `.pet-tag` 结构 |
| `miniprogram/pages/bill/bill.wxss` | 修改 | 添加 `.top-bar` 和 `.pet-tag` 样式 |
| `miniprogram/pages/bill/bill.js` | 修改 | data 中增加 `currentPetName`，`onShow` 中加载宠物名称 |

### 实现细节

#### 1. WXML 修改（record 和 bill 相同）

在 `<nav-bar>` 标签后插入：
```xml
<!-- 当前宠物 -->
<view class="top-bar">
  <view class="current-pet" wx:if="{{currentPetName}}">
    <text class="pet-tag">🐾 {{currentPetName}}</text>
  </view>
</view>
```

#### 2. WXSS 修改（record 和 bill 相同）

添加与清单页面完全一致的样式：
```css
/* ===== 顶部宠物标签 ===== */
.top-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 24rpx 32rpx 8rpx;
}

.pet-tag {
  font-size: 26rpx;
  color: #6B2D1A;
  background-color: #F5EDD0;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}
```

#### 3. JS 修改

在 `data` 中增加 `currentPetName: ''`。

在数据加载方法（record 的 `loadRecords`、bill 的 `loadMonthData`）开头加入宠物名获取逻辑：
```js
// 获取当前宠物名称
if (app.globalData.currentPet) {
  this.setData({ currentPetName: app.globalData.currentPet.name });
} else if (petId) {
  try {
    const db = wx.cloud.database();
    const { data: pet } = await db.collection('pets').doc(petId).get();
    this.setData({ currentPetName: pet.name || '' });
  } catch (e) {
    console.error('获取宠物名称失败', e);
  }
}
```

## 边界条件

- 当没有选中宠物时（`currentPetName` 为空），`wx:if` 条件使标签不显示
- 宠物名称从全局状态优先读取，避免不必要的数据库请求
- 切换宠物后回到页面，`onShow` 会重新加载数据并更新宠物名
