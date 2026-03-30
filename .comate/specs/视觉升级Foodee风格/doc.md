# 宠物管家视觉升级 — Foodee (Qori Dev) 风格

## 需求背景
参照 Figma 社区 Foodee Mobile App Interface (Qori Dev) 的设计语言，对宠物管家小程序进行全面视觉调整。Foodee 设计风格核心特征：现代极简、暖橙色主色调更鲜明饱满、纯白导航栏、大圆角卡片、柔和阴影、慷慨留白、渐变强调元素、精致的视觉层次。

---

## 一、全局色彩体系升级

### 1.1 色彩方案调整
| 变量 | 旧值 | 新值 | 说明 |
|------|------|------|------|
| --primary-color | #FF8C69 | #FF6B35 | 更鲜艳饱满的暖橙色 |
| --primary-light | #FFB094 | #FF9A6C | 浅橙色 |
| --primary-gradient | 无 | linear-gradient(135deg, #FF6B35, #FF9A6C) | 品牌渐变 |
| --secondary-color | #FFE4B5 | #FFF0E6 | 更淡雅的辅助色 |
| --text-color | #333333 | #1A1A2E | 更深更沉稳的文字色 |
| --text-secondary | #999999 | #8E8EA0 | 柔和的次要文字色 |
| --text-light | #CCCCCC | #B8B8C8 | 浅色文字 |
| --bg-color | #F5F5F5 | #F7F8FA | 更冷调的浅灰背景 |
| --card-bg | #FFFFFF | #FFFFFF | 保持白色卡片 |
| --border-color | #EEEEEE | #EEEEF2 | 更柔和的分割线 |
| --success-color | #4CAF50 | #249654 | 更清新的绿色 |
| --warning-color | #FF9800 | #F5A623 | 柔和的警告色 |
| --danger-color | #F44336 | #FF4757 | 更现代的红色 |
| --info-color | #2196F3 | #3C6663 | 更明亮的蓝色 |

### 1.2 影响文件
- `miniprogram/app.wxss` — CSS 变量定义区

---

## 二、导航栏改为纯白风格

### 2.1 设计方案
将导航栏从实色橙底白字改为**纯白背景 + 深色文字 + 底部细线分割**，更现代清爽。

### 2.2 具体变更
- 导航栏背景色：`#FFFFFF`
- 标题文字色：`#1A1A2E`
- 返回箭头色：`#1A1A2E`
- 底部分割线：`1rpx solid rgba(0,0,0,0.06)`

### 2.3 影响文件
- `miniprogram/app.json` — `window.navigationBarBackgroundColor` 改为 `#FFFFFF`，`navigationBarTextStyle` 改为 `black`
- `miniprogram/components/nav-bar/nav-bar.wxss` — 背景色、文字色、添加底部边框

---

## 三、全局卡片样式升级

### 3.1 设计方案
增大圆角、更柔和阴影、增加内边距，营造更舒适的视觉层次。

### 3.2 具体变更
```css
.card {
  border-radius: 28rpx;          /* 旧: 24rpx */
  padding: 36rpx;                /* 旧: 32rpx */
  margin: 24rpx 28rpx;           /* 旧: 20rpx 24rpx */
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.04);  /* 更柔和更大 */
}

.card-sm {
  border-radius: 20rpx;          /* 旧: 16rpx */
  padding: 28rpx;                /* 旧: 24rpx */
  margin: 16rpx 28rpx;           /* 旧: 12rpx 24rpx */
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
}
```

### 3.3 影响文件
- `miniprogram/app.wxss` — `.card` 和 `.card-sm` 类

---

## 四、按钮样式升级

### 4.1 设计方案
主按钮使用品牌渐变色，增大圆角，添加微妙阴影提升层次感。

### 4.2 具体变更
```css
.btn-primary {
  background: linear-gradient(135deg, #FF6B35, #FF9A6C);
  border-radius: 48rpx;
  padding: 24rpx 56rpx;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.3);
}

.fab-btn {
  background: linear-gradient(135deg, #FF6B35, #FF9A6C);
  box-shadow: 0 12rpx 32rpx rgba(255, 107, 53, 0.35);
  width: 112rpx;
  height: 112rpx;
}
```

### 4.3 影响文件
- `miniprogram/app.wxss` — `.btn-primary`、`.btn-outline`、`.fab-btn` 等

---

## 五、表单输入框升级

### 5.1 设计方案
输入框背景色更淡，增大内边距和圆角，增加聚焦感。

### 5.2 具体变更
```css
.form-input, .form-textarea, .form-picker {
  background-color: #F7F8FA;
  border-radius: 20rpx;
  border: 2rpx solid transparent;
  transition: border-color 0.3s ease;
}
```

### 5.3 影响文件
- `miniprogram/app.wxss` — 表单相关类

---

## 六、首页宠物卡片升级

### 6.1 设计方案
渐变色使用新的品牌渐变，增大圆角和阴影，更精致的玻璃质感。

### 6.2 具体变更
- 渐变更新为 `linear-gradient(135deg, #FF6B35 0%, #FF9A6C 50%, #FFF0E6 100%)`
- 阴影更新为 `0 12rpx 36rpx rgba(255, 107, 53, 0.2)`
- 圆角更新为 `28rpx`

### 6.3 影响文件
- `miniprogram/pages/home/components/pet-card/pet-card.wxss` — 整体卡片样式

---

## 七、首页快捷入口图标升级

### 7.1 设计方案
图标背景使用新的品牌浅色，增加hover微交互。

### 7.2 具体变更
- 图标背景色：`#FFF0E6`（旧 `#FFF5F0`）
- 圆角：`28rpx`（旧 `24rpx`）

### 7.3 影响文件
- `miniprogram/pages/home/home.wxss` — `.entry-icon`

---

## 八、标签筛选栏升级

### 8.1 设计方案
活跃标签使用渐变色填充。

### 8.2 具体变更
```css
.tab-item.active {
  background: linear-gradient(135deg, #FF6B35, #FF9A6C);
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 53, 0.25);
}
```

### 8.3 影响文件
- `miniprogram/pages/record/record.wxss` — `.tab-item.active`

---

## 九、账单页样式升级

### 9.1 设计方案
月份选择器箭头、金额数字、统计链接等使用新主色调。

### 9.2 影响文件
- `miniprogram/pages/bill/bill.wxss` — 多处硬编码的 `#FF8C69`
- `miniprogram/pages/bill/bill-add/bill-add.wxss` — 金额输入区颜色
- `miniprogram/pages/bill/bill-stats/bill-stats.wxss` — 统计页颜色

---

## 十、清单页与详情页升级

### 10.1 设计方案
清单进度百分比、新建按钮等使用新品牌色。

### 10.2 影响文件
- `miniprogram/pages/checklist/checklist.wxss` — `.pet-tag`、`.progress-percent`
- `miniprogram/pages/checklist/checklist-detail/checklist-detail.wxss` — `.add-btn`

---

## 十一、个人中心页升级

### 11.1 设计方案
头像边框、统计数值使用新品牌色。

### 11.2 影响文件
- `miniprogram/pages/profile/profile.wxss` — `.user-avatar`、`.stats-value`、`.action-btn.edit`

---

## 十二、宠物编辑/记录添加/账单添加表单页升级

### 12.1 设计方案
选中状态的选择器使用新品牌色。

### 12.2 影响文件
- `miniprogram/pages/pet-edit/pet-edit.wxss` — `.species-item.active`、`.gender-item.active`、`.avatar-preview`
- `miniprogram/pages/record/record-add/record-add.wxss` — `.type-item.active`
- `miniprogram/pages/bill/bill-add/bill-add.wxss` — `.category-item.active`

---

## 十三、宠物切换器组件升级

### 13.1 设计方案
选中宠物的边框和阴影使用新品牌色。

### 13.2 影响文件
- `miniprogram/components/pet-switcher/pet-switcher.wxss` — `.pet-item.active`

---

## 十四、空状态组件升级

### 14.1 设计方案
空状态图标背景使用更柔和的浅色。

### 14.2 影响文件
- `miniprogram/components/empty-state/empty-state.wxss` — `.empty-icon-wrap`

---

## 十五、进度条与骨架屏升级

### 15.1 设计方案
进度条渐变使用新品牌色。

### 15.2 影响文件
- `miniprogram/app.wxss` — `.progress-fill`、`.skeleton`

---

## 预期成果
- 整体视觉从柔和暖橙色调升级为更鲜艳现代的 Foodee 风格
- 导航栏改为纯白风格，更清爽透亮
- 卡片更圆润、阴影更柔和，层次感更强
- 按钮渐变效果增加品牌辨识度
- 所有硬编码的旧主色 `#FF8C69` 统一替换为新主色 `#FF6B35`
- 整体间距更慷慨，阅读体验更舒适