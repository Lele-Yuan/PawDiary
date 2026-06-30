# 首页家庭成员模块仅显示共养人 + 邀请按钮智能化（family-home-admin-only）

## 一、需求理解

在 `family-invite-roles` 改造基础上继续优化首页"家庭成员"模块：

1. 首页家庭成员横向列表**只显示共养人（creator + admin）**，亲友团（member）不在首页展示，需在"进入家庭"页查看。
2. **"邀请成员"按钮一直显示**（不再随成员总数 ≥ 5 隐藏），仍仅在 `canEdit` 时可见。
3. 点击邀请按钮时的行为根据共养人数量动态切换：
   - 共养人未满（< 上限）：弹出「邀请共养人 / 邀请亲友团」选择浮层（保持现状）。
   - 共养人已满（≥ 上限）：跳过浮层，**直接以"亲友团"身份发起分享**。

## 二、关键决策

- **共养人上限**：复用现有 5 人上限语义，定义 `MAX_ADMIN_COUNT = 5`，creator 计入名额。
- **首页展示上限**：现有 `familyMembers.length < 5` 仅用于控制邀请按钮显示，本次改造后该判断作废，邀请按钮始终展示（前提 `canEdit`）。横向滚动已能容纳更多成员。
- **触发"直接分享亲友团"**：通过 `<button open-type="share">` 触发分享，需在按钮上同步设置 `inviteRole=member`。即按钮在两种模式下渲染不同：
  - 未满模式：普通 `<view>`，`bindtap` 显示浮层。
  - 已满模式：`<button open-type="share">`，`bindtap` 设置 `inviteRole=member`。

## 三、影响文件

| 路径 | 类型 | 说明 |
| --- | --- | --- |
| `miniprogram/pages/home/home.js` | 修改 | 计算 `adminMembers`、`canInviteAdmin`；新增"直接亲友团分享"分支 |
| `miniprogram/pages/home/home.wxml` | 修改 | 列表数据源换成 `adminMembers`；邀请按钮按 `canInviteAdmin` 渲染两种形态；移除 `length < 5` 条件 |

## 四、实现细节

### 4.1 home.js
- 在 `loadFamilyMembers` 完成后，计算两份数据：
  ```javascript
  var adminMembers = members.filter(function(m){
    return m.role === 'creator' || m.role === 'admin';
  });
  var adminCount = adminMembers.length;
  var canInviteAdmin = adminCount < 5; // MAX_ADMIN_COUNT
  this.setData({ familyMembers: members, adminMembers: adminMembers, canInviteAdmin: canInviteAdmin });
  ```
- 新增 `onDirectInviteMember`：当共养人已满时，点击直接走亲友团分享流程。
  ```javascript
  onDirectInviteMember: function () {
    if (!this.data.canEdit) return;
    this._inviteRole = 'member';
    this.setData({ inviteRole: 'member' });
    // 由 button open-type=share 自身触发 onShareAppMessage
  }
  ```

### 4.2 home.wxml
列表 `wx:for` 改为 `adminMembers`：
```xml
<view class="family-row">
  <view class="family-member family-member-active"
        wx:for="{{adminMembers}}"
        wx:key="_id"
        ...>
    ...
  </view>

  <!-- 共养人未满：弹层选择 -->
  <view class="family-member family-member-add"
        wx:if="{{canEdit && canInviteAdmin}}"
        bindtap="onShowInvitePicker">
    <view class="family-member-avatar-wrap avatar-border-dashed">+</view>
    <text class="family-member-name name-muted">邀请成员</text>
  </view>

  <!-- 共养人已满：直接亲友团分享 -->
  <button class="family-member family-member-add"
          wx:if="{{canEdit && !canInviteAdmin}}"
          open-type="share"
          bindtap="onDirectInviteMember">
    <view class="family-member-avatar-wrap avatar-border-dashed">+</view>
    <text class="family-member-name name-muted">邀请亲友团</text>
  </button>
</view>
```

## 五、边界与异常

- `adminMembers` 为空时（理论不存在，至少有 creator）：仍正常渲染邀请按钮。
- `canEdit=false`（亲友团 / 普通成员视角）：不显示邀请按钮，与现状一致。
- 共养人上限触达临界（恰好 5）：按钮文案变为"邀请亲友团"，提示用户当前只能邀亲友团。
- 旧逻辑里 `familyMembers.length < 5` 同时作为"总成员上限"，本次改造后总成员不再设硬上限（横向可滚动）；如后续需要总人数限制可独立处理，本次需求未要求。

## 六、预期效果

- 首页"家庭成员"区域仅出现共养人头像（creator 高亮）。
- 邀请按钮始终可见（创建者/共养人）。
- 共养人未满 → 弹层选邀请类型；已满 → 直接亲友团分享卡片。
