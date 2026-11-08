/* /hidro: hitungan murni (tanpa DOM) untuk tab Biaya dan LCOE. Semua keluaran berlabel EST/Hipotesis di layar. */
/** Faktor pemulihan modal: w = WACC persen, n = umur tahun. */
export const crf = (w, n) => (w === 0 ? 1 / n : ((w / 100) * (1 + w / 100) ** n) / ((1 + w / 100) ** n - 1));
/** LCOE (US$/MWh) = (capex x CRF + opex tahunan) / energi tahunan. capex US$/kW, cf persen, opexPct persen capex per tahun. */
export const lcoe = ({ capex, cf, opexPct, wacc, umur }) => (capex * crf(wacc, umur) + (capex * opexPct) / 100) / (0.0876 * cf);
/** Kelas ukuran proyek menurut batas MW (METI): besar bila mw >= batas, mini bila lebih kecil, x bila MW tak diketahui. */
export const kelasMw = (mw, batas = 10) => (mw == null || !isFinite(mw) ? "x" : mw >= batas ? "besar" : "mini");
