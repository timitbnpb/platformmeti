/* Tab "Ringkasan" di modul ujung ke ujung (dulu halaman /teknologi/<kode>, FITUR-STRATEGIS butir T). Dimuat modul lewat
   import("/tek_ringkasan.js?k=<kode teknologi>"). Data = potret statis /data/*.json; tiap bagian tanpa isi untuk teknologi
   ini tidak dirender. Turunan (jumlah) berpil EST. INP: satu-satunya kontrol adalah tombol "tampilkan semua" proyek. */
import { t, ada, tanggal } from "/i18n.js";
import { navLokal, pasangLokal } from "/inti/paginasi.js";
import { esc, ikon, hantuHtml, fotoBerita } from "/inti/umum.js";
import { exHtml, terkaitHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { tautProvinsi, tautOrg } from "/inti/tautan.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { sumberLipat, batangHtml, pasangBar, pil, num, amanUrl, tampilGalat } from "/analisis.js";
import { kolom } from "/grafik.js";
import { pilStatus, pilTek, ikonTek } from "/inti/ikon_tek.js";
import { namaMedia, logoLokal } from "/inti/nama_media.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { muat, namaRegulasi, kelasStatus } from "/publik.js";
import { pasangProdukTerkait } from "/inti/produk_meti.js";

/* pel = kunci peluang.json; harga = kunci harga_patokan; reg = topik regulasi; kep = kepakaran berita/organisasi; tkdn = kategori TKDN */
const CFG = {
  surya: { pel: "surya", harga: ["surya"], reg: ["surya"], kep: "surya", tkdn: ["modul_surya", "inverter"], rantai: true, atap: true },
  bayu: { pel: "bayu", harga: ["bayu"], reg: ["angin"], kep: "bayu", tkdn: ["turbin"] },
  hidro: { pel: "hidro", harga: ["hidro"], reg: ["hidro"], kep: "hidro" },
  "panas-bumi": { pel: "panas_bumi", harga: ["panas_bumi"], reg: ["panas_bumi"], kep: "panas-bumi", wkp: true },
  bioenergi: { pel: "bioenergi", harga: ["bioenergi"], reg: ["bioenergi"], kep: "bioenergi" },
  "biomassa-sampah": { reg: ["bioenergi"], kep: "biomassa-sampah" },
  penyimpanan: { reg: ["penyimpanan"], kep: "penyimpanan", tkdn: ["baterai"] },
  hidrogen: { reg: ["hidrogen"], kep: "hidrogen" },
  nuklir: { reg: ["nuklir"], kep: "nuklir" },
};
const KODE = new URL(import.meta.url).searchParams.get("k") || "";
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

/* gaya halaman lama dimuat sekali bila modul belum memilikinya */
for (const h of ["/analisis.css", "/grafik.css", "/teknologi.css"]) if (!document.querySelector(`link[href="${h}"]`)) document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" href="${h}">`);

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
    return `<tr${i >= BATAS_PROYEK ? " hidden" : ""}>${sel("tk.c.nama", nama)}${sel("tk.c.prov", lok)}${sel("tk.c.kap", k ? `${esc(num(k.nilai, 1))} ${esc(k.satuan)}` : "-", "jm-num")}${sel("tk.c.status", pilStatus(p.status?.[0]?.nilai || "tidak-diketahui"), "jm-tengah")}${sel("tk.c.cod", cod(p) ?? "-", "jm-num")}</tr>`;
  }).join("");
  const lebih = navLokal({ total: urutP.length, per: BATAS_PROYEK, satuan: "jm.pag.u.proyek" });
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
  if (KODE === "penyimpanan") h += `<p class="jm-bantu"><a href="/baterai-ev?tab=bess">${esc(t("bev.lihat_bess"))}</a></p>`;
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

