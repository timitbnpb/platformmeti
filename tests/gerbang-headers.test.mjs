// gerbang-headers (JM-A05, KPV §8): CSP ditegakkan tanpa 'unsafe-inline' di script-src, tanpa '*', sumber luar terdaftar.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIK = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const SUMBER_LUAR_SAH = new Set(["https://tiles.openfreemap.org", "https://i.ytimg.com", ...["https://akcdn.detik.net.id","https://apicms.thestar.com.my","https://asset.kompas.com","https://awsimages.detik.net.id","https://bali.tribunnews.com","https://bisnis.tempo.co","https://bl-i.thgim.com","https://cassette.sphdigital.com.sg","https://cdn-assets.jawapos.com","https://cdn.antaranews.com","https://cdn1-production-images-kly.akamaized.net","https://cdnmedia.beritajatim.com","https://cloud.jpnn.com","https://d32r1sh890xpii.cloudfront.net","https://en.tempo.co","https://english.news.cn","https://foto.kontan.co.id","https://greentechlead.com","https://hijau.bisnis.com","https://i0.wp.com","https://img.antaranews.com","https://img.etimg.com","https://img.okezone.com","https://img.tradearabia.com","https://imgcdn.harianjogja.com","https://jateng.tribunnews.com","https://kupang.tribunnews.com","https://media.koran-jakarta.com","https://pict.sindonews.com","https://rri-portal-app-assets.obs.ap-southeast-4.myhuaweicloud.com","https://static.republika.co.id","https://thumb.viva.co.id","https://wartakota.tribunnews.com","https://www.mpoc.org.my","https://www.tribunnews.com"]]);   // menambah sumber = mengubah berkas ini sengaja

function blok(teks) {
  const o = {};
  let jalur = null;
  for (const b of teks.split("\n")) {
    if (!b.trim() || b.trim().startsWith("#")) continue;
    if (!/^\s/.test(b)) { jalur = b.trim(); o[jalur] = {}; continue; }
    const i = b.indexOf(":");
    o[jalur][b.slice(0, i).trim().toLowerCase()] = b.slice(i + 1).trim();
  }
  return o;
}
const H = blok(readFileSync(join(PUBLIK, "_headers"), "utf8"));
const csp = Object.fromEntries(H["/*"]["content-security-policy"].split(";").map((d) => d.trim().split(/\s+/)).filter((d) => d[0]).map(([k, ...v]) => [k, v]));

test("H1 CSP: script-src hanya 'self', tanpa unsafe-inline/unsafe-eval", () => {
  assert.deepEqual(csp["script-src"], ["'self'"]);
  for (const [k, v] of Object.entries(csp)) {
    assert.ok(!v.includes("'unsafe-eval'"), k);
    if (k === "script-src" || k === "style-src" || k === "default-src") assert.ok(!v.includes("'unsafe-inline'"), k);
  }
});

test("H2 CSP: tanpa '*' dan tiap sumber luar terdaftar", () => {
  for (const [k, v] of Object.entries(csp)) {
    for (const s of v) {
      assert.ok(!s.includes("*"), `${k}: ${s}`);
      if (s.startsWith("http")) assert.ok(SUMBER_LUAR_SAH.has(s), `${k}: sumber luar tak terdaftar ${s}`);
    }
  }
  assert.ok(!H["/*"]["content-security-policy"].includes("cdnjs"), "MapLibre vendor lokal, tanpa CDN");
});

test("H3 CSP: direktif pengunci wajib ada", () => {
  assert.deepEqual(csp["frame-ancestors"], ["'none'"]);
  assert.deepEqual(csp["object-src"], ["'none'"]);
  assert.deepEqual(csp["base-uri"], ["'none'"]);
  assert.deepEqual(csp["default-src"], ["'self'"]);
  assert.ok("upgrade-insecure-requests" in csp);
});

test("H4 header dasar dan halaman terkunci", () => {
  const a = H["/*"];
  assert.match(a["strict-transport-security"], /max-age=31536000/);
  assert.equal(a["x-content-type-options"], "nosniff");
  assert.equal(a["x-frame-options"], "DENY");
  for (const j of ["/direktori", "/admin", "/masuk", "/aktivasi"]) {
    assert.match(H[j]["x-robots-tag"], /noindex/, j);
    assert.equal(H[j]["referrer-policy"], "no-referrer", j);
  }
  for (const j of ["/direktori", "/admin", "/api/*"]) assert.equal(H[j]["cache-control"], "private, no-store", j);
});

function* berkas(d) {
  for (const n of readdirSync(d)) {
    if (n === "vendor") continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) yield* berkas(p);
    else yield p;
  }
}

test("H5 pindai public/: tanpa skrip inline, style=, atribut on*=", () => {
  const sal = [];
  for (const p of berkas(PUBLIK)) {
    if (!/\.html$/.test(p)) continue;
    const t = readFileSync(p, "utf8");
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(t)) sal.push(p + ": <script> inline");
    if (/\sstyle\s*=/i.test(t)) sal.push(p + ": style=");
    if (/\son[a-z]+\s*=\s*["']/i.test(t)) sal.push(p + ": atribut on*=");
  }
  assert.deepEqual(sal, []);
});
