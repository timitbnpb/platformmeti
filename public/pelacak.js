/* /pelacak?tek=<id>: satu cetakan halaman untuk 14 teknologi (FITUR-200 N01-N16). Data = potret statis /data/*.json; bagian tanpa isi tidak dirender.
   Turunan (jumlah, rerata) berpil EST. INP: segmen teknologi dan tabel menyalakan chrome seketika, isi berat menyusul lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, ada, tanggal, bahasa } from "/i18n.js";
import { navLokal, pasangLokal } from "/inti/paginasi.js";
import { esc, nanti, ikon, hantuHtml, fotoBerita } from "/inti/umum.js";
import { exHtml, terkaitHtml, lihatSemuaHtml, unduhRegHtml, sumberHtml as infoHtml } from "/inti/komponen.js";
import { tautProvinsi, tautOrg } from "/inti/tautan.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { sumberLipat, ubinHtml, batangHtml, pasangBar, num, amanUrl, tampilGalat, saatBahasa } from "/analisis.js";
import { kolomHtml, pasangKolom } from "/pelacak_grafik.js";
import { namaBaku } from "/inti/nama_baku.js";
import { pilStatus } from "/inti/ikon_tek.js";
import { namaMedia, logoLokal } from "/inti/nama_media.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { muat, namaRegulasi, kelasStatus, label } from "/publik.js";
import { TEK, TEK_AWAL, tekById, saring, ikonPelacak } from "/pelacak_cfg.js";
import { MODUL_PELACAK } from "/inti/rumah_tek.js";
import { tabelHtml, pasangTabel, gambarSemua } from "/pelacak_tabel.js";
import { industriHtml, logoHtml, gantiMonogram } from "/pelacak_industri.js";

const $ = (id) => document.getElementById(id);
const BATAS_LINI = 8;
let cfg, D = {}, X = {}, isi, indSiap = false;
const jumlah = (a) => a.reduce((s, x) => s + (x || 0), 0);
const nm = () => t("pl.tek." + cfg.id);
const kap = (p) => Number(p.kapasitas?.[0]?.nilai) || 0;
const cod = (p) => { const a = (p.cod_target || []).map((c) => c.nilai).filter(Number.isFinite); return a.length ? Math.min(...a) : null; };
const src = (kunci, tgl, url) => sumberLipat([{ sumber: t(kunci), url, tanggal: tgl }]);
const urut = (a, z) => String(z).localeCompare(String(a));
/* ss = kunci kalimat sub singkat; info = catatan panjang di ikon info; sub = sub apa adanya (kalimat pendek dari kamus lama) */
const bagian = (id, ik, kunci, { judulHtml, sub, ss, info, isiHtml, sumber = "", kakiHtml = "" }) =>
  isiHtml ? exHtml({ id, ikon: ik, topik: t(`pl.s.${kunci}.ey`), judulHtml, subHtml: ss ? esc(t(ss)) : sub || "", aksiHtml: aksiHtml({ csv: false }) + sumber + (info ? infoHtml(esc(info), t("pl.info")) : ""), isiHtml, kakiHtml }) : "";
const sub = (h) => `<h3 class="jm-tk-sub">${esc(h)}</h3>`;
const pasangSemua = (akar) => { pasangBar(akar); pasangKolom(akar); };

/* ---------- olah ---------- */

function olah() {
  const S = saring(cfg, D);
  const tren = cfg.tren ? D.tren.baris.filter((r) => cfg.tren.includes(r.teknologi)) : [];
  const thn = new Map(); for (const r of tren) thn.set(r.tahun, (thn.get(r.tahun) || 0) + (r.kapasitas_mw || 0));
  S.tren = [...thn].sort((a, z) => a[0] - z[0]).filter(([y]) => y >= 2011);
  const per = new Map(); for (const r of S.ruptl) { const y = r.cod_tahun?.[0]; if (y) per.set(y, (per.get(y) || 0) + (r.kapasitas_mw || 0)); }
  S.perTahun = [...per].sort((a, z) => a[0] - z[0]);
  S.ruptlMw = jumlah(S.ruptl.map((r) => r.kapasitas_mw));
  S.mw = jumlah(S.proyek.map(kap));
  S.atap = cfg.atap ? D.atap : null;
  return S;
}

/* ---------- kepala ---------- */

