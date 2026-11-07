// public/data/indeks.json: indeks terbuka (label Hipotesis): kesiapan provinsi + kesehatan proyek. Metode, bobot, sumber ada di berkas keluaran.
// Masukan: public/data/*.json saja (tanpa jaringan, tanpa jam: tanggal = argumen atau proyek.dibangun_pada, deterministik).
//   node scripts/pipa/indeks.mjs [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const VERSI = '1.0.0';
export const MIN_LENGKAP = 0.6; // peringkat hanya untuk provinsi dengan bobot data tersedia >= 60 persen
export const BATAS_KABAR = { segar: 180, basi: 730 }; // hari: <= segar = 100, >= basi = 0, linear di antaranya
const bulat = (x, d = 1) => (x === null ? null : +x.toFixed(d));
const jumlah = (a) => a.reduce((s, x) => s + x, 0);

/** Normalisasi 0-100. persentil = peringkat tengah (seri berbagi), minmax = linear terendah..tertinggi, null tetap null. */
export function normalisasi(peta, mode) {
  const ada = [...peta].filter(([, v]) => Number.isFinite(v));
  const out = new Map([...peta].map(([k]) => [k, null]));
  if (!ada.length) return out;
  const nilai = ada.map(([, v]) => v), lo = Math.min(...nilai), hi = Math.max(...nilai);
  for (const [k, v] of ada) {
    if (ada.length === 1 || (mode === 'minmax' && hi === lo)) out.set(k, 50);
    else if (mode === 'minmax') out.set(k, bulat(((v - lo) / (hi - lo)) * 100));
    else { const kurang = nilai.filter((x) => x < v).length, sama = nilai.filter((x) => x === v).length; out.set(k, bulat(((kurang + (sama - 1) / 2) / (ada.length - 1)) * 100)); }
  }
  return out;
}

const SUM = (o, kunci) => { const v = kunci.map((k) => o?.[k]?.mw).filter(Number.isFinite); return v.length ? bulat(jumlah(v), 2) : null; };
const EBT_PASANG = ['hidro', 'panas_bumi', 'surya', 'bayu', 'bioenergi'];

/** Daftar komponen provinsi: id, bobot (jumlah 100), mode normalisasi, sumber, dan cara mengambil nilai mentah per kode. */
export const KOMPONEN = [
  { id: 'potensi', bobot: 15, mode: 'persentil', sumber: ['peluang.json (RUEN 2015, HEESI 2025)'], deskripsi: 'Jumlah potensi EBT (MW) semua jenis yang tercatat; makin besar makin banyak yang bisa dibangun.', mentah: (c) => SUM(c.pel?.potensi, ['surya', 'bayu', 'hidro', 'mikrohidro', 'bioenergi', 'panas_bumi', 'laut']) },
  { id: 'terpasang', bobot: 15, mode: 'persentil', sumber: ['peluang.json (HEESI 2025)'], deskripsi: 'Kapasitas EBT terpasang (MW): bukti rantai pasok, jaringan, dan pengalaman izin sudah jalan.', mentah: (c) => SUM(c.pel?.terpasang, EBT_PASANG) },
  { id: 'elektrifikasi', bobot: 10, mode: 'minmax', sumber: ['kelistrikan.json (Statistik Ketenagalistrikan 2024)'], deskripsi: 'Rasio elektrifikasi (persen): fondasi jaringan yang ada.', mentah: (c) => c.lis?.rasio_elektrifikasi_persen ?? null },
  { id: 'bpp', bobot: 5, mode: 'minmax', sumber: ['peluang.json (BPP Kepmen ESDM 169.K/2021)'], deskripsi: 'BPP pembangkitan setempat (Rp/kWh): makin tinggi, harga patokan EBT makin menarik bagi pengembang (hipotesis arah).', mentah: (c) => c.pel?.bpp?.nilai_rp_kwh ?? null },
  { id: 'ruptl', bobot: 15, mode: 'persentil', sumber: ['ruptl.json (RUPTL 2025-2034)'], deskripsi: 'Kapasitas pembangkit EBT bernama di RUPTL (MW): permintaan resmi PLN. Tanpa baris = 0 (tidak ada proyek bernama).', mentah: (c) => bulat(jumlah(c.rup.map((r) => r.kapasitas_mw).filter(Number.isFinite)), 2) },
  { id: 'proyek', bobot: 15, mode: 'persentil', sumber: ['proyek.json'], deskripsi: 'Jumlah proyek terlacak di provinsi.', mentah: (c) => c.proyek },
  { id: 'organisasi', bobot: 10, mode: 'persentil', sumber: ['wilayah.json'], deskripsi: 'Jumlah organisasi (pengembang, koperasi, lembaga) tercatat di provinsi.', mentah: (c) => c.org },
  { id: 'rued', bobot: 7, mode: 'biner', sumber: ['wilayah.json (regulasi)'], deskripsi: 'Perda RUED terbit: 100. Tidak ditemukan: tak diketahui (belum dipanen atau belum terbit), bukan nol.', mentah: (c) => (c.wil?.rued?.perda ? 1 : null) },
  { id: 'plts_atap', bobot: 4, mode: 'persentil', sumber: ['plts_atap.json (RUPTL tabel 2.6)'], deskripsi: 'Kuota PLTS atap 2025-2034 (MW) pada regional PLN provinsi itu; angka tingkat regional, bukan provinsi.', mentah: (c) => c.atap },
  { id: 'wkp', bobot: 4, mode: 'persentil', sumber: ['wkp.json'], deskripsi: 'Jumlah WKP panas bumi terkurasi. Daftar tidak lengkap, jadi provinsi tanpa WKP ditandai tak diketahui.', mentah: (c) => c.wkp || null },
];

