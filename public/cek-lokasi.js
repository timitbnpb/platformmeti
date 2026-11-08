/* /cek-lokasi: penyaring lokasi per titik. Klik peta atau isi koordinat; semua dihitung di peramban dari berkas statis
   (geo/provinsi, geo/gardu, geo/transmisi, data/geo/*.geojson, img/risiko/bahaya_multi.png, potensi_atlas, lokasi_hijau, radar_kabupaten, proyek).
   Geometri: inti/geo_titik.js; skor: cek_lokasi_hitung.js (Hipotesis, rumus di /metode#cek-lokasi).
   INP: peta, kolom, dan penanda berubah seketika; hitung berat (titik-dalam-poligon, jarak ke 2.700 saluran) menyusul lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, pilihHtml, sumberHtml } from "/inti/komponen.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { buktiHtml } from "/inti/bukti.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, BATAS_ID } from "/inti/peta_indonesia.js";
import { pilTek } from "/inti/ikon_tek.js";
import { pasangPilih } from "/inti/pilih.js";
import { batang } from "/grafik.js";
import { jarakKm, jarakGarisKm, fiturMemuat, dalamGeometri, terdekat, terdekatN, dalamKotak, titikSah } from "/inti/geo_titik.js";
import { BOBOT, LAHAN, skorLokasi, indeksBahaya, kelasBahaya, kelasSkor } from "/cek_lokasi_hitung.js";

await mulaiHalaman();
const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const ambil = (u) => fetch(u, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const lambang = (kode, u = 28) => `<img src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">`;
const KOM = Object.keys(BOBOT);
const IK_KOM = { sumber: "tek-surya", jaringan: "petir", lahan: "peta", bahaya: "peringatan", bpp: "tag" };
const KELAS_PIL = { tinggi: "jm-pil-ok", sedang: "jm-pil-info", rendah: "jm-pil-warn" };
const JUMLAH_PROYEK = 5, KM_PROYEK_MAKS = 150;
const LAPIS_LAHAN = [["hutan", "/data/geo/lahan_hutan.geojson"], ["konsesi", "/data/geo/lahan_konsesi.geojson"], ["mangrove", "/data/geo/lahan_mangrove.geojson"], ["gambut", "/data/geo/risiko_gambut.geojson"], ["adat", "/data/geo/risiko_adat.geojson"]];
const BAHAYA_GAMBAR = { url: "/img/risiko/bahaya_multi.png", barat: 95, utara: 6.1, timur: 141.1, selatan: -11.1 };

const isi = $("clIsi");
isi.innerHTML = hantuHtml(6);
let PROV, ATLAS, LH, RADAR;
try {
  [PROV, ATLAS, LH, RADAR] = await Promise.all([ambil("/geo/provinsi.json"), ambil("/data/potensi_atlas.json"), ambil("/data/lokasi_hijau.json"), ambil("/data/radar_kabupaten.json")]);
} catch (e) {
  isi.innerHTML = galatHtml("jaringan");
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
const NAMA_PROV = new Map(LH.provinsi.map((p) => [p.kode, p.nama]));
const LH_PROV = new Map(LH.provinsi.map((p) => [p.kode, p]));
const ATLAS_PROV = new Map(ATLAS.baris.map((b) => [b.kode, b]));
const BPP_SEMUA = LH.provinsi.map((p) => p.bpp?.rp_kwh).filter((x) => x != null);
const KABUPATEN = RADAR.baris;

/* muat lambat, sekali per sesi */
const cache = new Map();
const muat = (kunci, fn) => { if (!cache.has(kunci)) cache.set(kunci, fn().catch(() => { cache.delete(kunci); return null; })); return cache.get(kunci); };
const muatGardu = () => muat("gardu", () => ambil("/geo/gardu.json"));
const muatSaluran = () => muat("saluran", () => ambil("/geo/transmisi.json"));
const muatLahan = (id, u) => muat("lahan:" + id, () => ambil(u));
const muatProyek = () => muat("proyek", () => ambil("/data/proyek.json"));
const muatBahaya = () => muat("bahaya", () => new Promise((ok, gagal) => {
  const g = new Image();
  g.onload = () => { const c = document.createElement("canvas"); c.width = g.naturalWidth; c.height = g.naturalHeight; const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(g, 0, 0); ok({ x, w: c.width, h: c.height }); };
  g.onerror = () => gagal(new Error("bahaya"));
  g.src = BAHAYA_GAMBAR.url;
}));

