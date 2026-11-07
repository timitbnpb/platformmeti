// Rute GET /api/foto-berita/:id: hanya id tercatat, tanpa parameter url, header aman.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";

const data = JSON.parse(readFileSync(new URL("../public/data/berita_foto.json", import.meta.url), "utf8"));
const [id, asal] = Object.entries(data)[0];
const env = { ASSETS: { fetch: async () => new Response(JSON.stringify(data)) } };
const panggil = (p) => worker.fetch(new Request("https://x.test" + p), env, {});
const fetchAsli = globalThis.fetch;

test("id tak dikenal 404; parameter url ditolak", async () => {
  assert.equal((await panggil("/api/foto-berita/zzzzzzzz")).status, 404);
  assert.equal((await panggil("/api/foto-berita/" + id + "?url=https://evil.test/a.png")).status, 404);
  assert.equal((await panggil("/api/foto-berita/" + encodeURIComponent("https://evil.test/a.png"))).status, 404);
});
test("id dikenal: fetch hanya ke url tercatat, header benar, non-gambar 404", async () => {
  const dipanggil = [];
  globalThis.fetch = async (u) => { dipanggil.push(String(u)); return new Response("PNG", { headers: { "content-type": "image/png" } }); };
  try {
    const r = await panggil("/api/foto-berita/" + id);
    assert.equal(r.status, 200);
    assert.deepEqual(dipanggil, [asal]);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.match(r.headers.get("cache-control"), /public.*max-age=2592000/);
    assert.equal(r.headers.get("set-cookie"), null);
    globalThis.fetch = async () => new Response("<html>", { headers: { "content-type": "text/html" } });
    assert.equal((await panggil("/api/foto-berita/" + id)).status, 404);
  } finally { globalThis.fetch = fetchAsli; }
});
