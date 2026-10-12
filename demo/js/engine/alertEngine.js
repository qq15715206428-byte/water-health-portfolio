/**
 * alertEngine.js —— 异常预警判定引擎
 * 根据水质读数与预设阈值，判定各指标状态（正常/接近阈值/超标），
 * 生成分级预警事件（饮用水高风险 / 生活用水提示），并计算综合水质评分。
 * 本模块为纯逻辑，无 DOM 依赖，可独立测试。
 */

import { METRICS, METRIC_ORDER, ALERT_TYPES, ALERT_LEVELS } from '../config.js';

/**
 * 判定单个指标的运行状态。
 * @param {string} metricKey 指标键
 * @param {number} value 指标值
 * @returns {'normal'|'warn'|'danger'} 状态
 */
export function statusOf(metricKey, value) {
  const m = METRICS[metricKey];
  if (!m) return 'normal';
  // 三档判定：超出安全区间为异常，进一步超出预警区间则为超标（红）。
  if (value < m.safeMin || value > m.safeMax) {
    return (value < m.warnMin || value > m.warnMax) ? 'danger' : 'warn';
  }
  return 'normal';
}

/**
 * 综合状态颜色（供界面展示）。
 */
export function statusColor(status) {
  if (status === 'danger') return '#e53935';
  if (status === 'warn') return '#fb8c00';
  return '#2e7d32';
}

/**
 * 状态中文标签。
 */
export function statusLabel(status) {
  if (status === 'danger') return '超标';
  if (status === 'warn') return '偏高';
  return '正常';
}

/**
 * 分析一次水质读数，返回完整分析结果。
 * @param {{time: Date, metrics: Object}} reading 读数对象
 * @returns {{
 *   statuses: Object,  // 各指标 -> 'normal'|'warn'|'danger'
 *   alerts: Array,     // 预警事件列表
 *   score: number,     // 综合评分 0-100
 *   level: string      // 整体风险等级 'normal'|'warn'|'danger'
 * }}
 */
export function analyzeReading(reading) {
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

    // 生成预警事件（仅 warn / danger 触发）
    if (status !== 'normal') {
      const level = status === 'danger' ? 'danger' : 'warn';
      const type = ALERT_TYPES[key] || { name: m.name, advice: '请关注该指标变化。' };
      alerts.push({
        id: `${key}-${reading.time.getTime()}`,
        metric: key,
        metricName: m.name,
        value,
        unit: m.unit,
        level,
        levelLabel: ALERT_LEVELS[level].label,
        name: type.name,
        advice: type.advice,
        time: reading.time,
      });
    }
  }

  // 综合评分：基础 100 分，danger 扣 20 分、warn 扣 10 分，下限 0
  let score = 100;
  for (const key of METRIC_ORDER) {
    if (statuses[key] === 'danger') score -= 20;
    else if (statuses[key] === 'warn') score -= 10;
  }
  score = Math.max(0, score);

  // 整体风险等级
  const level = Object.values(statuses).includes('danger') ? 'danger'
    : Object.values(statuses).includes('warn') ? 'warn' : 'normal';

  // 预警按严重程度排序（高风险在前）
  alerts.sort((a, b) => (a.level === 'danger' ? -1 : 1) - (b.level === 'danger' ? -1 : 1));

  return { statuses, alerts, score, level };
}
