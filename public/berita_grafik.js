/* Grafik berita (porting dari poskokarhutla banjir/berita.js: batang per hari + batang mendatar).
   ponytail: modul lokal; gabungkan ke public/grafik.js bila agent lain sudah menyediakannya. Warna lewat kelas, bukan hex. */
import { esc } from "/inti/umum.js";
import { t, angka, tanggal } from "/i18n.js";

const HARI = 86400000;
const hariKe = (iso) => Math.floor(Date.parse(iso) / HARI);
const awalMinggu = (d) => d - ((d + 3) % 7); // Senin; epoch hari 0 = Kamis

/** Batang vertikal per hari (30 hari) atau per minggu (14 minggu) sampai hari terakhir data. */
export function volumeSvg(rows, mode, akhirIso) {
  const akhir = hariKe(akhirIso), langkah = mode === "minggu" ? 7 : 1, n = mode === "minggu" ? 14 : 30;
  const a0 = mode === "minggu" ? awalMinggu(akhir) : akhir;
  const mulai = a0 - (n - 1) * langkah, per = new Array(n).fill(0);
  for (const r of rows) { const i = Math.floor((hariKe(r.terbit) - mulai) / langkah); if (i >= 0 && i < n) per[i]++; }
  const mx = Math.max(1, ...per), W = 620, bw = W / n;
  const tgl = (i) => new Date((mulai + i * langkah) * HARI).toISOString();
  const bar = per.map((v, i) => { const h = Math.max(1, (v / mx) * 90); return `<rect class="brt-bar" x="${(i * bw + 1.5).toFixed(1)}" y="${(100 - h).toFixed(1)}" width="${(bw - 3).toFixed(1)}" height="${h.toFixed(1)}" rx="2"><title>${esc(tanggal(tgl(i)))}: ${angka(v)}</title></rect>`; }).join("");
  return `<svg viewBox="0 0 ${W} 120" class="brt-svg" role="img" aria-label="${esc(t("brt.g.volume"))}">${bar}<text class="brt-sb" x="0" y="116">${esc(tanggal(tgl(0)))}</text><text class="brt-sb" x="${W}" y="116" text-anchor="end">${esc(tanggal(tgl(n - 1)))}</text><text class="brt-sb" x="${W}" y="10" text-anchor="end">${angka(mx)}</text></svg>`;
}

/** Batang mendatar: xs = [[teks, nilai]]. Lebar batang = atribut SVG persen. */
export function batangMendatar(xs, aksi) {
  const m = Math.max(1, ...xs.map((x) => x[1]));
  return `<ul class="brt-bb">${xs.map(([nm, v, kunci]) => {
    const isi = `<span class="brt-bb-n">${esc(nm)}</span><svg class="brt-bb-b" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect class="brt-bb-l" width="100" height="10" rx="3"/><rect class="brt-bb-i" width="${(v / m * 100).toFixed(1)}" height="10" rx="3"/></svg><em>${angka(v)}</em>`;
    return `<li>${aksi && kunci ? `<button type="button" class="brt-bb-r" data-${aksi}="${esc(kunci)}">${isi}</button>` : `<div class="brt-bb-r">${isi}</div>`}</li>`;
  }).join("")}</ul>`;
}
