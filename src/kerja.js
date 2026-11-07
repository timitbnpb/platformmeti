// kerja.js: Green jobs /kerja. Lowongan dari organisasi anggota (akun terhubung) -> antrean admin -> tampil bila terbit (migrasi 0028).
// Lowongan hasil panen halaman karir resmi = potret statis /data/kerja.json (bukan lewat sini). D1 hanya lewat hak.js.
import * as hak from "./hak.js";
import { hanyaKunci, pilih, teks, url } from "./portal.js";
import { bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const RE_ID = /^\d{1,12}$/, RE_REF = /^[A-Za-z0-9_-]{2,60}$/, RE_TGL = /^\d{4}-\d{2}-\d{2}$/;
const SALAH = () => new Galat("masukan_salah", 422);

/** Murni (diekspor untuk uji): { organisasiId, judul, kodeProv, lokasi, teknologi, jenjang, deskripsi, tautan, batas } atau 422. */
export function periksaLowongan(b, hariIni = new Date().toISOString().slice(0, 10)) {
  hanyaKunci(b, ["organisasi_id", "judul", "kode_prov", "lokasi", "teknologi", "jenjang", "deskripsi", "tautan", "batas"]);
  const organisasiId = teks(b.organisasi_id, 60, { wajib: true });
  if (!RE_REF.test(organisasiId)) throw SALAH();
  const kodeProv = teks(b.kode_prov, 2);
  if (kodeProv && !/^\d{2}$/.test(kodeProv)) throw SALAH();
  const batas = teks(b.batas, 10);
  if (batas && (!RE_TGL.test(batas) || Number.isNaN(Date.parse(batas)) || batas < hariIni)) throw SALAH();
  return {
    organisasiId, judul: teks(b.judul, 160, { wajib: true }), kodeProv, lokasi: teks(b.lokasi, 80),
    teknologi: pilih(b.teknologi, hak.TEK_KERJA), jenjang: pilih(b.jenjang, hak.JENJANG_KERJA),
    deskripsi: teks(b.deskripsi, 1500, { baris: true }), tautan: url(b.tautan, 600, { wajib: true }), batas,
  };
}

// Nama resmi organisasi dari potret (satu fetch per POST, bukan per baca). Id tak dikenal = 422.
async function namaOrganisasi(env, req, id) {
  let res;
  try { res = await env.ASSETS.fetch(new Request(new URL("/data/organisasi.json", req.url))); } catch { throw new Galat("layanan"); }
  if (!res.ok) throw new Galat("layanan");
  let d;
  try { d = await res.json(); } catch { throw new Galat("layanan"); }
  const o = Array.isArray(d?.baris) ? d.baris.find((x) => x?.id === id) : null;
  if (!o || typeof o.nama !== "string") throw SALAH();
  return o.nama.slice(0, 160);
}

export const rute = {
  // Lowongan terbit dari anggota (semua akun masuk boleh melihat).
  "GET /api/kerja": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.kerjaTerbit(env, akun);
    return r ? json({ baris: r }, 200, PRIVAT) : NONAKTIF();
  },

  "GET /api/kerja/saya": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.kerjaSaya(env, akun);
    return r ? json({ baris: r }, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/kerja": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = periksaLowongan(await bacaBody(req, 8192));
    if ((await hak.catatLaju(env, "koreksi:kj" + akun.id, 3600)) > 10) return gagal("laju_terlampaui");
    if (!(await hak.orgTerhubung(env, akun, d.organisasiId))) return gagal("dilarang"); // cek dini sebelum fetch potret
    d.organisasiNama = await namaOrganisasi(env, req, d.organisasiId);
    const r = await hak.kerjaPasang(env, akun, d);
    return r ? json({ id: r.id }, 201, PRIVAT) : NONAKTIF();
  },

  // ---------------- admin ----------------
  "GET /api/admin/kerja": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const q = new URL(req.url).searchParams, status = q.get("status") || "menunggu";
    if (!["menunggu", "terbit", "tolak"].includes(status)) return gagal("masukan_salah", 422);
    const r = await hak.kerjaAntrean(env, akun, status, q.get("hal") ?? 1);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/admin/kerja/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 2048);
    const catatan = teks(b.catatan, 500);
    if (!["terbit", "tolak"].includes(b.aksi) || (b.aksi === "tolak" && !catatan)) return gagal("masukan_salah", 422);
    const r = await hak.kerjaPutus(env, akun, p.params.id, b.aksi, catatan);
    if (!r) return NONAKTIF();
    return r.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
};
