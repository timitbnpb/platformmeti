/* /harga-komponen: pelacak harga komponen EBT (modul surya, baterai Li-ion, turbin angin, inverter) dan ekspor-impor komponen Indonesia (UN Comtrade, HS 6 digit).
   Data statis /data/harga_komponen.json dan /data/dagang_komponen.json. Informasi saja; dampak ke LCOE berlabel EST. */
import { nanti, esc, hantuHtml, debounce, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatData, tampilGalat, sumberLipat, ubinHtml, pil, num, saatBahasa } from "/analisis.js";
import { garisSvg, batangSvg, legendaHtml, tabel, n1, tipHtml, pilUbah, sparkSvg } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
const KOMP = ["surya", "baterai", "angin", "inverter"];
const IK = { surya: "tek-surya", baterai: "petir", angin: "tek-listrik", inverter: "pabrik" };
const KLS = { surya: "ih-s1", baterai: "ih-s6", angin: "ih-s2", inverter: "ih-s7" };
const SERI_TAB = { surya: ["modul", "tic-surya", "modul-eropa-2024"], baterai: ["pack", "sistem-baterai", "turnkey-2024"], angin: ["tic-bayu", "turbin-luar-tiongkok", "turbin-tiongkok"], inverter: [] };
const IK_D = { modul: "tek-surya", soft: "kajian", pasang: "proyek", inverter: "pabrik", rak: "rantai", bos: "tabel" };
const DESAIN = ["modul", "soft", "pasang", "inverter", "rak", "bos"];
let H = null, D = null, kh = "surya", logSkala = true, dk = "surya", alir = "impor", thNeg = null;
const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
const persen = (a, b) => ((b - a) / a) * 100;
const nilai = (v) => n1(v, v < 1 ? 3 : v < 10 ? 2 : 0);
const juta = (usd) => n1(usd / 1e6, usd < 1e5 ? 3 : usd < 1e7 ? 2 : usd < 1e8 ? 1 : 0);
const seriH = (id) => H.deret.find((s) => s.id === id);
const urut = (s) => [...s.titik].sort((a, b) => a.x - b.x);
const srcDari = (data, ids) => sumberLipat(ids.map((i) => { const s = data.sumber.find((x) => x.id === i); return { sumber: s.penerbit, halaman: s.judul, url: s.url, tahun: s.tahun, tanggal: data.dibangun_pada }; }));
const tingkat = (k) => pil("hk2.tb." + k, k === "resmi" ? "ok" : "warn");
const PEKAN = new Map();
function namaNegara(m) {
  const lang = document.documentElement.lang || "id";
  if (!PEKAN.has(lang)) { let dn = null; try { dn = new Intl.DisplayNames([lang], { type: "region" }); } catch { /* peramban lama */ } PEKAN.set(lang, dn); }
  const dn = PEKAN.get(lang); let n = null; try { n = dn?.of(m.iso2.toUpperCase()); } catch { /* kode tak dikenal */ }
  return n && n !== m.iso2.toUpperCase() ? n : m.nama;
}
const petaMitra = () => new Map(D.mitra.map((m) => [m.kode, m]));
const dagang = (k, alr) => D.tahunan.filter((r) => r.komponen === k && r.alir === alr).sort((a, b) => a.tahun - b.tahun);
const tahunDagang = () => [...new Set(D.tahunan.map((r) => r.tahun))].sort((a, b) => a - b);
const thAkhir = () => tahunDagang().at(-1);
const baris = (k, th) => ({ i: D.tahunan.find((r) => r.komponen === k && r.alir === "impor" && r.tahun === th), e: D.tahunan.find((r) => r.komponen === k && r.alir === "ekspor" && r.tahun === th) });
const neraca = (k, th) => { const { i, e } = baris(k, th); return (e?.usd || 0) - (i?.usd || 0); };
const bendHtml = (m) => `<img class="ih-fl" src="/img/bendera/${esc(m.iso2)}.svg" width="22" height="16" alt="" loading="lazy">`;
const kompHtml = (k) => `<span class="ih-ti"><span class="${KLS[k]}">${ikon(IK[k], 20)}</span><span>${esc(t("hk2.k." + k))}</span></span>`;
const tabK = (attr, aktif, label) => `<div class="jm-tab hk2-tab" role="tablist" aria-label="${esc(t(label))}">${KOMP.map((k) => `<button type="button" role="tab" data-${attr}="${k}" aria-selected="${k === aktif}">${ikon(IK[k], 16)}<span>${esc(t("hk2.k." + k))}</span></button>`).join("")}</div>`;