function gambarKepala(S) {
  document.title = t("pl.title", { nama: nm() });
  $("judul").textContent = nm();
  $("jawab").textContent = t("pl.lead." + cfg.id);
  const kand = [
    S.atap && { ikon: "analisis", nilai: num(S.atap.total.jumlah_mw), satuan: "MW", label: t("pl.u.kuota"), href: "#pl-angka", turunan: false },
    S.ruptlMw && { ikon: "rantai", nilai: num(S.ruptlMw), satuan: "MW", label: t("pl.u.ruptl"), href: "#pl-angka", turunan: true },
    S.proyek.length && { ikon: "proyek", nilai: num(S.proyek.length), satuan: S.mw ? `${num(S.mw)} MW` : "", label: t("pl.u.proyek"), href: "#pl-proyek", turunan: false },
    cfg.wkp && D.wkp?.baris?.length && { ikon: "peta", nilai: num(D.wkp.baris.length), satuan: "", label: t("pl.u.wkp"), href: "#pl-wkp", turunan: false },
    S.reg.length && { ikon: "regulasi", nilai: num(S.reg.length), satuan: "", label: t("pl.u.reg"), href: "#pl-reg", turunan: false },
    S.ber.length && { ikon: "berita", nilai: num(S.ber.length), satuan: "", label: t("pl.u.berita"), href: "#pl-berita", turunan: false },
  ].filter(Boolean);
  while (kand.length < 3) kand.push({ ikon: "linimasa", nilai: "2025-2060", satuan: "", label: t("pl.u.lini"), href: "#pl-lini", turunan: false }, { ikon: "gedung", nilai: cfg.ind ? t("pl.u.ya") : t("pl.u.belum"), satuan: "", label: t("pl.u.industri"), href: "#pl-industri", turunan: false });
  $("ubin").innerHTML = ubinHtml(kand.slice(0, 3));
}

/* ---------- bagian ---------- */

function sAngka(S) {
  let g = "", sumber = [], j;
  if (S.tren.length >= 3) {
    g += sub(t("pl.g.tren")) + kolomHtml(S.tren.map(([y, v]) => ({ label: String(y), v, tip: `${y}: ${num(v)} MW` })), { label: t("pl.g.tren") });
    sumber.push({ sumber: D.tren.sumber?.[0]?.judul, url: D.tren.sumber?.[0]?.url, tanggal: D.tren.dibangun_pada });
  }
  if (S.perTahun.length) {
    g += sub(t("pl.g.ruptl")) + kolomHtml(S.perTahun.map(([y, v]) => ({ label: String(y), v, tip: `${y}: ${num(v)} MW` })), { label: t("pl.g.ruptl") });
    sumber.push({ sumber: D.rup.sumber?.[0]?.judul, url: D.rup.sumber?.[0]?.url, tanggal: D.rup.meta.diperbarui });
    const puncak = S.perTahun.reduce((m, x) => (x[1] > m[1] ? x : m));
    j = hlHtml("pl.s.angka.j.ruptl", num(S.ruptlMw), { tahun: puncak[0], n: S.ruptl.length });
  }
  if (S.atap) {
    const per = Object.entries(S.atap.total.per_tahun).map(([y, v]) => ({ label: y, v, tip: `${y}: ${num(v)} MW` }));
    g += sub(t("pl.g.atap")) + kolomHtml(per, { label: t("pl.g.atap") });
    sumber.push({ sumber: D.atap.sumber[0]?.judul, halaman: S.atap.total.halaman, url: D.atap.sumber[0]?.url, tanggal: D.atap.meta.diperbarui });
    j = hlHtml("pl.s.angka.j.atap", num(S.atap.total.jumlah_mw), {});
  }
  if (S.proyek.length) {
    const st = new Map(); for (const p of S.proyek) { const k = p.status?.[0]?.nilai || "tidak-diketahui"; st.set(k, (st.get(k) || 0) + 1); }
    const baris = [...st].sort((a, z) => z[1] - a[1]).map(([k, n]) => ({ label: label("pj.st.", k), labelHtml: pilStatus(k), bagian: [{ nilai: n, kelas: "jm-an-b1" }], teks: num(n) }));
    g += `<h3 class="jm-tk-sub">${esc(t("pl.g.status"))}</h3>${batangHtml(baris, { maks: Math.max(...baris.map((b) => b.bagian[0].nilai)), label: t("pl.g.status") })}`;
    sumber.push({ sumber: t("pl.src.proyek"), tanggal: D.proyek_tgl });
    j ||= hlHtml(S.mw ? "pl.s.angka.j.proyek" : "pl.s.angka.j.proyek0", num(S.proyek.length), { mw: num(S.mw), nama: nm() });
  }
  if (!g) return exHtml({ id: "pl-angka", ikon: "analisis", topik: t("pl.s.angka.ey"), judulHtml: esc(t("pl.s.angka.j.nol", { nama: nm() })), subHtml: esc(t("pl.s.angka.sub.nol")), isiHtml: `<p class="jm-bantu">${esc(t("pl.butuh.ket"))} <span class="jm-pil jm-pil-warn">${esc(t("pl.butuh"))}</span></p>` });
  return bagian("pl-angka", "analisis", "angka", { judulHtml: j, ss: "pl.ss.angka", info: t("pl.s.angka.sub"), isiHtml: `<div class="jm-tek-${esc(cfg.warna)}">${g}</div>`, sumber: sumberLipat(sumber) });
}

