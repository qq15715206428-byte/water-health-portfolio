/**
 * linkageEngine.js —— 设备联动决策引擎
 * 根据水质指标状态，决策应自动开启的联动设备，实现"监测-预警-处理"一体化。
 * 联动规则：超标 / 偏高指标映射到净水器、软水机、智能水龙头、全屋净水系统。
 */
'use strict';

// 联动规则：指标状态 -> 应开启的联动设备类型
const RULES = [
  { metric: 'heavyMetal', status: 'danger', devices: ['家用净水器', '全屋净水系统'], reason: '重金属异常，启动深度净化' },
  { metric: 'turbidity', status: 'danger', devices: ['家用净水器', '全屋净水系统'], reason: '浊度超标，启动过滤装置' },
  { metric: 'chlorine', status: 'warn', devices: ['家用净水器'], reason: '余氯超标，启动除氯净化' },
  { metric: 'hardness', status: 'warn', devices: ['软水机'], reason: '硬度超标，启动软水处理' },
  { metric: 'turbidity', status: 'warn', devices: ['家用净水器', '全屋净水系统'], reason: '浊度偏高，启动过滤装置' },
  { metric: 'ph', status: 'warn', devices: ['家用净水器'], reason: 'pH 异常，启动净化处理' },
];

/**
 * 根据指标状态决策联动动作。
 * @param {Object} statuses 各指标状态（alertEngine 输出）
 * @returns {Array<{deviceType: string, action: string, reason: string}>}
 */
function decideLinkage(statuses) {
  const actions = [];
  const seen = new Set();
  for (const rule of RULES) {
    const s = statuses[rule.metric];
    if (!s || s === 'normal') continue;
    // danger 恒触发；warn 仅当规则匹配 warn 时触发
    if (s !== 'danger' && s !== rule.status) continue;
    for (const type of rule.devices) {
      if (!seen.has(type)) {
        seen.add(type);
        actions.push({ deviceType: type, action: 'on', reason: rule.reason });
      }
    }
  }
  return actions;
}

module.exports = { decideLinkage };
