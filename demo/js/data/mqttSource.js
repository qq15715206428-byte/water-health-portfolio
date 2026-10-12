/**
 * mqttSource.js —— MQTT 数据源（预留接口）
 * 基于 WebSocket 的 MQTT 3.1.1 客户端，用于订阅水质监测终端上传的实时数据。
 * 接入真实 MQTT Broker 时，在 config.js 中填写 ENDPOINTS.mqttBrokerUrl，
 * 并将 DATA_SOURCE_MODE 设为 'mqtt'。本实现仅依赖浏览器原生 WebSocket，无需第三方库。
 */

import { DataSource } from './dataSource.js';
import { ENDPOINTS, METRICS, METRIC_ORDER } from '../config.js';

// ===== MQTT 3.1.1 协议编码工具 =====

/** 将文本编码为 UTF-8 字节数组。 */
function utf8(str) {
  return new TextEncoder().encode(str);
}

/** MQTT 剩余长度变长编码。 */
export function encodeRemainingLength(len) {
  const bytes = [];
  do {
    let digit = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) digit |= 0x80;
    bytes.push(digit);
  } while (len > 0);
  return bytes;
}

/** 长度前缀字符串（2 字节大端长度 + 字节）。 */
export function encodeString(str) {
  const data = utf8(str);
  const out = new Uint8Array(2 + data.length);
  out[0] = (data.length >> 8) & 0xff;
  out[1] = data.length & 0xff;
  out.set(data, 2);
  return out;
}

/** 拼接多个字节数组。 */
function concatBytes(parts) {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** 构建 MQTT CONNECT 报文。 */
export function buildConnectPacket(clientId) {
  const varHeader = concatBytes([
    encodeString('MQTT'),        // 协议名
    new Uint8Array([0x04]),      // 协议级别 MQTT 3.1.1
    new Uint8Array([0x02]),      // 连接标志：清理会话
    new Uint8Array([0x00, 0x3c]), // 保活 60 秒
  ]);
  const payload = encodeString(clientId);
  const remaining = concatBytes([varHeader, payload]);
  const header = concatBytes([new Uint8Array([0x10]), new Uint8Array(encodeRemainingLength(remaining.length))]);
  return concatBytes([header, remaining]);
}

/** 构建 MQTT SUBSCRIBE 报文。 */
export function buildSubscribePacket(packetId, topic, qos = 0) {
  const varHeader = new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff]);
  const payload = concatBytes([encodeString(topic), new Uint8Array([qos])]);
  const remaining = concatBytes([varHeader, payload]);
  const header = concatBytes([new Uint8Array([0x82]), new Uint8Array(encodeRemainingLength(remaining.length))]);
  return concatBytes([header, remaining]);
}

/** 构建 MQTT PINGREQ 报文。 */
export function buildPingPacket() {
  return new Uint8Array([0xc0, 0x00]);
}

/**
 * 解析 MQTT PUBLISH 报文，提取主题与负载。
 * @param {Uint8Array} data 报文字节
 * @returns {{topic: string, payload: Uint8Array} | null}
 */
export function parsePublishPacket(data) {
  if (data.length < 2) return null;
  const byte0 = data[0];
  if ((byte0 >> 4) !== 3) return null; // 报文类型 3 = PUBLISH

  // 跳过固定头：第 1 字节 + 剩余长度
  let pos = 1;
  let remaining = 0;
  let multiplier = 1;
  do {
    if (pos >= data.length) return null;
    const digit = data[pos++];
    remaining += (digit & 0x7f) * multiplier;
    multiplier *= 128;
    if (!(digit & 0x80)) break;
  } while (pos < 5);

  // QoS 等级（byte0 的 bit1-bit2）
  const qos = (byte0 >> 1) & 0x03;

  // 主题长度
  if (pos + 2 > data.length) return null;
  const topicLen = (data[pos] << 8) | data[pos + 1];
  pos += 2;
  if (pos + topicLen > data.length) return null;
  const topic = new TextDecoder().decode(data.slice(pos, pos + topicLen));
  pos += topicLen;

  // QoS > 0 时跳过报文标识符
  if (qos > 0) pos += 2;

  return { topic, payload: data.slice(pos) };
}

/**
 * MQTT 数据源实现。
 */
export class MqttDataSource extends DataSource {
  constructor() {
    super();
    this._ws = null;
    this._reading = { time: new Date(), metrics: {} };
    this._connected = false;
    this._pingTimer = null;
  }

  connect() {
    const url = ENDPOINTS.mqttBrokerUrl;
    if (!url) {
      console.warn('[mqttSource] 未配置 mqttBrokerUrl，数据源不可用');
      return;
    }
    this._ws = new WebSocket(url, 'mqtt');
    this._ws.binaryType = 'arraybuffer';
    this._ws.onopen = () => this._onOpen();
    this._ws.onmessage = (e) => this._onMessage(e.data);
    this._ws.onclose = () => this._connected = false;
    this._ws.onerror = (e) => console.warn('[mqttSource] 连接异常', e);
  }

  disconnect() {
    if (this._pingTimer) clearInterval(this._pingTimer);
    if (this._ws) this._ws.close();
    this._ws = null;
    this._connected = false;
  }

  _onOpen() {
    const clientId = 'whh-' + Math.random().toString(16).slice(2, 10);
    this._ws.send(buildConnectPacket(clientId));
    // 周期性发送心跳，维持连接
    this._pingTimer = setInterval(() => {
      if (this._ws && this._ws.readyState === 1) this._ws.send(buildPingPacket());
    }, 30000);
  }

  _onMessage(data) {
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
    const type = bytes[0] >> 4;
    if (type === 2) {
      // CONNACK：连接建立后订阅各指标主题
      this._connected = true;
      const prefix = ENDPOINTS.mqttTopicPrefix || 'home/water/';
      METRIC_ORDER.forEach((key, i) => {
        this._ws.send(buildSubscribePacket(i + 1, `${prefix}${key}`));
      });
    } else if (type === 3) {
      // PUBLISH：解析实时数据
      const msg = parsePublishPacket(bytes);
      if (!msg) return;
      const metricKey = msg.topic.split('/').pop();
      if (!METRICS[metricKey]) return;
      const value = Number(new TextDecoder().decode(msg.payload));
      if (!Number.isNaN(value)) {
        this._reading.metrics[metricKey] = value;
        this._reading.time = new Date();
        this._emit(this._reading);
      }
    }
  }

  getCurrent() {
    return this._reading;
  }

  getHistory(range, metricKey) {
    // 历史数据由云端 REST API 提供，MQTT 通道仅负责实时流
    return { labels: [], values: [] };
  }
}
