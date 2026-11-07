// Pemeriksa konsistensi lintas data. Hanya membaca public/data dan public/img;
// menulis public/data/konsistensi.json (dibaca Admin nanti).
// Gagal (gerbang): tautan id mati + selisih hitungan ringkas. Sisanya peringatan.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(AKAR, 'public', 'data');

const baca = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const daftar = (d) => d.baris ?? d.pendanaan ?? d.inovasi ?? [];

// Muat semua berkas yang dipakai pemeriksa. Dipisah agar uji bisa menyuntik data jahat.
export function muat() {
  const nama = ['proyek', 'organisasi', 'orang', 'regulasi', 'program', 'berita', 'karbon',
    'karbon_proyek', 'pendanaan', 'inovasi', 'wilayah', 'ringkas', 'video', 'keuangan'];
  const d = {};
  for (const n of nama) d[n] = baca(n + '.json');
  d.topik = {};
  for (const f of readdirSync(join(DATA, 'topik'))) {
    if (f.endsWith('.json') && !f.startsWith('dasar-') && f !== 'indeks.json') d.topik[f.slice(0, -5)] = baca('topik/' + f);
  }
  return d;
}

// Kumpulkan semua nilai "id" di kedalaman berapa pun (anggota/afiliasi organisasi bersarang).
function semuaId(o, s = new Set()) {
  if (Array.isArray(o)) o.forEach((x) => semuaId(x, s));
  else if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      if (k === 'id' && typeof v === 'string') s.add(v);
      else semuaId(v, s);
    }
  }
  return s;
}

// Telusuri pohon; panggil cb(kunci, nilai) untuk tiap properti string/array-string.
function jelajah(o, cb) {
  if (Array.isArray(o)) o.forEach((x) => jelajah(x, cb));
  else if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      cb(k, v);
      jelajah(v, cb);
    }
  }
}

// kunci rujukan -> nama himpunan sasaran
const KUNCI = {
  organisasi_id: 'organisasi', penerima_org_id: 'organisasi', lembaga_id: 'organisasi',
  orang_id: 'orang', proyek_id: 'proyek', proyek_ids: 'proyek', regulasi_ids: 'regulasi',
  program_ids: 'program', karbon_ids: 'karbon', berita_ids: 'berita',
};
// sumber rujukan (berkas pemegang tautan)
const SUMBER = ['proyek', 'organisasi', 'orang', 'regulasi', 'program', 'pendanaan', 'inovasi', 'karbon_proyek'];

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

