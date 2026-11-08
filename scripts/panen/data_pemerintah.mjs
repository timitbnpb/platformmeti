#!/usr/bin/env node
// Pembangun public/data/pemerintah/*.json (offline, dari mentah hasil panen + butir terkurasi).
//   PEMERINTAH_MENTAH=<dir> node scripts/panen/data_pemerintah.mjs bangun
// Panen: data_pemerintah_comtrade.mjs (UN Comtrade bulanan), data_pemerintah_bkpm.mjs (data.bkpm.go.id), data_pemerintah_osm.mjs (jaringan OSM).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HS_BULANAN, TANGGAL, bangunBulanan, parseCsv, ringkasBkpm, normNama } from './data_pemerintah_lib.mjs';
import { IEA_SUMBER, IEA_ANGKA, IEA_CELAH, INDUSTRI_SUMBER, REKAP_PABRIK, PABRIK, PENGADAAN_CELAH } from './data_pemerintah_data.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const MENTAH = (process.env.PEMERINTAH_MENTAH || AKAR + 'data/pemerintah_mentah/').replace(/\/?$/, '/');
const OUT = AKAR + 'public/data/pemerintah/';
const tulis = (n, o) => { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(OUT + n, JSON.stringify(o) + '\n'); console.log(n, fs.statSync(OUT + n).size); };

