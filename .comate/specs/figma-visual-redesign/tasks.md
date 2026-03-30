# 宠物管家小程序 Figma 视觉重设计任务计划

- [x] Task 1: 更新全局 CSS 变量与通用组件样式（app.wxss）
    - 1.1: 替换 CSS 变量：`--primary-color` 改为 `#E8875A`，`--primary-light` 改为 `#F5C4A8`，`--secondary-color` 改为 `#F5EDD0`，`--bg-color` 改为 `#F5F0E8`，`--text-color` 改为 `#2D2D2D`，`--text-secondary` 改为 `#888888`
    - 1.2: 新增 CSS 变量：`--primary-dark: #6B2D1A`、`--teal-color: #8ECFC9`、`--teal-light: #C5E8E2`、`--beige-color: #EDD9A3`、`--progress-color: #3D6B5E`
    - 1.3: 更新 `.btn-primary`：去掉渐变，改为实色 `background: #6B2D1A`，阴影同步更新为棕红色系
    - 1.4: 更新 `.btn-primary-hover` 与 `.btn-outline` 边框/颜色使用新变量
    - 1.5: 更新 `.fab-btn`：渐变橙 → 实色珊瑚 `#E8875A`，阴影同步
    - 1.6: 更新 `.progress-fill`：橙色渐变 → 实色 `#3D6B5E`
    - 1.7: 更新 `.tag-primary` 使用深棕红系（`rgba(107,45,26,0.1)` + `#6B2D1A`）

- [x] Task 2: 更新全局应用配置（app.json）
    - 2.1: `window.navigationBarBackgroundColor` 改为 `#E8875A`
    - 2.2: `window.navigationBarTextStyle` 改为 `white`
    - 2.3: `window.backgroundColor` 改为 `#F5F0E8`
    - 2.4: `tabBar.selectedColor` 改为 `#E8875A`
    - 2.5: `tabBar.borderStyle` 改为 `white`（避免深色边框与白色 tabBar 不协调）

- [x] Task 3: 更新自定义导航栏组件（nav-bar.wxss）
    - 3.1: `.nav-bar` 背景色：`#FFFFFF` → `#E8875A`，去除 `border-bottom`
    - 3.2: `.back-icon` 颜色：`#1A1A2E` → `#FFFFFF`
    - 3.3: `.nav-bar-title` 颜色：`#1A1A2E` → `#FFFFFF`

- [x] Task 4: 重构宠物信息卡片（pet-card.wxss）
    - 4.1: `.pet-card`：移除橙色阴影，改为中性阴影 `rgba(0,0,0,0.06)`
    - 4.2: `.card-bg`：移除橙色渐变，改为纯白 `background: #FFFFFF`
    - 4.3: `.card-content`：布局改为垂直居中 `flex-direction: column; align-items: center; text-align: center`
    - 4.4: `.pet-avatar`：尺寸 `140rpx` → `180rpx`，边框白色 → 改为深色背景圆形容器（`background: #1A1A1A; border-radius: 50%; padding: 8rpx`）
    - 4.5: `.pet-name`：颜色白色 → `#2D2D2D`，字号 `40rpx` → `64rpx`
    - 4.6: `.breed-tag` 改为普通文字样式（去除标签背景），颜色 `#888888`，显示"品种 • 年龄"
    - 4.7: `.stats-row`：半透明条 → 两个并排彩色 badge，中间留间距
        - 陪伴天数 badge：`background: #F9D5CC; color: #8B4035; border-radius: 32rpx; padding: 12rpx 28rpx`
        - 当前体重 badge：`background: #C5E8E2; color: #2D7066; border-radius: 32rpx; padding: 12rpx 28rpx`
    - 4.8: `.stat-value` / `.stat-label` 颜色跟随 badge 容器颜色（深棕/深绿）

