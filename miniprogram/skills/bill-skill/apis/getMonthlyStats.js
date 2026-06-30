const { resolvePet, bizErrorResult } = require('./_resolvePet');

async function getMonthlyStats(params) {
  try {
    const { petName, year, month, trend } = params || {};
    const { petId, petName: resolvedName } = await resolvePet(petName);

    const now = new Date();
    const y = year || now.getFullYear();
    const m = month || (now.getMonth() + 1);

    const res = await wx.cloud.callFunction({
      name: 'billManage',
      data: { action: 'stats', data: { petId, year: y, month: m, trend: !!trend } }
    });
    const r = res.result || {};
    if (r.code !== 0) return bizErrorResult(r.message || '查询失败');

    const monthTotal = (r.data && r.data.monthTotal) || 0;
    const lastMonthTotal = (r.data && r.data.lastMonthTotal) || 0;
    const categoryStats = (r.data && r.data.categoryStats) || [];
    const trends = (r.data && r.data.trends) || [];

    let diffText = '';
    if (lastMonthTotal > 0) {
      const ratio = ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      diffText = `，环比上月${monthTotal >= lastMonthTotal ? '增加' : '减少'} ${Math.abs(ratio).toFixed(0)}%`;
    }
    const text = `${resolvedName} ${y}/${m} 共消费 ¥${monthTotal}${diffText}`;

    return {
      isError: false,
      content: [{ type: 'text', text }],
      structuredContent: {
        petName: resolvedName,
        year: y,
        month: m,
        monthTotal,
        lastMonthTotal,
        categoryStats,
        trends
      }
    };
  } catch (e) {
    if (e && e.__skillBiz) return bizErrorResult(e.message);
    return bizErrorResult('系统异常：' + (e && e.message ? e.message : 'unknown'));
  }
}

module.exports = getMonthlyStats;