/* ---------- kepala ---------- */
function ubin() {
  const m = urut(seriH("modul")), m10 = m.find((p) => p.x === 2010), ma = m.at(-1), pk = urut(seriH("pack")).at(-1), th = thAkhir();
  const imp = KOMP.reduce((a, k) => a + (baris(k, th).i?.usd || 0), 0);
  $("hkJawab").textContent = t("hk2.lead");
  $("hkUbin").innerHTML = ubinHtml([
    { ikon: "tek-surya", nilai: num(Math.abs(persen(m10.y, ma.y)), 0), satuan: "%", label: t("hk2.u1", { a: m10.x, b: ma.x }), href: "#harga" },
    { ikon: "petir", nilai: nilai(pk.y), satuan: "USD/kWh", label: t("hk2.u2", { tahun: pk.x }), href: "#harga" },
    { ikon: "tabel", nilai: juta(imp), satuan: t("hk2.juta"), label: t("hk2.u3", { tahun: th }), href: "#neraca" },
  ]);
}

/* ---------- harga ---------- */
function kartuHarga(k) {
  if (k === "inverter") {
    const d = H.dampak.komponen.find((x) => x.k === "inverter");
    return `<ul class="hk2-kartu"><li class="hk2-k"><div class="hk2-k-h"><span class="${KLS.inverter}">${ikon(IK.inverter, 20)}</span><span>${esc(t("hk2.d.inverter"))}</span></div><div class="hk2-k-n">${n1(d.usd_kw, 0)}<small>USD/kW</small></div><div class="hk2-k-f">${esc(t("hk2.inv.kartu", { p: n1(d.bagian, 1), a: H.dampak.tahun_a, b: H.dampak.tahun_b }))}</div></li></ul><p class="jm-bantu ih-catatan">${esc(t("hk2.inv.n"))}</p>`;
  }
  return `<ul class="hk2-kartu">${SERI_TAB[k].map((id) => {
    const s = urut(seriH(id)), a = s.at(-1), prev = s.find((p) => p.x === a.x - 1), awal = s[0];
    const [p, ket] = s.length < 2 ? [null, t("hk2.k.tunggal")] : prev ? [persen(prev.y, a.y), t("hk2.yoy")] : [persen(awal.y, a.y), t("hk2.sejak", { x: awal.x })];
    return `<li class="hk2-k"><div class="hk2-k-h"><span class="${KLS[k]}">${ikon(IK[k], 20)}</span><span title="${esc(t("hk2.s." + id))}">${esc(t("hk2.s." + id))}</span></div><div class="hk2-k-n">${nilai(a.y)}<small>${esc(seriH(id).satuan)}</small></div><div class="hk2-k-f">${p == null ? "" : pilUbah(p)}<span>${esc(ket)}</span><span>${esc(t("hk2.k.tahun", { x: a.x }))}</span>${tingkat(a.tingkat_bukti)}</div></li>`;
  }).join("")}</ul>`;
}
function ringkasanSeri(id) {
  return (x, y) => { const s = urut(seriH(id)), i = s.findIndex((p) => p.x === x); return i > 0 ? t("hk2.tip.sejak", { x: s[0].x, p: `${persen(s[0].y, y) > 0 ? "+" : ""}${n1(persen(s[0].y, y), 0)}` }) : ""; };
}
function bodiHarga() {
  const k = kh, id = SERI_TAB[k].filter((x) => seriH(x).titik.length >= 2);
  const logTab = id.some((x) => { const v = seriH(x).titik.map((p) => p.y); return Math.max(...v) / Math.min(...v) >= 10; });
  const tombolLog = logTab ? `<div class="jm-tab hk2-tab" role="tablist" aria-label="${esc(t("bl.skala.label"))}">${[["log", "bl.skala.log"], ["lin", "bl.skala.lin"]].map(([a, c]) => `<button type="button" role="tab" data-skala="${a}" aria-selected="${(a === "log") === logSkala}">${esc(t(c))}</button>`).join("")}</div>` : "";
  $("hk-isi").innerHTML = `${kartuHarga(k)}${tombolLog}${id.map((x) => `<h3 class="hk2-sub">${esc(t("hk2.s." + x))}</h3><p class="jm-bantu">${esc(t("hk2.b." + x))}</p><div id="g-${x}" class="ih-bagan hk2-bagan"></div>`).join("")}${id.length ? `<div id="tb-harga" class="ih-tabel hk2-tabel"></div>` : ""}`;
  gambarGaris(id);
  if (id.length) tbHarga(id);
}
function gambarGaris(id) {
  for (const x of id) {
    const s = urut(seriH(x)), v = s.map((p) => p.y), ket = ringkasanSeri(x), el = $("g-" + x);
    el.innerHTML = garisSvg({ el, satuan: seriH(x).satuan, label: t("hk2.s." + x), skalaLog: logSkala && Math.max(...v) / Math.min(...v) >= 10, anot: [s[0].x, s.at(-1).x], ringkas: ket,
      xTick: s.length > 6 ? undefined : s.map((p) => p.x), seri: [{ id: x, kelas: KLS[seriH(x).komponen], label: t("hk2.s." + x), titik: s.map((p) => ({ x: p.x, y: p.y })) }] });
  }
}
function tbHarga(id) {
  const rows = id.flatMap((x) => { const s = urut(seriH(x)); return s.map((p, i) => ({ id: x, p, prev: s.find((q) => q.x === p.x - 1) || null, kom: seriH(x).komponen, sat: seriH(x).satuan, n: i })); });
  tabel($("tb-harga"), { satuan: "ih.u.tahun", per: 10, urutAwal: 1, kolom: [
    { label: t("hk2.c.seri"), v: (r) => t("hk2.s." + r.id), f: (r) => `<span class="ih-ti"><span class="${KLS[r.kom]}">${ikon(IK[r.kom], 20)}</span><span>${esc(t("hk2.s." + r.id))}</span></span>` },
    { label: t("hk2.c.tahun"), num: true, v: (r) => r.p.x, f: (r) => String(r.p.x) },
    { label: t("hk2.c.nilai"), num: true, v: (r) => r.p.y, f: (r) => `${nilai(r.p.y)} ${esc(r.sat)}` },
    { label: t("bl.c.yoy"), num: true, v: (r) => (r.prev ? persen(r.prev.y, r.p.y) : null), f: (r) => (r.prev ? pilUbah(persen(r.prev.y, r.p.y)) : '<span class="ih-kosong">-</span>') },
    { label: t("hk2.c.bukti"), v: (r) => r.p.tingkat_bukti, f: (r) => tingkat(r.p.tingkat_bukti) },
  ], baris: rows });
}

