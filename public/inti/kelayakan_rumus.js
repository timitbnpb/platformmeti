/* Rumus murni kalkulator kelayakan lokasi EBT (ES module, tanpa DOM; dimuat layar dan uji Node).
   Semua angka bawaan adalah ASUMSI yang bisa diubah pengguna; hasilnya Hipotesis, bukan studi kelayakan. */

export const HARI_BULAN = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const JAM_TAHUN = 8760;
/* Perpres 112/2022 Lampiran I, tahun ke-1 s.d. 10: koefisien dasar sen USD/kWh (dikali faktor lokasi F, di sini F = 1).
   Cadangan bila public/data/peluang.json belum memuatnya; tingkat = [batas atas MW (inklusif), koefisien]. */
export const HARGA_PATOKAN = {
  surya: [[1, 11.47], [3, 9.94], [5, 8.77], [10, 8.26], [20, 7.94], [Infinity, 6.95]],
  bayu: [[5, 11.22], [20, 10.26], [Infinity, 9.54]],
  mikrohidro: [[1, 11.23], [3, 10.92], [5, 9.65], [20, 9.09], [50, 8.86], [100, 7.81], [Infinity, 6.74]],
};
/* Asumsi bawaan. Sumber rentang: IRENA, Renewable Power Generation Costs in 2023 (biaya pasang dan O&M);
   ESDM/DEA, Technology Data for the Indonesian Power Sector (Katalog Teknologi, 2023); WACC dan kurs: asumsi METI. */
export const ASUMSI = {
  plts: { mw: 10, capex: 900, opex: 15, umur: 25, wacc: 0.08, pr: 0.8, fc: null, patokan: "surya" },
  terapung: { mw: 10, capex: 1300, opex: 20, umur: 25, wacc: 0.08, pr: 0.8, fc: null, patokan: "surya" },
  pltb: { mw: 20, capex: 1600, opex: 40, umur: 25, wacc: 0.08, rugi: 0.12, hub: 100, fc: null, patokan: "bayu" },
  mikrohidro: { mw: 0.5, capex: 2500, opex: 60, umur: 30, wacc: 0.08, fc: 0.55, patokan: "mikrohidro", debit: 0.5, head: 20 },
};
export const KURS_RP = 16000; // Rp per USD, asumsi
export const KURVA = { vIn: 3, vNominal: 12, vOut: 25 }; // kurva daya generik turbin darat
export const ALFA_GESER = 0.14; // eksponen geser angin (hukum pangkat) untuk tinggi hub dari 50 m

export const hariBulan = (i) => HARI_BULAN[i];
export const bulat = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** Produksi PLTS MWh/tahun per MW terpasang: PSH (kWh/m2/hari) x 365 x PR x MW. */
export const produksiPlts = (psh, pr = 0.8, mw = 1) => psh * 365 * pr * mw;
/** 12 nilai MWh per bulan dari PSH bulanan (JAN..DES). */
export const bulananPlts = (pshBulan, pr = 0.8, mw = 1) => pshBulan.map((p, i) => p * HARI_BULAN[i] * pr * mw);

/** Fungsi gamma (Lanczos) untuk skala Weibull. */
export function gamma(z) {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  const g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let x = 0.99999999999980993;
  g.forEach((c, i) => { x += c / (z + i + 1); });
  const t = z + 7.5;
  return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
}

/** Daya relatif (0..1) kurva generik: nol di bawah vIn dan di atas vOut, kubik sampai vNominal, lalu datar. */
export function dayaRelatif(v, { vIn, vNominal, vOut } = KURVA) {
  if (v < vIn || v >= vOut) return 0;
  if (v >= vNominal) return 1;
  return (v ** 3 - vIn ** 3) / (vNominal ** 3 - vIn ** 3);
}

/** Skala kecepatan angin dari 50 m ke tinggi hub (hukum pangkat). */
export const anginHub = (v50, hub = 100) => v50 * (hub / 50) ** ALFA_GESER;

/** Faktor kapasitas PLTB: integral kurva daya x Weibull(k, c) dengan rerata vRata; rugi = kehilangan wake/ketersediaan. */
export function fkBayu(vRata, { k = 2, rugi = 0.12, kurva = KURVA } = {}) {
  if (!(vRata > 0)) return 0;
  const c = vRata / gamma(1 + 1 / k), dv = 0.05;
  let s = 0;
  for (let v = dv / 2; v < 40; v += dv) s += dayaRelatif(v, kurva) * (k / c) * (v / c) ** (k - 1) * Math.exp(-((v / c) ** k)) * dv;
  return s * (1 - rugi);
}

