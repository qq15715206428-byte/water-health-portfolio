/**
 * realtime.js —— 实时监控视图
 * 展示最新水质读数与各指标状态，并按固定周期自动刷新。
 */
import { api } from '../api.js';
import { METRICS, METRIC_ORDER, formatValue, statusBadge, statusOf, statusColor, formatDateTime } from '../util.js';

const LOADING = '<div class="empty"><div class="icon">⏳</div>加载中…</div>';

/** 单指标实时卡片（含阈值条）。 */
function metricCard(key, value) {
  const m = METRICS[key];
  const status = statusOf(key, value);
  const color = statusColor(status);
  const range = m.warnMax - m.warnMin;
  // 阈值条位置：以 warnMin ~ warnMax 为可视区间，value 越界则钳位
  let pos = 0;
  if (value !== null && value !== undefined) {
    const span = Math.max(1, range);
    pos = Math.max(0, Math.min(100, ((value - m.warnMin) / span) * 100));
  }
  const precision = key === 'hardness' ? 0 : key === 'temp' ? 1 : 2;
  return `
    <div class="metric-card">
      <div class="m-head"><span class="m-name">${m.name}</span>${statusBadge(status)}</div>
      <div class="m-value" style="color:${color}">${formatValue(value, '', precision)}<span class="m-unit">${m.unit ? ' ' + m.unit : ''}</span></div>
      <div class="m-range">安全 ${m.safeMin}${m.unit ? ' ' + m.unit : ''} ~ ${m.safeMax}${m.unit ? ' ' + m.unit : ''}</div>
      <div class="threshold-bar" style="margin-top:10px;height:6px;border-radius:3px;background:#eceaf6;position:relative">
        <div style="position:absolute;left:0;top:0;height:6px;width:${pos}%;border-radius:3px;background:${color}"></div>
      </div>
    </div>`;
}

export const realtime = {
  key: 'realtime',
  title: '实时监控',
  icon: '📈',

  async render(container, ctx) {
    container.innerHTML = LOADING;
    let timer = null;

    async function tick() {
      try {
        const d = await api.current();
        const metrics = d.metrics || {};
        container.innerHTML = `
          <div class="page-head">
            <div><h2>实时水质监控</h2><div class="desc">监测终端经 MQTT 实时上报，每 3 秒自动刷新</div></div>
            <span class="badge gray">最近上报 ${formatDateTime(d.time)}</span>
          </div>
          <div class="metric-grid">
            ${METRIC_ORDER.map((k) => metricCard(k, metrics[k])).join('')}
          </div>
          <div class="card" style="margin-top:16px">
            <div class="overview-text">
              平台通过 MQTT Broker 汇聚监测终端上报的水质数据，实时更新至数据存储并推送至管理控制台。
              各指标以"红黄绿"三档阈值判定：绿色为正常，黄色为预警，红色为超标。当指标进入预警或超标区间时，
              系统自动生成预警记录并触发联动设备处置。
            </div>
          </div>`;
      } catch (e) {
        container.innerHTML = `<div class="empty"><div class="icon">⚠</div>加载失败：${e.message}</div>`;
      }
    }

    await tick();
    timer = setInterval(tick, 3000);
    ctx.cleanup(() => clearInterval(timer));
  },
};
