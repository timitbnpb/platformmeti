// Keandalan sistem listrik: neraca daya per sistem (RUPTL PLN 2025-2034, skenario RE Base) + SAIDI/SAIFI nasional + susut.
// Sumber PDF lokal data-panen/pdf (sudah diunduh sopan oleh panen RUPTL/Statistik). Pakai: node scripts/panen/keandalan_ruptl.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const pdfTeks = (f) => execFileSync('pdftotext', ['-layout', path.join(AKAR, 'data-panen/pdf', f), '-'], { encoding: 'utf-8', maxBuffer: 1 << 28 }).split('\n');
const URL_RUPTL = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf';
const URL_STAT = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf';

// Pemetaan sistem RUPTL ke provinsi (RUPTL 2025 bab 5: Sulbagut = Sulut + Gorontalo + sebagian Sulteng; sistem kecil Papua per kota utama).
export const SISTEM = [
  { id: 'sumatera', tabel: '5.82', nama: 'Sumatera-Bangka', prov: ['11', '12', '13', '14', '15', '16', '17', '18', '19'] },
  { id: 'jawabali', tabel: '5.86', nama: 'Jawa-Bali', prov: ['31', '32', '33', '34', '35', '36', '51'] },
  { id: 'kalbar', tabel: '5.91', nama: 'Kalimantan Barat', prov: ['61'] },
  { id: 'kalseltengtimra', tabel: '5.93', nama: 'Kalseltengtimra', prov: ['62', '63', '64', '65'] },
  { id: 'sulbagut', tabel: '5.97', nama: 'Sulbagut', prov: ['71', '72', '75'] },
  { id: 'sulbagsel', tabel: '5.99', nama: 'Sulbagsel', prov: ['73', '74', '76'] },
  { id: 'ambon', tabel: '5.104', nama: 'Ambon', prov: ['81'] },
  { id: 'halmahera', tabel: '5.106', nama: 'Halmahera', prov: ['82'] },
  { id: 'jayapura', tabel: '5.108', nama: 'Jayapura', prov: ['91'] },
  { id: 'merauke', tabel: '5.110', nama: 'Merauke', prov: ['93'] },
  { id: 'nabire', tabel: '5.112', nama: 'Nabire', prov: ['94'] },
  { id: 'wamena', tabel: '5.114', nama: 'Wamena', prov: ['95'] },
  { id: 'manokwari', tabel: '5.116', nama: 'Manokwari', prov: ['92'] },
  { id: 'sorong', tabel: '5.118', nama: 'Sorong', prov: ['96'] },
  { id: 'lombok', tabel: '5.120', nama: 'Lombok', prov: ['52'] },
  { id: 'timor', tabel: '5.122', nama: 'Timor', prov: ['53'] },
];
const ang = (t) => (t === '-' ? 0 : Number(t.replace('%', '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')));
const deret = (baris, re, syarat = () => true) => {
  const b = baris.find((x) => re.test(x) && syarat(x));
  if (!b) return null;
  const tok = b.trim().split(/\s+/).filter((x) => /^(-|-?[\d.]+(,\d+)?%?)$/.test(x));
  const v = tok.slice(-10).map(ang);
  return v.length === 10 && v.every(Number.isFinite) ? v : null;
};

