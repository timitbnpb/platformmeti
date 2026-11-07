/* /topik: pembantu bersama cetakan topik mendalam (teks dua bahasa dari data/topik/ui.json, token angka, tabel urut + paginasi, grafik garis bertooltip, eksibit bab).
   Teks antarmuka halaman ini hidup di ui.json (id+en), bukan di kamus global; fungsi u() membacanya. */
import { bahasa, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { sumberLipat, pil } from "/analisis.js";

export const S = { ui: null, N: {}, sumber: {}, dipakai: new Set(), tabel: new Map() };
export const muat = (jalur) => fetch(jalur, { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

/** teks dua bahasa: {id,en} atau string */
export const L = (o) => (o == null ? "" : typeof o === "string" ? o : (o[bahasa()] ?? o.id ?? ""));
export const u = (kunci, p) => {
  const e = S.ui?.s?.[kunci];
  let s = e ? L(e) : kunci;
  if (p) s = s.replace(/\{(\w+)\}/g, (m, n) => (p[n] !== undefined ? p[n] : m));
  return s;
};
export const num = (v, d = 0) => (v == null || !Number.isFinite(+v) ? "-" : angka(+v, { desimal: d }));
/** ganti {token} dengan angka tercetak; token tak dikenal jadi "-" (tidak pernah tampil mentah) */
export const tok = (s) => String(L(s)).replace(/\{(\w+)\}/g, (m, n) => (S.N[n] !== undefined ? S.N[n] : "-"));
export const bulan = (p) => tanggal(p + "-01").replace(/^1 /, "");
export const aman = (url) => (/^https?:\/\//.test(url || "") ? url : null);
export const tautan = (url, teks) => (aman(url) ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : esc(teks));
export const pilu = (kunci, jenis = "warn") => `<span class="jm-pil jm-pil-${jenis}">${esc(u(kunci))}</span>`;
export const est = () => " " + pil("an.est");

/* ---------- sumber: peta id -> butir; sumberLipat dipakai ulang ---------- */
export function sumberHtml(ids = [], tambahan = []) {
  const a = [];
  for (const id of ids) { const s = S.sumber[id]; if (s) { S.dipakai.add(id); a.push({ sumber: s.judul + (s.penerbit ? ", " + s.penerbit : ""), url: s.url, tahun: s.tahun, tanggal: s.tanggal }); } }
  for (const s of tambahan) a.push(s);
  return sumberLipat(a);
}

/* ---------- eksibit bab ---------- */
export const IKON_GRUP = { A: "kajian", B: "buku", C: "grafik", D: "regulasi", E: "tek-listrik", F: "asean", G: "kartu", H: "orang", I: "linimasa", J: "berita", K: "bintang" };
export function eksibit(n, isi, { csv = false, sumber = "", sub = "", judul = "", kelas = "" } = {}) {
  const b = S.ui.bab[n], g = b.g;
  return exHtml({ id: "bab-" + n, ikon: IKON_GRUP[g], topik: `${g}. ${L(S.ui.grup[g])}`, judulHtml: esc(judul || L(b.j)), subHtml: sub ? esc(sub) : "", aksiHtml: aksiHtml({ csv, png: false, pdf: true, bagi: true }) + sumber, isiHtml: isi, kelas: "jm-tp-bab" + (kelas ? " " + kelas : "") });
}
export const teksHtml = (o, kelas = "jm-tp-p") => `<p class="${kelas}">${esc(tok(o))}</p>`;
export const catatan = (o) => (o ? `<p class="jm-bantu jm-tp-cat">${esc(tok(o))}</p>` : "");
export const kosong = () => `<p class="jm-bantu">${esc(u("sedang"))}</p>`;

/* ---------- tabel urut + paginasi bernomor; kolom: {k, l (teks), num, d, f(row)->html, v(row)->nilai urut, est} ---------- */
export function daftarTabel(id, kols, baris, per = 8) {
  S.tabel.set(id, { kols, baris, per, hal: 1, urut: null });
  return `<div class="jm-tp-tb" data-tb="${esc(id)}">${isiTabel(id)}</div>`;
}
function isiTabel(id) {
  const s = S.tabel.get(id);
  let b = s.baris;
  if (s.urut) {
    const k = s.kols.find((c) => c.k === s.urut.k);
    b = [...b].sort((x, z) => { const a = k.v(x), c = k.v(z); return ((a == null) - (c == null)) || (a == null ? 0 : (typeof a === "number" ? a - c : String(a).localeCompare(String(c), bahasa()))) * s.urut.arah; });
  }
  const dari = (s.hal - 1) * s.per;
  const kep = s.kols.map((c) => `<th${c.num ? ' class="jm-num"' : ""} aria-sort="${s.urut?.k === c.k ? (s.urut.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-urut="${esc(c.k)}">${esc(c.l)}${c.est ? est() : ""}</button></th>`).join("");
  const isi = b.slice(dari, dari + s.per).map((r) => `<tr>${s.kols.map((c) => `<td data-label="${esc(c.l)}"${c.num ? ' class="jm-num"' : ""}>${c.f(r)}</td>`).join("")}</tr>`).join("");
  return `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${kep}</tr></thead><tbody>${isi}</tbody></table></div>${paginasiHtml({ hal: s.hal, total: b.length, per: s.per })}`;
}
const teksSel = (h) => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent.replace(/\s+/g, " ").trim(); };
export function pasangTabel() {
  document.addEventListener("click", (e) => {
    const w = e.target.closest("[data-tb]");
    if (!w) return;
    const s = S.tabel.get(w.dataset.tb);
    const ub = e.target.closest("button[data-urut]"), hb = e.target.closest("button[data-hal]");
    if (ub) {
      s.urut = s.urut?.k === ub.dataset.urut ? { k: s.urut.k, arah: -s.urut.arah } : { k: ub.dataset.urut, arah: 1 };
      s.hal = 1;
      for (const x of w.querySelectorAll("th")) x.setAttribute("aria-sort", "none");
      ub.parentElement.setAttribute("aria-sort", s.urut.arah > 0 ? "ascending" : "descending");
    } else if (hb && !hb.disabled) {
      s.hal = +hb.dataset.hal;
      for (const b of w.querySelectorAll(".jm-pag-b")) b.classList.toggle("on", b.dataset.hal === hb.dataset.hal && !b.classList.contains("jm-pag-arah"));
    } else return;
    nanti(() => { const y = scrollY; w.innerHTML = isiTabel(w.dataset.tb); if (hb) w.scrollIntoView({ block: "nearest" }); else scrollTo(scrollX, y); });
  });
  document.addEventListener("jm:csv", (e) => {
    const w = e.target.querySelector?.("[data-tb]");
    if (!w || !e.target.classList.contains("jm-ex")) return;
    const s = S.tabel.get(w.dataset.tb);
    e.detail.baris = [s.kols.map((c) => c.l), ...s.baris.map((r) => s.kols.map((c) => teksSel(c.f(r))))];
  }, true);
}

/* ---------- grafik garis dengan titik bertooltip; seri: [{nama, v:[...], sorot, putus}] ---------- */
export function garisTip(labels, seri, { d = 0, satuan = "", label = "" } = {}) {
  const M = innerWidth < 640, W = M ? 420 : 680, H = M ? 260 : 240, Lk = 40, Rk = M ? 118 : 150, T = 14, B = H - 28, n = labels.length, fs = M ? 13 : 11.5;
  const mx = Math.max(1e-9, ...seri.flatMap((s) => s.v.filter((x) => x != null))) * 1.1;
  const X = (i) => Lk + (n > 1 ? (i / (n - 1)) * (W - Lk - Rk) : 0), Y = (v) => B - (v / mx) * (B - T), f = (v) => num(v, d);
  let g = [0, 1 / 3, 2 / 3, 1].map((q) => `<line class="jm-gf-grid" x1="${Lk}" x2="${W - Rk}" y1="${Y(mx * q).toFixed(1)}" y2="${Y(mx * q).toFixed(1)}"/><text class="jm-gf-t2" x="${Lk - 6}" y="${(Y(mx * q) + 4).toFixed(1)}" text-anchor="end" font-size="${fs - 1}">${esc(f(mx * q))}</text>`).join("");
  const langkah = Math.max(1, Math.ceil(n / (M ? 5 : 8)));
  g += labels.map((l, i) => ((i % langkah === 0 && n - 1 - i >= langkah) || i === n - 1 ? `<text class="jm-gf-t2" x="${X(i).toFixed(1)}" y="${B + 16}" text-anchor="${i === n - 1 ? "end" : "middle"}" font-size="${fs}">${esc(l)}</text>` : "")).join("");
  const ujung = [];
  for (const s of [...seri].sort((a, b) => !!a.sorot - !!b.sorot)) {
    const p = s.v.map((v, i) => (v == null ? null : [X(i), Y(v), v, i])).filter(Boolean);
    if (!p.length) continue;
    const z = p.at(-1);
    g += `<polyline class="jm-gf-gar ${s.sorot ? "jm-gf-sorot-g" : "jm-gf-gar-abu"}${s.putus ? " jm-tp-putus" : ""}" points="${p.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ")}"/>`;
    g += p.map((q) => `<circle class="jm-tp-hit${s.sorot ? " jm-tp-hit-s" : ""}" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${M ? 8 : 5}"><title>${esc(s.nama)}, ${esc(labels[q[3]])}: ${esc(f(q[2]) + satuan)}</title></circle>`).join("");
    ujung.push({ y: z[1], x: z[0], on: !!s.sorot, teks: `${s.nama} ${f(z[2])}${satuan}` });
  }
  ujung.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ujung.length; i++) if (ujung[i].y - ujung[i - 1].y < fs + 3) ujung[i].y = ujung[i - 1].y + fs + 3;
  g += ujung.map((x) => `<text class="jm-gf-t1${x.on ? " jm-gf-tb" : ""}" x="${(x.x + 8).toFixed(1)}" y="${(x.y + 4).toFixed(1)}" font-size="${fs - 1}">${esc(x.teks)}</text>`).join("");
  return `<svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" focusable="false">${g}</svg>`;
}
export const subjudul = (t) => `<h3 class="jm-tp-h3">${esc(t)}</h3>`;
export { esc, ikon, tanggal, pil, bahasa };
