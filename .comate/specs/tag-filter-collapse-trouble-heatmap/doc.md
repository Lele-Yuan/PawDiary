# 标签筛选栏折叠 & 捅娄子热力图

本次需求包含两个独立子需求，都集中在记录列表与趋势页面：

1. 在 `pages/record/record.wxml` 的标签筛选栏增加折叠/展开能力，默认仅显示「全部、体重、驱虫、洗澡、更多」5 项。
2. 在 `pages/record/record-trends/record-trends.wxml` 增加「捅娄子」热力图，使用 `troubleName` 首字符作为单元格图标，无 legend。

---

## 子需求一：标签筛选栏折叠/展开

### 场景与处理逻辑
- 进入记录列表页时，标签筛选栏默认仅显示 5 项：`全部 / 体重 / 驱虫 / 洗澡 / 更多`。
- 点击「更多」：标签栏向下展开，显示全部记录类型的标签，并在末尾追加「收起」按钮。
- 点击「收起」：恢复默认 5 项布局。
- 折叠态下若用户当前选中的标签不在默认 5 项中，仍保留 `activeType` 状态不被重置；展开后用户可继续切换。

### 架构与技术方案
- 现状：`record.js` `onLoad` 中通过 `RECORD_TYPES.forEach` 构造完整 `typeList`（17+ 项），WXML 通过 `wx:for` 一次渲染全部。
- 改造：拆分为两个数组 + 一个布尔状态：
  - `defaultTypeList`：固定 5 项 `[全部, 体重, 驱虫, 洗澡, 更多]`
  - `expandedTypeList`：完整列表 + 末尾追加 `{ key: '__collapse__', label: '收起' }`
  - `tagsExpanded`（默认 `false`）控制 `displayTypeList = tagsExpanded ? expandedTypeList : defaultTypeList`
- WXML 仍用 `wx:for="{{displayTypeList}}"` 渲染；`switchType` 拦截特殊 key：
  - `__more__` → `setData({ tagsExpanded: true })`
  - `__collapse__` → `setData({ tagsExpanded: false })`
  - 其它 key → 原逻辑（设置 `activeType` + `loadRecords`）
- 「更多」/「收起」两项加 `is-action` 样式类，避免被误标记为 `active`。

### 受影响文件
- `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/record/record.js`（修改 `onLoad`、`switchType`，新增 data 字段）
- `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/record/record.wxml`（数据源改为 `displayTypeList`，给特殊项加 class）
- `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/record/record.wxss`（`.tab-item.is-action` 样式：与普通 tab 视觉区分，不被 active 高亮）

### 实现细节

```js
// record.js onLoad
const defaultKeys = ['weight', 'deworm', 'bath'];
const defaultTypeList = [
  { key: 'all', label: '全部' },
  ...defaultKeys.map(k => {
    const t = RECORD_TYPES.find(x => x.key === k);
    return { key: k, label: t.label };
  }),
  { key: '__more__', label: '更多', isAction: true }
];
const expandedTypeList = [
  { key: 'all', label: '全部' },
  ...RECORD_TYPES.map(t => ({ key: t.key, label: t.label })),
  { key: '__collapse__', label: '收起', isAction: true }
];
this.setData({
  defaultTypeList,
  expandedTypeList,
  displayTypeList: defaultTypeList,
  tagsExpanded: false
});
```

```js
// switchType
switchType(e) {
  const type = e.currentTarget.dataset.type;
  if (type === '__more__') {
    this.setData({ tagsExpanded: true, displayTypeList: this.data.expandedTypeList });
    return;
  }
  if (type === '__collapse__') {
    this.setData({ tagsExpanded: false, displayTypeList: this.data.defaultTypeList });
    return;
  }
  this.setData({ activeType: type });
  this.loadRecords();
}
```

```xml
<!-- record.wxml -->
<scroll-view class="type-tabs {{tagsExpanded ? 'expanded' : ''}}" scroll-x="{{!tagsExpanded}}" enable-flex>
  <view
    class="tab-item {{activeType === item.key ? 'active' : ''}} {{item.isAction ? 'is-action' : ''}}"
    wx:for="{{displayTypeList}}"
    wx:key="key"
    data-type="{{item.key}}"
    bindtap="switchType"
  >
    <text class="tab-label">{{item.label}}</text>
  </view>
</scroll-view>
```

展开态允许换行：在 wxss 中 `.type-tabs.expanded { flex-wrap: wrap; white-space: normal; height: auto; }`。

### 边界与异常
- 用户当前 `activeType` 是「饮食」（不在默认 5 项），折叠时仍正确高亮：保留 `activeType` 状态，折叠时该项被隐藏但 active 不丢失，下次展开仍可见。
- 列表上下文切换（onShow 重新进入）保持 `tagsExpanded` 不重置（仅 onLoad 初始化）。

