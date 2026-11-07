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
const RINGKAS_JEJAK = { agenda_bukti: ["notulensi"], event_daftar: ["catatan", "telepon"] };
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
  event_atur:      ["-", "B", "B", "B", "B", "T", "T"], // pengaturan pendaftaran acara; ubah hanya admin
  event_daftar:    ["-", "T daftar", "T daftar", "T daftar", "T daftar", "T", "T"], // RSVP: tiap akun hanya miliknya; admin semua
  jejak:           ["-", "-", "-", "-", "-", "B", "B"],
  daftar_tolak:    ["-", "-", "-", "-", "-", "-", "B"],
  pendaftaran:     ["-", "-", "T", "-", "-", "T", "T"], // 8 Nov 2026: persetujuan anggota mandiri (setujui/tolak, bukti iuran) oleh pengurus, admin, super
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
  "T daftar":     () => ({ aksi: ["baca", "tambah", "ubah"], klausa: ["sendiri"] }),
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
const PEMILIK = { akun: "id", sesi: "akun_id", koreksi: "pengaju_akun", event_daftar: "akun_id" };
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
  event_atur: ["id", "event_id", "terbuka", "kuota", "batas", "kontak_nama", "kontak_peran", "kontak_wa", "kontak_surel", "kontak_setuju", "oleh", "dibuat", "diubah"],
  event_daftar: ["id", "event_id", "akun_id", "jumlah", "instansi", "telepon", "catatan", "status", "waktu", "diubah"],
};
// tabel baca -> tabel fisik, jenis data dasar, filter tetap
const TABEL_BACA = {
  entitas: { t: "entitas", jenis: "entitas" }, sumber: { t: "sumber", jenis: "fakta" }, fakta: { t: "fakta", jenis: "fakta" },
  kontak: { t: "fakta", jenis: "kontak", tetap: "kunci LIKE 'kontak\\_%' ESCAPE '\\'" },
  ikatan: { t: "ikatan", jenis: "ikatan" }, akun: { t: "akun", jenis: "akun" }, sesi: { t: "sesi", jenis: "sesi" },
  koreksi: { t: "koreksi", jenis: "koreksi" }, riwayat: { t: "riwayat", jenis: "riwayat" }, jejak: { t: "jejak", jenis: "jejak" },
  agenda_bukti: { t: "agenda_bukti", jenis: "agenda" }, agenda_foto: { t: "agenda_foto", jenis: "agenda" },
  event_atur: { t: "event_atur", jenis: "event_atur" }, event_daftar: { t: "event_daftar", jenis: "event_daftar" },
};
// Pemetaan tabel -> jenis data menurut baris (satu tabel data, bukan percabangan tersebar). Tabel baru tanpa entri = temuan.
const JENIS_TABEL = {
  entitas: (b) => (b?.jenis === "orang" ? "orang" : "entitas"),
  fakta: (b) => (/^kontak_/.test(b?.kunci ?? "") ? "kontak" : "fakta"),
  kontak: () => "kontak", sumber: () => "fakta", ikatan: () => "ikatan", akun: () => "akun", sesi: () => "sesi",
  koreksi: () => "koreksi", riwayat: () => "riwayat", jejak: () => "jejak",
  agenda_bukti: () => "agenda", agenda_foto: () => "agenda", event_atur: () => "event_atur", event_daftar: () => "event_daftar",
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
  event_atur: { tambah: ["event_id", "terbuka", "kuota", "batas", "kontak_nama", "kontak_peran", "kontak_wa", "kontak_surel", "kontak_setuju"],
    ubah: ["terbuka", "kuota", "batas", "kontak_nama", "kontak_peran", "kontak_wa", "kontak_surel", "kontak_setuju"] },
  event_daftar: { tambah: ["event_id", "jumlah", "instansi", "telepon", "catatan"], ubah: ["jumlah", "instansi", "telepon", "catatan", "status"] },
};
// Kolom yang HANYA boleh diisi server (argumen `server`), tak pernah dari klien. id, dibuat, slug-ubah, dummy tak ada di mana pun.
const KOLOM_SERVER = {
  entitas: { tambah: ["kunci", "slug"], ubah: [] },
  fakta: { tambah: [] }, ikatan: { tambah: [] },
  akun: { tambah: ["aktivasi_hash", "aktivasi_sampai"], ubah: ["aktivasi_hash", "aktivasi_sampai"] },
  agenda_foto: { tambah: ["kunci_r2", "tipe", "ukuran"], ubah: [] }, // hasil periksa unggahan di server, tak pernah dari klien
};
const OTOMATIS_TAMBAH = { entitas: "dibuat_oleh", fakta: "dibuat_oleh", ikatan: "dibuat_oleh", akun: "dibuat_oleh", koreksi: "pengaju_akun", riwayat: "oleh",
  agenda_bukti: "oleh", agenda_foto: "oleh", event_atur: "oleh", event_daftar: "akun_id" };
