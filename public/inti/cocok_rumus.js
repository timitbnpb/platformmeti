/* cocok_rumus.js (F65-209): skor pencocokan bisnis antar organisasi. Murni (tanpa DOM, tanpa fetch), dipakai /saya dan uji.
   Hanya dari data yang sudah ada: organisasi.json (kepakaran, peran_rantai, kategori, lokasi), proyek.json (pihak, kapasitas, status, lokasi), tkdn_produk.json (pabrikan).
   Empat komponen, bobot SAMA rata dan terbuka di layar: teknologi, wilayah, ukuran proyek, tahap. Komponen yang datanya tidak ada di salah satu sisi
   dikeluarkan dan rata-rata dihitung dari komponen yang ada (aturan yang sama dengan skor prioritas dedieselisasi). Tanpa kecocokan teknologi, pasangan tidak tampil.
   Skor adalah Hipotesis: ukuran kemiripan data, bukan penilaian kelayakan atau rekomendasi. */

export const PERAN_COCOK = ["pembiaya", "epc", "pemasok", "pengembang"];
export const KOMPONEN_COCOK = ["teknologi", "wilayah", "ukuran", "tahap"];
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"];
const ada = (v) => typeof v === "number" && Number.isFinite(v);
const median = (l) => { const s = [...l].sort((a, b) => a - b), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };

/** Peran sebuah organisasi, hanya dari kolom yang ada: peran_rantai, kategori.kode, dan sertifikat TKDN (pabrikan = pemasok). */
export function peranOrg(o, pabrikan = new Set()) {
  const r = new Set(o?.peran_rantai || []), k = o?.kategori?.kode, p = [];
  if (r.has("pendana") || r.has("pembiaya") || k === "keuangan" || k === "donor") p.push("pembiaya");
  if (r.has("EPC")) p.push("epc");
  if (r.has("pemasok") || r.has("manufaktur") || pabrikan.has(o?.id)) p.push("pemasok");
  if (r.has("pengembang") || r.has("IPP")) p.push("pengembang");
  return p;
}

/** Indeks proyek per organisasi: { idOrg: { prov: Set, mw: [..], tahap: Set } } dari pihak proyek dan proyek_ids. */
export function indeksProyek(proyek, organisasi = []) {
  const ix = new Map(), ke = (id) => { if (!ix.has(id)) ix.set(id, { prov: new Set(), mw: [], tahap: new Set() }); return ix.get(id); };
  const milik = new Map();
  for (const o of organisasi) for (const pid of o.proyek_ids || []) { if (!milik.has(pid)) milik.set(pid, new Set()); milik.get(pid).add(o.id); }
  for (const p of proyek) {
    const ids = new Set(milik.get(p.id) || []);
    for (const x of Object.values(p.pihak || {}).flat()) if (x?.organisasi_id) ids.add(x.organisasi_id);
    if (!ids.size) continue;
    const mw = (p.kapasitas || []).find((k) => /^MWp?$/i.test(k.satuan))?.nilai, st = p.status?.[0]?.nilai, prov = p.lokasi?.provinsi;
    for (const id of ids) { const e = ke(id); if (prov) e.prov.add(prov); if (ada(mw) && mw > 0) e.mw.push(mw); if (st) e.tahap.add(st); }
  }
  return ix;
}

/** Ciri satu organisasi untuk dicocokkan. Nilai kosong = null (komponennya dikeluarkan), tidak pernah diisi tebakan. */
export function ciriOrg(o, ix = new Map()) {
  const e = ix.get(o.id), prov = new Set(e?.prov || []);
  if (o.lokasi?.provinsi) prov.add(o.lokasi.provinsi);
  return { id: o.id, tek: (o.kepakaran || []).filter((k) => TEK.includes(k)), prov: prov.size ? prov : null, mw: e?.mw.length ? median(e.mw) : null, tahap: e?.tahap.size ? e.tahap : null };
}

/** Skor A terhadap B: { skor 0..100, komponen: {teknologi, wilayah, ukuran, tahap} (0..1 atau null), sama: {tek: [...], prov: [...]} }, atau null bila tanpa teknologi yang sama. */
export function skorCocok(a, b) {
  const tek = a.tek.filter((k) => b.tek.includes(k));
  if (!a.tek.length || !tek.length) return null;
  const prov = a.prov && b.prov ? [...a.prov].filter((p) => b.prov.has(p)) : null;
  const komponen = {
    teknologi: tek.length / a.tek.length,
    wilayah: prov ? (prov.length ? 1 : 0) : null,
    ukuran: ada(a.mw) && ada(b.mw) ? Math.min(a.mw, b.mw) / Math.max(a.mw, b.mw) : null,
    tahap: a.tahap && b.tahap ? ([...a.tahap].some((s) => b.tahap.has(s)) ? 1 : 0) : null,
  };
  const isi = KOMPONEN_COCOK.map((k) => komponen[k]).filter((v) => v != null);
  return { skor: Math.round((isi.reduce((s, v) => s + v, 0) / isi.length) * 100), komponen, terhitung: isi.length, sama: { tek, prov: prov || [] } };
}

/** Daftar pasangan untuk satu organisasi dan satu peran tujuan. Urutan seri: skor, jumlah komponen terhitung (kelengkapan data), nama. */
export function cocokUntuk(org, semua, peran, { ix = new Map(), pabrikan = new Set() } = {}) {
  if (!org || !PERAN_COCOK.includes(peran)) return [];
  const a = ciriOrg(org, ix);
  return semua.filter((o) => o.id !== org.id && peranOrg(o, pabrikan).includes(peran))
    .map((o) => ({ o, ...(skorCocok(a, ciriOrg(o, ix)) || { skor: null }) }))
    .filter((r) => r.skor != null)
    .sort((x, y) => y.skor - x.skor || y.terhitung - x.terhitung || x.o.nama.localeCompare(y.o.nama, "id"));
}
