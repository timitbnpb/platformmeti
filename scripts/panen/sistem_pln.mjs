#!/usr/bin/env node
// Profil sistem kelistrikan PLN -> public/data/sistem_pln.json. Tanpa jaringan: merakit dari berkas publik repo
// (keandalan, statistik_pln, biaya_listrik, ruptl, proyek, wilayah) + tabel interkoneksi bertanggal di bawah. Tidak mengarang:
// yang tak terbit terbuka (susut per sistem, BPP terbaru per sistem) ditulis null dan dicatat di meta.celah.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', f), 'utf8'));
const TANGGAL = '2026-11-08';

export const SISTEM = [
  { id: 'jawa-bali', singkat: 'Jawa-Bali', nama: { id: 'Jawa-Madura-Bali', en: 'Java-Madura-Bali' }, prov: ['31', '32', '33', '34', '35', '36', '51'], sub: ['jawabali'], rm: 'jawabali', bpp: ['dki', 'banten', 'jabar', 'jateng', 'jatim', 'bali'] },
  { id: 'sumbagut', singkat: 'Sumbagut', nama: { id: 'Sumatera Bagian Utara', en: 'North Sumatra grid (Sumbagut)' }, prov: ['11', '12'], sub: [], rm: 'sumatera', bpp: ['aceh', 'sumut'] },
  { id: 'sumbagselteng', singkat: 'Sumbagselteng', nama: { id: 'Sumatera Bagian Selatan dan Tengah', en: 'South and Central Sumatra grid (Sumbagselteng)' }, prov: ['13', '14', '15', '16', '17', '18', '19', '21'], sub: [], rm: 'sumatera', bpp: ['sumbar', 'riau', 's2jb', 'lampung', 'bangka', 'belitung'] },
  { id: 'kalbar', singkat: 'Kalbar', nama: { id: 'Kalimantan Barat', en: 'West Kalimantan' }, prov: ['61'], sub: ['kalbar'], rm: 'kalbar', bpp: ['kalbar'] },
  { id: 'kalseltengtimra', singkat: 'Kalseltengtimra', nama: { id: 'Kalimantan Selatan, Tengah, Timur, Utara', en: 'South, Central, East, North Kalimantan' }, prov: ['62', '63', '64', '65'], sub: ['kalseltengtimra'], rm: 'kalseltengtimra', bpp: ['kalselteng', 'kaltimra'] },
  { id: 'sulbagut', singkat: 'Sulbagut', nama: { id: 'Sulawesi Bagian Utara', en: 'North Sulawesi grid (Sulbagut)' }, prov: ['71', '72', '75'], sub: ['sulbagut'], rm: 'sulbagut', bpp: ['sulbagut', 'palu'] },
  { id: 'sulbagsel', singkat: 'Sulbagsel', nama: { id: 'Sulawesi Bagian Selatan', en: 'South Sulawesi grid (Sulbagsel)' }, prov: ['73', '74', '76'], sub: ['sulbagsel'], rm: 'sulbagsel', bpp: ['sulbagsel', 'kendari'] },
  { id: 'nusa-tenggara', singkat: 'Nusa Tenggara', nama: { id: 'Nusa Tenggara (Lombok, Timor, isolated)', en: 'Nusa Tenggara (Lombok, Timor, isolated)' }, prov: ['52', '53'], sub: ['lombok', 'timor'], rm: null, bpp: ['lombok', 'timor'] },
  { id: 'maluku', singkat: 'Maluku', nama: { id: 'Maluku dan Maluku Utara', en: 'Maluku and North Maluku' }, prov: ['81', '82'], sub: ['ambon', 'halmahera'], rm: null, bpp: ['ambon', 'ternate'] },
  { id: 'papua', singkat: 'Papua', nama: { id: 'Papua (sistem isolated)', en: 'Papua (isolated systems)' }, prov: ['91', '92', '93', '94', '95', '96'], sub: ['jayapura', 'manokwari', 'merauke', 'nabire', 'wamena', 'sorong'], rm: null, bpp: ['jayapura', 'nabire', 'wamena', 'merauke', 'manokwari', 'sorong'] },
];

