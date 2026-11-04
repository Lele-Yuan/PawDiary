# 来我家吃饭（mealtime）视觉改版设计

## 一、需求概述

将「来我家吃饭」模块的整体视觉按设计稿（Foodee / Qori Dev）调整。设计稿的视觉语言是珊瑚红为主色、暖奶油色为背景、大圆角白卡片、柔和投影、粗体深色标题、珊瑚色胶囊按钮，并以鼠尾草绿、暖黄、粉等低饱和色作点缀。本次只改视觉，不改动任何功能逻辑、数据结构与交互流程。

当前模块为绿色主题（`--c-primary: #7CB342`），样式集中在 `pages/mealtime/mealtime-theme.wxss` 的 CSS 变量与 `.card/.btn/.row/.tag/.chip` 等公共类；各页面 wxss 只有少量硬编码的绿色阴影（`rgba(90,130,50,*)` 等）、浅绿底色（`#EAF7D9`、`#F4F8EE`）与页面背景色引用（`#F2FBEA`）。因此改版以重写主题变量为主，辅以替换各页面中的硬编码绿色值。

## 二、配色方案（绿色 → 珊瑚奶油）

主题变量映射（定义在 mealtime-theme.wxss 的 `page{}`）：

| 变量 | 旧值（绿） | 新值（珊瑚奶油） | 用途 |
| --- | --- | --- | --- |
| --c-primary | #7CB342 | #EE7A6D | 主色，链接/图标/强调 |
| --c-primary-deep | #5B9B2E | #D85C4E | 深主色，标题数字/选中文字 |
| --c-primary-light | #A8E063 | #F7C7C0 | 浅主色，描边/ghost 边框 |
| --c-bg | #F2FBEA | #FFFBF4 | 页面暖奶油背景 |
| --c-card | #FFFFFF | #FFFFFF | 卡片底（不变） |
| --c-text | #2B331F | #3C3A42 | 主文字（深青灰） |
| --c-sub | #9AA59A | #AEA49F | 次要文字（暖灰） |
| --c-line | #ECF3E4 | #F2E7E1 | 分割线（暖色） |
| --grad-primary | 绿渐变 | linear-gradient(135deg,#F6967F 0%,#EB6A5B 100%) | 主按钮/强调块 |
| --grad-head | 绿头图 | linear-gradient(180deg,#FFE9E2 0%,#FFFBF4 100%) | 顶部渐变头 |

新增点缀色（直接写入公共类）：鼠尾草绿 `#7E9E8C`（干饭人标签/绿色点缀）、暖黄 `#D99A2B`（管理员标签）。

公共类调整：`.card/.btn/.search-bar` 的绿色投影统一改为珊瑚色投影 `rgba(228,120,108,0.*)`；`.avatar` 底色 `#EAF7D9` → 珊瑚浅底 `#FDECE8`；`.tag.cook` 改珊瑚浅底、`.tag.eat` 改鼠尾草绿浅底、`.tag.admin` 改暖黄浅底；`.chip` 暖色化。

## 三、各页面 wxss 调整点

index：`.act-btn` 绿投影→珊瑚投影；弹窗 `.field` 底色 `#F4F8EE`→暖奶油 `#FBF1EC`。

family：`.invite` 绿投影→珊瑚投影（其余走变量，自动生效）。

menu：`.dish-card`/`.fab` 绿投影→珊瑚投影；`.dish-img` 底色 `#EAF7D9`→`#FDECE8`。

order：`.nav`/`.bar-btn.ghost` 底色 `#F4F8EE`→暖奶油；`.d-img` 底色 `#EAF7D9`→`#FDECE8`；`.d-item`/`.pick-btn`/`.bar` 绿投影→珊瑚投影（`.locked` 橙色告警、`.hot` 橙色保留）。

receipt：`.ticket` 绿投影→珊瑚投影；锯齿底 `.zigzag` 与裁切色 `#F2FBEA`→新背景 `#FFFBF4`；`.dash` 虚线 `#d8e0cc`→暖色 `#E8D9D2`；`.rmk` 文本 `#5a6b45`→暖灰 `#8A7F7A`。

members：`.op.mini-op` 底色 `#F4F8EE`→暖奶油（`.op.reject` 红色保留）。

dishEdit：`.up-btn` 底色 `#F4F8EE`、虚线 `#cdd8c0`→暖色。

history：全部走变量，无需单独改。

## 四、导航栏

8 个页面 json 的 `navigationBarBackgroundColor` 由绿色 `#8CC63F` 改为珊瑚色 `#EE7A6D`，文字保持白色，统一品牌色。

## 五、受影响文件（均在 miniprogram/pages/mealtime/）

- 修改 `mealtime-theme.wxss`（主题变量 + 公共类配色，核心）
- 修改 8 个页面 wxss：index/family/menu/order/receipt/members/dishEdit/history（history 实际无硬编码，按需）
- 修改 8 个页面 json 的导航栏颜色

不涉及任何 js / wxml / 云函数改动。

## 六、边界与预期

改动仅为样式，不影响既有功能与数据。公共类与变量不改名，故页面结构零改动。预期：模块整体呈现珊瑚红 + 暖奶油的 Foodee 风格，按钮为珊瑚胶囊、卡片大圆角柔投影、标题粗体深色，与宿主其它模块样式相互隔离（仍仅通过各页 `@import` 生效，不污染全局）。
