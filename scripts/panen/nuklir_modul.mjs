#!/usr/bin/env node
// Nuklir ujung ke ujung -> public/data/nuklir.json.
// Berkas ini MERUJUK data yang sudah ada lewat id: energi_baru.json (butir nuklir), topik/nuklir.json (sumber + tabel bab 7, 8, 19, 20, 26, 30),
// proyek.json/proyek_terpadu.json (pj_0220), program_analisis.json (kode nuklir), regulasi.json, isu.json, organisasi.json.
// Data baru hanya butir yang dibaca dari sumber publik tanggal T (tiap butir bersumber + bertingkat bukti); yang tidak ditemukan
// ditulis di `celah`. TIDAK mengarang. Butir yang hanya terbaca dari ringkasan hasil pencarian bertingkat 'cuplikan'.
// Panen mentah (bila perlu) memakai scripts/pipa/_panen_sopan.mjs (UA sopan, robots, jeda >= 2 dtk, stop 403/429).
// Pakai: --bangun | --selftest | --cek-url
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const T = '2026-11-08';
const S = (id, judul, penerbit, url, tahun, tb = 'media') => ({ id, judul, penerbit, url, tahun, tingkat_bukti: tb, tanggal_periksa: T });
const L = (id, en) => ({ id, en });
const TB = ['resmi', 'media', 'kajian', 'via-pihak-ketiga', 'editorial'];
const TB_BUTIR = [...TB, 'cuplikan', 'est'];

/** Sumber yang dipinjam dari topik/nuklir.json (id sama). */
const PINJAM_TOPIK = ['ken', 'ruptl', 'ruptlp', 'den26', 'ibp25', 'detik_tapak', 'mongabay_gelasa', 'brin_sdm', 'rsg', 'brin_bbn', 'direktori', 'wna_ph', 'wna_uae', 'nuscale', 'nuscale2', 'korea', 'iaea', 'uu10', 'pp46', 'pp54', 'pp2', 'uu8', 'pbp', 'idnuk', 'vnnuk'];
/** Sumber yang dipinjam dari energi_baru.json (id sama). */
const PINJAM_ENB = ['kontan-ruptl', 'detik-7gw', 'cnbc-28tapak', 'katadata-tender', 'bapeten-sp003', 'bisnis-thorcon', 'jp-thorcon', 'petromindo-nepio', 'kompas-nepio', 'viva-rosatom', 'listrik-smr160', 'jawapos-brin'];

