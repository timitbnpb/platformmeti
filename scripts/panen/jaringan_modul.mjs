// /jaringan: bangun public/data/jaringan_modul.json.
// Dua bagian: (1) tabel rencana transmisi/gardu induk RUPTL 2025-2034 skenario RE Base, diurai dari teks PDF
// (data-panen/pdf/teks/ruptl-2025-2034.txt); (2) kurasi tangan (antar-pulau, lintas negara, ekspor ke Singapura, pendanaan, pemain)
// dengan sumber dan tingkat bukti per butir. Data yang sudah ada (riset/jaringan.json, curtailment.json, keandalan.json,
// pendanaan_internasional.json, organisasi.json, global/pemasok_lain.json) TIDAK disalin: hanya dirujuk lewat id.
// Jalankan: node scripts/panen/jaringan_modul.mjs   (tanpa jaringan; unduhan bukan bagian skrip ini)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TEKS = join(AKAR, "data-panen/pdf/teks/ruptl-2025-2034.txt");
const KELUAR = join(AKAR, "public/data/jaringan_modul.json");
const TAHUN = Array.from({ length: 10 }, (_, i) => 2025 + i);

/* ---------- 1. penguraian tabel RUPTL ---------- */
const angka = (s) => (s === "-" ? 0 : Number(s.replace(/\./g, "").replace(",", ".")));
const NUM = /^(-|\d{1,3}(\.\d{3})+(,\d+)?|\d+(,\d+)?)$/;

/** Baca tabel: cari judul di badan dokumen (bukan daftar isi), kumpulkan baris bernilai 10 tahun + total. */
export function uraiTabel(baris, noTabel, tipe = "kms") {
  let mulai = -1;
  baris.forEach((l, i) => { if (i > 20000 && l.includes(`Tabel ${noTabel} Rekapitulasi`)) mulai = i; });
  if (mulai < 0) throw new Error(`tabel ${noTabel} tak ditemukan`);
  const rows = {};
  let total = null;
  for (let i = mulai + 1; i < mulai + 40; i++) {
    const l = baris[i];
    if (/Tabel 5\.\d+ /.test(l) && i > mulai + 1) break;
    const tok = l.trim().split(/\s+/).filter(Boolean);
    let n = 0;
    while (n < 11 && n < tok.length && NUM.test(tok[tok.length - 1 - n])) n++;
    if (n < 10 || tok.length < n + 1) continue;
    const num = tok.slice(-n);
    let lab = tok.slice(0, -n);
    if (lab.length > 1 && /^\d+$/.test(lab[0])) lab = lab.slice(1);
    const nama = lab.join(" ").replace(/\*\)/g, "").replace(/ kV DC/i, " DC").replace(/\s*kV$/i, "").replace(/ kV DC$/i, " DC").replace(/^(\d+) kV DC$/i, "$1 DC").trim();
    if (!nama) continue;
    const v = num.map(angka);
    if (/^(Total|Jumlah)$/i.test(nama)) { total = v; break; }
    rows[nama] = v; // n === 10: satu sel tahun kosong di PDF, posisinya dicari dari baris total
  }
  if (total) for (const [k, v] of Object.entries(rows)) {
    if (v.length !== 10) continue;
    const j = total.slice(0, 10).findIndex((tj, c) => tj - Object.entries(rows).reduce((a, [k2, v2]) => a + (v2.length === 11 ? v2[c] : 0), 0) === 0 && c >= 0);
    rows[k] = [...v.slice(0, j), 0, ...v.slice(j)];
  }
  if (!total) throw new Error(`total tabel ${noTabel} tak ditemukan`);
  return { tipe, tegangan: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, { tahun: v.slice(0, 10), jumlah: v[10] }])), total: { tahun: total.slice(0, 10), jumlah: total[10] } };
}

const TABEL = {
  indonesia: { kms: "5.187", mva: "5.189" },
  sumatera: { kms: "5.191", mva: "5.192" },
  jawabali: { kms: "5.195", mva: "5.196" },
  kalimantan: { kms: "5.199", mva: "5.200" },
  sulawesi: { kms: "5.203", mva: "5.205" },
  mpnt: { kms: "5.207", mva: "5.209" },
};
const NAMA = {
  indonesia: { id: "Indonesia", en: "Indonesia" },
  sumatera: { id: "Sumatera", en: "Sumatra" },
  jawabali: { id: "Jawa, Madura, Bali", en: "Java, Madura, Bali" },
  kalimantan: { id: "Kalimantan", en: "Kalimantan" },
  sulawesi: { id: "Sulawesi", en: "Sulawesi" },
  mpnt: { id: "Maluku, Papua, Nusa Tenggara", en: "Maluku, Papua, Nusa Tenggara" },
};

export function bangunRencana(teks) {
  const baris = teks.split("\n");
  const sistem = Object.entries(TABEL).map(([id, t]) => ({ id, nama: NAMA[id], tabel: t, kms: uraiTabel(baris, t.kms, "kms"), mva: uraiTabel(baris, t.mva, "mva") }));
  return { skenario: "RE Base", tahun: TAHUN, sistem };
}

/** Pemeriksaan konsistensi: tiap baris tahun menjumlah ke total, wilayah menjumlah ke nasional (toleransi pembulatan). */
export function periksaRencana(r) {
  const salah = [];
  for (const s of r.sistem) for (const j of ["kms", "mva"]) {
    const x = s[j];
    const tot = x.total.tahun.reduce((a, b) => a + b, 0);
    if (Math.abs(tot - x.total.jumlah) > 2) salah.push(`${s.id}.${j}: tahun ${tot} != jumlah ${x.total.jumlah}`);
    const tegSum = Object.values(x.tegangan).reduce((a, v) => a + v.jumlah, 0);
    if (Math.abs(tegSum - x.total.jumlah) > 2) salah.push(`${s.id}.${j}: tegangan ${tegSum} != jumlah ${x.total.jumlah}`);
  }
  const nas = r.sistem.find((s) => s.id === "indonesia");
  for (const j of ["kms", "mva"]) {
    const w = r.sistem.filter((s) => s.id !== "indonesia").reduce((a, s) => a + s[j].total.jumlah, 0);
    if (Math.abs(w - nas[j].total.jumlah) > (j === "kms" ? 5 : 1)) salah.push(`wilayah ${j}: ${w} != nasional ${nas[j].total.jumlah}`);
  }
  return salah;
}

