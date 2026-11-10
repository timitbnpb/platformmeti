// wilayah_kelola.js: portal METI Wilayah (migrasi 0019). Pengurus wilayah (akun yang ditautkan admin ke SATU provinsi) mengunggah data wilayahnya; semua masuk
// antrean kurasi Admin yang sama dengan portal lembaga (/api/admin/portal?tipe=wilayah). Yang disetujui tampil di halaman publik wilayah dengan tanggal.
// Berkas (PDF SK, foto resmi) di R2 BERKAS wilayah/<kode>/<acak>, jenis dari magic byte. Foto wajib pernyataan persetujuan. D1 hanya lewat hak.js.
import * as hak from "./hak.js";
import { NAMA_PROV } from "./meti_wilayah.js";
import { denganLampiran, sniff, namaAman } from "./pesan.js";
import { bersih, bukti, hanyaKunci, pilih, TEKNOLOGI, teks, tahun } from "./portal.js";
import { acak, bacaBody, formTerbatas, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const SALAH = () => new Galat("masukan_salah", 422);
const RE_REF = /^[A-Za-z0-9_-]{2,60}$/, RE_TGL = /^\d{4}-\d{2}-\d{2}$/, RE_ID = /^\d{1,12}$/;
const SURAT_BEBAS = /@(gmail|yahoo|ymail|hotmail|outlook|live|icloud|proton|protonmail|aol|gmx|mail)\./i; // kontak resmi organisasi saja
const MAKS = { sk: 5 * 1024 * 1024, foto: 2 * 1024 * 1024 };
const FOTO = ["image/png", "image/jpeg", "image/webp"];

const tgl = (v, wajib = true) => {
  if (v == null || v === "") { if (wajib) throw SALAH(); return null; }
  if (typeof v !== "string" || !RE_TGL.test(v) || Number.isNaN(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) throw SALAH();
  return v;
};
const bil = (v, maks) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > maks) throw SALAH();
  return n;
};
// Surel/telepon resmi kantor: bentuknya diperiksa sendiri (teks() menolak surel dan deret angka karena itu data pribadi di kolom lain).
const kontak = (v, jenis) => {
  if (v == null || v === "") return null;
  if (typeof v !== "string") throw SALAH();
  const s = v.trim();
  if (jenis === "surel" ? !(/^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/.test(s) && s.length <= 120) || SURAT_BEBAS.test(s) : !/^[0-9+ ()-]{6,20}$/.test(s)) throw SALAH();
  return s;
};

