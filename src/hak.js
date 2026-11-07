// hak.js: SATU-SATUNYA pintu D1 (KP D7, KPV 2, DT 5). RLS tiruan: matriks sebagai data, klausa cakupan,
// daftar putih tabel/kolom, nilai selalu .bind(), tiap tulis = batch([tulis, jejak]).
// K15: tidak ada jenis data / klausa / kolom `dummy`.

import { Galat } from "./util.js"; // satu kelas galat dengan router (util.js murni, tanpa D1)
export { Galat };
const mk = (kode, status, alasan) => Object.assign(new Galat(kode, status), { alasan }); // alasan = untuk uji/log, bukan klien
const tolak = (pesan) => mk("dilarang", 403, pesan);
const salah = (pesan) => mk("masukan_salah", 422, pesan);

/* Isi jejak (murni): kolom rahasia tak pernah masuk dari/ke; entitas orang hanya nama kolom (DT 3.2). Diekspor ulang oleh jejak.js. */
const RAHASIA_JEJAK = ["garam", "sandi", "iterasi", "aktivasi_hash", "aktivasi_sampai", "id_hash", "pengaju_kontak"];
// Teks bebas panjang (bisa memuat data pribadi) dicatat panjangnya saja, bukan isinya (K20, temuan security-reviewer).
const RINGKAS_JEJAK = { agenda_bukti: ["notulensi"] };
export function susunJejak({ tabel, jenisEntitas, dari, ke }) {
  const hanyaNama = tabel === "entitas" && jenisEntitas === "orang";
  const ringkas = RINGKAS_JEJAK[tabel] ?? [];
  const bentuk = (o) => {
    if (o == null) return null;
    const s = Object.fromEntries(Object.entries(o).filter(([k]) => !RAHASIA_JEJAK.includes(k))
      .map(([k, v]) => (ringkas.includes(k) && typeof v === "string" ? [k + "_panjang", v.length] : [k, v])));
    let teks = JSON.stringify(hanyaNama ? Object.keys(s) : s);
    if (teks.length > 3900) teks = JSON.stringify(Object.keys(s)); // ponytail: batas CHECK 4000; nama kolom cukup untuk audit
    return teks;
  };
  return { dari: bentuk(dari), ke: bentuk(ke) };
}

/* ========================= KONTRAK DIKUNCI INDUK (sistem; tanpa peran) ========================= */
// Semua pernyataan tetap, semua nilai .bind(). Diurai di bagian bawah berkas.
//   cariAkunUntukMasuk(env, surel)                      -> baris akun (+ garam, sandi, iterasi) atau null
//   catatSesi(env, { idHash, akunId, sampai?, ipHash? }) -> sesi + masuk_terakhir + jejak 'masuk' (satu batch)
//   bacaSesi(env, idHash)                               -> akun aktif + sampai, atau null (kedaluwarsa/nonaktif)
//   hapusSesi(env, idHash)                              -> jejak 'keluar' + hapus (satu batch)
//   catatLaju(env, kunci, jendela?, kini?)              -> jumlah hit dalam jendela (UPSERT satu tulis)
//   pakaiTautanAktivasi(env, tokenHash)                 -> klaim atomik sekali pakai; akun atau null
//   ubahSandi(env, akunId, hash, garam, iterasi, kecualiIdHash?) -> set sandi, aktifkan, cabut sesi lain, jejak

/* ============================================= MATRIKS ============================================ */
export const PERAN = ["publik", "anggota", "pengurus", "kurator", "wilayah", "admin", "super"];
//                      PB        AN         PG         KR         WL         AD       SA
export const MATRIKS = {
  entitas:         ["B", "B", "B", "T", "B", "T", "T"],
  fakta:           ["B", "B", "B", "T", "B", "T", "T"],
  ikatan:          ["B", "B", "B", "T", "B", "T", "T"],
  orang:           ["B", "B", "B", "T", "B", "T", "T"],
  kontak:          ["-", "-", "T", "B", "B prov", "T", "T"],
  terlarang:       ["-", "-", "-", "-", "-", "-", "-"],
  potret_publik:   ["B", "B", "B", "B", "B", "B", "B"],
  potret_anggota:  ["-", "B", "B", "B", "B", "B", "B"],
  potret_pengurus: ["-", "-", "B", "B", "-", "B", "B"],
  akun:            ["-", "T diri", "T diri", "T diri", "T diri", "T bukan-super", "T"],
  sesi:            ["-", "T diri", "T diri", "T diri", "T diri", "T cabut", "T"],
  koreksi:         ["-", "T kirim", "T kirim", "T", "T kirim prov", "T", "T"],
  riwayat:         ["-", "-", "T", "-", "-", "T", "T"],
  agenda:          ["-", "B", "B", "T", "B", "T", "T"], // K20: bukti agenda (notulensi + foto); baca semua yang login
  jejak:           ["-", "-", "-", "-", "-", "B", "B"],
  daftar_tolak:    ["-", "-", "-", "-", "-", "-", "B"],
};
export const AKSI = ["baca", "tambah", "ubah", "hapus", "kirim", "cabut", "tinjau", "hapus_keras"];

// Tambahan aksi untuk sel 'T' menurut jenis data (DT 5.2).
const TAMBAHAN_T = { koreksi: ["tinjau", "kirim"], entitas: ["hapus_keras"], orang: ["hapus_keras"], riwayat: ["hapus"], agenda: ["hapus"], sesi: ["cabut"] };
// Kode sel -> { aksi, klausa } (peta kode ke aksi, KPV 1 / DT 5.2). 'T diri' menurut jenis: akun ubah, sesi cabut.
const KODE = {
  "-":            () => ({ aksi: [], klausa: [] }),
  "B":            () => ({ aksi: ["baca"], klausa: ["lapis"] }),
  "B prov":       () => ({ aksi: ["baca"], klausa: ["prov", "lapis"] }),
  "T":            (j) => ({ aksi: ["baca", "tambah", "ubah", ...(TAMBAHAN_T[j] ?? [])], klausa: [] }),
  "T diri":       (j) => ({ aksi: j === "sesi" ? ["baca", "cabut"] : ["baca", "ubah"], klausa: ["sendiri"] }),
  "T bukan-super": (j) => ({ aksi: ["baca", "tambah", "ubah", ...(TAMBAHAN_T[j] ?? [])], klausa: ["bukan-super"] }),
  "T cabut":      () => ({ aksi: ["baca", "cabut"], klausa: [] }),
  "T kirim":      () => ({ aksi: ["kirim", "baca"], klausa: ["sendiri"] }),
  "T kirim prov": () => ({ aksi: ["kirim", "baca"], klausa: ["sendiri", "prov"] }),
};
// Sel kontak 'B prov' tanpa klausa lapis: WL tak punya lapis pengurus, kontak WL justru lewat rute berpenjaga prov (KPV 1 butir 2).
const BUANG_KLAUSA = { kontak: ["lapis"] };

