// Desa dan akses energi (informasi): kerentanan desa per provinsi (desa non-PLN + IDM tertinggal), hidro skala kecil dari data proyek/AMDAL,
// panduan koperasi energi desa (bersumber pasal) dan peta pembiayaan. Tanpa panen baru; turunan = EST, indeks = Hipotesis.
// Pakai: node scripts/pipa/desa_akses.mjs [--tanggal=YYYY-MM-DD]. Keluaran: public/data/desa_akses.json.
import fs from 'node:fs';
import path from 'node:path';
import { kodeProv, PROV } from '../../public/inti/prov_singkat.js';
import { persentil } from './paket_pemda.mjs';
import { DOK } from './izin_kontrak.mjs';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const baca = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', f), 'utf-8'));
const TANGGAL = (process.argv.find((a) => a.startsWith('--tanggal=')) || '--tanggal=2026-11-08').slice(10);
const bi = (id, en) => ({ id, en });
const p = (dok, pasal) => ({ dok, pasal });
export const BATAS_HIDRO_KECIL_MW = 10;

export const LANGKAH = [
  { id: 'bentuk', judul: bi('Bentuk koperasi', 'Form the cooperative'), isi: bi('Koperasi primer dibentuk sekurang-kurangnya 20 orang lewat akta pendirian yang memuat anggaran dasar, dan menjadi badan hukum setelah akta disahkan Pemerintah.', 'A primary cooperative is formed by at least 20 people through a deed of establishment containing the articles of association, and becomes a legal entity once the Government approves the deed.'), pasal: [p('uu25', 'Pasal 6 ayat (1), Pasal 7 ayat (1), Pasal 9')] },
  { id: 'modal', judul: bi('Susun permodalan', 'Plan the capital'), isi: bi('Modal sendiri dapat berasal dari simpanan pokok, simpanan wajib, dana cadangan, dan hibah. Modal pinjaman dapat berasal dari anggota, koperasi lain, bank dan lembaga keuangan, penerbitan obligasi, dan sumber lain yang sah. Koperasi juga dapat menghimpun modal penyertaan.', 'Own capital may come from principal deposits, mandatory deposits, reserves and grants. Borrowed capital may come from members, other cooperatives, banks and financial institutions, bonds and other lawful sources. Cooperatives may also raise equity participation.'), pasal: [p('uu25', 'Pasal 41 ayat (2) dan (3), Pasal 42 ayat (1)')] },
  { id: 'izin', judul: bi('Cek ambang izin kelistrikan', 'Check the licensing threshold'), isi: bi('Pembangkit untuk kepentingan sendiri dengan total kapasitas sampai 500 kW dalam satu sistem cukup dilaporkan satu kali; lebih dari 500 kW wajib IUPTLS (berlaku paling lama 10 tahun). PLTS atap sampai 500 kW cukup lapor sebelum pemasangan dan wajib SLO atau surat pernyataan keselamatan.', 'Captive plants up to 500 kW total in one system need only a single report; above 500 kW an IUPTLS (valid up to 10 years) is mandatory. Rooftop solar up to 500 kW needs a report before installation plus an SLO or safety statement.'), pasal: [p('m11', 'Pasal 39 dan 40'), p('m2', 'Pasal 18, Pasal 24 dan 25')] },
  { id: 'jual', judul: bi('Pilih skema pemakaian atau penjualan', 'Choose own use or sale'), isi: bi('PLN dapat membeli kelebihan listrik pemegang IUPTLS berbasis EBT dengan perjanjian paling singkat 3 tahun. Untuk menjual listrik ke publik diperlukan IUPTLU. Pembangkit yang dibangun pemerintah atau pemerintah daerah, termasuk hibah, dibeli PLN lewat penugasan Menteri.', 'PLN may buy excess power from renewable IUPTLS holders under agreements of at least 3 years. Selling to the public needs an IUPTLU. Plants built by central or regional government, including grants, are bought by PLN through a ministerial assignment.'), pasal: [p('p112', 'Pasal 11, Pasal 12, Pasal 20'), p('m11', 'Pasal 11')] },
  { id: 'insentif', judul: bi('Manfaatkan dukungan pemerintah', 'Use government support'), isi: bi('Perpres memuat insentif fiskal, fasilitas pembiayaan atau penjaminan lewat BUMN, dan insentif nonfiskal dari pusat dan/atau daerah; pemerintah daerah wajib mendukung sesuai kewenangan.', 'The regulation lists fiscal incentives, financing or guarantee facilities through state-owned enterprises, and non-fiscal incentives from central and/or regional governments; regional governments must support within their authority.'), pasal: [p('p112', 'Pasal 22 ayat (2) dan (3), Pasal 23 ayat (1)')] },
  { id: 'shu', judul: bi('Bagi hasil ke anggota', 'Share results with members'), isi: bi('Sisa hasil usaha setelah dikurangi dana cadangan dibagikan kepada anggota sebanding dengan jasa usaha masing-masing anggota, dan sebagian untuk pendidikan perkoperasian, sesuai keputusan Rapat Anggota.', 'Surplus after reserves is distributed to members in proportion to each member\'s business with the cooperative, and partly for cooperative education, per the Members\' Meeting.'), pasal: [p('uu25', 'Pasal 45 ayat (1) dan (2)')] },
];

