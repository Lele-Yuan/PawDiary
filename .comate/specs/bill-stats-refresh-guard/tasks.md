# 消费统计页数据刷新竞态修复 计划文档

> 面向 agentic workers：REQUIRED SUB-SKILL: 使用 subagent-impl 逐个任务实施此文档。步骤使用 checkbox (`- [ ]`) 语法进行跟踪。

**目标：** 修复消费统计页切换月份数据不更新的偶现竞态，并补齐加载遮罩与切换时的数据清空。

**架构：** 在页面实例上引入自增请求序号 `_statsSeq`，每个 `await` 边界后比对序号丢弃过期结果，消除 last write wins 竞态。新增 `statsLoading` 状态驱动一层半透明全屏遮罩，加载入口先清空旧数据再填充新数据。同时把年度与趋势查询改为并发，并修正饼图的清空与绘制时机。

**技术栈：** 微信小程序原生框架，WXML 与 WXSS，微信云函数 `billManage`

**设计文档：** `.comate/specs/bill-stats-refresh-guard/doc.md`

**卡片绑定策略：** 本项目不在 iCafe 体系内，用户已确认跳过卡片拆分，不做卡片绑定

## 任务列表

| Task | 标题 |
| --- | --- |
| Task 1 | 新增加载态字段与透明遮罩 UI |
| Task 2 | 引入请求序号守卫与切换清空 |
| Task 3 | 请求并发化与饼图重绘修复 |

- [x] Task 1: 新增加载态字段与透明遮罩 UI
- [x] Task 2: 引入请求序号守卫与切换清空
- [x] Task 3: 请求并发化与饼图重绘修复

## Task 1 详情

## 目标

页面新增 `statsLoading` 状态字段并落地一层半透明全屏遮罩。遮罩出现时能透出下方内容，覆盖月份切换器与付款人筛选，导航栏返回按钮仍可点击，空状态不再在加载过程中闪现。

## 上下文

对应 doc.md 的「加载状态与数据清空」与「整页透明遮罩」两节。本任务只建立加载态的表达与 UI 承载，不改动请求逻辑，因此完成后遮罩会在 `loadStats` 全程显示，正确的清空与守卫由 Task 2 补齐。

现状问题：`onSelectPayer` 会把 `loaded` 置回 `false`，而 `stats-page` 由 `wx:if="{{loaded}}"` 控制，导致整页内容被摘除后重新挂载，视觉上是整页闪烁。

## 范围

- 范围内：`bill-stats.js` 的 `data` 字段与 `onSelectPayer`，`bill-stats.wxml` 的遮罩节点与空状态条件，`bill-stats.wxss` 的遮罩样式
- 范围外：`loadStats` 与 `loadTrends` 的请求逻辑，`drawPieChart`，云函数，其他页面

## 相关文件

- 可能修改：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/bill/bill-stats/bill-stats.js`
- 可能修改：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/bill/bill-stats/bill-stats.wxml`
- 可能修改：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/bill/bill-stats/bill-stats.wxss`
- 参考：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/components/loading/loading.wxml`
- 参考：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/components/nav-bar/nav-bar.wxss`
- 参考：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/home/components/pet-card/pet-card.wxss`

## 验收标准

- [x] `data` 中新增 `statsLoading: false`
- [x] `onSelectPayer` 只更新 `selectedPayer`，不再设置 `loaded: false`
- [x] `loadStats` 入口置 `statsLoading: true`，复位统一收口在 `finally` 中，覆盖成功与异常路径；无 `currentPetId` 的早返回分支在 `return` 前自行复位。评审阶段确认：不在成功路径中提前复位，否则会在剩余请求进行中放开交互，重新打开并发窗口
- [x] 遮罩节点写在 `wx:if="{{loaded}}"` 块之外，容器显隐与内部 `loading-view` 挂载条件统一为 `statsLoading && loaded`，首屏不与全屏 `loading-view` 叠加
- [x] 遮罩为 `position: fixed` 全屏，半透明白色底色可透出下方内容，带 `opacity` 过渡
- [x] 遮罩 `z-index` 取 `99`，低于 `nav-bar-inner` 的 `100`，加载期间返回按钮可点击而月份切换器不可点击
- [x] 遮罩带 `catchtouchmove="noop"` 阻止滚动穿透，`noop` 已在页面中定义，内部复用 `loading-view` 组件
- [x] 空状态条件由 `!categoryStats.length && loaded` 改为追加 `!statsLoading`

## 测试预期

- 单元测试：项目无单元测试框架，本任务不引入
- 集成或运行时验证：微信开发者工具打开消费统计页
- 命令：无构建命令，使用微信开发者工具编译预览
- 预期结果：切换付款人筛选时整页不闪烁，遮罩淡入淡出且能看到下方内容轮廓；加载期间点击月份箭头无反应，点击返回按钮可退出；切换到无账单月份时加载过程中不闪现「该时段暂无消费数据」

## 约束

