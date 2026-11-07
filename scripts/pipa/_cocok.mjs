// Pencocokan nama ke public/data/proyek.json dan organisasi.json. Hanya mengusulkan; tidak menggabung otomatis (ranjau R11 3.10).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export function dirData() { // repo asli lewat env META_DATA, atau public/data di sebelah skrip
  const c = [process.env.META_DATA, path.join(HERE, '../../public/data')].filter(Boolean);
  return c.find((d) => fs.existsSync(path.join(d, 'proyek.json')));
}
export const muat = (n) => JSON.parse(fs.readFileSync(path.join(dirData(), n), 'utf8'));
const PROV_EN = { 'aceh': 'Aceh', 'north sumatra': 'Sumatera Utara', 'north sumatera': 'Sumatera Utara', 'sumatera utara': 'Sumatera Utara', 'west sumatra': 'Sumatera Barat', 'west sumatera': 'Sumatera Barat', 'sumatera barat': 'Sumatera Barat', 'riau': 'Riau', 'riau islands': 'Kepulauan Riau', 'jambi': 'Jambi', 'south sumatra': 'Sumatera Selatan', 'south sumatera': 'Sumatera Selatan', 'sumatera selatan': 'Sumatera Selatan', 'bengkulu': 'Bengkulu', 'lampung': 'Lampung', 'bangka belitung': 'Kepulauan Bangka Belitung', 'banten': 'Banten', 'jakarta': 'DKI Jakarta', 'west java': 'Jawa Barat', 'central java': 'Jawa Tengah', 'east java': 'Jawa Timur', 'yogyakarta': 'DI Yogyakarta', 'bali': 'Bali', 'west nusa tenggara': 'Nusa Tenggara Barat', 'east nusa tenggara': 'Nusa Tenggara Timur', 'west kalimantan': 'Kalimantan Barat', 'central kalimantan': 'Kalimantan Tengah', 'south kalimantan': 'Kalimantan Selatan', 'east kalimantan': 'Kalimantan Timur', 'north kalimantan': 'Kalimantan Utara', 'north sulawesi': 'Sulawesi Utara', 'central sulawesi': 'Sulawesi Tengah', 'south sulawesi': 'Sulawesi Selatan', 'southeast sulawesi': 'Sulawesi Tenggara', 'south-east sulawesi': 'Sulawesi Tenggara', 'gorontalo': 'Gorontalo', 'west sulawesi': 'Sulawesi Barat', 'maluku': 'Maluku', 'north maluku': 'Maluku Utara', 'papua': 'Papua', 'west papua': 'Papua Barat' };
for (const v of [...new Set(Object.values(PROV_EN))]) PROV_EN[v.toLowerCase()] = v; // nama Indonesia (juga huruf kapital: JAWA BARAT)
export function provinsi(teks) { // "West Java Province" / "Sumatera Utara" / "Ujung Batu district, Prov. Riau" -> nama baku atau null
  const t = String(teks ?? '').toLowerCase().replace(/\b(province|provinsi|prov\.?|region|district)\b/g, ' ').replace(/[^a-z\- ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null; if (PROV_EN[t]) return PROV_EN[t];
  const k = Object.keys(PROV_EN).sort((a, b) => b.length - a.length).find((x) => ` ${t} `.includes(` ${x} `)); return k ? PROV_EN[k] : null;
}
const STOP = new Set('pt tbk persero ltd limited pte co the of and dan di project proyek power plant pembangkit listrik tenaga pl plt pltp plta pltb plts pltu pltbm pltmh pltsa pltgu pltd mw kw geothermal hydro hydropower wind solar biogas biomass energy energi unit phase fase tahap ii iii iv indonesia north south west east central utara selatan barat timur tengah province provinsi bpp rpp pp'.split(' '));
export const token = (s) => new Set(String(s ?? '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w) && !/^\d+$/.test(w)));
export function jaccard(a, b) { if (!a.size || !b.size) return 0; let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); }
export const mwDariNama = (s) => { const m = String(s ?? '').match(/(\d+(?:[.,]\d+)?)\s*MW\b/i); return m ? Number(m[1].replace(',', '.')) : null; };
export function indeksProyek(proyek) { return proyek.map((p) => ({ id: p.id, nama: p.nama, t: token(p.nama), prov: p.lokasi?.provinsi ?? null, mw: p.kapasitas?.[0]?.satuan === 'MW' ? p.kapasitas[0].nilai : null, teknologi: p.teknologi })); }
const grup = (t) => (t === 'biomassa-sampah' ? 'bioenergi' : t);
// -> { proyek_id (skor >= 0.6 dan tidak bertentangan), kandidat: [{id,nama,skor}] }
export function cocokProyek(nama, prov, mw, idx, tek = null) {
  const t = token(nama); const hasil = [];
  for (const p of idx) {
    let s = jaccard(t, p.t); if (s === 0) continue;
    if (prov && p.prov && prov !== p.prov) continue; // provinsi bertentangan: bukan kandidat
    if (tek && p.teknologi && grup(tek) !== grup(p.teknologi)) continue;
    const bentrok = mw && p.mw && Math.abs(mw - p.mw) / Math.max(mw, p.mw) > 0.3;
    if (bentrok) s *= 0.5; else if (mw && p.mw) s += 0.1;
    hasil.push({ id: p.id, nama: p.nama, skor: Math.round(s * 100) / 100 });
  }
  hasil.sort((a, b) => b.skor - a.skor || a.id.localeCompare(b.id));
  const atas = hasil[0];
  return { proyek_id: atas && atas.skor >= 0.6 && (!hasil[1] || hasil[1].skor < atas.skor) ? atas.id : null, kandidat: hasil.filter((h) => h.skor >= 0.34).slice(0, 3) };
}
const bersih = (s) => String(s ?? '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\b(pt|tbk|persero|ltd|limited|pte|berhad|sdn|bhd|co|inc|llc|corp|corporation)\b\.?/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
export function indeksOrg(org) { return org.map((o) => ({ id: o.id, nama: o.nama, b: bersih(o.nama), t: token(o.nama) })); }
export function cocokOrg(nama, idx) { // eksak pada nama bersih, atau Jaccard >= 0.8 tanpa pesaing seimbang
  const b = bersih(nama); if (!b) return null; const ex = idx.filter((o) => o.b === b); if (ex.length === 1) return { id: ex[0].id, nama: ex[0].nama, skor: 1 };
  if (ex.length > 1) return null;
  const t = token(nama); const h = idx.map((o) => ({ id: o.id, nama: o.nama, skor: jaccard(t, o.t) })).filter((x) => x.skor >= 0.8).sort((a, b2) => b2.skor - a.skor);
  return h.length === 1 || (h.length > 1 && h[0].skor > h[1].skor) ? h[0] : null;
}
