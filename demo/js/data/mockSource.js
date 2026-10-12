/**
 * mockSource.js —— 内置模拟数据源
 * 在硬件终端与云端平台尚未就绪时，本地生成具有真实感的水质时序数据，
 * 用于功能演示与开发联调。数据生成逻辑为纯函数，可独立测试。
 *
 * 生成策略：以各指标基准值（base）为中心做随机游走，并注入少量异常，
 * 使数值能够自然进入"预警 / 超标"区间，用于演示异常预警与联动功能。
 */

import { DataSource } from './dataSource.js';
import { METRICS, METRIC_ORDER, MOCK_REFRESH_INTERVAL, LINKAGE_DEVICE_TYPES } from '../config.js';

// 异常注入概率
const ANOMALY_RATE = 0.05;

/** 四舍五入到指定精度。 */
function round(v, precision) {
  const p = Math.pow(10, precision);
  return Math.round(v * p) / p;
}

/** 钳制数值到 [low, high]。 */
function clamp(v, low, high) {
  return Math.max(low, Math.min(high, v));
}

/**
 * 生成一个异常值（进入预警或超标区间）。
 * @param {Object} m 指标定义
 */
function injectAnomaly(m) {
  const severe = Math.random() < 0.35;
  const span = Math.max(m.warnMax - m.warnMin, 0.1);
  // 双边界指标（pH、温度）：safeMin > 0，随机偏高或偏低
  if (m.safeMin > 0) {
    const high = Math.random() < 0.6;
    if (severe) {
      return high ? m.warnMax + Math.random() * span : m.warnMin - Math.random() * span;
    }
    return high
      ? m.safeMax + (m.warnMax - m.safeMax) * Math.random()
      : m.safeMin - (m.safeMin - m.warnMin) * Math.random();
  }
  // 单边界指标：仅偏上限
  if (severe) return m.warnMax + Math.random() * span;
  return m.safeMax + (m.warnMax - m.safeMax) * Math.random();
}

/**
 * 计算单个指标的下一个值（随机游走 + 异常注入）。
 * @param {Object} m 指标定义
 * @param {number} prev 上一值（可为 undefined）
 */
export function nextValue(m, prev) {
  let v = prev !== undefined ? prev : m.base;
  v += (Math.random() - 0.5) * 2 * m.drift;
  if (Math.random() < ANOMALY_RATE) {
    v = injectAnomaly(m);
  }
  const low = m.warnMin - m.drift * 4;
  const high = m.warnMax + m.drift * 4;
  v = clamp(v, low, high);
  return round(v, m.precision);
}

/**
 * 生成一次完整读数（包含全部指标）。
 * @param {{time: Date, metrics: Object}} prev 上一读数（可为 undefined）
 * @returns {{time: Date, metrics: Object}}
 */
export function generateReading(prev) {
  const metrics = {};
  for (const key of METRIC_ORDER) {
    metrics[key] = nextValue(METRICS[key], prev ? prev.metrics[key] : undefined);
  }
  return { time: new Date(), metrics };
}

/**
 * 生成历史时序数据（用于日/周/月趋势图）。
 * @param {string} metricKey 指标键
 * @param {string} range 'day' | 'week' | 'month'
 * @returns {{labels: string[], values: number[]}}
 */
export function generateSeries(metricKey, range) {
  const m = METRICS[metricKey];
  const count = range === 'day' ? 24 : range === 'week' ? 7 : 30;
  const labels = [];
  const values = [];
  let prev = m.base;
  for (let i = 0; i < count; i++) {
    prev = nextValue(m, prev);
    values.push(prev);
    labels.push(historyLabel(range, i));
  }
  return { labels, values };
}

/** 历史横轴标签。 */
function historyLabel(range, i) {
  if (range === 'day') return `${String(i).padStart(2, '0')}:00`;
  if (range === 'week') return `周${'一二三四五六日'[i]}`;
  return `${i + 1}日`;
}

/** 生成监测设备列表。 */
export function generateDevices() {
  return [
    {
      id: 'dev-fixed-01', name: '入户总管式固定监测器', type: 'fixed', typeLabel: '固定式',
      online: true, location: '家庭总水管', battery: null,
      installed: '2026-05-12', firmware: 'v1.0.2',
    },
    {
      id: 'dev-portable-01', name: '水龙头便携监测器', type: 'portable', typeLabel: '便携式',
      online: true, location: '厨房水龙头', battery: 86,
      installed: '2026-06-03', firmware: 'v1.0.1',
    },
  ];
}

/** 生成可联动设备列表。 */
export function generateLinkageDevices() {
  return [
    { id: 'lk-purifier', name: '家用净水器', type: LINKAGE_DEVICE_TYPES[0], on: false, auto: true, location: '厨房' },
    { id: 'lk-softener', name: '软水机', type: LINKAGE_DEVICE_TYPES[1], on: false, auto: true, location: '卫生间' },
    { id: 'lk-faucet', name: '智能水龙头', type: LINKAGE_DEVICE_TYPES[2], on: true, auto: false, location: '厨房' },
    { id: 'lk-whole', name: '全屋净水系统', type: LINKAGE_DEVICE_TYPES[3], on: false, auto: true, location: '总水管' },
  ];
}

/**
 * 模拟数据源实现。
 */
export class MockDataSource extends DataSource {
  constructor() {
    super();
    this._reading = generateReading();
    this._timer = null;
    this._devices = generateDevices();
    this._linkage = generateLinkageDevices();
  }

  connect() {
    if (this._timer) return;
    this._timer = setInterval(() => this._tick(), MOCK_REFRESH_INTERVAL);
    this._emit(this._reading);
  }

  disconnect() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _tick() {
    this._reading = generateReading(this._reading);
    this._emit(this._reading);
  }

  getCurrent() {
    return this._reading;
  }

  getHistory(range, metricKey) {
    return generateSeries(metricKey, range);
  }

  getDevices() {
    return this._devices;
  }

  getLinkageDevices() {
    return this._linkage;
  }

  controlLinkage(id, on) {
    const device = this._linkage.find((d) => d.id === id);
    if (device) {
      device.on = on;
      return true;
    }
    return false;
  }
}
