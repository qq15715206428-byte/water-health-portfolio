/**
 * device.js —— 设备绑定与管理
 * 展示已绑定的水质监测设备（固定式 / 便携式），支持绑定 / 解绑与在线状态展示，
 * 并提供进入联动控制页的入口。
 */

import { iconBadge } from '../utils/icons.js';

/**
 * 渲染设备管理页。
 */
export function render(container, store) {
  let devices = store.dataSource.getDevices() || [];

  container.innerHTML = `
    <div class="card">
      <div class="card-title">
        监测设备
        <span class="more" data-go="linkage">联动控制 ›</span>
      </div>
      <div class="list" id="device-list"></div>
    </div>
    <div class="card">
      <div class="card-title">添加设备</div>
      <p class="report-text" style="text-align:center;line-height:2;">
        扫描设备二维码或输入设备编号完成绑定<br>
        <span style="color:#9a9db8;">（演示环境暂不支持真实设备接入）</span>
      </p>
      <button class="btn ghost" id="add-device" style="margin-top:10px;">模拟添加便携监测器</button>
    </div>
  `;

  container.querySelector('[data-go="linkage"]').addEventListener('click', () => store.push('linkage'));

  const list = container.querySelector('#device-list');

  function paintList() {
    list.innerHTML = '';
    for (const d of devices) {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="li-icon">${iconBadge(d.type === 'fixed' ? 'home' : 'tap')}</div>
        <div class="li-body">
          <div class="li-title">${d.name}</div>
          <div class="li-sub">${d.typeLabel} · ${d.location} · ${d.battery !== null ? `电量 ${d.battery}%` : '市电供电'}</div>
          <div class="li-sub">固件 ${d.firmware} · 安装于 ${d.installed}</div>
        </div>
        <div class="li-right">
          <span class="badge ${d.online ? 'green' : 'gray'}">${d.online ? '在线' : '离线'}</span>
        </div>
      `;
      list.appendChild(item);
    }
  }

  paintList();

  // 模拟添加设备
  container.querySelector('#add-device').addEventListener('click', () => {
    const count = devices.filter((d) => d.type === 'portable').length;
    devices.push({
      id: `dev-portable-0${count + 1}`,
      name: '水龙头便携监测器',
      type: 'portable',
      typeLabel: '便携式',
      online: true,
      location: `水龙头 ${count + 1}`,
      battery: 90,
      installed: '2026-08-01',
      firmware: 'v1.0.1',
    });
    paintList();
    store.toast('已模拟添加一台便携监测器');
  });
}
