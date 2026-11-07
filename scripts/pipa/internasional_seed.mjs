// Daftar CALON entitas internasional untuk data_internasional.mjs. Data, bukan logika.
// Baris: nama|singkatan|ISO2 markas|subjenis|teknologi,..|situs|pola;pola (kata dicari di sumber)|afiliasi PT;PT
//   subjenis: pengembang|pemasok|EPC|pendana|lembaga     ISO2 'XX' = multilateral (markas di kolom ISO tetap diisi; lihat MULTI)
// Negara dan situs dari pengetahuan peneliti (inferensi) sampai situs terbaca; keberadaan di Indonesia HANYA diterima
// bila pola ditemukan di sumber berurl pada data METI (GEM, proyek, pendanaan, jetp, karbon, tkdn, penyedia, berita).
export const MULTI = new Set(['ADB', 'IFC', 'WB', 'AIIB', 'IsDB', 'GCF', 'GEF', 'UNDP', 'EU', 'EIB', 'PIDG', 'GEAPP', 'IEA', 'IRENA', 'CIF', 'GGGI', 'UNIDO', 'UNESCAP', 'FAO', 'IMF']);
export const CALON = `
Ormat Technologies|Ormat|US|pengembang|panas-bumi|https://www.ormat.com|ormat|
Sumitomo Corporation|Sumitomo|JP|pengembang|panas-bumi,surya|https://www.sumitomocorp.com|sumitomo corp;sumitomo corporation|
Marubeni Corporation|Marubeni|JP|pengembang|panas-bumi,surya|https://www.marubeni.com|marubeni|
Mitsubishi Corporation|Mitsubishi|JP|pengembang|bayu,hidrogen|https://www.mitsubishicorp.com|mitsubishi corp;mitsubishi corporation|
Kansai Electric Power|KEPCO Jepang|JP|pengembang|panas-bumi,hidro|https://www.kepco.co.jp|kansai electric|
JERA|JERA|JP|pengembang|amonia,gas|https://www.jera.co.jp|jera|
INPEX|INPEX|JP|pengembang|panas-bumi,gas|https://www.inpex.co.jp|inpex|
Itochu Corporation|Itochu|JP|pengembang|surya,bioenergi|https://www.itochu.co.jp|itochu|
Kyushu Electric Power|Kyushu Electric|JP|pengembang|panas-bumi|https://www.kyuden.co.jp|kyushu electric|
Tokyo Gas|Tokyo Gas|JP|pengembang|gas,surya|https://www.tokyo-gas.co.jp|tokyo gas|
Tohoku Electric Power|Tohoku Electric|JP|pengembang|panas-bumi|https://www.tohoku-epco.co.jp|tohoku electric|
Chubu Electric Power|Chubu Electric|JP|pengembang|panas-bumi|https://www.chuden.co.jp|chubu electric|
Osaka Gas|Osaka Gas|JP|pengembang|gas,surya|https://www.osakagas.co.jp|osaka gas|
Toyota Tsusho|Toyota Tsusho|JP|pengembang|panas-bumi|https://www.toyota-tsusho.com|toyota tsusho|
Mitsui & Co|Mitsui|JP|pengembang|gas,surya|https://www.mitsui.com|mitsui & co;mitsui co ltd;mitsui and co|
Sojitz Corporation|Sojitz|JP|pengembang|surya|https://www.sojitz.com|sojitz|
J-Power (Electric Power Development)|J-Power|JP|pengembang|batubara,panas-bumi|https://www.jpower.co.jp|j power;j-power;electric power development|
Idemitsu Kosan|Idemitsu|JP|pengembang|bioenergi|https://www.idemitsu.com|idemitsu|
ENEOS|ENEOS|JP|pengembang|hidrogen|https://www.eneos.co.jp|eneos|
Tokyo Electric Power (TEPCO)|TEPCO|JP|pengembang|hidro|https://www.tepco.co.jp|tepco;tokyo electric power|
Hokuriku Electrical Construction|Hokuriku|JP|EPC|surya|https://www.hokuden-kogyo.co.jp|hokuriku electrical|
Sembcorp Industries|Sembcorp|SG|pengembang|surya,bayu|https://www.sembcorp.com|sembcorp|
ACEN Corporation|ACEN|PH|pengembang|surya,bayu|https://www.acenrenewables.com|acen;ac energy|
UPC Renewables|UPC|HK|pengembang|bayu,surya|https://www.upcrenewables.com|upc renewables;upc ac;upc asia|
Vena Energy|Vena|SG|pengembang|surya,bayu|https://www.venaenergy.com|vena energy|
Equis Development|Equis|SG|pengembang|surya,bayu|https://www.equis.com|equis|
Electricite de France (EDF)|EDF|FR|pengembang|surya,hidro|https://www.edf.fr|edf;electricite de france|
Enel|Enel|IT|pengembang|panas-bumi|https://www.enel.com|enel green;enel spa;enel group|
Vestas|Vestas|DK|pemasok|bayu|https://www.vestas.com|vestas|
Envision Energy|Envision|CN|pemasok|bayu,penyimpanan|https://www.envision-group.com|envision|
Goldwind|Goldwind|CN|pemasok|bayu|https://www.goldwindglobal.com|goldwind|
Quantum Power Asia|Quantum|SG|pengembang|surya,bayu|https://www.quantumpower.asia|quantum power|
Sun Cable|Sun Cable|AU|pengembang|surya,jaringan|https://www.suncable.energy|sun cable;suncable|
Gentari|Gentari|MY|pengembang|surya,hidrogen|https://www.gentari.com|gentari|
Keppel|Keppel|SG|pengembang|surya,gas|https://www.keppel.com|keppel|
Star Energy Group|Star Energy|SG|pengembang|panas-bumi|https://www.starenergygroup.net|star energy group;star energy geothermal|
Electricity Generating PCL (EGCO)|EGCO|TH|pengembang|panas-bumi,bayu|https://www.egco.com|egco;electricity generating|
KS Orka Renewables|KS Orka|SG|pengembang|panas-bumi|https://www.ksorka.com|ks orka|
Scatec|Scatec|NO|pengembang|surya,hidro|https://scatec.com|scatec|
Aboitiz Power (SN Aboitiz Power)|Aboitiz|PH|pengembang|hidro|https://www.aboitizpower.com|aboitiz;sn power|
Korea South-East Power (KOEN)|KOEN|KR|pengembang|batubara,surya|https://www.koenergy.kr|korea south east;korea south-east|
Korea Midland Power (KOMIPO)|KOMIPO|KR|pengembang|surya|https://www.komipo.co.kr|komipo;korea midland|
Hyundai Engineering & Construction|Hyundai E&C|KR|EPC|surya,jaringan|https://www.hdec.kr|hyundai engineering|
POSCO E&C|POSCO|KR|EPC|surya|https://www.poscoenc.com|posco|
IGIS Asset Management|IGIS|KR|pendana|surya|https://www.igisam.com|igis|
Solar Philippines|Solar Philippines|PH|pengembang|surya|https://www.solarphilippines.ph|solar philippines|
Sunseap Group|Sunseap|SG|pengembang|surya|https://www.sunseap.com|sunseap|
PacificLight Power|PacificLight|SG|pengembang|surya,gas|https://www.pacificlight.com.sg|pacificlight|
ib vogt|ib vogt|DE|EPC|surya|https://www.ibvogt.com|ib vogt|
China Gezhouba Group|Gezhouba|CN|EPC|hidro|https://www.cggc.cn|gezhouba|
China Guodian|Guodian|CN|pengembang|batubara,surya|https://www.chnenergy.com.cn|guodian|
China Shenhua Energy|Shenhua|CN|pengembang|batubara|https://www.csec.com|shenhua|
Bharat Heavy Electricals (BHEL)|BHEL|IN|EPC|batubara|https://www.bhel.com|bharat heavy;bhel|
Xinyi Glass Holdings|Xinyi|CN|pemasok|surya|https://www.xinyiglass.com|xinyi|
Vale|Vale|BR|pengembang|hidro|https://vale.com|vale sa;vale s a;vale indonesia|
Gallant Venture|Gallant|SG|pengembang|surya|https://www.gallantventure.com|gallant venture|
ReNu Energy|ReNu|AU|pengembang|panas-bumi|https://www.renuenergy.com.au|renu energy|
Pace Energy|Pace|IN|pengembang|bayu|https://www.paceenergy.in|pace energy|
Veolia|Veolia|FR|pengembang|sampah|https://www.veolia.com|veolia|
Wilmar International|Wilmar|SG|pengembang|bioenergi|https://www.wilmar-international.com|wilmar|
Shell|Shell|GB|pengembang|hidrogen,bioenergi|https://www.shell.com|shell|
BP|BP|GB|pengembang|hidrogen,bioenergi|https://www.bp.com|bp plc;bp indonesia;bp p l c|
Chevron|Chevron|US|pengembang|panas-bumi|https://www.chevron.com|chevron|
Equinor|Equinor|NO|pengembang|gas,bayu|https://www.equinor.com|equinor|
Eni|Eni|IT|pengembang|bioenergi|https://www.eni.com|eni spa;eni indonesia|
Iberdrola|Iberdrola|ES|pengembang|bayu,surya|https://www.iberdrola.com|iberdrola|
Statkraft|Statkraft|NO|pengembang|hidro|https://www.statkraft.com|statkraft|
Orsted|Orsted|DK|pengembang|bayu lepas pantai|https://orsted.com|orsted|
RWE|RWE|DE|pengembang|bayu,surya|https://www.rwe.com|rwe|
Fortum|Fortum|FI|pengembang|surya|https://www.fortum.com|fortum|
Wpd|wpd|DE|pengembang|bayu|https://www.wpd.de|wpd|
Greenvolt|Greenvolt|PT|pengembang|bioenergi,surya|https://greenvolt.pt|greenvolt|
Ampotech|Ampotech|SG|pemasok|surya|https://www.ampotech.com|ampotech|
Jiangsu Seraphim Solar System|Seraphim|CN|pemasok|surya|https://www.seraphim-energy.com|seraphim|
Meyer Burger|Meyer Burger|CH|pemasok|surya|https://www.meyerburger.com|meyer burger|
SEG Solar|SEG Solar|US|pemasok|surya|https://www.segsolar.com|seg solar|
Lesso Group|Lesso|CN|pemasok|surya|https://www.lesso.com|lesso|
Preformed Line Products|PLP|US|pemasok|jaringan|https://www.preformed.com|preformed line|
Lapp Group (JJ Lapp)|Lapp|DE|pemasok|jaringan|https://lapp.com|jj lapp;lapp group|
REPT Battero|REPT|CN|pemasok|penyimpanan|https://www.reptbattero.com|rept battero|
Tianneng Power|Tianneng|CN|pemasok|penyimpanan|https://www.tianneng.com.cn|tianneng|
Contemporary Amperex Technology (CATL)|CATL|CN|pemasok|penyimpanan|https://www.catl.com|catl;contemporary amperex|
LG Energy Solution|LGES|KR|pemasok|penyimpanan|https://www.lgensol.com|lg energy|
Hyundai Motor Group|Hyundai|KR|pemasok|penyimpanan,hidrogen|https://www.hyundai.com|hyundai motor;hyundai mobis;hli green|
BYD|BYD|CN|pemasok|penyimpanan|https://www.byd.com|byd|
Samsung SDI|Samsung SDI|KR|pemasok|penyimpanan|https://www.samsungsdi.com|samsung sdi|
SK On|SK On|KR|pemasok|penyimpanan|https://www.skon.com|sk on;sk innovation|
Tesla|Tesla|US|pemasok|penyimpanan|https://www.tesla.com|tesla|
Fluence Energy|Fluence|US|pemasok|penyimpanan|https://fluenceenergy.com|fluence|
Wartsila|Wartsila|FI|pemasok|gas,penyimpanan|https://www.wartsila.com|wartsila|
Nordex|Nordex|DE|pemasok|bayu|https://www.nordex-online.com|nordex|
Siemens Gamesa|Siemens Gamesa|ES|pemasok|bayu|https://www.siemensgamesa.com|siemens gamesa|
Suzlon|Suzlon|IN|pemasok|bayu|https://www.suzlon.com|suzlon|
Siemens Energy|Siemens Energy|DE|pemasok|jaringan,gas|https://www.siemens-energy.com|siemens energy|
Siemens|Siemens|DE|pemasok|jaringan|https://www.siemens.com|siemens indonesia;siemens ag|
GE Vernova|GE Vernova|US|pemasok|bayu,gas|https://www.gevernova.com|ge vernova;general electric|
Hitachi Energy|Hitachi Energy|JP|pemasok|jaringan|https://www.hitachienergy.com|hitachi|
ABB|ABB|CH|pemasok|jaringan,otomasi|https://global.abb|abb|
Schneider Electric|Schneider|FR|pemasok|jaringan,efisiensi|https://www.se.com|schneider|
Huawei Digital Power|Huawei|CN|pemasok|surya,penyimpanan|https://solar.huawei.com|huawei|
SMA Solar Technology|SMA|DE|pemasok|surya|https://www.sma.de|sma solar|
Fuji Electric|Fuji Electric|JP|pemasok|jaringan,panas-bumi|https://www.fujielectric.com|fuji electric|
Toshiba|Toshiba|JP|pemasok|panas-bumi,hidro|https://www.global.toshiba|toshiba|
Mitsubishi Heavy Industries|MHI|JP|pemasok|panas-bumi,gas|https://www.mhi.com|mitsubishi heavy;mitsubishi power|
Ansaldo Energia|Ansaldo|IT|pemasok|gas|https://www.ansaldoenergia.com|ansaldo|
Andritz|Andritz|AT|pemasok|hidro|https://www.andritz.com|andritz|
Voith|Voith|DE|pemasok|hidro|https://voith.com|voith|
Dongfang Electric|Dongfang|CN|pemasok|hidro,batubara|https://www.dongfang.com|dongfang|
Harbin Electric|Harbin|CN|pemasok|hidro,batubara|https://www.chinaharbinelectric.com|harbin electric|
Shanghai Electric|Shanghai Electric|CN|pemasok|batubara,surya|https://www.shanghai-electric.com|shanghai electric|
Hanwha|Hanwha|KR|pemasok|surya|https://www.hanwha.com|hanwha|
Hyosung Heavy Industries|Hyosung|KR|pemasok|jaringan|https://www.hyosungheavyindustries.com|hyosung|
LS Electric|LS Electric|KR|pemasok|jaringan|https://www.ls-electric.com|ls electric|
Doosan Enerbility|Doosan|KR|pemasok|batubara,bayu|https://www.doosanenerbility.com|doosan|
Samsung C&T|Samsung C&T|KR|EPC|surya|https://www.samsungcnt.com|samsung c&t;samsung c t|
GS Engineering & Construction|GS E&C|KR|EPC|jaringan|https://www.gsenc.com|gs engineering|
China Everbright Environment|Everbright|CN|EPC|sampah|https://www.cebenvironment.com|everbright|
Power Construction Corporation of China (PowerChina)|PowerChina|CN|EPC|hidro,surya|https://www.powerchina.cn|powerchina;power construction corporation|
China Energy Engineering (CEEC)|CEEC|CN|EPC|batubara,surya|https://www.ceec.net.cn|china energy engineering;ceec|
Sinohydro|Sinohydro|CN|EPC|hidro|https://www.sinohydro.com|sinohydro|
CITIC Construction|CITICC|CN|EPC|sampah|https://www.citicconstruction.com|citicc;citic construction|
Beijing GeoEnviron Engineering|GeoEnviron|CN|EPC|sampah|https://www.geoenviron.com|geoenviron|
Sinomach|Sinomach|CN|EPC|batubara|https://www.sinomach.com.cn|sinomach|
China Datang|Datang|CN|pengembang|batubara|https://www.china-cdt.com|datang|
Huadian|Huadian|CN|pengembang|batubara|https://www.chd.com.cn|huadian|
China Huaneng|Huaneng|CN|pengembang|batubara|https://www.chng.com.cn|huaneng|
China Three Gorges|CTG|CN|pengembang|hidro,bayu|https://www.ctg.com.cn|three gorges|
State Power Investment (SPIC)|SPIC|CN|pengembang|surya|https://www.spic.com.cn|spic;state power investment|
Tsingshan|Tsingshan|CN|pengembang|nikel|https://www.tsingshan.com|tsingshan|
Huayou Cobalt|Huayou|CN|pemasok|penyimpanan|https://www.huayou.com|huayou|
GEM Co (Greenland)|GEM|CN|pemasok|penyimpanan|https://www.gem.com.cn|gem co ltd|
LG Chem|LG Chem|KR|pemasok|penyimpanan|https://www.lgchem.com|lg chem|
Panasonic|Panasonic|JP|pemasok|penyimpanan|https://www.panasonic.com|panasonic|
Toyota|Toyota|JP|pemasok|elektrifikasi,hidrogen|https://global.toyota|toyota|
Honda|Honda|JP|pemasok|elektrifikasi|https://global.honda|honda|
Nissan|Nissan|JP|pemasok|elektrifikasi|https://global.nissannews.com|nissan|
JA Solar|JA Solar|CN|pemasok|surya|https://www.jasolar.com|ja solar|
Risen Energy|Risen|CN|pemasok|surya|https://www.risenenergy.com|risen|
Tongwei|Tongwei|CN|pemasok|surya|https://www.tongwei.com|tongwei|
Astronergy (Chint)|Astronergy|CN|pemasok|surya|https://www.astronergy.com|astronergy;chint|
GCL|GCL|CN|pemasok|surya|https://www.gclsilicon.com|gcl|
REC Group|REC|NO|pemasok|surya|https://www.recgroup.com|rec solar;rec group|
First Solar|First Solar|US|pemasok|surya|https://www.firstsolar.com|first solar|
Enphase Energy|Enphase|US|pemasok|surya|https://enphase.com|enphase|
SolarEdge|SolarEdge|IL|pemasok|surya|https://www.solaredge.com|solaredge|
Fronius|Fronius|AT|pemasok|surya|https://www.fronius.com|fronius|
Growatt|Growatt|CN|pemasok|surya|https://www.growatt.com|growatt|
GoodWe|GoodWe|CN|pemasok|surya|https://www.goodwe.com|goodwe|
Sineng Electric|Sineng|CN|pemasok|surya|https://www.sinengelectric.com|sineng|
TBEA|TBEA|CN|pemasok|jaringan|https://www.tbea.com|tbea|
Eaton|Eaton|IE|pemasok|jaringan|https://www.eaton.com|eaton|
Legrand|Legrand|FR|pemasok|efisiensi|https://www.legrand.com|legrand|
Nidec|Nidec|JP|pemasok|elektrifikasi|https://www.nidec.com|nidec|
Trina Solar|Trina|CN|pemasok|surya|https://www.trinasolar.com|trina|
Canadian Solar|Canadian Solar|CA|pemasok|surya|https://www.csisolar.com|canadian solar|
Sungrow|Sungrow|CN|pemasok|surya,penyimpanan|https://en.sungrowpower.com|sungrow|
LONGi Green Energy|LONGi|CN|pemasok|surya|https://www.longi.com|longi|
JinkoSolar|Jinko|CN|pemasok|surya|https://www.jinkosolar.com|jinko|
Masdar|Masdar|AE|pengembang|surya,bayu|https://masdar.ae|masdar|
ACWA Power|ACWA|SA|pengembang|surya,bayu|https://acwapower.com|acwa|
TotalEnergies|Total|FR|pengembang|surya,bayu|https://totalenergies.com|totalenergies|
ENGIE|ENGIE|FR|pengembang|panas-bumi,surya|https://www.engie.com|engie|
Akuo|Akuo|FR|pengembang|surya,bayu|https://www.akuoenergy.com|akuo|
Mubadala|Mubadala|AE|pendana|surya|https://www.mubadala.com|mubadala|
TAQA|TAQA|AE|pengembang|surya|https://www.taqa.com|taqa|
Temasek|Temasek|SG|pendana|surya|https://www.temasek.com.sg|temasek|
GIC|GIC|SG|pendana|surya|https://www.gic.com.sg|gic private|
Brookfield|Brookfield|CA|pengembang|surya|https://www.brookfield.com|brookfield|
Macquarie|Macquarie|AU|pendana|surya|https://www.macquarie.com|macquarie|
Actis|Actis|GB|pendana|surya|https://www.act.is|actis|
Copenhagen Infrastructure Partners|CIP|DK|pendana|bayu|https://www.cip.com|copenhagen infrastructure|
Global Infrastructure Partners|GIP|US|pendana|surya|https://www.global-infra.com|global infrastructure partners|
Blackrock|BlackRock|US|pendana|surya|https://www.blackrock.com|blackrock|
Asian Development Bank|ADB|ADB|pendana|multi|https://www.adb.org|asian development bank;adb|
World Bank|WB|WB|pendana|multi|https://www.worldbank.org|world bank;ibrd|
International Finance Corporation|IFC|IFC|pendana|multi|https://www.ifc.org|international finance corporation;ifc|
Asian Infrastructure Investment Bank|AIIB|AIIB|pendana|multi|https://www.aiib.org|aiib;asian infrastructure investment|
Islamic Development Bank|IsDB|IsDB|pendana|multi|https://www.isdb.org|islamic development bank;isdb|
Green Climate Fund|GCF|GCF|pendana|multi|https://www.greenclimate.fund|green climate fund|
Global Environment Facility|GEF|GEF|pendana|multi|https://www.thegef.org|global environment facility|
United Nations Development Programme|UNDP|UNDP|lembaga|multi|https://www.undp.org|united nations development programme;undp|
European Commission|EC|EU|lembaga|multi|https://commission.europa.eu|european commission|
European Investment Bank|EIB|EIB|pendana|multi|https://www.eib.org|european investment bank|
Private Infrastructure Development Group|PIDG|PIDG|pendana|multi|https://www.pidg.org|private infrastructure development group;pidg|
Global Energy Alliance for People and Planet|GEAPP|GEAPP|pendana|multi|https://energyalliance.org|geapp;global energy alliance|
International Energy Agency|IEA|IEA|lembaga|multi|https://www.iea.org|international energy agency|
International Renewable Energy Agency|IRENA|IRENA|lembaga|multi|https://www.irena.org|irena;international renewable energy agency|
Climate Investment Funds|CIF|CIF|pendana|multi|https://www.cif.org|climate investment funds|
Global Green Growth Institute|GGGI|GGGI|lembaga|multi|https://gggi.org|global green growth|
UNIDO|UNIDO|UNIDO|lembaga|multi|https://www.unido.org|unido|
Japan International Cooperation Agency|JICA|JP|pendana|multi|https://www.jica.go.jp|jica;japan international cooperation|
Japan Bank for International Cooperation|JBIC|JP|pendana|multi|https://www.jbic.go.jp|jbic;japan bank for international cooperation|
Nippon Export and Investment Insurance|NEXI|JP|pendana|multi|https://www.nexi.go.jp|nexi|
Japan Organization for Metals and Energy Security|JOGMEC|JP|lembaga|panas-bumi|https://www.jogmec.go.jp|jogmec|
New Energy and Industrial Technology Development Organization|NEDO|JP|lembaga|multi|https://www.nedo.go.jp|nedo|
JETRO|JETRO|JP|lembaga|multi|https://www.jetro.go.jp|jetro|
Sumitomo Mitsui Banking Corporation|SMBC|JP|pendana|multi|https://www.smbc.co.jp|smbc;sumitomo mitsui banking|
Mizuho Bank|Mizuho|JP|pendana|multi|https://www.mizuhogroup.com|mizuho|
MUFG Bank|MUFG|JP|pendana|multi|https://www.mufg.jp|mufg;mitsubishi ufj|
KfW|KfW|DE|pendana|multi|https://www.kfw.de|kfw|
GIZ|GIZ|DE|lembaga|multi|https://www.giz.de|giz|
DEG|DEG|DE|pendana|multi|https://www.deginvest.de|deg;deginvest|
German Federal Ministry for Economic Cooperation and Development (BMZ)|BMZ|DE|lembaga|multi|https://www.bmz.de|bmz;federal ministry for economic cooperation|
Agence Francaise de Developpement|AFD|FR|pendana|multi|https://www.afd.fr|afd;agence francaise de developpement|
Proparco|Proparco|FR|pendana|multi|https://www.proparco.fr|proparco|
BNP Paribas|BNP|FR|pendana|multi|https://group.bnpparibas|bnp paribas|
Credit Agricole|Credit Agricole|FR|pendana|multi|https://www.credit-agricole.com|credit agricole|
Societe Generale|SocGen|FR|pendana|multi|https://www.societegenerale.com|societe generale|
Business France|Business France|FR|lembaga|multi|https://www.businessfrance.fr|business france|
Netherlands Enterprise Agency (RVO)|RVO|NL|lembaga|multi|https://www.rvo.nl|netherlands enterprise agency;rvo|
FMO|FMO|NL|pendana|multi|https://www.fmo.nl|fmo;dutch entrepreneurial development|
ING|ING|NL|pendana|multi|https://www.ing.com|ing bank|
Norwegian Agency for Development Cooperation (Norad)|Norad|NO|lembaga|multi|https://www.norad.no|norad|
Swedish International Development Cooperation Agency (Sida)|Sida|SE|lembaga|multi|https://www.sida.se|sida;sweden|
Danish Energy Agency|DEA|DK|lembaga|multi|https://ens.dk|danish energy agency|
Danish Ministry of Foreign Affairs (Danida)|Danida|DK|lembaga|multi|https://um.dk|danida;ministry of foreign affairs denmark|
Finnfund|Finnfund|FI|pendana|multi|https://www.finnfund.fi|finnfund|
Finland Ministry for Foreign Affairs|MFA Finland|FI|lembaga|multi|https://um.fi|ministry for foreign affairs of finland|
Australian Department of Foreign Affairs and Trade (DFAT)|DFAT|AU|lembaga|multi|https://www.dfat.gov.au|australian aid;australia aid;dfat|
Global Affairs Canada|GAC|CA|lembaga|multi|https://www.international.gc.ca|foreign affairs trade and development canada;dfatd;global affairs canada|
Export Development Canada|EDC|CA|pendana|multi|https://www.edc.ca|export development canada|
New Zealand Ministry of Foreign Affairs and Trade|MFAT|NZ|lembaga|multi|https://www.mfat.govt.nz|new zealand ministry of foreign affairs|
UK Foreign Commonwealth and Development Office (FCDO)|FCDO|GB|lembaga|multi|https://www.gov.uk/government/organisations/foreign-commonwealth-development-office|fcdo;foreign commonwealth|
UK PACT|UK PACT|GB|lembaga|multi|https://www.ukpact.co.uk|uk pact;ukpact|
UK Export Finance|UKEF|GB|pendana|multi|https://www.gov.uk/government/organisations/uk-export-finance|uk export finance|
British International Investment|BII|GB|pendana|multi|https://www.bii.co.uk|british international investment|
Standard Chartered|StanChart|GB|pendana|multi|https://www.sc.com|standard chartered|
HSBC|HSBC|GB|pendana|multi|https://www.hsbc.com|hsbc|
Department for Science Innovation and Technology (UK)|DSIT|GB|lembaga|multi|https://www.gov.uk/government/organisations/department-for-science-innovation-and-technology|department for science innovation|
DBS Bank|DBS|SG|pendana|multi|https://www.dbs.com|dbs bank|
OCBC|OCBC|SG|pendana|multi|https://www.ocbc.com|ocbc|
UOB|UOB|SG|pendana|multi|https://www.uob.com.sg|uob|
Enterprise Singapore|EnterpriseSG|SG|lembaga|multi|https://www.enterprisesg.gov.sg|enterprise singapore|
Singapore Economic Development Board|EDB|SG|lembaga|multi|https://www.edb.gov.sg|economic development board|
Citibank|Citi|US|pendana|multi|https://www.citigroup.com|citibank;citigroup|
Bank of America|BofA|US|pendana|multi|https://www.bankofamerica.com|bank of america|
JPMorgan Chase|JPMorgan|US|pendana|multi|https://www.jpmorgan.com|jpmorgan|
US International Development Finance Corporation (DFC)|DFC|US|pendana|multi|https://www.dfc.gov|development finance corporation;dfc|
US Agency for International Development (USAID)|USAID|US|lembaga|multi|https://www.usaid.gov|usaid;u s agency for international development|
US Trade and Development Agency (USTDA)|USTDA|US|lembaga|multi|https://ustda.gov|trade and development agency;ustda|
Millennium Challenge Corporation|MCC|US|lembaga|multi|https://www.mcc.gov|millennium challenge|
US Department of Energy|US DOE|US|lembaga|multi|https://www.energy.gov|department of energy|
US Department of State|State Dept|US|lembaga|multi|https://www.state.gov|department of state|
Export-Import Bank of the United States|EXIM US|US|pendana|multi|https://www.exim.gov|export import bank of the united states|
Korea Eximbank|KEXIM|KR|pendana|multi|https://www.koreaexim.go.kr|korea eximbank|
Korea International Cooperation Agency|KOICA|KR|lembaga|multi|https://www.koica.go.kr|koica|
Korea Development Bank|KDB|KR|pendana|multi|https://www.kdb.co.kr|korea development bank|
Export-Import Bank of China|China Exim|CN|pendana|multi|https://english.eximbank.gov.cn|export import bank of china|
China Development Bank|CDB|CN|pendana|multi|https://www.cdb.com.cn|china development bank|
Bank of China|BoC|CN|pendana|multi|https://www.boc.cn|bank of china|
ICBC|ICBC|CN|pendana|multi|https://www.icbc.com.cn|icbc|
China Construction Bank|CCB|CN|pendana|multi|https://www.ccb.com|china construction bank|
Rockefeller Foundation|Rockefeller|US|lembaga|multi|https://www.rockefellerfoundation.org|rockefeller|
Bloomberg Philanthropies|Bloomberg|US|lembaga|multi|https://www.bloomberg.org|bloomberg philanthropies|
Ember|Ember|GB|lembaga|multi|https://ember-energy.org|ember|
Global Energy Monitor|GEM|US|lembaga|multi|https://globalenergymonitor.org|global energy monitor|
World Resources Institute|WRI|US|lembaga|multi|https://www.wri.org|world resources institute|
South Pole|South Pole|CH|lembaga|karbon|https://www.southpole.com|south pole|
myclimate Foundation|myclimate|CH|lembaga|karbon|https://www.myclimate.org|myclimate|
Verra|Verra|US|lembaga|karbon|https://verra.org|verra|
Gold Standard Foundation|Gold Standard|CH|lembaga|karbon|https://www.goldstandard.org|gold standard|
Kosher Climate|Kosher Climate|IN|lembaga|karbon|https://www.kosherclimate.com|kosher climate|
International Hydropower Association|IHA|GB|lembaga|hidro|https://www.hydropower.org|international hydropower association|
Global Wind Energy Council|GWEC|BE|lembaga|bayu|https://gwec.net|gwec|
Geothermal Rising|Geothermal Rising|US|lembaga|panas-bumi|https://geothermal.org|geothermal rising|
New Zealand Geothermal Association|NZGA|NZ|lembaga|panas-bumi|https://nzgeothermal.org.nz|new zealand geothermal|
Iceland GeoSurvey (ISOR)|ISOR|IS|lembaga|panas-bumi|https://isor.is|iceland geosurvey;isor|
Landsvirkjun|Landsvirkjun|IS|pengembang|panas-bumi,hidro|https://www.landsvirkjun.com|landsvirkjun|
Reykjavik Energy|Reykjavik Energy|IS|pengembang|panas-bumi|https://www.or.is|reykjavik energy|
Mitsui OSK Lines|MOL|JP|pengembang|amonia|https://www.mol.co.jp|mitsui osk|
Kawasaki Heavy Industries|Kawasaki|JP|pemasok|hidrogen|https://www.khi.co.jp|kawasaki heavy|
Air Products|Air Products|US|pengembang|hidrogen|https://www.airproducts.com|air products|
Linde|Linde|IE|pemasok|hidrogen|https://www.linde.com|linde|
Thyssenkrupp|Thyssenkrupp|DE|pemasok|hidrogen|https://www.thyssenkrupp.com|thyssenkrupp|
Yara|Yara|NO|pengembang|hidrogen,amonia|https://www.yara.com|yara|
Mitsubishi Power|MHI Power|JP|pemasok|gas|https://power.mhi.com|mitsubishi power|
Sinopec|Sinopec|CN|pengembang|bioenergi|https://www.sinopec.com|sinopec|
CNOOC|CNOOC|CN|pengembang|gas|https://www.cnoocltd.com|cnooc|
Petronas|Petronas|MY|pengembang|gas,hidrogen|https://www.petronas.com|petronas|
Tenaga Nasional Berhad|TNB|MY|pengembang|jaringan,surya|https://www.tnb.com.my|tenaga nasional;tnb|
Khazanah|Khazanah|MY|pendana|surya|https://www.khazanah.com.my|khazanah|
Hindustan Power|Hindustan Power|IN|pengembang|surya|https://www.hindustanpower.com|hindustan power|
Adani|Adani|IN|pengembang|batubara,surya|https://www.adani.com|adani|
Tata Power|Tata Power|IN|pengembang|batubara,surya|https://www.tatapower.com|tata power|
ReNew|ReNew|IN|pengembang|surya|https://www.renew.com|renew power;renew energy global|
Ayala Corporation|Ayala|PH|pengembang|surya|https://www.ayala.com|ayala|
Aboitiz Equity Ventures|AEV|PH|pengembang|hidro|https://www.aboitiz.com|aboitiz|
EDC Philippines|EDC|PH|pengembang|panas-bumi|https://www.energy.com.ph|energy development corporation|
Pacific Hydro|Pacific Hydro|AU|pengembang|hidro,bayu|https://www.pacifichydro.com.au|pacific hydro|
Fortescue|Fortescue|AU|pengembang|hidrogen|https://www.fortescue.com|fortescue|
Woodside|Woodside|AU|pengembang|gas,hidrogen|https://www.woodside.com|woodside|
Santos|Santos|AU|pengembang|gas|https://www.santos.com|santos|
Origin Energy|Origin|AU|pengembang|surya|https://www.originenergy.com.au|origin energy|
Genex Power|Genex|AU|pengembang|surya|https://www.genexpower.com.au|genex|
Lightsource bp|Lightsource bp|GB|pengembang|surya|https://www.lightsourcebp.com|lightsource|
Octopus Energy|Octopus|GB|pendana|surya|https://octopus.energy|octopus energy|
Aker|Aker|NO|pengembang|hidrogen|https://www.akerhorizons.com|aker horizons;aker solutions|
`;
