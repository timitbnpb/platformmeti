// Bangun public/data/transaksi.json dari seed tangan + instrumen korporat keuangan_hijau + berita. Jalan: node scripts/pipa/transaksi.mjs
import fs from 'node:fs';
import { SEED } from '../panen/transaksi_seed.mjs';
import { logoOrg } from '../../public/inti/logo_org.js';
const baca = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
const NAMA_JENIS = ['ma', 'ipo', 'obligasi', 'pembiayaan', 'pma', 'jv'];

export function bangun({ seed = SEED, kh, berita, organisasi, kurs, hariIni }) {
  const orgAda = new Set(organisasi.map((o) => o.id));
  const baris = [];
  const tambah = (r, s) => {
    const n = r.nilai; let nilai = null;
    if (n) {
      const usd = n.usd ?? (n.mu === 'USD' ? n.jumlah : (n.jumlah * 1000) / kurs), idr = n.idr ?? (n.mu === 'IDR' ? n.jumlah : (n.jumlah * kurs) / 1000);
      nilai = { jumlah: n.jumlah, mu: n.mu, usd_juta: +usd.toFixed(2), idr_miliar: +idr.toFixed(1), batas: n.batas || null };
      // est: salah satu sisi hasil kurs hari ini, bukan angka sumber
      nilai.est_usd = n.mu !== 'USD' && n.usd == null; nilai.est_idr = n.mu !== 'IDR' && n.idr == null; nilai.est = nilai.est_usd || nilai.est_idr;
    }
    const pihak = r.pihak.map(([peran, nama, org_id, negara, g]) => {
      const id = org_id && orgAda.has(org_id) ? org_id : null, logo = id ? logoOrg(id, nama).find((u) => fs.existsSync(new URL('../../public' + u, import.meta.url))) || null : null;
      const o = id && organisasi.find((x) => x.id === id), singkat = o && nama.length > 22 ? (o.nama_lain || []).find((a) => a.length <= 10) || null : null;
      return { peran, nama, singkat, org_id: id, negara, logo, generik: !!g };
    });
    const tanggal = r.tanggal, presisi = tanggal.length === 10 ? 'hari' : tanggal.length === 7 ? 'bulan' : 'tahun';
    baris.push({ id: r.id, tanggal, presisi, tahun: +tanggal.slice(0, 4), jenis: r.jenis, nilai, pihak, aset: r.aset, proyek_id: r.proyek || [], teknologi: r.tek || null, mw: r.mw ?? null, status: r.status, tingkat_bukti: r.bukti, sumber: s, catatan: r.catatan || '', tanggal_ambil: hariIni });
  };
  for (let r of seed) {
    let s = r.sumber;
    if (r.berita) { const b = berita.find((x) => x.judul.includes(r.berita)); if (!b) throw new Error('berita tak ditemukan: ' + r.berita); s = { judul: b.judul, penerbit: b.media, url: b.url }; r = { ...r, tanggal: b.terbit.slice(0, 10) }; }
    tambah(r, s);
  }
  // instrumen korporat dari keuangan_hijau (pemerintah dan agregat dikecualikan: bukan korporat / bukan satu transaksi)
  for (const x of kh.instrumen_hijau) {
    if (x.pemerintah || !/arkora/i.test(x.penerbit)) continue;
    const org = organisasi.find((o) => o.nama === x.penerbit);
    tambah({ id: 'kh-' + x.penerbit.toLowerCase().replace(/[^a-z]+/g, '-') + '-' + x.tahun, tanggal: String(x.tahun), jenis: 'obligasi', nilai: x.nilai ? { jumlah: x.nilai, mu: x.satuan.startsWith('IDR') ? 'IDR' : 'USD' } : null, tek: 'hidro', status: 'selesai', bukti: x.tingkat_bukti,
      pihak: [['penerbit', x.penerbit, org?.id || null, 'id']], aset: x.instrumen + (x.penggunaan_dana ? '; ' + x.penggunaan_dana : ''), catatan: 'Nilai penerbitan tidak dimuat di sumber.' },
      { judul: x.instrumen, penerbit: 'Antara', url: x.sumber_url });
  }
  baris.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.id.localeCompare(b.id));
  const ids = new Set(); for (const b of baris) { if (ids.has(b.id)) throw new Error('id ganda ' + b.id); ids.add(b.id); if (!NAMA_JENIS.includes(b.jenis)) throw new Error('jenis ' + b.jenis); }
  return { lapis: 'transaksi', dibangun_pada: hariIni, kurs: { usd_idr: kurs }, jumlah: baris.length, baris };
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const kh = baca('../../public/data/keuangan_hijau.json'), pd = baca('../../public/data/pendanaan.json');
  const out = bangun({ kh, berita: baca('../../public/data/berita.json').baris, organisasi: baca('../../public/data/organisasi.json').baris, kurs: pd.kurs.usd_idr, hariIni: new Date().toISOString().slice(0, 10) });
  fs.writeFileSync(new URL('../../public/data/transaksi.json', import.meta.url), JSON.stringify(out) + '\n');
  console.log('transaksi:', out.jumlah);
}
