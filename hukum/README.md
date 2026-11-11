# hukum/: teks peraturan EBT (K22)

## Isi folder

- `<jenis>/<tahun>/<id>.md`: satu berkas per peraturan (`jenis` = token pertama `id`: uu, pp, perpres, keppres, inpres, permen, perda, pergub, perbup, perwal, pojk, lain). Id bertanda hubung ganda di D1 ditulis tunggal; `id_lama` mencatat aslinya.
- `_indeks.json`: id, jenis, tahun, status, relasi (`terdaftar` = ada berkasnya di sini).
- `_status.json`: `perlu_ocr` (belum ditulis, menunggu OCR), `gagal`, `antrean_kurator` (beda nomor/judul dengan katalog, status bertentangan dengan relasi; tidak dibetulkan otomatis, untuk JM-U05).

## Skema frontmatter

Kunci berurutan tetap (lihat `KUNCI` di `scripts/hukum/md.mjs`; rinci di `docs/perencanaan/penyempurnaan-nov/DESAIN-TEKNIS.md` §regulasi R.2): `id, id_lama, regulasi_id, jenis, nomor, tahun, judul, tgl_tetap, tgl_undang, status, status_per, mulai, mulai_perkiraan, selesai, mencabut, mengubah, mengganti, mengingat, merujuk, dicabut_oleh, diubah_oleh, topik, sumber, ekstraksi, resmi, lisensi, md_sha256`. Nilai selain tanggal berbentuk JSON. Isi: `## Menimbang`, `## Mengingat`, `## Memutuskan`, `## BAB ...`, `### Pasal N` (jangkar `#pasal-n`; pasal panjang dipecah dengan `<!-- bagian n -->`), penjelasan, lampiran.

Status dan relasi hanya dari data hasil urai; tanpa data berarti `tidak_diketahui` atau daftar kosong. `dicabut_oleh` dan `diubah_oleh` diturunkan dari relasi keluar dokumen lain di folder ini.

## Membangun ulang

`node scripts/hukum/ekspor_md.mjs` (membaca `data/hukum/seed*.sql` dan `data-panen/hukum/`, keduanya di-.gitignore; hasil deterministik). Jangan sunting berkas tangan. Uji: `node --test tests/u-hukum-md.test.mjs`.

## Dasar mengumumkan ulang

Diperiksa 11 November 2026 dari naskah resmi UU No. 28 Tahun 2014 tentang Hak Cipta ([peraturan.bpk.go.id/Details/38690](https://peraturan.bpk.go.id/Details/38690), PDF `/Download/28018/UU Nomor 28 Tahun 2014.pdf`):

> Pasal 42: "Tidak ada Hak Cipta atas hasil karya berupa: ... b. peraturan perundang-undangan; ..."

Hanya teks peraturannya yang bebas; ringkasan, anotasi, dan terjemahan pihak ketiga tidak otomatis bebas. Salinan di sini berasal dari BPK/JDIH dan **bukan naskah otentik** (`resmi: false`); naskah otentik ada di Lembaran Negara/Berita Negara.

## Catatan redaksi

Teks harus sesuai naskah. Yang diganti `[dihapus]` hanya data pribadi sungguhan: surel webmail pribadi (gmail, yahoo, hotmail, outlook), nomor ponsel, dan NIK 16 digit berdiri sendiri. Dibiarkan karena isi naskah: telepon dan surel kantor instansi, NIP pejabat, angka tabel, nomor peraturan. Pada ekspor terakhir tidak ada teks yang perlu diredaksi (0 berkas).
