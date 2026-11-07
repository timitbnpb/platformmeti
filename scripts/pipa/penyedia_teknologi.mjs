#!/usr/bin/env node
// Bangun public/data/penyedia_teknologi.json dari organisasi.json + tkdn.json + rantai_plts.json
// (semuanya sudah bersumber). Tanpa jaringan. Pakai: node penyedia_teknologi.mjs [--data=DIR] [--out=FILE]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PERAN = { manufaktur: 'produsen/manufaktur', EPC: 'EPC', konsultan: 'konsultan', pengembang: 'pengembang', operator: 'O&M/operator', pembiaya: 'pembiayaan' };
const TEKNOLOGI = { surya: 'surya', bayu: 'angin', hidro: 'hidro', 'panas-bumi': 'panas bumi', bioenergi: 'biogas/biomassa', 'biomassa-sampah': 'sampah/WtE', elektrifikasi: 'kendaraan listrik', penyimpanan: 'baterai/penyimpanan', hidrogen: 'hidrogen' };
const TKDN_KAT = { modul_surya: 'produsen modul surya', baterai: 'produsen baterai', inverter: 'produsen inverter', turbin: 'produsen turbin', menara: 'produsen menara turbin' };
const AESI_KAT = { Developer: 'pengembang', EPC: 'EPC', Supplier: 'pemasok komponen surya', 'Instalasi PLTS': 'PLTS atap/instalasi', Konsultan: 'konsultan', 'Lembaga Inspeksi Teknik': 'lembaga inspeksi/uji', 'Lembaga Sertifikasi Kompetensi Ketenagalistrikan': 'lembaga sertifikasi', Distributor: 'distributor', BESS: 'BESS/penyimpanan', 'Produsen Solar Cell': 'produsen modul surya', 'Otomasi dan Tenaga Listrik': 'otomasi/kelistrikan', 'Lembaga Keuangan': 'pembiayaan/lembaga keuangan' }; // Perdagangan Komoditi dan Praktisi: bukan penyedia teknologi
// Kebutuhan dan layanan HANYA dari teks sumber (nama, deskripsi, produk); tanpa teks = kosong, bukan tebakan.
const KEBUTUHAN = [[/atap|rooftop/i, 'PLTS atap'], [/rumah tangga|residensial|residential/i, 'rumah tangga'], [/industri|komersial|C&I/i, 'industri/komersial'], [/biogas|digester/i, 'biogas'], [/ternak|peternakan/i, 'peternakan'], [/POME|limbah cair sawit/i, 'limbah sawit (POME)'], [/mikrohidro|micro ?hydro|PLTMH/i, 'mikrohidro'], [/PJU|penerangan jalan/i, 'PJU tenaga surya'], [/SPKLU|pengisian kendaraan|charging/i, 'SPKLU'], [/sampah|waste/i, 'pengolahan sampah'], [/hidrogen|hydrogen/i, 'hidrogen']];
const LAYANAN = [[/mounting|racking/i, 'mounting'], [/pemboran|drilling/i, 'pemboran'], [/digester/i, 'digester'], [/gasifi/i, 'gasifier'], [/boiler/i, 'boiler'], [/SPKLU|charging/i, 'SPKLU'], [/studi kelayakan|feasibility/i, 'studi kelayakan'], [/AMDAL/i, 'AMDAL'], [/laboratorium|uji /i, 'uji lab'], [/sertifikasi/i, 'sertifikasi'], [/leasing|sewa/i, 'leasing']];
const JANGKAUAN = [[/seluruh indonesia|nasional|nationwide/i, 'nasional'], [/ekspor|internasional|global/i, 'internasional']];
const tag = (tabel, teks) => uniq(tabel.filter(([re]) => re.test(teks)).map(([, t]) => t));
const BUKTI = ['resmi', 'situs-sendiri', 'kata-pihak', 'media', 'sedang', 'cuplikan', 'via-pihak-ketiga']; // urut kuat -> lemah
const KONTAK_UMUM = /^(info|sales|contact|cs|hello|halo|admin|marketing|corporate|corcom|media|ir|support|office|sekretariat|humas|customer|enquiry|inquiry|hrd|recruitment|procurement|cso|csr)([._-].*)?$/i;

