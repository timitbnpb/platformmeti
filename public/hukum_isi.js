/* Tab "Pustaka hukum" di /regulasi (dimuat malas). Empat subtab (hash): #hukum (cari), #hdokumen / #hd=<id>&s=<segmen>, #htanya, #hrelasi. Data dari /api/hukum/* dan /data/hukum/katalog.json. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, judulHuruf, ikon, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { cariHtml, pilihHtml, exHtml, sumberHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { tabHalaman } from "/inti/tab_halaman.js";
import { label, urlAman } from "/publik.js";
import { bedaTeks, ringkasBeda, pasangPasal } from "/inti/beda_teks.js";

const PER = 20, LOKAL = 20;
const S = { q: "", jenis: "", tahun: "", status: "", hal: 1 };
let KAT = null, RINGKAS = null, belumAktif = false;
const el = (id) => document.getElementById(id);

/* ---------- pembantu ---------- */
const LOGO = (id, sing) => /^permen-esdm|^kepmen-esdm/.test(id) ? "/img/logo/esdm.png" : /^permen-keuangan/.test(id) ? "/img/logo/kemenkeu.png" : /^permen-(lhk|lh|hut)/.test(id) ? "/img/logo/kemenhut.png"
  : sing === "OJK" ? "/img/logo/ojk.png" : ["UU", "PP", "PERPRES", "KEPPRES", "INPRES", "PERPPU"].includes(sing) ? "/img/penerbit/garuda.png" : "/img/penerbit/gedung.svg";