/** Murni, diekspor untuk uji. -> { isi, berkas: "sk"|"foto"|null (jenis berkas yang diizinkan/dibutuhkan), wajibBerkas } atau lempar 422. */
export function periksaWilayah(jenis, x) {
  if (!hak.JENIS_WILAYAH.includes(jenis) || !x || typeof x !== "object" || Array.isArray(x)) throw SALAH();
  let isi, berkas = null, wajibBerkas = false;
  if (jenis === "sk") {
    hanyaKunci(x, ["nomor", "tanggal", "perihal"]);
    isi = bersih({ nomor: teks(x.nomor, 120, { wajib: true }), tanggal: tgl(x.tanggal), perihal: teks(x.perihal, 200) }); berkas = "sk"; wajibBerkas = true;
  } else if (jenis === "sekretariat") {
    hanyaKunci(x, ["alamat", "kota", "telepon_kantor", "surel_resmi"]);
    isi = bersih({ alamat: teks(x.alamat, 200), kota: teks(x.kota, 80), telepon_kantor: kontak(x.telepon_kantor, "telepon"), surel_resmi: kontak(x.surel_resmi, "surel") });
  } else if (jenis === "pengurus") {
    hanyaKunci(x, ["nama", "jabatan"]);
    isi = bersih({ nama: teks(x.nama, 120, { wajib: true }), jabatan: teks(x.jabatan, 120, { wajib: true }) }); berkas = "foto";
  } else if (jenis === "bidang") {
    hanyaKunci(x, ["bidang"]);
    if (!Array.isArray(x.bidang) || !x.bidang.length || x.bidang.length > 10) throw SALAH();
    isi = { bidang: [...new Set(x.bidang.map((b) => teks(b, 80, { wajib: true })))] };
  } else if (jenis === "keanggotaan") {
    hanyaKunci(x, ["jumlah_anggota", "organisasi_ids"]);
    if (x.organisasi_ids != null && (!Array.isArray(x.organisasi_ids) || x.organisasi_ids.length > 50 || x.organisasi_ids.some((i) => typeof i !== "string" || !RE_REF.test(i)))) throw SALAH();
    isi = bersih({ jumlah_anggota: bil(x.jumlah_anggota, 100000), organisasi_ids: x.organisasi_ids ? [...new Set(x.organisasi_ids)] : null });
  } else if (jenis === "kegiatan") {
    hanyaKunci(x, ["judul", "tanggal", "ringkasan"]);
    isi = bersih({ judul: teks(x.judul, 200, { wajib: true }), tanggal: tgl(x.tanggal), ringkasan: teks(x.ringkasan, 600, { baris: true }) }); berkas = "foto";
  } else {
    hanyaKunci(x, ["nama", "teknologi", "kapasitas_mw", "deskripsi"]);
    const kap = x.kapasitas_mw == null || x.kapasitas_mw === "" ? null : Number(x.kapasitas_mw);
    if (kap !== null && !(Number.isFinite(kap) && kap > 0 && kap <= 100000)) throw SALAH();
    isi = bersih({ nama: teks(x.nama, 120, { wajib: true }), teknologi: pilih(x.teknologi, TEKNOLOGI), kapasitas_mw: kap, deskripsi: teks(x.deskripsi, 300) });
  }
  if (!Object.keys(isi).length) throw SALAH();
  return { isi, berkas, wajibBerkas };
}

// multipart: data (JSON teks: { jenis, isi, bukti_url? }), setuju_foto ("1"), berkas (opsional). Jenis berkas dari byte awal.
async function bacaForm(req) {
  if (!/^multipart\/form-data/i.test(req.headers.get("content-type") || "")) throw new Galat("masukan_salah", 415);
  const fd = await formTerbatas(req, MAKS.sk + 65536);
  const mentah = fd.get("data");
  let b;
  try { if (typeof mentah !== "string" || mentah.length > 8192) throw 0; b = JSON.parse(mentah); } catch { throw SALAH(); }
  if (!b || typeof b !== "object" || Array.isArray(b)) throw SALAH();
  const f = fd.get("berkas");
  if (typeof f === "string") throw new Galat("masukan_salah", 415);
  let berkas = null;
  if (f && f.size > 0) {
    if (f.size > MAKS.sk) throw new Galat("terlalu_besar");
    const data = new Uint8Array(await f.arrayBuffer()), tipe = sniff(data);
    if (!tipe) throw new Galat("masukan_salah", 415);
    berkas = { data, tipe, nama: namaAman(f.name) };
  }
  return { b, berkas, setujuFoto: fd.get("setuju_foto") === "1" };
}

