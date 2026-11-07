// pesan.js: chat akun ke admin (migrasi 0016). Akun hanya melihat utasnya sendiri; admin dan super melihat semua. D1 hanya lewat hak.js.
// Lampiran (gambar/PDF, maks 5 MB, jenis dari magic byte, bukan dari klien) disimpan di R2 BERKAS kunci pesan/<utas>/<pesan> dan hanya keluar lewat rute berautentikasi.
import * as hak from "./hak.js";
import { acak, bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const RE_ID = /^[0-9a-f]{16}$/;
const KONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/; // baris baru dan tab boleh
const MAKS_LAMPIRAN = 5 * 1024 * 1024;
const BATAS_KIRIM_JAM = 20, BATAS_UTAS_HARI = 5;

// Jenis sah dari byte awal. SVG sengaja tidak ada (skrip tertanam).
export const sniff = (b) => {
  const h = (...x) => x.every((v, i) => b[i] === v);
  if (h(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (h(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (h(0x47, 0x49, 0x46, 0x38) && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return "image/gif";
  if (h(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (h(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  return null;
};
const EKSTENSI = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "application/pdf": "pdf" };
export const namaAman = (n) => String(n || "").split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f"<>:*?|]/g, "").trim().slice(0, 80) || "lampiran";

// Badan: multipart (isi, topik?, utas?, berkas?) atau JSON tanpa berkas. Mengembalikan { f: {isi, topik, utas}, berkas: {data, tipe, nama} | null }.
async function bacaMasukan(req) {
  const ct = req.headers.get("content-type") || "";
  if (/^application\/json/i.test(ct)) return { f: await bacaBody(req, 8192), berkas: null };
  if (!/^multipart\/form-data/i.test(ct)) throw new Galat("masukan_salah", 415);
  if (Number(req.headers.get("content-length")) > MAKS_LAMPIRAN + 65536) throw new Galat("terlalu_besar");
  let fd;
  try { fd = await req.formData(); } catch { throw new Galat("masukan_salah"); }
  const f = { isi: fd.get("isi"), topik: fd.get("topik"), utas: fd.get("utas") };
  const b = fd.get("berkas");
  if (typeof b === "string") throw new Galat("masukan_salah", 415);
  if (b == null) return { f, berkas: null };
  if (b.size === 0) return { f, berkas: null };
  if (b.size > MAKS_LAMPIRAN) throw new Galat("terlalu_besar");
  const data = new Uint8Array(await b.arrayBuffer());
  const tipe = sniff(data);
  if (!tipe) throw new Galat("masukan_salah", 415);
  return { f, berkas: { data, tipe, nama: namaAman(b.name) } };
}

const isiSah = (v) => (typeof v === "string" && v.trim().length >= 1 && v.trim().length <= 2000 && !KONTROL.test(v) ? v.trim() : null);

// Simpan lampiran ke R2 lalu jalankan `tulis`; D1 gagal = objek dibuang (tanpa yatim).
export async function denganLampiran(env, berkas, kunci, tulis) {
  if (!berkas) return tulis(null);
  if (!env.BERKAS) throw new Galat("layanan");
  await env.BERKAS.put(kunci, berkas.data, { httpMetadata: { contentType: berkas.tipe } });
  const meta = { nama: berkas.nama, tipe: berkas.tipe, ukuran: berkas.data.length };
  try {
    const r = await tulis(meta);
    if (!r || r.ada === false) await env.BERKAS.delete(kunci).catch(() => {});
    return r;
  } catch (e) { await env.BERKAS.delete(kunci).catch(() => {}); throw e; }
}

async function layaniLampiran(env, utasId, pid, hasil) {
  const m = hasil?.lampiran;
  if (!m || !env.BERKAS) return gagal("tidak_ditemukan");
  const o = await env.BERKAS.get(`pesan/${utasId}/${pid}`);
  if (!o) return gagal("tidak_ditemukan");
  const gambar = m.tipe.startsWith("image/");
  const nama = `${namaAman(m.nama).replace(/[^A-Za-z0-9._ -]/g, "_")}`;
  return new Response(o.body, { status: 200, headers: { ...PRIVAT, "content-type": m.tipe, "content-disposition": `${gambar ? "inline" : "attachment"}; filename="${nama}"`, "content-security-policy": "default-src 'none'; sandbox", "x-content-type-options": "nosniff" } });
}

export const rute = {
  // Daftar utas milik akun yang masuk.
  "GET /api/pesan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.pesanDaftarSaya(env, akun);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  // Utas milik sendiri + semua pesannya; menandai balasan admin sebagai dibaca. Milik akun lain = 404.
  "GET /api/pesan/:id": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const r = await hak.pesanBuka(env, akun, p.params.id);
    if (!r) return NONAKTIF();
    return r.utas ? json(r, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  // Utas baru (topik) atau pesan tambahan (utas = id utas milik sendiri).
  "POST /api/pesan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if ((await hak.catatLaju(env, "koreksi:ps" + akun.id, 3600)) > BATAS_KIRIM_JAM) return gagal("laju_terlampaui");
    const { f, berkas } = await bacaMasukan(req);
    const isi = isiSah(f.isi), utasId = f.utas == null || f.utas === "" ? null : f.utas;
    if (!isi || (utasId && !RE_ID.test(utasId)) || (!utasId && !hak.TOPIK_PESAN.includes(f.topik))) return gagal("masukan_salah", 422);
    if (!utasId && (await hak.catatLaju(env, "koreksi:pu" + akun.id, 86400)) > BATAS_UTAS_HARI) return gagal("laju_terlampaui");
    const uid = utasId || acak(8), pid = acak(8);
    const r = await denganLampiran(env, berkas, `pesan/${uid}/${pid}`, (lampiran) => hak.pesanKirim(env, akun, { utasId, uid, topik: f.topik, isi, lampiran, pid }));
    if (!r) return NONAKTIF();
    return r.ada ? json({ utas_id: r.utas_id, id: r.id }, 201, PRIVAT) : gagal("tidak_ditemukan");
  },

  "GET /api/pesan/:id/berkas/:pid": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id) || !RE_ID.test(p.params.pid)) return gagal("tidak_ditemukan");
    const r = await hak.pesanLampiran(env, akun, p.params.id, p.params.pid);
    return r ? layaniLampiran(env, p.params.id, p.params.pid, r) : NONAKTIF();
  },

  // ---------------- admin ----------------
  "GET /api/admin/pesan-belum": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const n = await hak.pesanBelumAdmin(env, akun);
    return n == null ? NONAKTIF() : json({ belum: n }, 200, PRIVAT);
  },

  "GET /api/admin/pesan": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const q = new URL(req.url).searchParams;
    const status = q.get("status") || undefined, topik = q.get("topik") || undefined;
    if ((status && !hak.STATUS_PESAN.includes(status)) || (topik && !hak.TOPIK_PESAN.includes(topik))) return gagal("masukan_salah", 422);
    const r = await hak.pesanAdminDaftar(env, akun, { status, topik, hal: q.get("hal") ?? 1 });
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "GET /api/admin/pesan/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const r = await hak.pesanBuka(env, akun, p.params.id, { admin: true });
    if (!r) return NONAKTIF();
    return r.utas ? json(r, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  "POST /api/admin/pesan/:id/balas": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const { f, berkas } = await bacaMasukan(req);
    const isi = isiSah(f.isi);
    if (!isi) return gagal("masukan_salah", 422);
    const pid = acak(8);
    const r = await denganLampiran(env, berkas, `pesan/${p.params.id}/${pid}`, (lampiran) => hak.pesanAdminBalas(env, akun, p.params.id, { pid, isi, lampiran }));
    if (!r) return NONAKTIF();
    return r.ada ? json({ id: r.id }, 201, PRIVAT) : gagal("tidak_ditemukan");
  },

  "POST /api/admin/pesan/:id/status": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 512);
    if (!["baru", "selesai"].includes(b.status)) return gagal("masukan_salah", 422);
    const r = await hak.pesanAdminStatus(env, akun, p.params.id, b.status);
    if (!r) return NONAKTIF();
    return r.ada ? json({ ok: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  "GET /api/admin/pesan/:id/berkas/:pid": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id) || !RE_ID.test(p.params.pid)) return gagal("tidak_ditemukan");
    const r = await hak.pesanLampiran(env, akun, p.params.id, p.params.pid, { admin: true });
    return r ? layaniLampiran(env, p.params.id, p.params.pid, r) : NONAKTIF();
  },
};
