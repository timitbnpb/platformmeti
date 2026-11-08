/* /lokasi-hijau: pencocok kawasan industri dan KEK untuk perusahaan bertarget RE100 atau net zero.
   Data = potret statis /data/lokasi_hijau.json (scripts/pipa/lokasi_hijau.mjs) + korporat.json. Skor dihitung di sini (lokasi_hijau_hitung.js),
   semua bobot Hipotesis. INP: chip dan isian berubah seketika; peringkat, peta, dan daftar menyusul lewat nanti(). */
import { t, angka } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, galatHtml, debounce } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, pilihHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { buktiHtml } from "/inti/bukti.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, BATAS_ID } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { pasangPilih } from "/inti/pilih.js";
import { TEKNOLOGI, PULAU, SEKTOR, BOBOT, AMBANG, peringkat, alasan, sektorDariGrup } from "/lokasi_hijau_hitung.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const KOM = Object.keys(BOBOT);
const IK_KOM = { ebt: "tek-surya", cukup: "grafik", gardu: "petir", bpp: "tag", izin: "lencana", proyek_prov: "proyek", proyek_radius: "lokasi", skema: "kartu", sektor: "pabrik" };
const TK_KOM = { ebt: "surya", cukup: "hidro", gardu: "listrik", bpp: "biaya", izin: "kebijakan", proyek_prov: "bio", proyek_radius: "panas", skema: "simpan", sektor: "industri" };
const IK_SEKTOR = { semua: "daftar2", pangan: "tek:bioenergi", kimia: "tek:hidrogen", logam: "tek:industri", tekstil: "tag", "kayu-kertas": "buku", digital: "laptop", otomotif: "petir", logistik: "koper" };
const ambil = (u) => fetch(u, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const lambang = (kode, u = 24) => `<img src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">`;
const urlAman = (u) => (/^https?:\/\//i.test(u || "") || /^\/[\w/.#?=&-]*$/.test(u || "") ? u : "");
const labTek = (k) => t("pj.tek." + k);
const est = () => buktiHtml("est");
const hip = () => buktiHtml("hipotesis");

const isi = $("lhIsi");
isi.innerHTML = hantuHtml(8);
let D, KOR;
try { [D, KOR] = await Promise.all([ambil("/data/lokasi_hijau.json"), ambil("/data/korporat.json")]); } catch (e) {
  isi.innerHTML = `<div class="lh-galat">${galatHtml("jaringan")}</div>`;
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
const KAW = new Map(D.kawasan.map((k) => [k.id, k]));
const PRSH = KOR.perusahaan.map((p) => ({ ...p, sek: sektorDariGrup(p.sektor_grup) })).sort((a, b) => a.nama.localeCompare(b.nama, "id"));
const S = { pr: "", mw: 50, tek: ["surya"], sektor: "semua", pulau: [], titik: false, hal: 1, sel: "" };
let HASIL = [];

/* ---------- kepala ---------- */
const nTitik = D.kawasan.filter((k) => k.titik_tepat).length;
khUbin("lhUbin", [
  { ikon: "denah", nilai: N(D.kawasan.length), label: t("lh2.u1") },
  { ikon: "lencana", nilai: N(D.kawasan.filter((k) => k.jenis === "kek").length), label: t("lh2.u2") },
  { ikon: "lokasi", nilai: N(nTitik), label: t("lh2.u3") },
  { ikon: "petir", nilai: N(D.meta.jumlah_jaringan), label: t("lh2.u4") },
]);

/* ---------- kerangka ---------- */
const chip = (jenis, k, ikonH, label, n) => `<button type="button" class="lh-chip" data-${jenis}="${esc(k)}" aria-pressed="false">${ikonH}<span>${esc(label)}</span>${n != null ? `<small>${esc(N(n))}</small>` : ""}</button>`;
const tekChip = (k) => chip("tek", k, `<span class="lh-tki lh-tek-${esc(k)}">${ikonTek(k)}</span>`, labTek(k));
const pulauN = (p) => D.kawasan.filter((k) => k.pulau === p).length;
const opsiPr = [["", t("lh2.f.pr.tanpa"), "orang"], ...PRSH.map((p) => [p.id, p.nama, IK_SEKTOR[p.sek]])];
const opsiSek = Object.keys({ semua: 1, ...SEKTOR }).map((k) => [k, t("lh2.sektor." + k), IK_SEKTOR[k]]);
const cara = () => sumberHtml(`${esc(t("lh2.cara"))} <a href="#metode">${esc(t("lh2.cara.tautan"))}</a>`, t("lh2.cara.label"));
const ex = (o) => exHtml({ tingkat: "h2", ...o });

function rangka() {
  isi.innerHTML = [
    ex({ id: "lhForm", ikon: "kalkulator", topik: t("lh2.ey.form"), judulHtml: hlHtml("lh2.t.form", t("lh2.t.form.hl")) + " " + hip(), subHtml: esc(t("lh2.s.form")), aksiHtml: cara(),
      isiHtml: `<div class="lh-form">
        <div class="lh-f">${pilihHtml({ id: "lhPr", ikon: "gedung", label: t("lh2.f.pr"), opsi: opsiPr })}<p class="lh-fl">${esc(t("lh2.f.pr"))}</p></div>
        <div class="lh-f"><label class="lh-mw">${ikon("petir", 18)}<span class="sr">${esc(t("lh2.f.mw"))}</span><input id="lhMw" type="number" inputmode="decimal" min="1" max="100000" step="1" value="${S.mw}"><span class="lh-mw-sat">MW</span></label><p class="lh-fl">${esc(t("lh2.f.mw"))}</p></div>
        <div class="lh-f">${pilihHtml({ id: "lhSek", ikon: "pabrik", label: t("lh2.f.sektor"), opsi: opsiSek })}<p class="lh-fl">${esc(t("lh2.f.sektor"))}</p></div>
        <div class="lh-f lh-f-lebar"><p class="lh-fl">${esc(t("lh2.f.tek"))}</p><div class="lh-seg lh-seg-tek" id="lhTek" role="group" aria-label="${esc(t("lh2.f.tek"))}">${TEKNOLOGI.map(tekChip).join("")}</div></div>
        <div class="lh-f lh-f-lebar"><p class="lh-fl">${esc(t("lh2.f.pulau"))}</p><div class="lh-seg lh-seg-pulau" id="lhPulau" role="group" aria-label="${esc(t("lh2.f.pulau"))}">${PULAU.map((p) => chip("pulau", p, ikon("peta", 16), t("lh2.pulau." + p), pulauN(p))).join("")}</div></div>
        <div class="lh-f lh-f-lebar"><p class="lh-fl">${esc(t("lh2.f.cakup"))}</p><div class="lh-seg lh-seg-cakup" id="lhCakup" role="group" aria-label="${esc(t("lh2.f.cakup"))}">${chip("cakup", "semua", ikon("daftar2", 16), t("lh2.f.cakup.semua"), D.kawasan.length)}${chip("cakup", "titik", ikon("lokasi", 16), t("lh2.f.cakup.titik"), nTitik)}</div></div>
        <div class="lh-pr" id="lhPrKartu" hidden></div></div>` }),
    ex({ id: "lhPeta", ikon: "peta", topik: t("lh2.ey.peta"), judulHtml: `<span id="lhJPeta"></span> ${est()}`, subHtml: esc(t("lh2.s.peta")), aksiHtml: aksiHtml({ csv: false, pdf: false, sajian: false }),
      isiHtml: `<div class="lh-peta" id="lhPetaW"><div id="lhKanvas" class="lh-kanvas" role="application" aria-label="${esc(t("lh2.peta.label"))}"></div><div id="lhTip" class="lh-tip" role="status" hidden></div>
        <details class="lh-panel" id="lhPanel"${innerWidth >= 1000 ? " open" : ""}><summary><span>${esc(t("lh2.panel"))}</span></summary><div class="lh-panel-isi" id="lhPanelIsi"></div></details></div>` }),
    ex({ id: "lhRank", ikon: "bintang", topik: t("lh2.ey.rank"), judulHtml: `<span id="lhJRank"></span> ${est()}`, subHtml: esc(t("lh2.s.rank")), aksiHtml: aksiHtml({ csv: false, pdf: false, sajian: false }),
      isiHtml: `<ol class="lh-daftar" id="lhDaftar" aria-live="polite"></ol><div class="lh-lagi" id="lhLagi"></div>` }),
    ex({ id: "metode", ikon: "metode", topik: t("lh2.ey.metode"), judulHtml: hlHtml("lh2.t.metode", String(KOM.length)) + " " + hip(), subHtml: esc(t("lh2.s.metode")),
      isiHtml: `<ul class="lh-kom">${KOM.map((k) => `<li class="lh-k lh-tk-${TK_KOM[k]}"><span class="lh-k-ik">${ikon(IK_KOM[k], 20)}</span><div><h3>${esc(t("lh2.kom." + k, { r: D.radius_km }))}</h3><p>${esc(t("lh2.rumus." + k, { a: AMBANG.gardu_dekat_km, b: AMBANG.gardu_jauh_km, c: AMBANG.proyek_penuh, r: D.radius_km }))}</p></div><span class="jm-pil lh-bobot">${esc(t("lh2.bobot", { n: BOBOT[k] }))}</span></li>`).join("")}</ul>
        <div class="lh-celah"><h3>${ikon("peringatan", 18)}<span>${esc(t("lh2.celah"))}</span></h3><ul>${D.meta.celah.map((c) => `<li>${ikon("info", 14)}<span>${esc(c)}</span></li>`).join("")}</ul></div>
        <p class="lh-sumber">${D.sumber.map((s) => { const u = urlAman(s.url); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul); }).join(" ")}</p>` }),
  ].join("");
  $("lhDaftar").addEventListener("click", (e) => { const b = e.target.closest("[data-buka]"); if (b) bukaRincian(b.dataset.buka); });
  $("lhLagi").addEventListener("click", (e) => { const b = e.target.closest("[data-hal]"); if (b && !b.disabled) { S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); nanti(() => { gambarDaftar(); $("lhRank").scrollIntoView({ block: "start" }); }); } });
  $("lhPanelIsi").addEventListener("click", (e) => { const b = e.target.closest("[data-buka]"); if (b) { pilihKawasan(b.dataset.buka); bukaRincian(b.dataset.buka); } });
  pasangPilih();
  geserPanel($("lhPanel"), { kunci: "lh", batas: $("lhPetaW") });
}
rangka();

/* ---------- masukan ---------- */
function segarkanChip() {
  for (const b of $("lhTek").querySelectorAll("[data-tek]")) b.setAttribute("aria-pressed", String(S.tek.includes(b.dataset.tek)));
  for (const b of $("lhPulau").querySelectorAll("[data-pulau]")) b.setAttribute("aria-pressed", String(S.pulau.includes(b.dataset.pulau)));
  for (const b of $("lhCakup").querySelectorAll("[data-cakup]")) b.setAttribute("aria-pressed", String((b.dataset.cakup === "titik") === S.titik));
}
const ganti = (a, k) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]);
$("lhTek").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tek]"); if (!b) return;
  const baru = ganti(S.tek, b.dataset.tek); if (!baru.length) return; // minimal satu teknologi
  S.tek = baru; segarkanChip(); nanti(hitungUlang);
});
$("lhPulau").addEventListener("click", (e) => { const b = e.target.closest("[data-pulau]"); if (!b) return; S.pulau = ganti(S.pulau, b.dataset.pulau); segarkanChip(); nanti(hitungUlang); });
$("lhCakup").addEventListener("click", (e) => { const b = e.target.closest("[data-cakup]"); if (!b) return; S.titik = b.dataset.cakup === "titik"; segarkanChip(); nanti(hitungUlang); });
$("lhMw").addEventListener("input", debounce(() => { const v = Number($("lhMw").value); if (v > 0) { S.mw = v; nanti(hitungUlang); } }, 200));
$("lhSek").addEventListener("change", () => { S.sektor = $("lhSek").value; nanti(hitungUlang); });
$("lhPr").addEventListener("change", () => {
  S.pr = $("lhPr").value; const p = PRSH.find((x) => x.id === S.pr);
  if (p) { S.sektor = p.sek; $("lhSek").value = p.sek; }
  kartuPerusahaan(p); nanti(hitungUlang);
});
function kartuPerusahaan(p) {
  const el = $("lhPrKartu"); el.hidden = !p; if (!p) return;
  const nz = p.sbti.net_zero === "disetujui", re = p.re100;
  const pill = (kelas, ik, teks) => `<span class="jm-pil ${kelas}">${ikon(ik, 14)}<span>${esc(teks)}</span></span>`;
  el.innerHTML = `<span class="lh-pr-ik">${ikon("gedung", 20)}</span><div class="lh-pr-t"><b>${esc(p.nama)}</b><small>${esc(p.sektor_grup)} (${esc(p.negara)})</small></div>
    <div class="lh-pr-p">${re ? pill("jm-pil-ok", "perisai", t("lh2.pr.re100", { tahun: re.tahun_target })) : pill("jm-pil-warn", "perisai", t("lh2.pr.tanpa_re100"))}
    ${nz ? pill("jm-pil-ok", "bendera", t("lh2.pr.nz", { tahun: p.sbti.tahun_net_zero ?? "-" })) : pill("jm-pil-warn", "bendera", t("lh2.pr.sbti." + (p.sbti.status || "komitmen")))}</div>`;
}

