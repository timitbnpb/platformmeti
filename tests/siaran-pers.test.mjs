// Siaran pers METI: skema data, fungsi pipeline murni, rute /siaran-pers/<id> (200 akun, 302 tamu, 404, escape judul), tombol bagikan.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import worker from "../src/worker.js";
import { COOKIE_PALSU, DB_SESI_PALSU } from "./_bantu.mjs";
import { barisTanggal, paragraf, kutipanPendek, ringkasan, idMedia, namaMedia, bersih } from "../scripts/pipa/siaran_pers.mjs";
import { tautanBagi } from "../public/inti/bagi.js";

const PUB = new URL("../public/", import.meta.url);
const data = JSON.parse(readFileSync(new URL("data/siaran_pers.json", PUB), "utf8"));
const foto = JSON.parse(readFileSync(new URL("data/berita_foto.json", PUB), "utf8"));
const JENIS = ["siaran_pers", "liputan_media", "liputan_kegiatan"];
const kata = (s) => s.split(/\s+/).filter(Boolean).length;

test("skema siaran_pers.json: bidang wajib, id unik, jenis sah, tanggal sah", () => {
  assert.equal(data.jumlah, data.baris.length);
  const ids = new Set();
  for (const r of data.baris) {
    assert.match(r.id, /^[A-Za-z0-9_-]{2,60}$/, r.id);
    assert.ok(!ids.has(r.id), "id ganda " + r.id); ids.add(r.id);
    assert.ok(JENIS.includes(r.jenis), r.id);
    assert.ok(r.judul && r.media, r.id);
    assert.match(r.tanggal, /^\d{4}-\d\d-\d\d$/, r.id);
    assert.match(r.url_sumber, /^https:\/\//, r.id);
    assert.ok(Array.isArray(r.topik) && Array.isArray(r.org_ids) && Array.isArray(r.galeri), r.id);
    assert.ok(!/[–—]/.test(JSON.stringify(r)), "em/en dash di " + r.id);
  }
});

test("konten METI sendiri berfoto lokal yang ada; ada siaran pers dan liputan kegiatan", () => {
  const meti = data.baris.filter((r) => r.jenis !== "liputan_media");
  assert.ok(data.baris.some((r) => r.jenis === "siaran_pers"));
  assert.ok(data.baris.some((r) => r.jenis === "liputan_kegiatan"));
  for (const r of meti) {
    assert.ok(r.foto && existsSync(new URL(r.foto.slice(1), PUB)), "foto hilang: " + r.id);
    for (const g of r.galeri) assert.ok(existsSync(new URL(g.slice(1), PUB)), "galeri hilang: " + g);
    assert.ok(r.isi.length > 0, "isi kosong: " + r.id);
  }
});

test("liputan media: tanpa salinan foto dan isi, ringkasan pendek, kutipan <= 25 kata, foto lewat berita_foto", () => {
  for (const r of data.baris.filter((x) => x.jenis === "liputan_media")) {
    assert.equal(r.foto, "", "foto media tidak boleh disalin: " + r.id);
    assert.deepEqual(r.isi, [], r.id);
    assert.ok(r.ringkasan.length <= 300, "ringkasan panjang: " + r.id);
    assert.ok(!r.kutipan || kata(r.kutipan) <= 25, "kutipan > 25 kata: " + r.id);
    if (foto[r.id]) assert.match(foto[r.id], /^https:\/\//);
  }
});

test("pipeline: barisTanggal, paragraf, ringkasan, kutipanPendek, idMedia", () => {
  const b = barisTanggal("Jakarta, 21 Oktober 2026 - Ketua Umum METI mengapresiasi.");
  assert.deepEqual([b.kota, b.tanggal, b.sisa], ["Jakarta", "2026-10-21", "Ketua Umum METI mengapresiasi."]);
  assert.equal(barisTanggal("Tanpa tanggal").tanggal, "");
  const p = paragraf("B50: Memperkuat Kemandirian\n\n“Keberanian memperbesar skala program merupakan perubahan yang sangat penting bagi masa depan Indonesia kita,” ujar Norman.\nIsi biasa yang berakhir titik.");
  assert.deepEqual(p.map((x) => Object.keys(x)[0]), ["h", "k", "p"]);
  assert.ok(ringkasan("Satu. Dua. Tiga.").split(". ").length <= 2);
  assert.ok(ringkasan("x ".repeat(400)).length <= 283);
  assert.equal(kutipanPendek("Ketua METI berkata “energi terbarukan perlu dipercepat secara nyata bagi rakyat” dalam forum."), "energi terbarukan perlu dipercepat secara nyata bagi rakyat");
  assert.equal(kutipanPendek("“" + "kata ".repeat(30) + "” METI"), "");
  assert.equal(idMedia("https://www.antaranews.com/berita/1?x=1"), idMedia("https://antaranews.com/berita/1"));
  assert.equal(namaMedia("www.antaranews.com"), "Antara");
  assert.equal(bersih("a — b &amp; c"), "a - b & c");
});

test("tautan bagikan: Facebook sharer, X intent, WhatsApp wa.me, LinkedIn, dengan url di-encode", () => {
  const h = tautanBagi("https://uji.example/siaran-pers/a b", "Judul & uji");
  assert.equal(h.fb, "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fuji.example%2Fsiaran-pers%2Fa%20b");
  assert.match(h.x, /^https:\/\/twitter\.com\/intent\/tweet\?url=.+&text=Judul%20%26%20uji$/);
  assert.match(h.wa, /^https:\/\/wa\.me\/\?text=Judul%20%26%20uji%20https%3A/);
  assert.match(h.li, /^https:\/\/www\.linkedin\.com\/sharing\/share-offsite\/\?url=/);
});

// ---- rute: ASSETS berisi fixture, jadi judul jahat diuji tanpa menyentuh data asli ----
const FIX = { baris: [
  { id: "uji-satu", jenis: "siaran_pers", judul: 'Judul <script>alert(1)</script> & "kutip" $&', ringkasan: "Ringkasan uji.", media: "METI", foto: "/img/siaran/uji.webp", isi: [], tanggal: "2026-10-21" },
  { id: "uji-media", jenis: "liputan_media", judul: "Berita uji", ringkasan: "R", media: "Katadata", foto: "", isi: [], tanggal: "2026-10-22" },
] };
const ASSETS = { fetch: async (req) => {
  const p = new URL(req.url).pathname;
  if (p === "/data/siaran_pers.json") return new Response(JSON.stringify(FIX), { status: 200 });
  if (p === "/siaran-pers-rinci") return new Response(readFileSync(new URL("siaran-pers-rinci.html", PUB)), { status: 200 });
  return new Response("x", { status: 404 });
} };
const ambil = (path, masuk = true) => worker.fetch(new Request("https://uji.example" + path, { headers: masuk ? { cookie: COOKIE_PALSU } : {} }), { ASSETS, DB: DB_SESI_PALSU });

test("/siaran-pers/<id>: akun masuk 200 dengan judul, canonical, og:image ter-escape", async () => {
  const r = await ambil("/siaran-pers/uji-satu"), h = await r.text();
  assert.equal(r.status, 200);
  assert.ok(h.includes("<title>Judul &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;kutip&quot; $&amp; | Direktori METI</title>"));
  assert.ok(!h.includes("<script>alert(1)"));
  assert.ok(h.includes('rel="canonical" href="https://uji.example/siaran-pers/uji-satu"'));
  assert.ok(h.includes('property="og:image" content="https://uji.example/img/siaran/uji.webp"'));
  assert.ok(!h.includes("<!--meta-->"));
  assert.equal((h.match(/<meta name="description"/g) || []).length, 1);
});

test("liputan media: judul berawalan nama media", async () => {
  assert.ok((await (await ambil("/siaran-pers/uji-media")).text()).includes("<title>Katadata | Berita uji | Direktori METI</title>"));
});

test("tamu 302 ke masuk dengan jalur kembali; id tak dikenal atau tak sah 404", async () => {
  const r = await ambil("/siaran-pers/uji-satu", false);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get("location"), "/masuk?ke=%2Fsiaran-pers%2Fuji-satu");
  assert.equal((await ambil("/siaran-pers/tidak-ada")).status, 404);
  assert.equal((await ambil("/siaran-pers/a%3Cb")).status, 404);
});
