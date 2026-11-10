# DESIGN-SYSTEM penyempurnaan November 2026

Otoritas: `KEPUTUSAN-METI` K15, K23, K24, D21. Dokumen ini hanya **pelengkap** `docs/perencanaan/DESIGN-SYSTEM.md` (DS lama) dan `public/inti/tema.css`. Bila bertentangan, urutan: KEPUTUSAN, ALGORITMA (enum, rumus, istilah skor), dokumen ini untuk komponen baru, DS lama untuk sisanya. Token tidak ditambah di sini; semua warna, jarak, dan bentuk memakai token yang sudah ada.

## 0. Cara memakai

- Layar baru hanya memakai token `tema.css` dan kelas yang sudah ada di `public/inti/jm.css`, `public/inti/gaya.css`, `public/direktori.css`. Kelas baru di bawah ditandai **(baru)**; semuanya berawalan `jm-` dan hanya memakai `var(--...)`. Tidak ada hex di CSS atau SVG di luar `tema.css` (gerbang `gerbang-token-meti`).
- Berkas gaya: kelas baru milik satu layar ditulis di CSS layar itu (mis. `public/admin_kesegaran.css`), bukan ke `jm.css`. Kelas yang dipakai dua layar atau lebih (kunci tier, antrean ragu) naik ke `public/inti/jm.css`.
- Rujukan: tiap pengerja layar membuka modul padanan di checkout `poskokarhutla-karantina-git` (Direktori Jaringan Kebencanaan, kelas `.ak-*`) lebih dulu dan menyebut path rujukan di brief. Bila tidak ada padanan, tiru pola terdekat di `public/direktori.css` lalu catat di brief.
- Teks dalam `{kurung kurawal}` pada contoh HTML adalah kunci i18n (`id.json` dan `en.json` bersamaan, tanpa teks tertanam di JS). Format angka lewat `angka()`, tanggal `7 Nov 2026`, jam 24 jam dengan "WIB".
- Contoh HTML ditulis sebagai keluaran fungsi pembuat string (pola `exHtml`, `kosongHtml`), bukan HTML statis. Semua nilai dari data lewat `esc()`.

## 1. Aturan lintas komponen (rangkuman, bukan aturan baru)

| Hal | Aturan |
| --- | --- |
| Tabel | `div.jm-gulir > table.jm-tabel`; th tengah, gradien `--brand` ke `--brand2`, tanpa kapital penuh (D21); kolom label kiri; angka `td.jm-num` rata kanan `tabular-nums`; nilai kosong `-` redup bertooltip; tabel kosong tetap digambar dengan satu baris "Belum ada ..."; kartu bertumpuk di bawah 768 px lewat `td[data-label]`; tautan di sel tanpa garis bawah. |
| Grafik | Sungguhan (batang, kolom, garis, dumbbell dari `/grafik.js`), satu warna sorot `--accent-isi`, sisanya `--line-ctl`; hover atau sentuh memunculkan garis pemandu, titik sorot, dan tooltip nilai; **klik memunculkan detail sebagai pop up tengah** (`.ak-dlg`), judul maksimal 3 baris; padanan tabel atau teks selalu ada. |
| Teks kartu | Judul dan deskripsi beberapa baris di kartu rata kanan-kiri (`text-align:justify; hyphens:auto`); sel tabel dan judul satu baris tidak. |
| Menu dan kontrol | Tab, segmen, dan deretan pilihan ujung ke ujung: `grid-auto-flow:column; grid-auto-columns:1fr`, isi tengah, tinggi 44 px, berikon 18 px (`ikon("nama",18)`, sprite `public/img/ikon.svg`). Tombol ikon polos tanpa kotak, `aria-label` dan `title` wajib. |
| Jarak | Tidak dempet: hero ke baris kartu 24 px atau lebih, antar kartu 16 sampai 24 px (`--gap` 12 px hanya di dalam kartu), label KPI satu baris, tinggi kartu sama. |
| Angka | Tiap angka bersumber, bertanggal, `EST` untuk turunan, "n dari N" untuk penyebut. Tanpa angka karangan: kosong ditulis `-` dengan alasan. |
| Dummy | Tidak ada tombol, kolom, atau mode isi data contoh (K15). Keadaan Kosong dirancang dan diuji dengan data kosong sungguhan; fixture hanya di `tests/`. |
| Teks | Tanpa em dash, tanpa titik tengah sebagai pemisah, tanpa emoji; lugas dan faktual (ATURAN X10); satu kalimat instruksi. |
| Target sentuh | Minimal 44 px; tanpa scroll horizontal di 390 px. |

### 1.1 Keadaan baku (dipakai semua komponen)