const PAKAI_SUMBER = ["entitas", "fakta", "ikatan"];
// SELECT baris untuk keputusan hak + isi jejak: kolom daftar putih (tanpa rahasia), plus prov entitas induk.
const PROV_INDUK = ", (SELECT prov FROM entitas WHERE id = entitas_id) AS prov";
const BARIS_SQL = Object.fromEntries(["entitas", "fakta", "ikatan", "akun", "koreksi", "riwayat", "agenda_bukti", "agenda_foto", "event_atur", "event_daftar"].map((t) =>
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
    if (tabel === "event_daftar") barisHak.akun_id = akun?.id;
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
  if (aksi === "ubah" && ["entitas", "riwayat", "agenda_bukti", "event_atur", "event_daftar"].includes(tabel)) kolom.diubah = kini();
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

export const BATAS_KATA_BARU = 500, MIN_UNIK_CARI = 3;
// unik = 1 bila koneksi ini baru bagi kunci hari ini (diputuskan pemanggil lewat laju). Kata cari baru dibatasi per hari.
export async function statistikHit(env, jenis, kunci, unik = 0) {
  return tanpaTabel(async () => {
    const tgl = new Date().toISOString().slice(0, 10);
    await env.DB.prepare("INSERT INTO statistik_harian (tanggal, jenis, kunci, unik) SELECT ?1, ?2, ?3, ?4 WHERE ?2 <> 'cari' OR EXISTS (SELECT 1 FROM statistik_harian WHERE tanggal = ?1 AND jenis = 'cari' AND kunci = ?3) OR (SELECT COUNT(*) FROM statistik_harian WHERE tanggal = ?1 AND jenis = 'cari') < ?5 ON CONFLICT (tanggal, jenis, kunci) DO UPDATE SET jumlah = jumlah + 1, unik = unik + ?4")
      .bind(tgl, jenis, kunci, unik ? 1 : 0, BATAS_KATA_BARU).run();
    return true;
  });
}
export async function statistikAdmin(env, akun, hari = 30) {
  gerbangAdm(akun);
  const dari = new Date(Date.now() - (Math.min(Math.max(Number(hari) || 30, 1), 90) - 1) * 86400000).toISOString().slice(0, 10);
  const top = (j) => env.DB.prepare("SELECT kunci, SUM(jumlah) AS jumlah FROM statistik_harian WHERE jenis = ? AND tanggal >= ? GROUP BY kunci HAVING ? = 'halaman' OR SUM(unik) >= ? ORDER BY jumlah DESC, kunci LIMIT 20").bind(j, dari, j, MIN_UNIK_CARI);
  return tanpaTabel(async () => {
    const [h, c, d] = await env.DB.batch([top("halaman"), top("cari"),
      env.DB.prepare("SELECT tanggal, SUM(CASE WHEN jenis = 'halaman' THEN jumlah ELSE 0 END) AS halaman, SUM(CASE WHEN jenis = 'cari' AND unik >= 3 THEN jumlah ELSE 0 END) AS cari FROM statistik_harian WHERE tanggal >= ? GROUP BY tanggal ORDER BY tanggal").bind(dari)]);
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
  const ringkas = (ke) => { if (!ke) return ""; try { const o = JSON.parse(ke); return String(o?.ringkas ?? (Array.isArray(o?.kolom) ? "kolom: " + o.kolom.join(", ") : "(rincian disembunyikan)")).slice(0, 300); } catch { return "(rincian disembunyikan)"; } };
  return { baris: r.results.map((x) => ({ id: x.id, waktu: x.kapan, akun_id: x.siapa, akun_nama: x.akun_nama ?? null, peran: x.peran, aksi: x.aksi, entitas: x.tabel, entitas_id: x.baris_id, tabel: x.tabel, baris_id: x.baris_id, ringkas: ringkas(x.ke) })), total: t.results[0].n };
}

/* ========================= Pustaka 0012: profil unduh + log dokumen_unduh ========================= */
// Semua akun yang masuk boleh mengunduh; log hanya ditulis lewat pustakaCatat (satu batch), dibaca Admin lewat pustakaRekap.
export const TUJUAN_PUSTAKA = ["riset", "kebijakan", "bisnis", "media", "lainnya"];
const gerbangMasuk = (akun) => { if (!akun || peranEfektif(akun) === "publik") throw tolak("pustaka: wajib masuk"); };

// { instansi, telepon, pernah, tujuan } milik akun sendiri; null bila migrasi 0012 belum diterapkan.
export async function pustakaProfil(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const [p, u] = await env.DB.batch([
      env.DB.prepare("SELECT instansi, telepon FROM akun_profil WHERE akun_id = ?").bind(akun.id),
      env.DB.prepare("SELECT tujuan FROM dokumen_unduh WHERE akun_id = ? ORDER BY id DESC LIMIT 1").bind(akun.id),
    ]);
    return { instansi: p.results[0]?.instansi ?? null, telepon: p.results[0]?.telepon ?? null, pernah: u.results.length > 0, tujuan: u.results[0]?.tujuan ?? null };
  });
}
// Agregat saja (tanpa siapa): { dokumen_id: jumlah }, boleh dibaca semua akun masuk.
export async function pustakaJumlah(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => Object.fromEntries((await env.DB.prepare("SELECT dokumen_id, COUNT(*) AS n FROM dokumen_unduh GROUP BY dokumen_id").all()).results.map((r) => [r.dokumen_id, r.n])));
}
// Satu batch: profil (hanya kolom yang masih kosong) + baris log.
export async function pustakaCatat(env, akun, { dokumenId, berkasId, tujuan, via, instansi = null, telepon = null }) {
  gerbangMasuk(akun);
  const s = [];
  if (instansi || telepon) {
    s.push(env.DB.prepare("INSERT INTO akun_profil (akun_id, instansi, telepon) VALUES (?1, ?2, ?3) ON CONFLICT (akun_id) DO UPDATE SET instansi = COALESCE(instansi, ?2), telepon = COALESCE(telepon, ?3), diubah = unixepoch()")
      .bind(akun.id, instansi, telepon));
  }
  s.push(env.DB.prepare("INSERT INTO dokumen_unduh (akun_id, dokumen_id, berkas_id, tujuan, via) VALUES (?, ?, ?, ?, ?)").bind(akun.id, dokumenId, berkasId, tujuan, via));
  return tanpaTabel(async () => {
    try { await env.DB.batch(s); } catch (e) { throw terjemah(e); }
    return true;
  });
}
// Admin: rekap per dokumen + daftar terbaru (nama, surel, instansi, telepon dari akun/profil).
export async function pustakaRekap(env, akun, hal = 1) {
  gerbangAdm(akun);
  const h = Math.min(Math.max(Number(hal) || 1, 1), 10000);
  return tanpaTabel(async () => {
    const [rek, daf, tot] = await env.DB.batch([
      env.DB.prepare("SELECT dokumen_id, COUNT(*) AS n, COUNT(DISTINCT akun_id) AS akun, MAX(waktu) AS terakhir FROM dokumen_unduh GROUP BY dokumen_id ORDER BY n DESC, dokumen_id LIMIT 200"),
      env.DB.prepare("SELECT u.id, u.waktu, u.dokumen_id, u.berkas_id, u.tujuan, u.via, u.akun_id, a.nama, a.surel, p.instansi, p.telepon FROM dokumen_unduh u LEFT JOIN akun a ON a.id = u.akun_id LEFT JOIN akun_profil p ON p.akun_id = u.akun_id ORDER BY u.id DESC LIMIT ? OFFSET ?")
        .bind(HALAMAN_ADM, (h - 1) * HALAMAN_ADM),
      env.DB.prepare("SELECT COUNT(*) AS n FROM dokumen_unduh"),
    ]);
    return { rekap: rek.results, daftar: daf.results, total: tot.results[0].n, hal: h };
  });
}

/* ========================= Langganan newsletter 0014 ========================= */
// Publik (tamu) boleh mendaftar dan berhenti; daftar dan CSV hanya admin. Hasil null = migrasi 0014 belum diterapkan (rute membalas 503).
// Tidak pernah mengembalikan apakah suatu surel sudah terdaftar kepada pemanggil publik.
export const MINAT_LANGGANAN = ["kebijakan", "proyek", "acara", "kajian", "lowongan"];
const jejakLg = (aksi, kunciSql) =>
  `INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke, ip_hash) SELECT ?, ?, '${aksi}', 'langganan', CAST(id AS TEXT), ?, ? FROM langganan WHERE ${kunciSql} = ? AND changes() > 0`;
export async function langgananDaftar(env, akun, d) {
  return tanpaTabel(async () => {
    const peran = akun?.peran ?? "publik", ke = JSON.stringify({ ringkas: "langganan newsletter" });
    try {
      const [u] = await env.DB.batch([
        // surel sudah ada dan aktif: tidak diubah (data milik orang lain tak boleh ditimpa lewat formulir publik). Berhenti: diaktifkan lagi.
        env.DB.prepare("INSERT INTO langganan (surel, nama, instansi, minat, token_berhenti, akun_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6) " +
          "ON CONFLICT (surel) DO UPDATE SET status = 'aktif', nama = excluded.nama, instansi = excluded.instansi, minat = excluded.minat, token_berhenti = excluded.token_berhenti, " +
          "setuju_pada = unixepoch(), diubah = unixepoch(), akun_id = COALESCE(langganan.akun_id, excluded.akun_id) WHERE langganan.status = 'berhenti'")
          .bind(d.surel, d.nama, d.instansi ?? null, JSON.stringify(d.minat), d.token, akun?.id ?? null),
        env.DB.prepare(jejakLg("gabung", "surel")).bind(akun?.id ?? null, peran, ke, ip16(d.ipHash), d.surel),
      ]);
      return { baru: u.meta.changes > 0 };
    } catch (e) { throw terjemah(e); }
  });
}
// Berhenti lewat token (tautan) atau lewat akun masuk (surel akun). Idempoten: sudah berhenti tetap { ada: true }.
export async function langgananBerhenti(env, akun, token, ipHash = null) {
  const lewatAkun = token == null;
  if (lewatAkun ? !akun?.surel : !/^[0-9a-f]{64}$/.test(String(token))) return { ada: false };
  const kolom = lewatAkun ? "surel" : "token_berhenti", nilai = lewatAkun ? String(akun.surel).trim().toLowerCase() : token;
  const peran = akun?.peran ?? "publik", ke = JSON.stringify({ ringkas: "berhenti langganan" });
  return tanpaTabel(async () => {
    try {
      const [u, , s] = await env.DB.batch([
        env.DB.prepare(`UPDATE langganan SET status = 'berhenti', diubah = unixepoch() WHERE ${kolom} = ? AND status = 'aktif'`).bind(nilai),
        env.DB.prepare(jejakLg("cabut", kolom)).bind(akun?.id ?? null, peran, ke, ip16(ipHash), nilai),
        env.DB.prepare(`SELECT 1 AS x FROM langganan WHERE ${kolom} = ?`).bind(nilai),
      ]);
      return { ada: u.meta.changes > 0 || s.results.length > 0 };
    } catch (e) { throw terjemah(e); }
  });
}
// Status langganan akun yang masuk (untuk mengisi formulir dan tombol berhenti). Tanpa token.
export async function langgananSaya(env, akun) {
  if (!akun?.surel) return { terdaftar: false };
  return tanpaTabel(async () => {
    const r = await env.DB.prepare("SELECT status, minat, instansi FROM langganan WHERE surel = ?").bind(String(akun.surel).trim().toLowerCase()).first();
    if (!r) return { terdaftar: false };
    let minat = []; try { minat = JSON.parse(r.minat); } catch { /* minat rusak = kosong */ }
    return { terdaftar: true, aktif: r.status === "aktif", minat, instansi: r.instansi };
  });
}
const BATAS_CSV = 20000;
export async function langgananAdmin(env, akun, { hal = 1, status, csv = false } = {}) {
  gerbangAdm(akun);
  if (status && !["aktif", "berhenti"].includes(status)) throw salah("status tidak sah");
  const h = Math.min(Math.max(Number(hal) || 1, 1), 10000);
  const w = status ? " WHERE status = ?" : "", b = status ? [status] : [];
  const kolom = "id, surel, nama, instansi, minat, status, setuju_pada, dibuat, diubah, akun_id";
  return tanpaTabel(async () => {
    const ambil = csv
      ? env.DB.prepare(`SELECT ${kolom} FROM langganan${w} ORDER BY id LIMIT ?`).bind(...b, BATAS_CSV)
      : env.DB.prepare(`SELECT ${kolom} FROM langganan${w} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...b, HALAMAN_ADM, (h - 1) * HALAMAN_ADM);
    const [r, t, m] = await env.DB.batch([ambil,
      env.DB.prepare("SELECT COALESCE(SUM(status = 'aktif'), 0) AS aktif, COALESCE(SUM(status = 'berhenti'), 0) AS berhenti FROM langganan"),
      env.DB.prepare("SELECT j.value AS minat, COUNT(*) AS n FROM langganan l, json_each(l.minat) j WHERE l.status = 'aktif' GROUP BY j.value")]);
    const perMinat = Object.fromEntries(MINAT_LANGGANAN.map((k) => [k, 0]));
    for (const x of m.results) if (x.minat in perMinat) perMinat[x.minat] = x.n;
    const baris = r.results.map((x) => { let minat = []; try { minat = JSON.parse(x.minat); } catch { /* kosong */ } return { ...x, minat }; });
    if (csv) await env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) VALUES (?, ?, 'kirim', 'langganan', 'csv', ?)")
      .bind(akun.id, akun.peran, JSON.stringify({ ringkas: "unduh csv langganan, " + baris.length + " baris" })).run();
    return { baris, aktif: t.results[0].aktif, berhenti: t.results[0].berhenti, total: t.results[0].aktif + t.results[0].berhenti, per_minat: perMinat };
  });
}

/* ========================= Pesan 0016: chat akun ke admin ========================= */
// Akun hanya menyentuh utas miliknya (WHERE akun_id = ?); admin dan super melihat semua. Hasil null = migrasi 0016 belum diterapkan (rute membalas 503).
// Tiap tulis = batch([tulis, jejak]); jejak hanya memuat panjang isi, bukan isinya (data pribadi, K20).
export const TOPIK_PESAN = ["umum", "koreksi", "keanggotaan", "kerja_sama", "wilayah", "teknis"];
export const STATUS_PESAN = ["baru", "dibalas", "selesai"];
const bacaLampiran = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const SEL_PESAN = "SELECT id, dari, isi, lampiran, waktu FROM pesan WHERE utas_id = ? ORDER BY waktu, rowid LIMIT 500";

export async function pesanDaftarSaya(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const [u, b] = await env.DB.batch([
      env.DB.prepare("SELECT u.id, u.topik, u.status, u.dibuat, u.diubah, u.dibaca_akun, " +
        "(SELECT substr(isi, 1, 120) FROM pesan WHERE utas_id = u.id ORDER BY waktu DESC, rowid DESC LIMIT 1) AS terakhir, " +
        "(SELECT dari FROM pesan WHERE utas_id = u.id ORDER BY waktu DESC, rowid DESC LIMIT 1) AS terakhir_dari " +
        "FROM pesan_utas u WHERE u.akun_id = ? ORDER BY u.diubah DESC LIMIT 50").bind(akun.id),
      env.DB.prepare("SELECT COUNT(*) AS n FROM pesan_utas WHERE akun_id = ? AND dibaca_akun = 0").bind(akun.id),
    ]);
    return { utas: u.results, belum: b.results[0].n };
  });
}

// Buka satu utas dan tandai dibaca oleh pembukanya. Akun: hanya miliknya (bukan miliknya = null = 404, tidak membedakan "ada" dan "milik orang lain").
export async function pesanBuka(env, akun, id, { admin = false } = {}) {
  if (admin) gerbangAdm(akun); else gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const [u, m] = await env.DB.batch([
      admin
        ? env.DB.prepare("SELECT u.id, u.topik, u.status, u.dibuat, u.diubah, u.dibaca_admin, u.akun_id, a.nama, a.surel FROM pesan_utas u LEFT JOIN akun a ON a.id = u.akun_id WHERE u.id = ?").bind(id)
        : env.DB.prepare("SELECT id, topik, status, dibuat, diubah, dibaca_admin FROM pesan_utas WHERE id = ? AND akun_id = ?").bind(id, akun.id),
      env.DB.prepare(SEL_PESAN).bind(id),
    ]);
    const utas = u.results[0];
    if (!utas) return { utas: null, pesan: [] };
    await env.DB.prepare(admin ? "UPDATE pesan_utas SET dibaca_admin = 1 WHERE id = ? AND dibaca_admin = 0" : "UPDATE pesan_utas SET dibaca_akun = 1 WHERE id = ? AND akun_id = ? AND dibaca_akun = 0")
      .bind(...(admin ? [id] : [id, akun.id])).run();
    if (admin) utas.dibaca_admin = 1;
    return { utas, pesan: m.results.map((x) => ({ ...x, lampiran: bacaLampiran(x.lampiran) })) };
  });
}

// Akun mengirim: utas baru (utasId kosong, butuh topik) atau tambahan di utas miliknya. Utas yang bukan miliknya = { ada: false }.
export async function pesanKirim(env, akun, { utasId, uid, topik, isi, lampiran = null, pid }) {
  gerbangMasuk(akun);
  if (!utasId && !TOPIK_PESAN.includes(topik)) throw salah("topik tidak sah");
  if (typeof isi !== "string" || isi.length < 1 || isi.length > 2000) throw salah("isi tidak sah");
  return tanpaTabel(async () => {
    const ket = (utasId ? "pesan akun" : "utas baru") + ", " + isi.length + " karakter";
    const lamp = lampiran ? JSON.stringify(lampiran) : null;
    try {
      if (utasId) {
        const ada = await env.DB.prepare("SELECT 1 AS x FROM pesan_utas WHERE id = ? AND akun_id = ?").bind(utasId, akun.id).first();
        if (!ada) return { ada: false };
        await env.DB.batch([
          env.DB.prepare("UPDATE pesan_utas SET status = 'baru', dibaca_admin = 0, dibaca_akun = 1, diubah = unixepoch() WHERE id = ? AND akun_id = ?").bind(utasId, akun.id),
          env.DB.prepare("INSERT INTO pesan (id, utas_id, dari, akun_id, isi, lampiran) VALUES (?, ?, 'akun', ?, ?, ?)").bind(pid, utasId, akun.id, isi, lamp),
          jejakAdm(env, akun, "tambah", "pesan", pid, ket),
        ]);
        return { ada: true, utas_id: utasId, id: pid };
      }
      await env.DB.batch([
        env.DB.prepare("INSERT INTO pesan_utas (id, akun_id, topik) VALUES (?, ?, ?)").bind(uid, akun.id, topik),
        env.DB.prepare("INSERT INTO pesan (id, utas_id, dari, akun_id, isi, lampiran) VALUES (?, ?, 'akun', ?, ?, ?)").bind(pid, uid, akun.id, isi, lamp),
        jejakAdm(env, akun, "tambah", "pesan_utas", uid, ket),
      ]);
      return { ada: true, utas_id: uid, id: pid };
    } catch (e) { throw terjemah(e); }
  });
}

export async function pesanLampiran(env, akun, utasId, pid, { admin = false } = {}) {
  if (admin) gerbangAdm(akun); else gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const r = await env.DB.prepare("SELECT m.lampiran FROM pesan m JOIN pesan_utas u ON u.id = m.utas_id WHERE m.id = ? AND m.utas_id = ? AND m.lampiran IS NOT NULL" + (admin ? "" : " AND u.akun_id = ?"))
      .bind(...(admin ? [pid, utasId] : [pid, utasId, akun.id])).first();
    return { lampiran: bacaLampiran(r?.lampiran) };
  });
}

export async function pesanBelumAdmin(env, akun) {
  gerbangAdm(akun);
  return tanpaTabel(async () => (await env.DB.prepare("SELECT COUNT(*) AS n FROM pesan_utas WHERE dibaca_admin = 0").first()).n);
}

export async function pesanAdminDaftar(env, akun, { status, topik, hal = 1 } = {}) {
  gerbangAdm(akun);
  if (status && !STATUS_PESAN.includes(status)) throw salah("status tidak sah");
  if (topik && !TOPIK_PESAN.includes(topik)) throw salah("topik tidak sah");
  const h = Math.min(Math.max(Number(hal) || 1, 1), 10000);
  const w = [], b = [];
  if (status) { w.push("u.status = ?"); b.push(status); }
  if (topik) { w.push("u.topik = ?"); b.push(topik); }
  const where = w.length ? " WHERE " + w.join(" AND ") : "";
  return tanpaTabel(async () => {
    const [r, t, n] = await env.DB.batch([
      env.DB.prepare("SELECT u.id, u.topik, u.status, u.dibuat, u.diubah, u.dibaca_admin, u.akun_id, a.nama, a.surel, " +
        "(SELECT substr(isi, 1, 120) FROM pesan WHERE utas_id = u.id ORDER BY waktu DESC, rowid DESC LIMIT 1) AS terakhir, " +
        "(SELECT dari FROM pesan WHERE utas_id = u.id ORDER BY waktu DESC, rowid DESC LIMIT 1) AS terakhir_dari " +
        "FROM pesan_utas u LEFT JOIN akun a ON a.id = u.akun_id" + where + " ORDER BY u.diubah DESC, u.rowid DESC LIMIT ? OFFSET ?").bind(...b, HALAMAN_ADM, (h - 1) * HALAMAN_ADM),
      env.DB.prepare("SELECT COUNT(*) AS n FROM pesan_utas u" + where).bind(...b),
      env.DB.prepare("SELECT COUNT(*) AS n FROM pesan_utas WHERE dibaca_admin = 0"),
    ]);
    return { baris: r.results, total: t.results[0].n, belum: n.results[0].n, hal: h };
  });
}

export async function pesanAdminBalas(env, akun, utasId, { pid, isi, lampiran = null }) {
  gerbangAdm(akun);
  if (typeof isi !== "string" || isi.length < 1 || isi.length > 2000) throw salah("isi tidak sah");
  return tanpaTabel(async () => {
    const ada = await env.DB.prepare("SELECT 1 AS x FROM pesan_utas WHERE id = ?").bind(utasId).first();
    if (!ada) return { ada: false };
    try {
      await env.DB.batch([
        env.DB.prepare("UPDATE pesan_utas SET status = 'dibalas', dibaca_admin = 1, dibaca_akun = 0, diubah = unixepoch() WHERE id = ?").bind(utasId),
        env.DB.prepare("INSERT INTO pesan (id, utas_id, dari, akun_id, isi, lampiran) VALUES (?, ?, 'admin', ?, ?, ?)").bind(pid, utasId, akun.id, isi, lampiran ? JSON.stringify(lampiran) : null),
        jejakAdm(env, akun, "kirim", "pesan", pid, "balasan admin, " + isi.length + " karakter, utas " + utasId),
      ]);
    } catch (e) { throw terjemah(e); }
    return { ada: true, id: pid };
  });
}

// Tandai selesai atau buka lagi. Idempoten; jejak hanya bila status benar-benar berubah.
export async function pesanAdminStatus(env, akun, utasId, status) {
  gerbangAdm(akun);
  if (!["baru", "selesai"].includes(status)) throw salah("status tidak sah");
  return tanpaTabel(async () => {
    const [u, , s] = await env.DB.batch([
      env.DB.prepare("UPDATE pesan_utas SET status = ? WHERE id = ? AND status <> ?").bind(status, utasId, status),
      env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT ?, ?, 'ubah', 'pesan_utas', ?, ? WHERE changes() > 0")
        .bind(akun.id, akun.peran, utasId, JSON.stringify({ ringkas: "status utas menjadi " + status })),
      env.DB.prepare("SELECT 1 AS x FROM pesan_utas WHERE id = ?").bind(utasId),
    ]);
    return { ada: u.meta.changes > 0 || s.results.length > 0 };
  });
}

/* ========================================= event (RSVP) ========================================== */
// Jumlah peserta terdaftar per acara: semua akun masuk boleh melihat angka (bukan baris orang lain).
export async function eventHitung(env, akun) {
  if (peranEfektif(akun) === "publik") throw tolak("event: harus masuk");
  const r = await env.DB.prepare("SELECT event_id, coalesce(sum(jumlah), 0) AS n FROM event_daftar WHERE status = 'terdaftar' GROUP BY event_id").all();
  return Object.fromEntries(r.results.map((x) => [x.event_id, x.n]));
}
// Peserta satu acara beserta nama/surel akun: admin dan super saja. `unduh` mencatat jejak 'tinjau' (ekspor berisi data pribadi).
export async function eventPeserta(env, akun, eventId, { unduh = false } = {}) {
  const p = peranEfektif(akun);
  if (!["admin", "super"].includes(p)) throw tolak("event: peserta hanya untuk admin");
  const r = await env.DB.prepare(
    "SELECT d.id, d.akun_id, a.nama, a.surel, d.jumlah, d.instansi, d.telepon, d.catatan, d.status, d.waktu FROM event_daftar d JOIN akun a ON a.id = d.akun_id WHERE d.event_id = ? ORDER BY d.id").bind(String(eventId)).all();
  if (unduh) await jejakTulis(env, { siapa: akun.id, peran: p, aksi: "tinjau", tabel: "event_daftar", barisId: String(eventId).slice(0, 80) });
  return r.results;
}

/* ========================= METI Wilayah 0015 ========================= */
// Semua akun masuk membaca status/profil (hanya kontak RESMI kantor; tidak ada kolom nomor pribadi). Tulis: akun masuk mengajukan, admin menyunting dan menyetujui tahap.
// Hasil null = migrasi 0015 belum diterapkan (rute membalas 503).
export const STATUS_MW = ["berdiri", "segera", "rencana", "belum"];
export const TAHAP_MW = ["diajukan", "ditinjau", "sk_terbit", "pelantikan", "berdiri"];
const KOLOM_MW = ["status", "ketua", "sekretaris", "bendahara", "sekretariat", "kontak_surel", "kontak_telp", "sk_nomor", "sk_tanggal", "masa_bakti", "tgl_pelantikan", "bidang", "sumber", "status_per"];
const MW_PUBLIK = "kode_prov, status, ketua, sekretaris, bendahara, sekretariat, kontak_surel, kontak_telp, sk_nomor, sk_tanggal, masa_bakti, tgl_pelantikan, bidang, sumber, status_per, diubah";
const BUKA_MW = "('diajukan','ditinjau','sk_terbit','pelantikan')";
const urai = (s, bawaan) => { try { const v = JSON.parse(s); return v ?? bawaan; } catch { return bawaan; } };
const bidangMw = (r) => { const b = urai(r.bidang, []); return { ...r, bidang: Array.isArray(b) ? b : [] }; };
const jejakMw = (aksi, tabel, idSql, kondisi = "changes() > 0") =>
  `INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT ?, ?, '${aksi}', '${tabel}', ${idSql}, ? WHERE ${kondisi}`;
const ringkasJ = (s) => JSON.stringify({ ringkas: String(s).slice(0, 300) });

export async function metiWilayahDaftar(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => (await env.DB.prepare(`SELECT ${MW_PUBLIK} FROM meti_wilayah ORDER BY kode_prov`).all()).results.map(bidangMw));
}
export async function metiWilayahBaca(env, akun, kode) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const [r, a] = await env.DB.batch([
      env.DB.prepare(`SELECT ${MW_PUBLIK} FROM meti_wilayah WHERE kode_prov = ?`).bind(kode),
      env.DB.prepare("SELECT id, status, catatan, waktu, diubah, json_array_length(berkas) AS n_berkas FROM meti_wilayah_ajuan WHERE kode_prov = ? AND akun_id = ? ORDER BY id DESC LIMIT 5").bind(kode, akun.id),
    ]);
    return { wilayah: r.results[0] ? bidangMw(r.results[0]) : null, ajuan_saya: a.results };
  });
}
// Satu ajuan terbuka per akun per provinsi, maks 3 terbuka per akun, tidak untuk provinsi yang sudah berdiri. null = tabel belum ada; false = ditolak aturan.
export async function metiWilayahAjuanBaru(env, akun, { kode, isi }) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    try {
      const [ins] = await env.DB.batch([
        env.DB.prepare(`INSERT INTO meti_wilayah_ajuan (kode_prov, akun_id, isi) SELECT ?1, ?2, ?3
          WHERE NOT EXISTS (SELECT 1 FROM meti_wilayah WHERE kode_prov = ?1 AND status = 'berdiri')
          AND NOT EXISTS (SELECT 1 FROM meti_wilayah_ajuan WHERE kode_prov = ?1 AND akun_id = ?2 AND status IN ${BUKA_MW})
          AND (SELECT COUNT(*) FROM meti_wilayah_ajuan WHERE akun_id = ?2 AND status IN ${BUKA_MW}) < 3`).bind(kode, akun.id, JSON.stringify(isi)),
        env.DB.prepare(jejakMw("tambah", "meti_wilayah_ajuan", "CAST(last_insert_rowid() AS TEXT)")).bind(akun.id, akun.peran, ringkasJ("ajuan METI Wilayah " + kode)),
      ]);
      return ins.meta.changes > 0 ? { id: ins.meta.last_row_id } : false;
    } catch (e) { throw terjemah(e); }
  });
}
export async function metiWilayahBerkasTambah(env, akun, id, meta) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    try {
      const [u] = await env.DB.batch([
        env.DB.prepare(`UPDATE meti_wilayah_ajuan SET berkas = json_insert(berkas, '$[#]', json(?)), diubah = unixepoch()
          WHERE id = ? AND akun_id = ? AND status IN ('diajukan','ditinjau') AND json_array_length(berkas) < 5`).bind(JSON.stringify(meta), id, akun.id),
        env.DB.prepare(jejakMw("tambah", "meti_wilayah_ajuan", "?"))
          .bind(akun.id, akun.peran, String(id), ringkasJ("berkas ajuan " + id)),
      ]);
      return u.meta.changes > 0;
    } catch (e) { throw terjemah(e); }
  });
}
// Pemilik atau admin. Admin dan pemilik melihat isi (memuat kontak pengaju); respons publik tidak pernah lewat sini.
export async function metiWilayahAjuanBaca(env, akun, id) {
  gerbangMasuk(akun);
  const adm = ADM_HAK.includes(akun.peran);
  return tanpaTabel(async () => {
    const r = await env.DB.prepare("SELECT id, kode_prov, akun_id, isi, berkas, status, catatan, waktu, diubah FROM meti_wilayah_ajuan WHERE id = ?" + (adm ? "" : " AND akun_id = ?"))
      .bind(...(adm ? [id] : [id, akun.id])).first();
    return r ? { ...r, isi: urai(r.isi, {}), berkas: urai(r.berkas, []) } : false;
  });
}
export async function metiWilayahAjuanSaya(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => (await env.DB.prepare("SELECT id, kode_prov, status, catatan, waktu, diubah, json_array_length(berkas) AS n_berkas FROM meti_wilayah_ajuan WHERE akun_id = ? ORDER BY id DESC LIMIT 20").bind(akun.id).all()).results);
}
export async function metiWilayahAdmin(env, akun) {
  gerbangAdm(akun);
  return tanpaTabel(async () => {
    const [w, a] = await env.DB.batch([
      env.DB.prepare(`SELECT ${MW_PUBLIK} FROM meti_wilayah ORDER BY kode_prov`),
      env.DB.prepare("SELECT a.id, a.kode_prov, a.status, a.catatan, a.waktu, a.diubah, a.isi, a.berkas, a.akun_id, k.nama AS akun_nama, k.surel AS akun_surel FROM meti_wilayah_ajuan a LEFT JOIN akun k ON k.id = a.akun_id ORDER BY a.id DESC LIMIT 100"),
    ]);
    return { wilayah: w.results.map(bidangMw), ajuan: a.results.map((x) => ({ ...x, isi: urai(x.isi, {}), berkas: urai(x.berkas, []) })) };
  });
}
// Sunting langsung oleh admin: hanya kolom daftar putih; nilai null mengosongkan. Jejak mencatat nama kolom, bukan isi.
export async function metiWilayahUbah(env, akun, kode, data) {
  gerbangAdm(akun);
  const kol = Object.keys(data).filter((k) => KOLOM_MW.includes(k));
  if (!kol.length) throw salah("tidak ada kolom sah");
  if (data.status !== undefined && !STATUS_MW.includes(data.status)) throw salah("status tidak sah");
  const nilai = kol.map((k) => (k === "bidang" ? JSON.stringify(data[k] ?? []) : data[k] ?? null));
  return tanpaTabel(async () => {
    try {
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO meti_wilayah (kode_prov, ${kol.join(", ")}, diubah_oleh) VALUES (?, ${kol.map(() => "?").join(", ")}, ?)
          ON CONFLICT (kode_prov) DO UPDATE SET ${kol.map((k) => `${k} = excluded.${k}`).join(", ")}, diubah = unixepoch(), diubah_oleh = excluded.diubah_oleh`).bind(kode, ...nilai, akun.id),
        env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) VALUES (?, ?, 'ubah', 'meti_wilayah', ?, ?)").bind(akun.id, akun.peran, kode, JSON.stringify({ kolom: kol })),
      ]);
      return true;
    } catch (e) { throw terjemah(e); }
  });
}
const PERINGKAT = "(CASE %s WHEN 'berdiri' THEN 3 WHEN 'segera' THEN 2 WHEN 'rencana' THEN 1 ELSE 0 END)";
const STATUS_TAHAP = { ditinjau: "rencana", sk_terbit: "segera", pelantikan: "segera", berdiri: "berdiri" };
// Admin menyetujui tahap berikutnya (atau menolak). Atomik: semua pernyataan bersyarat pada status ajuan sebelumnya. true = pindah; false = status tak cocok.
export async function metiWilayahTahap(env, akun, id, ke, d = {}) {
  gerbangAdm(akun);
  const ditolak = ke === "ditolak", urut = TAHAP_MW.indexOf(ke);
  if (!ditolak && urut < 1) throw salah("tahap tidak sah");
  const prev = ditolak ? null : TAHAP_MW[urut - 1], tgl = new Date().toISOString().slice(0, 10);
  const syarat = ditolak ? `status IN ${BUKA_MW}` : "status = ?";
  const ringkas = ringkasJ(`ajuan ${id}: ${ke}`);
  const s = [];
  if (!ditolak) {
    const timpa = ke === "berdiri" ? 1 : 0, pilih = (k) => `CASE WHEN ?11 = 1 THEN COALESCE(excluded.${k}, meti_wilayah.${k}) ELSE COALESCE(meti_wilayah.${k}, excluded.${k}) END`;
    s.push(env.DB.prepare(`INSERT INTO meti_wilayah (kode_prov, status, ketua, sekretaris, bendahara, sekretariat, bidang, sk_nomor, sk_tanggal, masa_bakti, tgl_pelantikan, sumber, status_per, diubah, diubah_oleh)
      SELECT a.kode_prov, ?1, json_extract(a.isi, '$.ketua'), json_extract(a.isi, '$.sekretaris'), json_extract(a.isi, '$.bendahara'), json_extract(a.isi, '$.sekretariat'), COALESCE(json_extract(a.isi, '$.bidang'), '[]'),
        ?2, ?3, ?4, ?5, ?6, ?7, unixepoch(), ?8 FROM meti_wilayah_ajuan a WHERE a.id = ?9 AND a.status = ?10
      ON CONFLICT (kode_prov) DO UPDATE SET
        status = CASE WHEN ${PERINGKAT.replace("%s", "excluded.status")} > ${PERINGKAT.replace("%s", "meti_wilayah.status")} THEN excluded.status ELSE meti_wilayah.status END,
        ketua = ${pilih("ketua")}, sekretaris = ${pilih("sekretaris")}, bendahara = ${pilih("bendahara")}, sekretariat = ${pilih("sekretariat")},
        bidang = CASE WHEN (?11 = 1 AND excluded.bidang <> '[]') OR meti_wilayah.bidang = '[]' THEN excluded.bidang ELSE meti_wilayah.bidang END,
        sk_nomor = COALESCE(excluded.sk_nomor, meti_wilayah.sk_nomor), sk_tanggal = COALESCE(excluded.sk_tanggal, meti_wilayah.sk_tanggal),
        masa_bakti = COALESCE(excluded.masa_bakti, meti_wilayah.masa_bakti), tgl_pelantikan = COALESCE(excluded.tgl_pelantikan, meti_wilayah.tgl_pelantikan),
        sumber = excluded.sumber, status_per = excluded.status_per, diubah = unixepoch(), diubah_oleh = excluded.diubah_oleh`)
      .bind(STATUS_TAHAP[ke], d.sk_nomor ?? null, d.sk_tanggal ?? null, d.masa_bakti ?? null, d.tgl_pelantikan ?? null, `Pengajuan ${id} disetujui admin (${ke})`, tgl, akun.id, id, prev, timpa));
    s.push(env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT ?, ?, 'ubah', 'meti_wilayah', a.kode_prov, ? FROM meti_wilayah_ajuan a WHERE a.id = ? AND a.status = ? AND changes() > 0")
      .bind(akun.id, akun.peran, ringkas, id, prev));
  }
  s.push(env.DB.prepare(`UPDATE meti_wilayah_ajuan SET status = ?, catatan = COALESCE(?, catatan), diubah = unixepoch() WHERE id = ? AND ${syarat}`).bind(ke, d.catatan ?? null, id, ...(ditolak ? [] : [prev])));
  s.push(env.DB.prepare(jejakMw("tinjau", "meti_wilayah_ajuan", "?")).bind(akun.id, akun.peran, String(id), ringkas));
  return tanpaTabel(async () => {
    try { const r = await env.DB.batch(s); return r[r.length - 2].meta.changes > 0; } catch (e) { throw terjemah(e); }
  });
}

