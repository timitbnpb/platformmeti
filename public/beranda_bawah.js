/* Bagian beranda di bawah lipatan: sensus per teknologi, halaman lain, cara data dibuat, akses data.
   Dirender saat mendekati layar (IntersectionObserver); angka dari public/data/*.json. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, hantuHtml } from "/inti/umum.js";
import { muat, label, sembunyi } from "/publik.js";
import { muatMapLibre } from "/inti/maplibre.js";

export const P = (d) => `<svg class="jm-ikon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
export const IKON = {
  surya: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
  bayu: P('<path d="M12 12V22M12 12l-1-9 3 8zM12 12l8 4-8 1zM12 12l-8 4 7 1.5"/>'),
  hidro: P('<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 14c3-3 6 3 9 0s6 3 9 0M3 19c3-3 6 3 9 0s6 3 9 0"/>'),
  "panas-bumi": P('<path d="M3 21 10 8l4 7 3-4 4 10zM9 3c-1 1 1 2 0 3M14 3c-1 1 1 2 0 3"/>'),
  bioenergi: P('<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15zM5 19 14 10"/>'),
  "biomassa-sampah": P('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/>'),
  nuklir: P('<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/>'),
  penyimpanan: P('<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M7 10v4M11 10v4"/>'),
  koperasi: P('<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6M15 14c4-1 7 1 7 5"/>'),
  ormawa: P('<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5"/>'),
  "perguruan-tinggi": P('<path d="M3 10l9-6 9 6zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>'),
  tautan: P('<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>'),
  label: P('<path d="M3 12V4h8l9 9-8 8zM7.5 8.5h.01"/>'),
  kalender: P('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  lapis: P('<path d="M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5"/>'),
  pin: P('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  peta: P('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>'),
  pabrik: P('<path d="M3 21V10l6 4v-4l6 4V6h3v15zM3 21h18"/>'),
  timbangan: P('<path d="M12 3v18M6 21h12M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>'),
  orangkunci: P('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6"/><rect x="16" y="12" width="6" height="5" rx="1"/><path d="M17.5 12v-1.5a1.5 1.5 0 0 1 3 0V12"/>'),
  buku: P('<path d="M4 4h10a4 4 0 0 1 4 4v13H8a4 4 0 0 1-4-4zM4 17a4 4 0 0 1 4-4h10"/>'),
  grafik: P('<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>'),
  waktu: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  "think-tank": P('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>'),
};

const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "penyimpanan"];
const jml = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
const TEK_FOTO = [["surya", "surya-cirata", "Cirata", "indonesiagoid", "domain publik", "PLTS terapung Cirata"], ["bayu", "bayu-sidrap", "Sidrap", "USAID Indonesia", "domain publik", "PLTB Sidrap"], ["panas-bumi", "panas-bumi-sibayak", "Sibayak|Berastagi|Karo", "Kenrick95", "CC BY-SA 3.0", "PLTP dekat Berastagi"], ["hidro", "hidro-saguling", "Saguling", "NFarras", "CC BY-SA 4.0", "PLTA Saguling"]];
const TEK_LAIN = ["bioenergi", "biomassa-sampah", "nuklir", "penyimpanan"];
const ORG = [["koperasi", "koperasi"], ["ormawa", "ormawa"], ["perguruan-tinggi", "perguruan-tinggi"], ["think-tank", "think-tank"]];
const hantu = (id, n = 3) => { const e = document.getElementById(id); if (e && !e.childElementCount) e.innerHTML = hantuHtml(n); };

async function teknologi() {
  const foto = document.getElementById("foto"), sensus = document.getElementById("sensus");
  try {
    const [pro, org] = await Promise.all([muat("proyek"), muat("organisasi")]);
    const jml = (k) => pro.baris.filter((p) => p.teknologi === k).length;
    foto.innerHTML = TEK_FOTO.map(([k, f, cari, , , nama]) => {
      const cocok = pro.baris.find((p) => new RegExp(cari, "i").test(p.nama) && p.teknologi === k);
      const href = cocok ? `/proyek#${encodeURIComponent(cocok.id)}` : `/proyek?teknologi=${k}`;
      return `<a class="jm-foto" href="${href}"><img src="/img/beranda/${f}.webp" width="800" height="600" loading="lazy" alt=""><span class="jm-foto-isi"><span class="jm-pil">${esc(angka(jml(k)))} ${esc(t("beranda.tek.n"))}</span><strong>${esc(nama)}</strong><small>${esc(label("beranda.tek.", k))}</small></span></a>`;
    }).join("");
    const tek = TEK_LAIN.map((k) => [k, jml(k), `/proyek?teknologi=${k}`, label("beranda.tek.", k), "beranda.tek.n"]);
    const jenis = ORG.map(([k, kode]) => [k, org.baris.filter((o) => o.kategori?.kode === kode).length, "/direktori?tampil=lembaga", t("beranda.sensus.k." + k), "beranda.sensus.org"]);
    sensus.innerHTML = [...tek, ...jenis].filter((x) => x[1] > 0).map(([k, n, href, nama, unit]) => `<a class="jm-tile" href="${href}">${IKON[k]}<strong>${esc(nama)}</strong><span class="jm-ds-n">${esc(angka(n))}</span><small>${esc(t(unit))}</small></a>`).join("");
    document.getElementById("sensusSumber").textContent = t("beranda.sensus.sumber", { tanggal: tanggal(pro.dibangun_pada) });
    document.getElementById("fotoKredit").textContent = t("beranda.foto.kredit", { daftar: TEK_FOTO.map(([, , , pembuat, lisensi, nama]) => `${nama} (${pembuat}, ${lisensi})`).join("; ") });
  } catch (e) { sembunyi(foto, e); }
}

async function jalur() {
  const el = document.getElementById("jalur");
  try {
    const [rg, wl, rt, kl, pk, og] = await Promise.all(["ringkas", "wilayah", "rantai_plts", "kalender", "pustaka", "organisasi"].map(muat));
    const J = [["proyek", "/proyek", "pin", rg.hitung.proyek, "proyek"], ["wilayah", "/wilayah", "peta", wl.jumlah, "provinsi"], ["rantai", "/rantai", "pabrik", rt.ringkas.pabrikan, "pabrikan"], ["regulasi", "/regulasi", "timbangan", rg.hitung.regulasi, "regulasi"],
      ["direktori", "/direktori", "orangkunci", og.jumlah, "organisasi"], ["pustaka", "/direktori?tampil=pustaka", "buku", pk.jumlah, "dokumen"], ["kalender", "/kalender", "kalender", kl.jumlah, "acara"], ["insight", "/insight", "grafik", null, ""]];
    el.innerHTML = J.map(([k, href, ik, n, u]) => `<a class="jm-jalur" href="${href}">${IKON[ik]}<strong>${esc(t("beranda.j." + k))}</strong><span>${esc(t("beranda.j." + k + ".ket"))}</span>${n != null ? `<b class="jm-jalur-n">${esc(angka(n))} <small>${esc(t("beranda.jn." + u))}</small></b>` : ""}<span class="jm-jalur-panah" aria-hidden="true">&rarr;</span></a>`).join("");
  } catch (e) { sembunyi(el, e); }
}

async function bento() {
  const el = document.getElementById("bento");
  try {
    const [org, pro, rt, pk, prog] = await Promise.all(["organisasi", "proyek", "rantai_plts", "pustaka", "program"].map(muat));
    const tahun = +String(pro.dibangun_pada).slice(0, 4), sat = (p) => p.kapasitas?.[0]?.nilai || 0;
    // tile besar: titik proyek sebagai siluet + organisasi bertitik koordinat
    const X = (lng) => ((lng - 94) / 47.5) * 480, Y = (lat) => ((6.5 - lat) / 18.5) * 200;
    const loc = pro.baris.filter((p) => Number.isFinite(p.lokasi?.lat));
    const abu = loc.map((p) => `<circle class="jm-sc-abu" cx="${X(p.lokasi.lng).toFixed(1)}" cy="${Y(p.lokasi.lat).toFixed(1)}" r="3"/>`).join("");
    const og = org.baris.filter((o) => Number.isFinite(o.lokasi?.lat));
    const tt = og.map((o) => `<g><title>${esc(o.nama)}</title><circle class="jm-sc-dot" cx="${X(o.lokasi.lng).toFixed(1)}" cy="${Y(o.lokasi.lat).toFixed(1)}" r="6"/></g>`).join("");
    const lewat = pro.baris.filter((p) => p.status?.[0]?.nilai !== "beroperasi" && p.cod_target?.length && Math.min(...p.cod_target.map((c) => c.nilai)) < tahun);
    const perProg = prog.baris.map((g) => [g.nama, lewat.filter((p) => (p.program_ids || []).includes(g.id)).length]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const mxp = Math.max(1, ...perProg.map((x) => x[1]));
    const jenis = {}; for (const d of pk.baris) jenis[d.jenis] = (jenis[d.jenis] || 0) + 1;
    const topJ = Object.entries(jenis).sort((a, b) => b[1] - a[1]).slice(0, 3), mxj = Math.max(1, ...topJ.map((x) => x[1]));
    const r = rt.ringkas, bar = (f, w) => `<svg class="jm-ds-bar jm-w${w}" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-bar-latar" width="100" height="6"/><rect class="jm-bar-isi" width="${Math.max(1, Math.round(f * 100))}" height="6"/></svg>`;
    const baris = (a, f, n, w) => `<div class="jm-bt-baris"><span>${esc(a)}</span><b>${esc(angka(n))}</b></div>${bar(f, w)}`;
    const tile = (href, ik, judul, ket, nomor, satuan, viz, cls = "") => `<a class="jm-bt ${cls}" href="${href}"><span class="jm-kpi-ik">${IKON[ik]}</span><strong>${esc(judul)}</strong><span class="jm-bt-ket">${esc(ket)}</span><span class="jm-bt-n"><b>${esc(nomor)}</b> <small>${esc(satuan)}</small></span><span class="jm-bt-viz">${viz}</span></a>`;
    const tanpa = [[t("beranda.bt.c.pro"), pro.baris.length - loc.length], [t("beranda.bt.c.org"), org.baris.length - og.length], [t("beranda.bt.c.pdf"), (await muat("regulasi")).baris.filter((x) => !x.url_pdf).length]];
    el.innerHTML = [
      `<a class="jm-bt jm-bt-besar" href="/direktori?tampil=lembaga"><span class="jm-kpi-ik">${IKON.pin}</span><strong>${esc(t("beranda.bt.peta"))}</strong><span class="jm-bt-ket">${esc(t("beranda.bt.peta.d"))}</span><span class="jm-bt-n"><b>${esc(angka(og.length))}</b> <small>${esc(t("beranda.bt.peta.u", { total: angka(org.baris.length) }))}</small></span><svg class="jm-bt-peta" viewBox="0 0 480 200" role="img" aria-label="${esc(t("beranda.bt.peta"))}">${abu}${tt}</svg></a>`,
      tile("/rantai", "pabrik", t("beranda.bt.rantai"), t("beranda.bt.rantai.d"), angka(r.total_mwp / 1000, { desimal: 1 }), "GWp", baris(t("beranda.ds.l.lokal"), r.lokal_mwp / r.total_mwp, r.lokal_mwp, 4) + baris(t("beranda.ds.l.ekspor"), r.ekspor_mwp / r.total_mwp, r.ekspor_mwp, 5)),
      tile("/proyek#terlambat", "waktu", t("beranda.bt.lewat"), t("beranda.bt.lewat.d"), angka(lewat.length), t("beranda.tek.n"), perProg.map(([a, n]) => baris(a, n / mxp, n, 2)).join("")),
      tile("/direktori?tampil=pustaka", "buku", t("beranda.bt.riset"), t("beranda.bt.riset.d"), angka(pk.baris.length), t("beranda.ds.l.dok"), topJ.map(([a, n]) => baris(label("beranda.bt.j.", a), n / mxj, n, 3)).join("")),
      tile("/tentang#metode", "lapis", t("beranda.bt.cakupan"), t("beranda.bt.cakupan.d"), angka(pro.baris.length + org.baris.length + (await muat("regulasi")).baris.length), t("beranda.bt.cakupan.u"), tanpa.map(([a, n]) => `<div class="jm-bt-baris"><span>${esc(a)}</span><b>${esc(angka(n))}</b></div>`).join("")),
    ].join("");
  } catch (e) { sembunyi(el, e); }
}

const CARA = [["sumber", "tautan", () => `<span class="jm-chip">peraturan.bpk.go.id</span>`], ["est", "label", () => `<span class="jm-pil jm-pil-est">EST</span>`], ["tanggal", "kalender", (tgl) => `<span class="jm-chip">${esc(tgl)}</span>`], ["bukti", "lapis", () => `<span class="jm-chip">${esc(t("beranda.cara.t.resmi"))}</span><span class="jm-chip">${esc(t("beranda.cara.t.media"))}</span><span class="jm-chip">${esc(t("beranda.cara.t.pihak"))}</span>`]];
async function cara() {
  const el = document.getElementById("cara");
  let tgl = "";
  try { tgl = tanggal((await muat("ringkas")).dibangun_pada); } catch (e) { /* tanpa tanggal contoh: chip tanggal kosong disembunyikan di bawah */ }
  el.innerHTML = CARA.map(([k, ik, ex], i) => `<div class="jm-cara"><div class="jm-cara-kep"><span class="jm-kpi-ik">${IKON[ik]}</span><span class="jm-cara-no">0${i + 1}</span></div><h3>${esc(t("beranda.cara." + k))}</h3><p>${esc(t("beranda.cara." + k + ".d"))}</p><div class="jm-baris-kecil">${k === "tanggal" && !tgl ? "" : ex(tgl)}</div></div>`).join("");
}

