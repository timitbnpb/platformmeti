#!/usr/bin/env node
// public/data/radar_kabupaten.json: skor peluang investasi EBT per kabupaten/kota (514), HIPOTESIS terbuka.
//   node scripts/pipa/radar_kabupaten.mjs ambil   (jaringan; daftar kab/kota Kemendagri) -> data/radar/kabkota.csv
//   node scripts/pipa/radar_kabupaten.mjs bangun  (offline) -> public/data/radar_kabupaten.json
// Jujur soal data: geometri dan koordinat kabupaten TIDAK ada di repo, jadi komponen sumber daya, BPP, harga patokan, dan akses desa
// berskala PROVINSI (diwarisi); hanya pipeline proyek, dokumen AMDAL, dan Perda yang berskala kabupaten (paket_pemda.json) dan hanya bila namanya cocok.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';
import { TEK, BOBOT_SEMUA, BOBOT_TEK, minmaks, skorTek } from '../../public/radar_rumus.js';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const TGL = '2026-11-08';
const SUMBER_DAFTAR = 'https://raw.githubusercontent.com/edwardsamuel/Wilayah-Administratif-Indonesia/master/csv/regencies.csv';
const J = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
const DK = (k) => k.replace('-', '_');

/* Kode Kemendagri lama (91 = Papua Barat, 94 = Papua) ke kode provinsi berlaku sekarang (38 provinsi). */
const PAPUA_BARU = {
  '92': ['fakfak', 'kaimana', 'telukwondama', 'telukbintuni', 'manokwari', 'manokwariselatan', 'pegununganarfak'],
  '96': ['sorongselatan', 'sorong', 'rajaampat', 'tambrauw', 'maybrat', 'kotasorong'],
  '93': ['merauke', 'bovendigoel', 'mappi', 'asmat'],
  '94': ['nabire', 'paniai', 'mimika', 'puncakjaya', 'puncak', 'dogiyai', 'intanjaya', 'deiyai'],
  '95': ['jayawijaya', 'lannyjaya', 'mamberamotengah', 'nduga', 'pegununganbintang', 'tolikara', 'yalimo', 'yahukimo'],
  '91': ['jayapura', 'kotajayapura', 'kepulauanyapen', 'biaknumfor', 'sarmi', 'keerom', 'waropen', 'supiori', 'mamberamoraya'],
};
const KECIL = new Set(['dan', 'di', 'ke', 'ii', 'iii']);
const judul = (s) => s.replace(/\b(?:[A-Z] ){2,}[A-Z]\b/g, (m) => m.replace(/ /g, '')).toLowerCase().split(/\s+/).map((w) => (KECIL.has(w) && w !== 'ii' ? w : w[0].toUpperCase() + w.slice(1))).join(' ');
const kunci = (s) => String(s).toLowerCase().replace(/^(kabupaten|kota|kab\.?)\s+/, '').replace(/[^a-z]/g, '');

export async function ambilSemua() { fs.writeFileSync(AKAR + 'data/radar/kabkota.csv', await ambil(SUMBER_DAFTAR)); }

export function daftarKabkota(csv = fs.readFileSync(AKAR + 'data/radar/kabkota.csv', 'utf8')) {
  return csv.trim().split('\n').map((l) => {
    const [kode, prov, ...n] = l.split(','); const nama = n.join(',').trim();
    const kota = /^KOTA /.test(nama), k = kunci(nama), kk = (kota ? 'kota' : '') + k;
    let p = prov;
    if (prov === '91' || prov === '94') p = Object.entries(PAPUA_BARU).find(([, ls]) => ls.includes(kk) || (!kota && ls.includes(k) && !ls.includes('kota' + k)))?.[0] || prov;
    return { kode, prov: p, jenis: kota ? 'kota' : 'kab', nama: judul(nama.replace(/^KABUPATEN /, 'Kabupaten ').replace(/^KOTA /, 'Kota ')), kunci: k };
  });
}

