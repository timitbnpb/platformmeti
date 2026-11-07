// Panen benchmark luar negeri untuk topik karbon dari Our World in Data (grafik terbuka, CC BY 4.0).
// Sopan: UA tertulis, robots.txt dibaca dulu, jeda >= 2 detik, berhenti pada 403/429. Tidak mengarang: sel kosong = tidak ada data.
// World Bank Carbon Pricing Dashboard dibaca lebih dulu tetapi membalas 403 (tantangan Cloudflare) pada 8 Nov 2026; tidak dilewati.
// Pakai: node scripts/pipa/topik_luar_karbon.mjs  -> public/data/topik/luar_karbon.json
import { writeFileSync, mkdirSync } from "node:fs";

const UA = "METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)";
const BASE = "https://ourworldindata.org";
const JEDA = 2200;
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const NEGARA = [
  ["IDN", "Indonesia", "Indonesia"], ["MYS", "Malaysia", "Malaysia"], ["SGP", "Singapore", "Singapura"], ["THA", "Thailand", "Thailand"],
  ["VNM", "Vietnam", "Vietnam"], ["PHL", "Philippines", "Filipina"], ["CHN", "China", "Tiongkok"], ["IND", "India", "India"], ["JPN", "Japan", "Jepang"],
  ["KOR", "South Korea", "Korea Selatan"], ["DEU", "Germany", "Jerman (anggota ETS Uni Eropa)"], ["USA", "United States", "Amerika Serikat"],
  ["AUS", "Australia", "Australia"], ["BRA", "Brazil", "Brasil"], ["ZAF", "South Africa", "Afrika Selatan"],
];
const SET = {
  cakupan: "carbon-tax-trading-coverage", pajak: "emissions-weighted-carbon-price", ets: "weighted-carbon-price-ets",
  instrumen_pajak: "carbon-tax-instruments", instrumen_ets: "carbon-emissions-trading-system", per_kapita: "co-emissions-per-capita",
  intensitas: "electricity-mix",
};
const QS = { intensitas: "frequency=annual&metric=carbon_intensity&source=total&v=1&csvType=full&useColumnShortNames=true" };
const QS_STD = "v=1&csvType=full&useColumnShortNames=true";

async function ambil(url, teks = true) {
  const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
  if (r.status === 403 || r.status === 429) { console.error("BERHENTI", r.status, url); process.exit(2); }
  if (!r.ok) throw new Error(r.status + " " + url);
  const h = teks ? await r.text() : await r.json();
  await tidur(JEDA);
  return h;
}
function csv(t) {
  const [kep, ...bar] = t.trim().split("\n");
  const k = kep.split(",");
  return bar.map((b) => { const c = b.split(","); return Object.fromEntries(k.map((n, i) => [n, c[i]])); });
}

const robots = await ambil(`${BASE}/robots.txt`);
if (/Disallow:\s*\/grapher/i.test(robots)) { console.error("robots melarang /grapher"); process.exit(3); }

const per = {}, meta = {};
for (const [kunci, slug] of Object.entries(SET)) {
  const qs = QS[kunci] || QS_STD;
  const baris = csv(await ambil(`${BASE}/grapher/${slug}.csv?${qs}`));
  const md = await ambil(`${BASE}/grapher/${slug}.metadata.json?${QS[kunci] || QS_STD}`, false);
  const kol = Object.values(md.columns)[0];
  meta[kunci] = { slug, judul: md.chart.title, kutipan: md.chart.citation, satuan: kol.unit, diperbarui: kol.lastUpdated, kutipan_panjang: kol.citationLong, url: `${BASE}/grapher/${slug}` };
  per[kunci] = baris;
}
const nilai = (k, nama, kolom) => per[k].filter((r) => r.entity === nama && r[kolom] !== "" && r[kolom] !== undefined).map((r) => [+r.year, r[kolom]]);
const terakhir = (a) => (a.length ? a[a.length - 1] : null);
const num = (a) => (a ? [a[0], Math.round(+a[1] * 1000) / 1000] : null);

