// Paket pemda: olahan per provinsi dari data yang SUDAH ada di public/data (tanpa panen baru).
// Pakai: node scripts/pipa/paket_pemda.mjs [--tanggal=YYYY-MM-DD]. Keluaran: public/data/paket_pemda.json.
// Turunan = EST; indeks kesiapan v2 = Hipotesis (metode terbuka di keluaran.metode).
import fs from 'node:fs';
import path from 'node:path';
import { kodeProv, PROV } from '../../public/inti/prov_singkat.js';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const baca = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', f), 'utf-8'));
const TANGGAL = (process.argv.find((a) => a.startsWith('--tanggal=')) || '--tanggal=2026-11-08').slice(10);

export const BOBOT = { rued_ada: 0.2, rued_capaian: 0.2, elektrifikasi: 0.2, pipeline: 0.2, kelembagaan: 0.2 };
export const AMBANG = { siap: 0.75, berkembang: 0.5 };
export const MIN_KOMPONEN = 4;

/** Peringkat persentil 0..1 di antara nilai non-null (satu nilai saja = 0.5). */
export function persentil(nilai) {
  const ada = nilai.filter((v) => v != null).sort((a, b) => a - b);
  return nilai.map((v) => {
    if (v == null) return null;
    if (ada.length < 2) return 0.5;
    const lo = ada.indexOf(v), hi = ada.lastIndexOf(v);
    return (lo + hi) / 2 / (ada.length - 1);
  });
}
/** Skor berbobot dari komponen {k, norm}; komponen null dilewati dan bobot dinormalkan ulang. */
export function skor(komponen) {
  const ada = komponen.filter((c) => c.norm != null);
  if (ada.length < MIN_KOMPONEN) return { skor: null, lengkap: false, n: ada.length };
  const b = ada.reduce((s, c) => s + BOBOT[c.k], 0);
  const v = ada.reduce((s, c) => s + c.norm * BOBOT[c.k], 0) / b;
  return { skor: Math.round(v * 1000) / 1000, lengkap: ada.length === komponen.length, n: ada.length };
}
export const tingkat = (s) => (s == null ? null : s >= AMBANG.siap ? 'siap' : s >= AMBANG.berkembang ? 'berkembang' : 'awal');

const kodeInstansi = (nama) => kodeProv(String(nama || '').replace(/^Pemerintah Provinsi\s+/i, '').replace(/Daerah Khusus Ibukota Jakarta/i, 'DKI Jakarta').replace(/^Daerah Istimewa Yogyakarta$/i, 'DI Yogyakarta').replace(/^Bangka Belitung$/i, 'Kepulauan Bangka Belitung'));
const bulatDua = (x) => (x == null ? null : Math.round(x * 100) / 100);

