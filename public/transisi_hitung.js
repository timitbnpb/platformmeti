/* Hitungan murni halaman /transisi (tanpa DOM, diuji di tests/transisi.test.mjs). Semua hasil di sini TURUNAN: tampil berpil EST. */

const JAM = 8760;
export const TEK_EBT = ["hidro_mw", "panas_bumi_mw", "surya_mw", "bayu_mw", "bioenergi_mw"];

/** Tambahan kapasitas EBT per tahun dari target.json kapasitas_ebt: [{tahun, total, bulanan, per:{kunci:mw}}]. Tahun 2020 membandingkan seri Statistik 2020 dengan 2024 (beda versi): bertanda beda_seri. */
export function tambahanTahunan(kap) {
  const u = [...kap].sort((a, b) => a.tahun - b.tahun);
  return u.slice(1).map((b, i) => {
    const a = u[i];
    const per = Object.fromEntries(TEK_EBT.map((k) => [k, Math.round(((b[k] ?? 0) - (a[k] ?? 0)) * 100) / 100]));
    const total = Math.round((b.total_ebt_mw - a.total_ebt_mw) * 100) / 100;
    return { tahun: b.tahun, total, bulanan: total / 12, per, beda_seri: a.sumber_id !== b.sumber_id };
  });
}

/** Rata-rata laju per tahun antara dua titik. */
export const lajuRata = (kap) => {
  const u = [...kap].sort((a, b) => a.tahun - b.tahun);
  return (u.at(-1).total_ebt_mw - u[0].total_ebt_mw) / (u.at(-1).tahun - u[0].tahun);
};

/** Dekomposisi perubahan bauran (poin persen) per tahun: efek_ebt + efek_permintaan = selisih bauran (identitas eksak).
 *  bauran = E/T. dBauran = (E1-E0)/T1 [EBT bertambah] + E0*(1/T1 - 1/T0) [permintaan total tumbuh]. */
export function dekomposisiBauran(real) {
  const u = [...real].sort((a, b) => a.tahun - b.tahun);
  return u.slice(1).map((b, i) => {
    const a = u[i];
    const efekEbt = ((b.twh - a.twh) / b.total_twh) * 100;
    const efekPermintaan = a.twh * (1 / b.total_twh - 1 / a.total_twh) * 100;
    return { tahun: b.tahun, bauran: (b.twh / b.total_twh) * 100, selisih: (b.twh / b.total_twh - a.twh / a.total_twh) * 100, efek_ebt: efekEbt, efek_permintaan: efekPermintaan };
  });
}

export const cagr = (a, b, n) => (a > 0 && n > 0 ? (Math.pow(b / a, 1 / n) - 1) * 100 : null);

/** Intensitas emisi jaringan turunan dari tabel neraca daya RUPTL: emisi (juta ton CO2) / produksi (GWh) -> tCO2 per MWh. */
export const intensitasEmisi = (s, i) => (s.emisi_juta_ton?.[i] != null && s.produksi_gwh?.[i] ? (s.emisi_juta_ton[i] * 1000) / s.produksi_gwh[i] : null);

/** Faktor kapasitas nasional (persen) dari pembangkitan TWh dan kapasitas GW. */
export const faktorKapasitas = (twh, gw) => (twh != null && gw ? (twh / (gw * JAM / 1000)) * 100 : null);
/** Faktor kapasitas provinsi (persen) dari produksi GWh dan kapasitas MW. */
export const faktorKapasitasProv = (gwh, mw) => (gwh != null && mw > 0 ? (gwh / (mw * JAM / 1000)) * 100 : null);

/** Deret faktor kapasitas per sumber dari baris Ember: {sumber: [{tahun, nilai}]}; hanya tahun dengan kapasitas dan pembangkitan. */
export function deretFaktorKapasitas(baris, sumber) {
  return baris.filter((b) => b.sumber_listrik === sumber && b.kapasitas_gw && b.generasi_twh != null)
    .map((b) => ({ tahun: b.tahun, nilai: faktorKapasitas(b.generasi_twh, b.kapasitas_gw) })).sort((a, b) => a.tahun - b.tahun);
}

/** Rencana PLTS+PLTB (MW, status apa pun) dan penyimpanan per regional RUPTL, dibanding beban puncak neto 2034 sistem yang dilayani. */
export const REGIONAL_SISTEM = { sum: ["sumatera"], jmb: ["jawa-bali"], kal: ["kalbar", "kalseltengtimra"], smpnt: ["sulbagut", "sulbagsel", "ambon", "halmahera", "jayapura", "merauke", "nabire", "wamena", "manokwari", "sorong", "lombok", "timor"] };
export function serapVre(ruptlBaris, sistem) {
  return Object.entries(REGIONAL_SISTEM).map(([r, ids]) => {
    const ba = ruptlBaris.filter((b) => b.regional === r);
    const jum = (f) => Math.round(ba.filter(f).reduce((s, b) => s + (b.kapasitas_mw || 0), 0));
    const vre = jum((b) => b.teknologi === "surya" || b.teknologi === "bayu");
    const bess = jum((b) => b.teknologi === "penyimpanan");
    const puncak = sistem.filter((s) => ids.includes(s.id)).reduce((j, s) => j + (s.beban_puncak_neto_mw?.at(-1) ?? 0), 0);
    return { regional: r, vre_mw: vre, bess_mw: bess, puncak_2034_mw: puncak, rasio_persen: puncak ? (vre / puncak) * 100 : null };
  });
}

/** Kelas kuantil 0..n-1 untuk pewarnaan peta (nilai null = -1). */
export function kelasKuantil(nilai, n = 5) {
  const ada = nilai.filter((v) => v != null).sort((a, b) => a - b);
  if (!ada.length) return nilai.map(() => -1);
  return nilai.map((v) => (v == null ? -1 : Math.min(n - 1, Math.floor((ada.findIndex((x) => x >= v) / ada.length) * n))));
}