/* ---------- hitung per aspek (murni terhadap data yang dimuat) ---------- */
function provinsiDi(p) {
  return PROV.features.find((x) => dalamGeometri(p.lng, p.lat, x.geometry))?.properties.kode ?? null;
}
async function jaringanDi(p) {
  const [g, s] = await Promise.all([muatGardu(), muatSaluran()]);
  if (!g || !s) return { galat: true };
  const tercakup = (g.meta.cakupan_bbox || []).some((b) => dalamKotak(p.lat, p.lng, b));
  const gd = terdekat(g.gardu, (x) => jarakKm(p, x));
  const sl = terdekat(s.garis, (x) => jarakGarisKm(p, x.koordinat));
  return { tercakup, gardu: gd, saluran: sl, km: Math.min(gd?.km ?? Infinity, sl?.km ?? Infinity) };
}
async function lahanDi(p) {
  const hasil = await Promise.all(LAPIS_LAHAN.map(async ([id, u]) => [id, await muatLahan(id, u)]));
  if (hasil.some(([, k]) => !k)) return { galat: true };
  const kelas = new Set(), konsesi = [];
  for (const [id, k] of hasil) {
    for (const f of fiturMemuat(k, p.lng, p.lat)) {
      const j = f.properties.j || f.properties.k || id;
      kelas.add(j);
      if (id === "konsesi") konsesi.push({ nama: f.properties.n, jenis: j, ha: f.properties.ha });
    }
  }
  return { kelas: [...kelas].filter((k) => k in LAHAN), konsesi };
}
async function bahayaDi(p) {
  const m = await muatBahaya();
  if (!m) return { galat: true };
  const { barat, utara, timur, selatan } = BAHAYA_GAMBAR;
  const px = Math.round(((p.lng - barat) / (timur - barat)) * m.w), py = Math.round(((utara - p.lat) / (utara - selatan)) * m.h);
  if (px < 1 || py < 1 || px >= m.w - 1 || py >= m.h - 1) return { indeks: null };
  const d = m.x.getImageData(px - 1, py - 1, 3, 3).data; // 3x3: piksel ~4 km, ambil yang tertinggi
  let maks = null;
  for (let i = 0; i < d.length; i += 4) { const v = indeksBahaya(d[i], d[i + 1], d[i + 2], d[i + 3]); if (v != null && (maks == null || v > maks)) maks = v; }
  return { indeks: maks };
}
async function proyekDi(p) {
  const d = await muatProyek();
  if (!d) return { galat: true };
  const bertitik = d.baris.filter((b) => b.lokasi?.lat != null && b.lokasi.presisi && b.lokasi.presisi !== "provinsi");
  const dekat = terdekatN(bertitik, (b) => jarakKm(p, b.lokasi), JUMLAH_PROYEK).filter((x) => x.km <= KM_PROYEK_MAKS);
  return { daftar: dekat, dicari: bertitik.length };
}

/* ---------- kerangka ---------- */
const hip = () => buktiHtml("hipotesis");
const est = () => buktiHtml("est");
const ex = (o) => exHtml({ tingkat: "h2", ...o });
let peta = null, petaSiap = false;
const S = { lat: null, lng: null, kab: "", jalan: 0 };

khUbin("clUbin", [
  { ikon: "wilayah", nilai: N(PROV.features.length), label: t("cl.u1") },
  { ikon: "tek-surya", nilai: N(ATLAS.baris.length), label: t("cl.u2") },
  { ikon: "peta", nilai: N(LAPIS_LAHAN.length), label: t("cl.u3") },
  { ikon: "proyek", nilai: N(KABUPATEN.length), label: t("cl.u4") },
]);

