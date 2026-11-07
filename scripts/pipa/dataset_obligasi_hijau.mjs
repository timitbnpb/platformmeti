#!/usr/bin/env node
// public/data/obligasi_hijau.json: green bond/sukuk hijau/obligasi berkelanjutan terkait energi. Sumber: laporan DJPPR (resmi, dibaca dari
// salinan lokal data-panen/keuangan/raw/green-sukuk-2025.pdf repo asal) dan berita Antara (media, angka dikutip dari isi artikel yang dibaca).
import { fileURLToPath } from 'node:url';
import { TGL, bacaAda, saring, bungkus, tulis, pilihSumber } from './dataset_lib.mjs';

export const SUMBER = {
  's-djppr': { id: 's-djppr', lisensi: 'Publikasi pemerintah terbuka; atribusi DJPPR Kemenkeu', judul: '2025 Green Sukuk Allocation and Impact Report', penerbit: 'DJPPR Kemenkeu', tahun: 2025, url: 'https://api-djppr.kemenkeu.go.id/web/api/v1/media/8C2C3353-9134-43B3-9307-D465DE7C2CB8' },
  's-antara': { id: 's-antara', lisensi: 'Hak cipta ANTARA; hanya judul, angka kunci, dan tautan (isi tidak disalin)', judul: 'Berita ANTARA (judul dan angka kunci; isi tidak disalin)', penerbit: 'ANTARA', tahun: 2026, url: 'https://www.antaranews.com' },
};
const A = (id) => 'https://www.antaranews.com/berita/' + id;
const DJ = SUMBER['s-djppr'].url;
// [id, penerbit, org_id, instrumen, jenis_pasar, pemerintah, nilai, satuan, tahun, tenor, kupon, penggunaan, sumber_id, url, tingkat, catatan, tanggal_sumber]
const R = [
  ['ob_ri_global_2022', 'Pemerintah Indonesia (Kemenkeu/DJPPR)', 'l_7b43a2574c', 'Global Sovereign Green Sukuk', 'global', true, 1500, 'USD juta', 2022, 10, 4.7, 'Proyek hijau APBN (sektor energi terbarukan dan efisiensi energi termasuk di alokasi kumulatif)', 's-djppr', DJ, 'resmi', 'Dibaca dari tabel ringkasan penerbitan 2018-2024 (tata letak PDF tidak rapi; nilai/tenor/kupon konsisten antarkolom).', '2025'],
  ['ob_ri_global_2023', 'Pemerintah Indonesia (Kemenkeu/DJPPR)', 'l_7b43a2574c', 'Global Sovereign Green Sukuk', 'global', true, 1000, 'USD juta', 2023, 10, 5.6, 'Proyek hijau APBN', 's-djppr', DJ, 'resmi', 'Idem.', '2025'],
  ['ob_ri_global_2024', 'Pemerintah Indonesia (Kemenkeu/DJPPR)', 'l_7b43a2574c', 'Global Sovereign Green Sukuk SNI 0754 (ISIN USY68613AC56)', 'global', true, 600, 'USD juta', 2024, 30, 5.5, 'Proyek hijau APBN', 's-djppr', DJ, 'resmi', 'Terbit 2 Juli 2024. Sudah ada di keuangan.json (kelompok green_finance); dipertahankan agar dataset ini utuh.', '2024-07-02'],
  ['ob_ri_agregat_global_2018_2024', 'Pemerintah Indonesia (Kemenkeu/DJPPR)', 'l_7b43a2574c', 'Agregat Global Sovereign Green Sukuk (SNI) 2018-2024', 'global', true, 6600, 'USD juta', 2024, null, null, 'Akumulasi; penerbitan 2018-2021 tidak dirinci di sini', 's-djppr', DJ, 'resmi', 'Nilai kumulatif USD 6,60 miliar.', '2025'],
  ['ob_ri_agregat_ritel_2018_2024', 'Pemerintah Indonesia (Kemenkeu/DJPPR)', 'l_7b43a2574c', 'Agregat Green Sukuk ritel (seri ST) 2019-2024', 'domestik-ritel', true, 40600, 'IDR miliar', 2024, null, null, 'Akumulasi', 's-djppr', DJ, 'resmi', 'Kumulatif IDR 40,60 triliun.', '2025'],
  ['ob_ri_agregat_wholesale_2022_2024', 'Pemerintah Indonesia (Kemenkeu/DJPPR)', 'l_7b43a2574c', 'Agregat Green Sukuk wholesale domestik (PBSG001)', 'domestik-wholesale', true, 31170, 'IDR miliar', 2024, null, null, 'Akumulasi', 's-djppr', DJ, 'resmi', 'Kumulatif IDR 31,17 triliun menurut laporan DJPPR; angka berita Antara (Rp21,03 triliun sampai 2025) berbeda definisi dan tidak digabung.', '2025'],
  ['ob_ri_total_2025', 'Pemerintah Indonesia (Kemenkeu)', 'l_7b43a2574c', 'Total sukuk hijau negara sampai 2025', 'agregat', true, 185600, 'IDR miliar', 2025, null, null, 'Akumulasi (USD 6,6 miliar global ~ Rp106,92 triliun + Rp78,8 triliun domestik)', 's-antara', A('4895069'), 'media', 'Pernyataan Menkeu 12 Jun 2025; wholesale domestik Rp21,03 triliun (2022: 4,75; 2023: 7,28; 2024: 6; 2025: 3).', '2025-06-12'],
  ['ob_ri_pbsg002_2026', 'Pemerintah Indonesia (Kemenkeu/DJPPR)', 'l_7b43a2574c', 'Green Sukuk wholesale PBSG002 (reopening)', 'domestik-wholesale', true, null, null, 2026, null, null, 'Pembiayaan proyek ramah lingkungan APBN 2026', 's-antara', A('5531499'), 'media', 'Ditawarkan pada lelang SBSN 21 Apr 2026 bersama seri lain; target indikatif Rp12 triliun untuk seluruh lelang, bukan PBSG002 saja; hasil per seri tidak dibaca.', '2026-04-17'],
  ['ob_arko_sukuk_2026', 'PT Arkora Hydro Tbk', 'ix_arko', 'Sukuk Ijarah Berkelanjutan Berwawasan Lingkungan I Tahun 2026', 'korporasi-sukuk', false, null, null, 2026, null, null, 'Pembiayaan energi terbarukan (PLTA); fasilitas penjaminan IIF hingga Rp645 miliar', 's-antara', A('5581897'), 'media', 'Nilai penerbitan tidak disebut; angka Rp645 miliar adalah plafon penjaminan IIF.', '2026-05-25'],
  ['ob_arko_obligasi_hijau_2023', 'PT Arkora Hydro Tbk', 'ix_arko', 'Obligasi hijau korporasi 2023', 'korporasi-obligasi', false, null, null, 2023, null, null, 'Pembiayaan PLTA (bersama IIF)', 's-antara', A('5581897'), 'media', 'Hanya disebut sekilas pada artikel IIF-Arkora 2026; nilai dan kupon tidak disebut.', '2026-05-25'],
  ['ob_iif_green_perpetual_2023', 'PT Indonesia Infrastructure Finance', 'p_15bc360dc3', 'Green Perpetual Notes (tercatat di BEI)', 'korporasi-notes', false, 335.19, 'IDR miliar', 2023, null, null, 'Kegiatan Usaha Berwawasan Lingkungan (KUBL) infrastruktur hijau', 's-antara', A('5253477'), 'media', 'IIF bukan penerbit murni energi; penggunaan dana tidak dirinci per sektor.', '2025-11-19'],
  ['ob_iif_pub_2023_nov2025', 'PT Indonesia Infrastructure Finance', 'p_15bc360dc3', 'Obligasi berkelanjutan PUB 2023 (penerbitan Nov 2025)', 'korporasi-obligasi', false, 1500, 'IDR miliar', 2025, null, null, 'Pembiayaan infrastruktur berkelanjutan; porsi energi tidak dirinci', 's-antara', A('5253477'), 'media', 'Oversubscription lebih dari 6 kali.', '2025-11-19'],
];
export function bangun() {
  return R.map(([id, penerbit, org, instrumen, pasar, pem, nilai, satuan, tahun, tenor, kupon, guna, sid, url, tb, cat, tgl]) => ({
    id, kelompok: 'obligasi_hijau', penerbit, penerbit_org_id: org, instrumen, jenis_pasar: pasar, penerbit_pemerintah: pem, nilai, satuan_nilai: satuan, tahun,
    tenor_tahun: tenor, kupon_persen: kupon, penggunaan_dana: guna, catatan: cat, tanggal_sumber: tgl, sumber_id: sid, sumber_url: url, tanggal: TGL, tingkat_bukti: tb,
  }));
}
export const CELAH = [
  'Penerbitan Sovereign Green Sukuk global 2018-2021 (total sisa kira-kira USD 3,5 miliar) tidak dirinci: tabel laporan DJPPR 2025 terbaca berantakan; hanya 2022-2024 dan agregat yang dicatat. Server DJPPR memutus koneksi saat diunduh ulang 7 Nov 2026 (salinan lokal dipakai).',
  'idx.co.id (daftar obligasi/sukuk hijau tercatat BEI) menjawab 403 ke UA jujur dan tidak ditembus; green bond korporasi EBT lain (mis. PLN, SMI, Star Energy, Medco Power, PGE) tidak punya sumber yang dibaca sehingga tidak dimasukkan.',
  'Seri ritel ST (Green Sukuk ritel) per tahun tidak dirinci; hanya agregat.',
  'Baris media memuat angka dari isi artikel Antara yang dibaca; Antara melarang crawling otomatis untuk AI, jadi hanya angka kunci dan tautan yang disimpan, isi tidak disalin. Angka belum dicocokkan ke prospektus/pengumuman emiten.',
  'Kupon tidak tersedia untuk semua korporasi; nilai null berarti tidak disebut sumber.',
];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { ok, ditolak } = saring(bangun());
  console.log(tulis('obligasi_hijau', bungkus({ baris: ok, sumber: pilihSumber(SUMBER, ok), celah: CELAH, ditolak })), ok.length, 'baris');
}
