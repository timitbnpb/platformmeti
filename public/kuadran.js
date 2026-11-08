/* /kuadran: kuadran pemain EBT (tiru "Indonesia's state companies, mapped"). Data = /data/kuadran.json (scripts/pipa/kuadran.mjs).
   Skor Hipotesis 0..5; tanpa sumber = null, tampil di jalur putus-putus "tanpa angka terbit", bukan nol.
   Teks antarmuka khusus halaman ini ada di /i18n/kuadran.json (fungsi k()); teks bersama lewat t().
   INP: klik chip/sumbu mengubah chrome (aria-pressed) seketika; plot dan tabel digambar ulang sesudahnya lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, bahasa, angka, tanggal, tanggalSah } from "/i18n.js";
import { esc, nanti, ikon } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { ikonTek } from "/inti/ikon_tek.js";
import "/inti/tip_grafik.js";

const $ = (id) => document.getElementById(id);
const KAM = { id: {}, en: {} };
const k = (kunci, p) => {
  const s = KAM[bahasa()]?.[kunci] ?? KAM.id[kunci] ?? kunci;
  return p ? s.replace(/\{(\w+)\}/g, (m, n) => (p[n] !== undefined ? p[n] : m)) : s;
};
const tgl = (s) => (tanggalSah(s) ? tanggal(s) : String(s));
const f1 = (n) => angka(n, { desimal: 1 });
const PER = 12;
const ARAH_BURUK = new Set(["risiko"]);
const IKON_PASANG = ["grafik", "kompas", "kalkulator", "buku", "peringatan"];
const SEKTOR = ["bumn", "swasta", "internasional", "lainnya"];
const SVG_MIN = `<svg class="jm-ik" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg>`;
const SVG_PANAH = `<svg class="kq-urut-ik" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5"/></svg>`;

let D, UK, BYID, ANAK, INDUK, MED;
const S = { pasang: 0, x: "kapasitas", y: "pipeline", sek: null, tek: null, id: null, q: "", urut: { k: "kapasitas", arah: -1 }, hal: 1, v: { z: 1, cx: 2.6, cy: 2.5 } };
const skor = (e, u) => e.skor[u]?.skor ?? null;
const ringkas = (n) => String(n).replace(/^PT\.?\s+/i, "").replace(/\s*\((Persero|IPP|GDE)\)/i, "").replace(/\s+Tbk\.?$/i, "").replace(/\s+(Pte\.?\s+)?Ltd\.?$/i, "");
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
const huruf = (n) => ringkas(n).charAt(0);
const cocokFilter = (e) => (!S.sek || e.kategori === S.sek) && (!S.tek || e.teknologi.includes(S.tek));

/* ---------- data turunan ---------- */
function siapkan() {
  UK = D.ukuran.map((u) => u.kunci);
  BYID = new Map(D.entitas.map((e) => [e.id, e]));
  ANAK = new Map(); INDUK = new Map();
  for (const s of D.sisi) { (ANAK.get(s.induk) || ANAK.set(s.induk, []).get(s.induk)).push(s); (INDUK.get(s.anak) || INDUK.set(s.anak, []).get(s.anak)).push(s); }
  MED = Object.fromEntries(UK.map((u) => [u, median(D.entitas.map((e) => skor(e, u)).filter((v) => v != null))]));
}
const namaSimpul = (id) => BYID.get(id)?.nama || D.simpul_luar[id]?.nama || id;
const kuad = (x, y, mx, my) => (x >= mx ? (y >= my ? "ka" : "kb") : y >= my ? "ki" : "kib");
const namaKuad = (q) => (S.pasang >= 0 ? k(`p.${S.pasang}.${q}`) : k(`c.${q}`, { x: k("us." + S.x), y: k("us." + S.y) }));

/* ---------- kepala, alat ---------- */
function kepala() {
  document.title = k("title");
  $("kqEy").textContent = k("eyebrow");
  $("kqHip").textContent = k("hipotesis");
  $("kqHip").title = k("hipotesis.ket");
  $("judul").textContent = k("h1");
  const mw = D.entitas.reduce((s, e) => s + (e.kapasitas_mw || 0), 0), pi = D.entitas.reduce((s, e) => s + (e.pipeline_mw || 0), 0);
  $("kqLead").textContent = k("lead", { n: angka(D.jumlah), mw: angka(Math.round(mw)) });
  khUbin("ubin", [
    { ikon: "gedung", nilai: angka(D.jumlah), label: k("ubin.pemain") },
    { ikon: "tek-listrik", nilai: angka(Math.round(mw)), satuan: "MW", label: k("ubin.mw") },
    { ikon: "linimasa", nilai: angka(Math.round(pi)), satuan: "MW", label: k("ubin.pipa") },
    { ikon: "kajian", nilai: angka(D.entitas.filter((e) => skor(e, "keuangan") != null).length), label: k("ubin.fin") },
    { ikon: "rantai", nilai: angka(D.sisi.length), label: k("ubin.anak") },
  ]);
}
const chip = (aksi, v, teks, aktif, ik = "", n = null) =>
  `<button type="button" class="kq-chip${aktif ? " on" : ""}" data-aksi="${aksi}" data-v="${esc(v)}" aria-pressed="${aktif}">${ik}<span>${esc(teks)}</span>${n == null ? "" : `<b>${angka(n)}</b>`}</button>`;
