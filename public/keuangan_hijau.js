/* /keuangan-hijau: investasi publik EBT vs fosil, obligasi dan sukuk hijau, JETP, skema hibah, pembanding ASEAN. Informasi saja. Data statis /data/keuangan_hijau.json. Tab Pendanaan tidak digandakan, hanya ditautkan. */
import { buktiHtml } from "/inti/bukti.js";
import { nanti, esc, hantuHtml, debounce, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";
import { exHtml, unduhRegHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatData, tampilGalat, sumberLipat, ubinHtml, pil, num, saatBahasa } from "/analisis.js";
import { legendaHtml, tabel, celahHtml, n1 } from "/info_hijau.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { uangHtml } from "/inti/uang.js";
import { logoUrl } from "/penerbit.js";

const $ = (id) => document.getElementById(id);
const PENDANAAN = "/direktori?tampil=pendanaan";
let d = null, kurs = 0, dIf = null, dTk = null, dReg = null;
const src = (catatan, ...id) => sumberLipat(id.map((i) => { const s = d.sumber.find((x) => x.id === i); return { sumber: s.penerbit, halaman: s.judul, url: s.url, tanggal: d.dibangun_pada }; }), catatan ? `<span class="jm-an-srcl">${esc(t(catatan))}</span>` : "");
const KEL = ["ebt", "fosil", "lain"], KLS = { ebt: "ih-ebt", fosil: "ih-fosil", lain: "ih-lain" };
const jumlahKel = (a, b) => { const o = { ebt: 0, fosil: 0, lain: 0 }; for (const r of d.investasi_publik) if (r.tahun >= a && r.tahun <= b) o[r.kelompok] += r.usd_juta_2023; return o; };
const TAHUN = () => [...new Set(d.investasi_publik.map((r) => r.tahun))].sort((a, b) => a - b);
const slug = (x) => x.toLowerCase().replace(/[^a-z]+/g, "-");
const pilihTingkat = (b) => t("kg.bukti." + b);

/* ---------- organisasi (logo, singkatan baku, bendera negara asal, jenis lembaga) ---------- */
const SD = (x) => `/img/logo/sd/${x}`;
const ORG = [
  [/World Bank/i, "World Bank", SD("worldbank.org.png"), "", "multi"], [/Asian Development/i, "ADB", SD("adb.org.png"), "", "multi"],
  [/Investor pasar/i, "Pasar modal", SD("idx.co.id.png"), "id", "pasar"], [/BMZ/, "BMZ", SD("bmz.de.png"), "de", "bi"],
  [/Infrastructure Investment Bank/i, "AIIB", SD("aiib.org.png"), "", "multi"], [/DFATD/, "DFATD", SD("international.gc.ca.ico"), "ca", "bi"],
  [/Islamic Development/i, "IsDB", SD("isdb.org.png"), "", "multi"], [/JICA|Japan International/i, "JICA", SD("jica.go.jp.png"), "jp", "bi"],
  [/Green Climate/i, "GCF", SD("greenclimate.fund.png"), "", "multi"], [/^AFD/, "AFD", SD("afd.fr.png"), "fr", "bi"],
  [/Lingkungan Hidup/i, "BPDLH", "", "id", "dom"], [/Global Environment/i, "GEF", SD("thegef.org.png"), "", "multi"],
  [/Bappenas|PPN/i, "Bappenas", logoUrl("Bappenas"), "id", "dom"], [/KfW/i, "KfW", SD("kfw-entwicklungsbank.de.png"), "de", "bi"],
  [/Climate Investment/i, "CIF", SD("cif.org.png"), "", "multi"], [/Sarana Multi/i, "SMI", SD("ptsmi.co.id.png"), "id", "dom"],
  [/Kementerian Keuangan|Kemenkeu/i, "Kemenkeu", logoUrl("Kementerian Keuangan"), "id", "dom"],
  [/Arkora/i, "Arkora Hydro", "", "id", "dom"], [/Indonesia Infrastructure/i, "IIF", "", "id", "dom"],
];
const orgDari = (nama) => { const o = ORG.find((r) => r[0].test(nama)); return o ? { s: o[1], logo: o[2], iso: o[3], lm: o[4] } : { s: nama, logo: "", iso: "", lm: "dom" }; };
const LOGO_JETP = [[/Muara Laboh/i, "/img/logo/supreme-energy.png"], [/EFSD/i, SD("ec.europa.eu.png")], [/RBL AICET/i, SD("worldbank.org.png")], [/IKI-Flex/i, "", "de"]];
const bendera = (iso, w = 20) => (iso ? `<img class="kg-fl" src="/img/bendera/${esc(iso)}.svg" alt="" width="${w}" height="${Math.round(w * 0.75)}" loading="lazy">` : "");
const logo = (src) => `<img class="kg-lg" src="${esc(src || "/img/penerbit/gedung.svg")}" alt="" width="24" height="24" loading="lazy" decoding="async">`;
const orgHtml = (nama, { penuh = false, kecil = "" } = {}) => { const o = orgDari(nama); return `<span class="kg-org" title="${esc(nama)}">${logo(o.logo)}<span class="kg-nm2"><span class="kg-nm">${esc(penuh ? nama : o.s)}</span>${kecil ? `<small>${esc(kecil)}</small>` : ""}</span>${bendera(o.iso)}</span>`; };
document.addEventListener("error", (e) => { const i = e.target; if (i?.tagName === "IMG" && i.classList.contains("kg-lg") && !i.src.endsWith("gedung.svg")) i.src = "/img/penerbit/gedung.svg"; }, true);

/* ---------- pil berwarna berikon ---------- */
const pilK = (kls, ik, label) => `<span class="jm-pil-tek kg-pil ${kls}">${ik}${esc(label)}</span>`;
const IT = (k) => IKON_TEK[k];
const TEK = { "Renewable hydropower": ["hidro", "kg-t-hidro"], "Solar photovoltaic": ["surya", "kg-t-surya"], "Solar thermal energy": ["surya", "kg-t-surya"], "Wind energy": ["bayu", "kg-t-bayu"], "Onshore wind energy": ["bayu", "kg-t-bayu"],
  "Marine energy": ["laut", "kg-t-laut"], "Geothermal energy": ["panas-bumi", "kg-t-panas"], "Solid biofuels": ["bioenergi", "kg-t-bio"], "Multiple renewables": ["jaringan", "kg-t-ebt"], Coal: ["karbon", "kg-t-coal"],
  "Natural gas": ["industri", "kg-t-fosil"], Oil: ["industri", "kg-t-fosil"], "Other fossil fuels": ["industri", "kg-t-fosil"], "Nuclear energy": ["nuklir", "kg-t-nuklir"], "Non-renewable waste": ["biomassa-sampah", "kg-t-sampah"] };
const pilTekInv = (x) => { const [i, k] = TEK[x] || ["jaringan", "kg-t-lain"]; return pilK(k, IT(i), t("kg.tek." + slug(x))); };
const KIK = { ebt: ["bioenergi", "kg-k-ebt"], fosil: ["karbon", "kg-k-fosil"], lain: ["jaringan", "kg-k-lain"] };
const pilKel = (k) => pilK(KIK[k][1], IT(KIK[k][0]), t("kg.kel." + k));
const BIK = { resmi: "centang", media: "berita", "kata-pihak": "info", "via-pihak-ketiga": "tautan" };
const pilBukti = (b) => buktiHtml(b);
const SKI = { hibah: "bintang", "pinjaman-lunak": "kartu", blended: "rantai", "insentif-fiskal": "kalkulator" };
const pilSkema = (j) => pilK("kg-j-" + slug(j), ikon(SKI[slug(j)] || "tag", 14), t("kg.skj." + slug(j)));
const pilJetp = (j) => pilK("kg-j-" + j, ikon(j === "program" ? "daftar" : "proyek", 14), t("kg.jenis." + j));
const jenisInstr = (x) => (/perpetual/i.test(x) ? "notes" : /sukuk/i.test(x) ? "sukuk" : /berkelanjutan/i.test(x) ? "lanjut" : "obl");
const NIK = { sukuk: "pembiayaan", obl: "pembiayaan", lanjut: "efisiensi", notes: "karbon" };
const pilInstr = (x) => { const j = jenisInstr(x); return pilK("kg-n-" + j, IT(NIK[j]), t("kg.jn." + j)); };
const tekJetp = (k) => (k ? pilK(({ surya: "kg-t-surya", "panas-bumi": "kg-t-panas" }[k] || "kg-t-ebt"), IT(({ surya: "surya", "panas-bumi": "panas-bumi" }[k] || "jaringan")), t("ih.tek." + k)) : `<span class="kg-nol" title="${esc(t("kg.c.tek"))}: -">-</span>`);
const tingkatE = (v) => (v >= 40 ? 1 : v >= 20 ? 2 : v >= 10 ? 3 : 4);
const NAMA_PEN = { "PT Arkora Hydro Tbk": "Arkora Hydro" };

/* ---------- tooltip mengambang kaya (satu pendengar bersama) ---------- */
let TIP = [], kotakTip, kini = null;
const tipDaftar = (o) => TIP.push(o) - 1;
const tipIsi = ({ judul, img = "", baris = [], cat = "" }) =>
  `<div class="kg-tip-h">${img}${esc(judul)}</div><dl>${baris.map(([k, v, c]) => `<dt>${c ? `<i class="${c}"></i>` : ""}${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>${cat ? `<small>${esc(cat)}</small>` : ""}`;
const tipTeks = (o) => `${o.judul}: ${o.baris.map(([k, v]) => `${k} ${v}`).join(", ")}`;
function tutupTip() { if (kotakTip) kotakTip.hidden = true; if (kini) { kini.classList.remove("kg-on"); kini.closest("[data-kg]")?.classList.remove("kg-fokus"); kini.removeAttribute("aria-describedby"); kini = null; } }
function bukaTip(e, x) {
  const o = TIP[+e.dataset.kt]; if (!o) return;
  if (!kotakTip) { kotakTip = Object.assign(document.createElement("div"), { className: "kg-tip", hidden: true, role: "tooltip", id: "kg-tip" }); document.body.append(kotakTip); }
  if (kini && kini !== e) tutupTip();
  kini = e; kotakTip.innerHTML = tipIsi(o); kotakTip.hidden = false;
  const r = e.getBoundingClientRect(), w = kotakTip.offsetWidth, h = kotakTip.offsetHeight, cx = x ?? r.left + r.width / 2;
  kotakTip.style.left = Math.min(Math.max(cx - w / 2, 8), innerWidth - w - 8) + "px";
  kotakTip.style.top = (r.top - h - 10 < 8 ? r.bottom + 10 : r.top - h - 10) + "px";
  e.classList.add("kg-on"); e.setAttribute("aria-describedby", "kg-tip"); e.closest("[data-kg]")?.classList.add("kg-fokus");
}
if (!window.__kgTip) {
  window.__kgTip = true;
  document.addEventListener("pointerover", (ev) => { const e = ev.target.closest?.("[data-kt]"); if (!e) { if (kini) tutupTip(); return; } if (e !== kini) bukaTip(e, ev.clientX); });
  document.addEventListener("pointermove", (ev) => { if (kini && kotakTip && ev.pointerType === "mouse" && kini.matches("[data-kt-x]")) { const w = kotakTip.offsetWidth; kotakTip.style.left = Math.min(Math.max(ev.clientX - w / 2, 8), innerWidth - w - 8) + "px"; } });
  document.addEventListener("focusin", (ev) => { const e = ev.target.closest?.("[data-kt]"); if (e) bukaTip(e); });
  document.addEventListener("focusout", (ev) => { if (kini && !kini.contains(ev.relatedTarget)) tutupTip(); });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") tutupTip(); });
  addEventListener("scroll", tutupTip, { passive: true });
}

/* ---------- sumbu ---------- */
function skala(maks) {
  if (!(maks > 0)) return { atas: 1, tick: [0, 1] };
  const kasar = maks / 4, p = 10 ** Math.floor(Math.log10(kasar)), f = kasar / p, st = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p, n = Math.ceil(maks / st - 1e-9);
  return { atas: st * n, tick: Array.from({ length: n + 1 }, (_, i) => st * i) };
}

/* ---------- kolom bertumpuk interaktif (investasi, sukuk) ---------- */
const HID = new Set();
function kolom(el, { kategori, seri, label, band }) {
  const W = Math.max(300, el.clientWidth || 640), H = W < 500 ? 250 : 300, L = 56, R = 10, T = 26, B = 28;
  const lihat = seri.filter((s) => !HID.has(s.k)), tot = kategori.map((c) => lihat.reduce((a, s) => a + (c.nilai[s.k] || 0), 0));
  const { atas, tick } = skala(Math.max(...tot, 0));
  const y = (v) => T + (1 - v / atas) * (H - T - B), lb = (W - L - R) / kategori.length, bw = Math.max(5, Math.min(40, lb * 0.66));
  const grid = tick.map((v) => `<line class="ih-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(n1(v, 0))}</text>`).join("");
  const langkah = Math.ceil(kategori.length / Math.max(1, Math.floor((W - L - R) / 44)));
  const bd = band ? (() => { const i0 = kategori.findIndex((c) => c.th >= band[0]), i1 = kategori.findLastIndex((c) => c.th <= band[1]); return i0 < 0 ? "" : `<rect class="kg-band" x="${(L + lb * i0).toFixed(1)}" y="${T - 14}" width="${(lb * (i1 - i0 + 1)).toFixed(1)}" height="${H - T - B + 14}" rx="6"/><text class="kg-bandl" x="${(L + lb * i0 + 6).toFixed(1)}" y="${T - 2}">${esc(t("kg.rentang", { a: band[0], b: band[1] }))}</text>`; })() : "";
  const kol = kategori.map((c, i) => {
    let dasar = 0; const cx = L + lb * i + lb / 2, id = tipDaftar(c.tip);
    const bag = lihat.map((s) => { const v = c.nilai[s.k] || 0; if (!v) return ""; const y0 = y(dasar), y1 = y(dasar + v); dasar += v; return `<rect class="kg-b ${s.kelas}" x="${(cx - bw / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, y0 - y1).toFixed(1)}"/>`; }).join("");
    return `<g class="kg-kol" data-kt="${id}" tabindex="0" role="img" aria-label="${esc(tipTeks(c.tip))}">${bag}<rect class="kg-hit" x="${(L + lb * i).toFixed(1)}" y="${T - 14}" width="${lb.toFixed(1)}" height="${H - T - B + 14}"/>${i % langkah === 0 ? `<text x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(c.label)}</text>` : ""}</g>`;
  }).join("");
  el.setAttribute("data-kg", "");
  el.innerHTML = `<svg class="kg-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(label)}" focusable="false">${bd}${grid}${kol}</svg>`;
}