export function bangun() {
  const kab = daftarKabkota();
  const PEL = J('public/data/peluang.json'), ATL = J('public/data/potensi_atlas.json'), AKS = J('public/data/desa_akses.json'), PP = J('public/data/paket_pemda.json');
  const atl = new Map(ATL.baris.map((b) => [b.kode, b]));
  const aks = new Map(AKS.provinsi.map((b) => [b.kode, b]));

  /* provinsi: nilai mentah lalu norma min-maks antar provinsi */
  const kodeP = PEL.baris.map((b) => b.kode);
  const mentahP = PEL.baris.map((b) => {
    const celah = {}; let jum = null;
    for (const k of TEK) {
      const pot = b.potensi[DK(k)]?.mw ?? null, ter = b.terpasang[DK(k)]?.mw ?? null;
      celah[k] = pot !== null && ter !== null ? Math.max(0, pot - ter) : null;
      if (celah[k] !== null) jum = (jum ?? 0) + celah[k];
    }
    celah.semua = TEK.filter((k) => celah[k] !== null).length >= 3 ? jum : null; /* provinsi pemekaran: potensi RUEN ada di provinsi induk; kurang dari 3 teknologi bernilai = tak dijumlah */
    const a = aks.get(b.kode);
    return { kode: b.kode, nama: b.nama, pvout: atl.get(b.kode)?.pvout_kwh_per_kwp_tahun ?? null, celah, bpp: b.bpp?.nilai_rp_kwh ?? null, harga: b.faktor_lokasi?.F ?? null, akses: a ? Math.round((a.persen_non_pln + (100 - a.persen_berlistrik)) * 10) / 10 : null };
  });
  const lg = (x) => (x === null ? null : Math.log1p(x));
  const kol = (f) => minmaks(mentahP.map(f));
  const N = { pvout: kol((p) => p.pvout), bpp: kol((p) => p.bpp), harga: kol((p) => p.harga), akses: kol((p) => p.akses) };
  for (const k of ['semua', ...TEK]) N['celah_' + k] = kol((p) => lg(p.celah[k]));
  const provinsi = {};
  mentahP.forEach((p, i) => {
    provinsi[p.kode] = { nama: p.nama, mentah: { pvout: p.pvout, celah: p.celah, bpp: p.bpp, harga: p.harga, akses: p.akses },
      norma: { pvout: N.pvout[i], bpp: N.bpp[i], harga: N.harga[i], akses: N.akses[i], celah: Object.fromEntries(['semua', ...TEK].map((k) => [k, N['celah_' + k][i]])) } };
  });

  /* bukti tingkat kabupaten: paket_pemda.kabkota dicocokkan dengan nama baku (nama ambigu atau provinsi beda dilewati) */
  const per = new Map();
  for (const k of kab) { if (!per.has(k.kunci)) per.set(k.kunci, []); per.get(k.kunci).push(k); }
  const bukti = new Map();
  for (const e of PP.kabkota) {
    const cand = per.get(kunci(e.nama)) || [];
    const cocok = cand.filter((c) => (e.kode ? c.prov === e.kode : cand.length === 1));
    if (cocok.length !== 1) continue; // ambigu (Bandung kab/kota) atau provinsi tak cocok
    const a = bukti.get(cocok[0].kode) || { proyek_n: 0, proyek_mw: 0, amdal_n: 0, perda_n: 0 };
    a.proyek_n += e.proyek_n; a.proyek_mw += e.proyek_mw; a.amdal_n += e.amdal_n; a.perda_n += e.perda_n;
    bukti.set(cocok[0].kode, a);
  }
  const kb = [...bukti.entries()];
  const nPasar = minmaks(kb.map(([, a]) => lg(a.proyek_mw))), nAmdal = minmaks(kb.map(([, a]) => lg(a.amdal_n))), nPerda = minmaks(kb.map(([, a]) => lg(a.perda_n)));
  const normaKab = new Map(kb.map(([kode, a], i) => [kode, { mentah: a, norma: { pasar: nPasar[i], amdal: nAmdal[i], perda: nPerda[i] } }]));

  const baris = kab.filter((k) => provinsi[k.prov]).map((k) => {
    const nk = normaKab.get(k.kode), pn = provinsi[k.prov].norma;
    const semua = skorTek('semua', pn, nk?.norma).skor;
    const st = Object.fromEntries(TEK.map((t) => [t, skorTek(t, pn, nk?.norma).skor]));
    return { kode: k.kode, nama: k.nama, jenis: k.jenis, prov: k.prov, dasar: nk ? 'provinsi+kabupaten' : 'provinsi', skor: semua, skor_tek: st, ...(nk ? { kab: nk.mentah, kab_norma: nk.norma } : {}) };
  });
  return {
    lapis: 'publik', dibangun_pada: TGL, jumlah: baris.length, tingkat_bukti: 'hipotesis',
    metode: { rumus: 'Skor 0-100 = jumlah (bobot x norma 0-1) komponen yang ADA; komponen tanpa data dikeluarkan dan bobot dihitung ulang; minimal 5 komponen (semua teknologi) atau 4 (satu teknologi). Norma = min-maks antar 38 provinsi (celah, pasar, AMDAL, Perda memakai log(1+x)).', bobot_semua: BOBOT_SEMUA, bobot_tek: BOBOT_TEK, min_komponen: { semua: 5, tek: 4 } },
    sumber: [
      { id: 'daftar', judul: 'Daftar kabupaten/kota Kemendagri (Wilayah-Administratif-Indonesia, regencies.csv), 514 baris; provinsi Papua dipetakan ke 6 provinsi berlaku dari nama', url: SUMBER_DAFTAR, lisensi: 'MIT', tanggal: TGL },
      { id: 'peluang', judul: 'peluang.json: potensi RUEN 2015, terpasang HEESI 2025, BPP Kepmen ESDM 2020, faktor lokasi Perpres 112/2022', url: '/investasi#peluang', tanggal: '2026-11-07' },
      { id: 'atlas', judul: 'Global Solar Atlas 2.0 (PVOUT), satu titik per provinsi', url: 'https://globalsolaratlas.info/', tanggal: '2026-11-08' },
      { id: 'akses', judul: 'Statistik Ketenagalistrikan 2024 (desa non-PLN dan belum berlistrik) dan IDM Kemendes', url: '/data/desa_akses.json', tanggal: '2026-11-08' },
      { id: 'paket', judul: 'paket_pemda.json: MW proyek, dokumen AMDAL, dan Perda yang menyebut kabupaten/kota (hasil pembacaan teks, dicocokkan lewat nama)', url: '/data/paket_pemda.json', tanggal: '2026-11-07' },
    ],
    celah: [
      'Peta koroplet per kabupaten tidak tersedia: tidak ada geometri atau koordinat kabupaten di repo (public/geo hanya provinsi, transmisi, gardu). Peta menampilkan provinsi (rata-rata skor kabupatennya) dan tabel menampilkan 514 kabupaten/kota.',
      'Kecepatan angin dan jaringan/gardu per kabupaten tidak masuk skor: tidak ada raster angin dan tidak ada titik gardu yang bisa dipetakan ke kabupaten tanpa poligon.',
      'Komponen sumber daya, BPP, harga patokan, dan akses desa bernilai sama untuk semua kabupaten dalam satu provinsi (diwarisi); hanya pasar, AMDAL, dan Perda yang membedakan kabupaten, dan hanya untuk kabupaten yang namanya cocok di paket_pemda.json.',
      'Potensi RUEN bertahun 2015; BPP terbaru yang ada di berkas adalah BPP 2020.',
    ],
    provinsi, baris,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd] = process.argv;
  if (cmd === 'ambil') await ambilSemua();
  else if (cmd === 'bangun') { const d = bangun(); fs.writeFileSync(AKAR + 'public/data/radar_kabupaten.json', JSON.stringify(d) + '\n'); console.log(d.jumlah, 'kabupaten/kota;', d.baris.filter((b) => b.dasar !== 'provinsi').length, 'dengan bukti tingkat kabupaten'); }
  else console.log('pakai: ambil | bangun');
}
