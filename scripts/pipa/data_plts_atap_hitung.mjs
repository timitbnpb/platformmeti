#!/usr/bin/env node
// public/data/plts_atap_hitung.json: masukan data untuk kalkulator PLTS atap (/peluang#plts-atap): tarif PLN per golongan (dari tarif_harga.json,
// bertanggal), PVOUT per provinsi (dari potensi_atlas.json), asumsi bawaan berlabel Hipotesis/EST, dan aturan Permen ESDM 2/2024.
// Rumus tidak di sini (ADR-03): fungsi hitung ada di public/inti/plts_atap_rumus.js.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ROOT, TGL, baca } from './dataset_lib.mjs';

const H = (nilai, satuan, catatan) => ({ nilai, satuan, label: 'Hipotesis', catatan });
export const ASUMSI = {
  rumah: { harga_per_kwp_idr: H(15e6, 'Rp/kWp', 'kisaran pasar Rp13-18 juta untuk sistem 3-10 kWp terpasang; ubah sesuai penawaran'), om_persen_per_tahun: H(1, '% capex/tahun', 'pembersihan dan inspeksi'), pakai_sendiri_persen: H(70, '% produksi', 'sisanya tidak dibayar (tanpa kompensasi ekspor)') },
  industri: { harga_per_kwp_idr: H(11e6, 'Rp/kWp', 'kisaran pasar Rp9-13 juta untuk sistem di atas 100 kWp; ubah sesuai penawaran'), om_persen_per_tahun: H(1, '% capex/tahun', ''), pakai_sendiri_persen: H(95, '% produksi', 'beban siang hari industri') },
  umum: { degradasi_persen_per_tahun: H(0.5, '%/tahun', 'garansi modul umum 0,4-0,55%/tahun'), kenaikan_tarif_persen_per_tahun: H(0, '%/tahun', 'tarif nonsubsidi tetap sejak Q4 2025; skenario kenaikan diisi pengguna'), diskonto_persen: H(8, '%/tahun', 'untuk nilai kini'), umur_tahun: H(25, 'tahun', 'garansi kinerja modul'), ganti_inverter_tahun: H(12, 'tahun ke-', 'biaya 8% capex'), ganti_inverter_persen_capex: H(8, '% capex', ''), luas_per_kwp_m2: H(6, 'm2/kWp', 'atap miring, modul 550 Wp') },
};
export const ATURAN = { id: 'permen-esdm-2-2024', regulasi_id: 'permen-esdm-2-2024', judul: 'Permen ESDM 2/2024 tentang PLTS Atap yang Terhubung pada Jaringan Tenaga Listrik Pemegang IUPTLU untuk Kepentingan Umum', status: 'berlaku', url: 'https://peraturan.bpk.go.id/Details/288519', tanggal_periksa: TGL,
  butir: ['Kapasitas PLTS atap paling tinggi 100% dari daya tersambung pelanggan.', 'Energi yang diekspor ke jaringan PLN tidak diperhitungkan sebagai pengurang tagihan atau dibayar (tanpa skema ekspor-impor); hitung penghematan dari pemakaian sendiri.', 'Kuota pengembangan PLTS atap ditetapkan per sistem ketenagalistrikan dan dievaluasi tahunan; sambungan baru bisa ditolak bila kuota habis (lihat plts_atap.json, RUPTL Tabel 2.6).'],
  catatan: 'Ringkasan butir ditulis dari pemahaman atas naskah dan BELUM dicocokkan pasal demi pasal dengan naskah BPK; tampilkan sebagai ringkasan, bukan kutipan, dan tinjau sebelum dirilis. Tingkat bukti: kata-pihak.' };
export function bangun(tarif, atlas, tanggal = TGL) {
  const gol = tarif.baris.filter((b) => b.kelompok === 'tarif_listrik').map((b) => ({ id: b.id, golongan: b.golongan, kelompok: b.kelompok_pelanggan, tarif_idr_per_kwh: b.tarif_idr_per_kwh, periode: b.periode, berlaku_sejak: b.berlaku_sejak, berlaku_sampai: b.berlaku_sampai, subsidi: /subsidi/i.test(b.golongan), sumber_url: b.sumber_url }));
  const prov = atlas.baris.map((p) => ({ kode: p.kode, provinsi: p.provinsi, pvout_kwh_per_kwp_tahun: p.pvout_kwh_per_kwp_tahun }));
  return { lapis: 'publik', dibangun_pada: tanggal, jumlah: gol.length, tarif: gol, provinsi: prov, asumsi: ASUMSI, aturan: ATURAN,
    meta: { tarif_terbaru: gol.reduce((m, g) => (g.berlaku_sampai > m ? g.berlaku_sampai : m), ''), celah: ['Tarif Q4 2026 belum terverifikasi: tarif yang dipakai ialah Q3 2026 (berlaku sampai 30 Sep 2026).', 'PVOUT satu titik per provinsi (ibu kota), bukan per kota; indikasi relatif.', 'Harga per kWp dan seluruh asumsi berstatus Hipotesis, bukan data pasar tersumber.'] } };
}
export function selftest() {
  const h = bangun({ baris: [{ id: 'a', kelompok: 'tarif_listrik', golongan: 'R-1/TR 900 VA (subsidi)', kelompok_pelanggan: 'rumah tangga', tarif_idr_per_kwh: 605, periode: '2026-Q3', berlaku_sampai: '2026-09-30' }, { id: 'b', kelompok: 'harga_bbm' }] }, { baris: [{ kode: '11', provinsi: 'Aceh', pvout_kwh_per_kwp_tahun: 1422 }] });
  assert.equal(h.tarif.length, 1); assert.equal(h.tarif[0].subsidi, true); assert.equal(h.provinsi[0].pvout_kwh_per_kwp_tahun, 1422);
  assert.ok(Object.values(ASUMSI.umum).every((a) => a.label === 'Hipotesis'));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  selftest();
  if (process.argv.includes('--selftest')) console.log('selftest ok'); else {
    const h = bangun(baca('public/data/tarif_harga.json'), baca('public/data/potensi_atlas.json'));
    fs.writeFileSync(path.join(ROOT, 'public/data/plts_atap_hitung.json'), JSON.stringify(h) + '\n', 'utf8'); console.log('plts_atap_hitung.json:', h.jumlah, 'golongan,', h.provinsi.length, 'provinsi');
  }
}