export const selMatriks = (peran, jenis) => MATRIKS[jenis]?.[PERAN.indexOf(peran)];

/* ============================================== KLAUSA ============================================ */
const LAPIS_JENIS = ["entitas", "orang", "fakta", "ikatan", "kontak"];
const LAPIS_SQL_TABEL = ["entitas", "fakta", "ikatan"];
const PEMILIK = { akun: "id", sesi: "akun_id", koreksi: "pengaju_akun" };
const PROV_SQL = {
  entitas: "prov = ?",
  fakta: "entitas_id IN (SELECT id FROM entitas WHERE prov = ?)",
  koreksi: "entitas_id IN (SELECT id FROM entitas WHERE prov = ?)",
};
export function lapisBoleh(akun) {
  const p = peranEfektif(akun);
  if (p === "publik") return ["publik"];
  if (p === "anggota" || p === "wilayah") return ["publik", "anggota"];
  return ["publik", "anggota", "pengurus"];
}
// Dua bentuk setara (R11 2.7): sql -> { s, b } | null (tak berlaku); baris -> boolean. Digabung dengan AND.
export const KLAUSA = {
  lapis: {
    sql: (akun, tabel) => {
      if (!LAPIS_SQL_TABEL.includes(tabel)) return null;
      const l = lapisBoleh(akun);
      return { s: `lapis IN (${l.map(() => "?").join(",")})`, b: l };
    },
    baris: (akun, r, jenis) => !LAPIS_JENIS.includes(jenis) || lapisBoleh(akun).includes(r.lapis),
  },
  prov: {
    // WL tanpa cakupan: NOL baris, bukan semua (R11 2.6).
    sql: (akun, tabel) => (!akun?.cakupan_prov || !PROV_SQL[tabel] ? { s: "0 = 1", b: [] } : { s: PROV_SQL[tabel], b: [akun.cakupan_prov] }),
    baris: (akun, r) => !!akun?.cakupan_prov && r.prov === akun.cakupan_prov,
  },
  sendiri: {
    sql: (akun, tabel) => (!PEMILIK[tabel] || akun?.id == null ? { s: "0 = 1", b: [] } : { s: `${PEMILIK[tabel]} = ?`, b: [akun.id] }),
    baris: (akun, r, jenis) => akun?.id != null && !!PEMILIK[jenis] && r[PEMILIK[jenis]] === akun.id,
  },
  "bukan-super": {
    sql: () => ({ s: "peran <> 'super'", b: [] }),
    baris: (akun, r) => r.peran !== "super",
  },
};

/* =============================================== boleh ============================================ */
// Sesi valid BUKAN izin (R11 2): peran tak dikenal, akun tak aktif, atau peran tak cocok dengan akun = publik.
export function peranEfektif(akun, peran) {
  const p = peran ?? akun?.peran;
  if (!PERAN.includes(p)) return "publik";
  if (akun && akun.status !== undefined && akun.status !== "aktif") return "publik";
  if (akun?.peran && akun.peran !== p) return "publik";
  return p;
}

export function boleh(peran, aksi, jenisData, baris, akun) {
  const p = peranEfektif(akun ?? { peran }, peran);
  const kode = selMatriks(p, jenisData);
  if (kode === undefined) return { ok: false, klausa: [], alasan: `jenis data ${jenisData} tidak dikenal` };
  const sel = KODE[kode](jenisData);
  const tidak = (a) => ({ ok: false, klausa: [], alasan: a ?? `peran ${p} tidak boleh ${aksi} pada ${jenisData}` });
  if (!AKSI.includes(aksi) || !sel.aksi.includes(aksi)) return tidak();
  const buang = BUANG_KLAUSA[jenisData] ?? [];
  const klausa = sel.klausa.filter((k) => !buang.includes(k));
  if (baris) {
    const pelaku = { ...(akun ?? {}), peran: p };
    for (const k of klausa) {
      if (!KLAUSA[k].baris(pelaku, baris, jenisData)) return { ok: false, klausa, alasan: `peran ${p} tidak boleh ${aksi} pada ${jenisData}: klausa ${k} gagal` };
    }
  }
  return { ok: true, klausa };
}

/* ====================================== daftar putih tabel/kolom ================================== */
const KOLOM_RAHASIA = {
  akun: ["garam", "sandi", "iterasi", "aktivasi_hash", "aktivasi_sampai"],
  sesi: ["id_hash"], koreksi: ["pengaju_kontak"],
};
const FAKTA = ["id", "entitas_id", "kunci", "nilai_teks", "nilai_en", "nilai_num", "satuan", "per_tanggal", "est", "rumus",
  "alasan_kosong", "tingkat_bukti", "lapis", "sumber_id", "dibuat", "dibuat_oleh"];
