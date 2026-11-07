/* /biaya-listrik: LCOE dunia dan negara (IRENA), harga modul surya, BPP per sistem (Kepmen ESDM). Informasi saja, tanpa kalkulator. Data statis /data/biaya_listrik.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce } from "/inti/umum.js";
import { t } from "/i18n.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatData, tampilGalat, sumberLipat, ubinHtml, pil, num, saatBahasa } from "/analisis.js";
import { kolomSvg, garisSvg, batangSvg, legendaHtml, detailHtml, pasangDetail, tabel, n1 } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
const TEK = ["surya", "bayu-darat", "bayu-laut", "air", "panas-bumi", "bioenergi", "surya-termal"];
const KLS = { surya: "ih-s1", "bayu-darat": "ih-s2", "bayu-laut": "ih-s7", air: "ih-s3", "panas-bumi": "ih-s4", bioenergi: "ih-s5", "surya-termal": "ih-s6" };
let d = null, banding = "surya";
const nm = (k) => t("ih.tek." + k), nn = (r) => t("ih.neg." + r.iso3);
const src = (...id) => sumberLipat(id.map((i) => { const s = d.sumber.find((x) => x.id === i); return { sumber: s.penerbit, halaman: s.judul, url: s.url, tanggal: d.dibangun_pada }; }));
const dunia = (tek) => d.lcoe.filter((r) => r.iso3 === "WLD" && r.teknologi === tek).sort((a, b) => a.tahun - b.tahun);
const akhir = (a) => a.at(-1), awal = (a) => a[0];
const persen = (a, b) => ((b - a) / a) * 100;

function ubin() {
  const s = dunia("surya"), bp = d.bpp_nasional.at(-1);
  $("jawab").textContent = t("bl.lead");
  $("ubin").innerHTML = ubinHtml([
    { ikon: "tek-surya", nilai: n1(akhir(s).sen_usd_kwh, 2), satuan: t("bl.sat"), label: t("bl.u1", { tahun: akhir(s).tahun }), href: "#lcoe" },
    { ikon: "grafik", nilai: num(persen(awal(s).sen_usd_kwh, akhir(s).sen_usd_kwh), 0), satuan: "%", label: t("bl.u2", { a: awal(s).tahun, b: akhir(s).tahun }), href: "#lcoe" },
    { ikon: "tabel", nilai: n1(bp.sen_usd_kwh, 2), satuan: t("bl.sat"), label: t("bl.u3", { tahun: bp.tahun }), href: "#bpp" },
  ]);
}

function rangka() {
  const s = dunia("surya"), mod = d.modul, m0 = awal(mod), m1 = akhir(mod), bp = d.bpp_nasional, b0 = awal(bp), b1 = akhir(bp);
  const bawah = TEK.filter((k) => akhir(dunia(k)).sen_usd_kwh < b1.sen_usd_kwh).length;
  const idn = d.lcoe.filter((r) => r.iso3 === "IDN" && r.teknologi === "bayu-darat").sort((a, b) => a.tahun - b.tahun), i1 = akhir(idn), w1 = dunia("bayu-darat").find((r) => r.tahun === i1.tahun);
  const est = " " + pil("an.est");
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const tabBanding = `<div class="jm-tab" role="tablist" aria-label="${esc(t("bl.pilih_tek"))}">${["surya", "bayu-darat"].map((k) => `<button type="button" role="tab" data-tek="${k}" aria-selected="${k === banding}">${esc(nm(k))}</button>`).join("")}</div>`;
  $("isi").innerHTML = [
    ex({ id: "lcoe", ikon: "tek-surya", topik: t("bl.ey.lcoe"), judulHtml: hlHtml("bl.t.lcoe", `${num(persen(awal(s).sen_usd_kwh, akhir(s).sen_usd_kwh), 0)}%`, { a: awal(s).tahun, b: akhir(s).tahun }) + est, subHtml: esc(t("bl.s.lcoe")), csv: true,
      isiHtml: `${legendaHtml(TEK.map((k) => ({ kelas: KLS[k], label: nm(k) })))}<div id="g-lcoe" class="ih-bagan"></div>${detailHtml()}<div id="tb-lcoe" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("bl.n.lcoe"))}</p>${src("s-irena-lcoe")}` }),
    ex({ id: "banding", ikon: "wilayah", topik: t("bl.ey.banding"), judulHtml: hlHtml("bl.t.banding", `${n1(i1.sen_usd_kwh, 2)}`, { tahun: i1.tahun, x: n1(i1.sen_usd_kwh / w1.sen_usd_kwh, 1), w: n1(w1.sen_usd_kwh, 2) }) + est, subHtml: esc(t("bl.s.banding")), csv: true,
      isiHtml: `${tabBanding}<div id="g-banding" class="ih-bagan"></div>${detailHtml()}<div id="tb-banding" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("bl.n.banding"))}</p>${src("s-irena-lcoe")}` }),
    ex({ id: "ebt-fosil", ikon: "analisis", topik: t("bl.ey.ebtfosil"), judulHtml: hlHtml("bl.t.ebtfosil", `${bawah} ${t("bl.dari")} ${TEK.length}`, { bpp: n1(b1.sen_usd_kwh, 2), tahun: b1.tahun }) + est, subHtml: esc(t("bl.s.ebtfosil")),
      isiHtml: `<div id="g-ebtfosil" class="ih-bagan"></div>${detailHtml()}<p class="jm-bantu ih-catatan">${esc(t("bl.n.ebtfosil"))}</p>${src("s-irena-lcoe", "s-bpp")}` }),
    ex({ id: "modul", ikon: "tahun", topik: t("bl.ey.modul"), judulHtml: hlHtml("bl.t.modul", `${n1(m1.usd_per_w, 2)} USD/W`, { a: n1(m0.usd_per_w, 1), ta: m0.tahun, tb: m1.tahun }), subHtml: esc(t("bl.s.modul")), csv: true,
      isiHtml: `<div id="g-modul" class="ih-bagan"></div>${detailHtml()}<div id="tb-modul" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("bl.n.modul"))}</p>${src("s-irena-modul")}` }),
    ex({ id: "bpp", ikon: "tabel", topik: t("bl.ey.bpp"), judulHtml: hlHtml("bl.t.bpp", `Rp${num(b1.rp_kwh, 0)}`, { a: `Rp${num(b0.rp_kwh, 0)}`, ta: b0.tahun, tb: b1.tahun, p: num(persen(b0.rp_kwh, b1.rp_kwh), 1) }) + est, subHtml: esc(t("bl.s.bpp")), csv: true,
      isiHtml: `<div id="g-bpp" class="ih-bagan"></div>${detailHtml()}<div id="g-bpp2" class="ih-bagan ih-tabel"></div><div id="tb-bpp" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("bl.n.bpp"))}</p>${src("s-bpp")}` }),
    ex({ id: "celah", ikon: "info", topik: t("bl.ey.celah"), judulHtml: hlHtml("bl.t.celah", String(d.meta.celah.length)), subHtml: esc(t("bl.s.celah")),
      isiHtml: `<ul class="ih-lis">${d.meta.celah.map((_, i) => `<li>${esc(t("bl.celah." + (i + 1)))}</li>`).join("")}</ul>` }),
  ].join("");
  tabelTabel();
}

function tabelTabel() {
  tabel($("tb-lcoe"), { satuan: "ih.u.tek", per: 10, urutAwal: 2, kolom: [
    { label: t("bl.c.tek"), v: (r) => nm(r.k), f: (r) => esc(nm(r.k)) },
    { label: t("bl.c.2010"), num: true, v: (r) => r.a.sen_usd_kwh, f: (r) => `${n1(r.a.sen_usd_kwh, 2)} (${r.a.tahun})` },
    { label: t("bl.c.akhir"), num: true, v: (r) => r.b.sen_usd_kwh, f: (r) => `${n1(r.b.sen_usd_kwh, 2)} (${r.b.tahun})` },
    { label: `${t("bl.c.ubah")} ${t("an.est")}`, num: true, v: (r) => persen(r.a.sen_usd_kwh, r.b.sen_usd_kwh), f: (r) => `${num(persen(r.a.sen_usd_kwh, r.b.sen_usd_kwh), 0)}%` },
  ], baris: TEK.map((k) => ({ k, a: awal(dunia(k)), b: akhir(dunia(k)) })) });
  tbBanding();
  tabel($("tb-modul"), { satuan: "ih.u.tahun", per: 10, urutAwal: 0, kolom: [
    { label: t("bl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t("bl.c.usdw"), num: true, v: (r) => r.usd_per_w, f: (r) => n1(r.usd_per_w, 3) },
  ], baris: d.modul });
  tbBpp();
}
function tbBanding() {
  const negara = [...new Set(d.lcoe.filter((r) => r.iso3 !== "WLD" && r.teknologi === banding).map((r) => r.iso3))];
  const terakhir = (iso) => akhir(d.lcoe.filter((r) => r.iso3 === iso && r.teknologi === banding).sort((a, b) => a.tahun - b.tahun));
  tabel($("tb-banding"), { satuan: "ih.u.negara", per: 10, urutAwal: 1, menurun: false, kelasBaris: (r) => (r.iso3 === "IDN" ? "ih-baris-id" : ""), kolom: [
    { label: t("bl.c.negara"), v: (r) => nn(r), f: (r) => esc(nn(r)) },
    { label: t("bl.c.sen"), num: true, v: (r) => r.sen_usd_kwh, f: (r) => n1(r.sen_usd_kwh, 2) },
    { label: t("bl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
  ], baris: [dunia(banding).at(-1), ...negara.map(terakhir)] });
}
function tbBpp() {
  const rp = (v) => (v == null ? "-" : `Rp${num(v, 0)}`);
  const th = d.bpp_nasional.map((b) => b.tahun);
  tabel($("tb-bpp"), { satuan: "ih.u.sistem", per: 10, urutAwal: th.length + 1, kolom: [
    { label: t("bl.c.sistem"), v: (r) => r.nama, f: (r) => esc(r.nama) },
    ...th.map((y) => ({ label: String(y), num: true, v: (r) => r.rp_kwh[y] ?? null, f: (r) => rp(r.rp_kwh[y]) })),
    { label: `${t("bl.c.ubah")} ${t("an.est")}`, num: true, v: (r) => ubah(r, th), f: (r) => { const u = ubah(r, th); return u == null ? "-" : `${num(u, 0)}%`; } },
  ], baris: d.bpp_sistem });
}
const ubah = (r, th) => { const a = r.rp_kwh[th[0]], b = r.rp_kwh[th.at(-1)]; return a && b ? persen(a, b) : null; };

function bagan() {
  const tip = (r, v, y) => `${nm(r)}, ${y}: ${n1(v, 2)} ${t("bl.sat")}`;
  $("g-lcoe").innerHTML = garisSvg({ el: $("g-lcoe"), satuan: t("bl.sat"), label: t("bl.s.lcoe"), seri: TEK.map((k) => ({ id: k, kelas: KLS[k], label: nm(k), titik: dunia(k).map((r) => ({ x: r.tahun, y: r.sen_usd_kwh, tip: tip(k, r.sen_usd_kwh, r.tahun) })) })) });
  gBanding();
  const b = d.bpp_nasional.at(-1);
  const akh = TEK.map((k) => akhir(dunia(k)));
  $("g-ebtfosil").innerHTML = kolomSvg({ el: $("g-ebtfosil"), satuan: t("bl.sat"), label: t("bl.s.ebtfosil"), seri: [{ k: "v", kelas: "ih-ebt" }], ref: { nilai: b.sen_usd_kwh, label: t("bl.ref", { tahun: b.tahun }) },
    kategori: akh.map((r) => ({ label: nm(r.teknologi), nilai: { v: r.sen_usd_kwh }, tip: tip(r.teknologi, r.sen_usd_kwh, r.tahun) })) });
  $("g-modul").innerHTML = garisSvg({ el: $("g-modul"), satuan: "USD/W", label: t("bl.s.modul"), xTick: [1975, 1990, 2005, 2025], seri: [{ id: "m", kelas: "ih-s1", label: t("bl.modul"), titik: d.modul.map((r) => ({ x: r.tahun, y: r.usd_per_w, tip: `${r.tahun}: ${n1(r.usd_per_w, 3)} USD/W` })) }] });
  $("g-bpp").innerHTML = kolomSvg({ el: $("g-bpp"), satuan: "Rp/kWh", label: t("bl.s.bpp"), seri: [{ k: "v", kelas: "ih-netral" }],
    kategori: d.bpp_nasional.map((r) => ({ label: String(r.tahun), nilai: { v: r.rp_kwh }, tip: t("bl.tip_bpp", { tahun: r.tahun, rp: num(r.rp_kwh, 1), sen: n1(r.sen_usd_kwh, 2), kepmen: r.kepmen }) })) });
  const th = d.bpp_nasional.at(-1).tahun, atas = [...d.bpp_sistem].filter((r) => r.rp_kwh[th]).sort((x, y) => y.rp_kwh[th] - x.rp_kwh[th]).slice(0, 12);
  $("g-bpp2").innerHTML = `<p class="jm-bantu">${esc(t("bl.top", { tahun: th }))}</p>` + batangSvg({ el: $("g-bpp2"), d: 0, label: t("bl.top", { tahun: th }), satuan: "Rp/kWh", seri: [{ k: "v", kelas: "ih-netral" }], baris: atas.map((r) => ({ label: r.nama, tip: `${r.nama}, ${th}: Rp${num(r.rp_kwh, 0)}/kWh`, bagian: [{ k: "v", nilai: r.rp_kwh }] })) });
}
function gBanding() {
  const negara = [...new Set(d.lcoe.filter((r) => r.teknologi === banding).map((r) => r.iso3))];
  const baris = negara.map((iso) => { const a = d.lcoe.filter((r) => r.iso3 === iso && r.teknologi === banding).sort((x, y) => x.tahun - y.tahun); return akhir(a); }).sort((a, b) => b.sen_usd_kwh - a.sen_usd_kwh);
  $("g-banding").innerHTML = batangSvg({ el: $("g-banding"), d: 2, label: t("bl.s.banding"), satuan: t("bl.sat"), seri: [{ k: "n", kelas: "ih-netral" }, { k: "i", kelas: "ih-id" }, { k: "w", kelas: "ih-lawan" }],
    baris: baris.map((r) => ({ label: `${nn(r)} (${r.tahun})`, sorot: r.iso3 === "IDN", tip: `${nn(r)}, ${r.tahun}: ${n1(r.sen_usd_kwh, 2)} ${t("bl.sat")}`, bagian: [{ k: r.iso3 === "IDN" ? "i" : r.iso3 === "WLD" ? "w" : "n", nilai: r.sen_usd_kwh }] })) });
}

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(3);
  try { d = await muatData("biaya_listrik.json"); } catch (e) { tampilGalat($("isi"), mulai); return; }
  const gambar = () => { ubin(); rangka(); bagan(); };
  gambar();
  saatBahasa(gambar);
  pasangDetail($("isi"));
  $("isi").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tek]"); if (!b || b.dataset.tek === banding) return;
    for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b));
    banding = b.dataset.tek;
    nanti(() => { gBanding(); tbBanding(); });
  });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; bagan(); } }, 200));
}
mulai();
