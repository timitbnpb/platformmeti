/* Analisis pemberitaan /berita (meniru poskokarhutla Berita: exSorotan, pmIsu, exTopik, pmTuntutan, pmPeringatan, Sorotan dunia).
   Hanya judul yang dipakai (hak cipta). Hitungan kamus = EST/Hipotesis; tanpa skor sentimen. Rumus murni ada di berita_kamus.js. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, fotoBerita } from "/inti/umum.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muat, urlAman, label } from "/publik.js";
import { IKON_TEK as IKT } from "/inti/ikon_tek.js";
import { logoLokal } from "/inti/nama_media.js";
import { ISU, DESAK, DESAK_KATA, KEBIJAKAN, klaster, hitungIsu, harian, sparkPoin, tierMedia, negaraMedia, hostDari, BENDERA_ADA, banding } from "/berita_kamus.js";

const HARI = 86400000, TIER = ["utama", "nasional", "daerah", "internasional", "rilis"];
let K = null; // konteks terakhir {B, FOTO, TIER, ak}
const est = () => `<span class="jm-pil jm-pil-est">${esc(t("an.est"))}</span>`;
const hip = () => `<span class="jm-pil jm-pil-warn">${esc(t("brt.an.hip"))}</span>`;
const fav = (r) => logoLokal(r.url);
const ini = (m) => (String(m).replace(/^www\./, "").split(".")[0].replace(/[^a-z0-9]/gi, "").slice(0, 2) || "?").toUpperCase();
const logo = (r) => `<span class="brt-lg" aria-hidden="true">${esc(ini(r.media))}<img src="${esc(fav(r))}" width="22" height="22" alt="" loading="lazy" decoding="async" data-galat="hapus"></span>`;
const tautan = (r, isi, kelas = "brt-judul") => `<a class="${kelas}" href="${esc(urlAman(r.url))}" target="_blank" rel="noopener noreferrer" title="${esc(t("brt.buka"))}">${isi}</a>`;
const baris = (r) => `<li class="brt-an-b">${tautan(r, esc(r.judul))}<span class="brt-meta">${logo(r)}<span>${esc(r.media)}, ${esc(tanggal(r.terbit.slice(0, 10)))}</span></span></li>`;
const sumber = (K0) => sumberHtml(`${esc(t("brt.an.sumber"))} ${esc(tanggal(K0.dibangun))}.`);
function bagian(K0, { id, ik, ey, judulHtml, sub, isi, cara, hipotesis }) {
  return `<section class="brt-bagian"><div class="jm-wadah">${exHtml({ id, ikon: ik, topik: t(ey), tingkat: "h2", judulHtml, subHtml: `${esc(t(sub))} ${hipotesis ? hip() : est()}`,
    isiHtml: isi, aksiHtml: aksiHtml({ csv: false }) + sumberHtml(`${esc(t(cara))}<br>${esc(t("brt.an.sumber"))} ${esc(tanggal(K0.dibangun))}.`) })}</div></section>`;
}
/** Grid rata tanpa sel kosong: potong ke jumlah yang habis dibagi kolom (maks 5). */
const rata = (xs) => { const n = xs.length > 8 ? 8 : xs.length === 7 ? 6 : xs.length, k = n <= 5 ? n : n % 3 === 0 ? 3 : 4; return [xs.slice(0, n), "brt-an-grid brt-an-c" + Math.max(1, k)]; };
const kartuKosong = (k) => `<p class="brt-lead">${esc(t(k))}</p>`;
const panah = (s, lalu) => (s == null ? "" : `<span class="brt-ubah ${s > 0 ? "naik" : s < 0 ? "turun" : "sama"}">${esc(s === -100 ? t("brt.an.ubah.turun_dari", { n: angka(lalu) }) : s > 0 ? t("brt.an.ubah.naik", { p: angka(s) }) : s < 0 ? t("brt.an.ubah.turun", { p: angka(-s) }) : t("brt.an.ubah.sama"))}</span>`);
const stat3 = (xs) => `<dl class="brt-an-st">${xs.map(([ik, k, v]) => `<div>${ikon(ik, 16)}<dt>${esc(t(k))}</dt><dd>${angka(v)}</dd></div>`).join("")}</dl>`;

