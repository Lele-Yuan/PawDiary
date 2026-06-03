# 健康记录趋势页面 - 任务拆解

- [x] Task 1: 扩展云函数 recordManage 支持时间范围筛选
    - 1.1: 在 `listRecords` 中新增 `startDate / endDate` 条件拼装
    - 1.2: 将 `limit` 上限提升到 1000（默认仍 50）
    - 1.3: 本地保留改动（云函数发布由用户自行执行）

- [x] Task 2: 在 app.json 注册新页面路由
    - 2.1: `pages` 数组追加 `pages/record/record-trends/record-trends`

- [x] Task 3: 在记录页 `健康时间线` 标题右侧新增「趋势」入口
    - 3.1: 修改 `record.wxml` 第 26-29 行 `section-title-row`，加入 `trends-entry` 视图
    - 3.2: 修改 `record.wxss` 让 `section-title-row` 使用 flex 两端对齐，新增 `.trends-entry` / `.trends-entry-text` / `.trends-entry-arrow` 胶囊样式
    - 3.3: 修改 `record.js` 增加 `goTrends` 方法，含未选宠物时的提示

- [x] Task 4: 创建 record-trends 页面骨架文件
    - 4.1: 新建 `record-trends.json`（标题、usingComponents nav-bar / loading-view）
    - 4.2: 新建 `record-trends.wxml`（nav-bar、宠物头部卡片、时间区间 tab、四张图表卡片占位）
    - 4.3: 新建 `record-trends.wxss`（背景、卡片、tab、热力图图例等基础样式）
    - 4.4: 新建 `record-trends.js`（最小 Page 框架：data、onLoad、onShow、onReady、setRange、空 redrawAll）

- [x] Task 5: 实现数据拉取与按类型分组
    - 5.1: 在 `record-trends.js` 实现 `loadData(range)`：根据 range 计算 startDate/endDate
    - 5.2: 调用 `recordManage.list` 取该宠物时间窗内的所有记录（type=all、limit=1000、传入 startDate/endDate）
    - 5.3: 客户端按 type 分流为 weightRecords / dietRecords / waterRecords / poopRecords / groomingRecords
    - 5.4: 处理空数据态，setData 标记每张图是否有数据
    - 5.5: 集成现有 `loading-view` 在加载期间显示

- [x] Task 6: 实现体重折线图
- [x] Task 7: 实现食水量双折线图
- [x] Task 8: 实现尿便状况矩阵热力图
- [x] Task 9: 实现美容日记矩阵热力图
- [x] Task 10: 实现时间区间切换交互

- [x] Task 11: 视觉打磨与边界完善

- [x] Task 12: 自测与回归