/* ---------- batang mendatar HTML berlogo/bendera ---------- */
function batang(el, baris, { ref = null, kelasRef = "" } = {}) {
  el.setAttribute("data-kg", "");
  const li = baris.map((b) => `<li class="kg-br ${b.kelas || ""}" data-kt="${tipDaftar(b.tip)}" data-kt-x tabindex="0" aria-label="${esc(tipTeks(b.tip))}"><span class="kg-bl">${b.labelHtml}</span><span class="kg-trk"><i class="kg-fill" data-w="${b.w.toFixed(2)}"></i></span><b class="kg-bv">${esc(b.nilai)}</b></li>`).join("");
  const kepala = ref ? `<li class="kg-br kg-bh" aria-hidden="true"><span></span><span class="kg-trk"><em class="kg-reflbl">${esc(ref.label)}</em></span><b></b></li>` : "";
  el.innerHTML = `<ul class="kg-bt ${ref ? "kg-ref" : ""}">${kepala}${li}</ul>`;
  const ul = el.firstElementChild;
  if (ref) ul.style.setProperty("--ref", ref.w.toFixed(2));
  for (const f of el.querySelectorAll("[data-w]")) f.style.setProperty("--w", f.dataset.w);
}

function ubin() {
  const th = TAHUN(), z = th.at(-1), k = jumlahKel(z - 9, z), pers = (k.ebt / (k.ebt + k.fosil)) * 100;
  const sukuk = d.instrumen_hijau.find((r) => r.nilai === 185600);
  $("kgJawab").textContent = t("kg.lead");
  $("kgUbin").innerHTML = ubinHtml([
    { ikon: "grafik", nilai: num(pers, 0), satuan: "%", label: t("kg.u1", { a: z - 9, b: z }), href: "#investasi", turunan: true },
    { ikon: "kartu", nilai: sukuk ? `Rp${num(sukuk.nilai / 1000, 1)}` : "-", satuan: t("kg.triliun"), label: t("kg.u2"), href: "#obligasi" },
    { ikon: "bintang", nilai: num(d.jetp.komitmen_usd_miliar, 0), satuan: t("kg.miliar_usd"), label: t("kg.u3"), href: "#jetp" },
  ]);
}

