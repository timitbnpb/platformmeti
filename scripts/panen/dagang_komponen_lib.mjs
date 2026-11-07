// Bagian murni/offline untuk dagang_komponen.mjs: daftar komponen, pembangun berkas dari data mentah.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
export const TANGGAL = '2026-11-08';
export const TOP = 25;
export const TAHUN = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
// surya: HS 2017 (sampai 2021) hanya punya 8541.40 (juga memuat LED dan dioda); HS 2022 memecahnya, sel rakitan modul jadi 8541.43.
export const KOMPONEN = ['surya', 'baterai', 'angin', 'inverter'];
export const HS = { surya: { lama: '854140', baru: '854143' }, baterai: '850760', angin: '850231', inverter: '850440' };
export const kodeUntuk = (k, th) => (k === 'surya' ? (th >= 2022 ? HS.surya.baru : HS.surya.lama) : HS[k]);
export const SUMBER = [{ id: 's-comtrade', judul: 'UN Comtrade, impor dan ekspor Indonesia (pelapor 360) menurut HS 6 digit, API publik /preview', penerbit: 'United Nations Statistics Division (UN Comtrade)', tahun: 2026, url: 'https://comtradeapi.un.org', lisensi: 'Data publik UN Comtrade, dikutip dengan atribusi', tingkat_bukti: 'resmi' }];
export const CELAH = [
  'Sumber ekspor-impor adalah UN Comtrade (data yang dilaporkan Indonesia/BPS pada 6 digit HS), bukan tabel BPS 8 digit; nilai mengikuti pelaporan Comtrade dan bisa direvisi.',
  'Seri surya putus di 2022: sampai 2021 memakai HS 8541.40 (sel, modul, juga LED dan dioda), mulai 2022 HS 8541.43 (sel rakitan modul). Jangan membandingkan 2021 dengan 2022 langsung.',
  'HS 8502.31 (set pembangkit tenaga angin) dan 8504.40 (konverter statis, termasuk pengisi daya dan UPS, bukan hanya inverter surya) mencakup barang non-EBT; HS 8507.60 mencakup semua baterai litium-ion, termasuk kendaraan dan elektronik.',
  'Negara asal/tujuan memakai negara mitra menurut pelaporan Indonesia; transit dan perakitan lintas negara tidak terlihat.',
  'Data tahun 2025 belum dimuat; Comtrade baru lengkap setelah pelaporan tahunan masuk.',
];

const baca = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
export function bangun() {
  const ref = baca('data/dagang_komponen/mitra.json').results;
  const peta = new Map(ref.filter((r) => r.PartnerCodeIsoAlpha2 && !r.isGroup).map((r) => [r.PartnerCode, { iso2: r.PartnerCodeIsoAlpha2.toLowerCase(), iso3: r.PartnerCodeIsoAlpha3, nama: r.PartnerDesc }]));
  const tahunan = [], mitraSet = new Map();
  for (const k of KOMPONEN) for (const th of TAHUN) for (const alir of ['M', 'X']) {
    const hs = kodeUntuk(k, th), f = `data/dagang_komponen/${hs}_${alir}_${th}.json`;
    if (!fs.existsSync(AKAR + f)) continue;
    const m = baca(f), rows = m.data;
    const dunia = rows.find((r) => r.p === 0);
    const mitra = rows.filter((r) => r.p !== 0 && peta.has(r.p) && r.v > 0).map((r) => { return { kode: r.p, usd: Math.round(r.v), kg: Math.round(r.w || 0) }; }).sort((a, b) => b.usd - a.usd);
    const lainnya = mitra.slice(TOP).reduce((a, r) => a + r.usd, 0);
    mitra.length = Math.min(mitra.length, TOP);
    for (const r of mitra) mitraSet.set(r.kode, peta.get(r.kode));
    tahunan.push({ komponen: k, hs, alir: alir === 'M' ? 'impor' : 'ekspor', tahun: th, usd: dunia ? Math.round(dunia.v) : mitra.reduce((a, r) => a + r.usd, 0), kg: dunia ? Math.round(dunia.w || 0) : null, mitra, lainnya_usd: lainnya, sumber_id: 's-comtrade', tingkat_bukti: 'resmi', tanggal: m.ambil || TANGGAL });
  }
  const mitra = [...mitraSet].map(([kode, v]) => ({ kode, ...v })).sort((a, b) => a.kode - b.kode);
  return { lapis: 'publik', dibangun_pada: TANGGAL, hs: { surya: ['854140', '854143'], baterai: ['850760'], angin: ['850231'], inverter: ['850440'] }, sumber: SUMBER, tahunan, mitra, meta: { diperbarui: TANGGAL, celah: CELAH } };
}
