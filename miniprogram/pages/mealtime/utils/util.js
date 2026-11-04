// utils/util.js
// 格式化日期 YYYY-MM-DD HH:mm
function formatTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const p = n => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const p = n => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 约饭状态文案
const MEAL_STATUS = { 0: '点菜中', 1: '已下单', 2: '已完成' };

// 生成约饭单号 #YYYYMMDD-xx
function genMealNo(date, seq) {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : (date || new Date());
  const p = n => (n < 10 ? '0' + n : '' + n);
  const ymd = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  return `#${ymd}-${p(seq || 1)}`;
}

module.exports = { formatTime, formatDate, MEAL_STATUS, genMealNo };
