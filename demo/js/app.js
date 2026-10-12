/**
 * app.js —— 应用入口
 * 负责初始化数据源、维护全局状态（用户 / 健康画像 / 预警日志）、
 * 管理登录态与底部标签导航，并将各视图模块渲染到主内容区。
 *
 * 视图约定：每个 views/*.js 模块导出 render(container, store)，
 * 由本文件统一调度，避免各视图直接耦合 DOM 外壳。
 */

import { createDataSource } from './data/dataSourceFactory.js';
import cache from './storage/cache.js';
import { analyzeReading } from './engine/alertEngine.js';
import { APP } from './config.js';
import { icon } from './utils/icons.js';

import * as loginView from './views/login.js';
import * as dashboardView from './views/dashboard.js';
import * as realtimeView from './views/realtime.js';
import * as historyView from './views/history.js';
import * as planView from './views/plan.js';
import * as deviceView from './views/device.js';
import * as linkageView from './views/linkage.js';
import * as alertView from './views/alert.js';
import * as reportView from './views/report.js';
import * as profileView from './views/profile.js';
import * as settingsView from './views/settings.js';

// ===== DOM 引用 =====
const loginEl = document.getElementById('login-view');
const appEl = document.getElementById('app-view');
const mainEl = document.getElementById('app-main');
const titleEl = document.getElementById('app-title');
const backBtn = document.getElementById('back-btn');
const userEl = document.getElementById('app-user');
const tabBarEl = document.getElementById('tab-bar');
const toastEl = document.getElementById('toast');

// ===== 全局状态 =====
const store = {
  user: cache.get('user', null),
  profile: cache.get('profile', { skin: '', scalp: '', sensitivity: '', family: [] }),
  settings: cache.get('settings', { notify: true, autoLinkage: true, refreshSec: 3 }),
  alerts: [],              // 累积的预警日志（新在前）
  current: null,           // 最新读数
  analysis: null,          // 最新分析结果 { statuses, alerts, score, level }
  dataSource: null,

  // 订阅机制：数据刷新时通知当前视图重绘
  _listeners: new Set(),
  subscribe(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); },
  clearSubscriptions() { this._listeners.clear(); },
  emit() { this._listeners.forEach((fn) => fn()); },

  // 轻提示
  toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 1800);
  },

  // 登录 / 登出回调（由本文件注入）
  onLogin: null,
  onLogout: null,
};

// ===== 视图注册 =====
const VIEWS = {
  dashboard: { title: '水质仪表盘', render: dashboardView.render },
  realtime: { title: '实时监测', render: realtimeView.render },
  history: { title: '历史趋势', render: historyView.render },
  plan: { title: '健康方案', render: planView.render },
  device: { title: '设备管理', render: deviceView.render },
  linkage: { title: '设备联动', render: linkageView.render },
  alert: { title: '异常预警', render: alertView.render },
  report: { title: '健康报告', render: reportView.render },
  profile: { title: '健康画像', render: profileView.render },
  settings: { title: '系统设置', render: settingsView.render },
};

// 底部标签（一级视图）
const TABS = [
  { key: 'dashboard', label: '首页', icon: 'home' },
  { key: 'realtime', label: '实时', icon: 'activity' },
  { key: 'plan', label: '健康', icon: 'heart' },
  { key: 'device', label: '设备', icon: 'monitor' },
  { key: 'settings', label: '我的', icon: 'user' },
];

// ===== 导航 =====
let stack = ['dashboard'];

function navigate(key) { stack = [key]; render(); }
function push(key) { stack.push(key); render(); }
function back() { if (stack.length > 1) { stack.pop(); render(); } }

store.navigate = navigate;
store.push = push;
store.back = back;

// ===== 渲染 =====
function render() {
  const key = stack[stack.length - 1];
  const view = VIEWS[key];
  if (!view) return;

  // 切换视图前清理旧订阅，避免泄漏与陈旧回调
  store.clearSubscriptions();
  mainEl.innerHTML = '';
  titleEl.textContent = view.title;

  // 返回按钮：二级视图显示
  backBtn.classList.toggle('hidden', stack.length <= 1);
  // 底部标签：仅一级标签视图高亮
  const activeTab = TABS.find((t) => t.key === key);
  tabBarEl.querySelectorAll('.tab-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.key === (activeTab ? activeTab.key : ''));
  });

  view.render(mainEl, store);
}

function renderTabBar() {
  tabBarEl.innerHTML = '';
  for (const tab of TABS) {
    const item = document.createElement('div');
    item.className = 'tab-item';
    item.dataset.key = tab.key;
    item.innerHTML = `<span class="tab-icon">${icon(tab.icon)}</span><span>${tab.label}</span>`;
    item.addEventListener('click', () => navigate(tab.key));
    tabBarEl.appendChild(item);
  }
}

backBtn.addEventListener('click', back);

// ===== 登录态切换 =====
function showApp() {
  loginEl.classList.add('hidden');
  appEl.classList.remove('hidden');
  userEl.textContent = store.user ? (store.user.nickname || store.user.username) : '';
  renderTabBar();
  render();
}

function showLogin() {
  appEl.classList.add('hidden');
  loginEl.classList.remove('hidden');
  loginView.render(loginEl, store);
}

store.onLogin = (user) => {
  store.user = user;
  cache.set('user', user);
  showApp();
  store.toast(`欢迎，${user.nickname || user.username}`);
};

store.onLogout = () => {
  cache.remove('user');
  store.user = null;
  showLogin();
  store.toast('已退出登录');
};

// ===== 数据源初始化 =====
function initDataSource() {
  store.dataSource = createDataSource();
  store.current = store.dataSource.getCurrent();
  store.analysis = analyzeReading(store.current);

  store.dataSource.onUpdate((reading) => {
    store.current = reading;
    store.analysis = analyzeReading(reading);

    // 累积预警日志（按 id 去重，新事件插入头部）
    for (const alert of store.analysis.alerts) {
      if (!store.alerts.some((a) => a.id === alert.id)) {
        store.alerts.unshift(alert);
      }
    }
    if (store.alerts.length > 200) store.alerts.length = 200;

    store.emit();
  });

  store.dataSource.connect();
}

// ===== 启动 =====
initDataSource();
if (store.user) {
  showApp();
} else {
  showLogin();
}
