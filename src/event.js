// event.js: pendaftaran (RSVP) acara METI + pengaturan admin + peserta CSV. D1 hanya lewat hak.js (tabel event_atur, event_daftar).
// Acara dikenali dari `slug` di public/data/kalender.json (bukan regulasi/tenggat); kuota dijaga rute DAN trigger (atomik).
import * as hak from "./hak.js";
import { bacaBody, Galat, gagal, json, perlu, PRIVAT } from "./util.js";

const ADM = ["admin", "super"];
const RE_SLUG = /^[a-z0-9][a-z0-9-]{0,78}$/;
const RE_TGL = /^\d{4}-\d{2}-\d{2}$/;
const RE_TEL = /^[0-9+ -]{6,20}$/;
const RE_SUREL = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/;
const BATAS_LAJU = 60;
const KOLOM_ATUR = ["id", "event_id", "terbuka", "kuota", "batas", "kontak_nama", "kontak_peran", "kontak_wa", "kontak_surel", "kontak_setuju"];

// WIB = UTC+7: "hari ini" untuk batas pendaftaran dan acara berlalu.
const hariWib = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

const KONTAK_BAWAAN = { nama: "Sekretariat METI", peran: null, wa: null, surel: "meti.ires@gmail.com" };
// Kontak pribadi hanya tampil bila admin menyetujui (kontak_setuju = 1); selain itu sekretariat.
export const kontakTampil = (a) => (a && a.kontak_setuju === 1 && (a.kontak_nama || a.kontak_wa || a.kontak_surel)
  ? { nama: a.kontak_nama ?? KONTAK_BAWAAN.nama, peran: a.kontak_peran ?? null, wa: a.kontak_wa ?? null, surel: a.kontak_surel ?? null }
  : KONTAK_BAWAAN);

async function acara(env, req, slug) {
  if (!RE_SLUG.test(slug)) return null;
  let res;
  try { res = await env.ASSETS.fetch(new Request(new URL("/data/kalender.json", req.url))); } catch { throw new Galat("layanan"); }
  if (!res.ok) throw new Galat("layanan");
  let k;
  try { k = await res.json(); } catch { throw new Galat("layanan"); }
  return (Array.isArray(k?.baris) ? k.baris : []).find((b) => b?.slug === slug && !["regulasi", "tenggat"].includes(b.jenis)) ?? null;
}
const lajuLewat = async (env, akun) => (await hak.sistem.catatLaju(env, "kurasi:ev" + akun.id)) > BATAS_LAJU;
const cariAtur = async (env, akun, id) => (await hak.baca(env, akun, "event_atur", { where: { event_id: id } }))[0] ?? null;
const cariDaftar = async (env, akun, id) => (await hak.baca(env, akun, "event_daftar", { where: { event_id: id, akun_id: akun.id } }))[0] ?? null;
const teksOp = (v, maks) => v == null || v === "" || (typeof v === "string" && v.trim().length <= maks);
const bersih = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const tampilAtur = (a) => (a ? { terbuka: !!a.terbuka, kuota: a.kuota, batas: a.batas, kontak: kontakTampil(a) } : { terbuka: false, kuota: null, batas: null, kontak: KONTAK_BAWAAN });

