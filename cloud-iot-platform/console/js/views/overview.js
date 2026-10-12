/**
 * overview.js —— 总览大屏视图
 * 展示设备接入、在线状态、联动与预警统计，以及当前综合水质评分与指标状态。
 */
import { api } from '../api.js';
import { METRICS, METRIC_ORDER, formatValue, statusBadge, scoreRing, formatDateTime } from '../util.js';

const LOADING = '<div class="empty"><div class="icon">⏳</div>加载中…</div>';

function statCard(icon, value, label, bg) {
  return `
    <div class="card" style="margin-bottom:0">
      <div class="stat-card">
        <div class="stat-icon" style="background:${bg}">${icon}</div>
        <div>
          <div class="stat-value">${value}</div>
          <div class="stat-label">${label}</div>
        </div>
      </div>
    </div>`;
}

function metricCard(key, value, status) {
  const m = METRICS[key];
  return `
    <div class="metric-card">
      <div class="m-head"><span class="m-name">${m.name}</span>${statusBadge(status)}</div>
      <div class="m-value">${formatValue(value, '', m.unit === '' ? 2 : (key === 'hardness' ? 0 : (key === 'temp' ? 1 : 2)))}<span class="m-unit">${m.unit ? ' ' + m.unit : ''}</span></div>
      <div class="m-range">安全范围 ${m.safeMin}${m.unit ? ' ' + m.unit : ''} ~ ${m.safeMax}${m.unit ? ' ' + m.unit : ''}</div>
    </div>`;
}

export const overview = {
  key: 'overview',
  title: '总览大屏',
  icon: '🖥',

  async render(container) {
    container.innerHTML = LOADING;
    try {
      const d = await api.overview();
      const metrics = d.current.metrics || {};
      const statuses = d.statuses || {};
      const levelLabel = d.level === 'danger' ? '饮用水高风险' : d.level === 'warn' ? '生活用水提示' : '水质良好';

      const stats = `
        <div class="grid cols-4">
          ${statCard('📡', d.deviceCount, '监测终端总数', '#e8f0fe')}
          ${statCard('🟢', d.onlineCount, '在线设备', '#e8f5e9')}
          ${statCard('🔗', d.linkageCount, '联动设备', '#f0edfe')}
          ${statCard('⚠', d.alertCount, '预警记录', '#fff3e0')}
        </div>`;

      const metricGrid = `
        <div class="metric-grid">
          ${METRIC_ORDER.map((k) => metricCard(k, metrics[k], statuses[k] || 'normal')).join('')}
        </div>`;

      const timeStr = d.current.time ? formatDateTime(d.current.time) : '--';

      container.innerHTML = `
        <div class="page-head">
          <div><h2>平台总览</h2><div class="desc">设备接入 · 数据汇聚 · 健康分析 · 预警推送</div></div>
          <span class="badge gray">最近上报 ${timeStr}</span>
        </div>
        ${stats}
        <div class="grid cols-2">
          <div class="card" style="display:flex;align-items:center;gap:24px">
            ${scoreRing(d.score, d.level)}
            <div>
              <div style="font-size:16px;font-weight:600;margin-bottom:6px">综合水质评分</div>
              <div style="font-size:14px;color:#5b6b7b">${levelLabel}</div>
              <div style="font-size:12px;color:#9aa0b0;margin-top:6px">评分基于 6 项水质指标的三档阈值判定综合得出</div>
            </div>
          </div>
          <div class="card">
            <div class="card-title"><span class="icon">🧪</span>实时水质指标</div>
            ${metricGrid}
          </div>
        </div>
        <div class="card">
          <div class="card-title"><span class="icon">📊</span>平台能力说明</div>
          <div class="overview-text">
            本平台作为家庭水质健康物联网的云端核心，向上汇聚感知终端层上报的水质数据，向下为移动应用端提供实时监测、
            异常预警与个性化健康分析服务。平台通过 MQTT 协议接入监测终端，经三档阈值判定引擎识别水质异常，
            联动净水器、软水机等设备自动处置，并以 REST API 向移动应用端开放数据与健康建议，实现"监测—预警—处理"的闭环管理。
          </div>
        </div>`;
    } catch (e) {
      container.innerHTML = `<div class="empty"><div class="icon">⚠</div>加载失败：${e.message}</div>`;
    }
  },
};
