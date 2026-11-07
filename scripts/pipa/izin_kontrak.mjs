// Perizinan dan kontrak (informasi): tanya jawab izin per jenis pembangkit, kamus klausul PPA/PJBL beserta risikonya, lead time AMDAL ke COD.
// Isi kurasi di bawah SEMUA dibaca dari teks resmi (pdftotext) pada 8 Nov 2026: Permen ESDM 11/2021, Permen ESDM 2/2024, Perpres 112/2022, UU 25/1992 (tautan bpk).
// Kolom "risiko" = bacaan METI atas pasal (EST), bukan bunyi pasal. Pakai: node scripts/pipa/izin_kontrak.mjs [--tanggal=YYYY-MM-DD]. Keluaran: public/data/izin_kontrak.json.
import fs from 'node:fs';
import path from 'node:path';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const baca = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', f), 'utf-8'));
const TANGGAL = (process.argv.find((a) => a.startsWith('--tanggal=')) || '--tanggal=2026-11-08').slice(10);

export const DOK = {
  p112: { nama: 'Perpres 112/2022', url: 'https://peraturan.bpk.go.id/Details/225308', pdf: 'https://peraturan.bpk.go.id/Download/219946/Perpres%20Nomor%20112%20Tahun%202022.pdf' },
  m11: { nama: 'Permen ESDM 11/2021', url: 'https://peraturan.bpk.go.id/Details/175261', pdf: 'https://peraturan.bpk.go.id/Download/168537/Permen%20ESDM%20No.%2011%20Tahun%202021.pdf' },
  m2: { nama: 'Permen ESDM 2/2024', url: 'https://peraturan.bpk.go.id/Details/288519', pdf: 'https://peraturan.bpk.go.id/Download/347764/Permen%20ESDM%20Nomor%202%20Tahun%202024.pdf' },
  pp28: { nama: 'PP 28/2025', url: 'https://peraturan.bpk.go.id/Details/319773', pdf: 'https://peraturan.bpk.go.id/Download/381375/PP%20Nomor%2028%20Tahun%202025.pdf' },
  uu25: { nama: 'UU 25/1992', url: 'https://peraturan.bpk.go.id/Details/46650/uu-no-25-tahun-1992', pdf: 'https://peraturan.bpk.go.id/Download/35388/UU%20Nomor%2025%20Tahun%201992.pdf' },
};
const p = (dok, pasal) => ({ dok, pasal });
const bi = (id, en) => ({ id, en });

