// Benih daftar perusahaan EBET Indonesia untuk panen_perusahaan.mjs. Data, bukan logika.
// Baris benih: batch|nama|jenis|peran,peran|kepakaran,kode|induk|kota|provinsi|situs|kode_saham
//   jenis: bumn|swasta|asing|patungan|koperasi|tbk|tidak-diketahui   (tidak-diketahui = belum ada sumber)
//   situs kosong = belum ketemu di sumber; TIDAK ditebak (aturan pemilik: tanpa pencarian gambar/sosial, tanpa tebak).
// Semua nilai di sini dari pengetahuan peneliti (tingkat_bukti 'inferensi') sampai satu halaman resmi mengonfirmasi;
// panen_perusahaan.mjs --situs menaikkan ke 'kata-pihak' hanya untuk situs yang terbaca dan memuat nama.
export const SUMBER_BENIH = 'pengetahuan peneliti METI, belum diverifikasi sumber primer';

export const BENIH = `
1|PT Perusahaan Listrik Negara (Persero)|bumn|operator,pengembang|jaringan,surya,hidro|Danantara|Jakarta|DKI Jakarta|https://web.pln.co.id|
1|PT PLN Indonesia Power|bumn|operator,pengembang|surya,hidro,panas-bumi|PLN|Jakarta|DKI Jakarta|https://www.plnindonesiapower.co.id|
1|PT PLN Nusantara Power|bumn|operator|hidro,surya|PLN|Jakarta|DKI Jakarta|https://plnnusantarapower.co.id|
1|PT PLN Energi Primer Indonesia|bumn|operator|bioenergi,biomassa-sampah|PLN|Jakarta|DKI Jakarta|https://plnepi.co.id|
1|PT PLN Enjiniring|bumn|EPC,konsultan|jaringan|PLN|Jakarta|DKI Jakarta|https://plnenjiniring.co.id|
1|PT PLN Icon Plus|bumn|operator|jaringan,efisiensi|PLN|Jakarta|DKI Jakarta|https://iconpln.co.id|
1|PT Indonesia Power Renewable|bumn|pengembang|surya,hidro,bayu|PLN Indonesia Power|Jakarta|DKI Jakarta||
1|PT Pertamina (Persero)|bumn|operator,produsen BBN|bioenergi,panas-bumi,hidrogen|Danantara|Jakarta|DKI Jakarta|https://www.pertamina.com|
1|PT Pertamina New & Renewable Energy|bumn|pengembang|surya,bayu,hidrogen,panas-bumi|Pertamina|Jakarta|DKI Jakarta|https://pnre.pertamina.com|
1|PT Pertamina Geothermal Energy Tbk|tbk|pengembang,operator|panas-bumi|Pertamina|Jakarta|DKI Jakarta|https://pge.pertamina.com|PGEO
1|PT Pertamina Patra Niaga|bumn|produsen BBN|bioenergi|Pertamina|Jakarta|DKI Jakarta|https://pertaminapatraniaga.com|
1|PT Kilang Pertamina Internasional|bumn|produsen BBN|bioenergi|Pertamina|Jakarta|DKI Jakarta|https://kpi.pertamina.com|
1|PT Pertamina Power Indonesia|bumn|pengembang|surya,hidrogen,penyimpanan|Pertamina|Jakarta|DKI Jakarta||
1|PT Geo Dipa Energi (Persero)|bumn|pengembang,operator|panas-bumi|Kemenkeu/PT SMI/Pertamina|Jakarta|DKI Jakarta|https://geodipa.co.id|
1|Badan Pengelola Investasi Daya Anagata Nusantara (Danantara)|bumn|pembiaya|pembiayaan|Pemerintah RI|Jakarta|DKI Jakarta|https://www.danantaraindonesia.com|
1|MIND ID (PT Mineral Industri Indonesia (Persero))|bumn|manufaktur|industri,penyimpanan|Danantara|Jakarta|DKI Jakarta|https://mind.id|
1|PT Indonesia Asahan Aluminium (Persero)|bumn|manufaktur|industri,penyimpanan|MIND ID|Jakarta|DKI Jakarta|https://inalum.id|
1|PT Bukit Asam Tbk|tbk|produsen BBN,operator|biomassa-sampah,industri|MIND ID|Jakarta|DKI Jakarta|https://www.ptba.co.id|PTBA
1|PT Len Industri (Persero)|bumn|manufaktur,EPC|surya,industri|Defend ID|Bandung|Jawa Barat|https://www.len.co.id|
1|PT Wijaya Karya (Persero) Tbk|tbk|EPC|hidro,surya,industri|Danantara|Jakarta|DKI Jakarta|https://www.wika.co.id|WIKA
1|PT Indonesia Battery Corporation|bumn|manufaktur|penyimpanan,elektrifikasi|MIND ID/Pertamina/PLN/Aneka Tambang|Jakarta|DKI Jakarta||
1|PT Sarana Multi Infrastruktur (Persero)|bumn|pembiaya|pembiayaan|Kemenkeu|Jakarta|DKI Jakarta|https://www.ptsmi.co.id|
1|PT Indonesia Infrastructure Finance|patungan|pembiaya|pembiayaan|PT SMI/ADB/IFC/DEG/SMBC|Jakarta|DKI Jakarta|https://iif.co.id|
1|PT Penjaminan Infrastruktur Indonesia (Persero)|bumn|pembiaya|pembiayaan|Kemenkeu|Jakarta|DKI Jakarta|https://iigf.co.id|
1|PT Hutama Karya (Persero)|bumn|EPC|jaringan,surya|Danantara|Jakarta|DKI Jakarta|https://www.hutamakarya.com|
1|PT Rekayasa Industri|bumn|EPC|bioenergi,panas-bumi,industri|Pupuk Indonesia|Jakarta|DKI Jakarta|https://www.rekayasa.com|
1|PT Adhi Karya (Persero) Tbk|tbk|EPC|surya,industri|Danantara|Jakarta|DKI Jakarta|https://adhi.co.id|ADHI
1|PT Agrinas Pangan Nusantara (Persero)|bumn|produsen BBN|bioenergi|Danantara|Jakarta|DKI Jakarta||
1|PT Perkebunan Nusantara III (Persero)|bumn|produsen BBN|bioenergi|Danantara|Medan|Sumatera Utara|https://holding-perkebunan.com|
1|PT Energi Agro Nusantara|bumn|produsen BBN|bioenergi|PTPN III|Mojokerto|Jawa Timur||
1|PT Surveyor Indonesia (ID Survey)|bumn|konsultan|efisiensi,industri|Danantara|Jakarta|DKI Jakarta|https://www.ptsi.co.id|
1|PT Biro Klasifikasi Indonesia (BKI)|bumn|konsultan|industri|Danantara|Jakarta|DKI Jakarta|https://www.bki.co.id|
2|PT Trina Mas Agra Indonesia|patungan|manufaktur|surya,industri|Trina Solar / Agra Mas|Kendal|Jawa Tengah||
2|PT Longi Pertamina Power Indonesia (JV)|patungan|manufaktur|surya,industri|LONGi Green Energy / Pertamina Power Indonesia|Bekasi|Jawa Barat||
2|PT Lesso New Energy|asing|manufaktur|surya,industri|Lesso Group|Demak|Jawa Tengah||
2|PT SEG Solar Manufaktur Indonesia|asing|manufaktur|surya,industri|SEG Solar Inc|Batang|Jawa Tengah||
2|PT REC Solar Energy Indonesia|asing|manufaktur|surya,industri|REC Group|Batam|Kepulauan Riau||
2|PT Thornova Solar Indonesia|tidak-diketahui|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT IDN Solar Tech|tidak-diketahui|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Apollo Solar Indonesia|tidak-diketahui|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Atelier Solar Indonesia|tidak-diketahui|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Elite Solar Indonesia|tidak-diketahui|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Mega Solar Indonesia|tidak-diketahui|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Wirapraja Energy Indonesia|tidak-diketahui|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Blue Sky Solar Indonesia|tidak-diketahui|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Avecode Internasional (Celesta)|swasta|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Adyawinsa Electrical & Power|swasta|manufaktur|surya,industri||Bekasi|Jawa Barat||
2|PT Azet Surya Lestari|swasta|manufaktur|surya,industri||Tangerang|Banten||
2|PT Techland Solar|swasta|manufaktur|surya,industri||Tangerang|Banten||
2|PT Deltamas Solusindo|swasta|manufaktur|surya,industri||Bogor|Jawa Barat||
2|PT Indodaya Citra Lestari|swasta|manufaktur|surya,industri||Jakarta|DKI Jakarta||
2|PT Indonesia Solar Global|swasta|manufaktur|surya,industri||Tangerang|Banten||
2|PT Jembo Energindo|swasta|manufaktur|surya,industri|Jembo Group|Tangerang|Banten||
2|PT Sankeindo|swasta|manufaktur|surya,industri||Tangerang Selatan|Banten||
2|PT Sky Energi Indonesia|swasta|manufaktur|surya,industri||Bogor|Jawa Barat||
2|PT Surya Utama Putra|swasta|manufaktur|surya,industri||Kabupaten Bandung|Jawa Barat||
2|PT Swadaya Prima Utama|swasta|manufaktur|surya,industri||Jakarta|DKI Jakarta||
2|PT Santinilestasi Energi|swasta|manufaktur|surya,industri||Pasuruan|Jawa Timur||
2|PT Cahaya Mas Gemilang|swasta|manufaktur|surya,industri||Jakarta|DKI Jakarta||
2|PT Bernadi Utama (Solterra)|swasta|manufaktur|surya,industri||Bekasi|Jawa Barat||
2|PT Wijaya Karya Industri & Energi|bumn|manufaktur|surya,industri|WIKA|Bogor|Jawa Barat||
2|PT Sky Indonesia|swasta|manufaktur|surya,industri||Mojokerto|Jawa Timur||
2|PT Cipta Mentari Utama|swasta|manufaktur|surya,industri||Bekasi|Jawa Barat||
2|PT ZEF Energi|swasta|manufaktur|surya,industri||Bogor|Jawa Barat||
2|PT Sundaya Indonesia|swasta|manufaktur,pengembang|surya,industri||Bogor|Jawa Barat|https://sundaya.com|
2|PT Pana Indo Alkestama|swasta|manufaktur|surya,industri||Tangerang|Banten||
2|PT Hit International|swasta|manufaktur|surya,industri||Jakarta|DKI Jakarta||
2|PT Jaya Electrical Energy|swasta|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Utomo Juragan Atap Surya Indonesia|swasta|manufaktur|surya,industri||Batam|Kepulauan Riau||
2|PT Pura Barutama|swasta|manufaktur|surya,industri|Pura Group|Kudus|Jawa Tengah||
2|PT Solar Karya Indonesia|swasta|manufaktur|surya,industri||Bogor|Jawa Barat||
2|PT Hanover Solar Indonesia|tidak-diketahui|manufaktur|surya,industri||Batam|Kepulauan Riau||
3|PT Wilmar Nabati Indonesia|asing|produsen BBN|bioenergi|Wilmar International|Gresik|Jawa Timur||
3|PT Musim Mas|swasta|produsen BBN|bioenergi|Musim Mas Group|Medan|Sumatera Utara|https://www.musimmas.com|
3|PT SMART Tbk|tbk|produsen BBN|bioenergi|Sinar Mas Agribusiness|Jakarta|DKI Jakarta|https://www.smart-tbk.com|SMAR
3|PT Tunas Baru Lampung Tbk|tbk|produsen BBN|bioenergi||Jakarta|DKI Jakarta||TBLA
3|PT Permata Hijau Palm Oleo|swasta|produsen BBN|bioenergi||Medan|Sumatera Utara||
3|PT Pelita Agung Agrindustri|swasta|produsen BBN|bioenergi|Permata Hijau Group|Dumai|Riau||
3|PT Ciliandra Perkasa|swasta|produsen BBN|bioenergi|Sinar Mas / Apical|Dumai|Riau||
3|PT Molindo Raya Industrial|swasta|produsen BBN|bioenergi||Malang|Jawa Timur||
3|PT Indo Acidatama Tbk|tbk|produsen BBN|bioenergi||Karanganyar|Jawa Tengah||SRSN
4|PT Medco Power Indonesia|swasta|pengembang,IPP|surya,panas-bumi,hidro|Medco Energi|Jakarta|DKI Jakarta||
4|PT Medco Energi Internasional Tbk|tbk|pengembang,IPP|surya,panas-bumi|Medco Group|Jakarta|DKI Jakarta|https://www.medcoenergi.com|MEDC
4|PT Barito Renewables Energy Tbk|tbk|pengembang,IPP|panas-bumi|Barito Pacific|Jakarta|DKI Jakarta|https://www.baritorenewables.co.id|BREN
4|PT Star Energy Geothermal|swasta|pengembang,IPP|panas-bumi|Barito Renewables|Jakarta|DKI Jakarta||
4|PT Supreme Energy|swasta|pengembang,IPP|panas-bumi|Supreme Energy|Jakarta|DKI Jakarta|https://www.supreme-energy.com|
4|PT Adaro Andalan Indonesia (Adaro Green)|tbk|pengembang,IPP|surya,hidro,bayu|Alamtri Resources|Jakarta|DKI Jakarta||
4|PT Indika Energy Tbk|tbk|pengembang,IPP|surya,elektrifikasi|Indika|Jakarta|DKI Jakarta|https://www.indikaenergy.co.id|INDY
4|PT Kayan Hydro Energy|swasta|pengembang,IPP|hidro|Kayan Hydro|Jakarta|DKI Jakarta||
4|PT Xurya Daya Indonesia|swasta|pengembang,EPC|surya|Xurya|Jakarta|DKI Jakarta|https://xurya.com|
4|PT Akuo Energy Indonesia|asing|pengembang,IPP|surya,bayu|Akuo|Jakarta|DKI Jakarta|https://www.akuoenergy.com|
4|PT UPC Renewables Indonesia|asing|pengembang,IPP|bayu|UPC/AC Renewables|Jakarta|DKI Jakarta||
4|PT Pusaka Jaya Energi (Sidrap)|swasta|pengembang,IPP|bayu|UPC Renewables|Sidrap|Sulawesi Selatan||
4|PT Energi Baru Terbarukan Jawa (PLTS Terapung Cirata)|patungan|pengembang,IPP|surya|Masdar / PLN Nusantara Power|Purwakarta|Jawa Barat||
4|PT Sumberdaya Sewatama|swasta|pengembang,operator|surya,efisiensi|Sewatama|Jakarta|DKI Jakarta|https://www.sewatama.com|
5|LONGi Green Energy Technology|asing|manufaktur|surya,industri|LONGi|Xi'an (Tiongkok)||https://www.longi.com|
5|Trina Solar|asing|manufaktur|surya,industri|Trina Solar|Changzhou (Tiongkok)||https://www.trinasolar.com|
5|JA Solar|asing|manufaktur|surya,industri|JA Solar|Beijing (Tiongkok)||https://www.jasolar.com|
5|JinkoSolar|asing|manufaktur|surya,industri|JinkoSolar|Shanghai (Tiongkok)||https://www.jinkosolar.com|
5|Canadian Solar|asing|manufaktur|surya,industri|Canadian Solar|Ontario (Kanada)||https://www.csisolar.com|
5|ACWA Power|asing|pengembang,IPP|surya,bayu,hidrogen|ACWA|Riyadh (Arab Saudi)||https://acwapower.com|
5|Masdar|asing|pengembang,IPP|surya,bayu,hidrogen|Mubadala/TAQA/ADNOC|Abu Dhabi (UEA)||https://masdar.ae|
5|Sembcorp Industries|asing|pengembang,IPP|surya,bayu|Temasek|Singapura||https://www.sembcorp.com|
5|Vena Energy|asing|pengembang,IPP|surya,bayu|Vena Energy|Singapura||https://www.venaenergy.com|
5|Sungrow|asing|manufaktur|surya,penyimpanan|Sungrow|Hefei (Tiongkok)||https://en.sungrowpower.com|
5|Huawei Digital Power|asing|manufaktur|surya,penyimpanan|Huawei|Shenzhen (Tiongkok)||https://solar.huawei.com|
5|TotalEnergies|asing|pengembang|surya,bayu|TotalEnergies|Courbevoie (Prancis)||https://totalenergies.com|
5|ENGIE|asing|pengembang,IPP|panas-bumi,surya|ENGIE|Courbevoie (Prancis)||https://www.engie.com|
5|Marubeni Corporation|asing|pengembang,pembiaya|surya,panas-bumi|Marubeni|Tokyo (Jepang)||https://www.marubeni.com|
5|Sumitomo Corporation|asing|pengembang,pembiaya|panas-bumi,surya|Sumitomo|Tokyo (Jepang)||https://www.sumitomocorp.com|
5|PT HLI Green Power|patungan|manufaktur|penyimpanan,elektrifikasi|Hyundai Motor / LG Energy Solution|Karawang|Jawa Barat||
`;

