# 来吃饭：成员头像 + 点菜页折叠与食材搜索总结

## 完成情况

三项需求全部完成，6 个任务执行并自测通过。

## 主要改动

成员头像（服务端，需重新部署 mealManage）：
- `family.js` 的 `myList` 为每个饭局附 `members`（前 5 个 {avatarUrl,nickName}）。
- `order.js` 的 `history` 为每条约饭附 `members`（取 `memberSnapshot` 前 5）与 `memberCount`。
- 首页 `index.wxml`/`index.wxss` 饭局卡片、历史页 `history.wxml`/`history.wxss` 卡片新增头像叠加行（缺图用昵称首字兜底，超 5 人显示 +N / 当时 N 人）。

点菜页折叠（前端）：`order.js` 增 `collapsed` 与 `toggleGroup`、移除左栏单选；`order.wxml` 右侧由两栏改为单列手风琴，每个大厨为可展开/收起分组，组头显示菜品数与箭头；`order.wxss` 增折叠分组样式并为内容留出底部结算栏空间。

食材搜索（前端）：`order.wxml` 的 wxs 由 `match(name,kw)` 改为 `hit(dish,kw)`，命中菜名或任一食材名即显示，跨全部大厨过滤；搜索态强制展开所有分组；搜索框 placeholder 改为「搜菜名或食材」。

## 验证

`node --check` 通过 family.js / order.js（云函数）与 order/index/history 页面 js；关键符号（members 附带、toggleGroup/collapsed、f.hit、ava-row）均到位；无残留 selectOwner/activeOwner/f.match 旧引用。运行态需在微信开发者工具编译预览确认。

## 上线前步骤

重新「上传并部署」`mealManage` 云函数，使 myList/history 返回成员头像生效。点菜页折叠与搜索为纯前端改动。

## 说明

历史小票头像来自下单时的 `memberSnapshot`，早于该功能的旧约饭无头像则不显示头像行。头像最多 5 个，超出以 +N / 当时 N 人提示。折叠状态仅前端会话内有效，搜索时忽略折叠展示全部命中。
