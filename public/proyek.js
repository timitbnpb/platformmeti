/* /proyek: pelacak proyek nasional (K17, JM-P02/P03). Data = potret statis /data/*.json, tanpa rute Worker.
   INP: chrome filter/sort berubah seketika; peta, corong, tabel menyusul lewat nanti(); tabel dipaging 50 baris. */
import { t, ada, angka, tanggal, bahasa } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, galatHtml, ikon } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { muatMapLibre } from "/inti/maplibre.js";

const $ = (id) => document.getElementById(id);
const TAHUN = new Date().getFullYear();
const TAHAP = ["rencana", "izin", "pendanaan", "konstruksi", "beroperasi"];
const TIDAK = "tidak-diketahui";
const TEK_WARNA = { surya: "--data4", bayu: "--data3", hidro: "--data5", "panas-bumi": "--warn", bioenergi: "--data2", "biomassa-sampah": "--data1", penyimpanan: "--ink2", nuklir: "--bad" };
const BATAS = 50;
const PIN = '<svg class="jm-ik" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

const lab = (awal, k) => (ada(awal + k) ? t(awal + k) : k || "-");
const labTek = (k) => lab("pj.tek.", k);
const labSt = (k) => lab("pj.st.", k);
const num = (n, d) => angka(n, { desimal: d ?? (Number.isInteger(n) ? 0 : 1) });
const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
const mapsUrl = (la, ln) => `https://www.google.com/maps/search/?api=1&query=${la},${ln}`;
const tglIso = (s) => tanggal(String(s || "").slice(0, 10));

