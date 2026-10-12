/**
 * dataSourceFactory.js —— 数据源工厂
 * 按全局配置 DATA_SOURCE_MODE 创建对应的数据源实例。
 *   mock -> 内置模拟数据源（默认，硬件/云端未就绪时使用）
 *   http -> REST API 客户端（预留）
 *   mqtt -> MQTT WebSocket 客户端（预留）
 */

import { DATA_SOURCE_MODE } from '../config.js';
import { MockDataSource } from './mockSource.js';
import { HttpDataSource } from './httpSource.js';
import { MqttDataSource } from './mqttSource.js';

export function createDataSource(mode = DATA_SOURCE_MODE) {
  switch (mode) {
    case 'http':
      return new HttpDataSource();
    case 'mqtt':
      return new MqttDataSource();
    case 'mock':
    default:
      return new MockDataSource();
  }
}
