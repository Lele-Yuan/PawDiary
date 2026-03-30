# 宠物管家小程序视觉重设计方案

## 1. 需求背景

参照 Figma 设计稿（5 个主页面截图：首页、记录、账单、清单、个人中心），对当前已实现的微信小程序进行全面视觉风格升级。

当前视觉：以鲜橙色 `#FF6B35` 为主，冷灰背景 `#F7F8FA`，导航栏纯白。
目标视觉：温暖珊瑚色 + 多元色彩体系 + 暖奶油背景，具有更强的温馨宠物应用感。

---

## 2. 设计系统分析（从截图提取）

### 2.1 色彩体系

| 用途 | 当前颜色 | 目标颜色 | 说明 |
|------|---------|---------|------|
| 主色（导航栏/激活态） | `#FF6B35` | `#E8875A` | 温暖珊瑚橙，比当前更柔和 |
| 深色主按钮（CTA） | 渐变橙 | `#6B2D1A` | 深棕红，用于"添加事件"等主要操作按钮 |
| 辅色-薄荷绿 | — | `#8ECFC9` | 体重/新功能/清单分类等辅助色 |
| 辅色-暖米黄 | `#FFF0E6` | `#EDD9A3` | 喂食/清单等元素背景 |
| 辅色-浅灰 | — | `#EBEBEB` | 拍照等中性操作 |
| 页面背景 | `#F7F8FA` | `#F5F0E8` | 温暖奶油白，而非冷灰 |
| 主文字 | `#1A1A2E` | `#2D2D2D` | 纯粹近黑色 |
| 次要文字 | `#8E8EA0` | `#888888` | 中灰色 |
| 进度条填充 | 橙色渐变 | `#3D6B5E` | 深森林绿/青色 |
| 金额/金融数字 | `#FF6B35` | `#6B2D1A` | 深棕红 |

**新增 CSS 变量：**
```css
--nav-bg: #E8875A;          /* 导航栏背景 */
--primary-dark: #6B2D1A;    /* 深色主按钮 */
--teal-color: #8ECFC9;      /* 薄荷绿辅色 */
--teal-light: #C5E8E2;      /* 薄荷绿浅色背景 */
--beige-color: #EDD9A3;     /* 暖米黄辅色 */
--beige-light: #F5EDD0;     /* 暖米黄浅色背景 */
--progress-color: #3D6B5E;  /* 进度条深绿 */
```

### 2.2 导航栏（nav-bar 组件）

**当前：** 纯白背景 + 深色文字 + 底部细线
**目标：** 珊瑚橙实色背景（`#E8875A`）+ 白色文字/图标，无底部分割线

变更内容：
- `background-color`: `#FFFFFF` → `#E8875A`
- `border-bottom`: 去除
- `.back-icon` 颜色: `#1A1A2E` → `#FFFFFF`
- `.nav-bar-title` 颜色: `#1A1A2E` → `#FFFFFF`

### 2.3 全局配置（app.json）

- `navigationBarBackgroundColor`: `#FFFFFF` → `#E8875A`
- `navigationBarTextStyle`: `black` → `white`
- `backgroundColor`: `#F7F8FA` → `#F5F0E8`
- `tabBar.selectedColor`: `#FF6B35` → `#E8875A`

### 2.4 宠物卡片（pet-card 组件）

**当前：** 橙色渐变背景，横向布局（头像在左，信息在右）
**目标：** 纯白卡片，垂直居中布局（头像在上，姓名/品种/年龄居中，统计badge横排）

目标结构：
```
[ 大圆形头像（中心，带黑色圆形背景） ]
[ 宠物名（大加粗） ]
[ 品种 • 年龄 ]
[ 粉色badge: DAYS WITH ME 520 ] [ 青色badge: CURRENT WEIGHT 12.5kg ]
```