| Keadaan | Kelas dan perilaku |
| --- | --- |
| Memuat | `<div class="jm-hantu" aria-busy="true"><i></i><i></i><i></i></div>`, tinggi total sama dengan isi akhir (hindari lompatan tata letak); `prefers-reduced-motion` mematikan denyut; tanpa spinner penuh layar. |
| Kosong | `kosongHtml(kunci, aksi)` dari `public/inti/umum.js`: `div.jm-kosong` berisi ikon, **satu** kalimat, dan **satu** aksi normal. Tidak pernah memakai `0` sebagai pengganti "belum ada". |
| Galat (D21) | **Kartu utama** halaman: `div.jm-galat[role=alert]` berisi ikon, kalimat dari katalog `jm.galat`, tombol "Coba lagi". **Bagian opsional** (mis. panel samping, jejak dampak): disembunyikan seluruhnya, tanpa kotak merah, dan dicatat di konsol dengan kunci bagian. |
| Terkunci | Bukan galat. Memakai komponen 5 (kunci tier). Kode 403 karena tier menampilkan kunci; kode 403 karena peran menyembunyikan bagian. |
| Luring | Pita kecil `.jm-pita`; data terakhir tetap tampil dengan tanggalnya. |
| Gelap | Dua blok gelap `tema.css` identik; komponen tidak punya aturan gelap sendiri kecuali lewat token. Gerbang `gerbang-tema-kembar` tetap hijau. |
| 390 px | Satu kolom; tab ujung ke ujung, bila lebih dari 3 opsi dibagi dua baris penuh; tabel menjadi kartu; dialog jadi lembar bawah penuh lebar dengan tombol tutup 44 px. |

## 2. Komponen baru

Untuk tiap komponen: tiket asal, contoh HTML, lalu tabel keadaan yang melengkapi §1.1.

### 2.1 Panel kesegaran dataset (JM-T08)

Rute admin (`public/admin_kesegaran.js`). Menampilkan 178 dataset: nama, frekuensi sumber, terakhir berhasil, batas basi, status. Ringkasan di atas, tabel di bawah, detail per dataset di pop up tengah.

```html
<section class="ak-panel" aria-labelledby="kes-j">
  <h2 id="kes-j" class="jm-eyebrow">{jm.kes.judul}</h2>
  <div class="jm-angka">                                  <!-- 4 kartu, tinggi sama -->
    <a class="jm-kpi" href="#basi"><span class="jm-kpi-l">{jm.kes.basi}</span>
      <b class="jm-uang-n">12</b><small class="jm-pen">{jm.n_dari} 178</small></a>
    <!-- ok, gagal, blokir/perlu_kunci -->
  </div>
  <div class="jm-saring">
    <div class="ak-seg" role="tablist">                   <!-- ujung ke ujung -->
      <button class="jm-tab" role="tab" aria-selected="true">{jm.kes.semua}</button>
      <button class="jm-tab" role="tab" aria-selected="false">{jm.kes.basi}</button>
      <button class="jm-tab" role="tab" aria-selected="false">{jm.kes.gagal}</button>
    </div>
  </div>
  <div class="jm-gulir"><table class="jm-tabel">
    <thead><tr><th>{jm.kes.dataset}</th><th>{jm.kes.frekuensi}</th>
      <th aria-sort="descending"><button class="jm-urut">{jm.kes.terakhir}</button></th>
      <th>{jm.kes.status}</th></tr></thead>
    <tbody><tr>
      <td class="jm-id" data-label="{jm.kes.dataset}"><b>Berita</b><small>berita.json</small></td>
      <td class="jm-tengah" data-label="{jm.kes.frekuensi}">{jm.frek.harian}</td>
      <td class="jm-num" data-label="{jm.kes.terakhir}"><time datetime="2026-11-11">11 Nov 2026</time></td>
      <td class="jm-tengah" data-label="{jm.kes.status}"><span class="jm-pil jm-pil-warn">{jm.kes.st.basi}</span></td>
    </tr></tbody></table></div>
</section>
```

- Status `ok | basi | gagal | blokir | perlu_kunci` (enum dari JM-T01, ALGORITMA menang). Pil selalu bertulisan; warna: ok `jm-pil-ok`, basi dan perlu_kunci `jm-pil-warn`, gagal dan blokir `jm-pil-bad`.
- Batas basi mengikuti frekuensi sumber (harian 2 kali jadwal, mingguan 2 kali, dan seterusnya; nilai pasti dari ALGORITMA). Baris menampilkan "batas basi" sebagai tooltip, bukan kolom tambahan.
- Grafik: satu `batang()` "umur data per dataset" dengan garis ambang putus-putus (`jm-gf-ref`); klik batang membuka pop up detail (riwayat 10 putaran terakhir, URL sumber, kode status HTTP terakhir, tautan ke PR data-bot).

