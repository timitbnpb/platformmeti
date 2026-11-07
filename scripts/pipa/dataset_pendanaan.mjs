#!/usr/bin/env node
// Memperkaya public/data/keuangan.json (pendanaan hijau), karbon.json (IDXCarbon, proyek SRN) dan membuat tkdn.json.
// Hanya membaca berkas lokal (data-panen/*, public/data/*); tidak ada permintaan jaringan. Tambahan-saja: kelompok lain tak disentuh.
//   node scripts/pipa/dataset_pendanaan.mjs          tulis ketiga berkas
//   node scripts/pipa/dataset_pendanaan.mjs --cek    hanya cetak ringkasan
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { idxRingkasan } from '../panen/panen_tambahan.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TGL = '2026-11-07';
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const jsonl = (p) => (fs.existsSync(path.join(ROOT, p)) ? fs.readFileSync(path.join(ROOT, p), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const bersihkan = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
const norm = (s) => String(s || '').toLowerCase().replace(/\b(pt|cv|tbk|persero|\(persero\))\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const SUMBER = {
  's-wb': { id: 's-wb', judul: 'World Bank Projects & Operations API (proyek Indonesia, sektor energi)', penerbit: 'World Bank', tahun: 2026, url: 'https://search.worldbank.org/api/v2/projects?countrycode_exact=ID' },
  's-jetp': { id: 's-jetp', judul: 'JETP Indonesia: Comprehensive Investment and Policy Plan (CIPP) dan portofolio', penerbit: 'Sekretariat JETP Indonesia', tahun: 2023, url: 'https://jetp-id.org/cipp' },
  's-djppr': { id: 's-djppr', judul: '2025 Green Sukuk Allocation and Impact Report', penerbit: 'DJPPR Kemenkeu', tahun: 2025, url: 'https://api-djppr.kemenkeu.go.id/web/api/v1/media/8C2C3353-9134-43B3-9307-D465DE7C2CB8' },
  's-idxcarbon': { id: 's-idxcarbon', judul: 'IDXCarbon Monthly Report (Carbon Market Trading Summary dan Listed Project)', penerbit: 'Bursa Efek Indonesia (IDXCarbon)', tahun: 2026, url: 'https://idxcarbon.co.id/id/data-monthly' },
  's-tkdn': { id: 's-tkdn', judul: 'Sertifikat TKDN Barang (pencarian publik)', penerbit: 'Kementerian Perindustrian (P3DN)', tahun: 2026, url: 'https://tkdn.kemenperin.go.id/sertifikat' },
  's-berita': { id: 's-berita', judul: 'Pemberitaan media nasional dan daerah (judul dan tautan; angka dikutip dari judul)', penerbit: 'media (lihat url tiap baris)', tahun: 2026, url: 'https://platformmeti.timitbnpb.workers.dev/berita' },
};
const blokSumber = (ids) => ids.map((i) => SUMBER[i]);

// ---------- penautan ----------
function penaut() {
  const org = baca('public/data/organisasi.json').baris, pry = baca('public/data/proyek.json').baris;
  const idxOrg = new Map(org.map((o) => [norm(o.nama), o.id]));
  const ALIAS = { 'republic of indonesia': 'l_7b43a2574c', 'government of indonesia': 'l_7b43a2574c', 'the republic of indonesia': 'l_7b43a2574c', 'ministry of finance republic of indonesia': 'l_7b43a2574c', 'ministry of finance': 'l_7b43a2574c', 'world bank': 'l_18a9ec31f4', jetp: 'l_c455b2f724', pln: idxOrg.get('pln') };
  const orgId = (nama) => { const n = norm(nama); return idxOrg.get(n) ?? ALIAS[n] ?? null; };
  const proyekId = (re) => pry.find((p) => re.test(p.nama))?.id ?? null;
  return { orgId, proyekId, proyekAda: (id) => pry.some((p) => p.id === id) };
}

// ---------- 1. pendanaan hijau ----------
const NON_EBT = /thermal power|suralaya|paiton|community|governance|infrastructure|public expenditure|investment and trade|pnpm|kdp|wcs|chiller|cement|citizen|transparan/i;
const ENERGI = /geothermal|renewable|solar|pumped|power|electrif|energy|grid|transmission|hydro/i;
const MEDIA = [
  { nama: 'PLTS Terapung Gajah Mungkur (investasi)', nilai_idr: 1.6e12, pemberi: null, penerima: null, tahun: 2026, status: 'konstruksi', proyek: /gajah mungkur/i, url: 'https://ototekno.harianjogja.com/r-1268774/plts-terapung-gajah-mungkur-mulai-dibangun-investasi-rp16-triliun', media: 'harianjogja.com', judul: 'PLTS Terapung Gajah Mungkur Mulai Dibangun, Investasi Rp1,6 Triliun', tanggal_berita: '2026-08-26' },
  { nama: 'PLTS berbasis baterai di 10 lokasi terisolasi (investasi)', nilai_idr: 3.3e12, pemberi: null, penerima: null, tahun: 2026, status: 'rencana', proyek: null, url: 'https://economy.okezone.com/read/2026/09/22/320/3243554/investasi-rp3-3-triliun-plts-berbasis-baterai-dikembangkan-di-10-lokasi-terisolasi', media: 'okezone.com', judul: 'Investasi Rp3,3 Triliun, PLTS Berbasis Baterai Dikembangkan di 10 Lokasi Terisolasi', tanggal_berita: '2026-09-22' },
  { nama: 'Urun dana (Danamart) PLTS Asmat', nilai_idr: 1e10, pemberi: 'Danamart', penerima: null, tahun: 2026, status: 'rencana', proyek: /asmat/i, url: 'https://keuangan.kontan.co.id/news/danamart-bidik-pendanaan-rp-10-miliar-untuk-proyek-plts-di-asmat', media: 'kontan.co.id', judul: 'Danamart Bidik Pendanaan Rp 10 Miliar untuk Proyek PLTS di Asmat', tanggal_berita: '2026-08-18' },
  { nama: 'Program PLTS 100 GWp (perkiraan investasi)', nilai_idr: 1.14e15, pemberi: null, penerima: 'Danantara', tahun: 2026, status: 'rencana', proyek: null, url: 'https://www.antaranews.com/berita/5710388/bahlil-catat-potensi-investasi-plts-100-gwp-capai-rp1140-triliun', media: 'antaranews.com', judul: 'Bahlil catat potensi investasi PLTS 100 GWp capai Rp1.140 triliun', tanggal_berita: '2026-08-25' },
];
export function barisPendanaan() {
  const { orgId, proyekId, proyekAda } = penaut();
  const out = [];
  for (const w of jsonl('data-panen/proyek/tambahan_worldbank.jsonl')) {
    if (!(w.nilai_komitmen_usd > 0) || NON_EBT.test(w.nama) || !(w.teknologi || ENERGI.test(w.nama))) continue;
    out.push(bersihkan({
      kelompok: 'pendanaan', id: 'pd_' + w.id, nama: w.nama, jenis: 'pinjaman-multilateral', instrumen: w.instrumen ?? null,
      pemberi: 'World Bank (IBRD/IDA)', pemberi_org_id: orgId('World Bank'), penerima: w.peminjam ?? null, penerima_org_id: w.peminjam ? orgId(w.peminjam) : null,
      proyek_id: proyekAda(w.id) ? w.id : null, nilai_usd: w.nilai_komitmen_usd, nilai_idr: null, tahun: w.tanggal_persetujuan ? Number(w.tanggal_persetujuan.slice(0, 4)) : null,
      tanggal_persetujuan: w.tanggal_persetujuan ?? null, status: w.status, sumber_id: 's-wb', sumber_url: w.sumber_url, tanggal: w.tanggal_ambil || TGL, tingkat_bukti: 'resmi',
    }));
  }
  for (const m of MEDIA) {
    out.push({
      kelompok: 'pendanaan', id: 'pd_media_' + m.url.replace(/\W+/g, '').slice(-14), nama: m.nama, jenis: 'investasi-diberitakan', instrumen: null,
      pemberi: m.pemberi, pemberi_org_id: m.pemberi ? orgId(m.pemberi) : null, penerima: m.penerima, penerima_org_id: m.penerima ? orgId(m.penerima) : null,
      proyek_id: m.proyek ? proyekId(m.proyek) : null, nilai_usd: null, nilai_idr: m.nilai_idr, tahun: m.tahun, status: m.status,
      sumber_id: 's-berita', sumber_url: m.url, media: m.media, judul_berita: m.judul, tanggal: m.tanggal_berita, tingkat_bukti: 'media',
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
const CELAH_KEU = [
  'Pinjaman ADB, AIIB dan IFC untuk proyek EBT Indonesia belum dimasukkan: halaman proyek ADB/AIIB/IFC tidak dipanen pada 7 Nov 2026 (belum ada panen terverifikasi); tidak ada angka yang ditebak.',
  'Daftar proyek CIPP JETP ada di PDF laporan penuh; unduhan PDF terpotong oleh server (98 KB) sehingga nilai per proyek belum terbaca. Hanya total komitmen USD 20 miliar dan proyek portofolio di jetp-id.org yang tercatat.',
  'Green bond/sukuk hijau korporasi EBT (BEI) belum ada: situs idx.co.id menjawab 403 ke UA jujur dan tidak ditembus. Sukuk hijau negara (DJPPR) tercatat di kelompok green_finance.',
  'Pinjaman World Bank memuat nilai komitmen API (USD) tanpa konversi IDR; sebagian proyek lama (<2000) bernilai 0 di API dan dilewati.',
  'Baris tingkat_bukti "media" hanya mengutip angka dari judul berita (isi berita tidak dibaca); angka belum diverifikasi ke dokumen primer.',
];

// ---------- 2. karbon ----------
const BLN = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
export const periodePdf = (t) => { const m = t.match(/TRADING SUMMARY[\s\S]{0,300}?\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w* (20\d\d)/); return m ? `${m[2]}-${BLN[m[1]]}` : null; };
export const hargaRata = (nilai, vol) => (vol > 0 && nilai > 0 ? Math.round(nilai / vol) : null);
// nama berkas PDF lokal (label bulan di halaman IDXCarbon keliru untuk dua yang pertama) -> tautan dokumen
const URL_PDF = Object.fromEntries(Object.entries({"idx-2024-09.pdf":"153/47236fb9-0d0f-41fd-af34-512deb93852c","idx-2024-11.pdf":"157/a137c567-8576-4ec0-a9fe-44b797d9e966","idx-2025-10.pdf":"154/44cfcf07-d30d-4775-a70e-f145830fbf6a","idx-2025-12.pdf":"159/293e03bb-0411-409b-bb3d-d44e3faa435f","idx-2026-01.pdf":"160/c0b22283-ce5f-4d40-b3b7-b2130c1774d2","idx-2026-02.pdf":"161/caf49365-34e4-4582-8cd3-bb660ebb126c","idx-2026-03.pdf":"162/90c777b8-2d82-4788-b46f-2725d57d8119","idx-2026-04.pdf":"163/d7f039b2-b2c7-4c94-ba3c-77aef23ddcfc","idx-2026-05.pdf":"164/c2c766bc-f8a2-42b5-8a6a-35eeecdebebe","idx-2026-06.pdf":"170/cfb01943-785c-42c6-9ee3-369003327c67","idx-2026-07.pdf":"186/4185502e-93d0-431a-aca1-ecbf93104d82","idx-2026-08.pdf":"187/13f6c9d4-892c-4882-9629-a9a8f74537cb","idx-2026-09.pdf":"188/c9f5cbef-681d-4104-8685-9f5ff4e9b663","idx-2026-10.pdf":"189/23b9fd34-8cdc-4097-ae90-67bcee1cd65a"}).map(([f, p]) => [f, 'https://www.idxcarbon.co.id/document/share/' + p]));
const HAL = 'https://idxcarbon.co.id/id/data-monthly';
export const PROYEK_SRN = [
  ['Proyek Lahendong Unit 5 & Unit 6 (PGE)', 'IDTBS-RE', 'PT Pertamina Power Indonesia', 'SPE-10-PR-VI-2023-14464', '2016-2022', '2023-09-26', { 2016: 41536, 2017: 209013, 2018: 204823, 2019: 205848, 2020: 202989, 2021: 230718, 2022: 234413 }],
  ['Pembangunan Pembangkit Listrik Baru Berbahan Bakar Gas Bumi PLTGU Blok 3 PJB Muara Karang', 'IDTBS', 'PT PLN Nusantara Power', 'SPE-11-PR-V-2023-10867', '2022', '2023-10-23', { 2022: 923773 }],
  ['Pengoperasian Pembangkit Listrik Tenaga Air Minihidro PLTM Gunung Wugul', 'IDTBS-RE', 'PT PLN Indonesia Power', 'SPE-10-PR-X-2023-16887', '2021-2022', '2024-07-08', { 2021: 1598, 2022: 11334 }],
  ['Pengoperasian Pembangkit Listrik Baru Berbahan Bakar Gas Bumi PLTGU Priok Blok 4', 'IDTBS', 'PT PLN Indonesia Power', 'SPE-11-PR-IV-2024-17421', '2021', '2025-01-03', { 2021: 763653, 2022: 400000 }],
  ['Konversi Pembangkit Single Cycle menjadi Combined Cycle (Add On) PLTGU Grati Blok 2', 'IDTBS', 'PT PLN Indonesia Power', 'SPE-11-PR-VI-2024-22454', '2021', '2025-01-06', { 2021: 407390, 2022: 150000 }],
  ['Konversi Pembangkit Single Cycle menjadi Combined Cycle Blok 2 PLN NP UP Muara Tawar', 'IDTBS', 'PT PLN Nusantara Power', 'SPE-11-PR-VI-2024-16141', '2023', '2025-01-08', { 2023: 34000 }],
  ['Pengoperasian Pembangkit Listrik Baru Berbahan Bakar Gas Bumi PLTMG Sumbagut 2 Peaker 250 MW', 'IDTBS', 'PT PLN Nusantara Power', 'SPE-10-PR-VI-2024-20755', '2021-2023', '2025-02-05', { 2021: 87024, 2022: 86752, 2023: 103292 }],
  ['Pemanfaatan Limbah Pabrik Kelapa Sawit (POME) untuk Biogas Co-firing, Riau', 'IDTBS', 'PT Perkebunan Nusantara IV', 'SPE-11-PR-VI-2024-18003', '2021-2023', '2025-05-20', { 2021: 1023, 2022: 6269, 2023: 14227 }],
  ['[PNRE x PTPN III] PLTBg Sei Mangkei 2,4 MW dari Recovery Biogas Pengolahan Limbah POME', 'IDTBS-RE', 'PT Pertamina Power Indonesia', 'SPE-10-PR-IV-2024-17599', '2021-2024', '2025-11-26', { 2021: 9269, 2022: 8846, 2023: 9168, 2024: 8192 }],
  ['Pembangkit Listrik Tenaga Biogas Sukadamai 2,4 MW dari Recovery Biogas Pengolahan Limbah POME', 'IDTBS-RE', 'PT Nagata Bio Energi', 'SPE-10-PR-V-2023-10134', '2021-2023', '2026-02-02', { 2021: 22862, 2022: 51258, 2023: 47799 }],
];
const RAW_PDF = (n) => path.join(ROOT, 'data-panen/karbon/raw', n);
export function barisBursa(lama) {
  const out = [];
  for (const f of fs.existsSync(path.join(ROOT, 'data-panen/karbon/raw')) ? fs.readdirSync(path.join(ROOT, 'data-panen/karbon/raw')).filter((n) => /^idx-\d{4}-\d\d\.pdf$/.test(n)).sort() : []) {
    const t = execFileSync('pdftotext', ['-layout', RAW_PDF(f), '-'], { maxBuffer: 1 << 26 }).toString('utf8');
    const ring = idxRingkasan(t), periode = periodePdf(t);
    const url = URL_PDF[f];
    if (!ring || !periode || !url) continue;
    out.push({ kelompok: 'bursa_karbon', id: 'idxc_' + periode, periode, ...ring, harga_rata_idr_per_tco2e: hargaRata(ring.nilai_idr, ring.volume_tco2e), harga_turunan: 'nilai_idr dibagi volume_tco2e; rata-rata tertimbang bulan itu, bukan harga kutipan',
      sumber: 'IDXCarbon, Monthly Report (Carbon Market Trading Summary)', sumber_id: 's-idxcarbon', sumber_url: url, halaman_sumber: HAL, lisensi: 'data publik Bursa Efek Indonesia; dikutip dengan atribusi', tingkat_bukti: 'resmi', tanggal: TGL });
  }
  return out.sort((a, b) => a.periode.localeCompare(b.periode));
}
export function barisSrn(urlLaporan, periode) {
  const { orgId } = penaut();
  return PROYEK_SRN.map(([nama, tipe, pemilik, srn, vintage, listed, vol]) => ({
    kelompok: 'proyek_srn', id: 'srn_' + srn.toLowerCase(), nama, tipe_unit: tipe, pemilik_proyek: pemilik, pemilik_org_id: orgId(pemilik), srn_series: srn, vintage, tanggal_listing: listed,
    volume_listing_tco2e_per_vintage: vol, volume_listing_total_tco2e: Object.values(vol).reduce((a, b) => a + b, 0), status_laporan: `terdaftar di IDXCarbon per laporan ${periode}`,
    sumber_id: 's-idxcarbon', sumber_url: urlLaporan, halaman_sumber: HAL, tanggal: TGL, tingkat_bukti: 'resmi',
  }));
}
const CELAH_KAR = [
  'IDXCarbon tidak punya endpoint JSON publik: situs Odoo; halaman Data Bulanan hanya memuat tautan PDF (14 laporan, Sep 2025 sampai Okt 2026), halaman Data Harian kosong tanpa login. Skrip panen membaca PDF (scripts/panen/panen_tambahan.mjs --ambil).',
  'Label bulan di halaman Data Bulanan keliru untuk dua laporan (September 2024 dan November 2024 sebenarnya September 2025 dan November 2025 menurut isi PDF); periode di sini mengikuti isi PDF.',
  'Harga per unit tidak diterbitkan; harga_rata_idr_per_tco2e diturunkan dari nilai dibagi volume bulanan. Harga dan volume per proyek tidak ada di laporan bulanan; daftar proyek_srn adalah proyek TERDAFTAR (listed), bukan yang sudah diperdagangkan.',
  'Laporan bulanan sebelum September 2025 tidak ada di halaman publik; bulan tanpa laporan (mis. Agustus 2025) tidak ada barisnya.',
  'REC PLN: tidak ada tabel harga atau volume publik yang ditemukan (belum diperiksa mendalam di situs PLN); tidak ada baris.',
  'Transaksi karbon dari berita: tidak ada judul di berita.json yang memuat angka transaksi karbon; tidak ada baris media.',
];

// ---------- 3. TKDN ----------
const KAT = [['modul_surya', /surya|photovoltaic|\bpv\b|plts|solar/i], ['inverter', /inverter/i], ['turbin', /turbin|turbine/i], ['baterai', /baterai|battery|lithium|bess/i], ['menara', /menara|tower/i]];
export function barisTkdn() {
  const { orgId } = penaut();
  const lihat = new Set(), out = [];
  for (const r of jsonl('data-panen/perusahaan/tambahan_tkdn.jsonl')) {
    const teks = [r.produk, r.merk, r.tipe].filter(Boolean).join(' ');
    const kat = KAT.filter(([, re]) => re.test(teks)).map(([k]) => k);
    if (!kat.length || !(r.tkdn_persen > 0)) continue;
    const k = [r.perusahaan, r.produk, r.tipe, r.berlaku_sd].join('|'); if (lihat.has(k)) continue; lihat.add(k);
    out.push({ id: 'tkdn_' + out.length.toString().padStart(3, '0'), kategori: kat[0], produsen: r.perusahaan, produsen_org_id: orgId(r.perusahaan), produk: r.produk, merk: r.merk, tipe: r.tipe, provinsi: r.provinsi, tkdn_persen: r.tkdn_persen, nomor_sertifikat: null, diterbitkan: r.diterbitkan, berlaku_sampai: r.berlaku_sd, sumber_id: 's-tkdn', sumber_url: r.sumber_url, tanggal: r.tanggal || TGL, tingkat_bukti: 'resmi' });
  }
  out.sort((a, b) => a.kategori.localeCompare(b.kategori) || a.produsen.localeCompare(b.produsen) || (b.tkdn_persen - a.tkdn_persen));
  return out.map((b, i) => ({ ...b, id: 'tkdn_' + String(i + 1).padStart(3, '0') }));
}
const CELAH_TKDN = [
  'Nomor sertifikat tidak tampil di daftar hasil pencarian publik; halaman detail dan /api/ tidak dipanen (robots.txt melarang /api/ dan /cari). Kolom nomor_sertifikat null.',
  'Pencarian "menara turbin angin" 0 hasil dan "wind tower" 8 hasil tak satupun menara turbin angin (7 Nov 2026); kategori menara kosong.',
  'Hasil pencarian kata kunci (modul surya, panel surya, inverter, baterai lithium, turbin, mikrohidro; maks 8 halaman tiap kata); sertifikat di luar halaman itu atau yang namanya tidak memuat kata kunci tidak tercakup. Baris tanpa nama produk dilewati.',
  'Pihak ketiga mengakses: situs melarang GPTBot/ClaudeBot di robots.txt tetapi mengizinkan agen lain (*) untuk /sertifikat; UA METI jujur dipakai, jeda >= 2 detik.',
];

// ---------- tulis ----------
const tulis = (p, o) => fs.writeFileSync(path.join(ROOT, p), JSON.stringify(o) + '\n');
export function bangunSemua() {
  const keu = baca('public/data/keuangan.json');
  const pend = barisPendanaan();
  keu.baris = [...keu.baris.filter((b) => b.kelompok !== 'pendanaan'), ...pend];
  keu.jumlah = keu.baris.length; keu.dibangun_pada = TGL;
  keu.sumber = blokSumber(['s-wb', 's-jetp', 's-djppr', 's-berita']);
  keu.meta = { diperbarui: TGL, celah: CELAH_KEU };

  const kar = baca('public/data/karbon.json');
  const lamaBursa = kar.baris.filter((b) => b.kelompok === 'bursa_karbon');
  let bursa = barisBursa(lamaBursa);
  if (!bursa.length) bursa = lamaBursa; // PDF mentah tak ada: jangan hapus data lama
  const akhir = bursa[bursa.length - 1];
  kar.baris = [...kar.baris.filter((b) => !['bursa_karbon', 'proyek_srn'].includes(b.kelompok)), ...bursa, ...barisSrn(akhir.sumber_url, akhir.periode)];
  kar.jumlah = kar.baris.length; kar.dibangun_pada = TGL;
  kar.sumber = blokSumber(['s-idxcarbon']);
  kar.meta = { diperbarui: TGL, celah: CELAH_KAR };

  const tk = barisTkdn();
  const tkdn = { lapis: 'publik', dibangun_pada: TGL, jumlah: tk.length, sumber: blokSumber(['s-tkdn']), meta: { diperbarui: TGL, celah: CELAH_TKDN }, baris: tk };
  return { keu, kar, tkdn };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { keu, kar, tkdn } = bangunSemua();
  console.log('pendanaan', keu.baris.filter((b) => b.kelompok === 'pendanaan').length, '| bursa', kar.baris.filter((b) => b.kelompok === 'bursa_karbon').length, '| srn', kar.baris.filter((b) => b.kelompok === 'proyek_srn').length, '| tkdn', tkdn.jumlah);
  if (!process.argv.includes('--cek')) { tulis('public/data/keuangan.json', keu); tulis('public/data/karbon.json', kar); tulis('public/data/tkdn.json', tkdn); }
}
