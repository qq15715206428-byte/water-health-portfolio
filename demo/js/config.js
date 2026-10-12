/**
 * config.js —— 全局配置
 * 集中管理软件名称、版本、数据源模式、水质指标定义与预警阈值等基础配置。
 */

// 软件基础信息
export const APP = {
  name: '家庭水质健康智能管理移动应用软件',
  shortName: '水质健康管家',
  version: 'V1.0',
  developer: '河海大学',
};

// 数据源模式：mock 为内置模拟数据源；http / mqtt 为预留接口，接入真实后端时切换。
export const DATA_SOURCE_MODE = 'mock';

// 预留接口地址（接入真实云端时填写）
export const ENDPOINTS = {
  restBaseUrl: '',          // REST API 根地址，例如 https://api.example.com
  mqttBrokerUrl: '',        // MQTT Broker（WebSocket），例如 wss://broker.example.com:8084/mqtt
  mqttTopicPrefix: 'home/water/', // MQTT 订阅主题前缀
};

// 模拟数据刷新间隔（毫秒）
export const MOCK_REFRESH_INTERVAL = 3000;

// 历史数据统计粒度
export const HISTORY_RANGES = ['day', 'week', 'month'];

/**
 * 水质指标定义。
 * 每个指标包含：中文名、单位、安全范围与预警阈值，采用"红黄绿"三档判定：
 *   safeMin / safeMax：正常（绿色）区间
 *   warnMin / warnMax：预警（黄色）边界；数值超出 warn 边界即为超标（红色）
 * 对于仅存在上限的指标（如余氯、浊度、重金属），min 均为 0。
 * base / drift 用于模拟数据生成：以 base 为基准做随机游走，步长由 drift 控制。
 */
export const METRICS = {
  chlorine: {
    key: 'chlorine', name: '余氯', unit: 'mg/L',
    safeMin: 0, safeMax: 0.2, warnMin: 0.2, warnMax: 0.3,
    base: 0.12, drift: 0.05, precision: 2,
  },
  hardness: {
    key: 'hardness', name: '硬度', unit: 'mg/L',
    safeMin: 0, safeMax: 300, warnMin: 300, warnMax: 450,
    base: 210, drift: 60, precision: 0,
  },
  ph: {
    key: 'ph', name: 'pH', unit: '',
    safeMin: 6.5, safeMax: 8.5, warnMin: 6.0, warnMax: 9.0,
    base: 7.2, drift: 0.4, precision: 2,
  },
  turbidity: {
    key: 'turbidity', name: '浊度', unit: 'NTU',
    safeMin: 0, safeMax: 1, warnMin: 1, warnMax: 3,
    base: 0.5, drift: 0.4, precision: 2,
  },
  temp: {
    key: 'temp', name: '温度', unit: '℃',
    safeMin: 10, safeMax: 30, warnMin: 5, warnMax: 35,
    base: 22, drift: 3, precision: 1,
  },
  heavyMetal: {
    key: 'heavyMetal', name: '重金属', unit: 'ppb',
    safeMin: 0, safeMax: 10, warnMin: 10, warnMax: 30,
    base: 5, drift: 4, precision: 2,
  },
};

// 指标展示顺序
export const METRIC_ORDER = ['chlorine', 'hardness', 'ph', 'turbidity', 'temp', 'heavyMetal'];

// 预警类型定义（对应软件说明书 4.7.3 预警类型表）
export const ALERT_TYPES = {
  heavyMetal: { metric: 'heavyMetal', name: '重金属异常', level: 'danger', advice: '立即停止饮用，启动净水设备并联系复检。' },
  chlorine: { metric: 'chlorine', name: '余氯超标', level: 'warn', advice: '建议静置或过滤后使用，敏感肌加强防护。' },
  hardness: { metric: 'hardness', name: '硬度超标', level: 'warn', advice: '建议软水处理，注意头发与皮肤护理。' },
  ph: { metric: 'ph', name: 'pH 异常', level: 'warn', advice: '检查管路，必要时联系水务部门。' },
  turbidity: { metric: 'turbidity', name: '浊度偏高', level: 'warn', advice: '建议启动过滤装置，待水澄清后再使用。' },
  temp: { metric: 'temp', name: '水温异常', level: 'warn', advice: '注意用水舒适度，必要时调节水温。' },
};

// 预警等级
export const ALERT_LEVELS = {
  danger: { key: 'danger', label: '饮用水高风险', color: '#e53935', icon: '⚠' },
  warn: { key: 'warn', label: '生活用水提示', color: '#fb8c00', icon: '△' },
};

// 健康画像选项
export const PROFILE_OPTIONS = {
  skin: ['中性', '干性', '油性', '敏感肌', '屏障受损'],
  scalp: ['正常', '干枯', '出油', '头皮瘙痒', '分叉'],
  sensitivity: ['无特殊', '皮肤敏感', '呼吸道敏感', '肠胃敏感'],
  family: ['成年人', '婴幼儿', '老年人', '孕妇', '敏感体质成员'],
};

// 可联动设备类型（对应申报书：净水器 / 软水机 / 智能水龙头 / 全屋净水系统）
export const LINKAGE_DEVICE_TYPES = ['家用净水器', '软水机', '智能水龙头', '全屋净水系统'];
