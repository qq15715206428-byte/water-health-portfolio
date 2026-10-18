/* ==========================================================================
   main.js —— 共享导航 / 语言切换 / 开启编辑 / 导出 HTML
   零依赖，直接内联于每个页面 <head> 末尾。
   ========================================================================== */
(function () {
  'use strict';

  var IN_PAGES = /\/pages\//.test(location.pathname);
  var BASE = IN_PAGES ? '../' : '';

  /* ---------- 导航配置（双语） ---------- */
  var NAV = [
    { href: 'index.html',            zh: '案例',   en: 'Case Study' },
    { href: 'pages/prd.html',        zh: 'PRD',    en: 'PRD' },
    { href: 'pages/research.html',   zh: '调研',   en: 'Research' },
    { href: 'pages/metrics.html',    zh: '指标',   en: 'Metrics' },
    { href: 'pages/competition.html', zh: '竞品',  en: 'Competition' },
    { href: 'pages/roadmap.html',    zh: '路线图', en: 'Roadmap' },
    { href: 'pages/ai.html',         zh: 'AI 协作', en: 'AI Collab' },
    { href: 'pages/database.html',   zh: '数据库', en: 'Database' },
    { href: 'pages/eda.html',        zh: '数据分析', en: 'EDA' },
  ];

  var LANG = localStorage.getItem('lang') || 'zh';
  document.documentElement.setAttribute('lang', LANG);

  function t(zh, en) { return LANG === 'en' ? en : zh; }

  /* ---------- 构建顶部导航 ---------- */
  function buildNav() {
    var nav = document.createElement('nav');
    nav.className = 'site-nav';

    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = BASE + 'index.html';
    brand.innerHTML = '<span class="drop">&#128167;</span><span class="zh">水质健康 · 作品集</span><span class="en">Water Health · Portfolio</span>';
    nav.appendChild(brand);

    var links = document.createElement('div');
    links.className = 'links';
    var current = location.pathname.split('/').pop() || 'index.html';
    NAV.forEach(function (item) {
      var a = document.createElement('a');
      a.href = BASE + item.href;
      a.innerHTML = '<span class="zh">' + item.zh + '</span><span class="en">' + item.en + '</span>';
      if (item.href.split('/').pop() === current) a.className = 'active';
      links.appendChild(a);
    });
    nav.appendChild(links);

    var tools = document.createElement('div');
    tools.className = 'tools';

    var langBtn = document.createElement('button');
    langBtn.className = 'btn lang-btn';
    langBtn.setAttribute('aria-label', '切换语言 / Switch language');
    langBtn.textContent = LANG === 'en' ? '中' : 'EN';
    langBtn.addEventListener('click', function () {
      LANG = LANG === 'zh' ? 'en' : 'zh';
      localStorage.setItem('lang', LANG);
      document.documentElement.setAttribute('lang', LANG);
      langBtn.textContent = LANG === 'en' ? '中' : 'EN';
    });
    tools.appendChild(langBtn);

    var editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.innerHTML = '<span class="zh">开启编辑</span><span class="en">Edit</span>';
    editBtn.addEventListener('click', function () {
      var on = document.body.classList.toggle('editing');
      setEditable(on);
      editBtn.classList.toggle('on', on);
    });
    tools.appendChild(editBtn);

    nav.appendChild(tools);

    // 编辑态提示条
    var hint = document.createElement('div');
    hint.className = 'edit-hint';
    hint.innerHTML = '<span class="zh">编辑模式：改完可“导出 HTML”替换本地文件，或“保存草稿”下次续改。</span>' +
                     '<span class="en">Edit mode: use &quot;Export&quot; to save the page, or &quot;Save draft&quot; to continue later.</span> ' +
                     '<button class="btn btn-solid" data-act="export"><span class="zh">导出 HTML</span><span class="en">Export</span></button> ' +
                     '<button class="btn" data-act="draft"><span class="zh">保存草稿</span><span class="en">Save draft</span></button> ' +
                     '<button class="btn" data-act="cleardraft" style="display:none"><span class="zh">清除草稿</span><span class="en">Clear draft</span></button>';
    hint.querySelector('[data-act="export"]').addEventListener('click', exportHTML);
    hint.querySelector('[data-act="draft"]').addEventListener('click', saveDraft);
    hint.querySelector('[data-act="cleardraft"]').addEventListener('click', clearDraft);

    var host = document.body;
    host.insertBefore(hint, host.firstChild);
    host.insertBefore(nav, host.firstChild);
  }

  /* ---------- 编辑态 ---------- */
  function setEditable(on) {
    document.querySelectorAll('.editable').forEach(function (el) {
      if (on) el.setAttribute('contenteditable', 'true');
      else el.removeAttribute('contenteditable');
    });
  }

  /* ---------- 导出 HTML ---------- */
  function exportHTML() {
    var clone = document.documentElement.cloneNode(true);

    // 移除运行时注入的导航/编辑提示，避免导出后重复出现
    clone.querySelectorAll('.site-nav, .edit-hint').forEach(function (el) { el.remove(); });

    clone.querySelectorAll('[contenteditable]').forEach(function (el) {
      el.removeAttribute('contenteditable');
    });
    var body = clone.querySelector('body');
    if (body) body.classList.remove('editing');

    var html = '<!DOCTYPE html>\n' + clone.outerHTML;
    var name = location.pathname.split('/').pop() || 'index.html';
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 延迟释放，避免部分浏览器下载被中断
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* ---------- 草稿（localStorage） ---------- */
  function draftKey() { return 'draft:' + location.pathname; }

  function saveDraft() {
    var html = '';
    document.querySelectorAll('.editable').forEach(function (el) { html += el.innerHTML; });
    localStorage.setItem(draftKey(), html);
    alert(t('草稿已保存到本浏览器。', 'Draft saved to this browser.'));
    var btn = document.querySelector('[data-act="cleardraft"]');
    if (btn) btn.style.display = 'inline-block';
  }

  function clearDraft() {
    localStorage.removeItem(draftKey());
    var btn = document.querySelector('[data-act="cleardraft"]');
    if (btn) btn.style.display = 'none';
  }

  function restoreDraft() {
    var key = draftKey();
    var html = localStorage.getItem(key);
    if (!html) return;
    var els = document.querySelectorAll('.editable');
    if (els.length) {
      els[0].innerHTML = html;
      // 后续 .editable 清空，避免重复（草稿只存第一个内容容器）
      for (var i = 1; i < els.length; i++) els[i].innerHTML = '';
    }
    var btn = document.querySelector('[data-act="cleardraft"]');
    if (btn) btn.style.display = 'inline-block';
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildNav();
    restoreDraft();
  });
})();