export const rute = {
  // Provinsi tautan akun + ajuannya (semua status). kode null = bukan pengurus wilayah.
  "GET /api/wilayah/kelola": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.wilayahSaya(env, akun);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/wilayah/kelola": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const kode = await hak.wilayahKode(env, akun); // gerbang awal sebelum membaca body besar
    if (kode === null) return NONAKTIF();
    if (kode === false) return gagal("dilarang");
    const { b, berkas, setujuFoto } = await bacaForm(req);
    const { isi, berkas: izin, wajibBerkas } = periksaWilayah(b.jenis, b.isi);
    const bkt = bukti(b.bukti_url, false);
    if (wajibBerkas && !berkas) return gagal("masukan_salah", 422);
    if (berkas) {
      if (!izin || (izin === "sk" ? berkas.tipe !== "application/pdf" : !FOTO.includes(berkas.tipe) || berkas.data.length > MAKS.foto)) return gagal("masukan_salah", 422);
      if (izin === "foto" && !setujuFoto) return gagal("persetujuan_wajib", 422);
    }
    if (!berkas && !bkt) return gagal("sumber_wajib", 422);
    if ((await hak.catatLaju(env, "koreksi:wj" + akun.id, 3600)) > 30) return gagal("laju_terlampaui");
    const kunci = berkas ? `wilayah/${kode}/${acak(12)}` : null;
    const r = await denganLampiran(env, berkas, kunci, (meta) => hak.wilayahAjuanBaru(env, akun, { kode, jenis: b.jenis, isi, bukti: bkt, berkas: meta, berkasKunci: kunci, persetujuanFoto: berkas && izin === "foto" ? 1 : 0 }));
    if (!r) return NONAKTIF();
    return json({ id: r.id }, 201, PRIVAT);
  },

  // Lapisan publik satu wilayah: ajuan yang sudah disetujui, dikelompokkan per jenis; label dan tanggal ditampilkan klien.
  "GET /api/wilayah/terbit/:kode": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!NAMA_PROV.has(p.params.kode)) return gagal("tidak_ditemukan");
    const r = (await hak.wilayahTerbit(env, akun, p.params.kode)) ?? [];
    const per = Object.fromEntries(hak.JENIS_WILAYAH.map((j) => [j, []]));
    for (const x of r) per[x.jenis].push({ id: x.id, ...x.isi, disetujui: x.tanggal, bukti_url: x.bukti_url, berkas: x.berkas ? { nama: x.berkas.nama, tipe: x.berkas.tipe } : null });
    return json({ kode: p.params.kode, nama: NAMA_PROV.get(p.params.kode), ...per }, 200, PRIVAT);
  },

  "GET /api/wilayah/berkas/:id": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.wilayahBerkas(env, akun, p.params.id);
    if (r === null) return NONAKTIF();
    if (!r.ada || !env.BERKAS) return gagal("tidak_ditemukan");
    const o = await env.BERKAS.get(r.kunci);
    if (!o) return gagal("tidak_ditemukan");
    const gambar = r.berkas.tipe.startsWith("image/");
    return new Response(o.body, { status: 200, headers: { ...PRIVAT, "content-type": r.berkas.tipe, "content-disposition": `${gambar ? "inline" : "attachment"}; filename="${namaAman(r.berkas.nama).replace(/[^A-Za-z0-9._ -]/g, "_")}"`, "content-security-policy": "default-src 'none'; sandbox", "x-content-type-options": "nosniff" } });
  },

  // ---------------- admin: tautan akun ke provinsi ----------------
  "GET /api/admin/wilayah-akun": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const r = await hak.wilayahAkunDaftar(env, akun);
    return r ? json({ baris: r.map((x) => ({ ...x, provinsi: NAMA_PROV.get(x.kode_prov) ?? null })) }, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/admin/wilayah-akun": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const b = await bacaBody(req, 1024);
    const akunId = b.akun_id == null ? null : RE_ID.test(String(b.akun_id)) ? Number(b.akun_id) : false, surel = typeof b.surel === "string" && b.surel.length <= 120 ? b.surel : null;
    if (akunId === false || (akunId === null) === (surel === null) || typeof b.kode_prov !== "string" || !NAMA_PROV.has(b.kode_prov)) return gagal("masukan_salah", 422);
    const r = await hak.wilayahAkunTaut(env, akun, { akunId, surel, kode: b.kode_prov });
    if (!r) return NONAKTIF();
    return r.ada ? json({ ok: true, akun_id: r.akun_id }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  "DELETE /api/admin/wilayah-akun/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const r = await hak.wilayahAkunLepas(env, akun, p.params.id);
    if (!r) return NONAKTIF();
    return r.dicabut ? json({ ok: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },
};
