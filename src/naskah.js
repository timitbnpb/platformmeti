// naskah.js: Portal otorisasi METI (migrasi 0036), konsep dua kunci. Admin/super memasukkan naskah; pengurus (atau super, tidak pernah atas naskahnya sendiri)
// mengotorisasi dan memberi evaluasi; anggota, kurator, wilayah hanya melihat status 'disahkan'.
// D1 hanya lewat hak.baca/hak.tulis/hak.naskahStatus (klausa 'naskah' menyaring baris: naskah yang tak boleh dilihat = 404, bukan 403).
// Lampiran di R2 (naskah/<32 hex>.<tipe>), tidak pernah di repo atau public/.
import * as hak from "./hak.js";
import { bacaBiner, CT_DOK, disposisi, teksBersih, tglSah, tipeDokumen } from "./agenda.js";
import { acak, bacaBody, gagal, json, perlu, PRIVAT } from "./util.js";

const BACA = ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"];
const MASUK = ["admin", "super"]; // kunci pertama: memasukkan, mengajukan, menarik
const PUTUS = ["pengurus", "super"]; // kunci kedua: setujui, tolak, revisi, evaluasi
const RE_NK = /^nk-\d{1,17}$/;
const JENIS = ["notulensi", "bahan", "kajian", "keputusan", "laporan", "lainnya"];
const STATUS = ["draf", "menunggu", "revisi", "disahkan", "ditolak", "ditarik"];
const MAKS_DOK = 50 * 1024 * 1024;
const BATAS_LAJU = 300;
const KOLOM_DAFTAR = ["id", "ref", "jenis", "judul", "ringkasan", "tanggal", "tipe", "ukuran", "nama_berkas", "status", "versi", "oleh", "diajukan", "disahkan_pada", "dibuat", "diubah"];

const lajuLewat = async (env, akun) => (await hak.catatLaju(env, "kurasi:" + akun.id)) > BATAS_LAJU;
const refBaru = () => "nk-" + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, "0");
const hapusR2 = async (env, kunci) => { if (env.BERKAS && kunci) await env.BERKAS.delete(kunci).catch(() => {}); }; // yatim di R2 lebih ringan daripada baris tanpa berkas

async function bacaSemua(env, akun, tabel, kueri = {}) {
  const semua = [];
  for (let hal = 1; hal <= 200; hal++) {
    const r = await hak.baca(env, akun, tabel, { ...kueri, hal });
    semua.push(...r);
    if (r.length < 50) break;
  }
  return semua;
}

// Teks opsional: null/"" = null; selain string bersih dalam batas = undefined (salah).
function teksOpt(v, maks) {
  if (v === null || v === "") return null;
  if (typeof v !== "string" || !teksBersih(v) || v.trim().length > maks) return undefined;
  return v.trim();
}

// Validasi; `lama` null = tambah (jenis, judul, tanggal wajib). Null bila salah. Sama dengan CHECK migrasi 0036.
function cekNaskah(b, lama) {
  const KUNCI = ["jenis", "judul", "ringkasan", "isi", "tanggal"];
  if (Object.keys(b).some((k) => !KUNCI.includes(k))) return null;
  const d = {};
  if ("jenis" in b) { if (!JENIS.includes(b.jenis)) return null; d.jenis = b.jenis; }
  if ("judul" in b) { if (typeof b.judul !== "string" || !teksBersih(b.judul) || b.judul.trim().length < 5 || b.judul.trim().length > 300) return null; d.judul = b.judul.trim(); }
  if ("tanggal" in b) { if (!tglSah(b.tanggal)) return null; d.tanggal = b.tanggal; }
  if ("ringkasan" in b) { const v = teksOpt(b.ringkasan, 1500); if (v === undefined) return null; d.ringkasan = v; }
  if ("isi" in b) {
    if (b.isi !== null && (typeof b.isi !== "string" || b.isi.length > 40000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(b.isi))) return null;
    d.isi = b.isi === "" ? null : b.isi;
  }
  if (!lama && (!d.jenis || !d.judul || !d.tanggal)) return null;
  return Object.keys(d).length ? d : null;
}

