/* /rantai: kebutuhan PLTS 100 GWp per tahun vs kapasitas 40 pabrikan modul (ESDM DJEBTKE). Data statis /data/rantai_plts.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { muatData, tampilGalat, sumberHtml, kartuHtml, batangSvg, pil, num, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
let d = null, horizon = 10, urut = { k: "mwp", arah: -1 }, cari = "", fPasar = "", fApamsi = "", jalurPeta = null;

const gw = (mwp) => mwp / 1000;
const sumberTabel = () => ({ sumber: d.sumber.judul, tanggal: d.sumber.tanggal });
const sumberProgram = () => ({ sumber: d.program.sumber, tanggal: d.program.tanggal_sumber });
const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const butuh = () => d.program.target_gwp / horizon;

function jawab() {
  const r = d.ringkas, b = butuh(), lokal = gw(r.lokal_mwp);
  $("jawab").textContent = t("rt.jawab", { butuh: num(b, 1), n: horizon, lokal: num(lokal, 1), persen: num((lokal / b) * 100, 0), total: num(gw(r.total_mwp), 1), ekspor: num(gw(r.ekspor_mwp), 1) });
}

function kartu() {
  const r = d.ringkas, tk = d.pabrikan.filter((x) => x.tkdn != null).map((x) => x.tkdn), ap = d.pabrikan.filter((x) => x.apamsi).length;
  $("kartu").innerHTML =
    kartuHtml({ judul: t("rt.k.total"), nilai: num(gw(r.total_mwp), 1), satuan: t("rt.gwp_tahun"), turunan: true, penyebut: t("an.n_dari", { n: r.pabrikan - r.tanpa_kapasitas, total: r.pabrikan }), sumber: sumberHtml(sumberTabel()) }) +
    kartuHtml({ judul: t("rt.k.ekspor"), nilai: num(gw(r.ekspor_mwp), 1), satuan: t("rt.gwp_tahun"), turunan: true, penyebut: t("rt.k.ekspor_cat", { gw: num(gw(r.keduanya_mwp), 1) }), sumber: sumberHtml(sumberTabel()) }) +
    kartuHtml({ judul: t("rt.k.program"), nilai: num(d.program.tahap_awal_gwp, 1), satuan: "GWp", penyebut: t("rt.k.program_cat", { n: d.program.tahap_awal_proyek, target: d.program.target_gwp }), sumber: sumberHtml(sumberProgram()) }) +
    kartuHtml({ judul: t("rt.k.tkdn"), nilai: num(median(tk), 1), satuan: "%", turunan: true, penyebut: t("an.n_dari", { n: tk.length, total: r.pabrikan }) + " | " + t("rt.k.apamsi", { n: ap }), sumber: sumberHtml(sumberTabel()) });
}

function grafikKebutuhan() {
  const r = d.ringkas, b = butuh();
  const baris = [
    { label: t("rt.b.butuh"), bagian: [{ nilai: b, kelas: "jm-an-b3" }], teks: num(b, 1) + " GWp" },
    { label: t("rt.b.total"), bagian: [{ nilai: gw(r.lokal_mwp), kelas: "jm-an-b1" }, { nilai: gw(r.ekspor_mwp), kelas: "jm-an-b2" }], teks: num(gw(r.total_mwp), 1) + " GWp" },
    { label: t("rt.b.lokal"), bagian: [{ nilai: gw(r.lokal_mwp), kelas: "jm-an-b1" }], teks: num(gw(r.lokal_mwp), 1) + " GWp" },
  ];
  $("grafik-keb").innerHTML = `<p class="jm-bantu">${pil("an.est")} ${pil("an.hipotesis")} ${esc(t("rt.horizon_cat", { target: d.program.target_gwp, n: horizon }))}</p>${batangSvg(baris, { label: t("rt.b.label") })}
    <p class="jm-an-kunci"><span class="jm-an-sw jm-an-b1"></span>${esc(t("rt.lokal"))} <span class="jm-an-sw jm-an-b2"></span>${esc(t("rt.ekspor"))} <span class="jm-an-sw jm-an-b3"></span>${esc(t("rt.butuh"))}</p>
    ${sumberHtml(sumberTabel())}${sumberHtml(sumberProgram())}`;
}

const BIN = [[0, 30], [30, 40], [40, 45], [45, 50], [50, 101]];
function grafikTkdn() {
  const v = d.pabrikan.map((x) => x.tkdn), isi = v.filter((x) => x != null);
  const baris = BIN.map(([a, b]) => ({ label: a === 0 ? t("rt.bin_lt", { b }) : b === 101 ? t("rt.bin_ge", { a }) : t("rt.bin", { a, b }), n: isi.filter((x) => x >= a && x < b).length }));
  baris.push({ label: t("an.tanpa_data"), n: v.length - isi.length });
  $("grafik-tkdn").innerHTML = batangSvg(baris.map((x) => ({ label: x.label, bagian: [{ nilai: x.n, kelas: "jm-an-b1" }], teks: num(x.n) })), { maks: Math.max(...baris.map((x) => x.n)), label: t("rt.tkdn") }) +
    `<p class="jm-bantu">${esc(t("an.n_dari", { n: isi.length, total: v.length }))}</p>${sumberHtml(sumberTabel())}`;
}

/* ---------- peta pabrik (SVG dari batas provinsi) ---------- */
const S = 20, X0 = 94.5, Y0 = 6.5;
const proj = ([lng, lat]) => [Math.round((lng - X0) * S), Math.round((Y0 - lat) * S)];
function jalur(geo) {
  const out = [];
  for (const f of geo.features) for (const poli of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) for (const ring of poli) {
    let prev = "", s = "";
    ring.forEach((c, i) => { const [x, y] = proj(c), k = x + "," + y; if (k !== prev) { s += (i ? "L" : "M") + k; prev = k; } });
    out.push(s + "Z");
  }
  return out.join("");
}
async function petaPabrik() {
  try { jalurPeta ??= jalur(await (await fetch("/geo/provinsi.json", { credentials: "same-origin" })).json()); } catch (e) { $("peta-pabrik").innerHTML = `<p class="jm-bantu">${esc(t("wl.peta_gagal"))}</p>`; return; }
  const maks = Math.max(...d.kota.map((k) => k.mwp));
  const titik = d.kota.map((k) => { const [x, y] = proj([k.lng, k.lat]); return `<circle class="jm-an-titik" cx="${x}" cy="${y}" r="${(4 + 14 * Math.sqrt(k.mwp / maks)).toFixed(1)}"><title>${esc(k.kota)}: ${esc(num(k.mwp))} MWp, ${esc(t("rt.n_pabrik", { n: k.pabrik }))}</title></circle>`; }).join("");
  $("peta-pabrik").innerHTML = `<svg class="jm-an-peta-svg" viewBox="0 0 ${Math.round(47 * S)} ${Math.round(18 * S)}" role="img" aria-label="${esc(t("rt.peta_label"))}" focusable="false"><path class="jm-an-prov" d="${jalurPeta}"/>${titik}</svg>
    <ul class="jm-an-daftar jm-an-kota">${[...d.kota].sort((a, b) => b.mwp - a.mwp).map((k) => `<li>${esc(k.kota)}: <b>${esc(num(k.mwp))}</b> MWp, ${esc(t("rt.n_pabrik", { n: k.pabrik }))}</li>`).join("")}</ul>
    <p class="jm-bantu">${esc(t("rt.peta_cat"))}</p>${sumberHtml(sumberTabel())}`;
}

