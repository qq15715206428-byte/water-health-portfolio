/**
 * report.js —— 健康报告生成与导出
 * 汇总当前水质、健康画像与近期预警记录，生成文字版健康报告，
 * 支持复制到剪贴板或打印输出。
 */

import { METRICS, METRIC_ORDER } from '../config.js';
import { statusLabel } from '../engine/alertEngine.js';
import { formatValue, formatDateTime } from '../utils/format.js';

/**
 * 渲染健康报告页。
 */
export function render(container, store) {
  let type = 'week'; // 'week' | 'month'

  container.innerHTML = `
    <div class="card">
      <div class="card-title">报告类型</div>
      <div class="seg">
        <div class="seg-item" data-type="week">周报</div>
        <div class="seg-item" data-type="month">月报</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">报告内容</div>
      <div class="report-text" id="report-text"></div>
    </div>
    <div class="card">
      <button class="btn" id="copy-report">复制报告</button>
      <button class="btn ghost" id="print-report" style="margin-top:10px;">打印 / 导出 PDF</button>
    </div>
  `;

  const seg = container.querySelector('.seg');
  const textEl = container.querySelector('#report-text');

  function refreshSeg() {
    seg.querySelectorAll('.seg-item').forEach((el) => el.classList.toggle('active', el.dataset.type === type));
  }

  seg.addEventListener('click', (e) => {
    const item = e.target.closest('.seg-item');
    if (!item) return;
    type = item.dataset.type;
    refreshSeg();
    buildReport();
  });

  function buildReport() {
    const reading = store.current;
    const analysis = store.analysis;
    const profile = store.profile || {};
    const alerts = store.alerts || [];

    const lines = [];
    lines.push('＝'.repeat(30));
    lines.push(`家庭水质健康${type === 'week' ? '周' : '月'}报`);
    lines.push(`生成时间：${formatDateTime(new Date())}`);
    lines.push('＝'.repeat(30));
    lines.push('');

    lines.push('【一、当前水质概览】');
    if (reading && analysis) {
      lines.push(`综合评分：${analysis.score} 分（${levelText(analysis.level)}）`);
      for (const key of METRIC_ORDER) {
        const m = METRICS[key];
        lines.push(`  ${m.name}：${formatValue(reading.metrics[key], m.unit, m.precision)}（${statusLabel(analysis.statuses[key])}）`);
      }
    } else {
      lines.push('  暂无水质数据。');
    }
    lines.push('');

    lines.push('【二、健康画像】');
    lines.push(`  皮肤类型：${profile.skin || '未填写'}`);
    lines.push(`  头皮状况：${profile.scalp || '未填写'}`);
    lines.push(`  身体敏感点：${profile.sensitivity || '未填写'}`);
    lines.push(`  家庭成员：${profile.family && profile.family.length ? profile.family.join('、') : '未填写'}`);
    lines.push('');

    lines.push('【三、近期预警记录】');
    if (alerts.length) {
      alerts.slice(0, 10).forEach((a, i) => {
        lines.push(`  ${i + 1}. ${formatDateTime(a.time)} ${a.metricName} ${formatValue(a.value, a.unit)} — ${a.levelLabel}`);
      });
      if (alerts.length > 10) lines.push(`  …… 共 ${alerts.length} 条`);
    } else {
      lines.push('  期间无预警记录，水质状况良好。');
    }
    lines.push('');

    lines.push('【四、健康建议】');
    lines.push('  1. 保持每天足量饮水，优先饮用过滤后的水。');
    lines.push('  2. 关注余氯与硬度指标，敏感肌 / 婴幼儿家庭建议使用软水。');
    lines.push('  3. 出现高风险预警时，立即停止直接饮用并启动净水设备。');
    lines.push('');
    lines.push('＝'.repeat(30));
    lines.push('本报告由《家庭水质健康智能管理移动应用软件》自动生成，仅供参考。');

    textEl.textContent = lines.join('\n');
    return lines.join('\n');
  }

  container.querySelector('#copy-report').addEventListener('click', async () => {
    const text = buildReport();
    try {
      await navigator.clipboard.writeText(text);
      store.toast('报告已复制到剪贴板');
    } catch (e) {
      // 剪贴板不可用时提示手动复制
      store.toast('复制失败，请长按报告内容手动复制');
    }
  });

  container.querySelector('#print-report').addEventListener('click', () => {
    window.print();
  });

  refreshSeg();
  buildReport();
}

function levelText(level) {
  if (level === 'danger') return '饮用水高风险';
  if (level === 'warn') return '生活用水提示';
  return '水质良好';
}
