# 家庭成员权限控制与数据共享

## 需求概述

实现宠物数据的多用户共享机制：创建者可以邀请家庭成员共同管理宠物，被邀请人通过小程序分享卡片加入。角色分为创建者、管理员、普通成员，不同角色有不同的操作权限。首页显示家庭成员模块。

## 角色与权限

| 能力 | 创建者 | 管理员 | 普通成员 |
|------|--------|--------|----------|
| 查看宠物所有数据 | ✓ | ✓ | ✓ |
| 编辑宠物信息 | ✓ | ✓ | ✗ |
| 添加/编辑记录、账单、清单 | ✓ | ✓ | ✗ |
| 设置成员角色 | ✓ | ✗ | ✗ |
| 移除成员 | ✓ | ✗ | ✗ |
| 邀请新成员 | ✓ | ✓ | ✗ |

## 数据模型

### 新增集合：`pet_members`

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 文档 ID |
| `_openid` | string | 成员的 openid |
| `petId` | string | 关联的宠物 ID |
| `role` | string | `'creator'` / `'admin'` / `'member'` |
| `nickName` | string | 成员昵称（加入时快照） |
| `avatarUrl` | string | 成员头像（加入时快照） |
| `createdAt` | Date | 加入时间 |

### constants.js 新增

```js
const MEMBER_ROLES = {
  CREATOR: 'creator',
  ADMIN: 'admin',
  MEMBER: 'member'
};

// COLLECTIONS 中新增
FAMILY_MEMBERS: 'pet_members'
```

## 邀请流程

1. 创建者/管理员在首页家庭成员模块点击"邀请成员"
2. 触发 `wx.shareAppMessage`，分享路径为 `/pages/home/home?invitePetId=xxx`
3. 被邀请人通过分享卡片打开小程序
4. `app.js onLaunch/onShow` 检测到 `invitePetId` 参数，存入 `globalData.pendingInvite`
5. `home.js onShow` 检测到 `pendingInvite`，弹出加入确认弹窗（显示宠物名称和邀请者信息）
6. 用户确认后调用 `familyManage` 云函数的 `join` 动作
7. 云函数检查是否已是成员，如非则创建 `pet_members` 记录（role: 'member'）

## 宠物查询改造

当前：各页面通过 `db.collection('pets').where({ status: 'active' })` 查询，云数据库安全规则自动过滤 `_openid`，只返回自己创建的宠物。

改造后：
1. `home.js loadData` 先查自己创建的宠物，再查 `pet_members` 获取被邀请加入的宠物 ID 列表，合并去重
2. 其他页面（record、bill、checklist）通过 `globalData` 获取当前宠物 ID，不需要改查询逻辑——但需要确保权限（只有 creator/admin 可编辑）
3. `globalData` 新增 `currentPetRole` 字段，记录当前用户对当前宠物的角色

### home.js loadData 改造

```js
async loadData() {
  var app = getApp();
  var db = wx.cloud.database();
  var _ = db.command;

  // 1. 自己创建的宠物
  var ownRes = await db.collection('pets')
    .where({ status: 'active' })
    .orderBy('createdAt', 'asc')
    .get();
  var ownPets = ownRes.data;

  // 2. 被邀请加入的宠物
  var memberRes = await db.collection('pet_members')
    .where({ _openid: app.globalData.openid })
    .get();
  var sharedPetIds = [];
  var memberRoleMap = {};
  for (var i = 0; i < memberRes.data.length; i++) {
    var m = memberRes.data[i];
    sharedPetIds.push(m.petId);
    memberRoleMap[m.petId] = m.role;
  }

  // 标记自己创建的宠物角色
  for (var j = 0; j < ownPets.length; j++) {
    if (!memberRoleMap[ownPets[j]._id]) {
      memberRoleMap[ownPets[j]._id] = 'creator';
    }
  }

  // 查询被邀请的宠物（排除自己创建的）
  var ownIds = ownPets.map(function(p) { return p._id; });
  var extraIds = [];
  for (var k = 0; k < sharedPetIds.length; k++) {
    if (ownIds.indexOf(sharedPetIds[k]) === -1) {
      extraIds.push(sharedPetIds[k]);
    }
  }

  var sharedPets = [];
  if (extraIds.length > 0) {
    var spRes = await db.collection('pets')
      .where({ _id: _.in(extraIds), status: 'active' })
      .get();
    sharedPets = spRes.data;
  }

  var allPets = ownPets.concat(sharedPets);
  // ...后续选中宠物、设置 currentPetRole 等
  app.globalData.currentPetRole = memberRoleMap[currentPetId] || 'member';
}
```

## 权限控制

### globalData 新增字段

```js
globalData: {
  userInfo: null,
  currentPetId: '',
  currentPetRole: '',  // 'creator' | 'admin' | 'member'
  openid: '',
  pendingInvite: ''    // 待处理的邀请宠物 ID
}
```

### 页面权限检查

各编辑页面在 onLoad 或 onShow 中检查权限：

