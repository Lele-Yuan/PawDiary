# 来吃饭：管理员编辑饭局信息入口设计

## 一、需求

在饭局详情页为管理员增加「编辑饭局信息」的入口，可修改饭局名称与「加入是否需要审批」开关。

## 二、现状

饭局文档 `meal_families` 字段：`name`、`founderId`、`inviteCode`、`needApproval`、`createdAt`。`family.detail` 返回的 `family` 仅含 `{_id, name, inviteCode, isFounder}`，不含 `needApproval`。详情页管理员已有「换码」「退出/解散」等操作，但无编辑饭局信息入口。创建/加入在首页用弹窗交互（`.mask/.modal`），是模块既有模式。

## 三、方案

可编辑字段：饭局名称 `name`、加入审批 `needApproval`（开关）。仅管理员可操作。

云函数 `mealManage/family.js`：
- `detail` 的返回 `family` 增加 `needApproval`，供编辑表单回填。
- 新增 action `updateInfo`：校验管理员；`name` 去空校验非空；更新 `{ name, needApproval }`。

前端封装 `utils/api.js`：新增 `family.updateInfo(familyId, name, needApproval)`。

详情页 `family/family.js` + `family.wxml`：
- 头部名称行为管理员显示「✏️ 编辑」入口（`detail.me.isAdmin` 时）。
- 新增编辑弹窗（复用模块 `.mask/.modal` 风格）：名称输入框 + 「加入需审批」`switch`。
- 方法：`openEdit/closeEdit/onEditName/toggleApproval/saveEdit`，保存调用 `api.family.updateInfo` 后 `load()` 刷新并关闭。
- `family.wxss` 增加弹窗与编辑按钮样式（沿用紫色主题变量）。

## 四、受影响文件

- `cloudfunctions/mealManage/family.js`：detail 增 needApproval；新增 updateInfo（需重新部署 mealManage）。
- `miniprogram/pages/mealtime/utils/api.js`：新增 family.updateInfo。
- `miniprogram/pages/mealtime/family/family.js`：编辑弹窗数据与方法。
- `miniprogram/pages/mealtime/family/family.wxml`：编辑入口 + 弹窗。
- `miniprogram/pages/mealtime/family/family.wxss`：弹窗与按钮样式。

## 五、边界与预期

- 仅管理员可见入口、服务端二次校验管理员权限。
- 名称为空拦截提示；`needApproval` 为开关布尔。
- 不改邀请码、成员与约饭数据。预期：管理员可在详情页编辑饭局名称与审批开关，保存后即时刷新。上线前需重新部署 `mealManage`。
