// public/data/istilah.json: kamus istilah gabungan (glosarium 16 topik, definisi Pasal 1 pustaka hukum, glosarium /metode, singkatan umum EBT).
//   node scripts/pipa/istilah.mjs        (tanpa jaringan; membaca public/data/topik/*.json, public/data/hukum/katalog.json bila ada, public/i18n/*.json)
// Urutan kuasa definisi: resmi (pasal) > singkatan umum tulisan tangan > glosarium topik terpanjang. Duplikat digabung lewat alias bersama.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUB = path.join(ROOT, "public");
const baca = (p) => JSON.parse(fs.readFileSync(path.join(PUB, p), "utf8"));

export const KAT = ["teknis", "satuan", "aturan", "uang", "lembaga", "rencana", "metode"];
// [singkatan, nama panjang, arti id, arti en, kategori, terkait]
const UMUM = [
  ["PLTS", "Pembangkit Listrik Tenaga Surya", "Pembangkit yang mengubah cahaya matahari menjadi listrik dengan panel fotovoltaik; bisa berupa atap, di darat, atau terapung.", "A plant that turns sunlight into electricity with photovoltaic panels; rooftop, ground-mounted, or floating.", "teknis", ["PLTB", "BESS", "PLTS atap"]],
  ["PLTB", "Pembangkit Listrik Tenaga Bayu", "Pembangkit listrik dari energi angin memakai turbin di darat atau lepas pantai.", "A plant that generates electricity from wind using onshore or offshore turbines.", "teknis", ["PLTS"]],
  ["PLTP", "Pembangkit Listrik Tenaga Panas Bumi", "Pembangkit yang memakai uap atau air panas dari reservoir panas bumi untuk memutar turbin.", "A plant that uses steam or hot water from a geothermal reservoir to drive a turbine.", "teknis", ["WKP"]],
  ["PLTA", "Pembangkit Listrik Tenaga Air", "Pembangkit listrik yang memanfaatkan aliran dan ketinggian air; umumnya dari bendungan atau aliran sungai.", "A plant that uses flowing water and head, typically from a dam or river.", "teknis", ["PLTMH"]],
  ["PLTMH", "Pembangkit Listrik Tenaga Mikrohidro", "Pembangkit air skala kecil, umumnya di bawah 1 MW, sering melayani desa di luar jaringan.", "A small hydropower plant, generally below 1 MW, often serving off-grid villages.", "teknis", ["PLTA"]],
  ["PLTBm", "Pembangkit Listrik Tenaga Biomassa", "Pembangkit yang membakar atau menggasifikasi biomassa seperti cangkang sawit, kayu, dan sekam untuk listrik.", "A plant that burns or gasifies biomass such as palm shells, wood, and husk to make electricity.", "teknis", ["PLTSa"]],
  ["PLTSa", "Pembangkit Listrik Tenaga Sampah", "Pembangkit yang mengolah sampah kota menjadi listrik lewat pembakaran termal atau gas hasil penguraian.", "A plant that turns municipal waste into electricity through thermal treatment or landfill gas.", "teknis", ["PLTBm"]],
  ["PLTU", "Pembangkit Listrik Tenaga Uap", "Pembangkit yang memanaskan air jadi uap untuk memutar turbin; di Indonesia sebagian besar berbahan batubara.", "A steam-turbine plant; in Indonesia mostly coal-fired.", "teknis", ["Co-firing"]],
  ["BESS", "Battery Energy Storage System", "Sistem penyimpanan energi dengan baterai untuk menyerap listrik saat murah atau berlebih dan melepasnya saat dibutuhkan.", "A battery system that stores electricity when it is cheap or in surplus and releases it when needed.", "teknis", ["PLTS"]],
  ["EBT", "Energi Baru Terbarukan", "Gabungan energi baru (nuklir, hidrogen, batubara tergaskan) dan energi terbarukan (surya, angin, air, panas bumi, bioenergi, laut).", "New and renewable energy: new energy (nuclear, hydrogen, coal gasification) plus renewables (solar, wind, hydro, geothermal, bioenergy, ocean).", "teknis", ["EBET"]],
  ["EBET", "Energi Baru dan Energi Terbarukan", "Penamaan RUU dan kebijakan yang memisahkan energi baru dari energi terbarukan.", "Naming used in the bill and policy that separates new energy from renewable energy.", "aturan", ["EBT"]],
  ["RUPTL", "Rencana Usaha Penyediaan Tenaga Listrik", "Rencana 10 tahun PLN yang memuat kebutuhan listrik, tambahan pembangkit, dan jaringan; dasar kuota proyek pengembang.", "PLN's 10-year plan for demand, new plants, and grid; the basis for developer project quotas.", "rencana", ["RUKN", "PPA"]],
  ["RUKN", "Rencana Umum Ketenagalistrikan Nasional", "Rencana jangka panjang pemerintah pusat untuk sektor ketenagalistrikan; acuan RUPTL dan RUKD.", "The central government's long-term electricity plan; the reference for RUPTL and RUKD.", "rencana", ["RUPTL", "RUED"]],
  ["RUED", "Rencana Umum Energi Daerah", "Rencana energi provinsi yang menjabarkan target bauran dan kapasitas EBT di daerah.", "A provincial energy plan that sets regional renewable mix and capacity targets.", "rencana", ["KEN", "RUKN"]],
  ["KEN", "Kebijakan Energi Nasional", "Kebijakan dasar energi nasional (PP 79/2014) yang menetapkan target bauran EBT dan arah pengelolaan energi.", "The national energy policy foundation (GR 79/2014) setting the renewable mix target and energy management direction.", "rencana", ["RUEN", "RUED"]],
  ["RUEN", "Rencana Umum Energi Nasional", "Penjabaran KEN dalam Perpres 22/2017: target kapasitas dan bauran energi per jenis sampai 2050.", "The elaboration of KEN in Presidential Regulation 22/2017: capacity and mix targets by type up to 2050.", "rencana", ["KEN", "RUED"]],
  ["NZE", "Net Zero Emission", "Keadaan ketika emisi gas rumah kaca yang dilepas seimbang dengan yang diserap; target Indonesia 2060 atau lebih cepat.", "A state where greenhouse gas emissions released equal those removed; Indonesia targets 2060 or sooner.", "rencana", ["NDC", "SPE-GRK"]],
  ["NDC", "Nationally Determined Contribution", "Janji penurunan emisi tiap negara di bawah Persetujuan Paris.", "Each country's emission reduction pledge under the Paris Agreement.", "rencana", ["NZE", "JETP"]],
  ["JETP", "Just Energy Transition Partnership", "Kemitraan pendanaan transisi energi berkeadilan antara Indonesia dan mitra internasional (USD 20 miliar).", "A just energy transition financing partnership between Indonesia and international partners (USD 20 billion).", "uang", ["CIPP", "NZE"]],
  ["CIPP", "Comprehensive Investment and Policy Plan", "Dokumen rencana investasi dan kebijakan JETP yang merinci proyek dan kebutuhan pendanaan.", "The JETP investment and policy plan detailing projects and funding needs.", "rencana", ["JETP"]],
  ["TKDN", "Tingkat Komponen Dalam Negeri", "Persentase nilai komponen buatan dalam negeri pada barang atau jasa; syarat pengadaan pembangkit.", "The share of domestically made content in goods or services; a requirement in plant procurement.", "aturan", ["PPA"]],
  ["PPA", "Power Purchase Agreement", "Perjanjian jual beli listrik jangka panjang antara pengembang dan pembeli (umumnya PLN) yang mengunci harga dan volume.", "A long-term electricity sale agreement between a developer and buyer (usually PLN) fixing price and volume.", "uang", ["IPP", "BPP", "COD"]],
  ["IPP", "Independent Power Producer", "Pengembang swasta yang membangun dan mengoperasikan pembangkit lalu menjual listriknya kepada PLN.", "A private developer that builds and operates a plant and sells power to PLN.", "lembaga", ["PPA"]],
  ["BPP", "Biaya Pokok Penyediaan", "Biaya rata-rata PLN menyediakan listrik di suatu sistem; patokan batas atas harga beli listrik EBT.", "PLN's average cost of supplying electricity in a system; the ceiling reference for renewable purchase prices.", "uang", ["PPA", "LCOE"]],
  ["LCOE", "Levelized Cost of Energy", "Biaya energi rata-rata sepanjang umur proyek: seluruh biaya dibagi seluruh energi, dalam nilai kini.", "Average cost of energy over a project's life: all costs divided by all energy, in present value.", "uang", ["BPP", "CAPEX"]],
  ["CAPEX", "Capital Expenditure", "Belanja modal awal untuk membangun proyek (peralatan, konstruksi, lahan).", "Upfront capital spending to build a project (equipment, construction, land).", "uang", ["LCOE"]],
  ["COD", "Commercial Operation Date", "Tanggal pembangkit resmi beroperasi komersial dan mulai menjual listrik sesuai PPA.", "The date a plant formally begins commercial operation and selling power under the PPA.", "teknis", ["PPA"]],
  ["WKP", "Wilayah Kerja Panas Bumi", "Wilayah izin panas bumi yang ditetapkan pemerintah untuk eksplorasi dan eksploitasi.", "A geothermal licence area set by the government for exploration and exploitation.", "aturan", ["PLTP", "IPB"]],
  ["IPB", "Izin Panas Bumi", "Izin pengusahaan panas bumi yang menggantikan izin usaha pertambangan panas bumi.", "The geothermal business permit that replaced the geothermal mining business permit.", "aturan", ["WKP"]],
  ["IUPTL", "Izin Usaha Penyediaan Tenaga Listrik", "Izin untuk menjual listrik ke publik; wajib bagi usaha penyediaan listrik untuk kepentingan umum.", "The licence to supply electricity to the public; required for public-purpose power supply businesses.", "aturan", ["IPP"]],
  ["NEK", "Nilai Ekonomi Karbon", "Nilai yang diberikan pada emisi karbon, diwujudkan lewat perdagangan karbon, pajak karbon, dan pembayaran berbasis hasil.", "The value given to carbon emissions through carbon trading, carbon tax, and results-based payment.", "uang", ["SPE-GRK", "SRN"]],
  ["SPE-GRK", "Sertifikat Pengurangan Emisi Gas Rumah Kaca", "Sertifikat atas pengurangan emisi yang terverifikasi di Sistem Registri Nasional; satuan dagang di bursa karbon.", "A certificate for verified emission reductions in the National Registry; the traded unit on the carbon exchange.", "uang", ["NEK", "SRN"]],
  ["SRN", "Sistem Registri Nasional", "Registri resmi aksi dan capaian pengendalian perubahan iklim, termasuk unit karbon.", "The official registry of climate actions and results, including carbon units.", "lembaga", ["SPE-GRK"]],
  ["PLN", "Perusahaan Listrik Negara", "BUMN penyedia listrik yang memegang transmisi, distribusi, dan pembelian listrik dari pengembang.", "The state utility that runs transmission and distribution and buys power from developers.", "lembaga", ["IPP", "RUPTL"]],
  ["ESDM", "Energi dan Sumber Daya Mineral", "Kementerian yang mengatur kebijakan energi, tarif, perizinan pembangkit, dan wilayah kerja panas bumi.", "The ministry regulating energy policy, tariffs, plant licensing, and geothermal work areas.", "lembaga", ["EBTKE"]],
  ["EBTKE", "Energi Baru, Terbarukan, dan Konservasi Energi", "Direktorat Jenderal di Kementerian ESDM yang membina EBT dan efisiensi energi.", "The Directorate General within the Energy Ministry overseeing renewables and energy efficiency.", "lembaga", ["ESDM"]],
  ["SLO", "Sertifikat Laik Operasi", "Sertifikat bahwa instalasi listrik layak dioperasikan; syarat sambung dan operasi.", "A certificate that an electrical installation is fit to operate; required to connect and run.", "aturan", ["COD"]],
  ["PLTS atap", "PLTS atap", "PLTS yang dipasang di atap bangunan pelanggan untuk memenuhi kebutuhan sendiri dan menukar kelebihan ke jaringan.", "A rooftop solar system on a customer's building serving own demand and exporting surplus to the grid.", "teknis", ["PLTS"]],
  ["Net metering", "Net metering", "Skema ekspor-impor listrik pelanggan PLTS atap yang menetapkan nilai ekspor terhadap impor.", "A scheme valuing a rooftop solar customer's exports against imports.", "uang", ["PLTS atap"]],
  ["MW", "Megawatt", "Satuan daya; 1 MW = 1.000 kW. Menyatakan kapasitas, bukan energi yang dihasilkan.", "A unit of power; 1 MW = 1,000 kW. Expresses capacity, not energy produced.", "satuan", ["MWh", "GW"]],
  ["MWp", "Megawatt peak", "Daya puncak panel surya pada kondisi uji standar; patokan kapasitas PLTS.", "Peak solar panel power at standard test conditions; the reference capacity of a PV plant.", "satuan", ["MW"]],
  ["GW", "Gigawatt", "1 GW = 1.000 MW. Dipakai untuk kapasitas sistem nasional.", "1 GW = 1,000 MW. Used for national system capacity.", "satuan", ["MW"]],
  ["MWh", "Megawatt jam", "Satuan energi; 1 MW yang beroperasi satu jam. Menyatakan listrik yang dihasilkan atau dipakai.", "A unit of energy; 1 MW running for one hour. Expresses electricity produced or used.", "satuan", ["MW", "TWh"]],
  ["TWh", "Terawatt jam", "1 TWh = 1.000.000 MWh. Dipakai untuk produksi dan konsumsi listrik nasional.", "1 TWh = 1,000,000 MWh. Used for national electricity production and consumption.", "satuan", ["MWh"]],
  ["Faktor kapasitas", "Faktor kapasitas", "Produksi sebenarnya dibagi produksi maksimum teoretis dalam setahun, dinyatakan dalam persen.", "Actual output divided by theoretical maximum output over a year, in percent.", "teknis", ["MWh"]],
  ["Co-firing", "Co-firing", "Pembakaran campuran biomassa dan batubara di PLTU untuk menurunkan emisi tanpa membangun pembangkit baru.", "Burning a biomass and coal mix in a coal plant to cut emissions without building a new plant.", "teknis", ["PLTU", "PLTBm"]],
  ["Hipotesis", "Hipotesis", "Label pada skor atau kuadran yang memakai asumsi METI; bukan angka resmi dan bisa berubah bila data baru masuk.", "A label on scores or quadrants that use METI assumptions; not an official figure and may change with new data.", "metode", ["EST"]],
  ["EST", "Estimasi", "Label angka turunan yang dihitung dari data lain, bukan angka yang diumumkan pihak yang bersangkutan.", "A label for figures derived from other data rather than announced by the party concerned.", "metode", ["Hipotesis"]],
];

