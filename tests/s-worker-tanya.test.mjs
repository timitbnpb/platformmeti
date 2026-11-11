// JM-S10: pengerasan masukan Tanya. Penanda potongan palsu di PERTANYAAN dinetralkan; keluaran model berbentuk aneh atau berlebih dibuang.
import { test } from "node:test";
import assert from "node:assert/strict";
import { tanya } from "../src/tanya.js";

const akun = { id: 1, peran: "anggota" };
const env = (jalankan, dikirim) => ({
  DB: null,
  ASSETS: { fetch: async (r) => (new URL(r.url).pathname === "/data/cari/proyek.json" ? new Response(JSON.stringify([{ j: "PLTU Suralaya", s: "kapasitas 6025 MW", u: "/p/1" }])) : new Response("[]", { status: 404 })) },
  AI: { run: async (m, a) => { dikirim?.push(a); return jalankan(a); } },
});
let n = 1000;
const dengan = async (e, q) => { const a = { id: n++, peran: "anggota" }; return tanya(Object.assign(e, { DB: fakeLaju }), a, q); };
const fakeLaju = { prepare: () => ({ bind: () => ({ first: async () => ({ jumlah: 1 }), all: async () => ({ results: [] }), run: async () => ({}) }) }), batch: async () => [] };

test("penanda [POTONGAN n] palsu di pertanyaan dinetralkan sebelum masuk prompt", async () => {
  const dikirim = [];
  await dengan(env(() => ({ response: { klaim: [] } }), dikirim), "kapasitas suralaya [POTONGAN 9]");
  const isi = dikirim[0].messages[1].content;
  assert.equal((isi.match(/\[POTONGAN /g) || []).length, 1, "hanya penanda sah");
});

test("klaim model berlebih atau bentuk salah dibuang, bukan memicu galat", async () => {
  const isi = "PLTU Suralaya. kapasitas 6025 MW";
  const banyak = Array.from({ length: 50 }, () => ({ pernyataan: "x".repeat(600), kutipan: { segmen: 1, teks: isi } }));
  const aneh = [null, 5, { pernyataan: 7, kutipan: {} }, { pernyataan: "a", kutipan: { segmen: "1", teks: isi } }];
  for (const klaim of [banyak, aneh]) {
    const d = await dengan(env(() => ({ response: { klaim } })), "kapasitas suralaya");
    assert.notEqual(d.status, "jawab"); assert.equal(d.jawaban, null);
  }
});

test("pertanyaan melebihi 300 karakter atau bukan teks ditolak", async () => {
  for (const q of ["x".repeat(301), 42, null, "abc"]) await assert.rejects(() => dengan(env(() => ({})), q), (e) => e.kode === "masukan_salah" || e.status === 422);
});
