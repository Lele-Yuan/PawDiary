# 来吃饭：管理员编辑饭局信息入口总结

## 完成情况

为饭局详情页的管理员增加「编辑饭局信息」入口，可修改饭局名称与加入审批开关，4 个任务执行并自测通过。

## 主要改动

云函数 `cloudfunctions/mealManage/family.js`：`detail` 返回的 `family` 新增 `needApproval` 供表单回填；新增 action `updateInfo`（校验管理员、名称非空后更新 `name` 与 `needApproval`）。

前端封装 `utils/api.js`：新增 `family.updateInfo(familyId, name, needApproval)`。

详情页：`family.js` 增 `showEdit/editName/editApproval` 数据与 `openEdit/closeEdit/onEditName/toggleApproval/saveEdit/stopEdit` 方法；`family.wxml` 在邀请操作行为管理员加「✏️ 编辑」入口，并在底部新增编辑弹窗（名称输入 + 「加入需审批」switch + 保存）；`family.wxss` 新增弹窗与开关行样式（沿用紫色主题）。

## 验证

`node --check` 通过 family.js（云函数/页面）与 api.js；关键符号（updateInfo、openEdit/saveEdit/toggleApproval、showEdit 弹窗、switch）均已就位。运行态需在微信开发者工具编译预览确认。

## 上线前步骤

重新「上传并部署」`mealManage` 云函数，使 `updateInfo` 与 `detail` 的 needApproval 返回生效。纯前端部分无需额外操作。

## 说明

入口与保存均限管理员（前端按 `detail.me.isAdmin` 显隐、服务端二次校验）。仅编辑名称与审批开关，不涉及邀请码、成员与约饭数据。