const IK_J = { UU: "palu", PP: "regulasi", PERPRES: "perisai", PERMEN: "gedung", PERDA: "lokasi", OJK: "pembiayaan", KEPPRES: "bintang", INPRES: "siaran", PERPPU: "peringatan", KEPMEN: "gedung", LAINNYA: "daftar" };
const pilJenis = (s) => s ? `<span class="jm-pil hk-j" data-j="${esc(s)}">${ikon(IK_J[s] || "daftar", 14)}${esc(label("hk.j.", s))}</span>` : "";
const IK_ST = { berlaku: "centang", diubah: "ubah", dicabut: "silang" };
const pilStatus = (s) => s ? `<span class="jm-pil ${{ berlaku: "jm-pil-ok", diubah: "jm-pil-warn", dicabut: "jm-pil-bad" }[s] || ""}">${ikon(IK_ST[s] || "info", 14)}${esc(label("reg.status.", s))}</span>` : `<span class="jm-pil">${ikon("info", 14)}${esc(t("hk.status.tak"))}</span>`;
const nama = (d) => `${label("hk.j.", d.singkatan)} ${d.nomor ?? ""}/${d.tahun ?? ""}`.trim();
const bukaHref = (id, seg) => `#hd=${encodeURIComponent(id)}${seg ? "&s=" + seg : ""}`;
const haluan = () => new URLSearchParams(location.hash.replace(/^#h/, ""));

/* teks aman lewat DOM: cuplikan "[[sorot]]" jadi <mark>, paragraf dari baris baru */
function cuplikanEl(str, tag = "p", kelas = "hk-cup") {
  const p = document.createElement(tag); p.className = kelas;
  String(str ?? "").split(/(\[\[|\]\])/).reduce((sorot, bag) => {
    if (bag === "[[") return true; if (bag === "]]") return false;
    if (!bag) return sorot;
    if (sorot) { const m = document.createElement("mark"); m.textContent = bag; p.append(m); } else p.append(document.createTextNode(bag));
    return sorot;
  }, false);
  return p;
}
function teksEl(str) {
  const w = document.createElement("div"); w.className = "hk-teks";
  for (const baris of String(str ?? "").split("\n")) { const p = document.createElement("p"); p.textContent = baris; w.append(p); }
  return w;
}
const tidakAktif = () => kosongHtml("hk.belum");
async function ambil(jalur, opsi) {
  try { return await api(jalur, opsi); } catch (e) { if (e.status === 503) { belumAktif = true; return null; } throw e; }
}
async function muatKatalog() {
  if (KAT) return KAT;
  const r = await fetch("/data/hukum/katalog.json", { credentials: "same-origin" });
  KAT = r.ok ? await r.json() : { dok: [], relasi: [], definisi: [] };
  KAT.byId = new Map(KAT.dok.map((d) => [d.id, d]));
  return KAT;
}

/* ---------- tab cari ---------- */
const adaFilter = () => !!(S.q || S.jenis || S.tahun || S.status);
function bentukCari() {
  const contoh = ["c1", "c2", "c3", "c4"].map((k) => `<button type="button" class="hk-chip" data-contoh="${esc(t("hk.cari." + k))}">${ikon("cari2", 14)}${esc(t("hk.cari." + k))}</button>`).join("");
  el("panelCari").innerHTML = `<div class="hk-panel">${exHtml({ id: "ex-cari", ikon: "cari2", topik: t("hk.ex.cari.ey"), judulHtml: hlHtml("hk.ex.cari.j", t("hk.ex.cari.hl")), subHtml: esc(t("hk.ex.cari.sub")),
    aksiHtml: sumberHtml(esc(t("hk.sumber"))),
    isiHtml: `<div class="hk-hero">${cariHtml({ id: "hq", label: t("hk.cari.label") })}<div class="hk-contoh"><span>${esc(t("hk.cari.contoh"))}</span>${contoh}</div><div class="hk-saring" id="hsaring"></div></div><div id="hhasil"></div><div class="jm-hal" id="hhal"></div>` })}</div>`;
  el("hq").value = S.q;
}
function saringHtml(perJenis) {
  const thn = []; for (let y = new Date().getFullYear(); y >= 2000; y--) thn.push([String(y), String(y)]);
  const jn = Object.keys(perJenis || {});
  for (const j of ["UU", "PP", "PERPRES", "PERMEN", "PERDA"]) if (!jn.includes(j)) jn.push(j);
  const j = jn.map((v) => [v, label("hk.j.", v), IK_J[v] || "daftar", perJenis?.[v]]);
  const st = ["berlaku", "diubah", "dicabut"].map((v) => [v, label("reg.status.", v), IK_ST[v]]);
  el("hsaring").innerHTML = pilihHtml({ id: "hjenis", ikon: "jenis", label: t("hk.semua.jenis"), opsi: [["", t("hk.semua.jenis"), "daftar"], ...j], nilai: S.jenis })
    + pilihHtml({ id: "htahun", ikon: "tahun", label: t("hk.semua.tahun"), opsi: [["", t("hk.semua.tahun"), "kalender"], ...thn.map(([a, b]) => [a, b, "kalender"])], nilai: S.tahun })
    + pilihHtml({ id: "hstatus", ikon: "status", label: t("hk.semua.status"), opsi: [["", t("hk.semua.status"), "info"], ...st], nilai: S.status })
    + `<button type="button" class="jm-hapus" id="hhapus"${adaFilter() ? "" : " hidden"}>${ikon("silang", 16)}${esc(t("jm.kosong.reset"))}</button>`;
}
async function jalankanCari() {
  const hasil = el("hhasil"), hal = el("hhal");
  if (!S.q.trim()) { hasil.innerHTML = kosongHtml("hk.cari.mulai"); hal.replaceChildren(); if (!el("hsaring").children.length) saringHtml(null); return; }
  hasil.innerHTML = hantuHtml(4);
  const u = new URLSearchParams({ q: S.q.trim(), hal: S.hal }); for (const k of ["jenis", "tahun", "status"]) if (S[k]) u.set(k, S[k]);
  let d;
  try { d = await ambil("/api/hukum/cari?" + u); } catch (e) { hasil.innerHTML = e.status === 422 ? kosongHtml("hk.cari.kosong") : galatHtml(e.kode); return; }
  if (!d) { hasil.innerHTML = tidakAktif(); return; }
  saringHtml(d.per_jenis); el("hhapus").hidden = !adaFilter();
  if (!d.hasil.length) { hasil.innerHTML = kosongHtml("hk.cari.kosong"); hal.replaceChildren(); return; }
  hasil.innerHTML = `<p class="jm-hitung" role="status">${esc(t("hk.cari.hasil", { n: angka(d.total) }))}${d.longgar ? ` <span class="jm-pil jm-pil-warn">${ikon("info", 14)}${esc(t("hk.cari.longgar"))}</span>` : ""}</p><ul class="hk-daftar">${d.hasil.map((r, i) => `<li class="hk-kartu" data-buka="${esc(r.dok)}" data-seg="${r.segmen}" data-i="${i}" tabindex="0">
    <div class="hk-kep"><img src="${esc(LOGO(r.dok, r.singkatan))}" alt="" loading="lazy" decoding="async"><div><p class="hk-nama">${esc(nama(r))}</p><p class="hk-sub">${esc(judulHuruf(r.judul))}</p></div></div>
    <div class="hk-meta">${pilJenis(r.singkatan)}${pilStatus(r.status)}<span class="hk-pasal">${esc(r.label)}${r.bab ? " | " + esc(r.bab) : ""}</span></div><div data-cup></div></li>`).join("")}</ul>`;
  hasil.querySelectorAll("[data-cup]").forEach((w, i) => w.replaceWith(cuplikanEl(d.hasil[i].cuplikan)));
  hal.innerHTML = paginasiHtml({ hal: d.hal, total: d.total, per: PER, satuan: "hk.satuan.pasal" });
}
function pasangCari() {
  const tunda = () => nanti(() => { jalankanCari(); });
  const tundaKetik = debounce(() => { S.hal = 1; tunda(); });
  const p = el("panelCari");
  p.addEventListener("input", (e) => { if (e.target.id === "hq") { S.q = e.target.value; tundaKetik(); } });
  p.addEventListener("change", (e) => { const m = { hjenis: "jenis", htahun: "tahun", hstatus: "status" }[e.target.id]; if (m) { S[m] = e.target.value; S.hal = 1; el("hhapus").hidden = !adaFilter(); tunda(); } });
  p.addEventListener("click", (e) => {
    const c = e.target.closest("[data-contoh]"); if (c) { S.q = c.dataset.contoh; S.hal = 1; el("hq").value = S.q; tunda(); return; }
    if (e.target.closest("#hhapus")) { Object.assign(S, { q: "", jenis: "", tahun: "", status: "", hal: 1 }); el("hq").value = ""; saringHtml(null); tunda(); return; }
    const b = e.target.closest("[data-hal]"); if (b && !b.disabled) { S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); tunda(); nanti(() => el("ex-cari").scrollIntoView({ block: "start" })); return; }
    const k = e.target.closest("[data-buka]"); if (k) location.hash = bukaHref(k.dataset.buka, k.dataset.seg);
  });
  p.addEventListener("keydown", (e) => { const k = e.target.closest?.("[data-buka]"); if (k && e.key === "Enter" && !e.isComposing && e.keyCode !== 229) location.hash = bukaHref(k.dataset.buka, k.dataset.seg); });
}

/* ---------- tab dokumen ---------- */
const L = { q: "", jenis: "", hal: 1 };
async function daftarDok() {
  const kat = await muatKatalog();
  const q = L.q.trim().toLowerCase();
  const baris = kat.dok.filter((d) => (!L.jenis || d.singkatan === L.jenis) && (!q || `${d.judul} ${nama(d)} ${d.id}`.toLowerCase().includes(q)));
  const dari = (L.hal - 1) * LOKAL, tampil = baris.slice(dari, dari + LOKAL);
  const jn = [...new Set(kat.dok.map((d) => d.singkatan))];
  el("hdaftar").innerHTML = tampil.length ? `<ul class="hk-daftar">${tampil.map((d) => `<li class="hk-kartu" data-buka="${esc(d.id)}" tabindex="0">
    <div class="hk-kep"><img src="${esc(LOGO(d.id, d.singkatan))}" alt="" loading="lazy" decoding="async"><div><p class="hk-nama">${esc(nama(d))}</p><p class="hk-sub">${esc(judulHuruf(d.judul))}</p></div></div>
    <div class="hk-meta">${pilJenis(d.singkatan)}${pilStatus(d.status)}<span class="jm-pil">${ikon("daftar2", 14)}${esc(t("hk.dok.halaman", { n: angka(d.halaman) }))}</span>${d.halaman_ocr ? `<span class="jm-pil hk-pil-r">${ikon("pdf", 14)}${esc(t("hk.dok.ocr"))}</span>` : ""}</div></li>`).join("")}</ul>` : kosongHtml("hk.cari.kosong");
  el("hdhal").innerHTML = paginasiHtml({ hal: L.hal, total: baris.length, per: LOKAL, satuan: "hk.satuan.dok" });
  if (el("hdjenis").options.length < 2) el("hdjenis").closest("label").outerHTML = pilihHtml({ id: "hdjenis", ikon: "jenis", label: t("hk.semua.jenis"), opsi: [["", t("hk.semua.jenis"), "daftar"], ...jn.map((v) => [v, label("hk.j.", v), IK_J[v] || "daftar"])], nilai: L.jenis });
}
function bentukDaftar() {
  el("panelDokumen").innerHTML = `<div class="hk-panel">${exHtml({ id: "ex-dok", ikon: "buku", topik: t("hk.ex.dok.ey"), judulHtml: hlHtml("hk.ex.dok.j", t("hk.ex.dok.hl")), subHtml: esc(t("hk.ex.dok.sub")),
    isiHtml: `<div class="hk-saring">${cariHtml({ id: "hdq", label: t("hk.dok.cari") })}${pilihHtml({ id: "hdjenis", ikon: "jenis", label: t("hk.semua.jenis"), opsi: [["", t("hk.semua.jenis"), "daftar"]], nilai: "" })}</div><div id="hdaftar">${hantuHtml(4)}</div><div class="jm-hal" id="hdhal"></div>` })}</div>`;
}
async function tampilDokumen(id, seg) {
  const w = el("panelDokumen");
  w.innerHTML = `<div class="hk-panel">${hantuHtml(6)}</div>`;
  let d;
  try { d = await ambil("/api/hukum/dok?id=" + encodeURIComponent(id)); } catch (e) { w.innerHTML = `<div class="hk-panel">${e.status === 404 ? kosongHtml("hk.dok.tak_ada", { data: "balik", kunci: "hk.dok.balik" }) : galatHtml(e.kode)}</div>`; return; }
  if (!d) { w.innerHTML = tidakAktif(); return; }
  const o = d.dok, pdf = (o.pdf || []).map(urlAman).find(Boolean), kat = KAT || await muatKatalog().catch(() => null);
  const info = [[t("hk.dok.jenis"), label("hk.j.", o.singkatan)], [t("hk.dok.nomor"), `${o.nomor ?? "-"}/${o.tahun ?? "-"}`], [t("hk.dok.tetap"), o.tgl_tetap ? tanggal(o.tgl_tetap) : "-"], [t("hk.dok.sumberdom"), o.sumber || "-"],
    [t("hk.dok.mutu_l"), o.mutu != null ? angka(o.mutu * 100) + "%" : "-"], [t("hk.dok.halaman_l"), angka(o.halaman)]];
  const bagi = (s) => { const g = []; let cur = null; for (const x of s) { const b = x.bab || ""; if (!cur || cur.b !== b) { cur = { b, s: [] }; g.push(cur); } cur.s.push(x); } return g; };
  const grup = bagi(d.segmen);
  const isi = grup.map((g) => `${g.b ? `<button type="button" class="hk-bab" data-s="${g.s[0].id}">${esc(g.b)}</button>` : ""}${g.s.map((x) => `<button type="button" data-s="${x.id}">${esc(x.label)}</button>`).join("")}`).join("");
  const rel = (daftar, arah) => daftar.length ? `<ul>${daftar.map((r) => `<li>${r.terdaftar === 0 && arah === "keluar" ? `<span class="hk-nama2">${esc(r.judul || r.id)}</span><span class="jm-pil">${esc(t("hk.rl.luar"))}</span>` : `<button type="button" data-buka="${esc(r.id)}">${esc(r.judul || r.id)}</button>${pilStatus(r.status)}`}<span class="jm-pil">${esc(label("hk.rel.", r.jenis))}</span></li>`).join("")}</ul>` : `<p class="hk-sub">${esc(t("hk.dok.kosong_rel"))}</p>`;
  /* banding pasal (F65-111): dokumen ini mengubah/mengganti dokumen lain (= ada versi sebelumnya), atau diubah/diganti dokumen lain (= ada versi sesudahnya) */
  const UBAH = new Set(["mengubah", "mengganti"]);
  const sebelum = d.keluar.filter((r) => UBAH.has(r.jenis) && r.terdaftar !== 0), sesudah = d.masuk.filter((r) => UBAH.has(r.jenis));
  const tblBd = (r, arah) => `<button type="button" class="jm-tbl" data-banding="${esc(r.id)}" data-arah="${arah}">${ikon("banding", 16)}<span>${esc(t(arah === "sebelum" ? "rgb.sebelum" : "rgb.sesudah"))}</span><small>${esc(r.judul || r.id)}</small></button>`;
  const bandingHtml = sebelum.length || sesudah.length ? `<div class="hk-aksi hk-bd-aksi">${sebelum.map((r) => tblBd(r, "sebelum")).join("")}${sesudah.map((r) => tblBd(r, "sesudah")).join("")}</div><div id="hbanding" class="hk-bd" aria-live="polite"></div>` : "";
  w.innerHTML = `<div class="hk-panel"><div class="hk-aksi"><button type="button" class="jm-tbl" data-aksi="balik">${ikon("panah-kiri", 16)}${esc(t("hk.dok.balik"))}</button></div>
    ${exHtml({ id: "ex-satu", ikon: "palu", topik: label("hk.j.", o.singkatan), judulHtml: esc(`${nama(o)}: ${judulHuruf(o.judul)}`), subHtml: "",
      aksiHtml: sumberHtml(esc(o.sumber || "")),
      isiHtml: `<div class="hk-meta">${pilJenis(o.singkatan)}${pilStatus(o.status)}${o.resmi ? "" : `<span class="jm-pil jm-pil-warn">${ikon("peringatan", 14)}${esc(t("hk.dok.nonresmi"))}</span>`}${o.ocr ? `<span class="jm-pil hk-pil-r">${ikon("pdf", 14)}${esc(t("hk.dok.ocr"))}</span>` : ""}</div>
      <dl class="hk-dl">${info.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      <div class="hk-aksi">${pdf ? `<a class="jm-tbl jm-tbl-utama" href="${esc(pdf)}" target="_blank" rel="noopener noreferrer">${ikon("pdf", 16)}${esc(t("hk.dok.pdf"))}</a>` : ""}${urlAman(o.url) ? `<a class="jm-tbl" href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}${esc(t("hk.dok.sumber"))}</a>` : ""}${o.regulasi_id ? `<a class="jm-tbl" href="/regulasi?id=${encodeURIComponent(o.regulasi_id)}">${ikon("regulasi", 16)}${esc(t("hk.dok.di_regulasi"))}</a>` : ""}</div>` })}
    ${bandingHtml}
    <div id="hringkas" aria-live="polite"></div>
    <div class="hk-dok"><aside class="hk-isi" aria-label="${esc(t("hk.dok.isi"))}"><h3>${esc(t("hk.dok.isi"))}</h3>${isi}</aside><div class="hk-bacaan" id="hbaca"></div></div>
    ${exHtml({ id: "ex-rel", ikon: "rantai", topik: t("hk.dok.relasi"), judulHtml: esc(t("hk.dok.relasi_j")), subHtml: "", isiHtml: `<div class="hk-rel"><section><h3>${esc(t("hk.dok.keluar"))}</h3>${rel(d.keluar, "keluar")}</section><section><h3>${esc(t("hk.dok.masuk"))}</h3>${rel(d.masuk, "masuk")}</section></div>` })}</div>`;
  const baca = el("hbaca");
  for (const x of d.segmen) {
    const s = document.createElement("article"); s.className = "hk-seg"; s.id = "seg-" + x.id; if (String(x.id) === String(seg)) s.dataset.sorot = "ya";
    const h = document.createElement("h3"); h.textContent = x.label + (x.halaman ? ` (${t("hk.dok.hal", { n: x.halaman })})` : "");
    s.append(h, teksEl(x.teks)); baca.append(s);
  }
  if (!d.segmen.length) baca.innerHTML = kosongHtml("hk.dok.tanpa_teks");
  const lompat = (sid) => { const a = el("seg-" + sid); if (!a) return; for (const b of baca.querySelectorAll("[data-sorot]")) delete b.dataset.sorot; a.dataset.sorot = "ya"; a.scrollIntoView({ block: "start", behavior: "smooth" }); };
  if (seg) nanti(() => lompat(seg));
  w.querySelector(".hk-isi").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (b) lompat(b.dataset.s); });
  /* ringkasan mesin (F65-304): pasal yang dikutip melompat ke teksnya; tombol buat hanya tampil bagi admin bila AI tersedia */
  const noPasal = (l) => (String(l).match(/^\s*pasal\s+(\d{1,4}[a-z]?)\b/i) || [])[1]?.toUpperCase();
  const segPasal = new Map(); for (const x of d.segmen) { const n = x.jenis === "pasal" ? noPasal(x.label) : null; if (n && !segPasal.has(n)) segPasal.set(n, x.id); }
  ringkasan(id, segPasal);
  el("hringkas").addEventListener("click", (e) => {
    const b = e.target.closest("[data-s]"); if (b) return lompat(b.dataset.s);
    const m = e.target.closest("[data-rk-buat]"); if (!m || m.disabled) return;
    m.disabled = true; m.setAttribute("aria-busy", "true");   // chrome urgent
    nanti(() => ringkasan(id, segPasal, true));
  });
  w.querySelector(".hk-bd-aksi")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-banding]"); if (!b) return;
    for (const x of w.querySelectorAll("[data-banding]")) x.setAttribute("aria-pressed", String(x === b));   // chrome urgent
    nanti(() => banding(d, b.dataset.banding, b.dataset.arah));
  });
}
/* Ringkasan mesin per peraturan (F65-304). Teks butir adalah keluaran model yang sudah lolos pemeriksa kutipan server; tetap hanya masuk lewat esc.
   Tanpa ringkasan dan tanpa hak membuat: tidak ada yang tampil (fitur yang belum jalan disembunyikan). */
