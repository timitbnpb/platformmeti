// Riwayat perubahan dan kesegaran data (PLAN-UTAMA G1).
// Tiap hari: potret ringkas tiap dataset utama (hash per baris + medan terpantau, bukan salinan penuh) ke
// data/riwayat/<tanggal>/<dataset>.json.gz, dibandingkan dengan potret sebelumnya, lalu menulis
//   public/data/riwayat/perubahan_terbaru.json  (30 hari, dibatasi ukuran)
//   public/data/riwayat/entitas/<dataset>.json   (indeks per id)
//   public/data/kesegaran.json                   (umur + ambang segar/basi per dataset)
// Jalankan SESUDAH semua skrip yang menulis public/data (paling akhir, sesudah konsistensi.mjs).
//   node scripts/pipa/riwayat.mjs                 potret hari ini + keluaran
//   node scripts/pipa/riwayat.mjs --awal-git      isi dulu titik sejarah dari git log berkas data
//   opsi: --tanggal YYYY-MM-DD  --hari N (jendela git, bawaan 30; commit terakhir tiap hari)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(AKAR, 'public', 'data');
const RIWAYAT = join(AKAR, 'data', 'riwayat');
const KELUAR = join(DATA, 'riwayat');

const s = (v) => {
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.map(s).filter(Boolean).join(', ');
  if (typeof v === 'object') return s(v.nilai ?? v.label ?? v.nama ?? v.id ?? '');
  return String(v);
};
const pertama = (a) => (Array.isArray(a) ? a[0] : a);
const hitungAda = (a) => (Array.isArray(a) && a.length ? String(a.length) : '');

/* Dataset utama: lokasi baris, nama, dan medan terpantau [kode, fungsi(baris) -> teks]. Nilai kosong = tidak ada. */
export const DATASET = {
  organisasi: {
    baris: (d) => d.baris, nama: (r) => r.nama,
    medan: { nama: (r) => r.nama, kategori: (r) => r.kategori?.label, provinsi: (r) => r.lokasi?.provinsi, kota: (r) => r.lokasi?.kota, logo: (r) => r.logo, situs: (r) => r.situs, tahun_berdiri: (r) => r.tahun_berdiri, kode_saham: (r) => r.kode_saham, proyek: (r) => hitungAda(r.proyek_ids), pengurus: (r) => hitungAda(r.pengurus), kepakaran: (r) => s(r.kepakaran), induk: (r) => s(r.induk) },
  },
  orang: {
    baris: (d) => d.baris, nama: (r) => r.nama,
    medan: { nama: (r) => r.nama, jabatan: (r) => r.jabatan_terkini, organisasi: (r) => r.organisasi_terkini, foto: (r) => r.foto, wilayah: (r) => r.wilayah?.label, status: (r) => s(r.status) },
  },
  proyek: {
    baris: (d) => d.baris, nama: (r) => r.nama,
    medan: { nama: (r) => r.nama, teknologi: (r) => r.teknologi, status: (r) => s(pertama(r.status)), kapasitas: (r) => { const k = pertama(r.kapasitas); return k && k.nilai != null ? `${k.nilai} ${k.satuan || ''}`.trim() : ''; }, provinsi: (r) => r.lokasi?.provinsi, pemilik: (r) => (r.pihak?.pemilik || []).map((x) => x.nilai).filter(Boolean).slice(0, 3).join('; '), cod_target: (r) => s(r.cod_target), cod_aktual: (r) => s(r.cod_aktual), bukti: (r) => r.tingkat_bukti },
  },
  regulasi: {
    baris: (d) => d.baris, nama: (r) => r.judul,
    medan: { judul: (r) => r.judul, status: (r) => r.status, tanggal: (r) => r.tanggal_ditetapkan, pdf: (r) => r.url_pdf, penerbit: (r) => r.instansi_penerbit },
  },
  pendanaan: {
    baris: (d) => d.pendanaan, nama: (r) => r.nama,
    medan: { nama: (r) => r.nama, status: (r) => r.status, jenis: (r) => r.jenis, pemberi: (r) => r.pemberi, nilai_usd: (r) => r.nilai_usd, tahun: (r) => r.tahun, selesai: (r) => r.selesai },
  },
  berita: {
    baris: (d) => d.baris, nama: (r) => r.judul,
    medan: { judul: (r) => r.judul, media: (r) => r.media },
  },
  inovasi: {
    baris: (d) => d.inovasi, nama: (r) => r.nama,
    medan: { nama: (r) => r.nama, status: (r) => r.status, trl: (r) => r.trl, tahun: (r) => r.tahun },
  },
  program: {
    baris: (d) => d.baris, nama: (r) => r.nama,
    medan: { nama: (r) => r.nama, jumlah_proyek: (r) => r.jumlah_proyek, kapasitas_mw: (r) => r.kapasitas_mw },
  },
};
export const NAMA_DATASET = Object.keys(DATASET);

