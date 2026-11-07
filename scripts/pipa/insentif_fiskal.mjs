#!/usr/bin/env node
// public/data/insentif_fiskal.json: insentif FISKAL EBT/kendaraan listrik (tax holiday, tax allowance, bea masuk, PPN DTP KBLBB, PPnBM).
// Tiap dasar hukum dibaca dari halaman JDIH BPK (judul, tanggal, status). Syarat rinci TIDAK dibaca dari PDF: basis_syarat = 'judul'.
//   node scripts/pipa/insentif_fiskal.mjs --ambil | --bangun | --selftest      (mentah: $PANEN_B2 atau data-panen/b2, di-.gitignore)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ROOT, bacaAda, bungkus, tulis, saring } from './dataset_lib.mjs';
import { ambil } from './_panen_sopan.mjs';

export const TGL = '2026-11-08';
export const RAW = path.join(process.env.PANEN_B2 || path.join(ROOT, 'data-panen/b2'), 'insentif_fiskal');
const SUMBER = [{ id: 's-bpk', judul: 'JDIH BPK: Database Peraturan (peraturan.bpk.go.id)', penerbit: 'Badan Pemeriksa Keuangan RI', tahun: 2026, url: 'https://peraturan.bpk.go.id', lisensi: 'Dokumen peraturan perundang-undangan (publik); hanya fakta dan tautan', tanggal_akses: TGL }];
// [id, bpk, jenis_insentif, instrumen, teknologi, regulasi_id|null]
export const SEED = [
  ['if_tax_holiday', '148016/pmk-no-130pmk0102020', 'tax-holiday', 'Pengurangan PPh badan (tax holiday) untuk industri pionir', ['pembangkit', 'industri komponen EBT (bila termasuk sektor pionir)'], null],
  ['if_tax_allowance_pmk11', '136789/pmk-no-11pmk0102020', 'tax-allowance', 'Pelaksanaan PP 78/2019 (tax allowance) oleh Kemenkeu (riwayat; cek status)', ['pembangkit listrik', 'panas bumi'], null],
  ['if_tax_allowance_pp78', '126141/pp-no-78-tahun-2019', 'tax-allowance', 'Fasilitas PPh penanaman modal bidang usaha/daerah tertentu (tax allowance): pengurangan penghasilan neto, penyusutan dipercepat, PPh dividen, kompensasi kerugian', ['pembangkit listrik', 'panas bumi', 'industri'], null],
  ['if_bea_masuk_pembangkit', '146740/pmk-no-66pmk0102015', 'bea-masuk', 'Pembebasan bea masuk barang modal untuk pembangkitan tenaga listrik untuk kepentingan umum', ['semua pembangkit'], null],
  ['if_bea_masuk_mesin', '167732/pmk-no-176pmk0112009', 'bea-masuk', 'Pembebasan bea masuk mesin, barang, dan bahan untuk pembangunan/pengembangan industri', ['industri komponen EBT'], null],
  ['if_bea_masuk_panbum_177', '137071/pmk-no-177pmk0112007', 'bea-masuk', 'Pembebasan bea masuk barang hulu migas dan panas bumi (riwayat)', ['panas bumi'], null],
  ['if_bea_masuk_154_2008', '146741/pmk-no-154pmk0112008', 'bea-masuk', 'Pembebasan bea masuk barang modal pembangkit (riwayat)', ['pembangkit'], null],
  ['if_ppn_panas_bumi_pp49', '232943/pp-no-49-tahun-2022', 'ppn', 'PPN tidak dipungut/dibebaskan untuk kegiatan panas bumi', ['panas bumi'], null],
  ['if_ppn_dtp_kbl_38_2023', '246542/pmk-no-38-tahun-2023', 'ppn-dtp', 'PPN ditanggung pemerintah atas kendaraan listrik roda empat tertentu dan bus (KBLBB)', ['kendaraan listrik'], 'permen-kemenkeu-38-2023'],
  ['if_ppn_dtp_kbl_8_2024', '279522/pmk-no-8-tahun-2024', 'ppn-dtp', 'PPN DTP kendaraan listrik roda empat tertentu dan bus, tahun 2024', ['kendaraan listrik'], 'permen-kemenkeu-8-2024'],
  ['if_ppn_dtp_kbl_12_2025', '313577/pmk-no-12-tahun-2025', 'ppn-dtp', 'PPN atas kendaraan listrik roda empat tertentu dan bus, tahun 2025', ['kendaraan listrik'], 'permen-kemenkeu-12-2025'],
  ['if_ppnbm_kbl_9_2024', '279857/pmk-no-9-tahun-2024', 'ppnbm-dtp', 'PPnBM DTP atas impor/penyerahan kendaraan listrik berbasis baterai', ['kendaraan listrik'], 'permen-kemenkeu-9-2024'],
  ['if_impor_kbl_investasi_1_2024', '323555/permen-investasi-kepala-bkpm-no-1-tahun-2024', 'bea-masuk', 'Perubahan Permen Investasi/BKPM 6/2023 tentang pedoman insentif impor kendaraan listrik berbasis baterai', ['kendaraan listrik'], 'permen-b323555-1-2024'],
  ['if_impor_kbl_verifikasi_37_2024', '299437/permenperin-no-37-tahun-2024', 'bea-masuk', 'Tata cara verifikasi industri atas insentif impor KBLBB (Kemenperin)', ['kendaraan listrik'], 'permen-kemenperin-37-2024'],
].filter((s, i, a) => a.findIndex((x) => x[1] === s[1]) === i);