// jenis: umum | surya | bayu | hidro | panas-bumi | bioenergi
export const TANYA = [
  { id: 'iuptlu', jenis: 'umum', q: bi('Apakah penjual listrik ke PLN wajib memiliki izin usaha?', 'Must a seller of power to PLN hold a business licence?'),
    a: bi('Badan usaha yang menjalankan usaha penyediaan tenaga listrik untuk kepentingan umum wajib memiliki IUPTLU. IUPTLU berlaku paling lama 30 tahun dan dapat diperpanjang. Tata cara permohonan mengikuti peraturan perizinan berusaha sektor ESDM.', 'A business that supplies electricity for the public interest must hold an IUPTLU. It is valid for up to 30 years and can be extended. Applications follow the energy-sector business licensing rules.'),
    pasal: [p('m11', 'Pasal 11 ayat (1) dan (3), Pasal 12 ayat (1)')] },
  { id: 'iuptls', jenis: 'umum', q: bi('Kapan pembangkit untuk kepentingan sendiri butuh izin, kapan cukup lapor?', 'When does a captive plant need a licence, and when is a report enough?'),
    a: bi('Total kapasitas pembangkit lebih dari 500 kW dalam satu sistem instalasi wajib IUPTLS (berlaku paling lama 10 tahun, perpanjangan diajukan paling lambat 60 hari kerja sebelum berakhir). Sampai dengan 500 kW cukup menyampaikan laporan satu kali kepada Menteri melalui Dirjen atau kepada gubernur.', 'Total generation above 500 kW in one installation system needs an IUPTLS (valid up to 10 years; renewal applied for at least 60 working days before expiry). Up to 500 kW only one report to the Minister through the Director General, or to the governor, is required.'),
    pasal: [p('m11', 'Pasal 39 ayat (2) sampai (4), Pasal 40 ayat (2) dan (3)')] },
  { id: 'plts-atap', jenis: 'surya', q: bi('Apa izin untuk PLTS atap yang tersambung ke jaringan PLN?', 'What approvals does a grid-connected rooftop solar system need?'),
    a: bi('Total kapasitas inverter lebih dari 500 kW wajib IUPTLS; sampai 500 kW cukup lapor satu kali sebelum pemasangan. Pemasangan hanya setelah persetujuan pemegang IUPTLU, dikerjakan badan usaha. Sistem wajib SLO, kecuali sistem sampai 500 kW berkontrol panel terpadu (plug and play) yang cukup dengan surat pernyataan keselamatan beserta dokumen pendukung.', 'Total inverter capacity above 500 kW needs an IUPTLS; up to 500 kW a single report before installation is enough. Installation may proceed only after the IUPTLU holder approves, and must be done by a business entity. An SLO is mandatory, except plug-and-play systems up to 500 kW, which need a safety statement with supporting documents.'),
    pasal: [p('m2', 'Pasal 17 sampai 19, Pasal 21 dan 22, Pasal 24 dan 25')] },
  { id: 'plts-atap-tanpa-izin', jenis: 'surya', q: bi('Apa akibatnya memasang PLTS atap sebelum disetujui PLN?', 'What happens if rooftop solar is connected before approval?'),
    a: bi('Pemegang IUPTLU memberi surat pemberitahuan untuk memutus sistem dari jaringan dan membayar pinalti sebesar kapasitas total inverter dikali 240 jam dikali tarif listrik. Bila tidak dipenuhi dalam satu bulan, layanan pelanggan dapat diputus sementara.', 'The IUPTLU holder sends a notice to disconnect the system and pay a penalty of total inverter capacity times 240 hours times the electricity tariff. If not complied with within one month, service may be temporarily cut.'),
    pasal: [p('m2', 'Pasal 23 ayat (1) dan (2)')] },
  { id: 'surya-bayu-ipp', jenis: 'surya', q: bi('Bagaimana PLN membeli listrik dari PLTS dan PLTB milik badan usaha?', 'How does PLN buy power from privately built solar and wind plants?'),
    a: bi('Melalui pemilihan langsung untuk semua kapasitas, dengan atau tanpa baterai. Harga memakai harga patokan tertinggi (negosiasi dengan batas atas, tanpa eskalasi) atau harga kesepakatan yang wajib disetujui Menteri. Fasilitas baterai dihargai paling tinggi 60 persen dari harga pembelian listrik; fasilitas jaringan paling tinggi 30 persen.', 'Through direct selection for all capacities, with or without batteries. The price is either the ceiling price (negotiated up to the ceiling, without escalation) or an agreed price that the Minister must approve. Battery facilities are priced at most 60 percent of the power purchase price; grid facilities at most 30 percent.'),
    pasal: [p('p112', 'Pasal 5, 6, 8, 9 ayat (1) huruf c, Pasal 10, Pasal 14 ayat (4) huruf b')] },
  { id: 'hidro', jenis: 'hidro', q: bi('Apa yang khusus untuk PLTA dan PLTMH?', 'What is specific to hydropower and mini-hydro?'),
    a: bi('PLTA dibeli lewat pemilihan langsung; PLTA pada waduk atau saluran irigasi multiguna milik negara lewat penunjukan langsung. PLTA aliran atau terjunan sungai sampai 5 MW harus mampu beroperasi dengan faktor kapasitas paling sedikit 60 persen. Pembelian memakai penawaran kuota kapasitas yang ditetapkan Menteri.', 'Hydropower is procured by direct selection; plants on multipurpose state-owned reservoirs or irrigation canals by direct appointment. Run-of-river plants up to 5 MW must be able to operate at a capacity factor of at least 60 percent. Purchases use a capacity quota offer set by the Minister.'),
    pasal: [p('p112', 'Pasal 14 ayat (2) huruf a dan ayat (4) huruf a, Pasal 18 ayat (1), Pasal 19')] },
  { id: 'panas-bumi', jenis: 'panas-bumi', q: bi('Bagaimana kontrak listrik panas bumi berbeda?', 'How is a geothermal power contract different?'),
    a: bi('Penunjukan langsung untuk pemegang izin pengusahaan panas bumi (IPB) dan sejenisnya, yang berlaku sebagai penugasan pembelian. Harga patokan tertinggi menjadi harga dasar dengan eskalasi selama jangka waktu PJBL atau PJBU. Pemerintah dapat memberi dukungan penanggungan risiko eksplorasi dan fasilitas pembiayaan.', 'Direct appointment for geothermal business licence holders and equivalents, which counts as a purchase assignment. The ceiling price is the base price with escalation over the PPA or steam contract term. The government may provide exploration risk mitigation and financing facilities.'),
    pasal: [p('p112', 'Pasal 6 ayat (2), Pasal 14 ayat (2) huruf b dan ayat (3), Pasal 27')] },
  { id: 'bioenergi', jenis: 'bioenergi', q: bi('Apa syarat khusus pembangkit biomassa dan biogas?', 'What are the special requirements for biomass and biogas plants?'),
    a: bi('Pembelian dilakukan lewat pemilihan langsung, hanya terhadap badan usaha yang memiliki pasokan bahan bakar (feedstock) cukup untuk kelangsungan operasi selama masa PJBL.', 'Procurement is by direct selection, only for entities with enough fuel feedstock supply to keep operating throughout the PPA term.'),
    pasal: [p('p112', 'Pasal 14 ayat (4) huruf c, Pasal 19 ayat (1) huruf b')] },
  { id: 'waktu', jenis: 'umum', q: bi('Berapa lama batas waktu proses dari dokumen sampai tanda tangan PJBL?', 'What is the time limit from document submission to signing the PPA?'),
    a: bi('Penunjukan langsung: paling lama 90 hari kalender. Pemilihan langsung (termasuk negosiasi harga): paling lama 180 hari kalender. Hasil seleksi awal badan usaha diterbitkan PLN berkala setiap 3 bulan.', 'Direct appointment: at most 90 calendar days. Direct selection (including price negotiation): at most 180 calendar days. PLN publishes the pre-selected provider list every 3 months.'),
    pasal: [p('p112', 'Pasal 15 ayat (1), Pasal 16 ayat (2), Pasal 17 ayat (3)')] },
  { id: 'insentif', jenis: 'umum', q: bi('Insentif apa yang dijanjikan untuk pembangkit EBT?', 'What incentives are promised for renewable plants?'),
    a: bi('Insentif fiskal (PPh, bea masuk dan pajak impor, PBB), dukungan pengembangan panas bumi, serta fasilitas pembiayaan atau penjaminan lewat BUMN. Insentif nonfiskal dapat diberikan pemerintah pusat dan/atau pemerintah daerah; pemerintah daerah wajib mendukung sesuai kewenangannya.', 'Fiscal incentives (income tax, import duty and tax, land and building tax), geothermal support, and financing or guarantee facilities through state-owned enterprises. Non-fiscal incentives may come from central and/or regional governments; regional governments must support within their authority.'),
    pasal: [p('p112', 'Pasal 22 ayat (2) dan (3), Pasal 23 ayat (1)')] },
  { id: 'oss', jenis: 'umum', q: bi('Lewat jalur apa permohonan izin ketenagalistrikan diajukan?', 'Through which channel are electricity licences applied for?'),
    a: bi('Kedua Permen menyerahkan syarat dan tata cara ke peraturan perizinan berusaha sektor ESDM dan perizinan berusaha berbasis risiko. Dasar umum perizinan berbasis risiko saat ini PP 28/2025 (menggantikan PP 5/2021); isi pasalnya belum dibaca di sini, buka naskah sebelum dipakai.', 'Both ministerial regulations refer requirements and procedures to the energy-sector business licensing rules and risk-based business licensing. The general basis is now Government Regulation 28/2025 (replacing 5/2021); its articles were not read here, so check the text before relying on it.'),
    pasal: [p('m11', 'Pasal 11 ayat (3), Pasal 40 ayat (1)'), p('m2', 'Pasal 20'), p('pp28', 'judul saja')], verifikasi: 'PP 28/2025: baru judul dan status dari direktori regulasi' },
  { id: 'koperasi', jenis: 'umum', q: bi('Bagaimana koperasi bisa menjadi pengelola pembangkit?', 'How can a cooperative operate a power plant?'),
    a: bi('Koperasi primer dibentuk sekurang-kurangnya 20 orang dengan akta pendirian dan memperoleh status badan hukum setelah disahkan Pemerintah. Izin kelistrikan mengikuti ambang kapasitas yang sama dengan badan usaha lain (laporan sampai 500 kW, IUPTLS di atasnya). Lihat panduan lengkap di halaman desa energi.', 'A primary cooperative is formed by at least 20 people with a deed of establishment and gains legal-entity status once the Government approves it. Electricity licensing follows the same capacity thresholds as other entities (report up to 500 kW, IUPTLS above). See the full guide on the village energy page.'),
    pasal: [p('uu25', 'Pasal 6 ayat (1), Pasal 7 ayat (1), Pasal 9'), p('m11', 'Pasal 39')] },
];

