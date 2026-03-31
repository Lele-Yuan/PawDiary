# 完成总结：修复清单选中态、导航栏返回按钮、标题滚动渐隐

## 修复 1：切换宠物时清空清单展开状态

**文件**: `miniprogram/pages/checklist/checklist.js`

在 `loadData()` 开头新增重置逻辑，清空 `expandedId`、`detailChecklist`、`detailNewItemName`。切换宠物后 `onShow` 触发 `loadData`，展开的旧清单详情会被自动关闭。

## 修复 2：nav-bar 返回按钮点击无响应

**文件**: `miniprogram/components/nav-bar/nav-bar.wxml`、`nav-bar.wxss`

**根因**: `.nav-bar` 的 `z-index: -1` 导致整个导航栏 DOM 在页面内容层之下，`pointer-events: auto` 无效。

**方案**: 将 `.nav-bar`（渐变背景装饰）和 `.nav-bar-inner`（交互区域）分离为两个独立的 fixed 层：
- `.nav-bar` 保留 `z-index: -1`，纯装饰背景
- `.nav-bar-inner` 独立 fixed 定位，`z-index: 100`，在页面内容之上

WXML 结构从嵌套改为平级，`.nav-bar-inner` 自带 `padding-top: statusBarHeight`。

## 修复 3：页面滚动时标题渐隐

**组件改造**: `nav-bar.js` 新增 `titleOpacity` property（Number，默认 1），`nav-bar.wxml` 标题绑定 `style="opacity: {{titleOpacity}}"`，CSS 添加 `transition: opacity 0.1s ease`。

**页面接入**: checklist、record、bill、profile 四个 tab 页：
- data 新增 `navTitleOpacity: 1`
- 新增 `onPageScroll` 方法：滚动 0~150px 时 opacity 从 1 线性过渡到 0
- WXML 的 nav-bar 标签添加 `titleOpacity="{{navTitleOpacity}}"`
- 节流策略：opacity 变化超过 0.05 才触发 setData

首页（home）未使用 nav-bar 组件，不受影响。
