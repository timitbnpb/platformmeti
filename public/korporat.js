/* /korporat: komitmen iklim korporat (SBTi, RE100, net zero) dan kontrak EBT korporat di Indonesia. Data statis /data/korporat.json (scripts/panen/korporat_bangun.mjs). */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { logoOrg } from "/inti/logo_org.js";
import { pilTek } from "/inti/ikon_tek.js";
import { muatData, tampilGalat, sumberLipat, ubinHtml, pil, num, saatBahasa } from "/analisis.js";
import { kolomSvg, batangSvg, legendaHtml, tabel, n1, tipHtml } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
let d = null, stat = "semua", tabTh = "pendek";
const STATUS = ["disetujui", "komitmen", "dicabut"], IK_ST = { disetujui: "centang", komitmen: "jam", dicabut: "silang" };
const SEK = { "Food Production": "pangan", "Telecommunication Services": "telko", "Forest and Paper Products": "hutan", Chemicals: "kimia", "Containers and Packaging": "kemasan", "Textiles, Apparel, Footwear and Luxury Goods": "tekstil", "Professional Services": "jasa", "Software and Services": "perangkat", "Technology Hardware and Equipment": "teknologi", "Banks, Diverse Financials, Insurance": "keuangan", "Real Estate": "properti", "Construction Materials": "konstruksi", Mining: "tambang", "Food and Beverage Processing": "olahan", "Trading Companies and Distributors, and Commercial Services and Supplies": "dagang", "Hotels, Restaurants and Leisure, and Tourism Services": "wisata", Retailing: "ritel" };
const sek = (s) => (s ? (SEK[s] ? t("kr2.sek." + SEK[s]) : s) : "");
const TEK_KLS = { surya: "ih-s1", bayu: "ih-s2", hidro: "ih-s3", "panas-bumi": "ih-s4", bioenergi: "ih-s5" };
const SKEMA = { ppa: "petir", "sewa-operasi": "tabel", "plts-atap": "tek-surya", captive: "gedung", rec: "tag" };
const sumberDari = (ids) => sumberLipat(ids.map((i) => { const s = d.sumber.find((x) => x.id === i); return { sumber: s.penerbit, halaman: s.judul, url: s.url, tanggal: d.dibangun_pada }; }));
const bendera = (iso) => (iso ? `<img class="ih-fl" src="/img/bendera/${esc(iso.toLowerCase())}.svg" width="22" height="16" alt="" loading="lazy">` : "");
const inisial = (n) => ([...String(n).replace(/^(PT|CV)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => [...w][0] || "")].join("") || "?").toUpperCase();
const warna = (n) => 1 + [...String(n)].reduce((h, c) => h + c.charCodeAt(0), 0) % 5;
const mono = (nama, logo) => `<span class="jm-tk-lg jm-tk-mono jm-w${warna(nama)}" aria-hidden="true">${esc(inisial(nama))}${logo ? `<img class="jm-tk-img" src="${esc(logo)}" alt="" width="40" height="40" loading="lazy" decoding="async" data-galat="hapus">` : ""}</span>`;
const pilSt = (k) => `<span class="jm-pil-st kr-st-${k}">${ikon(IK_ST[k], 14).replace('class="jm-ik"', 'class="jm-ik jm-ikt-s"')}<span>${esc(t("kr2.st." + k))}</span></span>`;
const pilRe = (r) => `<span class="jm-pil-st kr-re">${ikon("petir", 14).replace('class="jm-ik"', 'class="jm-ik jm-ikt-s"')}<span>${esc(t("kr2.re.anggota"))}${r.tahun_target ? ", " + r.tahun_target : ""}</span></span>`;
const pilSk = (k) => `<span class="jm-pil-st kr-sk-${k}">${ikon(SKEMA[k], 14).replace('class="jm-ik"', 'class="jm-ik jm-ikt-s"')}<span>${esc(t("kr2.sk." + k))}</span></span>`;
const kosong = '<span class="ih-kosong">-</span>';
const sbtiOk = (p) => p.sbti && p.sbti.status === "disetujui";
const totalMw = () => d.ppa.reduce((s, x) => s + (x.mw || 0), 0);
const stRank = (k) => (k ? STATUS.indexOf(k) : 9);

function ubin() {
  const sb = d.perusahaan.filter(sbtiOk).length, re = d.perusahaan.filter((p) => p.re100).length;
  $("jawab").textContent = t("kr2.lead", { n: d.perusahaan.length, mw: num(totalMw(), 0) });
  $("ubin").innerHTML = ubinHtml([
    { ikon: "pabrik", nilai: num(d.perusahaan.length), label: t("kr2.u1"), href: "#tabel" },
    { ikon: "centang", nilai: num(sb), label: t("kr2.u2", { re }), href: "#tabel" },
    { ikon: "petir", nilai: num(totalMw(), 0), satuan: "MW", label: t("kr2.u3", { n: d.ppa.length }), href: "#ppa" },
  ]);
}

