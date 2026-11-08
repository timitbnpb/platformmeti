#!/usr/bin/env node
// Energi baru (huruf B pada EBET; UU 30/2007 tentang Energi dan RUU EBET): nuklir, hidrogen dan amonia, CBM, DME, co-firing biomassa.
// -> public/data/energi_baru.json. Benih tersusun dari bacaan sumber publik tanggal 2026-11-08 (tiap butir bersumber, bertingkat bukti);
// TIDAK mengarang angka: yang tidak ditemukan ditulis di meta.celah. Kunci org_id/proyek_id/regulasi dicek terhadap berkas data yang ada.
// Pakai: --bangun | --selftest | --cek-url (HEAD ke tiap sumber: UA sopan, robots, jeda >= 2 dtk, berhenti pada 403/429)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const T = '2026-11-08';
export const BAGIAN = ['nuklir', 'hidrogen', 'cbm', 'dme', 'cofiring'];
export const STATUS = ['beroperasi', 'pilot', 'konstruksi', 'persiapan', 'rencana', 'kerja-sama', 'tertunda', 'dibatalkan'];

const S = (id, judul, penerbit, url, tahun, tb = 'media') => ({ id, judul, penerbit, url, tahun, tingkat_bukti: tb, tanggal_periksa: T });
const SUMBER = [
  S('kontan-ruptl', 'PLTN masuk RUPTL 2025-2034, RI siapkan proyek nuklir pertama 500 MW', 'Kontan', 'https://industri.kontan.co.id/news/pltn-masuk-ruptl-2025-2034-ri-siapkan-proyek-nuklir-pertama-berkapasitas-500-mw', 2025),
  S('detik-7gw', 'Dirut PLN beberkan rencana pembangunan PLTN 7 GW hingga 2034', 'detikFinance', 'https://finance.detik.com/energi/d-8084691/dirut-pln-beberkan-rencana-pembangunan-pltn-7-gw-hingga-2034-di-ri', 2025),
  S('esdm-faq-ruptl', 'FAQ RUPTL PLN 2025-2034', 'Ditjen Ketenagalistrikan ESDM', 'https://gatrik.esdm.go.id/assets/uploads/download_index/files/daa0b-faq-ruptl-pln-2025-2034.pdf', 2025, 'resmi'),
  S('cnbc-28tapak', 'Pemerintah siapkan 28 tapak proyek pembangkit nuklir', 'CNBC Indonesia', 'https://cnbcindonesia.com/news/20261022191439-4-778701/pemerintah-siapkan-28-tapak-proyek-pembangkit-nuklir', 2026),
  S('katadata-tender', 'Tender PLTN tunggu penetapan tapak, ESDM kaji tambahan kandidat lokasi', 'Katadata', 'https://katadata.co.id/berita/energi/6ada3a8dbc6b3/tender-pltn-tunggu-penetapan-tapak-esdm-kaji-tambahan-kandidat-lokasi', 2026),
  S('bapeten-sp003', 'Persetujuan evaluasi tapak PLTN (siaran pers 003)', 'Bapeten', 'https://bapeten.go.id/upload/14/43e15c7549-sp-003-persetujuan-evaluasi-tapak-pltn.pdf', 2025, 'resmi'),
  S('bisnis-thorcon', 'Bahlil belum teken izin tapak untuk pembangkit listrik nuklir Thorcon', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20250811/44/1901293/bahlil-belum-teken-izin-tapak-untuk-pembangkit-listrik-nuklir-thorcon', 2025),
  S('jp-thorcon', 'Govt yet to approve ThorCon plant despite nuclear agency\'s green light', 'The Jakarta Post', 'https://www.thejakartapost.com/business/2025/08/13/govt-yet-to-approve-thorcon-plant-despite-nuclear-agencys-green-light', 2025),
  S('petromindo-nepio', 'Indonesia opens nuclear talks with Russia, U.S., Japan and others ahead of NEPIO approval', 'Petromindo', 'https://dev.petromindo.com/news/article/indonesia-opens-nuclear-talks-with-russia-u-s-japan-and-others-ahead-of-nepio-approval', 2026),
  S('kompas-nepio', 'Kejar PLTN 2032, organisasi pelaksana energi nuklir nasional dibentuk tahun ini', 'Kompas', 'https://lestari.kompas.com/read/2024/09/10/070000886/kejar-pltn-2032-organisasi-pelaksana-energi-nuklir-nasional-dibentuk-tahun', 2024),
  S('wiki-rsg', 'Reaktor Serba Guna G.A. Siwabessy', 'Wikipedia', 'https://en.wikipedia.org/wiki/Reaktor_Serba_Guna_G.A._Siwabessy', 2026, 'kata'),
  S('jawapos-brin', 'BRIN lakukan pemeriksaan fasilitas untuk operasional reaktor nuklir', 'Jawa Pos', 'https://www.jawapos.com/jabodetabek/2603180267/brin-lakukan-pemeriksaan-fasilitas-untuk-operasional-reaktor-nuklir', 2026),
  S('viva-rosatom', 'Strategi BRIN dan Rosatom bangun ekosistem nuklir Indonesia', 'VIVA', 'https://techno.viva.co.id/platform/28055-strategi-brin-dan-rosatom-bangun-ekosistem-nuklir-indonesia', 2025),
  S('listrik-smr160', 'Indonesia go nuclear, BRIN bahas desain SMR-160 dan penyesuaian lokasi pembangunan', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/11145/indonesia-go-nuclear-brin-bahas-desain-smr-160-dan-penyesuaian-lokasi-pembangunan', 2023),
  S('esdm-h2-21', 'Ekosistem hidrogen hijau mulai tumbuh, 21 pembangkit PLN resmi beroperasi', 'Kementerian ESDM', 'https://esdm.go.id/en/media-center/news-archives/ekosistem-hidrogen-hijau-mulai-tumbuh-21-pembangkit-pln-resmi-beroperasi', 2023, 'resmi'),
  S('ibp-h2-21', 'PLN inaugurates 21 green hydrogen plants across Indonesia', 'Indonesia Business Post', 'https://indonesiabusinesspost.com/risks-opportunities/pln-inaugurates-21-green-hydrogen-plants-across-indonesia-aiming-to-lead-in-southeast-asia/', 2023),
  S('thinkgeo-ulubelu', 'Pertamina starts construction of green hydrogen pilot plant at Ulubelu geothermal site', 'ThinkGeoEnergy', 'https://www.thinkgeoenergy.com/pertamina-starts-construction-of-green-hydrogen-pilot-plant-at-ulubelu-geothermal-site-indonesia/', 2025),
  S('bfd-ulubelu', 'Pertamina Geothermal targets green hydrogen production in Ulubelu by late 2026', 'Biofuels Digest', 'https://biofuelsdigest.com/pertamina-geothermal-targets-green-hydrogen-production-in-ulubelu-by-late-2026/', 2026),
  S('reccessary-acwa', 'PLN, ACWA Power, Pupuk Indonesia join forces to develop green hydrogen and green ammonia', 'Reccessary', 'https://www.reccessary.com/en/news/pln-acwa-power-pupuk-indonesia-join-forces-to-develop-green-hydrogen-and-green-ammonia', null),
  S('hce-mitsubishi', 'Pertamina, PT Pupuk Indonesia and Mitsubishi Corp. to develop hydrogen and ammonia business', 'Hydrocarbon Engineering', 'https://www.hydrocarbonengineering.com/the-environment/08032022/', 2022),
  S('listrik-rhan', 'ESDM gelar sosialisasi RHAN dan persiapan Road to GHES 2026', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/18479/esdm-gelar-sosialisasi-rhan-dan-persiapan-road-to-ghes-2026-untuk-perkuat-ekosistem-hidrogen-nasional', 2025),
  S('warta-h2-2060', 'Dirjen EBTKE: demand hidrogen bakal tembus 9,9 juta ton per tahun di 2060', 'Warta Ekonomi', 'https://wartaekonomi.co.id/read545303/dirjen-ebtke-demand-hidrogen-bakal-tembus-99-juta-ton-pertahun-di-2060', 2024),
  S('bisnis-pgn-dart', 'PGN gandeng Dart Energy optimalkan CBM WK GMB Tanjung Enim', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20251218/44/1937868/pgn-gandeng-dart-energy-optimalkan-cbm-wk-gmb-tanjung-enim', 2025),
  S('migas-tanjungenim', 'Ditjen Migas kawal kolaborasi pengembangan CBM Tanjung Enim', 'Ditjen Migas ESDM', 'https://migas.esdm.go.id/post/dukung-ketahanan-energi-nasional-ditjen-migas-kawal-kolaborasi-pengembangan-cbm-tanjung-enim', 2025, 'resmi'),
  S('nuenergy', 'NuEnergy and Beijing partners agree to accelerate the Tanjung Enim CBM project', 'Indonesia Miner', 'https://indonesiaminer.com/news/detail/nuenergy-and-beijing-partners-agree-to-accelerate-the-tanjung-enim-cbm-project', null),
  S('bisnis-dme-bangkit', 'Proyek DME batu bara bangkit lagi usai mati suri', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20260112/44/1943420/proyek-dme-batu-bara-bangkit-lagi-usai-mati-suri', 2026),
  S('bisnis-dme-ptba', 'PTBA siapkan 120 juta ton batu bara untuk proyek hilirisasi DME', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20251020/44/1921837/ptba-siapkan-120-juta-ton-batu-bara-untuk-proyek-hilirisasi-dme', 2025),
  S('bisnis-dme-bkpm', 'BKPM sebut belum ada komitmen konkret investor untuk DME batu bara', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20251007/44/1918126/bkpm-sebut-belum-ada-komitmen-konkret-investor-untuk-dme-batu-bara', 2025),
  S('bisnis-dme-lpg', 'ESDM buka potensi alihkan subsidi LPG untuk proyek DME batu bara', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20251212/44/1936359/esdm-buka-potensi-alihkan-subsidi-lpg-untuk-proyek-dme-batu-bara', 2025),
  S('bisnis-cofiring-52', 'PLN targetkan co-firing 52 PLTU hingga akhir 2025', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20251102/44/1925298/pln-targetkan-co-firing-52-pltu-hingga-akhir-2025', 2025),
  S('listrik-nps-cofiring', 'PLN NPS pamer strategi dan inovasi co-firing di IBEA 2025', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/17142/pln-nps-pamer-strategi-dan-inovasi-co-firing-di-ibea-2025', 2025),
  S('antara-ip-biomassa', 'PLN IP produksi energi bersih biomassa 1.101,59 GWh pada 2025', 'Antara', 'https://www.antaranews.com/berita/5458527/pln-ip-produksi-energi-bersih-biomassa-110159-gwh-pada-2025/', 2026),
  S('republika-biomassa', 'PLN akui realisasi pemanfaatan biomassa masih di bawah target', 'Republika', 'https://ekonomi.republika.co.id/berita/t8wbqq416/pln-akui-realisasi-pemanfaatan-biomassa-masih-di-bawah-target', 2026),
  S('ibp-crea-cofiring', 'Biomass co-firing in Indonesian coal plants fails to cut emissions: CREA', 'Indonesia Business Post', 'https://indonesiabusinesspost.com/4410/society-environment-and-culture/biomass-co-firing-in-indonesian-coal-plants-fails-to-cut-emissions-crea', null, 'kajian'),
];

const O = { kesdm: 'l_7278e0528a', brin: 'l_973f60de15', pln: 'su_ed074ff5', plnip: 'p_5a2e7d0c63', plnnp: 'p_ff7a390a42', pertamina: 'p_b1c52ad7b0', nre: 'p_10e0dde689', pge: 'p_dda1e51dae', pupuk: 'en_5455f1bbf9', mind: 'p_978ca76d57' };
const pihak = (nama, org_id, peran, iso2) => ({ nama, org_id: org_id || null, peran, ...(iso2 ? { iso2 } : {}) });
const lin = (tgl, id, en, sumber) => ({ tgl, teks: { id, en }, sumber });
const R = (id, label) => ({ id, label });
const REG_ENERGI = R(null, 'UU 30/2007 tentang Energi (definisi energi baru: nuklir, hidrogen, gas metana batubara, batubara tercairkan dan tergaskan)');
const REG_RUU = R('lokal-431', 'RUU Energi Baru dan Energi Terbarukan');
const REG_KEN = R('pp-40-2025', 'PP 40/2025 tentang Kebijakan Energi Nasional');

const B = (o) => ({ tingkat_bukti: 'media', tanggal_periksa: T, proyek_ids: [], negara: [], regulasi: [], linimasa: [], angka: [], ...o });

const BUTIR = [
  /* ---------------- nuklir ---------------- */
  B({ id: 'nk-ruptl-pltn', bagian: 'nuklir', jenis: 'rencana-pltn', nama: { id: 'PLTN pertama dalam RUPTL 2025-2034', en: 'First nuclear plant in RUPTL 2025-2034' }, status: 'rencana',
    ringkas: { id: 'RUPTL 2025-2034 memuat PLTN 500 MW: 250 MW di Sumatera (target 2032) dan 250 MW di Kalimantan (target 2034). RUPTL menentukan sistem, bukan tapak persisnya; sumber berbeda soal tahun (2032 atau 2032-2034). Teknologi diarahkan ke SMR.', en: 'RUPTL 2025-2034 includes 500 MW of nuclear: 250 MW in Sumatra (target 2032) and 250 MW in Kalimantan (target 2034). RUPTL sets the system, not the exact site; sources differ on the year (2032 or 2032-2034). Technology points to SMR.' },
    kapasitas: { nilai: 500, satuan: 'MW' }, target_tahun: 2032, lokasi_teks: 'Sumatera (250 MW) dan Kalimantan (250 MW)', prov: null,
    pihak: [pihak('PT PLN (Persero)', O.pln, 'pemrakarsa'), pihak('Kementerian ESDM', O.kesdm, 'regulator perencanaan')], regulasi: [REG_ENERGI, REG_KEN, REG_RUU, R('uu-10-1997', 'UU 10/1997 tentang Ketenaganukliran')],
    linimasa: [lin('2025', 'RUPTL PLN 2025-2034 memasukkan PLTN 500 MW.', 'The 2025-2034 PLN RUPTL includes a 500 MW nuclear plant.', 'esdm-faq-ruptl'), lin('2025-08', 'PLN menyebut tambahan sekitar 7 GW nuklir hingga 2040 di luar RUPTL.', 'PLN says about 7 GW more nuclear by 2040, outside the RUPTL.', 'detik-7gw')],
    angka: [{ label: { id: 'Tambahan nuklir hingga 2040 menurut PLN (di luar RUPTL)', en: 'Extra nuclear by 2040 per PLN (outside RUPTL)' }, nilai: 7, satuan: 'GW' }], sumber_ids: ['kontan-ruptl', 'esdm-faq-ruptl', 'detik-7gw'] }),
  B({ id: 'nk-tapak-28', bagian: 'nuklir', jenis: 'tapak', nama: { id: 'Penetapan tapak PLTN nasional', en: 'National nuclear site selection' }, status: 'persiapan',
    ringkas: { id: 'ESDM menyiapkan 28 lokasi tapak (Okt 2026). Tender PLTN menunggu penetapan tapak dan pemerintah mengkaji kandidat tambahan. Topik Nuklir METI mencatat 29 calon lokasi di 13 wilayah (IBP 2025): selisih angka karena sumber dan tanggal berbeda.', en: 'ESDM prepared 28 candidate sites (Oct 2026). The plant tender waits for site determination and extra candidates are under review. METI\'s Nuclear topic lists 29 candidate sites in 13 regions (IBP 2025): the gap reflects different sources and dates.' },
    kapasitas: null, target_tahun: null, lokasi_teks: 'Nasional', prov: null, pihak: [pihak('Kementerian ESDM', O.kesdm, 'penetap tapak'), pihak('Bapeten', null, 'pemberi izin tapak')],
    regulasi: [R('pp-2-2014', 'PP 2/2014 Perizinan Instalasi Nuklir dan Pemanfaatan Bahan Nuklir'), R('pp-43-2006', 'PP 43/2006 Perizinan Reaktor Nuklir'), R('lainnya-b204020-1-2022', 'Peraturan Bapeten 1/2022 Perizinan Berusaha Berbasis Risiko Sektor Ketenaganukliran')],
    linimasa: [lin('2026-10-22', 'ESDM menyiapkan 28 tapak proyek pembangkit nuklir.', 'ESDM prepares 28 nuclear project sites.', 'cnbc-28tapak')], angka: [{ label: { id: 'Tapak disiapkan ESDM', en: 'Sites prepared by ESDM' }, nilai: 28, satuan: 'tapak' }], sumber_ids: ['cnbc-28tapak', 'katadata-tender'] }),
  B({ id: 'nk-thorcon', bagian: 'nuklir', jenis: 'proyek', nama: { id: 'ThorCon TMSR-500 Pulau Kelasa, Bangka Belitung', en: 'ThorCon TMSR-500 Kelasa Island, Bangka Belitung' }, status: 'persiapan',
    ringkas: { id: 'Bapeten menyetujui program evaluasi tapak ThorCon di Pulau Kelasa (Agustus 2025). Izin tapak belum terbit; ESDM menegaskan belum ada izin tapak yang diteken. Urutan izin menurut Bapeten: tapak, konstruksi, komisioning, operasi. Perusahaan menargetkan demonstrasi 500 MWe pada 2029 (klaim pemrakarsa).', en: 'Bapeten approved ThorCon\'s site evaluation programme on Kelasa Island (August 2025). The site permit has not been issued; ESDM stressed none has been signed. Permit sequence per Bapeten: site, construction, commissioning, operation. The company targets a 500 MWe demonstration by 2029 (sponsor claim).' },
    kapasitas: { nilai: 500, satuan: 'MWe' }, target_tahun: 2029, lokasi_teks: 'Pulau Kelasa, Bangka Belitung', prov: '19',
    pihak: [pihak('ThorCon International', null, 'pengembang', 'US'), pihak('Bapeten', null, 'pemberi izin'), pihak('Kementerian ESDM', O.kesdm, 'penetap izin tapak')], negara: ['US'],
    regulasi: [R('lainnya-b204020-1-2022', 'Peraturan Bapeten 1/2022'), R('pp-2-2014', 'PP 2/2014'), R('uu-10-1997', 'UU 10/1997')],
    linimasa: [lin('2025-08-07', 'Bapeten menerbitkan persetujuan evaluasi tapak PLTN ThorCon.', 'Bapeten issues site evaluation approval for ThorCon.', 'bapeten-sp003'), lin('2025-08-11', 'ESDM: izin tapak belum diteken Menteri.', 'ESDM: site permit not yet signed by the Minister.', 'bisnis-thorcon')], sumber_ids: ['bapeten-sp003', 'bisnis-thorcon', 'jp-thorcon'], tingkat_bukti: 'resmi' }),
  B({ id: 'nk-rsg-gas', bagian: 'nuklir', jenis: 'reaktor-riset', nama: { id: 'Reaktor riset RSG-GAS Serpong (BRIN)', en: 'RSG-GAS research reactor, Serpong (BRIN)' }, status: 'beroperasi',
    ringkas: { id: 'Reaktor serba guna 30 MWt di kawasan Puspiptek Serpong, dikelola BRIN. BRIN merevitalisasi fasilitas fabrikasi bahan bakar; pasokan bahan bakar RSG-GAS diproyeksikan cukup hingga 2026 saja (Maret 2026).', en: 'A 30 MWt multipurpose reactor at the Puspiptek Serpong complex, operated by BRIN. BRIN is revitalising fuel fabrication; RSG-GAS fuel supply is projected to last only until 2026 (March 2026).' },
    kapasitas: { nilai: 30, satuan: 'MWt' }, lokasi_teks: 'Puspiptek, Serpong, Banten', prov: '36', lat: -6.356, lng: 106.664, presisi: 'kawasan',
    pihak: [pihak('Badan Riset dan Inovasi Nasional', O.brin, 'operator'), pihak('Organisasi Riset Energi dan Manufaktur BRIN', 'l_0d81cf4cb1', 'unit riset')],
    regulasi: [R('uu-10-1997', 'UU 10/1997'), R('pp-54-2012', 'PP 54/2012 Keselamatan dan Keamanan Instalasi Nuklir')], linimasa: [lin('1992-03-23', 'Daya nominal 30 MWt tercapai.', 'Nominal 30 MWt power reached.', 'wiki-rsg'), lin('2026-03', 'BRIN memeriksa fasilitas untuk operasi reaktor; bahan bakar cukup hingga 2026.', 'BRIN inspects facilities for reactor operation; fuel lasts until 2026.', 'jawapos-brin')],
    sumber_ids: ['wiki-rsg', 'jawapos-brin'] }),
  B({ id: 'nk-nepio', bagian: 'nuklir', jenis: 'lembaga', nama: { id: 'NEPIO (organisasi pelaksana program tenaga nuklir)', en: 'NEPIO (nuclear energy programme implementing organisation)' }, status: 'persiapan',
    ringkas: { id: 'NEPIO disyaratkan IAEA untuk program PLTN. Pembentukan dijanjikan 2024 tetapi belum terjadi; per Mei 2026 Sekjen DEN menyebut NEPIO masih menunggu tanda tangan Presiden dan negara mitra strategis belum dipilih.', en: 'NEPIO is an IAEA requirement for a nuclear power programme. Creation was promised for 2024 but did not happen; as of May 2026 the DEN Secretary-General said NEPIO still awaits the President\'s signature and no strategic partner country has been chosen.' },
    kapasitas: null, lokasi_teks: 'Nasional', prov: null, pihak: [pihak('Dewan Energi Nasional', null, 'pengusul'), pihak('Kementerian ESDM', O.kesdm, 'penyusun struktur')],
    linimasa: [lin('2024-09', 'Pemerintah menjanjikan NEPIO terbentuk tahun 2024.', 'Government promises NEPIO would be set up in 2024.', 'kompas-nepio'), lin('2026-05', 'DEN: NEPIO menunggu tanda tangan Presiden.', 'DEN: NEPIO awaits presidential signature.', 'petromindo-nepio')], regulasi: [REG_KEN], sumber_ids: ['kompas-nepio', 'petromindo-nepio'] }),
  B({ id: 'nk-rosatom', bagian: 'nuklir', jenis: 'kerja-sama', nama: { id: 'Kerja sama BRIN dan Rosatom (Rusia)', en: 'BRIN and Rosatom (Russia) cooperation' }, status: 'kerja-sama',
    ringkas: { id: 'Pembahasan Juli 2025: revitalisasi fasilitas nuklir Puspiptek, penguatan SDM, dan ekosistem riset. Belum menjadi kontrak PLTN.', en: 'July 2025 talks: revitalising Puspiptek nuclear facilities, human resources and research ecosystem. Not a plant contract.' },
    lokasi_teks: 'Serpong', prov: '36', pihak: [pihak('BRIN', O.brin, 'mitra'), pihak('Rosatom', null, 'mitra', 'RU')], negara: ['RU'], linimasa: [lin('2025-07', 'BRIN membahas kerja sama dengan Rosatom.', 'BRIN discusses cooperation with Rosatom.', 'viva-rosatom')], sumber_ids: ['viva-rosatom', 'petromindo-nepio'] }),
  B({ id: 'nk-smr-as-kr', bagian: 'nuklir', jenis: 'kerja-sama', nama: { id: 'Pembahasan SMR dengan Holtec (AS) dan Hyundai E&C (Korea Selatan)', en: 'SMR talks with Holtec (US) and Hyundai E&C (South Korea)' }, status: 'kerja-sama',
    ringkas: { id: 'BRIN membahas desain SMR-160 dan penyesuaian lokasi; dokumen kerja sama masih dibahas bagian hukum para pihak. Tanggal sumber lama (2023); status mungkin berubah. Petromindo (2026) juga mencatat pembicaraan nuklir dengan Rusia, AS, dan Jepang menjelang NEPIO.', en: 'BRIN discussed the SMR-160 design and site adaptation; the cooperation document is still with the parties\' legal teams. The source is older (2023); status may have changed. Petromindo (2026) also notes nuclear talks with Russia, the US and Japan ahead of NEPIO.' },
    lokasi_teks: 'Nasional', pihak: [pihak('BRIN', O.brin, 'mitra'), pihak('Holtec International', null, 'pemasok teknologi', 'US'), pihak('Hyundai Engineering & Construction', null, 'kontraktor', 'KR')], negara: ['US', 'KR', 'JP'], sumber_ids: ['listrik-smr160', 'petromindo-nepio'] }),

  /* ---------------- hidrogen dan amonia ---------------- */
  B({ id: 'h2-rhan', bagian: 'hidrogen', jenis: 'peta-jalan', nama: { id: 'Strategi Hidrogen Nasional dan Peta Jalan Hidrogen-Amonia (RHAN)', en: 'National Hydrogen Strategy and Hydrogen-Ammonia Roadmap (RHAN)' }, status: 'rencana',
    ringkas: { id: 'SHN diluncurkan Desember 2023; RHAN diluncurkan 15 April 2025 dengan tahap inisiasi 2025-2034, pengembangan 2035-2045, akselerasi 2045-2060. Proyeksi kebutuhan hidrogen 2060: 9,9 juta ton per tahun (Dirjen EBTKE); sumber lain menyebut 11,7 juta ton, belum dipastikan mana yang resmi.', en: 'The SHN was launched December 2023; the RHAN on 15 April 2025 with phases 2025-2034 initiation, 2035-2045 development, 2045-2060 acceleration. 2060 hydrogen demand projection: 9.9 million t/year (DG EBTKE); another source says 11.7 million t, which one is official is unconfirmed.' },
    kapasitas: null, target_tahun: 2060, lokasi_teks: 'Nasional', pihak: [pihak('Kementerian ESDM', O.kesdm, 'penyusun')], regulasi: [REG_ENERGI, REG_KEN, REG_RUU, R('permen-esdm-10-2025', 'Permen ESDM 10/2025 Peta Jalan Transisi Energi Ketenagalistrikan')],
    linimasa: [lin('2023-12', 'Strategi Hidrogen Nasional diluncurkan.', 'National Hydrogen Strategy launched.', 'listrik-rhan'), lin('2025-04-15', 'RHAN diluncurkan.', 'RHAN launched.', 'listrik-rhan')], angka: [{ label: { id: 'Proyeksi kebutuhan hidrogen 2060 (Dirjen EBTKE)', en: 'Projected 2060 hydrogen demand (DG EBTKE)' }, nilai: 9.9, satuan: 'juta ton/tahun' }], sumber_ids: ['listrik-rhan', 'warta-h2-2060'] }),
  B({ id: 'h2-pln21', bagian: 'hidrogen', jenis: 'pilot', nama: { id: '21 pembangkit hidrogen hijau PLN', en: 'PLN\'s 21 green hydrogen plants' }, status: 'beroperasi',
    ringkas: { id: 'Diresmikan 20 November 2023: 12 unit PLN Indonesia Power, 8 unit PLN Nusantara Power, 1 unit UIKJTB. Kapasitas produksi sekitar 199 ton per tahun (203 ton dengan 22 unit menurut pemberitaan lanjutan). Pembangkit pertama, Muara Karang, sekitar 43 ton per tahun. Angka milik PLN.', en: 'Inaugurated 20 November 2023: 12 units from PLN Indonesia Power, 8 from PLN Nusantara Power, 1 from UIKJTB. Production capacity about 199 t/year (203 t with 22 units per later reports). The first plant, Muara Karang, about 43 t/year. Figures are PLN\'s.' },
    kapasitas: { nilai: 199, satuan: 'ton H2/tahun' }, lokasi_teks: 'Muara Karang, Jakarta, dan 20 lokasi PLN lain', prov: '31', lat: -6.111, lng: 106.783, presisi: 'perkiraan',
    pihak: [pihak('PT PLN (Persero)', O.pln, 'pemilik'), pihak('PT PLN Indonesia Power', O.plnip, 'operator'), pihak('PT PLN Nusantara Power', O.plnnp, 'operator')], regulasi: [REG_ENERGI],
    linimasa: [lin('2023-11-20', '21 pembangkit hidrogen hijau PLN diresmikan.', '21 PLN green hydrogen plants inaugurated.', 'esdm-h2-21')], sumber_ids: ['esdm-h2-21', 'ibp-h2-21'], tingkat_bukti: 'resmi' }),
  B({ id: 'h2-ulubelu', bagian: 'hidrogen', jenis: 'pilot', nama: { id: 'Pilot hidrogen hijau PGE Ulubelu (Lampung)', en: 'PGE Ulubelu green hydrogen pilot (Lampung)' }, status: 'konstruksi',
    ringkas: { id: 'Pilot elektrolisis berdaya listrik PLTP Ulubelu, hingga 100 kg per hari, belanja modal USD 3 juta. Konstruksi dimulai September 2025; produksi ditargetkan akhir 2026. Calon pembeli: Toyota Indonesia sekitar 20 kg per hari dan satu anak usaha Pertamina sekitar 50 kg per hari. Awalnya ditargetkan 2023.', en: 'Electrolysis pilot powered by the Ulubelu geothermal plant, up to 100 kg/day, USD 3 million capex. Construction began September 2025; production targeted end-2026. Prospective offtakers: Toyota Indonesia about 20 kg/day and a Pertamina subsidiary about 50 kg/day. Originally targeted 2023.' },
    kapasitas: { nilai: 100, satuan: 'kg H2/hari' }, target_tahun: 2026, proyek_ids: ['pj_0249'], lokasi_teks: 'PLTP Ulubelu, Tanggamus, Lampung', prov: '18', lat: -5.31, lng: 104.6, presisi: 'kawasan',
    pihak: [pihak('PT Pertamina Geothermal Energy Tbk', O.pge, 'pengembang'), pihak('PT Pertamina (Persero)', O.pertamina, 'induk'), pihak('Toyota Indonesia', null, 'calon pembeli', 'JP')], negara: [],
    linimasa: [lin('2025-09', 'Konstruksi pilot dimulai (groundbreaking).', 'Pilot construction starts (groundbreaking).', 'thinkgeo-ulubelu'), lin('2026-02', 'PGE menargetkan produksi akhir 2026.', 'PGE targets production by end-2026.', 'bfd-ulubelu')], sumber_ids: ['thinkgeo-ulubelu', 'bfd-ulubelu'] }),
  B({ id: 'h2-gresik', bagian: 'hidrogen', jenis: 'kerja-sama', nama: { id: 'PLN, ACWA Power, Pupuk Indonesia: hidrogen dan amonia hijau Gresik', en: 'PLN, ACWA Power, Pupuk Indonesia: Gresik green hydrogen and ammonia' }, status: 'kerja-sama',
    ringkas: { id: 'Kerja sama pengembangan hidrogen dan amonia hijau: Pupuk Indonesia berencana PLTS di Banyuwangi dan pabrik hidrogen di Gresik, Jawa Timur. Kapasitas dan tanggal keputusan investasi tidak ditemukan di sumber yang dibaca.', en: 'Cooperation on green hydrogen and ammonia: Pupuk Indonesia plans solar in Banyuwangi and a hydrogen plant in Gresik, East Java. Capacity and investment decision date not found in the sources read.' },
    lokasi_teks: 'Gresik dan Banyuwangi, Jawa Timur', prov: '35', lat: -7.157, lng: 112.655, presisi: 'kota', pihak: [pihak('PT PLN (Persero)', O.pln, 'mitra'), pihak('Pupuk Indonesia', O.pupuk, 'mitra'), pihak('ACWA Power', null, 'mitra', 'SA')], negara: ['SA'], sumber_ids: ['reccessary-acwa'] }),
  B({ id: 'h2-pertamina-mitsubishi', bagian: 'hidrogen', jenis: 'kerja-sama', nama: { id: 'Pertamina, Pupuk Indonesia, Mitsubishi: rantai nilai hidrogen-amonia dan CCUS', en: 'Pertamina, Pupuk Indonesia, Mitsubishi: hydrogen-ammonia value chain and CCUS' }, status: 'kerja-sama',
    ringkas: { id: 'Kesepakatan Maret 2022 mengembangkan rantai nilai hidrogen dan amonia hijau serta CCUS. Kapasitas dan status proyek turunan tidak ditemukan.', en: 'March 2022 agreement to develop the green hydrogen and ammonia value chain plus CCUS. Capacity and status of follow-on projects not found.' },
    lokasi_teks: 'Nasional', pihak: [pihak('PT Pertamina (Persero)', O.pertamina, 'mitra'), pihak('Pupuk Indonesia', O.pupuk, 'mitra'), pihak('Mitsubishi Corporation', null, 'mitra', 'JP')], negara: ['JP'], linimasa: [lin('2022-03', 'Kesepakatan tiga pihak ditandatangani.', 'Three-party agreement signed.', 'hce-mitsubishi')], sumber_ids: ['hce-mitsubishi'] }),

  /* ---------------- CBM ---------------- */
  B({ id: 'cbm-tanjungenim', bagian: 'cbm', jenis: 'wilayah-kerja', nama: { id: 'WK GMB Tanjung Enim (Sumatera Selatan)', en: 'Tanjung Enim CBM block (South Sumatra)' }, status: 'persiapan',
    ringkas: { id: 'PGN dan Dart Energy menandatangani perjanjian jual beli gas CBM dari WK GMB Tanjung Enim (Desember 2025). Pemerintah mengupayakan status proyek strategis nasional. NuEnergy dan mitra Tiongkok juga sepakat mempercepat proyek ini. Volume produksi tidak ditemukan.', en: 'PGN and Dart Energy signed a gas sale and purchase agreement for CBM from the Tanjung Enim block (December 2025). The government is working towards national strategic project status. NuEnergy and Chinese partners also agreed to accelerate the project. Production volume not found.' },
    lokasi_teks: 'Tanjung Enim, Muara Enim, Sumatera Selatan', prov: '16', lat: -3.75, lng: 103.8, presisi: 'kawasan', pihak: [pihak('PT Perusahaan Gas Negara Tbk', null, 'pembeli'), pihak('Dart Energy', null, 'kontraktor'), pihak('SKK Migas', null, 'pengawas'), pihak('Ditjen Migas', O.kesdm, 'regulator')],
    regulasi: [REG_ENERGI], linimasa: [lin('2025-12-18', 'GSPA PGN dan Dart Energy ditandatangani.', 'PGN and Dart Energy GSPA signed.', 'bisnis-pgn-dart')], sumber_ids: ['bisnis-pgn-dart', 'migas-tanjungenim', 'nuenergy'] }),
  B({ id: 'cbm-sumberdaya', bagian: 'cbm', jenis: 'sumberdaya', nama: { id: 'Sumberdaya CBM nasional', en: 'National CBM resource' }, status: 'rencana',
    ringkas: { id: 'Sumberdaya sekitar 453 TCF di 11 cekungan, terbanyak Sumatera Selatan, Sumatera Tengah, Barito, dan Kutai. Angka lama: produksi hanya 0,33 MMSCFD dari lapangan Sanga-Sanga dan sekitar 54 WK; sebuah kajian 2022 mencatat hanya 7% dari 51 kontrak eksplorasi memenuhi komitmen. Data produksi 2025 tidak ditemukan.', en: 'About 453 TCF of resource across 11 basins, mostly South Sumatra, Central Sumatra, Barito and Kutai. Older figures: production only 0.33 MMSCFD from Sanga-Sanga and about 54 blocks; a 2022 review notes only 7% of 51 exploration contracts met commitments. 2025 production data not found.' },
    kapasitas: { nilai: 453, satuan: 'TCF (sumberdaya)' }, lokasi_teks: 'Sumatera dan Kalimantan', prov: null, pihak: [pihak('Ditjen Migas', O.kesdm, 'regulator')], regulasi: [REG_ENERGI], tingkat_bukti: 'media', sumber_ids: ['migas-tanjungenim', 'bisnis-pgn-dart'] }),

  /* ---------------- DME ---------------- */
  B({ id: 'dme-ptba', bagian: 'dme', jenis: 'proyek', nama: { id: 'Hilirisasi batubara menjadi DME (Tanjung Enim, PTBA)', en: 'Coal-to-DME downstreaming (Tanjung Enim, PTBA)' }, status: 'tertunda',
    ringkas: { id: 'Air Products keluar dari kemitraan dengan PTBA (2023). Proyek dihidupkan lagi Januari 2026 dengan MIND ID/PTBA sebagai pemasok batubara dan Pertamina sebagai pembeli DME, SNG, dan metanol, dengan Danantara. Rencana pilot 1,4 juta ton DME per tahun dari sekitar 6 juta ton batubara di kawasan industri BACBIE 600 ha. PTBA menyiapkan 120 juta ton batubara; BKPM (Okt 2025) belum melihat komitmen investor konkret; ESDM membuka peluang mengalihkan subsidi LPG ke DME. Groundbreaking tertunda, belum ada penutupan pembiayaan.', en: 'Air Products left the PTBA partnership (2023). The project was revived in January 2026 with MIND ID/PTBA as coal supplier and Pertamina as offtaker of DME, SNG and methanol, with Danantara. Pilot plan 1.4 million t DME/year from about 6 million t coal in the 600 ha BACBIE estate. PTBA set aside 120 million t of coal; BKPM (Oct 2025) saw no concrete investor commitment; ESDM is open to shifting LPG subsidy to DME. Groundbreaking delayed, no financial close.' },
    kapasitas: { nilai: 1.4, satuan: 'juta ton DME/tahun' }, target_tahun: 2026, lokasi_teks: 'Tanjung Enim, Muara Enim, Sumatera Selatan', prov: '16', lat: -3.75, lng: 103.8, presisi: 'kawasan',
    pihak: [pihak('PT Bukit Asam Tbk', null, 'pemasok batubara'), pihak('MIND ID', O.mind, 'induk'), pihak('PT Pertamina (Persero)', O.pertamina, 'pembeli'), pihak('Danantara', null, 'pendana'), pihak('Air Products and Chemicals', null, 'mitra terdahulu (keluar 2023)', 'US')], negara: ['US'],
    regulasi: [REG_ENERGI, R('keppres-1-2025', 'Keppres 1/2025 Satgas Percepatan Hilirisasi dan Ketahanan Energi Nasional')],
    linimasa: [lin('2023', 'Air Products keluar dari proyek.', 'Air Products exits the project.', 'bisnis-dme-bangkit'), lin('2025-10', 'PTBA siapkan 120 juta ton batubara; BKPM belum lihat komitmen investor.', 'PTBA readies 120 million t coal; BKPM sees no investor commitment.', 'bisnis-dme-bkpm'), lin('2026-01-12', 'Proyek dihidupkan lagi dengan skema BUMN.', 'Project revived under a state-owned scheme.', 'bisnis-dme-bangkit')],
    angka: [{ label: { id: 'Batubara disiapkan PTBA', en: 'Coal set aside by PTBA' }, nilai: 120, satuan: 'juta ton' }], sumber_ids: ['bisnis-dme-bangkit', 'bisnis-dme-ptba', 'bisnis-dme-bkpm', 'bisnis-dme-lpg'] }),

  /* ---------------- co-firing biomassa ---------------- */
  B({ id: 'cf-nasional', bagian: 'cofiring', jenis: 'program', nama: { id: 'Program co-firing biomassa PLTU PLN', en: 'PLN biomass co-firing programme' }, status: 'beroperasi',
    ringkas: { id: 'Target 2025: 52 PLTU berkapasitas 18.895 MW, kebutuhan sekitar 10,2 juta ton biomassa, setara 12,71 TWh (3,59% bauran). Realisasi: 47 PLTU (2024) dan 48 lokasi menjelang akhir 2025; pasokan PLN EPI sekitar 2,35 juta ton, PLN Group sekitar 2,2 juta ton, di bawah target 3 juta ton. PLN Indonesia Power: 1,14 juta ton biomassa dan 1.101,59 GWh (2025). CREA menilai co-firing tidak menurunkan emisi secara berarti.', en: '2025 target: 52 coal plants totalling 18,895 MW, about 10.2 million t of biomass needed, equal to 12.71 TWh (3.59% of mix). Actual: 47 plants (2024) and 48 sites by late 2025; PLN EPI supplied about 2.35 million t, PLN Group about 2.2 million t, below the 3 million t target. PLN Indonesia Power: 1.14 million t of biomass and 1,101.59 GWh (2025). CREA finds co-firing does not meaningfully cut emissions.' },
    kapasitas: { nilai: 18895, satuan: 'MW (target 52 PLTU)' }, target_tahun: 2025, lokasi_teks: 'Nasional', prov: null,
    pihak: [pihak('PT PLN (Persero)', O.pln, 'pelaksana'), pihak('PT PLN Indonesia Power', O.plnip, 'pelaksana'), pihak('PT PLN Nusantara Power', O.plnnp, 'pelaksana'), pihak('PLN Energi Primer Indonesia', null, 'pemasok biomassa')],
    regulasi: [R('permen-esdm-12-2023', 'Permen ESDM 12/2023 Pemanfaatan Biomassa sebagai Campuran Bahan Bakar PLTU'), R('perpres-112-2022', 'Perpres 112/2022'), REG_ENERGI],
    angka: [{ label: { id: 'PLTU co-firing 2025 (target)', en: 'Co-firing plants 2025 (target)' }, nilai: 52, satuan: 'PLTU' }, { label: { id: 'Biomassa dipasok PLN EPI 2025', en: 'Biomass supplied by PLN EPI 2025' }, nilai: 2.35, satuan: 'juta ton' }, { label: { id: 'Target biomassa 2025', en: '2025 biomass target' }, nilai: 3, satuan: 'juta ton' }],
    linimasa: [lin('2025-11-02', 'PLN menargetkan co-firing 52 PLTU hingga akhir 2025.', 'PLN targets co-firing at 52 plants by end-2025.', 'bisnis-cofiring-52'), lin('2026-01-15', 'PLN akui realisasi biomassa di bawah target.', 'PLN admits biomass uptake below target.', 'republika-biomassa')],
    sumber_ids: ['bisnis-cofiring-52', 'listrik-nps-cofiring', 'antara-ip-biomassa', 'republika-biomassa', 'ibp-crea-cofiring'] }),
  B({ id: 'cf-bangka', bagian: 'cofiring', jenis: 'unit', nama: { id: 'Co-firing PLTU Bangka (PLN Nusantara Power)', en: 'Bangka coal plant co-firing (PLN Nusantara Power)' }, status: 'beroperasi',
    ringkas: { id: 'Serpihan kayu dan cangkang sawit, campuran 5 sampai 25 persen; lolos uji ketahanan 3.000 jam. Realisasi biomassa April 2025: Bangka 16.340 ton. Tautan ke PLTU Bangka Baru (GEM) berdasarkan nama dan lokasi, belum dikonfirmasi operator.', en: 'Wood chips and palm kernel shells, blend of 5 to 25 percent; passed a 3,000-hour durability test. April 2025 biomass: Bangka 16,340 t. Link to Bangka Baru (GEM) is by name and location, not confirmed by the operator.' },
    kapasitas: { nilai: 60, satuan: 'MW (PLTU Bangka Baru, GEM)' }, lokasi_teks: 'Air Anyir, Bangka, Bangka Belitung', prov: '19', pltu_ids: ['L100000102693'], pihak: [pihak('PT PLN Nusantara Power', O.plnnp, 'operator')],
    angka: [{ label: { id: 'Biomassa April 2025', en: 'Biomass April 2025' }, nilai: 16340, satuan: 'ton' }, { label: { id: 'Persen campuran maksimum', en: 'Maximum blend' }, nilai: 25, satuan: '%' }], regulasi: [R('permen-esdm-12-2023', 'Permen ESDM 12/2023')], sumber_ids: ['listrik-nps-cofiring'] }),
  B({ id: 'cf-kendari', bagian: 'cofiring', jenis: 'unit', nama: { id: 'Co-firing PLTU Kendari, Belitung, dan Ropa', en: 'Co-firing at Kendari, Belitung and Ropa plants' }, status: 'beroperasi',
    ringkas: { id: 'Peta pelaksanaan April 2025 (PLN NPS): Kendari 4.323 ton, Belitung 3.115 ton, Ropa 273 ton. Persen campuran dan pemasok per PLTU tidak disebut. Tautan ke Kendari-3 (GEM) berdasarkan nama.', en: 'April 2025 implementation map (PLN NPS): Kendari 4,323 t, Belitung 3,115 t, Ropa 273 t. Blend percent and supplier per plant not stated. Link to Kendari-3 (GEM) is by name.' },
    lokasi_teks: 'Kendari (Sulawesi Tenggara), Belitung, Ropa (NTT)', prov: '74', pltu_ids: ['L100000102810'], pihak: [pihak('PT PLN Nusantara Power', O.plnnp, 'operator')],
    angka: [{ label: { id: 'Kendari', en: 'Kendari' }, nilai: 4323, satuan: 'ton' }, { label: { id: 'Belitung', en: 'Belitung' }, nilai: 3115, satuan: 'ton' }, { label: { id: 'Ropa', en: 'Ropa' }, nilai: 273, satuan: 'ton' }], sumber_ids: ['listrik-nps-cofiring'] }),
];

export const CELAH = [
  'Kerja sama nuklir dengan Kanada, Prancis, Tiongkok, Korea (di luar Hyundai E&C), dan Jepang: tidak ditemukan dokumen terverifikasi; hanya Rusia, AS, Korea (Hyundai) tercatat per butir.',
  'Produksi CBM nasional 2025 dan daftar WK CBM terkini: tidak ditemukan di sumber yang dibaca; angka sumberdaya dan produksi lama diberi label.',
  'Kapasitas dan tanggal keputusan investasi proyek amonia hijau/biru Pertamina NRE dan Pupuk: tidak ditemukan.',
  'Daftar PLTU co-firing lengkap (48-52 lokasi) dengan persen campuran dan pemasok per unit: hanya Bangka, Kendari, Belitung, Ropa yang terbaca; sisanya menunggu laporan PLN.',
  'Bapeten dan ThorCon belum ada di direktori organisasi (org_id kosong) sampai dimasukkan kurator.',
];

export function bangun() {
  const reg = new Set(j('public/data/regulasi.json').baris.map((r) => r.id));
  const org = new Set(j('public/data/organisasi.json').baris.map((r) => r.id));
  const sid = new Set(SUMBER.map((s) => s.id));
  for (const b of BUTIR) {
    for (const r of b.regulasi) if (r.id && !reg.has(r.id)) throw new Error(`regulasi tidak ada: ${r.id} (${b.id})`);
    for (const p of b.pihak || []) if (p.org_id && !org.has(p.org_id)) throw new Error(`org tidak ada: ${p.org_id} (${b.id})`);
    for (const s of b.sumber_ids) if (!sid.has(s)) throw new Error(`sumber tidak ada: ${s} (${b.id})`);
    for (const l of b.linimasa) if (!sid.has(l.sumber)) throw new Error(`sumber linimasa: ${l.sumber} (${b.id})`);
  }
  const pj = new Set(j('public/data/proyek.json').baris.map((p) => p.id));
  for (const b of BUTIR) for (const id of b.proyek_ids) if (!pj.has(id)) throw new Error('proyek tidak ada: ' + id);
  const plt = new Map(j('public/data/pltu.json').baris.map((p) => [p.id, p]));
  for (const b of BUTIR) for (const id of b.pltu_ids || []) { const p = plt.get(id); if (!p) throw new Error('pltu tidak ada: ' + id); b.lat = p.lat; b.lng = p.lng; b.presisi = 'titik PLTU (GEM)'; }
  const negara = [...new Set(BUTIR.flatMap((b) => [...b.negara, ...(b.pihak || []).map((p) => p.iso2).filter(Boolean)]))].sort();
  const meta = {
    diperbarui: T, jumlah_butir: BUTIR.length, per_bagian: Object.fromEntries(BAGIAN.map((k) => [k, BUTIR.filter((b) => b.bagian === k).length])), negara, celah: CELAH,
    definisi: { id: 'Energi baru (huruf B pada EBET) menurut UU 30/2007 tentang Energi dan RUU EBET mencakup nuklir, hidrogen, gas metana batubara, batubara tercairkan, dan batubara tergaskan.', en: 'New energy (the B in EBET) under Law 30/2007 on Energy and the EBET bill covers nuclear, hydrogen, coal-bed methane, liquefied coal and gasified coal.' },
  };
  return { lapis: 'publik', dibangun_pada: T, jumlah: BUTIR.length, meta, sumber: SUMBER, baris: BUTIR };
}

async function cekUrl() {
  const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
  const robots = new Map();
  const boleh = async (u) => {
    const { origin, pathname } = new URL(u);
    if (!robots.has(origin)) { try { robots.set(origin, await (await fetch(origin + '/robots.txt', { headers: { 'user-agent': UA } })).text()); } catch { robots.set(origin, ''); } await new Promise((r) => setTimeout(r, 2000)); }
    const baris = robots.get(origin).split('\n'); let umum = false;
    for (const l of baris) { const m = l.match(/^\s*user-agent:\s*(.*)/i); if (m) umum = m[1].trim() === '*'; const d = l.match(/^\s*disallow:\s*(\S+)/i); if (umum && d && pathname.startsWith(d[1])) return false; }
    return true;
  };
  for (const s of SUMBER) {
    if (!(await boleh(s.url))) { console.log('robots melarang', s.url); continue; }
    const r = await fetch(s.url, { method: 'HEAD', headers: { 'user-agent': UA }, redirect: 'follow' }).catch(() => null);
    console.log(r ? r.status : 'galat', s.id);
    if (r && (r.status === 403 || r.status === 429)) { console.log('berhenti: ' + r.status); break; }
    await new Promise((x) => setTimeout(x, 2000));
  }
}

if (process.argv.includes('--bangun')) {
  const d = bangun();
  fs.writeFileSync(path.join(ROOT, 'public/data/energi_baru.json'), JSON.stringify(d) + '\n');
  console.log(JSON.stringify(d.meta.per_bagian), d.meta.negara.join(','));
}
if (process.argv.includes('--cek-url')) await cekUrl();
if (process.argv.includes('--selftest')) {
  const d = bangun(); assert.equal(d.baris.length, new Set(d.baris.map((b) => b.id)).size);
  for (const b of d.baris) { assert.ok(BAGIAN.includes(b.bagian)); assert.ok(STATUS.includes(b.status), b.id); assert.ok(b.sumber_ids.length, b.id); }
  console.log('ok');
}
