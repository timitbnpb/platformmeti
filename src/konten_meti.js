// konten_meti.js: Berita METI (admin menulis, semua yang login membaca) dan Pustaka unggahan admin (migrasi 0033).
// D1 hanya lewat hak.baca/hak.tulis; foto di R2 (berita-meti/<32 hex>.<ext>), dokumen di R2 (pustaka-u/<32 hex>.<tipe>), tidak pernah di repo atau public/.
// Tulis hanya admin dan super. Draf (terbit=0) hanya admin/super; dokumen akses 'pengurus' hanya pengurus, kurator, wilayah, admin, super.
import * as hak from "./hak.js";
import { adaMetadata, bacaBiner, CT_DOK, disposisi, teksBersih, tglSah, tipeDokumen, tipeGambar } from "./agenda.js";
import { acak, bacaBody, gagal, json, perlu, PRIVAT } from "./util.js";

const BACA = ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"];
const TULIS = ["admin", "super"];
const LIHAT_PENGURUS = ["pengurus", "kurator", "wilayah", "admin", "super"];
const RE_BM = /^bm-\d{1,17}$/;
const RE_PU = /^pu-\d{1,17}$/;
const MAKS_FOTO = 5 * 1024 * 1024;
const MAKS_DOK = 50 * 1024 * 1024;
const BATAS_LAJU = 300;
const JENIS_BERITA = ["liputan_media", "liputan_kegiatan", "siaran_pers"];
const JENIS_PUSTAKA = ["laporan", "kajian", "paparan", "regulasi", "panduan", "data", "lainnya"];
const KOLOM_DAFTAR_BM = ["id", "ref", "jenis", "judul", "tanggal", "media", "url", "ringkasan", "kota", "penulis", "foto_r2", "terbit"];
const KOLOM_PU = ["id", "ref", "judul", "penerbit", "tanggal_terbit", "jenis", "ringkasan", "bahasa", "akses", "tipe", "ukuran", "nama_berkas", "dibuat"];

const lajuLewat = async (env, akun) => (await hak.catatLaju(env, "kurasi:" + akun.id)) > BATAS_LAJU;
const adm = (akun) => TULIS.includes(akun.peran);
const bisaLihatPengurus = (akun) => LIHAT_PENGURUS.includes(akun.peran);
const refBaru = (awalan) => awalan + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, "0");

async function bacaSemua(env, akun, tabel, kueri = {}) {
  const semua = [];
  for (let hal = 1; hal <= 200; hal++) {
    const r = await hak.baca(env, akun, tabel, { ...kueri, hal });
    semua.push(...r);
    if (r.length < 50) break;
  }
  return semua;
}

// Teks opsional: null/"" = null; selain string bersih dalam batas = salah (undefined).
function teksOpt(v, maks) {
  if (v === null || v === "") return null;
  if (typeof v !== "string" || !teksBersih(v) || v.trim().length > maks) return undefined;
  return v.trim();
}
const urlSah = (v) => typeof v === "string" && /^https:\/\/\S+$/.test(v) && v.length <= 600 && teksBersih(v);

// Validasi berita; `lama` null = tambah (lengkap), objek = ubah sebagian digabung dengan baris lama. Null bila salah. Sama dengan CHECK migrasi 0033.
function cekBerita(b, lama) {
  const KUNCI = ["jenis", "judul", "tanggal", "media", "url", "ringkasan", "isi", "kota", "penulis", "terbit"];
  if (Object.keys(b).some((k) => !KUNCI.includes(k))) return null;
  const d = {};
  if ("jenis" in b) { if (!JENIS_BERITA.includes(b.jenis)) return null; d.jenis = b.jenis; }
  if ("judul" in b) { if (typeof b.judul !== "string" || !teksBersih(b.judul) || b.judul.trim().length < 5 || b.judul.trim().length > 300) return null; d.judul = b.judul.trim(); }
  if ("tanggal" in b) { if (!tglSah(b.tanggal)) return null; d.tanggal = b.tanggal; }
  for (const [k, m] of [["media", 120], ["ringkasan", 1000], ["kota", 80], ["penulis", 120]]) {
    if (k in b) { const v = teksOpt(b[k], m); if (v === undefined) return null; d[k] = v; }
  }
  if ("isi" in b) {
    if (b.isi !== null && (typeof b.isi !== "string" || b.isi.length > 40000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(b.isi))) return null;
    d.isi = b.isi === "" ? null : b.isi;
  }
  if ("url" in b) { if (b.url !== null && b.url !== "" && !urlSah(b.url)) return null; d.url = b.url || null; }
  if ("terbit" in b) { if (![0, 1, true, false].includes(b.terbit)) return null; d.terbit = b.terbit ? 1 : 0; }
  if (!lama && (!d.jenis || !d.judul || !d.tanggal)) return null;
  if (!Object.keys(d).length) return null;
  const akhir = { ...(lama ?? {}), ...d };
  if (akhir.jenis === "liputan_media" && (!akhir.media || akhir.media.length < 2 || !akhir.url)) return null;
  return d;
}

