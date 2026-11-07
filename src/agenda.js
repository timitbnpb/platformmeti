// agenda.js: bukti agenda METI di Kalender (KP K20, JM-F11, DT §4.4). Notulensi + foto per kegiatan.
// D1 hanya lewat hak.baca/hak.tulis; foto di R2 (agenda/<32 hex>.<ext>), tidak pernah di repo atau public/.
import * as hak from "./hak.js";
import { acak, bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const BACA = ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"];
const TULIS = ["kurator", "admin", "super"];
const RE_REF = /^[a-z0-9_-]{1,40}$/;
const RE_ID = /^\d{1,12}$/;
const MAKS_FOTO = 5 * 1024 * 1024;
const BATAS_LAJU = 300;

// Bantu ----------------------------------------------------------------------------------------------------------
const lajuLewat = async (env, akun) => (await hak.catatLaju(env, "kurasi:" + akun.id)) > BATAS_LAJU;

// Ref sah hanya bila ada di kalender.json dengan sumber.label "arsip-meti".
async function refSah(env, req, ref) {
  if (!RE_REF.test(ref)) return false;
  let res;
  try { res = await env.ASSETS.fetch(new Request(new URL("/data/kalender.json", req.url))); } catch { throw new Galat("layanan"); }
  if (!res.ok) throw new Galat("layanan");
  let k;
  try { k = await res.json(); } catch { throw new Galat("layanan"); }
  return Array.isArray(k?.baris) && k.baris.some((b) => b?.id === ref && b?.sumber?.label === "arsip-meti");
}

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
async function bacaBiner(req) {
  if (Number(req.headers.get("content-length")) > MAKS_FOTO) throw new Galat("terlalu_besar");
  const bagian = [];
  let n = 0;
  if (req.body) {
    const rd = req.body.getReader();
    for (;;) {
      const { value, done } = await rd.read();
      if (done) break;
      n += value.length;
      if (n > MAKS_FOTO) { rd.cancel().catch(() => {}); throw new Galat("terlalu_besar"); }
      bagian.push(value);
    }
  }
  const b = new Uint8Array(n);
  let p = 0;
  for (const x of bagian) { b.set(x, p); p += x.length; }
  return b;
}

const teksOpsional = (v, maks) => v === null || (typeof v === "string" && v.length <= maks);
const intOk = (v) => Number.isInteger(v) && v >= 0 && v <= 999;

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
    if ("keterangan" in b) { if (!teksOpsional(b.keterangan, 300)) return gagal("masukan_salah"); data.keterangan = b.keterangan; }
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

  // GET /api/agenda: penanda untuk kalender.
  "GET /api/agenda": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    const bukti = await hak.baca(env, akun, "agenda_bukti", { kolom: ["id", "kegiatan_ref", "notulensi"] });
    const foto = await hak.baca(env, akun, "agenda_foto", { kolom: ["bukti_id"] });
    const n = new Map();
    for (const f of foto) n.set(f.bukti_id, (n.get(f.bukti_id) ?? 0) + 1);
    return json({
      bukti: bukti.map((b) => ({ kegiatan_ref: b.kegiatan_ref, ada_notulensi: !!(b.notulensi && b.notulensi.trim()), jumlah_foto: n.get(b.id) ?? 0 })),
    }, 200, PRIVAT);
  },

  // GET /api/agenda/:ref
  "GET /api/agenda/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p, BACA);
    const ref = p.params.ref;
    if (!(await refSah(env, req, ref))) return gagal("tidak_ditemukan");
    const b = await cariBukti(env, akun, ref);
    if (!b) return json({ bukti: null, foto: [] }, 200, PRIVAT);
    const foto = await hak.baca(env, akun, "agenda_foto", { where: { bukti_id: b.id }, kolom: ["id", "keterangan", "urutan", "tipe"] });
    foto.sort((x, y) => x.urutan - y.urutan || x.id - y.id);
    return json({ bukti: { kegiatan_ref: b.kegiatan_ref, tempat: b.tempat, notulensi: b.notulensi, diubah: b.diubah }, foto }, 200, PRIVAT);
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
    if (!(await refSah(env, req, ref))) return gagal("tidak_ditemukan");
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

  // POST /api/agenda/:ref/foto?keterangan=  (badan biner gambar)
  "POST /api/agenda/:ref/foto": async (req, env, ctx, p) => {
    const akun = perlu(p, TULIS);
    const ref = p.params.ref;
    if (!RE_REF.test(ref)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const ket = new URL(req.url).searchParams.get("keterangan");
    if (ket !== null && ket.length > 300) return gagal("masukan_salah");
    if (!(await refSah(env, req, ref))) return gagal("tidak_ditemukan");
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
