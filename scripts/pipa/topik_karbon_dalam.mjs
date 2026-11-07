// Pendalaman naskah Karbon (8 Nov 2026). Berbeda dari topik lain: karbon.json ditulis tangan (cetakan angka {token} di public/topik_karbon.js),
// jadi skrip ini MEMBACA karbon.json, menambahkan butir yang belum ada (idempoten, dedup per kunci), lalu menulis kembali.
// Pakai: node scripts/pipa/topik_karbon_dalam.mjs [--selftest]. Tanpa jaringan. Tidak menambah token {x} baru.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, S, G, FQ, P, sm, ke, TGL, baca, tambahSumber, liniReg, lengkapi } from './topik_dalam_lib.mjs';

const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BERKAS = path.join(akar, 'public/data/topik/karbon.json');

const SUMBER_BARU = {
  icap: S('ICAP, ETS Prices (harga izin sistem perdagangan emisi dunia; data harian)', 'International Carbon Action Partnership', 'https://icapcarbonaction.com/en/ets-prices', TGL, 'resmi'),
  ipcc_ef: S('IPCC Guidelines 2006 vol. 2 bab 2: faktor emisi bawaan bahan bakar', 'IPCC', 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html', TGL, 'resmi'),
  regul: S('Basis regulasi METI (public/data/regulasi.json, naskah BPK JDIH)', 'BPK JDIH, METI', 'https://peraturan.bpk.go.id/', '2026-11-07', 'resmi'),
  pendanaan: S('Basis pendanaan METI (public/data/pendanaan.json: skema dan proyek pendana)', 'METI, ADB, World Bank, GIZ dan lain-lain', 'https://platformmeti.timitbnpb.workers.dev', TGL, 'via-pihak-ketiga'),
  luar: S('Our World in Data, grafik harga dan cakupan karbon (public/data/topik/luar_karbon.json); World Bank Carbon Pricing Dashboard membalas 403 sehingga tidak dipakai', 'Our World in Data', 'https://ourworldindata.org/grapher/carbon-tax-trading-coverage', '2026-11-08', 'via-pihak-ketiga', 'CC BY 4.0'),
};

export function perdalam(d) {
  d.diperbarui = TGL;
  d.versi = Math.max(d.versi || 1, 2);
  const bab = d.bab;
  tambahSumber(d.sumber, SUMBER_BARU);
  const rf = (n, k = 1) => Math.round(n * 10 ** k) / 10 ** k;
  const bursa = baca('public/data/topik/dasar-karbon.json').karbon.bursa.at(-1);
  const hargaRp = bursa.harga, EF = 0.68025; // tCO2 per MWh, Ember 2024 (gCO2 per kWh / 1000)
  const mwh = 10 * 8760 * 0.18, tco2 = mwh * EF, pendRp = tco2 * hargaRp;
  const embedded = 1000 * 1.9; // tCO2 per 1000 t baja contoh hipotesis

  ke(bab, '2', 'faq', 'butir', FQ([
    ['Apa itu SRN PPI dan SPE-GRK?', 'What are SRN PPI and SPE-GRK?', 'SRN PPI adalah sistem registri nasional pengendalian perubahan iklim milik KLH; SPE-GRK adalah sertifikat pengurangan emisi gas rumah kaca yang diterbitkan setelah verifikasi. Permen LH 10/2026 menata sistem registri unit karbon.', 'SRN PPI is the national climate change control registry run by the Environment Ministry; SPE-GRK is the greenhouse gas emission reduction certificate issued after verification. Environment Reg. 10/2026 organises the carbon unit registry system.'],
    ['Siapa yang mengatur perdagangan karbon di bursa?', 'Who regulates carbon trading on the exchange?', 'OJK mengatur perdagangan karbon melalui bursa (POJK 14/2023, diubah dengan POJK 10/2026 pada 2 Juli 2026); KLH mengatur unit dan registri; Perpres 110/2025 menjadi payung instrumen nilai ekonomi karbon.', 'The OJK regulates exchange carbon trading (POJK 14/2023, amended by POJK 10/2026 on 2 July 2026); the Environment Ministry governs units and registries; Presidential Reg. 110/2025 is the umbrella for carbon economic value instruments.'],
    ['Apakah hutan dan laut juga bisa menjual karbon?', 'Can forests and the sea also sell carbon?', 'Ya, dengan aturan sektoral: Permen LHK 6/2026 untuk offset emisi sektor kehutanan (6 April 2026) dan Permen KKP 1/2025 untuk sektor kelautan (6 Januari 2025). Energi terbarukan bersaing dengan unit sektor ini di pasar yang sama.', 'Yes, under sector rules: Environment Reg. 6/2026 for forestry offsets (6 April 2026) and Marine Affairs Reg. 1/2025 for the marine sector (6 January 2025). Renewable energy competes with these sector units in the same market.'],
    ['Berapa pendapatan kredit karbon sebuah PLTS?', 'How much does a solar plant earn from credits?', `Contoh hipotesis PLTS 10 MW pada faktor kapasitas 18 persen menghasilkan ${rf(mwh / 1000, 1)} GWh dan dengan faktor emisi ${EF} tCO2 per MWh sekitar ${rf(tco2 / 1000, 1)} ribu tCO2e per tahun; pada harga bursa terakhir Rp${hargaRp.toLocaleString('id-ID')} per tCO2e itu sekitar Rp${rf(pendRp / 1e6, 0)} juta (EST, sebelum biaya MRV dan perantara; faktor emisi resmi untuk kredit bisa berbeda).`, `A hypothetical 10 MW solar plant at an 18 percent capacity factor makes ${rf(mwh / 1000, 1)} GWh and at an emission factor of ${EF} tCO2 per MWh about ${rf(tco2 / 1000, 1)} thousand tCO2e a year; at the latest exchange price of IDR ${hargaRp.toLocaleString('en-US')} per tCO2e that is about IDR ${rf(pendRp / 1e6, 0)} million (EST, before MRV and intermediary costs; the official emission factor for credits can differ).`],
    ['Apa itu CBAM dan kenapa relevan?', 'What is CBAM and why does it matter?', 'Mekanisme penyesuaian karbon perbatasan Uni Eropa mengenakan biaya karbon pada impor seperti baja, aluminium, semen, pupuk, listrik, dan hidrogen. Eksportir Indonesia yang membayar harga karbon domestik dapat mengurangi beban; ini alasan bursa dan pajak karbon penting.', 'The EU carbon border adjustment mechanism charges carbon on imports such as steel, aluminium, cement, fertiliser, electricity and hydrogen. Indonesian exporters paying a domestic carbon price can reduce the burden; this is why the exchange and carbon tax matter.'],
  ]), sm('regul', 'idx', 'kp'));

  ke(bab, '3', 'glosarium', 'butir', G([
    ['Scope 1, 2, 3', 'Cakupan emisi korporasi: langsung, listrik dibeli, dan rantai nilai.', 'Corporate emission scopes: direct, purchased power and value chain.'],
    ['CBAM', 'Carbon border adjustment mechanism, biaya karbon pada impor ke Uni Eropa.', 'Carbon border adjustment mechanism, a carbon charge on imports into the EU.'],
    ['Cap and trade', 'Batas total emisi dengan izin yang dapat diperdagangkan, dasar ETS.', 'A total emission cap with tradable allowances, the basis of an ETS.'],
    ['Carbon leakage', 'Kebocoran karbon: emisi berpindah ke negara berharga karbon rendah.', 'Carbon leakage: emissions moving to a country with a lower carbon price.'],
    ['Permanence', 'Kekekalan penyimpanan karbon, terutama di hutan.', 'Durability of carbon storage, especially in forests.'],
    ['Buffer pool', 'Cadangan unit untuk menutup risiko pembalikan karbon.', 'A reserve of units to cover carbon reversal risk.'],
    ['Corresponding adjustment', 'Penyesuaian akuntansi agar unit yang dijual ke luar tidak dihitung dua kali pada NDC.', 'An accounting adjustment so exported units are not double-counted in the NDC.'],
    ['Insetting', 'Penurunan emisi di dalam rantai pasok sendiri, bukan membeli offset luar.', 'Cutting emissions inside one\'s own supply chain rather than buying external offsets.'],
    ['SBTi', 'Science Based Targets initiative, standar target iklim korporasi.', 'The Science Based Targets initiative, a corporate climate target standard.'],
    ['VCS dan Gold Standard', 'Dua standar kredit sukarela terbesar; Verra mengelola VCS.', 'The two largest voluntary credit standards; Verra manages VCS.'],
    ['CDM', 'Clean development mechanism Protokol Kyoto, pendahulu pasar offset modern.', 'The Kyoto Protocol clean development mechanism, predecessor of modern offset markets.'],
    ['Blue carbon', 'Karbon yang tersimpan di mangrove, lamun, dan rawa pasang surut.', 'Carbon stored in mangroves, seagrass and tidal marshes.'],
    ['Harga bayangan karbon', 'Harga karbon internal yang dipakai perusahaan dalam keputusan investasi.', 'The internal carbon price a company uses in investment decisions.'],
    ['Dekarbonisasi', 'Penurunan intensitas karbon sistem energi atau industri.', 'Lowering the carbon intensity of an energy system or industry.'],
    ['KPEI dan KSEI', 'Lembaga kliring dan kustodian pasar modal yang terlibat dalam penyelesaian transaksi bursa.', 'The capital market clearing and custody institutions involved in settling exchange trades.'],
  ]), sm('ed'));

  ke(bab, '4', 'teks', 'paragraf', P(
    ['Mengapa penting bagi energi terbarukan: harga karbon mengubah perbandingan biaya batubara dan terbarukan, dan kredit karbon menambah pendapatan proyek. Dalam sistem listrik yang masih memakai batubara, tiap MWh terbarukan menghindari sekitar 0,68 tCO2.', 'Why it matters for renewables: a carbon price changes the cost comparison of coal and renewables, and carbon credits add project revenue. In a power system still using coal, each renewable MWh avoids about 0.68 tCO2.'],
    ['Ada dua pasar yang sering dicampur: pasar wajib (pajak, ETS, batas emisi PTBAE-PU) yang digerakkan hukum, dan pasar sukarela (Verra, Gold Standard) yang digerakkan pembeli korporasi. Keduanya memerlukan MRV yang kredibel agar unit tidak dihitung dua kali.', 'Two markets are often mixed: the compliance market (tax, ETS, PTBAE-PU emission limits) driven by law, and the voluntary market (Verra, Gold Standard) driven by corporate buyers. Both need credible MRV so units are not counted twice.'],
  ), sm('ed', 'idx', 'kp'));

  ke(bab, '5', 'rumus', 'rumus', P(
    ['Pendapatan tambahan per MWh (Rp) = faktor emisi grid (tCO2 per MWh) x harga unit (Rp per tCO2e)', 'Added revenue per MWh (IDR) = grid emission factor (tCO2 per MWh) x unit price (IDR per tCO2e)'],
    ['Biaya CBAM (EUR) = emisi tertanam (tCO2) x (harga ETS UE - harga karbon yang sudah dibayar di negara asal)', 'CBAM cost (EUR) = embedded emissions (tCO2) x (EU ETS price - carbon price already paid in the origin country)'],
    ['Pajak karbon (Rp) = (emisi - batas) x tarif; tarif minimal UU HPP Rp30 per kg CO2e atau Rp30.000 per tCO2e', 'Carbon tax (IDR) = (emissions - cap) x rate; the HPP Law minimum rate is IDR 30 per kg CO2e or IDR 30,000 per tCO2e'],
  ), sm('ed', 'ct', 'idx'));
  ke(bab, '5', 'rumus', 'contoh', [
    T(`Pendapatan per MWh pada faktor emisi ${EF} tCO2 per MWh dan harga bursa terakhir Rp${hargaRp.toLocaleString('id-ID')} per tCO2e: Rp${rf(EF * hargaRp, 0).toLocaleString('id-ID')} per MWh (EST), jauh di bawah harga listrik sehingga kredit menjadi pelengkap, bukan penentu kelayakan.`, `Revenue per MWh at an emission factor of ${EF} tCO2 per MWh and the latest exchange price of IDR ${hargaRp.toLocaleString('en-US')} per tCO2e: IDR ${rf(EF * hargaRp, 0).toLocaleString('en-US')} per MWh (EST), far below the power price so credits are a supplement, not a viability driver.`),
    T('Pajak karbon pada tarif minimal Rp30.000 per tCO2e: PLTU 600 MW dengan emisi sekitar 3 juta tCO2e per tahun yang melebihi batas 100 persen membayar sekitar Rp90 miliar per tahun (EST, hipotesis; pajak karbon belum berlaku).', 'Carbon tax at the minimum rate of IDR 30,000 per tCO2e: a 600 MW coal plant emitting about 3 million tCO2e a year, all above the cap, would pay about IDR 90 billion a year (EST, hypothetical; the carbon tax is not yet in force).'),
    T(`Contoh CBAM: 1.000 ton baja dengan emisi tertanam 1,9 tCO2 per ton = ${embedded} tCO2; bila harga ETS UE EUR 70 dan negara asal belum mengenakan harga, biaya sekitar EUR ${rf(embedded * 70 / 1000, 0)} ribu (EST, semua angka hipotesis).`, `CBAM example: 1,000 tonnes of steel with 1.9 tCO2 embedded per tonne = ${embedded} tCO2; with an EU ETS price of EUR 70 and no price at origin the cost is about EUR ${rf(embedded * 70 / 1000, 0)} thousand (EST, all figures hypothetical).`),
  ], sm('ed', 'ct', 'idx', 'icap'));

  ke(bab, '6', 'langkah', 'butir', [
    { judul: T('Penerbitan SPE dan pencatatan di SRN', 'SPE issuance and recording in SRN'), isi: T('Setelah verifikasi, KLH menerbitkan SPE-GRK dan mencatatnya pada registri nasional.', 'After verification, the Environment Ministry issues the SPE-GRK and records it in the national registry.'), pelaku: T('KLH, pengembang', 'Environment Ministry, developer') },
    { judul: T('Perdagangan, kliring, dan penyelesaian', 'Trading, clearing and settlement'), isi: T('Penyelenggara bursa karbon memperdagangkan unit; lembaga kliring dan kustodian menyelesaikan transaksi.', 'The carbon exchange operator trades units; clearing and custody institutions settle transactions.'), pelaku: T('IDXCarbon, KPEI, KSEI, peserta', 'IDXCarbon, KPEI, KSEI, participants') },
    { judul: T('Pelaporan dan pensiun unit', 'Reporting and unit retirement'), isi: T('Pembeli memensiunkan unit untuk klaim; pelaporan memuat NDC agar tidak ada penghitungan ganda.', 'Buyers retire units to make claims; reporting feeds the NDC so there is no double counting.'), pelaku: T('Pembeli, KLH', 'Buyers, Environment Ministry') },
  ], sm('ed', 'idx'));

  ke(bab, '13', 'linimasa', 'butir', liniReg([
    ['permen-klhk-7-2023', 'Permen LHK 7/2023: tata cara perdagangan karbon sektor kehutanan (kemudian dicabut)', 'Environment Reg. 7/2023: forestry carbon trading procedure (later revoked)'],
    ['permen-kkp-1-2025', 'Permen KKP 1/2025: nilai ekonomi karbon sektor kelautan', 'Marine Affairs Reg. 1/2025: marine carbon economic value'],
    ['permen-klhk-6-2026', 'Permen LHK 6/2026: perdagangan karbon melalui offset emisi sektor kehutanan', 'Environment Reg. 6/2026: carbon trading through forestry emission offsets'],
    ['ojk-10-2026', 'POJK 10/2026: perubahan atas POJK 14/2023 tentang perdagangan karbon', 'POJK 10/2026: amendment of POJK 14/2023 on carbon trading'],
    ['permen-klhk-10-2026', 'Permen LHK 10/2026: sistem registri unit karbon', 'Environment Reg. 10/2026: carbon unit registry system'],
    ['permen-klhk-9-2026', 'Permen LHK 9/2026: program pengendalian perubahan iklim berbasis masyarakat', 'Environment Reg. 9/2026: community-based climate change control programme'],
  ]), sm('regul'));

  ke(bab, '14', 'teks', 'paragraf', P(
    ['Kewajiban: sektor pembangkit tertentu tunduk pada batas emisi (PTBAE-PU); pajak karbon dalam UU HPP belum diberlakukan; unit karbon yang diperdagangkan harus terdaftar di registri nasional (Permen LHK 10/2026) dan perdagangan bursa mengikuti POJK 14/2023 yang diubah POJK 10/2026.', 'Obligations: certain power sectors are subject to emission limits (PTBAE-PU); the carbon tax in the HPP Law is not yet in force; traded carbon units must be in the national registry (Environment Reg. 10/2026) and exchange trading follows POJK 14/2023 as amended by POJK 10/2026.'],
    ['Insentif: pendapatan kredit karbon, akses pendanaan hijau, dan jalur perdagangan lintas negara yang diatur Perpres 110/2025. Rincian insentif fiskal pajak karbon belum ada karena pajaknya belum berlaku.', 'Incentives: carbon credit revenue, green finance access and cross-border trading routes governed by Presidential Reg. 110/2025. Fiscal incentive detail is not available because the tax is not yet in force.'],
  ), sm('regul', 'ct', 'idx'));

  ke(bab, '16', 'teks', 'paragraf', P(
    ['Aturan turunan Perpres 110/2025 masih berjalan: pengembang perlu mengikuti penerbitan aturan teknis tentang registri, metodologi, dan perdagangan lintas negara. Usulan layak diajukan lewat forum Konsultasi METI: definisi additionality untuk energi terbarukan yang sudah dijadwalkan RUPTL, dan pemisahan klaim kredit dari klaim bauran EBT.', 'Implementing rules of Presidential Reg. 110/2025 are still being issued: developers should follow technical rules on registries, methodologies and cross-border trading. Inputs worth submitting through the METI Consultation forum: the definition of additionality for renewables already scheduled in the RUPTL and separating credit claims from renewable mix claims.'],
  ), sm('regul', 'ruptl'));

  ke(bab, '17', 'teks', 'paragraf', P(
    ['1. MRV digital: sensor, satelit, dan data meter otomatis menurunkan biaya verifikasi dan mengurangi sengketa angka.', '1. Digital MRV: sensors, satellites and automatic meter data lower verification cost and reduce disputes over numbers.'],
    ['2. Registri terintegrasi dengan bursa: sistem registri unit karbon (Permen LHK 10/2026) mengurangi risiko penghitungan ganda.', '2. Registry integration with exchanges: the carbon unit registry system (Environment Reg. 10/2026) reduces double counting risk.'],
    ['3. Penghilangan karbon (CDR): penangkapan udara langsung, biochar, dan mineralisasi; Perpres 14/2024 membuka jalur CCS di Indonesia.', '3. Carbon dioxide removal (CDR): direct air capture, biochar and mineralisation; Presidential Reg. 14/2024 opens the CCS route in Indonesia.'],
    ['4. Skor kualitas unit: penilai independen menilai integritas unit sehingga pembeli mau membayar premi untuk unit berkualitas.', '4. Unit quality ratings: independent raters assess unit integrity so buyers pay a premium for high-quality units.'],
    ['5. Perhitungan jejak karbon produk: data emisi per produk untuk CBAM dan rantai pasok.', '5. Product carbon footprints: per-product emission data for CBAM and supply chains.'],
    ['6. Kontrak listrik hijau dengan sertifikat atribut (REC): menyatakan atribut hijau terpisah dari kredit karbon.', '6. Green power contracts with attribute certificates (REC): claim green attributes separately from carbon credits.'],
    ['7. Metodologi baru untuk biogas dan penyimpanan: pengurangan metana POME dan PLTS terapung masih memerlukan metodologi baku.', '7. New methodologies for biogas and storage: POME methane reduction and floating solar still need standard methodologies.'],
    ['8. Pelacakan emisi pembangkit dari satelit: Climate TRACE memperkirakan emisi aset pembangkit Indonesia (sumber di basis METI).', '8. Satellite tracking of plant emissions: Climate TRACE estimates emissions of Indonesian power assets (a source in the METI base).'],
  ), sm('ct', 'idx', 'ed'));

  /* ---- pembiayaan: delapan skema ber-id pendanaan ---- */
  const pend = baca('public/data/pendanaan.json').pendanaan;
  const idPend = ['sk_idxcarbon', 'sk_karbon_sukarela', 'pi_DE_1_202221380', 'pi_DE_1_202421642', 'pi_XM_DAC_46004_45064_001_LN2805', 'pi_XM_DAC_46004_57229_001_TA10264', 'pi_XM_DAC_41317_FP296', 'pi_US_GOV_1_720DD122T00002'];
  const rows = idPend.flatMap((id) => { const x = pend.find((p) => p.id === id); return x ? [{ id: x.id, nama: x.nama, pem: x.pemberi, jenis: x.jenis_entri === 'skema' ? T('skema', 'scheme') : T('proyek', 'project'), u: x.url }] : []; });
  ke(bab, '24', 'tabel', 'baris', rows, sm('pendanaan'));
  bab['24'].per = 8;
  bab['24'].kolom ||= [{ k: 'nama', l: T('Skema atau proyek', 'Scheme or project'), url: 'u' }, { k: 'pem', l: T('Pemberi', 'Provider') }, { k: 'jenis', l: T('Jenis', 'Type') }];
  bab['24'].catatan = T('Skema dan proyek pendana yang menyebut karbon atau dekarbonisasi di basis pendanaan METI; nilai untuk seluruh program.', 'Schemes and funder projects mentioning carbon or decarbonisation in the METI funding base; values are for the whole programme.');

  ke(bab, '26', 'teks', 'paragraf', P(
    [`Transaksi bursa: volume kumulatif tahun berjalan ${bursa.volume_ytd.toLocaleString('id-ID')} tCO2e dan nilai kumulatif Rp${rf(bursa.nilai_ytd / 1e9, 1)} miliar pada ${bursa.periode} dengan ${bursa.peserta} peserta terdaftar dan ${bursa.proyek_terdaftar} proyek terdaftar (IDXCarbon).`, `Exchange trading: year-to-date volume of ${bursa.volume_ytd.toLocaleString('en-US')} tCO2e and cumulative value of IDR ${rf(bursa.nilai_ytd / 1e9, 1)} billion in ${bursa.periode} with ${bursa.peserta} registered participants and ${bursa.proyek_terdaftar} listed projects (IDXCarbon).`],
    [`Unit tersedia untuk dibeli ${bursa.unit_tersedia.toLocaleString('id-ID')} tCO2e berbanding unit yang dipensiunkan ${bursa.unit_pensiun.toLocaleString('id-ID')}, sekitar ${rf(bursa.unit_pensiun / bursa.unit_tersedia * 100, 2)} persen (EST), tanda pasokan jauh melebihi permintaan.`, `Units available to buy ${bursa.unit_tersedia.toLocaleString('en-US')} tCO2e against retired units ${bursa.unit_pensiun.toLocaleString('en-US')}, about ${rf(bursa.unit_pensiun / bursa.unit_tersedia * 100, 2)} percent (EST), a sign that supply far exceeds demand.`],
  ), sm('idx'));

  ke(bab, '27', 'teks', 'paragraf', P(
    ['Manfaat: pendapatan tambahan bagi proyek terbarukan dan tekanan pada emisi tinggi. Risiko: greenwashing bila unit tanpa additionality dipakai untuk klaim netral karbon, dan penghitungan ganda dengan NDC. Hak masyarakat: proyek berbasis lahan harus memuat persetujuan masyarakat dan pembagian manfaat.', 'Benefits: added revenue for renewable projects and pressure on high emitters. Risks: greenwashing when units lacking additionality are used for carbon-neutral claims, and double counting with the NDC. Community rights: land-based projects must include community consent and benefit sharing.'],
  ), sm('ed', 'kp'));
  ke(bab, '28', 'teks', 'paragraf', P(
    ['Pekerjaan baru: validator dan verifikator (LVV), penghitung emisi, auditor MRV, pengelola registri, dan perdagangan karbon. Sertifikasi kompetensi lewat LSP bidang lingkungan dan energi; kebutuhan pelatihan MRV untuk PLTS, PLTB, dan panas bumi belum terpetakan di basis ini.', 'New jobs: validators and verifiers (LVV), emission accountants, MRV auditors, registry managers and carbon traders. Competency certification through environment and energy LSPs; MRV training needs for solar, wind and geothermal are not yet mapped in this base.'],
  ), sm('ed'));

  ke(bab, '31', 'langkah', 'butir', [
    { judul: T('Pemda', 'Local governments'), isi: T('Peluang: program karbon berbasis masyarakat (Permen LHK 9/2026) dan pendapatan daerah. Tantangan: kapasitas MRV dan pembagian manfaat.', 'Opportunity: community-based carbon programmes (Environment Reg. 9/2026) and regional revenue. Challenge: MRV capacity and benefit sharing.'), pelaku: T('Pemda', 'Local governments') },
    { judul: T('Akademisi', 'Academics'), isi: T('Peluang: metodologi baru, verifikasi independen, dan data faktor emisi sistem. Tantangan: akses data pembangkit.', 'Opportunity: new methodologies, independent verification and system emission factor data. Challenge: access to plant data.'), pelaku: T('Kampus, pusat studi', 'Universities, study centres') },
  ], sm('ed'));
  ke(bab, '32', 'langkah', 'butir', [
    { judul: T('POJK 10/2026 dan registri unit', 'POJK 10/2026 and the unit registry'), isi: T('Pantau pelaksanaan perdagangan karbon dan sistem registri (Permen LHK 10/2026).', 'Watch implementation of carbon trading and the registry system (Environment Reg. 10/2026).'), pelaku: T('Indikator', 'Indicator') },
    { judul: T('Pajak karbon UU HPP', 'HPP Law carbon tax'), isi: T('Belum berlaku; pantau jadwal dan tarif.', 'Not yet in force; watch schedule and rate.'), pelaku: T('Indikator', 'Indicator') },
    { judul: T('Harga ETS dunia', 'Global ETS prices'), isi: T('Pantau harga ICAP sebagai acuan CBAM.', 'Watch ICAP prices as the CBAM reference.'), pelaku: T('Indikator', 'Indicator') },
    { judul: T('Rasio pensiun terhadap unit tersedia', 'Retirement-to-available-unit ratio'), isi: T('Indikator kecukupan permintaan di bursa.', 'An indicator of demand sufficiency on the exchange.'), pelaku: T('Indikator', 'Indicator') },
    { judul: T('Pengesahan RUU EBET', 'RUU EBET enactment'), isi: T('Mempengaruhi insentif terbarukan dan klaim kredit.', 'Affects renewable incentives and credit claims.'), pelaku: T('Indikator', 'Indicator') },
    { judul: T('Aturan CBAM Uni Eropa', 'EU CBAM rules'), isi: T('Pantau fase definitif dan perluasan produk.', 'Watch the definitive phase and product expansion.'), pelaku: T('Indikator', 'Indicator') },
  ], sm('ed', 'icap'));
  lengkapi(d);
  return d;
}

/* validasi ringan: karakter terlarang, sumber dikenal, tanpa token baru */
export function periksa(d) {
  const err = [];
  const s = JSON.stringify(d);
  if (/[—·→←]/.test(s)) err.push('karakter terlarang');
  const sid = new Set(Object.keys(d.sumber));
  for (const [n, b] of Object.entries(d.bab)) for (const k of b.sumber || []) if (!sid.has(k)) err.push(`sumber ${k} di bab ${n}`);
  for (const [id, x] of Object.entries(d.sumber)) if (id !== 'ed' && id !== 'celah' && (!/^https:\/\//.test(x.url) || !x.tanggal || !x.bukti)) err.push('sumber cacat ' + id);
  return err;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = perdalam(JSON.parse(fs.readFileSync(BERKAS, 'utf8')));
  const e = periksa(d);
  if (e.length) { console.error(e.join('\n')); process.exit(1); }
  if (!process.argv.includes('--selftest')) fs.writeFileSync(BERKAS, JSON.stringify(d, null, 1) + '\n');
  console.log(`karbon: ${Object.keys(d.bab).length} bab, ${Object.keys(d.sumber).length} sumber${process.argv.includes('--selftest') ? ' (selftest, tidak ditulis)' : ''}`);
}
