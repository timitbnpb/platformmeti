// profil_akun.js: Profil saya (migrasi 0018). Akun menyunting profil, riwayat, foto, dan privasinya sendiri; anggota lain membaca sesuai privasi; admin membaca semua.
// Foto: R2 BERKAS profil/<akun_id>.webp, jenis dari magic byte (bukan dari klien), maks 2 MB. D1 hanya lewat hak.js. Nilai di-escape di klien.
import * as hak from "./hak.js";
import { bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const MAKS_FOTO = 2 * 1024 * 1024;
const KONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const RE_ID = /^\d{1,12}$/;
const RE_REF = /^[A-Za-z0-9_-]{2,60}$/;
// Daftar putih sampul (public/img/beranda/<kode>.webp). Kode diterima hanya bila ada di sini.
export const SAMPUL = ["surya-cirata", "bayu-sidrap", "hidro-saguling", "panas-bumi-sibayak", "bioenergi-sawit", "penyimpanan-baterai", "sampah-psel", "nuklir-siwabessy", "biomassa-bantargebang", "bioetanol-tebu"];
export const TINGKAT_BAHASA = ["dasar", "menengah", "mahir", "fasih", "ibu"];
const HOST_TAUTAN = { linkedin: "linkedin.com", situs: null, orcid: "orcid.org", scholar: "scholar.google.com", researchgate: "researchgate.net" };
const RE_TELEPON = /^[0-9+ ()-]{6,20}$/;
const SALAH = () => new Galat("masukan_salah", 422);

// Hanya gambar yang ditampilkan di profil. SVG sengaja tidak ada (skrip tertanam), GIF tidak perlu.
const sniff = (b) => {
  const h = (...x) => x.every((v, i) => b[i] === v);
  if (h(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (h(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (h(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
};

/* ---------- validasi (murni, diekspor untuk uji) ---------- */
// "" dan null = kosongkan; bukan teks / terlalu panjang / berisi karakter kontrol = 422.
const teks = (v, maks, { baris = false } = {}) => {
  if (v == null || v === "") return null;
  if (typeof v !== "string") throw SALAH();
  const s = (baris ? v.replace(/\r\n?/g, "\n") : v.replace(/\s+/g, " ")).trim();
  if (!s) return null;
  if (s.length > maks || KONTROL.test(s)) throw SALAH();
  return s;
};
const wajib = (v, maks) => { const s = teks(v, maks); if (!s) throw SALAH(); return s; };
const tahun = (v, wajibAda = true) => {
  if (v == null || v === "") { if (wajibAda) throw SALAH(); return null; }
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1950 || n > 2100) throw SALAH();
  return n;
};
function tautanAman(v, { host = null } = {}) {
  const s = teks(v, 200);
  if (!s) return null;
  let u;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : "https://" + s); } catch { throw SALAH(); }
  if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".")) throw SALAH();
  if (host && !(u.hostname === host || u.hostname.endsWith("." + host))) throw SALAH();
  return u.href.slice(0, 200);
}

export function periksaProfil(b) {
  const BOLEH = ["gelar", "jabatan", "instansi", "organisasi_id", "kota", "kode_prov", "bio", "keahlian", "tautan", "telepon", "privasi", "bahasa", "sampul", "nama"];
  if (Object.keys(b).some((k) => !BOLEH.includes(k))) throw SALAH();
  const d = {};
  if ("nama" in b) { d.nama = wajib(b.nama, 120); if (d.nama.length < 2) throw SALAH(); }
  if ("gelar" in b) d.gelar = teks(b.gelar, 40);
  if ("jabatan" in b) d.jabatan = teks(b.jabatan, 120);
  if ("instansi" in b) d.instansi = teks(b.instansi, 160);
  if ("organisasi_id" in b) { const o = teks(b.organisasi_id, 60); if (o && !RE_REF.test(o)) throw SALAH(); d.organisasi_id = o; }
  if ("kota" in b) d.kota = teks(b.kota, 80);
  if ("kode_prov" in b) { const k = teks(b.kode_prov, 2); if (k && !/^\d{2}$/.test(k)) throw SALAH(); d.kode_prov = k; }
  if ("bio" in b) d.bio = teks(b.bio, 600, { baris: true });
  if ("telepon" in b) { const t = teks(b.telepon, 20); if (t && !RE_TELEPON.test(t)) throw SALAH(); d.telepon = t; }
  if ("keahlian" in b) {
    if (!Array.isArray(b.keahlian) || b.keahlian.length > 12) throw SALAH();
    const k = b.keahlian.map((x) => teks(x, 40)).filter(Boolean);
    d.keahlian = k.filter((x, i) => k.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
  }
  if ("tautan" in b) {
    if (!b.tautan || typeof b.tautan !== "object" || Array.isArray(b.tautan) || Object.keys(b.tautan).some((k) => !(k in HOST_TAUTAN))) throw SALAH();
    d.tautan = {};
    for (const k of Object.keys(HOST_TAUTAN)) { const u = tautanAman(b.tautan[k], { host: HOST_TAUTAN[k] }); if (u) d.tautan[k] = u; }
    if (JSON.stringify(d.tautan).length > 600) throw SALAH(); // batas kolom tautan (0018)
  }
  if ("bahasa" in b) {
    if (!Array.isArray(b.bahasa) || b.bahasa.length > 8) throw SALAH();
    const nama = new Set();
    d.bahasa = b.bahasa.map((x) => {
      if (!x || typeof x !== "object" || !TINGKAT_BAHASA.includes(x.tingkat)) throw SALAH();
      const n = wajib(x.nama, 40);
      if (nama.has(n.toLowerCase())) throw SALAH();
      nama.add(n.toLowerCase());
      return { nama: n, tingkat: x.tingkat };
    });
  }
  if ("sampul" in b) {
    if (b.sampul != null && b.sampul !== "" && !SAMPUL.includes(b.sampul)) throw SALAH();
    d.sampul = b.sampul || null;
  }
  if ("privasi" in b) {
    if (!b.privasi || typeof b.privasi !== "object" || Array.isArray(b.privasi)) throw SALAH();
    for (const [k, v] of Object.entries(b.privasi)) if (!hak.BAGIAN_PRIVASI.includes(k) || (v !== "semua" && v !== "admin")) throw SALAH();
    d.privasi = b.privasi;
  }
  if (!Object.keys(d).length) throw SALAH();
  return d;
}

const JENJANG = ["sma", "d3", "d4", "s1", "s2", "s3", "lain"];
export function periksaRiwayat(jenis, b) {
  if (jenis === "pendidikan") {
    if (!JENJANG.includes(b.jenjang)) throw SALAH();
    return { jenjang: b.jenjang, kampus: wajib(b.kampus, 120), jurusan: teks(b.jurusan, 120), tahun: tahun(b.tahun, false) };
  }
  if (jenis === "pengalaman") {
    const mulai = tahun(b.mulai), selesai = tahun(b.selesai, false);
    if (selesai != null && selesai < mulai) throw SALAH();
    return { jabatan: wajib(b.jabatan, 120), organisasi: wajib(b.organisasi, 120), mulai, selesai };
  }
  if (jenis === "sertifikasi") return { nama: wajib(b.nama, 120), penerbit: teks(b.penerbit, 120), tahun: tahun(b.tahun, false) };
  if (jenis === "publikasi") {
    const ref = teks(b.proyek_id, 60);
    if (ref && !RE_REF.test(ref)) throw SALAH();
    return { judul: wajib(b.judul, 160), tahun: tahun(b.tahun, false), proyek_id: ref };
  }
  throw SALAH();
}

const idAkun = (p, id) => (id === "saya" ? p.akun.id : RE_ID.test(id) ? Number(id) : null);

export const rute = {
  // Urutan penting: rute literal "saya" didaftarkan sebelum ":id" (router mengambil yang pertama cocok).
  "GET /api/profil/saya": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.profilBaca(env, akun, akun.id);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "PUT /api/profil/saya": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = periksaProfil(await bacaBody(req, 8192));
    const r = await hak.profilSimpan(env, akun, d);
    return r ? json({ ok: true }, 200, PRIVAT) : NONAKTIF();
  },

  // Badan mentah gambar (klien memotong persegi dan mengecilkan lebih dulu).
  "POST /api/profil/saya/foto": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!env.BERKAS) throw new Galat("layanan");
    if (Number(req.headers.get("content-length")) > MAKS_FOTO) throw new Galat("terlalu_besar");
    if ((await hak.catatLaju(env, "koreksi:pf" + akun.id, 3600)) > 20) return gagal("laju_terlampaui");
    const data = new Uint8Array(await req.arrayBuffer());
    if (data.length === 0) throw SALAH();
    if (data.length > MAKS_FOTO) throw new Galat("terlalu_besar");
    const tipe = sniff(data);
    if (!tipe) throw new Galat("masukan_salah", 415);
    const kunci = `profil/${akun.id}.webp`;
    await env.BERKAS.put(kunci, data, { httpMetadata: { contentType: tipe } });
    const r = await hak.profilFotoSet(env, akun, kunci);
    if (!r) { await env.BERKAS.delete(kunci).catch(() => {}); return NONAKTIF(); }
    return json({ ok: true }, 201, PRIVAT);
  },

  "DELETE /api/profil/saya/foto": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.profilFotoSet(env, akun, null);
    if (!r) return NONAKTIF();
    if (env.BERKAS) await env.BERKAS.delete(`profil/${akun.id}.webp`).catch(() => {});
    return json({ ok: true }, 200, PRIVAT);
  },

  "POST /api/profil/saya/riwayat": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 4096);
    if (!hak.JENIS_RIWAYAT.includes(b.jenis)) throw SALAH();
    const r = await hak.profilRiwayatTambah(env, akun, b.jenis, periksaRiwayat(b.jenis, b.isi && typeof b.isi === "object" ? b.isi : {}));
    return r ? json({ id: r.id }, 201, PRIVAT) : NONAKTIF();
  },

  "PUT /api/profil/saya/riwayat/:rid": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.rid)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 4096);
    if (!hak.JENIS_RIWAYAT.includes(b.jenis)) throw SALAH();
    const r = await hak.profilRiwayatUbah(env, akun, Number(p.params.rid), b.jenis, periksaRiwayat(b.jenis, b.isi && typeof b.isi === "object" ? b.isi : {}));
    if (!r) return NONAKTIF();
    return r.ada ? json({ ok: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  "DELETE /api/profil/saya/riwayat/:rid": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.rid)) return gagal("tidak_ditemukan");
    const r = await hak.profilRiwayatHapus(env, akun, Number(p.params.rid));
    if (!r) return NONAKTIF();
    return r.ada ? json({ ok: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  "GET /api/profil/saya/sesi": async (req, env, ctx, p) => {
    const akun = perlu(p);
    let nama = null;
    try { nama = new Intl.DisplayNames(["id"], { type: "region" }); } catch { /* tanpa nama negara: kode saja */ }
    const sesi = (await hak.sesiSayaDaftar(env, akun, p.sesi.idHash)).map((s) => ({ ...s, negara_nama: s.negara ? (nama?.of(s.negara) ?? s.negara) : null }));
    return json({ sesi }, 200, PRIVAT);
  },

  "DELETE /api/profil/saya/sesi/:sid": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!/^[0-9a-f]{16}$/.test(p.params.sid)) return gagal("tidak_ditemukan");
    const r = await hak.sesiSayaCabut(env, akun, p.sesi.idHash, p.params.sid);
    return r.dicabut ? json({ ok: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  "POST /api/profil/saya/sesi/keluar-lain": async (req, env, ctx, p) => {
    const akun = perlu(p);
    return json(await hak.sesiSayaCabutLain(env, akun, p.sesi.idHash), 200, PRIVAT);
  },

  // Profil anggota lain (atau "saya"): hanya bagian yang diizinkan pemiliknya; admin dan super semuanya. Tak ada / nonaktif = 404.
  "GET /api/profil/:id": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const id = idAkun(p, p.params.id);
    if (id == null) return gagal("tidak_ditemukan");
    const r = await hak.profilBaca(env, akun, id);
    if (!r) return NONAKTIF();
    return r.ada ? json(r, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  "GET /api/profil/:id/foto": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const id = idAkun(p, p.params.id);
    if (id == null || !env.BERKAS) return gagal("tidak_ditemukan");
    const f = await hak.profilFotoKunci(env, akun, id);
    if (!f?.ada) return gagal("tidak_ditemukan");
    const o = await env.BERKAS.get(f.kunci);
    if (!o) return gagal("tidak_ditemukan");
    const etag = o.httpEtag || `"${f.v}"`;
    const kepala = { "cache-control": "private, max-age=0", vary: "Cookie", etag, "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox" };
    if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: kepala });
    return new Response(o.body, { status: 200, headers: { ...kepala, "content-type": o.httpMetadata?.contentType || "image/webp" } });
  },
};
