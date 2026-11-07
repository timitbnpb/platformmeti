/* Akun media sosial resmi METI (dari pemilik, 8 Nov 2026). Satu sumber untuk kaki situs, /langganan, Tentang, Siaran Pers, Event.
   Hanya tautan keluar; tidak ada pengambilan data dari akun-akun ini. Berkas JS (bukan JSON) agar tamu belum masuk bisa memuatnya (gerbang D19). */
const IK = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8.5c0-.3.2-.5.5-.5z"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  youtube: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
};
export const SOSMED = [
  { kunci: "instagram", nama: "Instagram METI", url: "https://www.instagram.com/metiires/" },
  { kunci: "facebook", nama: "Facebook METI", url: "https://www.facebook.com/metiires/" },
  { kunci: "linkedin", nama: "LinkedIn METI", url: "https://id.linkedin.com/company/masyarakat-energi-terbarukan-indonesia" },
  { kunci: "youtube", nama: "YouTube METI", url: "https://www.youtube.com/@metiires" },
];
export const SOSMED_ACARA = [
  { kunci: "youtube", nama: "YouTube Indo EBTKE ConEx", url: "https://www.youtube.com/@IndoEBTKEConEx" },
  { kunci: "web", nama: "Indo EBTKE ConEx", url: "https://indoebtke.com" },
];
export const svgSosmed = (kunci, u = 20) => `<svg viewBox="0 0 24 24" width="${u}" height="${u}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${IK[kunci]}</svg>`;
export const sosmedHtml = (daftar = SOSMED, u = 20) => daftar.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.nama}" title="${s.nama}">${svgSosmed(s.kunci, u)}</a>`).join("");