/* ---------- dampak ke LCOE ---------- */
function dampak() {
  const d = H.dampak, mod = d.komponen.find((c) => c.k === "modul"), est = " " + pil("an.est");
  return ex({ id: "dampak", ikon: "analisis", topik: t("hk2.ey.dampak"), judulHtml: hlHtml("hk2.t.dampak", `${n1(mod.bagian, 0)}%`, { a: d.tahun_a, b: d.tahun_b, p: n1(Math.abs(persen(d.tic_a, d.tic_b)), 0) }) + est, subHtml: esc(t("hk2.s.dampak", { l0: n1(d.lcoe_a, 1), l1: n1(d.lcoe_b, 1) })), csv: false,
    isiHtml: `<div id="g-dampak" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(t("hk2.n.dampak"))}</p>${srcDari(H, [d.sumber_id])}` });
}
function gDampak() {
  const d = H.dampak, el = $("g-dampak");
  el.innerHTML = batangSvg({ el, d: 0, label: t("hk2.s.dampak", { l0: n1(d.lcoe_a, 1), l1: n1(d.lcoe_b, 1) }), satuan: t("hk2.d.sat"),
    seri: [{ k: "n", kelas: "ih-netral" }, { k: "m", kelas: "ih-s1" }],
    baris: DESAIN.map((k) => { const c = d.komponen.find((x) => x.k === k); return { label: t("hk2.d." + k), ikon: IK_D[k], kelasIkon: k === "modul" ? "ih-s1" : "", tip: `${t("hk2.d." + k)}: ${n1(c.usd_kw, 0)} USD/kW`,
      th: tipHtml(t("hk2.d." + k), [[t("hk2.d.usd"), `${n1(c.usd_kw, 0)} USD/kW`], [t("hk2.d.bagian"), `${n1(c.bagian, 1)}%`], [t("hk2.d.lcoe"), `${n1(c.lcoe_sen, 2)} ${t("bl.sat")} ${t("an.est")}`]]),
      bagian: [{ k: k === "modul" ? "m" : "n", nilai: c.usd_kw }] }; }) });
}

