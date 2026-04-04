# 个人页登录功能 - 获取微信用户信息（头像、昵称、手机号）

## 需求场景

个人页（profile）默认为游客身份（`nickName: '未知游客'`，无头像）。需要增加一个完整的登录流程，让用户授权微信头像、昵称和手机号。登录完成后，提示用户是否将游客身份下已录入的数据（宠物、记录、账单、清单）保留到微信账户中。

## 现状分析

- 当前 `onLogin` 使用已废弃的 `wx.getUserProfile()` API（2022 年 4 月后不再返回真实用户信息）
- 需要替换为新版 API：
  - **头像**：`<button open-type="chooseAvatar">` + `bindchooseavatar`
  - **昵称**：`<input type="nickname">` （微信内置昵称键盘）
  - **手机号**：`<button open-type="getPhoneNumber">` + `bindgetphonenumber`（需云函数解密）
- 游客和登录用户共享同一 openid，数据天然关联，"导入"本质是保留或清除

## 技术方案

### 整体流程

1. 用户点击头像或"点击登录" -> 弹出登录弹窗
2. 弹窗内分三步收集信息：选择头像、输入昵称、授权手机号（手机号可选）
3. 点击"确认登录"保存信息到数据库
4. 检测游客身份下是否有已录入数据（宠物/记录/账单/清单）
5. 若有数据，弹窗提示"是否保留游客期间的数据"
   - 保留：仅更新用户资料，数据不变
   - 不保留：清除所有关联数据（宠物、记录、账单、清单）
6. 退出登录时恢复游客状态

### 影响文件

| 文件 | 修改类型 | 说明 |
|---|---|---|
| `miniprogram/pages/profile/profile.wxml` | 修改 | 改造用户信息区为游客/已登录两种状态；新增登录弹窗 |
| `miniprogram/pages/profile/profile.wxss` | 修改 | 新增登录弹窗样式、游客态按钮样式 |
| `miniprogram/pages/profile/profile.js` | 修改 | 重写 onLogin 流程，新增头像/昵称/手机号获取逻辑，数据迁移确认逻辑 |
| `cloudfunctions/userManage/index.js` | 修改 | 新增 `getPhoneNumber` action 用于解密手机号 |

### 实现细节

#### 1. profile.wxml - 用户信息区改造

用户信息区根据登录状态显示不同内容：

**游客态**（`nickName` 为空或为 `'未知游客'`）：
- 显示默认头像 + "点击登录" 文字 + 一个醒目的登录引导按钮

**已登录态**：
- 显示真实头像 + 昵称 + 手机号（脱敏显示）

**登录弹窗**（底部弹出）：
```xml
<view class="login-modal" wx:if="{{showLoginModal}}">
  <!-- 头像选择 -->
  <button open-type="chooseAvatar" bindchooseavatar="onChooseAvatar" class="avatar-picker">
    <image class="avatar-preview" src="{{tempAvatarUrl || '/images/default/pet-avatar.png'}}" />
    <text>点击选择头像</text>
  </button>
  
  <!-- 昵称输入 -->
  <input type="nickname" placeholder="请输入昵称" bindinput="onNicknameInput" value="{{tempNickName}}" />
  
  <!-- 手机号获取（可选） -->
  <button open-type="getPhoneNumber" bindgetphonenumber="onGetPhoneNumber">
    授权手机号（可选）
  </button>
  
  <!-- 确认按钮 -->
  <button bindtap="confirmLogin">确认登录</button>
</view>
```

#### 2. profile.js - 登录逻辑重写

