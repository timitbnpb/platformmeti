/* /jaringan: hitungan murni (ES module, tanpa DOM; uji: tests/jaringan_modul.test.mjs).
   Menyambung jaringan_modul.json dengan berkas yang sudah ada lewat id: riset/jaringan.json, pumped_storage_offshore.json, keandalan.json,
   pendanaan_internasional.json, organisasi.json, global/pemasok_lain.json. Tidak ada angka disalin di sini. */

export const jumlah = (a) => a.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);

/** Wilayah RUPTL (tanpa baris nasional) dengan deret tahunan kms atau mva. */
export const wilayahRencana = (m) => (m?.rencana?.sistem || []).filter((s) => s.id !== "indonesia");
export const nasional = (m) => (m?.rencana?.sistem || []).find((s) => s.id === "indonesia") || null;

/** Puncak tahun pembangunan dari deret total. */
export function puncak(deret, tahun) {
  if (!deret?.length) return null;
  let i = 0;
  deret.forEach((v, k) => { if (v > deret[i]) i = k; });
  return { tahun: tahun[i], nilai: deret[i] };
}

/** Kolom tumpuk per tahun: tiap tegangan jadi seri; kembalikan {kategori, kunci}. */
export function tumpukTegangan(sistem, jenis, tahun) {
  const t = sistem[jenis].tegangan, kunci = Object.keys(t).filter((k) => t[k].jumlah > 0);
  return { kunci, kategori: tahun.map((th, i) => ({ tahun: th, nilai: Object.fromEntries(kunci.map((k) => [k, t[k].tahun[i]])) })) };
}

/** Pangsa tiap wilayah terhadap total nasional (persen). */
export function pangsaWilayah(m, jenis) {
  const n = nasional(m)?.[jenis]?.total.jumlah;
  if (!n) return [];
  return wilayahRencana(m).map((s) => ({ id: s.id, nilai: s[jenis].total.jumlah, persen: (s[jenis].total.jumlah / n) * 100 })).sort((a, b) => b.nilai - a.nilai);
}

/** Kumulatif per tahun dari deret. */
export const kumulatif = (deret) => { let a = 0; return deret.map((v) => (a += v)); };

/** Status interkoneksi -> kelompok warna chip. */
export const KELAS_STATUS = { beroperasi: "ok", konstruksi: "info", "pra-konstruksi": "info", rencana: "warn", studi: "warn", kajian: "warn", "kajian-lanjut": "warn", "tidak-layak": "bad" };
export const urutStatus = (s) => ["beroperasi", "konstruksi", "pra-konstruksi", "rencana", "kajian-lanjut", "studi", "kajian", "tidak-layak"].indexOf(s);

/** Ringkasan antar-pulau: hitung per status dan total kapasitas rencana (MW, hanya yang bernilai). */
export function ringkasAntarPulau(m) {
  const a = m?.antar_pulau || [], per = {};
  for (const x of a) per[x.status] = (per[x.status] || 0) + 1;
  return { n: a.length, per, mwRencana: jumlah(a.filter((x) => x.status !== "beroperasi" && x.kelompok === "super-grid").map((x) => x.kapasitas_mw)) };
}

/** Ekspor ke Singapura: total GW per jenis izin dan jumlah proyek. */
export function ringkasEkspor(m) {
  const p = m?.lintas_negara?.ekspor_singapura?.proyek || [], gw = (izin) => jumlah(p.filter((x) => x.izin === izin).map((x) => x.gw));
  return { n: p.length, lisensi: gw("conditional-licence"), persetujuan: gw("conditional-approval"), total: jumlah(p.map((x) => x.gw)), target: m?.lintas_negara?.ekspor_singapura?.target_sg_gw_2035 || null };
}

/** BESS/penyimpanan per sistem dari riset/jaringan.json, urut turun; hanya yang bernilai. */
export function simpanPerSistem(riset) {
  return (riset?.baris || []).filter((b) => b.penyimpanan_ruptl_mw > 0).map((b) => ({ id: b.sistem_id, nama: b.nama, mw: b.penyimpanan_ruptl_mw })).sort((a, b) => b.mw - a.mw);
}

/** Pumped storage dari riset/pumped_storage_offshore.json. */
export const pumpedStorage = (ps) => (ps?.baris || []).filter((b) => b.jenis === "pumped-storage");

/** Sistem keandalan.json yang memenuhi ambang kebutuhan penyimpanan (RM minimum <= ambang dan rasio EBT akhir >= ambang): sama dengan /keandalan. */
export function butuhPenyimpanan(ke) {
  const a = ke?.ambang_penyimpanan;
  if (!a) return [];
  return (ke.sistem || []).map((s) => {
    const rmMin = Math.min(...s.rm_persen), ebt = (s.ebt_dmn_mw.at(-1) / s.beban_puncak_neto_mw.at(-1)) * 100;
    return { id: s.id, nama: s.nama, rmMin, ebt, mw: s.penyimpanan_ruptl_mw || 0, butuh: rmMin <= a.rm_persen_maks && ebt >= a.ebt_rasio_persen_min };
  });
}

/** Baris pendanaan yang dirujuk modul (urut tahun), plus total USD per pemberi. */
export function pendanaanJaringan(pi, ids) {
  const set = new Set(ids), baris = (pi?.baris || []).filter((b) => set.has(b.id)).sort((a, b) => (a.tahun || 0) - (b.tahun || 0));
  const per = new Map();
  for (const b of baris) per.set(b.pemberi, (per.get(b.pemberi) || 0) + (b.nilai_usd || 0));
  return { baris, perPemberi: [...per].map(([pemberi, usd]) => ({ pemberi, usd })).sort((a, b) => b.usd - a.usd), total: jumlah(baris.map((b) => b.nilai_usd)) };
}

/** Pemain: PLN, EPC, kabel dari id kurasi; pemasok global = pemasok_lain dengan segmen jaringan. Mengembalikan kelompok berisi {id, nama, ...}. */
export function pemainJaringan(m, org, lain) {
  const peta = new Map((org?.baris || []).map((o) => [o.id, o]));
  const dari = (ids) => ids.map((i) => peta.get(i)).filter(Boolean).map((o) => ({ id: o.id, nama: o.nama, logo: o.logo }));
  const global = (lain?.baris || []).filter((b) => (b.segmen || []).includes("jaringan")).map((b) => ({ id: b.organisasi_id || b.id, nama: b.nama, logo: b.logo, negara: (b.negara_iso2 || "").toLowerCase() }));
  return { pln: dari(m.pemain.pln), epc: dari(m.pemain.epc), kabel: dari(m.pemain.kabel), global };
}

/** Titik GeoJSON dari ruas skematik (antar-pulau dan lintas negara). */
export function fiturSkematik(m) {
  const f = [];
  for (const x of m?.antar_pulau || []) if (x.garis) f.push({ type: "Feature", properties: { id: x.id, jenis: "antar-pulau", status: x.status, kv: x.tegangan_kv || 0 }, geometry: { type: "LineString", coordinates: x.garis } });
  for (const x of m?.lintas_negara?.negara || []) if (x.garis) f.push({ type: "Feature", properties: { id: x.id, jenis: "lintas", status: x.status, kv: x.tegangan_kv || 0 }, geometry: { type: "LineString", coordinates: x.garis } });
  return { type: "FeatureCollection", features: f };
}

/** Kelas tegangan untuk warna garis OSM. */
export const kelasKv = (kv) => (kv >= 500 ? "500" : kv >= 275 ? "275" : kv >= 150 ? "150" : "lain");
