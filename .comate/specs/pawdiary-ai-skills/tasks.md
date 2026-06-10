# PawDiary AI Skills 接入任务计划

- [x] Task 1: 配置独立分包与 agent.skills 声明
    - 1.1: 在 `miniprogram/app.json` 中新增 `subPackages` 三个独立分包条目
    - 1.2: 新增 `agent.skills` 数组，声明 record / bill / reminder 三个 skill
    - 1.3: 创建 `miniprogram/skills/` 根目录与三个 skill 子目录骨架（空 index.js / mcp.json / SKILL.md / components/）

- [x] Task 2: 实现公共宠物解析逻辑（resolvePetId）
    - 2.1: 在每个 skill 的 `index.js` 顶部实现 `resolvePetId({ petName })`
    - 2.2: 调用 `petManage.list` 取所有宠物，按 name 精确匹配（trim + 大小写归一化）
    - 2.3: 未命中返回错误对象 `{ isError, message: '对不起没找到宠物 ${name}，请核实是否已添加 ${name}' }`
    - 2.4: 未传 petName 时按 `currentPetId` → list 首只 → 报错"请先在首页添加并选择宠物"的顺序兜底

- [x] Task 3: 实现 record-skill
    - 3.1: 编写 `mcp.json`，声明 addRecord / listRecords / deleteRecord 三个接口（含 petName、type 枚举说明）
    - 3.2: 编写 `SKILL.md`，描述意图分流、type 中文映射、铁律（recordId 必须来自 listRecords、code===0 才宣布成功）
    - 3.3: 在 `index.js` 中实现三个接口，调用 `recordManage` 云函数
    - 3.4: 实现 `record-card` 原子组件（标题、type emoji、日期、关键字段）
    - 3.5: 实现 `record-list-card` 原子组件（≤5 条 + "进入记录页"入口，relatedPage 指向 pages/record/record）

- [x] Task 4: 实现 bill-skill
    - 4.1: 编写 `mcp.json`，声明 addBill / listBills / getMonthlyStats（含 category 枚举与 amount 单位说明）
    - 4.2: 编写 `SKILL.md`（amount 必须显式数值、查询花费走 stats 不要自行求和）
    - 4.3: 在 `index.js` 中实现三个接口，调用 `billManage` 云函数
    - 4.4: 实现 `bill-card`（金额、分类图标、日期）
    - 4.5: 实现 `bill-list-card`（账单列表）
    - 4.6: 实现 `bill-stats-card`（月总额、分类占比、环比上月、可选 trends）

- [x] Task 5: 实现 reminder-skill
    - 5.1: 编写 `mcp.json`，声明 listUpcomingReminders / getNextReminderByType（含 type 常见值）
    - 5.2: 编写 `SKILL.md`（仅查询、空结果不编造、引导用户去新增记录开启提醒）
    - 5.3: 在 `index.js` 中通过 `wx.cloud.database()` 直连 records 集合按 enableRemind+nextDate 查询
    - 5.4: 实现 `reminder-list-card`（图标、type、下次日期、距今天数 today/tomorrow/N 天后）

- [x] Task 6: chatBot 联调与回归
    - 6.1: 检查 `pages/chatBot/chatBot.js` 中 `agentConfig`，确认 `showToolCallDetail` 开启
    - 6.2: 在开发者工具中走通三类典型话术：
        "给来福记一下今天体重 5.2 公斤"、
        "豆豆这个月花了多少"、
        "查询近期到期的提醒"
    - 6.3: 验证宠物名未匹配错误、未指定宠物兜底、卡片渲染、relatedPage 跳转
    - 6.4: 视觉与全局紫色主题对齐（卡片复用 app.wxss 的 token）
