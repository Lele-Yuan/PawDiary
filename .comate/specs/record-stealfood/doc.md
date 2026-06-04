# 偷吃记录类型

## 需求场景
用户在记录页"异常情况"分类下新增子类型「偷吃」，用于记录宠物偷吃了什么，支持图标 + 名称 + 详细描述。趋势页 `捅娄子` 热力图把偷吃事件一起统计进去（视觉上与 trouble 共用一张图）。

## 技术方案
完全复用现有 `trouble` 类型的字段与交互模式：图标选择器 + 名称输入。新增独立的记录类型 `stealfood`，避免与 trouble 数据混淆，统计层面再做合并。

### 数据模型新增字段
- `stealItem: string` 偷吃了什么（默认存储为图标或名称，placeholder 为「填写吃了什么东西的图标或名称，例如🧅」）
- description 复用现有字段
- title 自动写入为 stealItem（与 trouble 一致）

## 改动文件清单

### 1. `miniprogram/utils/constants.js`
在 RECORD_TYPES 数组「异常情况」分组追加：
```js
{ key: 'stealfood', label: '偷吃', hideTitle: true, color: '#FF8A65', icon: '🍴' }
```

### 2. `cloudfunctions/recordManage/index.js`
- `addRecord` 内 `validTypes` 数组增加 `'stealfood'`
- `recordData` 新增持久化字段 `stealItem: data.stealItem || ''`
- `updateRecord` 内 `if (data.stealItem !== undefined) updateData.stealItem = data.stealItem;`

### 3. `miniprogram/pages/record/record-add/record-add.js`
- `data.form` 默认值新增 `stealItem: ''`
- 编辑模式（约 392 行）从云数据回填 `stealItem: r.stealItem || ''`
- `validateForm` switch 新增 `case 'stealfood'`：要求 `stealItem` 非空
- 提交 fields 增加 `stealItem: form.stealItem`
- 与 trouble 同样处理：`if (form.type === 'stealfood' && form.stealItem) fields.title = form.stealItem.trim()`

### 4. `miniprogram/pages/record/record-add/record-add.wxml`
在 trouble 表单块下方新增：
```xml
<view class="form-group" wx:if="{{form.type === 'stealfood'}}">
  <view class="form-label">偷吃了什么 <text class="required">*</text></view>
  <input
    class="form-input"
    placeholder="填写吃了什么东西的图标或名称，例如🧅"
    value="{{form.stealItem}}"
    bindinput="onInputChange"
    data-field="stealItem"
    maxlength="30"
  />
</view>
```

### 5. `miniprogram/pages/record/record-trends/record-trends.js`
`buildGroomingMatrix`（实际是 trouble 篓子热力图聚合）所在的数据准备阶段：
- 找到 trouble 类型的 group filter，扩展为 `if (r.type === 'trouble' || r.type === 'stealfood')`
- 单元格内显示的字符 / emoji 取 `r.troubleIcon || r.stealItem || RECORD_TYPE_MAP[r.type].icon`
- 图例（trouble heatmap）追加偷吃说明文字（可选，根据现有 wxml 结构判断）

### 6. `miniprogram/pages/record/record-trends/record-trends.wxml`
- 章节标题 `捅娄子` 是否改名为「捅娄子 / 偷吃」由用户后续决定，本期保持原标题，仅在数据上合并

## 边界条件
- 旧记录无 `stealItem` 字段 → 读取兜底 `''`
- title 自动写入逻辑：用户改了 stealItem 则 title 同步；保持与 trouble 一致
- 云函数未部署最新版本会报"无效的记录类型"，需重新上传部署
- 趋势页热力图当 trouble 与 stealfood 同日存在时，合并计数；显示的图标取该天的最后一条（保持现有 trouble 行为）

## 预期效果
- 记录页 → 新增 → 类型选择列表中"异常情况"分组多出「🍴 偷吃」
- 选中后表单显示「偷吃了什么 *」输入框 + 详细描述
- 提交成功后写入 records 集合，type=stealfood，stealItem=用户填写内容，title 同 stealItem
- 趋势页捅娄子热力图把 stealfood 一并统计
