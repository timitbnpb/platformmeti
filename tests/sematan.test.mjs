// /sematan/<jenis>/<id>: kartu terbuka untuk <iframe>; satu-satunya rute yang dilonggarkan, rute lain tetap DENY.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";
import { COOKIE_PALSU, DB_SESI_PALSU } from "./_bantu.mjs";

const PUB = new URL("../public/", import.meta.url);
const ASSETS = { fetch: async (req) => {
  const p = new URL(req.url).pathname, f = p === "/o" ? "o.html" : p.slice(1);
  try { return new Response(readFileSync(new URL(f, PUB)), { status: 200 }); } catch { return new Response("x", { status: 404 }); }
} };
const env = { ASSETS, DB: DB_SESI_PALSU };
const ambil = (path, cookie) => worker.fetch(new Request("https://uji.example" + path, { headers: cookie ? { cookie } : {} }), env);
const org = JSON.parse(readFileSync(new URL("data/organisasi.json", PUB))).baris[0];

test("sematan: tamu tanpa sesi boleh, bisa dibingkai, atribusi + tautan balik, nama di-escape", async () => {
  const r = await ambil("/sematan/organisasi/" + org.id), h = await r.text();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-frame-options"), null);
  assert.match(r.headers.get("content-security-policy"), /frame-ancestors \*/);
  assert.match(r.headers.get("content-security-policy"), /script-src 'self'/);
  assert.ok(h.includes("Direktori METI") && h.includes(`href="https://uji.example/o/${org.id}"`));
  assert.ok(!/<script/i.test(h));
});

test("sematan: id tak dikenal, jenis liar, metode tulis = 404 seragam", async () => {
  for (const p of ["/sematan/organisasi/tidak-ada-xyz", "/sematan/rahasia/x", "/sematan/organisasi/a%3Cb", "/sematan/", "/sematan/organisasi/" + org.id + "/x"]) assert.equal((await ambil(p)).status, 404, p);
  const r = await worker.fetch(new Request("https://uji.example/sematan/organisasi/" + org.id, { method: "POST" }), env);
  assert.equal(r.status, 404);
});

test("rute lain tetap DENY dan frame-ancestors 'none'", async () => {
  for (const p of ["/o/" + org.id]) {
    const r = await ambil(p, COOKIE_PALSU);
    assert.equal(r.headers.get("x-frame-options"), "DENY", p);
    assert.match(r.headers.get("content-security-policy"), /frame-ancestors 'none'/, p);
  }
});
