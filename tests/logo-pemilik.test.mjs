import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const l = JSON.parse(fs.readFileSync(new URL('../public/data/logo_pemilik.json', import.meta.url), 'utf8'));
test('logo_pemilik.json: tiap berkas ada di repo, jalur lolos urlOkLogo, pemilik sistem data utama punya logo', () => {
  for (const [n, e] of Object.entries(l)) {
    assert.ok(/^\/img\/(logo\/(org\/|sd\/)?|penerbit\/)[A-Za-z0-9_.-]+\.(png|ico|svg)$/.test(e.logo), n);
    assert.ok(fs.existsSync(new URL('../public' + e.logo, import.meta.url)), n + ' ' + e.logo);
  }
  for (const n of ['Kementerian ESDM', 'Bank Dunia', 'Bursa Efek Indonesia', 'PT PLN (Persero)', 'Badan Pusat Statistik', 'Bloomberg']) assert.ok(l[n], n);
});
