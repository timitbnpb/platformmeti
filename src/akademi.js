// akademi.js (F65-205, migrasi 0039): nilai kuis akademi tercatat di akun, sertifikat akademi, dan kuis per rekaman.
// Nilai SELALU dihitung server dari jawaban terhadap bank soal; angka nilai dari klien tidak pernah diterima. D1 hanya lewat hak.js.
import * as hak from "./hak.js";
import bank from "../public/data/akademi.json" with { type: "json" };
import { nilaiKuis } from "../public/akademi_hitung.js";
import { KUNCI_AKADEMI } from "./akademi_kunci.js";
import { bacaBody, Galat, gagal, ipHash, json, perlu, PRIVAT, samaTetap } from "./util.js";

const ADM = ["admin", "super"];
const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const SALAH = () => new Galat("masukan_salah", 422);
// Bank publik tidak memuat jawaban; kunci digabung di sini dari modul server.
const MODUL = new Map(bank.modul.map((m) => [m.id, { ...m, kuis: m.kuis.map((x) => ({ ...x, a: KUNCI_AKADEMI[x.id].a })) }])), WAJIB = [...MODUL.keys()];
const RE_REKAMAN = /^[A-Za-z0-9_-]{1,40}$/, RE_TOKEN = /^(\d{1,9})\.([0-9a-f]{32})$/;
const lajuLewat = async (env, akun, n = 120) => (await hak.catatLaju(env, "koreksi:ak" + akun.id, 3600)) > n;

