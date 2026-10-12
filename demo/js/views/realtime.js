/**
 * realtime.js —— 实时监测
 * 实时展示六项水质指标的当前读数、安全区间与达标状态，
 * 数据源每次刷新时通过 store.subscribe 自动更新。
 */

import { METRICS, METRIC_ORDER } from '../config.js';
import { statusColor, statusLabel } from '../engine/alertEngine.js';
import { formatValue, formatDateTime } from '../utils/format.js';

/**
 * 渲染实时监测页。
 */
export function render(container, store) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title">
        实时数据
        <span class="badge gray" id="rt-time">--</span>
      </div>
      <div class="list" id="rt-list"></div>
    </div>
    <div class="card">
      <div class="card-title">说明</div>
      <div class="list">
        <div class="list-item"><div class="li-icon" style="display:flex;align-items:center;justify-content:center;"><span style="width:14px;height:14px;border-radius:50%;background:#2e7d32;display:block;"></span></div><div class="li-body"><div class="li-title">正常</div><div class="li-sub">指标处于安全区间</div></div></div>
        <div class="list-item"><div class="li-icon" style="display:flex;align-items:center;justify-content:center;"><span style="width:14px;height:14px;border-radius:50%;background:#fb8c00;display:block;"></span></div><div class="li-body"><div class="li-title">偏高</div><div class="li-sub">接近或略超安全阈值</div></div></div>
        <div class="list-item"><div class="li-icon" style="display:flex;align-items:center;justify-content:center;"><span style="width:14px;height:14px;border-radius:50%;background:#e53935;display:block;"></span></div><div class="li-body"><div class="li-title">超标</div><div class="li-sub">超出预警阈值，需立即处理</div></div></div>
      </div>
    </div>
  `;

  paint(container, store);
  store.subscribe(() => paint(container, store));
}

/**
 * 更新实时数据列表。
 */
function paint(container, store) {
  const reading = store.current;
  const analysis = store.analysis;
  if (!reading || !analysis) return;

  container.querySelector('#rt-time').textContent = formatDateTime(reading.time);

  const list = container.querySelector('#rt-list');
  list.innerHTML = '';
  for (const key of METRIC_ORDER) {
    const m = METRICS[key];
    const value = reading.metrics[key];
    const status = analysis.statuses[key];
    const item = document.createElement('div');
    item.className = 'list-item';
    const rangeText = (m.safeMin === 0)
      ? `≤ ${m.safeMax} ${m.unit}`.trim()
      : `${m.safeMin} ~ ${m.safeMax} ${m.unit}`.trim();
    item.innerHTML = `
      <div class="li-icon" style="display:flex;align-items:center;justify-content:center;"><span style="width:14px;height:14px;border-radius:50%;background:${statusColor(status)};display:block;"></span></div>
      <div class="li-body">
        <div class="li-title">${m.name}</div>
        <div class="li-sub">安全区间 ${rangeText}</div>
      </div>
      <div class="li-right">
        <div class="li-main">${formatValue(value, m.unit, m.precision)}</div>
        <span class="badge ${status}" style="color:${statusColor(status)}">${statusLabel(status)}</span>
      </div>
    `;
    list.appendChild(item);
  }
}
