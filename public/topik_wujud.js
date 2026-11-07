/* /topik: pembantu tampilan bersama (angka tersorot berformat lokal, entitas bertaut: organisasi, proyek, regulasi, provinsi, negara, penerbit).
   Entitas dicari dari data dasar topik + organisasi.json; kolom tabel dikenali dari ISI seluruhnya, bukan dari nama kolom (lihat jenisKolom di topik_tampil.js). */
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { logoOrg } from "/inti/logo_org.js";
import { kodeProv } from "/inti/prov_singkat.js";

/* ---------- angka dalam kalimat: "1493.97 MW" jadi pil "1.493,97 MW" (format id/en menurut bahasa halaman) ---------- */
const SATUAN = "MWp|MWac|MWh|MW|GWp|GWh|GW|kWp|kWh|kW|TWh|persen|percent|%|tCO2e|ton|Mt|juta|miliar|triliun|million|billion|trillion|ribu|thousand|hektare|hectares|ha|tahun|years|bulan|months|jam|hours|km2|km|unit|proyek|projects|pabrikan|factories|provinsi|provinces|negara|countries|kali|kWh/kWp";
const RE_ANGKA = new RegExp(`(?<![\\w/.,-])(?:(Rp|USD|US\\$|IDR)\\s?)?(\\d+(?:[.,]\\d+)*)(?:(\\s?)(${SATUAN})(?![A-Za-z]))?`, "gi");
export function formatMentah(raw) {
  let n, d = 0;
  if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(raw)) n = +raw.replace(/\./g, "");
  else { const m = raw.replace(",", "."); n = +m; d = (m.split(".")[1] || "").length; }
  return Number.isFinite(n) ? angka(n, { desimal: d }) : raw;
}
/** teks polos -> HTML aman; angka bersatuan/bermata uang jadi <b class="jm-tp-n"> */
export function rapi(s) {
  s = String(s ?? "");
  let h = "", i = 0;
  for (const m of s.matchAll(RE_ANGKA)) {
    if (!m[1] && !m[4]) continue;
    h += esc(s.slice(i, m.index)) + `<b class="jm-tp-n">${esc((m[1] ? m[1] + " " : "") + formatMentah(m[2]) + (m[4] ? (m[3] || "") + m[4] : ""))}</b>`;
    i = m.index + m[0].length;
  }
  return h + esc(s.slice(i));
}
/** angka-angka bersatuan di satu kalimat: [{html, awal, akhir}] */
export function angkaDalam(s) {
  const a = [];
  for (const m of String(s).matchAll(RE_ANGKA)) if (m[1] || m[4]) a.push({ nilai: (m[1] ? m[1] + " " : "") + formatMentah(m[2]), satuan: m[4] || "", i: m.index, panjang: m[0].length });
  return a;
}