// Halaman Details BPK: pasangan label -> nilai pada teks bersih.
export function parseDetail(html) {
  const t = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n').split('\n').map((s) => s.replace(/&#x2022;/g, '•').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const v = (l) => { const i = t.indexOf(l); return i < 0 ? null : t[i + 1]; };
  return { judul: v('Judul'), status: v('Status'), tanggal_penetapan: v('Tanggal Penetapan'), tanggal_berlaku: v('Tanggal Berlaku'), nomor: v('Nomor'), tahun: v('Tahun') };
}
const berkas = (bpk) => path.join(RAW, bpk.split('/')[0] + '.json');
async function cmdAmbil() {
  fs.mkdirSync(RAW, { recursive: true });
  for (const [, bpk] of SEED) {
    if (fs.existsSync(berkas(bpk))) continue;
    const url = 'https://peraturan.bpk.go.id/Details/' + bpk;
    try { fs.writeFileSync(berkas(bpk), JSON.stringify({ url, tanggal: TGL, ...parseDetail(await ambil(url)) })); console.log('ok', bpk); }
    catch (e) { console.log('GAGAL', bpk, e.message); if (/403/.test(e.message)) process.exit(2); }
  }
}
export function bangun(regIds = null, baca = (bpk) => (fs.existsSync(berkas(bpk)) ? JSON.parse(fs.readFileSync(berkas(bpk), 'utf8')) : null)) {
  const baris = [];
  for (const [id, bpk, jenis, instrumen, teknologi, reg] of SEED) {
    const d = baca(bpk);
    if (!d || !d.judul || !d.status) continue; // tanpa bukti halaman, tidak diterbitkan
    baris.push({
      id, kelompok: 'insentif-fiskal', jenis_insentif: jenis, instrumen, nomor_aturan: d.judul.split(' tentang ')[0],
      judul_resmi: d.judul.includes(' tentang ') ? d.judul.split(' tentang ').slice(1).join(' tentang ') : d.judul,
      teknologi, regulasi_id: reg && (regIds === null || regIds.has(reg)) ? reg : null,
      tanggal_penetapan: d.tanggal_penetapan, tanggal_berlaku: d.tanggal_berlaku, status_berlaku: d.status.toLowerCase(),
      basis_syarat: 'judul', sumber_id: 's-bpk', sumber_url: d.url, tanggal: d.tanggal, tingkat_bukti: 'resmi',
    });
  }
  return baris;
}
export const CELAH = [
  'Besaran, ambang investasi, dan masa berlaku tiap fasilitas TIDAK dibaca dari teks peraturan (PDF); kolom basis_syarat = judul. Baca teks sebelum dikutip.',
  'Peraturan BKPM 11/2020 (tata cara PP 78/2019) tidak dimasukkan: nomor itu pada JDIH BPK ternyata Klasifikasi Arsip BKPM; tata cara tax allowance terbaru belum teridentifikasi.',
  'status_berlaku mengikuti JDIH BPK dan tidak menjamin tidak ada aturan pengganti; sumber Kemenkeu/DJP/BKPM langsung (pajak.go.id, bkpm.go.id) tidak dipanen pada putaran ini.',
  'Insentif PPN DTP kendaraan listrik berlaku per tahun anggaran; periode terkini perlu dicek ke PMK terbaru.',
];
function selftest() {
  const html = '<p>Judul</p><p> PP No 78 tentang Fasilitas Pajak</p><p>Status</p><p>Berlaku</p><p>Tanggal Penetapan</p><p> 12 November 2019</p>';
  const d = parseDetail(html);
  assert.equal(d.status, 'Berlaku'); assert.equal(d.tanggal_penetapan, '12 November 2019');
  const b = bangun(null, (bpk) => (bpk.startsWith('126141') ? { url: 'https://peraturan.bpk.go.id/Details/126141', tanggal: TGL, ...d } : null));
  assert.equal(b.length, 1); assert.equal(b[0].nomor_aturan, 'PP No 78'); assert.equal(saring(b).ok.length, 1);
  assert.equal(new Set(SEED.map((s) => s[0])).size, SEED.length);
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--selftest') selftest();
  else if (a === '--ambil') await cmdAmbil();
  else if (a === '--bangun') {
    const reg = bacaAda('public/data/regulasi.json');
    const { ok, ditolak } = saring(bangun(reg ? new Set(reg.baris.map((r) => r.id)) : null));
    const o = bungkus({ baris: ok, sumber: SUMBER, celah: CELAH, ditolak }); o.dibangun_pada = TGL; o.meta.diperbarui = TGL;
    console.log(tulis('insentif_fiskal', o), ok.length, 'baris');
  } else console.log('pakai: --ambil | --bangun | --selftest');
}
