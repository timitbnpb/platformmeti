#!/usr/bin/env node
// Bangun public/data/peluang.json (peta peluang investasi EBT per provinsi). Deterministik, tanpa jaringan, tanpa jam.
//   node scripts/pipa/peluang.mjs [--cek]   (--cek: gagal bila berkas di disk beda dari hasil bangun)
// Masukan: data/peluang/ruen_potensi.json (RUEN Lamp. I), data/peluang/harga_patokan.json (Perpres 112/2022),
//   public/data/wilayah.json (HEESI 2025: terpasang + potensi panas bumi), public/data/proyek.json (proyek rencana).
// Angka tanpa sumber TIDAK diisi: null + catatan celah. BPP: data/peluang/bpp.json (transkripsi Kepmen ESDM; tahun BPP terbaru yang ada di berkas).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const KELUAR = path.join(ROOT, 'public/data/peluang.json');

export const TEKNOLOGI = ['surya', 'bayu', 'hidro', 'mikrohidro', 'panas_bumi', 'bioenergi', 'laut'];
// nama RUEN 2015 -> kode; provinsi induk yang kemudian dimekarkan tidak dibagi (nilai tak bisa dialokasikan)
const KODE = {
  'Aceh': '11', 'Sumatera Utara': '12', 'Sumatera Barat': '13', 'Riau': '14', 'Jambi': '15', 'Sumatera Selatan': '16', 'Bengkulu': '17', 'Lampung': '18',
  'Bangka Belitung': '19', 'Kepulauan Riau': '21', 'DKI Jakarta': '31', 'Jawa Barat': '32', 'Jawa Tengah': '33', 'DI Yogyakarta': '34', 'Jawa Timur': '35',
  'Banten': '36', 'Bali': '51', 'Nusa Tenggara Barat': '52', 'Nusa Tenggara Timur': '53', 'Kalimantan Barat': '61', 'Kalimantan Tengah': '62',
  'Kalimantan Selatan': '63', 'Kalimantan Timur': '64', 'Kalimantan Utara': '65', 'Sulawesi Utara': '71', 'Sulawesi Tengah': '72', 'Sulawesi Selatan': '73',
  'Sulawesi Tenggara': '74', 'Gorontalo': '75', 'Sulawesi Barat': '76', 'Maluku': '81', 'Maluku Utara': '82',
};
const INDUK = { 'Papua': ['91', '93', '94', '95'], 'Papua Barat': ['92', '96'] };
const KEL_BIO = { 'Kalimantan Timur/Utara': ['64', '65'] };
const F_WILAYAH = (k) => {
  const d = +k;
  if (d === 21) return ['Kepulauan Riau', 1.2];
  if (d === 19) return ['Bangka Belitung', 1.1];
  if (d < 20) return ['Sumatera', 1.1];
  if (d >= 31 && d <= 51) return ['Jawa, Madura, Bali', 1.0];
  if (d === 52 || d === 53) return ['Nusa Tenggara', 1.2];
  if (d >= 61 && d <= 65) return ['Kalimantan', 1.1];
  if (d >= 71 && d <= 76) return ['Sulawesi', 1.1];
  if (d === 82) return ['Maluku Utara', 1.25];
  if (d === 81) return ['Maluku', 1.25];
  return ['Papua / Papua Barat', 1.5]; // 91-96: Lampiran II hanya Papua dan Papua Barat; provinsi pemekaran memakai F wilayahnya
};
const bulat = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

