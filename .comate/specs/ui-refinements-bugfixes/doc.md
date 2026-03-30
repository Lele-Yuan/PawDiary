# UI 精调与 Bug 修复

## 1. 导航栏颜色调整

**目标**：将自定义导航栏背景色从 `#E8875A` 改为 `rgba(254, 157, 127, 0.8)`，同时将 `app.json` 的原生导航栏背景色改为近似十六进制值 `#FE9D7F`。

**影响文件**：
- `miniprogram/components/nav-bar/nav-bar.wxss`：修改 `.nav-bar` 的 `background-color`
- `miniprogram/app.json`：修改 `window.navigationBarBackgroundColor`

---

## 2. 清单页面改造

### 2.1 详情内联展开（替代页面跳转）

**目标**：点击清单卡片时，不再跳转到 `checklist-detail` 页，而是在本页面中展开显示条目详情，再次点击则收起。

**技术方案**：
- `checklist.js` 中增加 `expandedId: null`，`goDetail` 改为 `toggleDetail`（同 id 则收起，否则展开）
- `checklists` 数据中已包含 `items` 字段，无需额外请求
- 将卡片布局从**横向 scroll-view** 改为**竖向列表**，每张卡片下方条件渲染展开内容区

**展开区域左侧边框**：
- 使用 `border-left: 12px solid <卡片同色系>` 区分不同清单
  - 米黄色清单：`#F5E6CC`
  - 薄荷绿清单：`#BEE3E7`

**影响文件**：
- `miniprogram/pages/checklist/checklist.js`：`expandedId` 数据字段、`toggleDetail` 方法替换 `goDetail`
- `miniprogram/pages/checklist/checklist.wxml`：改为竖向 `.cards-list`，卡片后追加展开面板
- `miniprogram/pages/checklist/checklist.wxss`：竖向卡片样式、`.detail-expand` 展开面板、左侧边框

### 2.2 添加按钮改为 FAB

**目标**：移除顶部操作栏中的「+ 新建清单」按钮，改为右下角悬浮的 `+` 按钮（使用全局 `.fab-btn` 样式）。

**影响文件**：
- `miniprogram/pages/checklist/checklist.wxml`：删除 `.top-actions` 的按钮，页面底部添加 `.fab-btn`
- `miniprogram/pages/checklist/checklist.wxss`：可保持顶部操作栏仅显示宠物名称标签

---

## 3. 首页宠物卡片修复

### 3.1 卡片圆角调整

**目标**：`.pet-card` 的 `border-radius` 从 `28rpx` 提升至 `48rpx`，与设计稿匹配。

**影响文件**：
- `miniprogram/pages/home/components/pet-card/pet-card.wxss`

### 3.2 右上角浅蓝渐变装饰圆

**目标**：在宠物卡片右上角添加浅蓝色（teal 色系）渐变圆形装饰背景，与其他页面卡片风格一致。

**实现**：在 `pet-card.wxml` 内最前面加入 `<view class="card-deco-circle"></view>`，使用绝对定位：
```css
.card-deco-circle {
  position: absolute;
  top: -60rpx;
  right: -60rpx;
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(190, 235, 231, 0.55) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
```

**影响文件**：
- `miniprogram/pages/home/components/pet-card/pet-card.wxml`
- `miniprogram/pages/home/components/pet-card/pet-card.wxss`

### 3.3 年龄显示错误 & 陪伴天数为 null

**根因分析**：
- 年龄错误：`calcAge(birthday)` 在 birthday 为 WeChat 云数据库 Date 对象时，`new Date(dateObj)` 正常工作，但如果 birthday 为字符串 `"YYYY-MM-DD"` 格式则因 UTC 解析造成时区偏差（差1天），导致月份计算出错。
- 陪伴天数 null：当 `daysBetween` 接收无效日期时返回 `NaN`，某些 WXML 版本将其渲染为空或异常值。需增加兜底为 0 的处理。

