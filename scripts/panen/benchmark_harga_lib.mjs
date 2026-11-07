// Pembangun public/data/global/benchmark_harga.json (offline; angka ditranskripsi dari unduhan 2026-11-08).
// Memperluas harga_komponen.json (rujuk id deret, tidak menyalin) dan tkdn_produk.json (rujuk kategori). Sisi Indonesia sengaja kosong bila tak ada sumber terbuka terbaca.
export const TANGGAL = '2026-11-08';
export const SUMBER = [
  { id: 's-infolink-spot', judul: 'InfoLink Spot Price (pekan 29 Okt-4 Nov 2026, terbit 4 Nov 2026)', penerbit: 'InfoLink Consulting', url: 'https://www.infolink-group.com/spot-price/', lisensi: 'Halaman publik, hanya baris tak terkunci, dikutip dengan atribusi', tingkat_bukti: 'media' },
  { id: 's-kurs', judul: 'Kurs acuan ECB via Frankfurter API (USD ke IDR dan CNY)', penerbit: 'European Central Bank via frankfurter.dev', url: 'https://api.frankfurter.dev/v1/2026-11-04?base=USD&symbols=IDR,CNY', lisensi: 'Data publik ECB', tingkat_bukti: 'resmi' },
];
// Kurs per tanggal diambil (bukan jam): USD ke mata uang.
export const KURS = [
  { tanggal: '2026-11-04', idr: 18129, cny: 6.6723, sumber_id: 's-kurs' },
  { tanggal: '2025-01-02', idr: 16207, cny: 7.2995, sumber_id: 's-kurs' },
];
const D = (pasar, harga, mu, basis, tgl = '2026-11-04') => ({ pasar, harga, mata_uang: mu, usd: mu === 'USD' ? harga : Math.round((harga / KURS[0].cny) * 10000) / 10000, basis, sumber_id: 's-infolink-spot', tanggal: tgl, tingkat_bukti: mu === 'USD' ? 'Data' : 'EST' });
const ALASAN_ID = 'Tidak ada harga Indonesia terbuka terbaca: e-katalog LKPP tak terjangkau dari panen ini, iesr.or.id menjawab 403 (panen dihentikan), tkdn_produk.json hanya memuat TKDN tanpa harga.';
const P = (id, nama, satuan, dunia, ekstra = {}) => ({ id, nama, satuan, dunia, indonesia: [], alasan_indonesia_kosong: ALASAN_ID, selisih_persen: null, ...ekstra });
export const KOMPONEN_SELISIH = [
  { k: 'ppn', nilai_persen: 11, tingkat_bukti: 'EST', catatan: 'PPN umum 11 persen (UU HPP); sumber belum diambil dalam panen ini, verifikasi sebelum dipakai.' },
  { k: 'bea_masuk', nilai_persen: null, catatan: 'Tarif BM per pos HS (8541.43, 8504.40, 8507.60, 8502.31) belum dibaca dari sumber resmi; kosong.' },
  { k: 'tkdn_premium', nilai_persen: null, catatan: 'Premi produk ber-TKDN belum ada pasangan harga; lihat tkdn_produk.json untuk persen TKDN.' },
  { k: 'logistik', nilai_persen: null, catatan: 'Belum ada sumber ongkos kirim ke Indonesia.' },
];
export function bangun() {
  const produk = [
    P('modul-topcon', 'Modul PV mono TOPCon bifasial', 'USD/Wp', [
      D('Tiongkok domestik (rata-rata penyerahan, tanpa angkut)', 0.715, 'CNY', 'RMB/W; usd = rmb / kurs 2026-11-04 (EST)'),
      D('Non-Tiongkok (kutipan pra-pajak)', 0.114, 'USD', 'Rata-rata kutipan pasar non-Tiongkok'),
      D('Eropa, buatan Tiongkok, FOB', 0.115, 'USD', 'Proyek Eropa'),
      D('India rakitan, FOB', 0.135, 'USD', 'TOPCon rakitan India'),
      D('AS rakitan, DDP', 0.310, 'USD', 'Termasuk bea dan angkut sampai pembeli'),
      D('AS, buatan Asia Tenggara, FOB', 0.270, 'USD', 'Proyek AS'),
    ], { rujukan_tren: 'harga_komponen.json deret modul, modul-eropa-2024', tkdn_kategori: 'modul' }),
    P('modul-hjt', 'Modul PV mono HJT 210mm', 'USD/Wp', [D('Non-Tiongkok (kutipan pra-pajak)', 0.110, 'USD', 'HJT 210mm'), D('Tiongkok domestik', 0.750, 'CNY', 'RMB/W; usd = rmb / kurs (EST)')], { tkdn_kategori: 'modul' }),
    P('modul-perc', 'Modul PV mono PERC', 'USD/Wp', [], { catatan: 'InfoLink tidak lagi memuat modul PERC pada halaman terbuka; kosong.', tkdn_kategori: 'modul' }),
    P('sel-topcon', 'Sel surya TOPCon 182-183,75mm 25,4%+', 'USD/Wp', [D('Ekspor Tiongkok', 0.045, 'USD', 'Rata-rata pekan'), D('Tiongkok domestik', 0.295, 'CNY', 'RMB/W; usd = rmb / kurs (EST)')]),
    P('sel-perc', 'Sel surya mono PERC 182-183,75mm 23,1%+', 'USD/Wp', [D('Tiongkok (USD)', 0.047, 'USD', 'Rata-rata pekan')]),
    P('inverter-string', 'Inverter string', 'USD/W', [], { rujukan_tren: 'harga_komponen.json CELAH: tak ada seri terbuka', tkdn_kategori: 'inverter' }),
    P('inverter-sentral', 'Inverter sentral', 'USD/W', [], { tkdn_kategori: 'inverter' }),
    P('mikroinverter', 'Mikroinverter', 'USD/W', []),
    P('baterai-lfp-sel', 'Sel baterai LFP', 'USD/kWh', [], { catatan: 'Harga sel LFP InfoLink penyimpanan tidak terbaca (halaman energy-storage 404 pada URL tebakan).', tkdn_kategori: 'baterai' }),
    P('bess-sistem', 'Sistem BESS turnkey', 'USD/kWh', [], { rujukan_tren: 'harga_komponen.json deret turnkey-2024 (165), sistem-baterai (192), pack (BNEF 2018-2025)', tkdn_kategori: 'baterai' }),
    P('trafo', 'Trafo daya', 'USD/MVA', [], { tkdn_kategori: 'trafo' }),
    P('kabel', 'Kabel', 'USD/m', [], { tkdn_kategori: 'kabel' }),
    P('struktur-mounting', 'Struktur/mounting', 'USD/Wp', [], { tkdn_kategori: 'struktur' }),
    P('tracker', 'Tracker surya', 'USD/Wp', []),
    P('turbin-angin', 'Turbin angin', 'USD/kW', [], { rujukan_tren: 'harga_komponen.json deret turbin-tiongkok (195), turbin-luar-tiongkok (998), tic-bayu', tkdn_kategori: 'turbin' }),
    P('turbin-hidro', 'Turbin hidro/PLTMH', 'USD/kW', []),
    P('elektroliser', 'Elektroliser', 'USD/kW', []),
    P('panel-listrik', 'Panel listrik', 'USD/unit', []),
  ];
  return { lapis: 'publik', dibangun_pada: TANGGAL, sumber: SUMBER, kurs: KURS, komponen_selisih: KOMPONEN_SELISIH, pemasok_rujukan: 'public/data/global/pemasok_*.json (belum ada saat dibangun; hubungkan lewat id pemasok bila terbit)', produk, meta: { diperbarui: TANGGAL, tren_2020_2026: 'Dipakai dari harga_komponen.json (modul, pack, tic-*); tren sisi Indonesia kosong.' } };
}
