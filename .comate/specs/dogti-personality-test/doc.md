# DGTI 狗格测试 - 功能设计文档

## 需求概述

在 Profile 页面的"DGTI"快捷功能按钮上添加跳转，创建一个完整的 **DGTI（Dog Type Indicator）** 狗格人格测试小程序模块。产品核心定位：**真实观察感 + 情绪价值 + 强分享性**（对标 MBTI）。

系统采用「5 大模型 × 3 子维度 = 15 个狗格维度」，派生出 16 个经典狗格人格（以四大名著命名）。

---

## 页面架构

```
pages/dogti/
├── index/              # DGTI 首页（狗格研究所）
│   ├── index.wxml
│   ├── index.js
│   ├── index.wxss
│   └── index.json
├── test/               # 测试答题页
│   ├── test.wxml
│   ├── test.js
│   ├── test.wxss
│   └── test.json
└── result/             # 结果页
    ├── result.wxml
    ├── result.js
    ├── result.wxss
    └── result.json
```

---

## 一、DGTI 首页（pages/dogti/index）

### 视觉参考
设计稿 figma node `89:493`，整体暖棕色系（`#77321C`、`#FFF8F6`），扁平化插图风格。

### 页面结构

#### 1. Hero 区域
- 标题：`每只狗都有隐藏人格`（40px 黑体特粗）
- 副标题：`你的狗可能比你更像人`（斜体灰）
- 主视觉卡片（圆角 32rpx）：
  - 背景图：狗狗图片（占位使用颜色块）
  - 扫描 UI 叠层：`SCANNING SOUL...` + `DNA_LOCK` badge + DNA 进度条
  - 底部扫描线特效（渐变）

#### 2. CTA 按钮
- `立即检测狗格 →`（棕色圆角按钮，跳转答题页）

#### 3. 发现稀有狗格（Research Archive）
- 标题行："发现稀有狗格 / RESEARCH ARCHIVE" + "查看全部 >"
- 横向滚动卡片列表，展示狗格卡片：
  - 狗格图标（彩色方形 icon）
  - 稀有度 badge（SSR/SR/R）
  - 狗格名称（中文）
  - 简介（2-3 行中文）
  - 特性 badge（如 BADGE: 狂暴之源）

### 数据
16 个狗格数据，以 JS 常量存储在 `pages/dogti/data/dgti-data.js`：
```javascript
// 每条狗格数据结构
{
  id: 'qi-tian',
  name: '齐天疯狗型',
  subtitle: '（孙悟空系）',
  code: 'Z+D+E',
  identity: '精神状态遥遥领先',
  tagline: '它不是在发疯，它是在修仙。',
  rarity: 'SSR',        // SSR/SR/R
  tags: ['狂暴之源'],
  breeds: ['哈士奇', '柴犬', '澳洲牧羊犬'],
  traits: [...]
}
```

---

## 二、测试答题页（pages/dogti/test）

### 视觉参考
设计稿 figma node `83:165`，背景色 `#FFF8F6`，卡片式一题一卡。

### 页面结构

#### 1. 顶部导航栏
- 左侧：`← DGTI`
- 右侧：`...` 菜单

#### 2. 进度条区域
- `PROGRESS` 标签 + `01 / 24` 计数器
- 渐进式进度条（棕色细条）

#### 3. 题目卡片
- 顶部图片区域（224rpx 高，情境配图 + 白色渐变遮罩）
- 题目文本（Q1: 你家狗看到快递员时？）
- 4 个选项（A/B/C/D），圆角矩形按钮：
  - 选中状态：棕色填充 + 白色文字
  - 未选中：淡粉色背景 `#FFF1ED`

#### 4. 底部语录
- 英文励志语（斜体灰色）

### 题库设计（24 题）

每题对应一个或多个维度的得分权重：

```javascript
// 题目数据结构
{
  id: 1,
  scenario: '看到快递员时',
  image: null, // 暂无图，使用颜色渐变占位
  question: 'Q1: 你家狗看到快递员时？',
  options: [
    { label: '准备战斗', code: 'A', scores: { A: 2 } },  // Alert Tail
    { label: '兴奋贴贴', code: 'B', scores: { E: 2 } },  // ExtroBark
    { label: '无视', code: 'C', scores: { I: 2 } },      // IntroSniff
    { label: '暗中观察', code: 'D', scores: { A: 1, I: 1 } }
  ],
  quote: '"Understanding the silent language of their reaction reveals the heart of their protective soul."'
}
```

### 算分逻辑

