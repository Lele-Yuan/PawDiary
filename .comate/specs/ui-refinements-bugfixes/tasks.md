# UI 精调与 Bug 修复任务计划

- [ ] Task 1: 导航栏颜色调整
    - 1.1: 修改 `nav-bar.wxss` 中 `.nav-bar` 的 `background-color` 为 `rgba(254, 157, 127, 0.8)`
    - 1.2: 修改 `app.json` 中 `window.navigationBarBackgroundColor` 为 `#FE9D7F`

- [ ] Task 2: 清单页面 — 竖向布局 + 内联展开
    - 2.1: 修改 `checklist.js`：添加 `expandedId: null` 字段，将 `goDetail` 改为 `toggleDetail`（同 id 则折叠，否则展开）
    - 2.2: 修改 `checklist.wxml`：将横向 `scroll-view.cards-scroll` 改为竖向 `.cards-list`，每张卡片后追加展开面板（含条目列表），展开面板根据奇偶 index 应用不同颜色的左侧边框
    - 2.3: 修改 `checklist.wxss`：更新卡片为全宽竖向布局，添加 `.detail-expand`、`.detail-border-beige`、`.detail-border-teal`、`.detail-item` 等展开区域样式

- [ ] Task 3: 清单页面 — 添加按钮改为 FAB
    - 3.1: 修改 `checklist.wxml`：移除顶部操作栏中的「+ 新建清单」按钮，在页面底部添加 `.fab-btn` 悬浮按钮（复用全局样式），`bindtap="showCreateOptions"`
    - 3.2: 修改 `checklist.wxss`：清理顶部 `.top-actions` 相关样式，确保 `.top-bar` 仅保留宠物名称标签

- [ ] Task 4: 首页宠物卡片 — 圆角 + 装饰圆 + Bug 修复
    - 4.1: 修改 `pet-card.wxss`：将 `.pet-card` 的 `border-radius` 从 `28rpx` 改为 `48rpx`；添加 `.card-deco-circle` 绝对定位浅蓝渐变圆样式
    - 4.2: 修改 `pet-card.wxml`：在 `.pet-card` 最前面插入 `<view class="card-deco-circle"></view>`
    - 4.3: 修改 `util.js`：优化 `calcAge` 函数，对 `YYYY-MM-DD` 字符串格式使用本地时间解析，避免 UTC 时区偏移导致年龄显示错误
    - 4.4: 修改 `pet-card.js`：在 observer 中为 `companionDays` 添加 NaN/null 兜底处理，确保显示 `0` 而非 null

- [ ] Task 5: 账单页面 — 装饰圆 + 交替背景色
    - 5.1: 修改 `bill.wxml`：在 `.overview-card` 内添加 `<view class="overview-deco-circle"></view>`；内层 `wx:for` 添加 `wx:for-index="billIdx"`，按奇偶切换 `bill-item-alt` class
    - 5.2: 修改 `bill.wxss`：添加 `.overview-deco-circle` 绝对定位渐变圆样式；将 `.bill-item` 背景改为纯白 `#FFFFFF`，添加 `.bill-item-alt { background-color: #F5F3F1; }`

- [ ] Task 6: 记录页面 — 分类标签高度修复
    - 6.1: 修改 `record.wxss`：为 `.type-tabs` 添加 `align-items: center`；将 `.tab-item` 的 `display` 从 `inline-block` 改为 `inline-flex`，并添加 `align-items: center`

- [ ] Task 7: 我的页面 — 设置模块去掉背景色
    - 7.1: 修改 `profile.wxss`：将 `.settings-group` 的 `background-color: #F5F3F1` 改为 `transparent`