const KOLOM_BACA = {
  entitas: ["id", "kunci", "slug", "jenis", "kategori", "nama", "nama_en", "nama_badan_hukum", "ringkas", "ringkas_en", "sektor",
    "prov", "lat", "lon", "situs", "lapis", "tampil", "status", "digabung_ke", "di_sensus", "anggota_meti", "sumber_id", "dibuat", "diubah", "dibuat_oleh"],
  sumber: ["id", "url", "domain", "jenis", "judul", "lisensi", "tanggal_dokumen", "diperiksa", "kutipan"],
  fakta: FAKTA,
  kontak: FAKTA,
  ikatan: ["id", "dari", "ke", "jenis", "jenis_pasok", "rincian", "rincian_en", "persen", "nilai_num", "satuan", "mulai", "selesai",
    "per_tanggal", "kutipan", "tingkat_bukti", "lapis", "sumber_id", "dibuat", "dibuat_oleh"],
  akun: ["id", "surel", "nama", "peran", "cakupan_prov", "bahasa", "status", "wajib_ganti", "masuk_terakhir", "dibuat", "dibuat_oleh"],
  sesi: ["akun_id", "dibuat", "sampai", "ip_hash"],
  koreksi: ["id", "entitas_id", "jenis", "kunci", "usulan", "sumber_url", "pengaju_akun", "status", "alasan", "ditinjau_oleh", "ditinjau_pada", "dibuat"],
  riwayat: ["id", "target_id", "jenis", "tanggal", "tanggal_selesai", "judul", "kegiatan_ref", "catatan", "penilaian", "oleh", "dibuat", "diubah"],
  jejak: ["id", "kapan", "siapa", "peran", "aksi", "tabel", "baris_id", "dari", "ke", "ip_hash"],
  agenda_bukti: ["id", "kegiatan_ref", "tempat", "notulensi", "oleh", "dibuat", "diubah"],
  agenda_foto: ["id", "bukti_id", "kunci_r2", "tipe", "ukuran", "keterangan", "urutan", "oleh", "dibuat"],
};
// tabel baca -> tabel fisik, jenis data dasar, filter tetap
const TABEL_BACA = {
  entitas: { t: "entitas", jenis: "entitas" }, sumber: { t: "sumber", jenis: "fakta" }, fakta: { t: "fakta", jenis: "fakta" },
  kontak: { t: "fakta", jenis: "kontak", tetap: "kunci LIKE 'kontak\\_%' ESCAPE '\\'" },
  ikatan: { t: "ikatan", jenis: "ikatan" }, akun: { t: "akun", jenis: "akun" }, sesi: { t: "sesi", jenis: "sesi" },
  koreksi: { t: "koreksi", jenis: "koreksi" }, riwayat: { t: "riwayat", jenis: "riwayat" }, jejak: { t: "jejak", jenis: "jejak" },
  agenda_bukti: { t: "agenda_bukti", jenis: "agenda" }, agenda_foto: { t: "agenda_foto", jenis: "agenda" },
};
// Pemetaan tabel -> jenis data menurut baris (satu tabel data, bukan percabangan tersebar). Tabel baru tanpa entri = temuan.
const JENIS_TABEL = {
  entitas: (b) => (b?.jenis === "orang" ? "orang" : "entitas"),
  fakta: (b) => (/^kontak_/.test(b?.kunci ?? "") ? "kontak" : "fakta"),
  kontak: () => "kontak", sumber: () => "fakta", ikatan: () => "ikatan", akun: () => "akun", sesi: () => "sesi",
  koreksi: () => "koreksi", riwayat: () => "riwayat", jejak: () => "jejak",
  agenda_bukti: () => "agenda", agenda_foto: () => "agenda",
};
export function jenisData(tabel, baris) {
  const f = JENIS_TABEL[tabel];
  if (!f) throw mk("dilarang", 403, `tabel ${tabel} tidak terpetakan ke jenis data`);
  return f(baris);
}

const KOLOM_TULIS = {
  entitas: { tambah: ["jenis", "kategori", "nama", "nama_en", "nama_badan_hukum", "ringkas", "ringkas_en", "sektor", "prov", "lat", "lon", "situs", "lapis", "tampil", "di_sensus", "anggota_meti", "sumber"],
    ubah: ["nama", "nama_en", "nama_badan_hukum", "ringkas", "ringkas_en", "sektor", "kategori", "prov", "lat", "lon", "situs", "lapis", "tampil", "status", "di_sensus", "anggota_meti"] },
  fakta: { tambah: ["entitas_id", "kunci", "nilai_teks", "nilai_en", "nilai_num", "satuan", "per_tanggal", "est", "rumus", "alasan_kosong", "tingkat_bukti", "lapis", "sumber"],
    ubah: ["nilai_teks", "nilai_en", "nilai_num", "satuan", "per_tanggal", "est", "rumus", "alasan_kosong", "tingkat_bukti", "lapis"] },
  ikatan: { tambah: ["dari", "ke", "jenis", "jenis_pasok", "rincian", "rincian_en", "persen", "nilai_num", "satuan", "mulai", "selesai", "per_tanggal", "kutipan", "tingkat_bukti", "lapis", "sumber"],
    ubah: ["jenis_pasok", "rincian", "rincian_en", "persen", "nilai_num", "satuan", "mulai", "selesai", "per_tanggal", "kutipan", "tingkat_bukti", "lapis"] },
  akun: { tambah: ["surel", "nama", "peran", "cakupan_prov"], ubah: ["nama", "peran", "cakupan_prov", "status", "bahasa"], diri: ["nama", "bahasa"] },
  koreksi: { tambah: ["entitas_id", "jenis", "kunci", "usulan", "sumber_url", "pengaju_kontak"], tinjau: ["status", "alasan"] },
  riwayat: { tambah: ["target_id", "jenis", "tanggal", "tanggal_selesai", "judul", "kegiatan_ref", "catatan", "penilaian"],
    ubah: ["jenis", "tanggal", "tanggal_selesai", "judul", "kegiatan_ref", "catatan", "penilaian"] },
  agenda_bukti: { tambah: ["kegiatan_ref", "tempat", "notulensi"], ubah: ["tempat", "notulensi"] },
  agenda_foto: { tambah: ["bukti_id", "keterangan", "urutan"], ubah: ["keterangan", "urutan"] },
};
// Kolom yang HANYA boleh diisi server (argumen `server`), tak pernah dari klien. id, dibuat, slug-ubah, dummy tak ada di mana pun.
const KOLOM_SERVER = {
  entitas: { tambah: ["kunci", "slug"], ubah: [] },
  fakta: { tambah: [] }, ikatan: { tambah: [] },
  akun: { tambah: ["aktivasi_hash", "aktivasi_sampai"], ubah: ["aktivasi_hash", "aktivasi_sampai"] },
  agenda_foto: { tambah: ["kunci_r2", "tipe", "ukuran"], ubah: [] }, // hasil periksa unggahan di server, tak pernah dari klien
};
const OTOMATIS_TAMBAH = { entitas: "dibuat_oleh", fakta: "dibuat_oleh", ikatan: "dibuat_oleh", akun: "dibuat_oleh", koreksi: "pengaju_akun", riwayat: "oleh",
  agenda_bukti: "oleh", agenda_foto: "oleh" };
const PAKAI_SUMBER = ["entitas", "fakta", "ikatan"];
// SELECT baris untuk keputusan hak + isi jejak: kolom daftar putih (tanpa rahasia), plus prov entitas induk.
const PROV_INDUK = ", (SELECT prov FROM entitas WHERE id = entitas_id) AS prov";
const BARIS_SQL = Object.fromEntries(["entitas", "fakta", "ikatan", "akun", "koreksi", "riwayat", "agenda_bukti", "agenda_foto"].map((t) =>
  [t, `SELECT ${KOLOM_BACA[t].join(", ")}${t === "fakta" || t === "koreksi" ? PROV_INDUK : ""} FROM ${t} WHERE id = ?`]));
