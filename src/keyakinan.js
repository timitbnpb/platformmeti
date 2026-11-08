// keyakinan.js: indeks keyakinan bisnis EBT (migrasi 0031). Akun masuk menjawab survei triwulanan (8 butir, 1-5); agregat hanya bila n >= 5 (dijaga hak.js).
// Rute tipis: validasi bentuk, batas laju, lalu hak.js (satu-satunya pintu D1).
import * as hak from "./hak.js";
import { bacaBody, gagal, json, perlu, PRIVAT } from "./util.js";

const NONAKTIF = () => json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);

export const rute = {
  // Periode berjalan, jawaban saya (atau null), dan agregat per periode (tanpa nilai bila n < batas).
  "GET /api/keyakinan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const [saya, agregat] = [await hak.keyakinanSaya(env, akun), await hak.keyakinanAgregat(env, akun)];
    if (!saya || !agregat) return NONAKTIF();
    return json({ periode: saya.periode, jawaban: saya.jawaban, agregat, butir: hak.BUTIR_KEYAKINAN, n_min: hak.N_MIN_KEYAKINAN }, 200, PRIVAT);
  },

  // Isi atau ubah jawaban periode berjalan. Badan: { kondisi, pipeline, pembiayaan, perizinan, harga, regulasi, investasi, tenaga } bulat 1-5.
  "POST /api/keyakinan": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const b = await bacaBody(req, 512);
    if ((await hak.catatLaju(env, "koreksi:ky" + akun.id, 3600)) > 30) return gagal("laju_terlampaui");
    const r = await hak.keyakinanJawab(env, akun, b);
    return r ? json({ ok: true, periode: r.periode }, 200, PRIVAT) : NONAKTIF();
  },
};
