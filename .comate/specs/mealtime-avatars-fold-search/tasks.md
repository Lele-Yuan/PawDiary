# 来吃饭：成员头像 + 点菜页折叠与食材搜索任务计划

- [x] Task 1: 云函数附带成员头像（需重新部署 mealManage）
    - 1.1: family.js 的 myList 为每个饭局附 members（前 5 个 {avatarUrl,nickName}）
    - 1.2: order.js 的 history 为每条约饭附 members（取 memberSnapshot 前 5）与 memberCount

- [x] Task 2: 首页饭局卡片展示成员头像
    - 2.1: index.wxml 卡片新增头像叠加行（缺图用昵称首字兜底）
    - 2.2: index.wxss 增头像行样式

- [x] Task 3: 历史小票卡片展示成员头像
    - 3.1: history.wxml 卡片新增头像行
    - 3.2: history.wxss 增头像行样式

- [x] Task 4: 点菜页菜品按大厨折叠
    - 4.1: order.js 增 collapsed 状态与 toggleGroup，移除左栏单选逻辑
    - 4.2: order.wxml 右侧改单列手风琴（组头可展开/收起），搜索态强制展开
    - 4.3: order.wxss 增折叠分组样式

- [x] Task 5: 点菜页搜索支持食材
    - 5.1: order.wxml 的 wxs 改为 hit(dish,kw)（命中菜名或食材名），跨全部大厨过滤
    - 5.2: 搜索框 placeholder 调整为「搜菜名或食材」

- [x] Task 6: 自测
    - 6.1: node --check 云函数与 order/index/history 页面 js
    - 6.2: 核对 wxml 折叠/头像/搜索渲染无语法问题