// Catatan dari klien: string 0..4000, bersih dari karakter kontrol. Undefined = salah.
function cekCatatan(b) {
  if (Object.keys(b).some((k) => k !== "catatan")) return undefined;
  return b.catatan === undefined ? null : teksOpt(b.catatan, 4000);
}

const butir = (r, akun) => ({
  ref: r.ref, jenis: r.jenis, judul: r.judul, ringkasan: r.ringkasan, tanggal: r.tanggal, status: r.status, versi: r.versi,
  lampiran: r.tipe ? { tipe: r.tipe, ukuran: r.ukuran, nama: r.nama_berkas } : null,
  diajukan: r.diajukan, disahkan_pada: r.disahkan_pada, dibuat: r.dibuat, diubah: r.diubah, milikku: r.oleh === akun.id,
});
// Naskah yang boleh dilihat peran ini (klausa hak.js); null = tak ada atau tak boleh dilihat -> pemanggil membalas 404.
const bacaSatu = async (env, akun, ref, kolom) => (await hak.baca(env, akun, "naskah", { where: { ref }, ...(kolom ? { kolom } : {}) }))[0] ?? null;

export const rute = {
  "GET /api/naskah": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    const q = new URL(req.url).searchParams;
    const where = {};
    const st = q.get("status"), jn = q.get("jenis"), cari = (q.get("q") ?? "").trim();
    if (st) { if (!STATUS.includes(st)) return gagal("masukan_salah"); where.status = st; }
    if (jn) { if (!JENIS.includes(jn)) return gagal("masukan_salah"); where.jenis = jn; }
    const kueri = { where, kolom: KOLOM_DAFTAR, urut: "-id" };
    if (cari) kueri.cari = { teks: cari, kolom: ["judul", "ringkasan"] };
    const baris = await bacaSemua(env, akun, "naskah", kueri);
    return json({ baris: baris.map((r) => butir(r, akun)) }, 200, PRIVAT);
  },

  "GET /api/naskah/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    if (!RE_NK.test(p.params.ref)) return gagal("tidak_ditemukan");
    const r = await bacaSatu(env, akun, p.params.ref);
    if (!r) return gagal("tidak_ditemukan");
    const hasil = { ...butir(r, akun), isi: r.isi };
    // Linimasa catatan hanya untuk pengurus, admin, super (matriks naskah_catatan); anggota, kurator, wilayah tidak melihatnya.
    if (hak.boleh(akun.peran, "baca", "naskah_catatan", undefined, akun).ok) {
      const cat = await bacaSemua(env, akun, "naskah_catatan", { where: { naskah_id: r.id }, urut: "id" });
      hasil.catatan = cat.map((c) => ({ versi: c.versi, peran: c.peran, jenis: c.jenis, isi: c.isi, kapan: c.kapan, milikku: c.oleh === akun.id }));
    }
    return json(hasil, 200, PRIVAT);
  },

  "POST /api/naskah": async (req, env, ctx, p) => {
    const akun = perlu(p, MASUK);
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const d = cekNaskah(await bacaBody(req), null);
    if (!d) return gagal("masukan_salah");
    for (let coba = 0; coba < 4; coba++) {
      const ref = refBaru();
      try {
        await hak.tulis(env, akun, "naskah", "tambah", d, null, { ref });
        return json({ ref, status: "draf" }, 201, PRIVAT);
      } catch (e) { if (e?.kode !== "konflik" || coba === 3) throw e; }
    }
  },

  "PATCH /api/naskah/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, MASUK);
    const ref = p.params.ref;
    if (!RE_NK.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const b = await bacaBody(req);
    const ada = await bacaSatu(env, akun, ref);
    if (!ada) return gagal("tidak_ditemukan");
    const d = cekNaskah(b, ada);
    if (!d) return gagal("masukan_salah");
    if (!["draf", "revisi"].includes(ada.status)) return gagal("konflik"); // trigger DB menolak juga
    await hak.tulis(env, akun, "naskah", "ubah", d, ada.id);
    return json({ ref }, 200, PRIVAT);
  },

  // Aksi status: badan { catatan? }. ajukan/tarik = kunci pertama; setujui/tolak/revisi = kunci kedua. Naskah tak terlihat peran itu = 404.
  ...Object.fromEntries(["ajukan", "setujui", "tolak", "revisi", "tarik"].map((aksi) => [`POST /api/naskah/:ref/${aksi}`, async (req, env, ctx, p) => {
    const akun = perlu(p, ["ajukan", "tarik"].includes(aksi) ? MASUK : PUTUS);
    const ref = p.params.ref;
    if (!RE_NK.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const catatan = cekCatatan(await bacaBody(req));
    if (catatan === undefined) return gagal("masukan_salah");
    const ada = await bacaSatu(env, akun, ref, ["id", "status"]);
    if (!ada) return gagal("tidak_ditemukan");
    const h = await hak.naskahStatus(env, akun, ada.id, aksi, catatan);
    return json({ ref, status: h.status, versi: h.versi }, 200, PRIVAT);
  }])),

  // Catatan evaluasi (pengurus, atau super atas naskah orang lain) pada naskah yang sudah diajukan.
  "POST /api/naskah/:ref/catatan": async (req, env, ctx, p) => {
    const akun = perlu(p, PUTUS);
    const ref = p.params.ref;
    if (!RE_NK.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const catatan = cekCatatan(await bacaBody(req));
    if (catatan === undefined || !catatan || catatan.length < 3) return gagal("masukan_salah");
    const ada = await bacaSatu(env, akun, ref, ["id", "status", "versi", "oleh"]);
    if (!ada) return gagal("tidak_ditemukan");
    if (ada.oleh === akun.id) return gagal("dilarang");
    if (ada.status === "draf") return gagal("konflik");
    await hak.tulis(env, akun, "naskah_catatan", "tambah", { jenis: "evaluasi", isi: catatan }, null, { naskah_id: ada.id, versi: ada.versi, peran: akun.peran });
    return json({ ref }, 201, PRIVAT);
  },

  // PUT /api/naskah/:ref/lampiran?nama=berkas.pdf  (badan = berkas mentah, maks 50 MB); hanya saat draf atau revisi; menggantikan lampiran lama.
  "PUT /api/naskah/:ref/lampiran": async (req, env, ctx, p) => {
    const akun = perlu(p, MASUK);
    const ref = p.params.ref;
    if (!RE_NK.test(ref)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const nama = new URL(req.url).searchParams.get("nama");
    if (!teksBersih(nama ?? "") || !nama || !nama.trim() || nama.length > 200 || /[\\/]/.test(nama)) return gagal("masukan_salah");
    const r = await bacaSatu(env, akun, ref);
    if (!r) return gagal("tidak_ditemukan");
    if (!["draf", "revisi"].includes(r.status)) return gagal("konflik");
    const badan = await bacaBiner(req, MAKS_DOK);
    if (!badan.length) return gagal("masukan_salah");
    const tipe = tipeDokumen(badan, nama);
    if (!tipe) return gagal("masukan_salah", 415);
    const kunci = `naskah/${acak(16)}.${tipe}`;
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: CT_DOK[tipe] } });
    try {
      await hak.tulis(env, akun, "naskah", "ubah", {}, r.id, { kunci_r2: kunci, tipe, ukuran: badan.length, nama_berkas: nama });
    } catch (e) { await hapusR2(env, kunci); throw e; }
    await hapusR2(env, r.kunci_r2);
    return json({ ref, lampiran: { tipe, ukuran: badan.length, nama } }, 200, PRIVAT);
  },

  // GET unduh: 404 bila naskah tak terlihat peran itu (bukan sah untuk anggota) atau tanpa lampiran. Log unduhan tidak ditulis (bukan dokumen_unduh).
  "GET /api/naskah/:ref/unduh": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    if (!RE_NK.test(p.params.ref)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    const r = await bacaSatu(env, akun, p.params.ref);
    if (!r?.kunci_r2) return gagal("tidak_ditemukan");
    const obj = await env.BERKAS.get(r.kunci_r2);
    if (!obj) return gagal("tidak_ditemukan");
    return new Response(obj.body, {
      headers: { "content-type": CT_DOK[r.tipe] ?? "application/octet-stream", "content-disposition": disposisi(r.nama_berkas), "x-content-type-options": "nosniff", "cache-control": "private, no-store", vary: "Cookie" },
    });
  },
};
