// kiriman.js (F65-206..208, migrasi 0039; F65-213, 214, migrasi 0041): kiriman pengguna yang ditinjau admin. Foto tonggak proyek, minat listrik hijau, kebutuhan dana proyek, lencana verifikasi organisasi, laporan warga.
// F65-303, 302, 306 (migrasi 0042): papan minat REC dan karbon (tanpa transaksi), minat stan pameran (tanpa bayar), klaim untuk cek fakta (putusan ditulis redaksi).
// Alur sama: menunggu -> disetujui | ditolak (alasan wajib); pengirim boleh menarik. Hanya yang disetujui tampil ke pengguna lain. D1 hanya lewat hak.js.
import * as hak from "./hak.js";
import { adaMetadata, tipeGambar } from "./agenda.js";
import { bukti, hanyaKunci, pilih, tahun, teks } from "./portal.js";
import { PROV } from "../public/inti/prov_singkat.js";
import { REC_TEK, REG_KARBON, PUTUSAN } from "../public/inti/minat_enum.js";
import { acak, bacaBiner, bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const SALAH = () => new Galat("masukan_salah", 422);
const RE_ID = /^\d{1,12}$/, RE_REF = /^[A-Za-z0-9_-]{2,60}$/, RE_SLUG = /^[a-z0-9][a-z0-9-]{0,78}$/;
const MAKS_FOTO = 5 * 1024 * 1024; // sama dengan foto bukti agenda
const lajuLewat = async (env, akun, n = 20) => (await hak.catatLaju(env, "koreksi:kr" + akun.id, 3600)) > n;
const bulat = (v, min, maks) => { if (!Number.isInteger(v) || v < min || v > maks) throw SALAH(); return v; };

/** Murni (diekspor untuk uji). Nama perusahaan dan catatan lewat teks() portal: menolak surel, telepon, dan kata kunci data pribadi. */
export function periksaHijau(b) {
  hanyaKunci(b, ["perusahaan", "prov", "mwh_tahun", "tahun_mulai", "catatan"]);
  const d = { perusahaan: teks(b.perusahaan, 120, { wajib: true }), prov: String(b.prov ?? ""), mwh_tahun: bulat(b.mwh_tahun, 1, 100000000), tahun_mulai: tahun(b.tahun_mulai, true), catatan: teks(b.catatan, 500) };
  if (d.perusahaan.length < 2 || !Object.hasOwn(PROV, d.prov)) throw SALAH();
  return d;
}
export function periksaDana(b) {
  hanyaKunci(b, ["organisasi_id", "jumlah", "mata_uang", "jenis", "uraian"]);
  const d = { organisasi_id: b.organisasi_id, jumlah: bulat(b.jumlah, 1, 1e15), mata_uang: pilih(b.mata_uang, ["IDR", "USD"]), jenis: pilih(b.jenis, ["ekuitas", "utang", "hibah", "campuran"]), uraian: teks(b.uraian, 600, { baris: true, wajib: true }) };
  if (typeof d.organisasi_id !== "string" || !RE_REF.test(d.organisasi_id) || d.uraian.length < 10) throw SALAH();
  return d;
}
/** Murni (diekspor untuk uji). Lencana: bukti = tautan https ke dokumen organisasi; tidak ada unggahan dan tidak ada dokumen identitas pribadi. */
export function periksaLencana(b) {
  hanyaKunci(b, ["organisasi_id", "jenis", "bukti_url", "uraian"]);
  const d = { organisasi_id: b.organisasi_id, jenis: pilih(b.jenis, ["legalitas", "sertifikat", "proyek"]), bukti_url: bukti(b.bukti_url, true), uraian: teks(b.uraian, 400, { wajib: true }) };
  if (typeof d.organisasi_id !== "string" || !RE_REF.test(d.organisasi_id) || d.uraian.length < 10) throw SALAH();
  return d;
}
/** Laporan warga: teks polos 20..1000; teks() portal menolak surel, telepon, dan kata kunci data pribadi. */
export function periksaLaporan(b) {
  hanyaKunci(b, ["isi"]);
  const isi = teks(b.isi, 1000, { baris: true, wajib: true });
  if (isi.length < 20) throw SALAH();
  return { isi };
}
/** Murni (diekspor untuk uji). Papan minat: volume adalah klaim pengirim per tahun; rujukan = teknologi (REC) atau registri (karbon) dari enum data; organisasi_id opsional. */
export function periksaUnit(b) {
  hanyaKunci(b, ["jenis", "arah", "volume", "rujukan", "prov", "uraian", "organisasi_id"]);
  const jenis = pilih(b.jenis, ["rec", "karbon"]);
  const d = { jenis, arah: pilih(b.arah, ["beli", "jual"]), volume: bulat(b.volume, 1, 1e9), rujukan: pilih(b.rujukan, jenis === "rec" ? REC_TEK : REG_KARBON, false), prov: String(b.prov ?? ""), uraian: teks(b.uraian, 500, { baris: true, wajib: true }), organisasi_id: b.organisasi_id ?? null };
  if (!Object.hasOwn(PROV, d.prov) || d.uraian.length < 10 || (d.organisasi_id !== null && (typeof d.organisasi_id !== "string" || !RE_REF.test(d.organisasi_id)))) throw SALAH();
  return d;
}
/** Minat stan: nama organisasi dan kebutuhan sebagai teks polos. Tanpa denah, kuota, atau harga. */
export function periksaStan(b) {
  hanyaKunci(b, ["organisasi", "kebutuhan"]);
  const d = { organisasi: teks(b.organisasi, 120, { wajib: true }), kebutuhan: teks(b.kebutuhan, 500, { baris: true, wajib: true }) };
  if (d.organisasi.length < 2 || d.kebutuhan.length < 10) throw SALAH();
  return d;
}
const tglSah = (v, kini = Date.now()) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw SALAH();
  const w = Date.parse(v + "T00:00:00Z");
  if (Number.isNaN(w) || new Date(w).toISOString().slice(0, 10) !== v || v < "2000-01-01" || w > kini + 86400e3) throw SALAH(); // tanggal nyata, tidak di masa depan
  return v;
};
/** Klaim untuk dicek: kutipan, siapa yang mengatakan, tautan sumber klaim (https), tanggal pernyataan. */
export function periksaKlaim(b, kini = Date.now()) {
  hanyaKunci(b, ["kutipan", "penutur", "sumber_url", "tanggal"]);
  const d = { kutipan: teks(b.kutipan, 600, { baris: true, wajib: true }), penutur: teks(b.penutur, 120, { wajib: true }), sumber_url: bukti(b.sumber_url, true), tanggal: tglSah(b.tanggal, kini) };
  if (d.kutipan.length < 20 || d.penutur.length < 2) throw SALAH();
  return d;
}
/** Putusan redaksi: enum, penjelasan, dan MINIMAL SATU tautan sumber https (paling banyak 5, tanpa duplikat). */
export function periksaPutusan(b) {
  hanyaKunci(b, ["putusan", "penjelasan", "sumber"]);
  if (!Array.isArray(b.sumber) || b.sumber.length < 1 || b.sumber.length > 5) throw SALAH();
  const d = { putusan: pilih(b.putusan, PUTUSAN), penjelasan: teks(b.penjelasan, 1500, { baris: true, wajib: true }), sumber: [...new Set(b.sumber.map((u) => bukti(u, true)))] };
  if (d.penjelasan.length < 20) throw SALAH();
  return d;
}
const hasilBuat = (r) => (!r ? NONAKTIF() : r.id ? json({ id: r.id }, 201, PRIVAT) : r.tanpaKlaim ? gagal("dilarang") : gagal("konflik")); // konflik: sudah ada kiriman aktif, atau foto menunggu sudah penuh

