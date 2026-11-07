// Perhutanan sosial: sumber resmi (peta PS KLHK, geoportal/pskl.menlhk.go.id) tidak terjangkau dari lingkungan panen (koneksi gagal) pada 8 Nov 2026.
// Skrip ini mencoba sekali dan menulis hasilnya jujur ke data/lahan/status_ps.json; poligon tidak dikarang.
import fs from 'node:fs';
import path from 'node:path';
import { AKAR, jalankan } from './lahan_lib.mjs';
import { ambil } from '../pipa/_panen_sopan.mjs';
jalankan(import.meta.url, async () => {
  const hasil = [];
  for (const u of ['https://pskl.menlhk.go.id/robots.txt', 'https://geoportal.menlhk.go.id/robots.txt']) {
    try { await ambil(u); hasil.push({ url: u, ok: true }); } catch (e) { hasil.push({ url: u, ok: false, galat: String(e.message).slice(0, 120) }); }
  }
  const f = path.join(AKAR, 'data/lahan/status_ps.json'); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ tanggal: new Date().toISOString().slice(0, 10), hasil }, null, 1) + '\n'); console.log(hasil);
});