export function indeksProvinsi({ peluang, kelistrikan, ruptl, wilayah, proyek, plts_atap, wkp }) {
  const pel = new Map(peluang.baris.map((b) => [b.kode, b])), lis = new Map(kelistrikan.baris.map((b) => [b.kode, b])), wil = new Map(wilayah.baris.map((b) => [b.kode, b]));
  const kode = peluang.baris.map((b) => b.kode), nama = new Map(peluang.baris.map((b) => [b.nama, b.kode]));
  const regional = new Map(); // provinsi -> regional PLN dari baris RUPTL
  for (const r of ruptl.baris) if (nama.has(r.provinsi) && r.regional) regional.set(nama.get(r.provinsi), r.regional);
  const kuota = {}; for (const b of plts_atap.baris) kuota[b.regional] = (kuota[b.regional] || 0) + (b.kuota_mw || 0);
  const hit = (arr, f) => { const m = new Map(); for (const x of arr) { const k = nama.get(f(x)); if (k) m.set(k, (m.get(k) || 0) + 1); } return m; };
  const nProyek = hit(proyek.baris, (p) => p.lokasi?.provinsi), nWkp = hit(wkp.baris, (w) => w.provinsi);
  const konteks = (k) => ({ pel: pel.get(k), lis: lis.get(k), wil: wil.get(k), rup: ruptl.baris.filter((r) => nama.get(r.provinsi) === k), proyek: nProyek.get(k) || 0, org: wil.get(k)?.organisasi?.length ?? 0, wkp: nWkp.get(k) || 0, atap: regional.has(k) ? (kuota[regional.get(k)] ?? null) : null });
  const ctx = new Map(kode.map((k) => [k, konteks(k)]));
  const skor = {};
  for (const km of KOMPONEN) {
    const mentah = new Map(kode.map((k) => [k, km.mentah(ctx.get(k))]));
    skor[km.id] = { mentah, norma: km.mode === 'biner' ? new Map([...mentah].map(([k, v]) => [k, v === null ? null : 100])) : normalisasi(mentah, km.mode) };
  }
  const baris = kode.map((k) => {
    const komponen = {}, kosong = [];
    let bobotAda = 0, jml = 0;
    for (const km of KOMPONEN) {
      const m = skor[km.id].mentah.get(k), s = skor[km.id].norma.get(k);
      komponen[km.id] = { mentah: m, skor: s };
      if (s === null) kosong.push(km.id); else { bobotAda += km.bobot; jml += km.bobot * s; }
    }
    return { kode: k, nama: pel.get(k).nama, skor: bobotAda ? bulat(jml / bobotAda) : null, peringkat: null, kelengkapan: bulat(bobotAda / 100, 2), komponen, kosong };
  });
  const urut = baris.filter((b) => b.skor !== null && b.kelengkapan >= MIN_LENGKAP).sort((a, b) => b.skor - a.skor || a.kode.localeCompare(b.kode));
  urut.forEach((b, i) => { b.peringkat = i && b.skor === urut[i - 1].skor ? urut[i - 1].peringkat : i + 1; });
  return baris.sort((a, b) => (a.peringkat ?? 1e9) - (b.peringkat ?? 1e9) || a.kode.localeCompare(b.kode));
}