/* ---------- hitung dan gambar ---------- */
const kelasSkor = (s) => (s >= 70 ? "jm-pil-ok" : s >= 45 ? "jm-pil-info" : "jm-pil-warn");
const warnaSkor = (s) => (s >= 70 ? "ok" : s >= 45 ? "info" : "warn");
function pilAlasan(a, r) {
  const x = r.kom[a.id];
  return `<li><span class="lh-pil lh-tk-${TK_KOM[a.id]}${a.arah === "kuat" ? "" : " lh-pil-lemah"}" title="${esc(faktaTeks(a.id, x))}">${ikon(a.arah === "kuat" ? IK_KOM[a.id] : "peringatan", 14)}<span>${esc(t("lh2.al." + a.id + "." + a.arah))}</span></span></li>`;
}
function faktaTeks(id, x) {
  const v = x.nilai || {};
  if (id === "ebt") return t("lh2.f.ebt", { det: Object.entries(v.per_tek || {}).filter(([, n]) => n != null).map(([k, n]) => `${labTek(k)} ${k === "surya" ? N(n) + " kWh/kWp" : N(n) + " MW"}`).join(", ") });
  if (id === "cukup") return t("lh2.f.cukup", { mw: N(v.potensi_mw), x: N(v.rasio, v.rasio < 10 ? 1 : 0) });
  if (id === "gardu") return t("lh2.f.gardu", { km: N(v.km, 1), nama: v.km === v.saluran_km ? (v.saluran || t("lh2.f.saluran")) : (v.gardu || t("lh2.f.gardu_n")) });
  if (id === "bpp") return t("lh2.f.bpp", { rp: N(v.rp_kwh), th: v.tahun });
  if (id === "izin") return t("lh2.f.izin", { s: N(v.skor) });
  if (id === "proyek_prov") return t("lh2.f.proyek_prov", { mw: N(v.mw), n: N(v.n) });
  if (id === "proyek_radius") return t("lh2.f.proyek_radius", { n: N(v.n), mw: N(v.mw), km: D.radius_km });
  if (id === "skema") return t("lh2.f.skema." + v.tingkat, { n: v.daftar.length, nama: v.daftar.map((d) => d.pembeli).join(", ") });
  if (id === "sektor") return t("lh2.f.sektor_k", { k: (v.kegiatan || []).slice(0, 3).join(", ") });
  return "";
}
const titikTeks = (k) => (k.titik_tepat ? t("lh2.titik.tepat") : k.lat != null ? t("lh2.titik.kab") : t("lh2.titik.tidak"));
const jenisPil = (k) => `<span class="jm-pil ${k.jenis === "kek" ? "jm-pil-ok" : "jm-pil-info"}">${ikon(k.jenis === "kek" ? "lencana" : "pabrik", 14)}<span>${esc(t(k.jenis === "kek" ? "lh2.jenis.kek" : "lh2.jenis.ki"))}</span></span>`;

