#!/usr/bin/env node
// Sampah jadi energi ujung ke ujung -> public/data/sampah_energi.json.
// Berkas ini MERUJUK data yang sudah ada lewat id: psel.json (23 proyek PSEL, tarif regulasi), global/pemasok_wte.json (29 pemasok, 10 negara),
// proyek_terpadu.json (koordinat), regulasi.json, isu.json, organisasi.json, berita.json; sumber dipinjam dari topik/sampah_energi.json (id sama).
// Data baru hanya butir yang dibaca dari sumber publik tanggal T (tiap butir bersumber + bertingkat bukti); yang tidak ditemukan ditulis di `celah`.
// TIDAK mengarang. Panen mentah (bila perlu) memakai scripts/pipa/_panen_sopan.mjs (UA sopan, robots, jeda >= 2 dtk, stop 403/429). Tanpa foto Antara, tanpa data pribadi.
// Pakai: --bangun | --selftest | --cek-url | --kamus (menambah kunci swe.* ke id.json dan en.json tanpa menyentuh kunci lain)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const T = '2026-11-08';
const S = (id, judul, penerbit, url, tahun, tb = 'media') => ({ id, judul, penerbit, url, tahun, tingkat_bukti: tb, tanggal_periksa: T });
const L = (id, en) => ({ id, en });
export const BUKTI_SAH = ['resmi', 'media', 'kajian', 'via-pihak-ketiga', 'editorial'];

/** Sumber yang dipinjam dari topik/sampah_energi.json (id sama). */
const PINJAM = ['ashurst', 'metro109', 'subs', 'empat', 'tgr', 'bogor', 'bali', 'bekasi', 'tahap2', 'teknologi', 'kisi', 'tenggara', 'apsn', 'sgnea', 'wekdm', 'ombud', 'katmang', 'ruptl', 'kap', 'uu18', 'iea_wte', 'jm_psel'];

