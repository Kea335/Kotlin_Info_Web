<h1 align="center">KotlinAZ</h1>

<p align="center">
  <b>Kotlin proqramlaşdırma dili üzrə Azərbaycan dilində interaktiv təlim saytı</b>
</p>

<p align="center">
  <img alt="Bölmə sayı" src="https://img.shields.io/badge/b%C3%B6lm%C9%99-30-7F52FF">
  <img alt="Kod nümunəsi" src="https://img.shields.io/badge/kod%20n%C3%BCmun%C9%99si-149-C711E1">
  <img alt="Asılılıq" src="https://img.shields.io/badge/as%C4%B1l%C4%B1l%C4%B1q-yoxdur-E44857">
  <img alt="Ölçü" src="https://img.shields.io/badge/%C3%B6l%C3%A7%C3%BC-390%20KB-informational">
  <img alt="Lisenziya" src="https://img.shields.io/badge/lisenziya-MIT-green">
</p>

---

Sıfırdan qabaqcıl səviyyəyə qədər Kotlin dilini öyrədən **tam statik** sayt.
**30 bölmə**, **149 işlək kod nümunəsi**, **6 canlı interaktiv demo** və **15 suallıq bilik testi**.

Backend, verilənlər bazası, `npm install` və build addımı **yoxdur** — faylları serverə kopyalamaq kifayətdir.

---

## Mündəricat

