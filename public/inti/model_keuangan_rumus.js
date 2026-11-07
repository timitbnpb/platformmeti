/* Rumus murni /model-keuangan (ES module, tanpa DOM; dimuat layar dan uji Node: tests/model_keuangan.test.mjs).
   Semua angka masukan adalah ASUMSI yang bisa diubah; keluaran Hipotesis, bukan studi kelayakan perbankan.
   Satuan: uang dalam Rp (nominal), energi kWh, daya kW, suku bunga dan persen sebagai pecahan (0,08 = 8 persen).
   Penyederhanaan yang disengaja (ceiling): seluruh capex keluar di tahun 0 (tanpa masa konstruksi dan bunga selama konstruksi),
   rugi pajak dibawa maju tanpa batas tahun, penyusutan garis lurus, tanpa modal kerja dan nilai sisa. */

export const JAM_TAHUN = 8760;

/** Nilai kini bersih dari arus [t0, t1, ...] pada tingkat diskonto r. */
export const npv = (r, arus) => arus.reduce((s, c, t) => s + c / (1 + r) ** t, 0);

/** IRR (bisection pada [-0,99; 10]); null bila arus tak berganti tanda atau tak ada akar. */
export function irr(arus) {
  if (!(arus.some((x) => x < 0) && arus.some((x) => x > 0))) return null;
  let a = -0.99, b = 10, fa = npv(a, arus), fb = npv(b, arus);
  if (fa * fb > 0) return null;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2, fm = npv(m, arus);
    if (Math.abs(fm) < 1e-9 || (b - a) / 2 < 1e-12) return m;
    if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

/** Cicilan anuitas tetap per tahun untuk pokok D, bunga r, tenor n tahun. */
export const anuitas = (D, r, n) => (D <= 0 || n <= 0 ? 0 : r === 0 ? D / n : (D * r) / (1 - (1 + r) ** -n));

/** Jadwal utang anuitas: baris per tahun 1..panjang { bunga, pokok, cicilan, saldo }. */
export function jadwalUtang(D, r, n, panjang) {
  const c = anuitas(D, r, n);
  let saldo = D;
  return Array.from({ length: panjang }, (_, i) => {
    if (i >= n || saldo <= 0) return { bunga: 0, pokok: 0, cicilan: 0, saldo: 0 };
    const bunga = saldo * r, pokok = c - bunga;
    saldo -= pokok;
    return { bunga, pokok, cicilan: c, saldo: Math.max(0, saldo) };
  });
}

/** Pajak per tahun dari laba kena pajak: libur pajak N tahun pertama (laba/rugi diabaikan), rugi dibawa maju tanpa batas. */
export function pajakTahunan(ebt, tarif, libur = 0) {
  let rugi = 0;
  return ebt.map((x, i) => {
    if (i < libur) return 0;
    if (x <= 0) { rugi += -x; return 0; }
    const pakai = Math.min(rugi, x);
    rugi -= pakai;
    return (x - pakai) * tarif;
  });
}

/** Tahun pengembalian (pecahan) dari arus t0..tn: pertama kali kumulatif >= 0, interpolasi linear; null bila tak pernah. */
export function balikModal(arus) {
  let kum = arus[0];
  for (let t = 1; t < arus.length; t++) {
    const baru = kum + arus[t];
    if (baru >= 0 && arus[t] > 0) return t - 1 + -kum / arus[t];
    kum = baru;
  }
  return null;
}

/**
 * hitungModel(p) -> { baris[0..umur], ringkas }
 * p: mw, capexUsdKw, opexUsdKwThn, kurs, fk, degr, umur, tarif (Rp/kWh tahun 1), tarifTahun2 (Rp/kWh mulai tahun tarifGanti, atau null),
 *    tarifGanti (tahun ke-), eskTarif, eskOpex, porsiBayar (0..1: bagian energi yang dibayar/dihemat), sewaRpKwp (Rp/kWp/tahun, biaya),
 *    recRpMwh, karbonRpT (Rp/tCO2e), emisiTMwh, utang (0..1 dari capex total), bunga, tenor, pajak, libur, susut (tahun),
 *    ppn, ppnPorsi (0..1), ppnDtp (bool), gantiTahun, gantiPersen (0..1 capex), diskonto.
 */
export function hitungModel(p) {
  const umur = Math.max(1, Math.round(p.umur));
  const kW = p.mw * 1000, capexDasar = kW * p.capexUsdKw * p.kurs;
  const ppnRp = p.ppnDtp ? 0 : capexDasar * (p.ppn || 0) * (p.ppnPorsi || 0);
  const capex = capexDasar + ppnRp, utang = capex * (p.utang || 0);
  const susut = Math.max(1, Math.round(p.susut || umur));
  const jadwal = jadwalUtang(utang, p.bunga || 0, Math.min(p.tenor || 0, umur), umur);
  const baris = [], ebitda = [], ebtU = [], ebtL = [];
  for (let y = 1; y <= umur; y++) {
    const energi = kW * JAM_TAHUN * p.fk * (1 - (p.degr || 0)) ** (y - 1);
    const tarifDasar = p.tarifTahun2 != null && y >= (p.tarifGanti || 11) ? p.tarifTahun2 : p.tarif;
    const tarif = tarifDasar * (1 + (p.eskTarif || 0)) ** (y - 1);
    const pendTarif = energi * (p.porsiBayar ?? 1) * tarif;
    const pendLain = (energi / 1000) * ((p.recRpMwh || 0) + (p.karbonRpT || 0) * (p.emisiTMwh || 0));
    const esk = (1 + (p.eskOpex || 0)) ** (y - 1);
    const opexTetap = (kW * p.opexUsdKwThn * p.kurs + (p.sewaRpKwp || 0) * kW) * esk;
    const ganti = p.gantiTahun && y === Math.round(p.gantiTahun) ? capexDasar * (p.gantiPersen || 0) : 0;
    const opex = opexTetap + ganti, e = pendTarif + pendLain - opex;
    const dep = y <= susut ? capex / susut : 0, j = jadwal[y - 1];
    ebitda.push(e); ebtU.push(e - dep); ebtL.push(e - dep - j.bunga);
    baris.push({ tahun: y, energi, tarif, pendapatan: pendTarif + pendLain, opex, ebitda: e, susut: dep, bunga: j.bunga, pokok: j.pokok, cicilan: j.cicilan, saldo: j.saldo });
  }
  const pjU = pajakTahunan(ebtU, p.pajak || 0, p.libur || 0), pjL = pajakTahunan(ebtL, p.pajak || 0, p.libur || 0);
  let kumP = -capex, kumE = -(capex - utang);
  baris.forEach((b, i) => {
    b.pajak = pjL[i]; b.cfads = b.ebitda - pjL[i]; b.dscr = b.cicilan > 0 ? b.cfads / b.cicilan : null;
    b.arusProyek = b.ebitda - pjU[i]; b.arusEkuitas = b.cfads - b.cicilan;
    kumP += b.arusProyek; kumE += b.arusEkuitas; b.kumProyek = kumP; b.kumEkuitas = kumE;
  });
  baris.unshift({ tahun: 0, energi: 0, tarif: 0, pendapatan: 0, opex: 0, ebitda: 0, susut: 0, bunga: 0, pokok: 0, cicilan: 0, saldo: utang, pajak: 0, cfads: 0, dscr: null, arusProyek: -capex, arusEkuitas: -(capex - utang), kumProyek: -capex, kumEkuitas: -(capex - utang), capex });
  const aP = baris.map((b) => b.arusProyek), aE = baris.map((b) => b.arusEkuitas);
  const ds = baris.map((b) => b.dscr).filter((x) => x != null);
  const d = p.diskonto, pvE = baris.slice(1).reduce((s, b) => s + b.energi / (1 + d) ** b.tahun, 0);
  const pvB = baris.slice(1).reduce((s, b) => s + b.opex / (1 + d) ** b.tahun, 0);
  return {
    baris,
    ringkas: {
      capexDasar, ppnRp, capex, utang, ekuitas: capex - utang,
      irrProyek: irr(aP), irrEkuitas: irr(aE), npvProyek: npv(d, aP), npvEkuitas: npv(d, aE),
      balikProyek: balikModal(aP), balikEkuitas: balikModal(aE),
      lcoe: pvE > 0 ? (capex + pvB) / pvE : null, // Rp/kWh, nominal, sebelum pajak dan pendanaan (kecuali pajakLcoe)
      dscrMin: ds.length ? Math.min(...ds) : null, dscrRata: ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null,
      energiTahun1: baris[1].energi,
    },
  };
}

/** Tornado: tiap peubah digeser -w dan +w (pecahan relatif); mengembalikan metrik pada dua sisi, terurut menurut lebar ayunan. */
export function tornado(p, peubah, w, metrik = (r) => r.irrEkuitas) {
  const dasar = metrik(hitungModel(p).ringkas);
  const baris = peubah.map((k) => {
    const nilai = (f) => metrik(hitungModel({ ...p, [k]: p[k] * (1 + f) }).ringkas);
    return { kunci: k, rendah: nilai(-w), tinggi: nilai(w) };
  }).map((b) => ({ ...b, ayun: Math.abs((b.tinggi ?? 0) - (b.rendah ?? 0)) }));
  return { dasar, baris: baris.sort((a, b) => b.ayun - a.ayun) };
}

/** Skenario: buruk menggeser capex dan opex naik w, tarif dan faktor kapasitas turun w; baik kebalikannya; tengah = masukan. */
export function skenario(p, w) {
  const geser = (s) => ({ ...p, capexUsdKw: p.capexUsdKw * (1 + s * w), opexUsdKwThn: p.opexUsdKwThn * (1 + s * w), tarif: p.tarif * (1 - s * w), fk: p.fk * (1 - s * w) });
  return { rendah: hitungModel(geser(1)).ringkas, tengah: hitungModel(p).ringkas, tinggi: hitungModel(geser(-1)).ringkas };
}
