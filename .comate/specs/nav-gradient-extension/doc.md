# 导航栏渐变向下延伸至页面上部并渐隐

## 需求概述
当前导航栏渐变色（浅紫蓝 `#C8BFFF → #A8C8FF`）与页面主体白色背景 `#FBF9F7` 之间存在明显色块割裂感。  
目标：让导航栏渐变色在导航下方继续向下延伸，在页面上方约 20% 高度处渐隐至透明；同时将页面主体背景设为透明，使系统底色自然透出，消除硬边界。

---

## 场景与处理逻辑

### 场景：所有使用 nav-bar 组件的页面顶部出现割裂感
当前渐变导航栏通过 `nav-bar` 组件统一渲染。导航下方紧接的是页面 `.xxx-page` 根容器，其背景色由全局 `page { background-color: var(--bg-color) }` 决定，为不透明的 `#FBF9F7`，和导航渐变蓝色边界感强。

**处理方案**：
1. 在 `nav-bar` 组件中新增一个 `fixed` 定位的渐变延伸层，紧贴导航下边缘向下铺开 20vh，颜色从 `#A8C8FF` 渐隐至 `rgba(251,249,247,0)`（全透明），叠加在页面内容之上，`pointer-events: none` 保证不阻断点击交互。
2. 将 `app.wxss` 中 `page` 选择器的 `background-color` 从不透明的 `#FBF9F7` 改为 `transparent`，使系统底色（`app.json` 中 `backgroundColor: #FBF9F7`）直接透出，视觉效果不变，但移除了与渐变延伸层的颜色撞击问题。

---

## 技术方案

### 1. nav-bar 组件：新增固定渐变延伸层

文件：`/Users/yuanlele/workspace/comate_error/miniprogram/components/nav-bar/nav-bar.wxml`

在固定导航栏 `<view class="nav-bar">` 之后、占位层 `<view class="nav-bar-placeholder">` 之前，新增一个固定定位的渐变延伸层：

```xml
<view
  class="nav-bar-gradient-ext"
  style="top: {{statusBarHeight + navBarHeight}}px;"
></view>
```

- `top` 值动态计算：状态栏高度 + 导航栏高度（44px），确保延伸层从导航底边开始
- 宽度和高度通过 CSS 控制，不依赖 JS

---

### 2. nav-bar 组件样式：添加渐变延伸层样式

文件：`/Users/yuanlele/workspace/comate_error/miniprogram/components/nav-bar/nav-bar.wxss`

新增规则：

```css
.nav-bar-gradient-ext {
  position: fixed;
  left: 0;
  right: 0;
  height: 20vh;
  background: linear-gradient(
    to bottom,
    #A8C8FF 0%,
    rgba(251, 249, 247, 0) 100%
  );
  pointer-events: none;
  z-index: 999;
}
```

关键设计点：
- `position: fixed`：延伸层固定在屏幕顶部，不随页面内容滚动
- `height: 20vh`：延伸至屏幕高度的 20%，约合典型设备 130–160px
- 渐变透明端使用 `rgba(251, 249, 247, 0)`，避免浏览器将 `transparent` 插值为灰色
- `z-index: 999`：低于导航层（1000），覆盖在页面内容之上
- `pointer-events: none`：绝不阻断用户在渐变区域内的点击/滑动交互

---

### 3. app.wxss：页面背景设为透明

文件：`/Users/yuanlele/workspace/comate_error/miniprogram/app.wxss`

将 `page` 选择器中：

```css
background-color: var(--bg-color);
```

改为：

```css
background-color: transparent;
```

此时页面容器不再绘制自身背景色，系统级 `backgroundColor`（`app.json` 中已设为 `#FBF9F7`）透出，视觉底色不变，但渐变延伸层可以完整覆盖页面顶部区域，不再被 page 自身的白色背景阻断。

---

## 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `components/nav-bar/nav-bar.wxml` | 结构新增 | 在 nav-bar 和 placeholder 之间插入渐变延伸层元素 |
| `components/nav-bar/nav-bar.wxss` | 样式新增 | 添加 `.nav-bar-gradient-ext` 固定渐变样式 |
| `app.wxss` | 样式修改 | `page` 背景色从 `var(--bg-color)` 改为 `transparent` |

不受影响的文件：
- `nav-bar.js`：逻辑不变，`statusBarHeight` 和 `navBarHeight` 数据已可用于 inline style
- 各页面 WXML / WXSS：无需单独修改，均通过 nav-bar 组件自动获得延伸层效果
- 各页面 `.card`、`.card-sm` 等卡片：保持白色背景，在渐变层之下自然显示

---

## 边界条件与异常处理
- 渐变延伸层使用 `pointer-events: none`，不影响任何页面交互
- 首页不使用 `nav-bar` 组件，Hero Banner 独立管理顶部区域，不受影响
- `page` 背景透明后，系统底色 `#FBF9F7` 仍负责页面空白区域的颜色，无需修改 `app.json`
- `z-index: 999` 确保在绝大多数页面卡片（无 z-index）之上渲染，如有 fixed 元素（如 FAB 按钮，z-index 100）也不受干扰

---

## 预期效果
- 所有使用 nav-bar 的页面（4 个 Tab 页 + 5 个子页），导航栏下方约 20% 屏幕高度呈现从浅蓝渐变到透明的渐晕效果
- 页面主体背景透明，系统底色自然透出，卡片等内容在渐变层下方正常展示
- 整体视觉从"导航栏蓝色块突然变白"过渡为"导航渐变柔和融入页面"
