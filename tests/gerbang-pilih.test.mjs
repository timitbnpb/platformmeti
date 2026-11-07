// Gerbang pemilih cantik: tiap <select> di HTML/JS template punya data-ikon (atau lewat pilihHtml yang menuliskannya),
// atau dikecualikan eksplisit dengan data-asli. Ditambah uji pembangun menu.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const PUB = new URL("../public/", import.meta.url).pathname;
const jalan = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return n === "vendor" || n === "data" ? [] : statSync(p).isDirectory() ? jalan(p) : [p]; });

test("tiap <select> punya data-ikon atau data-asli", () => {
  const salah = [];
  for (const p of jalan(PUB).filter((f) => !f.endsWith("inti/pilih.js") && /\.(html|js)$/.test(f))) {
    const s = readFileSync(p, "utf8");
    for (const m of s.matchAll(/<select\b[^>]*>/g)) {
      if (!/data-ikon=|data-asli\b/.test(m[0]) && !/\$\{[^}]*ikonSel[^}]*\}/.test(m[0])) salah.push(`${relative(PUB, p)}: ${m[0].slice(0, 80)}`);
    }
  }
  assert.deepEqual(salah, []);
});

test("pilihHtml menulis data-ikon pada select dan per opsi", async () => {
  const { pilihHtml } = await impor("inti/komponen.js");
  const h = pilihHtml({ id: "x", ikon: "jenis", label: "L", opsi: [["", "Semua"], ["a", "A", "tek:surya", 3]], nilai: "a" });
  assert.match(h, /<select id="x"[^>]*data-ikon="jenis"/);
  assert.match(h, /<option value="a" selected[^>]*data-ikon="tek:surya"[^>]*data-n="3"/);
});

test("menuHtml: ikon, hitungan, centang, judul grup", async () => {
  const { menuHtml, ikonHtml, modelOpsi, labelTombol } = await impor("inti/pilih.js");
  const h = menuHtml([
    { i: 0, label: "Semua", ikon: "jenis", n: "", selected: false, disabled: false, grup: "" },
    { i: 1, label: "Surya <b>", ikon: "tek:surya", n: "12", selected: true, disabled: false, grup: "Energi" },
  ]);
  assert.match(h, /pc-grup[^>]*>Energi/);
  assert.match(h, /aria-selected="true"[\s\S]*jm-ikt[\s\S]*Surya &lt;b&gt;[\s\S]*pc-n">12/);
  assert.match(h, /aria-selected="false"/);
  assert.match(ikonHtml("prov:11"), /provinsi\/11\.png/);
  assert.match(ikonHtml("st:beroperasi"), /^<svg/);
  assert.equal(ikonHtml("tek:tidak-ada"), "");
  const o = (v, l, ik) => ({ value: v, textContent: l, selected: false, disabled: false, dataset: ik ? { ikon: ik } : {}, parentElement: { tagName: "SELECT" } });
  const sel = { dataset: { ikon: "jenis" }, options: [o("", "Semua"), Object.assign(o("a", "A", "peta"), { selected: true })] };
  sel.selectedOptions = sel.options.filter((x) => x.selected);
  assert.deepEqual(modelOpsi(sel).map((x) => x.ikon), ["jenis", "peta"]);
  assert.deepEqual(labelTombol(sel), { teks: "A", ikon: "peta" });
});

async function impor(rel) {
  if (!impor.h) {
    impor.h = registerHooks({ resolve(spec, ctx, next) {
      return next(spec.startsWith("/") ? pathToFileURL(join(PUB, spec)).href : spec, ctx); } });
  }
  return import(pathToFileURL(join(PUB, rel)).href);
}
