// rute-peran (JM-S08): tiap rute /api/ terdaftar di cakupan.json diuji pada worker.fetch utuh + D1 LOKAL NYATA (tanpa mock):
// peran benar diterima (lolos penjaga), peran salah dan tanpa sesi DITOLAK, metode salah 405, tulis tanpa x-pb atau Origin asing 403.
// Peran benar/salah dibaca dari rute.peran di cakupan.json (potret tinjauan, lihat rute-daftarkan.mjs); "diterima" = bukan 401/403/405
// (tubuh {} bisa 4xx validasi, atau 503 bila R2/OAuth tak terpasang di uji; ketepatan isi diuji di berkas per-modul).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv } from "../_bantu.mjs";
import { ekstrakRute, siapkanPeran, panggil, metodeSalah, TULIS, TANPA_CSRF } from "../_rute.mjs";

const c = JSON.parse(readFileSync(new URL("./cakupan.json", import.meta.url), "utf8")).rute;
const { rute } = await ekstrakRute();
let E, tutup, P;
before(async () => { ({ env: E, tutup } = await buatEnv()); P = await siapkanPeran(E); });
after(async () => { await tutup?.(); });

test("penjaga: peran uji terbaca untuk minimal 200 rute", () => {
  assert.ok(Object.keys(c.peran).length >= 200, `peran terbaca ${Object.keys(c.peran).length}`);
});

for (const k of Object.keys(c.peran).filter((x) => rute.has(x))) {
  const { benar, salah } = c.peran[k], tulis = TULIS.has(k.split(" ")[0]);
  test(k, async () => {
    for (const p of benar) {
      const s = await panggil(E, P, k, { peran: p === "tamu" ? null : p });
      assert.ok(![401, 403, 405].includes(s), `${k}: peran ${p} harus lolos penjaga, dapat ${s}`);
    }
    for (const p of salah) {
      const s = await panggil(E, P, k, { peran: p === "tamu" ? null : p });
      assert.ok([401, 403].includes(s), `${k}: peran ${p} harus DITOLAK 401/403, dapat ${s}`);
    }
    const m = metodeSalah(k, [...rute.keys()]);
    if (m) assert.equal(await panggil(E, P, k, { peran: benar.find((x) => x !== "tamu") ?? null, metode: m }), 405, `${k}: metode ${m} harus 405`);
    if (tulis && !TANPA_CSRF.has(k)) {
      const p = benar.find((x) => x !== "tamu") ?? null;
      assert.equal(await panggil(E, P, k, { peran: p, csrf: false }), 403, `${k}: tanpa x-pb harus 403`);
      assert.equal(await panggil(E, P, k, { peran: p, origin: "https://jahat.example.org" }), 403, `${k}: Origin asing harus 403`);
    }
  });
}
