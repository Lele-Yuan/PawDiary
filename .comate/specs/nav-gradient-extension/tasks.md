# 导航栏渐变向下延伸至页面上部并渐隐任务清单

- [x] Task 1: nav-bar 组件新增渐变延伸层结构
    - 1.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/components/nav-bar/nav-bar.wxml`，在 `.nav-bar` 元素之后、`.nav-bar-placeholder` 之前插入固定定位的渐变延伸层 `<view class="nav-bar-gradient-ext" style="top: {{statusBarHeight + navBarHeight}}px;"></view>`

- [x] Task 2: nav-bar 组件添加渐变延伸层样式
    - 2.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/components/nav-bar/nav-bar.wxss`，新增 `.nav-bar-gradient-ext` 样式规则，使用 `position: fixed`、`height: 20vh`、从 `#A8C8FF` 渐隐至 `rgba(251,249,247,0)` 的向下渐变，并设置 `pointer-events: none` 与 `z-index: 999`

- [x] Task 3: app.wxss 页面主体背景设为透明
    - 3.1: 修改 `/Users/yuanlele/workspace/comate_error/miniprogram/app.wxss`，将 `page` 选择器的 `background-color: var(--bg-color)` 改为 `background-color: transparent`，让系统底色（`app.json` 中 `backgroundColor: #FBF9F7`）透出

- [x] Task 4: 回归检查
    - 4.1: 复查 `nav-bar.wxml`、`nav-bar.wxss`、`app.wxss` 三个文件内容，确认改动正确
    - 4.2: 运行 lint 检查，确认无报错
