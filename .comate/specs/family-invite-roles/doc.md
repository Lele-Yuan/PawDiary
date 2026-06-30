# 家庭成员邀请角色化改造（family-invite-roles）

## 一、需求背景与场景

当前首页「家庭成员」模块的邀请按钮直接触发微信分享，受邀者通过 `/pages/invite/invite?id={petId}` 加入后统一为普通 `member`。本次改造要求将邀请区分为两种身份：

- 「共养人」：受邀者加入后角色为 `admin`（管理员）
- 「亲友团」：受邀者加入后角色为 `member`（普通成员，等同现状）

并新增独立的「家庭成员管理」页面用于查看 / 切换成员身份。

## 二、需求拆解

### 需求 1：首页邀请入口改造（弹出邀请类型选择）
- 将原"邀请成员"按钮（直接 `open-type="share"`）改为先弹出选择浮层。
- 浮层包含两项：「邀请共养人」「邀请亲友团」，每一项均为 `<button open-type="share">`，触发分享卡片。
- 分享 path 携带 `role` 参数：
  - 共养人卡片：`/pages/invite/invite?id={petId}&role=admin`
  - 亲友团卡片：`/pages/invite/invite?id={petId}&role=member`

### 需求 2：首页「家庭成员」标题增加"进入家庭"入口
- 在 `家庭成员` 标题最右侧增加可点击文案 / 图标（如"管理 >"）。
- 点击跳转到新页面 `/pages/family-members/family-members?petId={petId}`。

### 需求 3：新建家庭成员列表页
路径：`miniprogram/pages/family-members/family-members.*`
- 顶部双 tab：「共养人」`admin`、「亲友团」`member`（`creator` 单独固定显示在共养人 tab 顶部）。
- 列表项：头像、昵称、右侧操作按钮。
  - 共养人 tab 项：操作"改为亲友团"（仅创建者可见，creator 自身无操作）。
  - 亲友团 tab 项：操作"变成共养人"（仅创建者可见）。
- 复用 `familyManage` 云函数 `list` / `updateRole` / `remove`。

### 需求 4：邀请页支持角色参数 + 角色升级逻辑
改造 `pages/invite/invite.js` 与 `cloudfunctions/familyManage/index.js#joinFamily`。

加入逻辑（云函数侧）：

| 现有身份 | 邀请卡 role=admin（共养人）| 邀请卡 role=member（亲友团）|
| --- | --- | --- |
| 未加入 | 新增记录 role=admin | 新增记录 role=member |
| member（亲友团）| **升级为 admin**（更新记录）| 保持 member |
| admin（共养人）| 保持 admin | **保持 admin（不降级）** |
| creator | 保持 creator | 保持 creator |

`role` 参数仅接受 `admin` / `member`，缺省按 `member` 处理（兼容旧分享卡）。

## 三、架构与技术方案

### 3.1 新增 / 修改清单

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| 修改 | `miniprogram/pages/home/home.wxml` | 标题右侧入口；邀请区改为弹窗触发 |
| 修改 | `miniprogram/pages/home/home.wxss` | 入口样式、邀请弹窗样式 |
| 修改 | `miniprogram/pages/home/home.js` | 弹窗显隐逻辑、`onShareAppMessage` 支持 role、跳转家庭页 |
| 新增 | `miniprogram/pages/family-members/family-members.js` | 列表页逻辑 |
| 新增 | `miniprogram/pages/family-members/family-members.wxml` | 列表页结构（双 tab） |
| 新增 | `miniprogram/pages/family-members/family-members.wxss` | 列表页样式 |
| 新增 | `miniprogram/pages/family-members/family-members.json` | 页面配置 |
| 修改 | `miniprogram/app.json` | 注册新页面 |
| 修改 | `miniprogram/pages/invite/invite.js` | 解析 role、传给云函数、提示文案区分 |
| 修改 | `miniprogram/pages/invite/invite.wxml` | 标题文案区分共养人/亲友团 |
| 修改 | `cloudfunctions/familyManage/index.js` | `joinFamily` 支持 role 参数及升级语义 |

### 3.2 关键代码片段

