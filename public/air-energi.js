/* /air-energi: nexus air dan energi. Data /data/air_energi.json + /data/geo/das_hidro.geojson (scripts/pipa/air_energi.mjs).
   Pembangkit hidro -> sub-DAS HydroBASINS -> skor kerentanan air (bobot Hipotesis); tren produksi hidro vs ONI vs hujan; kebutuhan air pembangkit lain.
   INP: saringan menyalakan chrome seketika, peta, grafik, tabel menyusul lewat nanti(). */
import { rumahTopik } from "/inti/rumah_tek.js";
import { t, angka } from "/i18n.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, nanti, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, sumberHtml, cariHtml, pilihHtml, hapusHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, BATAS_ID } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { siapTautan, tautOrg, tautProvinsi } from "/inti/tautan.js";
import { batangHtml, pasangBar, saatBahasa } from "/analisis.js";
import { pasangTabel } from "/proyek_besar_umum.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const KELAS = ["sangat-tinggi", "tinggi", "sedang", "rendah"];
const WARNA = { "sangat-tinggi": "--bad", tinggi: "--warn", sedang: "--info", rendah: "--ok" };
const KOMP = ["enso", "spi", "hth", "tanah", "tampungan", "tekanan"];
const svg = (d) => `<svg class="jm-ikt jm-ikt-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const IK = {
  rendah: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  sedang: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  tinggi: '<path d="M12 3 2 20h20zM12 10v5M12 18h.01"/>',
  "sangat-tinggi": '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM12 8v5M12 16h.01"/>',
};
const IKK = {
  enso: '<path d="M3 17c3-3 6 3 9 0s6 3 9 0M12 3v6M9 6l3-3 3 3"/>',
  spi: '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11zM9 15l6-3"/>',
  hth: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  tanah: '<path d="M3 20h18M5 20c0-4 3-6 7-6s7 2 7 6M9 10l3 4 3-4M12 4v6"/>',
  tampungan: '<path d="M4 20h16M6 20V9l6-5 6 5v11M9 20v-6h6v6"/>',
  tekanan: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3 2-5 5-5s5 2 5 5M14 20c0-2 1.5-4 4-4s3 1.5 3 4"/>',
};
const IKJ = { PLTA: "tek:hidro", PLTM: "petir", PLTMH: "tek-listrik" };
const FUNGSI = ["plta", "irigasi", "air-baku", "banjir", "perikanan"];
const IKF = { plta: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', irigasi: '<path d="M12 3v7M8 7l4 3 4-3M4 20c2-3 4 2 8-1s6 1 8-2"/>', "air-baku": '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>', banjir: '<path d="M3 12c3-3 6 3 9 0s6 3 9 0M3 18c3-3 6 3 9 0s6 3 9 0M12 3v5"/>', perikanan: '<path d="M3 12c4-6 11-6 15 0-4 6-11 6-15 0zM18 12l3-3v6zM8 12h.01"/>' };
const pilKelas = (r) => `<span class="ae2-pil ae2-k-${r.kelas}">${svg(IK[r.kelas])}<span>${esc(t("ae2.kelas." + r.kelas))}</span><b>${r.skor}</b></span>`;
const pilKelasNama = (k) => `<span class="ae2-pil ae2-k-${k}">${svg(IK[k])}<span>${esc(t("ae2.kelas." + k))}</span></span>`;
const kelasNilai = (v) => (v >= 65 ? "sangat-tinggi" : v >= 45 ? "tinggi" : v >= 25 ? "sedang" : "rendah");
const pilKomp = (k, v) => `<span class="ae2-pil ae2-k-${kelasNilai(v)}">${svg(IKK[k])}<span>${esc(t("ae2.komp." + k))}</span><b>${v}</b></span>`;
const chKomp = (k) => `<span class="ae2-ch ae2-c-${k}">${svg(IKK[k])}${esc(t("ae2.komp." + k))}</span>`;
const chFungsi = (f) => `<span class="ae2-ch ae2-f-${f}">${svg(IKF[f])}${esc(t("ae2.fungsi." + f))}</span>`;
const pilJenis = (j) => `<span class="ae2-ch ae2-j-${j}">${svg(j === "PLTA" ? IKF.plta : j === "PLTM" ? '<path d="M5 12h14M12 5v14"/>' : '<circle cx="12" cy="12" r="3"/>')}${esc(j)}</span>`;
const lambang = (kode, u = 16) => (kode ? `<img src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : "");
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme:dark)").matches);
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const S = { q: "", jenis: "", kelas: "", status: "", pilih: -1, pilihDas: "", tab: "pembangkit", das: true };
const TB = { pembangkit: { k: "skor", arah: -1, hal: 1, turun: ["skor", "mw"] }, das: { k: "skor", arah: -1, hal: 1, turun: ["skor", "mw", "n"] } };

