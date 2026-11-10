// meti_wilayah.js: modul METI Wilayah (migrasi 0015). Status/profil dibaca semua akun masuk (hanya kontak resmi kantor);
// pengajuan oleh akun masuk; sunting dan persetujuan tahap hanya admin. D1 hanya lewat hak.js; berkas di R2 BERKAS meti-wilayah/<id>/...
import katalog from "../public/data/meti-wilayah.json" with { type: "json" };
import * as hak from "./hak.js";
import { acak, bacaBiner, bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
export const NAMA_PROV = new Map(katalog.provinsi.map((p) => [p.kode, p.nama]));
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const KONTROL = /[\u0000-\u001f\u007f]/;
const RE_ID = /^\d{1,12}$/, RE_TGL = /^\d{4}-\d{2}-\d{2}$/, RE_TELP = /^[0-9+ ()-]{6,20}$/;
const MAKS_BERKAS = 5 * 1024 * 1024;
const KIT = new Map(katalog.kit.map((k) => [k.id, k]));
const MIME = { pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", jpg: "image/jpeg", png: "image/png" };

const teks = (v, min, maks) => typeof v === "string" && !KONTROL.test(v) && v.trim().length >= min && v.trim().length <= maks;
const opsi = (v, maks) => (v == null || v === "" ? null : teks(v, 1, maks) ? v.trim() : false);
const kodeSah = (k) => NAMA_PROV.has(k);
const laju = async (env, akun, awalan, batas) => (await hak.sistem.catatLaju(env, "koreksi:" + awalan + akun.id, 3600)) > batas;

// Status "per tanggal, sumber": pasangan terbanyak di antara baris bukan 'belum'; selisih dihitung supaya layar jujur.
export function ringkasSumber(baris) {
  const hit = new Map();
  for (const b of baris) if (b.status !== "belum" && b.sumber) { const k = (b.status_per || "") + "|" + b.sumber; hit.set(k, (hit.get(k) || 0) + 1); }
  const urut = [...hit.entries()].sort((a, b) => b[1] - a[1]);
  if (!urut.length) return { sumber: null, status_per: null, lainnya: 0 };
  const [per, sumber] = urut[0][0].split("|");
  return { sumber, status_per: per || null, lainnya: urut.length - 1 };
}

function tipeBerkas(b) {
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf";
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4) return "docx";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  return null;
}
// Isi ajuan: nama calon pengurus dan sekretariat (publik setelah disetujui), kontak pengaju (hanya pemilik dan admin).
function isiAjuan(b) {
  const ketua = opsi(b.ketua, 120), sekretaris = opsi(b.sekretaris, 120), bendahara = opsi(b.bendahara, 120), sekretariat = opsi(b.sekretariat, 300), kontak = opsi(b.kontak, 120);
  if (!ketua || !sekretaris || !bendahara || !sekretariat || kontak === false) return null;
  const arr = (v, n, maks) => Array.isArray(v) && v.length <= n && v.every((x) => teks(x, 1, maks)) ? v.map((x) => x.trim()) : null;
  const formatur = b.formatur == null ? [] : arr(b.formatur, 10, 120), bidang = arr(b.bidang, 8, 80);
  if (!formatur || !bidang || !bidang.length || JSON.stringify(bidang).length > 600) return null;
  return { ketua, sekretaris, bendahara, sekretariat, formatur, bidang, ...(kontak ? { kontak } : {}) };
}

export const rute = {
  "GET /api/meti-wilayah": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const baris = await hak.metiWilayahDaftar(env, akun);
    if (!baris) return NONAKTIF();
    const hitung = { berdiri: 0, segera: 0, rencana: 0, belum: 0 };
    for (const b of baris) hitung[b.status]++;
    hitung.belum += katalog.provinsi.length - baris.length; // provinsi tanpa baris = belum
    return json({ wilayah: baris, hitung, ...ringkasSumber(baris), versi_angka: katalog.versi_angka }, 200, PRIVAT);
  },

  "GET /api/meti-wilayah/ajuan/saya": async (req, env, ctx, p) => {
    const r = await hak.metiWilayahAjuanSaya(env, perlu(p));
    return r ? json({ ajuan: r }, 200, PRIVAT) : NONAKTIF();
  },

  "GET /api/meti-wilayah/:kode": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!kodeSah(p.params.kode)) return gagal("tidak_ditemukan");
    const r = await hak.metiWilayahBaca(env, akun, p.params.kode);
    if (!r) return NONAKTIF();
    const ang = katalog.provinsi.find((x) => x.kode === p.params.kode);
    return json({ nama: NAMA_PROV.get(p.params.kode), wilayah: r.wilayah, ajuan_saya: r.ajuan_saya, anggota: { individu: ang.individu, organisasi: ang.organisasi } }, 200, PRIVAT);
  },

  "POST /api/meti-wilayah/ajuan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 8192);
    if (typeof b.kode !== "string" || !kodeSah(b.kode)) return gagal("masukan_salah", 422);
    const isi = isiAjuan(b);
    if (!isi) return gagal("masukan_salah", 422);
    if (await laju(env, akun, "mw|", 10)) return gagal("laju_terlampaui");
    const r = await hak.metiWilayahAjuanBaru(env, akun, { kode: b.kode, isi });
    if (r === null) return NONAKTIF();
    return r ? json({ id: r.id }, 201, PRIVAT) : gagal("konflik");
  },

  // Badan biner (pdf, docx, jpg, png; maks 5 MB; maks 5 berkas per ajuan). Nama asli hanya sebagai label.
  "POST /api/meti-wilayah/ajuan/:id/berkas": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    if (await laju(env, akun, "mwb|", 20)) return gagal("laju_terlampaui");
    const id = Number(p.params.id);
    const ada = await hak.metiWilayahAjuanBaca(env, akun, id);
    if (ada === null) return NONAKTIF();
    if (!ada || ada.akun_id !== akun.id || !["diajukan", "ditinjau"].includes(ada.status)) return gagal("tidak_ditemukan");
    const badan = await bacaBiner(req, MAKS_BERKAS), ext = tipeBerkas(badan);
    if (!badan.length || !ext) return gagal("masukan_salah", 422);
    const label = (new URL(req.url).searchParams.get("nama") || "").replace(/[^\w .()-]/g, "_").slice(0, 80) || "berkas";
    const kunci = `meti-wilayah/${id}/${acak(16)}.${ext}`;
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: MIME[ext] } });
    let ok;
    try { ok = await hak.metiWilayahBerkasTambah(env, akun, id, { nama: label, ext, ukuran: badan.length, kunci }); }
    catch (e) { await env.BERKAS.delete(kunci).catch(() => {}); throw e; }
    if (!ok) { await env.BERKAS.delete(kunci).catch(() => {}); return gagal("konflik"); }
    return json({ ok: true }, 201, PRIVAT);
  },

  // Pemilik ajuan atau admin.
  "GET /api/meti-wilayah/ajuan/:id/berkas/:n": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id) || !/^\d$/.test(p.params.n)) return gagal("tidak_ditemukan");
    const a = await hak.metiWilayahAjuanBaca(env, akun, Number(p.params.id));
    const b = a && a.berkas[Number(p.params.n)];
    if (!b) return gagal("tidak_ditemukan");
    const o = await env.BERKAS?.get(b.kunci);
    if (!o) return gagal("berkas_belum_ada");
    const nama = `${b.nama.replace(/\.[A-Za-z0-9]+$/, "")}.${b.ext}`.replace(/[^\w.-]/g, "_");
    return new Response(o.body, { status: 200, headers: { ...PRIVAT, "content-type": MIME[b.ext] || "application/octet-stream", "content-disposition": `attachment; filename="${nama}"` } });
  },

  // Kit pelantikan (panduan, templat SK): R2 meti-wilayah/kit/<id>.<ext>, untuk akun masuk. Belum diunggah = 404 berkas_belum_ada.
  "GET /api/meti-wilayah/kit/:nama": async (req, env, ctx, p) => {
    perlu(p);
    const k = KIT.get(p.params.nama);
    if (!k) return gagal("tidak_ditemukan");
    const o = await env.BERKAS?.get(`meti-wilayah/kit/${k.id}.${k.ext}`);
    if (!o) return gagal("berkas_belum_ada");
    return new Response(o.body, { status: 200, headers: { ...PRIVAT, "content-type": MIME[k.ext], "content-disposition": `attachment; filename="${k.id}.${k.ext}"` } });
  },

  "GET /api/admin/meti-wilayah": async (req, env, ctx, p) => {
    const r = await hak.metiWilayahAdmin(env, perlu(p, ADM));
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "PATCH /api/admin/meti-wilayah/:kode": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!kodeSah(p.params.kode)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 8192), d = {};
    const teksOpsi = (k, maks) => { if (k in b) { const v = opsi(b[k], maks); if (v === false) return false; d[k] = v; } return true; };
    const tgl = (k) => { if (k in b) { if (b[k] !== null && !(typeof b[k] === "string" && RE_TGL.test(b[k]) && !Number.isNaN(Date.parse(b[k])))) return false; d[k] = b[k]; } return true; };
    if ("status" in b) { if (!hak.STATUS_MW.includes(b.status)) return gagal("masukan_salah", 422); d.status = b.status; }
    const ok = teksOpsi("ketua", 120) && teksOpsi("sekretaris", 120) && teksOpsi("bendahara", 120) && teksOpsi("sekretariat", 300) && teksOpsi("sk_nomor", 120)
      && teksOpsi("masa_bakti", 40) && teksOpsi("sumber", 300) && tgl("sk_tanggal") && tgl("tgl_pelantikan") && tgl("status_per");
    if (!ok) return gagal("masukan_salah", 422);
    if ("kontak_surel" in b) { const v = opsi(b.kontak_surel, 254); if (v === false || (v && !/^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/.test(v))) return gagal("masukan_salah", 422); d.kontak_surel = v; }
    if ("kontak_telp" in b) { const v = opsi(b.kontak_telp, 20); if (v === false || (v && !RE_TELP.test(v))) return gagal("masukan_salah", 422); d.kontak_telp = v; }
    if ("bidang" in b) { if (!(Array.isArray(b.bidang) && b.bidang.length <= 10 && b.bidang.every((x) => teks(x, 1, 120)))) return gagal("masukan_salah", 422); d.bidang = b.bidang.map((x) => x.trim()); }
    if (!Object.keys(d).length) return gagal("masukan_salah", 422);
    const r = await hak.metiWilayahUbah(env, akun, p.params.kode, d);
    return r ? json({ ok: true }, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/admin/meti-wilayah/ajuan/:id/tahap": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 4096);
    if (![...hak.TAHAP_MW.slice(1), "ditolak"].includes(b.ke)) return gagal("masukan_salah", 422);
    const d = {};
    for (const [k, maks] of [["catatan", 1000], ["sk_nomor", 120], ["masa_bakti", 40]]) { const v = opsi(b[k], maks); if (v === false) return gagal("masukan_salah", 422); d[k] = v; }
    for (const k of ["sk_tanggal", "tgl_pelantikan"]) { if (b[k] != null && !(typeof b[k] === "string" && RE_TGL.test(b[k]) && !Number.isNaN(Date.parse(b[k])))) return gagal("masukan_salah", 422); d[k] = b[k] ?? null; }
    if (b.ke === "ditolak" && !d.catatan) return gagal("masukan_salah", 422);
    const r = await hak.metiWilayahTahap(env, akun, Number(p.params.id), b.ke, d);
    if (r === null) return NONAKTIF();
    return r ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
};

// Halaman /meti-wilayah/<kode>: kode sah -> nama provinsi untuk <title> (SSR judul); lain -> null.
export const namaProvinsi = (kode) => NAMA_PROV.get(kode) ?? null;
