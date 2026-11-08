/* /lelang: hitungan murni (tanpa DOM) untuk harga vs patokan Perpres 112/2022. Patokan = koefisien tahun 1-10 x faktor lokasi F (peluang.json harga_patokan). */
import { patokan } from "./model_keuangan_data.js";

const KUNCI_PATOKAN = { surya: "surya", bayu: "bayu", hidro: "hidro", "panas-bumi": "panas_bumi" };
const WIL = [
  ["Jawa, Madura, Bali", ["31", "32", "33", "34", "35", "36", "51"]], ["Sumatera", ["11", "12", "13", "14", "15", "16", "17", "18"]], ["Kepulauan Riau", ["21"]], ["Bangka Belitung", ["19"]],
  ["Kalimantan", ["61", "62", "63", "64", "65"]], ["Sulawesi", ["71", "72", "73", "74", "75", "76"]], ["Nusa Tenggara", ["52", "53"]], ["Maluku Utara", ["82"]], ["Maluku", ["81"]],
  ["Papua Barat", ["92", "96"]], ["Papua", ["91", "93", "94", "95"]],
];
/** Faktor lokasi F untuk kode BPS provinsi, atau null bila tak dikenal. */
export function faktorF(peluang, kode) {
  const w = WIL.find(([, ks]) => ks.includes(String(kode)))?.[0];
  return peluang?.harga_patokan?.faktor_lokasi?.find((x) => x.wilayah === w)?.F ?? null;
}
/** Patokan tertinggi tahun 1-10 (sen US$/kWh) untuk teknologi, kapasitas MW, dan kode provinsi. { koef, F, sen, kapasitas } atau null. */
export function patokanSen(peluang, teknologi, mw, kode) {
  const kunci = KUNCI_PATOKAN[teknologi], F = faktorF(peluang, kode);
  if (!kunci || !(mw > 0) || F == null) return null;
  const p = patokan(peluang, { patokan: kunci }, mw);
  return p ? { koef: p.koef, F, sen: Math.round(p.koef * F * 1e4) / 1e4, kapasitas: p.kapasitas, tahun11: p.tahun11 } : null;
}
/** Selisih persen harga terhadap acuan (negatif = di bawah acuan); null bila acuan tak sah. */
export const selisihPersen = (harga, acuan) => (harga != null && acuan > 0 ? ((harga - acuan) / acuan) * 100 : null);
/** sen US$/kWh -> US$/MWh. */
export const usdPerMwh = (sen) => Math.round(sen * 1e3) / 100;
/** Tahun dari tanggal "2019", "2019-08", atau "2019-08-19". */
export const tahunDari = (tgl) => Number(String(tgl).slice(0, 4));
