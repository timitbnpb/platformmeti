# Skema data topik mendalam (kontrak cetakan /topik)

Pemilik cetakan: agent `layar` (Karbon). Kerangka bab: `TOPIK-MENDALAM.md` (1 sampai 42). Satu cetakan membaca dua berkas per topik:

| Berkas | Isi | Penulis |
| --- | --- | --- |
| `public/data/topik/dasar-<id>.json` | irisan otomatis dari data yang sudah ada (pemain, proyek, regulasi, inovasi, berita, acara, pustaka, pakar, riset) | `node scripts/pipa/topik_bangun.mjs` (jangan disunting tangan) |
| `public/data/topik/<berkas>.json` | **naskah terkurasi** (angka kunci, teks, tabel, grafik, kasus, daftar periksa) | pengerja topik, ikuti skema ini |

`<berkas>` = id topik dengan `-` diganti `_` (`panas-bumi` jadi `panas_bumi.json`). Pipeline panen tambahan: `scripts/pipa/topik_<berkas>.mjs`, menulis ke `public/data/topik/<berkas>_luar.json` atau langsung ke naskah. ID topik: karbon, surya, bayu, panas-bumi, hidro, bioenergi, hidrogen, penyimpanan, kendaraan-listrik, jaringan, efisiensi, nuklir, transisi-berkeadilan, pembiayaan-hijau.

## Aturan keras
1. Tiap angka punya `sumber` (kunci ke peta `sumber`) dan tanggal. Turunan hitung sendiri diberi `"est": true` (tampil label EST).
2. Teks dua bahasa: `{ "id": "...", "en": "..." }`. Tanpa em dash, tanpa titik tengah, tanpa kapital penuh, tanpa panah teks.
3. Bab yang tidak ada di `bab` disembunyikan. Jangan isi bab dengan karangan; lebih baik kosong.
4. Hanya sumber terbuka; panen sopan (UA `METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)`, robots, jeda >= 2 s, berhenti pada 403/429).
5. Tidak ada URL karangan; `url` sumber boleh jalur situs ("/data/x.json") untuk berkas milik repo. Foto: berkas lokal di `public/img/` dengan kredit.

## Bentuk berkas naskah
```json
{
  "id": "surya", "versi": 1, "diperbarui": "2026-11-08",
  "judul": { "id": "Surya", "en": "Solar" },
  "lead": { "id": "Satu kalimat posisi topik.", "en": "..." },
  "kunci": [ { "label": {"id":"...","en":"..."}, "nilai": 1234.5, "d": 1, "satuan": {"id":"MWp","en":"MWp"}, "sumber": "s1", "est": false } ],
  "penting": [ {"id":"...","en":"..."}, {"id":"...","en":"..."}, {"id":"...","en":"..."} ],
  "posisi": { "id": "Satu kalimat posisi Indonesia dibanding dunia.", "en": "..." },
  "sumber": { "s1": { "judul": "...", "penerbit": "...", "url": "https://...", "tanggal": "2026-11-08", "tahun": 2025, "bukti": "resmi", "lisensi": "CC BY 4.0" } },
  "bab": { "2": { "tipe": "faq", "butir": [] } }
}
```
`kunci` tepat 5 butir; `nilai` boleh angka atau teks. `bukti`: resmi | kajian | media | via-pihak-ketiga | editorial.

## Tipe bab (`bab["<nomor>"]`)
Semua tipe boleh membawa `"sumber": ["s1","s2"]`, `"judul"` (menimpa judul baku) dan `"catatan"` (teks dua bahasa).

