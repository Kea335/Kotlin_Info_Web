/* ============================================================
   KotlinAZ — Çalışmalar mühərriki
   Nəzəri (çoxvariantlı) və praktiki (kod yazma + avtomatik
   yoxlama) çalışmaları idarə edir.
   ============================================================ */
(function () {
  'use strict';

  var LS_HELL = 'kotlinaz:hell';     // həll edilmiş çalışmalar

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var state = {
    movzu: null,
    rejim: 'nezeri',       // nezeri | praktiki
    seviyye: 'hamisi',     // hamisi | junior | middle | senior
    index: 0,
    cavabVerildi: false,
    editorHazir: false
  };

  var hellEdilmis = yukleHell();
  var LEVEL_AD = { junior: 'Junior', middle: 'Middle', senior: 'Senior' };

  function yukleHell() {
    try { return JSON.parse(localStorage.getItem(LS_HELL) || '{}'); } catch (e) { return {}; }
  }
  function yazHell() {
    try { localStorage.setItem(LS_HELL, JSON.stringify(hellEdilmis)); } catch (e) { }
  }
  function hellIsaretle(id) {
    if (!hellEdilmis[id]) { hellEdilmis[id] = 1; yazHell(); }
  }

  function bank() { return window.KExercises || { topics: [] }; }
  function cariMovzu() {
    var t = bank().topics;
    if (!t.length) return null;
    for (var i = 0; i < t.length; i++) if (t[i].id === state.movzu) return t[i];
    return t[0];
  }

  /** Səviyyə filtrindən keçən çalışmalar */
  function siyahi() {
    var m = cariMovzu();
    if (!m) return [];
    var xam = (state.rejim === 'nezeri' ? m.nezeri : m.praktiki) || [];
    if (state.seviyye === 'hamisi') return xam;
    return xam.filter(function (x) { return x.level === state.seviyye; });
  }

  function calismaId(i) {
    var m = cariMovzu();
    return m ? m.id + '-' + (state.rejim === 'nezeri' ? 'n' : 'p') + '-' + i : '';
  }

  /* ---------- Başlıq hissəsi ---------- */
  function renderBasliq() {
    var m = cariMovzu();
    if (!m) return;

    var mSec = $('#exMovzu');
    if (mSec && !mSec.dataset.qurulub) {
      mSec.innerHTML = bank().topics.map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.title) + '</option>';
      }).join('');
      mSec.dataset.qurulub = '1';
    }
    if (mSec) mSec.value = m.id;

    $$('#exRejim .tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-rejim') === state.rejim);
    });
    $$('#exSeviyye .chip').forEach(function (c) {
      c.classList.toggle('active', c.getAttribute('data-level') === state.seviyye);
    });

    var s = siyahi();
    var hellSay = 0;
    for (var i = 0; i < s.length; i++) {
      var globalIndex = ((state.rejim === 'nezeri' ? m.nezeri : m.praktiki) || []).indexOf(s[i]);
      if (hellEdilmis[calismaId(globalIndex)]) hellSay++;
    }

    $('#exSayqac').textContent = s.length ? ('Çalışma ' + (state.index + 1) + ' / ' + s.length) : 'Çalışma yoxdur';
    $('#exHellSay').textContent = 'Həll edilib: ' + hellSay + ' / ' + s.length;
    var pct = s.length ? Math.round(hellSay / s.length * 100) : 0;
    $('#exFill').style.width = pct + '%';
  }

  /* ---------- Nəzəri çalışma ---------- */
  function renderNezeri() {
    var s = siyahi();
    var govde = $('#exBody');
    if (!s.length) { govde.innerHTML = '<p class="sr-empty">Bu səviyyədə çalışma yoxdur.</p>'; return; }
    if (state.index >= s.length) state.index = s.length - 1;

    var c = s[state.index];
    var herfler = ['A', 'B', 'C', 'D'];

    govde.innerHTML =
      '<div class="ex-head">' +
      '<span class="ex-level ' + c.level + '">' + (LEVEL_AD[c.level] || c.level) + '</span>' +
      '<span class="ex-tip">Nəzəri</span>' +
      '</div>' +
      '<h3 class="quiz-q">' + esc(c.q) + '</h3>' +
      (c.code ? '<div class="code-card" style="margin:0 0 16px"><pre class="code"><code>' +
        (window.KHighlight ? window.KHighlight.highlight(c.code) : esc(c.code)) + '</code></pre></div>' : '') +
      '<div class="quiz-opts" id="exOpts">' +
      c.opts.map(function (o, i) {
        return '<button class="quiz-opt" data-i="' + i + '">' +
          '<span class="letter">' + herfler[i] + '</span><span>' + esc(o) + '</span></button>';
      }).join('') +
      '</div>' +
      '<div class="quiz-exp" id="exExp"></div>';

    state.cavabVerildi = false;

    $('#exOpts').addEventListener('click', function (e) {
      var b = e.target.closest('.quiz-opt');
      if (!b || state.cavabVerildi) return;
      state.cavabVerildi = true;

      var secim = parseInt(b.getAttribute('data-i'), 10);
      $$('#exOpts .quiz-opt').forEach(function (x, i) {
        x.disabled = true;
        if (i === c.a) x.classList.add('correct');
        else if (i === secim) x.classList.add('wrong');
      });

      var m = cariMovzu();
      var globalIndex = (m.nezeri || []).indexOf(c);
      if (secim === c.a) hellIsaretle(calismaId(globalIndex));

      var bas = secim === c.a ? '&#10003; Doğrudur! ' : '&#10005; Düzgün cavab: ' + herfler[c.a] + '. ';
      var exp = $('#exExp');
      exp.innerHTML = '<b>' + bas + '</b>' + esc(c.exp);
      exp.classList.add('show');
      renderBasliq();
    });
  }

  /* ---------- Praktiki çalışma ---------- */
  var mounting = false, pending = null;

  function editorQur(kod, bitdiCb) {
    var host = $('#exEditorHost');
    if (!host) return;
    if (mounting) { pending = { kod: kod, cb: bitdiCb }; return; }
    mounting = true;
    pending = null;

    host.innerHTML = '';
    var el = document.createElement('code');
    el.id = 'exEditor';
    el.setAttribute('theme', window.KPlayground ? window.KPlayground.theme() : 'idea');
    el.setAttribute('data-target-platform', 'java');
    el.setAttribute('folded-button', 'false');
    el.textContent = kod;
    host.appendChild(el);

    var bitdi = false;
    function tamamla() {
      if (bitdi) return;
      bitdi = true;
      mounting = false;
      state.editorHazir = true;
      if (typeof bitdiCb === 'function') bitdiCb();
      if (pending) { var p = pending; pending = null; editorQur(p.kod, p.cb); }
    }

    try {
      var pr = window.KotlinPlayground('#exEditor', { callback: tamamla });
      if (pr && typeof pr.then === 'function') pr.then(tamamla, tamamla);
    } catch (e) {
      mounting = false;
      host.innerHTML = '<div class="pg-fallback"><p class="pg-fallback-title">Redaktor qurulmadı</p><p>' + esc(e.message) + '</p></div>';
      return;
    }
    setTimeout(tamamla, 8000);
  }

  function normallasdir(s) {
    return String(s || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(function (l) { return l.replace(/\s+$/, ''); })
      .join('\n')
      .replace(/\n+$/, '')
      .replace(/^\n+/, '');
  }

  function cixisNode() {
    return $('#exEditorHost .output-wrapper') || $('#exEditorHost .console-output');
  }
  function xetaNode() {
    return $('#exEditorHost .errors-output') || $('#exEditorHost .error-output');
  }

  /**
   * Kodu işlədib nəticəni tutur (Playground JetBrains serverində kompilyasiya edir).
   *
   * VACİB: kitabxananın nəticə bloklarına toxunmuruq — innerHTML-i təmizləmək
   * onun daxili strukturunu pozur və ikinci işlətmədə çıxış itir. Bunun əvəzinə
   * işlətmə başlayanda kitabxananın özünün nəticəni sıfırlamasını gözləyir,
   * yalnız ondan sonra gələn dəyəri qəbul edirik.
   */
  function isletVeTut() {
    return new Promise(function (resolve) {
      var host = $('#exEditorHost');
      var btn = host ? host.querySelector('.run-button') : null;
      if (!btn) { resolve({ xeta: 'Redaktor hazır deyil' }); return; }

      function oxu() {
        var out = cixisNode();
        var err = xetaNode();
        return {
          metn: out ? out.innerText.trim() : '',
          xeta: err ? err.innerText.trim() : ''
        };
      }

      var evvelki = oxu();
      // Əvvəlki nəticə boşdursa sıfırlanmanı gözləməyə ehtiyac yoxdur
      var sifirlandi = (evvelki.metn === '' && evvelki.xeta === '');

      var bitdi = false;
      function bitir(netice) {
        if (bitdi) return;
        bitdi = true;
        obs.disconnect();
        clearInterval(iv);
        clearTimeout(vaxt);
        resolve(netice);
      }

      function yoxla() {
        var c = oxu();
        if (!sifirlandi) {
          // Kitabxana yeni işlətmədən əvvəl köhnə nəticəni silir
          if (c.metn === '' && c.xeta === '') sifirlandi = true;
          else if (c.metn !== evvelki.metn || c.xeta !== evvelki.xeta) sifirlandi = true;
          else return;
        }
        if (c.xeta) bitir({ netice: '', xeta: c.xeta });
        else if (c.metn) bitir({ netice: c.metn, xeta: '' });
      }

      var obs = new MutationObserver(yoxla);
      obs.observe(host, { childList: true, subtree: true, characterData: true });
      var iv = setInterval(yoxla, 400);
      var vaxt = setTimeout(function () {
        bitir({ xeta: 'Vaxt bitdi — server cavab vermədi. Yenidən cəhd et.' });
      }, 35000);

      btn.click();
    });
  }

  function neticeGoster(hal, basliq, detal) {
    var el = $('#exNetice');
    if (!el) return;
    el.className = 'ex-netice ' + hal + ' show';
    el.innerHTML = '<div class="ex-netice-bas">' + basliq + '</div>' +
      (detal ? '<div class="ex-netice-detal">' + detal + '</div>' : '');
  }

  function renderPraktiki() {
    var s = siyahi();
    var govde = $('#exBody');
    if (!s.length) { govde.innerHTML = '<p class="sr-empty">Bu səviyyədə çalışma yoxdur.</p>'; return; }
    if (state.index >= s.length) state.index = s.length - 1;

    var c = s[state.index];
    var m = cariMovzu();
    var globalIndex = (m.praktiki || []).indexOf(c);
    var artiqHell = !!hellEdilmis[calismaId(globalIndex)];

    govde.innerHTML =
      '<div class="ex-head">' +
      '<span class="ex-level ' + c.level + '">' + (LEVEL_AD[c.level] || c.level) + '</span>' +
      '<span class="ex-tip">Praktiki</span>' +
      (artiqHell ? '<span class="ex-hell-nisan">&#10003; həll edilib</span>' : '') +
      '</div>' +
      '<h3 class="quiz-q">' + esc(c.tapsiriq) + '</h3>' +
      '<div class="ex-gozlenilen"><span>Gözlənilən nəticə:</span><pre>' + esc(c.gozlenilen) + '</pre></div>' +
      '<div id="exEditorHost" class="pg-host"><div class="pg-loading">Redaktor yüklənir…</div></div>' +
      '<div class="ex-actions">' +
      '<button class="btn btn-primary btn-sm" id="exYoxla">Yoxla</button>' +
      '<button class="chip" id="exIpucu">İpucu</button>' +
      '<button class="chip" id="exHell">Həlli göstər</button>' +
      '<button class="chip" id="exSifirla">Başlanğıca qaytar</button>' +
      '</div>' +
      '<div class="quiz-exp" id="exIpucuMetn"></div>' +
      '<div class="ex-netice" id="exNetice"></div>';

    state.editorHazir = false;

    if (window.KPlayground) {
      window.KPlayground.ensureLib().then(function (ok) {
        if (!ok) {
          $('#exEditorHost').innerHTML =
            '<div class="pg-fallback"><p class="pg-fallback-title">Kod redaktoru yüklənmədi</p>' +
            '<p>Praktiki çalışmalar internet bağlantısı tələb edir — kod JetBrains serverlərində kompilyasiya olunur.</p></div>';
          return;
        }
        editorQur(c.starter);
      });
    }

    $('#exYoxla').addEventListener('click', function () {
      if (!state.editorHazir) { neticeGoster('bad', 'Redaktor hələ hazır deyil', 'Bir neçə saniyə gözlə.'); return; }
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'Yoxlanılır…';
      neticeGoster('loading', 'Kod serverdə işlədilir…', 'Bu, adətən 3–10 saniyə çəkir.');

      isletVeTut().then(function (r) {
        btn.disabled = false;
        btn.textContent = 'Yoxla';

        if (r.xeta) {
          neticeGoster('bad', '&#10005; Kod işləmədi',
            '<pre>' + esc(r.xeta.slice(0, 600)) + '</pre>');
          return;
        }
        var alinan = normallasdir(r.netice);
        var gozlenilen = normallasdir(c.gozlenilen);

        if (alinan === gozlenilen) {
          hellIsaretle(calismaId(globalIndex));
          renderBasliq();
          neticeGoster('ok', '&#10003; Düzdür! Nəticə tam uyğundur.',
            '<pre>' + esc(alinan) + '</pre>');
        } else {
          neticeGoster('bad', '&#10005; Nəticə uyğun gəlmədi',
            '<div class="ex-muqayise">' +
            '<div><b>Gözlənilən</b><pre>' + esc(gozlenilen) + '</pre></div>' +
            '<div><b>Sənin nəticən</b><pre>' + esc(alinan || '(boş)') + '</pre></div>' +
            '</div>');
        }
      });
    });

    $('#exIpucu').addEventListener('click', function () {
      var el = $('#exIpucuMetn');
      el.innerHTML = '<b>İpucu: </b>' + esc(c.ipucu || 'Bu çalışma üçün ipucu yoxdur.');
      el.classList.add('show');
    });

    $('#exHell').addEventListener('click', function () {
      if (state.editorHazir) editorQur(c.hell);
      neticeGoster('info', 'Model həll redaktora yükləndi',
        'Kodu oxu, sonra «Yoxla» düyməsi ilə işlət və nəticəni gör.');
    });

    $('#exSifirla').addEventListener('click', function () {
      if (state.editorHazir) editorQur(c.starter);
      var n = $('#exNetice');
      if (n) n.className = 'ex-netice';
    });
  }

  /* ---------- Ümumi render ---------- */
  function render() {
    if (!bank().topics.length) return;
    if (!state.movzu) state.movzu = bank().topics[0].id;
    renderBasliq();
    if (state.rejim === 'nezeri') renderNezeri(); else renderPraktiki();
  }

  /* ---------- İdarəetmə ---------- */
  function initUI() {
    var kok = $('#calismalar');
    if (!kok) return;

    var mSec = $('#exMovzu');
    if (mSec) {
      mSec.addEventListener('change', function () {
        state.movzu = this.value;
        state.index = 0;
        render();
      });
    }

    $('#exRejim').addEventListener('click', function (e) {
      var b = e.target.closest('.tab-btn');
      if (!b) return;
      state.rejim = b.getAttribute('data-rejim');
      state.index = 0;
      render();
    });

    $('#exSeviyye').addEventListener('click', function (e) {
      var c = e.target.closest('.chip');
      if (!c) return;
      state.seviyye = c.getAttribute('data-level');
      state.index = 0;
      render();
    });

    $('#exEvvelki').addEventListener('click', function () {
      if (state.index > 0) { state.index--; render(); }
    });
    $('#exNovbeti').addEventListener('click', function () {
      if (state.index < siyahi().length - 1) { state.index++; render(); }
    });

    render();
  }

  function activate(sectionId) {
    if (sectionId === 'calismalar') render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

  window.KPractice = { activate: activate };
})();
