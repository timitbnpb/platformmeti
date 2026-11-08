// public/data/psn.json dari lampiran Permenko 16/2025 (data/psn/permenko-16-2025.txt) + pengayaan tangan (data/psn/pengayaan.json).
//   node scripts/pipa/psn_bangun.mjs        (tanpa jaringan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kodeProv } from '../../public/inti/prov_singkat.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
export const SEKTOR = { A: 'jalan', B: 'pelabuhan', C: 'bandara', D: 'kereta', E: 'kawasan', F: 'perumahan', G: 'bendungan', H: 'air', I: 'tanggul', J: 'energi', K: 'teknologi', L: 'pendidikan', M: 'pariwisata', N: 'pertanian' };
const rapat = (s) => s.replace(/\s+/g, ' ').trim();

/** Program (bagian II lampiran): kolom teks lampiran terlalu acak untuk diurai mesin; nama dan keterangan ditulis ulang dari lampiran, dan uji memeriksa tiap nama ada di teksnya. */
export const PROGRAM = [
  [1, 'Program Ketenagalistrikan', 'Pembangunan Infrastruktur Ketenagalistrikan (PIK); PLTS Atap Nasional; PLTS skala besar di Kepulauan Riau; PLTA Sungai Mentarang di Kalimantan Utara'],
  [2, 'Program Pemerataan Ekonomi', 'Pengukuhan kawasan hutan, perhutanan sosial, reforma agraria, pelatihan vokasi, peremajaan kebun rakyat, dan lahan pertanian bagi korban konflik di Provinsi Aceh'],
  [3, 'Program Pengembangan Kawasan Perbatasan', '10 Pos Lintas Batas Negara (PLBN), jalan perbatasan Kalimantan Timur, jalan paralel dan jalan akses perbatasan Kalimantan Utara'],
  [4, 'Program Pengembangan Akses Exit Toll', '58 lokasi Exit Toll pada 10 provinsi'],
  [5, 'Program Pengembangan Kawasan Strategis Pariwisata Nasional', 'DPSP Danau Toba, Borobudur, Mandalika, Labuan Bajo, dan Likupang'],
  [7, 'Program Pembangunan Smelter', 'Fasilitas pengolahan dan pemurnian nikel, bauksit, tembaga, pasir besi dan vanadium, serta alumina terpadu (19 butir perusahaan di baris tersendiri)'],
  [8, 'Program Peningkatan Penyediaan Pangan Nasional', 'Peningkatan penyediaan pangan dalam rangka ketahanan pangan'],
  [9, 'Program Pengembangan Superhub', 'Bali-Nusa Tenggara, Kalimantan Timur, Sulawesi Utara, dan integrasi Pelindo I sampai IV ke dalam PT Pelindo II'],
  [10, 'Program Percepatan Pengembangan Wilayah', 'Ibu Kota Nusantara dan infrastruktur pendukung; kawasan Kendal-Semarang-Salatiga-Demak-Grobogan; Gresik-Bangkalan-Mojokerto-Surabaya-Sidoarjo-Lamongan; Batam-Bintan-Karimun; Rebana dan Jawa Barat bagian selatan'],
  [11, 'Program Pengembangan Kawasan Ekonomi Khusus', 'Kawasan Ekonomi Khusus yang ditetapkan oleh Presiden'],
  [12, 'Program Revitalisasi Industri Gula Nasional dan Hilirisasi Industri Kelapa Sawit', 'Integrasi Grup PT Perkebunan Nusantara lewat SugarCo, PalmCo, dan SupportingCo'],
  [13, 'Program Pengembangan Kawasan Eco-City', 'Kawasan Rempang Eco-City di Provinsi Kepulauan Riau sesuai masterplan'],
  [14, 'Program Pertumbuhan Industri Pariwisata dan Penerbangan', 'Peningkatan konektivitas udara'],
  [15, 'Program Pengoperasian dan Modernisasi Jalan Tol', 'Penerapan Multi-Lane Free Flow (MLFF)'],
  [16, 'Program Pengendalian Banjir, Penanganan Kemacetan, dan Peningkatan Kelayakhunian di Provinsi Daerah Khusus Ibukota Jakarta', 'Simpang tidak sebidang, pengendalian banjir, transportasi, dan fasilitas pengolahan sampah terpadu'],
  [17, 'Program Makan Bergizi Gratis', 'Nasional'],
  [18, 'Program Sekolah Rakyat', 'Nasional'],
  [19, 'Program Koperasi Desa/Kelurahan Merah Putih', 'Nasional'],
  [20, 'Program Digitalisasi Pendidikan', 'Nasional'],
  [21, 'Program Pengentasan Kemiskinan', 'Nasional'],
  [22, 'Program Pengelolaan Sampah Terpadu', 'Daftar proyek berpedoman pada Peraturan Presiden'],
  [23, 'Program Swasembada Pangan, Energi, dan Air Nasional Merauke, Mappi, Asmat, dan Boven Digoel', 'Provinsi Papua Selatan: cetak sawah, sawit, peternakan, dan sarana pendukung'],
  [24, 'Program Revitalisasi Tambak Pantura di Kabupaten Bekasi, Karawang, Subang, dan Indramayu', 'Provinsi Jawa Barat'],
  [25, 'Program Pengembangan Budi Daya Udang Terintegrasi (Integrated Shrimp Farming) di Kabupaten Sumba Timur', 'Provinsi Nusa Tenggara Timur'],
].map(([no, nama, ket]) => ({ no, nama, ket }));

