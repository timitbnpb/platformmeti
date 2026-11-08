/* /metode: satu bagian per halaman/kartu (langkah, rumus terlihat, bobot, sumber, keterbatasan). Isi disalin dari kunci kamus yang dipakai
   "Cara menghitung" di halaman asalnya; tidak ada rumus baru di sini. Jangkar stabil = id tiap entri (/metode#<id>). */
import { esc, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";

const PW = ["terpasang", "potensi", "hidro", "papua", "sisa", "proyek", "rued", "capaian", "peringkat"];
const RP = ["porsi", "banding", "nilai"];
const n = (p, a, b) => Array.from({ length: b - a + 1 }, (_, i) => p + (a + i));
/* l = langkah (kunci), r = rumus (kunci), k = [judul, isi, rumus?] kartu kecil, s = sumber (kunci), b = keterbatasan (kunci), bobot = indeks */
export const GRUP_H = ["peta", "peluang", "indeks", "biaya", "direktori", "proyek"];
export const HALAMAN = [
  { g: "peta", id: "peta-wilayah", ik: "wilayah", href: "/wilayah", l: ["wl.cara1", "wl.cara2", "wl.cara3", "wl.cara_profil"], k: PW.map((x) => ["met.pw." + x + ".j", "met.pw." + x]) },
  { g: "peta", id: "transisi", ik: "linimasa", href: "/transisi", l: ["tr.cara.celah", "tr.cara.tambah", "tr.cara.dekomp", "tr.cara.fk", "tr.cara.peta"] },
  { g: "peta", id: "emisi", ik: "petir", href: "/transisi", l: ["tr.cara.emisi", "met.pw.emisi"] },
  { g: "peta", id: "asean", ik: "asean", href: "/asean", l: n("as.cara", 1, 3) },
  { g: "peta", id: "topik", ik: "topik", href: "/topik", l: n("tk.cara.", 1, 4) },
  { g: "peluang", id: "peluang", ik: "analisis", href: "/peluang", l: n("pel.cara", 1, 4), r: n("pel.cara.f", 1, 4), s: n("pel.cara.b", 1, 4) },
  { g: "peluang", id: "cek-lokasi", ik: "sasaran", href: "/cek-lokasi", l: n("cl.m.l", 1, 5), r: ["cl.m.r1", "cl.m.r2"], b: ["cl.m.b1", "cl.m.b2"] },
  { g: "peluang", id: "plts-atap", ik: "tek-surya", href: "/peluang", l: n("plts.l", 1, 5) },
  { g: "peluang", id: "kelayakan", ik: "kalkulator", href: "/peluang", l: ["kl.cara1", "kl.cara2", "kl.cara3", "kl.cara4"], b: ["kl.cara5"] },
  { g: "peluang", id: "rantai-pasok", ik: "rantai", href: "/rantai", l: [...n("rt.cara", 1, 5), "rt.cara_tek"] },
  { g: "peluang", id: "baterai-ev", ik: "baterai", href: "/baterai-ev", l: n("bev.met.l", 1, 4), r: ["bev.met.r1", "bev.met.r2"], s: ["bev.met.s1"], b: n("bev.met.b", 1, 3) },
  { g: "peluang", id: "rantai-global", ik: "kapal", href: "/rantai-global", l: n("rg3.met.l", 1, 4), r: n("rg3.met.r", 1, 2), s: ["rg3.met.s1"], b: n("rg3.met.b", 1, 3) },
  { g: "peta", id: "jaringan", ik: "menara", href: "/jaringan", l: n("jr.met.l", 1, 4), r: ["jr.met.r1"], s: ["jr.met.s1"], b: n("jr.met.b", 1, 3) },
  { g: "peluang", id: "panas-bumi", ik: "panas-bumi", href: "/panas-bumi", l: n("pbm.met.l", 1, 4), r: n("pbm.met.r", 1, 2), s: ["pbm.met.s1"], b: n("pbm.met.b", 1, 3) },
  { g: "peluang", id: "surya", ik: "panel-surya", href: "/surya", l: n("sur.met.l", 1, 4), r: n("sur.met.r", 1, 2), s: ["sur.met.s1"], b: n("sur.met.b", 1, 3) },
  { g: "peluang", id: "bioenergi", ik: "bioenergi", href: "/bioenergi", l: n("bn.met.l", 1, 4), r: n("bn.met.r", 1, 2), s: ["bn.met.s1"], b: n("bn.met.b", 1, 3) },
  { g: "peluang", id: "hidrogen", ik: "hidrogen", href: "/hidrogen", l: n("h2.met.l", 1, 3), r: n("h2.met.r", 1, 2), s: ["h2.met.s1"], b: n("h2.met.b", 1, 2) },
  { g: "peluang", id: "transisi-pltu", ik: "pltu", href: "/transisi-pltu", l: n("tpl.met.l", 1, 4), r: n("tpl.met.r", 1, 2), s: ["tpl.met.s1"], b: n("tpl.met.b", 1, 3) },
  { g: "indeks", id: "indeks-kesiapan", ik: "metode", href: "/indeks", l: ["ix.m.ringkas"], r: ["ix.m.rumus.prov", "ix.m.rumus.proyek"], bobot: true, b: n("ix.m.lim.", 1, 4) },
  { g: "peta", id: "risiko-proyek", ik: "peringatan", href: "/risiko", l: ["rs3.lead"] },
  { g: "peta", id: "sistem-pln", ik: "sistem-listrik", href: "/sistem", l: ["sp2.bauran.narasi", "sp2.kapp.narasi", "sp2.celah.4"] },
  { g: "peta", id: "akses-energi", ik: "ponsel", href: "/akses-energi", l: ["akn.l.kap.n", "akn.d.lok.n"] },
  { g: "peta", id: "psn", ik: "mahkota", href: "/program#psn", l: ["psn.s.metode"] },
  { g: "indeks", id: "lelang", ik: "lelang", href: "/lelang", l: ["lel.n.banding", "lel.n.hitung", "lel.n.tabel"] },
  { g: "indeks", id: "transaksi", ik: "transaksi", href: "/transaksi", l: ["tr3.n.nilai", "tr3.n.tabel"] },
  { g: "indeks", id: "indeks-keyakinan", ik: "survei", href: "/indeks-keyakinan", l: n("ky.m.", 1, 4) },
  { g: "indeks", id: "strategi", ik: "tingkat", href: "/strategi", st: ["kesenjangan", "peta", "radar", "konsentrasi", "uang", "sinyal"] },
  { g: "indeks", id: "insight", ik: "insight", href: "/insight", l: n("ins.cara", 1, 4), lihat: "metode-kartu" },
  { g: "indeks", id: "rapor", ik: "presentasi", href: "/rapor", k: RP.map((x) => ["met.rp." + x + ".j", "met.rp." + x, "met.rp." + x + ".rumus"]) },
  { g: "indeks", id: "berita-analisis", ik: "berita", href: "/berita", k: ["ramai", "isu", "tren", "tier", "desak", "keb", "dunia"].map((x) => ["brt.an." + x + ".ey", "brt.an." + x + ".cara"]) },
  { g: "biaya", id: "biaya-listrik", ik: "kalkulator", href: "/biaya-listrik", k: [...["lcoe", "banding", "ebtfosil", "modul", "bpp"].map((x) => ["bl.ey." + x, "bl.n." + x]), ...["hba", "dmo", "tarif", "subsidi", "bbm"].map((x) => ["psl.ey." + x, "psl.n." + x])] },
  { g: "biaya", id: "model-keuangan", ik: "kalkulator", href: "/model-keuangan", l: ["mk.m.l1", "mk.m.l2", "mk.m.l3", "mk.m.l4"], r: ["mk.m.f1", "mk.m.f2"], b: ["mk.m.b1", "mk.m.b2"] },
  { g: "biaya", id: "investasi", ik: "medali", href: "/investasi", l: n("iv.cara", 1, 4), r: ["iv.cara.f1"], k: ["izin", "harga", "lahan", "sumber", "pendanaan", "jaringan"].map((x) => ["iv.kp." + x, "iv.met.cara." + x]), b: n("iv.cara.b", 1, 5) },
  { g: "biaya", id: "keuangan-hijau", ik: "berlian", href: "/keuangan-hijau", k: [["jetp", "fin"], ["karbon", "kar"], ["t-kar", "tkar"], ["tarif", "trf"]].map(([a, b]) => ["ins.mt." + a, "ins." + b + ".cara"]) },
  { g: "direktori", id: "sensus-organisasi", ik: "gedung", href: "/direktori?tampil=lembaga", l: ["oj.cara.isi"] },
  { g: "direktori", id: "pakar-riset", ik: "orang", href: "/direktori?tampil=pakar", l: ["tn.metode.isi"] },
  { g: "direktori", id: "beranda", ik: "beranda", href: "/", l: ["beranda.cara_isi"] },
  { g: "proyek", id: "proyek", ik: "proyek", href: "/proyek", l: ["pj.corong.cara"], k: [["kp.j.ey", "kp.j.metode"], ["kp.n.ey", "kp.n.metode"]] },
  { g: "proyek", id: "program", ik: "daftar", href: "/program", l: n("pg.cara.", 1, 4) },
];

const NAMA_BOBOT = (k) => t("ix.k." + k);
const P = (tahun, target) => new Proxy({ tahun, target, ambang: 10, pengali: "" }, { get: (o, k) => (k in o ? o[k] : "[" + String(k) + "]") });
const tk = (k, par) => t(k, par).replace(/^Cara menghitung:\s*/, "");
const li = (k, par, i) => `<li class="met-ls"><span class="met-ls-n">${i + 1}</span><p>${esc(tk(k, par))}</p></li>`;
const kartu = ([j, i, r], par) => `<li class="met-kc"><h4>${esc(t(j))}</h4><p>${esc(tk(i, par))}</p>${r ? `<pre class="met-rumus">${esc(t(r))}</pre>` : ""}</li>`;
const kepala = (ik, k) => `<h3 class="met-h3">${ikon(ik, 16)}<span>${esc(t(k))}</span></h3>`;
const rumusTampil = (k, par) => `<pre class="met-rumus">${esc(t(k, par))}</pre>`;

export function isiHalaman(h, par, IDX) {
  const b = [];
  if (h.l) b.push(`<div class="met-blok">${kepala("daftar", "met.h.langkah")}<ol class="met-lgs">${h.l.map((k, i) => li(k, par, i)).join("")}</ol></div>`);
  if (h.r) b.push(`<div class="met-blok">${kepala("kalkulator", "met.h.rumus")}${h.r.map((k) => rumusTampil(k, par)).join("")}</div>`);
  if (h.st) b.push(`<div class="met-blok">${kepala("kalkulator", "met.h.rumus")}<ul class="met-kcs">${h.st.map((x) => `<li class="met-kc"><h4>${esc(t("met.h.strategi." + x))}</h4>${rumusTampil("st.m." + x + ".rumus", par)}<p class="met-kc-b">${ikon("info", 14)}<span>${esc(t("st.m." + x + ".batas"))}</span></p></li>`).join("")}</ul></div>`);
  if (h.k) b.push(`<div class="met-blok">${kepala("kalkulator", h.k[0][2] ? "met.h.rumus" : "met.h.kartu")}<ul class="met-kcs">${h.k.map((x) => kartu(x, par)).join("")}</ul></div>`);
  if (h.bobot && IDX) {
    const tb = IDX.metode.provinsi.komponen.map((c) => `<tr><td data-label="${esc(t("ix.m.c.komp"))}"><b>${esc(NAMA_BOBOT(c.id))}</b></td><td class="jm-num" data-label="${esc(t("ix.p.bobot"))}">${esc(String(c.bobot))}</td><td data-label="${esc(t("ix.m.c.norma"))}">${esc(t("ix.norma." + c.normalisasi))}</td><td data-label="${esc(t("ix.m.c.sumber"))}">${esc(c.sumber.join("; "))}</td></tr>`).join("");
    b.push(`<div class="met-blok">${kepala("tabel", "met.h.bobot")}<div class="jm-gulir"><table class="jm-tabel met-tb" data-urut="tidak"><thead><tr>${["ix.m.c.komp", "ix.p.bobot", "ix.m.c.norma", "ix.m.c.sumber"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${tb}</tbody></table></div></div>`);
  }
  const sumber = h.s ? h.s.map((k) => t(k)) : [t("met.h." + h.id + ".s")];
  b.push(`<div class="met-blok">${kepala("buku", "met.h.sumber")}<ul class="met-sb">${sumber.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>`);
  if (h.b) b.push(`<div class="met-blok">${kepala("blokir", "met.h.batas")}<ul class="met-bts2">${h.b.map((k) => `<li>${ikon("info", 16)}<span>${esc(t(k))}</span></li>`).join("")}</ul></div>`);
  return `<div class="met-hb">${b.join("")}</div>`;
}
export const paramHalaman = (tahun, target) => P(tahun, target);
