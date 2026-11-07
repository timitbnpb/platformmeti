/* /wilayah: peta koroplet 38 provinsi + profil provinsi (?prov=XX). Data statis /data/wilayah.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { nanti, esc, hantuHtml } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { muatData, tampilGalat, sumberHtml, sumberLipat, kartuHtml, batangHtml, pasangBar, temuanHtml, heroVisual, ubinHtml, pil, teksTek, teksStatus, num, saatBahasa, amanUrl } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const param = new URLSearchParams(location.search).get("prov");
let data = null, geo = null, metrik = "terpasang", peta = null, petaSiap = false;

const METRIK = {
  terpasang: { ambil: (p) => p.terpasang_mw?.nilai ?? null, satuan: "MW", d: 1, sumber: (p) => p.terpasang_mw },
  rasio: { ambil: (p) => p.rasio_elektrifikasi?.nilai ?? null, satuan: "%", d: 2, sumber: (p) => p.rasio_elektrifikasi },
  panasbumi: { ambil: (p) => p.potensi_panas_bumi?.nilai ?? null, satuan: "MW", d: 0, sumber: (p) => p.potensi_panas_bumi },
  proyek: { ambil: (p) => p.jumlah_proyek, satuan: "", d: 0, sumber: () => null },
};
const nilaiTeks = (m, p) => { const v = METRIK[m].ambil(p); return v === null ? t("an.tanpa_data") : `${num(v, METRIK[m].d)}${METRIK[m].satuan ? " " + METRIK[m].satuan : ""}`; };
const ciriSumber = (m) => { const s = data.baris.map(METRIK[m].sumber).find(Boolean); return s || { sumber: t("wl.sumber_proyek"), tahun: null, tanggal: data.dibangun_pada }; };
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ---------- daftar ---------- */

function jawab() {
  const urut = [...data.baris].filter((p) => p.terpasang_mw).sort((a, b) => b.terpasang_mw.nilai - a.terpasang_mw.nilai), a = urut[0];
  const tot = urut.reduce((x, p) => x + p.terpasang_mw.nilai, 0), rued = data.baris.filter((p) => p.rued.perda).length;
  $("jawab").textContent = t("wl.kh.lead");
  $("ubin").innerHTML = ubinHtml([
    { ikon: "analisis", nilai: num(a.terpasang_mw.nilai, 0), satuan: "MW", label: t("wl.kh.u1", { nama: a.nama }), href: "#h-peta" },
    { ikon: "regulasi", nilai: num(rued), satuan: t("wl.kh.u2s", { n: data.baris.length }), label: t("wl.kh.u2"), href: "#h-urut" },
    { ikon: "peta", nilai: num((a.terpasang_mw.nilai / tot) * 100, 0), satuan: "%", label: t("wl.kh.u3", { nama: a.nama }), href: "#h-urut", turunan: true },
  ]);
}

function kartu() {
  const B = data.baris, tp = B.filter((p) => p.terpasang_mw), pb = B.filter((p) => p.potensi_panas_bumi);
  const jp = B.reduce((s, p) => s + p.jumlah_proyek, 0);
  $("kartu").innerHTML =
    kartuHtml({ ikon: "analisis", judul: t("wl.k.terpasang"), nilai: num(tp.reduce((s, p) => s + p.terpasang_mw.nilai, 0), 0), satuan: "MW", turunan: true, penyebut: t("wl.sub_prov", { n: tp.length, total: B.length }), sumber: sumberHtml(tp[0]?.terpasang_mw) }) +
    kartuHtml({ ikon: "peta", judul: t("wl.k.potensi"), nilai: num(pb.reduce((s, p) => s + p.potensi_panas_bumi.nilai, 0), 0), satuan: "MW", turunan: true, penyebut: t("wl.sub_prov", { n: pb.length, total: B.length }), sumber: sumberHtml(pb[0]?.potensi_panas_bumi) }) +
    kartuHtml({ ikon: "proyek", judul: t("wl.k.proyek"), nilai: num(jp), satuan: t("wl.proyek_sat"), penyebut: t("wl.tanpa_prov", { n: data.proyek_tanpa_provinsi }), sumber: sumberHtml({ sumber: t("wl.sumber_proyek"), tanggal: data.dibangun_pada }) }) +
    kartuHtml({ ikon: "regulasi", judul: t("wl.k.rued"), nilai: num(B.filter((p) => p.rued.perda).length), satuan: t("wl.prov_sat"), penyebut: t("wl.sub_prov", { n: B.filter((p) => p.rued.perda).length, total: B.length }), sumber: sumberHtml({ sumber: t("wl.sumber_rued"), tanggal: B.find((p) => p.rued.tanggal)?.rued.tanggal }) });
}

