# Ilmu i18n-guard

> Kelas: pemeriksa · Model: haiku · Definisi: `.claude/agents/i18n-guard.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca i18n-guard`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus i18n-guard "..."`.

Read-only: membandingkan dan melapor, tidak menerjemahkan, tidak menyunting. DT = DESAIN-TEKNIS, RU = RENCANA-UJI, KP = KEPUTUSAN-METI.

## Peta berkas & tabel

| Berkas | Peran |
| --- | --- |
| `public/i18n/id.json`, `public/i18n/en.json` | kamus datar, kunci bertitik (`nav.sensus`, `galat.dilarang`); keduanya harus himpunan kunci sama |
| `public/i18n.js` | `t(kunci, param)`, `angka()`, `tanggal()`; SATU-SATUNYA formatter (ALG §10) |
| `public/*.js`, `public/inti/*.js`, `public/admin/*.js` | pemanggil `t()`; tempat teks tertanam mungkin bersembunyi |
| `public/*.html` | teks statis, atribut `title`, `aria-label`, `placeholder`, `alt`, `<title>`, `<meta name="description">` |
| `public/direktori.js` | hasil port 3.961 baris, berisi teks Indonesia tertanam; utang eksplisit di `antre` registri `gerbang-i18n`, hanya boleh menyusut (RU §2.8 butir 5, RU §8 butir 10) |
| `tests/fixtures/teks-diizinkan.json` | pengecualian heuristik per butir, wajib beralasan |
| `tests/gerbang-i18n.test.mjs`, `tests/i18n.test.mjs` | gerbang dan uji formatter |

## Aturan & invarian

1. **Paritas**: himpunan kunci `id.json` = `en.json`; tidak ada nilai kosong (PRD U6, RU §2.8 butir 1). Periksa dua arah: kunci hanya di ID, kunci hanya di EN.
2. **Tiap `t("...")` merujuk kunci yang ada.** Kunci hilang di EN tidak boleh jatuh diam-diam ke ID: jatuh itu sah tetapi dicatat sebagai galat uji (DT §8.4 butir 1). Kunci mentah (pola `^[a-z]+\.[a-z_.]+$`), `undefined`, `NaN`, `null` yang tampil di layar = temuan tinggi (RU L4).
3. **Tidak ada teks Indonesia atau Inggris tertanam** di JS layar baru (DT §8.4 butir 5), termasuk di atribut `title`, `aria-label`, `placeholder`, `alt`, `data-tip` dan teks dalam template string `innerHTML`. Pengecualian hanya via `tests/fixtures/teks-diizinkan.json` dengan alasan.
4. **Kode galat API** (`galat.<kode>`) ada di kedua kamus untuk 10 kode DT §4.1 butir 4; klien menerjemahkan dari `kode`, bukan menampilkan pesan mentah server.
5. **Terjemahan EN yang belum ditinjau diberi tanda `perlu tinjau`** sampai ada penutur yang meninjau (KP D10, C-14). Terjemahan mesin tanpa tanda = temuan sedang.
6. **Isi data** punya kolom `_en`; bila kosong tampil versi ID dengan pil "ID" (KP D10, RU §2.8 butir 2). Teks alasan kosong/ketidakpastian ikut dikamuskan (R12 §6.4).
7. **Angka dan tanggal** hanya lewat `angka()`/`tanggal()` (KP D17): `toLocaleString`/`toFixed` di luar `public/i18n.js` = temuan. Format `id-ID` di mode ID, Inggris di mode EN.
8. **Pilihan bahasa**: `?lang=` menang atas `localStorage` (dibungkus try/catch) menang atas `akun.bahasa` menang atas `id`; `<html lang>` ikut berganti; potongan campur bahasa diberi `lang` sendiri.
9. **Tanda baca**: tidak ada em dash (U+2014) maupun titik tengah (U+00B7) sebagai pemisah di teks Indonesia (KP D17, gerbang-teks). Pemisah pakai koma, titik dua, atau tanda hubung biasa.
10. **Larangan nama**: kamus tidak menyebut "RLS" atau "row level security" sebagai fitur D1 bawaan tanpa penjelasan; janji RLS dipenuhi `hak.js` (RU §2.8 butir 4, PRD F-M3).
11. Pindai kamus untuk sisa asal: `BNPB`, `BPBD`, `karhutla`, `DIBI` di teks direktori (TIKET JM-C03).

Cara kerja hemat (haiku): daftarkan kunci kedua kamus dengan skrip pendek, selisihkan, lalu `grep` pola teks tertanam. Catat berkas yang sudah bersih lewat `ilmu.mjs catat` supaya tidak diulang bila blob tak berubah.

## Ranjau yang pernah meledak

- **Kunci = teks Indonesia** (R10 §6.2): kamus asal berkunci kalimat, rapuh terhadap perubahan redaksi; `en.json` 965 KB dimuat penuh di mode EN. Akibat: kunci diam-diam tak cocok. Tahu: kalimat sebagai kunci. METI memakai kunci titik, dengan kamus per halaman bila membengkak.
- **Terjemahan tanpa gerbang kamus** (R10 §6.2): tidak ada uji bahwa EN sama dengan ID. Tahu: `gerbang-i18n` merah di CI.
- **Penerjemah `MutationObserver` yang menerjemahkan simpul teks** (R10 §6.2): tidak dipakai; METI memakai `t()` eksplisit.
- **Paritas kunci tanpa uji di Neraca** (R12 §4.3, §6.3): wajib uji statis kedua arah, plus `lang` berganti dan format angka dari satu pembungkus `Intl`.
- **Aturan copy hanya ingatan** (R11 §6.9): tanda baca dan format jam/angka dikunci mesin (hook, gerbang-teks), bukan kewaspadaan.
- **Fallback ke ID tidak terlihat**: kunci EN hilang tampak "bekerja" karena tampil Indonesia. Tahu: cari kunci yang hanya ada di `id.json`.
- **`localStorage` melempar galat** (private mode): halaman harus tetap tampil berbahasa Indonesia (RU L11).

## Gerbang yang menghakimi

`gerbang-i18n.test.mjs` merah bila: kunci id/en tak sama, `t("...")` ke kunci tak ada, teks Indonesia tertanam di JS layar baru (heuristik kata penghubung). `gerbang-teks.test.mjs` merah bila U+00B7/U+2014 di `public/**` dan `docs/perencanaan/*.md`, `toLocaleString` di luar `i18n.js`, sisa asal. `tests/layar` L4 dan L11 menangkap kunci mentah dan perilaku `?lang=`. Registri `antre` `gerbang-i18n` hanya boleh menyusut; laporkan bila `public/direktori.js` bertambah teks tertanam. Temuan terjemahan (kualitas) bukan wilayahmu: serahkan ke pemilik atau peninjau EN. Temuan formatter atau tombol dwibahasa yang rusak diteruskan ke `layar`.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
