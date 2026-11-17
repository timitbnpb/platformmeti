// iuran.js (F65-301): perpanjangan iuran anggota secara mandiri + bukti pembayaran. Migrasi 0043. D1 hanya lewat hak.js.
// Dua jalur: Midtrans Snap (hanya bila MIDTRANS_SERVER_KEY terpasang; tanpa itu rute membalas "fitur belum aktif" dan layar menyembunyikan tombolnya)
// dan bukti transfer yang ditinjau admin. Jumlah SELALU dari tarif tahunan kategori di server; tidak ada angka dari badan permintaan.
// Notifikasi Midtrans masuk lewat rute yang sudah ada (/api/daftar/midtrans/notifikasi, satu URL per akun Midtrans) dan dicabangkan ke notifikasiIuran() untuk pesanan "IU-".
import * as hak from "./hak.js";
import { tipeBerkas } from "./daftar.js";
import { acak, bacaBiner, bacaBody, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
const MAKS_BUKTI = 5 * 1024 * 1024;
const RE_ID = /^\d{1,12}$/;
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const lajuLewat = async (env, akun, n = 10) => (await hak.catatLaju(env, "koreksi:iu" + akun.id, 3600)) > n;
const URL_SNAP = (env) => (env.MIDTRANS_PRODUKSI === "1" ? "https://app.midtrans.com/snap/v1/transactions" : "https://app.sandbox.midtrans.com/snap/v1/transactions");

// Tarif TAHUNAN per kode kategori dari public/data/keanggotaan.json (bersumber metiires.or.id/membership). Tanpa berkas atau tanpa angka: {} (tidak ada yang bisa dibayar).
async function tarifTahunan(env, req) {
  try {
    const r = await env.ASSETS.fetch(new Request(new URL("/data/keanggotaan.json", req.url)));
    const d = r.ok ? await r.json() : null;
    if (Array.isArray(d?.kategori)) return Object.fromEntries(d.kategori.filter((k) => Number.isInteger(k.iuran_tahunan) && k.iuran_tahunan > 0).map((k) => [k.kode, k.iuran_tahunan]));
  } catch { /* tanpa tarif: perpanjangan mandiri tidak tersedia */ }
  return {};
}
const hasilBuat = (r) => (!r ? NONAKTIF() : r.tanpaKta || r.tanpaTarif ? gagal("tidak_ditemukan") : gagal("konflik"));

// Dipanggil rute notifikasi Midtrans SESUDAH tanda tangan diverifikasi di sana. f = pembaca kolom notifikasi. Jumlah dicocokkan dengan D1.
export async function notifikasiIuran(env, f) {
  const o = await hak.sistem.iuranOnlineBaca(env, f("order_id"));
  if (o === null) return gagal("layanan");
  if (!o) return gagal("tidak_ditemukan");
  if (Math.round(Number(f("gross_amount"))) !== o.gross) return gagal("masukan_salah", 422);
  const st = f("transaction_status"), lunas = (st === "settlement" || (st === "capture" && f("fraud_status") !== "challenge")) && f("status_code") === "200";
  if (lunas || ["deny", "cancel", "expire", "failure"].includes(st)) await hak.sistem.iuranOnlineSelesai(env, o.order_id, lunas);
  return json({ ok: true }, 200, PRIVAT);
}

export const rute = {
  // KTA yang bisa diperpanjang, tarifnya, jalur yang aktif, rekening tujuan, dan riwayat pembayaran milik akun ini.
  "GET /api/iuran": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = await hak.iuranSaya(env, akun);
    if (!d) return NONAKTIF();
    const tarif = d.kta && hak.JENIS_IURAN[d.kta.jenis] ? (await tarifTahunan(env, req))[hak.JENIS_IURAN[d.kta.jenis]] ?? null : null;
    const at = await hak.pengaturanDaftarBaca(env), rekening = at.rekening_nomor ? { bank: at.rekening_bank, nomor: at.rekening_nomor, nama: at.rekening_nama, catatan: at.rekening_catatan } : null;
    const boleh = !!tarif;
    return json({ kta: d.kta ? { jenis: d.kta.jenis, nomor_kta: d.kta.nomor_kta, berlaku_sampai: d.kta.berlaku_sampai } : null, tarif, boleh,
      online: boleh && !!env.MIDTRANS_SERVER_KEY, bukti: boleh && !!env.BERKAS && !!rekening, rekening: boleh ? rekening : null, riwayat: d.riwayat }, 200, PRIVAT);
  },

  // Midtrans Snap. Tanpa MIDTRANS_SERVER_KEY: fitur belum aktif (tombol tidak tampil). Jumlah dari tarif server.
  "POST /api/iuran/bayar-online": async (req, env, ctx, p) => {
    const akun = perlu(p);
    await bacaBody(req, 64);                       // badan diabaikan: tidak ada isian klien yang dipakai
    if (!env.MIDTRANS_SERVER_KEY) return NONAKTIF();
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const tarif = await tarifTahunan(env, req), order = "IU-" + acak(10);
    const r = await hak.iuranBuat(env, akun, { jalur: "midtrans", orderId: order }, (kode) => tarif[kode] ?? null);
    if (!r?.id) return hasilBuat(r);
    const h = await fetch(URL_SNAP(env), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: "Basic " + btoa(env.MIDTRANS_SERVER_KEY + ":") },
      body: JSON.stringify({ transaction_details: { order_id: order, gross_amount: r.gross }, customer_details: { first_name: String(r.nama).slice(0, 50), ...(r.surel ? { email: r.surel } : {}) } }),
    }).catch(() => null);
    const d = h?.ok ? await h.json().catch(() => null) : null;
    if (!d?.redirect_url || !/^https:\/\//.test(d.redirect_url)) { await hak.sistem.iuranOnlineSelesai(env, order, false); return gagal("layanan"); }
    return json({ url: d.redirect_url }, 200, PRIVAT);
  },

  // Bukti transfer (badan = berkas mentah JPEG, PNG, WEBP, atau PDF; tipe dari magic byte). Satu bukti menunggu per akun (409). Ditinjau admin.
  "POST /api/iuran/bukti": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!env.BERKAS) return NONAKTIF();
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");   // SEBELUM badan dibaca
    const tarif = await tarifTahunan(env, req);
    const pra = await hak.iuranSaya(env, akun);
    if (!pra) return NONAKTIF();
    if (!pra.kta || !tarif[hak.JENIS_IURAN[pra.kta.jenis]]) return gagal("tidak_ditemukan");   // SEBELUM apa pun ditulis ke R2
    const badan = new Uint8Array(await bacaBiner(req, MAKS_BUKTI));
    const t = tipeBerkas(badan);
    if (!badan.length || !t) return gagal("masukan_salah", 415);
    const kunci = `iuran/bukti/${acak(16)}.${t[1]}`;   // dibuat server, tanpa nama berkas pengguna
    await env.BERKAS.put(kunci, badan, { httpMetadata: { contentType: t[0] } });
    let r;
    try { r = await hak.iuranBuat(env, akun, { jalur: "bukti", kunci, tipe: t[0] }, (kode) => tarif[kode] ?? null); }
    catch (e) { await env.BERKAS.delete(kunci).catch(() => {}); throw e; }
    if (!r?.id) { await env.BERKAS.delete(kunci).catch(() => {}); return hasilBuat(r); }
    return json({ id: r.id }, 201, PRIVAT);
  },

  // Bukti pembayaran untuk dicetak: hanya pembayaran LUNAS milik akun itu; selain itu 404 seragam.
  "GET /api/iuran/:id/bukti-bayar": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const r = await hak.iuranBuktiBayar(env, akun, p.params.id);
    if (r === null) return NONAKTIF();
    if (!r) return gagal("tidak_ditemukan");
    const d = new Date(r.diputus_pada * 1000);
    return json({ nomor: `IUR-${d.getUTCFullYear()}-${String(r.id).padStart(6, "0")}`, tanggal: d.toISOString().slice(0, 10), nama: r.nama, nomor_kta: r.nomor_kta, jenis: r.jenis, gross: r.gross,
      status: r.status, jalur: r.jalur, berlaku_sampai: r.berlaku_sampai }, 200, PRIVAT);
  },

  /* ---------------- admin ---------------- */
  "GET /api/admin/iuran": async (req, env, ctx, p) => {
    const r = await hak.iuranAntrean(env, perlu(p, ADM));
    return r ? json({ baris: r }, 200, PRIVAT) : NONAKTIF();
  },
  // Berkas bukti: pemiliknya atau admin; selain itu 404 seragam. Disajikan dengan CSP sandbox.
  "GET /api/iuran/:id/bukti": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id) || !env.BERKAS) return gagal("tidak_ditemukan");
    const f = await hak.iuranBuktiBerkas(env, akun, p.params.id);
    if (f === null) return NONAKTIF();
    const o = f && (await env.BERKAS.get(f.kunci));
    if (!o) return gagal("tidak_ditemukan");
    return new Response(o.body, { status: 200, headers: { ...PRIVAT, "content-type": f.tipe, "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox" } });
  },
  // { aksi: "setuju" | "tolak", alasan? }. Hanya dari status menunggu (409).
  "POST /api/admin/iuran/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM), b = await bacaBody(req, 1024);
    if (!RE_ID.test(p.params.id) || !["setuju", "tolak"].includes(b.aksi)) return gagal("masukan_salah", 422);
    const r = await hak.iuranPutus(env, akun, p.params.id, b.aksi, b.alasan ?? null);
    return r === null ? NONAKTIF() : r.ok ? json({ ok: true }, 200, PRIVAT) : gagal("konflik");
  },
};