function urutan() {
  const m = metrik, B = [...data.baris].sort((a, b) => (METRIK[m].ambil(b) ?? -1) - (METRIK[m].ambil(a) ?? -1) || a.nama.localeCompare(b.nama));
  $("urutan").innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>#</th><th>${esc(t("wl.col.prov"))}</th><th>${esc(t("wl.m." + m))}</th><th>${esc(t("wl.col.rued"))}</th></tr></thead><tbody>${B.map((p, i) =>
    `<tr><td data-label="#">${i + 1}</td><td data-label="${esc(t("wl.col.prov"))}"><a href="/wilayah?prov=${esc(p.kode)}">${esc(p.nama)}</a></td><td data-label="${esc(t("wl.col.nilai"))}" class="jm-num">${esc(nilaiTeks(m, p))}</td><td data-label="${esc(t("wl.col.rued"))}">${esc(p.rued.perda ? t("wl.rued_ada", { perda: p.rued.perda }) : t("an.belum_tersedia"))}</td></tr>`).join("")}</tbody></table></div>${sumberHtml(ciriSumber(m))}`;
}

function legenda() {
  const m = metrik, v = data.baris.map(METRIK[m].ambil).filter((x) => x !== null);
  $("legenda").innerHTML = `<span class="jm-bantu">${esc(t("wl.legenda", { min: num(Math.min(...v), METRIK[m].d), max: num(Math.max(...v), METRIK[m].d) }))}</span><span class="jm-an-ramp" aria-hidden="true"></span><span class="jm-bantu"><i class="jm-an-kosong" aria-hidden="true"></i> ${esc(t("an.tanpa_data"))}</span>`;
  $("peta-info").innerHTML = sumberHtml(ciriSumber(m));
  const urutM = [...data.baris].filter((p) => METRIK[m].ambil(p) !== null).sort((a, b) => METRIK[m].ambil(b) - METRIK[m].ambil(a));
  $("temuan-peta").innerHTML = temuanHtml(t("wl.t.peta", { nama: urutM[0].nama, metrik: t("wl.m." + m), nilai: nilaiTeks(m, urutM[0]) }), false);
  $("temuan-urut").innerHTML = temuanHtml(t("wl.t.urut", { a: urutM[0].nama, b: urutM[1].nama, c: urutM[2].nama, n: urutM.length }), false);
}

/* ---------- peta ---------- */

function gaya() {
  const m = metrik, v = data.baris.map(METRIK[m].ambil).filter((x) => x !== null), maks = Math.max(1, ...v);
  const pasangan = [], kosong = [];
  for (const p of data.baris) {
    const x = METRIK[m].ambil(p);
    if (x === null) kosong.push(p.kode); else pasangan.push(p.kode, +(0.18 + 0.82 * Math.sqrt(x / maks)).toFixed(3));
  }
  return {
    isi: kosong.length ? ["match", ["get", "kode"], kosong, warna("--line"), warna("--accent-isi")] : warna("--accent-isi"),
    buram: ["match", ["get", "kode"], ...(kosong.length ? [kosong, 1] : []), ...pasangan, 0.1],
  };
}

function warnai() {
  if (!petaSiap) return;
  const g = gaya();
  peta.setPaintProperty("prov-isi", "fill-color", g.isi);
  peta.setPaintProperty("prov-isi", "fill-opacity", g.buram);
  peta.setPaintProperty("prov-garis", "line-color", warna("--paper"));
  peta.setPaintProperty("latar", "background-color", warna("--surface"));
}

async function bukaPeta() {
  try {
    geo = await (await fetch("/geo/provinsi.json", { credentials: "same-origin" })).json();
    await muatMapLibre();
  } catch (e) { $("peta").innerHTML = `<p class="jm-bantu">${esc(t("wl.peta_gagal"))}</p>`; return; }
  const g = gaya();
  peta = new maplibregl.Map({
    container: "peta", attributionControl: false, dragRotate: false, pitchWithRotate: false, cooperativeGestures: true, locale: { "CooperativeGesturesHandler.WindowsHelpText": t("wl.gesture.win"), "CooperativeGesturesHandler.MacHelpText": t("wl.gesture.mac"), "CooperativeGesturesHandler.MobileHelpText": t("wl.gesture.mobile") },
    style: { version: 8, sources: { prov: { type: "geojson", data: geo } }, layers: [
      { id: "latar", type: "background", paint: { "background-color": warna("--surface") } },
      { id: "prov-isi", type: "fill", source: "prov", paint: { "fill-color": g.isi, "fill-opacity": g.buram } },
      { id: "prov-garis", type: "line", source: "prov", paint: { "line-color": warna("--paper"), "line-width": 0.8 } },
    ] },
    bounds: [[94.5, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: 8 },
  });
  const nama = new Map(data.baris.map((p) => [p.kode, p]));
  const info = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 });
  peta.on("load", () => { petaSiap = true; });
  peta.on("mousemove", "prov-isi", (e) => {
    const p = nama.get(e.features[0]?.properties.kode);
    if (!p) return;
    peta.getCanvas().classList.add("jm-an-tunjuk");
    info.setLngLat(e.lngLat).setHTML(`<strong>${esc(p.nama)}</strong><br>${esc(t("wl.m." + metrik))}: ${esc(nilaiTeks(metrik, p))}`).addTo(peta);
  });
  peta.on("mouseleave", "prov-isi", () => { peta.getCanvas().classList.remove("jm-an-tunjuk"); info.remove(); });
  peta.on("click", "prov-isi", (e) => { const k = e.features[0]?.properties.kode; if (k) location.assign(`/wilayah?prov=${encodeURIComponent(k)}`); });
  // peta tidak boleh tertinggal saat tema berganti (ranjau R10 §8.15)
  new MutationObserver(warnai).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", warnai);
}

function pasangSakelar() {
  document.querySelector(".jm-tab").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]");
    if (!b || b.dataset.m === metrik) return;
    for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b)); // chrome urgent
    metrik = b.dataset.m;
    nanti(() => { warnai(); legenda(); urutan(); });
  });
}

function caraDaftar() {
  $("cara").innerHTML = `<p>${esc(t("wl.cara1"))}</p><p>${esc(t("wl.cara2"))}</p><p>${pil("an.est")} ${esc(t("wl.cara3"))}</p>`;
  $("kutip").textContent = t("wl.kutip", { tanggal: tanggal(data.dibangun_pada, { gaya: "panjang" }) });
}

/* ---------- profil ---------- */

const TEK = ["hidro", "panas-bumi", "surya", "bayu", "bioenergi"];

function tabelTek(p) {
  const pt = p.per_teknologi_mw || {};
  const pot = (k) => (k === "panas-bumi" && p.potensi_panas_bumi ? num(p.potensi_panas_bumi.nilai, 0) + " MW" : t("an.belum_tersedia"));
  return `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("wl.col.tek"))}</th><th>${esc(t("wl.col.terpasang"))}</th><th>${esc(t("wl.col.potensi"))}</th></tr></thead><tbody>${TEK.map((k) =>
    `<tr><td data-label="${esc(t("wl.col.tek"))}">${esc(teksTek(k))}</td><td data-label="${esc(t("wl.col.terpasang"))}" class="jm-num">${esc(pt[k] === undefined ? t("an.tanpa_data") : num(pt[k], 2) + " MW")}</td><td data-label="${esc(t("wl.col.potensi"))}" class="jm-num">${esc(pot(k))}</td></tr>`).join("")}</tbody></table></div>`;
}

function blokRued(p) {
  const r = p.rued;
  if (!r.perda) return `<p class="jm-bantu">${esc(r.alasan || "")}</p>${sumberLipat([{ sumber: t("wl.sumber_rued"), tanggal: r.tanggal }])}`;
  const kand = (r.kandidat || []).map((k) => `<li>${esc(t("wl.rued_kand", { tahun: k.tahun, persen: num(k.persen, 2) }))}</li>`).join("");
  const u = amanUrl(r.url);
  return `<p><strong>${esc(t("wl.rued_target"))}:</strong> ${esc(r.target_ebt_persen === null ? t("an.belum_tersedia") : num(r.target_ebt_persen, 2) + "%")}</p>
    <p>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t("wl.rued_ada", { perda: r.perda }))}</a>` : esc(t("wl.rued_ada", { perda: r.perda }))}</p>
    ${kand ? `<p>${pil("an.hipotesis")} ${esc(t("wl.rued_kand_judul"))}</p><ul>${kand}</ul>` : ""}
    ${sumberLipat([{ sumber: t("wl.sumber_rued"), url: r.url, tanggal: r.tanggal }])}`;
}

