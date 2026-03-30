/**
 * 日期格式化
 * @param {Date|string|number} date 日期对象、时间戳或日期字符串
 * @param {string} fmt 格式模板，默认 'YYYY-MM-DD'
 * @returns {string}
 */
const formatDate = (date, fmt = 'YYYY-MM-DD') => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const map = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0')
  };

  let result = fmt;
  Object.keys(map).forEach(key => {
    result = result.replace(key, map[key]);
  });
  return result;
};

/**
 * 计算两个日期之间的天数差
 * @param {Date|string} date1 起始日期
 * @param {Date|string} date2 结束日期，默认今天
 * @returns {number}
 */
const daysBetween = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * 防抖函数
 * @param {Function} fn 目标函数
 * @param {number} delay 延迟毫秒数，默认 300
 * @returns {Function}
 */
const debounce = (fn, delay = 300) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
};

/**
 * 节流函数
 * @param {Function} fn 目标函数
 * @param {number} interval 间隔毫秒数，默认 300
 * @returns {Function}
 */
const throttle = (fn, interval = 300) => {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
};

/**
 * 金额格式化（保留两位小数）
 * @param {number} amount
 * @returns {string}
 */
const formatMoney = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
  return amount.toFixed(2);
};

/**
 * 计算年龄（返回"x岁x月"）
 * @param {Date|string} birthday
 * @returns {string}
 */
const calcAge = (birthday) => {
  if (!birthday) return '';
  let birth;
  // 字符串日期（如 "2020-01-15"）按本地时间解析，避免 UTC 时区偏移
  if (typeof birthday === 'string' && /^\d{4}-\d{2}-\d{2}/.test(birthday)) {
    const parts = birthday.split('-');
    // parseInt 兼容 ISO 字符串末尾的 "T..." 部分，如 "15T00:00:00.000Z" → 15
    birth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  } else {
    birth = new Date(birthday);
  }
  if (isNaN(birth.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0) {
    return months > 0 ? `${years}岁${months}月` : `${years}岁`;
  }
  return months > 0 ? `${months}个月` : '不到1个月';
};

/**
 * 生成唯一ID
 * @returns {string}
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

/**
 * 显示加载提示
 * @param {string} title
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({ title, mask: true });
};

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading();
};

/**
 * 显示成功提示
 * @param {string} title
 */
const showSuccess = (title = '操作成功') => {
  wx.showToast({ title, icon: 'success', duration: 1500 });
};

/**
 * 显示错误提示
 * @param {string} title
 */
const showError = (title = '操作失败') => {
  wx.showToast({ title, icon: 'none', duration: 2000 });
};

module.exports = {
  formatDate,
  daysBetween,
  debounce,
  throttle,
  formatMoney,
  calcAge,
  generateId,
  showLoading,
  hideLoading,
  showSuccess,
  showError
};