# 记录编辑流程与时间线样式优化

- [x] Task 1: record 列表页时间线日期样式与点击跳转
    - 1.1: record.js loadRecords 中计算 shortDateStr（YY.MM.DD 格式）
    - 1.2: record.js 新增 goEdit 方法，携带 id 跳转 record-add 页面
    - 1.3: record.wxml timeline-left 中 dot 上方增加日期文字
    - 1.4: record.wxml 卡片绑定 bindtap="goEdit"，移除已完成副标题中的日期
    - 1.5: record.wxss 增加 .timeline-date 样式，调整 timeline-left 宽度适配日期

- [x] Task 2: record-add 页面支持编辑模式（加载、修改、删除）
    - 2.1: record-add.js data 中新增 editId、pageTitle 字段
    - 2.2: record-add.js onLoad 根据 options.id 区分新增/编辑模式
    - 2.3: record-add.js 新增 loadRecord 方法，从数据库加载记录填充表单
    - 2.4: record-add.js onSubmit 改造，editId 存在时执行 update 而非 add
    - 2.5: record-add.js 新增 onDelete 方法，二次确认后删除记录
    - 2.6: record-add.wxml nav-bar title 改为 {{pageTitle}}，提交按钮动态文案
    - 2.7: record-add.wxml 编辑模式下底部增加删除按钮
    - 2.8: record-add.wxss 增加删除按钮样式

- [x] Task 3: "立即完成"按钮逻辑（新增记录 + 继承/结束提醒）
    - 3.1: record.js 新增 onComplete 方法：新增当天完成记录，继承提醒或自动结束
    - 3.2: record.wxml "立即完成"按钮绑定改为 onComplete，阻止事件冒泡到 goEdit
    - 3.3: record.js onComplete 完成后关闭原记录的提醒状态