function selNama(p) {
  const k = p.kapasitas?.[0], fid = (p.berita_ids || []).find((b) => fotoBerita(D.foto, b)), foto = fid ? fotoBerita(D.foto, fid) : "";
  const ubin = foto ? `<span class="jm-tk-pt"><img src="${esc(foto)}" alt="" width="64" height="48" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`
    : `<span class="jm-tk-pt jm-tk-pt-k jm-tek-${esc(cfg.warna)}">${ikonPelacak(cfg.id)}${k ? `<b>${esc(num(k.nilai, 0))}</b><small>${esc(k.satuan)}</small>` : ""}</span>`;
  const pem = p.pihak?.pemilik?.[0]?.nilai;
  return `<span class="jm-tk-pj">${ubin}<span class="jm-tk-pj-t"><a href="/p/${esc(p.id)}">${esc(namaProyek(p))}</a>${pem ? `<small>${tautOrg(pem)}</small>` : ""}</span></span>`;
}
function sProyek(S) {
  if (!S.proyek.length) return "";
  return bagian("pl-proyek", "proyek", "proyek", {
    judulHtml: hlHtml(S.mw ? "pl.s.proyek.j" : "pl.s.proyek.j0", num(S.proyek.length), { mw: num(S.mw) }), ss: "pl.ss.proyek",
    isiHtml: tabelHtml("tb-proyek", { urut: "kap", arah: -1, satuan: "jm.pag.u.proyek", baris: S.proyek, kolom: [
      { k: "nama", j: "tk.c.nama", u: (p) => namaProyek(p), sel: selNama },
      { k: "prov", j: "tk.c.prov", u: (p) => p.lokasi?.provinsi, sel: (p) => (p.lokasi?.provinsi ? tautProvinsi(p.lokasi.provinsi) : `<span class="jm-tk-redup">${esc(t("tk.lokasi_belum"))}</span>`) },
      { k: "kap", j: "tk.c.kap", u: kap, desc: 1, kelas: "jm-num", sel: (p) => (p.kapasitas?.[0] ? `${esc(num(p.kapasitas[0].nilai, 1))} ${esc(p.kapasitas[0].satuan)}` : "-") },
      { k: "st", j: "tk.c.status", u: (p) => p.status?.[0]?.nilai, kelas: "jm-tengah", sel: (p) => pilStatus(p.status?.[0]?.nilai || "tidak-diketahui") },
      { k: "cod", j: "tk.c.cod", u: cod, kelas: "jm-num", sel: (p) => cod(p) ?? "-" },
    ] }), sumber: src("pl.src.proyek", D.proyek_tgl),
  });
}