const bersih = (s) => String(s ?? "").replace(/\{\w+\}/g, "").replace(/\s+/g, " ").replace(/[–—]/g, "-").trim();
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
export const slug = (s) => norm(s).replace(/ /g, "-");

/** Alias pencocokan dari satu nama: bagian "/" dan ",", " dan " antar-kata-tunggal, isi kurung. Nama utuh selalu ikut. */
export function aliasDari(nama) {
  const n = bersih(nama), a = new Set([n]);
  const kurung = [...n.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim());
  const dasar = n.replace(/\s*\([^)]*\)/g, "").trim();
  if (dasar) a.add(dasar);
  kurung.forEach((k) => a.add(k));
  for (const p of dasar.split(/\s*\/\s*|,\s*/)) if (p) a.add(p.trim());
  const dan = dasar.split(/\s+dan\s+/);
  if (dan.length === 2 && dan.every((x) => !/\s/.test(x.replace(/-/g, "")))) dan.forEach((x) => a.add(x));
  return [...a].filter((x) => x.length >= 2);
}

const kurungSaja = (nama, a) => [...bersih(nama).matchAll(/\(([^)]+)\)/g)].some((m) => m[1].trim() === a);

function katTebak(nama, arti) {
  const s = nama + " " + arti;
  if (/\b(wp|wh|mw|kw|gw|twh|kwh|mwh|ton|co2)\b|^satuan/i.test(nama) || /^satuan/i.test(arti)) return "satuan";
  if (/permen|\buu\b|perpres|regulasi|aturan|izin|peraturan|kuota|wajib|sertifikat|regulation|permit|licen[cs]e/i.test(s)) return "aturan";
  if (/\brp\b|biaya|tarif|harga|capex|ppa|kredit|pajak|investasi|pinjaman|subsidi|pendanaan|cost|tariff|price|credit|tax|invest/i.test(s)) return "uang";
  if (/^(badan|kementerian|dewan|direktorat|lembaga|komisi|otoritas|bank|perusahaan|pt\b)/i.test(arti)) return "lembaga";
  if (/^(rencana|peta jalan|roadmap|strategi|target|program|kontribusi)/i.test(arti)) return "rencana";
  return "teknis";
}

