/* ============================================================
   Praktiki çalışmaların model həllərini Kotlin kompilyatorunda
   işlədib nəticəni "gozlenilen" sahəsi ilə tutuşdurur.

   İşlətmək:
     node tools/extract-exercises.js && node tools/verify-exercises.js

   Uyğunsuzluq tapılarsa proses 1 kodu ilə bitir — yəni çalışma
   sayta buraxıla bilməz.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

/* ---------- Alət yolları ---------- */
const AS = 'C:\\Program Files\\Android\\Android Studio';
const KOTLINC = path.join(AS, 'plugins', 'Kotlin', 'kotlinc', 'bin', 'kotlinc.bat');
const STDLIB = path.join(AS, 'plugins', 'Kotlin', 'kotlinc', 'lib', 'kotlin-stdlib.jar');
const JAVA = path.join(AS, 'jbr', 'bin', 'java.exe');

for (const [ad, yol] of [['kotlinc', KOTLINC], ['kotlin-stdlib', STDLIB], ['java', JAVA]]) {
  if (!fs.existsSync(yol)) {
    console.error(`XETA: ${ad} tapilmadi: ${yol}`);
    process.exit(3);
  }
}

/* ---------- Giriş ---------- */
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'exercises.json'), 'utf8'));

const IS = path.join(os.tmpdir(), 'kotlinaz-verify');
const SRC = path.join(IS, 'src');
const OUT = path.join(IS, 'out');
fs.rmSync(IS, { recursive: true, force: true });
fs.mkdirSync(SRC, { recursive: true });

/* ---------- Mənbə fayllarını yaz ----------
   Hər çalışma öz paketinə qoyulur ki, eyni adlı top-level
   funksiyalar (salamla, topla və s.) bir-biri ilə toqquşmasın. */
const isler = [];
data.topics.forEach((t, ti) => {
  t.praktiki.forEach((p) => {
    const t = String(ti + 1).padStart(2, '0');
    const n = String(p.no).padStart(2, '0');
    const paket = `ex.t${t}.p${n}`;
    // Fayl adı böyük hərflə başlamalıdır: Kotlin sinif adının ilk
    // hərfini avtomatik böyüdür (fayl.kt -> FaylKt).
    const faylAdi = `T${t}P${n}`;
    fs.writeFileSync(path.join(SRC, `${faylAdi}.kt`), `package ${paket}\n\n${p.hell}\n`, 'utf8');
    isler.push({
      id: p.id,
      level: p.level,
      tapsiriq: p.tapsiriq,
      gozlenilen: p.gozlenilen,
      mainClass: `${paket}.${faylAdi}Kt`
    });
  });
});

console.log(`Kompilyasiya olunur: ${isler.length} calisma...`);

/* ---------- Kompilyasiya ---------- */
// kotlinc .bat faylıdır — Windows-da shell tələb edir.
// Yolda boşluq olduğu üçün bütün arqumentlər dırnağa alınır.
const emr = `"${KOTLINC}" "${SRC}" -d "${OUT}" -nowarn`;
const komp = spawnSync(emr, {
  encoding: 'utf8',
  shell: true,
  maxBuffer: 1024 * 1024 * 64,
  // kotlinc.bat java-nı JAVA_HOME vasitəsilə tapır
  env: Object.assign({}, process.env, { JAVA_HOME: path.join(AS, 'jbr') })
});

const kompCixis = ((komp.stdout || '') + (komp.stderr || ''))
  .split('\n')
  .filter((l) => l.trim() && !/^warning:/i.test(l.trim()))
  .join('\n');

if (komp.status !== 0) {
  console.error('KOMPILYASIYA UGURSUZ:');
  console.error(kompCixis.slice(0, 4000));
  process.exit(1);
}
if (kompCixis.trim()) {
  console.log('Kompilyator qeydleri:\n' + kompCixis.slice(0, 2000));
}
console.log('Kompilyasiya ugurlu.\n');

/* ---------- Nəticələri tutuşdur ---------- */
function normallasdir(s) {
  return String(s)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

const cp = `${OUT}${path.delimiter}${STDLIB}`;
const uygunsuz = [];
let ugurlu = 0;

isler.forEach((w) => {
  const r = spawnSync(JAVA, ['-Dfile.encoding=UTF-8', '-Dstdout.encoding=UTF-8', '-cp', cp, w.mainClass], {
    encoding: 'buffer', timeout: 20000
  });

  const stdout = r.stdout ? r.stdout.toString('utf8') : '';
  const stderr = r.stderr ? r.stderr.toString('utf8') : '';

  const alinan = normallasdir(stdout);
  const gozlenilen = normallasdir(w.gozlenilen);

  if (stderr.trim()) {
    uygunsuz.push({ ...w, sebeb: 'CALISMA VAXTI XETASI', alinan: stderr.trim().slice(0, 300) });
  } else if (alinan !== gozlenilen) {
    uygunsuz.push({ ...w, sebeb: 'NETICE UYGUN DEYIL', alinan, gozlenilen });
  } else {
    ugurlu++;
  }
});

/* ---------- Hesabat ---------- */
console.log('='.repeat(58));
console.log(`Ugurlu    : ${ugurlu} / ${isler.length}`);
console.log(`Uygunsuz  : ${uygunsuz.length}`);
console.log('='.repeat(58));

uygunsuz.forEach((u) => {
  console.log(`\n### ${u.id}  [${u.level}]  — ${u.sebeb}`);
  console.log(`Tapsiriq   : ${u.tapsiriq}`);
  if (u.gozlenilen !== undefined) {
    console.log(`GOZLENILEN : ${JSON.stringify(u.gozlenilen)}`);
  }
  console.log(`ALINAN     : ${JSON.stringify(u.alinan)}`);
});

process.exit(uygunsuz.length ? 1 : 0);
