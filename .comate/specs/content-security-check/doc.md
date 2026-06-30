# 内容安全合规改造（content-security-check）

## 一、背景

微信审核反馈：「头像」功能未接入内容安全 API，存在信息安全风险。需对所有用户可在小程序内任意发布的内容（图片 + 文本）接入：
- 图片：`security.imgSecCheck`（同步）
- 文本：`security.msgSecCheck`（version=2）

用户选择了"全量覆盖"，因此本期一次性补齐全部用户提交入口。

## 二、技术选型

### 2.1 调用方式
- 在云函数侧统一使用 `cloud.openapi.security.imgSecCheck` 与 `cloud.openapi.security.msgSecCheck`。
- 云函数 `cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })` 已就绪，可直接使用 openapi（无需配置 cloudbase）。
- 接口前置条件：调用 openapi 需要小程序已上线或使用云开发；msgSecCheck v2 需要 openid（云函数已能拿到）。

### 2.2 共享工具模块
新建公共工具 `cloudfunctions/_shared/contentSecurity/index.js`，对 `imgSecCheck` 与 `msgSecCheck` 进行封装，统一异常处理与返回结构：

```javascript
// 返回 { pass: boolean, reason: string }
exports.checkText = async function (cloud, { openid, content, scene = 2 }) { ... }
exports.checkImageByFileId = async function (cloud, { openid, fileID }) { ... }
exports.checkImagesByFileIds = async function (cloud, { openid, fileIDs }) { ... }
```

但小程序云开发不支持 monorepo 共享目录，每个云函数有独立的 node_modules。因此采用**复制部署**方案：在每个需要的云函数目录中各自维护一份 `contentSecurity.js`（内容相同，便于统一升级时批量同步）。

简化：保持**每个云函数内联**实现（直接写在 index.js 中或 require 同目录的 `contentSecurity.js`），避免共享路径打包问题。本期统一在每个云函数目录内新增 `contentSecurity.js`。

### 2.3 调用时机
- 文本：写入前调用 `msgSecCheck`；不通过则直接返回错误。
- 图片：用户已上传到云存储拿到 `fileID`，写入前调用 `imgSecCheck`（云函数内部 `cloud.downloadFile` 拿 buffer 再 `imgSecCheck`）。不通过则：
  - 删除云存储中刚上传的文件（避免残留）。
  - 返回错误。
- 全部走"先校验、后落库"的顺序。

### 2.4 错误码与提示
统一返回 `{ code: -1001, message: '内容包含违规信息，请修改后重试' }`，前端按规范文案"所发布内容含违规信息"提示。

### 2.5 兜底与可用性
- openapi 偶发 errCode（如限流 -1）时，按"放行 + 记日志"策略，避免误伤；硬性违规（87014 等）严格拦截。
- 若调用异常（network/timeout），同样放行并记录日志，由后续异步策略覆盖。

## 三、影响范围（按云函数维度）

| 云函数 | 文本字段 | 图片字段 |
| --- | --- | --- |
| `userManage`（loginOrRegister / update）| `nickName` | `avatarUrl` |
| `petManage`（add / update）| `name`, `breed`, `description` | `avatar` |
| `recordManage`（add / update）| `title`, `description`, `abnormalDesc`, `troubleName`, `stealItem` | `images[]` |
| `mapManage`（add / update place）| `name`, `description` | `images[]` |
| `memorialManage`（add memorial / addBlessing）| `petName`, `description`, `content` | `petAvatar` |
| `careManage`（add post）| `title`, `description`, `petInfo`, `contactInfo.wechat` | （无新增图片，若有再补）|
| `visitManage`（add / update）| `ownerNickname`, `helperNickname`, `serviceName`, `message`, `ownerNote`, `helperNote` | （无） |
| `billManage`（add / update）| `title`, `note` | （无） |

> 实际改造时按上面表格逐项接入，逐字段拼接为一段文本一次性走 `msgSecCheck`，节约调用次数。

## 四、关键实现