/* 1 */
function ramai(K0) {
  const [cs, gk] = rata(klaster(K0.B.filter((r) => K0.ak - Date.parse(r.terbit) <= 30 * HARI)).slice(0, 6));
  if (!cs.length) return bagian(K0, { id: "ex-an-ramai", ik: "berita", ey: "brt.an.ramai.ey", judulHtml: esc(t("brt.an.ramai.ey")), sub: "brt.an.ramai.sub", isi: kartuKosong("brt.an.ramai.kosong"), cara: "brt.an.ramai.cara" });
  const kartu = cs.map((c) => {
    const f = c.rows.find((r) => fotoBerita(K0.FOTO, r.id)), lg = c.media.slice(0, 4).map((m) => logo(c.rows.find((r) => r.media === m))).join("");
    return `<li class="brt-an-k">${f ? `<span class="brt-an-ft"><img src="${esc(fotoBerita(K0.FOTO, f.id))}" width="320" height="180" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>` : ""}
      <div class="brt-an-kb">${tautan(c.lead, esc(c.lead.judul))}<span class="brt-meta"><span class="brt-an-logos">${lg}</span><b>${esc(t("brt.an.media_n", { n: angka(c.media.length) }))}</b><span>${esc(tanggal(c.lead.terbit.slice(0, 10)))}</span></span></div></li>`;
  }).join("");
  return bagian(K0, { id: "ex-an-ramai", ik: "berita", ey: "brt.an.ramai.ey", judulHtml: hlHtml("brt.an.ramai.j", angka(cs[0].media.length)), sub: "brt.an.ramai.sub", isi: `<ul class="${gk}">${kartu}</ul>`, cara: "brt.an.ramai.cara" });
}
/* 2 */
function isu(K0) {
  const [hs, gk] = rata(hitungIsu(K0.B, K0.ak));
  const isi = hs.length ? `<ul class="${gk}">${hs.map((x) => `<li><button type="button" class="brt-an-k brt-an-isu" data-cari="${esc(x.cari)}"><b class="brt-an-n">${esc(t("brt.an.i." + x.id))}</b>
    <span class="brt-an-v">${esc(t("brt.an.v.berita7", { n: angka(x.h7) }))}</span>${panah(x.selisih, x.lalu)}${stat3([["berita", "brt.an.isu.h24", x.h24], ["kalender", "brt.an.isu.h7", x.h7], ["kalender", "brt.an.isu.lalu.h", x.lalu]])}</button></li>`).join("")}</ul>` : kartuKosong("brt.an.isu.kosong");
  return bagian(K0, { id: "ex-an-isu", ik: "topik", ey: "brt.an.isu.ey", judulHtml: hs.length ? hlHtml("brt.an.isu.j", t("brt.an.i." + hs[0].id)) : esc(t("brt.an.isu.ey")), sub: "brt.an.isu.sub", isi, cara: "brt.an.isu.cara" });
}
/* 3 */
const spark = (d, ak) => {
  const mx = Math.max(1, ...d), n = d.length, w = 120, h = 36, dx = w / Math.max(1, n - 1), tgl = (i) => tanggal(new Date(ak - (n - 1 - i) * HARI).toISOString().slice(0, 10));
  const pts = sparkPoin(d, w, h), pk = d.indexOf(Math.max(...d));
  const hover = d.map((v, i) => `<rect x="${(i * dx - dx / 2).toFixed(1)}" y="0" width="${dx.toFixed(1)}" height="${h}" fill="transparent"><title>${esc(tgl(i))}: ${esc(angka(v))}</title></rect>`).join("");
  return `<svg class="brt-an-sp" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(d.join(", "))}"><polygon class="brt-an-ar" points="0,${h} ${pts} ${w},${h}"/><polyline points="${pts}" fill="none" vector-effect="non-scaling-stroke"/>${hover}</svg>
    <span class="brt-an-sx"><span>${esc(tgl(0))}</span><b>${esc(t("brt.an.tren.puncak", { n: angka(d[pk]), d: tgl(pk) }))}</b><span>${esc(tgl(n - 1))}</span></span>`;
};
function tren(K0) {
  const hitung = (f) => { const m = new Map(); for (const r of K0.B) for (const k of f(r)) m.set(k, (m.get(k) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]).slice(0, 6); };
  const kartu = (jenis, k, nama, ikonHtml) => {
    const cocok = (r) => (jenis === "tek" ? (r.kepakaran || []).includes(k) : r.media === k);
    const d = harian(K0.B, cocok, K0.ak), n = d.reduce((a, b) => a + b, 0);
    return `<li><button type="button" class="brt-an-k brt-an-tr" data-bukti="${jenis}:${esc(k)}"><span class="brt-an-n">${ikonHtml}<b>${esc(nama)}</b></span>${spark(d, K0.ak)}<span class="brt-an-ft2"><span>${esc(t("brt.an.tren.30", { n: angka(n) }))}</span><span class="jm-aksi-b" title="${esc(t("brt.an.buka"))}" aria-label="${esc(t("brt.an.buka"))}">${ikon("berita", 18)}</span></span></button></li>`;
  };
  const tk = hitung((r) => r.kepakaran || []), md = hitung((r) => [r.media]);
  const tkH = tk.map(([k]) => kartu("tek", k, label("brt.tek.", k), `<span class="brt-an-ic">${IKT[k] || ikon("tek-listrik", 18)}</span>`)).join(""), mdH = md.map(([k]) => kartu("media", k, k, logo(K0.B.find((r) => r.media === k)))).join("");
  const d0 = tk.length ? harian(K0.B, (r) => (r.kepakaran || []).includes(tk[0][0]), K0.ak) : [0];
  return bagian(K0, { id: "ex-an-tren", ik: "analisis", ey: "brt.an.tren.ey", judulHtml: hlHtml("brt.an.tren.j", angka(Math.max(...d0))), sub: "brt.an.tren.sub",
    isi: `<h3 class="brt-grup">${esc(t("brt.an.tren.topik"))}</h3><ul class="brt-an-grid brt-an-c3">${tkH}</ul><h3 class="brt-grup">${esc(t("brt.an.tren.media"))}</h3><ul class="brt-an-grid brt-an-c3">${mdH}</ul>`, cara: "brt.an.tren.cara" });
}
/* 4 */
function tier(K0) {
  const per = Object.fromEntries(TIER.map((k) => [k, K0.B.filter((r) => r._tier === k)])), N = K0.B.length;
  const ubin = TIER.map((k) => `<li><button type="button" class="brt-an-k brt-an-tier" data-tier="${k}" aria-pressed="false"><b class="brt-an-n">${esc(t("brt.an.tier." + k))}</b><span class="brt-an-v">${angka(per[k].length)}</span><span class="brt-meta">${esc(t("brt.an.tier.persen", { p: angka(Math.round(per[k].length / N * 100)), n: angka(N) }))}</span></button></li>`).join("");
  return bagian(K0, { id: "ex-an-tier", ik: "tingkat", ey: "brt.an.tier.ey", judulHtml: hlHtml("brt.an.tier.j", angka(per.utama.length)), sub: "brt.an.tier.sub", hipotesis: true,
    isi: `<ul class="brt-an-grid brt-an-c5">${ubin}</ul><ul class="brt-an-list" id="brAnTier" aria-live="polite"></ul>`, cara: "brt.an.tier.cara" });
}
/* 5 */
function desak(K0) {
  const dalam = K0.B.filter((r) => DESAK_KATA.test(r.judul));
  const [hs, gk] = rata(DESAK.map(([id, re]) => ({ id, rows: dalam.filter((r) => re.test(r.judul)) })).filter((x) => x.rows.length).sort((a, b) => b.rows.length - a.rows.length));
  const isi = hs.length ? `<ul class="${gk}">${hs.map((x) => `<li class="brt-an-k"><span class="brt-an-n"><b>${esc(t("brt.an.d." + x.id))}</b></span><span class="brt-an-v">${angka(x.rows.length)}</span><ul class="brt-an-list">${x.rows.slice(0, 2).map(baris).join("")}</ul></li>`).join("")}</ul>` : kartuKosong("brt.an.desak.kosong");
  return bagian(K0, { id: "ex-an-desak", ik: "orang", ey: "brt.an.desak.ey", judulHtml: hlHtml("brt.an.desak.j", angka(dalam.length)), sub: "brt.an.desak.sub", isi, cara: "brt.an.desak.cara" });
}
/* 6 */
function kebijakan(K0) {
  const baru = K0.B.filter((r) => K0.ak - Date.parse(r.terbit) <= 30 * HARI);
  const [hs, gk] = rata(KEBIJAKAN.map(([id, re, ke]) => ({ id, ke, rows: baru.filter((r) => re.test(r.judul)) })).filter((x) => x.rows.length));
  const total = new Set(hs.flatMap((x) => x.rows.map((r) => r.id))).size;
  const isi = hs.length ? `<ul class="${gk}">${hs.map((x) => `<li class="brt-an-k"><span class="brt-an-n"><b>${esc(t("brt.an.k." + x.id))}</b></span><span class="brt-an-v">${angka(x.rows.length)}</span><ul class="brt-an-list">${x.rows.slice(0, 2).map(baris).join("")}</ul>
    <a class="brt-an-ln jm-aksi-b" href="${x.ke}" title="${esc(t(x.ke === "/regulasi" ? "brt.an.k.regulasi" : "brt.an.k.kalender"))}" aria-label="${esc(t(x.ke === "/regulasi" ? "brt.an.k.regulasi" : "brt.an.k.kalender"))}">${ikon("panah-kanan", 18)}</a></li>`).join("")}</ul>` : kartuKosong("brt.an.keb.kosong");
  return bagian(K0, { id: "ex-an-keb", ik: "regulasi", ey: "brt.an.keb.ey", judulHtml: hlHtml("brt.an.keb.j", angka(total)), sub: "brt.an.keb.sub", isi, cara: "brt.an.keb.cara" });
}
/* 7 */
function dunia(K0) {
  const en = K0.B.filter((r) => r.bahasa === "en").map((r) => ({ r, n: negaraMedia(hostDari(r)) })).filter((x) => x.n && x.n !== "id");
  const per = new Map();
  for (const x of en) (per.get(x.n) || per.set(x.n, []).get(x.n)).push(x.r);
  const hs0 = [...per].map(([n, rows]) => ({ n, rows, ...banding(rows, () => true, K0.ak, 7) })).sort((a, b) => b.a - a.a || b.rows.length - a.rows.length);
  const [hs, gk] = rata(hs0);
  if (!hs0.length) return bagian(K0, { id: "ex-an-dunia", ik: "bahasa", ey: "brt.an.dunia.ey", judulHtml: esc(t("brt.an.dunia.ey")), sub: "brt.an.dunia.sub", isi: kartuKosong("brt.an.dunia.kosong"), cara: "brt.an.dunia.cara" });
  const bdr = (n) => BENDERA_ADA.has(n) ? `<img class="brt-an-bdr" src="/img/bendera/${n}.svg" width="24" height="16" alt="" loading="lazy">` : `<span class="brt-an-bdr brt-an-kode">${esc(n.toUpperCase())}</span>`;
  const kartu = hs.map((x) => `<li class="brt-an-k"><span class="brt-an-n">${bdr(x.n)}<b>${esc(t("brt.an.n." + x.n))}</b></span><span class="brt-an-v">${esc(t("brt.an.v.berita7", { n: angka(x.a) }))}</span>${panah(x.selisih, x.b)}${stat3([["kalender", "brt.an.isu.h7", x.a], ["kalender", "brt.an.isu.lalu.h", x.b], ["berita", "brt.an.dunia.total.h", x.rows.length]])}<ul class="brt-an-list">${x.rows.slice(0, 1).map(baris).join("")}</ul></li>`).join("");
  const n7 = hs0.reduce((a, x) => a + x.a, 0);
  return bagian(K0, { id: "ex-an-dunia", ik: "bahasa", ey: "brt.an.dunia.ey", judulHtml: hlHtml("brt.an.dunia.j", angka(n7)), sub: "brt.an.dunia.sub", isi: `<ul class="${gk}">${kartu}</ul>`, cara: "brt.an.dunia.cara" });
}

