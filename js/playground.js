/* ============================================================
   KotlinAZ — Kod meydanı
   JetBrains Kotlin Playground kitabxanasını tənbəl yükləyir və
   real kompilyasiya olunan redaktor qurur.
   Kitabxana yalnız bu bölmə ilk dəfə açılanda endirilir.
   ============================================================ */
(function () {
  'use strict';

  var CDN = 'https://unpkg.com/kotlin-playground@1';
  var libState = 'idle';      // idle | loading | ready | failed
  var libPromise = null;
  var mounted = false;
  var mounting = false;       // qurulum gedirmi
  var pending = null;         // növbədə gözləyən kod

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- Nümunə kodlar ----------
     Hamısı Kotlin kompilyatorunda yoxlanılıb və işlək vəziyyətdədir. */
  var PRESETS = [
    {
      id: 'salam', label: 'Salam, dünya',
      code: [
        'fun main() {',
        '    val ad = "Aysel"',
        '    println("Salam, dünya!")',
        '    println("Xoş gəldin, $ad — adında ${ad.length} hərf var.")',
        '}'
      ]
    },
    {
      id: 'deyisenler', label: 'Dəyişənlər və tiplər',
      code: [
        'fun main() {',
        '    val ad: String = "Kotlin"   // dəyişməz',
        '    var yas = 14                // dəyişkən, tipi avtomatik Int',
        '    val pi = 3.14               // Double',
        '    val aktivdir = true         // Boolean',
        '',
        '    yas += 1',
        '',
        '    println("$ad — $yas yaşında")',
        '    println("pi = $pi, aktivdir = $aktivdir")',
        '    println("yas tipi: " + yas::class.simpleName)',
        '}'
      ]
    },
    {
      id: 'sertler', label: 'Şərtlər (when)',
      code: [
        'fun qiymetlendir(bal: Int): String = when {',
        '    bal >= 90 -> "Əla"',
        '    bal >= 70 -> "Yaxşı"',
        '    bal >= 50 -> "Qənaətbəxş"',
        '    else -> "Kafi deyil"',
        '}',
        '',
        'fun main() {',
        '    for (bal in listOf(95, 75, 55, 30)) {',
        '        println("$bal -> ${qiymetlendir(bal)}")',
        '    }',
        '}'
      ]
    },
    {
      id: 'dovrler', label: 'Dövrlər və aralıqlar',
      code: [
        'fun main() {',
        '    for (i in 1..5) print("$i ")',
        '    println()',
        '',
        '    for (i in 10 downTo 1 step 3) print("$i ")',
        '    println()',
        '',
        '    val diller = listOf("Kotlin", "Java", "Swift")',
        '    for ((index, dil) in diller.withIndex()) {',
        '        println("${index + 1}. $dil")',
        '    }',
        '}'
      ]
    },
    {
      id: 'funksiyalar', label: 'Funksiyalar',
      code: [
        'fun salamla(ad: String = "Dünya", boyuk: Boolean = false): String {',
        '    val metn = "Salam, $ad!"',
        '    return if (boyuk) metn.uppercase() else metn',
        '}',
        '',
        'fun kvadrat(x: Int) = x * x',
        '',
        'fun main() {',
        '    println(salamla())',
        '    println(salamla("Aysel"))',
        '    println(salamla("Kamran", boyuk = true))',
        '    println(kvadrat(7))',
        '}'
      ]
    },
    {
      id: 'null', label: 'Null təhlükəsizliyi',
      code: [
        'fun main() {',
        '    val ad: String? = "Kotlin"',
        '    val bos: String? = null',
        '',
        '    println(ad?.length)          // 6',
        '    println(bos?.length)         // null — çökmür',
        '    println(bos?.length ?: -1)   // elvis operatoru',
        '',
        '    ad?.let { println("Böyük hərflərlə: ${it.uppercase()}") }',
        '',
        '    val siyahi: List<String>? = null',
        '    println(siyahi.orEmpty())    // []',
        '}'
      ]
    },
    {
      id: 'kolleksiyalar', label: 'Kolleksiyalar',
      code: [
        'fun main() {',
        '    val reqemler = listOf(5, 3, 8, 1, 9, 2, 7)',
        '',
        '    println(reqemler.filter { it > 3 })',
        '    println(reqemler.map { it * 2 })',
        '    println(reqemler.sorted())',
        '    println("Cəmi: ${reqemler.sum()}, orta: ${reqemler.average()}")',
        '',
        '    val sozler = listOf("alma", "armud", "banan", "ananas")',
        '    println(sozler.groupBy { it.first() })',
        '}'
      ]
    },
    {
      id: 'dataclass', label: 'data class',
      code: [
        'data class Istifadeci(val ad: String, val yas: Int)',
        '',
        'fun main() {',
        '    val a = Istifadeci("Aysel", 24)',
        '    val b = a.copy(yas = 25)',
        '',
        '    println(a)',
        '    println(b)',
        '    println("Bərabərdirmi? " + (a == b))',
        '',
        '    val (ad, yas) = a           // destrukturizasiya',
        '    println("$ad / $yas")',
        '}'
      ]
    },
    {
      id: 'sealed', label: 'sealed class',
      code: [
        'sealed class Netice {',
        '    data class Ugurlu(val data: String) : Netice()',
        '    data class Xeta(val kod: Int) : Netice()',
        '    data object Yuklenir : Netice()',
        '}',
        '',
        '// else lazım deyil — kompilyator bütün halları tanıyır',
        'fun emalEt(n: Netice): String = when (n) {',
        '    is Netice.Ugurlu -> "Uğurlu: ${n.data}"',
        '    is Netice.Xeta -> "Xəta kodu: ${n.kod}"',
        '    Netice.Yuklenir -> "Yüklənir..."',
        '}',
        '',
        'fun main() {',
        '    listOf(',
        '        Netice.Yuklenir,',
        '        Netice.Ugurlu("məlumat hazırdır"),',
        '        Netice.Xeta(404)',
        '    ).forEach { println(emalEt(it)) }',
        '}'
      ]
    },
    {
      id: 'coroutine', label: 'Coroutine (paralel)',
      code: [
        'import kotlinx.coroutines.*',
        '',
        'suspend fun getir(ad: String, vaxt: Long): String {',
        '    delay(vaxt)',
        '    return ad',
        '}',
        '',
        'fun main() = runBlocking {',
        '    val basla = System.currentTimeMillis()',
        '',
        '    // Hər ikisi eyni anda başlayır',
        '    val a = async { getir("A", 1000) }',
        '    val b = async { getir("B", 1000) }',
        '',
        '    println("Nəticələr: ${a.await()}, ${b.await()}")',
        '    println("Vaxt: ~${System.currentTimeMillis() - basla} ms")',
        '    println("Ardıcıl olsaydı ~2000 ms çəkərdi.")',
        '}'
      ]
    }
  ];

  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return PRESETS[0];
  }

  /* ---------- Kitabxananın tənbəl yüklənməsi ---------- */
  function loadLib() {
    if (libState === 'ready') return Promise.resolve(true);
    if (libPromise) return libPromise;

    libState = 'loading';
    libPromise = new Promise(function (resolve) {
      var done = false;
      function finish(ok) {
        if (done) return;
        done = true;
        libState = ok ? 'ready' : 'failed';
        resolve(ok);
      }

      var s = document.createElement('script');
      s.src = CDN;
      s.async = true;
      s.onload = function () { finish(typeof window.KotlinPlayground === 'function'); };
      s.onerror = function () { finish(false); };
      document.head.appendChild(s);

      // Şəbəkə cavab verməsə sonsuz gözləməyək
      setTimeout(function () { finish(typeof window.KotlinPlayground === 'function'); }, 20000);
    });
    return libPromise;
  }

  /* ---------- Redaktorun qurulması ---------- */
  function themeName() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'darcula' : 'idea';
  }

  function currentCode() {
    var cm = $('#pgHost .CodeMirror');
    if (cm && cm.CodeMirror && typeof cm.CodeMirror.getValue === 'function') {
      return cm.CodeMirror.getValue();
    }
    return null;
  }

  /**
   * Redaktoru qurur.
   * KotlinPlayground asinxron işləyir: əvvəlki qurulum bitmədən host-u
   * təmizləsək, kitabxana silinmiş elementə yazmağa çalışır və xəta atır.
   * Ona görə qurulumları növbəyə salırıq — eyni anda yalnız biri gedir.
   */
  function mount(code) {
    var host = $('#pgHost');
    if (!host) return;

    if (mounting) { pending = code; return; }
    mounting = true;
    pending = null;

    host.innerHTML = '';
    var el = document.createElement('code');
    el.id = 'pgEditor';
    el.setAttribute('theme', themeName());
    el.setAttribute('data-target-platform', 'java');
    el.setAttribute('folded-button', 'false');
    el.setAttribute('match-brackets', 'true');
    el.textContent = code;
    host.appendChild(el);

    var bitdi = false;
    function tamamla() {
      if (bitdi) return;
      bitdi = true;
      mounting = false;
      mounted = true;
      if (pending !== null) {
        var novbeti = pending;
        pending = null;
        mount(novbeti);
      }
    }

    try {
      var p = window.KotlinPlayground('#pgEditor', { callback: tamamla });
      if (p && typeof p.then === 'function') p.then(tamamla, tamamla);
    } catch (e) {
      mounting = false;
      showError('Redaktor qurula bilmədi: ' + e.message);
      return;
    }

    // Kitabxana callback çağırmasa da növbə kilidlənməsin
    setTimeout(tamamla, 8000);
  }

  function showError(mesaj) {
    var host = $('#pgHost');
    if (!host) return;
    host.innerHTML =
      '<div class="pg-fallback">' +
      '<p class="pg-fallback-title">Kod meydanı yüklənmədi</p>' +
      '<p>' + mesaj + '</p>' +
      '<p>Kod yazıb işlətmək üçün internet bağlantısı tələb olunur — kompilyasiya JetBrains serverlərində aparılır. ' +
      'Bağlantını yoxlayıb səhifəni yeniləyin, və ya birbaşa ' +
      '<a href="https://play.kotlinlang.org" target="_blank" rel="noopener">play.kotlinlang.org</a> saytından istifadə edin.</p>' +
      '<button class="btn btn-ghost btn-sm" id="pgRetry">Yenidən cəhd et</button>' +
      '</div>';
    var r = $('#pgRetry');
    if (r) r.addEventListener('click', function () { libPromise = null; libState = 'idle'; boot(true); });
  }

  function setStatus(metn, hal) {
    var el = $('#pgStatus');
    if (!el) return;
    el.textContent = metn;
    el.className = 'pg-status' + (hal ? ' ' + hal : '');
  }

  /* ---------- Bölmənin işə salınması ---------- */
  function boot(force) {
    var host = $('#pgHost');
    if (!host) return;
    if (mounted && !force) return;

    setStatus('Redaktor yüklənir…', 'loading');
    host.innerHTML = '<div class="pg-loading">Kotlin redaktoru yüklənir…</div>';

    loadLib().then(function (ok) {
      if (!ok) {
        setStatus('Bağlantı yoxdur', 'bad');
        showError('Kitabxana endirilə bilmədi.');
        return;
      }
      var aktiv = $('#pgPresets .chip.active');
      var id = aktiv ? aktiv.getAttribute('data-preset') : PRESETS[0].id;
      mount(presetById(id).code.join('\n'));
      setStatus('Hazırdır — kodu dəyişib İşlət düyməsini basın', 'ok');
    });
  }

  function initUI() {
    var presets = $('#pgPresets');
    if (!presets) return;

    presets.innerHTML = PRESETS.map(function (p, i) {
      return '<button class="chip' + (i === 0 ? ' active' : '') + '" data-preset="' + p.id + '">' +
        p.label + '</button>';
    }).join('');

    presets.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      $$('#pgPresets .chip').forEach(function (c) { c.classList.toggle('active', c === b); });
      if (libState === 'ready') {
        mount(presetById(b.getAttribute('data-preset')).code.join('\n'));
        setStatus('Nümunə yükləndi', 'ok');
      } else {
        boot(true);
      }
    });

    var temizle = $('#pgClear');
    if (temizle) {
      temizle.addEventListener('click', function () {
        if (libState !== 'ready') return;
        mount('fun main() {\n    \n}');
        setStatus('Boş redaktor', 'ok');
      });
    }

    // Tema dəyişəndə redaktoru eyni kodla yenidən qur
    var themeBtn = $('#themeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        if (libState !== 'ready' || !mounted) return;
        var kod = currentCode();
        setTimeout(function () {
          mount(kod !== null ? kod : presetById(PRESETS[0].id).code.join('\n'));
        }, 60);
      });
    }

    // Səhifə birbaşa #kod-meydani ünvanı ilə açılıbsa, app.js marşrutu
    // bu fayldan əvvəl işlədiyi üçün activate() çağırışı itir — burada tuturuq.
    var sec = document.getElementById('kod-meydani');
    if (sec && sec.classList.contains('active')) boot(false);
  }

  function activate(sectionId) {
    if (sectionId === 'kod-meydani') boot(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

  window.KPlayground = { activate: activate };
})();
