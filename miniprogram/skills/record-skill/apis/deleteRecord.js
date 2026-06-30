const { bizErrorResult } = require('./_resolvePet');

async function deleteRecord(params) {
  try {
    const { recordId } = params || {};
    if (!recordId) return bizErrorResult('缺少 recordId');

    const res = await wx.cloud.callFunction({
      name: 'recordManage',
      data: { action: 'delete', data: { _id: recordId } }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizErrorResult(r.message || '删除失败');

    return {
      isError: false,
      content: [{ type: 'text', text: '已删除该记录' }],
      structuredContent: { _id: recordId, deleted: true }
    };
  } catch (e) {
    return bizErrorResult('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

module.exports = deleteRecord;
