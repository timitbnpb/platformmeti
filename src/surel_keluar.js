// surel_keluar.js (F65-215, 216; migrasi 0041): pengingat untuk hal yang diikuti dan draf buletin mingguan.
// PLATFORM INI TIDAK MENGIRIM SUREL (K19: layanan surel belum dipilih). Berkas ini sengaja TIDAK punya pengirim: tidak ada fetch ke penyedia, tidak ada kunci penyedia.
// Yang dibuat hanya DAFTAR yang akan dikirim (tabel surel_antre) dan draf buletin (surel_draf). Saat penyedia dipilih, pengirim membaca surel_antre berstatus 'antre'.
// D1 hanya lewat hak.js.
import * as hak from "./hak.js";
import { ringkasanMingguan } from "./ikuti.js";
import { bacaBody, Galat, gagal, json, perlu, PRIVAT, samaTetap } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const RE_ID = /^\d{1,12}$/;
const WIB_MS = 7 * 3600e3, HARI = 86400;
const tglWib = (ms) => new Date(ms + WIB_MS).toISOString().slice(0, 10);
export const RE_TOKEN_INGAT = /^p(\d{1,9})\.([0-9a-f]{32})$/;

// Token berhenti pengingat: p<id akun>.<32 hex HMAC>, kunci berawalan "ingat|". Dihitung, tidak disimpan.
const heksa = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
export async function tokenIngat(env, akunId) {
  const r = env.EVENT_RAHASIA || env.KTA_RAHASIA || env.ICS_RAHASIA || env.IP_SALT;
  if (!r) throw new Galat("layanan");
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode("ingat|" + r), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `p${akunId}.${heksa(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode("ingat:" + akunId))).slice(0, 32)}`;
}
/** Tautan berhenti satu klik: token sah mematikan semua pilihan pengingat akun itu. Hasil { ada } atau null (tabel belum ada). Dipanggil dari /api/langganan/berhenti. */
export async function berhentiIngat(env, token) {
  const m = String(token).match(RE_TOKEN_INGAT);
  const benar = m ? await tokenIngat(env, m[1]) : "p0." + "0".repeat(32);
  if (!m || !samaTetap(benar, token)) return { ada: false };
  const r = await hak.sistem.pengingatMatikan(env, Number(m[1]));
  return r ? { ada: true } : null;
}

const TEKS = {
  id: { subjek: "Pembaruan yang Anda ikuti di Direktori METI", buka: "Halo {nama},\n\nAda {n} pembaruan pada hal yang Anda pilih untuk dikirimi surel:", tutup: "Lihat semuanya: {asal}/diikuti\n\nBerhenti menerima pengingat ini (satu klik): {asal}/berhenti?t={token}",
    tipe: { portal: "Pembaruan dari lembaga", koreksi: "Koreksi data disetujui", berita: "Berita", regulasi: "Regulasi baru", topik: "Topik diperbarui", konsultasi: "Konsultasi naskah", tender: "Pembaruan tender" } },
  en: { subjek: "Updates you follow on the METI Directory", buka: "Hello {nama},\n\nThere are {n} updates on items you chose to be emailed about:", tutup: "See all: {asal}/diikuti\n\nStop these reminders (one click): {asal}/berhenti?t={token}",
    tipe: { portal: "Update from the organization", koreksi: "Data correction approved", berita: "News", regulasi: "New regulation", topik: "Topic updated", konsultasi: "Draft consultation", tender: "Tender update" } },
};
const isi = (s, p) => s.replace(/\{(\w+)\}/g, (_, k) => p[k] ?? "");

/** Murni (diekspor untuk uji). item = butir ringkasanMingguan; pilihan = ["jenis|ref"]; terakhir = penanda detik.
 *  Hanya butir pada hal yang DIPILIH dan lebih baru dari penanda. Tanpa butir = null (tidak ada yang diantrekan). Teks polos. */
