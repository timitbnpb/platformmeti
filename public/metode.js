/* /metode: cara kerja data (alur), tingkat bukti, katalog sumber, metode per kartu (akordeon + rumus), isi angka, batasan dan kutipan. Daftar isi lengket.
   Teks dari kamus; katalog sumber dari /data/sumber_katalog.json (scripts/pipa/katalog_sumber.mjs). */
import { mulaiHalaman } from "/inti/kepala.js";
import { buktiHtml } from "/inti/bukti.js";
import { esc, ikon, debounce } from "/inti/umum.js";
import { t, tanggal, bahasa } from "/i18n.js";
import { exHtml, sumberHtml, cariHtml, pilihHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { muatData, saatBahasa } from "/analisis.js";
import { khUbin } from "/inti/kh.js";
import { num, muatPotret, estPil, pasangTabel, urlAman } from "/proyek_besar_umum.js";
import { pilTek } from "/inti/ikon_tek.js";
import { logoOrg } from "/inti/logo_org.js";
import { HALAMAN, GRUP_H, isiHalaman, paramHalaman } from "/metode_halaman.js";

const $ = (id) => document.getElementById(id);
const DAFTAR = [
  ["pipeline", "pip"], ["terlambat", "tel"], ["celah", "cel"], ["plts", "plt"], ["bauran", "mix"], ["regulasi", "reg"], ["berita", "ber"],
  ["jetp", "fin"], ["karbon", "kar"], ["tarif", "trf"], ["asean", "asn"],
  ["t-kap", "tk"], ["t-pip", "tp"], ["t-reg", "tr"], ["t-ber", "tb"], ["t-kar", "tkar"], ["t-asn", "ta"],
];
const GRUP = [["insight", "insight"], ["transisi", "linimasa"]];
let tgl = "", target = 100, PB = null, KAT = null, IDX = null;
const S = { q: "", g: "", hal: 1, uk: "diperbarui", ua: -1, qs: "", qb: "", qd: "" };
const PER = 10;

/* ---------- daftar isi: lengket, berkelompok, bisa dicari; item aktif mengikuti bagian yang terlihat ---------- */
const singkat = (id) => t("met.h." + id + ".j").split(":")[0];
const ISI_TOC = { indeks: [["metode-kartu", "kalkulator", () => t("met.ex.kartu.ey")]], proyek: [["apa-isi-angka", "analisis", () => t("mak.ey")]] };
function itemToc() {
  const atas = [["cara-kerja", "rantai", t("met.toc.cara")], ["tingkat-bukti", "perisai", t("met.toc.bukti")], ["sumber-data", "buku", t("met.toc.sumber")]];
  const grup = GRUP_H.map((g) => [t("met.hg." + g), [...HALAMAN.filter((h) => h.g === g).map((h) => [h.id, h.ik, singkat(h.id)]), ...(ISI_TOC[g] || []).map(([id, ik, f]) => [id, ik, f()])]]);
  return { atas, grup, akhir: [["batasan", "info", t("met.toc.batas2")]] };
}
const aToc = ([id, ik, lab]) => `<li><a href="#${id}" data-toc="${id}" title="${esc(lab)}">${ikon(ik, 16)}<span>${esc(lab)}</span></a></li>`;
function toc() {
  const { atas, grup, akhir } = itemToc();
  $("metToc").innerHTML = `<div class="met-toc-k met-toc"><p class="met-toc-j">${ikon("daftar", 16)}<span>${esc(t("met.toc"))}</span></p>
    <div class="met-toc-cari">${cariHtml({ id: "metCariToc", label: t("met.h.cari"), placeholder: t("met.h.cari") })}</div>
    <div class="met-toc-gl"><ol>${atas.map(aToc).join("")}</ol>${grup.map(([g, it]) => `<p class="met-toc-g">${esc(g)}</p><ol>${it.map(aToc).join("")}</ol>`).join("")}<ol class="met-toc-akhir">${akhir.map(aToc).join("")}</ol><p class="jm-bantu met-toc-kosong" id="metTocKosong" hidden>${esc(t("met.h.kosong"))}</p></div></div>`;
  $("metCariToc").addEventListener("input", debounce((e) => saringToc(e.target.value)));
}
const bagian = (id) => $(id);
function saringToc(q) {
  q = q.trim().toLocaleLowerCase(); let n = 0;
  for (const a of $("metToc").querySelectorAll("a[data-toc]")) {
    const el = bagian(a.dataset.toc), ok = !q || (el?.textContent.toLocaleLowerCase().includes(q) ?? false);
    a.closest("li").hidden = !ok; if (el) el.hidden = !ok; if (ok) n++;
  }
  for (const p of $("metToc").querySelectorAll(".met-toc-g")) p.hidden = !q ? false : [...p.nextElementSibling.children].every((li) => li.hidden);
  $("metTocKosong").hidden = n > 0;
}
let pengamat = null; const terlihat = new Set();
function tandai() {
  const urut = [...$("metToc").querySelectorAll("a[data-toc]")], id = urut.map((a) => a.dataset.toc).find((i) => terlihat.has(i));
  if (!id) return;
  for (const a of urut) { const on = a.dataset.toc === id; a.toggleAttribute("aria-current", on); if (on) { const gl = a.closest(".met-toc-gl"); if (gl && gl.scrollHeight > gl.clientHeight) gl.scrollTop = Math.max(0, a.offsetTop - gl.offsetTop - gl.clientHeight / 2); } }
}
function pantau() {
  pengamat?.disconnect(); terlihat.clear();
  pengamat = new IntersectionObserver((es) => { for (const e of es) e.isIntersecting ? terlihat.add(e.target.id) : terlihat.delete(e.target.id); tandai(); }, { rootMargin: "-80px 0px -55% 0px" });
  for (const a of $("metToc").querySelectorAll("a[data-toc]")) { const el = bagian(a.dataset.toc); if (el) pengamat.observe(el); }
}

/* ---------- cara kerja: alur bergambar ---------- */
const LANGKAH = [["unduh", "panen"], ["rantai", "sambung"], ["kalkulator", "hitung"], ["perisai", "label"], ["orang", "kurasi"], ["centang", "terbit"]];
function alur() {
  const W = 1200, x = (i) => 100 + i * 200;
  const svg = `<svg class="met-alur-svg" viewBox="0 0 ${W} 80" role="img" aria-label="${esc(t("met.alur.alt"))}"><line x1="${x(0)}" y1="40" x2="${x(5)}" y2="40" class="met-garis"/>${LANGKAH.map(([ik], i) => `<circle cx="${x(i)}" cy="40" r="30" class="met-bulat"/><svg x="${x(i) - 14}" y="26" width="28" height="28" class="met-ikon-s"><use href="/img/ikon.svg#i-${ik}"/></svg>`).join("")}</svg>`;
  return `${svg}<ol class="met-alur">${LANGKAH.map(([ik, k], i) => `<li class="met-lk"><span class="met-lk-ik">${ikon(ik, 22)}</span><em>${esc(t("met.alur.langkah", { n: i + 1 }))}</em><h3>${esc(t("met.alur." + k + ".j"))}</h3><p>${esc(t("met.alur." + k))}</p></li>`).join("")}</ol>
  <div class="met-prinsip"><span class="met-p-ik">${ikon("perisai", 20)}</span><p>${esc(t("met.alur.prinsip"))}</p></div>`;
}

/* ---------- tingkat bukti ---------- */
const BUKTI = [["resmi", "jm-pil-ok", "Resmi"], ["kajian", "met-p-kajian", "Kajian"], ["media", "jm-pil-warn", "Media"], ["kata", "met-p-kata", ""], ["est", "met-p-est", "EST"], ["hip", "met-p-hip", "Hipotesis"], ["turunan", "met-p-est", ""], ["tinjau", "met-p-tinjau", ""]];
function bukti() {
  return `<ul class="met-bukti">${BUKTI.map(([k, kls, lab]) => `<li class="met-bk"><span class="jm-pil ${kls}">${esc(lab || t("met.tb." + k + ".j"))}</span><h3>${esc(t("met.tb." + k + ".j"))}</h3><p>${esc(t("met.tb." + k))}</p><p class="met-contoh"><b>${esc(t("met.contoh"))}</b> ${esc(t("met.tb." + k + ".contoh"))}</p></li>`).join("")}</ul>`;
}

/* ---------- katalog sumber ---------- */
const LOGO = [[/ESDM|Ketenagalistrikan|Energi dan Sumber/i, "/img/logo/esdm.png"], [/\bPLN\b/i, "/img/logo/pln.png"], [/Kemenkeu|DJPPR/i, "/img/logo/kemenkeu.png"], [/METI/i, "/img/logo/meti.png"], [/Pertamina/i, "/img/logo/pertamina.png"], [/Perindustrian/i, ""]];
const inisial = (n) => String(n || "?").replace(/\(.*?\)/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const warna = (n) => [...String(n)].reduce((a, c) => (a + c.charCodeAt(0)) % 5, 0);
const lg = (n) => { const f = LOGO.find(([re, u]) => u && re.test(n)); const u = f ? f[1] : logoOrg("", n)[0]; return `<span class="met-lg${u ? "" : " met-m" + warna(n)}">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : esc(inisial(n))}</span>`; };
const BUKTI_TB = { resmi: ["jm-pil-ok", "perisai"], "via-pihak-ketiga": ["met-p-kajian", "tautan"], "kata-pihak": ["met-p-kata", "orang"], media: ["jm-pil-warn", "berita"], kajian: ["met-p-kajian", "kajian"] };
const labDs = (k) => { const x = "met.ds." + k; const v = t(x); return v === x ? k.replace(/_/g, " ") : v; };
const labBk = (k) => { const x = "met.bk." + k; const v = t(x); return v === x ? k : v; };
const pilBukti = (k) => { if (!k) return "-"; const [kls, ik] = BUKTI_TB[k] || ["", "info"]; return `<span class="jm-pil met-pbk ${kls}">${ikon(ik, 14)}<span>${esc(labBk(k))}</span></span>`; };
const URUT = { sumber: (r) => r.judul, dataset: (r) => labDs(r.dataset), lisensi: (r) => r.lisensi || "~", tahun: (r) => r.tahun ?? 0, diperbarui: (r) => r.diperbarui || "", bukti: (r) => r.tingkat_bukti || "~" };
function sumberRows() {
  const q = S.qs.trim().toLocaleLowerCase();
  let b = KAT.baris.filter((r) => (!q || [r.judul, r.penerbit, labDs(r.dataset), r.lisensi].join(" ").toLocaleLowerCase().includes(q)) && (!S.qb || (r.tingkat_bukti || "-") === S.qb) && (!S.qd || r.dataset === S.qd));
  const f = URUT[S.uk]; if (f) b = [...b].sort((x, y) => { const p = f(x), z = f(y); return (typeof p === "number" ? p - z : String(p).localeCompare(String(z), "id")) * S.ua; });
  return b;
}
const lisensiPendek = (l) => { const x = l ? l.split(/[;(]/)[0].trim() : ""; return x.length > 28 ? x.slice(0, 26).trim() + "..." : x; };
function tabelSumber() {
  const rows = sumberRows(), maks = Math.max(1, Math.ceil(rows.length / PER)); S.hal = Math.min(S.hal, maks);
  const th = (k, kelas = "") => `<th scope="col" class="${kelas}" aria-sort="${S.uk === k ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${k}">${esc(t("met.sc." + k))}</button></th>`;
  const isi = rows.slice((S.hal - 1) * PER, S.hal * PER).map((r) => `<tr><td data-label="${esc(t("met.sc.sumber"))}" class="met-nama"><span class="met-nm">${lg(r.penerbit)}<span><b title="${esc(r.judul)}">${esc(r.judul)}</b><small>${esc(r.penerbit || "-")}</small></span></span></td>
    <td data-label="${esc(t("met.sc.dataset"))}"><span class="jm-pil met-pds">${ikon("tabel", 14)}<span>${esc(labDs(r.dataset))}</span></span></td>
    <td data-label="${esc(t("met.sc.bukti"))}">${r.tingkat_bukti ? buktiHtml(r.tingkat_bukti, { sumber: r.judul, tanggal: r.diperbarui }) : "-"}</td>
    <td data-label="${esc(t("met.sc.lisensi"))}">${r.lisensi ? `<span class="jm-pil met-pli" title="${esc(r.lisensi)}">${esc(lisensiPendek(r.lisensi))}</span>` : `<span class="met-kosong">${esc(t("met.belum_dicatat"))}</span>`}</td>
    <td data-label="${esc(t("met.sc.tahun"))}" class="met-n">${r.tahun ? esc(String(r.tahun)) : "-"}</td>
    <td data-label="${esc(t("met.sc.diperbarui"))}" class="met-n">${r.diperbarui ? esc(tanggal(r.diperbarui)) : "-"}</td>
    <td data-label="${esc(t("met.sc.tautan"))}" class="met-tt">${urlAman(r.url) ? `<a class="met-ik" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("met.buka_sumber"))}" aria-label="${esc(t("met.buka_sumber"))}: ${esc(r.judul)}">${ikon("tautan", 18)}</a>` : ""}</td></tr>`).join("") || `<tr><td colspan="7">${esc(t("met.tak_ada"))}</td></tr>`;
  $("metSumberT").innerHTML = `<div class="jm-gulir"><table class="jm-tabel met-t" data-urut="tidak"><thead><tr>${th("sumber", "met-nama")}${th("dataset")}${th("bukti")}${th("lisensi")}${th("tahun", "met-n")}${th("diperbarui", "met-n")}<th scope="col" class="met-tt">${esc(t("met.sc.tautan"))}</th></tr></thead><tbody>${isi}</tbody></table></div>${paginasiHtml({ hal: S.hal, total: rows.length, per: PER, satuan: "met.u" })}`;
}
function sumberSeksi(ex) {
  if (!KAT) return "";
  const bk = [...new Set(KAT.baris.map((r) => r.tingkat_bukti || "-"))].sort(), ds = [...new Set(KAT.baris.map((r) => r.dataset))].sort((a, b) => labDs(a).localeCompare(labDs(b), "id"));
  return ex({ id: "sumber-data", ikon: "buku", topik: t("met.sc.ey"), judulHtml: hlHtml("met.sc.j", num(KAT.jumlah), { d: num(KAT.dataset) }), subHtml: esc(t("met.sc.sub")),
    isiHtml: `<div class="met-alat">${cariHtml({ id: "metCariS", label: t("met.sc.cari"), placeholder: t("met.sc.cari") })}${pilihHtml({ id: "metSaringB", ikon: "perisai", label: t("met.sc.bukti"), opsi: [["", t("met.sc.bukti")], ...bk.map((k) => [k, k === "-" ? "-" : labBk(k)])] })}${pilihHtml({ id: "metSaringD", ikon: "tabel", label: t("met.sc.dataset"), opsi: [["", t("met.sc.dataset")], ...ds.map((k) => [k, labDs(k)])] })}</div><div id="metSumberT"></div><p class="rp-cat met-cat">${ikon("info", 14)}<span>${esc(t("met.sc.cat", { tgl: tanggal(KAT.dibangun_pada) }))}</span></p>` });
}

/* ---------- metode per kartu: akordeon ---------- */
function daftarKartu() {
  const tahun = Number(tgl.slice(0, 4)) || "";
  return [
    ...DAFTAR.map(([id, k]) => ({ id: "metode-" + id, grup: id.startsWith("t-") ? "transisi" : "insight", judul: t("ins.mt." + id), isi: t("ins." + k + ".cara", { tahun, target }), href: `/insight#ins-${id}` })),
  ];
}
let KARTU = [];
const akordeon = (c) => `<details class="met-akor" id="${esc(c.id)}" data-g="${c.grup}"><summary><span class="jm-pil met-g-${c.grup}">${ikon(GRUP.find(([g]) => g === c.grup)[1], 14)}<span>${esc(t("met.g." + c.grup))}</span></span><b>${esc(c.judul)}</b></summary><div class="met-akor-b"><p>${esc(c.isi)}</p>${c.rumus ? `<div class="met-rumus-w"><span class="met-rumus-l">${esc(t("met.rumus"))}</span><pre class="met-rumus">${esc(c.rumus)}</pre></div>` : ""}<a class="jm-tbl jm-tbl-kecil" href="${esc(c.href)}">${ikon("tautan", 16)}<span>${esc(t("met.lihat"))}</span></a></div></details>`;
function kartuSeksi(ex) {
  KARTU = daftarKartu();
  const seg = `<div class="met-seg" role="group" aria-label="${esc(t("met.g"))}"><button type="button" data-g="" aria-pressed="true">${ikon("daftar", 16)}<span>${esc(t("met.g.semua"))}</span><small>${num(KARTU.length)}</small></button>${GRUP.map(([g, ik]) => `<button type="button" data-g="${g}" aria-pressed="false">${ikon(ik, 16)}<span>${esc(t("met.g." + g))}</span><small>${num(KARTU.filter((c) => c.grup === g).length)}</small></button>`).join("")}</div>`;
  const umum = `<ul class="met-umum">${[["ins.cara1", "kalkulator"], ["ins.cara2", "perisai"], ["ins.cara3", "tingkat"], ["ins.cara4", "info"]].map(([k, ik]) => `<li><span class="met-bt-ik">${ikon(ik, 18)}</span><p>${esc(t(k))}</p></li>`).join("")}</ul>`;
  return ex({ id: "metode-kartu", ikon: "kalkulator", topik: t("met.ex.kartu.ey"), judulHtml: hlHtml("met.ex.kartu.j", num(KARTU.length)), subHtml: esc(t("met.ex.kartu.sub")),
    isiHtml: `${umum}<div class="met-alat met-alat-k">${cariHtml({ id: "metCari", label: t("met.cari"), placeholder: t("met.cari") })}${seg}</div><div class="met-akors" id="metAkors">${KARTU.map(akordeon).join("")}</div><p class="jm-bantu" id="metKosong" hidden>${esc(t("met.tak_ada"))}</p>` });
}
function saringKartu() {
  const q = S.q.trim().toLocaleLowerCase(); let n = 0;
  for (const c of KARTU) { const el = $(c.id); const ok = (!S.g || c.grup === S.g) && (!q || (c.judul + " " + c.isi).toLocaleLowerCase().includes(q)); el.hidden = !ok; if (ok) n++; }
  $("metKosong").hidden = n > 0;
}
function bukaHash() {
  const h = decodeURIComponent(location.hash.slice(1)); if (!h) return;
  const el = $(h) || (h.startsWith("peta-wilayah-") ? $("peta-wilayah") : h.startsWith("rapor-") ? $("rapor") : null);
  if (el?.tagName === "DETAILS") { el.hidden = false; el.open = true; }
  el?.scrollIntoView();
}

/* ---------- metode per halaman ---------- */
function halamanSeksi(g, ex, par) {
  return HALAMAN.filter((h) => h.g === g).map((h) => ex({ id: h.id, ikon: h.ik, topik: t("met.hg." + g), judulHtml: esc(t("met.h." + h.id + ".j")), subHtml: esc(t("met.h.sub")),
    aksiHtml: `<a class="jm-tbl jm-tbl-kecil" href="${esc(h.href)}">${ikon("tautan", 16)}<span>${esc(t("met.h.buka"))}</span></a>${h.lihat ? `<a class="jm-tbl jm-tbl-kecil" href="#${h.lihat}">${ikon("daftar", 16)}<span>${esc(t("met.lihat"))}</span></a>` : ""}`,
    isiHtml: isiHalaman(h, par, IDX) })).join("");
}

/* ---------- batasan, koreksi, kutipan ---------- */
function batas(ex) {
  const kutip = t("ins.kutip", { tanggal: tanggal(tgl, { gaya: "panjang" }) });
  const kartu = (ik, j, isi, aksi = "") => `<li class="met-bt"><span class="met-bt-ik">${ikon(ik, 20)}</span><div><h3>${esc(j)}</h3>${isi}${aksi}</div></li>`;
  const daftar = ["a", "b", "c", "d"].map((k) => `<li>${esc(t("met.bt.belum." + k))}</li>`).join("");
  const k1 = kartu("blokir", t("met.bt.belum"), `<ul class="met-pt">${daftar}</ul>`);
  const k2 = kartu("kalender", t("met.bt.baru"), `<p>${esc(t("met.bt.baru.isi", { tgl: tanggal(tgl) }))}</p>`);
  const aksi = `<div class="met-aksi"><a class="jm-tbl jm-tbl-kecil" href="/direktori?tampil=lembaga">${ikon("direktori", 16)}<span>${esc(t("met.bt.k.org"))}</span></a><a class="jm-tbl jm-tbl-kecil" href="/proyek">${ikon("proyek", 16)}<span>${esc(t("met.bt.k.proyek"))}</span></a></div>`;
  const k3 = kartu("ubah", t("met.bt.koreksi"), `<p>${esc(t("met.bt.koreksi.isi"))}</p>`, aksi);
  return ex({ id: "batasan", ikon: "info", topik: t("met.bt.ey"), judulHtml: esc(t("met.bt.j")), subHtml: esc(t("met.bt.sub")),
    isiHtml: `<ul class="met-bts">${[k1, k2, k3].join("")}</ul>
    <section class="met-kutip" aria-labelledby="metKutipJ"><span class="met-bt-ik">${ikon("salin", 20)}</span><div class="met-kutip-t"><h3 id="metKutipJ">${esc(t("an.kutip"))}</h3><p id="kutip">${esc(kutip)}</p></div><button type="button" class="jm-tbl" data-aksi="salin">${ikon("salin", 16)}<span>${esc(t("rp.salin"))}</span></button></section>` });
}

function ubin() {
  khUbin("metUbin", [{ ikon: "buku", nilai: KAT ? num(KAT.jumlah) : "-", label: t("met.u.sumber") }, { ikon: "tabel", nilai: KAT ? num(KAT.dataset) : "-", label: t("met.u.dataset") }, { ikon: "kalkulator", nilai: num(KARTU.length), label: t("met.u.kartu") }, { ikon: "kalender", nilai: tgl ? new Intl.DateTimeFormat(bahasa(), { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(tgl.slice(0, 7) + "-01T00:00:00Z")) : "-", label: t("met.u.tgl") }]);
}

function gambar() {
  $("jawab").textContent = t("met.jawab", { n: DAFTAR.length, tanggal: tanggal(tgl) });
  const sumber = sumberHtml(esc(t("met.jawab", { n: DAFTAR.length, tanggal: tanggal(tgl) })));
  const ex = (o) => exHtml({ aksiHtml: aksiHtml({ csv: false, png: false, pdf: false, bagi: false }) + sumber, ...o });
  const par = paramHalaman(Number(tgl.slice(0, 4)) || "", target);
  const kartuHtml = kartuSeksi(ex);
  $("semua-w").innerHTML = ex({ id: "cara-kerja", ikon: "rantai", topik: t("met.alur.ey"), judulHtml: esc(t("met.alur.j")), subHtml: esc(t("met.alur.sub")), isiHtml: alur() })
    + ex({ id: "tingkat-bukti", ikon: "perisai", topik: t("met.tb.ey"), judulHtml: esc(t("met.tb.j")), subHtml: esc(t("met.tb.sub")), isiHtml: bukti() })
    + sumberSeksi(ex)
    + GRUP_H.map((g) => halamanSeksi(g, ex, par) + (g === "indeks" ? kartuHtml : "") + (g === "proyek" ? '<div id="isi-w"></div>' : "")).join("")
    + '<div id="batas-w"></div>';
  toc();
  if (KAT) { $("metCariS")?.addEventListener("input", debounce((e) => { S.qs = e.target.value; S.hal = 1; tabelSumber(); })); $("metSaringB")?.addEventListener("change", (e) => { S.qb = e.target.value; S.hal = 1; tabelSumber(); }); $("metSaringD")?.addEventListener("change", (e) => { S.qd = e.target.value; S.hal = 1; tabelSumber(); }); tabelSumber(); }
  $("metCari").addEventListener("input", debounce((e) => { S.q = e.target.value; saringKartu(); }));
  saringKartu();
  isiAngka();
  $("batas-w").outerHTML = batas(ex);
  ubin(); pantau(); bukaHash();
}

const ALASAN = ["tidak_diungkap", "belum_bersumber", "di_luar_cakupan", "tidak_berlaku"];
const AK = { anak: ["gedung", "met-p-kajian"], penyimpanan: ["petir", "jm-pil-warn"], berhenti: ["blokir", "met-p-tinjau"], ganda: ["salin", "met-p-kata"] };
const pilAk = (a, extra = "") => { const [ik, kls] = AK[a] || ["info", ""]; return `<span class="jm-pil met-pbk ${kls}">${ikon(ik, 14)}<span>${esc(t("mak.ak." + a))}</span>${extra}</span>`; };
const logoKecil = (nama) => { const u = nama ? logoOrg("", nama)[0] : ""; return u ? `<span class="met-lg met-lg-k"><img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-galat="hapus"></span>` : `<span class="met-lg met-lg-k met-m${warna(nama || "-")}">${esc(inisial(nama))}</span>`; };
const kepalaKecil = (ik, teks) => `<h3 class="met-h3">${ikon(ik, 16)}<span>${teks}</span></h3>`;
function isiAngka() {
  if (!PB) return;
  const sumber = sumberHtml(esc(t("mak.sumber", { tgl: tanggal(PB.dibangun_pada, { gaya: "panjang" }) })));
  const anak = PB.dikeluarkan.find((x) => x.alasan === "anak" && /pertamina/i.test(x.dalam)) || PB.dikeluarkan.find((x) => x.alasan === "anak");
  const aturan = [["mak.a1", {}, "salin", ""], ["mak.a2", anak ? { anak: anak.nama, induk: anak.dalam, mw: num(anak.mw) } : { anak: "PGE", induk: "Pertamina", mw: "-" }, "gedung", anak ? `${anak.nama} ${num(anak.mw)} MW` : "PGE"], ["mak.a3", {}, "tautan", ""], ["mak.a4", { mw: PB.ambang_mw }, "kalkulator", `${num(PB.ambang_mw)} MW`], ["mak.a5", {}, "blokir", ""]];
  const F = PB.kerja.faktor, kt = Object.keys(F), kunciT = (k) => (k.startsWith("hidro") ? "hidro" : k);
  const faktorRow = kt.map((k) => ({ kunci: k, tek: kunciT(k), kon: F[k].konstruksi, man: F[k].manufaktur, om: F[k].om }));
  /* baris kembar (perusahaan sama, induk sama, alasan sama) digabung: MW dijumlah, jumlah baris ditulis */
  const gab = new Map();
  for (const r of PB.dikeluarkan) { const k = [r.nama, r.dalam, r.alasan].join("|"), x = gab.get(k); if (x) { x.mw += Number(r.mw) || 0; x.n++; } else gab.set(k, { ...r, mw: Number(r.mw) || 0, n: 1 }); }
  const keluar = [...gab.values()];
  const ringkas = Object.entries(PB.dikeluarkan.reduce((a, r) => { (a[r.alasan] ||= { n: 0, mw: 0 }); a[r.alasan].n++; a[r.alasan].mw += Number(r.mw) || 0; return a; }, {})).sort((x, y) => y[1].mw - x[1].mw);
  const bk = (ik, j, isi) => `<section class="met-mb">${kepalaKecil(ik, esc(j))}${isi}</section>`;
  $("isi-w").innerHTML = exHtml({ id: "apa-isi-angka", ikon: "analisis", topik: t("mak.ey"), judulHtml: esc(t("mak.j")), subHtml: esc(t("mak.s")), aksiHtml: aksiHtml({ csv: false }) + sumber,
    isiHtml: `<div class="mak">
      ${bk("daftar", t("mak.aturan"), `<ul class="met-ar">${aturan.map(([k, p, ik, pil]) => `<li class="met-ar-k"><span class="met-bt-ik met-ik-${ik}">${ikon(ik, 20)}</span><div><h4>${esc(t(k + ".j"))}</h4><p>${esc(t(k, p))}</p>${pil ? `<span class="jm-pil met-pds">${esc(pil)}</span>` : ""}</div></li>`).join("")}</ul>`)}
      <div id="mak-keluar">${bk("blokir", t("mak.keluar.j"), `<p class="met-p">${esc(t("mak.keluar.s"))}</p><ul class="met-rg">${ringkas.map(([a, v]) => `<li>${pilAk(a)}<b>${num(v.mw)} MW</b><small>${num(v.n)}</small></li>`).join("")}</ul><div id="makKeluar"></div>`)}</div>
      <div id="mak-kosong">${bk("info", t("mak.kosong.j"), `<ul class="met-lgd">${ALASAN.map((a) => `<li><span class="met-lgd-s" title="${esc(t("mak.al." + a))}">-</span><div><b>${esc(t("mak.al." + a))}</b><small>${esc(t("mak.al." + a + ".ket"))}</small></div></li>`).join("")}</ul><div id="makKosong"></div>`)}</div>
      <div id="faktor-kerja">${bk("orang", `${t("mak.kerja.j")} `, `<p class="met-p">${estPil()} ${esc(t("mak.kerja.s", { pengali: num(PB.kerja.pengali.nilai), ambang: PB.kerja.ambang_hidro }))}</p><div id="makFaktor"></div>
        <ul class="met-sb">${PB.kerja.sumber.map((s) => `<li>${urlAman(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul)}, ${esc(s.penerbit)}, ${esc(String(s.tahun))}</li>`).join("")}</ul>`)}</div>
    </div>` });
  pasangTabel($("makKeluar"), [["nama", "mak.c.baris", (r) => `<span class="met-nm">${logoKecil(r.nama)}<span><b>${esc(r.nama)}</b>${r.n > 1 ? `<small>${esc(t("met.h.n_baris", { n: r.n }))}</small>` : ""}</span></span>`], ["mw", "mak.c.mw", (r) => num(r.mw), "jm-num"], ["dalam", "mak.c.dalam", (r) => (r.dalam ? `<span class="met-nm">${logoKecil(r.dalam)}<span>${esc(r.dalam)}</span></span>` : "-")], ["alasan", "mak.c.alasan", (r) => pilAk(r.alasan)]],
    keluar, { k: "mw", arah: -1, hal: 1, turun: ["mw"] });
  const kos = Object.entries(PB.sel_kosong).map(([k, v]) => ({ kunci: t("mak.kol." + k), ...v }));
  pasangTabel($("makKosong"), [["kunci", "mak.c.kolom", (r) => esc(r.kunci)], ...ALASAN.map((a) => [a, "mak.al." + a, (r) => num(r[a]), "jm-num"])], kos, { k: "kunci", arah: 1, hal: 1, turun: ALASAN });
  pasangTabel($("makFaktor"), [["tek", "pj.c.tek", (r) => `${pilTek(r.tek)}${r.kunci.startsWith("hidro") ? ` <small class="jm-bantu">${esc(t(r.kunci === "hidro-besar" ? "mak.f.besar" : "mak.f.kecil", { ambang: PB.kerja.ambang_hidro }))}</small>` : ""}`], ["kon", "mak.f.kon", (r) => num(r.kon), "jm-num"], ["man", "mak.f.man", (r) => num(r.man), "jm-num"], ["om", "mak.f.om", (r) => num(r.om), "jm-num"]],
    faktorRow, { k: "tek", arah: 1, hal: 1, turun: ["kon", "man", "om"] });
  if (location.hash === "#apa-isi-angka" || location.hash === "#faktor-kerja") document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

function pasang() {
  document.addEventListener("click", (e) => {
    const sg = e.target.closest(".met-seg [data-g]");
    if (sg) { S.g = sg.dataset.g; for (const b of sg.parentElement.children) b.setAttribute("aria-pressed", String(b === sg)); saringKartu(); return; } // chrome urgent
    const uk = e.target.closest("button[data-uk]");
    if (uk && uk.closest("#metSumberT")) { const k = uk.dataset.uk; S.ua = S.uk === k ? -S.ua : 1; S.uk = k; S.hal = 1; tabelSumber(); return; }
    const h = e.target.closest("#metSumberT [data-hal]");
    if (h && !h.disabled) { S.hal = +h.dataset.hal; sorotHalaman(h, S.hal); tabelSumber(); return; }
    const sl = e.target.closest("[data-aksi=salin]"); if (sl) navigator.clipboard?.writeText($("kutip").textContent);
  });
  addEventListener("hashchange", bukaHash);
}

(async () => {
  await mulaiHalaman();
  try { tgl = (await muatData("ringkas.json")).dibangun_pada; } catch (e) { tgl = ""; }
  try { target = (await muatData("rantai_plts.json")).program.target_gwp; } catch (e) { target = 100; }
  try { PB = await muatPotret(); } catch (e) { PB = null; }
  try { KAT = await muatData("sumber_katalog.json"); } catch (e) { KAT = null; }
  gambar(); pasang();
  saatBahasa(gambar);
})();