/* ========================= KTA virtual 0017 ========================= */
// Hasil null = migrasi 0017 belum diterapkan (rute membalas 503). Satu baris per anggota; jejak ikut satu batch dengan tulisnya.
export const JENIS_KTA = ["individu", "utama", "biasa", "luar biasa", "kehormatan"];
const KODE_KTA = { individu: "IND", utama: "UTM", biasa: "BSA", "luar biasa": "LBS", kehormatan: "KHR" };
const KOLOM_KTA = "id, akun_id, anggota_id, nomor_kta, tahun_masuk, jenis, nama_cetak, instansi, berlaku_sampai, status, foto_kunci, bukti_kunci, nonce, dibuat, diubah, " +
  "CASE WHEN status = 'aktif' AND berlaku_sampai IS NOT NULL AND berlaku_sampai < date('now') THEN 'kedaluwarsa' ELSE status END AS status_ef";
const RE_TGL_KTA = /^\d{4}-\d{2}-\d{2}$/;
const tglSah = (s) => RE_TGL_KTA.test(String(s)) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
const jejakKta = (env, akun, aksi, barisId, ringkas, ip) =>
  env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke, ip_hash) VALUES (?, ?, ?, 'kta', ?, ?, ?)")
    .bind(akun.id, akun.peran, aksi, barisId, JSON.stringify({ ringkas: String(ringkas).slice(0, 300) }), ip16(ip));
// Nomor METI-<tahun masuk>-<jenis>-<urut 5 digit>: urut = maksimum tahun itu + 1, dihitung di dalam UPDATE (UNIQUE menjaga balapan).
const SQL_NOMOR = "UPDATE kta SET nomor_kta = 'METI-' || tahun_masuk || '-' || ? || '-' || printf('%05d', (SELECT COALESCE(MAX(CAST(substr(k2.nomor_kta, -5) AS INTEGER)), 0) + 1 FROM kta k2 WHERE substr(k2.nomor_kta, 6, 4) = CAST(kta.tahun_masuk AS TEXT))) " +
  "WHERE id = ? AND nomor_kta IS NULL AND tahun_masuk IS NOT NULL";