/* ---------- ekspor-impor ---------- */
function kartuDagang(k, th) {
  const { i, e } = baris(k, th), pi = baris(k, th - 1), net = neraca(k, th);
  const pc = (a, b) => (a != null && b ? pilUbah(persen(b, a)) : "");
  const kar = (kunci, v, yoy, kls) => `<li class="hk2-k"><div class="hk2-k-h"><span class="${kls}">${ikon(IK[k], 20)}</span><span>${esc(t(kunci))}</span></div><div class="hk2-k-n">${v}<small>${esc(t("hk2.juta"))}</small></div><div class="hk2-k-f">${yoy}<span>${esc(t("hk2.yoy"))}</span><span>${esc(t("hk2.k.tahun", { x: th }))}</span></div></li>`;
  return `<ul class="hk2-kartu">${kar("hk2.imp", juta(i?.usd || 0), pc(i?.usd, pi.i?.usd), "ih-s2")}${kar("hk2.eks", juta(e?.usd || 0), pc(e?.usd, pi.e?.usd), "ih-s3")}${kar("hk2.neraca", `${net > 0 ? "+" : net < 0 ? "-" : ""}${juta(Math.abs(net))}`, "", net < 0 ? "ih-naik" : "ih-turun")}</ul>`;
}
function bodiTren() {
  const k = dk, th = thAkhir(), im = dagang(k, "impor"), ek = dagang(k, "ekspor"), semua = tahunDagang();
  $("dk-tren").innerHTML = `${kartuDagang(k, th)}<h3 class="hk2-sub">${esc(t("hk2.tren.j", { k: t("hk2.k." + k) }))}</h3>${legendaHtml([{ kelas: "ih-s2", label: t("hk2.imp") }, { kelas: "ih-s3", label: t("hk2.eks") }])}<div id="g-dagang" class="ih-bagan hk2-bagan"></div>${k === "surya" ? `<p class="jm-bantu ih-catatan">${esc(t("hk2.n.surya"))}</p>` : ""}<div id="tb-dagang" class="ih-tabel hk2-tabel"></div>`;
  const el = $("g-dagang"), titik = (a) => a.map((r) => ({ x: r.tahun, y: Math.round(r.usd / 1e4) / 100 }));
  el.innerHTML = garisSvg({ el, satuan: t("hk2.juta"), label: t("hk2.tren.j", { k: t("hk2.k." + k) }), xTick: semua.filter((_, i) => i % 3 === 0 || i === semua.length - 1),
    seri: [{ id: "imp", kelas: "ih-s2", label: t("hk2.imp"), titik: titik(im) }, { id: "eks", kelas: "ih-s3", label: t("hk2.eks"), titik: titik(ek) }] });
  tabel($("tb-dagang"), { satuan: "ih.u.tahun", per: 10, urutAwal: 0, kolom: [
    { label: t("hk2.c.tahun"), num: true, v: (r) => r.th, f: (r) => String(r.th) },
    { label: t("hk2.c.hs"), v: (r) => r.hs, f: (r) => esc(r.hs.replace(/^(\d{4})(\d{2})$/, "$1.$2")) },
    { label: t("hk2.imp") + " (" + t("hk2.juta") + ")", num: true, v: (r) => r.i, f: (r) => juta(r.i) },
    { label: t("hk2.eks") + " (" + t("hk2.juta") + ")", num: true, v: (r) => r.e, f: (r) => juta(r.e) },
    { label: t("hk2.neraca"), num: true, v: (r) => r.n, f: (r) => `<span class="ih-ub ${r.n < 0 ? "ih-naik" : "ih-turun"}">${r.n < 0 ? "-" : "+"}${juta(Math.abs(r.n))}</span>` },
    { label: t("hk2.c.kg"), num: true, v: (r) => r.kg, f: (r) => (r.kg ? num(r.kg / 1000, 0) : '<span class="ih-kosong">-</span>') },
  ], baris: semua.map((y) => ({ th: y, hs: (baris(k, y).i || baris(k, y).e)?.hs || "", i: baris(k, y).i?.usd || 0, e: baris(k, y).e?.usd || 0, n: neraca(k, y), kg: baris(k, y).i?.kg || 0 })) });
}
function bodiNegara() {
  const k = dk, th = thNeg ?? thAkhir(), r = D.tahunan.find((x) => x.komponen === k && x.alir === alir && x.tahun === th), pm = petaMitra();
  const tabTh = `<div class="jm-tab hk2-tab" role="tablist" aria-label="${esc(t("hk2.pilih_th"))}">${tahunDagang().map((y) => `<button type="button" role="tab" data-nth="${y}" aria-selected="${y === th}">${y}</button>`).join("")}</div>`;
  const tabAlir = `<div class="jm-tab hk2-tab" role="tablist" aria-label="${esc(t("hk2.alir"))}">${["impor", "ekspor"].map((a) => `<button type="button" role="tab" data-alir="${a}" aria-selected="${a === alir}">${esc(t(a === "impor" ? "hk2.asal" : "hk2.tujuan"))}</button>`).join("")}</div>`;
  if (!r || !r.mitra.length) { $("dk-neg").innerHTML = `${tabAlir}${tabTh}<p class="jm-bantu">${esc(t("hk2.kosong"))}</p>`; return; }
  $("dk-neg").innerHTML = `${tabAlir}${tabTh}<h3 class="hk2-sub">${esc(t(alir === "impor" ? "hk2.neg.asal" : "hk2.neg.tujuan", { k: t("hk2.k." + k), th, hs: r.hs.replace(/^(\d{4})(\d{2})$/, "$1.$2") }))}</h3><div id="g-neg" class="ih-bagan hk2-bagan"></div><div id="tb-neg" class="ih-tabel hk2-tabel"></div>`;
  const tot = r.usd, el = $("g-neg"), top = r.mitra.slice(0, 10);
  el.innerHTML = batangSvg({ el, d: 2, satuan: t("hk2.juta"), label: t("hk2.neg.j"),
    seri: [{ k: "n", kelas: KLS[k] }],
    baris: top.map((m) => { const mt = pm.get(m.kode), nm = namaNegara(mt); return { label: nm, bendera: mt.iso2, tip: `${nm}: ${juta(m.usd)} ${t("hk2.juta")}`,
      th: tipHtml(nm, [[t(alir === "impor" ? "hk2.imp" : "hk2.eks"), `${juta(m.usd)} ${t("hk2.juta")}`], [t("hk2.c.pangsa"), `${n1((m.usd / tot) * 100, 1)}%`], [t("hk2.c.kg"), m.kg ? num(m.kg / 1000, 0) : "-"], [t("hk2.c.tahun"), String(th)]], { img: `/img/bendera/${mt.iso2}.svg` }),
      bagian: [{ k: "n", nilai: m.usd / 1e6 }] }; }) });
  tabel($("tb-neg"), { satuan: "ih.u.negara", per: 10, urutAwal: 1, kolom: [
    { label: t("bl.c.negara"), v: (m) => namaNegara(pm.get(m.kode)), f: (m) => `<span class="ih-tn">${bendHtml(pm.get(m.kode))}<span>${esc(namaNegara(pm.get(m.kode)))}</span></span>` },
    { label: t(alir === "impor" ? "hk2.imp" : "hk2.eks") + " (" + t("hk2.juta") + ")", num: true, v: (m) => m.usd, f: (m) => juta(m.usd) },
    { label: t("hk2.c.pangsa"), num: true, v: (m) => m.usd, f: (m) => `${n1((m.usd / tot) * 100, 1)}%` },
    { label: t("hk2.c.kg"), num: true, v: (m) => m.kg, f: (m) => (m.kg ? num(m.kg / 1000, 0) : '<span class="ih-kosong">-</span>') },
    { label: t("hk2.c.usdkg"), num: true, v: (m) => (m.kg ? m.usd / m.kg : null), f: (m) => (m.kg ? n1(m.usd / m.kg, 2) : '<span class="ih-kosong">-</span>') },
  ], baris: r.mitra });
}
function tbNeraca() {
  const th = thAkhir();
  tabel($("tb-neraca"), { satuan: "hk2.u.komponen", per: 10, urutAwal: 4, kolom: [
    { label: t("hk2.c.komp"), v: (r) => t("hk2.k." + r.k), f: (r) => kompHtml(r.k) },
    { label: t("hk2.c.hs"), v: (r) => r.hs, f: (r) => esc(r.hs.replace(/^(\d{4})(\d{2})$/, "$1.$2")) },
    { label: t("hk2.imp") + " (" + t("hk2.juta") + ")", num: true, v: (r) => r.i, f: (r) => juta(r.i) },
    { label: t("hk2.eks") + " (" + t("hk2.juta") + ")", num: true, v: (r) => r.e, f: (r) => juta(r.e) },
    { label: t("hk2.neraca"), num: true, v: (r) => r.n, f: (r) => `<span class="ih-ub ${r.n < 0 ? "ih-naik" : "ih-turun"}">${r.n < 0 ? "-" : "+"}${juta(Math.abs(r.n))}</span>` },
    { label: t("bl.c.tren"), v: (r) => r.i, f: (r) => sparkSvg(r.seri, { kelas: KLS[r.k], tip: t("hk2.k." + r.k), th: tipHtml(t("hk2.k." + r.k), [[t("hk2.imp") + " " + r.th0 + "-" + th, `${juta(r.seri[0])} - ${juta(r.seri.at(-1))} ${t("hk2.juta")}`]]) }) },
  ], baris: KOMP.map((k) => { const b = baris(k, th), s = dagang(k, "impor").map((x) => x.usd); return { k, hs: (b.i || b.e)?.hs || "", i: b.i?.usd || 0, e: b.e?.usd || 0, n: neraca(k, th), seri: s, th0: dagang(k, "impor")[0]?.tahun }; }) });
}