/* Bobot kepentingan (0-100) untuk pita "yang berubah" dan urutan linimasa. */
const W_TAMBAH = { proyek: 90, regulasi: 88, organisasi: 85, pendanaan: 80, inovasi: 70, orang: 60, program: 60, berita: 20 };
const W_MEDAN = { status: 95, kapasitas: 92, cod_aktual: 78, jabatan: 85, organisasi: 84, pemilik: 75, pengurus: 72, nilai_usd: 70, cod_target: 70, selesai: 68, tanggal: 60, provinsi: 60, pdf: 58, logo: 55, foto: 50, lain: 10 };
export const bobot = (ds, j, m, lama = 'x', baru = 'x') => (j === 'tambah' ? W_TAMBAH[ds] ?? 50 : j === 'hapus' ? (W_TAMBAH[ds] ?? 50) - 10 : Math.min(W_MEDAN[m] ?? 45, lama && baru ? 100 : 55)); // medan baru terisi/dikosongkan lebih ringan dari nilai yang berganti

/* ---------- potret ---------- */

function stabil(v) {
  if (Array.isArray(v)) return v.map(stabil);
  if (v && typeof v === 'object') {
    const adaUrl = typeof v.url === 'string';
    const o = {};
    for (const k of Object.keys(v).sort()) {
      if (k === 'diperiksa' || k === 'tanggal_ambil' || k === 'tanggal_periksa' || (k === 'tanggal' && adaUrl)) continue; // volatil: bukan perubahan isi
      o[k] = stabil(v[k]);
    }
    return o;
  }
  return v;
}
const hash = (v, n = 10) => createHash('sha1').update(JSON.stringify(stabil(v))).digest('hex').slice(0, n);

const urlOk = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u) ? u : '');
/** Sumber paling relevan sebuah baris: url sumber eksplisit, lalu sumber terakhir, lalu url baris. */
export function sumberDari(r) {
  const sm = Array.isArray(r.sumber) ? r.sumber : [];
  return urlOk(r.sumber_url) || urlOk(r.url_sumber) || urlOk(sm[sm.length - 1]?.url) || urlOk(sm[0]?.url) || urlOk(typeof r.sumber === 'string' ? r.sumber : '') || urlOk(r.url) || '';
}
const potong = (t, n = 140) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

/** doc = isi berkas dataset. Hasil: {v,dataset,dibangun,n,baris:{id:{n,h,f,u}}}; f hanya medan yang terisi. */
export function potret(dataset, doc, tanggal = '') {
  const def = DATASET[dataset];
  const rows = def.baris(doc) || [];
  const baris = {};
  for (const r of [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
    if (r.id == null) continue;
    const f = {};
    for (const [k, fn] of Object.entries(def.medan)) { const v = potong(s(fn(r))); if (v) f[k] = v; }
    const e = { n: potong(String(def.nama(r) ?? ''), 160), h: hash(r), f };
    const u = sumberDari(r); if (u) e.u = u;
    baris[r.id] = e;
  }
  return { v: 1, dataset, tanggal, dibangun: String(doc.dibangun_pada || '').slice(0, 10), n: Object.keys(baris).length, baris };
}

/* ---------- perbandingan ---------- */

/** Perubahan dari potret a (lama) ke b (baru). Urutan keluaran tetap (id, lalu medan); tidak bergantung urutan baris. */
export function bandingkan(a, b) {
  const hasil = [];
  const ids = [...new Set([...Object.keys(a.baris), ...Object.keys(b.baris)])].sort();
  for (const id of ids) {
    const x = a.baris[id], y = b.baris[id];
    if (!x) { hasil.push({ id, n: y.n, j: 'tambah', u: y.u || '' }); continue; }
    if (!y) { hasil.push({ id, n: x.n, j: 'hapus', u: x.u || '' }); continue; }
    if (x.h === y.h) continue;
    const kode = [...new Set([...Object.keys(x.f), ...Object.keys(y.f)])].sort();
    let ada = false;
    for (const m of kode) {
      if ((x.f[m] || '') === (y.f[m] || '')) continue;
      ada = true;
      hasil.push({ id, n: y.n, j: 'ubah', m, a: x.f[m] || '', b: y.f[m] || '', u: y.u || '' });
    }
    if (!ada) hasil.push({ id, n: y.n, j: 'ubah', m: 'lain', a: '', b: '', u: y.u || '' });
  }
  return hasil;
}

/* ---------- berkas potret ---------- */

const tulisGz = (jalur, obj) => { mkdirSync(dirname(jalur), { recursive: true }); writeFileSync(jalur, gzipSync(JSON.stringify(obj), { level: 9 })); };

/** Rantai potret satu dataset, tertua dulu: [{nama, tgl, snap}]. */
export function muatRantai(dataset, akar = RIWAYAT) {
  if (!existsSync(akar)) return [];
  return readdirSync(akar, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name) && existsSync(join(akar, d.name, dataset + '.json.gz')))
    .map((d) => d.name).sort()
    .map((nama) => ({ nama, tgl: nama.slice(0, 10), snap: JSON.parse(gunzipSync(readFileSync(join(akar, nama, dataset + '.json.gz'))).toString()) }));
}

