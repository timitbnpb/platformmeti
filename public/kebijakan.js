/* /kebijakan: pelacak rancangan dan program, arsip masukan METI (yang publik), dampak aturan, pelengkap ASEAN, pemetaan target dan NDC, ringkasan satu halaman.
   Data /data/kebijakan_info.json (scripts/pipa/kebijakan_info.mjs); teks /data/teks_kebijakan.json. Hanya informasi. */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, hantuHtml } from "/inti/umum.js";
import { muatData, tampilGalat, batangHtml, pasangBar, ubinHtml } from "/analisis.js";
import { muatTeks, tt, L, num, tgl, tautan, url, seksi, catatan, narasi, sumber, butuhDaftar, tabel, labelPil, garisSvg, saatBahasa } from "/info_kerangka.js";

const $ = (id) => document.getElementById(id);
let d = null;
const SUM = () => [{ sumber: tt("sumber.direktori"), url: "/regulasi", tanggal: d.dibangun_pada, tahun: 2026 }];
const tahapPil = (tp) => labelPil("th." + tp, { konstruksi: "ok", berjalan: "ok", lelang: "warn", pembahasan: "warn", rencana: "bad" }[tp] || "warn");
const sumberT = (id) => d.target_sumber[id] || { judul: id, url: null };
const hitung = (arr, f) => arr.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
const puncak = (m) => Object.entries(m).sort((a, z) => z[1] - a[1])[0];

function ubin() {
  $("ubin").innerHTML = ubinHtml([
    { ikon: "linimasa", nilai: num(d.pelacak.length + d.program.length), label: tt("ubin.dilacak"), href: "#pelacak" },
    { ikon: "buku", nilai: num(d.regulasi_terbaru.length), label: tt("ubin.aturan"), href: "#dampak", turunan: true },
    { ikon: "kompas", nilai: num(d.target.length), label: tt("ubin.target"), href: "#target" },
  ]);
}

function bagPelacak() {
  const lintas = (r) => `<div class="inf-lintasan" role="list">${r.langkah.map((l) => `<span role="listitem" class="${l === r.tahap ? "on" : ""}">${esc(tt("lk." + l))}</span>`).join("")}</div>`;
  const kartu = d.pelacak.map((r) => `<li><b>${esc(r.nama)}</b>${lintas(r)}<span>${esc(tt("pelacak.status", { tahap: tt("lk." + r.tahap), instansi: r.instansi, tanggal: tgl(r.tanggal) }))} ${r.url ? tautan(r.url, tt("pelacak.sumber")) : ""} ${labelPil("pelacak.belum_dpr")}</span></li>`).join("");
  const per = hitung(d.program, (p) => p.tahap), [tp, n] = puncak(per);
  $("s-pelacak").innerHTML = seksi({
    id: "pelacak", ik: "linimasa", topik: tt("pelacak.topik"), judul: tt("pelacak.judul", { n: d.pelacak.length, m: d.program.length, tahap: tt("th." + tp), k: n }), sub: tt("pelacak.sub"), csv: true,
    isi: `${narasi(tt("pelacak.narasi"))}<ul class="inf-daftar">${kartu}</ul><h3 class="jm-bantu">${esc(tt("pelacak.program"))}</h3><div id="t-program"></div>${butuhDaftar(d.butuh_unduhan, ["prolegnas"])}${sumber(SUM())}`,
  });
  tabel($("t-program"), { baris: d.program, per: 8, urut: { k: "nama", arah: 1 }, label: tt("pelacak.program"), kolom: [
    { k: "nama", label: tt("tabel.program"), v: (p) => L(p.nama) },
    { k: "tahap", label: tt("tabel.tahap"), tengah: true, v: (p) => tt("th." + p.tahap), f: (p) => tahapPil(p.tahap) },
    { k: "ket", label: tt("tabel.keterangan"), v: (p) => L(p.tahap_ket) },
    { k: "dasar", label: tt("tabel.dasar"), v: (p) => p.dasar.map((x) => x.nama).join(", "), f: (p) => p.dasar.slice(0, 3).map((x) => tautan(x.url, x.nama)).join("<br>") || "-" },
    { k: "tonggak", label: tt("tabel.tonggak"), v: (p) => p.tonggak_terakhir?.tgl ?? null, f: (p) => (p.tonggak_terakhir ? tautan(p.tonggak_terakhir.url, p.tonggak_terakhir.tgl) : "-") },
  ] });
}