function cekPustaka(b) {
  const KUNCI = ["judul", "penerbit", "tanggal_terbit", "jenis", "ringkasan", "bahasa", "akses"];
  if (Object.keys(b).some((k) => !KUNCI.includes(k))) return null;
  const d = {};
  if ("judul" in b) { if (typeof b.judul !== "string" || !teksBersih(b.judul) || b.judul.trim().length < 3 || b.judul.trim().length > 300) return null; d.judul = b.judul.trim(); }
  if ("penerbit" in b) { if (typeof b.penerbit !== "string" || !teksBersih(b.penerbit) || b.penerbit.trim().length < 2 || b.penerbit.trim().length > 200) return null; d.penerbit = b.penerbit.trim(); }
  if ("tanggal_terbit" in b) { if (b.tanggal_terbit !== null && b.tanggal_terbit !== "" && !tglSah(b.tanggal_terbit)) return null; d.tanggal_terbit = b.tanggal_terbit || null; }
  if ("jenis" in b) { if (!JENIS_PUSTAKA.includes(b.jenis)) return null; d.jenis = b.jenis; }
  if ("ringkasan" in b) { const v = teksOpt(b.ringkasan, 1500); if (v === undefined) return null; d.ringkasan = v; }
  if ("bahasa" in b) { if (!["id", "en"].includes(b.bahasa)) return null; d.bahasa = b.bahasa; }
  if ("akses" in b) { if (!["anggota", "pengurus"].includes(b.akses)) return null; d.akses = b.akses; }
  return Object.keys(d).length ? d : null;
}

const fotoUrl = (r) => (r.foto_r2 ? `/api/berita-meti/foto/${r.ref}` : null);
const butirBerita = (r) => ({ ref: r.ref, jenis: r.jenis, judul: r.judul, tanggal: r.tanggal, media: r.media, url: r.url, ringkasan: r.ringkasan, kota: r.kota, penulis: r.penulis, foto: fotoUrl(r), terbit: r.terbit });
const urutBerita = (a, b) => b.tanggal.localeCompare(a.tanggal) || b.id - a.id;
const bacaBerita = async (env, akun, ref) => {
  const r = (await hak.baca(env, akun, "berita_meti", { where: { ref } }))[0];
  return r && (r.terbit === 1 || adm(akun)) ? r : null;
};
const bacaPustaka = async (env, akun, ref) => {
  const r = (await hak.baca(env, akun, "pustaka_unggah", { where: { ref } }))[0];
  return r && (r.akses === "anggota" || bisaLihatPengurus(akun)) ? r : null;
};
// Status otorisasi (0036) per ref untuk admin/super/pengurus; konten tanpa baris dianggap 'disahkan' (tayang sebelum aturan dua kunci).
const statusOto = async (env, akun, sumber) => {
  if (!hak.boleh(akun.peran, "baca", "konten_otorisasi", undefined, akun).ok && !adm(akun)) return null;
  return new Map((await bacaSemua(env, akun, "konten_otorisasi", { where: { sumber } })).map((o) => [o.ref, o.status]));
};
const hapusR2 = async (env, kunci) => { if (env.BERKAS && kunci) await env.BERKAS.delete(kunci).catch(() => {}); }; // yatim di R2 lebih ringan daripada baris tanpa berkas

