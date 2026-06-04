# 全局视觉重构 (visual-refactor-purple)

## 一、目标

参考用户提供的紫色 UI 设计图，将 PawDiary 小程序整体视觉切换为「紫色品牌 + 浮动胶囊 TabBar + 软投影圆角卡片 + 柔和渐变 Header」风格。本次范围限定为：

1. **全局设计令牌**（app.wxss CSS 变量、tabBar 配色）
2. **公共组件**（nav-bar、loading、empty-state、自定义 tabBar）
3. **主要页面**：首页 home、清单 checklist、记录 record、趋势 record-trends、账单 bill、我的 profile

其它次要页面（dogti/map/memorial/care/visit/invite/loading/webview/pet-edit 等）暂不在本次范围内，但因继承全局令牌也会自然变化。

## 二、设计令牌（核心调色板）

参考图采集得到的关键色：

```css
/* 主色：紫色品牌 */
--primary-color: #7B5CF5;        /* 主紫 */
--primary-dark: #5A3FE0;         /* 深紫，用于按钮 hover/active */
--primary-light: #A48BFA;        /* 浅紫 */
--primary-bg: #EFEAFE;           /* 卡片浅紫底 */
--primary-gradient-start: #8B6BF7;
--primary-gradient-end: #6B4FF0;

/* 中性 */
--bg-color: #F6F3FF;             /* 页面背景：极浅紫 */
--card-bg: #FFFFFF;              /* 白色卡片 */
--card-soft-bg: #F8F5FF;         /* 备选浅紫卡片 */

/* 文字 */
--text-color: #1F1A3D;           /* 主文字：深紫黑 */
--text-secondary: #6B6585;       /* 次文字 */
--text-light: #B5B0C8;           /* 提示 */

/* 边框/分割 */
--border-color: #ECE7F7;
--divider-color: #F0EBFC;

/* 状态 */
--success-color: #5BC58A;
--warning-color: #fece71;
--danger-color: #fe865f;
--info-color: #c3e2ff;

/* 软色卡片背景（标签/分类条目）*/
--soft-purple: #EFEAFE;
--soft-blue: #E3F0FE;
--soft-pink: #FCE6EE;
--soft-orange: #FEF1E1;
--soft-green: #E5F6EC;
--soft-yellow: #FFF6D9;

/* 阴影 */
--shadow-card: 0 8rpx 24rpx rgba(123, 92, 245, 0.08);
--shadow-button: 0 8rpx 20rpx rgba(123, 92, 245, 0.32);
--shadow-floating: 0 16rpx 40rpx rgba(60, 40, 130, 0.16);

/* 圆角 */
--radius-sm: 16rpx;
--radius-md: 24rpx;
--radius-lg: 32rpx;
--radius-xl: 40rpx;
--radius-pill: 999rpx;
```

## 三、视觉语言要点

1. **Header 卡片**：大号紫色渐变背景圆角块，承载欢迎语、宠物切换、积分等信息；可叠加白色装饰半圆／插画
2. **内容卡片**：纯白圆角 `--radius-lg`，软阴影 `--shadow-card`
3. **状态/分类条目**：左侧有彩色分类标签文字（小字号），右侧有圆形状态指示点（实心彩色 = 已完成，空心 = 未完成）
4. **主按钮**：紫色实心圆角矩形 + 软投影 `--shadow-button`；`pill` 形态；按下态颜色加深
5. **次按钮**：白底 / 浅紫底，紫色文字
6. **Tag/Pill 标签**：浅紫色胶囊背景，紫色文字
7. **TabBar**：浮动胶囊（`floating tab bar`），距底部 32rpx，宽度自适应内容，深色或紫色背景，5 图标 + 中央选中态高亮（参考 PawDiary 已有 custom tabBar，仅改样式）
8. **图表/热力图**：颜色阶替换为紫色阶 `--primary-light → --primary-color`
9. **emoji 图标条目**：保留现有 emoji，但承载容器使用浅紫圆角

## 四、影响文件清单

### 全局
| 文件 | 修改 |
|---|---|
| `miniprogram/app.wxss` | 重写 CSS 变量；增加通用工具类（card, btn-primary, btn-secondary, soft-tag）|
| `miniprogram/app.json` | navigationBarBackgroundColor 改紫；tabBar 配色改紫；保留 custom: true |

### 组件
| 文件 | 修改 |
|---|---|
| `miniprogram/components/nav-bar/*` | 背景透明、文字深紫；返回按钮浅紫圆形 |
| `miniprogram/components/loading/*` | 紫色 spinner |
| `miniprogram/components/empty-state/*` | 文字与按钮配色 |
| `miniprogram/custom-tab-bar/*` | 浮动胶囊样式：深紫背景、白色图标、选中状态高亮圆形（如已存在；若不存在则新建）|

### 主要页面
| 页面 | 修改 |
|---|---|
| `pages/home/home.{wxss,wxml}` | Header 紫色渐变；提醒卡片软投影；分类 tag |
| `pages/home/components/pet-card/*` | 替换原黄色渐变为紫色渐变 |
| `pages/checklist/checklist.{wxss,wxml}` | 任务条目右侧实心/空心紫色状态点 |
| `pages/record/record.{wxss,wxml}` | 时间线点改紫色；卡片背景调浅紫；趋势入口胶囊改紫 |
| `pages/record/record-trends/*` | hero 背景渐变改紫；range tab active 改紫；图表线/热力图色阶切紫 |
| `pages/bill/*` | 金额卡片紫色渐变；月份切换；图表色阶 |
| `pages/profile/*` | 头像区紫色渐变；菜单条目软分类色 |

## 五、实现策略

为降低风险，分两个大阶段：

### Phase A：全局令牌 + 公共组件 + TabBar
直接替换 app.wxss 中的变量；调整 nav-bar / tabBar 配色与形态。此阶段后所有页面会"半自动"变成紫色（凡是用了 var(--primary-color) 的地方），但布局仍是原来的。

### Phase B：主要页面深度适配
按 home → record → record-trends → checklist → bill → profile 顺序，对每个页面：
- 替换硬编码的暖色（#E8875A / #6B2D1A / #f9d568 等）为紫色变量
- Header 区改为紫色渐变 + 大号标题排版
- 卡片改用 `--shadow-card` 软投影
- 按钮形态调整
- 图表色阶切换

## 六、边界与风险

1. **大量硬编码色**：项目中存在 #E8875A / #6B2D1A / #F5C4A8 / #f9d568 / #FBF9F7 等硬编码，全靠变量替换覆盖不完。需逐文件搜索替换。
2. **TabBar 浮动胶囊**：当前 `custom: true` 但是否已有 `custom-tab-bar/` 目录需要确认；若没有需新建一套
3. **navigationBarBackgroundColor**：原系统导航栏是 `#f9d568` 黄色；切紫色后需同步 `navigationBarTextStyle` 仍为 white
4. **图表已有紫色阶**：record-trends 内已经有部分紫色定义（GROOMING/美容），需协调避免冲突
5. **不在范围内的页面**会出现部分元素紫色、部分元素老暖色的「混搭期」——属于已知妥协，由用户在后续按需推进

## 七、预期效果

- 启动小程序首先看到紫色品牌色调
- 主要 6 个页面与参考图风格一致：紫色 Header、白色软投影卡片、浮动胶囊 TabBar、紫色按钮
- 体感清爽、现代、轻量
- 图表延续品牌色，趋势页热力图改用紫色阶
