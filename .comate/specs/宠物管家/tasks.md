# 宠物管家微信小程序 — 全模块开发任务计划

- [x] 任务 1：初始化项目骨架与全局配置
    - 1.1: 创建微信小程序项目目录结构（miniprogram/ 和 cloudfunctions/），包含 images/、utils/、components/、pages/ 等子目录
    - 1.2: 编写 app.json，配置所有页面路径、tabBar（首页/清单/记录/账单/我的，含图标和选中色 #FF8C69）、window 全局样式
    - 1.3: 编写 app.js，初始化云开发环境（wx.cloud.init）、定义 globalData（userInfo、currentPetId）、实现 onLaunch 中的登录与用户初始化逻辑
    - 1.4: 编写 app.wxss，定义全局样式变量（主色、辅色、圆角、阴影）、通用类（卡片、按钮、空状态等）
    - 1.5: 编写 utils/util.js（日期格式化 formatDate、计算天数差 daysBetween、防抖 debounce）、utils/constants.js（记录类型、账单分类、清单模板等常量定义）、utils/cloud.js（云函数调用封装）
    - 1.6: 创建 project.config.json 和 sitemap.json 基础配置文件

- [x] 任务 2：开发全局自定义组件（pet-switcher、empty-state、nav-bar）
    - 2.1: 开发 components/pet-switcher 组件 — 横向滚动宠物头像列表 + 末尾"+"添加按钮，支持 pets/currentPetId 属性输入和 switch 事件输出
    - 2.2: 开发 components/empty-state 组件 — 接收 icon、title、description 属性，展示居中的空状态占位图和提示文案
    - 2.3: 开发 components/nav-bar 组件 — 自定义顶部导航栏，支持 title、back（是否显示返回按钮）属性，适配不同机型状态栏高度

- [x] 任务 3：开发宠物管理云函数与添加/编辑宠物页面
    - 3.1: 编写 cloudfunctions/petManage 云函数，支持 add（添加宠物）、update（编辑宠物）、delete（归档宠物）、list（获取宠物列表）四种 action，含参数校验
    - 3.2: 开发 pages/pet-edit/pet-edit 页面 — 表单包含：宠物头像上传、名称、物种选择（猫/狗/其他）、品种输入、性别选择、生日选择器、到家日期选择器、体重输入；支持 mode=add 和 mode=edit 两种模式
    - 3.3: 实现头像上传逻辑（wx.chooseMedia → wx.cloud.uploadFile → 获取 fileID 回显），表单校验（名称和物种必填），提交后调用云函数并返回上一页

- [x] 任务 4：开发首页模块（宠物纵览、陪伴天数、体重、快捷入口、提醒）
    - 4.1: 编写 pages/home/home.wxml 页面结构 — 顶部 pet-switcher 组件、宠物信息卡片（头像/名称/品种/性别/年龄/陪伴天数/体重）、四宫格快捷入口、近期提醒卡片列表
    - 4.2: 编写 pages/home/home.js 页面逻辑 — onShow 中加载宠物列表和用户信息、计算陪伴天数（adoptDate 到今天）、加载 nextDate 最近的3条记录作为提醒、处理宠物切换事件（更新 currentPetId 并刷新数据）
    - 4.3: 编写 pages/home/home.wxss 样式 — 宠物信息卡片（圆角阴影卡片、圆形头像、渐变背景）、陪伴天数大字体突出、四宫格布局、提醒卡片列表样式
    - 4.4: 开发 pages/home/components/pet-card 子组件 — 封装宠物信息卡片展示逻辑，支持长按触发编辑事件

- [x] 任务 5：开发清单模块（清单列表、清单详情、模板初始化）
    - 5.1: 编写 cloudfunctions/checklistManage 云函数 — 支持 createFromTemplate（从模板创建清单实例）、create（自定义新建）、update（更新清单项）、delete（删除清单）四种 action；首次使用时自动写入系统预设模板到 checklist_templates 集合
    - 5.2: 开发 pages/checklist/checklist 页面 — 顶部当前宠物标签 + "新建清单"按钮，清单卡片列表（图标/标题/进度条/百分比/箭头），首次进入时从模板初始化默认清单
    - 5.3: 开发 pages/checklist/checklist-detail/checklist-detail 页面 — 标题可编辑区域、清单项列表（checkbox + 名称 + 备注）、底部新增项输入框、支持勾选实时更新进度和数据库、左滑删除清单项

