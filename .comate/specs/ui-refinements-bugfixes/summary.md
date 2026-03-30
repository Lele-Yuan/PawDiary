# UI 精调与 Bug 修复 — 完成总结

## 修改文件清单

| 文件 | 修改内容 |
|---|---|
| `components/nav-bar/nav-bar.wxss` | 导航栏背景色改为 `rgba(254, 157, 127, 0.8)` |
| `app.json` | 原生导航栏色改为 `#FE9D7F` |
| `pages/checklist/checklist.js` | 新增 `expandedId` 字段，`goDetail` 改为 `toggleDetail` |
| `pages/checklist/checklist.wxml` | 横向 scroll-view 改为竖向列表，内联展开面板，移除顶部按钮，添加 FAB |
| `pages/checklist/checklist.wxss` | 全量重写：竖向卡片、展开区域、左侧色块边框、FAB 适配 |
| `pages/home/components/pet-card/pet-card.wxml` | 插入 `.card-deco-circle` 装饰圆 |
| `pages/home/components/pet-card/pet-card.wxss` | 圆角 28rpx→48rpx，添加 `.card-deco-circle` 渐变圆样式 |
| `pages/home/components/pet-card/pet-card.js` | `companionDays` NaN/null 兜底处理，`calcAge` 返回值兜底 |
| `utils/util.js` | `calcAge` 修复：字符串日期按本地时间解析，防止 UTC 时区偏移 |
| `pages/bill/bill.wxml` | `overview-card` 内添加装饰圆，bill-item 内层 wx:for 增加 `billIdx` 交替 class |
| `pages/bill/bill.wxss` | 添加 `.overview-deco-circle`，`.bill-item` 改纯白，添加 `.bill-item-alt` |
| `pages/record/record.wxss` | `.type-tabs` 加 `align-items: center`，`.tab-item` 改 `inline-flex` |
| `pages/profile/profile.wxss` | `.settings-group` 背景色改为 `transparent` |

## 关键设计决策

**清单展开方式**：选择竖向列表 + 手风琴展开，而非保留横向滚动，原因是横向卡片无法自然容纳展开区域，竖向布局更适合移动端折叠交互。

**`calcAge` 时区修复**：对 `YYYY-MM-DD` 格式字符串使用 `split('-')` + `new Date(y, m-1, d)` 本地时间解析，避免 `new Date("YYYY-MM-DD")` 按 UTC 00:00 解析导致在 UTC+8 时区下日期提前一天的问题。

**账单交替色**：使用 `billIdx % 2`（每个日期分组内的索引），每组重新从 0 计数，视觉上整体交替效果符合预期，无需改动 JS 数据结构。