const SUMBER = [
  { id: 'ruen', judul: 'Rencana Umum Energi Nasional (Perpres 22/2017), Lampiran I: Tabel 37, 40, 42, 44, 46, 48', penerbit: 'Pemerintah RI (Sekretariat Negara/DEN)', tahun: 2017, url: 'https://peraturan.bpk.go.id/Details/68772', catatan: 'Angka potensi tahun data 2015, 34 provinsi sebelum pemekaran Papua.' },
  { id: 'heesi2025', judul: 'Handbook of Energy and Economic Statistics of Indonesia 2025: Tabel 6.4.9 (kapasitas terpasang) dan 6.5.1 (potensi panas bumi)', penerbit: 'Kementerian ESDM', tahun: 2025, url: 'https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf' },
  { id: 'perpres112', judul: 'Perpres 112/2022 tentang Percepatan Pengembangan Energi Terbarukan untuk Penyediaan Tenaga Listrik, Lampiran I dan II', penerbit: 'Pemerintah RI (Sekretariat Negara)', tahun: 2022, url: 'https://peraturan.bpk.go.id/Details/225308' },
  { id: 'kepmen-bpp', judul: 'Kepmen ESDM Besaran BPP Pembangkitan PT PLN (Persero): 1404 K/20/MEM/2017 (BPP 2016), 1772 K/20/MEM/2018 (BPP 2017), 55 K/20/MEM/2019 (BPP 2018), 169.K/HK.02/MEM.M/2021 (BPP 2020); transkripsi di data/peluang/bpp.json', penerbit: 'Kementerian ESDM', tahun: 2021, url: 'https://jdih.esdm.go.id/' },
  { id: 'proyek-meti', judul: 'Direktori proyek EBT METI (public/data/proyek.json; sumber per proyek di berkasnya)', penerbit: 'Jaringan METI', tahun: 2026, url: 'https://platformmeti.timitbnpb.workers.dev/data/proyek.json' },
];

// BPP per provinsi dari bpp.json: nilai = sistem utama provinsi pada tahun terbaru; sistem[] = semua sistem yang menyentuh provinsi; riwayat = sistem utama per tahun.
function bppProvinsi(bpp, kode) {
  const kosong = (alasan) => ({ nilai_rp_kwh: null, nilai_sen_usd: null, tahun_bpp: null, kepmen: null, sistem_utama: null, sistem: [], riwayat: [], alasan_null: alasan, sumber_id: null });
  if (!bpp) return kosong('data/peluang/bpp.json tidak dimuat');
  const utama = bpp.utama_provinsi[kode];
  if (!utama) return kosong('provinsi tidak dipetakan ke sistem BPP');
  const tahun = Object.keys(bpp.tahun).map(Number).sort((a, b) => a - b);
  const cari = (th, kunci) => bpp.tahun[th].baris.find((r) => r.kunci === kunci);
  const riwayat = [];
  for (const th of tahun) { const r = cari(th, utama); if (r) riwayat.push({ tahun: th, kepmen: bpp.tahun[th].kepmen, nilai_rp_kwh: r.rp_kwh, nilai_sen_usd: r.sen_usd_kwh, nasional_rp_kwh: bpp.tahun[th].nasional.rp_kwh }); }
  const akhir = riwayat[riwayat.length - 1];
  if (!akhir) return kosong('sistem utama tak ada di Kepmen manapun');
  const sistem = [];
  for (const [kunci, s] of Object.entries(bpp.sistem)) {
    if (s.tingkat === 'agregat' || !s.provinsi.includes(kode)) continue;
    const r = cari(akhir.tahun, kunci);
    if (r) sistem.push({ kunci, nama: s.nama, tingkat: s.tingkat, rp_kwh: r.rp_kwh, sen_usd: r.sen_usd_kwh });
  }
  return { nilai_rp_kwh: akhir.nilai_rp_kwh, nilai_sen_usd: akhir.nilai_sen_usd, tahun_bpp: akhir.tahun, kepmen: akhir.kepmen, nasional_rp_kwh: akhir.nasional_rp_kwh,
    sistem_utama: { kunci: utama, nama: bpp.sistem[utama].nama }, sistem, riwayat: riwayat.reverse(), sumber_id: 'kepmen-bpp',
    catatan: `BPP pembangkitan sistem utama provinsi, BPP tahun ${akhir.tahun} (Kepmen ESDM ${akhir.kepmen}); bukan BPP tersambung/tegangan. Sistem kecil terisolasi dan "sub sistem kecil lainnya" tercantum di sistem[]` };
}

