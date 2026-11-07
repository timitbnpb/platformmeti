/* Rumus PLTS atap (fungsi murni, tanpa DOM; dipakai /peluang#plts-atap dan uji Node). Semua asumsi masukan berlabel Hipotesis (lihat plts_atap_hitung.json).
   Alur: tagihan / tarif = kWh per bulan; kWp = kebutuhan / (PVOUT x porsi pakai sendiri), dibatasi daya tersambung (Permen ESDM 2/2024: maks 100%);
   penghematan = energi pakai sendiri x tarif - O&M (energi ekspor tidak dihargai); balik modal = tahun kumulatif arus kas bersih menutup capex. */

/** Daya tersambung (VA) dari nama golongan; "di atas"/"ke atas"/tanpa angka = null (tidak ada batas yang bisa dipastikan). */
export function dayaVA(golongan) {
  const s = String(golongan || "").replace(/^[^/]*\//, "");
  if (/di atas|ke atas/i.test(s)) return null;
  const m = [...s.matchAll(/([\d.]+)\s*(kVA|VA)\b/gi)].at(-1);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/\./g, ""));
  return Number.isFinite(n) ? n * (/k/i.test(m[2]) ? 1000 : 1) : null;
}

/** Kelompok asumsi harga: rumah tangga memakai "rumah", selain itu "industri". */
export const kelompokAsumsi = (kelompok) => (kelompok === "rumah tangga" ? "rumah" : "industri");

const nilai = (a) => (a && typeof a === "object" ? a.nilai : a);

/**
 * hitungPltsAtap({ tarif, tagihan, pvout, asumsi, kelompok?, daya? })
 *  tarif   Rp/kWh (objek golongan juga boleh: { tarif_idr_per_kwh, golongan, kelompok, subsidi })
 *  tagihan Rp/bulan; pvout kWh/kWp/tahun; asumsi = bagian "asumsi" dari plts_atap_hitung.json.
 * Mengembalikan null bila masukan tidak valid.
 */
export function hitungPltsAtap({ tarif, tagihan, pvout, asumsi, kelompok, daya }) {
  const g = tarif && typeof tarif === "object" ? tarif : { tarif_idr_per_kwh: tarif };
  const harga = Number(g.tarif_idr_per_kwh);
  kelompok = kelompok || g.kelompok;
  daya = daya === undefined ? dayaVA(g.golongan) : daya;
  if (!(harga > 0) || !(tagihan > 0) || !(pvout > 0) || !asumsi) return null;
  const as = asumsi[kelompokAsumsi(kelompok)], um = asumsi.umum;
  const capexKwp = nilai(as.harga_per_kwp_idr), om = nilai(as.om_persen_per_tahun) / 100, porsi = nilai(as.pakai_sendiri_persen) / 100;
  const degr = nilai(um.degradasi_persen_per_tahun) / 100, naik = nilai(um.kenaikan_tarif_persen_per_tahun) / 100, umur = nilai(um.umur_tahun);
  const inv = { tahun: nilai(um.ganti_inverter_tahun), persen: nilai(um.ganti_inverter_persen_capex) / 100 };

  const kwhBulan = tagihan / harga, kwhTahun = kwhBulan * 12;
  const ideal = Math.ceil((kwhTahun / (pvout * porsi)) * 10) / 10;
  const batas = daya ? daya / 1000 : null;
  const kwp = batas !== null && ideal > batas ? batas : ideal;
  const produksi = kwp * pvout;
  const capex = kwp * capexKwp, omTahun = capex * om;

  let kum = -capex, balik = null;
  for (let y = 1; y <= umur; y++) {
    const pakai = Math.min(produksi * (1 - degr) ** (y - 1) * porsi, kwhTahun);
    const arus = pakai * harga * (1 + naik) ** (y - 1) - omTahun - (y === inv.tahun ? capex * inv.persen : 0);
    if (balik === null && kum + arus >= 0) balik = y - 1 + -kum / arus;
    kum += arus;
  }
  const pakai1 = Math.min(produksi * porsi, kwhTahun);
  const hemat = pakai1 * harga, bersih = hemat - omTahun;
  return {
    kwhBulan, kwhTahun, kwp, kwpIdeal: ideal, dibatasiDaya: batas !== null && ideal > batas, batasKwp: batas,
    produksiKwhTahun: produksi, pakaiSendiriKwhTahun: pakai1, penghematanTahun: hemat, penghematanBersihTahun: bersih,
    persenTagihan: Math.min(100, (pakai1 / kwhTahun) * 100), capex, omTahun, balikModalTahun: balik, labaBersihUmur: kum, subsidi: !!g.subsidi,
    luasM2: kwp * nilai(um.luas_per_kwp_m2),
  };
}