// Tabel 40 pabrikan modul surya: No|nama (cocok dengan BENIH)|MWp/tahun|pasar|APAMSI|TKDN%|BMP%
// SUMBER: slide DJEBTKE ESDM "Daftar Pabrikan Modul Surya di Indonesia" hlm 12, tangkapan layar dari pemilik 2026-11-07 (bukan pptx SOLEHAN).
export const TABEL_MODUL = `
PT Adyawinsa Electrical & Power|6|lokal|APAMSI|47.50|7.95
PT Azet Surya Lestari|15|lokal|APAMSI|40.00|
PT Techland Solar|150|lokal|APAMSI|40.00|
PT Deltamas Solusindo|5|lokal|APAMSI|47.50|
PT Indodaya Citra Lestari|60|lokal|APAMSI|45.50|
PT Indonesia Solar Global|75|lokal|APAMSI|43.92|
PT Jembo Energindo|100|lokal|APAMSI|54.48|3.00
PT Len Industri (Persero)|71|lokal|APAMSI|46.62|
PT Sankeindo|120|lokal|APAMSI|46.50|4.65
PT Sky Energi Indonesia||lokal|APAMSI|47.50|
PT Surya Utama Putra|45|lokal|APAMSI|47.50|12.75
PT Swadaya Prima Utama|40|lokal|APAMSI|47.50|
PT Santinilestasi Energi|50|lokal|APAMSI|47.50|
PT Cahaya Mas Gemilang||lokal|APAMSI|46.67|12.00
PT Bernadi Utama (Solterra)|30|lokal|APAMSI|40.00|
PT Trina Mas Agra Indonesia|1000|lokal|APAMSI|44.11|
PT Wijaya Karya Industri & Energi|20|lokal|APAMSI|38.50|
PT Sky Indonesia|13|lokal|Non-APAMSI|18.00|
PT Cipta Mentari Utama|70|lokal|Non-APAMSI|40.00|
PT ZEF Energi|3|lokal|Non-APAMSI|40.00|
PT Lesso New Energy|960|lokal|Non-APAMSI|39.55|3.00
PT Sundaya Indonesia|50|lokal|Non-APAMSI|45.50|
PT Pana Indo Alkestama|25|lokal|Non-APAMSI|40.00|
PT Hit International||lokal|Non-APAMSI|33.50|13.50
PT Jaya Electrical Energy||lokal|Non-APAMSI|55.00|
PT Utomo Juragan Atap Surya Indonesia||lokal|Non-APAMSI|37.20|7.50
PT Pura Barutama|20|lokal|Non-APAMSI||
PT Solar Karya Indonesia|10|lokal|Non-APAMSI||
PT SEG Solar Manufaktur Indonesia|2000|lokal|Non-APAMSI||
PT Longi Pertamina Power Indonesia (JV)|1600|lokal|Non-APAMSI||
PT Avecode Internasional (Celesta)|75|keduanya|Non-APAMSI|61.54|
PT Apollo Solar Indonesia|500|keduanya|APAMSI|58.56|
PT IDN Solar Tech|3800|keduanya|APAMSI|55.00|
PT Thornova Solar Indonesia|2500|ekspor|Non-APAMSI||
PT Atelier Solar Indonesia|150|ekspor|Non-APAMSI||
PT Elite Solar Indonesia|1000|ekspor|Non-APAMSI||
PT Mega Solar Indonesia|800|ekspor|Non-APAMSI||
PT Wirapraja Energy Indonesia|2500|ekspor|Non-APAMSI||
PT REC Solar Energy Indonesia|4000|ekspor|Non-APAMSI||
PT Blue Sky Solar Indonesia|3000|ekspor|Non-APAMSI||
`;
