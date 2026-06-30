# 首页家庭成员模块仅显示共养人 + 邀请按钮智能化任务清单

- [x] Task 1: home.js 数据层调整
    - 1.1: data 增加 `adminMembers: []`、`canInviteAdmin: true`
    - 1.2: `loadFamilyMembers` 中按 role 过滤出 adminMembers，并计算 canInviteAdmin（adminCount < 5）
    - 1.3: 新增 `onDirectInviteMember` 方法，设置 `_inviteRole='member'` 与 data.inviteRole

- [x] Task 2: home.wxml 渲染调整
    - 2.1: 家庭成员列表 `wx:for` 数据源改为 `adminMembers`
    - 2.2: 移除 `familyMembers.length < 5` 限制，邀请按钮始终在 `canEdit` 时显示
    - 2.3: 按 `canInviteAdmin` 渲染两种邀请按钮形态（弹层 vs 直接 share）
    - 2.4: 已满模式按钮文案改为"邀请亲友团"

- [x] Task 3: 自查
    - 3.1: 验证仅显示共养人，亲友团不出现在首页
    - 3.2: 验证共养人 < 5 时点击仍弹层
    - 3.3: 验证共养人 = 5 时点击直接拉起亲友团分享卡（path 含 role=member）
    - 3.4: 验证非创建者/非共养人视角邀请按钮不显示
