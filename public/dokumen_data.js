/* /dokumen-data: indeks /data/dokumen_data.json lalu satu dokumen /data/dokumen/<id>.json (scripts/pipa/ekstrak_pdf.mjs).
   Tabel diurutkan dan dipaginasi pada data penuh; angka menaut ke #page=N di PDF sumber bila URL-nya berkas PDF. Teks layar dari kamus.
   Tabel BPP (kolom "sistem"): baris wilayah/pulau jadi baris kelompok, sub sistem menjorok; selisih (EST) terhadap baris BPP nasional dokumen. */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml } from "/inti/umum.js";
import { cariHtml, pilihHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { namaBaku } from "/inti/nama_baku.js";
import { muatData, tampilGalat, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const PER = 25;
const S = { idx: null, dok: null, tab: 0, hal: 1, uk: null, ua: 1, q: "", g: "" };

const adaPdf = (u) => /^https:\/\/\S+\.pdf(\?\S*)?$/i.test(u || "");
const tautHal = (u, h) => (adaPdf(u) ? `${u.split("#")[0]}#page=${h}` : "");
const tglDok = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? tanggal(s) : s);
const tahunDok = (s) => String(s).slice(0, 4);
const http = (u) => (/^https:\/\//.test(u || "") ? u : "");

/* logo penerbit dari berkas lokal; tanpa padanan -> ikon gedung */
const LOGO = [[/^PT PLN/i, "/img/logo/pln.png"], [/ESDM|Ketenagalistrikan/i, "/img/logo/esdm.png"], [/Pemerintah/i, "/img/penerbit/garuda.png"]];
const logoHtml = (penerbit, u = 36) => { const f = LOGO.find(([r]) => r.test(penerbit)); return f ? `<img src="${f[1]}" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">` : ikon("gedung", u - 12); };
const PENDEK = new Set(["kepmen-bpp-pembangkitan", "heesi-2025", "rued-target-kapasitas", "ruptl-2025-2034", "statistik-ketenagalistrikan-2024"]);
const judulPendek = (d) => (PENDEK.has(d.id) ? t("dd.pendek." + d.id) : d.judul);
function labelTabel(x) {
  const bpp = /^BPP .*tahun (\d{4})/.exec(x.judul); if (bpp) return `BPP ${bpp[1]}`;
  const sk = /skenario ([^,]+)/.exec(x.judul); if (sk) return t("dd.skenario", { s: sk[1] });
  return x.judul.replace(/\s*\([^)]*\)/g, "");
}

/* nama sistem/provinsi dinormalkan; satu kata kapital pendek (BALI, RIAU) tetap nama, bukan singkatan */
const nm = (s) => (/NASIONAL$/.test(s) ? t("dd.nasional") : /^[A-Z]{3,5}$/.test(s) && s !== "DKI" ? s[0] + s.slice(1).toLowerCase() : namaBaku(s).nama);
const PULAU = /^(sumatera|jawa bali|kalimantan|sulawesi dan nusa tenggara|maluku dan papua)$/i;
const tingkatNama = (s) => (/NASIONAL$/.test(s) ? 0 : PULAU.test(s) ? 0 : /^SUBSISTEM/i.test(s) ? 2 : s === s.toUpperCase() || s === "Riau" ? 1 : 2);
const adaSistem = (tab) => tab.kolom[0]?.k === "sistem";
const KOL_SEL = () => ({ k: "_sel", label: t("dd.selisih"), tipe: "angka", maya: true });
const kolomTab = (tab) => (adaSistem(tab) ? [...tab.kolom, KOL_SEL()] : tab.kolom);

/* sekali per tabel: tingkat baris, wilayah induk, selisih terhadap BPP nasional */
function siapkan(tab) {
  if (tab._siap || !adaSistem(tab)) return;
  tab._siap = true;
  const nas = tab.baris.find((r) => /NASIONAL$/.test(r.sistem));
  let g = "";
  for (const r of tab.baris) {
    r._t = tingkatNama(r.sistem);
    if (r._t === 1) g = r.sistem;
    r._g = r._t === 0 ? "" : g;
    r._sel = nas && r !== nas && r._t !== 0 && r.bpp_rp_kwh != null ? Math.round((r.bpp_rp_kwh / nas.bpp_rp_kwh - 1) * 100) : null;
  }
  tab._nas = nas || null;
}
const cocokGrup = (tab, r) => !S.g || (adaSistem(tab) ? r._g === S.g || r.sistem === S.g : r.provinsi === S.g);
const kolomGrup = (tab) => (adaSistem(tab) ? "sistem" : tab.kolom.some((c) => c.k === "provinsi") ? "provinsi" : "");
function opsiGrup(tab) {
  const k = kolomGrup(tab); if (!k) return [];
  const v = k === "sistem" ? tab.baris.filter((r) => r._t === 1).map((r) => r.sistem) : tab.baris.map((r) => r.provinsi);
  return [...new Set(v)].filter(Boolean);
}

function barisSaring(tab) {
  const q = S.q.trim().toLocaleLowerCase(), kol = kolomTab(tab);
  let b = tab.baris.filter((r) => cocokGrup(tab, r) && (!q || tab.kolom.some((c) => String(c.k === "sistem" || c.k === "provinsi" ? nm(r[c.k] ?? "") : r[c.k] ?? "").toLocaleLowerCase().includes(q))));
  const c = S.uk && kol.find((x) => x.k === S.uk);
  if (c) b = [...b].sort((a, z) => { const x = a[c.k], y = z[c.k]; return ((x == null) - (y == null)) || (c.tipe === "angka" ? (x - y) * S.ua : String(x).localeCompare(String(y), "id") * S.ua); });
  return b;
}

const nilaiTeks = (c, v) => (v == null ? "-" : c.tipe === "angka" ? angka(v, { desimal: Number.isInteger(v) ? 0 : v < 100 ? 2 : 1 }) : String(v));

function pilSelisih(tab, r) {
  if (r._sel == null) return "-";
  const p = r._sel, kelas = p > 0 ? "jm-pil-bad" : p < 0 ? "jm-pil-ok" : "";
  return `<span class="jm-pil ${kelas}" title="${esc(t("dd.selisih_tip", { rp: angka(r.bpp_rp_kwh), nas: angka(tab._nas.bpp_rp_kwh, { desimal: Number.isInteger(tab._nas.bpp_rp_kwh) ? 0 : 2 }) }))}">${p > 0 ? "+" : ""}${esc(angka(p))}%</span>`;
}

function sel(d, tab, c, r) {
  const lab = `data-label="${esc(c.label)}"`;
  if (c.k === "_sel") return `<td ${lab} class="dd-n dd-sel">${pilSelisih(tab, r)}</td>`;
  if (c.k === "sistem" || c.k === "provinsi") {
    const ik = c.k === "sistem" && r._t < 2 ? `<span class="dd-ik">${ikon(r._t === 0 ? "peta" : "wilayah", 16)}</span>` : "";
    return `<th ${lab} scope="row" class="dd-nama">${ik}<span>${esc(nm(r[c.k]))}</span></th>`;
  }
  const url = tautHal(r.sumber_url || d.sumber_url, r.halaman), v = nilaiTeks(c, r[c.k]);
  const isi = c.tipe === "angka" && url && r[c.k] != null ? `<a class="dd-angka" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("dd.ke_hlm", { n: r.halaman }))}">${esc(v)}</a>` : esc(v);
  const kosong = r[c.k] == null ? ` title="${esc(t("dd.kosong"))}"` : "";
  return `<td ${lab}${c.tipe === "angka" ? ' class="dd-n"' : ""}${kosong}>${isi}</td>`;
}

const infoHtml = (baris) => {
  const isi = baris.filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join("");
  return isi ? `<details class="dd-info"><summary aria-label="${esc(t("dd.info"))}" title="${esc(t("dd.info"))}">${ikon("info", 18)}</summary><div class="dd-pop">${isi}</div></details>` : "";
};

function kepalaKolom(tab, c) {
  const sat = !c.maya && c.tipe === "angka" && !c.label.includes("(") && tab.satuan && !/ dan /.test(tab.satuan) ? `<small class="dd-sat">${esc(tab.satuan)}</small>` : "";
  const est = c.maya ? ` <small class="dd-sat">${esc(t("dd.est"))}</small>` : "";
  return `<th scope="col" aria-sort="${S.uk === c.k ? (S.ua > 0 ? "ascending" : "descending") : "none"}" class="${c.tipe === "angka" ? "dd-n" : "dd-nama"}"><button type="button" class="jm-urut" data-uk="${esc(c.k)}"><span>${esc(c.label)}${est}${sat}</span></button></th>`;
}

function gambarTabel() {
  const d = S.dok, tab = d.tabel[S.tab], semua = barisSaring(tab), total = semua.length, kol = kolomTab(tab);
  const per = Math.min(Math.max(1, Math.ceil(total / PER)), S.hal);
  const potong = semua.slice((per - 1) * PER, per * PER);
  const kepala = kol.map((c) => kepalaKolom(tab, c)).join("") + `<th scope="col" class="dd-h">${esc(t("dd.hlm"))}</th>`;
  const badan = potong.map((r) => {
    const url = tautHal(r.sumber_url || d.sumber_url, r.halaman), n = t("dd.hlm_n", { n: r.halaman });
    const hlm = url ? `<a class="dd-hlm" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("dd.ke_hlm", { n: r.halaman }))}">${ikon("pdf", 14)}<span>${esc(n)}</span></a>` : `<span class="dd-hlm dd-hlm-mati" title="${esc(t("dd.hlm_tanpa_tautan"))}">${ikon("pdf", 14)}<span>${esc(n)}</span></span>`;
    const tinjau = r.perlu_tinjau ? `<span class="jm-pil jm-pil-warn" title="${esc(t("dd.tinjau_tip"))}">${esc(t("dd.tinjau"))}</span>` : "";
    const kls = r._t == null ? "" : ` class="dd-g${r._t}"`;
    return `<tr${kls}>${kol.map((c) => sel(d, tab, c, r)).join("")}<td data-label="${esc(t("dd.hlm"))}" class="dd-h"><span class="dd-hlm-sel">${hlm}${tinjau}</span></td></tr>`;
  }).join("");
  $("ddTabel").innerHTML = `<div class="jm-gulir"><table class="jm-tabel dd-t${adaSistem(tab) ? " dd-sistem" : ""}" data-urut="tidak"><thead><tr>${kepala}</tr></thead><tbody>${badan || `<tr><td colspan="${kol.length + 1}">${esc(t("dd.tak_ada"))}</td></tr>`}</tbody></table></div>${paginasiHtml({ hal: per, total, per: PER, satuan: "dd.satuan_baris" })}`;
}

/* grafik kolom: BPP per wilayah, garis putus = BPP nasional; nama dan nilai di tooltip (title) */
function grafikHtml(tab) {
  if (!adaSistem(tab)) return "";
  const w = tab.baris.filter((r) => r._t === 1 && r.bpp_rp_kwh != null);
  if (w.length < 3) return "";
  const W = 900, H = 170, mx = Math.max(...w.map((r) => r.bpp_rp_kwh), tab._nas?.bpp_rp_kwh || 0) * 1.08, lb = W / w.length, y = (v) => H - (v / mx) * H;
  const bar = w.map((r, i) => {
    const hb = H - y(r.bpp_rp_kwh), tinggi = tab._nas && r.bpp_rp_kwh > tab._nas.bpp_rp_kwh;
    return `<rect class="${tinggi ? "dd-b-atas" : "dd-b"}" x="${(i * lb + lb * 0.15).toFixed(1)}" y="${y(r.bpp_rp_kwh).toFixed(1)}" width="${(lb * 0.7).toFixed(1)}" height="${hb.toFixed(1)}" rx="3"><title>${esc(nm(r.sistem))}: ${esc(angka(r.bpp_rp_kwh))} Rp/kWh</title></rect>`;
  }).join("");
  const gar = tab._nas ? `<line class="dd-b-nas" x1="0" x2="${W}" y1="${y(tab._nas.bpp_rp_kwh).toFixed(1)}" y2="${y(tab._nas.bpp_rp_kwh).toFixed(1)}"/>` : "";
  return `<figure class="dd-graf"><figcaption>${ikon("grafik", 16)}<b>${esc(t("dd.graf"))}</b><span>${esc(t("dd.graf_tip", { n: tab._nas ? angka(tab._nas.bpp_rp_kwh, { desimal: Number.isInteger(tab._nas.bpp_rp_kwh) ? 0 : 2 }) : "-" }))}</span></figcaption><svg class="dd-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(t("dd.graf"))}">${gar}${bar}</svg></figure>`;
}

function gambarDok() {
  const d = S.dok, tab = d.tabel[S.tab];
  d.tabel.forEach(siapkan);
  const g = opsiGrup(tab), kg = kolomGrup(tab);
  const pilTabel = d.tabel.length > 1 ? `<div class="dd-seg" role="group" aria-label="${esc(t("dd.tabel"))}">${d.tabel.map((x, i) => `<button type="button" data-tab="${i}" aria-pressed="${i === S.tab}" title="${esc(x.judul)}"><b>${esc(labelTabel(x))}</b><small>${esc(t("dd.n_baris", { n: angka(x.jumlah_baris) }))}</small></button>`).join("")}</div>` : "";
  const sub = `<span class="jm-pil">${ikon("kalender", 14)}${esc(tglDok(d.tanggal_dokumen))}</span><span class="jm-pil">${ikon(d.metode === "ocr-vision" ? "gambar" : "pdf", 14)}${esc(t("dd.metode." + d.metode))}</span>${infoHtml([d.catatan, d.versi && t("dd.versi", { v: d.versi })])}`;
  const sumber = http(d.sumber_url) ? `<a class="dd-sumber" href="${esc(d.sumber_url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("dd.sumber"))}</span></a>` : "";
  const pilih = g.length > 1 ? pilihHtml({ id: "ddGrup", ikon: "wilayah", label: t(kg === "sistem" ? "dd.wilayah" : "dd.provinsi"), nilai: S.g, opsi: [["", t(kg === "sistem" ? "dd.semua_wilayah" : "dd.semua_provinsi")], ...g.map((x) => [x, nm(x)])] }) : "";
  $("ddDok").innerHTML = `<section class="jm-ex dd-ex" id="ddEx"><header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey dd-ey">${logoHtml(d.penerbit, 22)}${esc(d.penerbit)}</span><h2 class="jm-ex-j">${esc(d.judul)}</h2><div class="dd-pils">${sub}</div></div><div class="jm-ex-aksi dd-aksi">${sumber}${aksiHtml({ csv: true, png: false, pdf: false, bagi: false })}</div></header>
  <div class="jm-ex-bd">${pilTabel}${grafikHtml(tab)}<div class="dd-alat">${cariHtml({ id: "ddCari", label: t("dd.cari"), placeholder: t("dd.cari") })}${pilih}${infoHtml([tab.satuan && t("dd.satuan", { s: tab.satuan }), tab.catatan])}</div><div id="ddTabel"></div></div></section>`;
  $("ddCari").value = S.q;
  $("ddEx").addEventListener("jm:csv", (e) => {
    const tb = S.dok.tabel[S.tab], kol = kolomTab(tb);
    e.detail.baris = [[...kol.map((c) => c.label), t("dd.hlm")], ...barisSaring(tb).map((r) => [...kol.map((c) => (c.k === "sistem" || c.k === "provinsi" ? nm(r[c.k]) : r[c.k])), r.halaman])];
  });
  gambarTabel();
}

function gambarKartu() {
  $("ddKartu").innerHTML = S.idx.dokumen.map((d) => `<button type="button" class="dd-kartu" data-id="${esc(d.id)}" aria-pressed="${S.dok?.id === d.id}" title="${esc(d.judul)}"><span class="dd-k-atas"><span class="dd-logo">${logoHtml(d.penerbit)}</span><span class="jm-pil">${esc(tahunDok(d.tanggal_dokumen))}</span></span><b class="dd-k-j">${esc(judulPendek(d))}</b><span class="dd-k-r"><span>${ikon("tabel", 14)}${esc(t("dd.n_tabel", { n: angka(d.tabel.length) }))}</span><span>${ikon("daftar", 14)}${esc(t("dd.n_baris", { n: angka(d.tabel.reduce((n, tb) => n + tb.jumlah_baris, 0)) }))}</span></span></button>`).join("");
}

async function pilihDok(id) {
  S.tab = 0; S.hal = 1; S.uk = null; S.q = ""; S.g = "";
  document.querySelectorAll(".dd-kartu").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
  $("ddDok").innerHTML = hantuHtml(4);
  try { S.dok = await muatData(`dokumen/${id}.json`); } catch (e) { return tampilGalat($("ddDok"), () => pilihDok(id)); }
  gambarDok();
}

let wkt = 0;
async function mulai() {
  await mulaiHalaman();
  const isi = $("isi");
  isi.innerHTML = hantuHtml(4);
  try { S.idx = await muatData("dokumen_data.json"); } catch (e) { return tampilGalat(isi, mulai); }
  const x = S.idx, tinjau = x.dokumen.reduce((n, d) => n + d.tabel.reduce((m, tb) => m + tb.perlu_tinjau, 0), 0);
  khUbin("ubin", [{ ikon: "pdf", nilai: angka(x.jumlah_dokumen), label: t("dd.u.dokumen") }, { ikon: "tabel", nilai: angka(x.jumlah_tabel), label: t("dd.u.tabel") }, { ikon: "daftar", nilai: angka(x.jumlah_baris), label: t("dd.u.baris") }, { ikon: "peringatan", nilai: angka(tinjau), label: t("dd.u.tinjau") }]);
  isi.innerHTML = `<div class="dd-dok" id="ddKartu"></div><div id="ddDok"></div>`;
  gambarKartu();
  isi.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.id) pilihDok(b.dataset.id);
    else if (b.dataset.tab != null) { S.tab = +b.dataset.tab; S.hal = 1; S.uk = null; S.q = ""; S.g = ""; gambarDok(); }
    else if (b.dataset.uk) { S.ua = S.uk === b.dataset.uk ? -S.ua : 1; S.uk = b.dataset.uk; S.hal = 1; gambarTabel(); }
    else if (b.dataset.hal) { S.hal = +b.dataset.hal; gambarTabel(); }
  });
  isi.addEventListener("input", (e) => { if (e.target.id === "ddCari") { S.q = e.target.value; S.hal = 1; clearTimeout(wkt); wkt = setTimeout(gambarTabel, 120); } });
  isi.addEventListener("change", (e) => { if (e.target.id === "ddGrup") { S.g = e.target.value; S.hal = 1; gambarTabel(); } });
  document.addEventListener("click", (e) => document.querySelectorAll("details.dd-info[open]").forEach((p) => { if (!p.contains(e.target)) p.open = false; }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll("details.dd-info[open]").forEach((p) => { p.open = false; }); });
  const awal = decodeURIComponent(location.hash.slice(1));
  pilihDok(x.dokumen.some((d) => d.id === awal) ? awal : x.dokumen[0].id);
}
saatBahasa(() => { if (S.idx) gambarKartu(); if (S.dok) { S.dok.tabel.forEach((tb) => { delete tb._siap; }); gambarDok(); } });
mulai();
