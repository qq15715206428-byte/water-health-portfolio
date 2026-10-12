/**
 * user.js —— 用户管理视图
 * 展示平台账号列表，支持新增注册用户与删除（管理员账号受保护）。
 */
import { api } from '../api.js';
import { formatDateTime } from '../util.js';

const LOADING = '<div class="empty"><div class="icon">⏳</div>加载中…</div>';

export const user = {
  key: 'user',
  title: '用户管理',
  icon: '👥',

  async render(container) {
    container.innerHTML = LOADING;
    await load(container, false);
  },
};

async function load(container, showForm) {
  try {
    const users = await api.users();
    const rows = users.map((u) => {
      const roleBadge = u.role === 'admin'
        ? '<span class="badge normal">管理员</span>'
        : '<span class="badge gray">普通用户</span>';
      const delBtn = u.role === 'admin'
        ? '<span style="color:#bbb">—</span>'
        : `<button class="btn btn-danger btn-sm" data-del="${u.id}">删除</button>`;
      return `
        <tr>
          <td><b>${u.username}</b></td>
          <td>${u.nickname || '—'}</td>
          <td>${roleBadge}</td>
          <td>${formatDateTime(u.createdAt)}</td>
          <td>${u.lastLogin ? formatDateTime(u.lastLogin) : '—'}</td>
          <td>${delBtn}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `
      <div class="page-head">
        <div><h2>用户管理</h2><div class="desc">平台账号与权限管理 · 口令哈希安全存储</div></div>
        <button class="btn btn-primary" id="add-user-btn">＋ 新增用户</button>
      </div>
      <div class="card ${showForm ? '' : 'hidden'}" id="add-user-card">
        <div class="card-title"><span class="icon">📝</span>新增注册用户</div>
        <div class="grid cols-4">
          <div class="form-group"><label>用户名</label><input class="form-input" id="user-name" placeholder="登录账号"></div>
          <div class="form-group"><label>密码</label><input class="form-input" id="user-pass" type="password" placeholder="初始密码"></div>
          <div class="form-group"><label>昵称</label><input class="form-input" id="user-nick" placeholder="显示名称（可选）"></div>
          <div class="form-group"><label>&nbsp;</label>
            <div><button class="btn btn-primary btn-sm" id="user-save">保存</button>
            <button class="btn btn-outline btn-sm" id="user-cancel">取消</button></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><span class="icon">👥</span>账号列表（共 ${users.length} 个）</div>
        <table class="table">
          <thead><tr>
            <th>用户名</th><th>昵称</th><th>角色</th><th>创建时间</th><th>最近登录</th><th>操作</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    container.querySelector('#add-user-btn').addEventListener('click', () => load(container, true));
    const cancel = container.querySelector('#user-cancel');
    if (cancel) cancel.addEventListener('click', () => load(container, false));
    const save = container.querySelector('#user-save');
    if (save) save.addEventListener('click', async () => {
      const username = container.querySelector('#user-name').value.trim();
      const password = container.querySelector('#user-pass').value;
      const nickname = container.querySelector('#user-nick').value.trim();
      if (!username || !password) { window.toastMsg('请输入用户名和密码'); return; }
      try {
        await api.addUser({ username, password, nickname });
        window.toastMsg('新增成功');
        load(container, false);
      } catch (e) { window.toastMsg(e.message); }
    });

    container.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!window.confirm('确认删除该用户？')) return;
        try {
          await api.removeUser(btn.dataset.del);
          window.toastMsg('已删除');
          load(container, false);
        } catch (e) { window.toastMsg(e.message); }
      });
    });
  } catch (e) {
    container.innerHTML = `<div class="empty"><div class="icon">⚠</div>加载失败：${e.message}</div>`;
  }
}