// Rencana interkoneksi (RUPTL 2025-2034); COD per ruas tidak terbit di sumber yang dapat dibuka, ditulis null.
export const INTERKONEKSI = [
  { id: 'sumatera-jawa', antara: ['sumbagselteng', 'jawa-bali'], nama: { id: 'Interkoneksi HVDC Sumatera-Jawa', en: 'Sumatra-Java HVDC interconnection' }, ket: { id: 'Proyek prioritas, tahap persiapan; panjang sirkuit 112 km dilaporkan; HVDC dirancang sebagai tulang punggung interkoneksi hijau RUPTL.', en: 'Priority project in preparation; 112 km circuit length reported; HVDC is designed as the green interconnection backbone of the RUPTL.' }, cod: null, url: 'https://investortrust.id/business/100710/interkoneksi-sumatra-jawa-jadi-proyek-prioritas-energi', tingkat_bukti: 'media' },
  { id: 'sumatera-batam', antara: ['sumbagselteng'], nama: { id: 'Sumatera-Batam-Bintan', en: 'Sumatra-Batam-Bintan' }, ket: { id: 'Satu dari empat tautan antarpulau dalam rincian PLN atas rencana jaringan 47.758 kms.', en: 'One of four inter-island links in PLN\'s breakdown of the 47,758 kms grid plan.' }, cod: null, url: 'https://investortrust.id/esg/68230/pln-siap-bangun-green-super-grid-sepanjang-47758-kms', tingkat_bukti: 'media' },
  { id: 'kalimantan-tarakan', antara: ['kalseltengtimra'], nama: { id: 'Kalimantan-Tarakan', en: 'Kalimantan-Tarakan' }, ket: { id: 'Tautan antarpulau Kalimantan-Tarakan dalam rincian PLN.', en: 'Kalimantan-Tarakan inter-island link in PLN\'s breakdown.' }, cod: null, url: 'https://investortrust.id/esg/68230/pln-siap-bangun-green-super-grid-sepanjang-47758-kms', tingkat_bukti: 'media' },
  { id: 'sultra-baubau', antara: ['sulbagsel'], nama: { id: 'Sulawesi Tenggara-Baubau', en: 'Southeast Sulawesi-Baubau' }, ket: { id: 'Disebut FAQ RUPTL ESDM sebagai tautan antarpulau; sumber media tidak memuatnya, jadi perlu dicek ke dokumen RUPTL.', en: 'Listed in the ESDM RUPTL FAQ as an inter-island link; media sources omit it, so check against the RUPTL document.' }, cod: null, url: 'https://gatrik.esdm.go.id/assets/uploads/download_index/files/daa0b-faq-ruptl-pln-2025-2034.pdf', tingkat_bukti: 'resmi' },
  { id: 'jawa-bali', antara: ['jawa-bali'], nama: { id: 'Jawa-Bali', en: 'Java-Bali' }, ket: { id: 'Tautan antarpulau Jawa-Bali (sudah satu sistem JAMALI).', en: 'Java-Bali inter-island link (already one JAMALI system).' }, cod: null, url: 'https://gatrik.esdm.go.id/assets/uploads/download_index/files/daa0b-faq-ruptl-pln-2025-2034.pdf', tingkat_bukti: 'resmi' },
];
const KAP = { batubara: ['PLTU/MT'], gas: ['PLTG/GU/MG/MGU'], diesel: ['PLTD'], hidro: ['PLTA/M'], bayu: ['PLTB'], bioenergi: ['PLT Bio', 'PLTGB'], 'panas-bumi': ['PLTP'], surya: ['PLTS'], lain: ['PLT Lain'] };
const PROD = { batubara: ['PLTU'], gas: ['PLTG', 'PLTGU', 'PLTMG'], diesel: ['PLTD'], hidro: ['PLTA', 'PLTM', 'PLTMH'], bayu: ['PLTB'], bioenergi: ['PLTBg', 'PLTBm', 'PLTSa'], 'panas-bumi': ['PLTP'], surya: ['PLTS'] };
const EBT = ['hidro', 'bayu', 'bioenergi', 'panas-bumi', 'surya'];
// Id sistem riset (jaringan/curtailment/permintaan_baru, kunci RUPTL) -> id sistem PLN di sini. Sumatera satu tabel untuk dua sistem: nilainya bersama, bukan dibagi.
const RISET_ID = { 'jawa-bali': ['jawabali'], sumbagut: ['sumatera'], sumbagselteng: ['sumatera'], kalbar: ['kalbar'], kalseltengtimra: ['kalseltengtimra'], sulbagut: ['sulbagut'], sulbagsel: ['sulbagsel'], 'nusa-tenggara': ['lombok', 'timor'], maluku: ['ambon', 'halmahera'], papua: ['jayapura', 'manokwari', 'merauke', 'nabire', 'wamena', 'sorong'] };
const LINGKUP = { 'jawa-bali': 'Jawa-Bali', sumbagut: 'Sumatera', sumbagselteng: 'Sumatera' };
const jum = (o, ks) => Math.round(ks.reduce((s, k) => s + (o?.[k] || 0), 0) * 100) / 100;

