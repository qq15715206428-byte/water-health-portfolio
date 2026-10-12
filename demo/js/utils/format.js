/**
 * format.js —— 通用格式化工具
 * 提供数值、日期、时间与单位相关的格式化函数，供各视图复用。
 */

/**
 * 数值格式化：按指定精度保留小数，去除多余的尾随零。
 * @param {number} value 数值
 * @param {number} precision 小数位数
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(value, precision = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  return Number(value).toFixed(precision).replace(/\.?0+$/, '') || '0';
}

/**
 * 带单位显示数值。
 * @param {number} value 数值
 * @param {string} unit 单位
 * @param {number} precision 小数位数
 */
export function formatValue(value, unit = '', precision = 2) {
  const num = formatNumber(value, precision);
  return unit ? `${num} ${unit}` : num;
}

/**
 * 日期格式化：Date 对象 -> YYYY-MM-DD HH:mm:ss。
 */
export function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '--';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 时间格式化：HH:mm（用于图表横轴）。
 */
export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '--';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 短日期格式化：MM-DD（用于图表横轴）。
 */
export function formatShortDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '--';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 历史范围标题（日/周/月 -> 中文）。
 */
export function rangeLabel(range) {
  const map = { day: '今日', week: '近一周', month: '近一月' };
  return map[range] || range;
}

/**
 * 生成全局唯一标识（模拟数据用）。
 */
export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}
