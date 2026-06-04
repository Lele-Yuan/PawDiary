# 标签筛选栏折叠 & 捅娄子热力图 - 实施总结

## 子需求一：标签筛选栏折叠/展开

**修改文件**
- `miniprogram/pages/record/record.js`
  - data 字段重构：废弃 `typeList`，新增 `defaultTypeList`、`expandedTypeList`、`displayTypeList`、`tagsExpanded`
  - `onLoad` 构造默认 5 项（全部、体重、驱虫、洗澡、更多）与全量 + 收起 列表
  - `switchType` 拦截 `__more__` / `__collapse__` 切换 `displayTypeList`，其它 key 走原 loadRecords
- `miniprogram/pages/record/record.wxml`
  - `wx:for` 数据源由 `typeList` 改为 `displayTypeList`
  - `scroll-view` 增加 `expanded` class 切换；展开态关闭横向滚动
  - 动作项增加 `is-action` class
- `miniprogram/pages/record/record.wxss`
  - `.type-tabs.expanded`：`flex-wrap: wrap; height: auto; row-gap: 16rpx`
  - `.tab-item.is-action`：浅紫底色，无主色高亮，避免被误判为选中

## 子需求二：捅娄子热力图

**修改文件**
- `miniprogram/pages/record/record-trends/record-trends.js`
  - 顶部新增 `TROUBLE_THEME = { color: '#F4A300', light: '#FCEFD3' }`
  - data 增加 `hasTrouble: false`
  - `processRecords` 中聚合 `type === 'trouble'` 的记录到 `_troubleMap`，记录 `{ total, char }`，char 取 `troubleName || title` 首字符
  - 新增 `drawTroubleHeatmap()`：复用 `_drawHeat`，配色按 `total/maxC` 在 `light`→`color` 之间插值，emoji 字段填首字符
  - `redrawAll` 末尾追加调用
- `miniprogram/pages/record/record-trends/record-trends.wxml`
  - 在「美容日记」卡片之后插入「捅娄子」`chart-card`，无 legend，仅标题 + canvas + 空态

## 边界处理
- 折叠态下 `activeType` 不被重置：用户即使在展开后切到非默认 tag 也保持高亮；折叠后该 tag 隐藏但不丢状态。
- trouble 聚合中 `troubleName` 为空时回退 `title`，再为空则 char 为空字符串，单元格仅显色不显字。
- 当日多条 trouble 记录：取首条 `troubleName` 首字符；总数控制单元格颜色深度。

## 验证要点
1. 进入记录页：标签栏显示「全部 / 体重 / 驱虫 / 洗澡 / 更多」5 项。
2. 点更多：标签栏多行展开全部 RECORD_TYPES + 末尾「收起」。
3. 点收起：恢复 5 项。
4. 切换具体标签：列表正常按类型过滤，行为不变。
5. 趋势页：在记录了 trouble 类型的数据后，「捅娄子」卡片出现热力图，单元格按计数着色，并显示篓子名称首字符；无 legend。
