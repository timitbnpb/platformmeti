// akademi_kunci.js: kunci jawaban kuis akademi. HANYA dibaca Worker dan uji; tidak pernah disajikan sebagai aset (bukan di public/).
// Dipindah dari public/data/akademi.json (tinjauan keamanan 15 Nov 2026): berkas publik itu terbaca semua akun masuk, sehingga penilaian server bisa dilewati.
// a = indeks opsi benar; cek = potongan teks sumber yang membuktikan jawaban (dipakai uji keterpaduan, bukan layar).
export const KUNCI_AKADEMI = {
  "dasar-ebt-1": { a: 0, cek: "produksi maksimum teoretis" },
  "dasar-ebt-2": { a: 1, cek: "0.36 persen" },
  "dasar-ebt-3": { a: 2, cek: "7,34 persen" },
  "dasar-ebt-4": { a: 3, cek: "72.5" },
  "plts-atap-1": { a: 1, cek: "IUPTLS" },
  "plts-atap-2": { a: 2, cek: "ekspor ke jaringan tidak dibayar" },
  "plts-atap-3": { a: 1, cek: "240 jam" },
  "plts-atap-4": { a: 3, cek: "surat pernyataan keselamatan" },
  "perizinan-1": { a: 3, cek: "30 tahun" },
  "perizinan-2": { a: 1, cek: "500 kW" },
  "perizinan-3": { a: 2, cek: "90 hari" },
  "perizinan-4": { a: 3, cek: "20 orang" },
  "pembiayaan-1": { a: 0, cek: "mengunci harga dan volume" },
  "pembiayaan-2": { a: 2, cek: "USD 3,1 miliar dari USD 21,4 miliar" },
  "pembiayaan-3": { a: 3, cek: "3,59 persen" },
  "pembiayaan-4": { a: 0, cek: "hijau, transisi, tidak memenuhi" },
  "karbon-1": { a: 0, cek: "mengimbangi emisinya" },
  "karbon-2": { a: 1, cek: "membatasi emisi total" },
  "karbon-3": { a: 2, cek: "2060" },
  "karbon-4": { a: 3, cek: "dasar klaim listrik hijau" },
  "keselamatan-1": { a: 0, cek: "mencegah terjadinya kecelakaan" },
  "keselamatan-2": { a: 1, cek: "siap dioperasikan" },
  "keselamatan-3": { a: 2, cek: "keselamatan H2S" },
  "keselamatan-4": { a: 3, cek: "keselamatan tidak boleh ditawar" },
};