**修复方案**（`pet-card.js`）：
```js
observers: {
  'pet': function (pet) {
    if (pet && pet.name) {
      const age = calcAge(pet.birthday) || '';
      let companionDays = 0;
      if (pet.adoptDate) {
        const days = daysBetween(pet.adoptDate);
        companionDays = (typeof days === 'number' && !isNaN(days)) ? days : 0;
      }
      this.setData({ age, companionDays });
    }
  }
}
```

同时修复 `util.js` 中 `calcAge` 的日期字符串解析——使用 `split('-')` 按本地时间构建 Date，避免 UTC 偏移：
```js
const calcAge = (birthday) => {
  if (!birthday) return '';
  let birth;
  if (typeof birthday === 'string' && /^\d{4}-\d{2}-\d{2}/.test(birthday)) {
    const [y, m, d] = birthday.split('-');
    birth = new Date(+y, +m - 1, +d);
  } else {
    birth = new Date(birthday);
  }
  // ... 原有计算逻辑
};
```

**影响文件**：
- `miniprogram/pages/home/components/pet-card/pet-card.js`
- `miniprogram/utils/util.js`

---

## 4. 账单页面

### 4.1 总计卡片右上角渐变圆

**目标**：在 `.overview-card` 内右上角添加 `rgba(254, 157, 127, 0.2)` 颜色的渐变圆装饰，与账单页主题色呼应。

**实现**：在 `bill.wxml` 的 `.overview-card` 内加入 `<view class="overview-deco-circle"></view>`：
```css
.overview-deco-circle {
  position: absolute;
  top: -60rpx;
  right: -60rpx;
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(254, 157, 127, 0.2) 0%, transparent 70%);
  pointer-events: none;
}
```

**影响文件**：
- `miniprogram/pages/bill/bill.wxml`
- `miniprogram/pages/bill/bill.wxss`

### 4.2 账单条目交替背景色

**目标**：账单列表中条目背景色交替显示 `#F5F3F1`（奇数项）和 `#FFFFFF`（偶数项），移除原有的半透明渐变背景。

**实现**：在 `bill.wxml` 内层 `wx:for` 增加 `wx:for-index="billIdx"`，按 `billIdx % 2` 切换 class：
```xml
<view class="bill-item {{billIdx % 2 === 0 ? '' : 'bill-item-alt'}}" ...>
```
```css
.bill-item {
  background-color: #FFFFFF;
  /* 移除原渐变 */
}
.bill-item-alt {
  background-color: #F5F3F1;
}
```

**影响文件**：
- `miniprogram/pages/bill/bill.wxml`
- `miniprogram/pages/bill/bill.wxss`

---

## 5. 记录页面分类标签高度修复

**问题**：`.type-tabs`（分类筛选标签栏）高度远大于文字高度，原因是 `scroll-view` 的 `enable-flex` 使容器为 flex，`align-items` 默认为 `stretch`，导致子元素被拉伸。

**修复**：
```css
.type-tabs {
  align-items: center;  /* 新增 */
  /* ... 原有样式 */
}

.tab-item {
  display: inline-flex;  /* 改为 inline-flex 而非 inline-block */
  align-items: center;   /* 新增 */
  /* ... 原有样式 */
}
```

**影响文件**：
- `miniprogram/pages/record/record.wxss`

---

## 6. 我的页面设置模块去掉背景色

**目标**：`.settings-group` 去掉灰色背景 `#F5F3F1`，改为透明背景，使设置项直接呈现在页面背景色上。

```css
.settings-group {
  background-color: transparent;  /* 原来是 #F5F3F1 */
  /* ... 其余不变 */
}
```

**影响文件**：
- `miniprogram/pages/profile/profile.wxss`

---

## 边界条件

- 清单展开：若当前清单 `items` 为空数组，展开区域显示「暂无待办事项」空状态提示
- 陪伴天数：若 `adoptDate` 不存在或无效，显示 `0` 而非 null/NaN
- 年龄：若 `birthday` 不存在，不显示年龄行（`wx:if="{{age}}"` 已保证）
- 账单交替色：按每组内 billIdx 交替（每个日期分组重新从 0 开始），视觉上符合预期
