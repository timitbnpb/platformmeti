/* Bagian beranda di bawah lipatan: sensus per teknologi, halaman lain, cara data dibuat, akses data.
   Dirender saat mendekati layar (IntersectionObserver); angka dari public/data/*.json. */
import { t, ada, angka, tanggal } from "/i18n.js";
import { esc, hantuHtml, nanti } from "/inti/umum.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { sumberHtml, exHtml } from "/inti/komponen.js";
import { BATAS_ID, rapikanPeta, pasangBatas, geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { muat, label, sembunyi } from "/publik.js";
import { geserPanel } from "/inti/panel_geser.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { kontenBeranda, daftarKonten } from "/inti/konten_beranda.js";

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
const TEK_WARNA = { surya: "--data4", bayu: "--data3", hidro: "--data5", "panas-bumi": "--warn", bioenergi: "--data2", "biomassa-sampah": "--data1", penyimpanan: "--ink2", nuklir: "--bad" };
const jml = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
const mwDari = (p) => Number(p.kapasitas?.[0]?.nilai) || 0;
const $ = (id) => document.getElementById(id);
/* berkas foto, pembuat, kunci lisensi: sama dengan public/img/beranda/KREDIT.md */
const FOTO = { surya: ["surya-cirata", "indonesiagoid", "pd"], bayu: ["bayu-sidrap", "USAID Indonesia", "pd"], hidro: ["hidro-saguling", "NFarras", "bysa4"], "panas-bumi": ["panas-bumi-sibayak", "Kenrick95", "bysa3"],
  bioenergi: ["bioenergi-sawit", "Ojiribeka Chidera", "bysa4"], "biomassa-sampah": ["biomassa-bantargebang", "Kuncoro Widyo Rumpoko", "bysa4"], nuklir: ["nuklir-siwabessy", "Bkusmono", "pd"], penyimpanan: ["penyimpanan-baterai", "Kecko", "by2"] };
const LISENSI = { pd: "beranda.foto.lis.pd", bysa4: "CC BY-SA 4.0", bysa3: "CC BY-SA 3.0", by2: "CC BY 2.0" };
const hantu = (id, n = 3) => { const e = $(id); if (e && !e.childElementCount) e.innerHTML = hantuHtml(n); };
/** Judul satu kalimat: {n} diganti angka kunci berkelas .jm-hl. */
const jud = (kunci, nilai, par = {}) => esc(t(kunci, { ...par, n: "\u0001" })).replace("\u0001", `<span class="jm-hl">${esc(nilai)}</span>`);
/** Ganti hanya kepala kartu ex (peta tidak boleh dibuat ulang saat bahasa berganti). */
const gantiKepala = (el, o) => { const k = el.querySelector(".jm-ex-hd"), b = document.createElement("div"); b.innerHTML = exHtml(o); k.replaceWith(b.querySelector(".jm-ex-hd")); };

async function teknologi() {
  const foto = $("foto");
  try {
    const pro = await muat("proyek");
    const kartu = TEK.map((k) => {
      const ps = pro.baris.filter((p) => p.teknologi === k), mw = jml(ps, mwDari);
      return `<a class="jm-bb-foto" href="/teknologi/${k}"><img src="/img/beranda/${FOTO[k][0]}.webp" width="800" height="600" loading="lazy" alt=""><span class="jm-bb-foto-ik jm-bb-t-${k}" aria-hidden="true">${IKON_TEK[k] || IKON[k]}</span><span class="jm-bb-foto-isi"><span class="jm-pil">${esc(angka(ps.length))} ${esc(t("beranda.tek.n"))}</span><strong>${esc(label("beranda.tek.", k))}</strong><small>${esc(t("beranda.foto." + k))}</small><b>${mw ? esc(angka(mw)) + " MW" : "-"}</b></span></a>`;
    }).join("");
    const daftar = TEK.map((k) => `${t(ada("beranda.foto.cr." + k) ? "beranda.foto.cr." + k : "beranda.foto." + k)} (${FOTO[k][1]}, ${LISENSI[FOTO[k][2]].startsWith("beranda") ? t(LISENSI[FOTO[k][2]]) : LISENSI[FOTO[k][2]]})`).join("; ");
    foto.innerHTML = exHtml({ ikon: "tek-surya", topik: t("beranda.s05.l"), judulHtml: jud("beranda.ex.tek.j", angka(pro.baris.length), { k: angka(TEK.length) }), subHtml: esc(t("beranda.ex.tek.s")), aksiHtml: aksiHtml() + sumberHtml(`${esc(t("beranda.sensus.sumber", { tanggal: tanggal(pro.dibangun_pada) }))} ${esc(t("beranda.foto.kredit", { daftar }))}`), isiHtml: `<div class="jm-bb-foto-kisi">${kartu}</div>` });
  } catch (e) { sembunyi(foto, e); }
}

async function bento() {
  const el = $("bento");
  try {
    const [org, pro, rt, pk, wil, reg, geo] = await Promise.all([...["organisasi", "proyek", "rantai_plts", "pustaka", "wilayah", "regulasi"].map(muat), geoProvinsi()]);
    const tahun = +String(pro.dibangun_pada).slice(0, 4);
    // satu panel peta Indonesia (garis provinsi dari /geo/provinsi.json), organisasi bertitik, proyek titik abu-abu; empat kartu tautan melayang di atas laut
    const W = 560, H = 212, X = (lng) => ((lng - BATAS_ID[0][0]) / (BATAS_ID[1][0] - BATAS_ID[0][0])) * W, Y = (lat) => ((BATAS_ID[1][1] - lat) / (BATAS_ID[1][1] - BATAS_ID[0][1])) * H;
    const loc = pro.baris.filter((p) => Number.isFinite(p.lokasi?.lat)), og = org.baris.filter((o) => Number.isFinite(o.lokasi?.lat));
    const nama = {}; for (const w of wil.baris) nama[w.kode] = w.nama;
    const nOrg = {}, nPro = {};
    for (const o of og) { const k = o.lokasi?.provinsi; if (k) nOrg[k] = (nOrg[k] || 0) + 1; }
    for (const p of pro.baris) { const k = p.lokasi?.provinsi; if (k) nPro[k] = (nPro[k] || 0) + 1; }
    const dot = (cls, r) => (x) => `<circle class="${cls}" cx="${X(x.lokasi.lng).toFixed(1)}" cy="${Y(x.lokasi.lat).toFixed(1)}" r="${r}"/>`;
    const prov = geo ? jalurPerProvinsi(geo, W, H).map((p) => `<path class="jm-bb-prov" data-p="${esc(nama[p.kode] || "")}" d="${p.d}"/>`).join("") : "";
    const mini = `<svg class="jm-bb-mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("beranda.bt.peta"))}">${prov}${loc.map(dot("jm-bb-pro", 1.7)).join("")}${og.map(dot("jm-bb-org", 2.8)).join("")}</svg>`;
    const lewat = pro.baris.filter((p) => p.status?.[0]?.nilai !== "beroperasi" && p.cod_target?.length && Math.min(...p.cod_target.map((c) => c.nilai)) < tahun);
    const top = (obj, n = 2) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
    const perTek = {}; for (const p of lewat) perTek[p.teknologi || "lain"] = (perTek[p.teknologi || "lain"] || 0) + 1;
    const jenis = {}; for (const d of pk.baris) jenis[d.jenis] = (jenis[d.jenis] || 0) + 1;
    const r = rt.ringkas, noReg = reg.baris.filter((x) => !x.url_pdf).length;
    const kartu = (href, ik, judul, nomor, satuan, rows) => `<a class="jm-bb-ov" href="${href}"><span class="jm-bb-ov-h"><span class="jm-bb-ov-ik">${IKON[ik]}</span><strong>${esc(judul)}</strong></span><span class="jm-bb-ov-n"><b>${esc(nomor)}</b> <small>${esc(satuan)}</small></span>${rows.map(([a, n]) => `<span class="jm-bb-ov-r"><span>${esc(a)}</span><b>${esc(angka(n))}</b></span>`).join("")}</a>`;
    const kisi = [
      kartu("/rantai", "pabrik", t("beranda.bt.rantai"), angka(r.total_mwp / 1000, { desimal: 1 }), "GWp", [[t("beranda.ds.l.lokal"), r.lokal_mwp], [t("beranda.ds.l.ekspor"), r.ekspor_mwp]]),
      kartu("/proyek#terlambat", "waktu", t("beranda.bt.lewat"), angka(lewat.length), t("beranda.tek.n"), top(perTek).map(([k, n]) => [k === "lain" ? t("beranda.peta.lain") : label("beranda.tek.", k), n])),
      kartu("/direktori?tampil=pustaka", "buku", t("beranda.bt.riset"), angka(pk.baris.length), t("beranda.ds.l.dok"), top(jenis).map(([k, n]) => [label("beranda.bt.j.", k), n])),
      kartu("/tentang#metode", "lapis", t("beranda.bt.cakupan"), angka(pro.baris.length + org.baris.length + reg.baris.length), t("beranda.bt.cakupan.u"), [[t("beranda.bt.c.pro"), pro.baris.length - loc.length], [t("beranda.bt.c.org"), org.baris.length - og.length]]),
    ].join("");
    const panel = `<div class="jm-bb-bw"><div class="jm-bb-bpeta"><span class="jm-bb-bkiri"><a class="jm-bb-chip" href="/direktori"><b>${esc(angka(og.length))}</b> ${esc(t("beranda.bt.peta.u", { total: angka(org.baris.length) }))}</a><span class="jm-bb-leg"><span><i class="jm-bb-org"></i>${esc(t("beranda.bt.peta.l.org"))}</span><span><i class="jm-bb-pro"></i>${esc(t("beranda.bt.peta.l.pro"))}</span></span></span>${mini}</div><div class="jm-bb-bov">${kisi}</div><div class="jm-bb-tip" hidden></div></div>`;
    el.innerHTML = exHtml({ ikon: "peta", topik: t("beranda.s06.l"), judulHtml: jud("beranda.ex.bento.j", angka(og.length)), subHtml: esc(t("beranda.bt.peta.d")), aksiHtml: aksiHtml() + sumberHtml(esc(t("beranda.ex.bento.s", { tanggal: tanggal(org.dibangun_pada) }))), isiHtml: panel });
    const w = el.querySelector(".jm-bb-bw"), tip = w.querySelector(".jm-bb-tip");
    w.onpointermove = (e) => {
      const p = e.target.closest?.(".jm-bb-prov");
      if (!p || !p.dataset.p) { tip.hidden = true; return; }
      tip.innerHTML = `<b>${esc(p.dataset.p)}</b><span>${esc(angka(nOrg[p.dataset.p] || 0))} ${esc(t("beranda.sensus.org"))}</span><span>${esc(angka(nPro[p.dataset.p] || 0))} ${esc(t("beranda.tek.n"))}</span>`;
      tip.hidden = false;
      const b = w.getBoundingClientRect();
      tip.style.left = Math.min(Math.max(8, e.clientX - b.left + 14), b.width - tip.offsetWidth - 8) + "px";
      tip.style.top = Math.max(8, e.clientY - b.top - tip.offsetHeight - 12) + "px";
    };
    w.onpointerleave = () => { tip.hidden = true; };
  } catch (e) { sembunyi(el, e); }
}

const CARA = [["sumber", "tautan", () => `<span class="jm-chip">peraturan.bpk.go.id</span>`], ["est", "label", () => `<span class="jm-pil jm-pil-est">EST</span>`], ["tanggal", "kalender", (tgl) => `<span class="jm-chip">${esc(tgl)}</span>`], ["bukti", "lapis", () => `<span class="jm-chip">${esc(t("beranda.cara.t.resmi"))}</span><span class="jm-chip">${esc(t("beranda.cara.t.media"))}</span><span class="jm-chip">${esc(t("beranda.cara.t.pihak"))}</span>`]];
async function cara() {
  const el = document.getElementById("cara");
  if (!el) return;
  let tgl = "";
  try { tgl = tanggal((await muat("ringkas")).dibangun_pada); } catch (e) { /* tanpa tanggal contoh: chip tanggal kosong disembunyikan di bawah */ }
  el.innerHTML = CARA.map(([k, ik, ex], i) => `<div class="jm-cara"><div class="jm-cara-kep"><span class="jm-kpi-ik">${IKON[ik]}</span><span class="jm-cara-no">0${i + 1}</span></div><h3>${esc(t("beranda.cara." + k))}</h3><p>${esc(t("beranda.cara." + k + ".d"))}</p><div class="jm-baris-kecil">${k === "tanggal" && !tgl ? "" : ex(tgl)}</div></div>`).join("");
}

/* ---------- peta proyek (MapLibre dimuat malas saat bagian ini mendekati layar) ---------- */
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const IKON_PROG = { "plts-100gw": "surya", wte: "biomassa-sampah", ruptl: "lapis", psn: "pabrik", jetp: "grafik", b50: "bioenergi", e20: "bioenergi" };
let peta = null, petaSiapOk = false, dataPeta = null, terpilih = null;
const HIDE = new Set();
const FIT = [[94.8, -11], [141, 6.2]];
let panelBuka = innerWidth >= 900;
/** Bingkai peta: ruang kanan untuk panel program di layar lebar. */
const pad = () => (innerWidth >= 1200 ? { top: 30, bottom: 56, left: 20, right: 470 } : innerWidth >= 900 ? { top: 24, bottom: 52, left: 10, right: 10 } : { top: 6, bottom: 6, left: 6, right: 6 });
const num = (v) => angka(v, { desimal: v < 100 ? 1 : 0 });
const fc = (features) => ({ type: "FeatureCollection", features });

async function siapPeta() {
  const [pro, prog, rt] = await Promise.all([muat("proyek"), muat("program"), muat("rantai_plts")]);
  const lok = pro.baris.filter((p) => Number.isFinite(p.lokasi?.lat) && Number.isFinite(p.lokasi?.lng));
  const titik = lok.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lokasi.lng, p.lokasi.lat] }, properties: { id: p.id, nama: p.nama, k: p.teknologi || "lain", mw: mwDari(p), st: p.status?.[0]?.nilai || "tidak-diketahui", progs: "|" + (p.program_ids || []).join("|") + "|" } }));
  dataPeta = { titik, n: lok.length, tanpa: pro.baris.length - lok.length, tgl: pro.dibangun_pada };
  const awal = rt.program, target = (awal?.target_gwp || 0) * 1000;
  const urutan = daftarKonten(await kontenBeranda(), "program").map(String), pos = (g) => { const i = urutan.indexOf(g.id); return i < 0 ? urutan.length : i; };
  const daftar = [...prog.baris].filter((g) => g.jumlah_proyek > 0).sort((a, b) => pos(a) - pos(b) || b.kapasitas_mw - a.kapasitas_mw);
  const baris = daftar.map((g) => {
    const tek = Object.entries(g.per_teknologi || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
    const meta = awal?.id === g.id ? t("beranda.prog.awal", { n: angka(g.jumlah_proyek), gw: angka(awal.tahap_awal_gwp, { desimal: 1 }) }) : t("beranda.prog.meta", { n: angka(g.jumlah_proyek), tek: label("beranda.tek.", tek).toLowerCase() });
    const tgt = awal?.id === g.id && target > 0 ? Math.min(1, g.kapasitas_mw / target) : null;
    const bar = tgt === null ? "" : `<span class="jm-bb-tgt"><svg viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-bar-latar" width="100" height="4"/><rect class="jm-bar-isi" width="${Math.max(1, Math.round(tgt * 100))}" height="4"/></svg><small>${esc(t("beranda.prog.target", { persen: angka(tgt * 100, { desimal: 0 }), mw: angka(target) }))}</small></span>`;
    return `<li><button type="button" class="jm-bb-prog" data-prog="${esc(g.id)}" aria-pressed="${terpilih === g.id}"><span class="jm-bb-prog-ik">${IKON[IKON_PROG[g.id] || "lapis"]}</span><span class="jm-bb-prog-t"><strong>${esc(ada("beranda.prog." + g.id) ? t("beranda.prog." + g.id) : g.nama)}</strong><small>${esc(meta)}</small>${bar}</span><b class="jm-bb-n jm-bb-mw">${esc(num(g.kapasitas_mw))}<small> MW</small></b></button></li>`;
  }).join("");
  const info = $("petaInfo");
  gantiKepala($("petaKartu"), { ikon: "peta", topik: t("beranda.peta.k"), judulHtml: jud("beranda.ex.peta.j", angka(lok.length)), subHtml: esc(t("beranda.peta.d")), aksiHtml: aksiHtml() + sumberHtml(esc(t("beranda.peta.s", { tanggal: tanggal(pro.dibangun_pada) }))) });
  if (!info.firstElementChild) {
    info.innerHTML = `<div class="jm-bb-pp-g" role="group" aria-label="${esc(t("jm.geser.label"))}"></div><div class="jm-bb-pp-r"></div>`;
    if (innerWidth >= 900) geserPanel(info, { kunci: "program" });
  }
  info.querySelector(".jm-bb-pp-g").setAttribute("aria-label", t("jm.geser.label"));
  info.querySelector(".jm-bb-pp-r").innerHTML = `<button type="button" class="jm-bb-pp-t" aria-expanded="${panelBuka}"><span>${esc(t("beranda.peta.tabel"))}</span><i aria-hidden="true"></i></button><div class="jm-bb-pp-b"${panelBuka ? "" : " hidden"}>
    <div class="jm-bb-prog-w"><ul class="jm-bb-prog-l">${baris}</ul></div></div>`;
  if (!info.dataset.pasang) {
    info.dataset.pasang = "1";
    info.addEventListener("click", (e) => {
      const tg = e.target.closest(".jm-bb-pp-t");
      if (tg) { panelBuka = tg.getAttribute("aria-expanded") !== "true"; tg.setAttribute("aria-expanded", String(panelBuka)); info.querySelector(".jm-bb-pp-b").hidden = !panelBuka; return; }
      const b = e.target.closest("[data-prog]"); if (!b) return;
      terpilih = terpilih === b.dataset.prog ? null : b.dataset.prog;
      for (const x of info.querySelectorAll("[data-prog]")) x.setAttribute("aria-pressed", String(x.dataset.prog === terpilih));
      nanti(() => { terapkan(); if (terpilih && innerWidth < 900) $("petaEl").scrollIntoView({ block: "nearest", behavior: "smooth" }); });
    });
  }
}

