# 记录/账单/我的 三页面 Figma 视觉重设计

## 1. 总体设计原则（来自 Figma 图片）

- 大圆角（32-48rpx）白色卡片，右上角暖橘渐变
- 分类图标统一为**彩色圆形背景**内放 emoji
- 筛选标签：激活态深棕红圆角 pill，非激活态米黄
- 间距宽松，字体层次分明

---

## 2. 记录页（record.wxml + record.wxss）图片1

### 当前状态
- 筛选 tabs → 时间线（dot + line）→ 卡片（tag + date 顶部，title，details，nextDate）

### 目标效果
**筛选栏下方加 "健康时间线" 节标题**

**时间线卡片重构**（两种状态）：
- **upcoming（有 nextDateStr）**：白色背景 + 右上角渐变，左侧彩色图标圆（`typeColor` 背景），"UPCOMING" 珊瑚标签，标题加粗大号，"下次：date" 副文字，底部 "立即完成" 深棕红 pill 按钮 + 🔔 图标
- **completed（无 nextDateStr）**：灰色背景 `#F5F3F1`，灰色图标圆，标题正常，"已完成 · date" 副文字

**卡片布局**：左侧图标圆（80rpx） + 右侧内容 flex-1（替换原 tag + title 布局）

**圆角**：16rpx → 64rpx

### 受影响文件
- `miniprogram/pages/record/record.wxml`：重构 timeline-card 内部结构，加节标题
- `miniprogram/pages/record/record.wxss`：全量更新卡片样式，新增 upcoming/completed 变体

---

## 3. 账单页（bill.wxml + bill.wxss）图片2

### 当前状态
- 月份选择器 → 概览卡（label, amount, 逐条 bar, 链接）→ 账单列表（按日期分组）

### 目标效果
**概览卡重构**：
- 标题 "本月总支出" + 右上角钱包图标（teal 圆形）
- 金额改为：整数部分大号 + 小数部分小号（flex align-end）
- 分类 bar 改为**单行分段式横向色块**（每段按 percent 宽度，颜色对应分类）
- 分类说明改为 "● 分类名 xx%" 横向排列（不再是逐条 bar）

**筛选 tabs**（新增，位于概览卡下方）：
- 使用与记录页相同的 pill 样式，数据来源 `categoryList`（当前 JS 中已有 `categoryStats`）
- 激活态切换账单列表

**账单条目重构**：
- `bill-item` 圆角：16rpx → 32rpx
- 图标改为彩色圆形（`categoryColor` 背景），大小 80rpx
- 移除 date-group 分组，直接平铺账单卡片（保留 bill.js groupedBills 数据，但在 WXML 中嵌套展示）
- 每条账单右侧：金额 + 分类标签（小圆角 pill，使用分类颜色）
- 副标题格式：`date · note`

**"查看详细统计"** 改为 "View Monthly Report →" 样式（右上角链接）

### 受影响文件
- `miniprogram/pages/bill/bill.wxml`：重构 overview 区域，新增筛选 tabs，重构 bill-item
- `miniprogram/pages/bill/bill.wxss`：全量更新卡片/图标/金额样式

---

## 4. 我的页面（profile.wxml + profile.wxss）图片3 + Figma HTML

### 当前状态
- user-card（头像圆形 + 名字）→ pet-switcher → stats-card → menu-section → logout

### 目标效果（完全对应 Figma）

**用户区域**：
- 头像：`border-radius: 48rpx`（圆角方形，非圆形）
- 头像下方：用户名加粗大号
- 名字下方：薄荷绿 pill badge "微信云已连接"

**My Furry Family 区域**（替换 pet-switcher）：
- 标题 "我的毛孩子" + "添加宠物" 链接
- 每只宠物为独立白色卡片（`border-radius: 64rpx`）：头像圆（64rpx） + 名字 + 品种·年龄 + 编辑按钮（灰圆）
- 当前选中宠物：薄荷绿虚线描边卡片（`border: 2rpx dashed #BEE3E7; background: rgba(190,235,231,0.3)`）

**移除** stats-card（数字统计区）

**Settings & Support 区域**（替换旧 menu-section）：
- 灰色分组容器（`#F5F3F1`，`border-radius: 32rpx`）
- 每行菜单项：彩色圆形图标 + 文字 + 右箭头（或右侧值）
  - 🟡米黄：清除缓存 / 🟢薄荷绿：提醒通知 / 🍑珊瑚：语言设置 / ⬜️灰：关于我们 / 🟢薄荷绿：帮助中心
- 菜单项间无分割线（通过 padding 间隔）

**退出登录**：
- 移除旧 outline 按钮，改为居中灰色 pill（`background: #E9E8E6; color: #5E5F5D`）
- 按钮下方显示版本号文字（`v1.0.0`）

### 受影响文件
- `miniprogram/pages/profile/profile.wxml`：完全重构
- `miniprogram/pages/profile/profile.wxss`：完全重写

---

## 5. 通用样式调整（新增）

### 5.1 全局背景色
- `app.wxss` 中的 `--bg-color` 变量：`#F5F0E8` → `#FBF9F7`
- `app.json` 中的 `backgroundColor` 字段同步更新为 `#FBF9F7`

### 5.2 自定义 TabBar 顶部圆角
- `miniprogram/custom-tab-bar/index.wxss` 的 `.tab-bar` 容器：
  - 新增 `border-radius: 48px 48px 0 0`（左上 + 右上圆角 48px，左下右下为 0）
  - 同时确保 `overflow: hidden` 裁切内容

---

## 6. 边界条件

- bill 筛选 tabs：无分类数据时不显示 tabs（`wx:if="{{categoryStats.length}}"`）
- profile 无宠物时：不显示 "我的毛孩子" 区域
- record 卡片：`item.nextDateStr` 空字符串视为 completed 状态
