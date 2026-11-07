/* Tautan entitas bersama: tautProyek, tautOrg, tautOrang, tautRegulasi, tautProvinsi, tautTeknologi, tautProgram, tautEvent, tautDokumen.
   Semua sinkron dan mengembalikan HTML. Indeks nama->id dimuat malas dari /data/*.json; selama belum siap, fungsi mengembalikan
   <span data-taut-j data-taut-k> berisi teks polos, lalu dinaikkan jadi <a> begitu indeks datang. Tak cocok = teks polos (di-escape).
   Rute: /p/<id>, /o/<id>, orang -> /o/<organisasi>, /regulasi?id=, /wilayah/<kode>, /teknologi/<kode>, /program/<kode>, /event/<slug>, /pustaka?id=.
   hubungan(jenis, id) memberi entitas yang tersambung lewat id silang di data (dipakai panel Terkait di inti/komponen.js). */
import { t, ada } from "/i18n.js";
import { esc } from "/inti/umum.js";
import { PROV } from "/penerbit.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { namaProyek } from "/inti/nama_proyek.js";
export { tautkanOrg } from "/inti/tautan_org.js";

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
export const TEKNOLOGI = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"];
const SUMBER = { proyek: "proyek", org: "organisasi", orang: "orang", regulasi: "regulasi", event: "kalender", dokumen: "pustaka", program: "program", siaran: "siaran_pers", berita: "berita" };
const RUTE = { proyek: (k) => "/p/" + k, org: (k) => "/o/" + k, regulasi: (k) => "/regulasi?id=" + encodeURIComponent(k), provinsi: (k) => "/wilayah/" + k, teknologi: (k) => "/teknologi/" + k, program: (k) => "/program/" + k, event: (k) => "/event/" + k, dokumen: (k) => "/pustaka?id=" + encodeURIComponent(k), siaran: (k) => "/siaran-pers/" + k };

/* ---------- indeks malas ---------- */
const data = {}; // jenis -> Promise<json>
const idx = {}; // jenis -> { byId: Map(id -> rekam), byNama: Map(norm -> id) }
const muatJson = (j) => (data[j] ??= fetch(`/data/${SUMBER[j]}.json`).then((r) => r.json()).catch(() => { delete data[j]; return { baris: [] }; }));
const rekam = {
  proyek: (b) => ({ id: b.id, nama: namaProyek(b), lain: [b.nama, ...(b.nama_lain || [])] }),
  org: (b) => ({ id: b.id, nama: b.nama, lain: [b.nama, b.singkatan, ...(b.nama_lain || [])], logo: b.logo }),
  orang: (b) => ({ id: b.id, nama: [b.gelar, b.nama].filter(Boolean).join(" "), lain: [b.nama], org: b.organisasi_id }),
  regulasi: (b) => ({ id: b.id, nama: b.judul, lain: [] }),
  event: (b) => ({ id: b.slug, nama: b.judul, lain: [], ada: !!b.slug }),
  dokumen: (b) => ({ id: b.id, nama: b.judul, lain: [] }),
  program: (b) => ({ id: b.id, nama: b.nama, lain: [b.nama] }),
  siaran: (b) => ({ id: b.id, nama: b.judul, lain: [] }),
  berita: (b) => ({ id: b.id, nama: b.judul, lain: [] }),
};
export function siapTautan(...jenis) {
  return Promise.all(jenis.map((j) => idx[j] ? 0 : muatJson(j).then((d) => {
    if (idx[j]) return;
    const byId = new Map(), byNama = new Map(), amb = new Set();
    for (const b of d.baris || []) {
      const r = rekam[j](b);
      if (r.ada === false) continue;
      byId.set(r.id, r);
      for (const n of r.lain) { const k = norm(n); if (k.length < 3) continue; if (byNama.has(k) && byNama.get(k) !== r.id) amb.add(k); else byNama.set(k, r.id); }
    }
    for (const k of amb) byNama.delete(k);
    idx[j] = { byId, byNama };
  })));
}
const cari = (j, kunci) => { const x = idx[j]; if (!x) return undefined; const s = String(kunci ?? ""); return x.byId.get(s) ?? x.byId.get(x.byNama.get(norm(s))) ?? null; };

