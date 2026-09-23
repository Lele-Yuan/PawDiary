# SplitPal 记账分账工具 — 设计文档

## 一、需求分类与概述

在 PawDiary 小程序中新增一个「记账分账工具」，入口放在 `profile` 页「常用功能」模块。功能对齐原型 `miniapp_design.html`（产品名 SplitPal）：以「活动」为维度组织多人共同消费，支持发起活动、邀请成员、逐笔记账、AA/自定义分摊、云函数智能结算（最小化转账笔数）、标记还款、账单分享。

分类：**新功能开发（独立模块）**，涉及新增页面、新增云函数、新增数据库集合、以及对 `profile` 页的入口改造。

## 二、与现有账单模块的关系（重要）

现有 `miniprogram/pages/bill/` 是 TabBar 内的「按宠物记账」模块：数据写入 `bills` 集合，含 `petId / payerOpenid`，仅统计与付款人归属，**没有分摊与结算**，鉴权依赖 `pet_members`。

本需求是「活动维度的多人分账」，与宠物无关，数据结构、鉴权主体、交互流程都不同。因此：

- 作为**独立新模块**实现，目录 `miniprogram/pages/splitpal/`，不改动现有 `bill` 模块。
- 新增独立集合，统一加 `split_` 前缀：`split_activities / split_members / split_bills / split_settlements`，与现有 `bills` 完全隔离。
- 复用现有基础设施：`login` 云函数取 openid、`users` 集合取昵称头像、`contentSecurity` 内容安全模块、`nav-bar` 组件、`app.wxss` 全局样式与 `utils/util.js` 工具。

## 三、范围划分

### MVP（本次实现）
- profile「常用功能」新增「记账分账」入口
- 活动列表首页：进行中 / 已结清分组，头部汇总（进行中数、待结算金额、历史活动数），新建活动
- 创建 / 编辑活动：名称、封面 emoji、币种默认 CNY
- 邀请成员：`onShareAppMessage` 转发卡片携带 `activityId + inviteCode`，好友打开自动 `joinActivity`；成员列表展示
- 活动详情：成员行 + 三个 Tab（账单 / 结算 / 统计）
- 记一笔：分类、金额、描述、付款人、AA 均摊开关、参与成员多选；关闭 AA 时按参与成员自定义分摊金额
- 智能结算：云函数贪心算法生成最优转账清单；标记还款；全部结清后活动置为 settled
- 统计：分类占比（复用现有 canvas 环形图方案）+ 各成员应付金额条形图
- 金额一律以「分」为整数存储，展示层换算为「元」，规避浮点误差

### 延后（本次不做，doc 中标注为 V2）
- 小程序码邀请（wxacode.getUnlimited，可后续新增 `splitWxacode` 云函数，参考现有 `dgtiWxacode`）
- canvas 生成账单分享长图并保存相册
- 票据拍照上传云存储（`receiptUrl`）
- 结算完成的订阅消息推送
- 云数据库实时监听 watch（MVP 用下拉刷新 + 页面 onShow 重新拉取）

## 四、架构与技术方案

沿用项目既有「单领域一个 `xxxManage` 云函数 + action 分发」约定。新增一个云函数 `splitManage`，前端统一通过 `wx.cloud.callFunction({ name: 'splitManage', data: { action, data } })` 调用，返回体统一为 `{ code, message, data }`（`code:0` 成功）。

鉴权主体是「活动成员」：所有读写先查 `split_members` 校验 `openid` 是否属于该活动；写操作（改活动、结算）额外校验 `role==='creator'`。openid 由云函数 `cloud.getWXContext()` 获取，前端不可伪造。

## 五、数据模型（新增集合，均加 `split_` 前缀）

### split_activities（活动）
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 自动 |
| `_openid` | string | 创建者 openid（云端自动写入） |
| `name` | string | 活动名 |
| `coverEmoji` | string | 封面 emoji，默认 🧾 |
| `inviteCode` | string | 邀请码，创建时生成的随机串 |
| `currency` | string | 币种，默认 `CNY` |
| `status` | string | `active` / `settled` |
| `memberCount` | number | 成员数冗余，便于列表展示 |
| `totalAmount` | number | 总花费（分），随记账累加，便于列表展示 |
| `billCount` | number | 账单笔数冗余 |
| `createdAt` | date | 创建时间 |
| `updatedAt` | date | 更新时间 |

### split_members（活动成员）
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 自动 |
| `activityId` | string | 所属活动 |
| `openid` | string | 成员 openid |
| `nickName` | string | 昵称（加入时从 users 拷贝） |
| `avatarUrl` | string | 头像 |
| `role` | string | `creator` / `member` |
| `joinedAt` | date | 加入时间 |