function bagMasukan() {
  const ada = d.masukan.length + d.posisi.length;
  $("s-masukan").innerHTML = seksi({
    id: "masukan", ik: "bagikan", topik: tt("masukan.topik"), judul: tt("masukan.judul", { n: d.posisi.length, m: d.masukan.length }), turunan: false, sub: tt("masukan.sub"), csv: true,
    isi: `${narasi(tt("masukan.narasi"))}<ul class="inf-daftar">${d.masukan.map((m) => `<li><b>${esc(m.judul)}</b><span>${esc(tgl(m.tanggal))}${m.mitra.length ? ", " + esc(m.mitra.join(", ")) : ""} ${m.url ? tautan(m.url, tt("pelacak.sumber")) : esc(tt("masukan.arsip"))}</span></li>`).join("")}</ul><h3 class="jm-bantu">${esc(tt("masukan.posisi"))}</h3><div id="t-posisi"></div>${catatan(tt("masukan.catatan"))}${butuhDaftar(d.butuh_unduhan, ["masukan_lain"])}${sumber(SUM())}`,
  });
  void ada;
  const prog = (k) => L(d.program.find((p) => p.kode === k)?.nama) || k;
  tabel($("t-posisi"), { baris: d.posisi, per: 8, urut: { k: "program", arah: 1 }, label: tt("masukan.posisi"), kolom: [
    { k: "program", label: tt("tabel.program"), v: (r) => prog(r.program) },
    { k: "teks", label: tt("tabel.masukan"), v: (r) => L(r.teks) },
    { k: "sumber", label: tt("tabel.sumber"), v: (r) => r.sumber },
  ] });
}

function bagDampak() {
  const per = {};
  for (const r of d.regulasi_terbaru) for (const t of r.topik) per[t] = (per[t] || 0) + 1;
  const urut = Object.entries(per).sort((a, z) => z[1] - a[1]), [tp, n] = urut[0] || ["", 0];
  const bar = batangHtml(urut.slice(0, 8).map(([t, c]) => ({ id: t, label: tt("bd." + t), bagian: [{ nilai: c, kelas: "jm-an-c1" }], teks: `${num(c)} ${tt("satuan.aturan")}` })), { label: tt("dampak.bar") });
  $("s-dampak").innerHTML = seksi({
    id: "dampak", ik: "analisis", topik: tt("dampak.topik"), judul: tt("dampak.judul", { n: d.regulasi_terbaru.length, bidang: tt("bd." + tp), k: n }), sub: tt("dampak.sub"), csv: true,
    isi: `${narasi(tt("dampak.narasi"))}<h3 class="jm-bantu">${esc(tt("dampak.bar"))}</h3>${bar}<div id="t-dampak"></div>${catatan(tt("dampak.catatan"))}${sumber(SUM())}`,
  });
  pasangBar($("s-dampak"));
  tabel($("t-dampak"), { baris: d.regulasi_terbaru, per: 8, urut: { k: "tanggal", arah: -1 }, label: tt("dampak.topik"), kolom: [
    { k: "tanggal", label: tt("tabel.tanggal"), v: (r) => r.tanggal, f: (r) => esc(tgl(r.tanggal)) },
    { k: "aturan", label: tt("tabel.aturan"), v: (r) => `${tt("jr." + r.jenis)} ${r.nomor}/${r.tahun}`, f: (r) => tautan(r.url, `${tt("jr." + r.jenis)} ${r.nomor}/${r.tahun}`) },
    { k: "judul", label: tt("tabel.judul"), v: (r) => r.judul },
    { k: "bidang", label: tt("tabel.bidang"), v: (r) => r.topik.length, f: (r) => (r.topik.length ? r.topik.map((t) => labelPil("bd." + t, "ok")).join(" ") : esc(tt("dampak.umum"))) },
    { k: "pdf", label: tt("tabel.naskah"), tengah: true, v: () => null, f: (r) => (url(r.pdf) ? tautan(r.pdf, "PDF") : "-") },
  ] });
}

