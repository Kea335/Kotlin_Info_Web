/* ============================================================
   KotlinAZ — interaktiv demolar
   Null-safety, kolleksiya zənciri, coroutine, when,
   tip çıxarışı, scope funksiyaları və bilik testi.
   ============================================================ */
(function () {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ============================================================
     1. NULL SAFETY DEMOSU
     ============================================================ */
  var NS_OPS = [
    {
      id: 'direct', label: 'ad.length',
      run: function () {
        return {
          kind: 'compile',
          msg: 'Only safe (?.) or non-null asserted (!!.) calls are allowed\non a nullable receiver of type String?',
          note: 'Kotlin bu kodu işə salmağa belə imkan vermir. Xəta çalışma vaxtında yox, kompilyasiya vaxtında tutulur — yəni istifadəçi onu heç vaxt görməyəcək.'
        };
      }
    },
    {
      id: 'safe', label: 'ad?.length',
      run: function (isNull) {
        return isNull
          ? { kind: 'ok', msg: 'null', note: 'Safe call operatoru (?.): receiver null-dursa çağırış tamamilə atlanır və nəticə null olur. Çökmə baş vermir.' }
          : { kind: 'ok', msg: '6', note: 'Receiver null deyil, ona görə length adi qaydada hesablanır.' };
      }
    },
    {
      id: 'bang', label: 'ad!!.length',
      run: function (isNull) {
        return isNull
          ? {
            kind: 'crash',
            msg: 'Exception in thread "main"\nkotlin.KotlinNullPointerException\n\tat MainKt.main(Main.kt:4)',
            note: '!! operatoru «mən zəmanət verirəm ki, null deyil» deməkdir. Səhv etsən — NPE. Mümkün qədər ondan qaçın.'
          }
          : { kind: 'ok', msg: '6', note: 'Bu dəfə dəyər null deyildi, ona görə işlədi. Amma !! yenə də risklidir — növbəti dəfə null ola bilər.' };
      }
    },
    {
      id: 'elvis', label: 'ad?.length ?: 0',
      run: function (isNull) {
        return isNull
          ? { kind: 'ok', msg: '0', note: 'Elvis operatoru (?:) sol tərəf null olduqda sağ tərəfdəki ehtiyat dəyəri qaytarır.' }
          : { kind: 'ok', msg: '6', note: 'Sol tərəf null olmadığı üçün elvisin sağ tərəfi heç işləmir.' };
      }
    },
    {
      id: 'let', label: 'ad?.let { it.length }',
      run: function (isNull) {
        return isNull
          ? { kind: 'ok', msg: 'null', note: 'let bloku yalnız receiver null olmayanda işlənir. Null olanda bütün blok atlanır.' }
          : { kind: 'ok', msg: '6', note: 'Blok içində it artıq smart-cast olunmuş String tipidir — əlavə ? işarəsinə ehtiyac yoxdur.' };
      }
    },
    {
      id: 'ifcheck', label: 'if (ad != null) ad.length',
      run: function (isNull) {
        return isNull
          ? { kind: 'ok', msg: '(heç nə çap olunmadı)', note: 'Şərti yoxlama false verdi, blok işlənmədi.' }
          : { kind: 'ok', msg: '6', note: 'SMART CAST: null yoxlamasından sonra kompilyator ad-ı avtomatik String kimi görür — ?. yazmağa ehtiyac qalmır.' };
      }
    }
  ];

  function initNullSafety() {
    var root = $('#nsDemo');
    if (!root) return;

    var state = { isNull: true, op: 'direct' };
    var chips = $('#nsOps');
    chips.innerHTML = NS_OPS.map(function (o, i) {
      return '<button class="chip' + (i === 0 ? ' active' : '') + '" data-op="' + o.id + '">' + esc(o.label) + '</button>';
    }).join('');

    function render() {
      var op = NS_OPS.filter(function (o) { return o.id === state.op; })[0];
      var res = op.run(state.isNull);

      $('#nsCode').innerHTML =
        '<span class="t-key">val</span> ad<span class="t-pun">:</span> <span class="t-typ">String</span><span class="t-pun">?</span> <span class="t-pun">=</span> ' +
        (state.isNull ? '<span class="t-key">null</span>' : '<span class="t-str">"Kotlin"</span>') + '\n' +
        '<span class="t-fn">println</span><span class="t-pun">(</span>' + esc(op.label) + '<span class="t-pun">)</span>';

      var cls = res.kind === 'ok' ? 'ok' : 'bad';
      var head = res.kind === 'compile' ? 'KOMPİLYASİYA XƏTASI'
        : res.kind === 'crash' ? 'ÇALIŞMA VAXTI ÇÖKMƏSİ'
          : 'NƏTİCƏ';

      $('#nsOut').innerHTML =
        '<span class="muted">' + head + '</span>\n<span class="' + cls + '">' + esc(res.msg) + '</span>';
      $('#nsNote').innerHTML = '<b>Nə baş verdi?</b> ' + esc(res.note);
      $('#nsValueLabel').textContent = 'ad = ' + (state.isNull ? 'null' : '"Kotlin"');
    }

    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      state.op = b.getAttribute('data-op');
      $$('.chip', chips).forEach(function (c) { c.classList.toggle('active', c === b); });
      render();
    });

    $('#nsToggle').addEventListener('change', function (e) {
      state.isNull = !e.target.checked;
      render();
    });

    render();
  }

  /* ============================================================
     2. KOLLEKSİYA ZƏNCİRİ QURUCUSU
     ============================================================ */
  var COL_OPS = [
    { id: 'filter', label: '.filter { it > 3 }', apply: function (a) { return a.filter(function (x) { return x > 3; }); }, terminal: false },
    { id: 'map', label: '.map { it * 2 }', apply: function (a) { return a.map(function (x) { return x * 2; }); }, terminal: false },
    { id: 'sorted', label: '.sorted()', apply: function (a) { return a.slice().sort(function (x, y) { return x - y; }); }, terminal: false },
    { id: 'reversed', label: '.reversed()', apply: function (a) { return a.slice().reverse(); }, terminal: false },
    { id: 'distinct', label: '.distinct()', apply: function (a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }, terminal: false },
    { id: 'take', label: '.take(3)', apply: function (a) { return a.slice(0, 3); }, terminal: false },
    { id: 'drop', label: '.drop(2)', apply: function (a) { return a.slice(2); }, terminal: false },
    { id: 'sum', label: '.sum()', apply: function (a) { return a.reduce(function (s, x) { return s + x; }, 0); }, terminal: true },
    { id: 'average', label: '.average()', apply: function (a) { return a.length ? (a.reduce(function (s, x) { return s + x; }, 0) / a.length) : 'NaN'; }, terminal: true },
    { id: 'max', label: '.maxOrNull()', apply: function (a) { return a.length ? Math.max.apply(null, a) : 'null'; }, terminal: true },
    { id: 'count', label: '.count()', apply: function (a) { return a.length; }, terminal: true },
    { id: 'join', label: '.joinToString()', apply: function (a) { return '"' + a.join(', ') + '"'; }, terminal: true }
  ];

  function initCollections() {
    var root = $('#colDemo');
    if (!root) return;

    var BASE = [5, 3, 8, 3, 1, 9, 2, 7];
    var chain = ['filter', 'map'];

    var palette = $('#colPalette');
    palette.innerHTML = COL_OPS.map(function (o) {
      return '<button class="chip" data-op="' + o.id + '">' + esc(o.label) + '</button>';
    }).join('');

    function fmt(v) {
      if (Array.isArray(v)) return '[' + v.join(', ') + ']';
      if (typeof v === 'number' && !Number.isInteger(v)) return v.toFixed(2);
      return String(v);
    }

    function opById(id) {
      return COL_OPS.filter(function (x) { return x.id === id; })[0];
    }

    function render() {
      $$('.chip', palette).forEach(function (c) {
        c.classList.toggle('active', chain.indexOf(c.getAttribute('data-op')) > -1);
      });

      // Kod görüntüsü
      var kod = '<span class="t-key">val</span> reqemler <span class="t-pun">=</span> <span class="t-fn">listOf</span><span class="t-pun">(</span>' +
        BASE.map(function (n) { return '<span class="t-num">' + n + '</span>'; }).join('<span class="t-pun">, </span>') +
        '<span class="t-pun">)</span>\n\n<span class="t-key">val</span> netice <span class="t-pun">=</span> reqemler';
      chain.forEach(function (id) { kod += '\n    ' + esc(opById(id).label); });
      kod += '\n\n<span class="t-fn">println</span><span class="t-pun">(</span>netice<span class="t-pun">)</span>';
      $('#colCode').innerHTML = kod;

      // Addım-addım aralıq nəticələr
      var cur = BASE.slice();
      var steps = ['<div class="chain-step on"><span class="chain-op">listOf(…)</span><span class="chain-val">' + fmt(cur) + '</span></div>'];
      var bitdi = false;

      chain.forEach(function (id) {
        var o = opById(id);
        if (bitdi) {
          steps.push('<div class="chain-step"><span class="chain-op">' + esc(o.label) + '</span>' +
            '<span class="chain-val" style="color:var(--err)">Terminal əməliyyatdan sonra zəncir davam edə bilməz</span></div>');
          return;
        }
        cur = o.apply(cur);
        if (o.terminal) bitdi = true;
        steps.push('<div class="chain-step on"><span class="chain-op">' + esc(o.label) + '</span>' +
          '<span class="chain-val">' + esc(fmt(cur)) + '</span></div>');
      });

      $('#colSteps').innerHTML = steps.join('');
      $('#colResult').innerHTML = '<span class="muted">nəticə =</span> <span class="hl">' + esc(fmt(cur)) + '</span>';
    }

    palette.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var id = b.getAttribute('data-op');
      var pos = chain.indexOf(id);
      if (pos > -1) chain.splice(pos, 1); else chain.push(id);
      render();
    });

    $('#colClear').addEventListener('click', function () { chain = []; render(); });
    render();
  }

  /* ============================================================
     3. COROUTINE VİZUALİZATORU
     ============================================================ */
  var coroState = { running: false, timer: null, mode: 'sequential' };

  function initCoroutines() {
    var root = $('#coroDemo');
    if (!root) return;

    var TASKS = [
      { name: 'apiCagirisi', dur: 1500 },
      { name: 'bazaSorgusu', dur: 1000 },
      { name: 'faylOxuma', dur: 800 }
    ];

    function buildLanes() {
      $('#coroTrack').innerHTML = TASKS.map(function (t, i) {
        return '<div class="coro-lane">' +
          '<span class="coro-name">' + esc(t.name) + '</span>' +
          '<div class="coro-bar-bg"><div class="coro-bar" id="coroBar' + i + '"></div></div>' +
          '</div>';
      }).join('');
    }

    function renderCode() {
      if (coroState.mode === 'sequential') {
        $('#coroCode').innerHTML =
          '<span class="t-com">// Ardıcıl — hər biri o birini gözləyir</span>\n' +
          '<span class="t-key">suspend fun</span> <span class="t-fn">yukle</span><span class="t-pun">()</span> <span class="t-pun">{</span>\n' +
          '    <span class="t-key">val</span> a <span class="t-pun">=</span> <span class="t-fn">apiCagirisi</span><span class="t-pun">()</span>   <span class="t-com">// 1500 ms</span>\n' +
          '    <span class="t-key">val</span> b <span class="t-pun">=</span> <span class="t-fn">bazaSorgusu</span><span class="t-pun">()</span>   <span class="t-com">// 1000 ms</span>\n' +
          '    <span class="t-key">val</span> c <span class="t-pun">=</span> <span class="t-fn">faylOxuma</span><span class="t-pun">()</span>     <span class="t-com">// 800 ms</span>\n' +
          '<span class="t-pun">}</span> <span class="t-com">// cəmi ~3300 ms</span>';
      } else {
        $('#coroCode').innerHTML =
          '<span class="t-com">// Paralel — hamısı eyni anda başlayır</span>\n' +
          '<span class="t-key">suspend fun</span> <span class="t-fn">yukle</span><span class="t-pun">()</span> <span class="t-pun">=</span> <span class="t-fn">coroutineScope</span> <span class="t-pun">{</span>\n' +
          '    <span class="t-key">val</span> a <span class="t-pun">=</span> <span class="t-fn">async</span> <span class="t-pun">{</span> <span class="t-fn">apiCagirisi</span><span class="t-pun">()</span> <span class="t-pun">}</span>\n' +
          '    <span class="t-key">val</span> b <span class="t-pun">=</span> <span class="t-fn">async</span> <span class="t-pun">{</span> <span class="t-fn">bazaSorgusu</span><span class="t-pun">()</span> <span class="t-pun">}</span>\n' +
          '    <span class="t-key">val</span> c <span class="t-pun">=</span> <span class="t-fn">async</span> <span class="t-pun">{</span> <span class="t-fn">faylOxuma</span><span class="t-pun">()</span> <span class="t-pun">}</span>\n' +
          '    <span class="t-fn">listOf</span><span class="t-pun">(</span>a<span class="t-pun">.</span><span class="t-fn">await</span><span class="t-pun">(),</span> b<span class="t-pun">.</span><span class="t-fn">await</span><span class="t-pun">(),</span> c<span class="t-pun">.</span><span class="t-fn">await</span><span class="t-pun">())</span>\n' +
          '<span class="t-pun">}</span> <span class="t-com">// cəmi ~1500 ms</span>';
      }
    }

    function reset() {
      clearInterval(coroState.timer);
      coroState.running = false;
      buildLanes();
      $('#coroTimer').textContent = '0 ms';
      $('#coroVerdict').innerHTML = '<span class="muted">Başla düyməsini basın</span>';
      $('#coroRun').textContent = 'Başla';
    }

    function start() {
      if (coroState.running) { reset(); return; }
      buildLanes();
      coroState.running = true;
      $('#coroRun').textContent = 'Dayandır';

      var SPEED = 1.6;   // simulyasiyanı bir qədər sürətləndiririk
      var starts = [];
      if (coroState.mode === 'sequential') {
        var acc = 0;
        TASKS.forEach(function (t) { starts.push(acc); acc += t.dur; });
      } else {
        TASKS.forEach(function () { starts.push(0); });
      }

      var total = coroState.mode === 'sequential'
        ? TASKS.reduce(function (s, t) { return s + t.dur; }, 0)
        : Math.max.apply(null, TASKS.map(function (t) { return t.dur; }));

      var t0 = performance.now();

      // setInterval — requestAnimationFrame-dən fərqli olaraq fon tabında da
      // işləyir, ona görə animasiya heç vaxt yarımçıq qalmır.
      function frame() {
        var el = (performance.now() - t0) * SPEED;
        TASKS.forEach(function (t, i) {
          var bar = $('#coroBar' + i);
          if (!bar) return;
          var local = el - starts[i];
          var pct = Math.max(0, Math.min(1, local / t.dur));
          bar.style.width = (pct * 100) + '%';
          if (pct > 0.18) bar.textContent = Math.round(Math.min(local, t.dur)) + ' ms';
          bar.classList.toggle('done', pct >= 1);
        });
        $('#coroTimer').textContent = Math.round(Math.min(el, total)) + ' ms';

        if (el >= total) {
          clearInterval(coroState.timer);
          coroState.running = false;
          $('#coroRun').textContent = 'Yenidən';
          $('#coroVerdict').innerHTML = coroState.mode === 'sequential'
            ? '<span class="bad">Ardıcıl: 3300 ms</span> &mdash; hər tapşırıq öz növbəsini gözlədi.'
            : '<span class="ok">Paralel: 1500 ms</span> &mdash; yalnız ən uzun tapşırıq qədər çəkdi. <b>2.2 dəfə</b> sürətli!';
        }
      }

      clearInterval(coroState.timer);
      coroState.timer = setInterval(frame, 16);
      frame();
    }

    $('#coroMode').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      coroState.mode = b.getAttribute('data-mode');
      $$('.chip', $('#coroMode')).forEach(function (c) { c.classList.toggle('active', c === b); });
      renderCode();
      reset();
    });

    $('#coroRun').addEventListener('click', start);
    renderCode();
    reset();
  }

  function stopCoroutines() {
    clearInterval(coroState.timer);
    coroState.running = false;
  }

  /* ============================================================
     4. WHEN İFADƏSİ SINAQÇISI
     ============================================================ */
  function initWhen() {
    var root = $('#whenDemo');
    if (!root) return;

    var BRANCHES = [
      '0 -&gt; "Sıfır"',
      '1, 2, 3 -&gt; "Kiçik rəqəm: $x"',
      'in 4..10 -&gt; "4..10 aralığındadır"',
      'is Int -&gt; if (x &lt; 0) "Mənfi rəqəm"',
      'is String -&gt; "Bu bir String-dir…"',
      'else -&gt; "Böyük rəqəm: $x"'
    ];

    function evaluate(raw) {
      var v = raw.trim();
      var isNum = /^-?\d+$/.test(v);
      var num = isNum ? parseInt(v, 10) : null;

      if (v === '') return { branch: null, out: '(boş giriş)' };
      if (isNum && num === 0) return { branch: 0, out: 'Sıfır' };
      if (isNum && (num === 1 || num === 2 || num === 3)) return { branch: 1, out: 'Kiçik rəqəm: ' + num };
      if (isNum && num >= 4 && num <= 10) return { branch: 2, out: '4..10 aralığındadır' };
      if (isNum && num < 0) return { branch: 3, out: 'Mənfi rəqəm' };
      if (isNum) return { branch: 5, out: 'Böyük rəqəm: ' + num };
      if (/^-?\d+\.\d+$/.test(v)) return { branch: 4, out: 'Bu bir Double-dir' };
      return { branch: 4, out: 'Bu bir String-dir: uzunluq ' + v.length };
    }

    function render() {
      var res = evaluate($('#whenInput').value);
      $('#whenBranches').innerHTML = BRANCHES.map(function (b, i) {
        var on = res.branch === i;
        return '<div class="chain-step' + (on ? ' on' : '') + '">' +
          '<span class="chain-op">' + (on ? '&#9654;' : '&nbsp;&nbsp;') + '</span>' +
          '<span class="chain-val">' + b + '</span></div>';
      }).join('');
      $('#whenOut').innerHTML = res.branch === null
        ? '<span class="muted">' + esc(res.out) + '</span>'
        : '<span class="ok">' + esc(res.out) + '</span>';
    }

    $('#whenInput').addEventListener('input', render);
    $$('#whenSamples .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        $('#whenInput').value = c.getAttribute('data-val');
        render();
      });
    });
    render();
  }

  /* ============================================================
     5. TİP ÇIXARIŞI (TYPE INFERENCE) DEMOSU
     ============================================================ */
  function initTypeInfer() {
    var root = $('#tiDemo');
    if (!root) return;

    function infer(raw) {
      var v = raw.trim();
      if (v === '') return { type: '?', note: 'Yuxarıya bir dəyər yazın və ya nümunələrdən seçin.' };
      if (/^-?\d+[lL]$/.test(v)) return { type: 'Long', note: 'L sonluğu Long bildirir (64 bit).' };
      if (/^-?\d+$/.test(v)) {
        var n = parseInt(v, 10);
        if (n > 2147483647 || n < -2147483648) {
          return { type: 'Long', note: 'Dəyər Int hüdudundan böyükdür, ona görə avtomatik Long seçildi.' };
        }
        return { type: 'Int', note: 'Tam rəqəmlər defolt olaraq Int-dir (32 bit).' };
      }
      if (/^-?\d*\.\d+[fF]$/.test(v)) return { type: 'Float', note: 'f sonluğu Float bildirir (32 bit onluq).' };
      if (/^-?\d*\.\d+$/.test(v)) return { type: 'Double', note: 'Onluq ədədlər defolt olaraq Double-dir (64 bit).' };
      if (/^(true|false)$/.test(v)) return { type: 'Boolean', note: 'Məntiqi dəyər: yalnız true və ya false ola bilər.' };
      if (/^'.'$/.test(v)) return { type: 'Char', note: 'Tək dırnaq Char bildirir, iki dırnaq isə String.' };
      if (/^".*"$/.test(v)) return { type: 'String', note: 'İki dırnaq arasındakı mətn String-dir.' };
      if (/^null$/.test(v)) return { type: 'Nothing?', note: 'Tək başına null-un tipi Nothing?-dir. Adətən açıq tip yazılır: val x: String? = null' };
      if (/^listOf\(/.test(v)) {
        var inner = v.slice(7, -1).trim();
        if (inner === '') return { type: 'List<Nothing>', note: 'Boş siyahıda element tipi bilinmir — açıq yazın: listOf<Int>()' };
        var ilk = inner.split(',')[0].trim();
        var t = /^-?\d+$/.test(ilk) ? 'Int' : /^".*"$/.test(ilk) ? 'String' : 'Any';
        return { type: 'List<' + t + '>', note: 'listOf() dəyişməz (read-only) siyahı qaytarır.' };
      }
      if (/^mutableListOf\(/.test(v)) return { type: 'MutableList<Int>', note: 'mutableListOf() əlavə və silmə əməliyyatlarına icazə verir.' };
      if (/^mapOf\(/.test(v)) return { type: 'Map<K, V>', note: 'mapOf("a" to 1) forması Map<String, Int> verir.' };
      if (/^setOf\(/.test(v)) return { type: 'Set<Int>', note: 'Set təkrarlanan elementləri saxlamır.' };
      if (/^arrayOf\(/.test(v)) return { type: 'Array<Int>', note: 'Array sabit ölçülüdür; adətən List daha rahatdır.' };
      if (/^\{.*\}$/.test(v)) return { type: '() -> Unit', note: 'Süslü mötərizə lambda-dır; parametrsiz olsa tipi () -> Unit olur.' };
      return { type: 'String', note: 'Tanınmayan ifadə — yuxarıdakı nümunələrdən birini seçin.' };
    }

    function render() {
      var raw = $('#tiInput').value;
      var r = infer(raw);
      var gosterilen = esc(raw || '…');
      $('#tiCode').innerHTML =
        '<span class="t-key">val</span> x <span class="t-pun">=</span> ' + gosterilen + '\n\n' +
        '<span class="t-com">// kompilyatorun gördüyü:</span>\n' +
        '<span class="t-key">val</span> x<span class="t-pun">:</span> <span class="t-typ">' + esc(r.type) + '</span> <span class="t-pun">=</span> ' + gosterilen;
      $('#tiType').innerHTML = '<span class="muted">Çıxarılan tip:</span> <span class="hl">' + esc(r.type) + '</span>';
      $('#tiNote').textContent = r.note;
    }

    $('#tiInput').addEventListener('input', render);
    $$('#tiSamples .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        $('#tiInput').value = c.getAttribute('data-val');
        render();
      });
    });
    render();
  }

  /* ============================================================
     6. SCOPE FUNKSİYALARI MÜQAYİSƏSİ
     ============================================================ */
  var SCOPE_FNS = {
    let: {
      code: 'val uzunluq = ad?.let {\n    println(it)      // it = "Kotlin"\n    it.length        // son sətir qaytarılır\n}',
      ctx: 'it', ret: 'lambda nəticəsi',
      use: 'Null olmayan dəyərlə iş görmək və onu başqa nəticəyə çevirmək üçün.',
      out: 'Kotlin\nuzunluq = 6'
    },
    run: {
      code: 'val uzunluq = ad.run {\n    println(this)    // this = "Kotlin"\n    length           // this.length\n}',
      ctx: 'this', ret: 'lambda nəticəsi',
      use: 'Obyekt konfiqurasiyası ilə nəticə hesablanmasını birləşdirmək üçün.',
      out: 'Kotlin\nuzunluq = 6'
    },
    with: {
      code: 'val netice = with(ad) {\n    println(this)    // this = "Kotlin"\n    uppercase()\n}',
      ctx: 'this', ret: 'lambda nəticəsi',
      use: 'Eyni obyekt üzərində bir neçə əməliyyatı bir yerdə qruplaşdırmaq üçün.',
      out: 'Kotlin\nnetice = KOTLIN'
    },
    apply: {
      code: 'val istifadeci = Istifadeci().apply {\n    ad = "Aysel"     // this.ad\n    yas = 24\n}',
      ctx: 'this', ret: 'obyektin özü',
      use: 'Obyekti qurmaq (builder üslubu) — ən çox işlənən scope funksiyasıdır.',
      out: 'istifadeci = Istifadeci(ad=Aysel, yas=24)'
    },
    also: {
      code: 'val siyahi = mutableListOf(1, 2)\n    .also { println("əvvəl: $it") }\n    .apply { add(3) }\n    .also { println("sonra: $it") }',
      ctx: 'it', ret: 'obyektin özü',
      use: 'Yan təsirlər üçün — loglama, yoxlama, debug. Zənciri pozmur.',
      out: 'əvvəl: [1, 2]\nsonra: [1, 2, 3]'
    }
  };

  function initScopeFns() {
    var root = $('#scopeDemo');
    if (!root) return;

    function render(key) {
      var d = SCOPE_FNS[key];
      $('#scopeCode').innerHTML = window.KHighlight ? window.KHighlight.highlight(d.code) : esc(d.code);
      $('#scopeCtx').textContent = d.ctx;
      $('#scopeRet').textContent = d.ret;
      $('#scopeUse').textContent = d.use;
      $('#scopeOut').innerHTML = '<span class="ok">' + esc(d.out) + '</span>';
    }

    $('#scopePicker').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      $$('#scopePicker .chip').forEach(function (c) { c.classList.toggle('active', c === b); });
      render(b.getAttribute('data-fn'));
    });

    render('let');
  }

  /* ============================================================
     7. BİLİK TESTİ
     ============================================================ */
  var QUIZ = [
    {
      q: 'val və var arasındakı əsas fərq nədir?',
      opts: [
        'val dəyəri sonradan dəyişdirilə bilməz, var dəyişdirilə bilər',
        'val yalnız rəqəmlər üçündür, var bütün tiplər üçün',
        'Heç bir fərq yoxdur, ikisi eynidir',
        'var kompilyasiya vaxtı, val çalışma vaxtı işləyir'
      ],
      a: 0,
      exp: 'val (value) yalnız-oxunan referansdır — bir dəfə təyin edildikdən sonra yenidən təyin edilə bilməz. var (variable) isə dəyişdirilə bilər. Qeyd: val obyektin özünü deyil, yalnız referansı sabitləyir — mutableListOf-a val ilə də element əlavə etmək olar.'
    },
    {
      q: 'Bu kod nə çap edəcək?',
      code: 'val ad: String? = null\nprintln(ad?.length ?: -1)',
      opts: ['null', '-1', '0', 'NullPointerException'],
      a: 1,
      exp: 'ad?.length safe call səbəbindən null qaytarır, sonra elvis operatoru (?:) null görüb sağ tərəfdəki -1 dəyərini qaytarır.'
    },
    {
      q: 'data class avtomatik olaraq hansı funksiyaları yaradır?',
      opts: [
        'Yalnız toString()',
        'equals(), hashCode(), toString(), copy() və componentN()',
        'Yalnız konstruktor',
        'main() funksiyasını'
      ],
      a: 1,
      exp: 'data class əsas konstruktordakı xassələrə əsasən equals()/hashCode(), toString(), copy() və destrukturizasiya üçün component1(), component2()… funksiyalarını avtomatik yaradır.'
    },
    {
      q: 'Kotlin-də bir sinifdən miras almaq üçün ana sinif necə elan olunmalıdır?',
      opts: [
        'public açar sözü ilə',
        'Heç nə lazım deyil, bütün siniflər mirasa açıqdır',
        'open açar sözü ilə',
        'Yalnız abstract ilə — başqa yol yoxdur'
      ],
      a: 2,
      exp: 'Kotlin-də siniflər defolt olaraq final-dır (bağlıdır). Mirasa icazə vermək üçün open yazmaq lazımdır. abstract siniflər də mirasa açıqdır, amma onların özündən obyekt yaratmaq olmur.'
    },
    {
      q: 'Bu kodun nəticəsi nədir?',
      code: 'val list = listOf(1, 2, 3, 4, 5)\nprintln(list.filter { it % 2 == 0 }.map { it * it })',
      opts: ['[1, 9, 25]', '[4, 16]', '[2, 4]', '[1, 4, 9, 16, 25]'],
      a: 1,
      exp: 'Əvvəlcə filter cüt rəqəmləri seçir → [2, 4]. Sonra map hər birinin kvadratını alır → [4, 16].'
    },
    {
      q: '!! operatoru nə edir?',
      opts: [
        'Dəyəri iki dəfə artırır',
        'Nullable dəyəri non-null-a məcburi çevirir, null olarsa NPE atır',
        'Məntiqi inkar edir',
        'Dəyəri String-ə çevirir'
      ],
      a: 1,
      exp: '!! «not-null assertion» operatorudur. Dəyər null olarsa KotlinNullPointerException atılır. Kotlin-in null təhlükəsizliyini tamamilə söndürdüyü üçün mümkün qədər ondan qaçmaq lazımdır.'
    },
    {
      q: 'suspend açar sözü nə deməkdir?',
      opts: [
        'Funksiya heç vaxt dəyər qaytarmır',
        'Funksiya dayandırıla və sonra davam etdirilə bilər — yalnız coroutine daxilində çağırılır',
        'Funksiya sinxron işləyir',
        'Funksiya avtomatik yeni thread yaradır'
      ],
      a: 1,
      exp: 'suspend funksiya thread-i bloklamadan dayandırıla (suspend) bilir. Yalnız başqa suspend funksiyadan və ya coroutine builder-dən (launch, async, runBlocking) çağırıla bilər. Özü-özünə thread yaratmır.'
    },
    {
      q: 'apply və also arasındakı əsas fərq nədir?',
      opts: [
        'apply this, also isə it istifadə edir — amma ikisi də obyektin özünü qaytarır',
        'apply obyekti, also lambda nəticəsini qaytarır',
        'Heç bir fərq yoxdur',
        'also yalnız kolleksiyalarla işləyir'
      ],
      a: 0,
      exp: 'Hər ikisi receiver obyektin özünü qaytarır. Fərq kontekstdədir: apply içində this işlədilir (xassələri birbaşa yazmaq olur), also içində isə it (yan təsirlər üçün daha oxunaqlıdır).'
    },
    {
      q: 'Bu kod kompilyasiya olunacaqmı?',
      code: 'fun main() {\n    val x: Int = 10\n    val y: Long = x\n    println(y)\n}',
      opts: [
        'Bəli, Int avtomatik Long-a çevrilir',
        'Xeyr — Kotlin-də avtomatik rəqəm çevrilməsi yoxdur, x.toLong() lazımdır',
        'Bəli, amma xəbərdarlıq verəcək',
        'Yalnız Java ilə birlikdə işləyəndə'
      ],
      a: 1,
      exp: 'Java-dan fərqli olaraq Kotlin genişlənən avtomatik rəqəm çevrilməsini dəstəkləmir. Açıq şəkildə x.toLong() yazmaq lazımdır — bu, gizli məlumat itkisinin qarşısını alır.'
    },
    {
      q: 'sealed class-ın əsas üstünlüyü nədir?',
      opts: [
        'Daha az yaddaş işlədir',
        'Bütün alt siniflər kompilyasiya vaxtı məlumdur — when ifadəsində else lazım olmur',
        'Avtomatik JSON-a çevrilir',
        'Çoxsaylı miras (multiple inheritance) verir'
      ],
      a: 1,
      exp: 'sealed class-ın bütün varisləri eyni modulda təyin olunduğu üçün kompilyator hamısını tanıyır. Bu, when ifadəsini exhaustive edir — else budağı lazım olmur və yeni varis əlavə edəndə kompilyator sizi xəbərdar edir.'
    },
    {
      q: 'lateinit hansı tiplərlə istifadə oluna bilməz?',
      opts: ['String', 'Sinif tipləri', 'Primitiv tiplər (Int, Double, Boolean…)', 'List'],
      a: 2,
      exp: 'lateinit primitiv tiplərlə (Int, Long, Double, Boolean, Char…) işləmir, çünki onların «hələ təyin olunmayıb» vəziyyətini bildirən null dəyəri yoxdur. Bunun üçün by Delegates.notNull() istifadə olunur.'
    },
    {
      q: 'Genişlənmə (extension) funksiyaları haqqında hansı doğrudur?',
      opts: [
        'Sinifin private üzvlərinə çıxış imkanı verir',
        'Sinifi real olaraq dəyişir',
        'Statik şəkildə həll olunur — virtual deyil, override olunmur',
        'Yalnız öz yazdığın siniflərə əlavə oluna bilər'
      ],
      a: 2,
      exp: 'Genişlənmə funksiyaları sinifə heç nə əlavə etmir — kompilyator onları adi statik funksiya çağırışına çevirir. Ona görə polimorfik deyillər (dəyişənin elan olunmuş tipinə görə seçilirlər) və private üzvlərə çıxışı yoxdur.'
    },
    {
      q: 'Bu kodun nəticəsi nədir?',
      code: 'val a = listOf(1, 2, 3)\nval b = listOf(1, 2, 3)\nprintln(a == b)\nprintln(a === b)',
      opts: ['true / true', 'false / false', 'true / false', 'false / true'],
      a: 2,
      exp: '== strukturel bərabərliyi (equals) yoxlayır — iki siyahının elementləri eynidir, ona görə true. === isə referans bərabərliyidir — bunlar ayrı-ayrı obyektlərdir, ona görə false.'
    },
    {
      q: 'Kotlin-də Unit tipi nəyə uyğundur?',
      opts: [
        'Java-dakı void-ə — amma Unit real bir tipdir',
        'null dəyərinə',
        'Boş siyahıya',
        'Any tipinə'
      ],
      a: 0,
      exp: 'Unit Java-dakı void-in qarşılığıdır, lakin Kotlin-də o həqiqi tipdir və yalnız bir nüsxəsi var. Funksiya heç nə qaytarmırsa, defolt olaraq Unit qaytarır — yazmağa ehtiyac yoxdur.'
    },
    {
      q: 'Coroutine-lərdə async/await nəyə xidmət edir?',
      opts: [
        'Yeni thread yaratmağa',
        'Paralel iş aparıb nəticəni sonra almağa — Deferred qaytarır',
        'Xətaları tutmağa',
        'Yaddaşı təmizləməyə'
      ],
      a: 1,
      exp: 'async bir Deferred<T> qaytarır və işi dərhal başladır. await() çağıranda nəticə hazır olana qədər thread bloklanmadan gözlənilir. Bir neçə async-i eyni anda başlatmaqla real paralellik alınır.'
    }
  ];

  function initQuiz() {
    var root = $('#quizDemo');
    if (!root) return;

    var HERFLER = ['A', 'B', 'C', 'D'];
    var state = { i: 0, score: 0, answered: false, order: [] };

    function qarisdir() {
      var arr = QUIZ.map(function (_, i) { return i; });
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    }

    function govdeniQur() {
      $('#quizBody').innerHTML =
        '<h3 class="quiz-q" id="quizQ" style="margin-top:0"></h3>' +
        '<div class="quiz-code" id="quizCode"></div>' +
        '<div class="quiz-opts" id="quizOpts"></div>' +
        '<div class="quiz-exp" id="quizExp"></div>' +
        '<button class="btn btn-primary" id="quizNext" style="display:none">Növbəti sual</button>';

      $('#quizOpts').addEventListener('click', function (e) {
        var b = e.target.closest('.quiz-opt');
        if (b) cavabla(parseInt(b.getAttribute('data-i'), 10));
      });
      $('#quizNext').addEventListener('click', function () {
        state.i++;
        render();
      });
    }

    function render() {
      var total = QUIZ.length;
      if (state.i >= total) return neticeGoster();

      var q = QUIZ[state.order[state.i]];
      $('#quizMetaNum').textContent = 'Sual ' + (state.i + 1) + ' / ' + total;
      $('#quizMetaScore').textContent = 'Bal: ' + state.score;
      $('#quizFill').style.width = ((state.i / total) * 100) + '%';
      $('#quizQ').textContent = q.q;

      var codeBox = $('#quizCode');
      if (q.code) {
        codeBox.style.display = '';
        codeBox.innerHTML = '<div class="code-card" style="margin:0"><pre class="code"><code>' +
          (window.KHighlight ? window.KHighlight.highlight(q.code) : esc(q.code)) + '</code></pre></div>';
      } else {
        codeBox.style.display = 'none';
        codeBox.innerHTML = '';
      }

      $('#quizOpts').innerHTML = q.opts.map(function (o, i) {
        return '<button class="quiz-opt" data-i="' + i + '">' +
          '<span class="letter">' + HERFLER[i] + '</span><span>' + esc(o) + '</span></button>';
      }).join('');

      $('#quizExp').classList.remove('show');
      $('#quizNext').style.display = 'none';
      state.answered = false;
    }

    function cavabla(secim) {
      if (state.answered) return;
      state.answered = true;

      var q = QUIZ[state.order[state.i]];
      $$('#quizOpts .quiz-opt').forEach(function (b, i) {
        b.disabled = true;
        if (i === q.a) b.classList.add('correct');
        else if (i === secim) b.classList.add('wrong');
      });

      if (secim === q.a) {
        state.score++;
        $('#quizMetaScore').textContent = 'Bal: ' + state.score;
      }

      var bas = secim === q.a
        ? '&#10003; Doğrudur! '
        : '&#10005; Düzgün cavab: ' + HERFLER[q.a] + '. ';
      $('#quizExp').innerHTML = '<b>' + bas + '</b>' + esc(q.exp);
      $('#quizExp').classList.add('show');
      $('#quizNext').style.display = '';
      $('#quizNext').textContent = (state.i === QUIZ.length - 1) ? 'Nəticəyə bax' : 'Növbəti sual';
    }

    function neticeGoster() {
      var total = QUIZ.length;
      var pct = Math.round(state.score / total * 100);
      var reylər = pct >= 90 ? 'Mükəmməl! Kotlin-i çox yaxşı bilirsən.'
        : pct >= 70 ? 'Yaxşı nəticə! Bir neçə mövzunu təkrarlamaq kifayətdir.'
          : pct >= 50 ? 'Pis deyil. Null təhlükəsizliyi və kolleksiyalar bölmələrinə qayıt.'
            : 'Başlanğıc üçün normaldır — mövzuları yenidən oxu və təkrar sına.';

      $('#quizFill').style.width = '100%';
      $('#quizMetaNum').textContent = 'Test bitdi';
      $('#quizMetaScore').textContent = 'Bal: ' + state.score;
      $('#quizBody').innerHTML =
        '<div class="quiz-result">' +
        '<div class="quiz-score">' + pct + '%</div>' +
        '<p style="font-size:1.05rem;font-weight:700;margin:6px 0 4px">' + state.score + ' / ' + total + ' doğru cavab</p>' +
        '<p style="color:var(--text-dim);margin-bottom:22px">' + reylər + '</p>' +
        '<button class="btn btn-primary" id="quizRestart">Yenidən başla</button>' +
        '</div>';

      $('#quizRestart').addEventListener('click', function () {
        state = { i: 0, score: 0, answered: false, order: qarisdir() };
        govdeniQur();
        render();
      });
    }

    state.order = qarisdir();
    govdeniQur();
    render();
  }

  /* ============================================================
     Başladıcı + bölmə aktivləşdirməsi
     ============================================================ */
  function initAll() {
    initNullSafety();
    initCollections();
    initCoroutines();
    initWhen();
    initTypeInfer();
    initScopeFns();
    initQuiz();
  }

  function activate(sectionId) {
    // Coroutine animasiyası yalnız öz bölməsində işləsin
    if (sectionId !== 'coroutines') stopCoroutines();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.KDemos = { activate: activate };
})();
