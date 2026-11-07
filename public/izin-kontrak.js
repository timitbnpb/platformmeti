/* /izin-kontrak: tanya jawab izin per jenis pembangkit, lead time AMDAL ke COD (olahan), kamus klausul PPA/PJBL beserta risikonya.
   Data /data/izin_kontrak.json (scripts/pipa/izin_kontrak.mjs); teks /data/teks_izin.json. Hanya informasi. */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, hantuHtml, nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { muatData, tampilGalat, batangHtml, pasangBar, ubinHtml } from "/analisis.js";
import { muatTeks, tt, L, num, tautan, seksi, catatan, narasi, sumber, butuhDaftar, tabel, labelPil, saatBahasa } from "/info_kerangka.js";

const $ = (id) => document.getElementById(id);
let d = null, jenis = "semua", tingkat = "semua";
const dok = (k) => d.dok[k];
const pasalHtml = (psl) => psl.map((x) => (dok(x.dok) ? `${tautan(dok(x.dok).pdf, dok(x.dok).nama)}: ${esc(x.pasal)}` : esc(x.pasal))).join("; ");
const JENIS = ["semua", "umum", "surya", "hidro", "panas-bumi", "bioenergi"];
const TINGKAT = ["semua", "tinggi", "sedang", "rendah"];
const SUM = () => ["p112", "m11", "m2", "uu25"].map((k) => ({ sumber: dok(k).nama, url: dok(k).url, tanggal: d.dibangun_pada }));

function ubin() {
  $("ubin").innerHTML = ubinHtml([
    { ikon: "palu", nilai: num(d.tanya.length), label: tt("ubin.tanya"), href: "#tanya" },
    { ikon: "linimasa", nilai: d.lead_time.ringkas.median == null ? "-" : num(d.lead_time.ringkas.median, 0), satuan: tt("satuan.bulan"), label: tt("ubin.lead", { n: d.lead_time.ringkas.n }), href: "#leadtime", turunan: true },
    { ikon: "kunci", nilai: num(d.klausul.length), label: tt("ubin.klausul"), href: "#klausul" },
  ]);
}

function isiTanya() {
  const tampil = jenis === "semua" ? d.tanya : d.tanya.filter((x) => x.jenis === jenis || x.jenis === "umum");
  $("isi-tanya").innerHTML = `<div class="inf-qa">${tampil.map((x) => `<details id="q-${esc(x.id)}"><summary>${esc(L(x.q))}</summary><div class="inf-jawab"><p>${esc(L(x.a))}</p><p class="inf-pasal">${pasalHtml(x.pasal)}</p>${x.verifikasi ? `<p>${labelPil("tanya.cek")}</p>` : ""}</div></details>`).join("")}</div>`;
}
function bagTanya() {
  const psl = d.tanya.reduce((s, x) => s + x.pasal.length, 0);
  $("s-tanya").innerHTML = seksi({
    id: "tanya", ik: "palu", topik: tt("tanya.topik"), judul: tt("tanya.judul", { n: d.tanya.length, m: psl }), turunan: false, sub: tt("tanya.sub"), csv: false,
    isi: `${narasi(tt("tanya.narasi"))}<div class="inf-sel">${pilihHtml({ id: "pilih-jenis", ikon: "daftar2", label: tt("seg.jenis"), opsi: JENIS.map((k) => [k, tt("jn." + k)]), nilai: jenis })}</div><div id="isi-tanya"></div>${catatan(tt("tanya.catatan"))}${butuhDaftar(d.butuh_unduhan, ["pp28"])}${sumber(SUM())}`,
  });
  isiTanya();
}