```js
data: {
  // 新增
  showLoginModal: false,
  tempAvatarUrl: '',
  tempNickName: '',
  tempPhone: '',
  isGuest: true   // 是否游客身份
}

// 判断是否游客
get isGuest: !userInfo.nickName || userInfo.nickName === '未知游客'

// 点击登录 -> 打开弹窗
onLogin() {
  if (!this.data.isGuest) return;
  this.setData({ showLoginModal: true });
}

// 选择头像
onChooseAvatar(e) {
  const tempAvatarUrl = e.detail.avatarUrl; // 临时路径
  this.setData({ tempAvatarUrl });
}

// 昵称输入
onNicknameInput(e) {
  this.setData({ tempNickName: e.detail.value });
}

// 获取手机号
async onGetPhoneNumber(e) {
  if (e.detail.errMsg !== 'getPhoneNumber:ok') return;
  const code = e.detail.code;
  // 调用云函数解密
  const res = await wx.cloud.callFunction({
    name: 'userManage',
    data: { action: 'getPhoneNumber', data: { code } }
  });
  if (res.result.code === 0) {
    this.setData({ tempPhone: res.result.data.phoneNumber });
  }
}

// 确认登录
async confirmLogin() {
  const { tempAvatarUrl, tempNickName, tempPhone } = this.data;
  if (!tempNickName) { wx.showToast({ title: '请输入昵称', icon: 'none' }); return; }
  
  // 1. 上传头像到云存储（如果有临时路径）
  let avatarUrl = tempAvatarUrl;
  if (tempAvatarUrl && tempAvatarUrl.startsWith('http://tmp')) {
    const uploadRes = await wx.cloud.uploadFile({
      cloudPath: `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
      filePath: tempAvatarUrl
    });
    avatarUrl = uploadRes.fileID;
  }
  
  // 2. 更新数据库
  const db = wx.cloud.database();
  const app = getApp();
  const { data: users } = await db.collection('users')
    .where({ _openid: app.globalData.openid }).limit(1).get();
  if (users.length > 0) {
    const updateData = { nickName: tempNickName, avatarUrl, updatedAt: new Date() };
    if (tempPhone) updateData.phone = tempPhone;
    await db.collection('users').doc(users[0]._id).update({ data: updateData });
  }
  
  // 3. 更新全局状态
  const userInfo = { ...app.globalData.userInfo, nickName: tempNickName, avatarUrl };
  if (tempPhone) userInfo.phone = tempPhone;
  app.globalData.userInfo = userInfo;
  this.setData({ userInfo, showLoginModal: false, isGuest: false });
  
  // 4. 检查是否有游客数据并提示
  await this.checkGuestData();
}

// 检查游客数据
async checkGuestData() {
  const db = wx.cloud.database();
  const [pets, records, bills, checklists] = await Promise.all([
    db.collection('pets').where({ status: 'active' }).count(),
    db.collection('records').count(),
    db.collection('bills').count(),
    db.collection('checklists').count()
  ]);
  const total = pets.total + records.total + bills.total + checklists.total;
  if (total === 0) {
    showSuccess('登录成功');
    return;
  }
  wx.showModal({
    title: '发现游客数据',
    content: `检测到您在游客模式下已录入 ${total} 条数据（宠物、记录、账单、清单），是否保留这些数据？`,
    confirmText: '保留数据',
    cancelText: '清除数据',
    success: async (res) => {
      if (res.cancel) {
        await this.clearAllGuestData();
      }
      showSuccess('登录成功');
    }
  });
}
```

#### 3. 退出登录改造

退出登录时只重置 `nickName`/`avatarUrl`/`phone`，恢复游客态。

#### 4. cloudfunctions/userManage - 新增手机号解密

```js
case 'getPhoneNumber':
  return await getPhoneNumber(event);

async function getPhoneNumber(event) {
  try {
    const res = await cloud.getPhoneNumber({
      event
    });
    return { code: 0, data: { phoneNumber: res.phoneNumber } };
  } catch (err) {
    return { code: -1, message: '获取手机号失败', error: err.message };
  }
}
```

`cloud.getPhoneNumber` 是微信云开发内置方法，可直接通过 event 中的 `cloudID` 解密手机号（基础库 2.21.0+），无需手动解密。

## 边界条件

- 头像选择后得到的是临时文件路径，需上传到云存储后使用 fileID 作为永久地址
- 手机号为可选项，用户可跳过
- 昵称为必填项，空昵称不允许提交
- 退出登录后恢复游客态，但已有数据不清除
- 游客无数据时登录直接成功，不弹数据迁移提示

## 数据流

```
点击登录 -> 弹窗
  -> chooseAvatar -> tempAvatarUrl (临时路径)
  -> nickname input -> tempNickName
  -> getPhoneNumber -> code -> 云函数解密 -> tempPhone
  -> 确认 -> 上传头像 -> 更新 users 集合 -> 更新 globalData
  -> 检查游客数据 -> 有数据: 弹窗确认保留/清除 | 无数据: 直接完成
```
