/* Pembangun indeks "Tanya data": memotong konten wiki PUBLIK-ANGGOTA jadi potongan bertautan -> data/tanya/potongan.jsonl.
   Potongan = { id, jenis, judul, teks, url (halaman entitas), sumber (https luar atau ""), tanggal }.
   Privasi (KEAMANAN-PRIVASI 3.5): tanpa lapis pengurus/kontak/pribadi (berkas tak terdaftar di SUMBER + berkas ber-"lapis" terlarang),
   kunci kontak/orang dibuang dari teks, potongan yang memuat surel/telepon atau nama di daftar tolak lokal dibuang.
   Pakai: node scripts/pipa/tanya_indeks.mjs   (lalu: node scripts/pipa/tanya_unggah.mjs --kering) */
import { rumahTek, rumahTopik } from "../../public/inti/rumah_tek.js";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { daftarTolak, memuatNamaTolak } from "./katalog_data.mjs";

const AKAR = join(fileURLToPath(new URL("../..", import.meta.url)));
const DATA = join(AKAR, "public/data");
const enc = encodeURIComponent;

// Berkas yang SENGAJA tidak ada di sini: orang, pengurus-meti, anggota_asosiasi, pakar*, foto_*, keanggotaan, konsultasi, pribadi/.
export const SUMBER = [
  { f: "organisasi", jenis: "Organisasi", url: (r) => "/o/" + r.id },
  { f: "proyek", jenis: "Proyek", url: (r) => "/p/" + r.id },
  { f: "regulasi", jenis: "Regulasi", url: (r) => "/regulasi?id=" + enc(r.id) },
  { f: "isu", jenis: "Isu", url: (r) => "/isu#" + enc(r.id) },
  { f: "psn", jenis: "PSN", url: (r) => "/program#" + enc(r.id) },
  { f: "pltu", jenis: "PLTU", url: (r) => `/peta?l=pltu&v=${r.lng},${r.lat},9` },
  { f: "program_analisis", jenis: "Program", url: (r) => "/program/" + enc(r.kode) },
  { f: "kawasan", jenis: "Kawasan", url: (r) => "/kawasan#" + enc(r.id) },
  { f: "sistem_pln", jenis: "Sistem PLN", url: () => "/sistem" },
  { f: "pustaka", jenis: "Pustaka", url: (r) => "/pustaka?id=" + enc(r.id) },
  { f: "istilah", jenis: "Istilah", rows: (d) => d.istilah, url: (r) => "/panduan#istilah-" + enc(r.id) },
  { f: "pasar_hijau", jenis: "Pasar listrik hijau", rows: (d) => d.pemilik_pembangkit, judul: (r) => r.pemilik, url: () => "/pasar-listrik-hijau" },
  { f: "pasar_hijau", jenis: "Pasar listrik hijau", rows: (d) => d.proyek_wilayah, judul: (r) => r.provinsi, url: () => "/pasar-listrik-hijau" },
  { f: "global/pemasok_surya", jenis: "Pemasok global", url: () => "/rantai-global?tab=surya" },
  { f: "global/pemasok_lain", jenis: "Pemasok global", url: () => "/rantai-global?tab=lain" },
  { f: "global/pemasok_wte", jenis: "Pemasok global", url: () => "/rantai-global?tab=wte" },
  { f: "riset", jenis: "Data riset", url: () => "/direktori?tampil=riset" },
  { f: "dataset_riset", jenis: "Data riset", url: () => "/direktori?tampil=riset" },
  { f: "hibah_riset", jenis: "Data riset", url: () => "/direktori?tampil=riset" },
];

// Kunci yang tak pernah masuk teks: kontak, identitas orang, koordinat, tautan, bukan-isi.
const TOLAK_KUNCI = /^(id|surel|email|e_mail|telepon|telp|hp|wa|whatsapp|kontak|alamat|nik|nip|npwp|rekening|sandi|token|akun|pengurus|penulis|pakar|lat|lng|presisi|logo|foto|gambar|wikidata|wikipedia|situs|web|sumber|sumber_id|org_id|organisasi_id|program_ids|tingkat_bukti|lapis|status_asli|kutipan|deret|ikon|geom\w*|koordinat\w*|url\w*|\w+_url|\w+_ids)$/i;
const LAPIS_TERLARANG = /pengurus|kontak|pribadi|privat|internal/i;
const POLA_KONTAK = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[a-z]{2,}|(?<![\d.])(?:\+62|08)\d{8,11}(?!\d)/;
const MAKS = 650;

const L = (v) => (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length && Object.keys(v).every((k) => k === "id" || k === "en") ? (v.id ?? v.en) : v);
const skalar = (v) => v != null && typeof v !== "object";
const rapi = (s) => String(s).replace(/\s+/g, " ").trim();
const httpsAman = (u) => (typeof u === "string" && /^https?:\/\/[^\s]+$/i.test(u) ? u : "");

/** Meratakan baris jadi daftar "kunci: nilai" (kedalaman <= 4, maks 6 butir per larik, larik bersarang/deret dilewati). */
export function ratakan(x, kunci = "", dalam = 0, out = []) {
  x = L(x);
  if (x == null || x === "" || dalam > 4) return out;
  if (Array.isArray(x)) {
    if (x.length && x.every(skalar)) { const s = x.slice(0, 12).map((e) => rapi(L(e))).filter((e) => e && !httpsAman(e)).join(", "); if (s) out.push(`${kunci.replace(/_/g, " ")}: ${s}`); return out; }
    for (const e of x.slice(0, 6)) if (!Array.isArray(e)) ratakan(e, kunci, dalam + 1, out);
    return out;
  }
  if (typeof x === "object") {
    for (const [k, v] of Object.entries(x)) if (!TOLAK_KUNCI.test(k)) ratakan(v, kunci ? kunci + " " + k : k, dalam + 1, out);
    return out;
  }
  const s = rapi(x);
  if (s && !httpsAman(s)) out.push(`${kunci.replace(/_/g, " ")}: ${s}`);
  return out;
}

