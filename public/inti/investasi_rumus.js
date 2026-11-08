/* Rumus murni /investasi "Ruang investasi" (ES module, tanpa DOM): dipakai scripts/pipa/investasi.mjs, layar, dan tests/investasi.test.mjs.
   Semua bobot dan ambang di sini HIPOTESIS terbuka (dijelaskan di /metode#investasi), bukan rekomendasi investasi.
   Skor kesiapan = rata-rata berbobot enam komponen 0..1 yang ADA; komponen tanpa data dikeluarkan dan bobot dihitung ulang
   (pola indeks kesiapan yang sama dengan /radar, memakai skor() dari radar_rumus.js). */
import { skor as hitungSkor } from "../radar_rumus.js";
import { TEK, SKALA, bawaan, keParam } from "../model_keuangan_data.js";
import { ASUMSI } from "./kelayakan_rumus.js";
import { hitungModel } from "./model_keuangan_rumus.js";

export const BOBOT = { izin: 0.25, harga: 0.2, lahan: 0.15, sumber: 0.15, pendanaan: 0.15, jaringan: 0.1 };
export const MIN_KOMPONEN = 4;
export const AMBANG = { tinggi: 60, sedang: 40 };
/* ukuran proyek (MW): batas atas eksklusif tiap kelas */
export const KELAS_UKURAN = [["kecil", 20], ["menengah", 100], ["besar", 500], ["sangat-besar", Infinity]];
/* bukti pendanaan -> nilai 0..1 */
export const BUKTI_DANA = { tercatat: 1, jetp: 1, pengembang: 0.6, pemilik: 0.4, ruptl: 0.3, tidak: 0 };
export const BATAS_GARDU_KM = 100; // jaringan: 0 km = 1, 100 km atau lebih = 0
export const RASIO_HARGA = [0.6, 1.4]; // harga patokan / LCOE: 0,6 = 0 dan 1,4 = 1

const jepit = (x) => Math.max(0, Math.min(1, x));
const bulat = (x, d = 3) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);

export const kelasUkuran = (mw) => KELAS_UKURAN.find(([, b]) => mw < b)[0];
export const tingkatKesiapan = (s) => (s == null ? null : s >= AMBANG.tinggi ? "t" : s >= AMBANG.sedang ? "s" : "r");

/** Masukan mentah -> komponen 0..1 (null = tidak ada data, dikeluarkan dari skor).
 *  m: { status ("izin"|"rencana"), izinProv (0..100|null), risiko (0..100|null), jarakKm (km|null), rasioHarga (patokan/LCOE|null), sumber (0..1|null), dana (kunci BUKTI_DANA) } */
export function komponenSkor(m) {
  const st = m.status === "izin" ? 1 : 0.4;
  return {
    izin: bulat(m.izinProv == null ? st : (st + jepit(m.izinProv / 100)) / 2),
    harga: m.rasioHarga == null ? null : bulat(jepit((m.rasioHarga - RASIO_HARGA[0]) / (RASIO_HARGA[1] - RASIO_HARGA[0]))),
    lahan: m.risiko == null ? null : bulat(jepit(1 - m.risiko / 100)),
    sumber: m.sumber == null ? null : bulat(jepit(m.sumber)),
    pendanaan: bulat(BUKTI_DANA[m.dana] ?? 0),
    jaringan: m.jarakKm == null ? null : bulat(jepit(1 - m.jarakKm / BATAS_GARDU_KM)),
  };
}

/** Skor 0..100 (satu desimal) dan bobot efektif; kurang dari MIN_KOMPONEN komponen = null. */
export const skorKesiapan = (komp) => hitungSkor(komp, BOBOT, MIN_KOMPONEN);

/* ---------- model keuangan otomatis ---------- */
/* provinsi (kode BPS) -> indeks baris faktor_lokasi Perpres 112/2022 di peluang.json harga_patokan */
const LOK = { 0: [31, 32, 33, 34, 35, 36, 51], 1: [11, 12, 13, 14, 15, 16, 17, 18], 2: [21], 3: [19], 4: [61, 62, 63, 64, 65], 5: [71, 72, 73, 74, 75, 76], 6: [52, 53], 7: [82], 8: [81], 9: [92, 96], 10: [91, 93, 94, 95] };
export const indeksLokasi = (prov) => +Object.keys(LOK).find((i) => LOK[i].includes(+prov)) || 0;

/** Teknologi proyek -> id model /model-keuangan; null bila tidak punya dasar biaya dan harga bersumber (penyimpanan, nuklir, sampah). */
export function idModel(tek, mw, nama = "") {
  if (tek === "surya") return /terapung|floating/i.test(nama) ? "surya-terapung" : "surya-utilitas";
  if (tek === "hidro") return mw >= 10 ? "plta" : "pltm";
  if (tek === "bayu") return "bayu";
  if (tek === "panas-bumi") return "panas-bumi";
  if (tek === "bioenergi") return "biomassa";
  return null;
}

/** Model keuangan bawaan satu proyek: model bisnis IPP, harga patokan Perpres 112/2022 (tingkat menurut MW dan faktor lokasi), biaya dari biaya_bangun.json.
 *  proyek: { tek, mw, prov_kode, nama }; D: { peluang, atap, bangun, karbon }. Mengembalikan { id, skala, lok, ... } atau { galat: [...] }. */