function rangka() {
  const cara = sumberHtml(`${esc(t("cl.cara"))} <a href="/metode#cek-lokasi">${esc(t("cl.cara.tautan"))}</a>`, t("cl.cara.label"));
  isi.innerHTML = [
    ex({ id: "clPilih", ikon: "sasaran", topik: t("cl.ey.pilih"), judulHtml: hlHtml("cl.t.pilih", t("cl.t.pilih.hl")), subHtml: esc(t("cl.s.pilih")), aksiHtml: cara,
      isiHtml: `<form class="cl-form" id="clForm" novalidate>
          <label class="cl-kolom">${ikon("sasaran", 18)}<span class="sr">${esc(t("cl.f.lat"))}</span><input id="clLat" name="lat" inputmode="decimal" autocomplete="off" placeholder="${esc(t("cl.f.lat"))}" aria-label="${esc(t("cl.f.lat"))}"></label>
          <label class="cl-kolom">${ikon("sasaran", 18)}<span class="sr">${esc(t("cl.f.lng"))}</span><input id="clLng" name="lng" inputmode="decimal" autocomplete="off" placeholder="${esc(t("cl.f.lng"))}" aria-label="${esc(t("cl.f.lng"))}"></label>
          <button type="submit" class="jm-tbl jm-tbl-utama cl-cek">${ikon("cari", 16)}<span>${esc(t("cl.f.cek"))}</span></button>
          <p class="cl-bantu" id="clGalatForm" role="alert" hidden>${esc(t("cl.f.salah"))}</p>
        </form>
        <div class="cl-peta" id="clPetaW"><div id="clKanvas" class="cl-kanvas" role="application" aria-label="${esc(t("cl.peta.label"))}"></div></div>
        <p class="cl-bantu">${ikon("info", 14)}<span>${esc(t("cl.peta.ajak"))}</span></p>` }),
    `<div id="clHasil" class="cl-hasil" aria-live="polite"><div class="cl-kosong">${ikon("sasaran", 28)}<p>${esc(t("cl.kosong"))}</p></div></div>`,
    ex({ id: "clMetode", ikon: "metode", topik: t("cl.ey.metode"), judulHtml: hlHtml("cl.t.metode", String(KOM.length)) + " " + hip(), subHtml: esc(t("cl.s.metode")),
      isiHtml: `<ul class="cl-kom">${KOM.map((k) => `<li class="cl-k cl-tk-${k}"><span class="cl-k-ik">${ikon(IK_KOM[k], 20)}</span><div><h3>${esc(t("cl.kom." + k))}</h3><p>${esc(t("cl.rumus." + k))}</p></div><span class="jm-pil cl-bobot">${esc(t("cl.bobot", { n: BOBOT[k] }))}</span></li>`).join("")}</ul>
        <div class="cl-celah"><h3>${ikon("peringatan", 18)}<span>${esc(t("cl.celah"))}</span></h3><ul>${[1, 2, 3, 4, 5].map((i) => `<li>${ikon("info", 14)}<span>${esc(t("cl.celah." + i))}</span></li>`).join("")}</ul></div>` }),
  ].join("");
  $("clForm").addEventListener("submit", (e) => { e.preventDefault(); kirimForm(); });
  pasangPilih();
}
rangka();

/* ---------- masukan ---------- */
function kirimForm() {
  const p = titikSah($("clLat").value.replace(",", "."), $("clLng").value.replace(",", "."));
  $("clGalatForm").hidden = !!p;
  if (p) setTitik(p.lat, p.lng, { geser: true });
}
function setTitik(lat, lng, { geser = false } = {}) {
  S.lat = lat; S.lng = lng; S.kab = "";
  $("clLat").value = String(lat); $("clLng").value = String(lng);
  $("clGalatForm").hidden = true;
  try { history.replaceState(null, "", `?lat=${lat}&lng=${lng}`); } catch (e) { /* abaikan */ }
  perbaruiPenanda(geser);
  $("clHasil").innerHTML = hantuHtml(4);
  const jalan = ++S.jalan;
  nanti(() => hitung(jalan));
}