function bagAsean() {
  const ada = d.asean.filter((n) => n.karbon).sort((a, z) => z.karbon.nilai - a.karbon.nilai), idn = ada.findIndex((n) => n.iso3 === "IDN") + 1;
  const bar = batangHtml(ada.map((n) => ({ id: n.iso3, label: n.nama, sorot: n.iso3 === "IDN", bagian: [{ nilai: n.karbon.nilai, kelas: n.iso3 === "IDN" ? "jm-an-id" : "jm-an-c2" }], teks: `${num(n.karbon.nilai, 0)} g/kWh (${n.karbon.tahun})` })), { label: tt("asean.bar"), satuan: "g" });
  $("s-asean").innerHTML = seksi({
    id: "asean", ik: "asean", topik: tt("asean.topik"), judul: tt("asean.judul", { r: idn, n: ada.length, v: num(ada[idn - 1].karbon.nilai, 0) }), sub: tt("asean.sub"), csv: true,
    isi: `${narasi(tt("asean.narasi"))}<p class="inf-narasi"><a href="/asean">${esc(tt("asean.tautan"))}</a></p><h3 class="jm-bantu">${esc(tt("asean.bar"))}</h3>${bar}<div id="t-asean"></div>${butuhDaftar(d.butuh_unduhan, ["kebijakan_asean"])}${sumber([{ sumber: "Our World in Data energy-data (memuat Ember)", url: "https://github.com/owid/energy-data", tanggal: d.dibangun_pada, tahun: 2025 }])}`,
  });
  pasangBar($("s-asean"));
  tabel($("t-asean"), { baris: ada, per: 10, urut: { k: "karbon", arah: -1 }, label: tt("asean.topik"), kolom: [
    { k: "nama", label: tt("tabel.negara"), v: (n) => n.nama },
    { k: "karbon", label: tt("tabel.karbon"), num: true, v: (n) => n.karbon.nilai, f: (n) => num(n.karbon.nilai, 0) },
    { k: "batubara", label: tt("tabel.batubara"), num: true, v: (n) => n.batubara?.nilai ?? null, f: (n) => (n.batubara ? `${num(n.batubara.nilai, 1)}%` : "-") },
    { k: "ebt", label: tt("tabel.ebt"), num: true, v: (n) => n.ebt?.nilai ?? null, f: (n) => (n.ebt ? `${num(n.ebt.nilai, 1)}%` : "-") },
    { k: "twh", label: tt("tabel.twh"), num: true, v: (n) => n.twh?.nilai ?? null, f: (n) => (n.twh ? num(n.twh.nilai, 1) : "-") },
  ] });
}

const nilaiTarget = (x) => (x.min == null ? "-" : x.maks != null ? `${num(x.min, 2)} sampai ${num(x.maks, 2)}`.replace("sampai", tt("target.sampai")) : num(x.min, 2));
function bagTarget() {
  const seri = d.realisasi.pembangkitan_ebt_persen.map((p) => ({ x: p.tahun, y: p.nilai, teks: `${p.tahun}: ${num(p.nilai, 1)}%` }));
  const rup = d.target.find((x) => x.id === "ruptl-2034-bauran"), ndc = d.target.find((x) => x.id === "ndc-2030");
  const g = garisSvg({ titik: seri, ref: [{ y: rup.min, teks: tt("target.ref_ruptl", { v: num(rup.min, 1) }) }], lebar: Math.min(720, ($("isi").clientWidth || 640) - 40), label: tt("target.grafik") });
  const akhir = seri[seri.length - 1];
  $("s-target").innerHTML = seksi({
    id: "target", ik: "grafik", topik: tt("target.topik"), judul: tt("target.judul", { v: num(akhir.y, 1), tahun: akhir.x, t: num(rup.min, 1), ndc: num(ndc.min, 1) }), sub: tt("target.sub"), csv: true,
    isi: `${narasi(tt("target.narasi"))}<h3 class="jm-bantu">${esc(tt("target.grafik"))}</h3>${g}<div id="t-target"></div>${catatan(tt("target.catatan"))}${sumber(Object.values(d.target_sumber).slice(0, 4).map((s) => ({ sumber: s.judul, url: s.url, tanggal: d.dibangun_pada })))}`,
  });
  tabel($("t-target"), { baris: d.target, per: 8, urut: { k: "tahun", arah: 1 }, label: tt("target.topik"), kolom: [
    { k: "dokumen", label: tt("tabel.dokumen"), v: (x) => sumberT(x.dokumen).judul, f: (x) => tautan(sumberT(x.dokumen).url, sumberT(x.dokumen).judul) },
    { k: "ukuran", label: tt("tabel.ukuran"), v: (x) => tt("uk." + x.ukuran) },
    { k: "tahun", label: tt("tabel.tahun"), num: true, v: (x) => x.tahun, f: (x) => (x.tahun ? String(x.tahun) : "-") },
    { k: "nilai", label: tt("tabel.nilai"), num: true, v: (x) => x.min, f: (x) => esc(nilaiTarget(x)) },
    { k: "halaman", label: tt("tabel.halaman"), v: (x) => x.halaman },
  ] });
}

