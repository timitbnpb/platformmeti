// Gerbang aturan pemilik (7 Nov 2026): deretan tab/segmen/pilihan selalu ujung ke ujung, lebar sama, rata tengah.
// Menjaga penegak global di inti/jm.css dan melarang deretan tab yang dibuat rata kiri (justify-content:flex-start) di CSS layar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

test("penegak global tab ujung ke ujung ada di inti/jm.css", () => {
  const css = readFileSync("public/inti/jm.css", "utf8");
  assert.match(css, /\.jm-tab,\[role="tablist"\],\.jm-seg,\.jm-segmen,\.ak-seg\{width:100%!important/);
  assert.match(css, /grid-auto-columns:1fr/);
});

test("tidak ada deretan tab/segmen rata kiri di CSS layar", () => {
  const berkas = [...readdirSync("public").filter((f) => f.endsWith(".css")).map((f) => "public/" + f), ...readdirSync("public/inti").filter((f) => f.endsWith(".css")).map((f) => "public/inti/" + f)];
  const salah = [];
  for (const f of berkas) {
    const css = readFileSync(f, "utf8");
    for (const m of css.matchAll(/([^{}]*(?:-tab\b|tablist|-seg\b|-segmen\b)[^{}]*)\{([^}]*)\}/g)) {
      if (/justify-content:\s*(flex-)?start/.test(m[2]) && !/\b(a|button|li|span)\b\s*$/.test(m[1].trim())) salah.push(`${f}: ${m[1].trim().slice(0, 80)}`);
    }
  }
  assert.deepEqual(salah, [], "deretan tab rata kiri:\n" + salah.join("\n"));
});
