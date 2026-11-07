// Katalog sumber data untuk /metode: menghimpun meta "sumber" dari semua public/data/*.json menjadi public/data/sumber_katalog.json.
// Hanya entri berbentuk objek dengan judul dan url https. Jalankan: node scripts/pipa/katalog_sumber.mjs
import fs from 'node:fs';
import path from 'node:path';
const DIR = path.join(process.cwd(), 'public/data');
const baris = [], lihat = new Set();
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json') && x !== 'sumber_katalog.json').sort()) {
  let d; try { d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf-8')); } catch { continue; }
  const s = d.sumber; if (!Array.isArray(s)) continue;
  for (const x of s) {
    if (!x || typeof x !== 'object' || !x.judul || !/^https:\/\//.test(x.url || '')) continue;
    const k = x.url + '|' + x.judul; if (lihat.has(k)) continue; lihat.add(k);
    baris.push({ dataset: f.replace(/\.json$/, ''), judul: x.judul, penerbit: x.penerbit || '', tahun: x.tahun ?? null, url: x.url, lisensi: x.lisensi || '', tingkat_bukti: x.tingkat_bukti || '', diperbarui: d.dibangun_pada || d.meta?.diperbarui || '' });
  }
}
const hasil = { lapis: 'publik', dibangun_pada: new Date().toISOString().slice(0, 10), jumlah: baris.length, dataset: new Set(baris.map((b) => b.dataset)).size, baris };
fs.writeFileSync(path.join(DIR, 'sumber_katalog.json'), JSON.stringify(hasil) + '\n');
console.log(`sumber_katalog: ${baris.length} sumber dari ${hasil.dataset} dataset`);
