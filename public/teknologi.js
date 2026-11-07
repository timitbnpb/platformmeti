/* /teknologi/<kode>: satu rumah per teknologi (FITUR-STRATEGIS butir T). Data = potret statis /data/*.json; tiap bagian
   tanpa isi untuk teknologi ini disembunyikan (tidak dirender). Turunan (jumlah) berpil EST. INP: satu-satunya kontrol
   adalah tombol "tampilkan semua" proyek; chrome (aria-expanded) berubah seketika, baris menyusul lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, ada, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, fotoBerita } from "/inti/umum.js";
import { exHtml, terkaitHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { tautProvinsi, tautOrg } from "/inti/tautan.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { sumberLipat, ubinHtml, batangHtml, pasangBar, pil, num, amanUrl, tampilGalat, saatBahasa } from "/analisis.js";
import { kolom } from "/grafik.js";
import { pilStatus, pilTek, ikonTek } from "/inti/ikon_tek.js";
import { namaMedia, logoLokal } from "/inti/nama_media.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { muat, namaRegulasi, kelasStatus } from "/publik.js";

const $ = (id) => document.getElementById(id);
const SEMUA = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"];
const ALIAS = { sampah: "biomassa-sampah", wte: "biomassa-sampah" };
/* pel = kunci peluang.json; harga = kunci harga_patokan; reg = topik regulasi; kep = kepakaran berita/organisasi; tkdn = kategori TKDN */
const CFG = {
  surya: { foto: ["surya-cirata", "indonesiagoid", "pd"], pel: "surya", harga: ["surya"], reg: ["surya"], kep: "surya", tkdn: ["modul_surya", "inverter"], rantai: true, atap: true },
  bayu: { foto: ["bayu-sidrap", "USAID Indonesia", "pd"], pel: "bayu", harga: ["bayu"], reg: ["angin"], kep: "bayu", tkdn: ["turbin"] },
  hidro: { foto: ["hidro-saguling", "NFarras", "CC BY-SA 4.0"], pel: "hidro", harga: ["hidro"], reg: ["hidro"], kep: "hidro" },
  "panas-bumi": { foto: ["panas-bumi-sibayak", "Kenrick95", "CC BY-SA 3.0"], pel: "panas_bumi", harga: ["panas_bumi"], reg: ["panas_bumi"], kep: "panas-bumi", wkp: true },
  bioenergi: { foto: ["bioenergi-sawit", "Ojiribeka Chidera", "CC BY-SA 4.0"], pel: "bioenergi", harga: ["bioenergi"], reg: ["bioenergi"], kep: "bioenergi" },
  "biomassa-sampah": { foto: ["biomassa-bantargebang", "Kuncoro Widyo Rumpoko", "CC BY-SA 4.0"], reg: ["bioenergi"], kep: "biomassa-sampah" },
  penyimpanan: { foto: ["penyimpanan-baterai", "Kecko", "CC BY 2.0"], reg: ["penyimpanan"], kep: "penyimpanan", tkdn: ["baterai"] },
  hidrogen: { reg: ["hidrogen"], kep: "hidrogen" },
  nuklir: { foto: ["nuklir-siwabessy", "Bkusmono", "pd"], reg: ["nuklir"], kep: "nuklir" },
};
const segmen = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
const KODE = ALIAS[segmen] || segmen;
const C = CFG[KODE];
const TAHUN_RUPTL = Array.from({ length: 10 }, (_, i) => 2025 + i);
const BATAS_PROYEK = 20;
let isi, PEL, RUPTL, PROY, RANTAI, TKDN, REG, ORG, BER, FOTO, WKP, ATAP;
const urut = (a, z) => String(z).localeCompare(String(a));

/* ---------- olah data ---------- */

