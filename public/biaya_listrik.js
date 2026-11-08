/* /biaya-listrik: LCOE dunia dan negara (IRENA), harga modul surya, BPP per sistem (Kepmen ESDM). Informasi saja, tanpa kalkulator. Data statis /data/biaya_listrik.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce, ikon } from "/inti/umum.js";
import { uangHtml } from "/inti/uang.js";
import { t } from "/i18n.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatData, tampilGalat, sumberLipat, ubinHtml, pil, num, saatBahasa } from "/analisis.js";
import { pasangPasar } from "/pasar_listrik.js";
import { kolomSvg, garisSvg, batangSvg, legendaHtml, tabel, n1, tipHtml, selisih, pilUbah, sparkSvg } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
const TEK = ["surya", "bayu-darat", "bayu-laut", "air", "panas-bumi", "bioenergi", "surya-termal"];
const KLS = { surya: "ih-s1", "bayu-darat": "ih-s2", "bayu-laut": "ih-s7", air: "ih-s3", "panas-bumi": "ih-s4", bioenergi: "ih-s5", "surya-termal": "ih-s6" };
let d = null, banding = "bayu-darat", logModul = true, thBpp = null;
const ISO2 = { IDN: "id", VNM: "vn", THA: "th", PHL: "ph", IND: "in", LAO: "la" };
const IKT = { surya: "tek-surya", "surya-termal": "tek-surya", "bayu-darat": "tek-listrik", "bayu-laut": "tek-listrik", air: "petir", "panas-bumi": "tek-panas", bioenergi: "tek-bio" };
const bendHtml = (iso) => (ISO2[iso] ? `<img class="ih-fl" src="/img/bendera/${ISO2[iso]}.svg" width="22" height="16" alt="" loading="lazy">` : ikon("globe", 20));
const lambHtml = (r) => `<img class="ih-pt" src="/img/provinsi/${esc(r.provinsi[0])}.png" width="20" height="20" alt="" loading="lazy">`;
const thIni = () => thBpp || d.bpp_nasional.at(-1).tahun;
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
  const tabTh = `<div class="jm-tab" role="tablist" aria-label="${esc(t("bl.pilih_th"))}">${bp.map((r) => `<button type="button" role="tab" data-bth="${r.tahun}" aria-selected="${r.tahun === thIni()}">${r.tahun}</button>`).join("")}</div>`;
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const tabBanding = `<div class="jm-tab" role="tablist" aria-label="${esc(t("bl.pilih_tek"))}">${["surya", "bayu-darat"].map((k) => `<button type="button" role="tab" data-tek="${k}" aria-selected="${k === banding}">${esc(nm(k))}</button>`).join("")}</div>`;
  $("isi").innerHTML = [
    ex({ id: "lcoe", ikon: "tek-surya", topik: t("bl.ey.lcoe"), judulHtml: hlHtml("bl.t.lcoe", `${num(Math.abs(persen(awal(s).sen_usd_kwh, akhir(s).sen_usd_kwh)), 0)}%`, { a: awal(s).tahun, b: akhir(s).tahun }) + est, subHtml: esc(t("bl.s.lcoe")), csv: true,
      isiHtml: `${legendaHtml(TEK.map((k) => ({ id: k, kelas: KLS[k], label: nm(k) })))}<div id="g-lcoe" class="ih-bagan"></div><div id="tb-lcoe" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("bl.n.lcoe"))}</p>${src("s-irena-lcoe")}` }),
    ex({ id: "banding", ikon: "wilayah", topik: t("bl.ey.banding"), judulHtml: hlHtml("bl.t.banding", `${n1(i1.sen_usd_kwh, 2)}`, { tahun: i1.tahun, x: n1(i1.sen_usd_kwh / w1.sen_usd_kwh, 1), w: n1(w1.sen_usd_kwh, 2) }) + est, subHtml: esc(t("bl.s.banding")), csv: true,
      isiHtml: `${tabBanding}<div id="g-banding" class="ih-bagan"></div><div id="tb-banding" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("bl.n.banding"))}</p>${src("s-irena-lcoe")}` }),
    ex({ id: "ebt-fosil", ikon: "analisis", topik: t("bl.ey.ebtfosil"), judulHtml: hlHtml("bl.t.ebtfosil", `${bawah} ${t("bl.dari")} ${TEK.length}`, { bpp: n1(b1.sen_usd_kwh, 2), tahun: b1.tahun }) + est, subHtml: esc(t("bl.s.ebtfosil")),
      isiHtml: `<div id="g-ebtfosil" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(t("bl.n.ebtfosil"))}</p>${src("s-irena-lcoe", "s-bpp")}` }),
    ex({ id: "modul", ikon: "tahun", topik: t("bl.ey.modul"), judulHtml: hlHtml("bl.t.modul", `${n1(m1.usd_per_w, 2)} USD/W`, { a: n1(m0.usd_per_w, 1), ta: m0.tahun, tb: m1.tahun }), subHtml: esc(t("bl.s.modul")), csv: true,
      isiHtml: `<div class="jm-tab" role="tablist" aria-label="${esc(t("bl.skala.label"))}">${[["log", "bl.skala.log"], ["lin", "bl.skala.lin"]].map(([k, c]) => `<button type="button" role="tab" data-skala="${k}" aria-selected="${(k === "log") === logModul}">${esc(t(c))}</button>`).join("")}</div><div id="g-modul" class="ih-bagan"></div><div id="tb-modul" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("bl.n.modul"))}</p>${src("s-irena-modul")}` }),
    ex({ id: "bpp", ikon: "tabel", topik: t("bl.ey.bpp"), judulHtml: hlHtml("bl.t.bpp", `Rp${num(b1.rp_kwh, 0)}`, { a: `Rp${num(b0.rp_kwh, 0)}`, ta: b0.tahun, tb: b1.tahun, p: num(persen(b0.rp_kwh, b1.rp_kwh), 1) }) + est, subHtml: esc(t("bl.s.bpp")), csv: true,
      isiHtml: `<div id="g-bpp" class="ih-bagan"></div>${tabTh}<div id="g-bpp2" class="ih-bagan ih-tabel"></div><div id="tb-bpp" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("bl.n.bpp"))}</p>${src("s-bpp")}` }),
    ex({ id: "celah", ikon: "info", topik: t("bl.ey.celah"), judulHtml: hlHtml("bl.t.celah", String(d.meta.celah.length)), subHtml: esc(t("bl.s.celah")),
      isiHtml: `<ul class="ih-lis">${d.meta.celah.map((_, i) => `<li>${esc(t("bl.celah." + (i + 1)))}</li>`).join("")}</ul>` }),
  ].join("");
  tabelTabel();
}

function tabelTabel() {
  const th0 = awal(dunia("surya")).tahun, s0 = (k) => dunia(k)[0];
  tabel($("tb-lcoe"), { satuan: "ih.u.tek", per: 10, urutAwal: 2, kolom: [
    { label: t("bl.c.tek"), v: (r) => nm(r.k), f: (r) => `<span class="ih-ti"><span class="${KLS[r.k]}">${ikon(IKT[r.k], 20)}</span><span>${esc(nm(r.k))}</span></span>` },
    { label: t("bl.c.lcoe", { tahun: th0 }), num: true, v: (r) => r.a.sen_usd_kwh, f: (r) => n1(r.a.sen_usd_kwh, 2) },
    { label: t("bl.c.lcoe", { tahun: akhir(dunia("surya")).tahun }), num: true, v: (r) => r.b.sen_usd_kwh, f: (r) => n1(r.b.sen_usd_kwh, 2) },
    { label: `${t("bl.c.ubah")} ${t("an.est")}`, num: true, v: (r) => persen(r.a.sen_usd_kwh, r.b.sen_usd_kwh), f: (r) => pilUbah(persen(r.a.sen_usd_kwh, r.b.sen_usd_kwh)) },
    { label: t("bl.c.tren"), v: (r) => r.b.sen_usd_kwh, f: (r) => { const v = dunia(r.k); return sparkSvg(v.map((x) => x.sen_usd_kwh), { kelas: KLS[r.k], tip: nm(r.k), th: tipHtml(nm(r.k), [[t("bl.tip.tren", { a: v[0].tahun, b: akhir(v).tahun, va: n1(v[0].sen_usd_kwh, 2), vb: n1(akhir(v).sen_usd_kwh, 2) }), ""]]) }); } },
  ], baris: TEK.map((k) => ({ k, a: s0(k), b: akhir(dunia(k)) })) });
  tbBanding();
  tabel($("tb-modul"), { satuan: "ih.u.tahun", per: 10, urutAwal: 0, kolom: [
    { label: t("bl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t("bl.c.usdw"), num: true, v: (r) => r.usd_per_w, f: (r) => n1(r.usd_per_w, 3) },
    { label: t("bl.c.yoy"), num: true, v: (r) => yoy(r), f: (r) => pilUbah(yoy(r)) },
    { label: t("bl.c.kali", { tahun: d.modul[0].tahun }), num: true, v: (r) => d.modul[0].usd_per_w / r.usd_per_w, f: (r) => `${n1(d.modul[0].usd_per_w / r.usd_per_w, 1)}x` },
  ], baris: d.modul });
  tbBpp();
}
const yoy = (r) => { const i = d.modul.indexOf(r); return i > 0 ? persen(d.modul[i - 1].usd_per_w, r.usd_per_w) : null; };
function tbBanding() {
  const negara = [...new Set(d.lcoe.filter((r) => r.iso3 !== "WLD" && r.teknologi === banding).map((r) => r.iso3))];
  const terakhir = (iso) => akhir(d.lcoe.filter((r) => r.iso3 === iso && r.teknologi === banding).sort((a, b) => a.tahun - b.tahun));
  const ada = negara.includes("IDN"), pb = ada ? terakhir("IDN") : dunia(banding).at(-1);
  tabel($("tb-banding"), { satuan: "ih.u.negara", per: 10, urutAwal: 1, menurun: false, kelasBaris: (r) => (r.iso3 === "IDN" ? "ih-baris-id" : ""), kolom: [
    { label: t("bl.c.negara"), v: (r) => nn(r), f: (r) => `<span class="ih-tn">${bendHtml(r.iso3)}<span>${esc(nn(r))}</span></span>` },
    { label: t("bl.c.sen"), num: true, v: (r) => r.sen_usd_kwh, f: (r) => n1(r.sen_usd_kwh, 2) },
    { label: t("bl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t(ada ? "bl.c.vsid" : "bl.c.vsdunia"), num: true, v: (r) => persen(pb.sen_usd_kwh, r.sen_usd_kwh), f: (r) => (r === pb ? '<span class="ih-kosong">-</span>' : pilUbah(persen(pb.sen_usd_kwh, r.sen_usd_kwh))) },
  ], baris: [dunia(banding).at(-1), ...negara.map(terakhir)] });
}
function tbBpp() {
  const th = d.bpp_nasional.map((b) => b.tahun), rp = (v) => (v == null ? '<span class="ih-kosong">-</span>' : uangHtml("Rp", num(v, 0)));
  const seri = (r) => th.map((y) => r.rp_kwh[y]);
  tabel($("tb-bpp"), { satuan: "ih.u.sistem", per: 10, urutAwal: th.length + 1, kolom: [
    { label: t("bl.c.sistem"), v: (r) => r.nama, f: (r) => `<span class="ih-tn">${lambHtml(r)}<span>${esc(r.nama)}</span></span>` },
    ...th.map((y) => ({ label: t("bl.c.bpp", { tahun: y }), num: true, v: (r) => r.rp_kwh[y] ?? null, f: (r) => rp(r.rp_kwh[y]) })),
    { label: `${t("bl.c.ubah")} ${t("an.est")}`, num: true, v: (r) => ubah(r, th), f: (r) => pilUbah(ubah(r, th)) },
    { label: t("bl.c.tren"), v: (r) => ubah(r, th), f: (r) => sparkSvg(seri(r), { kelas: "ih-id", tip: r.nama, th: bppTip(r, th) }) },
  ], baris: d.bpp_sistem });
}
const ubah = (r, th) => { const a = r.rp_kwh[th[0]], b = r.rp_kwh[th.at(-1)]; return a && b ? persen(a, b) : null; };
function bppTip(r, th, y = th.at(-1)) {
  const nas = d.bpp_nasional.find((b) => b.tahun === y).rp_kwh, v = r.rp_kwh[y], [sv, sc] = selisih(v, nas), u = ubah(r, th);
  return tipHtml(r.nama, [[t("bl.tip.bpp") + " " + y, `Rp${num(v, 0)}/kWh`], [t("bl.tip.vsbpp"), sv, sc], [t("bl.tip.ubah", { a: th[0], b: th.at(-1) }), u == null ? "-" : `${u > 0 ? "+" : ""}${n1(u, 0)}%`, u > 0 ? "ih-naik" : "ih-turun"]],
    { img: `/img/provinsi/${r.provinsi[0]}.png`, extra: sparkSvg(th.map((x) => r.rp_kwh[x]), { statis: true, kelas: "ih-id", w: 160, h: 36 }) });
}

function bagan() {
  const tip = (r, v, y) => `${nm(r)}, ${y}: ${n1(v, 2)} ${t("bl.sat")}`;
  $("g-lcoe").innerHTML = garisSvg({ el: $("g-lcoe"), satuan: t("bl.sat"), label: t("bl.s.lcoe"), seri: TEK.map((k) => ({ id: k, kelas: KLS[k], label: nm(k), titik: dunia(k).map((r) => ({ x: r.tahun, y: r.sen_usd_kwh, tip: tip(k, r.sen_usd_kwh, r.tahun) })) })) });
  gBanding();
  const b = d.bpp_nasional.at(-1);
  const akh = TEK.map((k) => akhir(dunia(k)));
  $("g-ebtfosil").innerHTML = kolomSvg({ el: $("g-ebtfosil"), satuan: t("bl.sat"), label: t("bl.s.ebtfosil"), seri: [{ k: "v", kelas: "ih-ebt" }], ref: { nilai: b.sen_usd_kwh, label: t("bl.ref", { tahun: b.tahun }) },
    kategori: akh.map((r) => ({ label: nm(r.teknologi), nilai: { v: r.sen_usd_kwh }, tip: tip(r.teknologi, r.sen_usd_kwh, r.tahun),
      th: tipHtml(nm(r.teknologi), [[t("bl.tip.lcoe"), `${n1(r.sen_usd_kwh, 2)} ${t("bl.sat")}`], [t("bl.tip.tahun"), String(r.tahun)], [t("bl.tip.vsbpp") + " " + b.tahun, ...selisih(r.sen_usd_kwh, b.sen_usd_kwh)]]) })) });
  gModul();
  $("g-bpp").innerHTML = kolomSvg({ el: $("g-bpp"), satuan: "Rp/kWh", label: t("bl.s.bpp"), seri: [{ k: "v", kelas: "ih-netral" }],
    kategori: d.bpp_nasional.map((r, i, a) => ({ label: String(r.tahun), nilai: { v: r.rp_kwh }, tip: t("bl.tip_bpp", { tahun: r.tahun, rp: num(r.rp_kwh, 1), sen: n1(r.sen_usd_kwh, 2), kepmen: r.kepmen }),
      th: tipHtml(String(r.tahun), [[t("bl.tip.bpp"), `Rp${num(r.rp_kwh, 1)}/kWh`], [t("bl.tip.sen"), `${n1(r.sen_usd_kwh, 2)} ${t("bl.sat")}`], [t("bl.tip.kepmen"), r.kepmen], ...(i ? [[t("bl.tip.ubah", { a: a[i - 1].tahun, b: r.tahun }), ...selisih(r.rp_kwh, a[i - 1].rp_kwh)]] : [])]) })) });
  gBpp();
}
function gModul() {
  const m = d.modul, m0 = m[0];
  $("g-modul").innerHTML = garisSvg({ el: $("g-modul"), satuan: "USD/W", label: t("bl.s.modul"), skalaLog: logModul, xTick: [1975, 1985, 1995, 2005, 2015, 2025], anot: [1975, 2010, 2020],
    ringkas: (x, y, p) => (x === m0.tahun ? "" : `${t("bl.tip.kali", { k: n1(m0.usd_per_w / y, 1), tahun: m0.tahun })}`),
    seri: [{ id: "m", kelas: "ih-s1", label: t("bl.modul"), titik: m.map((r) => ({ x: r.tahun, y: r.usd_per_w })) }] });
}
function gBpp() {
  const th = d.bpp_nasional.map((b) => b.tahun), y = thIni(), nas = d.bpp_nasional.find((b) => b.tahun === y).rp_kwh;
  const baris = [...d.bpp_sistem].filter((r) => r.rp_kwh[y]).sort((a, b) => b.rp_kwh[y] - a.rp_kwh[y]);
  $("g-bpp2").innerHTML = batangSvg({ el: $("g-bpp2"), d: 0, label: t("bl.s.bpp"), satuan: "Rp/kWh", ref: { nilai: nas, label: t("bl.ref", { tahun: y }) + ` (Rp${num(nas, 0)})` },
    seri: [{ k: "naik", kelas: "ih-naik" }, { k: "turun", kelas: "ih-turun" }],
    baris: baris.map((r) => ({ label: r.nama, logo: `/img/provinsi/${r.provinsi[0]}.png`, tip: `${r.nama}, ${y}: Rp${num(r.rp_kwh[y], 0)}/kWh`, th: bppTip(r, th, y), bagian: [{ k: r.rp_kwh[y] > nas ? "naik" : "turun", nilai: r.rp_kwh[y] }] })) });
}
function gBanding() {
  const negara = [...new Set(d.lcoe.filter((r) => r.teknologi === banding).map((r) => r.iso3))];
  const baris = negara.map((iso) => { const a = d.lcoe.filter((r) => r.iso3 === iso && r.teknologi === banding).sort((x, y) => x.tahun - y.tahun); return akhir(a); }).sort((a, b) => b.sen_usd_kwh - a.sen_usd_kwh);
  const idn = baris.find((r) => r.iso3 === "IDN"), w = dunia(banding).at(-1);
  $("g-banding").innerHTML = batangSvg({ el: $("g-banding"), d: 2, label: t("bl.s.banding"), satuan: t("bl.sat"), ref: { nilai: w.sen_usd_kwh, label: t("bl.ref.dunia", { tahun: w.tahun }) },
    seri: [{ k: "n", kelas: "ih-netral" }, { k: "i", kelas: "ih-id" }, { k: "w", kelas: "ih-lawan" }],
    baris: baris.map((r) => ({ label: nn(r), ...(r.iso3 === "WLD" || !ISO2[r.iso3] ? { ikon: "globe" } : { bendera: ISO2[r.iso3] }), sorot: r.iso3 === "IDN", tip: `${nn(r)}, ${r.tahun}: ${n1(r.sen_usd_kwh, 2)} ${t("bl.sat")}`,
      th: tipHtml(nn(r), [[t("bl.tip.lcoe"), `${n1(r.sen_usd_kwh, 2)} ${t("bl.sat")}`], [t("bl.tip.tahun"), String(r.tahun)], ...(idn && r !== idn ? [[t("bl.tip.vsid"), ...selisih(r.sen_usd_kwh, idn.sen_usd_kwh)]] : []), ...(r !== w ? [[t("bl.tip.vsdunia"), ...selisih(r.sen_usd_kwh, w.sen_usd_kwh)]] : [])], ISO2[r.iso3] ? { img: `/img/bendera/${ISO2[r.iso3]}.svg` } : {}),
      bagian: [{ k: r.iso3 === "IDN" ? "i" : r.iso3 === "WLD" ? "w" : "n", nilai: r.sen_usd_kwh }] })) });
}

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(3);
  try { d = await muatData("biaya_listrik.json"); } catch (e) { tampilGalat($("isi"), mulai); return; }
  const gambar = () => { ubin(); rangka(); bagan(); };
  gambar();
  saatBahasa(gambar);
  pasangPasar();
  $("isi").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tek],button[data-skala],button[data-bth]"); if (!b || b.getAttribute("aria-selected") === "true") return;
    for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b));
    if (b.dataset.tek) { banding = b.dataset.tek; nanti(() => { gBanding(); tbBanding(); }); }
    else if (b.dataset.skala) { logModul = b.dataset.skala === "log"; nanti(gModul); }
    else { thBpp = +b.dataset.bth; nanti(gBpp); }
  });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; bagan(); } }, 200));
}
mulai();