- [x] Task 5: 更新首页样式（home.wxss）
    - 5.1: `.entry-grid`：改为 `display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx; padding: 0 4rpx`
    - 5.2: `.entry-item`：改为大圆角矩形 `border-radius: 24rpx; height: 180rpx; justify-content: center; gap: 16rpx`
    - 5.3: 新增 4 个入口颜色变体类：
        - `.entry-item-dark`：`background: #6B2D1A; color: #FFFFFF`（添加事件）
        - `.entry-item-teal`：`background: #8ECFC9; color: #2D2D2D`（新体重）
        - `.entry-item-beige`：`background: #EDD9A3; color: #2D2D2D`（记录喂食）
        - `.entry-item-gray`：`background: #EBEBEB; color: #2D2D2D`（拍照）
    - 5.4: `.entry-icon`：去除原背景色，尺寸/圆角由父容器控制
    - 5.5: `.entry-label`：颜色由父容器继承（`color: inherit`）
    - 5.6: `.section-more` 颜色：`#FF6B35` → `#E8875A`
    - 5.7: `.countdown-num` 颜色：`#FF6B35` → `#6B2D1A`

- [x] Task 6: 更新记录页样式（record.wxss）
    - 6.1: `.type-tabs` 背景：`#FFFFFF` → `#F5F0E8`（融入页面背景）
    - 6.2: `.tab-item` 非激活态：背景 `#F7F8FA` → `#F5EDD0`，颜色 → `#6B2D1A`
    - 6.3: `.tab-item.active`：背景从渐变橙 → 实色 `#6B2D1A`，去除渐变和彩色阴影
    - 6.4: `.timeline-line`：`#EEEEF2` → `#E0D8CC`（暖灰）
    - 6.5: `.card-next` 背景：`#FFF7E6` → `#F5EDD0`，`.next-label` 颜色 → `#6B2D1A`

- [x] Task 7: 更新账单页样式（bill.wxss）
    - 7.1: `.month-arrow` 颜色：`#FF6B35` → `#E8875A`
    - 7.2: `.currency` / `.amount-value` 颜色：`#FF6B35` → `#6B2D1A`
    - 7.3: `.bill-amount` 颜色：`#FF4757` → `#6B2D1A`
    - 7.4: `.bill-icon` 背景：`#FFF0E6` → `#F5EDD0`（暖米黄，统一不同分类图标容器）
    - 7.5: `.stats-link` 颜色：`#FF6B35` → `#E8875A`
    - 7.6: `.overview-compare` 背景/颜色同步更新到暖色系

- [x] Task 8: 更新清单页样式（checklist.wxss）
    - 8.1: `.pet-tag`：背景 `rgba(255,107,53,0.1)` → `#F5EDD0`，颜色 `#FF6B35` → `#6B2D1A`
    - 8.2: `.card-icon` 背景：`#FFF0E6` → `#F5EDD0`
    - 8.3: `.progress-percent` 颜色：`#FF6B35` → `#6B2D1A`
    - 8.4: `.progress-percent.done` 颜色：`#249654` → `#3D6B5E`（与进度条统一为森林绿）

- [x] Task 9: 更新个人中心样式（profile.wxss）
    - 9.1: `.user-avatar` 边框颜色：`#FF6B35` → `#E8875A`
    - 9.2: `.stats-value` 颜色：`#FF6B35` → `#6B2D1A`
    - 9.3: `.action-btn.edit` 背景/颜色：`rgba(255,107,53,0.1)` / `#FF6B35` → `rgba(107,45,26,0.1)` / `#6B2D1A`
    - 9.4: `.logout-btn` 颜色/边框：`#FF4757` → `#888888`（设计中退出按钮为低调灰色）

- [x] Task 10: 更新宠物切换器组件（pet-switcher.wxss）
    - 10.1: `.pet-switcher` 背景：`#FFFFFF` → `transparent`
    - 10.2: `.pet-item.active .pet-avatar` 边框：`#FF6B35` → `#E8875A`，阴影颜色同步
    - 10.3: `.pet-item.active .pet-name` 颜色：`#FF6B35` → `#E8875A`
