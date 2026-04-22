# 日常记录下次提醒消息通知实现任务计划

- [ ] Task 1: 在 constants.js 中新增订阅消息模板 ID 常量
    - 1.1: 在 `miniprogram/utils/constants.js` 末尾新增 `NOTIFY_TEMPLATE_ID` 常量（占位值，待申请模板后替换）
    - 1.2: 同时导出该常量（module.exports 中添加）

- [ ] Task 2: 更新 record-add 表单数据结构与 UI
    - 2.1: 在 `record-add.js` 的 `data.form` 中新增 `remindAdvance`（默认 0）、`remindTime`（默认 '08:00'）两个字段
    - 2.2: 在 `record-add.wxml` 中，「下次提醒」开关之后新增「提醒时间」区域：当天/前一天 Tab 选择 + `picker mode="time"` 时间点选择，均通过 `wx:if="{{form.enableRemind}}"` 控制显示
    - 2.3: 在 `record-add.wxss` 中新增 `.remind-advance-tabs`、`.tab-item`、`.tab-item.active` 样式
    - 2.4: 在 `record-add.js` 中新增 `onRemindAdvanceChange`、`onRemindTimeChange` 事件处理函数

- [ ] Task 3: 更新保存逻辑（订阅授权 + remindSendAt 计算）
    - 3.1: 在 `record-add.js` 的 `onSave` 函数中，当 `form.enableRemind === true` 时，先 await `wx.requestSubscribeMessage`（complete 回调 resolve，不阻断保存流程）
    - 3.2: 在 `onSave` 中计算 `remindSendAt`：取 `nextDate` 日期，根据 `remindAdvance` 减去对应天数，拼接 `remindTime` 时间，转为 Date 对象后随表单一并提交
    - 3.3: 将 `remindAdvance`、`remindTime`、`remindSendAt` 纳入提交给云函数的 `data` 对象

- [ ] Task 4: 更新 recordManage 云函数存储新字段
    - 4.1: 在 `cloudfunctions/recordManage/index.js` 的 `addRecord` 方法中，`recordData` 新增 `remindAdvance`、`remindTime`、`remindSendAt`、`petName` 四个字段的赋值
    - 4.2: 同步更新 `updateRecord` 方法，在允许更新的字段列表中加入上述四个新字段
    - 4.3: `petName` 的获取逻辑：在 addRecord/updateRecord 中根据 `data.petId` 查询 `pets` 集合，取 `name` 字段冗余存入记录，避免通知时再次查询

- [ ] Task 5: 新建 sendReminder 云函数
    - 5.1: 新建 `cloudfunctions/sendReminder/package.json`，依赖 `wx-server-sdk` 最新版
    - 5.2: 新建 `cloudfunctions/sendReminder/index.js`，实现核心逻辑：
        - 计算时间窗口：`remindSendAt` 在过去 1 小时内（`>= now-60min AND <= now`）
        - 查询 `records` 集合中 `enableRemind: true` 且 `remindSendAt` 落在该窗口的记录
        - 遍历记录，调用 `cloud.openapi.subscribeMessage.send` 发送通知（含跳转页面 `pages/record/record?petId=xxx`）
        - 发送成功后将该记录 `enableRemind` 置为 `false`，防止重复推送
        - 捕获单条发送异常，记录错误日志，不影响其他条目继续发送
    - 5.3: 新建 `cloudfunctions/sendReminder/config.json`，配置每小时执行一次的定时触发器（`"0 0 * * * * *"`）
