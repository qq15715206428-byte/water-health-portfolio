/**
 * device.js —— 设备管理视图
 * 展示监测终端列表（在线状态/电量/固件/最近上报），支持注册新终端与解绑。
 */
import { api } from '../api.js';
import { formatDateTime } from '../util.js';

const LOADING = '<div class="empty"><div class="icon">⏳</div>加载中…</div>';

export const device = {
  key: 'device',
  title: '设备管理',
  icon: '📡',

  async render(container, ctx) {
    container.innerHTML = LOADING;
    await load(container, ctx, false);
  },
};

async function load(container, ctx, showForm) {
  try {
    const devices = await api.devices();
    const rows = devices.length
      ? devices.map((d) => {
          const onlineBadge = d.online
            ? '<span class="badge normal">在线</span>'
            : '<span class="badge gray">离线</span>';
          const battery = d.battery !== null && d.battery !== undefined
            ? `${d.battery}%` : '—';
          const isFixed = d.type === 'fixed';
          return `
            <tr>
              <td><b>${d.name}</b></td>
              <td>${d.typeLabel}</td>
              <td>${d.location || '—'}</td>
              <td>${onlineBadge}</td>
              <td>${battery}</td>
              <td>${d.firmware || '—'}</td>
              <td>${formatDateTime(d.lastSeen)}</td>
              <td><button class="btn btn-danger btn-sm" data-del="${d.id}">解绑</button></td>
            </tr>`;
        }).join('')
      : '<tr><td colspan="8"><div class="empty">暂无监测终端</div></td></tr>';

    container.innerHTML = `
      <div class="page-head">
        <div><h2>监测终端管理</h2><div class="desc">设备接入 · 在线状态 · 注册 / 解绑</div></div>
        <button class="btn btn-primary" id="add-device-btn">＋ 新增监测终端</button>
      </div>
      <div class="card ${showForm ? '' : 'hidden'}" id="add-form-card">
        <div class="card-title"><span class="icon">📝</span>注册新监测终端</div>
        <div class="grid cols-4">
          <div class="form-group"><label>设备名称</label><input class="form-input" id="dev-name" placeholder="如：客厅监测器"></div>
          <div class="form-group"><label>设备类型</label>
            <select class="form-input" id="dev-type">
              <option value="fixed">固定式（入户总管）</option>
              <option value="portable">便携式（水龙头）</option>
            </select>
          </div>
          <div class="form-group"><label>安装位置</label><input class="form-input" id="dev-location" placeholder="如：客厅"></div>
          <div class="form-group"><label>&nbsp;</label>
            <div><button class="btn btn-primary btn-sm" id="dev-save">保存</button>
            <button class="btn btn-outline btn-sm" id="dev-cancel">取消</button></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><span class="icon">📡</span>监测终端列表（共 ${devices.length} 台）</div>
        <table class="table">
          <thead><tr>
            <th>设备名称</th><th>类型</th><th>位置</th><th>状态</th><th>电量</th><th>固件</th><th>最近上报</th><th>操作</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    container.querySelector('#add-device-btn').addEventListener('click', () => load(container, ctx, true));
    const cancel = container.querySelector('#dev-cancel');
    if (cancel) cancel.addEventListener('click', () => load(container, ctx, false));
    const save = container.querySelector('#dev-save');
    if (save) save.addEventListener('click', async () => {
      const name = container.querySelector('#dev-name').value.trim();
      const type = container.querySelector('#dev-type').value;
      const location = container.querySelector('#dev-location').value.trim();
      if (!name) { window.toastMsg('请输入设备名称'); return; }
      try {
        await api.addDevice({ name, type, location });
        window.toastMsg('注册成功');
        load(container, ctx, false);
      } catch (e) { window.toastMsg(e.message); }
    });

    container.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.del;
        if (!window.confirm('确认解绑该监测终端？')) return;
        try {
          await api.removeDevice(id);
          window.toastMsg('已解绑');
          load(container, ctx, false);
        } catch (e) { window.toastMsg(e.message); }
      });
    });
  } catch (e) {
    container.innerHTML = `<div class="empty"><div class="icon">⚠</div>加载失败：${e.message}</div>`;
  }
}