/** 19 butir Program Pembangunan Smelter menurut lampiran (perusahaan, lokasi, komoditas, kode provinsi). */
export const SMELTER = [
  ['PT Artabumi Sentra Industri', 'Morowali, Sulawesi Tengah', 'nikel', ['72']], ['PT Wanxiang Nickel Indonesia', 'Morowali, Sulawesi Tengah', 'nikel', ['72']],
  ['PT Artha Mining Industry', 'Bombana, Sulawesi Tenggara', 'nikel', ['74']], ['PT Ceria Nugraha Indotama', 'Kolaka, Sulawesi Tenggara', 'nikel', ['74']],
  ['PT Macika Mineral Industri', 'Konawe Selatan, Sulawesi Tenggara', 'nikel', ['74']], ['PT Virtue Dragon Nickel Industry', 'Konawe, Sulawesi Tenggara', 'nikel', ['74']],
  ['PT Aneka Tambang P3FH', 'Halmahera Timur, Maluku Utara', 'nikel', ['82']], ['PT Aneka Tambang Niterra Haltim', 'Halmahera Timur, Maluku Utara', 'nikel', ['82']],
  ['PT Dinamika Sejahtera Mandiri', 'Sanggau, Kalimantan Barat', 'bauksit', ['61']], ['PT Well Harvest Winning Alumina Refinery (ekspansi)', 'Ketapang, Kalimantan Barat', 'bauksit', ['61']],
  ['PT Tianshan Alumina Indonesia', 'Lingga, Kepulauan Riau', 'bauksit', ['21']], ['PT Freeport Indonesia', 'Gresik, Jawa Timur', 'tembaga', ['35']],
  ['PT Amman Mineral Industri', 'Sumbawa Barat, Nusa Tenggara Barat', 'tembaga', ['52']], ['PT Alchemist Metal Industry', 'Halmahera Utara, Maluku Utara', 'pasir besi dan vanadium', ['82']],
  ['PT Bahodopi Nickel Smelting Indonesia (terintegrasi tambang PT Vale Indonesia Blok Bahodopi)', 'Morowali, Sulawesi Tengah', 'nikel', ['72']],
  ['PT Kolaka Nikel Indonesia (terintegrasi tambang PT Vale Indonesia Blok Pomala)', 'Kolaka, Sulawesi Tenggara', 'nikel', ['74']],
  ['PT Aneka Tambang Group dan PT Industri Baterai Indonesia (EV Battery Nasional)', 'Halmahera Timur, Maluku Utara', 'nikel', ['82']],
  ['PT Borneo Alumina Indonesia (Fase I)', 'Mempawah, Kalimantan Barat', 'bauksit', ['61']],
  ['PT Indonesia Asahan Aluminium (Fase II dan smelter kedua)', 'Mempawah, Kalimantan Barat dan Kuala Tanjung, Sumatera Utara', 'bauksit', ['61', '12']],
];

