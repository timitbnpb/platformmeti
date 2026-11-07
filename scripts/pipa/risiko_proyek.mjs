// Skor risiko sosial-lingkungan per proyek (F2 butir 3): menggabungkan titik proyek terpadu dengan nilai lapisan publik
// (data/risiko/mentah.json, dipanen scripts/panen/risiko_panen.mjs) jadi public/data/risiko_proyek.json.
// Komponen tanpa data dikeluarkan dan bobot sisa dinormalkan; bobot dan ambang berstatus Hipotesis, hasil berlabel EST.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const BOBOT = { hutan: 0.3, gambut: 0.2, adat: 0.25, bahaya: 0.25 };
export const AMBANG = [['rendah', 0], ['sedang', 25], ['tinggi', 45], ['sangat-tinggi', 65]];
export const NILAI_HUTAN = { konservasi: 100, lindung: 100, konversi: 30, produksi: 50 };
const kelasHutan = (f) => {
  const t = `${f.desc || ''} ${f.kelas || ''}`.toLowerCase();
  if (/konservasi|suaka|taman nasional|cagar|taman (wisata|hutan raya|buru)/.test(t)) return 'konservasi';
  if (/lindung/.test(t)) return 'lindung';
  if (/konversi/.test(t)) return 'konversi';
  if (/produksi/.test(t)) return 'produksi';
  return null;
};
export const kelasSkor = (s) => (s == null ? null : [...AMBANG].reverse().find(([, b]) => s >= b)[0]);

/** m = entri mentah satu titik; kembalikan { skor, kelas, komponen, dikeluarkan } */
export function skor(m) {
  const komp = {}, keluar = [];
  if (m.hutan) {
    const ks = m.hutan.map(kelasHutan).filter(Boolean), v = ks.length ? Math.max(...ks.map((k) => NILAI_HUTAN[k])) : 0;
    komp.hutan = { v, ket: ks.length ? [...new Set(ks)].sort((a, b) => NILAI_HUTAN[b] - NILAI_HUTAN[a])[0] : 'apl' };
  } else keluar.push('hutan');
  if (typeof m.gambut === 'number') komp.gambut = { v: Math.round((m.gambut / 255) * 100), ket: m.gambut >= 128 ? 'gambut' : m.gambut > 0 ? 'rendah' : 'tidak' }; // alfa ubin GFW = intensitas 0-255
  else keluar.push('gambut');
  // poligon LandMark Indonesia belum lengkap: tidak ada poligon bukan bukti tidak ada wilayah adat, jadi hanya kena = komponen
  if (m.adat && m.adat.length) komp.adat = { v: 100, ket: m.adat[0].nama || 'adat' };
  else keluar.push('adat');
  const tunggal = m.bahaya ? Object.entries(m.bahaya).filter(([k, v]) => k !== 'multi' && typeof v === 'number') : [];
  // indeks multi-bahaya InaRISK bila ada; bila layanan tak menjawab, rata-rata lapis tunggal yang menjawab (ket 'rata-rata')
  const b = m.bahaya && typeof m.bahaya.multi === 'number' ? m.bahaya.multi : tunggal.length ? tunggal.reduce((a, [, v]) => a + v, 0) / tunggal.length : null;
  if (typeof b === 'number') komp.bahaya = { v: Math.round(b * 100), ket: typeof m.bahaya.multi === 'number' ? 'multi' : 'rata-rata', rinci: Object.fromEntries(tunggal) };
  else keluar.push('bahaya');
  const ada = Object.keys(komp), w = ada.reduce((s, k) => s + BOBOT[k], 0);
  if (ada.length < 2) return { skor: null, kelas: null, komponen: komp, dikeluarkan: keluar };
  const s = Math.round(ada.reduce((a, k) => a + BOBOT[k] * komp[k].v, 0) / w);
  return { skor: s, kelas: kelasSkor(s), komponen: komp, dikeluarkan: keluar };
}

