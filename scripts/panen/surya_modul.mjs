#!/usr/bin/env node
// public/data/surya_modul.json: modul /surya (Surya ujung ke ujung, PLTS 100 GW). Hanya data baru (bahan baku silika, kuota PLTS atap per sistem, realisasi atap, rincian program 100 GW, isu)
// + rujukan id ke berkas lain (pemasok_surya, pabrik_dunia, neraca_pasokan, produk, benchmark_harga, kebijakan_dagang, biaya_bangun, regulasi, program_analisis, organisasi, proyek).
//   node scripts/panen/surya_modul.mjs   (offline) -> public/data/surya_modul.json
//   Pengambilan web: manual (pencarian + pembacaan artikel) lalu dikurasi di surya_modul_kurasi.mjs; Comtrade: surya_modul_comtrade.mjs (berhenti di 403).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TGL, SUMBER, ATAP, BAHAN, PROGRAM, RUJUKAN, ISU, CELAH } from './surya_modul_kurasi.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const baca = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
const TINGKAT = ['resmi', 'kajian', 'media', 'est', 'hipotesis'];

/** Murni: kembalikan {data, galat}. Galat = rujukan id mati, sumber tak terdaftar, tingkat bukti asing, jumlah kuota tak cocok. */
export function bangun({ org, regulasi, proyek, pabrikDunia, neraca, benchmark, kebijakan, biaya, program, pemasok } = {}) {
  const galat = [];
  const ids = (b) => new Set((b?.baris || []).map((x) => x.id));
  const sumberIds = new Set(SUMBER.map((s) => s.id));
  const cek = (cond, pesan) => { if (!cond) galat.push(pesan); };
  const sid = (id, dari) => { if (id) cek(sumberIds.has(id), `sumber tak ada: ${id} (${dari})`); };
  const tb = (x, dari) => { if (x) cek(TINGKAT.includes(x), `tingkat bukti asing: ${x} (${dari})`); };
  const rujuk = (daftar, himpunan, nama) => { if (himpunan) for (const i of [].concat(daftar)) cek(himpunan.has(i), `${nama} tak ada: ${i}`); };
  rujuk(RUJUKAN.pabrik_dunia, ids(pabrikDunia).size ? ids(pabrikDunia) : null, 'pabrik_dunia');
  rujuk(RUJUKAN.neraca, neraca ? ids(neraca) : null, 'neraca');
  rujuk(RUJUKAN.harga, benchmark ? new Set((benchmark.produk || []).map((x) => x.id)) : null, 'benchmark_harga');
  rujuk(RUJUKAN.kebijakan_dagang, kebijakan ? ids(kebijakan) : null, 'kebijakan_dagang');
  rujuk(RUJUKAN.biaya_skala, biaya ? new Set((biaya.skala || []).map((x) => x.id)) : null, 'biaya_bangun');
  rujuk(RUJUKAN.regulasi, regulasi ? ids(regulasi) : null, 'regulasi');
  rujuk(RUJUKAN.organisasi, org ? ids(org) : null, 'organisasi');
  rujuk(PROGRAM.proyek_ids, proyek ? ids(proyek) : null, 'proyek');
  rujuk(RUJUKAN.program, program ? new Set((program.baris || []).map((x) => x.program_id)) : null, 'program_analisis');
  for (const b of BAHAN.hilir) if (b.org_id && org) cek(ids(org).has(b.org_id), `org tak ada: ${b.org_id}`);
  for (const s of SUMBER) cek(/^https:\/\//.test(s.url) && s.judul && s.penerbit && s.tingkat_bukti && s.tanggal_ambil, `sumber tak lengkap: ${s.id}`);
  for (const s of SUMBER) tb(s.tingkat_bukti, s.id);
  // kuota per klaster: tiap deret = 5 tahun, jumlah mendekati jumlah tercetak (bulat)
  for (const k of ATAP.klaster) cek(k.mw.length === ATAP.tahun.length, `klaster ${k.k}: jumlah tahun`);
  ATAP.tahun.forEach((th, i) => { const j = ATAP.klaster.reduce((a, k) => a + k.mw[i], 0); cek(Math.abs(j - ATAP.jumlah[i]) <= 1.5, `kuota ${th}: jumlah klaster ${j.toFixed(1)} lawan ${ATAP.jumlah[i]}`); });
  for (const r of ATAP.realisasi) { sid(r.sumber_id, 'atap'); tb(r.tingkat_bukti, 'atap'); cek(r.mw > 0 && /^\d{4}-\d{2}$/.test(r.tanggal), `realisasi ${r.tanggal}`); }
  cek(ATAP.realisasi.every((r, i, a) => !i || (r.tanggal > a[i - 1].tanggal && r.mw >= a[i - 1].mw)), 'realisasi harus naik menurut tanggal');
  for (const x of [ATAP, ATAP.kuota_2026_januari, ATAP.target_ruptl_gw, ATAP.target_2028_wilayah_mw, ATAP.catatan_industri, ...ATAP.klaim_belum_rekonsiliasi, ...BAHAN.nasional, BAHAN.produksi, ...BAHAN.wilayah, ...BAHAN.hilir, ...BAHAN.kebijakan, BAHAN.ekspor, PROGRAM.peluncuran, PROGRAM.target, ...PROGRAM.struktur, PROGRAM.alokasi_listrik_desa_gw, ...PROGRAM.tahap_pertama, ...PROGRAM.proyek_disebut, PROGRAM.biaya, PROGRAM.bess, PROGRAM.lahan, PROGRAM.tender_pln, ...PROGRAM.pelaksana, PROGRAM.tantangan, PROGRAM.rekomendasi_iesr, ...ISU]) { sid(x.sumber_id, x.id || x.k || x.nama?.id || ''); tb(x.tingkat_bukti, x.id || ''); for (const l of x.sumber_lain || []) sid(l, x.id); }
  const prov = new Set((baca('public/data/potensi_atlas.json').baris || []).map((b) => b.kode));
  for (const w of BAHAN.wilayah) cek(prov.has(w.kode_prov), `kode provinsi tak ada: ${w.kode_prov}`);
  cek(PROGRAM.tender_pln.wilayah.reduce((a, w) => a + w.mw, 0) === PROGRAM.tender_pln.mw_total, 'tender PLN: jumlah wilayah tak sama dengan total');
  for (const i of ISU) cek(i.judul?.id && i.judul?.en && i.isi?.id && i.isi?.en, `isu ${i.id}: dwibahasa`);
  cek(!/[–—]/.test(JSON.stringify({ SUMBER, ATAP, BAHAN, PROGRAM, ISU, CELAH })), 'em dash/en dash ditemukan');
  void pemasok;
  return {
    data: { lapis: 'publik', tema: 'surya_modul', dibangun_pada: TGL, sumber: SUMBER, rujukan: RUJUKAN, bahan: BAHAN, atap: ATAP, program: PROGRAM, isu: ISU,
      meta: { diperbarui: TGL, tingkat_bukti_kamus: { resmi: 'dokumen resmi pemerintah atau regulator', kajian: 'kajian atau terbitan lembaga yang mengutip dokumen resmi', media: 'berita atau sumber sekunder', est: 'turunan hitung', hipotesis: 'asumsi pembaca atau METI' }, celah: CELAH } },
    galat,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const g = (f) => { try { return baca(f); } catch { return null; } };
  const { data, galat } = bangun({ org: g('public/data/organisasi.json'), regulasi: g('public/data/regulasi.json'), proyek: g('public/data/proyek.json'), pabrikDunia: g('public/data/global/pabrik_dunia.json'), neraca: g('public/data/global/neraca_pasokan.json'), benchmark: g('public/data/global/benchmark_harga.json'), kebijakan: g('public/data/global/kebijakan_dagang.json'), biaya: g('public/data/biaya_bangun.json'), program: g('public/data/program_analisis.json'), pemasok: g('public/data/global/pemasok_surya.json') });
  if (galat.length) { console.error(galat.join('\n')); process.exit(1); }
  fs.writeFileSync(AKAR + 'public/data/surya_modul.json', JSON.stringify(data) + '\n');
  console.log('sumber', data.sumber.length, 'isu', data.isu.length, 'ukuran', JSON.stringify(data).length);
}
