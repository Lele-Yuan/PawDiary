# 账单付款人功能实现计划

- [✓] Task 1: 云函数支持付款人字段
    - 1.1: `addBill` 中构建 `billData` 时新增 `payerOpenid`（默认 openid）和 `payerName`（默认空串）字段
    - 1.2: `updateBill` 中支持更新 `payerOpenid` 和 `payerName` 字段
    - 1.3: `listBills` 中支持按 `payerOpenid` 筛选（当 `data.payerOpenid` 有值时加入 where 条件）

- [✓] Task 2: 记一笔页 — JS 逻辑
    - 2.1: `onLoad` 时通过 `familyManage` 云函数（`action: 'list'`）加载当前宠物共养人列表，写入 `data.members`
    - 2.2: `form` 中新增 `payerOpenid` 和 `payerName` 字段，默认值为当前用户 openid/昵称
    - 2.3: 实现 `onSelectPayer(e)` 方法：更新 `form.payerOpenid` 和 `form.payerName`
    - 2.4: `loadBill` 编辑回填时，将 `bill.payerOpenid` 和 `bill.payerName` 写入 form
    - 2.5: `onSubmit` 时将 `payerOpenid` 和 `payerName` 加入提交数据（add/update 两个分支）

- [✓] Task 3: 记一笔页 — WXML 模板
    - 3.1: 在「备注」字段下方新增「付款人」表单组
    - 3.2: 渲染付款人横向滚动选择列表，每项显示头像 + 昵称，选中高亮

- [✓] Task 4: 记一笔页 — WXSS 样式
    - 4.1: 付款人选择器横向滚动容器样式
    - 4.2: 付款人选项卡片样式（头像 + 昵称，选中高亮边框）

- [✓] Task 5: 账单列表 — 透传 payerName 并展示
    - 5.1: `bill.js` 的 `groupBillsByDate` 中，push bill 时透传 `payerName` 字段（已在云函数返回数据中）
    - 5.2: `bill.wxml` 的 `.bill-right` 中，在 `bill-category-tag` 下方新增付款人小字（`wx:if="{{bill.payerName}}"`）
    - 5.3: `bill.wxss` 中新增 `.bill-payer-name` 样式（小字，次要色）

- [✓] Task 6: 消费统计页 — JS 逻辑
    - 6.1: `data` 中新增 `members: []` 和 `selectedPayer: 'all'`
    - 6.2: `onLoad` 时加载共养人列表，写入 `data.members`（复用 familyManage）
    - 6.3: 实现 `onSelectPayer(e)` 方法：更新 `selectedPayer`，然后调用 `loadStats()`
    - 6.4: `loadStats` 中，当 `selectedPayer !== 'all'` 时，向 `billManage.list` 传入 `payerOpenid`
    - 6.5: `loadTrends` 中，同样支持 `payerOpenid` 参数透传

- [✓] Task 7: 消费统计页 — WXML 模板
    - 7.1: 在「月度/年度切换 tabs」下方新增付款人筛选行（横向滚动标签）
    - 7.2: 第一个标签为「全部」，后续为各成员昵称，选中高亮

- [✓] Task 8: 消费统计页 — WXSS 样式
    - 8.1: 付款人筛选行容器及横向滚动样式
    - 8.2: 筛选标签样式及选中高亮样式

- [x] Task 9: 限制付款人候选为供养人/共养人
    - 9.1: `bill-add.js` 的 `loadMembers` 中过滤 `familyManage.list` 返回结果，仅保留 `role === 'creator' || role === 'admin'`
    - 9.2: `bill-stats.js` 的 `loadMembers` 中同样过滤付款人筛选列表，仅保留 `role === 'creator' || role === 'admin'`
    - 9.3: 保持现有默认付款人逻辑不变，确保当前可记账用户默认仍能被选中
