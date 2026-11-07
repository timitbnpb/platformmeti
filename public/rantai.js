/* /rantai: kebutuhan PLTS 100 GWp per tahun vs kapasitas 40 pabrikan modul (ESDM DJEBTKE). Data statis /data/rantai_plts.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { nanti, esc, hantuHtml, debounce } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml } from "/inti/komponen.js";
import { t, tanggal } from "/i18n.js";
import { muatData, tampilGalat, sumberLipat, kartuHtml, batangHtml, pasangBar, temuanHtml, pil, num, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const KELAS = { lokal: "jm-an-b1", ekspor: "jm-an-b2", keduanya: "jm-an-b4" };
const WARNA = { lokal: "--data1", ekspor: "--data3", keduanya: "--data4" };
let d = null, horizon = 10, urut = { k: "mwp", arah: -1 }, cari = "", fPasar = "", fApamsi = "", fBin = null;
let mPasar = "", mApamsi = "", sel = null, urutKota = { k: "mwp", arah: -1 };
let peta = null, petaSiap = false, grup = [], markah = [];

const gw = (mwp) => mwp / 1000;
const sumberTabel = () => ({ sumber: d.sumber.judul, tanggal: d.sumber.tanggal });
const sumberProgram = () => ({ sumber: d.program.sumber, tanggal: d.program.tanggal_sumber });
const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const butuh = () => d.program.target_gwp / horizon;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const tautOrg = (x) => `<a href="/direktori#${esc(x.id)}">${esc(x.nama)}</a>`;

function jawab() {
  const r = d.ringkas, b = butuh(), lokal = gw(r.lokal_mwp);
  $("jawab").textContent = t("rt.jawab", { butuh: num(b, 1), n: horizon, lokal: num(lokal, 1), persen: num((lokal / b) * 100, 0), total: num(gw(r.total_mwp), 1), ekspor: num(gw(r.ekspor_mwp), 1) });
}

function kartu() {
  const r = d.ringkas, tk = d.pabrikan.filter((x) => x.tkdn != null).map((x) => x.tkdn), ap = d.pabrikan.filter((x) => x.apamsi).length;
  $("kartu").innerHTML =
    kartuHtml({ judul: t("rt.k.total"), nilai: num(gw(r.total_mwp), 1), satuan: t("rt.gwp_tahun"), turunan: true, penyebut: t("an.n_dari", { n: r.pabrikan - r.tanpa_kapasitas, total: r.pabrikan }), sumber: sumberLipat([sumberTabel()]) }) +
    kartuHtml({ judul: t("rt.k.ekspor"), nilai: num(gw(r.ekspor_mwp), 1), satuan: t("rt.gwp_tahun"), turunan: true, penyebut: t("rt.k.ekspor_cat", { gw: num(gw(r.keduanya_mwp), 1) }), sumber: sumberLipat([sumberTabel()]) }) +
    kartuHtml({ judul: t("rt.k.program"), nilai: num(d.program.tahap_awal_gwp, 1), satuan: "GWp", penyebut: t("rt.k.program_cat", { n: d.program.tahap_awal_proyek, target: d.program.target_gwp }), sumber: sumberLipat([sumberProgram()]) }) +
    kartuHtml({ judul: t("rt.k.tkdn"), nilai: num(median(tk), 1), satuan: "%", turunan: true, penyebut: t("an.n_dari", { n: tk.length, total: r.pabrikan }) + " | " + t("rt.k.apamsi", { n: ap }), sumber: sumberLipat([sumberTabel()]) });
}

const legendaPasar = () => ["lokal", "ekspor", "keduanya"].map((k) => `<span class="jm-an-sw ${KELAS[k]}"></span>${esc(t("rt.pasar." + k))}`).join(" ");

function grafikKebutuhan() {
  const r = d.ringkas, b = butuh(), lokal = gw(r.lokal_mwp);
  $("temuan-keb").innerHTML = temuanHtml(t("rt.t.keb", { lokal: num(lokal, 1), persen: num((lokal / b) * 100, 0), butuh: num(b, 1) }));
  const baris = [
    { label: t("rt.b.butuh"), bagian: [{ nilai: b, kelas: "jm-an-b3" }], teks: num(b, 1) + " GWp" },
    { label: t("rt.b.total"), bagian: [{ nilai: lokal, kelas: "jm-an-b1" }, { nilai: gw(r.ekspor_mwp), kelas: "jm-an-b2" }], teks: num(gw(r.total_mwp), 1) + " GWp" },
    { label: t("rt.b.lokal"), bagian: [{ nilai: lokal, kelas: "jm-an-b1" }], teks: num(lokal, 1) + " GWp" },
  ];
  $("grafik-keb").innerHTML = `${batangHtml(baris, { ref: b, label: t("rt.b.label") })}
    <p class="jm-an-kunci"><span class="jm-an-sw jm-an-b1"></span>${esc(t("rt.lokal"))} <span class="jm-an-sw jm-an-b2"></span>${esc(t("rt.ekspor"))} <span class="jm-an-sw jm-an-garis-sw"></span>${esc(t("rt.garis"))}</p>
    <p class="jm-bantu">${pil("an.hipotesis")} ${esc(t("rt.horizon_cat", { target: d.program.target_gwp, n: horizon }))}</p>${sumberLipat([sumberTabel(), sumberProgram()])}`;
  pasangBar($("grafik-keb"));
}

const BIN = [[0, 30], [30, 40], [40, 45], [45, 50], [50, 101]];
const labelBin = ([a, b]) => (a === 0 ? t("rt.bin_lt", { b }) : b === 101 ? t("rt.bin_ge", { a }) : t("rt.bin", { a, b }));
function grafikTkdn() {
  const v = d.pabrikan.map((x) => x.tkdn), isi = v.filter((x) => x != null);
  const baris = BIN.map((b, i) => ({ id: String(i), label: labelBin(b), n: isi.filter((x) => x >= b[0] && x < b[1]).length }));
  baris.push({ id: "x", label: t("an.tanpa_data"), n: v.length - isi.length });
  $("temuan-tkdn").innerHTML = temuanHtml(t("rt.t.tkdn", { med: num(median(isi), 1), n: isi.length, k: isi.filter((x) => x < 40).length }));
  $("grafik-tkdn").innerHTML = batangHtml(baris.map((x) => ({ id: x.id, pilih: fBin === x.id, label: x.label, bagian: [{ nilai: x.n, kelas: "jm-an-b1" }], teks: t("rt.n_pabrikan", { n: x.n }) })), { maks: Math.max(...baris.map((x) => x.n)), label: t("rt.tkdn"), aksi: true }) +
    `<p class="jm-bantu">${esc(t("rt.tkdn_klik"))} ${esc(t("an.n_dari", { n: isi.length, total: v.length }))}</p>${sumberLipat([sumberTabel()])}`;
  pasangBar($("grafik-tkdn"));
}

/* ---------- peta interaktif ---------- */

