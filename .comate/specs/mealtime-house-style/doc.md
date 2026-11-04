# 来我家吃饭（mealtime）对齐小程序整体视觉设计

## 一、需求概述

将来吃饭模块全部页面样式参照 `miniprogram/pages/splitpal/index` 调整，与 PawDiary 整体紫色视觉风格保持一致。当前模块是独立的珊瑚红 + 暖奶油主题、使用原生导航栏；目标改为宿主的紫色品牌、自定义 `nav-bar` 顶栏与通用卡片风格。

## 二、参考分析（splitpal 与全局）

splitpal/index 的做法：页面 json 用 `navigationStyle: custom` 并引入组件 `/components/nav-bar/nav-bar`，wxml 顶部放 `<nav-bar title back titleOpacity>`，js 用 `onPageScroll` 驱动 `navTitleOpacity`；主色紫色渐变 `linear-gradient(135deg,#7C6FCD,#A99FE0)`，卡片圆角 24rpx、紫色投影，右下角圆形 FAB，统一的分区标题与空态。

全局 `app.wxss` 已在 `page` 上定义品牌变量：`--primary-color:#7B5CF5`、`--primary-dark:#5A3FE0`、`--primary-light:#A48BFA`、`--bg-color:#F6F3FF`、`--text-color:#1F1A3D`、`--text-secondary:#6B6585`、`--border-color:#ECE7F7`、软色标签 `--soft-purple/#EFEAFE` 等，以及 `.card/.btn-primary/.tag-*/.fab-btn/.empty-container` 等通用类。这些变量对包括来吃饭在内的所有页面天然可用。

## 三、配色方案（珊瑚 → 紫色品牌）

重写 `mealtime-theme.wxss` 的 `page{}` 变量，直接对齐全局品牌值：

| 变量 | 现值（珊瑚） | 新值（紫色品牌） |
| --- | --- | --- |
| --c-primary | #EE7A6D | #7B5CF5 |
| --c-primary-deep | #D85C4E | #5A3FE0 |
| --c-primary-light | #F7C7C0 | #A48BFA |
| --c-bg | #FFFBF4 | #F6F3FF |
| --c-text | #3C3A42 | #1F1A3D |
| --c-sub | #AEA49F | #6B6585 |
| --c-line | #F2E7E1 | #ECE7F7 |
| --grad-primary | 珊瑚渐变 | linear-gradient(135deg,#7B5CF5 0%,#A48BFA 100%) |
| --grad-head | 暖头图 | linear-gradient(180deg,#EFEAFE 0%,#F6F3FF 100%) |

公共类随之改：投影统一紫色 `rgba(123,92,245,*)`；`.tag.cook` 用 soft-purple(#EFEAFE/紫字)、`.tag.eat` 用 soft-blue(#E3F0FE/蓝字)、`.tag.admin` 用 soft-yellow(#FFF6D9/#C99500)；`.avatar`、`.chip`、弹窗 `.field` 底色改紫色软底 #EFEAFE/#F8F5FF。

各页面 wxss 中我上一轮改为暖色的硬编码值做等价紫色替换：`#FBF1EC→#F8F5FF`、`#FDECE8→#EFEAFE`、`#FFFBF4→#F6F3FF`、`rgba(228,120,108,*)→rgba(123,92,245,*)`、虚线/文本暖灰改紫灰，`danger-btn` 改用全局危险色 #f97e54 + soft-pink #FCE6EE。

## 四、导航栏对齐（核心结构改动）

8 个页面统一改用自定义 `nav-bar`：

- json：以 `"navigationStyle": "custom"` + `"usingComponents": { "nav-bar": "/components/nav-bar/nav-bar" }` 替换原 `navigationBarBackgroundColor/TextStyle`，保留各页 `enablePullDownRefresh`。
- wxml：根节点顶部插入 `<nav-bar title="页面名" back="{{true}}" titleOpacity="{{navTitleOpacity}}" />`（来吃饭各页均为 navigateTo 进入，统一 back=true）。
- js：data 增 `navTitleOpacity: 1`，新增 `onPageScroll` 按滚动调透明度（复用 splitpal 写法）。

标题：index「来我家吃饭」、family 用饭局名、members「成员管理」、menu「我的菜单」、dishEdit「菜品」、order「点菜」、receipt「约饭小票」、history「历史小票」。

原页面内的渐变头 `.page-head`/`.top` 保留但置于 nav-bar 之下，背景改紫色软渐变，与整体协调。

## 五、受影响文件（均在 miniprogram/pages/mealtime/）

- 重写 `mealtime-theme.wxss`（变量 + 公共类，核心）
- 8 个页面 wxss：等价紫色替换残留硬编码值
- 8 个页面 json：改自定义导航 + 引入 nav-bar 组件
- 8 个页面 wxml：顶部加 `<nav-bar>`
- 8 个页面 js：加 `navTitleOpacity` 与 `onPageScroll`

不改任何业务逻辑、数据结构与云函数；样式仍通过各页 `@import` 与全局变量生效。

## 六、边界与预期

- nav-bar 组件自带占位高度，不会遮挡内容；order 页底部固定结算栏、menu/dishEdit 的固定 FAB 不受影响。
- 功能性强调色（删除红、告警橙、点菜热度）保留语义。
- 预期：来吃饭与记账分账、首页、我的等页面在导航栏、主色、卡片、按钮、空态上风格统一，整体为紫色品牌观感。
