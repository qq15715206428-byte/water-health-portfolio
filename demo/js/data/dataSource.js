/**
 * dataSource.js —— 数据源抽象接口
 * 统一封装水质数据、设备数据、联动控制的数据访问契约，所有数据源实现均继承本基类。
 * 具体实现的创建由 dataSourceFactory.js 按配置分发：
 *   mock -> 内置模拟数据源（默认）
 *   http -> REST API 客户端（预留）
 *   mqtt -> MQTT WebSocket 客户端（预留）
 */

/**
 * DataSource 基类：定义所有数据源必须实现的方法，并内置事件订阅能力。
 */
export class DataSource {
  constructor() {
    this._listeners = new Set();
  }

  /**
   * 订阅数据更新事件。
   * @param {Function} fn 回调，参数为最新读数对象 { time, metrics }
   * @returns {Function} 取消订阅函数
   */
  onUpdate(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /** 触发数据更新（子类调用）。 */
  _emit(payload) {
    this._listeners.forEach((fn) => fn(payload));
  }

  /** 建立连接（启动数据流）。 */
  connect() {}

  /** 断开连接。 */
  disconnect() {}

  /** 获取最新读数。 */
  getCurrent() {
    return { time: new Date(), metrics: {} };
  }

  /**
   * 获取历史时序数据。
   * @param {string} range 'day' | 'week' | 'month'
   * @param {string} metricKey 指标键
   * @returns {{labels: string[], values: number[]}}
   */
  getHistory(range, metricKey) {
    return { labels: [], values: [] };
  }

  /** 获取绑定的监测设备列表。 */
  getDevices() {
    return [];
  }

  /** 获取可联动设备列表。 */
  getLinkageDevices() {
    return [];
  }

  /** 控制联动设备开关。 */
  controlLinkage(id, on) {
    return false;
  }
}
