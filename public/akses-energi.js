/* /akses-energi: akses listrik, SPKLU dan kendaraan listrik, efisiensi energi, gender dan inklusi. Data /data/akses_energi.json
   (scripts/panen/akses_energi.mjs; memperluas kelistrikan.json dan desa_listrik.json, tidak menyalin ulang). Teks di kamus i18n (awalan akn.). */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, hantuHtml, ikon } from "/inti/umum.js";
import { muatData, tampilGalat, batangHtml, pasangBar, ubinHtml } from "/analisis.js";
import { t, tanggal } from "/i18n.js";
import { buktiHtml } from "/inti/bukti.js";
import { unduhRegHtml } from "/inti/komponen.js";
import { tabHalaman } from "/inti/tab_halaman.js";
import { muatTeks, L, num, persen, seksi, catatan, narasi, sumber, tabel, petaHtml, lambang, saatBahasa, garisSvg } from "/info_kerangka.js";

const $ = (id) => document.getElementById(id);
let d = null, hukum = null, efis = null, tab = null;
const nama = (k) => d.provinsi.find((p) => p.kode === k)?.nama ?? k;
const namaL = (p) => `<span class="inf-nama">${lambang(p.kode)}${esc(p.nama)}</span>`;
const pilNada = (nada, teks) => `<span class="akn-pil akn-p-${nada}"><i></i>${esc(teks)}</span>`;
const sb = (...ids) => sumber(ids.map((i) => { const s = d.sumber[i]; return { sumber: `${s.judul} (${s.penerbit})`, url: s.url, tanggal: s.tanggal_ambil }; }));
const bukti = (id, kode) => { const s = d.sumber[id]; return buktiHtml(kode ?? s.tingkat_bukti, { sumber: s.penerbit, tanggal: s.terbit || s.tanggal_ambil }); };
const lebar = (el) => Math.min(760, (el.clientWidth || 640) - 8);
const periode = (p) => { const [y, m] = String(p).split("-"); if (!m) return y; if (/^Q/.test(m)) return `${m} ${y}`; return tanggal(`${y}-${m}-01`).split(" ").slice(1).join(" "); };
const fakta = (a) => `<div class="akn-fakta">${a.map((f) => `<div class="akn-fk"><b>${esc(f.nilai)}</b><span>${esc(f.label)}</span></div>`).join("")}</div>`;
const ket = (a) => `<ul class="akn-ket">${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const WARNA = ["jm-an-c1", "jm-an-c2", "jm-an-c3", "jm-an-c4", "jm-an-id"];

/* ---------- kepala ---------- */
function ubin() {
  const lokasi = d.lokasi_belum_berlistrik, sp = d.spklu.deret[d.spklu.deret.length - 1], ed = d.efisiensi.edge;
  $("ubin").innerHTML = ubinHtml([
    { ikon: "tek-listrik", nilai: persen(d.nasional.re_2026.re_persen, 2), label: t("akn.u.re"), href: "#listrik" },
    { ikon: "lokasi", nilai: num(lokasi.nasional), label: t("akn.u.lokasi"), href: "#desa" },
    { ikon: "petir", nilai: num(sp.jumlah), label: t("akn.u.spklu"), href: "#kendaraan" },
    { ikon: "kalkulator", nilai: `${num(ed.proyek_lebih_dari)}+`, label: t("akn.u.edge"), href: "#efisiensi" },
    { ikon: "gedung", nilai: num(d.efisiensi.greenship.gedung), label: t("akn.u.gbci"), href: "#efisiensi" },
    { ikon: "orang", nilai: persen(d.gender.irena.penuh_waktu, 0), label: t("akn.u.gender"), href: "#gender" },
  ]);
}

/* ---------- tab listrik ---------- */
async function bagListrik() {
  const el = $("pnListrik"), P = d.provinsi;
  const sort = [...P].sort((a, z) => a.re_persen - z.re_persen), rendah = sort[0];
  const peta = new Map(P.map((p) => [p.kode, { nilai: p.re_persen, teks: persen(p.re_persen, 2) }]));
  const mp = await petaHtml(peta, { nama, lebar: lebar(el) });
  const bar = batangHtml(sort.slice(0, 10).map((p, i) => ({ id: p.kode, label: p.nama, labelHtml: namaL(p), bagian: [{ nilai: +(100 - p.re_persen).toFixed(2), kelas: WARNA[i % 4] }], teks: persen(100 - p.re_persen, 2) })), { label: t("akn.l.bar") });
  const kap = d.nasional.konsumsi_kapita;
  const garis = garisSvg({ titik: kap.map((k) => ({ x: k.tahun, y: k.kwh_per_kapita, teks: `${k.tahun}: ${num(k.kwh_per_kapita)} kWh` })), lebar: Math.min(560, lebar(el)), label: t("akn.l.kap_g") });
  const kp = P.filter((p) => p.konsumsi_kwh_kapita_est != null).sort((a, z) => z.konsumsi_kwh_kapita_est - a.konsumsi_kwh_kapita_est);
  const barK = batangHtml(kp.map((p, i) => ({ id: p.kode, label: p.nama, labelHtml: namaL(p), bagian: [{ nilai: p.konsumsi_kwh_kapita_est, kelas: WARNA[i % 4] }], teks: `${num(p.konsumsi_kwh_kapita_est)} kWh` })), { ref: kap[kap.length - 1].kwh_per_kapita, label: t("akn.l.kap_b") });
  el.innerHTML =
    seksi({ id: "ak-peta", ik: "peta", topik: t("akn.l.peta.t"), judul: t("akn.l.peta.j", { nama: rendah.nama, v: num(rendah.re_persen, 2) }), turunan: false, sub: t("akn.l.peta.s"), isi: `${narasi(t("akn.l.peta.n"))}<div class="akn-dua"><div>${mp}</div><div><h3 class="akn-sub">${esc(t("akn.l.bar"))}</h3>${bar}</div></div>${sb("gatrik-2024")}` }) +
    seksi({ id: "ak-kap", ik: "grafik", topik: t("akn.l.kap.t"), judul: t("akn.l.kap.j", { v: num(kap[kap.length - 1].kwh_per_kapita) }), turunan: false, sub: t("akn.l.kap.s"), isi: `${narasi(t("akn.l.kap.n"))}<div class="akn-dua"><div><h3 class="akn-sub">${esc(t("akn.l.kap_g"))}</h3>${garis}${fakta([{ nilai: num(kap[kap.length - 1].gwh), label: t("akn.l.f.gwh") }, { nilai: `+${num(((kap[kap.length - 1].kwh_per_kapita / kap[0].kwh_per_kapita) - 1) * 100, 1)}%`, label: t("akn.l.f.naik", { a: kap[0].tahun, z: kap[kap.length - 1].tahun }) }])}</div><div><h3 class="akn-sub">${esc(t("akn.l.kap_b"))}</h3>${barK}</div></div>${catatan(t("akn.l.kap.c"))}${sb("gatrik-2024")}` }) +
    seksi({ id: "ak-tabel", ik: "tabel", topik: t("akn.l.tab.t"), judul: t("akn.l.tab.j", { n: num(P.length) }), turunan: false, sub: t("akn.l.tab.s"), csv: true, isi: `<div id="t-listrik"></div>${sb("gatrik-2024")}` });
  pasangBar(el);
  tabel($("t-listrik"), { baris: P, per: 10, urut: { k: "re", arah: 1 }, label: t("akn.l.tab.t"), kolom: [
    { k: "nama", label: t("akn.k.prov"), v: (p) => p.nama, f: namaL },
    { k: "kode", label: t("akn.k.kode"), v: (p) => p.kode, tengah: true },
    { k: "re", label: t("akn.k.re"), num: true, v: (p) => p.re_persen, f: (p) => persen(p.re_persen, 2) },
    { k: "rt", label: t("akn.k.rt"), num: true, v: (p) => p.rumah_tangga_berlistrik, f: (p) => num(p.rumah_tangga_berlistrik) },
    { k: "kons", label: t("akn.k.kons"), num: true, v: (p) => p.konsumsi_kwh_kapita_est, f: (p) => (p.konsumsi_kwh_kapita_est == null ? `<span class="jm-bantu" title="${esc(t("akn.k.kosong"))}">-</span>` : num(p.konsumsi_kwh_kapita_est)) },
    { k: "bukti", label: t("akn.k.bukti"), tengah: true, v: (p) => p.tingkat_bukti.re, f: (p) => bukti(p.sumber_id.re, p.tingkat_bukti.re) },
  ] });
}

/* ---------- tab desa ---------- */
async function bagDesa() {
  const el = $("pnDesa"), lk = d.lokasi_belum_berlistrik, rd = d.rd_pln, pp = d.papua_rumah_tangga, nas = d.nasional;
  const wilayah = [...lk.wilayah].sort((a, z) => z.nilai - a.nilai);
  const barW = batangHtml(wilayah.map((w, i) => ({ id: w.id, label: L(w.ket), bagian: [{ nilai: w.nilai, kelas: WARNA[i % 5] }], teks: num(w.nilai) })), { label: t("akn.d.lok.b") });
  const rdUrut = [...rd.provinsi].sort((a, z) => a.nilai - z.nilai);
  const kls = (v) => (v < 30 ? "bad" : v < 60 ? "warn" : v < 80 ? "info" : "ok");
  const barR = batangHtml(rdUrut.map((r) => ({ id: r.kode, label: nama(r.kode), labelHtml: namaL({ kode: r.kode, nama: nama(r.kode) }), bagian: [{ nilai: r.nilai, kelas: "akn-c-" + kls(r.nilai) }], teks: persen(r.nilai, 1) })), { ref: rd.nasional, sumbu: 100, satuan: "%", label: t("akn.d.rd.b") });
  const legR = ket(["bad", "warn", "info", "ok"].map((n) => pilNada(n, t("akn.d.nada." + n))));
  const pegunungan = d.provinsi.find((p) => p.kode === "95");
  const pegPers = rd.provinsi.find((r) => r.kode === "95").nilai;
  const barK = batangHtml(pp.kabupaten.map((k, i) => ({ id: k.nama, label: k.nama, labelHtml: `<span class="inf-nama">${lambang(k.kode_prov)}${esc(k.nama)}</span>`, bagian: [{ nilai: k.belum, kelas: WARNA[i % 4] }], teks: num(k.belum) })), { label: t("akn.d.kab.b") });
  const tren = nas.desa_2024.tren.filter((r) => r.persen != null);
  const garis = garisSvg({ titik: tren.map((r) => ({ x: r.tahun, y: r.persen, teks: `${r.tahun}: ${persen(r.persen, 2)}` })), lebar: Math.min(560, lebar(el)), label: t("akn.d.tren.g") });
  el.innerHTML =
    seksi({ id: "ak-lokasi", ik: "lokasi", topik: t("akn.d.lok.t"), judul: t("akn.d.lok.j", { n: num(lk.nasional) }), turunan: false, sub: t("akn.d.lok.s"), isi: `${narasi(t("akn.d.lok.n"))}${fakta([{ nilai: num(lk.desa_nasional.desa), label: t("akn.d.f.desa") }, { nilai: num(lk.nasional), label: t("akn.d.f.lokasi") }, { nilai: persen(d.nasional.re_2026.re_persen, 2), label: t("akn.d.f.re") }, { nilai: persen(d.nasional.re_2026.target_2029, 2), label: t("akn.d.f.target") }])}<h3 class="akn-sub">${esc(t("akn.d.lok.b"))}</h3>${barW}<p class="jm-bantu">${bukti("esdm-lokasi-2026")}</p>${sb("esdm-lokasi-2026", "desa-5758")}` }) +
    seksi({ id: "ak-rd", ik: "peringatan", topik: t("akn.d.rd.t"), judul: t("akn.d.rd.j", { nama: nama("95"), v: num(pegPers, 1) }), turunan: false, sub: t("akn.d.rd.s"), isi: `${narasi(t("akn.d.rd.n", { nas: num(rd.nasional, 1) }))}${legR}<h3 class="akn-sub">${esc(t("akn.d.rd.b"))}</h3>${barR}${fakta([{ nilai: persen(pegunungan.persen_desa_berlistrik_2024, 1), label: t("akn.d.f.u2024", { nama: pegunungan.nama }) }, { nilai: num(pegunungan.desa_non_pln), label: t("akn.d.f.nonpln") }, { nilai: persen(pegPers, 1), label: t("akn.d.f.u2026") }])}${catatan(t("akn.d.rd.c"))}<p class="jm-bantu">${bukti("rdb-papua-2026")}</p>${sb("rdb-papua-2026", "gatrik-2024")}` }) +
    seksi({ id: "ak-kab", ik: "wilayah", topik: t("akn.d.kab.t"), judul: t("akn.d.kab.j", { n: num(pp.belum), p: num(pp.persen_belum, 1) }), turunan: false, sub: t("akn.d.kab.s"), csv: true, isi: `${narasi(t("akn.d.kab.n", { rt: num(pp.rumah_tangga), desa: num(pp.desa) }))}<h3 class="akn-sub">${esc(t("akn.d.kab.b"))}</h3>${barK}<div id="t-kab"></div><p class="jm-bantu">${bukti("re-papua-2026")}</p>${sb("re-papua-2026")}` }) +
    seksi({ id: "ak-tren", ik: "grafik", topik: t("akn.d.tren.t"), judul: t("akn.d.tren.j", { v: num(nas.desa_2024.persen, 2) }), turunan: false, sub: t("akn.d.tren.s"), isi: `<div class="akn-dua"><div><h3 class="akn-sub">${esc(t("akn.d.tren.g"))}</h3>${garis}</div><div>${fakta([{ nilai: num(nas.desa_2024.jumlah_desa), label: t("akn.d.f.total") }, { nilai: num(nas.desa_2024.desa_non_pln), label: t("akn.d.f.nonpln_n") }, { nilai: num(nas.desa_2024.belum), label: t("akn.d.f.belum24") }])}</div></div>${catatan(t("akn.d.tren.c"))}${sb("gatrik-2024")}` }) +
    seksi({ id: "ak-tabeldesa", ik: "tabel", topik: t("akn.d.tab.t"), judul: t("akn.d.tab.j", { n: num(d.provinsi.length) }), turunan: false, sub: t("akn.d.tab.s"), csv: true, isi: `<div id="t-desa"></div>${sb("gatrik-2024", "rdb-papua-2026", "esdm-lokasi-2026")}` });
  pasangBar(el);
  const kosong = (tp) => `<span class="jm-bantu" title="${esc(t("akn.k.kosong"))}">${tp}</span>`;
  tabel($("t-kab"), { baris: pp.kabupaten, per: 10, urut: { k: "belum", arah: -1 }, label: t("akn.d.kab.t"), kolom: [
    { k: "nama", label: t("akn.k.kab"), v: (k) => k.nama, f: (k) => `<span class="inf-nama">${lambang(k.kode_prov)}${esc(k.nama)}</span>` },
    { k: "prov", label: t("akn.k.prov"), v: (k) => nama(k.kode_prov) },
    { k: "belum", label: t("akn.k.belum_rt"), num: true, v: (k) => k.belum, f: (k) => num(k.belum) },
    { k: "pangsa", label: t("akn.k.pangsa"), num: true, v: (k) => +((k.belum / pp.belum) * 100).toFixed(1), f: (k) => persen((k.belum / pp.belum) * 100, 1) },
  ] });
  tabel($("t-desa"), { baris: d.provinsi, per: 10, urut: { k: "nonpln", arah: -1 }, label: t("akn.d.tab.t"), kolom: [
    { k: "nama", label: t("akn.k.prov"), v: (p) => p.nama, f: namaL },
    { k: "jml", label: t("akn.k.desa"), num: true, v: (p) => p.jumlah_desa, f: (p) => num(p.jumlah_desa) },
    { k: "nonpln", label: t("akn.k.nonpln"), num: true, v: (p) => p.desa_non_pln, f: (p) => num(p.desa_non_pln) },
    { k: "pers", label: t("akn.k.pers24"), num: true, v: (p) => p.persen_desa_berlistrik_2024, f: (p) => persen(p.persen_desa_berlistrik_2024, 2) },
    { k: "rd", label: t("akn.k.rd"), num: true, v: (p) => p.rd_pln_2026q1, f: (p) => (p.rd_pln_2026q1 == null ? kosong("-") : persen(p.rd_pln_2026q1, 1)) },
    { k: "lok", label: t("akn.k.lok"), num: true, v: (p) => p.lokasi_belum_2026, f: (p) => (p.lokasi_belum_2026 == null ? kosong("-") : num(p.lokasi_belum_2026)) },
  ] });
}

/* ---------- tab kendaraan ---------- */
async function bagKendaraan() {
  const el = $("pnKendaraan"), sp = d.spklu, P = d.provinsi;
  const deret = sp.deret.map((r, i) => ({ id: "n" + i, label: `${periode(r.periode)}: ${L(r.ket)}`, bagian: [{ nilai: r.jumlah, kelas: WARNA[i % 4] }], teks: num(r.jumlah) }));
  const barN = batangHtml(deret, { label: t("akn.k.nas") });
  const ada = P.filter((p) => p.spklu_2025 != null).sort((a, z) => z.spklu_2025 - a.spklu_2025);
  const peta = new Map(ada.map((p) => [p.kode, { nilai: p.spklu_2025, teks: `${num(p.spklu_2025)} SPKLU` }]));
  const mp = await petaHtml(peta, { nama, lebar: lebar(el) });
  const barP = batangHtml(ada.filter((p) => p.spklu_2025 > 0).map((p, i) => ({ id: p.kode, label: p.nama, labelHtml: namaL(p), bagian: [{ nilai: p.spklu_2025, kelas: WARNA[i % 4] }], teks: num(p.spklu_2025) })), { label: t("akn.v.prov.b") });
  const nol = ada.filter((p) => p.spklu_2025 === 0);
  const pulau = [...sp.pulau.baris].sort((a, z) => z.unit - a.unit);
  const barI = batangHtml(pulau.map((r, i) => ({ id: r.id, label: L(r.ket), bagian: [{ nilai: r.unit, kelas: WARNA[i % 5] }], teks: `${num(r.unit)} / ${num(r.lokasi)}` })), { label: t("akn.v.pulau.b") });
  const jawa = pulau.find((r) => r.id === "jawa").unit, tot = pulau.reduce((s, r) => s + r.unit, 0);
  const kb = d.kendaraan_listrik;
  el.innerHTML =
    seksi({ id: "ak-spklu", ik: "petir", topik: t("akn.v.nas.t"), judul: t("akn.v.nas.j", { v: num(sp.deret[sp.deret.length - 1].jumlah) }), turunan: false, sub: t("akn.v.nas.s"), isi: `${narasi(t("akn.v.nas.n"))}<h3 class="akn-sub">${esc(t("akn.k.nas"))}</h3>${barN}${catatan(t("akn.v.nas.c"))}${sb("spklu-pulau-2025", "spklu-nataru-2025", "spklu-databoks-2025", "spklu-2026")}` }) +
    seksi({ id: "ak-spklu-peta", ik: "peta", topik: t("akn.v.prov.t"), judul: t("akn.v.prov.j", { nama: ada[0].nama, v: num(ada[0].spklu_2025), p: num((ada[0].spklu_2025 / sp.provinsi.total_nasional) * 100, 0) }), turunan: false, sub: t("akn.v.prov.s"), csv: true, isi: `${narasi(t("akn.v.prov.n", { n: num(nol.length) }))}<div class="akn-dua"><div>${mp}${ket(nol.map((p) => pilNada("bad", `${p.nama}: 0`)))}</div><div><h3 class="akn-sub">${esc(t("akn.v.prov.b"))}</h3>${barP}</div></div><div id="t-spklu"></div>${catatan(L(sp.tidak_terbaca))}<p class="jm-bantu">${bukti("spklu-databoks-2025")}</p>${sb("spklu-databoks-2025")}` }) +
    seksi({ id: "ak-pulau", ik: "lokasi", topik: t("akn.v.pulau.t"), judul: t("akn.v.pulau.j", { p: num((jawa / tot) * 100, 0) }), turunan: true, sub: t("akn.v.pulau.s"), isi: `<h3 class="akn-sub">${esc(t("akn.v.pulau.b"))}</h3>${barI}${sb("spklu-pulau-2025")}` }) +
    seksi({ id: "ak-kbl", ik: "kartu", topik: t("akn.v.kbl.t"), judul: t("akn.v.kbl.j", { v: num(Math.max(...kb.map((r) => r.jumlah))) }), turunan: false, sub: t("akn.v.kbl.s"), csv: true, isi: `${narasi(t("akn.v.kbl.n"))}<div id="t-kbl"></div>${catatan(t("akn.v.kbl.c"))}${sb("kbl-esdm-2025", "kbl-kemenperin-2026", "kbl-srut-2025")}` });
  pasangBar(el);
  tabel($("t-spklu"), { baris: ada, per: 10, urut: { k: "unit", arah: -1 }, label: t("akn.v.prov.t"), kolom: [
    { k: "nama", label: t("akn.k.prov"), v: (p) => p.nama, f: namaL },
    { k: "unit", label: t("akn.k.unit"), num: true, v: (p) => p.spklu_2025, f: (p) => num(p.spklu_2025) },
    { k: "pangsa", label: t("akn.k.pangsa_n"), num: true, v: (p) => +((p.spklu_2025 / sp.provinsi.total_nasional) * 100).toFixed(1), f: (p) => persen((p.spklu_2025 / sp.provinsi.total_nasional) * 100, 1) },
    { k: "bukti", label: t("akn.k.bukti"), tengah: true, v: (p) => p.tingkat_bukti.spklu, f: (p) => bukti(p.sumber_id.spklu) },
  ] });
  tabel($("t-kbl"), { baris: kb, per: 10, urut: { k: "jml", arah: -1 }, label: t("akn.v.kbl.t"), kolom: [
    { k: "ket", label: t("akn.k.ukuran"), v: (r) => L(r.ket) },
    { k: "per", label: t("akn.k.periode"), v: (r) => r.periode, tengah: true, f: (r) => esc(periode(r.periode)) },
    { k: "jml", label: t("akn.k.unit"), num: true, v: (r) => r.jumlah, f: (r) => num(r.jumlah) },
    { k: "bukti", label: t("akn.k.bukti"), tengah: true, v: (r) => d.sumber[r.sumber_id].tingkat_bukti, f: (r) => bukti(r.sumber_id) },
  ] });
}

/* ---------- tab efisiensi ---------- */
async function bagEfisiensi() {
  const el = $("pnEfisiensi"), e = d.efisiensi, ed = e.edge, tn = e.tenaga;
  const bg = [...ed.bangunan].sort((a, z) => z.n - a.n);
  const barE = batangHtml(bg.map((r, i) => ({ id: r.kode, label: nama(r.kode), labelHtml: namaL({ kode: r.kode, nama: nama(r.kode) }), bagian: [{ nilai: r.n, kelas: WARNA[i % 4] }], teks: num(r.n) })), { label: t("akn.e.edge.b") });
  const barT = batangHtml([
    { id: "m", label: t("akn.e.tn.manajer"), bagian: [{ nilai: tn.manajer_perempuan, kelas: "jm-an-c2" }, { nilai: tn.manajer - tn.manajer_perempuan, kelas: "jm-an-c1" }], teks: num(tn.manajer) },
    { id: "a", label: t("akn.e.tn.auditor"), bagian: [{ nilai: tn.auditor_perempuan, kelas: "jm-an-c2" }, { nilai: tn.auditor - tn.auditor_perempuan, kelas: "jm-an-c1" }], teks: num(tn.auditor) },
  ], { label: t("akn.e.tn.b") });
  const legT = ket([pilNada("ok", t("akn.e.tn.laki")), pilNada("info", t("akn.e.tn.p"))]);
  const reg = (hukum?.dok ?? []).filter((r) => ["pp-33-2023", "permen-esdm-8-2025", "permen-esdm-14-2012"].includes(r.id));
  const kartuReg = reg.map((r) => `<article class="akn-reg-k"><header><h3>${esc(`${r.singkatan} ${r.nomor}/${r.tahun}`)}</h3>${r.status === "dicabut" ? pilNada("bad", t("akn.e.reg.dicabut")) : pilNada("ok", t("akn.e.reg.berlaku"))}</header><p>${esc(r.judul)}</p>${unduhRegHtml({ url_pdf: r.pdf?.[0], url_sumber: r.url, judul: `${r.nomor}/${r.tahun}` })}</article>`).join("");
  const kunciE = (efis?.kunci ?? []).slice(0, 3);
  const faktaE = kunciE.map((k) => ({ nilai: num(k.nilai, k.d ?? 0), label: `${L(k.label)} (${L(k.satuan)})` }));
  el.innerHTML =
    seksi({ id: "ak-edge", ik: "gedung", topik: t("akn.e.edge.t"), judul: t("akn.e.edge.j", { n: num(ed.proyek_lebih_dari), p: num(ed.provinsi_ada) }), turunan: false, sub: t("akn.e.edge.s"), isi: `${narasi(t("akn.e.edge.n"))}${fakta([{ nilai: `${num(ed.provinsi_ada)}/${num(ed.provinsi_total)}`, label: t("akn.e.f.prov") }, { nilai: `${num(ed.luas_juta_m2, 2)} ${t("akn.e.juta")}`, label: t("akn.e.f.luas") }, { nilai: num(ed.hemat_mwh), label: t("akn.e.f.mwh") }, { nilai: num(ed.co2_ton), label: t("akn.e.f.co2") }, { nilai: num(d.efisiensi.greenship.gedung), label: t("akn.e.f.gbci") }, { nilai: `${num(d.efisiensi.greenship.pengembang_bersertifikat_persen)}%`, label: t("akn.e.f.dev", { n: num(d.efisiensi.greenship.pengembang_total) }) }])}<h3 class="akn-sub">${esc(t("akn.e.edge.b"))}</h3>${barE}${catatan(t("akn.e.edge.c"))}<p class="jm-bantu">${bukti("edge-ifc-2025")}</p>${sb("edge-ifc-2025", "gbci-2026")}` }) +
    seksi({ id: "ak-tenaga", ik: "orang", topik: t("akn.e.tn.t"), judul: t("akn.e.tn.j", { m: num(tn.manajer), a: num(tn.auditor) }), turunan: false, sub: t("akn.e.tn.s"), isi: `${narasi(t("akn.e.tn.n"))}${legT}${barT}<p class="jm-bantu">${bukti("srikandi-2021")}</p>${sb("srikandi-2021")}` }) +
    seksi({ id: "ak-reg", ik: "regulasi", topik: t("akn.e.reg.t"), judul: t("akn.e.reg.j"), turunan: false, sub: t("akn.e.reg.s"), isi: `${narasi(t("akn.e.reg.n"))}<div class="akn-reg">${kartuReg || esc(t("akn.e.reg.kosong"))}</div>` }) +
    (faktaE.length ? seksi({ id: "ak-lapor", ik: "kajian", topik: t("akn.e.lapor.t"), judul: t("akn.e.lapor.j"), turunan: false, sub: t("akn.e.lapor.s"), isi: `${fakta(faktaE)}<p class="akn-terkait"><a class="jm-tbl" href="/topik?id=efisiensi">${ikon("buku", 16)}<span>${esc(t("akn.e.lapor.tautan"))}</span></a></p>` }) : "");
  pasangBar(el);
}

/* ---------- tab gender ---------- */
async function bagGender() {
  const el = $("pnGender"), g = d.gender, tn = d.efisiensi.tenaga;
  const baris = [
    { id: "ir1", label: t("akn.g.irena.all"), v: g.irena.penuh_waktu, kelas: "jm-an-c1", s: "irena-gender-2025", skop: "global", per: g.irena.periode },
    { id: "ir2", label: t("akn.g.irena.mid"), v: g.irena.menengah, kelas: "jm-an-c1", s: "irena-gender-2025", skop: "global", per: g.irena.periode },
    { id: "ir3", label: t("akn.g.irena.sen"), v: g.irena.senior, kelas: "jm-an-c1", s: "irena-gender-2025", skop: "global", per: g.irena.periode },
    { id: "id1", label: t("akn.g.pln"), v: g.pln.manajemen_persen, kelas: "jm-an-c2", s: "pln-srikandi-2024", skop: "id", per: g.pln.periode },
    { id: "id2", label: t("akn.g.aud"), v: tn.persen_auditor_perempuan, kelas: "jm-an-c2", s: "srikandi-2021", skop: "id", per: tn.periode },
    { id: "id3", label: t("akn.g.man"), v: tn.persen_manajer_perempuan, kelas: "jm-an-c2", s: "srikandi-2021", skop: "id", per: tn.periode },
  ];
  const bar = batangHtml(baris.map((b) => ({ id: b.id, label: b.label, bagian: [{ nilai: b.v, kelas: b.kelas }], teks: persen(b.v, 1) })), { ref: g.irena.rata_tenaga_kerja, sumbu: 60, satuan: "%", label: t("akn.g.b") });
  const leg = ket([pilNada("ok", t("akn.g.skop.global")), pilNada("info", t("akn.g.skop.id")), `<span class="jm-bantu">${esc(t("akn.g.ref", { v: num(g.irena.rata_tenaga_kerja, 1) }))}</span>`]);
  el.innerHTML =
    seksi({ id: "ak-gender", ik: "orang", topik: t("akn.g.t"), judul: t("akn.g.j", { v: num(g.irena.penuh_waktu), a: num(tn.persen_auditor_perempuan, 1) }), turunan: false, sub: t("akn.g.s"), csv: true, isi: `${narasi(t("akn.g.n", { negara: num(g.irena.negara) }))}${leg}<h3 class="akn-sub">${esc(t("akn.g.b"))}</h3>${bar}<div id="t-gender"></div>${catatan(t("akn.g.c"))}${sb("irena-gender-2025", "pln-srikandi-2024", "srikandi-2021")}` });
  pasangBar(el);
  tabel($("t-gender"), { baris, per: 10, urut: { k: "v", arah: -1 }, label: t("akn.g.t"), kolom: [
    { k: "label", label: t("akn.k.indikator"), v: (b) => b.label },
    { k: "skop", label: t("akn.k.skop"), tengah: true, v: (b) => b.skop, f: (b) => pilNada(b.skop === "global" ? "ok" : "info", t("akn.g.skop." + b.skop)) },
    { k: "v", label: t("akn.k.pangsa_p"), num: true, v: (b) => b.v, f: (b) => persen(b.v, 1) },
    { k: "per", label: t("akn.k.periode"), tengah: true, v: (b) => b.per, f: (b) => esc(periode(b.per)) },
    { k: "bukti", label: t("akn.k.bukti"), tengah: true, v: (b) => d.sumber[b.s].tingkat_bukti, f: (b) => bukti(b.s) },
  ] });
}

/* ---------- bawah: metode, celah, tautan ---------- */
function bagBawah() {
  const tautan = [["/desa-energi", "tek-listrik", "akn.t.desa"], ["/kerja", "koper", "akn.t.kerja"], ["/topik?id=kendaraan-listrik", "petir", "akn.t.ev"], ["/topik?id=efisiensi", "buku", "akn.t.efis"], ["/peta", "peta", "akn.t.peta"], ["/regulasi#hukum", "palu", "akn.t.hukum"], ["/data", "csv", "akn.t.data"]];
  $("pnBawah").innerHTML =
    seksi({ id: "ak-metode", ik: "metode", topik: t("akn.m.t"), judul: t("akn.m.j"), turunan: false, sub: t("akn.m.s"), isi: `${narasi(L(d.metode))}<ul class="akn-celah">${d.celah.map((c) => `<li>${ikon("info", 18)}<span>${esc(L(c))}</span></li>`).join("")}</ul>` }) +
    seksi({ id: "ak-terkait", ik: "tautan", topik: t("akn.r.t"), judul: t("akn.r.j"), turunan: false, sub: t("akn.r.s"), isi: `<div class="akn-terkait">${tautan.map(([h, ik, k]) => `<a class="jm-tbl" href="${h}">${ikon(ik, 16)}<span>${esc(t(k))}</span></a>`).join("")}</div>` });
}

const BAGIAN = { pnListrik: bagListrik, pnDesa: bagDesa, pnKendaraan: bagKendaraan, pnEfisiensi: bagEfisiensi, pnGender: bagGender };
const selesai = new Set();
const muat = (id) => async () => { if (selesai.has(id)) return; selesai.add(id); $(id).innerHTML = hantuHtml(4); await BAGIAN[id](); };

async function isiSemua() {
  ubin(); bagBawah();
  tab = tabHalaman("tabHal", { label: "akn.tab", tab: [
    { k: "listrik", ikon: "tek-listrik", teks: "akn.tab.listrik", panel: "pnListrik", muat: muat("pnListrik") },
    { k: "desa", ikon: "lokasi", teks: "akn.tab.desa", panel: "pnDesa", muat: muat("pnDesa") },
    { k: "kendaraan", ikon: "petir", teks: "akn.tab.kendaraan", panel: "pnKendaraan", muat: muat("pnKendaraan") },
    { k: "efisiensi", ikon: "gedung", teks: "akn.tab.efisiensi", panel: "pnEfisiensi", muat: muat("pnEfisiensi") },
    { k: "gender", ikon: "orang", teks: "akn.tab.gender", panel: "pnGender", muat: muat("pnGender") },
  ] });
}

(async () => {
  await mulaiHalaman();
  $("ubin").innerHTML = hantuHtml(2);
  try {
    [d] = await Promise.all([muatData("akses_energi.json"), muatTeks("akses_energi")]);
  } catch (e) { tampilGalat($("ubin"), () => location.reload()); return; }
  [hukum, efis] = await Promise.all([muatData("hukum/katalog.json").catch(() => null), muatData("topik/efisiensi.json").catch(() => null)]);
  document.title = t("akn.judul_halaman");
  await isiSemua();
  saatBahasa(() => { selesai.clear(); document.title = t("akn.judul_halaman"); ubin(); bagBawah(); for (const id of Object.keys(BAGIAN)) if (!$(id).hidden) muat(id)(); else $(id).innerHTML = ""; });
})();