function rangka() {
  const est = " " + pil("an.est"), ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const sb = d.perusahaan.filter(sbtiOk).length, dicabut = d.perusahaan.filter((p) => p.sbti?.status === "dicabut").length;
  const cnt = new Map(); for (const p of d.perusahaan) if (p.sbti?.tahun_sasaran) cnt.set(p.sbti.tahun_sasaran, (cnt.get(p.sbti.tahun_sasaran) || 0) + 1);
  const [modus, nModus] = [...cnt].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] || [0, 0];
  const tabSt = `<div class="jm-tab" role="tablist" aria-label="${esc(t("kr2.pilih_st"))}">${["semua", ...STATUS].map((k) => `<button type="button" role="tab" data-st="${k}" aria-selected="${k === stat}">${esc(t("kr2.tab.st." + k))}</button>`).join("")}</div>`;
  const tabTahun = `<div class="jm-tab" role="tablist" aria-label="${esc(t("kr2.pilih_th"))}">${["pendek", "nz", "re"].map((k) => `<button type="button" role="tab" data-th="${k}" aria-selected="${k === tabTh}">${esc(t("kr2.tab.th." + k))}</button>`).join("")}</div>`;
  const agr = d.agregat.map((a) => `<li><span class="jm-kpi-ik">${ikon(a.id.startsWith("rec") ? "tag" : "tek-surya", 18)}</span><div><b>${esc(num(a.nilai, a.nilai < 100 ? 2 : 0))} ${esc(a.satuan)}</b><span>${esc(t("kr2.agr." + a.id))}</span>${sumberLipat([{ sumber: a.sumber.penerbit, halaman: a.sumber.judul, url: a.sumber.url, tanggal: a.tanggal }])}</div></li>`).join("");
  $("isi").innerHTML = [
    ex({ id: "sektor", ikon: "analisis", topik: t("kr2.ey.sektor"), judulHtml: hlHtml("kr2.t.sektor", `${sb} ${t("kr2.dari")} ${d.perusahaan.length}`, { dicabut }) + est, subHtml: esc(t("kr2.s.sektor")),
      isiHtml: `${legendaHtml(STATUS.map((k) => ({ kelas: "kr-b-" + k, label: t("kr2.st." + k) })))}<div id="g-sektor" class="ih-bagan"></div>${sumberDari(["s-sbti", "s-re100"])}` }),
    ex({ id: "tahun", ikon: "tahun", topik: t("kr2.ey.tahun"), judulHtml: hlHtml("kr2.t.tahun", String(modus), { n: nModus }) + est, subHtml: esc(t("kr2.s.tahun")),
      isiHtml: `${tabTahun}<div id="g-tahun" class="ih-bagan"></div>${sumberDari(["s-sbti", "s-re100"])}` }),
    ex({ id: "tabel", ikon: "tabel", topik: t("kr2.ey.tabel"), judulHtml: hlHtml("kr2.t.tabel", String(d.perusahaan.length), { k: d.meta.kantor_pusat, b: d.meta.beroperasi }), subHtml: esc(t("kr2.s.tabel")), csv: true,
      isiHtml: `${tabSt}<div id="tb-p" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("kr2.n.tabel"))}</p>${sumberDari(["s-sbti", "s-re100"])}` }),
    ex({ id: "ppa", ikon: "petir", topik: t("kr2.ey.ppa"), judulHtml: hlHtml("kr2.t.ppa", `${num(totalMw(), 0)} MW`, { n: d.ppa.length }), subHtml: esc(t("kr2.s.ppa")), csv: true,
      isiHtml: `<div id="g-ppa" class="ih-bagan"></div><div id="tb-ppa" class="ih-tabel"></div><ul class="kr-agr">${agr}</ul><p class="jm-bantu ih-catatan">${esc(t("kr2.n.ppa"))}</p>` }),
    ex({ id: "celah", ikon: "info", topik: t("kr2.ey.celah"), judulHtml: hlHtml("kr2.t.celah", String(d.meta.celah.length)), subHtml: esc(t("kr2.s.celah")),
      isiHtml: `<ul class="ih-lis">${d.meta.celah.map((_, i) => `<li>${esc(t("kr2.celah." + (i + 1)))}</li>`).join("")}</ul>` }),
  ].join("");
  tbPerusahaan(); tbPpa();
}