| Keadaan | Rancangan |
| --- | --- |
| Memuat | Empat kartu `jm-hantu` setinggi kartu + tabel 8 baris kerangka. |
| Kosong | Tidak terjadi (dataset selalu ada); bila filter tak cocok: `kosongHtml("jm.kosong.cocok", "jm.kosong.reset")`. |
| Galat | Kartu utama (ringkasan dan tabel) gagal: `jm-galat` + Coba lagi. Grafik gagal: grafik disembunyikan, tabel tetap. |
| Gelap | Pil memakai `*-bg` dan teks token status; garis ambang `--ref`. |
| 390 px | Kartu 2 kolom; tab dua baris penuh; tabel jadi kartu dengan nama dataset sebagai judul kartu; pop up jadi lembar bawah. |

### 2.2 Dampak regulasi (JM-U07)

Dua arah: pada halaman regulasi, daftar entitas terdampak; pada halaman proyek, organisasi, teknologi, dan wilayah, daftar aturan yang mengikat. Setiap baris memuat **dasar pasal** dan **tingkat bukti**; tanpa dasar, baris tidak dirender.

```html
<section class="ak-panel jm-dampak" aria-labelledby="dmp-j">            <!-- (baru) -->
  <h2 id="dmp-j" class="jm-eyebrow">{jm.dampak.judul}</h2>
  <div class="ak-seg" role="tablist">
    <button class="jm-tab" role="tab" aria-selected="true">{jm.dampak.proyek} <span class="jm-pen">14</span></button>
    <button class="jm-tab" role="tab" aria-selected="false">{jm.dampak.org}</button>
    <button class="jm-tab" role="tab" aria-selected="false">{jm.dampak.tek}</button>
    <button class="jm-tab" role="tab" aria-selected="false">{jm.dampak.wil}</button>
  </div>
  <ul class="jm-rank">                                                   <!-- baris berbar, seluruh baris tautan -->
    <li><a href="/proyek/ID">
      <span class="jm-rank-no">1</span>
      <span class="jm-id"><b>Nama proyek</b><small>{jm.dampak.dasar} Pasal 12 ayat 2</small></span>
      <button class="jm-bukti" data-b="resmi" aria-label="{jm.bukti.resmi}">{jm.bukti.resmi}</button>
    </a></li>
  </ul>
  <p class="jm-pen">{jm.dampak.n}</p>                                    <!-- "14 dari 120 proyek ber-regulasi" -->
</section>
```

- Tingkat bukti memakai `jm-bukti[data-b]` yang sudah ada (`resmi`, `media`, `est`, `hip`, `kata`, `kajian`, `tinjau`); `tinjau` untuk tautan yang menunggu kurator. Klik pil membuka `.jm-bukti-tip` (sumber, tanggal periksa).
- Peta dampak lintas wilayah: grafik batang per provinsi; klik batang memunculkan pop up tengah berisi daftar entitas provinsi itu.
- Sisi sebaliknya (pada entitas): judul "Aturan yang mengikat", tiap baris berisi nomor dan judul aturan, status berlaku per tanggal (`jm-pil-ok` berlaku, `jm-pil-bad` dicabut, `jm-pil-warn` diubah), ikon unduh PDF dan tautan sumber (`unduhRegHtml`).

| Keadaan | Rancangan |
| --- | --- |
| Memuat | `jm-hantu` tiga baris. |
| Kosong | `kosongHtml("jm.dampak.kosong", ...)`: "Belum ada dampak yang tertaut ke aturan ini"; aksi: "Usulkan tautan" (anggota ke atas) atau tanpa aksi bagi tamu. |
| Galat | Bagian opsional pada halaman entitas: disembunyikan. Pada halaman regulasi (kartu utama dampak): `jm-galat`. |
| Gelap | `.jm-bukti` sudah memakai token status; pil `est`, `hip` memakai `color-mix` token. |
| 390 px | Tab dua baris penuh; baris peringkat satu kolom, pil bukti pindah ke bawah nama, tidak terpotong. |

### 2.3 Teks peraturan dengan jangkar pasal (JM-U01, U06)

Halaman baca satu aturan dari `hukum/<jenis>/<tahun>/<id>.md`. Kolom kiri daftar isi pasal (sticky), kolom kanan teks. Tiap pasal punya jangkar `#pasal-12` yang bisa disalin dan dirujuk dari komponen 2.2.