const sumberPel = (id, halaman) => { const s = PEL?.sumber.find((x) => x.id === id); return s ? { sumber: s.judul, halaman, url: s.url, tahun: s.tahun, tanggal: PEL.meta.diperbarui } : null; };
const src = (kunci, tgl, url) => sumberLipat([{ sumber: t(kunci), url, tanggal: tgl }]);
const nm = (n) => t("tk.nama." + n);
const mw = (v, d = 0) => (v == null ? "-" : num(v, d));
const jumlah = (a) => a.reduce((s, x) => s + (x || 0), 0);
const lambang = (k) => `<img class="jm-wl-lb" src="/img/provinsi/${esc(k)}.png" width="20" height="20" alt="" loading="lazy" decoding="async">`;
const label = (awal, k) => (ada(awal + k) ? t(awal + k) : String(k ?? "-"));
const sel = (k, v, kelas = "") => `<td data-label="${esc(t(k))}"${kelas ? ` class="${kelas}"` : ""}>${v}</td>`;
const kepTabel = (kunci) => kunci.map((k) => `<th>${esc(t(k))}</th>`).join("");
const tabel = (kunci, baris) => `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${kepTabel(kunci)}</tr></thead><tbody>${baris}</tbody></table></div>`;
const bagian = (id, ik, kunci, { judulHtml, sub, isiHtml, sumber = "", csv = false, kakiHtml = "" }) =>
  isiHtml ? exHtml({ id, ikon: ik, topik: t(`tk.s.${kunci}.ey`), judulHtml, subHtml: sub || "", aksiHtml: aksiHtml({ csv }) + sumber, isiHtml, kakiHtml }) : "";

function olah() {
  const d = C.pel;
  const prov = d && PEL ? PEL.baris.map((b) => {
    const pot = b.potensi[d]?.mw ?? null, ter = b.terpasang[d]?.mw ?? null;
    return { kode: b.kode, nama: b.nama, pot, ter, rasio: b.rasio_pemanfaatan[d]?.persen ?? null, celah: pot !== null && ter !== null ? Math.max(0, pot - ter) : null, sp: b.potensi[d], st: b.terpasang[d] };
  }).filter((r) => r.pot !== null || r.ter !== null).sort((a, z) => (z.pot ?? -1) - (a.pot ?? -1) || a.nama.localeCompare(z.nama)) : [];
  const proyek = (PROY?.baris || []).filter((p) => p.teknologi === KODE);
  const ruptl = (RUPTL?.baris || []).filter((r) => r.teknologi === KODE);
  const reg = (REG?.baris || []).filter((r) => C.reg.some((k) => r.topik.includes(k))).sort((a, z) => urut(a.tanggal_ditetapkan, z.tanggal_ditetapkan));
  const org = (ORG?.baris || []).filter((o) => (o.kepakaran || []).includes(C.kep));
  const ber = (BER?.baris || []).filter((b) => (b.kepakaran || []).includes(C.kep)).sort((a, z) => urut(a.terbit, z.terbit));
  return { prov, proyek, ruptl, reg, org, ber };
}
const kapProyek = (p) => Number(p.kapasitas?.[0]?.nilai) || 0;

/* ---------- kepala ---------- */

function gambarKepala() {
  const D = olah(), nama = nm(KODE);
  document.title = t("tk.title", { nama });
  $("judul").textContent = nama;
  $("jawab").textContent = t("tk.lead." + KODE);
  const foto = $("tkFoto");
  if (C.foto) {
    const cr = ada("beranda.foto.cr." + KODE) ? "beranda.foto.cr." + KODE : "beranda.foto." + KODE;
    foto.innerHTML = `<img src="/img/beranda/${esc(C.foto[0])}.webp" width="800" height="600" alt="" loading="eager" decoding="async"><figcaption>${esc(t(cr))} (${esc(C.foto[1])}, ${esc(C.foto[2] === "pd" ? t("beranda.foto.lis.pd") : C.foto[2])})</figcaption>`;
    foto.hidden = false;
  } else foto.hidden = true;
  const potN = jumlah(D.prov.map((r) => r.pot)), terN = jumlah(D.prov.map((r) => r.ter)), mwP = jumlah(D.proyek.map(kapProyek)), mwR = jumlah(D.ruptl.map((r) => r.kapasitas_mw));
  const kandidat = [
    D.prov.some((r) => r.pot !== null) && { ikon: "peta", nilai: num(potN), satuan: "MW", label: t("tk.u.potensi"), href: "#tk-potensi", turunan: true },
    D.prov.some((r) => r.ter !== null) && { ikon: "analisis", nilai: num(terN, 1), satuan: "MW", label: t("tk.u.terpasang"), href: "#tk-potensi", turunan: true },
    D.proyek.length && { ikon: "proyek", nilai: num(D.proyek.length), satuan: mwP ? `${num(mwP)} MW` : "", label: t("tk.u.proyek"), href: "#tk-proyek", turunan: false },
    D.ruptl.length && { ikon: "rantai", nilai: num(mwR), satuan: "MW", label: t("tk.u.ruptl"), href: "#tk-ruptl", turunan: true },
    D.reg.length && { ikon: "regulasi", nilai: num(D.reg.length), satuan: "", label: t("tk.u.reg"), href: "#tk-reg", turunan: false },
    D.ber.length && { ikon: "berita", nilai: num(D.ber.length), satuan: "", label: t("tk.u.berita"), href: "#tk-berita", turunan: false },
  ].filter(Boolean).slice(0, 3);
  $("ubin").innerHTML = ubinHtml(kandidat);
}

