/**
 * history.js —— 历史数据与趋势
 * 支持切换指标（余氯 / 硬度 / pH / 浊度 / 温度 / 重金属）与时间范围（日 / 周 / 月），
 * 使用自绘折线图展示水质变化趋势。
 */

import { METRICS, METRIC_ORDER, HISTORY_RANGES } from '../config.js';
import { rangeLabel } from '../utils/format.js';
import { lineChart } from '../utils/chart.js';

/**
 * 渲染历史趋势页。
 */
export function render(container, store) {
  let metricKey = METRIC_ORDER[0];
  let range = 'day';

  container.innerHTML = `
    <div class="card">
      <div class="seg" id="range-seg">
        ${HISTORY_RANGES.map((r) => `<div class="seg-item" data-range="${r}">${rangeLabel(r)}</div>`).join('')}
      </div>
      <div class="seg" id="metric-seg" style="flex-wrap:wrap;">
        ${METRIC_ORDER.map((k) => `<div class="seg-item" data-metric="${k}">${METRICS[k].name}</div>`).join('')}
      </div>
      <div class="chart-box" id="history-chart"></div>
    </div>
    <div class="card">
      <div class="card-title">趋势解读</div>
      <p class="report-text" id="history-note">正在生成…</p>
    </div>
  `;

  const rangeSeg = container.querySelector('#range-seg');
  const metricSeg = container.querySelector('#metric-seg');

  function refreshSeg() {
    rangeSeg.querySelectorAll('.seg-item').forEach((el) => el.classList.toggle('active', el.dataset.range === range));
    metricSeg.querySelectorAll('.seg-item').forEach((el) => el.classList.toggle('active', el.dataset.metric === metricKey));
  }

  rangeSeg.addEventListener('click', (e) => {
    const item = e.target.closest('.seg-item');
    if (!item) return;
    range = item.dataset.range;
    refreshSeg();
    draw();
  });

  metricSeg.addEventListener('click', (e) => {
    const item = e.target.closest('.seg-item');
    if (!item) return;
    metricKey = item.dataset.metric;
    refreshSeg();
    draw();
  });

  async function draw() {
    const m = METRICS[metricKey];
    const data = await Promise.resolve(store.dataSource.getHistory(range, metricKey));
    const color = '#9898f0';
    lineChart(container.querySelector('#history-chart'), {
      labels: data.labels || [],
      series: [{ name: `${m.name} (${m.unit || '无单位'})`, color, data: data.values || [] }],
      unit: m.unit,
      height: 220,
    });

    // 趋势解读：与安全区间对比
    const values = data.values || [];
    const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    let note;
    if (avg < m.safeMin || avg > m.safeMax) {
      note = `${rangeLabel(range)}${m.name}平均值为 ${avg.toFixed(m.precision)}，超出安全区间（${m.safeMin} ~ ${m.safeMax}），建议关注并采取相应处理措施。`;
    } else {
      note = `${rangeLabel(range)}${m.name}平均值为 ${avg.toFixed(m.precision)}，处于安全区间（${m.safeMin} ~ ${m.safeMax}），水质状况良好。`;
    }
    container.querySelector('#history-note').textContent = note;
  }

  refreshSeg();
  draw();
}
