# 三页面 + 通用样式 Figma 重设计 — 完成总结

## 变更文件一览

| 文件 | 变更内容 |
|------|---------|
| `miniprogram/app.wxss` | `--bg-color` → `#FBF9F7` |
| `miniprogram/app.json` | `backgroundColor` → `#FBF9F7` |
| `miniprogram/custom-tab-bar/index.wxss` | TabBar 顶部圆角 48px，移除 border-top，添加阴影 |
| `miniprogram/pages/record/record.wxml` | 新增节标题，卡片改为图标圆+内容，upcoming/completed 两态 |
| `miniprogram/pages/record/record.wxss` | 完全重写：64rpx 圆角，upcoming 渐变白/completed 灰底，完成按钮 |
| `miniprogram/pages/bill/bill.js` | 新增 `monthTotalMain/Cents`；账单条目加 `categoryLabel/categoryColor/dateStr` |
| `miniprogram/pages/bill/bill.wxml` | 概览卡重构（分段 bar+图例），账单条目改为圆形图标+金额标签 |
| `miniprogram/pages/bill/bill.wxss` | 完全重写：概览右上角渐变，分段 bar，账单 32rpx 圆角卡片 |
| `miniprogram/pages/profile/profile.wxml` | 完全重构：用户区+云 badge，我的毛孩子卡片列表，设置分组，灰色 pill 退出 |
| `miniprogram/pages/profile/profile.wxss` | 完全重写：对应新结构全量样式 |
| `miniprogram/pages/profile/profile.js` | `onSwitchPet` 改为支持 `dataset.petId`（兼容新 bindtap 方式） |

## 核心设计亮点

**通用**
- 全局背景 `#FBF9F7` 更柔和，TabBar 顶部 48px 圆角悬浮感

**记录页**
- "健康时间线" 节标题 + 类型图标圆形（typeColor 半透明背景）
- Upcoming 卡片：白底渐变 + 珊瑚 `UPCOMING` 标签 + "立即完成" 深棕红 pill + 🔔
- Completed 卡片：`#F5F3F1` 灰底 + "已完成 · 日期" 副文字

**账单页**
- 概览卡：整数大号+小数小号金额，单行分段彩色 bar，横排分类图例
- 账单条目：彩色圆形图标，右侧金额+分类 pill 标签（使用分类专属颜色）

**我的页面**
- 头像方形圆角（48rpx），薄荷绿云 badge
- "我的毛孩子" 全卡片列表（当前选中宠物：薄荷绿虚线描边卡片）
- 设置分组：灰底圆角容器，每行白色子卡片，彩色 emoji 图标圆
- 退出登录：灰色 pill 按钮 + 版本号文字
