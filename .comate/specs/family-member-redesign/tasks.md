# 家庭成员视觉重构任务

- [x] Task 1: 重写家庭成员区域 WXML
    - 1.1: 修改 family-section 内部结构为横向布局
    - 1.2: 移除原有纵向列表结构
    - 1.3: 移除 section-header 中的邀请按钮
    - 1.4: 添加长按事件绑定 onMemberLongPress

- [x] Task 2: 修改样式 WXSS
    - 2.1: 删除旧样式 (.family-list, .family-item, .family-avatar, .family-info, .family-role, .family-actions, .family-action-btn, .family-empty)
    - 2.2: 新增横向布局样式 (.family-row)
    - 2.3: 新增成员项样式 (.family-member, .family-member-active)
    - 2.4: 新增头像包装样式 (.family-member-avatar-wrap, .avatar-border-active, .avatar-border-dashed)
    - 2.5: 新增名称样式 (.family-member-name, .name-active, .name-muted)

- [x] Task 3: 添加长按成员管理功能 JS
    - 3.1: 新增 onMemberLongPress 方法
    - 3.2: 创建者长按非创建者成员弹出 ActionSheet
    - 3.3: 非创建者长按无响应

- [x] Task 4: 重构成员管理方法
    - 4.1: 提取 toggleMemberRole 方法（去除事件参数依赖）
    - 4.2: 提取 removeMember 方法（去除事件参数依赖）
    - 4.3: 删除原有 onToggleRole 和 onRemoveMember 方法
