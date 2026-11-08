// Akses energi (listrik desa, SPKLU, kendaraan listrik, efisiensi, gender): menggabungkan masukan terkurasi bersumber
// (data/akses_energi/panen.json) dengan data yang SUDAH ada (kelistrikan.json, desa_listrik.json) jadi satu berkas per kode BPS.
// Tidak menyalin ulang yang sudah ada: rasio elektrifikasi, desa berlistrik 2024, konsumsi per kapita diambil dari berkas sumbernya.
// Pakai: node scripts/panen/akses_energi.mjs [--tanggal=YYYY-MM-DD]. Keluaran: public/data/akses_energi.json.
// Tidak ada pengambilan jaringan di sini: halaman sumber dibaca satu per satu (robots/jeda/UA METI) lalu dikurasi ke panen.json.
import fs from 'node:fs';
import path from 'node:path';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const baca = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, f), 'utf-8'));
const TANGGAL = (process.argv.find((a) => a.startsWith('--tanggal=')) || '--tanggal=2026-11-08').slice(10);
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

export function bangun() {
  const p = baca('data/akses_energi/panen.json'), k = baca('public/data/kelistrikan.json'), dl = baca('public/data/desa_listrik.json');
  const gatrik = k.sumber.find((s) => s.id === 'stat-ketenagalistrikan-2024');
  const sumber = {
    'gatrik-2024': { judul: gatrik.judul, penerbit: gatrik.penerbit, terbit: '2025-01-01', url: gatrik.url, tingkat_bukti: 'resmi', tanggal_ambil: '2026-11-07' },
    ...Object.fromEntries(Object.entries(p.sumber).map(([id, s]) => [id, { ...s, tanggal_ambil: p.tanggal_ambil }])),
  };
  sumber['gatrik-2024'].terbit = null;
  const desa = new Map(dl.baris.map((r) => [r.kode, r]));
  const rd = new Map(p.rd_pln_tw1_2026.provinsi.map((r) => [r.kode, r.nilai]));
  const sp = new Map(p.spklu.provinsi.baris.map((r) => [r.kode, r.unit]));
  const lok = new Map(p.lokasi_belum_berlistrik.provinsi.map((r) => [r.kode, r.nilai]));
  const edge = new Map(p.efisiensi.edge.bangunan.map((r) => [r.kode, r.n]));
  const provinsi = k.baris.map((r) => {
    const d = desa.get(r.kode);
    return {
      kode: r.kode, nama: r.provinsi,
      re_persen: r.rasio_elektrifikasi_persen, re_tahun: 2024,
      rumah_tangga_berlistrik: r.rumah_tangga_berlistrik_jumlah,
      jumlah_desa: d?.jumlah_desa ?? null, desa_non_pln: d?.desa_non_pln ?? null, desa_belum_2024: d?.belum_berlistrik ?? null, persen_desa_berlistrik_2024: d?.persen_berlistrik ?? null,
      konsumsi_kwh_kapita_est: r.konsumsi_per_kapita_kwh_est ?? null,
      rd_pln_2026q1: rd.get(r.kode) ?? null,
      lokasi_belum_2026: lok.get(r.kode) ?? null,
      spklu_2025: sp.has(r.kode) ? sp.get(r.kode) : null,
      edge_bangunan: edge.get(r.kode) ?? null,
      sumber_id: { re: 'gatrik-2024', desa: 'gatrik-2024', konsumsi: 'gatrik-2024', rd_pln: rd.has(r.kode) ? 'rdb-papua-2026' : null, lokasi: lok.has(r.kode) ? 'esdm-lokasi-2026' : null, spklu: sp.has(r.kode) ? 'spklu-databoks-2025' : null, edge: edge.has(r.kode) ? 'edge-ifc-2025' : null },
      tingkat_bukti: { re: 'resmi', desa: 'resmi', konsumsi: 'est', rd_pln: 'media', lokasi: 'media', spklu: 'media', edge: 'media' },
    };
  });
  const t = p.efisiensi.tenaga;
  const nas = k.meta.nasional;
  return {
    lapis: 'akses_energi', dibangun_pada: TANGGAL, tahun_data: 2026,
    nasional: {
      re_2024_persen: nas.rasio_elektrifikasi_persen, re_2026: p.re_nasional_2026,
      konsumsi_kapita: nas.konsumsi_per_kapita, rd_pln: { periode: '2026-Q1', nilai: p.rd_pln_tw1_2026.nasional, sebelumnya: p.rd_pln_tw1_2026.nasional_tw4_2025, sumber_id: 'rdb-papua-2026' },
      desa_2024: { jumlah_desa: dl.nasional.jumlah_desa, desa_non_pln: dl.nasional.desa_non_pln, belum: dl.nasional.belum_berlistrik, persen: dl.nasional.persen_berlistrik, tren: dl.nasional.tren },
    },
    sumber,
    provinsi,
    lokasi_belum_berlistrik: p.lokasi_belum_berlistrik,
    rd_pln: p.rd_pln_tw1_2026,
    papua_rumah_tangga: { ...p.papua_rumah_tangga, persen_belum: pct(p.papua_rumah_tangga.belum, p.papua_rumah_tangga.rumah_tangga) },
    spklu: { ...p.spklu, tidak_terbaca: { id: 'Rincian 24 provinsi lain tidak terbuka tanpa berlangganan; hanya sepuluh teratas dan empat provinsi tanpa SPKLU yang tercatat.', en: 'The other 24 provinces are behind a paywall; only the top ten and the four provinces with no chargers are recorded.' } },
    kendaraan_listrik: p.kendaraan_listrik,
    efisiensi: { ...p.efisiensi, tenaga: { ...t, persen_manajer_perempuan: pct(t.manajer_perempuan, t.manajer), persen_auditor_perempuan: pct(t.auditor_perempuan, t.auditor) } },
    gender: {
      ...p.gender,
      esdm: { sumber_id: t.sumber_id, periode: t.periode, manajer: pct(t.manajer_perempuan, t.manajer), auditor: pct(t.auditor_perempuan, t.auditor) },
    },
    metode: {
      id: 'Rasio elektrifikasi, desa berlistrik 2024, dan konsumsi per kapita memakai kelistrikan.json dan desa_listrik.json (Statistik Ketenagalistrikan 2024); data 2025 dan 2026 dari keterangan resmi yang dimuat media dan diberi label Media. Dua ukuran desa berbeda: "desa berlistrik" 2024 menghitung PLN dan non-PLN (PLTS, diesel komunal), "RD PLN" 2026 hanya jaringan PLN, sehingga angkanya tidak boleh dibandingkan langsung.',
      en: 'Electrification ratio, 2024 electrified villages and per-capita use come from kelistrikan.json and desa_listrik.json (Electricity Statistics 2024); 2025 and 2026 data come from official statements reported by media and are labelled Media. Two village measures differ: 2024 "electrified villages" counts PLN and non-PLN (solar, communal diesel), 2026 "RD PLN" counts the PLN grid only, so they must not be compared directly.',
    },
    celah: [
      { id: 'Tingkat kabupaten: hanya lima kabupaten Papua dengan rumah tangga belum berlistrik terbanyak (Bloomberg Technoz, Mei 2026). BPS Podes dan RUPTL per kabupaten tidak terbuka.', en: 'District level: only the five Papua districts with the most unelectrified households (Bloomberg Technoz, May 2026). BPS Podes and district RUPTL are not open.' },
      { id: 'Daftar nama desa belum berlistrik: tidak ada daftar terbuka yang ditemukan; yang terbit hanya jumlah per wilayah.', en: 'Names of unelectrified villages: no open list was found; only counts per region are published.' },
      { id: 'SPKLU per provinsi: sepuluh teratas saja; KBLBB per provinsi (data registrasi Korlantas/Samsat) tidak terbuka.', en: 'Chargers per province: top ten only; BEV counts per province (Korlantas/Samsat registrations) are not open.' },
      { id: 'Jumlah manajer dan auditor energi bersertifikat terbaru, serta pangsa perempuan sektor EBT Indonesia, tidak terbit; angka tertua 2021 dan global IRENA dipakai sebagai pembanding.', en: 'Latest certified energy managers and auditors, and the women share of Indonesia\'s RE sector, are not published; the 2021 figures and the global IRENA figure serve as benchmarks.' },
    ],
  };
}

