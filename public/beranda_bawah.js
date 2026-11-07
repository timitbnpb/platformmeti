/* Bagian beranda di bawah lipatan: sensus per teknologi, halaman lain, cara data dibuat, akses data.
   Dirender saat mendekati layar (IntersectionObserver); angka dari public/data/*.json. */
import { t, ada, angka, tanggal } from "/i18n.js";
import { esc, hantuHtml, nanti } from "/inti/umum.js";
import { sumberHtml, exHtml } from "/inti/komponen.js";
import { BATAS_ID, rapikanPeta, pasangBatas, geoProvinsi, jalurProvinsi } from "/inti/peta_indonesia.js";
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
const TEK_WARNA = { surya: "--data4", bayu: "--data3", hidro: "--data5", "panas-bumi": "--warn", bioenergi: "--data2", "biomassa-sampah": "--data1", penyimpanan: "--ink2", nuklir: "--bad" };
const jml = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
const mwDari = (p) => p.kapasitas?.[0]?.nilai || 0;
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
      return `<a class="jm-bb-foto" href="/proyek?teknologi=${k}"><img src="/img/beranda/${FOTO[k][0]}.webp" width="800" height="600" loading="lazy" alt=""><span class="jm-bb-foto-isi"><span class="jm-pil">${esc(angka(ps.length))} ${esc(t("beranda.tek.n"))}</span><strong>${esc(label("beranda.tek.", k))}</strong><small>${esc(t("beranda.foto." + k))}</small><b>${mw ? esc(angka(mw)) + " MW" : "-"}</b></span></a>`;
    }).join("");
    const daftar = TEK.map((k) => `${t("beranda.foto." + k)} (${FOTO[k][1]}, ${LISENSI[FOTO[k][2]].startsWith("beranda") ? t(LISENSI[FOTO[k][2]]) : LISENSI[FOTO[k][2]]})`).join("; ");
    foto.innerHTML = exHtml({ ikon: "tek-surya", topik: t("beranda.s05.l"), judulHtml: jud("beranda.ex.tek.j", angka(pro.baris.length), { k: angka(TEK.length) }), subHtml: esc(t("beranda.s05.p")), aksiHtml: sumberHtml(`${esc(t("beranda.sensus.sumber", { tanggal: tanggal(pro.dibangun_pada) }))} ${esc(t("beranda.foto.kredit", { daftar }))}`), isiHtml: `<div class="jm-bb-foto-kisi">${kartu}</div>` });
  } catch (e) { sembunyi(foto, e); }
}