/* N01: per waduk, luas genangan belum dipanen */
const WADUK = /cirata|jatigede|jatiluhur|saguling|gajah mungkur|karangkates|tembesi|singkarak|batam|kedung ombo|wonogiri/i;
function sWaduk(S) {
  if (!cfg.waduk || !S.proyek.length) return "";
  const g = new Map();
  for (const p of S.proyek) { const k = (p.nama.match(WADUK)?.[0] || p.nama).replace(/^./, (c) => c.toUpperCase()); const o = g.get(k) || { waduk: k, n: 0, mw: 0, prov: p.lokasi?.provinsi, st: p.status?.[0]?.nilai }; o.n++; o.mw += kap(p); g.set(k, o); }
  const baris = [...g.values()];
  return bagian("pl-waduk", "peta", "waduk", {
    judulHtml: hlHtml("pl.s.waduk.j", num(baris.length), { mw: num(jumlah(baris.map((b) => b.mw))) }), ss: "pl.ss.waduk", info: t("pl.s.waduk.sub"),
    isiHtml: tabelHtml("tb-waduk", { urut: "mw", arah: -1, satuan: "pl.u.waduk", baris, kolom: [
      { k: "waduk", j: "pl.c.waduk", u: (b) => b.waduk, sel: (b) => esc(b.waduk) },
      { k: "prov", j: "tk.c.prov", u: (b) => b.prov, sel: (b) => (b.prov ? tautProvinsi(b.prov) : "-") },
      { k: "n", j: "pl.c.proyek_n", u: (b) => b.n, kelas: "jm-num", sel: (b) => esc(num(b.n)) },
      { k: "mw", j: "pl.c.mw", u: (b) => b.mw, desc: 1, kelas: "jm-num", sel: (b) => esc(num(b.mw, 1)) },
      { k: "luas", j: "pl.c.luas", u: () => 0, kelas: "jm-tengah", sel: () => `<span class="jm-pil jm-pil-warn">${esc(t("pl.butuh"))}</span>` },
    ] }), sumber: src("pl.src.proyek", D.proyek_tgl),
  });
}

function sWkp() {
  if (!cfg.wkp || !D.wkp?.baris?.length) return "";
  return bagian("pl-wkp", "peta", "wkp", {
    judulHtml: hlHtml("tk.s.wkp.j", num(D.wkp.baris.length), {}), sub: esc(t("tk.s.wkp.sub")),
    isiHtml: tabelHtml("tb-wkp", { urut: "rencana", arah: -1, satuan: "pl.u.wkp", baris: D.wkp.baris, kolom: [
      { k: "nama", j: "tk.c.wkp", u: (w) => w.nama, sel: (w) => esc(w.nama) },
      { k: "prov", j: "tk.c.prov", u: (w) => w.provinsi, sel: (w) => tautProvinsi(w.provinsi) },
      { k: "st", j: "tk.c.status", u: (w) => w.status, kelas: "jm-tengah", sel: (w) => esc(label("tk.wkp.", w.status)) },
      { k: "ter", j: "tk.c.terpasang", u: (w) => w.terpasang_mw, desc: 1, kelas: "jm-num", sel: (w) => (w.terpasang_mw == null ? "-" : esc(num(w.terpasang_mw, 1))) },
      { k: "rencana", j: "tk.c.rencana", u: (w) => w.rencana_mw, desc: 1, kelas: "jm-num", sel: (w) => (w.rencana_mw == null ? "-" : esc(num(w.rencana_mw))) },
    ] }), sumber: src("tk.src.wkp", D.wkp.meta.diperbarui),
  });
}

function sKuotaAtap(S) {
  if (!S.atap?.baris?.length) return "";
  const nama = new Map(D.atap.regional.map((r) => [r.kode, r.nama]));
  return bagian("pl-kuota", "tabel", "kuota", {
    judulHtml: hlHtml("pl.s.kuota.j", num(D.atap.baris.length), {}), ss: "pl.ss.kuota", info: t("pl.s.kuota.sub"),
    isiHtml: tabelHtml("tb-kuota", { urut: "tahun", arah: 1, satuan: "pl.u.baris", baris: D.atap.baris, kolom: [
      { k: "reg", j: "pl.c.regional", u: (r) => nama.get(r.regional), sel: (r) => esc(nama.get(r.regional) || r.regional) },
      { k: "tahun", j: "pl.c.tahun", u: (r) => r.tahun, kelas: "jm-num", sel: (r) => esc(r.tahun) },
      { k: "kuota", j: "pl.c.kuota", u: (r) => r.kuota_mw, desc: 1, kelas: "jm-num", sel: (r) => (r.kuota_mw == null ? "-" : esc(num(r.kuota_mw))) },
    ] }), sumber: sumberLipat([{ sumber: D.atap.sumber[0]?.judul, url: D.atap.sumber[0]?.url, tanggal: D.atap.meta.diperbarui }]),
  });
}

