/* /desa-energi: kerentanan desa per provinsi, hidro skala kecil, panduan koperasi energi desa dan pembiayaan. Hanya informasi.
   Data /data/desa_akses.json (scripts/pipa/desa_akses.mjs); teks /data/teks_desa.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, hantuHtml } from "/inti/umum.js";
import { muatData, tampilGalat, batangHtml, pasangBar, ubinHtml } from "/analisis.js";
import { muatTeks, tt, L, num, tgl, persen, tautan, url, seksi, catatan, narasi, sumber, butuhDaftar, tabel, petaHtml, pasangPeta, lambang, labelPil, saatBahasa } from "/info_kerangka.js";

const $ = (id) => document.getElementById(id);
let d = null;
const nama = (k) => d.provinsi.find((p) => p.kode === k)?.nama ?? k;
const namaL = (p) => `<span class="inf-nama">${lambang(p.kode)}${esc(p.nama)}</span>`;
const SUM = {
  esdm: () => ({ sumber: "Statistik Ketenagalistrikan 2024 (Kementerian ESDM)", halaman: tt("sumber.tabel_esdm"), url: "https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf", tanggal: d.dibangun_pada, tahun: 2024 }),
  idm: () => ({ sumber: "Indeks Desa Membangun 2024 (Kemendes PDTT)", url: "https://satudata.kemendesa.go.id/dataset/data-indeks-desa-membangun-tahun-2024", tanggal: d.dibangun_pada, tahun: 2024 }),
  proyek: () => ({ sumber: tt("sumber.proyek"), url: "/proyek", tanggal: d.dibangun_pada, tahun: 2026 }),
};
const dok = (k) => d.dok[k];
const pasalHtml = (psl) => psl.map((x) => `${tautan(dok(x.dok).pdf, dok(x.dok).nama)}: ${esc(x.pasal)}`).join("; ");

function ubin() {
  const top = [...d.provinsi].filter((p) => p.peringkat).sort((a, z) => a.peringkat - z.peringkat)[0], hk = d.hidro_kecil.reduce((s, h) => s + h.mw, 0);
  $("ubin").innerHTML = ubinHtml([
    { ikon: "lokasi", nilai: num(d.nasional.non_pln), label: tt("ubin.nonpln"), href: "#peta" },
    { ikon: "tek-listrik", nilai: num(d.hidro_kecil.length), label: tt("ubin.hidro", { mw: num(hk) }), href: "#hidro", turunan: true },
    { ikon: "orang", nilai: num(d.langkah.length), label: tt("ubin.langkah"), href: "#koperasi" },
  ]);
  void top;
}

async function bagPeta() {
  const ada = d.provinsi.filter((p) => p.kerentanan != null).sort((a, z) => a.peringkat - z.peringkat), top = ada[0];
  const peta = new Map(ada.map((p) => [p.kode, { nilai: p.kerentanan, teks: `${num(p.kerentanan, 2)}; ${persen(p.persen_non_pln, 1)} ${tt("peta.nonpln")}` }]));
  const bar = batangHtml(ada.slice(0, 10).map((p) => ({ id: p.kode, label: p.nama, labelHtml: namaL(p), bagian: [{ nilai: p.persen_non_pln ?? 0, kelas: "jm-an-c1" }], teks: `${persen(p.persen_non_pln, 1)} (${num(p.non_pln)}/${num(p.jumlah_desa)})` })), { maks: 100, label: tt("peta.bar"), satuan: "%" });
  const mp = await petaHtml(peta, { nama, lebar: Math.min(760, ($("isi").clientWidth || 640) - 8) });
  $("s-peta").innerHTML = seksi({
    id: "peta", ik: "peta", topik: tt("peta.topik"), judul: tt("peta.judul", { top: top.nama, v: num(top.persen_non_pln, 1), n: num(d.nasional.non_pln) }), sub: tt("peta.sub"), csv: true,
    isi: `${narasi(tt("peta.narasi"))}<div class="inf-grid"><div>${mp}</div><div><h3 class="jm-bantu">${esc(tt("peta.bar"))}</h3>${bar}</div></div><div id="t-peta"></div>${catatan(tt("peta.hipotesis"))}${butuhDaftar(d.butuh_unduhan, ["podes"])}${sumber([SUM.esdm(), SUM.idm()])}`,
  });
  pasangBar($("s-peta"));
  tabel($("t-peta"), { baris: d.provinsi, per: 10, urut: { k: "peringkat", arah: 1 }, label: tt("peta.topik"), kolom: [
    { k: "peringkat", label: tt("tabel.peringkat"), num: true, v: (p) => p.peringkat ?? null, f: (p) => (p.peringkat ? num(p.peringkat) : "-") },
    { k: "nama", label: tt("tabel.provinsi"), v: (p) => p.nama, f: namaL },
    { k: "jumlah", label: tt("tabel.desa"), num: true, v: (p) => p.jumlah_desa, f: (p) => num(p.jumlah_desa) },
    { k: "nonpln", label: tt("tabel.nonpln"), num: true, v: (p) => p.non_pln, f: (p) => num(p.non_pln) },
    { k: "pnon", label: tt("tabel.persen_nonpln"), num: true, v: (p) => p.persen_non_pln, f: (p) => persen(p.persen_non_pln, 1) },
    { k: "ptert", label: tt("tabel.persen_tert"), num: true, v: (p) => p.persen_tertinggal, f: (p) => persen(p.persen_tertinggal, 1) },
    { k: "skor", label: tt("tabel.kerentanan"), num: true, v: (p) => p.kerentanan, f: (p) => (p.kerentanan == null ? "-" : num(p.kerentanan, 2)) },
  ] });
}

function bagHidro() {
  const per = d.provinsi.filter((p) => p.hidro_kecil_n > 0).sort((a, z) => z.hidro_kecil_mw - a.hidro_kecil_mw), top = per[0], total = d.hidro_kecil.reduce((s, h) => s + h.mw, 0);
  const bar = batangHtml(per.slice(0, 10).map((p) => ({ id: p.kode, label: p.nama, labelHtml: namaL(p), bagian: [{ nilai: p.hidro_kecil_mw, kelas: "jm-an-c3" }], teks: `${num(p.hidro_kecil_mw, 1)} MW (${num(p.hidro_kecil_n)})` })), { label: tt("hidro.bar"), satuan: "MW" });
  $("s-hidro").innerHTML = seksi({
    id: "hidro", ik: "tek-surya", topik: tt("hidro.topik"), judul: tt("hidro.judul", { n: d.hidro_kecil.length, mw: num(total), top: top.nama, batas: d.batas_hidro_kecil_mw }), sub: tt("hidro.sub"), csv: true,
    isi: `${narasi(tt("hidro.narasi", { batas: d.batas_hidro_kecil_mw }))}<h3 class="jm-bantu">${esc(tt("hidro.bar"))}</h3>${bar}<div id="t-hidro"></div>${catatan(tt("hidro.catatan"))}${butuhDaftar(d.butuh_unduhan, ["mikrohidro_potensi"])}${sumber([SUM.proyek(), { sumber: "AMDALNET (pengumuman)", url: "https://amdalnet.kemenlh.go.id/", tanggal: d.dibangun_pada, tahun: 2026 }])}`,
  });
  pasangBar($("s-hidro"));
  tabel($("t-hidro"), { baris: d.hidro_kecil, per: 10, urut: { k: "mw", arah: -1 }, label: tt("hidro.topik"), kolom: [
    { k: "nama", label: tt("tabel.nama"), v: (h) => h.nama, f: (h) => (url(h.url) ? tautan(h.url, h.nama) : esc(h.nama)) },
    { k: "prov", label: tt("tabel.provinsi"), v: (h) => (h.kode ? nama(h.kode) : null), f: (h) => (h.kode ? namaL({ kode: h.kode, nama: nama(h.kode) }) : "-") },
    { k: "kab", label: tt("tabel.kabkota"), v: (h) => h.kab },
    { k: "mw", label: tt("tabel.kapasitas"), num: true, v: (h) => h.mw, f: (h) => num(h.mw, 1) },
    { k: "status", label: tt("tabel.status"), tengah: true, v: (h) => tt("sp." + (h.status || "tidak")), f: (h) => labelPil("sp." + (h.status || "tidak"), h.status === "beroperasi" ? "ok" : "warn") },
  ] });
}

function bagMandiri() {
  const n = d.idm_nasional, tot = n.total_desa_lapor;
  const bar = batangHtml(["mandiri", "maju", "berkembang", "tertinggal", "sangat_tertinggal"].map((k) => ({ id: k, label: tt("idm." + k), bagian: [{ nilai: n[k], kelas: k === "tertinggal" || k === "sangat_tertinggal" ? "jm-an-c2" : "jm-an-c1" }], teks: `${num(n[k])} (${persen((n[k] / tot) * 100, 1)})` })), { label: tt("mandiri.bar") });
  $("s-mandiri").innerHTML = seksi({
    id: "mandiri", ik: "kajian", topik: tt("mandiri.topik"), judul: tt("mandiri.judul", { n: num(n.mandiri), tot: num(tot) }), sub: tt("mandiri.sub"),
    isi: `${narasi(tt("mandiri.narasi"))}<h3 class="jm-bantu">${esc(tt("mandiri.bar"))}</h3>${bar}${butuhDaftar(d.butuh_unduhan, ["desa_mandiri", "sekolah_puskesmas"])}${sumber([SUM.idm()])}`,
  });
  pasangBar($("s-mandiri"));
}

function bagKoperasi() {
  const langkah = d.langkah.map((l) => `<li><h3>${esc(L(l.judul))}</h3><p>${esc(L(l.isi))}</p><p class="inf-pasal">${pasalHtml(l.pasal)}</p></li>`).join("");
  const contoh = d.contoh_koperasi.map((c) => `<li><b>${esc(L(c.teks))}</b><span>${esc(c.tgl)} ${tautan(c.url, tt("kop.sumber"))}</span></li>`).join("");
  $("s-koperasi").innerHTML = seksi({
    id: "koperasi", ik: "orang", topik: tt("kop.topik"), judul: tt("kop.judul", { n: d.langkah.length }), turunan: false, sub: tt("kop.sub"),
    isi: `${narasi(tt("kop.narasi"))}<ol class="inf-langkah">${langkah}</ol>${contoh ? `<h3 class="jm-bantu">${esc(tt("kop.contoh"))}</h3><ul class="inf-daftar">${contoh}</ul>` : ""}${catatan(tt("kop.catatan"))}${sumber(["uu25", "m11", "m2", "p112"].map((k) => ({ sumber: dok(k).nama, url: dok(k).url, tanggal: d.dibangun_pada })))}`,
  });
}

function bagPembiayaan() {
  $("s-biaya").innerHTML = seksi({
    id: "pembiayaan", ik: "kartu", topik: tt("biaya.topik"), judul: tt("biaya.judul", { n: d.pembiayaan.length }), turunan: false, sub: tt("biaya.sub"), csv: true,
    isi: `${narasi(tt("biaya.narasi"))}<div id="t-biaya"></div>${catatan(L(d.celah_pembiayaan))}${sumber([{ sumber: tt("sumber.pendanaan"), url: "/pendanaan", tanggal: d.dibangun_pada, tahun: 2026 }, { sumber: dok("uu25").nama, halaman: "Pasal 41", url: dok("uu25").url, tanggal: d.dibangun_pada }])}`,
  });
  tabel($("t-biaya"), { baris: d.pembiayaan, per: 8, urut: { k: "nama", arah: 1 }, label: tt("biaya.topik"), kolom: [
    { k: "nama", label: tt("tabel.skema"), v: (p) => p.nama, f: (p) => tautan(p.url, p.nama) },
    { k: "pemberi", label: tt("tabel.pemberi"), v: (p) => p.pemberi },
    { k: "jenis", label: tt("tabel.jenis"), tengah: true, v: (p) => p.jenis },
    { k: "sasaran", label: tt("tabel.sasaran"), v: (p) => p.sasaran.join(", ") },
    { k: "uraian", label: tt("tabel.uraian"), v: (p) => p.uraian },
  ] });
}

function bagMetode() {
  $("s-metode").innerHTML = seksi({ id: "metode", ik: "metode", topik: tt("metode.topik"), judul: tt("metode.judul"), turunan: false, sub: tt("metode.sub"), isi: `${narasi(tt("metode.kerentanan"))}${narasi(tt("metode.hidro", { batas: d.batas_hidro_kecil_mw }))}${catatan(tt("metode.tanggal", { tanggal: tgl(d.dibangun_pada) }))}` });
}

async function gambar() {
  ubin();
  for (const id of ["s-peta", "s-hidro", "s-mandiri", "s-koperasi", "s-biaya", "s-metode"]) if (!$(id)) $("isi").insertAdjacentHTML("beforeend", `<div id="${id}"></div>`);
  bagHidro(); bagMandiri(); bagKoperasi(); bagPembiayaan(); bagMetode();
  await bagPeta();
  document.querySelectorAll("[data-k]").forEach((e) => { e.textContent = tt(e.dataset.k); });
  document.title = tt("judul.halaman");
}

(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { [d] = await Promise.all([muatData("desa_akses.json"), muatTeks("desa")]); } catch (e) { tampilGalat($("isi"), () => location.reload()); return; }
  $("isi").innerHTML = "";
  await gambar();
  saatBahasa(() => gambar());
  if (location.hash) $(location.hash.slice(1))?.scrollIntoView();
})();