```html
<article class="jm-wadah jm-naskah-reg">                                  <!-- (baru) -->
  <header class="ak-panel">
    <h1>{judul aturan}</h1>
    <div class="jm-aksi">
      <span class="jm-pil jm-pil-ok">{jm.reg.berlaku}</span>
      <time datetime="2026-11-11">{jm.reg.per} 11 Nov 2026</time>
      <a class="jm-tbl" href="/api/hukum/ID/pdf">{ikon unduh}{jm.reg.unduh}</a>
    </div>
    <p class="jm-pen">{jm.reg.mutu}</p>                                    <!-- mutu OCR bila dari pindaian -->
  </header>
  <div class="jm-reg-tabel">
    <nav class="jm-reg-ik" aria-label="{jm.reg.isi}"><ol>
      <li><a href="#pasal-1">Pasal 1</a></li>
    </ol></nav>
    <div class="jm-reg-isi">                                                <!-- (baru) -->
      <section id="pasal-1" tabindex="-1">
        <h3>Pasal 1 <button class="iconbtn" aria-label="{jm.reg.salin_jangkar}" title="{jm.reg.salin_jangkar}">{ikon tautan}</button></h3>
        <p>...</p>
      </section>
    </div>
  </div>
  <section class="ak-panel"><h2 class="jm-eyebrow">{jm.reg.relasi}</h2>      <!-- mencabut, diubah oleh, mengingat -->
    <div class="jm-gulir"><table class="jm-tabel">...</table></div></section>
</article>
```

- Teks isi **justify** dengan `hyphens:auto`; nomor pasal dan ayat tidak.
- Teks dari markdown dirender oleh pustaka sendiri yang hanya mengeluarkan elemen `h2 h3 p ol ul li strong em a table`; semua lewat `esc()` lalu penanda; tautan hanya `https:` atau jangkar. Tidak ada HTML mentah dari sumber (lihat KEAMANAN-PRIVASI §5).
- Jangkar dari komponen dampak membuka halaman dan menggulir ke pasal dengan sorot sesaat (`--sorot`, dimatikan di reduced-motion).
- Status berlaku per tanggal: pemilih tanggal `input[type=date]` bawaan platform; "Berlaku per {tanggal}" selalu ditulis.
- Relasi dua arah: tabel "Mencabut", "Dicabut oleh", "Mengubah", "Diubah oleh", "Mengingat"; kolom nomor dan judul kiri, tanggal kanan.

| Keadaan | Rancangan |
| --- | --- |
| Memuat | Kerangka dua kolom: daftar isi 8 baris, teks 6 paragraf. |
| Kosong | Teks belum diekspor: `kosongHtml("jm.reg.tanpa_teks", "jm.reg.unduh")` (aksi: unduh PDF resmi). Pasal tak ditemukan di jangkar: tampil teks penuh dan pita "Pasal tidak ditemukan". |
| Galat | `jm-galat` dengan Coba lagi (kartu utama). Relasi gagal: bagian relasi disembunyikan. |
| Gelap | Teks `--ink`, tautan `--accent`; blok kutipan latar `--surface`. |
| 390 px | Daftar isi menjadi `details` tertutup di atas teks; tombol salin jangkar 44 px; tabel relasi menjadi kartu. |

### 2.4 Admin Wilayah (JM-W02, JM-W03)

Rute `/wilayah-admin`. Setara admin Pusat tetapi terbatas `cakupan_prov`. Ketua Wilayah melihat satu provinsi; Pusat melihat semua dan memilih provinsi lewat pemilih. Tab: Kegiatan, Agenda dan notulen, Foto, Berita, Anggota provinsi.

```html
<main class="jm-wadah">
  <header class="ak-kepala">
    <h1>{jm.wil.admin} <span class="jm-pil jm-pil-ok">Sumatera Utara</span></h1>   <!-- pil provinsi selalu tampil -->
    <p class="jm-pen">{jm.wil.batas}</p>                                          <!-- "Kamu hanya mengelola provinsi ini." -->
  </header>
  <nav class="ak-seg" role="tablist">                                              <!-- 5 tab: baris penuh, bukan geser -->
    <button class="jm-tab" role="tab" aria-selected="true">{ikon kalender}{jm.wil.kegiatan}</button>
    ...
  </nav>
  <section class="ak-panel">
    <div class="jm-saring">
      <label class="jm-cari">...</label>
      <button class="jm-tbl-utama" type="button">{ikon tambah}{jm.wil.tambah}</button>   <!-- satu tombol utama per area -->
    </div>
    <div class="jm-gulir"><table class="jm-tabel">
      <thead><tr><th>{jm.wil.nama}</th><th>{jm.wil.tgl}</th><th>{jm.wil.status}</th><th>{jm.aksi}</th></tr></thead>
      <tbody><tr>
        <td class="jm-id"><b>Lokakarya RUED</b><small>Medan</small></td>
        <td class="jm-num"><time>12 Nov 2026</time></td>
        <td class="jm-tengah"><span class="jm-pil jm-pil-warn">{jm.status.draf}</span></td>
        <td class="jm-sel-aksi"><button class="iconbtn" aria-label="{jm.ubah}" title="{jm.ubah}">{ikon}</button></td>
      </tr></tbody></table></div>
  </section>
</main>
```

