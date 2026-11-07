// /o/<id> dan /p/<id>: Worker menyuntik judul, deskripsi, og:* per entitas (escape penuh); id tak dikenal = 404.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";
import { namaProyek } from "../public/inti/nama_proyek.js";

const PUB = new URL("../public/", import.meta.url);
const ASSETS = { fetch: async (req) => {
  const p = new URL(req.url).pathname, f = p === "/o" ? "o.html" : p === "/p" ? "p.html" : p.slice(1);
  try { return new Response(readFileSync(new URL(f, PUB)), { status: 200 }); } catch { return new Response("x", { status: 404 }); }
} };
const ambil = (path) => worker.fetch(new Request("https://uji.example" + path), { ASSETS });
const org = JSON.parse(readFileSync(new URL("data/organisasi.json", PUB))).baris, pro = JSON.parse(readFileSync(new URL("data/proyek.json", PUB))).baris;

test("/o/<id>: 200, judul memuat nama (di-escape), og:title dan canonical", async () => {
  const o = org.find((x) => /[&<>"']/.test(x.nama)) || org[0];
  const r = await ambil("/o/" + o.id), h = await r.text();
  assert.equal(r.status, 200);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  assert.ok(h.includes(`<title>${esc(o.nama)} | Direktori METI</title>`));
  assert.ok(h.includes(`<meta property="og:title" content="${esc(o.nama)} | Direktori METI">`));
  assert.ok(h.includes(`rel="canonical" href="https://uji.example/o/${o.id}"`));
  assert.ok(!h.includes("<!--meta-->"));
});

test("/p/<id>: 200 dengan nama Indonesia di judul", async () => {
  const p = pro.find((x) => x.nama === "PLTS Terapung Cirata") || pro[0];
  const r = await ambil("/p/" + p.id), h = await r.text();
  assert.equal(r.status, 200);
  assert.ok(h.includes(`<title>${namaProyek(p)} | Direktori METI</title>`));
});

test("id tak dikenal atau tak sah = 404", async () => {
  assert.equal((await ambil("/o/tidak-ada-xyz")).status, 404);
  assert.equal((await ambil("/p/tidak-ada-xyz")).status, 404);
  assert.equal((await ambil("/o/a%3Cb")).status, 404);
});