export const rute = {
  // Semua kiriman saya + organisasi yang klaimnya disetujui (syarat mengirim foto dan dana).
  "GET /api/kiriman/saya": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const [k, klaim] = [await hak.kirimanSaya(env, akun), await hak.orgKlaimSetuju(env, akun)];
    return k && klaim ? json({ ...k, klaim }, 200, PRIVAT) : NONAKTIF();
  },

  // Pengirim menarik kirimannya sendiri (menunggu atau disetujui). Milik orang lain = 404.
  "DELETE /api/kiriman/:jenis/:id": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!hak.JENIS_KIRIMAN.includes(p.params.jenis) || !RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun, 60)) return gagal("laju_terlampaui");
    const r = await hak.kirimanTarik(env, akun, p.params.jenis, p.params.id);
    if (!r) return NONAKTIF();
    if (!r.ubah) return gagal("tidak_ditemukan");
    if (r.kunci && env.BERKAS) await env.BERKAS.delete(r.kunci).catch(() => {});
    return json({ ok: true }, 200, PRIVAT);
  },

  // ---------------- foto tonggak proyek (F65-206) ----------------
  // Foto yang disetujui untuk satu proyek.
  "GET /api/proyek/:id/foto": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_REF.test(p.params.id)) return gagal("tidak_ditemukan");
    const r = await hak.proyekFotoDaftar(env, akun, p.params.id);
    return r ? json({ baris: r }, 200, PRIVAT) : NONAKTIF();
  },

  // Badan mentah gambar; ?organisasi=<id klaim>&keterangan=<3..300>. Hanya akun dengan klaim organisasi itu yang disetujui. Masuk antrean admin.
  "POST /api/proyek/:id/foto": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_REF.test(p.params.id)) return gagal("tidak_ditemukan");
    if (!env.BERKAS) return gagal("layanan");
    if (Number(req.headers.get("content-length")) > MAKS_FOTO) throw new Galat("terlalu_besar"); // ukuran dulu, baru laju
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const q = new URL(req.url).searchParams, organisasi_id = q.get("organisasi") || "", keterangan = teks(q.get("keterangan"), 300, { wajib: true });
    if (!RE_REF.test(organisasi_id) || keterangan.length < 3) throw SALAH();
    // klaim diperiksa SEBELUM badan dibaca dan sebelum apa pun ditulis ke R2 (hak.kirimanBuat memeriksanya lagi saat menyimpan)
    const klaim = await hak.orgKlaimSetuju(env, akun);
    if (!klaim) return NONAKTIF();
    if (!klaim.includes(organisasi_id)) return gagal("dilarang");
    const badan = new Uint8Array(await bacaBiner(req, MAKS_FOTO));
    const t = tipeGambar(badan);
    if (!badan.length || !t) return gagal("masukan_salah", 415);
    if (adaMetadata(badan, t[1])) return gagal("masukan_salah"); // EXIF/GPS tidak boleh tersimpan
    const kunci = `proyek-foto/${acak(16)}.${t[1]}`; // dibuat server, tanpa nama berkas pengguna
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: t[0] } });
    let r;
    try { r = await hak.kirimanBuat(env, akun, "foto", { organisasi_id, proyek_id: p.params.id, kunci, tipe: t[0], ukuran: badan.length, keterangan }); }
    catch (e) { await env.BERKAS.delete(kunci).catch(() => {}); throw e; }
    if (!r?.id) await env.BERKAS.delete(kunci).catch(() => {});
    return hasilBuat(r);
  },

  // Berkas foto. Disetujui: semua akun masuk. Menunggu atau ditolak: hanya pengirim dan admin. Selain itu 404 seragam.
  "GET /api/proyek-foto/:fid": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.fid) || !env.BERKAS) return gagal("tidak_ditemukan");
    const f = await hak.proyekFotoBerkas(env, akun, p.params.fid);
    if (f === null) return NONAKTIF();
    const o = f && (await env.BERKAS.get(f.kunci));
    if (!o) return gagal("tidak_ditemukan");
    return new Response(o.body, { status: 200, headers: { ...PRIVAT, "content-type": f.tipe, "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox" } });
  },

  // ---------------- minat listrik hijau (F65-207) ----------------
  // Agregat per provinsi (hanya provinsi dengan pengirim disetujui >= ambang). Tanpa nama perusahaan.
  "GET /api/permintaan-hijau": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.hijauAgregat(env, akun);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/permintaan-hijau": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = periksaHijau(await bacaBody(req, 4096));
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    return hasilBuat(await hak.kirimanBuat(env, akun, "hijau", d));
  },

  // ---------------- kebutuhan dana proyek (F65-208) ----------------
  // Semua kebutuhan dana yang disetujui. Tanpa kontak: minat disampaikan lewat pesan ke sekretariat.
  "GET /api/proyek-dana": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.proyekDanaDaftar(env, akun);
    return r ? json({ baris: r }, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/proyek/:id/dana": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_REF.test(p.params.id)) return gagal("tidak_ditemukan");
    const d = periksaDana(await bacaBody(req, 4096));
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    return hasilBuat(await hak.kirimanBuat(env, akun, "dana", { ...d, proyek_id: p.params.id }));
  },

  // ---------------- lencana verifikasi organisasi (F65-213) ----------------
  // Lencana yang disetujui: jenis, uraian, tautan bukti, tanggal, nama peninjau.
  "GET /api/organisasi/:id/lencana": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_REF.test(p.params.id)) return gagal("tidak_ditemukan");
    const r = await hak.lencanaOrganisasi(env, akun, p.params.id);
    return r ? json({ baris: r }, 200, PRIVAT) : NONAKTIF();
  },

  // Ajukan lencana {jenis, bukti_url, uraian}: hanya akun yang klaimnya atas organisasi itu disetujui. Satu lencana aktif per organisasi per jenis (409).
  "POST /api/organisasi/:id/lencana": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_REF.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 4096);
    const d = periksaLencana({ ...b, organisasi_id: p.params.id });
    if (Object.hasOwn(b ?? {}, "organisasi_id")) throw SALAH(); // organisasi hanya dari jalur
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    return hasilBuat(await hak.kirimanBuat(env, akun, "lencana", d));
  },

  // ---------------- laporan warga atas proyek (F65-214) ----------------
  // Laporan yang sudah ditinjau dan disetujui: isi dan tanggal. Tanpa nama pelapor.
  "GET /api/proyek/:id/laporan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_REF.test(p.params.id)) return gagal("tidak_ditemukan");
    const r = await hak.laporanProyek(env, akun, p.params.id);
    return r ? json({ baris: r }, 200, PRIVAT) : NONAKTIF();
  },

  // Kirim laporan {isi}: akun masuk (bawaan C-08). Masuk antrean admin; satu laporan aktif per akun per proyek (409).
  "POST /api/proyek/:id/laporan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_REF.test(p.params.id)) return gagal("tidak_ditemukan");
    const d = periksaLaporan(await bacaBody(req, 4096));
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    return hasilBuat(await hak.kirimanBuat(env, akun, "laporan", { ...d, proyek_id: p.params.id }));
  },

  // ---------------- papan minat REC dan karbon (F65-303) ----------------
  // Minat yang disetujui. Tanpa akun pengirim; organisasi_id hanya ada bila pengirim memilih menampilkannya. Bukan bursa: tidak ada harga dan tidak ada transaksi.
  "GET /api/minat-unit": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.unitDaftar(env, akun);
    return r ? json({ baris: r }, 200, PRIVAT) : NONAKTIF();
  },

  // Kirim minat. organisasi_id (opsional) wajib klaim yang disetujui (403 bila bukan). Satu minat aktif per akun per jenis per arah (409).
  "POST /api/minat-unit": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = periksaUnit(await bacaBody(req, 4096));
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    return hasilBuat(await hak.kirimanBuat(env, akun, "unit", d));
  },

  // ---------------- minat stan pameran (F65-302) ----------------
  // Hanya untuk acara yang pengaturannya ada; selain itu 404. Satu minat aktif per akun per acara (409). Tanpa bayar, tanpa denah.
  "POST /api/event/:id/stan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_SLUG.test(p.params.id)) return gagal("tidak_ditemukan");
    const d = periksaStan(await bacaBody(req, 4096));
    const atur = await hak.baca(env, akun, "event_atur", { where: { event_id: p.params.id } });
    if (!atur?.length) return gagal("tidak_ditemukan");
    if (await hak.eventSudahTutup(env, akun, p.params.id)) return gagal("tidak_ditemukan"); // acara sudah ditutup admin: 404 seragam (trigger 0043 menjaga hal yang sama)
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    return hasilBuat(await hak.kirimanBuat(env, akun, "stan", { ...d, event_id: p.params.id }));
  },

  // ---------------- cek fakta klaim energi (F65-306) ----------------
  // Klaim yang SUDAH diputus redaksi, berpaginasi. Klaim yang masih menunggu atau ditolak tidak tampil.
  "GET /api/cek-fakta": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.faktaDaftar(env, akun, new URL(req.url).searchParams.get("hal") ?? 1);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  "POST /api/cek-fakta": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = periksaKlaim(await bacaBody(req, 4096));
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    return hasilBuat(await hak.kirimanBuat(env, akun, "fakta", d));
  },

  // Putusan redaksi { putusan, penjelasan, sumber: [https...] }: admin dan super. Hanya dari status menunggu (409). Menolak klaim memakai rute kiriman biasa.
  "POST /api/admin/cek-fakta/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const d = periksaPutusan(await bacaBody(req, 8192));
    const r = await hak.faktaPutus(env, akun, p.params.id, d);
    if (!r) return NONAKTIF();
    return r.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },

  // ---------------- admin: antrean dan putusan ----------------
  "GET /api/admin/kiriman": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const q = new URL(req.url).searchParams, jenis = q.get("jenis") || "foto", status = q.get("status") || "menunggu";
    if (!hak.JENIS_KIRIMAN.includes(jenis) || !hak.STATUS_KIRIMAN.includes(status)) return gagal("masukan_salah", 422);
    const r = await hak.kirimanAntrean(env, akun, jenis, status, q.get("hal") ?? 1);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  // Badan: { aksi: "setuju" | "tolak", alasan? } (alasan wajib untuk tolak). Hanya dari status menunggu; selain itu 409.
  "POST /api/admin/kiriman/:jenis/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!hak.JENIS_KIRIMAN.includes(p.params.jenis) || !RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 2048);
    hanyaKunci(b, ["aksi", "alasan"]);
    if (!["setuju", "tolak"].includes(b.aksi) || (p.params.jenis === "fakta" && b.aksi === "setuju")) throw SALAH(); // klaim diputus lewat /api/admin/cek-fakta/:id
    const alasan = b.aksi === "tolak" ? teks(b.alasan, 500, { wajib: true }) : null;
    if (alasan !== null && alasan.length < 3) throw SALAH();
    const r = await hak.kirimanPutus(env, akun, p.params.jenis, p.params.id, b.aksi, alasan);
    if (!r) return NONAKTIF();
    if (r.kunci && env.BERKAS) await env.BERKAS.delete(r.kunci).catch(() => {}); // foto ditolak: berkasnya tidak disimpan
    return r.ubah ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
};