export function periksa(d, adaBerkas = (p) => existsSync(join(AKAR, 'public', p))) {
  const gagal = { tautan_mati: [], selisih_ringkas: [] };
  const peringatan = { angka_bertentangan: [], duplikat: [], beda_definisi: [] };

  const himpunan = {
    proyek: new Set(daftar(d.proyek).map((x) => x.id)),
    organisasi: semuaId(d.organisasi),
    orang: new Set(daftar(d.orang).map((x) => x.id)),
    regulasi: new Set(daftar(d.regulasi).map((x) => x.id)),
    program: new Set(daftar(d.program).map((x) => x.id)),
    karbon: new Set(daftar(d.karbon).map((x) => x.id)),
    berita: new Set(daftar(d.berita).map((x) => x.id)),
  };

  // 1a. id mati, per sumber
  const mati = {};
  const catat = (sumber, kunci, id, sasaran) => {
    (mati[sumber] ??= []).push(`${kunci}=${id} (tidak ada di ${sasaran})`);
  };
  for (const s of SUMBER) {
    jelajah(daftar(d[s]), (k, v) => {
      const sasaran = KUNCI[k];
      if (!sasaran) return;
      for (const id of Array.isArray(v) ? v : [v]) {
        if (typeof id === 'string' && id && !himpunan[sasaran].has(id)) catat(s, k, id, sasaran);
      }
    });
  }

  // 1b. provinsi proyek harus ada di wilayah.json; berkas gambar kode BPS harus ada
  const provinsi = new Set(daftar(d.wilayah).map((w) => norm(w.nama)));
  for (const p of daftar(d.proyek)) {
    const n = p.lokasi?.provinsi;
    if (n && !provinsi.has(norm(n))) catat('proyek', 'lokasi.provinsi', `${p.id}:${n}`, 'wilayah');
  }
  for (const w of daftar(d.wilayah)) {
    if (!adaBerkas(`img/provinsi/${w.kode}.png`)) catat('wilayah', 'kode', `${w.kode} ${w.nama}`, 'img/provinsi');
  }

  // 1c. iso2 -> /img/bendera/<iso2>.svg ; logo/foto berkas lokal
  const cekBerkas = (sumber, kunci, p) => {
    if (typeof p === 'string' && p.startsWith('/img/') && !adaBerkas(p.slice(1))) catat(sumber, kunci, p, 'berkas');
  };
  const cekIso = (sumber, v) => {
    if (typeof v === 'string' && /^[A-Za-z]{2}$/.test(v) && !adaBerkas(`img/bendera/${v.toLowerCase()}.svg`)) {
      catat(sumber, 'iso2', v, 'img/bendera');
    }
  };
  for (const s of SUMBER) {
    jelajah(daftar(d[s]), (k, v) => {
      if (k === 'iso2' || k === 'negara') cekIso(s, v);
      if (k === 'logo' || k === 'foto' || k === 'foto_url') cekBerkas(s, k, v);
    });
  }
  for (const n of d.pendanaan.negara ?? []) cekIso('pendanaan.negara', n.iso2);

  for (const [s, arr] of Object.entries(mati)) {
    gagal.tautan_mati.push({ sumber: s, jumlah: arr.length, contoh: arr.slice(0, 5) });
  }

  // 2a. hitungan ringkas harus nol selisih
  const panjang = {
    proyek: daftar(d.proyek).length, organisasi: daftar(d.organisasi).length,
    orang: daftar(d.orang).length, regulasi: daftar(d.regulasi).length,
    program: daftar(d.program).length, berita: daftar(d.berita).length,
    video: daftar(d.video).length, keuangan: daftar(d.keuangan).length, karbon: daftar(d.karbon).length,
  };
  for (const [k, n] of Object.entries(panjang)) {
    const r = d.ringkas.hitung?.[k];
    if (r !== n) gagal.selisih_ringkas.push({ kunci: k, ringkas: r, berkas: n, selisih: (r ?? 0) - n });
  }

  // 2b. MW total: beda definisi ditandai, bukan gagal
  const mw = (p) => {
    const k = (p.kapasitas ?? []).find((x) => x.satuan === 'MW' || x.satuan === 'MWp');
    return k ? Number(k.nilai) || 0 : 0;
  };
  const jumlahMw = daftar(d.proyek).reduce((a, p) => a + mw(p), 0);
  const kartu = (d.ringkas.kartu ?? []).find((x) => x.kode === 'kapasitas');
  if (kartu && Math.round(jumlahMw) !== Math.round(kartu.nilai)) {
    peringatan.beda_definisi.push({
      hal: 'MW total ringkas vs jumlah kapasitas proyek.json (nilai pertama bersatuan MW/MWp)',
      ringkas: kartu.nilai, dihitung: Math.round(jumlahMw), catatan_kartu: kartu.catatan,
    });
  }

  // 2c. angka kunci topik "kapasitas ... terpasang" vs jumlah proyek beroperasi teknologi sama
  const tekn = { surya: 'surya', bayu: 'bayu', hidro: 'hidro', panas_bumi: 'panas-bumi' };
  for (const [t, tk] of Object.entries(tekn)) {
    const kunci = (d.topik[t]?.kunci ?? []).find((x) => /kapasitas/i.test(x.label?.id ?? '') && /terpasang/i.test(x.label?.id ?? ''));
    if (!kunci || kunci.satuan?.id !== 'MW') continue;
    const dalam = daftar(d.proyek)
      .filter((p) => p.teknologi === tk && (p.status ?? []).some((s) => s.nilai === 'beroperasi'))
      .reduce((a, p) => a + mw(p), 0);
    const rasio = dalam / kunci.nilai;
    if (rasio < 0.8 || rasio > 1.2) {
      peringatan.angka_bertentangan.push({
        topik: t, label: kunci.label.id, nilai_topik_mw: kunci.nilai,
        proyek_beroperasi_mw: Math.round(dalam), rasio: Number(rasio.toFixed(2)),
        catatan: 'proyek.json tidak lengkap atau beda definisi (terpasang nasional vs proyek terlacak)',
      });
    }
  }

  // 3. duplikat
  const peta = (arr, f) => {
    const m = new Map();
    for (const x of arr) { const k = f(x); (m.get(k) ?? m.set(k, []).get(k)).push(x.id); }
    return [...m].filter(([, v]) => v.length > 1);
  };
  for (const [k, ids] of peta(daftar(d.proyek), (p) => [norm(p.nama), p.teknologi, mw(p), norm(p.lokasi?.provinsi)].join('|'))) {
    peringatan.duplikat.push({ jenis: 'proyek', kunci: k, ids });
  }
  for (const [k, ids] of peta(daftar(d.organisasi), (o) => norm(o.nama))) {
    peringatan.duplikat.push({ jenis: 'organisasi', kunci: k, ids });
  }

  return { gagal, peringatan, hitung: panjang };
}

export function ringkasLaporan(h) {
  return {
    tautan_mati: h.gagal.tautan_mati.reduce((a, x) => a + x.jumlah, 0),
    selisih_ringkas: h.gagal.selisih_ringkas.length,
    angka_bertentangan: h.peringatan.angka_bertentangan.length,
    beda_definisi: h.peringatan.beda_definisi.length,
    duplikat: h.peringatan.duplikat.length,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const h = periksa(muat());
  const out = { lapis: 'admin', dibangun_pada: new Date().toISOString().slice(0, 10), jumlah: ringkasLaporan(h), ...h };
  writeFileSync(join(DATA, 'konsistensi.json'), JSON.stringify(out) + '\n');
  console.log(JSON.stringify(out.jumlah));
}
