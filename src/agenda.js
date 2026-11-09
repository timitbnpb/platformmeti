// agenda.js: bukti agenda METI di Kalender (KP K20, JM-F11, DT §4.4). Kegiatan buatan admin, notulensi, foto, dokumen.
// D1 hanya lewat hak.baca/hak.tulis; foto di R2 (agenda/<32 hex>.<ext>), dokumen di R2 (agenda-dok/<32 hex>.<tipe>), tidak pernah di repo atau public/.
// 8 Nov 2026: semua TULIS hanya admin dan super; kurator baca saja.
import * as hak from "./hak.js";
import { acak, bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const BACA = ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"];
const TULIS = ["admin", "super"];
const LIHAT_PENGURUS = ["pengurus", "kurator", "wilayah", "admin", "super"]; // dokumen akses 'pengurus'
const RE_K = /^k-\d{1,17}$/;
const RE_TGL = /^\d{4}-\d{2}-\d{2}$/;
const JENIS_KEG = ["audiensi", "seminar", "konferensi", "lokakarya", "rapat", "kunjungan", "lainnya"];
const MAKS_DOK = 20 * 1024 * 1024;
const RE_REF = /^[a-z0-9_-]{1,40}$/;
const RE_ID = /^\d{1,12}$/;
const MAKS_FOTO = 5 * 1024 * 1024;
const BATAS_LAJU = 300;

// Bantu ----------------------------------------------------------------------------------------------------------
const lajuLewat = async (env, akun) => (await hak.catatLaju(env, "kurasi:" + akun.id)) > BATAS_LAJU;

// Acara METI di kalender.json: arsip internal (sumber.label "arsip-meti") atau acara ac_* bersumber situs METI. Galat baca = 503.
const acaraMeti = (b) => b?.sumber?.label === "arsip-meti" || (/^ac_/.test(b.id) && Array.isArray(b.sumber) && b.sumber.some((x) => x?.label === "situs-meti"));
// Baris arsip kalender.json; galat baca = 503.
async function barisArsip(env, req) {
  let res;
  try { res = await env.ASSETS.fetch(new Request(new URL("/data/kalender.json", req.url))); } catch { throw new Galat("layanan"); }
  if (!res.ok) throw new Galat("layanan");
  let k;
  try { k = await res.json(); } catch { throw new Galat("layanan"); }
  return Array.isArray(k?.baris) ? k.baris.filter((b) => typeof b?.id === "string" && acaraMeti(b)) : [];
}
const butirArsip = (b) => ({ ref: b.id, judul: b.judul ?? null, tanggal: b.tanggal ?? null, tanggal_selesai: b.tanggal_selesai ?? null, jenis: b.jenis ?? null, tempat: null, sumber: "arsip" });

// Ref sah: arsip (kalender.json) ATAU kegiatan D1 'k-*'. Mengembalikan info kegiatan atau null.
async function infoKegiatan(env, req, akun, ref) {
  if (!RE_REF.test(ref)) return null;
  if (RE_K.test(ref)) {
    const k = (await hak.baca(env, akun, "agenda_kegiatan", { where: { ref } }))[0];
    return k ? { ref: k.ref, judul: k.judul, tanggal: k.tanggal, tanggal_selesai: k.tanggal_selesai, jenis: k.jenis, tempat: k.tempat, sumber: "admin" } : null;
  }
  const b = (await barisArsip(env, req)).find((x) => x.id === ref);
  return b ? butirArsip(b) : null;
}
const refSah = async (env, req, akun, ref) => !!(await infoKegiatan(env, req, akun, ref));

// Semua halaman hak.baca (LIMIT 50 per halaman).
async function bacaSemua(env, akun, tabel, kueri = {}) {
  const semua = [];
  for (let hal = 1; hal <= 200; hal++) {
    const r = await hak.baca(env, akun, tabel, { ...kueri, hal });
    semua.push(...r);
    if (r.length < 50) break;
  }
  return semua;
}
const bisaLihatPengurus = (akun) => LIHAT_PENGURUS.includes(akun.peran);
const KOLOM_DOK = ["id", "bukti_id", "nama_berkas", "tipe", "ukuran", "asal", "dari", "akses", "sumber_resmi", "penerbit", "tanggal_terbit", "keterangan", "dibuat"];
// Dokumen yang terlihat oleh pembaca: anggota tidak melihat akses 'pengurus'.
const dokTerlihat = (env, akun, where = {}, kolom = KOLOM_DOK) =>
  bacaSemua(env, akun, "agenda_dokumen", { where: bisaLihatPengurus(akun) ? where : { ...where, akses: "anggota" }, kolom });
const bentukDok = ({ bukti_id, ...d }) => d;

const cariBukti = async (env, akun, ref) => (await hak.baca(env, akun, "agenda_bukti", { where: { kegiatan_ref: ref } }))[0] ?? null;

// Deteksi tipe dari magic byte.
function tipeGambar(b) {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ["image/jpeg", "jpg"];
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return ["image/png", "png"];
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
    && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return ["image/webp", "webp"];
  return null;
}

// Metadata (EXIF/GPS/XMP) tidak boleh tersimpan di server: true bila ditemukan.
const asc = (b, a, n) => String.fromCharCode(...b.subarray(a, a + n));
function adaMetadata(b, ext) {
  if (ext === "jpg") {
    let i = 2;
    while (i + 4 <= b.length) {
      if (b[i] !== 0xff) return false;
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m === 0xda || m === 0xd9) return false; // SOS/EOI: data citra, metadata sudah lewat
      if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      const len = (b[i + 2] << 8) | b[i + 3];
      if (len < 2) return true;
      if (m === 0xed) return true;
      if (m === 0xe1) {
        const h = asc(b, i + 4, 29);
        if (h.startsWith("Exif\0\0") || h.startsWith("http://ns.adobe.com/xap")) return true;
      }
      i += 2 + len;
    }
    return false;
  }
  if (ext === "png") {
    let i = 8;
    while (i + 8 <= b.length) {
      const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
      const t = asc(b, i + 4, 4);
      if (t === "eXIf") return true;
      if (t === "iTXt" || t === "zTXt" || t === "tEXt") {
        const isi = b.subarray(i + 8, i + 8 + Math.min(len, 80));
        const z = isi.indexOf(0);
        if (asc(isi, 0, z < 0 ? isi.length : z) === "XML:com.adobe.xmp") return true;
      }
      if (t === "IEND") return false;
      i += 12 + len;
    }
    return false;
  }
  let i = 12; // webp
  while (i + 8 <= b.length) {
    const t = asc(b, i, 4);
    const len = (b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] << 24)) >>> 0;
    if (t === "EXIF" || t === "XMP ") return true;
    if (t === "VP8X" && (b[i + 8] & 0x0c)) return true; // 0x08 EXIF, 0x04 XMP
    i += 8 + len + (len & 1);
  }
  return false;
}