export function bangun() {
  const rt = pdfTeks('ruptl-2025-2034.pdf');
  const kepala = (n) => rt.findIndex((l, i) => i > 5000 && new RegExp(`^\\s*Tabel ${n.replace('.', '\\.')}\\s+Neraca Daya`).test(l));
  const sistem = SISTEM.map((s) => {
    const i = kepala(s.tabel);
    let j = i + 1;
    while (j < rt.length && !/^\s*Tabel 5\.\d+/.test(rt[j])) j++;
    const blk = rt.slice(i, j);
    const rm = deret(blk, /Reserve Margin\s+%/), bp = deret(blk, /Beban Puncak Neto\s+MW/), ebt = deret(blk, /Pembangkit EBT\s+MW/);
    if (!rm || !bp || !ebt) throw new Error('gagal urai ' + s.id);
    return { ...s, tahun_awal: 2025, rm_persen: rm, beban_puncak_neto_mw: bp, ebt_dmn_mw: ebt };
  });
  const dmnRuptl = JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data/ruptl.json'), 'utf-8')).baris;
  const nama = new Map(JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data/wilayah.json'), 'utf-8')).baris.map((b) => [b.nama, b.kode]));
  for (const s of sistem) s.penyimpanan_ruptl_mw = Math.round(dmnRuptl.filter((r) => r.teknologi === 'penyimpanan' && s.prov.includes(nama.get(r.provinsi))).reduce((a, r) => a + (r.kapasitas_mw || 0), 0));
  // SAIDI/SAIFI nasional: RUPTL Tabel 4.51 (2015-2019) + Statistik 2024 Tabel 47 (2020-2024)
  const st = pdfTeks('statistik-ketenagalistrikan-2024.pdf');
  const t47 = st.slice(st.findIndex((l, i) => i > 1000 && /^\f?Tabel 47\b(?!\.)/.test(l)), st.findIndex((l, i) => i > 1000 && /^\f?Tabel 48\b(?!\.)/.test(l)));
  const saidi = {};
  for (const l of t47) { const m = l.match(/^\s*(20\d\d)\s+([\d,]+)\s+([\d,]+)\s*$/) || l.match(/\b(20\d\d)\s+([\d,]+)\s+([\d,]+)\s*(?:$|\s{2,})/); if (m) saidi[m[1]] = { saidi_jam: ang(m[2]), saifi_kali: ang(m[3]) }; }
  const r451 = rt.findIndex((l) => /Tabel 4\.51 Realisasi SAIDI/.test(l) && /^\s+Tabel/.test(l));
  const baris10 = rt.slice(r451, r451 + 10).map((l) => l.trim().split(/\s+/)).filter((t) => t.length === 10 && t.every((x) => /^[\d,]+$/.test(x))).map((t) => t.map(ang));
  const [sd, sf] = baris10; // baris pertama SAIDI, kedua SAIFI
  if (!sd || !sf) throw new Error('Tabel 4.51 tak terurai');
  const tren = [];
  for (let k = 0; k < 5; k++) tren.push({ tahun: 2015 + k, saidi_jam: sd[k], saifi_kali: sf[k], sumber: 'ruptl' });
  for (const y of ['2020', '2021', '2022', '2023', '2024']) tren.push({ tahun: Number(y), ...saidi[y], sumber: 'statistik' });
  if (tren.length !== 10 || tren.some((x) => !(x.saidi_jam > 0))) throw new Error('SAIDI tak terurai ' + JSON.stringify(tren));
  const susut = [];
  const i46 = st.findIndex((l) => /^\f?Tabel 46\s*$/.test(l));
  for (const l of st.slice(i46, i46 + 25)) { const m = l.match(/^\s*(20\d\d)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s*$/); if (m) susut.push({ tahun: Number(m[1]), transmisi: ang(m[2]), distribusi: ang(m[3]), jumlah: ang(m[4]) }); }
  if (susut.length !== 5) throw new Error('susut tak terurai');
  return {
    lapis: 'publik', dibangun_pada: new Date().toISOString().slice(0, 10), tahun_neraca: 2025,
    sumber: [
      { id: 'ruptl', judul: 'RUPTL PT PLN (Persero) 2025-2034, Bab V neraca daya skenario RE Base (Tabel 5.82-5.122) dan Tabel 4.51', penerbit: 'PT PLN (Persero); Kementerian ESDM', tahun: 2025, url: URL_RUPTL, tingkat_bukti: 'resmi' },
      { id: 'stat', judul: 'Statistik Ketenagalistrikan 2024 (Tabel 46 susut, Tabel 47 SAIDI dan SAIFI)', penerbit: 'Ditjen Ketenagalistrikan, Kementerian ESDM', tahun: 2024, url: URL_STAT, tingkat_bukti: 'situs-sendiri' },
    ],
    ambang_penyimpanan: { rm_persen_maks: 35, ebt_rasio_persen_min: 50 }, tren_nasional: tren, susut_nasional: susut, sistem,
    celah: [
      'SAIDI dan SAIFI per wilayah atau UID PLN tidak terbit sebagai berkas terbuka yang dapat dipanen (Statistik ESDM dan RUPTL hanya memuat angka nasional; web.pln.co.id tidak dapat diakses dari lingkungan panen). Tidak diisi, tidak dikarang.',
      'Curtailment atau pembatasan EBT: tidak ada angka bersumber di repo (berita yang dipanen tidak memuatnya). Tidak diisi.',
      'Pemetaan sistem ke provinsi mengikuti uraian RUPTL; Sulawesi Tengah hanya sebagian ke Sulbagut, Kepulauan Riau (sistem Batam) tidak punya neraca di RUPTL ini.',
      'Pembangkit EBT pada neraca daya mencakup hidro dan panas bumi (daya mampu), bukan hanya EBT variabel; rasio EBT terhadap beban puncak adalah pendekatan Hipotesis.',
    ],
  };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const o = bangun();
  fs.writeFileSync(path.join(AKAR, 'public/data/keandalan.json'), JSON.stringify(o) + '\n');
  console.log('keandalan:', o.sistem.length, 'sistem', o.tren_nasional.length, 'tahun');
}