function rangka() {
  const th = thAkhir(), imp = KOMP.reduce((a, k) => a + (baris(k, th).i?.usd || 0), 0), eks = KOMP.reduce((a, k) => a + (baris(k, th).e?.usd || 0), 0);
  const m = urut(seriH("modul")), m10 = m.find((p) => p.x === 2010), ma = m.at(-1);
  $("hkIsi").innerHTML = [
    ex({ id: "harga", ikon: "tag", topik: t("hk2.ey.harga"), judulHtml: hlHtml("hk2.t.harga", `${num(Math.abs(persen(m10.y, ma.y)), 0)}%`, { a: m10.x, b: ma.x }), subHtml: esc(t("hk2.s.harga")), csv: true,
      isiHtml: `${tabK("hk", kh, "hk2.pilih")}<div id="hk-isi"></div><p class="jm-bantu ih-catatan">${esc(t("hk2.n.harga"))}</p>${srcDari(H, H.sumber.map((s) => s.id))}` }),
    dampak(),
    ex({ id: "neraca", ikon: "tabel", topik: t("hk2.ey.neraca"), judulHtml: hlHtml("hk2.t.neraca", `${juta(imp)} ${t("hk2.juta")}`, { tahun: th, e: juta(eks) }), subHtml: esc(t("hk2.s.neraca")), csv: true,
      isiHtml: `<div id="tb-neraca" class="ih-tabel hk2-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("hk2.n.neraca"))}</p>${srcDari(D, D.sumber.map((s) => s.id))}` }),
    ex({ id: "dagang", ikon: "grafik", topik: t("hk2.ey.dagang"), judulHtml: hlHtml("hk2.t.dagang", t("hk2.k." + dk)), subHtml: esc(t("hk2.s.dagang")), csv: true,
      isiHtml: `${tabK("dk", dk, "hk2.pilih")}<div id="dk-tren"></div>${srcDari(D, D.sumber.map((s) => s.id))}` }),
    ex({ id: "negara", ikon: "globe", topik: t("hk2.ey.negara"), judulHtml: hlHtml("hk2.t.negara", t("hk2.k." + dk)), subHtml: esc(t("hk2.s.negara")), csv: true,
      isiHtml: `${tabK("dk", dk, "hk2.pilih")}<div id="dk-neg"></div>${srcDari(D, D.sumber.map((s) => s.id))}` }),
    ex({ id: "celah", ikon: "info", topik: t("hk2.ey.celah"), judulHtml: hlHtml("hk2.t.celah", String(H.meta.celah.length + D.meta.celah.length)), subHtml: esc(t("hk2.s.celah")),
      isiHtml: `<ul class="ih-lis">${H.meta.celah.map((_, i) => `<li>${esc(t("hk2.celah." + (i + 1)))}</li>`).join("")}${D.meta.celah.map((_, i) => `<li>${esc(t("hk2.dcelah." + (i + 1)))}</li>`).join("")}</ul>` }),
  ].join("");
  bodiHarga(); gDampak(); tbNeraca(); bodiTren(); bodiNegara();
}