// Baca badan biner bertahap, maks 5 MB.
async function bacaBiner(req, MAKS = MAKS_FOTO) {
  const cl = Number(req.headers.get("content-length"));
  if (cl > MAKS) throw new Galat("terlalu_besar");
  // Content-Length sah: isi satu buffer langsung (memori puncak ~1x ukuran, bukan 2x; tinjauan keamanan 8 Nov 2026)
  if (Number.isInteger(cl) && cl > 0 && req.body) {
    const b = new Uint8Array(cl), rd = req.body.getReader();
    let p = 0;
    for (;;) {
      const { value, done } = await rd.read();
      if (done) break;
      if (p + value.length > cl) { rd.cancel().catch(() => {}); throw new Galat("terlalu_besar"); }
      b.set(value, p); p += value.length;
    }
    return p === cl ? b : b.slice(0, p);
  }
  const bagian = [];
  let n = 0;
  if (req.body) {
    const rd = req.body.getReader();
    for (;;) {
      const { value, done } = await rd.read();
      if (done) break;
      n += value.length;
      if (n > MAKS) { rd.cancel().catch(() => {}); throw new Galat("terlalu_besar"); }
      bagian.push(value);
    }
  }
  const b = new Uint8Array(n);
  let p = 0;
  for (const x of bagian) { b.set(x, p); p += x.length; }
  return b;
}

