// Neraca pasokan komponen EBT Indonesia 2025-2034: kapasitas pabrik lokal vs kebutuhan pipeline RUPTL (+ program PLTS 100 GWp).
// Fungsi murni, diuji di tests/neraca_pasokan.test.mjs. Faktor tanpa sumber berlabel Hipotesis.
export const TAHUN = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];
export const SUMBER = {
  rantai: { judul: 'public/data/rantai_pasok.json (RUPTL 2025-2034 per tahun COD; pemasok DJEBTKE, TKDN Kemenperin)', url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf', tingkat_bukti: 'resmi' },
  seg_sel: { judul: 'TaiyangNews: SEG Solar menjalankan pabrik sel 2 GW di Batang (13 Mei 2025)', url: 'https://taiyangnews.info/markets/seg-solar-2-gw-indonesia-solar-cell-manufacturing-facility', tingkat_bukti: 'media' },
  seg_wafer: { judul: 'pv magazine: SEG Solar mulai membangun pabrik ingot-wafer 3 GW di Batang, produksi dijadwalkan Q3 2026 (16 Des 2025)', url: 'https://www.pv-magazine.com/2025/12/16/seg-solar-starts-building-3-gw-solar-ingot-wafer-factory-in-indonesia/', tingkat_bukti: 'media' },
  tmai: { judul: 'Kontan: DSSA siap ekspansi pabrik modul TMAI (1 GW, bisa 2 GW) dan program PLTS 100 GWp (31 Agu 2026)', url: 'https://industri.kontan.co.id/news/dssa-siap-ekspansi-kapasitas-pabrik-modul-surya-tmai-bidik-peluang-dari-plts-100-gwp', tingkat_bukti: 'media' },
  yingfa: { judul: 'pv magazine: Yingfa Ruineng membangun pabrik sel 7,5 GW di Indonesia (3 Nov 2026)', url: 'https://pv-magazine.com/2026/11/03/yingfa-ruineng-establishes-7-5-gw-pv-manufacturing-plant-in-indonesia', tingkat_bukti: 'media' },
  hli: { judul: 'ANTARA: pabrik baterai EV HLI tetap beroperasi (10 GWh/tahun)', url: 'https://www.antaranews.com/berita/4791589/hyundai-sebut-pabrik-baterai-ev-hli-tetap-beroperasi-meski-lg-mundur', tingkat_bukti: 'media' },
  catib: { judul: 'Mining.com: CATL dan IBC (CATIB) mulai operasi komersial bertahap 6,9 GWh di Karawang (21 Agu 2026)', url: 'https://www.mining.com/web/indonesia-forms-1-2-billion-battery-venture-with-chinas-catl/', tingkat_bukti: 'media' },
  plts100: { judul: 'Kontan: program PLTS 100 GWp diluncurkan 25 Agu 2026, tahap pertama 14 proyek sekitar 5,3 GWp; tenggat 2029', url: 'https://industri.kontan.co.id/news/dssa-siap-ekspansi-kapasitas-pabrik-modul-surya-tmai-bidik-peluang-dari-plts-100-gwp', tingkat_bukti: 'media' },
};
// Kurva program 100 GWp (MW per tahun). Jangkar bersumber: tahap pertama 5,3 GWp, tenggat 2029; bentuk kurva = Hipotesis.
export const PLTS100 = { 2027: 5300, 2028: 35000, 2029: 59700 };
// Faktor konversi: nilai per 1 MW kebutuhan teknologi sumber. tingkat 'Hipotesis' bila tak ada sumber.
export const KOMPONEN = [
  { id: 'wafer', nama: 'Wafer (ingot)', satuan: 'MWp', dari: ['surya'], plts100: true, faktor: 1, faktor_ket: '1 MWp modul = 1 MWp wafer (identitas rantai PV; rugi kerf diabaikan)', tingkat: 'Hipotesis', hs: '381800' },
  { id: 'sel_surya', nama: 'Sel surya', satuan: 'MWp', dari: ['surya'], plts100: true, faktor: 1, faktor_ket: '1 MWp modul = 1 MWp sel', tingkat: 'Hipotesis', hs: '854142' },
  { id: 'modul', nama: 'Modul surya', satuan: 'MWp', dari: ['surya'], plts100: true, faktor: 1, faktor_ket: '1 MWp PLTS = 1 MWp modul (RUPTL MW dibaca setara MWp; rasio DC/AC 1,2-1,3 akan menaikkan kebutuhan)', tingkat: 'Hipotesis', hs: '854143' },
  { id: 'inverter', nama: 'Inverter', satuan: 'MWac', dari: ['surya', 'baterai'], plts100: true, faktor: 1, faktor_ket: '1 MW kapasitas terpasang = 1 MWac inverter/PCS', tingkat: 'Hipotesis', hs: '850440' },
  { id: 'trafo', nama: 'Trafo daya (step-up)', satuan: 'MVA', dari: ['surya', 'bayu', 'hidro', 'panas_bumi', 'baterai'], plts100: true, faktor: 1.2, faktor_ket: '1,2 MVA per MW (margin trafo step-up)', tingkat: 'Hipotesis', hs: '850421' },
  { id: 'struktur', nama: 'Struktur penyangga (baja)', satuan: 'ton', dari: ['surya'], plts100: true, faktor: 40, faktor_ket: '40 ton baja per MWp (rentang umum 35-50 untuk tilt tetap)', tingkat: 'Hipotesis', hs: '730890' },
  { id: 'baterai_sel', nama: 'Sel baterai penyimpanan', satuan: 'MWh', dari: ['baterai'], plts100: false, faktor: 2, faktor_ket: 'durasi 2 jam per MW BESS (RUPTL hanya memuat MW)', tingkat: 'Hipotesis', hs: '850760' },
  { id: 'baterai_pack', nama: 'Pak/modul baterai penyimpanan', satuan: 'MWh', dari: ['baterai'], plts100: false, faktor: 2, faktor_ket: 'durasi 2 jam per MW BESS', tingkat: 'Hipotesis', hs: '850760' },
  { id: 'turbin_angin', nama: 'Turbin angin (nacelle + bilah)', satuan: 'MW', dari: ['bayu'], plts100: false, faktor: 1, faktor_ket: '1 MW PLTB = 1 MW turbin', tingkat: 'Hipotesis', hs: '850231' },
  { id: 'turbin_hidro', nama: 'Turbin hidro', satuan: 'MW', dari: ['hidro'], plts100: false, faktor: 1, faktor_ket: '1 MW PLTA = 1 MW turbin', tingkat: 'Hipotesis', hs: '841011' },
];
// Kapasitas terbaca per komponen: rincian [{nama, nilai, mulai (tahun), sumber_id, org_id, tingkat_bukti, catatan}]; nilai dalam satuan komponen per tahun.
// kapasitas tak terbaca = status 'tak-terbaca' (celah tidak dihitung), bukan nol.
export const kapasitasTetap = {
  wafer: { status: 'terbaca', rincian: [{ nama: 'SEG Solar (Batang) ingot-wafer 3 GW, rencana produksi Q3 2026', nilai: 3000, mulai: 2027, sumber_id: 'seg_wafer', org_id: 'in_4096448e08', tingkat_bukti: 'Hipotesis', catatan: 'jadwal diasumsikan terealisasi mulai 2027' }] },
  sel_surya: { status: 'terbaca', rincian: [
    { nama: 'SEG Solar (Batang) sel 2 GW', nilai: 2000, mulai: 2025, sumber_id: 'seg_sel', org_id: 'in_4096448e08', tingkat_bukti: 'media' },
    { nama: 'PT Trina Mas Agra Indonesia (Kendal) sel 1 GW', nilai: 1000, mulai: 2025, sumber_id: 'tmai', org_id: 'en_2684d348da', tingkat_bukti: 'media' },
    { nama: 'Yingfa Ruineng pabrik sel TOPCon 7,5 GW (diumumkan 3 Nov 2026)', nilai: 7500, mulai: 2028, sumber_id: 'yingfa', org_id: null, tingkat_bukti: 'Hipotesis', catatan: 'tahun mulai produksi penuh diasumsikan 2028' }] },
  modul: { status: 'dari-rantai' },
  baterai_sel: { status: 'terbaca', rincian: [
    { nama: 'PT HLI Green Power (Karawang) sel 10 GWh/tahun', nilai: 10000, mulai: 2025, sumber_id: 'hli', org_id: 'en_fc2382eb45', tingkat_bukti: 'media', catatan: 'sel EV; kecocokan kimia untuk BESS belum terbukti' },
    { nama: 'CATIB (CATL-IBC, Karawang) 6,9 GWh operasi bertahap', nilai: 6900, mulai: 2026, sumber_id: 'catib', org_id: 'en_eb7ac55bdd', tingkat_bukti: 'media', catatan: 'sel EV/LFP; porsi BESS tak diketahui' }] },
  turbin_angin: { status: 'nol-terbaca', rincian: [], catatan: 'rantai_pasok: bilah, nacelle, gearbox-generator tanpa pemasok dalam negeri terbaca; hanya menara (1 pemasok)' },
};
const bulat = (x) => Math.round(x * 10) / 10;
export function kebutuhanTahunan(rantai, plts100 = false) {
  const per = {};
  for (const t of rantai.teknologi) for (const p of t.kebutuhan?.per_tahun || []) (per[t.id] ||= {})[p.tahun] = p.mw;
  const hasil = {};
  for (const k of KOMPONEN) {
    hasil[k.id] = {};
    for (const th of TAHUN) {
      let mw = 0;
      for (const d of k.dari) mw += per[d]?.[th] || 0;
      if (plts100 && k.plts100) mw += (PLTS100[th] || 0) * (k.dari.includes('surya') ? 1 : 0);
      hasil[k.id][th] = bulat(mw * k.faktor);
    }
  }
  return hasil;
}
export function kapasitasModul(rantai) {
  const m = rantai.teknologi.find((t) => t.id === 'surya').komponen.find((k) => k.id === 'modul').pemasok;
  const jml = (f) => m.filter(f).reduce((s, p) => s + (p.mwp || 0), 0);
  return { nameplate: jml(() => true), domestik: jml((p) => p.pasar !== 'ekspor'), ekspor: jml((p) => p.pasar === 'ekspor'), rincian: m.filter((p) => p.mwp).map((p) => ({ nama: p.nama, org_id: p.org_id, nilai: p.mwp, pasar: p.pasar })) };
}
export function kapasitasTahun(id, th, rantai) {
  if (id === 'modul') return kapasitasModul(rantai).domestik;
  const c = kapasitasTetap[id];
  if (!c) return null;
  if (c.status === 'nol-terbaca') return 0;
  return c.rincian.filter((r) => r.mulai <= th).reduce((s, r) => s + r.nilai, 0);
}
export function celah(kebutuhan, kapasitas) {
  if (kapasitas === null) return { kebutuhan, kapasitas: null, celah: null, impor_tersirat_pct: null };
  const c = Math.max(0, kebutuhan - kapasitas);
  return { kebutuhan, kapasitas, celah: bulat(c), impor_tersirat_pct: kebutuhan > 0 ? Math.round((c / kebutuhan) * 1000) / 10 : 0 };
}
export function peluang(k, deret) {
  const h = deret.filter((d) => d.celah > 0).sort((a, b) => b.celah - a.celah)[0];
  if (!h) return null;
  return { label: 'Hipotesis', tahun_puncak: h.tahun, celah_puncak: h.celah, satuan: k.satuan, teks: `Celah puncak ${h.celah} ${k.satuan} pada ${h.tahun} (impor tersirat ${h.impor_tersirat_pct}%). Peluang pabrik ${k.nama.toLowerCase()} berskala sebagian celah; kelayakan harga, TKDN, dan offtake belum diuji.` };
}
export function bangun({ rantai, dagang, orgIds, tanggal }) {
  const keb = { ruptl: kebutuhanTahunan(rantai, false), ruptl_plts100: kebutuhanTahunan(rantai, true) };
  const modul = kapasitasModul(rantai);
  const baris = KOMPONEN.map((k) => {
    const skenario = {};
    for (const sk of Object.keys(keb)) skenario[sk] = TAHUN.map((th) => ({ tahun: th, ...celah(keb[sk][k.id][th], kapasitasTahun(k.id, th, rantai)) }));
    const kt = kapasitasTetap[k.id];
    const rincian = k.id === 'modul' ? modul.rincian.map((r) => ({ nama: r.nama, nilai: r.nilai, pasar: r.pasar, org_id: r.org_id && orgIds.has(r.org_id) ? r.org_id : null, sumber_id: 'rantai', tingkat_bukti: 'resmi' })) : (kt?.rincian || []).map((r) => ({ ...r, org_id: r.org_id && orgIds.has(r.org_id) ? r.org_id : null }));
    const imp = dagang?.tahunan?.filter((x) => x.hs === k.hs && x.alir === 'impor' && x.tahun === 2024)[0];
    return {
      id: k.id, nama: k.nama, satuan: k.satuan, hs: k.hs, teknologi: k.dari,
      faktor: { nilai: k.faktor, ket: k.faktor_ket, tingkat_bukti: k.tingkat },
      kapasitas: { status: k.id === 'modul' ? 'terbaca' : kt?.status || 'tak-terbaca', catatan: k.id === 'modul' ? `nameplate ${modul.nameplate} MWp, dipakai hanya yang melayani pasar lokal/keduanya: ${modul.domestik} MWp (ekspor ${modul.ekspor} MWp dikeluarkan)` : kt?.catatan || (kt ? null : 'kapasitas pabrik lokal tidak terbaca di sumber; celah tidak dihitung'), rincian },
      skenario,
      validasi_impor: imp ? { hs: k.hs, tahun: 2024, usd: imp.usd, sumber: 'UN Comtrade via public/data/dagang_komponen.json' } : null,
      peluang: peluang(k, skenario.ruptl_plts100),
    };
  });
  return {
    lapis: 'publik', dibangun_pada: tanggal, tahun: TAHUN,
    sumber: Object.entries(SUMBER).map(([id, s]) => ({ id, ...s })),
    skenario: { ruptl: 'Pipeline pembangkit EBT bernama RUPTL 2025-2034 (skenario RE Base, tahun COD)', ruptl_plts100: 'RUPTL + program PLTS 100 GWp (kurva Hipotesis, jangkar tahap pertama 5,3 GWp dan tenggat 2029); komponen non-PV tak terpengaruh', plts100_mwp_per_tahun: PLTS100 },
    baris,
    celah: [
      'Faktor konversi seluruhnya Hipotesis (tidak ada standar resmi); kabel tidak dikonversi karena faktor km/MW tidak bersumber.',
      'Kapasitas inverter, trafo, struktur, pak baterai, turbin hidro tidak terbaca di sumber publik: celah dan persen impor tersirat = null, bukan nol.',
      'Kapasitas diperlakukan tetap per tahun (tanpa utilisasi, ekspansi, atau penutupan); pabrik modul berorientasi ekspor dikeluarkan dari kapasitas domestik.',
      'Kebutuhan RUPTL hanya pembangkit bernama; PLTS atap, kuota, dan diesel-to-RE tidak termasuk. pabrik_dunia.json belum ada.',
    ],
  };
}
