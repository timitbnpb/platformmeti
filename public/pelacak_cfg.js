/* /pelacak?tek=<id>: konfigurasi 14 pelacak (FITUR-200 N01-N16). Murni data + saringan; tanpa DOM.
   p = saringan baris proyek.json; kep = kepakaran berita/organisasi; reg = topik regulasi; rb/rr = regex judul berita/regulasi;
   ind = bahan industri lokal (rt = kata komponen di rantai_plts.fasilitas_lain, tkdn = kategori tkdn.json, pt = teknologi penyedia_teknologi.json). */
import { IKON_TEK } from "/inti/ikon_tek.js";

const S = (d) => `<svg class="jm-ikt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
/* tiga ikon milik pelacak (IKON_TEK belum punya): terapung, hibrida, daur ulang */
const IKON_SENDIRI = {
  terapung: S('<circle cx="12" cy="7" r="3"/><path d="M12 1.5v1M5 14h14l-2 4H7zM3 21c2.5-2 4.5 2 7 0s4.5 2 7 0 3-1 4-1"/>'),
  hibrida: S('<circle cx="8" cy="8" r="3"/><path d="M8 2.5v1M2.5 8h1M3.6 3.6l.7.7M12.4 3.6l-.7.7"/><rect x="11" y="12" width="10" height="7" rx="1.5"/><path d="M21 14.5v2M14 14v3M17 14v3"/>'),
  daur: S('<path d="M7 7h8a4 4 0 0 1 3.5 2M17 17H9a4 4 0 0 1-3.5-2M15 4l3 3-3 3M9 20l-3-3 3-3"/>'),
};
export const ikonPelacak = (id) => (IKON_SENDIRI[id] || IKON_TEK[TEK.find((x) => x.id === id)?.ik] || IKON_TEK.jaringan);

const pj = (kod, rx) => (p) => (!kod || p.teknologi === kod) && (!rx || rx.test(p.nama));
export const TEK = [
  { id: "plts-atap", pemilik: true, ik: "surya", warna: "surya", p: pj("surya", /atap|rooftop|komunal/i), kep: "surya", reg: ["surya"], rr: /atap|rooftop/i, rb: /plts atap|atap surya|rooftop|komunal/i, atap: true, tren: ["surya"], ind: { rt: ["modul", "sel", "inverter"], tkdn: ["modul_surya", "inverter"], pt: "surya" } },
  { id: "plts-terapung", pemilik: true, ik: "terapung", warna: "surya", p: pj(null, /terapung|floating/i), kep: "surya", rb: /terapung|floating/i, rr: /terapung/i, waduk: true, ind: { rt: ["modul", "sel", "inverter"], tkdn: ["modul_surya", "inverter"], pt: "surya" } },
  { id: "bayu", ik: "bayu", warna: "bayu", p: pj("bayu"), ruptl: "bayu", kep: "bayu", reg: ["angin"], tren: ["bayu"], ind: { rt: ["turbin", "bilah", "menara"], tkdn: ["turbin"], pt: "angin" } },
  { id: "panas-bumi", ik: "panas-bumi", warna: "panas-bumi", p: pj("panas-bumi"), ruptl: "panas-bumi", kep: "panas-bumi", reg: ["panas_bumi"], wkp: true, tren: ["panas_bumi"], ind: { rt: ["turbin uap"], tkdn: [], pt: "panas bumi" } },
  { id: "plta", ik: "hidro", warna: "hidro", p: pj("hidro"), ruptl: "hidro", kep: "hidro", reg: ["hidro"], tren: ["air"], ind: { rt: ["turbin hidro"], tkdn: [], pt: "hidro" } },
  { id: "bioenergi", ik: "bioenergi", warna: "bioenergi", p: (p) => p.teknologi === "bioenergi" || /co-?firing/i.test(p.nama), ruptl: "bioenergi", kep: "bioenergi", reg: ["bioenergi"], rr: /biomassa|biogas|bahan bakar nabati|biodiesel|bioetanol/i, tren: ["bioenergi_padat", "biogas"], ind: { rt: ["digester", "boiler"], tkdn: [], pt: "biogas/biomassa" } },
  { id: "psel", ik: "biomassa-sampah", warna: "biomassa-sampah", p: pj("biomassa-sampah"), ruptl: "biomassa-sampah", kep: "biomassa-sampah", rr: /sampah|psel|limbah/i, rb: /sampah|psel|waste/i, tren: ["sampah_terbarukan"], ind: { rt: ["insinerator"], tkdn: [], pt: "sampah/wte" } },
  { id: "baterai", ik: "penyimpanan", warna: "penyimpanan", p: pj("penyimpanan"), ruptl: "penyimpanan", kep: "penyimpanan", reg: ["penyimpanan"], ind: { rt: ["baterai", "bess", "katoda"], tkdn: ["baterai"], pt: "baterai/penyimpanan" } },
  { id: "hidrogen", ik: "hidrogen", warna: "hidrogen", p: (p) => /hidrogen|hydrogen|amonia|ammonia/i.test(p.nama), kep: "hidrogen", reg: ["hidrogen"], rb: /hidrogen|amonia|ammonia/i, ind: { rt: ["elektroliser"], tkdn: [], pt: "hidrogen" } },
  { id: "kendaraan-listrik", pemilik: true, ik: "elektrifikasi", warna: "elektrifikasi", p: (p) => /kendaraan listrik|spklu|charging/i.test(p.nama), kep: "elektrifikasi", rb: /kendaraan listrik|spklu|motor listrik|mobil listrik|bus listrik/i, rr: /kendaraan bermotor listrik|spklu|kendaraan listrik/i, ind: { rt: ["baterai"], tkdn: ["baterai"], pt: "kendaraan listrik" } },
  { id: "hibrida", pemilik: true, ik: "hibrida", warna: "jaringan", p: (p) => /hibrid|hybrid/i.test(p.nama), rb: /hibrid|hybrid|plts.*baterai/i, rr: /hibrid/i, ind: { rt: ["inverter", "bess", "baterai"], tkdn: ["inverter", "baterai"], pt: "surya" } },
  { id: "efisiensi", ik: "efisiensi", warna: "efisiensi", p: () => false, kep: "efisiensi", reg: ["efisiensi"], rr: /efisiensi|konservasi energi|hemat energi/i, rb: /efisiensi|hemat energi|label energi/i, ind: null },
  { id: "nuklir", ik: "nuklir", warna: "nuklir", p: pj("nuklir"), ruptl: "nuklir", kep: "nuklir", reg: ["nuklir"], ind: null },
  { id: "daur-ulang", pemilik: true, ik: "daur", warna: "karbon", p: (p) => /daur ulang|recycl/i.test(p.nama), rb: /daur ulang|limbah panel|recycl|limbah baterai/i, rr: /daur ulang|limbah b3|limbah panel/i, ind: { rt: ["daur ulang"], tkdn: [], pt: "daur ulang" } },
];
export const tekById = (id) => TEK.find((x) => x.id === id);
export const TEK_AWAL = "plts-atap";

const normNama = (s) => String(s ?? "").toLowerCase().replace(/^pt\.?\s+/, "").replace(/[^a-z0-9]+/g, " ").trim();
/* Saringan murni, dipisah agar bisa diuji di Node. */
export const saring = (cfg, D) => {
  const proyek = (D.proyek || []).filter(cfg.p);
  const ruptl = cfg.ruptl ? (D.ruptl || []).filter((r) => r.teknologi === cfg.ruptl && (cfg.id !== "plts-atap" || /atap|komunal|tersebar/i.test(r.nama))) : [];
  const reg = (D.reg || []).filter((r) => (cfg.reg || []).some((k) => r.topik.includes(k)) || (cfg.rr && cfg.rr.test(r.judul)));
  if (cfg.id === "plts-atap" || cfg.id === "plts-terapung") reg.splice(0, reg.length, ...reg.filter((r) => cfg.rr.test(r.judul)));
  const ber = (D.berita || []).filter((b) => (cfg.kep && (b.kepakaran || []).includes(cfg.kep) && !cfg.rb) || (cfg.rb && cfg.rb.test(b.judul)));
  let org = cfg.kep && !cfg.pemilik ? (D.org || []).filter((o) => (o.kepakaran || []).includes(cfg.kep)) : [];
  if (cfg.pemilik) { /* pemain = pemilik proyek yang cocok dengan nama organisasi */
    const nama = new Set(proyek.flatMap((p) => (p.pihak?.pemilik || []).map((x) => normNama(x.nilai))));
    org = (D.org || []).filter((o) => [o.nama, o.singkatan, ...(o.nama_lain || [])].some((n) => n && nama.has(normNama(n))));
  }
  return { proyek, ruptl, reg, ber, org };
};