/** Semua perubahan sepanjang rantai: [{t,d,id,n,j,m?,a?,b?,u,w}] (t = tanggal potret yang lebih baru). */
export function perubahanRantai(dataset, rantai) {
  const semua = [];
  for (let i = 1; i < rantai.length; i++) {
    for (const c of bandingkan(rantai[i - 1].snap, rantai[i].snap)) semua.push({ t: rantai[i].tgl, d: dataset, ...c, w: bobot(dataset, c.j, c.m, c.a, c.b) });
  }
  return semua;
}

/* ---------- sejarah dari git ---------- */

const git = (...args) => execFileSync('git', args, { cwd: AKAR, maxBuffer: 512 * 1024 * 1024 });
/** Commit terakhir tiap hari (sebelum hari ini) yang mengubah berkas dataset; hari ini diambil dari berkasnya langsung. */
function titikGit(dataset, hari, tanggal) {
  const jalur = `public/data/${dataset}.json`;
  const sejak = new Date(Date.parse(tanggal) - hari * 86400000).toISOString().slice(0, 10);
  const log = git('log', `--since=${sejak}`, '--format=%H\t%cI', '--', jalur).toString().trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
  const perHari = new Map();
  for (const [sha, iso] of log) if (iso.slice(0, 10) < tanggal && !perHari.has(iso.slice(0, 10))) perHari.set(iso.slice(0, 10), sha); // log terbaru dulu
  return [...perHari].sort().map(([tgl, sha]) => [sha, tgl]);
}
function awalDariGit(hari, tanggal) {
  let ditulis = 0;
  for (const ds of NAMA_DATASET) {
    for (const [sha, tgl] of titikGit(ds, hari, tanggal)) {
      const jalur = join(RIWAYAT, tgl, ds + '.json.gz');
      if (existsSync(jalur)) continue;
      let ps;
      try { ps = potret(ds, JSON.parse(git('show', `${sha}:public/data/${ds}.json`).toString()), tgl); } catch { continue; }
      if (!ps.n) continue;
      tulisGz(jalur, ps); ditulis++;
    }
  }
  return ditulis;
}

/* ---------- kesegaran ---------- */

/* [kunci berkas, segar (hari), basi (hari)]. Di luar daftar utama hanya dimasukkan bila berkas punya dibangun_pada. */
const AMBANG = {
  organisasi: [14, 45], orang: [30, 90], proyek: [14, 45], regulasi: [30, 90], pendanaan: [14, 45], berita: [3, 10], inovasi: [30, 90], program: [30, 90],
  pendanaan_internasional: [30, 90], kalender: [7, 21], karbon: [30, 90], keuangan: [30, 90], kelistrikan: [30, 90], kebijakan_info: [30, 90],
  hibah_riset: [30, 90], ember_bulanan: [45, 90], berita_foto: [3, 10], insentif: [30, 90], kapasitas_tren: [30, 90], konsistensi: [7, 21],
};
const domainDari = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const selisihHari = (dari, ke) => Math.round((Date.parse(ke) - Date.parse(dari)) / 86400000);

export function susunKesegaran(tanggal, baca = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'))) {
  const dataset = [];
  for (const [kunci, [segar, basi]] of Object.entries(AMBANG)) {
    let d;
    try { d = baca(kunci + '.json'); } catch { continue; }
    const dibangun = String(d?.dibangun_pada || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dibangun)) continue;
    const rows = DATASET[kunci] ? DATASET[kunci].baris(d) || [] : Array.isArray(d.baris) ? d.baris : [];
    const n = rows.length || (typeof d.jumlah === 'number' ? d.jumlah : 0);
    const dom = new Map();
    for (const r of rows) { const h = domainDari(sumberDari(r)); if (h) dom.set(h, (dom.get(h) || 0) + 1); }
    const umur = Math.max(0, selisihHari(dibangun, tanggal));
    dataset.push({ kunci, dibangun, umur, baris: n, sumber: [...dom].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4).map(([h, c]) => ({ domain: h, baris: c })), segar, basi, status: umur <= segar ? 'segar' : umur <= basi ? 'perlu' : 'basi', utama: !!DATASET[kunci] });
  }
  const ringkas = { segar: 0, perlu: 0, basi: 0 };
  for (const x of dataset) ringkas[x.status]++;
  return { lapis: 'kesegaran', dibangun_pada: tanggal, jumlah: dataset.length, ringkas, dataset };
}

