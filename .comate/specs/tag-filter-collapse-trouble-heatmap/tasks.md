# 标签筛选栏折叠 & 捅娄子热力图 任务计划

- [x] Task 1: 标签栏数据结构与初始化改造（record.js）
    - 1.1: data 中新增 `defaultTypeList`、`expandedTypeList`、`displayTypeList`、`tagsExpanded`
    - 1.2: `onLoad` 构造默认 5 项（全部、体重、驱虫、洗澡、更多）与完整列表（末尾追加收起）
    - 1.3: 改写 `switchType`，拦截 `__more__` 与 `__collapse__` 切换 `displayTypeList`

- [x] Task 2: 标签栏 WXML 与样式调整
    - 2.1: `record.wxml` 中将 `wx:for` 数据源改为 `displayTypeList`，根据 `tagsExpanded` 切换 class，并对动作项加 `is-action`
    - 2.2: `record.wxss` 中新增 `.type-tabs.expanded` 多行换行样式与 `.tab-item.is-action` 视觉样式（不被 active 高亮）

- [x] Task 3: 趋势页新增 `_troubleMap` 数据聚合
    - 3.1: `record-trends.js` 顶部新增 `TROUBLE_THEME` 常量
    - 3.2: `processRecords` 中增加 trouble 类型的按日聚合，记录 `total` 与首字符 `char`
    - 3.3: data 中新增 `hasTrouble`，并在 `processRecords` 末尾 setData

- [x] Task 4: 趋势页绘制捅娄子热力图
    - 4.1: 新增 `drawTroubleHeatmap` 方法（仿 `drawPoopHeatmap`，使用 `TROUBLE_THEME` 配色，emoji 替换为聚合字符）
    - 4.2: `redrawAll` 中追加 `drawTroubleHeatmap` 调用

- [x] Task 5: 趋势页 WXML 增加「捅娄子」卡片
    - 5.1: 在「美容日记」卡片后插入新 `chart-card`，包含标题、空态与 `troubleCanvas`，不渲染 legend
