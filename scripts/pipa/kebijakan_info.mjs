// Kebijakan (informasi): pelacak rancangan/program, arsip masukan METI (hanya yang sudah publik), regulasi terbaru dan dampaknya,
// pelengkap ASEAN (intensitas karbon, pangsa batubara; tidak menggandakan /asean), pemetaan target dan NDC, ringkasan satu halaman.
// Pakai: node scripts/pipa/kebijakan_info.mjs [--tanggal=YYYY-MM-DD]. Keluaran: public/data/kebijakan_info.json. Tanpa panen baru.
import fs from 'node:fs';
import path from 'node:path';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const baca = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', f), 'utf-8'));
const TANGGAL = (process.argv.find((a) => a.startsWith('--tanggal=')) || '--tanggal=2026-11-08').slice(10);
const URL_OK = (u) => (/^https:\/\//.test(u || '') ? u : null);
const DAMPAK = {
  harga: 'tarif dan harga pembelian listrik', perizinan: 'perizinan dan waktu proyek', insentif: 'insentif fiskal dan nonfiskal', jaringan: 'jaringan dan interkoneksi',
  karbon: 'nilai ekonomi karbon', perencanaan: 'perencanaan dan target', penyimpanan: 'penyimpanan energi', bioenergi: 'bioenergi', surya: 'tenaga surya',
  panas_bumi: 'panas bumi', hidro: 'tenaga air', nuklir: 'nuklir', efisiensi: 'efisiensi energi', tkdn: 'kandungan lokal', hidrogen: 'hidrogen', angin: 'tenaga angin',
};

export function bangun(d) {
  const pelacak = [];
  for (const r of [...d.kebijakan_proses.baris, ...d.konsultasi.baris]) {
    const ada = pelacak.find((x) => x.id === r.id);
    if (ada) { ada.url ||= URL_OK(r.tautan || r.sumber?.url); ada.instansi = r.instansi || ada.instansi; continue; }
    pelacak.push({ id: r.id, jenis: r.jenis || 'ruu', nama: r.nama || r.judul, instansi: r.instansi || 'DPR RI', tahap: r.tahap, tanggal: r.tanggal || null, url: URL_OK(r.tautan || r.sumber?.url), label: r.sumber?.label || null, catatan: r.catatan || null, dpr_terverifikasi: false, langkah: r.langkah || ['usul', 'prolegnas', 'pembahasan', 'pengesahan', 'diundangkan'] });
  }
  const program = d.program_analisis.baris.map((p) => ({
    kode: p.kode, nama: p.nama, tahap: p.tahap, tahap_ket: p.tahap_ket,
    dasar: (p.dasar_hukum || []).map((h) => ({ nama: h.nama, status: h.status, url: URL_OK(h.url_sumber || h.url_pdf) })).filter((h) => h.nama),
    tonggak_terakhir: (p.tonggak || []).filter((x) => URL_OK(x.url)).slice(-1).map((x) => ({ tgl: x.tgl, teks: x.peristiwa, url: x.url, bukti: x.bukti }))[0] || null,
  }));
  const masukan = [];
  for (const k of d.kalender.baris.filter((x) => x.jenis === 'audiensi')) {
    const s = (Array.isArray(k.sumber) ? k.sumber : [k.sumber]).filter(Boolean)[0] || {};
    masukan.push({ tanggal: k.tanggal, judul: k.judul, mitra: [].concat(k.mitra || []).filter((m) => m !== 'METI'), url: URL_OK(s.url), label: s.label || null, bukti: s.tingkat_bukti || null });
  }
  const posisi = [];
  for (const p of d.program_analisis.baris) for (const m of p.posisi_meti || []) if (m.teks?.id) posisi.push({ program: p.kode, teks: m.teks, sumber: m.sumber });
  const peristiwaAkhir = d.regulasi.baris.filter((r) => r.jenis !== 'perda' && r.status === 'berlaku' && r.tahun >= 2024)
    .sort((a, z) => String(z.tanggal_ditetapkan).localeCompare(String(a.tanggal_ditetapkan)))
    .map((r) => ({ id: r.id, jenis: r.jenis, nomor: r.nomor, tahun: r.tahun, judul: r.judul, tanggal: r.tanggal_ditetapkan, topik: r.topik.filter((t) => DAMPAK[t]), dampak: r.topik.filter((t) => DAMPAK[t]).map((t) => DAMPAK[t]), ringkasan: r.ringkasan, url: URL_OK(r.url_sumber), pdf: URL_OK(r.url_pdf) }));
  const per = {};
  for (const r of peristiwaAkhir) for (const t of r.topik) { per[t] ||= {}; per[t][r.tahun] = (per[t][r.tahun] || 0) + 1; }
  const asean = d.asean_energi.baris.map((n) => ({ iso3: n.iso3, nama: n.nama, karbon: n.intensitas_karbon_gco2_kwh, batubara: n.bauran_listrik_persen?.batubara || null, ebt: n.bauran_listrik_persen?.ebt_total || null, twh: n.pembangkitan_twh }));
  const target = d.target.target.map((x) => ({ id: x.id, dokumen: x.dokumen, ukuran: x.ukuran, tahun: x.tahun_target ?? null, min: x.min ?? null, maks: x.maks ?? null, catatan: x.catatan || null, halaman: x.halaman || null }));
  const sumberT = Object.fromEntries(d.target.sumber.map((s) => [s.id, { judul: s.judul, url: s.url }]));
  const jetp = d.jetp_cipp.baris.filter((x) => x.jenis === 'proyek' && x.ebt).map((x) => ({ nama: x.nama_id || x.nama, mw: x.kapasitas_mw ?? null, provinsi: x.lokasi?.provinsi || null, status: x.status }));
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, periode: TANGGAL.slice(0, 7),
    catatan_dpr: 'situs DPR RI melarang perayap (robots.txt, 8 Nov 2026): status tahap hanya dari arsip METI dan berita, bukan dari situs DPR.',
    pelacak, program, masukan, posisi, dampak_kamus: DAMPAK, regulasi_terbaru: peristiwaAkhir, regulasi_topik_tahun: per,
    asean, target, target_sumber: sumberT, realisasi: d.target.realisasi, celah: d.target.celah, kapasitas_ebt: d.target.kapasitas_ebt, jetp,
    butuh_unduhan: {
      prolegnas: { sumber: 'Daftar Prolegnas DPR RI dan situs Badan Keahlian DPR', url: 'https://www.dpr.go.id/', alasan: 'robots.txt DPR melarang perayap; status resmi Prolegnas perlu dicek dan diunduh pemilik.' },
      kebijakan_asean: { sumber: 'Kementerian energi dan regulator tiap negara ASEAN', url: null, alasan: 'Tarif lelang dan target EBT per negara belum dipanen (kolom null di asean_energi.json); perlu dokumen tiap negara.' },
      masukan_lain: { sumber: 'Arsip internal METI', url: null, alasan: 'Hanya masukan yang sudah tampil di data publik yang dimuat; dokumen internal tidak dimuat.' },
    },
  };
}
export function muat() {
  return { kebijakan_proses: baca('kebijakan_proses.json'), konsultasi: baca('konsultasi.json'), program_analisis: baca('program_analisis.json'), kalender: baca('kalender.json'), regulasi: baca('regulasi.json'), asean_energi: baca('asean_energi.json'), target: baca('target.json'), jetp_cipp: baca('jetp_cipp.json') };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const o = bangun(muat());
  fs.writeFileSync(path.join(AKAR, 'public/data/kebijakan_info.json'), JSON.stringify(o) + '\n');
  console.log('kebijakan_info:', o.pelacak.length, 'pelacak,', o.program.length, 'program,', o.masukan.length, 'masukan,', o.posisi.length, 'posisi,', o.regulasi_terbaru.length, 'regulasi,', o.target.length, 'target');
}
