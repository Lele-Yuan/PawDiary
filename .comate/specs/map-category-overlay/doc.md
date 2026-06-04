# 地图模式分类浮层 + 列表 10km 过滤

## 需求
1. 宠物友好地图地图模式中，地图上方增加一个分类浮层（横向 tab），分类：全部、咖啡厅、公园、餐厅、其他。点击切换后过滤地图 markers，仅展示选中分类的地点（"全部"显示所有）。
2. 列表模式只显示距离当前位置 ≤ 10km 的地点。

## 技术方案
- `data.mapCategory` 当前选中分类 key，默认 `'all'`
- 分类常量本地写死（仅地图模式用，避免污染全局 PLACE_CATEGORIES，且用户列表与"全部/咖啡厅/公园/餐厅/其他"不完全一致——隐藏 hospital/shop）
- `buildMarkers` 时按 mapCategory 过滤，'all' 不过滤；其它仅保留 `p.category === mapCategory`
- 浮层绝对定位在 `.map-view` 内顶部 16rpx，水平横滚（与 record 页 type-tabs 一致），紫色主题

## 改动
### `miniprogram/pages/map/map.js`
- data 增加 `mapCategory: 'all'` 和 `mapCategoryOptions`
- `loadData` 加载后先按 ≤ 10km 过滤一份用于列表模式的 places（distance 单位为米，已存在）
- `buildMarkers` 改造：先按 mapCategory 过滤（地图模式不限制 10km）
- 新增 `onSelectMapCategory(e)`：setData mapCategory + 调 buildMarkers

### `miniprogram/pages/map/map.wxml`
在 `.map-view` 内、`<map>` 上方插入 `.map-category-bar`（绝对定位浮层）

### `miniprogram/pages/map/map.wxss`
- `.map-view` 加 `position: relative`
- 新增 `.map-category-bar`、`.map-category-tab`、`.map-category-tab.active` 样式（紫色胶囊）

## 边界
- 分类切换不需要重新拉数据，纯前端过滤已加载的 places
- hospital/shop 类目地点在地图模式下选择"全部"时仍展示（保持完整）
- 列表模式 10km 过滤独立于地图模式分类筛选；地图模式不做距离限制
- distance 字段由云函数 `mapManage.listPlaces` 返回（米），无需重新计算

## 预期
- 地图模式顶部出现 5 个胶囊按钮，点击高亮并实时过滤地图 markers
