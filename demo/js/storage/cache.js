/**
 * cache.js —— 本地缓存封装
 * 基于 localStorage 实现的轻量缓存模块，用于账号、健康画像与配置的本地持久化存储。
 * 提供命名空间隔离、JSON 序列化、过期时间与清除能力，供用户数据与配置的本地持久化使用。
 */

const NS = 'whh:'; // 命名空间前缀，避免与其它站点数据冲突

/**
 * 缓存模块（单例）。
 */
const cache = {
  /**
   * 写入缓存。
   * @param {string} key 键名
   * @param {*} value 值（可序列化对象）
   * @param {number} [ttl] 过期时间（毫秒），缺省永久有效
   */
  set(key, value, ttl) {
    const item = {
      value,
      expireAt: ttl ? Date.now() + ttl : null,
    };
    try {
      localStorage.setItem(NS + key, JSON.stringify(item));
    } catch (e) {
      // 存储空间不足或隐私模式下忽略异常，避免影响主流程
      console.warn('[cache] 写入失败：', key, e);
    }
  },

  /**
   * 读取缓存。
   * @param {string} key 键名
   * @param {*} [fallback] 不存在或过期时返回的默认值
   */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      if (raw === null) return fallback;
      const item = JSON.parse(raw);
      if (item.expireAt && Date.now() > item.expireAt) {
        localStorage.removeItem(NS + key);
        return fallback;
      }
      return item.value;
    } catch (e) {
      return fallback;
    }
  },

  /**
   * 删除指定缓存。
   */
  remove(key) {
    localStorage.removeItem(NS + key);
  },

  /**
   * 清空本应用全部缓存。
   */
  clear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  },

  /**
   * 判断缓存是否存在且未过期。
   */
  has(key) {
    return this.get(key, undefined) !== undefined;
  },
};

export default cache;