function sPemain(S) {
  if (!S.org.length) return "";
  const nilai = (o) => (logoOrgSatu(o.id, o.nama, o.logo)?.startsWith("/img/logo/org/") ? 0 : 1);
  const daftar = [...S.org].sort((a, z) => nilai(a) - nilai(z) || a.nama.localeCompare(z.nama)).slice(0, 12);
  const kartu = daftar.map((o) => `<li><a href="/o/${esc(o.id)}"><span class="jm-tk-lg">${logoHtml(o.id, o.nama, o.logo)}</span><strong>${esc(o.singkatan || o.nama)}</strong><small>${esc(o.kategori?.label || "")}</small></a></li>`).join("");
  return bagian("pl-pemain", "direktori", "pemain", {
    judulHtml: hlHtml("tk.s.pemain.j", num(S.org.length), { nama: nm() }), sub: esc(t("tk.s.pemain.sub", { n: daftar.length })),
    isiHtml: `<ul class="jm-tk-pemain">${kartu}</ul>`, sumber: src("tk.src.org", D.org_tgl),
  });
}

const PROPER = new Set(["indonesia", "republik", "pln", "ri"]);
/* judul Title Case tiap kata -> huruf kapital hanya di awal kalimat, singkatan, dan nama diri umum */
const kalimat = (j) => {
  const k = String(j ?? "").trim().split(/\s+/), huruf = k.filter((w) => /^[A-Z]/.test(w)).length;
  if (k.length < 3 || huruf * 2 < k.length) return j;
  return k.map((w, i) => (i === 0 || w === w.toUpperCase() || /\d/.test(w) || PROPER.has(w.toLowerCase()) ? w : w.toLowerCase())).join(" ");
};
function kartuReg(r) {
  const pen = namaBaku(r.instansi_penerbit || "").nama;
  return `<article class="pl-reg"><span class="pl-reg-lg">${logoHtml(null, pen)}</span><div class="pl-reg-t"><a href="/regulasi?id=${encodeURIComponent(r.id)}">${esc(namaRegulasi(r))}</a><p>${esc(kalimat(r.judul))}</p><small>${esc(pen)}, ${esc(tanggal(r.tanggal_ditetapkan))}</small></div><span class="jm-pil ${kelasStatus(r.status)}">${esc(label("reg.status.", r.status))}</span>${unduhRegHtml(r)}</article>`;
}
function sReg(S) {
  if (!S.reg.length) return "";
  return bagian("pl-reg", "regulasi", "reg", {
    judulHtml: hlHtml("tk.s.reg.j", num(S.reg.length), {}), ss: "pl.ss.reg", info: t("pl.s.reg.sub"),
    isiHtml: tabelHtml("tb-reg", { urut: "tgl", arah: -1, satuan: "jm.pag.u.regulasi", baris: S.reg, kartu: kartuReg, kolom: [{ k: "tgl", j: "tk.c.tanggal", u: (r) => r.tanggal_ditetapkan, sel: () => "" }] }), sumber: src("tk.src.reg", D.reg_tgl),
  });
}

function sBerita(S) {
  if (!S.ber.length) return "";
  const ber = [...S.ber].sort((a, z) => urut(a.terbit, z.terbit));
  const kartu = ber.slice(0, 6).map((b) => {
    const f = fotoBerita(D.foto, b.id), u = amanUrl(b.url), lg = logoLokal(b.media);
    return `<li><a href="${esc(u || "#")}" target="_blank" rel="noopener noreferrer">${f ? `<img class="jm-tk-brt-f" data-bf="1" src="${esc(f)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="jm-tk-brt-k">${ikon("berita", 32)}</span>`}<span class="jm-tk-brt-t">${esc(b.judul)}</span><small class="jm-tk-media">${lg ? `<img src="${esc(lg)}" width="16" height="16" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}<span>${esc(namaMedia(b.media))}, ${esc(tanggal(String(b.terbit).slice(0, 10)))}</span></small></a></li>`;
  }).join("");
  return bagian("pl-berita", "berita", "berita", {
    judulHtml: hlHtml("tk.s.berita.j", num(ber.length), { nama: nm() }), sub: esc(t("tk.s.berita.sub")),
    isiHtml: `<ul class="jm-tk-berita">${kartu}</ul>`, sumber: src("tk.src.berita", D.ber_tgl),
    kakiHtml: lihatSemuaHtml("/berita", t("tk.lihat.berita"), num(ber.length)),
  });
}

/* ---------- linimasa 2025-2060 (N16): target resmi, pipeline RUPTL, aturan, proyek kunci ---------- */

