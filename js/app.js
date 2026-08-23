/* ============================================================
   KotlinAZ - esas tetbiq mentiqi
   Naviqasiya, tema, axtaris, kod bloklari, tereqqi izleme
   ============================================================ */
(function () {
  'use strict';

  var LS_THEME = 'kotlinaz:theme';
  var LS_VISITED = 'kotlinaz:visited';

  var sections = [];     // { id, title, group, el }
  var searchIndex = [];  // { id, sectionTitle, heading, text }
  var currentId = null;
  var visited = new Set();

  /* ---------- Kicik komekciler ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { /* privat rejim - sessizce kec */ }
    return null;
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  /* ---------- 1. Tema ---------- */
  function initTheme() {
    var saved = store(LS_THEME);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    $('#themeBtn').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store(LS_THEME, next);
      toast(next === 'dark' ? 'Qaranlıq tema' : 'İşıqlı tema');
    });
  }

  /* ---------- 2. Bolmeleri toplama + yan panel ---------- */
  function collectSections() {
    sections = $$('.section').map(function (el) {
      return {
        id: el.id,
        title: el.getAttribute('data-title') || el.id,
        group: el.getAttribute('data-group') || 'Bölmələr',
        el: el
      };
    });
  }

  function buildSidebar() {
    var nav = $('#sidebarNav');
    var groups = [];
    var byGroup = {};

    sections.forEach(function (s, idx) {
      if (!byGroup[s.group]) { byGroup[s.group] = []; groups.push(s.group); }
      byGroup[s.group].push({ s: s, idx: idx });
    });

    var html = '';
    groups.forEach(function (g) {
      html += '<div class="nav-group">';
      html += '<p class="nav-group-title">' + g + '</p>';
      byGroup[g].forEach(function (item) {
        var num = String(item.idx).padStart(2, '0');
        html += '<a class="nav-link" href="#' + item.s.id + '" data-id="' + item.s.id + '">' +
          '<span class="nav-num">' + num + '</span>' +
          '<span class="nav-text">' + item.s.title + '</span>' +
          '<span class="nav-done">&#10003;</span>' +
          '</a>';
      });
      html += '</div>';
    });
    nav.innerHTML = html;
  }

  /* ---------- 3. Marsrutlasma ---------- */
  function showSection(id, opts) {
    opts = opts || {};
    var target = sections.filter(function (s) { return s.id === id; })[0];
    if (!target) target = sections[0];

    sections.forEach(function (s) { s.el.classList.toggle('active', s.id === target.id); });
    currentId = target.id;

    $$('.nav-link').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-id') === target.id);
    });

    markVisited(target.id);
    buildPageNav(target.id);
    document.title = target.title + ' · KotlinAZ — Kotlin dili üzrə təlim';

    if (!opts.noScroll) window.scrollTo({ top: 0, behavior: 'auto' });
    closeSidebar();

    // Aktiv bolmenin kod bloklarini rengle (tenbel isleme)
    if (window.KHighlight) window.KHighlight.highlightAll(target.el);
    // Bolmeye xas demolari isek sal
    if (window.KDemos) window.KDemos.activate(target.id);
  }

  function routeFromHash() {
    var id = (location.hash || '').replace('#', '');
    showSection(id || sections[0].id, { noScroll: !id });
  }

  function buildPageNav(id) {
    var idx = sections.findIndex(function (s) { return s.id === id; });
    var sec = sections[idx];
    if (!sec) return;
    var nav = $('.page-nav', sec.el);
    if (!nav) return;

    var prev = sections[idx - 1];
    var next = sections[idx + 1];
    var prevBtn = $('.pn-btn.prev', nav);
    var nextBtn = $('.pn-btn.next', nav);

    if (prev) {
      prevBtn.hidden = false;
      $('.pn-title', prevBtn).textContent = prev.title;
      prevBtn.setAttribute('data-go', prev.id);
    } else prevBtn.hidden = true;

    if (next) {
      nextBtn.hidden = false;
      $('.pn-title', nextBtn).textContent = next.title;
      nextBtn.setAttribute('data-go', next.id);
    } else nextBtn.hidden = true;
  }

  /* ---------- 4. Tereqqi izleme ---------- */
  function loadVisited() {
    var raw = store(LS_VISITED);
    if (raw) {
      try { JSON.parse(raw).forEach(function (id) { visited.add(id); }); } catch (e) { }
    }
  }

  function markVisited(id) {
    visited.add(id);
    store(LS_VISITED, JSON.stringify(Array.from(visited)));
    renderProgress();
  }

  function renderProgress() {
    $$('.nav-link').forEach(function (a) {
      a.classList.toggle('visited', visited.has(a.getAttribute('data-id')));
    });
    var total = sections.length;
    var done = sections.filter(function (s) { return visited.has(s.id); }).length;
    var pct = total ? Math.round(done / total * 100) : 0;
    var fill = $('#sidebarProgressFill');
    var lbl = $('#sidebarProgressText');
    if (fill) fill.style.width = pct + '%';
    if (lbl) lbl.textContent = done + ' / ' + total;
  }

  function resetProgress() {
    visited.clear();
    store(LS_VISITED, '[]');
    renderProgress();
    toast('Tərəqqi sıfırlandı');
  }

  /* ---------- 5. Kod bloklari: kopyala + isle ---------- */
  function initCodeBlocks() {
    document.addEventListener('click', function (e) {
      var copyBtn = e.target.closest('.code-btn.copy');
      if (copyBtn) {
        var card = copyBtn.closest('.code-card');
        var code = $('pre.code code', card);
        var raw = code.getAttribute('data-raw') || code.textContent;
        var done = function () {
          var old = copyBtn.innerHTML;
          copyBtn.innerHTML = '&#10003; Kopyalandı';
          copyBtn.classList.add('copied');
          setTimeout(function () { copyBtn.innerHTML = old; copyBtn.classList.remove('copied'); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(raw).then(done).catch(function () { fallbackCopy(raw); done(); });
        } else { fallbackCopy(raw); done(); }
        return;
      }

      var runBtn = e.target.closest('.code-btn.run');
      if (runBtn) {
        var card2 = runBtn.closest('.code-card');
        var out = $('.code-out', card2);
        if (!out) return;
        if (out.classList.contains('show')) {
          out.classList.remove('show');
          runBtn.innerHTML = '&#9654; İşlə';
        } else {
          typeOutput(out, card2.getAttribute('data-output') || '');
          out.classList.add('show');
          runBtn.innerHTML = '&#10005; Gizlə';
        }
      }
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { }
    document.body.removeChild(ta);
  }

  function typeOutput(outEl, text) {
    var pre = $('pre', outEl);
    if (!pre) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || text.length > 400) { pre.textContent = text; return; }
    pre.textContent = '';
    var i = 0;
    clearInterval(pre._timer);
    pre._timer = setInterval(function () {
      pre.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(pre._timer);
    }, 12);
  }

  /* ---------- 6. Tab-lar ---------- */
  function initTabs() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab-btn');
      if (!btn) return;
      var tabs = btn.closest('.tabs');
      var name = btn.getAttribute('data-tab');
      $$('.tab-btn', tabs).forEach(function (b) { b.classList.toggle('active', b === btn); });
      $$('.tab-panel', tabs).forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-tab') === name);
      });
      if (window.KHighlight) window.KHighlight.highlightAll(tabs);
    });
  }

  /* ---------- 7. Axtaris ---------- */
  function buildSearchIndex() {
    sections.forEach(function (s) {
      // Bolme basligi
      searchIndex.push({
        id: s.id, sectionTitle: s.title, heading: s.title,
        text: ($('.lead', s.el) || {}).textContent || ''
      });
      // Alt basliqlar
      $$('h3, h4', s.el).forEach(function (h) {
        var snippet = '';
        var node = h.nextElementSibling;
        var hops = 0;
        while (node && hops < 3) {
          if (node.tagName === 'P' || node.tagName === 'UL') { snippet += ' ' + node.textContent; }
          if (/^H[2-4]$/.test(node.tagName)) break;
          node = node.nextElementSibling;
          hops++;
        }
        searchIndex.push({
          id: s.id, sectionTitle: s.title,
          heading: h.textContent.trim(),
          text: snippet.trim().slice(0, 220)
        });
      });
    });
  }

  function fold(str) {
    // Azərbaycan hərflərini latın ekvivalentinə çevirir ki, axtarış həmişə işləsin
    return str
      .replace(/[İIı]/g, 'i')
      .toLowerCase()
      .replace(/\u0307/g, '')
      .replace(/ə/g, 'e').replace(/ş/g, 's').replace(/ç/g, 'c')
      .replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u');
  }

  function searchQuery(q) {
    var fq = fold(q.trim());
    if (!fq) return [];
    var terms = fq.split(/\s+/);
    var hits = [];

    searchIndex.forEach(function (item) {
      var hay = fold(item.heading + ' ' + item.text + ' ' + item.sectionTitle);
      var score = 0, all = true;
      terms.forEach(function (t) {
        var inHead = fold(item.heading).indexOf(t);
        var inBody = hay.indexOf(t);
        if (inBody === -1) { all = false; return; }
        score += inHead === 0 ? 60 : inHead > -1 ? 35 : 10;
      });
      if (all) hits.push({ item: item, score: score });
    });

    hits.sort(function (a, b) { return b.score - a.score; });
    return hits.slice(0, 24).map(function (h) { return h.item; });
  }

  function renderResults(list, q) {
    var box = $('#searchResults');
    if (!list.length) {
      box.innerHTML = '<div class="sr-empty">Nəticə tapılmadı. Başqa açar söz sınayın.</div>';
      return;
    }
    var fq = fold(q);
    box.innerHTML = list.map(function (r, i) {
      var head = r.heading;
      var idx = fold(head).indexOf(fq.split(/\s+/)[0]);
      if (idx > -1) {
        var len = fq.split(/\s+/)[0].length;
        head = head.slice(0, idx) + '<mark>' + head.slice(idx, idx + len) + '</mark>' + head.slice(idx + len);
      }
      return '<button class="sr-item' + (i === 0 ? ' sel' : '') + '" data-go="' + r.id + '">' +
        '<div class="sr-sec">' + r.sectionTitle + '</div>' +
        '<div class="sr-title">' + head + '</div>' +
        (r.text ? '<div class="sr-snip">' + r.text + '</div>' : '') +
        '</button>';
    }).join('');
  }

  function openSearch() {
    var m = $('#searchModal');
    m.classList.add('open');
    var input = $('#searchInput');
    input.value = '';
    input.focus();
    $('#searchResults').innerHTML =
      '<div class="sr-empty">Mövzu, açar söz və ya kod adı yazın &mdash; məs. <b>coroutine</b>, <b>data class</b>, <b>null</b></div>';
  }

  function closeSearch() { $('#searchModal').classList.remove('open'); }

  function initSearch() {
    $('#searchTrigger').addEventListener('click', openSearch);
    $('#searchModal .modal-bg').addEventListener('click', closeSearch);

    $('#searchInput').addEventListener('input', function (e) {
      var q = e.target.value;
      if (!q.trim()) {
        $('#searchResults').innerHTML = '<div class="sr-empty">Mövzu, açar söz və ya kod adı yazın.</div>';
        return;
      }
      renderResults(searchQuery(q), q);
    });

    $('#searchResults').addEventListener('click', function (e) {
      var b = e.target.closest('.sr-item');
      if (!b) return;
      location.hash = b.getAttribute('data-go');
      closeSearch();
    });

    $('#searchInput').addEventListener('keydown', function (e) {
      var items = $$('.sr-item');
      var sel = items.findIndex(function (x) { return x.classList.contains('sel'); });
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        var next = e.key === 'ArrowDown'
          ? Math.min(sel + 1, items.length - 1)
          : Math.max(sel - 1, 0);
        items.forEach(function (x, i) { x.classList.toggle('sel', i === next); });
        items[next].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var pick = items[sel > -1 ? sel : 0];
        if (pick) { location.hash = pick.getAttribute('data-go'); closeSearch(); }
      }
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        $('#searchModal').classList.contains('open') ? closeSearch() : openSearch();
      }
      if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); openSearch();
      }
      if (e.key === 'Escape') { closeSearch(); closeSidebar(); }
    });
  }

  /* ---------- 8. Yan panel (mobil) ---------- */
  function openSidebar() { $('#sidebar').classList.add('open'); $('#overlay').classList.add('show'); }
  function closeSidebar() { $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show'); }

  function initSidebar() {
    $('#menuBtn').addEventListener('click', function () {
      $('#sidebar').classList.contains('open') ? closeSidebar() : openSidebar();
    });
    $('#overlay').addEventListener('click', closeSidebar);
    var reset = $('#resetProgress');
    if (reset) reset.addEventListener('click', resetProgress);
  }

  /* ---------- 9. Skrol effektleri ---------- */
  function initScroll() {
    var bar = $('#progressBar');
    var top = $('#toTop');
    var ticking = false;

    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct + '%';
      top.classList.toggle('show', h.scrollTop > 500);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    update();
  }

  /* ---------- 10. Qlobal keclerin idaresi ---------- */
  function initGlobalNav() {
    document.addEventListener('click', function (e) {
      var go = e.target.closest('[data-go]');
      if (go && !go.classList.contains('sr-item')) {
        e.preventDefault();
        location.hash = go.getAttribute('data-go');
      }
    });
    window.addEventListener('hashchange', routeFromHash);
  }

  /* ---------- Basladici ---------- */
  function init() {
    initTheme();
    collectSections();
    buildSidebar();
    loadVisited();
    renderProgress();
    buildSearchIndex();
    initSidebar();
    initSearch();
    initCodeBlocks();
    initTabs();
    initScroll();
    initGlobalNav();
    routeFromHash();

    // Il gostericisini yenile
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.KApp = { toast: toast, show: showSection };
})();