const uniq = (a) => [...new Set(a)].sort();
export const kuat = (a, b) => (BUKTI.indexOf(a) <= BUKTI.indexOf(b) ? a : b);
export const kontakKantor = (k = {}) => {
  const surel = (k.surel || []).filter((e) => KONTAK_UMUM.test(String(e).split('@')[0]));
  const telepon = (k.telepon || []).slice(0, 3);
  return surel.length || telepon.length ? { ...(surel.length && { surel }), ...(telepon.length && { telepon }) } : null;
};
const kunciNama = (n) => n.toLowerCase().replace(/%[0-9a-f]{2}/g, '').replace(/\s\d$/, '').replace(/\(.*?\)/g, '').replace(/\b(pt|tbk|persero|cv)\b\.?/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// nama logo AESI kadang berawalan merek ("Becis Pt Symbior ..."): ambil mulai dari "Pt"
export const namaAesi = (n) => n.replace(/%[0-9A-Fa-f]{2}/g, '').replace(/^.*?\b(pt)\b/i, '$1').replace(/\s\d$/, '').replace(/\bPt\b/g, 'PT').trim();
const ISO = /\b(ISO ?\d{4,5}|SNI [\d.:-]+)/gi;

export function bangun(org, tkdn, rantai, tanggal, aesi = { baris: [] }, proyek = { baris: [] }) {
  const orgNama = new Map(org.baris.map((o) => [o.id, o.singkatan || o.nama]));
  const proyekNama = new Map(proyek.baris.map((p) => [p.id, p.nama]));
  const am = new Map(); // kunci nama -> {kats, url, nama}
  for (const a of aesi.baris) {
    const k = kunciNama(namaAesi(a.nama));
    const kat = AESI_KAT[a.kategori_aesi];
    if (!kat) continue;
    const e = am.get(k) || am.set(k, { kats: new Set(), url: a.url, nama: namaAesi(a.nama) }).get(k);
    e.kats.add(kat);
  }
  const aesiPakai = new Set();
  const pengaya = (teks) => ({ kebutuhan_dilayani: tag(KEBUTUHAN, teks), layanan_terdeteksi: tag(LAYANAN, teks), jangkauan_layanan: tag(JANGKAUAN, teks), iso_sni_disebut: uniq((teks.match(ISO) || []).map((x) => x.toUpperCase())) });
  const tk = new Map();
  for (const b of tkdn.baris) if (b.produsen_org_id) (tk.get(b.produsen_org_id) || tk.set(b.produsen_org_id, []).get(b.produsen_org_id)).push(b);
  const rp = new Map(rantai.pabrikan.map((p) => [p.id, p]));
  const baris = [];
  const dipakai = new Set();

  for (const o of org.baris) {
    const peran = (o.peran_rantai || []).filter((p) => PERAN[p]);
    const ada = tk.get(o.id);
    const a = am.get(kunciNama(o.nama));
    if (!peran.length && !ada && !rp.has(o.id) && !a && o.kategori?.kode !== 'keuangan') continue;
    if (a) aesiPakai.add(kunciNama(o.nama));
    const kat = new Set(peran.map((p) => PERAN[p]));
    if (o.kategori?.kode === 'keuangan' && o.kepakaran?.some((k) => TEKNOLOGI[k])) kat.add('pembiayaan/lembaga keuangan');
    for (const t of ada || []) kat.add(TKDN_KAT[t.kategori] || 'produsen/manufaktur');
    for (const k of a?.kats || []) kat.add(k);
    const tekno = (o.kepakaran || []).map((k) => TEKNOLOGI[k]).filter(Boolean);
    if (a && !tekno.length) tekno.push('surya'); // anggota asosiasi surya; kepakaran lain belum tercatat
    if (!kat.size || (!tekno.length && !ada)) continue;
    const sert = (o.teknis?.sertifikat_tkdn || []).map((s) => ({ jenis: 'TKDN', produk: s.produk, merek: s.merk, persen: s.tkdn_persen, berlaku_sd: s.berlaku_sd }));
    const p = rp.get(o.id);
    if (p) dipakai.add(o.id);
    const sumber = (o.sumber || []).filter((s) => s.url).map((s) => ({ url: s.url, tingkat_bukti: s.tingkat_bukti, tanggal: s.tanggal }));
        if (!sumber.length) continue; // KP D5: tanpa sumber ditolak
    baris.push({
      id: 'pt_' + o.id, organisasi_id: o.id, nama: o.nama, kandidat_baru: false,
      kategori_layanan: uniq([...kat]), teknologi: uniq(tekno),
      lokasi: o.lokasi ? { kota: o.lokasi.kota ?? null, provinsi: o.lokasi.provinsi ?? null } : null,
      situs: o.situs ?? null, kontak_kantor: kontakKantor(o.kontak),
      produk_merek: uniq((ada || []).map((t) => `${t.produk}${t.merk ? ' / ' + t.merk : ''}`)),
      sertifikasi: { tkdn: sert, tkdn_persen_terbaik: sert.length ? Math.max(...sert.map((s) => s.persen ?? 0)) : (p?.tkdn ?? null), apamsi: o.teknis?.apamsi ?? p?.apamsi ?? null },
      kapasitas_mwp_tahun: o.teknis?.kapasitas_mwp_tahun ?? p?.mwp ?? null,
      proyek_rujukan: (o.proyek_ids || []).filter((i) => proyekNama.has(i)).map((i) => ({ id: i, nama: proyekNama.get(i) })),
      keanggotaan: uniq([...(o.keanggotaan || []).filter((x) => x.jenis === 'anggota_dari').map((x) => orgNama.get(x.organisasi_id)).filter(Boolean), ...(o.sumber || []).filter((x) => /^anggota-/.test(x.id)).map((x) => x.id.slice(8)), ...(a ? ['AESI'] : [])]),
      ...pengaya([o.nama, o.deskripsi, ...(ada || []).map((t) => t.produk)].filter(Boolean).join(' . ')),
      sumber: a ? [...sumber, { url: aesi.url, tingkat_bukti: aesi.tingkat_bukti, tanggal: aesi.diambil, catatan: 'AESI anggota: ' + [...a.kats].join(', ') }] : sumber, tingkat_bukti: (a ? [...sumber, { tingkat_bukti: aesi.tingkat_bukti }] : sumber).map((s) => s.tingkat_bukti).reduce(kuat), tanggal_periksa: o.diperiksa || tanggal,
    });
  }

  const pembanding = rantai.pembanding.map((x) => x.sumber).find((x) => x?.url);
  const sudah = new Set(baris.map((b) => kunciNama(b.nama)));
  const kandidat = (nama, extra) => {
    if (sudah.has(kunciNama(nama))) return;
    sudah.add(kunciNama(nama));
    baris.push({ id: 'kand_' + crypto.createHash('sha1').update(kunciNama(nama)).digest('hex').slice(0, 10), organisasi_id: null, nama, kandidat_baru: true, situs: null, kontak_kantor: null, proyek_rujukan: [], keanggotaan: [], kebutuhan_dilayani: [], layanan_terdeteksi: [], jangkauan_layanan: [], iso_sni_disebut: [], tanggal_periksa: tanggal, ...extra });
  };
  for (const p of rantai.pabrikan) {
    if (dipakai.has(p.id)) continue;
    kandidat(p.nama, {
      kategori_layanan: ['produsen modul surya'], teknologi: ['surya'], lokasi: { kota: p.kota, provinsi: p.provinsi }, produk_merek: [],
      sertifikasi: { tkdn: [], tkdn_persen_terbaik: p.tkdn ?? null, apamsi: p.apamsi }, kapasitas_mwp_tahun: p.mwp ?? null,
      // daftar nama berasal dari dokumen DJEBTKE yang diterima pemilik (tanpa URL); tautan publik = pembanding ANTARA
      sumber: [{ url: pembanding.url, tingkat_bukti: pembanding.tingkat_bukti, tanggal: pembanding.tanggal, catatan: rantai.sumber.judul }],
      tingkat_bukti: pembanding.tingkat_bukti,
    });
  }
  for (const f of rantai.fasilitas_lain) {
    const sumber = (f.sumber || []).filter((s) => s.url).map((s) => ({ url: s.url, tingkat_bukti: s.tingkat_bukti, tanggal: s.tanggal }));
    if (!sumber.length) continue;
    const batre = (f.komponen || []).some((k) => /baterai|katoda/i.test(k));
    kandidat(f.nama.replace(/\s*\(.*$/, '') || f.nama, {
      kategori_layanan: [batre ? 'produsen baterai/komponen' : 'produsen komponen surya'], teknologi: [batre ? 'baterai/penyimpanan' : 'surya'],
      lokasi: { kota: f.lokasi?.kota ?? null, provinsi: f.lokasi?.provinsi ?? null }, produk_merek: uniq([f.merek, ...(f.komponen || [])].filter(Boolean)),
      sertifikasi: { tkdn: [], tkdn_persen_terbaik: f.tkdn ?? null, apamsi: null }, kapasitas_mwp_tahun: f.satuan === 'MWp/tahun' ? f.kapasitas ?? null : null,
      sumber, tingkat_bukti: sumber.map((s) => s.tingkat_bukti).reduce(kuat),
    });
  }
  for (const [k, a] of am) {
    if (aesiPakai.has(k)) continue;
    kandidat(a.nama, {
      kategori_layanan: uniq([...a.kats]), teknologi: [a.kats.has('BESS/penyimpanan') ? 'baterai/penyimpanan' : 'surya'], lokasi: null, produk_merek: [],
      sertifikasi: { tkdn: [], tkdn_persen_terbaik: null, apamsi: null }, kapasitas_mwp_tahun: null,
      keanggotaan: ['AESI'], kebutuhan_dilayani: [], layanan_terdeteksi: [], jangkauan_layanan: [], iso_sni_disebut: [],
      sumber: [{ url: aesi.url, tingkat_bukti: aesi.tingkat_bukti, tanggal: aesi.diambil, catatan: 'AESI anggota: ' + [...a.kats].join(', ') + '; nama dari judul logo' }], tingkat_bukti: aesi.tingkat_bukti,
    });
  }
  baris.sort((a, b) => a.id.localeCompare(b.id));
  return baris;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d;
  const dir = arg('data', path.join(ROOT, 'public/data'));
  const rd = (n) => JSON.parse(fs.readFileSync(path.join(dir, n), 'utf-8'));
  const org = rd('organisasi.json'), tkdn = rd('tkdn.json'), rantai = rd('rantai_plts.json'), proyek = rd('proyek.json');
  const aesi = JSON.parse(fs.readFileSync(arg('aesi', path.join(ROOT, 'data/penyedia_aesi.json')), 'utf-8'));
  const tanggal = org.dibangun_pada || '2026-11-07';
  const baris = bangun(org, tkdn, rantai, tanggal, aesi, proyek);
  const hitung = (f) => baris.reduce((m, b) => { for (const k of f(b)) m[k] = (m[k] || 0) + 1; return m; }, {});
  const out = {
    lapis: 'publik', dibangun_pada: tanggal, jumlah: baris.length, terhubung: baris.filter((b) => b.organisasi_id).length, kandidat_baru: baris.filter((b) => b.kandidat_baru).length,
    per_kategori: hitung((b) => b.kategori_layanan), per_teknologi: hitung((b) => b.teknologi), per_keanggotaan: hitung((b) => b.keanggotaan), per_kategori_x_teknologi: hitung((b) => b.kategori_layanan.flatMap((k) => b.teknologi.map((t) => `${t} / ${k}`))),
    sumber: ['public/data/organisasi.json', 'public/data/tkdn.json (Kemenperin P3DN)', 'public/data/rantai_plts.json (DJEBTKE ESDM, daftar pabrikan modul)', 'public/data/proyek.json (proyek_rujukan via proyek_ids organisasi)', 'data/penyedia_aesi.json (AESI, halaman Anggota, diambil 2026-11-08)'],
    celah: [
      'Kategori tanpa sumber panen: angin, mikrohidro/hidro, panas bumi (pemboran, EPC, peralatan), biogas/biomassa (digester, gasifier, boiler), WtE, SPKLU/kendaraan listrik, lab uji, konsultan AMDAL/hukum/keuangan. INAGA, APAMSI, AHI, APROBI, Asosiasi Biogas tidak punya daftar anggota yang terbaca (formulir, gambar, atau situs tak terjangkau). Hanya AESI yang terbaca (satu halaman).',
      'e-Katalog LKPP/INAPROC tidak dipanen: halaman pencarian dirender sisi-klien, data lewat /api/ yang dilarang robots.txt.',
      'AESI: nama berasal dari judul logo (kapital dinormalkan), tanpa badan hukum pasti; sebagian merek tanpa PT dicocokkan hanya bila namanya persis sama dengan organisasi.json. Halaman profil anggota (Crawl-Delay 20 detik) belum dibaca, jadi situs, kontak, lokasi kandidat AESI kosong.',
      'kebutuhan_dilayani, layanan_terdeteksi, jangkauan_layanan, iso_sni_disebut hanya dari teks nama/deskripsi/produk yang ada; deskripsi hanya ada di sekitar sepertiga organisasi, jadi kebanyakan kosong (bukan berarti tidak melayani).',
      'Kontak hanya surel/telepon kantor berpola umum; surel berpola nama orang dibuang. proyek_rujukan hanya dari proyek_ids organisasi.json (16 organisasi).',
      'Baris kandidat_baru belum masuk organisasi.json; tanpa situs/kontak sampai ada langkah sambung.',
    ],
    baris,
  };
  fs.mkdirSync(path.dirname(arg('out', path.join(ROOT, 'public/data/penyedia_teknologi.json'))), { recursive: true });
  fs.writeFileSync(arg('out', path.join(ROOT, 'public/data/penyedia_teknologi.json')), JSON.stringify(out, null, 2) + '\n', 'utf-8');
  console.log(`penyedia_teknologi: ${out.jumlah} baris (${out.terhubung} terhubung, ${out.kandidat_baru} kandidat)`);
}