/* ---------- 2. kurasi ---------- */
const S = {
  ruptl: { id: "ruptl-2025", judul: "RUPTL PT PLN (Persero) 2025-2034 (Kepmen ESDM 188.K/TL.03/MEM.L/2025)", penerbit: "PT PLN (Persero); Kementerian ESDM", tahun: 2025, url: "https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf", tingkat_bukti: "resmi" },
  esdmSarawak: { id: "esdm-sarawak-2016", judul: "Indonesia - Malaysia kerja sama perkuat kelistrikan di perbatasan (ESDM, 22 Jan 2016)", penerbit: "Kementerian ESDM", tahun: 2016, url: "https://esdm.go.id/id/media-center/arsip-berita/indonesia-malaysia-kerja-sama-perkuat-kelistrikan-di-perbatasan", tingkat_bukti: "resmi" },
  emaSinga: { id: "ema-singa-2025", judul: "Singapore Grants Conditional Licence to Singa Renewables for Electricity Imports from Indonesia (30 May 2025)", penerbit: "Energy Market Authority (EMA) Singapore", tahun: 2025, url: "https://www.ema.gov.sg/news-events/news/media-releases/2025/sg-grants-conditional-licence-to-singa-renewables-for-electricity-imports-from-indonesia", tingkat_bukti: "resmi" },
  solarq: { id: "solarquarter-2024", judul: "Singapore and Indonesia boost low-carbon electricity imports with new licences and approvals (9 Sep 2024)", penerbit: "SolarQuarter", tahun: 2024, url: "https://solarquarter.com/2024/09/09/singapore-and-indonesia-boost-low-carbon-electricity-imports-with-new-licences-and-approvals/", tingkat_bukti: "media" },
  ecoSg: { id: "ecobusiness-sg-2024", judul: "Indonesia and Singapore advance low-carbon energy deals", penerbit: "Eco-Business", tahun: 2024, url: "https://www.eco-business.com/news/indonesia-and-singapore-advance-low-carbon-energy-deals/", tingkat_bukti: "media" },
  btoday: { id: "businesstoday-2023", judul: "Singapore approves to import 2GW low carbon electricity from Indonesia (8 Sep 2023)", penerbit: "Business Today Malaysia", tahun: 2023, url: "https://www.businesstoday.com.my/2023/09/08/singapore-approves-to-import-2gw-low-carbon-electricity-from-indonesia/", tingkat_bukti: "media" },
  fmtLtms: { id: "fmt-ltms-2025", judul: "Multidirectional power trade under LTMS-PIP now fully operational (16 Oct 2025)", penerbit: "Free Malaysia Today", tahun: 2025, url: "https://fmtv5.freemalaysiatoday.com/category/nation/2025/10/16/multidirectional-power-trade-under-ltms-pip-now-fully-operational", tingkat_bukti: "media" },
  ecoGrid: { id: "ecobusiness-grid-2024", judul: "Huge financing gap for grid infrastructure as investors see unattractive returns: Indonesia's state utility (11 Jun 2024)", penerbit: "Eco-Business", tahun: 2024, url: "https://www.eco-business.com/news/huge-financing-gap-for-grid-infrastructure-as-investors-see-unattractive-returns-indonesias-state-utility/", tingkat_bukti: "media" },
  iati: { id: "iati-pendanaan", judul: "Pendanaan internasional (IATI): public/data/pendanaan_internasional.json", penerbit: "IATI Registry (ADB, IsDB, FCDO)", tahun: 2026, url: "https://iatiregistry.org/", tingkat_bukti: "resmi" },
};

const lt = (id, en) => ({ id, en });

/** Titik skematik: [lng, lat]. Garis lurus antar dua titik, BUKAN trase; ditandai skematik=true. */
const P = {
  lampung: [105.6, -5.5], banten: [106.1, -6.1], kalsel: [115.0, -3.4], jateng: [110.6, -6.8], sumba: [119.9, -9.7], paiton: [113.58, -7.72], antosari: [115.05, -8.45],
  denpasar: [115.2, -8.65], lombok: [116.1, -8.6], sumbawa: [117.4, -8.5], bengkalis: [102.1, 1.45], pakning: [101.9, 1.3], selatpanjang: [102.7, 1.0], karimun: [103.4, 1.0],
  riau: [101.6, 0.5], batam: [104.0, 1.08], bintan: [104.5, 1.0], tarakan: [117.6, 3.3], bulungan: [117.35, 2.85], nunukan: [117.65, 4.1], kendari: [122.5, -3.95], raha: [122.7, -4.85],
  baubau: [122.6, -5.45], dabo: [104.5, -0.5], lingga: [104.6, -0.2], bengkayang: [109.48, 0.92], mambong: [110.33, 1.05], perawang: [101.6, 0.55], semenanjung: [102.25, 2.2],
  singapura: [103.85, 1.3], sabah: [116.1, 5.9], kaltara: [117.0, 3.0], wotu: [120.8, -2.6], palopo: [120.2, -3.0], bantaeng: [119.95, -5.55], mamuju: [118.9, -2.7], kolaka: [121.6, -4.05],
};

