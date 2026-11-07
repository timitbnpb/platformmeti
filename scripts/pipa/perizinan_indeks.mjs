// Indeks kemudahan perizinan per provinsi (Hipotesis): komponen dari data repo; komponen tanpa data dikeluarkan dari skor.
// Pakai: node scripts/pipa/perizinan_indeks.mjs  -> public/data/perizinan_provinsi.json
import fs from 'node:fs';
import path from 'node:path';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const baca = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', f), 'utf-8'));
const norma = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');
const wilayah = baca('wilayah.json').baris;
const kodeNama = new Map(wilayah.map((w) => [norma(w.nama), w.kode]));
const ALIAS = { diyogyakarta: '34', daerahistimewayogyakarta: '34', daerahkhususibukotajakarta: '31', banggkabelitung: '19', bangkabelitung: '19' };
const kode = (s) => kodeNama.get(norma(s)) || ALIAS[norma(s)] || null;

export const BOBOT = { rued: 30, perda: 25, wkp: 20, berita: 15, oss: 10 };
const rued = baca('rued.json').baris, regulasi = baca('regulasi.json').baris, wkp = baca('wkp.json').baris, berita = baca('berita.json').baris;
const idRued = new Set(rued.map((r) => r.perda_id));
const EBT = new Set(['perencanaan', 'perizinan', 'karbon', 'penyimpanan', 'surya', 'bioenergi', 'insentif', 'hidro', 'panas_bumi', 'efisiensi', 'energi_baru_umum', 'harga']);
const perdaProv = new Map();
for (const r of regulasi) {
  if (r.jenis !== 'perda' || idRued.has(r.id) || !/^Pemerintah Provinsi /.test(r.instansi_penerbit || '')) continue;
  if (!(r.topik || []).some((t) => EBT.has(t))) continue;
  const k = kode(r.instansi_penerbit.replace('Pemerintah Provinsi ', ''));
  if (k) (perdaProv.get(k) || perdaProv.set(k, []).get(k)).push({ id: r.id, judul: r.judul, tahun: r.tahun, url: r.url_sumber, pdf: r.url_pdf });
}
const maksPerda = Math.max(1, ...[...perdaProv.values()].map((v) => v.length));
// kendala izin dari berita: judul memuat kata izin DAN nama provinsi (atau singkatan ESDM Jateng dst.)
const SINGK = { jateng: '33', jabar: '32', jatim: '35', sumut: '12', sumbar: '13', sumsel: '16', kalbar: '61', kaltim: '64', kalsel: '63', kalteng: '62', sulsel: '73', sulut: '71', sulteng: '72', ntb: '52', ntt: '53', diy: '34' };
const kata = /\b(izin|perizinan|amdal|pbg|rekomendasi)\b/i;
const beritaProv = new Map();
for (const b of berita) {
  if (!kata.test(b.judul || '')) continue;
  const tj = norma(b.judul), ks = new Set();
  for (const w of wilayah) if (tj.includes(norma(w.nama))) ks.add(w.kode);
  for (const [s, k] of Object.entries(SINGK)) if (new RegExp('\\b' + s + '\\b', 'i').test(b.judul)) ks.add(k);
  for (const k of ks) (beritaProv.get(k) || beritaProv.set(k, []).get(k)).push({ judul: b.judul, media: b.media, terbit: (b.terbit || '').slice(0, 10), url: b.url });
}
const wkpProv = new Map();
for (const w of wkp) { const k = kode(w.provinsi || ''); if (k) (wkpProv.get(k) || wkpProv.set(k, []).get(k)).push({ nama: w.nama, jenis: w.jenis, status: w.status }); }

const baris = wilayah.map((w) => {
  const rr = rued.find((r) => kode(r.provinsi) === w.kode);
  const pd = perdaProv.get(w.kode) || [], ber = beritaProv.get(w.kode) || [], wk = wkpProv.get(w.kode) || [];
  const komp = {
    rued: { skor: rr ? (rr.target != null ? 100 : 60) : 0, nilai: rr ? { perda: rr.perda, tahun: Number(String(rr.perda).split('/')[1]) || null, target_angka: rr.target != null, url: rr.sumber_url, pdf: rr.url_pdf } : null, catatan: rr ? null : 'tidak tercatat di repo' },
    perda: { skor: Math.round((Math.min(pd.length, maksPerda) / maksPerda) * 100), nilai: { n: pd.length, daftar: pd } },
    wkp: wk.length ? { skor: wk.some((x) => x.status === 'lelang') ? 100 : wk.some((x) => ['produksi', 'pengembangan'].includes(x.status)) ? 80 : 50, nilai: { n: wk.length, daftar: wk } } : { skor: null, nilai: null, catatan: 'tidak ada WKP tercatat' },
    berita: ber.length ? { skor: Math.max(0, 100 - 40 * ber.length), nilai: { n: ber.length, daftar: ber.slice(0, 3) } } : { skor: null, nilai: null, catatan: 'tidak ada berita kendala izin' },
    oss: { skor: null, nilai: null, catatan: 'tidak ada data publik terpanen' },
  };
  let b = 0, s = 0;
  for (const [k, v] of Object.entries(komp)) if (v.skor != null) { b += BOBOT[k]; s += v.skor * BOBOT[k]; }
  const bukti = !!rr || pd.length > 0 || wk.length > 0 || ber.length > 0;
  return { kode: w.kode, nama: w.nama, skor: b && bukti ? Math.round(s / b) : null, bobot_terpakai: b, komponen: komp };
});
const urut = baris.filter((r) => r.skor != null).sort((a, z) => z.skor - a.skor);
urut.forEach((r, i) => { r.peringkat = i + 1; });
const out = {
  lapis: 'publik', dibangun_pada: new Date().toISOString().slice(0, 10), hipotesis: true, bobot: BOBOT,
  metode: 'Skor 0-100 = rata-rata tertimbang komponen yang punya data; komponen tanpa data dikeluarkan dan bobot dibagi ulang. Hipotesis: bukan ukuran resmi kemudahan berusaha.',
  celah: [
    'Rata-rata lama izin realisasi tidak tersedia sebagai data publik (OSS tidak menerbitkan); hanya 3 pasangan AMDAL-COD di halaman izin dan kontrak, terlalu sedikit: tidak dipakai.',
    'Layanan OSS dan PTSP daerah: belum dipanen, komponen dikeluarkan dari semua provinsi.',
    'RUED dan perda pendukung dihitung dari berkas yang tercatat di repo; provinsi tanpa catatan bukan berarti tidak punya perda.',
    'Berita kendala izin: pencocokan judul dengan kata izin dan nama provinsi, jumlah sedikit.',
  ],
  sumber: [
    { judul: 'JDIH BPK: perda RUED dan perda provinsi', url: 'https://peraturan.bpk.go.id/', penerbit: 'BPK RI' },
    { judul: 'Daftar kurasi WKP dan lelang panas bumi', url: '/data/wkp.json', penerbit: 'METI (kurasi dari berita dan dokumen resmi)' },
  ],
  baris,
};
if (process.argv[1] === new URL(import.meta.url).pathname) {
  fs.writeFileSync(path.join(AKAR, 'public/data/perizinan_provinsi.json'), JSON.stringify(out) + '\n');
  console.log('perizinan:', baris.length, 'provinsi; perda>0:', baris.filter((r) => r.komponen.perda.nilai.n).length, 'wkp:', wkpProv.size, 'berita:', beritaProv.size, 'rued:', baris.filter((r) => r.komponen.rued.nilai).length);
}
