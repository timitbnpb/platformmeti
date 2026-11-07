// kta.js: Kartu Tanda Anggota virtual METI (migrasi 0017). D1 hanya lewat hak.js; foto dan bukti di R2 (kta/..., tidak pernah di repo atau public/).
// Verifikasi publik (/api/kta/verifikasi/:token) terbuka tanpa sesi dan hanya mengembalikan nama, jenis, status, dan masa berlaku.
import * as hak from "./hak.js";
import { gabungAnggota } from "./direktori.js";
import { acak, bacaBody, Galat, gagal, ipHash, json, perlu, PRIVAT, samaTetap } from "./util.js";

const ADM = ["admin", "super"];
const RE_ID = /^\d{1,9}$/;
const RE_TOKEN = /^(\d{1,9})\.([0-9a-f]{32})$/;
const MAKS_FOTO = 400 * 1024, MAKS_BUKTI = 3 * 1024 * 1024;
const JENIS_DARI_ANGGOTA = { individu: "individu", utama: "utama", perusahaan: "biasa", organisasi: "biasa", koperasi: "biasa", "baru-registrasi": "individu" };

// Token verifikasi: <id>.<32 hex HMAC(id|nonce)>. Tanpa rahasia server: tidak ada token (layanan belum siap).
const heksa = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function tokenKta(env, id, nonce) {
  const r = env.KTA_RAHASIA || env.ICS_RAHASIA || env.IP_SALT;
  if (!r) throw new Galat("layanan");
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode("kta|" + r), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `${id}.${heksa(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${id}|${nonce}`))).slice(0, 32)}`;
}

// Laju memakai aksi 'koreksi' dengan awalan kunci sendiri (CHECK tabel laju 0006 tak diubah), jendela 1 jam.
const lajuLewat = async (env, kunci, batas) => (await hak.sistem.catatLaju(env, "koreksi:" + kunci, 3600)) > batas;
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);

// Basis anggota (R2 + log penyuntingan) -> baris. Hanya dibaca server; klien menerima kolom terpilih.
async function semuaAnggota(env, akun) {
  const o = env.BERKAS ? await env.BERKAS.get("potret/pengurus/anggota_meti.json").catch(() => null) : null;
  if (!o) throw new Galat("tidak_ditemukan");
  const d = await o.json();
  return gabungAnggota(Array.isArray(d) ? d : d.baris || [], (await hak.ktaAnggotaLog(env, akun)) ?? []);
}
const cariAnggota = async (env, akun, id) => (typeof id === "string" && id.length <= 80 ? (await semuaAnggota(env, akun)).find((r) => r.id === id) : null) ?? null;
const teks = (v, maks) => (typeof v === "string" && v.trim() && v.trim().length <= maks && !/[\u0000-\u001f\u007f]/.test(v) ? v.trim() : null);

// Tipe dari magic byte.
function tipe(b) {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ["image/jpeg", "jpg"];
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return ["image/png", "png"];
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return ["image/webp", "webp"];
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return ["application/pdf", "pdf"];
  return null;
}
async function bacaBiner(req, maks) {
  if (Number(req.headers.get("content-length")) > maks) throw new Galat("terlalu_besar");
  const bagian = [];
  let n = 0;
  if (req.body) {
    const rd = req.body.getReader();
    for (;;) {
      const { value, done } = await rd.read();
      if (done) break;
      n += value.length;
      if (n > maks) { rd.cancel().catch(() => {}); throw new Galat("terlalu_besar"); }
      bagian.push(value);
    }
  }
  const b = new Uint8Array(n);
  let p = 0;
  for (const x of bagian) { b.set(x, p); p += x.length; }
  return b;
}

// Bentuk yang boleh dilihat pemilik KTA (tanpa nonce dan kunci R2).
const bentukSaya = async (env, req, r) => {
  const publik = r.status !== "tertunda";
  const token = publik ? await tokenKta(env, r.id, r.nonce) : null;
  return {
    id: r.id, nomor_kta: r.nomor_kta, jenis: r.jenis, nama_cetak: r.nama_cetak, instansi: r.instansi, berlaku_sampai: r.berlaku_sampai,
    status: r.status_ef, tahun_masuk: r.tahun_masuk, ada_foto: !!r.foto_kunci, ada_bukti: !!r.bukti_kunci,
    url_verifikasi: token ? new URL("/kta/v/" + token, req.url).href : null,
  };
};

// Sel CSV: kutip ganda, awalan ' bila diawali = + - @ (injeksi rumus spreadsheet).
const sel = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
export function csvKta(baris) {
  const kepala = ["nomor_kta", "nama_cetak", "jenis", "instansi", "status", "berlaku_sampai", "tahun_masuk", "akun_nama", "akun_surel", "anggota_id"];
  return "﻿" + [kepala.map(sel).join(","), ...baris.map((b) => [b.nomor_kta, b.nama_cetak, b.jenis, b.instansi, b.status_ef, b.berlaku_sampai, b.tahun_masuk, b.akun_nama, b.akun_surel, b.anggota_id].map(sel).join(","))].join("\r\n") + "\r\n";
}

export const rute = {
  // KTA milik akun yang masuk; { kta: null } bila belum ada klaim atau penerbitan.
  "GET /api/kta/saya": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.ktaSaya(env, akun);
    if (r === null) return NONAKTIF();
    return json({ kta: r ? await bentukSaya(env, req, r) : null }, 200, PRIVAT);
  },

  // Pencarian nama untuk klaim: minimal 3 huruf, paling banyak 8 hasil, hanya nama + instansi + jenis (tanpa kontak).
  "GET /api/kta/anggota": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const q = (new URL(req.url).searchParams.get("cari") || "").trim().toLowerCase();
    if (q.length < 3 || q.length > 60) return json({ baris: [] }, 200, PRIVAT);
    if (await lajuLewat(env, "ka|" + akun.id, 90)) return gagal("laju_terlampaui");
    const baris = (await semuaAnggota(env, akun)).filter((r) => r.status !== "nonaktif" && String(r.nama || "").toLowerCase().includes(q)).slice(0, 8)
      .map((r) => ({ id: r.id, nama: r.nama, instansi: r.instansi || null, jenis: r.jenis || null }));
    return json({ baris }, 200, PRIVAT);
  },

  // Klaim keanggotaan: pilih nama dari basis; dibuat 'tertunda' menunggu admin.
  "POST /api/kta/klaim": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 2048);
    if (await lajuLewat(env, "kk|" + akun.id, 10)) return gagal("laju_terlampaui");
    const r = await cariAnggota(env, akun, b.anggota_id);
    if (!r || !teks(r.nama, 200)) return gagal("tidak_ditemukan");
    const hasil = await hak.ktaAjukan(env, akun, {
      anggotaId: r.id, nama: String(r.nama).trim().slice(0, 120), instansi: teks(r.instansi, 160), jenis: JENIS_DARI_ANGGOTA[r.jenis] ?? "individu",
      nonce: acak(8), ipHash: await ipHash(env, req),
    });
    return hasil ? json({ ok: true }, 201, PRIVAT) : NONAKTIF();
  },

  // Foto anggota (sudah dipotong persegi di klien): disimpan R2 kta/<id>.webp, hanya untuk KTA milik sendiri.
  "PUT /api/kta/foto": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!env.BERKAS) return gagal("layanan");
    const r = await hak.ktaSaya(env, akun);
    if (!r || r.status === "dicabut") return gagal("tidak_ditemukan");
    if (await lajuLewat(env, "kf|" + akun.id, 20)) return gagal("laju_terlampaui");
    const b = await bacaBiner(req, MAKS_FOTO), ty = tipe(b);
    if (!ty || ty[1] === "pdf") return gagal("masukan_salah", 422);
    const kunci = `kta/${r.id}.webp`;
    await env.BERKAS.put(kunci, b, { httpMetadata: { contentType: ty[0] } });
    await hak.ktaSetBerkas(env, akun, "foto_kunci", kunci);
    return json({ ok: true }, 200, PRIVAT);
  },
  "GET /api/kta/foto/:id": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id) || !env.BERKAS) return gagal("tidak_ditemukan");
    const r = await hak.ktaBaca(env, akun, Number(p.params.id));
    if (!r?.foto_kunci) return gagal("tidak_ditemukan");
    const o = await env.BERKAS.get(r.foto_kunci);
    if (!o) return gagal("tidak_ditemukan");
    return new Response(o.body, { headers: { "content-type": o.httpMetadata?.contentType || "image/webp", "x-content-type-options": "nosniff", ...PRIVAT } });
  },

  // Bukti klaim (opsional): gambar atau PDF, hanya selama klaim masih tertunda.
  "PUT /api/kta/bukti": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!env.BERKAS) return gagal("layanan");
    const r = await hak.ktaSaya(env, akun);
    if (!r || r.status !== "tertunda") return gagal("tidak_ditemukan");
    if (await lajuLewat(env, "kb|" + akun.id, 10)) return gagal("laju_terlampaui");
    const b = await bacaBiner(req, MAKS_BUKTI), ty = tipe(b);
    if (!ty) return gagal("masukan_salah", 422);
    const kunci = `kta/bukti/${r.id}.${ty[1]}`;
    await env.BERKAS.put(kunci, b, { httpMetadata: { contentType: ty[0] } });
    await hak.ktaSetBerkas(env, akun, "bukti_kunci", kunci);
    return json({ ok: true }, 200, PRIVAT);
  },

  // Verifikasi publik: tanpa sesi. Token salah atau klaim tertunda = 404 yang sama.
  "GET /api/kta/verifikasi/:token": async (req, env, ctx, p) => {
    if (await lajuLewat(env, "kv|" + (await ipHash(env, req)), 120)) return gagal("laju_terlampaui");
    const m = p.params.token.match(RE_TOKEN);
    if (!m) return gagal("tidak_ditemukan");
    const r = await hak.ktaPublik(env, Number(m[1]));
    if (r === null) return NONAKTIF();
    if (!r || !samaTetap(await tokenKta(env, r.id, r.nonce), p.params.token)) return gagal("tidak_ditemukan");
    return json({ nama: r.nama_cetak, jenis: r.jenis, status: r.status_ef, aktif: r.status_ef === "aktif", berlaku_sampai: r.berlaku_sampai }, 200, PRIVAT);
  },

  /* ---------- admin ---------- */
  // Daftar KTA + akun terkait; ?format=csv mengunduh (jejak 'kirim').
  "GET /api/admin/kta": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const csv = new URL(req.url).searchParams.get("format") === "csv";
    const baris = await hak.ktaDaftar(env, akun, { csv });
    if (baris === null) return NONAKTIF();
    if (csv) return new Response(csvKta(baris), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="kta-meti.csv"', "x-content-type-options": "nosniff", ...PRIVAT } });
    return json({ baris }, 200, PRIVAT);
  },

  // Terbitkan KTA untuk satu anggota (baru atau terbit ulang), opsional dikaitkan ke akun lewat surel.
  "POST /api/admin/kta": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const b = await bacaBody(req, 4096);
    const r = await cariAnggota(env, akun, b.anggota_id);
    if (!r) return gagal("tidak_ditemukan");
    const nama = b.nama === undefined ? String(r.nama || "").trim().slice(0, 120) : teks(b.nama, 120);
    const tahun = b.tahun_masuk === undefined ? undefined : b.tahun_masuk;
    if (!nama || (tahun !== undefined && !(Number.isInteger(tahun) && tahun >= 1999 && tahun <= 2100))
      || (b.akun_surel !== undefined && b.akun_surel !== null && !teks(b.akun_surel, 120))) return gagal("masukan_salah", 422);
    const h = await hak.ktaTerbit(env, akun, {
      anggotaId: r.id, jenis: b.jenis, nama, instansi: teks(r.instansi, 160), berlaku_sampai: b.berlaku_sampai, tahun_masuk: tahun,
      akunSurel: b.akun_surel || null, nonce: acak(8), ipHash: await ipHash(env, req),
    });
    return h ? json({ ok: true, id: h.id, nomor_kta: h.nomor_kta }, 201, PRIVAT) : NONAKTIF();
  },

  // Masa berlaku massal. Didaftarkan sebelum :id agar "masa" tak terbaca sebagai id.
  "POST /api/admin/kta/masa": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const b = await bacaBody(req, 1024);
    if (typeof b.berlaku_sampai !== "string" || (b.jenis != null && typeof b.jenis !== "string")) return gagal("masukan_salah", 422);
    const h = await hak.ktaMasa(env, akun, { berlaku_sampai: b.berlaku_sampai, jenis: b.jenis ?? null, ipHash: await ipHash(env, req) });
    return h ? json({ ok: true, diubah: h.diubah }, 200, PRIVAT) : NONAKTIF();
  },

  // aksi: setujui | tolak | perpanjang | cabut
  "PATCH /api/admin/kta/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 2048);
    if (typeof b.aksi !== "string") return gagal("masukan_salah", 422);
    const id = Number(p.params.id);
    const awal = b.aksi === "tolak" ? await hak.ktaBaca(env, akun, id) : null;
    const h = await hak.ktaAksi(env, akun, id, b.aksi, { jenis: b.jenis, berlaku_sampai: b.berlaku_sampai, nama: b.nama === undefined ? null : teks(b.nama, 120), instansi: b.instansi === undefined ? null : teks(b.instansi, 160) }, await ipHash(env, req));
    if (h === null) return NONAKTIF();
    if (!h.ok) return gagal("tidak_ditemukan");
    if (awal?.bukti_kunci && env.BERKAS) await env.BERKAS.delete(awal.bukti_kunci).catch(() => {});
    return json({ ok: true }, 200, PRIVAT);
  },

  // Bukti klaim untuk ditinjau admin.
  "GET /api/admin/kta/:id/bukti": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id) || !env.BERKAS) return gagal("tidak_ditemukan");
    const r = await hak.ktaBaca(env, akun, Number(p.params.id));
    const o = r?.bukti_kunci ? await env.BERKAS.get(r.bukti_kunci) : null;
    if (!o) return gagal("tidak_ditemukan");
    return new Response(o.body, { headers: { "content-type": o.httpMetadata?.contentType || "application/octet-stream", "content-disposition": "attachment", "x-content-type-options": "nosniff", ...PRIVAT } });
  },
};