const AKSI_JEJAK = { tambah: "tambah", ubah: "ubah", hapus: "hapus", hapus_keras: "hapus-permanen", kirim: "kirim", tinjau: "tinjau", cabut: "cabut" };
const RE_ID = /^\d{1,12}$/;
const kini = () => Math.floor(Date.now() / 1000);
const hariIni = () => new Date().toISOString().slice(0, 10);

/* ================================================ baca ============================================ */
const LIMIT = 50;
export async function baca(env, akun, tabel, kueri = {}) {
  const def = TABEL_BACA[tabel];
  if (!def) throw tolak(`tabel ${tabel} tidak ada di daftar putih baca`);
  const p = peranEfektif(akun);
  const izin = boleh(p, "baca", def.jenis, undefined, akun);
  if (!izin.ok) throw tolak(izin.alasan);
  const staf = ["kurator", "admin", "super"].includes(p);
  const kolomOk = KOLOM_BACA[tabel].concat(tabel === "koreksi" && staf ? ["pengaju_kontak"] : []);
  const pilih = kueri.kolom ?? kolomOk;
  if (!Array.isArray(pilih) || !pilih.length || pilih.some((k) => !kolomOk.includes(k))) throw salah("kolom di luar daftar putih");

  const bagian = [], binds = [];
  if (def.tetap) bagian.push(def.tetap);
  for (const [k, v] of Object.entries(kueri.where ?? {})) {
    if (!kolomOk.includes(k)) throw salah(`kolom ${k} di luar daftar putih`);
    if (Array.isArray(v)) {
      if (!v.length || v.length > 50) throw salah("daftar nilai harus 1..50");
      bagian.push(`${k} IN (${v.map(() => "?").join(",")})`); binds.push(...v);
    } else if (v === null) bagian.push(`${k} IS NULL`);
    else if (["string", "number"].includes(typeof v)) { bagian.push(`${k} = ?`); binds.push(v); }
    else throw salah(`nilai ${k} tidak sah`);
  }
  if (kueri.cari?.teks) {
    const ks = kueri.cari.kolom ?? [];
    if (!ks.length || ks.some((k) => !kolomOk.includes(k))) throw salah("kolom cari di luar daftar putih");
    const teks = String(kueri.cari.teks).slice(0, 100).replace(/[\\%_]/g, "\\$&");
    bagian.push(`(${ks.map((k) => `${k} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    binds.push(...ks.map(() => `%${teks}%`));
  }
  const pelaku = { ...(akun ?? {}), peran: p };
  for (const k of izin.klausa) {
    const c = KLAUSA[k].sql(pelaku, def.t);
    if (c) { bagian.push(c.s); binds.push(...c.b); }
  }
  let urut = tabel === "sesi" ? "akun_id" : "id", arah = "ASC";
  if (kueri.urut) {
    arah = kueri.urut.startsWith("-") ? "DESC" : "ASC";
    urut = kueri.urut.replace(/^-/, "");
    if (!kolomOk.includes(urut)) throw salah("kolom urut di luar daftar putih");
  }
  const hal = Math.min(Math.max(parseInt(kueri.hal ?? 1, 10) || 1, 1), 10000);
  const sql = `SELECT ${pilih.join(", ")} FROM ${def.t}${bagian.length ? ` WHERE ${bagian.map((b) => `(${b})`).join(" AND ")}` : ""} ORDER BY ${urut} ${arah} LIMIT ${LIMIT} OFFSET ${(hal - 1) * LIMIT}`;
  return (await env.DB.prepare(sql).bind(...binds).all()).results;
}

/* =============================================== tulis ============================================ */
function terjemah(e) {
  if (e instanceof Galat) return e;
  const m = String(e?.message ?? e);
  if (/UNIQUE|trigger|ABORT|tidak boleh|terakhir|harus ke|FOREIGN/i.test(m) && !/CHECK|NOT NULL/i.test(m)) return mk("konflik", 409, "konflik data");
  if (/CHECK|NOT NULL|constraint/i.test(m)) return mk("masukan_salah", 422, "masukan tidak sah");
  return e;
}
const nilaiOk = (v) => v === null || ["string", "number", "boolean"].includes(typeof v);
const bind1 = (v) => (typeof v === "boolean" ? (v ? 1 : 0) : v);

// tulis(env, akun, tabel, aksi, data, id, server?) -> { id }
// server = kolom hasil hitung server (kunci, slug, aktivasi_hash, ...) + { ipHash, jejakKe, koreksiId }; tak pernah dari klien.
export async function tulis(env, akun, tabel, aksi, data = {}, id = null, server = {}) {
  if (!AKSI.includes(aksi)) throw tolak(`aksi ${aksi} tidak dikenal`);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw salah("data harus objek");
  const p = peranEfektif(akun);
  const pelaku = { ...(akun ?? {}), peran: p };
  const khusus = tabel === "sesi";
  if (khusus && aksi !== "cabut") throw tolak("sesi hanya bisa dicabut");
  if (!khusus && !KOLOM_TULIS[tabel]) throw tolak(`tabel ${tabel} tidak ada di daftar putih tulis`);
  if (id != null && !RE_ID.test(String(id))) throw salah("id tidak sah");

  // 1. baris yang dibaca dulu (ubah/hapus/tinjau/cabut) + jenis data
  let lama = null;
  if (khusus) lama = { akun_id: Number(id) };
  else if (id != null) {
    lama = await env.DB.prepare(BARIS_SQL[tabel]).bind(Number(id)).first();
    if (!lama) throw mk("tidak_ditemukan", 404, "baris tidak ada");
  } else if (!["tambah", "kirim"].includes(aksi)) throw salah("id wajib");
  let barisHak = lama;
  if (!lama) {
    barisHak = { ...data };
    if (tabel === "koreksi") {
      barisHak.pengaju_akun = akun?.id;
      const e = data.entitas_id != null && RE_ID.test(String(data.entitas_id))
        ? await env.DB.prepare("SELECT prov FROM entitas WHERE id = ?").bind(Number(data.entitas_id)).first() : null;
      barisHak.prov = e?.prov;
    }
  }
  const jenis = jenisData(tabel, barisHak);
  const izin = boleh(p, aksi, jenis, barisHak, pelaku);
  if (!izin.ok) throw tolak(izin.alasan);

  // 2. aturan akun yang SQL tak bisa jaga: Admin tak menaikkan ke super, tak menyentuh super, tak ubah peran sendiri (KPV 4)
  if (tabel === "akun" && p === "admin") {
    if (data.peran === "super") throw tolak("Admin tidak boleh menetapkan peran super");
    if (lama && lama.id === akun.id && data.peran !== undefined && data.peran !== lama.peran) throw tolak("Admin tidak boleh mengubah perannya sendiri");
  }

  // 3. daftar putih kolom
  const sel = selMatriks(p, jenis);
  const kunciSet = aksi === "kirim" ? "tambah" : aksi;
  const diri = tabel === "akun" && aksi === "ubah" && sel === "T diri";
  const boleh_ = khusus || ["hapus", "hapus_keras"].includes(aksi) ? [] : (KOLOM_TULIS[tabel][diri ? "diri" : kunciSet] ?? null);
  if (boleh_ === null) throw tolak(`aksi ${aksi} tidak punya kolom tulis pada ${tabel}`);
  for (const k of Object.keys(data)) {
    if (!boleh_.includes(k)) throw salah(`kolom ${k} tidak boleh ditulis`);
    if (!nilaiOk(data[k]) && !(k === "sumber" && typeof data[k] === "object")) throw salah(`nilai ${k} tidak sah`);
  }
  const srvOk = KOLOM_SERVER[tabel]?.[kunciSet] ?? [];
  const srv = Object.fromEntries(Object.entries(server).filter(([k]) => srvOk.includes(k)));

  // 4. kolom tulis akhir
  const kolom = { ...Object.fromEntries(Object.entries(data).filter(([k]) => k !== "sumber")), ...srv };
  const stmtAwal = []; // sebelum pernyataan utama (upsert sumber)
  const stmtAkhir = []; // sesudah jejak (efek samping)
  let sumberSql = null, sumberBind = null;
  if (aksi === "tambah" || aksi === "kirim") {
    if (OTOMATIS_TAMBAH[tabel]) kolom[OTOMATIS_TAMBAH[tabel]] = akun?.id ?? null;
    if (tabel === "koreksi") kolom.pengaju_akun = akun?.id ?? null;
    if (PAKAI_SUMBER.includes(tabel)) {
      const s = data.sumber;
      if (!s || typeof s !== "object" || typeof s.url !== "string") throw mk("sumber_wajib", 422, "sumber wajib untuk semua peran");
      let host;
      try { host = new URL(s.url).hostname.toLowerCase(); } catch { throw salah("url sumber tidak sah"); }
      stmtAwal.push(env.DB.prepare(
        "INSERT INTO sumber (url, domain, jenis, judul, tanggal_dokumen, diperiksa, kutipan) VALUES (?, ?, ?, ?, ?, ?, ?) " +
        "ON CONFLICT (url) DO UPDATE SET diperiksa = excluded.diperiksa")
        .bind(s.url, host, s.jenis ?? null, s.judul ?? null, s.tanggal_dokumen ?? null, s.diperiksa ?? hariIni(), s.kutipan ?? null));
      sumberSql = "(SELECT id FROM sumber WHERE url = ?)"; sumberBind = s.url;
    }
  }
  if (aksi === "tinjau") { kolom.ditinjau_oleh = akun?.id ?? null; kolom.ditinjau_pada = kini(); }
  if (aksi === "ubah" && (tabel === "entitas" || tabel === "riwayat" || tabel === "agenda_bukti")) kolom.diubah = kini();
  if (tabel === "akun" && aksi === "ubah" && data.status === "nonaktif") stmtAkhir.push(env.DB.prepare("DELETE FROM sesi WHERE akun_id = ?").bind(Number(id)));

  // 5. pernyataan utama
  const nama = Object.keys(kolom);
  const nilai = nama.map((k) => bind1(kolom[k]));
  let utama;
  if (khusus) {
    utama = env.DB.prepare("DELETE FROM sesi WHERE akun_id = ?").bind(Number(id));
  } else if (aksi === "tambah" || aksi === "kirim") {
    const kol = nama.concat(sumberSql ? ["sumber_id"] : []);
    const ph = nama.map(() => "?").concat(sumberSql ? [sumberSql] : []);
    utama = env.DB.prepare(`INSERT INTO ${tabel} (${kol.join(", ")}) VALUES (${ph.join(", ")})`).bind(...nilai, ...(sumberSql ? [sumberBind] : []));
  } else if (aksi === "ubah" || aksi === "tinjau") {
    if (!nama.length) throw salah("tidak ada kolom untuk diubah");
    utama = env.DB.prepare(`UPDATE ${tabel} SET ${nama.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`).bind(...nilai, Number(id));
  } else if (aksi === "hapus" || aksi === "hapus_keras") {
    if (aksi === "hapus_keras") {
      const kid = server.koreksiId;
      const ok = kid != null && await env.DB.prepare("SELECT 1 AS x FROM koreksi WHERE id = ? AND entitas_id = ? AND status = 'diterima' AND jenis IN ('keluar','hapus-data')").bind(Number(kid), Number(id)).first();
      if (!ok) throw tolak("hapus permanen hanya dengan koreksi diterima untuk entitas itu");
    }
    utama = env.DB.prepare(`DELETE FROM ${tabel} WHERE id = ?`).bind(Number(id));
  } else throw tolak(`aksi ${aksi} tidak didukung pada ${tabel}`);

  // 6. jejak dalam batch yang sama
  const hapusan = ["hapus", "hapus_keras"].includes(aksi);
  const { dari, ke } = susunJejak({
    tabel, jenisEntitas: lama?.jenis ?? data.jenis,
    dari: khusus || !lama ? null : hapusan ? lama : Object.fromEntries(Object.keys({ ...data, ...srv }).filter((k) => k in lama).map((k) => [k, lama[k]])),
    ke: server.jejakKe ?? (khusus ? { cabut: "semua-sesi" } : hapusan ? null : { ...data, ...srv }),
  });
  const jejak = env.DB.prepare(
    "INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, dari, ke, ip_hash) VALUES (?, ?, ?, ?, COALESCE(?, CAST(last_insert_rowid() AS TEXT)), ?, ?, ?)")
    .bind(akun?.id ?? null, p, AKSI_JEJAK[aksi], tabel === "sesi" ? "sesi" : tabel, id != null ? String(id) : null, dari, ke,
      server.ipHash && String(server.ipHash).length === 16 ? server.ipHash : null);

  try {
    const urutan = [...stmtAwal, utama, jejak, ...stmtAkhir];
    const hasil = await env.DB.batch(urutan);
    return { id: id != null ? Number(id) : hasil[stmtAwal.length].meta.last_row_id };
  } catch (e) { throw terjemah(e); }
}

/* ========================= Anggota METI (basis di R2; penyuntingan = baris pencatat di anggota_ubah) ========================= */
const PENYUNTING_ANGGOTA = ["pengurus", "kurator", "admin", "super"];
// Baca log berurutan (id naik) untuk digabung ke dasar R2 oleh direktori.js.
export async function anggotaLog(env, akun) {
  if (!akun || !PENYUNTING_ANGGOTA.includes(akun.peran)) throw tolak("anggota_ubah: peran tidak berhak");
  try { return (await env.DB.prepare("SELECT id, anggota_id, aksi, data, dibuat FROM anggota_ubah ORDER BY id LIMIT 5000").all()).results; }
  catch (e) { if (/no such table/i.test(String(e?.message) + String(e?.cause?.message))) return null; throw e; } // migrasi 0009 belum diterapkan
}
// Satu tulis = batch([anggota_ubah, jejak]). `data` sudah divalidasi pemanggil; jejak tanpa catatan bebas.
export async function anggotaCatat(env, akun, { anggotaId, aksi, data = null, catatan = null }) {
  if (!akun || !PENYUNTING_ANGGOTA.includes(akun.peran)) throw tolak("anggota_ubah: peran tidak berhak");
  if (!["tambah", "ubah", "hapus"].includes(aksi)) throw salah("aksi tidak dikenal");
  const j = susunJejak({ tabel: "anggota_ubah", dari: null, ke: data ? { anggota_id: anggotaId, kolom: Object.keys(data) } : { anggota_id: anggotaId } });
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO anggota_ubah (anggota_id, aksi, data, oleh, catatan) VALUES (?, ?, ?, ?, ?)").bind(anggotaId, aksi, data ? JSON.stringify(data) : null, akun.id, catatan),
      env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, dari, ke) VALUES (?, ?, ?, 'anggota_ubah', ?, ?, ?)").bind(akun.id, akun.peran, aksi, anggotaId, j.dari, j.ke),
    ]);
  } catch (e) { throw terjemah(e); }
}

