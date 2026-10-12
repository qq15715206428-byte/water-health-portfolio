/**
 * reading.js —— 水质时序数据存储
 * 汇聚监测终端上报的水质读数，维护最新读数与各指标的历史时序，
 * 供实时监控与历史趋势查询使用。
 */
'use strict';

const { JsonStore } = require('./db');
const { METRIC_ORDER } = require('../config');
const { formatTime, formatShortDate } = require('../util/format');

const MAX_POINTS = 2000;   // 每个指标最多保留的采样点数量
const RANGE_MS = { day: 86400000, week: 604800000, month: 2592000000 };

const store = new JsonStore('reading', {
  current: { time: null, metrics: {} },
  series: {},               // metricKey -> [{ time, value }]
});

/** 写入一批新读数（来自某监测终端的上报），更新最新值与历史序列。 */
function updateReading(metrics, time) {
  const t = time || new Date();
  store.data.current = { time: t.toISOString(), metrics: Object.assign({}, metrics) };
  for (const key of METRIC_ORDER) {
    if (metrics[key] === undefined) continue;
    if (!store.data.series[key]) store.data.series[key] = [];
    store.data.series[key].push({ time: t.toISOString(), value: metrics[key] });
    if (store.data.series[key].length > MAX_POINTS) {
      store.data.series[key].splice(0, store.data.series[key].length - MAX_POINTS);
    }
  }
  store.save();
}

/** 获取最新读数。 */
function getCurrent() {
  return store.data.current;
}

/** 获取某指标在指定时间范围（day/week/month）内的时序。 */
function getHistory(range, metricKey) {
  const series = store.data.series[metricKey] || [];
  const cutoff = Date.now() - (RANGE_MS[range] || RANGE_MS.day);
  const filtered = series.filter((p) => new Date(p.time).getTime() >= cutoff);
  const useTime = range === 'day';
  const labels = filtered.map((p) => (useTime ? formatTime(p.time) : formatShortDate(p.time)));
  const values = filtered.map((p) => p.value);
  return { labels, values };
}

/** 清空最新读数与全部历史时序。 */
function clearHistory() {
  store.data.current = { time: null, metrics: {} };
  store.data.series = {};
  store.save();
}

module.exports = { updateReading, getCurrent, getHistory, clearHistory };