/* ---------- bagian ---------- */

function sPotensi(D) {
  if (!D.prov.length) return "";
  const potN = jumlah(D.prov.map((r) => r.pot)), terN = jumlah(D.prov.map((r) => r.ter)), top = D.prov.filter((r) => r.pot !== null).slice(0, 10);
  const maks = Math.max(1, ...top.map((r) => r.pot));
  const grafik = top.length ? `<h3 class="jm-tk-sub">${esc(t("tk.g.potensi"))}</h3>${batangHtml(top.map((r) => ({
    label: r.nama, labelHtml: `<span class="jm-tk-nama">${lambang(r.kode)}<span>${esc(r.nama)}</span></span>`,
    bagian: [{ nilai: r.ter || 0, kelas: "jm-an-b1" }, { nilai: Math.max(0, r.pot - (r.ter || 0)), kelas: "jm-an-b2" }], teks: num(r.pot) + " MW",
  })), { maks, label: t("tk.g.potensi"), satuan: "MW" })}<p class="jm-bantu">${esc(t("tk.g.legenda"))}</p>` : "";
  const baris = D.prov.map((r) => `<tr>${sel("tk.c.prov", `<a class="jm-tk-nama" href="/wilayah/${esc(r.kode)}">${lambang(r.kode)}<span>${esc(r.nama)}</span></a>`)}${sel("tk.c.potensi", mw(r.pot), "jm-num")}${sel("tk.c.terpasang", mw(r.ter, 1), "jm-num")}${sel("tk.c.rasio", mw(r.rasio, 1), "jm-num")}${sel("tk.c.celah", mw(r.celah), "jm-num")}</tr>`).join("");
  const s1 = D.prov.find((r) => r.sp)?.sp, s2 = D.prov.find((r) => r.st)?.st;
  return bagian("tk-potensi", "peta", "potensi", {
    judulHtml: hlHtml("tk.s.potensi.j", num(potN), { ter: num(terN, 1), n: D.prov.length }),
    sub: `${esc(t("tk.s.potensi.sub"))} ${pil("an.est")}`, isiHtml: grafik + `<h3 class="jm-tk-sub">${esc(t("tk.g.tabel"))}</h3>` + tabel(["tk.c.prov", "tk.c.potensi", "tk.c.terpasang", "tk.c.rasio", "tk.c.celah"], baris),
    sumber: sumberLipat([s1 && sumberPel(s1.sumber_id, s1.halaman), s2 && sumberPel(s2.sumber_id, s2.halaman)]), csv: true,
  });
}

