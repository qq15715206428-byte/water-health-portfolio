/**
 * db.js —— 数据存储基类
 * 基于 Node 内置 fs 实现 JSON 文件持久化 + 内存缓存，
 * 避免引入数据库等原生编译依赖，保证开箱即用、跨平台部署。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config');

// 数据目录解析为项目根下的绝对路径，避免受进程工作目录影响
const DATA_DIR_ABS = path.resolve(__dirname, '..', '..', DATA_DIR);

/** 确保数据目录存在。 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR_ABS)) {
    fs.mkdirSync(DATA_DIR_ABS, { recursive: true });
  }
}

/**
 * JSON 存储：每个业务域（读数 / 设备 / 预警 / 用户）各持有一个 JsonStore 实例，
 * 启动时从磁盘加载，变更时同步落盘。
 */
class JsonStore {
  constructor(name, defaults) {
    this.file = path.join(DATA_DIR_ABS, name + '.json');
    this.data = JSON.parse(JSON.stringify(defaults));
    ensureDataDir();
    this.load();
  }

  /** 从磁盘加载，缺省或损坏时保留默认值。 */
  load() {
    try {
      if (fs.existsSync(this.file)) {
        const raw = fs.readFileSync(this.file, 'utf8');
        Object.assign(this.data, JSON.parse(raw));
      }
    } catch (e) {
      console.warn(`[store] 加载 ${this.file} 失败：`, e.message);
    }
  }

  /** 将内存数据同步落盘。 */
  save() {
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.warn(`[store] 保存 ${this.file} 失败：`, e.message);
    }
  }
}

module.exports = { JsonStore, ensureDataDir };
