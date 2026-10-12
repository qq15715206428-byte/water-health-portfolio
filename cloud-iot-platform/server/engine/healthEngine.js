/**
 * healthEngine.js —— 健康导向智能分析引擎
 * 根据用户健康画像与水质读数（及各指标状态），生成个性化健康解读与用水方案，
 * 将水质数据翻译为"对你的具体影响 + 可落地的处理建议"。
 * 分析逻辑与移动应用端（软著1）保持一致，本模块为纯逻辑，无外部依赖。
 */
'use strict';

const { METRICS } = require('../config');

/** 皮肤类型对余氯/硬度的敏感度加权提示。 */
function skinNote(skin) {
  if (!skin) return '';
  if (skin === '敏感肌') return '您的敏感肌对余氯与硬水刺激更敏感，建议优先使用过滤水洗漱。';
  if (skin === '屏障受损') return '您的皮肤屏障较脆弱，余氯可能加重干燥与刺激，请减少含氯水直接接触。';
  if (skin === '干性') return '干性皮肤遇硬水易紧绷，建议搭配软水或温和清洁。';
  if (skin === '油性') return '油性皮肤需注意余氯对皮脂膜的破坏，避免过度清洁后直接用生水。';
  return '';
}

/** 头皮状况对硬度的敏感度加权提示。 */
function scalpNote(scalp) {
  if (!scalp) return '';
  if (scalp === '干枯') return '水质硬度过高会加剧头发干枯、毛躁，建议使用软水洗发。';
  if (scalp === '分叉') return '硬水与余氯会损伤发丝，导致分叉加重，建议洗发后使用过滤水冲洗。';
  if (scalp === '头皮瘙痒') return '余氯可能刺激头皮，引起瘙痒，建议降低含氯水的头皮接触。';
  return '';
}

/** 家庭成员对水质的特殊关注提示。 */
function familyNote(family) {
  if (!family || family.length === 0) return '';
  const notes = [];
  if (family.includes('婴幼儿')) notes.push('家中有婴幼儿，冲泡奶粉建议使用过滤并煮沸后的水。');
  if (family.includes('孕妇')) notes.push('孕妇请优先饮用过滤水，避免重金属与余氯风险。');
  if (family.includes('老年人')) notes.push('老年人身体代谢能力较弱，建议饮用充分净化的软水。');
  if (family.includes('敏感体质成员')) notes.push('敏感体质成员请注意水质波动，异常时优先使用瓶装水或充分过滤水。');
  return notes.join('');
}

/**
 * 生成个性化健康方案。
 * @param {Object} profile 健康画像 { skin, scalp, sensitivity, family }
 * @param {{time: Date|string, metrics: Object}} reading 读数
 * @param {Object} statuses 各指标状态（alertEngine 输出）
 * @returns {{ overview: string, items: Array }}
 */
function generateHealthPlan(profile, reading, statuses) {
  const metrics = reading.metrics || {};
  const items = [];
  let dangerCount = 0;
  let warnCount = 0;

  for (const key of Object.keys(METRICS)) {
    const status = statuses[key] || 'normal';
    const m = METRICS[key];
    const value = metrics[key];
    if (value === undefined || status === 'normal') continue;

    if (status === 'danger') dangerCount++;
    else warnCount++;

    if (key === 'chlorine') {
      items.push({
        category: '护肤', icon: 'droplet', title: '余氯偏高，注意皮肤刺激',
        detail: `当前余氯 ${value}${m.unit}，高于安全范围。` + skinNote(profile.skin) +
          '建议：静置或使用过滤水洗漱，敏感肌加强防护。',
        level: status,
      });
    } else if (key === 'hardness') {
      items.push({
        category: '护发', icon: 'scissors', title: '水质偏硬，注意头发与皮肤护理',
        detail: `当前硬度 ${value}${m.unit}，偏硬水质易导致头发干枯、皮肤紧绷。` +
          scalpNote(profile.scalp) + '建议：启动软水机或用煮沸水软化后使用。',
        level: status,
      });
    } else if (key === 'heavyMetal') {
      items.push({
        category: '饮水', icon: 'alert', title: '重金属异常，立即停止饮用',
        detail: `当前重金属 ${value}${m.unit}，已超出安全阈值，存在健康风险。建议立即停止饮用，启动净水设备，并联系水质复检。`,
        level: status,
      });
    } else if (key === 'ph') {
      items.push({
        category: '饮水', icon: 'flask', title: 'pH 异常',
        detail: `当前 pH ${value}，超出正常范围。建议检查管路，必要时联系水务部门。`,
        level: status,
      });
    } else if (key === 'turbidity') {
      items.push({
        category: '饮水', icon: 'droplet', title: '浊度偏高，建议过滤',
        detail: `当前浊度 ${value}${m.unit}，水中悬浮杂质较多。建议启动过滤装置，待水澄清后再使用。`,
        level: status,
      });
    } else if (key === 'temp') {
      items.push({
        category: '生活', icon: 'thermo', title: '水温异常',
        detail: `当前水温 ${value}${m.unit}，请注意用水舒适度，必要时调节水温。`,
        level: status,
      });
    }
  }

  const famNote = familyNote(profile.family);
  if (famNote) {
    items.push({ category: '家庭', icon: 'users', title: '家庭成员健康提示', detail: famNote, level: 'warn' });
  }

  let overview;
  if (dangerCount > 0) {
    overview = `当前水质存在 ${dangerCount} 项高风险指标，请立即处理并减少直接用水。`;
  } else if (warnCount > 0) {
    overview = `当前水质总体尚可，但有 ${warnCount} 项指标需关注，建议按下方方案优化。`;
  } else {
    overview = '当前各项水质指标均在安全范围内，请继续保持良好的用水习惯。';
  }

  return { overview, items };
}

module.exports = { generateHealthPlan };
