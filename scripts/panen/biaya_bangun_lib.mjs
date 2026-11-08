// Pembangun public/data/biaya_bangun.json (offline): kisaran biaya membangun pembangkit EBT per skala.
// Angka ditranskripsi dari terbitan publik (IRENA RPGC 2024 PDF lokal, Lazard LCOE+ 2026, siaran/berita Antara/CNN, IESR) atau dari berkas data repo
// (plts_atap_hitung.json, proyek.json, harga_komponen.json). Tidak ada angka karangan: sel tanpa sumber = null + CELAH.
// Konversi Rp<->USD memakai KURS (Hipotesis) dan diberi label EST.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TANGGAL = '2026-11-08';
export const KURS = 16000; // Rp/USD. Hipotesis: tersirat dari Bahlil (Rp1.140 T = USD 71,3 M => 15.988). Antara EN memuat USD 62 M (=> 18.387): kedua angka dicatat.
const AKAR = fileURLToPath(new URL('../../', import.meta.url));

export const SUMBER = [
  { id: 's-irena-2024', judul: 'IRENA, Renewable Power Generation Costs in 2024 (Juli 2025): Tabel 2.1, 3.1, 6.2, 6.3, Gambar 1.17, 3.4, 3.5, teks bab 1, 3, 6, 7, 8', penerbit: 'IRENA', url: 'https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_TEC_RPGC_in_2024_2025.pdf', tanggal_terbit: '2025-07', lisensi: 'Terbitan publik, dikutip dengan atribusi', tingkat_bukti: 'resmi', catatan: 'dibaca dari salinan PDF lokal; irena.org/robots.txt membalas 403 sehingga tidak ada permintaan baru ke host itu' },
  { id: 's-lazard-2026', judul: 'Lazard, Levelized Cost of Energy+ (LCOE+) v19.0, Juli 2026: tabel asumsi (biaya modal, O&M, faktor kapasitas, waktu konstruksi). Basis Amerika Serikat, USD', penerbit: 'Lazard', url: 'https://www.lazard.com/media/kcfconhf/lazards-lcoeplus_vf.pdf', tanggal_terbit: '2026-07', lisensi: 'Terbitan publik, dikutip dengan atribusi', tingkat_bukti: 'resmi' },
  { id: 's-bahlil-100gw', judul: 'ANTARA: Bahlil catat potensi investasi PLTS 100 GWp capai Rp1.140 triliun (25 Agu 2026; USD 71,3 miliar)', penerbit: 'ANTARA', url: 'https://www.antaranews.com/berita/5710388/bahlil-catat-potensi-investasi-plts-100-gwp-capai-rp1140-triliun', tanggal_terbit: '2026-08-25', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-antara-en-100gw', judul: 'ANTARA EN: Indonesia\'s 100 GW solar power project attracts US$62 billion (Rp1.140 T)', penerbit: 'ANTARA', url: 'https://en.antaranews.com/news/428457/indonesias-100-gw-solar-power-project-attracts-us62-billion', tanggal_terbit: '2026-08-25', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-danantara-100gw', judul: 'ANTARA: Danantara: pengembangan PLTS 100 GW butuh investasi Rp1.130 triliun', penerbit: 'ANTARA', url: 'https://www.antaranews.com/berita/5711995/danantara-pengembangan-plts-100-gw-butuh-investasi-rp1130-triliun', tanggal_terbit: '2026-08-26', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-meti-100gw', judul: 'CNN Indonesia: METI proyeksi investasi program PLTS 100 GW capai Rp1.440 triliun (Ketum METI, kisaran Rp960-1.440 T, tanpa penyimpanan dan jaringan; 2 Sep 2026)', penerbit: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/ekonomi/20260902104736-85-1399054/meti-proyeksi-investasi-program-plts-100-gw-capai-rp1440-triliun', tanggal_terbit: '2026-09-02', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-pln-14plts', judul: 'ANTARA: Dirut PLN: 14 proyek PLTS bernilai sekitar USD 7,7 miliar (Rp135 triliun); daftar kapasitas proyek (25 Agu 2026)', penerbit: 'ANTARA', url: 'https://www.antaranews.com/berita/5710704/dirut-pt-pln-sebut-indonesia-jalankan-proyek-plts-terbesar-di-dunia', tanggal_terbit: '2026-08-25', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-cirata', judul: 'ANTARA: Kilauan di permukaan Cirata (investasi USD 129 juta, Rp1,9 T; 192 MWp / 145 MWac; beroperasi Nov 2023)', penerbit: 'ANTARA', url: 'https://www.antaranews.com/berita/5195545/kilauan-di-permukaan-cirata-simbol-harapan-kemandirian-energi-bangsa', tanggal_terbit: '2025-10-24', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-karangkates', judul: 'ANTARA: Menyemai harapan kemandirian energi dari permukaan Waduk Karangkates (investasi sekitar USD 90 juta; 100 MWac = 133 MWp; target operasi Jan 2027)', penerbit: 'ANTARA', url: 'https://www.antaranews.com/berita/5831483/menyemai-harapan-kemandirian-energi-dari-permukaan-waduk-karangkates', tanggal_terbit: '2026-11-04', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-sidrap', judul: 'ANTARA: Perizinan lengkap, PLTB Sidrap Tahap II segera dibangun (tahap I USD 150 juta; tahap II USD 125 juta); ANTARA: Gunakan 22 turbin, PLTB Sidrap II 60-70 MW', penerbit: 'ANTARA', url: 'https://www.antaranews.com/berita/1660138/perizinan-lengkap-pltb-sidrap-tahap-ii-segera-dibangun', tanggal_terbit: '2020-08-10', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-selayar', judul: 'ANTARA: PLN bangun PLTS Hybrid kapasitas 1,3 MWp di Selayar (investasi Rp39 miliar; 5 Mei 2021)', penerbit: 'ANTARA', url: 'https://www.antaranews.com/berita/2139794/pln-bangun-plts-hybrid-kapasitas-13-mwp-di-selayar', tanggal_terbit: '2021-05-05', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-sulteng', judul: 'Okezone: Investasi Rp3,3 triliun PLTS berbasis baterai dikembangkan di 10 lokasi terisolasi (60 MWp; 22 Sep 2026); dimuat di proyek.json pjb_011', penerbit: 'Okezone', url: 'https://economy.okezone.com/read/2026/09/22/320/3243554/investasi-rp3-3-triliun-plts-berbasis-baterai-dikembangkan-di-10-lokasi-terisolasi', tanggal_terbit: '2026-09-22', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-psel', judul: 'Liputan6 (PSEL Legok Nangka, USD 400 juta) dan CNN Indonesia (PSEL Palembang, USD 160 juta, skema BOO, 5 Nov 2026); dimuat di proyek.json pj_0043 dan pj_0054', penerbit: 'Liputan6, CNN Indonesia', url: 'https://www.cnnindonesia.com/ekonomi/20261105184809-97-1423822/psel-palembang-hampir-rampung-1000-ton-sampah-diolah-per-hari', tanggal_terbit: '2026-11-05', lisensi: 'Berita, angka dikutip', tingkat_bukti: 'media' },
  { id: 's-atap-hitung', judul: 'Asumsi kalkulator PLTS atap METI (public/data/plts_atap_hitung.json): Rp13-18 juta/kWp rumah 3-10 kWp; Rp9-13 juta/kWp di atas 100 kWp', penerbit: 'METI (repo ini)', url: 'https://platformmeti.timitbnpb.workers.dev/', tanggal_terbit: '2026-11-07', lisensi: 'Data repo', tingkat_bukti: 'hipotesis', catatan: 'Hipotesis kisaran pasar, bukan hasil survei; ubah sesuai penawaran' },
  { id: 's-iesr-iseo', judul: 'IESR, Indonesia Solar Energy Outlook 2025 (data/strategis/iseo2025.json: iseo-039, -041, -042)', penerbit: 'IESR', url: 'https://iesr.or.id/', tanggal_terbit: '2025', lisensi: 'Hanya angka dan parafrase', tingkat_bukti: 'kajian' },
];

const P = (nilai, sumber_id, tingkat_bukti, catatan) => ({ nilai, sumber_id, tingkat_bukti, tanggal: TANGGAL, ...(catatan ? { catatan } : {}) });
const usd = (rpJuta) => Math.round((rpJuta * 1e6) / KURS);
const rpJutaPerKw = (u) => Math.round((u * KURS) / 1e5) / 10;
const R = (r, t, h, s, b, tg, cat) => ({ rendah: r, tengah: t, tinggi: h, sumber_id: s, tingkat_bukti: b, tanggal: tg || TANGGAL, ...(cat ? { catatan: cat } : {}) });

// Tiap skala: capex_usd_kw {rendah,tengah,tinggi}; capex_rp_juta_kw dihitung (EST, KURS) kecuali sumber asli rupiah.
const SKALA = [
  { id: 'plts-atap-rumah', teknologi: 'surya', nama: 'PLTS atap rumah (1-10 kWp), on-grid PLN', mw_contoh: 0.005, kelas: 'indonesia',
    capex_rp_juta_kw: R(13, 15, 18, 's-atap-hitung', 'hipotesis', null, 'kisaran pasar sistem 3-10 kWp terpasang; basis Rp'),
    opex: { persen_capex_per_tahun: P(1, 's-atap-hitung', 'hipotesis'), ganti_inverter_persen_capex: P(8, 's-atap-hitung', 'hipotesis', 'tahun ke-12') },
    waktu_bangun: null, rujukan_proyek: ['pjb_015'] },
  { id: 'plts-atap-industri', teknologi: 'surya', nama: 'PLTS atap komersial/industri (di atas 100 kWp sampai 1 MWp)', mw_contoh: 1, kelas: 'indonesia',
    capex_rp_juta_kw: R(9, 11, 13, 's-atap-hitung', 'hipotesis', null, 'kisaran pasar sistem di atas 100 kWp; basis Rp'),
    opex: { persen_capex_per_tahun: P(1, 's-atap-hitung', 'hipotesis') }, waktu_bangun: null },
  { id: 'plts-cni-as', teknologi: 'surya', nama: 'PLTS komunitas dan C&I 1-5,5 MW (pembanding AS)', mw_contoh: 3, kelas: 'pembanding',
    capex_usd_kw: R(1750, 2350, 2950, 's-lazard-2026', 'resmi', null, 'tengah = titik tengah rentang (EST); basis AS, bukan Indonesia'),
    opex: { usd_kw_tahun: { rendah: 13, tinggi: 20, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL } },
    cf_persen: { rendah: 15, tinggi: 20, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    lcoe_usd_mwh: { rendah: 88, tinggi: 197, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    waktu_bangun: { bulan: 6, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL } },
  { id: 'plts-utilitas-dunia', teknologi: 'surya', nama: 'PLTS utilitas, rata-rata dunia 2024 (IRENA)', mw_contoh: 100, kelas: 'pembanding',
    capex_usd_kw: R(489, 691, 1610, 's-irena-2024', 'resmi', null, 'persentil 5, rata-rata berbobot, persentil 95; USD 2024'),
    opex: { usd_kw_tahun: { tengah: 6.2, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL, catatan: 'rata-rata O&M utilitas dunia 2023 (BNEF via IRENA)' } },
    cf_persen: { rendah: 11.5, tengah: 17.4, tinggi: 22.6, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    lcoe_usd_mwh: { tengah: 43, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    waktu_bangun: null },
  { id: 'plts-utilitas-as', teknologi: 'surya', nama: 'PLTS utilitas 100-200 MW (pembanding AS)', mw_contoh: 100, kelas: 'pembanding',
    capex_usd_kw: R(1250, 1550, 1850, 's-lazard-2026', 'resmi', null, 'tengah = titik tengah (EST); basis AS'),
    opex: { usd_kw_tahun: { rendah: 8.25, tinggi: 26.25, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL } },
    cf_persen: { rendah: 20, tinggi: 30, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    lcoe_usd_mwh: { rendah: 40, tinggi: 98, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    waktu_bangun: { bulan: 12, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL, catatan: '12 bulan (sisi 200 MW) sampai 18 bulan' } },
  { id: 'plts-program-100gwp', teknologi: 'surya', nama: 'Program PLTS 100 GWp nasional (skala sangat besar, perkiraan pemerintah/METI)', mw_contoh: 100, kelas: 'indonesia',
    capex_rp_juta_kw: R(9.6, 11.4, 14.4, 's-meti-100gw', 'kata-pihak', null, 'rendah dan tinggi = Rp960-1.440 T / 100 GWp (METI, tanpa penyimpanan dan jaringan); tengah = Rp1.140 T / 100 GWp (Bahlil). Danantara: Rp1.130 T (11,3 juta/kW). Dibagi 100 GWp oleh kami (EST)'),
    catatan_kurs: 'Bahlil: Rp1.140 T = USD 71,3 M (15.988/USD, USD 713/kWp); ANTARA EN: USD 62 M (18.387/USD). Selisih kurs tidak dijelaskan sumber.',
    opex: null, waktu_bangun: { bulan: 36, sumber_id: 's-bahlil-100gw', tingkat_bukti: 'media', tanggal: TANGGAL, catatan: 'target selesai tiga tahun (berita 25 Agu 2026)' }, rujukan_proyek: ['pj_0333'] },
  { id: 'plts-terapung-cirata', teknologi: 'surya', nama: 'PLTS terapung Cirata, 192 MWp / 145 MWac (beroperasi Nov 2023)', mw_contoh: 192, kelas: 'proyek',
    total_usd_juta: P(129, 's-cirata', 'media', 'sekitar Rp1,9 T; pembiayaan SMBC, Societe Generale, Standard Chartered'),
    kapasitas_mwp: 192, rujukan_proyek: ['pj_0334', 'pj_0335'], waktu_bangun: null },
  { id: 'plts-terapung-karangkates', teknologi: 'surya', nama: 'PLTS terapung Karangkates, 100 MWac / 133 MWp (konstruksi, target Jan 2027)', mw_contoh: 133, kelas: 'proyek',
    total_usd_juta: P(90, 's-karangkates', 'media', 'sekitar USD 90 juta menurut berita; 56,54% konstruksi per 25 Agu 2026'),
    kapasitas_mwp: 133, rujukan_proyek: ['pj_0342', 'pj_0343'], waktu_bangun: null },
  { id: 'plts-14-proyek-pln', teknologi: 'surya', nama: '14 proyek PLTS tahap awal (terapung, Madura+BESS, Bali, dll; 5,3 GW per Bahlil)', mw_contoh: 5300, kelas: 'proyek',
    total_usd_juta: P(7700, 's-pln-14plts', 'media', 'USD 7,7 M = Rp135 T (tersirat Rp17.532/USD). Kapasitas 5,3 GW dari ANTARA 5710505 (14 proyek); sebagian proyek menyertakan BESS sehingga USD/kW tidak murni PLTS (EST)'),
    kapasitas_mwp: 5300, waktu_bangun: null },
  { id: 'plts-bess-hibrid-selayar', teknologi: 'surya+baterai', nama: 'PLTS hibrid 1,3 MWp Selayar (2021)', mw_contoh: 1.3, kelas: 'proyek',
    total_rp_miliar: P(39, 's-selayar', 'media', 'berita tidak memerinci kapasitas baterai; angka Rp, tahun 2021'), kapasitas_mwp: 1.3, waktu_bangun: null },
  { id: 'plts-bess-hibrid-sulteng', teknologi: 'surya+baterai', nama: 'PLTS+BESS dedieselisasi Sulawesi Tengah, 10 lokasi terisolasi, 60 MWp', mw_contoh: 60, kelas: 'proyek',
    total_rp_miliar: P(3300, 's-sulteng', 'media', 'kapasitas baterai tidak disebut berita; Rp55 juta/kWp sudah termasuk BESS dan tersebar di 10 lokasi'), kapasitas_mwp: 60, rujukan_proyek: ['pjb_011'], waktu_bangun: null },
  { id: 'pltb-dunia', teknologi: 'bayu', nama: 'PLTB darat, rata-rata dunia 2024 (IRENA)', mw_contoh: 50, kelas: 'pembanding',
    capex_usd_kw: R(727, 1041, 2110, 's-irena-2024', 'resmi', null, 'persentil 5, berbobot, 95; "Asia lain" (termasuk Indonesia): 1.277 / 1.912 / 3.764'),
    opex: { usd_kw_tahun: { rendah: 20, tinggi: 93, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL, catatan: 'Brasil 20, Jerman ~49, Jepang 93' } },
    cf_persen: { rendah: 24, tengah: 34, tinggi: 56, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    lcoe_usd_mwh: { rendah: 24, tengah: 34, tinggi: 75, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    waktu_bangun: null },
  { id: 'pltb-as', teknologi: 'bayu', nama: 'PLTB darat 200-300 MW (pembanding AS)', mw_contoh: 250, kelas: 'pembanding',
    capex_usd_kw: R(1900, 2325, 2750, 's-lazard-2026', 'resmi', null, 'tengah = titik tengah (EST)'),
    opex: { usd_kw_tahun: { rendah: 24.5, tinggi: 40, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL } },
    cf_persen: { rendah: 30, tinggi: 55, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    lcoe_usd_mwh: { rendah: 37, tinggi: 99, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    waktu_bangun: { bulan: 18, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL } },
  { id: 'pltb-sidrap-1', teknologi: 'bayu', nama: 'PLTB Sidrap tahap I, 75 MW', mw_contoh: 75, kelas: 'proyek',
    total_usd_juta: P(150, 's-sidrap', 'media', 'USD 150 juta menurut pengembang UPC Renewables (via ANTARA 2020)'), kapasitas_mwp: 75, rujukan_proyek: ['pj_0006'], waktu_bangun: null },
  { id: 'pltb-sidrap-2', teknologi: 'bayu', nama: 'PLTB Sidrap tahap II, 60-70 MW (rencana 2020)', mw_contoh: 65, kelas: 'proyek',
    total_usd_juta: P(125, 's-sidrap', 'media', 'kapasitas 60-70 MW; USD/kW dihitung dengan titik tengah 65 MW (EST)'), kapasitas_mwp: 65, waktu_bangun: null },
  { id: 'pltp-indonesia', teknologi: 'panas-bumi', nama: 'PLTP, Indonesia 2024 (IRENA) dan pembanding AS', mw_contoh: 50, kelas: 'indonesia',
    capex_usd_kw: R(5135, 6042, 6635, 's-irena-2024', 'resmi', null, 'tengah = TIC Indonesia 2024 (IRENA, Gambar 1.17); rendah-tinggi = Lazard 2026 AS (5.135-6.635). Eksplorasi dan pengeboran bisa mencapai 50% pengeluaran proyek (IEA/US DoE via IRENA). Indonesia 2022 sekitar 4,5 ribu USD/kW terbaca dari grafik, tidak dimuat'),
    opex: { usd_kw_tahun: { tengah: 125, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL, catatan: 'asumsi IRENA proyek 2024, termasuk dua set sumur isi ulang dan injeksi; Lazard tetap 14,5-15,75 + variabel 9-25 USD/MWh' } },
    cf_persen: { rendah: 80, tengah: 85, tinggi: 90, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL, catatan: 'Indonesia di atas 85% (IRENA); global baru 88%; Lazard 80-90' },
    lcoe_usd_mwh: { rendah: 67, tengah: 90, tinggi: 111, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL, catatan: 'tengah = Indonesia 2024 (IRENA); rentang = Lazard; global rata-rata IRENA 60' },
    waktu_bangun: { bulan: 36, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL }, rujukan_proyek: ['pj_0265', 'pj_0266'] },
  { id: 'plta-dunia', teknologi: 'hidro', nama: 'PLTA, rata-rata dunia 2024 dan menurut kelas kapasitas (IRENA)', mw_contoh: 100, kelas: 'pembanding',
    capex_usd_kw: R(1011, 2267, 4407, 's-irena-2024', 'resmi', null, 'rata-rata berbobot proyek baru 2024 = 2.267; rendah/tinggi = persentil 5 dan 95 kelas 0-50 MW 2010-2024 (rata-rata kelas 2.067). Sangat bergantung lokasi'),
    opex: { persen_capex_per_tahun: { rendah: 2, tinggi: 2.5, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL, catatan: 'IPCC 2011 via IRENA; IEA: 2,2% besar, 2,2-3% kecil' } },
    cf_persen: { rendah: 23, tengah: 48, tinggi: 80, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    lcoe_usd_mwh: { tengah: 57, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    waktu_bangun: { bulan_rendah: 84, bulan_tinggi: 108, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL, catatan: 'PLTA besar 7-9 tahun atau lebih' }, rujukan_proyek: ['pj_0066', 'pj_0197'] },
  { id: 'pltm-asia-lain', teknologi: 'hidro', nama: 'PLTM/PLTMH (hidro kecil), Asia lain 2018-2024 (IRENA)', mw_contoh: 5, kelas: 'pembanding',
    capex_usd_kw: R(2175, 2414, 2414, 's-irena-2024', 'resmi', null, 'tengah = Asia lain 2018-2024 (2.414); rendah = 2010-2017 (2.175); Tiongkok 1.873, India 2.963, Afrika 4.084. Tinggi tidak tersedia (diisi sama dengan tengah)'),
    waktu_bangun: null, rujukan_proyek: ['pj_0199', 'pj_0200'] },
  { id: 'bioenergi-dunia', teknologi: 'bioenergi', nama: 'Bioenergi per bahan baku (rentang persentil 5-95 menurut negara, 2000-2024)', mw_contoh: 10, kelas: 'pembanding',
    capex_usd_kw: R(603, null, 5864, 's-irena-2024', 'resmi', null, 'rendah = ampas tebu India 603 (sekam padi Tiongkok 746); tinggi = sampah kota terbarukan Tiongkok 5.864 (gas TPA India 5.171; Eropa kayu limbah 7.848). Rata-rata tidak diberikan'),
    cf_persen: { rendah: 85, tinggi: 95, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL, catatan: 'bila pasokan bahan baku stabil; musiman lebih rendah' },
    lcoe_usd_mwh: { tengah: 87, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    waktu_bangun: null },
  { id: 'pltsa-psel-bandung', teknologi: 'biomassa-sampah', nama: 'PSEL Legok Nangka Bandung, 40,79 MW, 2.000 ton/hari', mw_contoh: 40.79, kelas: 'proyek',
    total_usd_juta: P(400, 's-psel', 'media', 'sekitar Rp7,2 T'), kapasitas_mwp: 40.79, rujukan_proyek: ['pj_0043'], waktu_bangun: null },
  { id: 'pltsa-psel-palembang', teknologi: 'biomassa-sampah', nama: 'PSEL Palembang, 17,7 MW (skema BOO)', mw_contoh: 17.7, kelas: 'proyek',
    total_usd_juta: P(160, 's-psel', 'media', 'hampir Rp3 T; proyek.json memuat dua kapasitas (17,7 dan 18,6 MW), dipakai 17,7'), kapasitas_mwp: 17.7, rujukan_proyek: ['pj_0054'], waktu_bangun: null },
  { id: 'bess-global', teknologi: 'baterai', nama: 'BESS utilitas (USD/kWh): rata-rata dunia 2024 dan pembanding AS', mw_contoh: 50, kelas: 'pembanding', satuan_utama: 'USD/kWh',
    capex_usd_kwh: R(165, 192, 365, 's-irena-2024', 'resmi', null, '165 = turnkey rata-rata dunia 2024; 192 = proyek terpasang dunia 2024 (turun 93% dari 2.571 pada 2010); 365 = tinggi Lazard 4 jam. Lazard 2 jam 270-580, 4 jam 270-365 (USD/kWh). Per kW 4 jam Lazard = 1.080-1.460 (EST)'),
    opex: { usd_kwh_tahun: { rendah: 3.75, tinggi: 8.75, sumber_id: 's-lazard-2026', tingkat_bukti: 'resmi', tanggal: TANGGAL } }, waktu_bangun: null },
];

export function turunkan(s) {
  const o = { ...s };
  if (o.capex_usd_kw && !o.capex_rp_juta_kw) o.capex_rp_juta_kw = { ...o.capex_usd_kw, rendah: rpJutaPerKw(o.capex_usd_kw.rendah), tengah: o.capex_usd_kw.tengah == null ? null : rpJutaPerKw(o.capex_usd_kw.tengah), tinggi: rpJutaPerKw(o.capex_usd_kw.tinggi), tingkat_bukti: o.capex_usd_kw.tingkat_bukti, turunan: 'EST: USD/kW x KURS' };
  if (o.capex_rp_juta_kw && !o.capex_usd_kw) o.capex_usd_kw = { ...o.capex_rp_juta_kw, rendah: usd(o.capex_rp_juta_kw.rendah), tengah: usd(o.capex_rp_juta_kw.tengah), tinggi: usd(o.capex_rp_juta_kw.tinggi), turunan: 'EST: Rp/kW dibagi KURS' };
  if (o.capex_usd_kwh && !o.capex_rp_juta_kw) o.capex_rp_juta_kwh = { rendah: rpJutaPerKw(o.capex_usd_kwh.rendah), tengah: rpJutaPerKw(o.capex_usd_kwh.tengah), tinggi: rpJutaPerKw(o.capex_usd_kwh.tinggi), turunan: 'EST: USD/kWh x KURS (juta Rp per kWh)' };
  if (o.total_usd_juta || o.total_rp_miliar) {
    const usdJuta = o.total_usd_juta ? o.total_usd_juta.nilai : (o.total_rp_miliar.nilai * 1e9) / KURS / 1e6;
    const rpMiliar = o.total_rp_miliar ? o.total_rp_miliar.nilai : (o.total_usd_juta.nilai * 1e6 * KURS) / 1e9;
    const rpJutaKw = (rpMiliar * 1e9) / (o.kapasitas_mwp * 1000) / 1e6;
    o.hitung = { usd_per_kw: Math.round((usdJuta * 1e6) / (o.kapasitas_mwp * 1000)), rp_juta_per_kw: Math.round(rpJutaKw * 10) / 10, rp_miliar: Math.round(rpMiliar), tingkat_bukti: 'EST', catatan: 'total proyek / kapasitas (MW atau MWp sesuai kapasitas_mwp) dengan KURS' };
  }
  if (o.capex_rp_juta_kw && o.mw_contoh) {
    const f = (v) => v == null ? null : Math.round((v * o.mw_contoh * 1000) / 1000 * 10) / 10; // juta Rp/kW x MW x 1000 kW = juta Rp; /1000 = miliar
    o.contoh_total_rp_miliar = { mw: o.mw_contoh, rendah: f(o.capex_rp_juta_kw.rendah), tengah: f(o.capex_rp_juta_kw.tengah), tinggi: f(o.capex_rp_juta_kw.tinggi), tingkat_bukti: 'EST', turunan: 'Rp juta/kW x MW' };
  }
  return o;
}

// Bagan pecahan biaya: bagian disajikan seperti sumber. Rata-rata negara tidak berjumlah 100%.
const KOMPONEN = [
  { id: 'plts-utilitas-irena-2024', skala: 'plts-utilitas-dunia', basis: 'rata-rata negara terpilih IRENA 2024 (Gambar 3.4), persen TIC; tidak berjumlah 100 karena tiap rata-rata dari himpunan berbeda', sumber_id: 's-irena-2024', tingkat_bukti: 'resmi',
    bagian: [{ k: 'modul+inverter', persen: 35, rentang: [16, 49] }, { k: 'BoS perangkat keras (struktur, kabel, sambungan, pemantauan)', persen: 33, usd_kw: 239, rentang: [22, 50] }, { k: 'pemasangan (mekanis, listrik, inspeksi)', persen: 18, usd_kw: 151, rentang: [10, 28] }, { k: 'biaya lunak (desain, izin, margin, pembiayaan)', persen: 20 }],
    ternormalisasi_est: { 'modul+inverter': 33, 'BoS perangkat keras': 31, pemasangan: 17, 'biaya lunak': 19, catatan: 'EST: keempat angka di atas dibagi jumlahnya (106) untuk bagan lingkaran' } },
  { id: 'plts-indonesia-iesr', skala: 'plts-program-100gwp', basis: 'IESR ISEO 2025 hlm 35 (mengutip IRENA), PLTS utilitas Indonesia', sumber_id: 's-iesr-iseo', tingkat_bukti: 'kajian',
    bagian: [{ k: 'modul', persen_rentang: [35, 45] }, { k: 'BoS perangkat keras', persen_rentang: [20, 32] }], catatan: 'modul turun 44% dan biaya lunak turun 38% (2018-2022); biaya total turun 19%; lama konstruksi 500 hari (2017) menjadi sekitar 120 hari (2023); modul lokal 30-45% lebih mahal dari impor' },
  { id: 'plta-eropa-2021', skala: 'plta-dunia', basis: 'IHA via IRENA Tabel 6.1, sampel Eropa 2021 (bukan Indonesia), persen TIC sipil/mekanis/listrik', sumber_id: 's-irena-2024', tingkat_bukti: 'resmi',
    bagian: [{ k: 'reservoir (kepala tinggi)', sipil: 70, mekanis: 10, listrik: 20 }, { k: 'aliran sungai besar', sipil: 50, mekanis: 30, listrik: 20 }, { k: 'aliran sungai kecil (PLTM)', sipil: 50, mekanis: 30, listrik: 20 }] },
  { id: 'pltp-eksplorasi', skala: 'pltp-indonesia', basis: 'IRENA (IEA 2024b; US DoE 2019): eksplorasi dan pengeboran dapat mencapai 50% pengeluaran proyek', sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', bagian: [{ k: 'eksplorasi dan pengeboran', persen_maks: 50 }] },
];

const TITIK = (x, y, sumber_id, tingkat_bukti, catatan) => ({ x, y, sumber_id, tingkat_bukti, tanggal: TANGGAL, ...(catatan ? { catatan } : {}) });

// Kurva skala ekonomi: x = MW (log), y = USD/kW. Seri berbeda basis; jangan digabung dalam satu garis tanpa label.
const KURVA = [
  { id: 'surya-indonesia', basis: 'Indonesia: hipotesis kalkulator + total proyek dibagi kapasitas (EST) + program nasional; USD pada KURS', titik: [
    TITIK(0.005, usd(15), 's-atap-hitung', 'hipotesis', 'atap rumah, Rp15 juta/kWp'), TITIK(1, usd(11), 's-atap-hitung', 'hipotesis', 'atap industri, Rp11 juta/kWp'),
    TITIK(133, Math.round(90e6 / 133e3), 's-karangkates', 'EST', 'terapung Karangkates, USD 90 juta / 133 MWp'), TITIK(192, Math.round(129e6 / 192e3), 's-cirata', 'EST', 'terapung Cirata, USD 129 juta / 192 MWp'),
    TITIK(100000, Math.round(71.3e9 / 100e6), 's-bahlil-100gw', 'EST', 'program 100 GWp, USD 71,3 M / 100 GWp (belum termasuk selisih USD 62 M versi ANTARA EN)')] },
  { id: 'surya-lazard-as', basis: 'AS, tengah rentang (EST)', titik: [TITIK(3, 2350, 's-lazard-2026', 'EST', 'C&I 1-5,5 MW'), TITIK(150, 1550, 's-lazard-2026', 'EST', 'utilitas 100-200 MW')] },
  { id: 'hidro-irena', basis: 'dunia 2010-2024, rata-rata berbobot per kelas kapasitas (titik tengah kelas), IRENA Tabel 6.2', titik: [[25, 2067], [75, 2261], [125, 2117], [175, 2089], [225, 2376], [275, 2478], [325, 2318], [375, 1804], [425, 2288], [475, 1773], [575, 2084], [725, 1792], [925, 1295]].map(([x, y]) => TITIK(x, y, 's-irena-2024', 'resmi')),
    catatan: 'IRENA: tidak ada skala ekonomi kuat di bawah 450 MW; ada indikasi di atas 700 MW. Kelas 801-850 (3.801), 501-550 (3.036) dan 951-1000 (satu proyek) tidak dimuat karena pencilan sampel kecil' },
  { id: 'proyek-pltsa', basis: 'Indonesia, total/ kapasitas (EST)', titik: [TITIK(17.7, Math.round(160e6 / 17.7e3), 's-psel', 'EST', 'PSEL Palembang'), TITIK(40.79, Math.round(400e6 / 40.79e3), 's-psel', 'EST', 'PSEL Bandung')] },
  { id: 'bayu-indonesia', basis: 'Indonesia, total/kapasitas (EST)', titik: [TITIK(75, 2000, 's-sidrap', 'EST', 'Sidrap I USD 150 juta / 75 MW'), TITIK(65, Math.round(125e6 / 65e3), 's-sidrap', 'EST', 'Sidrap II USD 125 juta / 65 MW (titik tengah 60-70)')] },
];

// Tren: seri baru dari tabel IRENA (USD 2024 riil). Seri harga_komponen.json (tic-surya, tic-bayu, sistem-baterai, pack) dirujuk, tidak disalin.
const TREN = {
  rujukan_ada: { berkas: 'harga_komponen.json', deret: ['tic-surya', 'tic-bayu', 'sistem-baterai', 'pack'], catatan: 'seri global 2010-2024 yang sudah ada; baca dari sana' },
  baru: [
    { id: 'surya-asia-lain', satuan: 'USD/kW', basis: 'USD 2024, PLTS utilitas "Asia lain" (termasuk Indonesia), rata-rata berbobot', titik: [TITIK(2015, 2652, 's-irena-2024', 'resmi'), TITIK(2024, 1133, 's-irena-2024', 'resmi')] },
    { id: 'surya-india', satuan: 'USD/kW', basis: 'USD 2024, PLTS utilitas India', titik: [TITIK(2015, 1548, 's-irena-2024', 'resmi'), TITIK(2024, 525, 's-irena-2024', 'resmi')] },
    { id: 'surya-tiongkok', satuan: 'USD/kW', basis: 'USD 2024, PLTS utilitas Tiongkok', titik: [TITIK(2015, 1623, 's-irena-2024', 'resmi'), TITIK(2024, 591, 's-irena-2024', 'resmi')] },
    { id: 'bayu-asia-lain', satuan: 'USD/kW', basis: 'USD 2024, PLTB darat Asia lain', titik: [TITIK(2010, 2960, 's-irena-2024', 'resmi'), TITIK(2024, 1912, 's-irena-2024', 'resmi')] },
    { id: 'hidro-dunia', satuan: 'USD/kW', basis: 'USD 2024, PLTA baru dunia, rata-rata berbobot', titik: [TITIK(2010, 1494, 's-irena-2024', 'resmi'), TITIK(2018, 1709, 's-irena-2024', 'resmi'), TITIK(2024, 2267, 's-irena-2024', 'resmi', 'puncak 2022 karena proyek besar melampaui anggaran')] },
    { id: 'pltp-indonesia', satuan: 'USD/kW', basis: 'USD 2024, TIC PLTP Indonesia', titik: [TITIK(2024, 6042, 's-irena-2024', 'resmi', 'IRENA: "naik tajam"; titik 2022 dan 2023 hanya terbaca dari grafik, tidak dimuat')] },
    { id: 'surya-utilitas-as-lazard', satuan: 'USD/kW', basis: 'USD, Lazard 2026 utilitas 100-200 MW', titik: [TITIK(2026, 1550, 's-lazard-2026', 'EST', 'tengah rentang 1.250-1.850')], catatan: 'Lazard menyatakan penurunan LCOE surya utilitas 2009-2026 sebesar 81% dan angin darat 52% (basis LCOE, bukan capex)' },
  ],
};

export const CELAH = [
  'Hidrogen hijau (elektroliser, USD/kW): tidak ada sumber terbuka yang berhasil dibaca. irena.org membalas 403, nrel.gov tak terjangkau, laporan IEA Global Hydrogen Review tidak ditemukan pada URL yang dicoba. Sel sengaja kosong; bukan angka karangan.',
  'Biogas POME dan PLTBm (biomassa) Indonesia: tidak ada total investasi bersumber yang ditemukan. Hanya pembanding dunia (bioenergi-dunia) dan PSEL (sampah kota).',
  'Katalog teknologi ESDM/DEA "Technology Data for the Indonesian Power Sector" tidak diunduh: halaman ens.dk yang dicoba 404. NREL ATB, BNEF, RUPTL dan laporan tahunan emiten belum diambil. Rujukan Indonesia terkuat saat ini = berita investasi proyek, IRENA (PLTP Indonesia) dan IESR.',
  'Rincian biaya PLTS Indonesia (modul, BoS, instalasi, biaya lunak) hanya berupa grafik (IRENA Gambar 3.5) tanpa angka; tidak dimuat. Yang dimuat: persentase IESR dan rata-rata negara IRENA.',
  'Rincian komponen PLTB, PLTP (selain eksplorasi), bioenergi, dan BESS tidak tersedia dari sumber yang dibaca; kontinjensi dan biaya pengembangan (lahan, interkoneksi) tidak dipisah oleh sumber manapun yang dibaca.',
  'Sidrap I (USD 150 juta) memakai kapasitas 75 MW dari proyek.json (pj_0006), bukan dari artikel yang dibaca. Tahun nilai investasi berbeda (2020 sampai 2026); tidak ada penyesuaian inflasi.',
  'Kurs: Rp16.000/USD adalah Hipotesis. Sumber sendiri tidak konsisten (Rp15.988 versus Rp18.387 untuk angka 100 GWp; Rp17.532 untuk 14 proyek PLTS). Semua kolom Rp turunan berlabel EST.',
  'Biaya lahan, interkoneksi, pengembangan, dan kontinjensi per persen: tidak ada data bersumber; jangan menampilkannya sebagai fakta.',
];

export function bangun() {
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, kurs_rp_usd: { nilai: KURS, tingkat_bukti: 'hipotesis', catatan: 'lihat CELAH' },
    sumber: SUMBER, skala: SKALA.map(turunkan), komponen: KOMPONEN, kurva_skala: KURVA, tren: TREN,
    pembaca_disarankan: ['public/plts_atap_hitung / kalkulator (rujuk plts-atap-rumah, plts-atap-industri)', 'halaman biaya listrik / harga komponen (kurva dan tren)', 'public/peluang.js (contoh_total_rp_miliar)', 'topik surya, bayu, panas bumi, hidro, hidrogen, penyimpanan (rujuk id skala)'],
    celah: CELAH,
  };
}
export const baca = (f) => JSON.parse(fs.readFileSync(AKAR + 'public/data/' + f, 'utf8'));
