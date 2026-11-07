#!/usr/bin/env node
// Mesin video EBET: YouTube Data API v3 (search.list 100 unit, videos.list 1 unit per 50) -> data-panen/video/video.jsonl.
//   node scripts/panen/video.mjs          panen; kunci dari env YOUTUBE_API_KEY atau .dev.vars; tanpa kunci keluar 0 diam-diam
//   node scripts/panen/video.mjs --uji    baca tests/fixture/video/*.json, tanpa jaringan, tanpa menulis
// Kuota: dihitung di data-panen/video/kuota.json, berhenti di 3.000 unit/hari. Disimpan: judul, kanal, tautan, statistik; tanpa deskripsi.
// Port dari poskokarhutla scripts/umum/video.py; ponytail: satu halaman terbaru per kueri, tanpa jendela terpopuler 30/90 hari.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const BATAS_UNIT = 3000;
const SEARCH = 100, HARI = 90;
export const R_BUANG = /game|minecraft|free fire|mobile legends|lirik|karaoke|vtuber|anime|cosplay|asmr|prank|mukbang|jedag|windah|film pendek|ost\b/i;
export const R_RESMI = /esdm|ebtke|kementerian|dewan energi|\bden\b|\bpln\b|\bmeti\b|masyarakat energi terbarukan|sekretariat presiden|bappenas|bumn|pertamina|pemprov|pemkab|pemkot|^dinas |humas|bssn|brin|komdigi/i;
export const R_MEDIA = /tv|news|kompas|detik|tribun|cnn|cnbc|bbc|antara|tempo|liputan|metro|berita|post|republika|viva|okezone|merdeka|sindo|jpnn|inews|bisnis|kontan/i;

export const KUERI = ['PLTS energi surya Indonesia', 'energi terbarukan Indonesia', 'panas bumi PLTP Indonesia', 'PLTA PLTMH tenaga air',
  'bioenergi biodiesel bioetanol', 'transisi energi Indonesia', 'hidrogen hijau Indonesia', 'kendaraan listrik baterai Indonesia',
  'pasar karbon bursa karbon', 'RUPTL EBT PLN', 'Masyarakat Energi Terbarukan Indonesia METI', 'Kementerian ESDM EBTKE'];

