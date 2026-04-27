# 完成总结

## 变更内容

### Task 1 — 云函数（`cloudfunctions/visitManage/index.js`）
- `addRecord`：record 对象中新增 `title: data.title || ''`
- `updateRecord`：白名单数组中加入 `'title'`，使编辑时可更新标题

### Task 2 — 表单页 JS（`visit-add.js`）
- `data` 初始化新增 `title: ''`
- `_loadRecord` 的 `setData` 新增 `title: record.title || ''`（兼容旧记录）
- `onSave` 的 payload 新增 `title: d.title`
- 新增 `onInputTitle(e)` 输入事件处理函数

### Task 3 — 表单页 WXML（`visit-add.wxml`）
- 在「服务简介」section 首行插入标题 `form-item`
- 绑定 `onInputTitle`，`maxlength="30"`，serving/completed 状态禁用

### Task 4 — 列表页（`visit.wxml` + `visit.wxss`）
- 卡片 header：有 title 时显示为独立第一行大字（`.card-title`），service-name 降为次要小字（`.card-service-name-small`）；无 title 时保持原样
- 新增 `.card-title`、`.card-service-name-small` 样式；`.card-header` 增加 `flex-wrap: wrap`

## 向后兼容
旧记录 `title` 字段缺失时，JS 用 `|| ''` 兜底，列表页 `wx:if="{{item.title}}"` 控制显示，不影响已有数据展示。