function dariTopik() {
  const idx = baca("data/topik/indeks.json").topik.map((x) => x.id);
  const nama = {}, keluar = [];
  for (const f of fs.readdirSync(path.join(PUB, "data/topik"))) {
    if (/^(dasar-|indeks|ui)/.test(f)) continue;
    const d = baca("data/topik/" + f);
    const tid = idx.find((i) => i.replace(/-/g, "_") === f.replace(".json", "")) || f.replace(".json", "").replace(/_/g, "-");
    nama[tid] = d.judul;
    for (const [n, b] of Object.entries(d.bab || {})) {
      if (!b || b.tipe !== "glosarium") continue;
      for (const x of b.butir || []) {
        const aid = bersih(x.arti?.id), aen = bersih(x.arti?.en || x.arti?.id), nm = bersih(x.istilah?.id);
        if (!nm || !aid) continue;
        keluar.push({ nama: nm, id: aid, en: aen, kat: katTebak(nm, aid), sumber: { jenis: "topik", ref: tid, judul: d.judul, bab: Number(n), href: `/topik?id=${tid}#bab-${n}` } });
      }
    }
  }
  return keluar;
}

function dariHukum() {
  const p = path.join(PUB, "data/hukum/katalog.json");
  if (!fs.existsSync(p)) return [];
  const keluar = [];
  const jalan = (o, induk) => {
    if (Array.isArray(o)) return o.forEach((x) => jalan(x, induk));
    if (!o || typeof o !== "object") return;
    const sini = o.judul || o.nama || o.id ? o : induk;
    if (Array.isArray(o.definisi)) for (const x of o.definisi) {
      const nm = bersih(x.istilah || x.nama || x.term), ar = bersih(x.arti || x.definisi || x.isi || x.teks), aen = bersih(x.arti_en || x.en || ar);
      if (!nm || !ar) continue;
      const reg = sini?.judul?.id || sini?.judul || sini?.nama || sini?.id || x.dok || "";
      keluar.push({ nama: nm, id: ar, en: aen, kat: "aturan", resmi: true, sumber: { jenis: "pasal", ref: String(sini?.id || x.dok || ""), judul: typeof reg === "string" ? reg : "", pasal: String(x.pasal || (x.label || "1").replace(/^Pasal\s+/i, "")), href: x.dok ? `/hukum#d=${x.dok}` : `/regulasi#${sini?.id || ""}` } });
    }
    for (const v of Object.values(o)) if (v && typeof v === "object") jalan(v, sini);
  };
  jalan(JSON.parse(fs.readFileSync(p, "utf8")), null);
  return keluar;
}