// KTA milik akun sendiri (termasuk klaim tertunda); false bila belum ada, null bila migrasi 0017 belum diterapkan (juga untuk ktaBaca dan ktaPublik).
export async function ktaSaya(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => (await env.DB.prepare(`SELECT ${KOLOM_KTA} FROM kta WHERE akun_id = ?`).bind(akun.id).first()) ?? false);
}
// Satu KTA menurut id: admin bebas, akun lain hanya miliknya.
export async function ktaBaca(env, akun, id) {
  gerbangMasuk(akun);
  const adm = ADM_HAK.includes(akun.peran);
  return tanpaTabel(async () => (await env.DB.prepare(`SELECT ${KOLOM_KTA} FROM kta WHERE id = ?${adm ? "" : " AND akun_id = ?"}`).bind(...(adm ? [id] : [id, akun.id])).first()) ?? false);
}
// Log penyuntingan anggota untuk pencarian klaim (nama saja yang keluar ke klien; penyaringan di rute).
export async function ktaAnggotaLog(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => (await env.DB.prepare("SELECT id, anggota_id, aksi, data FROM anggota_ubah ORDER BY id LIMIT 5000").all()).results);
}
// Klaim keanggotaan: baris 'tertunda' milik akun. UNIQUE (akun, anggota) -> 409.
export async function ktaAjukan(env, akun, { anggotaId, nama, instansi = null, jenis, nonce, ipHash = null }) {
  gerbangMasuk(akun);
  if (!JENIS_KTA.includes(jenis)) throw salah("jenis tidak sah");
  return tanpaTabel(async () => {
    try {
      const [u] = await env.DB.batch([
        env.DB.prepare("INSERT INTO kta (akun_id, anggota_id, jenis, nama_cetak, instansi, status, nonce) VALUES (?, ?, ?, ?, ?, 'tertunda', ?)").bind(akun.id, anggotaId, jenis, nama, instansi, nonce),
        env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke, ip_hash) VALUES (?, ?, 'tambah', 'kta', CAST(last_insert_rowid() AS TEXT), ?, ?)")
          .bind(akun.id, akun.peran, JSON.stringify({ ringkas: "klaim keanggotaan " + anggotaId }), ip16(ipHash)),
      ]);
      return { id: u.meta.last_row_id };
    } catch (e) { throw terjemah(e); }
  });
}
// Foto atau bukti milik akun sendiri (kolom dari daftar tetap). null bila tak ada KTA yang boleh diubah.
export async function ktaSetBerkas(env, akun, kolom, kunci) {
  gerbangMasuk(akun);
  if (!["foto_kunci", "bukti_kunci"].includes(kolom)) throw salah("kolom tidak sah");
  return tanpaTabel(async () => {
    const r = await env.DB.prepare(`UPDATE kta SET ${kolom} = ?, diubah = unixepoch() WHERE akun_id = ? AND status <> 'dicabut' RETURNING id`).bind(kunci, akun.id).first();
    if (r) await jejakKta(env, akun, "ubah", String(r.id), kolom === "foto_kunci" ? "foto KTA" : "bukti klaim KTA").run();
    return r?.id ?? null;
  });
}
// Verifikasi publik: hanya kolom yang boleh tampil + nonce (untuk pencocokan token; rute tidak meneruskannya). Klaim tertunda = tak ada.
export async function ktaPublik(env, id) {
  return tanpaTabel(async () => (await env.DB.prepare(
    "SELECT id, nama_cetak, jenis, berlaku_sampai, nonce, CASE WHEN status = 'aktif' AND berlaku_sampai IS NOT NULL AND berlaku_sampai < date('now') THEN 'kedaluwarsa' ELSE status END AS status_ef FROM kta WHERE id = ? AND status <> 'tertunda'")
    .bind(id).first()) ?? false);
}

/* --- admin --- */
const BATAS_KTA = 20000;
// Semua baris KTA + nama/surel akun terkait. csv=true mencatat jejak 'kirim' (ekspor berisi data pribadi).
export async function ktaDaftar(env, akun, { csv = false } = {}) {
  gerbangAdm(akun);
  return tanpaTabel(async () => {
    const r = await env.DB.prepare(`SELECT k.id, k.akun_id, k.anggota_id, k.nomor_kta, k.tahun_masuk, k.jenis, k.nama_cetak, k.instansi, k.berlaku_sampai, k.status, k.foto_kunci IS NOT NULL AS ada_foto, k.bukti_kunci IS NOT NULL AS ada_bukti, k.dibuat, k.diubah,
      CASE WHEN k.status = 'aktif' AND k.berlaku_sampai IS NOT NULL AND k.berlaku_sampai < date('now') THEN 'kedaluwarsa' ELSE k.status END AS status_ef, a.nama AS akun_nama, a.surel AS akun_surel
      FROM kta k LEFT JOIN akun a ON a.id = k.akun_id ORDER BY k.id LIMIT ?`).bind(BATAS_KTA).all();
    if (csv) await jejakKta(env, akun, "kirim", "csv", "unduh csv kta, " + r.results.length + " baris").run();
    return r.results;
  });
}
// Terbitkan (baru, atau terbitkan ulang yang dicabut/tertunda) untuk satu anggota. akunSurel opsional: kaitkan ke akun aktif itu.
export async function ktaTerbit(env, akun, d) {
  gerbangAdm(akun);
  if (!JENIS_KTA.includes(d.jenis)) throw salah("jenis tidak sah");
  if (!tglSah(d.berlaku_sampai)) throw salah("tanggal tidak sah");
  return tanpaTabel(async () => {
    let akunId = null;
    if (d.akunSurel) {
      akunId = (await env.DB.prepare("SELECT id FROM akun WHERE surel = ? AND status = 'aktif'").bind(String(d.akunSurel).trim().toLowerCase()).first())?.id;
      if (!akunId) throw salah("akun tidak ditemukan");
    }
    const tahun = d.tahun_masuk ?? new Date().getUTCFullYear();
    try {
      const [, , , baca] = await env.DB.batch([
        env.DB.prepare("INSERT INTO kta (akun_id, anggota_id, jenis, nama_cetak, instansi, berlaku_sampai, status, tahun_masuk, nonce) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'aktif', ?7, ?8) " +
          "ON CONFLICT (anggota_id) DO UPDATE SET akun_id = COALESCE(excluded.akun_id, kta.akun_id), jenis = excluded.jenis, nama_cetak = excluded.nama_cetak, instansi = excluded.instansi, " +
          "berlaku_sampai = excluded.berlaku_sampai, status = 'aktif', tahun_masuk = COALESCE(kta.tahun_masuk, excluded.tahun_masuk), diubah = unixepoch()")
          .bind(akunId, d.anggotaId, d.jenis, d.nama, d.instansi ?? null, d.berlaku_sampai, tahun, d.nonce),
        env.DB.prepare(SQL_NOMOR.replace("WHERE id = ?", "WHERE anggota_id = ?")).bind(KODE_KTA[d.jenis], d.anggotaId),
        env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke, ip_hash) SELECT ?, ?, 'tambah', 'kta', CAST(id AS TEXT), ?, ? FROM kta WHERE anggota_id = ?")
          .bind(akun.id, akun.peran, JSON.stringify({ ringkas: "terbit " + d.jenis + " sampai " + d.berlaku_sampai }), ip16(d.ipHash), d.anggotaId),
        env.DB.prepare("SELECT id, nomor_kta, akun_id FROM kta WHERE anggota_id = ?").bind(d.anggotaId),
      ]);
      return baca.results[0];
    } catch (e) { throw terjemah(e); }
  });
}
// aksi: setujui (klaim tertunda -> aktif, d: jenis, berlaku_sampai, nama?, instansi?), tolak (hapus klaim tertunda),
// perpanjang (d: berlaku_sampai), cabut. { ok } false bila baris tak ada atau keadaannya tak cocok.
export async function ktaAksi(env, akun, id, aksi, d = {}, ipHash = null) {
  gerbangAdm(akun);
  if (!["setujui", "tolak", "perpanjang", "cabut"].includes(aksi)) throw salah("aksi tidak dikenal");
  if (["setujui", "perpanjang"].includes(aksi) && !tglSah(d.berlaku_sampai)) throw salah("tanggal tidak sah");
  if (aksi === "setujui" && !JENIS_KTA.includes(d.jenis)) throw salah("jenis tidak sah");
  const bid = String(id);
  return tanpaTabel(async () => {
    try {
      if (aksi === "tolak") {
        const [h] = await env.DB.batch([
          env.DB.prepare("DELETE FROM kta WHERE id = ? AND status = 'tertunda' AND nomor_kta IS NULL").bind(id),
          env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke, ip_hash) SELECT ?, ?, 'hapus', 'kta', ?, ?, ? WHERE changes() > 0")
            .bind(akun.id, akun.peran, bid, JSON.stringify({ ringkas: "klaim ditolak" }), ip16(ipHash)),
        ]);
        return { ok: h.meta.changes > 0 };
      }
      const p = {
        setujui: ["UPDATE kta SET status = 'aktif', jenis = ?, berlaku_sampai = ?, nama_cetak = COALESCE(?, nama_cetak), instansi = COALESCE(?, instansi), tahun_masuk = COALESCE(tahun_masuk, ?), diubah = unixepoch() WHERE id = ? AND status = 'tertunda'",
          [d.jenis, d.berlaku_sampai, d.nama ?? null, d.instansi ?? null, new Date().getUTCFullYear(), id], "tambah", "klaim disetujui sebagai " + d.jenis],
        perpanjang: ["UPDATE kta SET berlaku_sampai = ?, diubah = unixepoch() WHERE id = ? AND status IN ('aktif','kedaluwarsa')", [d.berlaku_sampai, id], "ubah", "perpanjang sampai " + d.berlaku_sampai],
        cabut: ["UPDATE kta SET status = 'dicabut', diubah = unixepoch() WHERE id = ? AND status <> 'dicabut'", [id], "cabut", "kta dicabut"],
      }[aksi];
      const s = [
        env.DB.prepare(p[0]).bind(...p[1]),
        env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke, ip_hash) SELECT ?, ?, ?, 'kta', ?, ?, ? WHERE changes() > 0")
          .bind(akun.id, akun.peran, p[2], bid, JSON.stringify({ ringkas: p[3] }), ip16(ipHash)),
      ];
      if (aksi === "setujui") s.push(env.DB.prepare(SQL_NOMOR).bind(KODE_KTA[d.jenis], id));
      const [h] = await env.DB.batch(s);
      return { ok: h.meta.changes > 0 };
    } catch (e) { throw terjemah(e); }
  });
}
// Atur masa berlaku massal: semua KTA aktif/kedaluwarsa (opsional satu jenis). Satu jejak berisi jumlah kartu.
export async function ktaMasa(env, akun, { berlaku_sampai, jenis = null, ipHash = null }) {
  gerbangAdm(akun);
  if (!tglSah(berlaku_sampai)) throw salah("tanggal tidak sah");
  if (jenis !== null && !JENIS_KTA.includes(jenis)) throw salah("jenis tidak sah");
  return tanpaTabel(async () => {
    const [h] = await env.DB.batch([
      env.DB.prepare(`UPDATE kta SET berlaku_sampai = ?1, diubah = unixepoch() WHERE status IN ('aktif','kedaluwarsa')${jenis ? " AND jenis = ?2" : ""}`).bind(...(jenis ? [berlaku_sampai, jenis] : [berlaku_sampai])),
      env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke, ip_hash) VALUES (?, ?, 'ubah', 'kta', 'massal', json_object('ringkas', 'masa berlaku massal sampai ' || ? || ', ' || changes() || ' kartu'), ?)")
        .bind(akun.id, akun.peran, berlaku_sampai, ip16(ipHash)),
    ]);
    return { diubah: h.meta.changes };
  });
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

export async function catatSesi(env, { idHash, akunId, sampai, ipHash, info = null } = {}) {
  const k = kini();
  await BATCH(env, [
    env.DB.prepare("INSERT INTO sesi (id_hash, akun_id, dibuat, sampai, ip_hash) VALUES (?, ?, ?, ?, ?)").bind(idHash, akunId, k, sampai ?? k + 14 * 86400, ip16(ipHash)),
    env.DB.prepare("UPDATE akun SET masuk_terakhir = ? WHERE id = ?").bind(k, akunId),
    env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ip_hash) SELECT id, peran, 'masuk', 'sesi', CAST(id AS TEXT), ? FROM akun WHERE id = ?").bind(ip16(ipHash), akunId),
  ]);
  // Info perangkat terpisah: migrasi 0019 belum diterapkan atau gagal simpan tidak boleh menggagalkan masuk.
  if (info) {
    try {
      await env.DB.prepare("INSERT INTO sesi_info (id_hash, perangkat, jenis, kota, wilayah, negara) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(idHash, info.perangkat ?? null, ["desktop", "ponsel", "tablet"].includes(info.jenis) ? info.jenis : "desktop", info.kota ?? null, info.wilayah ?? null, info.negara ?? null).run();
    } catch { /* abaikan */ }
  }
  return { ok: true };
}

export async function bacaSesi(env, idHash) {
  if (typeof idHash !== "string" || idHash.length !== 64) return null;
  return (await env.DB.prepare(
    "SELECT a.id, a.surel, a.nama, a.peran, a.cakupan_prov, a.bahasa, a.status, a.wajib_ganti, s.sampai " +
    "FROM sesi s JOIN akun a ON a.id = s.akun_id WHERE s.id_hash = ? AND s.sampai > ? AND a.status = 'aktif'")
    .bind(idHash, kini()).first()) ?? null;
}

export async function akunAktif(env, id) {
  return !!(await env.DB.prepare("SELECT 1 AS x FROM akun WHERE id = ? AND status = 'aktif'").bind(id).first());
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
/* ========================= Profil saya 0018: profil sendiri + lihat profil anggota lain sesuai privasi ========================= */
// Akun hanya menulis profil/riwayat/foto miliknya (akun_id selalu dari sesi, tak pernah dari badan). Anggota lain hanya melihat bagian yang diizinkan
// pemiliknya ("semua"); admin dan super melihat semuanya. Hasil null = migrasi 0018 belum diterapkan (rute membalas 503). Jejak hanya memuat NAMA bidang yang berubah (K20).
export const BAGIAN_PRIVASI = ["foto", "pekerjaan", "lokasi", "bio", "keahlian", "tautan", "riwayat", "kontak"];
const PRIVASI_BAWAAN = { foto: "semua", pekerjaan: "semua", lokasi: "semua", bio: "semua", keahlian: "semua", tautan: "semua", riwayat: "semua", kontak: "admin" };
export const JENIS_RIWAYAT = ["pendidikan", "pengalaman", "sertifikasi", "publikasi"];
export const MAKS_RIWAYAT = 15; // per jenis
const KOLOM_PROFIL = ["gelar", "jabatan", "instansi", "organisasi_id", "kota", "kode_prov", "bio", "telepon"];
const uraiP = (s, bawaan) => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : bawaan; } catch { return bawaan; } };
const privasiPenuh = (s) => ({ ...PRIVASI_BAWAAN, ...Object.fromEntries(Object.entries(uraiP(s, {})).filter(([k, v]) => k in PRIVASI_BAWAAN && (v === "semua" || v === "admin"))) });