### 4.1 公共工具 `contentSecurity.js`
```javascript
// cloudfunctions/<name>/contentSecurity.js
async function checkText(cloud, openid, content) {
  if (!content) return { pass: true };
  const text = String(content).slice(0, 2500); // msgSecCheck v2 限制
  try {
    await cloud.openapi.security.msgSecCheck({
      version: 2,
      scene: 2,
      openid,
      content: text
    });
    return { pass: true };
  } catch (err) {
    // 87014 表示命中违规
    if (err && (err.errCode === 87014 || /87014/.test(String(err)))) {
      return { pass: false, reason: '文本含违规内容' };
    }
    console.warn('msgSecCheck 异常，放行：', err);
    return { pass: true };
  }
}

async function checkImageByFileId(cloud, fileID) {
  if (!fileID) return { pass: true };
  try {
    const dl = await cloud.downloadFile({ fileID });
    if (!dl || !dl.fileContent) return { pass: true };
    await cloud.openapi.security.imgSecCheck({ media: { contentType: 'image/jpeg', value: dl.fileContent } });
    return { pass: true };
  } catch (err) {
    if (err && (err.errCode === 87014 || /87014/.test(String(err)))) {
      return { pass: false, reason: '图片含违规内容' };
    }
    console.warn('imgSecCheck 异常，放行：', err);
    return { pass: true };
  }
}

async function checkImagesByFileIds(cloud, fileIDs) {
  if (!Array.isArray(fileIDs) || fileIDs.length === 0) return { pass: true };
  for (const id of fileIDs) {
    const r = await checkImageByFileId(cloud, id);
    if (!r.pass) return r;
  }
  return { pass: true };
}

async function deleteFiles(cloud, fileIDs) {
  const ids = (fileIDs || []).filter(Boolean);
  if (ids.length === 0) return;
  try { await cloud.deleteFile({ fileList: ids }); } catch (e) { console.warn('清理云存储失败', e); }
}

module.exports = { checkText, checkImageByFileId, checkImagesByFileIds, deleteFiles };
```

### 4.2 userManage 接入示例
```javascript
const security = require('./contentSecurity');
async function updateUser(openid, data) {
  // ...原有数据预处理
  if (data.nickName !== undefined) {
    const r = await security.checkText(cloud, openid, data.nickName);
    if (!r.pass) return { code: -1001, message: '内容包含违规信息，请修改后重试' };
  }
  if (data.avatarUrl !== undefined && data.avatarUrl) {
    const r = await security.checkImageByFileId(cloud, data.avatarUrl);
    if (!r.pass) {
      await security.deleteFiles(cloud, [data.avatarUrl]);
      return { code: -1001, message: '内容包含违规信息，请修改后重试' };
    }
  }
  // ...原 update 逻辑
}
```

### 4.3 多字段文本聚合
其他云函数（recordManage 等）将多个文本字段用 `\n` 拼成一段，一次调用 `msgSecCheck`，减少调用次数：

```javascript
const composite = [data.title, data.description, data.abnormalDesc].filter(Boolean).join('\n');
const r = await security.checkText(cloud, openid, composite);
```

### 4.4 前端配合
前端在收到 `code === -1001` 时统一弹 Toast：「内容包含违规信息，请修改后重试」。涉及：
- `login-modal/login-modal.js` confirmLogin
- `pet-edit/pet-edit.js` 提交
- `record-add/record-add.js` 提交
- `place-add/place-add.js` 提交
- `memorial-add/memorial-add.js` 提交 + memorial 页发祝福
- `bill-add/bill-add.js` 提交
- `care-add/care-add.js` 提交
- `visit-add/visit-add.js` 提交

逻辑统一：直接判断 `res.result.code === -1001`，复用现有 `showError` / `wx.showToast`。

### 4.5 package.json 依赖
云函数 openapi 需要在 cloudfunctions/<name>/`config.json` 中显式声明权限：

```json
{
  "permissions": {
    "openapi": [
      "security.msgSecCheck",
      "security.imgSecCheck"
    ]
  }
}
```

需要为所有改造的云函数补这份 `config.json`。

## 五、边界与异常

- 旧数据兼容：仅在新写入/更新时校验，历史数据不回扫。
- 图片校验失败时删除刚上传的临时云文件，避免脏数据。
- 文本字段为空字符串视为通过。
- msgSecCheck v2 单次最大 2500 字，超出时分段校验；超长场景（祝福语 100 字、备注一般短）实际不会触发。
- imgSecCheck 仅支持 png/jpg/jpeg，体积 ≤ 1MB，前端已有 500KB 限制满足。
- openapi 偶发失败按"放行 + 日志"，避免审核期外的可用性事故；命中违规（错误码 87014）严格拒绝。

## 六、产出

- 每个云函数：新增 `contentSecurity.js` + `config.json`；`index.js` 在写入前插桩校验。
- 前端：受影响页面对 `-1001` 错误码统一提示。
- 文档：本 `doc.md` + `tasks.md`，便于审核 review。
