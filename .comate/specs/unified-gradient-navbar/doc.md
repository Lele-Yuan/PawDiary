# 全局统一自定义渐变导航栏

## 需求概述
参考提供的"我的"页面截图，将整个小程序所有页面的导航栏统一改为自定义渐变色背景。参考图中导航栏呈浅紫蓝柔和渐变，文字为深色，视觉感受轻盈清爽，与现有橙红半透明方案明显不同。

本次改动**不涉及首页**。首页已通过 Hero Banner 完全覆盖顶部状态栏区域，视觉上等同于自定义沉浸式头部，单独保持现有暖橘渐变风格。

---

## 场景与处理逻辑

### 场景 1：nav-bar 组件更新渐变样式
现有 `nav-bar` 组件背景为 `rgba(254,157,127,0.8)`（橙红半透明），文字和图标颜色为白色。参考图的导航栏为浅紫蓝渐变背景、深色文字，且两者的颜色体系差异较大，需全量替换组件背景色和文字/图标颜色。

渐变色定义：
```
background: linear-gradient(135deg, #C8BFFF 0%, #A8C8FF 100%);
```
此渐变从浅紫延伸至浅蓝，与参考图色调吻合，同时与现有全局色板（`--teal-color`、`--primary-color` 等）不产生冲突。

文字/图标颜色从 `#FFFFFF` 改为 `#2D2D2D`（与全局 `--text-color` 保持一致），保证在浅色背景上有足够对比度。

### 场景 2：4 个 Tab 页从原生导航切换为自定义导航
当前清单、健康记录、账单、我的 4 个 Tab 页均沿用全局原生导航栏（`#F5E6CC` 米黄背景）。需逐一将它们切换为自定义导航，步骤与现有 5 个子页面一致：
1. 在页面 `.json` 中设置 `"navigationStyle": "custom"`
2. 在页面 `.json` 中注册 `nav-bar` 组件
3. 在页面 `.wxml` 第一行插入 `<nav-bar title="页面标题" />` 并去掉 `back` 属性（Tab 页不显示返回按钮）

由于 `nav-bar` 组件自带占位 `placeholder` 视图（高度 = 状态栏高度 + 44px），各页面原有内容区布局无需手动调整顶部间距。

### 场景 3：app.json 全局原生导航栏颜色同步更新
现有全局配置中 `navigationBarBackgroundColor` 为 `#F5E6CC`，切换后此颜色理论上不再对上述页面生效，但为保持整体语义一致，将其更新为渐变中的主色调浅紫值 `#C8BFFF`，避免未来新增页面时出现视觉跳变。

---

## 技术方案

### 1. nav-bar 组件样式更新

文件：`/Users/yuanlele/workspace/comate_error/miniprogram/components/nav-bar/nav-bar.wxss`

主要改动：
- 替换 `background-color: rgba(254, 157, 127, 0.8)` → `background: linear-gradient(135deg, #C8BFFF 0%, #A8C8FF 100%)`
- 替换 `.back-icon` 颜色 `#FFFFFF` → `#2D2D2D`
- 替换 `.nav-bar-title` 颜色 `#FFFFFF` → `#2D2D2D`

无需修改 `.js` 和 `.wxml`，逻辑结构不变。

### 2. 4 个 Tab 页 JSON 配置更新

**清单页** — `/Users/yuanlele/workspace/comate_error/miniprogram/pages/checklist/checklist.json`

目标：
```json
{
  "navigationStyle": "custom",
  "usingComponents": {
    "empty-state": "/components/empty-state/empty-state",
    "nav-bar": "/components/nav-bar/nav-bar"
  },
  "navigationBarTitleText": "清单"
}
```

**健康记录页** — `/Users/yuanlele/workspace/comate_error/miniprogram/pages/record/record.json`

目标：
```json
{
  "navigationStyle": "custom",
  "usingComponents": {
    "empty-state": "/components/empty-state/empty-state",
    "nav-bar": "/components/nav-bar/nav-bar"
  },
  "navigationBarTitleText": "健康记录"
}
```

**账单页** — `/Users/yuanlele/workspace/comate_error/miniprogram/pages/bill/bill.json`

目标：
```json
{
  "navigationStyle": "custom",
  "usingComponents": {
    "empty-state": "/components/empty-state/empty-state",
    "nav-bar": "/components/nav-bar/nav-bar"
  },
  "navigationBarTitleText": "账单"
}
```

**我的页** — `/Users/yuanlele/workspace/comate_error/miniprogram/pages/profile/profile.json`

目标：
```json
{
  "navigationStyle": "custom",
  "usingComponents": {
    "pet-switcher": "/components/pet-switcher/pet-switcher",
    "nav-bar": "/components/nav-bar/nav-bar"
  },
  "navigationBarTitleText": "我的"
}
```

### 3. 4 个 Tab 页 WXML 插入 nav-bar

每个页面在根容器的第一个子节点位置插入 nav-bar，不带 `back` 属性（Tab 页无返回按钮），示例：

```xml
<!-- 清单页 -->
<nav-bar title="清单" />

<!-- 健康记录页 -->
<nav-bar title="健康记录" />

<!-- 账单页 -->
<nav-bar title="账单" />

<!-- 我的页 -->
<nav-bar title="我的" />
```

插入位置分别为各页面根容器 `<view class="xxx-page">` 内的第一行。

### 4. app.json 全局导航色更新

文件：`/Users/yuanlele/workspace/comate_error/miniprogram/app.json`

改动：
```json
"navigationBarBackgroundColor": "#C8BFFF"
```

---

## 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `components/nav-bar/nav-bar.wxss` | 样式修改 | 背景换渐变，文字/图标换深色 |
| `pages/checklist/checklist.json` | 配置修改 | 新增 `navigationStyle: custom` 和 nav-bar 注册 |
| `pages/checklist/checklist.wxml` | 结构修改 | 首行插入 `<nav-bar title="清单" />` |
| `pages/record/record.json` | 配置修改 | 同上 |
| `pages/record/record.wxml` | 结构修改 | 首行插入 `<nav-bar title="健康记录" />` |
| `pages/bill/bill.json` | 配置修改 | 同上 |
| `pages/bill/bill.wxml` | 结构修改 | 首行插入 `<nav-bar title="账单" />` |
| `pages/profile/profile.json` | 配置修改 | 同上 |
| `pages/profile/profile.wxml` | 结构修改 | 首行插入 `<nav-bar title="我的" />` |
| `app.json` | 配置修改 | `navigationBarBackgroundColor` 更新为 `#C8BFFF` |

不受影响的文件：
- `components/nav-bar/nav-bar.js` — 逻辑不变
- `components/nav-bar/nav-bar.wxml` — 结构不变
- 首页（`pages/home/home.*`）— 维持现有 Hero 通顶方案
- 所有子页面（5 个）— 自动复用 nav-bar 组件新样式，无需额外操作

---

## 边界条件与异常处理
- `nav-bar` 组件内部已通过 `wx.getSystemInfoSync()` 动态获取状态栏高度，新增的 4 个 Tab 页复用此逻辑，无需额外适配
- `nav-bar-placeholder` 视图已确保各页面内容不被遮挡，不需要对现有布局做额外 padding 调整
- Tab 页不传 `back="{{true}}"` 属性，组件内返回按钮不会渲染
- 渐变色在深色模式下可能对比度不足，本次暂不处理深色模式适配

---

## 预期结果
- 所有非首页的页面导航栏统一呈现浅紫蓝渐变背景，文字为深色
- 首页 Hero 通顶样式保持不变
- 新旧导航样式之间的渐变色调统一，整体视觉一致
