/**
 * smoke_test.mjs —— 核心逻辑冒烟测试（Node 环境，无 DOM 依赖）
 * 运行方式：node smoke_test.mjs
 */
import { generateReading, nextValue, generateSeries, generateDevices, generateLinkageDevices } from './js/data/mockSource.js';
import { statusOf, analyzeReading } from './js/engine/alertEngine.js';
import { generateHealthPlan } from './js/engine/healthEngine.js';
import { METRICS, METRIC_ORDER, ALERT_LEVELS } from './js/config.js';
import { encodeRemainingLength, buildConnectPacket, parsePublishPacket } from './js/data/mqttSource.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  PASS', msg); }
  else { failed++; console.error('  FAIL', msg); }
}

console.log('[1] 模拟读数生成');
const r = generateReading();
assert(r.metrics && typeof r.time.getTime === 'function', '读数包含时间戳');
assert(METRIC_ORDER.every((k) => typeof r.metrics[k] === 'number'), '读数包含全部指标数值');

console.log('[2] 状态判定（三档）');
assert(statusOf('chlorine', 0.10) === 'normal', '余氯 0.10 -> normal');
assert(statusOf('chlorine', 0.25) === 'warn', '余氯 0.25 -> warn');
assert(statusOf('chlorine', 0.40) === 'danger', '余氯 0.40 -> danger');
assert(statusOf('ph', 7.0) === 'normal', 'pH 7.0 -> normal');
assert(statusOf('ph', 6.2) === 'warn', 'pH 6.2 -> warn');
assert(statusOf('ph', 5.0) === 'danger', 'pH 5.0 -> danger');
assert(statusOf('temp', 32) === 'warn', '温度 32 -> warn');

console.log('[3] 读数分析（预警 + 评分）');
const analysis = analyzeReading({
  time: new Date(),
  metrics: { chlorine: 0.4, hardness: 200, ph: 7.0, turbidity: 0.5, temp: 22, heavyMetal: 5 },
});
assert(analysis.alerts.length >= 1, '超标指标产生预警事件');
assert(analysis.score < 100, '存在超标时评分低于 100');
assert(analysis.level === 'danger', '含超标指标时整体等级为 danger');
assert(analysis.alerts[0].levelLabel === ALERT_LEVELS.danger.label, '预警等级标注正确');

console.log('[4] 健康方案生成');
const plan = generateHealthPlan(
  { skin: '敏感肌', scalp: '干枯', family: ['婴幼儿'] },
  analysis,
  analysis.statuses,
);
assert(Array.isArray(plan.items) && plan.items.length >= 1, '生成至少一条健康建议');
assert(typeof plan.overview === 'string' && plan.overview.length > 0, '生成健康概览');

console.log('[5] 历史序列生成');
const day = generateSeries('chlorine', 'day');
const week = generateSeries('hardness', 'week');
const month = generateSeries('ph', 'month');
assert(day.labels.length === 24 && day.values.length === 24, '日序列 24 点');
assert(week.labels.length === 7 && week.values.length === 7, '周序列 7 点');
assert(month.labels.length === 30 && month.values.length === 30, '月序列 30 点');

console.log('[6] 设备数据');
assert(generateDevices().length >= 2, '监测设备至少 2 台');
assert(generateLinkageDevices().length >= 3, '联动设备至少 3 台');

console.log('[7] MQTT 协议编码');
const rl = encodeRemainingLength(321);
assert(rl.length === 2 && rl[0] === 0xC1 && rl[1] === 0x02, '剩余长度变长编码正确');
const pkt = buildConnectPacket('test-1');
assert(pkt[0] === 0x10, 'CONNECT 报文类型字节正确');
const pub = new Uint8Array([0x30, 0x0c, 0x00, 0x05, 0x63, 0x6c, 0x6f, 0x75, 0x64, 0x31, 0x32, 0x33, 0x2e, 0x34]);
const parsed = parsePublishPacket(pub);
assert(parsed && parsed.topic === 'cloud', 'PUBLISH 报文解析主题正确');
assert(new TextDecoder().decode(parsed.payload) === '123.4', 'PUBLISH 报文解析负载正确');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
if (failed > 0) process.exit(1);
