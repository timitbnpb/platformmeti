/* Bagian beranda di bawah lipatan: sensus per teknologi, halaman lain, cara data dibuat, akses data.
   Dirender saat mendekati layar (IntersectionObserver); angka dari public/data/*.json. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, galatHtml } from "/inti/umum.js";
import { muat, label } from "/publik.js";
import { muatMapLibre } from "/inti/maplibre.js";

const P = (d) => `<svg class="jm-ikon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const IKON = {
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
  "think-tank": P('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>'),
};
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "penyimpanan"];
const ORG = [["koperasi", "koperasi"], ["ormawa", "ormawa"], ["perguruan-tinggi", "perguruan-tinggi"], ["think-tank", "think-tank"]];

async function sensus(el) {
  const [pro, org] = await Promise.all([muat("proyek"), muat("organisasi")]);
  const tek = TEK.map((k) => [k, pro.baris.filter((p) => p.teknologi === k).length, "/proyek", label("beranda.tek.", k), "beranda.tek.n"]);
  const jenis = ORG.map(([k, kode]) => [k, org.baris.filter((o) => o.kategori?.kode === kode).length, "/direktori?tampil=lembaga", t("beranda.sensus.k." + k), "beranda.sensus.org"]);
  el.innerHTML = [...tek, ...jenis].filter((x) => x[1] > 0).map(([k, n, href, nama, unit]) => `<a class="jm-tile" href="${href}">${IKON[k]}<strong>${esc(nama)}</strong><span class="jm-ds-n">${esc(angka(n))}</span><small>${esc(t(unit))}</small></a>`).join("");
  document.getElementById("sensusSumber").textContent = t("beranda.sensus.sumber", { tanggal: tanggal(pro.dibangun_pada) });
}

const BENTO = [["rantai", "/rantai", false], ["pembiaya", "", true], ["batal", "", true], ["pakar", "/direktori?tampil=pakar", false], ["rapor", "", true], ["cakupan", "/tentang", false]];
const CARA = ["sumber", "est", "tanggal", "bukti"];

function statis() {
  document.getElementById("bento").innerHTML = BENTO.map(([k, href, segera]) => {
    const isi = `<strong>${esc(t("beranda.bento." + k))}</strong><span>${esc(t("beranda.bento." + k + ".d"))}</span>${segera ? `<span class="jm-pil jm-pil-est">${esc(t("beranda.segera"))}</span>` : ""}`;
    return href ? `<a class="jm-bento" href="${href}">${isi}</a>` : `<div class="jm-bento jm-bento-mati">${isi}</div>`;
  }).join("");
  document.getElementById("cara").innerHTML = CARA.map((k, i) => `<div class="jm-cara"><span class="jm-ds-kep">0${i + 1}</span><h3>${esc(t("beranda.cara." + k))}</h3><p>${esc(t("beranda.cara." + k + ".d"))}</p></div>`).join("");
}

const FOTO = [["surya-cirata", "surya", "PLTS terapung Cirata", "indonesiagoid", "domain publik"], ["bayu-sidrap", "bayu", "PLTB Sidrap", "USAID Indonesia", "domain publik"], ["panas-bumi-sibayak", "panas-bumi", "PLTP dekat Berastagi", "Kenrick95", "CC BY-SA 3.0"], ["hidro-saguling", "hidro", "PLTA Saguling", "NFarras", "CC BY-SA 4.0"]];
function foto() {
  document.getElementById("foto").innerHTML = FOTO.map(([f, k, , pembuat, lisensi]) => `<figure class="jm-foto"><img src="/img/beranda/${f}.webp" width="800" height="450" loading="lazy" alt="${esc(t("beranda.foto." + k))}"><figcaption><strong>${esc(t("beranda.foto." + k))}</strong><span>${esc(t("beranda.foto." + k + ".d"))}</span><small>${esc(t("beranda.foto.kredit", { pembuat, lisensi }))}</small></figcaption></figure>`).join("");
}

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
    <div class="jm-ds-viz"><h4>${esc(t("beranda.peta.tabel"))}</h4>${tabel.map((g) => row(g.nama, `${angka(g.jumlah_proyek)} ${t("beranda.tek.n")}, ${angka(g.kapasitas_mw)} MW`)).join("")}</div>
    <small class="jm-sumber">${esc(t("beranda.peta.s", { tanggal: tanggal(pro.dibangun_pada) }))}</small>`;
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
  } catch (e) { el.innerHTML = galatHtml("layanan"); }
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
      <div class="jm-ds-viz"><h4>${esc(t("beranda.karbon.tabel"))}</h4>${top.slice(0, 6).map((x, i) => row(`${i + 1}. ${x.nama.replace(/ power station$/i, "")}`, `${angka(x.emisi_tco2e / 1e6, { desimal: 1 })} Mt`)).join("")}</div>
      <blockquote class="jm-kutip">${esc(t("beranda.karbon.wawasan", { n: angka(top.length), pct: angka(pct, { desimal: 0 }), total: angka(p.length) }))}</blockquote>
      <small class="jm-sumber">${esc(t("beranda.karbon.s", { tanggal: tanggal(k.dibangun_pada), tahun: p[0].tahun }))}</small></div>${svg}`;
  } catch (e) { el.innerHTML = galatHtml("layanan"); }
}

/** Pasang pengamat: tiap bagian berat dirender sekali saat 300px dari layar. */
export function pasangBawah() {
  const sensusEl = document.getElementById("sensus");
  const ulang = () => { statis(); document.getElementById("karbon").childElementCount && karbon(); foto(); dataPeta && siapPeta(); if (sensusEl.dataset.siap) sensus(sensusEl).catch(() => { sensusEl.innerHTML = galatHtml("layanan"); }); };
  statis(); foto();
  const kEl = document.getElementById("karbon");
  const ioK = new IntersectionObserver((es) => { if (es.some((e) => (e.isIntersecting || e.boundingClientRect.top < 0))) { ioK.disconnect(); karbon(); } }, { rootMargin: "300px" });
  ioK.observe(kEl);
  const petaEl = document.getElementById("petaKartu");
  const ioPeta = new IntersectionObserver((es) => { if (es.some((e) => (e.isIntersecting || e.boundingClientRect.top < 0))) { ioPeta.disconnect(); bangunPeta(); } }, { rootMargin: "300px" });
  ioPeta.observe(petaEl);
  new MutationObserver(() => dataPeta && bangunPeta()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const io = new IntersectionObserver((es) => {
    for (const e of es) if ((e.isIntersecting || e.boundingClientRect.top < 0)) { io.disconnect(); sensusEl.dataset.siap = "1"; sensus(sensusEl).catch(() => { sensusEl.innerHTML = galatHtml("layanan"); }); }
  }, { rootMargin: "300px" });
  io.observe(sensusEl);
  document.addEventListener("jm:bahasa", () => requestAnimationFrame(ulang));
}