/* ---------- provinsi dan teknologi: tanpa fetch ---------- */
const KODE_PROV = new Set(Object.values(PROV).map((k) => String(k)));
const NAMA_PROV = new Map(Object.entries(PROV).map(([n, k]) => [String(k), n]));
export const kodeProvinsi = (v) => { const s = String(v ?? "").trim(); return KODE_PROV.has(s) ? s : PROV[s.toLowerCase()] != null ? String(PROV[s.toLowerCase()]) : null; };
export const namaProvinsiKode = (k) => NAMA_PROV.get(String(k))?.replace(/\b[a-z]/g, (c) => c.toUpperCase()) ?? String(k);

/* ---------- penggambar ---------- */
const ikonKecil = (j, r, kunci) => {
  if (j === "org" && r?.logo) return `<img class="jm-taut-lb" src="${esc(r.logo)}" alt="" width="16" height="16" loading="lazy" decoding="async" onerror="this.remove()">`;
  if (j === "provinsi") return `<img class="jm-taut-lb" src="/img/provinsi/${esc(kunci)}.png" alt="" width="16" height="16" loading="lazy" decoding="async" onerror="this.remove()">`;
  if (j === "teknologi" && IKON_TEK[kunci]) return `<span class="jm-taut-ik">${IKON_TEK[kunci]}</span>`;
  return "";
};
const anyam = (j, href, teks, r, kunci) => `<a class="jm-taut jm-taut-${j}" href="${esc(href)}">${ikonKecil(j, r, kunci)}<span>${esc(teks)}</span></a>`;
const tunda = (j, kunci, teks) => `<span data-taut-j="${j}" data-taut-k="${esc(kunci)}">${esc(teks ?? "")}</span>`;
export function bangun(j, kunci, teks) {
  if (j === "provinsi") {
    const k = kodeProvinsi(kunci);
    return k ? anyam(j, RUTE.provinsi(k), teks ?? namaProvinsiKode(k), null, k) : esc(teks ?? kunci);
  }
  if (j === "teknologi") {
    const k = String(kunci ?? "").trim();
    return TEKNOLOGI.includes(k) ? anyam(j, RUTE.teknologi(k), teks ?? (ada("pj.tek." + k) ? t("pj.tek." + k) : k), null, k) : esc(teks ?? kunci);
  }
  const r = cari(j, kunci);
  if (r === undefined) { siapTautan(j).then(naikkan); return tunda(j, kunci, teks ?? ""); }
  if (!r) return esc(teks ?? kunci);
  if (j === "orang") return r.org ? anyam(j, "/o/" + r.org, teks ?? r.nama, null) : esc(teks ?? r.nama);
  return anyam(j, RUTE[j](r.id), teks ?? r.nama, r, r.id);
}
/** Naikkan semua span penanda jadi tautan begitu indeksnya siap. */
export function naikkan(akar = document) {
  for (const e of akar.querySelectorAll("span[data-taut-j]")) {
    const j = e.dataset.tautJ;
    if (j !== "provinsi" && j !== "teknologi" && !idx[j]) continue;
    const h = bangun(j, e.dataset.tautK, e.textContent || undefined);
    if (h.startsWith("<a")) e.outerHTML = h; else if (!h.startsWith("<span")) e.removeAttribute("data-taut-j");
  }
}
export const tautProyek = (v, teks) => bangun("proyek", v, teks);
export const tautOrg = (v, teks) => bangun("org", v, teks);
export const tautOrang = (id, teks) => bangun("orang", id, teks);
export const tautRegulasi = (id, teks) => bangun("regulasi", id, teks);
export const tautProvinsi = (v, teks) => bangun("provinsi", v, teks);
export const tautTeknologi = (kode, teks) => bangun("teknologi", kode, teks);
export const tautProgram = (kode, teks) => bangun("program", kode, teks);
export const tautEvent = (id, teks) => bangun("event", id, teks);
export const tautDokumen = (id, teks) => bangun("dokumen", id, teks);
export const tautSiaran = (id, teks) => bangun("siaran", id, teks);

