/* /biaya-listrik, bagian pasar listrik: HBA batubara, harga dan volume DMO, tarif per golongan, subsidi, biaya bahan bakar PLTU lawan EBT (EST). Data statis /data/pasar_listrik.json. */
import { esc, nanti, hantuHtml, debounce, ikon } from "/inti/umum.js";
import { t, angka } from "/i18n.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { buktiHtml } from "/inti/bukti.js";
import { muatData, tampilGalat, sumberLipat, pil, saatBahasa } from "/analisis.js";
import { kolomSvg, garisSvg, batangSvg, legendaHtml, tabel, n1, tipHtml, pilUbah } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
const SERI = ["r1m-900", "r1-b2-pju", "r2-r3-p1-p3", "b3-i3", "p2", "i4"];
const KLS = { "r1m-900": "ih-s1", "r1-b2-pju": "ih-s2", "r2-r3-p1-p3": "ih-s3", "b3-i3": "ih-s4", p2: "ih-s5", i4: "ih-s6" };
const EBT = { surya: "ih-s1", "bayu-darat": "ih-s2", air: "ih-s3", "panas-bumi": "ih-s4", bioenergi: "ih-s5" };
let d = null, thBbm = null;
const rp = (v) => (v == null ? "-" : "Rp" + angka(v, { desimal: Number.isInteger(v) ? 0 : 2 }));
const bukti = (k) => buktiHtml(k, { tag: "span" });
const src = (...id) => sumberLipat(id.map((i) => { const s = d.sumber.find((x) => x.id === i); return { sumber: s.penerbit, halaman: s.judul, url: s.url, tanggal: s.tanggal_akses }; }));
const akhir = (a) => a.at(-1);
const x = (th) => { const [y, q] = th.split("-Q").map(Number); return y + (q - 1) / 4; };
const thIni = () => thBbm || akhir(d.analisis.tahunan).tahun;

