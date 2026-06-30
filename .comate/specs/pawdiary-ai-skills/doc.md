# PawDiary AI Skills 接入（pawdiary-ai-skills）

为 PawDiary 引入 3 个微信云开发 AI Skill，让 chatBot（agent-ui）可以通过自然语言完成"记录 / 记账 / 提醒"三类高频操作，并以原子卡片形式回显结果。

## 1. 需求场景

当前 chatBot 仅作为对话型咨询入口，无法操作小程序内业务数据。本期目标：让用户在 chatBot 里直接说出"记一下豆豆今天体重 5.2 公斤""这个月给豆豆花了多少""下次驱虫是哪天"，由 AI 自动调用对应 SKILL 完成数据写入/查询并以卡片形式展示。

### 三个 SKILL
- **record-skill**：宠物日常记录（体重、饮食、驱虫、疫苗、就诊等 23 种类型）的新增、查询、删除
- **bill-skill**：账单的新增、查询、月度统计
- **reminder-skill**：基于 records 的 `enableRemind / nextDate / remindSendAt` 字段查询即将到来的提醒（仅读，不写）

## 2. 架构与技术方案

### 2.1 目录结构（独立分包）

```
miniprogram/
├── skills/
│   ├── record-skill/
│   │   ├── mcp.json
│   │   ├── SKILL.md
│   │   ├── index.js
│   │   └── components/
│   │       ├── record-card/        # 单条记录展示
│   │       └── record-list-card/   # 列表展示
│   ├── bill-skill/
│   │   ├── mcp.json
│   │   ├── SKILL.md
│   │   ├── index.js
│   │   └── components/
│   │       ├── bill-card/
│   │       ├── bill-list-card/
│   │       └── bill-stats-card/
│   └── reminder-skill/
│       ├── mcp.json
│       ├── SKILL.md
│       ├── index.js
│       └── components/
│           └── reminder-list-card/
```

### 2.2 app.json 改造

在 `subPackages` 中加入 3 个 `independent: true` 分包，并新增 `agent.skills` 数组声明。注：`agent` 配置目前在文档中是固定字段名，需保留 `lazyCodeLoading: requiredComponents`（已存在）。

```json
{
  "lazyCodeLoading": "requiredComponents",
  "cloud": true,
  "subPackages": [
    { "root": "skills/record-skill",   "independent": true, "pages": [] },
    { "root": "skills/bill-skill",     "independent": true, "pages": [] },
    { "root": "skills/reminder-skill", "independent": true, "pages": [] }
  ],
  "agent": {
    "skills": [
      { "name": "record",   "description": "宠物日常记录管理：新增、查询、删除体重/饮食/驱虫/疫苗/就诊等记录", "path": "skills/record-skill" },
      { "name": "bill",     "description": "宠物账单：新增消费、查询账单、查看月度统计", "path": "skills/bill-skill" },
      { "name": "reminder", "description": "查询宠物提醒事项：下次驱虫、下次疫苗、即将到期的所有提醒", "path": "skills/reminder-skill" }
    ]
  }
}
```

### 2.3 chatBot 接入 SKILL

`pages/chatBot/chatBot.js` 中 `agentConfig` 需补充：开启工具调用展示（`showToolCallDetail` 已开），无需额外代码——agent 后台会自动从 `app.json.agent.skills` 读取并把 SKILL 工具下发给模型。

> 由于 SKILL 依赖云端 agent 配置（`botId`），本地侧只需声明分包+`mcp.json`+`SKILL.md`+`index.js`，agent 端会在云控制台同步识别。

### 2.4 宠物解析逻辑（按名字优先 → 当前宠物兜底）

所有接口都需要 `petId`，但**不让 AI 直接传 petId**（避免编造）。改为暴露一个可选的 `petName` 字符串参数给 AI：

**解析顺序：**
1. **如果 AI 传入 `petName`**（用户说"给来福记一下…""来福这个月花了多少…"）：
   - SKILL 内部调用 `petManage.list` 取出当前用户能管理的所有宠物
   - 在结果中按 `name` 精确匹配（先完全相等，其次去空格/大小写归一化后相等）
   - 命中 → 取该宠物 `_id` 作为 `petId`
   - 未命中 → 直接返回错误：`{ isError: true, message: '对不起没找到宠物 ${petName}，请核实是否已添加 ${petName}' }`，**不做任何写操作**，也不回退到当前宠物