const namaSel = (p) => `<span class="ih-tn kr-nm">${mono(p.nama, p.logo)}<span><b>${esc(p.nama)}</b>${p.kelompok === "beroperasi" ? `<small>${bendera(p.negara)}${esc(t("kr2.asing"))}</small>` : `<small>${bendera("ID")}${esc(t("kr2.kantor"))}</small>`}</span></span>`;
function tbPerusahaan() {
  const baris = d.perusahaan.filter((p) => stat === "semua" || p.sbti?.status === stat);
  const th = (v) => (v ? ` <small class="kr-th">${v}</small>` : "");
  tabel($("tb-p"), { satuan: "kr2.u.perusahaan", per: 10, urutAwal: 0, menurun: false, kolom: [
    { label: t("kr2.c.nama"), v: (p) => p.nama, f: namaSel },
    { label: t("kr2.c.sektor"), v: (p) => sek(p.sektor_grup), f: (p) => esc(sek(p.sektor_grup)) || kosong },
    { label: t("kr2.c.sbti"), v: (p) => stRank(p.sbti?.status), f: (p) => (p.sbti?.status ? pilSt(p.sbti.status) + th(p.sbti.tahun_sasaran) : kosong) },
    { label: t("kr2.c.nz"), v: (p) => stRank(p.sbti?.net_zero), f: (p) => (p.sbti?.net_zero ? pilSt(p.sbti.net_zero) + th(p.sbti.tahun_net_zero) : kosong) },
    { label: t("kr2.c.re"), v: (p) => p.re100?.tahun_target ?? 9999, num: true, f: (p) => (p.re100 ? pilRe(p.re100) : kosong) },
  ], baris });
}
const mwTeks = (x) => (x.mw != null ? `<b>${num(x.mw, x.mw < 1 ? 2 : 1)}</b> MW` : x.mwh != null ? `<b>${num(x.mwh)}</b> MWh` : kosong);
const pemasokSel = (x) => (x.pemasok ? `<span class="ih-tn">${mono(x.pemasok, x.pemasok_org_id ? logoOrg(x.pemasok_org_id, x.pemasok)[0] : "")}<span>${esc(x.pemasok)}</span></span>` : kosong);
function tbPpa() {
  tabel($("tb-ppa"), { satuan: "kr2.u.ppa", per: 10, urutAwal: 3, kolom: [
    { label: t("kr2.c.pembeli"), v: (x) => x.pembeli, f: (x) => `<span class="ih-tn kr-nm">${mono(x.pembeli, "")}<span><b>${esc(x.pembeli)}</b>${x.lokasi ? `<small>${esc(x.lokasi)}</small>` : ""}</span></span>` },
    { label: t("kr2.c.pemasok"), v: (x) => x.pemasok || "", f: pemasokSel },
    { label: t("kr2.c.skema"), v: (x) => x.skema, f: (x) => pilSk(x.skema) },
    { label: t("kr2.c.kap"), num: true, v: (x) => x.mw ?? (x.mwh != null ? x.mwh / 8760 : null), f: mwTeks },
    { label: t("kr2.c.tek"), v: (x) => x.teknologi || "", f: (x) => (x.teknologi ? pilTek(x.teknologi) : kosong) },
    { label: t("kr2.c.tahun"), num: true, v: (x) => x.tahun, f: (x) => (x.tahun ? String(x.tahun) : kosong) },
    { label: t("kr2.c.sumber"), v: (x) => x.sumber.penerbit, f: (x) => `<a class="ih-tautan kr-src" href="${esc(x.sumber.url)}" target="_blank" rel="noopener noreferrer" title="${esc(x.sumber.judul)}">${esc(x.sumber.penerbit)}</a>` },
  ], baris: d.ppa });
}

