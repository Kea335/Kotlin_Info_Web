/* ============================================================
   KotlinAZ - Kotlin ucun yungul sintaksis rengleyici
   Xarici kitabxana yoxdur, tam oflayn islenir.
   ============================================================ */
(function (global) {
  'use strict';

  var KEYWORDS = [
    'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun', 'if', 'in',
    'interface', 'is', 'null', 'object', 'package', 'return', 'super', 'this', 'throw',
    'true', 'try', 'typealias', 'typeof', 'val', 'var', 'when', 'while',
    'by', 'catch', 'constructor', 'delegate', 'dynamic', 'field', 'file', 'finally',
    'get', 'import', 'init', 'param', 'property', 'receiver', 'set', 'setparam', 'where',
    'abstract', 'actual', 'annotation', 'companion', 'const', 'crossinline', 'data',
    'enum', 'expect', 'external', 'final', 'infix', 'inline', 'inner', 'internal',
    'lateinit', 'noinline', 'open', 'operator', 'out', 'override', 'private', 'protected',
    'public', 'reified', 'sealed', 'suspend', 'tailrec', 'value', 'vararg'
  ];

  var BUILTIN_TYPES = [
    'Int', 'Long', 'Short', 'Byte', 'Float', 'Double', 'Boolean', 'Char', 'String',
    'Any', 'Unit', 'Nothing', 'Array', 'List', 'MutableList', 'Set', 'MutableSet',
    'Map', 'MutableMap', 'Pair', 'Triple', 'Sequence', 'Iterable', 'Collection',
    'Comparable', 'Throwable', 'Exception', 'RuntimeException', 'Result',
    'IntArray', 'LongArray', 'DoubleArray', 'CharArray', 'BooleanArray',
    'ArrayList', 'HashMap', 'HashSet', 'LinkedHashMap', 'StringBuilder', 'Regex',
    'Flow', 'StateFlow', 'SharedFlow', 'Job', 'Deferred', 'CoroutineScope',
    'Dispatchers', 'Channel', 'Mutex', 'Number', 'Enum', 'Function'
  ];

  var kwSet = {}, tySet = {};
  KEYWORDS.forEach(function (k) { kwSet[k] = 1; });
  BUILTIN_TYPES.forEach(function (t) { tySet[t] = 1; });

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function span(cls, text) {
    return '<span class="' + cls + '">' + esc(text) + '</span>';
  }

  /**
   * Kotlin kodunu tokenlere ayirib HTML qaytarir.
   * Tek kecidli skaner - serh, setir, simvol, reqem, annotasiya, ad, punktuasiya.
   */
  function highlight(src) {
    var out = '';
    var i = 0;
    var n = src.length;

    while (i < n) {
      var c = src[i];

      // --- Blok serh /* ... */ (ic-ice destekli)
      if (c === '/' && src[i + 1] === '*') {
        var depth = 1, start = i;
        i += 2;
        while (i < n && depth > 0) {
          if (src[i] === '/' && src[i + 1] === '*') { depth++; i += 2; }
          else if (src[i] === '*' && src[i + 1] === '/') { depth--; i += 2; }
          else i++;
        }
        out += span('t-com', src.slice(start, i));
        continue;
      }

      // --- Setir serhi // ...
      if (c === '/' && src[i + 1] === '/') {
        var s2 = i;
        while (i < n && src[i] !== '\n') i++;
        out += span('t-com', src.slice(s2, i));
        continue;
      }

      // --- Uc dirnaqli setir """ ... """
      if (c === '"' && src[i + 1] === '"' && src[i + 2] === '"') {
        var s3 = i;
        i += 3;
        while (i < n && !(src[i] === '"' && src[i + 1] === '"' && src[i + 2] === '"')) i++;
        i = Math.min(i + 3, n);
        out += span('t-str', src.slice(s3, i));
        continue;
      }

      // --- Adi setir " ... "  (sablon $ ifadeleri ayrica renglenir)
      if (c === '"') {
        var s4 = i;
        i++;
        var buf = '"';
        while (i < n && src[i] !== '"') {
          if (src[i] === '\\') { buf += src[i] + (src[i + 1] || ''); i += 2; continue; }
          // Setir sablonu: $ad  ve  ${ifade}
          if (src[i] === '$') {
            if (buf) { out += span('t-str', buf); buf = ''; }
            var ts = i;
            i++;
            if (src[i] === '{') {
              var br = 1; i++;
              while (i < n && br > 0) {
                if (src[i] === '{') br++;
                if (src[i] === '}') br--;
                i++;
              }
            } else {
              while (i < n && /[A-Za-z0-9_.]/.test(src[i])) i++;
            }
            out += span('t-fn', src.slice(ts, i));
            continue;
          }
          buf += src[i];
          i++;
        }
        if (i < n) { buf += '"'; i++; }
        if (buf) out += span('t-str', buf);
        continue;
      }

      // --- Simvol 'a'
      if (c === "'") {
        var s5 = i;
        i++;
        while (i < n && src[i] !== "'") {
          if (src[i] === '\\') i++;
          i++;
        }
        i = Math.min(i + 1, n);
        out += span('t-str', src.slice(s5, i));
        continue;
      }

      // --- Annotasiya @Composable
      if (c === '@' && /[A-Za-z_]/.test(src[i + 1] || '')) {
        var s6 = i;
        i++;
        while (i < n && /[A-Za-z0-9_.]/.test(src[i])) i++;
        out += span('t-ann', src.slice(s6, i));
        continue;
      }

      // --- Reqem  (0x, 0b, _ ayirici, f/F/L/u sonluq, onluq)
      if (/[0-9]/.test(c)) {
        var s7 = i;
        while (i < n && /[0-9a-fA-FxXbBoO_.eE+\-]/.test(src[i])) {
          // Eksponentden kenar +/- reqemin bir hissesi deyil
          if ((src[i] === '+' || src[i] === '-') && !/[eE]/.test(src[i - 1])) break;
          if (src[i] === '.' && !/[0-9]/.test(src[i + 1] || '')) break;
          i++;
        }
        while (i < n && /[fFlLuU]/.test(src[i])) i++;
        out += span('t-num', src.slice(s7, i));
        continue;
      }

      // --- Ad / acar soz / tip / funksiya cagirisi
      if (/[A-Za-z_]/.test(c)) {
        var s8 = i;
        while (i < n && /[A-Za-z0-9_]/.test(src[i])) i++;
        var word = src.slice(s8, i);

        // Bosluqlari kecerek novbeti menali simvola bax
        var j = i;
        while (j < n && (src[j] === ' ' || src[j] === '\t')) j++;
        var nextCh = src[j] || '';

        if (kwSet[word]) {
          out += span('t-key', word);
        } else if (tySet[word] || /^[A-Z]/.test(word)) {
          // Boyuk herfle baslayan hər ad tip sayilir - sinif elani da,
          // konstruktor cagirisi da eyni rengde gorunsun.
          out += span('t-typ', word);
        } else if (nextCh === '(') {
          out += span('t-fn', word);
        } else {
          out += esc(word);
        }
        continue;
      }

      // --- Punktuasiya / operatorlar
      if (/[{}()\[\];,.:?!<>=+\-*/%&|^~]/.test(c)) {
        var s9 = i;
        while (i < n && /[{}()\[\];,.:?!<>=+\-*/%&|^~]/.test(src[i])) i++;
        out += span('t-pun', src.slice(s9, i));
        continue;
      }

      // --- Diger (bosluq, setir sonu)
      out += esc(c);
      i++;
    }

    return out;
  }

  /** Sehifedeki butun <pre class="code"><code> bloklarini rengleyir. */
  function highlightAll(root) {
    var scope = root || document;
    var blocks = scope.querySelectorAll('pre.code > code:not([data-hl])');
    Array.prototype.forEach.call(blocks, function (el) {
      var raw = el.textContent.replace(/^\n/, '').replace(/\s+$/, '');
      el.setAttribute('data-raw', raw);
      el.innerHTML = highlight(raw);
      el.setAttribute('data-hl', '1');
    });
  }

  global.KHighlight = { highlight: highlight, highlightAll: highlightAll };
})(window);
