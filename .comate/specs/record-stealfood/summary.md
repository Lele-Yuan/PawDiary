# 偷吃记录类型 - 完成总结

## 实现内容
新增记录类型 `stealfood`（偷吃），与 `trouble` 类似采用图标/名称输入模式，并在趋势捅娄子热力图中合并统计。

## 关键变更
- `miniprogram/utils/constants.js`：RECORD_TYPES 在 abnormal 之后追加 stealfood（icon 🍴 / color #FF8A65 / hideTitle）
- `cloudfunctions/recordManage/index.js`：
  - validTypes 新增 `'stealfood'`
  - addRecord 持久化新增 `stealItem` 字段；同时补齐之前未持久化的 `troubleIcon` / `troubleName`
  - updateRecord 增加 `troubleIcon` / `troubleName` / `stealItem` 字段更新
- `miniprogram/pages/record/record-add/record-add.js`：
  - form 默认值新增 `stealItem: ''`
  - 编辑模式回填 stealItem
  - validateForm 增加 stealfood case 校验
  - 提交 fields 增加 stealItem，并在 stealfood 时自动同步 title
- `miniprogram/pages/record/record-add/record-add.wxml`：trouble 块下方追加 `wx:if="{{form.type === 'stealfood'}}"` 的输入框，placeholder「填写吃了什么东西的图标或名称，例如🧅」
- `miniprogram/pages/record/record-trends/record-trends.js`：捅娄子热力图聚合扩展为 `r.type === 'trouble' || r.type === 'stealfood'`，单元格首字符兜底取 stealItem

## 部署提醒
**云函数 `recordManage` 必须重新上传部署**，否则 add/update 时会返回"无效的记录类型"。

## 风险
- 旧记录无 stealItem 字段，读取时使用兜底 `''`，不影响显示
- 趋势页捅娄子热力图标题保持不变；如后续需要同时显示「偷吃」可单独开 ticket