export function bangun(d) {
  const prov = d.wilayah.baris.map((w) => ({ kode: w.kode, nama: PROV[w.kode]?.[0] || w.nama }));
  const per = new Map(prov.map((p) => [p.kode, { kode: p.kode, nama: p.nama }]));
  const rued = new Map(d.rued_capaian.baris.map((r) => [r.kode, r]));
  const rawRued = new Map(d.rued.baris.map((r) => [r.kode, r]));
  const lis = new Map(d.kelistrikan.baris.map((r) => [r.kode, r]));
  const desa = new Map(d.desa_listrik.baris.map((r) => [r.kode, r]));
  const idm = new Map(d.desa_energi.baris.map((r) => [r.kode, r]));
  const sur = new Map(d.potensi_atlas.baris.map((r) => [r.kode, r]));
  const pr = new Map(), am = new Map(), pd = new Map(), kn = new Map();
  const tambah = (m, k, f) => { if (!k) return; const o = m.get(k) || {}; f(o); m.set(k, o); };
  for (const x of d.proyek.baris) {
    const k = kodeProv(x.lokasi?.provinsi);
    if (!k || x.teknologi === 'penyimpanan') continue;
    const st = x.status?.[0]?.nilai;
    if (st === 'dibatalkan') continue;
    const mw = x.kapasitas?.[0]?.satuan === 'MW' && Number.isFinite(x.kapasitas[0].nilai) ? x.kapasitas[0].nilai : 0;
    tambah(pr, k, (o) => { o.n = (o.n || 0) + 1; o.mw = (o.mw || 0) + mw; if (st === 'beroperasi') o.operasi_mw = (o.operasi_mw || 0) + mw; });
  }
  for (const x of d.amdal.baris) tambah(am, kodeProv(x.lokasi?.provinsi), (o) => { o.n = (o.n || 0) + 1; });
  for (const x of d.regulasi.baris) {
    if (x.jenis !== 'perda' || !/^Pemerintah Provinsi/i.test(x.instansi_penerbit || '')) continue;
    tambah(pd, kodeInstansi(x.instansi_penerbit), (o) => {
      o.total = (o.total || 0) + 1;
      for (const t of x.topik) if (['perizinan', 'insentif', 'perencanaan', 'karbon'].includes(t)) o[t] = (o[t] || 0) + 1;
    });
  }
  for (const o of d.organisasi.baris) {
    if (o.kategori?.kode !== 'pemda' || !/dinas|badan/i.test(o.nama) || !/esdm|energi|penanaman|investasi|lingkungan/i.test(o.nama)) continue;
    const k = kodeProv(o.lokasi?.provinsi);
    if (!k || !/^https?:/.test(o.situs || '')) continue;
    tambah(kn, k, (a) => { (a.daftar ||= []).push({ nama: o.nama, kota: o.lokasi?.kota || null, situs: o.situs, diperiksa: o.diperiksa || o.sumber?.[0]?.tanggal || null }); });
  }
  const baris = prov.map((p) => {
    const r = rued.get(p.kode), rr = rawRued.get(p.kode), l = lis.get(p.kode), dl = desa.get(p.kode), im = idm.get(p.kode), s = sur.get(p.kode), pj = pr.get(p.kode) || {}, a = am.get(p.kode) || {}, pe = pd.get(p.kode) || {};
    const w = d.emisi[p.kode];
    const penduduk = l?.penduduk ?? null;
    return {
      kode: p.kode, nama: p.nama,
      rued: rr ? { perda: rr.perda, judul: rr.judul, url: rr.sumber_url, pdf: rr.url_pdf, target_2025: r?.target_2025_persen ?? null, target_akhir: r?.target_akhir ?? null, realisasi: r?.realisasi_persen ?? null, realisasi_tahun: r?.realisasi_tahun ?? null, rasio_persen: r?.rasio_persen ?? null, status: r?.status ?? null } : null,
      listrik: l ? { rasio: l.rasio_elektrifikasi_persen, penduduk, kapasitas_mw: l.kapasitas_terpasang_mw, kwh_kapita: l.konsumsi_per_kapita_kwh_est, tahun: l.tahun } : null,
      desa: dl ? { jumlah: dl.jumlah_desa, non_pln: dl.desa_non_pln, belum: dl.belum_berlistrik, persen: dl.persen_berlistrik } : null,
      idm: im ? { maju_mandiri_persen: im.persen_maju_mandiri_2024, tertinggal: im.tertinggal + im.sangat_tertinggal, total: im.total_desa_lapor } : null,
      pvout: s?.pvout_kwh_per_kwp_tahun ?? null,
      proyek: { n: pj.n || 0, mw: Math.round(pj.mw || 0), operasi_mw: Math.round(pj.operasi_mw || 0), mw_per_100rb: penduduk ? bulatDua(((pj.mw || 0) / penduduk) * 1e5) : null },
      amdal_n: a.n || 0,
      perda: { total: pe.total || 0, perizinan: pe.perizinan || 0, insentif: pe.insentif || 0, perencanaan: pe.perencanaan || 0, karbon: pe.karbon || 0 },
      kontak: kn.get(p.kode)?.daftar || [],
      emisi: w ? { tco2e: w.total_tco2e, tahun: w.tahun } : null,
    };
  });
  // indeks v2
  const nilai = {
    rued_ada: baris.map((b) => (b.rued ? 1 : 0)),
    rued_capaian: baris.map((b) => (b.rued && b.rued.rasio_persen != null ? Math.min(b.rued.rasio_persen / 100, 1) : null)),
    elektrifikasi: (() => { const v = baris.map((b) => b.listrik?.rasio ?? null), ada = v.filter((x) => x != null), lo = Math.min(...ada), hi = Math.max(...ada); return v.map((x) => (x == null ? null : hi === lo ? 0.5 : (x - lo) / (hi - lo))); })(),
    pipeline: persentil(baris.map((b) => (b.proyek.mw_per_100rb == null ? null : b.proyek.mw_per_100rb))),
    kelembagaan: persentil(baris.map((b) => b.perda.perizinan + b.perda.insentif + b.perda.perencanaan + b.perda.karbon)),
  };
  baris.forEach((b, i) => {
    const komponen = Object.keys(BOBOT).map((k) => ({ k, norm: nilai[k][i] == null ? null : Math.round(nilai[k][i] * 1000) / 1000 }));
    const s = skor(komponen);
    b.indeks = { ...s, tingkat: tingkat(s.skor), komponen };
  });
  const urut = baris.filter((b) => b.indeks.skor != null).sort((a, z) => z.indeks.skor - a.indeks.skor);
  urut.forEach((b, i) => { b.indeks.peringkat = i + 1; });
  // kabupaten/kota
  const kab = new Map();
  const kunci = (s) => String(s).toLowerCase().replace(/^(kabupaten|kab\.?|kota)\s+/, '').replace(/\s+/g, ' ').trim();
  const ensure = (nama, kode) => { const k = kunci(nama); if (!k) return null; const o = kab.get(k) || { nama: String(nama).replace(/^(kabupaten|kab\.?|kota)\s+/i, ''), kode: null, proyek_n: 0, proyek_mw: 0, amdal_n: 0, perda_n: 0 }; if (kode && !o.kode) o.kode = kode; kab.set(k, o); return o; };
  for (const x of d.proyek.baris) {
    if (x.teknologi === 'penyimpanan' || x.status?.[0]?.nilai === 'dibatalkan') continue;
    const kk = x.lokasi?.kabupaten_kota?.[0]?.nilai; if (!kk) continue;
    const o = ensure(kk, kodeProv(x.lokasi?.provinsi)); if (!o) continue;
    o.proyek_n++; o.proyek_mw += x.kapasitas?.[0]?.satuan === 'MW' && Number.isFinite(x.kapasitas[0].nilai) ? x.kapasitas[0].nilai : 0;
  }
  for (const x of d.amdal.baris) {
    const m = /(?:Kabupaten|Kota)\s+([A-Z][A-Za-z' .-]+?)(?:\s+(?:Provinsi|Prov\.|,|dengan|yang|dan|pada|berada|\.|\()|$)/.exec(x.lokasi?.teks || '');
    if (!m) continue; const o = ensure(m[1], kodeProv(x.lokasi?.provinsi)); if (o) o.amdal_n++;
  }
  for (const x of d.regulasi.baris) {
    const m = x.jenis === 'perda' && /^Pemerintah (?:Kabupaten|Kota)\s+(.+)$/i.exec(x.instansi_penerbit || ''); if (!m) continue;
    const o = ensure(m[1], null); if (o) o.perda_n++;
  }
  const kabkota = [...kab.values()].map((o) => ({ ...o, proyek_mw: Math.round(o.proyek_mw) })).sort((a, z) => z.proyek_mw - a.proyek_mw || z.amdal_n - a.amdal_n || a.nama.localeCompare(z.nama, 'id'));
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, periode: TANGGAL.slice(0, 7), jumlah: baris.length,
    metode: {
      indeks: 'Hipotesis. Lima komponen berbobot sama (0,2): ada Perda RUED (1 atau 0); capaian RUED = realisasi pangsa kapasitas dibagi target 2025, batas atas 1; rasio elektrifikasi min-maks antarprovinsi; pipeline EBT = MW proyek (tanpa penyimpanan dan dibatalkan) per 100 ribu penduduk, peringkat persentil; kelembagaan = jumlah Perda/Pergub provinsi bertopik perizinan, insentif, perencanaan, karbon, peringkat persentil. Komponen tanpa data dilewati dan bobot dinormalkan ulang; minimal 4 komponen. Ambang: siap 0,75 ke atas, berkembang 0,5 ke atas, selebihnya awal.',
      bobot: BOBOT, ambang: AMBANG, min_komponen: MIN_KOMPONEN,
    },
    sumber: [
      { id: 'rued', judul: 'Perda RUED provinsi dan capaian pangsa kapasitas EBT', penerbit: 'peraturan.bpk.go.id; Statistik Ketenagalistrikan 2024 (ESDM)', tahun: 2024, url: 'https://peraturan.bpk.go.id/' },
      { id: 'gatrik', judul: 'Statistik Ketenagalistrikan Tahun 2024', penerbit: 'Ditjen Ketenagalistrikan, Kementerian ESDM', tahun: 2024, url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf' },
      { id: 'proyek', judul: 'Direktori proyek EBT METI (RUPTL 2025-2034, GEM, berita)', penerbit: 'METI', tahun: 2026, url: '/proyek' },
      { id: 'regulasi', judul: 'Direktori regulasi METI (peraturan.bpk.go.id)', penerbit: 'METI', tahun: 2026, url: '/regulasi' },
      { id: 'organisasi', judul: 'Situs resmi dinas energi (direktori METI)', penerbit: 'Pemerintah daerah masing-masing', tahun: 2026, url: '/direktori' },
      { id: 'climate-trace', judul: 'Emisi pembangkit listrik per provinsi', penerbit: 'Climate TRACE v6', tahun: 2024, url: 'https://climatetrace.org/' },
    ],
    butuh_unduhan: {
      apbd: { sumber: 'Portal data keuangan daerah, Ditjen Perimbangan Keuangan (DJPK) Kemenkeu', url: 'https://djpk.kemenkeu.go.id/', alasan: 'Situs tidak terjangkau dari mesin panen pada 8 Nov 2026; realisasi belanja urusan energi per provinsi perlu diunduh pemilik.' },
      bps_kab: { sumber: 'BPS (Podes dan Statistik Daerah) per kabupaten/kota', url: 'https://www.bps.go.id/', alasan: 'bps.go.id tanpa berkas terbuka yang dapat dipanen; rasio elektrifikasi dan potensi per kabupaten/kota perlu diunduh pemilik.' },
      grk: { sumber: 'SRN PPI dan SIGN-SMART, Kementerian Lingkungan Hidup', url: 'https://srn.menlhk.go.id/', alasan: 'Status pelaporan inventarisasi GRK daerah tidak tersedia sebagai berkas terbuka; perlu diunduh pemilik.' },
      kontak: { sumber: 'Situs resmi tiap pemerintah provinsi', url: null, alasan: 'Alamat dan telepon kantor belum dipanen; hanya situs resmi dinas yang tersedia.' },
    },
    provinsi: baris, kabkota,
  };
}

export function muat() {
  const emisi = {};
  for (const [k] of Object.entries(PROV)) {
    const f = path.join(AKAR, 'public/data/wilayah', k + '.json');
    if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f, 'utf-8')); if (j.emisi) emisi[k] = j.emisi; }
  }
  return { wilayah: baca('wilayah.json'), rued_capaian: baca('rued_capaian.json'), rued: baca('rued.json'), kelistrikan: baca('kelistrikan.json'), desa_listrik: baca('desa_listrik.json'), desa_energi: baca('desa_energi.json'), potensi_atlas: baca('potensi_atlas.json'), proyek: baca('proyek.json'), amdal: baca('amdal.json'), regulasi: baca('regulasi.json'), organisasi: baca('organisasi.json'), emisi };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const o = bangun(muat());
  fs.writeFileSync(path.join(AKAR, 'public/data/paket_pemda.json'), JSON.stringify(o) + '\n');
  console.log('paket_pemda:', o.jumlah, 'provinsi,', o.kabkota.length, 'kab/kota,', o.provinsi.filter((b) => b.indeks.skor != null).length, 'berindeks,', o.provinsi.filter((b) => b.kontak.length).length, 'berkontak');
}
