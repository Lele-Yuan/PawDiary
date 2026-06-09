# DGTI 五大人格轴重构 - 任务计划

- [x] Task 1: 数据层基础设施搭建（轴定义 + 人格阈值矩阵）
    - 1.1: 在 `dgti-data.js` 顶部新增 `AXES` 常量（5 项：social/clingy/action/strategy/freedom），含 posLabel/negLabel/radarLabel
    - 1.2: 为每个 `PERSONALITIES` 项追加 `match` 字段（按 doc 4.4 矩阵填入条件数组）
    - 1.3: 保留 `DIMENSIONS` 旧常量但标记 `@deprecated`，避免破坏 atlas 等可能引用

- [x] Task 2: 重写题库为 25 道场景行为题
    - 2.1: 设计并替换 `QUESTIONS` 为 25 题；每题 4 选项，主+次维度 +2/+1
    - 2.2: 题目分布校验：每轴正反极各 ≥ 8 个打分点
    - 2.3: 选项 `scores` 结构改为 `{ social: +2, freedom: +1 }`（正数=正极，负数=反极）

- [x] Task 3: 重写计分函数
    - 3.1: 新增 `calcAxisScores(answers)` → 返回 `{ social, clingy, action, strategy, freedom }`，归一化 0-100
    - 3.2: 重写 `calcRadarScores(scores)` 直接返回 5 轴值（兼容入参为 axis 得分对象）
    - 3.3: 新增 `calcPersonalityV2(axisScores)` 实现软匹配算法（doc 4.3）
    - 3.4: 改写 `calcPersonality(answers)` 调用上述新函数，返回 `{ personality, secondary, fitMap, scores, topDims }`，保持 test.js 兼容

- [x] Task 4: 适配测试页
    - 4.1: 验证 `test.js` 在 `QUESTIONS.length === 25` 下进度条 / 答题流程正常
    - 4.2: 跳转 result 页时透传 `secondary` 与 `fitMap`（URL 参数或 storage）

- [x] Task 5: 重构结果页雷达与历史兼容
    - 5.1: `result.js` 中 `RADAR_AXES` 键名调整为 social/clingy/action/strategy/freedom，labelCn 同步
    - 5.2: 历史 storage 兼容：读取时若含旧键 (danger/destroy/mental) → 映射或标记需重测
    - 5.3: 海报渲染 (`_drawMiniRadar`、`_renderPoster`) 使用新键名

- [x] Task 6: 结果页新增次人格卡片
    - 6.1: `result.wxml` 主人格卡下方新增 `secondary-match` 卡片，wx:if fit ≥ 60
    - 6.2: `result.wxss` 添加次人格卡片样式（紧凑版主卡）
    - 6.3: `result.js` data 增加 `secondaryPersonality` / `primaryFit` / `secondaryFit`
    - 6.4: 主人格卡片旁展示 `fit%` 徽章

- [x] Task 7: 验证与回归
    - 7.1: 静态校验：构造极端答案集（全选 A/B/C/D），确认无报错且产出合理人格
    - 7.2: 检查 atlas 页是否依赖 `code` 字段或 `DIMENSIONS`，若依赖则适配
    - 7.3: 清理无用导出（旧 `topDims` 若不再使用）