// CSV aman rumus: sel berawalan = + - @ tab/CR diberi apostrof; tanda kutip digandakan; BOM agar Excel membaca UTF-8.
export const selCsv = (v) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const rute = {
  // Semua akun masuk: pengaturan tiap acara (publik: tanpa baris orang lain), jumlah terdaftar, dan pendaftaran milik sendiri.
  "GET /api/event": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const [atur, hitung, saya] = await Promise.all([
      hak.baca(env, akun, "event_atur", {}), hak.eventHitung(env, akun),
      hak.baca(env, akun, "event_daftar", { where: { akun_id: akun.id } }),
    ]);
    return json({
      atur: Object.fromEntries(atur.map((a) => [a.event_id, { ...tampilAtur(a), terdaftar: hitung[a.event_id] ?? 0 }])),
      terdaftar: hitung,
      saya: saya.map((d) => ({ event_id: d.event_id, jumlah: d.jumlah, instansi: d.instansi, telepon: d.telepon, catatan: d.catatan, status: d.status, waktu: d.waktu })),
      akun: { nama: akun.nama, surel: akun.surel },
    }, 200, PRIVAT);
  },

  // POST /api/event/:id/daftar {jumlah, instansi?, telepon?, catatan?}: daftar baru, sunting, atau aktifkan lagi setelah batal.
  "POST /api/event/:id/daftar": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const id = p.params.id;
    const b = await bacaBody(req, 4096);
    const jumlah = b.jumlah === undefined ? 1 : b.jumlah;
    if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 20 || !teksOp(b.instansi, 120) || !teksOp(b.catatan, 500)
      || !(b.telepon == null || b.telepon === "" || (typeof b.telepon === "string" && RE_TEL.test(b.telepon.trim())))) return gagal("masukan_salah", 422);
    const ac = await acara(env, req, id);
    if (!ac) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const atur = await cariAtur(env, akun, id);
    const akhir = ac.akhir ?? ac.tanggal;
    if (!atur || !atur.terbuka || (atur.batas && hariWib() > atur.batas) || hariWib() > akhir) return gagal("pendaftaran_tutup");
    const ada = await cariDaftar(env, akun, id);
    const dipakai = (await hak.eventHitung(env, akun))[id] ?? 0;
    const sisa = atur.kuota == null ? Infinity : atur.kuota - dipakai + (ada && ada.status === "terdaftar" ? ada.jumlah : 0);
    if (jumlah > sisa) return gagal("kuota_penuh");
    const data = { jumlah, instansi: bersih(b.instansi), telepon: bersih(b.telepon), catatan: bersih(b.catatan) };
    if (ada) {
      await hak.tulis(env, akun, "event_daftar", "ubah", { ...data, status: "terdaftar" }, ada.id);
      return json({ id: ada.id, status: "terdaftar", jumlah }, 200, PRIVAT);
    }
    const r = await hak.tulis(env, akun, "event_daftar", "tambah", { event_id: id, ...data });
    return json({ id: r.id, status: "terdaftar", jumlah }, 201, PRIVAT);
  },

  // DELETE /api/event/:id/daftar: batalkan pendaftaran sendiri (baris tetap, status batal; kuota terlepas).
  "DELETE /api/event/:id/daftar": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const id = p.params.id;
    if (!RE_SLUG.test(id)) return gagal("tidak_ditemukan");
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const ada = await cariDaftar(env, akun, id);
    if (!ada) return gagal("tidak_ditemukan");
    if (ada.status === "terdaftar") await hak.tulis(env, akun, "event_daftar", "ubah", { status: "batal" }, ada.id);
    return json({ status: "batal" }, 200, PRIVAT);
  },

  // PUT /api/event/:id/atur: admin menetapkan buka/tutup, kuota, batas, dan contact person.
  "PUT /api/event/:id/atur": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const id = p.params.id;
    const b = await bacaBody(req, 4096);
    if (!(await acara(env, req, id))) return gagal("tidak_ditemukan");
    const surel = bersih(b.kontak_surel), wa = bersih(b.kontak_wa), batas = bersih(b.batas);
    const kuota = b.kuota === null || b.kuota === undefined || b.kuota === "" ? null : b.kuota;
    if (typeof b.terbuka !== "boolean" || (kuota !== null && !(Number.isInteger(kuota) && kuota >= 1 && kuota <= 100000))
      || (batas && (!RE_TGL.test(batas) || Number.isNaN(Date.parse(batas)))) || (surel && !RE_SUREL.test(surel)) || (wa && !RE_TEL.test(wa))
      || !teksOp(b.kontak_nama, 120) || !teksOp(b.kontak_peran, 120)) return gagal("masukan_salah", 422);
    const dipakai = (await hak.eventHitung(env, akun))[id] ?? 0;
    if (kuota !== null && kuota < dipakai) return gagal("masukan_salah", 422);
    const data = { terbuka: b.terbuka, kuota, batas, kontak_nama: bersih(b.kontak_nama), kontak_peran: bersih(b.kontak_peran), kontak_wa: wa, kontak_surel: surel, kontak_setuju: !!b.kontak_setuju };
    const ada = await cariAtur(env, akun, id);
    if (ada) { await hak.tulis(env, akun, "event_atur", "ubah", data, ada.id); return json({ id: ada.id }, 200, PRIVAT); }
    const r = await hak.tulis(env, akun, "event_atur", "tambah", { event_id: id, ...data });
    return json({ id: r.id }, 201, PRIVAT);
  },

  // GET /api/event/:id/peserta (JSON) dan .csv: admin saja; unduhan tercatat di jejak.
  "GET /api/event/:id/peserta": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_SLUG.test(p.params.id)) return gagal("tidak_ditemukan");
    return json({ peserta: await hak.eventPeserta(env, akun, p.params.id) }, 200, PRIVAT);
  },
  "GET /api/event/:id/peserta.csv": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const id = p.params.id;
    if (!RE_SLUG.test(id)) return gagal("tidak_ditemukan");
    const baris = await hak.eventPeserta(env, akun, id, { unduh: true });
    const kepala = ["id", "nama", "surel", "instansi", "telepon", "jumlah", "catatan", "status", "waktu"];
    const csv = "﻿" + [kepala, ...baris.map((r) => [r.id, r.nama, r.surel, r.instansi, r.telepon, r.jumlah, r.catatan, r.status, new Date(r.waktu * 1000).toISOString()])]
      .map((r) => r.map(selCsv).join(",")).join("\r\n") + "\r\n";
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="peserta-${id}.csv"`, "x-content-type-options": "nosniff", ...PRIVAT } });
  },
};
