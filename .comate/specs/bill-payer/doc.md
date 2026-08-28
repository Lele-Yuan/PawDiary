# 账单付款人功能设计文档

## 需求概述

1. **记一笔**（bill-add）：新增「付款人」选项，选项来源为当前宠物的共养人列表，默认选中当前用户。
2. **近期支出列表**（bill.wxml）：在每条账单的 `bill-category-tag` 旁边，新增付款人昵称小字展示。
3. **消费统计**（bill-stats）：新增付款人筛选条件，默认为「全部」，选择后只展示该付款人的账单数据。

---

## 一、数据结构变更

### bills 集合新增字段

```js
{
  payerOpenid: '',   // 付款人 openid（不填则默认为提交人 openid）
  payerName: ''      // 付款人昵称（冗余存储，避免频繁查询 users）
}
```

新增两个字段：`payerOpenid` 和 `payerName`。旧数据未设置时，`payerOpenid` 默认视为账单创建人（`_openid`）。

---

## 二、受影响的文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `cloudfunctions/billManage/index.js` | 修改 | `addBill` 和 `updateBill` 支持 payerOpenid/payerName；`listBills` 支持按 payerOpenid 筛选 |
| `miniprogram/pages/bill/bill-add/bill-add.js` | 修改 | onLoad 时加载共养人列表；form 增加 payerOpenid/payerName；编辑回填时填充付款人 |
| `miniprogram/pages/bill/bill-add/bill-add.wxml` | 修改 | 新增付款人选择器（单选标签列表） |
| `miniprogram/pages/bill/bill-add/bill-add.wxss` | 修改 | 付款人选择器样式 |
| `miniprogram/pages/bill/bill.js` | 修改 | groupBillsByDate 中带出 payerName 字段 |
| `miniprogram/pages/bill/bill.wxml` | 修改 | bill-category-tag 下方新增付款人小字 |
| `miniprogram/pages/bill/bill.wxss` | 修改 | 付款人小字样式 |
| `miniprogram/pages/bill/bill-stats/bill-stats.js` | 修改 | 加载共养人列表；新增 selectedPayer 筛选状态；loadStats/loadTrends 传入 payerOpenid 参数 |
| `miniprogram/pages/bill/bill-stats/bill-stats.wxml` | 修改 | 新增付款人筛选标签行 |
| `miniprogram/pages/bill/bill-stats/bill-stats.wxss` | 修改 | 筛选标签样式 |

---

## 三、功能详细设计

### 3.1 记一笔页 — 付款人选择

**加载共养人列表：**

在 `onLoad` 时，通过 `familyManage` 云函数（`action: 'list'`）查询当前宠物的家庭成员列表。`familyManage.list` 会返回创建者、共养人和亲友团，因此前端必须过滤成员角色，只保留 `role === 'creator' || role === 'admin'` 作为付款人候选项，排除 `role === 'member'` 的亲友团。

默认付款人为当前用户（`app.globalData.userInfo`）。当前用户在 `bill-add` 中已有权限校验，只有 `creator/admin` 能进入记账页。

**UI：** 在「备注」字段下方，放一个「付款人」表单组，展示为横向可滚动的头像+昵称标签列表，选中高亮。

**form 扩展：**

```js
form: {
  // ...existing
  payerOpenid: '',  // 默认当前用户 openid
  payerName: ''     // 默认当前用户昵称
}
```

**编辑回填：** `loadBill` 时将 `bill.payerOpenid` 和 `bill.payerName` 写入 form，并在列表中找到对应选中项。

### 3.2 近期支出列表 — 付款人小字

在 `bill.wxml` 的 `.bill-right` 中，`bill-category-tag` 下方新增一行付款人小字：

```xml
<text class="bill-payer-name" wx:if="{{bill.payerName}}">{{bill.payerName}}</text>
```

`bill.js` 的 `groupBillsByDate` 方法在 push bill 时透传 `payerName` 字段（该字段已在云函数返回的账单数据中）。

### 3.3 消费统计页 — 付款人筛选

**状态：**

```js
data: {
  // ...existing
  members: [],           // 共养人列表 [{ openid, nickName }]
  selectedPayer: 'all'   // 'all' 或某成员 openid
}
```

**UI：** 在月度/年度切换 tabs 下方，新增一行付款人筛选标签（横向滚动），第一个为「全部」，后面依次是各成员昵称。

**筛选逻辑：** 当 `selectedPayer !== 'all'` 时，`loadStats` 在调用 `billManage.list` 时携带 `payerOpenid` 参数，云函数在 `listBills` 中加入 `where.payerOpenid = data.payerOpenid` 过滤条件。`loadTrends` 同理。

---

## 四、云函数修改

### addBill

```js
const billData = {
  // ...existing
  payerOpenid: data.payerOpenid || openid,
  payerName: data.payerName || ''
};
```

### updateBill

```js
if (data.payerOpenid !== undefined) updateData.payerOpenid = data.payerOpenid;
if (data.payerName !== undefined) updateData.payerName = data.payerName;
```

### listBills

```js
if (data.payerOpenid) {
  where.payerOpenid = data.payerOpenid;
}
```

---

## 五、数据流

```
[bill-add 页面]
  onLoad → 查询共养人列表 → 初始化付款人为当前用户
  用户选择付款人 → 更新 form.payerOpenid/payerName
  onSubmit → 携带 payerOpenid/payerName → billManage.add/update

[bill 账单列表]
  loadMonthData → billManage.list → bills 含 payerName
  groupBillsByDate 透传 payerName
  WXML 渲染 bill-payer-name

[bill-stats 消费统计]
  onLoad → 查询共养人列表 → 初始化 selectedPayer = 'all'
  用户点击筛选标签 → setData({ selectedPayer }) → loadStats/loadTrends
  loadStats → billManage.list 携带 payerOpenid（非 all 时）
```

---

## 六、边界条件与异常处理

- 旧账单无 `payerName` 字段：列表中付款人小字用 `wx:if="{{bill.payerName}}"` 保护，旧数据不显示。
- 旧账单无 `payerOpenid`：统计筛选时若选了某人，旧数据将不出现在结果中，这是预期行为（旧数据默认视为创建人付款，但因字段缺失而被过滤）。如需兼容，可在筛选时同时匹配 `payerOpenid === openid || (_openid === openid && payerOpenid 不存在)`，但实现复杂度较高，当前版本不处理，接受此 trade-off。
- 共养人列表加载失败：付款人选择器显示兜底选项（仅当前用户），不影响记账主流程。
- member 角色用户无记账权限，bill-add 页面 onLoad 中已有权限拦截，不影响此功能。
