/**
 * httpSource.js —— REST API 数据源（预留接口）
 * 通过 REST API 与云端平台交互，获取水质实时数据、历史数据、设备信息并下发联动控制指令。
 * 接入真实云端时，在 config.js 中填写 ENDPOINTS.restBaseUrl，并将 DATA_SOURCE_MODE 设为 'http'。
 */

import { DataSource } from './dataSource.js';
import { ENDPOINTS, MOCK_REFRESH_INTERVAL } from '../config.js';

export class HttpDataSource extends DataSource {
  constructor() {
    super();
    this._base = ENDPOINTS.restBaseUrl || '';
    this._timer = null;
    this._reading = { time: new Date(), metrics: {} };
  }

  /** 拼接请求地址。 */
  _url(path) {
    return `${this._base}${path}`;
  }

  /** 发起 GET 请求并解析 JSON。 */
  async _get(path) {
    const res = await fetch(this._url(path));
    if (!res.ok) throw new Error(`请求失败：${res.status}`);
    return res.json();
  }

  /** 发起 POST 请求。 */
  async _post(path, body) {
    const res = await fetch(this._url(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`请求失败：${res.status}`);
    return res.json();
  }

  async connect() {
    if (!this._base) {
      console.warn('[httpSource] 未配置 restBaseUrl，数据源不可用');
      return;
    }
    const load = async () => {
      try {
        this._reading = await this._get('/api/water/current');
        this._emit(this._reading);
      } catch (e) {
        console.warn('[httpSource] 获取实时数据失败：', e.message);
      }
    };
    await load();
    this._timer = setInterval(load, MOCK_REFRESH_INTERVAL);
  }

  disconnect() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  getCurrent() {
    return this._reading;
  }

  async getHistory(range, metricKey) {
    try {
      return await this._get(`/api/water/history?range=${range}&metric=${metricKey}`);
    } catch (e) {
      console.warn('[httpSource] 获取历史数据失败：', e.message);
      return { labels: [], values: [] };
    }
  }

  async getDevices() {
    try {
      return await this._get('/api/devices');
    } catch (e) {
      return [];
    }
  }

  async getLinkageDevices() {
    try {
      return await this._get('/api/linkage');
    } catch (e) {
      return [];
    }
  }

  async controlLinkage(id, on) {
    try {
      await this._post(`/api/linkage/${id}/control`, { on });
      return true;
    } catch (e) {
      console.warn('[httpSource] 控制设备失败：', e.message);
      return false;
    }
  }
}
