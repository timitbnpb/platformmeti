// Kartu bertumpuk diberi jarak 24px oleh aturan global jm.css (.jm-ex + .jm-ex). Di dalam kisi/flex baris,
// jarak itu malah menggeser kartu kedua ke bawah sehingga tidak sejajar (pemilik 8 Nov 2026).
// Modul ini menandai induk berdisplay grid/flex-baris dengan .jm-sejajar agar margin itu dinolkan.
const KARTU = ".jm-ex,.jm-kartu,.jm-pk-b,.jm-kal-kartu,article,section.jm-bagian-kartu";
function tandai(akar = document) {
  for (const el of akar.querySelectorAll?.(KARTU) || []) {
    const p = el.parentElement;
    if (!p || p.classList.contains("jm-sejajar")) continue;
    const c = getComputedStyle(p);
    if (c.display.includes("grid") || (c.display.includes("flex") && !c.flexDirection.startsWith("column"))) p.classList.add("jm-sejajar");
  }
}
if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  let antre = 0;
  const jalan = () => { antre = 0; tandai(); };
  const mulai = () => { tandai(); new MutationObserver(() => { if (!antre) antre = requestAnimationFrame(jalan); }).observe(document.body, { childList: true, subtree: true }); };
  if (document.body) mulai(); else document.addEventListener("DOMContentLoaded", mulai);
}