function alat() {
  const opsi = (sel) => UK.map((u) => `<option value="${u}"${u === sel ? " selected" : ""}>${esc(k("u." + u))}</option>`).join("");
  const teks = [...new Set(D.entitas.flatMap((e) => e.teknologi))].sort();
  $("kqAlat").innerHTML = `
    <div class="kq-grup"><h2 class="kq-h">${esc(k("alat.pasangan"))}</h2><div class="kq-seg kq-seg5">${D.pasangan.map((_, i) => chip("pasang", i, k("p." + i), S.pasang === i, ikon(IKON_PASANG[i], 16))).join("")}</div></div>
    <div class="kq-grup"><h2 class="kq-h">${esc(k("alat.bebas"))}</h2><div class="kq-seg kq-seg2">
      <label class="jm-pil-pilih">${ikon("tabel", 18)}<select data-asli data-aksi="sumbu" data-sb="x" aria-label="${esc(k("alat.x"))}">${opsi(S.x)}</select></label>
      <label class="jm-pil-pilih">${ikon("grafik", 18)}<select data-asli data-aksi="sumbu" data-sb="y" aria-label="${esc(k("alat.y"))}">${opsi(S.y)}</select></label></div></div>
    <div class="kq-grup"><h2 class="kq-h">${esc(k("alat.sektor"))}</h2><div class="kq-seg kq-seg5">${chip("sek", "", k("alat.semua"), !S.sek, "", D.entitas.length)}${SEKTOR.filter((s) => D.entitas.some((e) => e.kategori === s)).map((s) => chip("sek", s, k("sek." + s), S.sek === s, "", D.entitas.filter((e) => e.kategori === s).length)).join("")}</div></div>
    <div class="kq-grup"><h2 class="kq-h">${esc(k("alat.tek"))}</h2><div class="kq-seg kq-seg5">${chip("tek", "", k("teknologi.semua"), !S.tek, "", D.entitas.length)}${teks.map((x) => chip("tek", x, t("tk.nama." + x), S.tek === x, ikonTek(x), D.entitas.filter((e) => e.teknologi.includes(x)).length)).join("")}</div></div>`;
}

