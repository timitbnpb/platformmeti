#!/usr/bin/env node
// Panas bumi ujung ke ujung -> public/data/panas_bumi.json.
// Berkas ini MERUJUK data yang sudah ada (wkp.json, proyek_terpadu.json, global/pemasok_lain.json, isu.json, regulasi.json, organisasi.json,
// biaya_bangun.json, topik/panas_bumi.json) lewat id; angka dan sumber yang sudah ada dipinjam dari topik/panas_bumi.json (sumber + tabel provinsi
// dan harga patokan), bukan diketik ulang. Data baru hanya butir yang dibaca dari sumber publik tanggal T (tiap butir bersumber + bertingkat bukti);
// yang tidak ditemukan ditulis di `celah`. TIDAK mengarang. Panen mentah (bila perlu) memakai scripts/pipa/_panen_sopan.mjs (UA sopan, robots, jeda >= 2 dtk, stop 403/429),
// unduhan ke $PANAS_BUMI_MENTAH. Pakai: --bangun | --selftest | --cek-url
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const T = '2026-11-08';
const S = (id, judul, penerbit, url, tahun, tb = 'media') => ({ id, judul, penerbit, url, tahun, tingkat_bukti: tb, tanggal_periksa: T });
const L = (id, en) => ({ id, en });

/** Sumber yang dipinjam dari topik/panas_bumi.json (id sama). */
const PINJAM = ['irena', 'perpres112', 'uu21', 'pp7', 'pp49', 'lelang', 'lelang2', 'esmap', 'stanford', 'lemigas', 'smi', 'pmk80', 'wbpisp', 'tgefund', 'waesano', 'jica', 'ruptl', 'medco', 'pge_1gw', 'pge_q3', 'pge_kmj', 'laboh_sc', 'laboh_jbic', 'dedap_se', 'sarulla', 'wayang', 'tge25', 'jetp'];
const BUKTI = { resmi: 'resmi', media: 'media', kajian: 'kajian', 'via-pihak-ketiga': 'via-pihak-ketiga', editorial: 'editorial' };

