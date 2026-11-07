// Ringkasan eksekutif nasional -> public/data/ringkasan_eksekutif.json (halaman /ringkasan).
// Pakai: node scripts/pipa/ringkasan_eksekutif.mjs [--tanggal=YYYY-MM-DD]
// Delapan angka kunci, perubahan bulan ini, lima temuan bernomor, dan peta mini. TIAP angka membawa sumber (judul, url, halaman, tingkat bukti);
// angka yang tidak bisa dihitung dari berkas yang ada diisi null + alasan, bukan tebakan. Teks layar ada di kamus (re2.*); berkas ini hanya angka dan kode.
import fs from 'node:fs';
import path from 'node:path';
import { AKAR, TANGGAL, tulis } from './_panen_umum.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', f), 'utf-8'));
const bulat = (n, d = 1) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);
const sumberDari = (daftar, id, ekstra = {}) => {
  const s = (daftar || []).find((x) => x.id === id) || {};
  return { judul: s.judul || ekstra.judul || '', penerbit: s.penerbit || '', url: s.url || ekstra.url || '', tingkat_bukti: s.tingkat_bukti || ekstra.tingkat_bukti || '', ...ekstra };
};
const statusProyek = (p) => p.status?.at(-1)?.nilai ?? null;
const hariAntara = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

