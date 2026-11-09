// roadmap.js: suka + komentar per program peta jalan (migrasi 0035). Semua rute menagih sesi; D1 hanya lewat hak.js.
import * as hak from "./hak.js";
import { bacaBody, gagal, json, perlu, PRIVAT } from "./util.js";

const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const atau503 = (r, s = 200) => (r ? json(r, s, PRIVAT) : NONAKTIF());

export const rute = {
  "GET /api/roadmap/ringkas": async (req, env, ctx, p) => atau503(await hak.roadmapRingkas(env, perlu(p))),
  "GET /api/roadmap/komentar": async (req, env, ctx, p) => atau503(await hak.roadmapKomentarDaftar(env, perlu(p), new URL(req.url).searchParams.get("program"))),
  "POST /api/roadmap/suka": async (req, env, ctx, p) => {
    const akun = perlu(p), b = await bacaBody(req, 256);
    return atau503(await hak.roadmapSuka(env, akun, b.program));
  },
  "POST /api/roadmap/komentar": async (req, env, ctx, p) => {
    const akun = perlu(p), b = await bacaBody(req, 8000);
    const r = await hak.roadmapKomentarBaru(env, akun, b.program, b.isi);
    return r ? json({ id: r.id }, 201, PRIVAT) : NONAKTIF();
  },
  "DELETE /api/roadmap/komentar/:id": async (req, env, ctx, p) => {
    const r = await hak.roadmapKomentarSembunyi(env, perlu(p), p.params.id);
    if (!r) return NONAKTIF();
    return r.ubah ? json({ ubah: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },
};