async function ringkasan(id, segPasal, buat = false) {
  const w = el("hringkas"); if (!w) return;
  let r, pesan = "";
  /* api langsung (bukan ambil): 503 di sini berarti AI atau tembolok belum aktif, bukan seluruh pustaka */
  try { r = await api("/api/hukum/ringkasan" + (buat ? "" : "?id=" + encodeURIComponent(id)), buat ? { metode: "POST", badan: { id } } : undefined); }
  catch (e) { if (!buat) { w.replaceChildren(); return; } pesan = t(e.status === 429 ? "rk.laju" : "rk.gagal"); r = { ada: false, boleh_buat: true }; }
  if (buat && !r.ada && r.sebab) { pesan = t("rk.sebab." + r.sebab); r.boleh_buat = true; }
  if (r.ada) {
    const butir = r.butir.map((b) => `<li><p>${esc(b.k)}</p><span class="hk-rk-p">${b.p.map((l) => { const sid = segPasal.get(String(l).replace(/^Pasal\s+/, "")); return sid ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-s="${esc(sid)}">${ikon("palu", 14)}<span>${esc(l)}</span></button>` : `<span class="jm-pil">${esc(l)}</span>`; }).join("")}</span></li>`).join("");
    w.innerHTML = exHtml({ id: "ex-ringkas", ikon: "analisis", topik: t("rk.ey"), judulHtml: esc(t("rk.j")), subHtml: `<span class="jm-pil jm-pil-warn">${ikon("info", 14)}${esc(t("rk.ey"))}</span> ${esc(t("rk.penafian"))}`,
      isiHtml: `<ol class="hk-rk">${butir}</ol><p class="hk-sub">${esc(t("rk.asal", { n: angka(r.dikirim), total: angka(r.total) }))} ${esc(t("rk.model", { model: String(r.model).split("/").pop(), tgl: tanggal(new Date(r.dibuat * 1000).toISOString().slice(0, 10)) }))}</p>` });
    return;
  }
  w.innerHTML = r.boleh_buat ? `<div class="hk-panel hk-rk-buat"><p class="hk-sub">${esc(pesan || t("rk.buat_ket"))}</p><button type="button" class="jm-tbl" data-rk-buat>${ikon("analisis", 16)}<span>${esc(t("rk.buat"))}</span></button></div>` : "";
}
/* Beda per pasal antara dokumen yang sedang dibuka dan dokumen lain. Teks pasal adalah data luar: hanya masuk lewat textContent.
   Tiap pasal dihitung dalam giliran sendiri (nanti) supaya dokumen berpasal banyak tidak membekukan layar. */
let gilirBanding = 0;
async function banding(d, idLain, arah) {
  const w = el("hbanding"), gilir = ++gilirBanding;
  w.innerHTML = hantuHtml(3);
  let lain;
  try { lain = await ambil("/api/hukum/dok?id=" + encodeURIComponent(idLain)); } catch (e) { if (gilir === gilirBanding) w.innerHTML = e.status === 404 ? kosongHtml("rgb.tak_ada") : galatHtml(e.kode); return; }
  if (gilir !== gilirBanding) return;
  if (!lain) { w.innerHTML = tidakAktif(); return; }
  const [lama, baru] = arah === "sebelum" ? [lain, d] : [d, lain];
  const { pasangan, tetap } = pasangPasal(lama.segmen, baru.segmen);
  if (!pasangan.length) { w.innerHTML = kosongHtml("rgb.kosong"); return; }
  w.innerHTML = `<div class="hk-bd-kep"><h3>${esc(t("rgb.j", { lama: nama(lama.dok), baru: nama(baru.dok) }))}</h3><p class="hk-sub" id="hbdRingkas"></p>
    <p class="hk-bd-leg"><ins><span aria-hidden="true">+</span> ${esc(t("rgb.leg.tambah"))}</ins><del><span aria-hidden="true">-</span> ${esc(t("rgb.leg.hapus"))}</del></p></div><div id="hbdIsi" class="hk-bd-isi"></div>`;
  const isi = el("hbdIsi"); let berubah = 0, sisip = 0, i = 0;
  const satu = () => {
    if (gilir !== gilirBanding || !isi.isConnected) return;
    const p = pasangan[i++], ops = bedaTeks(p.lama ?? "", p.baru), r = ringkasBeda(ops), sama = !r.tambah && !r.hapus;
    if (p.lama == null) sisip++; else if (!sama) berubah++;
    const a = document.createElement("article"); a.className = "hk-seg hk-bd-p";
    const h = document.createElement("h3"); h.textContent = t("rgb.pasal", { n: p.pasal });
    const pil = document.createElement("span"); pil.className = "jm-pil " + (p.lama == null ? "jm-pil-ok" : sama ? "" : "jm-pil-warn");
    pil.textContent = p.lama == null ? t("rgb.st.sisip") : sama ? t("rgb.st.sama") : t("rgb.st.ubah", { tambah: angka(r.tambah), hapus: angka(r.hapus) });
    h.append(" ", pil);
    const b = document.createElement("p"); b.className = "hk-bd-t";
    for (const o of ops) {
      if (o.j === "sama") { b.append(document.createTextNode(o.s + " ")); continue; }
      const x = document.createElement(o.j === "tambah" ? "ins" : "del"), tanda = document.createElement("span");
      tanda.textContent = o.j === "tambah" ? "+" : "-"; tanda.className = "hk-bd-tanda"; tanda.setAttribute("aria-hidden", "true");
      x.append(tanda, document.createTextNode(o.s)); b.append(x, document.createTextNode(" "));
    }
    a.append(h, b); isi.append(a);
    if (i < pasangan.length) nanti(satu);
    else el("hbdRingkas").textContent = t("rgb.ringkas", { n: angka(pasangan.length), berubah: angka(berubah), sisip: angka(sisip), tetap: angka(tetap) });
  };
  satu();
}
function pasangDokumen() {
  const w = el("panelDokumen");
  w.addEventListener("input", (e) => { if (e.target.id === "hdq") { L.q = e.target.value; L.hal = 1; tundaDaftar(); } });
  w.addEventListener("change", (e) => { if (e.target.id === "hdjenis") { L.jenis = e.target.value; L.hal = 1; tundaDaftar(); } });
  w.addEventListener("click", (e) => {
    if (e.target.closest("[data-aksi=balik]")) { location.hash = "#hdokumen"; return; }
    const b = e.target.closest("[data-hal]"); if (b && !b.disabled) { L.hal = +b.dataset.hal; sorotHalaman(b, L.hal); tundaDaftar(); return; }
    const k = e.target.closest("[data-buka]"); if (k) location.hash = bukaHref(k.dataset.buka);
  });
  w.addEventListener("keydown", (e) => { const k = e.target.closest?.("[data-buka]"); if (k && e.key === "Enter" && !e.isComposing && e.keyCode !== 229) location.hash = bukaHref(k.dataset.buka); });
}
const tundaDaftar = debounce(() => nanti(daftarDok));
async function muatDokumen() {
  const p = haluan(), id = p.get("d");
  if (id) { await tampilDokumen(id, p.get("s")); return; }
  bentukDaftar(); await daftarDok();
}

/* ---------- tab tanya ---------- */
function bentukTanya() {
  const contoh = ["c1", "c2", "c3"].map((k) => `<button type="button" class="hk-chip" data-contoh="${esc(t("hk.tanya." + k))}">${ikon("tanya", 14)}${esc(t("hk.tanya." + k))}</button>`).join("");
  el("panelTanya").innerHTML = `<div class="hk-panel">${exHtml({ id: "ex-tanya", ikon: "tanya", topik: t("hk.ex.tanya.ey"), judulHtml: hlHtml("hk.ex.tanya.j", t("hk.ex.tanya.hl")), subHtml: esc(t("hk.ex.tanya.sub")),
    isiHtml: `<form class="hk-tanya" id="htform"><label class="sr" for="htq">${esc(t("hk.tanya.label"))}</label><textarea id="htq" maxlength="500" placeholder="${esc(t("hk.tanya.label"))}"></textarea>
      <div class="hk-contoh"><span>${esc(t("hk.tanya.contoh"))}</span>${contoh}</div><div class="hk-aksi"><button type="submit" class="jm-tbl jm-tbl-utama">${ikon("tanya", 16)}${esc(t("hk.tanya.kirim"))}</button></div></form><div id="htjawab" aria-live="polite"></div>` })}</div>`;
  const q = el("htq");
  el("panelTanya").addEventListener("click", (e) => { const c = e.target.closest("[data-contoh]"); if (c) { q.value = c.dataset.contoh; q.focus(); return; } const k = e.target.closest("[data-buka]"); if (k) location.hash = bukaHref(k.dataset.buka, k.dataset.seg); });
  el("htform").addEventListener("submit", (e) => { e.preventDefault(); nanti(() => kirimTanya(q.value.trim())); });
}
function kartuSegmen(s, kutip) {
  const k = document.createElement("div"); k.className = "hk-kutip"; k.dataset.buka = s.dok; k.dataset.seg = s.segmen; k.tabIndex = 0;
  const h = document.createElement("p"); h.className = "hk-pasal"; h.textContent = `${s.judul ? s.judul + " | " : ""}${s.label}`;
  const b = document.createElement("blockquote"); b.textContent = kutip;
  k.append(h, b); return k;
}
async function kirimTanya(q) {
  const out = el("htjawab");
  if (q.length < 5) { out.innerHTML = kosongHtml("hk.tanya.pendek"); return; }
  out.innerHTML = hantuHtml(3);
  let d;
  try { d = await ambil("/api/hukum/tanya", { metode: "POST", badan: { pertanyaan: q } }); } catch (e) { out.innerHTML = e.status === 429 ? kosongHtml("hk.tanya.laju") : e.status === 422 ? kosongHtml("hk.tanya.pendek") : galatHtml(e.kode); return; }
  if (!d) { out.innerHTML = tidakAktif(); return; }
  out.innerHTML = `<div class="hk-jawab" id="hj"></div>`;
  const j = el("hj");
  const kepala = document.createElement("div"); kepala.className = "hk-meta";
  if (d.jawaban) {
    const p = document.createElement("p"); p.textContent = d.jawaban; j.append(p);
    kepala.innerHTML = `<span class="jm-pil">${ikon("centang", 14)}${esc(t("hk.tanya.n_kutipan", { n: d.kutipan.length }))}</span>`;
    if (d.dibuang) kepala.insertAdjacentHTML("beforeend", `<span class="jm-pil jm-pil-warn">${ikon("peringatan", 14)}${esc(t("hk.tanya.dibuang", { n: d.dibuang }))}</span>`);
    j.prepend(kepala);
    const c = document.createElement("p"); c.className = "hk-sub"; c.textContent = t("hk.tanya.catatan"); j.append(c);
    const info = new Map((d.segmen_dipakai || []).map((s) => [s.segmen, s]));
    for (const k of d.kutipan) j.append(kartuSegmen({ dok: k.dok, segmen: k.segmen, label: k.label, judul: info.get(k.segmen)?.judul }, k.teks));
  } else {
    const p = document.createElement("p"); p.textContent = d.segmen_dipakai?.length ? t(d.model ? "hk.tanya.tanpa_kutipan" : "hk.tanya.tanpa_model") : t("hk.tanya.tak_ada"); j.append(p);
    if (d.dibuang) { kepala.innerHTML = `<span class="jm-pil jm-pil-warn">${ikon("peringatan", 14)}${esc(t("hk.tanya.dibuang", { n: d.dibuang }))}</span>`; j.prepend(kepala); }
    for (const s of d.segmen_dipakai || []) j.append(kartuSegmen(s, s.teks));
  }
}

/* ---------- tab relasi ---------- */
async function muatRelasi() {
  const w = el("panelRelasi");
  w.innerHTML = `<div class="hk-panel">${hantuHtml(5)}</div>`;
  const r = RINGKAS || await ambil("/api/hukum/ringkas").catch(() => null);
  if (!r) { w.innerHTML = tidakAktif(); return; }
  const rujuk = r.dirujuk.map((x, i) => `<li><span class="hk-no">${i + 1}</span><div>${x.terdaftar ? `<button type="button" data-buka="${esc(x.id)}">${esc(x.judul || x.id)}</button>` : `<span class="hk-nama2">${esc(x.judul || x.id)}</span>`}<div class="hk-meta">${x.singkatan ? pilJenis(x.singkatan) : ""}${x.terdaftar ? pilStatus(x.status) : `<span class="jm-pil">${esc(t("hk.rl.luar"))}</span>`}</div></div><span class="jm-pil">${ikon("rantai", 14)}${esc(t("hk.rl.n", { n: angka(x.n) }))}</span></li>`).join("");
  const cabut = r.dicabut.map((x) => `<div class="hk-cabut-b"><button type="button" data-buka="${esc(x.dari)}">${esc(x.judul_dari || x.dari)}</button><span class="jm-pil jm-pil-bad">${ikon("silang", 14)}${esc(label("hk.rel.", x.jenis))}</span>${x.terdaftar ? `<button type="button" data-buka="${esc(x.ke)}">${esc(x.judul_ke || x.ke)}</button>` : `<span class="hk-nama2">${esc(x.judul_ke || x.ke)}</span>`}</div>`).join("");
  w.innerHTML = `<div class="hk-panel">${exHtml({ id: "ex-rujuk", ikon: "rantai", topik: t("hk.rl.ey1"), judulHtml: hlHtml("hk.rl.j1", t("hk.rl.hl1")), subHtml: esc(t("hk.rl.sub1")), isiHtml: r.dirujuk.length ? `<ol class="hk-peringkat">${rujuk}</ol>` : kosongHtml("hk.rl.kosong") })}
    ${exHtml({ id: "ex-cabut", ikon: "silang", topik: t("hk.rl.ey2"), judulHtml: hlHtml("hk.rl.j2", t("hk.rl.hl2")), subHtml: esc(t("hk.rl.sub2")), isiHtml: r.dicabut.length ? `<div class="hk-cabut">${cabut}</div>` : kosongHtml("hk.rl.kosong") })}</div>`;
  if (!w.dataset.pasang) { w.dataset.pasang = "1"; w.addEventListener("click", (e) => { const k = e.target.closest("[data-buka]"); if (k) location.hash = bukaHref(k.dataset.buka); }); }
}

/* ---------- main ---------- */
const akar = el("panelHukum");
akar.innerHTML = '<div id="tabHalH"></div><div id="panelCari"></div><div id="panelDokumen" hidden></div><div id="panelTanya" hidden></div><div id="panelRelasi" hidden></div>';
bentukCari(); pasangCari(); pasangDokumen(); bentukTanya();
tabHalaman("tabHalH", { label: "hk.tab", tab: [
  { k: "hcari", hash: "hukum", ikon: "cari2", teks: "hk.tab.cari", panel: "panelCari", muat: async () => { if (!el("hsaring").children.length) saringHtml(null); if (S.q) await jalankanCari(); else el("hhasil").innerHTML = kosongHtml("hk.cari.mulai"); } },
  { k: "hdokumen", ikon: "buku", teks: "hk.tab.dokumen", panel: "panelDokumen", cocok: (h) => h === "#hdokumen" || h.startsWith("#hd="), muat: muatDokumen },
  { k: "htanya", ikon: "tanya", teks: "hk.tab.tanya", panel: "panelTanya", muat: async () => {} },
  { k: "hrelasi", ikon: "rantai", teks: "hk.tab.relasi", panel: "panelRelasi", muat: muatRelasi },
] });
