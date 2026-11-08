/* Seed terkurasi /lelang: putaran pengadaan IPP EBT PLN (dan anak usaha), DPT, peristiwa kebijakan.
   Setiap baris WAJIB bersumber (sumber_id ada di SUMBER) dan membawa tingkat bukti; angka yang tidak tertulis di sumber dibiarkan null.
   Dibaca halaman sumber terbuka pada 2026-11-08 (WebFetch/WebSearch; tanpa login, tanpa CAPTCHA; LPSE/eproc.pln.co.id TIDAK dibaca).
   Sumber yang gagal dibaca langsung (HTTP 403) hanya dipakai untuk fakta yang tampil di ringkasan hasil pencarian dan ditandai di catatan. */
export const TGL_AMBIL = "2026-11-08";

export const SUMBER = [
  { id: "s-kontan-giga1", judul: "PLN luncurkan Giga One PLTS 1,22 GW, catat jadwal tender dan target proyeknya", penerbit: "Kontan", url: "https://industri.kontan.co.id/news/pln-luncurkan-giga-one-plts-122-gw-catat-jadwal-tender-dan-target-proyeknya", terbit: "2026-05-04" },
  { id: "s-pvmag-giga1", judul: "Indonesia tenders 1.2 GW of solar", penerbit: "pv magazine", url: "https://www.pv-magazine.com/2026/05/05/indonesia-tenders-1-2-gw-of-solar/", terbit: "2026-05-05" },
  { id: "s-listrik-7plts", judul: "Bahlil buka 7 proyek PLTS untuk swasta, ini daftarnya", penerbit: "Listrik Indonesia", url: "https://listrikindonesia.com/detail/21012/bahlil-buka-7-proyek-plts-untuk-swasta-ini-daftarnya", terbit: "2026-08-26" },
  { id: "s-warta-tobelo", judul: "KEEN menang tender PLTS Tobelo 10 MW dari PLN", penerbit: "Warta Ekonomi", url: "https://wartaekonomi.co.id/read592539/keen-menang-tender-plts-tobelo-10-mw-dari-pln", terbit: "2025-12-05" },
  { id: "s-kontan-bali", judul: "PLN sudah dapatkan pemenang lelang PLTS Bali Barat dan Bali Timur di tahun lalu", penerbit: "Kontan", url: "https://industri.kontan.co.id/news/pln-sudah-dapatkan-pemenang-lelang-plts-bali-barat-dan-bali-timur-di-tahun-lalu", terbit: "2020-08-07" },
  { id: "s-solarq-hijaunesia", judul: "PLN Indonesia Power invites bids for Hijaunesia 2023 renewable energy project", penerbit: "SolarQuarter", url: "https://solarquarter.com/2023/03/15/pln-indonesia-power-invites-bids-for-hijaunesia-2023-renewable-energy-project/", terbit: "2023-03-15" },
  { id: "s-dunia-hijaunesia", judul: "PLN Indonesia Power kebut pembangunan PLTS 500 MW dari proyek Hijaunesia", penerbit: "Dunia Energi", url: "https://www.dunia-energi.com/?p=64882", terbit: "2024-04-09" },
  { id: "s-cnbc-adb300", judul: "PLN gandeng ADB garap 3 PLTS berkapasitas 300 MW", penerbit: "CNBC Indonesia", url: "https://www.cnbcindonesia.com/news/20251104152449-4-682209/pln-gandeng-adb-garap-3-plts-berkapasitas-300-mw", terbit: "2025-11-04" },
  { id: "s-pvtech-masdar", judul: "Masdar, PLN sign two floating PV agreements for Indonesian projects", penerbit: "PV Tech", url: "https://www.pv-tech.org/masdar-pln-sign-two-indonesian-floating-pv-deals", terbit: "2025-04-14" },
  { id: "s-kontan-cirata", judul: "PLTS Cirata dilelang, tapi Masdar dapat hak istimewa", penerbit: "Kontan", url: "https://insight.kontan.co.id/news/plts-cirata-dilelang-tapi-masdar-dapat-hak-istimewa", terbit: "2019-07-05" },
  { id: "s-nse-cirata", judul: "Cirata Floating Solar PV Power Plant, Indonesia", penerbit: "NS Energy", url: "https://www.nsenergybusiness.com/projects/cirata-floating-solar-photovoltaic-power-plant-indonesia", terbit: null },
  { id: "s-cnbc-lelang2proyek", judul: "PLTS Terapung Cirata sukses, RI bakal lelang 2 proyek lagi", penerbit: "CNBC Indonesia", url: "https://www.cnbcindonesia.com/news/20231110113125-4-488006/plts-terapung-cirata-sukses-ri-bakal-lelang-2-proyek-lagi", terbit: "2023-11-10" },
  { id: "s-petro-sumatra", judul: "PLN to launch first 350 MW tranche of GIGA ONE Sumatra Hydro project", penerbit: "Petromindo", url: "https://www.petromindo.com/news/article/pln-to-launch-first-350-mw-tranche-of-giga-one-sumatra-hydro-project", terbit: "2026-08-05" },
  { id: "s-petro-sulawesi", judul: "PLN to launch tender for 200 MW hydropower plants in Sulawesi", penerbit: "Petromindo", url: "https://www.petromindo.com/news/article/pln-to-launch-tender-for-200-mw-hydropower-plants-in-sulawesi", terbit: "2024-06-15" },
  { id: "s-kontan-dpt20", judul: "PLN syaratkan ini bagi pengembang untuk mengikuti proyek EBT", penerbit: "Kontan", url: "https://industri.kontan.co.id/news/pln-syaratkan-ini-bagi-pengembang-untuk-mengikuti-proyek-ebt?page=all", terbit: "2020-12-10" },
  { id: "s-cnbc-18gw", judul: "PLN proses pengadaan 18 GW listrik hijau", penerbit: "CNBC Indonesia", url: "https://www.cnbcindonesia.com/news/20250523160653-4-635758/pln-proses-pengadaan-18-gw-listrik-hijau", terbit: "2025-05-23" },
  { id: "s-iesr21", judul: "Hitting record-low solar electricity prices in Indonesia (IESR)", penerbit: "IESR", url: "https://iesr.or.id/wp-content/uploads/2021/08/2021-08-19_Solar-Auction-Paper_Report-Launch-1.pdf", terbit: "2021-08-19" },
  { id: "s-listrik-permen5", judul: "Permen ESDM 2025 jadi katalis, PLN kejar target EBT 4,1 GW", penerbit: "Listrik Indonesia", url: "https://listrikindonesia.com/detail/15967/permen-esdm-2025-jadi-katalis-pln-kejar-target-ebt-41-gw", terbit: "2025-03-12" },
  { id: "s-bisnis-bren", judul: "Manuver BREN Prajogo Pangestu incar tender proyek pembangkit listrik PLN", penerbit: "Bisnis.com", url: "https://market.bisnis.com/read/20250221/192/1841464/manuver-bren-prajogo-pangestu-incar-tender-proyek-pembangkit-listrik-pln", terbit: "2025-02-21" },
  { id: "s-bisnis-tanah", judul: "PLN buka seleksi penyedia tanah untuk PLTS dan BESS", penerbit: "Bisnis.com", url: "https://ekonomi.bisnis.com/read/20261008/44/2010962/pln-buka-seleksi-penyedia-tanah-untuk-plts-dan-bess", terbit: "2026-10-08" },
  { id: "s-cnbc-lelang-2025", judul: "Bahlil lelang 10 wilayah panas bumi RI tahun 2025, ini daftarnya", penerbit: "CNBC Indonesia", url: "https://www.cnbcindonesia.com/news/20250917184934-4-667921/bahlil-lelang-10-wilayah-panas-bumi-ri-tahun-2025-ini-daftarnya", terbit: "2025-09-17" },
];

