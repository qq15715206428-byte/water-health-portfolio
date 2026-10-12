/**
 * deviceSimulator.js —— 模拟监测终端
 * 在真实硬件接入前，用 mqtt.js 客户端模拟入户总管式与便携式两类监测终端，
 * 定时生成真实感水质数据并通过 MQTT 主题 `home/water/<metricKey>` 上报。
 * 数值生成逻辑对齐移动应用端（软著1）的模拟数据源，含少量异常注入以演示预警。
 */
'use strict';

const mqtt = require('mqtt');
const { PORT, METRICS, METRIC_ORDER, MQTT_TOPIC_PREFIX, SIM_REFRESH_MS } = require('../config');

// 异常注入概率
const ANOMALY_RATE = 0.05;

// 模拟监测终端（clientId 与设备注册表 id 一致）
const SIM_DEVICES = [
  { id: 'dev-fixed-01', name: '入户总管式固定监测器' },
  { id: 'dev-portable-01', name: '水龙头便携监测器' },
];

/** 四舍五入到指定精度。 */
function round(v, precision) {
  const p = Math.pow(10, precision);
  return Math.round(v * p) / p;
}

/** 生成一个异常值（进入预警或超标区间）。 */
function injectAnomaly(m) {
  const severe = Math.random() < 0.35;
  const span = Math.max(m.warnMax - m.warnMin, 0.1);
  if (m.safeMin > 0) {
    const high = Math.random() < 0.6;
    if (severe) return high ? m.warnMax + Math.random() * span : m.warnMin - Math.random() * span;
    return high
      ? m.safeMax + (m.warnMax - m.safeMax) * Math.random()
      : m.safeMin - (m.safeMin - m.warnMin) * Math.random();
  }
  if (severe) return m.warnMax + Math.random() * span;
  return m.safeMax + (m.warnMax - m.safeMax) * Math.random();
}

/** 计算单个指标的下一个值（随机游走 + 异常注入）。 */
function nextValue(m, prev) {
  let v = prev !== undefined ? prev : m.base;
  v += (Math.random() - 0.5) * 2 * m.drift;
  if (Math.random() < ANOMALY_RATE) v = injectAnomaly(m);
  const low = m.warnMin - m.drift * 4;
  const high = m.warnMax + m.drift * 4;
  v = Math.max(low, Math.min(high, v));
  return round(v, m.precision);
}

/** 启动模拟终端，返回客户端数组。 */
function startSimulator() {
  return SIM_DEVICES.map((dev) => {
    const client = mqtt.connect(`mqtt://localhost:${PORT.mqtt}`, { clientId: dev.id });
    const state = { metrics: {} };

    client.on('connect', () => {
      console.log(`[模拟终端] ${dev.name} 已接入，每 ${SIM_REFRESH_MS / 1000}s 上报一轮`);
      setInterval(() => {
        for (const key of METRIC_ORDER) {
          state.metrics[key] = nextValue(METRICS[key], state.metrics[key]);
          client.publish(MQTT_TOPIC_PREFIX + key, String(state.metrics[key]));
        }
      }, SIM_REFRESH_MS);
    });

    client.on('error', (e) => {
      console.warn(`[模拟终端] ${dev.name} 连接异常：`, e.message);
    });

    return client;
  });
}

module.exports = { startSimulator };