export function rakit() {
  const kea = j('keandalan.json'), st = j('statistik_pln.json'), bl = j('biaya_listrik.json'), rp = j('ruptl.json'), pj = j('proyek.json'), w = j('wilayah.json');
  const kodeNama = new Map(w.baris.map((b) => [b.nama, b.kode]));
  const rj = j('riset/jaringan.json'), rc = j('riset/curtailment.json'), rn = j('riset/permintaan_baru.json');
  const sistemDari = new Map(); for (const s of SISTEM) for (const k of s.prov) sistemDari.set(k, s.id);
  const mw = (p) => p.kapasitas?.[0]?.nilai ?? null;
  const baris = SISTEM.map((s) => {
    const rows = st.baris.filter((b) => s.prov.includes(b.kode));
    const kapasitas = {}, produksi = {};
    for (const [g, ks] of Object.entries(KAP)) kapasitas[g] = Math.round(rows.reduce((a, r) => a + jum(r.kapasitas_terpasang_mw, ks), 0));
    for (const [g, ks] of Object.entries(PROD)) produksi[g] = Math.round(rows.reduce((a, r) => a + jum(r.produksi_pln_gwh, ks), 0));
    const kapTot = rows.reduce((a, r) => a + (r.kapasitas_terpasang_mw.total || 0), 0), prodTot = rows.reduce((a, r) => a + (r.produksi_pln_gwh.total || 0), 0);
    const ebtMw = EBT.reduce((a, g) => a + kapasitas[g], 0), ebtGwh = EBT.reduce((a, g) => a + produksi[g], 0);
    const sub = s.sub.map((id) => kea.sistem.find((x) => x.id === id)).filter(Boolean);
    const acuan = s.rm ? kea.sistem.find((x) => x.id === s.rm) : null;
    // sistem tunggal: deret RM/beban dari tabel RUPTL itu sendiri; gabungan (Papua, Maluku, NT): beban dijumlah, RM = terendah per tahun.
    const deret = sub.length ? sub : acuan ? [acuan] : [];
    const beban = deret.length && (s.id !== 'sumbagut' && s.id !== 'sumbagselteng') ? Array.from({ length: 10 }, (_, i) => deret.reduce((a, x) => a + x.beban_puncak_neto_mw[i], 0)) : null;
    const rm = deret.length ? Array.from({ length: 10 }, (_, i) => Math.min(...deret.map((x) => x.rm_persen[i]))) : null;
    const prov = s.prov.map((k) => ({ kode: k, nama: w.baris.find((b) => b.kode === k)?.nama }));
    const proy = pj.baris.filter((p) => p.teknologi && sistemDari.get(kodeNama.get(p.lokasi?.provinsi)) === s.id);
    const ringkas = (p) => ({ id: p.id, nama: p.nama, teknologi: p.teknologi, mw: mw(p), status: p.status?.[0]?.nilai ?? null, provinsi: p.lokasi.provinsi });
    const urut = (a) => a.sort((x, z) => (z.mw || 0) - (x.mw || 0));
    const beroperasi = urut(proy.filter((p) => p.status?.[0]?.nilai === 'beroperasi').map(ringkas)).slice(0, 8);
    const rencana = urut(proy.filter((p) => ['konstruksi', 'rencana'].includes(p.status?.[0]?.nilai)).map(ringkas)).slice(0, 8);
    const rup = rp.baris.filter((b) => sistemDari.get(kodeNama.get(b.provinsi)) === s.id && b.cod_tahun?.length);
    const perTahun = {};
    for (const b of rup) { const th = b.cod_tahun[0]; if (th < 2025 || th > 2034) continue; perTahun[th] ??= {}; perTahun[th][b.teknologi] = Math.round(((perTahun[th][b.teknologi] || 0) + (b.kapasitas_mw || 0)) * 10) / 10; }
    const bpp = s.bpp.map((k) => bl.bpp_sistem.find((x) => x.kunci === k)).filter(Boolean).map((x) => ({ kunci: x.kunci, nama: x.nama, rp_kwh: x.rp_kwh }));
    const rid = RISET_ID[s.id], bersama = rid.includes('sumatera');
    const jar = rj.baris.filter((x) => rid.includes(x.sistem_id));
    const pb = rn.baris.filter((x) => rid.includes(x.sistem_id));
    const pbOk = pb.filter((x) => !x.diurai_ragu);
    const riset = {
      bersama_sumatera: bersama,
      batas_penetrasi: LINGKUP[s.id] ? rj.studi_batas_penetrasi.filter((x) => x.lingkup.includes(LINGKUP[s.id])).map((x) => ({ id: x.id, lingkup: x.lingkup, metrik: x.metrik, batas_persen: x.batas_persen, tahun: x.tahun, catatan: x.catatan, sumber_id: x.sumber_id, tingkat_bukti: x.tingkat_bukti })) : [],
      penyimpanan_ruptl_mw: jar.reduce((a, x) => a + (x.penyimpanan_ruptl_mw || 0), 0) || null,
      curtailment: rc.baris.filter((x) => rid.includes(x.sistem_id)).map((x) => ({ id: x.id, jenis: x.jenis, persen: x.curtailment_persen_tahunan, tahun: x.tahun_skenario, uraian: x.uraian, sumber_id: x.sumber_id, tingkat_bukti: x.tingkat_bukti })),
      permintaan_baru: { butir: pbOk.length, butir_ragu: pb.length - pbOk.length, mva_akhir: Math.round(pbOk.reduce((a, x) => a + (x.mva_akhir || 0), 0) * 10) / 10, per_kategori: Object.entries(pbOk.reduce((o, x) => ((o[x.kategori] = (o[x.kategori] || 0) + (x.mva_akhir || 0)), o), {})).map(([kategori, mva]) => ({ kategori, mva: Math.round(mva * 10) / 10 })).sort((a, z) => z.mva - a.mva), besar: [...pbOk].sort((a, z) => (z.mva_akhir || 0) - (a.mva_akhir || 0)).slice(0, 5).map((x) => ({ id: x.id, nama: x.nama, kategori: x.kategori, mva_akhir: x.mva_akhir, kawasan_id: x.kawasan_id })) },
    };
    return {
      riset,
      id: s.id, singkat: s.singkat, nama: s.nama, provinsi: prov, subsistem: sub.map((x) => ({ id: x.id, nama: x.nama, tabel: x.tabel })),
      kapasitas_mw: { ...kapasitas, total: kapTot, ebt: ebtMw }, produksi_gwh: { ...produksi, total: Math.round(prodTot), ebt: ebtGwh },
      bauran_ebt_persen: prodTot ? Math.round((ebtGwh / prodTot) * 1000) / 10 : null, tahun_statistik: st.tahun,
      beban_puncak_mw: beban, rm_persen: rm, rm_ket: s.rm && !sub.length ? 'sistem-sumatera' : sub.length > 1 ? 'terendah-subsistem' : 'sistem',
      ebt_dmn_mw: deret.length && beban ? Array.from({ length: 10 }, (_, i) => deret.reduce((a, x) => a + x.ebt_dmn_mw[i], 0)) : null,
      penyimpanan_ruptl_mw: deret.reduce((a, x) => a + x.penyimpanan_ruptl_mw, 0) || null, tahun_awal_neraca: kea.tahun_neraca,
      susut_persen: null, bpp, ruptl: { per_tahun: perTahun, jumlah_proyek: rup.length, mw: Math.round(rup.reduce((a, b) => a + (b.kapasitas_mw || 0), 0)) },
      interkoneksi: INTERKONEKSI.filter((x) => x.antara.includes(s.id)).map((x) => x.id), pembangkit_beroperasi: beroperasi, pembangkit_rencana: rencana,
    };
  });
  return {
    lapis: 'publik', dibangun_pada: TANGGAL,
    sumber: [
      ...[...rj.sumber, ...rc.sumber, ...rn.sumber].filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i).map((x) => ({ id: 'riset-' + x.id, judul: x.judul, penerbit: x.penerbit, tahun: x.tahun, url: x.url, tingkat_bukti: x.tingkat_bukti === 'Data' ? 'resmi' : 'kajian' })),
      { id: 'statistik', judul: 'Statistik Ketenagalistrikan Tahun 2024 (kapasitas semua pengusaha dan produksi PLN per provinsi, dijumlah per sistem)', penerbit: 'Ditjen Ketenagalistrikan ESDM', tahun: 2024, url: st.url, tingkat_bukti: 'resmi' },
      { id: 'ruptl', judul: 'RUPTL PT PLN (Persero) 2025-2034, Bab V neraca daya skenario RE Base dan lampiran proyek EBT', penerbit: 'PT PLN (Persero); Kementerian ESDM', tahun: 2025, url: kea.sumber[0].url, tingkat_bukti: 'resmi' },
      { id: 'bpp', judul: 'Kepmen ESDM BPP penyediaan tenaga listrik PLN per sistem (nilai terakhir 2020 yang terbaca) dan BPP nasional proyeksi RUPTL Rp 1.829/kWh (2025)', penerbit: 'Kementerian ESDM; PT PLN (Persero)', tahun: 2025, url: 'https://gatrik.esdm.go.id/assets/uploads/download_index/files/daa0b-faq-ruptl-pln-2025-2034.pdf', tingkat_bukti: 'resmi' },
      { id: 'proyek', judul: 'Daftar proyek METI (GEM, RUPTL, Wikipedia), data/proyek.json', penerbit: 'METI; Global Energy Monitor', tahun: 2026, url: '/data/proyek.json', tingkat_bukti: 'kajian' },
    ],
    bpp_nasional_2025: { rp_kwh: 1829, proyeksi_2034_rp_kwh: 1775, sumber_id: 'bpp', tingkat_bukti: 'resmi' },
    interkoneksi: INTERKONEKSI,
    susut_nasional: kea.susut_nasional,
    meta: {
      jumlah: baris.length, diperbarui: TANGGAL,
      celah: [
        'Susut jaringan hanya terbit nasional (transmisi + distribusi), bukan per sistem: susut_persen per sistem null.',
        'BPP per sistem versi Kepmen terbaru tidak terbit sebagai berkas terbuka yang ditemukan; nilai terakhir yang terbaca tahun 2020 (biaya_listrik.json). BPP nasional RUPTL 2025 Rp 1.829/kWh dari FAQ RUPTL.',
        'Beban puncak dan reserve margin per sistem hanya dari neraca daya RUPTL 2025-2034 (proyeksi, bukan realisasi); Sumbagut dan Sumbagselteng memakai satu tabel Sumatera-Bangka, jadi beban per bagian tidak dipecah.',
        'Nusa Tenggara, Maluku, dan Papua adalah himpunan sistem terpisah (isolated): beban dijumlah, reserve margin diambil nilai terendah subsistem per tahun. Proyek RUPTL yang tabelnya tanpa provinsi (termasuk seluruh Papua) tidak terhitung pada baris RUPTL.',
        'Kapasitas terpasang mencakup semua pengusaha (PLN dan non-PLN, termasuk captive) tahun 2024 dari Statistik ESDM; produksi hanya milik PLN termasuk sewa dan beli IPP.',
        'Batas penetrasi, curtailment, dan permintaan baru (public/data/riset) bersumber RUPTL 2025-2034 Lampiran E.1-E.2 dan studi IEA/Tumiran: batas penetrasi adalah hasil studi (Hipotesis), curtailment satu-satunya angka adalah model IEA, bukan kejadian terukur. Sulawesi, Maluku, Papua, Nusa Tenggara belum diurai di Lampiran E.3, sehingga permintaan barunya 0 butir, bukan nol permintaan.',
        'COD interkoneksi tidak tercantum di sumber yang dapat dibuka: dibiarkan null.',
      ],
    },
    baris,
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const d = rakit();
  fs.writeFileSync(path.join(AKAR, 'public/data/sistem_pln.json'), JSON.stringify(d));
  console.log('sistem_pln.json:', d.baris.length, 'sistem');
}
