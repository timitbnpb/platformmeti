// ikuti.js: akun mengikuti proyek/organisasi/provinsi/regulasi/tender (migrasi 0019) + "Ringkasan minggu ini" dari data yang sudah ada.
// D1 hanya lewat hak.js. Surel belum ada: ringkasanMingguan(env, akun) disiapkan agar cron surel kelak memanggil fungsi yang sama.
import * as hak from "./hak.js";
import { namaProvinsi } from "./meti_wilayah.js";
import { bacaBody, gagal, json, perlu, PRIVAT } from "./util.js";

const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
const HARI = 7 * 86400, BATAS_KIRIM_JAM = 120;
const RE_REF = /^[A-Za-z0-9_.:-]{1,80}$/;
const sahJenisRef = (jenis, ref) => hak.JENIS_IKUTI.includes(jenis) && typeof ref === "string" && RE_REF.test(ref) && (jenis !== "provinsi" || /^\d{2}$/.test(ref));

// Data potret statis lewat ASSETS (sama dengan profil.js); gagal baca = daftar kosong, ringkasan tetap jalan dari D1.
// ponytail: berita.json (~200 KB) di-parse per panggilan ringkasan; cache isolate bila CPU menjadi masalah.
async function muatBaris(env, nama) {
  try {
    const r = await env.ASSETS.fetch(new Request(`https://aset.internal/data/${nama}.json`));
    return r.ok ? (await r.json()).baris || [] : [];
  } catch { return []; }
}

/** Perubahan 7 hari terakhir pada entitas yang diikuti. Item: { tipe: portal|koreksi|berita|regulasi, jenis, ref, waktu(detik), judul?, url?, kolom?, jenis_ajuan? }. null = fitur belum aktif. */
export async function ringkasanMingguan(env, akun, kini = Date.now()) {
  const d = await hak.ikutiDaftar(env, akun);
  if (!d) return null;
  const sejak = Math.floor(kini / 1000) - HARI, sejakIso = new Date(sejak * 1000).toISOString();
  const ikut = (j) => new Set(d.baris.filter((x) => x.jenis === j).map((x) => x.ref));
  const org = ikut("organisasi"), pro = ikut("proyek"), reg = ikut("regulasi"), prov = new Map([...ikut("provinsi")].map((k) => [namaProvinsi(k), k]).filter(([n]) => n)); // nama -> kode
  const item = [];
  for (const x of (await hak.ikutiPerubahan(env, akun, sejak)) ?? []) {
    if (x.tipe === "portal") item.push({ tipe: "portal", jenis: x.proyek_id && pro.has(x.proyek_id) ? "proyek" : "organisasi", ref: x.proyek_id && pro.has(x.proyek_id) ? x.proyek_id : x.organisasi_id, jenis_ajuan: x.jenis, waktu: x.waktu });
    else if (x.tipe === "konsultasi") item.push({ tipe: "konsultasi", jenis: "regulasi", ref: "kons:" + x.dokumen_id, sub: x.sub, waktu: x.waktu });
    else item.push({ tipe: "koreksi", jenis: x.entitas, ref: x.entitas_id, kolom: x.kolom, waktu: x.waktu });
  }
  if (org.size || pro.size || prov.size) {
    for (const b of await muatBaris(env, "berita")) {
      if (!(b.terbit >= sejakIso)) continue;
      const o = (b.organisasi_ids || []).find((i) => org.has(i)), p = (b.proyek_ids || []).find((i) => pro.has(i));
      const w = prov.size ? (b.wilayah || []).find((v) => prov.has(v.prov)) : null;
      const cocok = p ? ["proyek", p] : o ? ["organisasi", o] : w ? ["provinsi", prov.get(w.prov)] : null;
      if (cocok) item.push({ tipe: "berita", jenis: cocok[0], ref: cocok[1], judul: b.judul, url: b.url, media: b.media, waktu: Math.floor(Date.parse(b.terbit) / 1000) });
    }
  }
  if (reg.size || pro.size) {
    const tgl = sejakIso.slice(0, 10);
    for (const r of await muatBaris(env, "regulasi")) {
      if (!(r.tanggal_ditetapkan >= tgl)) continue;
      const p = (r.proyek_ids || []).find((i) => pro.has(i));
      if (reg.has(r.id) || p) item.push({ tipe: "regulasi", jenis: reg.has(r.id) ? "regulasi" : "proyek", ref: reg.has(r.id) ? r.id : p, regulasi_id: r.id, judul: r.judul, waktu: Math.floor(Date.parse(r.tanggal_ditetapkan) / 1000) });
    }
  }
  item.sort((a, b) => b.waktu - a.waktu);
  return { sejak, item: item.slice(0, 80), baru: item.filter((x) => x.waktu > d.lihat).length };
}

export const rute = {
  // Daftar yang diikuti + jumlah pembaruan sejak terakhir dilihat (lonceng; hanya D1: portal dan koreksi yang disetujui).
  "GET /api/ikuti": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const d = await hak.ikutiDaftar(env, akun);
    if (!d) return NONAKTIF();
    const dari = Math.max(d.lihat, Math.floor(Date.now() / 1000) - HARI);
    const baru = ((await hak.ikutiPerubahan(env, akun, dari + 1, 100)) ?? []).length;
    return json({ baris: d.baris, baru }, 200, PRIVAT);
  },

  "POST /api/ikuti": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 512);
    if (!sahJenisRef(b.jenis, b.ref)) return gagal("masukan_salah", 422);
    if ((await hak.catatLaju(env, "koreksi:ik" + akun.id, 3600)) > BATAS_KIRIM_JAM) return gagal("laju_terlampaui");
    const r = await hak.ikutiSet(env, akun, b.jenis, b.ref, true);
    return r ? json({ ok: true }, 201, PRIVAT) : NONAKTIF();
  },

  "DELETE /api/ikuti/:jenis/:ref": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!sahJenisRef(p.params.jenis, p.params.ref)) return gagal("masukan_salah", 422);
    if ((await hak.catatLaju(env, "koreksi:ik" + akun.id, 3600)) > BATAS_KIRIM_JAM) return gagal("laju_terlampaui");
    const r = await hak.ikutiSet(env, akun, p.params.jenis, p.params.ref, false);
    return r ? json({ ok: true }, 200, PRIVAT) : NONAKTIF();
  },

  "GET /api/ikuti/ringkasan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await ringkasanMingguan(env, akun);
    return r ? json(r, 200, PRIVAT) : NONAKTIF();
  },

  // Menandai ringkasan sudah dilihat (menurunkan lonceng). Bukan GET: menulis.
  "POST /api/ikuti/lihat": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const r = await hak.ikutiLihat(env, akun);
    return r ? json({ ok: true }, 200, PRIVAT) : NONAKTIF();
  },
};
