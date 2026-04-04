# 纪念馆功能任务计划

- [ ] Task 1: 新建 memorialManage 云函数
    - 1.1: 创建 `cloudfunctions/memorialManage/` 目录，添加 `package.json` 和 `config.json`
    - 1.2: 实现 `add` action — 查询 users 表冗余 ownerNickName/ownerAvatar，写入 memorial_pets
    - 1.3: 实现 `list` action — 按 _openid 过滤，passDate 降序返回自己的纪念宠物列表
    - 1.4: 实现 `getRandom` action — 排除自己和 excludeIds，随机取一条，附带最新5条祝福语
    - 1.5: 实现 `addBlessing` action — 校验内容 ≤100 字，查重并更新/新增，更新 blessingsCount 计数
    - 1.6: 实现 `getBlessings` action — 按 memorialPetId 查询，createdAt 降序分页

- [ ] Task 2: 修改 app.json，注册新页面路由
    - 2.1: 在 pages 数组中追加 `pages/memorial/memorial` 和 `pages/memorial/memorial-add/memorial-add`

- [ ] Task 3: 修改 profile 页面，增加纪念馆入口
    - 3.1: 在 `profile.wxml` 的 settings-section 菜单组中插入纪念馆菜单项
    - 3.2: 在 `profile.js` 中新增 `goMemorial()` 方法，跳转到 memorial 页面

- [ ] Task 4: 创建 memorial-add 新增纪念宠物页面
    - 4.1: 创建 `memorial-add.json`，配置页面标题"记录 TA"，引用 nav-bar 组件
    - 4.2: 创建 `memorial-add.wxml`，包含头像上传区、表单（名字/物种/性别/出生日期/离开日期/寄语）、提交按钮
    - 4.3: 创建 `memorial-add.wxss`，与整体风格保持一致（主色 #E8875A/#6B2D1A，背景 #FBF9F7）
    - 4.4: 创建 `memorial-add.js`，实现头像上传（云存储）、表单验证（名字和离开日期必填）、调用 `memorialManage.add` 提交

- [ ] Task 5: 创建 memorial 主页面
    - 5.1: 创建 `memorial.json`，配置页面标题"纪念馆"，引用 nav-bar 组件
    - 5.2: 创建 `memorial.wxml`，包含 Tab 切换栏、"我的纪念"宠物卡片列表（含新增按钮和空状态）、"随机探访"卡片及祝福区（含字数统计、发送按钮、换一个按钮）
    - 5.3: 创建 `memorial.wxss`，实现纪念馆整体风格（柔和暖色调、宠物卡片、祝福区样式）
    - 5.4: 创建 `memorial.js`，实现 Tab 切换、加载我的纪念列表（调用 `memorialManage.list`）、随机探访逻辑（调用 `memorialManage.getRandom`，维护 excludedIds）、祝福语输入字数实时统计、提交祝福（调用 `memorialManage.addBlessing`）、游客拦截提示