- Pop up tambah atau ubah memakai `.ak-dlg`: kaki berisi tombol sebaris sama lebar, Batal dan Hapus tetap berbingkai; Hapus menyebut dampak dan menawarkan ekspor dulu.
- Provinsi lain: bagian tidak dirender, bukan galat. Bila tautan langsung ke provinsi lain, halaman memakai keadaan "Terkunci" teks pendek (403 peran) dan arahan ke provinsi sendiri.
- Papan publik per Wilayah (JM-W03): kartu angka (kegiatan, orang, organisasi, proyek provinsi dengan "n dari N"), kalender kegiatan, tabel rapor kesiapan; semua dari potret, bukan dari rute admin.

| Keadaan | Rancangan |
| --- | --- |
| Memuat | Kepala nyata, tab nyata, isi tab `jm-hantu`. Tombol Simpan menampilkan memuat di tombol dan disabled tetap terlihat. |
| Kosong | `kosongHtml("jm.wil.kosong", "jm.wil.tambah")`: satu aksi, tabel tetap digambar dengan satu baris "Belum ada kegiatan". |
| Galat | Daftar utama: `jm-galat`. Gagal simpan: toast `role=status` dengan kalimat katalog dan data form dipertahankan. |
| Gelap | Pil provinsi `--soft-hijau` teks `--accent`; tab aktif sesuai D21. |
| 390 px | Tab dua baris penuh; tabel jadi kartu; `.ak-dlg` jadi lembar bawah dengan tombol Simpan lebar penuh dan Batal di bawahnya. |
| INP | Klik tab: chrome urgent, isi tab lewat `nanti()`; cari di-debounce 120 ms; pantau dengan `inp-reviewer`. |

### 2.5 Kunci tier dan ajakan naik (JM-N03)

Satu komponen dipakai di semua fitur terkunci (C-23): menjelaskan **apa yang terkunci, manfaatnya, dan tier mana yang membukanya**, tanpa kata hype. Data yang dikunci tidak ada di klien (lihat KEAMANAN-PRIVASI §3); komponen hanya menampilkan deskripsi tetap dari kamus, bukan data bayangan.

```html
<div class="jm-kunci" role="region" aria-label="{jm.kunci.label}">                <!-- (baru) -->
  <svg class="jm-ik" aria-hidden="true"><use href="#i-kunci"/></svg>
  <h3>{jm.kunci.judul}</h3>                                                         <!-- "Unduhan CSV untuk anggota" -->
  <p>{jm.kunci.manfaat}</p>                                                         <!-- justify, maksimal 3 baris -->
  <dl class="jm-kunci-tier">
    <!-- satu baris per kode tier DT, urut peringkat: tamu, pelajar, individu, ngo, usaha_kecil, usaha_besar, utama -->
    <div><dt>{jm.tier.tamu}</dt><dd><span class="jm-pil">{jm.kunci.tutup}</span></dd></div>
    <div><dt>{jm.tier.individu}</dt><dd><span class="jm-pil jm-pil-ok">{jm.kunci.buka}</span></dd></div>
    <!-- ... pil `buka` untuk tier >= tier_min (ALGORITMA §tier R.4), `tutup` untuk yang di bawahnya -->
  </dl>
  <div class="jm-aksi"><a class="jm-tbl-utama" href="/daftar">{ikon naik}{jm.kunci.naik}</a></div>
</div>
```

- Pembeda tier memakai kode DT (`tamu`, `pelajar`, `individu`, `ngo`, `usaha_kecil`, `usaha_besar`, `utama`; label tampilan per kode, pemetaan K24 di GLOSARIUM §5) dan tampil sebagai teks + pil (bukan hanya warna). Satu aksi utama; tautan ke `/daftar` (D20) atau ke halaman iuran akun.
- Dua bentuk: **blok** (menggantikan seluruh bagian) dan **sebaris** (`.jm-kunci[data-bentuk=baris]` untuk satu tombol atau kolom tabel; ikon kunci + teks "Anggota" + title berisi alasan). Kolom tabel terkunci menampilkan `-` redup bukan angka palsu.
- Tombol terkunci tetap terlihat (disabled, `aria-disabled=true`, `title` menjelaskan); klik membuka `.ak-dlg` berisi komponen blok.

