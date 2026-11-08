#!/usr/bin/env node
// Peta politik energi DPR -> public/data/dpr_energi.json. Anggota Komisi XII DPR 2024-2029 (energi, sumber daya mineral, lingkungan, investasi),
// sikap tercatat, agenda rapat, status RUU EBET. Hasil riset 8 Nov 2026 (halaman DPR, Tempo, Kompas via pencarian, media). Netral: parafrase
// pernyataan bertanggal bersumber, tanpa penilaian. Tanpa data kontak, tanpa foto (inisial berlambang fraksi). Dikecualikan: anggota yang
// meninggalkan DPR (Mukhtarudin, dilantik Menteri P2MI 8 Sep 2025) dan yang terkait perkara KPK (tidak ditemukan satu pun pada pencarian).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TANGGAL = '2026-11-08';
const K = { 'Sumatera Selatan': '16', 'Sulawesi Selatan': '73', 'Kalimantan Barat': '61', 'Kalimantan Tengah': '62', 'Papua Pegunungan': '95', 'Jawa Tengah': '33', 'DI Yogyakarta': '34', 'Papua Barat': '92', Jambi: '15', Gorontalo: '75', 'Sulawesi Utara': '71', 'Jawa Barat': '32', 'Jawa Timur': '35', 'Sumatera Utara': '12', Riau: '14', 'Nusa Tenggara Timur': '53', 'Sumatera Barat': '13', 'Kalimantan Timur': '64', Aceh: '11', Lampung: '18', 'Kepulauan Bangka Belitung': '19', 'DKI Jakarta': '31', Banten: '36' };
export const FRAKSI = [
  { id: 'pdip', singkat: 'PDI-P', nama: 'Fraksi Partai Demokrasi Indonesia Perjuangan' },
  { id: 'golkar', singkat: 'Golkar', nama: 'Fraksi Partai Golongan Karya' },
  { id: 'gerindra', singkat: 'Gerindra', nama: 'Fraksi Partai Gerakan Indonesia Raya' },
  { id: 'nasdem', singkat: 'NasDem', nama: 'Fraksi Partai NasDem' },
  { id: 'pkb', singkat: 'PKB', nama: 'Fraksi Partai Kebangkitan Bangsa' },
  { id: 'pks', singkat: 'PKS', nama: 'Fraksi Partai Keadilan Sejahtera' },
  { id: 'pan', singkat: 'PAN', nama: 'Fraksi Partai Amanat Nasional' },
  { id: 'demokrat', singkat: 'Demokrat', nama: 'Fraksi Partai Demokrat' },
];
// [nama, fraksi, dapil (nomor), jabatan di komisi]
const A = [
  ['Melchias Markus Mekeng', 'golkar', 'Nusa Tenggara Timur', 'ketua'],
  ['Dony Maryadi Oekon', 'pdip', 'Jawa Barat XI', 'wakil'], ['Bambang Haryadi', 'gerindra', 'Jawa Timur IV', 'wakil'], ['Sugeng Suparwoto', 'nasdem', 'Jawa Tengah VIII', 'wakil'], ['Putri Zulkifli Hasan', 'pan', 'Lampung I', 'wakil'],
  ['Bambang Patijaya', 'golkar', 'Kepulauan Bangka Belitung', 'anggota'],
  ['Bambang Wuryanto', 'pdip', 'Jawa Tengah IV'], ['Yulian Gunhar', 'pdip', 'Sumatera Selatan I'], ['Ridwan Andi Wittiri', 'pdip', 'Sulawesi Selatan I'], ['Cornelis', 'pdip', 'Kalimantan Barat I'], ['Sigit Karyawan Yunianto', 'pdip', 'Kalimantan Tengah'], ['Arif Riyanto Uopdana', 'pdip', 'Papua Pegunungan'], ['Shanty Alda Nathalia', 'pdip', 'Jawa Tengah IX'],
  ['Gandung Pardiman', 'golkar', 'DI Yogyakarta'], ['Alfons Manibui', 'golkar', 'Papua Barat'], ['Cek Endra', 'golkar', 'Jambi'], ['Rusli Habibie', 'golkar', 'Gorontalo'], ['Christiany Eugenia Tetty Paruntu', 'golkar', 'Sulawesi Utara'], ['Dewi Yustisiana', 'golkar', 'Sumatera Selatan II'],
  ['Rokhmat Ardiyan', 'gerindra', 'Jawa Barat X'], ['Moreno Soeprapto', 'gerindra', 'Jawa Timur V'], ['Ramson Siagian', 'gerindra', 'Jawa Tengah X'], ['Ade Jona Prasetyo', 'gerindra', 'Sumatera Utara I'], ['Muhammad Rohid', 'gerindra', 'Riau II'], ['Rocky Candra', 'gerindra', 'Jambi'],
  ['Ratna Juwita Sari', 'pkb', 'Jawa Timur IX'], ['Dipo Nusantara Pua Upa', 'pkb', 'Nusa Tenggara Timur I'], ['Rico Alviano', 'pkb', 'Sumatera Barat I'], ['Iyeth Bustami', 'pkb', 'Riau I'], ['Syafruddin', 'pkb', 'Kalimantan Timur'],
  ['Irsan Sosiawan', 'nasdem', 'Aceh II'], ['Cheroline Chrisye Makalew', 'nasdem', 'Papua Barat'], ['Gulam Mohamad Sharon', 'nasdem', 'Kalimantan Barat II'], ['Syarif Fasha', 'nasdem', 'Jambi'],
  ['Muhammad Haris', 'pks', 'Jawa Tengah I'], ['Nevi Zuairina', 'pks', 'Sumatera Barat II'], ['Jalal Abdul Nasir', 'pks', 'Jawa Barat VII'], ['Meitri Citra Wardani', 'pks', 'Jawa Timur VIII'],
  ['Aqib Ardiansyah', 'pan', 'Jawa Tengah VII'], ['Eddy Soeparno', 'pan', 'Jawa Barat III'], ['Totok Daryanto', 'pan', 'DI Yogyakarta'],
  ['Edhie Baskoro Yudhoyono', 'demokrat', 'Jawa Timur VII'], ['Mulyadi', 'demokrat', 'Sumatera Barat II'], ['Nurwayah', 'demokrat', 'DKI Jakarta III'], ['Zulfikar Hamonangan', 'demokrat', 'Banten III'],
];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const prov = (d) => d.replace(/\s+[IVX]+$/, '');
const anggota = A.map(([nama, fraksi, dapil, jabatan]) => ({ id: slug(nama), nama, fraksi, dapil, dapil_provinsi: prov(dapil), kode_provinsi: K[prov(dapil)] ?? null, jabatan: jabatan ?? 'anggota',
  catatan: nama === 'Bambang Patijaya' ? { id: 'Ketua Komisi XII 4 November 2024 sampai 26 Agustus 2026; kini Kepala Kelompok Fraksi Golkar di komisi yang sama.', en: 'Chair of Commission XII from 4 November 2024 to 26 August 2026; now head of the Golkar group in the same commission.' }
    : nama === 'Melchias Markus Mekeng' ? { id: 'Dilantik sebagai ketua 26 Agustus 2026 (surat Fraksi Golkar 14 Agustus 2026); nomor dapil tidak terverifikasi, hanya provinsi.', en: 'Sworn in as chair on 26 August 2026 (Golkar faction letter of 14 August 2026); constituency number not verified, province only.' } : null }));