function bagan() {
  const grup = new Map();
  for (const p of d.perusahaan) { const g = p.sektor_grup || "-"; const o = grup.get(g) || { disetujui: 0, komitmen: 0, dicabut: 0, nama: [] }; if (p.sbti?.status) o[p.sbti.status]++; o.nama.push(p.nama); grup.set(g, o); }
  const baris = [...grup].filter(([, o]) => o.disetujui + o.komitmen + o.dicabut).sort((a, b) => (b[1].disetujui + b[1].komitmen + b[1].dicabut) - (a[1].disetujui + a[1].komitmen + a[1].dicabut));
  const rata = d.perusahaan.filter(sbtiOk).length / d.perusahaan.length * 100;
  $("g-sektor").innerHTML = batangSvg({ el: $("g-sektor"), d: 0, label: t("kr2.s.sektor"), satuan: t("kr2.u.perusahaan"), seri: STATUS.map((k) => ({ k, kelas: "kr-b-" + k })),
    baris: baris.map(([g, o]) => { const tot = o.disetujui + o.komitmen + o.dicabut; return { label: sek(g), ikon: "pabrik", tip: `${sek(g)}: ${tot}`,
      th: tipHtml(sek(g), [...STATUS.map((k) => [t("kr2.st." + k), String(o[k]), k === "dicabut" ? "ih-naik" : k === "disetujui" ? "ih-turun" : ""]), [t("kr2.tip.pangsa"), `${n1(o.disetujui / tot * 100, 0)}% (${t("kr2.tip.rata")} ${n1(rata, 0)}%)`]], { extra: `<span class="ih-tr"><em>${esc(o.nama.slice(0, 4).join(", "))}${o.nama.length > 4 ? ` +${o.nama.length - 4}` : ""}</em></span>` }),
      bagian: STATUS.map((k) => ({ k, nilai: o[k] })) }; }) });
  gTahun();
  const ppa = d.ppa.filter((x) => x.mw != null).sort((a, b) => b.mw - a.mw);
  $("g-ppa").innerHTML = batangSvg({ el: $("g-ppa"), d: 1, label: t("kr2.s.ppa"), satuan: "MW", seri: [{ k: "s", kelas: "ih-s1" }, { k: "l", kelas: "ih-netral" }],
    baris: ppa.map((x) => ({ label: x.pembeli.split(" (")[0], ikon: "tek-surya", kelasIkon: "ih-s1", tip: `${x.pembeli}: ${num(x.mw, 1)} MW`,
      th: tipHtml(x.pembeli, [[t("kr2.c.kap"), `${num(x.mw, x.mw < 1 ? 2 : 1)} MW`], [t("kr2.c.skema"), t("kr2.sk." + x.skema)], [t("kr2.c.pemasok"), x.pemasok || "-"], [t("kr2.c.tahun"), x.tahun ? String(x.tahun) : "-"], [t("kr2.tip.pangsa_ppa"), `${n1(x.mw / totalMw() * 100, 0)}%`]]),
      bagian: [{ k: x.teknologi === "surya" ? "s" : "l", nilai: x.mw }] })) });
}
function gTahun() {
  const nilai = (p) => (tabTh === "pendek" ? p.sbti?.tahun_sasaran : tabTh === "nz" ? p.sbti?.tahun_net_zero : p.re100?.tahun_target);
  const isi = d.perusahaan.filter((p) => nilai(p)), ths = isi.map(nilai), a = Math.min(...ths), b = Math.max(...ths), kat = [];
  for (let y = a; y <= b; y++) kat.push(y);
  const seri = tabTh === "re" ? [{ k: "re", kelas: "kr-b-re" }] : STATUS.map((k) => ({ k, kelas: "kr-b-" + k }));
  const ket = tabTh === "pendek" ? "kr2.tab.th.pendek" : tabTh === "nz" ? "kr2.tab.th.nz" : "kr2.tab.th.re";
  $("g-tahun").innerHTML = kolomSvg({ el: $("g-tahun"), satuan: t("kr2.u.perusahaan"), label: t(ket), seri,
    kategori: kat.map((y) => { const L = isi.filter((p) => nilai(p) === y), v = {}; for (const s of seri) v[s.k] = L.filter((p) => (tabTh === "re" ? true : (tabTh === "pendek" ? p.sbti.status : p.sbti.net_zero) === s.k)).length;
      return { label: String(y), nilai: v, tip: `${y}: ${L.length}`, th: tipHtml(String(y), [[t("kr2.u.perusahaan"), String(L.length)], ...(tabTh === "re" ? [] : STATUS.map((k) => [t("kr2.st." + k), String(v[k])]))], { extra: `<span class="ih-tr"><em>${esc(L.slice(0, 4).map((p) => p.nama).join(", "))}${L.length > 4 ? ` +${L.length - 4}` : ""}</em></span>` }) }; }) });
}

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(3);
  try { d = await muatData("korporat.json"); } catch (e) { tampilGalat($("isi"), mulai); return; }
  const gambar = () => { ubin(); rangka(); bagan(); };
  gambar();
  saatBahasa(gambar);
  $("isi").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-st],button[data-th]"); if (!b || b.getAttribute("aria-selected") === "true") return;
    for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b));
    if (b.dataset.st) { stat = b.dataset.st; nanti(tbPerusahaan); } else { tabTh = b.dataset.th; nanti(gTahun); }
  });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; bagan(); } }, 200));
}
mulai();
