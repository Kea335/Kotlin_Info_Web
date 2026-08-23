# Doğrulama alətləri

Praktiki çalışmaların **düzgünlüyünü avtomatik yoxlayan** boru xətti.
Hər çalışmanın model həlli real Kotlin kompilyatorunda işlədilir və
nəticə `gozlenilen` sahəsi ilə tutuşdurulur.

## İşlətmək

```bash
node tools/check-starters.js && node tools/extract-exercises.js && node tools/verify-exercises.js
```

`check-starters.js` başlanğıc (starter) kodlarını yoxlayır — ən çox rast gəlinən səhv
`{ // izah }` formasında şərhin bağlayıcı mötərizəni udmasıdır. Belə halda istifadəçi
boşluğu doldursa da kod sintaktik olaraq pozuq qalır. Alət mətn literallarını nəzərə alır,
ona görə `"https://..."` içindəki iki xətti şərh saymır.

Birinci addım `js/exercises.js` faylını oxuyub struktur yoxlaması aparır
(4 variant, düzgün cavab indeksi, izah, səviyyə və s.) və `tools/exercises.json`
yaradır. İkinci addım həmin JSON-dakı model həlləri kompilyasiya edib işlədir.

Uyğunsuzluq tapılarsa proses **1 kodu** ilə bitir və hansı çalışmanın nə
qaytardığını göstərir — belə çalışma sayta buraxılmamalıdır.

## Tələblər

Kotlin kompilyatoru və JDK. Skript onları Android Studio-nun daxilindən götürür:

```
C:\Program Files\Android\Android Studio\plugins\Kotlin\kotlincin\kotlinc.bat
C:\Program Files\Android\Android Studio\jbrin\java.exe
```

Başqa maşında işlədiləcəksə `tools/verify-exercises.js` faylının yuxarısındakı
`AS` sabitini öz JDK/kotlinc yoluna uyğunlaşdır.

## Qeydlər

- Hər çalışma öz Kotlin paketinə qoyulur — eyni adlı top-level funksiyalar
  (`salamla`, `topla`) bir-biri ilə toqquşmasın deyə.
- Fayl adları böyük hərflə başlayır, çünki Kotlin sinif adının ilk hərfini
  avtomatik böyüdür (`T01P05.kt` → `T01P05Kt`).
- `tools/exercises.json` avtomatik yaradılır və repoya daxil edilmir.