| Keadaan | Rancangan |
| --- | --- |
| Memuat | Tier akun belum diketahui: `jm-hantu` satu blok; tidak menampilkan kunci dulu agar tidak berkedip. |
| Kosong | Tidak berlaku. |
| Galat | Status tier gagal dimuat: fitur diperlakukan terkunci dan ditampilkan `jm-galat` kecil dengan Coba lagi; tidak pernah membuka karena galat. |
| Gelap | Latar `--surface`, garis `--line`, ikon `--accent`. |
| 390 px | Daftar tujuh kode tier menjadi dua kolom; tombol utama lebar penuh. |

### 2.6 Kartu pipeline dan skor kesiapan (JM-M04)

Radar proyek gabungan (lelang, tender, peluang, ajuan). Kartu menunjukkan nama, tahap, skor kesiapan, dan alasan skor. Daftar kartu bergambar (ikon teknologi), bukan maskot.

```html
<ul class="jm-pk-kartu-daftar">                                                    <!-- kelas ada di jm.css -->
  <li class="jm-pk-kartu">
    <header class="jm-pk-atas">
      <span class="jm-tk-img">{ikon teknologi}</span>
      <div class="jm-id"><b>PLTS Atap Kawasan X</b><small>Kab. Y, Prov. Z</small></div>
      <span class="jm-pil jm-pil-ok">{jm.pipe.tahap.kelayakan}</span>
    </header>
    <div class="jm-pk-sel">
      <meter class="jm-yakin" min="0" max="1" value="0.62">0,62</meter>              <!-- skor 0-1; Tinggi >= 0,75, Sedang 0,40-0,74, Rendah < 0,40 -->
      <span class="jm-pil">{jm.yakin.sedang}</span>
      <span class="jm-pil jm-pil-est">EST</span>
      <span class="jm-pil jm-hipotesis">{jm.hipotesis}</span>                        <!-- sampai C-16 dijawab -->
    </div>
    <p class="jm-pen">{jm.pipe.alasan}</p>                                           <!-- justify; kalimat alasan skor -->
    <footer class="jm-pk-bawah">
      <span class="jm-sumber">...</span>
      <button class="jm-tbl-utama" type="button">{jm.pipe.rincian}</button>
    </footer>
  </li>
</ul>
```

- Skor selalu disertai penyebut dan "Cara menghitung" (tautan ke `/metode#jangkar`). Skor belum teruji: pil Hipotesis (G9). Warna meter tidak membawa makna sendirian: ada teks Tinggi, Sedang, Rendah.
- Papan pipeline: segmen tahap ujung ke ujung (`ak-seg`), di bawahnya grafik batang jumlah per tahap dengan nilai di ujung; klik batang menyaring daftar, klik kartu membuka pop up tengah berisi rincian skor (komponen skor, sumber, tanggal).
- **Ruang data privat** (dokumen bank, studi kelayakan terunggah): ikon kunci + "Hanya pemilik ajuan dan tim METI"; berkas tidak pernah tampil di kartu publik.
- Ajuan proyek: formulir `.jm-form` dengan persetujuan UU PDP wajib; pratinjau skor "Perkiraan, bukan penilaian".

| Keadaan | Rancangan |
| --- | --- |
| Memuat | Enam kartu kerangka tinggi sama. |
| Kosong | `kosongHtml("jm.pipe.kosong", "jm.pipe.ajukan")`; skor yang tak bisa dihitung ditulis `-` dengan title "Data belum cukup, kami tidak menebak". |
| Galat | Daftar: `jm-galat`. Rincian skor gagal di pop up: pop up menampilkan galat dan tombol Coba lagi. |
| Gelap | Meter memakai `--accent-isi` di atas `--line`; pil token status. |
| 390 px | Kartu satu kolom; baris skor menumpuk; tombol Rincian lebar penuh. |

### 2.7 Permintaan temu (JM-M07)

Penawaran dan kebutuhan, permintaan temu antara dua pihak, kuota per tier, tindak lanjut. Alur status dan batas diatur ALUR; komponen hanya menampilkan.

```html
<article class="ak-panel jm-temu">                                                  <!-- (baru) -->
  <header class="jm-pk-atas">
    <div class="jm-id"><b>Penawaran: modul surya 540 Wp</b><small>PT Contoh, Jawa Barat</small></div>
    <span class="jm-pil jm-pil-warn">{jm.temu.st.menunggu}</span>
  </header>
  <p class="jm-pen">{jm.temu.ringkas}</p>                                           <!-- justify -->
  <dl class="jm-temu-kuota">                                                         <!-- (baru) -->
    <div><dt>{jm.temu.kuota}</dt><dd class="jm-num">2 {jm.n_dari} 5</dd></div>
  </dl>
  <div class="jm-aksi">
    <button class="jm-tbl-utama" type="button">{ikon kirim}{jm.temu.minta}</button>
    <button class="jm-tbl" type="button">{jm.temu.tolak}</button>
  </div>
</article>
```