/** Sorot program terpilih (lainnya 15%), saring teknologi yang dimatikan di legenda, pasang label 8 terbesar, dan sesuaikan bingkai. */
function terapkan(fit = true) {
  if (!peta || !petaSiapOk || !dataPeta) return;
  const jarum = `|${terpilih}|`, pilih = (f) => !terpilih || f.properties.progs.includes(jarum);
  const op = terpilih ? ["case", ["in", jarum, ["get", "progs"]], 0.9, 0.15] : 0.85;
  peta.setPaintProperty("titik", "circle-opacity", op);
  peta.setPaintProperty("titik", "circle-stroke-opacity", terpilih ? ["case", ["in", jarum, ["get", "progs"]], 1, 0.15] : 1);
  peta.setFilter("titik", HIDE.size ? ["!", ["in", ["get", "k"], ["literal", [...HIDE]]]] : null);
  const tampak = dataPeta.titik.filter((f) => pilih(f) && !HIDE.has(f.properties.k));
  peta.getSource("besar")?.setData(fc([...tampak].sort((a, b) => b.properties.mw - a.properties.mw).slice(0, 8)));
  if (!fit) return;
  if (!terpilih || !tampak.length) { peta.fitBounds(FIT, { padding: pad(), duration: 500 }); return; }
  const b = new maplibregl.LngLatBounds();
  for (const f of tampak) b.extend(f.geometry.coordinates);
  peta.fitBounds(b, { padding: { ...pad(), top: 70, bottom: 70 }, maxZoom: 7, duration: 500 });
}