### split_bills（账单）
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 自动 |
| `_openid` | string | 记录人 openid |
| `activityId` | string | 所属活动 |
| `category` | string | 分类枚举（见下） |
| `title` | string | 明细描述 |
| `amount` | number | 金额（分），整数 |
| `payerId` | string | 付款人 openid |
| `payerName` | string | 付款人昵称冗余 |
| `isAA` | boolean | 是否 AA 均摊 |
| `participants` | string[] | 参与成员 openid 列表 |
| `splits` | object[] | `[{ memberId, amount }]`，分摊明细（分），合计等于 amount |
| `billDate` | date | 账单日期 |
| `createdAt` | date | 创建时间 |

### split_settlements（结算转账项）
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 自动 |
| `activityId` | string | 所属活动 |
| `fromOpenid` | string | 付款方 |
| `toOpenid` | string | 收款方 |
| `amount` | number | 金额（分） |
| `status` | string | `pending` / `paid` |
| `paidAt` | date | 标记还款时间 |
| `createdAt` | date | 生成时间 |

### 分类枚举（`utils/constants.js` 新增 `SPLIT_CATEGORIES`）
餐饮🍽️(food) / 交通🚗(transport) / 住宿🏨(hotel) / 购物🛍️(shopping) / 娱乐🎮(fun) / 医疗💊(medical) / 礼物🎁(gift) / 其他📦(other)

## 六、云函数设计：`splitManage`

目录 `cloudfunctions/splitManage/`，结构与 `billManage` 一致（`index.js` + `contentSecurity.js` + `package.json`，`contentSecurity.js` 从现有云函数拷贝复用）。action 分发：

| action | 说明 | 鉴权 |
| --- | --- | --- |
| `createActivity` | 建活动 + 生成 inviteCode + 创建者写入 members | 登录用户 |
| `updateActivity` | 改名 / 封面 | creator |
| `listActivities` | 我参与的活动列表（按 status 分组） | 成员 |
| `getActivity` | 活动详情 + 成员列表 | 成员 |
| `joinActivity` | 按 inviteCode 加入，幂等去重 | 登录用户 |
| `addBill` | 记一笔，内容安全校验，AA 自动均摊 / 校验自定义 splits 合计 | 成员 |
| `updateBill` / `deleteBill` | 编辑 / 删除账单 | 记录人或 creator |
| `listBills` | 活动账单列表（按日期倒序） | 成员 |
| `getStats` | 分类占比 + 各成员应付汇总 | 成员 |
| `calcSettlement` | 贪心算法生成结算清单，覆盖旧记录 | 成员 |
| `listSettlements` | 结算清单 + 进度 | 成员 |
| `markPaid` | 标记某笔已还，全部结清则活动置 settled | 成员 |

关键实现要点：
- `createActivity` 内 `inviteCode` 用时间戳 + 随机字符生成（云端 `Math.random`），保证足够随机；创建者 openid、nickName、avatarUrl 从 `users` 集合读取写入 `split_members`。
- `addBill` 金额校验为正整数（分）；AA 模式按 `participants` 均分，余数分配给前若干人保证合计精确等于 `amount`；自定义模式校验 `splits` 合计严格等于 `amount`。写入后累加 `split_activities` 的 `totalAmount / billCount`。
- 内容安全：对 `title` 调 `security.checkText`，命中返回 `security.violationResult()`（沿用 `-1001` 处理约定）。

### 结算算法（贪心双指针，最小化转账笔数）
```js
// 1. 汇总每人净余额（分）：付款 +amount，分摊 -split.amount
const net = {};
for (const b of bills) {
  net[b.payerId] = (net[b.payerId] || 0) + b.amount;
  for (const s of b.splits) net[s.memberId] = (net[s.memberId] || 0) - s.amount;
}
// 2. 拆成债权人 / 债务人并按金额降序
const creditors = [], debtors = [];
for (const [id, bal] of Object.entries(net)) {
  if (bal > 0) creditors.push({ id, amount: bal });
  else if (bal < 0) debtors.push({ id, amount: -bal });
}
creditors.sort((a, b) => b.amount - a.amount);
debtors.sort((a, b) => b.amount - a.amount);
// 3. 双指针配对生成转账项
const settlements = [];
let i = 0, j = 0;
while (i < creditors.length && j < debtors.length) {
  const pay = Math.min(creditors[i].amount, debtors[j].amount);
  settlements.push({ fromOpenid: debtors[j].id, toOpenid: creditors[i].id, amount: pay });
  creditors[i].amount -= pay; debtors[j].amount -= pay;
  if (creditors[i].amount === 0) i++;
  if (debtors[j].amount === 0) j++;
}
// 4. 覆盖写入 split_settlements（先删旧、再批量 add，status:'pending'）
```

## 七、页面设计（新增 `miniprogram/pages/splitpal/`）

