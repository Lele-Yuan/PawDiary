# 完成总结：个人页登录功能

## 修改概览

### 1. cloudfunctions/userManage/index.js
- 新增 `getPhoneNumber` action，使用 `cloud.getPhoneNumber({ event })` 解密手机号
- 返回 `phoneNumber`、`purePhoneNumber`、`countryCode`

### 2. miniprogram/pages/profile/profile.js
- data 新增 `isGuest`、`showLoginModal`、`tempAvatarUrl`、`tempNickName`、`tempPhone` 字段
- `loadUserInfo` 中根据 nickName 计算 isGuest 状态
- 移除废弃的 `wx.getUserProfile()` 调用
- 新增方法：
  - `onLogin` -> 打开登录弹窗
  - `closeLoginModal` -> 关闭弹窗
  - `onChooseAvatar` -> 处理 `<button open-type="chooseAvatar">` 回调
  - `onNicknameInput` -> 处理 `<input type="nickname">` 输入
  - `onGetPhoneNumber` -> 调用云函数解密手机号
  - `confirmLogin` -> 上传头像到云存储、更新数据库和全局状态
  - `checkGuestData` -> 统计游客数据，弹窗询问保留或清除
  - `clearAllGuestData` -> 清除所有宠物/记录/账单/清单数据
- `onLogout` 增加 phone 重置，恢复 isGuest 状态

### 3. miniprogram/pages/profile/profile.wxml
- 用户信息区分游客态和已登录态：
  - 游客：显示"游客"文字 + 醒目的"点击登录"按钮
  - 已登录：显示昵称 + 手机号脱敏 + 微信云 badge
- 退出登录按钮条件从 `userInfo.nickName` 改为 `!isGuest`
- 新增完整登录弹窗：头像选择器 + 昵称输入框 + 手机号授权按钮 + 确认/取消

### 4. miniprogram/pages/profile/profile.wxss
- 新增游客态登录引导按钮样式（深棕色药丸形按钮）
- 新增手机号脱敏显示样式
- 新增登录弹窗全套样式：
  - 底部弹出面板（圆角顶部）
  - 头像选择器（圆形虚线边框 + 点击提示）
  - 表单字段（灰底圆角输入框）
  - 手机号授权按钮（未授权灰色 / 已授权薄荷绿）
  - 确认登录按钮（深棕色全宽）

## 登录流程

1. 游客点击头像或"点击登录" -> 底部弹出登录弹窗
2. 选择微信头像 (`chooseAvatar`) -> 输入昵称 (`nickname input`) -> 可选授权手机号 (`getPhoneNumber`)
3. 确认登录 -> 头像上传云存储 -> 更新 users 集合 -> 更新全局状态
4. 检测游客数据 -> 有数据弹窗确认"保留"或"清除" -> 完成