- 遮罩必须复用 `components/loading` 组件，不重复实现动效。该组件已在 `bill-stats.json` 中注册为 `loading-view`
- `.loading-page` 是 `min-height: 100vh` 的居中容器且不带底色，底色与 `fixed` 定位由新增的遮罩容器提供
- 颜色使用 `app.wxss` 已有的 CSS 变量，不引入新色值
- 保留 `loaded` 的现有语义，不得删除首屏 `loading-view`

### Task 2 详情: 引入请求序号守卫与切换清空

## 目标

消除并发请求互相覆盖导致的数据不更新。快速连续切换月份、模式或付款人后，页面最终展示的统计数据必须对应最后一次切换。切换瞬间旧数据被清空，新数据到达后一次性填充。

## 上下文

对应 doc.md 的「请求序号守卫」与「加载状态与数据清空」两节。

根因是 last write wins：`loadStats` 内部有 7 次到 18 次串行 `await`，耗时可达数秒。期间再次切换会启动第二次 `loadStats`，两次调用共享同一页面实例，各自在 `await` 链末尾写入 `total`、`categoryStats`、`trends`。云函数返回耗时不稳定，先发起的请求完全可能后返回，旧月份数据就覆盖了新月份数据。

Task 1 已提供 `statsLoading` 与遮罩，本任务补齐正确性。

## 范围

- 范围内：`bill-stats.js` 的 `loadStats`、`loadTrends` 方法签名与守卫逻辑，入口清空逻辑，`catch` 分支的失败提示
- 范围外：请求并发化与 `drawPieChart`，留给 Task 3；WXML 与 WXSS；云函数

## 相关文件

- 可能修改：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/bill/bill-stats/bill-stats.js`
- 参考：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/bill/bill.js`
- 参考：`/Users/yuanlele/workspace/myWork/PawDiary/cloudfunctions/billManage/index.js`

## 验收标准

- [x] 页面实例上维护 `_statsSeq`，声明在 Page 对象上而非 `data`，不依赖生命周期执行顺序
- [x] `loadStats` 入口执行 `const seq = ++this._statsSeq`，取得本次快照序号
- [x] `loadStats` 入口在自增序号后立即清空 `total`、`totalStr`、`categoryStats`、`trends`，并置 `statsLoading: true`
- [x] `loadStats` 中每个 `await` 边界之后比对序号，成立则直接 `return`，不写 `setData`，不绘制 canvas，不进入趋势加载。守卫收敛在 `_fetchBills` 内，返回 `null` 表示已过期
- [x] `loadTrends` 签名扩展为接收快照参数与 `seq`，在写入 `trends` 之前做同样比对
- [x] `catch` 分支比对序号后写入 `loaded`，并用 `wx.showToast` 提示加载失败
- [x] 无 `currentPetId` 的早返回分支同时复位 `statsLoading: false`
- [x] `loaded` 一旦为 `true` 不再回退为 `false`
- [x] `finally` 先比对序号，只有最新请求才允许复位 `statsLoading`，避免过期请求把最新请求的遮罩提前关掉

## 测试预期

- 单元测试：项目无单元测试框架，本任务不引入
- 集成或运行时验证：微信开发者工具 Network 面板开启弱网模拟，配合 Console 打点观察
- 命令：无构建命令，使用微信开发者工具编译预览
- 预期结果：月度模式连续快速点击上一月 5 次后停止，展示的总额、分类占比、分类排行与最终月份一致；弱网下重复该操作 10 次不再复现旧数据覆盖；断网后切换月份出现加载失败提示，且不会误显示为空数据

## 约束

- 序号必须挂在页面实例而非 `data`，避免每次自增触发视图层通信
- 过期请求静默丢弃，不给用户任何提示，避免误报
- 遮罩只阻止交互，不能替代序号守卫。遮罩渲染存在一帧延迟，`onLoad` 与筛选切换仍可能并发，两者必须同时存在
- 保持现有 `billManage` 调用参数结构不变，包含 `payerOpenid` 的条件透传逻辑

### Task 3 详情: 请求并发化与饼图重绘修复

## 目标

把年度与趋势查询由串行改为并发，月度模式跳过无用的趋势请求。同时修复饼图切换后的重影、圆心文案与扇形不同源、以及 canvas 节点重挂后绘制空白三个问题。

## 上下文

对应 doc.md 的「请求并发化」与「Canvas 重绘清理」两节。

现状调用轮次：月度 7 次串行，年度 18 次串行。`loadTrends` 结果只在年度模式渲染，模板条件为 `period === 'year' && trends.length`，月度模式下这 6 次调用的结果不会被展示。

`drawPieChart` 有三处缺陷：未调用 `ctx.clearRect` 导致重绘时旧扇形残留；读取 `this.data.totalStr` 而非入参，竞态下可能与 `stats` 不同源；canvas 节点位于 `wx:if="{{categoryStats.length}}"` 内，Task 2 的入口清空会卸载该节点，同步绘制可能画在尚未就绪的节点上。

## 范围

