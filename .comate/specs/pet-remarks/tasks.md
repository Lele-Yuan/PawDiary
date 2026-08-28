# 宠物备注模块实现计划

- [x] Task 1: 新增备注类型常量
    - 1.1: 在 `miniprogram/utils/constants.js` 中新增 `PET_REMARK_TYPES` 数组（喜好、禁忌、注意事项、其他/自定义）
    - 1.2: 将 `PET_REMARK_TYPES` 加入 `module.exports`

- [x] Task 2: 云函数支持 remarks 字段
    - 2.1: `addPet` 函数中，构建 `petData` 时加入 `remarks` 字段（默认空数组）
    - 2.2: `updatePet` 函数中，支持 `remarks` 字段更新（`if (data.remarks !== undefined) updateData.remarks = data.remarks`）
    - 2.3: 内容安全校验中，将 `remarks[].content` 和 `remarks[].customType` 拼入 `composedText`

- [x] Task 3: 宠物编辑页 — JS 逻辑
    - 3.1: 引入 `PET_REMARK_TYPES` 常量，加入 `data.remarkTypes`
    - 3.2: `form` 中新增 `remarks: []` 字段
    - 3.3: `loadPetInfo` 编辑回填时将 `pet.remarks || []` 写入 `form.remarks`
    - 3.4: 实现 `onAddRemark` 方法：向 `form.remarks` 末尾追加一条空备注（type 默认 'preference'）
    - 3.5: 实现 `onRemoveRemark(e)` 方法：按 index 从 `form.remarks` 中删除
    - 3.6: 实现 `onRemarkTypeChange(e)` 方法：更新指定 index 的 type 字段
    - 3.7: 实现 `onRemarkContentInput(e)` 方法：更新指定 index 的 content 字段
    - 3.8: 实现 `onRemarkCustomTypeInput(e)` 方法：更新指定 index 的 customType 字段
    - 3.9: `onSubmit` 中对 remarks 做校验（content 不能为空；自定义类型时 customType 不能为空；数量上限 10 条）并将 `form.remarks` 传入 `petData`

- [x] Task 4: 宠物编辑页 — WXML 模板
    - 4.1: 在体重字段下方、提交按钮上方，新增备注模块容器（独立 card）
    - 4.2: 渲染已有备注列表：每条显示类型 tag + 内容 + 删除按钮
    - 4.3: 每条备注的类型选择器：水平滚动的标签列表，选中高亮
    - 4.4: 当选中类型为 'custom' 时，额外渲染自定义类型名称输入框
    - 4.5: 每条备注的内容 textarea（多行，maxlength=100）
    - 4.6: 底部「+ 添加备注」按钮，绑定 `onAddRemark`

- [x] Task 5: 宠物编辑页 — WXSS 样式
    - 5.1: 备注模块 card 整体容器样式
    - 5.2: 备注列表项样式（含删除按钮、分割线）
    - 5.3: 类型标签选择器横向滚动样式及选中高亮样式
    - 5.4: 自定义类型输入框样式
    - 5.5: 内容 textarea 样式
    - 5.6: 「+ 添加备注」按钮样式

- [x] Task 6: pet-card 组件 — JS 逻辑
    - 6.1: `data` 中新增 `showRemarksSheet: false`
    - 6.2: 在 `pet` observer 中，计算 `hasRemarks`（`pet.remarks && pet.remarks.length > 0`）并写入 data
    - 6.3: 实现 `openRemarksSheet` 方法：`setData({ showRemarksSheet: true })`
    - 6.4: 实现 `closeRemarksSheet` 方法：`setData({ showRemarksSheet: false })`
    - 6.5: 实现 `getRemarkLabel(remark)` 辅助逻辑：返回类型 icon + 类型名（自定义类型取 customType）

- [x] Task 7: pet-card 组件 — WXML 模板
    - 7.1: 在 `.hero-meta` 行右侧新增叹号按钮（`wx:if="{{hasRemarks}}"`），绑定 `openRemarksSheet`
    - 7.2: 在组件底部新增遮罩层（`catchtap="closeRemarksSheet"`），`showRemarksSheet` 控制显隐
    - 7.3: 新增 bottom sheet 容器：顶部拖拽条 + 标题「宠物备注」+ 关闭按钮
    - 7.4: bottom sheet 内渲染 `pet.remarks` 列表，每条显示 icon、类型名、内容
    - 7.5: 当 `pet.remarks` 为空时，显示「暂无备注信息」占位文字

- [x] Task 8: pet-card 组件 — WXSS 样式
    - 8.1: 叹号按钮样式（圆形徽章，半透明白色背景，白色文字）
    - 8.2: bottom sheet 遮罩样式（fixed 全屏，透明度过渡动画）
    - 8.3: bottom sheet 主体样式（fixed 底部，圆角，白色背景，向上滑入动画）
    - 8.4: 拖拽条样式
    - 8.5: 备注列表项样式（icon + 类型名 + 内容，卡片式）
    - 8.6: 空状态占位文字样式
