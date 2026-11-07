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
  hidrogen: S('<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11zM9.5 14.5h5"/>'),
  laut: S('<path d="M2 15c2.5-3 5 3 7.5 0s5 3 7.5 0 3-1 5-1M12 3v8M9 6l3-3 3 3M2 20c2.5-3 5 3 7.5 0s5 3 7.5 0 3-1 5-1"/>'),
  jaringan: S('<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>'),
  efisiensi: S('<path d="M4 19V9M10 19V5M16 19v-7M22 19H2M17 5l3 3 2-4"/>'),
};
export const ikonTek = (k) => IKON_TEK[k] || IKON_TEK.jaringan;
