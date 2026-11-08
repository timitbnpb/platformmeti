#!/usr/bin/env node
// Hidro ujung ke ujung -> public/data/hidro.json.
// MERUJUK data yang sudah ada lewat id (proyek_terpadu.json, air_energi.json, riset/pumped_storage_offshore.json, ruptl.json, biaya_bangun.json,
// pendanaan.json, regulasi.json, isu.json, organisasi.json, global/pemasok_lain.json, topik/hidro.json); sumber yang sudah ada dipinjam dari topik/hidro.json.
// Data baru hanya butir yang dibaca dari sumber publik tanggal T (tiap butir bersumber + bertingkat bukti); yang tidak ditemukan ada di `celah`. TIDAK mengarang.
// Panen mentah memakai scripts/pipa/_panen_sopan.mjs (robots, jeda >= 2 dtk, stop 403/429). Pakai: --bangun | --selftest | --cek-url
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const T = '2026-11-08';
const S = (id, judul, penerbit, url, tahun, tb = 'media') => ({ id, judul, penerbit, url, tahun, tingkat_bukti: tb, tanggal_periksa: T });
const L = (id, en) => ({ id, en });
const BUKTI = { resmi: 'resmi', media: 'media', kajian: 'kajian', 'via-pihak-ketiga': 'via-pihak-ketiga', editorial: 'editorial' };

/** Sumber yang dipinjam dari topik/hidro.json (id sama). */
const PINJAM = ['kap', 'ruptl', 'perpres112', 'aiib', 'btjp', 'btbhr', 'btboc', 'btcgs', 'jgsync', 'petro', 'bisnis24', 'rricis', 'enerdata', 'kybn', 'kybhr', 'dak'];

