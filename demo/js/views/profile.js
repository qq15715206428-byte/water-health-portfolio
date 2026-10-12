/**
 * profile.js —— 用户健康画像录入
 * 采集皮肤类型、头皮状况、身体敏感点与家庭成员构成，
 * 保存到本地缓存，供健康方案引擎个性化推荐使用。
 */

import { PROFILE_OPTIONS } from '../config.js';
import cache from '../storage/cache.js';

/**
 * 渲染健康画像页。
 */
export function render(container, store) {
  const profile = store.profile || { skin: '', scalp: '', sensitivity: '', family: [] };

  container.innerHTML = `
    <div class="card">
      <div class="card-title">完善健康画像，获取更精准的用水建议</div>
      <div class="form-group">
        <label class="form-label">皮肤类型</label>
        <div class="chip-group" data-field="skin">
          ${PROFILE_OPTIONS.skin.map((o) => `<span class="chip" data-value="${o}">${o}</span>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">头皮状况</label>
        <div class="chip-group" data-field="scalp">
          ${PROFILE_OPTIONS.scalp.map((o) => `<span class="chip" data-value="${o}">${o}</span>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">身体敏感点</label>
        <div class="chip-group" data-field="sensitivity">
          ${PROFILE_OPTIONS.sensitivity.map((o) => `<span class="chip" data-value="${o}">${o}</span>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">家庭成员构成（可多选）</label>
        <div class="chip-group" data-field="family">
          ${PROFILE_OPTIONS.family.map((o) => `<span class="chip" data-value="${o}">${o}</span>`).join('')}
        </div>
      </div>
      <button class="btn" id="save-profile">保存画像</button>
    </div>
  `;

  // 回显已选中的选项
  function refreshChips() {
    container.querySelectorAll('.chip-group').forEach((group) => {
      const field = group.dataset.field;
      const current = profile[field];
      group.querySelectorAll('.chip').forEach((chip) => {
        const value = chip.dataset.value;
        const active = Array.isArray(current) ? current.includes(value) : current === value;
        chip.classList.toggle('active', active);
      });
    });
  }

  // 单选字段（skin / scalp / sensitivity）：点击切换，且仅保留一个
  container.querySelectorAll('[data-field="skin"], [data-field="scalp"], [data-field="sensitivity"]').forEach((group) => {
    const field = group.dataset.field;
    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const value = chip.dataset.value;
      profile[field] = profile[field] === value ? '' : value;
      refreshChips();
    });
  });

  // 多选字段（family）
  const familyGroup = container.querySelector('[data-field="family"]');
  familyGroup.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const value = chip.dataset.value;
    if (!Array.isArray(profile.family)) profile.family = [];
    const idx = profile.family.indexOf(value);
    if (idx >= 0) profile.family.splice(idx, 1);
    else profile.family.push(value);
    refreshChips();
  });

  container.querySelector('#save-profile').addEventListener('click', () => {
    store.profile = profile;
    cache.set('profile', profile);
    store.toast('健康画像已保存');
  });

  refreshChips();
}
