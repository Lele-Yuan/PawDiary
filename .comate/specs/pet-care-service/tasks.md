# 代铲屎遛狗模块实现任务清单

- [ ] Task 1: 新增常量与路由注册
    - 1.1: 在 `miniprogram/utils/constants.js` 中新增 `CARE_ROLE_TYPES`（临时主/需求方）和 `CARE_SERVICE_TYPES`（铲屎/遛狗/都可以）常量
    - 1.2: 在 `miniprogram/app.json` 中新增 `pages/care/care` 和 `pages/care/care-add/care-add` 页面路由

- [ ] Task 2: 创建云函数 careManage
    - 2.1: 新建 `cloudfunctions/careManage/config.json`（云函数环境配置）
    - 2.2: 新建 `cloudfunctions/careManage/package.json`
    - 2.3: 新建 `cloudfunctions/careManage/index.js`，实现以下 actions：
        - `publish`：写入 `pet_care_posts` 集合，保存 publisherInfo 快照
        - `list`：查询 status=active 的帖子，支持 roleFilter/serviceTypeFilter，服务端 Haversine 计算距离，脱敏 contactInfo 和 applicants 后返回
        - `get`：查询单条帖子，脱敏 contactInfo（非本人）
        - `applyContact`：幂等写 `pet_care_contacts`，校验 status 和 openid，返回 contactInfo
        - `update`：校验 _openid 匹配后更新帖子字段
        - `delete`：软删除（status 置为 archived）
        - `myPosts`：查询当前用户发布的帖子列表

- [ ] Task 3: 首页新增「代铲屎遛狗」入口
    - 3.1: 在 `miniprogram/pages/home/home.wxml` 的 `guide-links` 区块之后新增「宠物互助」section 标题和入口卡片
    - 3.2: 在 `miniprogram/pages/home/home.wxss` 中新增入口卡片样式（渐变背景、圆角、icon 圆容器、箭头）
    - 3.3: 在 `miniprogram/pages/home/home.js` 中新增 `goToCare()` 方法跳转至 `pages/care/care`

- [ ] Task 4: 创建列表页 care
    - 4.1: 新建 `miniprogram/pages/care/care.json`（引用 nav-bar、empty-state 组件）
    - 4.2: 新建 `miniprogram/pages/care/care.wxml`：custom nav-bar（标题+发布按钮）、吸顶 filter-bar（角色/服务类型筛选芯片 + 排序切换）、scroll-view 列表（care-card）、fab-btn、empty-state
    - 4.3: 新建 `miniprogram/pages/care/care.wxss`：filter-bar 吸顶样式、care-card 卡片样式（role-badge、service-tag、contact-btn 各状态）、fab-btn 复用全局样式
    - 4.4: 新建 `miniprogram/pages/care/care.js`：
        - `onLoad/onShow` 获取地理位置，调用 `careManage/list` 加载数据
        - `onFilterChange` 切换角色/类型筛选，重新请求
        - `onSortChange` 客户端二次排序（距离/最新）
        - `onApplyContact` 调用 `careManage/applyContact`，成功后在当前卡片内联展示联系方式
        - `onReachBottom` 上拉加载更多（分页 page+1）
        - `onTapPublish` 跳转发布页

- [ ] Task 5: 创建发布页 care-add
    - 5.1: 新建 `miniprogram/pages/care/care-add/care-add.json`（引用 nav-bar 组件）
    - 5.2: 新建 `miniprogram/pages/care/care-add/care-add.wxml`：角色卡片式单选（临时主/需求方）、服务类型 checkbox（铲屎/遛狗）、地点选择器、半径 slider（仅 helper 显示）、时间类型 + picker、宠物信息表单（仅 owner 显示）、联系方式输入（phone/wechat）、补充说明 textarea、提交按钮
    - 5.3: 新建 `miniprogram/pages/care/care-add/care-add.wxss`：角色选中卡片高亮（橙色/青色边框）、表单各 section 分组样式（与 record-add 保持一致）、slider 自定义样式
    - 5.4: 新建 `miniprogram/pages/care/care-add/care-add.js`：
        - `onChooseLocation` 调用 `wx.chooseLocation` 填充地点
        - `onRoleChange` 切换角色，控制 radius/petInfo 区块显隐
        - `onSliderChange` 更新 radius 值并格式化显示文本
        - `onSubmit` 表单验证（role/serviceType/location/time/contact 必填项）→ 调用 `careManage/publish` → 成功后返回列表页并刷新