const negara = NEGARA.map(([kode, en, id]) => {
  const cov = terakhir(nilai("cakupan", en, "co2_with_tax_or_ets_as_share_of_co2"));
  const ctax = terakhir(nilai("cakupan", en, "co2_with_tax_as_share_of_co2"));
  const cets = terakhir(nilai("cakupan", en, "co2_with_ets_as_share_of_co2"));
  const thn = cov?.[0];
  const stat = (k, kol) => { const a = terakhir(nilai(k, en, kol)); return a ? { tahun: a[0], nilai: a[1] } : null; };
  const pertama = (k, kol, cocok) => { const a = nilai(k, en, kol).find((x) => x[1] === cocok); return a ? a[0] : null; };
  return {
    kode, nama: { id, en: en === "Germany" ? "Germany (EU ETS member)" : en },
    cakupan: cov ? { tahun: cov[0], semua: +cov[1], pajak: ctax ? +ctax[1] : null, ets: cets ? +cets[1] : null } : null,
    harga_pajak: num(terakhir(nilai("pajak", en, "price_with_tax_weighted_by_share_of_co2"))),
    harga_ets: num(terakhir(nilai("ets", en, "price_with_ets_weighted_by_share_of_co2"))),
    pajak_status: stat("instrumen_pajak", "tax"), ets_status: stat("instrumen_ets", "ets"),
    pajak_sejak: pertama("instrumen_pajak", "tax", "Has a carbon tax"), ets_sejak: pertama("instrumen_ets", "ets", "Has an ETS"),
    per_kapita: num(terakhir(nilai("per_kapita", en, "emissions_total_per_capita"))),
    intensitas_listrik: num(terakhir(nilai("intensitas", en, "co2_intensity__gco2_kwh"))),
    deret_cakupan: nilai("cakupan", en, "co2_with_tax_or_ets_as_share_of_co2").filter((x) => x[0] >= 2005).map((x) => [x[0], Math.round(+x[1] * 10) / 10]),
    deret_intensitas: nilai("intensitas", en, "co2_intensity__gco2_kwh").filter((x) => x[0] >= 2005).map((x) => [x[0], Math.round(+x[1])]),
    _tahun: thn,
  };
}).map(({ _tahun, ...r }) => r);

const hasil = { jenis: "benchmark_karbon_luar", tanggal_ambil: new Date().toISOString().slice(0, 10), lisensi: "CC BY 4.0 (Our World in Data; data asal Dolphin dan Merkle 2024 RFF, Global Carbon Project, Ember)", ua: UA, sumber: meta, negara,
  meta: { catatan: "Harga = rata-rata tertimbang bagian emisi CO2 nasional (US$ konstan 2021 per tCO2e), bukan harga kutipan. Cakupan = persen emisi CO2 yang terkena pajak atau ETS. Nilai kosong = sumber tidak memuat.", celah: ["World Bank Carbon Pricing Dashboard membalas 403 (tantangan Cloudflare); panen dihentikan di sana dan tidak dilewati. Angka RFF yang dipakai di sini adalah seri terbuka yang dikelola Our World in Data.", "Uni Eropa sebagai kesatuan tidak ada di seri RFF per negara; Jerman dipakai sebagai wakil anggota EU ETS (harga dan cakupan nasionalnya mengikuti sistem Uni Eropa).", "ICAP Allowance Price Explorer tidak dipanen (halaman berparameter dilarang robots dan tanpa API terbuka)."] } };
mkdirSync("public/data/topik", { recursive: true });
writeFileSync("public/data/topik/luar_karbon.json", JSON.stringify(hasil));
console.log("ok", negara.map((n) => `${n.kode}:${n.cakupan?.semua ?? "-"}`).join(" "));