- [x] 任务 6：开发记录模块（健康记录时间线、添加记录）
    - 6.1: 编写 cloudfunctions/recordManage 云函数 — 支持 add（添加记录）、list（按类型和宠物查询记录列表）、delete（删除记录）三种 action
    - 6.2: 开发 pages/record/record 页面 — 顶部标签筛选栏（全部/驱虫/体检/疫苗/洗澡横向tab）、时间线样式记录列表（左侧彩色圆点 + 卡片：类型标签/标题/日期/地点/金额/下次提醒）、右下角悬浮"+"按钮
    - 6.3: 开发 pages/record/record-add/record-add 页面 — 表单：类型四选一按钮组、日期选择器（默认今天）、标题输入、描述多行文本、地点输入、花费数字输入、下次预计日期选择器、图片上传（最多9张）；提交时上传图片到云存储并写入 records 集合

- [x] 任务 7：开发账单模块（月度账单流水、记账、分类统计）
    - 7.1: 编写 cloudfunctions/billManage 云函数 — 支持 add（添加账单）、list（按月份和宠物查询）、stats（按分类统计月度/年度数据）、delete（删除账单）四种 action
    - 7.2: 开发 pages/bill/bill 页面 — 顶部月份选择器（左右箭头切换）、月度概览卡片（总支出大字 + 与上月对比）、分类占比简易条形图、按日期分组的账单流水列表（分类图标/标题/金额/日期）、右下角悬浮"+"按钮
    - 7.3: 开发 pages/bill/bill-add/bill-add 页面 — 表单：金额输入（数字键盘大输入框）、分类六选一按钮组（粮食/医疗/玩具/美容/日用/其他）、消费描述、日期选择器（默认今天）、备注；提交写入 bills 集合
    - 7.4: 开发 pages/bill/bill-stats/bill-stats 统计页面 — 月度/年度切换、分类饼图（使用 canvas 绘制简易饼图）、分类排行列表（按金额降序）、近6个月趋势折线图

- [x] 任务 8：开发个人中心模块（用户信息、系统设置）
    - 8.1: 编写 cloudfunctions/userManage 云函数 — 支持 login（获取或创建用户记录）、update（更新用户信息）两种 action
    - 8.2: 编写 cloudfunctions/login 云函数 — 获取用户 openid 并返回，配合 userManage 完成首次登录自动注册
    - 8.3: 开发 pages/profile/profile 页面 — 顶部用户信息卡片（头像/昵称/登录按钮，使用 wx.getUserProfile）、功能列表（我的宠物管理/数据导出/清除缓存/关于我们/版本号）、退出登录按钮
    - 8.4: 实现宠物管理入口跳转（展示宠物列表，支持编辑/归档宠物）、清除缓存功能（wx.clearStorage）、关于页面弹窗

- [x] 任务 9：整体联调、样式美化与TabBar图标资源补全
    - 9.1: 创建所有 tabBar 所需的图标文件（home/checklist/record/bill/profile 的普通态和选中态 png），以及默认宠物头像、空状态占位图等静态资源（使用 base64 内联或纯 CSS 图标方案）
    - 9.2: 统一各页面间数据联动 — 确保切换宠物后所有 tab 页数据刷新（通过 app.globalData.currentPetId + 各页面 onShow 重新加载）、记录页花费自动同步到账单、首页提醒与记录模块 nextDate 联动
    - 9.3: 全局样式精调 — 统一卡片圆角/阴影/间距、按钮交互反馈（hover-class）、列表加载动画、页面切换过渡、空状态展示、错误提示（网络异常/操作失败 toast）
    - 9.4: 边界条件处理 — 无宠物时引导添加、清单为空时展示模板选择、记录和账单为空时展示空状态、表单校验提示完善、网络异常重试逻辑