// Satu profil: { ada:false } bila akun tak ada/nonaktif. Bidang yang tak boleh dilihat peminta TIDAK ikut dikirim (bukan disamarkan).
export async function profilBaca(env, akun, id) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const a = await env.DB.prepare("SELECT id, nama, surel, peran FROM akun WHERE id = ? AND status = 'aktif'").bind(id).first();
    if (!a) return { ada: false };
    const [p, r] = await env.DB.batch([
      env.DB.prepare("SELECT * FROM profil WHERE akun_id = ?").bind(id),
      env.DB.prepare("SELECT id, jenis, isi FROM profil_riwayat WHERE akun_id = ? ORDER BY jenis, urut, id").bind(id),
    ]);
    const row = p.results[0] ?? null;
    const kta = await tanpaTabel(() => env.DB.prepare("SELECT jenis, tahun_masuk, nomor_kta FROM kta WHERE akun_id = ? AND status = 'aktif'").bind(id).first());
    const asal = row ?? (await tanpaTabel(() => env.DB.prepare("SELECT instansi, telepon FROM akun_profil WHERE akun_id = ?").bind(id).first())) ?? {};
    const diri = a.id === akun.id, penuh = diri || ADM_HAK.includes(akun.peran);
    const pv = privasiPenuh(row?.privasi);
    const lihat = (b) => penuh || pv[b] === "semua";
    const o = { ada: true, id: a.id, nama: a.nama, diri, lengkap: penuh, kta: kta ? { jenis: kta.jenis, tahun_masuk: kta.tahun_masuk, ...(penuh ? { nomor: kta.nomor_kta } : {}) } : null };
    if (lihat("foto")) o.foto = row?.foto_kunci ? row.diubah : null;
    if (lihat("pekerjaan")) Object.assign(o, { gelar: row?.gelar ?? null, jabatan: row?.jabatan ?? null, instansi: asal.instansi ?? null, organisasi_id: row?.organisasi_id ?? null });
    if (lihat("lokasi")) Object.assign(o, { kota: row?.kota ?? null, kode_prov: row?.kode_prov ?? null });
    if (lihat("bio")) o.bio = row?.bio ?? null;
    if (lihat("keahlian")) o.keahlian = uraiP(row?.keahlian, []);
    if (lihat("tautan")) o.tautan = uraiP(row?.tautan, {});
    if (lihat("kontak")) o.kontak = { surel: a.surel, telepon: asal.telepon ?? null };
    const tam = await tanpaTabel(() => env.DB.prepare("SELECT bahasa, sampul FROM profil_tambah WHERE akun_id = ?").bind(id).first());
    if (lihat("foto")) o.sampul = tam?.sampul ?? null;
    if (lihat("riwayat")) {
      o.bahasa = uraiP(tam?.bahasa, []);
      o.riwayat = Object.fromEntries(JENIS_RIWAYAT.map((j) => [j, []]));
      for (const x of r.results) o.riwayat[x.jenis]?.push({ id: x.id, ...uraiP(x.isi, {}) });
    }
    if (penuh) { o.privasi = pv; o.peran = a.peran; }
    return o;
  });
}

// d = kunci sah saja (rute memvalidasi). Gabung ke baris lama lalu tulis utuh; instansi dan telepon disalin ke akun_profil (Pustaka) bila ikut berubah.
export async function profilSimpan(env, akun, d) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const lama = await env.DB.prepare("SELECT * FROM profil WHERE akun_id = ?").bind(akun.id).first();
    const dasar = lama ?? (await tanpaTabel(() => env.DB.prepare("SELECT instansi, telepon FROM akun_profil WHERE akun_id = ?").bind(akun.id).first())) ?? {};
    const b = { ...dasar, ...d };
    const kunci = Object.keys(d);
    const privasi = JSON.stringify(privasiPenuh(JSON.stringify({ ...uraiP(lama?.privasi, {}), ...(d.privasi ?? {}) })));
    const js = (v, bawaan) => JSON.stringify(typeof v === "string" ? uraiP(v, bawaan) : v ?? bawaan); // baris lama = teks JSON, masukan baru = objek
    const nilai = [...KOLOM_PROFIL.map((k) => b[k] ?? null), js(b.keahlian, []), js(b.tautan, {}), privasi];
    const upsert = env.DB.prepare(
      "INSERT INTO profil (akun_id, " + KOLOM_PROFIL.join(", ") + ", keahlian, tautan, privasi, diubah) VALUES (?, " + "?, ".repeat(KOLOM_PROFIL.length + 3) + "unixepoch()) " +
      "ON CONFLICT (akun_id) DO UPDATE SET " + [...KOLOM_PROFIL, "keahlian", "tautan", "privasi"].map((k) => `${k} = excluded.${k}`).join(", ") + ", diubah = unixepoch()").bind(akun.id, ...nilai);
    const jej = jejakAdm(env, akun, "ubah", "profil", akun.id, "ubah profil: " + kunci.join(","));
    const salin = ("instansi" in d || "telepon" in d)
      ? env.DB.prepare("INSERT INTO akun_profil (akun_id, instansi, telepon, diubah) VALUES (?, ?, ?, unixepoch()) ON CONFLICT (akun_id) DO UPDATE SET instansi = excluded.instansi, telepon = excluded.telepon, diubah = unixepoch()")
        .bind(akun.id, b.instansi ? String(b.instansi).slice(0, 120) : null, b.telepon ?? null)
      : null;
    // bahasa dan sampul ada di profil_tambah (0019); baris lama dibaca dulu supaya kunci yang tak dikirim tidak terhapus.
    let tambah = null;
    if ("bahasa" in d || "sampul" in d) {
      const t0 = await tanpaTabel(() => env.DB.prepare("SELECT bahasa, sampul FROM profil_tambah WHERE akun_id = ?").bind(akun.id).first());
      tambah = env.DB.prepare("INSERT INTO profil_tambah (akun_id, bahasa, sampul, diubah) VALUES (?, ?, ?, unixepoch()) ON CONFLICT (akun_id) DO UPDATE SET bahasa = excluded.bahasa, sampul = excluded.sampul, diubah = unixepoch()")
        .bind(akun.id, JSON.stringify("bahasa" in d ? d.bahasa : uraiP(t0?.bahasa, [])), "sampul" in d ? d.sampul : t0?.sampul ?? null);
    }
    const aksiBatch = [upsert, ...(salin ? [salin] : []), ...(tambah ? [tambah] : []), jej];
    try { await env.DB.batch(aksiBatch); }
    catch (e) {
      const m = String(e?.message) + String(e?.cause?.message);
      if (salin && /akun_profil/.test(m)) await env.DB.batch(aksiBatch.filter((x) => x !== salin)); // migrasi 0012 belum ada: lewati salinan
      else if (tambah && /profil_tambah/.test(m)) await env.DB.batch(aksiBatch.filter((x) => x !== tambah)); // migrasi 0019 belum ada: lewati bahasa/sampul
      else throw terjemah(e);
    }
    return { ok: true };
  });
}

// Siapa boleh melihat foto id: dirinya, admin, atau bila bagian "foto" bernilai "semua". { ada:false } bila tak boleh/tak ada (404 tak membedakan).
export async function profilFotoKunci(env, akun, id) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const r = await env.DB.prepare("SELECT p.foto_kunci, p.privasi, p.diubah FROM profil p JOIN akun a ON a.id = p.akun_id WHERE p.akun_id = ? AND a.status = 'aktif'").bind(id).first();
    if (!r?.foto_kunci) return { ada: false };
    if (!(id === akun.id || ADM_HAK.includes(akun.peran) || privasiPenuh(r.privasi).foto === "semua")) return { ada: false };
    return { ada: true, kunci: r.foto_kunci, v: r.diubah };
  });
}

export async function profilFotoSet(env, akun, kunci) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    try {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO profil (akun_id, foto_kunci) VALUES (?, ?) ON CONFLICT (akun_id) DO UPDATE SET foto_kunci = excluded.foto_kunci, diubah = unixepoch()").bind(akun.id, kunci),
        jejakAdm(env, akun, "ubah", "profil", akun.id, kunci ? "ganti foto profil" : "hapus foto profil"),
      ]);
    } catch (e) { throw terjemah(e); }
    return { ok: true };
  });
}

export async function profilRiwayatTambah(env, akun, jenis, isi) {
  gerbangMasuk(akun);
  if (!JENIS_RIWAYAT.includes(jenis)) throw salah("jenis riwayat tidak sah");
  return tanpaTabel(async () => {
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM profil_riwayat WHERE akun_id = ? AND jenis = ?").bind(akun.id, jenis).first();
    if (n.n >= MAKS_RIWAYAT) throw mk("konflik", 409, "riwayat penuh");
    try {
      const [r] = await env.DB.batch([
        env.DB.prepare("INSERT INTO profil_riwayat (akun_id, jenis, isi, urut) VALUES (?, ?, ?, (SELECT COALESCE(MAX(urut), 0) + 1 FROM profil_riwayat WHERE akun_id = ? AND jenis = ?))").bind(akun.id, jenis, JSON.stringify(isi), akun.id, jenis),
        jejakAdm(env, akun, "tambah", "profil_riwayat", akun.id, "tambah riwayat " + jenis),
      ]);
      return { ada: true, id: r.meta.last_row_id };
    } catch (e) { throw terjemah(e); }
  });
}

export async function profilRiwayatUbah(env, akun, rid, jenis, isi) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    try {
      const [r] = await env.DB.batch([
        env.DB.prepare("UPDATE profil_riwayat SET isi = ?, diubah = unixepoch() WHERE id = ? AND akun_id = ? AND jenis = ?").bind(JSON.stringify(isi), rid, akun.id, jenis),
        jejakAdm(env, akun, "ubah", "profil_riwayat", akun.id, "ubah riwayat"),
      ]);
      return { ada: r.meta.changes === 1 };
    } catch (e) { throw terjemah(e); }
  });
}

export async function profilRiwayatHapus(env, akun, rid) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const [r] = await env.DB.batch([
      env.DB.prepare("DELETE FROM profil_riwayat WHERE id = ? AND akun_id = ?").bind(rid, akun.id),
      jejakAdm(env, akun, "hapus", "profil_riwayat", akun.id, "hapus riwayat"),
    ]);
    return { ada: r.meta.changes === 1 };
  });
}

// Sesi aktif milik sendiri (tanpa hash; hanya penanda "perangkat ini") dan cabut semua sesi lain.
export async function sesiSayaDaftar(env, akun, idHashIni) {
  gerbangMasuk(akun);
  // sid = 16 hex pertama hash token (pegangan cabut per sesi; tak cukup untuk memalsukan sesi). Tabel sesi_info (0019) belum ada = tanpa info.
  const dasar = "SELECT s.id_hash, s.dibuat, s.sampai";
  const sql = (info) => dasar + (info ? ", i.perangkat, i.jenis, i.kota, i.wilayah, i.negara FROM sesi s LEFT JOIN sesi_info i ON i.id_hash = s.id_hash" : " FROM sesi s") + " WHERE s.akun_id = ? AND s.sampai > ? ORDER BY s.dibuat DESC LIMIT 20";
  let r;
  try { r = await env.DB.prepare(sql(true)).bind(akun.id, kini()).all(); }
  catch (e) { if (!/no such table/i.test(String(e?.message) + String(e?.cause?.message))) throw e; r = await env.DB.prepare(sql(false)).bind(akun.id, kini()).all(); }
  return r.results.map((s) => ({ ini: s.id_hash === idHashIni, sid: s.id_hash.slice(0, 16), dibuat: s.dibuat, sampai: s.sampai, perangkat: s.perangkat ?? null, jenis: s.jenis ?? null, kota: s.kota ?? null, wilayah: s.wilayah ?? null, negara: s.negara ?? null }));
}
// Cabut satu sesi LAIN milik akun sendiri menurut sid; sesi ini tidak bisa dicabut lewat jalur ini (pakai keluar).
export async function sesiSayaCabut(env, akun, idHashIni, sid) {
  gerbangMasuk(akun);
  if (!/^[0-9a-f]{16}$/.test(String(sid))) throw salah("sid tidak sah");
  const [r] = await env.DB.batch([
    env.DB.prepare("DELETE FROM sesi WHERE akun_id = ? AND substr(id_hash, 1, 16) = ? AND id_hash <> ?").bind(akun.id, sid, idHashIni),
    env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT ?, ?, 'cabut', 'sesi', ?, ? WHERE changes() > 0").bind(akun.id, akun.peran, String(akun.id), JSON.stringify({ ringkas: "keluarkan satu perangkat" })),
  ]);
  return { dicabut: r.meta.changes };
}
export async function sesiSayaCabutLain(env, akun, idHashIni) {
  gerbangMasuk(akun);
  const [r] = await env.DB.batch([
    env.DB.prepare("DELETE FROM sesi WHERE akun_id = ? AND id_hash <> ?").bind(akun.id, idHashIni),
    jejakAdm(env, akun, "cabut", "sesi", akun.id, "keluar dari perangkat lain"),
  ]);
  return { dicabut: r.meta.changes };
}

/* ========================= Ikuti + Portal pembaruan 0019 ========================= */
// ikuti: preferensi pribadi akun (akun_id selalu dari sesi), tanpa jejak (log audit hanya tulisan kurasi, R11 2.16). Portal: klaim organisasi dan ajuan
// dikurasi admin; tiap tulis = batch([tulis, jejak]); jejak memuat jenis/id saja, bukan isi. Hasil null = migrasi 0019 belum diterapkan (rute membalas 503).
export const JENIS_IKUTI = ["proyek", "organisasi", "provinsi", "regulasi", "tender"];
export const JENIS_AJUAN = ["profil", "proyek_baru", "proyek_status"];
const RE_REF_IKUTI = /^[A-Za-z0-9_.:-]{1,80}$/, RE_ID_ORG = /^[A-Za-z0-9_-]{2,60}$/;
const TABEL_ORG = { klaim: "org_klaim", ajuan: "org_ajuan", wilayah: "wilayah_ajuan" };
const sahIkuti = (jenis, ref) => {
  if (!JENIS_IKUTI.includes(jenis) || typeof ref !== "string" || !RE_REF_IKUTI.test(ref) || (jenis === "provinsi" && !/^\d{2}$/.test(ref))) throw salah("ikuti tidak sah");
};