/* ---------- graf hubungan dari id silang di data ---------- */
let graf = null;
const NAMA_BERITA = (b) => ({ id: b.id, nama: b.judul, url: b.url, media: b.media });
async function bangunGraf() {
  const J = ["proyek", "org", "orang", "regulasi", "berita", "event", "dokumen", "siaran", "program"];
  const D = Object.fromEntries(await Promise.all(J.map(async (j) => [j, (await muatJson(j)).baris || []])));
  await siapTautan("org");
  const e = new Map(); // "j:id" -> Map("j2:id2" -> {j, id})
  const sisi = (a, ja, b, jb, r) => {
    if (!a || !b || (ja === jb && a === b)) return;
    for (const [x, jx, y, jy] of [[a, ja, b, jb], [b, jb, a, ja]]) { const k = jx + ":" + x; if (!e.has(k)) e.set(k, new Map()); const m = e.get(k), kk = jy + ":" + y; m.set(kk, { j: jy, id: y, r: r ?? m.get(kk)?.r }); }
  };
  const orgIdx = idx.org;
  const orgNama = (n) => (n ? orgIdx.byNama.get(norm(n)) : null);
  const prov = (n) => kodeProvinsi(n);
  const adaProy = new Set(D.proyek.map((p) => p.id));
  for (const p of D.proyek) {
    for (const [peran, daftar] of Object.entries(p.pihak || {})) for (const a of daftar || []) if (a?.organisasi_id) sisi(p.id, "proyek", a.organisasi_id, "org", peran);
    sisi(p.id, "proyek", prov(p.lokasi?.provinsi), "provinsi");
    sisi(p.id, "proyek", p.teknologi, "teknologi");
    for (const g of p.program_ids || []) sisi(p.id, "proyek", g, "program");
    for (const g of p.regulasi_ids || []) sisi(p.id, "proyek", g, "regulasi");
    for (const g of p.berita_ids || []) sisi(p.id, "proyek", g, "berita");
  }
  for (const o of D.org) {
    for (const g of o.proyek_ids || []) if (adaProy.has(g)) sisi(o.id, "org", g, "proyek");
    for (const k of o.keanggotaan || []) sisi(o.id, "org", k.organisasi_id, "org");
    for (const k of o.anggota || []) sisi(o.id, "org", k.organisasi_id, "org");
    sisi(o.id, "org", orgNama(o.induk), "org");
    sisi(o.id, "org", prov(o.lokasi?.provinsi), "provinsi");
    for (const g of o.berita_ids || []) sisi(o.id, "org", g, "berita");
    for (const p of o.pengurus || []) sisi(o.id, "org", p.orang_id, "orang");
    for (const k of o.kepakaran || []) sisi(o.id, "org", k, "teknologi");
  }
  for (const o of D.orang) sisi(o.id, "orang", o.organisasi_id, "org");
  for (const r of D.regulasi) {
    for (const k of r.ikatan || []) sisi(r.id, "regulasi", k.ke, "regulasi");
    for (const k of r.diikat_oleh || []) sisi(r.id, "regulasi", k.dari, "regulasi");
    for (const g of r.program_ids || []) sisi(r.id, "regulasi", g, "program");
    for (const g of r.proyek_ids || []) sisi(r.id, "regulasi", g, "proyek");
    sisi(r.id, "regulasi", orgNama(r.instansi_penerbit), "org");
  }
  for (const g of D.program) {
    for (const k of g.regulasi_ids || []) sisi(g.id, "program", k, "regulasi");
    for (const k of g.proyek_ids || []) sisi(g.id, "program", k, "proyek");
  }
  for (const b of D.berita) {
    for (const k of b.organisasi_ids || []) sisi(b.id, "berita", k, "org");
    for (const k of b.proyek_ids || []) sisi(b.id, "berita", k, "proyek");
    for (const k of b.regulasi_ids || []) sisi(b.id, "berita", k, "regulasi");
    for (const k of b.orang_ids || []) sisi(b.id, "berita", k, "orang");
    for (const w of b.wilayah || []) sisi(b.id, "berita", prov(w.prov), "provinsi");
    for (const k of b.kepakaran || []) sisi(b.id, "berita", k, "teknologi");
  }
  for (const k of D.event) {
    if (!k.slug) continue;
    for (const g of k.organisasi_ids || []) sisi(k.slug, "event", g, "org");
    sisi(k.slug, "event", k.regulasi_id, "regulasi");
    for (const n of k.penyelenggara || []) sisi(k.slug, "event", orgNama(n), "org");
    for (const g of k.organisasi_ids || []) sisi(k.slug, "event", g, "org");
  }
  for (const s of D.siaran) {
    for (const k of s.org_ids || []) sisi(s.id, "siaran", k, "org");
    for (const k of s.proyek_ids || []) sisi(s.id, "siaran", k, "proyek");
    for (const k of s.regulasi_ids || []) sisi(s.id, "siaran", k, "regulasi");
  }
  const slugEvent = new Map(D.event.filter((k) => k.slug).map((k) => [k.id, k.slug]));
  for (const d of D.dokumen) {
    for (const g of d.program || []) sisi(d.id, "dokumen", g, "program");
    sisi(d.id, "dokumen", d.regulasi_id, "regulasi");
    sisi(d.id, "dokumen", orgNama(d.penerbit), "org");
    if (d.acara && slugEvent.has(d.acara)) sisi(d.id, "dokumen", slugEvent.get(d.acara), "event");
    for (const k of d.kepakaran || []) sisi(d.id, "dokumen", k, "teknologi");
  }
  return { e, berita: new Map(D.berita.map((b) => [b.id, NAMA_BERITA(b)])), D };
}
/** Entitas tersambung untuk satu entitas: { proyek:[id], org:[id], orang, regulasi, berita:[{id,nama,url,media}], event, dokumen, siaran, program, provinsi, teknologi }. */
export async function hubungan(jenis, id) {
  graf ??= bangunGraf().catch(() => { graf = null; return null; });
  const g = await graf;
  const out = {};
  if (!g) return out;
  for (const { j, id: x } of (g.e.get(jenis + ":" + id) || new Map()).values()) (out[j] ||= []).push(j === "berita" ? g.berita.get(x) : x);
  if (out.berita) out.berita = out.berita.filter(Boolean);
  await siapTautan(...Object.keys(out).filter((j) => SUMBER[j] && j !== "berita"));
  return out;
}

