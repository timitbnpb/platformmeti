// jejaring.js (F65-210, F65-211, migrasi 0040): program mentor dan forum per bidang. Rute tipis: validasi bentuk, batas laju, lalu hak.js (satu-satunya pintu D1).
// Mentor: daftar dan permintaan masuk antrean Kiriman admin (jenis 'mentor' dan 'minta' di /api/admin/kiriman); tarik lewat DELETE /api/kiriman/:jenis/:id.
// Forum: teks polos, langsung tampil bagi akun masuk; sembunyi hanya admin dan super, alasannya tercatat di jejak.
import * as hak from "./hak.js";
import { hanyaKunci, pilih, teks } from "./portal.js";
import { bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const SALAH = () => new Galat("masukan_salah", 422);
const RE_ID = /^\d{1,12}$/;
const laju = async (env, kunci, akun, n) => (await hak.catatLaju(env, "koreksi:" + kunci + akun.id, 3600)) > n;
const wajib = (v, min, maks, baris = true) => { const s = teks(v, maks, { baris, wajib: true }); if (s.length < min) throw SALAH(); return s; };
const hasilBuat = (r) => (!r ? NONAKTIF() : r.id ? json({ id: r.id }, 201, PRIVAT) : gagal("konflik"));

/** Murni (diekspor untuk uji). teks() portal menolak surel, telepon, dan karakter kontrol; HTML tidak dibuang karena disimpan dan ditampilkan sebagai teks. */
export function periksaMentor(b) { hanyaKunci(b, ["bidang", "uraian"]); return { bidang: pilih(b.bidang, hak.BIDANG_METI), uraian: wajib(b.uraian, 20, 600) }; }
export function periksaUtas(b) { hanyaKunci(b, ["bidang", "judul", "isi"]); return { bidang: pilih(b.bidang, hak.BIDANG_METI), judul: wajib(b.judul, 5, 160, false), isi: wajib(b.isi, 10, 4000) }; }

export const rute = {
  /* ---------- mentor ---------- */
  // Mentor yang sudah disetujui admin: nama, bidang, uraian. Tidak ada surel atau telepon.
  "GET /api/mentor": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.mentorDaftar(env, akun);
    return r ? json({ baris: r, bidang: hak.BIDANG_METI }, 200, PRIVAT) : NONAKTIF();
  },

  // Daftar sebagai mentor {bidang, uraian}: masuk antrean admin. Satu pendaftaran aktif per akun (409 bila sudah ada).
  "POST /api/mentor": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = periksaMentor(await bacaBody(req, 4096));
    if (await laju(env, "mt", akun, 20)) return gagal("laju_terlampaui"); // kunci sendiri: tidak berbagi jatah dengan kiriman foto, hijau, dana
    return hasilBuat(await hak.kirimanBuat(env, akun, "mentor", d));
  },

  // Minta mentor {pesan}: masuk antrean admin; mentor baru melihatnya sesudah disetujui. Mentor belum disetujui, diri sendiri, atau permintaan ganda = 409.
  "POST /api/mentor/:id/minta": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 4096);
    hanyaKunci(b, ["pesan"]);
    const pesan = wajib(b.pesan, 20, 600);
    if (await laju(env, "mt", akun, 20)) return gagal("laju_terlampaui");
    return hasilBuat(await hak.kirimanBuat(env, akun, "minta", { mentor_id: Number(p.params.id), pesan }));
  },

  // Permintaan yang ditujukan kepada saya sebagai mentor (hanya yang sudah disetujui admin): nama peminta dan pesan.
  "GET /api/mentor/permintaan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.mentorPermintaan(env, akun);
    return r ? json({ baris: r }, 200, PRIVAT) : NONAKTIF();
  },

  /* ---------- forum per bidang ---------- */
  // ?bidang=<slug>&hal=<n>: utas terbaru dulu, berpaginasi. Yang disembunyikan tidak keluar ke non-admin.
  "GET /api/forum": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const q = new URL(req.url).searchParams;
    if (!hak.BIDANG_METI.includes(q.get("bidang"))) return gagal("masukan_salah", 422);
    const r = await hak.forumDaftar(env, akun, q.get("bidang"), q.get("hal") ?? 1);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "GET /api/forum/utas/:id": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.forumUtas(env, akun, p.params.id);
    if (r === null) return NONAKTIF();
    return r ? json(r, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  "POST /api/forum": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = periksaUtas(await bacaBody(req, 16384));
    if (await laju(env, "fu", akun, 10)) return gagal("laju_terlampaui");
    return hasilBuat(await hak.forumUtasBaru(env, akun, d.bidang, d.judul, d.isi));
  },

  // Balasan {isi}. Utas tidak ada atau disembunyikan = 404.
  "POST /api/forum/utas/:id/balasan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 8192);
    hanyaKunci(b, ["isi"]);
    const isi = wajib(b.isi, 2, 2000);
    if (await laju(env, "fb", akun, 30)) return gagal("laju_terlampaui");
    const r = await hak.forumBalas(env, akun, p.params.id, isi);
    if (!r) return NONAKTIF();
    return r.id ? json({ id: r.id }, 201, PRIVAT) : gagal("tidak_ditemukan");
  },

  // Laporkan {jenis: utas | balasan, id, alasan}. Satu laporan per akun per sasaran; laporan ulang tetap 200.
  "POST /api/forum/lapor": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 2048);
    hanyaKunci(b, ["jenis", "id", "alasan"]);
    const jenis = pilih(b.jenis, ["utas", "balasan"]), alasan = wajib(b.alasan, 5, 300, false);
    if (!Number.isInteger(b.id) || b.id < 1) throw SALAH();
    if (await laju(env, "fl", akun, 20)) return gagal("laju_terlampaui");
    const r = await hak.forumLapor(env, akun, jenis, b.id, alasan);
    if (!r) return NONAKTIF();
    return r.ada ? json({ ok: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  /* ---------- admin ---------- */
  "GET /api/admin/forum/laporan": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const r = await hak.forumLaporan(env, akun, new URL(req.url).searchParams.get("hal") ?? 1);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  // {jenis, id, sembunyi: boolean, alasan}: alasan wajib saat menyembunyikan dan dicatat di jejak. Tidak berubah (sudah dalam keadaan itu atau tidak ada) = 409.
  "POST /api/admin/forum/sembunyi": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const b = await bacaBody(req, 2048);
    hanyaKunci(b, ["jenis", "id", "sembunyi", "alasan"]);
    const jenis = pilih(b.jenis, ["utas", "balasan"]), alasan = teks(b.alasan, 500);
    if (!Number.isInteger(b.id) || b.id < 1 || typeof b.sembunyi !== "boolean" || (b.sembunyi && (!alasan || alasan.length < 3))) throw SALAH();
    const r = await hak.forumSembunyi(env, akun, jenis, b.id, b.sembunyi, alasan);
    if (!r) return NONAKTIF();
    return r.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
};