export async function ikutiDaftar(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const [b, l] = await env.DB.batch([
      env.DB.prepare("SELECT jenis, ref, dibuat FROM ikuti WHERE akun_id = ? ORDER BY dibuat DESC, ref LIMIT 200").bind(akun.id),
      env.DB.prepare("SELECT waktu FROM ikuti_lihat WHERE akun_id = ?").bind(akun.id),
    ]);
    return { baris: b.results, lihat: l.results[0]?.waktu ?? 0 };
  });
}

export async function ikutiSet(env, akun, jenis, ref, ikut) {
  gerbangMasuk(akun);
  sahIkuti(jenis, ref);
  return tanpaTabel(async () => {
    try {
      const r = await (ikut
        ? env.DB.prepare("INSERT INTO ikuti (akun_id, jenis, ref) VALUES (?, ?, ?) ON CONFLICT DO NOTHING")
        : env.DB.prepare("DELETE FROM ikuti WHERE akun_id = ? AND jenis = ? AND ref = ?")).bind(akun.id, jenis, ref).run();
      return { ubah: r.meta.changes };
    } catch (e) { throw terjemah(e); }
  });
}

export async function ikutiLihat(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    await env.DB.prepare("INSERT INTO ikuti_lihat (akun_id, waktu) VALUES (?, unixepoch()) ON CONFLICT (akun_id) DO UPDATE SET waktu = excluded.waktu").bind(akun.id).run();
    return { ok: true };
  });
}

// Perubahan sejak `sejak` (detik) pada entitas yang diikuti, dari D1: ajuan portal yang disetujui dan koreksi publik yang disetujui. Urut terbaru; maks `batas`.
export async function ikutiPerubahan(env, akun, sejak, batas = 60) {
  gerbangMasuk(akun);
  const dari = Math.max(0, Math.floor(Number(sejak) || 0)), n = Math.min(Math.max(Number(batas) || 60, 1), 100);
  return tanpaTabel(async () => {
    const portal = await env.DB.prepare(
      "SELECT 'portal' AS tipe, a.id, a.organisasi_id, a.jenis, a.proyek_id, a.diputus_pada AS waktu FROM org_ajuan a WHERE a.status = 'setuju' AND a.diputus_pada >= ? AND " +
      "(EXISTS (SELECT 1 FROM ikuti i WHERE i.akun_id = ? AND i.jenis = 'organisasi' AND i.ref = a.organisasi_id) OR " +
      "(a.proyek_id IS NOT NULL AND EXISTS (SELECT 1 FROM ikuti i WHERE i.akun_id = ? AND i.jenis = 'proyek' AND i.ref = a.proyek_id))) ORDER BY a.diputus_pada DESC, a.id DESC LIMIT ?")
      .bind(dari, akun.id, akun.id, n).all();
    const koreksi = await tanpaTabel(() => env.DB.prepare(
      "SELECT 'koreksi' AS tipe, k.id, k.entitas, k.entitas_id, k.kolom, k.diputus_pada AS waktu FROM koreksi_usul k WHERE k.status = 'setuju' AND k.diputus_pada >= ? AND " +
      "EXISTS (SELECT 1 FROM ikuti i WHERE i.akun_id = ? AND i.jenis = k.entitas AND i.ref = k.entitas_id) ORDER BY k.diputus_pada DESC, k.id DESC LIMIT ?")
      .bind(dari, akun.id, n).all());
    return [...portal.results, ...(koreksi?.results ?? [])].sort((a, b) => b.waktu - a.waktu).slice(0, n);
  });
}

// Portal ---------------------------------------------------------------------------------------------------------------------------
export async function orgTerhubung(env, akun, organisasiId) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => !!(await env.DB.prepare("SELECT 1 AS x FROM org_klaim WHERE akun_id = ? AND organisasi_id = ? AND status = 'setuju'").bind(akun.id, organisasiId).first()));
}

export async function orgSaya(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const [k, a] = await env.DB.batch([
      env.DB.prepare("SELECT id, organisasi_id, jabatan, status, catatan_admin, dibuat, diputus_pada FROM org_klaim WHERE akun_id = ? ORDER BY id DESC LIMIT 50").bind(akun.id),
      env.DB.prepare("SELECT id, organisasi_id, jenis, proyek_id, isi, bukti_url, status, catatan_admin, dibuat, diputus_pada FROM org_ajuan WHERE akun_id = ? ORDER BY id DESC LIMIT 50").bind(akun.id),
    ]);
    return { klaim: k.results, ajuan: a.results.map((x) => ({ ...x, isi: uraiP(x.isi, {}) })) };
  });
}

const jejakOrg = (env, akun, tabel, ringkas) =>
  env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) VALUES (?, ?, 'kirim', ?, CAST(last_insert_rowid() AS TEXT), ?)")
    .bind(akun.id, akun.peran, tabel, JSON.stringify({ ringkas: String(ringkas).slice(0, 300) }));

export async function orgKlaimBaru(env, akun, { organisasiId, jabatan = null, bukti = null }) {
  gerbangMasuk(akun);
  if (!RE_ID_ORG.test(String(organisasiId))) throw salah("organisasi tidak sah");
  return tanpaTabel(async () => {
    try {
      const [r] = await env.DB.batch([
        env.DB.prepare("INSERT INTO org_klaim (akun_id, organisasi_id, jabatan, bukti_url) VALUES (?, ?, ?, ?)").bind(akun.id, organisasiId, jabatan, bukti),
        jejakOrg(env, akun, "org_klaim", "klaim organisasi " + organisasiId),
      ]);
      return { id: r.meta.last_row_id };
    } catch (e) { throw terjemah(e); }
  });
}

// Hanya akun dengan klaim 'setuju' pada organisasi itu. isi = objek hasil validasi rute (tanpa data pribadi).
export async function orgAjuanBaru(env, akun, { organisasiId, jenis, proyekId = null, isi, bukti }) {
  gerbangMasuk(akun);
  if (!RE_ID_ORG.test(String(organisasiId)) || !JENIS_AJUAN.includes(jenis) || (proyekId !== null && !RE_ID_ORG.test(String(proyekId)))) throw salah("ajuan tidak sah");
  return tanpaTabel(async () => {
    if (!(await orgTerhubung(env, akun, organisasiId))) throw tolak("portal: akun belum terhubung ke organisasi ini");
    try {
      const [r] = await env.DB.batch([
        env.DB.prepare("INSERT INTO org_ajuan (akun_id, organisasi_id, jenis, proyek_id, isi, bukti_url) VALUES (?, ?, ?, ?, ?, ?)").bind(akun.id, organisasiId, jenis, proyekId, JSON.stringify(isi), bukti),
        jejakOrg(env, akun, "org_ajuan", `ajuan ${jenis} ${organisasiId}`),
      ]);
      return { id: r.meta.last_row_id };
    } catch (e) { throw terjemah(e); }
  });
}

