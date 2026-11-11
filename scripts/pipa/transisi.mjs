// public/data/transisi.json: bahan halaman /transisi (target, kesehatan sistem, karbon) yang BELUM ada di berkas data lain.
//   node scripts/pipa/transisi.mjs [tanggal]     (tanpa jaringan; membaca teks RUPTL lokal, ieto2025, regulasi)
// Isi: neraca daya 16 sistem PLN (RUPTL 2025-2034, skenario RE Base, tabel 5.82-5.122), beban puncak nasional 2015-2024 (tabel 4.48),
// pembanding IESR (IETO 2025), regulasi nilai ekonomi karbon, daftar celah ("belum tersedia (menunggu dokumen sumber)").
// Angka target/karbon/kapasitas yang sudah ada TIDAK disalin: halaman membaca target.json, karbon.json, karbon_proyek.json, ember_bulanan.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TEKS_RUPTL = path.join(AKAR, 'data-panen/pdf/teks/ruptl-2025-2034.txt');
const KELUAR = path.join(AKAR, 'public/data/transisi.json');
const TAHUN = Array.from({ length: 10 }, (_, i) => 2025 + i);

/* nama di judul tabel -> id sistem, nama tampil, kode provinsi yang dilayaninya (pemetaan EST: sistem utama provinsi, bukan batas jaringan) */
export const SISTEM = [
  { kunci: 'Sumatera-Bangka', id: 'sumatera', nama: 'Sumatera-Bangka', prov: ['11', '12', '13', '14', '15', '16', '17', '18', '19'] },
  { kunci: 'Jawa-Bali', id: 'jawa-bali', nama: 'Jawa-Bali', prov: ['31', '32', '33', '34', '35', '36', '51'] },
  { kunci: 'Kalimantan Barat', id: 'kalbar', nama: 'Kalimantan Barat', prov: ['61'] },
  { kunci: 'Kalseltengtimra', id: 'kalseltengtimra', nama: 'Kalseltengtimra', prov: ['62', '63', '64', '65'] },
  { kunci: 'Sulbagut', id: 'sulbagut', nama: 'Sulbagut', prov: ['71', '75'] },
  { kunci: 'Sulbagsel', id: 'sulbagsel', nama: 'Sulbagsel', prov: ['72', '73', '74', '76'] },
  { kunci: 'Ambon', id: 'ambon', nama: 'Ambon', prov: ['81'] },
  { kunci: 'Halmahera', id: 'halmahera', nama: 'Halmahera', prov: ['82'] },
  { kunci: 'Jayapura', id: 'jayapura', nama: 'Jayapura', prov: ['91'] },
  { kunci: 'Merauke', id: 'merauke', nama: 'Merauke', prov: ['93'] },
  { kunci: 'Nabire', id: 'nabire', nama: 'Nabire', prov: ['94'] },
  { kunci: 'Wamena', id: 'wamena', nama: 'Wamena', prov: ['95'] },
  { kunci: 'Manokwari', id: 'manokwari', nama: 'Manokwari', prov: ['92'] },
  { kunci: 'Sorong', id: 'sorong', nama: 'Sorong', prov: ['96'] },
  { kunci: 'Lombok', id: 'lombok', nama: 'Lombok', prov: ['52'] },
  { kunci: 'Timor', id: 'timor', nama: 'Timor', prov: ['53'] },
];

/* "8.459" -> 8459 (titik ribuan); "59.5" -> 59.5; "5,4" -> 5.4; "28%" -> 28; "(309)" atau "-39" -> negatif; "-" -> 0 */
export function angkaRuptl(s) {
  let x = String(s).trim().replace(/\*+$/, '');
  if (x === '-') return 0;
  const neg = /^\(.*\)$/.test(x) || x.startsWith('-');
  x = x.replace(/[()%\-]/g, '');
  x = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(x) ? x.replace(/\./g, '').replace(',', '.') : x.replace(',', '.');
  const n = Number(x);
  return Number.isFinite(n) ? (neg ? -n : n) : null;
}
const TOKEN = /\(?-?\d[\d.]*(?:,\d+)?\)?%?\**|(?<=\s)-(?=\s|$)/g;
/* sepuluh angka di ujung baris; sembilan = sel pertama kosong di PDF, dibaca 0 (hanya bila pad) */
function sepuluh(baris, dari, pad = false) {
  const sisa = baris.slice(dari);
  const t = [...sisa.matchAll(TOKEN)].map((m) => m[0]);
  if (t.length === 9 && pad) t.unshift('-');
  if (t.length < 10) return null;
  return t.slice(-10).map(angkaRuptl);
}

