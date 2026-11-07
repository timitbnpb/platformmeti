/* /keuangan-hijau: investasi publik EBT vs fosil, obligasi dan sukuk hijau, JETP, skema hibah, pembanding ASEAN. Informasi saja. Data statis /data/keuangan_hijau.json. Tab Pendanaan tidak digandakan, hanya ditautkan. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatData, tampilGalat, sumberLipat, ubinHtml, kartuHtml, pil, num, saatBahasa } from "/analisis.js";
import { kolomSvg, batangSvg, legendaHtml, detailHtml, pasangDetail, tabel, celahHtml, n1 } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
const PENDANAAN = "/direktori?tampil=pendanaan";
let d = null;
const src = (...id) => sumberLipat(id.map((i) => { const s = d.sumber.find((x) => x.id === i); return { sumber: s.penerbit, halaman: s.judul, url: s.url, tanggal: d.dibangun_pada }; }));
const KEL = ["ebt", "fosil", "lain"], KLS = { ebt: "ih-ebt", fosil: "ih-fosil", lain: "ih-lain" };
const jumlahKel = (a, b) => { const o = { ebt: 0, fosil: 0, lain: 0 }; for (const r of d.investasi_publik) if (r.tahun >= a && r.tahun <= b) o[r.kelompok] += r.usd_juta_2023; return o; };
const TAHUN = () => [...new Set(d.investasi_publik.map((r) => r.tahun))].sort((a, b) => a - b);
const slug = (x) => x.toLowerCase().replace(/[^a-z]+/g, "-");
const pilihTingkat = (b) => t("kg.bukti." + b);

function ubin() {
  const th = TAHUN(), z = th.at(-1), k = jumlahKel(z - 9, z), pers = (k.ebt / (k.ebt + k.fosil)) * 100;
  const sukuk = d.instrumen_hijau.find((r) => r.nilai === 185600);
  $("jawab").textContent = t("kg.lead");
  $("ubin").innerHTML = ubinHtml([
    { ikon: "grafik", nilai: num(pers, 0), satuan: "%", label: t("kg.u1", { a: z - 9, b: z }), href: "#investasi", turunan: true },
    { ikon: "kartu", nilai: sukuk ? `Rp${num(sukuk.nilai / 1000, 1)}` : "-", satuan: t("kg.triliun"), label: t("kg.u2"), href: "#obligasi" },
    { ikon: "bintang", nilai: num(d.jetp.komitmen_usd_miliar, 0), satuan: t("kg.miliar_usd"), label: t("kg.u3"), href: "#jetp" },
  ]);
}

function rangka() {
  const th = TAHUN(), z = th.at(-1), k = jumlahKel(z - 9, z), pers = (k.ebt / (k.ebt + k.fosil)) * 100, est = " " + pil("an.est");
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const pem = d.pemberi, besar = pem[0];
  const nt = d.tetangga.find((r) => r.iso3 === "IDN"), urutE = [...d.tetangga].sort((a, b) => b.ebt_persen - a.ebt_persen), rk = urutE.findIndex((r) => r.iso3 === "IDN") + 1;
  const g = d.instrumen_hijau.filter((r) => r.pemerintah && r.satuan === "USD juta" && /Global Sovereign/.test(r.instrumen) && !/Agregat/.test(r.instrumen));
  const jp = d.jetp.proyek, ebtMw = jp.reduce((a, r) => a + (r.kapasitas_mw || 0), 0);
  $("isi").innerHTML = [
    ex({ id: "investasi", ikon: "grafik", topik: t("kg.ey.investasi"), judulHtml: hlHtml("kg.t.investasi", `${num(pers, 0)}%`, { a: z - 9, b: z, e: num(k.ebt, 0), f: num(k.fosil, 0) }) + est, subHtml: esc(t("kg.s.investasi")), csv: true,
      isiHtml: `${legendaHtml(KEL.map((x) => ({ kelas: KLS[x], label: t("kg.kel." + x) })))}<div id="g-investasi" class="ih-bagan"></div>${detailHtml()}<div id="tb-investasi" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("kg.n.investasi"))}</p>${src("s-pubfin")}` }),
    ex({ id: "obligasi", ikon: "kartu", topik: t("kg.ey.obligasi"), judulHtml: hlHtml("kg.t.obligasi", `${g.length} ${t("kg.penerbitan")}`, { n: d.instrumen_hijau.length, usd: num(g.reduce((a, r) => a + r.nilai, 0), 0) }), subHtml: esc(t("kg.s.obligasi")), csv: true,
      isiHtml: `<div id="g-obligasi" class="ih-bagan"></div>${detailHtml()}<div id="tb-obligasi" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("kg.n.obligasi"))}</p>${src("s-djppr", "s-pendanaan")}` }),
    ex({ id: "jetp", ikon: "bintang", topik: t("kg.ey.jetp"), judulHtml: hlHtml("kg.t.jetp", `${jp.length} ${t("kg.entri")}`, { mw: num(ebtMw, 0), usd: num(d.jetp.komitmen_usd_miliar, 0) }), subHtml: esc(t("kg.s.jetp")), csv: true,
      isiHtml: `<div class="jm-an-kartu-baris" id="k-jetp"></div><div id="tb-jetp" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("kg.n.jetp"))}</p>${src("s-jetp")}` }),
    ex({ id: "pendana", ikon: "gedung", topik: t("kg.ey.pendana"), judulHtml: hlHtml("kg.t.pendana", `${pem[0].pemberi}`, { usd: n1(besar.usd / 1e9, 1) }), subHtml: esc(t("kg.s.pendana")), csv: true,
      isiHtml: `<div id="g-pendana" class="ih-bagan"></div>${detailHtml()}<div id="tb-skema" class="ih-tabel"></div><p class="ih-catatan"><a class="ih-tautan-pil" href="${PENDANAAN}">${ikon("direktori", 18)}${esc(t("kg.tab_pendanaan"))}</a></p><p class="jm-bantu ih-catatan">${esc(t("kg.n.pendana"))}</p>${src("s-pendanaan")}` }),
    ex({ id: "tetangga", ikon: "asean", topik: t("kg.ey.tetangga"), judulHtml: hlHtml("kg.t.tetangga", `${rk} ${t("kg.dari")} ${urutE.length}`, { v: n1(nt.ebt_persen, 1) }) + est, subHtml: esc(t("kg.s.tetangga")), csv: true,
      isiHtml: `${legendaHtml([{ kelas: "ih-id", label: t("ih.neg.IDN") }, { kelas: "ih-netral", label: t("kg.lain_asean") }])}<div id="g-tetangga" class="ih-bagan"></div>${detailHtml()}<div id="tb-tetangga" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("kg.n.tetangga"))}</p>${src("s-ember")}` }),
    ex({ id: "celah", ikon: "unduh", topik: t("kg.ey.celah"), judulHtml: hlHtml("kg.t.celah", String(d.celah.length)), subHtml: esc(t("kg.s.celah")), isiHtml: celahHtml(d.celah, "kg.celah") }),
  ].join("");
  $("k-jetp").innerHTML = [
    kartuHtml({ judul: t("kg.k.komit"), ikon: "bintang", nilai: num(d.jetp.komitmen_usd_miliar, 0), satuan: t("kg.miliar_usd"), penyebut: t("kg.k.komit_s"), sumber: "" }),
    kartuHtml({ judul: t("kg.k.ebt"), ikon: "tek-listrik", nilai: num(ebtMw, 0), satuan: "MW", penyebut: t("kg.k.ebt_s"), sumber: "" }),
    kartuHtml({ judul: t("kg.k.entri"), ikon: "proyek", nilai: num(jp.length, 0), satuan: "", penyebut: t("kg.k.entri_s"), sumber: "" }),
  ].join("");
  tabelTabel();
}

function tabelTabel() {
  const th = TAHUN(), z = th.at(-1), ref = [...new Set(d.investasi_publik.map((r) => r.teknologi))];
  tabel($("tb-investasi"), { satuan: "ih.u.tek", per: 10, urutAwal: 2, kolom: [
    { label: t("kg.c.tek"), v: (r) => t("kg.tek." + slug(r.t)), f: (r) => esc(t("kg.tek." + slug(r.t))) },
    { label: t("kg.c.kel"), v: (r) => t("kg.kel." + r.kel), f: (r) => esc(t("kg.kel." + r.kel)) },
    { label: t("kg.c.jumlah", { a: z - 9, b: z }), num: true, v: (r) => r.jml, f: (r) => num(r.jml, 1) },
    { label: t("kg.c.semua"), num: true, v: (r) => r.semua, f: (r) => num(r.semua, 1) },
  ], baris: ref.map((x) => { const rs = d.investasi_publik.filter((r) => r.teknologi === x); return { t: x, kel: rs[0].kelompok, jml: rs.filter((r) => r.tahun > z - 10).reduce((a, r) => a + r.usd_juta_2023, 0), semua: rs.reduce((a, r) => a + r.usd_juta_2023, 0) }; }) });
  tabel($("tb-obligasi"), { satuan: "ih.u.instrumen", per: 6, urutAwal: 3, kolom: [
    { label: t("kg.c.penerbit"), v: (r) => r.penerbit, f: (r) => esc(r.penerbit) },
    { label: t("kg.c.instrumen"), v: (r) => r.instrumen, f: (r) => esc(r.instrumen) },
    { label: t("kg.c.nilai"), num: true, v: (r) => (r.nilai == null ? null : `${r.satuan}|${String(Math.round(r.nilai)).padStart(10, "0")}`), f: (r) => (r.nilai == null ? "-" : `${num(r.nilai, 0)} ${esc(r.satuan)}`) },
    { label: t("kg.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t("kg.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => esc(pilihTingkat(r.tingkat_bukti)) },
  ], baris: d.instrumen_hijau });
  tabel($("tb-jetp"), { satuan: "ih.u.entri", per: 10, urutAwal: 0, menurun: false, kolom: [
    { label: t("kg.c.nama"), v: (r) => r.nama, f: (r) => (r.sumber_url ? `<a href="${esc(r.sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(r.nama)}</a>` : esc(r.nama)) },
    { label: t("kg.c.jenis"), v: (r) => r.jenis, f: (r) => esc(t("kg.jenis." + r.jenis)) },
    { label: t("kg.c.tek"), v: (r) => r.teknologi || "", f: (r) => (r.teknologi ? esc(t("ih.tek." + r.teknologi)) : "-") },
    { label: t("kg.c.mw"), num: true, v: (r) => r.kapasitas_mw, f: (r) => (r.kapasitas_mw == null ? "-" : num(r.kapasitas_mw, 0)) },
  ], baris: d.jetp.proyek });
  tabel($("tb-skema"), { satuan: "ih.u.skema", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("kg.c.skema"), v: (r) => r.nama, f: (r) => (r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.nama)}</a>` : esc(r.nama)) },
    { label: t("kg.c.pemberi"), v: (r) => r.pemberi, f: (r) => esc(r.pemberi) },
    { label: t("kg.c.jenis"), v: (r) => r.jenis, f: (r) => esc(t("kg.skj." + slug(r.jenis))) },
    { label: t("kg.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => esc(pilihTingkat(r.tingkat_bukti)) },
  ], baris: d.skema });
  tabel($("tb-tetangga"), { satuan: "ih.u.negara", per: 10, urutAwal: 1, kelasBaris: (r) => (r.iso3 === "IDN" ? "ih-baris-id" : ""), kolom: [
    { label: t("bl.c.negara"), v: (r) => t("ih.neg." + r.iso3), f: (r) => esc(t("ih.neg." + r.iso3)) },
    { label: t("kg.c.ebt"), num: true, v: (r) => r.ebt_persen, f: (r) => n1(r.ebt_persen, 1) },
    { label: `${t("kg.c.fosil")} ${t("an.est")}`, num: true, v: (r) => r.fosil_persen, f: (r) => n1(r.fosil_persen, 1) },
    { label: t("kg.c.karbon"), num: true, v: (r) => r.intensitas_gco2_kwh, f: (r) => (r.intensitas_gco2_kwh == null ? "-" : num(r.intensitas_gco2_kwh, 0)) },
    { label: t("kg.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
  ], baris: d.tetangga });
}

function bagan() {
  const th = TAHUN();
  $("g-investasi").innerHTML = kolomSvg({ el: $("g-investasi"), satuan: t("kg.sat_usd"), label: t("kg.s.investasi"), seri: KEL.map((k) => ({ k, kelas: KLS[k] })),
    kategori: th.map((y) => { const nilai = { ebt: 0, fosil: 0, lain: 0 }; for (const r of d.investasi_publik) if (r.tahun === y) nilai[r.kelompok] += r.usd_juta_2023; return { label: String(y), nilai, tip: t("kg.tip_inv", { tahun: y, e: num(nilai.ebt, 0), f: num(nilai.fosil, 0), l: num(nilai.lain, 0) }) }; }) });
  const g = d.instrumen_hijau.filter((r) => r.pemerintah && r.satuan === "USD juta" && /Global Sovereign/.test(r.instrumen) && !/Agregat/.test(r.instrumen)).sort((a, b) => a.tahun - b.tahun);
  $("g-obligasi").innerHTML = `<p class="jm-bantu">${esc(t("kg.g_sukuk"))}</p>` + kolomSvg({ el: $("g-obligasi"), satuan: t("kg.sat_usd"), label: t("kg.g_sukuk"), seri: [{ k: "v", kelas: "ih-ebt" }], kategori: g.map((r) => ({ label: String(r.tahun), nilai: { v: r.nilai }, tip: `${r.tahun}: ${num(r.nilai, 0)} ${t("kg.sat_usd")}, ${r.instrumen}` })) });
  $("g-pendana").innerHTML = batangSvg({ el: $("g-pendana"), d: 1, label: t("kg.s.pendana"), satuan: t("kg.miliar_usd"), seri: [{ k: "v", kelas: "ih-netral" }], baris: d.pemberi.map((r) => ({ label: r.pemberi, tip: t("kg.tip_pem", { p: r.pemberi, usd: n1(r.usd / 1e9, 2), n: r.jumlah_proyek }), bagian: [{ k: "v", nilai: r.usd / 1e9 }] })) });
  const u = [...d.tetangga].sort((a, b) => b.ebt_persen - a.ebt_persen);
  $("g-tetangga").innerHTML = batangSvg({ el: $("g-tetangga"), d: 1, label: t("kg.s.tetangga"), satuan: "%", seri: [{ k: "n", kelas: "ih-netral" }, { k: "i", kelas: "ih-id" }], baris: u.map((r) => ({ label: `${t("ih.neg." + r.iso3)} (${r.tahun})`, sorot: r.iso3 === "IDN", tip: `${t("ih.neg." + r.iso3)}, ${r.tahun}: ${n1(r.ebt_persen, 1)}%`, bagian: [{ k: r.iso3 === "IDN" ? "i" : "n", nilai: r.ebt_persen }] })) });
}

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(3);
  try { d = await muatData("keuangan_hijau.json"); } catch (e) { tampilGalat($("isi"), mulai); return; }
  const gambar = () => { ubin(); rangka(); bagan(); };
  gambar();
  saatBahasa(gambar);
  pasangDetail($("isi"));
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; nanti(bagan); } }, 200));
}
mulai();