export function bangun() {
  const mentah = JSON.parse(fs.readFileSync(path.join(AKAR, 'data/risiko/mentah.json'), 'utf8'));
  const terpadu = JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data/proyek_terpadu.json'), 'utf8'));
  const baris = [];
  for (const r of terpadu.baris) {
    const m = mentah.titik[r.id]; if (!m) continue;
    const h = skor(m);
    baris.push({ id: r.id, nama: r.nama, tek: r.tek, status: r.status, mw: r.mw, prov: r.prov, prov_kode: r.prov_kode, pemilik: r.pemilik ? { nama: r.pemilik.nama, org_id: r.pemilik.org_id, logo: r.pemilik.logo } : null,
      lat: r.lat, lng: r.lng, presisi: r.presisi, profil: !!r.profil, ...h });
  }
  const dinilai = baris.filter((r) => r.skor != null);
  const per = {};
  for (const r of dinilai) { const t = per[r.tek] ||= { n: 0, jumlah: 0, kelas: { rendah: 0, sedang: 0, tinggi: 0, 'sangat-tinggi': 0 } }; t.n++; t.jumlah += r.skor; t.kelas[r.kelas]++; }
  for (const t of Object.values(per)) t.rata = Math.round(t.jumlah / t.n); 
  return {
    lapis: 'risiko_proyek', dibangun_pada: new Date().toISOString().slice(0, 10), tanggal_ambil: mentah.tanggal_ambil, tingkat_bukti: 'kajian',
    meta: {
      jumlah: baris.length, tak_dinilai: terpadu.baris.filter((r) => !r.ragu && !mentah.titik[r.id]).length, dinilai: dinilai.length, bobot: BOBOT, ambang: Object.fromEntries(AMBANG), status_bobot: 'Hipotesis',
      nilai_hutan: NILAI_HUTAN,
      metode: 'Skor 0-100 = rata-rata berbobot komponen yang punya data: kawasan hutan (konservasi dan lindung 100, produksi tetap dan terbatas 50, produksi konversi 30, areal penggunaan lain 0), gambut (intensitas piksel GFW 0-100), wilayah adat LandMark (kena 100; tanpa poligon tidak dihitung karena cakupan belum lengkap), indeks multi-bahaya InaRISK (0-1 dikali 100). Komponen tanpa data dikeluarkan dan bobot sisa dinormalkan; minimal dua komponen. Bobot dan ambang kelas Hipotesis; hasil EST: titik berpresisi kabupaten (pusat perkiraan) dapat meleset beberapa kilometer, dan titik berpresisi provinsi tidak dinilai.',
      sumber: [
        { id: 'hutan', judul: 'Kawasan hutan Indonesia (KLHK), ubin vektor idn_forest_area v201709', penerbit: 'KLHK via Global Forest Watch', url: mentah.lapis.hutan.url, lisensi: mentah.lapis.hutan.lisensi },
        { id: 'gambut', judul: 'Global peatland extent (gfw_peatlands v20230302)', penerbit: 'Global Forest Watch / Greifswald Mire Centre dan mitra', url: mentah.lapis.gambut.url, lisensi: mentah.lapis.gambut.lisensi },
        { id: 'adat', judul: 'Indigenous Peoples and local communities lands (LandMark)', penerbit: 'LandMark', url: mentah.lapis.adat.url, lisensi: mentah.lapis.adat.lisensi },
        { id: 'bahaya', judul: 'Indeks bahaya multi-bencana dan lapisan bahaya (InaRISK)', penerbit: 'BNPB', url: 'https://inarisk.bnpb.go.id/', lisensi: 'data publik BNPB; layanan ArcGIS terbuka, robots mengizinkan' },
        { id: 'proyek', judul: 'Pelacak proyek terpadu METI (RUPTL, Global Energy Monitor CC BY 4.0)', penerbit: 'METI', url: '/pelacak-proyek', lisensi: 'CC BY 4.0 (GEM)' },
      ],
      celah: ['Wilayah adat: BRWA tidak menyediakan unduhan publik yang dapat dipanen; dipakai LandMark (agregat, belum lengkap).', 'Gambut: peta KLHK/BRG tidak terjangkau dari jaringan panen; dipakai peta gambut global GFW (piksel sekitar 150 m).', 'Rawan bencana: indeks InaRISK raster 100 m; bukan penilaian tapak.'],
    },
    per_tek: per, baris,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = bangun();
  fs.writeFileSync(path.join(AKAR, 'public/data/risiko_proyek.json'), JSON.stringify(d) + '\n');
  console.log('risiko_proyek.json', d.meta.jumlah, 'titik,', d.meta.dinilai, 'dinilai', (fs.statSync(path.join(AKAR, 'public/data/risiko_proyek.json')).size / 1024).toFixed(0), 'KB');
}
