# 上门沟通帖子增加标题字段

## 需求说明

在「上门沟通」互助帖的创建/编辑表单中增加一个**标题**输入字段，发布后在列表页展示该标题。

## 数据模型变更

在 `visit_records` 集合中新增字段：
```
title: String  // 帖子标题，默认空字符串
```

## 受影响文件

| 文件 | 修改类型 | 说明 |
|------|--------|------|
| `cloudfunctions/visitManage/index.js` | 修改 | `addRecord` 存储 `title`；`updateRecord` 白名单加入 `title` |
| `miniprogram/pages/visit/visit-add/visit-add.js` | 修改 | data 初始化加 `title`；`onSave` payload 加 `title`；`_loadRecord` 回填 `title` |
| `miniprogram/pages/visit/visit-add/visit-add.wxml` | 修改 | 在服务简介 section 最顶部增加标题输入框 |
| `miniprogram/pages/visit/visit.wxml` | 修改 | 列表卡片中用标题替换/补充 `serviceName` 的显示 |

## 实现细节

### 表单位置
在「服务简介」section 第一行（昵称字段之前）插入：
```
标题: [输入框，placeholder="给这次上门服务起个标题"]
```
- `disabled` 状态同其他字段：`serving` / `completed` 时禁用
- `maxlength`: 30

### 列表卡片显示
- 若 `title` 非空：首行显示 `title`（大字），`serviceName` 保持在状态标签旁
- 若 `title` 为空：保持现有显示（仅显示 `serviceName`）

### 向后兼容
旧记录中 `title` 字段缺失时，`_loadRecord` 用 `record.title || ''` 处理，列表页直接透传无需额外处理。