export const KLAUSUL = [
  { id: 'harga', nama: bi('Harga patokan tertinggi atau harga kesepakatan', 'Ceiling price or agreed price'),
    arti: bi('Harga pembelian listrik oleh PLN: batas atas dalam lampiran Perpres, atau harga hasil negosiasi yang wajib disetujui Menteri. Harga di PJBL berlaku sejak COD dan dievaluasi tiap tahun terhadap rata-rata kontrak terbaru PLN.', 'The power purchase price: a ceiling in the presidential regulation annex, or a negotiated price needing ministerial approval. The PPA price applies from COD and the ceiling is reviewed yearly against PLN\'s latest average contracts.'),
    risiko: bi('Pengembang: harga tak bisa melampaui batas atas, dan batas atas bisa berubah lewat evaluasi tahunan untuk kontrak berikutnya. PLN: harga kesepakatan di atas patokan butuh persetujuan.', 'Developer: price cannot exceed the ceiling, and the ceiling can change through yearly review for later contracts. PLN: an agreed price above the ceiling needs approval.'),
    pasal: [p('p112', 'Pasal 5 ayat (1), (3), (4); Pasal 6 ayat (1) dan (3)')], risiko_tingkat: 'sedang' },
  { id: 'eskalasi', nama: bi('Eskalasi harga', 'Price escalation'),
    arti: bi('Kenaikan harga terjadwal selama masa kontrak. Harga patokan untuk PLTS dan PLTB dan pembangkit lain berlaku tanpa eskalasi; PLTP berlaku sebagai harga dasar dengan eskalasi.', 'Scheduled price increases over the contract term. Ceiling prices apply without escalation for most technologies; geothermal applies as a base price with escalation.'),
    risiko: bi('Pengembang non-PLTP menanggung kenaikan biaya operasi tanpa penyesuaian harga; PLTP mendapat penyesuaian.', 'Non-geothermal developers bear opex inflation without price adjustment; geothermal gets an adjustment.'),
    pasal: [p('p112', 'Pasal 6 ayat (1) huruf b dan ayat (2) huruf c')], risiko_tingkat: 'tinggi' },
  { id: 'busbar', nama: bi('Titik serah (busbar) dan fasilitas jaringan', 'Delivery point (busbar) and grid facilities'),
    arti: bi('Harga listrik adalah harga di titik pertemuan instalasi pembangkit dengan instalasi penyaluran, belum termasuk fasilitas jaringan. Harga fasilitas jaringan disepakati para pihak paling tinggi 30 persen dari harga pembelian listrik; di atas itu perlu persetujuan Menteri.', 'The price is at the point where generation meets transmission equipment (busbar), excluding grid facilities. Grid facility prices are agreed up to 30 percent of the power price; above that needs ministerial approval.'),
    risiko: bi('Biaya sambungan di luar busbar menjadi item tersendiri; pengembang perlu memastikan siapa membangun dan membayar jaringan sebelum tanda tangan.', 'Connection costs beyond the busbar are a separate item; developers should settle who builds and pays for the grid before signing.'),
    pasal: [p('p112', 'Pasal 7, Pasal 8')], risiko_tingkat: 'sedang' },
  { id: 'baterai', nama: bi('Fasilitas baterai', 'Battery facility'),
    arti: bi('PLTS dan PLTB yang dilengkapi baterai atau penyimpanan lain: harga fasilitas penyimpanan paling tinggi 60 persen dari harga pembelian listrik, dan lebih dari itu perlu persetujuan Menteri.', 'Solar and wind with batteries or other storage: the storage facility price is capped at 60 percent of the power price; more needs ministerial approval.'),
    risiko: bi('Skema kapasitas penyimpanan harus masuk hitungan tarif sejak awal; persetujuan tambahan memperpanjang proses bila melebihi batas.', 'Storage sizing must be priced in from the start; extra approval lengthens the process beyond the cap.'),
    pasal: [p('p112', 'Pasal 10')], risiko_tingkat: 'sedang' },
  { id: 'mata-uang', nama: bi('Mata uang dan kurs', 'Currency and exchange rate'),
    arti: bi('Pembayaran dalam rupiah dengan nilai tukar JISDOR pada waktu yang disepakati dalam PJBL.', 'Payment in rupiah at the JISDOR rate at the time agreed in the PPA.'),
    risiko: bi('Pinjaman dolar dengan pendapatan rupiah menyisakan risiko kurs di pengembang, kecuali ditangani pada waktu kurs yang disepakati.', 'Dollar loans with rupiah revenue leave exchange risk with the developer unless handled via the agreed rate timing.'),
    pasal: [p('p112', 'Pasal 13')], risiko_tingkat: 'tinggi' },
  { id: 'faktor-kapasitas', nama: bi('Faktor kapasitas minimum', 'Minimum capacity factor'),
    arti: bi('PLTA aliran atau terjunan sungai sampai 5 MW harus mampu beroperasi dengan faktor kapasitas paling sedikit 60 persen; di atas 5 MW sesuai kebutuhan sistem.', 'Run-of-river hydro up to 5 MW must operate at a capacity factor of at least 60 percent; above 5 MW per system needs.'),
    risiko: bi('Pengembang PLTMH menanggung risiko hidrologi: data debit pendek meningkatkan risiko tidak memenuhi syarat.', 'Mini-hydro developers carry hydrology risk: short flow records raise the risk of not meeting the requirement.'),
    pasal: [p('p112', 'Pasal 18 ayat (1)')], risiko_tingkat: 'tinggi' },
  { id: 'feedstock', nama: bi('Jaminan pasokan bahan bakar', 'Fuel supply assurance'),
    arti: bi('PLTBm dan PLTBg dibeli dari badan usaha yang punya pasokan feedstock cukup selama masa PJBL; PLTP dari pemegang izin yang cadangan atau uapnya terbukti cukup.', 'Biomass and biogas plants are bought from entities with enough feedstock for the PPA term; geothermal from holders with proven reserves or steam.'),
    risiko: bi('Kegagalan pasokan menjadi risiko pengembang; bukti pasokan jangka panjang diminta sebelum kontrak.', 'Supply failure is the developer\'s risk; long-term supply evidence is asked before contract.'),
    pasal: [p('p112', 'Pasal 19 ayat (1) huruf b sampai d')], risiko_tingkat: 'tinggi' },
  { id: 'excess', nama: bi('Jual kelebihan listrik (excess power)', 'Excess power sale'),
    arti: bi('PLN dapat membeli kelebihan listrik pemegang IUPTLS yang memakai EBT lewat perjanjian jual beli kelebihan listrik, jangka waktu paling singkat 3 tahun dan dapat diperpanjang.', 'PLN may buy excess power from renewable captive licence holders under an excess power agreement of at least 3 years, extendable.'),
    risiko: bi('"Dapat membeli": tidak ada kewajiban membeli, jadi volume dan harga bergantung kebutuhan sistem PLN.', '"May buy": there is no purchase obligation, so volume and price depend on PLN system needs.'),
    pasal: [p('p112', 'Pasal 11')], risiko_tingkat: 'sedang' },
  { id: 'waktu-proses', nama: bi('Batas waktu proses pengadaan', 'Procurement time limit'),
    arti: bi('Dari dokumen sampai tanda tangan PJBL: 90 hari kalender (penunjukan langsung) atau 180 hari kalender (pemilihan langsung).', 'From documents to PPA signature: 90 calendar days (direct appointment) or 180 calendar days (direct selection).'),
    risiko: bi('Batas waktu ada di sisi proses pengadaan; pasal tidak memuat akibat bila batas terlewati.', 'The limit applies to the procurement process; the article states no consequence if exceeded.'),
    pasal: [p('p112', 'Pasal 15 ayat (1), Pasal 16 ayat (2)')], risiko_tingkat: 'rendah' },
  { id: 'pedoman', nama: bi('Pedoman PJBL dan pelaporan', 'PPA guideline and reporting'),
    arti: bi('Menteri menetapkan pedoman PJBL. PLN melapor ke Menteri paling lambat 5 hari kerja setelah tanda tangan, dengan NIB dan struktur biaya, lalu laporan kemajuan dan TKDN tiap 6 bulan sampai COD.', 'The Minister sets the PPA guideline. PLN reports to the Minister within 5 working days of signing with the business ID and cost structure, then progress and local-content reports every 6 months until COD.'),
    risiko: bi('Struktur biaya model keuangan dilaporkan ke pemerintah; pengembang perlu siap membuka data biaya.', 'The financial model cost structure is reported to government; developers should be ready to disclose cost data.'),
    pasal: [p('p112', 'Pasal 21 ayat (4), Pasal 29')], risiko_tingkat: 'rendah' },
  { id: 'peralihan', nama: bi('PJBL lama tetap berlaku', 'Existing PPAs stay valid'),
    arti: bi('PJBL dan PJBU yang ditandatangani sebelum Perpres 112/2022 berlaku tetap berlaku sampai berakhir.', 'PPAs and steam contracts signed before the regulation took effect remain valid until they expire.'),
    risiko: bi('Aturan harga baru tidak otomatis menggantikan kontrak lama; renegosiasi PLTP lebih tinggi dari patokan perlu persetujuan Menteri.', 'New pricing rules do not automatically replace old contracts; geothermal renegotiation above the ceiling needs ministerial approval.'),
    pasal: [p('p112', 'Pasal 30, Pasal 33')], risiko_tingkat: 'rendah' },
];

