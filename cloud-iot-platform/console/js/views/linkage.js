/**
 * linkage.js —— 联动控制视图
 * 展示可联动设备（净水器/软水机/智能水龙头/全屋净水）并支持手动开关控制。
 */
import { api } from '../api.js';

const LOADING = '<div class="empty"><div class="icon">⏳</div>加载中…</div>';

const TYPE_ICON = {
  '家用净水器': '🚰',
  '软水机': '🛁',
  '智能水龙头': '🚿',
  '全屋净水系统': '🏠',
};

export const linkage = {
  key: 'linkage',
  title: '联动控制',
  icon: '🔗',

  async render(container) {
    container.innerHTML = LOADING;
    await load(container);
  },
};

async function load(container) {
  try {
    const devices = await api.linkages();
    const onCount = devices.filter((d) => d.on).length;

    const cards = devices.map((d) => `
      <div class="card" style="margin-bottom:0">
        <div class="list-item" style="border:none;padding:0">
          <div class="li-left">
            <div class="li-icon" style="background:#f0edfe;font-size:22px">${TYPE_ICON[d.type] || '🔌'}</div>
            <div>
              <div class="li-title">${d.name}</div>
              <div class="li-sub">${d.type} · ${d.location || '—'}</div>
              <div class="li-sub" style="margin-top:4px">
                ${d.auto ? '<span class="badge gray">自动联动</span>' : '<span class="badge gray">手动控制</span>'}
                ${d.on ? '<span class="badge normal">已开启</span>' : '<span class="badge gray">已关闭</span>'}
              </div>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" data-id="${d.id}" ${d.on ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>`).join('');

    container.innerHTML = `
      <div class="page-head">
        <div><h2>设备联动控制</h2><div class="desc">监测—预警—处理 一体化 · 自动联动 + 手动控制</div></div>
        <span class="badge normal">已开启 ${onCount} / ${devices.length}</span>
      </div>
      <div class="grid cols-2">${cards}</div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="icon">🔁</span>联动策略</div>
        <div class="overview-text">
          当水质指标进入预警或超标区间时，联动决策引擎自动下发控制指令：重金属异常或浊度超标时启动家用净水器与全屋净水系统；
          余氯超标时启动除氯净化；硬度超标时启动软水处理。您也可在下方手动切换任一设备开关，实现个性化用水调节。
        </div>
      </div>`;

    container.querySelectorAll('input[type="checkbox"]').forEach((sw) => {
      sw.addEventListener('change', async () => {
        const id = sw.dataset.id;
        const on = sw.checked;
        try {
          await api.controlLinkage(id, on);
          window.toastMsg(on ? '设备已开启' : '设备已关闭');
        } catch (e) {
          sw.checked = !on;
          window.toastMsg(e.message);
        }
      });
    });
  } catch (e) {
    container.innerHTML = `<div class="empty"><div class="icon">⚠</div>加载失败：${e.message}</div>`;
  }
}
