/**
 * alertEngine.js —— 异常预警判定引擎
 * 根据水质读数与预设阈值，判定各指标状态（正常/偏高/超标），
 * 生成分级预警事件（饮用水高风险 / 生活用水提示），并计算综合水质评分。
 * 判定逻辑与移动应用端（软著1）保持一致，本模块为纯逻辑，无外部依赖。
 */
'use strict';

const { METRICS, METRIC_ORDER, ALERT_TYPES, ALERT_LEVELS } = require('../config');

/**
 * 判定单个指标的运行状态。
 * @param {string} metricKey 指标键
 * @param {number} value 指标值
 * @returns {'normal'|'warn'|'danger'} 状态
 */
function statusOf(metricKey, value) {
  const m = METRICS[metricKey];
  if (!m) return 'normal';
  if (value < m.safeMin || value > m.safeMax) {
    return (value < m.warnMin || value > m.warnMax) ? 'danger' : 'warn';
  }
  return 'normal';
}

/** 状态对应颜色。 */
function statusColor(status) {
  if (status === 'danger') return '#e53935';
  if (status === 'warn') return '#fb8c00';
  return '#2e7d32';
}

/** 状态中文标签。 */
function statusLabel(status) {
  if (status === 'danger') return '超标';
  if (status === 'warn') return '偏高';
  return '正常';
}

/**
 * 分析一次水质读数，返回完整分析结果。
 * @param {{time: Date|string, metrics: Object}} reading 读数对象
 * @returns {{ statuses: Object, alerts: Array, score: number, level: string }}
 */
function analyzeReading(reading) {
  const metrics = reading.metrics || {};
  const statuses = {};
  const alerts = [];

  for (const key of METRIC_ORDER) {
    const m = METRICS[key];
    const value = metrics[key];
    if (value === undefined || value === null) {
      statuses[key] = 'normal';
      continue;
    }
    const status = statusOf(key, value);
    statuses[key] = status;

    if (status !== 'normal') {
      const level = status === 'danger' ? 'danger' : 'warn';
      const type = ALERT_TYPES[key] || { name: m.name, advice: '请关注该指标变化。' };
      alerts.push({
        metric: key,
        metricName: m.name,
        value,
        unit: m.unit,
        level,
        levelLabel: ALERT_LEVELS[level].label,
        name: type.name,
        advice: type.advice,
      });
    }
  }

  let score = 100;
  for (const key of METRIC_ORDER) {
    if (statuses[key] === 'danger') score -= 20;
    else if (statuses[key] === 'warn') score -= 10;
  }
  score = Math.max(0, score);

  const level = Object.values(statuses).includes('danger') ? 'danger'
    : Object.values(statuses).includes('warn') ? 'warn' : 'normal';

  alerts.sort((a, b) => (a.level === 'danger' ? -1 : 1) - (b.level === 'danger' ? -1 : 1));

  return { statuses, alerts, score, level };
}

module.exports = { statusOf, statusColor, statusLabel, analyzeReading };