/* ---------- indeks entitas ---------- */
export const K = { org: new Map(), proyek: new Map(), reg: new Map(), prov: null };
export const norm = (s) => String(s || "").toLowerCase().replace(/\b(pt|tbk|persero|cv|ltd|co|corp|corporation|inc|the|plc)\b\.?/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const taruh = (m, k, v) => { if (k && k.length > 2 && !m.has(k)) m.set(k, v); };
export function isiK(ctx, orgJson) {
  K.org = new Map(); K.proyek = new Map(); K.reg = new Map();
  const d = ctx.dasar;
  for (const o of [...(d.pemain || []), ...(d.studi || [])]) { const v = { id: o.id, nama: o.nama, logo: o.logo, kategori: o.kategori }; taruh(K.org, norm(o.nama), v); taruh(K.org, norm(o.singkatan), v); }
  for (const o of orgJson?.baris || []) { const v = { id: o.id, nama: o.nama, logo: o.logo, kategori: o.kategori?.label }; taruh(K.org, norm(o.nama), v); taruh(K.org, norm(o.singkatan), v); for (const n of o.nama_lain || []) taruh(K.org, norm(n), v); }
  for (const p of d.proyek?.daftar || []) taruh(K.proyek, norm(p.nama), p);
  for (const r of d.regulasi || []) { const k = `${r.nomor}/${r.tahun}`; K.reg.set(k, [...(K.reg.get(k) || []), r]); }
}
const RE_REG = /\b(uu|perppu|pp|perpres|keppres|inpres|permen\w*|kepmen\w*|perda|undang-undang)\b[^\d]{0,24}?(\d+)\s*\/\s*(\d{4})/i;
export function cariReg(teks) {
  const m = String(teks || "").match(RE_REG);
  if (!m) return null;
  const a = K.reg.get(`${m[2]}/${m[3]}`);
  return a ? a.find((r) => m[1].toLowerCase().startsWith(r.jenis.slice(0, 3)) || r.jenis.startsWith(m[1].toLowerCase().slice(0, 3))) || a[0] : { cocok: true, kode: m[0] };
}
export const cariOrg = (nama) => K.org.get(norm(nama)) || null;
export const cariProyek = (nama) => K.proyek.get(norm(nama)) || null;

/* ---------- logo, lambang, bendera ---------- */
export const logoKotak = (id, nama, logo, kelas = "") => {
  const u = logoOrg(id, nama, logo)[0];
  return `<span class="jm-tp-logo ${kelas}">${u ? `<img src="${esc(u)}" alt="" width="36" height="36" loading="lazy" decoding="async" data-galat="hapus">` : ""}${ikon("gedung", 18)}</span>`;
};
export const lambang = (kode, u = 22) => `<img class="jm-tp-lambang" src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async" data-galat="hapus">`;
export const bendera = (iso, u = 22) => (iso ? `<img class="jm-tp-bd" src="/img/bendera/${esc(String(iso).toLowerCase())}.svg" width="${u}" height="${Math.round(u * 0.75)}" alt="" loading="lazy" data-galat="hapus">` : "");
export const provSel = (nama) => { const k = kodeProv(nama); return k ? `<a class="jm-tp-ent" href="/wilayah/${k}">${lambang(k)}<span>${esc(nama)}</span></a>` : esc(nama || "-"); };
export const orgSel = (nama, o = cariOrg(nama)) => (o ? `<a class="jm-tp-ent" href="/o/${esc(o.id)}">${logoKotak(o.id, o.nama, o.logo, "jm-tp-logo-s")}<span>${esc(nama)}</span></a>` : `<span class="jm-tp-ent">${logoKotak("", nama, "", "jm-tp-logo-s")}<span>${esc(nama)}</span></span>`);

/* negara (nama id/en -> iso2) */
const NEG = { indonesia: "id", jerman: "de", germany: "de", tiongkok: "cn", china: "cn", cina: "cn", jepang: "jp", japan: "jp", "korea selatan": "kr", "south korea": "kr", india: "in", "amerika serikat": "us", "united states": "us", usa: "us", inggris: "gb", "united kingdom": "gb", uk: "gb", prancis: "fr", france: "fr", denmark: "dk", spanyol: "es", spain: "es", italia: "it", italy: "it", belanda: "nl", netherlands: "nl", swedia: "se", sweden: "se", finlandia: "fi", finland: "fi", kanada: "ca", canada: "ca", brasil: "br", brazil: "br", australia: "au", "selandia baru": "nz", "new zealand": "nz", singapura: "sg", singapore: "sg", malaysia: "my", thailand: "th", vietnam: "vn", filipina: "ph", philippines: "ph", kamboja: "kh", cambodia: "kh", laos: "la", myanmar: "mm", brunei: "bn", "timor leste": "tl", "timor-leste": "tl", "uni emirat arab": "ae", uea: "ae", uae: "ae", "united arab emirates": "ae", "arab saudi": "sa", "saudi arabia": "sa", qatar: "qa", mesir: "eg", egypt: "eg", "afrika selatan": "za", "south africa": "za", kenya: "ke", ghana: "gh", nigeria: "ng", tanzania: "tz", turki: "tr", turkey: "tr", rusia: "ru", russia: "ru", iran: "ir", israel: "il", pakistan: "pk", bangladesh: "bd", azerbaijan: "az", "hong kong": "hk", taiwan: "tw" };
export const isoNegara = (nama) => NEG[String(nama || "").toLowerCase().trim()] || "";
export const negaraSel = (nama) => { const i = isoNegara(nama) || (/^[A-Za-z]{2}$/.test(String(nama || "").trim()) ? String(nama).trim().toLowerCase() : ""); return i ? `<span class="jm-tp-ent">${bendera(i)}<span>${esc(nama)}</span></span>` : esc(nama || "-"); };

/* penerbit regulasi dari teks judul/kode */
const PENERBIT = [[/esdm|energi dan sumber daya mineral/i, "ESDM", "/img/logo/esdm.png"], [/kemenperin|permenperin|perindustrian/i, "Kemenperin", "/img/penerbit/kemenperin.png"], [/kemenkeu|keuangan|pmk/i, "Kemenkeu", "/img/logo/kemenkeu.png"], [/bumn/i, "Kementerian BUMN", "/img/logo/kementerian-bumn.png"], [/bappenas/i, "Bappenas", "/img/logo/bappenas.webp"], [/kemenhut|kehutanan|lingkungan hidup|klhk/i, "Kemenhut", "/img/logo/kemenhut.png"], [/kemendag|perdagangan/i, "Kemendag", "/img/penerbit/kemendag.png"], [/kemenhub|perhubungan/i, "Kemenhub", "/img/penerbit/kemenhub.png"], [/bapeten/i, "Bapeten", "/img/penerbit/bapeten.png"], [/pupr|pekerjaan umum/i, "PUPR", "/img/penerbit/pupr.png"], [/marves|kemaritiman/i, "Marves", "/img/penerbit/marves.png"], [/\bpln\b/i, "PLN", "/img/logo/pln.png"]];
export function penerbit(teks, jenis) {
  const p = PENERBIT.find((x) => x[0].test(teks));
  if (p) return { nama: p[1], logo: p[2] };
  return /^(uu|perppu|pp|perpres|keppres|inpres)$/i.test(jenis || "") || /\b(uu|perpres|pp|perppu|inpres|keppres)\b/i.test(teks) ? { nama: "Pemerintah RI", logo: "/img/penerbit/garuda.png" } : null;
}
export const logoPenerbit = (p) => (p ? `<span class="jm-tp-logo jm-tp-logo-s" title="${esc(p.nama)}"><img src="${esc(p.logo)}" alt="${esc(p.nama)}" width="28" height="28" loading="lazy" decoding="async" data-galat="hapus">${ikon("regulasi", 16)}</span>` : "");

/* ---------- pil berwarna: kategori, peran (warna = token --data1..5 lewat kelas jm-tp-w0..4) ---------- */
const KAT = [[/bumn/i, 0, "perisai"], [/swasta/i, 1, "gedung"], [/internasional|asing/i, 2, "globe"], [/kementerian|lembaga negara|pemerintah/i, 3, "regulasi"], [/donor|dana|bank|pembiaya/i, 4, "berlian"], [/kampus|universitas|riset|studi/i, 4, "wisuda"]];
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 5, 7);
export function pilKat(label) {
  if (!label) return "-";
  const k = KAT.find((x) => x[0].test(label)), w = k ? k[1] : hash(label);
  return `<span class="jm-pil-tek jm-tp-w${w}">${ikon(k ? k[2] : "tag", 14)}<span>${esc(label)}</span></span>`;
}
const PERAN = { operator: ["tek-listrik", 0], pengembang: ["proyek", 1], ipp: ["kartu", 2], epc: ["denah", 3], pembiaya: ["berlian", 4], pendana: ["berlian", 4], lembaga: ["gedung", 3], pemasok: ["rantai", 2], manufaktur: ["pabrik", 0], pabrikan: ["pabrik", 0], "produsen bbn": ["tek-bio", 1] };
export const kapital = (s) => String(s).charAt(0).toLocaleUpperCase() + String(s).slice(1);
export function pilPeran(teks) {
  const a = String(teks ?? "").split(/\s*,\s*/).filter(Boolean);
  if (!a.length) return "-";
  return `<span class="jm-tp-pils">${a.map((p) => { const k = PERAN[p.toLowerCase()] || ["tag", hash(p)]; return `<span class="jm-pil-tek jm-tp-w${k[1]}">${ikon(k[0], 14)}<span>${esc(p === p.toUpperCase() ? p : kapital(p))}</span></span>`; }).join("")}</span>`;
}

