// langganan.js: newsletter METI (migrasi 0014). Pendaftaran dan berhenti terbuka untuk tamu; daftar dan CSV hanya admin. D1 hanya lewat hak.js.
// K19: belum ada layanan surel, jadi tidak ada surel yang dikirim. Respons publik tidak pernah memuat atau membocorkan surel.
import * as hak from "./hak.js";
import { acak, bacaBody, gagal, ipHash, json, perlu, PRIVAT, RE_EMAIL } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const KONTROL = /[\u0000-\u001f\u007f]/;
const teks = (v, min, maks) => typeof v === "string" && !KONTROL.test(v) && v.trim().length >= min && v.trim().length <= maks;
const BATAS_DAFTAR = 6, BATAS_BERHENTI = 30; // per jam per koneksi (hash harian)

// Laju memakai aksi 'koreksi' (jendela 1 jam) dengan awalan kunci sendiri: CHECK tabel laju 0006 tak diubah.
const lajuLewat = async (env, req, awalan, batas) => (await hak.sistem.catatLaju(env, "koreksi:" + awalan + (await ipHash(env, req)), 3600)) > batas;

// Sel CSV: kutip ganda, dan awalan ' bila diawali = + - @ (injeksi rumus spreadsheet).
const sel = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
const tgl = (d) => (d ? new Date(d * 1000).toISOString() : "");

export function csvLangganan(baris) {
  const kepala = ["surel", "nama", "instansi", "minat", "status", "setuju_pada", "dibuat"];
  return "﻿" + [kepala.map(sel).join(","), ...baris.map((b) => [b.surel, b.nama, b.instansi, b.minat.join(";"), b.status, tgl(b.setuju_pada), tgl(b.dibuat)].map(sel).join(","))].join("\r\n") + "\r\n";
}

export const rute = {
  // Terbuka untuk tamu. Selalu 201 {ok} untuk masukan sah (baru, sudah ada, atau jebakan madu): tidak membocorkan surel terdaftar.
  "POST /api/langganan": async (req, env, ctx, p) => {
    const b = await bacaBody(req, 4096);
    if (await lajuLewat(env, req, "lg|", BATAS_DAFTAR)) return gagal("laju_terlampaui");
    const akun = p.akun;
    const depan = teks(b.depan, 1, 60) ? b.depan.trim() : "", belakang = b.belakang == null || b.belakang === "" ? "" : teks(b.belakang, 1, 60) ? b.belakang.trim() : null;
    const surel = akun ? String(akun.surel ?? "").trim().toLowerCase() : typeof b.surel === "string" ? b.surel.trim().toLowerCase() : "";
    const nama = akun && !depan ? String(akun.nama ?? "").trim().slice(0, 120) : [depan, belakang].filter(Boolean).join(" ");
    const instansi = b.instansi == null || b.instansi === "" ? null : teks(b.instansi, 1, 160) ? b.instansi.trim() : false;
    const minat = Array.isArray(b.minat) && b.minat.length <= hak.MINAT_LANGGANAN.length && b.minat.every((m) => hak.MINAT_LANGGANAN.includes(m)) ? [...new Set(b.minat)] : null;
    if (!nama || (!akun && !depan) || nama.length > 120 || belakang === null || instansi === false || minat === null || b.setuju !== true
      || surel.length < 5 || surel.length > 254 || KONTROL.test(surel) || !RE_EMAIL.test(surel)) return gagal("masukan_salah", 422);
    // Jebakan madu: kolom tersembunyi terisi = bot. Pura-pura sukses, tidak ada yang disimpan.
    if (typeof b.situs_web === "string" && b.situs_web.trim() !== "") return json({ ok: true }, 201, PRIVAT);
    const r = await hak.langgananDaftar(env, akun, { surel, nama, instansi, minat, token: acak(32), ipHash: await ipHash(env, req) });
    return r ? json({ ok: true }, 201, PRIVAT) : NONAKTIF();
  },

  // Status langganan akun yang masuk (isi formulir + tombol berhenti).
  "GET /api/langganan/saya": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.langgananSaya(env, akun);
    return r ? json({ ...r, surel: akun.surel, nama: akun.nama }, 200, PRIVAT) : NONAKTIF();
  },

  // Terbuka: token dari tautan berhenti (halaman /berhenti memanggil ini setelah konfirmasi klik), atau akun masuk tanpa token.
  "POST /api/langganan/berhenti": async (req, env, ctx, p) => {
    const b = await bacaBody(req, 1024);
    if (b.token != null && (typeof b.token !== "string" || !/^[0-9a-f]{64}$/.test(b.token))) return gagal("masukan_salah", 422);
    if (b.token == null && !p.akun) return gagal("masukan_salah", 422);
    if (await lajuLewat(env, req, "bh|", BATAS_BERHENTI)) return gagal("laju_terlampaui");
    const r = await hak.langgananBerhenti(env, p.akun, b.token ?? null, await ipHash(env, req));
    if (!r) return NONAKTIF();
    return r.ada ? json({ ok: true }, 200, PRIVAT) : gagal("tidak_ditemukan");
  },

  // Admin: daftar bertahap + hitungan per minat; ?format=csv mengunduh semua (maks 20000) dan tercatat di jejak.
  "GET /api/admin/langganan": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const q = new URL(req.url).searchParams, status = q.get("status") || undefined, csv = q.get("format") === "csv";
    if (status && !["aktif", "berhenti"].includes(status)) return gagal("masukan_salah", 422);
    const r = await hak.langgananAdmin(env, akun, { hal: q.get("hal") ?? 1, status, csv });
    if (!r) return NONAKTIF();
    if (!csv) return json(r, 200, PRIVAT);
    return new Response(csvLangganan(r.baris), { status: 200, headers: { ...PRIVAT, "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="langganan-${new Date().toISOString().slice(0, 10)}.csv"`, "x-content-type-options": "nosniff" } });
  },
};
