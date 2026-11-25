/* /jaringan: cangkang peta layar penuh. SATU instans MapLibre dipakai Kembaran, Bauran, dan Aliran; ganti tab = ganti lapis dan isi panel (tanpa muat ulang peta).
   Modul peta mendaftarkan pemasang lapis lewat pasangPeta(fn) (dipanggil tiap gaya dasar dimuat, termasuk saat tema berganti) dan menyalakan/mematikan lapisnya lewat aktif(on).
   Panel kiri: bisa dilipat di desktop; di <= 768 px jadi lembar bawah yang bisa ditarik. Kontrak: KEMBARAN-JARINGAN.md §6b. */
import { t } from "/jr_umum.js";
import { bukaPeta } from "/jr_bbm.js";

const BAWAH = [94, -11.5, 141.5, 6.5];
const STADIA = [0, 0.46, 0.86]; // tinggi lembar bawah: tertutup (hanya pegangan), setengah, tinggi
const $ = (id) => document.getElementById(id);
const hp = matchMedia("(max-width:768px)");
const fns = [];
let peta = null, petaP = null, siap = false, stadia = 1;

export const bawahSlot = (k) => $("bw-" + k);
export const lembar = () => hp.matches;
/** Padding kamera agar objek berada di area yang tidak tertutup panel. */
export function padPeta() {
  const st = $("jr-stage"), p = $("jr-panel");
  if (!st || !p) return { top: 60, bottom: 40, left: 20, right: 20 };
  if (hp.matches) return { top: 64, left: 16, right: 16, bottom: Math.min(p.offsetHeight, st.clientHeight * 0.6) + 16 };
  return { top: 64, bottom: 56, right: 20, left: st.dataset.panel === "buka" ? p.offsetWidth + 28 : 20 };
}
export const kotakIndonesia = () => [[BAWAH[0], BAWAH[1]], [BAWAH[2], BAWAH[3]]];
export const sesuaikanKamera = () => peta?.easeTo({ padding: padPeta(), duration: 300 });
export const ukuranUlang = () => peta?.resize();

/** Peta bersama, dibuat malas saat tab peta pertama dibuka (wadah harus terlihat). Null bila pustaka gagal. */
export function petaBersama() {
  return (petaP ??= (async () => {
    peta = await bukaPeta($("jr-kanvas"), (m) => { siap = true; for (const f of fns) f(m); }, { bounds: kotakIndonesia(), padding: padPeta(), maksZoom: 13, kontrol: "top-right" });
    return peta;
  })());
}
/** Daftarkan pemasang lapis; langsung dipanggil bila gaya sudah termuat. */
export function pasangPeta(fn) { fns.push(fn); if (siap && peta) fn(peta); }

/** Buka panel (kartu objek menuntut panel terlihat). */
export function bukaPanel() {
  if (hp.matches) { if (stadia === 0) aturLembar(1); } else if ($("jr-stage").dataset.panel !== "buka") aturPanel(true);
  $("jr-pnl-isi").scrollTop = 0;
}

function aturPanel(buka) {
  $("jr-stage").dataset.panel = buka ? "buka" : "tutup";
  const b = $("jr-pnl-tgl");
  b.setAttribute("aria-expanded", String(buka));
  const k = t(buka ? "jr.app.panel_tutup" : "jr.app.panel_buka");
  b.setAttribute("aria-label", k); b.title = k;
  $("jr-panel").inert = !buka;
  sesuaikanKamera();
}
function aturLembar(i) {
  stadia = i;
  const st = $("jr-stage"), p = $("jr-panel");
  p.style.height = (i === 0 ? 64 : Math.round(st.clientHeight * STADIA[i])) + "px";
  st.dataset.lembar = String(i);
  sesuaikanKamera();
}
function tempatkanBawah() { // di lembar bawah, sakelar dan legenda ikut di dalam panel
  const b = $("jr-bawah");
  if (hp.matches) $("jr-pnl-isi").prepend(b); else $("jr-stage").append(b);
}

export function pasangPanel() {
  const p = $("jr-panel"), tgl = $("jr-pnl-tgl"), grip = $("jr-pnl-grip");
  tgl.addEventListener("click", () => aturPanel($("jr-stage").dataset.panel !== "buka"));
  aturPanel(true);
  let y0 = null, h0 = 0, seret = false;
  grip.addEventListener("pointerdown", (e) => { y0 = e.clientY; h0 = p.offsetHeight; seret = false; grip.setPointerCapture(e.pointerId); });
  grip.addEventListener("pointermove", (e) => {
    if (y0 == null) return;
    const d = y0 - e.clientY; if (Math.abs(d) > 4) seret = true;
    if (seret) p.style.height = Math.min(Math.max(64, h0 + d), $("jr-stage").clientHeight * 0.9) + "px";
  });
  grip.addEventListener("pointerup", () => {
    if (y0 == null) return; y0 = null;
    if (!seret) return;
    const st = $("jr-stage").clientHeight, h = p.offsetHeight, ukur = [64, st * STADIA[1], st * STADIA[2]];
    aturLembar(ukur.reduce((b, v, i) => (Math.abs(v - h) < Math.abs(ukur[b] - h) ? i : b), 0));
  });
  grip.addEventListener("click", () => { if (seret) { seret = false; return; } aturLembar((stadia + 1) % 3); });
  const sinkron = () => {
    tempatkanBawah();
    if (hp.matches) { p.inert = false; aturLembar(stadia); } else { p.style.height = ""; $("jr-stage").dataset.lembar = ""; aturPanel($("jr-stage").dataset.panel !== "tutup"); }
  };
  hp.addEventListener("change", sinkron);
  sinkron();
}
