/* Pembangun public/data/keberlanjutan.json (kunci org_id). Benih di bawah HANYA berisi angka yang dibaca langsung dari PDF resmi
   (diunduh ke scratchpad, tidak masuk repo). Tambah perusahaan = tambah entri BENIH; jangan mengarang angka. Jalankan: node scripts/panen/keberlanjutan.mjs */
import { readFileSync, writeFileSync } from "node:fs";

const TGL = "2026-11-08";
const PGE21 = "https://www.pge.pertamina.com/media/Uploads/laporan-keberlanjutan/Laporan-Keberlanjutan-TB-2021.pdf";
const PGE20 = "https://www.pge.pertamina.com/media/Uploads/laporan-keberlanjutan/2020-laporan-keberlanjutan-pge.pdf";
const NP24 = "https://www.plnnusantarapower.co.id/storage/investor_sustainability_report/files/afPU5JgIIbtyWbk8VzL2YoyngU3kuoAqUAXIKpvj.pdf";
const IK = (a) => `https://www.indikaenergy.co.id/wp-content/uploads/${a}`;
const IK24 = IK("2025/04/2024-Indika-Energy-Sustainability-Report-1.pdf");
const VL23 = "https://vale.com/documents/d/guest/pt-vale-laporan-keberlanjutan-2023-eng";
const R = (a) => a.map((x) => ({ bukti: "resmi", tanggal: TGL, ...x }));
const NP23 = "https://plnnusantarapower.co.id/storage/investor_sustainability_report/files/dDTEuZPX5yztZznN5sBvCCLm7kbjrEARffARROkB.pdf";
// m(kunci, tahun, nilai, satuan, sumber, halaman): satu angka bersumber. bukti "resmi" = dibaca dari laporan perusahaan sendiri.
const m = (kunci, tahun, nilai, satuan, sumber, hal, catatan = "") => ({ kunci, tahun, nilai, satuan, sumber, hal, bukti: "resmi", tanggal: TGL, ...(catatan && { catatan }) });

