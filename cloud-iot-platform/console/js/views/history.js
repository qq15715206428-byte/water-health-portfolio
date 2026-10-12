/**
 * history.js —— 历史趋势视图
 * 按指标与时间范围（日/周/月）展示水质历史曲线。
 */
import { api } from '../api.js';
import { METRICS, METRIC_ORDER, lineChart, formatValue } from '../util.js';

const LOADING = '<div class="empty"><div class="icon">⏳</div>加载中…</div>';

const RANGES = [
  { key: 'day', label: '今日' },
  { key: 'week', label: '近一周' },
  { key: 'month', label: '近一月' },
];

const COLORS = ['#5b8def', '#9898f0', '#f898b0', '#43a047', '#fb8c00', '#e53935'];

export const history = {
  key: 'history',
  title: '历史趋势',
  icon: '📊',

  async render(container) {
    let metric = METRIC_ORDER[0];
    let range = 'day';

    async function load() {
      container.innerHTML = LOADING;
      try {
        const m = METRICS[metric];
        const d = await api.history(range, metric);
        const latest = d.values && d.values.length ? d.values[d.values.length - 1] : null;
        container.innerHTML = `
          <div class="page-head">
            <div><h2>历史趋势</h2><div class="desc">水质时序数据汇聚与可视化</div></div>
            <div class="seg">
              ${RANGES.map((r) => `<span class="seg-item ${r.key === range ? 'active' : ''}" data-range="${r.key}">${r.label}</span>`).join('')}
            </div>
          </div>
          <div class="card" style="margin-bottom:16px">
            ${METRIC_ORDER.map((k) => `<span class="chip ${k === metric ? 'active' : ''}" data-metric="${k}">${METRICS[k].name}</span>`).join('')}
          </div>
          <div class="card">
            <div class="card-title">
              <span class="icon">📈</span>${m.name} 历史曲线
              ${latest !== null ? `<span class="badge gray">最新 ${formatValue(latest, m.unit, 1)}</span>` : ''}
            </div>
            <div class="chart">${lineChart(d.labels, d.values, { color: COLORS[METRIC_ORDER.indexOf(metric)], unit: m.unit })}</div>
          </div>`;

        container.querySelectorAll('[data-range]').forEach((s) => {
          s.addEventListener('click', () => { range = s.dataset.range; load(); });
        });
        container.querySelectorAll('[data-metric]').forEach((s) => {
          s.addEventListener('click', () => { metric = s.dataset.metric; load(); });
        });
      } catch (e) {
        container.innerHTML = `<div class="empty"><div class="icon">⚠</div>加载失败：${e.message}</div>`;
      }
    }

    await load();
  },
};
