// sesi.js (JM-B03): masuk, keluar, saya, aktivasi, ganti sandi. Cookie hanya memuat token; D1 hanya hash-nya.
import * as hak from "./hak.js";
import { hashSandi, cocokSandi, hashPalsu, perluRehash, sandiSah } from "./sandi.js";
import { infoSesi } from "./ua.js";
import { Galat, RE_EMAIL, acak, bacaBody, gagal, ipHash, json, perlu, samarSurel, sha } from "./util.js";

const UMUR = 14 * 86400;
const MASUK_BATAS = 10, MASUK_JENDELA = 900;       // 10 percobaan per 15 menit, per IP dan per surel
const AKTIVASI_BATAS = 10, JAM = 3600;
const RE_TOKEN = /^[0-9a-f]{64}$/;

const cookie = (nilai, umur) => `sesi=${nilai}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${umur}`;
const teks = (v, min, maks) => typeof v === "string" && v.length >= min && v.length <= maks;
const bukanTerlampaui = (n) => n <= MASUK_BATAS;

// Satu UPSERT atomik; mengembalikan jumlah termasuk panggilan ini.
const laju = (env, aksi, kunci, lebar) => hak.catatLaju(env, `${aksi}:${kunci}`, lebar);
const terlalu = () => gagal("laju_terlampaui", 429, { "retry-after": String(MASUK_JENDELA) });

async function masuk(req, env) {
  const b = await bacaBody(req);
  const surel = typeof b.surel === "string" ? b.surel.trim().toLowerCase() : "";
  if (!teks(surel, 5, 120) || !RE_EMAIL.test(surel) || !teks(b.sandi, 1, 128)) throw new Galat("masukan_salah");
  const ip = await ipHash(env, req);
  const [nIp, nSurel] = await Promise.all([laju(env, "masuk-ip", ip, MASUK_JENDELA), laju(env, "masuk-surel", (await sha(surel)).slice(0, 32), MASUK_JENDELA)]);
  if (!bukanTerlampaui(nIp) || !bukanTerlampaui(nSurel)) return terlalu();

  const akun = await hak.cariAkunUntukMasuk(env, surel);
  let ok = false;
  if (akun && akun.status === "aktif" && akun.sandi) ok = await cocokSandi(b.sandi, akun.sandi, akun.garam, akun.iterasi);
  else await hashPalsu(b.sandi);                      // waktu sama untuk surel tak dikenal / belum aktif
  if (!ok) {
    // Jejak gagal paling banyak sekali per menit per IP; tanpa id akun supaya tidak membocorkan keberadaannya.
    if ((await laju(env, "masuk-log", ip, 60)) === 1) await hak.jejakTulis(env, { aksi: "masuk-gagal", tabel: "sesi", ipHash: ip, ringkas: samarSurel(surel) });
    return gagal("masuk_gagal");
  }

  // Rehash ke iterasi lebih tinggi butuh hak.rehashSandi (ubahSandi mencabut sesi dan mereset wajib_ganti). Dilewati bila belum ada.
  if (perluRehash(akun.iterasi) && hak.rehashSandi) {
    const h = await hashSandi(b.sandi);
    await hak.rehashSandi(env, akun.id, h.hash, h.garam, h.iterasi);
  }
  const token = acak(32);
  await hak.catatSesi(env, { idHash: await sha(token), akunId: akun.id, peran: akun.peran, sampai: Math.floor(Date.now() / 1000) + UMUR, ipHash: ip, info: infoSesi(req) });
  return json({ peran: akun.peran, nama: akun.nama, bahasa: akun.bahasa, wajib_ganti: !!akun.wajib_ganti }, 200, { "set-cookie": cookie(token, UMUR) });
}

async function keluar(req, env, ctx, p) {
  perlu(p);
  // Kuki selalu dibersihkan: galat D1 tidak boleh membuat orang tetap masuk setelah menekan Keluar.
  try { await hak.hapusSesi(env, p.sesi.idHash); } catch (e) { console.error("keluar: hapus sesi gagal", e?.message); }
  return json({ ok: true }, 200, { "set-cookie": cookie("", 0) });
}

async function saya(req, env, ctx, p) {
  const a = p.akun;
  const kepala = { "cache-control": "private, no-store", vary: "Cookie" };
  if (!a) return json({ masuk: false }, 200, kepala);
  // wilayah_kode: provinsi tautan pengurus METI Wilayah (0019) atau null; menentukan tombol "Kelola" di profil wilayah.
  const wk = await hak.wilayahKode(env, a).catch(() => null);
  return json({ masuk: true, peran: a.peran, nama: a.nama, bahasa: a.bahasa, cakupan_prov: a.cakupan_prov, super: a.peran === "super", wajib_ganti: a.wajib_ganti, wilayah_kode: wk || null }, 200, kepala);
}

async function aktivasi(req, env) {
  const b = await bacaBody(req);
  if (!teks(b.token, 64, 64) || !RE_TOKEN.test(b.token) || !teks(b.sandi, 12, 128)) throw new Galat("masukan_salah");
  const ip = await ipHash(env, req);
  if ((await laju(env, "aktivasi", ip, JAM)) > AKTIVASI_BATAS) return gagal("laju_terlampaui", 429, { "retry-after": String(JAM) });
  // Atomik: hanya satu pemanggil yang menghabiskan tautan; kedaluwarsa/terpakai/tak dikenal -> null.
  const akun = await hak.pakaiTautanAktivasi(env, await sha(b.token));
  if (!akun) throw new Galat("masukan_salah");
  if (!sandiSah(b.sandi, akun.surel)) throw new Galat("masukan_salah");   // tautan sudah terpakai: Admin menerbitkan ulang
  const h = await hashSandi(b.sandi);
  await hak.ubahSandi(env, akun.id, h.hash, h.garam, h.iterasi);
  return json({ ok: true });
}

async function gantiSandi(req, env, ctx, p) {
  const akun = perlu(p);
  const b = await bacaBody(req);
  if (!teks(b.lama, 1, 128) || !sandiSah(b.baru, akun.surel)) throw new Galat("masukan_salah");
  if ((await laju(env, "ganti-sandi", String(akun.id), JAM)) > AKTIVASI_BATAS) return gagal("laju_terlampaui", 429, { "retry-after": String(JAM) });
  const a = await hak.cariAkunUntukMasuk(env, akun.surel);
  if (!a || !(await cocokSandi(b.lama, a.sandi, a.garam, a.iterasi))) return gagal("masuk_gagal");
  const h = await hashSandi(b.baru);
  await hak.ubahSandi(env, akun.id, h.hash, h.garam, h.iterasi, p.sesi.idHash);
  return json({ ok: true });
}

export const rute = {
  "POST /api/masuk": masuk,
  "POST /api/keluar": keluar,
  "GET /api/saya": saya,
  "POST /api/aktivasi": aktivasi,
  "POST /api/ganti-sandi": gantiSandi,
};
