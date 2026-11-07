/* /pemda: paket informasi pemerintah daerah. Data statis /data/paket_pemda.json (dibangun scripts/pipa/paket_pemda.mjs), teks di /data/teks_pemda.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, hantuHtml } from "/inti/umum.js";
import { muatData, tampilGalat, batangHtml, pasangBar, ubinHtml } from "/analisis.js";
import { muatTeks, tt, num, tgl, persen, tautan, url, seksi, catatan, narasi, sumber, butuhDaftar, tabel, petaHtml, pasangPeta, lambang, labelPil, saatBahasa } from "/info_kerangka.js";

const $ = (id) => document.getElementById(id);
let d = null, pilihKode = "11";
const nama = (k) => d.provinsi.find((p) => p.kode === k)?.nama ?? k;
const median = (v) => { const a = v.filter((x) => x != null).sort((x, y) => x - y); return a.length ? (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2) : null; };
const namaL = (p) => `<span class="inf-nama">${lambang(p.kode)}${esc(p.nama)}</span>`;
const tkPil = (tk) => (tk ? labelPil("tk." + tk, { siap: "ok", berkembang: "warn", awal: "bad" }[tk]) : "-");
const stPil = (st) => (st ? labelPil("st." + st, { tercapai: "ok", "di-jalur": "warn", tertinggal: "bad" }[st]) : "-");
const SUMBER_UTAMA = () => d.sumber.map((s) => ({ sumber: s.judul, halaman: s.penerbit, url: s.url, tanggal: d.dibangun_pada, tahun: s.tahun }));

function ubin() {
  const siap = d.provinsi.filter((p) => p.indeks.tingkat === "siap").length, ruedN = d.provinsi.filter((p) => p.rued).length, kontakN = d.provinsi.filter((p) => p.kontak.length).length;
  $("ubin").innerHTML = ubinHtml([
    { ikon: "gedung", nilai: `${siap}/${d.jumlah}`, label: tt("ubin.siap"), href: "#indeks", turunan: true },
    { ikon: "palu", nilai: `${ruedN}/${d.jumlah}`, label: tt("ubin.rued"), href: "#kebijakan" },
    { ikon: "orang", nilai: `${kontakN}/${d.jumlah}`, label: tt("ubin.kontak"), href: "#kontak" },
  ]);
}

async function bagIndeks() {
  const urut = d.provinsi.filter((p) => p.indeks.skor != null).sort((a, z) => z.indeks.skor - a.indeks.skor), top = urut[0];
  const siap = urut.filter((p) => p.indeks.tingkat === "siap").length;
  const peta = new Map(urut.map((p) => [p.kode, { nilai: p.indeks.skor, teks: `${num(p.indeks.skor, 2)} (${tt("tk." + p.indeks.tingkat)})` }]));
  const bar = batangHtml(urut.slice(0, 10).map((p) => ({ id: p.kode, label: p.nama, labelHtml: namaL(p), sorot: false, bagian: [{ nilai: p.indeks.skor, kelas: "jm-an-c1" }], teks: num(p.indeks.skor, 2) })), { maks: 1, label: tt("indeks.bar") });
  const lebar = Math.min(760, ($("isi").clientWidth || 640) - 8);
  const mp = await petaHtml(peta, { nama, lebar });
  $("s-indeks").innerHTML = seksi({
    id: "indeks", ik: "grafik", topik: tt("indeks.topik"), judul: tt("indeks.judul", { n: siap, total: urut.length, top: top.nama, skor: num(top.indeks.skor, 2) }), sub: tt("indeks.sub"), csv: true,
    isi: `${narasi(tt("indeks.narasi"))}<div class="inf-grid"><div>${mp}${catatan(tt("indeks.klik"))}</div><div><h3 class="jm-bantu">${esc(tt("indeks.bar"))}</h3>${bar}</div></div><div id="t-indeks"></div>${catatan(tt("indeks.hipotesis"))}${sumber(SUMBER_UTAMA())}`,
  });
  pasangBar($("s-indeks"));
  pasangPeta($("s-indeks"), (k) => pilihProv(k));
  const k = (c) => ({ k: c, label: tt("komp." + c), num: true, v: (p) => { const x = p.indeks.komponen.find((y) => y.k === c)?.norm; return x == null ? null : Math.round(x * 100); }, f: (p) => { const x = p.indeks.komponen.find((y) => y.k === c)?.norm; return x == null ? esc(tt("tabel.kosong")) : num(x * 100); } });
  tabel($("t-indeks"), { baris: urut, per: 10, urut: { k: "peringkat", arah: 1 }, label: tt("indeks.topik"), satuan: "jm.pag.u.data", kolom: [
    { k: "peringkat", label: tt("tabel.peringkat"), num: true, v: (p) => p.indeks.peringkat, f: (p) => num(p.indeks.peringkat) },
    { k: "nama", label: tt("tabel.provinsi"), v: (p) => p.nama, f: namaL },
    { k: "skor", label: tt("tabel.skor"), num: true, v: (p) => p.indeks.skor, f: (p) => num(p.indeks.skor, 2) },
    { k: "tingkat", label: tt("tabel.tingkat"), tengah: true, v: (p) => p.indeks.skor, f: (p) => tkPil(p.indeks.tingkat) },
    ...Object.keys(d.metode.bobot).map(k),
  ] });
}

function bagRapor() {
  const ada = d.provinsi.filter((p) => p.rued?.status), tert = ada.filter((p) => p.rued.status === "tertinggal").length;
  $("s-rapor").innerHTML = seksi({
    id: "rapor", ik: "kajian", topik: tt("rapor.topik"), judul: tt("rapor.judul", { n: tert, m: ada.length, periode: d.periode }), sub: tt("rapor.sub"), csv: true,
    isi: `${narasi(tt("rapor.narasi"))}<div id="t-rapor"></div>${sumber(SUMBER_UTAMA())}`,
  });
  tabel($("t-rapor"), { baris: d.provinsi, per: 10, urut: { k: "nama", arah: 1 }, label: tt("rapor.topik"), kolom: [
    { k: "nama", label: tt("tabel.provinsi"), v: (p) => p.nama, f: namaL },
    { k: "status", label: tt("tabel.status_rued"), tengah: true, v: (p) => p.rued?.rasio_persen ?? null, f: (p) => stPil(p.rued?.status) },
    { k: "rasio", label: tt("tabel.elektrifikasi"), num: true, v: (p) => p.listrik?.rasio ?? null, f: (p) => persen(p.listrik?.rasio, 2) },
    { k: "nonpln", label: tt("tabel.desa_nonpln"), num: true, v: (p) => p.desa?.non_pln ?? null, f: (p) => num(p.desa?.non_pln) },
    { k: "pipeline", label: tt("tabel.pipeline"), num: true, v: (p) => p.proyek.mw, f: (p) => num(p.proyek.mw) },
    { k: "operasi", label: tt("tabel.operasi"), num: true, v: (p) => p.proyek.operasi_mw, f: (p) => num(p.proyek.operasi_mw) },
    { k: "amdal", label: tt("tabel.amdal"), num: true, v: (p) => p.amdal_n, f: (p) => num(p.amdal_n) },
    { k: "pvout", label: tt("tabel.pvout"), num: true, v: (p) => p.pvout, f: (p) => num(p.pvout) },
  ] });
}

function lembarIsi(p) {
  const kv = (l, v) => `<div class="inf-ubin"><b>${v}</b><span>${esc(l)}</span></div>`;
  const r = p.rued, ind = p.indeks;
  const baca = [];
  baca.push(r ? tt("lembar.b_rued", { perda: r.perda, t: num(r.target_2025, 1), r: persen(r.realisasi, 1), s: tt("st." + (r.status || "tertinggal")) }) : tt("lembar.b_norued"));
  baca.push(tt("lembar.b_pipa", { mw: num(p.proyek.mw), op: num(p.proyek.operasi_mw), n: num(p.proyek.n) }));
  baca.push(p.desa ? tt("lembar.b_desa", { n: num(p.desa.non_pln), j: num(p.desa.jumlah) }) : tt("lembar.b_nodesa"));
  return `<div class="inf-lembar-kop">${lambang(p.kode, 44)}<div><h3>${esc(p.nama)}</h3><p class="jm-bantu">${esc(tt("lembar.periode", { periode: d.periode }))}</p></div>${tkPil(ind.tingkat)}</div>
  <div class="inf-baris-kv">${kv(tt("lembar.skor"), `${num(ind.skor, 2)}${ind.peringkat ? ` (${num(ind.peringkat)}/${d.jumlah})` : ""}`)}${kv(tt("tabel.elektrifikasi"), persen(p.listrik?.rasio, 2))}${kv(tt("tabel.pipeline"), `${num(p.proyek.mw)} MW`)}${kv(tt("tabel.operasi"), `${num(p.proyek.operasi_mw)} MW`)}${kv(tt("tabel.desa_nonpln"), num(p.desa?.non_pln))}${kv(tt("lembar.emisi"), p.emisi ? `${num(p.emisi.tco2e / 1e6, 1)} Mt` : "-")}</div>
  <div><h4>${esc(tt("lembar.baca"))}</h4>${baca.map((b) => `<p>${esc(b)}</p>`).join("")}</div>
  <div><h4>${esc(tt("lembar.dasar"))}</h4><p>${esc(tt("lembar.dasar_isi"))} ${tautan("https://peraturan.bpk.go.id/Details/225308", "Perpres 112/2022")}</p></div>
  <div><h4>${esc(tt("lembar.kosong"))}</h4><p>${esc(tt("lembar.kosong_isi"))}</p></div>
  <p class="jm-bantu">${esc(tt("lembar.kaki", { tanggal: tgl(d.dibangun_pada) }))}${r ? ` ${tautan(r.url, tt("lembar.perda_tautan"))}` : ""}</p>`;
}
function bagLembar() {
  const opsi = d.provinsi.map((p) => `<option value="${p.kode}"${p.kode === pilihKode ? " selected" : ""}>${esc(p.nama)}</option>`).join("");
  $("s-lembar").innerHTML = seksi({
    id: "lembar", ik: "buku", kelas: "inf-cetak", topik: tt("lembar.topik"), judul: tt("lembar.judul", { n: d.jumlah }), sub: tt("lembar.sub"), turunan: false,
    isi: `${narasi(tt("lembar.narasi"))}<div class="inf-sel"><label class="jm-pil-pilih"><select id="pilih-prov" aria-label="${esc(tt("tabel.provinsi"))}">${opsi}</select></label><button type="button" class="jm-tbl" id="cetak">${esc(tt("lembar.cetak"))}</button></div><article class="inf-lembar" id="lembar-isi" aria-live="polite">${lembarIsi(d.provinsi.find((p) => p.kode === pilihKode))}</article>`,
  });
  $("pilih-prov").addEventListener("change", (e) => pilihProv(e.target.value, false));
  $("cetak").addEventListener("click", () => {
    document.body.classList.add("inf-cetak-lembar");
    addEventListener("afterprint", () => document.body.classList.remove("inf-cetak-lembar"), { once: true });
    window.print();
  });
}
function pilihProv(kode, gulir = true) {
  pilihKode = kode;
  const sel = $("pilih-prov"); if (sel) sel.value = kode;
  $("lembar-isi").innerHTML = lembarIsi(d.provinsi.find((p) => p.kode === kode));
  document.querySelectorAll(".inf-pv").forEach((e) => e.classList.toggle("on", e.dataset.kode === kode));
  if (gulir) $("lembar").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

function bagKebijakan() {
  const ada = d.provinsi.filter((p) => p.rued), med = median(ada.map((p) => p.rued.target_2025));
  const selisih = ada.filter((p) => p.rued.target_2025 != null && p.rued.realisasi != null).map((p) => ({ p, gap: p.rued.target_2025 - p.rued.realisasi })).sort((a, z) => z.gap - a.gap).slice(0, 10);
  const bar = batangHtml(selisih.map(({ p, gap }) => ({ id: p.kode, label: p.nama, labelHtml: namaL(p), bagian: [{ nilai: Math.max(0, gap), kelas: "jm-an-c2" }], teks: `${num(gap, 1)} ${tt("satuan.poin")} (${persen(p.rued.realisasi, 1)} / ${persen(p.rued.target_2025, 1)})` })), { label: tt("kebijakan.bar"), satuan: tt("satuan.poin") });
  $("s-kebijakan").innerHTML = seksi({
    id: "kebijakan", ik: "palu", topik: tt("kebijakan.topik"), judul: tt("kebijakan.judul", { n: ada.length, total: d.jumlah, med: num(med, 1) }), sub: tt("kebijakan.sub"), csv: true,
    isi: `${narasi(tt("kebijakan.narasi"))}<h3 class="jm-bantu">${esc(tt("kebijakan.bar"))}</h3>${bar}<div id="t-kebijakan"></div>${catatan(tt("kebijakan.catatan"))}${sumber([{ sumber: "Perda RUED provinsi (peraturan.bpk.go.id)", halaman: tt("kebijakan.hal"), url: "https://peraturan.bpk.go.id/", tanggal: d.dibangun_pada, tahun: 2025 }, ...SUMBER_UTAMA().slice(1, 2)])}`,
  });
  pasangBar($("s-kebijakan"));
  tabel($("t-kebijakan"), { baris: d.provinsi, per: 10, urut: { k: "nama", arah: 1 }, label: tt("kebijakan.topik"), kolom: [
    { k: "nama", label: tt("tabel.provinsi"), v: (p) => p.nama, f: namaL },
    { k: "perda", label: tt("tabel.perda"), tengah: true, v: (p) => p.rued?.perda ?? null, f: (p) => (p.rued ? tautan(p.rued.url, p.rued.perda) : esc(tt("tabel.kosong"))) },
    { k: "t25", label: tt("tabel.target25"), num: true, v: (p) => p.rued?.target_2025 ?? null, f: (p) => persen(p.rued?.target_2025, 1) },
    { k: "takhir", label: tt("tabel.target_akhir"), num: true, v: (p) => p.rued?.target_akhir?.persen ?? null, f: (p) => (p.rued?.target_akhir ? `${persen(p.rued.target_akhir.persen, 1)} (${p.rued.target_akhir.tahun})` : "-") },
    { k: "real", label: tt("tabel.realisasi"), num: true, v: (p) => p.rued?.realisasi ?? null, f: (p) => persen(p.rued?.realisasi, 1) },
    { k: "status", label: tt("tabel.status_rued"), tengah: true, v: (p) => p.rued?.rasio_persen ?? null, f: (p) => stPil(p.rued?.status) },
    { k: "izin", label: tt("tabel.perda_izin"), num: true, v: (p) => p.perda.perizinan, f: (p) => num(p.perda.perizinan) },
    { k: "ins", label: tt("tabel.perda_insentif"), num: true, v: (p) => p.perda.insentif, f: (p) => num(p.perda.insentif) },
    { k: "renc", label: tt("tabel.perda_renc"), num: true, v: (p) => p.perda.perencanaan, f: (p) => num(p.perda.perencanaan) },
  ] });
}

function bagAnggaran() {
  $("s-anggaran").innerHTML = seksi({ id: "anggaran", ik: "tabel", topik: tt("anggaran.topik"), judul: tt("anggaran.judul"), turunan: false, sub: tt("anggaran.sub"), isi: `${narasi(tt("anggaran.narasi"))}${butuhDaftar(d.butuh_unduhan, ["apbd"])}` });
}

function bagKabkota() {
  const top = d.kabkota[0], punya = d.kabkota.length;
  $("s-kabkota").innerHTML = seksi({
    id: "kabkota", ik: "lokasi", topik: tt("kab.topik"), judul: tt("kab.judul", { n: punya, top: top.nama, mw: num(top.proyek_mw) }), sub: tt("kab.sub"), csv: true,
    isi: `${narasi(tt("kab.narasi"))}<div id="t-kab"></div>${catatan(tt("kab.catatan"))}${butuhDaftar(d.butuh_unduhan, ["bps_kab"])}${sumber(SUMBER_UTAMA().slice(2, 4))}`,
  });
  tabel($("t-kab"), { baris: d.kabkota, per: 10, urut: { k: "mw", arah: -1 }, label: tt("kab.topik"), kolom: [
    { k: "nama", label: tt("tabel.kabkota"), v: (k) => k.nama },
    { k: "prov", label: tt("tabel.provinsi"), v: (k) => (k.kode ? nama(k.kode) : null), f: (k) => (k.kode ? namaL({ kode: k.kode, nama: nama(k.kode) }) : esc(tt("tabel.kosong"))) },
    { k: "n", label: tt("tabel.proyek_n"), num: true, v: (k) => k.proyek_n, f: (k) => num(k.proyek_n) },
    { k: "mw", label: tt("tabel.pipeline"), num: true, v: (k) => k.proyek_mw, f: (k) => num(k.proyek_mw) },
    { k: "amdal", label: tt("tabel.amdal"), num: true, v: (k) => k.amdal_n, f: (k) => num(k.amdal_n) },
    { k: "perda", label: tt("tabel.perda_n"), num: true, v: (k) => k.perda_n, f: (k) => num(k.perda_n) },
  ] });
}

function bagKontak() {
  const ada = d.provinsi.filter((p) => p.kontak.length);
  $("s-kontak").innerHTML = seksi({
    id: "kontak", ik: "orang", topik: tt("kontak.topik"), judul: tt("kontak.judul", { n: ada.length, total: d.jumlah }), turunan: false, sub: tt("kontak.sub"), csv: true,
    isi: `${narasi(tt("kontak.narasi"))}<div id="t-kontak"></div>${butuhDaftar(d.butuh_unduhan, ["kontak"])}${sumber([SUMBER_UTAMA()[4]])}`,
  });
  tabel($("t-kontak"), { baris: d.provinsi, per: 10, urut: { k: "nama", arah: 1 }, label: tt("kontak.topik"), kolom: [
    { k: "nama", label: tt("tabel.provinsi"), v: (p) => p.nama, f: namaL },
    { k: "dinas", label: tt("tabel.dinas"), v: (p) => p.kontak[0]?.nama ?? null, f: (p) => (p.kontak.length ? p.kontak.map((c) => esc(c.nama)).join("<br>") : labelPil("kontak.belum", "warn")) },
    { k: "kota", label: tt("tabel.kota"), v: (p) => p.kontak[0]?.kota ?? null },
    { k: "situs", label: tt("tabel.situs"), v: (p) => p.kontak[0]?.situs ?? null, f: (p) => (p.kontak.length ? p.kontak.filter((c) => url(c.situs)).map((c) => tautan(c.situs, c.situs.replace(/^https:\/\//, "").replace(/\/$/, ""))).join("<br>") : esc(tt("tabel.kosong"))) },
    { k: "diperiksa", label: tt("tabel.diperiksa"), v: (p) => p.kontak[0]?.diperiksa ?? null, f: (p) => (p.kontak[0]?.diperiksa ? esc(tgl(p.kontak[0].diperiksa)) : esc(tt("tabel.kosong"))) },
  ] });
}

function bagGrk() {
  const ada = d.provinsi.filter((p) => p.emisi).sort((a, z) => z.emisi.tco2e - a.emisi.tco2e), top = ada[0];
  const bar = batangHtml(ada.slice(0, 10).map((p) => ({ id: p.kode, label: p.nama, labelHtml: namaL(p), bagian: [{ nilai: p.emisi.tco2e / 1e6, kelas: "jm-an-c3" }], teks: `${num(p.emisi.tco2e / 1e6, 1)} Mt` })), { label: tt("grk.bar"), satuan: "Mt" });
  $("s-grk").innerHTML = seksi({
    id: "grk", ik: "kompas", topik: tt("grk.topik"), judul: tt("grk.judul", { top: top.nama, mt: num(top.emisi.tco2e / 1e6, 1), tahun: top.emisi.tahun }), sub: tt("grk.sub"), csv: true,
    isi: `${narasi(tt("grk.narasi"))}<h3 class="jm-bantu">${esc(tt("grk.bar"))}</h3>${bar}<div id="t-grk"></div>${butuhDaftar(d.butuh_unduhan, ["grk"])}${sumber([SUMBER_UTAMA()[5]])}`,
  });
  pasangBar($("s-grk"));
  tabel($("t-grk"), { baris: d.provinsi, per: 10, urut: { k: "emisi", arah: -1 }, label: tt("grk.topik"), kolom: [
    { k: "nama", label: tt("tabel.provinsi"), v: (p) => p.nama, f: namaL },
    { k: "emisi", label: tt("tabel.emisi"), num: true, v: (p) => p.emisi?.tco2e ?? null, f: (p) => (p.emisi ? num(p.emisi.tco2e / 1e6, 2) : esc(tt("tabel.kosong"))) },
    { k: "karbon", label: tt("tabel.perda_karbon"), num: true, v: (p) => p.perda.karbon, f: (p) => num(p.perda.karbon) },
    { k: "lapor", label: tt("tabel.lapor"), tengah: true, v: () => null, f: () => labelPil("butuh.pil", "warn") },
  ] });
}

function bagMetode() {
  const b = d.metode.bobot;
  $("s-metode").innerHTML = seksi({
    id: "metode", ik: "metode", topik: tt("metode.topik"), judul: tt("metode.judul"), turunan: false, sub: tt("metode.sub"),
    isi: `${narasi(tt("metode.isi"))}<ul class="inf-daftar">${Object.keys(b).map((k) => `<li><b>${esc(tt("komp." + k))} (${num(b[k], 1)})</b><span>${esc(tt("kd." + k))}</span></li>`).join("")}</ul>${catatan(tt("metode.ambang", { siap: num(d.metode.ambang.siap, 2), kembang: num(d.metode.ambang.berkembang, 2), min: d.metode.min_komponen }))}${catatan(tt("metode.tanggal", { tanggal: tgl(d.dibangun_pada) }))}`,
  });
}

async function gambar() {
  ubin();
  for (const id of ["s-indeks", "s-rapor", "s-lembar", "s-kebijakan", "s-anggaran", "s-kabkota", "s-kontak", "s-grk", "s-metode"]) if (!$(id)) $("isi").insertAdjacentHTML("beforeend", `<div id="${id}"></div>`);
  bagRapor(); bagLembar(); bagKebijakan(); bagAnggaran(); bagKabkota(); bagKontak(); bagGrk(); bagMetode();
  await bagIndeks();
  document.querySelectorAll("[data-k]").forEach((e) => { e.textContent = tt(e.dataset.k); });
  document.title = tt("judul.halaman");
}

(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try {
    [d] = await Promise.all([muatData("paket_pemda.json"), muatTeks("pemda")]);
  } catch (e) { tampilGalat($("isi"), () => location.reload()); return; }
  $("isi").innerHTML = "";
  await gambar();
  saatBahasa(() => gambar());
  if (location.hash) $(location.hash.slice(1))?.scrollIntoView();
})();
