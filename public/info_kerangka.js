/* Kerangka halaman informasi (paket pemda, kebijakan, desa energi, izin dan kontrak): kamus teks per halaman (/data/teks_<nama>.json,
   id+en), seksi exhibit, tabel urut berpaginasi bernomor, peta provinsi berlambang, kartu "butuh unduhan pemilik", sumber bertanggal.
   Hanya informasi: tidak ada kalkulator atau alat. Teks UI tinggal di kamus JSON, bukan di JS. */
import { bahasa, angka, tanggal, bahasaData } from "/i18n.js";
import { esc, ikon, nanti } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { temuanHtml, sumberLipat, pil } from "/analisis.js";

let kamus = { id: {}, en: {} };
export async function muatTeks(nama) {
  const r = await fetch(`/data/teks_${nama}.json`, { credentials: "same-origin" });
  if (!r.ok) throw new Error("teks");
  kamus = await r.json();
}
export function tt(k, p) {
  const s = kamus[bahasaData()]?.[k] ?? kamus.id[k];
  if (s === undefined) return k;
  return p ? s.replace(/\{(\w+)\}/g, (m, n) => (p[n] !== undefined ? p[n] : m)) : s;
}
export const L = (o) => (o && typeof o === "object" ? o[bahasaData()] ?? o.id ?? "" : o ?? "");
export const num = (v, d = 0) => angka(v, { desimal: d });
export const tgl = (s) => tanggal(s);
export const url = (u) => (/^https:\/\//.test(u || "") ? u : null);
export const tautan = (u, teks) => (url(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : esc(teks));
export const labelPil = (k, jenis = "warn") => `<span class="jm-pil jm-pil-${jenis}">${esc(tt(k))}</span>`;
export const estPil = () => pil("an.est");

/** Seksi exhibit: judul = kalimat berangka (angka disorot), sub = nama metrik. */
export const seksi = ({ id, ik, topik, judul, turunan = true, sub = "", isi, csv = false, kelas = "" }) =>
  exHtml({ id, kelas, ikon: ik, topik, judulHtml: temuanHtml(judul, turunan), subHtml: esc(sub), aksiHtml: aksiHtml({ csv }), isiHtml: isi });
export const catatan = (teks) => `<p class="jm-bantu inf-cat">${esc(teks)}</p>`;
/** Teks naratif rata kanan-kiri. */
export const narasi = (teks) => `<p class="inf-narasi">${esc(teks)}</p>`;

/** Sumber bertanggal (dilipat): [{sumber, halaman?, url?, tanggal, tahun?}] */
export const sumber = (daftar) => sumberLipat(daftar.map((s) => ({ ...s, url: url(s.url) })));

// Kartu "butuh unduhan pemilik" = label internal: tidak ditampilkan ke publik (JM-S06).
export const butuhDaftar = () => "";

/* ---------- tabel urut berpaginasi bernomor ----------
   kolom: [{k, label (teks), v(r) nilai urut/tampil mentah, f(r) HTML sel (default esc(v)), num, tengah}]
   Urut dan halaman memakai SELURUH data (bukan DOM); chrome (aria-sort, nomor tersorot) berubah seketika, isi menyusul lewat nanti(). */
export function tabel(akar, { kolom, baris, per = 10, satuan = "jm.pag.u.data", urut = null, label = "" }) {
  const st = { k: urut?.k ?? null, arah: urut?.arah ?? 1, hal: 1 };
  const nilai = (r, k) => kolom.find((c) => c.k === k).v(r);
  const susun = () => {
    if (!st.k) return baris;
    return [...baris].sort((a, z) => {
      const x = nilai(a, st.k), y = nilai(z, st.k);
      return ((x == null) - (y == null)) || (x == null ? 0 : (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "id", { numeric: true })) * st.arah);
    });
  };
  const gambar = () => {
    const a = susun(), mulai = (st.hal - 1) * per;
    const th = `<th class="jm-tengah" data-urut="tidak">${esc(tt("tabel.no"))}</th>` + kolom.map((c) => `<th aria-sort="${st.k === c.k ? (st.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-kol="${esc(c.k)}">${esc(c.label)}</button></th>`).join("");
    const tr = a.slice(mulai, mulai + per).map((r, i) => `<tr><td class="jm-tengah" data-label="${esc(tt("tabel.no"))}">${num(mulai + i + 1)}</td>${kolom.map((c) => `<td data-label="${esc(c.label)}"${c.num ? ' class="jm-num"' : c.tengah ? ' class="jm-tengah"' : ""}><span>${c.f ? c.f(r) : esc(c.v(r) ?? "-")}</span></td>`).join("")}</tr>`).join("");
    akar.innerHTML = `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak" aria-label="${esc(label)}"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>${paginasiHtml({ hal: st.hal, total: a.length, per, satuan })}`;
  };
  akar.addEventListener("click", (e) => {
    const u = e.target.closest(".jm-urut"), h = e.target.closest("[data-hal]");
    if (u) {
      const k = u.dataset.kol; st.arah = st.k === k ? -st.arah : 1; st.k = k; st.hal = 1;
      for (const th of akar.querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", th === u.parentElement ? (st.arah > 0 ? "ascending" : "descending") : "none");
      nanti(gambar);
    } else if (h && !h.disabled) {
      st.hal = Number(h.dataset.hal); sorotHalaman(h, st.hal); nanti(gambar);
    }
  });
  gambar();
  // CSV penuh (bukan hanya halaman terlihat)
  akar.closest(".jm-ex")?.addEventListener("jm:csv", (e) => { e.detail.baris = [[tt("tabel.no"), ...kolom.map((c) => c.label)], ...susun().map((r, i) => [i + 1, ...kolom.map((c) => c.v(r) ?? "")])]; });
  return { ulang: gambar };
}

/* ---------- peta provinsi berlambang ----------
   data: Map(kode -> {nilai, teks}); lima kelas kuantil (inf-k0..inf-k4, gelap = nilai besar); lambang di provinsi yang cukup lebar. */
let geo = null;
const muatGeo = () => (geo ??= fetch("/geo/provinsi.json").then((r) => r.json()).catch(() => { geo = null; return null; }));
const cincin = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates).flatMap((p) => p.slice(0, 1));
export async function petaHtml(data, { nama, onPilih, pilih = null, lebar = 640 } = {}) {
  const g = await muatGeo();
  if (!g) return "";
  const W = Math.max(300, Math.min(960, Math.round(lebar))), X0 = 94.6, X1 = 141.2, Y0 = -11.2, Y1 = 6.2, k = W / (X1 - X0), H = Math.round((Y1 - Y0) * k);
  const px = ([x, y]) => [((x - X0) * k).toFixed(1), ((Y1 - y) * k).toFixed(1)];
  const nil = [...data.values()].map((d) => d.nilai).filter((v) => v != null).sort((a, z) => a - z);
  const batas = [1, 2, 3, 4].map((i) => nil[Math.floor((nil.length * i) / 5)]);
  const kelas = (v) => (v == null ? "inf-kx" : "inf-k" + batas.filter((b) => v >= b).length);
  const isi = g.features.map((f) => {
    const kode = String(f.properties.kode), d = data.get(kode), rs = cincin(f.geometry);
    const jalan = rs.map((r) => "M" + r.filter((_, i) => i % 2 === 0 || i === r.length - 1).map((p) => px(p).join(",")).join("L") + "Z").join("");
    const besar = rs.reduce((a, r) => (r.length > a.length ? r : a), rs[0]);
    const xs = besar.map((p) => +px(p)[0]), ys = besar.map((p) => +px(p)[1]), lx = Math.max(...xs) - Math.min(...xs);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const judul = `${nama(kode)}: ${d ? d.teks : tt("peta.tanpa")}`;
    return `<path class="inf-pv ${kelas(d?.nilai)}${pilih === kode ? " on" : ""}" d="${jalan}" data-kode="${kode}" tabindex="0" role="button" aria-label="${esc(judul)}"><title>${esc(judul)}</title></path>${lx >= 34 ? `<image class="inf-lb" href="/img/provinsi/${kode}.png" x="${(cx - 9).toFixed(1)}" y="${(cy - 9).toFixed(1)}" width="18" height="18" aria-hidden="true"/>` : ""}`;
  }).join("");
  const legenda = [0, 1, 2, 3, 4].map((i) => `<span class="inf-lg"><i class="inf-k${i}"></i>${esc(i === 0 ? tt("peta.rendah") : i === 4 ? tt("peta.tinggi") : "")}</span>`).join("");
  const peta = `<div class="inf-peta"><svg class="jm-gx" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(tt("peta.label"))}" focusable="false">${isi}</svg><div class="inf-legenda">${legenda}</div></div>`;
  return peta;
}
export function pasangPeta(akar, onPilih) {
  const f = (e) => { const p = e.target.closest(".inf-pv"); if (p) onPilih(p.dataset.kode); };
  akar.addEventListener("click", f);
  akar.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(e); } });
}
/** Bendera negara ASEAN (iso3 -> /img/bendera/<iso2>.svg) di samping nama; tanpa bendera bila iso3 tak dikenal. */
const ISO2 = { IDN: "id", VNM: "vn", PHL: "ph", THA: "th", MYS: "my", SGP: "sg", LAO: "la", KHM: "kh", MMR: "mm", BRN: "bn", TLS: "tl" };
export const bendera = (iso3, nama) => (ISO2[iso3] ? `<span class="jm-bd-n"><img class="jm-bd" src="/img/bendera/${ISO2[iso3]}.svg" width="20" height="15" alt="" loading="lazy" data-galat="hapus"><span>${esc(nama)}</span></span>` : esc(nama));
/** Lambang kecil di samping nama provinsi. */
export const lambang = (kode, ukuran = 18) => `<img class="inf-lb-kecil" src="/img/provinsi/${esc(kode)}.png" width="${ukuran}" height="${ukuran}" alt="" loading="lazy" data-galat="hapus">`;

