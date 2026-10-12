/**
 * chart.js —— 轻量 SVG 图表工具
 * 不依赖任何第三方图表库，自绘折线图与环形仪表盘，离线可用、代码原创。
 */

/**
 * 绘制折线图。
 * @param {HTMLElement} container 容器元素
 * @param {Object} opts 配置
 *   opts.labels  : string[]  横轴标签
 *   opts.series  : { name, color, data: number[] }[] 数据系列
 *   opts.unit    : string    纵轴单位（可选）
 *   opts.height  : number    高度（像素，默认 220）
 *   opts.min / opts.max : 纵轴范围（可选，缺省自动计算）
 */
export function lineChart(container, opts) {
  const labels = opts.labels || [];
  const series = opts.series || [];
  const height = opts.height || 220;
  const width = 720; // viewBox 逻辑宽度，随容器缩放
  const padL = 46;   // 左侧留白（纵轴刻度）
  const padR = 16;
  const padT = 20;
  const padB = 30;   // 底部留白（横轴标签）

  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // 计算纵轴范围
  let min = opts.min !== undefined ? opts.min : Infinity;
  let max = opts.max !== undefined ? opts.max : -Infinity;
  if (opts.min === undefined || opts.max === undefined) {
    for (const s of series) {
      for (const v of s.data) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
  }
  if (!isFinite(min)) min = 0;
  if (!isFinite(max)) max = 1;
  if (min === max) { max = min + 1; min = min - 1; }
  const range = max - min;

  const xFor = (i) => (labels.length <= 1 ? padL + plotW / 2 : padL + (plotW * i) / (labels.length - 1));
  const yFor = (v) => padT + plotH - ((v - min) / range) * plotH;

  const parts = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;">`);

  // 水平网格线与纵轴刻度（5 条）
  const ticks = 5;
  for (let t = 0; t <= ticks; t++) {
    const v = min + (range * t) / ticks;
    const y = yFor(v);
    parts.push(`<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#e8eef5" stroke-width="1"/>`);
    parts.push(`<text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#9aa7b5">${fmt(v)}</text>`);
  }

  // 横轴标签（最多显示 8 个，避免重叠）
  const step = Math.max(1, Math.ceil(labels.length / 8));
  for (let i = 0; i < labels.length; i += step) {
    const x = xFor(i);
    parts.push(`<text x="${x}" y="${height - 10}" text-anchor="middle" font-size="11" fill="#9aa7b5">${labels[i]}</text>`);
  }

  // 数据折线与数据点
  for (const s of series) {
    if (!s.data || s.data.length === 0) continue;
    const points = s.data.map((v, i) => `${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ');
    parts.push(`<polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`);
    if (s.data.length <= 30) {
      for (let i = 0; i < s.data.length; i++) {
        parts.push(`<circle cx="${xFor(i).toFixed(1)}" cy="${yFor(s.data[i]).toFixed(1)}" r="3" fill="${s.color}"/>`);
      }
    }
  }

  // 图例
  let legendY = 12;
  for (const s of series) {
    parts.push(`<line x1="${padL}" y1="${legendY}" x2="${padL + 18}" y2="${legendY}" stroke="${s.color}" stroke-width="3"/>`);
    parts.push(`<text x="${padL + 24}" y="${legendY + 4}" font-size="11" fill="#5b6b7b">${s.name}</text>`);
    legendY += 16;
  }

  parts.push('</svg>');
  container.innerHTML = parts.join('');

  function fmt(v) {
    const abs = Math.abs(v);
    if (abs >= 1000) return Math.round(v).toString();
    if (abs >= 100) return v.toFixed(0);
    if (abs >= 10) return v.toFixed(1);
    return v.toFixed(1);
  }
}

/**
 * 绘制环形仪表盘（用于综合水质评分）。
 * @param {HTMLElement} container 容器元素
 * @param {Object} opts { value: number, max: number, label: string, color: string, unit: string }
 */
export function ringGauge(container, opts) {
  const { value = 0, max = 100, label = '综合评分', color = '#2e7d32', unit = '分' } = opts;
  const size = 160;
  const r = 62;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(1, value / max));
  const dash = circumference * ratio;

  container.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e8eef5" stroke-width="14"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="14"
              stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${circumference.toFixed(1)}"
              transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="34" font-weight="bold" fill="${color}">${Math.round(value)}</text>
      <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="13" fill="#9aa7b5">${unit}</text>
    </svg>
    <div style="text-align:center;font-size:14px;color:#5b6b7b;margin-top:6px;">${label}</div>
  `;
}

/**
 * 绘制迷你柱状图（用于历史汇总等场景）。
 */
export function barChart(container, opts) {
  const labels = opts.labels || [];
  const data = opts.data || [];
  const color = opts.color || '#4caf50';
  const height = opts.height || 120;
  const width = 480;
  const padB = 24;
  const padT = 12;
  const max = Math.max(...data, 1);

  const barW = (width / data.length) * 0.6;
  const gap = width / data.length;
  const plotH = height - padB - padT;

  const parts = [`<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;">`];
  data.forEach((v, i) => {
    const h = (v / max) * plotH;
    const x = i * gap + (gap - barW) / 2;
    const y = padT + plotH - h;
    parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${color}" opacity="0.85"/>`);
    parts.push(`<text x="${(i * gap + gap / 2).toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="10" fill="#9aa7b5">${labels[i]}</text>`);
  });
  parts.push('</svg>');
  container.innerHTML = parts.join('');
}