/** Uraikan lampiran: proyek bernomor per sektor (nama + lokasi) dan program bernomor (nama + keterangan). */
export function uraiLampiran(teks) {
  const baris = teks.split('\n');
  const iProy = baris.findIndex((l) => /^\s*I\.\s+PROYEK/.test(l));
  const iProg = baris.findIndex((l) => /^\s*II\.\s+PROGRAM/.test(l));
  const proyek = [], program = PROGRAM;
  let sek = '', kol = 50, cur = null;
  const tutup = () => { if (cur) { cur.nama = rapat(cur.nama); cur.lokasi = rapat(cur.lokasi); } cur = null; };
  for (let i = iProy; i < iProg; i++) {
    const l = baris[i];
    const h = l.match(/^\s*([A-N])\.\s+Sektor\s+(.+?)\s*$/);
    if (h) { tutup(); sek = h[1]; continue; }
    if (/DAFTAR PROYEK STRATEGIS NASIONAL\s+LOKASI/.test(l)) { tutup(); kol = l.indexOf('LOKASI'); continue; }
    const m = l.match(/^(\s{0,2})(\d{1,3})\.\s+/);
    if (m && sek) {
      tutup();
      const awal = m[0].length;
      cur = { no: +m[2], sektor: sek, nama: l.slice(awal, kol), lokasi: l.slice(kol) };
      proyek.push(cur); continue;
    }
    if (cur && l.trim() && !/^\s*-\s*\d+\s*-\s*$/.test(l)) { cur.nama += ' ' + l.slice(0, kol); cur.lokasi += ' ' + l.slice(kol); }
  }
  tutup();
  return { proyek, program };
}

