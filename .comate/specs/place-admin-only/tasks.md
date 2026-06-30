# 宠物友好地点 - 管理员专属权限 任务清单

- [x] Task 1: 云端 mapManage 鉴权改造
    - 1.1: 新增 `requireAdmin(openid)` 辅助函数，查询 users.role === 'admin'
    - 1.2: addPlace 入口前置校验，非管理员返回 -403
    - 1.3: updatePlace 改为仅管理员可操作（移除 _openid 校验）
    - 1.4: deletePlace 改为仅管理员可操作（移除 _openid 校验）

- [x] Task 2: 前端用户角色注入
    - 2.1: 确认 userManage loginOrRegister/getUserInfo 返回值包含 role（已默认透传，仅核对）
    - 2.2: app.js initUser 完成后 globalData.userInfo 含 role 字段

- [x] Task 3: 地图页入口隐藏
    - 3.1: map.js onShow 读取 globalData.userInfo.role 并 setData isAdmin
    - 3.2: map.wxml empty-state "添加地点"按钮包 wx:if="{{isAdmin}}"
    - 3.3: map.wxml 右下角 fab `+` 按钮包 wx:if="{{isAdmin}}"

- [x] Task 4: 地点详情页按钮替换
    - 4.1: place-detail.js onShow setData isAdmin
    - 4.2: place-detail.wxml 编辑/删除按钮容器 wx:if 由 isOwner 改为 isAdmin

- [x] Task 5: place-add 兜底鉴权
    - 5.1: onLoad 校验 isAdmin，非管理员 Toast 并 navigateBack

- [x] Task 6: 联调验证
    - 6.1: 部署 mapManage 云函数
    - 6.2: 用普通账号回归：看不到入口、绕过直接调云函数被拒
    - 6.3: 在云开发控制台给测试账号加 role=admin，验证完整流程
