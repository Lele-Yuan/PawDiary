# 来吃饭：历史小票记录当时成员 + 食材按类型分类任务计划

- [✓] Task 1: 云函数成员快照（需重新部署 mealManage）
    - 1.1: order.js 的 submit 下单时查询在册成员并关联用户，写入 meal 的 memberSnapshot
    - 1.2: buildReceipt 返回 members 与 memberCount

- [✓] Task 2: 小票页展示当时成员
    - 2.1: receipt.wxml 在汇总区新增「当时成员」小节（空则隐藏）

- [✓] Task 3: 添加菜品食材按类型分组
    - 3.1: dishEdit.js 把 ingLib 归组为有序 ingGroups
    - 3.2: dishEdit.wxml 食材区改为分类标题 + 分组 chips
    - 3.3: dishEdit.wxss 增加分类小标题样式

- [✓] Task 4: 自测
    - 4.1: node --check 云函数与改动页面 js
    - 4.2: 核对分组渲染与成员小节 wxml 无语法问题