/* ========================= Admin 0010: koreksi_usul, statistik_harian, konten_beranda, daftar jejak ========================= */
// Hasil null = tabel belum ada (migrasi 0010 belum diterapkan); pemanggil membalas 503.
const ADM_HAK = ["admin", "super"];
const gerbangAdm = (akun) => { if (!akun || !ADM_HAK.includes(akun.peran)) throw tolak("admin: peran tidak berhak"); };
const tanpaTabel = async (fn) => {
  try { return await fn(); }
  catch (e) { if (/no such table/i.test(String(e?.message) + String(e?.cause?.message))) return null; throw e; }
};
const HALAMAN_ADM = 50;
const jejakAdm = (env, akun, aksi, tabel, barisId, ringkas) =>
  env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(akun.id, akun.peran, aksi, tabel, String(barisId).slice(0, 80), JSON.stringify({ ringkas: String(ringkas).slice(0, 300) }));

// Publik; nilai sudah divalidasi rute. Batas laju dipanggil rute lewat sistem.catatLaju.
export async function koreksiBaru(env, d) {
  return tanpaTabel(async () => {
    try {
      const r = await env.DB.prepare("INSERT INTO koreksi_usul (entitas, entitas_id, kolom, nilai_usulan, alasan, sumber_url) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(d.entitas, d.entitas_id, d.kolom, d.nilai_usulan, d.alasan, d.sumber_url ?? null).run();
      return { id: r.meta.last_row_id };
    } catch (e) { throw terjemah(e); }
  });
}
export async function koreksiDaftar(env, akun, status, hal = 1) {
  gerbangAdm(akun);
  const h = Math.min(Math.max(Number(hal) || 1, 1), 10000);
  return tanpaTabel(async () => {
    const [b, t] = await env.DB.batch([
      env.DB.prepare("SELECT id, entitas, entitas_id, kolom, nilai_usulan, alasan, sumber_url, status, catatan_admin, dibuat_pada, diputus_pada, diputus_oleh FROM koreksi_usul WHERE status = ? ORDER BY id DESC LIMIT ? OFFSET ?")
        .bind(status, HALAMAN_ADM, (h - 1) * HALAMAN_ADM),
      env.DB.prepare("SELECT COUNT(*) AS n FROM koreksi_usul WHERE status = ?").bind(status),
    ]);
    return { baris: b.results, total: t.results[0].n };
  });
}
// Putus sekali: UPDATE hanya bila masih 'baru'; jejak hanya bila UPDATE mengubah baris (changes()), satu batch.
export async function koreksiPutus(env, akun, id, aksi, catatan) {
  gerbangAdm(akun);
  if (!["setuju", "tolak"].includes(aksi)) throw salah("aksi tidak dikenal");
  if (!/^\d{1,12}$/.test(String(id))) throw salah("id tidak sah");
  return tanpaTabel(async () => {
    const [u] = await env.DB.batch([
      env.DB.prepare("UPDATE koreksi_usul SET status = ?, catatan_admin = ?, diputus_pada = ?, diputus_oleh = ? WHERE id = ? AND status = 'baru'")
        .bind(aksi, catatan ?? null, kini(), akun.id, Number(id)),
      env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT ?, ?, 'tinjau', 'koreksi_usul', ?, ? WHERE changes() > 0")
        .bind(akun.id, akun.peran, String(id), JSON.stringify({ ringkas: "koreksi " + aksi })),
    ]);
    return { ubah: u.meta.changes };
  });
}

export async function statistikHit(env, jenis, kunci) {
  return tanpaTabel(async () => {
    await env.DB.prepare("INSERT INTO statistik_harian (tanggal, jenis, kunci) VALUES (?, ?, ?) ON CONFLICT (tanggal, jenis, kunci) DO UPDATE SET jumlah = jumlah + 1")
      .bind(new Date().toISOString().slice(0, 10), jenis, kunci).run();
    return true;
  });
}
export async function statistikAdmin(env, akun, hari = 30) {
  gerbangAdm(akun);
  const dari = new Date(Date.now() - (Math.min(Math.max(Number(hari) || 30, 1), 90) - 1) * 86400000).toISOString().slice(0, 10);
  const top = (j) => env.DB.prepare("SELECT kunci, SUM(jumlah) AS jumlah FROM statistik_harian WHERE jenis = ? AND tanggal >= ? GROUP BY kunci ORDER BY jumlah DESC, kunci LIMIT 20").bind(j, dari);
  return tanpaTabel(async () => {
    const [h, c, d] = await env.DB.batch([top("halaman"), top("cari"),
      env.DB.prepare("SELECT tanggal, SUM(CASE WHEN jenis = 'halaman' THEN jumlah ELSE 0 END) AS halaman, SUM(CASE WHEN jenis = 'cari' THEN jumlah ELSE 0 END) AS cari FROM statistik_harian WHERE tanggal >= ? GROUP BY tanggal ORDER BY tanggal").bind(dari)]);
    return { halaman: h.results, cari: c.results, harian: d.results };
  });
}

const KUNCI_KONTEN = ["sorotan", "berita_pilihan", "agenda", "program"];
export async function kontenBaca(env) {
  return tanpaTabel(async () => {
    const o = Object.fromEntries(KUNCI_KONTEN.map((k) => [k, null]));
    for (const r of (await env.DB.prepare("SELECT kunci, isi FROM konten_beranda").all()).results) { try { o[r.kunci] = JSON.parse(r.isi); } catch { /* isi rusak = null */ } }
    return o;
  });
}
export async function kontenSimpan(env, akun, kunci, isi) {
  gerbangAdm(akun);
  if (!KUNCI_KONTEN.includes(kunci)) throw salah("kunci tidak dikenal");
  const teks = JSON.stringify(isi);
  if (teks === undefined || teks.length > 20000) throw salah("isi tidak sah");
  return tanpaTabel(async () => {
    try {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO konten_beranda (kunci, isi, diubah_pada, diubah_oleh) VALUES (?, ?, ?, ?) ON CONFLICT (kunci) DO UPDATE SET isi = excluded.isi, diubah_pada = excluded.diubah_pada, diubah_oleh = excluded.diubah_oleh")
          .bind(kunci, teks, kini(), akun.id),
        jejakAdm(env, akun, "ubah", "konten_beranda", kunci, "konten beranda " + kunci),
      ]);
    } catch (e) { throw terjemah(e); }
    return true;
  });
}