/* ---------- hasil ---------- */
const kartu = (id, ikonNama, judul, isiHtml, taut = "", bukti = "") =>
  `<article class="cl-kartu cl-tk-${id}"><header><span class="cl-k-ik">${ikon(ikonNama, 20)}</span><h3>${esc(judul)}</h3>${bukti}</header>${isiHtml}${taut ? `<footer>${taut}</footer>` : ""}</article>`;
const tautan = (href, ik, kunci) => `<a class="jm-tbl jm-tbl-kecil" href="${esc(href)}">${ikon(ik, 14)}<span>${esc(t(kunci))}</span></a>`;
const baris = (a, b) => `<div class="cl-b"><dt>${esc(a)}</dt><dd>${b}</dd></div>`;
const kosongKartu = (kunci) => `<p class="cl-bantu">${ikon("info", 14)}<span>${esc(t(kunci))}</span></p>`;
const galatKartu = () => kosongKartu("cl.galat.data");
const PIL_BAHAYA = { rendah: "jm-pil-ok", sedang: "jm-pil-info", tinggi: "jm-pil-warn" };

function kartuWilayah(kode) {
  const kab = KABUPATEN.filter((k) => k.prov === kode);
  const sel = pilihHtml({ id: "clKab", ikon: "wilayah", label: t("cl.kab.pilih"), opsi: [["", t("cl.kab.tanpa"), "wilayah"], ...kab.map((k) => [k.kode, k.nama, "wilayah"])] });
  return kartu("wilayah", "wilayah", t("cl.kom.wilayah"),
    `<div class="cl-wil">${lambang(kode, 40)}<div><strong>${esc(NAMA_PROV.get(kode))}</strong><small>${esc(t("cl.kode_bps", { kode }))}</small></div></div>
     <div class="cl-kab"><p class="cl-fl">${esc(t("cl.kab.pilih"))}</p>${sel}<div id="clKabHasil" class="cl-kab-hasil"></div></div>`,
    tautan("/wilayah/" + kode, "wilayah", "cl.taut.wilayah") + tautan("/peluang?prov=" + kode, "kompas", "cl.taut.peluang"));
}
function kartuSumber(kode) {
  const a = ATLAS_PROV.get(kode);
  if (!a) return kartu("sumber", "tek-surya", t("cl.kom.sumber"), kosongKartu("cl.tanpa_data"), tautan("/topik?id=surya", "topik", "cl.taut.surya"));
  return kartu("sumber", "tek-surya", t("cl.kom.sumber"),
    `<p class="cl-angka"><b>${N(a.pvout_kwh_per_kwp_tahun)}</b><span>${esc(t("cl.sat.pvout"))}</span></p>
     <dl class="cl-d">${baris(t("cl.f.ghi"), N(a.ghi_kwh_per_m2_tahun) + " kWh/m2")}${baris(t("cl.f.sudut"), N(a.sudut_optimal_derajat) + " derajat")}${baris(t("cl.f.angin"), esc(t("cl.f.angin.tanpa")))}</dl>
     <p class="cl-bantu">${ikon("info", 14)}<span>${esc(t("cl.catatan.atlas"))}</span></p>`,
    tautan("/topik?id=surya", "topik", "cl.taut.surya") + tautan("/biaya-listrik", "kalkulator", "cl.taut.biaya"), buktiHtml("kajian"));
}
function kartuJaringan(j) {
  if (j.galat) return kartu("jaringan", "petir", t("cl.kom.jaringan"), galatKartu());
  const bagian = [];
  if (j.gardu) bagian.push(baris(t("cl.f.gardu"), `<b>${N(j.gardu.km, 1)} km</b> ${esc(j.gardu.item.nama || t("cl.f.tanpa_nama"))} (${N(j.gardu.item.teg_kv)} kV)`));
  if (j.saluran) bagian.push(baris(t("cl.f.saluran"), `<b>${N(j.saluran.km, 1)} km</b> ${esc(j.saluran.item.nama || t("cl.f.tanpa_nama"))} (${N(j.saluran.item.teg_kv)} kV)`));
  return kartu("jaringan", "petir", t("cl.kom.jaringan"),
    `${j.tercakup ? "" : `<p class="cl-peringatan">${ikon("peringatan", 14)}<span>${esc(t("cl.jaringan.luar"))}</span></p>`}<dl class="cl-d">${bagian.join("")}</dl>
     <p class="cl-bantu">${ikon("info", 14)}<span>${esc(t("cl.catatan.osm"))}</span></p>`,
    tautan("/peta", "peta", "cl.taut.peta") + tautan("/keandalan", "jam", "cl.taut.keandalan"), buktiHtml("kajian"));
}
function kartuLahan(l) {
  if (l.galat) return kartu("lahan", "peta", t("cl.kom.lahan"), galatKartu());
  const pil = l.kelas.map((k) => `<li><span class="cl-lahan cl-lahan-${LAHAN[k] >= 100 ? "tutup" : "pengurang"}">${ikon(LAHAN[k] >= 100 ? "blokir" : "peringatan", 14)}<span>${esc(t("cl.lahan." + k))}</span><b>-${N(LAHAN[k])}</b></span></li>`).join("");
  return kartu("lahan", "peta", t("cl.kom.lahan"),
    l.kelas.length ? `<ul class="cl-pil">${pil}</ul>${l.konsesi.length ? `<p class="cl-bantu">${esc(t("cl.lahan.konsesi", { nama: l.konsesi.slice(0, 2).map((k) => k.nama).join(", ") }))}</p>` : ""}` : `<p class="cl-bersih">${ikon("centang", 16)}<span>${esc(t("cl.lahan.bersih"))}</span></p>`,
    `${tautan("/risiko", "peringatan", "cl.taut.risiko")}${tautan("/lokasi-hijau", "denah", "cl.taut.hijau")}`, hip());
}
function kartuBahaya(b) {
  if (b.galat) return kartu("bahaya", "peringatan", t("cl.kom.bahaya"), galatKartu());
  const kelas = kelasBahaya(b.indeks);
  return kartu("bahaya", "peringatan", t("cl.kom.bahaya"),
    kelas ? `<p class="cl-angka"><b>${N(b.indeks * 100)}</b><span>${esc(t("cl.sat.indeks"))}</span></p><p><span class="jm-pil ${PIL_BAHAYA[kelas]}">${esc(t("cl.bahaya." + kelas))}</span></p>` : kosongKartu("cl.bahaya.tanpa"),
    tautan("/risiko", "peringatan", "cl.taut.risiko"), buktiHtml("kajian"));
}
function kartuBpp(kode) {
  const p = LH_PROV.get(kode), r = RADAR.provinsi?.[kode]?.mentah;
  if (!p?.bpp) return kartu("bpp", "tag", t("cl.kom.bpp"), kosongKartu("cl.tanpa_data"), tautan("/biaya-listrik", "kalkulator", "cl.taut.biaya"));
  return kartu("bpp", "tag", t("cl.kom.bpp"),
    `<p class="cl-angka"><b>${N(p.bpp.rp_kwh)}</b><span>Rp/kWh</span></p>
     <dl class="cl-d">${baris(t("cl.f.sistem"), esc((p.bpp.sistem || []).join(", ") || "-"))}${baris(t("cl.f.tahun"), N(p.bpp.tahun))}${r?.harga != null ? baris(t("cl.f.faktor"), N(r.harga, 1)) : ""}</dl>
     <p class="cl-bantu">${ikon("info", 14)}<span>${esc(t("cl.catatan.bpp"))}</span></p>`,
    tautan("/biaya-listrik", "kalkulator", "cl.taut.biaya") + tautan("/istilah#bpp", "kamus", "cl.taut.istilah_bpp") + tautan("/perizinan", "lencana", "cl.taut.izin"), buktiHtml("resmi"));
}
function kartuProyek(p) {
  if (p.galat) return kartu("proyek", "proyek", t("cl.kom.proyek"), galatKartu());
  const baris2 = p.daftar.map(({ item: b, km }) => {
    const mw = b.kapasitas?.[0]?.nilai;
    return `<li><a class="cl-pj" href="/p/${esc(b.id)}">${pilTek(b.teknologi)}<span class="cl-pj-n"><b>${esc(b.nama)}</b><small>${mw != null ? N(mw) + " MW, " : ""}${esc(t("cl.presisi." + b.lokasi.presisi))}</small></span><span class="jm-pil">${N(km, 1)} km</span></a></li>`;
  }).join("");
  return kartu("proyek", "proyek", t("cl.kom.proyek"),
    p.daftar.length ? `<ul class="cl-pjs">${baris2}</ul>` : kosongKartu("cl.proyek.tanpa"),
    tautan("/proyek", "proyek", "cl.taut.proyek") + tautan("/pelacak-proyek", "petir", "cl.taut.pelacak"), est());
}