2. **如果 AI 未传 `petName`**（用户说"查询近期到期/已到期的提醒""这个月花了多少"）：
   - 从 `wx.getStorageSync('currentPetId')` 读取当前选中宠物
   - 若取不到，调用 `petManage.list` 取首个宠物作为兜底
   - 仍取不到 → 返回 `{ isError: true, message: '请先在首页添加并选择宠物' }`

**mcp.json 中对 `petName` 参数的说明（务必写清）：**
> "宠物名字。如果用户在话语中明确提到了宠物的名字（如"给来福记一下…""豆豆这个月花了多少"），必须填写该名字；如果用户没有提到任何宠物名字，则不要填写此字段（缺省时使用当前选中宠物）。禁止编造或猜测宠物名字。"

**实现位置：** 抽取一个公共方法 `resolvePetId({ petName })` 放在每个 SKILL 的 `index.js` 顶部（或后续抽到共享 util；一期可在 3 个 SKILL 内重复实现以保持分包独立）。所有写/读接口入口处先调用它。

## 3. 各 SKILL 详细设计

### 3.1 record-skill

**接口列表（mcp.json）：**

| 接口 | 描述 | 参数 |
|---|---|---|
| `addRecord` | 新增一条宠物记录 | `petName`（可选，见 §2.4）、`type`（必填，枚举见下）、`title`（必填，简短描述）、`date`（可选 ISO，缺省今天）、`weight`、`weightUnit`、`waterAmount`、`foodType`、`foodAmount`、`dewormType`、`vaccineType`、`hospitalName`、`cost`、`description` 等类型特定字段 |
| `listRecords` | 查询记录列表 | `petName`（可选）、`type`（可选，默认全部）、`startDate`、`endDate`、`limit`（默认 20） |
| `deleteRecord` | 删除一条记录 | `recordId`（必填，**必须来自 listRecords 返回**） |

**type 枚举说明（写入 mcp.json description 中给 AI 看）：**
- `weight` 体重 / `diet` 饮食 / `water` 饮水 / `poop` 排便
- `deworm` 驱虫 / `vaccine` 疫苗 / `checkup` 体检 / `illness` 生病
- `bath` 洗澡 / `nail` 剪指甲 / `ear` 清耳 / `paw` 修毛 / `gland` 挤腺 / `teeth` 刷牙 / `beauty` 美容
- `disinfect` 消毒 / `litter` 换砂 / `toy` 玩具 / `cage` 清笼
- `abnormal` 异常 / `heat` 发情 / `trouble` 捅娄子 / `stealfood` 偷吃

**底层调用：** `wx.cloud.callFunction({ name: 'recordManage', data: { action: 'add'|'list'|'delete', data: {...} } })`

**卡片：**
- `record-card`：单条新增成功回显（标题、类型 emoji、日期、关键字段）
- `record-list-card`：列表回显（最多展示 5 条 + "进入记录页查看更多"）

**业务约束（写入 SKILL.md）：**
- `addRecord` 仅当云函数返回 `code===0` 才能向用户宣布"已记录"
- `deleteRecord.recordId` 必须从 `listRecords` 返回的 `_id` 取，禁止编造或从用户描述推断
- 用户表述"记一下"未给具体内容时，先反问"想记录什么"
- 体重等数值字段，模型须明确取值（如"5.2 公斤"），不可猜测

### 3.2 bill-skill

**接口列表：**

| 接口 | 描述 | 参数 |
|---|---|---|
| `addBill` | 新增账单 | `petName`（可选，见 §2.4）、`amount`（必填，单位元）、`category`（必填，枚举）、`title`（必填）、`date`（可选默认今天）、`note` |
| `listBills` | 查询账单 | `petName`（可选）、`year`、`month`（可选，缺省查全部）、`limit`（默认 20） |
| `getMonthlyStats` | 月度统计 | `petName`（可选）、`year`、`month`（缺省当月）、`trend`（可选 boolean） |

**category 枚举：** `food` 食物 / `medical` 医疗 / `toy` 玩具 / `grooming` 美容 / `daily` 日用 / `other` 其他

