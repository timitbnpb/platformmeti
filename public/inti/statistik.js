/* Statistik pemakaian tanpa data pribadi: path tanpa query dan kata cari. Hormati Do Not Track dan GPC. */
const tolak = () => navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true;
function kirim(jenis, kunci) {
  if (tolak() || !navigator.sendBeacon || !kunci) return;
  try { navigator.sendBeacon("/api/statistik", new Blob([JSON.stringify({ jenis, kunci })], { type: "text/plain" })); } catch (e) { /* diam */ }
}
let sudah = false;
export function catatHalaman() { if (sudah) return; sudah = true; if (!location.pathname.startsWith("/admin")) kirim("halaman", location.pathname.slice(0, 120)); }
export const catatCari = (q) => { const k = String(q || "").trim().toLowerCase().replace(/\s+/g, " "); if (k.length >= 3) kirim("cari", k.slice(0, 80)); };