function kelompok() {
  const koor = new Map(d.kota.map((k) => [k.kota, k]));
  const m = new Map();
  for (const x of d.pabrikan) {
    if (!x.kota || !koor.has(x.kota)) continue;
    if (mPasar && x.pasar !== mPasar) continue;
    if (mApamsi && (mApamsi === "ya") !== !!x.apamsi) continue;
    const g = m.get(x.kota) || m.set(x.kota, { kota: x.kota, lat: koor.get(x.kota).lat, lng: koor.get(x.kota).lng, pabrik: [], mwp: 0, per: { lokal: 0, ekspor: 0, keduanya: 0 } }).get(x.kota);
    g.pabrik.push(x); g.mwp += x.mwp || 0; g.per[x.pasar] += (x.mwp || 0) + 0.001;
  }
  for (const g of m.values()) g.dom = Object.entries(g.per).sort((a, b) => b[1] - a[1])[0][0];
  return [...m.values()];
}

function geojson() {
  return { type: "FeatureCollection", features: grup.map((g) => ({ type: "Feature", geometry: { type: "Point", coordinates: [g.lng, g.lat] }, properties: { kota: g.kota, mwp: Math.max(g.mwp, 5), n: g.pabrik.length, dom: g.dom } })) };
}

function gayaBulat() {
  const mk = Math.sqrt(Math.max(5, ...grup.map((g) => g.mwp)));
  return {
    "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "mwp"]], 0, 5, mk, 26],
    "circle-color": ["match", ["get", "dom"], "lokal", warna(WARNA.lokal), "ekspor", warna(WARNA.ekspor), warna(WARNA.keduanya)],
    "circle-opacity": 0.82,
    "circle-stroke-width": ["case", ["==", ["get", "kota"], sel || ""], 4, 1.5],
    "circle-stroke-color": ["case", ["==", ["get", "kota"], sel || ""], warna("--head"), warna("--paper")],
  };
}