export function periksa(o) {
  const g = [];
  const ids = new Set(Object.keys(o.sumber));
  if (o.provinsi.length !== 38) g.push('provinsi != 38');
  if (new Set(o.provinsi.map((r) => r.kode)).size !== o.provinsi.length) g.push('kode ganda');
  for (const [id, s] of Object.entries(o.sumber)) if (!/^https:\/\//.test(s.url)) g.push('url sumber ' + id);
  for (const r of o.provinsi) for (const v of Object.values(r.sumber_id)) if (v && !ids.has(v)) g.push('sumber_id tak dikenal ' + v);
  const sid = [];
  (function jalan(x) { if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { if (k === 'sumber_id' && typeof v === 'string') sid.push(v); else jalan(v); } })({ ...o, provinsi: [] });
  for (const v of sid) if (!ids.has(v)) g.push('sumber_id tak dikenal ' + v);
  const lw = o.lokasi_belum_berlistrik;
  if (lw.wilayah.reduce((s, w) => s + w.nilai, 0) !== lw.nasional) g.push('lokasi wilayah != nasional');
  const sp = o.spklu.pulau.baris.reduce((s, w) => s + w.unit, 0);
  if (sp !== o.spklu.deret[0].jumlah) g.push('spklu pulau != nasional');
  if (o.spklu.provinsi.baris.reduce((s, r) => s + r.unit, 0) > o.spklu.provinsi.total_nasional) g.push('spklu provinsi > nasional');
  if (JSON.stringify(o).includes('—')) g.push('em dash');
  return g;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const o = bangun(), g = periksa(o);
  if (g.length) { console.error(g.join('\n')); process.exit(1); }
  fs.writeFileSync(path.join(AKAR, 'public/data/akses_energi.json'), JSON.stringify(o, null, 1) + '\n');
  console.log('akses_energi:', o.provinsi.length, 'provinsi,', Object.keys(o.sumber).length, 'sumber');
}