export const SUMBER_BARU = [
  S('esdm-hidro', 'Percepat upaya transisi energi, Menteri ESDM dorong pemanfaatan tenaga hidro (potensi 95 GW; terpasang 6,7 GW per November 2023)', 'Kementerian ESDM', 'https://www.esdm.go.id/id/media-center/arsip-berita/percepat-upaya-transisi-energi-menteri-esdm-dorong-pemanfaatan-tenaga-hidro', 2023, 'resmi'),
  S('kompas-95gw', 'Potensi energi hidro 95 GW, pemanfaatan PLTA baru 7 persen', 'Kompas Lestari', 'https://lestari.kompas.com/read/2023/10/31/180000986/potensi-energi-hidro-95-gw-pemanfaatan-plta-baru-7-persen', 2023),
  S('undip-potensi', 'Jurnal Energi Baru dan Terbarukan (Undip): potensi tenaga air nasional sekitar 94.449 MW, PLTA sekitar 75.091 MW (angka dari cuplikan hasil pencarian)', 'Universitas Diponegoro', 'https://ejournal2.undip.ac.id/index.php/jebt/article/download/10036/6592', 2023, 'kajian'),
  S('li-72gw', 'Kapasitas PLTA akan melonjak menjadi 72 GW pada 2060 (target lebih dari 10 GW pada 2030; pumped storage 4,2 GW)', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/11752/kapasitas-plta-akan-melonjak-menjadi-72-gw-pada-2060', 2023),
  S('it-247', 'PUPR sebut 247 bendungan berpotensi hasilkan listrik hijau 1.470 MW (PLTS), PLTA 925 MW di 73 bendungan; studi awal belum dikoordinasikan dengan PLN', 'InvestorTrust', 'https://investortrust.id/business/43130/pupr-sebut-247-bendungan-berpotensi-hasilkan-listrik-hijau-sebesar-1470-mw', 2024),
  S('idx-64', 'Rampung bangun 64 bendungan, PUPR mampu hasilkan listrik 143 MW (PLTA)', 'IDX Channel', 'https://www.idxchannel.com/economics/rampung-bangun-64-bendungan-pupr-mampu-hasilkan-listrik-143-megawatt/all', 2022),
  S('it-10bendungan', 'Dorong swasembada energi, Kementerian PU lelang 10 bendungan prioritas (KPBU PLTA/PLTM; 35 bendungan masuk RUPTL, 250,51 MW; Leuwikeris 7,4 MW)', 'InvestorTrust', 'https://investortrust.id/business/58388/dorong-swasembada-energi-kementerian-pu-lelang-10-bendungan-prioritas', 2025),
  S('cnbc-fpv', 'RI punya potensi PLTS terapung di bendungan hingga 13,9 GW', 'CNBC Indonesia', 'https://www.cnbcindonesia.com/news/20250616162924-4-641436/ri-punya-potensi-plts-terapung-di-bendungan-hingga-139-gw', 2025),
  S('bca-cisokan', 'PLN Enjiniring kawal pumped storage 1.040 MW pertama di Indonesia (empat unit 260 MW; Mei 2026)', 'BCA Sekuritas', 'https://bcasekuritas.co.id/latest-news/news/pln-enjiniring-kawal-pumped-storage-1040-mw-pertama-di-indonesia', 2026),
  S('astaldi-cisokan', 'Upper Cisokan: kerja sama operasi Daelim (pimpinan 40%), Astaldi (30%), WIKA (30%)', 'Astaldi', 'https://www.astaldi.com/en/node/1323', 2018, 'resmi'),
  S('petro-cisokan-siap', 'PLTA Upper Cisokan ready for construction (kontrak ditandatangani dengan Daelim Industrial)', 'Petromindo', 'https://www.petromindo.com/news/article/plta-upper-cisokan-ready-for-construction', 2018),
  S('gem-cisokan', 'Upper Cisokan hydroelectric plant (GEM Wiki)', 'Global Energy Monitor', 'https://gem.wiki/Upper_Cisokan_hydroelectric_plant', 2026, 'via-pihak-ketiga'),
  S('petro-laut', 'PLN studies 1 GW seawater pumped storage project despite rising BESS competition', 'Petromindo', 'https://www.petromindo.com/news/article/pln-studies-1-gw-seawater-pumped-storage-project-despite-rising-bess-competition', 2026),
  S('aiib-ps', 'AIIB P000512: Development of Pumped Storage Hydropower in Java Bali System', 'AIIB', 'https://www.aiib.org/en/projects/details/2022/_download/indonesia/AIIB-P000512-Indonesia-Development-of-Pumped-Storage-Hydropower-in-Java-Bali-System.pdf', 2022, 'resmi'),
  S('adb-hidro', 'ADB 58333-001: Hydropower Development for Energy Security and Grid Flexibility (pinjaman US$400 juta ke anak usaha PLN, status Proposed)', 'ADB, via Rights in Development', 'https://ewsdata.rightsindevelopment.org/projects/ADB-58333-001/pdf', 2026, 'via-pihak-ketiga'),
  S('tempo-jica', 'Japan lends Indonesia 43.6bn for hydropower development, disaster resilience program (Peusangan II, 13,629 miliar yen)', 'Tempo', 'https://en.tempo.co/read/1711570/japan-lends-indonesia-43-6bn-for-hydropower-development-disaster-resilience-program', 2023),
  S('proximo-jica', 'JICA concluded a JPY173.667 billion loan agreement for four projects including Peusangan hydropower', 'Proximo Infra', 'https://www.proximoinfra.com/news/55595', 2023),
  S('mb-mentarang-26', 'Ketika risiko lingkungan, sosial, dan bencana bayangi proyek PLTA Mentarang (1.375 MW; genangan sekitar 22.604 ha; sekitar 243,66 ha Taman Nasional Kayan Mentarang)', 'Mongabay Indonesia', 'https://mongabay.co.id/2026/06/10/ketika-risiko-lingkungan-sosial-dan-bencana-bayangi-proyek-plta-mentarang/', 2026),
  S('mb-seboyo', 'Nasib warga Seboyo terelokasi demi proyek PLTA Mentarang', 'Mongabay Indonesia', 'https://mongabay.co.id/2026/04/10/nasib-warga-seboyo-terelokasi-demi-proyek-plta-mentarang/', 2026),
  S('mb-bendungan-raksasa', 'Bendungan PLTA raksasa, risiko gusur masyarakat dan hutan', 'Mongabay Indonesia', 'https://mongabay.co.id/2025/03/14/bendungan-plta-raksasa-risiko-gusur-masyarakat-dan-hutan/', 2025),
  S('enerdata-borneo', 'Indonesia launches construction of 14 GW hydro project in Borneo (Kayan)', 'Enerdata', 'https://www.enerdata.net/publications/daily-energy-news/indonesia-launches-construction-14-gw-hydro-project-borneo.html', 2023),
  S('petro-kayan-fc', 'Kayan Hydropower targets Q1 2026 financial close for major hydropower project', 'Petromindo', 'https://ftp.petromindo.com/news/article/kayan-hydropower-targets-q1-2026-financial-close-for-major-hydropower-project', 2025),
  S('esdm-bt-26', 'Antisipasi krisis listrik Sumatera, operasional PLTA Batang Toru dipercepat', 'Kementerian ESDM', 'https://esdm.go.id/id/media-center/arsip-berita/antisipasi-krisis-listrik-sumatera-operasional-plta-batang-toru-dipercepat', 2026, 'resmi'),
  S('bisnis-bt-26', 'ESDM kebut operasional PLTA Batang Toru, antisipasi krisis listrik Sumatra', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20260731/44/1992546/esdm-kebut-operasional-plta-batang-toru-antisipasi-krisis-listrik-sumatra', 2026),
  S('jp-bt-26', 'Batang Toru hydropower plant fast-tracked to stabilize Sumatra fragile grid', 'The Jakarta Post', 'https://www.thejakartapost.com/business/2026/07/31/batang-toru-hydropower-plant-fast-tracked-to-stabilize-sumatras-fragile-grid', 2026),
  S('it-bt-banjir', 'Batang Toru hydro dam begins flooding as regulators clear permits', 'InvestorTrust', 'https://investortrust.id/business/118983/powering-through-deadlock-batang-toru-hydro-dam-begins-flooding-as-regulators-clear-permits-ahead-of-holiday-surge', 2026),
];

function sumberGabung() {
  const tp = j('public/data/topik/hidro.json').sumber, out = [];
  for (const id of PINJAM) {
    const s = tp[id]; if (!s) throw new Error('sumber topik tidak ada: ' + id);
    out.push({ id, judul: s.judul, penerbit: s.penerbit, url: s.url, tahun: s.tahun, tingkat_bukti: BUKTI[s.bukti] || 'media', tanggal_periksa: s.tanggal || T });
  }
  return out.concat(SUMBER_BARU);
}

export function bangun() {
  const pt = j('public/data/proyek_terpadu.json').baris.filter((b) => b.tek === 'hidro');
  const das = j('public/data/air_energi.json').das;
  const ps = j('public/data/riset/pumped_storage_offshore.json').baris.filter((b) => b.jenis === 'pumped-storage');
  return {
    lapis: 'hidro', dibangun_pada: T, tanggal: T,
    keterangan: 'Modul hidro ujung ke ujung. Berkas ini hanya memuat rujukan id ke data yang sudah ada dan butir baru bersumber; angka proyek, DAS, RUPTL, biaya, pendanaan, regulasi, dan isu dibaca dari berkas aslinya saat runtime.',
    sumber: sumberGabung(),
    rujukan: {
      proyek_ids: pt.map((b) => b.id),
      das_ids: das.map((d) => d.id),
      ps_ids: ps.map((b) => b.id),
      kelas_batas_mw: 10,
      pemasok_segmen: 'hidro',
      isu_ids: ['batang-toru', 'perizinan-lahan'],
      kasus_topik_ids: ['batangtoru', 'kayan', 'jatigede', 'cisokan', 'pltmhmati'],
      regulasi_ids: ['perpres-112-2022', 'permen-esdm-19-2015', 'permen-esdm-12-2014', 'permen-esdm-22-2014', 'permen-b104458-09-prt-m-2016-2016', 'permen-b159770-09-prt-m-2017-2017', 'perda-b120470-16-2019', 'perpres-88-2012'],
      biaya_skala_ids: ['plta-dunia', 'pltm-asia-lain'],
      biaya_komponen_id: 'plta-eropa-2021',
      pendanaan_ids: ['pd_wb_P112158', 'pd_wb_P172256', 'pw_P178779', 'pd_aiib_development-of-pumped-storage-hydropower-in-java-bali-system-the-proje', 'pi_NO_BRC_971277882_INS_20_0002', 'pi_NO_BRC_971277882_INS_23_0002', 'pi_NO_BRC_971277882_INS_25_0011', 'pi_DE_1_201468040', 'pi_DE_1_201568252', 'pi_NL_1_PPR_18737', 'pi_XM_DAC_47086_265FE2AA_InfraCo_Asia', 'sk_jica', 'sk_aiib', 'sk_acgf', 'sk_greenbook', 'sk_sdg_one'],
      status_urut: ['beroperasi', 'konstruksi', 'izin', 'rencana', 'ditunda', 'tidak-diketahui', 'dibatalkan'],
      air_energi_href: '/air-energi',
    },
    sumber_daya: {
      potensi_mw: [
        { nilai: 95000, tahun: 2023, sumber_id: 'esdm-hidro', tingkat_bukti: 'resmi', ket: L('Potensi tenaga hidro nasional menurut Kementerian ESDM; pemanfaatan baru sekitar 7%.', 'National hydropower potential per the Ministry of ESDM; utilisation only about 7%.') },
        { nilai: 94449, tahun: 2023, sumber_id: 'undip-potensi', tingkat_bukti: 'kajian', ket: L('Jurnal Undip: total sekitar 94.449 MW, di antaranya PLTA sekitar 75.091 MW (cuplikan pencarian, belum dibaca penuh).', 'Undip journal: about 94,449 MW in total, of which PLTA about 75,091 MW (search snippet, not read in full).') },
      ],
      terpasang_mw: [
        { nilai: 7587.47, tahun: 2025, sumber_id: 'kap', tingkat_bukti: 'resmi', ket: L('IRENA: dipakai sebagai angka utama (selaras topik hidro).', 'IRENA: used as the headline figure (consistent with the hydro topic).') },
        { nilai: 6700, tahun: 2023, sumber_id: 'esdm-hidro', tingkat_bukti: 'resmi', ket: L('Pernyataan Menteri ESDM per November 2023.', 'Statement by the Minister of ESDM as of November 2023.') },
      ],
      target: [
        { k: 'gw2030', nilai: 10, satuan: 'GW', tahun: 2030, teks: L('Target PLTA lebih dari 10 GW pada 2030.', 'Target of more than 10 GW of hydro by 2030.'), sumber_id: 'li-72gw', tingkat_bukti: 'media' },
        { k: 'gw2060', nilai: 72, satuan: 'GW', tahun: 2060, teks: L('Target 72 GW pada 2060.', 'Target of 72 GW by 2060.'), sumber_id: 'li-72gw', tingkat_bukti: 'media' },
        { k: 'ps', nilai: 4.2, satuan: 'GW', tahun: 2060, teks: L('Pumped storage 4,2 GW dalam skenario yang sama.', 'Pumped storage of 4.2 GW in the same scenario.'), sumber_id: 'li-72gw', tingkat_bukti: 'media' },
      ],
      provinsi_topik_bab: '8',
      catatan_beda: L('Potensi dan terpasang berbeda menurut definisi (PLTA saja atau termasuk mini/mikro) dan tanggal data; semua versi ditampilkan, tidak ada yang dipilih diam-diam.', 'Potential and installed capacity differ by definition (large only or incl. mini/micro) and data date; all versions are shown, none chosen silently.'),
    },
    pumped: {
      butir: [
        { k: 'cisokan_desain', proyek_id: 'pj_0289', teks: L('Upper Cisokan (Jawa Barat): ruang mesin bawah tanah dengan empat unit pompa-turbin Francis reversibel 260 MW (total 1.040 MW), PLTA pumped storage pertama Indonesia.', 'Upper Cisokan (West Java): underground powerhouse with four 260 MW reversible Francis pump-turbine units (1,040 MW total), Indonesia first pumped storage plant.'), sumber_id: 'bca-cisokan', tingkat_bukti: 'media' },
        { k: 'cisokan_sipil', proyek_id: 'pj_0289', teks: L('Pekerjaan bendungan dan sipil dipegang kerja sama operasi Daelim (pimpinan), Astaldi, dan WIKA.', 'Dam and civil works are held by a joint venture of Daelim (leader), Astaldi, and WIKA.'), sumber_id: 'astaldi-cisokan', tingkat_bukti: 'resmi' },
        { k: 'cisokan_jadwal', proyek_id: 'pj_0289', teks: L('Jadwal COD berbeda antar sumber: 2028 (RUPTL dan media 2024), 2027 (GEM). Kemajuan terbaru hanya dari berita; belum ada pernyataan PLN bertanggal yang membenarkan satu tahun.', 'COD differs across sources: 2028 (RUPTL and 2024 media), 2027 (GEM). Latest progress is from news only; no dated PLN statement confirms a single year.'), sumber_id: 'gem-cisokan', tingkat_bukti: 'via-pihak-ketiga' },
        { k: 'cisokan_dana', proyek_id: 'pj_0289', teks: L('Bank Dunia meminjamkan US$380 juta untuk pumped storage 1 GW; pembiayaan lebih lanjut lewat proyek Bank Dunia P172256 dan AIIB P000512.', 'The World Bank lent US$380 million for the 1 GW pumped storage; further financing through World Bank P172256 and AIIB P000512.'), sumber_id: 'enerdata', tingkat_bukti: 'media' },
        { k: 'aiib', teks: L('AIIB menyiapkan proyek pengembangan pumped storage di sistem Jawa-Bali.', 'AIIB prepared the pumped storage development project in the Java-Bali system.'), sumber_id: 'aiib-ps', tingkat_bukti: 'resmi' },
        { k: 'laut', teks: L('PLN mengkaji pumped storage air laut 1 GW, di tengah persaingan baterai (BESS).', 'PLN is studying a 1 GW seawater pumped storage project amid BESS competition.'), sumber_id: 'petro-laut', tingkat_bukti: 'media' },
      ],
    },
    bendungan: {
      angka: [
        { k: 'a247', nilai: 925, satuan: 'MW', n: 73, teks: L('Studi awal PUPR (Oktober 2024): PLTA 925 MW pada 73 dari 247 bendungan (186 eksisting dan 61 baru); belum dikoordinasikan dengan PLN.', 'PUPR preliminary study (October 2024): 925 MW of hydro at 73 of 247 dams (186 existing, 61 new); not yet coordinated with PLN.'), sumber_id: 'it-247', tingkat_bukti: 'media' },
        { k: 'a64', nilai: 143, satuan: 'MW', n: 64, teks: L('PUPR (Maret 2022): PLTA 143 MW dari 64 bendungan yang selesai dibangun.', 'PUPR (March 2022): 143 MW of hydro from 64 completed dams.'), sumber_id: 'idx-64', tingkat_bukti: 'media' },
        { k: 'a35', nilai: 250.51, satuan: 'MW', n: 35, teks: L('35 bendungan masuk RUPTL dengan potensi total 250,51 MW (Maret 2025).', '35 dams are in the RUPTL with total potential of 250.51 MW (March 2025).'), sumber_id: 'it-10bendungan', tingkat_bukti: 'media' },
        { k: 'fpv', nilai: 13.9, satuan: 'GW', n: null, teks: L('Pembanding: potensi PLTS terapung di bendungan PUPR sekitar 13,9 GW (studi RUPTL 2025-2034), jauh di atas potensi PLTA.', 'Benchmark: floating PV potential on PUPR dams of about 13.9 GW (RUPTL 2025-2034 study), far above hydro potential.'), sumber_id: 'cnbc-fpv', tingkat_bukti: 'media' },
      ],
      prioritas: [
        { nama: 'Bulango Ulu', prov: 'Gorontalo', prov_kode: '75' }, { nama: 'Way Apu', prov: 'Maluku', prov_kode: '81' },
        { nama: 'Lau Simeme', prov: 'Sumatera Utara', prov_kode: '12' }, { nama: 'Keureuto', prov: 'Aceh', prov_kode: '11' },
        { nama: 'Cipanas', prov: 'Jawa Barat', prov_kode: '32' }, { nama: 'Pamukkulu', prov: 'Sulawesi Selatan', prov_kode: '73' },
        { nama: 'Batang Tongar', prov: 'Sumatera Barat', prov_kode: '13' }, { nama: 'Batang Batahan', prov: 'Sumatera Utara', prov_kode: '12' },
        { nama: 'Leuwikeris', prov: 'Jawa Barat', prov_kode: '32', mw: 7.4, proyek_id: 'pj_0089' }, { nama: 'Bener', prov: 'Jawa Tengah', prov_kode: '33' },
      ].map((b) => ({ ...b, skema: 'KPBU PLTA/PLTM', sumber_id: 'it-10bendungan', tingkat_bukti: 'media' })),
      operasi_ids: ['pj_0079'],
    },
    ruptl: {
      sumber_id: 'ruptl',
      catatan: L('Angka RUPTL dibaca dari ruptl.json (skenario RE Base); jadwal proyek besar sering bergeser.', 'RUPTL figures are read from ruptl.json (RE Base scenario); schedules of large projects often slip.'),
    },
    biaya: {
      asumsi: { wacc_persen: [6, 8, 10, 12], umur_tahun: 40, opex_persen: [2, 2.5], label: 'Hipotesis',
        ket: L('Faktor pemulihan modal dihitung dari WACC dan umur ekonomis 40 tahun; WACC adalah asumsi METI untuk perbandingan, bukan data sumber.', 'The capital recovery factor is computed from WACC and a 40-year economic life; WACC is a METI assumption for comparison, not source data.') },
    },
    pemasok: {
      unit_pemasok: [],
      kontraktor: [
        { nama: 'Sinohydro (PowerChina)', org_id: 'en_babe1b2206', proyek: L('PLTA Batang Toru 510 MW: kontraktor pekerjaan sipil/EPC (rincian paket belum ditemukan)', 'Batang Toru 510 MW: civil/EPC contractor (package details not found)'), sumber_id: 'btcgs', tingkat_bukti: 'via-pihak-ketiga' },
        { nama: 'Daelim Industrial', org_id: null, proyek: L('Upper Cisokan: pimpinan kerja sama operasi pekerjaan sipil dan bendungan', 'Upper Cisokan: leader of the dam and civil works joint venture'), sumber_id: 'petro-cisokan-siap', tingkat_bukti: 'media' },
        { nama: 'Astaldi', org_id: null, proyek: L('Upper Cisokan: anggota kerja sama operasi (30%)', 'Upper Cisokan: joint venture member (30%)'), sumber_id: 'astaldi-cisokan', tingkat_bukti: 'resmi' },
        { nama: 'PT Wijaya Karya (Persero) Tbk', org_id: 'p_a363064837', proyek: L('Upper Cisokan: anggota kerja sama operasi (30%)', 'Upper Cisokan: joint venture member (30%)'), sumber_id: 'astaldi-cisokan', tingkat_bukti: 'resmi' },
      ],
    },
    pendanaan: {
      butir: [
        { k: 'adb', lembaga: 'Asian Development Bank', org_id: 'in_9a375db244', teks: L('ADB mencatat usulan pinjaman US$400 juta untuk Pengembangan Tenaga Air bagi Ketahanan Energi dan Fleksibilitas Jaringan, penerima anak usaha PLN (Nusantara Power); status Proposed pada catatan yang dibaca.', 'ADB lists a proposed US$400 million loan for Hydropower Development for Energy Security and Grid Flexibility, borrower a PLN subsidiary (Nusantara Power); status Proposed in the record read.'), sumber_id: 'adb-hidro', tingkat_bukti: 'via-pihak-ketiga' },
        { k: 'jica', lembaga: 'Japan International Cooperation Agency', org_id: 'in_eb327fef3a', teks: L('JICA: pinjaman untuk PLTA Peusangan II di Aceh (13,629 miliar yen), bagian dari pinjaman 173,667 miliar yen untuk empat proyek.', 'JICA: loan for the Peusangan II hydropower project in Aceh (JPY 13.629 billion), part of a JPY 173.667 billion loan for four projects.'), sumber_id: 'tempo-jica', tingkat_bukti: 'media', sumber_id2: 'proximo-jica' },
        { k: 'wb', lembaga: 'World Bank', org_id: 'in_0d1892cd4f', teks: L('Bank Dunia: pinjaman US$380 juta untuk pumped storage 1 GW (Upper Cisokan); proyek P172256 dan P178779 (Matenggeng) tercatat di basis pendanaan METI.', 'World Bank: US$380 million loan for the 1 GW pumped storage (Upper Cisokan); projects P172256 and P178779 (Matenggeng) are in the METI funding base.'), sumber_id: 'enerdata', tingkat_bukti: 'media' },
        { k: 'cn', lembaga: 'Export-Import Bank of China', org_id: 'en_e052307be5', teks: L('Batang Toru dibiayai kredit sindikasi Bank of China, Eximbank China, dan lain-lain; Bank of China menyatakan meninjau pendanaan setelah protes habitat orangutan (2019).', 'Batang Toru is financed by a syndicated loan from Bank of China, China Eximbank and others; Bank of China said it would review funding after orangutan-habitat protests (2019).'), sumber_id: 'btboc', tingkat_bukti: 'media' },
      ],
    },
    isu: {
      baru: [
        { id: 'mentarang', nama: 'PLTA Mentarang Induk (1.375 MW)', jenis: 'berjalan', lokasi: L('Malinau, Kalimantan Utara', 'Malinau, North Kalimantan'), proyek_id: 'gem_hydropower_L100000602132', org_id: 'p_cab3e74cce', teks: L('Bendungan setinggi 235 m (CFRD) dengan genangan sekitar 22.604 ha menurut dokumen AMDAL yang dikutip Nugal; sekitar 243,66 ha Taman Nasional Kayan Mentarang berpotensi tergenang. Batu pertama 1 Maret 2023; 28 keluarga Punan Tebunyau direlokasi dari Seboyo ke Paking. Pengembang menyatakan proyek masih tahap awal (April 2026). Tanggapan pengembang belum ada.', 'A 235 m CFRD dam with a reservoir of about 22,604 ha per the AMDAL as cited by Nugal; about 243.66 ha of Kayan Mentarang National Park may be flooded. Groundbreaking 1 March 2023; 28 Punan Tebunyau families relocated from Seboyo to Paking. The developer said the project is still at an early stage (April 2026). No developer response yet.'), sumber_id: 'mb-mentarang-26', sumber_id2: 'mb-seboyo', tingkat_bukti: 'media' },
        { id: 'kayan_2026', nama: 'Kayan Cascade, kelanjutan', jenis: 'mundur', lokasi: L('Kalimantan Utara', 'North Kalimantan'), proyek_id: 'gem_hydropower_L100000602115', org_id: 'p_cab3e74cce', teks: L('Konstruksi dimulai 2023 untuk rencana hingga 14 GW di Kalimantan; mitra besar mundur dan penutupan pembiayaan ditargetkan kuartal I 2026. Realisasi penutupan pembiayaan belum ditemukan.', 'Construction began in 2023 for a plan of up to 14 GW in Kalimantan; major partners withdrew and financial close was targeted for Q1 2026. Actual financial close has not been found.'), sumber_id: 'enerdata-borneo', sumber_id2: 'petro-kayan-fc', tingkat_bukti: 'media' },
        { id: 'batangtoru_2026', nama: 'PLTA Batang Toru, status 2026', jenis: 'berjalan', lokasi: L('Tapanuli, Sumatera Utara', 'Tapanuli, North Sumatra'), proyek_id: 'pj_0066', org_id: 'p_ff7a390a42', teks: L('Pemerintah mempercepat operasi (target komersial akhir 2026) untuk menopang jaringan Sumatra; penggenangan waduk dimulai, tetapi izin pinjam pakai kawasan hutan dan relokasi menara transmisi masih diproses, dan izin NSHE termasuk yang dicabut Januari 2026 lalu dipersoalkan lewat audit ulang.', 'The government is accelerating operation (commercial target end-2026) to support the Sumatra grid; reservoir impoundment has begun, but the forest-area use permit and transmission tower relocation are still being processed, and NSHE permit revocation in January 2026 is contested through a re-audit.'), sumber_id: 'esdm-bt-26', sumber_id2: 'it-bt-banjir', tingkat_bukti: 'resmi' },
      ],
    },
    celah: [
      'Potensi per DAS (MW per daerah aliran sungai) tidak ditemukan dalam sumber terbuka; yang tersedia: potensi per provinsi (topik hidro) dan 44 sub-DAS tempat PLTA berdiri beserta skor kerentanan air (air_energi.json), bukan potensi yang belum dibangun.',
      'Daftar lengkap bendungan PUPR yang dapat diberi PLTA beserta kapasitas per bendungan tidak ditemukan; yang ada hanya angka agregat (925 MW di 73 bendungan, 250,51 MW di 35 bendungan RUPTL) dan 10 bendungan prioritas KPBU tanpa MW, kecuali Leuwikeris 7,4 MW.',
      'Pemasok turbin dan generator per unit belum terverifikasi: Voith, Andritz, GE Vernova, Toshiba, Harbin, Dongfang, Litostroj, Gilkes, dan Cink terdaftar sebagai pemasok hidro di basis, tetapi pesanan unit untuk proyek Indonesia belum ditemukan; paket elektromekanis Upper Cisokan belum ditemukan.',
      'Jadwal COD Upper Cisokan berbeda antar sumber (2027, 2028, 2030) dan tidak ada pernyataan PLN bertanggal yang membenarkan satu tahun.',
      'Biaya modal dan LCOE khusus Indonesia untuk PLTA besar tidak tersedia; hitungan memakai data IRENA (rata-rata dunia 2024) dan WACC asumsi METI.',
      'Harga patokan PLTA menurut Perpres 112/2022 belum ditranskripsi di basis; hitungan pendapatan tidak ditampilkan.',
      'UU 17/2019 tentang Sumber Daya Air dan aturan izin pemanfaatan air belum ada di basis regulasi METI.',
      'Jumlah warga terdampak Kayan dan Mentarang secara total belum dilaporkan sumber yang dibaca; hanya kasus relokasi Seboyo (28 keluarga).',
      'Pencocokan tertaut pembiayaan Kayan (penutupan pembiayaan 2026) dan pesanan turbin Mentarang belum ditemukan.',
    ],
  };
}

/** Pemeriksa: id rujukan hidup di berkas aslinya, sumber unik, bukti dikenal, URL https atau berkas lokal. */
export function periksa(d) {
  const ids = (rel, f = (x) => x.baris) => new Set(f(j(rel)).map((x) => x.id));
  const pt = ids('public/data/proyek_terpadu.json'), isu = ids('public/data/isu.json'), reg = ids('public/data/regulasi.json'), org = ids('public/data/organisasi.json');
  const pend = ids('public/data/pendanaan.json', (x) => x.pendanaan), das = ids('public/data/air_energi.json', (x) => x.das);
  const psr = ids('public/data/riset/pumped_storage_offshore.json');
  const bs = new Set(j('public/data/biaya_bangun.json').skala.map((x) => x.id)), bk = new Set(j('public/data/biaya_bangun.json').komponen.map((x) => x.id));
  const topik = j('public/data/topik/hidro.json'), kasus = new Set(topik.bab['40'].butir.map((x) => x.id));
  const pl = j('public/data/global/pemasok_lain.json');
  const must = (set, arr, nama) => { for (const i of arr) if (!set.has(i)) throw new Error(`${nama} tidak ada: ${i}`); };
  must(pt, d.rujukan.proyek_ids, 'proyek'); must(das, d.rujukan.das_ids, 'das'); must(psr, d.rujukan.ps_ids, 'ps'); must(isu, d.rujukan.isu_ids, 'isu');
  must(kasus, d.rujukan.kasus_topik_ids, 'kasus topik'); must(reg, d.rujukan.regulasi_ids, 'regulasi'); must(bs, d.rujukan.biaya_skala_ids, 'biaya skala'); must(bk, [d.rujukan.biaya_komponen_id], 'biaya komponen');
  must(pend, d.rujukan.pendanaan_ids, 'pendanaan');
  must(org, [...d.pemasok.kontraktor.map((k) => k.org_id), ...d.pendanaan.butir.map((k) => k.org_id), ...d.isu.baru.map((k) => k.org_id)].filter(Boolean), 'org');
  must(pt, [...d.pumped.butir.map((b) => b.proyek_id), ...d.bendungan.prioritas.map((b) => b.proyek_id), ...d.bendungan.operasi_ids, ...d.isu.baru.map((b) => b.proyek_id)].filter(Boolean), 'proyek butir');
  if (!pl.rantai.hidro) throw new Error('rantai hidro tiada di pemasok_lain');
  if (!topik.bab[d.sumber_daya.provinsi_topik_bab]?.baris?.length) throw new Error('bab provinsi topik hilang');
  const sid = new Set(d.sumber.map((s) => s.id));
  if (sid.size !== d.sumber.length) throw new Error('id sumber ganda');
  for (const s of d.sumber) { if (!/^https:\/\//.test(s.url)) throw new Error('url ' + s.id); if (!['resmi', 'media', 'kajian', 'via-pihak-ketiga', 'editorial'].includes(s.tingkat_bukti)) throw new Error('bukti ' + s.id); if (/antaranews/.test(s.url)) throw new Error('Antara dilarang ' + s.id); }
  const pakai = [...d.sumber_daya.potensi_mw, ...d.sumber_daya.terpasang_mw, ...d.sumber_daya.target, ...d.pumped.butir, ...d.bendungan.angka, ...d.bendungan.prioritas, ...d.pemasok.kontraktor, ...d.pendanaan.butir, ...d.isu.baru];
  for (const x of pakai) for (const k of ['sumber_id', 'sumber_id2']) if (x[k] && !sid.has(x[k])) throw new Error('sumber_id tak dikenal: ' + x[k]);
  return { sumber: d.sumber.length, proyek: d.rujukan.proyek_ids.length, das: d.rujukan.das_ids.length, celah: d.celah.length };
}

async function cekUrl() {
  const { ambil } = await import('../pipa/_panen_sopan.mjs');
  for (const s of sumberGabung()) { try { await ambil(s.url, { method: 'HEAD' }); console.log('OK ', s.id); } catch (e) { console.log('GAGAL', s.id, e.message); if (/403|429/.test(e.message)) break; } }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--bangun') { const d = bangun(); console.log(periksa(d)); fs.writeFileSync(path.join(ROOT, 'public/data/hidro.json'), JSON.stringify(d, null, 1) + '\n'); }
  else if (a === '--selftest') console.log(periksa(bangun()));
  else if (a === '--cek-url') await cekUrl();
  else console.log('pakai: --bangun | --selftest | --cek-url');
}