**底层调用：** `billManage` 云函数

**卡片：**
- `bill-card`：单条账单（金额、分类图标、日期）
- `bill-list-card`：账单列表
- `bill-stats-card`：月度统计（总额、分类占比环形图、环比上月、可选 6 个月柱状图）

**约束：**
- `amount` 必须显式数值，不能凭空"几十块钱"
- 询问"花了多少"统一走 `getMonthlyStats`，不要自己 sum

### 3.3 reminder-skill

**接口列表（只读）：**

| 接口 | 描述 | 参数 |
|---|---|---|
| `listUpcomingReminders` | 查询近期到期/已到期的提醒 | `petName`（可选，见 §2.4）、`withinDays`（可选，默认 30）、`type`（可选，按记录类型过滤） |
| `getNextReminderByType` | 查询某类型下一次提醒 | `petName`（可选）、`type`（必填，常见 `deworm`/`vaccine`/`bath`/`checkup`） |

**实现方式：**
SKILL 内部直接 `wx.cloud.database()` 查询 `records`：
```js
db.collection('records')
  .where({
    petId,
    enableRemind: true,
    nextDate: _.gte(now).and(_.lte(now + withinDays * 86400000))
  })
  .orderBy('nextDate', 'asc')
  .limit(20)
  .get();
```
权限：依赖 `_openid == doc._openid` 默认安全规则；同时为家庭成员场景，按 `pet_members` 关系筛选 petId 列表（一期可仅查当前 petId）。

**卡片：**
- `reminder-list-card`：图标 + 类型 + 下次日期 + 距今天数（"3 天后""明天""今天"）

**约束：**
- 该 SKILL 仅查询，不创建提醒；如用户说"提醒我下次驱虫"，应引导其 `addRecord` 时勾选"开启提醒"
- 若结果为空，明确告知"暂无提醒"，不要编造

## 4. 安全与权限

依据云开发文档：
- **登录态**：`wx.cloud.callFunction` 自动注入 OPENID，无需小程序侧登录
- **越权**：所有写操作都委托给已有云函数（recordManage/billManage），云函数内部已实现 `pet_members` 角色校验（creator/admin 才能写）
- **直连数据库的 reminder-skill**：通过云开发安全规则限定 `auth.openid == doc._openid`；查询结果仅来自当前用户记录
- **AI 参数不可信**：mcp.json 中所有 ID 类参数（recordId）必须强调"来自前序接口返回"

## 5. 数据流（以"给来福记一下今天体重 5.2 公斤"为例）

1. 用户输入 → agent-ui → 模型识别为 record SKILL 的 `addRecord`
2. 模型抽参：`petName=来福`、`type=weight`、`title=体重 5.2kg`、`weight=5.2`、`weightUnit=kg`、`date=今天`
3. SKILL `index.js` 执行 `resolvePetId({ petName: '来福' })`：
   - 调用 `petManage.list` 取用户名下所有宠物
   - 找到 `name === '来福'` 的宠物 → 返回其 `_id`
   - 若未找到 → 返回 `{ isError:true, message:'对不起没找到宠物 来福，请核实是否已添加 来福' }`，流程终止
4. 调用 `recordManage.add`，云函数校验权限 → 写入 records → 返回 `{code:0,_id}`
5. SKILL 返回 `{ isError:false, card:'record-card', data:{...} }`
6. agent-ui 渲染 `record-card`，模型话术："已记录来福今天的体重 5.2kg"

**对照场景"查询近期到期/已到期的提醒"：**
- 模型不传 `petName`
- SKILL 走"未传"分支：读取 `currentPetId` → 调 reminder 查询 → 返回提醒列表卡片

## 6. 边界与异常

- **指定了宠物名但找不到**：返回 `isError:true, message:'对不起没找到宠物 ${name}，请核实是否已添加 ${name}'`，**不做兜底**
- **未指定宠物名 + 未选中宠物**：返回 `isError:true, message:'请先在首页添加并选择宠物'`
- **同名宠物**（一期不考虑歧义）：取查询结果的第一只；后续可加追问"你说的是哪只？"
- **无权限**：透传云函数 `code:-1, message`
- **记录类型映射**：用户说"打疫苗"→`vaccine`；说"洗澡"→`bath`；映射规则在 SKILL.md 列表中明示
- **日期解析**：用户说"昨天/今天/上周三/3 月 15 日"，由模型解析为 ISO 字符串后传入；SKILL.md 中提示"若用户未提日期，使用当前日期"
- **金额单位**：账单 `amount` 单位为元，SKILL 中不做 `*100`