function sRuptl(D) {
  if (!D.ruptl.length) return "";
  const per = new Map(TAHUN_RUPTL.map((y) => [y, 0]));
  for (const r of D.ruptl) { const y = r.cod_tahun?.[0]; if (per.has(y)) per.set(y, per.get(y) + (r.kapasitas_mw || 0)); }
  const total = jumlah(D.ruptl.map((r) => r.kapasitas_mw)), pen = (f) => jumlah(D.ruptl.filter(f).map((r) => r.kapasitas_mw));
  const chips = [["IPP", pen((r) => r.pengembang_status === "IPP")], ["PLN", pen((r) => r.pengembang_status === "PLN" || r.pengembang_status === "SH-PLN")]].filter((x) => x[1])
    .map(([k, v]) => `<li class="jm-pil">${esc(t("tk.ruptl.pengembang", { k, mw: num(v) }))}</li>`).join("");
  const meta = RUPTL.meta;
  return bagian("tk-ruptl", "rantai", "ruptl", {
    judulHtml: hlHtml("tk.s.ruptl.j", num(total), { n: D.ruptl.length }), sub: `${esc(t("tk.s.ruptl.sub"))} ${pil("an.est")}`,
    isiHtml: kolom([...per].map(([y, v]) => ({ label: String(y), v })), { label: t("tk.s.ruptl.ey"), d: 0 }) + (chips ? `<ul class="jm-tk-stat">${chips}</ul>` : ""),
    sumber: sumberLipat([{ sumber: RUPTL.sumber[0]?.judul, url: RUPTL.sumber[0]?.url, tahun: meta.tahun_dokumen, tanggal: meta.diperbarui }]),
  });
}

function sProyek(D) {
  if (!D.proyek.length) return "";
  const urutP = [...D.proyek].sort((a, z) => kapProyek(z) - kapProyek(a));
  const cod = (p) => { const a = (p.cod_target || []).map((c) => c.nilai).filter(Number.isFinite); return a.length ? Math.min(...a) : null; };
  const baris = urutP.map((p, i) => {
    const k = p.kapasitas?.[0], pem = p.pihak?.pemilik?.[0]?.nilai;
    const fid = (p.berita_ids || []).find((b) => fotoBerita(FOTO, b)), foto = fid ? fotoBerita(FOTO, fid) : "";
    const ubin = foto ? `<span class="jm-tk-pt"><img src="${esc(foto)}" alt="" width="64" height="48" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`
      : `<span class="jm-tk-pt jm-tk-pt-k jm-tek-${esc(KODE)}">${ikonTek(KODE)}<b>${k ? esc(num(k.nilai, 0)) : "-"}</b>${k ? `<small>${esc(k.satuan)}</small>` : ""}</span>`;
    const nama = `<span class="jm-tk-pj">${ubin}<span class="jm-tk-pj-t"><a href="/p/${esc(p.id)}">${esc(namaProyek(p))}</a>${pem ? `<small>${tautOrg(pem)}</small>` : ""}</span></span>`;
    const lok = p.lokasi?.provinsi ? tautProvinsi(p.lokasi.provinsi) : `<span class="jm-tk-redup">${esc(t("tk.lokasi_belum"))}</span>`;
    return `<tr${i >= BATAS_PROYEK ? " data-lebih hidden" : ""}>${sel("tk.c.nama", nama)}${sel("tk.c.prov", lok)}${sel("tk.c.kap", k ? `${esc(num(k.nilai, 1))} ${esc(k.satuan)}` : "-", "jm-num")}${sel("tk.c.status", pilStatus(p.status?.[0]?.nilai || "tidak-diketahui"), "jm-tengah")}${sel("tk.c.cod", cod(p) ?? "-", "jm-num")}</tr>`;
  }).join("");
  const lebih = urutP.length > BATAS_PROYEK ? `<p class="jm-tk-lebih"><button type="button" data-lebih="${urutP.length}" aria-expanded="false">${esc(t("tk.lebih", { n: urutP.length }))}</button></p>` : "";
  return bagian("tk-proyek", "proyek", "proyek", {
    judulHtml: hlHtml("tk.s.proyek.j", num(urutP.length), { mw: num(jumlah(D.proyek.map(kapProyek))) }), sub: esc(t("tk.s.proyek.sub")),
    isiHtml: tabel(["tk.c.nama", "tk.c.prov", "tk.c.kap", "tk.c.status", "tk.c.cod"], baris) + lebih,
    sumber: src("tk.src.proyek", PROY.dibangun_pada), csv: true,
    kakiHtml: lihatSemuaHtml(`/proyek?teknologi=${encodeURIComponent(KODE)}`, t("tk.lihat.proyek"), num(urutP.length)),
  });
}