export function modelProyek(proyek, D) {
  const id = idModel(proyek.tek, proyek.mw, proyek.nama);
  if (!id) return { galat: ["tek"] };
  const tek = TEK.find((x) => x.id === id), skalaId = (SKALA[id] || [])[0] || "";
  const baris = D.bangun?.skala?.find((r) => r.id === skalaId) || null;
  const lok = indeksLokasi(proyek.prov_kode), F = D.peluang.harga_patokan.faktor_lokasi[lok].F;
  const pv = D.atap.provinsi.find((p) => p.kode === String(proyek.prov_kode))?.pvout_kwh_per_kwp_tahun ?? null;
  const k = { tek, skalaRow: baris && { ...baris, mw_contoh: proyek.mw }, peluang: D.peluang, atap: D.atap, bangun: D.bangun, karbon: D.karbon, prov: tek.surya ? pv : null, faktorLokasi: F, grid: "jawa-bali", tarifPln: null, bppSistem: null, acuanPilih: null };
  const v = bawaan(tek, "ipp", k).nilai, diisi = [];
  v.mw = proyek.mw;
  /* sel yang kosong di baris biaya_bangun diisi titik tengah rentang bersumber (rendah-tinggi), lalu asumsi IRENA/ESDM di kelayakan_rumus; ditandai "diisi" */
  const tengah = (o) => o?.tengah ?? (o?.rendah != null && o?.tinggi != null ? (o.rendah + o.tinggi) / 2 : null);
  const A = tek.asumsi && ASUMSI[tek.asumsi], ada = (x) => Number.isFinite(x) && x > 0;
  if (!ada(v.capexUsdKw) && ada(tengah(baris?.capex_usd_kw))) { v.capexUsdKw = tengah(baris.capex_usd_kw); diisi.push("capex"); }
  if (!Number.isFinite(v.opexUsdKwThn)) {
    const pc = tengah(baris?.opex?.persen_capex_per_tahun), uk = tengah(baris?.opex?.usd_kw_tahun);
    v.opexUsdKwThn = uk != null ? uk : pc != null && ada(v.capexUsdKw) ? (v.capexUsdKw * pc) / 100 : A ? A.opex : null;
    if (v.opexUsdKwThn != null) diisi.push("opex");
  }
  if (!ada(v.fk)) { const f = tengah(baris?.cf_persen); v.fk = f ?? (A?.fc ? A.fc * 100 : null); if (v.fk != null) diisi.push("fk"); }
  const r = keParam(v);
  if (r.kurang) return { id, skala: skalaId, lok, galat: r.kurang };
  const m = hitungModel(r.p), s = m.ringkas, kurs = r.p.kurs;
  return {
    id, skala: skalaId, lok, acuan: v.acuan, kurs, umur: r.p.umur, fk: v.fk, capexUsdKw: v.capexUsdKw, opexUsdKwThn: v.opexUsdKwThn, diskonto: v.diskonto,
    tarif: r.p.tarif, tarif11: r.p.tarifTahun2,
    capexRp: s.capex, capexUsd: s.capex / kurs, irr: s.irrProyek, npvRp: s.npvProyek, balik: s.balikProyek, lcoe: s.lcoe, energiGwh: s.energiTahun1 / 1e6,
    rasioHarga: s.lcoe > 0 ? r.p.tarif / s.lcoe : null, diisi,
  };
}

/* ---------- pendana yang cocok ---------- */
export const BOBOT_COCOK = { tek: 0.5, ukuran: 0.3, negara: 0.2 };
export const BAND_TIKET = [0.1, 10]; // tiket tipikal pendana / kebutuhan dana: sebanding bila 0,1x sampai 10x

/** Kecocokan satu proyek dengan satu pendana (lembaga, skema, atau ECA).
 *  proyek: { tek, capexUsd, negara }; pendana: { tek: [teknologi] (kosong = tak membatasi), tiket: USD|null, negara: ISO2|null, jenis }.
 *  Teknologi tak cocok = null (tidak ditampilkan). ECA tanpa kecocokan negara juga null (dukungan ECA mengikuti kebangsaan eksportir).
 *  Hasil { skor 0..1, alasan: ["tek","ukuran","negara"] }. */
export function cocokPendana(proyek, p) {
  const adaTek = p.tek.length > 0;
  if (adaTek && !p.tek.includes(proyek.tek)) return null;
  const negara = p.negara ? (p.negara === proyek.negara ? 1 : 0) : null;
  if (p.jenis === "eca" && negara !== 1) return null;
  const rasio = p.tiket && proyek.capexUsd > 0 ? p.tiket / proyek.capexUsd : null;
  const ukuran = rasio == null ? null : rasio >= BAND_TIKET[0] && rasio <= BAND_TIKET[1] ? 1 : 0;
  const komp = { tek: adaTek ? 1 : 0.5, ukuran, negara };
  let w = 0, s = 0;
  for (const k of Object.keys(BOBOT_COCOK)) if (komp[k] != null) { w += BOBOT_COCOK[k]; s += BOBOT_COCOK[k] * komp[k]; }
  return { skor: bulat(s / w), alasan: Object.keys(komp).filter((k) => komp[k] === 1 && (k !== "tek" || adaTek)) };
}