## 7. 受影响文件

| 路径 | 类型 |
|---|---|
| `miniprogram/app.json` | 修改：新增 `subPackages`、`agent.skills` |
| `miniprogram/skills/record-skill/*` | 新增（mcp.json / SKILL.md / index.js / components/） |
| `miniprogram/skills/bill-skill/*` | 新增 |
| `miniprogram/skills/reminder-skill/*` | 新增 |
| `miniprogram/pages/chatBot/chatBot.js` | 视情况微调（一般无需改） |

## 8. 预期成果

- 用户在 chatBot 中可用自然语言完成 ≥80% 的记录/记账高频操作
- 每个操作以可点击的卡片回显，点击进入对应小程序页面查看详情
- 不影响现有 chatBot 现有能力（联网、上传、语音）

## 9. 不在本期范围

- 编辑（updateRecord/updateBill）：先观察用户是否有此需求
- 检查清单 / 地图 / 互助 / 上门 / 纪念馆 SKILL：后续迭代
- 复杂记录类型（heat/trouble/stealfood）的卡片精修：先用通用记录卡片

## 10. 规范修订（2026-06-09）：迁移到「小程序 AI 开发模式」官方规范

经核对 https://developers.weixin.qq.com/miniprogram/dev/ai/integration.html ，原实现是 CloudBase Agent 风格，需统一迁移到官方"小程序 AI 开发模式"规范。

### 10.1 修订内容

- **API 注册**：`require('skill').use` → `wx.modelContext.createSkill(skillAbsPath).registerAPI`
- **返回值结构**：
  - 旧：`{ isError, card, data, message }`
  - 新：
    ```js
    {
      isError: false,
      content: [{ type: 'text', text: '已为来福记录今天体重 5.2kg' }],
      structuredContent: { /* 给 LLM + 原子组件渲染 */ },
      _meta: { /* 对 LLM 不可见，传给原子组件 */ }
    }
    ```
- **mcp.json 顶层结构**：
  ```json
  {
    "apis": [
      {
        "name": "addRecord",
        "description": "...",
        "inputSchema": { "type": "object", "properties": {...}, "required": [...] },
        "outputSchema": { "type": "object", "properties": {...} },
        "_meta": { "ui": { "componentPath": "components/record-card" } }
      }
    ],
    "components": [
      { "path": "components/record-card" }
    ]
  }
  ```
- **目录调整**：业务实现移入 `apis/` 子目录，每个原子接口一个文件；`index.js` 仅做注册
- **原子组件**：改用 `wx.modelContext.getContext(this).on(NotificationType.Input | Result, cb)` 接收数据，不再用 `properties.data`
- **组件二次交互**：通过 `wx.modelContext.getViewContext(this).sendFollowUpMessage(...)` 触发 follow-up；进入小程序详情页用 `openDetailPage({ url })`（替代之前 mcp 里的 `relatedPage` 字段）
- **`lazyCodeLoading: 'requiredComponents'`**：必须在 `app.json` 顶层声明（已存在，复核保留）
- **可选全局提示词**：暂不引入 `AGENTS.md`，待回归后再加

### 10.2 迁移后目录结构

```
miniprogram/skills/
├── record-skill/
│   ├── SKILL.md
│   ├── mcp.json
│   ├── index.js              # createSkill + registerAPI 三个接口
│   ├── apis/
│   │   ├── _resolvePet.js    # 公共：宠物名解析（按官方中间件机制可扩展）
│   │   ├── addRecord.js
│   │   ├── listRecords.js
│   │   └── deleteRecord.js
│   └── components/
│       ├── record-card/
│       └── record-list-card/
├── bill-skill/ (apis: addBill / listBills / getMonthlyStats，components: bill-card / bill-list-card / bill-stats-card)
└── reminder-skill/ (apis: listUpcomingReminders / getNextReminderByType，components: reminder-list-card)
```