async function bento() {
  const el = document.getElementById("bento");
  try {
    const [org, pro, rt, pk, prog, geo] = await Promise.all([...["organisasi", "proyek", "rantai_plts", "pustaka", "program"].map(muat), geoProvinsi()]);
    const tahun = +String(pro.dibangun_pada).slice(0, 4), sat = (p) => p.kapasitas?.[0]?.nilai || 0;
    // tile besar: peta mini Indonesia (garis provinsi dari /geo/provinsi.json), organisasi bertitik, proyek sebagai titik abu-abu
    const W = 560, H = 210, X = (lng) => ((lng - BATAS_ID[0][0]) / (BATAS_ID[1][0] - BATAS_ID[0][0])) * W, Y = (lat) => ((BATAS_ID[1][1] - lat) / (BATAS_ID[1][1] - BATAS_ID[0][1])) * H;
    const loc = pro.baris.filter((p) => Number.isFinite(p.lokasi?.lat));
    const abu = loc.map((p) => `<circle class="jm-bb-pro" cx="${X(p.lokasi.lng).toFixed(1)}" cy="${Y(p.lokasi.lat).toFixed(1)}" r="1.7"/>`).join("");
    const og = org.baris.filter((o) => Number.isFinite(o.lokasi?.lat));
    const tt = og.map((o) => `<circle class="jm-bb-org" cx="${X(o.lokasi.lng).toFixed(1)}" cy="${Y(o.lokasi.lat).toFixed(1)}" r="2.8"><title>${esc(o.nama)}</title></circle>`).join("");
    const mini = `<svg class="jm-bb-mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("beranda.bt.peta"))}">${geo ? `<path class="jm-bb-prov" d="${jalurProvinsi(geo, W, H)}"/>` : ""}${abu}${tt}</svg>`;
    const lewat = pro.baris.filter((p) => p.status?.[0]?.nilai !== "beroperasi" && p.cod_target?.length && Math.min(...p.cod_target.map((c) => c.nilai)) < tahun);
    const perProg = prog.baris.map((g) => [g.nama, lewat.filter((p) => (p.program_ids || []).includes(g.id)).length]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const mxp = Math.max(1, ...perProg.map((x) => x[1]));
    const jenis = {}; for (const d of pk.baris) jenis[d.jenis] = (jenis[d.jenis] || 0) + 1;
    const topJ = Object.entries(jenis).sort((a, b) => b[1] - a[1]).slice(0, 3), mxj = Math.max(1, ...topJ.map((x) => x[1]));
    const r = rt.ringkas, bar = (f, w) => `<svg class="jm-ds-bar jm-w${w}" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-bar-latar" width="100" height="6"/><rect class="jm-bar-isi" width="${Math.max(1, Math.round(f * 100))}" height="6"/></svg>`;
    const baris = (a, f, n, w) => `<div class="jm-bt-baris"><span>${esc(a)}</span><b>${esc(angka(n))}</b></div>${bar(f, w)}`;
    const tile = (href, ik, judul, ket, nomor, satuan, viz, cls = "") => `<a class="jm-bt ${cls}" href="${href}"><span class="jm-kpi-ik">${IKON[ik]}</span><strong>${esc(judul)}</strong><span class="jm-bt-ket">${esc(ket)}</span><span class="jm-bt-n"><b>${esc(nomor)}</b> <small>${esc(satuan)}</small></span><span class="jm-bt-viz">${viz}</span></a>`;
    const tanpa = [[t("beranda.bt.c.pro"), pro.baris.length - loc.length], [t("beranda.bt.c.org"), org.baris.length - og.length], [t("beranda.bt.c.pdf"), (await muat("regulasi")).baris.filter((x) => !x.url_pdf).length]];
    const tiles = [
      `<a class="jm-bt jm-bt-besar jm-bb-bt" href="/direktori"><span class="jm-bb-bt-kep"><span class="jm-kpi-ik">${IKON.pin}</span><span><strong>${esc(t("beranda.bt.peta"))}</strong><span class="jm-bt-ket">${esc(t("beranda.bt.peta.d"))}</span></span></span><span class="jm-bb-chip"><b>${esc(angka(og.length))}</b> ${esc(t("beranda.bt.peta.u", { total: angka(org.baris.length) }))}</span><span class="jm-bb-mini-w">${mini}</span><span class="jm-bb-leg"><span><i class="jm-bb-org"></i>${esc(t("beranda.bt.peta.l.org"))}</span><span><i class="jm-bb-pro"></i>${esc(t("beranda.bt.peta.l.pro"))}</span></span></a>`,
      tile("/rantai", "pabrik", t("beranda.bt.rantai"), t("beranda.bt.rantai.d"), angka(r.total_mwp / 1000, { desimal: 1 }), "GWp", baris(t("beranda.ds.l.lokal"), r.lokal_mwp / r.total_mwp, r.lokal_mwp, 4) + baris(t("beranda.ds.l.ekspor"), r.ekspor_mwp / r.total_mwp, r.ekspor_mwp, 5)),
      tile("/proyek#terlambat", "waktu", t("beranda.bt.lewat"), t("beranda.bt.lewat.d"), angka(lewat.length), t("beranda.tek.n"), perProg.map(([a, n]) => baris(a, n / mxp, n, 2)).join("")),
      tile("/direktori?tampil=pustaka", "buku", t("beranda.bt.riset"), t("beranda.bt.riset.d"), angka(pk.baris.length), t("beranda.ds.l.dok"), topJ.map(([a, n]) => baris(label("beranda.bt.j.", a), n / mxj, n, 3)).join("")),
      tile("/tentang#metode", "lapis", t("beranda.bt.cakupan"), t("beranda.bt.cakupan.d"), angka(pro.baris.length + org.baris.length + (await muat("regulasi")).baris.length), t("beranda.bt.cakupan.u"), tanpa.map(([a, n]) => `<div class="jm-bt-baris"><span>${esc(a)}</span><b>${esc(angka(n))}</b></div>`).join("")),
    ];
    el.innerHTML = exHtml({ ikon: "peta", topik: t("beranda.s06.l"), judulHtml: jud("beranda.ex.bento.j", angka(og.length)), subHtml: esc(t("beranda.s06.p")), aksiHtml: sumberHtml(esc(t("beranda.ex.bento.s", { tanggal: tanggal(org.dibangun_pada) }))), isiHtml: `<div class="jm-bento-kisi">${tiles.join("")}</div>` });
  } catch (e) { sembunyi(el, e); }
}

const CARA = [["sumber", "tautan", () => `<span class="jm-chip">peraturan.bpk.go.id</span>`], ["est", "label", () => `<span class="jm-pil jm-pil-est">EST</span>`], ["tanggal", "kalender", (tgl) => `<span class="jm-chip">${esc(tgl)}</span>`], ["bukti", "lapis", () => `<span class="jm-chip">${esc(t("beranda.cara.t.resmi"))}</span><span class="jm-chip">${esc(t("beranda.cara.t.media"))}</span><span class="jm-chip">${esc(t("beranda.cara.t.pihak"))}</span>`]];
async function cara() {
  const el = document.getElementById("cara");
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
const num = (v) => angka(v, { desimal: v < 100 ? 1 : 0 });
const fc = (features) => ({ type: "FeatureCollection", features });

async function siapPeta() {
  const [pro, prog, rt] = await Promise.all([muat("proyek"), muat("program"), muat("rantai_plts")]);
  const ada = pro.baris.filter((p) => Number.isFinite(p.lokasi?.lat) && Number.isFinite(p.lokasi?.lng));
  const titik = ada.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lokasi.lng, p.lokasi.lat] }, properties: { id: p.id, nama: p.nama, k: p.teknologi || "lain", mw: mwDari(p), st: p.status?.[0]?.nilai || "tidak-diketahui", progs: "|" + (p.program_ids || []).join("|") + "|" } }));
  dataPeta = { titik, n: ada.length, tanpa: pro.baris.length - ada.length, tgl: pro.dibangun_pada };
  const awal = rt.program, target = (awal?.target_gwp || 0) * 1000;
  const daftar = [...prog.baris].filter((g) => g.jumlah_proyek > 0).sort((a, b) => b.kapasitas_mw - a.kapasitas_mw);
  const baris = daftar.map((g) => {
    const tek = Object.entries(g.per_teknologi || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
    const meta = awal?.id === g.id ? t("beranda.prog.awal", { n: angka(g.jumlah_proyek), gw: angka(awal.tahap_awal_gwp, { desimal: 1 }) }) : t("beranda.prog.meta", { n: angka(g.jumlah_proyek), tek: label("beranda.tek.", tek).toLowerCase() });
    const tgt = awal?.id === g.id && target > 0 ? Math.min(1, g.kapasitas_mw / target) : null;
    const bar = tgt === null ? "" : `<span class="jm-bb-tgt"><svg viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-bar-latar" width="100" height="4"/><rect class="jm-bar-isi" width="${Math.max(1, Math.round(tgt * 100))}" height="4"/></svg><small>${esc(t("beranda.prog.target", { persen: angka(tgt * 100, { desimal: 0 }), mw: angka(target) }))}</small></span>`;
    return `<li><button type="button" class="jm-bb-prog" data-prog="${esc(g.id)}" aria-pressed="${terpilih === g.id}"><span class="jm-bb-prog-ik">${IKON[IKON_PROG[g.id] || "lapis"]}</span><span class="jm-bb-prog-t"><strong>${esc(ada("beranda.prog." + g.id) ? t("beranda.prog." + g.id) : g.nama)}</strong><small>${esc(meta)}</small>${bar}</span><b class="jm-bb-n">${esc(angka(g.jumlah_proyek))}</b><b class="jm-bb-n">${esc(num(g.kapasitas_mw))}</b></button></li>`;
  }).join("");
  const info = $("petaInfo");
  gantiKepala($("petaKartu"), { ikon: "peta", topik: t("beranda.peta.k"), judulHtml: jud("beranda.ex.peta.j", angka(ada.length)), subHtml: esc(t("beranda.peta.d")), aksiHtml: sumberHtml(esc(t("beranda.peta.s", { tanggal: tanggal(pro.dibangun_pada) }))) });
  info.innerHTML = `<p class="jm-bb-fakta"><b>${esc(angka(ada.length))}</b> ${esc(t("beranda.peta.l.titik"))} <span aria-hidden="true">/</span> <b>${esc(angka(dataPeta.tanpa))}</b> ${esc(t("beranda.peta.l.tanpa"))}</p>
    <div class="jm-bb-prog-w"><div class="jm-bb-prog-kop" aria-hidden="true"><span>${esc(t("beranda.peta.kol.prog"))}</span><span>${esc(t("beranda.peta.kol.n"))}</span><span>MW</span></div><ul class="jm-bb-prog-l">${baris}</ul></div>`;
  if (!info.dataset.pasang) {
    info.dataset.pasang = "1";
    info.addEventListener("click", (e) => {
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
  if (!terpilih || !tampak.length) { peta.fitBounds(BATAS_ID, { padding: 10, duration: 500 }); return; }
  const b = new maplibregl.LngLatBounds();
  for (const f of tampak) b.extend(f.geometry.coordinates);
  peta.fitBounds(b, { padding: 60, maxZoom: 7, duration: 500 });
}

function legendaPeta(el) {
  el.querySelectorAll(".jm-bb-leg-peta,.jm-bb-tip").forEach((x) => x.remove());
  const ada = new Set(dataPeta.titik.map((f) => f.properties.k));
  const w = [...TEK, "lain"].filter((k) => ada.has(k));
  el.insertAdjacentHTML("beforeend", `<div class="jm-bb-leg-peta" role="group" aria-label="${esc(t("beranda.peta.leg"))}">${w.map((k) => `<button type="button" aria-pressed="${!HIDE.has(k)}" data-tek="${esc(k)}"><i class="jm-bb-t-${esc(k)}"></i>${esc(k === "lain" ? t("beranda.peta.lain") : label("beranda.tek.", k))}</button>`).join("")}</div><div class="jm-bb-tip" hidden></div>`);
}
async function bangunPeta() {
  const el = $("petaEl");
  try {
    await Promise.all([siapPeta(), muatMapLibre()]);
    petaSiapOk = false; peta?.remove();
    el.removeAttribute("role");
    peta = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), bounds: BATAS_ID, fitBoundsOptions: { padding: 10 }, minZoom: 3, maxZoom: 12, dragRotate: false, pitchWithRotate: false, scrollZoom: false, attributionControl: { compact: true } });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    legendaPeta(el);
    const tip = el.querySelector(".jm-bb-tip");
    if (!el.dataset.pasang) {
      el.dataset.pasang = "1";
      el.addEventListener("click", (e) => {
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
      petaSiapOk = true; terapkan(!!terpilih);
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
    const k = await muat("karbon");
    const p = k.baris.filter((x) => x.kelompok === "pembangkit" && x.emisi_tco2e > 0 && x.kapasitas_mw > 0);
    if (!p.length) { el.closest("section").hidden = true; return; }
    const urut = [...p].sort((a, b) => b.emisi_tco2e - a.emisi_tco2e), top = urut.slice(0, 14), tot = jml(p, (x) => x.emisi_tco2e), pct = (jml(top, (x) => x.emisi_tco2e) / tot) * 100;
    const lx = (mw) => Math.log10(mw), x0 = Math.floor(Math.min(...p.map((x) => lx(x.kapasitas_mw)))), x1 = Math.ceil(Math.max(...p.map((x) => lx(x.kapasitas_mw))));
    const langkah = bagus(top[0].emisi_tco2e / 1e6), ym = Math.ceil(top[0].emisi_tco2e / 1e6 / langkah) * langkah * 1e6;
    const L = 58, R = 690, T = 20, B = 372, X = (mw) => L + 24 + ((lx(mw) - x0) / Math.max(1, x1 - x0)) * (R - L - 48), Y = (e) => B - (e / ym) * (B - T);
    const gx = []; for (let i = x0; i <= x1; i++) gx.push(i);
    const gy = []; for (let v = 0; v <= ym / 1e6 + 1e-9; v += langkah) gy.push(v);
    const kelas = (x) => "jm-bb-f-" + (BAHAN.has(bahan(x)) ? bahan(x) : "lain");
    const abu = urut.slice(14).map((x, i) => `<circle class="jm-bb-sc-abu" data-i="${i + 14}" cx="${X(x.kapasitas_mw).toFixed(1)}" cy="${Y(x.emisi_tco2e).toFixed(1)}" r="4"><title>${esc(pendek(x.nama, 60))}</title></circle>`).join("");
    const OFF = [[34, -26], [34, 30], [-34, -26], [-34, 30], [0, -40]];
    const titik = top.map((x, i) => {
      const cx = X(x.kapasitas_mw), cy = Y(x.emisi_tco2e);
      let lab = "";
      if (i < 5) {
        let [dx, dy] = OFF[i]; if (cx + dx > R - 90 && dx > 0) dx = -dx; if (cx + dx < L + 90 && dx < 0) dx = -dx;
        const ex = cx + dx, ey = cy + dy, ur = Math.hypot(dx, dy), ax = cx + (dx / ur) * 11, ay = cy + (dy / ur) * 11;
        lab = `<line class="jm-bb-sc-lead" x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"/><text class="jm-bb-sc-nama" x="${(ex + (dx >= 0 ? 4 : -4)).toFixed(1)}" y="${(ey + 3.5).toFixed(1)}" text-anchor="${dx >= 0 ? "start" : "end"}">${esc(pendek(x.nama))}</text>`;
      }
      return `<g class="jm-bb-sc-g ${kelas(x)}" data-i="${i}" tabindex="0" role="img" aria-label="${esc(pendek(x.nama, 60))}">${lab}<circle class="jm-bb-sc-dot" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="11"/><text class="jm-bb-sc-no" x="${cx.toFixed(1)}" y="${(cy + 3.5).toFixed(1)}" text-anchor="middle">${i + 1}</text></g>`;
    }).join("");
    const grid = gx.map((i) => `<line class="jm-sc-bagi" x1="${X(10 ** i).toFixed(1)}" y1="${T}" x2="${X(10 ** i).toFixed(1)}" y2="${B}"/><text class="jm-sc-sb" x="${X(10 ** i).toFixed(1)}" y="${B + 18}" text-anchor="middle">${esc(angka(10 ** i))}</text>`).join("")
      + gy.map((v) => `<line class="jm-sc-bagi" x1="${L}" y1="${Y(v * 1e6).toFixed(1)}" x2="${R}" y2="${Y(v * 1e6).toFixed(1)}"/><text class="jm-sc-sb" x="${L - 8}" y="${(Y(v * 1e6) + 3).toFixed(1)}" text-anchor="end">${esc(angka(v, { desimal: langkah < 1 ? 1 : 0 }))}</text>`).join("");
    const svg = `<svg class="jm-bb-sc" viewBox="0 0 700 420" role="group" aria-label="${esc(t("beranda.karbon.aria"))}"><line class="jm-sc-as" x1="${L}" y1="${B}" x2="${R}" y2="${B}"/><line class="jm-sc-as" x1="${L}" y1="${T}" x2="${L}" y2="${B}"/>${grid}<text class="jm-sc-sb" x="${L}" y="412">${esc(t("beranda.karbon.x"))}</text><text class="jm-sc-sb" x="${L}" y="11">${esc(t("beranda.karbon.y"))}</text>${abu}${titik}</svg>`;
    const baris = (x, i) => `<li${i >= 8 ? ' class="jm-bb-lebih" hidden' : ""}><button type="button" class="jm-bb-em" data-i="${i}" aria-pressed="false"><span class="jm-bb-em-no ${kelas(x)}"><span>${i + 1}</span></span><span class="jm-bb-em-t"><strong>${esc(pendek(x.nama, 34))}</strong>, <span>${esc(label("beranda.karbon.j.", bahan(x)).toLowerCase())}</span></span><b>${esc(angka(x.emisi_tco2e / 1e6, { desimal: 1 }))} <small>Mt</small></b><svg class="jm-bb-em-bar ${kelas(x)}" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-bar-latar" width="100" height="4"/><rect class="jm-bar-isi" width="${Math.max(2, Math.round((x.emisi_tco2e / top[0].emisi_tco2e) * 100))}" height="4"/></svg></button></li>`;
    const fakta = (n, l, est) => `<div><b>${esc(n)}</b><span>${esc(t(l))}${est ? ' <span class="jm-pil jm-pil-est">EST</span>' : ""}</span></div>`;
    const jenisAda = [...new Set(top.map(bahan))].filter((b) => BAHAN.has(b));
    const isi = `<div class="jm-bb-karbon-g"><div class="jm-bb-kol">
      <h4 class="jm-bb-h4">${esc(t("beranda.karbon.tabel"))}</h4><ol class="jm-bb-em-l">${top.map(baris).join("")}</ol>
      <button type="button" class="jm-bb-lebih-t" aria-expanded="false" data-buka="${esc(t("beranda.karbon.lainnya", { n: angka(top.length - 8) }))}" data-tutup="${esc(t("beranda.karbon.ringkas"))}">${esc(t("beranda.karbon.lainnya", { n: angka(top.length - 8) }))}</button></div>
      <div class="jm-bb-kol jm-bb-kanan"><div class="jm-bb-kpi"><div class="jm-bb-kpi-b"><b>${esc(angka(pct, { desimal: 0 }))}%</b><span>${esc(t("beranda.karbon.wawasan", { n: angka(top.length), total: angka(p.length) }))}</span></div><div class="jm-bb-kpi-f">${fakta(angka(p.length), "beranda.karbon.l.n")}${fakta(angka(jml(p, (x) => x.kapasitas_mw) / 1000, { desimal: 1 }), "beranda.karbon.l.gw")}${fakta(angka(tot / 1e6, { desimal: 1 }), "beranda.karbon.l.mt", 1)}</div></div>
      <div class="jm-bb-sc-w">${svg}<div class="jm-bb-tip" hidden></div></div>
      <div class="jm-bb-leg" role="list">${jenisAda.map((b) => `<span role="listitem"><i class="jm-bb-f-${b}"></i>${esc(label("beranda.karbon.j.", b))}</span>`).join("")}<span role="listitem"><i class="jm-bb-sc-abu"></i>${esc(t("beranda.karbon.leg.lain", { n: angka(p.length - 14) }))}</span><small>${esc(t("beranda.karbon.leg.label"))}</small></div></div></div>`;
    el.innerHTML = exHtml({ ikon: "analisis", topik: t("beranda.karbon.k"), judulHtml: jud("beranda.ex.karbon.j", angka(pct, { desimal: 0 }) + "%", { m: angka(top.length) }), subHtml: `${esc(t("beranda.karbon.d"))} <span class="jm-pil jm-pil-est">EST</span>`, aksiHtml: sumberHtml(esc(t("beranda.karbon.s", { tanggal: tanggal(k.dibangun_pada), tahun: p[0].tahun }))), isiHtml: isi });
    const tip = el.querySelector(".jm-bb-tip"), wrap = el.querySelector(".jm-bb-sc-w");
    const info = (x) => `<b>${esc(pendek(x.nama, 60))}</b><span>${esc(label("beranda.karbon.j.", bahan(x)))}, ${esc(angka(x.kapasitas_mw))} MW</span><span>${esc(angka(x.emisi_tco2e / 1e6, { desimal: 2 }))} Mt CO2e</span>`;
    const sorot = (i, on) => { for (const n of el.querySelectorAll(`[data-i="${i}"]`)) n.classList.toggle("jm-bb-hi", on); };
    const tunjuk = (g) => { const x = urut[+g.dataset.i]; tip.innerHTML = info(x); tip.hidden = false; const a = g.getBoundingClientRect(), w = wrap.getBoundingClientRect(); tip.style.left = Math.min(Math.max(8, a.left - w.left + a.width / 2 - tip.offsetWidth / 2), w.width - tip.offsetWidth - 8) + "px"; tip.style.top = Math.max(8, a.top - w.top - tip.offsetHeight - 8) + "px"; };
    el.onpointerover = el.onfocusin = (e) => { const n = e.target.closest?.("[data-i]"); if (!n) return; sorot(n.dataset.i, true); if (n.closest("svg")) tunjuk(n); };
    el.onpointerout = el.onfocusout = (e) => { const n = e.target.closest?.("[data-i]"); if (!n) return; sorot(n.dataset.i, false); tip.hidden = true; };
    el.onclick = (e) => {
      const b = e.target.closest(".jm-bb-lebih-t");
      if (b) { const buka = b.getAttribute("aria-expanded") !== "true"; b.setAttribute("aria-expanded", String(buka)); b.textContent = buka ? b.dataset.tutup : b.dataset.buka; nanti(() => el.querySelectorAll(".jm-bb-lebih").forEach((li) => { li.hidden = !buka; })); return; }
      const r = e.target.closest(".jm-bb-em"); if (r) r.setAttribute("aria-pressed", String(r.getAttribute("aria-pressed") !== "true"));
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