function visualProfil(p) {
  const urut = [...data.baris].filter((x) => x.terpasang_mw).sort((a, b) => b.terpasang_mw.nilai - a.terpasang_mw.nilai), i = urut.findIndex((x) => x.kode === p.kode);
  if (i < 0) return "";
  const med = urut[Math.floor(urut.length / 2)].terpasang_mw.nilai, mw = (v) => num(v, 0) + " MW";
  return heroVisual({ angka: `${i + 1}/${urut.length}`, label: t("wl.vis.peringkat"), rows: [
    { label: p.nama, nilai: p.terpasang_mw.nilai, teks: mw(p.terpasang_mw.nilai), kelas: "jm-hv-b1" },
    { label: urut[0].nama, nilai: urut[0].terpasang_mw.nilai, teks: mw(urut[0].terpasang_mw.nilai), kelas: "jm-hv-b2" },
    { label: t("wl.vis.median"), nilai: med, teks: mw(med), kelas: "jm-hv-b3" }] });
}

function profil(p) {
  document.title = t("wl.profil_title", { nama: p.nama });
  const pb = p.per_teknologi_mw?.["panas-bumi"], pot = p.potensi_panas_bumi;
  const batang = pot ? batangHtml([
    { label: t("wl.bar.terpasang"), bagian: [{ nilai: pb ?? 0, kelas: "jm-an-b1" }], teks: num(pb ?? 0, 1) + " MW" },
    { label: t("wl.bar.potensi"), bagian: [{ nilai: pot.nilai, kelas: "jm-an-b2" }], teks: num(pot.nilai, 0) + " MW" },
  ], { label: t("wl.bar.label") }) : `<p>${esc(t("an.belum_tersedia"))}</p>`;
  const proy = p.proyek.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("wl.col.proyek"))}</th><th>${esc(t("wl.col.tek"))}</th><th>${esc(t("wl.col.kap"))}</th><th>${esc(t("wl.col.status"))}</th></tr></thead><tbody>${p.proyek.map((x) =>
    `<tr><td data-label="${esc(t("wl.col.proyek"))}">${esc(x.nama)}</td><td data-label="${esc(t("wl.col.tek"))}">${esc(teksTek(x.teknologi))}</td><td data-label="${esc(t("wl.col.kap"))}" class="jm-num">${esc(x.mw === null ? t("an.tanpa_data") : num(x.mw, 1) + " " + x.satuan)}</td><td data-label="${esc(t("wl.col.status"))}">${esc(teksStatus(x.status))}</td></tr>`).join("")}</tbody></table></div>` : `<p>${esc(t("wl.proyek_kosong"))}</p>`;
  const perda = p.perda.length ? `<ul class="jm-an-daftar">${p.perda.map((x) => `<li>${amanUrl(x.url) ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">` : "<span>"}${esc(t("wl.perda_item", { nomor: x.nomor, tahun: x.tahun }))}${amanUrl(x.url) ? "</a>" : "</span>"} ${esc(x.judul)}</li>`).join("")}</ul>` : `<p>${esc(t("wl.perda_kosong"))}</p>`;
  const orgs = p.organisasi.length ? `<ul class="jm-an-daftar">${p.organisasi.map((o) => `<li>${esc(o.nama)}${o.kategori ? ` <small>${esc(o.kategori)}</small>` : ""}</li>`).join("")}</ul>` : `<p>${esc(t("wl.org_kosong"))}</p>`;
  const pakar = p.pakar.length ? `<ul class="jm-an-daftar">${p.pakar.map((o) => `<li>${esc(o.nama)} <small>${esc(o.jabatan || "")}, ${esc(o.organisasi || "")}</small></li>`).join("")}</ul>` : `<p>${esc(t("wl.pakar_kosong"))}</p>`;
  $("profil-isi").innerHTML = `
    <section class="jm-hero jm-an-hero2"><div><h1>${esc(p.nama)}</h1><p class="jm-an-label">${esc(t("an.jawaban"))}</p>
      <p>${esc(t("wl.profil_jawab", { nama: p.nama, mw: p.terpasang_mw ? num(p.terpasang_mw.nilai, 1) : "-", tahun: p.terpasang_mw?.tahun ?? "-", n: p.jumlah_proyek, pot: pot ? num(pot.nilai, 0) : "-" }))}</p></div>
      <aside class="jm-an-visual" id="visual">${visualProfil(p)}</aside></section>
    <section class="jm-an-kartu-baris">
      ${kartuHtml({ ikon: "analisis", judul: t("wl.k.terpasang1"), nilai: p.terpasang_mw ? num(p.terpasang_mw.nilai, 2) : "-", satuan: "MW", sumber: sumberHtml(p.terpasang_mw) })}
      ${kartuHtml({ ikon: "status", judul: t("wl.m.rasio"), nilai: p.rasio_elektrifikasi ? num(p.rasio_elektrifikasi.nilai, 2) : "-", satuan: "%", sumber: sumberHtml(p.rasio_elektrifikasi) })}
      ${kartuHtml({ ikon: "peta", judul: t("wl.m.panasbumi"), nilai: pot ? num(pot.nilai, 0) : "-", satuan: "MW", sumber: sumberHtml(pot) })}
      ${kartuHtml({ ikon: "proyek", judul: t("wl.k.proyek1"), nilai: num(p.jumlah_proyek), satuan: t("wl.proyek_sat"), sumber: sumberHtml({ sumber: t("wl.sumber_proyek"), tanggal: data.dibangun_pada }) })}
    </section>
    <section class="jm-kartu jm-an-wadah"><header class="jm-an-kepala"><div><h2>${esc(t("wl.pot_vs"))}</h2>${pot ? `<p class="jm-temuan">${temuanHtml(t("wl.t.pot", { a: num(pb ?? 0, 1), b: num(pot.nilai, 0), persen: num(((pb ?? 0) / pot.nilai) * 100, 1) }))}</p>` : ""}</div></header>${batang}${sumberHtml(pot)}<h3>${esc(t("wl.per_tek"))}</h3>${tabelTek(p)}${sumberHtml(p.terpasang_mw)}
      <p class="jm-bantu">${esc(Object.values(p.potensi_lain)[0]?.alasan || "")}</p></section>
    <section class="jm-kartu jm-an-wadah"><h2>${esc(t("wl.rued"))}</h2><p class="jm-temuan">${esc(p.rued.perda ? t("wl.t.rued_ada", { perda: p.rued.perda }) : t("wl.t.rued_tidak"))}</p>${blokRued(p)}</section>
    <section class="jm-kartu jm-an-wadah"><h2>${esc(t("wl.proyek_judul", { n: p.jumlah_proyek }))}</h2>${p.proyek.length ? `<p class="jm-temuan">${temuanHtml(t("wl.t.proyek", { n: p.jumlah_proyek, mw: num(p.proyek.reduce((s, x) => s + (x.mw || 0), 0), 0) }))}</p>` : ""}${proy}</section>
    <section class="jm-kartu jm-an-wadah"><h2>${esc(t("wl.perda_judul"))}</h2>${perda}${sumberLipat([{ sumber: t("wl.sumber_perda"), tanggal: data.dibangun_pada }])}</section>
    <section class="jm-kartu jm-an-wadah"><h2>${esc(t("wl.org_judul", { n: p.organisasi.length }))}</h2>${orgs}<h2>${esc(t("wl.pakar_judul", { n: p.pakar.length }))}</h2>${pakar}${sumberLipat([{ sumber: t("wl.sumber_org"), tanggal: data.dibangun_pada }])}</section>`;
  pasangBar($("profil-isi"));
  $("cara").innerHTML = `<p>${esc(t("wl.cara_profil"))}</p>`;
  $("kutip").textContent = t("wl.kutip_profil", { nama: p.nama, tanggal: tanggal(data.dibangun_pada, { gaya: "panjang" }) });
}

/* ---------- mulai ---------- */

function gambar() {
  if (param) {
    const p = data.baris.find((x) => x.kode === param);
    $("daftar").hidden = true; $("profil").hidden = false;
    if (!p) { $("profil-isi").innerHTML = `<div class="jm-kosong"><p>${esc(t("wl.tidak_ada"))}</p></div>`; return; }
    profil(p);
  } else {
    $("daftar").hidden = false; $("profil").hidden = true;
    jawab(); kartu(); legenda(); urutan(); caraDaftar(); warnai();
  }
}

async function mulai() {
  await mulaiHalaman();
  $("kartu") && ($("kartu").innerHTML = hantuHtml(2));
  try { data = await muatData("wilayah.json"); } catch (e) { tampilGalat($(param ? "profil-isi" : "kartu"), mulai); if (param) { $("daftar").hidden = true; $("profil").hidden = false; } return; }
  gambar();
  saatBahasa(gambar);
  if (!param) { pasangSakelar(); nanti(bukaPeta); }
}
mulai();
