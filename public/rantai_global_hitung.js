/* /rantai-global: rumus murni (ES module, tanpa DOM; uji: tests/rantai_global_hitung.test.mjs).
   Biaya mendarat komponen impor, bea per HS, konsentrasi (HHI), banding produk, tarif Perpres PSEL.
   Semua keluaran turunan = EST/Hipotesis menurut masukan; tidak ada angka yang dikarang di sini.
   ponytail: angkut = tarif kontainer / muatan per kontainer (satu tarif komposit); upgrade bila tarif per rute terbaca. */

/** Kode HS enam digit dari teks HS apa pun ("8541.43.00" -> "854143", "8504.21-8504.23" -> "850421"); tak terbaca -> "". */
export const hs6 = (s) => { const m = String(s ?? "").match(/(\d{4})\.?(\d{2})/); return m ? m[1] + m[2] : ""; };

/** Bea masuk (persen) untuk HS dan negara asal. perjanjian = baris perjanjian_dagang.json; mfn = komponen_selisih bea_masuk.per_hs.
 *  Preferensi hanya dipakai bila asal ada di daftar mitra perjanjian (butuh SKA), barisnya representatif (repr !== false) dan sudah diperiksa
 *  (tingkat_bukti "belum-diperiksa" dilewati). -> { pct, jenis: "pref"|"mfn"|null, perjanjian } */
export function beaMasuk({ hs, asal, perjanjian = [], mfn = [] }) {
  const k = hs6(hs), a = String(asal || "").toLowerCase();
  const baris = perjanjian.find((b) => b.hs6 === k && b.repr !== false);
  const prefs = (baris?.pref || []).filter((p) => p.pct != null && p.tingkat_bukti !== "belum-diperiksa" && (p.mitra || []).map((m) => String(m).toLowerCase()).includes(a));
  if (prefs.length) { const p = prefs.reduce((m, x) => (x.pct < m.pct ? x : m)); return { pct: p.pct, jenis: "pref", perjanjian: p.perjanjian }; }
  const m = mfn.find((x) => hs6(x.hs) === k);
  if (m && m.bm_persen != null) return { pct: m.bm_persen, jenis: "mfn", perjanjian: null };
  if (baris && baris.mfn != null) return { pct: baris.mfn, jenis: "mfn", perjanjian: null };
  return { pct: null, jenis: null, perjanjian: null };
}

/** Biaya mendarat per satuan produk (USD dan Rp per Wp/W/kW/kWh sesuai satuan FOB).
 *  angkut = tarifKontainer / muatanKontainer; asuransi = asuransiPct% x (FOB + angkut); CIF = FOB + angkut + asuransi;
 *  BM = bmPct% x CIF; nilai impor = CIF + BM; PPN = ppnPct% x nilai impor; PPh 22 = pph22Pct% x nilai impor; lokal = logistik darat per satuan.
 *  total = CIF + BM + PPN + PPh22 + lokal; tanpaPajak = total tanpa PPN dan PPh 22 (keduanya umumnya dapat dikreditkan). */
export function biayaMendarat({ fob, tarifKontainer, muatanKontainer, asuransiPct = 0, bmPct = 0, ppnPct = 11, pph22Pct = 2.5, lokal = 0, kurs }) {
  if (![fob, tarifKontainer, muatanKontainer, kurs].every((v) => Number.isFinite(v)) || muatanKontainer <= 0 || fob < 0) return null;
  const angkut = tarifKontainer / muatanKontainer, asuransi = ((fob + angkut) * asuransiPct) / 100, cif = fob + angkut + asuransi;
  const bm = (cif * bmPct) / 100, nilaiImpor = cif + bm, ppn = (nilaiImpor * ppnPct) / 100, pph22 = (nilaiImpor * pph22Pct) / 100;
  const total = cif + bm + ppn + pph22 + lokal, pos = { fob, angkut, asuransi, bm, ppn, pph22, lokal };
  return { pos, cif, nilaiImpor, total, tanpaPajak: cif + bm + lokal, rp: Object.fromEntries(Object.entries({ ...pos, cif, total, tanpaPajak: cif + bm + lokal }).map(([k, v]) => [k, v * kurs])), kenaikanPct: fob > 0 ? ((total - fob) / fob) * 100 : null };
}