const KAT = { bumn: ["bumn", "gedung"], swasta: ["swasta", "pabrik"], internasional: ["internasional", "globe"], asosiasi: ["asosiasi", "direktori"], koperasi: ["koperasi", "lencana"] };
const PER_PEMAIN = 12;
/* spasi tanda baca dari judul mentah: "7 , 046" -> "7,046", "a , b" -> "a, b", "pumped - storage" -> "pumped-storage" */
const rapi = (x) => String(x ?? "").replace(/(\d)\s*,\s*(\d{3})\b/g, "$1,$2").replace(/\s+([,.;:!?%)])/g, "$1").replace(/([(])\s+/g, "$1").replace(/(\p{L})\s+-\s+(\p{L})/gu, "$1-$2").replace(/\s{2,}/g, " ").trim();
const inisial = (n) => { const k = String(n || "").replace(/^pt\.?\s+/i, "").split(/[^\p{L}\p{N}]+/u).filter(Boolean); return ((k.length > 1 ? k[0][0] + k[1][0] : (k[0] || "?").slice(0, 2))).toUpperCase(); };
const warnaMono = (s) => "tkp-w" + ([...String(s)].reduce((h, c) => h + c.charCodeAt(0), 0) % 5);
const mono = (nama, kunci) => `<b class="${warnaMono(kunci)}">${esc(inisial(nama))}</b>`;

function sPemain(D) {
  if (!D.org.length) return "";
  const stat = new Map();
  for (const p of D.proyek) for (const id of new Set(Object.values(p.pihak || {}).flat().map((a) => a?.organisasi_id).filter(Boolean))) {
    const x = stat.get(id) || { n: 0, mw: 0 }; x.n++; x.mw += kapProyek(p); stat.set(id, x);
  }
  const berlogo = (o) => { const l = logoOrgSatu(o.id, o.nama, o.logo); return l && !l.startsWith("/img/logo/org/") ? 0 : 1; };
  const daftar = [...D.org].sort((a, z) => (stat.get(z.id)?.mw || 0) - (stat.get(a.id)?.mw || 0) || (stat.get(z.id)?.n || 0) - (stat.get(a.id)?.n || 0) || berlogo(a) - berlogo(z) || a.nama.localeCompare(z.nama));
  const kartu = daftar.map((o, i) => {
    const lg = logoOrgSatu(o.id, o.nama, o.logo), nama = o.singkatan || o.nama, kk = o.kategori?.kode, kat = KAT[kk];
    const kp = kat ? `<span class="tkp-pil tkp-k-${kat[0]}">${ikon(kat[1], 14)}<span>${esc(t("tk.kat." + kat[0]))}</span></span>` : `<span class="tkp-pil tkp-k-lain">${ikon("direktori", 14)}<span>${esc(o.kategori?.label || "-")}</span></span>`;
    const neg = String(o.internasional?.negara || "").toLowerCase(), bendera = /^[a-z]{2}$/.test(neg) ? `<img class="tkp-bd" src="/img/bendera/${neg}.svg" width="18" height="13" alt="${esc(neg.toUpperCase())}" loading="lazy" decoding="async" data-lg="1">` : "";
    const peran = (o.peran_rantai || []).slice(0, 2).map((r) => `<span class="tkp-pil tkp-peran">${esc(ada("tk.peran." + r) ? t("tk.peran." + r) : r)}</span>`).join("");
    const s = stat.get(o.id);
    return `<li class="tkp-li"${i >= PER_PEMAIN ? " hidden" : ""}><a class="tkp-kartu" href="/o/${esc(o.id)}"><span class="tkp-lg">${mono(nama, o.id)}${lg ? `<img src="${esc(lg)}" data-lg="1" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}</span><span class="tkp-nm">${bendera}<strong>${esc(nama)}</strong></span><span class="tkp-pils">${kp}${peran}</span><small class="tkp-st">${esc(s ? t("tk.u.pemain.proyek", { n: num(s.n), mw: num(s.mw) }) : t("tk.u.pemain.nol"))}</small></a></li>`;
  }).join("");
  return bagian("tk-pemain", "direktori", "pemain", {
    judulHtml: hlHtml("tk.s.pemain.j", num(D.org.length), { nama: nm(KODE) }), sub: esc(t("tk.s.pemain.sub")),
    isiHtml: `<ul class="tkp-grid">${kartu}</ul>` + navLokal({ total: daftar.length, per: PER_PEMAIN, satuan: "jm.pag.u.data" }), sumber: src("tk.src.org", ORG.dibangun_pada),
  });
}

function sBerita(D) {
  if (!D.ber.length) return "";
  const kartu = D.ber.slice(0, 6).map((b) => {
    const f = b.gambar || fotoBerita(FOTO, b.id), u = amanUrl(b.url), lg = logoLokal(b.media), nmMedia = namaMedia(b.media);
    const sampul = f ? `<img class="tkp-sp" src="${esc(f)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-lg="1">`
      : `<span class="tkp-sp tkp-sp-l jm-tek-${esc(KODE)}"><span class="tkp-lm"><b>${esc(inisial(nmMedia))}</b>${lg ? `<img src="${esc(lg)}" alt="" loading="lazy" decoding="async" data-lg="1">` : ""}</span></span>`;
    return `<li><a class="tkp-brt" href="${esc(u || "#")}" target="_blank" rel="noopener noreferrer">${sampul}<span class="tkp-bt">${esc(rapi(b.judul))}</span><span class="tkp-pils">${(b.kepakaran || []).slice(0, 2).map(pilTek).join("")}</span><small class="tkp-md">${lg ? `<img src="${esc(lg)}" width="16" height="16" alt="" loading="lazy" decoding="async" data-lg="1">` : ""}<span>${esc(nmMedia)}, ${esc(tanggal(String(b.terbit).slice(0, 10)))}</span></small></a></li>`;
  }).join("");
  return bagian("tk-berita", "berita", "berita", {
    judulHtml: hlHtml("tk.s.berita.j", num(D.ber.length), { nama: nm(KODE) }), sub: esc(t("tk.s.berita.sub")),
    isiHtml: `<ul class="tkp-berita">${kartu}</ul>`, sumber: src("tk.src.berita", BER.dibangun_pada),
    kakiHtml: lihatSemuaHtml(`/berita?teknologi=${encodeURIComponent(C.kep)}`, t("tk.lihat.berita"), num(D.ber.length)),
  });
}

