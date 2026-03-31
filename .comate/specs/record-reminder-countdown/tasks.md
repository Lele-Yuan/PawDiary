# 记录页面增加提醒开关与倒计时进度条

- [x] Task 1: record-add 页面增加提醒开关和间隔选择
    - 1.1: record-add.js form data 新增 enableRemind、remindInterval、customInterval 字段
    - 1.2: record-add.js 新增 onRemindChange、onSelectInterval、onCustomInterval、calcNextDate 方法
    - 1.3: record-add.js 修改 onDateChange 在已开启提醒时重新计算 nextDate
    - 1.4: record-add.js onSubmit 写入数据库时新增 enableRemind 和 remindInterval 字段
    - 1.5: record-add.wxml 在下次预计日期下方新增提醒开关和间隔选择 UI
    - 1.6: record-add.wxss 新增提醒开关行、间隔标签、自定义输入、预览提示样式

- [ ] Task 2: record 列表页计算提醒进度并展示
    - 2.1: record.js loadRecords 中为每条记录计算 hasRemind、remindProgress、remindProgressColor、remindDaysText、remindOverdue
    - 2.2: record.wxml 卡片标题行增加 🔔 提醒标识
    - 2.3: record.wxml 卡片内容区增加倒计时进度条和剩余天数文本
    - 2.4: record.wxss 新增提醒标识、进度条背景/填充、剩余天数文本样式
