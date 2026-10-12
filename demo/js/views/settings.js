/**
 * settings.js —— 系统设置与隐私
 * 提供账号信息、通知 / 自动联动开关、数据清理、隐私说明与退出登录等功能，
 * 并作为二级功能（健康画像 / 预警记录 / 健康报告）的入口枢纽。
 */

import cache from '../storage/cache.js';
import { APP } from '../config.js';
import { iconBadge } from '../utils/icons.js';

/**
 * 渲染系统设置页。
 */
export function render(container, store) {
  const settings = store.settings || { notify: true, autoLinkage: true, refreshSec: 3 };

  container.innerHTML = `
    <div class="card">
      <div class="list">
        <div class="list-item">
          <div class="li-icon">${iconBadge('user')}</div>
          <div class="li-body">
            <div class="li-title">${store.user ? (store.user.nickname || store.user.username) : '未登录'}</div>
            <div class="li-sub">${store.user ? `账号：${store.user.username}` : ''}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">功能入口</div>
      <div class="list">
        <div class="list-item" data-go="profile"><div class="li-icon">${iconBadge('heart')}</div><div class="li-body"><div class="li-title">健康画像</div></div><div class="li-right t-green">›</div></div>
        <div class="list-item" data-go="alert"><div class="li-icon">${iconBadge('bell')}</div><div class="li-body"><div class="li-title">预警记录</div></div><div class="li-right t-green">›</div></div>
        <div class="list-item" data-go="report"><div class="li-icon">${iconBadge('file')}</div><div class="li-body"><div class="li-title">健康报告</div></div><div class="li-right t-green">›</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">通用设置</div>
      <div class="list">
        <div class="list-item">
          <div class="li-body"><div class="li-title">预警通知</div><div class="li-sub">出现异常时弹窗提醒</div></div>
          <label class="switch"><input type="checkbox" data-key="notify" ${settings.notify ? 'checked' : ''}><span class="slider"></span></label>
        </div>
        <div class="list-item">
          <div class="li-body"><div class="li-title">自动联动</div><div class="li-sub">超标时自动控制净水设备</div></div>
          <label class="switch"><input type="checkbox" data-key="autoLinkage" ${settings.autoLinkage ? 'checked' : ''}><span class="slider"></span></label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">隐私与数据</div>
      <div class="list">
        <div class="list-item"><div class="li-body"><div class="li-title">隐私说明</div><div class="li-sub">数据仅保存在本机，不联网上传</div></div><div class="li-right t-green">›</div></div>
        <div class="list-item" id="clear-data"><div class="li-body"><div class="li-title" style="color:var(--red);">清除本地数据</div><div class="li-sub">删除缓存与预警记录</div></div></div>
      </div>
    </div>

    <div class="card">
      <button class="btn danger" id="logout">退出登录</button>
      <p style="text-align:center;color:#9a9db8;font-size:12px;margin-top:12px;">${APP.name} ${APP.version} · ${APP.developer}</p>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => store.push(el.dataset.go));
  });

  // 通用设置开关
  container.querySelectorAll('input[data-key]').forEach((input) => {
    input.addEventListener('change', () => {
      settings[input.dataset.key] = input.checked;
      store.settings = settings;
      cache.set('settings', settings);
      store.toast('设置已保存');
    });
  });

  // 清除本地数据
  container.querySelector('#clear-data').addEventListener('click', () => {
    cache.clear();
    store.alerts.length = 0;
    store.profile = { skin: '', scalp: '', sensitivity: '', family: [] };
    store.toast('本地数据已清除');
  });

  // 退出登录
  container.querySelector('#logout').addEventListener('click', () => {
    store.onLogout();
  });
}