function kartuSkor(r, kode) {
  if (r.skor == null) return ex({ id: "clSkor", ikon: "kalkulator", topik: t("cl.ey.skor"), judulHtml: esc(t("cl.t.skor0")) + " " + hip(), subHtml: esc(t("cl.s.skor0")), isiHtml: "" });
  const rows = KOM.filter((k) => r.kom[k]).map((k) => ({ label: t("cl.kom." + k), v: Math.max(0.5, r.kom[k].skor), teks: N(r.kom[k].skor), sorot: false }));
  rows.reduce((m, x) => (x.v < m.v ? x : m), rows[0]).sorot = true; // sorot = komponen terlemah
  const kelas = kelasSkor(r.skor);
  const gf = batang(rows, { maks: 100, label: t("cl.grafik.label") });
  return ex({ id: "clSkor", ikon: "kalkulator", topik: t("cl.ey.skor"), judulHtml: hlHtml("cl.t.skor", N(r.skor), { kelas: t("cl.skor." + kelas) }) + " " + hip(), subHtml: esc(t("cl.s.skor", { p: N(r.dasar) })),
    isiHtml: `<div class="cl-skor"><span class="jm-pil cl-skor-p ${KELAS_PIL[kelas]}"><b>${N(r.skor)}</b><span>${esc(t("cl.skor." + kelas))}</span></span><div class="cl-grafik">${gf}</div></div>
      <p class="cl-bantu">${ikon("info", 14)}<span>${esc(t("cl.skor.peringatan"))}</span></p>
      <div class="cl-aksi">${tautan("/lokasi-hijau", "denah", "cl.taut.hijau")}${tautan("/radar", "berlian", "cl.taut.radar")}${tautan("/peluang?prov=" + kode, "kompas", "cl.taut.peluang")}${tautan("/metode#cek-lokasi", "metode", "cl.cara.tautan")}</div>` });
}

