# 来吃饭：历史小票记录当时成员 + 食材按类型分类总结

## 完成情况

两项需求均完成，4 个任务执行并自测通过。

## 主要改动

成员快照（服务端）：`cloudfunctions/mealManage/order.js` 的 `submit` 在下单锁定时，查询 `meal_memberships`（status=1）并关联 `meal_users`，把当时成员快照 `memberSnapshot: [{userId,nickName,avatarUrl}]` 写入 meal 文档；`buildReceipt` 新增返回 `members` 与 `memberCount`。下单即定格，之后成员增减不影响该历史小票。

小票展示：`receipt/receipt.wxml` 在汇总区新增「🧑‍🍳 当时成员（N 人）」小节，列出成员昵称；无数据（旧小票）时自动隐藏，兼容历史数据。

食材分类（前端）：`dishEdit/dishEdit.js` 新增 `groupByCategory`，把 `ingLib` 按 `category` 归组为有序 `ingGroups`（顺序沿用云端 sort）；`dishEdit.wxml` 食材区改为「分类标题 + 该类 chips」的分组渲染，`pickedIng` 仍以 name 为键、`toggleIng` 不变；`dishEdit.wxss` 新增分类小标题样式。口味保持平铺。

## 验证

`node --check` 通过 order.js / dishEdit.js / receipt.js；关键符号（memberSnapshot、members/memberCount、ingGroups/groupByCategory、当时成员小节、分组渲染）均已就位。运行态需在微信开发者工具编译预览确认。

## 上线前步骤

重新「上传并部署」`mealManage` 云函数，使 submit 写入成员快照、receipt 返回成员名单生效。食材分类为纯前端改动，无需额外操作（依赖 meal_ingredients 的 category 字段，已随基础数据写入）。

## 说明

成员快照取下单那一刻的在册成员；在此之前已下单/完成的旧小票无快照，小票不显示成员小节，属兼容预期。若需为历史旧数据补成员，可另行处理，本次不涉及。
