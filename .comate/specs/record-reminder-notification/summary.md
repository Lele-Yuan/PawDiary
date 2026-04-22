# 日常记录下次提醒消息通知 — 实现总结

## 完成的变更

### 1. miniprogram/utils/constants.js
新增 `NOTIFY_TEMPLATE_ID` 常量并导出，用于前端请求订阅授权和云函数发送消息时指定模板。

### 2. miniprogram/pages/record/record-add/record-add.js
- 导入 `NOTIFY_TEMPLATE_ID`
- `data.form` 新增 `remindAdvance`（0=当天/1=前一天）、`remindTime`（默认 `'08:00'`）
- 新增 `onRemindAdvanceChange`、`onRemindTimeChange` 事件处理函数
- `onRemindChange` 关闭提醒时同步重置新字段
- `loadRecord` 编辑模式回显新字段
- `onSubmit` 在 tap 同步调用链中触发 `wx.requestSubscribeMessage`，并计算 `remindSendAt` 存入提交数据

### 3. miniprogram/pages/record/record-add/record-add.wxml
在「提醒间隔」区域之后新增「通知时间」UI：
- 当天 / 前一天 Tab 切换
- `picker mode="time"` 时间点选择

### 4. miniprogram/pages/record/record-add/record-add.wxss
新增 `.remind-time-section`、`.remind-advance-tabs`、`.tab-item`、`.tab-item.active`、`.remind-time-picker` 等样式。

### 5. cloudfunctions/recordManage/index.js
- `addRecord`：新增 petName 查询（冗余存储），存储 `remindAdvance`、`remindTime`、`remindSendAt`、`petName`
- `updateRecord`：支持更新上述新字段

### 6. cloudfunctions/sendReminder/（新建）
- `index.js`：每小时查询 `remindSendAt` 在过去 1 小时内的记录，调用 `cloud.openapi.subscribeMessage.send` 发送通知，发送后关闭 `enableRemind`
- `config.json`：定时触发器，每小时整点执行
- `package.json`：依赖 `wx-server-sdk ~2.6.3`

## 上线前必做事项

1. **申请消息模板**：微信公众平台 → 功能 → 订阅消息 → 申请模板
2. **替换占位值**：将 `constants.js` 和 `sendReminder/index.js` 中的 `YOUR_TEMPLATE_ID_HERE` 替换为真实 templateId，并确认模板字段（`thing1`/`time2`/`thing3`/`thing4`）与申请模板匹配
3. **开启 openapi 权限**：微信云开发控制台 → sendReminder 云函数 → 权限 → 开启 `subscribeMessage.send`
4. **部署云函数**：上传并部署 `sendReminder` 和 `recordManage` 两个云函数
5. **上传触发器**：在云开发控制台为 `sendReminder` 绑定 `config.json` 中的定时触发器