/* ---------- tabel ---------- */
const KOL = [["nama", "rt.col.nama"], ["kota", "rt.col.lokasi"], ["mwp", "rt.col.mwp"], ["pasar", "rt.col.pasar"], ["apamsi", "rt.col.apamsi"], ["tkdn", "rt.col.tkdn"], ["bmp", "rt.col.bmp"]];
const nilaiUrut = (x, k) => (k === "kota" ? x.kota : x[k]);

function tabel() {
  const q = cari.trim().toLowerCase();
  let B = d.pabrikan.filter((x) => (!q || (x.nama + " " + (x.kota || "") + " " + (x.provinsi || "")).toLowerCase().includes(q)) && (!fPasar || x.pasar === fPasar) && (!fApamsi || (fApamsi === "ya") === !!x.apamsi));
  B.sort((a, b) => {
    const x = nilaiUrut(a, urut.k), y = nilaiUrut(b, urut.k);
    if (x == null && y == null) return a.nama.localeCompare(b.nama);
    if (x == null) return 1; if (y == null) return -1;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * urut.arah || a.nama.localeCompare(b.nama);
  });
  $("tabel-info").textContent = t("rt.info", { n: B.length, total: d.pabrikan.length });
  if (!B.length) { $("tabel").innerHTML = `<div class="jm-kosong"><p>${esc(t("jm.kosong.cocok"))}</p></div>`; return; }
  const th = KOL.map(([k, kunci]) => `<th aria-sort="${urut.k === k ? (urut.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-an-urut" data-k="${k}">${esc(t(kunci))}</button></th>`).join("");
  $("tabel").innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${th}</tr></thead><tbody>${B.map((x) => `<tr>
    <td data-l="${esc(t("rt.col.nama"))}">${esc(x.nama)}</td>
    <td data-l="${esc(t("rt.col.lokasi"))}">${esc([x.kota, x.provinsi].filter(Boolean).join(", ") || "-")}</td>
    <td data-l="${esc(t("rt.col.mwp"))}" class="jm-nowrap">${esc(x.mwp == null ? "-" : num(x.mwp))}</td>
    <td data-l="${esc(t("rt.col.pasar"))}">${esc(t("rt.pasar." + x.pasar))}</td>
    <td data-l="${esc(t("rt.col.apamsi"))}">${esc(x.apamsi ? t("rt.ya") : t("rt.tidak"))}</td>
    <td data-l="${esc(t("rt.col.tkdn"))}" class="jm-nowrap">${esc(x.tkdn == null ? "-" : num(x.tkdn, 2))}</td>
    <td data-l="${esc(t("rt.col.bmp"))}" class="jm-nowrap">${esc(x.bmp == null ? "-" : num(x.bmp, 2))}</td></tr>`).join("")}</tbody></table></div>${sumberHtml(sumberTabel())}`;
}

function cara() {
  $("cara").innerHTML = `<p>${esc(t("rt.cara1", { target: d.program.target_gwp }))}</p><p>${esc(t("rt.cara2"))}</p><p>${esc(t("rt.cara3"))}</p><p>${esc(t("rt.cara4"))}</p><p>${esc(t("rt.cara5"))}</p>`;
  $("kutip").textContent = t("rt.kutip", { tanggal: tanggal(d.dibangun_pada, { gaya: "panjang" }) });
}

function gambarSemua() { jawab(); kartu(); grafikKebutuhan(); grafikTkdn(); tabel(); cara(); nanti(petaPabrik); }

function pasang() {
  document.querySelector(".jm-an-sakelar").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-h]");
    if (!b || +b.dataset.h === horizon) return;
    for (const x of b.parentElement.children) x.setAttribute("aria-pressed", String(x === b));
    horizon = +b.dataset.h;
    nanti(() => { jawab(); grafikKebutuhan(); });
  });
  $("cari").addEventListener("input", debounce((e) => { cari = e.target.value; tabel(); }));
  $("f-pasar").addEventListener("change", (e) => { fPasar = e.target.value; nanti(tabel); });
  $("f-apamsi").addEventListener("change", (e) => { fApamsi = e.target.value; nanti(tabel); });
  $("urut").addEventListener("change", (e) => { urut = { k: e.target.value, arah: e.target.value === "nama" ? 1 : -1 }; nanti(tabel); });
  $("tabel").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    const k = b.dataset.k;
    urut = urut.k === k ? { k, arah: -urut.arah } : { k, arah: k === "nama" || k === "kota" ? 1 : -1 };
    for (const th of b.closest("tr").children) th.setAttribute("aria-sort", th === b.parentElement ? (urut.arah > 0 ? "ascending" : "descending") : "none"); // chrome urgent
    if ([...$("urut").options].some((o) => o.value === k)) $("urut").value = k;
    nanti(tabel);
  });
}

async function mulai() {
  await mulaiHalaman();
  $("kartu").innerHTML = hantuHtml(2);
  try { d = await muatData("rantai_plts.json"); } catch (e) { tampilGalat($("kartu"), mulai); return; }
  gambarSemua(); pasang();
  saatBahasa(gambarSemua);
}
mulai();
