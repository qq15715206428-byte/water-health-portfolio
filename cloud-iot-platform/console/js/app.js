/**
 * app.js —— 控制台入口
 * 负责登录态管理、侧边栏导航、顶部栏渲染与视图调度。
 */
import { api, setToken } from './api.js';
import { loginView, views } from './views/index.js';

const TOKEN_KEY = 'watercloud_token';
const USER_KEY = 'watercloud_user';

const loginEl = document.getElementById('login-view');
const appEl = document.getElementById('app-view');
const sidebarEl = document.getElementById('sidebar');
const topbarEl = document.getElementById('topbar');
const contentEl = document.getElementById('content');

let currentKey = null;
let cleanupFn = null;

/** 全局提示浮层。 */
let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
}
window.toastMsg = toast;

/** 渲染侧边栏。 */
function renderSidebar() {
  const items = views.map((v) => `
    <div class="nav-item" data-key="${v.key}">
      <span class="icon">${v.icon}</span><span>${v.title}</span>
    </div>`).join('');
  sidebarEl.innerHTML = `
    <div class="brand">
      <span class="logo">💧</span>
      <div><div class="name">水质健康云平台</div><div class="ver">家庭水质健康物联网云平台 V1.0</div></div>
    </div>
    <nav class="nav-list">${items}</nav>`;
  sidebarEl.querySelectorAll('.nav-item').forEach((n) => {
    n.addEventListener('click', () => navigate(n.dataset.key));
  });
}

/** 渲染顶部栏。 */
function renderTopbar() {
  let user = {};
  try { user = JSON.parse(localStorage.getItem(USER_KEY)) || {}; } catch (e) { user = {}; }
  topbarEl.innerHTML = `
    <div class="title" id="topbar-title"></div>
    <div class="user">
      <span class="avatar">${(user.nickname || '管')[0]}</span>
      <span>${user.nickname || user.username || '管理员'}</span>
      <button class="btn btn-outline btn-sm" id="logout-btn">退出登录</button>
    </div>`;
  topbarEl.querySelector('#logout-btn').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken('');
    showLogin();
  });
}

/** 切换到指定视图。 */
function navigate(key) {
  const view = views.find((v) => v.key === key);
  if (!view) return;
  if (cleanupFn) {
    try { cleanupFn(); } catch (e) {}
    cleanupFn = null;
  }
  currentKey = key;
  sidebarEl.querySelectorAll('.nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.key === key);
  });
  topbarEl.querySelector('#topbar-title').textContent = view.title;
  contentEl.innerHTML = '';
  const ctx = {
    toast,
    refresh: () => navigate(key),
    cleanup: (fn) => { cleanupFn = fn; },
  };
  try {
    view.render(contentEl, ctx);
  } catch (e) {
    contentEl.innerHTML = `<div class="empty"><div class="icon">⚠</div>视图加载失败：${e.message}</div>`;
  }
}

/** 显示主界面。 */
function showApp() {
  loginEl.classList.add('hidden');
  appEl.classList.remove('hidden');
  renderSidebar();
  renderTopbar();
  navigate(views[0].key);
}

/** 显示登录页。 */
function showLogin() {
  appEl.classList.add('hidden');
  loginEl.classList.remove('hidden');
  loginView.render(loginEl, { onLogin: handleLogin });
}

/** 处理登录。 */
async function handleLogin(username, password) {
  try {
    const { token, user } = await api.login(username, password);
    setToken(token);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    toast('登录成功');
    showApp();
  } catch (e) {
    toast(e.message);
  }
}

// 启动：若已登录则直接进入主界面，否则显示登录页
(function init() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    setToken(token);
    showApp();
  } else {
    showLogin();
  }
})();
