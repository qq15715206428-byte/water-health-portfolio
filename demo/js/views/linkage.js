/**
 * linkage.js —— 设备联动控制
 * 展示可联动设备（净水器 / 软水机 / 智能水龙头 / 全屋净水系统），
 * 支持"自动联动"开关与手动控制，并根据当前水质风险给出联动建议。
 */

import { iconBadge } from '../utils/icons.js';

/**
 * 渲染设备联动页。
 */
export function render(container, store) {
  let devices = store.dataSource.getLinkageDevices() || [];

  container.innerHTML = `
    <div class="card">
      <div class="card-title">当前联动建议</div>
      <p class="report-text" id="linkage-advice"></p>
    </div>
    <div class="card">
      <div class="card-title">联动设备</div>
      <div class="list" id="linkage-list"></div>
    </div>
  `;

  const list = container.querySelector('#linkage-list');
  const adviceEl = container.querySelector('#linkage-advice');

  function paintAdvice() {
    const analysis = store.analysis;
    if (!analysis) { adviceEl.textContent = '暂无水质数据。'; return; }
    if (analysis.level === 'danger') {
      adviceEl.textContent = '检测到高风险水质指标，建议立即开启净水设备，并暂停直接饮用生水。';
    } else if (analysis.level === 'warn') {
      adviceEl.textContent = '部分指标偏高，建议开启净水 / 软水设备进行改善。';
    } else {
      adviceEl.textContent = '当前水质良好，无需额外联动处理，设备可按需手动控制。';
    }
  }

  function paintList() {
    list.innerHTML = '';
    for (const d of devices) {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="li-icon">${iconBadge(deviceIcon(d.type))}</div>
        <div class="li-body">
          <div class="li-title">${d.name}</div>
          <div class="li-sub">${d.type} · ${d.location}</div>
          <div class="li-sub" style="margin-top:4px;">
            自动联动
            <label class="switch" style="display:inline-block;vertical-align:middle;margin-left:4px;">
              <input type="checkbox" data-auto="${d.id}" ${d.auto ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <div class="li-right">
          <label class="switch">
            <input type="checkbox" data-on="${d.id}" ${d.on ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      `;
      list.appendChild(item);
    }

    // 手动开关
    list.querySelectorAll('input[data-on]').forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.dataset.on;
        const on = input.checked;
        store.dataSource.controlLinkage(id, on);
        store.toast(`${deviceName(id)} 已${on ? '开启' : '关闭'}`);
      });
    });

    // 自动联动开关
    list.querySelectorAll('input[data-auto]').forEach((input) => {
      input.addEventListener('change', () => {
        const d = devices.find((x) => x.id === input.dataset.auto);
        if (d) d.auto = input.checked;
        store.toast(`${d ? d.name : '设备'} 自动联动已${input.checked ? '开启' : '关闭'}`);
      });
    });
  }

  function deviceName(id) {
    const d = devices.find((x) => x.id === id);
    return d ? d.name : '设备';
  }

  paintAdvice();
  paintList();
}

/**
 * 设备图标映射。
 */
function deviceIcon(type) {
  const map = {
    '家用净水器': 'droplet',
    '软水机': 'sparkles',
    '智能水龙头': 'tap',
    '全屋净水系统': 'home',
  };
  return map[type] || 'plug';
}
