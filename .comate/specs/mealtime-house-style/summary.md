# 来我家吃饭（mealtime）对齐整体视觉总结

## 完成情况

将来吃饭模块全部页面参照 `pages/splitpal/index` 与全局样式调整为 PawDiary 紫色品牌风格，4 个任务全部完成。改动仅涉及样式与导航结构，未触碰业务逻辑、数据与云函数。

## 主要改动

主题（核心）：重写 `pages/mealtime/mealtime-theme.wxss`，变量对齐全局品牌（主色 #7B5CF5、深 #5A3FE0、浅 #A48BFA、背景 #F6F3FF、文字 #1F1A3D、次要 #6B6585、边框 #ECE7F7），渐变改紫色、投影改 `rgba(123,92,245,*)`，标签/头像/chip/弹窗输入改紫色软底与软标签色。

页面样式：批量把上一轮的暖色硬编码值等价替换为紫色体系（#FBF1EC→#F8F5FF、#FDECE8→#EFEAFE、#FFFBF4→#F6F3FF、珊瑚投影→紫色投影、暖灰虚线/文本→紫灰，family 危险按钮改用全局危险色 #f97e54 + #FCE6EE）。

导航对齐（结构）：8 个页面统一接入自定义 `nav-bar` 组件，与首页/我的/记账分账一致。各 json 改 `navigationStyle: custom` 并引入 `/components/nav-bar/nav-bar`；各 wxml 顶部加 `<nav-bar title back titleOpacity>`；各 js 增 `navTitleOpacity` 与 `onPageScroll`（复用 splitpal 的滚动淡入写法）。family 标题随饭局名动态显示，dishEdit 标题按新增/编辑切换。

## 验证

8 个页面 js（含 utils）均通过 `node --check`；8 个 json 均合法且含 `navigationStyle:custom` 与 nav-bar 组件；8 个 wxml 均含 `<nav-bar>`；全模块无残留珊瑚/暖色硬编码值。运行态观感需在微信开发者工具中编译预览确认（自定义导航在真机/工具中查看状态栏与返回键）。

## 说明

样式仍通过各页 `@import mealtime-theme.wxss` 与全局 CSS 变量生效，不污染其它模块。功能性强调色（删除红、告警橙、点菜热度）保留语义。本次为纯视觉与导航结构对齐，无需重新部署云函数。