function warnai() {
  if (!petaSiap) return;
  for (const [k, v] of Object.entries(gayaBulat())) peta.setPaintProperty("kota-bulat", k, v);
  peta.setPaintProperty("latar", "background-color", warna("--surface"));
  peta.setPaintProperty("prov-isi", "fill-color", warna("--card"));
  peta.setPaintProperty("prov-garis", "line-color", warna("--line-ctl"));
}

function labelMarkah() {
  for (const m of markah) m.remove();
  markah = [];
  if (!petaSiap) return;
  const top = new Set([...grup].sort((a, b) => b.mwp - a.mwp).slice(0, 5).map((g) => g.kota));
  for (const g of grup) {
    const el = document.createElement("span");
    el.className = "jm-peta-lbl" + (top.has(g.kota) ? " jm-top" : "");
    el.textContent = g.kota;
    markah.push(new maplibregl.Marker({ element: el, anchor: "top", offset: [0, 14] }).setLngLat([g.lng, g.lat]).addTo(peta));
  }
}

function petaPerbarui() {
  grup = kelompok();
  if (sel && !grup.some((g) => g.kota === sel)) sel = null;
  kotaTeks(); tabelKota(); panel();
  if (petaSiap) { peta.getSource("kota").setData(geojson()); warnai(); labelMarkah(); }
}

function kotaTeks() {
  const tot = grup.reduce((s, g) => s + g.mwp, 0), a = [...grup].sort((x, y) => y.mwp - x.mwp)[0];
  $("temuan-peta").innerHTML = a ? temuanHtml(t("rt.t.peta", { kota: a.kota, persen: num((a.mwp / (tot || 1)) * 100, 0), gw: num(gw(a.mwp), 1), total: num(gw(tot), 1) })) : esc(t("an.tanpa_data"));
  $("legenda-peta").innerHTML = `${legendaPasar()} <span class="jm-bantu">${esc(t("rt.legenda_peta"))}</span>`;
  $("sumber-peta").innerHTML = `<p class="jm-bantu">${esc(t("rt.peta_cat"))}</p>${sumberLipat([sumberTabel()])}`;
}

function panel() {
  const g = grup.find((x) => x.kota === sel);
  if (!g) { $("kota-panel").innerHTML = `<h3>${esc(t("rt.panel_judul"))}</h3><p class="jm-bantu">${esc(t("rt.panel_awal"))}</p>`; return; }
  $("kota-panel").innerHTML = `<div class="jm-panel-kepala"><h3>${esc(g.kota)}</h3><button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="tutup">${esc(t("jm.tutup"))}</button></div>
    <p class="jm-bantu">${esc(t("rt.panel_ringkas", { mwp: num(g.mwp), n: g.pabrik.length }))}</p>
    <ul class="jm-panel-daftar">${[...g.pabrik].sort((a, b) => (b.mwp ?? -1) - (a.mwp ?? -1)).map((x) => `<li>${tautOrg(x)}<small>${esc(x.mwp == null ? "-" : num(x.mwp))} MWp, ${esc(t("rt.pasar." + x.pasar))}, TKDN ${esc(x.tkdn == null ? "-" : num(x.tkdn, 2) + "%")}, APAMSI ${esc(x.apamsi ? t("rt.ya") : t("rt.tidak"))}</small></li>`).join("")}</ul>`;
}

function pilihKota(k, terbang = true) {
  sel = sel === k ? sel : k;
  panel(); tabelKota();
  if (!petaSiap) return;
  warnai();
  const g = grup.find((x) => x.kota === k);
  if (g && terbang) peta.flyTo({ center: [g.lng, g.lat], zoom: Math.max(peta.getZoom(), 8), duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 800 });
}

function tutupKota() {
  sel = null; panel(); tabelKota();
  if (petaSiap) { warnai(); peta.fitBounds([[94.5, -11.5], [141.5, 6.5]], { padding: 8 }); }
}