function rangka() {
  const A = d.analisis, hba = d.hba.tahunan, h24 = akhir(hba), puncak = hba.reduce((a, b) => (b.usd_ton > a.usd_ton ? b : a));
  const sb = d.subsidi.realisasi, s0 = sb[0], s1 = akhir(sb), vol = d.dmo.volume.filter((v) => v.ke_pembangkit_listrik_t), v1 = akhir(vol);
  const ts = A.tahunan.find((r) => r.tahun === thIni()), pk = A.tahunan.reduce((a, b) => (b.subsidi_tersirat_usd_miliar > a.subsidi_tersirat_usd_miliar ? b : a));
  const est = " " + pil("an.est");
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const tabThn = `<div class="jm-tab" role="tablist" aria-label="${esc(t("psl.pilih_th"))}">${A.tahunan.map((r) => `<button type="button" role="tab" data-pth="${r.tahun}" aria-selected="${r.tahun === thIni()}">${r.tahun}</button>`).join("")}</div>`;
  $("blPasar").innerHTML = [
    ex({ id: "hba", ikon: "grafik", topik: t("psl.ey.hba"), judulHtml: hlHtml("psl.t.hba", `USD ${n1(h24.usd_ton, 2)}`, { tahun: h24.tahun, puncak: n1(puncak.usd_ton, 2), tp: puncak.tahun }), subHtml: esc(t("psl.s.hba")), csv: true,
      isiHtml: `${legendaHtml([{ id: "hba", kelas: "ih-fosil", label: t("psl.l.hba") }, { id: "dmo", kelas: "ih-ebt", label: t("psl.l.dmo") }])}<div id="g-hba" class="ih-bagan"></div><div id="tb-hba" class="ih-tabel"></div><h3 class="jm-ex-sj">${esc(t("psl.j.periode"))}</h3><div id="tb-periode" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("psl.n.hba"))}</p>${src("hessi-2024", "esdm-hba-2015", "esdm-hba-2025-05", "esdm-hba-2025-07", "cnbc-hba-2025-11")}` }),
    ex({ id: "dmo", ikon: "tabel", topik: t("psl.ey.dmo"), judulHtml: hlHtml("psl.t.dmo", "USD 70", { th: d.dmo.tidak_berubah_sejak, mt: n1(v1.ke_pembangkit_listrik_t / 1e6, 0), tahun: v1.tahun }), subHtml: esc(t("psl.s.dmo")), csv: true,
      isiHtml: `<div id="tb-dmo" class="ih-tabel"></div><h3 class="jm-ex-sj">${esc(t("psl.j.volume"))}</h3><div id="g-vol" class="ih-bagan"></div><div id="tb-vol" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("psl.n.dmo"))}</p>${src("kepmen-1395-2018", "esdm-dmo-2020", "kepmen-255-2020", "warta-dmo-267", "bisnis-dmo-2026-02", "cnbc-dmo-2026-06", "hessi-2024")}` }),
    ex({ id: "tarif", ikon: "kalkulator", topik: t("psl.ey.tarif"), judulHtml: hlHtml("psl.t.tarif", rp(1444.7), { th: "2020 Q4", n: SERI.length }) + est, subHtml: esc(t("psl.s.tarif")), csv: true,
      isiHtml: `${legendaHtml(SERI.map((k) => ({ id: k, kelas: KLS[k], label: t("psl.seri." + k) })))}<div id="g-tarif" class="ih-bagan"></div><h3 class="jm-ex-sj">${esc(t("psl.j.golongan"))}</h3><div id="tb-tarif" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("psl.n.tarif"))}</p>${src("stat-gatrik-2024", "esdm-tarif-2019q1", "esdm-tarif-2020q1", "esdm-tarif-2020q4", "esdm-tarif-2022q3", "katadata-tarif-2025q4", "detik-900va-2017")}` }),
    ex({ id: "subsidi", ikon: "kartu", topik: t("psl.ey.subsidi"), judulHtml: hlHtml("psl.t.subsidi", `Rp${n1(s1.subsidi_rp_triliun, 2)} T`, { a: `Rp${n1(s0.subsidi_rp_triliun, 2)} T`, ta: s0.tahun, tb: s1.tahun }), subHtml: esc(t("psl.s.subsidi")), csv: true,
      isiHtml: `<div id="g-sub" class="ih-bagan"></div><div id="tb-sub" class="ih-tabel"></div><h3 class="jm-ex-sj">${esc(t("psl.j.pagu"))}</h3><div id="tb-pagu" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("psl.n.subsidi"))}</p>${src("stat-gatrik-2024", "listrikindonesia-subsidi-2024", "investortrust-subsidi-2026", "katadata-subsidi-2026")}` }),
    ex({ id: "bbm-ebt", ikon: "analisis", topik: t("psl.ey.bbm"), judulHtml: hlHtml("psl.t.bbm", `${n1(ts.selisih_sen_kwh, 2)} ${t("psl.sat")}`, { tahun: ts.tahun, dmo: n1(ts.biaya_bbm_dmo_sen_kwh, 2), hba: n1(ts.biaya_bbm_hba_sen_kwh, 2), pk: `USD ${n1(pk.subsidi_tersirat_usd_miliar, 1)}`, tp: pk.tahun }) + est, subHtml: esc(t("psl.s.bbm")), csv: true,
      isiHtml: `${tabThn}${legendaHtml([{ kelas: "ih-fosil", label: t("psl.leg.fosil") }, { kelas: "ih-lawan", label: t("psl.leg.dmo") }, { kelas: "ih-ebt", label: t("psl.leg.ebt") }])}<div id="g-bbm" class="ih-bagan"></div><div id="tb-bbm" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("psl.n.bbm", { eta: Math.round(A.parameter.efisiensi.nilai * 100), lo: Math.round(A.parameter.efisiensi.rentang[0] * 100), hi: Math.round(A.parameter.efisiensi.rentang[1] * 100) }))}</p><ul class="ih-lis">${[1, 2, 3].map((i) => `<li>${esc(t("psl.cv." + i))}</li>`).join("")}</ul>${src("hessi-2024", "stat-gatrik-2024")}` }),
    ex({ id: "pasar-celah", ikon: "info", topik: t("psl.ey.celah"), judulHtml: hlHtml("psl.t.celah", String(d.meta.celah.length)), subHtml: esc(t("psl.s.celah")),
      isiHtml: `<ul class="ih-lis">${d.meta.celah.map((_, i) => `<li>${esc(t("psl.celah." + (i + 1)))}</li>`).join("")}</ul><p class="jm-bantu ih-catatan"><a href="/keandalan">${esc(t("psl.taut.keandalan"))}</a></p>` }),
  ].join("");
  tabelTabel();
}