```js
var app = getApp();
var canEdit = app.globalData.currentPetRole === 'creator' || app.globalData.currentPetRole === 'admin';
this.setData({ canEdit: canEdit });
```

- record-add：`canEdit` 为 false 时隐藏提交/删除按钮，表单设为只读
- bill-add：同上
- pet-edit：普通成员不可进入编辑模式
- 列表页的添加按钮（fab-btn）：`canEdit` 为 false 时隐藏

## 新增云函数：familyManage

路径：`cloudfunctions/familyManage/index.js`

### 动作列表

| action | 说明 | 参数 |
|--------|------|------|
| `join` | 加入宠物家庭 | `petId` |
| `list` | 获取宠物的所有成员 | `petId` |
| `updateRole` | 更新成员角色 | `petId`, `targetOpenid`, `role` |
| `remove` | 移除成员 | `petId`, `targetOpenid` |

```js
// join：加入宠物家庭
async function joinFamily(openid, data) {
  var petId = data.petId;
  // 检查宠物是否存在
  var petRes = await db.collection('pets').doc(petId).get();
  if (!petRes.data || petRes.data.status !== 'active') {
    return { code: -1, message: '宠物不存在' };
  }
  // 检查是否已是成员
  var existRes = await db.collection('pet_members')
    .where({ petId: petId, _openid: openid })
    .count();
  if (existRes.total > 0) {
    return { code: 0, message: '已是家庭成员' };
  }
  // 获取用户信息
  var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
  var user = userRes.data[0] || {};
  // 创建成员记录
  await db.collection('pet_members').add({
    data: {
      _openid: openid,
      petId: petId,
      role: 'member',
      nickName: user.nickName || '宠物主人',
      avatarUrl: user.avatarUrl || '',
      createdAt: new Date()
    }
  });
  return { code: 0, message: '加入成功' };
}
```

## petManage 改造

`addPet` 中，创建宠物后自动创建 creator 的 `pet_members` 记录：

```js
// 在 addPet 的 db.collection('pets').add 之后追加：
var userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();
var user = userRes.data[0] || {};
await db.collection('pet_members').add({
  data: {
    _openid: openid,
    petId: res._id,
    role: 'creator',
    nickName: user.nickName || '宠物主人',
    avatarUrl: user.avatarUrl || '',
    createdAt: new Date()
  }
});
```

## app.js 改造

处理分享场景传入的 `invitePetId`：

```js
onLaunch: function(options) {
  // ...现有 cloud.init 和 initUser...
  if (options && options.query && options.query.invitePetId) {
    this.globalData.pendingInvite = options.query.invitePetId;
  }
},
onShow: function(options) {
  if (options && options.query && options.query.invitePetId) {
    this.globalData.pendingInvite = options.query.invitePetId;
  }
}
```

## 首页家庭成员模块

在快捷入口下方、指南模块上方插入家庭成员区域：

### home.wxml 新增

```xml
<!-- 家庭成员 -->
<view class="family-section card" wx:if="{{currentPet}}">
  <view class="section-header">
    <text class="section-title">家庭成员</text>
    <text class="section-more" wx:if="{{canEdit}}" bindtap="onInviteMember">邀请 +</text>
  </view>
  <view class="family-list">
    <view class="family-item" wx:for="{{familyMembers}}" wx:key="_id">
      <image class="family-avatar" src="{{item.avatarUrl || '/images/default-avatar.png'}}" mode="aspectFill" />
      <view class="family-info">
        <text class="family-name">{{item.nickName}}</text>
        <text class="family-role">{{item.roleLabel}}</text>
      </view>
      <!-- 创建者可管理角色 -->
      <view class="family-actions" wx:if="{{isCreator && item.role !== 'creator'}}">
        <text class="family-action-btn" data-openid="{{item._openid}}" data-role="{{item.role}}" bindtap="onToggleRole">
          {{item.role === 'admin' ? '取消管理' : '设为管理'}}
        </text>
        <text class="family-action-btn danger" data-openid="{{item._openid}}" bindtap="onRemoveMember">移除</text>
      </view>
    </view>
  </view>
</view>
```

### home.js 新增方法

