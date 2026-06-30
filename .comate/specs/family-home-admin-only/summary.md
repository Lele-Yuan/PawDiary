# 首页家庭成员模块仅显示共养人 - 完成总结

## 变更清单

- `miniprogram/pages/home/home.js`
  - data 增加 `adminMembers`、`canInviteAdmin`
  - `loadFamilyMembers` 中按 `creator/admin` 过滤出 `adminMembers`，并计算 `canInviteAdmin = adminMembers.length < 5`
  - 新增 `onDirectInviteMember`：共养人已满时点击邀请按钮先把 `inviteRole` 置为 `member`，再由按钮 `open-type=share` 触发亲友团分享
- `miniprogram/pages/home/home.wxml`
  - 家庭成员列表 `wx:for` 数据源由 `familyMembers` 改为 `adminMembers`
  - 邀请按钮始终在 `canEdit` 时显示，按 `canInviteAdmin` 渲染两种形态：
    - 未满：`<view bindtap="onShowInvitePicker">` 弹层
    - 已满：`<button open-type="share" bindtap="onDirectInviteMember">` 直接发起亲友团分享
  - 已满模式按钮文案改为"邀请亲友团"

## 行为说明

- 首页仅展示创建者与共养人头像；亲友团成员需通过"进入家庭"入口的"亲友团"tab 查看。
- 共养人 < 5：点击邀请 → 弹层选择「邀请共养人 / 邀请亲友团」。
- 共养人 = 5：点击邀请 → 直接拉起微信分享卡（path 携带 `role=member`），文案显示为亲友团。
- 非创建者/非共养人（无 `canEdit`）：邀请按钮不显示，与现状一致。

## 兼容性

- 共养人上限沿用 5 人（含 creator）。
- `_inviteRole` 实例属性保证 `onShareAppMessage` 在 setData 异步前能读到正确角色。
