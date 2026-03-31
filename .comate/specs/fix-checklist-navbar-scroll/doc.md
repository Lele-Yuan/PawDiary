# 修复清单选中态、导航栏返回按钮、标题滚动渐隐

## 问题 1：切换宠物时清空清单选中状态

### 现状
清单页面 `checklist.js` 的 `loadData()` 在 `onShow` 中被调用，会重新加载清单列表，但不会重置 `expandedId` 和 `detailChecklist`。切换宠物后回到清单页，旧宠物的展开详情仍然显示。

### 修复方案
在 `loadData()` 开头重置展开状态：
```js
this.setData({ expandedId: null, detailChecklist: null, detailNewItemName: '' });
```

### 影响文件
| 文件 | 修改 |
|---|---|
| `miniprogram/pages/checklist/checklist.js` | `loadData` 开头增加重置逻辑 |

## 问题 2：nav-bar 返回按钮点击无响应

### 现状
`nav-bar.wxss` 中 `.nav-bar` 设置了 `z-index: -1`（原意是让渐变背景沉到页面内容底层做装饰），但这导致整个 fixed 导航栏的 DOM 层级低于页面内容，`pointer-events: auto` 无法生效，因为点击事件被上层的页面内容（placeholder 和正文）拦截。

### 修复方案
将导航栏的背景装饰和交互区域分离：
- `.nav-bar` 保留 `z-index: -1` 作为纯背景渐变层（`pointer-events: none`）
- `.nav-bar-inner` 改为独立的 fixed 定位层，使用正的 `z-index`，脱离 `.nav-bar` 的层叠上下文

具体做法：让 `.nav-bar-inner` 使用 `position: fixed` 独立定位，设置 `z-index: 100`，这样交互区域在页面内容之上，而背景渐变层仍在内容之下。

### 影响文件
| 文件 | 修改 |
|---|---|
| `miniprogram/components/nav-bar/nav-bar.wxss` | `.nav-bar-inner` 改为 fixed 定位，正 z-index |
| `miniprogram/components/nav-bar/nav-bar.wxml` | `.nav-bar-inner` 需要带上 `padding-top: statusBarHeight` |

## 问题 3：页面滚动时标题渐隐

### 现状
导航栏标题始终不透明，没有滚动响应。

### 修复方案
- nav-bar 组件新增 `titleOpacity` 属性（外部传入）
- 在 `.nav-bar-title` 上通过 `style="opacity: {{titleOpacity}}"` 控制透明度
- 各使用 nav-bar 的页面通过 `onPageScroll` 监听滚动，计算 opacity 值并传给 nav-bar

opacity 计算逻辑：滚动 0~150px 时 opacity 从 1 线性过渡到 0。

```js
onPageScroll(e) {
  const threshold = 150;
  const opacity = Math.max(0, 1 - e.scrollTop / threshold);
  // 节流：变化超过 0.05 才更新
  if (Math.abs(opacity - this.data.navTitleOpacity) > 0.05 || opacity === 0 || opacity === 1) {
    this.setData({ navTitleOpacity: opacity });
  }
}
```

### 影响文件
| 文件 | 修改 |
|---|---|
| `miniprogram/components/nav-bar/nav-bar.js` | properties 新增 titleOpacity，默认 1 |
| `miniprogram/components/nav-bar/nav-bar.wxml` | title 绑定 opacity style |
| `miniprogram/pages/home/home.js` | 新增 onPageScroll |
| `miniprogram/pages/checklist/checklist.js` | 新增 onPageScroll |
| `miniprogram/pages/record/record.js` | 新增 onPageScroll |
| `miniprogram/pages/bill/bill.js` | 新增 onPageScroll |
| `miniprogram/pages/profile/profile.js` | 新增 onPageScroll |

## 边界条件
- 节流更新 opacity 避免频繁 setData
- 滚动到顶部时 opacity 回到 1
- 子页面（非 tab 页）的 nav-bar 有 back 按钮，同样需要标题渐隐但返回按钮始终可见