/* ---------- sparkline kecil: deret [[tahun, nilai], ...] ---------- */
export function spark(deret, { w = 120, h = 34, label = "" } = {}) {
  const v = (deret || []).map((p) => (Array.isArray(p) ? +p[1] : +p)).filter(Number.isFinite);
  if (v.length < 3) return "";
  const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1, X = (i) => 3 + (i / (v.length - 1)) * (w - 6), Y = (x) => h - 4 - ((x - lo) / r) * (h - 10);
  const pts = v.map((x, i) => `${X(i).toFixed(1)},${Y(x).toFixed(1)}`).join(" ");
  return `<svg class="jm-tp-spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label || t("tp.tren"))}" focusable="false"><polygon class="jm-tp-spark-a" points="${X(0).toFixed(1)},${h} ${pts} ${X(v.length - 1).toFixed(1)},${h}"/><polyline class="jm-tp-spark-g" points="${pts}"/><circle class="jm-tp-spark-t" cx="${X(v.length - 1).toFixed(1)}" cy="${Y(v.at(-1)).toFixed(1)}" r="3"/></svg>`;
}

export const KAMUS_TEK = { surya: "surya", "panas-bumi": "panas-bumi", karbon: "karbon", bayu: "bayu", hidro: "hidro", bioenergi: "bioenergi", nuklir: "nuklir", penyimpanan: "penyimpanan", hidrogen: "hidrogen", "energi-laut": "laut", jaringan: "jaringan", "kendaraan-listrik": "elektrifikasi", efisiensi: "efisiensi", "pembiayaan-hijau": "pembiayaan", "sampah-energi": "biomassa-sampah", "transisi-berkeadilan": "transisi-adil" };