/* Baris yang diambil: [kunci, regex awal, bagian tempat baris itu sah, pad]. Label bervariasi antarsistem (Bruto/(Bruto), Penjualan/demand, Neto/Netto). */
const BARIS = [
  ['penjualan_gwh', /^\s*a\.\s*Penjualan\b/, 'kebutuhan'],
  ['pertumbuhan_demand_persen', /^\s*b\.\s*Pertumbuhan (?:demand|Penjualan)\b/, 'kebutuhan'],
  ['produksi_gwh', /^\s*c\.\s*Produksi\b/, 'kebutuhan'],
  ['faktor_beban_persen', /^\s*d\.\s*Faktor Beban\b/, 'kebutuhan'],
  ['beban_puncak_bruto_mw', /^\s*e\.\s*Beban Puncak (?:\(Bruto\)|Bruto)/, 'kebutuhan'],
  ['beban_puncak_neto_mw', /^\s*[ef]\.\s*Beban Puncak Neto\b/, 'kebutuhan'],
  ['kapasitas_terpasang_mw', /^\s*a\.\s*Total Kapasitas Terpasang\b/, 'eksisting'],
  ['dmn_sistem_mw', /^\s*c\.\s*Total (?:DMN Sistem|Daya Mampu Sistem)\b.*?\s{2,}MW/, 'rekap'],
  ['dmn_fosil_mw', /^\s*-\s*Pembangkit Fosil\b/, 'rekap', true],
  ['dmn_ebt_mw', /^\s*-\s*Pembangkit EBT\b/, 'rekap', true],
  ['lolp_persen', /^\s*d\.\s*LOLP\b/, 'rekap'],
  ['reserve_margin_mw', /^\s*[a-g]\.\s*Reserve Margin\s+MW\b/, 'rekap'],
  ['reserve_margin_persen', /^\s*[a-g]\.\s*Reserve Margin\s+%/, 'rekap'],
  ['bauran_ebt_persen', /^\s*a\.\s*EBT\s+%/, 'bauran', true],
  ['bauran_gas_persen', /^\s*b\.\s*Gas\s+%/, 'bauran', true],
  ['bauran_bbm_persen', /^\s*c\.\s*BBM\s+%/, 'bauran', true],
  ['bauran_batubara_persen', /^\s*d\.\s*Batubara\s+%/, 'bauran', true],
];
const BAGIAN = [[/^\s*1\.\s*KEBUTUHAN/, 'kebutuhan'], [/^\s*2\.\s*PASOKAN EKSISTING/, 'eksisting'], [/^\s*3\.\s*TAMBAHAN/, 'tambahan'], [/^\s*4\.\s*REKAPITULASI/, 'rekap'], [/^\s*5\.\s*BAURAN/, 'bauran'], [/^\s*6\.\s*EMISI/, 'emisi'], [/^\s*7\.\s*ESTIMASI/, 'bpp']];
const PENGALI_EMISI = (satuan) => (/ribu/i.test(satuan) ? 0.001 : 1);

/** Urai satu blok tabel neraca daya -> {kunci: [10 angka]|null}; emisi_juta_ton = baris total bila ada, kalau tidak jumlah sub-baris (juta ton CO2). */
export function uraiBlok(baris) {
  const out = {};
  let bagian = '';
  let total = null;
  const sub = [];
  for (const b of baris) {
    for (const [re, nama] of BAGIAN) if (re.test(b)) bagian = nama;
    if (bagian === 'emisi') {
      const h = /^\s*6\.\s*EMISI GRK\s+((?:Juta|Ribu) [Tt]on(?: CO2)?)/.exec(b);
      if (h) { const v = sepuluh(b, h[0].length, true); if (v) total = v.map((x) => x * PENGALI_EMISI(h[1])); continue; }
      const m = /^\s*[a-d]\.\s*(?:EBT|Gas|BBM|Batubara)\s+((?:Juta|Ribu) [Tt]on(?: CO2)?)/.exec(b);
      if (m) { const v = sepuluh(b, m[0].length, true); if (v) sub.push(v.map((x) => x * PENGALI_EMISI(m[1]))); }
      continue;
    }
    for (const [kunci, re, konteks, pad] of BARIS) {
      if (out[kunci] !== undefined || konteks !== bagian || !re.test(b)) continue;
      out[kunci] = sepuluh(b, re.exec(b)[0].length, !!pad);
    }
  }
  out.emisi_juta_ton = (total ?? (sub.length ? sub[0].map((_, i) => sub.reduce((j, r) => j + r[i], 0)) : null))?.map((x) => Math.round(x * 1000) / 1000) ?? null;
  return out;
}