/* ---------- kesehatan proyek (dua dimensi terpisah) ---------- */
// Kesehatan = sinyal nyata saja (lewat COD tanpa realisasi, berhenti/mangkrak/dibatalkan). Kelengkapan = umur kabar + field kosong; TIDAK pernah membuat label "bermasalah".
export const BOBOT_PROYEK = { jadwal: 60, status: 40 };
export const BOBOT_LENGKAP = { kabar: 50, field: 50 };
export const MIN_DATA_TIPIS = 75; // kelengkapan di bawah ini = "data perlu diperbarui" (netral)
const hari = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const rata = (s, bobot) => { let w = 0, j = 0; for (const [k, b] of Object.entries(bobot)) if (s[k] !== null) { w += b; j += b * s[k]; } return w ? bulat(j / w, 0) : null; };

export function indeksProyek({ proyek, berita }, tanggal) {
  const tahun = +tanggal.slice(0, 4);
  const kabar = new Map(); // id proyek -> tanggal berita terakhir
  const catat = (id, tg) => { tg = String(tg || '').slice(0, 10); if (tg && tg > (kabar.get(id) || '')) kabar.set(id, tg); };
  const bid = new Map(berita.baris.map((b) => [b.id, b]));
  for (const b of berita.baris) for (const id of b.proyek_ids || []) catat(id, b.terbit);
  for (const p of proyek.baris) for (const id of p.berita_ids || []) if (bid.has(id)) catat(p.id, bid.get(id).terbit);
  return proyek.baris.map((p) => {
    const st = p.status?.[0]?.nilai ?? 'tidak-diketahui', aktif = !['beroperasi', 'dibatalkan'].includes(st);
    const cods = (p.cod_target || []).map((x) => x.nilai).filter(Number.isFinite), cod = cods.length ? Math.min(...cods) : null;
    const telat = cod !== null && cod < tahun && aktif ? tahun - cod : 0;
    const berhenti = st === 'dibatalkan' || (st !== 'beroperasi' && (p.status || []).some((s) => /tunda|henti|mangkrak/i.test(s.status_asli || '')));
    const kb = kabar.get(p.id) || null, umur = kb ? hari(kb, tanggal) : null;
    const sinyal = [], tipis = [];
    // (a) kesehatan: hanya sinyal nyata
    const kes = { jadwal: st === 'beroperasi' ? 100 : st === 'dibatalkan' ? 0 : cod === null ? null : Math.max(0, 100 - 40 * telat), status: berhenti ? 0 : 100 };
    if (st === 'dibatalkan') sinyal.push({ k: 'batal' }); else if (berhenti) sinyal.push({ k: 'berhenti' });
    if (telat) sinyal.push({ k: 'telat', n: telat });
    // (b) kelengkapan: kabar (proyek aktif) + field
    const ada = { pemilik: !!p.pihak?.pemilik?.length, kapasitas: Number.isFinite(p.kapasitas?.[0]?.nilai), lokasi: !!p.lokasi?.provinsi, sumber: (p.sumber || []).some((x) => /^https?:\/\//.test(x.url || '')) };
    const hilang = Object.keys(ada).filter((k) => !ada[k]);
    const lk = { kabar: !aktif ? null : umur === null ? 0 : bulat(Math.max(0, Math.min(100, ((BATAS_KABAR.basi - umur) / (BATAS_KABAR.basi - BATAS_KABAR.segar)) * 100)), 0), field: bulat(((4 - hilang.length) / 4) * 100, 0) };
    if (aktif && umur === null) tipis.push({ k: 'tanpa_kabar' }); else if (aktif && umur > 365) tipis.push({ k: 'kabar_basi', n: Math.round(umur / 30) });
    if (cod === null && aktif) tipis.push({ k: 'cod_kosong' });
    if (hilang.length) tipis.push({ k: 'kurang', f: hilang });
    const bermasalah = telat > 0 || berhenti, skor_lengkap = rata(lk, BOBOT_LENGKAP), data_tipis = skor_lengkap < MIN_DATA_TIPIS;
    const kategori = bermasalah ? 'bermasalah' : data_tipis ? 'data_tipis' : 'sehat';
    return { id: p.id, nama: p.nama, provinsi: p.lokasi?.provinsi || null, status: st, kategori, skor: rata(kes, BOBOT_PROYEK), skor_lengkap, data_tipis, sinyal: kes, sinyal_lengkap: lk, kabar_terakhir: kb, alasan: sinyal, alasan_tipis: tipis, alasan_teks: alasanTeks(sinyal), alasan_tipis_teks: alasanTeks(tipis, 'tidak ada catatan yang kurang') };
  }).sort((a, b) => ({ bermasalah: 0, data_tipis: 1, sehat: 2 })[a.kategori] - ({ bermasalah: 0, data_tipis: 1, sehat: 2 })[b.kategori] || (a.skor ?? 101) - (b.skor ?? 101) || a.id.localeCompare(b.id));
}

const TEKS = { batal: () => 'dibatalkan', berhenti: () => 'status tertunda atau berhenti', cod_kosong: () => 'COD rencana belum diketahui', telat: (a) => `lewat COD rencana ${a.n} tahun tanpa beroperasi`, tanpa_kabar: () => 'tidak ada kabar tercatat', kabar_basi: (a) => `kabar terakhir ${a.n} bulan lalu`, kurang: (a) => `data kurang: ${a.f.join(', ')}` };
export const alasanTeks = (al, kosong = 'tidak ada sinyal buruk') => al.map((a) => TEKS[a.k](a)).join('; ') || kosong;

export function bangun(masukan, tanggal) {
  const prov = indeksProvinsi(masukan), proy = indeksProyek(masukan, tanggal);
  return {
    label: 'Hipotesis', versi: VERSI, tanggal,
    metode: {
      ringkas: 'Skor 0-100 dari komponen yang dinormalisasi lalu dibobot. Komponen tanpa data dikeluarkan dari penyebut (bobot tersisa dinormalisasi ulang) dan ditandai; tidak pernah diisi nol diam-diam.',
      min_lengkap: MIN_LENGKAP, batas_kabar_hari: BATAS_KABAR,
      provinsi: { rumus: 'skor = jumlah(bobot_i x norma_i) / jumlah(bobot_i) atas komponen yang ada. Persentil: (jumlah nilai lebih kecil + setengah jumlah seri lain) / (n - 1) x 100. Min-max: (x - min) / (maks - min) x 100.', komponen: KOMPONEN.map((k) => ({ id: k.id, bobot: k.bobot, normalisasi: k.mode, deskripsi: k.deskripsi, sumber: k.sumber })) },
      proyek: { rumus: 'Dua dimensi terpisah. (a) Kesehatan = jumlah(bobot x sinyal) / jumlah(bobot sinyal yang ada), hanya dari sinyal nyata: jadwal (100 - 40 x tahun lewat COD rencana tanpa beroperasi, min 0; 0 bila dibatalkan) dan status (0 bila tertunda, berhenti, mangkrak, atau dibatalkan). Label "bermasalah" hanya bila lewat COD tanpa realisasi atau berhenti. (b) Kelengkapan data = kabar (100 bila kabar terakhir <= 180 hari, 0 bila >= 730 hari atau tanpa kabar; hanya proyek aktif) dan field (pemilik, kapasitas, lokasi, sumber). Skor kelengkapan di bawah 75 = "data perlu diperbarui": label netral, bukan masalah.', bobot: BOBOT_PROYEK, bobot_kelengkapan: BOBOT_LENGKAP, min_data_tipis: MIN_DATA_TIPIS, sumber: ['proyek.json', 'berita.json'] },
      keterbatasan: ['Potensi RUEN bertahun data 2015; terpasang HEESI 2025 (beda tahun).', 'Bobot adalah pilihan penyusun (hipotesis), belum divalidasi terhadap hasil nyata.', 'Berita tidak lengkap: proyek tanpa kabar tercatat belum tentu mati, karena itu hanya memengaruhi kelengkapan data, tidak pernah label bermasalah.', 'Persentil mengukur urutan, bukan selisih besar.'],
    },
    provinsi: prov, proyek: proy,
  };
}

const baca = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data', n + '.json'), 'utf8'));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const masukan = Object.fromEntries(['peluang', 'kelistrikan', 'ruptl', 'wilayah', 'proyek', 'berita', 'plts_atap', 'wkp'].map((n) => [n, baca(n)]));
  const tanggal = process.argv[2] || masukan.proyek.dibangun_pada;
  const out = bangun(masukan, tanggal);
  fs.writeFileSync(path.join(ROOT, 'public/data/indeks.json'), JSON.stringify(out) + '\n', 'utf8');
  console.log(`indeks.json: ${out.provinsi.length} provinsi (${out.provinsi.filter((p) => p.peringkat).length} berperingkat), ${out.proyek.length} proyek, ${['bermasalah', 'data_tipis', 'sehat'].map((k) => k + ' ' + out.proyek.filter((p) => p.kategori === k).length).join(', ')}`);
}