/* tautan lanjut ke halaman lain yang membahas teknologi ini (rantai global, model keuangan, panduan, energi baru, sejarah) */
const RANTAI_TAB = { surya: "surya", bayu: "bayu", hidro: "hidro", "panas-bumi": "panas-bumi", hidrogen: "hidrogen", bioenergi: "biomassa", "biomassa-sampah": "wte" };
function sTelusur() {
  const tautan = [
    RANTAI_TAB[KODE] && ["globe", `/rantai-global?tab=${RANTAI_TAB[KODE]}`, "tk.tl.rantai"],
    KODE !== "nuklir" && ["kalkulator", `/investasi?tek=${encodeURIComponent(KODE)}#model`, "tk.tl.model"],
    ["buku", "/panduan", "tk.tl.panduan"],
    ["energi-baru", "/transisi-pltu?tab=enb", "tk.tl.baru"],
    ["linimasa", "/sejarah", "tk.tl.sejarah"],
  ].filter(Boolean);
  return exHtml({ id: "tk-telusur", ikon: "tautan", topik: t("tk.tl.ey"), judulHtml: esc(t("tk.tl.j", { nama: nm(KODE) })), isiHtml: `<ul class="jm-tk-telusur">${tautan.map(([ik, href, k]) => `<li>${ikon(ik, 18)}<a href="${esc(href)}">${esc(t(k))}</a></li>`).join("")}</ul>` });
}

function sCara(D) {
  const baris = ["tk.cara.1", "tk.cara.2", "tk.cara.3", "tk.cara.4"].map((k) => `<li>${esc(t(k))}</li>`).join("");
  return exHtml({ id: "tk-cara", ikon: "metode", topik: t("an.ey.metode"), judulHtml: esc(t("an.cara")), isiHtml: `<ol class="jm-tk-cara">${baris}</ol>` });
}

export async function mulai(el) {
  if (!C) return;
  isi = el;
  el.innerHTML = hantuHtml(6);
  const ambil = (n) => muat(n).catch(() => null);
  [PEL, RUPTL, PROY, RANTAI, TKDN, REG, ORG, BER, FOTO, WKP, ATAP] = await Promise.all(
    ["peluang", "ruptl", "proyek", C.rantai ? "rantai_plts" : null, C.tkdn ? "tkdn" : null, "regulasi", "organisasi", "berita", "berita_foto", C.wkp ? "wkp" : null, C.atap ? "plts_atap" : null].map((n) => (n ? ambil(n) : null)),
  );
  if (!PEL && !PROY && !REG && !BER) { el.innerHTML = ""; tampilGalat(el, () => location.reload()); return; }
  const D = olah();
  el.innerHTML = [sPotensi(D), sRuptl(D), sProyek(D), C.rantai || C.tkdn ? sRantai() : "", C.wkp ? sWkp() : "", C.atap ? sAtap() : "", sHarga(), sReg(D), sPemain(D), sBerita(D), sTelusur(), sCara(D)].join("");
  pasangBar(el);
  const wProduk = el.appendChild(document.createElement("div")); wProduk.hidden = true;
  pasangProdukTerkait(wProduk, { j: "tek", k: KODE });
  terkaitHtml("teknologi", KODE).then((h) => { if (h && el.isConnected) el.insertAdjacentHTML("beforeend", h); });
  /* logo yang gagal dimuat dicabut (cadangan monogram) (tanpa atribut on*) */
  el.addEventListener("error", (e) => {
    const im = e.target;
    if (im.tagName === "IMG" && im.dataset.lg) im.remove();
  }, true);
  pasangLokal(el, (w) => w.closest(".jm-ex-bd").querySelectorAll("tbody tr, .tkp-li"));
}
