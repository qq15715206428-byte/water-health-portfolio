/**
 * alert.js —— 预警记录存储
 * 汇聚预警引擎产出的分级预警记录，供控制台查看与推送。
 */
'use strict';

const { JsonStore } = require('./db');
const { uuid } = require('../util/format');

const MAX_ALERTS = 500;

const store = new JsonStore('alert', { alerts: [] });

/** 新增一条预警记录（新记录置顶）。 */
function addAlert(alert) {
  store.data.alerts.unshift(Object.assign({ id: uuid(), time: new Date().toISOString() }, alert));
  if (store.data.alerts.length > MAX_ALERTS) {
    store.data.alerts.length = MAX_ALERTS;
  }
  store.save();
}

/** 获取全部预警记录。 */
function getAlerts() {
  return store.data.alerts;
}

/** 清空预警记录。 */
function clearAlerts() {
  store.data.alerts = [];
  store.save();
}

module.exports = { addAlert, getAlerts, clearAlerts };