| 页面 | 路径 | 职责 | 关键交互 |
| --- | --- | --- | --- |
| 活动列表 | `splitpal/index/index` | 我的活动列表 | 头部汇总 chips；进行中/已结清分组；FAB 新建；点击进详情；`onShow` 重新拉取 |
| 创建/编辑活动 | `splitpal/activity-edit/activity-edit` | 建/改活动 | 名称输入、emoji 选择；保存调 `createActivity`/`updateActivity` |
| 活动详情 | `splitpal/activity-detail/activity-detail` | 详情容器 + 三 Tab | 成员行、Tab 切换（账单/结算/统计）、右上分享入口、`onShareAppMessage` |
| 记一笔（弹窗组件） | `splitpal/components/bill-sheet` 或页面内弹层 | 添加/编辑账单 | 分类网格、金额、描述、付款人选择、AA 开关、参与成员多选、自定义分摊输入 |
| 邀请成员（弹层） | 详情页内弹层 | 分享入口 + 成员列表 | 转发按钮触发系统分享；复制邀请信息；展示成员 |

结算与统计作为详情页的 Tab（scroll-view 切换），不单独建页；结算 Tab 首次进入或数据变化时调 `calcSettlement` 再 `listSettlements`。加入活动落地在 `splitpal/index/index` 或 `activity-detail` 的 `onLoad`：解析 `options.activityId + options.inviteCode`，调 `joinActivity` 后进入详情。

样式沿用 `app.wxss` 变量（主色 `#7B5CF5` 紫系），组件复用 `nav-bar`。所有页面 `navigationStyle: custom`。

## 八、入口改造（profile）

- `miniprogram/pages/profile/profile.wxml`：在 `.quick-actions-grid`（第 43-60 行）内新增一项：
  ```xml
  <view class="quick-action-item" bindtap="goSplitpal">
    <view class="quick-action-icon">🧾</view>
    <text class="quick-action-label">记账分账</text>
  </view>
  ```
- `miniprogram/pages/profile/profile.js`：新增 `goSplitpal()`，`wx.navigateTo({ url: '/pages/splitpal/index/index' })`，与现有 `goDgti` 等方法风格一致。

## 九、受影响文件清单

新增：
- `cloudfunctions/splitManage/{index.js, contentSecurity.js, package.json}` — 分账云函数
- `miniprogram/pages/splitpal/index/*` — 活动列表
- `miniprogram/pages/splitpal/activity-edit/*` — 创建/编辑活动
- `miniprogram/pages/splitpal/activity-detail/*` — 活动详情（含账单/结算/统计 Tab、记一笔弹层、邀请弹层）

修改：
- `miniprogram/app.json` — `pages` 数组注册 3 个新页面
- `miniprogram/pages/profile/profile.wxml` — 新增「记账分账」入口项
- `miniprogram/pages/profile/profile.js` — 新增 `goSplitpal()`
- `miniprogram/utils/constants.js` — 新增 `SPLIT_CATEGORIES / SPLIT_CATEGORY_MAP` 与集合名常量（`SPLIT_ACTIVITIES` 等）

## 十、边界条件与异常处理

- 未登录（游客）：进入分账首页时若无 openid，引导先登录（复用 `login-modal` 或提示跳 profile 登录）。
- 邀请重复加入：`joinActivity` 按 `activityId+openid` 幂等，已加入直接返回成功进入详情。
- 邀请码失效 / 活动不存在：返回明确错误并 toast。
- 金额：仅接受正整数分；自定义分摊合计必须等于账单金额，否则拒绝并提示。
- AA 均摊除不尽：余数按顺序补给前几名，保证合计精确。
- 权限：非成员访问任何 action 返回「无权访问」；改活动/删他人账单需 creator。
- 结算并发：`calcSettlement` 先删后写，`markPaid` 更新单条并复核是否全部 `paid`。
- 内容安全命中：`title` 违规按 `-1001` 约定拦截并提示。

## 十一、数据流

记账入账 → `split_bills` 累加活动 `totalAmount/billCount` → 进入结算 Tab 触发 `calcSettlement` 读取全部账单算净余额 → 贪心生成 `split_settlements` → 用户 `markPaid` 逐笔标记 → 全部 `paid` 则 `split_activities.status='settled'` → 列表页「已结清」分组展示。

## 十二、预期结果

- profile 出现「记账分账」入口，点击进入独立分账工具，与宠物账单互不影响。
- 可完成「建活动 → 邀请 → 多人记账 → AA/自定义分摊 → 智能结算 → 标记还款 → 结清」完整闭环。
- 金额以分存储，结算转账笔数最优，无浮点误差。
- 现有功能零回归（仅新增页面/云函数 + profile 两处小改）。

## 十三、待确认事项

1. 模块命名与入口文案：暂定「记账分账」+ 🧾 图标，是否沿用？
2. 邀请方式：MVP 用「转发小程序卡片自动加入」，小程序码（wxacode）延后到 V2，是否接受？
3. 金额单位：内部以「分」整数存储（与现有宠物账单的元浮点不同，但更稳妥），是否认可？
4. 结算/统计以详情页 Tab 呈现，不单独建页，是否可以？
