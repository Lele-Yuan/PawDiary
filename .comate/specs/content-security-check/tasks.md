# 内容安全合规改造任务清单

- [x] Task 1: 准备公共安全校验模块
    - 1.1: 编写 contentSecurity.js 模板（checkText/checkImageByFileId/checkImagesByFileIds/deleteFiles）
    - 1.2: 准备 openapi 权限 config.json 模板（msgSecCheck + imgSecCheck）

- [x] Task 2: userManage 接入（头像 + 昵称）—— 审核重点
    - 2.1: 复制 contentSecurity.js 到 cloudfunctions/userManage
    - 2.2: 新增/更新 cloudfunctions/userManage/config.json 声明 openapi 权限
    - 2.3: loginOrRegister/updateUser 写入前校验 nickName 与 avatarUrl
    - 2.4: 违规时清理云存储头像并返回 -1001
    - 2.5: login-modal.js confirmLogin 处理 -1001 错误码（注意当前直接走数据库写入，需改走 userManage 云函数）

- [x] Task 3: petManage 接入
    - 3.1: 复制 contentSecurity.js + config.json
    - 3.2: add / update 操作中聚合校验 name、breed、description
    - 3.3: 校验 avatar 图片，违规清理云文件
    - 3.4: pet-edit.js 处理 -1001 文案

- [x] Task 4: recordManage 接入
    - 4.1: 复制 contentSecurity.js + config.json
    - 4.2: add / update 聚合校验 title/description/abnormalDesc/troubleName/stealItem
    - 4.3: 校验 images[]，违规清理已上传文件
    - 4.4: record-add.js 处理 -1001

- [x] Task 5: mapManage 接入（地点）
    - 5.1: 复制 contentSecurity.js + config.json
    - 5.2: add/update 校验 name、description
    - 5.3: 校验 images[]，违规清理
    - 5.4: place-add.js 处理 -1001

- [x] Task 6: memorialManage 接入（纪念 + 祝福）
    - 6.1: 复制 contentSecurity.js + config.json
    - 6.2: add memorial 校验 petName、description、petAvatar
    - 6.3: addBlessing 校验 content
    - 6.4: memorial-add.js / memorial.js 处理 -1001

- [x] Task 7: careManage 接入
    - 7.1: 复制 contentSecurity.js + config.json
    - 7.2: add post 聚合校验 title、description、petInfo、contactInfo.wechat
    - 7.3: care-add.js 处理 -1001

- [x] Task 8: visitManage 接入
    - 8.1: 复制 contentSecurity.js + config.json
    - 8.2: add/update 校验 ownerNickname/helperNickname/serviceName/message/ownerNote/helperNote
    - 8.3: visit-add.js 处理 -1001

- [x] Task 9: billManage 接入
    - 9.1: 复制 contentSecurity.js + config.json
    - 9.2: add/update 校验 title、note
    - 9.3: bill-add.js 处理 -1001

- [x] Task 10: 联调与回归
    - 10.1: 用违规关键词测试每个入口，确认拦截
    - 10.2: 正常内容测试，确认不被误伤
    - 10.3: 部署所有变更的云函数（特别注意 config.json 需重新部署生效）
    - 10.4: 准备审核回复说明（已接入 msgSecCheck v2 + imgSecCheck）