### 预期结果
默认进入：5 项胶囊 tab。点击「更多」后展开为多行全量 tab + 末尾「收起」。点击「收起」回到 5 项。点击常规 tab 行为不变。

---

## 子需求二：捅娄子热力图

### 场景与处理逻辑
- 在记录趋势页（`record-trends`）增加一个新的图表卡片：「捅娄子」热力图。
- 数据来源：`type === 'trouble'` 的记录。
- 单元格按日期聚合，文字显示当日该天发生的某条 trouble 记录 `troubleName` 的首字符（取该日记录中最新或第一条都可，本方案取**当日最后一条 / 计数最多的**）。简单起见取**当日第一条 trouble 的首字符**。
- 颜色深浅：单元格用主题紫色（与现有热力图保持一致基调）由浅到深，依据当日 trouble 计数 / maxCount。
- 不显示 legend。

### 架构与技术方案
- 现有热力图模式：`buildHeatmapMatrix` + `_drawHeat(ctx, w, h, matrix, colorFn)`，`colorFn` 返回 `{ fill, emoji }`。
- 新增：
  - `_troubleMap`：`{ [dayKey]: { total, char } }`
  - `drawTroubleHeatmap()`：仿 `drawPoopHeatmap`，调用 `_drawHeat`
  - `processRecords` 中遍历 `records.filter(r => r.type === 'trouble')` 累计聚合
  - `data.hasTrouble` 控制空态与画布显隐
  - `redrawAll` 中追加 `if (this.data.hasTrouble) this.drawTroubleHeatmap()`
  - WXML 增加新 chart-card，无 legend；空态展示「暂无数据」

### 受影响文件
- `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/record/record-trends/record-trends.js`
- `/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/record/record-trends/record-trends.wxml`

### 实现细节

```js
// 顶部常量
const TROUBLE_THEME = { color: '#F4A300', light: '#FCEFD3' };

// processRecords 中追加
const troubleMap = {};
records.filter(r => r.type === 'trouble').forEach(r => {
  const k = dayKey(r.date);
  if (!troubleMap[k]) {
    troubleMap[k] = { total: 0, char: '' };
  }
  troubleMap[k].total++;
  if (!troubleMap[k].char) {
    const name = r.troubleName || r.title || '';
    troubleMap[k].char = name ? String(name).charAt(0) : '';
  }
});
this._troubleMap = troubleMap;
this.setData({ hasTrouble: Object.keys(troubleMap).length > 0 });

// redrawAll 追加
if (this.data.hasTrouble) this.drawTroubleHeatmap();

// 新方法
async drawTroubleHeatmap() {
  try {
    const { ctx, width, height } = await this.getCanvasCtx('troubleCanvas');
    ctx.clearRect(0, 0, width, height);
    const { start, end } = this._range;
    const matrix = this.buildHeatmapMatrix(start, end);
    const dataMap = this._troubleMap;
    let maxC = 1;
    Object.keys(dataMap).forEach(k => { if (dataMap[k].total > maxC) maxC = dataMap[k].total; });
    this._drawHeat(ctx, width, height, matrix, (cell) => {
      const v = dataMap[cell.key];
      if (!v || v.total === 0) return null;
      const t = Math.min(1, v.total / maxC);
      return { fill: mixColor(TROUBLE_THEME.light, TROUBLE_THEME.color, t), emoji: v.char };
    });
  } catch (e) {
    console.error('drawTroubleHeatmap failed', e);
  }
}
```

WXML 在「美容日记」卡片后插入：

```xml
<view class="chart-card">
  <text class="chart-title">捅娄子</text>
  <view wx:if="{{!hasTrouble}}" class="empty-tip">暂无数据</view>
  <canvas
    wx:else
    type="2d"
    id="troubleCanvas"
    class="chart-canvas chart-canvas-heat"
  ></canvas>
</view>
```

### 边界与异常
- `troubleName` 为空：回退使用 `r.title`（保持兼容），仍空则字符为空字符串，单元格只显示底色不显示文字。
- 当日多条 trouble：取首条的首字符（处理顺序遵循 `records` 数组顺序，足够直观）。
- `_drawHeat` 现有逻辑限制 `emoji` 字体：中文字符同样在 sans-serif 下绘制，正常显示。

### 预期结果
趋势页新增「捅娄子」热力图卡片，紧随「美容日记」之后，无 legend。当用户记录了 trouble 类型记录后，对应日期单元格按计数深浅着色，并以「篓子名称」首字符作为白色字符标记。