- 范围内：`bill-stats.js` 的 `loadStats` 年度分支、`loadTrends` 循环、`drawPieChart` 方法与其调用时机
- 范围外：Task 2 已建立的序号守卫结构不得破坏；WXML 与 WXSS；云函数；不引入缓存层

## 相关文件

- 可能修改：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/bill/bill-stats/bill-stats.js`
- 参考：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/bill/bill-stats/bill-stats.wxml`
- 参考：`/Users/yuanlele/workspace/myWork/PawDiary/miniprogram/pages/bill/bill-stats/bill-stats.wxss`

## 验收标准

- [x] 年度模式的 12 个月查询由串行 `for` 改为 `Promise.all` 并发
- [x] `loadTrends` 的 6 个月查询改为 `Promise.all` 并发
- [x] 月度模式跳过 `loadTrends` 调用，月度总调用轮次降为 1 次
- [x] `Promise.all` 任一失败时整体进入 `loadStats` 现有 `catch`，行为与改造前的串行抛错一致
- [x] ~~`drawPieChart` 在绘制前调用 `ctx.clearRect` 清空画布区域~~。评审阶段推翻：旧版 canvas 的 `ctx.draw()` 默认 `reserve` 为 `false`，本次绘制前已自动清空画布，`clearRect` 是无效代码。重影的真实原因是入口清空使 `wx:if` 卸载 canvas 节点、绘制打在未就绪节点上，由下一条的绘制时机修复。已改为在方法注释中说明该机制，不保留无效调用
- [x] `drawPieChart` 签名改为 `drawPieChart(stats, totalStr)`，圆心文案由入参提供，不再读取 `this.data.totalStr`
- [x] `drawPieChart` 放在 `setData` 回调中执行，确保 canvas 节点重新挂载后再绘制，且回调内仍比对序号
- [x] 并发改造后 Task 2 的序号比对仍在每个 `await` 边界生效
- [x] 评审补充：抽出 `_fetchBillsBatch(queries, seq)` 收敛「构造查询、并发、判过期」三段式，避免两处重复各自解读 `null` 语义
- [x] 评审补充：`_fetchBills` 的业务失败改为抛错而非降级为空数组。并发拉取有多个入口，静默降级会让用户看到偏低却看不出异常的总额
- [x] 评审补充：主 `setData` 前追加显式序号比对，与 `loadTrends` 的写入守卫保持一致

## 最终评审后的追加修复

最终端到端评审发现四项问题，已一并修复：

- [x] 新增 `loadFailed` 状态。原实现失败时只弹一个 1.5 秒 toast，淡出后页面停留在「¥0.00 加 该时段暂无消费数据」，与真实无数据无法区分。现改为渲染独立的失败提示并提供重试按钮
- [x] 饼图卡片由 `wx:if` 改为 `hidden`。旧版 canvas 是原生组件，节点卸载重挂的就绪时机与 `setData` 回调不同步，常驻节点可避免真机上切换后饼图空白
- [x] 扇形角度改用 `item.amount / total` 而非四舍五入后的 `percent`。后者会让各扇形角度之和不等于 360 度，留下白楔或末尾扇形覆盖首个扇形。`drawPieChart` 签名相应扩展为 `(stats, total, totalStr)`
- [x] 新增 `onUnload` 推进序号。原实现下用户切换月份后立刻返回，请求失败时仍会在已切走的页面上弹 toast 并对已卸载页面 `setData`
- [x] 移除 `data.total` 死字段，模板只读 `totalStr`

已知未处理项，均有明确理由：

- 旧版 canvas 作为原生组件层级不受遮罩 `z-index` 约束，加载期间饼图会浮在遮罩之上。彻底解决需迁移到 `type="2d"`，属独立重构
- `Promise.all` 只处理首个 reject，多月同时失败会产生 unhandled rejection 控制台告警。不影响功能，改用 `allSettled` 会增加复杂度
- 云函数 `list` 硬上限 100 条且页面未分页，单月账单超 100 条时总额会静默偏低。属云函数侧的独立问题

## 测试预期

- 单元测试：项目无单元测试框架，本任务不引入
- 集成或运行时验证：微信开发者工具切换月度与年度，观察 Network 面板请求时序与饼图渲染
- 命令：无构建命令，使用微信开发者工具编译预览
- 预期结果：年度模式的 12 个云函数请求在 Network 面板中并行发出而非依次排队；月度模式只发出 1 个请求；年度与月度来回切换 3 次，饼图无重影且不空白；饼图圆心金额与各扇形比例之和一致

## 约束
- 不引入通用防抖或节流工具函数
- 不把统计聚合下沉到云函数。`billManage` 虽已有 `stats` action，但切换到该接口属于独立重构
- 不改动云函数与数据库结构
- `clearRect` 的清空区域需覆盖 canvas 实际尺寸。样式为 `width: 100%; height: 360rpx`，现有绘制以 `centerX = 187` 即 375px 宽屏中心为基准，清空范围取值需与之匹配