/** Butir teks -> potongan <= MAKS huruf, dipecah di batas butir. */
export function potongButir(butir, awalan, maks = 3) {
  const hasil = []; let cur = "";
  for (const b of butir) {
    const bagian = b.length > MAKS ? b.slice(0, MAKS) : b;
    if (cur && (cur + "; " + bagian).length > MAKS) { hasil.push(cur); cur = ""; }
    cur = cur ? cur + "; " + bagian : bagian;
  }
  if (cur) hasil.push(cur);
  return hasil.slice(0, maks).map((t) => `${awalan.slice(0, 120)}. ${t}`.slice(0, 700));
}

export const idPotongan = (ref) => "t" + createHash("sha1").update(ref).digest("hex").slice(0, 15);
// Kutip pembatas yang dipakai prompt tidak boleh hidup di teks data (pencegah pemalsuan penanda potongan).
export const netral = (s) => String(s).replace(/\[\s*POTONGAN/gi, "(POTONGAN").replace(/[\u0000-\u001f\u007f]/g, " ");

function rujukan(r, d) {
  const sb = Array.isArray(r.sumber) ? r.sumber[0]?.url : r.sumber?.url;
  return [r.url_sumber, r.sumber_url, sb, r.url, r.web, r.situs].map(httpsAman).find(Boolean) || "";
}
const tanggalDari = (r, d) => String(r.tanggal_periksa || r.tanggal_ambil || r.diperiksa || r.tanggal || r.diperbarui || d.dibangun_pada || d.diambil || d.tanggal_ambil || "").slice(0, 10);

/** Satu baris -> 0..n potongan. `tolak` = Set nama terlarang (atau null). */
export function potongBaris(r, d, s, i, tolak = null) {
  const judul = rapi(L(s.judul ? s.judul(r) : (r.nama ?? r.judul ?? r.title)) ?? "");
  if (!judul) return [];
  const butir = ratakan(r).filter((b) => !b.startsWith("nama: ") && !b.startsWith("judul: "));
  const url = s.url(r);
  const rid = r.id ?? r.kode ?? i;
  return potongButir(butir.length ? butir : [], `${s.jenis} ${judul}`, 3)
    .map((teks, n) => ({ id: idPotongan(`${s.f}:${rid}:${n}`), jenis: s.jenis, judul, teks: netral(teks), url, sumber: rujukan(r, d), tanggal: tanggalDari(r, d) }))
    .filter((p) => !POLA_KONTAK.test(p.teks + " " + p.judul) && !memuatNamaTolak(p.teks + " " + p.judul, tolak));
}

/** Satu naskah topik: lead, angka kunci, poin penting, tanya-jawab. */
export function potongTopik(d, tolak = null) {
  const judul = rapi(L(d.judul) ?? d.id);
  const butir = [L(d.lead), ...(d.kunci || []).map((k) => `${L(k.label)}: ${k.nilai} ${L(k.satuan) ?? ""}`.trim()), ...(d.penting || []).map(L)];
  for (const b of Object.values(d.bab || {})) for (const q of b?.butir || []) if (q?.t) butir.push(`${L(q.t)} ${L(q.j) ?? ""}`);
  return potongButir(butir.filter(Boolean).map(rapi), `Topik ${judul}`, 14)
    .map((teks, n) => ({ id: idPotongan(`topik:${d.id}:${n}`), jenis: "Topik", judul, teks: netral(teks), url: rumahTopik(d.id), sumber: "", tanggal: String(d.diperbarui || "").slice(0, 10) }))
    .filter((p) => !POLA_KONTAK.test(p.teks) && !memuatNamaTolak(p.teks + " " + p.judul, tolak));
}

const bacaJson = (rel, dir) => { const p = join(dir, rel + ".json"); return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; };

export function bangunPotongan({ dir = DATA, tolak = daftarTolak() } = {}) {
  const out = [], lewat = [];
  for (const s of SUMBER) {
    const d = bacaJson(s.f, dir);
    if (!d) { lewat.push(s.f + " (tak ada)"); continue; }
    if (LAPIS_TERLARANG.test(String(d.lapis || ""))) { lewat.push(s.f + " (lapis " + d.lapis + ")"); continue; }
    const rows = s.rows ? s.rows(d) : Array.isArray(d) ? d : d.baris;
    (rows || []).forEach((r, i) => out.push(...potongBaris(r, d, s, i, tolak)));
  }
  const dt = join(dir, "topik");
  if (existsSync(dt)) for (const f of readdirSync(dt).filter((n) => n.endsWith(".json") && !["indeks.json", "ui.json"].includes(n)).sort()) {
    const d = JSON.parse(readFileSync(join(dt, f), "utf8"));
    if (d?.id && d.judul) out.push(...potongTopik(d, tolak));
  }
  const unik = new Map(out.map((p) => [p.id, p]));
  return { potongan: [...unik.values()], lewat };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { potongan, lewat } = bangunPotongan();
  const dir = join(AKAR, "data/tanya");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "potongan.jsonl"), potongan.map((p) => JSON.stringify(p)).join("\n") + "\n");
  const per = {}; for (const p of potongan) per[p.jenis] = (per[p.jenis] || 0) + 1;
  console.log(`tanya_indeks: ${potongan.length} potongan`, JSON.stringify(per), lewat.length ? "dilewati: " + lewat.join(", ") : "");
}
