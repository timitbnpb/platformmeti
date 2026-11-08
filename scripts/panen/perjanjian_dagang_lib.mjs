// Bea masuk Indonesia per HS komponen EBT: MFN (BTKI 2022, PMK 26/2022 dan perubahannya) dan preferensi perjanjian dagang.
// Nilai disalin dari pembacaan halaman (agregator data bea Indonesia), bukan dihitung. Yang tak terbaca = null, bukan 0.
export const TREAYO = (hs6) => `https://treayo.com/en/compare/${hs6}`;
export const PERJANJIAN = [
  { id: 'mfn', nama: 'MFN (BTKI 2022, PMK 26/PMK.010/2022 dan perubahannya; PMK 50/2026 efektif 28 Jul 2026)', mitra: [], status: 'berlaku', url: 'https://jdih.kemenkeu.go.id/dok/pmk-50-tahun-2026/overview', tingkat_bukti: 'resmi', catatan: 'Halaman JDIH hanya memuat riwayat perubahan; lampiran tarif (PDF 5 MB) belum dibaca. Angka MFN per HS diambil dari agregator.' },
  { id: 'acfta', nama: 'ACFTA (ASEAN-Tiongkok)', mitra: ['cn'], status: 'berlaku', url: null, tingkat_bukti: 'belum-diperiksa', catatan: 'Dokumen resmi PMK tarif ACFTA belum ditemukan terbaca; 0% dengan Form E untuk 8541.43 hanya dari ringkasan pencarian.' },
  { id: 'akfta', nama: 'AKFTA (ASEAN-Korea)', mitra: ['kr'], status: 'berlaku', url: null, tingkat_bukti: 'belum-diperiksa', catatan: 'tarif per HS belum terbaca' },
  { id: 'ajcep', nama: 'AJCEP (ASEAN-Jepang)', mitra: ['jp'], status: 'berlaku', url: null, tingkat_bukti: 'belum-diperiksa', catatan: 'tarif per HS belum terbaca' },
  { id: 'ijepa', nama: 'IJEPA (Indonesia-Jepang)', mitra: ['jp'], status: 'berlaku', url: 'https://www.rctiplus.com/news/detail/idxchannel/5491804/suahasil-tetapkan-penyesuaian-tarif-bea-masuk-antara-indonesia-dan-jepang', tingkat_bukti: 'media', catatan: 'PMK penyesuaian tarif IJEPA 2026 diberitakan; angka per HS belum terbaca' },
  { id: 'rcep', nama: 'RCEP', mitra: ['cn', 'jp', 'kr', 'au', 'nz'], status: 'berlaku', url: null, tingkat_bukti: 'agregator', catatan: 'angka RCEP per HS terbaca dari agregator (dokumen asal RCEP)' },
  { id: 'iacepa', nama: 'IA-CEPA (Indonesia-Australia)', mitra: ['au'], status: 'berlaku', url: null, tingkat_bukti: 'belum-diperiksa', catatan: 'tarif per HS belum terbaca' },
  { id: 'ieucepa', nama: 'IEU-CEPA (Indonesia-Uni Eropa)', mitra: ['eu'], status: 'belum berlaku: diselesaikan 23 Sep 2025; ratifikasi ditargetkan semester II 2026, implementasi awal 2027', url: 'https://www.palmoilmagazine.com/hot-news/2026/06/08/indonesia-and-eu-fast-track-ieu-cepa-ratification-target-early-2027-implementation/', tingkat_bukti: 'media', catatan: 'tidak ada preferensi berlaku pada 2026-11-08' },
  { id: 'ikcepa', nama: 'IK-CEPA (Indonesia-Korea)', mitra: ['kr'], status: 'berlaku sejak 1 Jan 2023 (UU 25/2022)', url: 'https://setkab.go.id/en/indonesia-south-korea-officially-implement-ik-cepa/', tingkat_bukti: 'resmi', catatan: 'tarif per HS belum terbaca' },
];
// repr=false: baris 8 digit yang terbaca bukan baris EBT yang dimaksud (hanya satu baris HS6 yang diambil).
export const BARIS = [
  { hs6: '854142', hs8: '85414200', uraian: 'Sel fotovoltaik tidak dirakit menjadi modul', mfn: 0, pref: [{ perjanjian: 'rcep', pct: 0, mitra: ['cn'] }], repr: true },
  { hs6: '854143', hs8: '85414300', uraian: 'Sel fotovoltaik dirakit menjadi modul/panel', mfn: 5, pref: [{ perjanjian: 'rcep', pct: 0, mitra: ['cn'] }, { perjanjian: 'acfta', pct: 0, mitra: ['cn'], tingkat_bukti: 'belum-diperiksa', catatan: '0% dengan Form E, dari ringkasan pencarian (forwarder), halaman belum dibaca' }], repr: true },
  { hs6: '850440', hs8: '85044011', uraian: 'UPS (baris pertama 8504.40 yang terbaca; baris inverter statis 8504.40 lain belum terbaca)', mfn: 5, pref: [{ perjanjian: 'rcep', pct: 0, mitra: ['cn'] }], repr: false },
  { hs6: '850760', hs8: '85076031', uraian: 'Akumulator Li-ion untuk laptop (BUKAN baris penyimpanan stasioner/EV; baris BESS belum terbaca)', mfn: 10, pref: [{ perjanjian: 'rcep', pct: 5, mitra: ['cn'] }], repr: false },
  { hs6: '854442', hs8: '85444211', uraian: 'Kabel bawah laut telepon (baris pertama pos 8544.42; kabel daya belum terbaca)', mfn: 0, pref: [{ perjanjian: 'rcep', pct: 0, mitra: ['cn'] }], repr: false },
  { hs6: '850231', hs8: '85023110', uraian: 'Set pembangkit tenaga angin, keluaran sampai 10.000 kVA', mfn: 5, pref: [{ perjanjian: 'rcep', pct: 0, mitra: ['cn'] }], repr: true },
  { hs6: '841011', hs8: '84101100', uraian: 'Turbin hidro, daya sampai 1.000 kW', mfn: 10, pref: [{ perjanjian: 'rcep', pct: 2, mitra: ['cn'] }], repr: true },
  { hs6: '760110', hs8: '76011000', uraian: 'Aluminium tidak dipadu', mfn: 0, pref: [{ perjanjian: 'rcep', pct: 0, mitra: ['cn'] }], repr: true },
];
export const PEMBACAAN = { tanggal: '2026-11-08', tingkat_bukti: 'agregator', catatan: 'treayo.com/en/compare (data otoritas bea cukai dan pajak menurut situs; robots mengizinkan); PPN 12%, PPh 22 impor 2,5% (API) atau 7,5% dikenakan terpisah.' };
// Peta nama pasar benchmark_harga -> negara asal (iso2). Pasar tanpa asal jelas dikecualikan.
const ASAL = [[/tiongkok|china/i, 'cn'], [/india/i, 'in']];
export function asalDari(pasar) { if (/non-?\s?(tiongkok|china)/i.test(pasar)) return null; for (const [re, n] of ASAL) if (re.test(pasar)) return n; return null; }
// Tarif efektif asal n untuk baris b: preferensi terendah yang mencakup n (RCEP/ACFTA...), jika tidak MFN.
export function tarifEfektif(b, n) {
  const p = (b.pref || []).filter((x) => x.mitra.includes(n)).map((x) => x.pct);
  return p.length ? Math.min(...p) : b.mfn;
}
// Termurah setelah bea per produk benchmark. pemetaan: id produk benchmark -> hs8.
export const PEMETAAN = { 'modul-topcon': '85414300', 'modul-hjt': '85414300', 'sel-topcon': '85414200', 'sel-perc': '85414200', 'turbin-angin': '85023110' };
export function termurah(benchmark, baris = BARIS, pemetaan = PEMETAAN) {
  const hasil = [];
  for (const p of benchmark.produk) {
    const b = baris.find((x) => x.hs8 === pemetaan[p.id]);
    if (!b) continue;
    const opsi = [];
    for (const d of p.dunia) {
      const n = asalDari(d.pasar);
      if (!n || !(d.usd > 0)) continue;
      const t = tarifEfektif(b, n);
      opsi.push({ negara: n, pasar: d.pasar, usd: d.usd, bea_pct: t, usd_setelah_bea: Math.round(d.usd * (1 + t / 100) * 10000) / 10000, tanggal: d.tanggal, sumber_id: d.sumber_id, tingkat_bukti: d.tingkat_bukti });
    }
    if (!opsi.length) continue;
    opsi.sort((a, c) => a.usd_setelah_bea - c.usd_setelah_bea);
    hasil.push({ produk_id: p.id, satuan: p.satuan, hs8: b.hs8, termurah_negara: opsi[0].negara, opsi, catatan: 'Harga tanpa angkut/asuransi; negara non-RCEP dikenai MFN karena preferensi lain (mis. AIFTA) belum terbaca, sehingga bea di sini batas atas. Hipotesis perbandingan, bukan penawaran.' });
  }
  return hasil;
}
export function bangun({ benchmark, tanggal }) {
  const baris = BARIS.map((b) => ({ ...b, sumber_url: TREAYO(b.hs6), tanggal: PEMBACAAN.tanggal, tingkat_bukti: PEMBACAAN.tingkat_bukti, pref: b.pref.map((x) => ({ tingkat_bukti: 'agregator', ...x })) }));
  return {
    lapis: 'publik', dibangun_pada: tanggal, pembacaan: PEMBACAAN, perjanjian: PERJANJIAN, baris,
    termurah: termurah(benchmark, baris),
    celah: [
      'Hanya preferensi RCEP (dokumen asal RCEP, asal Tiongkok) terbaca per HS; ACFTA, AKFTA, AJCEP, IJEPA, IA-CEPA, IK-CEPA belum terbaca per HS karena jdih.kemenkeu.go.id, insw.go.id tak terjangkau pembaca otomatis dan lampiran PMK berupa PDF besar. Nilai kosong = belum terbaca, bukan 0.',
      'Baris 8504.40, 8507.60, dan 8544 yang terbaca bukan baris EBT yang dimaksud (repr=false); baris inverter statis, baterai BESS/EV, dan kabel daya belum terbaca.',
      'Tarif MFN dari agregator, belum dicocokkan dengan lampiran PMK 26/2022 s.d. PMK 50/2026; verifikasi ke BTKI resmi sebelum dipakai keputusan.',
      'BMAD/BMTP dan tarif tambahan lain tak termasuk; lihat kebijakan_dagang.json.',
    ],
  };
}