export const SUMBER_BARU = [
  S('klh-rakornas', 'KLH/BPLH: arah baru menuju Indonesia bebas sampah 2029, Rakornas Pengelolaan Sampah 2025 (timbulan 2023 56,63 juta ton; 39,01 persen terkelola; 343 dari 550 TPA open dumping; revisi Perpres 35/2018)', 'Kementerian Lingkungan Hidup', 'https://www.kemenlh.go.id/news/detail/klh-bplh-tegaskan-arah-baru-menuju-indonesia-bebas-sampah-2029-dalam-rakornas-pengelolaan-sampah-2025', 2025, 'resmi'),
  S('detik-33', 'Danantara investasi proyek sulap sampah jadi listrik di 33 kota Rp91 T', 'detikFinance', 'https://finance.detik.com/energi/d-8154315/danantara-investasi-proyek-sulap-sampah-jadi-listrik-di-33-kota-rp-91-t', 2025),
  S('bisnis-10kota', 'Danantara rilis proyek energi sampah awal November 2025 di 10 kota', 'Bisnis.com', 'https://market.bisnis.com/read/20251010/192/1919167/danantara-rilis-proyek-energi-sampah-awal-november-2025-di-10-kota', 2025),
  S('bisnis-asing', 'Asing dominasi tender proyek energi sampah, Danantara buka suara (3 November 2025; hanya judul dibaca)', 'Bisnis.com', 'https://market.bisnis.com/read/20251103/192/1925761/asing-dominasi-tender-proyek-energi-sampah-danantara-buka-suara', 2025, 'via-pihak-ketiga'),
  S('katadata-85', '85 perusahaan ikut tender WtE Danantara gelombang II, ada dari Jepang dan Eropa (29 Mei 2026)', 'Katadata', 'https://katadata.co.id/finansial/bursa/6a18d90294434/85-perusahaan-ikut-tender-wte-danantara-gelombang-ii-ada-dari-jepang-dan-eropa', 2026),
  S('kabar-18t', 'Danantara kucurkan Rp18 triliun PSEL tahap II garap 8 lokasi (hanya judul dibaca)', 'KabarBursa', 'https://www.kabarbursa.com/makro/danantara-kucurkan-rp18-triliun-psel-tahap-ii-garap-8-lokasi', 2026, 'via-pihak-ketiga'),
  S('kabar-6mitra', 'Danantara bidik enam mitra PSEL lagi, investasi tahap II capai USD1 miliar (hanya judul dibaca)', 'KabarBursa', 'https://www.kabarbursa.com/makro/danantara-bidik-enam-mitra-psel-lagi-investasi-tahap-ii-capai-usd1-miliar', 2026, 'via-pihak-ketiga'),
  S('it-5groundbreaking', 'Pemerintah groundbreaking 5 proyek PSEL Juni 2026, olah 7.000 ton limbah per hari jadi listrik', 'Investor Trust', 'https://investortrust.id/esg/101002/pemerintah-groundbreaking-5-proyek-psel-juni-2026-olah-7000-ton-limbah-per-hari-jadi-listrik', 2026),
  S('mongabay-rdf-cilacap', 'Pertama di Indonesia, sampah RDF jadi pengganti batu bara (RDF Plant Jeruklegi, Cilacap; 120 ton per hari)', 'Mongabay Indonesia', 'https://mongabay.co.id/2020/07/27/pertama-di-indonesia-sampah-rdf-jadi-pengganti-batu-bara/', 2020),
  S('detik-cilacap', 'Proyek TPST canggih di Cilacap nilainya Rp84 M, ada sumbangan Denmark Rp44 M', 'detikFinance', 'https://finance.detik.com/infrastruktur/d-7120608/proyek-tpst-canggih-di-cilacap-nilainya-rp-84-m-ada-sumbangan-denmark-rp-44-m', 2023),
  S('industry-cilacap', 'Kementerian PUPR bangun tempat pengolahan sampah RDF di Kabupaten Cilacap (judul dibaca; kapasitas mesin 200 ton per hari menurut ringkasan pencarian)', 'Industry.co.id', 'https://www.industry.co.id/read/51362/kementerian-pupr-bangun-tempat-pengolahan-sampah-rdf-di-kabupaten-cilacap', 2023, 'via-pihak-ketiga'),
  S('kompas-sbi-rdf', 'SBI beli refused derived fuel, sampah kota yang diolah jadi bahan bakar', 'Kompas.com Lestari', 'https://lestari.kompas.com/read/2023/06/28/150358986/sbi-beli-refused-derived-fuel-sampah-kota-yang-diolah-jadi-bahan-bakar', 2023),
  S('idx-rorotan', 'Siap beroperasi, RDF Plant Rorotan mampu kelola 2.500 ton sampah Jakarta', 'IDX Channel', 'https://www.idxchannel.com/news/siap-beroperasi-rdf-plant-rorotan-mampu-kelola-2500-ton-sampah-jakarta/all', 2025),
  S('metro-rorotan', 'Timbulkan bau, kapasitas sampah uji coba RDF Rorotan bakal dikurangi', 'Metro TV News', 'https://www.metrotvnews.com/read/NnjCeG2y-timbulkan-bau-kapasitas-sampah-uji-coba-rdf-rorotan-bakal-dikurangi', 2025),
  S('katadata-rorotan', 'Warga keluhkan bau busuk dari pengolahan sampah RDF Rorotan Jakarta', 'Katadata', 'https://katadata.co.id/amp/ekonomi-hijau/ekonomi-sirkular/67d8e5863c416/warga-keluhkan-bau-busuk-dari-pengolahan-sampah-rdf-rorotan-jakarta/', 2025),
  S('mongabay-rorotan', 'Warga protes polusi pembangkit listrik sampah Rorotan', 'Mongabay Indonesia', 'https://mongabay.co.id/2025/04/06/warga-protes-polusi-pembangkit-listrik-sampah-rorotan/', 2025),
  S('esdm-lfg', 'Jurnal Swara Patra (PPSDM Migas, ESDM): gas metana TPA Bantargebang sekitar 3 MW dari rencana sekitar 26 MW; tiga mesin gas masing-masing 1 MW; PLN membeli Rp850 per kWh', 'PPSDM Migas, Kementerian ESDM', 'https://ejurnal.ppsdmmigas.esdm.go.id/sp/index.php/swarapatra/article/download/123/109/120', 2023, 'kajian'),
  S('idx-metana', 'TPST Bantargebang disebut penyumbang metana terbesar kedua, Pemprov DKI siapkan skema pengolahan', 'IDX Channel', 'https://www.idxchannel.com/news/tpst-bantargebang-disebut-penyumbang-metana-terbesar-kedua-pemprov-dki-siapkan-skema-pengolahan/all', 2026),
  S('katadata-bantar', 'Masa depan Bantargebang di tengah proyek energi dan bom waktu gas metana (judul dibaca)', 'Katadata', 'https://katadata.co.id/indepth/telaah/6a0efa5c9254f/masa-depan-bantargebang-di-tengah-proyek-energi-dan-bom-waktu-gas-metana', 2026, 'via-pihak-ketiga'),
  S('p70-2016', 'Permen LHK P.70/MENLHK/SETJEN/KUM.1/8/2016 tentang baku mutu emisi usaha dan/atau kegiatan pengolahan sampah secara termal (BN 2016 No. 1311)', 'Kementerian LHK via peraturan.go.id', 'https://peraturan.go.id/files/bn1311-2016.pdf', 2016, 'resmi'),
  S('p26-2020', 'Permen LHK P.26/MENLHK/SETJEN/KUM.1/12/2020 tentang penanganan abu dasar dan abu terbang (insinerasi)', 'BPK JDIH', 'https://peraturan.bpk.go.id/Download/156198/Permen%20LHK%20Nomor%2026%20Tahun%202020.pdf', 2020, 'resmi'),
  S('mongabay-makassar', 'Mengapa warga Makassar tolak pembangkit listrik sampah (22 Januari 2026)', 'Mongabay Indonesia', 'https://mongabay.co.id/2026/01/22/mengapa-warga-makassar-tolak-pembangkit-listrik-sampah/', 2026),
  S('nu-makassar', 'Warga Makassar desak pemerintah batalkan PSEL (judul dibaca)', 'NU Online', 'https://nu.or.id/daerah/warga-makassar-desak-pemerintah-batalkan-psel-jangan-tukar-kesehatan-kami-dengan-proyek-berisiko-tinggi-hEKDo', 2026, 'via-pihak-ketiga'),
  S('antara-bali-tolak', 'Wagub Giri Prasta respons warga Bali yang tolak PSEL: ini aman (warga Pesanggaran, 18 Mei 2026)', 'ANTARA Bali (teks dibaca; tanpa foto)', 'https://bali.antaranews.com/berita/405915/wagub-giri-prasta-respons-warga-bali-yang-tolak-psel-ini-aman', 2026),
  S('mongabay-risiko', 'Para pihak ingatkan risiko proyek energi sampah pemerintah (29 April 2026; Walhi, Greenpeace, AZWI, Nexus3)', 'Mongabay Indonesia', 'https://mongabay.co.id/2026/04/29/para-pihak-ingatkan-risiko-proyek-energi-sampah-pemerintah/', 2026),
  S('ibp-walhi', 'WALHI rejects government push for waste-to-energy projects, calls it a policy failure (judul dibaca)', 'Indonesia Business Post', 'https://indonesiabusinesspost.com/5928/society-environment-and-culture/walhi-rejects-government-push-for-waste-to-energy-projects-calls-it-a-policy-failure', 2026, 'via-pihak-ketiga'),
];

