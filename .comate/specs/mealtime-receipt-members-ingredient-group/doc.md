# 来吃饭：历史小票记录当时成员 + 食材按类型分类设计

## 一、需求

1. 历史小票中记录「当时的成员有哪些」：小票应展示该次约饭下单时饭局的成员名单，而非仅点过菜的人。
2. 添加菜品页「选择食材」按类型（蔬菜/肉类/水产/蛋奶/主食/调料）分组展示，便于查找。

## 二、现状

小票数据由云函数 `mealManage` 的 `meal.receipt`（`order.js` 的 `buildReceipt`）生成，仅含菜品、点菜人 pickers、食材/口味汇总、总时长，无成员名单。下单 `submit` 时会写入每条 `dishSnapshot` 并锁定，但未快照成员。

食材库 `meal_ingredients` 每条已含 `category` 字段；`dishEdit` 当前把 `ingLib` 平铺为一排 chips，未分组。

## 三、方案

### 成员快照（服务端，需重新部署 mealManage）

`order.js` 的 `submit` 在下单锁定时，查询 `meal_memberships`（status=1）并关联 `meal_users`，把当时成员快照写入 meal 文档字段 `memberSnapshot`，元素为 `{userId, nickName, avatarUrl}`。下单即定格，之后成员增减不影响历史小票。

`buildReceipt` 返回新增 `members: meal.memberSnapshot || []` 与 `memberCount`。历史小票（已完成）与已下单小票都会带出当时成员；下单前（status 0）或旧数据无快照时返回空数组。

`receipt.wxml` 在汇总区新增「🧑‍🍳 当时成员（N 人）」小节，列出成员昵称（头像首字/头像）。空则不显示（兼容旧小票）。

### 食材分类（纯前端）

`dishEdit.js` 加载 `ingLib` 后，按 `category` 归组为有序数组 `ingGroups: [{ category, items: [...] }]`，分类顺序沿用云端返回的 sort 顺序（首次出现先后）。`dishEdit.wxml` 将食材区由单排 chips 改为「分类标题 + 该类 chips」的分组渲染；`pickedIng` 仍以 `name` 为键，`toggleIng` 不变。口味保持平铺。`dishEdit.wxss` 增加分类小标题样式。

## 四、受影响文件

- `cloudfunctions/mealManage/order.js`：submit 写 memberSnapshot；buildReceipt 返回 members/memberCount（需重新部署云函数）。
- `miniprogram/pages/mealtime/receipt/receipt.wxml`：新增「当时成员」小节。
- `miniprogram/pages/mealtime/dishEdit/dishEdit.js`：生成 ingGroups。
- `miniprogram/pages/mealtime/dishEdit/dishEdit.wxml`：食材分组渲染。
- `miniprogram/pages/mealtime/dishEdit/dishEdit.wxss`：分类标题样式。

## 五、边界与预期

- 旧的历史小票（下单前已存在、无 memberSnapshot）不显示成员小节，不报错。
- 成员快照取下单那一刻的在册成员（status=1），被移除/退出的成员若在下单后变动不影响该小票。
- 食材分组按云端 sort 的分类先后排列；某分类无数据则不出现该组。
- 预期：历史小票显示当时成员名单；添加菜品的食材选择按类型分组清晰可选。
