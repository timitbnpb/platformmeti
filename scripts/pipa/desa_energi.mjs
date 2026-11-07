// Status Indeks Desa Membangun (IDM) per provinsi, Kemendes PDTT (Portal Satu Data, ODC-BY), 2023 dan 2024; xlsx rekap dibaca langsung.
// Pakai: node scripts/pipa/desa_energi.mjs [--unduh] [--tanggal=...]. Program Desa Energi Berdikari/Mandiri Energi: lihat meta.celah.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { AKAR, TANGGAL, UA, tidur, tulis, kodeProvinsi } from './_panen_umum.mjs';

const SD = 'https://satudata.kemendesa.go.id/dataset/';
export const REKAP = {
  2024: { berkas: 'idm2024_rekap.xlsx', halaman: SD + 'data-indeks-desa-membangun-tahun-2024', unduh: SD + 'cf78ca7f-6385-4279-9d1a-043695b0cb0a/resource/2076c47d-5bf0-491e-a673-6e4dd5a63431/download/rekap-indeks-desa-membangun-tahun-2024.xlsx' },
  2023: { berkas: 'idm2023_rekap.xlsx', halaman: SD + 'data-indeks-desa-membangun-idm-tahun-2023', unduh: SD + 'd53fba4c-bff0-4207-a460-a049dde24054/resource/ee43a124-c1c7-4c75-a286-8f8de37c0a82/download/rekap-indeks-desa-membangun-tahun-2023.xlsx' },
};
const un = (f, p) => execFileSync('unzip', ['-p', f, p], { encoding: 'utf-8', maxBuffer: 1 << 26 });
const ent = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

// xlsx -> array baris (sel kosong = ''), sheet pertama
export function bacaXlsx(f) {
  const ss = [...un(f, 'xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => ent(m[1].replace(/<[^>]+>/g, '')));
  return [...un(f, 'xl/worksheets/sheet1.xml').matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(r => {
    const out = [];
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const idx = c[1].split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const v = (c[3] || '').match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
      out[idx] = / t="s"/.test(c[2]) && v !== '' ? ss[+v] : v;
    }
    return Array.from(out, x => x ?? '');
  });
}
const ALIAS = { 'DAERAH ISTIMEWA YOGYAKARTA': 'DI Yogyakarta', 'DKI JAKARTA': 'DKI Jakarta', 'KEP. BANGKA BELITUNG': 'Kepulauan Bangka Belitung', 'KEP. RIAU': 'Kepulauan Riau' };
const KUNCI = { MANDIRI: 'mandiri', MAJU: 'maju', BERKEMBANG: 'berkembang', TERTINGGAL: 'tertinggal', 'SANGAT TERTINGGAL': 'sangat_tertinggal', 'TOTAL DESA 2024': 'total_desa' };

export function parseRekap(rows, tahun) {
  const h = rows[0].map(x => String(x).trim().toUpperCase());
  const iP = h.indexOf('PROVINSI'); if (iP < 0) throw new Error('kolom PROVINSI tak ada');
  return rows.slice(1).filter(r => r[iP] && !/^TOTAL|JUMLAH/i.test(r[iP])).map(r => {
    const nama = String(r[iP]).trim(); const p = kodeProvinsi(ALIAS[nama.toUpperCase()] || nama);
    if (!p) throw new Error('provinsi tak dikenali: ' + nama);
    const st = { mandiri: 0, maju: 0, berkembang: 0, tertinggal: 0, sangat_tertinggal: 0 };
    h.forEach((k, i) => { const a = KUNCI[k]; if (a && a !== 'total_desa') st[a] = +r[i] || 0; });
    const total = Object.values(st).reduce((a, b) => a + b, 0);
    const iT = h.findIndex(k => /^TOTAL DESA/.test(k)); const tidakKeluar = +r[h.findIndex(k => /TIDAK KELUAR/.test(k))] || 0;
    return { kode: p.kode, provinsi: p.nama, tahun, ...st, desa_tidak_keluar_status: tidakKeluar, total_desa_lapor: iT >= 0 ? +r[iT] || total : total };
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) (async () => {
  const raw = path.join(AKAR, 'raw'); fs.mkdirSync(raw, { recursive: true });
  for (const [t, d] of Object.entries(REKAP)) {
    const f = path.join(raw, d.berkas);
    if (process.argv.includes('--unduh') || !fs.existsSync(f)) { const r = await fetch(d.unduh, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error(`HTTP ${r.status} IDM ${t}`); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); await tidur(2200); }
  }
  const per = Object.fromEntries(Object.entries(REKAP).map(([t, d]) => [t, parseRekap(bacaXlsx(path.join(raw, d.berkas)), +t)]));
  const baris = per[2024].map(b => {
    const l = per[2023].find(x => x.kode === b.kode);
    return { ...b, status_2023: l ? { mandiri: l.mandiri, maju: l.maju, berkembang: l.berkembang, tertinggal: l.tertinggal, sangat_tertinggal: l.sangat_tertinggal } : null,
      persen_maju_mandiri_2024: b.total_desa_lapor ? +(100 * (b.mandiri + b.maju) / b.total_desa_lapor).toFixed(1) : null,
      sumber_url: REKAP[2024].halaman, tanggal_periksa: TANGGAL, tingkat_bukti: 'resmi' };
  });
  tulis(path.join(AKAR, 'public/data/desa_energi.json'), {
    jenis: 'desa_energi', tanggal_ambil: TANGGAL, tingkat_bukti: 'resmi', lisensi: 'Open Data Commons Attribution License (Portal Satu Data Kemendes PDTT)',
    sumber: { 2024: { url: REKAP[2024].halaman, berkas: REKAP[2024].unduh }, 2023: { url: REKAP[2023].halaman, berkas: REKAP[2023].unduh } },
    jumlah: baris.length, nasional_2024: Object.fromEntries(['mandiri', 'maju', 'berkembang', 'tertinggal', 'sangat_tertinggal', 'desa_tidak_keluar_status', 'total_desa_lapor'].map(k => [k, baris.reduce((a, b) => a + b[k], 0)])),
    baris, desa_energi: [],
    meta: {
      catatan: 'IDM = status desa (Mandiri, Maju, Berkembang, Tertinggal, Sangat Tertinggal) per provinsi, rekap resmi. total_desa_lapor = kolom TOTAL DESA 2024 (termasuk desa yang tidak keluar status IDM). 2024 = hasil pemutakhiran per rekap; status_2023 untuk pembanding.',
      celah: [
        'desa_energi = [] : daftar desa program Desa Energi Berdikari (ESDM/Pertamina) dan Desa Mandiri Energi TIDAK dipanen. ebtke.esdm.go.id adalah SPA tanpa API terdokumentasi, geoportal ESDM melarang robots, dan Pertamina menerbitkan daftar lewat siaran pers tersebar; belum ada sumber tabular terbuka yang ditemukan.',
        'IDM per desa (indeks-desa.csv, ~75 ribu baris) ada di Portal Satu Data tetapi tidak diambil: yang dibutuhkan halaman provinsi cukup rekap. Skor komponen (IKS/IKE/IKL) per desa belum.',
        'DKI Jakarta tidak ada di rekap (tidak punya desa, hanya kelurahan): 37 dari 38 provinsi wilayah.json.',
        'Tidak ada variabel energi/listrik per desa di rekap; kaitan ke energi lewat desa_listrik.json (panen C).',
      ],
    },
  });
  console.log('desa_energi:', baris.length, 'provinsi');
})().catch(e => { console.error(e.message); process.exit(1); });
