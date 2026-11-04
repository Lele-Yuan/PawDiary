# 来吃饭：管理员编辑饭局信息入口任务计划

- [✓] Task 1: 云函数支持编辑饭局信息（需重新部署 mealManage）
    - 1.1: family.js 的 detail 返回 family 增加 needApproval
    - 1.2: 新增 updateInfo action（管理员校验、名称非空、更新 name 与 needApproval）

- [✓] Task 2: api.js 新增封装
    - 2.1: family.updateInfo(familyId, name, needApproval)

- [✓] Task 3: 详情页编辑入口与弹窗
    - 3.1: family.js 增编辑弹窗数据与 openEdit/closeEdit/onEditName/toggleApproval/saveEdit
    - 3.2: family.wxml 头部加管理员「编辑」入口 + 编辑弹窗
    - 3.3: family.wxss 增弹窗与编辑按钮样式

- [✓] Task 4: 自测
    - 4.1: node --check 云函数与 family 页面 js
    - 4.2: 核对 wxml 弹窗与开关无语法问题