function rangka() {
  const th = TAHUN(), z = th.at(-1), k = jumlahKel(z - 9, z), pers = (k.ebt / (k.ebt + k.fosil)) * 100, est = " " + pil("an.est");
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const pem = d.pemberi, besar = pem[0];
  const nt = d.tetangga.find((r) => r.iso3 === "IDN"), urutE = [...d.tetangga].sort((a, b) => b.ebt_persen - a.ebt_persen), rk = urutE.findIndex((r) => r.iso3 === "IDN") + 1;
  const g = d.instrumen_hijau.filter((r) => r.pemerintah && r.satuan === "USD juta" && /Global Sovereign/.test(r.instrumen) && !/Agregat/.test(r.instrumen));
  const jp = d.jetp.proyek, ebtMw = jp.reduce((a, r) => a + (r.kapasitas_mw || 0), 0);
  const cap = (id, kunci) => `<p class="jm-bantu" id="${id}">${esc(t(kunci))}</p>`;
  const legJenis = ["multi", "bi", "pasar", "dom"].map((x) => `<li class="kg-leg-i kg-lm-${x}"><i class="ih-sw"></i><span class="kg-nm">${esc(t("kg.lm." + x))}</span></li>`).join("");
  $("kgIsi").innerHTML = [
    ex({ id: "investasi", ikon: "grafik", topik: t("kg.ey.investasi"), judulHtml: hlHtml("kg.t.investasi", `${num(pers, 0)}%`, { a: z - 9, b: z }) + est, subHtml: esc(t("kg.s.investasi")), csv: true,
      isiHtml: `<ul class="kg-leg" id="leg-inv">${KEL.map((x) => `<li><button type="button" class="kg-leg-b" data-seri="${x}" aria-pressed="${!HID.has(x)}" title="${esc(t("kg.leg.klik"))}"><i class="ih-sw ${KLS[x]}"></i>${esc(t("kg." + "kel." + x))}</button></li>`).join("")}</ul><p class="jm-bantu">${esc(t("kg.sat_usd"))}</p><div id="g-investasi" class="ih-bagan"></div><div id="tb-investasi" class="ih-tabel kg-tb"></div>${src("kg.n.investasi", "s-pubfin")}` }),
    ex({ id: "obligasi", ikon: "kartu", topik: t("kg.ey.obligasi"), judulHtml: hlHtml("kg.t.obligasi", `${g.length} ${t("kg.penerbitan")}`, { usd: num(g.reduce((a, r) => a + r.nilai, 0), 0) }), subHtml: esc(t("kg.s.obligasi")), csv: true,
      isiHtml: `${cap("c-sukuk", "kg.g_sukuk")}<div id="g-obligasi" class="ih-bagan"></div><div id="tb-obligasi" class="ih-tabel kg-tb"></div>${src("kg.n.obligasi", "s-djppr", "s-pendanaan")}` }),
    ex({ id: "jetp", ikon: "bintang", topik: t("kg.ey.jetp"), judulHtml: hlHtml("kg.t.jetp", `${jp.length} ${t("kg.entri")}`, { mw: num(ebtMw, 0) }), subHtml: esc(t("kg.s.jetp")), csv: true,
      isiHtml: `<div class="kg-jetp" id="k-jetp"></div><div id="tb-jetp" class="ih-tabel kg-tb"></div>${src("kg.n.jetp", "s-jetp")}` }),
    ex({ id: "pendana", ikon: "gedung", topik: t("kg.ey.pendana"), judulHtml: hlHtml("kg.t.pendana", orgDari(besar.pemberi).s, { usd: n1(besar.usd / 1e9, 1) }), subHtml: esc(t("kg.s.pendana")), csv: true,
      isiHtml: `<ul class="kg-leg">${legJenis}</ul><p class="jm-bantu">${esc(t("kg.miliar_usd"))}</p><div id="g-pendana" class="ih-bagan"></div><div id="tb-skema" class="ih-tabel kg-tb"></div><p class="ih-catatan"><a class="ih-tautan-pil" href="${PENDANAAN}">${ikon("direktori", 18)}${esc(t("kg.tab_pendanaan"))}</a></p>${src("kg.n.pendana", "s-pendanaan")}` }),
    ex({ id: "tetangga", ikon: "asean", topik: t("kg.ey.tetangga"), judulHtml: hlHtml("kg.t.tetangga", `${rk} ${t("kg.dari")} ${urutE.length}`, { v: n1(nt.ebt_persen, 1) }) + est, subHtml: esc(t("kg.s.tetangga")), csv: true,
      isiHtml: `${legendaHtml([{ kelas: "ih-id", label: t("ih.neg.IDN") }, { kelas: "ih-netral", label: t("kg.lain_asean") }])}<p class="jm-bantu">%</p><div id="g-tetangga" class="ih-bagan"></div><div id="tb-tetangga" class="ih-tabel kg-tb"></div>${src("kg.n.tetangga", "s-ember")}` }),
    ex({ id: "celah", ikon: "unduh", topik: t("kg.ey.celah"), judulHtml: hlHtml("kg.t.celah", String(d.celah.length)), subHtml: esc(t("kg.s.celah")), isiHtml: celahHtml(d.celah, "kg.celah") }),
  ].join("");
  tabelTabel();
}