// Daftar jejak untuk layar admin: bentuk {id, waktu, akun_id, akun_nama, peran, aksi, entitas, entitas_id, ringkas}. Tanpa ip_hash.
export async function jejakDaftar(env, akun, { tabel, baris, hal = 1 } = {}) {
  gerbangAdm(akun);
  const h = Math.min(Math.max(Number(hal) || 1, 1), 10000);
  const w = [], b = [];
  if (tabel) { w.push("j.tabel = ?"); b.push(tabel); }
  if (baris) { w.push("j.baris_id = ?"); b.push(baris); }
  const where = w.length ? " WHERE " + w.join(" AND ") : "";
  const [r, t] = await env.DB.batch([
    env.DB.prepare("SELECT j.id, j.kapan, j.siapa, a.nama AS akun_nama, j.peran, j.aksi, j.tabel, j.baris_id, j.ke FROM jejak j LEFT JOIN akun a ON a.id = j.siapa" + where + " ORDER BY j.id DESC LIMIT ? OFFSET ?")
      .bind(...b, HALAMAN_ADM, (h - 1) * HALAMAN_ADM),
    env.DB.prepare("SELECT COUNT(*) AS n FROM jejak j" + where).bind(...b),
  ]);
  const ringkas = (ke) => { if (!ke) return ""; try { const o = JSON.parse(ke); return String(o?.ringkas ?? (o?.kolom ? "kolom: " + o.kolom.join(", ") : ke)).slice(0, 300); } catch { return ""; } };
  return { baris: r.results.map((x) => ({ id: x.id, waktu: x.kapan, akun_id: x.siapa, akun_nama: x.akun_nama ?? null, peran: x.peran, aksi: x.aksi, entitas: x.tabel, entitas_id: x.baris_id, tabel: x.tabel, baris_id: x.baris_id, ringkas: ringkas(x.ke) })), total: t.results[0].n };
}

