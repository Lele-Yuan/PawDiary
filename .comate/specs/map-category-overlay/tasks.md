# 地图分类浮层 + 列表 10km 过滤 - 任务拆解

- [x] Task 1: map.js 数据与逻辑
    - 1.1: data 新增 `mapCategory: 'all'`、`mapCategoryOptions`（5 项：全部/咖啡厅/公园/餐厅/其他）
    - 1.2: `loadData` 拼装 places 后增加 `nearbyPlaces`（distance ≤ 10000m）用于列表模式
    - 1.3: `buildMarkers` 按 mapCategory 过滤地图 markers（不限距离）
    - 1.4: 新增 `onSelectMapCategory` 事件处理函数

- [x] Task 2: map.wxml 布局
    - 2.1: 在 `.map-view` 内 `<map>` 上方插入 `.map-category-bar`
    - 2.2: 列表模式渲染源由 `places` 改为 `nearbyPlaces`
    - 2.3: 列表为空提示文案改为"附近 10km 内暂无地点"

- [x] Task 3: map.wxss 样式
    - 3.1: `.map-view` 加 `position: relative`
    - 3.2: 新增 `.map-category-bar`（顶部浮层，横向滚动）/ `.map-category-tab` / `.map-category-tab.active`（紫色胶囊）

- [ ] Task 4: 自测与 summary.md
