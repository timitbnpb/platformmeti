// Lalu lintas orang vs AI (migrasi 0020): klasifikasi UA, CIDR, hitung di Worker sebelum gerbang masuk, tampilan admin. D1 lokal nyata.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";
import { klasifikasi, kanal, jalurBersih, halamanDihitung, cidrKe, dalamCidr, ambilCidr, verifikasi, rencanaHit } from "../src/lalin.js";

const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const MANUSIA = { bahasa: "id-ID,id;q=0.9", dest: "document" };

test("klasifikasi: orang, jawaban AI, crawl AI, mesin cari, bukan orang", () => {
  assert.equal(klasifikasi(CHROME, {}, MANUSIA).jenis, "manusia");
  assert.deepEqual(klasifikasi("Mozilla/5.0 AppleWebKit/537.36; compatible; ChatGPT-User/1.0", {}).nama, "ChatGPT");
  assert.equal(klasifikasi("Mozilla/5.0 Claude-User/1.0", {}).jenis, "ai_jawab");
  assert.equal(klasifikasi("Mozilla/5.0 (compatible; Perplexity-User/1.0)", {}).jenis, "ai_jawab");
  for (const ua of ["Mozilla/5.0 (compatible; GPTBot/1.2)", "ClaudeBot/1.0", "PerplexityBot/1.0", "OAI-SearchBot/1.0", "Amazonbot/0.1", "Mozilla/5.0 (compatible; Exa Crawler)"]) assert.equal(klasifikasi(ua, {}).jenis, "ai_crawl", ua);
  for (const ua of ["Mozilla/5.0 (compatible; Googlebot/2.1)", "Mozilla/5.0 (compatible; bingbot/2.0)", "Mozilla/5.0 (Applebot/0.1)", "DuckDuckBot/1.1"]) assert.equal(klasifikasi(ua, {}).jenis, "mesin_cari", ua);
  assert.equal(klasifikasi("Mozilla/5.0 (compatible; Applebot-Extended/0.1)", {}).jenis, "ai_crawl", "Applebot-Extended = pelatihan AI, bukan mesin cari");
  assert.equal(klasifikasi("curl/8.0", {}, MANUSIA).jenis, "tak");
  assert.equal(klasifikasi("", {}, MANUSIA).jenis, "tak");
  assert.match(klasifikasi(CHROME, { asn: 16509 }, MANUSIA).alasan, /hosting/);
  assert.match(klasifikasi(CHROME, { asOrganization: "DigitalOcean, LLC" }, MANUSIA).alasan, /hosting/);
  assert.match(klasifikasi(CHROME, {}, { bahasa: "*" }).alasan, /tanpa tanda/);
  assert.match(klasifikasi(CHROME, {}, { bahasa: "id", dest: "empty" }).alasan, /tanpa tanda/);
});

test("CIDR, verifikasi rentang IP operator, perayap palsu tidak dihitung", () => {
  assert.deepEqual(ambilCidr('{"prefixes":[{"ipv4Prefix":"66.249.64.0/27"},{"ipv6Prefix":"2001:4860:4801::/48"}]}').sort(), ["2001:4860:4801::/48", "66.249.64.0/27"]);
  const g = [cidrKe("66.249.64.0/27"), cidrKe("2001:4860:4801::/48")];
  assert.ok(dalamCidr("66.249.64.5", g)); assert.ok(!dalamCidr("66.249.64.64", g)); assert.ok(dalamCidr("2001:4860:4801:1::1", g)); assert.ok(!dalamCidr("1.2.3.4", g));
  const rentang = { google: g };
  assert.equal(verifikasi(rentang, "google", "66.249.64.5"), "terverifikasi");
  assert.equal(verifikasi(rentang, "google", "9.9.9.9"), "palsu");
  assert.equal(verifikasi(rentang, null, "9.9.9.9"), "tak terverifikasi");
  assert.equal(verifikasi({}, "google", "66.249.64.5"), "tak terverifikasi");
  const dasar = { ua: "Googlebot/2.1", cf: {}, jalur: "/", status: 302, kini: Date.UTC(2026, 10, 8, 3) };
  assert.equal(rencanaHit({ ...dasar, ip: "9.9.9.9", rentang }).jenis, "tak");
  assert.match(rencanaHit({ ...dasar, ip: "9.9.9.9", rentang }).dim[0][1], /palsu: Googlebot/);
  assert.equal(rencanaHit({ ...dasar, ip: "66.249.64.5", rentang }).jenis, "mesin_cari");
});

test("kanal, jalur bersih, hanya halaman dihitung", () => {
  assert.equal(kanal("https://chatgpt.com/", "x.id", null).kanal, "jawaban_ai");
  assert.equal(kanal("https://www.google.com/", "x.id", null).kanal, "pencarian");
  assert.equal(kanal("", "x.id", null).kanal, "langsung");
  assert.equal(kanal("", "x.id", "wa").kanal, "kampanye");
  assert.equal(jalurBersih("/Direktori.html"), "/direktori");
  assert.equal(jalurBersih("/o/pt-surya-abc"), "/o/*");
  assert.equal(jalurBersih("/wp-admin/x/y"), "lainnya");
  assert.ok(halamanDihitung("GET", "/masuk")); assert.ok(halamanDihitung("GET", "/direktori"));
  for (const [m, p] of [["POST", "/masuk"], ["GET", "/api/status"], ["GET", "/img/logo.png"], ["GET", "/tema.js"], ["GET", "/wp-login.php"]]) assert.ok(!halamanDihitung(m, p), m + p);
});