/* ---------- keluaran ---------- */

const BATAS_BYTE = 220 * 1024;
export function susunKeluaran(rantaiPerDs, tanggal, hari = 30) {
  const sejak = new Date(Date.parse(tanggal) - hari * 86400000).toISOString().slice(0, 10);
  const semua = [];
  const awal = {};
  for (const [ds, rantai] of Object.entries(rantaiPerDs)) {
    if (rantai.length) awal[ds] = rantai[0].tgl;
    semua.push(...perubahanRantai(ds, rantai));
  }
  const urut = (a, b) => b.t.localeCompare(a.t) || b.w - a.w || a.d.localeCompare(b.d) || a.id.localeCompare(b.id) || (a.m || '').localeCompare(b.m || '');
  semua.sort(urut);
  const terbaru = semua.filter((c) => c.t >= sejak);
  const per = {}, jenis = {};
  for (const c of terbaru) { per[c.d] = (per[c.d] || 0) + 1; const x = (jenis[c.d] ||= { tambah: 0, hapus: 0, ubah: 0 }); if (c.m !== 'lain') x[c.j]++; }
  // batasi: berita paling banyak 40, perubahan "lain" 120, total 700; lalu kecilkan sampai muat ukuran
  const kuota = { berita: 40 }; let lain = 0;
  let pilih = terbaru.filter((c) => { if (c.d in kuota) { if (kuota[c.d]-- <= 0) return false; } if (c.m === 'lain') { if (lain++ >= 120) return false; } return true; }).slice(0, 700);
  const bungkus = (p) => ({ lapis: 'riwayat', dibangun_pada: tanggal, hari, awal: Object.values(awal).sort()[0] || tanggal, jumlah_total: terbaru.length, jumlah_per: per, jumlah_jenis: jenis, perubahan: p });
  while (pilih.length > 20 && JSON.stringify(bungkus(pilih)).length > BATAS_BYTE) pilih = pilih.slice(0, Math.floor(pilih.length * 0.85));
  const entitas = {};
  for (const c of semua) {
    if (c.d === 'berita') continue;
    const ds = (entitas[c.d] ||= {});
    const arr = (ds[c.id] ||= []);
    if (arr.length < 30) arr.push([c.t, c.j, c.m || '', c.a || '', c.b || '', c.u || '']);
  }
  return { terbaru: bungkus(pilih), entitas, awal };
}

// B-11: peristiwa yang merujuk gambar /img/ yang berkasnya tidak ada dibuang dari indeks entitas.
const gambarAda = (u) => typeof u !== 'string' || !u.startsWith('/img/') || existsSync(join(AKAR, 'public', u));
const bersihGambar = (e) => Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.filter((x) => x.every(gambarAda))]).filter(([, v]) => v.length));
function tulisJson(jalur, obj) { mkdirSync(dirname(jalur), { recursive: true }); writeFileSync(jalur, JSON.stringify(obj) + '\n'); }

export function jalankan({ tanggal, awalGit = false, hari = 30 }) {
  const log = [];
  if (awalGit) log.push(`titik git: ${awalDariGit(hari, tanggal)} potret baru`);
  for (const ds of NAMA_DATASET) {
    const doc = JSON.parse(readFileSync(join(DATA, ds + '.json'), 'utf8'));
    const ps = potret(ds, doc, tanggal);
    if (!ps.n) throw new Error(`${ds}: nol baris, potret ditolak`);
    tulisGz(join(RIWAYAT, tanggal, ds + '.json.gz'), ps);
  }
  const rantai = Object.fromEntries(NAMA_DATASET.map((ds) => [ds, muatRantai(ds)]));
  const { terbaru, entitas, awal } = susunKeluaran(rantai, tanggal, hari);
  tulisJson(join(KELUAR, 'perubahan_terbaru.json'), terbaru);
  for (const [ds, e] of Object.entries(entitas)) tulisJson(join(KELUAR, 'entitas', ds + '.json'), { lapis: 'riwayat_entitas', jenis: ds, dibangun_pada: tanggal, awal: awal[ds] || tanggal, entitas: bersihGambar(e) });
  const kes = susunKesegaran(tanggal);
  tulisJson(join(DATA, 'kesegaran.json'), kes);
  log.push(`perubahan 30 hari: ${terbaru.jumlah_total} (dimuat ${terbaru.perubahan.length}); kesegaran: ${JSON.stringify(kes.ringkas)}`);
  return log;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2);
  const nilai = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
  const tanggal = nilai('--tanggal', new Date().toLocaleDateString('sv-SE'));
  for (const l of jalankan({ tanggal, awalGit: a.includes('--awal-git'), hari: Number(nilai('--hari', 30)) })) console.log(l);
}
