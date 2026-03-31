# 个人页登录功能 - 获取微信用户信息

- [x] Task 1: 云函数 userManage 新增手机号解密 action
    - 1.1: 新增 getPhoneNumber case，调用 cloud.getPhoneNumber 解密并返回手机号
    - 1.2: 安装云函数依赖并部署

- [x] Task 2: profile.js 重写登录逻辑与数据状态
    - 2.1: data 中新增 showLoginModal、tempAvatarUrl、tempNickName、tempPhone、isGuest 字段
    - 2.2: loadUserInfo 中计算 isGuest 状态
    - 2.3: 重写 onLogin 为打开登录弹窗
    - 2.4: 新增 onChooseAvatar 处理头像选择（临时路径）
    - 2.5: 新增 onNicknameInput 处理昵称输入
    - 2.6: 新增 onGetPhoneNumber 调用云函数解密手机号
    - 2.7: 新增 confirmLogin 方法：上传头像到云存储、更新数据库和全局状态、关闭弹窗
    - 2.8: 新增 checkGuestData 方法：统计游客数据量，有数据则弹窗确认保留或清除
    - 2.9: 新增 clearAllGuestData 方法：清除宠物、记录、账单、清单数据
    - 2.10: 改造 onLogout 重置 phone 字段并恢复 isGuest 状态

- [x] Task 3: profile.wxml 改造用户信息区和新增登录弹窗
    - 3.1: 用户信息区分游客态和已登录态显示（游客显示登录引导按钮，已登录显示手机号脱敏）
    - 3.2: 退出登录按钮仅已登录态可见（修正原有条件判断）
    - 3.3: 新增登录弹窗：头像选择按钮 + 昵称输入框 + 手机号授权按钮 + 确认/取消按钮

- [x] Task 4: profile.wxss 新增登录弹窗及游客态样式
    - 4.1: 登录弹窗遮罩和容器样式
    - 4.2: 头像选择器样式（圆形预览 + 点击提示）
    - 4.3: 昵称输入框样式
    - 4.4: 手机号授权按钮样式（已授权/未授权两种状态）
    - 4.5: 确认登录和取消按钮样式
    - 4.6: 游客态登录引导按钮样式、已登录态手机号脱敏显示样式