/** Cari judul badan tabel neraca daya RE Base per sistem (bukan daftar isi, bukan ARED, bukan varian Kupang). */
export function uraiNeraca(teks) {
  const baris = teks.split('\n');
  const hasil = [];
  for (let i = 0; i < baris.length; i++) {
    const m = /^\s*Tabel (5\.\d+)\s+Neraca Daya Sistem (.+?)\s+Tahun 2025-2034\s*(.*)$/.exec(baris[i]);
    if (!m || i < 5000) continue;
    const ket = m[3];
    if (/ARED|Kupang/.test(ket) || /Kupang/.test(m[2])) continue;
    const s = SISTEM.find((x) => x.kunci === m[2].trim());
    if (!s) continue;
    let j = i + 1;
    while (j < baris.length && j < i + 420 && !/^\s*Tabel 5\.\d+\s+\S/.test(baris[j])) j++;
    hasil.push({ ...s, tabel: m[1], baris_teks: i + 1, nilai: uraiBlok(baris.slice(i + 1, j)) });
  }
  return hasil;
}

export function bebanNasional(teks) {
  const i = teks.indexOf('Tabel 4.48 Realisasi Beban Puncak Sistem Tenaga Listrik (MW)\n');
  if (i < 0) return null;
  const blok = teks.slice(i, i + 900).split('\n');
  const tahun = [], nilai = [];
  for (const b of blok) {
    if (/^\s*Uraian\s+20\d\d/.test(b)) tahun.push(...[...b.matchAll(/20\d\d/g)].map((x) => Number(x[0])));
    if (/^\s*Beban Puncak\s+\d/.test(b)) nilai.push(...[...b.matchAll(/\d[\d.]*/g)].map((x) => angkaRuptl(x[0])));
  }
  return tahun.length === nilai.length && tahun.length === 10 ? tahun.map((t, k) => ({ tahun: t, beban_puncak_mw: nilai[k] })) : null;
}

const SUMBER_RUPTL = {
  id: 'ruptl-2025',
  judul: 'RUPTL PT PLN (Persero) 2025-2034 (lampiran Kepmen ESDM 188.K/TL.03/MEM.L/2025)',
  penerbit: 'PT PLN (Persero); disahkan Kementerian ESDM',
  tahun: 2025,
  url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf',
  tingkat_bukti: 'resmi',
};

