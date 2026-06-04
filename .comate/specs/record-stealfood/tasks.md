# 偷吃记录类型 - 任务拆解

- [x] Task 1: constants 增加 stealfood 类型
    - 1.1: `RECORD_TYPES` 数组在 abnormal 之后追加 stealfood 配置（label 偷吃、icon 🍴、color #FF8A65、hideTitle）

- [x] Task 2: 云函数 recordManage 适配
    - 2.1: `addRecord` 的 validTypes 数组新增 'stealfood'
    - 2.2: `recordData` 持久化新增字段 `stealItem`
    - 2.3: `updateRecord` 中追加 `stealItem` 字段更新逻辑
    - 2.4: 提示用户重新部署 cloudfunctions/recordManage

- [x] Task 3: record-add 表单逻辑
    - 3.1: `data.form` 默认值新增 `stealItem: ''`
    - 3.2: 编辑模式回填 `stealItem`
    - 3.3: `validateForm` 增加 `case 'stealfood'`：stealItem 非空校验
    - 3.4: 提交 fields 增加 `stealItem`，并在 stealfood 时把 title 同步为 stealItem

- [x] Task 4: record-add 表单 WXML
    - 4.1: trouble 表单块下方新增 `wx:if="{{form.type === 'stealfood'}}"` 输入框，placeholder「填写吃了什么东西的图标或名称，例如🧅」

- [x] Task 5: 趋势页捅娄子热力图合并 stealfood
    - 5.1: 找到 trouble 矩阵聚合代码，扩展类型判断为 `r.type === 'trouble' || r.type === 'stealfood'`
    - 5.2: 单元格显示字符兜底取 `r.troubleIcon || r.stealItem`

- [x] Task 6: 自测与生成 summary.md