export function susunPengingat({ nama, bahasa }, item, pilihan, terakhir, { asal, token }) {
  const pilih = new Set(pilihan), T = TEKS[bahasa === "en" ? "en" : "id"];
  const baru = item.filter((x) => pilih.has(x.jenis + "|" + x.ref) && x.waktu > terakhir).slice(0, 20);
  if (!baru.length) return null;
  const baris = baru.map((x) => `- ${T.tipe[x.tipe] ?? x.tipe}: ${String(x.judul || x.ref).replace(/\s+/g, " ").slice(0, 160)} (${new Date(x.waktu * 1000).toISOString().slice(0, 10)})`);
  return { subjek: T.subjek, isi: [isi(T.buka, { nama: String(nama || "").slice(0, 80), n: baru.length }), "", ...baris, "", isi(T.tutup, { asal, token })].join("\n").slice(0, 19000), n: baru.length };
}

/** Cron harian. Mengantrekan paling banyak satu pengingat per akun per hari, untuk paling banyak PLAFON_PENGINGAT akun per jalan. TIDAK mengirim apa pun.
 *  Hasil { calon, antre } untuk log; null bila tabel belum ada. */
export async function jalankanPengingat(env, kini = Date.now(), asal = "https://direktori.metiires.or.id") {
  const calon = await hak.sistem.pengingatCalon(env);
  if (!calon) return null;
  const sekarang = Math.floor(kini / 1000), tanggal = tglWib(kini);
  let antre = 0;
  for (const a of calon) {
    try {
      const r = await ringkasanMingguan(env, { id: a.id, peran: a.peran }, kini);
      // Akun baru memilih pengingat: penanda 0 dianggap 7 hari lalu, sama dengan jendela ringkasan.
      const s = r && susunPengingat(a, r.item, a.pilihan, a.terakhir || sekarang - 7 * HARI, { asal, token: await tokenIngat(env, a.id) });
      if (s) antre += (await hak.sistem.pengingatAntre(env, a.id, tanggal, s.subjek, s.isi, sekarang))?.antre ?? 0;
      else if (r) await hak.sistem.pengingatLewati(env, a.id, sekarang - HARI);
    } catch (e) { console.error("pengingat", a.id, e?.message); }
  }
  return { calon: calon.length, antre };
}