const SM = {
  dpr_ebet: { judul: 'RUU EBET terus diprioritaskan, beri kepastian hukum transisi energi', media: 'DPR RI (Parlementaria)', url: 'https://www.dpr.go.id/kegiatan-dpr/berita/RUU-EBET-Terus-Diprioritaskan-Beri-Kepastian-Hukum-Transisi-Energi-67982', tingkat_bukti: 'resmi' },
  li_meti: { judul: 'RUU EBET kembali didorong, isu power wheeling jadi titik krusial', media: 'Listrik Indonesia', url: 'https://listrikindonesia.com/detail/21133/ruu-ebet-kembali-didorong-power-wheeling-jadi-titik-krusial', tingkat_bukti: 'media' },
  dpr_nuklir: { judul: 'Segera tuntaskan masalah aset radioaktif dan kelembagaan nuklir', media: 'DPR RI (Parlementaria)', url: 'https://www.dpr.go.id/kegiatan-dpr/berita/Segera-Tuntaskan-Masalah-Aset-Radioaktif-dan-Kelembagaan-Nuklir-68913', tingkat_bukti: 'resmi' },
  aksara: { judul: 'Komisi XII DPR RI warning proyek PLTN Babel, rekam jejak dipertanyakan', media: 'Aksara Newsroom', url: 'https://aksaranewsroom.id/2026/02/15/komisi-xii-dpr-ri-warning-proyek-pltn-babel-rekam-jejak-dipertanyakan/', tingkat_bukti: 'media' },
  katadata: { judul: 'Komisi XII usulkan pensiun dini PLTU Cirebon-1 dikaji ulang', media: 'Katadata', url: 'https://katadata.co.id/ekonomi-hijau/energi-baru/692d40a714b8d/komisi-xii-usulkan-pensiun-dini-pltu-cirebon-1-dikaji-ulang', tingkat_bukti: 'media' },
  warta: { judul: 'DPR: biaya pensiun dini PLTU Cirebon 1 dan Suralaya capai Rp25 triliun', media: 'Warta Ekonomi', url: 'https://wartaekonomi.co.id/read565036/dpr-biaya-pensiun-dini-pltu-cirebon-1-dan-suralaya-capai-rp25-triliun', tingkat_bukti: 'media' },
  viva: { judul: 'Komisi XII bakal pastikan pengembangan EBT di 15 provinsi bukan sekadar proyek mercusuar', media: 'VIVA', url: 'https://www.viva.co.id/bisnis/1834942-komisi-xii-bakal-pastikan-pengembangan-ebt-di-15-provinsi-bukan-sekadar-proyek-mercusuar', tingkat_bukti: 'media' },
  warta_pln: { judul: 'Di depan Komisi XII DPR, Dirut PLN paparkan progres proyek EBT 22,57 GW', media: 'Warta Ekonomi', url: 'https://wartaekonomi.co.id/read615220/di-depan-komisi-xii-dpr-dirut-pln-paparkan-progres-proyek-ebt-2257-gw', tingkat_bukti: 'media' },
  emedia: { judul: 'Komisi XII setujui pagu anggaran KESDM 2027 Rp27,37 triliun', media: 'DPR RI (eMedia)', url: 'https://emedia.dpr.go.id/news/2026/09/01/komisi-xii-setujui-pagu-anggaran-kesdm-2027-rp2737-triliun', tingkat_bukti: 'resmi' },
  tempo: { judul: 'Melchias Mekeng dilantik menjadi Ketua Komisi Energi DPR', media: 'Tempo', url: 'https://www.tempo.co/ekonomi/melchias-mekeng-ketua-komisi-xii-dpr-2283907', tingkat_bukti: 'media' },
};
const P = (d, i, e, topik, anggotaId, sm, ket) => ({ id: `${d}-${anggotaId}-${topik[0]}`, anggota: anggotaId, topik, tanggal: d, parafrase: { id: i, en: e }, sumber_id: sm, ket });
const SIKAP = [
  P('2026-08-14', 'Menyatakan Komisi XII berkomitmen memprioritaskan RUU EBET agar menjadi undang-undang pada 2026 sebagai payung hukum transisi energi dan investasi hijau; revisi UU Ketenagalistrikan dikerjakan setelah RUU EBET selesai.', 'Said Commission XII is committed to prioritising the EBET bill so it becomes law in 2026 as the legal framework for the energy transition and green investment; the Electricity Law revision follows once the EBET bill is done.', ['ruu-ebet', 'power-wheeling'], 'ratna-juwita-sari', 'dpr_ebet', 'wawancara Parlementaria'),
  P('2026-09-08', 'Menyebut power wheeling sebagai celah utama regulasi ketenagalistrikan untuk transisi energi; terbuka merumuskan ulang konsepnya, dengan opsi sewa jaringan yang menurutnya lebih jelas karena aset jaringan milik PLN.', 'Called power wheeling the main gap in electricity regulation for the transition; open to redesigning the concept, with network leasing as an option he considers clearer because the grid belongs to PLN.', ['power-wheeling', 'ruu-ebet'], 'bambang-patijaya', 'li_meti', 'RDPU dengan METI'),
  P('2026-09-08', 'Mengakui RUU EBET masih pekerjaan rumah DPR dan menekankan perlunya payung hukum kuat; menurutnya sekitar USD 1,2 miliar proyek bersih siap dibiayai dan hambatannya kepastian PPA, bukan regulasi, teknologi, atau dana.', 'Acknowledged the EBET bill is still unfinished business and stressed a strong legal basis; in his view about USD 1.2 billion of clean projects are ready for financing and the bottleneck is PPA certainty, not regulation, technology or funding.', ['ruu-ebet'], 'eddy-soeparno', 'li_meti', 'RDPU dengan METI'),
  P('2026-09-09', 'Mendesak pemerintah segera menuntaskan tata kelola kelembagaan nuklir dan aset terkontaminasi radioaktif PT INUKI, dengan alasan RUPTL 2025-2034 sudah memuat 500 MW nuklir dan target PLTN pertama 2032.', 'Urged the government to settle nuclear governance and radioactive-contaminated assets of PT INUKI, noting the 2025-2034 RUPTL already includes 500 MW of nuclear and a first plant targeted for 2032.', ['nuklir'], 'sugeng-suparwoto', 'dpr_nuklir', 'RDP dengan BAPETEN dan BIG'),
  P('2026-02-12', 'Menyatakan tidak menolak PLTN di Indonesia tetapi mempertanyakan rekam jejak dan kapasitas teknis PT ThorCon Power Indonesia; hanya akan mendukung proyek yang dijalankan perusahaan besar yang terbukti, dan menegaskan PLTN urusan pemerintah pusat.', 'Said he does not oppose nuclear power but questioned the track record and technical capacity of PT ThorCon Power Indonesia; would support only a project run by a large proven company, and noted nuclear is a central government matter.', ['nuklir'], 'bambang-patijaya', 'aksara', 'keterangan kepada wartawan di Pangkalpinang'),
  P('2025-11', 'Mengusulkan pemerintah mengkaji ulang rencana pensiun dini PLTU Cirebon-1 karena pekerja setempat dan pasokan listrik industri yang berpindah ke Cirebon dan Jawa Tengah; juga mendorong investor mendahulukan pensiun PLTU yang kurang ramah lingkungan.', 'Proposed the government review the early retirement plan for PLTU Cirebon-1 because of local workers and electricity supply for industry relocating to Cirebon and Central Java; also urged investors to retire the less environmentally friendly plants first.', ['pltu'], 'jalal-abdul-nasir', 'katadata', 'kunjungan kerja awal November 2025 (hari tepatnya tidak disebut; terbit 1 Desember 2025)'),
  P('2025-04-26', 'Menilai pensiun dini PLTU seperti Cirebon 1 dan Suralaya perlu kajian cermat soal pengganti EBT dan pendanaan; memperkirakan biaya sekitar Rp25 triliun dan tetap mendukung programnya bila syarat pengganti dan dana terpenuhi.', 'Said early retirement of plants such as Cirebon 1 and Suralaya needs careful study of renewable replacement and funding; estimated about Rp25 trillion and still supports the programme if replacement and funding conditions are met.', ['pltu'], 'eddy-soeparno', 'warta', 'pernyataan kepada media'),
  P('2025-07-01', 'Menyatakan Komisi XII akan memantau penyerapan tenaga kerja lokal, pencapaian TKDN 40 persen, dan dampak nyata proyek EBT Rp25 triliun di 15 provinsi (8 PLTP dan 47 PLTS), agar bukan sekadar proyek mercusuar.', 'Said Commission XII will monitor local job creation, the 40 percent local-content (TKDN) target and real impact of the Rp25 trillion renewable programme in 15 provinces (8 geothermal and 47 solar plants), so it is not merely a showpiece.', ['tkdn'], 'dewi-yustisiana', 'viva', 'pernyataan kepada media'),
];
const AGENDA = [
  { tanggal: '2026-06-04', jenis: 'RDP', judul: { id: 'Rapat dengan Dirjen Ketenagalistrikan, Dirjen EBTKE, dan Dirut PLN', en: 'Hearing with the Directors General of Electricity and EBTKE and PLN\'s president director' }, hasil: { id: 'PLN melaporkan proyek EBT dalam eksekusi 22,57 GW per Mei 2026, bagian dari 52,8 GW target EBT dan penyimpanan RUPTL 2025-2034; sekitar 43 persen sedang dieksekusi.', en: 'PLN reported 22.57 GW of renewable projects under execution as of May 2026, part of the 52.8 GW renewables and storage target in the 2025-2034 RUPTL; about 43 percent is being executed.' }, sumber_id: 'warta_pln' },
  { tanggal: '2026-08-26', jenis: 'Pimpinan', judul: { id: 'Pelantikan Melchias Markus Mekeng sebagai Ketua Komisi XII', en: 'Inauguration of Melchias Markus Mekeng as Chair of Commission XII' }, hasil: { id: 'Menggantikan Bambang Patijaya atas surat Fraksi Golkar; Tempo (versi Inggris) melaporkan dari sumber anonim bahwa pergantian terkait pembahasan ulang revisi UU Migas, yang belum dikonfirmasi pihak terkait.', en: 'Replaced Bambang Patijaya on a Golkar faction letter; Tempo (English) reported from anonymous sources a link to the renewed discussion of the Oil and Gas Law revision, not confirmed by the parties.' }, sumber_id: 'tempo' },
  { tanggal: '2026-08-31', jenis: 'Raker', judul: { id: 'Persetujuan pagu anggaran Kementerian ESDM 2027', en: 'Approval of the 2027 Energy Ministry budget ceiling' }, hasil: { id: 'Komisi XII menyetujui pagu Rp27,37 triliun; Ditjen EBTKE memperoleh Rp1,81 triliun untuk kompor listrik, konversi motor listrik, dan PLTMH.', en: 'Commission XII approved a Rp27.37 trillion ceiling; the Directorate General of EBTKE received Rp1.81 trillion for electric stoves, e-motorcycle conversion and micro-hydro.' }, sumber_id: 'emedia' },
  { tanggal: '2026-09-08', jenis: 'RDPU', judul: { id: 'Rapat dengar pendapat umum dengan METI soal RUU EBET', en: 'Public hearing with METI on the EBET bill' }, hasil: { id: 'Anggota membahas power wheeling, sewa jaringan, dan kepastian PPA; Ketua METI Norman Ginting menyebut power wheeling sudah punya dasar di regulasi dan RUU EBET dapat memperjelas pemakaian jaringan.', en: 'Members discussed power wheeling, network leasing and PPA certainty; METI chair Norman Ginting said power wheeling already has a basis in regulation and the EBET bill could clarify grid use.' }, sumber_id: 'li_meti' },
  { tanggal: '2026-09-09', jenis: 'RDP', judul: { id: 'Rapat dengan BAPETEN dan BIG', en: 'Hearing with BAPETEN and BIG' }, hasil: { id: 'BAPETEN memaparkan target PLTN pertama beroperasi komersial 2032 dan kapasitas bertahap 7 GW lalu 35 GW; penyimpanan limbah radioaktif nasional di BRIN disebut terisi 88,5 persen.', en: 'BAPETEN presented a first commercial nuclear plant by 2032 and staged capacity of 7 GW then 35 GW; national radioactive waste storage at BRIN was said to be 88.5 percent full.' }, sumber_id: 'dpr_nuklir' },
];
export function rakit() {
  const fr = FRAKSI.map((f) => ({ ...f, jumlah: anggota.filter((a) => a.fraksi === f.id).length }));
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, periode: '2024-2029',
    komisi: { nama: 'Komisi XII DPR RI', bidang: { id: 'Energi dan sumber daya mineral, lingkungan hidup, investasi', en: 'Energy and mineral resources, environment, investment' }, jumlah_kursi: 45, jumlah_terdaftar: anggota.length },
    fraksi: fr, anggota, sikap: SIKAP.sort((a, b) => b.tanggal.localeCompare(a.tanggal)), agenda: AGENDA.sort((a, b) => b.tanggal.localeCompare(a.tanggal)), sumber: SM,
    ruu_ebet: {
      status: { id: 'Masuk daftar prioritas Prolegnas 2026; pembahasan disebut telah sampai tahap krusial tanpa menyebut tahap formalnya; target selesai 2026. Revisi UU Ketenagalistrikan menyusul setelahnya.', en: 'In the 2026 Prolegnas priority list; deliberations described as at a crucial stage without naming the formal stage; targeted to finish in 2026. The Electricity Law revision follows.' },
      sumber_id: 'dpr_ebet', tanggal: '2026-08-14',
      catatan: { id: 'Sumber berbeda soal power wheeling: Parlementaria menyebut RUU dimaksudkan memperjelas aturannya, sedangkan pembahasan RDPU 8 September 2026 mencatat power wheeling belum masuk draf dan perlu dirumuskan ulang.', en: 'Sources differ on power wheeling: Parlementaria says the bill is meant to clarify its rules, while the 8 September 2026 hearing notes it is not yet in the draft and needs redesign.' },
    },
    meta: {
      jumlah_anggota: anggota.length, diperbarui: TANGGAL,
      celah: [
        'Daftar anggota dari halaman Wikipedia Komisi XII (45 kursi) disesuaikan: Mukhtarudin dikeluarkan (Menteri P2MI sejak 8 September 2025) dan Melchias Markus Mekeng ditambahkan (ketua sejak 26 Agustus 2026). Pengganti antarwaktu Mukhtarudin dan rotasi anggota Golkar lain Agustus 2026 tidak teridentifikasi: cek dpr.go.id.',
        'Nomor dapil bersumber Wikipedia dan belum dicek satu per satu ke dpr.go.id; Mekeng hanya provinsi.',
        'Foto resmi dpr.go.id tidak dipakai (lisensi tidak jelas): ditampilkan inisial berwarna fraksi. Tanpa kontak pribadi.',
        'Sikap yang dicatat hanya yang ditemukan bersumber dengan tanggal; ketiadaan baris untuk seorang anggota bukan berarti tanpa sikap. Tidak ada pernyataan TKDN yang ditemukan dari sidang resmi, hanya dari kunjungan.',
        'Tidak ditemukan anggota Komisi XII yang terkait perkara KPK atau wafat pada pencarian 8 November 2026; pemeriksaan ulang berkala diperlukan.',
        'Agenda rapat Oktober-November 2026 tidak ditemukan pada pencarian; Antara tidak dipakai sebagai sumber.',
      ],
    },
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const d = rakit();
  fs.writeFileSync(path.join(AKAR, 'public/data/dpr_energi.json'), JSON.stringify(d));
  console.log('dpr_energi.json:', d.anggota.length, 'anggota,', d.sikap.length, 'sikap,', d.agenda.length, 'agenda');
}
