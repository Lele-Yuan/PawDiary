// 内容安全校验工具：封装 msgSecCheck (v2) 与 imgSecCheck
// 使用方式：在云函数中 require('./contentSecurity')，传入 wx-server-sdk 的 cloud 实例
//
// 设计原则：
// - 命中违规（errCode === 87014）严格拒绝
// - openapi 偶发失败（限流/超时等）放行 + 打日志，避免可用性事故
// - 文本字段拼接后一次性校验，节约调用次数

var TEXT_MAX = 2500;

function isViolation(err) {
  if (!err) return false;
  var code = err.errCode || err.errcode;
  if (code === 87014) return true;
  var msg = String(err && err.errMsg || err);
  return /87014/.test(msg) || /risky content/i.test(msg);
}

async function checkText(cloud, openid, content) {
  if (!content) return { pass: true };
  var text = String(content).trim();
  if (!text) return { pass: true };
  if (text.length > TEXT_MAX) text = text.slice(0, TEXT_MAX);
  try {
    await cloud.openapi.security.msgSecCheck({
      version: 2,
      scene: 2,
      openid: openid,
      content: text
    });
    return { pass: true };
  } catch (err) {
    if (isViolation(err)) {
      return { pass: false, reason: '文本含违规内容' };
    }
    console.warn('[contentSecurity] msgSecCheck 异常，放行：', err && err.errMsg || err);
    return { pass: true };
  }
}

async function checkImageByFileId(cloud, fileID) {
  if (!fileID) return { pass: true };
  // 仅校验云存储 fileID（cloud://...），http 直链跳过
  if (typeof fileID !== 'string' || fileID.indexOf('cloud://') !== 0) {
    return { pass: true };
  }
  try {
    var dl = await cloud.downloadFile({ fileID: fileID });
    if (!dl || !dl.fileContent) return { pass: true };
    await cloud.openapi.security.imgSecCheck({
      media: { contentType: 'image/jpeg', value: dl.fileContent }
    });
    return { pass: true };
  } catch (err) {
    if (isViolation(err)) {
      return { pass: false, reason: '图片含违规内容' };
    }
    console.warn('[contentSecurity] imgSecCheck 异常，放行：', err && err.errMsg || err);
    return { pass: true };
  }
}

async function checkImagesByFileIds(cloud, fileIDs) {
  if (!Array.isArray(fileIDs) || fileIDs.length === 0) return { pass: true };
  for (var i = 0; i < fileIDs.length; i++) {
    var r = await checkImageByFileId(cloud, fileIDs[i]);
    if (!r.pass) return r;
  }
  return { pass: true };
}

async function deleteFiles(cloud, fileIDs) {
  var ids = (fileIDs || []).filter(function (id) {
    return typeof id === 'string' && id.indexOf('cloud://') === 0;
  });
  if (ids.length === 0) return;
  try {
    await cloud.deleteFile({ fileList: ids });
  } catch (e) {
    console.warn('[contentSecurity] 清理云存储失败：', e && e.errMsg || e);
  }
}

// 统一的违规返回
function violationResult() {
  return { code: -1001, message: '内容包含违规信息，请修改后重试' };
}

module.exports = {
  checkText: checkText,
  checkImageByFileId: checkImageByFileId,
  checkImagesByFileIds: checkImagesByFileIds,
  deleteFiles: deleteFiles,
  violationResult: violationResult
};