const SATUAN_TARGET = (u) => (/persen/.test(u) ? "%" : /_mw$/.test(u) ? " MW" : /twh/.test(u) ? " TWh" : "");
function peristiwa(S) {
  const e = [];
  for (const x of D.target.target) {
    if (!x.tahun_target || x.tahun_target < 2025 || /dicabut/.test(x.catatan || "")) continue;
    const v = x.maks != null ? `${num(x.min, 1)}-${num(x.maks, 1)}` : (x.min != null ? num(x.min, x.min % 1 ? 1 : 0) : "-");
    e.push({ y: x.tahun_target, jenis: "target", teks: `${ada("pl.tgt." + x.ukuran) ? t("pl.tgt." + x.ukuran) : x.ukuran}: ${v}${SATUAN_TARGET(x.ukuran)}` });
  }
  for (const r of S.reg) if (r.tanggal_ditetapkan >= "2025") e.push({ y: +r.tanggal_ditetapkan.slice(0, 4), jenis: "aturan", teks: `${namaRegulasi(r)}: ${kalimat(r.judul)}`, href: "/regulasi?id=" + encodeURIComponent(r.id) });
  for (const p of [...S.proyek].filter((p) => cod(p) >= 2025).sort((a, z) => kap(z) - kap(a)).slice(0, 8)) e.push({ y: cod(p), jenis: "proyek", teks: `${namaProyek(p)}${p.kapasitas?.[0] ? ` (${num(p.kapasitas[0].nilai, 0)} ${p.kapasitas[0].satuan})` : ""}`, href: "/p/" + p.id });
  return e.sort((a, z) => a.y - z.y);
}
/* pipeline per tahun (RUPTL atau kuota atap) satu tabel kecil, bukan butir berulang */
function tabelPipa(S) {
  const baris = S.atap ? Object.entries(S.atap.total.per_tahun).map(([y, mw]) => ({ y: +y, n: null, mw })) : S.perTahun.map(([y, mw]) => ({ y, n: S.ruptl.filter((r) => r.cod_tahun?.[0] === y).length, mw }));
  if (!baris.length) return "";
  return sub(t(S.atap ? "pl.g.atap" : "pl.g.ruptl")) + `<ul class="jm-tk-stat">${baris.map((r) => `<li class="jm-pil" title="${esc(`${r.y}: ${num(r.mw)} MW`)}">${esc(r.y)}: ${esc(num(r.mw))} MW${r.n ? ` (${esc(num(r.n))})` : ""}</li>`).join("")}</ul>`;
}
function sLini(S) {
  const e = peristiwa(S), th = new Map(); for (const x of e) (th.get(x.y) || th.set(x.y, []).get(x.y)).push(x);
  const urutY = [...th.keys()];
  const grup = [...th].map(([y, a]) => `<li class="pl-th"${urutY.indexOf(y) < BATAS_LINI ? "" : " hidden"}><h3>${y}</h3><ul>${a.map((x) => `<li><span class="jm-pil pl-jn pl-jn-${x.jenis}">${esc(t("pl.jn." + x.jenis))}</span><span class="pl-lt">${x.href ? `<a href="${esc(x.href)}">${esc(x.teks)}</a>` : esc(x.teks)}</span></li>`).join("")}</ul></li>`).join("");
  const n = th.size, lebih = navLokal({ total: th.size, per: BATAS_LINI, satuan: "pl.u.tahun" });
  const adaTek = S.perTahun.length || S.atap, pipa = tabelPipa(S);
  if (!n && !pipa) return "";
  return bagian("pl-lini", "linimasa", "lini", {
    judulHtml: hlHtml("pl.s.lini.j", num(e.length + (pipa ? (S.atap ? Object.keys(S.atap.total.per_tahun).length : S.perTahun.length) : 0)), { a: 2025, z: Math.max(2034, e.at(-1)?.y ?? 2034) }),
    ss: "pl.ss.lini", info: t(adaTek ? "pl.s.lini.sub" : "pl.s.lini.sub0"),
    isiHtml: pipa + (n ? sub(t("pl.g.tonggak")) + `<ol class="pl-lini">${grup}</ol>${lebih}` : ""),
    sumber: sumberLipat([{ sumber: D.target.sumber[0]?.judul, url: D.target.sumber[0]?.url, tanggal: D.target.meta.diperbarui }, D.rup.sumber[0] && { sumber: D.rup.sumber[0]?.judul, url: D.rup.sumber[0]?.url, tanggal: D.rup.meta.diperbarui }]),
  });
}

