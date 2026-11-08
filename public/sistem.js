/* /sistem (indeks sepuluh sistem PLN) dan /sistem/<id> (profil). Data /data/sistem_pln.json (scripts/panen/sistem_pln.mjs): statistik ESDM 2024,
   neraca daya RUPTL 2025-2034, BPP terakhir yang terbaca, proyek METI. Susut dan BPP terbaru per sistem tidak terbit: celah tertulis, bukan angka karangan. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, bahasa } from "/i18n.js";
import { esc, ikon, hantuHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { muatData, tampilGalat, batangHtml, pasangBar, teksTek } from "/analisis.js";
import { seksi, catatan, narasi, saatBahasa, garisSvg } from "/info_kerangka.js";
import { num, L, legendaHtml, tabelUrut, sumberKartu, tautan } from "/sistem_umum.js";

const $ = (id) => document.getElementById(id);
const JENIS = ["batubara", "gas", "diesel", "hidro", "panas-bumi", "surya", "bayu", "bioenergi", "lain"];
const JENIS_PROD = JENIS.filter((j) => j !== "lain");
const EBT = new Set(["hidro", "panas-bumi", "surya", "bayu", "bioenergi"]);
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "penyimpanan"];
const namaJenis = (j) => t("sp2.jenis." + j);
const nama = (s) => L(s.nama, bahasa());
let d = null, kw = null;
const mw0 = (s) => s.beban_puncak_mw?.[0] ?? null;
const rmMin = (s) => (s.rm_persen ? Math.min(...s.rm_persen) : null);
const lamb = (k, u = 18) => `<img class="inf-lb-kecil" src="/img/provinsi/${esc(k)}.png" width="${u}" height="${u}" alt="" loading="lazy">`;
const kecil = (s) => s.provinsi.slice(0, 3).map((p) => lamb(p.kode, 16)).join("");
const namaLink = (s) => `<a class="inf-nama" href="/sistem/${esc(s.id)}" title="${esc(nama(s))}">${kecil(s)}${esc(s.singkat)}</a>`;
const bppRentang = (s) => { const v = s.bpp.map((x) => x.rp_kwh["2020"]).filter((x) => x != null); return v.length ? [Math.min(...v), Math.max(...v)] : null; };
const bppTeks = (s) => { const r = bppRentang(s); return r ? (r[0] === r[1] ? num(r[0], 0) : `${num(r[0], 0)}-${num(r[1], 0)}`) : "-"; };
const lgJenis = (arr) => legendaHtml(arr.map((j) => ({ kelas: "sp-t-" + j.replace(/^t:/, ""), teks: j.startsWith("t:") ? teksTek(j.slice(2)) : namaJenis(j) })));
const celahHtml = () => `<ul class="sp-celah">${d.meta.celah.map((_, i) => `<li>${ikon("info", 18)}<p>${esc(t("sp2.celah." + (i + 1)))}</p></li>`).join("")}</ul>`;
const sumberHtml = () => sumberKartu(d.sumber, d.dibangun_pada);
const interHtml = (ids) => `<ul class="sp-kartu">${d.interkoneksi.filter((x) => ids.includes(x.id)).map((x) => `<li><h3>${ikon("petir", 16)} ${esc(L(x.nama, bahasa()))}</h3><p>${esc(L(x.ket, bahasa()))}</p><div class="sp-baris"><span class="jm-pil jm-pil-warn">${esc(t("sp2.cod_null"))}</span>${tautan(x.url, t("sp2.sumber"))}</div></li>`).join("")}</ul>`;

function indeks() {
  const S = d.baris, tot = S.reduce((a, s) => a + s.kapasitas_mw.total, 0), terendah = S.filter(rmMin).sort((a, z) => rmMin(a) - rmMin(z))[0];
  khUbin("ubin", [
    { ikon: "sistem-listrik", nilai: num(S.length), label: t("sp2.ubin.sistem") },
    { ikon: "petir", nilai: num(tot), satuan: "MW", label: t("sp2.ubin.kap", { tahun: S[0].tahun_statistik }) },
    { ikon: "peringatan", nilai: num(rmMin(terendah), 1), satuan: "%", label: t("sp2.ubin.rm", { s: nama(terendah) }) },
  ]);
  const maks = Math.max(...S.map((s) => s.kapasitas_mw.total));
  const urut = [...S].sort((a, z) => z.kapasitas_mw.total - a.kapasitas_mw.total);
  const bar = batangHtml(urut.map((s) => ({ id: s.id, label: nama(s), labelHtml: namaLink(s), bagian: JENIS.map((j) => ({ nilai: s.kapasitas_mw[j], kelas: "sp-t-" + j })), teks: `${num(s.kapasitas_mw.total)} MW (${t("sp2.ebt_pct", { v: num((s.kapasitas_mw.ebt / s.kapasitas_mw.total) * 100, 0) })})` })), { label: t("sp2.bar.kap"), satuan: "MW", maks });
  const bauran = batangHtml([...S].sort((a, z) => z.bauran_ebt_persen - a.bauran_ebt_persen).map((s) => ({ id: s.id, label: nama(s), labelHtml: namaLink(s), bagian: [{ nilai: s.bauran_ebt_persen, kelas: "jm-an-id" }], teks: `${num(s.bauran_ebt_persen, 1)}%` })), { label: t("sp2.bar.bauran"), satuan: "%", maks: 100 });
  const kol = [
    { k: "nama", label: t("sp2.kol.sistem"), v: (s) => nama(s), f: (s) => namaLink(s) },
    { k: "kap", label: t("sp2.kol.kap"), v: (s) => s.kapasitas_mw.total, num: true, f: (s) => num(s.kapasitas_mw.total) },
    { k: "ebt", label: t("sp2.kol.ebt"), v: (s) => s.bauran_ebt_persen, num: true, f: (s) => num(s.bauran_ebt_persen, 1) + "%" },
    { k: "bp", label: t("sp2.kol.bp"), v: mw0, num: true, f: (s) => num(mw0(s)) },
    { k: "rm0", label: t("sp2.kol.rm0"), v: (s) => s.rm_persen?.[0] ?? null, num: true, f: (s) => (s.rm_persen ? num(s.rm_persen[0], 1) + "%" : "-") },
    { k: "rmmin", label: t("sp2.kol.rmmin"), v: rmMin, num: true, f: (s) => (rmMin(s) == null ? "-" : num(rmMin(s), 1) + "%") },
    { k: "bpp", label: t("sp2.kol.bpp"), v: (s) => bppRentang(s)?.[1] ?? null, num: true, f: bppTeks },
    { k: "ruptl", label: t("sp2.kol.ruptl"), v: (s) => s.ruptl.mw, num: true, f: (s) => num(s.ruptl.mw) },
  ];
  $("isi").innerHTML = `<div id="s-kap"></div><div id="s-bauran"></div><div id="s-tabel"></div><div id="s-inter"></div><div id="s-celah"></div>`;
  $("s-kap").innerHTML = seksi({ id: "kap", ik: "grafik", topik: t("sp2.kap.topik"), judul: t("sp2.kap.judul", { n: num(S.length), mw: num(tot) }), sub: t("sp2.kap.sub"), turunan: false, isi: `${narasi(t("sp2.kap.narasi"))}${lgJenis(JENIS)}<div id="bar-kap">${bar}</div>` });
  pasangBar($("bar-kap"));
  const top = [...S].sort((a, z) => z.bauran_ebt_persen - a.bauran_ebt_persen)[0];
  $("s-bauran").innerHTML = seksi({ id: "bauran", ik: "tek-bio", topik: t("sp2.bauran.topik"), judul: t("sp2.bauran.judul", { s: nama(top), v: num(top.bauran_ebt_persen, 1) }), sub: t("sp2.bauran.sub"), turunan: false, isi: `${narasi(t("sp2.bauran.narasi"))}<div id="bar-bauran">${bauran}</div>` });
  pasangBar($("bar-bauran"));
  $("s-tabel").innerHTML = seksi({ id: "tabel", ik: "tabel", topik: t("sp2.tabel.topik"), judul: t("sp2.tabel.judul", { n: num(S.length) }), sub: t("sp2.tabel.sub"), turunan: false, csv: true, isi: `<div id="t-sp"></div>` });
  tabelUrut($("t-sp"), { kolom: kol, baris: S, per: 10, urut: { k: "kap", arah: -1 }, label: t("sp2.tabel.label") });
  $("s-inter").innerHTML = seksi({ id: "inter", ik: "petir", topik: t("sp2.inter.topik"), judul: t("sp2.inter.judul", { n: num(d.interkoneksi.length) }), sub: t("sp2.inter.sub"), turunan: false, isi: `${narasi(t("sp2.inter.narasi"))}${interHtml(d.interkoneksi.map((x) => x.id))}` });
  $("s-celah").innerHTML = seksi({ id: "metode", ik: "metode", topik: t("sp2.metode.topik"), judul: t("sp2.metode.judul"), sub: t("sp2.metode.sub"), turunan: false, isi: `${celahHtml()}${catatan(t("sp2.metode.tanggal", { tanggal: d.dibangun_pada }))}${sumberHtml()}` });
}

function profil(s) {
  const k = s.kapasitas_mw, p = s.produksi_gwh, thn = (i) => 2025 + i;
  document.title = t("sp2.judul_profil", { s: nama(s) });
  for (const i of ["ey", "judul", "jawab"]) $(i).removeAttribute("data-i18n");
  $("ey").textContent = t("sp2.profil.ey"); $("judul").textContent = nama(s);
  $("jawab").textContent = t("sp2.profil.lead", { n: num(s.provinsi.length), kap: num(k.total), ebt: num(s.bauran_ebt_persen, 1) });
  khUbin("ubin", [
    { ikon: "petir", nilai: num(k.total), satuan: "MW", label: t("sp2.ubin.kap", { tahun: s.tahun_statistik }) },
    { ikon: "tek-bio", nilai: num(s.bauran_ebt_persen, 1), satuan: "%", label: t("sp2.ubin.bauran") },
    { ikon: "jam", nilai: s.rm_persen ? num(s.rm_persen[0], 1) : "-", satuan: s.rm_persen ? "%" : "", label: t("sp2.ubin.rm0", { tahun: thn(0) }) },
  ]);
  const garisDeret = (arr, lab, tipKey, ref) => { const gw = Math.max(...arr) >= 10000, k = gw ? 1000 : 1; return `<div><h3 class="jm-bantu">${esc(lab)}${gw ? ` (${esc(t("sp2.dlg.gw"))})` : ""}</h3><div class="jm-gf">${garisSvg({ titik: arr.map((v, i) => ({ x: thn(i), y: v / k, teks: `${thn(i)}: ${t(tipKey, { v: num(v, tipKey.endsWith("rm") ? 1 : 0) })}` })), ref: ref || [], lebar: 520, tinggi: 240, label: lab })}</div></div>`; };
  const ambang = d.baris.length ? [{ y: 35, teks: t("sp2.ref.rm") }] : [];
  const barJenis = (nilai, kunci, satuan) => batangHtml(kunci.filter((j) => nilai[j] > 0).map((j) => ({ label: namaJenis(j), labelHtml: `<span class="sp-teknis"><i class="sp-t-${j}"></i>${esc(namaJenis(j))}</span>`, bagian: [{ nilai: nilai[j], kelas: "sp-t-" + j }], teks: `${num(nilai[j])} ${satuan}` })), { label: satuan, satuan });
  const ruptlTh = Object.keys(s.ruptl.per_tahun).sort();
  const adaTek = TEK.filter((x) => ruptlTh.some((y) => s.ruptl.per_tahun[y][x]));
  const barRuptl = batangHtml(ruptlTh.map((y) => ({ label: y, bagian: adaTek.map((x) => ({ nilai: s.ruptl.per_tahun[y][x] || 0, kelas: "sp-t-" + x })), teks: `${num(adaTek.reduce((a, x) => a + (s.ruptl.per_tahun[y][x] || 0), 0))} MW` })), { label: t("sp2.bar.ruptl"), satuan: "MW" });
  const bppT = `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak" aria-label="${esc(t("sp2.bpp.label"))}"><thead><tr><th>${esc(t("sp2.kol.sistem"))}</th>${["2016", "2017", "2018", "2020"].map((y) => `<th class="jm-num">${y}</th>`).join("")}</tr></thead><tbody>${s.bpp.map((b) => `<tr><td data-label="${esc(t("sp2.kol.sistem"))}">${esc(b.nama)}</td>${["2016", "2017", "2018", "2020"].map((y) => `<td class="jm-num" data-label="${y}">${num(b.rp_kwh[y], y === "2020" ? 0 : 0)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const tabP = (arr) => `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr><th>${esc(t("sp2.kol.pembangkit"))}</th><th>${esc(t("sp2.kol.jenis"))}</th><th class="jm-num">MW</th><th>${esc(t("sp2.kol.prov"))}</th></tr></thead><tbody>${arr.map((x) => `<tr><td data-label="${esc(t("sp2.kol.pembangkit"))}"><a href="/p/${esc(x.id)}">${esc(x.nama)}</a></td><td data-label="${esc(t("sp2.kol.jenis"))}"><span class="sp-teknis"><i class="sp-t-${esc(x.teknologi)}"></i>${esc(teksTek(x.teknologi))}</span></td><td class="jm-num" data-label="MW">${num(x.mw)}</td><td data-label="${esc(t("sp2.kol.prov"))}">${esc(x.provinsi)}</td></tr>`).join("")}</tbody></table></div>`;
  $("isi").innerHTML = ["prov", "kap", "prod", "neraca", "ruptl", "bpp", "pemb", "riset", "kaw", "inter", "celah"].map((i) => `<div id="p-${i}"></div>`).join("");
  $("p-prov").innerHTML = seksi({ id: "prov", ik: "peta", topik: t("sp2.prov.topik"), judul: t("sp2.prov.judul", { n: num(s.provinsi.length) }), sub: t("sp2.prov.sub"), turunan: false,
    isi: `<p class="sp-bc"><a href="/sistem">${esc(t("sp2.semua"))}</a></p><ul class="sp-prov">${s.provinsi.map((p) => `<li><a href="/wilayah/${esc(p.kode)}">${lamb(p.kode, 18)}${esc(p.nama)}<small>${esc(p.kode)}</small></a></li>`).join("")}</ul>${s.subsistem.length ? `<p class="jm-bantu inf-cat">${esc(t("sp2.sub_ket", { daftar: s.subsistem.map((x) => x.nama).join(", ") }))}</p>` : ""}` });
  $("p-kap").innerHTML = seksi({ id: "kap", ik: "grafik", topik: t("sp2.kapp.topik"), judul: t("sp2.kapp.judul", { mw: num(k.total), e: num(k.ebt) }), sub: t("sp2.kapp.sub", { tahun: s.tahun_statistik }), turunan: false, isi: `${narasi(t("sp2.kapp.narasi"))}<div id="b-kap">${barJenis(k, JENIS, "MW")}</div>` });
  $("p-prod").innerHTML = seksi({ id: "prod", ik: "tek-bio", topik: t("sp2.prod.topik"), judul: t("sp2.prod.judul", { v: num(s.bauran_ebt_persen, 1), g: num(p.total) }), sub: t("sp2.prod.sub"), turunan: false, isi: `${narasi(t("sp2.prod.narasi"))}<div id="b-prod">${barJenis(p, JENIS_PROD, "GWh")}</div>` });
  if (s.beban_puncak_mw || s.rm_persen) {
    $("p-neraca").innerHTML = seksi({ id: "neraca", ik: "jam", topik: t("sp2.neraca.topik"), judul: t("sp2.neraca.judul", { rm: s.rm_persen ? num(Math.min(...s.rm_persen), 1) : "-", bp: s.beban_puncak_mw ? num(s.beban_puncak_mw[9]) : "-" }), sub: t("sp2.neraca.sub"), turunan: false,
      isi: `${narasi(t("sp2.neraca.narasi." + s.rm_ket))}<div class="sp-grid2">${s.rm_persen ? garisDeret(s.rm_persen, t("sp2.dlg.rm"), "sp2.tip.rm", ambang) : ""}${s.beban_puncak_mw ? garisDeret(s.beban_puncak_mw, t("sp2.dlg.bp"), "sp2.tip.mw") : ""}${s.ebt_dmn_mw ? garisDeret(s.ebt_dmn_mw, t("sp2.dlg.ebt"), "sp2.tip.mw") : ""}</div>${s.penyimpanan_ruptl_mw ? catatan(t("sp2.simpan", { mw: num(s.penyimpanan_ruptl_mw) })) : ""}` });
  } else $("p-neraca").innerHTML = "";
  $("p-ruptl").innerHTML = seksi({ id: "ruptl", ik: "kalender", topik: t("sp2.ruptl.topik"), judul: t("sp2.ruptl.judul", { n: num(s.ruptl.jumlah_proyek), mw: num(s.ruptl.mw) }), sub: t("sp2.ruptl.sub"), turunan: false,
    isi: ruptlTh.length ? `${narasi(t("sp2.ruptl.narasi"))}${lgJenis(adaTek.map((x) => "t:" + x))}<div id="b-ruptl">${barRuptl}</div>` : `<p class="jm-bantu">${esc(t("sp2.ruptl.kosong"))}</p>` });
  $("p-bpp").innerHTML = seksi({ id: "bpp", ik: "kalkulator", topik: t("sp2.bpp.topik"), judul: t("sp2.bpp.judul", { v: bppTeks(s) }), sub: t("sp2.bpp.sub"), turunan: false, isi: `${bppT}${catatan(t("sp2.bpp.catatan", { n: num(d.bpp_nasional_2025.rp_kwh), m: num(d.bpp_nasional_2025.proyeksi_2034_rp_kwh) }))}` });
  $("p-pemb").innerHTML = seksi({ id: "pemb", ik: "proyek", topik: t("sp2.pemb.topik"), judul: t("sp2.pemb.judul", { n: num(s.pembangkit_beroperasi.length + s.pembangkit_rencana.length) }), sub: t("sp2.pemb.sub"), turunan: false,
    isi: `${s.pembangkit_beroperasi.length ? `<h3 class="jm-bantu">${esc(t("sp2.pemb.ops"))}</h3>${tabP(s.pembangkit_beroperasi)}` : ""}${s.pembangkit_rencana.length ? `<h3 class="jm-bantu">${esc(t("sp2.pemb.rencana"))}</h3>${tabP(s.pembangkit_rencana)}` : ""}${!s.pembangkit_beroperasi.length && !s.pembangkit_rencana.length ? `<p class="jm-bantu">${esc(t("sp2.pemb.kosong"))}</p>` : ""}<p class="jm-bantu inf-cat"><a href="/proyek">${esc(t("sp2.pemb.semua"))}</a></p>` });
  const rs = s.riset, pbr = rs.permintaan_baru, kk = (kw?.baris || []).filter((r) => r.kode && s.provinsi.some((p) => p.kode === r.kode));
  const li = (x) => `<li>${ikon("info", 16)}<span>${x}</span></li>`;
  const tabPb = pbr.besar.length ? `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr><th>${esc(t("sp2.riset.kol.nama"))}</th><th>${esc(t("sp2.riset.kol.kat"))}</th><th class="jm-num">MVA</th></tr></thead><tbody>${pbr.besar.map((x) => `<tr><td data-label="${esc(t("sp2.riset.kol.nama"))}">${x.kawasan_id ? `<a href="/kawasan/${esc(x.kawasan_id)}">${esc(x.nama)}</a>` : esc(x.nama)}</td><td data-label="${esc(t("sp2.riset.kol.kat"))}">${esc(x.kategori)}</td><td class="jm-num" data-label="MVA">${num(x.mva_akhir)}</td></tr>`).join("")}</tbody></table></div>` : "";
  $("p-riset").innerHTML = seksi({ id: "riset", ik: "petir", topik: t("sp2.riset.topik"), judul: t("sp2.riset.judul"), sub: t("sp2.riset.sub"), turunan: false,
    isi: `<ul class="kw-daftar">${rs.batas_penetrasi.map((x) => li(esc(t("sp2.riset.batas", { l: x.lingkup, v: num(x.batas_persen, 2), m: x.metrik, y: x.tahun })))).join("")}${rs.penyimpanan_ruptl_mw ? li(esc(t("sp2.riset.simpan", { mw: num(rs.penyimpanan_ruptl_mw) }))) : ""}${rs.curtailment.length ? rs.curtailment.map((x) => li(esc(t("sp2.riset.curt", { v: num(x.persen, 1), y: x.tahun })))).join("") : li(esc(t("sp2.riset.curt_kosong")))}${li(esc(pbr.butir ? t("sp2.riset.pb", { n: num(pbr.butir), mva: num(pbr.mva_akhir) }) : t("sp2.riset.pb_kosong")))}</ul>${tabPb}${rs.bersama_sumatera ? catatan(t("sp2.riset.bersama")) : ""}` });
  $("p-kaw").innerHTML = kk.length ? seksi({ id: "kaw", ik: "kawasan", topik: t("sp2.kaw.topik"), judul: t("sp2.kaw.judul", { n: num(kk.length) }), sub: t("sp2.kaw.sub"), turunan: false,
    isi: `<ul class="kw-daftar">${kk.sort((a, z) => (z.diriset ? 1 : 0) - (a.diriset ? 1 : 0) || a.nama.localeCompare(z.nama)).map((r) => `<li>${ikon("gedung", 16)}<span><a href="/kawasan/${esc(r.id)}">${esc(r.nama)}</a> <small>${esc(t("kw2.jenis." + r.jenis))}${r.diriset ? "" : ", " + esc(t("kw2.belum"))}</small></span></li>`).join("")}</ul>` }) : "";
  $("p-inter").innerHTML = s.interkoneksi.length ? seksi({ id: "inter", ik: "petir", topik: t("sp2.inter.topik"), judul: t("sp2.interp.judul", { n: num(s.interkoneksi.length) }), sub: t("sp2.inter.sub"), turunan: false, isi: interHtml(s.interkoneksi) }) : "";
  $("p-celah").innerHTML = seksi({ id: "metode", ik: "metode", topik: t("sp2.metode.topik"), judul: t("sp2.metode.judul"), sub: t("sp2.metode.sub"), turunan: false, isi: `${celahHtml()}${catatan(t("sp2.metode.tanggal", { tanggal: d.dibangun_pada }))}${sumberHtml()}` });
  for (const id of ["b-kap", "b-prod", "b-ruptl"]) if ($(id)) pasangBar($(id));
}

async function gambar() {
  const m = location.pathname.match(/^\/sistem\/([a-z-]+)$/);
  if (m) { const s = d.baris.find((x) => x.id === m[1]); if (s) return profil(s); }
  document.title = t("sp2.judul_halaman");
  indeks();
}
(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { [d, kw] = await Promise.all([muatData("sistem_pln.json"), muatData("kawasan_industri.json").catch(() => null)]); } catch { tampilGalat($("isi"), () => location.reload()); return; }
  await gambar();
  saatBahasa(() => gambar());
})();
