# 记录/账单/我的 + 通用样式 四方向 Figma 重设计

- [x] Task 1: 通用样式调整
    - 1.1: `app.wxss` 中 `--bg-color` 改为 `#FBF9F7`
    - 1.2: `app.json` 中 `backgroundColor` 改为 `#FBF9F7`
    - 1.3: `custom-tab-bar/index.wxss` `.tab-bar` 新增 `border-radius: 96rpx 96rpx 0 0; overflow: hidden`

- [x] Task 2: 记录页 WXML 重构（record.wxml）
    - 2.1: 筛选栏下方添加 "健康时间线" 节标题
    - 2.2: `timeline-card` 内部替换为：左侧彩色图标圆 + 右侧内容区
    - 2.3: upcoming 卡片（有 nextDateStr）：加 "即将到来" 标签 + "立即完成" 按钮 + 🔔 图标
    - 2.4: completed 卡片：内容区显示 "已完成 · dateStr" 副文字

- [x] Task 3: 记录页 WXSS 更新（record.wxss）
    - 3.1: `timeline-card` 圆角 16rpx → 64rpx，白底 + 右上角渐变
    - 3.2: 新增 `.card-upcoming`（白底渐变）和 `.card-completed`（灰底 `#F5F3F1`）
    - 3.3: 新增 `.card-icon-circle`（彩色圆形图标底座，80rpx）
    - 3.4: 新增 `.complete-btn`（深棕红 pill 按钮）和 `.upcoming-tag`（珊瑚色标签）

- [x] Task 4: 账单页 WXML 重构（bill.wxml）
    - 4.1: overview 卡片：加右上角图标，金额改为整数+小数分拆布局，分类 bar 改为分段式单行色块，分类说明改为横排点+名称+百分比
    - 4.2: 概览卡右上角加 "查看月报 →" 链接（替换底部 stats-link）
    - 4.3: 账单条目 `bill-item`：图标从 emoji 方块改为彩色圆形，右侧加分类 tag pill
    - 4.4: 账单副标题改为 `dateStr · note` 格式

- [x] Task 5: 账单页 WXSS 更新（bill.wxss）
    - 5.1: `overview-card` 右上角渐变：`linear-gradient(135deg, #FFFFFF 60%, rgba(232,135,90,0.07) 100%)`
    - 5.2: 新增 `.overview-icon`（右上角 teal 圆形图标）
    - 5.3: 金额改版：`.amount-main`（大号）+ `.amount-cents`（小号对齐基线）
    - 5.4: 新增 `.segment-bar`（分段式横向色块容器）+ `.segment`（子段样式）
    - 5.5: 新增 `.category-legend`（分类说明横排）
    - 5.6: `bill-item` 圆角 16rpx → 32rpx，`bill-icon` 改为圆形（80rpx）
    - 5.7: 新增 `.bill-category-tag`（分类 pill 标签，使用分类颜色）

- [x] Task 6: 我的页面 WXML 重构（profile.wxml）
    - 6.1: user-card：头像改为 `border-radius: 48rpx` 方形，名字下加薄荷绿 "微信云已连接" badge
    - 6.2: 移除 `<pet-switcher>` 组件引用，改为内联 "我的毛孩子" 全卡片列表（遍历 pets）
    - 6.3: 宠物卡片：白底 `border-radius: 64rpx`，头像 + 名字 + 品种/年龄 + 编辑圆形按钮；当前选中宠物卡片用薄荷绿虚线描边
    - 6.4: 移除 `stats-card` 数字统计区
    - 6.5: 重写 menu-section 为 "Settings & Support" 分组灰底卡片，每行加彩色圆形图标
    - 6.6: 退出登录改为居中灰色 pill 按钮，按钮下加版本号文字

- [x] Task 7: 我的页面 WXSS 更新（profile.wxss）
    - 7.1: 用户头像 `.user-avatar` 圆角从 50% 改为 48rpx
    - 7.2: 新增 `.cloud-badge`（薄荷绿 pill）
    - 7.3: 新增 `.family-section`、`.family-header`、`.family-pet-card`、`.pet-card-selected`
    - 7.4: 删除 `.stats-card`、`.stats-item`、`.stats-value`、`.stats-divider` 样式
    - 7.5: 重写 `.menu-group` 为灰底圆角分组，每行 `.menu-item` 带彩色图标圆 `.menu-icon-circle`
    - 7.6: 新增 `.signout-pill`（灰色圆角按钮）和 `.version-text` 样式