function bangun(teks, tgl) {
  const neraca = uraiNeraca(teks);
  const beban = bebanNasional(teks);
  const sistem = neraca.map((s) => ({
    id: s.id, nama: s.nama, provinsi: s.prov, tabel_ruptl: 'Tabel ' + s.tabel, skenario: 'RE Base', tahun: TAHUN,
    ...Object.fromEntries([...BARIS.map(([k]) => k), 'emisi_juta_ton'].map((k) => [k, s.nilai[k] ?? null])),
  }));
  const ieto = (() => {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(AKAR, 'data/strategis/ieto2025.json'), 'utf8'));
      const ID = ['ieto-004', 'ieto-005', 'ieto-006', 'ieto-007', 'ieto-010', 'ieto-014', 'ieto-017', 'ieto-018', 'ieto-020', 'ieto-022', 'ieto-027', 'ieto-031'];
      return j.angka.filter((a) => ID.includes(a.id)).map(({ id, label, nilai, satuan, tahun_data, halaman, catatan }) => ({ id, label, nilai, satuan, tahun_data, halaman, catatan: catatan || null, sumber_id: 'iesr-ieto-2025', tingkat_bukti: 'kajian' }));
    } catch { return null; }
  })();
  const reg = JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data/regulasi.json'), 'utf8')).baris
    .filter((r) => ['perpres-110-2025', 'perpres-98-2021'].includes(r.id))
    .map(({ id, nomor, tahun, judul, status, tanggal_ditetapkan, url_sumber, url_pdf }) => ({ id, nomor, tahun, judul, status, tanggal_ditetapkan, url_sumber, url_pdf, tingkat_bukti: 'resmi' }));
  return {
    lapis: 'publik',
    dibangun_pada: tgl,
    jumlah_sistem: sistem.length,
    sumber: [SUMBER_RUPTL, { id: 'iesr-ieto-2025', judul: 'Indonesia Energy Transition Outlook (IETO) 2025', penerbit: 'IESR', tahun: 2024, url: 'https://iesr.or.id/wp-content/uploads/2024/12/Indonesia-Energy-Transition-Outlook-IETO-2025.pdf', tingkat_bukti: 'kajian' }],
    beban_puncak_nasional: { satuan: 'MW', catatan: 'Beban puncak bulanan seluruh sistem (non-coincident, grid + isolated, termasuk Batam Bintan); 2024 sampai Oktober (SILM)', tabel_ruptl: 'Tabel 4.48', sumber_id: 'ruptl-2025', tingkat_bukti: 'resmi', baris: beban },
    sistem,
    pembanding_iesr: ieto,
    regulasi_karbon: reg,
    celah: [
      'Kurtailmen (energi EBT variabel yang dibuang): tidak ada angka publik per sistem di RUPTL 2025-2034 maupun Statistik Ketenagalistrikan 2024; belum tersedia (menunggu dokumen sumber) (laporan operasi sistem PLN atau permintaan data ke ESDM).',
      'Faktor kapasitas per operator panas bumi dan hidro: laporan tahunan operator (PGE, Star Energy, Medco Power, PLN Indonesia Power) tidak dipanen; halaman memakai faktor kapasitas EST per provinsi dari Statistik 2024.',
      'Faktor emisi grid resmi ESDM per sistem (Kepmen ESDM faktor emisi GRK sistem ketenagalistrikan): dokumen tidak ada di korpus lokal; belum tersedia (menunggu dokumen sumber). Halaman memakai intensitas emisi turunan dari tabel RUPTL (emisi GRK dibagi produksi).',
      'Pajak karbon: tarif Rp30 per kg CO2e (UU 7/2021 Pasal 13) dan penundaan pemberlakuan tidak ada naskahnya di korpus regulasi lokal; hanya Perpres 98/2021 (dicabut) dan Perpres 110/2025 yang tercatat. UU HPP dan PMK terkait belum ada di korpus.',
      'Status SRN PPI per proyek EBT: portal SRN (srn.menlhk.go.id) tidak dipanen; yang tampil adalah proyek terdaftar di IDXCarbon dan registri Gold Standard/Verra yang sudah ada di karbon.json dan karbon_proyek.json.',
      'Tambahan kapasitas EBT per bulan: siaran pers ESDM/PLN tidak memuat deret bulanan terstruktur; yang tampil deret tahunan Statistik Ketenagalistrikan (rata-rata per bulan = EST).',
      'Kapasitas serap EBT variabel per sistem (batas penetrasi PLN) dan skenario Ember 14 persen 2030 ke 36 persen 2050: tidak ada tabel terbaca di RUPTL; halaman memakai rasio PLTS+PLTB rencana RUPTL terhadap beban puncak neto 2034 (EST).',
    ],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tgl = process.argv[2] || new Date().toISOString().slice(0, 10);
  if (!fs.existsSync(TEKS_RUPTL)) { console.error('teks RUPTL lokal tidak ada: ' + TEKS_RUPTL); process.exit(1); }
  const data = bangun(fs.readFileSync(TEKS_RUPTL, 'utf8'), tgl);
  fs.writeFileSync(KELUAR, JSON.stringify(data, null, 1) + '\n');
  console.log('sistem', data.sistem.length, 'beban', data.beban_puncak_nasional.baris?.length);
  for (const s of data.sistem) console.log(s.id.padEnd(16), Object.entries(s).filter(([, v]) => v === null).map(([k]) => k).join(',') || 'lengkap');
}
export { bangun };
