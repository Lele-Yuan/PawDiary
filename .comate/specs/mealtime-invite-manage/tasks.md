# 来我家吃饭（mealtime）邀请分享与成员管理增强任务计划

- [x] Task 1: 云函数 family.js 新增管理动作
    - 1.1: 新增 removeAll(col, where) 分页批量删除辅助
    - 1.2: 新增 leave（成员退出，发起人拦截）
    - 1.3: 新增 dissolve（发起人解散，清理 memberships/meals/items/family）
    - 1.4: 新增 refreshCode（管理员生成新唯一邀请码并更新）

- [x] Task 2: api.js 新增封装
    - 2.1: family.leave / family.dissolve / family.refreshCode

- [x] Task 3: 转发分享闭环
    - 3.1: family.js 新增 onShareAppMessage（携带邀请码指向首页）
    - 3.2: family.wxml 新增「邀请家人加入」分享按钮
    - 3.3: index.js onLoad 检测 inviteCode 自动加入，重构 doJoin 复用 autoJoin，补 onShareAppMessage

- [x] Task 4: 成员管理入口与交互
    - 4.1: family.js 新增 refreshCode / leaveFamily / dissolveFamily 方法
    - 4.2: family.wxml 新增换码按钮、退出/解散入口（按身份显隐）
    - 4.3: family.wxss 新增按钮样式（沿用主题变量）

- [x] Task 5: 自测
    - 5.1: node --check 云函数与页面 js，确认语法正确、无残留问题