/** D = { target, proyek, regulasi, kerja, harga, ember, pendanaan, wilayah, riwayat, rapor }. Murni: tanpa jam, tanpa berkas. */
export function bangun(D, tanggal = TANGGAL) {
  const tahun = Number(tanggal.slice(0, 4));
  const T = D.target, kap = T.kapasitas_ebt.at(-1);
  const real = T.realisasi.pembangkitan_ebt_persen.at(-1);
  const angka = [];

  angka.push({ kode: 'kapasitas', ikon: 'petir', nilai: bulat(kap.total_ebt_mw, 0), satuan: 'MW', tahun: kap.tahun, tingkat: 'resmi',
    sumber: sumberDari(T.sumber, kap.sumber_id, { halaman: kap.halaman }) });

  angka.push({ kode: 'bauran', ikon: 'grafik', nilai: bulat(real.nilai, 1), satuan: '%', tahun: real.tahun, tingkat: 'via-pihak-ketiga',
    sumber: sumberDari(T.sumber, real.sumber_id, { tingkat_bukti: 'via-pihak-ketiga' }) });

  const dana = D.pendanaan.ringkasan.nilai_per_pemberi.reduce((n, x) => n + (x.total_usd || 0), 0);
  angka.push({ kode: 'investasi', ikon: 'kartu', nilai: bulat(dana / 1e9, 1), satuan: 'USD miliar', tahun: Number(D.pendanaan.dibangun_pada.slice(0, 4)), tingkat: 'campuran',
    sumber: { judul: `Pendanaan tercatat di Direktori METI (${D.pendanaan.jumlah} skema, nilai per pemberi)`, penerbit: 'Direktori METI', url: '/pendanaan', tingkat_bukti: 'campuran' } });

  const konstruksi = D.proyek.filter((p) => statusProyek(p) === 'konstruksi').length;
  const aktif = D.proyek.filter((p) => ['rencana', 'konstruksi', 'ditunda'].includes(statusProyek(p)));
  const dgnCod = aktif.filter((p) => (p.cod_target || []).some((c) => Number.isInteger(c.nilai)));
  const lambat = dgnCod.filter((p) => Math.min(...p.cod_target.filter((c) => Number.isInteger(c.nilai)).map((c) => c.nilai)) < tahun);
  angka.push({ kode: 'proyek', ikon: 'proyek', nilai: konstruksi, satuan: 'proyek', tahun, tingkat: 'campuran', tambahan: { terlambat: lambat.length, dasar: dgnCod.length },
    sumber: { judul: `Proyek terlacak (${D.proyek.length}); terlambat = status rencana, konstruksi, atau ditunda dengan COD target paling awal sebelum ${tahun}`, penerbit: 'Direktori METI', url: '/proyek', tingkat_bukti: 'campuran' } });

  const batas = (hari) => D.regulasi.filter((r) => r.status === 'berlaku' && r.tanggal_ditetapkan && hariAntara(r.tanggal_ditetapkan, tanggal) >= 0 && hariAntara(r.tanggal_ditetapkan, tanggal) <= hari).length;
  angka.push({ kode: 'regulasi', ikon: 'regulasi', nilai: batas(365), satuan: 'aturan', tahun, tingkat: 'resmi', tambahan: { bulan_ini: batas(30) },
    sumber: { judul: `Regulasi berlaku yang ditetapkan 12 bulan terakhir, dari ${D.regulasi.length} aturan tercatat (BPK JDIH dan sumber resmi lain)`, penerbit: 'Direktori METI', url: '/regulasi', tingkat_bukti: 'resmi' } });

  const th = String(Math.min(Math.max(tahun, D.kerja.tahun[0]), D.kerja.tahun.at(-1)));
  let kerja = 0;
  for (const per of Object.values(D.kerja.analisis.per_teknologi)) kerja += (per[th]?.konstruksi || 0) + (per[th]?.om || 0);
  angka.push({ kode: 'kerja', ikon: 'koper', nilai: kerja, satuan: 'orang', tahun: Number(th), tingkat: 'est', est: true,
    sumber: { judul: `Kebutuhan tenaga kerja konstruksi dan O&M dari ${D.kerja.analisis.proyek} proyek RUPTL (${D.kerja.analisis.mw} MW) dikali faktor Rutovitz, tahun ${th}; estimasi, bukan data lowongan`, penerbit: 'Direktori METI', url: '/kerja', tingkat_bukti: 'riset' } });

  const modul = D.harga.deret.find((d) => d.id === 'modul').titik;
  const m1 = modul.at(-1), m0 = modul.at(-2);
  angka.push({ kode: 'modul', ikon: 'tek-surya', nilai: m1.y, satuan: 'USD/W', tahun: m1.x, tingkat: m1.tingkat_bukti, tambahan: { sebelum: m0.y, tahun_sebelum: m0.x },
    sumber: sumberDari(D.harga.sumber, m1.sumber_id) });

  const tot = D.ember.baris.filter((b) => b.agregat && b.sumber_listrik === 'Total generation').at(-1);
  angka.push({ kode: 'emisi', ikon: 'globe', nilai: bulat(tot.emisi_mtco2e, 1), satuan: 'Mt CO2e', tahun: tot.tahun, tingkat: 'via-pihak-ketiga',
    sumber: sumberDari(D.ember.sumber, tot.sumber_id) });

  /* ---- perubahan bulan ini: riwayat (G1) bila ada, selain itu banding rapor bulanan ---- */
  const rw = D.riwayat || {};
  const rp = D.rapor || null;
  const perubahan = {
    riwayat: { hari: rw.hari ?? null, awal: rw.awal ?? null, jumlah: rw.jumlah_total ?? 0, per: rw.jumlah_per || {} },
    rapor: rp ? { periode: rp.periode, lalu: rp.banding.periode_lalu, berita: rp.banding.berita, regulasi: rp.banding.regulasi, tender: rp.banding.tender } : null,
  };

  /* ---- lima temuan bernomor, tiap temuan membawa angkanya ---- */
  const temuan = [];
  const celah = T.celah.find((c) => c.target_id === 'ruptl-2034-kapasitas');
  if (celah) temuan.push({ kode: 'celah', ikon: 'tingkat', angka: { celah_mw: celah.celah_mw, per_tahun: celah.per_tahun_mw, kali: celah.kali_laju_historis, laju: celah.laju_historis_mw_per_tahun_2015_2024, tahun: celah.tahun_target }, label_est: celah.label === 'EST' });
  const tb = T.target.find((x) => x.id === 'ruptl-2034-bauran');
  if (tb && real) temuan.push({ kode: 'bauran', ikon: 'grafik', angka: { real: bulat(real.nilai, 1), tahun_real: real.tahun, target: tb.min, tahun_target: tb.tahun_target, selisih: bulat(tb.min - real.nilai, 1) } });
  if (dgnCod.length) temuan.push({ kode: 'lambat', ikon: 'peringatan', angka: { lambat: lambat.length, dari: dgnCod.length, persen: bulat((lambat.length / dgnCod.length) * 100, 0), tahun } });
  if (m0) temuan.push({ kode: 'modul', ikon: 'tek-surya', angka: { sekarang: m1.y, tahun: m1.x, sebelum: m0.y, tahun_sebelum: m0.x, ubah: bulat(((m1.y - m0.y) / m0.y) * 100, 1) } });
  const pr = D.wilayah.baris.map((b) => ({ kode: b.kode, nama: b.nama, mw: b.terpasang_mw?.nilai ?? null })).filter((x) => x.mw != null);
  const jml = pr.reduce((n, x) => n + x.mw, 0);
  const atas = [...pr].sort((a, z) => z.mw - a.mw).slice(0, 5);
  if (jml > 0) temuan.push({ kode: 'sebaran', ikon: 'wilayah', angka: { n: atas.length, persen: bulat((atas.reduce((n, x) => n + x.mw, 0) / jml) * 100, 0), dari: pr.length, teratas: atas[0].nama, tahun: D.wilayah.baris.find((b) => b.terpasang_mw?.nilai != null).terpasang_mw.tahun }, provinsi: atas.map((x) => x.kode) });

  return { lapis: 'publik', dibangun_pada: tanggal, angka, perubahan, temuan, peta: { satuan: 'MW', tahun: temuan.find((x) => x.kode === 'sebaran')?.angka.tahun ?? null, baris: pr } };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const rap = baca('rapor/indeks.json').bulanan?.[0];
  const D = {
    target: baca('target.json'), proyek: baca('proyek.json').baris, regulasi: baca('regulasi.json').baris, kerja: baca('kerja.json'), harga: baca('harga_komponen.json'),
    ember: baca('ember_bulanan.json'), pendanaan: baca('pendanaan.json'), wilayah: baca('wilayah.json'), riwayat: baca('riwayat/perubahan_terbaru.json'),
    rapor: rap ? baca(`rapor/${rap}.json`) : null,
  };
  const out = bangun(D);
  tulis(path.join(AKAR, 'public/data/ringkasan_eksekutif.json'), out);
  console.log('ringkasan_eksekutif:', out.angka.length, 'angka,', out.temuan.length, 'temuan');
}