- [Nə var içində](#n%C9%99-var-i%C3%A7ind%C9%99)
- [Sürətli başlanğıc](#s%C3%BCr%C9%99tli-ba%C5%9Flan%C4%9F%C4%B1c)
- [Fayl strukturu](#fayl-strukturu)
- [Serverə yerləşdirmək](#server%C9%99-yerl%C9%99%C5%9Fdirm%C9%99k)
- [Redaktə etmək](#redakt%C9%99-etm%C9%99k)
- [Brauzer dəstəyi](#brauzer-d%C9%99st%C9%99yi)
- [Lisenziya](#lisenziya)

---

## Nə var içində

### Bölmələr

| Qrup | Bölmələr |
|---|---|
| **Başlanğıc** | Kotlin nədir · Tarixçə və ekosistem · Quraşdırma və ilk proqram |
| **Dilin əsasları** | Sintaksis · Dəyişənlər və tiplər · Mətnlər · Operatorlar · Şərtlər · Dövrlər |
| **Funksiyalar** | Funksiyalar · Lambda və HOF · Scope funksiyaları · Genişlənmələr |
| **Təhlükəsizlik və data** | Null təhlükəsizliyi · Kolleksiyalar |
| **Obyekt yönümlü** | Siniflər · Miras və interfeyslər · data/sealed/enum/object · Generiklər |
| **Qabaqcıl** | Coroutine-lər · İstisnalar · Delegatlar və annotasiyalar |
| **Tətbiq sahələri** | Android · Kotlin Multiplatform · Backend (Ktor/Spring) · Test yazmaq |
| **Yekun** | Kotlin vs Java · İdiomlar · Bilik testi · Resurslar |

### İnteraktiv demolar

| Demo | Nə edir |
|---|---|
| **Null-safety laboratoriyası** | Dəyəri `null` / dolu et, operator seç (`?.`, `!!`, `?:`, `let`) — nəticəni və izahı dərhal gör |
| **Kolleksiya zənciri qurucusu** | `filter`, `map`, `sorted`, `take`… klikləyərək zəncir yığ, hər addımın aralıq nəticəsini izlə |
| **Coroutine vizualizatoru** | Ardıcıl və paralel icranı canlı animasiya ilə müqayisə et — 3300 ms ↔ 1500 ms |
| **`when` sınaqçısı** | Dəyər yaz, hansı budağın işə düşdüyünü real vaxtda gör |
| **Tip çıxarışı laboratoriyası** | Literal yaz (`42L`, `3.14f`, `listOf(1,2)`) — kompilyatorun çıxaracağı tipi gör |
| **Scope funksiyaları** | `let` / `run` / `with` / `apply` / `also` — kontekst obyekti və qaytarılan dəyər müqayisəsi |

### Sayt funksiyaları

- 🌗 **İşıqlı / qaranlıq tema** — seçim brauzerdə yadda saxlanılır, sistem seçimi avtomatik tanınır
- 🔍 **Axtarış** — <kbd>Ctrl</kbd>+<kbd>K</kbd> və ya <kbd>/</kbd>. Həm `dəyişən`, həm də diakritiksiz `deyisen` yazılışı ilə işləyir
- 📊 **Oxuma tərəqqisi** — keçdiyin bölmələr yadda saxlanılır, yan paneldə faiz göstərilir
- 📋 **Kopyala / İşlə** — hər kod blokunda; **İşlə** gözlənilən nəticəni animasiya ilə göstərir
- 🎨 **Öz sintaksis rəngləyicisi** — xarici kitabxana yoxdur, tam oflayn işləyir
- 📱 **Tam mobil uyğunluq** + çap (print) üçün ayrıca stil

---

## Sürətli başlanğıc

```bash
git clone https://github.com/Kea335/Kotlin_Info_Web.git
```

```bash
cd Kotlin_Info_Web && python -m http.server 5173
```

Sonra brauzerdə aç: **http://localhost:5173**

> `index.html` faylını birbaşa ikiqat klikləmək də işləyir, amma bəzi brauzerlər `file://`
> rejimində yaddaşa yazmağa icazə vermir — tema seçimi və oxuma tərəqqisi saxlanmır.
> Ona görə kiçik lokal server işlətmək daha yaxşıdır.

Alternativlər:

```bash
npx serve .
```

```bash
php -S localhost:5173
```

---

## Fayl strukturu

```
Kotlin_Info_Web/
├── index.html              # bütün məzmun — 30 bölmə, 149 kod nümunəsi
├── css/
│   └── style.css           # dizayn tokenləri, temalar, responsiv qaydalar
├── js/
│   ├── highlight.js        # Kotlin sintaksis rəngləyicisi (öz yazımız)
│   ├── app.js              # naviqasiya, tema, axtarış, tərəqqi izləmə
│   └── demos.js            # interaktiv demolar və bilik testi
├── deploy/                 # server konfiqurasiya nümunələri
│   ├── nginx.conf          # Nginx (Linux)
│   ├── apache.htaccess     # Apache / cPanel
│   ├── web.config          # IIS (Windows Server)
│   ├── Dockerfile          # Docker imici
│   ├── docker-nginx.conf   # imic daxilindəki Nginx konfiqurasiyası
│   └── docker-compose.yml  # Docker Compose
└── README.md
```

---

## Serverə yerləşdirmək

Build addımı yoxdur. Naviqasiya hash (`#bolme`) üzərində işlədiyi üçün
serverdə **rewrite qaydası da lazım deyil**. Yalnız üç şeyi kopyala:
`index.html`, `css/`, `js/`.

### Nginx (Linux)

```bash
scp -r index.html css js istifadeci@serverin-ip:/var/www/kotlinaz/
```

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/kotlinaz && sudo ln -s /etc/nginx/sites-available/kotlinaz /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
```

Pulsuz HTTPS sertifikatı üçün:

```bash
sudo certbot --nginx -d saytin-adi.az -d www.saytin-adi.az
```

### Apache / cPanel / paylaşılan hostinq

Faylları `public_html` qovluğuna at (FTP, SFTP və ya cPanel File Manager ilə),
sonra `deploy/apache.htaccess` faylını həmin qovluğa `.htaccess` adı ilə kopyala.

```bash
rsync -avz --delete index.html css js istifadeci@server:~/public_html/
```

### IIS (Windows Server)

1. IIS Manager → **Sites** → **Add Website**, fiziki yol olaraq layihə qovluğunu göstər.
2. `deploy/web.config` faylını sayt kök qovluğuna kopyala — o, `.js`/`.css` üçün düzgün
   MIME tipləri, UTF-8 kodlaşdırma və sıxılma parametrlərini təyin edir.

### Docker

```bash
docker compose -f deploy/docker-compose.yml up -d
```

Sayt **http://localhost:8080** ünvanında açılır. Portu `docker-compose.yml` içindən dəyişə bilərsən.

### Pulsuz hostinq

| Xidmət | Necə |
|---|---|
| **GitHub Pages** | `Settings → Pages` → branch olaraq `main`, qovluq `/ (root)` seç |
| **Netlify** | Qovluğu netlify.com saytına sürüşdür (drag & drop) |
| **Cloudflare Pages** | Repoya bağla, build əmri boş qalsın, output qovluğu `/` |

### Serverin minimal tələbləri

| Tələb | Dəyər |
|---|---|
| PHP / Node / verilənlər bazası | **Lazım deyil** |
| Disk sahəsi | ~390 KB |
| MIME tipləri | `.html`, `.css`, `.js` (əksər serverlərdə hazırdır) |
| Kodlaşdırma | **UTF-8** |

> [!IMPORTANT]
> Server `Content-Type: text/html; charset=utf-8` başlığını göndərməlidir.
> Əks halda `ə`, `ş`, `ğ`, `İ` hərfləri pozulur.
> `deploy/` qovluğundakı bütün konfiqurasiyalarda bu artıq nəzərə alınıb.

---

## Redaktə etmək

### Yeni bölmə əlavə etmək

`index.html` içinə bu şablonu əlavə et — yan panel, nömrələmə, əvvəlki/növbəti
düymələri və axtarış indeksi **avtomatik** yenilənir:

```html
<section class="section" id="yeni-bolme" data-title="Bölmənin adı" data-group="Qrup adı">
  <div class="wrap">
    <p class="section-kicker">Bölmə 30</p>
    <h2>Başlıq</h2>
    <p class="lead">Qısa təsvir.</p>

    <!-- məzmun -->

    <nav class="page-nav">
      <button class="pn-btn prev"><div class="pn-dir">Əvvəlki</div><div class="pn-title"></div></button>
      <button class="pn-btn next"><div class="pn-dir">Növbəti</div><div class="pn-title"></div></button>
    </nav>
  </div>
</section>
```

`data-group` yan paneldəki qrup başlığını təyin edir. Eyni qrupun bölmələri
HTML-də ardıcıl dursun ki, nömrələmə səliqəli görünsün.

### Kod bloku əlavə etmək

```html
<div class="code-card" data-output="Gözlənilən nəticə
ikinci sətir">
  <div class="code-head">
    <div class="code-dots"><i></i><i></i><i></i></div>
    <span class="code-title">Fayl.kt</span>
    <div class="code-actions">
      <button class="code-btn run">&#9654; İşlə</button>
      <button class="code-btn copy">Kopyala</button>
    </div>
  </div>
<pre class="code"><code>fun main() {
    println("Salam")
}</code></pre>
  <div class="code-out"><div class="code-out-label">Nəticə</div><pre></pre></div>
</div>
```

- `data-output` — **İşlə** düyməsinin göstərəcəyi nəticə. Kod həqiqətən işləmir;
  bu, əvvəlcədən yazılmış gözlənilən nəticədir.
- Kodda `<` simvolu `&lt;` kimi yazılmalıdır (generiklər üçün: `List&lt;String&gt;`).
- Nəticə düyməsi lazım deyilsə `data-output` atributunu və `.code-out` blokunu sil.

### Test suallarını dəyişmək

`js/demos.js` faylındakı `QUIZ` massivi:

```js
{
  q: 'Sual mətni',
  code: 'ixtiyari kod nümunəsi',   // istəyə bağlı
  opts: ['A variantı', 'B variantı', 'C variantı', 'D variantı'],
  a: 0,                             // düzgün cavabın indeksi (0-dan başlayır)
  exp: 'Cavabdan sonra göstərilən izah'
}
```

### Rəngləri dəyişmək

Bütün rənglər `css/style.css` faylının əvvəlindəki `:root` blokunda dəyişən kimi
təyin olunub. Qaranlıq tema üçün `html[data-theme="dark"]` bloku var.
Brend qradienti — `--k-grad`.

### Faylları dəyişəndən sonra

`index.html` içindəki `?v=20260823` parametrini yenilə (məsələn `?v=20260824`):

```html
<link rel="stylesheet" href="css/style.css?v=20260824">
<script src="js/highlight.js?v=20260824"></script>
```

Bu olmadan istifadəçilərin brauzeri köhnə CSS/JS faylını keşdən götürə bilər.

---

## Brauzer dəstəyi

Chrome, Edge, Firefox, Safari — son 2 il ərzindəki versiyalar.
CSS-də `color-mix()` istifadə olunur; çox köhnə brauzerlərdə bəzi fonlar sadələşir,
amma sayt yenə də tam işlək qalır.

---

## Töhfə vermək

Səhv tapmısan və ya yeni bölmə əlavə etmək istəyirsən?

1. Reponu fork et
2. Yeni branch yarat: `git checkout -b yeni-bolme`
3. Dəyişikliyi commit et: `git commit -m "Yeni bölmə: Kotlin DSL"`
4. Push et və Pull Request aç

Commit mesajları **Azərbaycan dilində** yazılır.

---

## Lisenziya

MIT — məzmunu dərs, təlim və şəxsi öyrənmə məqsədilə sərbəst dəyişdirə,
paylaşa və öz saytında yerləşdirə bilərsən.

Kotlin adı və loqosu **JetBrains s.r.o.** şirkətinə məxsusdur.
Bu sayt JetBrains ilə rəsmi əlaqəsi olmayan müstəqil təlim materialıdır.