/** Tooltip batang dipasang lewat title oleh analisis.js; di sini hanya pembantu bobot persen. */
export const persen = (v, d = 1) => (v == null ? "-" : `${num(v, d)}%`);
export const saatBahasa = (fn) => document.addEventListener("jm:bahasa", fn);

/** Grafik garis satu seri dengan tooltip tiap titik (<title>) dan garis acuan putus-putus. titik: [{x, y, teks}]; ref: [{y, teks}]. */
export function garisSvg({ titik, ref = [], lebar = 640, tinggi = 260, label = "" }) {
  const W = Math.max(300, Math.round(lebar)), H = tinggi, L = 44, R = 16, T = 14, B = 28;
  const xs = titik.map((p) => p.x), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const ym = Math.max(...titik.map((p) => p.y), ...ref.map((r) => r.y)) * 1.12 || 1;
  const x = (v) => L + ((v - x0) / (x1 - x0 || 1)) * (W - L - R), y = (v) => T + (1 - v / ym) * (H - T - B);
  const grid = [0, 1, 2, 3, 4].map((i) => { const v = (ym * i) / 4; return `<line class="gr" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(num(v, 0))}</text>`; }).join("");
  const sb = [x0, Math.round((x0 + x1) / 2), x1].map((v) => `<text x="${x(v).toFixed(1)}" y="${H - 8}" text-anchor="middle">${v}</text>`).join("");
  const garis = `<polyline class="g g1" points="${titik.map((p) => `${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ")}"/>`;
  const titikEl = titik.map((p) => `<circle class="t1" cx="${x(p.x).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="5"><title>${esc(p.teks)}</title></circle>`).join("");
  const acuan = ref.map((r) => `<line class="ref" x1="${L}" x2="${W - R}" y1="${y(r.y).toFixed(1)}" y2="${y(r.y).toFixed(1)}"><title>${esc(r.teks)}</title></line><text x="${W - R}" y="${(y(r.y) - 5).toFixed(1)}" text-anchor="end">${esc(r.teks)}</text>`).join("");
  return `<svg class="inf-garis jm-gx" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" focusable="false">${grid}${sb}${acuan}${garis}${titikEl}</svg>`;
}