await mulaiHalaman();
siapTautan("org");
const isi = $("aeIsi");
isi.innerHTML = hantuHtml(6);
let D;
try {
  D = await fetch("/data/air_energi.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("data"); return r.json(); });
} catch (e) {
  isi.innerHTML = galatHtml("jaringan");
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
const SEMUA = D.pembangkit.filter((r) => r.skor != null);
SEMUA.forEach((r, i) => { r.i = i; r.pem = r.pemilik ? r.pemilik.nama : null; r.pemId = r.pemilik ? r.pemilik.org_id : null; });
const DAS = new Map(D.das.map((d) => [d.id, d]));
const dasNama = (r) => (r.das && DAS.get(r.das) ? DAS.get(r.das).nama : null);

const cocok = (r, abaikanKelas) => (!S.jenis || r.jenis === S.jenis) && (!S.status || r.status === S.status) && (abaikanKelas || !S.kelas || r.kelas === S.kelas) && (!S.q || `${r.nama} ${r.pem || ""} ${r.prov || ""} ${dasNama(r) || ""}`.toLowerCase().includes(S.q));
const terpilih = (abaikanKelas) => SEMUA.filter((r) => cocok(r, abaikanKelas));
const jumlahMw = (a) => a.reduce((s, r) => s + (r.mw || 0), 0);
const fmtMw = (v) => (v == null ? `<span class="jm-bantu">-</span>` : `${N(v, v < 10 ? 1 : 0)} <span class="jm-pj-sat">MW</span>`);
const dasTerlihat = (rows) => new Set(rows.map((r) => r.das).filter(Boolean));
const selPem = (r) => {
  if (!r.pem) return `<span class="jm-bantu">-</span>`;
  const logo = logoOrgSatu(r.pemId, r.pem, r.pemilik && r.pemilik.logo);
  return `<span class="pb-pem">${logo ? `<img class="pb-logo" src="${esc(logo)}" alt="" width="22" height="22" loading="lazy" data-galat="hapus">` : ""}<span class="pb-pem-t"><span>${r.pemId ? tautOrg(r.pemId, r.pem) : esc(r.pem)}</span></span></span>`;
};
const selProv = (nama, kode) => (nama ? `<span class="pt2-prov">${lambang(kode)}${kode ? tautProvinsi(nama) : esc(nama)}</span>` : `<span class="jm-bantu">-</span>`);
const selNama = (r) => `<b>${r.profil ? `<a class="jm-pj-nm" href="/p/${esc(r.id)}">${esc(r.nama)}</a>` : esc(r.nama)}</b><div class="pb-prov">${selProv(r.prov, r.prov_kode)}</div>`;
const selDas = (r) => { const d = r.das && DAS.get(r.das); return d ? `<button type="button" class="ae2-das" data-das="${esc(d.id)}">${esc(d.nama)}</button>` : `<span class="jm-bantu" title="${esc(t("ae2.tanpa.das"))}">-</span>`; };
const KOL_PEM = [
  ["nama", "ae2.c.pembangkit", selNama],
  ["jenis", "ae2.c.jenis", (r) => pilJenis(r.jenis), "jm-tengah"],
  ["pem", "ae2.c.pemilik", selPem],
  ["status", "ae2.c.status", (r) => pilStatus(r.status), "jm-tengah"],
  ["skor", "ae2.c.skor", pilKelas, "jm-tengah"],
  ["das", "ae2.c.das", selDas],
  ["mw", "ae2.c.mw", (r) => fmtMw(r.mw), "jm-num"],
];
const topKomp = (d) => Object.entries(d.komponen).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => chKomp(k)).join("");
const KOL_DAS = [
  ["nama", "ae2.c.das", (d) => `<b><button type="button" class="ae2-das" data-das="${esc(d.id)}">${esc(d.nama)}</button></b><div class="pb-prov">${selProv(d.prov, d.prov_kode)}</div>`],
  ["n", "ae2.c.n", (d) => N(d.n), "jm-num"],
  ["skor", "ae2.c.skor", pilKelas, "jm-tengah"],
  [null, "ae2.c.komp", (d) => `<span class="ae2-komp">${topKomp(d)}</span>`, "pb-c-komp"],
  ["serbaguna", "ae2.c.waduk", (d) => (d.serbaguna.length ? esc(d.serbaguna.join(", ")) : `<span class="jm-bantu">-</span>`)],
  ["km2", "ae2.c.luas", (d) => `${N(d.km2)} <span class="jm-pj-sat">km2</span>`, "jm-num"],
  ["mw", "ae2.c.mw", (d) => fmtMw(d.mw), "jm-num"],
];
const infoMetode = () => sumberHtml(`${esc(D.meta.metode)}<br>${D.meta.sumber.map((s) => `${/^https?:/.test(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul)} (${esc(s.penerbit)}; ${esc(s.lisensi)})`).join("<br>")}<br>${esc(t("ae2.celah"))}: ${D.meta.celah.map(esc).join(" ")}`);

function kerangka() {
  const cJ = SEMUA.reduce((m, r) => (m[r.jenis] = (m[r.jenis] || 0) + 1, m), {}), cK = SEMUA.reduce((m, r) => (m[r.kelas] = (m[r.kelas] || 0) + 1, m), {}), cS = SEMUA.reduce((m, r) => (m[r.status] = (m[r.status] || 0) + 1, m), {});
  const stAda = Object.keys(cS).sort((a, b) => cS[b] - cS[a]);
  const saring = `<div class="jm-saring pt2-saring" role="group" aria-label="${esc(t("ae2.saring"))}">
    ${cariHtml({ id: "aeQ", label: t("ae2.cari"), placeholder: t("ae2.cari.ph") })}
    ${pilihHtml({ id: "aeJenis", ikon: "jenis", label: t("ae2.f.jenis"), opsi: [["", t("ae2.semua.jenis")], ...["PLTA", "PLTM", "PLTMH"].filter((k) => cJ[k]).map((k) => [k, k, IKJ[k], cJ[k]])], nilai: S.jenis })}
    ${pilihHtml({ id: "aeStatus", ikon: "status", label: t("ae2.f.status"), opsi: [["", t("ae2.semua.status")], ...stAda.map((k) => [k, t("pj.st." + k), "st:" + k, cS[k]])], nilai: S.status })}
    ${pilihHtml({ id: "aeKl", ikon: "peringatan", label: t("ae2.f.kelas"), opsi: [["", t("ae2.semua.kelas")], ...KELAS.filter((k) => cK[k]).map((k) => [k, t("ae2.kelas." + k), "peringatan", cK[k]])], nilai: S.kelas })}
    ${hapusHtml({ id: "aeHapus", label: t("ae2.f.hapus") })}</div>`;
  const bukaAwal = innerWidth >= 1280 ? " open" : ""; // layar sempit: panel mulai terlipat agar peta tidak tertutup
  const peta_ = `<div class="pt2-peta">
    <div id="aePeta" class="pt2-kanvas" role="application" aria-label="${esc(t("ae2.peta.label"))}"></div>
    <div id="aeTip" class="pt2-tip" role="status" hidden></div>
    <details class="pt2-lapis" id="aeLapis"${bukaAwal}><summary><span>${esc(t("ae2.lapis"))}</span></summary><div class="pt2-lapis-isi" id="aeLapisIsi"></div></details>
    <details class="pt2-panel" id="aePanel"${bukaAwal}><summary id="aePanelJ"><span>${esc(t("ae2.panel"))}</span></summary><div class="pt2-panel-isi" id="aePanelIsi" aria-live="polite"></div></details>
  </div>`;
  const tab = `<div class="jm-seg ae2-seg" id="aeSeg" role="group" aria-label="${esc(t("ae2.seg"))}"><button type="button" data-tb="pembangkit" aria-pressed="${S.tab === "pembangkit"}">${ikon("petir", 16)}<span>${esc(t("ae2.seg.pembangkit"))}</span></button><button type="button" data-tb="das" aria-pressed="${S.tab === "das"}">${ikon("wilayah", 16)}<span>${esc(t("ae2.seg.das"))}</span></button></div><div id="aeTabel"></div>`;
  isi.innerHTML = [
    exHtml({ id: "ae-saring", ikon: "cari2", topik: t("ae2.ex.saring"), judulHtml: " ", subHtml: " ", isiHtml: saring }),
    exHtml({ id: "ae-peta", ikon: "peta", topik: t("ae2.ex.peta"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + infoMetode(), isiHtml: peta_ }),
    exHtml({ id: "ae-grafik", ikon: "grafik", topik: t("ae2.ex.grafik"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + infoMetode(), isiHtml: `<div id="aeGrafik"></div>` }),
    exHtml({ id: "ae-air", ikon: "air-energi", topik: t("ae2.ex.air"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + infoMetode(), isiHtml: `<div id="aeAir"></div>` }),
    exHtml({ id: "ae-waduk", ikon: "denah", topik: t("ae2.ex.waduk"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml(), isiHtml: `<div id="aeWaduk"></div>` }),
    exHtml({ id: "ae-tabel", ikon: "tabel", topik: t("ae2.ex.tabel"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml({ csv: true }) + infoMetode(), isiHtml: tab }),
    exHtml({ id: "ae-metode", ikon: "metode", topik: t("ae2.ex.metode"), judulHtml: esc(t("ae2.metode.j")), subHtml: esc(t("ae2.metode.s")), isiHtml: metodeHtml() }),
  ].join("");
  import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {});
  $("ae-tabel").addEventListener("jm:csv", (e) => {
    if (S.tab === "das") {
      e.detail.baris = [[t("ae2.c.das"), t("ae2.c.prov"), t("ae2.c.n"), t("ae2.c.mw"), t("ae2.c.skor"), t("ae2.c.kelas"), ...KOMP.map((k) => t("ae2.komp." + k)), t("ae2.c.waduk")],
        ...D.das.map((d) => [d.nama, d.prov || "", d.n, d.mw, d.skor, t("ae2.kelas." + d.kelas), ...KOMP.map((k) => d.komponen[k] ?? ""), d.serbaguna.join("; ")])];
      return;
    }
    const baris = terpilih().sort((a, b) => b.skor - a.skor);
    e.detail.baris = [[t("ae2.c.pembangkit"), t("ae2.c.jenis"), t("ae2.c.pemilik"), t("ae2.c.status"), t("ae2.c.prov"), t("ae2.c.das"), t("ae2.c.skor"), t("ae2.c.kelas"), ...KOMP.map((k) => t("ae2.komp." + k)), t("ae2.c.mw")],
      ...baris.map((r) => [r.nama, r.jenis, r.pem || "", t("pj.st." + r.status), r.prov || "", dasNama(r) || "", r.skor, t("ae2.kelas." + r.kelas), ...KOMP.map((k) => r.komponen[k] ?? ""), r.mw ?? ""])];
  });
}
function metodeHtml() {
  const langkah = [["tampungan", "ae2.m1"], ["enso", "ae2.m2"], ["spi", "ae2.m3"], ["tekanan", "ae2.m4"]];
  return `<ol class="ae2-metode">${langkah.map(([k, kunci], n) => `<li><span class="ae2-m-no">${svg(IKK[k])}</span><div><b>${esc(t(kunci + ".j"))}</b><p>${esc(t(kunci))}</p></div></li>`).join("")}</ol>
    <div class="ae2-m-aksi"><a class="jm-tbl jm-tbl-kecil" href="/metode">${ikon("metode", 16)}<span>${esc(t("ae2.metode.tautan"))}</span></a>
    <a class="jm-tbl jm-tbl-kecil ae2-tp" href="/hidro">${ikon("hidro", 16)}<span>${esc(t("hdr.dari_air"))}</span></a>
    ${[["hidro", "ae2.tp.hidro"], ["panas-bumi", "ae2.tp.panas"], ["hidrogen", "ae2.tp.hidrogen"]].map(([id, kunci]) => `<a class="jm-tbl jm-tbl-kecil ae2-tp" href="${esc(rumahTopik(id))}">${pilTek(id)}<span>${esc(t(kunci))}</span></a>`).join("")}</div>`;
}
function judulEx(id, j, s) { const ex = $(id); if (!ex) return; ex.querySelector(".jm-ex-j").innerHTML = j; ex.querySelector(".jm-ex-sub").innerHTML = s; }
function gambarKepala() {
  const R = D.ringkas;
  khUbin("aeAngka", [
    { ikon: "petir", nilai: N(R.mw_hidro), label: t("ae2.kh.mw") },
    { ikon: "wilayah", nilai: N(R.das_terpetakan), label: t("ae2.kh.das") },
    { ikon: "peringatan", nilai: N(R.mw_rawan), label: t("ae2.kh.rawan") },
    { ikon: "air-energi", nilai: N(R.air_ebt_juta_m3, 1), label: t("ae2.kh.air") },
  ]);
}
function gambarSemua() {
  const rows = terpilih();
  $("aeHapus").hidden = !(S.q || S.jenis || S.kelas || S.status);
  judulEx("ae-saring", hlHtml("ae2.ex.saring.j", N(rows.length)), esc(t("ae2.ex.saring.s", { mw: N(jumlahMw(rows)), das: N(dasTerlihat(rows).size) })));
  judulEx("ae-peta", hlHtml("ae2.ex.peta.j", N(D.ringkas.das_rawan)), esc(t("ae2.ex.peta.s", { n: N(D.meta.tak_dinilai || 0), tgl: D.meta.snapshot_posko })));
  gambarLapis();
  petaData(rows);
  gambarPanel();
  gambarTabel();
}

/* ---------- lapisan ---------- */
function gambarLapis() {
  const per = {}; for (const r of terpilih(true)) per[r.kelas] = (per[r.kelas] || 0) + 1;
  const kl = KELAS.filter((k) => per[k] || S.kelas === k).map((k) => `<li><button type="button" class="pt2-leg" data-kl="${k}" aria-pressed="${S.kelas === k}"><i class="pt2-titik ae2-t-${k}" aria-hidden="true"></i><span>${esc(t("ae2.kelas." + k))}</span><b>${N(per[k] || 0)}</b></button></li>`).join("");
  $("aeLapisIsi").innerHTML = `<p class="pt2-leg-j">${esc(t("ae2.lapis.kelas"))}</p><ul class="pt2-leg-daftar">${kl}</ul>
    <p class="pt2-leg-j">${esc(t("ae2.lapis.j"))}</p><ul class="pt2-leg-daftar"><li><button type="button" class="pt2-leg pt2-sak" data-lp="das" aria-pressed="${S.das}"><i class="ae2-sw" aria-hidden="true"></i><span>${esc(t("ae2.lapis.das"))}</span></button></li></ul>
    <p class="pt2-attr">${esc(t("ae2.lapis.attr"))}</p>`;
}

/* ---------- peta ---------- */
let peta = null, petaSiap = false, GEO = null;
const fitur = (rows) => ({ type: "FeatureCollection", features: rows.map((r) => ({ type: "Feature", geometry: { type: "Point", coordinates: [r.lng, r.lat] }, properties: { i: r.i, k: r.kelas, mw: r.mw || 0, d: r.das || "" } })) });
const RAD = ["interpolate", ["linear"], ["sqrt", ["max", ["get", "mw"], 1]], 1, 4.5, 10, 7, 30, 11, 60, 16];
const filterDas = () => ["in", ["get", "id"], ["literal", [...dasTerlihat(terpilih())]]];
function petaData(rows) {
  if (!peta || !petaSiap) return;
  peta.getSource("ae")?.setData(fitur(rows));
  peta.setFilter("ae-sel", ["==", ["get", "i"], S.pilih]);
  if (peta.getLayer("das-isi")) { peta.setFilter("das-isi", filterDas()); peta.setFilter("das-garis", filterDas()); peta.setFilter("das-sel", ["==", ["get", "id"], S.pilihDas]); for (const l of ["das-isi", "das-garis", "das-sel"]) peta.setLayoutProperty(l, "visibility", S.das ? "visible" : "none"); }
}
async function pasangDas() {
  try { GEO ||= await fetch("/data/geo/das_hidro.geojson", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("das"); return r.json(); }); } catch (e) { S.das = false; gambarLapis(); return; }
  if (!peta || peta.getSource("das")) return;
  peta.addSource("das", { type: "geojson", data: GEO });
  peta.addLayer({ id: "das-isi", type: "fill", source: "das", paint: { "fill-color": ["match", ["get", "k"], ...KELAS.flatMap((k) => [k, warna(WARNA[k])]), warna("--ink2")], "fill-opacity": 0.38 } }, "ae-titik");
  peta.addLayer({ id: "das-garis", type: "line", source: "das", paint: { "line-color": ["match", ["get", "k"], ...KELAS.flatMap((k) => [k, warna(WARNA[k])]), warna("--ink2")], "line-width": 1 } }, "ae-titik");
  peta.addLayer({ id: "das-sel", type: "line", source: "das", filter: ["==", ["get", "id"], S.pilihDas], paint: { "line-color": warna("--sorot"), "line-width": 3 } }, "ae-titik");
  petaData(terpilih());
}
function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("ae", { type: "geojson", data: fitur(terpilih()) });
  peta.addLayer({ id: "ae-titik", type: "circle", source: "ae", paint: {
    "circle-color": ["match", ["get", "k"], ...KELAS.flatMap((k) => [k, warna(WARNA[k])]), warna("--ink2")], "circle-radius": RAD,
    "circle-opacity": 0.95, "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.5 } });
  peta.addLayer({ id: "ae-sel", type: "circle", source: "ae", filter: ["==", ["get", "i"], S.pilih], paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": ["+", RAD, 4], "circle-stroke-color": warna("--sorot"), "circle-stroke-width": 3 } });
  pasangBatas(peta, warna, il, "ae-titik");
  pasangDas();
}
const BATAS_DATA = (() => { const la = SEMUA.map((r) => r.lat), lo = SEMUA.map((r) => r.lng); return [[Math.min(...lo) - 1, Math.min(...la) - 1], [Math.max(...lo) + 1, Math.max(...la) + 1]]; })();
const padPeta = () => {
  const box = $("aePeta").getBoundingClientRect(), p = { top: 16, bottom: 16, left: 12, right: 12 };
  if (innerWidth < 1000) return p;
  for (const id of ["aeLapis", "aePanel"]) {
    const r = $(id).getBoundingClientRect(), tengah = r.left + r.width / 2 - box.left;
    if (tengah < box.width / 2) p.left = Math.max(p.left, r.right - box.left + 16); else p.right = Math.max(p.right, box.right - r.left + 16);
  }
  return p;
};
function letakTip(tip, pt) {
  const w = $("aePeta").clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.hidden = false;
  tip.style.left = Math.min(Math.max(pt.x + 14, 8), w - tw - 8) + "px";
  tip.style.top = Math.max(8, pt.y - th - 14) + "px";
}
function tipPembangkit(r, pt) {
  const tip = $("aeTip");
  tip.innerHTML = `<b>${esc(r.nama)}</b><span>${esc(r.jenis)}${r.mw != null ? `, ${esc(N(r.mw, r.mw < 10 ? 1 : 0))} MW` : ""}</span>${pilKelas(r)}`;
  letakTip(tip, pt);
}
function tipDas(p, pt) {
  const tip = $("aeTip");
  tip.innerHTML = `<b>${esc(p.nama)}</b><span>${esc(t("ae2.tip.das", { n: N(p.n), mw: N(p.mw) }))}</span>${pilKelas({ kelas: p.k, skor: p.skor })}`;
  letakTip(tip, pt);
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "aePeta", style: gaya(), bounds: BATAS_DATA, fitBoundsOptions: { padding: padPeta() }, minZoom: 2, maxZoom: 11, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    peta.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: t("ae2.attr") }), "bottom-left");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { petaSiap = true; pasangLapisan(); });
    new ResizeObserver(() => peta && peta.resize()).observe($("aePeta"));
    peta.once("idle", () => { peta.resize(); peta.fitBounds(BATAS_DATA, { padding: padPeta(), duration: 0 }); });
    peta.on("click", (e) => {
      const a = peta.queryRenderedFeatures(e.point, { layers: ["ae-titik"] });
      if (a.length) { pilihPembangkit(a[0].properties.i, false); return; }
      const d = peta.getLayer("das-isi") ? peta.queryRenderedFeatures(e.point, { layers: ["das-isi"] }) : [];
      if (d.length) pilihDas(d[0].properties.id, false);
    });
    peta.on("mousemove", (e) => {
      const a = peta.queryRenderedFeatures(e.point, { layers: ["ae-titik"] });
      if (a.length) { peta.getCanvas().style.cursor = "pointer"; const r = SEMUA[a[0].properties.i]; if (r) tipPembangkit(r, e.point); return; }
      const d = peta.getLayer("das-isi") ? peta.queryRenderedFeatures(e.point, { layers: ["das-isi"] }) : [];
      if (d.length) { peta.getCanvas().style.cursor = "pointer"; tipDas(d[0].properties, e.point); return; }
      peta.getCanvas().style.cursor = ""; $("aeTip").hidden = true;
    });
    peta.on("mouseout", () => { $("aeTip").hidden = true; });
    new MutationObserver(() => { petaSiap = false; peta && peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("aePeta").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("ae2.peta.galat"))}</p></div>`; });
}

/* ---------- panel ---------- */
function pilihPembangkit(i, fokus) {
  S.pilih = i; S.pilihDas = ""; gambarPanel(); petaData(terpilih());
  const r = SEMUA[i];
  if (fokus && peta && r) peta.flyTo({ center: [r.lng, r.lat], zoom: Math.max(peta.getZoom(), 7), padding: padPeta(), duration: 600 });
  $("aePanel").open = true;
}
function pilihDas(id, fokus) {
  S.pilihDas = id; S.pilih = -1; gambarPanel(); petaData(terpilih());
  const d = DAS.get(id);
  if (fokus && peta && d) peta.flyTo({ center: [d.lng, d.lat], zoom: Math.max(peta.getZoom(), 7), padding: padPeta(), duration: 600 });
  $("aePanel").open = true;
}
const ketKomp = (r, k) => {
  const m = r.mentah, d = r.das && DAS.get(r.das), f = (v, n = 2) => N(v, n);
  if (k === "enso") return t("ae2.ket.enso", { p: f(m.enso_pct, 0), r: f(m.enso_r) });
  if (k === "spi") return t("ae2.ket.spi", { a: m.spi3 == null ? "-" : f(m.spi3), b: m.spi6 == null ? "-" : f(m.spi6) });
  if (k === "hth") return t("ae2.ket.hth", { h: N(m.hth) });
  if (k === "tanah") return t("ae2.ket.tanah", { p: N(m.tanah) });
  if (k === "tampungan") return r.waduk ? t("ae2.ket.waduk", { nama: r.waduk.nama, tj: r.waduk.tampungan_juta_m3 ? N(r.waduk.tampungan_juta_m3) : "-" }) : t(r.jenis === "PLTA" ? "ae2.ket.plta" : "ae2.ket.ror");
  return t("ae2.ket.tekanan", { n: N(d ? d.n : 1) });
};
function detailPembangkit(r) {
  const baris = (k, v) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`;
  const komp = KOMP.filter((k) => r.komponen[k] != null).map((k) => `<div class="ae2-det-k">${pilKomp(k, r.komponen[k])}<small class="jm-bantu">${esc(ketKomp(r, k))}</small></div>`).join("");
  const d = r.das && DAS.get(r.das);
  return `<button type="button" class="jm-tbl jm-tbl-kecil pt2-kembali" data-aksi="kembali">${ikon("panah-kiri", 16)}<span>${esc(t("pt2.d.kembali"))}</span></button>
    <p class="pt2-det-nama"><b>${r.profil ? `<a href="/p/${esc(r.id)}">${esc(r.nama)}</a>` : esc(r.nama)}</b></p>
    <div class="pt2-det-pil">${pilJenis(r.jenis)}${pilStatus(r.status)}${pilKelas(r)}</div>
    <div class="pt2-det">${komp}</div>
    <dl class="pt2-det">${baris("ae2.c.mw", fmtMw(r.mw))}${baris("ae2.c.pemilik", selPem(r))}${baris("ae2.c.prov", selProv(r.prov, r.prov_kode))}${baris("ae2.c.das", d ? `<button type="button" class="ae2-das" data-das="${esc(d.id)}">${esc(d.nama)}</button>` : `<span class="jm-bantu">${esc(t("ae2.tanpa.das"))}</span>`)}${baris("ae2.c.presisi", esc(t("ae2.pr." + r.presisi)))}${baris("ae2.c.bahaya", r.bahaya == null ? `<span class="jm-bantu" title="${esc(t("ae2.bahaya.kosong"))}">-</span>` : esc(N(r.bahaya)))}${r.dikeluarkan.length ? baris("ae2.d.keluar", esc(r.dikeluarkan.map((k) => t("ae2.komp." + k)).join(", "))) : ""}</dl>`;
}
function detailDas(d) {
  const ps = SEMUA.filter((r) => r.das === d.id).sort((a, b) => (b.mw || 0) - (a.mw || 0));
  const komp = KOMP.filter((k) => d.komponen[k] != null).map((k) => `<div class="ae2-det-k">${pilKomp(k, d.komponen[k])}</div>`).join("");
  const baris = (k, v) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`;
  return `<button type="button" class="jm-tbl jm-tbl-kecil pt2-kembali" data-aksi="kembali">${ikon("panah-kiri", 16)}<span>${esc(t("pt2.d.kembali"))}</span></button>
    <p class="pt2-det-nama"><b>${esc(d.nama)}</b></p>
    <div class="pt2-det-pil">${pilKelas(d)}</div>
    <div class="pt2-det">${komp}</div>
    <dl class="pt2-det">${baris("ae2.c.mw", fmtMw(d.mw))}${baris("ae2.c.luas", `${N(d.km2)} <span class="jm-pj-sat">km2</span>`)}${baris("ae2.c.prov", selProv(d.prov, d.prov_kode))}${baris("ae2.c.kode", esc(d.pfaf))}${d.serbaguna.length ? baris("ae2.c.waduk", esc(d.serbaguna.join(", "))) : ""}</dl>
    <p class="pt2-leg-j">${esc(t("ae2.d.isi", { n: N(ps.length) }))}</p>
    <ol class="pt2-rank">${ps.map((x) => `<li><button type="button" class="pt2-rank-b" data-i="${x.i}"><span class="pt2-rank-t"><b>${esc(x.nama)}</b><span class="pt2-rank-s">${esc(x.jenis)}, ${fmtMw(x.mw)}</span></span><span class="pt2-rank-v">${pilKelas(x)}</span></button></li>`).join("")}</ol>`;
}
function gambarPanel() {
  const el = $("aePanelIsi"), r = SEMUA[S.pilih], d = S.pilihDas && DAS.get(S.pilihDas);
  if (r && cocok(r)) { el.innerHTML = detailPembangkit(r); $("aePanelJ").firstElementChild.textContent = t("ae2.panel.rinci"); return; }
  if (d) { el.innerHTML = detailDas(d); $("aePanelJ").firstElementChild.textContent = t("ae2.panel.das"); return; }
  S.pilih = -1; S.pilihDas = "";
  const top = terpilih().slice().sort((a, b) => b.skor - a.skor || (b.mw || 0) - (a.mw || 0)).slice(0, 8);
  el.innerHTML = top.length ? `<ol class="pt2-rank">${top.map((x, n) => `<li><button type="button" class="pt2-rank-b" data-i="${x.i}"><span class="jm-rank${n < 3 ? " jm-rank-top" : ""}">${n + 1}</span><span class="pt2-rank-t"><b>${esc(x.nama)}</b><span class="pt2-rank-s">${pilJenis(x.jenis)}</span></span><span class="pt2-rank-v">${pilKelas(x)}</span></button></li>`).join("")}</ol>` : `<div class="jm-kosong">${ikon("info", 24)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`;
  $("aePanelJ").firstElementChild.textContent = t("ae2.panel");
}

/* ---------- grafik: produksi hidro vs hujan vs ONI ---------- */
const ketOni = (v) => (v == null ? "-" : v >= 0.5 ? t("ae2.g.elnino") : v <= -0.5 ? t("ae2.g.lanina") : t("ae2.g.netral"));
function gambarGrafik() {
  const T = D.tren, EN = D.elnino, el = $("aeGrafik"), n = T.tahun.length;
  const dCf = EN.lereng_cf_per_oni;
  judulEx("ae-grafik", hlHtml("ae2.ex.grafik.j", N(Math.abs(dCf), 1)), esc(t("ae2.ex.grafik.s", { r: N(EN.r, 2), n: N(EN.n), oni: N(EN.oni_sekarang, 2), musim: EN.musim || "" })));
  const M = innerWidth < 640, W = M ? 420 : 760, H = M ? 360 : 340, L = 44, Rk = 44, TOP = 14, A0 = TOP, A1 = M ? 220 : 205, B0 = A1 + 34, B1 = H - 28;
  const xs = (i) => L + ((i + 0.5) / n) * (W - L - Rk), bw = ((W - L - Rk) / n) * 0.56, fs = M ? 12 : 11;
  const cfMax = 70, cfY = (v) => A1 - (v / cfMax) * (A1 - A0);
  const hv = T.hujan_idx_persen.filter((v) => v != null), hMax = Math.max(40, Math.ceil(Math.max(...hv.map(Math.abs)) / 10) * 10), hY = (v) => A0 + ((hMax - v) / (2 * hMax)) * (A1 - A0);
  const oMax = 2.5, oY = (v) => B0 + ((oMax - v) / (2 * oMax)) * (B1 - B0), o0 = oY(0);
  let g = [0, 20, 40, 60].map((v) => `<line class="jm-gf-grid" x1="${L}" x2="${W - Rk}" y1="${cfY(v).toFixed(1)}" y2="${cfY(v).toFixed(1)}"/><text class="jm-gf-t2" x="${L - 6}" y="${(cfY(v) + 4).toFixed(1)}" text-anchor="end" font-size="${fs}">${v}</text>`).join("");
  g += [-hMax, 0, hMax].map((v) => `<text class="jm-gf-t2" x="${W - Rk + 6}" y="${(hY(v) + 4).toFixed(1)}" font-size="${fs}">${v > 0 ? "+" : ""}${v}</text>`).join("");
  g += `<text class="jm-gf-t2" x="${L - 6}" y="${A0 - 3}" text-anchor="end" font-size="${fs}">%</text>`;
  g += [-2, 0, 2].map((v) => `<line class="jm-gf-grid" x1="${L}" x2="${W - Rk}" y1="${oY(v).toFixed(1)}" y2="${oY(v).toFixed(1)}"/><text class="jm-gf-t2" x="${L - 6}" y="${(oY(v) + 4).toFixed(1)}" text-anchor="end" font-size="${fs}">${v}</text>`).join("");
  g += `<text class="jm-gf-t1" x="${L}" y="${B0 - 8}" font-size="${fs}">${esc(t("ae2.g.oni"))}</text>`;
  const garis = [];
  T.tahun.forEach((y, i) => {
    const cf = T.cf_persen[i], oni = T.oni_kemarau[i], h = T.hujan_idx_persen[i];
    if (cf != null) g += `<rect class="ae2-g-cf${oni != null && oni >= 0.5 ? " ae2-g-en" : ""}" x="${(xs(i) - bw / 2).toFixed(1)}" y="${cfY(cf).toFixed(1)}" width="${bw.toFixed(1)}" height="${(A1 - cfY(cf)).toFixed(1)}" rx="3"/>`;
    if (oni != null) g += `<rect class="ae2-g-o ae2-g-o-${oni >= 0.5 ? "en" : oni <= -0.5 ? "ln" : "n"}" x="${(xs(i) - bw / 2).toFixed(1)}" y="${Math.min(oY(oni), o0).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2, Math.abs(oY(oni) - o0)).toFixed(1)}" rx="2"/>`;
    if (h != null) garis.push([xs(i), hY(h)]);
    g += `<text class="jm-gf-t2" x="${xs(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="${fs}">${M ? String(y).slice(2) : y}</text>`;
  });
  g += `<line class="jm-gf-grid" x1="${L}" x2="${W - Rk}" y1="${o0.toFixed(1)}" y2="${o0.toFixed(1)}"/>`;
  g += `<polyline class="ae2-g-hujan" fill="none" points="${garis.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")}"/>` + garis.map((p) => `<circle class="ae2-g-tk" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4"/>`).join("");
  // pita sorot per tahun: tooltip berisi semua seri (crosshair)
  g += T.tahun.map((y, i) => {
    const gen = T.gen_twh[i], cf = T.cf_persen[i], h = T.hujan_idx_persen[i], oni = T.oni_kemarau[i];
    const tip = `${y}: ${t("ae2.g.tip", { gen: N(gen, 1), cf: cf == null ? "-" : N(cf, 1), h: h == null ? "-" : (h > 0 ? "+" : "") + N(h, 1), oni: oni == null ? "-" : N(oni, 2), ket: ketOni(oni) })}`;
    return `<rect class="ae2-g-pita" data-tip="${esc(tip)}" x="${(xs(i) - (W - L - Rk) / n / 2).toFixed(1)}" y="${A0}" width="${((W - L - Rk) / n).toFixed(1)}" height="${(B1 - A0).toFixed(1)}"/>`;
  }).join("");
  const leg = `<ul class="ae2-g-leg"><li><i class="ae2-sw-cf" aria-hidden="true"></i>${esc(t("ae2.g.cf"))}</li><li><i class="ae2-sw-en" aria-hidden="true"></i>${esc(t("ae2.g.cf.en"))}</li><li><i class="ae2-sw-hj" aria-hidden="true"></i>${esc(t("ae2.g.hujan"))}</li><li><i class="ae2-sw-ln" aria-hidden="true"></i>${esc(t("ae2.g.leg.ln"))}</li></ul>`;
  const kartu = [
    ["elnino", t("ae2.s.cf"), `${EN.delta_cf_poin > 0 ? "+" : ""}${N(EN.delta_cf_poin, 1)}`, t("ae2.s.cf.u"), t("ae2.s.cf.k", { oni: N(EN.oni_sekarang, 2) })],
    ["petir", t("ae2.s.gwh"), `${EN.delta_gwh > 0 ? "+" : ""}${N(EN.delta_gwh)}`, "GWh", t("ae2.s.gwh.k", { mw: N(EN.mw_nasional) })],
    ["jam", t("ae2.s.th"), (EN.tahun_el_nino || []).join(", "), "", t("ae2.s.th.k")],
  ].map(([ik, lab, nilai, sat, ket]) => `<div class="ae2-s"><span class="jm-kpi-ik">${ikon(ik === "elnino" ? "peringatan" : ik, 18)}</span><p class="ae2-s-l">${esc(lab)} <span class="jm-pil jm-pil-est">${esc(t("pj.est"))}</span></p><p class="ae2-s-n"><b>${esc(nilai)}</b>${sat ? `<span>${esc(sat)}</span>` : ""}</p><p class="jm-bantu">${esc(ket)}</p></div>`).join("");
  el.innerHTML = `${leg}<div class="ae2-g-bungkus"><svg class="jm-gx ae2-g" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("ae2.ex.grafik"))}" focusable="false">${g}</svg></div><div class="ae2-stat">${kartu}</div>`;
}

/* ---------- kebutuhan air pembangkit lain ---------- */
function gambarAir() {
  const A = D.air, h2 = A.h2, pltu = A.baris.find((b) => b.id === "pltu"), plts = A.baris.find((b) => b.id === "plts");
  const rasio = pltu && plts ? Math.round(pltu.koef_m3_mwh / plts.koef_m3_mwh) : 0;
  judulEx("ae-air", hlHtml("ae2.ex.air.j", N(rasio)), esc(t("ae2.ex.air.s", { h2: N(h2.praktis_l_kg), st: N(h2.stoikiometri_l_kg) })));
  const baris = A.baris.slice().sort((a, b) => b.koef_m3_mwh - a.koef_m3_mwh).map((b) => ({ id: b.id, label: t("ae2.air." + b.id), labelHtml: `<span class="ae2-air-l ae2-a-${b.id}">${svg(IKK[b.id === "pltu" ? "tampungan" : b.id === "pltp" ? "spi" : "hth"])}<span>${esc(t("ae2.air." + b.id))}</span></span>`,
    bagian: [{ nilai: b.koef_m3_mwh, kelas: "ae2-b-" + b.id }], teks: `${N(b.koef_m3_mwh, 1)} (${N(b.rentang[0], 2)} - ${N(b.rentang[1], 1)})` }));
  const kartu = A.baris.map((b) => `<div class="ae2-s"><span class="ae2-air-l ae2-a-${b.id}">${svg(IKK[b.id === "pltu" ? "tampungan" : b.id === "pltp" ? "spi" : "hth"])}</span><p class="ae2-s-l">${esc(t("ae2.air." + b.id))} <span class="jm-pil ${b.label === "hipotesis" ? "jm-pil-est" : ""}">${esc(t(b.label === "hipotesis" ? "an.hipotesis" : "ae2.rujukan"))}</span></p><p class="ae2-s-n"><b>${N(b.juta_m3_op, b.juta_m3_op < 10 ? 2 : 0)}</b><span>${esc(t("ae2.sat.jtm3"))}</span></p><p class="jm-bantu">${esc(t("ae2.air.k", { mw: N(b.mw_op), fk: N(b.fk * 100) }))}</p></div>`).join("")
    + `<div class="ae2-s"><span class="ae2-air-l ae2-a-h2">${svg('<circle cx="7" cy="12" r="3.6"/><circle cx="17" cy="12" r="3.6"/><path d="M10.6 12h2.8"/>')}</span><p class="ae2-s-l">${esc(t("ae2.air.h2"))} <span class="jm-pil">${esc(t("ae2.rujukan"))}</span></p><p class="ae2-s-n"><b>${N(h2.per_100kt_juta_m3, 1)}</b><span>${esc(t("ae2.sat.jtm3"))}</span></p><p class="jm-bantu">${esc(t("ae2.air.h2.k", { ton: N(h2.ton_per_tahun || 0), jt: N(h2.juta_m3 || 0, 4) }))}</p></div>`;
  $("aeAir").innerHTML = `<div class="ae2-air"><div><p class="pt2-leg-j">${esc(t("ae2.air.int"))}</p>${batangHtml(baris, { label: t("ae2.ex.air") })}</div><div class="ae2-air-k">${kartu}</div></div>`;
  pasangBar($("aeAir"));
  const lis = $("aeAir").querySelectorAll(".jm-batang>li.jm-bar-b");
  A.baris.slice().sort((a, b) => b.koef_m3_mwh - a.koef_m3_mwh).forEach((b, i) => {
    const li = lis[i]; if (!li) return;
    li.removeAttribute("title");
    li.dataset.tip = `${t("ae2.air." + b.id)}: ${t("ae2.air.tip", { k: N(b.koef_m3_mwh, 2), a: N(b.rentang[0], 2), b: N(b.rentang[1], 2), v: N(b.juta_m3_op, 1), rumus: b.rumus })}`;
    li.tabIndex = 0;
  });
}

/* ---------- irisan waduk serbaguna ---------- */
function gambarWaduk() {
  const per = new Map();
  for (const r of SEMUA) if (r.waduk) { const w = per.get(r.waduk.nama) || per.set(r.waduk.nama, { w: r.waduk, mw: 0, das: new Set(), ps: [], skor: [] }).get(r.waduk.nama); w.mw += r.mw || 0; if (r.das) w.das.add(r.das); w.ps.push(r.nama); w.skor.push(r.skor); }
  const a = [...per.values()].sort((x, y) => y.mw - x.mw);
  const multi = a.filter((x) => x.w.fungsi.includes("irigasi") || x.w.fungsi.includes("air-baku"));
  judulEx("ae-waduk", hlHtml("ae2.ex.waduk.j", N(multi.length)), esc(t("ae2.ex.waduk.s", { n: N(a.length), mw: N(a.reduce((s, x) => s + x.mw, 0)) })));
  const cat = new Map(D.waduk_catatan.map((c) => [c.nama, c]));
  $("aeWaduk").innerHTML = `<ul class="ae2-waduk">${a.map((x) => {
    const sk = Math.round(x.skor.reduce((s, v) => s + v, 0) / x.skor.length), c = [...cat.values()].find((k) => x.w.nama.startsWith(k.nama.split(" ")[0]));
    return `<li class="ae2-wd"><div class="ae2-wd-h"><b>${esc(x.w.nama)}</b>${pilKelas({ kelas: kelasNilai(sk), skor: sk })}</div><div class="ae2-wd-f">${FUNGSI.filter((f) => x.w.fungsi.includes(f)).map(chFungsi).join("")}</div><p class="jm-bantu">${esc(x.w.tampungan_juta_m3 ? t("ae2.wd.k", { mw: N(x.mw), tj: N(x.w.tampungan_juta_m3) }) : t("ae2.wd.k0", { mw: N(x.mw) }))}</p>${c ? `<p class="ae2-wd-c">${svg('<path d="M12 3 2 20h20zM12 10v5M12 18h.01"/>')}<span>${esc(c.catatan)}</span></p>` : ""}</li>`;
  }).join("")}</ul>`;
}

/* ---------- tabel ---------- */
function gambarTabel() {
  const pem = S.tab === "pembangkit", rows = pem ? terpilih() : D.das.filter((d) => d.skor != null);
  judulEx("ae-tabel", hlHtml(pem ? "ae2.ex.tabel.j" : "ae2.ex.tabel.jd", N(rows.length)), esc(t(pem ? "ae2.ex.tabel.s" : "ae2.ex.tabel.sd", { mw: N(pem ? jumlahMw(rows) : rows.reduce((s, d) => s + d.mw, 0)) })));
  const el = document.createElement("div"); $("aeTabel").replaceChildren(el);
  const st = TB[S.tab]; st.hal = 1;
  el.classList.toggle("ae2-t-das", !pem);
  pasangTabel(el, pem ? KOL_PEM : KOL_DAS, rows, st, "jm.kosong.cocok");
}

function pasangEvent() {
  const seg = (fn) => { fn(); nanti(gambarSemua); };
  $("aeQ").addEventListener("input", (e) => seg(() => { S.q = e.target.value.trim().toLowerCase(); }));
  $("aeJenis").addEventListener("change", (e) => seg(() => { S.jenis = e.target.value; }));
  $("aeStatus").addEventListener("change", (e) => seg(() => { S.status = e.target.value; }));
  $("aeKl").addEventListener("change", (e) => seg(() => { S.kelas = e.target.value; }));
  $("aeHapus").addEventListener("click", () => { S.q = S.jenis = S.kelas = S.status = ""; $("aeQ").value = ""; for (const id of ["aeJenis", "aeStatus", "aeKl"]) $(id).value = ""; nanti(gambarSemua); });
  $("aeLapis").addEventListener("click", (e) => {
    const k = e.target.closest("[data-kl]"), l = e.target.closest("[data-lp]");
    if (k) { S.kelas = S.kelas === k.dataset.kl ? "" : k.dataset.kl; $("aeKl").value = S.kelas; nanti(gambarSemua); }
    if (l) { S.das = !S.das; l.setAttribute("aria-pressed", String(S.das)); nanti(() => { petaData(terpilih()); }); }
  });
  $("aePanel").addEventListener("click", (e) => {
    const b = e.target.closest(".pt2-rank-b"), k = e.target.closest("[data-aksi=kembali]"), d = e.target.closest("[data-das]");
    if (b) pilihPembangkit(+b.dataset.i, true);
    else if (d) pilihDas(d.dataset.das, true);
    else if (k) { S.pilih = -1; S.pilihDas = ""; gambarPanel(); petaData(terpilih()); }
  });
  $("aeSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tb]"); if (!b || b.dataset.tb === S.tab) return;
    for (const x of $("aeSeg").children) x.setAttribute("aria-pressed", String(x === b));
    S.tab = b.dataset.tb; nanti(gambarTabel);
  });
  $("aeTabel").addEventListener("click", (e) => {
    const d = e.target.closest("[data-das]"); if (!d) return;
    $("ae-peta").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth", block: "start" });
    pilihDas(d.dataset.das, true);
  });
}
function mulai() {
  kerangka(); gambarKepala(); pasangEvent();
  if (innerWidth >= 1000) { geserPanel($("aeLapis"), { kunci: "lapis" }); geserPanel($("aePanel"), { kunci: "panel" }); }
  gambarSemua(); gambarGrafik(); gambarAir(); gambarWaduk(); bukaPeta();
}
mulai();
saatBahasa(() => { if (peta) { peta.remove(); peta = null; petaSiap = false; } mulai(); });