function bagLead() {
  const r = d.lead_time.ringkas, sedikit = r.n < 5;
  const bar = batangHtml(d.batas_waktu.map((b) => ({ id: b.id, label: tt("bw." + b.id), bagian: [{ nilai: b.hari, kelas: "jm-an-c1" }], teks: `${num(b.hari)} ${tt("satuan.hari")}` })), { label: tt("lead.bar_batas"), satuan: tt("satuan.hari") });
  const bar2 = d.lead_time.daftar.length ? batangHtml(d.lead_time.daftar.map((x) => ({ id: x.proyek_id, label: x.proyek, bagian: [{ nilai: x.bulan, kelas: "jm-an-c3" }], teks: `${num(x.bulan)} ${tt("satuan.bulan")}` })), { label: tt("lead.bar_lead"), satuan: tt("satuan.bulan") }) : "";
  $("s-lead").innerHTML = seksi({
    id: "leadtime", ik: "linimasa", topik: tt("lead.topik"), judul: r.n ? tt("lead.judul", { x: num(r.rata, 0), n: r.n, min: num(r.min), maks: num(r.maks) }) : tt("lead.judul_kosong"), sub: tt("lead.sub"), csv: true,
    isi: `${narasi(tt("lead.narasi"))}${sedikit ? `<p>${labelPil("lead.sedikit")}</p>` : ""}<h3 class="jm-bantu">${esc(tt("lead.bar_lead"))}</h3>${bar2}<div id="t-lead"></div><h3 class="jm-bantu">${esc(tt("lead.bar_batas"))}</h3>${bar}<p class="inf-pasal">${pasalHtml([d.batas_waktu[0].pasal, d.batas_waktu[1].pasal])}</p>${catatan(tt("lead.metode"))}${butuhDaftar(d.butuh_unduhan, ["lama_izin"])}${sumber([{ sumber: tt("sumber.proyek"), url: "/proyek", tanggal: d.dibangun_pada }, { sumber: "AMDALNET (pengumuman)", url: "https://amdalnet.kemenlh.go.id/", tanggal: d.dibangun_pada }, { sumber: dok("p112").nama, url: dok("p112").url, tanggal: d.dibangun_pada }])}`,
  });
  pasangBar($("s-lead"));
  if (d.lead_time.daftar.length) tabel($("t-lead"), { baris: d.lead_time.daftar, per: 8, urut: { k: "bulan", arah: -1 }, label: tt("lead.topik"), kolom: [
    { k: "proyek", label: tt("tabel.proyek"), v: (x) => x.proyek },
    { k: "amdal", label: tt("tabel.amdal_tgl"), v: (x) => x.amdal_tanggal, f: (x) => (x.amdal_url ? tautan(x.amdal_url, x.amdal_tanggal) : esc(x.amdal_tanggal)) },
    { k: "cod", label: tt("tabel.cod"), num: true, v: (x) => x.cod_target, f: (x) => String(x.cod_target) },
    { k: "bulan", label: tt("tabel.bulan"), num: true, v: (x) => x.bulan, f: (x) => num(x.bulan) },
  ] });
}

function isiKlausul() {
  const tampil = d.klausul.filter((k) => tingkat === "semua" || k.risiko_tingkat === tingkat);
  $("isi-klausul").innerHTML = `<div class="inf-kl">${tampil.map((k) => `<article id="k-${esc(k.id)}"><h3>${esc(L(k.nama))} ${labelPil("rt." + k.risiko_tingkat, { tinggi: "bad", sedang: "warn", rendah: "ok" }[k.risiko_tingkat])}</h3><p><b>${esc(tt("kl.arti"))}</b> ${esc(L(k.arti))}</p><p><b>${esc(tt("kl.risiko"))}</b> ${esc(L(k.risiko))}</p><p class="inf-pasal">${pasalHtml(k.pasal)}</p></article>`).join("")}</div>`;
}
function bagKlausul() {
  const tinggi = d.klausul.filter((k) => k.risiko_tingkat === "tinggi").length;
  $("s-klausul").innerHTML = seksi({
    id: "klausul", ik: "kunci", topik: tt("kl.topik"), judul: tt("kl.judul", { n: d.klausul.length, k: tinggi }), sub: tt("kl.sub"),
    isi: `${narasi(tt("kl.narasi"))}<div class="inf-sel">${pilihHtml({ id: "pilih-tingkat", ikon: "peringatan", label: tt("seg.tingkat"), opsi: TINGKAT.map((k) => [k, tt("rt." + k)]), nilai: tingkat })}</div><div id="isi-klausul"></div>${catatan(tt("kl.catatan"))}${butuhDaftar(d.butuh_unduhan, ["ppa"])}${sumber(SUM().slice(0, 1))}`,
  });
  isiKlausul();
}

function bagMetode() {
  $("s-metode").innerHTML = seksi({ id: "metode", ik: "metode", topik: tt("metode.topik"), judul: tt("metode.judul"), turunan: false, sub: tt("metode.sub"), isi: `${narasi(tt("metode.isi"))}${catatan(tt("metode.tanggal", { tanggal: d.dibangun_pada }))}` });
}

async function gambar() {
  ubin();
  for (const id of ["s-tanya", "s-lead", "s-klausul", "s-metode"]) if (!$(id)) $("isi").insertAdjacentHTML("beforeend", `<div id="${id}"></div>`);
  bagTanya(); bagLead(); bagKlausul(); bagMetode();
  document.querySelectorAll("[data-k]").forEach((e) => { e.textContent = tt(e.dataset.k); });
  document.title = tt("judul.halaman");
}

function pasangSegmen() {
  $("isi").addEventListener("change", (e) => {
    if (e.target.id === "pilih-jenis" && e.target.value !== jenis) { jenis = e.target.value; nanti(isiTanya); }
    else if (e.target.id === "pilih-tingkat" && e.target.value !== tingkat) { tingkat = e.target.value; nanti(isiKlausul); }
  });
}

(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { [d] = await Promise.all([muatData("izin_kontrak.json"), muatTeks("izin")]); } catch (e) { tampilGalat($("isi"), () => location.reload()); return; }
  $("isi").innerHTML = "";
  await gambar();
  pasangSegmen();
  saatBahasa(() => gambar());
  if (location.hash) $(location.hash.slice(1))?.scrollIntoView();
})();