/* ---------- plot ---------- */
function titik() {
  const ada = [], kiri = [], bawah = [];
  for (const e of D.entitas) {
    const x = skor(e, S.x), y = skor(e, S.y);
    if (x != null && y != null) ada.push({ e, x, y });
    else if (x == null && y != null) kiri.push({ e, y });
    else if (x != null && y == null) bawah.push({ e, x });
  }
  return { ada, kiri, bawah, tanpa2: D.entitas.length - ada.length - kiri.length - bawah.length };
}
function plot() {
  const bungkus = $("kqPlotBungkus"), W = Math.max(300, Math.round(bungkus.clientWidth || 360)), kecil = W < 600;
  const H = kecil ? Math.round(W * 1.15) : Math.min(780, Math.round(W * 0.86));
  const ml = 30, mr = 10, mt = 24, mb = 30, LW = kecil ? 46 : 64, LH = kecil ? 58 : 60;
  const px0 = ml + LW, px1 = W - mr, py0 = mt, py1 = H - mb - LH, pw = px1 - px0, ph = py1 - py0;
  const { z, cx, cy } = S.v, dxw = 5.6 / z, dyw = 5.6 / z * (ph / pw) * (kecil ? 0.72 : 1.1);
  const dx0 = cx - dxw / 2, dx1 = cx + dxw / 2, dy0 = cy - dyw / 2, dy1 = cy + dyw / 2;
  const X = (v) => px0 + ((v - dx0) / (dx1 - dx0)) * pw, Y = (v) => py1 - ((v - dy0) / (dy1 - dy0)) * ph;
  const P = titik(), mx = MED[S.x], my = MED[S.y], r = kecil ? 13 : 16;
  const pts = [];
  P.ada.forEach((p) => pts.push({ ...p, px: X(p.x), py: Y(p.y) }));
  P.kiri.forEach((p, i) => pts.push({ ...p, px: ml + LW / 2 + ((i % 3) - 1) * (LW / 3.2), py: Y(p.y), lajur: "kiri" }));
  P.bawah.forEach((p, i) => pts.push({ ...p, px: X(p.x), py: py1 + 20 + (LH - 20) / 2 + ((i % 2) - 0.5) * (r * 0.7), lajur: "bawah" }));
  const luar = (p) => !p.lajur ? (p.px < px0 - r || p.px > px1 + r || p.py < py0 - r || p.py > py1 + r) : p.lajur === "kiri" ? (p.py < py0 || p.py > py1) : (p.px < px0 || p.px > px1);
  const lihat = pts.filter((p) => !luar(p));
  /* label: tempatkan menurut penting; geser dengan garis penunjuk bila bertabrakan */
  const kotak = lihat.map((p) => ({ x: p.px - r, y: p.py - r, w: 2 * r, h: 2 * r }));
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const urut = [...lihat].sort((a, b) => (b.e.id === S.id) - (a.e.id === S.id) || (cocokFilter(b.e) - cocokFilter(a.e)) || totalSkor(b.e) - totalSkor(a.e));
  const cpl = Math.max(8, Math.floor((pw / 2 - 14) / 6.2)), bungkusKata = (tx) => { const o = []; let b = ""; for (const w of tx.split(" ")) { if (b && (b + " " + w).length > cpl) { o.push(b); b = w; } else b = b ? b + " " + w : w; } if (b) o.push(b); return o; };
  const sudutDef = [["ki", px0 + 6, py0 + 14, "start", 1], ["ka", px1 - 6, py0 + 14, "end", 1], ["kib", px0 + 6, py1 - 8, "start", -1], ["kb", px1 - 6, py1 - 8, "end", -1]].map(([q, x, y, a, d]) => { const ls = bungkusKata(namaKuad(q)), n = ls.length, y0 = d > 0 ? y : y - (n - 1) * 13, wmax = Math.max(...ls.map((l) => l.length)) * 6.4; return { q, x, y0, a, ls, kt: { x: a === "start" ? x : x - wmax, y: y0 - 12, w: wmax, h: n * 13 + 2 } }; });
  const label = new Map(), taruh = [...sudutDef.map((c) => c.kt), { x: ml, y: py0 - 20, w: 112, h: 14 }, { x: px1 - 112, y: H - 18, w: 112, h: 14 }];
  for (const p of urut) {
    const tk = ringkas(p.e.nama), tx = tk.length > 20 ? tk.slice(0, 19) + "…" : tk, w = tx.length * 6.3 + 6, h = 15;
    let pilih = null;
    for (const jr of [r + 4, r + 20, r + 40]) {
      for (const a of [0, 180, 270, 90, 315, 45, 225, 135, 20, 160, 200, 340]) {
        const rad = (a * Math.PI) / 180, ax = p.px + Math.cos(rad) * jr, ay = p.py - Math.sin(rad) * jr;
        const kt = { x: Math.cos(rad) >= 0.3 ? ax : Math.cos(rad) <= -0.3 ? ax - w : ax - w / 2, y: Math.sin(rad) >= 0.3 ? ay - h : Math.sin(rad) <= -0.3 ? ay : ay - h / 2, w, h };
        if (kt.x < ml || kt.x + kt.w > W - 2 || kt.y < py0 - 2 || kt.y + kt.h > H - 2) continue;
        if (kotak.some((o, i) => lihat[i] !== p && hit(kt, o)) || taruh.some((o) => hit(kt, o))) continue;
        pilih = { kt, tx, jr, ax, ay, a };
        break;
      }
      if (pilih) break;
    }
    if (pilih) { taruh.push(pilih.kt); label.set(p.e.id, pilih); }
  }
  const gX = (v) => v >= dx0 && v <= dx1, gY = (v) => v >= dy0 && v <= dy1;
  const garis = [mx != null && gX(mx) ? `<line class="kq-med" x1="${X(mx)}" x2="${X(mx)}" y1="${py0}" y2="${py1}"/>` : "", my != null && gY(my) ? `<line class="kq-med" x1="${px0}" x2="${px1}" y1="${Y(my)}" y2="${Y(my)}"/>` : ""].join("");
  const grid = [0, 1, 2, 3, 4, 5].map((v) => `${gX(v) ? `<line class="kq-grid" x1="${X(v)}" x2="${X(v)}" y1="${py0}" y2="${py1}"/>` : ""}${gY(v) ? `<line class="kq-grid" x1="${px0}" x2="${px1}" y1="${Y(v)}" y2="${Y(v)}"/>` : ""}`).join("");
  const angkaSumbu = [0, 1, 2, 3, 4, 5].map((v) => `${gX(v) ? `<text class="kq-t" x="${X(v)}" y="${py1 + 14}" text-anchor="middle">${v}</text>` : ""}${gY(v) ? `<text class="kq-t" x="${px0 - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>` : ""}`).join("");
  const labelMed = [mx != null && gX(mx) ? `<text class="kq-t kq-t-med" x="${X(mx)}" y="${py0 - 8}" text-anchor="middle">${esc(k("plot.median", { v: f1(mx) }))}</text>` : "", my != null && gY(my) ? `<text class="kq-t kq-t-med" x="${px1 - 4}" y="${Y(my) - 4}" text-anchor="end">${esc(k("plot.median", { v: f1(my) }))}</text>` : ""].join("");
  const sudut = sudutDef.map((c) => `<text class="kq-t kq-kuad" x="${c.x}" y="${c.y0}" text-anchor="${c.a}">${c.ls.map((l, i) => `<tspan x="${c.x}" dy="${i ? 13 : 0}">${esc(l)}</tspan>`).join("")}</text>`).join("");
  const sentuh = (p) => {
    const e = p.e, redup = !cocokFilter(e) || (S.id && S.id !== e.id), l = label.get(e.id);
    const nama = ringkas(e.nama), nilai = `${k("us." + S.x)} ${p.x != null ? f1(p.x) : "-"}, ${k("us." + S.y)} ${p.y != null ? f1(p.y) : "-"}`;
    const isi = e.logo ? `<circle class="kq-lat" r="${r}"/><image href="${esc(e.logo)}" x="${-r + 2}" y="${-r + 2}" width="${2 * r - 4}" height="${2 * r - 4}" preserveAspectRatio="xMidYMid meet"/>` : `<circle class="kq-mono kq-k-${e.kategori}" r="${r}"/><text class="kq-t kq-huruf" y="5" text-anchor="middle">${esc(huruf(e.nama))}</text>`;
    const pen = l && l.jr > r + 6 ? `<line class="kq-penunjuk" x1="${p.px + Math.cos((l.a * Math.PI) / 180) * r}" y1="${p.py - Math.sin((l.a * Math.PI) / 180) * r}" x2="${l.ax}" y2="${l.ay}"/>` : "";
    const lbl = l ? `<text class="kq-t kq-nama" x="${l.kt.x + (l.kt.w - 6) / 2 + 3}" y="${l.kt.y + 11}" text-anchor="middle">${esc(l.tx)}</text>` : "";
    return `<g class="kq-titik${redup ? " kq-redup" : ""}${e.id === S.id ? " kq-pilih" : ""}" data-id="${esc(e.id)}" tabindex="0" role="button" aria-label="${esc(nama + ", " + nilai)}">${pen}<g transform="translate(${p.px.toFixed(1)} ${p.py.toFixed(1)})">${isi}</g>${lbl}<title>${esc(e.nama + ": " + nilai)}</title></g>`;
  };
  const lajurKiri = `<rect class="kq-lajur" x="${ml}" y="${py0}" width="${LW - 4}" height="${ph}" rx="6"/><text class="kq-t kq-t-lajur" x="${ml}" y="${py0 - 8}">${esc(k("plot.lajur"))}</text>`;
  const lajurBawah = `<rect class="kq-lajur" x="${px0}" y="${py1 + 20}" width="${pw}" height="${LH - 20}" rx="6"/><text class="kq-t kq-t-lajur" x="${px1}" y="${H - 6}" text-anchor="end">${esc(k("plot.lajur"))}</text>`;
  const ket = k("plot.ket", { x: k("u." + S.x), y: k("u." + S.y), n: P.ada.length });
  bungkus.innerHTML = `<div class="kq-plotbar"><h2 class="kq-h">${esc(k("plot.judul"))}: ${esc(k("u." + S.x))} x ${esc(k("u." + S.y))}</h2><div class="kq-zoom" role="group" aria-label="Zoom">
    <button type="button" class="kq-zb" data-aksi="zoom" data-v="1" aria-label="${esc(k("plot.zoom_masuk"))}" title="${esc(k("plot.zoom_masuk"))}">${ikon("tambah", 18)}</button>
    <button type="button" class="kq-zb" data-aksi="zoom" data-v="-1" aria-label="${esc(k("plot.zoom_keluar"))}" title="${esc(k("plot.zoom_keluar"))}">${SVG_MIN}</button>
    <button type="button" class="kq-zb" data-aksi="zoom" data-v="0" aria-label="${esc(k("plot.reset"))}" title="${esc(k("plot.reset"))}">${ikon("balik", 18)}</button></div></div>
    <svg class="kq-svg jm-gx" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="${esc(ket)}"><defs><clipPath id="kqKlip"><rect x="${px0}" y="${py0}" width="${pw}" height="${ph}"/></clipPath></defs>
    <rect class="kq-latar" x="${px0}" y="${py0}" width="${pw}" height="${ph}" rx="4"/>
    <g clip-path="url(#kqKlip)">${grid}${garis}</g>${angkaSumbu}${labelMed}
    ${lajurKiri}${lajurBawah}${sudut}
    ${lihat.map(sentuh).join("")}</svg>
    <p class="kq-sumbu-ket"><span>${esc(k("u." + S.x))}</span><span>${esc(k("plot.skala"))}</span><span>${esc(k("u." + S.y))}</span></p>
    <p class="jm-bantu kq-petunjuk">${ikon("info", 16)}<span>${esc(k("plot.petunjuk"))}</span></p>
    ${P.ada.length + P.kiri.length + P.bawah.length ? "" : `<p class="kq-kosong">${esc(k("plot.kosong"))}</p>`}`;
  siapa(P, mx, my);
  S.geom = { px0, px1, py0, py1, dx0, dx1, dy0, dy1 };
}
const totalSkor = (e) => UK.reduce((s, u) => s + (skor(e, u) || 0), 0);
function siapa(P, mx, my) {
  const g = { ka: [], ki: [], kb: [], kib: [] };
  for (const p of P.ada) g[kuad(p.x, p.y, mx, my)].push(p.e);
  const urutKu = (a) => [...a].sort((p, q) => totalSkor(q) - totalSkor(p));
  const kartu = ["ka", "ki", "kb", "kib"].map((q) => `<section class="kq-kuadran kq-q-${q}"><h3>${esc(namaKuad(q))}</h3><p class="kq-jml">${esc(k("siapa.jumlah", { n: angka(g[q].length) }))}</p>
    <ul>${urutKu(g[q]).slice(0, 4).map((e) => `<li><button type="button" class="kq-nm" data-aksi="buka" data-v="${esc(e.id)}">${logoMini(e)}<span>${esc(ringkas(e.nama))}</span></button></li>`).join("")}</ul></section>`).join("");
  const lajur = P.kiri.length + P.bawah.length;
  $("kqSiapa").innerHTML = `<h2 class="kq-h">${esc(k("siapa.judul"))}</h2>${kartu}<section class="kq-kuadran kq-q-lajur"><h3>${esc(k("siapa.tanpa"))}</h3><p class="kq-jml">${esc(k("siapa.jumlah", { n: angka(lajur) }))}</p>${P.tanpa2 ? `<p class="jm-bantu">${esc(k("siapa.tanpa2", { n: angka(P.tanpa2) }))}</p>` : ""}</section>`;
}
const logoMini = (e) => (e.logo ? `<img class="kq-lg" src="${esc(e.logo)}" alt="" width="24" height="24" loading="lazy" decoding="async" data-galat="hapus">` : `<i class="kq-lg kq-lg-mono kq-k-${e.kategori}" aria-hidden="true">${esc(huruf(e.nama))}</i>`);

/* ---------- kartu ---------- */
const band = (v) => (v < 5 / 3 ? 1 : v < 10 / 3 ? 2 : 3);
const pilSkor = (u, s) => s.skor == null ? `<span class="kq-pil kq-tanpa">${esc(k("kartu.tanpa"))}</span>` : `<span class="kq-pil kq-b${band(s.skor)}${ARAH_BURUK.has(u) ? " kq-rev" : ""}"><i class="kq-dot" aria-hidden="true"></i><b>${f1(s.skor)}</b></span>`;
const sumberHtml = (a) => a.map((s) => {
  const luar = /^https?:/.test(s.url);
  return `<li><a href="${esc(s.url)}"${luar ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(s.judul)}</a><span class="jm-bantu"> ${esc(tgl(s.tanggal))}</span></li>`;
}).join("");
function pohon(id, dalam, lihat) {
  const sisi = dalam ? ANAK.get(id) || [] : INDUK.get(id) || [];
  return sisi.length ? `<ul class="kq-pohon">${sisi.map((s) => {
    const nid = dalam ? s.anak : s.induk, ada = BYID.has(nid), sub = dalam && !lihat.has(nid) ? pohon(nid, true, new Set([...lihat, nid])) : "";
    const persen = s.persen == null ? k("kartu.persen_null") : k("kartu.persen", { p: angka(s.persen, { desimal: s.persen % 1 ? 2 : 0 }) });
    const nm = ada ? `<button type="button" class="kq-nm" data-aksi="buka" data-v="${esc(nid)}"><span>${esc(ringkas(namaSimpul(nid)))}</span></button>` : `<span>${esc(ringkas(namaSimpul(nid)))}</span>`;
    const baris = `${nm}<b class="kq-persen">${esc(persen)}</b><a class="kq-src" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(k("kartu.sumber_tgl", { judul: s.judul, tgl: tgl(s.tanggal) }))}" aria-label="${esc(s.judul)}">${ikon("tautan", 16)}</a>`;
    return sub ? `<li><details open><summary>${baris}</summary>${sub}</details></li>` : `<li><div class="kq-baris">${baris}</div></li>`;
  }).join("")}</ul>` : "";
}
function aliran(e) {
  const a = e.aliran; if (!a) return "";
  const W = 320, H = 40 + a.lini.length * 34, tot = a.total, fmt = (v) => `${angka(v, { desimal: 1 })} ${a.satuan}`;
  let y = 20;
  const bars = a.lini.map((l, i) => {
    const h = Math.max(10, (l.nilai / tot) * (H - 40)), y0 = 20 + a.lini.slice(0, i).reduce((s, q) => s + (q.nilai / tot) * (H - 40), 0), y1 = y; y += h + 6;
    return `<path class="kq-s${i}" d="M14 ${y0.toFixed(1)}C100 ${y0.toFixed(1)} 100 ${y1.toFixed(1)} 186 ${y1.toFixed(1)}V${(y1 + h).toFixed(1)}C100 ${(y1 + h).toFixed(1)} 100 ${(y0 + (l.nilai / tot) * (H - 40)).toFixed(1)} 14 ${(y0 + (l.nilai / tot) * (H - 40)).toFixed(1)}Z"/><rect class="kq-sb${i}" x="186" y="${y1.toFixed(1)}" width="8" height="${h.toFixed(1)}"/><text class="kq-t kq-t-sk" x="200" y="${(y1 + h / 2 + 4).toFixed(1)}">${esc(k("aliran." + l.kunci))}: ${esc(fmt(l.nilai))}</text>`;
  }).join("");
  return `<section class="kq-bag"><h3>${esc(k("kartu.aliran", { tahun: a.tahun }))}</h3><svg class="kq-sankey" viewBox="0 0 ${W + 120} ${H + 8}" role="img" aria-label="${esc(k("kartu.aliran", { tahun: a.tahun }) + ": " + fmt(tot))}"><rect class="kq-sb-t" x="6" y="20" width="8" height="${H - 40}"/><text class="kq-t kq-t-sk" x="6" y="12">${esc(k("aliran.total"))}: ${esc(fmt(tot))}</text>${bars}</svg>
    <ul class="kq-sum">${sumberHtml(a.lini.map((l) => ({ judul: k("aliran." + l.kunci), url: l.sumber_url, tanggal: l.tanggal })))}</ul></section>`;
}
function kartuHtml(e) {
  const ik = e.logo ? `<img class="kq-logo" src="${esc(e.logo)}" alt="" width="56" height="56" decoding="async" data-galat="hapus">` : `<i class="kq-logo kq-lg-mono kq-k-${e.kategori}" aria-hidden="true">${esc(huruf(e.nama))}</i>`;
  const skorHtml = UK.map((u) => {
    const s = e.skor[u];
    return `<li class="kq-skor"><div class="kq-skor-kepala"><span class="kq-skor-nm">${esc(k("u." + u))}</span>${pilSkor(u, s)}${s.skor != null ? `<span class="kq-rank">${esc(k("kartu.peringkat", { k: s.peringkat, n: s.dari }))}</span>` : ""}${s.est ? `<span class="jm-pil">${esc(k("kartu.est"))}</span>` : ""}</div>
      <p class="kq-alasan">${esc(s.alasan[bahasa()] || s.alasan.id)}${ARAH_BURUK.has(u) ? " " + esc(k("kartu.buruk")) : ""}</p>${s.sumber.length ? `<ul class="kq-sum">${sumberHtml(s.sumber)}</ul>` : ""}</li>`;
  }).join("");
  const fin = ["aset", "pendapatan", "laba"].map((m) => { const f = e.keuangan.find((x) => x.metrik === m); return `<div class="kq-fin"><dt>${esc(k("kartu.fin." + m))}</dt><dd>${f ? `<b>${esc(k("kartu.fin.nilai", { nilai: angka(f.nilai, { desimal: f.nilai % 1 ? 1 : 0 }), satuan: f.satuan, tahun: f.tahun }))}</b><span class="jm-bantu">${esc(angka(f.idr_t, { desimal: 1 }))} T IDR (EST)</span>` : `<span class="kq-kosong-s">${esc(k("kartu.tanpa"))}</span>`}</dd></div>`; }).join("");
  const sebelum = pohon(e.id, false, new Set()), sesudah = pohon(e.id, true, new Set([e.id]));
  const ada = e.di_direktori;
  return `<div class="kq-kartu-atas"><div class="kq-kartu-id">${ik}<div><h2 id="kqKartuJudul">${esc(e.nama)}</h2><p class="kq-meta"><span class="jm-pil kq-pk-${e.kategori}">${esc(k("sek." + e.kategori))}</span>${e.teknologi.map((x) => `<span class="jm-pil kq-pt">${ikonTek(x)}${esc(t("tk.nama." + x))}</span>`).join("")}</p></div></div>
    <button type="button" class="kq-tutup" data-aksi="tutup" aria-label="${esc(k("kartu.tutup"))}">${ikon("tutup", 20)}</button></div>
    <div class="kq-aksi">${ada ? tombolIkuti({ jenis: "organisasi", id: e.id, nama: e.nama }) + `<a class="jm-tbl jm-tbl-kecil" href="/o/${esc(e.id)}">${ikon("orang", 16)}<span>${esc(k("kartu.profil"))}</span></a><a class="jm-tbl jm-tbl-kecil" href="/rantai-global?tab=tkdn&cari=${encodeURIComponent(e.nama)}">${ikon("rantai", 16)}<span>${esc(k("kartu.rantai"))}</span></a>` : `<span class="jm-bantu">${esc(k("kartu.diluar"))}</span>`}</div>
    <section class="kq-bag"><h3>${esc(k("kartu.skor"))}</h3><ul class="kq-skors">${skorHtml}</ul></section>
    <section class="kq-bag"><h3>${esc(k("kartu.keuangan"))}</h3><dl class="kq-fins">${fin}</dl></section>
    ${aliran(e)}
    <section class="kq-bag"><h3>${esc(k("kartu.grup"))}</h3>${sebelum ? `<h4>${esc(k("kartu.dimiliki"))}</h4>${sebelum}` : ""}${sesudah ? `<h4>${esc(k("kartu.anak"))}</h4>${sesudah}` : ""}${sebelum || sesudah ? "" : `<p class="jm-bantu">${esc(k("kartu.grup.kosong"))}</p>`}</section>`;
}
function buka(id) {
  const e = BYID.get(id); if (!e) return;
  S.id = id;
  const dlg = $("kqKartu");
  dlg.innerHTML = kartuHtml(e);
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  pasangIkuti(dlg);
  try { const u = new URL(location.href); u.searchParams.set("id", id); history.replaceState(null, "", u); } catch {}
  redupkan();
}
function tutup() {
  S.id = null;
  const dlg = $("kqKartu"); if (dlg.open) dlg.close();
  try { const u = new URL(location.href); u.searchParams.delete("id"); history.replaceState(null, "", u); } catch {}
  redupkan();
}
function redupkan() {
  for (const g of document.querySelectorAll(".kq-titik")) {
    const id = g.dataset.id, e = BYID.get(id);
    g.classList.toggle("kq-redup", !cocokFilter(e) || !!(S.id && S.id !== id));
    g.classList.toggle("kq-pilih", id === S.id);
  }
}

/* ---------- tabel ---------- */
function tabel() {
  const q = S.q.trim().toLowerCase();
  let a = D.entitas.filter((e) => cocokFilter(e) && (!q || e.nama.toLowerCase().includes(q)));
  const { k: kk, arah } = S.urut;
  const nilai = (e) => (kk === "nama" ? e.nama.toLowerCase() : kk === "sektor" ? e.kategori : skor(e, kk));
  a = [...a].sort((p, r) => { const u = nilai(p), v = nilai(r); if (u == null && v == null) return p.nama.localeCompare(r.nama); if (u == null) return 1; if (v == null) return -1; return (u < v ? -1 : u > v ? 1 : 0) * (kk === "nama" || kk === "sektor" ? -arah : arah) || p.nama.localeCompare(r.nama); });
  const hal = Math.min(S.hal, Math.max(1, Math.ceil(a.length / PER))), baris = a.slice((hal - 1) * PER, hal * PER);
  const kolom = [["nama", k("tabel.pemain")], ["sektor", k("tabel.sektor")], ...UK.map((u) => [u, k("us." + u)])];
  const th = kolom.map(([kc, nm]) => `<th scope="col" aria-sort="${S.urut.k === kc ? (S.urut.arah < 0 ? "descending" : "ascending") : "none"}"><button type="button" class="kq-th${S.urut.k === kc ? " on" : ""}" data-aksi="urut" data-v="${kc}" title="${esc(k("tabel.urut", { k: nm }))}"><span>${esc(nm)}</span>${SVG_PANAH}</button></th>`).join("");
  const tr = baris.map((e) => `<tr><td data-label="${esc(k("tabel.pemain"))}"><button type="button" class="kq-nm" data-aksi="buka" data-v="${esc(e.id)}" aria-label="${esc(k("tabel.buka", { nama: e.nama }))}">${logoMini(e)}<span>${esc(ringkas(e.nama))}</span></button></td>
    <td data-label="${esc(k("tabel.sektor"))}" class="jm-tengah">${esc(k("sek." + e.kategori))}</td>${UK.map((u) => { const s = e.skor[u]; return `<td data-label="${esc(k("us." + u))}" class="jm-tengah">${s.skor == null ? `<span class="kq-tanpa-s" title="${esc(k("kartu.tanpa"))}">-</span>` : `<div class="kq-cel">${pilSkor(u, s)}<span class="kq-rank">#${s.peringkat}</span></div>`}</td>`; }).join("")}</tr>`).join("");
  $("kqTabel").innerHTML = `<div class="kq-bag-kepala"><h2 class="kq-h2">${esc(k("tabel.judul"))}</h2><label class="jm-cari">${ikon("cari", 18)}<input type="search" id="kqCari" value="${esc(S.q)}" placeholder="${esc(k("tabel.cari"))}" aria-label="${esc(k("tabel.cari"))}" autocomplete="off"></label></div>
    <div class="jm-gulir"><table class="jm-tabel kq-tabel"><thead><tr>${th}</tr></thead><tbody>${tr || `<tr><td colspan="${kolom.length}">${esc(k("tabel.kosong"))}</td></tr>`}</tbody></table></div>${paginasiHtml({ hal, total: a.length, per: PER })}`;
  S.hal = hal;
  if (S.fokusCari) { const i = $("kqCari"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); S.fokusCari = false; }
}

/* ---------- metode ---------- */
function metode() {
  $("kqMetode").innerHTML = `<h2 class="kq-h2">${esc(k("metode.judul"))} <span class="jm-pil jm-pil-warn">${esc(k("hipotesis"))}</span></h2><p>${esc(k("metode.intro", { nmin: D.nmin }))}</p>
    <h3>${esc(k("metode.rumus"))}</h3><dl class="kq-rumus">${D.ukuran.map((u) => `<div><dt>${esc(k("u." + u.kunci))}</dt><dd>${esc(u.rumus[bahasa()] || u.rumus.id)}</dd></div>`).join("")}</dl>
    <h3>${esc(k("metode.keterbatasan"))}</h3><ul class="kq-bul">${[1, 2, 3, 4, 5].map((i) => `<li>${esc(k("metode.b" + i))}</li>`).join("")}<li>${esc(k("metode.kurs", { kurs: angka(D.kurs.usd_idr), tgl: tgl(D.kurs.tanggal) }))}</li></ul>
    <ul class="kq-sum">${sumberHtml(D.sumber.map((s) => ({ judul: s.judul + (s.lisensi ? " (" + s.lisensi + ")" : ""), url: s.url, tanggal: s.rilis || s.tanggal })))}</ul>`;
}

/* ---------- peristiwa ---------- */
function ubahChrome() { alat(); }
function gambarUlang() { nanti(() => { plot(); tabel(); }); }
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-aksi],[data-hal],.kq-titik");
  if (!el || S.geser) return;
  if (el.matches(".kq-titik")) { nanti(() => buka(el.dataset.id)); return; }
  if (el.dataset.hal) { const n = Number(el.dataset.hal); sorotHalaman(el, n); S.hal = n; nanti(tabel); return; }
  const { aksi, v } = el.dataset;
  if (aksi === "pasang") { const i = Number(v); S.pasang = i; [S.x, S.y] = D.pasangan[i]; S.v = { z: 1, cx: 2.6, cy: 2.5 }; ubahChrome(); gambarUlang(); }
  else if (aksi === "sek") { S.sek = v || null; S.hal = 1; ubahChrome(); redupkan(); nanti(() => { plot(); tabel(); }); }
  else if (aksi === "tek") { S.tek = v || null; S.hal = 1; ubahChrome(); redupkan(); nanti(() => { plot(); tabel(); }); }
  else if (aksi === "zoom") { const z = Number(v); S.v = z === 0 ? { z: 1, cx: 2.6, cy: 2.5 } : { ...S.v, z: Math.min(6, Math.max(1, S.v.z * (z > 0 ? 1.6 : 1 / 1.6))) }; nanti(plot); }
  else if (aksi === "buka") nanti(() => buka(v));
  else if (aksi === "tutup") tutup();
  else if (aksi === "urut") { S.urut = S.urut.k === v ? { k: v, arah: -S.urut.arah } : { k: v, arah: -1 }; S.hal = 1; nanti(tabel); }
});
document.addEventListener("keydown", (ev) => { const g = ev.target.closest?.(".kq-titik"); if (g && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); buka(g.dataset.id); } });
document.addEventListener("change", (ev) => {
  const el = ev.target.closest('select[data-aksi="sumbu"]'); if (!el) return;
  S[el.dataset.sb] = el.value; S.pasang = D.pasangan.findIndex((p) => p[0] === S.x && p[1] === S.y); S.v = { z: 1, cx: 2.6, cy: 2.5 };
  ubahChrome(); gambarUlang();
});
document.addEventListener("input", (ev) => { if (ev.target.id !== "kqCari") return; S.q = ev.target.value; S.hal = 1; S.fokusCari = true; nanti(tabel); });
document.addEventListener("pointerdown", (ev) => {
  const svg = ev.target.closest(".kq-svg"); if (!svg || ev.target.closest(".kq-titik") || S.v.z <= 1) return;
  const g = S.geom, ax = (g.dx1 - g.dx0) / (g.px1 - g.px0), ay = (g.dy1 - g.dy0) / (g.py1 - g.py0), x0 = ev.clientX, y0 = ev.clientY, v0 = { ...S.v };
  let gerak = false, rAF = 0;
  svg.setPointerCapture(ev.pointerId);
  const pindah = (e) => {
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (!gerak && Math.hypot(dx, dy) < 4) return;
    gerak = true; S.geser = true;
    S.v = { ...v0, cx: Math.min(5, Math.max(0, v0.cx - dx * ax)), cy: Math.min(5, Math.max(0, v0.cy + dy * ay)) };
    if (!rAF) rAF = requestAnimationFrame(() => { rAF = 0; plot(); });
  };
  const selesai = () => { svg.removeEventListener("pointermove", pindah); svg.removeEventListener("pointerup", selesai); svg.removeEventListener("pointercancel", selesai); setTimeout(() => { S.geser = false; }, 0); };
  svg.addEventListener("pointermove", pindah); svg.addEventListener("pointerup", selesai); svg.addEventListener("pointercancel", selesai);
});
$("kqKartu").addEventListener("click", (ev) => { if (ev.target === $("kqKartu")) tutup(); });
$("kqKartu").addEventListener("cancel", () => { S.id = null; setTimeout(redupkan, 0); });
let lebar = 0;
new ResizeObserver(() => { const w = $("kqPlotBungkus").clientWidth; if (D && w && Math.abs(w - lebar) > 8) { lebar = w; plot(); } }).observe($("kqPlotBungkus"));

/* ---------- mulai ---------- */
function semua() { kepala(); alat(); plot(); tabel(); metode(); }
async function mulai() {
  await mulaiHalaman();
  try {
    const [kam, data] = await Promise.all([fetch("/i18n/kuadran.json").then((r) => r.json()), fetch("/data/kuadran.json").then((r) => r.json())]);
    Object.assign(KAM, kam); D = data;
  } catch {
    $("kqTabel").innerHTML = `<p class="jm-galat" role="alert">${esc(k("memuat.galat"))}</p>`;
    return;
  }
  siapkan();
  [S.x, S.y] = D.pasangan[0];
  lebar = $("kqPlotBungkus").clientWidth;
  semua();
  const id = new URL(location.href).searchParams.get("id");
  if (id && BYID.has(id)) nanti(() => buka(id));
  document.addEventListener("jm:bahasa", () => { semua(); if (S.id) buka(S.id); });
}
mulai();