/** Daftar peringkat berbatang: item {nama, meta, nilai, unit, frac, href, panas}. */
const rankHtml = (items) => `<ol class="jm-rank">${items.map((x, i) => `<li><a href="${esc(x.href)}"><span class="jm-rank-no">${i + 1}</span><span class="jm-rank-t"><strong title="${esc(x.nama)}">${esc(x.nama)}</strong><small>${esc(x.meta)}</small></span><span class="jm-rank-v"><b>${esc(x.nilai)}</b> <small>${esc(x.unit)}</small></span><svg class="jm-rank-bar${i === 0 ? " jm-rank-atas" : ""}${x.panas ? " jm-rank-panas" : ""}" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-bar-latar" width="100" height="6"/><rect class="jm-bar-isi" width="${Math.max(2, Math.round(x.frac * 100))}" height="6"/></svg></a></li>`).join("")}</ol>`;
const infoSumber = (teks) => `<span class="jm-info" tabindex="0" title="${esc(teks)}">${IKON.waktu.replace('width="40" height="40"', 'width="16" height="16"')}<span>${esc(t("beranda.sumber_l"))}</span></span>`;

/* ---------- peta proyek (MapLibre dimuat malas saat bagian ini mendekati layar) ---------- */
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
let peta = null, dataPeta = null;
async function siapPeta() {
  const [pro, prog] = await Promise.all([muat("proyek"), muat("program")]);
  const ada = pro.baris.filter((p) => Number.isFinite(p.lokasi?.lat) && Number.isFinite(p.lokasi?.lng));
  const mw = (p) => p.kapasitas?.[0]?.nilai || 0;
  const titik = ada.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lokasi.lng, p.lokasi.lat] }, properties: { id: p.id, nama: p.nama, tek: Math.max(0, TEK.indexOf(p.teknologi)), mw: mw(p) } }));
  const garis = [];
  for (const g of prog.baris) {
    const ps = ada.filter((p) => (p.program_ids || []).includes(g.id));
    if (ps.length < 2) continue;
    const c = [ps.reduce((s, p) => s + p.lokasi.lng, 0) / ps.length, ps.reduce((s, p) => s + p.lokasi.lat, 0) / ps.length];
    for (const p of ps) garis.push({ type: "Feature", geometry: { type: "LineString", coordinates: [c, [p.lokasi.lng, p.lokasi.lat]] }, properties: { prog: g.id } });
  }
  const besar = [...titik].sort((a, b) => b.properties.mw - a.properties.mw).slice(0, 8);
  dataPeta = { titik, garis, besar, n: ada.length, nProg: new Set(garis.map((f) => f.properties.prog)).size, tgl: pro.dibangun_pada };
  const tabel = [...prog.baris].filter((g) => g.jumlah_proyek > 0).sort((a, b) => b.kapasitas_mw - a.kapasitas_mw).slice(0, 6);
  const row = (a, b) => `<div class="jm-ds-baris"><span>${esc(a)}</span><span>${esc(b)}</span></div>`;
  document.getElementById("petaInfo").innerHTML = `<div class="jm-ds-kep"><span>${esc(t("beranda.peta.k"))}</span><span>${esc(t("beranda.ds.diperbarui", { tanggal: tanggal(pro.dibangun_pada) }))}</span></div>
    <h3>${esc(t("beranda.peta.j"))}</h3><p>${esc(t("beranda.peta.d"))}</p>
    <dl class="jm-ds-stat"><div><dd class="jm-ds-n">${esc(angka(ada.length))}</dd><dt>${esc(t("beranda.peta.l.titik"))}</dt></div><div><dd class="jm-ds-n">${esc(angka(dataPeta.nProg))}</dd><dt>${esc(t("beranda.peta.l.prog"))}</dt></div><div><dd class="jm-ds-n">${esc(angka(pro.baris.length - ada.length))}</dd><dt>${esc(t("beranda.peta.l.tanpa"))}</dt></div></dl>
    <div class="jm-ds-viz"><h4>${esc(t("beranda.peta.tabel"))}</h4>${rankHtml(tabel.map((g) => ({ nama: g.nama, meta: `${angka(g.jumlah_proyek)} ${t("beranda.tek.n")}`, nilai: angka(g.kapasitas_mw), unit: "MW", frac: g.kapasitas_mw / Math.max(1, tabel[0].kapasitas_mw), href: `/proyek#program-${encodeURIComponent(g.id)}` })))}</div>
    ${infoSumber(t("beranda.peta.s", { tanggal: tanggal(pro.dibangun_pada) }))}`;
}
async function bangunPeta() {
  const el = document.getElementById("petaEl");
  try {
    await Promise.all([siapPeta(), muatMapLibre()]);
    peta?.remove();
    peta = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: 10 }, minZoom: 3, maxZoom: 12, dragRotate: false, pitchWithRotate: false, scrollZoom: false, attributionControl: { compact: true } });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("load", () => {
      const d = dataPeta, w = [1, 2, 3, 4, 5].map((i) => warna("--data" + i));
      peta.addSource("garis", { type: "geojson", data: { type: "FeatureCollection", features: d.garis } });
      peta.addLayer({ id: "garis", type: "line", source: "garis", paint: { "line-color": warna("--data2"), "line-opacity": 0.3, "line-width": 1 } });
      peta.addSource("titik", { type: "geojson", data: { type: "FeatureCollection", features: d.titik } });
      peta.addLayer({ id: "titik", type: "circle", source: "titik", paint: { "circle-color": ["match", ["%", ["get", "tek"], 5], 0, w[0], 1, w[1], 2, w[2], 3, w[3], w[4]], "circle-radius": ["interpolate", ["linear"], ["get", "mw"], 0, 3, 100, 5, 1000, 9], "circle-opacity": 0.75, "circle-stroke-width": 1, "circle-stroke-color": warna("--paper") } });
      peta.addSource("besar", { type: "geojson", data: { type: "FeatureCollection", features: d.besar } });
      peta.addLayer({ id: "besar", type: "symbol", source: "besar", layout: { "text-field": ["get", "nama"], "text-size": 11, "text-font": ["Noto Sans Regular"], "text-anchor": "top", "text-offset": [0, 0.8], "text-max-width": 8 }, paint: { "text-color": warna("--ink"), "text-halo-color": warna("--paper"), "text-halo-width": 1.5 } });
    });
  } catch (e) { sembunyi(el, e); }
}

/* ---------- pembangkit dan emisi (Climate TRACE, estimasi) ---------- */
async function karbon() {
  const el = document.getElementById("karbon");
  try {
    const k = await muat("karbon");
    const p = k.baris.filter((x) => x.kelompok === "pembangkit" && x.emisi_tco2e > 0 && x.kapasitas_mw > 0);
    if (!p.length) { el.closest("section").hidden = true; return; }
    const urut = [...p].sort((a, b) => b.emisi_tco2e - a.emisi_tco2e), top = urut.slice(0, 14);
    const tot = jml(p, (x) => x.emisi_tco2e), pct = (jml(top, (x) => x.emisi_tco2e) / tot) * 100;
    const lx = (mw) => Math.log10(mw), x0 = Math.floor(Math.min(...p.map((x) => lx(x.kapasitas_mw)))), x1 = Math.ceil(Math.max(...p.map((x) => lx(x.kapasitas_mw)))), ym = top[0].emisi_tco2e;
    const X = (mw) => 50 + ((lx(mw) - x0) / Math.max(1, x1 - x0)) * 530, Y = (e) => 360 - (e / ym) * 330;
    const ticks = []; for (let i = x0; i <= x1; i++) ticks.push(i);
    const abu = urut.slice(14).map((x) => `<circle class="jm-sc-abu" cx="${X(x.kapasitas_mw).toFixed(1)}" cy="${Y(x.emisi_tco2e).toFixed(1)}" r="3"><title>${esc(x.nama)}</title></circle>`).join("");
    const besar = top.map((x, i) => `<g><title>${esc(x.nama)}</title><circle class="jm-sc-dot" cx="${X(x.kapasitas_mw).toFixed(1)}" cy="${Y(x.emisi_tco2e).toFixed(1)}" r="11"/><text class="jm-sc-ini" x="${X(x.kapasitas_mw).toFixed(1)}" y="${(Y(x.emisi_tco2e) + 3.5).toFixed(1)}" text-anchor="middle">${i + 1}</text></g>`).join("");
    const sb = ticks.map((i) => `<text class="jm-sc-sb" x="${X(10 ** i).toFixed(1)}" y="378" text-anchor="middle">${esc(angka(10 ** i))}</text><line class="jm-sc-bagi" x1="${X(10 ** i).toFixed(1)}" y1="30" x2="${X(10 ** i).toFixed(1)}" y2="360"/>`).join("");
    const svg = `<svg class="jm-sc" viewBox="0 0 600 400" role="img" aria-label="${esc(t("beranda.karbon.aria"))}"><line class="jm-sc-as" x1="50" y1="360" x2="590" y2="360"/><line class="jm-sc-as" x1="50" y1="20" x2="50" y2="360"/>${sb}<text class="jm-sc-sb" x="590" y="396" text-anchor="end">${esc(t("beranda.karbon.x"))}</text><text class="jm-sc-sb" x="54" y="16">${esc(t("beranda.karbon.y", { mt: angka(ym / 1e6, { desimal: 1 }) }))}</text>${abu}${besar}</svg>`;
    const row = (a, b) => `<div class="jm-ds-baris"><span>${esc(a)}</span><span>${esc(b)}</span></div>`;
    const stat = (n, l, est) => `<div><dd class="jm-ds-n">${esc(n)}</dd><dt>${esc(t(l))}${est ? ' <span class="jm-pil jm-pil-est">EST</span>' : ""}</dt></div>`;
    el.innerHTML = `<div class="jm-peta-info"><div class="jm-ds-kep"><span>${esc(t("beranda.karbon.k"))}</span><span>${esc(t("beranda.ds.diperbarui", { tanggal: tanggal(k.dibangun_pada) }))}</span></div>
      <h3>${esc(t("beranda.karbon.j"))}</h3><p>${esc(t("beranda.karbon.d"))}</p>
      <dl class="jm-ds-stat">${stat(angka(p.length), "beranda.karbon.l.n")}${stat(angka(jml(p, (x) => x.kapasitas_mw) / 1000, { desimal: 1 }), "beranda.karbon.l.gw")}${stat(angka(tot / 1e6, { desimal: 1 }), "beranda.karbon.l.mt", 1)}</dl>
      <div class="jm-kpi-strip"><b>${esc(angka(pct, { desimal: 0 }))}%</b><span>${esc(t("beranda.karbon.wawasan", { n: angka(top.length), total: angka(p.length) }))}</span></div>
      <div class="jm-ds-viz"><h4>${esc(t("beranda.karbon.tabel"))}</h4>${rankHtml(top.slice(0, 6).map((x) => ({ nama: x.nama.replace(/ power station$/i, ""), meta: label("beranda.karbon.j.", String(x.jenis_aset).split(",")[0].trim()), nilai: angka(x.emisi_tco2e / 1e6, { desimal: 1 }), unit: "Mt", frac: x.emisi_tco2e / top[0].emisi_tco2e, href: "/insight#emisi", panas: true })))}</div>
      ${infoSumber(t("beranda.karbon.s", { tanggal: tanggal(k.dibangun_pada), tahun: p[0].tahun }))}</div>${svg}`;
  } catch (e) { sembunyi(el, e); }
}

/** Pasang tugas malas: jalan sekali saat bagian mendekati layar (IntersectionObserver) atau terlewati lompatan gulir. */
export function pasangBawah(R) {
  ["dataset", "karbon", "foto", "sensus", "jalur", "bento"].forEach((id) => hantu(id));
  cara();
  const tugas = [[document.getElementById("jalur"), jalur], [document.getElementById("dataset"), () => import("/beranda_data.js").then((m) => m.gambarDataset(R))], [document.getElementById("petaKartu"), bangunPeta], [document.getElementById("karbon"), karbon], [document.getElementById("foto"), teknologi], [document.getElementById("bento"), bento]];
  const cek = () => { for (let i = tugas.length - 1; i >= 0; i--) if (tugas[i][0].getBoundingClientRect().top < innerHeight + 300) { const [, f] = tugas.splice(i, 1)[0]; f(); } if (!tugas.length) removeEventListener("scroll", cek); };
  const io = new IntersectionObserver(() => cek(), { rootMargin: "300px" });
  for (const [el] of tugas) io.observe(el);
  addEventListener("scroll", cek, { passive: true });
  new MutationObserver(() => dataPeta && bangunPeta()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("jm:bahasa", () => requestAnimationFrame(() => { cara(); jalur(); teknologi(); bento(); karbon(); dataPeta && siapPeta(); }));
}
