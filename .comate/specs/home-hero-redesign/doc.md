# 首页视觉重设计

## 1. 宠物信息模块 — 通顶 Hero Banner

**目标**：移除原生导航栏，宠物信息区域从屏幕最顶部延伸下来，形成 Hero Banner 效果，对齐参考图"开启与毛孩子的幸福旅程"区域的形式。

**技术方案**：
- `home.json` 增加 `"navigationStyle": "custom"` 关闭原生导航栏
- `home.js` 在 `onLoad` 中通过 `wx.getSystemInfoSync()` 获取 `statusBarHeight`（单位 px），存入 `data`，传给 pet-card 组件
- `pet-card.wxml` 全量重写为 **横向 Hero 布局**：
  - 左侧：App 名称（小号）+ 宠物大名 + 品种/年龄副文本 + 两枚统计 badge（天陪伴、体重）
  - 右侧：宠物头像（圆角正方形 + 轻微旋转）
  - 右上角可见编辑按钮（替代长按）
- `pet-card.wxss` 全量重写：
  - 背景：暖橘渐变 `linear-gradient(160deg, #E8875A, #FE9D7F, #FEC4AA)`
  - 底部仅保留圆角 `border-radius: 0 0 64rpx 64rpx`，上方无圆角贴合屏幕
  - 两个装饰半透明圆形（右上、左下）
  - 统计 badge：磨砂玻璃效果 `rgba(255,255,255,0.28)`

**影响文件**：
- `miniprogram/pages/home/home.json`
- `miniprogram/pages/home/home.js`（新增 onLoad + statusBarHeight 字段）
- `miniprogram/pages/home/home.wxml`（传 statusBarHeight 给 pet-card）
- `miniprogram/pages/home/components/pet-card/pet-card.wxml`
- `miniprogram/pages/home/components/pet-card/pet-card.wxss`
- `miniprogram/pages/home/components/pet-card/pet-card.js`（新增 statusBarHeight 属性 + onEditTap 方法）

---

## 2. 快捷入口 — 圆形图标行

**目标**：对照参考图「宠物登记、状态查询…」模块风格，将当前 2×2 色块网格改为 **4 个圆形图标水平排列**，图标下方显示文字标签。

**布局**：
```
[📋 清单]  [📝 记录]  [💰 账单]  [⚖️ 体重]
```

**样式特征**：
- 每项：圆形（96rpx）彩色背景 + emoji + 下方文字标签
- 整体白色卡片背景，`border-radius: 40rpx`
- 四种圆形背景色与原入口配色一致（深棕、薄荷绿、米黄、浅灰）

**影响文件**：
- `miniprogram/pages/home/home.wxml`
- `miniprogram/pages/home/home.wxss`

---

## 3. 新增「养猫指南 / 养狗指南」模块

**目标**：参照参考图「宠物领养 / 领养指南」双卡片布局，增加两个并排的指南卡片。

**布局**：两列等宽卡片，左右各 48% 宽度，间距 16rpx

**左卡 — 养猫指南**：
- 背景色：浅紫薰衣草 `#E8DFF5`
- 标题大字：`养猫指南`
- 副文本：`了解猫咪养护知识`
- 右下角装饰 emoji：🐱（大号，半透明叠加）

**右卡 — 养狗指南**：
- 背景色：浅薄荷 `#BEE3E7`
- 标题大字：`养狗指南`
- 副文本：`狗狗养育完全手册`
- 右下角装饰 emoji：🐶

**影响文件**：
- `miniprogram/pages/home/home.wxml`
- `miniprogram/pages/home/home.wxss`

---

## 边界条件
- 无宠物时的引导页面（`guide-container`）需要加 `statusBarHeight` 的顶部内边距，避免被状态栏遮挡
- `statusBarHeight` 默认值为 44（iPhone 通用），通过 `wx.getSystemInfoSync()` 动态获取
- 指南卡片为静态展示（无跳转逻辑），后续可绑定文章页面
