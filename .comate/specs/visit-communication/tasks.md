# 上门沟通功能实现任务清单

- [ ] Task 1: 创建云函数 visitManage
    - 1.1: 新建 `cloudfunctions/visitManage/` 目录，创建 `config.json`（固定格式）和 `package.json`（依赖 wx-server-sdk ~2.6.3）
    - 1.2: 实现 `add` action：按 creatorRole 初始化 ownerOpenid/helperOpenid，写入 status='pending'、ownerConfirmed=false、helperConfirmed=false、createdAt/updatedAt
    - 1.3: 实现 `get` action：若有空缺 openid 则自动绑定当前用户；双方均已绑定后校验权限（否则返回 NO_PERMISSION）；按身份过滤 ownerNote/helperNote
    - 1.4: 实现 `list` action：查询 ownerOpenid 或 helperOpenid 等于当前 openid 的记录，排除 archived，按 updatedAt 倒序
    - 1.5: 实现 `update` action：仅双方可操作，仅允许 pending/preparing 状态，更新表单字段和 updatedAt
    - 1.6: 实现 `confirm` action：按身份更新 ownerConfirmed/helperConfirmed，双方均 true 时 status → preparing，重置确认状态
    - 1.7: 实现 `checkin` action：仅临时主可操作，status 须为 preparing，→ serving
    - 1.8: 实现 `complete` action：仅铲屎官可操作，status 须为 serving，→ completed
    - 1.9: 实现 `delete` action：仅创建者（_openid）可操作，status 须为 pending 或 preparing，→ archived

- [ ] Task 2: 注册路由并添加 profile 入口
    - 2.1: 在 `miniprogram/app.json` 的 pages 数组中追加 `"pages/visit/visit"` 和 `"pages/visit/visit-add/visit-add"`
    - 2.2: 在 `profile.wxml` 的 `quick-actions-grid` 中，「客服反馈」前插入「上门沟通 🐾」图标项，bindtap="goToVisit"
    - 2.3: 在 `profile.js` 中增加 `goToVisit()` 方法，调用 `wx.navigateTo({ url: '/pages/visit/visit' })`

- [ ] Task 3: 创建历史列表页 visit
    - 3.1: 新建 `pages/visit/visit.json`，引用 nav-bar 组件
    - 3.2: 新建 `pages/visit/visit.js`：onShow 时调用 visitManage/list 拉取数据，formatStatus 将 status 映射为中文标签和颜色
    - 3.3: 新建 `pages/visit/visit.wxml`：nav-bar 标题「上门沟通」+ 右侧「新建」按钮；列表卡片含服务名称、状态色块、第一个时间、双方昵称；空状态引导
    - 3.4: 新建 `pages/visit/visit.wxss`：卡片样式、状态标签色块（4色）、空状态样式

- [ ] Task 4: 创建表单页 visit-add — 基础框架与角色选择
    - 4.1: 新建 `pages/visit/visit-add/visit-add.json`，引用 nav-bar 组件
    - 4.2: 新建 `pages/visit/visit-add/visit-add.js`：data 含 creatorRole、ownerNickname、helperNickname、serviceName、myRole（当前用户身份）、status、ownerConfirmed、helperConfirmed 等字段
    - 4.3: 实现 onLoad：区分新建（无参数）/ 编辑（editId）模式；编辑模式调用 get action，若返回 NO_PERMISSION 则展示无权限视图；新建时默认昵称填入当前用户
    - 4.4: 在 wxml 新建时展示角色选择区「我是铲屎官 🏠 / 我是临时主 🐾」，选中后高亮，编辑模式隐藏此区域
    - 4.5: 新建 `pages/visit/visit-add/visit-add.wxss`：角色选择卡片样式、无权限提示样式

- [ ] Task 5: 表单页 visit-add — 表单内容区
    - 5.1: wxml 实现①服务简介区：铲屎官昵称输入、临时主昵称输入、服务名称输入
    - 5.2: wxml 实现②上门时间动态列表：日期 picker + 时间 picker + 删除按钮，「+ 添加时间」按钮；js 实现 onAddTime、onRemoveTime、onTimeDateChange、onTimeTimeChange
    - 5.3: wxml 实现③具体位置：「选择位置」按钮调用 wx.chooseLocation，显示地址文本，门牌号补充输入；js 实现 onChooseLocation、onAddressInput
    - 5.4: wxml 实现④宠物信息动态列表：昵称、类型、特殊需求输入 + 删除按钮，「+ 添加宠物」按钮；js 实现 onAddPet、onRemovePet、onPetFieldChange
    - 5.5: wxml 实现⑤补充留言 textarea（200字限制）和⑥我的备注区（按 myRole 显示对应字段，灰底标注「仅自己可见」）
    - 5.6: wxss 补充各表单区块样式：动态列表行、时间行、位置区、宠物行、备注灰底

- [ ] Task 6: 表单页 visit-add — 底部操作区与状态交互
    - 6.1: js 实现 onSave：表单基础校验（服务名称、至少一个时间），调用 update action，成功提示
    - 6.2: js 实现 onConfirm：调用 confirm action，成功后刷新状态；按 ownerConfirmed/helperConfirmed 显示「已确认 ✓」标记
    - 6.3: js 实现 onCheckin（临时主）：二次确认后调用 checkin action，status → serving
    - 6.4: js 实现 onComplete（铲屎官）：二次确认后调用 complete action，status → completed
    - 6.5: js 实现 onDelete（创建者）：二次确认后调用 delete action，成功后返回列表页
    - 6.6: wxml 底部操作区：根据 myRole + status 动态渲染按钮组合（参考 doc.md 操作区表格）；新建时显示「保存并分享」，保存成功后调用 wx.showShareMenu
    - 6.7: js 实现 onShareAppMessage：根据 creatorRole 动态生成分享标题和路径
    - 6.8: wxss 底部操作区样式：主按钮/次按钮/危险按钮（废弃）色彩区分，已确认标记样式
