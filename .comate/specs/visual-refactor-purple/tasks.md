# 全局视觉重构 - 任务拆解

## Phase A：全局令牌与公共组件

- [x] Task 1: 重写全局设计令牌 app.wxss
    - 1.1: 替换 `:root` 中所有 CSS 变量为新紫色调色板
    - 1.2: 新增软色卡片背景变量（soft-purple/blue/pink/orange/green/yellow）
    - 1.3: 新增统一阴影/圆角令牌
    - 1.4: 增加通用工具类 `.card-base / .btn-primary / .btn-secondary / .soft-tag` 供各页复用

- [x] Task 2: 调整 app.json 系统配色
    - 2.1: `navigationBarBackgroundColor` 改为 `#7B5CF5`
    - 2.2: `tabBar.selectedColor` 改紫，`color` 调整为浅灰紫
    - 2.3: `backgroundColor` 改为 `#F6F3FF`

- [x] Task 3: 重构自定义 TabBar 为浮动胶囊
    - 3.1: 修改 `custom-tab-bar/index.wxss`：胶囊深紫背景、距底 32rpx、阴影、圆角 999rpx
    - 3.2: 调整 `custom-tab-bar/index.wxml` 结构（图标用白色，选中态高亮圆点/背景）
    - 3.3: 验证 5 个 tab 切换正常

- [x] Task 4: 公共组件配色
    - 4.1: `components/nav-bar`：背景透明、返回按钮改浅紫圆形、文字 `--text-color`
    - 4.2: `components/loading`：spinner 颜色切换为紫色
    - 4.3: `components/empty-state`：按钮与文字配色更新

## Phase B：主要页面深度适配

- [x] Task 5: 首页 home 重构
    - 5.1: 替换 `pages/home/home.wxss` 中所有暖色硬编码为紫色变量
    - 5.2: 重构 Header 区为紫色渐变大卡片（欢迎语 + 宠物头像/名称）
    - 5.3: 提醒/任务条目改用软投影白卡 + 左侧分类彩色标签 + 右侧状态圆点
    - 5.4: `home/components/pet-card/*` 渐变改紫色

- [x] Task 6: 清单 checklist 重构
    - 6.1: 任务条目改为白色软投影卡片，右侧加紫色实心/空心圆形完成态指示
    - 6.2: 分类标签使用软色背景 + 紫字
    - 6.3: 顶部统计/筛选区适配紫色

- [x] Task 7: 记录 record 重构
    - 7.1: 顶部宠物标签 + tab 筛选条配色
    - 7.2: 时间线节点 dot 改紫色（保留各类型 typeColor）
    - 7.3: 趋势入口胶囊改紫色变量
    - 7.4: 卡片软投影、提醒进度条紫色

- [x] Task 8: 趋势 record-trends 重构
    - 8.1: hero 卡片改紫色渐变
    - 8.2: range tab active 态改紫色，未选中态白底浅阴影
    - 8.3: 体重/食水折线主色改 `--primary-color`，数据点圆环描边紫色
    - 8.4: 健康异常热力图色阶用紫粉系
    - 8.5: 美容热力图保留原多色（已与参考图调性一致），仅微调容器/图例
    - 8.6: 图例样式与按钮统一

- [x] Task 9: 账单 bill 重构
    - 9.1: 总额卡片改为紫色渐变 hero
    - 9.2: 月份切换器 active 态紫色
    - 9.3: 分类条目使用软色背景 + 金额右对齐
    - 9.4: bill-stats 饼图配色切紫色阶

- [x] Task 10: 我的 profile 重构
    - 10.1: 顶部用户卡片紫色渐变
    - 10.2: 菜单分组卡片白底软投影
    - 10.3: 菜单项左侧 emoji/icon 容器使用软色圆形

## Phase C：清理与回归

- [x] Task 11: 全局硬编码暖色清理
    - 11.1: 全局 grep `#E8875A / #6B2D1A / #F5C4A8 / #f9d568 / #f0c6ae / #f9d568` 残留并替换为变量
    - 11.2: `nav-bar.wxss` 等组件最终回归

- [x] Task 12: 自测与生成 summary
    - 12.1: 5 个 tab 页面均加载正常、TabBar 浮动胶囊显示正常
    - 12.2: 趋势页 4 张图表配色统一
    - 12.3: 暗色文字在紫色 hero 上对比度足够
    - 12.4: 生成 summary.md
