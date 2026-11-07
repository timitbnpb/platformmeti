// Info perangkat sesi (0019): parser UA, lokasi cf tingkat kota, penyimpanan saat masuk, daftar, cabut satu sesi. Tanpa UA mentah dan tanpa IP.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { ringkasUA, lokasiCf } from "../src/ua.js";
import { hashSandi } from "../src/sandi.js";
import { sha, acak } from "../src/util.js";

const UA = {
  chromeMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  edgeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  chromeAndroid: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  tabletAndroid: "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  ipad: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
};
test("ringkasUA: peramban, OS, jenis perangkat", () => {
  assert.deepEqual(ringkasUA(UA.chromeMac), { perangkat: "Chrome di macOS", jenis: "desktop" });
  assert.deepEqual(ringkasUA(UA.safariIphone), { perangkat: "Safari di iPhone", jenis: "ponsel" });
  assert.deepEqual(ringkasUA(UA.edgeWin), { perangkat: "Edge di Windows", jenis: "desktop" });
  assert.deepEqual(ringkasUA(UA.chromeAndroid), { perangkat: "Chrome di Android", jenis: "ponsel" });
  assert.deepEqual(ringkasUA(UA.tabletAndroid), { perangkat: "Chrome di Android", jenis: "tablet" });
  assert.deepEqual(ringkasUA(UA.ipad), { perangkat: "Safari di iPad", jenis: "tablet" });
  assert.deepEqual(ringkasUA(UA.firefoxLinux), { perangkat: "Firefox di Linux", jenis: "desktop" });
  assert.deepEqual(ringkasUA(""), { perangkat: null, jenis: "desktop" });
  assert.deepEqual(ringkasUA(undefined), { perangkat: null, jenis: "desktop" });
});
test("lokasiCf: hanya kota, wilayah, negara; tanpa koordinat; dibersihkan", () => {
  assert.deepEqual(lokasiCf({ city: "Jakarta", region: "Jakarta", country: "id", latitude: "-6.2", longitude: "106.8", postalCode: "12950" }), { kota: "Jakarta", wilayah: "Jakarta", negara: "ID" });
  assert.deepEqual(lokasiCf(undefined), { kota: null, wilayah: null, negara: null });
  assert.equal(lokasiCf({ country: "INDONESIA" }).negara, null);
  assert.equal(lokasiCf({ city: "<b>X</b>\u0000" }).kota, "bX/b");
});

let E, tutup;
before(async () => {
  ({ env: E, tutup } = await buatEnv());
  const h = await hashSandi("sandi-uji-panjang-123");
  await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES ('s@uji.test','S','anggota','aktif',?,?,?)").bind(h.garam, h.hash, h.iterasi).run();
});
after(async () => { await tutup?.(); });
const masuk = async (ua, cf) => {
  const req = new Request("https://uji.test/api/masuk", { method: "POST", headers: { origin: "https://uji.test", "x-pb": "1", "content-type": "application/json", "user-agent": ua, "cf-connecting-ip": "198.51.100.5" }, body: JSON.stringify({ surel: "s@uji.test", sandi: "sandi-uji-panjang-123" }) });
  if (cf) Object.defineProperty(req, "cf", { value: cf });
  const r = await worker.fetch(req, E, { waitUntil() {} });
  assert.equal(r.status, 200);
  return /sesi=([0-9a-f]{64})/.exec(r.headers.get("set-cookie"))[1];
};
const api = async (jalur, token, metode = "GET") => {
  const r = await worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: { cookie: "sesi=" + token, origin: "https://uji.test", "x-pb": "1" } }), E, { waitUntil() {} });
  return { status: r.status, j: await r.json().catch(() => ({})) };
};

test("masuk menyimpan ringkasan, bukan UA mentah atau IP; daftar mengembalikannya; sesi lama 'tak dikenal'; cabut satu sesi lain", async () => {
  const t1 = await masuk(UA.chromeMac, { city: "Jakarta", region: "DKI Jakarta", country: "ID" });
  const t2 = await masuk(UA.safariIphone, { city: "Bandung", region: "Jawa Barat", country: "ID" });
  const lama = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?, (SELECT id FROM akun WHERE surel='s@uji.test'), ?)").bind(await sha(lama), Math.floor(Date.now() / 1000) + 3600).run();
  const info = (await E.DB.prepare("SELECT * FROM sesi_info").all()).results;
  assert.equal(info.length, 2);
  assert.ok(!JSON.stringify(info).includes("Mozilla") && !JSON.stringify(info).includes("198.51.100"), "tanpa UA mentah dan IP");
  const d = await api("/api/profil/saya/sesi", t1);
  assert.equal(d.status, 200);
  const per = Object.fromEntries(d.j.sesi.map((s) => [s.perangkat ?? "-", s]));
  assert.equal(per["Chrome di macOS"].ini, true);
  assert.deepEqual([per["Chrome di macOS"].kota, per["Chrome di macOS"].wilayah, per["Chrome di macOS"].negara, per["Chrome di macOS"].negara_nama], ["Jakarta", "DKI Jakarta", "ID", "Indonesia"]);
  assert.equal(per["Safari di iPhone"].jenis, "ponsel");
  assert.equal(per["-"].jenis, null, "sesi lama tanpa info");
  assert.ok(!JSON.stringify(d.j).includes(await sha(t2)), "hash penuh tidak keluar");
  // cabut: sesi ini tak bisa lewat jalur ini; sid ngawur 404; sesi lain berhasil dan tokennya mati
  assert.equal((await api(`/api/profil/saya/sesi/${per["Chrome di macOS"].sid}`, t1, "DELETE")).status, 404);
  assert.equal((await api("/api/profil/saya/sesi/0123456789abcdef", t1, "DELETE")).status, 404);
  assert.equal((await api(`/api/profil/saya/sesi/${per["Safari di iPhone"].sid}`, t1, "DELETE")).status, 200);
  assert.equal((await api("/api/profil/saya/sesi", t2)).status, 401, "sesi yang dikeluarkan mati");
  assert.equal((await api("/api/profil/saya/sesi", t1)).j.sesi.length, 2);
  assert.equal((await E.DB.prepare("SELECT count(*) AS n FROM sesi_info").first()).n, 1, "info ikut terhapus");
});