export function bangun(d) {
  const prov = Object.entries(PROV).map(([kode, [nama]]) => ({ kode, nama }));
  const dl = new Map(d.desa_listrik.baris.map((r) => [r.kode, r]));
  const im = new Map(d.desa_energi.baris.map((r) => [r.kode, r]));
  const sur = new Map(d.potensi_atlas.baris.map((r) => [r.kode, r]));
  const kecil = new Map();
  const daftar = [];
  const dasarProv = (x) => kodeProv(x?.lokasi?.provinsi);
  for (const x of d.proyek.baris) {
    if (x.teknologi !== 'hidro' || x.status?.[0]?.nilai === 'dibatalkan') continue;
    const k = x.kapasitas?.[0]; const mw = k?.satuan === 'MW' && Number.isFinite(k.nilai) ? k.nilai : null;
    if (mw == null || mw > BATAS_HIDRO_KECIL_MW) continue;
    const kode = dasarProv(x);
    daftar.push({ sumber: 'proyek', id: x.id, nama: x.nama, kode: kode || null, kab: x.lokasi?.kabupaten_kota?.[0]?.nilai || null, mw, status: x.status?.[0]?.nilai || null, url: x.sumber?.[0]?.url || null, tingkat_bukti: x.tingkat_bukti || null });
  }
  for (const a of d.amdal.baris) {
    if (a.teknologi !== 'hidro' || !(a.kapasitas_mw > 0) || a.kapasitas_mw > BATAS_HIDRO_KECIL_MW || a.proyek_id) continue;
    daftar.push({ sumber: 'amdal', id: a.id, nama: a.nama_kegiatan, kode: kodeProv(a.lokasi?.provinsi) || null, kab: null, mw: a.kapasitas_mw, status: 'pengumuman-amdal', url: a.sumber_url || null, tingkat_bukti: a.tingkat_bukti || null });
  }
  daftar.sort((a, z) => z.mw - a.mw || a.nama.localeCompare(z.nama, 'id'));
  for (const h of daftar) if (h.kode) { const o = kecil.get(h.kode) || { n: 0, mw: 0 }; o.n++; o.mw += h.mw; kecil.set(h.kode, o); }
  const baris = prov.filter((x) => dl.has(x.kode)).map((x) => {
    const a = dl.get(x.kode), b = im.get(x.kode), s = sur.get(x.kode), h = kecil.get(x.kode);
    const nonPln = a.jumlah_desa ? (a.desa_non_pln / a.jumlah_desa) * 100 : null;
    const tertinggal = b ? ((b.tertinggal + b.sangat_tertinggal) / b.total_desa_lapor) * 100 : null;
    return { kode: x.kode, nama: x.nama, jumlah_desa: a.jumlah_desa, non_pln: a.desa_non_pln, belum: a.belum_berlistrik, persen_berlistrik: a.persen_berlistrik, persen_non_pln: nonPln == null ? null : Math.round(nonPln * 10) / 10, persen_tertinggal: tertinggal == null ? null : Math.round(tertinggal * 10) / 10, idm_maju_mandiri: b?.persen_maju_mandiri_2024 ?? null, pvout: s?.pvout_kwh_per_kwp_tahun ?? null, hidro_kecil_n: h?.n || 0, hidro_kecil_mw: Math.round((h?.mw || 0) * 10) / 10 };
  });
  const pa = persentil(baris.map((b) => b.persen_non_pln)), pb = persentil(baris.map((b) => b.persen_tertinggal));
  baris.forEach((b, i) => { const ada = [pa[i], pb[i]].filter((x) => x != null); b.kerentanan = ada.length === 2 ? Math.round(((pa[i] + pb[i]) / 2) * 1000) / 1000 : null; });
  baris.filter((b) => b.kerentanan != null).sort((a, z) => z.kerentanan - a.kerentanan).forEach((b, i) => { b.peringkat = i + 1; });
  const pend = d.pendanaan.pendanaan.filter((x) => x.jenis_entri === 'skema' && (x.sasaran || []).some((s) => /pemerintah daerah|masyarakat/i.test(s)))
    .map((x) => ({ id: x.id, nama: x.nama, pemberi: x.pemberi, jenis: x.jenis, sasaran: x.sasaran, uraian: x.uraian, status: x.status, url: x.url, tanggal: x.tanggal_periksa, bukti: x.tingkat_bukti }));
  const contoh = [];
  for (const pr of d.program_analisis.baris) for (const t of pr.tonggak || []) if (/koperasi/i.test(t.peristiwa?.id || '') && /^https:/.test(t.url || '')) contoh.push({ program: pr.kode, tgl: t.tgl, teks: t.peristiwa, url: t.url, bukti: t.bukti });
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, tahun_data: 2024, dok: DOK, batas_hidro_kecil_mw: BATAS_HIDRO_KECIL_MW,
    nasional: d.desa_listrik.nasional ? { jumlah_desa: d.desa_listrik.nasional.jumlah_desa, non_pln: d.desa_listrik.nasional.desa_non_pln, belum: d.desa_listrik.nasional.belum_berlistrik, persen: d.desa_listrik.nasional.persen_berlistrik } : null,
    idm_nasional: d.desa_energi.nasional_2024,
    metode: { kerentanan: 'Hipotesis. Rata-rata dua peringkat persentil antarprovinsi: (1) persen desa non-PLN (listrik dari PLTS, diesel, atau mikrohidro komunal, bukan jaringan PLN) dari ESDM 2024; (2) persen desa Tertinggal dan Sangat Tertinggal menurut IDM Kemendes 2024. Proksi: BPS Podes (desa tanpa listrik per kabupaten) belum terjangkau, jadi peta ini bukan peta kemiskinan energi resmi.', hidro_kecil: `EST. Hidro berkapasitas sampai ${BATAS_HIDRO_KECIL_MW} MW dari direktori proyek dan pengumuman AMDAL yang belum tertaut ke proyek; ambang ${BATAS_HIDRO_KECIL_MW} MW dipilih METI, bukan definisi hukum. Ini proyek tercatat, bukan potensi sumber daya.` },
    provinsi: baris, hidro_kecil: daftar,
    langkah: LANGKAH, contoh_koperasi: contoh, pembiayaan: pend,
    celah_pembiayaan: bi('KUR, LPDB-KUMKM, dan dana desa untuk energi belum ada di data (tidak ada berkas terbuka yang dibaca); skema di atas hanya yang sasarannya pemerintah daerah atau masyarakat.', 'KUR, LPDB-KUMKM and village funds for energy are not in the data (no open file was read); the schemes above are only those targeting regional governments or communities.'),
    butuh_unduhan: {
      desa_mandiri: { sumber: 'Program Desa Energi Berdikari dan Desa Mandiri Energi (Kementerian ESDM dan Pertamina)', url: 'https://ebtke.esdm.go.id/', alasan: 'ebtke.esdm.go.id adalah SPA tanpa API, geoportal ESDM melarang robots; daftar desa belum tersedia sebagai berkas terbuka.' },
      podes: { sumber: 'BPS Podes: desa tanpa listrik per kabupaten dan sumber penerangan', url: 'https://www.bps.go.id/', alasan: 'Berkas Podes tidak dapat dipanen tanpa unduhan manual atau kunci API; perlu diunduh pemilik.' },
      sekolah_puskesmas: { sumber: 'Dapodik Kemendikdasmen (sumber listrik sekolah) dan Kemenkes (puskesmas)', url: null, alasan: 'Tidak ditemukan berkas terbuka berisi status listrik fasilitas; perlu diunduh pemilik.' },
      mikrohidro_potensi: { sumber: 'Potensi sumber daya mikrohidro per lokasi (ESDM/EBTKE)', url: null, alasan: 'Tabel potensi tidak tersedia terbuka; halaman hanya menampilkan proyek tercatat.' },
    },
  };
}
export const muat = () => ({ desa_listrik: baca('desa_listrik.json'), desa_energi: baca('desa_energi.json'), potensi_atlas: baca('potensi_atlas.json'), proyek: baca('proyek.json'), amdal: baca('amdal.json'), pendanaan: baca('pendanaan.json'), program_analisis: baca('program_analisis.json') });
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const o = bangun(muat());
  fs.writeFileSync(path.join(AKAR, 'public/data/desa_akses.json'), JSON.stringify(o) + '\n');
  console.log('desa_akses:', o.provinsi.length, 'provinsi,', o.hidro_kecil.length, 'hidro kecil,', o.pembiayaan.length, 'skema,', o.contoh_koperasi.length, 'contoh');
}
