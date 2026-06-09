# DGTI 五大人格轴重构 - 实施总结

## 目标回顾
将原 15 维度直接映射 16 人格的硬匹配机制，重构为 **5 大对立轴 × 25 道场景题 × 软匹配阈值矩阵** 的人格测试体系，并在结果页同时展示主人格与次人格匹配度。

## 架构变更

### 5 大轴（替代原 15 维度）
| Axis | 正极 (+) | 反极 (-) | 雷达标签 |
|------|----------|----------|----------|
| social | 社牛 (S) | 独行 (O) | 社交方式 |
| clingy | 黏人 (M) | 独立 (I) | 情感依赖 |
| action | 行动派 (A) | 慢热 (H) | 行动力 |
| strategy | 谋略 (P) | 直觉 (E) | 思维方式 |
| freedom | 自由 (F) | 规矩 (R) | 生活态度 |

### 题库
- 25 道场景行为题（替代原维度量表题）
- 每选项 `scores` 为 `{ axisKey: ±2|±1 }`，主维度 +2、次维度 +1
- 正负极各 ≥ 8 个打分点，保证分布均衡

### 软匹配算法
1. `calcAxisRaw` 累加各轴原始得分
2. `normalizeAxis(raw, AXIS_MAX=20)` 归一化到 0-100
3. 每个 PERSONALITIES 配置 `match: [{ axis, op, threshold }]` 条件
4. `matchCondition` 使用 /30 ramp 计算软匹配度（避免硬阈值断崖）
5. 取 fitMap 最高为主人格、次高为次人格

## 文件改动

| 文件 | 类型 | 说明 |
|------|------|------|
| `pages/dogti/data/dgti-data.js` | 重写 | 新增 `AXES`、25 题 `QUESTIONS`、16 人格 `match` 矩阵；新增 `calcAxisScores`/`calcRadarScores`/`calcPersonalityV2`；改写 `calcPersonality` 返回 `{ personality, secondary, primaryFit, secondaryFit, fitMap, scores, radar, topDims }` |
| `pages/dogti/test/test.js` | 改 | `QUESTION_EMOJIS` 扩为 25 项；跳转 URL 增加 `secondaryId/primaryFit/secondaryFit` |
| `pages/dogti/result/result.js` | 改 | `RADAR_AXES` 键名换为 social/clingy/action/strategy/freedom；新增 `migrateRadar` 兼容旧 storage（destroy→action、mental→freedom、danger 丢弃、strategy 兜底 50）；data 新增 `secondaryPersonality/primaryFit/secondaryFit/showSecondary`，仅当次人格 fit ≥ 60 显示 |
| `pages/dogti/result/result.wxml` | 改 | 主人格区域新增 `hero-fit-badge` 匹配度徽章；新增 `secondary-card` 次人格卡片；分享卡 `personality.danger` 替换为 `dynamicRadar.action` |
| `pages/dogti/result/result.wxss` | 改 | 新增 `.hero-fit-badge`、`.secondary-card/.secondary-row/.secondary-icon/.secondary-name/.secondary-tag` 样式 |

## 兼容性
- 旧 storage radar 数据通过 `migrateRadar` 平滑映射，不强制重测
- 保留 `DIMENSIONS` 旧常量（@deprecated 标记），避免 atlas 等页面引用断裂
- `calcPersonality` 出参字段向下兼容 `test.js` 已有调用

## 回归校验
通过 node REPL 跑极端用例：
```
AXES: 5 | PERSONALITIES: 16 | QUESTIONS: 25
全选A: 宋江老大型 46% | 次: 白龙马打工型 37%
全选B: 八戒干饭型 48% | 次: 宝玉摆烂型 44%
全选C: 宋江老大型 42% | 次: 孙二娘黑店型 34%
全选D: 八戒干饭型 47% | 次: 孙二娘黑店型 36%
随机:  宋江老大型 34% | 次: 林冲隐忍型 26%
```
所有极端输入均产出有效主+次人格与合理匹配度，无运行时报错。

## 任务完成情况
全部 7 个 Task 已勾选完成，详见 `tasks.md`。
