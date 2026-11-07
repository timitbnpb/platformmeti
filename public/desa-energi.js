/* /desa-energi: kerentanan desa per provinsi, hidro skala kecil, panduan koperasi energi desa dan pembiayaan. Hanya informasi.
   Data /data/desa_akses.json (scripts/pipa/desa_akses.mjs); teks /data/teks_desa.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, hantuHtml } from "/inti/umum.js";
import { muatData, tampilGalat, batangHtml, pasangBar, ubinHtml } from "/analisis.js";
import { t, angka } from "/i18n.js";
import { ikon, nanti } from "/inti/umum.js";
import { exHtml, sumberHtml, cariHtml, pilihHtml, hapusHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { muatTeks, tt, L, num, tgl, persen, tautan, url, seksi, catatan, narasi, sumber, butuhDaftar, tabel, petaHtml, pasangPeta, lambang, labelPil, saatBahasa } from "/info_kerangka.js";

const $ = (id) => document.getElementById(id);
let d = null, K = null;
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
    ...(K ? [{ ikon: "peringatan", nilai: `${num(K.baris.filter((r) => r.status !== "hidup").length)}/${num(K.baris.length)}`, label: t("de2.ubin.mati"), href: "#de-sebab" }] : []),
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


/* ---------- desa energi mandiri: peta berstatus, penyebab mati, daftar periksa, tabel (data /data/desa_energi_mandiri.json) ---------- */
const N2 = (n, dd = 0) => angka(n, { desimal: dd });
const SV = (dd) => `<svg class="jm-ikt jm-ikt-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const IK_ST = { hidup: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>', rusak: '<path d="M12 3 2 20h20zM12 10v5M12 18h.01"/>', mati: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>' };
const IK_SB = { komponen: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>', biaya: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5"/>', kelembagaan: '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>', sdm: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', bencana: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', jaringan_pln: '<path d="M4 20 12 4l8 16M7 14h10M9 9h6"/>', beban: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>', tak_diketahui: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>' };
const IK_JN = { "plts-komunal": IKON_TEK.surya, pltmh: IKON_TEK.hidro, biogas: IKON_TEK.bioenergi };
const WS = { hidup: "--ok", rusak: "--warn", mati: "--bad" };
const kecilIk = (x) => x.replace('class="jm-ikt"', 'class="jm-ikt jm-ikt-s"');
const pilSt = (s) => `<span class="de2-pil de2-s-${s}">${SV(IK_ST[s])}<span>${esc(t("de2.st." + s))}</span></span>`;
const pilJn = (j) => `<span class="de2-jenis de2-j-${j}">${kecilIk(IK_JN[j])}<span>${esc(t("de2.jn." + j))}</span></span>`;
const chipSb = (p) => `<span class="de2-sb de2-p-${p}">${SV(IK_SB[p])}${esc(t("de2.sb." + p))}</span>`;
const sbHtml = (r) => (r.penyebab.length ? `<span class="de2-sebab">${r.penyebab.map(chipSb).join("")}</span>` : `<span class="jm-bantu">-</span>`);
const DS = { q: "", jenis: "", status: "", pilih: -1 };
const DT = { petaObj: null, siap: false, cek: new Set() };
const cocokK = (r, abaikanStatus) => (!DS.jenis || r.jenis === DS.jenis) && (abaikanStatus || !DS.status || r.status === DS.status) && (!DS.q || `${r.nama} ${r.kabupaten || ""} ${r.provinsi}`.toLowerCase().includes(DS.q));
const kasusTerpilih = (abaikanStatus) => K.baris.filter((r) => cocokK(r, abaikanStatus));
const lokasiK = (r) => `<b>${esc(r.nama)}</b><div class="pb-prov"><span class="pt2-prov"><img src="/img/provinsi/${esc(r.kode_prov)}.png" width="16" height="16" alt="" loading="lazy" decoding="async" data-galat="hapus">${esc([r.kabupaten, r.provinsi].filter(Boolean).join(", "))}</span></div>`;
const sumberK = (r) => sumberHtml(`<a href="${esc(r.sumber.url)}" target="_blank" rel="noopener noreferrer">${esc(r.sumber.judul)}</a> (${esc(r.sumber.penerbit)}, ${esc(r.sumber.tanggal)})<br>${esc(r.uraian)}`);
const cekDef = ["biaya", "kelembagaan", "sdm", "beban", "bencana", "komponen", "jaringan_pln"];
const CEK_CONTOH = { biaya: "de-muara-enggelam", kelembagaan: "de-muara-enggelam", sdm: "de-talang-aro", beban: "de-tepal", bencana: "de-talang-aro", komponen: "de-parang", jaringan_pln: "de-karangtengah" };

function kerangkaKasus() {
  const nJ = K.baris.reduce((m, r) => (m[r.jenis] = (m[r.jenis] || 0) + 1, m), {}), nS = K.baris.reduce((m, r) => (m[r.status] = (m[r.status] || 0) + 1, m), {});
  const saring = `<div class="jm-saring pt2-saring" role="group" aria-label="${esc(t("de2.saring"))}">
    ${cariHtml({ id: "deQ", label: t("de2.cari"), placeholder: t("de2.cari.ph") })}
    ${pilihHtml({ id: "deJn", ikon: "jenis", label: t("de2.f.jenis"), opsi: [["", t("de2.semua.jenis")], ...K.meta.jenis.filter((k) => nJ[k]).map((k) => [k, t("de2.jn." + k), { "plts-komunal": "tek:surya", pltmh: "tek:hidro", biogas: "tek:bioenergi" }[k], nJ[k]])], nilai: DS.jenis })}
    ${pilihHtml({ id: "deSt", ikon: "status", label: t("de2.f.status"), opsi: [["", t("de2.semua.status")], ...K.meta.status.filter((k) => nS[k]).map((k) => [k, t("de2.st." + k), { hidup: "centang", rusak: "peringatan", mati: "silang" }[k], nS[k]])], nilai: DS.status })}
    ${hapusHtml({ id: "deHapus", label: t("de2.f.hapus") })}</div>`;
  const peta_ = `<div class="pt2-peta">
    <div id="dePeta" class="pt2-kanvas" role="application" aria-label="${esc(t("de2.peta.label"))}"></div>
    <div id="deTip" class="pt2-tip" role="status" hidden></div>
    <details class="pt2-lapis" id="deLapis" open><summary><span>${esc(t("de2.lapis"))}</span></summary><div class="pt2-lapis-isi" id="deLapisIsi"></div></details>
    <details class="pt2-panel" id="dePanel" open><summary id="dePanelJ"><span>${esc(t("de2.panel"))}</span></summary><div class="pt2-panel-isi" id="dePanelIsi" aria-live="polite"></div></details>
  </div>`;
  const metode = sumberHtml(`${esc(K.meta.metode)}<br>${esc(K.meta.tanpa)}<br>${K.meta.celah.map(esc).join("<br>")}`);
  $("de2").innerHTML = [
    exHtml({ id: "de-saring", ikon: "cari2", topik: t("de2.ex.saring"), judulHtml: " ", subHtml: " ", isiHtml: saring }),
    exHtml({ id: "de-peta", ikon: "peta", topik: t("de2.ex.peta"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + metode, isiHtml: peta_ }),
    exHtml({ id: "de-sebab", ikon: "grafik", topik: t("de2.ex.sebab"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + metode, isiHtml: `<div id="deSebab"></div>` }),
    exHtml({ id: "de-cek", ikon: "centang", topik: t("de2.ex.cek"), judulHtml: " ", subHtml: " ", aksiHtml: metode, isiHtml: `<div id="deCek"></div>` }),
    exHtml({ id: "de-kasus", ikon: "tabel", topik: t("de2.ex.tabel"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml({ csv: true }) + metode, isiHtml: `<div id="deTabel"></div>` }),
  ].join("");
  import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {});
}
const judulK = (id, j, s) => { const ex = $(id); if (!ex) return; ex.querySelector(".jm-ex-j").innerHTML = j; ex.querySelector(".jm-ex-sub").innerHTML = s; };
function gambarKasus() {
  const rows = kasusTerpilih(), mati = rows.filter((r) => r.status !== "hidup").length;
  $("deHapus").hidden = !(DS.q || DS.jenis || DS.status);
  judulK("de-saring", hlHtml("de2.ex.saring.j", N2(rows.length)), esc(t("de2.ex.saring.s", { n: N2(mati) })));
  judulK("de-peta", hlHtml("de2.ex.peta.j", N2(rows.length)), esc(t("de2.ex.peta.s")));
  const per = {}; for (const r of kasusTerpilih(true)) per[r.status] = (per[r.status] || 0) + 1;
  $("deLapisIsi").innerHTML = `<p class="pt2-leg-j">${esc(t("de2.lapis.status"))}</p><ul class="pt2-leg-daftar">${K.meta.status.filter((k) => per[k] || DS.status === k).map((k) => `<li><button type="button" class="pt2-leg" data-st="${k}" aria-pressed="${DS.status === k}"><i class="pt2-titik de2-t-${k}" aria-hidden="true"></i><span>${esc(t("de2.st." + k))}</span><b>${N2(per[k] || 0)}</b></button></li>`).join("")}</ul><p class="pt2-attr">${esc(t("de2.lapis.attr"))}</p>`;
  petaK(rows); panelK(); sebabK(); tabelK(rows);
}
/* peta: titik di pusat kabupaten disebar spiral supaya tidak menumpuk */
function titikK(rows) {
  const g = new Map();
  return { type: "FeatureCollection", features: rows.map((r) => {
    const k = `${r.lokasi.lat},${r.lokasi.lng}`, n = g.get(k) || 0; g.set(k, n + 1);
    const a = n * 2.39996, dd = n ? 0.13 * Math.sqrt(n) : 0;
    return { type: "Feature", geometry: { type: "Point", coordinates: [r.lokasi.lng + dd * Math.cos(a), r.lokasi.lat + dd * Math.sin(a)] }, properties: { i: K.baris.indexOf(r), s: r.status } };
  }) };
}
const warnaV = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelapK = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme:dark)").matches);
const gayaK = () => "https://tiles.openfreemap.org/styles/" + (gelapK() ? "dark" : "positron");
const petaK = (rows) => { const p = DT.petaObj; if (p && DT.siap) { p.getSource("de")?.setData(titikK(rows)); p.setFilter("de-sel", ["==", ["get", "i"], DS.pilih]); } };
function bukaPetaK() {
  const lo = K.baris.map((r) => r.lokasi.lng), la = K.baris.map((r) => r.lokasi.lat), BD = [[Math.min(...lo) - 1.5, Math.min(...la) - 1.5], [Math.max(...lo) + 1.5, Math.max(...la) + 1.5]];
  muatMapLibre().then(() => {
    const p = DT.petaObj = new maplibregl.Map({ container: "dePeta", style: gayaK(), bounds: BD, fitBoundsOptions: { padding: padK() }, minZoom: 2, maxZoom: 11, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    p.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: t("de2.attr") }), "bottom-left");
    p.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    p.on("style.load", () => {
      DT.siap = true; const il = rapikanPeta(p);
      p.addSource("de", { type: "geojson", data: titikK(kasusTerpilih()) });
      p.addLayer({ id: "de-titik", type: "circle", source: "de", paint: { "circle-color": ["match", ["get", "s"], ...K.meta.status.flatMap((k) => [k, warnaV(WS[k])]), warnaV("--ink2")], "circle-radius": 8, "circle-opacity": 0.92, "circle-stroke-color": warnaV("--card"), "circle-stroke-width": 1.5 } });
      p.addLayer({ id: "de-sel", type: "circle", source: "de", filter: ["==", ["get", "i"], DS.pilih], paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": 12, "circle-stroke-color": warnaV("--sorot"), "circle-stroke-width": 3 } });
      pasangBatas(p, warnaV, il, "de-titik");
    });
    new ResizeObserver(() => p.resize()).observe($("dePeta"));
    p.once("idle", () => { p.resize(); p.fitBounds(BD, { padding: padK(), duration: 0 }); });
    p.on("click", "de-titik", (e) => pilihK(e.features[0].properties.i, false));
    p.on("mousemove", "de-titik", (e) => {
      p.getCanvas().style.cursor = "pointer"; const r = K.baris[e.features[0].properties.i], tip = $("deTip"); if (!r) return;
      tip.innerHTML = `<b>${esc(r.nama)}</b><span>${esc([r.kabupaten, r.provinsi].filter(Boolean).join(", "))}</span>${pilSt(r.status)}`; tip.hidden = false;
      const w = $("dePeta").clientWidth; tip.style.left = Math.min(Math.max(e.point.x + 14, 8), w - tip.offsetWidth - 8) + "px"; tip.style.top = Math.max(8, e.point.y - tip.offsetHeight - 14) + "px";
    });
    p.on("mouseleave", "de-titik", () => { p.getCanvas().style.cursor = ""; $("deTip").hidden = true; });
    new MutationObserver(() => { DT.siap = false; DT.petaObj && DT.petaObj.setStyle(gayaK()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("dePeta").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("de2.peta.galat"))}</p></div>`; });
}
function padK() {
  const box = $("dePeta").getBoundingClientRect(), p = { top: 16, bottom: 16, left: 12, right: 12 };
  if (innerWidth < 1000) return p;
  for (const id of ["deLapis", "dePanel"]) { const r = $(id).getBoundingClientRect(), c = r.left + r.width / 2 - box.left; if (c < box.width / 2) p.left = Math.max(p.left, r.right - box.left + 16); else p.right = Math.max(p.right, box.right - r.left + 16); }
  return p;
}
function pilihK(i, fokus) {
  DS.pilih = i; panelK(); petaK(kasusTerpilih());
  const r = K.baris[i], p = DT.petaObj;
  if (fokus && p && r) p.flyTo({ center: [r.lokasi.lng, r.lokasi.lat], zoom: Math.max(p.getZoom(), 6.5), padding: padK(), duration: 600 });
  $("dePanel").open = true;
}
function panelK() {
  const el = $("dePanelIsi"), r = K.baris[DS.pilih];
  if (r && cocokK(r)) {
    const b = (k, v) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`;
    el.innerHTML = `<button type="button" class="jm-tbl jm-tbl-kecil pt2-kembali" data-aksi="kembali">${ikon("panah-kiri", 16)}<span>${esc(t("pt2.d.kembali"))}</span></button>
      <p class="pt2-det-nama"><b>${esc(r.nama)}</b></p><div class="pt2-det-pil">${pilJn(r.jenis)}${pilSt(r.status)}</div>
      <p>${esc(r.uraian)}</p>
      <dl class="pt2-det">${b("de2.c.lokasi", esc([r.kabupaten, r.provinsi].filter(Boolean).join(", ")))}${b("de2.c.kap", r.kapasitas_kw == null ? "-" : `${esc(N2(r.kapasitas_kw))} kW`)}${b("de2.c.bangun", esc(r.tahun_bangun ?? "-"))}${b("de2.c.henti", esc(r.tahun_henti ?? "-"))}${b("de2.c.sebab", sbHtml(r))}${b("de2.c.presisi", esc(r.lokasi.catatan))}${b("de2.c.sumber", `<a href="${esc(r.sumber.url)}" target="_blank" rel="noopener noreferrer">${esc(r.sumber.penerbit)}, ${esc(r.sumber.tanggal)}</a>`)}</dl>`;
    $("dePanelJ").firstElementChild.textContent = t("de2.panel.rinci"); return;
  }
  DS.pilih = -1;
  const top = kasusTerpilih().slice().sort((a, z) => ({ mati: 0, rusak: 1, hidup: 2 }[a.status] - { mati: 0, rusak: 1, hidup: 2 }[z.status]) || a.nama.localeCompare(z.nama)).slice(0, 8);
  el.innerHTML = top.length ? `<ol class="pt2-rank">${top.map((x, n) => `<li><button type="button" class="pt2-rank-b" data-i="${K.baris.indexOf(x)}"><span class="jm-rank${n < 3 ? " jm-rank-top" : ""}">${n + 1}</span><span class="pt2-rank-t"><b>${esc(x.nama)}</b><span class="pt2-rank-s">${pilJn(x.jenis)}</span></span><span class="pt2-rank-v">${pilSt(x.status)}</span></button></li>`).join("")}</ol>` : `<div class="jm-kosong">${ikon("info", 24)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`;
  $("dePanelJ").firstElementChild.textContent = t("de2.panel");
}
/* penyebab: hitung kasus rusak/mati per penyebab (satu kasus bisa lebih dari satu penyebab) */
function sebabK() {
  const rows = kasusTerpilih(true).filter((r) => r.status !== "hidup"), per = {};
  for (const r of rows) for (const p of r.penyebab) (per[p] ||= []).push(r);
  const urut = K.meta.penyebab.filter((p) => per[p]).sort((a, z) => per[z].length - per[a].length), el = $("deSebab");
  const top = urut[0];
  judulK("de-sebab", top ? hlHtml("de2.ex.sebab.j", N2(rows.length), { sebab: t("de2.sb." + top).toLowerCase(), n: N2(per[top].length) }) : esc(t("de2.ex.sebab.kosong")), esc(t("de2.ex.sebab.s")));
  if (!urut.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 24)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`; return; }
  const baris = urut.map((p) => ({ id: p, label: t("de2.sb." + p), labelHtml: chipSb(p), bagian: [{ nilai: per[p].length, kelas: "de2-b-sebab de2-p-" + p }], teks: t("de2.g.nilai", { n: N2(per[p].length), p: N2((per[p].length / rows.length) * 100) }) }));
  el.innerHTML = `${batangHtml(baris, { label: t("de2.ex.sebab"), maks: rows.length })}`;
  pasangBar(el);
  const lis = el.querySelectorAll(".jm-batang>li.jm-bar-b");
  urut.forEach((p, i) => { const li = lis[i]; if (!li) return; li.removeAttribute("title"); li.dataset.tip = `${t("de2.sb." + p)}: ${t("de2.g.tip", { n: N2(per[p].length), tot: N2(rows.length), daftar: per[p].map((r) => r.nama).join("; ") })}`; li.tabIndex = 0; });
}
function cekK() {
  const mati = K.baris.filter((r) => r.status !== "hidup"), per = {};
  for (const r of mati) for (const p of r.penyebab) per[p] = (per[p] || 0) + 1;
  const ok = cekDef.filter((k) => DT.cek.has(k)).length, kl = ok >= 6 ? "hidup" : ok >= 3 ? "rusak" : "mati";
  judulK("de-cek", hlHtml("de2.ex.cek.j", N2(cekDef.length)), esc(t("de2.ex.cek.s")));
  $("deCek").innerHTML = `<div class="de2-skor"><span class="de2-pil de2-s-${kl}">${SV(IK_ST[kl])}<span>${esc(t("de2.cek.nilai." + kl))}</span></span><b>${ok} / ${cekDef.length}</b><span class="jm-bantu">${esc(t("de2.cek.petunjuk"))}</span></div>
    <ul class="de2-cek">${cekDef.map((k) => {
      const c = K.baris.find((r) => r.id === CEK_CONTOH[k]);
      return `<li><label class="de2-cek-i"><input type="checkbox" data-cek="${k}"${DT.cek.has(k) ? " checked" : ""}><span class="de2-kotak">${SV('<path d="m5 12 5 5 9-10"/>')}</span><span class="de2-cek-t"><b>${esc(t("de2.cek." + k))}</b><p>${esc(t("de2.cek." + k + ".u"))}</p><span class="de2-cek-m">${chipSb(k)}<span class="jm-bantu">${esc(t("de2.cek.kasus", { n: N2(per[k] || 0), tot: N2(mati.length) }))}</span>${c ? `<a href="${esc(c.sumber.url)}" target="_blank" rel="noopener noreferrer">${esc(t("de2.cek.contoh", { nama: c.nama }))}</a>` : ""}</span></span></label></li>`;
    }).join("")}</ul>`;
}
function tabelK(rows) {
  judulK("de-kasus", hlHtml("de2.ex.tabel.j", N2(rows.length)), esc(t("de2.ex.tabel.s")));
  const el = document.createElement("div"); $("deTabel").replaceChildren(el);
  tabel(el, { baris: rows, per: 10, satuan: "de2.pag.u", urut: { k: "status", arah: 1 }, label: t("de2.ex.tabel"), kolom: [
    { k: "nama", label: t("de2.c.lokasi"), v: (r) => r.nama, f: lokasiK },
    { k: "jenis", label: t("de2.c.jenis"), tengah: true, v: (r) => t("de2.jn." + r.jenis), f: (r) => pilJn(r.jenis) },
    { k: "status", label: t("de2.c.status"), tengah: true, v: (r) => ({ mati: 0, rusak: 1, hidup: 2 }[r.status]), f: (r) => pilSt(r.status) },
    { k: "kap", label: t("de2.c.kap"), num: true, v: (r) => r.kapasitas_kw, f: (r) => (r.kapasitas_kw == null ? '<span class="jm-bantu">-</span>' : `${N2(r.kapasitas_kw)} kW`) },
    { k: "tahun", label: t("de2.c.bangun"), tengah: true, v: (r) => r.tahun_bangun, f: (r) => r.tahun_bangun ?? '<span class="jm-bantu">-</span>' },
    { k: "sebab", label: t("de2.c.sebab"), v: (r) => r.penyebab.length, f: sbHtml },
    { k: "sumber", label: t("de2.c.sumber"), tengah: true, v: (r) => r.sumber.penerbit, f: sumberK },
  ] });
}
function pasangKasus() {
  const seg = (fn) => { fn(); nanti(gambarKasus); };
  $("deQ").addEventListener("input", (e) => seg(() => { DS.q = e.target.value.trim().toLowerCase(); }));
  $("deJn").addEventListener("change", (e) => seg(() => { DS.jenis = e.target.value; }));
  $("deSt").addEventListener("change", (e) => seg(() => { DS.status = e.target.value; }));
  $("deHapus").addEventListener("click", () => { DS.q = DS.jenis = DS.status = ""; $("deQ").value = ""; $("deJn").value = ""; $("deSt").value = ""; nanti(gambarKasus); });
  $("deLapis").addEventListener("click", (e) => { const b = e.target.closest("[data-st]"); if (b) { DS.status = DS.status === b.dataset.st ? "" : b.dataset.st; $("deSt").value = DS.status; nanti(gambarKasus); } });
  $("dePanel").addEventListener("click", (e) => { const b = e.target.closest(".pt2-rank-b"); if (b) pilihK(+b.dataset.i, true); if (e.target.closest("[data-aksi=kembali]")) { DS.pilih = -1; panelK(); petaK(kasusTerpilih()); } });
  $("deCek").addEventListener("change", (e) => { const c = e.target.closest("[data-cek]"); if (!c) return; DT.cek[c.checked ? "add" : "delete"](c.dataset.cek); nanti(cekK); });
}
async function bagKasus() {
  if (!K) { try { K = await muatData("desa_energi_mandiri.json"); } catch (e) { return; } }
  if (DT.petaObj) { DT.petaObj.remove(); DT.petaObj = null; DT.siap = false; }
  kerangkaKasus(); pasangKasus();
  if (innerWidth >= 1000) { geserPanel($("deLapis"), { kunci: "lapis" }); geserPanel($("dePanel"), { kunci: "panel" }); }
  gambarKasus(); cekK(); bukaPetaK();
}

async function gambar() {
  await bagKasus();
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
