/* /pasar-listrik-hijau: pembangkit swasta (IPP) dari GPPD, proyek METI per wilayah; REC, green tariff, dan RE100 ditandai belum tersedia. Informasi saja. Data statis /data/pasar_hijau.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce } from "/inti/umum.js";
import { t } from "/i18n.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatData, tampilGalat, sumberLipat, ubinHtml, pil, num, saatBahasa } from "/analisis.js";
import { batangSvg, legendaHtml, detailHtml, pasangDetail, tabel, celahHtml, n1 } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
let d = null;
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
    ex({ id: "celah", ikon: "unduh", topik: t("pm.ey.celah"), judulHtml: hlHtml("pm.t.celah", String(d.celah.length)), subHtml: esc(t("pm.s.celah")), isiHtml: celahHtml(d.celah, "pm.celah") }),
  ].join("");
  tabelTabel();
}

function tabelTabel() {
  tabel($("tb-ipp"), { satuan: "ih.u.pemilik", per: 10, urutAwal: 3, kolom: [
    { label: t("pm.c.pemilik"), v: (r) => r.pemilik, f: (r) => esc(r.pemilik === "tanpa-nama" ? t("pm.tanpa_nama") : r.pemilik) },
    { label: `${t("pm.c.grup")} ${t("an.est")}`, v: (r) => r.grup, f: (r) => esc(t("pm.grup." + r.grup)) },
    { label: t("pm.c.unit"), num: true, v: (r) => r.unit, f: (r) => num(r.unit, 0) },
    { label: t("pm.c.mw"), num: true, v: (r) => r.kapasitas_mw, f: (r) => num(r.kapasitas_mw, 0) },
    { label: t("pm.c.bahan"), v: (r) => nb(domin(r)), f: (r) => esc(nb(domin(r))) },
  ], baris: d.pemilik_pembangkit });
  tabel($("tb-wilayah"), { satuan: "ih.u.provinsi", per: 10, urutAwal: 2, kolom: [
    { label: t("pm.c.provinsi"), v: (r) => r.provinsi, f: (r) => esc(r.provinsi === "tanpa-provinsi" ? t("pm.tanpa_prov") : r.provinsi) },
    { label: t("pm.c.proyek"), num: true, v: (r) => r.proyek, f: (r) => num(r.proyek, 0) },
    { label: t("pm.c.mw"), num: true, v: (r) => r.mw, f: (r) => num(r.mw, 0) },
    { label: t("pm.st.beroperasi"), num: true, v: (r) => r.beroperasi_mw, f: (r) => num(r.beroperasi_mw, 0) },
    { label: t("pm.st.konstruksi"), num: true, v: (r) => r.konstruksi_mw, f: (r) => num(r.konstruksi_mw, 0) },
    { label: t("pm.st.rencana"), num: true, v: (r) => r.rencana_mw, f: (r) => num(r.rencana_mw, 0) },
  ], baris: d.proyek_wilayah });
}

function bagan() {
  const top = d.pemilik_pembangkit.slice(0, 12), nama = (p) => (p.pemilik === "tanpa-nama" ? t("pm.tanpa_nama") : p.pemilik);
  $("g-ipp").innerHTML = batangSvg({ el: $("g-ipp"), d: 0, label: t("pm.s.ipp"), satuan: "MW", seri: [{ k: "swasta-atau-lain", kelas: GRUP["swasta-atau-lain"] }, { k: "pln", kelas: GRUP.pln }],
    baris: top.map((p) => ({ label: nama(p), tip: t("pm.tip_ipp", { p: nama(p), mw: num(p.kapasitas_mw, 0), n: p.unit, b: nb(domin(p)) }), bagian: [{ k: p.grup, nilai: p.kapasitas_mw }] })) });
  const w = d.proyek_wilayah.filter((r) => r.provinsi !== "tanpa-provinsi").slice(0, 12);
  $("g-wilayah").innerHTML = batangSvg({ el: $("g-wilayah"), d: 0, label: t("pm.s.wilayah"), satuan: "MW", seri: [{ k: "o", kelas: "ih-ebt" }, { k: "k", kelas: "ih-s1" }, { k: "r", kelas: "ih-netral" }],
    baris: w.map((r) => ({ label: r.provinsi, tip: t("pm.tip_wil", { p: r.provinsi, o: num(r.beroperasi_mw, 0), k: num(r.konstruksi_mw, 0), r: num(r.rencana_mw, 0), n: r.proyek }), bagian: [{ k: "o", nilai: r.beroperasi_mw }, { k: "k", nilai: r.konstruksi_mw }, { k: "r", nilai: r.rencana_mw }] })) });
}

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(3);
  try { d = await muatData("pasar_hijau.json"); } catch (e) { tampilGalat($("isi"), mulai); return; }
  const gambar = () => { ubin(); rangka(); bagan(); };
  gambar();
  saatBahasa(gambar);
  pasangDetail($("isi"));
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; nanti(bagan); } }, 200));
}
mulai();
