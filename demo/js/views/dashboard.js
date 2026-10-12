/**
 * dashboard.js —— 水质可视化仪表盘
 * 展示综合水质评分（环形仪表盘）与六项指标卡片（红黄绿三档状态），
 * 数据刷新时通过 store.subscribe 实时重绘。
 */

import { METRICS, METRIC_ORDER } from '../config.js';
import { statusColor, statusLabel } from '../engine/alertEngine.js';
import { formatValue, formatDateTime } from '../utils/format.js';
import { ringGauge } from '../utils/chart.js';
import { iconBadge } from '../utils/icons.js';

const LEVEL_TEXT = {
  danger: '饮用水高风险',
  warn: '生活用水提示',
  normal: '水质良好',
};

/**
 * 渲染仪表盘。
 */
export function render(container, store) {
  container.innerHTML = `
    <div class="score-panel" id="score-panel"></div>
    <div class="card">
      <div class="card-title">水质指标 <span class="more" data-go="realtime">实时监测 ›</span></div>
      <div class="metric-grid" id="metric-grid"></div>
    </div>
    <div class="card">
      <div class="card-title">健康服务</div>
      <div class="list">
        <div class="list-item" data-go="plan">
          <div class="li-icon">${iconBadge('heart')}</div>
          <div class="li-body"><div class="li-title">个性化健康方案</div><div class="li-sub">根据水质与健康画像生成建议</div></div>
          <div class="li-right t-green">›</div>
        </div>
        <div class="list-item" data-go="history">
          <div class="li-icon">${iconBadge('trend')}</div>
          <div class="li-body"><div class="li-title">历史趋势</div><div class="li-sub">查看日 / 周 / 月水质变化</div></div>
          <div class="li-right t-green">›</div>
        </div>
        <div class="list-item" data-go="report">
          <div class="li-icon">${iconBadge('file')}</div>
          <div class="li-body"><div class="li-title">健康报告</div><div class="li-sub">汇总生成周报 / 月报</div></div>
          <div class="li-right t-green">›</div>
        </div>
      </div>
    </div>
  `;

  // 卡片跳转
  container.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => store.push(el.dataset.go));
  });

  paint(container, store);

  // 数据刷新时实时重绘（切换视图时由 app.js 清理订阅）
  store.subscribe(() => paint(container, store));
}

/**
 * 根据最新读数重绘评分面板与指标卡片。
 */
function paint(container, store) {
  const reading = store.current;
  const analysis = store.analysis;
  if (!reading || !analysis) return;

  // —— 综合评分面板 ——
  const panel = container.querySelector('#score-panel');
  const level = analysis.level;
  const scoreColor = statusColor(level);
  panel.innerHTML = `
    <div class="score-level" style="background:${scoreColor}">${LEVEL_TEXT[level]}</div>
    <div id="score-gauge"></div>
    <div class="score-hint">更新时间 ${formatDateTime(reading.time)}</div>
  `;
  ringGauge(panel.querySelector('#score-gauge'), {
    value: analysis.score, max: 100, label: '综合水质评分', color: scoreColor, unit: '分',
  });

  // —— 指标卡片 ——
  const grid = container.querySelector('#metric-grid');
  grid.innerHTML = '';
  for (const key of METRIC_ORDER) {
    const m = METRICS[key];
    const value = reading.metrics[key];
    const status = analysis.statuses[key];
    const card = document.createElement('div');
    card.className = `metric-card st-${status}`;
    card.innerHTML = `
      <div class="metric-name">${m.name} (${m.unit || '—'})</div>
      <div class="metric-value">${formatValue(value, '', m.precision)}<span class="unit">${m.unit || ''}</span></div>
      <div class="metric-status" style="color:${statusColor(status)}">${statusLabel(status)}</div>
    `;
    card.addEventListener('click', () => store.push('history'));
    grid.appendChild(card);
  }
}
