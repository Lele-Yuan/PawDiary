# 爪印日记 AI 开发模式接入与技能清单

核对日期：2026 年 11 月 6 日。依据微信官方[接入指南](https://developers.weixin.qq.com/miniprogram/dev/ai/integration.html)、[能力介绍](https://developers.weixin.qq.com/miniprogram/dev/ai/guide.html)及 [SKILL 设计建议](https://developers.weixin.qq.com/miniprogram/dev/ai/best-practices/skill.html)。

## 接入状态

本工作区已补齐 app.json 的 agent.skills、全局提示词、skills 独立分包，保留 requiredComponents 按需注入，并为全部卡片配置 relatedPage。6 个卡片按官方 Result 事件的 result.structuredContent 读取数据。没有在普通 app.js 中主动加载技能，技能入口由 AI 运行环境加载。

此处仅完成代码配置，不代表微信公众平台已批准开发模式，也不代表线上已经生效。官方当前说明仍为内测，暂未开放相关代码提审，应使用本隔离工作区测试，不将这套配置合入正式提审版本。

在微信公众平台“基础功能 > AI 能力”选择“开发模式”申请，或在微信开发者助手“管理 > 微信 AI 管理”申请。使用最新 Nightly 开发者工具导入本目录，确认 AppID 为 wxf9ffd4ae044075b0，再按调试指南验证。本次从原本地工作区复用 mealManage 云函数和来吃饭模块的 8 个页面，并适配本工作区的用户初始化方法。未自动部署云函数，也未改动原本地工作区。

## 已封装技能

共 9 个 SKILL、24 个原子接口、8 个原子组件。本次增强 pet-profile-skill，并新增共养、地图、分账和来吃饭四项技能。新增技能通过结构化数据和页面链接衔接业务，不新增卡片。

| SKILL | 原子接口 | 卡片数 | 示例 |
| --- | --- | --- | --- |
| record-skill，宠物记录 | addRecord、listRecords、deleteRecord | 2 | 记一下豆豆体重 5.2kg；上次驱虫是什么时候 |
| bill-skill，宠物账单 | addBill、listBills、getMonthlyStats | 3 | 记一笔狗粮 199 元；这个月花了多少 |
| reminder-skill，提醒查询 | listUpcomingReminders、getNextReminderByType | 1 | 近期有哪些提醒；下次疫苗哪天 |
| pet-profile-skill，宠物档案 | listPets、getPetProfile、updatePetProfile | 1 | 家里有哪些宠物；来福的品种和生日 |
| checklist-skill，宠物清单 | listChecklists | 1 | 有哪些出行清单；医院清单完成到哪了 |
| family-skill，宠物共养 | listFamilyMembers | 0 | 谁在一起养来福；我是什么角色 |
| pet-map-skill，宠物地图 | searchPlaces、getPlaceDetail | 0 | 找宠物友好公园；查看选中地点详情 |
| splitpal-skill，活动分账 | listActivities、getActivityOverview、listActivityBills、listSettlements | 0 | 露营活动花了多少；已有结算是什么 |
| mealtime-skill，来吃饭 | listMealFamilies、listFamilyDishes、getCurrentMeal、listMealHistory、getMealReceipt | 0 | 家里有什么菜；当前点了什么；上次约饭小票 |

记录技能当前支持 23 个类型：体重、排便、饮食、饮水、驱虫、疫苗、体检、生病、洗澡、剪指甲、清耳、修毛、挤腺、刷牙、美容、消毒、换砂、玩具、清笼、异常、发情、捅娄子、偷吃。账单有食物、医疗、玩具、美容、日用、其他 6 类。提醒只查询已开启提醒的记录，不创建或发送订阅消息。

## 可以扩展的技能

以下是尚未封装的技能或已注册技能的后续写能力。当前查询和页面入口能力以已封装清单为准。

| 候选 SKILL | 可支持的业务 | 现有代码基础 |
| --- | --- | --- |
| pet-profile-skill 的后续能力 | 创建宠物、头像上传 | 已支持档案字段更新，创建与头像上传仍通过页面完成 |
| checklist-skill | 创建清单、更新勾选进度、删除清单 | checklistManage |
| pet-trends-skill | 体重、饮食和饮水变化分析 | recordManage 与 record-trends 页面；需封装统计接口 |
| family-skill 的写能力 | 邀请协作、调整共养角色 | 当前只查成员并提供管理入口，尚未通过 AI 执行写入 |
| pet-map-skill 的写能力 | 添加和维护地点 | 当前只检索和查详情，新增修改受管理员权限限制 |
| pet-care-skill | 查询照顾需求或服务、发布信息 | careManage；发布和联系前需确认内容 |
| visit-skill | 查询上门照顾、创建预约、签到与确认 | visitManage；定位及隐私授权沿用业务规则 |
| memorial-skill | 浏览纪念馆、随机探访、送祝福 | memorialManage |
| dogti-skill | 开始狗格测试、浏览图鉴和解读结果 | dogti 页面及本地数据；需设计问答状态管理 |
| splitpal-skill 的写能力 | 记录共同开销、生成结算和标记付款 | 当前仅查询，写操作通过活动页面完成；标记付款不是实际转账 |
| mealtime-skill 的写能力 | 创建家庭、开桌、点菜和下单 | 已复用原模块，技能只读，写操作通过饭局页面完成 |

除宠物档案更新外，新增查询技能不执行业务写入，写操作仍需继续封装。也可在现有技能内扩展记录编辑、账单编辑删除、创建提醒等操作，无需为每个动作单独新增 SKILL。官方最多允许声明 30 个 SKILL，当前使用 9 个，剩余 21 个名额。

## 验证与限制

### 动态入口加载失败修复

开发者工具报错 `module 'skills/record-skill/index.js' is not defined` 时，入口文件虽然存在，也可能被“过滤无依赖文件”裁掉。技能入口由 AI 运行时动态加载，不在普通页面的 require 依赖链中。对照官方 ai-mode-demo，公共配置应设置 `setting.ignoreDevUnusedFiles: false` 和 `setting.ignoreUploadUnusedFiles: false`，私有配置也需要将 `ignoreDevUnusedFiles` 设为 false，防止覆盖公共配置。修改后重新编译。

回归测试命令为 `node --test tests/skills*.test.cjs`。82 项测试使用模拟云端数据，不修改真实记录。原测试主要执行记录、账单、提醒的处理函数；本次补充档案、共养、地图、分账、来吃饭和清单的处理函数执行，检查成功及失败、同名选择、未授权宠物 ID、必填参数、空结果、字段类型、隐私过滤、页面链接、金额单位和截断标识。提醒天数按本地日历日计算，回归包含明天中午应显示“明天”的场景。测试通过不代表真实云端和卡片渲染已验证。

2026 年 11 月 4 日，在 Nightly 2.02.2609222 的“小程序 AI 编译”中实测：原问题触发 listRecords 后成功返回来福最新体重 17.7 kg；listBills 返回 7 条账单；getMonthlyStats 返回 2026 年 10 月消费 0 元；listUpcomingReminders 返回近期暂无提醒；getNextReminderByType 返回 2027 年 3 月 28 日疫苗提醒。5 个真实云端查询接口均成功执行。addRecord、deleteRecord 和 addBill 通过模拟云端回归测试，未在真实数据库执行新增或删除。卡片渲染及真机预览未在本轮验证。

静态验证包括配置与文件路径、接口注册名一致性、独立分包依赖、卡片 Result 数据读取、文件大小上限以及 JS 语法。实际 AI 对话与云端权限需在已获开发模式资格的 AppID 和 Nightly 工具中验证。

建议实测：未指定名字使用当前宠物；指定不存在宠物返回错误；新增体重或账单后回查；查询空记录与空提醒；统计与账单页面一致；先查再确认删除。原有 listRecords/listBills 只返回前 5 条卡片数据，提醒查询最多 20 条，不能据此宣称展示了全部历史。提醒直接查询 records 数据库，共养人的读取范围依赖云数据库权限，需真机验证。

## 本次设计落实与验收

五项技能按业务域划分，接口名使用动词加业务对象，每个接口承担一项查询职责。`mcp.json` 明确参数来源、默认值、单位和类型；`SKILL.md` 说明上游查询、用户选择及跨技能边界。返回 `content` 给出结果和下一步，`structuredContent` 使用白名单字段，不透传 OpenID、邀请码、在线用户位置或内部菜品归属映射。页面链接使用 `format: page-link` 和同级标题，页面入口不代表已执行操作。

档案与共养先验证宠物在当前用户可访问列表中。多宠物未选定或同名时要求选择真实 ID；档案缺体重返回 null。档案卡仍展示 name，同时接口返回 petName 供对话使用。宠物档案通过 updatePetProfile 按需更新，头像通过页面上传。地图只查询公开地点，不主动定位；零经纬度也是有效坐标，技能按公开地点坐标计算距离，单位米。

分账沿用 splitManage 的人民币分，不能按宠物账单的元解释。成员应分摊金额不是未付金额，结算列表为空不是无债务。来吃饭通过扁平参数调用 mealManage，与其他云函数的嵌套 data 格式分开。饭局家庭、约饭、菜品和宠物 ID 不混用；耗时为分钟，不承诺过敏安全。底层 mealManage 首次读取可能懒创建 meal_users，splitManage.getActivity 可能刷新成员资料快照；技能不调用开桌、下单、计算结算等业务写接口。

在开发者工具实际验收前，确认测试环境已部署 mealManage 并安装云端依赖，数据库已配置 meal_users、meal_families、meal_memberships、meal_dishes、meal_meals、meal_items、meal_ingredients、meal_tastes 集合及权限；基础食材数据按现有部署流程初始化，不由 AI 自动执行。重新小程序 AI 编译，依次测试“列出我的宠物”“谁在共养来福”“查宠物友好公园”“列出我的分账活动”“我有哪些家庭饭局”，再从结果选定对象查详情。还需验证空数据、成员被移除、同名对象、拒绝定位及页面点击。此次新增能力未在 Nightly 或真实云端执行，原有真实测试记录仅对应上文标注的 11 月 4 日接口。

## 宠物档案更新能力（2026 年 11 月 10 日）

updatePetProfile 统一处理改名和档案修改，不再保留独立改名接口。输入旧名字或上游真实 petId，以及 updates 中明确指定的修改字段。支持名字、物种、品种、性别、生日、到家日期、档案体重和备注；未提供的字段保持不变。备注是整体替换，新增先查询并保留原备注，删除或替换前确认完整列表。头像通过页面上传。

技能复用 petManage 的 update 操作，普通档案页面也使用同一服务。云端检查创建者或管理员权限、内容安全及字段类型，按读取时的档案版本条件更新。档案体重变更沿用 weightHistory，不额外创建日常记录；新增一次称重仍用 recordSkill。返回 updatedFields 表示实际变化；重复提交相同值不重复追加体重历史。

使用前重新上传部署 petManage 云函数（含 updatePet.js），再重新小程序 AI 编译。已移除独立 rename API 和处理文件。代码与测试均在本地 main 工作区，未部署真实云函数、未修改真实宠物档案。回归命令为 node --test tests/skills*.test.cjs，档案更新测试见 tests/skills-update.test.cjs。
