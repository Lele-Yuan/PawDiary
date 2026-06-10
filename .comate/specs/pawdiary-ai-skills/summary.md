# PawDiary AI Skills 接入 - 总结

## 完成情况

按计划完成 6 个任务的代码侧实现：声明 3 个独立分包 + 3 个 SKILL（record / bill / reminder）。chatBot 端联调（开发者工具实际跑流程）需在小程序云控制台为 agent 同步 skill 配置后由用户回归。

## 关键产出

### 配置改动
- `miniprogram/app.json`：新增 `subPackages`（3 个独立分包）与 `agent.skills` 数组

### 新增分包
```
miniprogram/skills/
├── record-skill/
│   ├── mcp.json            # 接口/参数声明（addRecord / listRecords / deleteRecord）
│   ├── SKILL.md            # 业务编排 + 23 种类型中文映射 + 铁律
│   ├── index.js            # 调用 recordManage 云函数
│   └── components/
│       ├── record-card/
│       └── record-list-card/
├── bill-skill/
│   ├── mcp.json            # addBill / listBills / getMonthlyStats
│   ├── SKILL.md            # category 映射 + 铁律（金额必须显式、查询走 stats 不要自行 sum）
│   ├── index.js            # 调用 billManage 云函数
│   └── components/
│       ├── bill-card/
│       ├── bill-list-card/
│       └── bill-stats-card/
└── reminder-skill/
    ├── mcp.json            # listUpcomingReminders / getNextReminderByType
    ├── SKILL.md            # 仅查不写、空结果不编造
    ├── index.js            # wx.cloud.database 直查 records
    └── components/
        └── reminder-list-card/
```

### 核心机制：宠物名解析（resolvePetId）
3 个 SKILL 各自实现一份（独立分包之间不能跨包 require）：
- AI 传 `petName` → 调 `petManage.list` 精确匹配（trim + toLowerCase），未命中直接报「对不起没找到宠物 ${name}，请核实是否已添加 ${name}」，**不做兜底**
- AI 未传 `petName` → `currentPetId`（storage）→ list 首只 → 报"请先在首页添加并选择宠物"

### 错误返回统一形态
所有 SKILL 接口失败时返回 `{ isError: true, message: ... }`，成功时返回 `{ isError: false, card: '...', data: {...} }`。

## 视觉风格
所有原子卡片复用全局紫色 token：
- 背景白色 + 圆角 32rpx + 紫色软阴影 `rgba(123,92,245,0.08)`
- 主文字 `#1F1A3D`，次级 `#6B6585`，浅灰 `#B5B0C8`
- 高亮值 `#7B5CF5`，背景色 `#EFEAFE`，分隔线 `#F8F5FF`
- 提醒 chip：紫色（普通）/ 主紫填充（≤3 天）/ 橙红填充（已过期）

## 用户需要补充的步骤

1. **小程序 IDE 中重启**：让 `app.json` 的 `subPackages` 与 `agent.skills` 生效
2. **云控制台 / agent 后台同步 skill 配置**：根据微信文档，`agent.skills` 仅声明分包入口；agent 端识别 mcp.json 才能让模型选用 SKILL（具体路径见 botId=`ibot-petmanage-v53gsx` 对应的 agent 控制台）
3. **回归三类话术**：
   - "给来福记一下今天体重 5.2 公斤" → record-card
   - "豆豆这个月花了多少" → bill-stats-card
   - "查询近期到期的提醒" → reminder-list-card
   - 不存在的宠物名："给小白记一笔狗粮 100" → 错误提示
4. **如有需要**：调整 `pages/chatBot/chatBot.js` 的 botId / agentConfig（已开启 `showToolCallDetail`，无需改动）

## 风险与注意事项

- **`require('skill')` 模块**：来自微信小程序官方 agent skill SDK，需基础库 ≥ 3.16.1。若构建报错，请确认基础库版本与开发者工具版本
- **`reminder-skill` 直连数据库**：依赖云开发安全规则 `auth.openid == doc._openid`；如规则未配置，可改为新增 `recordManage.listReminders` 动作（本期未做）
- **同名宠物**：一期取列表第一只命中项；后续可加追问"你说的是哪只？"
- **中文 petName 大小写归一化**：当前对中文不敏感（`toLowerCase` 仅影响英文名），中文用 trim 即可；不存在中文大小写差异
- **agent 后端同步**：本地代码完整，但 SKILL 是否被模型选用取决于 agent 后台是否识别 `agent.skills` 与 mcp.json。这一步在云端，本地无法验证
- **未做**：updateRecord / updateBill 编辑场景；checklist / map / care / visit / memorial SKILL；卡片点击跳转参数透传

## 后续建议
- 真机回归后视情况补充 `updateRecord` / `updateBill`
- 若开发者工具反馈 `wx.cloud.callFunction` 在 SKILL 环境下需要 `wx.cloud.init` 显式参数，统一调整 init 写法
- `resolvePetId` 在 3 个 SKILL 内重复出现，独立分包限制下只能这样；若后续支持共享 npm，可抽到公共包
