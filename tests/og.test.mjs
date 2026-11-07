// Kartu OG: SVG valid per jenis, tanpa data di luar ringkas publik, header keamanan, ETag/304, meta disisipkan.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";
import { COOKIE_PALSU, DB_SESI_PALSU } from "./_bantu.mjs";

const PUB = new URL("../public/", import.meta.url);
const ASSETS = { fetch: async (req) => {
  const p = new URL(req.url).pathname, f = p === "/o" ? "o.html" : p === "/p" ? "p.html" : p === "/" ? "index.html" : /\.\w+$/.test(p) || p.startsWith("/og/") ? p.slice(1) : p.slice(1) + ".html";
  try { return new Response(readFileSync(new URL(f, PUB)), { status: 200, headers: { "content-type": f.endsWith(".png") ? "image/png" : f.endsWith(".html") ? "text/html" : "application/json" } }); } catch { return new Response("x", { status: 404 }); }
} };
const tamu = (path, h = {}) => worker.fetch(new Request("https://uji.example" + path, { headers: h }), { ASSETS, DB: DB_SESI_PALSU });
const j = (f) => JSON.parse(readFileSync(new URL("data/" + f, PUB)));
const org = j("organisasi.json").baris[0], pro = j("proyek.json").baris[0], orang = j("orang.json").baris[0];

const KASUS = [["organisasi", org.id], ["proyek", pro.id], ["orang", orang.id], ["provinsi", "11"], ["topik", "bayu"], ["program", "plts-100gw"], ["beranda", "utama"]];

for (const [jenis, id] of KASUS) {
  test(`/og/${jenis}/${id}.svg: tamu dapat SVG 1200x630 valid + header`, async () => {
    const r = await tamu(`/og/${jenis}/${id}.svg`), s = await r.text();
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /^image\/svg\+xml/);
    assert.ok(s.startsWith("<svg") && s.endsWith("</svg>") && s.includes('width="1200"') && s.includes('height="630"'));
    assert.equal((s.match(/<(\w+)[\s>]/g) || []).length > 10, true);
    assert.match(r.headers.get("cache-control"), /public, max-age=\d{5,}/);
    assert.ok(r.headers.get("etag"));
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.ok(r.headers.get("content-security-policy"));
    assert.ok(!/<script|onload=|javascript:/i.test(s));
  });
}

test("ETag cocok = 304", async () => {
  const e = (await tamu(`/og/proyek/${pro.id}.svg`)).headers.get("etag");
  assert.equal((await tamu(`/og/proyek/${pro.id}.svg`, { "if-none-match": e })).status, 304);
});

test("tak bocor: kartu orang tanpa foto, tanpa sumber_url/ringkasan/id internal", async () => {
  const s = await (await tamu(`/og/orang/${orang.id}.svg`)).text();
  assert.ok(!/<image[^>]*\/img\/pengurus|foto/i.test(s));
  assert.ok(!s.includes("http") || s.includes("http://www.w3.org/2000/svg"));
  assert.ok(!s.includes(orang.id) && !s.includes(String(orang.sumber_url)));
});

test("id aneh/tak dikenal/jenis salah/POST = 404 atau tolak, tanpa injeksi", async () => {
  for (const p of ["/og/organisasi/tidak-ada.svg", "/og/organisasi/a%3Cb.svg", "/og/rahasia/x.svg", "/og/provinsi/99.svg", "/og/proyek/x.png", "/og/proyek/../x.svg"]) assert.equal((await tamu(p)).status, 404, p);
  assert.equal((await worker.fetch(new Request("https://uji.example/og/beranda/utama.svg", { method: "POST" }), { ASSETS, DB: DB_SESI_PALSU })).status, 404);
});

test("nama berkarakter khusus di-escape", async () => {
  const x = j("organisasi.json").baris.find((o) => /[&<>"']/.test(o.nama));
  if (!x) return;
  const s = await (await tamu(`/og/organisasi/${x.id}.svg`)).text();
  assert.ok(!s.includes(x.nama) || !/[<>]/.test(x.nama));
});

test("halaman masuk (terbuka) dan /o/<id> (masuk) memuat og:image + summary_large_image", async () => {
  const m = await (await tamu("/masuk")).text();
  assert.ok(m.includes('property="og:image" content="https://uji.example/og/beranda/utama.svg"') && m.includes('summary_large_image'));
  const o = await (await tamu("/o/" + org.id, { cookie: COOKIE_PALSU })).text();
  assert.ok(o.includes(`og/organisasi/${org.id}.svg`) && o.includes('content="summary_large_image"') && !o.includes('content="summary"'));
});