function tabelTabel() {
  const hb = d.hba.tahunan, plaf = d.dmo.harga_usd_ton, dari = d.dmo.tidak_berubah_sejak;
  tabel($("tb-hba"), { satuan: "ih.u.tahun", per: 12, urutAwal: 0, kolom: [
    { label: t("psl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t("psl.c.hba"), num: true, v: (r) => r.usd_ton, f: (r) => n1(r.usd_ton, 2) },
    { label: t("psl.c.plafon"), num: true, v: (r) => (r.tahun >= dari ? plaf : null), f: (r) => (r.tahun >= dari ? String(plaf) : '<span class="ih-kosong">-</span>') },
    { label: t("psl.c.vsplafon"), num: true, v: (r) => (r.tahun >= dari ? ((r.usd_ton - plaf) / plaf) * 100 : null), f: (r) => (r.tahun >= dari ? pilUbah(((r.usd_ton - plaf) / plaf) * 100) : '<span class="ih-kosong">-</span>') },
    { label: t("psl.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => bukti(r.tingkat_bukti) },
  ], baris: hb });
  tabel($("tb-periode"), { satuan: "psl.u.periode", per: 8, urutAwal: 0, menurun: true, kolom: [
    { label: t("psl.c.periode"), v: (r) => r.periode, f: (r) => esc(r.periode) },
    { label: t("psl.c.hba"), num: true, v: (r) => r.usd_ton, f: (r) => n1(r.usd_ton, 2) },
    { label: t("psl.c.kepmen"), v: (r) => r.keputusan || "", f: (r) => (r.keputusan ? esc(r.keputusan) : '<span class="ih-kosong">-</span>') },
    { label: t("psl.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => bukti(r.tingkat_bukti) },
  ], baris: [...d.hba.periode, ...d.hba.bulanan.map((m) => ({ ...m, keputusan: null }))] });
  tabel($("tb-dmo"), { satuan: "psl.u.aturan", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("psl.c.berlaku"), v: (r) => r.berlaku, f: (r) => esc(r.berlaku) },
    { label: t("psl.c.harga"), num: true, v: (r) => r.harga_usd_ton, f: (r) => String(r.harga_usd_ton) },
    { label: t("psl.c.persen"), num: true, v: (r) => r.persen_dmo, f: (r) => (r.persen_dmo == null ? '<span class="ih-kosong">-</span>' : r.persen_dmo + "%") },
    { label: t("psl.c.keputusan"), v: (r) => r.keputusan, f: (r) => esc(r.keputusan) },
    { label: t("psl.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => bukti(r.tingkat_bukti) },
  ], baris: d.dmo.aturan });
  const vol = d.dmo.volume;
  tabel($("tb-vol"), { satuan: "ih.u.tahun", per: 12, urutAwal: 0, kolom: [
    { label: t("psl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t("psl.c.dn"), num: true, v: (r) => r.penjualan_dalam_negeri_t, f: (r) => n1(r.penjualan_dalam_negeri_t / 1e6, 1) },
    { label: t("psl.c.pltu"), num: true, v: (r) => r.ke_pembangkit_listrik_t, f: (r) => (r.ke_pembangkit_listrik_t == null ? '<span class="ih-kosong">-</span>' : n1(r.ke_pembangkit_listrik_t / 1e6, 1)) },
    { label: t("psl.c.pln"), num: true, v: (r) => r.batubara_pembangkit_pln_t, f: (r) => (r.batubara_pembangkit_pln_t == null ? '<span class="ih-kosong">-</span>' : n1(r.batubara_pembangkit_pln_t / 1e6, 1)) },
    { label: t("psl.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => bukti(r.tingkat_bukti) },
  ], baris: vol });
  const i24 = d.tarif.tahun.indexOf(2024);
  const disp = (g) => (1 - g.tarif_rp_kwh[i24] / g.keekonomian_rp_kwh[i24]) * 100;
  tabel($("tb-tarif"), { satuan: "psl.u.golongan", per: 10, urutAwal: 5, kolom: [
    { label: t("psl.c.golongan"), v: (r) => r.kode, f: (r) => `<span class="ih-ti"><span class="${r.subsidi ? "ih-s3" : "ih-s1"}">${ikon(r.subsidi ? "orang" : "kalkulator", 20)}</span><span>${esc(r.nama)} (${esc(r.kode)})</span></span>` },
    { label: t("psl.c.jenis"), v: (r) => (r.subsidi ? 1 : 0), f: (r) => esc(t(r.subsidi ? "psl.jn.sub" : "psl.jn.non")) },
    { label: t("psl.c.tarif", { tahun: 2024 }), num: true, v: (r) => r.tarif_rp_kwh[i24], f: (r) => rp(r.tarif_rp_kwh[i24]) },
    { label: t("psl.c.ekon", { tahun: 2024 }), num: true, v: (r) => r.keekonomian_rp_kwh[i24], f: (r) => rp(r.keekonomian_rp_kwh[i24]) },
    { label: t("psl.c.disp"), num: true, v: (r) => disp(r), f: (r) => `${n1(disp(r), 1)}%` },
  ], baris: d.tarif.golongan });
  const sb = d.subsidi.realisasi;
  tabel($("tb-sub"), { satuan: "ih.u.tahun", per: 10, urutAwal: 0, kolom: [
    { label: t("psl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t("psl.c.subsidi"), num: true, v: (r) => r.subsidi_rp_triliun, f: (r) => n1(r.subsidi_rp_triliun, 2) },
    { label: t("psl.c.kwh"), num: true, v: (r) => r.energi_bersubsidi_kwh, f: (r) => n1(r.energi_bersubsidi_kwh / 1e9, 1) },
    { label: `${t("psl.c.perkwh")} ${t("an.est")}`, num: true, v: (r) => (r.subsidi_rp_triliun * 1e12) / r.energi_bersubsidi_kwh, f: (r) => rp(Math.round((r.subsidi_rp_triliun * 1e12) / r.energi_bersubsidi_kwh)) },
    { label: t("psl.c.plg"), num: true, v: (r) => d.subsidi.pelanggan_total.find((p) => p.tahun === r.tahun)?.jumlah, f: (r) => n1(d.subsidi.pelanggan_total.find((p) => p.tahun === r.tahun).jumlah / 1e6, 1) },
  ], baris: sb });
  const pg = [...d.subsidi.pagu_vs_realisasi.map((r) => ({ tahun: r.tahun, jenis: "pagu", pagu: r.pagu_rp_triliun, nilai: r.realisasi_rp_triliun, tb: r.tingkat_bukti })),
    ...d.subsidi.subsidi_dan_kompensasi.map((r) => ({ tahun: r.tahun, jenis: "gab", pagu: null, nilai: r.rp_triliun, tb: r.tingkat_bukti })),
    ...d.subsidi.pelanggan_bersubsidi_juta.map((r) => ({ tahun: r.tahun, jenis: "plg", pagu: null, nilai: r.juta, tb: r.tingkat_bukti }))];
  tabel($("tb-pagu"), { satuan: "psl.u.baris", per: 10, urutAwal: 0, menurun: false, kolom: [
    { label: t("psl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t("psl.c.jenis"), v: (r) => r.jenis, f: (r) => esc(t("psl.jp." + r.jenis)) },
    { label: t("psl.c.pagu"), num: true, v: (r) => r.pagu, f: (r) => (r.pagu == null ? '<span class="ih-kosong">-</span>' : n1(r.pagu, 2)) },
    { label: t("psl.c.nilai"), num: true, v: (r) => r.nilai, f: (r) => (r.nilai == null ? '<span class="ih-kosong">-</span>' : n1(r.nilai, 2)) },
    { label: t("psl.c.bukti"), v: (r) => r.tb, f: (r) => bukti(r.tb) },
  ], baris: pg });
  tbBbm();
}
function tbBbm() {
  tabel($("tb-bbm"), { satuan: "ih.u.tahun", per: 10, urutAwal: 0, kolom: [
    { label: t("psl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => String(r.tahun) },
    { label: t("psl.c.hba"), num: true, v: (r) => r.hba_usd_ton, f: (r) => n1(r.hba_usd_ton, 2) },
    { label: t("psl.c.bbm_hba"), num: true, v: (r) => r.biaya_bbm_hba_sen_kwh, f: (r) => n1(r.biaya_bbm_hba_sen_kwh, 2) },
    { label: t("psl.c.bbm_dmo"), num: true, v: (r) => r.biaya_bbm_dmo_sen_kwh, f: (r) => n1(r.biaya_bbm_dmo_sen_kwh, 2) },
    { label: `${t("psl.c.selisih")} ${t("an.est")}`, num: true, v: (r) => r.selisih_sen_kwh, f: (r) => n1(r.selisih_sen_kwh, 2) },
    { label: `${t("psl.c.tersirat")} ${t("an.est")}`, num: true, v: (r) => r.subsidi_tersirat_usd_miliar, f: (r) => n1(r.subsidi_tersirat_usd_miliar, 1) },
  ], baris: d.analisis.tahunan });
}

function bagan() {
  const hb = d.hba.tahunan, dari = d.dmo.tidak_berubah_sejak, plaf = d.dmo.harga_usd_ton;
  $("g-hba").innerHTML = garisSvg({ el: $("g-hba"), satuan: "USD/ton", label: t("psl.s.hba"), xTick: hb.map((r) => r.tahun).filter((y) => innerWidth >= 500 || y % 2 === 0),
    seri: [{ id: "hba", kelas: "ih-fosil", label: t("psl.l.hba"), titik: hb.map((r) => ({ x: r.tahun, y: r.usd_ton, tip: `${t("psl.l.hba")}, ${r.tahun}: USD ${n1(r.usd_ton, 2)}/ton` })) },
      { id: "dmo", kelas: "ih-ebt", label: t("psl.l.dmo"), titik: hb.filter((r) => r.tahun >= dari).map((r) => ({ x: r.tahun, y: plaf, tip: `${t("psl.l.dmo")}, ${r.tahun}: USD ${plaf}/ton` })) }] });
  const vol = d.dmo.volume.filter((v) => v.ke_pembangkit_listrik_t);
  $("g-vol").innerHTML = kolomSvg({ el: $("g-vol"), satuan: t("psl.sat.jt"), label: t("psl.j.volume"), seri: [{ k: "v", kelas: "ih-fosil" }],
    kategori: vol.map((v, i, a) => ({ label: String(v.tahun), nilai: { v: v.ke_pembangkit_listrik_t / 1e6 }, tip: `${v.tahun}: ${n1(v.ke_pembangkit_listrik_t / 1e6, 1)} ${t("psl.sat.jt")}`,
      th: tipHtml(String(v.tahun), [[t("psl.c.pltu"), `${n1(v.ke_pembangkit_listrik_t / 1e6, 1)} ${t("psl.sat.jt")}`], [t("psl.c.dn"), `${n1(v.penjualan_dalam_negeri_t / 1e6, 1)} ${t("psl.sat.jt")}`], ...(i ? [[t("psl.tip.ubah", { a: a[i - 1].tahun, b: v.tahun }), `${n1(((v.ke_pembangkit_listrik_t / a[i - 1].ke_pembangkit_listrik_t) - 1) * 100, 0)}%`]] : [])]) })) });
  const tw = d.tarif.triwulan;
  $("g-tarif").innerHTML = garisSvg({ el: $("g-tarif"), satuan: "Rp/kWh", label: t("psl.s.tarif"), xTick: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].filter((y) => innerWidth >= 500 || y % 2 === 1),
    seri: SERI.map((k) => ({ id: k, kelas: KLS[k], label: t("psl.seri." + k), titik: tw.map((q) => ({ x: x(q.periode), y: q.nilai_rp_kwh[k], tip: `${t("psl.seri." + k)}, ${q.periode}: ${rp(q.nilai_rp_kwh[k])}/kWh` })) })) });
  const sb = d.subsidi.realisasi;
  $("g-sub").innerHTML = kolomSvg({ el: $("g-sub"), satuan: t("psl.sat.rpt"), label: t("psl.s.subsidi"), seri: [{ k: "v", kelas: "ih-id" }],
    kategori: sb.map((r, i, a) => ({ label: String(r.tahun), nilai: { v: r.subsidi_rp_triliun }, tip: `${r.tahun}: Rp${n1(r.subsidi_rp_triliun, 2)} T`,
      th: tipHtml(String(r.tahun), [[t("psl.c.subsidi"), `Rp${n1(r.subsidi_rp_triliun, 2)} T`], [t("psl.c.kwh"), `${n1(r.energi_bersubsidi_kwh / 1e9, 1)} TWh`], ...(i ? [[t("psl.tip.ubah", { a: a[i - 1].tahun, b: r.tahun }), `+${n1((r.subsidi_rp_triliun / a[i - 1].subsidi_rp_triliun - 1) * 100, 0)}%`]] : [])]) })) });
  gBbm();
}
function gBbm() {
  const A = d.analisis, r = A.tahunan.find((q) => q.tahun === thIni()), sat = t("psl.sat");
  const baris = [
    { label: t("psl.b.hba", { tahun: r.tahun }), k: "fosil", nilai: r.biaya_bbm_hba_sen_kwh, tip: `${t("psl.b.hba", { tahun: r.tahun })}: ${n1(r.biaya_bbm_hba_sen_kwh, 2)} ${sat}`, ikon: "tek-listrik" },
    { label: t("psl.b.dmo"), k: "dmo", nilai: r.biaya_bbm_dmo_sen_kwh, tip: `${t("psl.b.dmo")}: ${n1(r.biaya_bbm_dmo_sen_kwh, 2)} ${sat}`, ikon: "tek-listrik" },
    ...[...A.ebt].sort((a, b) => b.lcoe_sen_kwh - a.lcoe_sen_kwh).map((e) => ({ label: t("psl.tek." + e.teknologi), k: "ebt", nilai: e.lcoe_sen_kwh, tip: `${t("psl.b.ebt", { tek: t("ih.tek." + e.teknologi) })}: ${n1(e.lcoe_sen_kwh, 1)} ${sat}`, ikon: "tek-" + ({ surya: "surya", "bayu-darat": "listrik", air: "listrik", "panas-bumi": "panas", bioenergi: "bio" })[e.teknologi], e })),
  ];
  $("g-bbm").innerHTML = batangSvg({ el: $("g-bbm"), d: 1, label: t("psl.s.bbm"), satuan: sat,
    seri: [{ k: "fosil", kelas: "ih-fosil" }, { k: "dmo", kelas: "ih-lawan" }, { k: "ebt", kelas: "ih-ebt" }],
    baris: baris.map((b) => ({ label: b.label, ikon: b.ikon, tip: b.tip, bagian: [{ k: b.k, nilai: b.nilai }],
      th: tipHtml(b.label, [[t("psl.tip.nilai"), `${n1(b.nilai, 2)} ${sat}`], ...(b.e ? [[t("psl.tip.rentang"), b.e.rentang_sen_kwh ? `${n1(b.e.rentang_sen_kwh[0], 1)} sampai ${n1(b.e.rentang_sen_kwh[1], 1)}` : "-"]] : [[t("psl.tip.eta"), `${Math.round(A.parameter.efisiensi.nilai * 100)}%`]])]) })) });
}

export async function pasangPasar() {
  const el = $("blPasar"); if (!el) return;
  el.innerHTML = hantuHtml(2);
  try { d = await muatData("pasar_listrik.json"); } catch (e) { tampilGalat(el, pasangPasar); return; }
  const gambar = () => { rangka(); bagan(); };
  gambar();
  saatBahasa(gambar);
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-pth]"); if (!b || b.getAttribute("aria-selected") === "true") return;
    for (const s of b.parentElement.children) s.setAttribute("aria-selected", String(s === b));
    thBbm = +b.dataset.pth; nanti(gBbm);
  });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; bagan(); } }, 200));
}