async function bukaPeta() {
  if (peta) return;
  let geo;
  try { geo = await (await fetch("/geo/provinsi.json", { credentials: "same-origin" })).json(); await muatMapLibre(); } catch (e) { $("peta-pabrik").innerHTML = `<p class="jm-bantu">${esc(t("wl.peta_gagal"))}</p>`; return; }
  peta = new maplibregl.Map({
    container: "peta-pabrik", attributionControl: false, dragRotate: false, pitchWithRotate: false, cooperativeGestures: true,
    locale: { "CooperativeGesturesHandler.WindowsHelpText": t("wl.gesture.win"), "CooperativeGesturesHandler.MacHelpText": t("wl.gesture.mac"), "CooperativeGesturesHandler.MobileHelpText": t("wl.gesture.mobile") },
    style: { version: 8, sources: { prov: { type: "geojson", data: geo }, kota: { type: "geojson", data: geojson() } }, layers: [
      { id: "latar", type: "background", paint: { "background-color": warna("--surface") } },
      { id: "prov-isi", type: "fill", source: "prov", paint: { "fill-color": warna("--card") } },
      { id: "prov-garis", type: "line", source: "prov", paint: { "line-color": warna("--line-ctl"), "line-width": 0.5 } },
      { id: "kota-bulat", type: "circle", source: "kota", paint: gayaBulat() },
    ] },
    bounds: [[94.5, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: 8 },
  });
  peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const info = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
  peta.on("load", () => { petaSiap = true; labelMarkah(); warnai(); });
  peta.on("mousemove", "kota-bulat", (e) => {
    const f = e.features[0]; if (!f) return;
    peta.getCanvas().classList.add("jm-an-tunjuk");
    info.setLngLat(f.geometry.coordinates).setHTML(`<strong>${esc(f.properties.kota)}</strong><br>${esc(num(f.properties.mwp))} MWp, ${esc(t("rt.n_pabrik", { n: f.properties.n }))}`).addTo(peta);
  });
  peta.on("mouseleave", "kota-bulat", () => { peta.getCanvas().classList.remove("jm-an-tunjuk"); info.remove(); });
  peta.on("click", "kota-bulat", (e) => { const k = e.features[0]?.properties.kota; if (k) pilihKota(k, false); });
  peta.on("zoom", () => $("peta-pabrik").classList.toggle("jm-lbl-semua", peta.getZoom() >= 6));
  new MutationObserver(warnai).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", warnai);
}

function tabelKota() {
  const B = [...grup].sort((a, b) => {
    const k = urutKota.k, x = k === "kota" ? a.kota : k === "n" ? a.pabrik.length : a.mwp, y = k === "kota" ? b.kota : k === "n" ? b.pabrik.length : b.mwp;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * urutKota.arah || a.kota.localeCompare(b.kota);
  });
  const th = [["kota", "rt.col.kota"], ["n", "rt.col.n"], ["mwp", "rt.col.mwp"]].map(([k, kk]) => `<th aria-sort="${urutKota.k === k ? (urutKota.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-kk="${k}">${esc(t(kk))}</button></th>`).join("") + `<th>${esc(t("rt.col.pasar"))}</th>`;
  $("tabel-kota").innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${th}</tr></thead><tbody>${B.map((g) => `<tr${g.kota === sel ? ' class="jm-baris-pilih"' : ""}>
    <td data-label="${esc(t("rt.col.kota"))}"><button type="button" class="jm-an-kotabtn" data-kota="${esc(g.kota)}" aria-pressed="${g.kota === sel}">${esc(g.kota)}</button></td>
    <td data-label="${esc(t("rt.col.n"))}">${num(g.pabrik.length)}</td><td data-label="${esc(t("rt.col.mwp"))}" class="jm-num">${esc(num(g.mwp))}</td>
    <td data-label="${esc(t("rt.col.pasar"))}">${esc(t("rt.pasar." + g.dom))}</td></tr>`).join("")}</tbody></table></div>`;
}

/* ---------- tabel pabrikan ---------- */
const KOL = [["nama", "rt.col.nama"], ["kota", "rt.col.lokasi"], ["mwp", "rt.col.mwp"], ["pasar", "rt.col.pasar"], ["apamsi", "rt.col.apamsi"], ["tkdn", "rt.col.tkdn"], ["bmp", "rt.col.bmp"]];

function saringRender() {
  $("saring").innerHTML = cariHtml({ id: "cari", label: t("rt.cari") }) +
    pilihHtml({ id: "f-pasar", ikon: "jenis", label: t("rt.f_pasar"), nilai: fPasar, opsi: [["", t("rt.f_pasar") + ": " + t("rt.semua")], ["lokal", t("rt.pasar.lokal")], ["ekspor", t("rt.pasar.ekspor")], ["keduanya", t("rt.pasar.keduanya")]] }) +
    pilihHtml({ id: "f-apamsi", ikon: "status", label: t("rt.f_apamsi"), nilai: fApamsi, opsi: [["", t("rt.f_apamsi") + ": " + t("rt.semua")], ["ya", t("rt.ya")], ["tidak", t("rt.tidak")]] }) +
    pilihHtml({ id: "urut", ikon: "tabel", label: t("rt.urut"), nilai: urut.k, opsi: [["mwp", t("rt.urut") + ": " + t("rt.col.mwp")], ["nama", t("rt.urut") + ": " + t("rt.col.nama")], ["tkdn", t("rt.urut") + ": " + t("rt.col.tkdn")]] }) +
    hapusHtml({ id: "hapus", label: t("jm.kosong.reset") }) + hitungHtml({ id: "hitung", teks: "" });
  $("cari").value = cari;
}

function tabel() {
  const q = cari.trim().toLowerCase();
  const bin = fBin === null ? null : fBin === "x" ? "x" : BIN[+fBin];
  const B = d.pabrikan.filter((x) => (!q || (x.nama + " " + (x.kota || "") + " " + (x.provinsi || "")).toLowerCase().includes(q)) && (!fPasar || x.pasar === fPasar) && (!fApamsi || (fApamsi === "ya") === !!x.apamsi) &&
    (bin === null || (bin === "x" ? x.tkdn == null : x.tkdn != null && x.tkdn >= bin[0] && x.tkdn < bin[1])));
  B.sort((a, b) => {
    const x = a[urut.k], y = b[urut.k];
    if (x == null && y == null) return a.nama.localeCompare(b.nama);
    if (x == null) return 1; if (y == null) return -1;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * urut.arah || a.nama.localeCompare(b.nama);
  });
  const ap = d.pabrikan.filter((x) => x.apamsi).length;
  $("temuan-tabel").innerHTML = temuanHtml(t("rt.t.tabel", { n: d.pabrikan.length, ap, k: d.ringkas.tanpa_kapasitas }), false);
  $("hitung").textContent = t("rt.info", { n: B.length, total: d.pabrikan.length });
  $("hapus").hidden = !(fBin !== null || cari || fPasar || fApamsi);
  $("hapus").title = fBin !== null ? t("rt.hapus_bin", { bin: fBin === "x" ? t("an.tanpa_data") : labelBin(BIN[+fBin]) }) : "";
  if (!B.length) { $("tabel").innerHTML = `<div class="jm-kosong"><p>${esc(t("jm.kosong.cocok"))}</p></div>`; return; }
  const th = KOL.map(([k, kunci]) => `<th aria-sort="${urut.k === k ? (urut.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-k="${k}">${esc(t(kunci))}</button></th>`).join("");
  $("tabel").innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${th}</tr></thead><tbody>${B.map((x) => `<tr>
    <td data-label="${esc(t("rt.col.nama"))}">${tautOrg(x)}</td>
    <td data-label="${esc(t("rt.col.lokasi"))}">${esc([x.kota, x.provinsi].filter(Boolean).join(", ") || "-")}</td>
    <td data-label="${esc(t("rt.col.mwp"))}" class="jm-num">${esc(x.mwp == null ? "-" : num(x.mwp))}</td>
    <td data-label="${esc(t("rt.col.pasar"))}">${esc(t("rt.pasar." + x.pasar))}</td>
    <td data-label="${esc(t("rt.col.apamsi"))}">${esc(x.apamsi ? t("rt.ya") : t("rt.tidak"))}</td>
    <td data-label="${esc(t("rt.col.tkdn"))}" class="jm-num">${esc(x.tkdn == null ? "-" : num(x.tkdn, 2))}</td>
    <td data-label="${esc(t("rt.col.bmp"))}" class="jm-num">${esc(x.bmp == null ? "-" : num(x.bmp, 2))}</td></tr>`).join("")}</tbody></table></div>${sumberLipat([sumberTabel()])}`;
}

function cara() {
  $("cara").innerHTML = `<p>${esc(t("rt.cara1", { target: d.program.target_gwp }))}</p><p>${esc(t("rt.cara2"))}</p><p>${esc(t("rt.cara3"))}</p><p>${esc(t("rt.cara4"))}</p><p>${esc(t("rt.cara5"))}</p>`;
  $("kutip").textContent = t("rt.kutip", { tanggal: tanggal(d.dibangun_pada, { gaya: "panjang" }) });
}

function gambarSemua() { jawab(); kartu(); grafikKebutuhan(); grafikTkdn(); petaPerbarui(); saringRender(); tabel(); cara(); }

function segSync(seg, b) { for (const x of seg.children) x.setAttribute("aria-selected", String(x === b)); }

function pasang() {
  document.querySelector("[data-h]").parentElement.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-h]");
    if (!b || +b.dataset.h === horizon) return;
    segSync(b.parentElement, b); horizon = +b.dataset.h;
    nanti(() => { jawab(); grafikKebutuhan(); });
  });
  $("seg-pasar").addEventListener("click", (e) => { const b = e.target.closest("button[data-p]"); if (!b || b.dataset.p === mPasar) return; segSync($("seg-pasar"), b); mPasar = b.dataset.p; nanti(petaPerbarui); });
  $("seg-apamsi").addEventListener("click", (e) => { const b = e.target.closest("button[data-a]"); if (!b || b.dataset.a === mApamsi) return; segSync($("seg-apamsi"), b); mApamsi = b.dataset.a; nanti(petaPerbarui); });
  $("kota-panel").addEventListener("click", (e) => { if (e.target.closest("[data-aksi=tutup]")) nanti(tutupKota); });
  $("tabel-kota").addEventListener("click", (e) => {
    const k = e.target.closest("button[data-kota]"), s = e.target.closest("button[data-kk]");
    if (k) { for (const x of $("tabel-kota").querySelectorAll("[data-kota]")) x.setAttribute("aria-pressed", String(x === k)); nanti(() => pilihKota(k.dataset.kota)); }
    else if (s) { const kk = s.dataset.kk; urutKota = urutKota.k === kk ? { k: kk, arah: -urutKota.arah } : { k: kk, arah: kk === "kota" ? 1 : -1 }; nanti(tabelKota); }
  });
  $("grafik-tkdn").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]"); if (!b) return;
    fBin = fBin === b.dataset.id ? null : b.dataset.id;
    for (const x of $("grafik-tkdn").querySelectorAll("button[data-id]")) x.setAttribute("aria-pressed", String(x.dataset.id === fBin));
    nanti(tabel);
  });
  $("saring").addEventListener("input", debounce((e) => { if (e.target.id === "cari") { cari = e.target.value; tabel(); } }));
  $("saring").addEventListener("change", (e) => {
    const id = e.target.id;
    if (id === "f-pasar") fPasar = e.target.value; else if (id === "f-apamsi") fApamsi = e.target.value;
    else if (id === "urut") urut = { k: e.target.value, arah: e.target.value === "nama" ? 1 : -1 }; else return;
    nanti(tabel);
  });
  $("saring").addEventListener("click", (e) => {
    if (!e.target.closest("#hapus")) return;
    cari = ""; fPasar = ""; fApamsi = ""; fBin = null;
    for (const x of $("grafik-tkdn").querySelectorAll("button[data-id]")) x.setAttribute("aria-pressed", "false");
    nanti(() => { saringRender(); tabel(); });
  });
  $("tabel").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    const k = b.dataset.k;
    urut = urut.k === k ? { k, arah: -urut.arah } : { k, arah: k === "nama" || k === "kota" ? 1 : -1 };
    for (const th of b.closest("tr").children) th.setAttribute("aria-sort", th === b.parentElement ? (urut.arah > 0 ? "ascending" : "descending") : "none");
    if ($("urut") && [...$("urut").options].some((o) => o.value === k)) $("urut").value = k;
    nanti(tabel);
  });
  // peta dimuat malas saat mendekati layar
  const el = $("peta-pabrik");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((a) => { if (a.some((x) => x.isIntersecting)) { io.disconnect(); nanti(bukaPeta); } }, { rootMargin: "300px" });
    io.observe(el);
  } else nanti(bukaPeta);
}

async function mulai() {
  await mulaiHalaman();
  $("kartu").innerHTML = hantuHtml(2);
  try { d = await muatData("rantai_plts.json"); } catch (e) { tampilGalat($("kartu"), mulai); return; }
  gambarSemua(); pasang();
  saatBahasa(gambarSemua);
}
mulai();