export const rute = {
  // ---------------------------------------------- Berita METI ----------------------------------------------
  // Rute foto didaftarkan lebih dulu agar "foto" tidak pernah terbaca sebagai :ref.
  "GET /api/berita-meti/foto/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    if (!RE_BM.test(p.params.ref)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    const r = await bacaBerita(env, akun, p.params.ref);
    if (!r?.foto_r2) return gagal("tidak_ditemukan");
    const obj = await env.BERKAS.get(r.foto_r2);
    if (!obj) return gagal("tidak_ditemukan");
    return new Response(obj.body, {
      headers: { "content-type": { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[r.foto_tipe] ?? "application/octet-stream", "cache-control": "private, no-store", vary: "Cookie", "content-disposition": "inline", "x-content-type-options": "nosniff" },
    });
  },

  "GET /api/berita-meti": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    const baris = await bacaSemua(env, akun, "berita_meti", { where: adm(akun) ? {} : { terbit: 1 }, kolom: KOLOM_DAFTAR_BM, urut: "-id" });
    const st = await statusOto(env, akun, "berita_meti");
    return json({ baris: baris.sort(urutBerita).map((r) => ({ ...butirBerita(r), ...(st ? { otorisasi: st.get(r.ref) ?? "disahkan" } : {}) })) }, 200, PRIVAT);
  },

  "GET /api/berita-meti/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    if (!RE_BM.test(p.params.ref)) return gagal("tidak_ditemukan");
    const r = await bacaBerita(env, akun, p.params.ref);
    if (!r) return gagal("tidak_ditemukan");
    const st = await statusOto(env, akun, "berita_meti");
    return json({ ...butirBerita(r), isi: r.isi, ...(st ? { otorisasi: st.get(r.ref) ?? "disahkan" } : {}) }, 200, PRIVAT);
  },

  "POST /api/berita-meti": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const d = cekBerita(await bacaBody(req), null);
    if (!d) return gagal("masukan_salah");
    for (let coba = 0; coba < 4; coba++) {
      const ref = refBaru("bm-");
      try {
        await hak.tulis(env, akun, "berita_meti", "tambah", d, null, { ref });
        return json({ ref, otorisasi: "menunggu" }, 201, PRIVAT);
      } catch (e) { if (e?.kode !== "konflik" || coba === 3) throw e; }
    }
  },

  "PATCH /api/berita-meti/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_BM.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const b = await bacaBody(req);
    const ada = (await hak.baca(env, akun, "berita_meti", { where: { ref } }))[0];
    if (!ada) return gagal("tidak_ditemukan");
    const d = cekBerita(b, ada);
    if (!d) return gagal("masukan_salah");
    await hak.tulis(env, akun, "berita_meti", "ubah", d, ada.id);
    return json({ ref, otorisasi: (await statusOto(env, akun, "berita_meti"))?.get(ref) ?? "disahkan" }, 200, PRIVAT);
  },

  "DELETE /api/berita-meti/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_BM.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const r = (await hak.baca(env, akun, "berita_meti", { where: { ref } }))[0];
    if (!r) return gagal("tidak_ditemukan");
    await hak.tulis(env, akun, "berita_meti", "hapus", {}, r.id);
    await hapusR2(env, r.foto_r2);
    return json({ ok: true }, 200, PRIVAT);
  },

  // PUT /api/berita-meti/:ref/foto: badan = gambar mentah; menggantikan foto lama.
  "PUT /api/berita-meti/:ref/foto": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_BM.test(ref)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const r = (await hak.baca(env, akun, "berita_meti", { where: { ref } }))[0];
    if (!r) return gagal("tidak_ditemukan");
    const badan = await bacaBiner(req, MAKS_FOTO);
    const t = tipeGambar(badan);
    if (!badan.length || !t) return gagal("masukan_salah");
    const [mime, ext] = t;
    if (adaMetadata(badan, ext)) return gagal("masukan_salah");
    const kunci = `berita-meti/${acak(16)}.${ext}`;
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: mime } });
    try {
      await hak.tulis(env, akun, "berita_meti", "ubah", {}, r.id, { foto_r2: kunci, foto_tipe: mime.slice(6) });
    } catch (e) { await hapusR2(env, kunci); throw e; }
    await hapusR2(env, r.foto_r2);
    return json({ ref, foto: `/api/berita-meti/foto/${ref}` }, 200, PRIVAT);
  },

  "DELETE /api/berita-meti/:ref/foto": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_BM.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const r = (await hak.baca(env, akun, "berita_meti", { where: { ref } }))[0];
    if (!r) return gagal("tidak_ditemukan");
    if (r.foto_r2) {
      await hak.tulis(env, akun, "berita_meti", "ubah", {}, r.id, { foto_r2: null, foto_tipe: null });
      await hapusR2(env, r.foto_r2);
    }
    return json({ ref, foto: null }, 200, PRIVAT);
  },

  // ---------------------------------------------- Pustaka unggahan ----------------------------------------------
  "GET /api/pustaka-unggah": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    const baris = await bacaSemua(env, akun, "pustaka_unggah", { where: bisaLihatPengurus(akun) ? {} : { akses: "anggota" }, kolom: KOLOM_PU, urut: "-id" });
    const st = await statusOto(env, akun, "pustaka_unggah");
    return json({ baris: baris.map(({ id, ...x }) => ({ ...x, ...(st ? { otorisasi: st.get(x.ref) ?? "disahkan" } : {}) })) }, 200, PRIVAT);
  },

  // POST /api/pustaka-unggah?judul=&penerbit=&jenis=&akses=&nama=&tanggal_terbit=&bahasa=&ringkasan=  (badan = berkas mentah, maks 50 MB)
  "POST /api/pustaka-unggah": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    if (!env.BERKAS) return gagal("layanan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const q = new URL(req.url).searchParams;
    const nama = q.get("nama");
    if (!teksBersih(nama ?? "") || !nama || !nama.trim() || nama.length > 200 || /[\\/]/.test(nama)) return gagal("masukan_salah");
    const b = {};
    for (const k of ["judul", "penerbit", "jenis", "akses"]) { const v = q.get(k); if (v === null) return gagal("masukan_salah"); b[k] = v; }
    for (const k of ["tanggal_terbit", "bahasa", "ringkasan"]) { const v = q.get(k); if (v !== null && v !== "") b[k] = v; }
    const d = cekPustaka(b);
    if (!d || !d.judul || !d.penerbit || !d.jenis || !d.akses) return gagal("masukan_salah");
    const badan = await bacaBiner(req, MAKS_DOK);
    if (!badan.length) return gagal("masukan_salah");
    const tipe = tipeDokumen(badan, nama);
    if (!tipe) return gagal("masukan_salah", 415);

    const kunci = `pustaka-u/${acak(16)}.${tipe}`;
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: CT_DOK[tipe] } });
    for (let coba = 0; coba < 4; coba++) {
      const ref = refBaru("pu-");
      try {
        await hak.tulis(env, akun, "pustaka_unggah", "tambah", d, null, { ref, kunci_r2: kunci, tipe, ukuran: badan.length, nama_berkas: nama });
        return json({ ref, otorisasi: "menunggu" }, 201, PRIVAT);
      } catch (e) {
        if (e?.kode !== "konflik" || coba === 3) { await hapusR2(env, kunci); throw e; }
      }
    }
  },

  "PATCH /api/pustaka-unggah/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_PU.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const d = cekPustaka(await bacaBody(req));
    if (!d) return gagal("masukan_salah");
    const ada = (await hak.baca(env, akun, "pustaka_unggah", { where: { ref }, kolom: ["id"] }))[0];
    if (!ada) return gagal("tidak_ditemukan");
    await hak.tulis(env, akun, "pustaka_unggah", "ubah", d, ada.id);
    return json({ ref, otorisasi: (await statusOto(env, akun, "pustaka_unggah"))?.get(ref) ?? "disahkan" }, 200, PRIVAT);
  },

  "DELETE /api/pustaka-unggah/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_PU.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const r = (await hak.baca(env, akun, "pustaka_unggah", { where: { ref } }))[0];
    if (!r) return gagal("tidak_ditemukan");
    await hak.tulis(env, akun, "pustaka_unggah", "hapus", {}, r.id);
    await hapusR2(env, r.kunci_r2);
    return json({ ok: true }, 200, PRIVAT);
  },

  // GET /api/pustaka-unggah/:ref/unduh: 404 bila akses 'pengurus' dan pembaca anggota. Log unduhan pustaka TIDAK ditulis
  // (dokumen_unduh mewajibkan tujuan dan menurunkan status 'pernah' persetujuan alur /api/pustaka); ini tercatat di laporan.
  "GET /api/pustaka-unggah/:ref/unduh": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    if (!RE_PU.test(p.params.ref)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    const r = await bacaPustaka(env, akun, p.params.ref);
    if (!r) return gagal("tidak_ditemukan");
    const obj = await env.BERKAS.get(r.kunci_r2);
    if (!obj) return gagal("tidak_ditemukan");
    return new Response(obj.body, {
      headers: { "content-type": CT_DOK[r.tipe] ?? "application/octet-stream", "content-disposition": disposisi(r.nama_berkas), "x-content-type-options": "nosniff", "cache-control": "private, no-store", vary: "Cookie" },
    });
  },
};
