# 清单页面 Figma 视觉重设计任务计划

- [x] Task 1: 重设计清单列表页卡片结构（checklist.wxml）
    - 1.1: 添加 "Categories" 标题行（含"新建"按钮）
    - 1.2: 将 `.checklist-card` 改为竖向布局，添加奇偶色彩 class（card-beige / card-teal）
    - 1.3: 卡片内部结构改为：图标圆形 → 标题 → 进度条 → 计数文字

- [x] Task 2: 更新清单列表页样式（checklist.wxss）
    - 2.1: 新增 `.categories-header` 标题行样式
    - 2.2: 重写 `.checklist-card` 为竖向大圆角（64rpx）彩色卡片
    - 2.3: 新增 `.card-beige`（米黄）和 `.card-teal`（薄荷绿）颜色变体
    - 2.4: 更新 `.card-icon`、`.card-title`、进度条、计数文字样式
    - 2.5: 移除不再使用的 `.card-left`、`.card-center`、`.card-right`、`.progress-percent`、`.arrow` 样式

- [x] Task 3: 重设计清单详情页结构（checklist-detail.wxml）
    - 3.1: 将 `.title-section` 和 `.items-section` 合并进一个大白卡（`.detail-card`）
    - 3.2: 标题区重构：加 category label 行（图标 + "清单"标签）、右侧显示进度百分比数字
    - 3.3: 进度条移至标题区下方，增大高度
    - 3.4: 清单项 `.item-card` 结构调整：checkbox 改为圆角方形，去掉 `.item-actions` 备注/删除行（改为长按删除）
    - 3.5: 将 `.add-section` 改为虚线 pill 按钮（dashed border，圆角 60rpx）
    - 3.6: 将 `.add-btn`（+ 按钮）改为 FAB 悬浮按钮（fixed 右下角，珊瑚色）

- [x] Task 4: 更新清单详情页样式（checklist-detail.wxss）
    - 4.1: 新增 `.detail-card` 大白卡样式（96rpx 圆角，珊瑚调阴影，右上角渐变）
    - 4.2: 重写 `.title-section` 内标题/标签/进度%样式
    - 4.3: 进度条样式加粗（24rpx 高度）
    - 4.4: `.item-card` 改为 pill（64rpx 圆角），已勾选态：灰背景 + 0.6 透明度；未勾选态：白底 + 渐变 + 边框
    - 4.5: `.item-checkbox` 改为圆角方形（12rpx）
    - 4.6: `.add-dashed` 虚线 pill 按钮样式
    - 4.7: `.detail-fab` FAB 按钮（fixed 右下角，珊瑚色 #FE9D7F）
    - 4.8: 清理不再使用的旧样式（.item-actions, .item-note, .item-delete, .add-input, .add-btn 等）
