/* ============================================================
   Başlanğıc (starter) kodlarında struktur problemlərini tapır.

   Ən çox rast gəlinən səhv: "{ // izah }" formasında şərhin
   bağlayıcı mötərizəni udması — istifadəçi boşluğu doldursa da
   kod sintaktik olaraq pozuq qalır.

   İşlətmək: node tools/check-starters.js
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KOK = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(KOK, 'js', 'exercises.js'), 'utf8'), sandbox, {
  filename: 'exercises.js'
});

const problemler = [];

/**
 * Sətri kod və şərh hissəsinə ayırır.
 * Mətn literalları nəzərə alınır — "https://..." içindəki iki xətt
 * şərh deyil, adi simvoldur.
 */
function ayir(setir) {
  let dirnaq = null;
  for (let i = 0; i < setir.length; i++) {
    const c = setir[i];
    if (dirnaq) {
      if (c === '\\') { i++; continue; }
      if (c === dirnaq) dirnaq = null;
      continue;
    }
    if (c === '"' || c === "'") { dirnaq = c; continue; }
    if (c === '/' && setir[i + 1] === '/') {
      return { kod: setir.slice(0, i), serh: setir.slice(i) };
    }
  }
  return { kod: setir, serh: '' };
}

sandbox.window.KExercises.topics.forEach(function (t) {
  (t.praktiki || []).forEach(function (p, i) {
    const yer = t.id + ' #' + (i + 1);
    let bal = 0;

    p.starter.split('\n').forEach(function (setir, n) {
      const { kod, serh } = ayir(setir);

      // Şərhin içində bağlayıcı mötərizə varsa, o, kodu pozur.
      // Amma sətir BÜTÜNLÜKLƏ şərhdirsə problem yoxdur — belə sətirlər
      // adətən nümunə kod göstərir və heç nə udmur.
      if (serh.indexOf('}') !== -1 && kod.trim() !== '') {
        problemler.push({
          yer: yer,
          setir: n + 1,
          novu: 'serh baglayici motorizeni udur',
          metn: setir.trim()
        });
      }

      for (const ch of kod) {
        if (ch === '{') bal++;
        if (ch === '}') bal--;
      }
    });

    // Starter natamam ola bilər, ona görə yalnız MƏNFİ balans
    // (artıq bağlanma) problem sayılır
    if (bal < 0) {
      problemler.push({ yer: yer, setir: 0, novu: 'artiq baglayici motorize', metn: 'balans = ' + bal });
    }
  });
});

if (problemler.length === 0) {
  console.log('Butun baslangic kodlari qaydasindadir.');
  process.exit(0);
}

console.log('PROBLEM TAPILDI: ' + problemler.length);
problemler.forEach(function (p) {
  console.log('  ! ' + p.yer + ' (setir ' + p.setir + ') — ' + p.novu);
  console.log('    ' + p.metn);
});
process.exit(1);
