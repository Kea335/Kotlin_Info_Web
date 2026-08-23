/* ============================================================
   Çalışmalar bankından praktiki həlləri çıxarıb JSON-a yazır.
   Doğrulama boru xəttinin birinci addımıdır.

   İşlətmək:  node tools/extract-exercises.js
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KOK = path.resolve(__dirname, '..');
const MENBE = path.join(KOK, 'js', 'exercises.js');
const HEDEF = path.join(__dirname, 'exercises.json');

const kod = fs.readFileSync(MENBE, 'utf8');

// Fayl brauzer üçün yazılıb — window obyektini taxta ilə əvəz edirik
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(kod, sandbox, { filename: 'exercises.js' });

const bank = sandbox.window.KExercises;
if (!bank || !Array.isArray(bank.topics)) {
  console.error('XETA: window.KExercises tapilmadi ve ya duzgun deyil');
  process.exit(1);
}

const cixis = { topics: [] };
let nezeriSay = 0;
let praktikiSay = 0;
const problemler = [];

bank.topics.forEach(function (t) {
  if (!t.id || !t.title) problemler.push('Movzuda id ve ya title yoxdur');

  (t.nezeri || []).forEach(function (n, i) {
    nezeriSay++;
    const yer = t.id + ' / nezeri #' + (i + 1);
    if (!n.q) problemler.push(yer + ': sual yoxdur');
    if (!Array.isArray(n.opts) || n.opts.length !== 4) problemler.push(yer + ': 4 variant olmalidir');
    if (typeof n.a !== 'number' || n.a < 0 || n.a > 3) problemler.push(yer + ': duzgun cavab indeksi yanlisdir');
    if (!n.exp) problemler.push(yer + ': izah yoxdur');
    if (!n.level) problemler.push(yer + ': seviyye yoxdur');
  });

  (t.praktiki || []).forEach(function (p, i) {
    praktikiSay++;
    const yer = t.id + ' / praktiki #' + (i + 1);
    if (!p.tapsiriq) problemler.push(yer + ': tapsiriq yoxdur');
    if (!p.starter) problemler.push(yer + ': baslangic kodu yoxdur');
    if (!p.hell) problemler.push(yer + ': model hell yoxdur');
    if (typeof p.gozlenilen !== 'string' || p.gozlenilen.length === 0) {
      problemler.push(yer + ': gozlenilen netice yoxdur');
    }
    if (!p.level) problemler.push(yer + ': seviyye yoxdur');
    if (p.hell && p.hell.indexOf('fun main') === -1) {
      problemler.push(yer + ': model hellde main() yoxdur');
    }
  });

  cixis.topics.push({
    id: t.id,
    title: t.title,
    praktiki: (t.praktiki || []).map(function (p, i) {
      return {
        no: i + 1,
        id: t.id + '-p-' + String(i + 1).padStart(2, '0'),
        level: p.level,
        tapsiriq: p.tapsiriq,
        gozlenilen: p.gozlenilen,
        hell: p.hell
      };
    })
  });
});

fs.writeFileSync(HEDEF, JSON.stringify(cixis, null, 2), 'utf8');

console.log('Movzu sayi      : ' + bank.topics.length);
console.log('Nezeri calisma  : ' + nezeriSay);
console.log('Praktiki calisma: ' + praktikiSay);
console.log('Struktur problemi: ' + problemler.length);
problemler.slice(0, 20).forEach(function (p) { console.log('  ! ' + p); });
console.log('JSON yazildi    : ' + HEDEF);

process.exit(problemler.length ? 2 : 0);
