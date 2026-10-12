/**
 * index.js —— 视图汇总
 * 集中导出登录视图与各功能模块视图，供 app.js 调度。
 */
import { login } from './login.js';
import { overview } from './overview.js';
import { device } from './device.js';
import { realtime } from './realtime.js';
import { history } from './history.js';
import { alert } from './alert.js';
import { health } from './health.js';
import { linkage } from './linkage.js';
import { user } from './user.js';
import { settings } from './settings.js';

export const loginView = login;
export const views = [
  overview, device, realtime, history, alert, health, linkage, user, settings,
];