const bln = (s) => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + +m[2] : null; };
/** Selisih AMDAL (bulan pengumuman) ke COD target proyek (tahun saja: pakai pertengahan tahun, bulan 7), dalam bulan. */
export function leadTime(amdal, proyek) {
  const pj = new Map(proyek.baris.map((x) => [x.id, x]));
  const out = [];
  for (const a of amdal.baris) {
    const x = a.proyek_id && pj.get(a.proyek_id); const m = bln(a.tanggal_mulai); const cod = x?.cod_target?.[0]?.nilai;
    if (!x || m == null || !Number.isInteger(cod) || x.status?.[0]?.nilai === 'dibatalkan') continue;
    const bulan = cod * 12 + 7 - m;
    if (bulan > 0) out.push({ amdal_id: a.id, proyek_id: x.id, proyek: x.nama, teknologi: x.teknologi || a.teknologi || null, amdal_tanggal: a.tanggal_mulai, cod_target: cod, bulan, amdal_url: a.sumber_url || null });
  }
  return out;
}
export function ringkas(daftar) {
  if (!daftar.length) return { n: 0, median: null, min: null, maks: null, rata: null };
  const v = daftar.map((x) => x.bulan).sort((a, z) => a - z), n = v.length;
  return { n, median: n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2, min: v[0], maks: v[n - 1], rata: Math.round((v.reduce((s, x) => s + x, 0) / n) * 10) / 10 };
}