async function hitung(jalan) {
  const p = { lat: S.lat, lng: S.lng };
  const kode = provinsiDi(p);
  const el = $("clHasil");
  if (jalan !== S.jalan) return;
  if (!kode) { el.innerHTML = `<div class="cl-kosong">${ikon("peringatan", 28)}<p>${esc(t("cl.luar"))}</p></div>`; return; }
  el.innerHTML = [ex({ id: "clHasilDetail", ikon: "lokasi", topik: t("cl.ey.hasil"), judulHtml: hlHtml("cl.t.hasil", `${N(p.lat, 4)}, ${N(p.lng, 4)}`) + " " + est(), subHtml: esc(t("cl.s.hasil", { prov: NAMA_PROV.get(kode) })), isiHtml: `<div class="cl-grid" id="clGrid">${hantuHtml(3)}</div>` })].join("");
  const [j, l, b, pj] = await Promise.all([jaringanDi(p), lahanDi(p), bahayaDi(p), proyekDi(p)]);
  if (jalan !== S.jalan) return;
  const lp = LH_PROV.get(kode), atlas = ATLAS_PROV.get(kode);
  const r = skorLokasi({ pvout: atlas?.pvout_kwh_per_kwp_tahun ?? null, jaringanKm: j.tercakup ? j.km : null, lahan: l.galat ? null : l.kelas, bahaya: b.galat ? null : b.indeks, bpp: lp?.bpp?.rp_kwh ?? null, bppSemua: BPP_SEMUA });
  $("clGrid").innerHTML = [kartuWilayah(kode), kartuSumber(kode), kartuJaringan(j), kartuLahan(l), kartuBahaya(b), kartuBpp(kode), kartuProyek(pj)].join("");
  el.insertAdjacentHTML("beforeend", kartuSkor(r, kode));
  pasangPilih();
  $("clKab")?.addEventListener("change", () => { S.kab = $("clKab").value; kabHasil(); });
}
function kabHasil() {
  const el = $("clKabHasil"), k = KABUPATEN.find((x) => x.kode === S.kab);
  if (!el) return;
  el.innerHTML = k ? `<span class="jm-pil jm-pil-info">${ikon("berlian", 14)}<span>${esc(t("cl.kab.radar", { skor: N(k.skor, 1) }))}</span></span> <a class="jm-tbl jm-tbl-kecil" href="/radar">${ikon("berlian", 14)}<span>${esc(t("cl.taut.radar"))}</span></a><small class="cl-bantu">${esc(t("cl.kab.catatan"))}</small>` : "";
}