async function mulai() {
  $("hkIsi").innerHTML = hantuHtml(3);
  try { [H, D] = await Promise.all([muatData("harga_komponen.json"), muatData("dagang_komponen.json")]); } catch { tampilGalat($("hkIsi"), mulai); return; }
  const gambar = () => { ubin(); rangka(); };
  gambar();
  saatBahasa(gambar);
  $("hkIsi").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-hk],button[data-dk],button[data-skala],button[data-alir],button[data-nth]"); if (!b || b.getAttribute("aria-selected") === "true") return;
    if (b.dataset.dk) for (const x of $("hkIsi").querySelectorAll("button[data-dk]")) x.setAttribute("aria-selected", String(x.dataset.dk === b.dataset.dk));
    else for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b));
    if (b.dataset.hk) { kh = b.dataset.hk; nanti(bodiHarga); }
    else if (b.dataset.skala) { logSkala = b.dataset.skala === "log"; nanti(() => gambarGaris(SERI_TAB[kh].filter((x) => seriH(x).titik.length >= 2))); }
    else if (b.dataset.dk) { dk = b.dataset.dk; nanti(() => { bodiTren(); bodiNegara(); }); }
    else if (b.dataset.alir) { alir = b.dataset.alir; nanti(bodiNegara); }
    else { thNeg = +b.dataset.nth; nanti(bodiNegara); }
  });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; gambarGaris(SERI_TAB[kh].filter((x) => seriH(x).titik.length >= 2)); gDampak(); bodiTren(); bodiNegara(); } }, 200));
}
await mulai();