function sumberGabung() {
  const tp = j('public/data/topik/sampah_energi.json').sumber, out = [];
  for (const id of PINJAM) {
    const s = tp[id]; if (!s) throw new Error('sumber topik tidak ada: ' + id);
    if (!s.url) continue; // sumber editorial tanpa URL tidak dipinjam
    out.push({ id, judul: s.judul, penerbit: s.penerbit, url: s.url, tahun: s.tahun, tingkat_bukti: s.bukti === 'editorial' ? 'editorial' : (BUKTI_SAH.includes(s.bukti) ? s.bukti : 'media'), tanggal_periksa: s.tanggal || T });
  }
  return out.concat(SUMBER_BARU);
}

export function bangun() {
  const psel = j('public/data/psel.json');
  const isu = j('public/data/isu.json').baris.filter((b) => b.id.startsWith('psel-')).map((b) => b.id);
  const sumber = sumberGabung();
  return {
    lapis: 'publik', dibangun_pada: T, tanggal: T,
    keterangan: 'Sampah jadi energi ujung ke ujung. Rujukan lewat id ke psel.json, global/pemasok_wte.json, proyek_terpadu.json, regulasi.json, isu.json, organisasi.json; butir baru bersumber dan bertingkat bukti; yang tidak ditemukan ada di celah.',
    sumber,
    rujukan: {
      psel_ids: psel.baris.map((b) => b.id),
      proyek_ids: psel.baris.map((b) => b.proyek_id),
      regulasi_ids: ['perpres-109-2025', 'perpres-35-2018', 'perpres-18-2016'],
      isu_ids: isu,
      pemasok_wte_berkas: 'global/pemasok_wte.json',
      status_urut: ['beroperasi', 'konstruksi', 'rencana', 'tidak-diketahui'],
    },
    timbulan: {
      timbulan: { nilai: 56.63, satuan: L('juta ton per tahun', 'million tonnes a year'), tahun: 2023, sumber_id: 'klh-rakornas', tingkat_bukti: 'resmi', ket: L('Timbulan sampah nasional 2023 menurut KLH/BPLH (SIPSN).', 'National waste generation in 2023 per the Environment Ministry (SIPSN).') },
      terkelola: { nilai: 22.09, persen: 39.01, satuan: L('juta ton per tahun', 'million tonnes a year'), tahun: 2023, sumber_id: 'klh-rakornas', tingkat_bukti: 'resmi', ket: L('Sampah terkelola secara layak.', 'Waste managed properly.') },
      tpa: { open_dumping: 343, total: 550, sumber_id: 'klh-rakornas', tingkat_bukti: 'resmi', ket: L('TPA open dumping yang diawasi untuk dihentikan, dari 550 TPA.', 'Open-dumping landfills being supervised toward closure, out of 550 landfills.') },
      target: { tahun: 2029, persen: 100, sumber_id: 'klh-rakornas', tingkat_bukti: 'resmi', ket: L('Target pengelolaan sampah 100 persen pada 2029; UU 18/2008 sudah melarang open dumping.', 'Target of 100 percent waste management by 2029; Law 18/2008 already bans open dumping.') },
      revisi: { teks: L('KLH/BPLH menyatakan sedang merevisi Perpres 35/2018 untuk mempercepat PSEL (dana APBN, perizinan, jaminan pembelian listrik); revisi itu kini menjadi Perpres 109/2025.', 'The ministry said it was revising Perpres 35/2018 to speed up PSEL (state budget funds, licensing, power purchase guarantee); that revision is now Perpres 109/2025.'), sumber_id: 'klh-rakornas', tingkat_bukti: 'resmi' },
      catatan_beda: L('Pemberitaan angka 2024 berbeda: sekitar 32,6 sampai 34,2 juta ton dari 301 sampai 318 kabupaten/kota (cakupan lebih sempit dari angka 2023). Halaman memakai satu angka resmi 2023 dan tidak mencampur cakupan.', 'Press figures for 2024 differ: about 32.6 to 34.2 million tonnes from 301 to 318 regencies/cities (narrower coverage than the 2023 figure). The page uses one official 2023 figure and does not mix coverage.'),
    },
    jalur: {
      jenis: [
        { k: 'psel', ikon: 'petir', teks: L('PSEL (PLTSa): sampah kota dibakar (insinerasi) atau digasifikasi untuk uap dan listrik; skala program baru minimal 1.000 ton per hari per fasilitas. Insinerasi dapat mengurangi volume hingga 90 persen tetapi menyisakan abu.', 'PSEL (WtE plant): city waste is burned (incineration) or gasified for steam and power; the new programme needs at least 1,000 tonnes a day per facility. Incineration can cut volume by up to 90 percent but leaves ash.'), sumber_id: 'sgnea', tingkat_bukti: 'resmi' },
        { k: 'rdf', ikon: 'pabrik', teks: L('RDF/SRF: sampah dipilah dan dikeringkan menjadi bahan bakar padat pengganti batu bara, terutama untuk kiln pabrik semen; listrik bukan produk utamanya.', 'RDF/SRF: waste is sorted and dried into a solid fuel replacing coal, mainly for cement kilns; electricity is not the main product.'), sumber_id: 'mongabay-rdf-cilacap', tingkat_bukti: 'media' },
        { k: 'biogas', ikon: 'tek-bio', teks: L('Biogas TPA (gas metana landfill) dan biodigester: gas dari timbunan sampah organik menggerakkan mesin gas. Di Bantargebang keluaran nyata jauh di bawah rencana.', 'Landfill biogas (methane) and biodigesters: gas from organic waste piles drives gas engines. At Bantargebang actual output is far below plan.'), sumber_id: 'esdm-lfg', tingkat_bukti: 'kajian' },
        { k: 'insinerator', ikon: 'peringatan', teks: L('Insinerator termal (termasuk skala kecil): wajib memenuhi baku mutu emisi Permen LHK P.70/2016; hanya sampah rumah tangga tanpa B3, PVC, kaca, atau aluminium foil; abu diatur P.26/2020. Pegiat lingkungan menilai pengawasan belum siap.', 'Thermal incinerators (including small ones): must meet emission standards under MoEF Reg. P.70/2016; only household waste without hazardous waste, PVC, glass or aluminium foil; ash is governed by P.26/2020. Environmental groups say oversight is not ready.'), sumber_id: 'p70-2016', tingkat_bukti: 'resmi', sumber_id2: 'p26-2020' },
      ],
      fasilitas: [
        { k: 'rdf', nama: 'RDF Plant Jeruklegi (TPST Cilacap)', lokasi: 'Desa Tritih Lor, Jeruklegi, Cilacap, Jawa Tengah', kapasitas_ton_hari: [120, 160, 200], kapasitas_ket: L('Rancangan awal 120 ton per hari (pengolahan mekanis-biologis); angka lain 160 dan 200 ton per hari muncul di sumber berbeda dan tidak disatukan.', 'Initial design 120 tonnes a day (mechanical-biological treatment); other figures of 160 and 200 tonnes a day appear in different sources and are not merged.'), produk: L('RDF untuk kiln semen PT Solusi Bangun Indonesia (SBI)', 'RDF for the cement kilns of PT Solusi Bangun Indonesia (SBI)'), nilai: L('Rp84 miliar, termasuk hibah Denmark Rp44 miliar (laporan 2023)', 'IDR 84 billion, including a Danish grant of IDR 44 billion (2023 report)'), sumber_ids: ['mongabay-rdf-cilacap', 'detik-cilacap', 'industry-cilacap', 'kompas-sbi-rdf'], tingkat_bukti: 'media', status: 'beroperasi' },
        { k: 'rdf', nama: 'RDF Plant Rorotan (Jakarta Utara)', lokasi: 'Rorotan, Jakarta Utara, DKI Jakarta', kapasitas_ton_hari: [2500], kapasitas_ket: L('Rancangan 2.500 ton per hari; kapasitas uji coba dikurangi karena keluhan bau warga. Kapasitas efektif per tanggal tidak disatukan.', 'Design 2,500 tonnes a day; trial capacity was cut after residents complained of odour. Effective capacity by date is not merged.'), produk: L('RDF untuk pembeli industri (pembeli belum bersumber)', 'RDF for industrial buyers (buyer not sourced)'), nilai: null, sumber_ids: ['idx-rorotan', 'metro-rorotan', 'katadata-rorotan'], tingkat_bukti: 'via-pihak-ketiga', status: 'konstruksi' },
        { k: 'biogas', nama: 'Gas metana TPST Bantargebang', lokasi: 'Bantargebang, Bekasi, Jawa Barat', kapasitas_ton_hari: [], kapasitas_ket: L('Sekitar 3 MW terpasang dari tiga mesin gas 1 MW, dari rencana sekitar 26 MW (kajian 2023).', 'About 3 MW from three 1 MW gas engines, against a plan of about 26 MW (2023 study).'), produk: L('Listrik dijual ke PLN Rp850 per kWh', 'Electricity sold to PLN at IDR 850 per kWh'), nilai: null, sumber_ids: ['esdm-lfg', 'idx-metana', 'katadata-bantar'], tingkat_bukti: 'kajian', status: 'beroperasi' },
      ],
    },
    program: {
      ringkas: { kota: 33, investasi_triliun: 91, ket: L('Program Danantara disebut mencakup 33 kota dengan perkiraan investasi sekitar Rp91 triliun (pemberitaan, bukan nilai kontrak).', 'The Danantara programme is said to cover 33 cities with estimated investment of about IDR 91 trillion (press reports, not contract value).'), sumber_id: 'detik-33', tingkat_bukti: 'media', sumber_id2: 'kisi' },
      tahap: [
        { k: 't1', teks: L('Tahap I: tender dibuka untuk tujuh kota pada November 2025, tetapi pada 19 November 2025 baru empat kota siap. Groundbreaking: Denpasar Raya (8 Juli 2026), Kota Bekasi (26 Agustus 2026), Bogor Raya 1 (17 September 2026).', 'Phase I: the tender opened for seven cities in November 2025, but on 19 November 2025 only four were ready. Groundbreakings: Greater Denpasar (8 July 2026), Bekasi City (26 August 2026), Greater Bogor 1 (17 September 2026).'), sumber_id: 'empat', tingkat_bukti: 'media', sumber_id2: 'bali' },
        { k: 'dpt', teks: L('Daftar penyedia terseleksi gelombang II: 85 entitas lolos, berasal dari tujuh negara (Indonesia, China, Jepang, Prancis, India, Korea Selatan, Singapura); nama per negara tidak dipetakan sumber.', 'Phase II shortlist: 85 entities qualified, from seven countries (Indonesia, China, Japan, France, India, South Korea, Singapore); the source does not map names to countries.'), sumber_id: 'katadata-85', tingkat_bukti: 'media', sumber_id2: 'tahap2' },
        { k: 't2', teks: L('Tahap II: delapan konsorsium ditetapkan pada 21 Juli 2026 untuk delapan lokasi di 20 kabupaten/kota; nilai disebut sekitar Rp18 triliun, dan Danantara masih mencari enam mitra lagi.', 'Phase II: eight consortia were named on 21 July 2026 for eight locations covering 20 regencies/cities; the value is said to be about IDR 18 trillion, and Danantara is still seeking six more partners.'), sumber_id: 'tahap2', tingkat_bukti: 'media', sumber_id2: 'kabar-18t' },
        { k: 'lima', teks: L('Target lima groundbreaking pada Juni 2026 (Kota Bekasi, Bogor Raya, Bandung Raya, Denpasar Raya, Yogyakarta) dengan total sekitar 7.000 ton sampah per hari.', 'Target of five groundbreakings in June 2026 (Bekasi City, Greater Bogor, Greater Bandung, Greater Denpasar, Yogyakarta) with about 7,000 tonnes of waste a day in total.'), sumber_id: 'it-5groundbreaking', tingkat_bukti: 'media' },
      ],
      konsorsium: [
        { psel_id: 'psel_pjb_003', nama: 'Nusantara Energi Hijau Consortium', anggota: 'BGE Sentosa Utama' },
        { psel_id: 'psel_pjb_004', nama: 'Consortium Everbright Cemerlang Energy', anggota: 'Everbright Harmoni' },
        { psel_id: 'psel_pjb_005', nama: 'Bumi Biru Indonesia', anggota: 'SUS Indoplas' },
        { psel_id: 'psel_pjb_006', nama: 'Masa Depan Energi Indonesia', anggota: 'Chandra Waste Energy, BGE' },
        { psel_id: 'psel_pj_0047', nama: 'Veolia Environmental Services Asia Pte. Ltd.', anggota: 'Veolia' },
        { psel_id: 'psel_pjb_007', nama: 'Consortium Mentari Citra Lestari', anggota: 'Bakrie Power, SUS' },
        { psel_id: 'psel_pjb_008', nama: 'MPM-CEVIA Consortium', anggota: 'Mega Power, CEVIA' },
        { psel_id: 'psel_pjb_002', nama: 'Cakra Energi Lestari Consortium', anggota: 'Pertamina NRE, Tianjin CITICC' },
      ].map((k) => ({ ...k, sumber_id: 'tahap2', tingkat_bukti: 'media' })),
    },
    aturan: {
      butir: [
        { k: 'harga', teks: L('Harga beli PLN tetap USD 0,20 per kWh untuk semua kapasitas selama 30 tahun tanpa eskalasi (hanya pembangkitan); kompensasi negara untuk PLN.', 'PLN purchase price fixed at USD 0.20 per kWh for all capacities over 30 years without escalation (generation only); state compensation to PLN.'), sumber_id: 'ashurst', tingkat_bukti: 'kajian', sumber_id2: 'subs' },
        { k: 'pasokan', teks: L('Pemda menyalurkan sampah paling sedikit 1.000 ton per hari selama masa operasi (Pasal 4 ayat 1 huruf a).', 'Local governments must deliver at least 1,000 tonnes a day throughout operation (Article 4(1)(a)).'), sumber_id: 'metro109', tingkat_bukti: 'media' },
        { k: 'izin', teks: L('Persetujuan AMDAL otomatis dalam dua bulan; PLN wajib menandatangani PPA dalam 10 hari kerja setelah izin prakonstruksi.', 'Automatic AMDAL approval within two months; PLN must sign the PPA within 10 working days after pre-construction licences.'), sumber_id: 'ashurst', tingkat_bukti: 'kajian' },
        { k: 'turunan', teks: L('Aturan turunan untuk teknologi di luar PSEL dan rincian kompensasi PLN belum ditetapkan; Perpres memuat 8 bab dan 33 pasal.', 'Implementing rules for technologies beyond PSEL and for PLN compensation details are not yet set; the Perpres has 8 chapters and 33 articles.'), sumber_id: 'ashurst', tingkat_bukti: 'kajian', sumber_id2: 'metro109' },
        { k: 'emisi', teks: L('Pengolahan termal tunduk pada baku mutu emisi P.70/2016 dan penanganan abu P.26/2020; angka batas per parameter ada di lampiran dan tidak ditranskripsi di sini.', 'Thermal treatment is subject to emission standards in P.70/2016 and ash handling in P.26/2020; limit values per parameter are in the annex and not transcribed here.'), sumber_id: 'p70-2016', tingkat_bukti: 'resmi', sumber_id2: 'p26-2020' },
      ],
      tarif_35: L('Perpres 35/2018 (dicabut): USD 13,35 sen per kWh sampai 20 MW; di atas itu 14,54 dikurangi 0,076 kali MW. Ombudsman menilai harga ini terlalu rendah sehingga banyak proyek mangkrak.', 'Perpres 35/2018 (revoked): USD 13.35 cents per kWh up to 20 MW; above that 14.54 minus 0.076 times MW. The Ombudsman judged the price too low, leaving many projects stalled.'),
    },
    tarif: {
      contoh: { psel_id: 'psel_pj_0043', faktor_kapasitas: 85, harga_usd_sen: 20, sumber_id: 'ashurst', ket: L('Faktor kapasitas 85% adalah Hipotesis METI untuk contoh hitung; harga 20 sen dari Perpres 109/2025.', 'The 85% capacity factor is a METI Hypothesis for the worked example; the 20-cent price comes from Perpres 109/2025.') },
      tipping_fee: { teks: L('Perpres 109/2025 menghapus tipping fee yang dulu ditanggung APBD; pemerintah menilai beban daerah diganti kompensasi/subsidi untuk PLN. Kompensasi itu belum rinci dan dikhawatirkan menjadi beban fiskal dan tarif.', 'Perpres 109/2025 removes the tipping fee formerly borne by regional budgets; the government says the regional burden is replaced by compensation/subsidy for PLN. That compensation is not detailed and may become a fiscal and tariff burden.'), sumber_id: 'subs', tingkat_bukti: 'media', sumber_id2: 'ashurst' },
      investasi: [
        { k: 'program', label: L('Program 33 kota', '33-city programme'), nilai: L('sekitar Rp91 triliun', 'about IDR 91 trillion'), sumber_id: 'kisi' },
        { k: 'tahap2', label: L('Tahap II, 8 lokasi', 'Phase II, 8 locations'), nilai: L('sekitar Rp18 triliun (USD 1 miliar menurut judul lain)', 'about IDR 18 trillion (USD 1 billion per another headline)'), sumber_id: 'kabar-18t' },
        { k: 'bali', label: L('PSEL Denpasar Raya', 'Greater Denpasar PSEL'), nilai: L('Rp3 triliun', 'IDR 3 trillion'), sumber_id: 'bali' },
        { k: 'bekasi', label: L('PSEL Kota Bekasi', 'Bekasi City PSEL'), nilai: L('Rp3 triliun', 'IDR 3 trillion'), sumber_id: 'bekasi' },
        { k: 'sunter', label: L('Sunter (proyek lama)', 'Sunter (old project)'), nilai: L('Rp5,2 triliun', 'IDR 5.2 trillion'), sumber_id: 'ombud' },
      ].map((x) => ({ ...x, tingkat_bukti: 'media' })),
    },
    pemasok: {
      butir: [
        { k: 'china', teks: L('Danantara menyatakan proyek barunya memakai teknologi yang lebih canggih daripada yang dipakai di Tiongkok; pemberitaan tender menyebut peserta asing dominan.', 'Danantara says its new projects use technology more advanced than that used in China; tender reports say foreign bidders dominate.'), sumber_id: 'teknologi', tingkat_bukti: 'media', sumber_id2: 'bisnis-asing' },
        { k: 'dpt', teks: L('Peserta tender gelombang II berasal dari tujuh negara; pemetaan nama ke negara tidak disediakan sumber.', 'Phase II bidders come from seven countries; the source gives no name-to-country mapping.'), sumber_id: 'katadata-85', tingkat_bukti: 'media' },
      ],
    },
    penolakan: {
      butir: [
        { k: 'makassar', lokasi: 'Kelurahan Bira, Tamalanrea, Makassar', tanggal: '2026-01-22', status: 'aktif',
          pihak: L('Warga dan WALHI Sulsel', 'Residents and WALHI South Sulawesi'),
          klaim: L('Khawatir dioksin dan furan, abu berlogam berat, ISPA, dan banjir; lokasi berbatasan dengan permukiman dan sekolah; Amdal dinilai tidak partisipatif. Pengembang disebut PT Sarana Utama Synergy.', 'Concerns over dioxins and furans, heavy-metal ash, respiratory illness and flooding; the site borders housing and a school; the Amdal is called non-participatory. The developer is named as PT Sarana Utama Synergy.'),
          sumber_id: 'mongabay-makassar', tingkat_bukti: 'media', sumber_id2: 'nu-makassar' },
        { k: 'bali', lokasi: 'Pesanggaran, Denpasar, Bali', tanggal: '2026-05-18', status: 'aktif',
          pihak: L('Warga Pesanggaran', 'Pesanggaran residents'),
          klaim: L('Menolak PSEL di kawasan Pelindo dan meminta pengolahan dilakukan di TPA Suwung. Wakil Gubernur Bali menyatakan teknologi aman dan pembatalan tidak lagi mungkin karena perjanjian kerja sama lahan sudah diputuskan (klaim pemerintah).', 'Reject a PSEL in the Pelindo area and ask for processing at Suwung landfill. Bali\'s Deputy Governor says the technology is safe and cancellation is no longer possible because the land agreement is settled (government claim).'),
          sumber_id: 'antara-bali-tolak', tingkat_bukti: 'media' },
        { k: 'rorotan', lokasi: 'Rorotan, Jakarta Utara', tanggal: '2025-04-06', status: 'aktif',
          pihak: L('Warga sekitar RDF Plant Rorotan', 'Residents near the Rorotan RDF plant'),
          klaim: L('Mengeluhkan bau busuk dan polusi sejak masa uji coba; kapasitas uji coba dikurangi. Ini fasilitas RDF, bukan PSEL pembakar.', 'Complain of foul odour and pollution since the trial run; trial capacity was cut. This is an RDF facility, not an incinerating PSEL.'),
          sumber_id: 'mongabay-rorotan', tingkat_bukti: 'media', sumber_id2: 'katadata-rorotan' },
        { k: 'nasional', lokasi: 'Nasional', tanggal: '2026-04-29', status: 'aktif',
          pihak: L('WALHI, Greenpeace Indonesia, AZWI, Nexus3 Foundation', 'WALHI, Greenpeace Indonesia, AZWI, Nexus3 Foundation'),
          klaim: L('Pembakaran dapat membentuk dioksin dan furan; insinerasi dinilai tidak cocok untuk sampah organik basah; studi Nexus3 menemukan POPs pada abu insinerator; pengawasan dan infrastruktur limbah B3 dinilai belum siap. Mereka mengusulkan peninjauan ulang kebijakan PSEL dan penguatan pemilahan dari hulu.', 'Burning can form dioxins and furans; incineration is judged unsuited to wet organic waste; a Nexus3 study found POPs in incinerator ash; oversight and hazardous-waste infrastructure are judged not ready. They propose reviewing PSEL policy and strengthening source separation.'),
          sumber_id: 'mongabay-risiko', tingkat_bukti: 'media', sumber_id2: 'ibp-walhi' },
      ],
    },
    celah: [
      'Daftar lengkap 33 kota program Danantara tidak ditemukan dalam sumber yang boleh dibaca; basis memuat 23 proyek PSEL (psel.json), sisanya dibiarkan kosong.',
      'Status Yogyakarta berbeda antar sumber (pemenang tahap I menurut sebagian ringkasan, konsorsium tahap II menurut pemberitaan 21 Juli 2026); halaman mengikuti psel.json.',
      'Tipping fee per ton dan harga PPA per proyek belum ada di sumber terbuka; yang tampil hanya tarif regulasi Perpres.',
      'Komposisi sampah, nilai kalor, dan kadar air per kota belum tersedia; angka ini menentukan kecocokan teknologi.',
      'Biaya bangun PSEL per kapasitas tidak ada di biaya_bangun.json; hitungan Rp per ton per hari memakai nilai investasi pemberitaan dan berlabel EST.',
      'Alur impor komponen (grate, boiler, FGT, turbin) dan peran pemasok per konsorsium tahap II belum terverifikasi; negara pemasok mengikuti pemasok_wte.json.',
      'Angka timbulan 2024 berbeda antar pemberitaan (32,6 sampai 34,2 juta ton); angka resmi yang dipakai adalah 2023.',
      'Kapasitas efektif RDF Rorotan berubah-ubah menurut tanggal laporan; hanya rancangan dan fakta pembatasan yang dicatat.',
      'Data pemulung terdampak, uji emisi cerobong, dan pemantauan dioksin proyek berjalan belum ditemukan.',
    ],
  };
}