- Status: draf, menunggu, diterima, ditolak, kedaluwarsa, selesai dengan warna baku (G11: kuning menunggu, biru aktif, hijau selesai, merah ditolak).
- Kontak pihak lain **tidak tampil** sebelum diterima; sesudah diterima, tampil hanya kanal yang dipilih pihak itu (lihat KEAMANAN-PRIVASI §3).
- Pembatas kuota: tombol Minta tetap terlihat; saat kuota habis disabled dan `title` memberi tahu tier dan cara naik (komponen 2.5 sebaris).
- Tindak lanjut: tombol "Catat hasil" membuka `.ak-dlg` singkat; tanpa kolom bebas tak terbatas (maksimal 500 kata, batas server).

| Keadaan | Rancangan |
| --- | --- |
| Memuat | Kartu kerangka dengan baris aksi kosong setinggi tombol. |
| Kosong | `kosongHtml("jm.temu.kosong", "jm.temu.pasang")` (aksi: pasang penawaran atau kebutuhan). |
| Galat | Daftar: `jm-galat`. Gagal kirim: toast dan tombol kembali aktif, kuota tidak berkurang di layar sebelum server menjawab. |
| Gelap | Token saja. |
| 390 px | Tombol aksi sebaris sama lebar (dua tombol 50 persen) atau bertumpuk bila teks panjang; tidak terpotong. |

### 2.8 QR lencana sertifikat (JM-M06)

Lencana bagi pemegang sertifikat kompetensi. Halaman verifikasi dibuka dari QR; verifikasinya wajib login (C-27): peran LOGIN eksplisit, BUKAN pengecualian D19. Komponen hanya dirender di dalam sesi login.

```html
<section class="ak-panel jm-lencana">                                               <!-- (baru) -->
  <div class="jm-lencana-kartu">
    <img class="jm-logo-bundar" src="/gambar/ID" alt="" width="36" height="36">
    <div class="jm-id"><b>Nama pemegang</b><small>{jm.lencana.jalur}</small></div>
    <span class="jm-pil jm-pil-ok">{jm.lencana.aktif}</span>
    <svg class="jm-lencana-qr" role="img" aria-label="{jm.lencana.qr}" viewBox="0 0 33 33"><!-- dibuat di klien dari URL verifikasi, rect berfill currentColor --></svg>
  </div>
  <dl class="jm-hitung">
    <div><dt>{jm.lencana.terbit}</dt><dd><time>11 Nov 2026</time></dd></div>
    <div><dt>{jm.lencana.berlaku}</dt><dd><time>11 Nov 2028</time></dd></div>
  </dl>
  <div class="jm-aksi">
    <button class="jm-tbl" type="button">{ikon salin}{jm.salin}</button>
    <a class="jm-tbl" href="...">{ikon unduh}{jm.lencana.unduh}</a>
  </div>
</section>
```

- QR berisi URL verifikasi bertoken acak tak berurutan (bukan ID akun). Halaman verifikasi hanya menampilkan nama, jalur, status (aktif, kedaluwarsa, dicabut), tanggal terbit dan berlaku. Tanpa surel, HP, atau data lain.
- QR digambar sebagai SVG `currentColor` agar ikut tema; kontras QR dijaga: latar `--paper`, modul `--ink` di kedua tema.
- Status dicabut: pil `jm-pil-bad` dengan teks dan tanggal; QR lama tetap menjawab "dicabut".
- Riwayat sertifikat: `.jm-tabel` dengan th tengah, tanggal rata kanan.

| Keadaan | Rancangan |
| --- | --- |
| Memuat | Kartu kerangka dengan kotak QR 120 px. |
| Kosong | Belum punya lencana: `kosongHtml("jm.lencana.kosong", "jm.lencana.jalur_lihat")`. |
| Galat | Pembuatan QR gagal: QR disembunyikan, tautan verifikasi tetap tampil sebagai teks yang bisa disalin. Halaman verifikasi gagal: `jm-galat` dan Coba lagi. |
| Gelap | QR tetap kontras tinggi: kartu QR berlatar `--paper` di terang, `--ink`/`--paper` ditukar sesuai token di gelap (diuji pindai). |
| 390 px | QR di tengah, ukuran minimal 160 px; tombol unduh dan salin sebaris sama lebar. |

### 2.9 Antrean ragu (kurator, JM-L01 sampai L06)

Tautan yang skornya di bawah ambang masuk antrean untuk diputuskan kurator: dua entitas yang ditautkan, bukti, skor, tombol Setujui dan Tolak.

