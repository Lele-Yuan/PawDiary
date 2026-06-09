# DGTI 狗格测试 - 五大人格轴重构

## 1. 背景与问题

当前 DGTI 测试使用 15 个独立维度（E/I/A/F/S/M/C/G/D/P/Z/T/R/B/H），存在以下问题：
- **人格标签太极端**：维度间无对立关系，得分全靠累加
- **题目带明显倾向**：例如"它最像哪种老板？"用户难以中立作答
- **每题加分太重**：少数关键题就能锁死人格
- **人格之间没有拉扯**：维度不形成对立轴，缺少"非此即彼"的分布张力
- **结果分布失衡**：可能 70% 用户都被判为同一人格

## 2. 重构目标

重构为 **5 大人格对立轴**（10 极），每轴产出一个 0–100 的雷达数值；最终通过"AI 映射"匹配到 16 个名著名人格的概率分布。

### 2.1 五大对立轴

| 轴 | 编码 | 正向极（高分） | 反向极（低分） |
|---|---|---|---|
| 社交方式 | S | 社牛 (S) | 观察 (O) |
| 情感依赖 | M | 黏人 (M) | 独立 (I) |
| 行动力 | A | 冲动 (A) | 稳健 (H) |
| 思维方式 | P | 策略 (P) | 执行 (E) |
| 生活态度 | F | 自由 (F) | 秩序 (R) |

雷达 5 维即 5 轴在正向极上的得分（0–100），低于 50 即偏向反向极。

5 位人格码示例：`SMAPR` 表示用户在每轴更偏向正向极（社牛+黏人+冲动+策略+自由）。每轴根据原始得分二值化为正/反极字母，例如 `OMHEF` 表示观察+黏人+稳健+执行+自由。

### 2.2 雷达 5 维命名（用户层）

- 社交能力（高=社牛）
- 依赖指数（高=黏人）
- 行动力（高=冲动）
- 策略值（高=策略）
- 自由度（高=自由）

## 3. 题目重构

### 3.1 题目规格
- **题量**：25 题（旧版 24 题）
- **题型**：场景行为题 — 描述具体情境，4 个具象选项；用户回答成本极低
- **题目语言**：去除引导性，描述客观行为而非"它像什么"

### 3.2 选项打分规格
统一为：
- **主维度 +2**（落在一个轴的某个极）
- **次维度 +1**（另一个轴的某个极，或同轴同极强化）

避免出现 +3+3+0+0 这种过重打分。每题 4 个选项分别落到不同轴的不同极，使每道题在 2-4 个轴上产生拉扯。

### 3.3 示例
> Q: 你拿着零食但没有给它，它会？
> - A 继续等  →  稳健 +2，秩序 +1
> - B 一直盯着你  →  黏人 +2，观察 +1
> - C 用爪子扒你  →  冲动 +2，社牛 +1
> - D 去找别的方法（绕到桌子另一边等）  →  策略 +2，自由 +1

## 4. 计分与匹配逻辑

### 4.1 原始打分
- 25 题 × 主+次共 ~75 分点
- 每轴累计正向极得分 - 反向极得分 = `axisScoreRaw`
- 每轴最大可能正向得分约 25-30；归一化到 0-100：
  ```
  normalized = round( (axisScoreRaw + AXIS_MAX) / (2 * AXIS_MAX) * 100 )
  ```
  限制在 [0, 100]

### 4.2 雷达输出
```
{ social: 72, clingy: 83, action: 44, strategy: 68, freedom: 35 }
```

### 4.3 人格映射（16 名著人格 → 5 轴阈值矩阵）

每个人格给出"匹配条件"。匹配度计算：
```
fit = sum( 满足的条件项数 ) / 条件项总数 × 100
（也可加权：每个条件按 |实际值 - 阈值| 软计分）
```

软计分公式（推荐）：
```
对每个条件 (axis, op, threshold)：
  if op == '>': c = clamp((value - threshold) / 30, 0, 1)
  if op == '<': c = clamp((threshold - value) / 30, 0, 1)
fit = round( avg(c) * 100 )
```
即超过阈值越多匹配度越高，反向跌破不计分。

输出：
- **最接近人格**：fit 最高
- **次人格**：fit 第二高且 ≥ 60%

### 4.4 16 人格映射矩阵（草案）

| 人格 | 阈值条件 |
|---|---|
| 齐天疯狗 (qi-tian) | social>70, action>80, freedom>70 |
| 孔明军师 (kong-ming) | social<40, strategy>80, freedom<40 |
| 黛玉敏感 (dai-yu) | social<40, clingy>80, action>70 |
| 宝玉摆烂 (bao-yu) | freedom>80, action<40, clingy>60 |
| 武松战神 (wu-song) | social<50, action>70, strategy<50 |
| 宋江老大 (song-jiang) | social>80, clingy>60, strategy>50 |
| 鲁智深拆迁 (lu-zhi-shen) | action>80, freedom>70, strategy<40 |
| 唐僧圣母 (tang-seng) | clingy>80, action<40, freedom<50 |
| 八戒干饭 (zhu-ba-jie) | freedom>70, action<50, clingy>60 |
| 沙僧老实 (sha-seng) | action<40, freedom<40, strategy<50 |
| 王熙凤掌控 (wang-xi-feng) | social>70, strategy>80, freedom<50 |
| 李逵疯批 (li-kui) | action>80, social>50, strategy<30 |
| 薛宝钗完美 (xue-bao-chai) | freedom<30, action<40, strategy>60 |
| 孙二娘黑店 (sun-er-niang) | strategy>70, freedom>60, clingy<40 |
| 林冲隐忍 (lin-chong) | social<30, action<50, strategy>50 |
| 白龙马打工 (bai-long-ma) | strategy<50, action<40, clingy>60 |

