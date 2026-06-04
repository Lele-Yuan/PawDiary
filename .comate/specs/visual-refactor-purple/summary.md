# 全局视觉重构 (visual-refactor-purple) - 完成总结

## 一、目标回顾

将 PawDiary 小程序整体视觉切换为「紫色品牌 + 浮动胶囊 TabBar + 软投影圆角卡片 + 柔和渐变 Header」的现代风格，覆盖 6 大主页面与全局公共资源。

## 二、完成情况

| 阶段 | 任务 | 状态 |
| :-- | :-- | :-: |
| Phase A | Task 1 重写全局设计令牌 `app.wxss` | ✅ |
| Phase A | Task 2 调整 `app.json` 系统配色 | ✅ |
| Phase A | Task 3 重构自定义 TabBar 为浮动胶囊 | ✅ |
| Phase A | Task 4 公共组件配色（nav-bar / loading / empty-state） | ✅ |
| Phase B | Task 5 首页 home 重构 | ✅ |
| Phase B | Task 6 清单 checklist 重构 | ✅ |
| Phase B | Task 7 记录 record 重构 | ✅ |
| Phase B | Task 8 趋势 record-trends 重构 | ✅ |
| Phase B | Task 9 账单 bill 重构 | ✅ |
| Phase B | Task 10 我的 profile 重构 | ✅ |
| Phase C | Task 11 全局硬编码暖色清理 | ✅ |
| Phase C | Task 12 自测与生成 summary | ✅ |

## 三、核心改动

### 1. 全局设计令牌（`miniprogram/app.wxss`）

- 替换全部 CSS 变量为紫色品牌调色板：
  - 主色 `--primary-color: #7B5CF5`、深紫 `#5A3FE0`、浅紫 `#A48BFA`、卡片底 `#EFEAFE`
  - 渐变起止 `--primary-gradient-start/end: #8B6BF7 / #6B4FF0`
  - 中性 `--bg-color: #F6F3FF`、`--card-bg: #FFFFFF`、`--card-soft-bg: #F8F5FF`
  - 文字 `--text-color: #1F1A3D` / 次要 `#6B6585` / 提示 `#B5B0C8`
  - 软色卡片背景 6 件套（紫/蓝/粉/橙/绿/黄）
  - 阴影令牌 `--shadow-card / --shadow-button / --shadow-floating`，圆角 `--radius-sm/md/lg/xl/pill`
- 新增/统一通用工具类：`.card-base / .btn-primary / .btn-secondary / .btn-outline / .soft-tag / .hero-purple`，供各页复用

### 2. 系统配色（`miniprogram/app.json`）

- `navigationBarBackgroundColor` → `#7B5CF5`，文字保留 white
- 自定义 tabBar 配色与背景色统一为紫色阶
- `backgroundColor: #F6F3FF`

### 3. 浮动胶囊 TabBar（`miniprogram/custom-tab-bar/`）

- 距底部 32rpx 的浮动胶囊，深紫渐变背景 + 圆角 `999rpx` + 软投影
- 5 个 tab 图标白色，选中态高亮圆点

### 4. 公共组件

| 组件 | 改动 |
| :-- | :-- |
| `components/nav-bar` | 紫色渐变 hero 背景，白字标题，返回箭头白色 |
| `components/loading` | spinner 颜色改 `var(--primary-color)`，文字使用 `--text-secondary` |
| `components/empty-state` | icon 容器底改 `--primary-bg`，文字使用 `--text-secondary / --text-light` |

### 5. 主要页面深度适配

- **home**：Header 紫色渐变大卡，pet-card 紫色渐变，提醒条目软投影白卡 + 软色分类标签 + 状态圆点
- **checklist**：任务卡片白底软投影，紫色实心/空心完成态指示，重启按钮紫色 outline
- **record**：tab 筛选条紫色（`--primary-bg / --primary-color`），趋势入口胶囊紫色，timeline-line 柔紫 `#E4DCFB`，complete 按钮紫色实心
- **record-trends**：hero 卡片紫色渐变 + 白字，range-tab active 紫底白字未选中白底浅紫阴影；体重折线主色 `#7B5CF5` 数据点白填紫描边；网格线 `#ECE7F7`；热力图空格底改 `#F0EBFC`，类型色保留语义
- **bill**：月度概览卡改紫色渐变 hero（金额、icon、装饰圆均白系），金额、月份、链接、月份箭头紫色，列表卡片软投影；bill-stats 全部 `#6B2D1A` 替换为 `--primary-color`，分隔/进度条底色用 `--primary-bg`
- **profile**：头部紫色渐变（已有），菜单分组白卡 + 软色 emoji 容器

### 6. 全局清理（Task 11）

- 全局 grep 已无残留：`#E8875A / #6B2D1A / #F5C4A8 / #f9d568 / #f0c6ae / #FE9D7F / #954931`
- 主要页面的 `rgba(232,135,90,...)` / `rgba(107,45,26,...)` / `rgba(149,73,49,...)` 等暖色阴影统一替换为 `rgba(123, 92, 245, ...)` 紫色阴影
- 次要页面（pet-edit / invite / care / visit / map / memorial）按 doc 范围说明保留暖色，自然继承全局令牌

## 四、文件清单（核心改动）

| 文件 | 性质 |
| :-- | :-- |
| `miniprogram/app.wxss` | 全量令牌与工具类 |
| `miniprogram/app.json` | 系统配色 |
| `miniprogram/custom-tab-bar/*` | 浮动胶囊 |
| `miniprogram/components/{nav-bar,loading,empty-state}/*` | 配色统一 |
| `miniprogram/pages/home/home.wxss` 等 | 暖色 → 紫色 |
| `miniprogram/pages/checklist/checklist.wxss` | 紫色 + 重启按钮 |
| `miniprogram/pages/record/record.wxss` | tab/趋势入口/进度条紫色 |
| `miniprogram/pages/record/record-trends/record-trends.{wxss,js}` | hero 紫渐变 + 折线/热力图色阶 |
| `miniprogram/pages/bill/bill.wxss` | hero 紫渐变全替换 |
| `miniprogram/pages/bill/bill-stats/bill-stats.wxss` | 暖色 → 紫色 |
| `miniprogram/pages/profile/profile.wxss` | 紫渐变保留 |

## 五、视觉效果

- 启动小程序首屏即为紫色品牌色调
- 6 大核心页面统一：紫色渐变 Header / 白色软投影圆角卡片 / 浮动胶囊 TabBar / 紫色按钮
- 趋势页 4 张图表配色协调（体重紫线 / 食水绿蓝双线 / 健康类型色 / 美容多色）
- 账单首屏紫色渐变 hero 一目了然，月报子页全紫色调

## 六、已知妥协

按 doc.md 第六节说明，下列次要页面暂未在本次范围中，保留暖色（仍可正常使用，颜色会随后续推进同步）：

- `pages/pet-edit/*`、`pages/invite/*`、`pages/care/*`、`pages/visit/*`
- `pages/map/*`、`pages/memorial/*`
- `pages/dogti/*`（自有视觉系统）

## 七、回归验证要点

1. 5 个底部 tab 切换正常，浮动胶囊 TabBar 在所有 tab 页正确显示
2. 趋势页折线/热力图配色统一无突兀
3. 暗色文字（`--text-color: #1F1A3D`）在白卡上清晰可读；白色文字在紫色 hero 上对比度足够
4. 记录详情/添加流程仍可走通，颜色无错位
