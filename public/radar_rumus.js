/* Rumus murni radar kabupaten dan dedieselisasi (tanpa DOM): dipakai pipa (scripts/pipa/*.mjs), halaman /radar, dan uji.
   Semua bobot dan asumsi di sini adalah HIPOTESIS terbuka, bukan prakiraan pasar. */
export const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi"];
export const BOBOT_SEMUA = { pvout: 0.2, celah: 0.2, bpp: 0.2, harga: 0.1, akses: 0.1, pasar: 0.1, amdal: 0.05, perda: 0.05 };
export const BOBOT_TEK = { sumber: 0.4, bpp: 0.2, harga: 0.1, akses: 0.1, pasar: 0.1, amdal: 0.05, perda: 0.05 };
export const MIN_KOMPONEN = 3;
export const MIN_SEMUA = 5; /* semua teknologi: delapan komponen, minimal lima agar skor tak melambung dari data yang tinggal separuh */
export const MIN_TEK = 4;

/** Normalisasi min-maks 0..1 dari daftar angka (null dilewati). Semua sama: 0.5. */
export function minmaks(nilai) {
  const v = nilai.filter((x) => Number.isFinite(x)), lo = Math.min(...v), hi = Math.max(...v);
  return nilai.map((x) => (!Number.isFinite(x) ? null : hi === lo ? 0.5 : (x - lo) / (hi - lo)));
}

/** pn = norma provinsi {pvout, bpp, harga, akses, celah:{semua, surya, ...}}; kn = norma kabupaten {pasar, amdal, perda} atau null. Hasil: {id: 0..1 | null}. */
export function komponen(tek, pn, kn) {
  const k = kn || {};
  const dasar = { bpp: pn.bpp ?? null, harga: pn.harga ?? null, akses: pn.akses ?? null, pasar: k.pasar ?? null, amdal: k.amdal ?? null, perda: k.perda ?? null };
  if (tek === "semua") return { pvout: pn.pvout ?? null, celah: pn.celah?.semua ?? null, ...dasar };
  const c = pn.celah?.[tek] ?? null;
  const sumber = tek === "surya" ? ([pn.pvout ?? null, c].filter((x) => x !== null).reduce((a, b, _, r) => a + b / r.length, 0) || (pn.pvout == null && c == null ? null : 0)) : c;
  return { sumber, ...dasar };
}

/** Skor 0..100: komponen tanpa data dikeluarkan dan bobot dihitung ulang (pola indeks kesiapan). Kurang dari min komponen: null. */
export function skor(komp, bobot, min = MIN_KOMPONEN) {
  const ada = Object.keys(bobot).filter((id) => Number.isFinite(komp[id]));
  if (ada.length < min) return { skor: null, bobot: {} };
  const total = ada.reduce((s, id) => s + bobot[id], 0), eff = {};
  let nilai = 0;
  for (const id of ada) { eff[id] = bobot[id] / total; nilai += komp[id] * eff[id]; }
  return { skor: Math.round(nilai * 1000) / 10, bobot: eff };
}
export const skorTek = (tek, pn, kn) => skor(komponen(tek, pn, kn), tek === "semua" ? BOBOT_SEMUA : BOBOT_TEK, tek === "semua" ? MIN_SEMUA : MIN_TEK);

/* ---------- dedieselisasi (HIPOTESIS terbuka) ---------- */
export const ASUMSI = {
  sfc_l_kwh: 0.28, // konsumsi spesifik PLTD, kisaran 0,25 sampai 0,32 liter per kWh
  kurs: 16000, // Rp per USD
  efisiensi_sistem: 0.8, // rugi baterai, inverter, dan kotoran modul pada hitungan MWp
  biaya_sen_usd_kwh: { rendah: 14, dasar: 18, tinggi: 24 }, // biaya PLTS + baterai di pulau terisolasi
  pangsa: [0.25, 0.5, 0.75],
};
/** pltdGwh: produksi PLTD tahunan (GWh); s: pangsa yang diganti 0..1; hargaL: Rp per liter; skenario: kunci biaya_sen_usd_kwh; pvout: kWh per kWp per tahun. */
export function hemat({ pltdGwh, s, hargaL, skenario = "dasar", pvout = null, asumsi = ASUMSI }) {
  const kwh = pltdGwh * 1e6 * s;
  const liter = kwh * asumsi.sfc_l_kwh;
  const bbm = liter * hargaL; // Rp
  const biaya = kwh * (asumsi.biaya_sen_usd_kwh[skenario] / 100) * asumsi.kurs; // Rp
  return { kwh, liter, bbm_miliar: bbm / 1e9, biaya_miliar: biaya / 1e9, bersih_miliar: (bbm - biaya) / 1e9, mwp: pvout ? kwh / (pvout * asumsi.efisiensi_sistem) / 1000 : null };
}

/** Tingkat skor tetap (HIPOTESIS): tinggi 55 ke atas, sedang 35 ke atas, selebihnya rendah. */
export const tingkatSkor = (x) => (x === null || x === undefined ? null : x >= 55 ? "t" : x >= 35 ? "s" : "r");
export const tingkatPrioritas = (x) => (x === null || x === undefined ? null : x >= 66 ? "t" : x >= 40 ? "s" : "r");