function dariMetode() {
  const id = baca("i18n/id.json"), en = baca("i18n/en.json"), keluar = [];
  for (const k of ["proyek", "mw", "min", "skor"]) {
    const nm = bersih(id[`oj.arti.${k}`]);
    keluar.push({ nama: nm, id: bersih(id[`oj.arti.${k}.d`]), en: bersih(en[`oj.arti.${k}.d`]), kat: "metode", sumber: { jenis: "metode", ref: "metode", href: "/metode" } });
  }
  return keluar;
}

function dariUmum() {
  return UMUM.map(([s, nm, id, en, kat, terkait]) => ({ nama: s, panjang: nm !== s ? nm : "", id, en, kat, terkait, umum: true, sumber: { jenis: "umum", ref: "umum", href: "" } }));
}

export function gabung(masuk) {
  const kelompok = [], peta = new Map();
  for (const m of masuk) {
    const al = aliasDari(m.nama).concat(m.panjang ? [m.panjang] : []);
    const kunci = al.filter((a) => !kurungSaja(m.nama, a)).map(norm); // singkatan dalam kurung hanya alias, bukan kunci gabung (CPO sawit != CPO pengisian)
    const ada = kunci.map((k) => peta.get(k)).find((g) => g);
    let g = ada;
    if (!g) { g = { item: [], kunci: new Set() }; kelompok.push(g); }
    g.item.push(m);
    for (const k of kunci) { g.kunci.add(k); peta.set(k, g); }
    m._al = al;
  }
  const kuasa = (m) => (m.resmi ? 3 : m.umum ? 2 : 1);
  const hasil = kelompok.map((g) => {
    const urut = [...g.item].sort((a, b) => kuasa(b) - kuasa(a) || b.id.length - a.id.length);
    const utama = urut[0];
    const resmi = g.item.find((m) => m.resmi);
    const nama = (g.item.find((m) => m.umum) || utama).nama;
    const panjang = g.item.map((m) => m.panjang).find(Boolean) || "";
    const alias = [...new Set(g.item.flatMap((m) => m._al).map((a) => a.trim()))];
    const sumber = [], pernah = new Set();
    for (const m of g.item) { const k = JSON.stringify(m.sumber); if (!pernah.has(k)) { pernah.add(k); sumber.push(m.sumber); } }
    return { id: slug(nama), nama, panjang, alias, arti: { id: utama.id, en: utama.en }, kat: resmi ? "aturan" : utama.kat, resmi: !!resmi, sumber, _t: g.item.flatMap((m) => m.terkait || []) };
  });
  const pakai = new Set();
  for (const h of hasil) { let i = h.id || "x", n = 2; while (pakai.has(i)) i = `${h.id}-${n++}`; h.id = i; pakai.add(i); }
  const lihat = new Map(); // alias ternormal -> id (untuk terkait)
  for (const h of hasil) for (const a of [h.nama, ...h.alias]) lihat.set(norm(a), h.id);
  for (const h of hasil) { h.terkait = [...new Set(h._t.map((t) => lihat.get(norm(t))).filter((x) => x && x !== h.id))]; delete h._t; }
  // terkait timbal balik + sesama topik (maks 4) bila kosong
  const peg = new Map(hasil.map((h) => [h.id, h]));
  for (const h of hasil) for (const t of h.terkait) { const o = peg.get(t); if (o && !o.terkait.includes(h.id) && o.terkait.length < 6) o.terkait.push(h.id); }
  // tanpa terkait tertulis: istilah yang namanya (singkatan atau >= 5 huruf) disebut dalam arti ini, atau sebaliknya
  const sebut = (teks, o) => [o.nama, ...o.alias].some((n) => (adaSingkatan(n) || n.length >= 5) && !/[\/,]/.test(n) && new RegExp(`(?<![\\p{L}\\p{N}])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu").test(teks));
  for (const h of hasil) {
    if (h.terkait.length) continue;
    h.terkait = hasil.filter((o) => o !== h && (sebut(h.arti.id, o) || sebut(o.arti.id, h))).slice(0, 4).map((o) => o.id);
  }
  return hasil.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

const adaSingkatan = (a) => (a.match(/[A-Z]/g) || []).length >= 2;
const pendek = (s) => { const k = s.split(/(?<=[.])\s/)[0]; return k.length > 150 ? k.slice(0, 147).replace(/\s+\S*$/, "") + "..." : k; };
/** Indeks ringan untuk hover seluruh situs: m = [alias, id, peka-huruf], d = {id: [nama, id, en, resmi]}. Alias ambigu dibuang. */
export function hover(daftar) {
  const hit = new Map();
  for (const h of daftar) for (const a of new Set([h.nama, ...h.alias])) {
    const sing = adaSingkatan(a), kata = a.split(/\s+/).length;
    if (/[\/,]|^\d/.test(a) || a.length < 3 || (!sing && kata === 1 && a.length < 8)) continue;
    const k = sing ? a : a.toLowerCase();
    (hit.get(k) || hit.set(k, []).get(k)).push([a, h.id, sing ? 1 : 0]);
  }
  const m = [...hit.values()].filter((v) => new Set(v.map((x) => x[1])).size === 1).map((v) => v[0]).sort((a, b) => b[0].length - a[0].length);
  const pakai = new Set(m.map((x) => x[1])), d = {};
  for (const h of daftar) if (pakai.has(h.id)) d[h.id] = [h.nama, pendek(h.arti.id), pendek(h.arti.en), h.resmi ? 1 : 0];
  return { m, d };
}

export function bangun() {
  const t = dariTopik(), h = dariHukum(), m = dariMetode(), u = dariUmum();
  const semua = gabung([...h, ...u, ...m, ...t]);
  const hitung = { topik: t.length, pasal: h.length, metode: m.length, umum: u.length };
  return { dibangun: new Date().toISOString().slice(0, 10), jumlah: semua.length, sumber_hitung: hitung, kat: KAT, istilah: semua };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = bangun();
  fs.writeFileSync(path.join(PUB, "data/istilah.json"), JSON.stringify(out) + "\n");
  fs.writeFileSync(path.join(PUB, "data/istilah_hover.json"), JSON.stringify(hover(out.istilah)) + "\n");
  console.log(out.jumlah, "istilah gabungan;", JSON.stringify(out.sumber_hitung));
}
