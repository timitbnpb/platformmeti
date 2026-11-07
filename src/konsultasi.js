// konsultasi.js: forum diskusi anggota atas naskah RUU/RPP dan "Masukan METI" (migrasi 0024). Seluruh situs di balik login: semua rute menagih sesi.
// D1 hanya lewat hak.js (hak konsultasi / konsultasi_putus). Berkas asli (PDF/DOCX/teks) di R2 BERKAS kunci konsultasi/<32 hex>.<ext>, privat.
import * as hak from "./hak.js";
import { buatDocx } from "./docx.js";
import { susunRekap } from "../public/inti/naskah.js";
import { acak, bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const RE_DOK = /^[a-z0-9-]{2,60}$/;
const MAKS_BERKAS = 15 * 1024 * 1024;
const TIPE = { "application/pdf": "pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx", "text/plain": "txt" };

// Jenis dari byte awal, bukan dari klien. DOCX = zip (PK) yang memuat word/ pada direktori pusat.
export function sniffNaskah(b) {
  if (b.length > 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "application/pdf";
  if (b.length > 30 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4) return new TextDecoder("latin1").decode(b.subarray(0, Math.min(b.length, 4_000_000))).includes("word/document.xml") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : null;
  if (!b.includes(0)) { try { new TextDecoder("utf-8", { fatal: true }).decode(b.subarray(0, 200000)); return "text/plain"; } catch { return null; } }
  return null;
}
const dok = (p) => { if (!RE_DOK.test(p.params.id)) throw new Galat("tidak_ditemukan"); return p.params.id; };
const adaAtau404 = (r) => (r ? (r.ada === false ? gagal("tidak_ditemukan") : null) : NONAKTIF());

function baruRekap(r) {
  return { dokumen: r.dokumen, baris: susunRekap(r) };
}
const KOLOM_BUTIR = [["No", 800, "label"], ["Topik", 2200, "judul"], ["Rujukan pasal", 1500, "rujukan"], ["Posisi awal", 3400, "asli"], ["Usulan METI", 3600, "usulan"], ["Alasan", 2600, "alasan"], ["Status", 900, "status_asal"]];
const KOLOM_NASKAH = [["Pasal", 1600, "label"], ["Naskah asli", 4800, "asli"], ["Usulan METI", 4800, "usulan"], ["Alasan", 3800, "alasan"]];

export const rute = {
  // Literal lebih dulu dari :id (pencocokan berurutan).
  "GET /api/konsultasi": async (req, env, ctx, p) => {
    const r = await hak.konsDaftar(env, perlu(p));
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },
  "GET /api/konsultasi/anggota": async (req, env, ctx, p) => {
    const q = new URL(req.url).searchParams.get("q") || "";
    return json({ baris: await hak.konsAnggotaCari(env, perlu(p), q) }, 200, PRIVAT);
  },
  "POST /api/konsultasi": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 2_000_000);
    const r = await hak.konsDokumenSimpan(env, akun, null, b, Array.isArray(b.bagian) ? b.bagian : null);
    return r ? json({ id: r.id }, 201, PRIVAT) : NONAKTIF();
  },
  "GET /api/konsultasi/:id": async (req, env, ctx, p) => {
    const r = await hak.konsBaca(env, perlu(p), dok(p));
    return adaAtau404(r) ?? json(r, 200, PRIVAT);
  },
  "PUT /api/konsultasi/:id": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 2_000_000);
    const r = await hak.konsDokumenSimpan(env, akun, dok(p), b, Array.isArray(b.bagian) ? b.bagian : null);
    return adaAtau404(r) ?? json({ id: r.id }, 200, PRIVAT);
  },
  "POST /api/konsultasi/:id/status": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 256);
    const r = await hak.konsDokumenStatus(env, akun, dok(p), b.status);
    return r ? json({ ok: r.ubah }, r.ubah ? 200 : 404, PRIVAT) : NONAKTIF();
  },
  "POST /api/konsultasi/:id/utas": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 20000);
    const r = await hak.konsUtasBaru(env, akun, { ...b, dokumen_id: dok(p) });
    return adaAtau404(r) ?? json({ id: r.id }, 201, PRIVAT);
  },
  "POST /api/konsultasi/:id/ikuti": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 128);
    const r = await hak.ikutiSet(env, akun, "regulasi", "kons:" + dok(p), !!b.ya);
    return r ? json({ ok: true }, 200, PRIVAT) : NONAKTIF();
  },
  "PATCH /api/konsultasi/utas/:uid": async (req, env, ctx, p) => {
    const r = await hak.konsUtasUbah(env, perlu(p), p.params.uid, await bacaBody(req, 20000));
    return adaAtau404(r) ?? json({ ubah: r.ubah }, r.ubah ? 200 : 409, PRIVAT);
  },
  "DELETE /api/konsultasi/utas/:uid": async (req, env, ctx, p) => {
    const r = await hak.konsUtasTarik(env, perlu(p), p.params.uid);
    return r ? json({ ubah: r.ubah }, r.ubah ? 200 : 409, PRIVAT) : NONAKTIF();
  },
  "POST /api/konsultasi/utas/:uid/balasan": async (req, env, ctx, p) => {
    const r = await hak.konsBalasBaru(env, perlu(p), p.params.uid, await bacaBody(req, 8000));
    return adaAtau404(r) ?? json({ id: r.id }, 201, PRIVAT);
  },
  "POST /api/konsultasi/utas/:uid/dukung": async (req, env, ctx, p) => {
    const b = await bacaBody(req, 128);
    const r = await hak.konsDukung(env, perlu(p), p.params.uid, b.ya !== false);
    return adaAtau404(r) ?? json({ dukung: r.dukung, saya_dukung: r.saya_dukung }, 200, PRIVAT);
  },
  "POST /api/konsultasi/utas/:uid/selesai": async (req, env, ctx, p) => {
    const b = await bacaBody(req, 128);
    const r = await hak.konsSelesai(env, perlu(p), p.params.uid, b.selesai !== false);
    return r ? json({ ubah: r.ubah }, r.ubah ? 200 : 404, PRIVAT) : NONAKTIF();
  },
  "POST /api/konsultasi/utas/:uid/putus": async (req, env, ctx, p) => {
    const b = await bacaBody(req, 4000);
    const r = await hak.konsPutus(env, perlu(p), p.params.uid, { aksi: b.aksi, catatan: b.catatan, gabungKe: b.gabung_ke });
    return adaAtau404(r) ?? json({ ubah: r.ubah }, 200, PRIVAT);
  },
  "POST /api/konsultasi/utas/:uid/sembunyi": async (req, env, ctx, p) => {
    const b = await bacaBody(req, 128);
    const r = await hak.konsSembunyi(env, perlu(p), "utas", p.params.uid, b.sembunyi !== false);
    return r ? json({ ubah: r.ubah }, r.ubah ? 200 : 404, PRIVAT) : NONAKTIF();
  },
  "PATCH /api/konsultasi/balasan/:bid": async (req, env, ctx, p) => {
    const r = await hak.konsBalasUbah(env, perlu(p), p.params.bid, await bacaBody(req, 8000));
    return r ? json({ ubah: r.ubah }, r.ubah ? 200 : 409, PRIVAT) : NONAKTIF();
  },
  "DELETE /api/konsultasi/balasan/:bid": async (req, env, ctx, p) => {
    const r = await hak.konsBalasTarik(env, perlu(p), p.params.bid);
    return r ? json({ ubah: r.ubah }, r.ubah ? 200 : 409, PRIVAT) : NONAKTIF();
  },
  "POST /api/konsultasi/balasan/:bid/sembunyi": async (req, env, ctx, p) => {
    const b = await bacaBody(req, 128);
    const r = await hak.konsSembunyi(env, perlu(p), "balasan", p.params.bid, b.sembunyi !== false);
    return r ? json({ ubah: r.ubah }, r.ubah ? 200 : 404, PRIVAT) : NONAKTIF();
  },

  // Rekap posisi METI: anggota membaca; mengunduh DOCX hanya yang berhak memutus.
  "GET /api/konsultasi/:id/rekap": async (req, env, ctx, p) => {
    const r = await hak.konsRekapData(env, perlu(p), dok(p));
    return adaAtau404(r) ?? json({ ...baruRekap(r), bisa_ekspor: ["pengurus", "kurator", "admin", "super"].includes(p.akun.peran) }, 200, PRIVAT);
  },
  "GET /api/konsultasi/:id/rekap.docx": async (req, env, ctx, p) => {
    const akun = perlu(p, ["pengurus", "kurator", "admin", "super"]);
    const r = await hak.konsRekapData(env, akun, dok(p));
    const gagalR = adaAtau404(r);
    if (gagalR) return gagalR;
    const { dokumen, baris } = baruRekap(r), butir = dokumen.bentuk === "butir", kol = butir ? KOLOM_BUTIR : KOLOM_NASKAH;
    const isi = baris.map((b) => kol.map(([, , k]) => (k === "label" && butir ? b.label.replace(/^Butir\s*/, "") : b[k]) || ""));
    const bytes = buatDocx({
      judul: butir ? dokumen.judul.replace(/^Masukan METI/, "Masukan METI (versi rekap)") : `Rekap posisi METI: ${dokumen.judul}`,
      subjudul: `${dokumen.instansi || ""}${dokumen.instansi ? ". " : ""}Hanya usulan yang diterima pengurus. Dibuat ${new Date().toISOString().slice(0, 10)}.`,
      kolom: kol.map(([judul, lebar]) => ({ judul, lebar })), baris: isi,
      catatan: "Dokumen ini hasil diskusi anggota METI dan keputusan pengurus. Periksa sebelum dikirim.",
    });
    return new Response(bytes, { status: 200, headers: { ...PRIVAT, "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "content-disposition": `attachment; filename="rekap-${dokumen.id}.docx"` } });
  },

  // Berkas asli: unggah (staf) dan unduh (staf).
  "POST /api/konsultasi/:id/berkas": async (req, env, ctx, p) => {
    const akun = perlu(p, ["pengurus", "kurator", "admin", "super"]);
    const id = dok(p);
    if (!env.BERKAS) return gagal("layanan");
    if (Number(req.headers.get("content-length")) > MAKS_BERKAS + 65536) return gagal("terlalu_besar");
    if ((await hak.catatLaju(env, "impor:ks" + akun.id, 3600)) > 30) return gagal("laju_terlampaui");
    let fd; try { fd = await req.formData(); } catch { return gagal("masukan_salah", 422); }
    const f = fd.get("berkas");
    if (!f || typeof f === "string" || f.size === 0) return gagal("masukan_salah", 422);
    if (f.size > MAKS_BERKAS) return gagal("terlalu_besar");
    const data = new Uint8Array(await f.arrayBuffer()), tipe = sniffNaskah(data);
    if (!tipe) return gagal("masukan_salah", 415);
    const kunci = `konsultasi/${acak(16)}.${TIPE[tipe]}`, nama = String(f.name || "naskah").split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f"<>:*?|]/g, "").trim().slice(0, 100) || "naskah";
    await env.BERKAS.put(kunci, data, { httpMetadata: { contentType: tipe } });
    let r;
    try { r = await hak.konsBerkasSet(env, akun, id, { kunci, nama, tipe, ukuran: data.length }); } catch (e) { await env.BERKAS.delete(kunci).catch(() => {}); throw e; }
    if (!r || r.ada === false) { await env.BERKAS.delete(kunci).catch(() => {}); return r ? gagal("tidak_ditemukan") : NONAKTIF(); }
    if (r.lama) await env.BERKAS.delete(r.lama).catch(() => {});
    return json({ nama, tipe, ukuran: data.length }, 201, PRIVAT);
  },
  "GET /api/konsultasi/:id/berkas": async (req, env, ctx, p) => {
    const akun = perlu(p, ["pengurus", "kurator", "admin", "super"]);
    const m = await hak.konsBerkasBaca(env, akun, dok(p));
    if (!m?.kunci || !env.BERKAS) return gagal("berkas_belum_ada");
    const o = await env.BERKAS.get(m.kunci);
    if (!o) return gagal("berkas_belum_ada");
    return new Response(o.body, { status: 200, headers: { ...PRIVAT, "content-type": m.tipe, "content-disposition": `attachment; filename="${(m.nama || "naskah").replace(/[^A-Za-z0-9._ -]/g, "_")}"`, "content-security-policy": "default-src 'none'; sandbox" } });
  },
};
