// surel.js: permintaan alamat surel @metiires.or.id (migrasi 0030). Akun masuk mengajukan; admin memutus lalu menandai "dibuat"
// setelah kotak dibuat MANUAL di penyedia (tanpa API penyedia, tanpa sandi). D1 hanya lewat hak.js.
import * as hak from "./hak.js";
import { hanyaKunci, teks } from "./portal.js";
import { bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const RE_ID = /^\d{1,12}$/;
const SALAH = () => new Galat("masukan_salah", 422);

// Nama lokal dari klien: dikecilkan dan dipangkas; bentuk akhir wajib lolos hak.periksaNamaSurel (murni, diuji).
const nama = (v, wajib) => {
  if (v == null || v === "") { if (wajib) throw SALAH(); return null; }
  if (typeof v !== "string") throw SALAH();
  const s = v.trim().toLowerCase();
  if (hak.periksaNamaSurel(s) !== "ok") throw SALAH();
  return s;
};

/** Murni (diekspor untuk uji): { nama, alt1, alt2, alasan, organisasi } atau 422. */
export function periksaPermintaan(b) {
  hanyaKunci(b, ["nama", "alt1", "alt2", "alasan", "organisasi"]);
  const d = { nama: nama(b.nama, true), alt1: nama(b.alt1), alt2: nama(b.alt2),
    alasan: teks(b.alasan, 300, { wajib: true }), organisasi: teks(b.organisasi, 120, { wajib: true }) };
  const unik = [d.nama, d.alt1, d.alt2].filter(Boolean);
  if (new Set(unik).size !== unik.length || d.alasan.length < 3 || d.organisasi.length < 2) throw SALAH();
  return d;
}

export const rute = {
  "GET /api/surel/cek": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const n = (new URL(req.url).searchParams.get("nama") || "").trim().toLowerCase();
    const r = await hak.surelCek(env, akun, n);
    return r === null ? NONAKTIF() : json({ hasil: r }, 200, PRIVAT);
  },

  "GET /api/surel/saya": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.surelSaya(env, akun);
    return r ? json({ baris: r, domain: hak.DOMAIN_SUREL }, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/surel": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = periksaPermintaan(await bacaBody(req, 4096));
    if ((await hak.catatLaju(env, "koreksi:sr" + akun.id, 3600)) > 10) return gagal("laju_terlampaui");
    const r = await hak.surelMinta(env, akun, d);
    if (!r) return NONAKTIF();
    return r.id ? json({ id: r.id }, 201, PRIVAT) : gagal("konflik");
  },

  // ---------------- admin ----------------
  "GET /api/admin/surel": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const q = new URL(req.url).searchParams, status = q.get("status") || "diajukan";
    if (!["diajukan", "disetujui", "ditolak", "dibuat"].includes(status)) return gagal("masukan_salah", 422);
    const r = await hak.surelAntrean(env, akun, status, q.get("hal") ?? 1);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/admin/surel/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 2048);
    hanyaKunci(b, ["aksi", "alamat", "catatan"]);
    const catatan = teks(b.catatan, 500);
    if (!["setuju", "tolak", "dibuat"].includes(b.aksi) || (b.aksi === "tolak" && !catatan)) return gagal("masukan_salah", 422);
    const alamat = b.aksi === "setuju" ? nama(b.alamat, true) : null;
    const r = await hak.surelPutus(env, akun, p.params.id, b.aksi, { alamat, catatan });
    if (!r) return NONAKTIF();
    return r.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
};
