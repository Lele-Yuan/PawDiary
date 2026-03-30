# 导航栏渐变向下延伸至页面上部并渐隐总结

## 完成内容

### Task 1 & 2 — nav-bar 组件新增渐变延伸层
- `components/nav-bar/nav-bar.wxml`：在 `.nav-bar` 与 `.nav-bar-placeholder` 之间插入渐变延伸层，顶部位置通过 `style="top: {{statusBarHeight + navBarHeight}}px;"` 动态贴紧导航底边
- `components/nav-bar/nav-bar.wxss`：新增 `.nav-bar-gradient-ext` 样式
  - `position: fixed` — 不随页面内容滚动
  - `height: 20vh` — 延伸至屏幕高度的 20%
  - `background: linear-gradient(to bottom, #A8C8FF 0%, rgba(251,249,247,0) 100%)` — 从导航蓝渐隐至全透明
  - `pointer-events: none` — 不拦截任何点击/滑动事件
  - `z-index: 999` — 在导航层（1000）之下，覆盖在页面内容之上

### Task 3 — app.wxss 页面背景设为透明
- `app.wxss`：将 `page` 选择器的 `background-color` 从 `var(--bg-color)` 改为 `transparent`
- 系统底色由 `app.json` 中 `backgroundColor: #FBF9F7` 继续负责，视觉底色不变

### Task 4 — 回归检查
- 复查三个改动文件内容，结构与样式均正确
- lint 检查无报错

## 覆盖范围
- 所有使用 `nav-bar` 组件的页面（4 个 Tab 页 + 5 个子页）自动获得渐变延伸效果，无需逐页修改
- 首页 Hero Banner 不使用 nav-bar 组件，不受影响

## 最终效果
导航栏渐变色（浅紫蓝）不再在导航下边缘硬切白色，而是柔和向下延伸约 20% 屏幕高度后渐隐，消除了导航区与页面主体之间的割裂感。