function sRantai() {
  let h = "", sumber = [];
  if (RANTAI?.pabrikan?.length) {
    const top = [...RANTAI.pabrikan].sort((a, z) => (z.mwp || 0) - (a.mwp || 0)).slice(0, 15);
    h += `<h3 class="jm-tk-sub">${esc(t("tk.rantai.pabrik", { n: RANTAI.ringkas.pabrikan, mwp: num(RANTAI.ringkas.total_mwp) }))}</h3>` + tabel(["tk.c.pabrikan", "tk.c.kota", "tk.c.mwp", "tk.c.pasar"], top.map((p) => `<tr>${sel("tk.c.pabrikan", esc(p.nama))}${sel("tk.c.kota", esc(p.kota || "-"))}${sel("tk.c.mwp", mw(p.mwp), "jm-num")}${sel("tk.c.pasar", esc(label("rt.pasar.", p.pasar)))}</tr>`).join(""));
    sumber.push({ sumber: RANTAI.sumber.judul, tanggal: RANTAI.dibangun_pada });
  }
  const tk = (TKDN?.baris || []).filter((r) => C.tkdn?.includes(r.kategori)).sort((a, z) => (z.tkdn_persen || 0) - (a.tkdn_persen || 0));
  if (tk.length) {
    h += `<h3 class="jm-tk-sub">${esc(t("tk.tkdn.j", { n: tk.length }))}</h3>` + tabel(["tk.c.produsen", "tk.c.produk", "tk.c.tkdn", "tk.c.berlaku"], tk.slice(0, 20).map((r) => `<tr>${sel("tk.c.produsen", esc(r.produsen))}${sel("tk.c.produk", esc([r.produk, r.merk].filter(Boolean).join(", ")))}${sel("tk.c.tkdn", mw(r.tkdn_persen, 1) + "%", "jm-num")}${sel("tk.c.berlaku", esc(r.berlaku_sampai || "-"))}</tr>`).join(""));
    sumber.push({ sumber: TKDN.sumber[0].judul, url: TKDN.sumber[0].url, tanggal: TKDN.dibangun_pada });
  }
  return bagian("tk-rantai", "rantai", "rantai", { judulHtml: esc(t("tk.s.rantai.j")), sub: esc(t("tk.s.rantai.sub")), isiHtml: h, sumber: sumberLipat(sumber), csv: true });
}

function sHarga() {
  const h = PEL?.harga_patokan;
  if (!h) return "";
  let isiH = "";
  for (const k of C.harga || []) {
    const x = h.teknologi[k];
    if (!x?.tingkat) continue;
    isiH += `<h3 class="jm-tk-sub">${esc(x.jenis)}</h3>` + tabel(["tk.c.kapasitas", "tk.c.tahun1", "tk.c.tahun11"], x.tingkat.map((r) => `<tr>${sel("tk.c.kapasitas", esc([r.jenis, r.kapasitas].filter(Boolean).join(" ")))}${sel("tk.c.tahun1", mw(r.koef_1_10, 2), "jm-num")}${sel("tk.c.tahun11", mw(r.tahun_11_dst, 2), "jm-num")}</tr>`).join(""));
  }
  const s = PEL.sumber.find((z) => z.id === h.sumber_id);
  return bagian("tk-harga", "tabel", "harga", {
    judulHtml: esc(t("tk.s.harga.j")), sub: esc(t("tk.s.harga.sub", { satuan: h.satuan })), isiHtml: isiH,
    sumber: sumberLipat([s && { sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: PEL.meta.diperbarui }]), csv: true,
  });
}

function sReg(D) {
  if (!D.reg.length) return "";
  const baris = D.reg.slice(0, 10).map((r) => `<tr>${sel("tk.c.regulasi", `<a href="/regulasi?id=${encodeURIComponent(r.id)}">${esc(namaRegulasi(r))}</a>`)}${sel("tk.c.tentang", esc(r.judul))}${sel("tk.c.status", `<span class="jm-pil ${kelasStatus(r.status)}">${esc(label("reg.status.", r.status))}</span>`, "jm-tengah")}${sel("tk.c.tanggal", esc(tanggal(r.tanggal_ditetapkan)), "jm-num")}</tr>`).join("");
  return bagian("tk-reg", "regulasi", "reg", {
    judulHtml: hlHtml("tk.s.reg.j", num(D.reg.length), {}), sub: esc(t("tk.s.reg.sub", { n: Math.min(10, D.reg.length) })),
    isiHtml: tabel(["tk.c.regulasi", "tk.c.tentang", "tk.c.status", "tk.c.tanggal"], baris), sumber: src("tk.src.reg", REG.dibangun_pada), csv: true,
  });
}

