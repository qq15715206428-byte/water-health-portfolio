/**
 * api.js —— REST 客户端封装
 * 统一封装对云平台 REST API 的调用，处理登录令牌注入与错误提示。
 */

const BASE = '';

/** 会话令牌（登录后由 app.js 写入）。 */
let token = '';

export function setToken(t) { token = t || ''; }
export function getToken() { return token; }

/** 发起请求。 */
async function request(method, path, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok) {
    const msg = (data && data.error) || `请求失败（${res.status}）`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  login: (username, password) => request('POST', '/api/auth/login', { username, password }),

  overview: () => request('GET', '/api/water/overview'),
  current: () => request('GET', '/api/water/current'),
  history: (range, metric) => request('GET', `/api/water/history?range=${range}&metric=${metric}`),
  alerts: () => request('GET', '/api/water/alerts'),
  health: (profile) => {
    const q = new URLSearchParams();
    if (profile.skin) q.set('skin', profile.skin);
    if (profile.scalp) q.set('scalp', profile.scalp);
    if (profile.sensitivity) q.set('sensitivity', profile.sensitivity);
    if (profile.family && profile.family.length) q.set('family', profile.family.join(','));
    return request('GET', `/api/water/health?${q.toString()}`);
  },

  devices: () => request('GET', '/api/devices'),
  addDevice: (d) => request('POST', '/api/devices', d),
  removeDevice: (id) => request('DELETE', `/api/devices/${id}`),

  linkages: () => request('GET', '/api/linkage'),
  controlLinkage: (id, on) => request('POST', `/api/linkage/${id}/control`, { on }),

  users: () => request('GET', '/api/users'),
  addUser: (u) => request('POST', '/api/users', u),
  removeUser: (id) => request('DELETE', `/api/users/${id}`),

  thresholds: () => request('GET', '/api/settings/thresholds'),
  clearAlerts: () => request('POST', '/api/settings/clear-alerts'),
  clearHistory: () => request('POST', '/api/settings/clear-history'),
};
