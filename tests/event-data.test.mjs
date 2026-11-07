// Data Event/Foto/Video/Podcast: pipeline gabung kalender, aturan hak foto, tanpa kontak pribadi, slug unik, video valid.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { selftest as stPerkaya } from "../scripts/pipa/kalender_perkaya.mjs";
import { selftest as stMedia } from "../scripts/pipa/media_data.mjs";

const baca = (f) => JSON.parse(readFileSync(new URL("../" + f, import.meta.url), "utf8"));
test("selftest pipeline perkaya dan media", () => { stPerkaya(); stMedia(); });
test("kalender: slug acara unik, tanpa poster Antara, tanpa kontak pribadi", () => {
  const k = baca("public/data/kalender.json"), acara = k.baris.filter((b) => !["regulasi", "tenggat"].includes(b.jenis));
  assert.equal(new Set(acara.map((b) => b.slug)).size, acara.length);
  assert.ok(acara.every((b) => /^[a-z0-9][a-z0-9-]{0,78}$/.test(b.slug)));
  for (const b of k.baris.filter((x) => x.poster)) { assert.match(b.poster.hak, /METI/); assert.doesNotMatch(b.poster.hak, /antara/i); assert.ok(existsSync(new URL("../public" + b.poster.file, import.meta.url)), b.poster.file); }
  const teks = JSON.stringify(k) + readFileSync(new URL("../data/kalender_perkaya.json", import.meta.url), "utf8");
  assert.doesNotMatch(teks, /Novia|noviepgg|081290287703/);
  assert.ok(k.baris.some((b) => b.slug === "meti-challenge-trophy-golf-2026") && k.baris.some((b) => b.slug === "enlit-asia-2027"), "kandidat acara baru masuk");
  assert.ok(k.baris.filter((b) => b.id.startsWith("ac_")).every((b, i, a) => i === 0 || b.id > a[i - 1].id), "nomor ac_ tidak bergeser oleh kandidat");
});
test("galeri: tiap foto berhak METI, berkas ada, bukan Antara", () => {
  const g = baca("public/data/galeri.json");
  assert.ok(g.baris.length >= 4);
  for (const f of g.baris) { assert.match(f.hak, /METI/); assert.doesNotMatch(f.hak + f.file, /antara/i); assert.ok(existsSync(new URL("../public" + f.file, import.meta.url)), f.file); }
});
test("video kanal METI dan ConEx: id 11 karakter, tanpa em dash, unggulan ada", () => {
  const v = baca("public/data/video_kanal.json");
  assert.ok(v.baris.some((x) => x.id === v.unggulan));
  for (const x of v.baris) { assert.match(x.id, /^[\w-]{11}$/); assert.doesNotMatch(x.judul, /[—·]/); assert.ok(x.kanal in v.kanal); }
  assert.ok(v.baris.some((x) => x.kanal === "meti") && v.baris.some((x) => x.kanal === "conex"));
});
test("event_mitra dan podcast: kerangka tanpa angka karangan", () => {
  const m = baca("public/data/event_mitra.json");
  assert.ok(m.acara.every((a) => Array.isArray(a.paket) && !("harga" in a)));
  assert.equal(baca("public/data/podcast.json").meti.length, 0);
});
