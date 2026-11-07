/* /kinerja: faktor kapasitas aktual 2024 = produksi / (kapasitas x 8760) per teknologi dan per provinsi, dibanding pembanding rencana RUPTL (EST).
   Data statis /data/kinerja_pembangkit.json (scripts/pipa/kinerja_pembangkit.mjs). Tingkat terendah: jenis x provinsi, bukan per unit. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";
import { exHtml, pilihHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { muatData, tampilGalat, sumberLipat, ubinHtml, pil, num, saatBahasa } from "/analisis.js";
import { batangSvg, tabel, n1, tipHtml } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
const TEK = ["pltu", "gas", "pltd", "air", "panas", "surya", "bayu", "bio"];
const KLS = { pltu: "ih-fosil", gas: "ih-lain", pltd: "ih-netral", air: "ih-s3", panas: "ih-s4", surya: "ih-s1", bayu: "ih-s2", bio: "ih-s5" };
const IKT = { pltu: "industri", gas: "karbon", pltd: "elektrifikasi", air: "hidro", panas: "panas-bumi", surya: "surya", bayu: "bayu", bio: "bioenergi" };
const MIN_MW = 20; // provinsi dengan kapasitas lebih kecil tidak diperingkat: faktor kapasitas dari unit sangat sedikit tidak mewakili
const IKC = { pltu: "pabrik", gas: "tek-listrik", pltd: "petir", air: "topik", panas: "tek-panas", surya: "tek-surya", bayu: "kompas", bio: "tek-bio" };
let d = null, basis = "ruptl", tek = "panas";
const nm = (k) => t("kn2.tek." + k), ns = (k) => t("kn2.tek.s." + k);
const lencana = (k, u = 20) => `<span class="kn-ik ${KLS[k]}">${ikonTek(IKT[k]).replace('class="jm-ikt"', `class="jm-ikt" width="${u}" height="${u}"`)}</span>`;
const kosong = '<span class="ih-kosong">-</span>';
const src = (...id) => sumberLipat(id.map((i) => { const s = d.sumber.find((x) => x.id === i); return { sumber: s.penerbit, halaman: s.judul, url: s.url, tanggal: d.dibangun_pada }; }));
const nas = (k) => d.nasional.find((x) => x.id === k);
const fkNas = (n) => (basis === "ruptl" ? n.fk_aktual : n.fk_batas_bawah);
const pct = (v) => (v == null ? "-" : `${n1(v, 1)}%`);
const ARAH = { naik: '<path d="M6 10V2M2.5 5.5L6 2l3.5 3.5"/>', turun: '<path d="M6 2v8M2.5 6.5L6 10l3.5-3.5"/>' };
const pilPp = (v) => { if (v == null) return kosong; const k = v > 0.5 ? "naik" : v < -0.5 ? "turun" : "sama"; return `<span class="ih-ub kn-${k}">${k === "sama" ? "" : `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">${ARAH[k]}</svg>`}${esc(`${v > 0 ? "+" : ""}${n1(v, 1)} ${t("kn2.pp")}`)}</span>`; };
const selisihPp = (n) => (n.fk_rencana == null ? null : n.fk_aktual - n.fk_rencana);
const urutWil = (k) => d.wilayah.filter((w) => w.tek[k].fk != null && w.tek[k].kap_mw >= MIN_MW).sort((a, b) => b.tek[k].fk - a.tek[k].fk);

function ubin() {
  const p = nas("panas"), s = nas("surya"), a = nas("air");
  $("jawab").textContent = t("kn2.lead");
  $("ubin").innerHTML = ubinHtml([
    { ikon: "medali", nilai: n1(p.fk_aktual, 1), satuan: "%", label: t("kn2.u1"), href: "#teknologi", turunan: true },
    { ikon: "tek-surya", nilai: n1(s.fk_aktual, 1), satuan: "%", label: t("kn2.u2"), href: "#teknologi", turunan: true },
    { ikon: "grafik", nilai: `${selisihPp(a) > 0 ? "+" : ""}${n1(selisihPp(a), 1)}`, satuan: t("kn2.pp"), label: t("kn2.u3"), href: "#teknologi", turunan: true },
  ]);
}

function rangka() {
  const est = " " + pil("an.est"), ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const tinggi = [...d.nasional].sort((a, b) => b.fk_aktual - a.fk_aktual)[0], rendah = [...d.nasional].sort((a, b) => a.fk_aktual - b.fk_aktual)[0];
  const tabBasis = `<div class="jm-tab" role="tablist" aria-label="${esc(t("kn2.pilih_basis"))}">${["ruptl", "esdm"].map((k) => `<button type="button" role="tab" data-basis="${k}" aria-selected="${k === basis}">${esc(t("kn2.basis." + k))}</button>`).join("")}</div>`;
  const pilih = pilihHtml({ id: "pil-tek", ikon: "tek-surya", label: t("kn2.pilih_tek"), nilai: tek, opsi: TEK.map((k) => [k, ns(k), "tek:" + IKT[k]]) });
  $("isi").innerHTML = [
    ex({ id: "teknologi", ikon: "medali", topik: t("kn2.ey.tek"), judulHtml: hlHtml("kn2.t.tek", `${n1(tinggi.fk_aktual, 0)}%`, { tinggi: ns(tinggi.id), rendah: ns(rendah.id), r: n1(rendah.fk_aktual, 0) }) + est, subHtml: esc(t("kn2.s.tek")), csv: true,
      isiHtml: `${tabBasis}<div id="g-tek" class="ih-bagan"></div><div id="tb-tek" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("kn2.n.tek"))}</p>${src("s-esdm", "s-ruptl-kap", "s-ruptl-energi")}` }),
    ex({ id: "wilayah", ikon: "wilayah", topik: t("kn2.ey.wil"), judulHtml: `<span id="jd-wil"></span>`, subHtml: esc(t("kn2.s.wil", { mw: MIN_MW })), csv: true,
      isiHtml: `<div class="kn-pil">${pilih}</div><div id="g-wil" class="ih-bagan"></div><div id="tb-wil" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("kn2.n.wil"))}</p>${src("s-esdm")}` }),
    ex({ id: "ekstrem", ikon: "bintang", topik: t("kn2.ey.ekstrem"), judulHtml: `<span id="jd-eks"></span>`, subHtml: esc(t("kn2.s.ekstrem", { mw: MIN_MW })),
      isiHtml: `<div id="eks" class="kn-eks"></div>${src("s-esdm")}` }),
    ex({ id: "celah", ikon: "info", topik: t("kn2.ey.celah"), judulHtml: hlHtml("kn2.t.celah", String(d.meta.celah.length)), subHtml: esc(t("kn2.s.celah")),
      isiHtml: `<ul class="ih-lis">${d.meta.celah.map((_, i) => `<li>${esc(t("kn2.celah." + (i + 1)))}</li>`).join("")}</ul>` }),
  ].join("");
  tbTek(); tbWil();
}

function tbTek() {
  tabel($("tb-tek"), { satuan: "kn2.u.tek", per: 10, urutAwal: 1, kolom: [
    { label: t("kn2.c.tek"), v: (n) => ns(n.id), f: (n) => `<span class="ih-ti">${lencana(n.id)}<span>${esc(nm(n.id))}</span></span>` },
    { label: `${t("kn2.c.aktual")} ${t("an.est")}`, num: true, v: (n) => n.fk_aktual, f: (n) => `<b>${pct(n.fk_aktual)}</b>` },
    { label: t("kn2.c.bawah"), num: true, v: (n) => n.fk_batas_bawah, f: (n) => pct(n.fk_batas_bawah) },
    { label: `${t("kn2.c.rencana")} ${t("an.est")}`, num: true, v: (n) => n.fk_rencana, f: (n) => (n.fk_rencana == null ? `<span class="ih-kosong" title="${esc(t("kn2.alasan." + n.alasan_rencana_kosong))}">-</span>` : pct(n.fk_rencana)) },
    { label: t("kn2.c.selisih"), num: true, v: selisihPp, f: (n) => pilPp(selisihPp(n)) },
    { label: t("kn2.c.prod"), num: true, v: (n) => n.produksi_gwh, f: (n) => num(n.produksi_gwh, 0) },
    { label: t("kn2.c.kap"), num: true, v: (n) => n.kapasitas_ruptl_mw, f: (n) => num(n.kapasitas_ruptl_mw, 0) },
  ], baris: d.nasional });
}
function tbWil() {
  const baris = d.wilayah.filter((w) => w.tek[tek].kap_mw > 0 || w.tek[tek].prod_gwh > 0);
  const n = nas(tek);
  tabel($("tb-wil"), { satuan: "kn2.u.prov", per: 10, urutAwal: 1, kolom: [
    { label: t("kn2.c.prov"), v: (w) => w.provinsi, f: (w) => `<span class="ih-tn"><img class="ih-pt" src="/img/provinsi/${esc(w.kode)}.png" width="20" height="20" alt="" loading="lazy"><span>${esc(w.provinsi)}</span></span>` },
    { label: `${t("kn2.c.bawah")} ${t("an.est")}`, num: true, v: (w) => w.tek[tek].fk, f: (w) => { const x = w.tek[tek]; return x.anomali ? `<span class="ih-kosong" title="${esc(t("kn2.anomali"))}">-</span>` : x.fk == null ? kosong : `<b>${pct(x.fk)}</b>`; } },
    { label: t("kn2.c.vsnas"), num: true, v: (w) => (w.tek[tek].fk == null ? null : w.tek[tek].fk - n.fk_batas_bawah), f: (w) => (w.tek[tek].fk == null ? kosong : pilPp(w.tek[tek].fk - n.fk_batas_bawah)) },
    { label: t("kn2.c.prod"), num: true, v: (w) => w.tek[tek].prod_gwh, f: (w) => num(w.tek[tek].prod_gwh, 1) },
    { label: t("kn2.c.kap"), num: true, v: (w) => w.tek[tek].kap_mw, f: (w) => num(w.tek[tek].kap_mw, 0) },
  ], baris });
}

function gTek() {
  const urut = [...d.nasional].sort((a, b) => fkNas(b) - fkNas(a));
  $("g-tek").innerHTML = batangSvg({ el: $("g-tek"), d: 1, label: t("kn2.s.tek"), satuan: "%", seri: TEK.map((k) => ({ k, kelas: KLS[k] })),
    baris: urut.map((n) => ({ label: ns(n.id), ikon: IKC[n.id], kelasIkon: KLS[n.id], tip: `${ns(n.id)}: ${pct(fkNas(n))}`,
      th: tipHtml(nm(n.id), [[t(basis === "ruptl" ? "kn2.basis.ruptl" : "kn2.basis.esdm"), pct(fkNas(n))], [t("kn2.c.bawah"), pct(n.fk_batas_bawah)], [t("kn2.c.rencana"), n.fk_rencana == null ? "-" : pct(n.fk_rencana)], [t("kn2.c.selisih"), selisihPp(n) == null ? "-" : `${selisihPp(n) > 0 ? "+" : ""}${n1(selisihPp(n), 1)} ${t("kn2.pp")}`, selisihPp(n) > 0 ? "ih-turun" : "ih-naik"], [t("kn2.c.prod"), `${num(n.produksi_gwh, 0)} GWh`], [t("kn2.c.kap"), `${num(basis === "ruptl" ? n.kapasitas_ruptl_mw : n.kapasitas_esdm_mw, 0)} MW`]]),
      bagian: [{ k: n.id, nilai: fkNas(n) }] })) });
}
function gWil() {
  const L = urutWil(tek), n = nas(tek), ref = n.fk_batas_bawah;
  $("jd-wil").innerHTML = L.length ? hlHtml("kn2.t.wil", `${n1(L[0].tek[tek].fk, 0)}%`, { tek: ns(tek), prov: L[0].provinsi, n: L.length }) + " " + pil("an.est") : esc(t("kn2.t.wil_kosong", { tek: ns(tek) }));
  $("g-wil").innerHTML = L.length ? batangSvg({ el: $("g-wil"), d: 1, label: t("kn2.s.wil", { mw: MIN_MW }), satuan: "%", ref: { nilai: ref, label: t("kn2.ref", { v: n1(ref, 1) }) }, seri: [{ k: "a", kelas: KLS[tek] }],
    baris: L.map((w) => { const x = w.tek[tek]; return { label: w.provinsi, logo: `/img/provinsi/${w.kode}.png`, tip: `${w.provinsi}: ${pct(x.fk)}`,
      th: tipHtml(w.provinsi, [[t("kn2.c.bawah"), pct(x.fk)], [t("kn2.c.vsnas"), `${x.fk - ref > 0 ? "+" : ""}${n1(x.fk - ref, 1)} ${t("kn2.pp")}`, x.fk - ref >= 0 ? "ih-turun" : "ih-naik"], [t("kn2.c.prod"), `${num(x.prod_gwh, 1)} GWh`], [t("kn2.c.kap"), `${num(x.kap_mw, 0)} MW`]], { img: `/img/provinsi/${w.kode}.png` }),
      bagian: [{ k: "a", nilai: x.fk }] }; }) }) : "";
}
function ekstrem() {
  const L = urutWil(tek), atas = L.slice(0, 5), bawah = L.slice(-5).reverse(), n = nas(tek);
  const daftar = (arr, jenis) => `<section class="kn-kol"><h3>${ikon(jenis === "atas" ? "piala" : "peringatan", 18)}<span>${esc(t("kn2.eks." + jenis))}</span></h3><ol>${arr.map((w, i) => `<li><span class="kn-no">${i + 1}</span><span class="ih-tn"><img class="ih-pt" src="/img/provinsi/${esc(w.kode)}.png" width="20" height="20" alt="" loading="lazy"><span>${esc(w.provinsi)}</span></span><span class="kn-v"><b>${pct(w.tek[tek].fk)}</b>${pilPp(w.tek[tek].fk - n.fk_batas_bawah)}</span></li>`).join("")}</ol></section>`;
  $("jd-eks").innerHTML = esc(t("kn2.t.eks", { tek: ns(tek) }));
  $("eks").innerHTML = L.length >= 6 ? daftar(atas, "atas") + daftar(bawah, "bawah") : `<p class="jm-bantu">${esc(t("kn2.eks.sedikit", { tek: ns(tek) }))}</p>`;
}
const bagan = () => { gTek(); gWil(); ekstrem(); };

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(3);
  try { d = await muatData("kinerja_pembangkit.json"); } catch (e) { tampilGalat($("isi"), mulai); return; }
  const gambar = () => { ubin(); rangka(); bagan(); };
  gambar();
  saatBahasa(gambar);
  $("isi").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-basis]"); if (!b || b.getAttribute("aria-selected") === "true") return;
    for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b));
    basis = b.dataset.basis; nanti(gTek);
  });
  $("isi").addEventListener("change", (e) => { if (e.target.id === "pil-tek") { tek = e.target.value; nanti(() => { tbWil(); gWil(); ekstrem(); }); } });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; bagan(); } }, 200));
}
mulai();
