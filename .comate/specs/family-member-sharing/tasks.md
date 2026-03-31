# 家庭成员权限控制与数据共享

- [x] Task 1: 新增 familyManage 云函数
    - 1.1: 创建 cloudfunctions/familyManage/index.js，包含 join、list、updateRole、remove 四个 action
    - 1.2: 创建 cloudfunctions/familyManage/package.json 和 config.json
    - 1.3: join 逻辑：校验宠物存在、检查是否已是成员、获取用户信息、创建 pet_members 记录
    - 1.4: list 逻辑：按 petId 查询所有成员
    - 1.5: updateRole 逻辑：仅 creator 可操作，校验目标不是 creator，更新 role 字段
    - 1.6: remove 逻辑：仅 creator 可操作，不可移除 creator 自身，删除成员记录

- [x] Task 2: 改造 petManage 云函数，创建宠物时自动生成 creator 成员记录
    - 2.1: addPet 中 db.collection('pets').add 成功后，查询用户信息
    - 2.2: 向 pet_members 插入 role: 'creator' 的记录

- [x] Task 3: 新增常量与 globalData 字段
    - 3.1: constants.js 新增 MEMBER_ROLES 和 COLLECTIONS.FAMILY_MEMBERS
    - 3.2: app.js globalData 新增 currentPetRole 和 pendingInvite 字段
    - 3.3: app.js onLaunch 和 onShow 中检测 invitePetId 参数存入 pendingInvite

- [x] Task 4: 改造首页宠物加载逻辑，合并自创与共享宠物
    - 4.1: home.js loadData 查询 pet_members 获取共享宠物 ID 列表
    - 4.2: 通过云函数或 _.in 查询共享宠物，与自创宠物合并去重
    - 4.3: 构建 memberRoleMap，设置 currentPetRole 到 globalData
    - 4.4: 已有宠物自动补建 creator 的 pet_members 记录

- [x] Task 5: 首页家庭成员模块 UI 与交互
    - 5.1: home.js 新增 loadFamilyMembers 方法，查询并格式化成员列表
    - 5.2: home.js 新增 onShareAppMessage，分享路径带 invitePetId
    - 5.3: home.js 新增 checkPendingInvite 方法，处理邀请弹窗与加入逻辑
    - 5.4: home.js 新增 onToggleRole、onRemoveMember 方法
    - 5.5: home.wxml 在快捷入口下方增加家庭成员区域（头像、昵称、角色标签、管理按钮）
    - 5.6: home.wxml 邀请按钮使用 button open-type="share"
    - 5.7: home.wxss 新增家庭成员区域全部样式

- [x] Task 6: 各页面权限控制（编辑按钮/添加按钮根据角色显示隐藏）
    - 6.1: record.js onShow 中设置 canEdit，record.wxml 根据 canEdit 控制 fab-btn 和长按删除
    - 6.2: bill.js 和 bill.wxml 同上控制添加按钮
    - 6.3: checklist.js 和 checklist.wxml 同上控制
    - 6.4: pet-edit.js 普通成员进入时提示无权限并返回
    - 6.5: record-add.js 普通成员进入时提示无权限并返回
