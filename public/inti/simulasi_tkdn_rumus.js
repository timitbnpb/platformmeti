/* Rumus murni /simulasi-tkdn (ES module, tanpa DOM; uji: tests/simulasi_tkdn.test.mjs).
   Dampak perubahan syarat TKDN modul dan inverter ke capex per kWp, pasokan, dan IRR. Semua masukan adalah ASUMSI di
   public/data/global/simulasi_tkdn.json; keluaran Hipotesis, bukan prakiraan harga.
   Penyederhanaan yang disengaja (ceiling): premi harga lokal naik linear terhadap TKDN yang disyaratkan (premi(T) = premiRef x T / Tref);
   semua pabrik bobot sama (belum ada kapasitas per pabrik terbuka); kebutuhan tahunan satu angka; harga impor sudah termasuk biaya masuk. */
import { hitungModel } from './model_keuangan_rumus.js';

/** Pangsa sertifikat (atau kapasitas, bila diberi bobot) dengan TKDN >= syarat. Daftar kosong -> null. */
export function pangsaLolos(sertifikat, syarat) {
  if (!sertifikat || !sertifikat.length) return null;
  let ok = 0, tot = 0;
  for (const s of sertifikat) {
    const w = typeof s === 'number' ? 1 : (s.bobot ?? 1), v = typeof s === 'number' ? s : s.tkdn;
    tot += w; if (v >= syarat) ok += w;
  }
  return tot > 0 ? ok / tot : null;
}

/** Premi harga lokal (pecahan) pada syarat TKDN T: linear lewat nol, dipatok di premiRef pada tkdnRef. */
export const premiPada = (premiRef, tkdnRef, T) => (premiRef * T) / tkdnRef;

/**
 * Pasokan: kapasitas lokal yang lolos syarat lawan kebutuhan.
 * -> { pangsa, kapasitasLolosGw, kebutuhanGw, rasio, kekuranganGw, cakupan }  (cakupan = min(1, rasio); null bila kapasitas tak diketahui)
 */
export function pasokan({ sertifikat, kapasitasGw, kebutuhanGw }, syarat) {
  const pangsa = pangsaLolos(sertifikat, syarat);
  if (pangsa == null || kapasitasGw == null) return { pangsa, kapasitasLolosGw: null, kebutuhanGw, rasio: null, kekuranganGw: null, cakupan: null };
  const kapasitasLolosGw = kapasitasGw * pangsa, rasio = kebutuhanGw > 0 ? kapasitasLolosGw / kebutuhanGw : Infinity;
  return { pangsa, kapasitasLolosGw, kebutuhanGw, rasio, kekuranganGw: Math.max(0, kebutuhanGw - kapasitasLolosGw), cakupan: Math.min(1, rasio) };
}

/** Rp per kWp dari USD per W: usdW x 1000 W/kW x kurs. */
export const rpKwpDariUsdW = (usdW, kurs) => usdW * 1000 * kurs;

/**
 * Capex per kWp (Rp) pada syarat (tkdnModul, tkdnInverter) -- 0 = tanpa syarat.
 * a: { capexDasarRpKwp (sudah memuat modul+inverter IMPOR), kurs, modul: {usdW, premiRef, tkdnRef, sertifikat, kapasitasGw, kebutuhanGw},
 *      inverter: {usdW, premiRef, tkdnRef, sertifikat, kapasitasGw, kebutuhanGw} }
 * -> { capexPatuh, capexCampur, deltaPatuh, deltaCampur, modul, inverter }
 *   patuh = seluruh volume wajib beli lokal berpremi (pasokan dianggap cukup);
 *   campur = hanya pangsa 'cakupan' dipenuhi lokal, sisanya impor (relaksasi/pengecualian). cakupan null -> dianggap 1.
 */
export function capexPada(a, tkdnModul, tkdnInverter) {
  const komp = (k, T) => {
    const impor = rpKwpDariUsdW(k.usdW, a.kurs);
    if (!T) return { impor, premi: 0, tambahPatuh: 0, tambahCampur: 0, pasokan: null };
    const premi = premiPada(k.premiRef, k.tkdnRef, T), p = pasokan(k, T), c = p.cakupan ?? 1;
    return { impor, premi, tambahPatuh: impor * premi, tambahCampur: impor * premi * c, pasokan: p };
  };
  const m = komp(a.modul, tkdnModul), i = komp(a.inverter, tkdnInverter);
  const capexPatuh = a.capexDasarRpKwp + m.tambahPatuh + i.tambahPatuh;
  const capexCampur = a.capexDasarRpKwp + m.tambahCampur + i.tambahCampur;
  return { capexPatuh, capexCampur, deltaPatuh: capexPatuh - a.capexDasarRpKwp, deltaCampur: capexCampur - a.capexDasarRpKwp, modul: m, inverter: i };
}

/** IRR proyek dan ekuitas untuk capex Rp/kWp tertentu, lewat hitungModel (model_keuangan_rumus.js). keu = masukan hitungModel tanpa capexUsdKw. */
export function irrPada(keu, capexRpKwp) {
  const r = hitungModel({ ...keu, capexUsdKw: capexRpKwp / keu.kurs }).ringkas;
  return { irrProyek: r.irrProyek, irrEkuitas: r.irrEkuitas, lcoe: r.lcoe };
}

/** Satu skenario lengkap: capex, pasokan, IRR, dan selisih terhadap dasar (tanpa syarat). */
export function simulasi(a, keu, tkdnModul, tkdnInverter) {
  const dasar = irrPada(keu, a.capexDasarRpKwp), c = capexPada(a, tkdnModul, tkdnInverter);
  const patuh = irrPada(keu, c.capexPatuh), campur = irrPada(keu, c.capexCampur);
  const sel = (x, y) => (x == null || y == null ? null : x - y);
  return {
    tkdnModul, tkdnInverter, capex: c,
    irr: { dasar, patuh, campur, deltaPatuh: sel(patuh.irrProyek, dasar.irrProyek), deltaCampur: sel(campur.irrProyek, dasar.irrProyek) },
  };
}

/** Peta skenario: semua pasangan (modul x inverter). */
export const peta = (a, keu, syaratModul, syaratInverter) =>
  syaratModul.flatMap((m) => syaratInverter.map((i) => simulasi(a, keu, m, i)));
