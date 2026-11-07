import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
// Akar: .ak-kepala-nav>.ak-seg.ak-kelompok{display:grid!important} mengalahkan atribut hidden,
// sehingga segmen Orang (#akPkSeg) tetap tampil di tab Organisasi. Aturan [hidden] wajib ada.
test("segmen kepala direktori: [hidden] menang atas display:grid!important", () => {
  const c = fs.readFileSync(new URL("../public/direktori.css", import.meta.url), "utf8");
  assert.match(c, /\.ak-kepala-nav>\.ak-seg\[hidden\]\{display:none!important\}/);
  assert.match(c, /\.ak-seg\.ak-kelompok[^{]*\{[^}]*display:grid!important/);
});