function hitungUlang() {
  HASIL = peringkat(D, { mw: S.mw, tek: S.tek, sektor: S.sektor, pulau: S.pulau, hanyaTitik: S.titik });
  S.hal = 1;
  gambarJudul(); gambarDaftar(); gambarPanel(); perbaruiPeta();
}
function gambarJudul() {
  const n = HASIL.length, atas = HASIL[0];
  $("lhJRank").innerHTML = n ? hlHtml("lh2.t.rank", atas.k.nama, { n: N(n) }) : esc(t("lh2.t.rank0"));
  $("lhJPeta").innerHTML = hlHtml("lh2.t.peta", N(HASIL.filter((r) => r.k.lat != null).length), { n: N(n) });
}
function barisHtml(r) {
  const k = r.k, a = alasan(r);
  return `<li class="lh-baris${S.sel === k.id ? " lh-baris-sel" : ""}" data-id="${esc(k.id)}">
    <span class="lh-no">${r.no}</span>
    <div class="lh-nama">${lambang(k.kode, 36)}<div><button type="button" class="lh-nama-b" data-buka="${esc(k.id)}">${esc(k.nama)}</button><small>${jenisPil(k)} <span>${esc(k.provinsi)}</span></small></div></div>
    <div class="lh-skor"><span class="jm-pil lh-skor-p ${kelasSkor(r.skor)}"><b>${N(r.skor)}</b></span><small>${esc(t("lh2.dasar", { p: N(r.dasar) }))}</small></div>
    <ul class="lh-alasan">${a.length ? a.map((x) => pilAlasan(x, r)).join("") : `<li class="lh-bantu">${esc(t("lh2.alasan.netral"))}</li>`}</ul>
    <div class="lh-aksi"><a class="jm-tbl" href="/radar" title="${esc(t("lh2.radar"))}">${ikon("berlian", 16)}<span>${esc(t("lh2.radar"))}</span></a><a class="jm-tbl" href="/investasi?prov=${esc(k.kode)}#peluang" title="${esc(t("lh2.peluang"))}">${ikon("kompas", 16)}<span>${esc(t("lh2.peluang"))}</span></a></div></li>`;
}
const PER = 10;
function gambarDaftar() {
  const ul = $("lhDaftar"), n = HASIL.length;
  ul.innerHTML = n ? HASIL.slice((S.hal - 1) * PER, S.hal * PER).map(barisHtml).join("") : `<li class="lh-kosong">${ikon("info", 24)}<p>${esc(t("lh2.kosong"))}</p></li>`;
  $("lhLagi").innerHTML = paginasiHtml({ hal: S.hal, total: n, per: PER, satuan: "lh2.u.kawasan" });
}
function gambarPanel() {
  const top = HASIL.slice(0, 5), tanpa = HASIL.filter((r) => r.k.lat == null).length;
  $("lhPanelIsi").innerHTML = `<ul class="lh-leg"><li><i class="lh-t-ok"></i><span>${esc(t("lh2.leg.tinggi"))}</span></li><li><i class="lh-t-info"></i><span>${esc(t("lh2.leg.sedang"))}</span></li><li><i class="lh-t-warn"></i><span>${esc(t("lh2.leg.rendah"))}</span></li></ul>
    <h4>${esc(t("lh2.panel.top"))}</h4><ol class="lh-top">${top.map((r) => `<li><button type="button" data-buka="${esc(r.k.id)}"><span class="lh-no">${r.no}</span>${lambang(r.k.kode, 20)}<span class="lh-top-n">${esc(r.k.nama)}</span><span class="jm-pil ${kelasSkor(r.skor)}"><b>${N(r.skor)}</b></span></button></li>`).join("")}</ol>
    ${tanpa ? `<p class="lh-bantu">${esc(t("lh2.peta.tanpa", { n: N(tanpa) }))}</p>` : ""}<p class="lh-bantu">${esc(t("lh2.peta.titik"))}</p>`;
}

