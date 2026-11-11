// All dependencies stay inside the independent skills subpackage.
function text(value, label, required = false) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || !value.trim() || value.length > 200) {
    throw new Error(`${label}必须是非空文本，请从上游查询结果选择或重新提供。`);
  }
  return value.trim();
}
function limit(value, fallback = 20) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 1 || value > 50) throw new Error('limit 必须为 1 到 50 的整数。');
  return value;
}
function array(value) {
  if (!Array.isArray(value)) throw new Error('接口返回的数据格式异常，请打开业务页面核实。');
  return value;
}
function pick(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('接口返回的数据格式异常，请打开业务页面核实。');
  const result = {};
  keys.forEach(key => {
    if (value[key] !== undefined) result[key] = value[key] instanceof Date ? value[key].toISOString() : value[key];
  });
  return result;
}
async function call(name, action, data = {}) {
  wx.cloud.init({ env: wx.cloud.DYNAMIC_CURRENT_ENV, traceUser: true });
  const response = await wx.cloud.callFunction({ name, data: name === 'mealManage' ? { action, ...data } : { action, data } });
  const result = response && response.result;
  if (!result || result.code !== 0) throw new Error(result && (result.message || result.msg) || '云接口暂不可用，请打开业务页面核实，稍后再试。');
  if (result.data === undefined || result.data === null) throw new Error('接口未返回查询数据，请打开业务页面核实。');
  return result.data;
}
function success(message, data) {
  return { isError: false, content: [{ type: 'text', text: message }], structuredContent: data };
}
function error(message) { return { isError: true, content: [{ type: 'text', text: message }] }; }
function handler(fn) {
  return async params => {
    try {
      if (params !== undefined && (!params || typeof params !== 'object' || Array.isArray(params))) throw new Error('参数必须为对象。');
      return await fn(params || {});
    } catch (e) { return error(e.message || '查询失败，请打开业务页面核实。'); }
  };
}
function page(path, params = {}) {
  const query = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  return `/${path}${query ? '?' + query : ''}`;
}
module.exports = { text, limit, array, pick, call, success, error, handler, page };