function sWkp() {
  if (!WKP?.baris?.length) return "";
  const baris = [...WKP.baris].sort((a, z) => (z.rencana_mw || 0) - (a.rencana_mw || 0)).map((w) => `<tr>${sel("tk.c.wkp", esc(w.nama))}${sel("tk.c.prov", tautProvinsi(w.provinsi))}${sel("tk.c.status", esc(label("tk.wkp.", w.status)), "jm-tengah")}${sel("tk.c.terpasang", mw(w.terpasang_mw, 1), "jm-num")}${sel("tk.c.rencana", mw(w.rencana_mw), "jm-num")}</tr>`).join("");
  return bagian("tk-wkp", "peta", "wkp", {
    judulHtml: hlHtml("tk.s.wkp.j", num(WKP.baris.length), {}), sub: esc(t("tk.s.wkp.sub")),
    isiHtml: tabel(["tk.c.wkp", "tk.c.prov", "tk.c.status", "tk.c.terpasang", "tk.c.rencana"], baris), sumber: src("tk.src.wkp", WKP.meta.diperbarui), csv: true,
  });
}

function sAtap() {
  const tot = ATAP?.total;
  if (!tot) return "";
  const items = Object.entries(tot.per_tahun).map(([y, v]) => ({ label: y, v }));
  return bagian("tk-atap", "analisis", "atap", {
    judulHtml: hlHtml("tk.s.atap.j", num(tot.jumlah_mw), {}), sub: `${esc(t("tk.s.atap.sub"))} ${pil("an.est")}`,
    isiHtml: kolom(items, { label: t("tk.s.atap.ey") }), sumber: sumberLipat([{ sumber: ATAP.sumber[0]?.judul, halaman: tot.halaman, url: ATAP.sumber[0]?.url, tanggal: ATAP.meta.diperbarui }]),
  });
}

function sPemain(D) {
  if (!D.org.length) return "";
  const nilai = (o) => (logoOrgSatu(o.id, o.nama, o.logo) && !logoOrgSatu(o.id, o.nama, o.logo).startsWith("/img/logo/org/") ? 0 : 1);
  const daftar = [...D.org].sort((a, z) => nilai(a) - nilai(z) || a.nama.localeCompare(z.nama)).slice(0, 12);
  const kartu = daftar.map((o) => {
    const lg = logoOrgSatu(o.id, o.nama, o.logo);
    return `<li><a href="/o/${esc(o.id)}"><span class="jm-tk-lg">${lg ? `<img src="${esc(lg)}" data-lg="1" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ikon("direktori", 32)}</span><strong>${esc(o.singkatan || o.nama)}</strong><small>${esc(o.kategori?.label || "")}</small></a></li>`;
  }).join("");
  return bagian("tk-pemain", "direktori", "pemain", {
    judulHtml: hlHtml("tk.s.pemain.j", num(D.org.length), { nama: nm(KODE) }), sub: esc(t("tk.s.pemain.sub", { n: daftar.length })),
    isiHtml: `<ul class="jm-tk-pemain">${kartu}</ul>`, sumber: src("tk.src.org", ORG.dibangun_pada),
  });
}

function sBerita(D) {
  if (!D.ber.length) return "";
  const kartu = D.ber.slice(0, 6).map((b) => {
    const f = fotoBerita(FOTO, b.id), u = amanUrl(b.url), lg = logoLokal(b.media);
    return `<li><a href="${esc(u || "#")}" target="_blank" rel="noopener noreferrer">${f ? `<img class="jm-tk-brt-f" src="${esc(f)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="jm-tk-brt-k">${ikon("berita", 32)}</span>`}<span class="jm-tk-brt-t">${esc(b.judul)}</span><span class="jm-tk-brt-p">${(b.kepakaran || []).slice(0, 2).map(pilTek).join("")}</span><small class="jm-tk-media">${lg ? `<img src="${esc(lg)}" width="16" height="16" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}<span>${esc(namaMedia(b.media))}, ${esc(tanggal(String(b.terbit).slice(0, 10)))}</span></small></a></li>`;
  }).join("");
  return bagian("tk-berita", "berita", "berita", {
    judulHtml: hlHtml("tk.s.berita.j", num(D.ber.length), { nama: nm(KODE) }), sub: esc(t("tk.s.berita.sub")),
    isiHtml: `<ul class="jm-tk-berita">${kartu}</ul>`, sumber: src("tk.src.berita", BER.dibangun_pada),
    kakiHtml: lihatSemuaHtml(`/berita?teknologi=${encodeURIComponent(C.kep)}`, t("tk.lihat.berita"), num(D.ber.length)),
  });
}

