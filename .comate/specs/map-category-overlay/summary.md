# 地图分类浮层 + 列表 10km 过滤 - 完成总结

## 实现
1. **地图模式分类浮层**：`.map-view` 内顶部绝对定位横向滚动胶囊，5 个分类（全部/咖啡厅/公园/餐厅/其他）。点击切换 `mapCategory` 后调 `buildMarkers` 实时按 `p.category` 过滤 markers。
2. **列表模式 10km 过滤**：`loadData` 中派生 `nearbyPlaces = places.filter(p => p.distance <= 10000)`，列表渲染源切换为 `nearbyPlaces`，空态文案改为"附近 10km 内暂无地点"。

## 改动文件
- `miniprogram/pages/map/map.js`：data 增加 `mapCategory / mapCategoryOptions / nearbyPlaces`；buildMarkers 加分类过滤；新增 `onSelectMapCategory`
- `miniprogram/pages/map/map.wxml`：`<map>` 上方插入 `.map-category-bar` 滚动浮层；列表模式 `wx:for` 改为 `nearbyPlaces`
- `miniprogram/pages/map/map.wxss`：新增 `.map-category-bar / .map-category-tab / .map-category-tab.active`（紫色胶囊）

## 边界
- 地图模式不限 10km，列表模式不受分类影响（两套筛选独立）
- distance 字段由云函数 `mapManage.listPlaces` 返回（米），本期未改云函数