> 该矩阵为初稿，最终值需通过 1 万次模拟答题校准至 8%-12% 主流分布。

### 4.5 长期分布目标
> 短期不实施模拟校准，但矩阵阈值预留校准空间。占比目标：
> - 主推 6 人格（孔明/齐天/黛玉/宝玉/唐僧/八戒）：8%-12%
> - 次推 2 人格（王熙凤/鲁智深）：5%-8%
> - 其他 8 人格：分摊剩余

## 5. 数据流改动

### 5.1 数据层 (`miniprogram/pages/dogti/data/dgti-data.js`)
- 删除：`DIMENSIONS`（15 维定义）、`calcRadarScores`（旧映射）、`calcPersonality` 中的 top3 拼接逻辑
- 新增：
  - `AXES = [{ key: 'social', posKey:'S', negKey:'O', posLabel:'社牛', negLabel:'观察', radarLabel:'社交能力' }, ...]`（5 个）
  - `QUESTIONS_V2`：25 题，每选项 `scores: { [axis]: ['pos'|'neg', value] }` 或简化为 `scores: { social: 2, clingy: 1 }`（正数=正极，负数=反极）
  - `calcAxisScores(answers)` → 返回 `{ social, clingy, action, strategy, freedom }`，0-100
  - `calcPersonalityV2(axisScores)` → 返回 `{ primary, secondary, fitMap }`
- `PERSONALITIES` 数组每项新增 `match: [{ axis, op, threshold }]`
- 保留：`PERSONALITIES`（人格定义本身复用）
- 兼容性：`calcPersonality(answers)` 内部调用新逻辑，返回结构与旧版兼容（`{ personality, scores, topDims }`）

### 5.2 题目页 (`miniprogram/pages/dogti/test/test.js`)
- 题量从 24 改为 25（进度条计算自动随 `QUESTIONS.length`）
- 调用入口不变：`calcPersonality(answers)` + `calcRadarScores`

### 5.3 结果页 (`miniprogram/pages/dogti/result/result.js`)
- `RADAR_AXES` 重命名键：
  - `social` → 社交能力（保留）
  - `danger` → `action` 行动力
  - `destroy` → `strategy` 策略值
  - `clingy` → `clingy` 依赖指数
  - `mental` → `freedom` 自由度
- 历史记录 storage 兼容旧 key：读取时若发现旧 key（danger/destroy/mental），按映射转换或丢弃重测提示
- 新增"次人格"展示卡片（如 fit ≥ 60%）

### 5.4 结果页 WXML/WXSS
- 在主人格卡片下方加 `secondary-match` 卡片，展示次人格名 + fit%
- 雷达图 legend 文案随新键名

## 6. 边界与异常

- **极端答题**（用户全选 A）：5 轴各 50 分附近，进入"中立人格"兜底（默认 `bai-long-ma`）
- **未达任何 fit**：取 fit 最高者，即使低于 60%；不展示次人格
- **历史数据迁移**：旧 storage 记录的 `radar` 字段含 `danger/destroy/mental` 键，结果页读取时若未识别新键则视为旧版，弹提示"测试已升级，建议重测"或自动近似映射（`destroy → action`, `mental → freedom`，`danger` 丢弃）
- **图片/资源**：人格 `iconImg` 不变

## 7. 主要影响文件

| 路径 | 变更类型 |
|---|---|
| `miniprogram/pages/dogti/data/dgti-data.js` | 重写：题库、轴定义、计分、匹配 |
| `miniprogram/pages/dogti/test/test.js` | 微调：进度条 / 答案数组同名兼容 |
| `miniprogram/pages/dogti/result/result.js` | 调整：RADAR_AXES 键名、次人格展示、历史兼容 |
| `miniprogram/pages/dogti/result/result.wxml` | 新增：次人格卡片 |
| `miniprogram/pages/dogti/result/result.wxss` | 新增：次人格卡片样式 |

## 8. 预期产出

用户体验：
1. 完成 25 题 → 看到五维雷达图（社交/依赖/行动/策略/自由 各 0-100）
2. 主人格匹配显示 fit% （如 "黛玉敏感型 86%"）
3. 次人格显示（如 "宝玉摆烂型 73%"）
4. 16 人格分布更均衡，单一人格不超过 12%

技术产出：题库 25 道、5 轴计分、16 人格阈值矩阵、软匹配算法、雷达键名迁移、历史数据兼容。
