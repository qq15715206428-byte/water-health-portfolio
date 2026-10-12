/**
 * settings.js —— 系统设置视图
 * 展示水质指标阈值配置，并提供预警与历史数据的清除管理。
 */
import { api } from '../api.js';

const LOADING = '<div class="empty"><div class="icon">⏳</div>加载中…</div>';

export const settings = {
  key: 'settings',
  title: '系统设置',
  icon: '⚙️',

  async render(container) {
    container.innerHTML = LOADING;
    try {
      const { thresholds } = await api.thresholds();
      const rows = thresholds.map((t) => `
        <tr>
          <td><b>${t.name}</b></td>
          <td>${t.unit || '—'}</td>
          <td>${t.safeMin} ~ ${t.safeMax}</td>
          <td>${t.warnMin} ~ ${t.warnMax}</td>
          <td>绿色正常 · 黄色预警 · 红色超标</td>
        </tr>`).join('');

      container.innerHTML = `
        <div class="page-head">
          <div><h2>系统设置</h2><div class="desc">阈值配置 · 数据管理</div></div>
        </div>
        <div class="card">
          <div class="card-title"><span class="icon">🎚️</span>水质指标阈值配置</div>
          <table class="table">
            <thead><tr><th>指标</th><th>单位</th><th>安全范围</th><th>预警边界</th><th>判定规则</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="card">
          <div class="card-title"><span class="icon">🗂️</span>数据管理</div>
          <div class="overview-text" style="margin-bottom:16px">
            平台水质数据与预警记录经 JSON 文件持久化存储于服务端 data 目录。
            您可清空预警记录或历史时序数据，清空后监测终端将持续产生新的数据。
          </div>
          <div style="display:flex;gap:12px">
            <button class="btn btn-outline" id="clear-alerts">清空预警记录</button>
            <button class="btn btn-outline" id="clear-history">清空历史数据</button>
          </div>
        </div>`;

      container.querySelector('#clear-alerts').addEventListener('click', async () => {
        if (!window.confirm('确认清空全部预警记录？')) return;
        try { await api.clearAlerts(); window.toastMsg('预警记录已清空'); }
        catch (e) { window.toastMsg(e.message); }
      });
      container.querySelector('#clear-history').addEventListener('click', async () => {
        if (!window.confirm('确认清空全部历史时序数据？')) return;
        try { await api.clearHistory(); window.toastMsg('历史数据已清空'); }
        catch (e) { window.toastMsg(e.message); }
      });
    } catch (e) {
      container.innerHTML = `<div class="empty"><div class="icon">⚠</div>加载失败：${e.message}</div>`;
    }
  },
};