/** Sumber tunggal graf jejaring: simpul (organisasi, pendana, proyek, provinsi, regulasi, orang) dan sisi dari graf yang sama dengan panel Terkait. */
const SISI_JEJARING = new Set(["org:proyek", "proyek:provinsi", "proyek:regulasi", "org:regulasi", "org:orang", "org:provinsi"]);
export async function grafJejaring() {
  graf ??= bangunGraf().catch(() => { graf = null; return null; });
  const g = await graf;
  if (!g) return { simpul: [], sisi: [] };
  const { D } = g;
  const pendana = (o) => ["keuangan", "donor"].includes(o.kategori?.kode) || (o.peran_rantai || []).includes("pembiaya");
  const simpul = new Map(), kunci = new Map(); // kunci: "org:id" (kunci graf) -> kunci simpul
  const tambah = (j, jg, id, nama, extra = {}) => { simpul.set(j + ":" + id, { k: j + ":" + id, j, id, nama, ...extra }); kunci.set(jg + ":" + id, j + ":" + id); };
  for (const o of D.org) tambah(pendana(o) ? "pendana" : "org", "org", o.id, o.nama, { logo: o.logo, info: o.kategori?.label });
  for (const p of D.proyek) tambah("proyek", "proyek", p.id, namaProyek(p), { info: p.teknologi });
  for (const r of D.regulasi) tambah("regulasi", "regulasi", r.id, r.judul, { info: [r.jenis, r.nomor, r.tahun].filter(Boolean).join(" ") });
  for (const o of D.orang) if (o.organisasi_id) tambah("orang", "orang", o.id, [o.gelar, o.nama].filter(Boolean).join(" "), { info: o.jabatan_terkini });
  for (const k of KODE_PROV) tambah("provinsi", "provinsi", k, namaProvinsiKode(k));
  const lihat = new Set(), sisi = [];
  for (const [a, m] of g.e) {
    for (const [b, v] of m) {
      const ja = a.split(":")[0], jb = b.split(":")[0];
      if (!SISI_JEJARING.has(ja + ":" + jb)) continue;
      const x = kunci.get(a), y = kunci.get(b);
      if (!x || !y) continue;
      const u = [a, b].sort().join("|");
      if (lihat.has(u)) continue;
      lihat.add(u); sisi.push({ a: x, b: y, r: v.r });
    }
  }
  return { simpul: [...simpul.values()], sisi };
}
