# SplitPal 记账分账工具 — 任务计划

- [x] Task 1: 新增常量定义（utils/constants.js）
    - 1.1: 新增 `SPLIT_CATEGORIES`（餐饮/交通/住宿/购物/娱乐/医疗/礼物/其他）与 `SPLIT_CATEGORY_MAP`
    - 1.2: `COLLECTIONS` 补充 `SPLIT_ACTIVITIES / SPLIT_MEMBERS / SPLIT_BILLS / SPLIT_SETTLEMENTS`
    - 1.3: 导出新增常量

- [x] Task 2: 创建 splitManage 云函数骨架与活动 action
    - 2.1: 新建 `cloudfunctions/splitManage/{index.js, package.json}`，拷贝 contentSecurity.js
    - 2.2: 实现 action 分发与统一返回体 `{code,message,data}` + 成员鉴权工具函数
    - 2.3: `createActivity`（生成 inviteCode、写活动、创建者入 split_members）
    - 2.4: `updateActivity`（creator 校验）、`listActivities`（按 status 分组）、`getActivity`（含成员列表）
    - 2.5: `joinActivity`（inviteCode 校验、幂等去重、拷贝用户昵称头像）

- [x] Task 3: splitManage 账单 action
    - 3.1: `addBill`（金额正整数校验、内容安全、AA 均摊余数分配 / 自定义 splits 合计校验、累加活动冗余字段）
    - 3.2: `updateBill` / `deleteBill`（记录人或 creator 权限、回滚冗余字段）
    - 3.3: `listBills`（按 billDate 倒序）

- [x] Task 4: splitManage 结算与统计 action
    - 4.1: `calcSettlement`（贪心双指针算法、先删后写 split_settlements）
    - 4.2: `listSettlements`（清单 + 进度）、`markPaid`（标记 + 全清则活动置 settled）
    - 4.3: `getStats`（分类占比 + 各成员应付汇总）

- [x] Task 5: profile 入口改造
    - 5.1: profile.wxml 常用功能网格新增「记账分账」入口项
    - 5.2: profile.js 新增 `goSplitpal()` 跳转
    - 5.3: app.json 注册 splitpal 三个页面路径

- [x] Task 6: 活动列表页 splitpal/index
    - 6.1: 页面四文件与 nav-bar、头部汇总 chips
    - 6.2: 进行中 / 已结清分组渲染 + 空态
    - 6.3: FAB 新建跳转、点击进详情、onShow 拉取 listActivities

- [x] Task 7: 创建 / 编辑活动页 activity-edit
    - 7.1: 名称输入 + emoji 选择 UI
    - 7.2: 保存调 createActivity / updateActivity 并返回

- [x] Task 8: 活动详情页 activity-detail（容器）
    - 8.1: detail-cover 封面、成员行、Tab 栏（账单/结算/统计）
    - 8.2: onLoad 解析 activityId + inviteCode 触发 joinActivity；getActivity 拉取详情
    - 8.3: 邀请弹层 + onShareAppMessage 转发携带参数、成员列表展示

- [x] Task 9: 账单 Tab 与记一笔弹层
    - 9.1: 账单 Tab 按日期分组列表 + 添加账单按钮
    - 9.2: 记一笔弹层（分类网格、金额、描述、付款人选择、AA 开关、参与成员多选、自定义分摊输入）
    - 9.3: 提交调 addBill / updateBill，处理内容安全 -1001，成功刷新列表

- [x] Task 10: 结算 Tab 与统计 Tab
    - 10.1: 结算 Tab：我的账单概览、进入触发 calcSettlement + listSettlements、转账清单、markPaid、进度条、结清态
    - 10.2: 统计 Tab：分类占比 canvas 环形图（复用现有方案）+ 各成员应付条形图

- [x] Task 11: 联调与验证
    - 11.1: 静态验证：全部新增/修改 JS 通过 node --check，JSON 配置合法；云函数需在开发者工具上传部署（splitManage）并创建 4 个集合后走通闭环
    - 11.2: 已核对金额分/元换算、AA 余数分配、自定义合计校验、权限与边界逻辑；改动仅新增页面/云函数 + profile 两处，现有功能无回归