function legendaPeta(el) {
  el.querySelectorAll(".jm-bb-tip").forEach((x) => x.remove());
  el.parentElement.querySelectorAll(".jm-bb-leg-peta").forEach((x) => x.remove());
  const ada = new Set(dataPeta.titik.map((f) => f.properties.k));
  const w = [...TEK, "lain"].filter((k) => ada.has(k));
  el.parentElement.insertAdjacentHTML("beforeend", `<div class="jm-bb-leg-peta" role="group" aria-label="${esc(t("beranda.peta.leg"))}">${w.map((k) => `<button type="button" aria-pressed="${!HIDE.has(k)}" data-tek="${esc(k)}"><i class="jm-bb-t-${esc(k)}"></i><span class="jm-bb-leg-ik" aria-hidden="true">${k === "lain" ? "" : IKON_TEK[k] || ""}</span>${esc(k === "lain" ? t("beranda.peta.lain.s") : label("beranda.tek.", k))}</button>`).join("")}</div>`);
  el.insertAdjacentHTML("beforeend", `<div class="jm-bb-tip" hidden></div>`);
}
async function bangunPeta() {
  const el = $("petaEl");
  try {
    await Promise.all([siapPeta(), muatMapLibre()]);
    petaSiapOk = false; peta?.remove();
    el.removeAttribute("role");
    peta = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), bounds: FIT, fitBoundsOptions: { padding: pad() }, minZoom: 2, maxZoom: 12, dragRotate: false, pitchWithRotate: false, scrollZoom: false, attributionControl: { compact: true } });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    legendaPeta(el);
    const tip = el.querySelector(".jm-bb-tip");
    if (!el.dataset.pasang) {
      el.dataset.pasang = "1";
      el.parentElement.addEventListener("click", (e) => {
        const b = e.target.closest("[data-tek]"); if (!b) return;
        const k = b.dataset.tek, mati = !HIDE.has(k);
        mati ? HIDE.add(k) : HIDE.delete(k); b.setAttribute("aria-pressed", String(!mati));
        nanti(() => terapkan(false));
      });
    }
    peta.on("style.load", () => {
      const idLabel = rapikanPeta(peta), d = dataPeta;
      peta.addSource("titik", { type: "geojson", data: fc(d.titik) });
      peta.addLayer({ id: "titik", type: "circle", source: "titik", layout: { "circle-sort-key": ["-", ["get", "mw"]] }, paint: { "circle-color": ["match", ["get", "k"], ...TEK.flatMap((k) => [k, warna(TEK_WARNA[k])]), warna("--ink2")], "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "mw"]], 0, 4, 10, 6, 20, 9, 40, 14], "circle-opacity": 0.85, "circle-stroke-width": 1.2, "circle-stroke-color": warna("--paper") } });
      peta.addSource("besar", { type: "geojson", data: fc([]) });
      peta.addLayer({ id: "besar", type: "symbol", source: "besar", layout: { "text-field": ["get", "nama"], "text-size": 11, "text-font": ["Noto Sans Regular"], "text-anchor": "top", "text-offset": [0, 1.1], "text-max-width": 9 }, paint: { "text-color": warna("--ink"), "text-halo-color": warna("--paper"), "text-halo-width": 1.5 } });
      pasangBatas(peta, warna, idLabel, "titik");
      petaSiapOk = true; peta.resize(); if (!terpilih) peta.fitBounds(FIT, { padding: pad(), duration: 0 }); terapkan(!!terpilih);
    });
    peta.on("mouseenter", "titik", () => { peta.getCanvas().style.cursor = "pointer"; });
    peta.on("mouseleave", "titik", () => { peta.getCanvas().style.cursor = ""; tip.hidden = true; });
    peta.on("mousemove", "titik", (e) => {
      const p = e.features[0].properties;
      tip.innerHTML = `<b>${esc(p.nama)}</b><span><i class="jm-bb-t-${esc(p.k)}"></i>${esc(p.k === "lain" ? t("beranda.peta.lain") : label("beranda.tek.", p.k))}</span><span>${p.mw ? esc(num(p.mw)) + " MW" : esc(t("beranda.peta.mw0"))}</span><span>${esc(label("pj.st.", p.st))}</span>`;
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      tip.style.left = Math.min(Math.max(8, e.originalEvent.clientX - r.left + 14), r.width - tip.offsetWidth - 8) + "px";
      tip.style.top = Math.max(8, e.originalEvent.clientY - r.top - tip.offsetHeight - 12) + "px";
    });
    peta.on("click", "titik", (e) => { location.href = "/proyek#" + encodeURIComponent(e.features[0].properties.id); });
    peta.on("movestart", () => { tip.hidden = true; });
  } catch (e) { sembunyi(el, e); }
}

/* ---------- pembangkit dan emisi (Climate TRACE, estimasi) ---------- */
const BAHAN = new Set(["coal", "gas", "oil", "biomass"]);
const bahan = (x) => String(x.jenis_aset).split(",")[0].trim();
const pendek = (n, maks = 24) => { const s = n.replace(/ power station$/i, "").replace(/^PT\.? /i, ""); return s.length > maks ? s.slice(0, maks - 1) + "…" : s; };
const bagus = (m, n = 4) => { const mentah = m / n, p = 10 ** Math.floor(Math.log10(mentah)), f = mentah / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
async function karbon() {
  const el = $("karbon");
  try {
    const [k, wil, geo] = await Promise.all([muat("karbon"), muat("wilayah"), geoProvinsi()]);
    const p = k.baris.filter((x) => x.kelompok === "pembangkit" && x.emisi_tco2e > 0 && x.kapasitas_mw > 0);
    if (!p.length) { el.closest("section").hidden = true; return; }
    const urut = [...p].sort((a, b) => b.emisi_tco2e - a.emisi_tco2e), top = urut.slice(0, 14), tot = jml(p, (x) => x.emisi_tco2e), pct = (jml(top, (x) => x.emisi_tco2e) / tot) * 100;
    const lx = (mw) => Math.log10(mw), x0 = Math.floor(Math.min(...p.map((x) => lx(x.kapasitas_mw)))), x1 = Math.ceil(Math.max(...p.map((x) => lx(x.kapasitas_mw))));
    const langkah = bagus(top[0].emisi_tco2e / 1e6), ym = Math.ceil(top[0].emisi_tco2e / 1e6 / langkah) * langkah * 1e6;
    const L = 58, R = 690, T = 46, B = 376, X = (mw) => L + 24 + ((lx(mw) - x0) / Math.max(1, x1 - x0)) * (R - L - 48), Y = (e) => B - (e / ym) * (B - T);
    const gx = []; for (let i = x0; i <= x1; i++) gx.push(i);
    const gy = []; for (let v = 0; v <= ym / 1e6 + 1e-9; v += langkah) gy.push(v);
    const kelas = (x) => "jm-bb-f-" + (BAHAN.has(bahan(x)) ? bahan(x) : "lain");
    const BK_IK = { coal: "jaringan", gas: "hidrogen", oil: "laut", biomass: "bioenergi", lain: "jaringan" };
    const rd = (i) => (i < 5 ? 10 : 6.5);
    const pos = top.map((x) => ({ x: X(x.kapasitas_mw), y: Y(x.emisi_tco2e) }));
    // lingkaran 6-14 digeser kecil sampai tidak saling tindih (5 teratas tetap di tempatnya)
    for (let it = 0; it < 60; it++) for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
      const dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y, d = Math.hypot(dx, dy) || 0.01, min = rd(i) + rd(j) + 1.5;
      if (d >= min) continue;
      const wi = i < 5 ? 0 : 1, wj = j < 5 ? 0 : 1, w = wi + wj || 1, m = (min - d + 0.05) / d;
      pos[i].x -= (dx * m * wi) / w; pos[i].y -= (dy * m * wi) / w; pos[j].x += (dx * m * wj) / w; pos[j].y += (dy * m * wj) / w;
    }
    const abu = urut.slice(14).map((x, i) => `<circle class="jm-bb-sc-abu" data-i="${i + 14}" cx="${X(x.kapasitas_mw).toFixed(1)}" cy="${Y(x.emisi_tco2e).toFixed(1)}" r="4"><title>${esc(pendek(x.nama, 60))}</title></circle>`).join("");
    // label 5 teratas: coba kanan/kiri x geser vertikal sampai tidak menabrak label lain maupun lingkaran
    const kotak = [], bentur = (q) => kotak.some((k) => q.x0 < k.x1 && q.x1 > k.x0 && q.y0 < k.y1 && q.y1 > k.y0) || pos.some((c, j) => c.x > q.x0 - rd(j) && c.x < q.x1 + rd(j) && c.y > q.y0 - rd(j) && c.y < q.y1 + rd(j)) || q.y0 < T - 14 || q.y1 > B || q.x0 < L || q.x1 > R + 6;
    const labs = top.slice(0, 5).map((x, i) => {
      const nm = pendek(x.nama), w = nm.length * 6.9, c = pos[i], cand = [];
      for (const dy of [0, -18, 18, -36, 36, -54, 54]) for (const sisi of c.x + 16 + w < R ? [1, -1] : [-1, 1]) cand.push([sisi, dy]);
      const x0s = (k) => (k[0] > 0 ? c.x + 16 : c.x - 16 - w);
      const pil = cand.find((k) => !bentur({ x0: x0s(k), x1: x0s(k) + w, y0: c.y + k[1] - 8, y1: c.y + k[1] + 8 })) || cand[0], [sisi, dy] = pil;
      kotak.push({ x0: x0s(pil), x1: x0s(pil) + w, y0: c.y + dy - 8, y1: c.y + dy + 8 });
      const lead = dy ? `<line class="jm-bb-sc-lead" x1="${(c.x + sisi * 8).toFixed(1)}" y1="${(c.y + Math.sign(dy) * 6).toFixed(1)}" x2="${(c.x + sisi * 14).toFixed(1)}" y2="${(c.y + dy).toFixed(1)}"/>` : "";
      return lead + `<text class="jm-bb-sc-nama" x="${(c.x + sisi * 16).toFixed(1)}" y="${(c.y + dy + 4).toFixed(1)}" text-anchor="${sisi > 0 ? "start" : "end"}">${esc(nm)}</text>`;
    });
    const titik = top.map((x, i) => `<g class="jm-bb-sc-g ${kelas(x)}" data-i="${i}"${x.organisasi_ids?.[0] ? ` data-p="${esc(x.organisasi_ids[0])}"` : ""} tabindex="0" role="img" aria-label="${esc(pendek(x.nama, 60))}">${i < 5 ? labs[i] : ""}<circle class="jm-bb-sc-dot" cx="${pos[i].x.toFixed(1)}" cy="${pos[i].y.toFixed(1)}" r="${rd(i)}"/><text class="jm-bb-sc-no${i < 5 ? "" : " jm-bb-sc-kecil"}" x="${pos[i].x.toFixed(1)}" y="${(pos[i].y + (i < 5 ? 3.5 : 3)).toFixed(1)}" text-anchor="middle">${i + 1}</text></g>`).join("");
    const grid = gx.map((i) => `<line class="jm-sc-bagi" x1="${X(10 ** i).toFixed(1)}" y1="${T}" x2="${X(10 ** i).toFixed(1)}" y2="${B}"/><text class="jm-sc-sb" x="${X(10 ** i).toFixed(1)}" y="${B + 18}" text-anchor="middle">${esc(angka(10 ** i))}</text>`).join("")
      + gy.map((v) => `<line class="jm-sc-bagi" x1="${L}" y1="${Y(v * 1e6).toFixed(1)}" x2="${R}" y2="${Y(v * 1e6).toFixed(1)}"/><text class="jm-sc-sb" x="${L - 8}" y="${(Y(v * 1e6) + 3).toFixed(1)}" text-anchor="end">${esc(angka(v, { desimal: langkah < 1 ? 1 : 0 }))}</text>`).join("");
    const svg = `<svg class="jm-bb-sc" viewBox="0 0 700 420" role="group" aria-label="${esc(t("beranda.karbon.aria"))}"><line class="jm-sc-as" x1="${L}" y1="${B}" x2="${R}" y2="${B}"/><line class="jm-sc-as" x1="${L}" y1="${T}" x2="${L}" y2="${B}"/>${grid}<text class="jm-sc-sb" x="${(L + R) / 2}" y="414" text-anchor="middle">${esc(t("beranda.karbon.x"))}</text><text class="jm-sc-sb" x="${L}" y="16">${esc(t("beranda.karbon.y"))}</text>${abu}${titik}</svg>`;
    const kodeProv = (x) => { if (!geo) return ""; let best = "", bd = 1e9; for (const f of geo.features) for (const po of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) { const r = po[0]; let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > x.lat) !== (yj > x.lat) && x.lng < ((xj - xi) * (x.lat - yi)) / (yj - yi) + xi) c = !c; const d = Math.hypot(xi - x.lng, yi - x.lat); if (d < bd) { bd = d; best = f.properties.kode; } } if (c) return f.properties.kode; } return best; };
    const namaProv = {}; for (const w of wil.baris) namaProv[w.kode] = w.nama;
    const rows = top.map((x, i) => ({ x, i, kp: kodeProv(x) }));
    const KOL = { no: (r) => r.i, nama: (r) => r.x.nama.toLowerCase(), prov: (r) => namaProv[r.kp] || "", mw: (r) => r.x.kapasitas_mw, mt: (r) => r.x.emisi_tco2e };
    const sc = { k: "no", asc: true }, tampil = { buka: false }, SEL = 8;
    const barisT = (r, n) => { const { x, i, kp } = r, bk = BAHAN.has(bahan(x)) ? bahan(x) : "lain", pid = x.organisasi_ids?.[0], nm = esc(pendek(x.nama, 34));
      return `<tr data-i="${i}"${n >= SEL && !tampil.buka ? " hidden" : ""}><td class="jm-bb-tn">${i + 1}</td><td><span class="jm-id">${pid ? `<a href="/p/${esc(pid)}">${nm}</a>` : `<b>${nm}</b>`}<span class="jm-bb-pk jm-bb-f-${bk}">${IKON_TEK[BK_IK[bk]].replace('class="jm-ikt"', 'class="jm-ikt jm-ikt-s"')}<span>${esc(label("beranda.karbon.j.", bk))}</span></span></span></td><td class="jm-bb-tp">${kp ? `<img src="/img/provinsi/${esc(kp)}.png" width="18" height="18" alt="" loading="lazy" decoding="async">` : ""}<span>${esc(namaProv[kp] || "-")}</span></td><td class="jm-num">${esc(angka(x.kapasitas_mw))}</td><td class="jm-num"><b>${esc(angka(x.emisi_tco2e / 1e6, { desimal: 1 }))}</b></td></tr>`; };
    const isiBody = () => [...rows].sort((p, q) => { const a = KOL[sc.k](p), b = KOL[sc.k](q); return (a < b ? -1 : a > b ? 1 : 0) * (sc.asc ? 1 : -1); }).map(barisT).join("");
    const kepala = [["no", "c.no", ""], ["nama", "c.nama", ""], ["prov", "c.prov", ""], ["mw", "c.mw", "jm-num"], ["mt", "c.mt", "jm-num"]].map(([k, c]) => `<th scope="col" aria-sort="${sc.k === k ? (sc.asc ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-k="${k}">${esc(t("beranda.karbon." + c))}</button></th>`).join("");
    const fakta = (n, l, est) => `<div><b>${esc(n)}</b><span>${esc(t(l))}${est ? ' <span class="jm-pil jm-pil-est">EST</span>' : ""}</span></div>`;
    const jenisAda = [...new Set(top.map(bahan))].filter((b) => BAHAN.has(b));
    const isi = `<div class="jm-bb-karbon-g"><div class="jm-bb-kol">
      <h4 class="jm-bb-h4">${esc(t("beranda.karbon.tabel"))}</h4><div class="jm-gulir jm-bb-tabel"><table class="jm-tabel"><thead><tr>${kepala}</tr></thead><tbody>${isiBody()}</tbody></table></div>
      <button type="button" class="jm-bb-lebih-t" aria-expanded="false" data-buka="${esc(t("beranda.karbon.lainnya", { n: angka(top.length - SEL) }))}" data-tutup="${esc(t("beranda.karbon.ringkas"))}">${esc(t("beranda.karbon.lainnya", { n: angka(top.length - SEL) }))}</button></div>
      <div class="jm-bb-kol jm-bb-kanan"><div class="jm-bb-kpi"><div class="jm-bb-kpi-b"><b>${esc(angka(pct, { desimal: 0 }))}%</b><span>${esc(t("beranda.karbon.wawasan", { n: angka(top.length), total: angka(p.length) }))}</span></div><div class="jm-bb-kpi-f">${fakta(angka(p.length), "beranda.karbon.l.n")}${fakta(angka(jml(p, (x) => x.kapasitas_mw) / 1000, { desimal: 1 }), "beranda.karbon.l.gw")}${fakta(angka(tot / 1e6, { desimal: 1 }), "beranda.karbon.l.mt", 1)}</div></div>
      <div class="jm-bb-sc-w">${svg}<div class="jm-bb-tip" hidden></div></div>
      <div class="jm-bb-leg" role="list">${jenisAda.map((b) => `<span role="listitem"><i class="jm-bb-f-${b}"></i>${esc(label("beranda.karbon.j.", b))}</span>`).join("")}<span role="listitem"><i class="jm-bb-sc-abu"></i>${esc(t("beranda.karbon.leg.lain", { n: angka(p.length - 14) }))}</span><small>${esc(t("beranda.karbon.leg.label"))}</small></div></div></div>`;
    el.innerHTML = exHtml({ ikon: "analisis", topik: t("beranda.karbon.k"), judulHtml: jud("beranda.ex.karbon.j", angka(pct, { desimal: 0 }) + "%", { m: angka(top.length) }), subHtml: `${esc(t("beranda.karbon.d"))} <span class="jm-pil jm-pil-est">EST</span>`, aksiHtml: aksiHtml() + sumberHtml(esc(t("beranda.karbon.s", { tanggal: tanggal(k.dibangun_pada), tahun: p[0].tahun }))), isiHtml: isi });
    const tip = el.querySelector(".jm-bb-tip"), wrap = el.querySelector(".jm-bb-sc-w");
    const info = (x) => `<b>${esc(pendek(x.nama, 60))}</b><span>${esc(label("beranda.karbon.j.", bahan(x)))}, ${esc(angka(x.kapasitas_mw))} MW</span><span>${esc(angka(x.emisi_tco2e / 1e6, { desimal: 2 }))} Mt CO2e</span>`;
    const sorot = (i, on) => { for (const n of el.querySelectorAll(`[data-i="${i}"]`)) n.classList.toggle("jm-bb-hi", on); };
    const tunjuk = (g) => { const x = urut[+g.dataset.i]; tip.innerHTML = info(x); tip.hidden = false; const a = g.getBoundingClientRect(), w = wrap.getBoundingClientRect(); tip.style.left = Math.min(Math.max(8, a.left - w.left + a.width / 2 - tip.offsetWidth / 2), w.width - tip.offsetWidth - 8) + "px"; tip.style.top = Math.max(8, a.top - w.top - tip.offsetHeight - 8) + "px"; };
    el.onpointerover = el.onfocusin = (e) => { const n = e.target.closest?.("[data-i]"); if (!n) return; sorot(n.dataset.i, true); if (n.closest("svg")) tunjuk(n); };
    el.onpointerout = el.onfocusout = (e) => { const n = e.target.closest?.("[data-i]"); if (!n) return; sorot(n.dataset.i, false); tip.hidden = true; };
    const gambarUlang = () => { el.querySelector("tbody").innerHTML = isiBody(); };
    const buka = (g) => { const id = g?.dataset.p; if (id) location.href = "/p/" + encodeURIComponent(id); };
    el.onkeydown = (e) => { if (e.key === "Enter") buka(e.target.closest?.(".jm-bb-sc-g")); };
    el.onclick = (e) => {
      const b = e.target.closest(".jm-bb-lebih-t");
      if (b) { tampil.buka = b.getAttribute("aria-expanded") !== "true"; b.setAttribute("aria-expanded", String(tampil.buka)); b.textContent = tampil.buka ? b.dataset.tutup : b.dataset.buka; nanti(gambarUlang); return; }
      const u = e.target.closest(".jm-urut"); if (u) { const k = u.dataset.k; sc.asc = sc.k === k ? !sc.asc : k !== "mw" && k !== "mt"; sc.k = k; u.closest("tr").querySelectorAll("th").forEach((th) => th.setAttribute("aria-sort", th === u.parentNode ? (sc.asc ? "ascending" : "descending") : "none")); nanti(gambarUlang); return; }
      buka(e.target.closest(".jm-bb-sc-g"));
    };
  } catch (e) { sembunyi(el, e); }
}