// Token sertifikat akademi: <id akun>.<32 hex HMAC(id|akademi|waktu akun dibuat)>, pola sertifikat acara, kunci berawalan "akad|". Dihitung, tidak disimpan; selalu di jalur URL.
const heksa = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function tokenAkademi(env, a) {
  const r = env.EVENT_RAHASIA || env.KTA_RAHASIA || env.ICS_RAHASIA || env.IP_SALT;
  if (!r) throw new Galat("layanan");
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode("akad|" + r), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `${a.id}.${heksa(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${a.id}|akademi|${a.dibuat}`))).slice(0, 32)}`;
}

/** Murni (diekspor untuk uji): { modul, jawaban } -> { m, jawaban } atau 422. jawaban = { <id soal>: indeks opsi } untuk SEMUA soal modul itu. */
export function periksaJawabanAkademi(b) {
  if (!b || typeof b !== "object" || Object.keys(b).some((k) => !["modul", "jawaban"].includes(k))) throw SALAH();
  const m = MODUL.get(b.modul), j = b.jawaban;
  if (!m || !j || typeof j !== "object" || Array.isArray(j)) throw SALAH();
  const ids = m.kuis.map((s) => s.id);
  if (Object.keys(j).length !== ids.length || ids.some((id, i) => !Number.isInteger(j[id]) || j[id] < 0 || j[id] >= m.kuis[i].o.length)) throw SALAH();
  return { m, jawaban: j };
}

export const rute = {
  // Nilai tercatat di akun + tautan sertifikat bila semua modul lulus.
  "GET /api/akademi/nilai": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const [nilai, s] = [await hak.akademiNilaiSaya(env, akun), await hak.akademiUntukSertifikat(env, akun.id, WAJIB)];
    if (!nilai || !s) return NONAKTIF();
    return json({ nilai: nilai.filter((n) => MODUL.has(n.modul)), wajib: WAJIB.length, lulus: s.lulus, sertifikat: s.lulus === WAJIB.length ? "/sertifikat/a/" + (await tokenAkademi(env, s)) : null }, 200, PRIVAT);
  },

  // Kirim jawaban satu modul; server menilai dan menyimpan nilai terbaik. Balasan: { benar, total, persen, lulus, hasil: {id: bool}, kunci: {id: indeks} | null }.
  "POST /api/akademi/kuis": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const { m, jawaban } = periksaJawabanAkademi(await bacaBody(req, 2048));
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const r = nilaiKuis(m, jawaban, bank.lulus_persen);
    // hasil = benar atau salah per soal (untuk pembahasan); kunci jawaban hanya keluar bila lulus, supaya satu kiriman asal tidak membuka semua jawaban.
    const hasil = Object.fromEntries(m.kuis.map((x) => [x.id, jawaban[x.id] === x.a]));
    const kunci = r.lulus ? Object.fromEntries(m.kuis.map((x) => [x.id, x.a])) : null;
    return (await hak.akademiNilaiCatat(env, akun, m.id, r.persen, r.lulus)) ? json({ ...r, hasil, kunci }, 200, PRIVAT) : NONAKTIF();
  },

  // Verifikasi publik sertifikat akademi: hanya nama, jumlah modul, tanggal selesai. Token salah, akun tak aktif, atau belum lulus semua = 404 seragam.
  "GET /api/akademi/sertifikat/:token": async (req, env, ctx, p) => {
    if ((await hak.catatLaju(env, "koreksi:sa|" + (await ipHash(env, req)), 3600)) > 120) return gagal("laju_terlampaui");
    const m = String(p.params.token).match(RE_TOKEN);
    const s = m ? await hak.akademiUntukSertifikat(env, Number(m[1]), WAJIB) : undefined;
    if (s === null) return NONAKTIF();
    const benar = s ? await tokenAkademi(env, s) : "0." + "0".repeat(32);
    if (!samaTetap(benar, m ? m[0] : "") || !s || s.lulus !== WAJIB.length) return gagal("tidak_ditemukan");
    return json({ jenis: "akademi", nama: s.nama, modul: WAJIB.length, tanggal: new Date(s.selesai * 1000).toISOString().slice(0, 10) }, 200, PRIVAT);
  },

  // Kuis sebuah rekaman: soal tanpa kunci jawaban. Rekaman tanpa bank soal = daftar kosong (layar tidak menampilkan kuis).
  "GET /api/kuis/:rekaman": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_REKAMAN.test(p.params.rekaman)) return gagal("tidak_ditemukan");
    const r = await hak.kuisRekamanBaca(env, akun, p.params.rekaman);
    return r ? json({ soal: r.soal, lulus_persen: bank.lulus_persen }, 200, PRIVAT) : NONAKTIF();
  },

  // Badan: { jawaban: [indeks, ...] } sebanyak soal. Balasan memuat nilai, benar atau salah per soal, dan kunci jawaban HANYA bila lulus; nilai terbaik disimpan sebagai 'rekaman:<id>'.
  "POST /api/kuis/:rekaman": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_REKAMAN.test(p.params.rekaman)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 1024);
    if (!b || Object.keys(b).some((k) => k !== "jawaban")) throw SALAH();
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const r = await hak.kuisRekamanNilai(env, akun, p.params.rekaman, b.jawaban);
    if (!r) return NONAKTIF();
    if (!r.total) return gagal("tidak_ditemukan");
    const persen = Math.round((r.benar / r.total) * 100), lulus = persen >= bank.lulus_persen;
    if (!(await hak.akademiNilaiCatat(env, akun, "rekaman:" + p.params.rekaman, persen, lulus))) return NONAKTIF();
    return json({ benar: r.benar, total: r.total, hasil: r.hasil, kunci: lulus ? r.kunci : null, persen, lulus }, 200, PRIVAT); // kunci hanya bila lulus (tinjauan keamanan)
  },

  // ---------------- admin: bank soal rekaman ----------------
  "GET /api/admin/kuis/:rekaman": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_REKAMAN.test(p.params.rekaman)) return gagal("tidak_ditemukan");
    const r = await hak.kuisRekamanBaca(env, akun, p.params.rekaman, { kunci: true });
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  // Badan: { soal: [{ q, o: [2..5], a }] } (maks 10). Daftar kosong menghapus kuis rekaman itu.
  "PUT /api/admin/kuis/:rekaman": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    if (!RE_REKAMAN.test(p.params.rekaman)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 16384);
    if (!b || Object.keys(b).some((k) => k !== "soal")) throw SALAH();
    if (await lajuLewat(env, akun)) return gagal("laju_terlampaui");
    const r = await hak.kuisRekamanSimpan(env, akun, p.params.rekaman, b.soal);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },
};
