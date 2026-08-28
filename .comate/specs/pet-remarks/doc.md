# 宠物备注模块设计文档

## 需求概述

在宠物信息的编辑/添加页中，新增一个「备注」模块，允许用户为宠物填写结构化的备注信息。每条备注由**类型**和**内容**组成，类型包含预设项（喜好、禁忌、注意事项、其他）以及用户可自定义的类型名称。

在首页宠物面板（`pet-card`）上，展示一个叹号图标（`!`），点击后从底部弹出浮层（bottom sheet），展示该宠物的所有备注信息。

---

## 一、数据结构设计

### 备注类型常量（新增至 `constants.js`）

```js
const PET_REMARK_TYPES = [
  { key: 'preference', label: '喜好', icon: '💛' },
  { key: 'taboo',      label: '禁忌', icon: '🚫' },
  { key: 'caution',   label: '注意事项', icon: '⚠️' },
  { key: 'other',     label: '其他', icon: '📝' }
];
```

当用户选择「其他」并输入自定义类型时，存储结构为：

```js
{
  type: 'custom',         // 固定为 'custom' 标识自定义
  customType: '自定义类型名', // 用户输入的类型名
  content: '备注内容'
}
```

### pets 集合新增字段

```js
remarks: [
  {
    type: 'preference' | 'taboo' | 'caution' | 'other' | 'custom',
    customType: '',   // 仅 type === 'custom' 时有值
    content: ''       // 备注内容
  }
]
```

---

## 二、受影响的文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `miniprogram/utils/constants.js` | 修改 | 新增 `PET_REMARK_TYPES` 常量及 module.exports |
| `miniprogram/pages/pet-edit/pet-edit.wxml` | 修改 | 新增备注模块 UI（列表展示 + 新增入口） |
| `miniprogram/pages/pet-edit/pet-edit.js` | 修改 | 备注的增删逻辑、表单数据处理 |
| `miniprogram/pages/pet-edit/pet-edit.wxss` | 修改 | 备注模块样式 |
| `miniprogram/pages/home/components/pet-card/pet-card.wxml` | 修改 | 新增叹号按钮；新增备注浮层 |
| `miniprogram/pages/home/components/pet-card/pet-card.js` | 修改 | 新增浮层开关 state 及 remarks 数据计算 |
| `miniprogram/pages/home/components/pet-card/pet-card.wxss` | 修改 | 叹号按钮样式；bottom sheet 样式 |
| `cloudfunctions/petManage/index.js` | 修改 | `addPet` 和 `updatePet` 支持 `remarks` 字段存取 |

---

## 三、功能详细设计

### 3.1 宠物编辑页 — 备注模块

**位置：** 表单 card 内，体重字段下方，保存按钮上方。

**交互流程：**

1. 展示已有备注列表，每条备注显示「类型标签 + 内容文本 + 删除按钮」。
2. 底部有「+ 添加备注」按钮，点击后在列表末尾插入一条新备注行（inline 展开）：
   - 左侧：类型选择器（横向标签滑动选择，预设 4 种 + 自定义）
   - 选中「其他（自定义）」时，额外展示一个自定义类型名称输入框
   - 右侧：内容 textarea（多行）
   - 右上角：删除该条备注

**数据模型（页面内）：**

```js
form: {
  // ... 现有字段
  remarks: [
    // { type, customType, content }
  ]
}
```

**备注类型选择 UI：** 水平滚动的 tag 列表，选中高亮；最后一个是「自定义」。

### 3.2 首页宠物面板 — 叹号图标 & 备注浮层

**叹号图标位置：** `pet-card` 的 `.hero-copy` 区域内，放在 `.hero-meta`（品种/年龄行）的右侧或下方，仅当 `pet.remarks` 非空时显示。

**点击行为：** 触发 `showRemarksSheet = true`，从底部滑入浮层（bottom sheet）。

**底部浮层（bottom sheet）设计：**

- 遮罩层（半透明黑色，点击关闭）
- 浮层主体从底部滑入：
  - 顶部拖拽条（装饰用）
  - 标题：「宠物备注」
  - 备注列表：每条显示类型 icon + 类型名称 + 内容
  - 若无备注，显示「暂无备注信息」

**备注显示格式：**

```
[💛 喜好] 喜欢吃鸡肉零食
[🚫 禁忌] 不能吃葡萄、巧克力
[⚠️ 注意事项] 有点怕生，见陌生人容易应激
[📝 自定义类型名] 自定义备注内容
```

**prop 透传：** `pet-card` 已通过 `pet` prop 接收完整宠物对象，`pet.remarks` 直接可用。

---

## 四、云函数修改

### petManage — addPet

在构建 `petData` 时，额外支持 `remarks` 字段：

```js
remarks: Array.isArray(data.remarks) ? data.remarks : []
```

### petManage — updatePet

在 `updateData` 构建逻辑中，支持 `remarks` 字段更新：

```js
if (data.remarks !== undefined) updateData.remarks = data.remarks;
```

内容安全校验：将所有 `remarks[].content` 和 `remarks[].customType` 拼入 `composedText` 中进行统一校验。

---

## 五、数据流

```
[pet-edit 表单]
  → 用户填写 remarks 数组（type, customType, content）
  → onSubmit 将 remarks 传入 petData
  → 调用 petManage 云函数（add/update）
  → 持久化到 pets 集合

[home 页面]
  → loadPets 获取宠物列表（含 remarks 字段）
  → 传给 pet-card 的 pet prop
  → pet-card 读取 pet.remarks
  → 叹号图标（remarks 非空时显示）
  → 点击叹号 → showRemarksSheet = true
  → bottom sheet 展示 remarks 列表
```

---

## 六、边界条件与异常处理

- 备注数量上限：单只宠物最多 10 条备注（前端限制，防止数据膨胀）。
- 内容字段必填：添加备注时，content 为空则不允许添加（前端 toast 提示）。
- 自定义类型名：选择「自定义」时 customType 不能为空，超过 10 字截断。
- 备注 content 超过 100 字截断（input maxlength 限制）。
- 编辑回填：编辑模式下 `loadPetInfo` 需将 `pet.remarks` 写入 `form.remarks`。
- 旧宠物数据兼容：`pet.remarks` 可能为 undefined，读取时需做 `|| []` 兼容处理。

---

## 七、预期效果

- 宠物编辑页底部新增结构清晰的备注模块，操作直观。
- 首页宠物卡片在有备注时显示叹号提示，点击后优雅地从底部弹出浮层展示备注详情。
- 整体视觉风格与现有 UI（紫色主题、圆角卡片）保持一致。
