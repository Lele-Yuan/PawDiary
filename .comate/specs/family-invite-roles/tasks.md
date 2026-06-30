# 家庭成员邀请角色化改造任务清单

- [x] Task 1: 改造 familyManage 云函数 joinFamily 支持角色与升级
    - 1.1: 解析 data.role，白名单过滤为 admin/member（默认 member）
    - 1.2: 已存在记录时按规则升级（member→admin）或保持
    - 1.3: 新增记录时使用传入 role
    - 1.4: 返回结果新增 role / upgraded 字段

- [x] Task 2: 改造 invite 页支持 role 参数
    - 2.1: onLoad 解析 options.role 并存入 data.inviteRole
    - 2.2: doJoin 携带 role 调用云函数
    - 2.3: 加入成功后使用云函数返回的实际 role 写入 globalData
    - 2.4: invite.wxml 标题与按钮文案根据角色区分（共养人/亲友团）

- [x] Task 3: 首页邀请入口改造为弹出选择浮层
    - 3.1: home.js 增加 showInvitePicker、inviteRole 状态及显隐方法
    - 3.2: home.wxml 将原邀请按钮改为 bindtap 触发弹窗
    - 3.3: home.wxml 新增浮层结构，含两个 open-type=share 按钮（admin/member）
    - 3.4: home.js 改造 onShareAppMessage 按 inviteRole 拼接 path 和 title
    - 3.5: home.wxss 增加浮层样式

- [x] Task 4: 首页家庭成员标题增加"管理"入口
    - 4.1: home.wxml section-header 右侧添加"管理"按钮
    - 4.2: home.js 增加 goFamilyMembers 跳转方法
    - 4.3: home.wxss 增加入口样式

- [x] Task 5: 新建家庭成员管理页 family-members
    - 5.1: 创建 family-members.json 页面配置
    - 5.2: 编写 family-members.wxml（双 tab + 列表 + 操作按钮）
    - 5.3: 编写 family-members.wxss 样式
    - 5.4: 编写 family-members.js（加载、tab 切换、角色切换）
    - 5.5: 在 app.json 注册新页面路径

- [x] Task 6: 联调与边界自查
    - 6.1: 验证未加入用户分别从两种卡片加入的角色正确
    - 6.2: 验证 member 收到共养人邀请升级为 admin
    - 6.3: 验证 admin 收到亲友团邀请保持 admin
    - 6.4: 验证旧分享卡（无 role 参数）兼容为 member
    - 6.5: 验证非创建者进入家庭页隐藏操作按钮
