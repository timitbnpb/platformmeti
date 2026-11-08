// Target bauran EBT per provinsi dari Perda RUED (lampiran/pasal) + pembanding realisasi dari wilayah.json.
// Pakai: node scripts/pipa/rued.mjs [--unduh] [--tanggal=...]. PDF di pdf/ (tidak di-commit); teks pdftotext -layout di samping PDF.
// Angka TIDAK diekstrak otomatis: tiap target ditulis tangan dari kutipan yang diuji ada di teks PDF (tests/panen_k.test.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { AKAR, TANGGAL, UA, tidur, tulis, bacaRef, kodeProvinsi } from './_panen_umum.mjs';

// jenis: pasal = pasal batang tubuh; lampiran = bab Sasaran dokumen RUED-P; pemodelan = hasil skenario, bukan sasaran; ruen = salinan angka KEN/RUEN nasional
// x25/xAkhir = persen bauran energi (primer) EBT. null = PDF tidak memuat angka persentase.
const T = [
  ['perda-b124395-3-2019', null, null, null, null, 'tak ada angka persentase: PDF hanya batang tubuh (lampiran RUED-P tidak ikut)'],
  ['perda-b132147-7-2019', 15.4, 37.9, 2050, 'lampiran', 'pangsa energi baru terbarukan sebesar 15,4% persen pada tahun 2025 … 37,9% persen pada tahun 2050'],
  ['perda-b134981-3-2019', null, null, null, null, 'tak ada angka persentase: PDF hanya batang tubuh; digantikan Perda 8/2025'],
  ['perda-b138377-13-2019', 24, 40, 2050, 'pasal', '24% (dua puluh empat persen) di tahun 2025 … 40% (empat puluh persen) di tahun 2050'],
  ['perda-b139262-10-2019', 30.51, 42.09, 2050, 'pasal', 'sampai dengan Tahun 2025 sebesar 30,51% … sampai dengan Tahun 2050 sebesar 42,09%'],
  ['perda-b139887-13-2019', 17.21, 30.97, 2050, 'pasal', 'ditargetkan mendekati sebesar 17,21% … tahun 2025 dan sebesar 30,97%'],
  ['perda-b146550-6-2020', null, null, null, null, 'tak ada persentase bauran EBT; hanya pasokan EBT lokal (KTOE) di lampiran'],
  ['perda-b148301-9-2020', 23, 31, 2050, 'ruen', 'Pada tahun 2025 peran Energi baru terbarukan paling sedikit 23% … 2050 paling sedikit 31%'],
  ['perda-b149415-7-2019', null, null, null, null, 'tak ada sasaran persentase EBT daerah di teks (hanya mengutip target nasional)'],
  ['perda-b168752-10-2019', 24, 39, 2050, 'pemodelan', 'pemodelan pasokan energi primer EBT … sebesar 24oh (0,62 MTOE) pada tahun 2025 dan 39o/o (8,30 MTOE) pada tahun 2050', true],
  ['perda-b168814-1-2020', null, null, null, null, 'tak ada angka persentase: PDF hanya batang tubuh'],
  ['perda-b171067-2-2021', 23, 31, 2050, 'ruen', 'pada tahun 2050 paling sedikit 31 % (tiga puluh satu persen)'],
  ['perda-b185167-8-2019', 12.39, 28.72, 2050, 'pasal', 'ditargetkan mendekati sebesar 12,39% tahun 2025 dan sebesar 28,72% tahun 2050'],
  ['perda-b205023-9-2021', null, null, null, null, 'tak ada angka persentase: PDF hanya batang tubuh'],
  ['perda-b216543-2-2022', 31.22, 46.64, 2050, 'pasal', 'sebesar 31,22% (tiga puluh satu koma dua puluh dua … sebesar 46,64% (empat puluh enam koma enam puluh empat'],
  ['perda-b219399-2-2022', 20, 32, 2050, 'pasal', '20% (Dua puluh persen) sampai dengan tahun 2025 … 32 % (Tiga puluh dua persen) sampai dengan tahun 2050'],
  ['perda-b226292-4-2022', 23.98, 49.91, 2050, 'lampiran', 'bauran energi baru terbarukan sebesar 23,98% persen di tahun 2025 dan 49,91% pada tahun 2050'],
  ['perda-b235396-1-2022', 27.3, 43.2, 2050, 'pasal', 'ditargetkan mendekati sebesar 27,3% tahun 2025 dan sebesar 43,2% tahun 2050'],
  ['perda-b243729-7-2022', 11.2, 16.8, 2050, 'pasal', 'bauran energi baru terbarukan minimal 11,2% tahun 2025 dan 16,8% di tahun 2050'],
  ['perda-b250531-1-2022', 17, 46, 2050, 'pasal', 'ditargetkan mendekati sebesar 17% pada Tahun 2025 dan sebesar 46% pada Tahun 2050'],
  ['perda-b263132-2-2021', 7, 36, 2050, 'pasal', 'pangsa energi baru terbarukan sebesar 7% di tahun 2025 dan 36% di tahun 2050'],
  ['perda-b274973-5-2023', 4.4, 7.5, 2050, 'pasal', 'paling sedikit sebesar 0,67 MTOE pada tahun 2025 (4,4% dari total bauran … 2,14 MTOE pada tahun 2050 (7,5% dari total bauran', false,
    { catatan: 'hanya EBT yang dipakai di dalam provinsi (bukan impor listrik); dengan impor listrik EBT 2050 = 24,4% bauran primer; PLTS min 20 MW (2025) dan 200 MW (2050)', plts_mw: { 2025: 20, 2050: 200 } }],
  ['perda-b301216-8-2022', 38, 67, 2050, 'pasal', 'ditargetkan mendekati sebesar 38 % tahun 2025 dan 67 % tahun 2050'],
  ['perda-b308381-2-2024', 4, 13, 2050, 'lampiran', 'pangsa energi baru terbarukan sebesar 4 % persen di tahun 2025 dan 13% di tahun 2050'],
  ['perda-b318660-9-2019', 36, 47, 2050, 'pasal', 'sebesar 36 Yo tahun 2025 dan sebesar 47 oh'],
  ['perda-b321801-3-2024', 12.15, 23.76, 2050, 'pasal', '12,15% (dua belas koma satu lima persen) sampai dengan tahun 2025 … 23,76% (dua puluh tiga koma tujuh enam persen)', false, { catatan: 'Perda 3/2024 mengubah Pasal 6 RUED sebelumnya' }],
  ['perda-b356665-8-2025', 14, 25, 2034, 'lampiran', 'pangsa energi baru terbarukan sebesar 14% persen di tahun 2025', true, { catatan: 'RUED 2025-2034; teks OCR kacau ("persen di tahun 25% 2034"): 25% pada 2034 dibaca dari urutan, TINJAU manusia; model lampiran: EBT 47,7% (2030) dan 55,67% (2034)' }],
  ['perda-b143000-4-2019', 25.5, 41.3, 2050, 'pemodelan', 'Skenario RUEA menunjukkan angka bauran EBT sebesar 25,5% pada tahun 2025 dan 41,3 % pada tahun 2050', true, { catatan: 'Qanun Aceh 4/2019 (RUEA, 8 Nov 2026); tabel pemodelan lain di teks yang sama menyebut 33,9% (2025) dan 43,3% (2050): angka dalam dokumen tidak konsisten, TINJAU manusia' }],
  ['perda-b174175-2-2019', 17, 20, 2050, 'lampiran', 'EBT paling sedikit 17% pada tahun 2025 dan paling sedikit 20% pada tahun 2050'],
  ['perda-b194929-12-2018', 21.32, 28.82, 2050, 'pasal', 'tahun 2025 sebesar 21,32% … tahun 2050 sebesar 28,82%'],
];

