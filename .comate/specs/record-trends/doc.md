# 健康记录趋势页面 (record-trends)

## 一、需求概述

在「记录」页面 `健康时间线` 标题最右侧增加「趋势」入口，点击后进入全新的趋势分析页面。趋势页面参考用户提供的两张设计图（IBD Dashboard 风格），展示当前宠物的：

1. **体重** - 折线图（带数值标注）
2. **食水量** - 双折线图（食物量 + 饮水量）
3. **尿便状况** - 矩阵热力图（按 周 × 星期 展示 normal / abnormal）
4. **美容日记** - 矩阵热力图（按 周 × 星期 展示美护类记录密度，含 bath/nail/ear/paw/gland/teeth/beauty）

支持时间区间切换（7d / 30d / 90d / 自定义），与现有 PawDiary 暖色系设计语言一致。

## 二、视觉风格说明

参考图片整体风格：
- 浅米色背景（与 `--bg-color: #FBF9F7` 完全契合）
- 大号 sans-serif 标题
- 圆角白色卡片（`border-radius: 32rpx`）
- 柱图/折线图采用浅绿色 (#C5E1A5)，热力图采用粉色阶（#F8C8DC ~ #E91E63）+ 浅绿色阶（#DCEDC8 ~ #7CB342）
- 顶部彩色圆形头像/标签条（本期暂保留单一宠物视图，仅显示当前宠物头像 + 名称作为视觉装饰）
- 主色调延续 PawDiary 现有变量：`#E8875A`（强调）、`#6B2D1A`（按钮）

## 三、技术方案

### 3.1 入口改造

在 `miniprogram/pages/record/record.wxml` 第 26-29 行的 `section-title-row` 中，于 `健康时间线` 标题右侧加入趋势入口（图标 + 文字），使用 flex 布局让其右对齐。

```xml
<view class="section-title-row" wx:if="{{records.length}}">
  <text class="section-title">健康时间线</text>
  <view class="trends-entry" bindtap="goTrends">
    <text class="trends-entry-text">趋势</text>
    <text class="trends-entry-arrow">›</text>
  </view>
</view>
```

`record.js` 增加：
```js
goTrends() {
  var app = getApp();
  if (!app.globalData.currentPetId) {
    wx.showToast({ title: '请先添加宠物', icon: 'none' });
    return;
  }
  wx.navigateTo({ url: '/pages/record/record-trends/record-trends' });
}
```

并在 `record.wxss` 增加 `.trends-entry` 等样式（参考现有 tab-item 风格，使用浅米色胶囊背景）。

### 3.2 新页面：record-trends

路径：`miniprogram/pages/record/record-trends/`，包含 `record-trends.{js,wxml,wxss,json}`，并在 `app.json` 的 `pages` 数组中注册。

**页面结构（wxml）：**
1. `<nav-bar title="趋势" />` - 复用现有公共组件
2. 当前宠物头部卡片（头像 + 名称 + 年龄 + 体重 + 状况）—— 复用 `currentPet` 数据
3. 时间区间选择条（24h / 7d / 30d / 90d / 自定义），与图二样式一致
4. 体重折线图卡片
5. 食水量双折线图卡片
6. 尿便热力图卡片
7. 美容热力图卡片

**绘图实现：**
- 全部使用原生 `<canvas type="2d">` 新接口（精度更高，与项目现有 `wx.createCanvasContext` 旧 API 区分）
- 4 个独立 canvas 节点，各自封装绘制逻辑
- 折线图：手动绘制网格线、坐标轴、折线、数据点、数值标签
- 热力图：按 行=星期(S~S) × 列=周 绘制圆角方格，根据计数值映射到颜色阶

### 3.3 数据流

```
onShow() / 切换时间区间
  → 调用 cloud function recordManage list 拉取该宠物指定时间范围的记录
  → 客户端按 type 分组：
      weight     → 时间序列 (date, weight)
      diet+water → 同时间桶聚合双序列
      poop       → 按 (year, week, weekday) 计 normal/abnormal 数
      grooming   → bath/nail/ear/paw/gland/teeth/beauty 合并按 (week, weekday) 计数
  → setData 至各图表数据
  → 各 canvas 重新绘制
```

**注意**：`recordManage.list` 当前默认 `limit=50`，调用时需传 `limit: 500`，并通过 `type` 不可一次取所有类型——这里改为前端不传 `type`（即 `all`），云函数返回所有类型，再前端筛选；同时支持传入 `startDate / endDate` 字段做时间筛选。

**云函数小幅扩展**（`cloudfunctions/recordManage/index.js` 中 `listRecords`）：
- 支持可选 `data.startDate / data.endDate` 筛选 `date` 范围
- 上限 `limit` 调整为最大 1000（默认 50 不变）

```js
if (data.startDate) where.date = _.gte(new Date(data.startDate));
if (data.endDate) where.date = where.date
  ? _.and(where.date, _.lte(new Date(data.endDate)))
  : _.lte(new Date(data.endDate));
const limit = Math.min(data.limit || 50, 1000);
```

### 3.4 图表数据结构

```js
data: {
  range: '90d',                  // '24h' | '7d' | '30d' | '90d' | 'custom'
  customStart: '', customEnd: '',
  petInfo: { name, avatar, age, weight, condition },

  weightSeries: [{ date, value, label }],
  weightYRange: { min, max },

  intakeBuckets: [{ date, food, water }],
  intakeYRange: { foodMax, waterMax },

  poopMatrix: { weeks: [...], cells: [[{count, status, color}, ...], ...] },
  groomingMatrix: { weeks: [...], cells: [[{count, color}, ...], ...] }
}
```

### 3.5 影响文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `miniprogram/app.json` | 修改 | `pages` 数组追加 `pages/record/record-trends/record-trends` |
| `miniprogram/pages/record/record.wxml` | 修改 | 第 26-29 行增加趋势入口 |
| `miniprogram/pages/record/record.wxss` | 修改 | 新增 `.section-title-row` flex 样式与 `.trends-entry` 样式 |
| `miniprogram/pages/record/record.js` | 修改 | 新增 `goTrends` 方法 |
| `miniprogram/pages/record/record-trends/record-trends.js` | 新建 | 页面逻辑 + 图表绘制 |
| `miniprogram/pages/record/record-trends/record-trends.wxml` | 新建 | 页面结构 |
| `miniprogram/pages/record/record-trends/record-trends.wxss` | 新建 | 页面样式 |
| `miniprogram/pages/record/record-trends/record-trends.json` | 新建 | 页面配置（usingComponents nav-bar） |
| `cloudfunctions/recordManage/index.js` | 修改 | `listRecords` 支持时间范围 + 提升 limit 上限 |

## 四、边界与异常

1. 当前宠物未设置：跳过 `goTrends`，提示 "请先添加宠物"
2. 数据为空：每张图卡片渲染 "暂无数据" 占位
3. canvas 在 onReady 后才能拿到节点：使用 `wx.createSelectorQuery().in(this).select('#xxx').fields({node:true,size:true})` 的 Promise 化方法，`onReady` 完成后调用 `redrawAll()`
4. 切换时间区间：先 setData 再异步加载，加载中显示 loading
5. 体重图：所有数据相同时 `min=max`，需扩展 Y 轴范围（如 ±0.1）以防止除 0
6. 热力图周数过多时（90d ≈ 13 周），方格自适应宽度
7. 美容类记录类型集合：`['bath','nail','ear','paw','gland','teeth','beauty']`
8. 尿便记录 `poopStatus` 仅 `normal/abnormal`，颜色：normal=浅绿、abnormal=粉色，强度按当日次数
9. 自定义时间区间使用微信原生 `picker mode=date` 选择起止日期

## 五、预期效果

- 「记录」页面 `健康时间线` 标题右侧出现胶囊形 "趋势 ›" 按钮
- 点击进入新页面，显示 4 张图表卡片，渲染流畅
- 切换时间区间能即时刷新所有图表
- 视觉风格与提供的设计图保持一致，与项目现有暖色调系统融合
- 所有图表使用 canvas 原生绘制，无新增第三方依赖