关键样式变更：
- 卡片背景：橙渐变 → 纯白 `#FFFFFF`
- 布局：横向 → 垂直居中（`flex-direction: column; align-items: center`）
- 头像：`140rpx` → `180rpx`，边框白 → 无边框，添加深色圆形底座
- 宠物名字体：`40rpx` 白色 → `64rpx` 深色 `#2D2D2D`
- 品种文字：标签改为纯文字，颜色 `#888888`
- 统计行：白色半透明条 → 两个独立彩色 badge
  - "陪伴天数" badge: `background: #F9D5CC; color: #8B4035`
  - "当前体重" badge: `background: #C5E8E2; color: #2D7066`

### 2.5 宠物切换器（pet-switcher 组件）

**当前：** 白色背景区域，头像带橙色边框选中态
**目标：** 透明/奶油背景，选中态使用珊瑚色边框

变更内容：
- 背景 `#FFFFFF` → `transparent`（融入页面背景）
- 选中头像边框：`#FF6B35` → `#E8875A`
- 选中名字颜色：`#FF6B35` → `#E8875A`
- 添加按钮虚线：`#B8B8C8` → `#CCCCCC`

### 2.6 首页（home.wxss）

**快捷入口区域重设计：** 从小图标格子 → 2×2 大圆角矩形按钮
```
[ 深棕红 "添加事件" (+图标) ] [ 薄荷绿 "新记录体重" (图标) ]
[ 暖米黄 "记录喂食" (图标) ]  [ 浅灰 "拍照记录" (图标) ]
```

- `.entry-grid`: `justify-content: space-around` → `display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx`
- `.entry-item`: 重构为大圆角矩形 (`border-radius: 24rpx; height: 180rpx`)
- `.entry-icon` 4种颜色变体（深棕红/薄荷绿/暖米黄/浅灰）
- 标签文字颜色根据背景调整（深棕红/薄荷绿 → 白色，暖米黄/浅灰 → 深色）

**提醒/日程区域：**
- `section-more` 颜色: `#FF6B35` → `#E8875A`（保持珊瑚色）
- 倒计时数字: `#FF6B35` → `#6B2D1A`（深棕红）

### 2.7 记录页（record.wxss）

**标签筛选栏：**
- 激活态（当前：橙色渐变+白字）→ **深棕红实色 `#6B2D1A` + 白字**
- 非激活态（当前：浅灰背景）→ **暖米黄 `#F5EDD0` + 深棕文字 `#6B2D1A`**
- 标签背景栏：白色 → 奶油背景 `#F5F0E8`

**时间线：**
- 时间线连线：`#EEEEF2` → `#E0D8CC`（暖灰）
- 时间线卡片背景：白色（保持不变）
- "下次提醒" 背景：`#FFF7E6` → `#F5EDD0`

### 2.8 账单页（bill.wxss）

- 月份箭头颜色：`#FF6B35` → `#E8875A`
- 货币符号/金额颜色：`#FF6B35` → `#6B2D1A`（深棕红）
- 账单金额颜色：`#FF4757`（红） → `#6B2D1A`（深棕红）
- 账单图标背景：`#FFF0E6` → 根据分类使用不同浅色（薄荷绿浅/米黄浅/浅灰）
- 统计链接颜色：`#FF6B35` → `#E8875A`

### 2.9 清单页（checklist.wxss）

- 宠物标签：背景 `rgba(255,107,53,0.1)` → `#F5EDD0`，颜色 `#FF6B35` → `#6B2D1A`
- 卡片图标背景：`#FFF0E6` → 交替使用 `#F5EDD0`（米黄）/ `#C5E8E2`（薄荷绿浅）
- 进度百分比颜色：`#FF6B35` → `#6B2D1A`（未完成）/ `#3D6B5E`（已完成）
- 全局进度条填充：橙色渐变 → `#3D6B5E`（深森林绿）

### 2.10 个人中心（profile.wxss）

- 头像边框：`#FF6B35` → `#E8875A`
- 统计数值颜色：`#FF6B35` → `#6B2D1A`
- 编辑按钮背景：`rgba(255,107,53,0.1)` → `rgba(107,45,26,0.1)`，颜色 → `#6B2D1A`
- 退出登录按钮：`#FF4757` → `#888888`（设计中退出是灰色，更克制）

### 2.11 全局 app.wxss 变量与组件