/** Pemeriksa: id rujukan hidup di berkas aslinya, sumber unik, bukti dikenal, URL https. */
export function periksa(d) {
  const ids = (rel, f = (x) => x.baris) => new Set(f(j(rel)).map((x) => x.id));
  const psel = ids('public/data/psel.json'), isu = ids('public/data/isu.json'), reg = ids('public/data/regulasi.json'), pt = ids('public/data/proyek_terpadu.json');
  const must = (set, arr, nama) => { for (const i of arr) if (!set.has(i)) throw new Error(`${nama} tidak ada: ${i}`); };
  must(psel, d.rujukan.psel_ids, 'psel'); must(isu, d.rujukan.isu_ids, 'isu'); must(reg, d.rujukan.regulasi_ids, 'regulasi'); must(pt, d.rujukan.proyek_ids, 'proyek');
  must(psel, d.program.konsorsium.map((k) => k.psel_id), 'konsorsium'); must(psel, [d.tarif.contoh.psel_id], 'contoh');
  const sid = new Set(d.sumber.map((s) => s.id));
  if (sid.size !== d.sumber.length) throw new Error('id sumber ganda');
  for (const s of d.sumber) {
    if (!/^https:\/\//.test(s.url)) throw new Error('url ' + s.id);
    if (!BUKTI_SAH.includes(s.tingkat_bukti)) throw new Error('bukti ' + s.id);
    if (/antaranews\.com\/(foto|photo)/.test(s.url)) throw new Error('foto Antara dilarang ' + s.id);
  }
  const T2 = d.timbulan, pakai = [T2.timbulan, T2.terkelola, T2.tpa, T2.target, T2.revisi, ...d.jalur.jenis, ...d.jalur.fasilitas, d.program.ringkas, ...d.program.tahap, ...d.program.konsorsium, ...d.aturan.butir, d.tarif.contoh, d.tarif.tipping_fee, ...d.tarif.investasi, ...d.pemasok.butir, ...d.penolakan.butir];
  for (const x of pakai) for (const k of ['sumber_id', 'sumber_id2']) if (x[k] && !sid.has(x[k])) throw new Error('sumber_id tak dikenal: ' + x[k]);
  for (const f of d.jalur.fasilitas) for (const i of f.sumber_ids) if (!sid.has(i)) throw new Error('sumber fasilitas: ' + i);
  for (const x of pakai) if (x.tingkat_bukti && !BUKTI_SAH.includes(x.tingkat_bukti)) throw new Error('tingkat butir ' + JSON.stringify(x).slice(0, 60));
  if (d.program.konsorsium.length !== 8) throw new Error('konsorsium tahap II harus 8');
  if (d.penolakan.butir.length < 3) throw new Error('penolakan terlalu sedikit');
  return { sumber: d.sumber.length, psel: d.rujukan.psel_ids.length, konsorsium: d.program.konsorsium.length, isu: d.rujukan.isu_ids.length, celah: d.celah.length };
}

async function cekUrl() {
  const { ambil } = await import('../pipa/_panen_sopan.mjs');
  for (const s of sumberGabung().filter((x) => x.url.startsWith('https://'))) { try { await ambil(s.url, { method: 'HEAD' }); console.log('OK ', s.id); } catch (e) { console.log('GAGAL', s.id, e.message); if (/403|429/.test(e.message)) break; } }
}

/** Tambah kunci swe.* ke id.json dan en.json (sisip teks sebelum '}' penutup; kunci lain tak disentuh; baca-ulang tepat sebelum tulis). */
async function kamus() {
  const { KAMUS } = await import('./sampah_energi_kamus.mjs');
  for (const bhs of ['id', 'en']) {
    const f = path.join(ROOT, `public/i18n/${bhs}.json`), s = fs.readFileSync(f, 'utf8'), ada = JSON.parse(s);
    const baru = Object.entries(KAMUS).filter(([k]) => !(k in ada)).map(([k, v]) => [k, v[bhs]]);
    for (const [k, v] of baru) if (typeof v !== 'string' || !v) throw new Error(`kamus ${bhs} kosong: ${k}`);
    const sisip = baru.map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
    if (!sisip) { console.log(bhs, 'sudah lengkap'); continue; }
    const i = s.lastIndexOf('}'), kepala = s.slice(0, i).replace(/\s+$/, '');
    fs.writeFileSync(f, `${kepala},\n${sisip}\n}\n`);
    JSON.parse(fs.readFileSync(f, 'utf8'));
    console.log(bhs, 'ditambah', baru.length);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--bangun') { const d = bangun(); console.log(periksa(d)); fs.writeFileSync(path.join(ROOT, 'public/data/sampah_energi.json'), JSON.stringify(d, null, 1) + '\n'); }
  else if (a === '--selftest') console.log(periksa(bangun()));
  else if (a === '--cek-url') await cekUrl();
  else if (a === '--kamus') await kamus();
  else console.log('pakai: --bangun | --selftest | --cek-url | --kamus');
}