export const SUMBER_BARU = [
  S('katadata-nepio', 'PLTN terus dibicarakan, mengapa aturan lembaga NEPIO tak kunjung disahkan (27 Oktober 2026)', 'Katadata', 'https://katadata.co.id/ekonomi-hijau/energi-baru/6ae089077b2af/pltn-terus-dibicarakan-mengapa-aturan-lembaga-nepio-tak-kunjung-disahkan', 2026),
  S('detik-babel-kalbar', 'Pembangkit listrik tenaga nuklir bakal dibangun di Babel dan Kalbar (7 Januari 2026)', 'detikFinance', 'https://finance.detik.com/energi/d-8296794/pembangkit-listrik-tenaga-nuklir-bakal-dibangun-di-babel-dan-kalbar', 2026),
  S('katadata-mitra', 'Menuju PLTN komersial pertama: progres dan deretan mitra asing (15 Januari 2026)', 'Katadata', 'https://katadata.co.id/amp/ekonomi-hijau/energi-baru/6968bccbe5f7d/menuju-pltn-komersial-pertama-progres-dan-deretan-mitra-asing/', 2026),
  S('petromindo-feed', 'Indonesia partners with U.S., Japan on FEED for West Kalimantan SMR project (20 Februari 2026)', 'Petromindo', 'https://www.petromindo.com/news/article/indonesia-partners-with-u-s-japan-on-feed-for-west-kalimantan-smr-project', 2026),
  S('wnn-us-smr', 'USA, Indonesia announce partnership on SMRs (20 Maret 2023)', 'World Nuclear News', 'https://world-nuclear-news.org/articles/usa,-indonesia-announce-partnership-on-smrs', 2023),
  S('wnn-rosatom-fpu', 'Rosatom signs floating nuclear power deal for Indonesia (19 Oktober 2026)', 'World Nuclear News', 'https://world-nuclear-news.org/articles/rosatom-signs-floating-nuclear-power-deal-for-indonesia', 2026),
  S('bapeten-fnpp', 'Bapeten discusses regulatory framework for floating nuclear power plants through workshop (29-30 April 2026; ringkasan hasil pencarian)', 'Bapeten', 'https://bapeten.go.id/berita/bapeten-discusses-regulatory-framework-for-floating-nuclear-power-plants-through-workshop-105238', 2026, 'resmi'),
  S('republika-evaluasi', 'Bapeten setujui evaluasi tapak pembangunan reaktor nuklir Thorcon di Bangka Belitung (8 Agustus 2025)', 'Republika', 'https://ekonomi.republika.co.id/berita/t0nfv5490/bapeten-setujui-evaluasi-tapak-pembangunan-reaktor-nuklir-thorcon-di-bangka-belitung', 2025),
  S('detik-bapeten-proses', 'Perizinan PLTN Thorcon masih proses di Bapeten, belum sampai ESDM (Agustus 2025; hanya judul dan ringkasan pencarian)', 'detikFinance', 'https://finance.detik.com/energi/d-8068301/perizinan-pltn-thorcon-masih-proses-di-bapeten-belum-sampai-esdm', 2025),
  S('kedglobal-khnp', 'KHNP menandatangani MOU dengan PLN Nusantara Power untuk i-SMR di Indonesia (Desember 2023; ringkasan hasil pencarian)', 'KED Global', 'https://amp.kedglobal.com/newsView/ked202312040014', 2023),
  S('rri-reaktor', 'BRIN presents progress on revitalizing three nuclear research reactors at FNCA (18 September 2026)', 'RRI Voice of Indonesia', 'https://rri.co.id/voice-of-indonesia/technology/2737262/brin-presents-progress-on-revitalizing-three-nuclear-research-reactors-at-fnca', 2026),
  S('detik-kartini', '45 tahun Reaktor Nuklir Kartini, begini sejarahnya (4 Maret 2024)', 'detikEdu', 'https://www.detik.com/edu/detikpedia/d-7223987/45-tahun-reaktor-nuklir-kartini-begini-lo-sejarahnya', 2024),
  S('kumparan-uranium', 'RI punya potensi bahan bakar nuklir ribuan ton di Babel hingga Kalbar (21 Desember 2024; RUKN, Kepmen ESDM 314.K/TL/01/MEM.L/2024, data Laporan Teknis Ringkas BRIN)', 'kumparan', 'https://kumparan.com/kumparanbisnis/ri-punya-potensi-bahan-bakar-nuklir-ribuan-ton-di-babel-hingga-kalbar-249Gd1SsLvp', 2024),
  S('cnbc-melawi', 'Wilayah RI ini ternyata simpan uranium thorium segini jumlahnya (10 Juli 2025; mengutip RUPTL dan Atlas Geologi ESDM)', 'CNBC Indonesia', 'https://www.cnbcindonesia.com/news/20250710082130-4-647816/wilayah-ri-ini-ternyata-simpan-uranium-thorium-segini-jumlahnya', 2025),
  S('atom-bangka', 'Uncovering the distribution zones of uranium and thorium in Bangka Island (ringkasan hasil pencarian)', 'Atom Indonesia (BRIN)', 'https://atomindonesia.brin.go.id/index.php/aij/article/view/1288', 2023, 'kajian'),
  S('jp-uranium-reg', 'Government prepares regulations on uranium, thorium processing (23 Juni 2025; hanya judul dan ringkasan pencarian)', 'The Jakarta Post', 'https://www.thejakartapost.com/business/2025/06/23/government-prepares-regulations-on-uranium-thorium-processing', 2025),
  S('republika-bbn', 'BRIN: Indonesia bisa buat bahan bakar nuklir secara mandiri (23 Maret 2022; hanya judul)', 'Republika', 'https://ekonomi.republika.co.id/berita/r9701b383/brin-indonesia-bisa-buat-bahan-bakar-nuklir-secara-mandiri', 2022),
  S('detik-batan75', 'BATAN: 75% penduduk RI dukung pembangkit listrik tenaga nuklir (29 Desember 2015)', 'detikFinance', 'https://finance.detik.com/energi/d-3106219/batan-75-penduduk-ri-dukung-pembangkit-listrik-tenaga-nuklir', 2015),
  S('idx-den73', 'DEN sebut 73,37 persen masyarakat setuju pembangunan PLTN (Januari 2024; ringkasan hasil pencarian)', 'IDX Channel', 'https://www.idxchannel.com/economics/den-sebut-7337-persen-masyarakat-setuju-pembangunan-pltn/all', 2024),
  S('dpr-babel', 'Mapping Survey of Public Acceptance on Development Nuclear Power Plant (NPP) in Bangka Belitung Province (Aspirasi, vol. 14 no. 1, 18 Juli 2023)', 'Aspirasi, Badan Keahlian DPR RI', 'https://jurnal.dpr.go.id/index.php/aspirasi/article/view/3143', 2023, 'kajian'),
  S('li-gaskeun', 'ThorCon dapat restu, warga Babel bilang Gaskeun PLTN (survei UNS, UBB, dan PT Thorcon Power Indonesia; paparan 3 Desember 2025)', 'listrikindonesia.com', 'https://listrikindonesia.com/index.php/detail/18582/thorcon-dapat-restu-warga-babel-bilang-gaskeun-pltn', 2025),
  S('wb-nuklir', 'World Bank lifts nuclear funding ban to aid energy shift in developing nations (13 Juni 2025)', 'The Daily Climate', 'https://www.dailyclimate.org/world-bank-lifts-nuclear-funding-ban-to-aid-energy-shift-in-developing-nations-2672363290.html', 2025),
  S('adb-energi', 'ADB updates energy policy to strengthen focus on energy access and security (24 November 2025; ringkasan hasil pencarian)', 'Asian Development Bank', 'https://www.adb.org/news/adb-updates-energy-policy-strengthen-focus-energy-access-and-security', 2025, 'resmi'),
  S('enerdata-vn', 'Vietnam approves agreement for 2.4 GW Ninh Thuan 1 nuclear power plant (27 Agustus 2026)', 'Enerdata', 'https://www.enerdata.net/publications/daily-energy-news/vietnam-approves-agreement-24-gw-ninh-thuan-1-nuclear-power-plant.html', 2026),
  S('nucnet-vn', 'Russia and Vietnam sign agreement to build Ninh Thuan 1 nuclear plant (23 Maret 2026; ringkasan hasil pencarian)', 'NucNet', 'https://www.nucnet.org/news/russia-and-vietnam-sign-agreement-to-build-ninh-thuan-1-nuclear-plant-3-1-2026', 2026),
  S('lawphil-12305', 'Republic Act No. 12305 (18 September 2025), pembentukan PhilATOM (ringkasan hasil pencarian)', 'Project Lawphil', 'https://lawphil.net/statutes/repacts/ra2025/ra_12305_2025.html', 2025, 'resmi'),
  S('sq-thailand', 'Thailand plans 9 GW of small modular reactor capacity by 2050 (26 Agustus 2026)', 'SolarQuarter', 'https://solarquarter.com/2026/08/26/thailand-plans-9-gw-of-small-modular-reactor-capacity-by-2050/', 2026),
  S('li-limbah', 'BRIN kenalkan pemanfaatan nuklir lewat kunjungan fasilitas riset (3 Oktober 2025)', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/18083/brin-kenalkan-pemanfaatan-nuklir-lewat-kunjungan-fasilitas-riset', 2025),
  S('kompas-limbah', 'Indonesia siap bangun PLTN, bagaimana mitigasi pembuangan limbahnya (30 Juni 2025; ringkasan hasil pencarian)', 'Kompas', 'https://lestari.kompas.com/read/2025/06/30/141600386/indonesia-siap-bangun-pltn-bagaimana-mitigasi-pembuangan-limbahnya-', 2025),
];

export function sumberGabung() {
  const tp = j('public/data/topik/nuklir.json').sumber, eb = j('public/data/energi_baru.json').sumber, out = [];
  for (const id of PINJAM_TOPIK) {
    const s = tp[id]; if (!s) throw new Error('sumber topik tidak ada: ' + id);
    out.push({ id, judul: s.judul, penerbit: s.penerbit, url: s.url, tahun: s.tahun, tingkat_bukti: s.bukti === 'editorial' ? 'editorial' : TB.includes(s.bukti) ? s.bukti : 'media', tanggal_periksa: s.tanggal || T });
  }
  for (const id of PINJAM_ENB) {
    const s = eb.find((x) => x.id === id); if (!s) throw new Error('sumber energi_baru tidak ada: ' + id);
    out.push({ id, judul: s.judul, penerbit: s.penerbit, url: s.url, tahun: s.tahun, tingkat_bukti: TB.includes(s.tingkat_bukti) ? s.tingkat_bukti : 'media', tanggal_periksa: s.tanggal_periksa || T });
  }
  return out.concat(SUMBER_BARU);
}

const ORG = { pln: 'su_ed074ff5', esdm: 'l_7278e0528a', brin: 'l_973f60de15', brin_energi: 'l_0d81cf4cb1', pln_np: 'p_ff7a390a42', pln_ip: 'p_5a2e7d0c63', hyundai: 'en_fd9cbcff6c' };
const b = (id, sumber_id, tingkat_bukti, extra = {}) => ({ ...id, sumber_id, tingkat_bukti, ...extra });

export function bangun() {
  return {
    lapis: 'nuklir', dibangun_pada: T, tanggal: T,
    keterangan: 'Modul nuklir ujung ke ujung. Berkas ini hanya memuat rujukan id ke data yang sudah ada dan butir baru bersumber; butir energi baru, tabel topik nuklir, proyek, regulasi, isu, dan organisasi dibaca dari berkasnya sendiri saat runtime.',
    sumber: sumberGabung(),
    rujukan: {
      enb_ids: ['nk-ruptl-pltn', 'nk-tapak-28', 'nk-thorcon', 'nk-rsg-gas', 'nk-nepio', 'nk-rosatom', 'nk-smr-as-kr'],
      topik_bab: { target_grafik: '7', tapak: '8', fasilitas: '10', regulasi: '12', biaya: '19', banding: '20', biaya_kasus: '26', target_tabel: '30' },
      proyek_ids: ['pj_0220'], program_kode: 'nuklir', isu_ids: ['nuklir-pltn'],
      regulasi_lembaga: ['uu-10-1997', 'pp-2-2014', 'pp-43-2006', 'lainnya-b204020-1-2022', 'pp-40-2025', 'perpres-42-2011', 'pp-52-2022'],
      regulasi_selamat: ['pp-54-2012', 'pp-46-2009', 'perpres-84-2010', 'lainnya-b344440-1-2026', 'perpres-46-2009', 'uu-8-1978', 'uu-9-1997', 'uu-10-2014'],
    },
    rencana: {
      angka: [
        b({ k: 'ruptl', nilai: 500, satuan: 'MW', tahun: 2034, ket: L('RUPTL 2025-2034: 250 MW di Sumatera (target 2032) dan 250 MW di Kalimantan (target 2034).', 'RUPTL 2025-2034: 250 MW in Sumatra (target 2032) and 250 MW in Kalimantan (target 2034).') }, 'ruptlp', 'resmi'),
        b({ k: 'pln7', nilai: 7, satuan: 'GW', tahun: 2040, ket: L('Tambahan sekitar 7 GW hingga 2040 menurut Direktur Utama PLN, di luar RUPTL.', 'About 7 GW more by 2040 per PLN\'s president director, outside the RUPTL.') }, 'detik-7gw', 'media'),
        b({ k: 'den44', nilai: 44, satuan: 'GW', tahun: 2060, ket: L('Sekretaris Jenderal DEN: 35 GW listrik dan 9 GW hidrogen; ESDM Februari 2025 menyebut 42 GW.', 'DEN Secretary General: 35 GW power and 9 GW hydrogen; the Energy Ministry said 42 GW in February 2025.') }, 'den26', 'media'),
      ],
      catatan_beda: L('Angka target berbeda menurut penutur dan tanggal; semua versi ditampilkan, tidak ada yang dipilih diam-diam.', 'Targets differ by speaker and date; all versions are shown, none chosen silently.'),
      butir: [
        b({ k: 'ken', teks: L('PP 40/2025 tentang Kebijakan Energi Nasional menjadi dasar kebijakan target nuklir; tabel sasaran per tahun ada di topik nuklir.', 'Government Regulation 40/2025 on the National Energy Policy is the policy basis for nuclear targets; the yearly target table is in the nuclear topic.') }, 'ken', 'resmi'),
        b({ k: 'offtaker', teks: L('Dirjen EBTKE menyebut pembeli listrik (off-taker) sebagai masalah utama PLTN pertama; kepastiannya dicari lewat studi kelayakan. Lokasi di Babel dan Kalbar belum final.', 'The EBTKE director general named the power off-taker as the main problem of the first plant, to be settled in the feasibility study. Sites in Bangka Belitung and West Kalimantan are not final.') }, 'detik-babel-kalbar', 'media'),
        b({ k: 'enam_bulan', teks: L('Menurut Kepala Pusat Riset Teknologi Reaktor Nuklir BRIN, setelah Perpres NEPIO terbit tapak ditetapkan dalam enam bulan pertama, lalu pembangunan dimulai enam bulan berikutnya.', 'Per the head of BRIN\'s nuclear reactor technology research centre, once the NEPIO regulation is issued the site is set within six months and construction starts six months later.') }, 'katadata-nepio', 'media'),
        b({ k: 'target32', teks: L('Menteri ESDM menyebut target PLTN pertama tersambung ke jaringan PLN pada 2032 dengan kapasitas awal 500 MW di Sumatera dan Kalimantan.', 'The Energy Minister cited 2032 as the target for the first plant to connect to the PLN grid, with 500 MW initial capacity in Sumatra and Kalimantan.') }, 'katadata-mitra', 'media'),
      ],
    },
    lembaga: {
      nepio: [
        b({ k: 'belum', teks: L('Per 27 Oktober 2026 Perpres pembentukan NEPIO belum disetujui Presiden; kondisi ini tidak berubah sejak awal 2026. Anggota DEN menyebut proses menunggu review kajian dan masukan masyarakat.', 'As of 27 October 2026 the NEPIO regulation was still awaiting presidential approval, unchanged since early 2026. A DEN member said the process awaits a review of the study and public input.') }, 'katadata-nepio', 'media'),
        b({ k: 'iaea', teks: L('NEPIO adalah badan pelaksana program tenaga nuklir yang disyaratkan IAEA; tonggak IAEA menjadi acuan kesiapan infrastruktur nasional.', 'NEPIO is the nuclear programme implementing body that the IAEA expects; the IAEA milestones guide national infrastructure readiness.') }, 'iaea', 'resmi'),
        b({ k: 'perpres', teks: L('Dirjen EBTKE (Januari 2026) menyebut Perpres pembentukan NEPIO menunggu tanda tangan Presiden.', 'The EBTKE director general (January 2026) said the NEPIO regulation awaited the President\'s signature.') }, 'detik-babel-kalbar', 'media'),
      ],
      peta: [
        { org_id: ORG.esdm, peran: ['kebijakan', 'tapak'], fakta: [b({ teks: L('Penyusun struktur NEPIO dan penetap tapak; ESDM menyatakan izin tapak final tetap di Menteri ESDM.', 'Drafter of the NEPIO structure and site-setting authority; the ministry says the final site permit stays with the Minister.') }, 'detik_tapak', 'media')] },
        { org_id: null, nama: 'Bapeten', peran: ['pengawas'], fakta: [b({ teks: L('Regulator nuklir; menerbitkan persetujuan evaluasi tapak Thorcon dengan keputusan 30 Juli 2025 dan menggelar lokakarya kerangka regulasi PLTN terapung bersama Rosatom pada April 2026.', 'Nuclear regulator; issued the Thorcon site evaluation approval by a decision of 30 July 2025 and held a floating plant regulatory framework workshop with Rosatom in April 2026.') }, 'republika-evaluasi', 'media', { sumber_tambahan: ['bapeten-fnpp'] })] },
        { org_id: ORG.brin, peran: ['riset', 'operator'], fakta: [b({ teks: L('Operator tiga reaktor riset dan penyedia kajian tapak serta sumber daya bahan bakar; dukungan BRIN untuk sumber daya manusia PLTN dikutip Katadata.', 'Operator of three research reactors and provider of site and fuel resource studies; BRIN\'s support for nuclear workforce was cited by Katadata.') }, 'brin_sdm', 'media')] },
        { org_id: ORG.pln, peran: ['pemrakarsa'], fakta: [b({ teks: L('Pemrakarsa PLTN dalam RUPTL; PLN Nusantara Power menandatangani MoU studi kelayakan dengan ThorCon (Juli 2025) dan PLN menandatangani MoU dengan NuScale (2026).', 'Sponsor of the RUPTL nuclear plant; PLN Nusantara Power signed a feasibility MoU with ThorCon (July 2025) and PLN signed an MoU with NuScale (2026).') }, 'katadata-mitra', 'media')] },
        { org_id: null, nama: 'Dewan Energi Nasional', peran: ['kebijakan'], fakta: [b({ teks: L('Pengusul NEPIO; Sekretaris Jenderal DEN menyebut sasaran 44 GW pada 2060.', 'Proposer of NEPIO; the DEN Secretary General cited a 44 GW goal by 2060.') }, 'den26', 'media')] },
        { org_id: null, nama: 'PT Pembangkit Listrik Nuklir', peran: ['pengembang'], fakta: [b({ teks: L('Pihak Indonesia dalam kesepakatan dua unit PLTN terapung Rosatom untuk Halmahera Utara (19 Oktober 2026).', 'Indonesian party to the Rosatom two-unit floating plant agreement for northern Halmahera (19 October 2026).') }, 'wnn-rosatom-fpu', 'media')] },
      ],
      tahap_izin: [
        b({ k: 'evaluasi_tapak', teks: L('Persetujuan evaluasi tapak: tahap awal yang sudah dicapai Thorcon (keputusan Bapeten 30 Juli 2025, pemohon PT Thorcon Power Indonesia).', 'Site evaluation approval: the early stage Thorcon has reached (Bapeten decision of 30 July 2025, applicant PT Thorcon Power Indonesia).') }, 'republika-evaluasi', 'media'),
        b({ k: 'izin_tapak', teks: L('Izin tapak: belum terbit untuk pihak mana pun menurut ESDM (Agustus 2025); kewenangan ESDM dan Bapeten ditafsirkan berbeda oleh sumber.', 'Site permit: not issued to anyone per the Energy Ministry (August 2025); sources read the ESDM and Bapeten roles differently.') }, 'detik_tapak', 'media'),
        b({ k: 'izin_konstruksi', teks: L('Izin konstruksi: sesudah izin tapak, menurut urutan Peraturan Bapeten 1/2022.', 'Construction permit: after the site permit, in the order of Bapeten Regulation 1/2022.') }, 'republika-evaluasi', 'media'),
        b({ k: 'izin_komisioning', teks: L('Izin komisioning: uji sebelum operasi komersial.', 'Commissioning permit: tests before commercial operation.') }, 'republika-evaluasi', 'media'),
        b({ k: 'izin_operasi', teks: L('Izin operasi: tahap terakhir dalam urutan yang disebut; dasar hukum perizinan instalasi nuklir ada di PP 2/2014.', 'Operating permit: the last stage in the sequence cited; the legal basis for nuclear installation licensing is Government Regulation 2/2014.') }, 'pp2', 'resmi'),
      ],
      kerja_sama: [
        { k: 'bapeten_rosatom', iso2: 'RU', teks: L('Bapeten dan Rosatom menggelar lokakarya kerangka regulasi PLTN terapung pada 29-30 April 2026; belum ada peraturan khusus yang ditemukan.', 'Bapeten and Rosatom held a floating plant regulatory framework workshop on 29-30 April 2026; no dedicated regulation was found.'), sumber_id: 'bapeten-fnpp', tingkat_bukti: 'cuplikan' },
        { k: 'kanada', iso2: 'CA', teks: L('Misi benchmarking ekosistem nuklir ke Kanada (November 2025); negara lain yang dipelajari: Amerika Serikat, Jepang, Korea Selatan.', 'Nuclear ecosystem benchmarking mission to Canada (November 2025); other countries studied: the United States, Japan, South Korea.'), sumber_id: 'katadata-mitra', tingkat_bukti: 'media' },
        { k: 'korea', iso2: 'KR', teks: L('Persetujuan kerja sama penggunaan tenaga nuklir untuk maksud damai dengan Korea telah disahkan lewat Perpres 42/2011.', 'The agreement on peaceful uses of nuclear energy with Korea was ratified by Presidential Regulation 42/2011.'), sumber_id: 'korea', tingkat_bukti: 'resmi' },
      ],
    },
    riset: {
      reaktor: [
        { k: 'rsg', nama: 'RSG-GAS G.A. Siwabessy', lokasi: 'Serpong, Tangerang Selatan', prov_kode: '36', daya: { nilai: 30, satuan: 'MWt' }, tahun: 1987, fungsi: ['radioisotop', 'pengujian-material', 'riset'], status: 'beroperasi', ket: L('Reaktor riset terbesar dan fasilitas produksi radioisotop nasional; kritikalitas pertama 1987.', 'The largest research reactor and national radioisotope production facility; first criticality 1987.'), sumber_id: 'rri-reaktor', tingkat_bukti: 'media', sumber_tahun_id: 'rsg' },
        { k: 'triga2000', nama: 'TRIGA 2000', lokasi: 'Bandung', prov_kode: '32', daya: null, tahun: 1965, fungsi: ['pendidikan', 'riset', 'neutron-imaging'], status: 'beroperasi', ket: L('Reaktor TRIGA Bandung pertama beroperasi 1965 pada 250 kW; sumber hasil pencarian menyebut peningkatan ke 2 MW pada 2000 (angka belum dibaca dari dokumen penuh).', 'The Bandung TRIGA first operated in 1965 at 250 kW; search results cite an upgrade to 2 MW in 2000 (figure not read from the full document).'), sumber_id: 'detik-kartini', tingkat_bukti: 'media' },
        { k: 'kartini', nama: 'TRIGA Kartini', lokasi: 'Sleman, Yogyakarta', prov_kode: '34', daya: null, tahun: 1979, fungsi: ['pendidikan', 'riset'], status: 'beroperasi', ket: L('Diresmikan Presiden Soeharto 1 Maret 1979; pada 2022 sekitar 93 persen pemakaiannya untuk pendidikan. Daya tidak seragam antar-sumber (50 atau 100 kW).', 'Inaugurated by President Soeharto on 1 March 1979; in 2022 about 93 percent of use was for education. Power differs between sources (50 or 100 kW).'), sumber_id: 'detik-kartini', tingkat_bukti: 'media' },
      ],
      revitalisasi: [
        b({ k: 'jam', teks: L('Target RSG-GAS beroperasi hingga 4.000 jam per tahun sesuai standar keselamatan, keamanan, dan safeguards.', 'Target for RSG-GAS to operate up to 4,000 hours a year within safety, security and safeguards standards.') }, 'rri-reaktor', 'media'),
        b({ k: 'isotop', teks: L('Aktivitas radioisotop (iodin, molibdenum, teknesium) ditargetkan naik sampai 50 persen dan enam radiofarmaka baru berbasis reaktor dikuasai.', 'Radioisotope activity (iodine, molybdenum, technetium) is targeted to rise by up to 50 percent and six new reactor-based radiopharmaceuticals mastered.') }, 'rri-reaktor', 'media'),
        b({ k: 'triga', teks: L('TRIGA Bandung dan Yogyakarta tidak direvitalisasi besar-besaran; fokus pada pemakaian, termasuk instrumen neutron imaging, dekat universitas.', 'The Bandung and Yogyakarta TRIGA reactors are not being heavily revitalised; the focus is on utilisation, including neutron imaging, near universities.') }, 'rri-reaktor', 'media'),
        b({ k: 'bahan_bakar', teks: L('BRIN merevitalisasi fasilitas bahan bakar nuklir untuk menjamin operasi RSG-GAS.', 'BRIN is revitalising the nuclear fuel facility to secure RSG-GAS operation.') }, 'brin_bbn', 'media'),
      ],
      org_ids: [ORG.brin, ORG.brin_energi],
    },
    teknologi: {
      vendor: [
        { k: 'thorcon', nama: 'ThorCon TMSR-500', org_id: null, iso2: 'US', jenis: 'msr', skala: L('500 MWe (rencana pengembang)', '500 MWe (developer plan)'), status: 'evaluasi-tapak', lokasi: 'Pulau Kelasa, Bangka Belitung', ket: L('Reaktor garam cair berbahan thorium. Bapeten menyetujui evaluasi tapak (30 Juli 2025); MoU studi kelayakan dengan PLN Nusantara Power (Juli 2025). Sumber berbeda soal basis perusahaan (AS atau Singapura).', 'Thorium molten salt reactor. Bapeten approved the site evaluation (30 July 2025); feasibility MoU with PLN Nusantara Power (July 2025). Sources differ on the company base (US or Singapore).'), sumber_id: 'katadata-mitra', tingkat_bukti: 'media', sumber_tambahan: ['republika-evaluasi', 'bisnis-thorcon'] },
        { k: 'nuscale', nama: 'NuScale VOYGR', org_id: null, iso2: 'US', jenis: 'smr', skala: L('462 MWe (6 modul x 77 MWe) pada kajian 2023', '462 MWe (6 modules x 77 MWe) in the 2023 study'), status: 'studi', lokasi: 'Kalimantan Barat', ket: L('Hibah USTDA kepada PLN Indonesia Power (Maret 2023) untuk kajian kelayakan; PLN menandatangani MoU dengan NuScale dan studi kelayakan berjalan, dengan FEED bersama AS dan Jepang direncanakan (Februari 2026). Di AS proyek UAMPS dibatalkan 9 November 2023.', 'USTDA grant to PLN Indonesia Power (March 2023) for a feasibility study; PLN signed an MoU with NuScale and the feasibility study is running, with FEED planned together with the US and Japan (February 2026). In the US the UAMPS project was cancelled on 9 November 2023.'), sumber_id: 'wnn-us-smr', tingkat_bukti: 'media', sumber_tambahan: ['petromindo-feed', 'nuscale'] },
        { k: 'holtec', nama: 'Holtec SMR-160', org_id: null, iso2: 'US', jenis: 'smr', skala: L('160 MWe (desain)', '160 MWe (design)'), status: 'kerja-sama', lokasi: null, ket: L('BRIN membahas desain SMR-160 dan penyesuaian lokasi; kontraktor Korea yang disebut: Hyundai E&C.', 'BRIN discussed the SMR-160 design and site adaptation; the Korean contractor named is Hyundai E&C.'), sumber_id: 'listrik-smr160', tingkat_bukti: 'media', org_tambahan: [ORG.hyundai] },
        { k: 'khnp', nama: 'KHNP i-SMR', org_id: null, iso2: 'KR', jenis: 'smr', skala: L('belum disebut', 'not stated'), status: 'kerja-sama', lokasi: null, ket: L('KHNP menandatangani MoU dengan PLN Nusantara Power untuk mengembangkan dan membangun i-SMR di Indonesia (Desember 2023).', 'KHNP signed an MoU with PLN Nusantara Power to develop and build i-SMRs in Indonesia (December 2023).'), sumber_id: 'kedglobal-khnp', tingkat_bukti: 'cuplikan', org_tambahan: [ORG.pln_np] },
        { k: 'rosatom', nama: 'Rosatom FPU-100', org_id: null, iso2: 'RU', jenis: 'terapung', skala: L('2 unit, total 200 MW', '2 units, 200 MW in total'), status: 'kontrak', lokasi: 'Halmahera Utara, Maluku Utara', ket: L('Kesepakatan 19 Oktober 2026 dengan PT Pembangkit Listrik Nuklir; unit tetap dimiliki dan dioperasikan Rosatom, pelanggan membayar listrik, tanpa dana APBN; listrik diperkirakan mengalir dalam lima tahun.', 'Agreement of 19 October 2026 with PT Pembangkit Listrik Nuklir; units stay owned and operated by Rosatom, the customer pays for power, no state budget funds; power expected within five years.'), sumber_id: 'wnn-rosatom-fpu', tingkat_bukti: 'media', sumber_tambahan: ['viva-rosatom', 'bapeten-fnpp'] },
        { k: 'as_jepang', nama: 'SMR Amerika Serikat dan Jepang', org_id: null, iso2: 'US', jenis: 'smr', skala: L('sekitar 70 MW', 'about 70 MW'), status: 'studi', lokasi: 'Kalimantan Barat', ket: L('Studi kelayakan disebut rampung (Oktober 2025) dan tahap berikutnya perizinan konstruksi; nama vendor tidak disebut dalam artikel.', 'Feasibility study said to be complete (October 2025) with construction licensing as the next stage; the article names no vendor.'), sumber_id: 'katadata-mitra', tingkat_bukti: 'media' },
      ],
      pelajaran: b({ teks: L('NuScale membatalkan proyek UAMPS di Utah pada 9 November 2023 setelah harga target naik dari USD 58 menjadi USD 89 per MWh dan langganan kurang; SMR unit pertama diperkirakan USD 6.000 sampai 8.000 per kW.', 'NuScale cancelled the UAMPS project in Utah on 9 November 2023 after the target price rose from USD 58 to USD 89 per MWh and subscription fell short; first-of-a-kind SMRs are estimated at USD 6,000 to 8,000 per kW.') }, 'nuscale', 'media'),
    },
    tapak: {
      sorotan: [
        { k: 'muria', nama: 'Muria', prov_kode: '33', status: 'kandidat', pihak: [], ket: L('Disebut BRIN sebagai satu dari tiga lokasi yang dinilai paling siap.', 'Named by BRIN as one of the three sites judged most ready.'), sumber_id: 'katadata-nepio', tingkat_bukti: 'media' },
        { k: 'bangka_barat', nama: 'Bangka Barat', prov_kode: '19', status: 'kandidat', pihak: [], ket: L('Disebut BRIN sebagai satu dari tiga lokasi yang dinilai paling siap; data Bangka paling banyak menurut Dirjen EBTKE.', 'Named by BRIN as one of the three sites judged most ready; Bangka has the most data per the EBTKE director general.'), sumber_id: 'katadata-nepio', tingkat_bukti: 'media', sumber_tambahan: ['detik-babel-kalbar'] },
        { k: 'bangka_selatan', nama: 'Bangka Selatan', prov_kode: '19', status: 'kandidat', pihak: [], ket: L('Disebut BRIN sebagai satu dari tiga lokasi yang dinilai paling siap.', 'Named by BRIN as one of the three sites judged most ready.'), sumber_id: 'katadata-nepio', tingkat_bukti: 'media' },
        { k: 'kelasa', nama: 'Pulau Kelasa (Gelasa)', prov_kode: '19', status: 'evaluasi-tapak', pihak: ['ThorCon'], ket: L('Persetujuan evaluasi tapak Bapeten untuk Thorcon 500; izin tapak belum terbit; warga dan organisasi sipil menyuarakan penolakan.', 'Bapeten site evaluation approval for Thorcon 500; site permit not yet issued; residents and civil society voiced objections.'), sumber_id: 'republika-evaluasi', tingkat_bukti: 'media', sumber_tambahan: ['detik_tapak', 'mongabay_gelasa'] },
        { k: 'kalbar', nama: 'Kalimantan Barat', prov_kode: '61', status: 'studi', pihak: ['PLN', 'NuScale'], ket: L('Lokasi RUPTL; tahap pra-FS, kajian bersama AS dan Jepang menuju FEED. Datanya belum jelas menurut Dirjen EBTKE.', 'RUPTL site; pre-feasibility stage, joint study with the US and Japan heading to FEED. Data still unclear per the EBTKE director general.'), sumber_id: 'detik-babel-kalbar', tingkat_bukti: 'media', sumber_tambahan: ['petromindo-feed'] },
        { k: 'kepri', nama: 'Kepulauan Riau', prov_kode: '21', status: 'kandidat', pihak: [], ket: L('Menteri ESDM menyebut salah satu PLTN akan ditempatkan di Kepulauan Riau (tanpa tanggal pernyataan).', 'The Energy Minister said one plant would be placed in the Riau Islands (statement undated).'), sumber_id: 'katadata-nepio', tingkat_bukti: 'media' },
        { k: 'halmahera', nama: 'Halmahera Utara', prov_kode: '82', status: 'kontrak', pihak: ['Rosatom'], ket: L('Lokasi dua unit PLTN terapung FPU-100 (total 200 MW).', 'Site of the two FPU-100 floating units (200 MW in total).'), sumber_id: 'wnn-rosatom-fpu', tingkat_bukti: 'media' },
      ],
      selisih: L('ESDM menyebut 28 tapak disiapkan (Oktober 2026); topik nuklir METI mencatat 29 calon lokasi di 13 wilayah (IBP 2025). Selisih karena sumber dan tanggal berbeda.', 'The Energy Ministry cites 28 prepared sites (October 2026); the METI nuclear topic lists 29 candidate sites in 13 regions (IBP 2025). The gap reflects different sources and dates.'),
    },
    bahan: {
      uranium: [
        b({ k: 'nasional', nilai: 5234, satuan: 't U3O8', wilayah: 'Nasional', ket: L('Total nasional menurut RUKN (Kepmen ESDM 314.K/TL/01/MEM.L/2024), data Laporan Teknis Ringkas BRIN; jumlah Babel dan Kalbar.', 'National total per the RUKN (Energy Minister Decree 314.K/TL/01/MEM.L/2024), data from a BRIN technical brief; the sum of Bangka Belitung and West Kalimantan.') }, 'kumparan-uranium', 'media'),
        b({ k: 'babel', nilai: 2840, satuan: 't U3O8', wilayah: 'Kepulauan Bangka Belitung', ket: L('Uranium dalam mineral monasit yang berasosiasi dengan endapan timah.', 'Uranium in monazite associated with tin deposits.') }, 'kumparan-uranium', 'media'),
        b({ k: 'kalbar', nilai: 2394, satuan: 't U3O8', wilayah: 'Kalimantan Barat', ket: L('Sumber daya uranium di Kalimantan Barat menurut RUKN.', 'Uranium resource in West Kalimantan per the RUKN.') }, 'kumparan-uranium', 'media'),
        b({ k: 'melawi', nilai: 24112, satuan: 't', wilayah: 'Kabupaten Melawi, Kalimantan Barat', ket: L('Angka 24.112 ton dikutip RUPTL dari Atlas Geologi ESDM; ada yang menyebutnya uranium dan thorium bersama, ada yang uranium saja, dan dengan label cadangan atau potensi. Kategori tidak seragam dengan angka RUKN.', 'The 24,112 tonne figure is quoted by the RUPTL from the Energy Ministry geological atlas; sources call it uranium and thorium together or uranium only, and reserves or potential. The category does not match the RUKN figures.') }, 'cnbc-melawi', 'media'),
      ],
      thorium: [
        b({ k: 'babel', nilai: 4729, satuan: 't', wilayah: 'Kepulauan Bangka Belitung', ket: L('Thorium nasional menurut RUKN sama dengan angka Bangka Belitung; thorium Kalimantan Barat tidak disebut.', 'National thorium per the RUKN equals the Bangka Belitung figure; West Kalimantan thorium is not stated.') }, 'kumparan-uranium', 'media'),
      ],
      catatan_beda: L('Angka sumber daya memakai kategori dan tahun berbeda (RUKN, Atlas Geologi) dan tidak dapat dijumlahkan; semua versi ditampilkan.', 'Resource figures use different categories and years (RUKN, geological atlas) and cannot be added; all versions are shown.'),
      daur: [
        b({ k: 'monasit', teks: L('Uranium dan thorium di Pulau Bangka terkandung dalam mineral monasit di sabuk timah Asia Tenggara (kajian BRIN dalam Atom Indonesia).', 'Uranium and thorium on Bangka sit in monazite in the Southeast Asian tin belt (BRIN study in Atom Indonesia).') }, 'atom-bangka', 'cuplikan'),
        b({ k: 'regulasi', teks: L('Pemerintah dilaporkan menyusun regulasi pengolahan uranium dan thorium untuk energi nuklir (Juni 2025).', 'The government was reported to be preparing regulations on uranium and thorium processing for nuclear energy (June 2025).') }, 'jp-uranium-reg', 'cuplikan'),
        b({ k: 'mandiri', teks: L('BRIN menyatakan Indonesia bisa membuat bahan bakar nuklir secara mandiri (Maret 2022, dibaca dari judul).', 'BRIN said Indonesia can make nuclear fuel on its own (March 2022, read from the headline).') }, 'republika-bbn', 'cuplikan'),
      ],
    },
    opini: {
      survei: [
        b({ k: 'batan2015', nilai: 75.3, tahun: 2015, populasi: L('Nasional (BATAN)', 'National (BATAN)'), ket: L('Dukungan di luar Jawa 79,4 persen, di Jawa 72,0 persen; jumlah responden tidak disebut. Alasan menolak: kemungkinan kecelakaan, kebocoran radiasi, dan limbah radioaktif.', 'Support outside Java 79.4 percent, in Java 72.0 percent; respondent count not stated. Reasons for opposing: possible accidents, radiation leaks and radioactive waste.') }, 'detik-batan75', 'media'),
        b({ k: 'den2024', nilai: 73.37, tahun: 2024, populasi: L('Nasional (disebut DEN)', 'National (cited by DEN)'), ket: L('Angka disebut Dewan Energi Nasional pada Januari 2024; metode dan responden tidak ditemukan.', 'Figure cited by the National Energy Council in January 2024; method and respondents not found.') }, 'idx-den73', 'cuplikan'),
        b({ k: 'babel2023', nilai: 73.73, tahun: 2023, populasi: L('Bangka Belitung, 1.500 responden', 'Bangka Belitung, 1,500 respondents'), ket: L('Survei campuran; kepercayaan pada niat baik pengembang 92,53 persen; pendukung menginginkan jarak sekitar 30 km dari permukiman. Penulis tidak menemukan gejala NIMBY yang jelas.', 'Mixed-method survey; trust in developer good faith 92.53 percent; supporters wanted about 30 km from residential areas. The authors found no clear NIMBY pattern.') }, 'dpr-babel', 'kajian'),
        b({ k: 'babel2025', nilai: 85.71, tahun: 2025, populasi: L('Bangka Belitung (UNS, UBB, PT Thorcon Power Indonesia)', 'Bangka Belitung (UNS, UBB, PT Thorcon Power Indonesia)'), ket: L('Survei fase II dengan mitra pengembang proyek; jumlah responden dan pendana tidak disebut. Dibaca hati-hati karena pengembang ikut serta.', 'Phase II survey with the project developer as a partner; respondent count and funder not stated. Read with caution because the developer took part.') }, 'li-gaskeun', 'media'),
      ],
      persepsi: [
        b({ k: 'manfaat', nilai: 94.27 }, 'dpr-babel', 'kajian'),
        b({ k: 'risiko', nilai: 70.93 }, 'dpr-babel', 'kajian'),
        b({ k: 'niat_baik', nilai: 92.53 }, 'dpr-babel', 'kajian'),
        b({ k: 'kompeten', nilai: 93.53 }, 'dpr-babel', 'kajian'),
      ],
      alasan_tolak: [
        b({ k: 'kecelakaan', teks: L('Kemungkinan kecelakaan PLTN dan kebocoran radiasi.', 'Possible plant accidents and radiation leaks.') }, 'detik-batan75', 'media'),
        b({ k: 'limbah', teks: L('Limbah radioaktif yang dapat mencemari lingkungan.', 'Radioactive waste that can pollute the environment.') }, 'detik-batan75', 'media'),
        b({ k: 'biaya', teks: L('Kritik biaya dan risiko: pembengkakan proyek berjalan disebut 2 sampai 3 kali rencana (IESR, dikutip Mongabay).', 'Cost and risk critique: overruns in projects under construction cited at 2 to 3 times plan (IESR, quoted by Mongabay).') }, 'mongabay_gelasa', 'media'),
      ],
    },
    asean: {
      negara: [
        { iso2: 'VN', ukuran_mw: 2400, status: 'kontrak', ket: L('Ninh Thuan 1: dua unit, 2,4 GW, perjanjian antarpemerintah dengan Rusia 23 Maret 2026 dan disetujui parlemen 27 Agustus 2026; Rosatom pengembang. Pinjaman Rusia disebut hingga 85 persen biaya, operasi ditargetkan sebelum akhir 2031 (ringkasan hasil pencarian). Ninh Thuan 2: Korea Selatan kandidat utama setelah Jepang mundur.', 'Ninh Thuan 1: two units, 2.4 GW, intergovernmental agreement with Russia on 23 March 2026 and parliament approval on 27 August 2026; Rosatom is the developer. The Russian loan is said to cover up to 85 percent of cost, with operation targeted before end 2031 (search summary). Ninh Thuan 2: South Korea is the leading contender after Japan withdrew.'), sumber_id: 'enerdata-vn', tingkat_bukti: 'media', sumber_tambahan: ['nucnet-vn', 'vnnuk'] },
        { iso2: 'PH', ukuran_mw: 621, status: 'dikaji', ket: L('Bataan 621 MWe rampung 1984 dan tidak pernah beroperasi; studi rehabilitasi KHNP sejak 2025. UU RA 12305 (18 September 2025) membentuk regulator mandiri PhilATOM.', 'Bataan 621 MWe was completed in 1984 and never operated; KHNP rehabilitation study since 2025. Republic Act 12305 (18 September 2025) created the independent regulator PhilATOM.'), sumber_id: 'wna_ph', tingkat_bukti: 'kajian', sumber_tambahan: ['lawphil-12305'] },
        { iso2: 'TH', ukuran_mw: 300, status: 'rencana', ket: L('Draf Rencana Pembangunan Tenaga Listrik (PDP) terbaru memuat SMR 300 MW pada 2037 dan 9 GW SMR pada 2050; draf belum disetujui dan konsultasi publik dijadwalkan September 2026.', 'The latest draft Power Development Plan (PDP) has a 300 MW SMR by 2037 and 9 GW of SMRs by 2050; the draft is not yet approved and public consultation was scheduled for September 2026.'), sumber_id: 'sq-thailand', tingkat_bukti: 'media' },
        { iso2: 'ID', ukuran_mw: 500, status: 'rencana', ket: L('RUPTL 2025-2034: 500 MW; hanya reaktor riset yang beroperasi; NEPIO belum disahkan.', 'RUPTL 2025-2034: 500 MW; only research reactors operate; NEPIO not yet established.'), sumber_id: 'ruptlp', tingkat_bukti: 'resmi' },
      ],
    },
    biaya: {
      barakah: { kontrak_usd_miliar: 20.4, kapasitas_gw: 5.6, pembiayaan_usd_miliar: 24.4, sumber_id: 'wna_uae', tingkat_bukti: 'kajian' },
      smr_foak_usd_per_kw: { min: 6000, maks: 8000, sumber_id: 'nuscale', tingkat_bukti: 'media' },
      lembaga: [
        b({ k: 'bankdunia', tahun: 2025, teks: L('Dewan direksi Bank Dunia mencabut larangan pinjaman pembangkit nuklir yang berlaku sejak 2013 (Juni 2025); Indonesia disebut sebagai calon penerima manfaat.', 'The World Bank board lifted the 2013 ban on lending for nuclear power plants (June 2025); Indonesia was named as a possible beneficiary.') }, 'wb-nuklir', 'media'),
        b({ k: 'adb', tahun: 2025, teks: L('ADB menyetujui perubahan kebijakan energi pada 24 November 2025 yang membuka dukungan untuk nuklir, termasuk investasi untuk pertama kali, dengan syarat standar keselamatan, keamanan, dan safeguards.', 'ADB approved energy policy changes on 24 November 2025 opening support for nuclear, including investment for the first time, subject to safety, security and safeguards standards.') }, 'adb-energi', 'cuplikan'),
        b({ k: 'iaa', tahun: 2023, teks: L('Pendanaan publik internasional untuk nuklir Indonesia 2006 sampai 2023 tercatat USD 13,2 juta kumulatif (IRENA dan OECD), jauh dari skala PLTN.', 'International public finance for Indonesian nuclear from 2006 to 2023 totals USD 13.2 million cumulative (IRENA and OECD), far below plant scale.') }, 'direktori', 'via-pihak-ketiga'),
      ],
      skema: [
        b({ k: 'rosatom', teks: L('Rosatom memiliki dan mengoperasikan unit terapung; pelanggan membayar listrik; investasi swasta tanpa APBN.', 'Rosatom owns and operates the floating units; the customer pays for power; private investment without state budget funds.') }, 'wnn-rosatom-fpu', 'media'),
        b({ k: 'vietnam', teks: L('Vietnam: pinjaman Rusia hingga 85 persen biaya rancang dan bangun Ninh Thuan 1, sisanya 15 persen oleh EVN.', 'Vietnam: a Russian loan of up to 85 percent of Ninh Thuan 1 design and construction cost, with EVN securing the other 15 percent.') }, 'nucnet-vn', 'cuplikan'),
        b({ k: 'thorcon', teks: L('ThorCon: MoU studi kelayakan dengan PLN Nusantara Power; skema pendanaan dan harga jual listrik belum ditemukan.', 'ThorCon: feasibility MoU with PLN Nusantara Power; funding scheme and power sale price not found.') }, 'katadata-mitra', 'media'),
        b({ k: 'offtaker', teks: L('Pembeli listrik (off-taker) disebut masalah utama PLTN pertama.', 'The power off-taker is cited as the main problem of the first plant.') }, 'detik-babel-kalbar', 'media'),
      ],
    },
    selamat: {
      limbah: [
        b({ k: 'serpong', teks: L('Instalasi pengelolaan limbah radioaktif di kawasan Serpong disebut satu-satunya fasilitas semacam itu di Indonesia; BRIN menekankan perlunya menambah kapasitas penyimpanan dan memodernisasi teknologi untuk mendukung PLTN.', 'The radioactive waste processing installation at Serpong is called the only one of its kind in Indonesia; BRIN stressed the need to raise storage capacity and modernise technology to support nuclear plants.') }, 'li-limbah', 'media'),
        b({ k: 'hlw', teks: L('Bahan bakar bekas dan limbah tingkat tinggi sedikit volumenya tetapi memuat sebagian besar radioaktivitas; ditampung sementara di kolam atau wadah kering sementara penyimpanan geologi dalam masih disiapkan; strategi nasional pengelolaan limbah dan bahan bakar bekas sedang disusun.', 'Spent fuel and high-level waste are small in volume but hold most radioactivity; stored in pools or dry casks while deep geological storage is still being prepared; a national strategy for waste and spent fuel is being drafted.') }, 'kompas-limbah', 'cuplikan'),
      ],
      keselamatan: [
        b({ k: 'pp54', teks: L('PP 54/2012 mengatur keselamatan dan keamanan instalasi nuklir.', 'Government Regulation 54/2012 governs safety and security of nuclear installations.') }, 'pp54', 'resmi'),
        b({ k: 'pp46', teks: L('PP 46/2009 menetapkan batas pertanggungjawaban kerugian nuklir.', 'Government Regulation 46/2009 sets the limit of liability for nuclear damage.') }, 'pp46', 'resmi'),
        b({ k: 'proteksi', teks: L('Peraturan 1/2026 mengatur sistem proteksi fisik instalasi dan bahan nuklir.', 'Regulation 1/2026 governs the physical protection system for nuclear installations and material.') }, 'pbp', 'resmi'),
        b({ k: 'npt', teks: L('Indonesia menandatangani NPT 2 Maret 1970 dan meratifikasinya lewat UU 8/1978.', 'Indonesia signed the NPT on 2 March 1970 and ratified it through Law 8/1978.') }, 'idnuk', 'via-pihak-ketiga'),
      ],
    },
    celah: [
      'Kriteria evaluasi tapak yang dipakai ESDM untuk 28 tapak dan koordinat tapak tidak dipublikasikan di sumber yang dibaca; peta tapak tidak ditampilkan.',
      'Struktur dan anggota NEPIO tidak dirinci di sumber yang dibaca; rancangan Perpres belum terbit.',
      'Angka biaya per kW atau harga jual listrik PLTN Indonesia tidak ditemukan; pembanding memakai proyek luar negeri.',
      'Daya reaktor Kartini dan Bandung tidak seragam antar-sumber (Kartini 50 atau 100 kW, TRIGA Bandung 250 kW sampai 2 MW); masa berlaku izin operasi ketiga reaktor juga berbeda antar-sumber dan tidak ditampilkan.',
      'Survei opini nasional independen sesudah 2024 tidak ditemukan; survei Bangka Belitung 2025 melibatkan pengembang proyek.',
      'Status nuklir Malaysia, Singapura, Myanmar, Kamboja, dan Laos tidak ditemukan dalam sumber yang dapat diverifikasi; hanya Vietnam, Filipina, dan Thailand yang ditampilkan.',
      'Volume dan kapasitas penyimpanan limbah radioaktif nasional serta status strategi nasional pengelolaan limbah dan bahan bakar bekas tidak ditemukan sebagai angka; hanya pernyataan perlunya menambah kapasitas.',
      'Fasilitas pengayaan atau fabrikasi bahan bakar komersial tidak ditemukan; rantai pasok nuklir belum ada di global/pemasok_lain.json.',
      'Beberapa butir hanya terbaca dari ringkasan hasil pencarian atau judul (bertingkat bukti cuplikan atau judulnya berketerangan); teks penuh belum dibaca. Halaman Bapeten dan Enerdata tertentu tidak dapat dibuka (403), sehingga tidak dipaksa.',
    ],
  };
}

/** Pemeriksa: id rujukan hidup di berkas aslinya, sumber unik, bukti dikenal, URL https atau berkas lokal. */
export function periksa(d) {
  const must = (set, arr, nama) => { for (const i of arr) if (!set.has(i)) throw new Error(`${nama} tidak ada: ${i}`); };
  const enb = j('public/data/energi_baru.json').baris.filter((x) => x.bagian === 'nuklir');
  const tp = j('public/data/topik/nuklir.json');
  const pj = new Set([...j('public/data/proyek.json').baris, ...j('public/data/proyek_terpadu.json').baris].map((x) => x.id));
  const isu = new Set(j('public/data/isu.json').baris.map((x) => x.id));
  const reg = new Set(j('public/data/regulasi.json').baris.map((x) => x.id));
  const org = new Set(j('public/data/organisasi.json').baris.map((x) => x.id));
  const prog = new Set(j('public/data/program_analisis.json').baris.map((x) => x.kode));
  must(new Set(enb.map((x) => x.id)), d.rujukan.enb_ids, 'energi_baru');
  for (const [k, bab] of Object.entries(d.rujukan.topik_bab)) { const x = tp.bab[bab]; if (!x || !['tabel', 'grafik'].includes(x.tipe)) throw new Error('bab topik tak valid: ' + k); }
  must(pj, d.rujukan.proyek_ids, 'proyek'); must(isu, d.rujukan.isu_ids, 'isu'); must(reg, d.rujukan.regulasi_lembaga.concat(d.rujukan.regulasi_selamat), 'regulasi'); must(prog, [d.rujukan.program_kode], 'program');
  must(org, d.lembaga.peta.map((p) => p.org_id).filter(Boolean), 'org lembaga'); must(org, d.riset.org_ids, 'org riset');
  must(org, d.teknologi.vendor.flatMap((v) => [v.org_id, ...(v.org_tambahan || [])]).filter(Boolean), 'org vendor');
  const sid = new Set(d.sumber.map((s) => s.id));
  if (sid.size !== d.sumber.length) throw new Error('id sumber ganda');
  for (const s of d.sumber) {
    if (!/^https:\/\/|^\/data\//.test(s.url)) throw new Error('url ' + s.id);
    if (!TB.includes(s.tingkat_bukti)) throw new Error('bukti ' + s.id);
    if (/antaranews/.test(s.url)) throw new Error('Antara dilarang: ' + s.id);
  }
  const pakai = [...d.rencana.angka, ...d.rencana.butir, ...d.lembaga.nepio, ...d.lembaga.peta.flatMap((p) => p.fakta), ...d.lembaga.tahap_izin, ...d.lembaga.kerja_sama, ...d.riset.reaktor, ...d.riset.revitalisasi, ...d.teknologi.vendor, d.teknologi.pelajaran, ...d.tapak.sorotan, ...d.bahan.uranium, ...d.bahan.thorium, ...d.bahan.daur, ...d.opini.survei, ...d.opini.persepsi, ...d.opini.alasan_tolak, ...d.asean.negara, d.biaya.barakah, d.biaya.smr_foak_usd_per_kw, ...d.biaya.lembaga, ...d.biaya.skema, ...d.selamat.limbah, ...d.selamat.keselamatan];
  for (const x of pakai) {
    for (const id of [x.sumber_id, ...(x.sumber_tambahan || []), x.sumber_tahun_id].filter(Boolean)) if (!sid.has(id)) throw new Error('sumber_id tak dikenal: ' + id);
    if (!x.sumber_id) throw new Error('butir tanpa sumber: ' + JSON.stringify(x).slice(0, 80));
    if (!TB_BUTIR.includes(x.tingkat_bukti)) throw new Error('tingkat butir: ' + x.tingkat_bukti);
  }
  if (d.opini.survei.some((s) => s.nilai < 0 || s.nilai > 100)) throw new Error('persen di luar 0-100');
  if (d.bahan.uranium[0].nilai !== d.bahan.uranium[1].nilai + d.bahan.uranium[2].nilai) throw new Error('uranium nasional bukan jumlah Babel dan Kalbar');
  if (!/^\d{2}$/.test(d.tapak.sorotan[0].prov_kode)) throw new Error('kode provinsi');
  return { sumber: d.sumber.length, baru: SUMBER_BARU.length, enb: d.rujukan.enb_ids.length, vendor: d.teknologi.vendor.length, celah: d.celah.length };
}

async function cekUrl() {
  const { ambil } = await import('../pipa/_panen_sopan.mjs');
  for (const s of sumberGabung().filter((x) => x.url.startsWith('https://'))) { try { await ambil(s.url, { method: 'HEAD' }); console.log('OK ', s.id); } catch (e) { console.log('GAGAL', s.id, e.message); if (/403|429/.test(e.message)) break; } }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--bangun') { const d = bangun(); console.log(periksa(d)); fs.writeFileSync(path.join(ROOT, 'public/data/nuklir.json'), JSON.stringify(d, null, 1) + '\n'); }
  else if (a === '--selftest') console.log(periksa(bangun()));
  else if (a === '--cek-url') await cekUrl();
  else console.log('pakai: --bangun | --selftest | --cek-url');
}