**CSS 变量更新：**
```css
--primary-color: #E8875A;       /* 珊瑚橙（导航/激活/FAB） */
--primary-dark: #6B2D1A;        /* 深棕红（主CTA按钮/金额/强调） */
--primary-light: #F5C4A8;       /* 浅珊瑚（浅色背景块） */
--secondary-color: #F5EDD0;     /* 暖米黄（次级背景） */
--teal-color: #8ECFC9;          /* 薄荷绿 */
--teal-light: #C5E8E2;          /* 薄荷绿浅 */
--beige-color: #EDD9A3;         /* 暖米黄深 */
--progress-color: #3D6B5E;      /* 进度条深绿 */
--bg-color: #F5F0E8;            /* 暖奶油背景 */
--text-color: #2D2D2D;          /* 主文字近黑 */
--text-secondary: #888888;      /* 次要文字灰 */
```

**通用组件样式更新：**
- `.btn-primary`: 渐变橙 → `background: #6B2D1A`（深棕红实色）
- `.fab-btn`: 渐变橙 → `background: #E8875A`（珊瑚橙实色）
- `.progress-fill`: 橙色渐变 → `background: #3D6B5E`
- `.tag-primary`: 橙色系 → 棕红系（`background: rgba(107,45,26,0.1); color: #6B2D1A`）

---

## 3. 受影响的文件清单

| 文件路径 | 修改类型 | 核心变更内容 |
|---------|---------|------------|
| `miniprogram/app.json` | 修改 | navBar颜色、tabBar选中色、页面背景色 |
| `miniprogram/app.wxss` | 修改 | 全部CSS变量 + 通用组件样式 |
| `miniprogram/components/nav-bar/nav-bar.wxss` | 修改 | 背景色→珊瑚色、文字→白色 |
| `miniprogram/components/pet-switcher/pet-switcher.wxss` | 修改 | 背景透明化、选中色同步 |
| `miniprogram/components/empty-state/empty-state.wxss` | 修改 | 图标背景色跟随变量 |
| `miniprogram/pages/home/components/pet-card/pet-card.wxss` | 修改（大改） | 整体布局从横向→竖向居中，白卡片+彩色badge |
| `miniprogram/pages/home/home.wxss` | 修改 | 快捷入口2×2按钮重设计，颜色更新 |
| `miniprogram/pages/record/record.wxss` | 修改 | 标签激活/非激活态颜色，时间线颜色 |
| `miniprogram/pages/bill/bill.wxss` | 修改 | 金额色系、图标背景、链接颜色 |
| `miniprogram/pages/checklist/checklist.wxss` | 修改 | 标签颜色、图标背景、进度色 |
| `miniprogram/pages/profile/profile.wxss` | 修改 | 头像边框、统计色、退出按钮 |

---

## 4. 边界条件与注意事项

1. **微信小程序 navigationBar 限制**：`app.json` 中的 `navigationBarBackgroundColor` 只接受 hex 色值。使用自定义 nav-bar 组件的页面需同步更新组件样式，非自定义导航页面已通过 app.json 控制。
2. **tabBar 图标色**：微信 tabBar 通过 `selectedColor` 控制文字色，图标本身使用 PNG 文件，选中图标需要与新主色 `#E8875A` 匹配（现有 active 图标为橙色，与珊瑚色接近，可接受）。
3. **pet-card 布局重构**：wxml 结构不变，仅通过 wxss 实现垂直布局，部分样式需要父容器配合（外部 `card` 类提供白色背景和圆角）。
4. **进度条颜色**：`app.wxss` 中的 `.progress-fill` 将统一更新，影响所有页面的进度条显示，包括清单进度和统计图。

---

## 5. 预期效果

- 整体氛围从"商务橙科技感"转变为"温暖宠物管家"
- 色彩更加丰富有层次（珊瑚 + 深棕红 + 薄荷绿 + 暖米黄）
- 宠物卡片从装饰渐变背景变为信息更清晰的白卡片布局
- 快捷操作按钮更大更易点击，颜色区分不同功能类型
- 进度条从橙色改为森林绿，与宠物健康/自然感匹配
