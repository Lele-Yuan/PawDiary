# 内容安全合规改造 总结

## 背景
微信小程序「爪印日记」2026-06-18 提审被拒，原因：头像功能等用户提交内容未接入「内容安全 API」。本次改造按「全量覆盖 + 同步校验」方案，在所有用户输入入口（云函数侧）接入 `security.msgSecCheck`（v2，scene=2）与 `security.imgSecCheck`，违规时拦截入库并清理已上传文件。

## 接入范围与改动文件

### 公共模块
- 新增 `cloudfunctions/<fn>/contentSecurity.js`：`checkText` / `checkImageByFileId` / `checkImagesByFileIds` / `deleteFiles` / `violationResult`
  - 文本：scene=2、version=2，自动带 openid
  - 失败策略：网络/限额错误「fail open」并打日志；仅 `errCode === 87014` 强制拒绝
  - 违规响应统一 `{ code: -1001, message: '内容包含违规信息，请修改后重试' }`
- 每个云函数补充/新建 `config.json`：
  ```json
  { "permissions": { "openapi": ["security.msgSecCheck", "security.imgSecCheck"] } }
  ```

### 已接入云函数 + 字段
| 云函数 | 文本字段 | 图片字段 | 前端 |
|---|---|---|---|
| userManage | nickName | avatarUrl | login-modal.js |
| petManage | name/breed/description | avatar | pet-edit.js |
| recordManage | title/description/abnormalDesc/troubleName/stealItem | images[]（更新走 diff） | record-add.js |
| mapManage | name/description | images[]（更新走 diff） | place-add.js |
| memorialManage | petName/description + 祝福 content | petAvatar | memorial-add.js / memorial.js |
| careManage | title/description/petInfo/contactInfo.wechat | — | care-add.js |
| visitManage | ownerNickname/helperNickname/serviceName/message/ownerNote/helperNote | — | visit-add.js |
| billManage | title/note | — | bill-add.js |

### 前端统一处理
- 捕获 `res.result.code === -1001` → Toast「内容包含违规信息，请修改后重试」
- 若提交前已上传图片（pet-edit、memorial-add、record-add、place-add），命中 -1001 时通过 `wx.cloud.deleteFile` 清理 cloud:// 文件，避免脏数据
- login-modal 由原直接 DB 写入改走 `userManage` 云函数，确保校验生效

## 关键设计决策
1. **per-function 复制 `contentSecurity.js`**：小程序云函数不支持跨函数共享模块
2. **多字段聚合一次校验**：以 `\n` 连接同一记录的多个文本字段，节省 openapi 配额
3. **图片更新差量校验**：仅校验本次新增的 fileID（`new - old`），避免重复扫描历史 OK 图片
4. **fail-open**：openapi 限额/网络异常时放行并日志告警，避免误伤正常用户；仅 87014 强制拦截
5. **server-side only**：所有校验放云函数，前端不做绕过

## 部署 Checklist（用户操作）
1. 在微信开发者工具或云开发控制台**全量重新部署**以下云函数（config.json 变更必须重新部署生效）：
   - userManage、petManage、recordManage、mapManage、memorialManage、careManage、visitManage、billManage
2. 真机回归：
   - 用违规关键词 / 测试图片分别提交：头像、宠物、记录、地点、纪念、祝福、互助、上门、账单
   - 预期：Toast 提示违规，记录不入库，已上传图片被清理
   - 正常内容：流程不被误伤
3. 提交审核回复说明：「已接入 `security.msgSecCheck`（v2，scene=2）与 `security.imgSecCheck`，覆盖头像、昵称及所有用户提交的文本/图片内容，违规自动拦截并清理。」

## 状态
所有 10 个任务已完成（代码 + 前端 + 任务清单标记）。剩余部署与回归验证由用户在微信开发者工具中执行。