/* ========================================= sistem (tanpa peran) =================================== */
const BATCH = (env, s) => env.DB.batch(s);
const ip16 = (v) => (v && String(v).length === 16 ? String(v) : null);
const LEBAR = { "masuk-ip": 900, "masuk-surel": 900, "masuk-log": 60, aktivasi: 3600, "ganti-sandi": 3600, koreksi: 3600, "keluar-data": 3600,
  cari: 60, "riset-ai": 3600, "ringkasan-ai": 3600, kurasi: 3600, impor: 3600 };

export async function cariAkunUntukMasuk(env, surel) {
  if (typeof surel !== "string") return null;
  return (await env.DB.prepare(
    "SELECT id, surel, nama, peran, cakupan_prov, bahasa, status, garam, sandi, iterasi, wajib_ganti FROM akun WHERE surel = ?")
    .bind(surel.trim()).first()) ?? null;
}

export async function catatSesi(env, { idHash, akunId, sampai, ipHash } = {}) {
  const k = kini();
  await BATCH(env, [
    env.DB.prepare("INSERT INTO sesi (id_hash, akun_id, dibuat, sampai, ip_hash) VALUES (?, ?, ?, ?, ?)").bind(idHash, akunId, k, sampai ?? k + 14 * 86400, ip16(ipHash)),
    env.DB.prepare("UPDATE akun SET masuk_terakhir = ? WHERE id = ?").bind(k, akunId),
    env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ip_hash) SELECT id, peran, 'masuk', 'sesi', CAST(id AS TEXT), ? FROM akun WHERE id = ?").bind(ip16(ipHash), akunId),
  ]);
  return { ok: true };
}

export async function bacaSesi(env, idHash) {
  if (typeof idHash !== "string" || idHash.length !== 64) return null;
  return (await env.DB.prepare(
    "SELECT a.id, a.surel, a.nama, a.peran, a.cakupan_prov, a.bahasa, a.status, a.wajib_ganti, s.sampai " +
    "FROM sesi s JOIN akun a ON a.id = s.akun_id WHERE s.id_hash = ? AND s.sampai > ? AND a.status = 'aktif'")
    .bind(idHash, kini()).first()) ?? null;
}

export async function hapusSesi(env, idHash) {
  const [, hapus] = await BATCH(env, [
    env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id) SELECT a.id, a.peran, 'keluar', 'sesi', CAST(a.id AS TEXT) FROM sesi s JOIN akun a ON a.id = s.akun_id WHERE s.id_hash = ?").bind(idHash),
    env.DB.prepare("DELETE FROM sesi WHERE id_hash = ?").bind(idHash),
  ]);
  return { dihapus: hapus.meta.changes };
}