const ambil = (u) => fetch(u, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const lambat = {};
const lazy = (u) => (lambat[u] ??= ambil(u).catch((e) => { delete lambat[u]; throw e; }));

await mulaiHalaman();
const isi = $("isi");

let DATA, PROG;
try {
  const [p, g] = await Promise.all([ambil("/data/proyek.json"), ambil("/data/program.json")]);
  DATA = p; PROG = g;
} catch (e) {
  isi.innerHTML = `<div class="jm-kartu">${galatHtml("jaringan")}</div>`;
  isi.querySelector("[data-aksi=ulang]").addEventListener("click", () => location.reload());
  throw e;
}

/* ---------- bentuk baris ---------- */
const SEMUA = DATA.baris.map((p) => {
  const k = (p.kapasitas || [])[0];
  const cods = (p.cod_target || []).map((x) => x.nilai).filter(Number.isFinite);
  const L = p.lokasi || {};
  const kab = Array.isArray(L.kabupaten_kota) ? L.kabupaten_kota.map((x) => x.nilai).join(", ") : "";
  const pemilik = ((p.pihak || {}).pemilik || []).map((x) => x.nilai).join(", ");
  const r = {
    p, id: p.id, nama: p.nama || "", tek: p.teknologi || "", st: ((p.status || [])[0] || {}).nilai || TIDAK,
    prog: p.program_ids || [], prov: L.provinsi || "", kab, pemilik,
    kap: k && Number.isFinite(k.nilai) ? k.nilai : null, sat: (k && k.satuan) || "MW",
    cod: cods.length ? Math.min(...cods) : null, ada: Number.isFinite(L.lat) && Number.isFinite(L.lng),
  };
  r.telat = r.cod !== null && r.cod < TAHUN && r.st !== "beroperasi" ? TAHUN - r.cod : 0;
  r.cari = [r.nama, pemilik, r.prov, kab, ...(p.nama_lain || [])].join(" ").toLowerCase();
  return r;
});
const PER_ID = new Map(SEMUA.map((r) => [r.id, r]));
const TEKS = [...new Set(SEMUA.map((r) => r.tek).filter(Boolean))].sort();
const PROVS = [...new Set(SEMUA.map((r) => r.prov).filter(Boolean))].sort();
const warnaTek = (k) => `jm-pj-t-${TEK_WARNA[k] ? k : "lain"}`;
const jumlahMW = (rows) => rows.reduce((a, r) => a + (r.kap ?? 0), 0);
const denganKap = (rows) => rows.filter((r) => r.kap !== null).length;
const hitung = (rows, f) => { const m = {}; for (const r of rows) for (const k of [].concat(f(r))) m[k] = (m[k] || 0) + 1; return m; };

const pil = (teks, jenis) => `<span class="jm-pil${jenis ? " jm-pil-" + jenis : ""}">${esc(teks)}</span>`;
const pilSt = (st) => pil(labSt(st), st === "beroperasi" ? "ok" : st === TIDAK ? "" : st === "konstruksi" ? "warn" : "");
const titik = (tek) => `<span class="jm-pj-titik ${warnaTek(tek)}" aria-hidden="true"></span>`;
const presisiTeks = (r) => (r.p.lokasi && r.ada ? t("pj.presisi." + (["titik_persis", "kabupaten", "provinsi"].includes(r.p.lokasi.presisi) ? r.p.lokasi.presisi : "provinsi")) : t("pj.presisi.tak"));
const mapsTbl = (r) => r.ada
  ? `<a class="jm-pj-maps" href="${mapsUrl(r.p.lokasi.lat, r.p.lokasi.lng)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t("pj.maps"))}: ${esc(r.nama)}" title="${esc(t("pj.maps") + " (" + presisiTeks(r) + ")")}">${PIN}</a>`
  : `<span class="jm-bantu">-</span>`;
const sumberRingkas = (r) => { const s = (r.p.sumber || [])[0]; return s ? `${esc(s.jenis)}, ${esc(tanggal(s.tanggal))}` : "-"; };

/* ---------- hero ---------- */
function gambarHero() {
  const n = SEMUA.length, mw = jumlahMW(SEMUA), nk = denganKap(SEMUA);
  const st = hitung(SEMUA, (r) => r.st), pg = hitung(SEMUA, (r) => (r.prog.length ? r.prog : "_"));
  const baris = (m, f) => Object.keys(m).filter((k) => k !== "_").map((k) => `<li><span>${esc(f(k))}</span><b>${num(m[k])}</b></li>`).join("");
  const progLab = (id) => (PROG.baris.find((x) => x.id === id) || {}).nama || id;
  $("pjAngka").innerHTML = `
    <div class="jm-pj-kt"><span>${esc(t("pj.k.total"))}</span><b>${num(n)}</b></div>
    <div class="jm-pj-kt"><span>${esc(t("pj.k.kap"))} ${pil(t("pj.est"), "warn")}</span><b>${num(mw, 0)} MW</b><small>${esc(t("pj.k.penyebut", { n: num(nk), total: num(n) }))}</small></div>
    <div class="jm-pj-kt"><span>${esc(t("pj.k.status"))}</span><ul>${baris(st, labSt)}</ul></div>
    <div class="jm-pj-kt"><span>${esc(t("pj.k.program"))}</span><ul>${baris(pg, progLab)}</ul></div>`;
  const dok = [...new Set(SEMUA.flatMap((r) => (r.p.sumber || []).map((s) => s.dokumen || s.jenis)))].slice(0, 3).join(", ");
  $("pjSumber").textContent = t("pj.sumber", { tgl: tanggal(DATA.dibangun_pada, { gaya: "panjang" }), dok });
}

/* ---------- filter ---------- */
const F = { q: "", tek: "", st: "", prog: "", prov: "" };
const cocok = (r) => (!F.q || r.cari.includes(F.q)) && (!F.tek || r.tek === F.tek) && (!F.st || r.st === F.st) && (!F.prog || r.prog.includes(F.prog)) && (!F.prov || r.prov === F.prov);
let tampil = SEMUA, versi = 0;

function isiPilihan() {
  const opsi = (sel, daftar, kunci, fl) => {
    const cur = F[kunci];
    $(sel).innerHTML = `<option value="">${esc(t("pj.f.semua"))}</option>` + daftar.map(([v, l, n]) => `<option value="${esc(v)}">${esc(l)} (${num(n)})</option>`).join("");
    $(sel).value = cur;
  };
  const ct = hitung(SEMUA, (r) => r.tek), cs = hitung(SEMUA, (r) => r.st), cp = hitung(SEMUA, (r) => r.prog), cv = hitung(SEMUA, (r) => r.prov || "_");
  opsi("ftek", TEKS.map((k) => [k, labTek(k), ct[k]]), "tek");
  opsi("fst", [...TAHAP, TIDAK].filter((k) => cs[k]).map((k) => [k, labSt(k), cs[k]]), "st");
  opsi("fprog", PROG.baris.map((g) => [g.id, g.nama, cp[g.id] || 0]), "prog");
  opsi("fprov", PROVS.map((k) => [k, k, cv[k]]), "prov");
}

function terapkan() {
  const v = ++versi;
  tampil = SEMUA.filter(cocok);
  const ada = Object.values(F).some(Boolean);
  $("freset").disabled = !ada;
  $("pjHasil").textContent = t("pj.hasil", { n: num(tampil.length), total: num(SEMUA.length), mw: num(jumlahMW(tampil), 0) });
  nanti(() => { if (v !== versi) return; gambarCorong(); gambarLegenda(); kePeta(); TT.n = BATAS; TD.n = BATAS; gambarTelat(); gambarDaftar(); });
}

/* ---------- corong ---------- */
function gambarCorong() {
  const st = hitung(tampil, (r) => r.st), mw = {};
  for (const r of tampil) mw[r.st] = (mw[r.st] || 0) + (r.kap ?? 0);
  const maks = Math.max(1, ...TAHAP.map((k) => st[k] || 0));
  $("pjCorong").innerHTML = `<ol class="jm-pj-corong">${TAHAP.map((k) => `<li><span class="jm-pj-c-l">${esc(labSt(k))}</span><span class="jm-pj-bar"><i data-w="${((st[k] || 0) / maks) * 100}"></i></span><b>${num(st[k] || 0)}</b><small>${st[k] ? num(mw[k] || 0, 0) + " MW" : "-"}</small></li>`).join("")}</ol>` +
    (st[TIDAK] ? `<p class="jm-bantu">${esc(t("pj.corong.tak", { n: num(st[TIDAK]) }))}</p>` : "") + `<p class="jm-bantu">${esc(t("pj.corong.cara"))}</p>`;
  for (const i of $("pjCorong").querySelectorAll("i")) i.style.width = i.dataset.w + "%";
}

/* ---------- tabel (urut + paging) ---------- */
const kolomDaftar = [
  ["nama", "pj.c.nama", (r) => `<a href="#${esc(r.id)}">${esc(r.nama)}</a>`],
  ["tek", "pj.c.tek", (r) => `${titik(r.tek)}${esc(labTek(r.tek))}`],
  ["kap", "pj.c.kap", (r) => (r.kap === null ? "-" : `${num(r.kap)} ${esc(r.sat)}`), "jm-nowrap"],
  ["prov", "pj.c.prov", (r) => esc(r.prov || "-")],
  ["st", "pj.c.status", (r) => pilSt(r.st)],
  ["prog", "pj.c.program", (r) => (r.prog.length ? r.prog.map((g) => pil(g)).join(" ") : "-")],
  ["pemilik", "pj.c.pemilik", (r) => esc(r.pemilik || "-")],
  ["cod", "pj.c.cod", (r) => (r.cod === null ? "-" : r.cod), "jm-nowrap"],
  [null, "pj.c.maps", mapsTbl],
  [null, "pj.c.sumber", sumberRingkas],
];
const kolomTelat = [
  ["nama", "pj.c.nama", kolomDaftar[0][2]], ["tek", "pj.c.tek", kolomDaftar[1][2]], ["kap", "pj.c.kap", kolomDaftar[2][2], "jm-nowrap"],
  ["prov", "pj.c.prov", kolomDaftar[3][2]], ["st", "pj.c.status", kolomDaftar[4][2]], ["cod", "pj.c.cod", kolomDaftar[7][2], "jm-nowrap"],
  ["telat", "pj.c.telat", (r) => pil(t("pj.telat.tahun", { n: r.telat }), "bad"), "jm-nowrap"], [null, "pj.c.maps", mapsTbl],
];
const TD = { el: "pjDaftar", kolom: kolomDaftar, k: "nama", arah: 1, n: BATAS, baris: () => tampil };
const TT = { el: "pjTelat", kolom: kolomTelat, k: "telat", arah: -1, n: BATAS, baris: () => tampil.filter((r) => r.telat) };
const bandingkan = (k, a) => (x, y) => {
  const u = x[k], v = y[k];
  if (u === v) return x.nama.localeCompare(y.nama);
  if (u === null || u === "" || u === undefined) return 1;
  if (v === null || v === "" || v === undefined) return -1;
  return (typeof u === "number" ? u - v : String(u).localeCompare(String(v))) * a;
};

function gambarTabel(T, fokus) {
  const rows = T.baris().slice().sort(bandingkan(T.k, T.arah)), el = $(T.el);
  if (!rows.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t(T === TT ? "pj.telat.kosong" : "jm.kosong.cocok"))}</p></div>`; return; }
  const kepala = T.kolom.map(([k, kt]) => k
    ? `<th scope="col" aria-sort="${T.k === k ? (T.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-pj-urut" data-u="${k}">${esc(t(kt))}</button></th>`
    : `<th scope="col">${esc(t(kt))}</th>`).join("");
  const badan = rows.slice(0, T.n).map((r) => `<tr>${T.kolom.map(([, kt, f, kls]) => `<td data-label="${esc(t(kt))}"${kls ? ` class="${kls}"` : ""}>${f(r)}</td>`).join("")}</tr>`).join("");
  el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-pj-tabel"><thead><tr>${kepala}</tr></thead><tbody>${badan}</tbody></table></div>
    <div class="jm-hal"><span>${esc(t("pj.tampil", { n: num(Math.min(T.n, rows.length)), total: num(rows.length) }))}</span>${rows.length > T.n ? `<button type="button" class="jm-tbl" data-lagi="1">${esc(t("pj.lagi"))}</button>` : ""}</div>`;
  if (fokus) { const b = el.querySelector(fokus); if (b) b.focus(); }
}
const gambarDaftar = () => gambarTabel(TD);
const gambarTelat = () => {
  $("pjTelatKet").textContent = t("pj.telat.ket", { tahun: TAHUN });
  gambarTabel(TT);
};
for (const T of [TD, TT]) {
  $(T.el).addEventListener("click", (e) => {
    const u = e.target.closest("[data-u]"), l = e.target.closest("[data-lagi]");
    if (u) {
      const k = u.dataset.u;
      T.arah = T.k === k ? -T.arah : (k === "kap" || k === "telat" ? -1 : 1); T.k = k;
      for (const th of $(T.el).querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", th.contains(u) ? (T.arah > 0 ? "ascending" : "descending") : "none");
      nanti(() => gambarTabel(T, `[data-u="${k}"]`));
    } else if (l) { T.n += BATAS; l.setAttribute("aria-busy", "true"); nanti(() => gambarTabel(T)); }
  });
}

/* ---------- peta ---------- */
let peta = null, petaSiap = false;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const fitur = (tek) => ({ type: "FeatureCollection", features: tampil.filter((r) => r.tek === tek && r.ada).map((r) => ({ type: "Feature", id: undefined, properties: { id: r.id, nama: r.nama, pr: r.p.lokasi.presisi || "provinsi" }, geometry: { type: "Point", coordinates: [r.p.lokasi.lng, r.p.lokasi.lat] } })) });

function pasangLapisan() {
  for (const tek of TEKS) {
    const w = warna(TEK_WARNA[tek] || "--ink2");
    if (!peta.getSource("s-" + tek)) peta.addSource("s-" + tek, { type: "geojson", data: fitur(tek), cluster: true, clusterRadius: 38, clusterMaxZoom: 9 });
    peta.addLayer({ id: "k-" + tek, type: "circle", source: "s-" + tek, filter: ["has", "point_count"], paint: { "circle-color": w, "circle-opacity": 0.85, "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 30, 24], "circle-stroke-width": 2, "circle-stroke-color": warna("--paper") } });
    peta.addLayer({ id: "n-" + tek, type: "symbol", source: "s-" + tek, filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Noto Sans Regular"], "text-allow-overlap": true }, paint: { "text-color": warna("--ink"), "text-halo-color": warna("--paper"), "text-halo-width": 1.5 } });
    peta.addLayer({ id: "p-" + tek, type: "circle", source: "s-" + tek, filter: ["!", ["has", "point_count"]], paint: { "circle-color": w, "circle-radius": 7, "circle-opacity": ["case", ["==", ["get", "pr"], "titik_persis"], 1, 0.55], "circle-stroke-width": ["case", ["==", ["get", "pr"], "titik_persis"], 2, 1], "circle-stroke-color": warna("--paper") } });
  }
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "pjPeta", style: gaya(), bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: 10 }, minZoom: 3, maxZoom: 16, dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true } });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { pasangLapisan(); petaSiap = true; });
    for (const tek of TEKS) {
      peta.on("click", "k-" + tek, (e) => {
        const f = e.features[0];
        peta.getSource("s-" + tek).getClusterExpansionZoom(f.properties.cluster_id).then((z) => peta.easeTo({ center: f.geometry.coordinates, zoom: z + 0.5 }));
      });
      peta.on("click", "p-" + tek, (e) => { location.hash = e.features[0].properties.id; });
      for (const l of ["k-", "p-"]) {
        peta.on("mouseenter", l + tek, () => { peta.getCanvas().style.cursor = "pointer"; });
        peta.on("mouseleave", l + tek, () => { peta.getCanvas().style.cursor = ""; });
      }
    }
    const ganti = () => { if (peta) { petaSiap = false; peta.setStyle(gaya()); } };
    new MutationObserver(ganti).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ganti);
  }).catch(() => { $("pjPeta").innerHTML = `<div class="jm-galat" role="alert"><p>${esc(t("pj.peta.galat"))}</p></div>`; });
}
function kePeta() {
  const n = tampil.filter((r) => r.ada), pasti = n.filter((r) => r.p.lokasi.presisi === "titik_persis").length;
  $("pjPresisi").textContent = t("pj.presisi.ket", { pasti: num(pasti), kira: num(n.length - pasti), tanpa: num(tampil.length - n.length) });
  if (!peta || !petaSiap) return;
  for (const tek of TEKS) { const s = peta.getSource("s-" + tek); if (s) s.setData(fitur(tek)); }
  if (n.length && Object.values(F).some(Boolean)) {
    const b = new maplibregl.LngLatBounds();
    for (const r of n) b.extend([r.p.lokasi.lng, r.p.lokasi.lat]);
    peta.fitBounds(b, { padding: 40, maxZoom: 8, duration: 400 });
  }
}
function gambarLegenda() {
  const c = hitung(tampil, (r) => r.tek);
  $("pjLegenda").innerHTML = TEKS.filter((k) => c[k]).map((k) => `<li>${titik(k)}${esc(labTek(k))} <b>${num(c[k])}</b></li>`).join("");
}

