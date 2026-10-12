/**
 * plan.js —— 个性化健康方案
 * 结合用户健康画像与当前水质读数，调用 healthEngine 生成个性化建议，
 * 并支持一键跳转完善画像、查看健康报告。
 */

import { generateHealthPlan } from '../engine/healthEngine.js';
import { statusColor } from '../engine/alertEngine.js';
import { iconBadge } from '../utils/icons.js';

const LEVEL_TAG = { danger: '高风险', warn: '需关注', normal: '建议' };

/**
 * 渲染健康方案页。
 */
export function render(container, store) {
  const profile = store.profile || {};
  const hasProfile = profile.skin || profile.scalp || (profile.family && profile.family.length);

  container.innerHTML = `
    <div class="card">
      <div class="card-title">
        我的健康画像
        <span class="more" data-go="profile">${hasProfile ? '完善 ›' : '去填写 ›'}</span>
      </div>
      ${profileSummary(profile)}
    </div>
    <div class="card">
      <div class="card-title">今日健康方案</div>
      <div id="plan-overview" class="report-text" style="margin-bottom:12px;"></div>
      <div id="plan-items"></div>
    </div>
    <div class="card">
      <div class="card-title">更多</div>
      <div class="list">
        <div class="list-item" data-go="report">
          <div class="li-icon">${iconBadge('file')}</div>
          <div class="li-body"><div class="li-title">生成健康报告</div><div class="li-sub">汇总近期水质与健康情况</div></div>
          <div class="li-right t-green">›</div>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => store.push(el.dataset.go));
  });

  // 生成方案
  const analysis = store.analysis || { statuses: {}, alerts: [], score: 100, level: 'normal' };
  const plan = generateHealthPlan(profile, store.current || { time: new Date(), metrics: {} }, analysis.statuses);

  container.querySelector('#plan-overview').textContent = plan.overview;

  const itemsEl = container.querySelector('#plan-items');
  if (!plan.items.length) {
    itemsEl.innerHTML = `<div class="empty"><span class="empty-icon">${iconBadge('check')}</span>当前水质良好，暂无特别建议</div>`;
  } else {
    itemsEl.innerHTML = '';
    for (const item of plan.items) {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.style.alignItems = 'flex-start';
      const color = statusColor(item.level);
      div.innerHTML = `
        <div class="li-icon">${iconBadge(item.icon)}</div>
        <div class="li-body">
          <div class="li-title">${item.title}</div>
          <div class="li-sub" style="margin-top:4px;line-height:1.6;">${item.detail}</div>
        </div>
        <div class="li-right"><span class="badge" style="color:${color}">${LEVEL_TAG[item.level] || '建议'}</span></div>
      `;
      itemsEl.appendChild(div);
    }
  }
}

/**
 * 画像摘要展示。
 */
function profileSummary(profile) {
  const skin = profile.skin ? `皮肤：${profile.skin}` : '皮肤：未填写';
  const scalp = profile.scalp ? `头皮：${profile.scalp}` : '头皮：未填写';
  const sensitivity = profile.sensitivity ? `敏感点：${profile.sensitivity}` : '敏感点：未填写';
  const family = profile.family && profile.family.length ? `家庭成员：${profile.family.join('、')}` : '家庭成员：未填写';
  return `
    <div class="list">
      <div class="list-item"><div class="li-icon">${iconBadge('droplet')}</div><div class="li-body"><div class="li-title">${skin}</div></div></div>
      <div class="list-item"><div class="li-icon">${iconBadge('scissors')}</div><div class="li-body"><div class="li-title">${scalp}</div></div></div>
      <div class="list-item"><div class="li-icon">${iconBadge('shield')}</div><div class="li-body"><div class="li-title">${sensitivity}</div></div></div>
      <div class="list-item"><div class="li-icon">${iconBadge('users')}</div><div class="li-body"><div class="li-title">${family}</div></div></div>
    </div>
  `;
}
