/* Peta koroplet provinsi interaktif (SVG): lima kelas warna (inf-k0..4 dari info.css), lambang di provinsi yang cukup lebar,
   tooltip lewat data-tip (inti/tip_grafik.js), klik/Enter memilih provinsi. Dipakai /perizinan dan /keandalan.
   data: Map(kode -> {kelas: 0..4|null, tip: "Nama: nilai"}); nama(kode) -> teks. */
import { esc } from "/inti/umum.js";
import { jalurPerProvinsi, geoProvinsi } from "/inti/peta_indonesia.js";
import "/inti/tip_grafik.js";

const LEBAR = 960, TINGGI = Math.round((LEBAR * 18) / 47.5);
function kotak(d) {
  let best = null;
  for (const sub of d.split("M").filter(Boolean)) {
    const p = [...sub.matchAll(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g)].map((m) => [+m[1], +m[2]]);
    if (!best || p.length > best.p.length) best = { p };
  }
  if (!best) return null;
  const xs = best.p.map((q) => q[0]), ys = best.p.map((q) => q[1]);
  return { lx: Math.max(...xs) - Math.min(...xs), cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2 };
}
export async function petaKoroplet({ data, nama, label, legenda = [] }) {
  const g = await geoProvinsi();
  if (!g) return "";
  const isi = jalurPerProvinsi(g, LEBAR, TINGGI).map(({ kode, d }) => {
    const x = data.get(kode), tip = x?.tip || nama(kode), b = kotak(d);
    const kelas = x?.kelas == null ? "inf-kx" : "inf-k" + x.kelas;
    const lamb = b && b.lx >= 34 ? `<image class="inf-lb" href="/img/provinsi/${esc(kode)}.png" x="${(b.cx - 9).toFixed(1)}" y="${(b.cy - 9).toFixed(1)}" width="18" height="18" aria-hidden="true"/>` : "";
    return `<path class="inf-pv ${kelas}" d="${d}" data-kode="${esc(kode)}" data-tip="${esc(tip)}" tabindex="0" role="button" aria-label="${esc(tip)}"/>${lamb}`;
  }).join("");
  const lg = legenda.map((l) => `<span class="inf-lg"><i class="${l.kelas}"></i>${esc(l.teks)}</span>`).join("");
  return `<div class="inf-peta jm-gf"><svg viewBox="0 0 ${LEBAR} ${TINGGI}" role="group" aria-label="${esc(label)}" focusable="false">${isi}</svg><div class="inf-legenda">${lg}</div></div>`;
}
/** Klik atau Enter/Spasi pada provinsi memanggil onPilih(kode). */
export function pasangPeta(akar, onPilih) {
  const f = (e) => { const p = e.target.closest(".inf-pv"); if (p) onPilih(p.dataset.kode); };
  akar.addEventListener("click", f);
  akar.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(e); } });
}