// Minggu ISO 8601 dari tanggal WIB: "YYYY-Www".
export function mingguIso(kini) {
  const d = new Date(Date.UTC(...tglWib(kini).split("-").map((x, i) => (i === 1 ? +x - 1 : +x))));
  const hari = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - hari);
  const awal = Date.UTC(d.getUTCFullYear(), 0, 1);
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d - awal) / 86400000 + 1) / 7)).padStart(2, "0")}`;
}

async function muatBaris(env, nama) {
  try { const r = await env.ASSETS.fetch(new Request(`https://aset.internal/data/${nama}.json`)); return r.ok ? (await r.json()).baris || [] : []; } catch { return []; }
}
/** Murni (diekspor untuk uji): rakit teks buletin dari data yang SUDAH ada. Tanpa butir sama sekali = null (tidak ada draf kosong). */
export function susunBuletin({ berita, regulasi, acara }, kini, asal = "https://direktori.metiires.or.id") {
  const hariIni = tglWib(kini), sejak = tglWib(kini - 7 * HARI * 1000), sampai = tglWib(kini + 14 * HARI * 1000);
  const rapi = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 180);
  const b = berita.filter((x) => typeof x.terbit === "string" && x.terbit.slice(0, 10) >= sejak && x.judul).sort((a, z) => (a.terbit < z.terbit ? 1 : -1)).slice(0, 8);
  const r = regulasi.filter((x) => typeof x.tanggal_ditetapkan === "string" && x.tanggal_ditetapkan >= sejak && x.tanggal_ditetapkan <= hariIni && x.judul).slice(0, 8);
  const a = acara.filter((x) => typeof x.tanggal === "string" && x.tanggal >= hariIni && x.tanggal <= sampai && x.judul).sort((p, q) => (p.tanggal < q.tanggal ? -1 : 1)).slice(0, 8);
  if (!b.length && !r.length && !a.length) return null;
  const bagian = (judul, baris) => (baris.length ? [judul, ...baris, ""] : []);
  const teks = [`Kabar METI, minggu ${mingguIso(kini)}`, "",
    ...bagian("Regulasi baru", r.map((x) => `- ${rapi(x.judul)} (${x.tanggal_ditetapkan}) ${asal}/regulasi?id=${encodeURIComponent(x.id)}`)),
    ...bagian("Acara mendatang", a.map((x) => `- ${x.tanggal}: ${rapi(x.judul)}`)),
    ...bagian("Berita energi terbarukan", b.map((x) => `- ${rapi(x.judul)}${x.media ? " (" + rapi(x.media) + ")" : ""} ${/^https:\/\//.test(x.url || "") ? x.url : ""}`.trim())),
    `Selengkapnya: ${asal}`].join("\n");
  return { subjek: `Kabar METI ${mingguIso(kini)}`, isi: teks.slice(0, 19000), hitung: { berita: b.length, regulasi: r.length, acara: a.length } };
}
/** Rakit dan SIMPAN draf minggu ini (sekali per minggu). Tidak mengantrekan dan tidak mengirim: itu tindakan admin. Hasil { minggu, baru } | { kosong: true } | null. */
export async function rakitBuletin(env, kini = Date.now()) {
  const [berita, regulasi, acara] = await Promise.all([muatBaris(env, "berita"), muatBaris(env, "regulasi"), muatBaris(env, "kalender")]);
  const s = susunBuletin({ berita, regulasi, acara }, kini);
  if (!s) return { kosong: true };
  const r = await hak.sistem.buletinDrafBuat(env, mingguIso(kini), s.subjek, s.isi);
  return r ? { minggu: mingguIso(kini), baru: r.baru } : null;
}
/** Cron: draf dirakit hanya pada hari Senin WIB. */
export const buletinTerjadwal = (env, kini = Date.now()) => (new Date(kini + WIB_MS).getUTCDay() === 1 ? rakitBuletin(env, kini) : Promise.resolve({ bukanSenin: true }));

export const rute = {
  // Antrean surel keluar (hitungan per jenis dan status), draf buletin, dan jumlah pelanggan aktif. kirim_aktif selalu false: belum ada layanan surel.
  "GET /api/admin/surel-keluar": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const r = await hak.surelKeluarRingkas(env, akun);
    return r ? json({ ...r, kirim_aktif: false, plafon_pengingat: hak.PLAFON_PENGINGAT }, 200, PRIVAT) : NONAKTIF();
  },

  // Rakit draf minggu ini sekarang (tanpa menunggu Senin). Hanya menyimpan draf.
  "POST /api/admin/buletin/rakit": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    await bacaBody(req, 64);
    if ((await hak.catatLaju(env, "kurasi:bl" + akun.id)) > 30) return gagal("laju_terlampaui");
    const r = await rakitBuletin(env);
    if (!r) return NONAKTIF();
    return json(r.kosong ? { kosong: true } : { minggu: r.minggu, baru: !!r.baru }, 200, PRIVAT);
  },

  // Putusan admin atas draf {aksi: "setuju" | "batal"}. setuju = draf disetujui dan diantrekan ke pelanggan aktif; hanya dari status draf (selain itu 409).
  "POST /api/admin/buletin/:id": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 256);
    if (!b || Object.keys(b).some((k) => k !== "aksi") || !["setuju", "batal"].includes(b.aksi)) return gagal("masukan_salah", 422);
    if ((await hak.catatLaju(env, "kurasi:bl" + akun.id)) > 30) return gagal("laju_terlampaui");
    const r = await hak.buletinPutus(env, akun, p.params.id, b.aksi);
    if (!r) return NONAKTIF();
    return r.ubah ? json({ ok: true, antre: r.antre }, 200, PRIVAT) : gagal("konflik");
  },
};