const ANTAR_PULAU = [
  { id: "sumatera-jawa", kelompok: "super-grid", nama: lt("Interkoneksi Sumatera-Jawa (HVDC 500 kV)", "Sumatra-Java interconnection (HVDC 500 kV)"), dari: "Sumatera", ke: "Jawa-Bali", tegangan_kv: 500, teknologi: "HVDC", status: "kajian-lanjut", cod: 2031, kapasitas_mw: 2600,
    ket: lt("RUPTL menargetkan selesai 2031 dan menyalurkan bertahap hingga 2,6 GW pada 2033 (energi air dan panas bumi Sumatera); titik koneksi dan teknologi HVDC atau HVAC masih membutuhkan kajian. Tabel rencana mencatat 1.100 kms HVDC 500 kV di Jawa dan 6.000 MVA gardu 500 kV DC.", "RUPTL targets completion in 2031 with up to 2.6 GW delivered gradually by 2033 (Sumatran hydro and geothermal); connection point and HVDC or HVAC technology still need study. The plan tables list 1,100 kms of 500 kV HVDC in Java and 6,000 MVA of 500 kV DC substations."),
    garis: [P.lampung, P.banten], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "rencana" },
  { id: "kalimantan-jawa", kelompok: "super-grid", nama: lt("Interkoneksi Kalimantan-Jawa (500 kV)", "Kalimantan-Java interconnection (500 kV)"), dari: "Kalimantan", ke: "Jawa", tegangan_kv: 500, teknologi: "SKLTET HVDC (opsi)", status: "kajian", cod: 2040, kapasitas_mw: 5000,
    ket: lt("Dalam kajian green enabling transmission: potensi EBT Kalimantan 14,0 GW (hidro 13,8 GW), diproyeksikan menyalurkan 5 GW ke Jawa mulai 2040. Titik koneksi dan teknologi belum ditetapkan.", "Under the green enabling transmission study: Kalimantan renewable potential of 14.0 GW (hydro 13.8 GW), projected to deliver 5 GW to Java from 2040. Connection point and technology are not yet fixed."),
    garis: [P.kalsel, P.jateng], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "kajian" },
  { id: "sumba-bali-jawa", kelompok: "super-grid", nama: lt("Interkoneksi Sumba-Bali-Jawa (HVDC 500 kV)", "Sumba-Bali-Java interconnection (HVDC 500 kV)"), dari: "Sumba", ke: "Bali-Jawa", tegangan_kv: 500, teknologi: "HVDC (kabel laut + saluran udara)", status: "kajian", cod: null, kapasitas_mw: 2000,
    ket: lt("Mengevakuasi potensi PLTS Sumba sekitar 2 GW; RUPTL memperkirakan biaya lebih dari Rp70 triliun sehingga perlu kajian kelayakan komprehensif.", "Evacuates about 2 GW of Sumba solar potential; RUPTL puts the cost above Rp70 trillion, so a comprehensive feasibility study is still needed."),
    garis: [P.sumba, P.denpasar], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "kajian" },
  { id: "jawa-bali", kelompok: "antar-pulau", nama: lt("Jawa-Bali Connection (Paiton-Antosari 500 kV)", "Java-Bali Connection (Paiton-Antosari 500 kV)"), dari: "Jawa", ke: "Bali", tegangan_kv: 500, teknologi: "Multi Column Tower dan/atau SKLTET 500 kV", status: "rencana", cod: null, kapasitas_mw: null,
    ket: lt("Untuk pertumbuhan beban dan keandalan Bali; pilihan penyelesaian menara multi kolom dan kabel laut 500 kV. Sistem Jawa-Madura-Bali sudah satu sistem; persilangan 500 kV Jawa-Bali juga pernah dibiayai ADB (lihat tab pendanaan).", "For load growth and reliability in Bali; options are multi-column towers and 500 kV submarine cable. The Java-Madura-Bali system is already one grid; a Java-Bali 500 kV crossing was also financed by ADB (see the funding tab)."),
    garis: [P.paiton, P.antosari], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "rencana" },
  { id: "bali-lombok", kelompok: "antar-pulau", nama: lt("Interkoneksi Bali-Lombok (150 kV)", "Bali-Lombok interconnection (150 kV)"), dari: "Bali", ke: "Lombok", tegangan_kv: 150, teknologi: "SKLT 150 kV", status: "kajian", cod: null, kapasitas_mw: null,
    ket: lt("Memperkuat keandalan kedua sistem; titik koneksi indikatif Amlapura-Ampenan atau Gianyar-Sekotong; masih perlu kajian.", "Strengthens reliability of both systems; indicative connection points Amlapura-Ampenan or Gianyar-Sekotong; still needs study."),
    garis: [P.denpasar, P.lombok], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "kajian" },
  { id: "lombok-sumbawa", kelompok: "antar-pulau", nama: lt("Interkoneksi Lombok-Sumbawa (150 kV)", "Lombok-Sumbawa interconnection (150 kV)"), dari: "Lombok", ke: "Sumbawa", tegangan_kv: 150, teknologi: "kabel laut 150 kV", status: "kajian", cod: null, kapasitas_mw: null,
    ket: lt("Dikaji ulang setelah interkoneksi Bali-Lombok beroperasi; Lombok diperkirakan kelebihan pasokan.", "To be revisited once the Bali-Lombok link operates; Lombok is expected to have surplus supply."),
    garis: [P.lombok, P.sumbawa], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "kajian" },
  { id: "sumatera-bengkalis", kelompok: "antar-pulau", nama: lt("Interkoneksi Sumatera-Bengkalis (150 kV)", "Sumatra-Bengkalis interconnection (150 kV)"), dari: "Sumatera", ke: "Bengkalis", tegangan_kv: 150, teknologi: "SUTT dan kabel laut 150 kV", status: "pra-konstruksi", cod: 2026, kapasitas_mw: null,
    ket: lt("Menyalurkan energi murah ke Bengkalis (dedieselisasi); proses pembebasan lahan dan perizinan. Tabel rencana: Pakning-Bengkalis 14 kms (pengadaan, COD 2026).", "Brings cheaper energy to Bengkalis (diesel displacement); land acquisition and permitting under way. Plan table: Pakning-Bengkalis 14 kms (procurement, COD 2026)."),
    garis: [P.pakning, P.bengkalis], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "rencana" },
  { id: "sumatera-karimun", kelompok: "antar-pulau", nama: lt("Interkoneksi Sumatera-Selat Panjang-Tanjung Balai Karimun (150 kV)", "Sumatra-Selat Panjang-Tanjung Balai Karimun interconnection (150 kV)"), dari: "Sumatera", ke: "Karimun", tegangan_kv: 150, teknologi: "SUTT dan kabel laut 150 kV", status: "pra-konstruksi", cod: 2026, kapasitas_mw: null,
    ket: lt("Sumatera-Selat Panjang pada tahap pra-konstruksi; Selat Panjang-Tanjung Balai Karimun masih perencanaan. Tabel rencana memuat ruas COD 2026.", "Sumatra-Selat Panjang is in pre-construction; Selat Panjang-Tanjung Balai Karimun is still in planning. The plan table lists segments with 2026 COD."),
    garis: [P.riau, P.selatpanjang, P.karimun], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "rencana" },
  { id: "sumatera-batam-bintan", kelompok: "antar-pulau", nama: lt("Interkoneksi Sumatera-Batam-Bintan (500 kV AC atau DC)", "Sumatra-Batam-Bintan interconnection (500 kV AC or DC)"), dari: "Sumatera", ke: "Batam-Bintan", tegangan_kv: 500, teknologi: "AC atau DC (terbuka)", status: "kajian", cod: null, kapasitas_mw: 3000,
    ket: lt("Menyalurkan EBT Sumatera (14,5 GW potensi) untuk permintaan Batam dan Bintan hingga sekitar 3 GW, termasuk pusat data; juga dapat menjangkau KEK di Bintan dan sistem lain. Teknologi, tegangan, dan skema bisnis masih dikaji.", "Delivers Sumatran renewables (14.5 GW potential) to Batam and Bintan demand growing to about 3 GW, including data centres; could also reach SEZ load on Bintan and other systems. Technology, voltage and business scheme are still under study."),
    garis: [P.riau, P.batam, P.bintan], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "kajian" },
  { id: "dabo-lingga-selayar", kelompok: "antar-pulau", nama: lt("Interkoneksi Dabo Singkep-Selayar-Lingga", "Dabo Singkep-Selayar-Lingga interconnection"), dari: "Dabo Singkep", ke: "Lingga", tegangan_kv: null, teknologi: "kabel laut", status: "beroperasi", cod: 2023, kapasitas_mw: null,
    ket: lt("RUPTL mencatat proyek interkoneksi ketiga sistem pulau ini sudah beroperasi pada akhir 2023.", "RUPTL records that the interconnection of these three island systems was operating by the end of 2023."),
    garis: [P.dabo, P.lingga], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "beroperasi" },
  { id: "kalimantan-tarakan", kelompok: "antar-pulau", nama: lt("Interkoneksi Kalimantan-Pulau Tarakan (150 kV)", "Kalimantan-Tarakan Island interconnection (150 kV)"), dari: "Kalimantan", ke: "Tarakan", tegangan_kv: 150, teknologi: "kabel laut 150 kV", status: "konstruksi", cod: 2026, kapasitas_mw: null,
    ket: lt("Dedieselisasi dan penurunan BPP sistem isolated Tarakan; dalam konstruksi dengan target selesai 2026.", "Diesel displacement and lower BPP for the isolated Tarakan system; under construction, targeted for 2026."),
    garis: [P.bulungan, P.tarakan], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "konstruksi" },
  { id: "kalimantan-nunukan", kelompok: "antar-pulau", nama: lt("Interkoneksi Kalimantan-Pulau Nunukan (150 kV)", "Kalimantan-Nunukan Island interconnection (150 kV)"), dari: "Kalimantan", ke: "Nunukan", tegangan_kv: 150, teknologi: "kabel laut 150 kV", status: "rencana", cod: null, kapasitas_mw: null,
    ket: lt("Menyatukan sistem isolated Nunukan ke sistem Kalimantan; masih perencanaan.", "Joins the isolated Nunukan system to the Kalimantan grid; still in planning."),
    garis: [P.tarakan, P.nunukan], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "rencana" },
  { id: "sulbagsel-baubau-raha", kelompok: "antar-pulau", nama: lt("Interkoneksi Sulbagsel-Baubau-Raha (150 kV)", "South Sulawesi-Baubau-Raha interconnection (150 kV)"), dari: "Sulawesi", ke: "Baubau-Raha", tegangan_kv: 150, teknologi: "tower penyeberangan (GI Andolo-GI Raha)", status: "kajian", cod: null, kapasitas_mw: null,
    ket: lt("Opsi 2 terpilih (tower penyeberangan di Pulau Groot Tobea dan Groot Muna); masih perlu kajian perairan dan kedalaman untuk floating tower.", "Option 2 selected (crossing towers on Groot Tobea and Groot Muna islands); water conditions and depth still need study for floating towers."),
    garis: [P.kendari, P.raha, P.baubau], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "kajian" },
  { id: "bangka-belitung", kelompok: "antar-pulau", nama: lt("Interkoneksi Bangka-Belitung", "Bangka-Belitung interconnection"), dari: "Bangka", ke: "Belitung", tegangan_kv: null, teknologi: "SKLTM dan SUTM, 130 km antar-landing point", status: "tidak-layak", cod: null, kapasitas_mw: null,
    ket: lt("Kajian kelayakan menilai proyek tidak layak secara finansial; dikembangkan terpisah dalam RUPTL ini.", "The feasibility study finds the project financially unviable; the two systems are developed separately in this RUPTL."),
    garis: null, skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", jenis_catatan: "kajian" },
];

const LINTAS = [
  { id: "kalbar-sarawak", negara: "my", mitra: lt("Sarawak (SESCO / Sarawak Energy)", "Sarawak (SESCO / Sarawak Energy)"), nama: lt("Kalimantan Barat-Sarawak 275 kV", "West Kalimantan-Sarawak 275 kV"), tegangan_kv: 275, teknologi: "SUTET AC 275 kV, GITET Bengkayang-GITET Mambong", status: "beroperasi", tahun: 2016, kapasitas_mw: 230, panjang_km: 127,
    ket: lt("Tersambung 20 Januari 2016. Perjanjian pertukaran listrik 25 tahun: tahap impor 50 MW di luar beban puncak dan 230 MW saat puncak, lalu tahap ekspor-impor dua arah. RUPTL 2025 mencatat skema power-exchange sebagai opsi perpanjangan dan menyebut interkoneksi ini sudah beroperasi.", "Connected on 20 January 2016. A 25-year power exchange agreement: import of 50 MW off-peak and 230 MW at peak, then two-way export-import. RUPTL 2025 lists a power-exchange scheme as the extension option and confirms the link is operating."),
    garis: [P.bengkayang, P.mambong], skematik: true, sumber_id: "esdm-sarawak-2016", sumber_tambahan: ["ruptl-2025"], bukti: "resmi", pihak: ["PLN", "SESCO"] },
  { id: "sumatera-semenanjung", negara: "my", mitra: lt("Semenanjung Malaysia (TNB)", "Peninsular Malaysia (TNB)"), nama: lt("Sumatera-Semenanjung Malaysia (HVDC 500 kV)", "Sumatra-Peninsular Malaysia (HVDC 500 kV)"), tegangan_kv: 500, teknologi: "HVDC 500 kV dari Perawang", status: "studi", tahun: 2034, kapasitas_mw: 300, kapasitas_potensi_gw: [0.6, 2.1], panjang_km: 300,
    ket: lt("Potensi 0,6-2,1 GW menurut AIMS III; PLN dan Tenaga Nasional Berhad menyusun studi rinci difasilitasi ASEAN Centre for Energy. Lampiran RUPTL mencatat ruas Perawang (HVDC)-Peninsular 500 kV 300 kms dengan COD 2034, status rencana. Kapasitas 300 MW pada kolom lampiran adalah angka lampiran, bukan keputusan investasi.", "Potential of 0.6-2.1 GW per AIMS III; PLN and Tenaga Nasional Berhad are preparing a detailed study facilitated by the ASEAN Centre for Energy. The RUPTL annex lists a Perawang (HVDC)-Peninsular 500 kV segment of 300 kms with 2034 COD, status planned. The 300 MW in the annex column is an annex figure, not an investment decision."),
    garis: [P.perawang, P.semenanjung], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", pihak: ["PLN", "TNB"] },
  { id: "sumatera-singapura", negara: "sg", mitra: lt("Singapura (EMA)", "Singapore (EMA)"), nama: lt("Sumatera/Riau/Batam-Singapura (kabel laut ekspor listrik hijau)", "Sumatra/Riau/Batam-Singapore (subsea cable for green power export)"), tegangan_kv: null, teknologi: "kabel laut HVDC (jalur dikaji Pushidrosal)", status: "studi", tahun: 2028, kapasitas_mw: 2000, kapasitas_potensi_gw: [0.6, 1.1], panjang_km: null,
    ket: lt("RUPTL: PLN ditugaskan menjadi integrator interkoneksi ke Singapura (rapat koordinasi 26 April 2024); koridor kabel laut dibahas dengan Pushidrosal dan dapat dipakai PLN maupun swasta; rencana transfer 2 GW dari PLTS pemegang conditional approval EMA. AIMS III menilai potensi 0,6-1,1 GW. Lihat daftar proyek ekspor di bawah.", "RUPTL: PLN has been assigned as integrator of the interconnection to Singapore (coordination meeting of 26 April 2024); the subsea corridor was discussed with Pushidrosal and may be used by PLN or private parties; planned transfer of 2 GW from solar plants held by EMA conditional approval holders. AIMS III sees 0.6-1.1 GW potential. See the export project list below."),
    garis: [P.batam, P.singapura], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", pihak: ["PLN", "EMA"] },
  { id: "kalimantan-sabah", negara: "my", mitra: lt("Sabah (SESB)", "Sabah (SESB)"), nama: lt("Kalimantan-Sabah", "Kalimantan-Sabah"), tegangan_kv: null, teknologi: "belum ditetapkan", status: "studi", tahun: null, kapasitas_mw: null, kapasitas_potensi_gw: [0.1, 0.2], panjang_km: null,
    ket: lt("Potensi 0,1-0,2 GW (AIMS III); inisiatif keketuaan ASEAN Indonesia 2023; PLN dan Sabah Electricity Sdn Bhd menyusun studi rinci difasilitasi ACE.", "Potential of 0.1-0.2 GW (AIMS III); an initiative of Indonesia's 2023 ASEAN chairmanship; PLN and Sabah Electricity Sdn Bhd are preparing a detailed study facilitated by ACE."),
    garis: [P.kaltara, P.sabah], skematik: true, sumber_id: "ruptl-2025", bukti: "resmi", pihak: ["PLN", "SESB"] },
];

const APG = {
  ket: lt("ASEAN Power Grid (APG) menghubungkan jaringan negara ASEAN. Satu-satunya perdagangan listrik multilateral yang tercatat berjalan adalah LTMS-PIP (Laos-Thailand-Malaysia-Singapura), belum melibatkan Indonesia; interkoneksi Indonesia dengan Malaysia dan Singapura dibahas di tab ini.", "The ASEAN Power Grid (APG) links ASEAN national grids. The only multilateral power trade on record is LTMS-PIP (Laos-Thailand-Malaysia-Singapore), which does not yet involve Indonesia; Indonesian links with Malaysia and Singapore are covered in this tab."),
  ltms: { mw_awal: 100, mw_2025: 200, mulai: "2022-06", pernyataan: "2025-10-16", jalur: ["la", "th", "my", "sg"], sumber_id: "fmt-ltms-2025", bukti: "media",
    ket: lt("Dimulai Juni 2022 dengan 100 MW Laos ke Singapura lewat jaringan Thailand dan Malaysia; Pernyataan Bersama ke-6 (Oktober 2025) menggandakan menjadi hingga 200 MW dengan arus Malaysia ke Singapura. Realisasi aliran penuh 200 MW dan status perjanjian transmisi tidak terverifikasi.", "Started June 2022 with 100 MW from Laos to Singapore via the Thai and Malaysian grids; the 6th Joint Statement (October 2025) doubled it to up to 200 MW by adding Malaysia-to-Singapore flows. Actual full 200 MW flows and the transmission agreement status are unverified.") },
  aims3: { sumber_id: "ruptl-2025", bukti: "resmi", ket: lt("ASEAN Interconnection Masterplan Study (AIMS) III, dikutip RUPTL 2025-2034: Sumatera-Semenanjung 0,6-2,1 GW; Sumatera-Singapura 0,6-1,1 GW; Kalimantan-Sabah 0,1-0,2 GW.", "ASEAN Interconnection Masterplan Study (AIMS) III as cited in RUPTL 2025-2034: Sumatra-Peninsular 0.6-2.1 GW; Sumatra-Singapore 0.6-1.1 GW; Kalimantan-Sabah 0.1-0.2 GW.") },
};

/** Proyek impor listrik Singapura dari Indonesia (EMA). org: nama untuk dicocokkan ke organisasi.json saat bangun. */
const EKSPOR = {
  target_sg_gw_2035: 6, target_awal_gw: 4,
  tonggak: [
    { tanggal: "2023-09-08", teks: lt("EMA memberi conditional approval 2 GW impor listrik rendah karbon dari Indonesia kepada lima perusahaan.", "EMA grants conditional approvals for 2 GW of low-carbon electricity imports from Indonesia to five companies."), sumber_id: "businesstoday-2023", bukti: "media" },
    { tanggal: "2024-09-05", teks: lt("Lima pemegang conditional approval naik menjadi conditional licence (2 GW); dua proyek baru (1,4 GW) mendapat conditional approval. Diumumkan di Indonesia International Sustainability Forum, Jakarta; pengumuman EMA tertanggal 5 September 2024 menurut Eco-Business.", "The five approval holders are upgraded to conditional licences (2 GW); two new projects (1.4 GW) receive conditional approval. Announced at the Indonesia International Sustainability Forum, Jakarta; EMA announcement dated 5 September 2024 per Eco-Business."), sumber_id: "ecobusiness-sg-2024", bukti: "media" },
    { tanggal: "2025-05-30", teks: lt("Singa Renewables (TotalEnergies dan RGE) mendapat conditional licence 1 GW, lisensi ke-6; target operasi komersial mulai 2029. Target impor Singapura sekitar 6 GW pada 2035.", "Singa Renewables (TotalEnergies and RGE) receives a 1 GW conditional licence, the sixth; commercial operation targeted from 2029. Singapore's import target is about 6 GW by 2035."), sumber_id: "ema-singa-2025", bukti: "resmi" },
  ],
  proyek: [
    { id: "pacific-medco", pengembang: "Pacific Medco Solar Energy Pte Ltd", org: ["PT Medco Energi Internasional Tbk"], gw: 0.6, izin: "conditional-licence", tanggal: "2024-09-05", sumber_id: "solarquarter-2024", bukti: "media" },
    { id: "adaro-solar", pengembang: "Adaro Solar International Pte Ltd", org: ["Adaro"], gw: 0.4, izin: "conditional-licence", tanggal: "2024-09-05", sumber_id: "solarquarter-2024", bukti: "media" },
    { id: "edpr-apac", pengembang: "EDP Renewables APAC", org: ["EDP Renewables"], gw: 0.4, izin: "conditional-licence", tanggal: "2024-09-05", sumber_id: "solarquarter-2024", bukti: "media" },
    { id: "vanda-re", pengembang: "Vanda RE Pte Ltd", org: [], gw: 0.3, izin: "conditional-licence", tanggal: "2024-09-05", sumber_id: "solarquarter-2024", bukti: "media" },
    { id: "keppel-energy", pengembang: "Keppel Energy Pte Ltd", org: ["Keppel"], gw: 0.3, izin: "conditional-licence", tanggal: "2024-09-05", sumber_id: "solarquarter-2024", bukti: "media" },
    { id: "singa-renewables", pengembang: "Singa Renewables Pte Ltd", org: ["TotalEnergies"], mitra: "TotalEnergies, RGE (Royal Golden Eagle)", gw: 1.0, izin: "conditional-licence", tanggal: "2025-05-30", cod_target: 2029, sumber_id: "ema-singa-2025", bukti: "resmi" },
    { id: "shell-vena", pengembang: "Shell Eastern Trading (Pte.) Ltd", org: ["Shell", "Vena Energy"], mitra: "Vena Energy", gw: 0.4, gw_turunan: true, izin: "conditional-approval", tanggal: "2024-09-05", sumber_id: "solarquarter-2024", bukti: "media" },
  ],
  catatan: lt("Kapasitas per perusahaan dari SolarQuarter (9 Sep 2024); EMA tidak dapat dibaca langsung karena situs dilindungi penantang bot, jadi angka per perusahaan berstatus media. Keadaan setelah Mei 2025 (lisensi importir, konstruksi, kabel) tidak terverifikasi. Lima pemegang conditional licence disebut berekspor mulai 2028 (Eco-Business).", "Per-company capacities are from SolarQuarter (9 Sep 2024); the EMA site could not be read directly because it sits behind a bot challenge, so per-company figures carry media-level evidence. Status after May 2025 (importer licence, construction, cable) is unverified. The five conditional-licence holders are said to export from 2028 (Eco-Business)."),
};

const PENYIMPANAN = {
  ps_ruptl_mw: { total: 4243, tahun: { 2028: 1040, 2031: 760, 2032: 943, 2033: 1500 }, sumber_id: "ruptl-2025", bukti: "resmi", ket: lt("Tabel 5.80 skenario RE Base: pumped storage (PLTA PS) 4.243 MW pada 2028-2033 (2028: 1.040 MW; 2031: 760; 2032: 943; 2033: 1.500; rincian nama proyek ada di riset pumped storage).", "Table 5.80, RE Base scenario: pumped storage (PLTA PS) of 4,243 MW over 2028-2033 (2028: 1,040 MW; 2031: 760; 2032: 943; 2033: 1,500; project names are in the pumped storage research file).") },
  rujukan: { bess_per_sistem: "riset/jaringan.json#baris[].penyimpanan_ruptl_mw", pumped_storage: "riset/pumped_storage_offshore.json#baris[jenis=pumped-storage]" },
};

const PENDANAAN = {
  ids_iati: ["pi_XM_DAC_46004_41074_013_GRNT0354", "pi_XM_DAC_46004_41074_013_LN3015", "pi_XM_DAC_46004_42362_013_LN3083", "pi_XM_DAC_46004_49080_001_LN3339", "pi_XM_DAC_46004_50016_001_LN3560", "pi_XM_DAC_46004_51114_001_LN4009", "pi_XM_DAC_46025_IDN1007", "pi_GB_GOV_1_400400_402"],
  pernyataan_pln: [
    { id: "kebutuhan-supergrid", usd_miliar: 25, teks: lt("Estimasi PLN: jaringan antar-wilayah untuk menyambung sumber EBT membutuhkan sekitar US$25 miliar.", "PLN estimate: an inter-regional grid to connect renewable sources needs about US$25 billion."), sumber_id: "ecobusiness-grid-2024", bukti: "media" },
    { id: "jetp-mobilisasi", usd_miliar: 20, teks: lt("JETP: sekitar US$20 miliar dimobilisasi untuk transisi energi (bukan khusus transmisi).", "JETP: about US$20 billion mobilised for the energy transition (not transmission-specific)."), sumber_id: "ecobusiness-grid-2024", bukti: "media" },
    { id: "adb-etm", usd_miliar: 4, teks: lt("Energy Transition Mechanism ADB: lebih dari US$4 miliar (bukan khusus transmisi).", "ADB Energy Transition Mechanism: over US$4 billion (not transmission-specific)."), sumber_id: "ecobusiness-grid-2024", bukti: "media" },
  ],
  pemberi_org: { "Asian Development Bank": "in_9a375db244", "Islamic Development Bank": "in_41e3e0c573" },
  donor_rujukan: ["in_9a375db244", "in_0d1892cd4f", "in_eb327fef3a", "in_41e3e0c573", "l_c455b2f724"],
  celah: [
    lt("World Bank dan JICA: tidak ada pinjaman transmisi PLN yang terverifikasi di berkas IATI repo maupun di sumber terbuka yang dibaca; tidak diisi, tidak dikarang.", "World Bank and JICA: no verified PLN transmission loan in the repo IATI file or in the open sources read; left empty, not invented."),
    lt("Pernyataan PLN (Juni 2024): investasi transmisi lebih sulit dibiayai daripada pembangkit karena imbal hasilnya lebih rendah, sehingga sebagian besar jatuh ke sektor publik.", "PLN statement (June 2024): transmission is harder to finance than generation because returns are lower, so it falls largely to the public sector."),
  ],
};

const PEMAIN = {
  pln: ["su_ed074ff5", "p_e0f3886341"],
  epc: ["p_1848d9c52b", "p_a363064837"],
  kabel: ["en_8b675ac024", "en_28323x5315", "en_338e1a0bef", "en_8baf2db693", "en_cfd1e6172d", "en_e6bf020c42", "en_bc7a3bb97c", "p_05568287bd"],
  global_dari: "global/pemasok_lain.json#baris[segmen~jaringan]",
  peran_ruptl: lt("Proyek transmisi umumnya dilaksanakan PLN dengan pola EPC; transmisi milik IPP dapat dibangun pengembang IPP; skema kemitraan swasta, KPBU, PMN, dan pembiayaan syariah juga dibuka (RUPTL Bab II.3).", "Transmission projects are generally executed by PLN under EPC; IPP-related transmission may be built by the IPP developer; private partnerships, PPP, state capital injection and sharia financing are also opened (RUPTL Chapter II.3)."),
  unit_pln_ket: lt("Unit PLN pelaksana transmisi (UIP, UIT, UP3B) belum ada sebagai entri organisasi tersendiri; yang tercatat adalah PLN dan PLN Icon Plus.", "PLN executing units for transmission (UIP, UIT, UP3B) are not separate organisation entries; PLN and PLN Icon Plus are on record."),
};

/** Ruas utama RUPTL dengan angka rencana yang bisa dicek di tabel (RE Base). */
const RUAS = [
  { id: "sumatera-500", wilayah: "sumatera", ikon: "petir", nama: lt("Backbone 500 kV Sumatera (sisi timur)", "Sumatra 500 kV backbone (east side)"), kms: 2398, kv: 500, cod: "2025-2033", ket: lt("Muara Enim-New Aur Duri-Peranap-Perawang-Rantau Prapat-Galang; Rantau Prapat-Perawang 560 kms COD 2028 (rencana). Muara Enim-New Aur Duri terlambat dan diadakan ulang.", "Muara Enim-New Aur Duri-Peranap-Perawang-Rantau Prapat-Galang; Rantau Prapat-Perawang 560 kms COD 2028 (planned). Muara Enim-New Aur Duri is delayed and being re-procured."), tabel: "5.191, A3.14" },
  { id: "sumatera-hvdc", wilayah: "sumatera", ikon: "petir", nama: lt("HVDC 500 kV Sumatera (2031-2034)", "Sumatra 500 kV HVDC (2031-2034)"), kms: 1332, kv: 500, cod: "2031-2034", ket: lt("Termasuk Peranap-Landing Point Sungai Guntung 360 kms (2031 dan 2032) dan Perawang-Semenanjung Malaysia 300 kms (2034); level tegangan dapat berubah menurut kajian.", "Includes Peranap-Sungai Guntung Landing Point 360 kms (2031 and 2032) and Perawang-Peninsular Malaysia 300 kms (2034); the voltage level may change after study."), tabel: "5.191, A3.14" },
  { id: "sumatera-275", wilayah: "sumatera", ikon: "petir", nama: lt("SUTET 275 kV Sumatera", "Sumatra 275 kV lines"), kms: 1942, kv: 275, cod: "2025-2033", ket: lt("Termasuk Betung-Palembang Utara (target 2025) dan Sigli-Ulee Kareng yang sudah beroperasi untuk Banda Aceh.", "Includes Betung-Palembang Utara (2025 target) and the operating Sigli-Ulee Kareng for Banda Aceh."), tabel: "5.191" },
  { id: "jawabali-500", wilayah: "jawabali", ikon: "petir", nama: lt("Backbone 500 kV Jawa-Bali", "Java-Bali 500 kV backbone"), kms: 2668, kv: 500, cod: "2025-2033", ket: lt("Penguatan backbone utara-selatan (mis. SUTET Ungaran-Pedan #2), GITET baru di Banten, Jakarta, Jawa Barat, Tengah, dan Timur, serta Jawa-Bali Connection Paiton-Antosari. Gardu 500/150 kV 36.000 MVA.", "North-south backbone reinforcement (e.g. Ungaran-Pedan #2), new extra-high-voltage substations in Banten, Jakarta, West, Central and East Java, and the Paiton-Antosari Java-Bali Connection. 500/150 kV substations of 36,000 MVA."), tabel: "5.195, 5.196" },
  { id: "jawabali-hvdc", wilayah: "jawabali", ikon: "petir", nama: lt("Sisi Jawa interkoneksi HVDC Sumatera-Jawa", "Java end of the Sumatra-Java HVDC link"), kms: 1100, kv: 500, cod: "2031", ket: lt("500 kV DC sepanjang 1.100 kms pada 2031 di Jawa-Bali; mendukung 2,6 GW dari Sumatera pada 2033.", "1,100 kms of 500 kV DC in Java-Bali in 2031; supports 2.6 GW from Sumatra by 2033."), tabel: "5.195" },
  { id: "kalimantan-500", wilayah: "kalimantan", ikon: "petir", nama: lt("SUTET 500 kV Kalimantan (Grid Borneo)", "Kalimantan 500 kV lines (Borneo Grid)"), kms: 1387, kv: 500, cod: "2031", ket: lt("Dari Kalimantan Utara ke Kalimantan Timur untuk mengevakuasi PLTA Kalseltengtimra; jangka panjang seluruh Kalimantan menjadi satu Grid Borneo. Gardu 500 kV 4.000 MVA.", "From North Kalimantan to East Kalimantan to evacuate Kalseltengtimra hydro; long term the whole of Kalimantan becomes one Borneo Grid. 4,000 MVA of 500 kV substations."), tabel: "5.199, 5.200" },
  { id: "sulawesi-275", wilayah: "sulawesi", ikon: "petir", nama: lt("Backbone 275 kV Sulawesi (Green Energy Corridor)", "Sulawesi 275 kV backbone (Green Energy Corridor)"), kms: 4012, kv: 275, cod: "2026-2031", ket: lt("Jalur Tenggara Wotu-Bungku-Andowia-Kendari 968 kms (2026); jalur Selatan Palopo-Bakaru 2-Sidrap-Daya Baru-Bantaeng 956 kms (2028); looping Wotu-Malili-Kolaka-Kendari 952 kms (2029); looping Barat Tentena-Lariang-Seko-Mamuju Baru 1.096 kms (2031).", "Southeast route Wotu-Bungku-Andowia-Kendari 968 kms (2026); south route Palopo-Bakaru 2-Sidrap-Daya Baru-Bantaeng 956 kms (2028); Wotu-Malili-Kolaka-Kendari loop 952 kms (2029); west loop Tentena-Lariang-Seko-Mamuju Baru 1,096 kms (2031)."), tabel: "5.203, 5.205" },
];

function bangun() {
  if (!existsSync(TEKS)) throw new Error(`teks RUPTL tak ada: ${TEKS}`);
  const rencana = bangunRencana(readFileSync(TEKS, "utf8"));
  const salah = periksaRencana(rencana);
  if (salah.length) throw new Error("tabel RUPTL tak konsisten:\n" + salah.join("\n"));
  const org = JSON.parse(readFileSync(join(AKAR, "public/data/organisasi.json"), "utf8")).baris;
  const id = new Map(org.map((o) => [o.nama, o.id]));
  const hilang = [];
  for (const p of EKSPOR.proyek) { p.org_id = p.org.map((n) => id.get(n)).filter(Boolean); for (const n of p.org) if (!id.get(n)) hilang.push(n); delete p.org; }
  const semuaId = new Set(org.map((o) => o.id));
  for (const i of [...PEMAIN.pln, ...PEMAIN.epc, ...PEMAIN.kabel, ...PENDANAAN.donor_rujukan]) if (!semuaId.has(i)) hilang.push(i);
  if (hilang.length) console.warn("org tak ditemukan:", hilang.join(", "));
  const d = {
    lapis: "publik", tema: "jaringan_modul", dibangun_pada: new Date().toISOString().slice(0, 10),
    sumber: Object.values(S),
    meta: {
      tingkat_bukti_kamus: { resmi: "dokumen resmi pemerintah atau regulator", media: "berita atau sumber sekunder", est: "turunan hitung" },
      rujukan_data: ["riset/jaringan.json", "riset/curtailment.json", "riset/pumped_storage_offshore.json", "keandalan.json", "pendanaan_internasional.json", "organisasi.json", "global/pemasok_lain.json", "../geo/transmisi.json", "../geo/gardu.json"],
      celah: [
        "Garis rencana dan lintas negara pada peta bersifat skematik (garis lurus antar titik acuan), BUKAN trase; RUPTL tidak menerbitkan koordinat trase.",
        "Peta jaringan eksisting berasal dari OpenStreetMap (sukarelawan, ODbL) pada enam ubin bbox; tidak lengkap dan bukan data PLN.",
        "Tabel rencana mengikuti skenario RE Base RUPTL 2025-2034; skenario ARED berbeda tipis (47.758 kms nasional).",
        "Proyek impor listrik Singapura: EMA tidak dapat dibaca langsung (penantang bot), angka per perusahaan dari media; status setelah Mei 2025 tidak terverifikasi.",
        "SAIDI dan SAIFI hanya nasional (keandalan.json); pasar_listrik.json belum terbit di repo sehingga tidak ada rincian per wilayah.",
      ],
    },
    rencana: { ...rencana, ruas: RUAS, sumber_id: "ruptl-2025", bukti: "resmi" },
    antar_pulau: ANTAR_PULAU,
    lintas_negara: { negara: LINTAS, apg: APG, ekspor_singapura: EKSPOR },
    penyimpanan: PENYIMPANAN,
    pendanaan: PENDANAAN,
    pemain: PEMAIN,
  };
  const teks = JSON.stringify(d, null, 1) + "\n";
  if (teks.includes("—")) throw new Error("em dash di keluaran");
  return teks;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(KELUAR, bangun());
  console.log("tertulis", KELUAR);
}
export { ANTAR_PULAU, LINTAS, EKSPOR, S as SUMBER, bangun };