/** Produksi PLTB MWh/tahun per MW dan per bulan dari WS50M bulanan. */
export function produksiBayu(ws50Bulan, { hub = 100, rugi = 0.12, mw = 1 } = {}) {
  const bulanan = ws50Bulan.map((v, i) => fkBayu(anginHub(v, hub), { rugi }) * HARI_BULAN[i] * 24 * mw);
  return { bulanan, tahunan: bulanan.reduce((a, b) => a + b, 0) };
}

export const fk = (mwhTahun, mw = 1) => mwhTahun / (JAM_TAHUN * mw);
/** Daya PLTMH kW = 9,81 x debit x head x efisiensi (efisiensi bawaan 0,7). */
export const dayaMikrohidro = (debit, head, eta = 0.7) => 9.81 * debit * head * eta;

/** Faktor pemulihan modal. */
export const crf = (wacc, umur) => (wacc === 0 ? 1 / umur : (wacc * (1 + wacc) ** umur) / ((1 + wacc) ** umur - 1));
/** LCOE sen USD/kWh dari capex USD/kW, opex USD/kW/tahun, dan energi kWh/kW/tahun (tanpa degradasi dan pajak). */
export function lcoe({ capex, opex, umur, wacc, kwhPerKw }) {
  if (!(kwhPerKw > 0)) return null;
  return ((capex * crf(wacc, umur) + opex) / kwhPerKw) * 100;
}
export const keRpKwh = (senUsd, kurs = KURS_RP) => (senUsd / 100) * kurs;

/** Koefisien patokan sen USD/kWh menurut kapasitas MW; tabel dari peluang.json bila terbaca, kalau tidak konstanta. */
export function patokan(jenis, mw, tabel = HARGA_PATOKAN[jenis]) {
  const baris = tabel?.find(([batas]) => mw <= batas);
  return baris ? baris[1] : null;
}

/** Ubah tingkat peluang.json ({kapasitas:"s.d. 1 MW" | ">1 MW s.d. 3 MW" | ">20 MW", koef_1_10}) jadi [[batas, koef]]; null bila bentuk tak dikenali. */
export function tabelDariData(tingkat) {
  if (!Array.isArray(tingkat) || !tingkat.length) return null;
  const out = tingkat.map((x) => {
    const m = /s\.d\.\s*([\d.,]+)\s*MW/i.exec(String(x?.kapasitas ?? ""));
    const koef = Number(x?.koef_1_10);
    return Number.isFinite(koef) ? [m ? Number(m[1].replace(",", ".")) : Infinity, koef] : null;
  });
  return out.every(Boolean) ? out.sort((a, b) => a[0] - b[0]) : null;
}

/** Jarak lingkaran besar km. */
export function jarakKm(la1, lo1, la2, lo2) {
  const r = Math.PI / 180, a = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

/** Titik di dalam MultiPolygon/Polygon GeoJSON (ray casting, cincin luar dan lubang). */
export function didalam(lon, lat, geom) {
  const polis = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const dalam = (c) => { let d = false; for (let i = 0, j = c.length - 1; i < c.length; j = i++) if (c[i][1] > lat !== c[j][1] > lat && lon < ((c[j][0] - c[i][0]) * (lat - c[i][1])) / (c[j][1] - c[i][1]) + c[i][0]) d = !d; return d; };
  return polis.some((p) => dalam(p[0]) && !p.slice(1).some(dalam));
}

export const DALAM_INDONESIA = (lat, lon) => lat >= -11.5 && lat <= 6.5 && lon >= 94 && lon <= 141.5;

/** BPP Rp/kWh dari baris provinsi peluang.json; bentuk belum pasti, jadi pembaca toleran. null bila tak ada. */
export function bppDari(baris) {
  const b = baris?.bpp ?? baris?.bpp_rp_kwh ?? baris?.biaya_pokok;
  if (typeof b === "number" && Number.isFinite(b) && b > 0) return b;
  if (b && typeof b === "object") {
    for (const k of ["nilai_rp_kwh", "rp_per_kwh", "rp_kwh", "nilai", "rupiah", "bpp"]) { const v = Number(b[k]); if (Number.isFinite(v) && v > 0) return v; }
  }
  return null;
}