export const BENIH = {
  p_dda1e51dae: { // PT Pertamina Geothermal Energy Tbk
    laporan: [
      { tahun: 2020, jenis: "keberlanjutan", url: PGE20 },
      { tahun: 2021, jenis: "keberlanjutan", url: PGE21 },
      { tahun: 2022, jenis: "indeks", url: "https://www.pge.pertamina.com/en/report", judul: "Halaman laporan PGE (2022-2025 berupa tautan Google Drive)" },
    ].map((x) => ({ bukti: "resmi", tanggal: TGL, ...x })),
    metrik: [
      m("emisi_s1", 2020, 109701.16, "tCO2e", PGE21, 67, "pembanding di laporan 2021"), m("emisi_s1", 2021, 106968.27, "tCO2e", PGE21, 67),
      m("emisi_s2", 2020, 3266.67, "tCO2e", PGE21, 67), m("emisi_s2", 2021, 2860.92, "tCO2e", PGE21, 67),
      m("emisi_s3", 2020, 87713.23, "tCO2e", PGE21, 67, "hanya penjualan uap; rantai pasok belum dihitung"), m("emisi_s3", 2021, 77490.57, "tCO2e", PGE21, 67, "hanya penjualan uap; rantai pasok belum dihitung"),
      m("intensitas", 2020, 0.0435, "tCO2e/MWh", PGE21, 67), m("intensitas", 2021, 0.0402, "tCO2e/MWh", PGE21, 67),
      m("kapasitas_ebt", 2021, 672, "MW", PGE21, null, "operasi sendiri; 1.205 MW lain lewat Joint Operation Contract"),
      m("fatalitas", 2021, 0, "kasus", PGE21, null), m("trir", 2020, 0.19, "skor", PGE21, null), m("trir", 2021, 0, "skor", PGE21, null),
    ],
    standar: [{ tahun: 2021, nama: "GRI Standards" }],
    penjaminan: [{ tahun: 2021, pihak: "SR Asia", sumber: PGE21 }],
    pasar: [
      { jenis: "ipo", tanggal: "2023-02", nilai: 9050000000000, mata_uang: "IDR", penggunaan: "sebagian untuk pelunasan utang pemegang saham (sekitar USD100 juta)", bukti: "via-pihak-ketiga", sumber: "https://market.bisnis.com/read/20230518/192/1657086/pertamina-geothermal-pgeo-siapkan-geen-bond-jilid-ii-berapa-nilainya-dan-kapan", tanggal_periksa: TGL, catatan: "nilai dan penggunaan dana dari laporan media; prospektus IDX belum dibaca" },
      { jenis: "obligasi-hijau", tanggal: "2023-04", nilai: 400000000, mata_uang: "USD", kupon: null, penggunaan: "kerangka pembiayaan hijau PGE (termasuk refinancing)", bukti: "via-pihak-ketiga", sumber: "https://market.bisnis.com/read/20230510/192/1654487/green-bond-pertamina-geothermal-pgeo-laris-manis-diburu-investor", tanggal_periksa: TGL, catatan: "terbit di pasar internasional, kelebihan permintaan 8,25 kali; kupon belum dibaca dari dokumen penawaran" },
    ],
  },
  p_ff7a390a42: { // PT PLN Nusantara Power
    laporan: [
      { tahun: 2023, jenis: "keberlanjutan", url: NP23 }, { tahun: 2024, jenis: "keberlanjutan", url: NP24 },
    ].map((x) => ({ bukti: "resmi", tanggal: TGL, ...x })),
    metrik: [
      m("emisi_s1", 2021, 39767149.68, "tCO2e", NP23, 10), m("emisi_s1", 2022, 38970988.71, "tCO2e", NP23, 10), m("emisi_s1", 2023, 49556898.19, "tCO2e", NP23, 10),
      m("emisi_s2", 2022, 1004.69, "tCO2e", NP23, 10), m("emisi_s2", 2023, 2217.34, "tCO2e", NP23, 10),
      m("emisi_s3", 2022, 126742.55, "tCO2e", NP23, 10), m("emisi_s3", 2023, 301601.26, "tCO2e", NP23, 10),
      m("intensitas", 2021, 0.84, "tCO2e/MWh", NP23, 10, "cakupan 1"), m("intensitas", 2022, 0.83, "tCO2e/MWh", NP23, 10, "cakupan 1"), m("intensitas", 2023, 0.78, "tCO2e/MWh", NP23, 10, "cakupan 1"),
      m("tenaga_kerja", 2021, 3071, "orang", NP23, null), m("tenaga_kerja", 2022, 3034, "orang", NP23, null), m("tenaga_kerja", 2023, 4985, "orang", NP23, null),
      m("emisi_s1", 2024, 52554501.83, "tCO2e", NP24, null), m("emisi_s2", 2024, 28240.76, "tCO2e", NP24, null), m("emisi_s3", 2024, 247458.36, "tCO2e", NP24, null),
      m("intensitas", 2024, 0.83, "tCO2e/MWh", NP24, null, "cakupan 1"), m("tenaga_kerja", 2024, 5077, "orang", NP24, null),
    ],
    target: [{ teks: "Selaras target nasional net zero 2060", sumber: NP23 }],
    standar: [{ tahun: 2023, nama: "GRI Standards" }, { tahun: 2023, nama: "SASB" }, { tahun: 2023, nama: "IFRS S1/S2" }, { tahun: 2024, nama: "IFRS S1/S2" }],
    penjaminan: [{ tahun: 2023, pihak: "PT SGS Indonesia (AA1000)", sumber: NP23 }, { tahun: 2024, pihak: "PT SGS Indonesia", sumber: NP24 }],
    pasar: [],
  },
  p_d3818e1614: { // PT Indika Energy Tbk
    laporan: R([{ tahun: 2023, jenis: "keberlanjutan", url: IK("2024/04/2023-Indika-Energy-Sustainability-Report.pdf") }, { tahun: 2024, jenis: "keberlanjutan", url: IK24 }, { tahun: 2025, jenis: "keberlanjutan", url: IK("2026/04/Indika-Energy-2025-Sustainability-Report.pdf") }]),
    metrik: [
      m("emisi_s1", 2022, 1155280, "tCO2e", IK24, 187), m("emisi_s1", 2023, 1023433, "tCO2e", IK24, 187), m("emisi_s1", 2024, 906800, "tCO2e", IK24, 187),
      m("emisi_s2", 2022, 5482, "tCO2e", IK24, 187), m("emisi_s2", 2023, 6576, "tCO2e", IK24, 187), m("emisi_s2", 2024, 7720, "tCO2e", IK24, 187),
    ],
    target: [{ teks: "Net zero emisi 2050", sumber: IK24 }],
    standar: [{ tahun: 2024, nama: "GRI Standards" }],
    penjaminan: [{ tahun: 2024, pihak: "SGS Indonesia", sumber: IK24 }],
    pasar: [],
  },
  pm_129dbx35045: { // PT Vale Indonesia Tbk
    laporan: R([{ tahun: 2023, jenis: "keberlanjutan", url: VL23 }, { tahun: 2024, jenis: "indeks", url: "https://vale.com/indonesia/keberlanjutan", judul: "Halaman keberlanjutan Vale Indonesia (laporan per tahun)" }]),
    metrik: [
      m("emisi_s1", 2021, 1968544, "tCO2e", VL23, 35), m("emisi_s1", 2022, 1745817, "tCO2e", VL23, 35, "disajikan ulang di laporan 2023"), m("emisi_s1", 2023, 2029486, "tCO2e", VL23, 35),
      m("emisi_s2", 2021, 2530, "tCO2e", VL23, 35), m("emisi_s2", 2022, 2735, "tCO2e", VL23, 35), m("emisi_s2", 2023, 2827, "tCO2e", VL23, 35),
      m("tenaga_kerja", 2021, 2966, "orang", VL23, null), m("tenaga_kerja", 2022, 2934, "orang", VL23, null), m("tenaga_kerja", 2023, 3023, "orang", VL23, null),
    ],
    target: [{ teks: "Netralitas karbon 2050", sumber: VL23 }],
    standar: [{ tahun: 2023, nama: "GRI Standards" }, { tahun: 2023, nama: "SASB Metals & Mining" }],
    penjaminan: [], pasar: [],
  },
  p_9de27fd5b9: { // PT Medco Energi Internasional Tbk (tautan saja)
    laporan: R([{ tahun: 2024, jenis: "indeks", url: "https://www.medcoenergi.com/en/our-sustainability/sustainability-disclosures/sustainability-report/", judul: "Halaman laporan keberlanjutan Medco" }, { tahun: 2024, jenis: "penjaminan", url: "https://www.medcoenergi.com/uploads/sreports/2024/Assurance_SR2024_ENG.pdf", judul: "Pernyataan penjaminan laporan keberlanjutan 2024" }]),
    metrik: [], pasar: [],
  },
  ix_toba: { // PT TBS Energi Utama Tbk (tautan saja)
    laporan: R([{ tahun: 2022, jenis: "keberlanjutan", url: "https://cop.unglobalcompact.org/2023/files/8456_TBS%20SR2022_020523_Hires_compressed.pdf" }]),
    metrik: [], pasar: [],
  },
};

const org = new Set(JSON.parse(readFileSync("public/data/organisasi.json", "utf8")).baris.map((x) => x.id));
export function bangun() {
  const ket = {};
  for (const [id, v] of Object.entries(BENIH)) { if (!org.has(id)) throw new Error("org_id tak ada: " + id); ket[id] = v; }
  return { lapis: "keberlanjutan", dibangun_pada: TGL, catatan: "Angka dibaca dari PDF laporan resmi; PDF tidak disimpan di repo. Cakupan baru sebagian: lihat jumlah.", jumlah: Object.keys(ket).length, org: ket };
}
if (process.argv[1]?.endsWith("keberlanjutan.mjs")) { writeFileSync("public/data/keberlanjutan.json", JSON.stringify(bangun(), null, 1) + "\n"); console.log("ok", Object.keys(BENIH).length); }