export function bangun(d) {
  const lt = leadTime(d.amdal, d.proyek);
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, dok: DOK, tanya: TANYA, klausul: KLAUSUL,
    batas_waktu: [
      { id: 'penunjukan', hari: 90, pasal: p('p112', 'Pasal 15 ayat (1)') },
      { id: 'pemilihan', hari: 180, pasal: p('p112', 'Pasal 16 ayat (2)') },
    ],
    lead_time: { daftar: lt, ringkas: ringkas(lt), metode: 'EST. Bulan dari tanggal mulai pengumuman AMDALNET sampai COD target (tahun, dihitung pertengahan tahun) pada proyek yang tertaut pasti dengan pengumuman. COD target adalah rencana RUPTL atau sumber proyek, bukan realisasi. Pasangan sedikit, jangan dibaca sebagai rata-rata industri.', sumber: ['amdal.json', 'proyek.json'] },
    butuh_unduhan: {
      ppa: { sumber: 'Naskah PJBL standar PLN dan Permen ESDM pedoman PJBL', url: null, alasan: 'Pedoman PJBL ditetapkan Menteri (Perpres 112/2022 Pasal 21 ayat 4) tetapi naskahnya belum ditemukan sebagai berkas terbuka; klausul di atas dibaca dari Perpres, bukan dari PJBL aktual.' },
      pp28: { sumber: 'PP 28/2025 beserta lampiran kegiatan usaha sektor ESDM', url: DOK.pp28.pdf, alasan: 'Lampiran dan pasal belum dibaca; durasi izin per kegiatan perlu diunduh pemilik.' },
      lama_izin: { sumber: 'Data realisasi waktu izin dari OSS', url: null, alasan: 'Tidak ada data publik waktu izin realisasi; lead time di atas hanya pendekatan dari data proyek.' },
    },
  };
}
export const muat = () => ({ amdal: baca('amdal.json'), proyek: baca('proyek.json') });
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const o = bangun(muat());
  fs.writeFileSync(path.join(AKAR, 'public/data/izin_kontrak.json'), JSON.stringify(o) + '\n');
  console.log('izin_kontrak:', o.tanya.length, 'tanya,', o.klausul.length, 'klausul, lead time n =', o.lead_time.ringkas.n, JSON.stringify(o.lead_time.ringkas));
}