function dialog() {
  let d = document.getElementById("brAnDlg");
  if (!d) { d = document.createElement("dialog"); d.id = "brAnDlg"; d.className = "brt-an-dlg"; document.body.append(d); d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-tutup]")) d.close(); }); }
  return d;
}
function pasang(el) {
  if (el.dataset.pasang) return; el.dataset.pasang = 1;
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-bukti]");
    if (b) {
      const [jenis, k] = b.dataset.bukti.split(":"), rows = K.B.filter((r) => (jenis === "tek" ? (r.kepakaran || []).includes(k) : r.media === k)).slice(0, 30), d = dialog();
      d.innerHTML = `<div class="brt-an-dh"><h3>${esc(t("brt.an.dlg.j", { nama: jenis === "tek" ? label("brt.tek.", k) : k }))}</h3><button type="button" class="jm-aksi-b" data-tutup aria-label="${esc(t("brt.an.tutup"))}">${ikon("silang", 18)}</button></div><ul class="brt-an-list">${rows.map(baris).join("")}</ul>`;
      return d.showModal();
    }
    const tr = e.target.closest("[data-tier]");
    if (tr) {
      const on = tr.getAttribute("aria-pressed") !== "true";
      for (const x of el.querySelectorAll("[data-tier]")) x.setAttribute("aria-pressed", String(on && x === tr));
      document.getElementById("brAnTier").innerHTML = on ? K.B.filter((r) => r._tier === tr.dataset.tier).slice(0, 8).map(baris).join("") : "";
    }
  });
}

/** Gambar semua bagian analisis ke `el`. B = baris berita (terbaru dulu). */
export async function gambarAnalisis(el, { B, FOTO, dibangun }) {
  if (!el || !B.length) return;
  let tabel = { tier: {}, daerah_prefiks: [], nama: {} };
  try { tabel = await muat("media_tier"); } catch { /* tanpa tabel: bawaan nasional/internasional */ }
  const tb = (r) => (tabel.nama?.[r.media] ? { ...r, media: tabel.nama[r.media] } : r);
  for (const r of B) r._tier = tierMedia(tb(r), tabel);
  K = { B, FOTO: FOTO || {}, dibangun, ak: Math.max(...B.map((r) => Date.parse(r.terbit))) };
  el.innerHTML = [ramai, isu, tren, tier, desak, kebijakan, dunia].map((f) => f(K)).join("");
  pasang(el);
  el.addEventListener("error", (e) => { if (e.target.tagName === "IMG") e.target.closest(".brt-an-ft")?.remove(); }, true);
}