/* ---------- program ---------- */
function gambarProg() {
  $("pjProg").innerHTML = PROG.baris.map((g) => {
    const st = Object.entries(g.per_status || {}).map(([k, n]) => `<li>${esc(labSt(k))} <b>${num(n)}</b></li>`).join("");
    return `<article class="jm-pj-pk"><h3>${esc(g.nama)}</h3><p class="jm-bantu">${esc(g.ringkas || "")}</p>
      <dl><div><dt>${esc(t("pj.k.total"))}</dt><dd>${num(g.jumlah_proyek || 0)}</dd></div><div><dt>${esc(t("pj.k.kap"))}</dt><dd>${g.jumlah_proyek ? num(g.kapasitas_mw || 0, 0) + " MW" : "-"}</dd></div><div><dt>${esc(t("pj.rel.reg"))}</dt><dd>${num((g.regulasi_ids || []).length)}</dd></div></dl>
      ${st ? `<ul class="jm-pj-pil">${st}</ul>` : `<p class="jm-bantu">${esc(t("pj.prog.kosong"))}</p>`}
      ${g.jumlah_proyek ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-prog="${esc(g.id)}">${esc(t("pj.prog.lihat"))}</button>` : ""}</article>`;
  }).join("");
}
$("pjProg").addEventListener("click", (e) => {
  const b = e.target.closest("[data-prog]");
  if (!b) return;
  F.prog = b.dataset.prog; $("fprog").value = F.prog;
  terapkan();
  $("hPeta").scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------- profil (dialog, tautan dalam #id) ---------- */
const dlg = $("pjProfil");
let petaMini = null;
const sumberRef = (id) => (id ? `<sup class="jm-pj-ref" title="${esc(t("pj.sumber.ref"))}">${esc(id)}</sup>` : "");
const nilaiBersumber = (a, f) => (a && a.length ? `<ul class="jm-pj-nilai">${a.map((x) => `<li>${f ? f(x) : esc(x.nilai)}${x.catatan ? ` <small>${esc(x.catatan)}</small>` : ""}${sumberRef(x.sumber_id)}</li>`).join("")}</ul>` : `<p class="jm-bantu">${esc(t("pj.kosong.data"))}</p>`);
const laci = (kunci, isiHtml, buka = true) => `<details class="jm-pj-laci"${buka ? " open" : ""}><summary>${esc(t("pj.l." + kunci))}</summary><div class="jm-pj-laci-isi">${isiHtml}</div></details>`;
const baris2 = (k, v) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`;

function profilHtml(r) {
  const p = r.p, L = p.lokasi || {};
  const kap = nilaiBersumber(p.kapasitas, (x) => `${num(x.nilai)} ${esc(x.satuan || "")}`);
  const telat = r.telat ? pil(t("pj.telat.tahun", { n: r.telat }), "bad") : "";
  const kronologi = [...(p.tanggal_ppa || []).map((x) => ["pj.w.ppa", x]), ...(p.financial_close || []).map((x) => ["pj.w.fc", x]), ...(p.cod_target || []).map((x) => ["pj.w.target", x]), ...(p.cod_aktual || []).map((x) => ["pj.w.aktual", x])]
    .sort((a, b) => String(a[1].nilai).localeCompare(String(b[1].nilai)));
  const garis = kronologi.length ? `<ol class="jm-pj-garis">${kronologi.map(([k, x]) => `<li class="${k === "pj.w.aktual" ? "ok" : ""}"><b>${esc(String(x.nilai))}</b><span>${esc(t(k))}${sumberRef(x.sumber_id)}</span></li>`).join("")}</ol>` : `<p class="jm-bantu">${esc(t("pj.kosong.data"))}</p>`;
  const pihak = ["pemilik", "epc", "pembeli"].map((k) => {
    const a = (p.pihak || {})[k];
    return a && a.length ? baris2("pj.p." + k, `<ul class="jm-pj-nilai">${a.map((x) => `<li>${esc(x.nilai)}${x.organisasi_id ? ` <a href="/direktori#${esc(x.organisasi_id)}" data-org="${esc(x.organisasi_id)}">${esc(t("pj.p.direktori"))}</a>` : ""}${x.catatan ? ` <small>${esc(x.catatan)}</small>` : ""}${sumberRef(x.sumber_id)}</li>`).join("")}</ul>`) : baris2("pj.p." + k, "-");
  }).join("");
  const sumber = (p.sumber || []).length ? `<ul class="jm-pj-nilai">${p.sumber.map((s) => `<li id="s-${esc(s.id)}"><b>${esc(s.id)}</b> ${esc(s.dokumen || s.jenis)}${s.halaman ? ", " + esc(s.halaman) : ""}${urlAman(s.url) ? ` <a href="${esc(urlAman(s.url))}" target="_blank" rel="noopener noreferrer">${esc(t("pj.tautan"))}</a>` : ""}<small>${esc(t("pj.bukti." + (s.tingkat_bukti || "media")))}, ${esc(tanggal(s.tanggal))}${s.lisensi ? ", " + esc(s.lisensi) : ""}</small></li>`).join("")}</ul>` : `<p class="jm-bantu">${esc(t("pj.kosong.data"))}</p>`;
  const ls = L.sumber ? `<p class="jm-bantu">${esc(t("pj.lokasi.sumber"))}: ${esc(L.sumber.jenis || "")}${L.sumber.catatan ? ", " + esc(L.sumber.catatan) : ""}${L.sumber.lisensi ? " (" + esc(L.sumber.lisensi) + ")" : ""}</p>` : "";
  return `<div class="jm-pj-dkepala"><h2 id="pjProfilJudul">${esc(r.nama)}</h2><button type="button" class="jm-tbl jm-tbl-kecil" data-tutup="1">${esc(t("jm.tutup"))}</button></div>
    <div class="jm-pj-dpil">${titik(r.tek)}${pil(labTek(r.tek))}${pilSt(r.st)}${telat}${pil(t("pj.bukti." + (p.tingkat_bukti || "media")), p.tingkat_bukti === "resmi" ? "ok" : "warn")}</div>
    ${laci("identitas", `<dl class="jm-pj-dl">${baris2("pj.c.nama", esc(r.nama))}${baris2("pj.alias", (p.nama_lain || []).length ? esc(p.nama_lain.join(", ")) : "-")}${baris2("pj.c.tek", esc(labTek(r.tek)))}${baris2("pj.c.program", r.prog.length ? r.prog.map((g) => pil(((PROG.baris.find((x) => x.id === g)) || {}).nama || g)).join(" ") : "-")}${baris2("pj.id", esc(r.id))}</dl>`)}
    ${laci("lokasi", `<dl class="jm-pj-dl">${baris2("pj.c.prov", esc(r.prov || "-"))}${baris2("pj.kab", esc(r.kab || "-"))}${baris2("pj.koord", r.ada ? `${esc(L.lat)}, ${esc(L.lng)}` : "-")}${baris2("pj.presisi", esc(presisiTeks(r)))}</dl>${ls}
      ${r.ada ? `<div id="pjMini" class="jm-pj-mini"></div><a class="jm-tbl" href="${mapsUrl(L.lat, L.lng)}" target="_blank" rel="noopener noreferrer">${PIN}<span>${esc(t("pj.maps"))}</span></a>` : ""}`)}
    ${laci("teknis", `<dl class="jm-pj-dl">${baris2("pj.c.tek", esc(labTek(r.tek)))}${baris2("pj.c.kap", kap)}</dl>`)}
    ${laci("uang", nilaiBersumber(p.nilai_investasi, (x) => `${num(x.nilai)} ${esc(x.mata_uang || x.satuan || "")}`))}
    ${laci("waktu", garis)}
    ${laci("pihak", `<dl class="jm-pj-dl">${pihak}</dl>`)}
    ${laci("status", nilaiBersumber(p.status, (x) => `${pilSt(x.nilai)}${x.status_asli ? ` <small>${esc(x.status_asli)}</small>` : ""}`))}
    ${laci("sumber", sumber)}
    <details class="jm-pj-laci" open><summary>${esc(t("pj.l.terkait"))}</summary><div class="jm-pj-laci-isi" id="pjRel">${hantuHtml(2)}</div></details>`;
}

async function isiTerkait(r) {
  const el = $("pjRel");
  try {
    const [rg, br, og] = await Promise.all([lazy("/data/regulasi.json"), lazy("/data/berita.json"), lazy("/data/organisasi.json")]);
    if (!el.isConnected || dlg.dataset.id !== r.id) return;
    const ids = new Set(r.p.regulasi_ids || []);
    const regs = rg.baris.filter((x) => ids.has(x.id) || (x.proyek_ids || []).includes(r.id));
    const brs = br.baris.filter((x) => (x.proyek_ids || []).includes(r.id) || (r.p.berita_ids || []).includes(x.id));
    el.innerHTML = `<h3>${esc(t("pj.rel.reg"))}</h3>` + (regs.length ? `<ul class="jm-pj-nilai">${regs.map((x) => `<li>${urlAman(x.url_sumber) ? `<a href="${esc(x.url_sumber)}" target="_blank" rel="noopener noreferrer">${esc(x.judul)}</a>` : esc(x.judul)}<small>${esc(String(x.jenis || "").toUpperCase())} ${esc(x.nomor || "")}/${esc(x.tahun || "")}, ${esc(x.status || "")}</small></li>`).join("")}</ul>` : `<p class="jm-bantu">${esc(t("pj.rel.kosong"))}</p>`) +
      `<h3>${esc(t("pj.rel.ber"))}</h3>` + (brs.length ? `<ul class="jm-pj-nilai">${brs.map((x) => `<li><a href="${esc(urlAman(x.url))}" target="_blank" rel="noopener noreferrer">${esc(x.judul)}</a><small>${esc(x.media || "")}, ${esc(tglIso(x.terbit))}</small></li>`).join("")}</ul>` : `<p class="jm-bantu">${esc(t("pj.rel.kosong"))}</p>`);
    const nama = new Map(og.baris.map((o) => [o.id, o.nama]));
    for (const a of dlg.querySelectorAll("[data-org]")) if (nama.has(a.dataset.org)) a.textContent = nama.get(a.dataset.org);
  } catch (e) { if (el.isConnected) el.innerHTML = `<p class="jm-bantu">${esc(t("pj.rel.galat"))}</p>`; }
}

function miniPeta(r) {
  const el = $("pjMini");
  if (!el) return;
  muatMapLibre().then(() => {
    if (!el.isConnected) return;
    const z = { titik_persis: 11, kabupaten: 8 }[r.p.lokasi.presisi] || 5;
    petaMini = new maplibregl.Map({ container: el, style: gaya(), center: [r.p.lokasi.lng, r.p.lokasi.lat], zoom: z, minZoom: 3, maxZoom: 16, dragRotate: false, attributionControl: { compact: true } });
    const m = document.createElement("div"); m.className = "jm-pj-penanda" + (r.p.lokasi.presisi === "titik_persis" ? "" : " kira");
    new maplibregl.Marker({ element: m }).setLngLat([r.p.lokasi.lng, r.p.lokasi.lat]).addTo(petaMini);
    petaMini.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
  }).catch(() => { el.textContent = t("pj.peta.galat"); });
}

function bukaProfil(id) {
  const r = PER_ID.get(id);
  if (!r) { if (dlg.open) dlg.close(); return; }
  if (dlg.open && dlg.dataset.id === id) return;
  if (petaMini) { petaMini.remove(); petaMini = null; }
  dlg.dataset.id = id;
  dlg.innerHTML = profilHtml(r);
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  nanti(() => { miniPeta(r); isiTerkait(r); });
}
dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-tutup]")) dlg.close(); });
dlg.addEventListener("close", () => {
  if (petaMini) { petaMini.remove(); petaMini = null; }
  delete dlg.dataset.id;
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
});
const dariHash = () => { const id = decodeURIComponent(location.hash.slice(1)); if (id) bukaProfil(id); else if (dlg.open) dlg.close(); };
addEventListener("hashchange", dariHash);

/* ---------- kerangka + pemasangan ---------- */
function semua() {
  gambarHero(); isiPilihan(); gambarProg(); terapkan();
  if (dlg.open && dlg.dataset.id) { const id = dlg.dataset.id; delete dlg.dataset.id; if (petaMini) { petaMini.remove(); petaMini = null; } bukaProfil(id); }
}
const cariTunda = debounce(() => { F.q = $("fq").value.trim().toLowerCase(); terapkan(); }, 120);
$("fq").addEventListener("input", cariTunda);
for (const [sel, k] of [["ftek", "tek"], ["fst", "st"], ["fprog", "prog"], ["fprov", "prov"]]) $(sel).addEventListener("change", () => { F[k] = $(sel).value; terapkan(); });
$("freset").addEventListener("click", () => { Object.assign(F, { q: "", tek: "", st: "", prog: "", prov: "" }); $("fq").value = ""; for (const s of ["ftek", "fst", "fprog", "fprov"]) $(s).value = ""; terapkan(); });
document.addEventListener("jm:bahasa", () => nanti(semua));

semua();
nanti(bukaPeta);
dariHash();