export function bangunSemua() {
  // 1. Comtrade bulanan
  const ref = JSON.parse(fs.readFileSync(AKAR + 'data/dagang_komponen/mitra.json', 'utf8')).results;
  const peta = new Map(ref.filter((r) => r.PartnerCodeIsoAlpha2 && !r.isGroup).map((r) => [r.PartnerCode, { iso2: r.PartnerCodeIsoAlpha2.toLowerCase() }]));
  const dir = MENTAH + 'comtrade/';
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(dir + f, 'utf8'))) : [];
  const bulanan = bangunBulanan(files, peta);
  const bulanTerakhir = bulanan.reduce((m, b) => (b.bulan > m ? b.bulan : m), '');
  const adaPerHs = Object.fromEntries(Object.keys(HS_BULANAN).map((h) => [h, files.filter((f) => f.hs === h).length / 2]));
  tulis('comtrade_bulanan.json', {
    lapis: 'publik', dibangun_pada: TANGGAL, hs: HS_BULANAN, kunci_tautan: 'iso2 mitra = kunci negara; hs = kode HS; komponen cocok dengan dagang_komponen.json (tahunan)',
    sumber: [{ id: 's-comtrade-bulanan', judul: 'UN Comtrade, impor dan ekspor bulanan Indonesia (pelapor 360), HS EBT, API publik /preview', penerbit: 'United Nations Statistics Division (UN Comtrade)', tahun: 2026, url: 'https://comtradeapi.un.org', lisensi: 'Data publik UN Comtrade, dikutip dengan atribusi', tingkat_bukti: 'resmi', tanggal_ambil: TANGGAL }],
    bulan_terakhir: bulanTerakhir, bulan_terambil_per_hs: adaPerHs, baris: bulanan,
    meta: { celah: [
      `Cakupan belum penuh: kuota API /preview berhenti dengan 403 setelah sekitar 130 panggilan per sesi (aturan panen: berhenti). Bulan terambil per HS: ${Object.entries(adaPerHs).map(([h, n]) => h + '=' + n).join(', ')} dari 58 yang direncanakan (2022-01 sampai 2026-10). Lanjutkan dengan scripts/panen/data_pemerintah_comtrade.mjs (berkas yang ada dilewati).`,
      'API publik /preview Comtrade tanpa kunci: satu periode per panggilan, tanpa rincian 8 digit; nilai bisa direvisi.',
      'Bulan tanpa baris = belum dilaporkan Indonesia ke Comtrade atau tidak ada perdagangan; bukan bukti nol. Bulan terakhir tersedia bergantung pelaporan.',
      'HS 8410 (turbin hidrolik) dan 8419 (mesin pemanas-pendingin, termasuk pemanas air surya) mencakup barang non-EBT; HS 8504.40 memuat pengisi daya dan UPS; HS 8507.60 memuat semua baterai litium-ion.',
      'HS 8541.42 dan 8541.43 baru ada sejak HS 2022, sehingga seri mulai 2022-01; tidak bisa disambung ke 8541.40 di dagang_komponen.json sebelum 2022.',
      'Per baris hanya 15 mitra teratas; sisanya di lainnya_usd. Berat bersih (kg) bisa kosong untuk sebagian kode.',
    ] },
  });
  // 2. BKPM
  const W = AKAR + 'public/data/wilayah/';
  const pk = new Map(fs.readdirSync(W).filter((f) => /^\d\d\.json$/.test(f)).map((f) => { const j = JSON.parse(fs.readFileSync(W + f, 'utf8')); return [normNama(j.nama), { kode: j.kode, nama: j.nama }]; }));
  const bd = MENTAH + 'bkpm/';
  const per = fs.existsSync(bd) ? fs.readdirSync(bd).filter((f) => /^20\d\d-\d\.csv$/.test(f)).sort().map((f) => { const [tahun, triwulan] = f.slice(0, 6).split('-').map(Number); return { tahun, triwulan, baris: parseCsv(fs.readFileSync(bd + f, 'utf8')) }; }) : [];
  const r = ringkasBkpm(per, pk);
  tulis('bkpm_listrik.json', {
    lapis: 'publik', dibangun_pada: TANGGAL, kunci_tautan: 'provinsi.kode = kode BPS 2 digit (public/data/wilayah/<kode>.json); negara_asal_pma.iso2 = kunci negara',
    sumber: [{ id: 's-bkpm-lkpm', judul: 'Data Realisasi Investasi Triwulan (agregat LKPM/OSS menurut sektor, lokasi, negara asal)', penerbit: 'Kementerian Investasi/BKPM, Direktorat Data dan Informasi (data.bkpm.go.id)', tahun: 2026, url: 'https://data.bkpm.go.id/dataset?search=realisasi%20investasi%20triwulan', lisensi: 'Data terbuka (Satu Data Indonesia), dikutip dengan atribusi', tingkat_bukti: 'resmi', tanggal_ambil: TANGGAL }],
    triwulan_tersedia: per.map((p) => `${p.tahun}-T${p.triwulan}`),
    sektor: r.sektor, provinsi: r.provinsi, negara_asal_pma: r.negara_asal_pma,
    meta: { satuan: 'rp_juta = juta rupiah; usd_ribu = ribu dolar AS; angka PER TRIWULAN (bukan kumulatif); total semua sektor Q3 2025 = Rp491,4 T cocok dengan siaran resmi', celah: [
      'Sektor "Listrik, Gas dan Air" menurut klasifikasi BKPM mencakup KBLI 35 (pengadaan listrik, gas, uap) dan 36 (pengolahan air); bukan hanya EBT. Tidak ada pemisahan PLTS/PLTA/PLTP di data publik ini.',
      'Realisasi investasi berasal dari laporan LKPM perusahaan menengah-besar; belum mencakup usaha kecil, dan PMA/PMDN menurut izin, bukan menurut sumber dana akhir.',
      'Negara asal PMA memuat negara perantara pajak (Hongkong, Singapura, Mauritius, BVI, Seychelles); bukan selalu pemilik akhir.',
      'Jumlah izin per sektor tidak ada di berkas ini; kolom baris = jumlah rekaman (kab/kota x KBLI x negara), bukan jumlah proyek atau izin.',
      'Triwulan yang tidak muncul di triwulan_tersedia belum terbit di data.bkpm.go.id saat panen (mis. 2026 T4).',
      'KBLI 26/27 (industri komputer-elektronik, peralatan listrik) di industri_peralatan_elektronik mencakup barang non-EBT; hanya proksi.',
    ] },
  });
  // 3. IEA
  tulis('iea_indonesia.json', { lapis: 'publik', dibangun_pada: TANGGAL, sumber: IEA_SUMBER, angka: IEA_ANGKA, meta: { celah: IEA_CELAH } });
  // 4. Pengadaan dan industri
  tulis('pengadaan_industri.json', { lapis: 'publik', dibangun_pada: TANGGAL, kunci_tautan: 'provinsi_kode = kode BPS; org_id diisi bila perusahaan sudah ada di direktori', sumber: INDUSTRI_SUMBER, paket_tender: [], rekap_pabrik: REKAP_PABRIK, pabrik: PABRIK, meta: { celah: PENGADAAN_CELAH } });
  return r.tidak_cocok;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tc = bangunSemua(); if (tc.length) console.log('provinsi tak cocok:', tc);
}
