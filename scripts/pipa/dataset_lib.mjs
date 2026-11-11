// Pembantu bersama keempat dataset (pendanaan_internasional, insentif, obligasi_hijau, tarif_harga).
// Hanya stdlib. Tanggal berasal dari masukan, bukan jam (ilmu pipa butir 13).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Rujukan baca-saja ke repo asal (organisasi.json, proyek.json, regulasi.json) selama repo dipindah.
export const REPO = process.env.META_REPO || ROOT;
export const TGL = process.env.TANGGAL_AMBIL || '2026-11-07';
export const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const TINGKAT = ['resmi', 'media', 'situs-sendiri', 'turunan'];   // turunan: nilai dari rilis resmi lama yang dinyatakan tetap oleh rilis berikutnya (inferensi)

export const baca = (p, akar = REPO) => JSON.parse(fs.readFileSync(path.join(akar, p), 'utf8'));
export const bacaAda = (p, akar = REPO) => (fs.existsSync(path.join(akar, p)) ? baca(p, akar) : null);
export const norm = (s) => String(s || '').toLowerCase().replace(/\b(pt|cv|tbk|persero)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
export const bersihkan = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
export const hariKeIso = (h) => new Date(h * 864e5).toISOString().slice(0, 10);

// Baris tanpa sumber.url, tanggal, tingkat_bukti ditolak dan dihitung (KEPUTUSAN D5).
export function sahBaris(b) {
  return typeof b.sumber_url === 'string' && /^https:\/\//.test(b.sumber_url) && /^\d{4}-\d{2}-\d{2}$/.test(b.tanggal || '') && TINGKAT.includes(b.tingkat_bukti);
}
export function saring(baris) {
  const ok = baris.filter(sahBaris);
  return { ok, ditolak: baris.length - ok.length };
}

// Keluaran deterministik: urut id, kunci tetap, dua kali jalan byte-identik.
export function bungkus({ baris, sumber, celah, ditolak = 0, tambahMeta = {} }) {
  const urut = [...baris].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return { lapis: 'publik', dibangun_pada: TGL, jumlah: urut.length, baris: urut, sumber, meta: { diperbarui: TGL, ditolak_tanpa_sumber: ditolak, ...tambahMeta, celah } };
}
export function tulis(nama, objek, akar = ROOT) {
  const p = path.join(akar, 'public/data', nama + '.json');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(objek) + '\n', 'utf8');
  return p;
}
export const pilihSumber = (semua, baris) => { const pakai = new Set(baris.map((b) => b.sumber_id)); return Object.values(semua).filter((s) => pakai.has(s.id)); };

// Pemeriksaan bentuk yang dipakai ulang oleh keempat uji.
export function periksaBentuk(d, { kunciWajib = [] } = {}) {
  const galat = [];
  if (d.lapis !== 'publik') galat.push('lapis');
  if (!Array.isArray(d.baris) || d.jumlah !== d.baris.length) galat.push('jumlah');
  if (!Array.isArray(d.sumber) || !d.sumber.length) galat.push('blok sumber');
  if (!d.meta || !d.meta.diperbarui || !Array.isArray(d.meta.celah) || !d.meta.celah.length) galat.push('meta');
  const idSumber = new Set((d.sumber || []).map((s) => s.id));
  const ids = new Set();
  for (const b of d.baris || []) {
    if (!sahBaris(b)) galat.push('sumber baris ' + b.id);
    if (ids.has(b.id)) galat.push('id ganda ' + b.id);
    ids.add(b.id);
    if (!idSumber.has(b.sumber_id)) galat.push('sumber_id tak terdaftar ' + b.id);
    for (const k of kunciWajib) if (b[k] === undefined) galat.push(`kunci ${k} hilang ${b.id}`);
    if (/@|\b\+?62\d{8,}\b/.test(JSON.stringify(b).replace(/https?:\/\/[^"]+/g, ''))) galat.push('pola pribadi ' + b.id);
  }
  return galat;
}

// Panen sopan: jeda >= 2 detik, UA jujur, satu percobaan ulang (hanya dipakai bila --ambil).
export const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
export async function ambilJson(url) {
  for (let i = 0; i < 2; i++) {
    await tidur(2000);
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    if (r.status === 403) throw new Error('403: berhenti total ' + url);
    if (r.status === 429) { await tidur(Number(r.headers.get('retry-after') || 30) * 1000); continue; }
    if (r.ok) return r.json();
  }
  throw new Error('gagal ' + url);
}
