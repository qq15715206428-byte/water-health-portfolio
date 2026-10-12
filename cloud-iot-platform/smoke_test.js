/**
 * smoke_test.js —— 核心逻辑冒烟测试
 * 校验三档阈值判定、预警分析、健康分析、联动决策、口令哈希与 AES 加密、
 * 格式化工具等纯逻辑模块，无需启动服务即可运行。
 */
'use strict';

const { statusOf, statusLabel, analyzeReading } = require('./server/engine/alertEngine');
const { generateHealthPlan } = require('./server/engine/healthEngine');
const { decideLinkage } = require('./server/engine/linkageEngine');
const { hashPassword, verifyPassword, aesEncrypt, aesDecrypt } = require('./server/util/crypto');
const { formatNumber, formatDateTime } = require('./server/util/format');

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) { pass += 1; console.log(`  ✓ ${name}`); }
  else { fail += 1; console.log(`  ✗ ${name}`); }
}

console.log('==== 家庭水质健康物联网云平台软件 V1.0 冒烟测试 ====\n');

console.log('[1] 三档阈值判定引擎');
check('余氯 0.18 正常', statusOf('chlorine', 0.18) === 'normal');
check('余氯 0.25 预警', statusOf('chlorine', 0.25) === 'warn');
check('余氯 0.45 超标', statusOf('chlorine', 0.45) === 'danger');
check('pH 7.2 正常', statusOf('ph', 7.2) === 'normal');
check('pH 9.5 超标', statusOf('ph', 9.5) === 'danger');
check('重金属 25 预警', statusOf('heavyMetal', 25) === 'warn');
check('重金属 35 超标', statusOf('heavyMetal', 35) === 'danger');
check('状态标签正确', statusLabel('danger') === '超标' && statusLabel('warn') === '偏高');

console.log('\n[2] 综合预警分析');
const reading = {
  time: new Date(),
  metrics: { chlorine: 0.45, hardness: 210, ph: 7.2, turbidity: 0.5, temp: 22, heavyMetal: 35 },
};
const r = analyzeReading(reading);
check('识别 2 项异常', r.alerts.length === 2);
check('评分扣分正确（2 项 danger = 60）', r.score === 60);
check('综合等级为 danger', r.level === 'danger');
check('异常含重金属', r.alerts.some((a) => a.metric === 'heavyMetal' && a.level === 'danger'));

console.log('\n[3] 健康分析引擎');
const statuses = {
  chlorine: 'danger', hardness: 'normal', ph: 'normal',
  turbidity: 'normal', temp: 'normal', heavyMetal: 'danger',
};
const plan = generateHealthPlan({ skin: '敏感肌', family: ['婴幼儿'] }, reading, statuses);
check('生成健康方案', plan.overview.length > 0 && plan.items.length >= 3);
check('包含敏感肌提示', JSON.stringify(plan.items).includes('敏感肌'));
check('包含婴幼儿提示', JSON.stringify(plan.items).includes('婴幼儿'));

console.log('\n[4] 设备联动决策');
const acts = decideLinkage({
  heavyMetal: 'danger', turbidity: 'normal', chlorine: 'warn',
  hardness: 'normal', ph: 'normal', temp: 'normal',
});
const types = acts.map((a) => a.deviceType);
check('重金属异常联动净水器', types.includes('家用净水器'));
check('重金属异常联动全屋净水', types.includes('全屋净水系统'));
check('联动动作去重', acts.length === 2);

console.log('\n[5] 口令哈希与 AES 加密');
const hp = hashPassword('123456');
check('口令哈希可校验', verifyPassword('123456', hp) === true);
check('错误口令被拒绝', verifyPassword('wrong', hp) === false);
const enc = aesEncrypt('admin:2026-08-18');
check('AES 加密可解密', aesDecrypt(enc) === 'admin:2026-08-18');

console.log('\n[6] 格式化工具');
check('数值格式化', formatNumber(0.18, 2) === '0.18');
check('去除尾随零', formatNumber(210, 2) === '210');
check('日期时间格式化', /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(formatDateTime(new Date())));

console.log(`\n==== 测试完成：通过 ${pass} 项，失败 ${fail} 项 ====`);
process.exit(fail > 0 ? 1 : 0);
