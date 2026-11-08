import { rumahTek } from "/inti/rumah_tek.js";
import { t, ada } from "/i18n.js";
import { esc } from "/inti/umum.js";
/* Ikon teknologi EBT (garis, currentColor). Satu sumber untuk /proyek; jalur salinan dari beranda_bawah.js IKON. */
const S = (d) => `<svg class="jm-ikt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
export const IKON_TEK = {
  surya: S('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
  bayu: S('<path d="M12 12V22M12 12l-1-9 3 8zM12 12l8 4-8 1zM12 12l-8 4 7 1.5"/>'),
  hidro: S('<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 14c3-3 6 3 9 0s6 3 9 0M3 19c3-3 6 3 9 0s6 3 9 0"/>'),
  "panas-bumi": S('<path d="M3 21 10 8l4 7 3-4 4 10zM9 3c-1 1 1 2 0 3M14 3c-1 1 1 2 0 3"/>'),
  bioenergi: S('<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15zM5 19 14 10"/>'),
  "biomassa-sampah": S('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/>'),
  nuklir: S('<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/>'),
  penyimpanan: S('<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M7 10v4M11 10v4"/>'),
  hidrogen: S('<circle cx="7" cy="12" r="3.6"/><circle cx="17" cy="12" r="3.6"/><path d="M10.6 12h2.8M12 4v2.5M12 17.5V20"/>'),
  laut: S('<path d="M2 15c2.5-3 5 3 7.5 0s5 3 7.5 0 3-1 5-1M12 3v8M9 6l3-3 3 3M2 20c2.5-3 5 3 7.5 0s5 3 7.5 0 3-1 5-1"/>'),
  jaringan: S('<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>'),
  kebijakan: S('<path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5"/>'),
  industri: S('<path d="M3 21V10l6 3V10l6 3V6h3l3 1v14zM7 17h2M12 17h2"/>'),
  pembiayaan: S('<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5"/>'),
  "transisi-adil": S('<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8"/>'),
  karbon: S('<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5a4.8 4.8 0 0 1 0 9.5z"/>'),
  elektrifikasi: S('<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>'),
  efisiensi: S('<path d="M4 19V9M10 19V5M16 19v-7M22 19H2M17 5l3 3 2-4"/>'),
};
export const ikonTek = (k) => IKON_TEK[k] || IKON_TEK.jaringan;

/* Pil teknologi: ikon 14px + label, warna dari token teknologi (kelas .jm-tek-* di jm.css) */
const TEK_ADA = new Set(["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "penyimpanan"]);
/* topik berita selain teknologi (kebijakan, industri, ...) ikut dipakai pilTek dengan warna sendiri */
const TOPIK_ADA = new Set(["kebijakan", "industri", "pembiayaan", "transisi-adil", "karbon", "elektrifikasi", "efisiensi", "jaringan"]);
const kecil = (svg) => svg.replace('class="jm-ikt"', 'class="jm-ikt jm-ikt-s"');
export const pilTek = (kode) => {
  if (!kode) return "-";
  const lab = ada("pj.tek.s." + kode) ? t("pj.tek.s." + kode) : ada("pj.tek." + kode) ? t("pj.tek." + kode) : ada("brt.tek." + kode) ? t("brt.tek." + kode) : kode.charAt(0).toUpperCase() + kode.slice(1);
  return `<span class="jm-pil-tek jm-tek-${TEK_ADA.has(kode) || TOPIK_ADA.has(kode) ? kode : "lain"}">${kecil(ikonTek(kode))}<span>${esc(lab)}</span></span>`;
};

/* Pil teknologi sebagai tautan ke /teknologi/<kode> (hanya di sel/baris yang tidak berada di dalam <a> lain) */
export const pilTekTaut = (kode) => (kode && TEK_ADA.has(kode) ? `<a class="jm-pil-taut" href="${esc(rumahTek(kode))}">${pilTek(kode)}</a>` : pilTek(kode));

/* Pil status proyek dengan ikon (rencana, konstruksi, beroperasi, dibatalkan, tidak-diketahui) */
const IK_ST = {
  rencana: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  izin: '<path d="M6 3h9l4 4v14H6zM15 3v4h4M9 13l2 2 4-4"/>',
  pendanaan: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5"/>',
  konstruksi: '<path d="M4 21h16M7 21V9M7 9l11-5M18 4v6M18 10v2"/><path d="M7 14h4"/>',
  beroperasi: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  dibatalkan: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  "tidak-diketahui": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
};
export const ikonStatus = (kode) => S(IK_ST[IK_ST[kode] ? kode : "tidak-diketahui"]);
export const pilStatus = (kode) => {
  const k = IK_ST[kode] ? kode : "tidak-diketahui", lab = ada("pj.st." + kode) ? t("pj.st." + kode) : kode || "-";
  return `<span class="jm-pil-st jm-st-${k}">${kecil(S(IK_ST[k]))}<span>${esc(lab)}</span></span>`;
};
