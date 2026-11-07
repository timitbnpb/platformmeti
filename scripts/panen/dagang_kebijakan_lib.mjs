// Kebijakan perdagangan yang memengaruhi rantai pasok EBT Indonesia. Butir disusun dari dokumen resmi
// (Federal Register, EUR-Lex, peraturan.bpk.go.id); nilai tarif disalin dari tabel dokumen, bukan dihitung.
// Fungsi murni: diuji di tests/dagang_kebijakan.test.mjs.
const FR = (nomor, hal, tgl, judul) => ({ judul, penerbit: 'Federal Register (US)', url: `https://www.federalregister.gov/d/${nomor}`, dokumen: `${hal}, terbit ${tgl}` });
export const SUMBER = {
  'fr-ad-id': FR('2026-18939', '91 FR 58651', '2026-09-16', 'Crystalline Silicon Photovoltaic Cells From Indonesia: Final Affirmative Determination of Sales at Less Than Fair Value'),
  'fr-cvd-id': FR('2026-18940', '91 FR 58647', '2026-09-16', 'Crystalline Silicon Photovoltaic Cells From Indonesia: Final Affirmative Countervailing Duty Determination'),
  'fr-ad-in': FR('2026-18945', '91 FR 58658', '2026-09-16', 'Crystalline Silicon Photovoltaic Cells From India: Final Affirmative Determination of Sales at Less Than Fair Value'),
  'fr-cvd-in': FR('2026-18947', '91 FR 58643', '2026-09-16', 'Crystalline Silicon Photovoltaic Cells From India: Final Affirmative Countervailing Duty Determination'),
  'fr-ad-la': FR('2026-18941', '91 FR 58633', '2026-09-16', "Crystalline Silicon Photovoltaic Cells From the Lao People's Democratic Republic: Final Affirmative Determination of Sales at Less Than Fair Value"),
  'fr-cvd-la': FR('2026-18942', '91 FR 58638', '2026-09-16', "Crystalline Silicon Photovoltaic Cells From the Lao People's Democratic Republic: Final Affirmative Countervailing Duty Determination"),
  'fr-itc': FR('2026-22565', '91 FR 69865', '2026-11-05', 'USITC: Crystalline Silicon Photovoltaic Cells From India, Indonesia, and Laos; Determinations (Inv. 701-TA-772-774, 731-TA-1756-1758 Final)'),
  'fr-s201': FR('2026-05170', 'USITC TA-201-075', '2026-03-17', 'Crystalline Silicon Photovoltaic Cells: Evaluation of the Effectiveness of Import Relief (tindakan Section 201 berakhir 2026-02-06)'),
  'fr-s232': FR('2026-16400', '91 FR 51975', '2026-08-11', 'Proclamation 11052: Adjusting Imports of Polysilicon and Its Derivatives Into the United States'),
  'fr-s232-bis': FR('2026-19537', 'BIS temporary final rule', '2026-09-24', 'Measures To Restrict Stockpiling of Polysilicon and Polysilicon Derivatives Under Proclamation 11052'),
  'fr-s301': FR('2024-21217', 'USTR notice', '2024-09-18', "Notice of Modification: China's Acts, Policies and Practices Related to Technology Transfer, Intellectual Property and Innovation"),
  'fr-uflpa': FR('2026-22094', 'DHS notice', '2026-10-29', 'Notice Regarding the Uyghur Forced Labor Prevention Act Entity List'),
  'eu-flr': { judul: 'Regulation (EU) 2024/3015 on prohibiting products made with forced labour on the Union market', penerbit: 'EUR-Lex (Uni Eropa)', url: 'https://eur-lex.europa.eu/eli/reg/2024/3015/oj', dokumen: 'OJ L 2024/3015, 12 Desember 2024' },
  'eu-cbam': { judul: 'Regulation (EU) 2023/956 establishing a carbon border adjustment mechanism', penerbit: 'EUR-Lex (Uni Eropa)', url: 'https://eur-lex.europa.eu/eli/reg/2023/956/oj', dokumen: 'OJ L 130, 16 Mei 2023' },
  'bpk-34-2024': { judul: 'Permenperin 34 Tahun 2024: tata cara penghitungan nilai TKDN produk modul surya', penerbit: 'JDIH BPK (peraturan.bpk.go.id)', url: 'https://peraturan.bpk.go.id/Details/296131', dokumen: 'Permenperin 34/2024, ditetapkan 2024-07-25' },
};
const adcvdUS = (id, jenis, src, sasaran, besaran, produk) => ({ id, negara: 'us', jenis, sasaran, produk, hs: ['854142', '854143'], besaran, sumber_id: src, tingkat_bukti: 'resmi' });
export const BUTIR = [
  { ...adcvdUS('us_ad_id_2026', 'antidumping', 'fr-ad-id', [{ negara: 'id', perusahaan: 'PT Blue Sky Solar Indonesia', tarif_pct: 94.36, catatan: 'berdasarkan fakta tersedia dengan inferensi merugikan' }, { negara: 'id', perusahaan: 'PT REC Solar Energy Indonesia', tarif_pct: 94.36, catatan: 'berdasarkan fakta tersedia dengan inferensi merugikan', organisasi_id: 'p_f9282cbf6b' }, { negara: 'id', perusahaan: null, tarif_pct: 94.36, catatan: 'All Others' }], 'margin dumping rata-rata tertimbang 94,36 persen (setoran tunai belum disesuaikan offset subsidi)', 'Sel fotovoltaik silikon kristalin, dirakit modul atau tidak'), status: 'putusan akhir Commerce 2026-09-16; ITC afirmatif 2026-11-05; perintah (order) belum diperiksa', tanggal_efektif: null, tanggal_putusan: '2026-09-16' },
  { ...adcvdUS('us_cvd_id_2026', 'bea-imbalan', 'fr-cvd-id', [{ negara: 'id', perusahaan: 'PT Blue Sky Solar Indonesia', tarif_pct: 173.70, catatan: 'fakta tersedia dengan inferensi merugikan' }, { negara: 'id', perusahaan: 'PT REC Solar Energy Indonesia', tarif_pct: 73.20, organisasi_id: 'p_f9282cbf6b' }, { negara: 'id', perusahaan: null, tarif_pct: 73.20, catatan: 'All Others' }], 'tarif subsidi 73,20 sampai 173,70 persen ad valorem', 'Sel fotovoltaik silikon kristalin, dirakit modul atau tidak'), status: 'putusan akhir Commerce 2026-09-16; ITC afirmatif 2026-11-05; perintah (order) belum diperiksa', tanggal_efektif: null, tanggal_putusan: '2026-09-16' },
  { ...adcvdUS('us_ad_in_2026', 'antidumping', 'fr-ad-in', ['Mundra Solar PV Limited', 'Mundra Solar Energy Limited', 'Kowa Company Ltd', 'Premier Energies Photovoltaic Private Limited', null].map((p) => ({ negara: 'in', perusahaan: p, tarif_pct: 123.04, setoran_tunai_pct: 107.17, catatan: p ? null : 'All Others' })), 'margin 123,04 persen; setoran tunai 107,17 persen setelah offset subsidi', 'Sel fotovoltaik silikon kristalin, dirakit modul atau tidak'), status: 'putusan akhir Commerce 2026-09-16; ITC afirmatif 2026-11-05; perintah (order) belum diperiksa', tanggal_efektif: null, tanggal_putusan: '2026-09-16' },
  { ...adcvdUS('us_cvd_in_2026', 'bea-imbalan', 'fr-cvd-in', ['Mundra Solar Energy Limited', 'Mundra Solar PV Limited', null].map((p) => ({ negara: 'in', perusahaan: p, tarif_pct: 126.09, catatan: p ? 'fakta tersedia dengan inferensi merugikan' : 'All Others' })), 'tarif subsidi 126,09 persen ad valorem', 'Sel fotovoltaik silikon kristalin, dirakit modul atau tidak'), status: 'putusan akhir Commerce 2026-09-16; ITC afirmatif 2026-11-05; perintah (order) belum diperiksa', tanggal_efektif: null, tanggal_putusan: '2026-09-16' },
  { ...adcvdUS('us_ad_la_2026', 'antidumping', 'fr-ad-la', [{ negara: 'la', perusahaan: 'Solarspace Technology (Laos) Sole Co., Ltd.', tarif_pct: 65.43, setoran_tunai_pct: 65.03 }, { negara: 'la', perusahaan: null, tarif_pct: 65.43, setoran_tunai_pct: 65.03, catatan: 'Laos-wide entity' }], 'margin 65,43 persen; setoran tunai 65,03 persen', 'Sel fotovoltaik silikon kristalin, dirakit modul atau tidak'), status: 'putusan akhir Commerce 2026-09-16; ITC afirmatif 2026-11-05; perintah (order) belum diperiksa', tanggal_efektif: null, tanggal_putusan: '2026-09-16' },
  { ...adcvdUS('us_cvd_la_2026', 'bea-imbalan', 'fr-cvd-la', [{ negara: 'la', perusahaan: 'Solarspace Technology (Laos) Sole Co. Ltd', tarif_pct: 82.03 }, { negara: 'la', perusahaan: 'Vietnam Sunergy Joint Stock Company', tarif_pct: 153.67, catatan: 'fakta tersedia dengan inferensi merugikan' }, { negara: 'la', perusahaan: null, tarif_pct: 82.03, catatan: 'All Others' }], 'tarif subsidi 82,03 persen (Vietnam Sunergy 153,67 persen)', 'Sel fotovoltaik silikon kristalin, dirakit modul atau tidak'), status: 'putusan akhir Commerce 2026-09-16; ITC afirmatif 2026-11-05; perintah (order) belum diperiksa', tanggal_efektif: null, tanggal_putusan: '2026-09-16' },
  { id: 'us_itc_cedera_2026', negara: 'us', jenis: 'putusan-cedera', sasaran: [{ negara: 'in' }, { negara: 'id' }, { negara: 'la' }], produk: 'Sel fotovoltaik silikon kristalin, dirakit modul atau tidak', hs: ['854142', '854143'], besaran: 'industri AS dinyatakan dirugikan material; kondisi kritis juga terbukti merusak efek perintah untuk Indonesia', status: 'final (5 Nov 2026); perintah AD/CVD menyusul', tanggal_efektif: null, tanggal_putusan: '2026-11-05', sumber_id: 'fr-itc', tingkat_bukti: 'resmi' },
  { id: 'us_s201_surya', negara: 'us', jenis: 'safeguard-s201', sasaran: [{ negara: null, catatan: 'semua mitra (dengan pengecualian tertentu)' }], produk: 'Sel dan modul fotovoltaik silikon kristalin', hs: ['854142', '854143'], besaran: null, status: 'berakhir 2026-02-06; digantikan Section 232 polisilikon', tanggal_efektif: '2026-02-06', tanggal_putusan: null, sumber_id: 'fr-s201', tingkat_bukti: 'resmi' },
  { id: 'us_s232_polisilikon', negara: 'us', jenis: 'tarif-s232', sasaran: [{ negara: null, catatan: 'semua negara; Jepang, Korea, Taiwan, Swiss, Liechtenstein, UE: total 15 persen; Inggris: 10 persen' }], produk: 'Polisilikon, ingot, wafer, sel, modul surya', hs: ['280461', '381800', '854142', '854143'], besaran: '15 persen ad valorem untuk ingot dan turunan; harga impor minimum: 21 USD/kg polisilikon, 100 USD/kg ingot dan wafer, 0,22 USD/W sel, 0,38 USD/W modul', status: 'diproklamasikan 2026-08-06; berlaku 2026-12-04', tanggal_efektif: '2026-12-04', tanggal_putusan: '2026-08-06', sumber_id: 'fr-s232', tingkat_bukti: 'resmi' },
  { id: 'us_s232_antitimbun', negara: 'us', jenis: 'tarif-s232', sasaran: [{ negara: null, catatan: 'importir polisilikon dan turunan' }], produk: 'Polisilikon dan turunan', hs: ['280461', '854142', '854143'], besaran: 'pembatasan impor bagi perusahaan yang menimbun sebelum 2026-12-04', status: 'berlaku', tanggal_efektif: '2026-09-22', tanggal_putusan: null, sumber_id: 'fr-s232-bis', tingkat_bukti: 'resmi' },
  { id: 'us_s301_surya_cina', negara: 'us', jenis: 'tarif-s301', sasaran: [{ negara: 'cn' }], produk: 'Sel surya (dirakit modul atau tidak), polisilikon, wafer', hs: ['854142', '854143'], besaran: 'sel surya naik menjadi 50 persen (2024); kenaikan polisilikon dan wafer sesuai notifikasi USTR', status: 'berlaku', tanggal_efektif: '2024-09-27', tanggal_putusan: '2024-09-18', sumber_id: 'fr-s301', tingkat_bukti: 'resmi' },
  { id: 'us_uflpa_daftar', negara: 'us', jenis: 'larangan-kerja-paksa', sasaran: [{ negara: 'cn', catatan: 'entitas dalam Daftar Entitas UFLPA (rantai polisilikon Xinjiang)' }], produk: 'Barang dari Xinjiang atau entitas daftar; polisilikon surya', hs: ['280461', '854142'], besaran: 'praduga dapat dibantah: impor ditahan CBP', status: 'daftar diperbarui 2026-10-29 (tiga entitas ditambah)', tanggal_efektif: null, tanggal_putusan: '2026-10-29', sumber_id: 'fr-uflpa', tingkat_bukti: 'resmi' },
  { id: 'eu_flr_2024', negara: 'eu', jenis: 'larangan-kerja-paksa', sasaran: [{ negara: null, catatan: 'semua pemasok ke pasar UE' }], produk: 'Semua produk, termasuk komponen EBT', hs: [], besaran: 'produk hasil kerja paksa dilarang di pasar UE', status: 'diundangkan; berlaku penuh 2027-12-14', tanggal_efektif: '2027-12-14', tanggal_putusan: '2024-11-27', sumber_id: 'eu-flr', tingkat_bukti: 'resmi' },
  { id: 'eu_cbam_2023', negara: 'eu', jenis: 'karbon-perbatasan', sasaran: [{ negara: null, catatan: 'importir ke UE; sektor baja, aluminium, listrik, hidrogen, pupuk, semen' }], produk: 'Baja, aluminium, listrik, hidrogen, pupuk, semen (bahan rangka dan struktur EBT)', hs: ['72', '76'], besaran: 'kewajiban CBAM (pasal-pasal kewajiban importir berlaku sejak 2026-01-01, Pasal penutup Reg. 2023/956)', status: 'berlaku', tanggal_efektif: '2026-01-01', tanggal_putusan: '2023-05-10', sumber_id: 'eu-cbam', tingkat_bukti: 'resmi' },
  { id: 'id_tkdn_modul_34_2024', negara: 'id', jenis: 'tkdn', sasaran: [{ negara: null, catatan: 'produsen dan importir modul surya' }], produk: 'Modul surya', hs: ['854143'], besaran: 'tata cara penghitungan nilai TKDN modul surya', status: 'berlaku', tanggal_efektif: '2024-07-25', tanggal_putusan: '2024-07-25', sumber_id: 'bpk-34-2024', regulasi_id: 'permen-kemenperin-34-2024', tingkat_bukti: 'resmi' },
];
// Insentif bea masuk barang modal pembangkit: sambung ke insentif_fiskal.json (sumber sudah di sana).
export const BUTIR_INSENTIF = ['if_bea_masuk_pembangkit', 'if_bea_masuk_mesin'];
export const CELAH = [
  'BMAD/BMTP Indonesia (KPPI/KADI) atas komponen EBT dan larangan-pembatasan impor modul/sel (Permendag): belum ditemukan dokumen resmi yang terverifikasi pada panen ini; tidak ada butir sampai ada tautan resmi.',
  'India ALMM (MNRE): halaman mnre.gov.in tidak terbaca tanpa JavaScript dan PIB menolak (403, berhenti); belum ada butir.',
  'Perintah (order) AD/CVD AS atas India, Indonesia, Laos belum terbit pada 2026-11-08; tarif dari putusan akhir Commerce bisa berubah pada perintah.',
  'Nilai ekspor terdampak memakai Comtrade HS 854143 (pelaporan Indonesia); bukan nilai per perusahaan.',
];
const ISO = /^[a-z]{2}$/;
export function sahkan(b, sumber = SUMBER) {
  const s = sumber[b.sumber_id];
  if (!s || !/^https:\/\//.test(s.url)) return 'sumber_url';
  if (!b.tingkat_bukti) return 'tingkat_bukti';
  if (!ISO.test(b.negara)) return 'negara';
  if (!(b.sasaran || []).every((x) => x.negara === null || x.negara === undefined || ISO.test(x.negara))) return 'sasaran';
  return null;
}
// komponen: isi dagang_komponen.json; insentif: isi insentif_fiskal.json; orgIds: Set id organisasi. Tanggal dari masukan.
export function bangun({ komponen, insentif, orgIds, tanggal }) {
  const baris = [], ditolak = [];
  for (const b of BUTIR) {
    const g = sahkan(b);
    if (g) { ditolak.push([b.id, g]); continue; }
    const sasaran = b.sasaran.map((x) => (x.organisasi_id && !orgIds.has(x.organisasi_id) ? { ...x, organisasi_id: null } : x));
    baris.push({ regulasi_id: null, ...b, sasaran, sumber_url: SUMBER[b.sumber_id].url, tanggal });
  }
  for (const id of BUTIR_INSENTIF) {
    const r = insentif.baris.find((x) => x.id === id);
    if (!r) { ditolak.push([id, 'insentif_id']); continue; }
    baris.push({ id: 'id_' + id, negara: 'id', jenis: 'pembebasan-bea-masuk', sasaran: [{ negara: null, catatan: 'importir barang modal pembangkit' }], produk: r.instrumen, hs: [], besaran: 'pembebasan bea masuk', status: r.status_berlaku, tanggal_efektif: r.tanggal_berlaku, tanggal_putusan: r.tanggal_penetapan, sumber_id: r.sumber_id, sumber_url: r.sumber_url, tanggal, tingkat_bukti: r.tingkat_bukti, regulasi_id: r.regulasi_id, insentif_id: r.id });
  }
  const ekspor = (komponen.tahunan || []).filter((t) => t.alir === 'ekspor' && t.komponen === 'surya' && t.hs === '854143').sort((a, c) => a.tahun - c.tahun);
  const dampak = {
    hs: '854143',
    ekspor_surya_ke_as: ekspor.map((t) => ({ tahun: t.tahun, usd_as: (t.mitra.find((m) => m.kode === 842) || {}).usd || 0, usd_total: t.usd })),
    sumber_nilai: 'public/data/dagang_komponen.json (UN Comtrade)',
    perusahaan_terdampak: [...new Set(baris.filter((b) => b.negara === 'us').flatMap((b) => b.sasaran).filter((x) => x.negara === 'id' && x.perusahaan).map((x) => x.perusahaan))],
  };
  return { lapis: 'publik', dibangun_pada: tanggal, jumlah: baris.length, sumber: [...Object.entries(SUMBER).map(([id, s]) => ({ id, ...s, tingkat_bukti: 'resmi' })), ...(insentif.sumber || []).filter((s) => baris.some((b) => b.sumber_id === s.id))], baris, dampak, celah: CELAH, ditolak };
}
