/**
 * login.js —— 用户注册 / 登录
 * 本地账号体系：账号信息存储在 localStorage（无后端），
 * 注册写入、登录校验，成功后回调 store.onLogin 进入主界面。
 */

import cache from '../storage/cache.js';
import { APP } from '../config.js';
import { icon } from '../utils/icons.js';

const USERS_KEY = 'users'; // { username: password }

function getUsers() {
  return cache.get(USERS_KEY, {});
}

function saveUsers(users) {
  cache.set(USERS_KEY, users);
}

/**
 * 渲染登录 / 注册页。
 * @param {HTMLElement} container 登录页容器
 * @param {Object} store 全局状态
 */
export function render(container, store) {
  let mode = 'login'; // 'login' | 'register'

  container.innerHTML = `
    <div class="login-brand">
      <div class="logo">${icon('droplet')}</div>
      <h1>${APP.shortName}</h1>
      <p>${APP.name} ${APP.version}</p>
    </div>
    <div class="login-box">
      <div class="login-tabs">
        <div class="lt active" data-mode="login">登录</div>
        <div class="lt" data-mode="register">注册</div>
      </div>
      <form id="login-form">
        <div class="form-group">
          <label class="form-label">账号</label>
          <input class="form-input" name="username" placeholder="请输入账号" autocomplete="username">
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input class="form-input" name="password" type="password" placeholder="请输入密码" autocomplete="current-password">
        </div>
        <div class="form-group register-only hidden">
          <label class="form-label">确认密码</label>
          <input class="form-input" name="confirm" type="password" placeholder="请再次输入密码">
        </div>
        <div class="form-group register-only hidden">
          <label class="form-label">昵称（选填）</label>
          <input class="form-input" name="nickname" placeholder="用于首页显示">
        </div>
        <button class="btn" type="submit">登录</button>
      </form>
      <p class="login-tip">演示环境账号仅保存在本机浏览器中，不会上传云端。</p>
    </div>
  `;

  const tabs = container.querySelectorAll('.login-tabs .lt');
  const form = container.querySelector('#login-form');
  const registerOnly = container.querySelectorAll('.register-only');
  const submitBtn = form.querySelector('button[type="submit"]');

  function setMode(m) {
    mode = m;
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.mode === m));
    registerOnly.forEach((el) => el.classList.toggle('hidden', m !== 'register'));
    submitBtn.textContent = m === 'login' ? '登录' : '注册';
  }

  tabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const username = (data.username || '').trim();
    const password = data.password || '';
    const nickname = (data.nickname || '').trim() || username;

    if (!username || !password) {
      store.toast('请输入账号和密码');
      return;
    }

    const users = getUsers();

    if (mode === 'register') {
      if (users[username]) {
        store.toast('该账号已存在，请直接登录');
        return;
      }
      if (password.length < 4) {
        store.toast('密码至少 4 位');
        return;
      }
      if (data.confirm !== password) {
        store.toast('两次输入的密码不一致');
        return;
      }
      users[username] = password;
      saveUsers(users);
      store.toast('注册成功，请登录');
      setMode('login');
      form.reset();
      return;
    }

    // 登录
    if (users[username] !== password) {
      store.toast('账号或密码错误');
      return;
    }
    store.onLogin({ username, nickname });
  });
}