export const SUMBER_BARU = [
  S('metro-potensi', 'Produksi 2.744 MW, Indonesia posisi 2 dunia sebagai produsen listrik panas bumi (potensi 23.742 MW)', 'Metro TV News', 'https://www.metrotvnews.com/read/ba4CzJYx-produksi-2-744-mw-indonesia-posisi-2-dunia-sebagai-produsen-listrik-panas-bumi', 2025),
  S('cnbc-2744', 'Indonesia siap jadi negara produsen listrik panas bumi terbesar dunia (Bahlil, 17 September 2025: 2.744 MW, sekitar 10% potensi)', 'CNBC Indonesia', 'https://www.cnbcindonesia.com/news/20250917204935-4-667935/indonesia-siap-jadi-negara-produsen-listrik-panas-bumi-terbesar-dunia', 2025),
  S('esdm-terbesar', 'Indonesia siap jadi negara produsen listrik panas bumi terbesar dunia', 'Kementerian ESDM', 'https://www.esdm.go.id/id/media-center/arsip-berita/indonesia-siap-jadi-negara-produsen-listrik-panas-bumi-terbesar-dunia', 2025, 'resmi'),
  S('innerspace-3', 'Project InnerSpace, Laporan Indonesia, Bab 3 (2.653 MW pada 19 lapangan bersuhu tinggi yang beroperasi komersial)', 'Project InnerSpace', 'https://projectinnerspace.org/resources/Indonesia-Report-Bahasa/Chapter-3-Indonesia_INA.pdf', 2025, 'kajian'),
  S('kabarbursa-24gw', 'Indonesia incar posisi raja geothermal dunia, potensi 24 GW (368 lokasi; dokumen Ditjen EBTKE 2.776 MW)', 'KabarBursa', 'https://www.kabarbursa.com/makro/indonesia-incar-posisi-raja-geothermal-dunia-potensi-24-gw-jadi-modal-utama', 2026),
  S('esdm-gd', 'Government drilling panas bumi diapresiasi (slim hole; pemerintah menanggung risiko eksplorasi, biaya sekali bukan 30 tahun)', 'Kementerian ESDM', 'https://esdm.go.id/id/media-center/arsip-berita/government-drilling-panas-bumi-diapresiasi', 2021, 'resmi'),
  S('esdm-cisolok', 'Menteri ESDM resmikan tajak pengeboran panas bumi Cisolok, proyek eksplorasi deep slim hole pertama APBN', 'Kementerian ESDM', 'https://www.esdm.go.id/id/media-center/arsip-berita/menteri-esdm-resmikan-tajak-pengeboran-panas-bumi-cisolok-proyek-eksplorasi-deep-slim-hole-pertama-apbn', 2021, 'resmi'),
  S('bisnis-450', 'ESDM siapkan Rp450 miliar untuk eksplorasi panas bumi (12 Januari 2021; hanya judul dibaca, isi tidak dapat diakses)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20210112/44/1341802/esdm-siapkan-rp450-miliar-untuk-eksplorasi-panas-bumi', 2021, 'via-pihak-ketiga'),
  S('toshiba-patuha', 'Toshiba wins another equipment order for Patuha geothermal power plant (Sarulla 239 MW; Patuha 1; Lumut Balai 1; total 311 MW; Patuha 2 60,3 MW)', 'Toshiba Energy Systems & Solutions', 'https://asia.toshiba.com/press-release/english/toshiba-wins-another-equipment-order-for-patuha-geothermal-power-plant-in-indonesia/', 2025, 'via-pihak-ketiga'),
  S('tge-dieng-toshiba', 'Toshiba wins contract for Dieng small-scale geothermal plant in Indonesia (set turbin-generator kelas 10 MW)', 'ThinkGeoEnergy', 'https://www.thinkgeoenergy.com/toshiba-wins-contract-for-dieng-small-scale-geothermal-plant-in-indonesia/', 2024),
  S('li-langsung', 'Dirjen EBTKE: panas bumi dorong ekonomi lokal (pemanfaatan langsung; rancangan Permen ESDM; percontohan Patuha 2024)', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/17303/dirjen-ebtke-panas-bumi-dorong-ekonomi-lokal', 2025),
  S('ugm-lahendong', 'Taman edukasi panas bumi Lahendong: panas untuk pengolahan gula aren', 'Universitas Gadjah Mada', 'https://ugm.ac.id/?p=22150', 2024, 'kajian'),
  S('unpad-langsung', 'Kajian pemanfaatan langsung panas bumi Indonesia (merujuk Lund dan Toth 2021: sekitar 2,3 MWt, terbesar untuk kolam pemandian)', 'Jurnal FOCUS, Universitas Padjadjaran', 'https://journals.unpad.ac.id/focus/article/download/65313/26043', 2023, 'kajian'),
  S('bsdg-dieng', 'Buletin Sumber Daya Geologi 19(3), 2024: pemanfaatan langsung manifestasi mata air panas di WKP Dieng', 'Badan Geologi, Kementerian ESDM', 'https://buletinsdg.geologi.esdm.go.id/index.php/bsdg/article/download/BSDG_VOL_19_NO_3_2024_5/349', 2024, 'resmi'),
];

function sumberGabung() {
  const tp = j('public/data/topik/panas_bumi.json').sumber, out = [];
  for (const id of PINJAM) {
    const s = tp[id]; if (!s) throw new Error('sumber topik tidak ada: ' + id);
    out.push({ id, judul: s.judul, penerbit: s.penerbit, url: s.url, tahun: s.tahun, tingkat_bukti: BUKTI[s.bukti] || 'media', tanggal_periksa: s.tanggal || T });
  }
  return out.concat(SUMBER_BARU);
}

const ORG = { pge: 'p_dda1e51dae', star: 'p_7a803f3b71', supreme: 'p_c6c4e478c0', medco: 'p_9de27fd5b9', sarulla: 'en_8d7c565560', geodipa: 'p_7b70728bb7', ip: 'p_5a2e7d0c63' };

export function bangun() {
  const pt = j('public/data/proyek_terpadu.json').baris.filter((b) => b.tek === 'panas-bumi');
  const topik = j('public/data/topik/panas_bumi.json');
  const prov = topik.bab['8'].baris.map((r) => ({ kode: r.kode, provinsi: r.provinsi, potensi_mw: r.potensi_mw, terpasang_mw: r.terpasang_mw }));
  const harga = topik.bab['11'].baris.map((r) => ({ varian: r.varian.id.startsWith('Uap') ? 'uap' : 'listrik', kelas: r.kap, tahun1_10: r.d1, tahun11_30: r.d11 }));
  const acuan = (re, org) => pt.filter((b) => (org && b.pemilik?.org_id && org.includes(b.pemilik.org_id)) || (b.pemilik?.nama && re.test(b.pemilik.nama))).map((b) => b.id);
  const pemain = [
    { org_id: ORG.pge, peran: ['pengembang', 'operator'], proyek_ids: acuan(/Pertamina Geothermal/i, [ORG.pge]), wkp_ids: ['wkp_ulubelu', 'wkp_lahendong'], fakta: [
      { teks: L('Target kapasitas kelolaan sendiri 1 GW pada 2028 dan 1,8 GW pada 2034 (siaran pers PGE).', 'Self-operated capacity targets of 1 GW by 2028 and 1.8 GW by 2034 (PGE press release).'), sumber_id: 'pge_1gw', tingkat_bukti: 'resmi' },
      { teks: L('Pendapatan US$318,86 juta sampai kuartal III 2025; Lumut Balai Unit 2 menambah kapasitas.', 'Revenue of US$318.86 million through Q3 2025; Lumut Balai Unit 2 added capacity.'), sumber_id: 'pge_q3', tingkat_bukti: 'resmi' },
      { teks: L('Lapangan Kamojang: lima unit, 235 MW terpasang.', 'Kamojang field: five units, 235 MW installed.'), sumber_id: 'pge_kmj', tingkat_bukti: 'resmi' }] },
    { org_id: ORG.star, peran: ['pengembang', 'IPP'], proyek_ids: acuan(/Star Energy/i, [ORG.star]), wkp_ids: [], fakta: [
      { teks: L('Unit kedua Wayang Windu mulai beroperasi (laporan Petromindo).', 'Wayang Windu second unit started operating (Petromindo report).'), sumber_id: 'wayang', tingkat_bukti: 'media' }] },
    { org_id: ORG.supreme, peran: ['pengembang'], proyek_ids: ['pj_0265', 'pj_0266', 'gem_geothermal_L100000700146'], wkp_ids: [], fakta: [
      { teks: L('Muara Laboh beroperasi komersial 16 Desember 2019 (siaran Sumitomo Corporation, mitra proyek).', 'Muara Laboh entered commercial operation on 16 December 2019 (Sumitomo Corporation release, project partner).'), sumber_id: 'laboh_sc', tingkat_bukti: 'resmi' },
      { teks: L('Rantau Dedap memulai operasi komersial (siaran PT Supreme Energy).', 'Rantau Dedap started commercial operation (PT Supreme Energy release).'), sumber_id: 'dedap_se', tingkat_bukti: 'resmi' },
      { teks: L('JBIC menandatangani pinjaman ekspansi Muara Laboh pada Januari 2025.', 'JBIC signed the Muara Laboh expansion loan in January 2025.'), sumber_id: 'laboh_jbic', tingkat_bukti: 'resmi' }] },
    { org_id: ORG.medco, peran: ['pengembang'], proyek_ids: acuan(/Medco/i, ['p_27ae5a4203', ORG.medco]), wkp_ids: [], fakta: [
      { teks: L('PLTP Ijen 35 MW beroperasi komersial Februari 2025.', 'The 35 MW Ijen PLTP entered commercial operation in February 2025.'), sumber_id: 'medco', tingkat_bukti: 'resmi' }] },
    { org_id: ORG.sarulla, peran: ['operator', 'IPP'], proyek_ids: acuan(/Sarulla/i, []), wkp_ids: [], fakta: [
      { teks: L('Proyek Sarulla memperoleh pembiayaan proyek US$1,17 miliar.', 'The Sarulla project secured US$1.17 billion in project financing.'), sumber_id: 'sarulla', tingkat_bukti: 'media' },
      { teks: L('Turbin uap Toshiba untuk Sarulla berkapasitas 239 MW (siaran Toshiba).', 'Toshiba steam turbines for Sarulla total 239 MW (Toshiba release).'), sumber_id: 'toshiba-patuha', tingkat_bukti: 'via-pihak-ketiga' }] },
  ];
  return {
    lapis: 'panas_bumi', dibangun_pada: T, tanggal: T,
    keterangan: 'Modul panas bumi ujung ke ujung. Berkas ini hanya memuat rujukan id ke data yang sudah ada dan butir baru bersumber; angka WKP, proyek, pemasok, isu, regulasi dibaca dari berkas aslinya saat runtime.',
    sumber: sumberGabung(),
    rujukan: {
      wkp_ids: j('public/data/wkp.json').baris.map((b) => b.id),
      proyek_ids: pt.map((b) => b.id),
      pemasok_segmen: 'panas-bumi',
      isu_ids: ['konflik-panas-bumi', 'poco-leok', 'dieng-karangtengah', 'gunung-talang', 'wae-sano', 'sorik-marapi', 'ungaran', 'mataloko', 'flores-pulau-panas-bumi', 'harga-patokan-112', 'perizinan-lahan'],
      regulasi_ids: ['uu-21-2014', 'pp-7-2017', 'pp-28-2016', 'perpres-112-2022', 'permen-esdm-17-2014', 'permen-klhk-28-2025', 'keppres-76-2000'],
      biaya_bangun_id: 'pltp-eksplorasi',
      pembangkit_status_urut: ['beroperasi', 'konstruksi', 'izin', 'rencana', 'ditunda', 'tidak-diketahui', 'dibatalkan'],
    },
    sumber_daya: {
      potensi_mw: [{ nilai: 23742, tahun: 2025, sumber_id: 'metro-potensi', tingkat_bukti: 'media', ket: L('Potensi gabungan sumber daya dan cadangan (Badan Geologi/ESDM, dikutip media).', 'Combined resources and reserves (Geological Agency/ESDM, quoted by media).') }],
      lokasi: { nilai: 368, sumber_id: 'kabarbursa-24gw', tingkat_bukti: 'media', ket: L('Jumlah lokasi potensi, bukan jumlah WKP.', 'Number of potential sites, not the number of WKP.') },
      terpasang_mw: [
        { nilai: 2743.76, tahun: 2025, sumber_id: 'irena', tingkat_bukti: 'resmi', ket: L('IRENASTAT: dipakai sebagai angka utama (selaras topik panas bumi).', 'IRENASTAT: used as the headline figure (consistent with the geothermal topic).') },
        { nilai: 2744, tahun: 2025, sumber_id: 'cnbc-2744', tingkat_bukti: 'media', ket: L('Pernyataan Menteri ESDM, sekitar 10% dari potensi.', 'Statement by the Minister of ESDM, around 10% of potential.') },
        { nilai: 2653, tahun: 2025, sumber_id: 'innerspace-3', tingkat_bukti: 'kajian', ket: L('19 lapangan bersuhu tinggi beroperasi komersial.', '19 high-temperature fields in commercial operation.') },
        { nilai: 2776, tahun: 2026, sumber_id: 'kabarbursa-24gw', tingkat_bukti: 'media', ket: L('Dokumen Ditjen EBTKE yang dikutip media.', 'A Directorate General of EBTKE document quoted by media.') },
      ],
      provinsi: prov,
      provinsi_sumber_id: 'irena',
      catatan_beda: L('Angka terpasang berbeda menurut definisi dan tanggal data; semua versi ditampilkan, tidak ada yang dipilih diam-diam.', 'Installed capacity differs by definition and data date; all versions are shown, none chosen silently.'),
    },
    eksplorasi: {
      risiko: [
        { k: 'sukses_eksplorasi', nilai: 59, satuan: '%', sumber_id: 'esmap', tingkat_bukti: 'kajian' },
        { k: 'sukses_pengembangan', nilai: 74, satuan: '%', sumber_id: 'esmap', tingkat_bukti: 'kajian' },
        { k: 'sukses_operasi', nilai: 83, satuan: '%', sumber_id: 'esmap', tingkat_bukti: 'kajian' },
        { k: 'biaya_sumur', nilai: 5, satuan: 'US$ juta', sumber_id: 'lemigas', tingkat_bukti: 'kajian' },
        { k: 'porsi_bor', nilai: '35-40', satuan: '% biaya proyek', sumber_id: 'esmap', tingkat_bukti: 'kajian' },
        { k: 'usd_per_mw', nilai: '300.000-400.000', satuan: 'US$/MW', sumber_id: 'stanford', tingkat_bukti: 'kajian' },
      ],
      program: [
        { k: 'gd', tahun: 2021, teks: L('Government drilling: pemerintah membor slim hole untuk memastikan sumber panas dan menanggung risiko eksplorasi, sehingga biaya eksplorasi sekali bayar dan tidak terbawa selama 30 tahun.', 'Government drilling: the state drills slim holes to confirm the heat source and carries exploration risk, so exploration cost is paid once instead of over 30 years.'), sumber_id: 'esdm-gd', tingkat_bukti: 'resmi' },
        { k: 'cisolok', tahun: 2021, teks: L('Cisolok (Jawa Barat): tajak deep slim hole pertama yang dibiayai APBN.', 'Cisolok (West Java): the first APBN-funded deep slim hole spud.'), sumber_id: 'esdm-cisolok', tingkat_bukti: 'resmi' },
        { k: 'rp450', tahun: 2021, teks: L('Anggaran Rp450 miliar untuk eksplorasi panas bumi disebut dalam judul laporan Bisnis.com; rincian belum dibaca.', 'A Rp450 billion allocation for geothermal exploration appears in a Bisnis.com headline; details not read.'), sumber_id: 'bisnis-450', tingkat_bukti: 'via-pihak-ketiga' },
      ],
      pendanaan: [
        { k: 'pisp', teks: L('Dana PISP (Pembiayaan Infrastruktur Sektor Panas Bumi) diatur PMK 80/2022 dan dikelola PT SMI.', 'The PISP fund (geothermal infrastructure financing) is set by PMK 80/2022 and managed by PT SMI.'), sumber_id: 'pmk80', tingkat_bukti: 'via-pihak-ketiga', sumber_id2: 'smi' },
        { k: 'grem', teks: L('Geothermal Resource Risk Mitigation (GREM): proyek Bank Dunia P155047 yang mendanai mitigasi risiko sumber daya lewat PISP.', 'Geothermal Resource Risk Mitigation (GREM): World Bank project P155047 funding resource-risk mitigation through PISP.'), sumber_id: 'wbpisp', tingkat_bukti: 'resmi' },
        { k: 'tgefund', teks: L('Skema pendanaan baru untuk eksplorasi panas bumi diumumkan pada 2016.', 'New funding schemes for geothermal exploration were announced in 2016.'), sumber_id: 'tgefund', tingkat_bukti: 'media' },
        { k: 'waesano', teks: L('SMI menyediakan US$30 juta untuk eksplorasi Wae Sano.', 'SMI to provide US$30 million for Wae Sano exploration.'), sumber_id: 'waesano', tingkat_bukti: 'media' },
        { k: 'jica', teks: L('JICA: perjanjian pinjaman PLTP Hululais (30 Maret 2026).', 'JICA: Hululais PLTP loan agreement (30 March 2026).'), sumber_id: 'jica', tingkat_bukti: 'resmi' },
      ],
      pemasok_subsegmen: ['pengeboran-sumur', 'pipa-separator'],
    },
    teknologi: {
      jenis: [
        { k: 'uap-kering', teks: L('Uap kering: uap langsung memutar turbin; contoh klasik Kamojang.', 'Dry steam: steam drives the turbine directly; Kamojang is the classic case.'), sumber_id: 'pge_kmj', tingkat_bukti: 'resmi' },
        { k: 'flash', teks: L('Flash: air panas bertekanan diuapkan mendadak (flash) di separator, uapnya memutar turbin.', 'Flash: pressurised hot water is flashed to steam in a separator and the steam drives the turbine.'), tingkat_bukti: 'editorial' },
        { k: 'binary', teks: L('Binari (ORC): panas reservoir memanasi fluida kerja bertitik didih rendah; menjangkau reservoir bersuhu lebih rendah dan dipakai sebagai bottoming unit.', 'Binary (ORC): reservoir heat warms a low-boiling working fluid; reaches lower-temperature reservoirs and is used as a bottoming unit.'), tingkat_bukti: 'editorial' },
      ],
      pemasok_subsegmen: ['turbin-pembangkit', 'binary-orc'],
      unit_pemasok: [
        { org_pemasok: 'en_8a7adde233', unit: L('Sarulla (239 MW turbin uap), Patuha Unit 1, Lumut Balai Unit 1', 'Sarulla (239 MW steam turbines), Patuha Unit 1, Lumut Balai Unit 1'), sumber_id: 'toshiba-patuha', tingkat_bukti: 'via-pihak-ketiga' },
        { org_pemasok: 'en_8a7adde233', unit: L('Patuha Unit 2: turbin uap dan generator 60,3 MW (pesanan 2025, COD terjadwal 2027)', 'Patuha Unit 2: 60.3 MW steam turbine and generator (2025 order, COD scheduled 2027)'), sumber_id: 'toshiba-patuha', tingkat_bukti: 'via-pihak-ketiga' },
        { org_pemasok: 'en_8a7adde233', unit: L('Dieng: set turbin-generator skala kecil kelas 10 MW', 'Dieng: small-scale 10 MW-class turbine-generator set'), sumber_id: 'tge-dieng-toshiba', tingkat_bukti: 'media' },
      ],
      kata_kunci: ['Fuji Electric', 'Toshiba', 'Mitsubishi Power', 'Ansaldo Energia', 'Ormat'],
    },
    ppa: {
      harga_patokan: harga, harga_sumber_id: 'perpres112', faktor_f: L('Faktor lokasi F ada di Lampiran II Perpres 112/2022 dan tidak ditranskripsi; hitungan di halaman memakai F = 1.', 'The location factor F is in Annex II of Perpres 112/2022 and is not transcribed; the page calculation uses F = 1.'),
      transkripsi_catatan: L('Transkripsi METI dari PDF yang dibaca OCR; angka uap kelas >100 MW tahun 11-30 (3,91) terbaca samar.', 'METI transcription from an OCR-read PDF; the steam >100 MW years 11-30 figure (3.91) is faint.'),
      contoh: { mw: 55, faktor_kapasitas: 72.5, kelas: '>50-100 MW', f: 1, sumber_id: 'irena', ket: L('Faktor kapasitas 72,5% = rata-rata nasional 2024 (EST).', 'Capacity factor 72.5% = 2024 national average (EST).') },
      ppa_contoh: [
        { proyek_id: 'pj_0224', teks: L('Hululais (PGE, 110 MW): pinjaman JICA ditandatangani 30 Maret 2026; pembeli listrik PLN.', 'Hululais (PGE, 110 MW): JICA loan signed 30 March 2026; PLN is the electricity buyer.'), sumber_id: 'jica', tingkat_bukti: 'resmi' },
        { proyek_id: 'pj_0265', teks: L('Muara Laboh: pinjaman ekspansi JBIC Januari 2025.', 'Muara Laboh: JBIC expansion loan, January 2025.'), sumber_id: 'laboh_jbic', tingkat_bukti: 'resmi' },
      ],
    },
    langsung: {
      skala: { nilai: 2.3, satuan: 'MWt', sumber_id: 'unpad-langsung', tingkat_bukti: 'cuplikan', ket: L('Pemanfaatan langsung tercatat sekitar 2,3 MWt, sebagian besar kolam pemandian; datanya buruk terdokumentasi.', 'Recorded direct use is about 2.3 MWt, mostly bathing pools; data is poorly documented.') },
      butir: [
        { k: 'pertanian', ikon: 'desa', lokasi: 'Lahendong, Sulawesi Utara', teks: L('Panas dipakai mengolah gula aren di taman edukasi panas bumi Lahendong.', 'Heat is used to process palm sugar at the Lahendong geothermal education park.'), sumber_id: 'ugm-lahendong', tingkat_bukti: 'cuplikan' },
        { k: 'pengeringan', ikon: 'tek-panas', lokasi: 'Patuha, Jawa Barat', teks: L('Percontohan 2024: pengering daun, rumah kaca, dan kolam ikan memakai panas bumi (dilaporkan dalam wawancara Dirjen EBTKE).', 'A 2024 pilot: leaf dryers, a greenhouse and fish ponds using geothermal heat (reported in a Director General of EBTKE interview).'), sumber_id: 'li-langsung', tingkat_bukti: 'cuplikan' },
        { k: 'wisata', ikon: 'lokasi', lokasi: 'Dieng, Jawa Tengah', teks: L('Manifestasi mata air panas di WKP Dieng dapat dimanfaatkan langsung (kajian Badan Geologi 2024).', 'Hot-spring manifestations in the Dieng WKP can be used directly (Geological Agency study, 2024).'), sumber_id: 'bsdg-dieng', tingkat_bukti: 'cuplikan' },
      ],
      regulasi: { teks: L('Kementerian ESDM menyiapkan rancangan Permen ESDM tentang pemanfaatan langsung panas bumi; pemanfaatan langsung diatur UU 21/2014.', 'The Ministry of ESDM is preparing a draft regulation on direct use of geothermal energy; direct use is governed by Law 21/2014.'), sumber_id: 'li-langsung', tingkat_bukti: 'cuplikan' },
    },
    pemain,
    celah: [
      'Luas WKP (hektare) tidak tersedia: Geoportal ESDM melarang semua robot dan situs EBTKE tidak punya daftar WKP yang dapat dipanen; kolom luas ditampilkan kosong sampai ada sumber yang boleh dibaca.',
      'Daftar WKP nasional lengkap (SK penetapan, pemegang izin) belum tersedia; basis memuat 19 WKP/PSPE kurasi (wkp.json), bukan seluruhnya.',
      'Pemenang lelang 2025 (3 WKP dan 7 PSPE) belum ditemukan; pemegang dibiarkan kosong.',
      'Koordinat proyek berpresisi provinsi atau titik GEM; sebaran peta bukan batas WKP.',
      'Pemasok turbin per unit hanya Toshiba yang tertaut siaran; Fuji, Mitsubishi, Ansaldo, dan Ormat terdaftar sebagai pemasok panas bumi di basis tetapi unit yang dipasoknya belum terverifikasi.',
      'Anggaran government drilling tahunan dan hasil sumur belum ditemukan dalam sumber yang boleh dibaca; hanya program dan lokasi awal.',
    ],
  };
}

/** Pemeriksa: id rujukan hidup di berkas aslinya, sumber unik, bukti dikenal, URL https atau berkas lokal. */
export function periksa(d) {
  const ids = (rel, f = (x) => x.baris) => new Set(f(j(rel)).map((x) => x.id));
  const wkp = ids('public/data/wkp.json'), pt = ids('public/data/proyek_terpadu.json'), isu = ids('public/data/isu.json'), reg = ids('public/data/regulasi.json'), org = ids('public/data/organisasi.json');
  const bb = new Set(j('public/data/biaya_bangun.json').komponen.map((x) => x.id));
  const pl = j('public/data/global/pemasok_lain.json');
  const must = (set, arr, nama) => { for (const i of arr) if (!set.has(i)) throw new Error(`${nama} tidak ada: ${i}`); };
  must(wkp, d.rujukan.wkp_ids, 'wkp'); must(pt, d.rujukan.proyek_ids, 'proyek'); must(isu, d.rujukan.isu_ids, 'isu'); must(reg, d.rujukan.regulasi_ids, 'regulasi'); must(bb, [d.rujukan.biaya_bangun_id], 'biaya_bangun');
  must(org, d.pemain.map((p) => p.org_id), 'org'); must(pt, d.pemain.flatMap((p) => p.proyek_ids), 'proyek pemain'); must(wkp, d.pemain.flatMap((p) => p.wkp_ids), 'wkp pemain');
  must(org, d.teknologi.unit_pemasok.map((u) => u.org_pemasok), 'org pemasok'); must(pt, d.ppa.ppa_contoh.map((p) => p.proyek_id), 'proyek ppa');
  if (!pl.rantai['panas-bumi']) throw new Error('rantai panas-bumi tiada di pemasok_lain');
  const sid = new Set(d.sumber.map((s) => s.id));
  if (sid.size !== d.sumber.length) throw new Error('id sumber ganda');
  for (const s of d.sumber) { if (!/^https:\/\/|^\/data\//.test(s.url)) throw new Error('url ' + s.id); if (!['resmi', 'media', 'kajian', 'via-pihak-ketiga', 'editorial'].includes(s.tingkat_bukti)) throw new Error('bukti ' + s.id); }
  const pakai = [...d.sumber_daya.potensi_mw, d.sumber_daya.lokasi, ...d.sumber_daya.terpasang_mw, ...d.eksplorasi.risiko, ...d.eksplorasi.program, ...d.eksplorasi.pendanaan, ...d.teknologi.jenis, ...d.teknologi.unit_pemasok, ...d.langsung.butir, d.langsung.skala, d.langsung.regulasi, ...d.ppa.ppa_contoh, ...d.pemain.flatMap((p) => p.fakta)];
  for (const x of pakai) if (x.sumber_id && !sid.has(x.sumber_id)) throw new Error('sumber_id tak dikenal: ' + x.sumber_id);
  if (d.ppa.harga_patokan.length !== 8) throw new Error('harga patokan harus 8 baris');
  if (d.sumber_daya.provinsi.length !== 38) throw new Error('provinsi harus 38');
  return { sumber: d.sumber.length, wkp: d.rujukan.wkp_ids.length, proyek: d.rujukan.proyek_ids.length, pemain: d.pemain.length };
}

async function cekUrl() {
  const { ambil } = await import('../pipa/_panen_sopan.mjs');
  for (const s of sumberGabung().filter((x) => x.url.startsWith('https://'))) { try { await ambil(s.url, { method: 'HEAD' }); console.log('OK ', s.id); } catch (e) { console.log('GAGAL', s.id, e.message); if (/403|429/.test(e.message)) break; } }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--bangun') { const d = bangun(); console.log(periksa(d)); fs.writeFileSync(path.join(ROOT, 'public/data/panas_bumi.json'), JSON.stringify(d, null, 1) + '\n'); }
  else if (a === '--selftest') console.log(periksa(bangun()));
  else if (a === '--cek-url') await cekUrl();
  else console.log('pakai: --bangun | --selftest | --cek-url');
}