// Tipe dokumen dari magic bytes + ekstensi nama. Mengembalikan "pdf"|"pptx"|"docx"|"xlsx"|null.
const MARKA_OOXML = { pptx: "ppt/", docx: "word/", xlsx: "xl/" };
const CT_DOK = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
function memuat(b, teks) {
  const t = [...teks].map((c) => c.charCodeAt(0));
  for (let i = b.indexOf(t[0]); i >= 0 && i + t.length <= b.length; i = b.indexOf(t[0], i + 1)) {
    let ok = true;
    for (let j = 1; j < t.length; j++) if (b[i + j] !== t[j]) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}
function tipeDokumen(b, nama) {
  const ext = (nama.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
  // ekstensi wajib sama dengan tipe: nama unduhan tidak boleh menyamar jadi .exe/.bat (tinjauan keamanan 8 Nov 2026)
  if (b.length >= 5 && asc(b, 0, 5) === "%PDF-") return ext === "pdf" ? "pdf" : null;
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4) {
    if (!MARKA_OOXML[ext]) return null;
    return memuat(b, "[Content_Types].xml") && memuat(b, MARKA_OOXML[ext]) ? ext : null;
  }
  return null;
}
// Nama berkas untuk Content-Disposition: ASCII aman + filename* UTF-8.
function disposisi(nama) {
  const ascii = nama.replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 150) || "dokumen";
  const utf = encodeURIComponent(nama).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf}`;
}
const tglSah = (v) => typeof v === "string" && RE_TGL.test(v) && !Number.isNaN(Date.parse(v + "T00:00:00Z")) && new Date(v + "T00:00:00Z").toISOString().slice(0, 10) === v;
const teksBersih = (v) => typeof v === "string" && !/[\u0000-\u001f\u007f]/.test(v);

const teksOpsional = (v, maks) => v === null || (typeof v === "string" && v.length <= maks);
const intOk = (v) => Number.isInteger(v) && v >= 0 && v <= 999;

// Validasi kegiatan: `lama` null = tambah (lengkap), objek = ubah sebagian digabung dengan baris lama. Null bila salah. Sama dengan CHECK migrasi 0032.
function cekKegiatan(b, lama) {
  const KUNCI = ["judul", "tanggal", "tanggal_selesai", "tempat", "jenis"];
  if (Object.keys(b).some((k) => !KUNCI.includes(k))) return null;
  const d = {};
  if ("judul" in b) { if (typeof b.judul !== "string" || !teksBersih(b.judul) || b.judul.trim().length < 3 || b.judul.trim().length > 200) return null; d.judul = b.judul.trim(); }
  if ("tanggal" in b) { if (!tglSah(b.tanggal)) return null; d.tanggal = b.tanggal; }
  if ("tanggal_selesai" in b) { if (b.tanggal_selesai !== null && !tglSah(b.tanggal_selesai)) return null; d.tanggal_selesai = b.tanggal_selesai; }
  if ("tempat" in b) { if (b.tempat !== null && (typeof b.tempat !== "string" || !teksBersih(b.tempat) || b.tempat.length > 200)) return null; d.tempat = b.tempat; }
  if ("jenis" in b) { if (!JENIS_KEG.includes(b.jenis)) return null; d.jenis = b.jenis; }
  if (!lama && (!d.judul || !d.tanggal || !d.jenis)) return null;
  if (!Object.keys(d).length) return null;
  const akhir = { ...(lama ?? {}), ...d };
  if (akhir.tanggal_selesai != null && akhir.tanggal_selesai < akhir.tanggal) return null;
  return d;
}

export const rute = {
  // Rute foto didaftarkan lebih dulu agar "foto" tidak pernah terbaca sebagai :ref.

  // GET /api/agenda/foto/:id: alirkan gambar dari R2.
  "GET /api/agenda/foto/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    const f = (await hak.baca(env, akun, "agenda_foto", { where: { id: Number(p.params.id) } }))[0];
    if (!f) return gagal("tidak_ditemukan");
    const obj = await env.BERKAS.get(f.kunci_r2);
    if (!obj) return gagal("tidak_ditemukan");
    return new Response(obj.body, {
      headers: {
        "content-type": f.tipe,
        "cache-control": "private, no-store",
        vary: "Cookie",
        "content-disposition": "inline",
        "x-content-type-options": "nosniff",
      },
    });
  },

  // PATCH /api/agenda/foto/:id {keterangan?, urutan?}
  "PATCH /api/agenda/foto/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const b = await bacaBody(req);
    const data = {};
    if ("keterangan" in b) { if (!teksOpsional(b.keterangan, 300) || (b.keterangan && !teksBersih(b.keterangan))) return gagal("masukan_salah"); data.keterangan = b.keterangan; }
    if ("urutan" in b) { if (!intOk(b.urutan)) return gagal("masukan_salah"); data.urutan = b.urutan; }
    if (!Object.keys(data).length) return gagal("masukan_salah");
    if (!(await hak.baca(env, akun, "agenda_foto", { where: { id: Number(p.params.id) }, kolom: ["id"] })).length) return gagal("tidak_ditemukan");
    await hak.tulis(env, akun, "agenda_foto", "ubah", data, p.params.id);
    return json({ id: Number(p.params.id) }, 200, PRIVAT);
  },

  // DELETE /api/agenda/foto/:id: hapus baris D1 dulu, lalu objek R2.
  "DELETE /api/agenda/foto/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const f = (await hak.baca(env, akun, "agenda_foto", { where: { id: Number(p.params.id) } }))[0];
    if (!f) return gagal("tidak_ditemukan");
    await hak.tulis(env, akun, "agenda_foto", "hapus", {}, p.params.id);
    if (env.BERKAS) await env.BERKAS.delete(f.kunci_r2).catch(() => {}); // yatim di R2 lebih ringan daripada baris D1 tanpa berkas
    return json({ ok: true }, 200, PRIVAT);
  },

  // GET /api/agenda/sumber-resmi: dokumen sumber resmi untuk semua yang login. Didaftarkan sebelum :ref.
  "GET /api/agenda/sumber-resmi": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    const dok = await bacaSemua(env, akun, "agenda_dokumen", { where: { sumber_resmi: 1 } });
    if (!dok.length) return json({ dokumen: [] }, 200, PRIVAT);
    const bukti = new Map((await bacaSemua(env, akun, "agenda_bukti", { kolom: ["id", "kegiatan_ref"] })).map((b) => [b.id, b.kegiatan_ref]));
    const keg = new Map((await bacaSemua(env, akun, "agenda_kegiatan", { kolom: ["ref", "judul", "tanggal"] })).map((k) => [k.ref, k]));
    let arsip = null;
    const cariArsip = async (ref) => {
      if (!arsip) { try { arsip = new Map((await barisArsip(env, req)).map((b) => [b.id, b])); } catch { arsip = new Map(); } }
      return arsip.get(ref);
    };
    const hasil = [];
    for (const d of dok) {
      const ref = bukti.get(d.bukti_id);
      const k = RE_K.test(ref ?? "") ? keg.get(ref) : await cariArsip(ref);
      hasil.push({ id: d.id, nama_berkas: d.nama_berkas, tipe: d.tipe, penerbit: d.penerbit, tanggal_terbit: d.tanggal_terbit, keterangan: d.keterangan,
        kegiatan: { ref, judul: k?.judul ?? null, tanggal: k?.tanggal ?? null } });
    }
    hasil.sort((a, b) => (b.tanggal_terbit ?? "").localeCompare(a.tanggal_terbit ?? "") || b.id - a.id);
    return json({ dokumen: hasil }, 200, PRIVAT);
  },

  // POST /api/agenda/kegiatan {judul, tanggal, tanggal_selesai?, tempat?, jenis} -> 201 {ref}
  "POST /api/agenda/kegiatan": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const b = await bacaBody(req);
    const d = cekKegiatan(b, null);
    if (!d) return gagal("masukan_salah");
    for (let coba = 0; coba < 4; coba++) {
      const ref = "k-" + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, "0");
      try {
        await hak.tulis(env, akun, "agenda_kegiatan", "tambah", d, null, { ref });
        return json({ ref }, 201, PRIVAT);
      } catch (e) { if (e?.kode !== "konflik" || coba === 3) throw e; }
    }
  },

  // PATCH /api/agenda/kegiatan/:ref (sebagian kolom)
  "PATCH /api/agenda/kegiatan/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_K.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const b = await bacaBody(req);
    const ada = (await hak.baca(env, akun, "agenda_kegiatan", { where: { ref } }))[0];
    if (!ada) return gagal("tidak_ditemukan");
    const d = cekKegiatan(b, ada);
    if (!d) return gagal("masukan_salah");
    await hak.tulis(env, akun, "agenda_kegiatan", "ubah", d, ada.id);
    return json({ ref }, 200, PRIVAT);
  },

  // DELETE /api/agenda/kegiatan/:ref: kegiatan + bukti (cascade foto, dokumen) + objek R2.
  "DELETE /api/agenda/kegiatan/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_K.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const k = (await hak.baca(env, akun, "agenda_kegiatan", { where: { ref } }))[0];
    if (!k) return gagal("tidak_ditemukan");
    const bukti = await cariBukti(env, akun, ref);
    let kunci = [];
    if (bukti) {
      kunci = [...(await bacaSemua(env, akun, "agenda_foto", { where: { bukti_id: bukti.id }, kolom: ["kunci_r2"] })),
        ...(await bacaSemua(env, akun, "agenda_dokumen", { where: { bukti_id: bukti.id }, kolom: ["kunci_r2"] }))].map((x) => x.kunci_r2);
      await hak.tulis(env, akun, "agenda_bukti", "hapus", {}, bukti.id); // ON DELETE CASCADE: foto + dokumen
    }
    await hak.tulis(env, akun, "agenda_kegiatan", "hapus", {}, k.id);
    if (env.BERKAS) for (const x of kunci) await env.BERKAS.delete(x).catch(() => {}); // yatim di R2 lebih ringan daripada baris tanpa berkas
    return json({ ok: true }, 200, PRIVAT);
  },

  // GET /api/agenda/dokumen/:id: unduh (404 bila akses 'pengurus' dan pembaca anggota).
  "GET /api/agenda/dokumen/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    const d = (await hak.baca(env, akun, "agenda_dokumen", { where: { id: Number(p.params.id) } }))[0];
    if (!d || (d.akses === "pengurus" && !bisaLihatPengurus(akun))) return gagal("tidak_ditemukan");
    const obj = await env.BERKAS.get(d.kunci_r2);
    if (!obj) return gagal("tidak_ditemukan");
    return new Response(obj.body, {
      headers: {
        "content-type": CT_DOK[d.tipe] ?? "application/octet-stream",
        "content-disposition": disposisi(d.nama_berkas),
        "x-content-type-options": "nosniff",
        "cache-control": "private, no-store",
        vary: "Cookie",
      },
    });
  },

  // PATCH /api/agenda/dokumen/:id {keterangan?, akses?, dari?, sumber_resmi?, penerbit?, tanggal_terbit?}
  "PATCH /api/agenda/dokumen/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const b = await bacaBody(req);
    const d = {};
    for (const k of Object.keys(b)) {
      if (!["keterangan", "akses", "dari", "sumber_resmi", "penerbit", "tanggal_terbit"].includes(k)) return gagal("masukan_salah");
    }
    if ("keterangan" in b) { if (!teksOpsional(b.keterangan, 300) || (b.keterangan && !teksBersih(b.keterangan))) return gagal("masukan_salah"); d.keterangan = b.keterangan; }
    if ("dari" in b) { if (!teksOpsional(b.dari, 200) || (b.dari && !teksBersih(b.dari))) return gagal("masukan_salah"); d.dari = b.dari; }
    if ("penerbit" in b) { if (!teksOpsional(b.penerbit, 200) || (b.penerbit && !teksBersih(b.penerbit))) return gagal("masukan_salah"); d.penerbit = b.penerbit; }
    if ("akses" in b) { if (!["anggota", "pengurus"].includes(b.akses)) return gagal("masukan_salah"); d.akses = b.akses; }
    if ("tanggal_terbit" in b) { if (b.tanggal_terbit !== null && !tglSah(b.tanggal_terbit)) return gagal("masukan_salah"); d.tanggal_terbit = b.tanggal_terbit; }
    if ("sumber_resmi" in b) {
      if (![0, 1, true, false].includes(b.sumber_resmi)) return gagal("masukan_salah");
      d.sumber_resmi = b.sumber_resmi ? 1 : 0;
    }
    if (!Object.keys(d).length) return gagal("masukan_salah");
    const lama = (await hak.baca(env, akun, "agenda_dokumen", { where: { id: Number(p.params.id) } }))[0];
    if (!lama) return gagal("tidak_ditemukan");
    const akhir = { ...lama, ...d };
    if (akhir.sumber_resmi === 1) {
      if (akhir.asal !== "eksternal" || typeof akhir.penerbit !== "string" || akhir.penerbit.trim().length < 2) return gagal("masukan_salah");
      if (akhir.penerbit !== akhir.penerbit.trim()) d.penerbit = akhir.penerbit.trim();
      d.akses = "anggota"; // sumber resmi selalu terbuka bagi anggota
    }
    await hak.tulis(env, akun, "agenda_dokumen", "ubah", d, p.params.id);
    return json({ id: Number(p.params.id) }, 200, PRIVAT);
  },

  // DELETE /api/agenda/dokumen/:id: baris D1 dulu, lalu objek R2.
  "DELETE /api/agenda/dokumen/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const d = (await hak.baca(env, akun, "agenda_dokumen", { where: { id: Number(p.params.id) } }))[0];
    if (!d) return gagal("tidak_ditemukan");
    await hak.tulis(env, akun, "agenda_dokumen", "hapus", {}, p.params.id);
    if (env.BERKAS) await env.BERKAS.delete(d.kunci_r2).catch(() => {});
    return json({ ok: true }, 200, PRIVAT);
  },

  // GET /api/agenda: penanda untuk kalender (kunci lama `bukti`) + `kegiatan` (arsip + admin) dengan hitungan yang terlihat pembaca.
  "GET /api/agenda": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    const bukti = await bacaSemua(env, akun, "agenda_bukti", { kolom: ["id", "kegiatan_ref", "tempat", "notulensi"] });
    const foto = await bacaSemua(env, akun, "agenda_foto", { kolom: ["bukti_id"] });
    const dok = await dokTerlihat(env, akun, {}, ["bukti_id"]);
    const n = new Map(), nd = new Map();
    for (const f of foto) n.set(f.bukti_id, (n.get(f.bukti_id) ?? 0) + 1);
    for (const d of dok) nd.set(d.bukti_id, (nd.get(d.bukti_id) ?? 0) + 1);
    const perRef = new Map(bukti.map((b) => [b.kegiatan_ref, b]));
    const butir = (k) => {
      const b = perRef.get(k.ref);
      return { ref: k.ref, judul: k.judul, tanggal: k.tanggal, tanggal_selesai: k.tanggal_selesai ?? null, jenis: k.jenis, tempat: k.tempat ?? b?.tempat ?? null, sumber: k.sumber,
        foto_n: b ? n.get(b.id) ?? 0 : 0, dok_n: b ? nd.get(b.id) ?? 0 : 0, ada_notulensi: !!(b?.notulensi && b.notulensi.trim()) };
    };
    const admin = (await bacaSemua(env, akun, "agenda_kegiatan", { urut: "-tanggal" })).map((k) => butir({ ...k, sumber: "admin" }));
    let arsip = [];
    try { arsip = (await barisArsip(env, req)).map((x) => butir(butirArsip(x))); } catch { /* kalender belum tersedia: daftar admin tetap tampil */ }
    return json({
      bukti: bukti.map((b) => ({ kegiatan_ref: b.kegiatan_ref, ada_notulensi: !!(b.notulensi && b.notulensi.trim()), jumlah_foto: n.get(b.id) ?? 0 })),
      kegiatan: [...admin, ...arsip],
    }, 200, PRIVAT);
  },

  // GET /api/agenda/:ref (arsip atau k-*)
  "GET /api/agenda/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    const ref = p.params.ref;
    const kegiatan = await infoKegiatan(env, req, akun, ref);
    if (!kegiatan) return gagal("tidak_ditemukan");
    const b = await cariBukti(env, akun, ref);
    if (!b) return json({ bukti: null, foto: [], dokumen: [], kegiatan }, 200, PRIVAT);
    const foto = await hak.baca(env, akun, "agenda_foto", { where: { bukti_id: b.id }, kolom: ["id", "keterangan", "urutan", "tipe"] });
    foto.sort((x, y) => x.urutan - y.urutan || x.id - y.id);
    const dokumen = (await dokTerlihat(env, akun, { bukti_id: b.id })).map(bentukDok);
    return json({ bukti: { kegiatan_ref: b.kegiatan_ref, tempat: b.tempat, notulensi: b.notulensi, diubah: b.diubah }, foto, dokumen, kegiatan }, 200, PRIVAT);
  },

  // PUT /api/agenda/:ref {tempat?, notulensi?}: tambah bila belum ada, ubah bila ada.
  "PUT /api/agenda/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_REF.test(ref)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const b = await bacaBody(req);
    const data = {};
    if ("tempat" in b) { if (!teksOpsional(b.tempat, 200)) return gagal("masukan_salah"); data.tempat = b.tempat; }
    if ("notulensi" in b) { if (!teksOpsional(b.notulensi, 30000)) return gagal("masukan_salah"); data.notulensi = b.notulensi; }
    if (!(await refSah(env, req, akun, ref))) return gagal("tidak_ditemukan");
    // Jejak tanpa teks notulensi: hanya panjangnya.
    const jejakKe = { ...("tempat" in data ? { tempat: data.tempat } : {}), ...("notulensi" in data ? { notulensi_panjang: data.notulensi === null ? 0 : data.notulensi.length } : {}) };
    const ada = await cariBukti(env, akun, ref);
    if (ada) {
      if (!Object.keys(data).length) return json({ id: ada.id }, 200, PRIVAT);
      await hak.tulis(env, akun, "agenda_bukti", "ubah", data, ada.id, { jejakKe });
      return json({ id: ada.id }, 200, PRIVAT);
    }
    const { id } = await hak.tulis(env, akun, "agenda_bukti", "tambah", { kegiatan_ref: ref, ...data }, null, { jejakKe });
    return json({ id }, 200, PRIVAT);
  },

  // POST /api/agenda/:ref/dokumen?asal=&akses=&nama=&dari=&keterangan=  (badan = berkas mentah, maks 20 MB)
  "POST /api/agenda/:ref/dokumen": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_REF.test(ref)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const q = new URL(req.url).searchParams;
    const asal = q.get("asal"), nama = q.get("nama"), dari = q.get("dari"), ket = q.get("keterangan");
    if (!["meti", "eksternal"].includes(asal)) return gagal("masukan_salah");
    const akses = q.get("akses") || (asal === "meti" ? "anggota" : "pengurus");
    if (!["anggota", "pengurus"].includes(akses)) return gagal("masukan_salah");
    if (!teksBersih(nama ?? "") || !nama || !nama.trim() || nama.length > 200 || /[\\/]/.test(nama)) return gagal("masukan_salah");
    if ((dari !== null && (dari.length > 200 || !teksBersih(dari))) || (ket !== null && (ket.length > 300 || !teksBersih(ket)))) return gagal("masukan_salah");
    if (!(await refSah(env, req, akun, ref))) return gagal("tidak_ditemukan");
    const badan = await bacaBiner(req, MAKS_DOK);
    if (!badan.length) return gagal("masukan_salah");
    const tipe = tipeDokumen(badan, nama);
    if (!tipe) return gagal("masukan_salah", 415);

    let bukti = await cariBukti(env, akun, ref);
    if (!bukti) {
      try {
        const { id } = await hak.tulis(env, akun, "agenda_bukti", "tambah", { kegiatan_ref: ref });
        bukti = { id };
      } catch (e) {
        bukti = await cariBukti(env, akun, ref); // balapan: dibuat permintaan lain
        if (!bukti) throw e;
      }
    }

    const kunci = `agenda-dok/${acak(16)}.${tipe}`;
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: CT_DOK[tipe] } });
    try {
      const data = { bukti_id: bukti.id, nama_berkas: nama, asal, akses };
      if (dari) data.dari = dari;
      if (ket) data.keterangan = ket;
      const { id } = await hak.tulis(env, akun, "agenda_dokumen", "tambah", data, null, { kunci_r2: kunci, tipe, ukuran: badan.length });
      return json({ id }, 201, PRIVAT);
    } catch (e) {
      await env.BERKAS.delete(kunci).catch(() => {});
      throw e;
    }
  },

  // POST /api/agenda/:ref/foto?keterangan=  (badan biner gambar)
  "POST /api/agenda/:ref/foto": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_REF.test(ref)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const ket = new URL(req.url).searchParams.get("keterangan");
    if (ket !== null && (ket.length > 300 || !teksBersih(ket))) return gagal("masukan_salah");
    if (!(await refSah(env, req, akun, ref))) return gagal("tidak_ditemukan");
    const badan = await bacaBiner(req);
    const t = tipeGambar(badan);
    if (!badan.length || !t) return gagal("masukan_salah");
    const [tipe, ext] = t;
    if (adaMetadata(badan, ext)) return gagal("masukan_salah");

    let bukti = await cariBukti(env, akun, ref);
    if (!bukti) {
      try {
        const { id } = await hak.tulis(env, akun, "agenda_bukti", "tambah", { kegiatan_ref: ref });
        bukti = { id };
      } catch (e) {
        bukti = await cariBukti(env, akun, ref); // balapan: dibuat permintaan lain
        if (!bukti) throw e;
      }
    }

    const kunci = `agenda/${acak(16)}.${ext}`;
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: tipe } });
    try {
      const data = { bukti_id: bukti.id };
      if (ket) data.keterangan = ket;
      const { id } = await hak.tulis(env, akun, "agenda_foto", "tambah", data, null, { kunci_r2: kunci, tipe, ukuran: badan.length });
      return json({ id }, 201, PRIVAT);
    } catch (e) {
      await env.BERKAS.delete(kunci).catch(() => {});
      throw e;
    }
  },
};

// Fungsi bantu dipakai ulang oleh konten_meti.js (perilaku tidak berubah).
export { adaMetadata, bacaBiner, CT_DOK, disposisi, teksBersih, tglSah, tipeDokumen, tipeGambar };
