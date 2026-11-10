// daftar.js: pendaftaran anggota mandiri (pemilik 8 Nov 2026) + persetujuan admin + iuran (bukti transfer, Midtrans opsional).
// Publik: POST /api/daftar, /foto, /lacak, /bukti, /bayar-online, /midtrans/notifikasi. Admin/pengurus: /api/admin/pendaftaran*.
// Token lacak: dikirim di BADAN permintaan (bukan URL API), hanya SHA-256-nya disimpan. Semua D1 lewat hak.js.
import * as hak from "./hak.js";
import { acak, bacaBody, formTerbatas, gagal, ipHash, json, perlu, PRIVAT, RE_EMAIL, sha } from "./util.js";

const STAF = ["pengurus", "admin", "super"];
const ADM = ["admin", "super"];
const BERLAKU = 72 * 3600;
export const KEPAKARAN = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "penyimpanan"];
const RE_TOKEN = /^[0-9a-f]{64}$/;
const MAKS_BUKTI = 5 * 1024 * 1024, MAKS_FOTO = 2 * 1024 * 1024;

const teks = (v, min, maks) => {
  if (v == null || v === "") return min === 0 ? null : undefined;
  if (typeof v !== "string") return undefined;
  const s = v.replace(/[\u0000-\u0008\u000B-\u001F\u007F<>]/g, "").replace(/[ \t]+/g, " ").trim();
  return s.length >= min && s.length <= maks ? (s || null) : undefined;
};
const tautanSah = (v) => { if (v == null || v === "") return null; try { const u = new URL(v); return /^https?:$/.test(u.protocol) && String(v).length <= 300 ? u.href : undefined; } catch { return undefined; } };

