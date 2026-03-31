# 家庭成员权限控制与数据共享 - Summary

## 完成概况

6 个任务全部完成，实现了完整的家庭成员邀请、权限控制和数据共享机制。

## Task 1: 新增 familyManage 云函数

- **新建** `cloudfunctions/familyManage/index.js`
- 4 个 action：`join`（加入家庭）、`list`（成员列表）、`updateRole`（更新角色）、`remove`（移除成员）
- 所有写操作都有权限校验：仅 creator 可修改角色和移除成员
- 使用 `pet_members` 集合存储成员关系

## Task 2: 改造 petManage 云函数

- `addPet` 成功后自动向 `pet_members` 插入 `role: 'creator'` 的记录
- 查询用户信息获取昵称和头像作为快照

## Task 3: 新增常量与 globalData 字段

- `constants.js`：新增 `MEMBER_ROLES`、`MEMBER_ROLE_LABELS`、`COLLECTIONS.FAMILY_MEMBERS`
- `app.js globalData`：新增 `currentPetRole`（当前宠物角色）、`pendingInvite`（待处理邀请）
- `app.js onLaunch/onShow`：检测 `invitePetId` 参数存入 `pendingInvite`

## Task 4: 首页宠物加载逻辑改造

- `home.js loadData`：先查自创宠物，再查 `pet_members` 获取共享宠物 ID，通过 `_.in` 合并查询
- 构建 `memberRoleMap`，设置 `currentPetRole` 到 globalData
- 已有宠物自动补建 creator 的 `pet_members` 记录（`ensureCreatorMember` 方法）
- `onSwitchPet` 切换宠物时同步更新角色状态

## Task 5: 首页家庭成员模块 UI

- **home.wxml**：快捷入口下方新增家庭成员区域，展示头像、昵称、角色标签
  - 创建者可见"设为管理/取消管理"和"移除"操作按钮
  - 邀请按钮使用 `<button open-type="share">` 触发分享
  - 仅 1 人时显示空状态提示文案
- **home.js 新增方法**：
  - `loadFamilyMembers`：通过云函数加载成员列表
  - `onShareAppMessage`：分享路径带 `invitePetId`
  - `checkPendingInvite`：检测并处理邀请弹窗
  - `onToggleRole` / `onRemoveMember`：角色管理操作
- **home.wxss**：完整的家庭成员区域样式（头像、角色标签颜色、操作按钮）

## Task 6: 各页面权限控制

- **record.js/wxml**：`canEdit` 控制 fab-btn 和 upcoming 操作行显示
- **bill.js/wxml**：`canEdit` 控制 fab-btn 显示
- **checklist.js/wxml**：`canEdit` 控制 FAB 按钮显示
- **pet-edit.js**：普通成员进入编辑模式时提示"暂无编辑权限"并自动返回
- **record-add.js**：普通成员进入时同样提示并返回

## 修改文件列表

| 文件 | 类型 | 说明 |
|------|------|------|
| `cloudfunctions/familyManage/index.js` | 新增 | 家庭成员管理云函数 |
| `cloudfunctions/familyManage/package.json` | 新增 | 依赖配置 |
| `cloudfunctions/petManage/index.js` | 修改 | addPet 后自动创建 creator 成员 |
| `miniprogram/app.js` | 修改 | globalData 新字段、分享参数检测 |
| `miniprogram/utils/constants.js` | 修改 | MEMBER_ROLES、COLLECTIONS.FAMILY_MEMBERS |
| `miniprogram/pages/home/home.js` | 修改 | 合并共享宠物、成员管理、邀请处理 |
| `miniprogram/pages/home/home.wxml` | 修改 | 家庭成员展示区域 |
| `miniprogram/pages/home/home.wxss` | 修改 | 家庭成员样式 |
| `miniprogram/pages/record/record.js` | 修改 | canEdit 权限控制 |
| `miniprogram/pages/record/record.wxml` | 修改 | fab-btn、操作行条件显示 |
| `miniprogram/pages/record/record-add/record-add.js` | 修改 | 普通成员权限拦截 |
| `miniprogram/pages/bill/bill.js` | 修改 | canEdit 权限控制 |
| `miniprogram/pages/bill/bill.wxml` | 修改 | fab-btn 条件显示 |
| `miniprogram/pages/checklist/checklist.js` | 修改 | canEdit 权限控制 |
| `miniprogram/pages/checklist/checklist.wxml` | 修改 | FAB 条件显示 |
| `miniprogram/pages/pet-edit/pet-edit.js` | 修改 | 普通成员权限拦截 |

## 注意事项

1. **云数据库安全规则**：`pet_members` 集合需设置为"所有用户可读"，写操作通过云函数控制
2. **共享宠物的 records/bills/checklists 查询**：这些数据通过 `petId` 关联，需确保集合安全规则允许成员读取（可通过云函数代理查询，或将集合读权限放开）
3. **部署顺序**：先部署 `familyManage` 云函数和更新后的 `petManage`，再上传小程序前端代码