/** Pelabuhan masuk terdekat per kode provinsi BPS (Hipotesis: pembagian wilayah kasar, bukan rute kontrak). */
const MASUK = { belawan: ["11", "12", "13", "14"], batam: ["21"], priok: ["15", "16", "17", "18", "19", "31", "32", "36", "61", "62"], perak: ["33", "34", "35", "51", "52", "53"], makassar: ["63", "64", "65", "71", "72", "73", "74", "75", "76", "81", "82", "91", "92", "93", "94", "95", "96"] };
export const pelabuhanMasuk = (kodeProv) => Object.keys(MASUK).find((p) => MASUK[p].includes(String(kodeProv))) || null;

/** Pelabuhan asal acuan per negara (pertama yang ada di daftar pelabuhan), atau null. */
export const pelabuhanAsal = (iso, pelabuhan = []) => pelabuhan.find((p) => p.peran === "asal" && String(p.negara).toLowerCase() === String(iso).toLowerCase())?.id || null;

/** Herfindahl-Hirschman dari daftar nilai (apa pun satuannya): jumlah kuadrat pangsa persen, 0..10000. Daftar kosong/nol -> null. */
export function hhi(nilai) {
  const v = nilai.filter((x) => x > 0), tot = v.reduce((a, b) => a + b, 0);
  return tot > 0 ? v.reduce((a, b) => a + ((b / tot) * 100) ** 2, 0) : null;
}
/** Kelas konsentrasi (ambang HHI umum 1500 dan 2500). */
export const kelasHhi = (h) => (h == null ? null : h >= 2500 ? "tinggi" : h >= 1500 ? "sedang" : "rendah");

/** Pangsa mitra dagang (persen) dari [{kode, usd}], terurut turun; tahun total memakai jumlah mitra. */
export function pangsaMitra(mitra) {
  const tot = mitra.reduce((a, m) => a + (m.usd || 0), 0);
  return tot > 0 ? mitra.filter((m) => m.usd > 0).map((m) => ({ ...m, pct: (m.usd / tot) * 100 })).sort((a, b) => b.usd - a.usd) : [];
}

/** Banding produk berdampingan. skema = [{kolom, satuan, arah:"naik"|"turun"}]; terbaik = indeks produk dengan nilai terbaik (sama = semua), selisih = persen terhadap terbaik.
 *  Nilai null = belum terbaca, tidak ikut menentukan terbaik. Nilai tak-skalar (array) diabaikan dari penilaian. */
export function bandingProduk(daftar, skema) {
  return skema.map((s) => {
    const v = daftar.map((p) => { const x = p.spesifikasi?.[s.kolom]; return typeof x === "number" ? x : null; });
    const ada = v.filter((x) => x != null), best = ada.length ? (s.arah === "turun" ? Math.min(...ada) : Math.max(...ada)) : null;
    return { ...s, nilai: v, terbaik: v.map((x) => best != null && x === best && ada.length > 1 && new Set(ada).size > 1), selisih: v.map((x) => (x != null && best ? ((x - best) / Math.abs(best)) * 100 : null)) };
  });
}

/** Selisih persen a terhadap b; b tidak positif -> null. */
export const selisihPct = (a, b) => (Number.isFinite(a) && b > 0 ? ((a - b) / b) * 100 : null);

/** Tarif listrik PSEL Perpres 35/2018 Pasal 11 (USD sen/kWh): sampai 20 MW 13,35; di atasnya 14,54 - 0,076 x MW. Perpres 109/2025: 20 untuk semua kapasitas. */
export const tarifPerpres35 = (mw) => (mw > 0 ? (mw <= 20 ? 13.35 : 14.54 - 0.076 * mw) : null);
export const tarifPerpres109 = (mw) => (mw > 0 ? 20 : null);
