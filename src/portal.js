// portal.js: portal pembaruan data lembaga (migrasi 0019). Akun mengklaim organisasi (disetujui admin), lalu mengajukan perubahan profil / proyek baru /
// status proyek bertautan bukti. Semua masuk antrean admin; yang disetujui tampil sebagai lapisan "diperbarui oleh lembaga, dikurasi METI".
// Validasi di server menolak data pribadi (surel, telepon/NIK, kata kunci alamat rumah). D1 hanya lewat hak.js.
import * as hak from "./hak.js";
import { bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const KONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const RE_ID = /^\d{1,12}$/, RE_REF = /^[A-Za-z0-9_-]{2,60}$/;
const SALAH = () => new Galat("masukan_salah", 422);
export const TEKNOLOGI = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"];
export const STATUS_PROYEK = ["rencana", "konstruksi", "beroperasi"];

// Data pribadi: surel, deret >= 9 digit (telepon/NIK; pemisah antar-angka dibuang dulu), kata kunci alamat rumah / HP pribadi.
export const adaDataPribadi = (s) =>
  /[^\s@]+@[^\s@]+\.[^\s@]+/.test(s) || /\d{9,}/.test(s.replace(/(?<=\d)[\s.\-()+](?=\d)/g, "")) ||
  /\b(nik|ktp|npwp\s+pribadi|rumah\s+pribadi|alamat\s+rumah|hp\s+pribadi|wa\s+pribadi|whatsapp\s+pribadi|surel\s+pribadi|email\s+pribadi)\b/i.test(s);

export const teks = (v, maks, { baris = false, wajib = false } = {}) => {
  if (v == null || v === "") { if (wajib) throw SALAH(); return null; }
  if (typeof v !== "string") throw SALAH();
  const s = (baris ? v.replace(/\r\n?/g, "\n") : v.replace(/\s+/g, " ")).trim();
  if (!s) { if (wajib) throw SALAH(); return null; }
  if (s.length > maks || KONTROL.test(s) || adaDataPribadi(s)) throw SALAH();
  return s;
};
export function url(v, maks, { wajib = false } = {}) {
  const s = teks(v, maks, { wajib });
  if (!s) return null;
  let u;
  try { u = new URL(s); } catch { throw SALAH(); }
  if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".") || /(^|\.)(wa\.me|whatsapp\.com|t\.me)$/.test(u.hostname)) throw SALAH();
  return u.href.slice(0, maks);
}
// Bukti boleh memuat angka panjang di query (tautan berita); hanya diperiksa bentuk URL-nya.
export function bukti(v, wajib) {
  if (v == null || v === "") { if (wajib) throw SALAH(); return null; }
  if (typeof v !== "string" || v.length > 600 || KONTROL.test(v)) throw SALAH();
  let u;
  try { u = new URL(v.trim()); } catch { throw SALAH(); }
  if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".")) throw SALAH();
  return u.href.slice(0, 600);
}
export const tahun = (v, wajib = false) => {
  if (v == null || v === "") { if (wajib) throw SALAH(); return null; }
  const n = Number(v);
  if (!Number.isInteger(n) || n < 2000 || n > 2100) throw SALAH();
  return n;
};
export const pilih = (v, daftar, wajib = true) => {
  if (v == null || v === "") { if (wajib) throw SALAH(); return null; }
  if (!daftar.includes(v)) throw SALAH();
  return v;
};
export const hanyaKunci = (b, boleh) => { if (Object.keys(b).some((k) => !boleh.includes(k))) throw SALAH(); };
export const bersih = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length)));

/** Murni, diekspor untuk uji. Mengembalikan { jenis, proyekId, isi, bukti } atau melempar 422. */
export function periksaAjuan(b) {
  const jenis = pilih(b.jenis, hak.JENIS_AJUAN), x = b.isi;
  if (!x || typeof x !== "object" || Array.isArray(x)) throw SALAH();
  const organisasiId = teks(b.organisasi_id, 60, { wajib: true });
  if (!RE_REF.test(organisasiId)) throw SALAH();
  let isi, proyekId = null;
  if (jenis === "profil") {
    hanyaKunci(x, ["deskripsi", "situs", "alamat_kantor", "teknologi"]);
    if (x.teknologi != null && (!Array.isArray(x.teknologi) || x.teknologi.length > 6 || x.teknologi.some((k) => !TEKNOLOGI.includes(k)))) throw SALAH();
    isi = bersih({ deskripsi: teks(x.deskripsi, 600, { baris: true }), situs: url(x.situs, 200), alamat_kantor: teks(x.alamat_kantor, 200), teknologi: x.teknologi ? [...new Set(x.teknologi)] : null });
  } else if (jenis === "proyek_baru") {
    hanyaKunci(x, ["nama", "teknologi", "kapasitas_mw", "kode_prov", "status", "cod"]);
    const kap = x.kapasitas_mw == null || x.kapasitas_mw === "" ? null : Number(x.kapasitas_mw);
    if (kap !== null && !(Number.isFinite(kap) && kap > 0 && kap <= 100000)) throw SALAH();
    const prov = teks(x.kode_prov, 2);
    if (prov && !/^\d{2}$/.test(prov)) throw SALAH();
    isi = bersih({ nama: teks(x.nama, 120, { wajib: true }), teknologi: pilih(x.teknologi, TEKNOLOGI), kapasitas_mw: kap, kode_prov: prov, status: pilih(x.status, STATUS_PROYEK), cod: tahun(x.cod) });
  } else {
    hanyaKunci(x, ["status", "cod_aktual"]);
    proyekId = teks(b.proyek_id, 60, { wajib: true });
    if (!RE_REF.test(proyekId)) throw SALAH();
    isi = bersih({ status: pilih(x.status, STATUS_PROYEK), cod_aktual: tahun(x.cod_aktual) });
  }
  if (!Object.keys(isi).length) throw SALAH();
  return { organisasiId, jenis, proyekId, isi, bukti: bukti(b.bukti_url, true) };
}

