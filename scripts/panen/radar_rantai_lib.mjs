// Radar peristiwa rantai pasok EBT 2024-2026. Ringkasan diparafrasekan dari halaman sumber; tanpa salinan isi, tanpa foto.
// Fungsi murni, diuji di tests/neraca_pasokan_radar.test.mjs.
export const JENIS = {
  'pabrik-baru': { nama: 'Pabrik baru / mulai produksi', ikon: 'factory' },
  ekspansi: { nama: 'Ekspansi kapasitas', ikon: 'trending-up' },
  penutupan: { nama: 'Penutupan pabrik', ikon: 'circle-x' },
  kebangkrutan: { nama: 'Kebangkrutan / kepailitan', ikon: 'triangle-alert' },
  akuisisi: { nama: 'Akuisisi / divestasi', ikon: 'handshake' },
  tarif: { nama: 'Perubahan tarif / bea', ikon: 'receipt' },
  kebijakan: { nama: 'Kebijakan / program', ikon: 'landmark' },
};
const E = (id, jenis, tanggal, negara, komponen, ringkas, sumber, url, media, orgs = [], extra = {}) => ({ id, jenis, tanggal, negara, komponen, ringkas, sumber, url, media, org_ids: orgs, org_nama: [], ...extra });
export const PERISTIWA = [
  E('rr_thornova_batam', 'pabrik-baru', '2024-11-19', 'id', ['modul'], 'Thornova Solar mulai memproduksi modul untuk pasar AS di Batam; kapasitas terpasang 2,5 GW, jalur PERC dan n-type, komisioning sejak September.', 'pv-tech.org', 'https://www.pv-tech.org/thornova-solar-begins-solar-module-production-in-indonesia', 'pv-tech', [], { org_nama: ['PT Thornova Solar Indonesia'] }),
  E('rr_seg_sel', 'pabrik-baru', '2025-05-13', 'id', ['sel_surya'], 'SEG Solar menjalankan pabrik sel pertamanya di Batang, Jawa Tengah, 2 GW per tahun, tahap awal menuju 5 GW dan rantai terintegrasi.', 'taiyangnews.info', 'https://taiyangnews.info/markets/seg-solar-2-gw-indonesia-solar-cell-manufacturing-facility', 'TaiyangNews', ['in_4096448e08']),
  E('rr_tmai_kendal', 'pabrik-baru', '2025-06-20', 'id', ['sel_surya', 'modul'], 'Pemerintah meresmikan pabrik panel surya terintegrasi PT Trina Mas Agra Indonesia di Kendal, investasi sekitar Rp1,5 triliun, kapasitas 1 GW per tahun.', 'thejakartapost.com', 'https://www.thejakartapost.com/business/2025/06/20/govt-launches-rp-1-5-trillion-solar-panel-factory-in-central-java', 'The Jakarta Post', ['en_2684d348da'], { catatan_tanggal: 'tanggal dari jalur URL; isi halaman tidak dibaca penuh' }),
  E('rr_seg_wafer', 'ekspansi', '2025-12-16', 'id', ['wafer'], 'SEG Solar mulai membangun pabrik ingot-wafer 3 GW di Batang dengan dana sendiri sekitar USD 80 juta; produksi dijadwalkan kuartal III 2026.', 'pv-magazine.com', 'https://www.pv-magazine.com/2025/12/16/seg-solar-starts-building-3-gw-solar-ingot-wafer-factory-in-indonesia/', 'pv magazine', ['in_4096448e08']),
  E('rr_catib', 'pabrik-baru', '2026-08-21', 'id', ['baterai_sel'], 'Patungan CATL dan IBC (CATIB) memulai operasi komersial bertahap pabrik sel 6,9 GWh di Karawang, direncanakan naik ke 15 GWh; peresmian menunggu jadwal Presiden.', 'mining.com', 'https://www.mining.com/web/indonesia-forms-1-2-billion-battery-venture-with-chinas-catl/', 'Mining.com', ['en_eb7ac55bdd', 'p_c9b8bffbec']),
  E('rr_dssa_tmai', 'ekspansi', '2026-08-31', 'id', ['modul', 'sel_surya'], 'DSSA menyatakan siap menambah kapasitas pabrik modul TMAI dari 1 GW ke 2 GW untuk menangkap program PLTS 100 GWp, yang tahap pertamanya mencakup 14 proyek sekitar 5,3 GWp.', 'kontan.co.id', 'https://industri.kontan.co.id/news/dssa-siap-ekspansi-kapasitas-pabrik-modul-surya-tmai-bidik-peluang-dari-plts-100-gwp', 'Kontan', ['en_2684d348da']),
  E('rr_plts100', 'kebijakan', '2026-08-25', 'id', ['modul', 'sel_surya', 'inverter'], 'Presiden meluncurkan program PLTS 100 GWp; tenggat target 2029 mengerek kebutuhan komponen jauh di atas kapasitas pabrik lokal.', 'kontan.co.id', 'https://industri.kontan.co.id/news/dssa-siap-ekspansi-kapasitas-pabrik-modul-surya-tmai-bidik-peluang-dari-plts-100-gwp', 'Kontan'),
  E('rr_yingfa', 'pabrik-baru', '2026-11-03', 'id', ['sel_surya'], 'Yingfa Ruineng mengumumkan pabrik sel TOPCon 7,5 GW di Indonesia; jadwal produksi penuh belum terbaca.', 'pv-magazine.com', 'https://pv-magazine.com/2026/11/03/yingfa-ruineng-establishes-7-5-gw-pv-manufacturing-plant-in-indonesia', 'pv magazine', [], { org_nama: ['Yingfa Ruineng'] }),
  E('rr_meyer_burger', 'kebangkrutan', '2025-06-02', 'de', ['sel_surya', 'modul'], 'Dua anak usaha Jerman Meyer Burger mengajukan kepailitan; pabrik sel Thalheim terancam dan perusahaan bisa tanpa kapasitas produksi sama sekali.', 'pv-tech.org', 'https://www.pv-tech.org/meyer-burger-files-insolvency-of-german-solar-cell-production-plant/', 'pv-tech', ['en_78058d49da']),
  E('rr_rec_silicon', 'penutupan', '2025-01-02', 'us', ['wafer'], 'REC Silicon menghentikan produksi polisilikon di Moses Lake setelah gagal lolos uji kualifikasi kemurnian pada Desember 2024; satu-satunya pembeli AS terdampak.', 'pv-tech.org', 'https://www.pv-tech.org/rec-silicon-abandons-us-polysilicon-production-at-moses-lake', 'pv-tech'),
  E('rr_sgre_brande', 'penutupan', '2026-03-21', 'dk', ['turbin_angin'], 'Siemens Gamesa menutup lini produksi rumah nacelle di Brande, Denmark; produksi berhenti.', 'doi.dk', 'https://www.doi.dk/en/vindkraft/artikel/siemens-gamesa-lukker-nacelle-produktionen-i-brande', 'DOI Havenergi', [], { org_nama: ['Siemens Gamesa'] }),
  E('rr_tpi', 'akuisisi', '2026-03-09', 'us', ['turbin_angin'], 'TPI Composites sepakat menjual unit bilah turbin AS dan Meksiko ke ECP Blade Holdings seharga USD 20 juta tunai, menunggu persetujuan pengadilan kepailitan.', 'news.bgov.com', 'https://news.bgov.com/bankruptcy-law/tpi-composites-sells-units-businesses-to-ecp-blade-for-20m', 'Bloomberg Law', [], { org_nama: ['TPI Composites'] }),
  E('rr_ad_cvd_id', 'tarif', '2026-09-16', 'us', ['sel_surya', 'modul'], 'Commerce AS menetapkan putusan akhir AD/CVD atas sel dan modul surya dari Indonesia, India, dan Laos (antidumping Indonesia 94,36%); ITC afirmatif 5 Nov 2026, perintah menyusul.', 'federalregister.gov', 'https://www.federalregister.gov/d/2026-18939', 'Federal Register', ['p_f9282cbf6b'], { ikat: 'kebijakan_dagang.us_ad_id_2026' }),
  E('rr_s232', 'tarif', '2026-08-06', 'us', ['wafer', 'sel_surya', 'modul'], 'Proklamasi Section 232 menetapkan tarif 15% atas polisilikon, ingot, wafer, sel, dan modul beserta harga impor minimum, berlaku 4 Des 2026.', 'federalregister.gov', 'https://www.federalregister.gov/d/2026-16400', 'Federal Register', [], { ikat: 'kebijakan_dagang.us_s232_polisilikon' }),
  E('rr_tkdn_34', 'kebijakan', '2024-07-25', 'id', ['modul'], 'Permenperin 34/2024 menetapkan tata cara penghitungan TKDN modul surya.', 'peraturan.bpk.go.id', 'https://peraturan.bpk.go.id/Details/296131', 'JDIH BPK', [], { ikat: 'kebijakan_dagang.id_tkdn_modul_34_2024' }),
  E('rr_us_aset', 'akuisisi', '2026-05-12', 'cn', ['modul'], 'Empat produsen modul terbesar menjual saham mayoritas atau penuh pabrik AS mereka; Jinko melepas 75,1% pabrik modul 2 GW seharga USD 191,5 juta, mengikuti aturan entitas asing yang dikhawatirkan di AS.', 'news.metal.com', 'https://news.metal.com/vn/newscontent/103897885-SMM-PV-Four-Major-PV-Module-Leaders-Completed-Disposal-of-US-Capacity-Assets', 'SMM', ['en_15a69db346'], { catatan_tanggal: 'tanggal dari ringkasan pencarian; halaman tidak dibaca penuh' }),
];
const ISO = /^[a-z]{2}$/, TGL = /^20(24|25|26)-\d\d-\d\d$/;
export function sahkan(e, orgIds = null) {
  if (!JENIS[e.jenis]) return 'jenis';
  if (!TGL.test(e.tanggal)) return 'tanggal';
  if (!ISO.test(e.negara)) return 'negara';
  if (!/^https:\/\//.test(e.url || '')) return 'url';
  if (!e.komponen?.length) return 'komponen';
  if (!e.ringkas || e.ringkas.length > 400) return 'ringkas';
  if (/antaranews\.com/.test(e.url)) return 'sumber_foto_antara';
  if (orgIds && e.org_ids.some((o) => !orgIds.has(o))) return 'org_id';
  return null;
}
export function bangun({ orgIds, tanggal, namaOrg = {} }) {
  const baris = [], ditolak = [];
  for (const e of PERISTIWA) {
    const m = sahkan(e, orgIds);
    if (m) { ditolak.push({ id: e.id, alasan: m }); continue; }
    baris.push({ ...e, ikon: JENIS[e.jenis].ikon, org_nama: [...e.org_ids.map((o) => namaOrg[o]).filter(Boolean), ...e.org_nama], tingkat_bukti: /federalregister|bpk\.go\.id/.test(e.url) ? 'resmi' : 'media', tanggal_periksa: tanggal });
  }
  baris.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const per_jenis = {};
  for (const b of baris) per_jenis[b.jenis] = (per_jenis[b.jenis] || 0) + 1;
  return {
    lapis: 'publik', dibangun_pada: tanggal, periode: '2024-2026', jenis: JENIS, jumlah: baris.length, per_jenis, baris, ditolak,
    celah: [
      'Cakupan bergantung pada pencarian web terbuka; bukan sensus semua peristiwa rantai pasok. Peristiwa pemasok lokal non-surya (trafo, kabel, inverter) belum ditemukan dengan tanggal terverifikasi.',
      'Beberapa tanggal diambil dari jalur URL atau ringkasan pencarian (ditandai catatan_tanggal); halaman Vestas Varde, Mabey Bridge, dan ANTARA tidak dibaca (403 atau tanpa tanggal) sehingga tidak dimasukkan.',
      'Ringkasan diparafrasekan; tidak ada foto. Tautan org_id hanya bila entitas ada di organisasi.json/pelaku_global.json.',
    ],
  };
}
