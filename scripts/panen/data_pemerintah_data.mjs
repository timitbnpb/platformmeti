// Butir terkurasi (dibaca dari halaman terbit; bukan hasil panen otomatis) untuk public/data/pemerintah/*.json.
// Tiap butir: sumber_id terdaftar, tanggal baca, tingkat_bukti. Angka disalin dari halaman, tanpa ekstrapolasi.
const TGL = '2026-11-08';
export const IEA_SUMBER = [
  { id: 'iea-roadmap-id', judul: 'An Energy Sector Roadmap to Net Zero Emissions in Indonesia, Executive Summary', penerbit: 'International Energy Agency (IEA)', tahun: 2022, url: 'https://www.iea.org/reports/an-energy-sector-roadmap-to-net-zero-emissions-in-indonesia/executive-summary', lisensi: 'CC BY 4.0 (IEA, laporan terbuka)', tingkat_bukti: 'resmi', tanggal_baca: TGL },
  { id: 'iea-seaeo-2024', judul: 'Southeast Asia Energy Outlook 2024, Executive Summary', penerbit: 'International Energy Agency (IEA)', tahun: 2024, url: 'https://www.iea.org/reports/southeast-asia-energy-outlook-2024/executive-summary', lisensi: 'CC BY 4.0 (IEA, laporan terbuka)', tingkat_bukti: 'resmi', tanggal_baca: TGL },
];
// cakupan: 'indonesia' | 'asia_tenggara'. tahun: tahun acuan angka; null bila halaman hanya menulis "today"/"saat ini" (roadmap terbit 2022, basis 2021).
const B = (sumber_id, cakupan, topik, nilai, satuan, tahun, konteks) => ({ sumber_id, cakupan, topik, nilai, satuan, tahun, konteks });
export const IEA_ANGKA = [
  B('iea-roadmap-id', 'indonesia', 'emisi', 600, 'Mt CO2', 2021, 'Emisi CO2 sektor energi; Indonesia penghasil emisi terbesar ke-9 dunia.'),
  B('iea-roadmap-id', 'indonesia', 'emisi', 2, 't CO2 per kapita', null, 'Emisi energi per kapita, setengah rata-rata dunia.'),
  B('iea-roadmap-id', 'indonesia', 'listrik', 60, '% pembangkitan', null, 'Pangsa batu bara dalam pembangkitan listrik ("today", basis laporan 2022).'),
  B('iea-roadmap-id', 'indonesia', 'surya_bayu', 1, '% pembangkitan (batas atas, "kurang dari")', null, 'Pangsa surya PV dan bayu dalam pembangkitan.'),
  B('iea-roadmap-id', 'indonesia', 'surya_bayu', 0.4, 'GW', null, 'Kapasitas surya PV dan bayu ("today", basis laporan 2022).'),
  B('iea-roadmap-id', 'indonesia', 'surya_bayu', 25, 'GW (tambahan, minimum "lebih dari")', 2030, 'Tambahan kapasitas surya PV dan bayu sampai 2030 pada skenario APS.'),
  B('iea-roadmap-id', 'indonesia', 'investasi', 20, 'USD miliar/tahun', null, 'Rata-rata investasi sektor energi historis.'),
  B('iea-roadmap-id', 'indonesia', 'investasi', 8, 'USD miliar/tahun (selisih APS vs bisnis seperti biasa)', 2030, 'Investasi APS lebih tinggi sekitar USD 8 miliar per tahun.'),
  B('iea-roadmap-id', 'indonesia', 'investasi', 25, 'USD miliar', 2030, 'Investasi pembangkitan terbarukan dan jaringan.'),
  B('iea-roadmap-id', 'indonesia', 'investasi', 10, 'USD miliar/tahun', 2030, 'Investasi efisiensi energi, sekitar lima kali tingkat saat ini.'),
  B('iea-roadmap-id', 'indonesia', 'target', 2060, 'tahun target emisi nol bersih', 2060, 'Target emisi nol bersih 2060 atau lebih cepat.'),
  B('iea-roadmap-id', 'indonesia', 'listrik', 50, '% kapasitas puncak', 2030, 'Pangsa batu bara dalam kapasitas puncak sampai 2030 (keamanan pasokan).'),
  B('iea-roadmap-id', 'indonesia', 'impor_energi', 24, 'USD miliar', 2021, 'Impor minyak neto.'),
  B('iea-seaeo-2024', 'indonesia', 'ac', 15, '% rumah tangga (batas atas, "kurang dari")', null, 'Pangsa rumah tangga Indonesia dengan AC saat ini.'),
  B('iea-seaeo-2024', 'indonesia', 'ac', 50, '% rumah tangga', 2035, 'Pangsa rumah tangga Indonesia dengan AC pada 2035 (skenario STEPS).'),
  B('iea-seaeo-2024', 'asia_tenggara', 'listrik', 1300, 'TWh (lebih dari)', null, 'Permintaan listrik kawasan saat ini.'),
  B('iea-seaeo-2024', 'asia_tenggara', 'listrik', 2000, 'TWh (lebih dari)', 2035, 'Permintaan listrik kawasan 2035, STEPS; tumbuh 4%/tahun.'),
  B('iea-seaeo-2024', 'asia_tenggara', 'listrik', 50, '% pembangkitan', 2023, 'Pangsa batu bara dalam listrik kawasan; 80% emisi sektor listrik.'),
  B('iea-seaeo-2024', 'asia_tenggara', 'investasi', 2, '% belanja energi bersih global', 2023, 'Pangsa kawasan dalam belanja energi bersih global (vs 6% PDB global).'),
  B('iea-seaeo-2024', 'asia_tenggara', 'investasi', 190, 'USD miliar (lebih dari)', 2035, 'Investasi energi bersih per tahun pada jalur selaras iklim kawasan.'),
  B('iea-seaeo-2024', 'asia_tenggara', 'biaya_modal', 2, 'x (minimal) biaya modal negara maju', null, 'Biaya modal proyek energi bersih kawasan.'),
  B('iea-seaeo-2024', 'asia_tenggara', 'baterai', 16, 'GWh', null, 'Kapasitas manufaktur sel baterai kendaraan listrik kawasan; rencana tambah hampir 40 GWh sampai 2030.'),
  B('iea-seaeo-2024', 'asia_tenggara', 'subsidi', 105, 'USD miliar', 2022, 'Subsidi konsumsi bahan bakar fosil kawasan, rekor.'),
];
export const IEA_CELAH = [
  'Angka dibaca dari ringkasan eksekutif (halaman web), bukan dari tabel data lengkap IEA; angka bab per negara (Indonesia) di SEAEO 2024 belum terbaca karena halaman bab tidak tersedia.',
  'Roadmap Indonesia terbit 2022: "today" berarti basis 2021, sudah tertinggal (mis. kapasitas surya+bayu 0,4 GW); pakai tahun=null sebagai penanda tanpa tahun eksplisit.',
  'Sebagian butir bercakupan Asia Tenggara, bukan Indonesia; jangan dipakai sebagai angka nasional.',
];

