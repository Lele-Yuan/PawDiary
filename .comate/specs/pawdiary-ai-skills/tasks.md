# PawDiary AI Skills 接入任务计划（修订版）

> 注：先前的 task 1-6 是 CloudBase 风格初版实现，本次新增 task 7-12 按官方"小程序 AI 开发模式"规范重构。

- [x] Task 1: 配置独立分包与 agent.skills 声明
- [x] Task 2: 实现公共宠物解析逻辑（resolvePetId）
- [x] Task 3: 实现 record-skill（CloudBase 风格初版）
- [x] Task 4: 实现 bill-skill（CloudBase 风格初版）
- [x] Task 5: 实现 reminder-skill（CloudBase 风格初版）
- [x] Task 6: chatBot 联调与回归

---

## 规范迁移（2026-06-09）

- [x] Task 7: 全局配置规范化
    - 7.1: `app.json` 确认 `lazyCodeLoading: requiredComponents` 在顶层
    - 7.2: `app.json.subPackages` 三个独立分包路径调整为 `skills`
    - 7.3: `app.json.agent.skills` 的 path 使用绝对路径（如 `skills/record-skill`）

- [x] Task 8: record-skill 迁移
    - 8.1: 拆分 apis/ 目录：`_resolvePet.js`、`addRecord.js`、`listRecords.js`、`deleteRecord.js`
    - 8.2: 改写 `index.js` 用 `wx.modelContext.createSkill().registerAPI()` 注册
    - 8.3: 改写返回值结构：`{ isError, content:[{type:'text',text}], structuredContent, _meta }`
    - 8.4: 改写 `mcp.json` 顶层为 `{ apis: [...], components: [...] }`，每个 api 加 `_meta.ui.componentPath`
    - 8.5: 改写 components 用 `wx.modelContext.getContext(this).on(NotificationType.Result, cb)` 接收 structuredContent
    - 8.6: 删除组件中 `properties.data` 写法

- [x] Task 9: bill-skill 迁移
    - 9.1: 拆分 apis/ 目录：`_resolvePet.js`、`addBill.js`、`listBills.js`、`getMonthlyStats.js`
    - 9.2: index.js 用 createSkill + registerAPI 注册
    - 9.3: 返回值改 content + structuredContent
    - 9.4: mcp.json 改新结构，含 components 列表
    - 9.5: 三个组件改用 modelContext 接收数据
    - 9.6: bill-stats-card 中预计算逻辑配合新数据通道（监听 Result 后 setData）

- [x] Task 10: reminder-skill 迁移
    - 10.1: 拆分 apis/ 目录：`_resolvePet.js`、`listUpcomingReminders.js`、`getNextReminderByType.js`
    - 10.2: index.js 改 createSkill + registerAPI
    - 10.3: 返回值改 content + structuredContent
    - 10.4: mcp.json 改新结构
    - 10.5: reminder-list-card 改 modelContext 数据通道
    - 10.6: daysDiff / diffLabel 计算保留在 api 层，结构化数据带出

- [x] Task 11: 删除旧实现并校验
    - 11.1: 移除每个 skill 旧 index.js 中的 `require('skill')`、`skill.use(...)` 写法
    - 11.2: 移除组件中 `properties.data` 写法
    - 11.3: 校验 mcp.json 长度 ≤ 24000 字节、SKILL.md ≤ 16000 字节
    - 11.4: 校验所有 inputSchema / outputSchema 符合 JSON Schema

- [x] Task 12: 调试回归
    - 12.1: 在开发者工具 AI 调试入口（Nightly 版本）测试三类话术
    - 12.2: 验证「上次打疫苗是什么时候」能命中 `listRecords({type:'vaccine'})` 或 `getNextReminderByType({type:'vaccine'})`
    - 12.3: 验证 GUI 卡片正确渲染，数据来自 structuredContent
    - 12.4: 验证错误路径（不存在宠物名）返回 isError=true 且 content 中有错误说明
