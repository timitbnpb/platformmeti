/* Pembantu bersama halaman profil publik /o/<id> dan /p/<id>: lambang provinsi, tabel proyek, peta mini, seksi exhibit.
   Data statis /data/*.json (lapis publik). Semua teks lewat t(); semua nilai data lewat esc(). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { muat, urlAman, norm, label, namaRegulasi, kelasStatus } from "/publik.js";
import { exHtml, sumberHtml, unduhRegHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta } from "/inti/peta_indonesia.js";
import { PROV } from "/penerbit.js";
import { namaProyek } from "/inti/nama_proyek.js";

export { t, angka, tanggal, esc, ikon, muat, urlAman, norm, label, namaRegulasi, kelasStatus, exHtml, sumberHtml, aksiHtml, hlHtml, pilTek, pilStatus, namaProyek };
export const TAHUN = new Date().getFullYear();
export const idJalur = () => decodeURIComponent(location.pathname.split("/")[2] || "");

const kodeProv = (n) => PROV[String(n || "").trim().toLowerCase()] ?? null;
export const lambang = (prov, u = 20) => { const k = kodeProv(prov); return k ? `<img class="pf-lb" src="/img/provinsi/${k}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">` : ""; };
export const provHtml = (prov, u = 20) => (prov ? `<span class="pf-prov">${lambang(prov, u) || ikon("peta", 16)}<span>${esc(prov)}</span></span>` : "-");
export const inisial = (n) => String(n || "?").replace(/^(PT|CV|Yayasan|Pemerintah|Kementerian)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
export const ringkasTgl = (s) => (s ? tanggal(String(s).slice(0, 10)) : "-");
export const tglSel = (s) => (s ? `<span data-urut="${esc(String(s).slice(0, 10))}">${esc(ringkasTgl(s))}</span>` : "-");

/** Satu baris proyek untuk tabel/peta/statistik. */
export function barisProyek(p) {
  const k = (p.kapasitas || [])[0], L = p.lokasi || {}, cods = (p.cod_target || []).map((x) => x.nilai).filter(Number.isFinite);
  return {
    p, id: p.id, nama: namaProyek(p), tek: p.teknologi || "", st: (p.status || [])[0]?.nilai || "tidak-diketahui", prov: L.provinsi || "",
    kap: k && Number.isFinite(k.nilai) ? k.nilai : null, sat: (k && k.satuan) || "MW", cod: cods.length ? Math.min(...cods) : null,
    lat: L.lat, lng: L.lng, ada: Number.isFinite(L.lat) && Number.isFinite(L.lng), presisi: L.presisi || "",
    program: p.program_ids || [],
  };
}
export const kapTeks = (r) => (r.kap === null ? "-" : `${angka(r.kap)} ${r.sat}`);

/** Kepala profil (terang, seperti /regulasi): avatar, nama, pil, meta. */
export const kepalaHtml = ({ avatar, nama, pil = "", meta = "", balik }) => `<header class="pf-kepala">
  <a class="pf-balik" href="${esc(balik[0])}">${ikon("panah-kiri", 16)}<span>${esc(balik[1])}</span></a>
  <div class="pf-kepala-isi">${avatar}<div class="pf-kepala-teks"><h1>${esc(nama)}</h1>${pil ? `<div class="pf-pil">${pil}</div>` : ""}${meta ? `<ul class="pf-meta">${meta}</ul>` : ""}</div></div></header>`;
export const metaItem = (ik, isiHtml) => `<li>${ikon(ik, 16)}<span>${isiHtml}</span></li>`;

/** Kartu ringkasan: item {ik, nilai, label, est?}. */
export const statHtml = (item) => `<ul class="pf-stat">${item.map((s) => `<li>${ikon(s.ik, 20)}<b>${esc(s.nilai)}</b><span>${esc(s.label)}${s.est ? ` <em class="pf-est">${esc(t("pf.est"))}</em>` : ""}</span></li>`).join("")}</ul>`;

