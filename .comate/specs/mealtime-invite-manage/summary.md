# 来我家吃饭（mealtime）邀请分享与成员管理增强总结

## 完成情况

按确认范围补全两组后续能力，5 个任务全部完成：微信转发分享闭环、成员管理增强（退出/解散/刷新邀请码）。改动集中在 mealManage 云函数与 mealtime 前端页面，未触碰宿主其它模块与数据结构。

## 主要改动

云函数 `cloudfunctions/mealManage/family.js`：新增 `leave`（成员退出，发起人拦截并提示先解散）、`dissolve`（发起人解散，批量清理 meal_memberships / meal_meals / meal_items 后删除 meal_families）、`refreshCode`（管理员生成新唯一邀请码并更新）；新增 `removeAll` 分页批量删除与 `uniqueCode` 辅助。

前端封装 `pages/mealtime/utils/api.js`：新增 `family.leave`、`family.dissolve`、`family.refreshCode`。

转发闭环：`family/family.js` 新增 `onShareAppMessage`，分享路径 `/pages/mealtime/index/index?inviteCode=CODE`；`index/index.js` 的 `onLoad` 检测 `inviteCode` 并在用户就绪后调用新抽取的 `joinByCode` 自动加入（`doJoin` 复用之），并补 `onShareAppMessage`。`family.wxml` 顶部新增「邀请家人加入」分享按钮。

成员管理入口：`family/family.js` 新增 `refreshCode`、`leaveFamily`、`dissolveFamily`（均二次确认）；`family.wxml` 新增管理员可见「换码」按钮、按身份显隐的「退出饭局 / 解散饭局」入口；`family.wxss` 新增对应按钮样式，沿用珊瑚主题变量。

## 验证

对改动的云函数与页面 js 执行 `node --check` 均通过；确认云端新增 leave/dissolve/refreshCode 三个 action、api 三个封装、页面 onShareAppMessage 与管理方法均已就位。运行态分享与加入流程需在微信开发者工具中编译预览确认（转发需真机或工具的分享调试）。

## 上线前步骤

重新部署 `mealManage` 云函数（右键 → 上传并部署：云端安装依赖），使新增的 leave / dissolve / refreshCode 动作生效。无需新增集合。

## 行为说明

非成员点开转发卡片：懒创建用户后按邀请码加入，需审批的饭局自动提交申请；已是成员则直接进入详情。发起人退出被拦截，需改用解散。解散不可逆，前端二次确认，云端仅按当前 familyId 清理，不影响其它饭局。刷新邀请码后旧码立即失效。
