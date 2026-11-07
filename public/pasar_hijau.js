/* /pasar-listrik-hijau: pembangkit swasta (IPP) dari GPPD, proyek METI per wilayah; REC, green tariff, dan RE100 ditandai belum tersedia. Informasi saja. Data statis /data/pasar_hijau.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, ikon, hantuHtml, debounce } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatData, tampilGalat, sumberLipat, ubinHtml, pil, num, saatBahasa } from "/analisis.js";
import { muatKomitmen, statusKm, tahunKm, sektorKm, pilStatusKm, cocokOrg } from "/peristiwa_komitmen.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { namaBaku } from "/inti/nama_baku.js";
import { kodeProv } from "/inti/prov_singkat.js";
import { batangSvg, legendaHtml, detailHtml, pasangDetail, tabel, celahHtml, n1 } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
let d = null, km = null, orgs = [];
const ini = (n) => String(n || "?").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
const namaKm = (n) => namaBaku(String(n).replace(/,\s*TBK\.?$/i, " Tbk").replace(/^PT\.?\s+/i, "").replace(/,\s*PT$/i, "")).nama;
const src = (...id) => sumberLipat(id.map((i) => { const s = d.sumber.find((x) => x.id === i); return { sumber: s.penerbit, halaman: s.judul, url: s.url, tanggal: d.dibangun_pada }; }));
const GRUP = { pln: "ih-fosil", "swasta-atau-lain": "ih-ebt" };
const jml = (g) => d.pemilik_pembangkit.filter((p) => p.grup === g).reduce((a, p) => a + p.kapasitas_mw, 0);
const domin = (p) => Object.entries(p.bahan).sort((a, b) => b[1] - a[1])[0]?.[0];
const nb = (k) => t("pm.bahan." + k);

function ubin() {
  const sw = jml("swasta-atau-lain"), mw = d.proyek_wilayah.reduce((a, r) => a + r.mw, 0);
  $("jawab").textContent = t("pm.lead");
  $("ubin").innerHTML = ubinHtml([
    { ikon: "gedung", nilai: num(sw / 1000, 1), satuan: "GW", label: t("pm.u1"), href: "#ipp", turunan: true },
    { ikon: "orang", nilai: num(d.pemilik_pembangkit.length, 0), satuan: "", label: t("pm.u2"), href: "#ipp" },
    { ikon: "peta", nilai: num(mw / 1000, 1), satuan: "GW", label: t("pm.u3"), href: "#wilayah" },
  ]);
}

function rangka() {
  const sw = jml("swasta-atau-lain"), pln = jml("pln"), est = " " + pil("an.est");
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const w = d.proyek_wilayah, top = w.find((r) => r.provinsi !== "tanpa-provinsi");
  $("isi").innerHTML = [
    ex({ id: "ipp", ikon: "gedung", topik: t("pm.ey.ipp"), judulHtml: hlHtml("pm.t.ipp", `${num((sw / (sw + pln)) * 100, 0)}%`, { n: d.pemilik_pembangkit.length, gw: n1(sw / 1000, 1) }) + est, subHtml: esc(t("pm.s.ipp")), csv: true,
      isiHtml: `${legendaHtml([{ kelas: GRUP["swasta-atau-lain"], label: t("pm.grup.swasta-atau-lain") }, { kelas: GRUP.pln, label: t("pm.grup.pln") }])}<div id="g-ipp" class="ih-bagan"></div>${detailHtml()}<div id="tb-ipp" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("pm.n.ipp"))}</p>${src("gppd")}` }),
    ex({ id: "wilayah", ikon: "peta", topik: t("pm.ey.wilayah"), judulHtml: hlHtml("pm.t.wilayah", `${num(top.mw, 0)} MW`, { prov: top.provinsi, n: w.length }), subHtml: esc(t("pm.s.wilayah")), csv: true,
      isiHtml: `${legendaHtml([{ kelas: "ih-ebt", label: t("pm.st.beroperasi") }, { kelas: "ih-s1", label: t("pm.st.konstruksi") }, { kelas: "ih-netral", label: t("pm.st.rencana") }])}<div id="g-wilayah" class="ih-bagan"></div>${detailHtml()}<div id="tb-wilayah" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("pm.n.wilayah"))}</p>${src("proyek")}` }),
    km && ex({ id: "komitmen", ikon: "perisai", topik: t("km.ey"), judulHtml: hlHtml("km.judul", String(km.baris.length), { n: km.meta.sbti, r: km.meta.re100 }), subHtml: esc(t("km.sub")), csv: true,
      isiHtml: `<div id="tb-komitmen" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("km.catatan", { tgl: tanggal(km.dibangun_pada) }))}</p>${sumberLipat(km.sumber.map((s) => ({ sumber: s.penerbit, halaman: s.judul, url: s.url, tahun: s.tahun, tanggal: km.dibangun_pada })))}` }),
    ex({ id: "celah", ikon: "unduh", topik: t("pm.ey.celah"), judulHtml: hlHtml("pm.t.celah", String(d.celah.length)), subHtml: esc(t("pm.s.celah")), isiHtml: celahHtml(d.celah, "pm.celah") }),
  ].filter(Boolean).join("");
  tabelTabel();
}

function tabelTabel() {
  tabelKomitmen();
  tabel($("tb-ipp"), { satuan: "ih.u.pemilik", per: 10, urutAwal: 3, kolom: [
    { label: t("pm.c.pemilik"), v: (r) => r.pemilik, f: (r) => esc(r.pemilik === "tanpa-nama" ? t("pm.tanpa_nama") : r.pemilik) },
    { label: `${t("pm.c.grup")} ${t("an.est")}`, v: (r) => r.grup, f: (r) => esc(t("pm.grup." + r.grup)) },
    { label: t("pm.c.unit"), num: true, v: (r) => r.unit, f: (r) => num(r.unit, 0) },
    { label: t("pm.c.mw"), num: true, v: (r) => r.kapasitas_mw, f: (r) => num(r.kapasitas_mw, 0) },
    { label: t("pm.c.bahan"), v: (r) => nb(domin(r)), f: (r) => esc(nb(domin(r))) },
  ], baris: d.pemilik_pembangkit });
  tabel($("tb-wilayah"), { satuan: "ih.u.provinsi", per: 10, urutAwal: 2, kolom: [
    { label: t("pm.c.provinsi"), v: (r) => r.provinsi, f: (r) => (kodeProv(r.provinsi) ? `<img class="ih-pt" src="/img/provinsi/${kodeProv(r.provinsi)}.png" width="20" height="20" alt="" loading="lazy"> ` : "") + esc(r.provinsi === "tanpa-provinsi" ? t("pm.tanpa_prov") : r.provinsi) },
    { label: t("pm.c.proyek"), num: true, v: (r) => r.proyek, f: (r) => num(r.proyek, 0) },
    { label: t("pm.c.mw"), num: true, v: (r) => r.mw, f: (r) => num(r.mw, 0) },
    { label: t("pm.st.beroperasi"), num: true, v: (r) => r.beroperasi_mw, f: (r) => num(r.beroperasi_mw, 0) },
    { label: t("pm.st.konstruksi"), num: true, v: (r) => r.konstruksi_mw, f: (r) => num(r.konstruksi_mw, 0) },
    { label: t("pm.st.rencana"), num: true, v: (r) => r.rencana_mw, f: (r) => num(r.rencana_mw, 0) },
  ], baris: d.proyek_wilayah });
}

function tabelKomitmen() {
  if (!km || !$("tb-komitmen")) return;
  const kenal = (r) => cocokOrg(r.nama, orgs);
  tabel($("tb-komitmen"), { satuan: "km.satuan", per: 10, urutAwal: 4, kolom: [
    { label: t("km.c.perusahaan"), v: (r) => namaKm(r.nama), f: (r) => { const o = kenal(r), u = logoOrgSatu(o?.id, o?.nama || r.nama, o?.logo), n = esc(namaKm(r.nama)), lg = `<span class="km-lg">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-ini="${esc(ini(namaKm(r.nama)))}">` : esc(ini(namaKm(r.nama)))}</span>`; return `<span class="km-nama">${lg}${o ? `<a href="/o/${esc(o.id)}" title="${esc(t("km.ke_o"))}">${n}</a>` : `<b>${n}</b>`}</span>`; } },
    { label: t("km.c.sektor"), v: (r) => sektorKm(r.sektor), f: (r) => esc(sektorKm(r.sektor)) },
    { label: t("km.c.jenis"), v: (r) => r.registri, f: (r) => `<span class="km-jenis"><span class="jm-pil">${esc(r.registri)}</span>${r.klasifikasi_jangka_pendek ? `<span class="jm-pil">${esc(r.klasifikasi_jangka_pendek)}</span>` : ""}${r.status_net_zero === "Validated Targets" ? `<span class="jm-pil jm-pil-ok">${esc(t("km.netzero"))}</span>` : ""}${r.registri === "RE100" ? `<span class="jm-pil">${esc(t("km.re100_ket"))}</span>` : ""}</span>` },
    { label: t("km.c.tahun"), num: true, v: (r) => tahunKm(r), f: (r) => (tahunKm(r) ? esc(String(tahunKm(r))) : "-") },
    { label: t("km.c.status"), v: (r) => statusKm(r), f: (r) => pilStatusKm(r) },
    { label: t("km.c.sumber"), v: (r) => r.diperbarui_sumber || r.tanggal_periksa, f: (r) => `<a class="km-src" href="${esc(r.sumber_url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("km.sumber_tip", { tgl: tanggal(r.diperbarui_sumber || r.tanggal_periksa) }))}">${ikon("tautan", 14)}<span>${esc(r.registri)}</span></a>` },
  ], baris: km.baris });
}

function bagan() {
  const top = d.pemilik_pembangkit.slice(0, 12), nama = (p) => (p.pemilik === "tanpa-nama" ? t("pm.tanpa_nama") : p.pemilik);
  $("g-ipp").innerHTML = batangSvg({ el: $("g-ipp"), d: 0, label: t("pm.s.ipp"), satuan: "MW", seri: [{ k: "swasta-atau-lain", kelas: GRUP["swasta-atau-lain"] }, { k: "pln", kelas: GRUP.pln }],
    baris: top.map((p) => ({ label: nama(p), tip: t("pm.tip_ipp", { p: nama(p), mw: num(p.kapasitas_mw, 0), n: p.unit, b: nb(domin(p)) }), bagian: [{ k: p.grup, nilai: p.kapasitas_mw }] })) });
  const w = d.proyek_wilayah.filter((r) => r.provinsi !== "tanpa-provinsi").slice(0, 12);
  $("g-wilayah").innerHTML = batangSvg({ el: $("g-wilayah"), d: 0, label: t("pm.s.wilayah"), satuan: "MW", seri: [{ k: "o", kelas: "ih-ebt" }, { k: "k", kelas: "ih-s1" }, { k: "r", kelas: "ih-netral" }],
    baris: w.map((r) => ({ label: r.provinsi, ...(kodeProv(r.provinsi) ? { logo: `/img/provinsi/${kodeProv(r.provinsi)}.png` } : {}), tip: t("pm.tip_wil", { p: r.provinsi, o: num(r.beroperasi_mw, 0), k: num(r.konstruksi_mw, 0), r: num(r.rencana_mw, 0), n: r.proyek }), bagian: [{ k: "o", nilai: r.beroperasi_mw }, { k: "k", nilai: r.konstruksi_mw }, { k: "r", nilai: r.rencana_mw }] })) });
}

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(3);
  try { d = await muatData("pasar_hijau.json"); } catch (e) { tampilGalat($("isi"), mulai); return; }
  [km, orgs] = await Promise.all([muatKomitmen(), muatData("organisasi.json").then((o) => o.baris).catch(() => [])]);
  const gambar = () => { ubin(); rangka(); bagan(); };
  gambar();
  saatBahasa(gambar);
  pasangDetail($("isi"));
  $("isi").addEventListener("error", (e) => { const im = e.target; if (im.tagName === "IMG" && im.dataset.ini !== undefined && im.closest(".km-lg")) im.replaceWith(document.createTextNode(im.dataset.ini)); }, true);
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; nanti(bagan); } }, 200));
}
mulai();
