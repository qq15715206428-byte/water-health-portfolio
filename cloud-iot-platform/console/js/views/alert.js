/**
 * alert.js —— 异常预警视图
 * 展示分级预警记录（饮用水高风险 / 生活用水提示），支持清空。
 */
import { api } from '../api.js';
import { formatDateTime } from '../util.js';

const LOADING = '<div class="empty"><div class="icon">⏳</div>加载中…</div>';

function levelBadge(level) {
  return level === 'danger'
    ? '<span class="badge danger">饮用水高风险</span>'
    : '<span class="badge warn">生活用水提示</span>';
}

export const alert = {
  key: 'alert',
  title: '异常预警',
  icon: '⚠️',

  async render(container) {
    container.innerHTML = LOADING;
    await load(container);
  },
};

async function load(container) {
  try {
    const alerts = await api.alerts();
    const dangerCount = alerts.filter((a) => a.level === 'danger').length;
    const warnCount = alerts.filter((a) => a.level === 'warn').length;

    const list = alerts.length
      ? alerts.map((a) => `
        <div class="list-item">
          <div class="li-left">
            <div class="li-icon" style="background:${a.level === 'danger' ? '#fdecea' : '#fff3e0'}">${a.level === 'danger' ? '⛔' : '⚠'}</div>
            <div>
              <div class="li-title">${a.name} ${levelBadge(a.level)}</div>
              <div class="li-sub">${formatDateTime(a.time)} · ${a.metricName} ${a.value}${a.unit ? ' ' + a.unit : ''}</div>
              <div class="li-sub" style="color:#e53935">建议：${a.advice}</div>
            </div>
          </div>
        </div>`).join('')
      : '<div class="empty"><div class="icon">✅</div>暂无预警记录，水质状态良好</div>';

    container.innerHTML = `
      <div class="page-head">
        <div><h2>异常预警</h2><div class="desc">三档阈值判定 · 分级预警 · 联动处置</div></div>
        <button class="btn btn-outline" id="alert-clear">清空全部</button>
      </div>
      <div class="grid cols-3">
        <div class="card" style="margin-bottom:0"><div class="stat-card">
          <div class="stat-icon" style="background:#fdecea">⛔</div>
          <div><div class="stat-value">${dangerCount}</div><div class="stat-label">高风险预警</div></div>
        </div></div>
        <div class="card" style="margin-bottom:0"><div class="stat-card">
          <div class="stat-icon" style="background:#fff3e0">⚠</div>
          <div><div class="stat-value">${warnCount}</div><div class="stat-label">生活用水提示</div></div>
        </div></div>
        <div class="card" style="margin-bottom:0"><div class="stat-card">
          <div class="stat-icon" style="background:#f0edfe">📋</div>
          <div><div class="stat-value">${alerts.length}</div><div class="stat-label">预警记录总数</div></div>
        </div></div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="icon">📋</span>预警记录（${alerts.length} 条）</div>
        ${list}
      </div>`;

    container.querySelector('#alert-clear').addEventListener('click', async () => {
      if (!window.confirm('确认清空全部预警记录？')) return;
      try {
        await api.clearAlerts();
        window.toastMsg('已清空');
        load(container);
      } catch (e) { window.toastMsg(e.message); }
    });
  } catch (e) {
    container.innerHTML = `<div class="empty"><div class="icon">⚠</div>加载失败：${e.message}</div>`;
  }
}