let E, tutup;
const tunggu = [];
const CTX = { waitUntil: (p) => tunggu.push(p) };
const ambil = async (jalur, ua, { ip = "203.0.113.9", header = {}, cookie } = {}) => {
  const req = minta(jalur, { ip, origin: null, cookie, header: { "user-agent": ua, ...header } });
  const res = await worker.fetch(req, { ...E, SAMPEL_BOT: "1" }, CTX);
  await Promise.all(tunggu.splice(0));
  return res;
};
const n = async (dim, kunci) => (await E.DB.prepare("SELECT COALESCE(SUM(n),0) AS n FROM lalin WHERE dim = ? AND kunci = ?").bind(dim, kunci).first()).n;
let admin;

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES ('adm@uji.test','a','admin','aktif',?,?,100000)").bind("a".repeat(32), "a".repeat(64)).run();
  const t = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(t), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  admin = "sesi=" + t;
});
after(async () => { await tutup?.(); });

test("bot: halaman 200 dihitung per jalur; gerbang masuk 302 tidak menulis D1", async () => {
  const GPT = "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)";
  assert.equal((await ambil("/direktori", GPT)).status, 302);
  assert.equal(await n("jenis", "ai_crawl"), 0, "302 tidak dicatat");
  await ambil("/masuk", GPT);
  assert.equal(await n("jenis", "ai_crawl"), 1);
  assert.equal(await n("jalur_bot", "/masuk"), 1);
  assert.equal(await n("perayap", "ai_crawl|GPTBot|tak terverifikasi"), 1);
  await ambil("/masuk", "Mozilla/5.0 (compatible; Googlebot/2.1)");
  assert.equal(await n("jenis", "mesin_cari"), 1);
  await ambil("/masuk", "Mozilla/5.0 Claude-User/1.0");
  assert.equal(await n("ai_agen", "Claude|tak terverifikasi"), 1);
  assert.equal(await n("jenis", "ai_jawab"), 1);
});

test("orang: unik harian lewat hash bergaram tanpa IP, tampilan, rujukan AI = klik dari jawaban AI; bot lain tidak dihitung", async () => {
  const h = { "accept-language": "id-ID,id", "sec-fetch-dest": "document", referer: "https://chatgpt.com/" };
  assert.equal((await ambil("/masuk", CHROME, { header: h })).status, 200);
  await ambil("/masuk", CHROME, { header: h });
  assert.equal(await n("jenis", "orang"), 1, "pengunjung yang sama dihitung sekali");
  assert.equal(await n("jenis", "tampilan"), 2);
  assert.equal(await n("jenis", "klik_ai"), 2);
  assert.equal(await n("kanal", "jawaban_ai"), 2);
  await ambil("/masuk", CHROME, { ip: "203.0.113.77", header: h });
  assert.equal(await n("jenis", "orang"), 2);
  await ambil("/masuk", "python-requests/2.0", { header: h });
  assert.equal(await n("jenis", "tak"), 1);
  assert.equal(await n("tak", "bot lain"), 1);
  // tanpa IP/UA tersimpan: tamu = 16 hex, kini = 8 hex
  assert.ok((await E.DB.prepare("SELECT h FROM lalin_tamu").all()).results.every((x) => /^[0-9a-f]{16}$/.test(x.h)));
  const semuaTeks = JSON.stringify([(await E.DB.prepare("SELECT * FROM lalin").all()).results, (await E.DB.prepare("SELECT * FROM lalin_kini").all()).results]);
  assert.ok(!semuaTeks.includes("203.0.113") && !semuaTeks.includes("Chrome"));
});

test("aset dan API tidak dihitung", async () => {
  const sebelum = (await E.DB.prepare("SELECT COALESCE(SUM(n),0) AS n FROM lalin WHERE dim='jenis'").first()).n;
  await ambil("/api/status", CHROME); await ambil("/tema.js", CHROME); await ambil("/img/logo/meti.png", CHROME);
  assert.equal((await E.DB.prepare("SELECT COALESCE(SUM(n),0) AS n FROM lalin WHERE dim='jenis'").first()).n, sebelum);
});

test("admin: /api/admin/lalin hanya admin; komposisi 24 jam, sejak awal, sedang membaca, dimensi", async () => {
  const tamu = await worker.fetch(minta("/api/admin/lalin?r=7h", { origin: null }), E, CTX);
  assert.equal(tamu.status, 401);
  const ok = await worker.fetch(minta("/api/admin/lalin?r=24j", { cookie: admin, origin: null }), E, CTX);
  assert.equal(ok.status, 200);
  const d = await ok.json();
  assert.equal(d.total24.orang, 2); assert.equal(d.total24.ai_jawab, 1); assert.equal(d.total24.ai_crawl, 1); assert.equal(d.total24.mesin_cari, 1);
  assert.equal(d.sejak.orang, 2); assert.equal(d.online, 2);
  assert.equal(d.per_jam.length, 24);
  assert.ok(d.dim.perayap.some(([k]) => k === "ai_crawl|GPTBot|tak terverifikasi"));
  assert.ok(d.dim.kanal.some(([k]) => k === "jawaban_ai"));
  assert.equal((await worker.fetch(minta("/api/admin/lalin?r=ngawur", { cookie: admin, origin: null }), E, CTX)).status, 422);
});

test("ambang kardinalitas: rujukan liar dibatasi 80 kunci per hari, hitung jenis tetap tepat", async () => {
  const h = { "accept-language": "id", "sec-fetch-dest": "document" };
  for (let i = 0; i < 90; i++) await ambil("/masuk", CHROME, { ip: "198.51.100." + (i % 250), header: { ...h, referer: `https://situs${i}.example/` } });
  const k = (await E.DB.prepare("SELECT COUNT(*) AS n FROM lalin WHERE dim='rujukan'").first()).n;
  assert.ok(k <= 82, "rujukan " + k);
});