function sCara(D) {
  const baris = ["tk.cara.1", "tk.cara.2", "tk.cara.3", "tk.cara.4"].map((k) => `<li>${esc(t(k))}</li>`).join("");
  return exHtml({ id: "tk-cara", ikon: "metode", topik: t("an.ey.metode"), judulHtml: esc(t("an.cara")), isiHtml: `<ol class="jm-tk-cara">${baris}</ol>` });
}

function gambarIsi() {
  const D = olah();
  isi.innerHTML = [sPotensi(D), sRuptl(D), sProyek(D), C.rantai || C.tkdn ? sRantai() : "", C.wkp ? sWkp() : "", C.atap ? sAtap() : "", sHarga(), sReg(D), sPemain(D), sBerita(D), sCara(D)].join("");
  pasangBar(isi);
  terkaitHtml("teknologi", KODE).then((h) => { if (h && isi.isConnected) isi.insertAdjacentHTML("beforeend", h); });
}

/* ---------- mulai ---------- */

await mulaiHalaman();
isi = $("tkIsi");
if (!C) {
  $("judul").textContent = t("tk.tak_dikenal");
  isi.innerHTML = `<div class="jm-kartu"><p>${esc(t("tk.tak_dikenal.ket"))}</p><ul class="jm-tk-stat">${SEMUA.map((k) => `<li><a class="jm-pil" href="/teknologi/${esc(k)}">${esc(t("tk.nama." + k))}</a></li>`).join("")}</ul></div>`;
} else {
  isi.innerHTML = hantuHtml(6);
  const ambil = (n) => muat(n).catch(() => null);
  [PEL, RUPTL, PROY, RANTAI, TKDN, REG, ORG, BER, FOTO, WKP, ATAP] = await Promise.all(
    ["peluang", "ruptl", "proyek", C.rantai ? "rantai_plts" : null, C.tkdn ? "tkdn" : null, "regulasi", "organisasi", "berita", "berita_foto", C.wkp ? "wkp" : null, C.atap ? "plts_atap" : null].map((n) => (n ? ambil(n) : null)),
  );
  if (!PEL && !PROY && !REG && !BER) { isi.innerHTML = ""; tampilGalat(isi, () => location.reload()); } else {
    const gambar = () => { gambarKepala(); gambarIsi(); };
    gambar();
    saatBahasa(gambar);
    // logo yang gagal dimuat diganti ikon gedung (tanpa atribut on*)
    isi.addEventListener("error", (e) => {
      const im = e.target;
      if (im.tagName === "IMG" && im.dataset.lg) im.replaceWith(Object.assign(document.createElement("span"), { innerHTML: ikon("direktori", 32) }).firstChild);
    }, true);
    isi.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-lebih]");
      if (!b) return;
      const buka = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(buka));
      b.textContent = t(buka ? "tk.lebih_sedikit" : "tk.lebih", { n: b.dataset.lebih });
      const tabel = b.closest(".jm-ex-bd").querySelector("tbody");
      nanti(() => { for (const r of tabel.querySelectorAll("tr[data-lebih]")) r.hidden = !buka; });
    });
  }
}