/* ---------- peta ---------- */
let peta = null, petaSiap = false;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const fitur = () => ({ type: "FeatureCollection", features: HASIL.filter((r) => r.k.lat != null).map((r) => ({ type: "Feature", geometry: { type: "Point", coordinates: [r.k.lng, r.k.lat] }, properties: { id: r.k.id, s: Math.round(r.skor), no: r.no, tepat: r.k.titik_tepat ? 1 : 0 } })) });
function perbaruiPeta() {
  if (!peta || !petaSiap) return;
  peta.getSource("lh")?.setData(fitur());
  peta.setFilter("lh-sel", ["==", ["get", "id"], S.sel]);
}
function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("lh", { type: "geojson", data: fitur() });
  peta.addLayer({ id: "lh-titik", type: "circle", source: "lh", paint: {
    "circle-radius": ["case", ["==", ["get", "tepat"], 1], 9, 7],
    "circle-color": ["step", ["get", "s"], warna("--warn"), 45, warna("--info"), 70, warna("--ok")],
    "circle-stroke-color": gelap() ? "#0b1726" : "#ffffff", "circle-stroke-width": 2, "circle-opacity": 0.92 } }, il || undefined);
  peta.addLayer({ id: "lh-sel", type: "circle", source: "lh", filter: ["==", ["get", "id"], S.sel], paint: { "circle-radius": 14, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": warna("--sorot"), "circle-stroke-width": 3 } });
  pasangBatas(peta, warna, il, "lh-titik");
}
function tampilTip(id, pt) {
  const r = HASIL.find((x) => x.k.id === id), tip = $("lhTip"); if (!r) return;
  tip.innerHTML = `<header>${lambang(r.k.kode, 32)}<div><strong>${esc(r.k.nama)}</strong><small>${esc(r.k.provinsi)}</small></div></header>
    <p><span>${esc(t("lh2.tip.skor"))}</span><b>${N(r.skor)}</b></p><ul><li><span>${esc(t("lh2.tip.peringkat"))}</span><b>${r.no} / ${N(HASIL.length)}</b></li><li><span>${esc(t("lh2.dasar_l"))}</span><b>${N(r.dasar)}%</b></li><li><span>${esc(t("lh2.titik"))}</span><b>${esc(titikTeks(r.k))}</b></li></ul><small class="lh-ajak">${esc(t("lh2.tip.ajak"))}</small>`;
  tip.hidden = false;
  const w = $("lhKanvas").clientWidth, h = $("lhKanvas").clientHeight;
  tip.style.left = Math.max(8, Math.min(w - tip.offsetWidth - 8, pt.x + 16)) + "px";
  tip.style.top = Math.max(8, Math.min(h - tip.offsetHeight - 8, pt.y + 16)) + "px";
}
function pasPeta() {
  const p = HASIL.filter((r) => r.k.lat != null); if (!peta || !p.length) return;
  const b = new maplibregl.LngLatBounds(); for (const r of p) b.extend([r.k.lng, r.k.lat]);
  peta.fitBounds(b, { padding: padPanel(), maxZoom: 7, duration: 0 });
}
const padPanel = () => {
  const box = $("lhKanvas").getBoundingClientRect(), pad = { top: 40, bottom: 40, left: 40, right: 40 };
  if (innerWidth < 1000) return pad;
  const r = $("lhPanel").getBoundingClientRect(), tengah = r.left + r.width / 2 - box.left;
  if (tengah > box.width / 2) pad.right = Math.max(pad.right, box.right - r.left + 16); else pad.left = Math.max(pad.left, r.right - box.left + 16);
  return pad;
};
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "lhKanvas", style: gaya(), bounds: BATAS_ID, minZoom: 2, maxZoom: 12, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    peta.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { pasangLapisan(); petaSiap = true; });
    new ResizeObserver(() => peta.resize()).observe($("lhKanvas"));
    peta.once("idle", () => { peta.resize(); pasPeta(); });
    peta.on("click", "lh-titik", (e) => { const id = e.features[0].properties.id; pilihKawasan(id); bukaRincian(id); });
    peta.on("mousemove", "lh-titik", (e) => { peta.getCanvas().style.cursor = "pointer"; tampilTip(e.features[0].properties.id, e.point); });
    peta.on("mouseleave", "lh-titik", () => { peta.getCanvas().style.cursor = ""; $("lhTip").hidden = true; });
    new MutationObserver(() => { petaSiap = false; peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("lhKanvas").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("lh2.peta.galat"))}</p></div>`; });
}
function pilihKawasan(id) {
  S.sel = id; perbaruiPeta();
  const k = KAW.get(id);
  if (peta && k?.lat != null) peta.easeTo({ center: [k.lng, k.lat], zoom: Math.max(peta.getZoom(), 6), duration: 400 });
}

/* ---------- rincian (modal) ---------- */
function bukaRincian(id) {
  const r = HASIL.find((x) => x.k.id === id) ?? null, k = KAW.get(id); if (!k) return;
  S.sel = id; perbaruiPeta();
  const dlg = $("lhDlg"), kom = r?.kom ?? {};
  const baris = KOM.map((c) => {
    const x = kom[c];
    return `<li class="lh-m-b lh-tk-${TK_KOM[c]}${x ? "" : " lh-m-kosong"}"><span class="lh-k-ik">${ikon(IK_KOM[c], 18)}</span><div class="lh-m-t"><b>${esc(t("lh2.kom." + c, { r: D.radius_km }))}</b><small>${x ? esc(faktaTeks(c, x)) : esc(t("lh2.m.tanpa_data"))}</small></div>
      <span class="lh-m-s">${x ? `<span class="jm-pil ${kelasSkor(x.skor)}"><b>${N(x.skor)}</b></span>` : `<span class="lh-redup" title="${esc(t("lh2.m.tanpa_data"))}">-</span>`}</span><span class="lh-m-w">${esc(t("lh2.bobot", { n: BOBOT[c] }))}</span></li>`;
  }).join("");
  const dekat = (kom.proyek_radius?.nilai.daftar ?? []).slice(0, 6);
  const ppa = kom.skema?.nilai.daftar ?? [];
  const fakta = [[t("lh2.m.provinsi"), k.provinsi], [t("lh2.titik"), titikTeks(k)], [t("lh2.m.luas"), k.luas_ha ? N(k.luas_ha) + " ha" : "-"], [t("lh2.m.pengelola"), k.pengelola || "-"], [t("lh2.m.kegiatan"), k.kegiatan?.length ? k.kegiatan.slice(0, 4).join(", ") : "-"]];
  dlg.innerHTML = `<header class="lh-m-h">${lambang(k.kode, 44)}<div><h2 id="lhDlgJ">${esc(k.nama)}</h2><p>${jenisPil(k)} <span>${esc(k.provinsi)}</span></p></div>
      <button type="button" class="jm-tbl lh-m-x" data-tutup aria-label="${esc(t("lh2.m.tutup"))}">${ikon("silang", 16)}</button></header>
    <div class="lh-m-skor">${r ? `<span class="jm-pil lh-skor-p ${kelasSkor(r.skor)}"><b>${N(r.skor)}</b></span><div><p>${esc(t("lh2.m.skor", { no: r.no, n: N(HASIL.length) }))} ${est()} ${hip()}</p><small>${esc(t("lh2.dasar", { p: N(r.dasar) }))}</small></div>` : `<p>${esc(t("lh2.m.tersaring"))}</p>`}</div>
    <dl class="lh-m-fakta">${fakta.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>
    <h3>${esc(t("lh2.m.komponen"))}</h3><ul class="lh-m-daftar">${baris}</ul>
    <div class="lh-m-dua"><section><h3>${ikon("proyek", 16)}<span>${esc(t("lh2.m.proyek", { km: D.radius_km }))}</span></h3>${dekat.length ? `<ul class="lh-m-l">${dekat.map((p) => `<li><span class="lh-tki lh-tek-${esc(p.tek)}">${ikonTek(p.tek)}</span><b>${esc(p.nama)}</b><small>${esc(labTek(p.tek))}, ${p.mw != null ? N(p.mw) + " MW, " : ""}${N(p.km, 1)} km</small></li>`).join("")}</ul>` : `<p class="lh-bantu">${esc(t(k.titik_tepat ? "lh2.m.proyek0" : "lh2.m.proyek_tt"))}</p>`}</section>
      <section><h3>${ikon("kartu", 16)}<span>${esc(t("lh2.m.ppa"))}</span></h3>${ppa.length ? `<ul class="lh-m-l">${ppa.map((p) => `<li><b>${esc(p.pembeli)}</b><small>${esc(p.skema)}${p.mw ? ", " + N(p.mw, 1) + " MW" : ""}, ${esc(p.lokasi)}${urlAman(p.url) ? ` <a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(t("lh2.m.sumber"))}</a>` : ""}</small></li>`).join("")}</ul>` : `<p class="lh-bantu">${esc(t("lh2.m.ppa0"))}</p>`}</section></div>
    <footer class="lh-m-k"><a class="jm-tbl jm-tbl-utama" href="/investasi?prov=${esc(k.kode)}#peluang">${ikon("kompas", 16)}<span>${esc(t("lh2.peluang"))}</span></a><a class="jm-tbl" href="/radar">${ikon("berlian", 16)}<span>${esc(t("lh2.radar"))}</span></a><a class="jm-tbl" href="/wilayah/${esc(k.kode)}">${ikon("wilayah", 16)}<span>${esc(t("lh2.m.profil"))}</span></a>${urlAman(k.url) ? `<a class="jm-tbl" href="${esc(k.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("lh2.m.sumber_k"))}</span></a>` : ""}</footer>`;
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  for (const el of $("lhDaftar").querySelectorAll(".lh-baris-sel")) el.classList.remove("lh-baris-sel");
  $("lhDaftar").querySelector(`[data-id="${CSS.escape(id)}"]`)?.classList.add("lh-baris-sel");
}
$("lhDlg").addEventListener("click", (e) => { if (e.target.closest("[data-tutup]") || e.target === $("lhDlg")) $("lhDlg").close(); });

/* ---------- mulai ---------- */
segarkanChip();
hitungUlang();
bukaPeta();
document.addEventListener("jm:bahasa", () => location.reload());