```js
// 加载家庭成员
async loadFamilyMembers(petId) {
  var db = wx.cloud.database();
  var res = await db.collection('pet_members').where({ petId: petId }).get();
  var roleLabels = { creator: '创建者', admin: '管理员', member: '成员' };
  var members = res.data.map(function(m) {
    m.roleLabel = roleLabels[m.role] || '成员';
    return m;
  });
  this.setData({ familyMembers: members });
},

// 邀请成员（触发分享）
onInviteMember() {
  this._wantShare = true;
  // 无法直接调用 shareAppMessage，需要用 button open-type="share"
  // 因此使用 showShareMenu 或将邀请按钮改为 share 按钮
},

// onShareAppMessage
onShareAppMessage() {
  var pet = this.data.currentPet;
  return {
    title: '邀请你加入「' + (pet ? pet.name : '宠物') + '」的照顾家庭',
    path: '/pages/home/home?invitePetId=' + this.data.currentPetId,
    imageUrl: pet ? pet.avatar : ''
  };
},

// 处理邀请弹窗
async checkPendingInvite() {
  var app = getApp();
  var invitePetId = app.globalData.pendingInvite;
  if (!invitePetId) return;
  app.globalData.pendingInvite = '';

  // 获取宠物信息
  var db = wx.cloud.database();
  try {
    var petRes = await db.collection('pets').doc(invitePetId).get();
    var pet = petRes.data;
    if (!pet || pet.status !== 'active') return;

    // 弹窗确认
    var modalRes = await wx.showModal({
      title: '加入宠物家庭',
      content: '你被邀请加入「' + pet.name + '」的照顾家庭，加入后可查看该宠物的所有数据。',
      confirmText: '加入',
      cancelText: '取消'
    });
    if (!modalRes.confirm) return;

    // 调用云函数加入
    var res = await wx.cloud.callFunction({
      name: 'familyManage',
      data: { action: 'join', data: { petId: invitePetId } }
    });
    if (res.result.code === 0) {
      wx.showToast({ title: res.result.message, icon: 'success' });
      this.loadData();
    }
  } catch (err) {
    console.error('处理邀请失败', err);
  }
},

// 切换角色
async onToggleRole(e) {
  var targetOpenid = e.currentTarget.dataset.openid;
  var currentRole = e.currentTarget.dataset.role;
  var newRole = currentRole === 'admin' ? 'member' : 'admin';
  await wx.cloud.callFunction({
    name: 'familyManage',
    data: { action: 'updateRole', data: { petId: this.data.currentPetId, targetOpenid: targetOpenid, role: newRole } }
  });
  this.loadFamilyMembers(this.data.currentPetId);
},

// 移除成员
async onRemoveMember(e) {
  var targetOpenid = e.currentTarget.dataset.openid;
  var res = await wx.showModal({ title: '确认移除', content: '确定要移除该成员吗？', confirmColor: '#C0392B' });
  if (!res.confirm) return;
  await wx.cloud.callFunction({
    name: 'familyManage',
    data: { action: 'remove', data: { petId: this.data.currentPetId, targetOpenid: targetOpenid } }
  });
  wx.showToast({ title: '已移除', icon: 'success' });
  this.loadFamilyMembers(this.data.currentPetId);
}
```

## 邀请按钮实现

微信小程序中不能通过 JS 直接触发分享，只能通过 `<button open-type="share">` 触发。因此"邀请 +"按钮需要改为：

```xml
<button class="invite-btn" open-type="share" wx:if="{{canEdit}}">邀请 +</button>
```

## 受影响文件

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `cloudfunctions/familyManage/index.js` | 新增 | 家庭成员管理云函数 |
| `cloudfunctions/petManage/index.js` | 修改 | addPet 后自动创建 creator 成员记录 |
| `miniprogram/app.js` | 修改 | 处理分享 invitePetId、globalData 新增字段 |
| `miniprogram/app.json` | 修改 | （如需新页面则注册） |
| `miniprogram/utils/constants.js` | 修改 | 新增 MEMBER_ROLES、COLLECTIONS.FAMILY_MEMBERS |
| `miniprogram/pages/home/home.js` | 修改 | 加载合并共享宠物、家庭成员模块、邀请/角色管理、处理邀请 |
| `miniprogram/pages/home/home.wxml` | 修改 | 增加家庭成员区域 |
| `miniprogram/pages/home/home.wxss` | 修改 | 家庭成员样式 |
| `miniprogram/pages/record/record.js` | 修改 | 加载数据时包含共享宠物的记录，权限控制编辑按钮 |
| `miniprogram/pages/record/record.wxml` | 修改 | 根据 canEdit 控制添加/编辑按钮显示 |
| `miniprogram/pages/bill/bill.js` | 修改 | 同 record，权限控制 |
| `miniprogram/pages/bill/bill.wxml` | 修改 | 根据 canEdit 控制 |
| `miniprogram/pages/checklist/checklist.js` | 修改 | 同上 |
| `miniprogram/pages/checklist/checklist.wxml` | 修改 | 同上 |
| `miniprogram/pages/pet-edit/pet-edit.js` | 修改 | 权限校验 |

## 边界条件与注意事项

1. **数据安全**：`pet_members` 集合的安全规则需要设置为"所有用户可读"（因为成员需要查询其他成员），创建/删除通过云函数控制
2. **宠物查询**：共享宠物不属于当前用户（`_openid` 不同），客户端直接查询会被安全规则拦截。需要通过云函数查询或将 `pets` 集合安全规则改为"所有用户可读"并在业务层控制
3. **已有宠物迁移**：已存在的宠物没有 `pet_members` 记录，需在 `loadData` 中检测——如果自己创建的宠物没有 creator 记录，自动补建
4. **成员离开**：普通成员可以主动离开家庭（在首页成员模块中提供"退出"入口）
5. **创建者不可被移除**
6. **头像默认值**：无头像时显示默认头像图片
7. **ES5 兼容**：所有新代码使用 ES5 语法，避免 Babel runtime 错误