export async function orgAntrean(env, akun, tipe, status, hal = 1) {
  gerbangAdm(akun);
  const tabel = TABEL_ORG[tipe];
  if (!tabel || !["baru", "setuju", "tolak"].includes(status)) throw salah("antrean tidak sah");
  const h = Math.min(Math.max(Number(hal) || 1, 1), 10000);
  const kolom = tipe === "klaim" ? "t.organisasi_id, t.jabatan, t.bukti_url" : tipe === "wilayah" ? "t.kode_prov AS organisasi_id, t.kode_prov, t.jenis, t.isi, t.bukti_url, t.berkas, t.persetujuan_foto" : "t.organisasi_id, t.jenis, t.proyek_id, t.isi, t.bukti_url";
  return tanpaTabel(async () => {
    const [b, c] = await env.DB.batch([
      env.DB.prepare(`SELECT t.id, ${kolom}, t.status, t.catatan_admin, t.dibuat, t.diputus_pada, a.nama AS pengaju FROM ${tabel} t LEFT JOIN akun a ON a.id = t.akun_id WHERE t.status = ? ORDER BY t.id DESC LIMIT ? OFFSET ?`)
        .bind(status, HALAMAN_ADM, (h - 1) * HALAMAN_ADM),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM ${tabel} WHERE status = ?`).bind(status),
    ]);
    return { baris: b.results.map((x) => (x.isi ? { ...x, isi: uraiP(x.isi, {}), ...(x.berkas ? { berkas: uraiP(x.berkas, null) } : {}) } : x)), total: c.results[0].n };
  });
}

// Putus sekali (UPDATE hanya bila masih 'baru'); jejak hanya bila UPDATE mengubah baris.
export async function orgPutus(env, akun, tipe, id, aksi, catatan) {
  gerbangAdm(akun);
  const tabel = TABEL_ORG[tipe];
  if (!tabel || !["setuju", "tolak"].includes(aksi) || !RE_ID.test(String(id))) throw salah("putusan tidak sah");
  return tanpaTabel(async () => {
    const [u] = await env.DB.batch([
      env.DB.prepare(`UPDATE ${tabel} SET status = ?, catatan_admin = ?, diputus_pada = ?, diputus_oleh = ? WHERE id = ? AND status = 'baru'`).bind(aksi, catatan ?? null, kini(), akun.id, Number(id)),
      env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT ?, ?, 'tinjau', ?, ?, ? WHERE changes() > 0")
        .bind(akun.id, akun.peran, tabel, String(id), JSON.stringify({ ringkas: `${tipe} ${aksi}` })),
    ]);
    return { ubah: u.meta.changes };
  });
}

// Lapisan "diperbarui oleh lembaga": ajuan yang disetujui untuk satu organisasi (jenis='organisasi') atau satu proyek (jenis='proyek', hanya status proyek).
export async function orgTerbit(env, akun, jenis, id) {
  gerbangMasuk(akun);
  if (!["organisasi", "proyek"].includes(jenis) || !RE_ID_ORG.test(String(id))) throw salah("terbit tidak sah");
  return tanpaTabel(async () => {
    const r = await env.DB.prepare(
      "SELECT id, organisasi_id, jenis, proyek_id, isi, bukti_url, diputus_pada AS tanggal FROM org_ajuan WHERE status = 'setuju' AND " +
      (jenis === "organisasi" ? "organisasi_id = ?" : "jenis = 'proyek_status' AND proyek_id = ?") + " ORDER BY diputus_pada DESC, id DESC LIMIT 100").bind(id).all();
    return r.results.map((x) => ({ ...x, isi: uraiP(x.isi, {}) }));
  });
}

// METI Wilayah ----------------------------------------------------------------------------------------------------------------------
// Pengurus wilayah = akun yang ditautkan admin ke satu provinsi (tabel wilayah_akun). Hanya provinsinya sendiri yang bisa diajukan.
export const JENIS_WILAYAH = ["sk", "sekretariat", "pengurus", "bidang", "keanggotaan", "kegiatan", "proyek_potensi"];
export async function wilayahKode(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => (await env.DB.prepare("SELECT kode_prov FROM wilayah_akun WHERE akun_id = ?").bind(akun.id).first())?.kode_prov ?? false); // false = bukan pengurus wilayah; null = tabel belum ada
}
export async function wilayahAkunDaftar(env, akun) {
  gerbangAdm(akun);
  return tanpaTabel(async () => (await env.DB.prepare("SELECT w.akun_id, w.kode_prov, w.dibuat, a.nama, a.surel FROM wilayah_akun w JOIN akun a ON a.id = w.akun_id ORDER BY w.kode_prov, a.nama LIMIT 500").all()).results);
}
// Tautkan (atau pindahkan) akun aktif ke satu provinsi. akunId atau surel.
export async function wilayahAkunTaut(env, akun, { akunId = null, surel = null, kode }) {
  gerbangAdm(akun);
  if (!/^\d{2}$/.test(String(kode)) || (akunId === null) === (surel === null)) throw salah("tautan tidak sah");
  return tanpaTabel(async () => {
    const a = await (akunId !== null ? env.DB.prepare("SELECT id FROM akun WHERE id = ? AND status = 'aktif'").bind(akunId) : env.DB.prepare("SELECT id FROM akun WHERE surel = ? AND status = 'aktif'").bind(String(surel).trim().toLowerCase())).first();
    if (!a) return { ada: false };
    await env.DB.batch([
      env.DB.prepare("INSERT INTO wilayah_akun (akun_id, kode_prov, oleh) VALUES (?, ?, ?) ON CONFLICT (akun_id) DO UPDATE SET kode_prov = excluded.kode_prov, oleh = excluded.oleh").bind(a.id, kode, akun.id),
      jejakAdm(env, akun, "ubah", "wilayah_akun", a.id, "tautkan pengurus ke provinsi " + kode),
    ]);
    return { ada: true, akun_id: a.id };
  });
}
export async function wilayahAkunLepas(env, akun, akunId) {
  gerbangAdm(akun);
  if (!RE_ID.test(String(akunId))) throw salah("akun tidak sah");
  return tanpaTabel(async () => {
    const [r] = await env.DB.batch([
      env.DB.prepare("DELETE FROM wilayah_akun WHERE akun_id = ?").bind(Number(akunId)),
      env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT ?, ?, 'hapus', 'wilayah_akun', ?, ? WHERE changes() > 0").bind(akun.id, akun.peran, String(akunId), JSON.stringify({ ringkas: "lepas pengurus wilayah" })),
    ]);
    return { dicabut: r.meta.changes };
  });
}
// isi sudah divalidasi rute. Kode HARUS provinsi tautan akun (bukan dari badan).
export async function wilayahAjuanBaru(env, akun, { kode, jenis, isi, bukti = null, berkas = null, berkasKunci = null, persetujuanFoto = 0 }) {
  gerbangMasuk(akun);
  if (!JENIS_WILAYAH.includes(jenis)) throw salah("jenis tidak sah");
  return tanpaTabel(async () => {
    const milik = (await env.DB.prepare("SELECT kode_prov FROM wilayah_akun WHERE akun_id = ?").bind(akun.id).first())?.kode_prov;
    if (!milik || milik !== kode) throw tolak("wilayah: akun bukan pengurus provinsi ini");
    try {
      const [r] = await env.DB.batch([
        env.DB.prepare("INSERT INTO wilayah_ajuan (akun_id, kode_prov, jenis, isi, bukti_url, berkas, berkas_kunci, persetujuan_foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(akun.id, kode, jenis, JSON.stringify(isi), bukti, berkas ? JSON.stringify(berkas) : null, berkasKunci, persetujuanFoto ? 1 : 0),
        jejakOrg(env, akun, "wilayah_ajuan", `ajuan ${jenis} wilayah ${kode}`),
      ]);
      return { id: r.meta.last_row_id, ada: true };
    } catch (e) { throw terjemah(e); }
  });
}
// Ajuan provinsi akun sendiri (semua status) untuk layar kelola.
export async function wilayahSaya(env, akun) {
  gerbangMasuk(akun);
  return tanpaTabel(async () => {
    const kode = (await env.DB.prepare("SELECT kode_prov FROM wilayah_akun WHERE akun_id = ?").bind(akun.id).first())?.kode_prov ?? null;
    if (!kode) return { kode: null, ajuan: [] };
    const r = await env.DB.prepare("SELECT id, jenis, isi, bukti_url, berkas, status, catatan_admin, dibuat, diputus_pada FROM wilayah_ajuan WHERE kode_prov = ? ORDER BY id DESC LIMIT 100").bind(kode).all();
    return { kode, ajuan: r.results.map((x) => ({ ...x, isi: uraiP(x.isi, {}), berkas: x.berkas ? uraiP(x.berkas, null) : null })) };
  });
}
// Lapisan publik wilayah (semua akun masuk): hanya yang disetujui.
export async function wilayahTerbit(env, akun, kode) {
  gerbangMasuk(akun);
  if (!/^\d{2}$/.test(String(kode))) throw salah("kode tidak sah");
  return tanpaTabel(async () => (await env.DB.prepare("SELECT id, jenis, isi, bukti_url, berkas, persetujuan_foto, diputus_pada AS tanggal FROM wilayah_ajuan WHERE kode_prov = ? AND status = 'setuju' ORDER BY diputus_pada DESC, id DESC LIMIT 200").bind(kode).all())
    .results.map((x) => ({ ...x, isi: uraiP(x.isi, {}), berkas: x.berkas ? uraiP(x.berkas, null) : null })));
}
// Kunci R2 sebuah berkas: yang disetujui boleh dilihat akun masuk; yang belum hanya pengurus provinsinya dan admin.
export async function wilayahBerkas(env, akun, id) {
  gerbangMasuk(akun);
  if (!RE_ID.test(String(id))) return { ada: false };
  return tanpaTabel(async () => {
    const x = await env.DB.prepare("SELECT kode_prov, status, berkas, berkas_kunci FROM wilayah_ajuan WHERE id = ? AND berkas_kunci IS NOT NULL").bind(Number(id)).first();
    if (!x) return { ada: false };
    if (x.status !== "setuju" && !ADM_HAK.includes(akun.peran) && (await env.DB.prepare("SELECT 1 AS y FROM wilayah_akun WHERE akun_id = ? AND kode_prov = ?").bind(akun.id, x.kode_prov).first()) == null) return { ada: false };
    return { ada: true, kunci: x.berkas_kunci, berkas: uraiP(x.berkas, null) };
  });
}

/* ========================= Lalu lintas orang vs AI (0020) ========================= */
const HARI_MS = 86400000, WIB_MS = 7 * 3600e3;
const tglLalin = (ms) => new Date(ms + WIB_MS).toISOString().slice(0, 10);
const GUARD = "INSERT INTO lalin (tgl, dim, kunci, n) SELECT ?1, ?2, ?3, 1 WHERE EXISTS (SELECT 1 FROM lalin WHERE tgl = ?1 AND dim = ?2 AND kunci = ?3) OR (SELECT COUNT(*) FROM lalin WHERE tgl = ?1 AND dim = ?2) < 80 ON CONFLICT (tgl, dim, kunci) DO UPDATE SET n = n + 1";
const PASTI = "INSERT INTO lalin (tgl, dim, kunci, n) VALUES (?1, ?2, ?3, 1) ON CONFLICT (tgl, dim, kunci) DO UPDATE SET n = n + 1";
const JIKA_BARU = "INSERT INTO lalin (tgl, dim, kunci, n) SELECT ?1, ?2, ?3, 1 WHERE changes() = 1 ON CONFLICT (tgl, dim, kunci) DO UPDATE SET n = n + 1";
let GARAM_LALIN = null, RENTANG_LALIN = null;

// Garam harian: dibuat saat pertama dipakai; hari baru = garam lama dan hash tamu lama dimusnahkan (retensi dirawat di sini).
export async function lalinGaram(env, tgl) {
  if (GARAM_LALIN?.tgl === tgl) return GARAM_LALIN.garam;
  const baru = [...crypto.getRandomValues(new Uint8Array(32))].map((x) => x.toString(16).padStart(2, "0")).join("");
  const ins = await env.DB.prepare("INSERT OR IGNORE INTO lalin_garam (tgl, garam) VALUES (?, ?)").bind(tgl, baru).run();
  const g = (await env.DB.prepare("SELECT garam FROM lalin_garam WHERE tgl = ?").bind(tgl).first()).garam;
  if (ins.meta.changes === 1) {
    const sekarang = Date.parse(tgl + "T00:00:00Z");
    await env.DB.batch([
      env.DB.prepare("DELETE FROM lalin_garam WHERE tgl < ?").bind(tgl),
      env.DB.prepare("DELETE FROM lalin_tamu WHERE tgl < ?").bind(tgl),
      env.DB.prepare("DELETE FROM lalin WHERE dim = 'jam' AND tgl < ?").bind(tglLalin(sekarang - 3 * HARI_MS)),
      env.DB.prepare("DELETE FROM lalin WHERE dim <> 'jenis' AND tgl < ?").bind(tglLalin(sekarang - 120 * HARI_MS))]);
  }
  GARAM_LALIN = { tgl, garam: g };
  return g;
}
// -> { operator: [[net, n, bits]] }, cache isolat 6 jam; tabel belum ada = kosong (semua tak terverifikasi).
export async function lalinRentang(env, kini, cidrKe) {
  if (RENTANG_LALIN && kini - RENTANG_LALIN.dimuat < 6 * 3600e3) return RENTANG_LALIN.op;
  const op = {};
  try {
    for (const x of (await env.DB.prepare("SELECT operator, cidr FROM lalin_ip").all()).results) op[x.operator] = JSON.parse(x.cidr).map(cidrKe).filter(Boolean);
  } catch { /* tabel belum ada */ }
  RENTANG_LALIN = { dimuat: kini, op };
  return op;
}
export async function lalinSimpanRentang(env, operator, cidr, kini) {
  await env.DB.prepare("INSERT INTO lalin_ip (operator, cidr, diambil) VALUES (?, ?, ?) ON CONFLICT (operator) DO UPDATE SET cidr = excluded.cidr, diambil = excluded.diambil")
    .bind(operator, JSON.stringify(cidr), Math.floor(kini / 1000)).run();
  RENTANG_LALIN = null;
}
export const lalinRentangUsang = async (env, kini) => {
  const r = await tanpaTabel(() => env.DB.prepare("SELECT COUNT(*) AS n, MIN(diambil) AS tertua FROM lalin_ip").first());
  return !r || r.n === 0 || r.tertua < kini / 1000 - 26 * 3600;
};
// rencana = keluaran lalin.rencanaHit; tamu = { h, hjam } (hash bergaram), jalur untuk "sedang membaca".
export async function lalinTulis(env, rencana, tamu = null) {
  const { tgl, jam, jenis, dim } = rencana, s = [];
  const d = (kunci) => s.push(env.DB.prepare(PASTI).bind(tgl, "jenis", kunci));
  const j = (kunci) => s.push(env.DB.prepare(PASTI).bind(tgl, "jam", `${kunci}|${jam}`));
  if (jenis === "manusia") {
    s.push(env.DB.prepare("INSERT OR IGNORE INTO lalin_tamu (tgl, h) VALUES (?, ?)").bind(tgl, tamu.h));
    s.push(env.DB.prepare(JIKA_BARU).bind(tgl, "jenis", "orang"));
    d("tampilan");
    s.push(env.DB.prepare("INSERT OR IGNORE INTO lalin_tamu (tgl, h) VALUES (?, ?)").bind(tgl, tamu.hjam));
    s.push(env.DB.prepare(JIKA_BARU).bind(tgl, "jam", `orang|${jam}`));
    if (rencana.klik_ai) { d("klik_ai"); j("klik_ai"); }
    s.push(env.DB.prepare("INSERT INTO lalin_kini (h, waktu, jalur) VALUES (?, ?, ?) ON CONFLICT (h) DO UPDATE SET waktu = excluded.waktu, jalur = excluded.jalur")
      .bind(tamu.h.slice(0, 8), tamu.kini, String(rencana.jalur).slice(0, 80)));
    s.push(env.DB.prepare("DELETE FROM lalin_kini WHERE waktu < ?").bind(tamu.kini - 10 * 60000));
  } else { d(jenis); j(jenis); }
  for (const [dm, kunci] of dim) s.push(env.DB.prepare(GUARD).bind(tgl, dm, String(kunci).replace(/[\u0000-\u001F<>"\\]/g, "").slice(0, 120) || "-"));
  await env.DB.batch(s);
}

const RENTANG_ADM = { "24j": 1, "7h": 7, "30h": 30, semua: 0 };
const JENIS_LALIN = ["orang", "tampilan", "ai_jawab", "ai_crawl", "mesin_cari", "tak", "klik_ai"];
export async function lalinAdmin(env, akun, r = "7h", sekarang = Date.now()) {
  gerbangAdm(akun);
  if (!(r in RENTANG_ADM)) throw salah("rentang tidak sah");
  const hari = tglLalin(sekarang), kemarin = tglLalin(sekarang - HARI_MS);
  const dari = r === "semua" ? "0000-00-00" : r === "24j" ? kemarin : tglLalin(sekarang - (RENTANG_ADM[r] - 1) * HARI_MS);
  return tanpaTabel(async () => {
    const [kini, jam, semua, seri, dim, ip] = await env.DB.batch([
      env.DB.prepare("SELECT h, jalur FROM lalin_kini WHERE waktu > ? ORDER BY waktu DESC").bind(sekarang - 5 * 60000),
      env.DB.prepare("SELECT tgl, kunci, n FROM lalin WHERE dim = 'jam' AND tgl >= ?").bind(kemarin),
      env.DB.prepare("SELECT kunci, SUM(n) AS n, MIN(tgl) AS mulai FROM lalin WHERE dim = 'jenis' GROUP BY kunci"),
      env.DB.prepare("SELECT tgl, kunci, n FROM lalin WHERE dim = 'jenis' AND tgl >= ? ORDER BY tgl").bind(dari),
      env.DB.prepare(`WITH d AS (SELECT dim, kunci, SUM(n) AS n FROM lalin WHERE dim NOT IN ('jenis','jam') AND tgl >= ? GROUP BY dim, kunci)
        SELECT dim, kunci, n FROM (SELECT *, row_number() OVER (PARTITION BY dim ORDER BY n DESC, kunci) AS r FROM d) WHERE r <= 100 ORDER BY dim, n DESC, kunci`).bind(dari),
      env.DB.prepare("SELECT MAX(diambil) AS diambil, COUNT(*) AS operator FROM lalin_ip")]);
    // 24 jam terakhir dari penghitung per jam (tgl + HH WIB)
    const jamKini = Number(new Date(sekarang + WIB_MS).toISOString().slice(11, 13));
    const nilai = Object.fromEntries(jam.results.map((x) => [`${x.tgl}|${x.kunci}`, x.n]));
    const per_jam = [], total24 = Object.fromEntries(JENIS_LALIN.map((k) => [k, 0]));
    for (let i = 23; i >= 0; i--) {
      const h = (jamKini - i + 24) % 24, tgl = jamKini - i < 0 ? kemarin : hari, HH = String(h).padStart(2, "0");
      const v = (k) => nilai[`${tgl}|${k}|${HH}`] || 0, baris = { jam: HH, tgl };
      for (const k of JENIS_LALIN) if (k !== "tampilan") { baris[k] = v(k); total24[k] += baris[k]; }
      per_jam.push(baris);
    }
    const sejak = Object.fromEntries(JENIS_LALIN.map((k) => [k, 0])); let mulai = hari;
    for (const x of semua.results) { sejak[x.kunci] = x.n; if (x.mulai < mulai) mulai = x.mulai; }
    const peta = {};
    for (const x of seri.results) (peta[x.tgl] ||= { tgl: x.tgl, ...Object.fromEntries(JENIS_LALIN.map((k) => [k, 0])) })[x.kunci] = x.n;
    const D = {};
    for (const x of dim.results) (D[x.dim] ||= []).push([x.kunci, x.n]);
    const olehTamu = new Set(), buka = {};
    for (const x of kini.results) if (!olehTamu.has(x.h)) { olehTamu.add(x.h); buka[x.jalur] = (buka[x.jalur] || 0) + 1; }
    return { rentang: r, hari, online: olehTamu.size, buka: Object.entries(buka).sort((a, b) => b[1] - a[1]).slice(0, 10),
      total24, sejak, mulai, seri: Object.values(peta), per_jam: r === "24j" ? per_jam : null, dim: D,
      rentang_ip: { operator: ip.results[0]?.operator || 0, diambil: ip.results[0]?.diambil || null } };
  });
}

/* ========================= Pendaftaran anggota mandiri (0021) ========================= */
export const JENIS_DAFTAR = ["individu", "organisasi", "mahasiswa"];
export const KUNCI_ATUR_DAFTAR = ["iuran_individu", "iuran_organisasi", "iuran_mahasiswa", "rekening_bank", "rekening_nomor", "rekening_nama", "rekening_catatan"];
const gerbangPend = (akun) => { const i = boleh(akun?.peran, "ubah", "pendaftaran", undefined, akun); if (!i.ok) throw tolak(i.alasan); };
const KOLOM_LIST_DAFTAR = "id, jenis, status, nama, organisasi, kota, prov, bayar, tanpa_lunas, iuran, dibuat, diputus_pada";
const jejakPend = (env, siapa, peran, aksi, id, ke, kondisi = "") =>
  env.DB.prepare(`INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT ?, ?, ?, 'pendaftaran', ?, ? ${kondisi}`).bind(siapa, peran, aksi, String(id), JSON.stringify(ke));

export async function pengaturanDaftarBaca(env) {
  const o = Object.fromEntries(KUNCI_ATUR_DAFTAR.map((k) => [k, ""]));
  try { for (const r of (await env.DB.prepare("SELECT kunci, nilai FROM pengaturan_daftar").all()).results) o[r.kunci] = r.nilai; } catch { /* tabel belum ada = kosong */ }
  return o;
}
export async function pengaturanDaftarAdmin(env, akun) { gerbangAdm(akun); return pengaturanDaftarBaca(env); }
export async function pengaturanDaftarSimpan(env, akun, nilai) {
  gerbangAdm(akun);
  const s = [];
  for (const [k, v] of Object.entries(nilai)) {
    if (!KUNCI_ATUR_DAFTAR.includes(k) || typeof v !== "string" || v.length > 300) throw salah("pengaturan tidak sah");
    if (k.startsWith("iuran_") && v !== "" && !/^\d{1,9}$/.test(v)) throw salah("iuran harus angka rupiah");
    s.push(v === "" ? env.DB.prepare("DELETE FROM pengaturan_daftar WHERE kunci = ?").bind(k)
      : env.DB.prepare("INSERT INTO pengaturan_daftar (kunci, nilai, diubah, diubah_oleh) VALUES (?, ?, unixepoch(), ?) ON CONFLICT (kunci) DO UPDATE SET nilai = excluded.nilai, diubah = excluded.diubah, diubah_oleh = excluded.diubah_oleh").bind(k, v, akun.id));
  }
  if (!s.length) throw salah("tidak ada pengaturan");
  s.push(jejakPend(env, akun.id, akun.peran, "ubah", "pengaturan", { kunci: Object.keys(nilai) }));
  try { await env.DB.batch(s); } catch (e) { throw terjemah(e); }
  return true;
}

// Publik; nilai sudah divalidasi rute. Surel yang sudah jadi akun atau sudah menunggu = konflik.
export async function pendaftaranBaru(env, d, tokenHash, ipHash = null) {
  const ada = await env.DB.prepare("SELECT 1 AS x FROM akun WHERE surel = ?").bind(d.surel).first();
  if (ada) throw mk("konflik", 409, "surel sudah terdaftar");
  const at = await pengaturanDaftarBaca(env), iuran = /^\d+$/.test(at["iuran_" + d.jenis]) ? Number(at["iuran_" + d.jenis]) : null;
  try {
    const r = await env.DB.batch([
      env.DB.prepare("INSERT INTO pendaftaran (token_hash, jenis, nama, surel, hp, organisasi, kota, prov, rinci, setuju_pdp, iuran) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)")
        .bind(tokenHash, d.jenis, d.nama, d.surel, d.hp, d.organisasi ?? null, d.kota ?? null, d.prov ?? null, JSON.stringify(d.rinci ?? {}), iuran),
      env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke, ip_hash) VALUES (NULL, 'publik', 'tambah', 'pendaftaran', CAST(last_insert_rowid() AS TEXT), ?, ?)")
        .bind(JSON.stringify({ jenis: d.jenis }), ip16(ipHash))]);
    return { id: r[0].meta.last_row_id };
  } catch (e) { throw terjemah(e); }
}
export async function pendaftaranFotoSet(env, tokenHash, kunci) {
  const r = await env.DB.prepare("UPDATE pendaftaran SET foto_kunci = ? WHERE token_hash = ? AND foto_kunci IS NULL AND status = 'menunggu'").bind(kunci, tokenHash).run();
  return r.meta.changes === 1;
}
// Pendaftar melihat statusnya sendiri lewat token: tanpa HP/surel/rinci, hanya yang perlu untuk membayar.
export async function pendaftaranLacak(env, tokenHash) {
  const p = await env.DB.prepare("SELECT id, jenis, status, nama, bayar, iuran, catatan_admin, dibuat FROM pendaftaran WHERE token_hash = ?").bind(tokenHash).first();
  if (!p) return null;
  const [b, at] = [(await env.DB.prepare("SELECT id, status, catatan, tipe, dibuat FROM pendaftaran_bukti WHERE pendaftaran_id = ? ORDER BY id DESC").bind(p.id).all()).results, await pengaturanDaftarBaca(env)];
  const { id, catatan_admin, ...pub } = p;
  return { pendaftaran: { ...pub, catatan: p.status === "ditolak" ? catatan_admin : null }, bukti: b,
    rekening: { bank: at.rekening_bank, nomor: at.rekening_nomor, nama: at.rekening_nama, catatan: at.rekening_catatan }, _id: id };
}
export async function pendaftaranBuktiTambah(env, tokenHash, { kunci, tipe, ukuran }) {
  const [a] = await env.DB.batch([
    env.DB.prepare("INSERT INTO pendaftaran_bukti (pendaftaran_id, kunci_r2, tipe, ukuran) SELECT p.id, ?, ?, ? FROM pendaftaran p WHERE p.token_hash = ? AND p.status <> 'ditolak' AND p.bayar <> 'lunas' AND (SELECT COUNT(*) FROM pendaftaran_bukti WHERE pendaftaran_id = p.id AND status = 'menunggu') < 3")
      .bind(kunci, tipe, ukuran, tokenHash),
    env.DB.prepare("UPDATE pendaftaran SET bayar = 'menunggu' WHERE token_hash = ? AND bayar = 'belum' AND changes() = 1").bind(tokenHash)]);
  return a.meta.changes === 1;
}

export async function pendaftaranDaftar(env, akun, { status = "menunggu", jenis = "", prov = "", hal = 1 } = {}) {
  gerbangPend(akun);
  const w = ["status = ?"], b = [status];
  if (jenis) { w.push("jenis = ?"); b.push(jenis); }
  if (prov) { w.push("prov = ?"); b.push(prov); }
  const h = Math.min(Math.max(Number(hal) || 1, 1), 10000);
  return tanpaTabel(async () => {
    const [r, t, hit] = await env.DB.batch([
      env.DB.prepare(`SELECT ${KOLOM_LIST_DAFTAR} FROM pendaftaran WHERE ${w.join(" AND ")} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...b, HALAMAN_ADM, (h - 1) * HALAMAN_ADM),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM pendaftaran WHERE ${w.join(" AND ")}`).bind(...b),
      env.DB.prepare("SELECT status, COUNT(*) AS n FROM pendaftaran GROUP BY status")]);
    return { baris: r.results, total: t.results[0].n, hitung: Object.fromEntries(hit.results.map((x) => [x.status, x.n])) };
  });
}
export async function pendaftaranRincian(env, akun, id) {
  gerbangPend(akun);
  if (!RE_ID.test(String(id))) throw salah("id tidak sah");
  const p = await env.DB.prepare("SELECT id, jenis, status, nama, surel, hp, organisasi, kota, prov, rinci, foto_kunci IS NOT NULL AS ada_foto, bayar, iuran, tanpa_lunas, catatan_admin, akun_id, dibuat, diputus_pada FROM pendaftaran WHERE id = ?").bind(Number(id)).first();
  if (!p) return null;
  let rinci = {}; try { rinci = JSON.parse(p.rinci); } catch { /* rusak = kosong */ }
  const bukti = (await env.DB.prepare("SELECT id, tipe, ukuran, status, catatan, dibuat FROM pendaftaran_bukti WHERE pendaftaran_id = ? ORDER BY id DESC").bind(p.id).all()).results;
  return { ...p, rinci, bukti };
}
export async function pendaftaranFotoKunci(env, akun, id) {
  gerbangPend(akun);
  return (await env.DB.prepare("SELECT foto_kunci FROM pendaftaran WHERE id = ?").bind(Number(id)).first())?.foto_kunci ?? null;
}
export async function pendaftaranBuktiKunci(env, akun, bid) {
  gerbangPend(akun);
  return env.DB.prepare("SELECT kunci_r2, tipe FROM pendaftaran_bukti WHERE id = ?").bind(Number(bid)).first();
}
// Setujui: akun anggota 'menunggu' + tautan aktivasi (hash dari rute) dalam SATU batch; tanpa lunas = bertanda. Tolak: alasan wajib.
export async function pendaftaranPutus(env, akun, id, aksi, { catatan = null, aktivasiHash = null, aktivasiSampai = null } = {}) {
  gerbangPend(akun);
  if (!["setuju", "tolak"].includes(aksi)) throw salah("aksi tidak dikenal");
  if (!RE_ID.test(String(id))) throw salah("id tidak sah");
  const n = kini();
  try {
    if (aksi === "tolak") {
      const [u] = await env.DB.batch([
        env.DB.prepare("UPDATE pendaftaran SET status = 'ditolak', catatan_admin = ?, diputus_pada = ?, diputus_oleh = ? WHERE id = ? AND status = 'menunggu'").bind(catatan, n, akun.id, Number(id)),
        jejakPend(env, akun.id, akun.peran, "tinjau", id, { ringkas: "pendaftaran tolak" }, "WHERE changes() > 0")]);
      return { ubah: u.meta.changes };
    }
    if (!aktivasiHash) throw salah("tautan aktivasi wajib");
    const [, u] = await env.DB.batch([
      env.DB.prepare("INSERT INTO akun (surel, nama, peran, status, aktivasi_hash, aktivasi_sampai, dibuat_oleh) SELECT surel, nama, 'anggota', 'menunggu', ?, ?, ? FROM pendaftaran WHERE id = ? AND status = 'menunggu'")
        .bind(aktivasiHash, aktivasiSampai, akun.id, Number(id)),
      env.DB.prepare("UPDATE pendaftaran SET status = 'disetujui', akun_id = last_insert_rowid(), diputus_pada = ?, diputus_oleh = ?, catatan_admin = ?, tanpa_lunas = CASE WHEN bayar = 'lunas' THEN 0 ELSE 1 END WHERE id = ? AND status = 'menunggu' AND changes() = 1")
        .bind(n, akun.id, catatan, Number(id)),
      jejakPend(env, akun.id, akun.peran, "tinjau", id, { ringkas: "pendaftaran setuju" }, "WHERE changes() > 0"),
      env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT ?, ?, 'tambah', 'akun', CAST(akun_id AS TEXT), ? FROM pendaftaran WHERE id = ? AND akun_id IS NOT NULL AND changes() > 0")
        .bind(akun.id, akun.peran, JSON.stringify({ peran: "anggota", dari: "pendaftaran" }), Number(id))]);
    return { ubah: u.meta.changes };
  } catch (e) { throw terjemah(e); }
}
export async function pendaftaranBuktiPutus(env, akun, bid, aksi, catatan = null) {
  gerbangPend(akun);
  if (!["terima", "tolak"].includes(aksi)) throw salah("aksi tidak dikenal");
  if (!RE_ID.test(String(bid))) throw salah("id tidak sah");
  const [u] = await env.DB.batch([
    env.DB.prepare("UPDATE pendaftaran_bukti SET status = ?, catatan = ?, diputus_pada = ?, diputus_oleh = ? WHERE id = ? AND status = 'menunggu'").bind(aksi === "terima" ? "diterima" : "ditolak", catatan, kini(), akun.id, Number(bid)),
    env.DB.prepare(`UPDATE pendaftaran SET bayar = CASE WHEN EXISTS (SELECT 1 FROM pendaftaran_bukti WHERE pendaftaran_id = pendaftaran.id AND status = 'diterima') THEN 'lunas'
        WHEN EXISTS (SELECT 1 FROM pendaftaran_bukti WHERE pendaftaran_id = pendaftaran.id AND status = 'menunggu') THEN 'menunggu' ELSE 'belum' END,
      tanpa_lunas = CASE WHEN EXISTS (SELECT 1 FROM pendaftaran_bukti WHERE pendaftaran_id = pendaftaran.id AND status = 'diterima') THEN 0 ELSE tanpa_lunas END
      WHERE changes() = 1 AND id = (SELECT pendaftaran_id FROM pendaftaran_bukti WHERE id = ?)`).bind(Number(bid)),
    jejakPend(env, akun.id, akun.peran, "tinjau", bid, { ringkas: "bukti iuran " + aksi }, "WHERE changes() > 0")]);
  return { ubah: u.meta.changes };
}

// Midtrans (opsional): gross SELALU dari DB.
export async function onlineBuat(env, tokenHash, orderId) {
  const p = await env.DB.prepare("SELECT id, nama, surel, iuran, bayar, status FROM pendaftaran WHERE token_hash = ?").bind(tokenHash).first();
  if (!p || p.status === "ditolak" || p.bayar === "lunas" || !(p.iuran > 0)) return null;
  await env.DB.prepare("INSERT INTO pembayaran_online (order_id, pendaftaran_id, gross) VALUES (?, ?, ?)").bind(orderId, p.id, p.iuran).run();
  return { nama: p.nama, surel: p.surel, gross: p.iuran };
}
export const onlineBaca = (env, orderId) => env.DB.prepare("SELECT order_id, gross, status, pendaftaran_id FROM pembayaran_online WHERE order_id = ?").bind(orderId).first();
export async function onlineSelesai(env, orderId, lunas) {
  const [u] = await env.DB.batch([
    env.DB.prepare("UPDATE pembayaran_online SET status = ?, diubah = unixepoch() WHERE order_id = ? AND status = 'tertunda'").bind(lunas ? "lunas" : "gagal", orderId),
    env.DB.prepare("UPDATE pendaftaran SET bayar = 'lunas', tanpa_lunas = 0 WHERE ? = 1 AND changes() = 1 AND id = (SELECT pendaftaran_id FROM pembayaran_online WHERE order_id = ?)").bind(lunas ? 1 : 0, orderId),
    env.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) SELECT NULL, 'publik', 'ubah', 'pendaftaran', CAST(pendaftaran_id AS TEXT), ? FROM pembayaran_online WHERE order_id = ? AND ? = 1 AND changes() > 0")
      .bind(JSON.stringify({ ringkas: "iuran lunas via Midtrans" }), orderId, lunas ? 1 : 0)]);
  return u.meta.changes === 1;
}

export const ping = async (env) => (await env.DB.prepare("SELECT 1 AS ok").first()).ok === 1;

export const sistem = { cariAkunUntukMasuk, catatSesi, bacaSesi, akunAktif, hapusSesi, catatLaju, periksaTautanAktivasi, pakaiTautanAktivasi, ubahSandi, rehashSandi, jejakTulis, sapu, ping };

// Feed media sosial (sosmed_feed): cron menulis tanpa akun (jalur sistem seperti lalin); admin hanya mengurasi baris linkedin.
export const sosmedDaftar = async (env) => (await tanpaTabel(() => env.DB.prepare("SELECT platform, uid, judul, tanggal, url, gambar FROM sosmed_feed ORDER BY tanggal DESC LIMIT 200").all()))?.results ?? [];
// Upsert satu platform; baris yang tak lagi ada di sumber dipangkas. Mengembalikan kunci R2 baris terpangkas agar berkasnya ikut dihapus.
export async function sosmedSimpan(env, platform, baris) {
  if (!baris.length) return [];
  const up = baris.map((b) => env.DB.prepare("INSERT INTO sosmed_feed (platform, uid, judul, tanggal, url, gambar) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (platform, uid) DO UPDATE SET judul = excluded.judul, tanggal = excluded.tanggal, url = excluded.url, gambar = COALESCE(excluded.gambar, gambar)")
    .bind(platform, b.uid, b.judul, b.tanggal, b.url, b.gambar ?? null));
  const ada = baris.map((b) => b.uid), ph = ada.map(() => "?").join(",");
  const buang = (await env.DB.prepare(`SELECT gambar FROM sosmed_feed WHERE platform = ? AND uid NOT IN (${ph}) AND gambar IS NOT NULL`).bind(platform, ...ada).all()).results.map((r) => r.gambar);
  await env.DB.batch([...up, env.DB.prepare(`DELETE FROM sosmed_feed WHERE platform = ? AND uid NOT IN (${ph})`).bind(platform, ...ada)]);
  return buang;
}
export async function sosmedLinkedin(env, akun, aksi, b) {
  gerbangAdm(akun);
  if (aksi === "hapus") return void (await env.DB.prepare("DELETE FROM sosmed_feed WHERE platform = 'linkedin' AND uid = ?").bind(b.uid).run());
  await env.DB.prepare("INSERT INTO sosmed_feed (platform, uid, judul, tanggal, url) VALUES ('linkedin', ?, ?, ?, ?) ON CONFLICT (platform, uid) DO UPDATE SET judul = excluded.judul, tanggal = excluded.tanggal, url = excluded.url")
    .bind(b.uid, b.judul, b.tanggal, b.url).run();
}
