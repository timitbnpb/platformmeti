/* Panel melayang yang bisa digeser dan diubah lebarnya (peta proyek, beranda, direktori, rantai, wilayah).
   geserPanel(el, { kunci, batas }): el = elemen position:absolute di dalam `batas` (default: induknya).
   Geser lewat kepala (summary/elemen pertama), pegangan tepi untuk lebar 220-480, snap ke sisi < 24px, posisi disimpan per halaman+kunci.
   Papan ketik: panah memindah 16px, Home mengembalikan. Sudut bawah mengubah tinggi. Peristiwa "jm:geser" dikirim ke el sesudah tiap perubahan. */
import { t } from "/i18n.js";

const SNAP = 24, MIN = 220, MIN_T = 160, LANGKAH = 16;
// lebar maks mengikuti wadah (pemilik 8 Nov 2026: "bisa digedein")
const maksLebar = (b) => Math.max(MIN, Math.min(900, b.width * 0.7));
const IK_GRIP = '<svg class="jm-geser-grip" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
const IK_RESET = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg>';

export function geserPanel(el, { kunci = "", batas = el.parentElement } = {}) {
  const KEY = `jm-geser:${location.pathname}:${kunci}`;
  const kepala = el.querySelector("summary") || el.firstElementChild;
  const gerak = matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 1; // tanpa animasi: perpindahan selalu langsung
  el.classList.add("jm-geser");
  const pegangan = document.createElement("span");
  pegangan.className = "jm-geser-pegangan"; pegangan.setAttribute("aria-hidden", "true");
  el.append(pegangan);
  const sudut = document.createElement("span");
  sudut.className = "jm-geser-sudut"; sudut.setAttribute("aria-hidden", "true");
  el.append(sudut);
  kepala.insertAdjacentHTML("afterbegin", IK_GRIP);
  const reset = document.createElement("button");
  reset.type = "button"; reset.className = "jm-geser-reset"; reset.hidden = true;
  reset.title = t("jm.geser.reset"); reset.setAttribute("aria-label", t("jm.geser.reset")); reset.innerHTML = IK_RESET;
  kepala.append(reset);
  kepala.tabIndex = 0;
  const awal = { style: el.getAttribute("style") || "" };
  const kotak = () => batas.getBoundingClientRect();
  const sebar = () => el.dispatchEvent(new CustomEvent("jm:geser", { bubbles: true }));
  const simpan = (v) => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch (e) { /* mode privat */ } };
  function pasang(x, y, w, h) {
    const b = kotak(), lebar = Math.min(maksLebar(b), Math.max(MIN, w ?? el.offsetWidth));
    x = Math.min(Math.max(0, x), Math.max(0, b.width - lebar)); y = Math.min(Math.max(0, y), Math.max(0, b.height - 44));
    Object.assign(el.style, { left: x + "px", top: y + "px", right: "auto", bottom: "auto", width: lebar + "px" });
    if (h) { const t = Math.min(Math.max(MIN_T, h), b.height - y - 8); el.style.height = t + "px"; el.style.maxHeight = t + "px"; }
    el.classList.toggle("sisi-kanan", x + lebar / 2 > b.width / 2);
    reset.hidden = false;
    return { x, y, w: lebar };
  }
  function simpanSaatIni() { const b = kotak(), r = el.getBoundingClientRect(); simpan({ x: r.left - b.left, y: r.top - b.top, w: r.width, h: el.style.height ? r.height : 0 }); }
  function kembali() { el.setAttribute("style", awal.style); el.classList.remove("sisi-kanan"); reset.hidden = true; simpan(null); sebar(); }
  reset.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); kembali(); });
  reset.addEventListener("pointerdown", (e) => e.stopPropagation());

  let st = null, digeser = false;
  kepala.addEventListener("pointerdown", (e) => {
    if (e.button || e.target.closest("button,a,input")) return;
    const b = kotak(), r = el.getBoundingClientRect();
    st = { id: e.pointerId, px: e.clientX, py: e.clientY, x: r.left - b.left, y: r.top - b.top, w: r.width }; digeser = false;
    kepala.setPointerCapture(e.pointerId);
  });
  kepala.addEventListener("pointermove", (e) => {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.px, dy = e.clientY - st.py;
    if (!digeser && Math.hypot(dx, dy) < 5) return;
    digeser = true; el.classList.add("menggeser");
    pasang(st.x + dx, st.y + dy, st.w);
  });
  const lepas = (e) => {
    if (!st || e.pointerId !== st.id) return;
    st = null; el.classList.remove("menggeser");
    if (!digeser) return;
    const b = kotak(), r = el.getBoundingClientRect(), x = r.left - b.left, y = r.top - b.top;
    pasang(x < SNAP ? 12 : b.width - r.width - x < SNAP ? b.width - r.width - 12 : x, y < SNAP ? 12 : y, r.width);
    simpanSaatIni(); sebar();
  };
  kepala.addEventListener("pointerup", lepas); kepala.addEventListener("pointercancel", lepas);
  kepala.addEventListener("click", (e) => { if (digeser) { e.preventDefault(); digeser = false; } }); // seretan bukan ketukan: jangan membuka/menutup details

  let rs = null;
  pegangan.addEventListener("pointerdown", (e) => {
    const b = kotak(), r = el.getBoundingClientRect();
    rs = { id: e.pointerId, px: e.clientX, x: r.left - b.left, y: r.top - b.top, w: r.width, kanan: el.classList.contains("sisi-kanan") };
    pegangan.setPointerCapture(e.pointerId); el.classList.add("menggeser"); e.preventDefault();
  });
  pegangan.addEventListener("pointermove", (e) => {
    if (!rs || e.pointerId !== rs.id) return;
    const dx = e.clientX - rs.px, w = Math.min(maksLebar(kotak()), Math.max(MIN, rs.kanan ? rs.w - dx : rs.w + dx));
    pasang(rs.kanan ? rs.x + rs.w - w : rs.x, rs.y, w);
  });
  const selesai = (e) => { if (!rs || e.pointerId !== rs.id) return; rs = null; el.classList.remove("menggeser"); simpanSaatIni(); sebar(); };
  pegangan.addEventListener("pointerup", selesai); pegangan.addEventListener("pointercancel", selesai);
  // sudut bawah: ubah tinggi (dan lebar) sekaligus
  let ss = null;
  sudut.addEventListener("pointerdown", (e) => {
    const b = kotak(), r = el.getBoundingClientRect();
    ss = { id: e.pointerId, px: e.clientX, py: e.clientY, x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height, kanan: el.classList.contains("sisi-kanan") };
    sudut.setPointerCapture(e.pointerId); el.classList.add("menggeser"); e.preventDefault();
  });
  sudut.addEventListener("pointermove", (e) => {
    if (!ss || e.pointerId !== ss.id) return;
    const dx = e.clientX - ss.px, w = Math.min(maksLebar(kotak()), Math.max(MIN, ss.kanan ? ss.w - dx : ss.w + dx));
    pasang(ss.kanan ? ss.x + ss.w - w : ss.x, ss.y, w, ss.h + e.clientY - ss.py);
  });
  const selesaiS = (e) => { if (!ss || e.pointerId !== ss.id) return; ss = null; el.classList.remove("menggeser"); simpanSaatIni(); sebar(); };
  sudut.addEventListener("pointerup", selesaiS); sudut.addEventListener("pointercancel", selesaiS);

  kepala.addEventListener("keydown", (e) => {
    if (e.key === "Home") { e.preventDefault(); kembali(); return; }
    const d = { ArrowLeft: [-LANGKAH, 0], ArrowRight: [LANGKAH, 0], ArrowUp: [0, -LANGKAH], ArrowDown: [0, LANGKAH] }[e.key];
    if (!d) return;
    e.preventDefault();
    const b = kotak(), r = el.getBoundingClientRect();
    pasang(r.left - b.left + d[0], r.top - b.top + d[1], r.width); simpanSaatIni(); sebar();
  });

  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && Number.isFinite(v.x)) pasang(v.x, v.y, v.w, v.h); } catch (e) { /* abaikan */ }
  addEventListener("resize", () => { if (el.style.left) { const b = kotak(), r = el.getBoundingClientRect(); pasang(r.left - b.left, r.top - b.top, r.width); } });
  return { kembali, gerak };
}