const nilaiRp = (r) => (r.nilai == null ? null : r.satuan === "USD juta" ? (r.nilai * (kurs || 1)) / 1000 : r.nilai);
const uangInstr = (r) => (r.nilai == null ? `<span class="kg-nol" title="${esc(t("jm.belum") || "-")}">-</span>` : uangHtml(r.satuan === "USD juta" ? "US$" : "Rp", `${num(r.nilai, r.nilai % 1 ? 1 : 0)} ${t(r.satuan === "USD juta" ? "kg.u.juta" : "kg.u.miliar")}`));

function tabelTabel() {
  const th = TAHUN(), z = th.at(-1), ref = [...new Set(d.investasi_publik.map((r) => r.teknologi))];
  tabel($("tb-investasi"), { satuan: "ih.u.tek", per: 10, urutAwal: 2, kolom: [
    { label: t("kg.c.tek"), v: (r) => t("kg.tek." + slug(r.t)), f: (r) => pilTekInv(r.t) },
    { label: t("kg.c.kel"), v: (r) => t("kg.kel." + r.kel), f: (r) => pilKel(r.kel) },
    { label: t("kg.c.jumlah", { a: z - 9, b: z }), num: true, v: (r) => r.jml, f: (r) => num(r.jml, 1) },
    { label: t("kg.c.semua"), num: true, v: (r) => r.semua, f: (r) => num(r.semua, 1) },
  ], baris: ref.map((x) => { const rs = d.investasi_publik.filter((r) => r.teknologi === x); return { t: x, kel: rs[0].kelompok, jml: rs.filter((r) => r.tahun > z - 10).reduce((a, r) => a + r.usd_juta_2023, 0), semua: rs.reduce((a, r) => a + r.usd_juta_2023, 0) }; }) });
  tabel($("tb-obligasi"), { satuan: "ih.u.instrumen", per: 6, urutAwal: 4, kolom: [
    { label: t("kg.c.penerbit"), v: (r) => r.penerbit, f: (r) => { const h = orgHtml(NAMA_PEN[r.penerbit] || r.penerbit, { penuh: !ORG.some((o) => o[0].test(r.penerbit)) }); return r.penerbit_org_id ? `<a href="/o/${encodeURIComponent(r.penerbit_org_id)}">${h}</a>` : h; } },
    { label: t("kg.c.instrumen"), v: (r) => r.instrumen, f: (r) => esc(r.instrumen) },
    { label: t("kg.c.jenis"), v: (r) => jenisInstr(r.instrumen), f: (r) => pilInstr(r.instrumen) },
    { label: t("kg.c.nilai"), num: true, v: nilaiRp, f: uangInstr },
    { label: t("kg.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t("kg.c.kupon"), num: true, v: (r) => r.kupon_persen, f: (r) => (r.kupon_persen == null ? '<span class="kg-nol">-</span>' : `${num(r.kupon_persen, 2)}%`) },
    { label: t("kg.c.tenor"), num: true, v: (r) => r.tenor_tahun, f: (r) => (r.tenor_tahun == null ? '<span class="kg-nol">-</span>' : t("kg.tenor_th", { n: num(r.tenor_tahun, r.tenor_tahun % 1 ? 1 : 0) })) },
    { label: t("kg.c.sertif"), v: (r) => (r.sertifikasi ? 1 : 0), f: (r) => (r.sertifikasi ? `<span class="jm-pil" title="${esc(r.sertifikasi)}">${esc(t("kg.sertif.spo"))}</span>` : '<span class="kg-nol">-</span>') },
    { label: t("kg.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => pilBukti(r.tingkat_bukti) },
  ], baris: d.instrumen_hijau });
  const lj = (nm) => LOGO_JETP.find((x) => x[0].test(nm));
  tabel($("tb-jetp"), { satuan: "ih.u.entri", per: 10, urutAwal: 0, menurun: false, kolom: [
    { label: t("kg.c.nama"), v: (r) => r.nama, f: (r) => { const l = lj(r.nama), nm = r.sumber_url ? `<a href="${esc(r.sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(r.nama)}</a>` : esc(r.nama); return `<span class="kg-org">${logo(l?.[1])}<span class="kg-nm">${nm}</span>${bendera(l?.[2])}</span>`; } },
    { label: t("kg.c.jenis"), v: (r) => r.jenis, f: (r) => pilJetp(r.jenis) },
    { label: t("kg.c.tek"), v: (r) => r.teknologi || "", f: (r) => tekJetp(r.teknologi) },
    { label: t("kg.c.mw"), num: true, v: (r) => r.kapasitas_mw, f: (r) => (r.kapasitas_mw == null ? '<span class="kg-nol">-</span>' : num(r.kapasitas_mw, 0)) },
  ], baris: d.jetp.proyek });
  tabel($("tb-skema"), { satuan: "ih.u.skema", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("kg.c.skema"), v: (r) => r.nama, f: (r) => (r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.nama)}</a>` : esc(r.nama)) },
    { label: t("kg.c.pemberi"), v: (r) => r.pemberi, f: (r) => orgHtml(r.pemberi) },
    { label: t("kg.c.jenis"), v: (r) => r.jenis, f: (r) => pilSkema(r.jenis) },
    { label: t("kg.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => pilBukti(r.tingkat_bukti) },
  ], baris: d.skema });
  tabel($("tb-tetangga"), { satuan: "ih.u.negara", per: 10, urutAwal: 1, kelasBaris: (r) => (r.iso3 === "IDN" ? "ih-baris-id" : ""), kolom: [
    { label: t("bl.c.negara"), v: (r) => t("ih.neg." + r.iso3), f: (r) => `<span class="kg-org">${bendera(ISO2[r.iso3], 24)}<span class="kg-nm">${esc(t("ih.neg." + r.iso3))}</span></span>` },
    { label: t("kg.c.ebt"), num: true, v: (r) => r.ebt_persen, f: (r) => pilK("kg-e" + tingkatE(r.ebt_persen), "", n1(r.ebt_persen, 1)) },
    { label: `${t("kg.c.fosil")} ${t("an.est")}`, num: true, v: (r) => r.fosil_persen, f: (r) => n1(r.fosil_persen, 1) },
    { label: t("kg.c.karbon"), num: true, v: (r) => r.intensitas_gco2_kwh, f: (r) => (r.intensitas_gco2_kwh == null ? '<span class="kg-nol">-</span>' : num(r.intensitas_gco2_kwh, 0)) },
    { label: t("kg.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
  ], baris: d.tetangga });
}
const ISO2 = { IDN: "id", VNM: "vn", THA: "th", PHL: "ph", IND: "in", MYS: "my", KHM: "kh", LAO: "la", SGP: "sg", MMR: "mm", BRN: "bn" };
const swK = { ebt: "ih-ebt", fosil: "ih-fosil", lain: "ih-lain" };

function bagan() {
  TIP = []; tutupTip();
  const th = TAHUN(), z = th.at(-1);
  /* 1. investasi publik */
  const kat = th.map((y) => {
    const rs = d.investasi_publik.filter((r) => r.tahun === y), nilai = { ebt: 0, fosil: 0, lain: 0 }; for (const r of rs) nilai[r.kelompok] += r.usd_juta_2023;
    const top = [...rs].sort((a, b) => b.usd_juta_2023 - a.usd_juta_2023).slice(0, 3).filter((r) => r.usd_juta_2023 > 0), tot = nilai.ebt + nilai.fosil + nilai.lain, ef = nilai.ebt + nilai.fosil;
    return { label: String(y), th: y, nilai, tip: { judul: String(y), baris: [...KEL.filter((x) => x !== "lain" || nilai.lain).map((x) => [t("kg.kel." + x), num(nilai[x], 0), swK[x]]), [t("kg.tt.total"), num(tot, 0)], [t("kg.tt.pangsa"), ef ? `${num((nilai.ebt / ef) * 100, 0)}%` : "-"], ...top.map((r, i) => [i ? "" : t("kg.tt.top"), `${t("kg.tek." + slug(r.teknologi))} ${num(r.usd_juta_2023, 0)}`])], cat: t("kg.sat_usd") } };
  });
  kolom($("g-investasi"), { kategori: kat, seri: KEL.map((k) => ({ k, kelas: KLS[k] })), label: t("kg.s.investasi"), band: [z - 9, z] });
  /* 2. sukuk */
  const g = d.instrumen_hijau.filter((r) => r.pemerintah && r.satuan === "USD juta" && /Global Sovereign/.test(r.instrumen) && !/Agregat/.test(r.instrumen)).sort((a, b) => a.tahun - b.tahun);
  kolom($("g-obligasi"), { seri: [{ k: "v", kelas: "ih-ebt" }], label: t("kg.g_sukuk"), kategori: g.map((r) => ({ label: String(r.tahun), th: r.tahun, nilai: { v: r.nilai }, tip: { judul: String(r.tahun), img: logo(logoUrl("Kementerian Keuangan")), baris: [[t("kg.tt.instrumen"), r.instrumen.replace(/\s*\(.*\)/, "").replace(/ SNI.*/, "")], [t("kg.c.nilai"), `US$ ${num(r.nilai, 0)} ${t("kg.u.juta")}`], [t("kg.c.bukti"), t("kg.bukti." + r.tingkat_bukti)]] } })) });
  /* 3. JETP: grafik kecil MW per teknologi */
  const mw = {}; for (const r of d.jetp.proyek) if (r.teknologi && r.kapasitas_mw) { (mw[r.teknologi] ||= { mw: 0, n: 0 }); mw[r.teknologi].mw += r.kapasitas_mw; mw[r.teknologi].n++; }
  const mwT = Object.values(mw).reduce((a, x) => a + x.mw, 0), mwMaks = Math.max(1, ...Object.values(mw).map((x) => x.mw));
  batang($("kg-mw"), Object.entries(mw).sort((a, b) => b[1].mw - a[1].mw).map(([k, v]) => ({ kelas: "kg-tc-" + k, w: (v.mw / mwMaks) * 100, nilai: num(v.mw, 0), tip: { judul: t("ih.tek." + k), baris: [[t("kg.tt.mw"), `${num(v.mw, 0)} MW`], [t("kg.tt.n"), String(v.n)], [t("kg.tt.pangsa"), `${num((v.mw / mwT) * 100, 0)}%`]] }, labelHtml: tekJetp(k) })));
  /* 4. pendana */
  const maksP = Math.max(...d.pemberi.map((r) => r.usd));
  batang($("g-pendana"), d.pemberi.map((r) => { const o = orgDari(r.pemberi); return { kelas: "kg-lm-" + o.lm, w: (r.usd / maksP) * 100, nilai: n1(r.usd / 1e9, 1), labelHtml: `${logo(o.logo)}<span class="kg-nm">${esc(o.s)}</span>${bendera(o.iso)}`,
    tip: { judul: r.pemberi, img: logo(o.logo), baris: [[t("kg.tt.total"), `US$ ${n1(r.usd / 1e9, 2)} ${t("kg.u.miliar")}`], ...(kurs ? [[t("kg.tt.rp"), t("kg.tt.rp_v", { v: num((r.usd * kurs) / 1e12, 0) })]] : []), [t("kg.tt.proyek"), String(r.jumlah_proyek)], [t("kg.tt.jenis"), t("kg.lm." + o.lm)], [t("kg.c.bukti"), t("kg.bukti." + r.tingkat_bukti)]], cat: kurs ? t("kg.tt.kurs", { k: num(kurs, 0) }) : "" } }; }));
  /* 5. tetangga */
  const u = [...d.tetangga].sort((a, b) => b.ebt_persen - a.ebt_persen), asean = d.tetangga.filter((r) => r.iso3 !== "IND"), rata = asean.reduce((a, r) => a + r.ebt_persen, 0) / asean.length, atas = Math.ceil(Math.max(...u.map((r) => r.ebt_persen)) / 10) * 10;
  batang($("g-tetangga"), u.map((r, i) => ({ kelas: r.iso3 === "IDN" ? "kg-tid" : "kg-tlain", w: (r.ebt_persen / atas) * 100, nilai: `${n1(r.ebt_persen, 1)}%`, labelHtml: `${bendera(ISO2[r.iso3], 24)}<span class="kg-nm">${esc(t("ih.neg." + r.iso3))}</span>`,
    tip: { judul: t("ih.neg." + r.iso3), img: bendera(ISO2[r.iso3], 24), baris: [[t("kg.c.ebt"), `${n1(r.ebt_persen, 1)}%`], [`${t("kg.c.fosil")} ${t("an.est")}`, `${n1(r.fosil_persen, 1)}%`], [t("kg.c.karbon"), r.intensitas_gco2_kwh == null ? "-" : num(r.intensitas_gco2_kwh, 0)], [t("kg.tt.tahun"), String(r.tahun)], [t("kg.tt.peringkat"), t("kg.tt.peringkat_v", { n: i + 1, m: u.length })], [t("kg.tt.rata"), t("kg.tt.poin", { v: `${r.ebt_persen - rata > 0 ? "+" : ""}${n1(r.ebt_persen - rata, 1)}` })]] } })), { ref: { w: (rata / atas) * 100, label: `${t("kg.rata_asean")} ${n1(rata, 1)}%` } });
}

function jetpBaris() {
  const jp = d.jetp.proyek, ebtMw = jp.reduce((a, r) => a + (r.kapasitas_mw || 0), 0);
  const ub = (ik, nilai, satuan, label) => `<div class="kg-ub"><span class="jm-kpi-ik">${ikon(ik, 20)}</span><div><b>${esc(nilai)}${satuan ? `<span>${esc(satuan)}</span>` : ""}</b><small>${esc(label)}</small></div></div>`;
  $("k-jetp").innerHTML = ub("bintang", num(d.jetp.komitmen_usd_miliar, 0), t("kg.miliar_usd"), t("kg.k.komit")) + ub("tek-listrik", num(ebtMw, 0), "MW", t("kg.k.ebt")) + ub("proyek", num(jp.length, 0), "", t("kg.k.entri"))
    + `<div class="kg-mini"><h3>${esc(t("kg.mw_tek"))}</h3><div id="kg-mw"></div></div>`;
}

async function mulai() {
  $("kgIsi").innerHTML = hantuHtml(3);
  try { d = await muatData("keuangan_hijau.json"); } catch (e) { tampilGalat($("kgIsi"), mulai); return; }
  try { kurs = (await muatData("pendanaan.json")).kurs?.usd_idr || 0; } catch { kurs = 0; }
  try { [dIf, dTk, dReg] = await Promise.all([muatData("insentif_fiskal.json"), muatData("taksonomi_ojk.json"), muatData("regulasi.json")]); } catch { dIf = dTk = null; }
  const gambar = () => { ubin(); rangka(); if (dIf && dTk) rangka2(); jetpBaris(); bagan(); };
  gambar();
  saatBahasa(gambar);
  /* legenda kolom: chrome (aria-pressed) sinkron, grafik digambar ulang sesudah satu bingkai */
  $("kgIsi").addEventListener("click", (e) => {
    const b = e.target.closest(".kg-leg-b"); if (!b) return;
    const k = b.dataset.seri, mati = !HID.has(k);
    if (mati && HID.size >= KEL.length - 1) return;
    mati ? HID.add(k) : HID.delete(k); b.setAttribute("aria-pressed", String(!mati));
    nanti(bagan);
  });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; nanti(bagan); } }, 200));
}
/* ---------- exhibit 7 dan 8: insentif fiskal EBT dan taksonomi hijau OJK sektor energi ---------- */
const JIF = { "bea-masuk": ["industri", "kg2-j-bm"], "ppn-dtp": ["pembiayaan", "kg2-j-pd"], ppn: ["pembiayaan", "kg2-j-pn"], "ppnbm-dtp": ["elektrifikasi", "kg2-j-pb"], "tax-allowance": ["efisiensi", "kg2-j-ta"], "tax-holiday": ["transisi-adil", "kg2-j-th"] };
const pilJif = (j) => pilK(JIF[j][1], IT(JIF[j][0]), t("kg2.j." + j));
const srcDari = (dat, catatan) => sumberLipat(dat.sumber.map((x) => ({ sumber: x.penerbit, halaman: x.judul, url: x.url, tanggal: x.tanggal_akses })), catatan);
const adaKls = (x) => !!x && !/^N\/A/i.test(x);
const ambangH = (x) => { const m = /<\s*(\d+)\s*gCO2e\/kWh/.exec(x || ""); return m ? +m[1] : null; };
const ambangT = (x) => { const m = /(\d+)\s*dan\s*<\s*(\d+)\s*gCO2e\/kWh/.exec(x || ""); return m ? [+m[1], +m[2]] : null; };

function kartuIf(r) {
  const reg = r.regulasi_id && dReg.baris.find((x) => x.id === r.regulasi_id), ber = r.status_berlaku === "berlaku";
  const unduh = unduhRegHtml(reg || { judul: r.nomor_aturan, url_sumber: r.sumber_url });
  return `<li class="kg2-kt${ber ? "" : " kg2-mati"}"><div class="kg2-pils">${pilJif(r.jenis_insentif)}${pilK(ber ? "kg2-s-ok" : "kg2-s-no", ikon(ber ? "centang" : "silang", 14), t(ber ? "kg2.berlaku" : "kg2.tidak"))}</div>
    <h3>${esc(r.instrumen)}</h3>
    <p class="kg2-un"><span>${esc(t("kg2.untuk"))}</span> ${esc(r.teknologi.join(", "))}</p>
    <div class="kg2-dasar"><div><small>${esc(t("kg2.dasar"))}</small><b>${esc(r.nomor_aturan)}</b><small>${esc(t("kg2.sejak", { tgl: r.tanggal_berlaku }))}</small></div>${unduh}</div>
    ${r.regulasi_id && reg ? `<a class="jm-tbl kg2-reg" href="/regulasi?id=${encodeURIComponent(r.regulasi_id)}">${ikon("regulasi", 16)}${esc(t("kg2.regulasi"))}</a>` : ""}</li>`;
}

function rangka2() {
  const B = dIf.baris, ber = B.filter((r) => r.status_berlaku === "berlaku").length, TB = dTk.baris, hj = TB.filter((r) => adaKls(r.klasifikasi_hijau_eo1)).length, kr = dTk.meta.kerangka;
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: false }), tingkat: "h2" });
  const urut = [...B].sort((a, b) => (b.status_berlaku === "berlaku") - (a.status_berlaku === "berlaku"));
  const leg = (kunci, arr, kls) => `<div class="kg2-lg"><small>${esc(t(kunci))}</small><span class="kg2-lgp">${arr.map((x) => `<span class="jm-pil-tek kg-pil ${kls}">${esc(x)}</span>`).join("")}</span></div>`;
  const hasil = (kr.hasil_penilaian || []).map((x) => `<span class="jm-pil-tek kg-pil ${/^Hijau/.test(x) ? "kg2-h" : /^Transisi/.test(x) ? "kg2-t" : "kg2-0"}">${esc(x)}</span>`).join("");
  $("kgIsi").insertAdjacentHTML("beforeend",
    ex({ id: "insentif", ikon: "kalkulator", topik: t("kg2.ey.insentif"), judulHtml: hlHtml("kg2.t.insentif", String(B.length), { n: ber }), subHtml: esc(t("kg2.s.insentif")),
      isiHtml: `<ul class="kg2-kartu">${urut.map(kartuIf).join("")}</ul>${srcDari(dIf, t("kg2.cat.insentif"))}` }) +
    ex({ id: "taksonomi", ikon: "perisai", topik: t("kg2.ey.taks"), judulHtml: hlHtml("kg2.t.taks", String(TB.length), { h: hj }), subHtml: esc(t("kg2.s.taks")),
      isiHtml: `<div class="kg2-legenda"><div class="kg2-lg"><small>${esc(t("kg2.leg.hasil"))}</small><span class="kg2-lgp">${hasil}</span></div>${leg("kg2.leg.eo", kr.tujuan_lingkungan || [], "kg2-eo")}${leg("kg2.leg.ec", kr.kriteria_esensial || [], "kg2-ec")}<p class="jm-bantu">${esc(t("kg2.leg.versi"))}: ${esc(kr.versi || "")}</p></div><div id="tb-taks" class="ih-tabel kg-tb"></div>${srcDari(dTk, t("kg2.cat.taks"))}` }));
  const kls = (x) => (adaKls(x) ? 1 : 0), pilH = (r) => (adaKls(r.klasifikasi_hijau_eo1) ? pilK("kg2-h", ikon("centang", 14), t("kg2.hijau")) : "-"), pilT = (r) => (adaKls(r.klasifikasi_transisi_eo1) ? pilK("kg2-t", ikon("peringatan", 14), t("kg2.transisi")) : "-");
  tabel($("tb-taks"), { satuan: "kg2.u.aktivitas", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("kg2.c.aktivitas"), v: (r) => r.aktivitas, f: (r) => `<span class="kg2-akt" title="${esc(r.klasifikasi_hijau_eo1 || r.klasifikasi_transisi_eo1 || t("kg2.tdk_terbaca"))}"><b>${esc(r.aktivitas)}</b><small>KBLI ${esc(r.kbli_2017)}${r.kriteria_terbaca ? "" : " | " + esc(t("kg2.tdk_terbaca"))}</small></span>` },
    { label: t("kg2.c.hijau"), v: (r) => kls(r.klasifikasi_hijau_eo1), f: pilH },
    { label: t("kg2.c.transisi"), v: (r) => kls(r.klasifikasi_transisi_eo1), f: pilT },
    { label: t("kg2.c.ambang_h"), num: true, v: (r) => ambangH(r.klasifikasi_hijau_eo1), f: (r) => { const v = ambangH(r.klasifikasi_hijau_eo1); return v == null ? "-" : esc(t("kg2.amb_h", { v: num(v) })); } },
    { label: t("kg2.c.ambang_t"), num: true, v: (r) => ambangT(r.klasifikasi_transisi_eo1)?.[1] ?? null, f: (r) => { const v = ambangT(r.klasifikasi_transisi_eo1); return v ? esc(t("kg2.amb_t", { a: num(v[0]), b: num(v[1]) })) : "-"; } },
    { label: t("kg2.c.bukti"), v: (r) => r.halaman_pdf, f: (r) => (/^https?:\/\//.test(r.sumber_url) ? `<a class="jm-tbl kg2-bukti" href="${esc(r.sumber_url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("kg2.buka"))}">${ikon("pdf", 16)}${esc(t("kg2.hal", { n: r.halaman_pdf }))}</a>` : "-") },
  ], baris: TB });
}

await mulai();
