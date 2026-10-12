/**
 * util.js —— 控制台通用工具
 * 提供水质指标元数据、格式化函数、状态判定、DOM 构建与 SVG 图表生成，
 * 供各功能视图复用（阈值定义与服务端 config.js 保持一致）。
 */

// 水质指标定义（与服务端 config.js 保持一致）
export const METRICS = {
  chlorine: { name: '余氯', unit: 'mg/L', safeMin: 0, safeMax: 0.2, warnMin: 0.2, warnMax: 0.3 },
  hardness: { name: '硬度', unit: 'mg/L', safeMin: 0, safeMax: 300, warnMin: 300, warnMax: 450 },
  ph: { name: 'pH', unit: '', safeMin: 6.5, safeMax: 8.5, warnMin: 6.0, warnMax: 9.0 },
  turbidity: { name: '浊度', unit: 'NTU', safeMin: 0, safeMax: 1, warnMin: 1, warnMax: 3 },
  temp: { name: '温度', unit: '℃', safeMin: 10, safeMax: 30, warnMin: 5, warnMax: 35 },
  heavyMetal: { name: '重金属', unit: 'ppb', safeMin: 0, safeMax: 10, warnMin: 10, warnMax: 30 },
};

export const METRIC_ORDER = ['chlorine', 'hardness', 'ph', 'turbidity', 'temp', 'heavyMetal'];

export const LINKAGE_DEVICE_TYPES = ['家用净水器', '软水机', '智能水龙头', '全屋净水系统'];

export const PROFILE_OPTIONS = {
  skin: ['中性', '干性', '油性', '敏感肌', '屏障受损'],
  scalp: ['正常', '干枯', '出油', '头皮瘙痒', '分叉'],
  sensitivity: ['无特殊', '皮肤敏感', '呼吸道敏感', '肠胃敏感'],
  family: ['成年人', '婴幼儿', '老年人', '孕妇', '敏感体质成员'],
};

const pad = (n) => String(n).padStart(2, '0');

/** 数值格式化：保留精度并去除尾随零。 */
export function formatNumber(value, precision = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return Number(value).toFixed(precision).replace(/\.?0+$/, '') || '0';
}

/** 带单位显示数值。 */
export function formatValue(value, unit = '', precision = 2) {
  const num = formatNumber(value, precision);
  return unit ? `${num} ${unit}` : num;
}

/** 日期时间格式化。 */
export function formatDateTime(value) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 时间格式化 HH:mm。 */
export function formatTime(value) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 短日期格式化 MM-DD。 */
export function formatShortDate(value) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 单指标状态判定（与告警引擎一致）。 */
export function statusOf(metricKey, value) {
  const m = METRICS[metricKey];
  if (!m || value === null || value === undefined) return 'normal';
  if (value < m.safeMin || value > m.safeMax) {
    return (value < m.warnMin || value > m.warnMax) ? 'danger' : 'warn';
  }
  return 'normal';
}

/** 状态颜色。 */
export function statusColor(status) {
  if (status === 'danger') return '#e53935';
  if (status === 'warn') return '#fb8c00';
  return '#2e7d32';
}

/** 状态中文标签。 */
export function statusLabel(status) {
  if (status === 'danger') return '超标';
  if (status === 'warn') return '偏高';
  return '正常';
}

/** 状态徽标 HTML。 */
export function statusBadge(status) {
  const cls = status === 'danger' ? 'danger' : status === 'warn' ? 'warn' : 'normal';
  return `<span class="badge ${cls}">${statusLabel(status)}</span>`;
}

/** 创建 DOM 元素。 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

/**
 * SVG 折线图生成。
 * @param {string[]} labels 横轴标签
 * @param {number[]} values 数值
 * @param {object} opts { width, height, color, unit, yMin, yMax }
 * @returns {string} SVG 字符串
 */
export function lineChart(labels, values, opts = {}) {
  const width = opts.width || 600;
  const height = opts.height || 260;
  const color = opts.color || '#9898f0';
  const unit = opts.unit || '';
  const padL = 46;
  const padR = 16;
  const padT = 16;
  const padB = 26;

  if (!values || values.length === 0) {
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#aaa" font-size="13">暂无数据</text></svg>`;
  }

  const nums = values.map(Number);
  let min = opts.yMin !== undefined ? opts.yMin : Math.min(...nums);
  let max = opts.yMax !== undefined ? opts.yMax : Math.max(...nums);
  if (max - min < 1e-9) { max += 1; min -= 1; }
  const span = max - min;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const x = (i) => padL + (nums.length === 1 ? plotW / 2 : (i / (nums.length - 1)) * plotW);
  const y = (v) => padT + (1 - (v - min) / span) * plotH;

  // 网格线 + Y 轴刻度
  let grid = '';
  let yTicks = '';
  const rows = 4;
  for (let i = 0; i <= rows; i++) {
    const v = min + (span * i) / rows;
    const yy = y(v);
    grid += `<line x1="${padL}" y1="${yy}" x2="${width - padR}" y2="${yy}" stroke="#eceaf6"/>`;
    yTicks += `<text x="${padL - 8}" y="${yy + 4}" text-anchor="end" fill="#9aa0b0" font-size="11">${formatNumber(v, 1)}</text>`;
  }

  // 折线与面积
  const pts = nums.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${x(0).toFixed(1)},${(padT + plotH).toFixed(1)} ${pts} ${x(nums.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)}`;

  // X 轴标签（稀疏）
  let xLabels = '';
  const step = Math.max(1, Math.ceil(labels.length / 7));
  labels.forEach((lb, i) => {
    if (i % step === 0 || i === labels.length - 1) {
      xLabels += `<text x="${x(i)}" y="${height - 8}" text-anchor="middle" fill="#9aa0b0" font-size="11">${lb}</text>`;
    }
  });

  const last = nums[nums.length - 1];
  const label = `${formatNumber(last)} ${unit}`;

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">` +
    grid + yTicks + xLabels +
    `<polygon points="${area}" fill="${color}" opacity="0.12"/>` +
    `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/>` +
    `<circle cx="${x(nums.length - 1)}" cy="${y(last)}" r="4" fill="${color}"/>` +
    `<text x="${x(nums.length - 1) - 6}" y="${Math.max(12, y(last) - 10)}" text-anchor="end" fill="${color}" font-size="12" font-weight="600">${label}</text>` +
    `</svg>`;
}

/** 评分环形图生成。 */
export function scoreRing(score, level) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const color = level === 'danger' ? '#e53935' : level === 'warn' ? '#fb8c00' : '#43a047';
  const off = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return `<svg viewBox="0 0 140 140" width="140" height="140">` +
    `<circle cx="70" cy="70" r="${r}" fill="none" stroke="#eceaf6" stroke-width="12"/>` +
    `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="12" ` +
    `stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 70 70)"/>` +
    `<text x="70" y="66" text-anchor="middle" fill="${color}" font-size="30" font-weight="700">${score}</text>` +
    `<text x="70" y="88" text-anchor="middle" fill="#9aa0b0" font-size="12">水质评分</text></svg>`;
}