/** Ajuan yang disetujui (terbaru dulu) -> lapisan tampil. organisasi: profil gabungan (yang baru menang) + proyek baru + status proyek terbaru per proyek. */
export function susunTerbit(jenis, baris) {
  const tgl = (x) => x.tanggal;
  if (jenis === "proyek") {
    const x = baris[0];
    return { status: x ? { ...x.isi, tanggal: tgl(x), bukti_url: x.bukti_url } : null };
  }
  const profil = baris.filter((x) => x.jenis === "profil");
  const gabung = profil.length ? { ...Object.assign({}, ...profil.map((x) => x.isi).reverse()), tanggal: tgl(profil[0]), bukti_url: profil[0].bukti_url } : null;
  const terlihat = new Set();
  return {
    profil: gabung,
    proyek_baru: baris.filter((x) => x.jenis === "proyek_baru").map((x) => ({ id: x.id, ...x.isi, tanggal: tgl(x), bukti_url: x.bukti_url })),
    proyek_status: baris.filter((x) => x.jenis === "proyek_status" && !terlihat.has(x.proyek_id) && terlihat.add(x.proyek_id)).map((x) => ({ proyek_id: x.proyek_id, ...x.isi, tanggal: tgl(x), bukti_url: x.bukti_url })),
  };
}

export const rute = {
  "GET /api/portal/saya": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.orgSaya(env, akun);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/portal/klaim": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 2048);
    const organisasiId = typeof b.organisasi_id === "string" && RE_REF.test(b.organisasi_id) ? b.organisasi_id : null;
    if (!organisasiId) return gagal("masukan_salah", 422);
    const jabatan = teks(b.jabatan, 120), bkt = bukti(b.bukti_url, false);
    if ((await hak.catatLaju(env, "koreksi:kl" + akun.id, 86400)) > 5) return gagal("laju_terlampaui");
    const r = await hak.orgKlaimBaru(env, akun, { organisasiId, jabatan, bukti: bkt });
    return r ? json({ id: r.id }, 201, PRIVAT) : NONAKTIF();
  },

  "POST /api/portal/ajuan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const a = periksaAjuan(await bacaBody(req, 8192));
    if ((await hak.catatLaju(env, "koreksi:aj" + akun.id, 3600)) > 20) return gagal("laju_terlampaui");
    const r = await hak.orgAjuanBaru(env, akun, a); // bukan terhubung = 403 dari hak.js
    return r ? json({ id: r.id }, 201, PRIVAT) : NONAKTIF();
  },

  // Lapisan "diperbarui oleh lembaga" untuk /o/<id> (jenis organisasi) dan /p/<id> (jenis proyek). Tabel belum ada = lapisan kosong.
  "GET /api/pembaruan/:jenis/:id": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const { jenis, id } = p.params;
    if (!["organisasi", "proyek"].includes(jenis) || !RE_REF.test(id)) return gagal("tidak_ditemukan");
    const r = await hak.orgTerbit(env, akun, jenis, id);
    return json(susunTerbit(jenis, r ?? []), 200, PRIVAT);
  },

  // ---------------- admin ----------------
  "GET /api/admin/portal": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const q = new URL(req.url).searchParams, tipe = q.get("tipe") || "ajuan", status = q.get("status") || "baru";
    if (!["klaim", "ajuan", "wilayah"].includes(tipe) || !["baru", "setuju", "tolak"].includes(status)) return gagal("masukan_salah", 422);
    const r = await hak.orgAntrean(env, akun, tipe, status, q.get("hal") ?? 1);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/admin/portal/:tipe/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!["klaim", "ajuan", "wilayah"].includes(p.params.tipe) || !RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 2048);
    const catatan = teks(b.catatan, 500);
    if (!["setuju", "tolak"].includes(b.aksi) || (b.aksi === "tolak" && !catatan)) return gagal("masukan_salah", 422);
    const r = await hak.orgPutus(env, akun, p.params.tipe, p.params.id, b.aksi, catatan);
    if (!r) return NONAKTIF();
    return r.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
};