const PLN = { nama: "PLN", org_id: "su_ed074ff5" };
const PLNIP = { nama: "PLN Indonesia Power", org_id: "p_5a2e7d0c63" };
const ESDM = { nama: "Kementerian ESDM", org_id: null };
const MASDAR = { nama: "Masdar", org_id: "p_45c7d8a27f", negara: "ae" };
const L = (teks, kode_bps = []) => ({ teks, kode_bps });

/* tahap: rencana, pengumuman, prakualifikasi, penawaran, pemenang, ppa, cod, batal.
   skema: lelang_terbuka, pemilihan_langsung, penunjukan_langsung, kerja_sama_anak_usaha, lelang_pemerintah, tidak_dinyatakan.
   riwayat[].tentatif=true: tanggal jadwal/target yang dikutip, bukan peristiwa yang sudah terjadi. */
export const PUTARAN = [
  { id: "lel_cirata_2019", nama: "PLTS Terapung Cirata (PJB dan mitra IPP)", kategori: "anak_usaha", penyelenggara: PLN, teknologi: "surya", kapasitas_mw: 145, kapasitas_satuan: "MWac", lokasi: L("Waduk Cirata, Jawa Barat", ["32"]), skema: "kerja_sama_anak_usaha", tahap: "cod", tahun: 2019,
    riwayat: [
      { tahap: "pengumuman", tanggal: "2017-11", presisi: "bulan", catatan: "Perjanjian pengembangan proyek PJB dengan Masdar akhir November 2017; PJB ditunjuk PLN sebagai pemegang proyek dan menggandeng IPP.", sumber_id: "s-kontan-cirata" },
      { tahap: "penawaran", tanggal: "2019-07-12", presisi: "hari", catatan: "Batas penyerahan proposal; delapan IPP dari lima negara bersaing, Masdar punya hak menyamakan tawaran (right to match).", sumber_id: "s-kontan-cirata" },
      { tahap: "pemenang", tanggal: "2019-08-19", presisi: "hari", tentatif: true, catatan: "Jadwal pengumuman pemenang menurut Dirjen Ketenagalistrikan; hasil resmi tidak ditemukan pada sumber yang dibaca.", sumber_id: "s-kontan-cirata" },
      { tahap: "ppa", tanggal: "2020", presisi: "tahun", catatan: "NS Energy menulis Januari 2020 di satu bagian dan Januari 2021 di bagian lain; tahun belum pasti. Perusahaan proyek PT Pembangkitan Jawa Bali Masdar Solar Energi dibentuk Desember 2020.", sumber_id: "s-nse-cirata" },
      { tahap: "cod", tanggal: "2023-11", presisi: "bulan", catatan: "Fase I beroperasi November 2023.", sumber_id: "s-nse-cirata" },
    ],
    peserta_jumlah: 8, peserta: [{ ...MASDAR, peran: "pemegang hak menyamakan tawaran" }],
    pemenang: [{ ...MASDAR }, { nama: "PT Pembangkitan Jawa Bali Masdar Solar Energi", org_id: "tk_7d9f65bf", negara: "id" }],
    harga: { jenis: "ppa", usd_sen_kwh: 5.8179, tahun_harga: 2020, basis: "PPA yang disepakati", sumber_id: "s-nse-cirata" },
    investasi_usd_juta: 129, proyek_id: ["pj_0334"], program_id: ["plts-100gw"], regulasi_id: [],
    sumber_id: "s-nse-cirata", tingkat_bukti: "media", catatan: "Pengadaan melalui pemilihan langsung berdasarkan Permen ESDM 50/2017 (PLN wajib membeli EBT lewat pemilihan langsung). Nama tujuh peserta lain tidak diumumkan." },

  { id: "lel_bali_barat_2019", nama: "PLTS Bali Barat", kategori: "pln", penyelenggara: PLN, teknologi: "surya", kapasitas_mw: 25, kapasitas_satuan: "MW", lokasi: L("Bali Barat", ["51"]), skema: "pemilihan_langsung", tahap: "pemenang", tahun: 2019,
    riwayat: [
      { tahap: "pemenang", tanggal: "2019", presisi: "tahun", catatan: "PLN menyatakan sudah punya pemenang tetapi tidak membuka nama IPP; per Agustus 2020 PPA belum ditandatangani dan pemenang menyusun studi kelayakan.", sumber_id: "s-kontan-bali" },
    ],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: 22.23, proyek_id: ["pj_0330"], program_id: [], regulasi_id: [],
    sumber_id: "s-kontan-bali", tingkat_bukti: "media", catatan: "Skema 2017-2020 menurut IESR: pemilihan langsung berbasis kuota PLN dengan prakualifikasi DPT (Bali 2 x 25 MWp). Harga tawar tidak diumumkan." },
  { id: "lel_bali_timur_2019", nama: "PLTS Bali Timur", kategori: "pln", penyelenggara: PLN, teknologi: "surya", kapasitas_mw: 25, kapasitas_satuan: "MW", lokasi: L("Bali Timur", ["51"]), skema: "pemilihan_langsung", tahap: "pemenang", tahun: 2019,
    riwayat: [
      { tahap: "pemenang", tanggal: "2019", presisi: "tahun", catatan: "Sama dengan Bali Barat: pemenang tidak disebut, PPA belum ditandatangani per Agustus 2020.", sumber_id: "s-kontan-bali" },
    ],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: 21.3, proyek_id: [], program_id: [], regulasi_id: [],
    sumber_id: "s-kontan-bali", tingkat_bukti: "media", catatan: "Nilai proyek sekitar US$21,3 juta menurut Kontan; bukan harga jual listrik." },

  { id: "lel_hijaunesia_2023", nama: "Hijaunesia 2023 (mitra investasi PLTS dan PLTB, program 1.055 MW)", kategori: "anak_usaha", penyelenggara: PLNIP, teknologi: "campuran", kapasitas_mw: 1055, kapasitas_satuan: "MW", lokasi: L("Jawa-Bali dan Aceh", []), skema: "kerja_sama_anak_usaha", tahap: "pemenang", tahun: 2023,
    riwayat: [
      { tahap: "prakualifikasi", tanggal: "2023-03-09", presisi: "hari", catatan: "RFQ tersedia 9-16 Maret 2023; EOI 16 Maret, SOQ 20 Maret. Peserta wajib masuk DPT PLN atau mendaftar DPT dengan SOQ paling lambat tahap RFP.", sumber_id: "s-solarq-hijaunesia" },
      { tahap: "penawaran", tanggal: "2024-04", presisi: "bulan", catatan: "Untuk paket PLTS 500 MW: 33 peserta lulus RFQ dan memasuki evaluasi sampul 1.", sumber_id: "s-dunia-hijaunesia" },
      { tahap: "pemenang", tanggal: "2025-04", presisi: "bulan", catatan: "Masdar disebut meraih tarif terendah pada program Hijaunesia 2023; angka tarif tidak diumumkan pada sumber.", sumber_id: "s-pvtech-masdar" },
    ],
    peserta_jumlah: 33, peserta: [], pemenang: [{ ...MASDAR, catatan: "tarif terendah (tanpa angka)" }], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: ["plts-100gw"], regulasi_id: [],
    sumber_id: "s-solarq-hijaunesia", tingkat_bukti: "media", catatan: "Total 1.055 MW terdiri atas 12 PLTS dan 1 PLTB (sumber Dunia Energi). PLN IP bermaksud menguasai saham mayoritas tiap proyek; penasihat: KPMG Siddharta Advisory, GHP, AFRY, PLN Enjiniring." },
  { id: "lel_hijaunesia_500", nama: "Hijaunesia: paket PLTS 500 MW (lima lokasi)", kategori: "anak_usaha", penyelenggara: PLNIP, teknologi: "surya", kapasitas_mw: 500, kapasitas_satuan: "MW", lokasi: L("Lima lokasi (tidak disebut)", []), skema: "kerja_sama_anak_usaha", tahap: "penawaran", tahun: 2024,
    riwayat: [{ tahap: "penawaran", tanggal: "2024-04-06", presisi: "hari", catatan: "33 peserta lulus RFQ (mitra dan kontraktor EPC dari Indonesia sampai Eropa); evaluasi sampul 1 berjalan.", sumber_id: "s-dunia-hijaunesia" }],
    peserta_jumlah: 33, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: ["plts-100gw"], regulasi_id: [],
    sumber_id: "s-dunia-hijaunesia", tingkat_bukti: "media", catatan: "Hasil akhir paket ini tidak ditemukan pada sumber terbuka yang dibaca." },
  { id: "lel_hijaunesia_adb300", nama: "Hijaunesia: tiga PLTS 300 MW berpendanaan ADB", kategori: "anak_usaha", penyelenggara: PLNIP, teknologi: "surya", kapasitas_mw: 300, kapasitas_satuan: "MW", lokasi: L("Tidak disebut (dua darat, satu terapung)", []), skema: "kerja_sama_anak_usaha", tahap: "pemenang", tahun: 2025,
    riwayat: [{ tahap: "pemenang", tanggal: "2025-11-04", presisi: "hari", catatan: "PLN IP 51 persen, mitra asing 49 persen; ADB berkomitmen membiayai (30 persen ekuitas, 70 persen pinjaman); investasi tiap proyek US$80-100 juta.", sumber_id: "s-cnbc-adb300" }],
    peserta_jumlah: 4, peserta: [], pemenang: [{ nama: "GCL (China)", org_id: null, negara: "cn" }, { nama: "Vena Energy", org_id: "p_ef20787d46", negara: "sg" }, { ...MASDAR, catatan: "sumber menulis Arab Saudi; Masdar umumnya berbasis Uni Emirat Arab" }, { nama: "ACWA Power", org_id: "p_0e6d34a26d", negara: "sa" }],
    harga: null, investasi_usd_juta: null, proyek_id: [], program_id: ["plts-100gw"], regulasi_id: [],
    sumber_id: "s-cnbc-adb300", tingkat_bukti: "media", catatan: "Sumber menyebut keempat mitra 'akan bergabung'; belum ada PPA yang disebut. Nama proyek dan lokasi tidak ditulis." },
  { id: "lel_jatigede_2025", nama: "PLTS Terapung Jatigede (nota kesepahaman PLN-Masdar)", kategori: "pln", penyelenggara: PLN, teknologi: "surya", kapasitas_mw: null, kapasitas_satuan: "MW", lokasi: L("Bendungan Jatigede, Jawa Barat", ["32"]), skema: "kerja_sama_anak_usaha", tahap: "pemenang", tahun: 2025,
    riwayat: [{ tahap: "pemenang", tanggal: "2025-04-14", presisi: "hari", catatan: "MoU menyusul kemenangan Masdar atas tarif terendah di Hijaunesia 2023; pengembangan dimulai 2025, operasi pertama 2027 (target).", sumber_id: "s-pvtech-masdar" }],
    peserta_jumlah: null, peserta: [], pemenang: [{ ...MASDAR }], harga: null, investasi_usd_juta: null, proyek_id: ["pj_0336"], program_id: ["plts-100gw"], regulasi_id: [],
    sumber_id: "s-pvtech-masdar", tingkat_bukti: "media", catatan: "Kapasitas tidak disebut pada sumber (daftar pemerintah Agustus 2026 menulis 636 MWp untuk lokasi yang sama)." },
  { id: "lel_cirata_ii", nama: "PLTS Terapung Cirata fase II (perluasan hingga 500 MW)", kategori: "pln", penyelenggara: PLN, teknologi: "surya", kapasitas_mw: 500, kapasitas_satuan: "MW", lokasi: L("Waduk Cirata, Jawa Barat", ["32"]), skema: "penunjukan_langsung", tahap: "pengumuman", tahun: 2025,
    riwayat: [{ tahap: "pengumuman", tanggal: "2025-04-14", presisi: "hari", catatan: "Principles of Agreement PLN-Masdar untuk perluasan; pada September 2023 kedua pihak sudah membahas kapasitas hingga 500 MW tambahan.", sumber_id: "s-pvtech-masdar" }],
    peserta_jumlah: null, peserta: [], pemenang: [{ ...MASDAR }], harga: null, investasi_usd_juta: null, proyek_id: ["pj_0334"], program_id: ["plts-100gw"], regulasi_id: [],
    sumber_id: "s-pvtech-masdar", tingkat_bukti: "media", catatan: "Kapasitas 'hingga 500 MW' berasal dari NS Energy; PV Tech tidak menyebut angka. Skema dicatat penunjukan langsung karena berupa perjanjian prinsip dengan pengembang eksisting, bukan tender terbuka." },

  { id: "lel_singkarak_2023", nama: "PLTS Terapung Singkarak (rencana lelang pemerintah)", kategori: "pemerintah", penyelenggara: ESDM, teknologi: "surya", kapasitas_mw: null, kapasitas_satuan: "MWp", lokasi: L("Danau Singkarak, Sumatera Barat", ["13"]), skema: "lelang_pemerintah", tahap: "pengumuman", tahun: 2023,
    riwayat: [{ tahap: "pengumuman", tanggal: "2023-11-09", presisi: "hari", catatan: "Dirjen EBTKE menyebut dua proyek (100 MWp dan 125 MWp) tetapi tidak jelas angka mana milik lokasi mana.", sumber_id: "s-cnbc-lelang2proyek" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: [], regulasi_id: [],
    sumber_id: "s-cnbc-lelang2proyek", tingkat_bukti: "media", catatan: "Hasil lelang tidak ditemukan." },
  { id: "lel_saguling_2023", nama: "PLTS Terapung Saguling (rencana lelang pemerintah)", kategori: "pemerintah", penyelenggara: ESDM, teknologi: "surya", kapasitas_mw: null, kapasitas_satuan: "MWp", lokasi: L("Waduk Saguling, Jawa Barat", ["32"]), skema: "lelang_pemerintah", tahap: "pengumuman", tahun: 2023,
    riwayat: [{ tahap: "pengumuman", tanggal: "2023-11-09", presisi: "hari", catatan: "Lelang disebut sudah berjalan bersama Singkarak; kapasitas tidak jelas (100 atau 125 MWp).", sumber_id: "s-cnbc-lelang2proyek" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: ["pj_0339"], program_id: ["plts-100gw"], regulasi_id: [],
    sumber_id: "s-cnbc-lelang2proyek", tingkat_bukti: "media", catatan: "Proyek yang kemudian tercatat di /p/pj_0339 berkapasitas 92 MWp; hubungannya dengan lelang 2023 tidak dinyatakan sumber." },

  { id: "lel_tobelo_2025", nama: "PLTS Tobelo 10 MW dengan baterai 8,4 MWh", kategori: "pln", penyelenggara: PLN, teknologi: "surya", kapasitas_mw: 10, kapasitas_satuan: "MW", lokasi: L("Tobelo Utara, Halmahera Utara, Maluku Utara", ["82"]), skema: "tidak_dinyatakan", tahap: "pemenang", tahun: 2025,
    riwayat: [{ tahap: "pemenang", tanggal: "2025-12-05", presisi: "hari", catatan: "KEEN ditetapkan pemenang tender IPP; PPA dengan PLN akan menjadi yang pertama bagi KEEN untuk PLTS; konstruksi mulai kuartal II 2026, sekitar 18 bulan.", sumber_id: "s-warta-tobelo" }],
    peserta_jumlah: null, peserta: [], pemenang: [{ nama: "PT Kencana Energi Lestari Tbk", org_id: "ix_keen", negara: "id" }], harga: null, investasi_usd_juta: null, proyek_id: ["pj_0309"], program_id: [], regulasi_id: [],
    sumber_id: "s-warta-tobelo", tingkat_bukti: "media", catatan: "Sumber hanya menulis 'tender IPP'; skema pemilihan tidak dinyatakan. Harga PPA dan tanggal PPA tidak disebut. pj_0309 adalah BESS Tobelo 10 MW pada data proyek." },

  { id: "lel_giga_mentari1", nama: "GIGA ONE: PLTS Mentari Nusantara I (22 lokasi, 1.225 MW)", kategori: "pln", penyelenggara: PLN, teknologi: "surya", kapasitas_mw: 1225, kapasitas_satuan: "MW", lokasi: L("Sumatera, Kalimantan, Jawa, Sulawesi, NTB, Maluku-Papua", []), skema: "pemilihan_langsung", tahap: "penawaran", tahun: 2026,
    riwayat: [
      { tahap: "pengumuman", tanggal: "2026-04-30", presisi: "hari", catatan: "Tender dimulai; terbuka bagi IPP berstatus DPT PLTS PLN, dalam dan luar negeri; peserta boleh menawar lebih dari satu paket sampai batas kapasitas.", sumber_id: "s-kontan-giga1" },
      { tahap: "penawaran", tanggal: "2026-06-15", presisi: "hari", tentatif: true, catatan: "Batas proposal menurut Kontan; pv magazine (5 Mei) menulis tenggat belum diumumkan.", sumber_id: "s-kontan-giga1" },
      { tahap: "pemenang", tanggal: "2026-12", presisi: "bulan", tentatif: true, catatan: "Target selesai paling lambat akhir 2026.", sumber_id: "s-kontan-giga1" },
      { tahap: "cod", tanggal: "2029", presisi: "tahun", tentatif: true, catatan: "Target COD 2029 untuk semua proyek; konstruksi fisik setelah financial close, sekitar pertengahan 2027.", sumber_id: "s-kontan-giga1" },
    ],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: ["plts-100gw"], regulasi_id: ["perpres-112-2022"],
    paket: [{ wilayah: "Sumatera", mw: 35 }, { wilayah: "Kalimantan", mw: 340 }, { wilayah: "Jawa", mw: 600 }, { wilayah: "Sulawesi", mw: 50 }, { wilayah: "Nusa Tenggara Barat", mw: 80 }, { wilayah: "Maluku dan Papua", mw: 120 }],
    sumber_id: "s-kontan-giga1", tingkat_bukti: "media", catatan: "Hasil penawaran dan peserta belum ditemukan pada sumber terbuka sampai 8 November 2026." },
  { id: "lel_giga_hidro_sumatra", nama: "GIGA ONE Hydro: tahap pertama Sumatera baseload 350 MW (dari 1.800 MW)", kategori: "pln", penyelenggara: PLN, teknologi: "hidro", kapasitas_mw: 350, kapasitas_satuan: "MW", lokasi: L("Sumatera", []), skema: "tidak_dinyatakan", tahap: "pengumuman", tahun: 2026,
    riwayat: [{ tahap: "pengumuman", tanggal: "2026-08", presisi: "bulan", tentatif: true, catatan: "Direktur PLN menyebut tender diluncurkan 'pekan depan' (sekitar pekan 10 Agustus 2026). Sisa kapasitas ditahan sampai interkoneksi Sumatera-Jawa rampung.", sumber_id: "s-petro-sumatra" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: [], regulasi_id: [],
    paket: [{ wilayah: "Sumatera baseload tahap 1", mw: 350 }],
    sumber_id: "s-petro-sumatra", tingkat_bukti: "media", catatan: "Bagian dari program GIGA ONE Hydro 7 GW. Tender Sumatera peaker 1.000 MW sudah diluncurkan lebih dulu." },
  { id: "lel_giga_hidro_sulbase1", nama: "GIGA ONE Hydro: Sulawesi baseload tahap 1 (rencana)", kategori: "pln", penyelenggara: PLN, teknologi: "hidro", kapasitas_mw: 1400, kapasitas_satuan: "MW", lokasi: L("Sulawesi", []), skema: "tidak_dinyatakan", tahap: "rencana", tahun: 2026,
    riwayat: [{ tahap: "rencana", tanggal: "2026-08-05", presisi: "hari", catatan: "Daftar tender GIGA ONE Hydro berikutnya tanpa jadwal.", sumber_id: "s-petro-sumatra" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: [], regulasi_id: [], sumber_id: "s-petro-sumatra", tingkat_bukti: "media", catatan: "" },
  { id: "lel_giga_hidro_sulbase2", nama: "GIGA ONE Hydro: Sulawesi baseload tahap 2 (rencana)", kategori: "pln", penyelenggara: PLN, teknologi: "hidro", kapasitas_mw: 1800, kapasitas_satuan: "MW", lokasi: L("Sulawesi", []), skema: "tidak_dinyatakan", tahap: "rencana", tahun: 2026,
    riwayat: [{ tahap: "rencana", tanggal: "2026-08-05", presisi: "hari", catatan: "Daftar tender GIGA ONE Hydro berikutnya tanpa jadwal.", sumber_id: "s-petro-sumatra" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: [], regulasi_id: [], sumber_id: "s-petro-sumatra", tingkat_bukti: "media", catatan: "" },
  { id: "lel_giga_hidro_kalbase", nama: "GIGA ONE Hydro: Kalimantan baseload (rencana)", kategori: "pln", penyelenggara: PLN, teknologi: "hidro", kapasitas_mw: 825, kapasitas_satuan: "MW", lokasi: L("Kalimantan", []), skema: "tidak_dinyatakan", tahap: "rencana", tahun: 2026,
    riwayat: [{ tahap: "rencana", tanggal: "2026-08-05", presisi: "hari", catatan: "Daftar tender GIGA ONE Hydro berikutnya tanpa jadwal.", sumber_id: "s-petro-sumatra" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: [], regulasi_id: [], sumber_id: "s-petro-sumatra", tingkat_bukti: "media", catatan: "" },
  { id: "lel_giga_hidro_kalpeaker", nama: "GIGA ONE Hydro: Kalimantan peaker (rencana)", kategori: "pln", penyelenggara: PLN, teknologi: "hidro", kapasitas_mw: 150, kapasitas_satuan: "MW", lokasi: L("Kalimantan", []), skema: "tidak_dinyatakan", tahap: "rencana", tahun: 2026,
    riwayat: [{ tahap: "rencana", tanggal: "2026-08-05", presisi: "hari", catatan: "Daftar tender GIGA ONE Hydro berikutnya tanpa jadwal.", sumber_id: "s-petro-sumatra" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: [], regulasi_id: [], sumber_id: "s-petro-sumatra", tingkat_bukti: "media", catatan: "" },
  { id: "lel_hidro_sulawesi_2024", nama: "PLTA Sulawesi 200 MW (rencana tender PLN)", kategori: "pln", penyelenggara: PLN, teknologi: "hidro", kapasitas_mw: 200, kapasitas_satuan: "MW", lokasi: L("Sulawesi", []), skema: "tidak_dinyatakan", tahap: "rencana", tahun: 2024,
    riwayat: [{ tahap: "rencana", tanggal: "2024-06-15", presisi: "hari", catatan: "Hanya judul dan teaser yang terbaca (artikel berbayar): PLN akan meluncurkan tender.", sumber_id: "s-petro-sulawesi" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: [], regulasi_id: [], sumber_id: "s-petro-sulawesi", tingkat_bukti: "media", catatan: "Jumlah pembangkit dan jadwal tidak terbaca." },
  { id: "lel_pltb_sulbagsel_2025", nama: "PLTB Sulawesi Bagian Selatan, dua paket 60 MW dan 70 MW (rencana)", kategori: "pln", penyelenggara: PLN, teknologi: "bayu", kapasitas_mw: 130, kapasitas_satuan: "MW", lokasi: L("Sulawesi Selatan", ["73"]), skema: "tidak_dinyatakan", tahap: "rencana", tahun: 2025,
    riwayat: [{ tahap: "rencana", tanggal: "2025-02-21", presisi: "hari", catatan: "Bisnis.com: PLN akan segera melelang dua PLTB (60 MW dan 70 MW), dekat PLTB Sidrap I dan II milik BREN.", sumber_id: "s-bisnis-bren" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: [], regulasi_id: [],
    paket: [{ wilayah: "Paket 1", mw: 60 }, { wilayah: "Paket 2", mw: 70 }],
    sumber_id: "s-bisnis-bren", tingkat_bukti: "media", catatan: "Halaman sumber menolak pembacaan langsung (HTTP 403); fakta diambil dari ringkasan hasil pencarian. Peluncuran tender resmi tidak terkonfirmasi." },

  { id: "lel_plts7_pemerintah_2026", nama: "Tujuh PLTS pemerintah ditawarkan ke IPP (Purwakarta, Jatiluhur, Cirata, Jatigede, Madura, Gilimanuk, Buleleng)", kategori: "pemerintah", penyelenggara: { nama: "Pemerintah (Kementerian ESDM)", org_id: null }, teknologi: "surya", kapasitas_mw: 4666, kapasitas_satuan: "MWp", lokasi: L("Jawa Barat, Jawa Timur, Bali", ["32", "35", "51"]), skema: "lelang_pemerintah", tahap: "pengumuman", tahun: 2026,
    riwayat: [{ tahap: "pengumuman", tanggal: "2026-08-26", presisi: "hari", catatan: "Bila penawaran tidak kompetitif atau swasta tidak berminat, pemerintah membangun lewat Danantara. Tarif, jadwal, dan biaya proyek tidak disebut.", sumber_id: "s-listrik-7plts" }],
    peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: ["pj_0335", "pj_0336", "pj_0337"], program_id: ["plts-100gw"], regulasi_id: [],
    paket: [{ wilayah: "Purwakarta (darat, lahan Bank Tanah)", mw: 69 }, { wilayah: "Jatiluhur (terapung)", mw: 1688 }, { wilayah: "Cirata (terapung)", mw: 1250 }, { wilayah: "Jatigede (terapung)", mw: 636 }, { wilayah: "Madura", mw: 605 }, { wilayah: "Gilimanuk", mw: 300 }, { wilayah: "Buleleng", mw: 118 }],
    sumber_id: "s-listrik-7plts", tingkat_bukti: "media", catatan: "Jumlah paket dijumlah dari daftar sumber: 4.666 MWp. Madura, Gilimanuk, dan Buleleng tidak dirinci jenis PLTS-nya; provinsi Madura dan Bali diambil dari nama lokasi." },
];

export const DPT = [
  { id: "dpt_2019_aneka", tahun: 2019, nama: "DPT IPP Aneka Energi 2019", jumlah: 232, jenis: "ipp_ebt", teks: "Sebanyak 232 perusahaan masuk DPT IPP Aneka Energi 'tahun lalu' (artikel Desember 2020).", sumber_id: "s-kontan-dpt20", tingkat_bukti: "media" },
  { id: "dpt_2020_plts_bio", tahun: 2020, nama: "Undangan DPT 2020: PLTS dan PLTBio", jumlah: null, jenis: "ipp_ebt", teks: "Surat undangan DPT-1103-20201106-0009 (26 November 2020, PLTBio) dan DPT-1103-20201012-0001 (7 Desember 2020, PLTS). Syarat: badan usaha Indonesia atau dari negara berhubungan diplomatik; pengalaman minimal satu kontrak IPP, EPC, atau O&M dalam 10 tahun terakhir dengan kinerja memuaskan satu tahun operasi per unit; peringkat kredit sendiri dari D&B, S&P, Moody's, atau Fitch (bukan induk); khusus PLTS laporan keuangan audit tiga tahun milik perusahaan sendiri.", sumber_id: "s-kontan-dpt20", tingkat_bukti: "media" },
  { id: "dpt_2023_hijaunesia", tahun: 2023, nama: "DPT dan SOQ untuk Hijaunesia 2023", jumlah: null, jenis: "ipp_ebt", teks: "Hanya perusahaan DPT yang boleh ikut; yang belum terdaftar mengajukan DPT dengan Statement of Qualification dan harus terdaftar saat penyerahan RFP.", sumber_id: "s-solarq-hijaunesia", tingkat_bukti: "media" },
  { id: "dpt_2026_giga", tahun: 2026, nama: "DPT PLTS untuk tender GIGA ONE", jumlah: null, jenis: "ipp_ebt", teks: "Tender Mentari Nusantara I terbuka bagi semua IPP terdaftar di DPT PLTS PLN, dalam dan luar negeri.", sumber_id: "s-kontan-giga1", tingkat_bukti: "media" },
  { id: "dpt_2026_tanah", tahun: 2026, nama: "DPT penyedia tanah PLTS dan BESS", jumlah: null, jenis: "tanah", teks: "Seleksi penyedia tanah untuk PLTS dan baterai dibuka sampai 29 Oktober 2026 lewat aplikasi eProc PLN; peserta wajib berstatus penyedia terverifikasi (VMS); tanpa biaya. Ini daftar penyedia tanah, bukan DPT pembangkit.", sumber_id: "s-bisnis-tanah", tingkat_bukti: "media", catatan: "Halaman sumber HTTP 403; isi dari ringkasan hasil pencarian." },
];

export const PERISTIWA = [
  { id: "ev_2013", tanggal: "2013", presisi: "tahun", judul: "Permen ESDM 17/2013: kuota PLTS oleh Kementerian ESDM", teks: "Tender kompetitif dengan plafon 25 sen US$/kWh (tanpa kandungan lokal) atau 30 sen (dengan modul surya 40 persen lokal); harga PPA final tanpa negosiasi.", regulasi_id: "permen-esdm-17-2013", sumber_id: "s-iesr21", tingkat_bukti: "kajian" },
  { id: "ev_2016", tanggal: "2016", presisi: "tahun", judul: "Permen ESDM 19/2016: tarif tetap PLTS 14-25 sen US$/kWh", teks: "Siapa cepat dia dapat per kuota wilayah; prakualifikasi oleh Kementerian ESDM.", regulasi_id: "permen-esdm-19-2016", sumber_id: "s-iesr21", tingkat_bukti: "kajian" },
  { id: "ev_2017", tanggal: "2017", presisi: "tahun", judul: "Permen ESDM 12/2017 dan 50/2017: pemilihan langsung oleh PLN", teks: "PLN memilih langsung berdasarkan kuota RUPTL dengan prakualifikasi DPT; plafon harga 85 persen BPP pembangkitan bila BPP lokal di atas BPP nasional.", regulasi_id: null, sumber_id: "s-iesr21", tingkat_bukti: "kajian" },
  { id: "ev_2020_dpt", tanggal: "2020-12", presisi: "bulan", judul: "Undangan DPT PLN untuk IPP PLTS dan bioenergi", teks: "Pendaftaran lewat eProc PLN dengan syarat pengalaman, peringkat kredit, dan laporan keuangan.", regulasi_id: null, sumber_id: "s-kontan-dpt20", tingkat_bukti: "media" },
  { id: "ev_2022", tanggal: null, presisi: "hari", judul: "Perpres 112/2022: harga patokan tertinggi pembelian listrik EBT", teks: "Pembelian lewat pemilihan langsung atau penunjukan langsung; harga patokan tertinggi (koefisien x faktor lokasi) atau harga kesepakatan yang disetujui Menteri.", regulasi_id: "perpres-112-2022", sumber_id: "s-iesr21", tingkat_bukti: "resmi" },
  { id: "ev_2025_permen5", tanggal: "2025-03", presisi: "bulan", judul: "Permen ESDM 5/2025: pedoman PJBL pembangkit EBT", teks: "Menurut Listrik Indonesia, PLN menargetkan RFP 4,1 GW pada 2025 (1,5 GW pada 2024); batas 180 hari untuk pemilihan langsung dan 90 hari untuk penunjukan langsung dikutip dari satu sumber dan perlu dicek ke teks Permen.", regulasi_id: "permen-esdm-5-2025", sumber_id: "s-listrik-permen5", tingkat_bukti: "media" },
  { id: "ev_2025_18gw", tanggal: "2025-04", presisi: "bulan", judul: "PLN: 18 GW EBT dalam proses pengadaan (86 persen dari target RUPTL 2021-2030)", teks: "Dari target 20,9 GW: beroperasi 1,6 GW, konstruksi 3,3 GW, pengadaan 8,5 GW, pendanaan 4,7 GW, perencanaan 2,8 GW.", regulasi_id: null, sumber_id: "s-cnbc-18gw", tingkat_bukti: "media" },
];