#### A. 首页邀请弹窗（home.wxml 摘要）
```xml
<view class="section-header">
  <text class="section-title">家庭成员</text>
  <view class="section-action" bindtap="goFamilyMembers" wx:if="{{currentPet}}">
    管理
    <image class="section-action-arrow" src="/images/icons/arrow-right.svg" />
  </view>
</view>

<!-- 原邀请按钮 -->
<view class="family-member family-member-add"
      wx:if="{{familyMembers.length < 5 && canEdit}}"
      bindtap="onShowInvitePicker">
  <view class="family-member-avatar-wrap avatar-border-dashed">+</view>
  <text class="family-member-name name-muted">邀请成员</text>
</view>

<!-- 邀请类型选择浮层 -->
<view class="invite-picker-mask" wx:if="{{showInvitePicker}}" bindtap="onHideInvitePicker">
  <view class="invite-picker" catchtap>
    <view class="invite-picker-title">邀请加入「{{currentPet.name}}」家庭</view>
    <button class="invite-picker-item" open-type="share"
            data-role="admin"
            bindtap="onPickInviteRole">
      <text class="invite-picker-item-title">邀请共养人</text>
      <text class="invite-picker-item-desc">可与你一同管理宠物记录</text>
    </button>
    <button class="invite-picker-item" open-type="share"
            data-role="member"
            bindtap="onPickInviteRole">
      <text class="invite-picker-item-title">邀请亲友团</text>
      <text class="invite-picker-item-desc">可查看宠物的日常</text>
    </button>
    <view class="invite-picker-cancel" bindtap="onHideInvitePicker">取消</view>
  </view>
</view>
```

#### B. home.js 关键逻辑
```javascript
data: {
  // ...existing
  showInvitePicker: false,
  inviteRole: 'member' // 当前用户选择的邀请角色
},

onShowInvitePicker() {
  if (!this.data.canEdit) return;
  this.setData({ showInvitePicker: true });
},
onHideInvitePicker() {
  this.setData({ showInvitePicker: false });
},
onPickInviteRole(e) {
  // 仅记录角色，分享由 button 的 open-type=share 自身触发
  const role = e.currentTarget.dataset.role;
  this.setData({ inviteRole: role, showInvitePicker: false });
},

onShareAppMessage(options) {
  const pet = this.data.currentPet;
  const petName = pet ? pet.name : '宠物';
  if (pet && options.from === 'button') {
    const role = this.data.inviteRole === 'admin' ? 'admin' : 'member';
    const title = role === 'admin'
      ? '邀请你成为「' + petName + '」的共养人'
      : '邀请你加入「' + petName + '」的亲友团';
    return {
      title: title,
      path: '/pages/invite/invite?id=' + this.data.currentPetId + '&role=' + role,
      imageUrl: pet.avatar || ''
    };
  }
  return {
    title: 'PawDiary - 记录宠物生活的每一天',
    path: '/pages/home/home',
    imageUrl: '/images/guide/illust-main.png'
  };
},

goFamilyMembers() {
  if (!this.data.currentPetId) return;
  wx.navigateTo({ url: '/pages/family-members/family-members?petId=' + this.data.currentPetId });
}
```

#### C. invite.js 关键改造
```javascript
onLoad(options) {
  const invitePetId = options.id || '';
  const inviteRole = (options.role === 'admin') ? 'admin' : 'member';
  this.setData({ invitePetId, inviteRole });
  // ...原有用户就绪处理
},

doJoin() {
  const that = this;
  wx.cloud.callFunction({
    name: 'familyManage',
    data: { action: 'join', data: { petId: this.data.invitePetId, role: this.data.inviteRole } }
  }).then(function (res) {
    if (res.result && res.result.code === 0) {
      const app = getApp();
      app.globalData.currentPetId = that.data.invitePetId;
      app.globalData.currentPet = that.data.pet;
      // 使用云函数返回的实际角色
      app.globalData.currentPetRole = res.result.role || that.data.inviteRole;
      wx.showToast({ title: '加入成功', icon: 'success' });
      setTimeout(function () { wx.reLaunch({ url: '/pages/home/home' }); }, 1500);
    } else {
      wx.showToast({ title: (res.result && res.result.message) || '加入失败', icon: 'none' });
    }
  });
}
```

#### D. familyManage/joinFamily 改造（关键升级逻辑）
```javascript
async function joinFamily(openid, data) {
  var petId = data.petId;
  var role = data.role === 'admin' ? 'admin' : 'member';
  if (!petId) return { code: -1, message: '缺少宠物ID' };

  // 校验宠物
  try {
    var petRes = await db.collection('pets').doc(petId).get();
    if (!petRes.data || petRes.data.status !== 'active') {
      return { code: -1, message: '宠物不存在或已归档' };
    }
  } catch (e) {
    return { code: -1, message: '宠物不存在' };
  }

  // 已存在记录：按规则可能升级 member -> admin
  var existRes = await db.collection('pet_members')
    .where({ petId: petId, _openid: openid })
    .limit(1)
    .get();

  if (existRes.data.length > 0) {
    var current = existRes.data[0];
    // creator/admin 不降级；member 收到 admin 邀请则升级
    if (current.role === 'member' && role === 'admin') {
      await db.collection('pet_members').doc(current._id).update({
        data: { role: 'admin' }
      });
      return { code: 0, message: '已升级为共养人', role: 'admin', upgraded: true };
    }
    return { code: 0, message: '已是家庭成员', role: current.role };
  }

  // 新增记录
  var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
  var user = userRes.data.length > 0 ? userRes.data[0] : {};
  await db.collection('pet_members').add({
    data: {
      _openid: openid,
      petId: petId,
      role: role,
      nickName: user.nickName || '',
      avatarUrl: user.avatarUrl || '',
      createdAt: new Date()
    }
  });
  return { code: 0, message: '加入成功', role: role };
}
```