/** "Provinsi Jawa Barat - Provinsi Jawa Tengah dan Sumatera Utara" -> ['32','33','12']; "Nasional"/"Indonesia Bagian Timur" -> [] */
export function kodeLokasi(lok) {
  const out = [];
  for (const bag of lok.replace(/Provinsi\s+Daerah Khusus Ibukota Jakarta/gi, 'DKI Jakarta').split(/\s+-\s+|,\s*(?:dan\s+)?|\s+dan\s+|\s+serta\s+/i)) {
    const k = kodeProv(bag.replace(/^Provinsi\s+/i, '').trim());
    if (k && !out.includes(k)) out.push(k);
  }
  return out;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function indeksWilayah() {
  const adm2 = baca('data/geo/pusat-wilayah.json').adm2, adm1 = baca('data/geo/pusat-wilayah.json').adm1;
  const kab = baca('public/data/radar_kabupaten.json').baris;
  const kodeKab = new Map(kab.map((k) => [norm(k.nama.replace(/^(Kabupaten|Kota)\s+/, (m) => (m.startsWith('Kota') ? 'kota ' : ''))), k.kode]));
  const kodeNama = new Map(kab.map((k) => [norm(k.nama), k.kode]));
  return { adm2, adm1, rata(kode) { const a = adm2.filter((x) => kodeProv(x.provinsi) === kode); return a.length ? { lat: a.reduce((u, x) => u + x.lat, 0) / a.length, lng: a.reduce((u, x) => u + x.lng, 0) / a.length } : null; }, cariKab(n) { const t = adm2.find((x) => x.asli === n); if (!t) return null; const kode = kodeNama.get(norm('Kabupaten ' + n)) || kodeNama.get(norm(n)) || kodeKab.get(norm(n)) || null; return { lat: t.lat, lng: t.lng, kode, prov: kodeProv(t.provinsi) }; } };
}

export function bangun(tglDibuat) {
  const teks = fs.readFileSync(path.join(ROOT, 'data/psn/permenko-16-2025.txt'), 'utf8');
  const { proyek, program } = uraiLampiran(teks);
  const P = baca('data/psn/pengayaan.json');
  const W = indeksWilayah();
  const org = baca('public/data/organisasi.json').baris;
  const ALIAS = [[/^(pt )?pertamina( \(persero\))?$/i, 'p_b1c52ad7b0'], [/^bpi danantara/i, 'l_43f00f6a72'], [/^kementerian esdm/i, 'l_7278e0528a'], [/^pt industri baterai indonesia/i, 'p_c9b8bffbec'], [/^catl/i, 'in_b50ac2a3e1'], [/^plN$/i, 'su_ed074ff5']];
  const orgId = (nama) => { const a = ALIAS.find(([re]) => re.test(nama.trim())); if (a) return a[1]; const n = norm(nama.replace(/\(.*?\)/g, '')); const o = org.find((x) => norm(x.nama) === n) || org.find((x) => n.length > 4 && norm(x.nama).startsWith(n)); return o ? o.id : null; };
  const baris = [];
  const tambah = (r, ay) => {
    const kab = (ay?.kab || []).map((n) => W.cariKab(n)).filter(Boolean);
    const pk = r.prov_kode.length ? r.prov_kode : kab.map((k) => k.prov).filter(Boolean);
    let lat = null, lng = null, presisi = null;
    if (ay?.titik) { lat = ay.titik.lat; lng = ay.titik.lng; presisi = ay.titik.presisi; }
    else if (kab[0]) { lat = kab[0].lat; lng = kab[0].lng; presisi = 'kabupaten'; }
    else if (pk[0]) { const p = W.adm1[Object.keys(W.adm1).find((n) => kodeProv(n) === pk[0])] || W.rata(pk[0]); if (p) { lat = p.lat; lng = p.lng; presisi = 'provinsi'; } }
    const sumberIds = ['bpk16', ...(ay?.sumber || [])];
    const sumber = sumberIds.map((k) => ({ id: k, ...P.sumber[k] }));
    const wujud = (a) => (a || []).map((n) => ({ nama: n, org_id: orgId(n.split(' (')[0]) }));
    const tingkat = ay?.sumber?.length ? (sumber.some((s) => s.bukti === 'resmi' && s.id !== 'bpk16') ? 'resmi' : 'media') : 'resmi';
    baris.push({
      ...r, prov_kode: pk, kab_kode: kab.map((k) => k.kode).filter(Boolean), lat, lng, presisi_titik: presisi,
      investasi: ay?.investasi || null, dana: ay?.dana || [], pemrakarsa: wujud(ay?.pemrakarsa), pelaksana: wujud(ay?.pelaksana),
      status: ay?.status || 'tidak-diketahui', progres: ay?.progres ?? null, cod: ay?.cod ?? null, cod_ket: ay?.cod_ket || null, kapasitas: ay?.kapasitas || null,
      dasar_hukum: ['permenko-16-2025', ...(ay?.dasar_hukum || [])], tonggak: ay?.tonggak || [], listrik_ebt: ay?.listrik_ebt || null, proyek_gem: ay?.proyek_gem || [], proyek_meti: ay?.proyek_meti || [],
      isu: ay?.isu || [], catatan: ay?.catatan || null, sumber, tingkat_bukti: ay ? tingkat : 'resmi', lengkap: ay ? 1 : 0,
    });
  };
  for (const p of proyek) {
    const ay = P.butir[String(p.no)];
    const dihapus = /^dihapus$/i.test(p.nama);
    if (dihapus) continue;
    const energi = p.sektor === 'J';
    tambah({ id: 'psn-' + String(p.no).padStart(3, '0'), no: p.no, tipe: 'proyek', sektor: SEKTOR[p.sektor], nama: p.nama, lokasi: p.lokasi, prov_kode: kodeLokasi(p.lokasi), energi: energi ? 'inti' : /energi|nikel|smelter|hilirisasi|alumin|baja|petrokimia/i.test(p.nama) ? 'turunan' : null }, ay);
  }
  const PK = { 1: 'inti', 7: 'turunan', 22: 'inti', 23: 'inti', 10: 'turunan' };
  for (const g of program) {
    if (/^dihapus$/i.test(g.nama)) continue;
    const base = { id: 'psn-p' + String(g.no).padStart(2, '0'), no: g.no, tipe: 'program', sektor: 'program', nama: g.nama, lokasi: g.ket, prov_kode: [], energi: PK[g.no] || null };
    if (g.no === 1) { // empat butir ketenagalistrikan jadi baris tersendiri
      tambah({ ...base, nama: 'Pembangunan Infrastruktur Ketenagalistrikan (PIK), Program Ketenagalistrikan', lokasi: 'Daftar proyek diatur dalam Peraturan Presiden tentang Percepatan Pembangunan Infrastruktur Ketenagalistrikan', id: 'psn-p01a' }, P.butir.P1a);
      tambah({ ...base, nama: 'PLTS Atap Nasional (Program Ketenagalistrikan)', lokasi: 'Nasional', id: 'psn-p01b' }, P.butir.P1b);
      tambah({ ...base, nama: 'PLTS skala besar di Kepulauan Riau (Program Ketenagalistrikan)', lokasi: 'Provinsi Kepulauan Riau', prov_kode: ['21'], id: 'psn-p01c' }, P.butir.P1c);
      tambah({ ...base, nama: 'PLTA Sungai Mentarang (Program Ketenagalistrikan)', lokasi: 'Provinsi Kalimantan Utara', prov_kode: ['65'], id: 'psn-p01d' }, P.butir.P1d);
      continue;
    }
    if (g.no === 7) {
      SMELTER.forEach(([nama, lok, kom, kodes], i) => tambah({ id: 'psn-p07-' + (i + 1), no: 7, tipe: 'butir-program', sektor: 'smelter', nama, lokasi: lok, prov_kode: kodes, energi: 'turunan', komoditas: kom }, P.butir['S' + (i + 1)]));
      tambah({ ...base }, null);
      continue;
    }
    tambah(base, P.butir['P' + g.no]);
  }
  // PSEL: tautkan ke proyek.json
  const pj = baca('public/data/proyek.json').baris.filter((b) => /\(PSN nomor \d+\)/.test(b.nama)).map((b) => b.id);
  const psel = baris.find((b) => b.id === 'psn-p22'); if (psel) { psel.proyek_meti = pj; psel.dasar_hukum.push('perpres-109-2025'); psel.listrik_ebt = 'Pengolahan sampah menjadi energi listrik di kota besar; lihat 11 baris PSEL di pelacak proyek'; }
  const merauke = baris.find((b) => b.id === 'psn-p23'); if (merauke) merauke.dasar_hukum.push('inpres-16-2025');
  return {
    lapis: 'publik', dibangun_pada: tglDibuat,
    meta: {
      dasar: 'Permenko Perekonomian 16/2025 (Perubahan Kedelapan atas Permenko 7/2021), ditetapkan dan diundangkan 24 September 2025',
      jumlah_proyek: proyek.filter((p) => !/^dihapus$/i.test(p.nama)).length, jumlah_program: program.filter((p) => !/^dihapus$/i.test(p.nama)).length,
      catatan: 'Daftar resmi memuat nama dan lokasi saja. Nilai, status, progres, kapasitas, dan pihak diisi hanya bila ada sumber terbaca (kolom lengkap=1); sisanya sengaja kosong. Titik peta = pusat kabupaten atau provinsi, bukan batas proyek.',
      terbaru_dicek: 'Permenko 20/2025 hanya tata cara perubahan daftar; belum ditemukan perubahan kesembilan sampai 2026-11-08.',
    },
    regulasi: [
      { id: 'permenko-16-2025', judul: 'Permenko Perekonomian 16/2025 tentang Perubahan Kedelapan atas Permenko 7/2021 tentang Perubahan Daftar PSN', tanggal: '2025-09-24', url: 'https://peraturan.bpk.go.id/Details/330372/permenko-perekonomian-no-16-tahun-2025', bukti: 'resmi' },
      { id: 'permenko-20-2025', judul: 'Permenko Perekonomian 20/2025 tentang tata cara usulan, verifikasi, evaluasi, penetapan, pemantauan dan pelaporan perubahan daftar PSN', tanggal: null, url: 'https://peraturan.bpk.go.id/Details/343044/permenko-perekonomian-no-20-tahun-2025', bukti: 'resmi' },
      { id: 'perpres-89-2025', judul: 'Perpres 89/2025 tentang Perubahan Kedua atas Perpres 4/2016 tentang Percepatan Pembangunan Infrastruktur Ketenagalistrikan', tanggal: '2025-09-02', url: 'https://peraturan.bpk.go.id/Details/328989/perpres-no-89-tahun-2025', bukti: 'resmi' },
      { id: 'perpres-12-2025', judul: 'Perpres 12/2025 tentang Rencana Pembangunan Jangka Menengah Nasional 2025-2029', tanggal: '2025', url: null, bukti: 'resmi' },
      { id: 'perpres-109-2020', judul: 'Perpres 109/2020 tentang Perubahan Ketiga atas Perpres 3/2016 tentang Percepatan Pelaksanaan PSN', tanggal: '2020', url: null, bukti: 'resmi' },
      { id: 'perpres-109-2025', judul: 'Perpres 109/2025 tentang Penanganan Sampah Perkotaan melalui Pengolahan Sampah menjadi Energi Terbarukan', tanggal: '2025', url: null, bukti: 'resmi' },
      { id: 'inpres-16-2025', judul: 'Inpres 16/2025 tentang Penguatan Percepatan Pembangunan Kawasan Swasembada Pangan, Energi, dan Air', tanggal: '2025', url: null, bukti: 'resmi' },
    ],
    baris,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = bangun(new Date().toISOString().slice(0, 10));
  fs.writeFileSync(path.join(ROOT, 'public/data/psn.json'), JSON.stringify(d));
  const per = {}; for (const b of d.baris) per[b.sektor] = (per[b.sektor] || 0) + 1;
  console.log(d.baris.length, 'baris', JSON.stringify(per), 'lengkap', d.baris.filter((b) => b.lengkap).length, 'tanpa titik', d.baris.filter((b) => b.lat == null).length);
}