/** Pasang tugas malas: jalan sekali saat bagian mendekati layar (IntersectionObserver) atau terlewati lompatan gulir. */
export function pasangBawah(R) {
  ["sensusSumber", "fotoKredit", "sensus"].forEach((id) => $(id)?.remove());
  const pk = $("petaKartu"); pk.className = "jm-bb-ex-w";
  pk.innerHTML = exHtml({ ikon: "peta", topik: t("beranda.peta.k"), judulHtml: "", isiHtml: `<div class="jm-bb-peta-g"><div class="jm-peta-info" id="petaInfo"></div><div class="jm-peta" id="petaEl" aria-label="${esc(t("beranda.peta.aria"))}"></div></div>` });
  for (const id of ["karbon", "foto", "bento"]) $(id).className = "jm-bb-ex-w";
  ["dataset", "karbon", "foto", "bento"].forEach((id) => hantu(id));
  cara();
  const tugas = [[$("dataset"), () => import("/beranda_data.js").then((m) => m.gambarDataset(R))], [$("petaKartu"), bangunPeta], [$("karbon"), karbon], [$("foto"), teknologi], [$("bento"), bento]];
  const cek = () => { for (let i = tugas.length - 1; i >= 0; i--) if (tugas[i][0].getBoundingClientRect().top < innerHeight + 300) { const [, f] = tugas.splice(i, 1)[0]; f(); } if (!tugas.length) removeEventListener("scroll", cek); };
  const io = new IntersectionObserver(() => cek(), { rootMargin: "300px" });
  for (const [el] of tugas) io.observe(el);
  addEventListener("scroll", cek, { passive: true });
  new MutationObserver(() => dataPeta && bangunPeta()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("jm:bahasa", () => requestAnimationFrame(() => { cara(); teknologi(); bento(); karbon(); dataPeta && siapPeta(); }));
}
