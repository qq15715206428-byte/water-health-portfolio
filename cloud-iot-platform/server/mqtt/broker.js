/**
 * broker.js —— MQTT Broker 封装
 * 基于 aedes 实现 MQTT 3.1.1 消息代理，同时监听 TCP（1883）与 WebSocket（/mqtt）。
 * 监测终端通过主题 `home/water/<metricKey>` 上报水质数据，本模块负责聚合各指标、
 * 触发预警分析与联动决策，形成"设备接入 -> 汇聚 -> 分析 -> 处理"的闭环。
 */
'use strict';

const net = require('net');
const aedes = require('aedes');
const ws = require('websocket-stream');
const { PORT, METRICS, METRIC_ORDER, MQTT_TOPIC_PREFIX } = require('../config');
const readingStore = require('../store/reading');
const deviceStore = require('../store/device');
const alertStore = require('../store/alert');
const { analyzeReading } = require('../engine/alertEngine');
const { decideLinkage } = require('../engine/linkageEngine');

/** 创建并配置 broker。 */
function createBroker() {
  const broker = aedes();

  // 按 clientId 聚合未齐的指标读数
  const pending = new Map();

  broker.on('publish', (packet, client) => {
    if (!client || !packet.topic.startsWith(MQTT_TOPIC_PREFIX)) return;
    const metricKey = packet.topic.slice(MQTT_TOPIC_PREFIX.length);
    if (!METRICS[metricKey]) return;
    const value = Number(packet.payload.toString());
    if (Number.isNaN(value)) return;

    const deviceId = client.id;
    let buf = pending.get(deviceId);
    if (!buf) {
      buf = { metrics: {} };
      pending.set(deviceId, buf);
    }
    buf.metrics[metricKey] = value;

    // 一轮完整读数（全部指标）到齐后处理
    if (Object.keys(buf.metrics).length >= METRIC_ORDER.length) {
      pending.delete(deviceId);
      handleReading(deviceId, buf.metrics);
    }
  });

  broker.on('client', (client) => {
    deviceStore.markOnline(client.id, true);
  });

  broker.on('clientDisconnect', (client) => {
    deviceStore.markOnline(client.id, false);
  });

  /** 处理一轮完整读数：入库 + 预警 + 联动。 */
  function handleReading(deviceId, metrics) {
    readingStore.updateReading(metrics);
    const reading = readingStore.getCurrent();
    const result = analyzeReading(reading);

    for (const a of result.alerts) {
      alertStore.addAlert(Object.assign({ deviceId }, a));
    }

    const actions = decideLinkage(result.statuses);
    for (const act of actions) {
      const d = deviceStore.getLinkageDevices().find((x) => x.type === act.deviceType && x.auto);
      if (d) deviceStore.setLinkageState(d.id, true);
    }
  }

  return broker;
}

/** 启动 broker：TCP 监听 1883，WebSocket 挂载到 HTTP server 的 /mqtt。 */
function startBroker(broker, httpServer) {
  const tcpServer = net.createServer(broker.handle);
  tcpServer.listen(PORT.mqtt, () => {
    console.log(`[MQTT] TCP 监听 0.0.0.0:${PORT.mqtt}`);
  });
  ws.createServer({ server: httpServer, path: '/mqtt' }, broker.handle);
  console.log('[MQTT] WebSocket 挂载 /mqtt');
}

module.exports = { createBroker, startBroker };
