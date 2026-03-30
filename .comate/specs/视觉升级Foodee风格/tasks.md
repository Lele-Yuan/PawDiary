# 宠物管家视觉升级至 Foodee (Qori Dev) 风格

- [x] 任务 1：更新全局色彩体系与卡片/按钮/表单/进度条/骨架屏等全局样式（app.wxss）
    - 1.1: 替换 page 内所有 CSS 变量为新色值（--primary-color: #FF6B35, --primary-light: #FF9A6C, --secondary-color: #FFF0E6, --text-color: #1A1A2E, --text-secondary: #8E8EA0, --text-light: #B8B8C8, --bg-color: #F7F8FA, --border-color: #EEEEF2, --success-color: #249654, --warning-color: #F5A623, --danger-color: #FF4757, --info-color: #3C6663）
    - 1.2: 升级 .card（圆角 28rpx、padding 36rpx、margin 24rpx 28rpx、阴影 0 8rpx 32rpx rgba(0,0,0,0.04)）和 .card-sm（圆角 20rpx、padding 28rpx、margin 16rpx 28rpx、阴影 0 4rpx 20rpx rgba(0,0,0,0.03)）
    - 1.3: 升级 .btn-primary（渐变 background、圆角 48rpx、padding 24rpx 56rpx、font-weight 600、letter-spacing 2rpx、阴影）和 .btn-primary-hover
    - 1.4: 升级 .btn-outline（更新 rgba 引用色值）、.btn-outline-hover
    - 1.5: 升级 .fab-btn（渐变 background、尺寸 112rpx、阴影 0 12rpx 32rpx rgba(255,107,53,0.35)）
    - 1.6: 升级 .tag-primary（rgba 匹配新主色）
    - 1.7: 升级 .progress-fill 渐变色和 .skeleton 渐变色
    - 1.8: 升级表单 .form-input/.form-textarea/.form-picker 背景色为 #F7F8FA、圆角 20rpx、增加 border: 2rpx solid transparent

- [x] 任务 2：更新导航栏为纯白风格（app.json + nav-bar 组件）
    - 2.1: 修改 app.json 中 window.navigationBarBackgroundColor 为 #FFFFFF、navigationBarTextStyle 为 black
    - 2.2: 修改 nav-bar.wxss 背景色为 #FFFFFF、标题和返回箭头颜色为 #1A1A2E、添加底部 border-bottom: 1rpx solid rgba(0,0,0,0.06)

- [x] 任务 3：升级首页样式（home.wxss + pet-card.wxss）
    - 3.1: pet-card.wxss 中更新渐变色为新品牌色、阴影为 0 12rpx 36rpx rgba(255,107,53,0.2)、圆角 28rpx
    - 3.2: home.wxss 中更新 .entry-icon 背景色为 #FFF0E6 圆角 28rpx，.section-more/.countdown-num 硬编码色替换为新主色 #FF6B35

- [x] 任务 4：升级清单页样式（checklist.wxss + checklist-detail.wxss）
    - 4.1: checklist.wxss 中 .pet-tag 色值、.progress-percent 色值、.card-icon 背景色替换
    - 4.2: checklist-detail.wxss 中 .add-btn 背景色替换为新主色

- [x] 任务 5：升级记录页样式（record.wxss + record-add.wxss）
    - 5.1: record.wxss 中 .tab-item.active 背景改为渐变并加阴影
    - 5.2: record-add.wxss 中 .type-item.active 的 rgba 色值和 border-color 替换

- [x] 任务 6：升级账单页样式（bill.wxss + bill-add.wxss + bill-stats.wxss）
    - 6.1: bill.wxss 中 .month-arrow/.currency/.amount-value/.stats-link/.bill-icon 背景色等硬编码色替换
    - 6.2: bill-add.wxss 中 .amount-currency/.category-item.active 色值替换
    - 6.3: bill-stats.wxss 中 .period-tab.active/.total-currency/.total-value/.rank-index/.trend-bar-inner 等色值替换

- [x] 任务 7：升级个人中心与宠物编辑页样式（profile.wxss + pet-edit.wxss）
    - 7.1: profile.wxss 中 .user-avatar border-color、.stats-value、.action-btn.edit 色值替换
    - 7.2: pet-edit.wxss 中 .avatar-preview border-color/box-shadow、.species-item.active/.gender-item.active 色值、.avatar-tip 色值替换

- [x] 任务 8：升级宠物切换器与空状态组件样式（pet-switcher.wxss + empty-state.wxss）
    - 8.1: pet-switcher.wxss 中 .pet-item.active 的 border-color/box-shadow/文字颜色替换
    - 8.2: empty-state.wxss 中 .empty-icon-wrap 背景色改为 #F7F8FA

- [x] 任务 9：全局扫描残留旧色值 #FF8C69/#FFB094/#FFE4B5/#FFF5F0 并替换，确保一致性
    - 9.1: 使用 search_files 扫描 miniprogram/ 目录下所有 .wxss 文件中残留的旧色值
    - 9.2: 逐一确认并替换遗漏项
    - 9.3: 检查 constants.js 中的 BILL_CATEGORY_COLORS 中 food 色值替换为新主色
