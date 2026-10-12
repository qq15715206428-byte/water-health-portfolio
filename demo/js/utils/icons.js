/**
 * icons.js —— 简洁线性图标库
 * 统一采用 24x24 视口的描边风格图标（无填充、圆角端点），
 * 每个图标配有一个柔和的"主题色"（粉紫马卡龙色系，与整体风格一致）。
 *   icon(name)      —— 彩色线条图标（用于底部导航等直接展示场景）
 *   iconBadge(name) —— 浅色圆底 + 彩色图标（用于列表等需要强调的场景）
 */

const ICONS = {
  // 水滴（logo / 护肤 / 净水器 / 饮水）
  droplet: '<path d="M12 2.8s-6.5 5.9-6.5 10.7a6.5 6.5 0 0 0 13 0C18.5 8.7 12 2.8 12 2.8z"/>',
  // 房子（首页 / 固定监测器 / 全屋净水）
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-5.5h5V21"/>',
  // 心跳线（实时监测）
  activity: '<path d="M2.5 12h4l2.5-6.5 5 13 2.5-6.5h5"/>',
  // 心形（健康）
  heart: '<path d="M12 20.5s-7.5-4.6-7.5-9.9A4.3 4.3 0 0 1 12 7.1a4.3 4.3 0 0 1 7.5 3.5c0 5.3-7.5 9.9-7.5 9.9z"/>',
  // 显示器（设备）
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/>',
  // 用户（我的 / 头像）
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-3.5 3.4-5.5 7.5-5.5s7.5 2 7.5 5.5"/>',
  // 上升趋势（历史趋势）
  trend: '<path d="M3 17l6-6 4 4 7-8"/><path d="M14 7h6v6"/>',
  // 文件（报告）
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/>',
  // 盾牌（敏感防护）
  shield: '<path d="M12 3l7.5 3v5.5c0 5-3.4 8.4-7.5 10.5-4.1-2.1-7.5-5.5-7.5-10.5V6z"/>',
  // 多人（家庭）
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20.5c0-3.4 3-5.5 6.5-5.5s6.5 2.1 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4"/><path d="M17.8 15.4c2.3.5 3.7 2 3.7 4.6"/>',
  // 警告三角（重金属等风险）
  alert: '<path d="M12 3.5 21 20H3z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/>',
  // 试管（pH）
  flask: '<path d="M9 3h6"/><path d="M10 3v6L4.8 19a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 9V3"/>',
  // 温度计（温度）
  thermo: '<path d="M14 4.5a2 2 0 0 0-4 0V14a4 4 0 1 0 4 0z"/><path d="M12 9v6"/>',
  // 水龙头（便携监测器 / 智能水龙头）
  tap: '<path d="M3.5 11.5h9"/><path d="M12.5 11.5V8a2 2 0 0 1 4 0"/><path d="M9.5 11.5v2.5a4 4 0 0 0 4 4"/>',
  // 铃铛（通知）
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 4.5 2 5.5 2 5.5H4s2-1 2-5.5"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  // 对勾（空状态 / 完成）
  check: '<path d="M4.5 12.5l5 5L20 6.5"/>',
  // 剪刀（护发）
  scissors: '<circle cx="6" cy="6" r="2.7"/><circle cx="6" cy="18" r="2.7"/><path d="M20 4 8.8 15.2"/><path d="M20 20 8.8 8.8"/>',
  // 四角星（软水机 / 护理）
  sparkles: '<path d="M12 3c.6 4 3.4 6.8 7.5 7.5-4.1.7-6.9 3.5-7.5 7.5-.6-4-3.4-6.8-7.5-7.5C8.6 9.8 11.4 7 12 3z"/>',
  // 插头（其它设备）
  plug: '<path d="M9 3v6"/><path d="M15 3v6"/><path d="M7 9h10v3a5 5 0 0 1-10 0z"/><path d="M12 17v4"/>',
};

// 每个图标的主题色（柔和粉紫马卡龙色系，与整体配色一致）
const ICON_COLORS = {
  droplet: '#5b8def',   // 水蓝
  home: '#9898f0',      // 淡紫
  activity: '#f06292',  // 粉红
  heart: '#f06292',     // 粉红
  monitor: '#9898f0',   // 淡紫
  user: '#9898f0',      // 淡紫
  trend: '#43a047',     // 绿
  file: '#5b8def',      // 蓝
  shield: '#5b8def',    // 蓝
  users: '#f06292',     // 粉红
  alert: '#e53935',     // 红（危险语义）
  flask: '#9c6bf0',     // 深紫
  thermo: '#fb8c00',    // 橙
  tap: '#5b8def',       // 蓝
  bell: '#fb8c00',      // 橙
  check: '#43a047',     // 绿
  scissors: '#f06292',  // 粉红
  sparkles: '#fb8c00',  // 橙
  plug: '#9898f0',      // 淡紫
};

/**
 * 生成一个线性图标 SVG 字符串。
 * 图标尺寸通过 font-size（1em）控制；颜色默认使用该图标的主题色。
 * @param {string} name 图标名
 * @param {string} [color] 可选覆盖颜色（默认主题色）
 * @returns {string} SVG 字符串；未知名称返回空字符串
 */
export function icon(name, color) {
  const inner = ICONS[name];
  if (!inner) return '';
  const c = color || ICON_COLORS[name] || 'currentColor';
  return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + inner + '</svg>';
}

/**
 * 生成一个"浅色圆底 + 彩色图标"的组合，用于列表等需要强调的图标位。
 * 底色为该图标主题色的约 13% 透明度，图标为主体色。
 * @param {string} name 图标名
 * @param {number} [size] 图标字号（像素，默认 22）
 * @returns {string} HTML 字符串
 */
export function iconBadge(name, size = 22) {
  const color = ICON_COLORS[name] || '#9898f0';
  return '<span class="icon-badge" style="background:' + color + '22;font-size:' + size + 'px;">' + icon(name, color) + '</span>';
}