export const TARGET = T;
const EBT = ['plta', 'pltb', 'plt_bio', 'pltp', 'plts'];

export function bangun() {
  const reg = new Map(bacaRef('public/data/regulasi.json').baris.map(b => [b.id, b]));
  const wil = new Map(bacaRef('public/data/wilayah.json').baris.map(b => [b.kode, b]));
  const baris = T.map(([id, x25, xAkhir, thAkhir, jenis, kutipan, tinjau, tambah]) => {
    const r = reg.get(id);
    const prov = kodeProvinsi(r.instansi_penerbit.replace(/^Pemerintah Provinsi /, '').replace('Daerah Istimewa Yogyakarta', 'DI Yogyakarta').replace('Daerah Khusus Ibukota Jakarta', 'DKI Jakarta').replace('Bangka Belitung', 'Kepulauan Bangka Belitung'));
    if (!prov) throw new Error('provinsi tak dikenali: ' + r.instansi_penerbit);
    const w = wil.get(prov.kode);
    const k = w?.listrik?.kapasitas_jenis_mw;
    const ebtMw = k ? EBT.reduce((a, j) => a + (k[j] || 0), 0) : null;
    const real = k ? { tahun: k.tahun, ebt_mw: ebtMw, total_mw: k.total, pangsa_kapasitas_persen: k.total ? +(100 * ebtMw / k.total).toFixed(1) : null, sumber_url: k.url, catatan: 'pangsa KAPASITAS terpasang EBT (PLTA+PLTB+PLT bio+PLTP+PLTS) dari Statistik Ketenagalistrikan 2024; bukan bauran energi primer, jadi hanya pembanding kasar' } : null;
    return {
      kode: prov.kode, provinsi: prov.nama, perda: `${r.nomor}/${r.tahun}`, judul: r.judul, perda_id: id,
      target: x25 == null ? null : { ebt_2025_persen: x25, ebt_akhir: { tahun: thAkhir, persen: xAkhir }, jenis, ...(tambah || {}) },
      kutipan, perlu_tinjau: !!tinjau || (x25 != null && /OCR|oh|o\/o|Yo/.test(kutipan)) || undefined,
      realisasi: real, selisih_2025_poin: x25 != null && real?.pangsa_kapasitas_persen != null ? +(x25 - real.pangsa_kapasitas_persen).toFixed(1) : null,
      sumber_url: r.url_sumber, url_pdf: r.url_pdf, tanggal_periksa: TANGGAL, tingkat_bukti: 'resmi',
    };
  });
  return {
    jenis: 'rued', sumber: 'Perda RUED provinsi, peraturan.bpk.go.id', tanggal_ambil: TANGGAL, tingkat_bukti: 'resmi', lisensi: 'dokumen peraturan (domain publik)',
    jumlah: baris.length, dengan_target: baris.filter(b => b.target).length, baris,
    meta: {
      catatan: 'Persentase = target peran/pangsa/bauran EBT dalam bauran energi (umumnya primer) menurut perda. Angka dibaca dari teks PDF dan dikutip; jenis: pasal | lampiran | pemodelan (hasil skenario) | ruen (salinan target nasional 23%/31%). Pembanding realisasi hanya kapasitas terpasang, bukan bauran energi.',
      celah: [
        `${baris.filter(b => !b.target).length} perda tanpa angka persentase di PDF (lampiran RUED-P tidak ikut atau hanya mengutip target nasional): ${baris.filter(b => !b.target).map(b => b.provinsi).join(', ')}.`,
        'Kapasitas per teknologi (MW) per provinsi TIDAK diekstrak: tabelnya berupa gambar/tabel lampiran dengan layout tidak seragam; hanya PLTS DKI (20/200 MW) yang tertulis di pasal.',
        'Perda RUED 30 dokumen (29 provinsi; Kaltara dua perda). Belum ada: Sumatera Barat (Perda 11/2019 ada metadatanya tetapi PDF di esdm.sumbarprov.go.id kini membalas HTML SPA, tidak terunduh; tidak ada di peraturan.bpk.go.id), Sumatera Selatan, Kepulauan Riau, Maluku Utara, Papua, dan 4 provinsi Papua baru (Selatan, Tengah, Pegunungan, Barat Daya): perda tidak ditemukan di BPK maupun hasil cari web.',
        'Riau 2050 = 46,64 (teks perda, huruf "empat puluh enam koma enam puluh empat"); panen lama memuat 44,63. Dikoreksi di wilayah.json lewat potret_wilayah.mjs (koreksiKandidat memakai rued.json). Kalimantan Utara: rued.json memuat Perda 3/2019 (tanpa angka, digantikan) dan Perda 8/2025 (berlaku, perlu_tinjau); wilayah.json memakai 8/2025.',
        'Banyak PDF hasil OCR (Riau, NTT, Lampung, Sultra): kolom perlu_tinjau menandai bacaan yang rentan.',
      ],
    },
  };
}

async function unduh() {
  const reg = bacaRef('public/data/regulasi.json').baris;
  fs.mkdirSync(path.join(AKAR, 'pdf'), { recursive: true });
  for (const [id] of T) {
    const f = path.join(AKAR, 'pdf', id + '.pdf'); if (fs.existsSync(f)) continue;
    const r = await fetch(reg.find(b => b.id === id).url_pdf, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!r.ok) throw new Error(`${r.status} ${id}`);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    execFileSync('pdftotext', ['-layout', f, f.replace(/\.pdf$/, '.txt')], { stdio: 'ignore' });
    await tidur(2200);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  (async () => {
    if (process.argv.includes('--unduh')) await unduh();
    const j = bangun(); tulis(path.join(AKAR, 'public/data/rued.json'), j);
    console.log('rued:', j.jumlah, 'perda,', j.dengan_target, 'bertarget');
  })().catch(e => { console.error(e.message); process.exit(1); });
}
