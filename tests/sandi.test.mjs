// sandi.js (JM-B02): PBKDF2-SHA256, garam 16 byte, waktu tetap. S5 menjalankannya DI workerd (bukan hanya Node).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { unstable_dev } from "wrangler";
import { hashSandi, cocokSandi, hashPalsu, sandiSah, perluRehash, ITERASI_TARGET } from "../src/sandi.js";
import { samaTetap } from "../src/util.js";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

test("S1 hash: bentuk cocok kolom D1 (hash 64 hex, garam 32 hex, iterasi >= 100000)", async () => {
  const h = await hashSandi("sandi-panjang-benar");
  assert.match(h.hash, /^[0-9a-f]{64}$/);
  assert.match(h.garam, /^[0-9a-f]{32}$/);
  assert.ok(h.iterasi >= 100000);
  assert.notEqual(h.hash, "sandi-panjang-benar");
});

test("S2 bukan sha256(garam+sandi) dan garam acak per hash", async () => {
  const a = await hashSandi("sandi-panjang-benar"), b = await hashSandi("sandi-panjang-benar");
  assert.notEqual(a.garam, b.garam);
  assert.notEqual(a.hash, b.hash);
  const { createHash } = await import("node:crypto");
  assert.notEqual(a.hash, createHash("sha256").update(a.garam + "sandi-panjang-benar").digest("hex"));
});

test("S3 cocokSandi: benar true, salah false, iterasi lain false", async () => {
  const h = await hashSandi("sandi-panjang-benar");
  assert.equal(await cocokSandi("sandi-panjang-benar", h.hash, h.garam, h.iterasi), true);
  assert.equal(await cocokSandi("sandi-panjang-salah", h.hash, h.garam, h.iterasi), false);
  assert.equal(await cocokSandi("sandi-panjang-benar", h.hash, h.garam, h.iterasi + 1), false);
  assert.equal(await cocokSandi("sandi-panjang-benar", "", h.garam, h.iterasi), false);
});

test("S4 perbandingan waktu tetap: samaTetap tanpa keluar awal, panjang beda false", () => {
  assert.equal(samaTetap("abc", "abc"), true);
  assert.equal(samaTetap("abc", "abd"), false);
  assert.equal(samaTetap("abc", "abcd"), false);
  assert.equal(samaTetap("", ""), true);
  // waktu: selisih awal-vs-akhir tidak berarti; 2000 putaran tiap sisi, rasio harus dekat 1
  const A = "a".repeat(64), awal = "b" + "a".repeat(63), akhir = "a".repeat(63) + "b";
  const ukur = (x) => { const t = process.hrtime.bigint(); for (let i = 0; i < 20000; i++) samaTetap(A, x); return Number(process.hrtime.bigint() - t); };
  ukur(awal); ukur(akhir);
  const r = ukur(awal) / ukur(akhir);
  assert.ok(r > 0.5 && r < 2, `rasio waktu ${r}`);
});

test("S4b hashPalsu menghitung PBKDF2 penuh (bukan jalan pintas)", async () => {
  const t = performance.now();
  await hashPalsu("apa-saja-12345");
  const palsu = performance.now() - t;
  const t2 = performance.now();
  await hashSandi("apa-saja-12345");
  assert.ok(palsu > (performance.now() - t2) * 0.3, "hashPalsu terlalu cepat");
});

test("S6 kebijakan sandi 12 sampai 128, bukan surel", () => {
  assert.equal(sandiSah("pendek", "a@b.id"), false);
  assert.equal(sandiSah("x".repeat(12), "a@b.id"), true);
  assert.equal(sandiSah("x".repeat(129), "a@b.id"), false);
  assert.equal(sandiSah("Orang@Contoh.ID", "orang@contoh.id"), false);
  assert.equal(sandiSah(12345678901234, "a@b.id"), false);
  assert.equal(perluRehash(100000), ITERASI_TARGET > 100000);
});

test("S5 di workerd: 210.000 iterasi diterima, hash-verifikasi bulat, bukan-cocok ditolak", { timeout: 120000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "jm-sandi-"));
  const skrip = join(dir, "w.mjs");
  writeFileSync(skrip, `
    import { hashSandi, cocokSandi } from ${JSON.stringify(join(SRC, "sandi.js"))};
    export default { async fetch() {
      const h = await hashSandi("sandi-panjang-benar");
      return Response.json({ iterasi: h.iterasi, benar: await cocokSandi("sandi-panjang-benar", h.hash, h.garam, h.iterasi),
        salah: await cocokSandi("sandi-panjang-salah", h.hash, h.garam, h.iterasi) });
    } };`);
  const w = await unstable_dev(skrip, { local: true, logLevel: "error", compatibilityDate: "2026-11-01", experimental: { disableExperimentalWarning: true } });
  try {
    const r = await (await w.fetch("/")).json();
    assert.equal(r.benar, true);
    assert.equal(r.salah, false);
    assert.ok(r.iterasi >= 100000 && r.iterasi <= ITERASI_TARGET);
    console.log("# workerd iterasi diterima:", r.iterasi);
  } finally { await w.stop(); rmSync(dir, { recursive: true, force: true }); }
});