export function bangun({ ruen, harga, wilayah, proyek, bpp }) {
  const baris = wilayah.baris;
  const kodeNama = Object.fromEntries(baris.map((b) => [b.kode, b.nama]));
  const celah = new Set(bpp ? [] : ['bpp']);
  // ---- potensi
  const pot = Object.fromEntries(baris.map((b) => [b.kode, {}]));
  const isi = (kode, tek, o) => { pot[kode][tek] = { mw: null, tahun: 2015, sumber_id: 'ruen', ...o }; };
  for (const tek of Object.keys(ruen.tabel)) {
    const t = ruen.tabel[tek];
    for (const r of t.baris) {
      const nama = r.nama.split(',');
      const ekstra = r.teknis != null ? { teknis_mw: r.teknis, teoritis_mw: r.teoritis } : {};
      const rujuk = `${t.tabel} hlm ${t.hlm}`;
      if (INDUK[r.nama]) {
        for (const k of INDUK[r.nama]) isi(k, tek, { halaman: rujuk, catatan: `RUEN 2015 mencatat ${r.nilai} MW untuk provinsi induk "${r.nama}" sebelum pemekaran; tidak dibagi ke provinsi baru`, induk_mw: r.nilai });
      } else if (KEL_BIO[r.nama]) {
        for (const k of KEL_BIO[r.nama]) isi(k, tek, { halaman: rujuk, catatan: `RUEN menggabung ${r.nama} (${r.nilai} MW); tidak dipisah`, kelompok_mw: r.nilai });
      } else if (nama.length > 1) {
        for (const n of nama) isi(KODE[n], tek, { halaman: rujuk, catatan: `RUEN hanya memberi total kelompok ${nama.join(', ')} (${r.nilai} MW); tidak dipisah per provinsi`, kelompok_mw: r.nilai });
      } else {
        if (!KODE[r.nama]) throw new Error(`nama RUEN tak dikenal: ${r.nama} (${tek})`);
        isi(KODE[r.nama], tek, { mw: r.nilai, halaman: rujuk, ...ekstra });
      }
    }
  }
  // panas bumi: HEESI 2025 (lebih baru dari RUEN)
  for (const b of baris) {
    const p = b.potensi_panas_bumi;
    pot[b.kode].panas_bumi = p && p.nilai != null
      ? { mw: p.nilai, tahun: p.tahun, sumber_id: 'heesi2025', halaman: 'Tabel 6.5.1 hlm 120-121 (sumber daya + cadangan, Badan Geologi per Des 2025)' }
      : { mw: null, tahun: 2025, sumber_id: 'heesi2025', catatan: 'tidak ada nilai di HEESI 2025' };
    for (const tek of TEKNOLOGI) pot[b.kode][tek] ||= { mw: null, tahun: 2015, sumber_id: 'ruen', catatan: 'tidak tercantum di tabel RUEN untuk provinsi ini' };
  }
  // ---- terpasang + rasio
  const HEESI_KUNCI = { hidro: 'hidro', panas_bumi: 'panas-bumi', surya: 'surya', bayu: 'bayu', bioenergi: 'bioenergi' };
  // ---- proyek
  const prov = new Map(baris.map((b) => [b.nama, b.kode]));
  const pr = Object.fromEntries(baris.map((b) => [b.kode, { rencana: 0, rencana_tanpa_pengembang: 0, mw_rencana_tanpa_pengembang: 0 }]));
  let tanpaProv = 0; const tak = new Set();
  for (const p of proyek.baris) {
    const nama = p.lokasi && p.lokasi.provinsi;
    const k = prov.get(nama);
    if (!nama) { tanpaProv++; continue; }
    if (!k) { tak.add(nama); continue; }
    const st = (p.status && p.status[0] && p.status[0].nilai) || null;
    if (st !== 'rencana') continue;
    const pemilik = ((p.pihak && p.pihak.pemilik) || []).map((x) => String(x.nilai).trim());
    // pengembang belum ada: tak ada pemilik, atau hanya label generik RUPTL "IPP" (belum bernama)
    const tanpa = pemilik.length === 0 || pemilik.every((x) => x === 'IPP');
    pr[k].rencana++;
    if (tanpa) {
      pr[k].rencana_tanpa_pengembang++;
      pr[k].mw_rencana_tanpa_pengembang += (p.kapasitas || []).reduce((a, c) => a + (c.satuan === 'MW' && typeof c.nilai === 'number' ? c.nilai : 0), 0);
    }
  }
  if (tak.size) throw new Error('provinsi proyek tak dikenal: ' + [...tak].join(', '));
  const hasil = baris.map((b) => {
    const t = {}; const rasio = {};
    const pt = b.per_teknologi_mw;
    for (const [tek, key] of Object.entries(HEESI_KUNCI)) {
      const v = pt && pt[key] != null ? pt[key] : null;
      t[tek] = { mw: v == null ? null : bulat(v), tahun: b.terpasang_mw.tahun, sumber_id: 'heesi2025', halaman: 'Tabel 6.4.9 hlm 118' };
      let pm = pot[b.kode][tek]?.mw ?? null;
      if (tek === 'hidro' && pm != null) pm += pot[b.kode].mikrohidro.mw ?? 0; // terpasang HEESI = PLTA + PLTM/H gabung
      const ok = v != null && pm != null && pm > 0;
      rasio[tek] = { persen: ok ? bulat((v / pm) * 100) : null, penyebut_mw: ok ? bulat(pm) : null, catatan: ok ? (tek === 'panas_bumi' ? 'terpasang 2025 / potensi 2025 (HEESI)' : 'terpasang 2025 (HEESI) / potensi 2015 (RUEN): beda tahun, indikasi saja') : 'potensi per provinsi tidak tersedia' };
    }
    t.mikrohidro = { mw: null, tahun: null, sumber_id: 'heesi2025', catatan: 'HEESI menggabung PLTA dan PLTM/H dalam satu kolom (lihat hidro)' };
    t.laut = { mw: null, tahun: null, sumber_id: 'heesi2025', catatan: 'tidak ada kapasitas terpasang listrik laut di HEESI' };
    const [wil, F] = F_WILAYAH(b.kode);
    const x = pr[b.kode];
    return {
      kode: b.kode, nama: b.nama,
      potensi: pot[b.kode], terpasang: t, rasio_pemanfaatan: rasio,
      bpp: bppProvinsi(bpp, b.kode),
      faktor_lokasi: { F, wilayah: wil, sumber_id: 'perpres112', catatan: 'F pulau kecil/Mentawai lebih tinggi; tidak dipetakan' },
      proyek: { rencana: x.rencana, rencana_tanpa_pengembang: x.rencana_tanpa_pengembang, mw_rencana_tanpa_pengembang: bulat(x.mw_rencana_tanpa_pengembang, 1), sumber_id: 'proyek-meti' },
    };
  });
  return {
    meta: {
      diperbarui: wilayah.dibangun_pada,
      jumlah: hasil.length,
      proyek_tanpa_provinsi: tanpaProv,
      definisi_tanpa_pengembang: 'status proyek "rencana" dan tidak ada pemilik, atau pemilik hanya label generik "IPP" (RUPTL); proyek tanpa provinsi atau tanpa status tidak dihitung',
      catatan: 'Potensi RUEN bertahun data 2015 (34 provinsi); hidro RUEN per kelompok wilayah (null per provinsi bila kelompok); Papua/Papua Barat induk tidak dibagi ke provinsi pemekaran. Terpasang dan rasio dari HEESI 2025. BPP: Kepmen ESDM terbaru yang ada di berkas = BPP 2020 (Kepmen 169.K/2021); BPP 2021 ke atas belum terambil. Mikrohidro terpasang tidak dipisah dari hidro. Laut: potensi praktis RUEN, tanpa terpasang.',
      celah: [...celah],
    },
    sumber: SUMBER,
    harga_patokan: { sumber_id: 'perpres112', tahun: harga.tahun, satuan: harga.satuan, catatan: harga.catatan, teknologi: harga.teknologi, faktor_lokasi: harga.faktor_lokasi, faktor_lokasi_kecil: harga.faktor_lokasi_kecil },
    baris: hasil,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = JSON.stringify(bangun({
    ruen: baca('data/peluang/ruen_potensi.json'), harga: baca('data/peluang/harga_patokan.json'),
    wilayah: baca('public/data/wilayah.json'), proyek: baca('public/data/proyek.json'), bpp: baca('data/peluang/bpp.json'),
  }), null, 1) + '\n';
  if (process.argv.includes('--cek')) {
    if (!fs.existsSync(KELUAR) || fs.readFileSync(KELUAR, 'utf8') !== out) { console.error('peluang.json basi: jalankan node scripts/pipa/peluang.mjs'); process.exit(1); }
  } else { fs.writeFileSync(KELUAR, out, 'utf8'); console.log('tulis', KELUAR, out.length, 'byte'); }
}
