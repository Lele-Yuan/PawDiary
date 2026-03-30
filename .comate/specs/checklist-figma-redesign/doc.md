# 清单页面 Figma 视觉重设计

## 1. 需求背景

参照 Figma 设计稿（Section - Active Checklist Detail: Hiking with Dog）对清单列表页和清单详情页进行视觉调整。用户特别指出当前实现与 Figma 主要有两点差距：
1. **圆角弧度不够大** — Figma 中卡片和列表项圆角为 32-48px（小程序 64-96rpx）
2. **白色背景卡片右上角缺少渐变色** — Figma 白色卡片右上角有暖橘/珊瑚色渐变装饰

---

## 2. 设计稿分析

### 2.1 清单列表页（checklist.wxml）

**Figma 设计：**
- 顶部 "Categories" 标题 + "View all" 链接
- 彩色分类卡片（横向滚动）：
  - 暖米黄卡片 `#F5E6CC`：图标（白色圆形）+ 标题 + 进度条 + "X/10 Ready"
  - 薄荷绿卡片 `#BEEAE7`：同上，颜色系为深绿 `#2E5956`
  - 大圆角：`border-radius: 64rpx`

**当前实现：** 白色卡片 + 小圆角（28rpx），横向布局（图标左 + 内容中 + 百分比右）

**变更方案：**
- 将 `.checklist-card` 改为彩色竖向卡片布局（icon 圆形 → 标题 → 进度条 → 计数）
- 奇数卡片用米黄色 `#F5E6CC`，偶数卡片用薄荷绿 `#BEE3E7`
- `border-radius: 64rpx`
- 标题颜色对应卡片主色

### 2.2 清单详情页（checklist-detail.wxml）

**Figma 设计：**

主白色卡片：
- `border-radius: 96rpx`
- `box-shadow: 0 40rpx 80rpx rgba(149, 73, 49, 0.06)` 珊瑚色调阴影
- 右上角渐变：`background: linear-gradient(135deg, #FFFFFF 65%, rgba(232, 135, 90, 0.08) 100%)`

标题区：
- 顶部小标签："ACTIVE ADVENTURE" 带小图标（使用清单 icon + 类型文字）
- 标题大字体（60rpx）加粗
- 右侧显示进度百分比（大号数字）

进度条：
- 加粗至 24rpx 高度，`#EFEEEb` 背景，`#3C6663` 填充

清单项（pill shape）：
- 已勾选：`border-radius: 64rpx`，背景 `#F5F3F1`，整体 `opacity: 0.6`，strikethrough 文字，勾选框为深绿实心圆角方形（12rpx）
- 未勾选：`border-radius: 64rpx`，白色背景，`rgba(60,102,99,0.2)` 边框，`0 2rpx 4rpx rgba(0,0,0,0.05)` 阴影，右上角渐变色

添加新项：
- 虚线圆角边框（pill shape），`border-radius: 60rpx`，灰色虚线 `rgba(177,178,176,1)`

FAB 按钮：
- 改为悬浮按钮（fixed 右下角），珊瑚色 `#FE9D7F`，含 + 号

---

## 3. 受影响文件

| 文件 | 修改类型 | 核心变更 |
|------|---------|---------|
| `miniprogram/pages/checklist/checklist.wxml` | 改结构 | 卡片改为竖向彩色布局，加 Categories 标题 |
| `miniprogram/pages/checklist/checklist.wxss` | 改样式 | 卡片大圆角、彩色变体、移除旧 card-right 样式 |
| `miniprogram/pages/checklist/checklist-detail/checklist-detail.wxml` | 改结构 | 大白卡容器、标题区加进度%、items 改 pill、add-item 改虚线 pill、加 FAB |
| `miniprogram/pages/checklist/checklist-detail/checklist-detail.wxss` | 改样式 | 大圆角卡片 + 右上角渐变、item pill 样式、FAB 样式 |

---

## 4. 实现细节

### 4.1 白色卡片右上角渐变

使用 CSS 渐变背景实现，覆盖整个卡片（不使用伪元素，小程序中伪元素支持有限）：

```css
/* 详情主卡片 */
.detail-card {
  background: linear-gradient(135deg, #FFFFFF 65%, rgba(232, 135, 90, 0.07) 100%);
  border-radius: 96rpx;
  box-shadow: 0 40rpx 80rpx rgba(149, 73, 49, 0.06);
}

/* 未勾选清单项 */
.item-card {
  background: linear-gradient(135deg, #FFFFFF 60%, rgba(232, 135, 90, 0.06) 100%);
  border: 2rpx solid rgba(60, 102, 99, 0.2);
}
```

### 4.2 清单列表彩色卡片

按奇偶索引切换颜色，通过 `wx:if` 和 `index % 2` 选色：

```wxml
<view class="checklist-card {{index % 2 === 0 ? 'card-beige' : 'card-teal'}}" ...>
```

### 4.3 大圆角清单项（pill）

```css
.item-card {
  border-radius: 64rpx;
  padding: 24rpx 32rpx;
  min-height: 112rpx;
}
```

---

## 5. 边界条件

- 长标题：`.item-name` 设 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` 防止换行撑开 pill
- 多行项目（如 "Water bowl (Collapsible)"）：item 高度自适应，pill 形状用 `border-radius: 32rpx` 兼顾换行场景
- 无清单时：`empty-state` 组件不受影响，保持原有展示