```html
<section class="ak-panel jm-ragu">                                                  <!-- (baru) -->
  <h2 class="jm-eyebrow">{jm.ragu.judul}</h2>
  <div class="jm-gulir"><table class="jm-tabel">
    <thead><tr><th>{jm.ragu.dari}</th><th>{jm.ragu.ke}</th><th>{jm.ragu.bukti}</th><th>{jm.ragu.skor}</th><th>{jm.aksi}</th></tr></thead>
    <tbody><tr>
      <td class="jm-id" data-label="{jm.ragu.dari}"><b>Proyek A</b><small>proyek</small></td>
      <td class="jm-id" data-label="{jm.ragu.ke}"><b>PT B</b><small>organisasi</small></td>
      <td class="jm-tengah" data-label="{jm.ragu.bukti}"><button class="jm-bukti" data-b="tinjau">{jm.bukti.tinjau}</button></td>
      <td class="jm-num" data-label="{jm.ragu.skor}">0,58 <span class="jm-pil jm-pil-est">EST</span></td>
      <td class="jm-sel-aksi" data-label="{jm.aksi}">
        <button class="jm-tbl-utama" type="button">{jm.setujui}</button>
        <button class="jm-tbl-bahaya" type="button">{jm.tolak}</button>
      </td>
    </tr></tbody></table></div>
  <nav class="jm-pag" aria-label="{jm.hal}">...</nav>
</section>
```

- Setujui dan Tolak selalu pasangan sebaris sama lebar. Tolak meminta alasan satu kalimat; keputusan tercatat di jejak, dan tautan ditolak tidak dibuat ulang oleh pipeline berikutnya (daftar tolak tautan).
- Klik baris membuka pop up tengah: kedua profil berdampingan, kutipan bukti, tautan sumber, riwayat skor. Pop up memuat tombol yang sama.
- Hitungan di kepala: "n dari N menunggu" dan umur antrean tertua; grafik batang umur antrean dengan ambang (SLA kurator dari ALUR).
- Paginasi mengurutkan data penuh dulu (B4). Aksi massal tidak ada di tahap ini.

| Keadaan | Rancangan |
| --- | --- |
| Memuat | Tabel kerangka 8 baris. |
| Kosong | `kosongHtml("jm.ragu.kosong", ...)`: "Tidak ada tautan yang menunggu"; tanpa aksi. Tabel tetap digambar. |
| Galat | `jm-galat` dengan Coba lagi; gagal putus: baris kembali ke antrean dan toast menjelaskan. |
| Gelap | Token saja. |
| 390 px | Tabel jadi kartu; dua tombol sebaris sama lebar; pop up jadi lembar bawah dengan dua profil bertumpuk. |
| INP | Setujui atau Tolak: baris hilang seketika (urgent), muat ulang hitungan lewat `nanti()`. |

## 3. Daftar periksa tangkapan layar per komponen

Selesai bila dilihat, bukan hanya diuji: 1440 dan 390 px, terang dan gelap, ID dan EN, tiap keadaan §1.1 yang relevan (Memuat, Kosong, Galat, Terkunci). Lalu data terburuk: nama panjang 120 karakter tanpa spasi, nol baris, 10.000 sebagai angka, satu karakter, teks aksara non-Latin. Tangkapan di `tests/layar/tangkapan/` (gitignored). Pemeriksa: `peninjau-bersih`, `i18n-guard`, `selera-angka`, `inp-reviewer` untuk handler klik.

## Catatan untuk induk

1. **Kelas dan berkas.** DS lama membatasi `jm.css` 400 baris; kenyataannya 884. Dokumen ini menaruh kelas baru milik satu layar di CSS layar itu. Mohon dipastikan batas baris tidak dipakai sebagai gerbang.
2. **QR lencana dan D19 (diputuskan, C-27).** Verifikasi lencana wajib login dan bukan pengecualian D19; pemindai tanpa sesi diarahkan ke masuk. Hanya `/kta/v/<token>` yang terbuka tanpa login.
3. **Padanan poskokarhutla.** Checkout yang ditemukan: `~/Documents/GitHub/poskokarhutla-karantina-git`. Path modul padanan per komponen belum diverifikasi; pengerja layar menyebutnya di brief.
4. **Nama tab.** DS lama memakai `.ak-seg`/`.ak-chip`, Buku memakai `.jm-tab`/`.jm-subnav`; contoh di sini memakai `.ak-seg` sebagai pembungkus dan `.jm-tab` sebagai butir, sesuai kode `jm.css`. Bila kode ternyata berbeda, kode menang (D21).
5. **Ruang gelap QR.** Kontras QR di tema gelap perlu diuji pindai nyata; bila gagal, QR selalu dirender di kartu berlatar terang.
6. **Hipotesis skor.** Pil Hipotesis pada skor pipeline hilang hanya bila ALGORITMA menyatakan lolos (C-16); saya tidak menetapkan ambang di sini.