/** Seksi exhibit; kembalikan "" bila isi kosong (seksi kosong disembunyikan). */
export function seksi({ id, ik, topik, judulHtml, subHtml = "", isiHtml, csv = false, sumber = "" }) {
  if (!isiHtml) return "";
  return exHtml({ id, ikon: ik, topik, judulHtml, subHtml, aksiHtml: aksiHtml({ csv }) + (sumber ? sumberHtml(sumber) : ""), isiHtml });
}
/* Tabel; satu baris saja ditampilkan sebagai kartu (tabel 1 baris memboroskan ruang). */
export const tabel = (kolom, barisHtml, kelas = "") => {
  if ((barisHtml.match(/<tr>/g) || []).length === 1) {
    const sel = [...barisHtml.matchAll(/<td data-label="([^"]*)"[^>]*>([\s\S]*?)<\/td>/g)];
    return `<dl class="pf-satu ${kelas}">${sel.map(([, l, v]) => `<div><dt>${l}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
  }
  return `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap ${kelas}"><thead><tr>${kolom.map(([k, kls]) => `<th scope="col"${kls ? ` class="${kls}"` : ""}>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${barisHtml}</tbody></table></div>`;
};
export const td = (kunci, isi, kls = "") => `<td data-label="${esc(t(kunci))}"${kls ? ` class="${kls}"` : ""}>${isi}</td>`;
export const sumberKaki = (dibangun) => t("pf.sumber_data", { tanggal: ringkasTgl(dibangun) });

/** Tabel proyek (kolom dasar), nama tertaut ke /p/<id>. */
export function tabelProyek(rows) {
  const kol = [["pj.c.nama"], ["pj.c.tek"], ["pj.c.kap", "jm-num"], ["pj.c.prov"], ["pj.c.status"], ["pj.c.cod", "jm-tengah"]];
  const b = rows.map((r) => `<tr>${td("pj.c.nama", `<b><a class="pf-nm" href="/p/${esc(r.id)}">${esc(r.nama)}</a></b>`)}${td("pj.c.tek", pilTek(r.tek))}${td("pj.c.kap", `<span data-urut="${r.kap ?? ""}">${esc(kapTeks(r))}</span>`, "jm-num")}${td("pj.c.prov", provHtml(r.prov))}${td("pj.c.status", pilStatus(r.st))}${td("pj.c.cod", r.cod ?? "-", "jm-tengah")}</tr>`).join("");
  return tabel(kol, b, "pf-tabel-proyek");
}

/* ---------- peta mini ---------- */
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const TEK_WARNA = { surya: "--data4", bayu: "--data3", hidro: "--data5", "panas-bumi": "--warn", bioenergi: "--data2", "biomassa-sampah": "--data1", penyimpanan: "--ink2", nuklir: "--bad" };
/** Titik di atas peta dasar Indonesia (garis provinsi dari rapikanPeta). Klik titik membuka /p/<id>. */
export function petaTitik(el, rows, { zoomSatu = 9, klik = true } = {}) {
  const pts = rows.filter((r) => r.ada);
  if (!el || !pts.length) return;
  muatMapLibre().then(() => {
    if (!el.isConnected) return;
    const m = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [pts[0].lng, pts[0].lat], zoom: 5, minZoom: 3, maxZoom: 14, dragRotate: false, attributionControl: { compact: true } });
    const b = new maplibregl.LngLatBounds(); pts.forEach((r) => b.extend([r.lng, r.lat]));
    const pas = () => { m.resize(); if (pts.length > 1) m.fitBounds(b, { padding: 48, maxZoom: 9, duration: 0 }); else m.jumpTo({ center: b.getCenter(), zoom: zoomSatu }); };
    pas();
    m.on("style.load", () => {
      pas(); rapikanPeta(m);
      m.addSource("t", { type: "geojson", data: { type: "FeatureCollection", features: pts.map((r) => ({ type: "Feature", properties: { id: r.id, warna: warna(TEK_WARNA[r.tek] || "--ink2"), pasti: r.presisi === "titik_persis" ? 1 : 0 }, geometry: { type: "Point", coordinates: [r.lng, r.lat] } })) } });
      m.addLayer({ id: "t", type: "circle", source: "t", paint: { "circle-color": ["get", "warna"], "circle-opacity": ["case", ["==", ["get", "pasti"], 1], 1, 0.55], "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 9, 9], "circle-stroke-color": warna("--paper"), "circle-stroke-width": 1.5 } });
    });
    if (klik) {
      m.on("click", "t", (e) => { location.href = "/p/" + e.features[0].properties.id; });
      m.on("mouseenter", "t", () => { m.getCanvas().style.cursor = "pointer"; });
      m.on("mouseleave", "t", () => { m.getCanvas().style.cursor = ""; });
    }
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
  }).catch(() => { el.textContent = t("pj.peta.galat"); el.classList.add("jm-bantu"); });
}

/** Berita sebagai kartu bergambar (berita_foto.json: id -> url foto), terbaru dulu, maks 12. Tanpa foto = latar bermerek berikon. */
export function tabelBerita(daftar, foto = {}) {
  const urut = [...daftar].sort((a, b) => String(b.terbit).localeCompare(String(a.terbit))).slice(0, 12);
  if (!urut.length) return "";
  return `<ul class="pf-ber">${urut.map((x) => {
    const f = urlAman(foto[x.id]);
    const isi = `<span class="pf-ber-foto">${ikon("berita", 28)}${f ? `<img class="pf-foto" src="${esc(f)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}</span><span class="pf-ber-t"><b>${esc(x.judul)}</b><small>${esc([x.media, x.terbit ? ringkasTgl(x.terbit) : ""].filter(Boolean).join(", "))}</small></span>`;
    return `<li>${urlAman(x.url) ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${isi}</a>` : `<div>${isi}</div>`}</li>`;
  }).join("")}</ul>`;
}
/** Tabel regulasi terkait, tertaut ke /regulasi?id=, maks 50. */
export function tabelRegulasi(daftar) {
  const urut = [...daftar].sort((a, b) => (b.tahun || 0) - (a.tahun || 0)).slice(0, 50);
  if (!urut.length) return "";
  return tabel([["pf.c.aturan"], ["pf.c.status"], ["pf.c.tanggal", "jm-tengah"], ["pf.c.unduh", "jm-tengah"]], urut.map((x) => `<tr>${td("pf.c.aturan", `<span class="jm-id"><b><a class="pf-nm" href="/regulasi?id=${encodeURIComponent(x.id)}">${esc(namaRegulasi(x))}</a></b><small>${esc(x.judul || "")}</small></span>`)}${td("pf.c.status", `<span class="jm-pil ${kelasStatus(x.status)}">${esc(label("reg.status.", x.status))}</span>`)}${td("pf.c.tanggal", tglSel(x.tanggal_ditetapkan), "jm-tengah")}${td("pf.c.unduh", unduhRegHtml(x) || "-", "jm-tengah")}</tr>`).join(""), "pf-tabel-reg");
}

/* Nama penerbit dari domain; tak dikenal = domain polos. Jenis tertentu punya nama sendiri. */
const PENERBIT = { "kontan.co.id": "Kontan", "katadata.co.id": "Katadata", "esdm.go.id": "Kementerian ESDM", "wikipedia.org": "Wikipedia", "wikidata.org": "Wikidata", "detik.com": "detikcom", "antaranews.com": "ANTARA", "kompas.com": "Kompas", "bisnis.com": "Bisnis.com", "cnbcindonesia.com": "CNBC Indonesia", "pln.co.id": "PLN", "bpk.go.id": "JDIH BPK", "worldbank.org": "World Bank", "geoboundaries.org": "geoBoundaries", "cnnindonesia.com": "CNN Indonesia", "tempo.co": "Tempo", "kumparan.com": "kumparan", "okezone.com": "Okezone", "liputan6.com": "Liputan6", "mongabay.co.id": "Mongabay", "iea.org": "IEA", "irena.org": "IRENA", "adb.org": "ADB", "jica.go.jp": "JICA" };
const JENIS = { ruptl: "RUPTL PLN 2025-2034" };
export function namaPenerbit(s) {
  if (JENIS[s.jenis]) return JENIS[s.jenis];
  let h = ""; try { h = new URL(s.url).hostname.replace(/^www\./, ""); } catch { return String(s.url || "-"); }
  const k = Object.keys(PENERBIT).find((d) => h === d || h.endsWith("." + d));
  return k ? PENERBIT[k] : h;
}
/** Tabel sumber: unik per URL, maks 40; nama penerbit (+ judul berita bila dikenal) tertaut, tanpa URL mentah. judulPerUrl: Map url -> judul. */
export function tabelSumber(daftar, judulPerUrl = new Map()) {
  const lihat = new Set(), u = [];
  for (const s of daftar || []) { if (!s.url || lihat.has(s.url)) continue; lihat.add(s.url); u.push(s); }
  if (!u.length) return "";
  return tabel([["pf.c.sumber"], ["pf.c.jenis"], ["pf.c.bukti"], ["pf.c.tanggal", "jm-tengah"]], u.slice(0, 40).map((s) => {
    const judul = s.judul || judulPerUrl.get(s.url), nm = esc(namaPenerbit(s));
    const a = `<span class="jm-id"><b>${urlAman(s.url) ? `<a class="pf-nm" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${nm}</a>` : nm}</b>${judul ? `<small>${esc(judul)}</small>` : ""}</span>`;
    const pil = (v) => (v ? `<span class="jm-pil">${esc(v)}</span>` : "-");
    return `<tr>${td("pf.c.sumber", a)}${td("pf.c.jenis", pil(s.jenis))}${td("pf.c.bukti", pil(s.tingkat_bukti))}${td("pf.c.tanggal", tglSel(s.tanggal), "jm-tengah")}</tr>`;
  }).join(""), "pf-tabel-sumber");
}

const IMG = (f) => `/img/beranda/${f}.webp`;
const IMG_PROG = { "plts-100gw": IMG("surya-cirata"), wte: IMG("sampah-psel"), b50: IMG("bioenergi-sawit"), e20: IMG("bioetanol-tebu"), ruptl: IMG("hidro-saguling"), psn: IMG("panas-bumi-sibayak"), jetp: IMG("bayu-sidrap") };
/** Kartu program: foto, ikon, nama, ringkas, tautan ke /proyek#program-<id>; stat opsional (teks). */
export const kartuProgram = (daftar) => (daftar.length ? `<ul class="pf-prog">${daftar.map(({ g, stat }) => `<li><a href="/proyek#program-${esc(g.id)}"><span class="pf-prog-foto">${IMG_PROG[g.id] ? `<img src="${IMG_PROG[g.id]}" alt="" loading="lazy" decoding="async">` : ""}</span><span class="pf-prog-t"><b>${ikon("regulasi", 18)}<span>${esc(g.nama)}</span></b><span>${esc(g.ringkas || "")}</span>${stat ? `<em>${esc(stat)}</em>` : ""}<span class="pf-prog-lihat">${esc(t("pf.lihat_program"))}${ikon("panah-kanan", 16)}</span></span></a></li>`).join("")}</ul>` : "");

export function galatHtml(kunci) { return `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t(kunci))}</p><a class="jm-tbl" href="/">${esc(t("pf.ke_beranda"))}</a></div>`; }
export function pasangLogoCadangan(akar) {
  akar.querySelectorAll("img.pf-logo").forEach((im) => im.addEventListener("error", () => { const s = document.createElement("span"); s.className = "pf-av"; s.textContent = im.dataset.ini || "?"; im.replaceWith(s); }, { once: true }));
  akar.querySelectorAll("img.pf-foto").forEach((im) => im.addEventListener("error", () => im.remove(), { once: true }));
}