| tipe | bentuk |
| --- | --- |
| `teks` | `{ "tipe":"teks", "paragraf":[ {id,en} ] }` |
| `faq` | `{ "tipe":"faq", "butir":[ { "t":{id,en}, "j":{id,en} } ] }` |
| `glosarium` | `{ "tipe":"glosarium", "butir":[ { "istilah":{id,en}, "arti":{id,en} } ] }` |
| `rumus` | `{ "tipe":"rumus", "rumus":[ {id,en} ], "contoh":[ {id,en} ] }` |
| `langkah` | `{ "tipe":"langkah", "butir":[ { "judul":{id,en}, "isi":{id,en}, "pelaku":{id,en} } ] }` (rantai nilai, alur izin) |
| `tabel` | `{ "tipe":"tabel", "per":8, "kolom":[ { "k":"nama", "l":{id,en}, "num":false, "d":0, "url":"kolom_url" } ], "baris":[ { "nama":"x" } ] }`; sel boleh `{id,en}` atau angka; kolom `url` menjadikan sel tautan |
| `grafik` | `{ "tipe":"grafik", "jenis":"garis"\|"kolom"\|"batang", "label":{id,en}, "satuan":"MW", "d":0, "seri":[ { "nama":{id,en}, "sorot":true, "titik":[ ["2020",10], ["2021",12] ] } ] }` |
| `linimasa` | `{ "tipe":"linimasa", "butir":[ { "tanggal":"2025-10-10", "judul":{id,en}, "url":"https://..." } ] }` (masa depan otomatis berlabel dijadwalkan) |
| `kasus` | bab 39 dan 40, lihat di bawah; `jenis`: berhasil, gagal, mundur, mangkrak, mati, atau dibatalkan (tiap jenis butuh teks `kasus.<jenis>` di ui.json) (selain berhasil = kartu kasus gagal: wajib `sumber` dan `hak_jawab`) |
| `pola` | bab 41, lihat di bawah |
| `periksa` | bab 42, lihat di bawah |

## Bab K
**`kasus`** (bab 39 berhasil, bab 40 gagal/mangkrak/mundur):
```json
{ "tipe":"kasus", "butir":[ {
  "id":"sidrap", "nama":"PLTB Sidrap", "jenis":"berhasil", "negara":"ID", "lokasi":{"id":"Sulawesi Selatan","en":"South Sulawesi"},
  "foto": { "src":"/img/beranda/bayu-sidrap.webp", "alt":{id,en}, "kredit":"USAID Indonesia, domain publik" },
  "profil":[ { "label":{id,en}, "nilai":{id,en} | "teks" | 75, "satuan":"MW" } ],
  "tindakan":[ {id,en} ], "sebab":[ {id,en} ],
  "angka":[ { "label":{id,en}, "nilai":0.3, "d":1, "satuan":"", "sumber":"s1", "est":false } ],
  "pelajaran":[ {id,en} ],
  "kronologi":[ { "tanggal":"2018-07-02", "teks":{id,en} } ],
  "terdampak":{id,en}, "seharusnya":{id,en}, "tanda_bahaya":[ {id,en} ],
  "faktor": { "lahan":true, "ppa_tarif":false },
  "sumber":["s1"], "hak_jawab": true
} ] }
```
`sebab` = kenapa berhasil (bab 39) atau penyebab utama (bab 40). Kasus gagal wajib `sumber` dan `hak_jawab: true` (cetakan menampilkan tautan hak jawab).

**`pola`** (bab 41): `{ "tipe":"pola", "faktor":[ { "k":"lahan", "l":{id,en} } ] }`. Tabel faktor x proyek dibangun otomatis dari `faktor` tiap kasus di bab 39 dan 40 (`true` = faktor ada dan membantu pada kasus berhasil / ada dan menjadi sebab pada kasus gagal; kunci tak diisi = tanpa data, tampil kosong).

**`periksa`** (bab 42): `{ "tipe":"periksa", "peran":[ {"k":"pengembang","l":{id,en}} ], "tahap":[ {"k":"lokasi","l":{id,en}} ], "butir":[ { "peran":"pengembang", "tahap":"lokasi", "teks":{id,en}, "dasar":"s1" } ] }`. Cetakan membuat daftar periksa interaktif per peran (centang tersimpan di peramban), unduh CSV dan cetak PDF.

## Contoh minimal
Lihat `public/data/topik/karbon.json` (contoh lengkap) dan uji `tests/topik.test.mjs` yang memvalidasi bentuk, dua bahasa, rujukan sumber, dan larangan karakter.

## Tambahan khusus Karbon (dihitung cetakan, tidak diketik tangan)
- `kunci[].ref` (cakupan, ets_usd, bursa_vol, kredit_terbit, emisi_juta) dan token `{nama}` di teks diisi `public/topik_karbon.js` dari `dasar-karbon.json` dan `luar_karbon.json`.
- `kasus[].dari` ({"jenis":"kredit","id":"vcs_487"} atau {"jenis":"negara","kode":"DEU"}) mengisi profil, angka, dan faktor kasus dari data; `pola.faktor` (proyek kredit) dan `pola.faktor_negara` (instrumen negara).
- Topik lain memakai `kunci[].nilai` biasa; tanpa token.