function bagRingkas() {
  const c = d.celah.find((x) => x.target_id === "ruptl-2034-kapasitas"), rup = d.target.find((x) => x.id === "ruptl-2034-kapasitas");
  const kunci = ["perpres-110-2025", "pp-40-2025", "perpres-89-2025", "pp-28-2025"].map((id) => d.regulasi_terbaru.find((r) => r.id === id)).filter(Boolean);
  const ruu = d.pelacak[0];
  $("s-ringkas").innerHTML = seksi({
    id: "ringkasan", ik: "presentasi", kelas: "inf-cetak", topik: tt("ringkas.topik"), judul: tt("ringkas.judul", { mw: num(rup.min), x: num(c.kali_laju_historis, 1) }), sub: tt("ringkas.sub"),
    isi: `${narasi(tt("ringkas.narasi"))}<div class="inf-sel"><span></span><button type="button" class="jm-tbl" id="cetak-ringkas">${esc(tt("ringkas.cetak"))}</button></div><article class="inf-lembar">
      <div class="inf-lembar-kop"><div><h3>${esc(tt("ringkas.kop"))}</h3><p class="jm-bantu">${esc(tt("ringkas.periode", { tanggal: tgl(d.dibangun_pada) }))}</p></div></div>
      <div><h4>${esc(tt("ringkas.satu"))}</h4><p>${esc(tt("ringkas.b_target", { mw: num(rup.min), tahun: rup.tahun, per: num(c.per_tahun_mw), hist: num(c.laju_historis_mw_per_tahun_2015_2024, 1), x: num(c.kali_laju_historis, 1) }))}</p></div>
      <div><h4>${esc(tt("ringkas.dua"))}</h4><p>${esc(tt("ringkas.b_aturan"))}</p><p>${kunci.map((r) => tautan(r.url, `${tt("jr." + r.jenis)} ${r.nomor}/${r.tahun}`)).join(", ")}</p></div>
      <div><h4>${esc(tt("ringkas.tiga"))}</h4><p>${esc(tt("ringkas.b_ruu", { nama: ruu.nama, tahap: tt("lk." + ruu.tahap), tanggal: tgl(ruu.tanggal) }))} ${labelPil("pelacak.belum_dpr")}</p></div>
      <div><h4>${esc(tt("ringkas.empat"))}</h4><p>${esc(tt("ringkas.b_kosong"))}</p></div>
      <p class="jm-bantu">${esc(tt("ringkas.kaki"))}</p></article>${sumber(SUM())}`,
  });
  $("cetak-ringkas").addEventListener("click", () => {
    document.body.classList.add("inf-cetak-lembar");
    addEventListener("afterprint", () => document.body.classList.remove("inf-cetak-lembar"), { once: true });
    window.print();
  });
}

function bagMetode() {
  $("s-metode").innerHTML = seksi({ id: "metode", ik: "metode", topik: tt("metode.topik"), judul: tt("metode.judul"), turunan: false, sub: tt("metode.sub"), isi: `${narasi(tt("metode.isi"))}${catatan(tt("pelacak.dpr"))}${catatan(tt("metode.tanggal", { tanggal: tgl(d.dibangun_pada) }))}` });
}

async function gambar() {
  ubin();
  for (const id of ["s-pelacak", "s-masukan", "s-dampak", "s-asean", "s-target", "s-ringkas", "s-metode"]) if (!$(id)) $("isi").insertAdjacentHTML("beforeend", `<div id="${id}"></div>`);
  bagPelacak(); bagMasukan(); bagDampak(); bagAsean(); bagTarget(); bagRingkas(); bagMetode();
  document.querySelectorAll("[data-k]").forEach((e) => { e.textContent = tt(e.dataset.k); });
  document.title = tt("judul.halaman");
}

(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { [d] = await Promise.all([muatData("kebijakan_info.json"), muatTeks("kebijakan")]); } catch (e) { tampilGalat($("isi"), () => location.reload()); return; }
  $("isi").innerHTML = "";
  await gambar();
  saatBahasa(() => gambar());
  if (location.hash) $(location.hash.slice(1))?.scrollIntoView();
})();