export const durasi = (iso) => { const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || ''); return m ? [86400, 3600, 60, 1].reduce((a, k, i) => a + k * +(m[i + 1] || 0), 0) : null; };
export const jenis = (kanal) => R_RESMI.test(kanal) ? 'resmi' : R_MEDIA.test(kanal) ? 'media' : 'kreator';
const kataKunci = (q) => q.split(/\s+/).filter((k) => k.length > 3 && !/^(indonesia|energi)$/i.test(k));
// Judul/deskripsi harus memuat salah satu kata kunci kueri (batas kata); judul minimal 3 kata bermakna dan bukan hiburan.
export function relevan(q, judul, desk = '') {
  const re = new RegExp('\\b(' + kataKunci(q).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'i');
  const kata = judul.replace(/#\w+|\d+|[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  return re.test(`${judul} ${desk}`) && !R_BUANG.test(judul) && kata.length >= 3;
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"' };
const lepas = (s = '') => s.replace(/&(#39|amp|lt|gt|quot);/g, (m, e) => e === '#39' ? "'" : ENT[e]);

export function ringkas(item, kueri, tanggal_ambil) {
  const s = item.snippet, id = item.id.videoId;
  const kanal = lepas(s.channelTitle || '');
  return { video_id: id, judul: lepas(s.title), kanal, jenis: jenis(kanal), terbit: s.publishedAt, url: `https://www.youtube.com/watch?v=${id}`, kueri, tanggal_ambil };
}
export function gabungStatistik(v, st) {
  if (!st) return v;
  const s = st.statistics || {}, d = durasi(st.contentDetails?.duration);
  return { ...v, tonton: +s.viewCount || 0, ...(s.likeCount != null && { suka: +s.likeCount }), ...(s.commentCount != null && { komen: +s.commentCount }), durasi_detik: d, pendek: (d ?? 999) <= 60 || /#shorts?\b/i.test(v.judul) };
}
export function muatKunci() {
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY;
  const j = join(AKAR, '.dev.vars');
  if (!existsSync(j)) return '';
  const m = /^\s*YOUTUBE_API_KEY\s*=\s*"?([^"\r\n]+?)"?\s*$/m.exec(readFileSync(j, 'utf-8'));
  return m ? m[1] : '';
}

// Kuota harian dibaca/ditulis di kuota.json; tanggal berasal dari pemanggil (UTC), bukan dari data.
export function kuota(jalur, hari) {
  let k = { tanggal: hari, unit: 0 };
  try { const x = JSON.parse(readFileSync(jalur, 'utf-8')); if (x.tanggal === hari) k = x; } catch { /* belum ada */ }
  return { k, boleh: (n) => k.unit + n <= BATAS_UNIT, pakai: (n) => { k.unit += n; writeFileSync(jalur, JSON.stringify(k)); } };
}

async function api(jalur, p) {
  const r = await fetch(`https://www.googleapis.com/youtube/v3/${jalur}?` + new URLSearchParams(p), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`YouTube ${jalur} ${r.status}`);
  return r.json();
}

async function main() {
  const uji = process.argv.includes('--uji');
  const hari = new Date().toISOString().slice(0, 10);
  const baris = new Map();
  if (uji) {
    const dir = join(AKAR, 'tests/fixture/video');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
      const { kueri, search, videos } = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
      const st = new Map((videos?.items || []).map((x) => [x.id, x]));
      for (const it of search.items) {
        const v = ringkas(it, kueri, hari);
        if (relevan(kueri, v.judul)) baris.set(v.video_id, gabungStatistik(v, st.get(v.video_id)));
      }
    }
  } else {
    const kunci = muatKunci();
    if (!kunci) { console.log('YOUTUBE_API_KEY kosong: video dilewati'); return; }
    const dirKeluar = join(AKAR, 'data-panen/video'); mkdirSync(dirKeluar, { recursive: true });
    const q = kuota(join(dirKeluar, 'kuota.json'), hari);
    const sejak = new Date(Date.now() - HARI * 864e5).toISOString().replace(/\.\d+Z$/, 'Z');
    for (const kueri of KUERI) {
      if (!q.boleh(SEARCH + 1)) { console.log(`kuota ${q.k.unit}/${BATAS_UNIT} unit: berhenti`); break; }
      try {
        q.pakai(SEARCH);
        const j = await api('search', { part: 'snippet', q: kueri, type: 'video', order: 'date', maxResults: '50', regionCode: 'ID', relevanceLanguage: 'id', publishedAfter: sejak, key: kunci });
        const ada = (j.items || []).filter((x) => x.id?.videoId).map((x) => ringkas(x, kueri, hari)).filter((v) => relevan(kueri, v.judul));
        if (!ada.length) continue;
        q.pakai(1);
        const st = new Map(((await api('videos', { part: 'statistics,contentDetails', id: ada.map((v) => v.video_id).join(','), key: kunci })).items || []).map((x) => [x.id, x]));
        for (const v of ada) baris.set(v.video_id, gabungStatistik(v, st.get(v.video_id)));
      } catch (e) { console.error('kueri gagal', kueri, e.message); }
      await new Promise((r) => setTimeout(r, 2100));
    }
    if (!baris.size) { console.log('nol video: berkas lama tidak ditimpa'); return; }
    const jalur = join(dirKeluar, 'video.jsonl');
    writeFileSync(jalur + '.tmp', [...baris.values()].sort((a, b) => b.terbit.localeCompare(a.terbit)).map((v) => JSON.stringify(v)).join('\n') + '\n', 'utf-8');
    renameSync(jalur + '.tmp', jalur);
  }
  console.log(JSON.stringify({ video: baris.size, resmi: [...baris.values()].filter((v) => v.jenis === 'resmi').length }));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => { console.error(e.message); process.exit(1); });
