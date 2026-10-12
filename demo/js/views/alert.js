/**
 * alert.js —— 异常预警记录
 * 展示累积的预警事件（饮用水高风险 / 生活用水提示），
 * 包含指标、数值、等级、建议与触发时间，支持清空记录。
 */

import { formatValue, formatDateTime } from '../utils/format.js';
import { ALERT_LEVELS } from '../config.js';
import { iconBadge } from '../utils/icons.js';

/**
 * 渲染预警记录页。
 */
export function render(container, store) {
  const alerts = store.alerts || [];

  container.innerHTML = `
    <div class="card">
      <div class="card-title">
        预警记录（${alerts.length}）
        <button class="btn sm danger" id="clear-alerts" ${alerts.length ? '' : 'disabled'}>清空</button>
      </div>
      <div id="alert-list"></div>
    </div>
  `;

  const list = container.querySelector('#alert-list');

  function paintList() {
    if (!alerts.length) {
      list.innerHTML = `<div class="empty"><span class="empty-icon">${iconBadge('check')}</span>暂无预警记录，水质状况良好</div>`;
      return;
    }
    list.innerHTML = '';
    for (const a of alerts) {
      const levelInfo = ALERT_LEVELS[a.level] || { label: '提示', color: '#9a9db8' };
      const item = document.createElement('div');
      item.className = 'alert-item';
      item.innerHTML = `
        <div class="al-head">
          <span class="al-name">${a.metricName} · ${formatValue(a.value, a.unit)}</span>
          <span class="badge" style="color:${levelInfo.color};background:${levelInfo.color}18;">${levelInfo.label}</span>
        </div>
        <div class="al-advice">${a.advice}</div>
        <div class="al-time">${formatDateTime(a.time)}</div>
      `;
      list.appendChild(item);
    }
  }

  container.querySelector('#clear-alerts').addEventListener('click', () => {
    store.alerts.length = 0;
    paintList();
    store.toast('已清空预警记录');
  });

  paintList();
}
