/* Gerbang: kartu konten (.jm-kartu, .jm-ds, .jm-ins-kartu) di template JS/HTML wajib memuat kepala exhibit
   (.jm-ex-hd atau exHtml(...)) dalam 900 karakter sesudah pembukanya, bukan judul h2/h3 polos.
   Pengecualian eksplisit beralasan di KECUALI (berkas -> alasan). Halaman tentang.* dikerjakan agent lain. */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const AKAR = new URL("../public/", import.meta.url).pathname;
const KECUALI = new Map([
  ["masuk.html", "kartu form"], ["aktivasi.html", "kartu form"], ["ganti-sandi.html", "kartu form"],
  ["proyek.js", "pembungkus pesan galat (galatHtml)"], ["peluang.js", "pembungkus pesan galat (galatHtml)"],
  ["teknologi.js", "pembungkus catatan 'teknologi tak dikenal'"],
  ["insight.js", "kerangka hantu; kepala exhibit diisi c.kepala() saat dimuat"],
  ["analisis.js", "ubin KPI kecil (jm-kpi-kepala), bukan kartu panel"],
  ["kalender.js", "kisi pekan; kepala kalender ada di #kepalaKal"], ["kalender.html", "kepala kalender (kal-kepala) berisi kontrol bulan"],
  ["admin.js", "wadah panel tab; tiap tab membuka kepalaTab"],
  ["admin_statistik.js", "pembungkus pesan galat"],
  ["beranda.js", "wadah galat dan hasil pencarian"], ["index.html", "wadah peta/karbon; JS memasang exHtml"],
]);

const hit = [];
for (const f of readdirSync(AKAR).filter((n) => /\.(js|html)$/.test(n) && !n.startsWith("tentang") && !n.startsWith("_"))) {
  const s = readFileSync(AKAR + f, "utf8");
  for (const m of s.matchAll(/class="([^"]*)"/g)) {
    if (!m[1].split(/\s+/).some((k) => k === "jm-kartu" || k === "jm-ds" || k === "jm-ins-kartu")) continue;
    hit.push([f, s.slice(m.index, m.index + 900)]);
  }
}

test("kartu konten memuat kepala exhibit", () => {
  const salah = hit.filter(([f, snip]) => !KECUALI.has(f) && !/jm-ex-hd|exHtml\(/.test(snip)).map(([f, snip]) => `${f}: ${snip.slice(0, 80).replace(/\n/g, " ")}`);
  assert.deepEqual(salah, [], "kartu tanpa kepala exhibit (pakai exHtml atau .jm-ex-hd, atau tambah KECUALI beralasan)");
});

test("kartu dataset beranda dibangun dari exHtml", () => {
  const s = readFileSync(AKAR + "beranda_data.js", "utf8");
  assert.ok(/const kartu = [^\n]*exHtml\(/.test(s) && !/jm-ds-kep/.test(s), "kartu() beranda_data.js wajib exHtml, bukan .jm-ds-kep");
});