// kunci: "aksi:nilai" (mis. "masuk-ip:<ipHash>") atau { aksi, kunci }. jendela: lebar detik (bawaan tabel LEBAR per aksi).
export async function catatLaju(env, kunci, jendela, sekarang = kini()) {
  let aksi, nilai;
  if (kunci && typeof kunci === "object") ({ aksi, kunci: nilai } = kunci);
  else { const i = String(kunci).indexOf(":"); aksi = String(kunci).slice(0, i); nilai = String(kunci).slice(i + 1); }
  const lebar = Number.isInteger(jendela) && jendela > 0 ? jendela : LEBAR[aksi];
  if (!lebar || !nilai || !(aksi in LEBAR)) throw salah("kunci laju tidak sah");
  const r = await env.DB.prepare(
    "INSERT INTO laju (kunci, aksi, jendela) VALUES (?, ?, ?) ON CONFLICT (kunci, aksi, jendela) DO UPDATE SET jumlah = jumlah + 1 RETURNING jumlah")
    .bind(String(nilai).slice(0, 100), aksi, Math.floor(sekarang / lebar)).first();
  return r.jumlah;
}

// Dua langkah: periksa (tanpa menghanguskan) lalu pakai (hangus + set sandi, satu batch atomik).
export async function periksaTautanAktivasi(env, tokenHash) {
  if (typeof tokenHash !== "string" || tokenHash.length !== 64) return null;
  return (await env.DB.prepare(
    "SELECT id, surel, nama, peran, status FROM akun WHERE aktivasi_hash = ? AND aktivasi_sampai > ? AND status <> 'nonaktif'")
    .bind(tokenHash, kini()).first()) ?? null;
}
// Dengan (hash, garam, iterasi): hangus + sandi + aktif + cabut sesi + jejak, atomik; dua pemakaian bersamaan, satu menang.
// Tanpa sandi (alias lama): hanya klaim atomik (UPDATE ... RETURNING); pemanggil lalu memanggil ubahSandi.
export async function pakaiTautanAktivasi(env, tokenHash, hash, garam, iterasi) {
  if (typeof tokenHash !== "string" || tokenHash.length !== 64) return null;
  const k = kini();
  if (hash === undefined) {
    return (await env.DB.prepare(
      "UPDATE akun SET aktivasi_hash = NULL, aktivasi_sampai = NULL WHERE aktivasi_hash = ? AND aktivasi_sampai > ? AND status <> 'nonaktif' RETURNING id, surel, nama, peran, status")
      .bind(tokenHash, k).first()) ?? null;
  }
  const [, , , upd] = await BATCH(env, [
    env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id) SELECT id, peran, CASE status WHEN 'menunggu' THEN 'aktivasi' ELSE 'ganti-sandi' END, 'akun', CAST(id AS TEXT) FROM akun WHERE aktivasi_hash = ? AND aktivasi_sampai > ? AND status <> 'nonaktif'").bind(tokenHash, k),
    env.DB.prepare("DELETE FROM sesi WHERE akun_id IN (SELECT id FROM akun WHERE aktivasi_hash = ? AND aktivasi_sampai > ? AND status <> 'nonaktif')").bind(tokenHash, k),
    env.DB.prepare("SELECT 1").bind(),
    env.DB.prepare("UPDATE akun SET sandi = ?, garam = ?, iterasi = ?, wajib_ganti = 0, aktivasi_hash = NULL, aktivasi_sampai = NULL, status = CASE status WHEN 'menunggu' THEN 'aktif' ELSE status END " +
      "WHERE aktivasi_hash = ? AND aktivasi_sampai > ? AND status <> 'nonaktif' RETURNING id, surel, nama, peran, status").bind(hash, garam, iterasi, tokenHash, k),
  ]);
  return upd.results[0] ?? null;
}

export async function ubahSandi(env, akunId, hash, garam, iterasi, kecualiIdHash = null) {
  const [, , r] = await BATCH(env, [
    env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id) SELECT id, peran, CASE status WHEN 'menunggu' THEN 'aktivasi' ELSE 'ganti-sandi' END, 'akun', CAST(id AS TEXT) FROM akun WHERE id = ? AND status <> 'nonaktif'").bind(akunId),
    env.DB.prepare("DELETE FROM sesi WHERE akun_id = ? AND id_hash <> ?").bind(akunId, kecualiIdHash ?? ""),
    env.DB.prepare("UPDATE akun SET sandi = ?, garam = ?, iterasi = ?, wajib_ganti = 0, aktivasi_hash = NULL, aktivasi_sampai = NULL, " +
      "status = CASE status WHEN 'menunggu' THEN 'aktif' ELSE status END WHERE id = ? AND status <> 'nonaktif'").bind(hash, garam, iterasi, akunId),
  ]);
  return { ok: r.meta.changes === 1 };
}

// Jejak untuk peristiwa tanpa tulis data (mis. masuk-gagal), pernyataan tetap.
export async function jejakTulis(env, { siapa = null, peran = "publik", aksi, tabel, barisId = null, ipHash = null } = {}) {
  await env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ip_hash) VALUES (?, ?, ?, ?, ?, ?)").bind(siapa, peran, aksi, tabel, barisId, ip16(ipHash)).run();
}

export async function sapu(env, sekarang = kini()) {
  const [a, b, c] = await BATCH(env, [
    env.DB.prepare("DELETE FROM sesi WHERE sampai < ?").bind(sekarang),
    // jendela berskala per aksi; CASE dibangun dari konstanta LEBAR (bukan masukan). Hapus yang berakhir > 1 hari lalu.
    env.DB.prepare(`DELETE FROM laju WHERE (jendela + 1) * CASE aksi ${Object.entries(LEBAR).map(([a, w]) => `WHEN '${a}' THEN ${w}`).join(" ")} ELSE 3600 END < ?`).bind(sekarang - 86400),
    env.DB.prepare("UPDATE akun SET aktivasi_hash = NULL, aktivasi_sampai = NULL WHERE aktivasi_sampai < ?").bind(sekarang),
  ]);
  return { sesi: a.meta.changes, laju: b.meta.changes, tautan: c.meta.changes };
}
// Rehash diam-diam ke iterasi lebih tinggi saat masuk: sandi sama, TANPA mencabut sesi atau menyentuh status (dipakai sesi.js).
export async function rehashSandi(env, akunId, hash, garam, iterasi) {
  await env.DB.prepare("UPDATE akun SET sandi = ?, garam = ?, iterasi = ? WHERE id = ? AND status = 'aktif'").bind(hash, garam, iterasi, akunId).run();
}
export const ping = async (env) => (await env.DB.prepare("SELECT 1 AS ok").first()).ok === 1;

export const sistem = { cariAkunUntukMasuk, catatSesi, bacaSesi, hapusSesi, catatLaju, periksaTautanAktivasi, pakaiTautanAktivasi, ubahSandi, rehashSandi, jejakTulis, sapu, ping };
