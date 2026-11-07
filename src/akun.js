// akun.js: rute admin akun (JM-B05, sisi Worker). Semua tulis lewat hak.tulis (daftar putih, jejak satu batch, aturan super).
// Aktivasi, ganti sandi, masuk/keluar ada di sesi.js. Rute jejak di jejak.js, digabung di sini agar worker.js cukup mengimpor satu.
import * as hak from "./hak.js";
import { acak, bacaBody, gagal, ipHash, json, perlu, PRIVAT, RE_EMAIL, sha } from "./util.js";
import { rute as ruteJejak } from "./jejak.js";

const ADM = ["admin", "super"];
const PERAN_AKUN = ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"];
const STATUS = ["menunggu", "aktif", "nonaktif"];
const BERLAKU = 72 * 3600;
const RE_PROV = /^\d{2}$/;

const ip = (env, req) => ipHash(env, req).catch(() => null);

// Token acak 32 byte; hanya SHA-256-nya disimpan. Tautan hanya ada di respons ini, tidak dicatat di mana pun.
async function tautanBaru(req) {
  const token = acak(32);
  const sampai = Math.floor(Date.now() / 1000) + BERLAKU;
  return { hash: await sha(token), sampai, tautan: `${new URL(req.url).origin}/aktivasi?token=${token}` };
}

export const rute = {
  ...ruteJejak,

  // GET /api/admin/akun?cari&peran&status&hal   (daftar tanpa kolom rahasia; Admin tak melihat akun super: klausa bukan-super)
  "GET /api/admin/akun": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const q = new URL(req.url).searchParams;
    const where = {};
    if (q.get("peran")) { if (!PERAN_AKUN.includes(q.get("peran"))) return gagal("masukan_salah", 422); where.peran = q.get("peran"); }
    if (q.get("status")) { if (!STATUS.includes(q.get("status"))) return gagal("masukan_salah", 422); where.status = q.get("status"); }
    const hal = Number(q.get("hal") ?? 1);
    const kueri = { where, urut: "-dibuat", hal };
    if (q.get("cari")) kueri.cari = { kolom: ["surel", "nama"], teks: q.get("cari") };
    return json({ akun: await hak.baca(env, akun, "akun", kueri), hal }, 200, PRIVAT);
  },

  // POST /api/admin/akun {surel, nama, peran, cakupan_prov?}: akun 'menunggu' + tautan aktivasi SEKALI.
  "POST /api/admin/akun": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const b = await bacaBody(req);
    const surel = typeof b.surel === "string" ? b.surel.trim().toLowerCase() : "";
    if (!RE_EMAIL.test(surel) || surel.length < 5 || surel.length > 120) return gagal("masukan_salah", 422);
    if (typeof b.nama !== "string" || !b.nama.trim() || b.nama.length > 120) return gagal("masukan_salah", 422);
    if (!PERAN_AKUN.includes(b.peran)) return gagal("masukan_salah", 422);
    const prov = b.cakupan_prov ?? null;
    if ((b.peran === "wilayah") !== (prov !== null) || (prov !== null && !RE_PROV.test(String(prov)))) return gagal("masukan_salah", 422);
    const t = await tautanBaru(req);
    const data = { surel, nama: b.nama.trim(), peran: b.peran };
    if (prov !== null) data.cakupan_prov = String(prov);
    const { id } = await hak.tulis(env, akun, "akun", "tambah", data, null, { aktivasi_hash: t.hash, aktivasi_sampai: t.sampai, ipHash: await ip(env, req) });
    return json({ id, tautan_aktivasi: t.tautan, berlaku_sampai: t.sampai }, 201, PRIVAT);
  },

  // PATCH /api/admin/akun/:id {nama?, peran?, cakupan_prov?, status?}; nonaktif mencabut semua sesi dalam batch yang sama.
  "PATCH /api/admin/akun/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const b = await bacaBody(req);
    if (b.status !== undefined && !STATUS.includes(b.status)) return gagal("masukan_salah", 422);
    await hak.tulis(env, akun, "akun", "ubah", b, p.params.id, { ipHash: await ip(env, req) });
    return json({ ok: true }, 200, PRIVAT);
  },

  // POST /api/admin/akun/:id/aktivasi: tautan baru (aktivasi ulang / reset sandi), sekali tampil, 72 jam.
  "POST /api/admin/akun/:id/aktivasi": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const t = await tautanBaru(req);
    await hak.tulis(env, akun, "akun", "ubah", {}, p.params.id, { aktivasi_hash: t.hash, aktivasi_sampai: t.sampai, jejakKe: { tautan: "baru" }, ipHash: await ip(env, req) });
    return json({ tautan_aktivasi: t.tautan, berlaku_sampai: t.sampai }, 200, PRIVAT);
  },

  // DELETE /api/admin/akun/:id/sesi: cabut semua sesi akun itu.
  "DELETE /api/admin/akun/:id/sesi": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    await hak.tulis(env, akun, "sesi", "cabut", {}, p.params.id, { ipHash: await ip(env, req) });
    return json({ ok: true }, 200, PRIVAT);
  },
};