// Tipe dari magic byte (bukan dari Content-Type klien): JPEG, PNG, WEBP, PDF.
export function tipeBerkas(b) {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ["image/jpeg", "jpg"];
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return ["image/png", "png"];
  if (b.length >= 12 && String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP") return ["image/webp", "webp"];
  if (b.length >= 5 && String.fromCharCode(...b.subarray(0, 5)) === "%PDF-") return ["application/pdf", "pdf"];
  return null;
}

// Tarif resmi bawaan (public/data/keanggotaan.json, bersumber metiires.or.id/membership); admin menimpa lewat pengaturan.
let TARIF = null;
async function tarifBawaan(env, req) {
  if (TARIF) return TARIF;
  try {
    const r = await env.ASSETS.fetch(new Request(new URL("/data/keanggotaan.json", req.url)));
    const d = r.ok ? await r.json() : null;
    if (Array.isArray(d?.kategori)) return (TARIF = Object.fromEntries(d.kategori.map((k) => [k.kode, k.iuran_awal])));
  } catch { /* tanpa tarif bawaan: iuran kosong */ }
  return {};
}
const ALIAS_JENIS = { organisasi: "ngo", mahasiswa: "pelajar", perorangan: "individu" }; // kategori lama -> 6 kategori resmi
export const JENIS_BADAN = ["ngo", "usaha_kecil", "usaha_besar", "utama"];

// Validasi formulir -> { ok, d } | { ok: false }. Tanpa NIK/KTP/keuangan: kolom lain di luar daftar ini diabaikan.
export function periksaForm(b) {
  const jenis0 = ALIAS_JENIS[b.jenis] ?? b.jenis, jenis = hak.JENIS_DAFTAR.includes(jenis0) ? jenis0 : null;
  const nama = teks(b.nama, 2, 120), surel = typeof b.surel === "string" ? b.surel.trim().toLowerCase() : "";
  const hp = typeof b.hp === "string" ? b.hp.replace(/[\s().-]/g, "") : "";
  const prov = b.prov == null || b.prov === "" ? null : String(b.prov);
  const kepakaran = Array.isArray(b.kepakaran) ? [...new Set(b.kepakaran)] : [];
  const rinci = {
    gelar: teks(b.gelar, 0, 40), jabatan: teks(b.jabatan, 0, 120), pendidikan: teks(b.pendidikan, 0, 120), pengalaman: teks(b.pengalaman, 0, 1000),
    tautan: tautanSah(b.tautan), alasan: teks(b.alasan, 10, 1000), wilayah: teks(b.wilayah, 0, 80), organisasi_baru: b.organisasi_baru === true ? true : undefined,
    kepakaran,
    badan_nama: teks(b.badan_nama, 0, 160), badan_sektor: teks(b.badan_sektor, 0, 80), badan_alamat: teks(b.badan_alamat, 0, 300), badan_situs: tautanSah(b.badan_situs),
    pj_nama: teks(b.pj_nama, 0, 120), pj_kontak: teks(b.pj_kontak, 0, 120),
  };
  const organisasi = teks(b.organisasi, 0, 160), kota = teks(b.kota, 0, 80);
  if (!jenis || !nama || !RE_EMAIL.test(surel) || surel.length < 5 || surel.length > 120 || !/^\+?\d{6,18}$/.test(hp)) return { ok: false };
  if (prov !== null && !/^\d{2}$/.test(prov)) return { ok: false };
  if (b.setuju !== true || rinci.alasan === undefined || rinci.alasan === null) return { ok: false };
  if (kepakaran.length > 8 || kepakaran.some((k) => !KEPAKARAN.includes(k))) return { ok: false };
  if ([organisasi, kota, rinci.gelar, rinci.jabatan, rinci.pendidikan, rinci.pengalaman, rinci.tautan, rinci.badan_nama, rinci.badan_sektor, rinci.badan_alamat, rinci.badan_situs, rinci.pj_nama, rinci.pj_kontak].includes(undefined)) return { ok: false };
  if (JENIS_BADAN.includes(jenis) && (!rinci.badan_nama || !rinci.pj_nama || !rinci.pj_kontak)) return { ok: false };
  for (const k of Object.keys(rinci)) if (rinci[k] === null || rinci[k] === undefined) delete rinci[k];
  return { ok: true, d: { jenis, nama, surel, hp, organisasi, kota, prov, rinci } };
}

// Berkas dari FormData { token, berkas }; ukuran dan tipe DICEK dari byte.
async function bacaUnggah(req, maks) {
  const cl = req.headers.get("content-length");
  if (!/^\d{1,10}$/.test(cl ?? "")) throw new hak.Galat("masukan_salah", 411);   // tanpa Content-Length (chunked) ditolak sebelum diurai
  const f = await formTerbatas(req, maks + 4096);
  const token = f.get("token"), berkas = f.get("berkas");
  if (typeof token !== "string" || !RE_TOKEN.test(token) || !berkas || typeof berkas === "string" || berkas.size < 1 || berkas.size > maks) throw new hak.Galat("masukan_salah");
  return { token, badan: new Uint8Array(await berkas.arrayBuffer()) };
}
async function laju(env, req, nama, maks, tokenHash) {
  const ip = await ipHash(env, req);
  if ((await hak.sistem.catatLaju(env, "koreksi:" + nama + "-ip-" + ip)) > maks) return true;
  return tokenHash ? (await hak.sistem.catatLaju(env, "koreksi:" + nama + "-tk-" + tokenHash.slice(0, 24))) > maks : false;
}
const lajuToken = async (env, nama, maks, tokenHash) => (await hak.sistem.catatLaju(env, "koreksi:" + nama + "-tk-" + tokenHash.slice(0, 24))) > maks;
const hexTanda = async (teksIsi) => [...new Uint8Array(await crypto.subtle.digest("SHA-512", new TextEncoder().encode(teksIsi)))].map((x) => x.toString(16).padStart(2, "0")).join("");
const samaTetap = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

// Tanda tangan notifikasi Midtrans: SHA512(order_id + status_code + gross_amount + server_key). Gross yang DIPERCAYA dari DB.
export async function tandaMidtrans(n, kunciServer) { return hexTanda(`${n.order_id}${n.status_code}${n.gross_amount}${kunciServer}`); }
const URL_SNAP = (env) => (env.MIDTRANS_PRODUKSI === "1" ? "https://app.midtrans.com/snap/v1/transactions" : "https://app.sandbox.midtrans.com/snap/v1/transactions");

export const rute = {
  // Publik. Honeypot + batas laju per koneksi (5 per jam). Balasan memuat token lacak SEKALI (hanya hash yang disimpan).
  "POST /api/daftar": async (req, env) => {
    const b = await bacaBody(req, 16000);
    if (b.situs_web) return json({ token: acak(32) }, 201, PRIVAT); // honeypot: bot dikelabui, tidak ada yang disimpan
    const v = periksaForm(b);
    if (!v.ok) return gagal("masukan_salah", 422);
    if (await laju(env, req, "daftar", 5)) return gagal("laju_terlampaui");
    const token = acak(32);
    try {
      await hak.pendaftaranBaru(env, v.d, await sha(token), await ipHash(env, req).catch(() => null), (await tarifBawaan(env, req))[v.d.jenis] ?? null);
    } catch (e) {
      // Surel sudah terdaftar: balasan seragam 201 dengan token palsu (tidak membocorkan keberadaan akun; tidak ada baris tersimpan).
      if (e?.kode === "konflik") return json({ token }, 201, PRIVAT);
      throw e;
    }
    return json({ token }, 201, PRIVAT);
  },

  // Foto/logo opsional: gambar <= 2 MB, ke R2 privat; FormData { token, berkas }.
  "POST /api/daftar/foto": async (req, env) => {
    if (!env.BERKAS) return gagal("layanan");
    if (await laju(env, req, "dfoto", 6)) return gagal("laju_terlampaui");   // per IP SEBELUM formData
    const { token, badan } = await bacaUnggah(req, MAKS_FOTO);
    const t = tipeBerkas(badan);
    if (!t || t[0] === "application/pdf") return gagal("masukan_salah", 422);
    const th = await sha(token);
    if (await lajuToken(env, "dfoto", 6, th)) return gagal("laju_terlampaui");
    const kunci = `daftar/foto/${acak(16)}.${t[1]}`;
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: t[0] } });
    if (!(await hak.pendaftaranFotoSet(env, th, kunci))) { await env.BERKAS.delete(kunci).catch(() => {}); return gagal("tidak_ditemukan"); }
    return json({ ok: true }, 201, PRIVAT);
  },

  // Status + iuran + rekening tujuan. Token di BADAN. Token salah = 404 seragam.
  "POST /api/daftar/lacak": async (req, env) => {
    const b = await bacaBody(req, 512);
    if (typeof b.token !== "string" || !RE_TOKEN.test(b.token)) return gagal("tidak_ditemukan");
    const th = await sha(b.token);
    if (await laju(env, req, "dlacak", 60, th)) return gagal("laju_terlampaui");
    const r = await hak.pendaftaranLacak(env, th);
    if (!r) return gagal("tidak_ditemukan");
    const { _id, ...isi } = r;
    return json({ ...isi, online: !!env.MIDTRANS_SERVER_KEY && r.pendaftaran.iuran > 0, bukti_maks: 3 }, 200, PRIVAT);
  },

  // Bukti transfer: JPEG/PNG/WEBP/PDF <= 5 MB (dicek dari byte), R2 privat, maks 3 menunggu, laju per IP dan per token.
  "POST /api/daftar/bukti": async (req, env) => {
    if (!env.BERKAS) return gagal("layanan");
    if (await laju(env, req, "dbukti", 8)) return gagal("laju_terlampaui");   // per IP SEBELUM formData
    const { token, badan } = await bacaUnggah(req, MAKS_BUKTI);
    const t = tipeBerkas(badan);
    if (!t) return gagal("masukan_salah", 422);
    const th = await sha(token);
    if (await lajuToken(env, "dbukti", 8, th)) return gagal("laju_terlampaui");
    const ada = await hak.pendaftaranLacak(env, th);
    if (!ada) return gagal("tidak_ditemukan");
    const kunci = `daftar/bukti/${acak(16)}.${t[1]}`;
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: t[0] } });
    let ok = false;
    try { ok = await hak.pendaftaranBuktiTambah(env, th, { kunci, tipe: t[0], ukuran: badan.length }); } finally { if (!ok) await env.BERKAS.delete(kunci).catch(() => {}); }
    return ok ? json({ ok: true }, 201, PRIVAT) : gagal("konflik");
  },

  // Midtrans Snap (opsional). Tanpa MIDTRANS_SERVER_KEY: 503, tombol tidak tampil. Gross dari DB, bukan dari klien.
  "POST /api/daftar/bayar-online": async (req, env) => {
    if (!env.MIDTRANS_SERVER_KEY) return gagal("layanan");
    const b = await bacaBody(req, 512);
    if (typeof b.token !== "string" || !RE_TOKEN.test(b.token)) return gagal("tidak_ditemukan");
    const th = await sha(b.token);
    if (await laju(env, req, "donline", 10, th)) return gagal("laju_terlampaui");
    const order = "JM-" + acak(10);
    const p = await hak.onlineBuat(env, th, order);
    if (!p) return gagal("tidak_ditemukan");
    const r = await fetch(URL_SNAP(env), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: "Basic " + btoa(env.MIDTRANS_SERVER_KEY + ":") },
      body: JSON.stringify({ transaction_details: { order_id: order, gross_amount: p.gross }, customer_details: { first_name: p.nama.slice(0, 50), email: p.surel } }),
    }).catch(() => null);
    const d = r?.ok ? await r.json().catch(() => null) : null;
    if (!d?.redirect_url || !/^https:\/\//.test(d.redirect_url)) return gagal("layanan");
    return json({ url: d.redirect_url }, 200, PRIVAT);
  },

  // Webhook Midtrans: tanda tangan SHA512 diverifikasi dulu; gross dicocokkan dengan DB (angka klien/notifikasi tak dipercaya).
  "POST /api/daftar/midtrans/notifikasi": async (req, env) => {
    if (!env.MIDTRANS_SERVER_KEY) return gagal("layanan");
    const n = await bacaBody(req, 8192);
    const f = (k) => (typeof n[k] === "string" ? n[k] : "");
    if (!f("order_id") || !f("status_code") || !f("gross_amount") || !f("signature_key")) return gagal("masukan_salah", 422);
    if (!samaTetap(await tandaMidtrans({ order_id: f("order_id"), status_code: f("status_code"), gross_amount: f("gross_amount") }, env.MIDTRANS_SERVER_KEY), f("signature_key").toLowerCase())) return gagal("dilarang");
    const o = await hak.onlineBaca(env, f("order_id"));
    if (!o) return gagal("tidak_ditemukan");
    if (Math.round(Number(f("gross_amount"))) !== o.gross) return gagal("masukan_salah", 422);
    const st = f("transaction_status"), lunas = (st === "settlement" || (st === "capture" && f("fraud_status") !== "challenge")) && f("status_code") === "200";
    if (lunas || ["deny", "cancel", "expire", "failure"].includes(st)) await hak.onlineSelesai(env, o.order_id, lunas);
    return json({ ok: true }, 200, PRIVAT);
  },

  /* ----------------------------------------- admin / pengurus ----------------------------------------- */
  "GET /api/admin/pendaftaran": async (req, env, ctx, p) => {
    const akun = perlu(p, STAF);
    const q = new URL(req.url).searchParams, status = q.get("status") || "menunggu", jenis = q.get("jenis") || "", prov = q.get("prov") || "";
    if (!["menunggu", "disetujui", "ditolak"].includes(status) || (jenis && !hak.JENIS_DAFTAR.includes(jenis)) || (prov && !/^\d{2}$/.test(prov))) return gagal("masukan_salah", 422);
    const r = await hak.pendaftaranDaftar(env, akun, { status, jenis, prov, hal: q.get("hal") ?? 1 });
    return r ? json(r, 200, PRIVAT) : gagal("layanan", 503, PRIVAT);
  },
  "GET /api/admin/pendaftaran/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, STAF);
    const r = await hak.pendaftaranRincian(env, akun, p.params.id);
    return r ? json(r, 200, PRIVAT) : gagal("tidak_ditemukan");
  },
  "POST /api/admin/pendaftaran/:id/setujui": async (req, env, ctx, p) => {
    const akun = perlu(p, STAF);
    const b = await bacaBody(req, 2048);
    const catatan = teks(b.catatan, 0, 500);
    if (catatan === undefined) return gagal("masukan_salah", 422);
    const token = acak(32), sampai = Math.floor(Date.now() / 1000) + BERLAKU;
    const r = await hak.pendaftaranPutus(env, akun, p.params.id, "setuju", { catatan, aktivasiHash: await sha(token), aktivasiSampai: sampai });
    if (!r.ubah) return gagal("konflik");
    return json({ tautan_aktivasi: `${new URL(req.url).origin}/aktivasi?token=${token}`, berlaku_sampai: sampai }, 200, PRIVAT);
  },
  "POST /api/admin/pendaftaran/:id/tolak": async (req, env, ctx, p) => {
    const akun = perlu(p, STAF);
    const b = await bacaBody(req, 2048);
    const catatan = teks(b.catatan, 3, 500);
    if (!catatan) return gagal("masukan_salah", 422);
    const r = await hak.pendaftaranPutus(env, akun, p.params.id, "tolak", { catatan });
    return r.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
  // Bukti/foto dialirkan dari R2 lewat rute admin (R2 tidak pernah publik).
  "GET /api/admin/pendaftaran/bukti/:bid": async (req, env, ctx, p) => {
    const akun = perlu(p, STAF);
    const r = await hak.pendaftaranBuktiKunci(env, akun, p.params.bid);
    return r ? alirkan(env, r.kunci_r2, r.tipe) : gagal("tidak_ditemukan");
  },
  "GET /api/admin/pendaftaran/:id/foto": async (req, env, ctx, p) => {
    const akun = perlu(p, STAF);
    const k = await hak.pendaftaranFotoKunci(env, akun, p.params.id);
    return k ? alirkan(env, k, k.endsWith(".png") ? "image/png" : k.endsWith(".webp") ? "image/webp" : "image/jpeg") : gagal("tidak_ditemukan");
  },
  "POST /api/admin/pendaftaran/bukti/:bid": async (req, env, ctx, p) => {
    const akun = perlu(p, STAF);
    const b = await bacaBody(req, 1024);
    const catatan = teks(b.catatan, 0, 300);
    if (!["terima", "tolak"].includes(b.aksi) || catatan === undefined) return gagal("masukan_salah", 422);
    const r = await hak.pendaftaranBuktiPutus(env, akun, p.params.bid, b.aksi, catatan);
    return r.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
  "GET /api/admin/pengaturan-daftar": async (req, env, ctx, p) => json(await hak.pengaturanDaftarAdmin(env, perlu(p, ADM)), 200, PRIVAT),
  "PUT /api/admin/pengaturan-daftar": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const b = await bacaBody(req, 4096);
    const nilai = {};
    for (const k of hak.KUNCI_ATUR_DAFTAR) if (k in b) nilai[k] = typeof b[k] === "string" ? b[k].replace(/[\u0000-\u001F<>]/g, "").trim() : b[k];
    await hak.pengaturanDaftarSimpan(env, akun, nilai);
    return json({ ok: true }, 200, PRIVAT);
  },
};

async function alirkan(env, kunci, tipe) {
  if (!env.BERKAS) return gagal("layanan");
  const o = await env.BERKAS.get(kunci);
  if (!o) return gagal("berkas_belum_ada");
  return new Response(o.body, { headers: { "content-type": tipe, "content-disposition": "inline", "content-security-policy": "default-src 'none'; sandbox", "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