export const INDUSTRI_SUMBER = [
  { id: 'kemenperin-bisnis-2026', judul: 'Kesiapan Industri Panel Surya RI Menangkap Peluang Proyek PLTS 100 GW (mengutip Sekjen Kemenperin)', penerbit: 'Bisnis.com', tahun: 2026, url: 'https://ekonomi.bisnis.com/read/20260514/257/1973607/kesiapan-industri-panel-surya-ri-menangkap-peluang-proyek-plts-100-gw', tingkat_bukti: 'media_mengutip_pejabat', tanggal_baca: TGL },
  { id: 'kemenperin-katadata-2025', judul: 'Kemenperin: RI Punya 33 Pabrik Panel Surya, tapi Masih dalam Tahap Perakitan', penerbit: 'Katadata', tahun: 2025, url: 'https://katadata.co.id/amp/ekonomi-hijau/energi-baru/67e2539a7055d/kemenperin-ri-punya-33-pabrik-panel-surya-tapi-masih-dalam-tahap-perakitan', tingkat_bukti: 'media_mengutip_pejabat', tanggal_baca: TGL },
  { id: 'tmai-kendal-metro', judul: 'Menperin Girang Industri Panel Surya Investasi Rp1,5 Triliun di Kendal', penerbit: 'Metro TV News', tahun: 2025, url: 'https://www.metrotvnews.com/read/N4EC4Y16-menperin-girang-industri-panel-surya-investasi-rp15-triliun-di-kendal', tingkat_bukti: 'media_mengutip_pejabat', tanggal_baca: TGL },
];
// Hanya yang tertulis di hasil pencarian/halaman; daftar pabrik per perusahaan (SIPP) belum terambil.
export const REKAP_PABRIK = [
  { id: 'modul-surya-2026-05', komponen: 'modul_surya', jumlah_pabrik: 34, kapasitas_mwp: 10944, periode: '2026-05', catatan: 'Sekjen Kemenperin: 34 pabrik modul surya, kapasitas terpasang 10.944 MWp; hanya sedikit yang terintegrasi hulu-hilir.', sumber_id: 'kemenperin-bisnis-2026', tingkat_bukti: 'media_mengutip_pejabat' },
  { id: 'modul-surya-2025-03', komponen: 'modul_surya', jumlah_pabrik: 33, kapasitas_mwp: 4300, periode: '2025-03', catatan: 'Kemenperin: 33 pabrik panel surya, kapasitas produksi 4,3 GW per tahun, masih tahap perakitan. Selisih dengan angka 2026 (10,9 GW) tidak dijelaskan sumber; cara hitung bisa berbeda.', sumber_id: 'kemenperin-katadata-2025', tingkat_bukti: 'media_mengutip_pejabat' },
];
export const PABRIK = [
  { id: 'tmai-kendal', nama: 'PT Trina Mas Agra Indonesia (TMAI)', komponen: 'sel_dan_modul_surya', lokasi: 'KEK Kendal, Kabupaten Kendal', provinsi_kode: '33', kapasitas: { nilai: 1, satuan: 'GWp/tahun' }, investasi_rp_triliun: 1.5, org_id: null, sumber_id: 'tmai-kendal-metro', tingkat_bukti: 'media_mengutip_pejabat', catatan: 'Disebut pabrik panel surya terbesar di Indonesia (sel + modul). org_id belum ditautkan.' },
];
export const PENGADAAN_CELAH = [
  'LPSE/INAPROC: portal SIRUP (sirup.inaproc.id) membalas HTML penghalang bot pada permintaan otomatis, dan LPSE tersebar per instansi dengan pencarian ber-CAPTCHA; tidak dipanen (aturan: tanpa CAPTCHA). Paket tender EBT (PLTS, PLTMH, PJU surya, baterai) belum terisi. Jalur sah: unduhan CSV RUP/SPSE dari portal open data instansi atau data.go.id, atau permintaan resmi ke LKPP.',
  'SIPP/IKDD Kemenperin (sipp.kemenperin.go.id, ikdd.kemenperin.go.id) tidak terjangkau (koneksi gagal) pada 2026-11-08; daftar pabrik per perusahaan (modul, kabel, trafo, baterai, inverter) belum terambil. Yang ada hanya rekap nasional dan satu pabrik dari pernyataan pejabat via media.',
  'Pabrik kabel, trafo, baterai, dan inverter belum tercakup sama sekali; jangan membaca ketiadaan baris sebagai ketiadaan pabrik.',
  'Gunakan investasi KBLI 26/27 di bkpm_listrik.json sebagai proksi minat investasi manufaktur peralatan listrik/elektronik.',
];
