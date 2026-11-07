// jejak.js: pembentuk isi jejak (murni, tanpa D1) + rute baca jejak untuk Admin (JM-B07).
// Penulisan jejak terjadi di hak.js, dalam batch yang SAMA dengan tulisan datanya (DT 3.2, 5.4).
// Aturan isi: (a) kolom rahasia tak pernah masuk dari/ke; (b) entitas berjenis orang hanya nama kolom.
import { baca, boleh, Galat } from "./hak.js";
import { json, gagal } from "./util.js";

export { susunJejak } from "./hak.js";

const RE_TABEL = /^[a-z_]{1,40}$/;

export const rute = {
  // GET /api/admin/jejak?tabel&baris&hal   (ADM)
  "GET /api/admin/jejak": async (req, env, ctx, p) => {
    const akun = p?.akun;
    if (!akun) return gagal("belum_masuk", 401);
    if (!boleh(akun.peran, "baca", "jejak", undefined, akun).ok) return gagal("dilarang", 403);
    const q = new URL(req.url).searchParams;
    const where = {};
    const tabel = q.get("tabel");
    const baris = q.get("baris");
    if (tabel) { if (!RE_TABEL.test(tabel)) return gagal("masukan_salah", 422); where.tabel = tabel; }
    if (baris) { if (baris.length > 80) return gagal("masukan_salah", 422); where.baris_id = baris; }
    const hal = Math.min(Math.max(parseInt(q.get("hal") ?? "1", 10) || 1, 1), 10000);
    try {
      const jejak = await baca(env, akun, "jejak", { where, urut: "-id", hal });
      return json({ jejak, hal }, 200, { "cache-control": "private, no-store", vary: "Cookie" });
    } catch (e) {
      if (e instanceof Galat) return gagal(e.kode, e.status);
      throw e;
    }
  },
};
