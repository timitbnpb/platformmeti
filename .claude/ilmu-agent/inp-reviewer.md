# Ilmu inp-reviewer

> Kelas: pemeriksa · Model: sonnet · Definisi: `.claude/agents/inp-reviewer.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca inp-reviewer`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus inp-reviewer "..."`.

Read-only: lapor, tidak auto-fix. Aturan induk ada di `~/.claude/INP.md` (versi React); di sini diterjemahkan ke vanilla JS (R11 §4.11). RU = RENCANA-UJI, DS = DESIGN-SYSTEM.

## Peta berkas & tabel

Diperiksa: handler klik, tab, chip, paginasi, sort, lipat, kotak cari, ganti ID/EN di `public/**`.

| Berkas | Isi yang diperiksa |
| --- | --- |
| `public/direktori.js` (3.961 baris, IIFE hasil port) | 8 tab, chip sektor, paginasi `PER_HAL`, sort kolom, laci profil, kotak cari `#akCari` |
| `public/direktori.css`, `public/inti/gaya.css` | `content-visibility`, area klik, kelas aktif |
| `public/peta.html` + `.js`, port peta `.ak-pta` | panel tarik `.ak-side`, lapisan, "Terbang ke", pin bundar |
| `public/perusahaan.js` | tabel sensus `.jm-tabel`, chip `.jm-sektor`, urut, cari |
| `public/p.js`, `public/admin.js`, `public/admin/kurasi.js` | laci, tab Akun/Kurasi/Koreksi/Jejak |
| `public/inti/umum.js` | `nanti()`, `hantuHtml`, `esc` (perkakas penundaan) |
| rumah kontrol bersama (mis. `public/kontrol.js`) | satu-satunya tempat kontrol berchrome dibuat; nama berkas belum ditetapkan DT (RU §8 butir 3) |
| `tests/inp-daftar.json` | pengecualian per handler |

Halaman tanpa login (sensus, `/`, `/peta`, `/perusahaan`, `/p/:slug`) adalah wilayah sendiri: pengunjungnya memakai ponsel kelas menengah-bawah (R11 §6.6, RU §2.3.3), jadi diperiksa dengan anggaran lebih ketat. Fase F2 melewati sepuluh halaman: saat itu minta sapuan penuh lewat skill `inp-sweep`.

## Aturan & invarian

1. **Yang diukur** adalah waktu sampai ada piksel berubah karena interaksi, bukan lama handler atau lama fetch. Handler kosong pun merah bila tak ada yang bisa dicat.
2. **Pisahkan chrome dari isi.** Chrome kontrol (`aria-selected`, `aria-pressed`, `aria-expanded`, `aria-current`, kelas aktif, panah sort) berubah SINKRON di handler. Isi berat (tabel, grafik, peta, daftar hasil) menyusul. Membungkus SELURUH perubahan dalam penundaan BUKAN obatnya: chrome ikut tertunda, tak ada yang bisa dicat (INP.md; R11 §4.11).
3. **Penundaan sesudah satu bingkai tercat**: dua `requestAnimationFrame` berantai, `setTimeout` sebagai jaring untuk tab tersembunyi (kelas kelima INP.md: catnya tak pernah datang meski handler 1 sampai 8 ms). Dilakukan di SATU rumah perkakas (`nanti()`/rumah kontrol), bukan di tiap pemanggil.
4. **Kontrol berchrome hanya lahir lewat rumah kontrol bersama** (RU §2.3.3, §1.4 gerbang-inp-transisi). Atribut `aria-selected|pressed|expanded|current` ditulis di luar rumah itu = temuan.
5. **Pengecualian per handler** di `tests/inp-daftar.json`, tidak per berkas (INP.md: kegagalan paling sunyi). Tolak entri bergaya berkas.
6. **Kotak cari**: debounce 120 ms (DS §6.0), batalkan permintaan lama dengan `AbortController`, hasil dirender bertahap. Pencarian dari API, bukan menyaring seluruh indeks klien di tiap ketukan (R12 §8.8).
7. **Tabel besar**: tidak ada render sinkron ribuan baris di handler klik; paginasi `PER_HAL`, render ulang lewat `nanti()`; `content-visibility: auto` untuk daftar panjang; delegasi event, bukan satu listener per baris (R11 §4.11).
8. **MapLibre dan pustaka graf dimuat malas** hanya saat tab/halaman dibuka (RU L10); pin kecil diberi area klik diperluas (asal ±6 px, R10 §4.8) dan render pin ditunda; tinggi laci/lembar tidak melompat.
9. **Kontrol tanpa state yang terlihat** (pill nav ber-`href`, akordeon, tab tautan): tidak ada `setX()` untuk dicurigai, jadi tiap pemindai yang mencari `set...(` meloloskannya. Telusuri tiap listener `click`, `input`, `keydown`, `change`, bukan nama fungsi.
10. **Ambang uji** (RU §2.3.3): 7 interaksi (tab direktori, chip sektor, paginasi, sort, laci profil, ketik cari, ganti ID/EN), 5 ulangan, throttle CPU 4x (login) dan 6x (tanpa login, 390 px); lolos bila nilai tertinggi kedua di bawah 200 ms, dan chrome sudah berubah pada `requestAnimationFrame` pertama.
11. Bahasa: ganti ID/EN adalah interaksi INP juga; render ulang seluruh halaman sinkron = temuan.

## Ranjau yang pernah meledak

- **Overlay INP menyala di 4 lalu 2 kontrol padahal `startTransition` terpasang** (pangantara, R11 §4.11, 24-25 Agt 2026). Sebab: seluruh setState dibungkus, tak ada update urgent. Tahu: ukur dengan `PerformanceObserver` event timing, bukan membaca kode.
- **Katanya sudah diperbaiki, tetap 202 ms** (INP.md kelas lima). Sebab: kerja deferred jalan sebelum bingkai tercat. Tahu: handler pendek tapi long task 130-260 ms sesudahnya.
- **Gerbang INP otomatis tidak ada, hanya agent peninjau** (R10 §4.8, §8 butir 18). Akibat: aturan tanpa gerbang dianggap belum jadi. Tahu: cek `gerbang-inp-transisi.test.mjs` benar ada dan terbukti merah atas `tests/fixtures/gerbang/gerbang-inp-transisi/jahat/`.
- **Pemindai satu bentuk penulisan** (INP.md): handler bernama, atribut bersyarat di baris berikutnya, handler dioper sebagai argumen lolos dari regex tunggal. Periksa PEMANGGILAN, lalu tanya apakah state yang ditunda ikut muncul di atribut aria.
- **Render grafik/kuadran sinkron tiap klik chip** dan pencarian `innerHTML` tiap ketukan (R12 §8.8): aman di 400 entri, beku di skala METI.
- **Kamus/berkas raksasa dimuat penuh** (R10 §6.4, §8 butir 3): `direktori.js` 3.961 baris dan `direktori.css` 238 KB membebani LCP; ukur sebelum menambah.

## Gerbang yang menghakimi

`gerbang-inp-transisi.test.mjs` (statis, tanpa peramban): merah bila kontrol berchrome dibuat di luar rumah kontrol, atribut aria ditulis di luar rumahnya, atau handler yang menunda chrome tidak ada di `tests/inp-daftar.json`. Uji ukur di `tests/layar/inp.spec.mjs` (Playwright, CDP throttle). Kamu melengkapi, bukan menggantikan, keduanya: temuanmu tentang bentuk penulisan yang tak dikenali pemindai dilaporkan ke `penulis-gerbang` sebagai celah gerbang. Lapor ke sesi induk dengan tingkat (tinggi bila INP lewat 200 ms atau chrome tertunda), berkas:baris, dan kelas INP 1 sampai 5. Jejak: `ilmu.mjs cek inp-reviewer <berkas>` sebelum membaca ulang; `catat` sesudah.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
