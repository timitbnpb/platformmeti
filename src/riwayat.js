// riwayat.js: Riwayat dengan METI (JM-S07, DT 4.3, KP C-17). Lapis pengurus: PG, AD, SA saja.
// D1 hanya lewat hak.baca/hak.tulis; `oleh` dari sesi (OTOMATIS_TAMBAH) dan tidak pernah dikirim ke klien, hanya `milik`.
import * as hak from "./hak.js";
import { tglSah, teksBersih } from "./agenda.js";
import { bacaBody, gagal, json, perlu, PRIVAT } from "./util.js";

const AKSES = ["pengurus", "admin", "super"];
const JENIS = ["undangan", "narasumber", "audiensi", "mou", "sponsor", "kegiatan", "kerja-sama", "keanggotaan", "lainnya"];
const RE_ID = /^\d{1,12}$/;
const RE_REF = /^[a-zA-Z0-9_.:-]{1,80}$/;
const BATAS_LAJU = 300;
const KOLOM = ["id", "target_id", "jenis", "tanggal", "tanggal_selesai", "judul", "kegiatan_ref", "catatan", "penilaian", "oleh", "dibuat", "diubah"];

// Aksi laju dibatasi CHECK tabel laju (migrasi 0006), jadi aksi "kurasi" dipakai dengan nilai berawalan "rw": hitungan terpisah dari modul kurasi lain.
const lajuLewat = async (env, akun) => (await hak.catatLaju(env, "kurasi:rw" + akun.id)) > BATAS_LAJU;
const keluar = (akun) => ({ oleh, ...r }) => ({ ...r, milik: oleh === akun.id });

// Validasi; `lama` null = tambah (lengkap), objek = ubah sebagian digabung dengan baris lama. Null bila salah. Sama dengan CHECK tabel riwayat.
function cek(b, lama) {
  const KUNCI = ["jenis", "tanggal", "tanggal_selesai", "judul", "kegiatan_ref", "catatan", "penilaian", ...(lama ? [] : ["target_id"])];
  if (!b || Object.keys(b).some((k) => !KUNCI.includes(k))) return null;
  const d = {};
  if ("target_id" in b) { if (!Number.isInteger(b.target_id) || b.target_id < 1) return null; d.target_id = b.target_id; }
  if ("jenis" in b) { if (!JENIS.includes(b.jenis)) return null; d.jenis = b.jenis; }
  if ("tanggal" in b) { if (!tglSah(b.tanggal)) return null; d.tanggal = b.tanggal; }
  if ("tanggal_selesai" in b) { if (b.tanggal_selesai !== null && !tglSah(b.tanggal_selesai)) return null; d.tanggal_selesai = b.tanggal_selesai; }
  if ("judul" in b) { if (typeof b.judul !== "string" || !teksBersih(b.judul) || b.judul.trim().length < 1 || b.judul.trim().length > 200) return null; d.judul = b.judul.trim(); }
  if ("kegiatan_ref" in b) { if (b.kegiatan_ref !== null && !(typeof b.kegiatan_ref === "string" && RE_REF.test(b.kegiatan_ref))) return null; d.kegiatan_ref = b.kegiatan_ref; }
  if ("catatan" in b) { if (b.catatan !== null && (typeof b.catatan !== "string" || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(b.catatan) || b.catatan.length > 2000)) return null; d.catatan = b.catatan === "" ? null : b.catatan; }
  if ("penilaian" in b) { if (b.penilaian !== null && !(Number.isInteger(b.penilaian) && b.penilaian >= 1 && b.penilaian <= 5)) return null; d.penilaian = b.penilaian; }
  if (!lama && (!d.target_id || !d.jenis || !d.tanggal || !d.judul)) return null;
  if (!Object.keys(d).length) return null;
  const akhir = { ...(lama ?? {}), ...d };
  if (akhir.tanggal_selesai != null && akhir.tanggal_selesai < akhir.tanggal) return null;
  return d;
}

// Baris yang boleh diubah/dihapus menurut hak.boleh (sel PG riwayat berklausa milik, AD/SA semua). null = tidak ada atau bukan haknya (404 seragam).
async function barisSendiri(env, akun, id) {
  if (!RE_ID.test(id)) return null;
  const r = (await hak.baca(env, akun, "riwayat", { where: { id: Number(id) } }))[0];
  return r && hak.boleh(akun.peran, "ubah", "riwayat", r, akun).ok ? r : null;
}

export const rute = {
  "GET /api/riwayat": async (req, env, ctx, p) => {
    const akun = perlu(p, AKSES);
    const q = new URL(req.url).searchParams, target = q.get("target") ?? "", hal = q.get("hal") ?? "1";
    if (!RE_ID.test(target) || !RE_ID.test(hal)) return gagal("masukan_salah");
    const r = await hak.baca(env, akun, "riwayat", { where: { target_id: Number(target) }, urut: "-tanggal", hal: Number(hal) || 1, kolom: KOLOM });
    return json({ riwayat: r.map(keluar(akun)), hal: Number(hal) || 1 }, 200, PRIVAT);
  },

  "POST /api/riwayat": async (req, env, ctx, p) => {
    const akun = perlu(p, AKSES);
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const d = cek(await bacaBody(req), null);
    if (!d) return gagal("masukan_salah");
    const t = (await hak.baca(env, akun, "entitas", { where: { id: d.target_id }, kolom: ["id", "jenis"] }))[0];
    if (!t || !["orang", "lembaga"].includes(t.jenis)) return gagal("masukan_salah");
    const { id } = await hak.tulis(env, akun, "riwayat", "tambah", d);
    return json({ id }, 201, PRIVAT);
  },

  "PATCH /api/riwayat/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, AKSES);
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const lama = await barisSendiri(env, akun, p.params.id);
    if (!lama) return gagal("tidak_ditemukan");
    const d = cek(await bacaBody(req), lama);
    if (!d) return gagal("masukan_salah");
    await hak.tulis(env, akun, "riwayat", "ubah", d, lama.id);
    return json({ ok: true }, 200, PRIVAT);
  },

  "DELETE /api/riwayat/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, AKSES);
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const lama = await barisSendiri(env, akun, p.params.id);
    if (!lama) return gagal("tidak_ditemukan");
    await hak.tulis(env, akun, "riwayat", "hapus", {}, lama.id);
    return json({ ok: true }, 200, PRIVAT);
  },
};
