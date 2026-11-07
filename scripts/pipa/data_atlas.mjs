// public/data/potensi_atlas.json: ringkasan Global Solar Atlas per provinsi (diturunkan dari public/data/wilayah.json, tanpa jaringan).
// Angin (Global Wind Atlas): tidak ada ringkasan publik tanpa formulir/API terdokumentasi -> dicatat sebagai celah.
//   node scripts/pipa/data_atlas.mjs <YYYY-MM-DD>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function bangun(wilayah, tanggal) {
  const baris = wilayah.baris.filter((b) => b.surya_atlas).map((b) => { const a = b.surya_atlas; return {
    kode: b.kode, provinsi: b.nama, titik: a.titik, pvout_kwh_per_kwp_tahun: a.pvout_kwh_per_kwp_tahun, ghi_kwh_per_m2_tahun: a.ghi_kwh_per_m2_tahun, dni_kwh_per_m2_tahun: a.dni_kwh_per_m2_tahun,
    gti_optimal_kwh_per_m2_tahun: a.gti_optimal_kwh_per_m2_tahun, sudut_optimal_derajat: a.sudut_optimal_derajat, suhu_udara_c: a.suhu_udara_c, sumber_id: 'global-solar-atlas', tahun: 2026, url: a.url, tingkat_bukti: 'via-pihak-ketiga' }; });
  return {
    meta: { diperbarui: tanggal, jumlah: baris.length, lisensi: 'CC BY 4.0', atribusi: 'Global Solar Atlas 2.0, Solargis untuk World Bank Group/ESMAP', ukuran: 'satu titik per provinsi (ibu kota), BUKAN rata-rata provinsi; pakai sebagai indikasi relatif',
      celah: ['Global Wind Atlas: tidak ada API terdokumentasi atau ringkasan per wilayah tanpa unduhan raster (ratusan MB); tebakan endpoint /api/gwa/custom/windSpeed dijawab HTTP 400 pada 7 Nov 2026. Potensi angin per provinsi kosong; kolom angin tidak diisi.', 'Rata-rata luas provinsi memerlukan pengolahan raster GeoTIFF di luar lingkup panen ini.'] },
    sumber: [{ id: 'global-solar-atlas', judul: 'Global Solar Atlas 2.0, data jangka panjang (api.globalsolaratlas.info/data/lta)', penerbit: 'World Bank Group / ESMAP, data Solargis', tahun: 2026, url: 'https://globalsolaratlas.info/' }],
    baris,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tgl = process.argv[2]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('pakai: data_atlas.mjs YYYY-MM-DD');
  const o = bangun(JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/wilayah.json'), 'utf8')), tgl);
  fs.writeFileSync(path.join(ROOT, 'public/data/potensi_atlas.json'), JSON.stringify(o) + '\n'); console.log(o.baris.length, 'provinsi');
}
