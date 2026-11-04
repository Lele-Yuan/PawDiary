# 来吃饭：历史小票成员昵称前显示头像总结

## 完成情况

将小票「当时成员」小节由纯文字昵称改为「头像 + 昵称」展示，2 个任务完成。纯前端改动，不涉及云函数与数据结构。

## 主要改动

- `receipt/receipt.wxml`：当时成员小节改为成员胶囊，每项左侧头像（有 avatarUrl 显示图片，无则昵称首字兜底圆形紫底）+ 右侧昵称。数据沿用 `r.members`（含 avatarUrl/nickName）。
- `receipt/receipt.wxss`：新增 `.mem-chips/.mem-chip/.mem-ava/.mem-nick` 样式，沿用紫色主题。

## 验证

确认 wxml 成员块与 wxss 样式均到位、无残留纯文字昵称 chip。运行态需在微信开发者工具编译预览确认。

## 说明

成员头像来自下单时的 `memberSnapshot`，旧小票无 members 时该小节本就隐藏。无需重新部署云函数。