#### E. family-members 页面核心结构
```xml
<view class="page">
  <view class="tabs">
    <view class="tab {{tab === 'admin' ? 'active' : ''}}" bindtap="switchTab" data-tab="admin">共养人</view>
    <view class="tab {{tab === 'member' ? 'active' : ''}}" bindtap="switchTab" data-tab="member">亲友团</view>
  </view>
  <view class="list">
    <block wx:for="{{filteredMembers}}" wx:key="_id">
      <view class="row">
        <image class="avatar" src="{{item.avatarUrl || '/images/default-avatar.png'}}" />
        <text class="name">{{item.nickName}}</text>
        <text class="role-tag" wx:if="{{item.role === 'creator'}}">创建者</text>
        <view class="actions" wx:if="{{isCreator && item.role !== 'creator'}}">
          <view class="btn" wx:if="{{tab === 'admin'}}" bindtap="onChangeRole" data-openid="{{item._openid}}" data-role="member">改为亲友团</view>
          <view class="btn primary" wx:if="{{tab === 'member'}}" bindtap="onChangeRole" data-openid="{{item._openid}}" data-role="admin">变成共养人</view>
        </view>
      </view>
    </block>
    <view class="empty" wx:if="{{filteredMembers.length === 0}}">暂无成员</view>
  </view>
</view>
```

```javascript
// family-members.js
Page({
  data: { petId: '', tab: 'admin', members: [], filteredMembers: [], isCreator: false },
  onLoad(options) {
    this.setData({ petId: options.petId || '' });
  },
  onShow() { this.loadMembers(); },
  async loadMembers() {
    const app = getApp();
    const res = await wx.cloud.callFunction({
      name: 'familyManage',
      data: { action: 'list', data: { petId: this.data.petId } }
    });
    const members = (res.result && res.result.data) || [];
    const me = members.find(m => m._openid === app.globalData.openid);
    const isCreator = !!me && me.role === 'creator';
    this.setData({ members, isCreator }, () => this.applyFilter());
  },
  applyFilter() {
    const tab = this.data.tab;
    const list = this.data.members.filter(m => tab === 'admin'
      ? (m.role === 'admin' || m.role === 'creator')
      : m.role === 'member');
    this.setData({ filteredMembers: list });
  },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }, () => this.applyFilter()); },
  async onChangeRole(e) {
    const { openid, role } = e.currentTarget.dataset;
    const confirm = await wx.showModal({ title: '确认操作', content: role === 'admin' ? '将该成员设为共养人？' : '将该成员改为亲友团？' });
    if (!confirm.confirm) return;
    const res = await wx.cloud.callFunction({
      name: 'familyManage',
      data: { action: 'updateRole', data: { petId: this.data.petId, targetOpenid: openid, role } }
    });
    if (res.result && res.result.code === 0) {
      wx.showToast({ title: '已更新', icon: 'success' });
      this.loadMembers();
    } else {
      wx.showToast({ title: (res.result && res.result.message) || '操作失败', icon: 'none' });
    }
  }
});
```

## 四、数据流路径

1. 邀请发起：首页点击邀请 → 弹出选择层 → 选择角色（设置 inviteRole） → 微信触发 onShareAppMessage → 携带 role 生成分享卡。
2. 受邀加入：受邀者点击分享卡 → invite 页解析 role → doJoin → 云函数 join 按规则新增/升级 → 返回 role。
3. 列表查看：首页"管理"入口 → family-members 页 onShow → 调用 list → tab 过滤展示。
4. 角色切换：family-members 页操作按钮 → 调用 updateRole → 刷新列表。

## 五、边界与异常

- `role` 非法值：云函数侧白名单过滤，未识别值降级为 `member`。
- 已是 `creator` 不被降级；`updateRole` 已有保护。
- `admin` 收到 `member` 邀请：保持 `admin`，云函数提示"已是家庭成员"。
- 旧分享卡（无 role）：兼容为 `member`。
- 邀请上限：保持原有 `familyMembers.length < 5` 限制；超出仍隐藏邀请入口。
- 弹窗 mask 点击关闭，浮层内容点击不冒泡（catchtap）。
- 非创建者进入 `family-members` 页：隐藏所有操作按钮，仅展示列表。

## 六、预期产出

- 用户在首页可分别发起「共养人」/「亲友团」邀请。
- 受邀者按邀请卡身份加入；亲友团接受共养人邀请会自动升级。
- 首页提供"管理"入口进入成员列表，按 tab 区分共养人/亲友团，并提供身份切换。
- 旧版分享卡向后兼容。
