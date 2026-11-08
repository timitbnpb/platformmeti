// admin.js: koreksi publik + putusan, statistik agregat, konten beranda, jejak admin (migrasi 0010). Semua D1 lewat hak.js.
import * as hak from "./hak.js";
import { bacaBody, cacheTepi, gagal, ipHash, json, perlu, PRIVAT, sha } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const str = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
const ENTITAS = ["organisasi", "proyek", "regulasi", "orang"];
const TERLARANG = /nik|alamat|lahir|agama|kawin|biometrik|sandi|garam/i; // KPV §1 butir 3: data terlarang tak diterima
const RE_ID = /^[A-Za-z0-9_.:-]{1,80}$/, RE_KOLOM = /^[a-z0-9_]{1,60}$/;

// Kata cari: huruf kecil, spasi dirapatkan, maks 60; dibuang bila mirip surel/telepon (>= 8 digit) atau < 2 huruf.
export function normalisasiCari(v) {
  if (typeof v !== "string") return null;
  const k = v.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60).trim();
  if (k.length < 2 || k.includes("@") || (k.match(/\d/g) || []).length >= 8 || /^https?:/.test(k)) return null;
  return k;
}
// Jalur halaman: tanpa query/hash, huruf kecil, karakter jalur saja.
const HALAMAN = new Set(["/", "/asean", "/berita", "/cari", "/direktori", "/insight", "/kalender", "/kelayakan", "/metode", "/peluang", "/proyek", "/pustaka", "/rantai", "/regulasi", "/strategi", "/tentang", "/kredit-foto", "/wilayah", "/masuk"]);
export function normalisasiHalaman(v) {
  if (typeof v !== "string") return null;
  const k = v.toLowerCase().split(/[?#]/)[0].replace(/(.)\/$/, "$1").replace(/\.html$/, "");
  return HALAMAN.has(k) || /^\/[op]\/[a-z0-9_-]{1,80}$/.test(k) || /^\/wilayah\/\d{2}$/.test(k) ? k : null;
}

export const rute = {
  // Publik. Batas 5/jam per koneksi (hash harian, tak disimpan di tabel usulan).
  "POST /api/koreksi": async (req, env) => {
    const b = await bacaBody(req, 8192);
    const sumber = b.sumber_url == null || b.sumber_url === "" ? null : b.sumber_url;
    if (!ENTITAS.includes(b.entitas) || !RE_ID.test(String(b.entitas_id ?? "")) || !RE_KOLOM.test(String(b.kolom ?? "")) || TERLARANG.test(b.kolom)
      || !str(b.nilai_usulan, 1, 2000) || !str(b.alasan, 1, 1000)
      || (sumber !== null && !(typeof sumber === "string" && /^https:\/\/[^\s]{4,}$/.test(sumber) && sumber.length <= 600))) return gagal("masukan_salah", 422);
    if ((await hak.sistem.catatLaju(env, "koreksi:" + await ipHash(env, req), 3600)) > 5) return gagal("laju_terlampaui");
    const r = await hak.koreksiBaru(env, { entitas: b.entitas, entitas_id: b.entitas_id, kolom: b.kolom, nilai_usulan: b.nilai_usulan.trim(), alasan: b.alasan.trim(), sumber_url: sumber });
    return r ? json({ id: r.id }, 201, PRIVAT) : NONAKTIF();
  },

  "GET /api/admin/koreksi": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const q = new URL(req.url).searchParams, status = q.get("status") || "baru";
    if (!["baru", "setuju", "tolak"].includes(status)) return gagal("masukan_salah", 422);
    const r = await hak.koreksiDaftar(env, akun, status, q.get("hal") ?? 1);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/admin/koreksi/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const b = await bacaBody(req, 2048);
    if (!["setuju", "tolak"].includes(b.aksi) || (b.catatan != null && !str(String(b.catatan), 0, 500))) return gagal("masukan_salah", 422);
    if (!/^\d{1,12}$/.test(p.params.id)) return gagal("tidak_ditemukan");
    const r = await hak.koreksiPutus(env, akun, p.params.id, b.aksi, b.catatan ? String(b.catatan).trim() : null);
    if (!r) return NONAKTIF();
    return r.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik"); // tak ada / sudah diputus
  },

  "GET /api/admin/statistik": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const r = await hak.statistikAdmin(env, akun, new URL(req.url).searchParams.get("hari") ?? 30);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  // Lalu lintas orang vs AI (0020): GET /api/admin/lalin?r=24j|7h|30h|semua
  "GET /api/admin/lalin": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const r = new URL(req.url).searchParams.get("r") ?? "7h";
    if (!["24j", "7h", "30h", "semua"].includes(r)) return gagal("masukan_salah", 422);
    const d = await hak.lalinAdmin(env, akun, r);
    return d ? json(d, 200, PRIVAT) : NONAKTIF();
  },

  // sendBeacon: tidak bisa memasang x-pb, jadi router memeriksa asal sendiri untuk jalur ini.
  // 204 untuk kunci yang tak lolos normalisasi; 422 badan/jenis salah; 429 bila melewati batas laju.
  "POST /api/statistik": async (req, env) => {
    const teks = await req.text();
    if (teks.length > 512) return gagal("terlalu_besar");
    let b; try { b = JSON.parse(teks); } catch { return gagal("masukan_salah", 422); }
    if (!b || !["halaman", "cari"].includes(b.jenis)) return gagal("masukan_salah", 422);
    const kunci = b.jenis === "cari" ? normalisasiCari(b.kunci) : normalisasiHalaman(b.kunci);
    if (!kunci) return new Response(null, { status: 204 });
    const ip = await ipHash(env, req);
    if ((await hak.sistem.catatLaju(env, "cari:st" + ip, 60)) > 120) return gagal("laju_terlampaui");
    // unik harian: kunci laju = hash(ip|kata) pada jendela sehari; hit pertama = koneksi baru. Hash tak masuk statistik_harian.
    const unik = b.jenis === "cari" && (await hak.sistem.catatLaju(env, "cari:u" + (await sha(ip + "|" + kunci)).slice(0, 24), 86400)) === 1;
    await hak.statistikHit(env, b.jenis, kunci, unik);
    return new Response(null, { status: 204 });
  },

  // Publik, cache tepi 5 menit; tabel belum ada = semua null (beranda memakai bawaannya).
  "GET /api/konten-beranda": (req, env, ctx) => cacheTepi(req, ctx, async () => {
    const o = (await hak.kontenBaca(env)) ?? { sorotan: null, berita_pilihan: null, agenda: null, program: null };
    return json(o, 200);
  }, 300),

  "PUT /api/admin/konten-beranda": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const b = await bacaBody(req, 24000);
    if (typeof b.kunci !== "string" || b.isi === undefined || b.isi === null || typeof b.isi !== "object") return gagal("masukan_salah", 422);
    return (await hak.kontenSimpan(env, akun, b.kunci, b.isi)) ? json({ ok: true }, 200, PRIVAT) : NONAKTIF();
  },

  // Beranda admin: semua hitungan antrean dalam satu panggilan (COUNT terindeks).
  "GET /api/admin/ringkas": async (req, env, ctx, p) => json(await hak.ringkasAdmin(env, perlu(p, ADM)), 200, PRIVAT),

  // Kotak masuk kurasi terpadu (0034): butir D1 yang menunggu + penugasan. Butir statis dibaca klien dari JSON publik.
  "GET /api/admin/kotak": async (req, env, ctx, p) => json(await hak.kotakAdmin(env, perlu(p, ADM)), 200, PRIVAT),
  "PUT /api/admin/kotak/tugas": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM), b = await bacaBody(req, 1024);
    if (typeof b.jenis !== "string" || typeof b.butir !== "string") return gagal("masukan_salah", 422);
    const r = await hak.kotakAmbil(env, akun, b.jenis, b.butir);
    return r?.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
  "DELETE /api/admin/kotak/tugas": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM), q = new URL(req.url).searchParams;
    const r = await hak.kotakLepas(env, akun, q.get("jenis") ?? "", q.get("butir") ?? "");
    return r?.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  // Keamanan akun (0025): sesi aktif semua akun, cabut per sesi, riwayat gagal masuk 30 hari, matriks hak (hanya baca).
  "GET /api/admin/keamanan/sesi": async (req, env, ctx, p) => json({ baris: await hak.sesiAdminDaftar(env, perlu(p, ADM), p.sesi.idHash) }, 200, PRIVAT),
  "DELETE /api/admin/keamanan/sesi/:sid": async (req, env, ctx, p) => {
    const r = await hak.sesiAdminCabut(env, perlu(p, ADM), p.sesi.idHash, p.params.sid);
    return r.dicabut ? json({ ok: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },
  "GET /api/admin/keamanan/gagal": async (req, env, ctx, p) => json(await hak.gagalMasukDaftar(env, perlu(p, ADM)), 200, PRIVAT),
  "GET /api/admin/keamanan/matriks": async (req, env, ctx, p) => json(hak.matriksHak(perlu(p, ADM)), 200, PRIVAT),
};
