/**
 * health.js —— 健康分析视图
 * 根据健康画像与当前水质生成个性化健康解读与用水建议。
 */
import { api } from '../api.js';
import { PROFILE_OPTIONS, scoreRing } from '../util.js';

const LOADING = '<div class="empty"><div class="icon">⏳</div>加载中…</div>';

const ICON_MAP = { droplet: '💧', scissors: '✂️', alert: '⛔', flask: '🧪', thermo: '🌡️', users: '👨‍👩‍👧' };
const GROUP_LABEL = { skin: '皮肤类型', scalp: '头皮状况', sensitivity: '体质敏感性', family: '家庭成员' };
const GROUP_ICON = { skin: '🧴', scalp: '💇', sensitivity: '🩺', family: '👨‍👩‍👧' };

export const health = {
  key: 'health',
  title: '健康分析',
  icon: '💧',

  async render(container) {
    container.innerHTML = LOADING;

    // 画像状态
    const state = { skin: '', scalp: '', sensitivity: '', family: [] };
    let result = null;

    function renderProfile() {
      const groups = ['skin', 'scalp', 'sensitivity'].map((g) => `
        <div class="form-group">
          <label>${GROUP_ICON[g]} ${GROUP_LABEL[g]}</label>
          <div>
            ${PROFILE_OPTIONS[g].map((o) => `<span class="chip ${state[g] === o ? 'active' : ''}" data-group="${g}" data-val="${o}">${o}</span>`).join('')}
          </div>
        </div>`).join('');
      const family = `
        <div class="form-group">
          <label>${GROUP_ICON.family} ${GROUP_LABEL.family}（可多选）</label>
          <div>
            ${PROFILE_OPTIONS.family.map((o) => `<span class="chip ${state.family.includes(o) ? 'active' : ''}" data-group="family" data-val="${o}">${o}</span>`).join('')}
          </div>
        </div>`;

      container.innerHTML = `
        <div class="page-head">
          <div><h2>健康导向智能分析</h2><div class="desc">水质数据 × 健康画像 → 个性化用水建议</div></div>
        </div>
        <div class="grid cols-2">
          <div class="card">
            <div class="card-title"><span class="icon">🧬</span>健康画像设置</div>
            ${groups}${family}
            <button class="btn btn-primary" id="health-analyze">生成健康方案</button>
          </div>
          <div class="card">
            <div class="card-title"><span class="icon">📋</span>分析结果</div>
            <div id="health-result">${renderResult()}</div>
          </div>
        </div>`;

      container.querySelectorAll('.chip').forEach((c) => {
        c.addEventListener('click', () => {
          const g = c.dataset.group;
          const v = c.dataset.val;
          if (g === 'family') {
            const i = state.family.indexOf(v);
            if (i >= 0) state.family.splice(i, 1); else state.family.push(v);
          } else {
            state[g] = state[g] === v ? '' : v;
          }
          renderProfile();
        });
      });
      container.querySelector('#health-analyze').addEventListener('click', async () => {
        container.querySelector('#health-result').innerHTML = '<div class="empty"><div class="icon">⏳</div>分析中…</div>';
        try {
          result = await api.health(state);
          container.querySelector('#health-result').innerHTML = renderResult();
        } catch (e) {
          container.querySelector('#health-result').innerHTML = `<div class="empty">分析失败：${e.message}</div>`;
        }
      });
    }

    function renderResult() {
      if (!result) {
        return '<div class="empty"><div class="icon">💧</div>设置健康画像后点击"生成健康方案"</div>';
      }
      const items = (result.items || []).map((it) => `
        <div class="advice-item">
          <div class="a-head">
            <span>${ICON_MAP[it.icon] || '💧'}</span>
            <span class="a-title">${it.title}</span>
            <span class="badge ${it.level === 'danger' ? 'danger' : 'warn'}">${it.category}</span>
          </div>
          <div class="a-detail">${it.detail}</div>
        </div>`).join('') || '<div class="empty">当前水质良好，暂无特殊建议</div>';
      return `
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:16px">
          ${scoreRing(result.score, result.level)}
          <div>
            <div style="font-size:14px;font-weight:600;margin-bottom:6px">健康解读</div>
            <div style="font-size:13px;color:#5b6b7b;line-height:1.6">${result.overview}</div>
          </div>
        </div>
        ${items}`;
    }

    renderProfile();
  },
};
