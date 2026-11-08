// Gerbang Mandarin: tiap kunci zh.json ada di id.json, placeholder {x} sama, tanpa em dash/titik tengah;
// rantai cadangan zh -> en -> id, tanggal dan angka zh, zh tidak dikirim ke akun (CHECK D1 hanya id/en).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const baca = (n) => JSON.parse(readFileSync(fileURLToPath(new URL(`../public/i18n/${n}.json`, import.meta.url)), "utf8"));
const [id, en, zh] = ["id", "en", "zh"].map(baca);
const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();

test("tiap kunci zh.json ada di id.json, tidak kosong, placeholder sama persis", () => {
  for (const [k, v] of Object.entries(zh)) {
    assert.ok(k in id, `kunci tak ada di id.json: ${k}`);
    assert.ok(typeof v === "string" && v.trim(), `kosong: ${k}`);
    assert.equal(ph(v), ph(id[k]), `placeholder beda: ${k}`);
    assert.ok(!/[—·•]/.test(v), `em dash atau titik tengah: ${k}`);
  }
});

// stub peramban minimal supaya gantiBahasa/terapkanDom jalan di Node
const panggilan = [];
const el = { lang: "" };
globalThis.document = { documentElement: el, querySelectorAll: () => [], dispatchEvent: () => {} };
globalThis.CustomEvent = class { constructor(n, o) { this.type = n; this.detail = o?.detail; } };
globalThis.location = { search: "", href: "http://x/" };
globalThis.history = { replaceState() {} };
globalThis.localStorage = { setItem() {}, getItem: () => null };
globalThis.fetch = async (u, o) => {
  panggilan.push([String(u), o?.method || "GET"]);
  const m = /\/i18n\/(\w+)\.json/.exec(String(u));
  return { ok: true, json: async () => ({ id, en, zh }[m[1]]) };
};
const i18n = await import("../public/i18n.js");

test("rantai cadangan zh -> en -> id, lang zh-Hans, sumbu data en", async () => {
  await i18n.gantiBahasa("zh");
  assert.equal(el.lang, "zh-Hans");
  assert.equal(i18n.bahasaData(), "en");
  const kZh = Object.keys(zh)[0];
  assert.equal(i18n.t(kZh), zh[kZh]);
  const kEn = Object.keys(en).find((k) => !(k in zh));
  assert.equal(i18n.t(kEn), en[kEn]);
  assert.ok(i18n.ada(kEn));
  assert.equal(i18n.t("kunci.tak.ada.sama.sekali"), "kunci.tak.ada.sama.sekali");
  await i18n.gantiBahasa("id");
  assert.equal(el.lang, "id");
  assert.equal(i18n.bahasaData(), "id");
});

test("tanggal dan angka zh", () => {
  assert.equal(i18n.tanggal("2026-11-12", { bahasa: "zh" }), "2026年11月12日");
  assert.equal(i18n.tanggal("2026-11-12", { bahasa: "zh", gaya: "panjang" }), "2026年11月12日");
  assert.equal(i18n.tanggal("2026-11-12", { bahasa: "en" }), "12 Nov 2026");
  assert.equal(i18n.angka(1234567.891, { desimal: 2, bahasa: "zh" }), "1,234,567.89");
  assert.equal(i18n.angka(1234567.891, { desimal: 2, bahasa: "id" }), "1.234.567,89");
  assert.equal(i18n.tanggal("2026-02-30", { bahasa: "zh" }), "-");
});

test("pilihan zh tidak dikirim ke /api/saya (CHECK akun.bahasa hanya id/en)", async () => {
  panggilan.length = 0;
  await i18n.gantiBahasa("zh", { masuk: true });
  assert.ok(!panggilan.some(([, m]) => m === "PATCH"));
  await i18n.gantiBahasa("en", { masuk: true });
  assert.ok(panggilan.some(([u, m]) => u === "/api/saya" && m === "PATCH"));
  await i18n.gantiBahasa("id");
});
