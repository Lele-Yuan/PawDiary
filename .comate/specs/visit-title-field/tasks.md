# 上门沟通帖子增加标题字段

- [ ] Task 1: 云函数支持 title 字段
    - 1.1: `addRecord` 的 record 对象中加入 `title: data.title || ''`
    - 1.2: `updateRecord` 白名单数组中加入 `'title'`

- [ ] Task 2: 表单页 JS 支持 title 字段
    - 2.1: `data` 初始化加 `title: ''`
    - 2.2: `onSave` 的 payload 加入 `title: d.title`
    - 2.3: `_loadRecord` 的 `setData` 加入 `title: record.title || ''`
    - 2.4: 新增 `onInputTitle` 输入事件处理函数

- [ ] Task 3: 表单页 WXML 增加标题输入框
    - 3.1: 在「服务简介」section 首行插入标题 form-item，绑定 `onInputTitle`，`maxlength=30`，`disabled` 逻辑同其他字段

- [ ] Task 4: 列表页展示标题
    - 4.1: `visit.wxml` 卡片首行：有 `title` 时显示为大字标题，无 title 时回退显示 `serviceName`