/* ---------- peta ---------- */
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const titikGeo = () => ({ type: "FeatureCollection", features: S.lat == null ? [] : [{ type: "Feature", geometry: { type: "Point", coordinates: [S.lng, S.lat] }, properties: {} }] });
function perbaruiPenanda(geser) {
  if (!peta || !petaSiap) return;
  peta.getSource("cl")?.setData(titikGeo());
  if (geser) peta.easeTo({ center: [S.lng, S.lat], zoom: Math.max(peta.getZoom(), 7), duration: 400 });
}
function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("cl", { type: "geojson", data: titikGeo() });
  peta.addLayer({ id: "cl-halo", type: "circle", source: "cl", paint: { "circle-radius": 16, "circle-color": warna("--accent"), "circle-opacity": 0.2 } }, il || undefined);
  peta.addLayer({ id: "cl-titik", type: "circle", source: "cl", paint: { "circle-radius": 8, "circle-color": warna("--accent"), "circle-stroke-color": gelap() ? "#0b1726" : "#ffffff", "circle-stroke-width": 3 } }, il || undefined);
  pasangBatas(peta, warna, il, "cl-halo");
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "clKanvas", style: gaya(), bounds: BATAS_ID, minZoom: 2, maxZoom: 14, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    peta.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { pasangLapisan(); petaSiap = true; });
    new ResizeObserver(() => peta.resize()).observe($("clKanvas"));
    peta.once("idle", () => { peta.resize(); if (S.lat != null) perbaruiPenanda(true); });
    peta.on("click", (e) => { const p = titikSah(e.lngLat.lat, e.lngLat.lng); if (p) setTitik(p.lat, p.lng); });
    peta.getCanvas().style.cursor = "crosshair";
    new MutationObserver(() => { petaSiap = false; peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("clKanvas").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("cl.peta.galat"))}</p></div>`; });
}

/* ---------- mulai ---------- */
bukaPeta();
{
  const q = new URLSearchParams(location.search), p = q.has("lat") && q.has("lng") ? titikSah(q.get("lat"), q.get("lng")) : null;
  if (p) setTitik(p.lat, p.lng);
}
document.addEventListener("jm:bahasa", () => location.reload());
