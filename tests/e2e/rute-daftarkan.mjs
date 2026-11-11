// Pendaftar rute baru ke cakupan.json (S08). Jalankan: node tests/e2e/rute-daftarkan.mjs
// Rute /api/ yang belum terdaftar diselidiki per peran di D1 lokal nyata lalu dimasukkan ke rute.diuji (-> rute-peran.test.mjs) dan rute.peran.
// Hasil selidik hanya potret awal: TINJAU benar/salah-nya terhadap hak.js dan matriks sebelum commit. Rute tanpa peran benar masuk rute.belum.
import { readFileSync, writeFileSync } from "node:fs";
import { buatEnv } from "../_bantu.mjs";
import { ekstrakRute, siapkanPeran, selidikiPeran } from "../_rute.mjs";

const BERKAS = new URL("./cakupan.json", import.meta.url);
const c = JSON.parse(readFileSync(BERKAS, "utf8"));
const r = (c.rute ??= {});
for (const b of ["diuji", "dikecualikan", "belum", "peran", "publik"]) r[b] ??= {};
const { rute } = await ekstrakRute();
const ada = new Set([...Object.keys(r.diuji), ...Object.keys(r.dikecualikan), ...Object.keys(r.belum)]);
const baru = [...rute.keys()].filter((k) => !ada.has(k) || !r.peran[k]);
if (!baru.length) { console.log("semua rute sudah terdaftar"); process.exit(0); }
const { env, tutup } = await buatEnv();
const P = await siapkanPeran(env);
for (const k of baru) {
  const p = await selidikiPeran(env, P, k);
  if (!p.benar.length) { r.belum[k] = "Tidak ada peran uji yang lolos dengan badan kosong; butuh badan atau data khusus. Isi badan lalu pindahkan ke diuji."; continue; }
  r.diuji[k] ??= "tests/e2e/rute-peran.test.mjs";
  r.peran[k] = p;
  if (p.benar.includes("tamu")) r.publik[k] ??= "TULIS ALASAN: rute publik (pengecualian D19 di KEPUTUSAN-METI)";
}
const urut = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));
for (const b of ["diuji", "dikecualikan", "belum", "peran", "publik"]) r[b] = urut(r[b]);
r.jumlah_minimal = Math.max(r.jumlah_minimal ?? 0, rute.size);
r.belum_batas = Math.min(r.belum_batas ?? Infinity, Object.keys(r.belum).length);
writeFileSync(BERKAS, JSON.stringify(c, null, 2) + "\n");
console.log(`terdaftar ${baru.length} rute; belum=${Object.keys(r.belum).length}`);
await tutup();
process.exit(0);
