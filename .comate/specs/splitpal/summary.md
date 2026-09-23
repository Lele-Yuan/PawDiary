# SplitPal 记账分账工具 — 完成总结

## 概述
在 PawDiary 小程序「我的」页「常用功能」新增独立的「记账分账」工具，对齐原型 `miniapp_design.html`。以「活动」为维度组织多人共同消费，支持发起活动、邀请加入、逐笔记账、AA/自定义分摊、云函数智能结算（最小化转账笔数）、标记还款与消费统计。该模块与现有「按宠物记账」的 `bill` 模块完全隔离，互不影响。

## 交付内容

### 新增云函数 `cloudfunctions/splitManage/`
- `index.js`：单函数 action 分发，含 13 个 action
  - 活动：`createActivity / updateActivity / listActivities / getActivity / joinActivity`
  - 账单：`addBill / updateBill / deleteBill / listBills`
  - 结算统计：`calcSettlement / listSettlements / markPaid / getStats`
- `contentSecurity.js`（复用现有内容安全模块）、`package.json`
- 关键逻辑：成员鉴权、金额以「分」整数存储、AA 均摊余数分配、自定义分摊合计校验、贪心双指针结算算法、活动冗余字段（totalAmount/billCount/memberCount）同步、全部结清自动置 `settled`

### 新增页面 `miniprogram/pages/splitpal/`
- `index/`：活动列表（进行中/已结清分组、头部汇总、FAB 新建、下拉刷新）
- `activity-edit/`：创建/编辑活动（名称 + 封面 emoji）
- `activity-detail/`：活动详情容器
  - 封面 + 成员行 + 三 Tab（账单/结算/统计）
  - 账单 Tab：按日期分组列表、点击编辑、长按删除、记一笔弹层（分类/金额/描述/付款人/AA 开关/参与成员多选/自定义分摊输入）
  - 结算 Tab：我的账单概览、转账清单、标记还款、进度条、结清态
  - 统计 Tab：分类占比 + 各成员应付条形图
  - 邀请弹层：`onShareAppMessage` 转发携带 `activityId + inviteCode`，好友打开自动 `joinActivity`；复制邀请信息

### 修改文件
- `miniprogram/app.json`：注册 splitpal 三个页面
- `miniprogram/pages/profile/profile.wxml`：常用功能网格新增「🧾 记账分账」入口
- `miniprogram/pages/profile/profile.js`：新增 `goSplitpal()`
- `miniprogram/utils/constants.js`：新增 `SPLIT_CATEGORIES / SPLIT_CATEGORY_MAP / SPLIT_CATEGORY_COLORS` 及 4 个集合名常量

## 数据模型（新增集合）
`split_activities`（活动）、`split_members`（成员）、`split_bills`（账单）、`split_settlements`（结算项），金额字段统一为「分」整数。

## 验证情况
- 全部新增/修改 JS 通过 `node --check`，JSON 配置合法。
- 已核对金额换算、AA 余数、自定义合计、鉴权与边界逻辑。
- 改动范围可控（仅新增 + profile 两处小改），现有功能无回归风险。

## 上线前需手动完成（云环境不可从本地代码侧操作）
1. 微信开发者工具中右键 `cloudfunctions/splitManage` → 上传并部署（云端安装依赖）。
2. 云开发控制台创建 4 个集合：`split_activities`、`split_members`、`split_bills`、`split_settlements`，读写权限设为「仅创建者可读写」（数据均经云函数以 openid 鉴权访问）。
3. 建议为 `split_members` 的 `openid`/`activityId`、`split_bills`/`split_settlements` 的 `activityId` 建立索引。
4. 真机走通闭环：建活动 → 转发邀请 → 多人记账 → AA/自定义分摊 → 结算 → 标记还款 → 结清。

## 后续可迭代（本次未做，已在 doc.md 标注）
小程序码邀请（wxacode）、canvas 账单分享长图、票据拍照上传、结算完成订阅消息推送、云数据库实时监听。