/* ---------- rakit ---------- */

function gambarIsi() {
  const S = olah(); gambarKepala(S);
  isi.innerHTML = [sAngka(S), sProyek(S), sWaduk(S), sWkp(), sKuotaAtap(S), sPemain(S), sReg(S), sBerita(S), sLini(S), `<div id="plIndustri"></div>`].join("");
  pasangSemua(isi); gambarSemua(isi);
  indSiap = false; industri();
  const kodeT = cfg.ruptl || (cfg.id === "hidrogen" ? "hidrogen" : null);
  if (kodeT) terkaitHtml("teknologi", kodeT).then((h) => { if (h && isi.isConnected && !isi.querySelector(".jm-terkait")) isi.insertAdjacentHTML("beforeend", h); }).catch(() => {});
}
async function industri() {
  if (!cfg.ind) { $("plIndustri").innerHTML = industriHtml(cfg, X); pasangSemua(isi); gambarSemua($("plIndustri")); return; }
  const mine = cfg.id, ambil = (n) => muat(n).catch(() => null);
  [X.RT, X.TK, X.PT] = await Promise.all([ambil("rantai_plts"), ambil("tkdn"), ambil("penyedia_teknologi")]);
  X.PROY = D.proyek.map((p) => ({ id: p.id })); X.BER = D.berita;
  if (mine !== cfg.id || !$("plIndustri")) return;
  $("plIndustri").innerHTML = industriHtml(cfg, X); pasangSemua(isi); gambarSemua($("plIndustri"));
}
function segmen() {
  $("plSeg").innerHTML = TEK.map((k) => `<button type="button" role="tab" data-tek="${k.id}" aria-selected="${k.id === cfg.id}">${ikonPelacak(k.id)}<span>${esc(t("pl.tek.s." + k.id))}</span></button>`).join("");
}
function pilih(id) {
  cfg = tekById(id);
  for (const b of $("plSeg").children) b.setAttribute("aria-selected", String(b.dataset.tek === id));
  try { const u = new URL(location.href); u.searchParams.set("tek", id); history.replaceState(null, "", u); } catch (e) {}
  nanti(gambarIsi);
}

/* ---------- mulai ---------- */

await mulaiHalaman();
isi = $("plIsi");
cfg = tekById(new URLSearchParams(location.search).get("tek")) || tekById(TEK_AWAL);
segmen();
isi.innerHTML = hantuHtml(6);
const ambil = (n) => muat(n).catch(() => null);
const [proyek, ruptl, reg, org, ber, foto, wkp, atap, target, tren] = await Promise.all(["proyek", "ruptl", "regulasi", "organisasi", "berita", "berita_foto", "wkp", "plts_atap", "target", "kapasitas_tren"].map(ambil));
if (!proyek || !target) { isi.innerHTML = ""; tampilGalat(isi, () => location.reload()); } else {
  D = { proyek: proyek.baris, proyek_tgl: proyek.dibangun_pada, ruptl, reg: reg?.baris || [], reg_tgl: reg?.dibangun_pada, org: org?.baris || [], org_tgl: org?.dibangun_pada, berita: ber?.baris || [], ber_tgl: ber?.dibangun_pada, foto, wkp, atap, target, tren: tren || { baris: [] } };
  D.rup = ruptl || { baris: [], sumber: [], meta: {} }; D.ruptl = D.rup.baris;
  gambarIsi();
  pasangTabel(isi);
  $("plSeg").addEventListener("click", (e) => { const b = e.target.closest("button[data-tek]"); if (!b || b.dataset.tek === cfg.id) return; if (MODUL_PELACAK[b.dataset.tek]) location.assign(MODUL_PELACAK[b.dataset.tek]); else pilih(b.dataset.tek); });
  saatBahasa(() => { segmen(); gambarIsi(); });
  isi.addEventListener("error", (e) => {
    const im = e.target;
    if (im.tagName !== "IMG") return;
    if (im.dataset.lg) gantiMonogram(im);
    else if (im.dataset.bf) im.replaceWith(Object.assign(document.createElement("span"), { className: "jm-tk-brt-k", innerHTML: ikon("berita", 32) }));
  }, true);
  pasangLokal(isi, () => isi.querySelectorAll(".pl-th"));
}