15 个维度（E/I/A、F/S/M、C/G/D、P/Z/T、R/B/H）各维度累加得分。最终取各模型内最高得分维度组合，查表匹配 16 种狗格。

```javascript
// 计算逻辑
function calcResult(scores) {
  const model1 = maxOf(scores, ['E','I','A']); // Social Paw
  const model2 = maxOf(scores, ['F','S','M']); // Emotional Tail
  const model3 = maxOf(scores, ['C','G','D']); // Action Drive
  const model4 = maxOf(scores, ['P','Z','T']); // Brain Circuit
  const model5 = maxOf(scores, ['R','B','H']); // Life Philosophy
  // 根据前3主维度匹配狗格
  return matchPersonality([model1, model2, model3]);
}
```

---

## 三、结果页（pages/dogti/result）

### 视觉参考
设计稿 figma node `83:3` 右侧的结果页部分（第3列）。

### 页面结构

#### 1. 主图区域
- 大图背景（渐变遮罩）
- `RESULT UNLOCKED` badge
- 狗格名称（大字）
- 标语

#### 2. 属性卡片行（横向2个）
- DOG JOB TITLE（绿色背景）
- SOUL RANK（棕色背景）

#### 3. Soul DNA Breakdown
- 社交能力进度条（Social Ability）
- 危险指数（Danger Index）
- 拆家指数（Destruction Power）

#### 4. Trait Manifestation（特性分析）
- 2 个主特征，左侧彩色竖线 + 标题 + 描述

#### 5. 操作按钮
- 「分享到朋友圈」（棕色主按钮）
- 「查看狗格图鉴」（绿色次按钮，返回首页）

### 数据传递
通过页面路由参数传递计算结果：
```javascript
wx.navigateTo({
  url: `/pages/dogti/result/result?id=${resultId}&scores=${JSON.stringify(scores)}`
});
```

---

## 四、数据层（pages/dogti/data/dgti-data.js）

统一管理所有静态数据：

```javascript
// 15 个维度定义
export const DIMENSIONS = { E, I, A, F, S, M, C, G, D, P, Z, T, R, B, H }

// 16 个狗格定义
export const PERSONALITIES = [...]

// 24 道题目
export const QUESTIONS = [...]

// 狗格匹配逻辑
export function calcPersonality(scores) {...}
```

---

## 五、入口改造（profile.wxml / profile.js）

### profile.wxml 修改
```diff
- <view class="quick-action-item">
+ <view class="quick-action-item" bindtap="goDgti">
    <view class="quick-action-icon">🐶</view>
    <text class="quick-action-label">DGTI</text>
  </view>
```

### profile.js 新增方法
```javascript
goDgti() {
  wx.navigateTo({ url: '/pages/dogti/index/index' });
}
```

---

## 六、app.json 新增路由

```json
"pages/dogti/index/index",
"pages/dogti/test/test",
"pages/dogti/result/result"
```

---

## 七、视觉设计规范

基于设计稿提取的 Token：

| 变量 | 值 |
|---|---|
| 主色 | `#77321C` |
| 主色浅 | `#955131` |
| 主色背景 | `#FFF8F6` |
| 卡片背景 | `#FFFFFF` |
| 浅暖 | `#FFF1ED` |
| 绿色 | `#CFE99F` |
| 绿文字 | `#54662E` |
| 文字主 | `#221A17` |
| 文字次 | `#54433E` |
| 圆角大 | `32rpx` |
| 圆角中 | `24rpx` |
| 圆角全 | `9999rpx` |

---

## 八、边界处理

1. **无宠物用户**：可以测试，结果不与具体宠物绑定
2. **中途退出**：进度不保存（不持久化，刷新重置）
3. **图片资源**：答题页题目图使用颜色占位（暂无实际配图）
4. **分享**：使用 `wx.showShareMenu` 原生分享，暂不实现 Canvas 海报

## 九、受影响文件

| 文件 | 修改类型 |
|---|---|
| `miniprogram/app.json` | 新增 3 个页面路由 |
| `miniprogram/pages/profile/profile.wxml` | 修改 DGTI 按钮添加 bindtap |
| `miniprogram/pages/profile/profile.js` | 新增 `goDgti()` 方法 |
| `miniprogram/pages/dogti/data/dgti-data.js` | 新建，所有静态数据 |
| `miniprogram/pages/dogti/index/index.{wxml,js,wxss,json}` | 新建，首页 |
| `miniprogram/pages/dogti/test/test.{wxml,js,wxss,json}` | 新建，答题页 |
| `miniprogram/pages/dogti/result/result.{wxml,js,wxss,json}` | 新建，结果页 |
