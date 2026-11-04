# 来吃饭：成员头像 + 点菜页菜品折叠与食材搜索设计

## 一、需求（三项）

1. 饭局列表（首页）与历史小票页展示成员头像。
2. 点菜页菜品按「大厨」分组为可折叠面板（展开/收起），取代当前左侧单选。
3. 点菜页搜索支持按菜名 + 食材名匹配，并跨全部大厨显示结果。

## 二、现状

- 首页 `family.myList` 返回每个饭局的 memberCount/cookCount，无成员头像。历史页 `meal.history` 返回每次约饭摘要，无成员。下单时已写入 `memberSnapshot`（含 nickName/avatarUrl）。
- 点菜页是两栏：左侧 `.nav` 大厨单选，右侧只显示选中大厨的菜品；顶部已有搜索框，但 `f.match` 仅按菜名过滤，且只在选中大厨内生效。

## 三、方案

### 成员头像（需重新部署 mealManage）

- `family.js` 的 `myList`：加载各饭局在册成员对应用户，附带 `members: [{avatarUrl,nickName}]`（取前 5 个）。
- `order.js` 的 `history`：每条约饭附带 `members`（取 `memberSnapshot` 前 5 个）与 `memberCount`。
- 首页 `index.wxml` 饭局卡片、历史页 `history.wxml` 卡片新增头像行：头像叠加显示，缺头像用昵称首字兜底；对应 wxss 增样式。

### 点菜页折叠（前端）

- `order.wxml` 右侧改为单列手风琴：每个大厨一个可折叠分组，组头显示「🍳 名字 的拿手菜」+ 菜品数 + 展开箭头，点击切换；移除左侧 `.nav` 两栏布局。
- `order.js`：data 增 `collapsed: {}`，新增 `toggleGroup`；默认展开。
- 搜索态强制展开所有分组以显示命中结果。

### 食材搜索（前端）

- `order.wxml` 的 wxs 由 `match(name,kw)` 改为 `hit(dish,kw)`：命中菜名或任一食材名即显示；跨全部大厨分组过滤。
- 顶部搜索框 placeholder 调整为「搜菜名或食材」。

## 四、受影响文件

- `cloudfunctions/mealManage/family.js`（myList 附成员头像）
- `cloudfunctions/mealManage/order.js`（history 附成员）
- `miniprogram/pages/mealtime/index/index.wxml` / `index.wxss`（饭局卡片头像行）
- `miniprogram/pages/mealtime/history/history.wxml` / `history.wxss`（历史卡片头像行）
- `miniprogram/pages/mealtime/order/order.wxml` / `order.js` / `order.wxss`（折叠分组 + 食材搜索）

云端 myList/history 改动需重新部署 `mealManage`。

## 五、边界与预期

- 历史小票成员头像来自下单时的 `memberSnapshot`，早于该功能的旧记录无头像则不显示头像行。
- 头像最多展示 5 个，超出显示「+N」。
- 折叠状态仅前端会话内有效；搜索时忽略折叠、展示全部命中。
- 搜索空关键字时恢复分组折叠显示。
- 预期：首页与历史卡片直观看到参与成员；点菜页可折叠大厨分组、并按菜名或食材快速检索。
