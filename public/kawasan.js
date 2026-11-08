/* /kawasan (indeks 141 kawasan industri dan KEK) dan /kawasan/<id> (profil listrik). Data /data/kawasan_industri.json
   (scripts/panen/kawasan_profil.mjs): kawasan.json + PLTU captive GEM + riset media bertanggal. Yang belum diriset ditandai, bukan nol. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, bahasa } from "/i18n.js";
import { esc, ikon, hantuHtml, nanti } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import "/inti/tautan_org.js";
import { muatData, tampilGalat, batangHtml, pasangBar, pasangSeg } from "/analisis.js";
import { seksi, catatan, narasi, saatBahasa } from "/info_kerangka.js";
import { petaKoroplet } from "/peta_koroplet.js";
import { num, L, tabelUrut, sumberKartu, tautan, legendaHtml } from "/sistem_umum.js";

const $ = (id) => document.getElementById(id);
let d = null, sis = null, filter = "semua";
const lamb = (k, u = 16) => (k ? `<img class="inf-lb-kecil" src="/img/provinsi/${esc(k)}.png" width="${u}" height="${u}" alt="" loading="lazy">` : "");
const sistemDari = (kode) => sis?.baris.find((s) => s.provinsi.some((p) => p.kode === kode));
const namaSis = (s) => L(s.nama, bahasa());
const org = (r) => (r.pengelola ? `<span class="kw-org">${r.pengelola_org_id ? `<img src="${esc(logoOrgSatu(r.pengelola_org_id, r.pengelola))}" alt="" data-galat="hapus" loading="lazy">` : ""}<a data-org-nama="${esc(r.pengelola)}">${esc(r.pengelola)}</a></span>` : esc(t("kw2.tak_tercatat")));
const pilJenis = (r) => `<span class="jm-pil ${r.jenis === "kek" ? "jm-pil-ok" : ""}">${esc(t("kw2.jenis." + r.jenis))}</span>`;
const pilRiset = (r) => (r.diriset ? `<span class="jm-pil jm-pil-ok">${esc(t("kw2.diriset"))}</span>` : `<span class="jm-pil jm-pil-warn">${esc(t("kw2.belum"))}</span>`);
const namaLink = (r) => `<a href="/kawasan/${esc(r.id)}">${esc(r.nama)}</a>`;
const daya = (r) => (r.kebutuhan_mva != null ? `${num(r.kebutuhan_mva)} MVA` : r.kebutuhan_mw_kek != null ? `${num(r.kebutuhan_mw_kek)} MW` : r.kebutuhan_mw_captive != null ? `${num(r.kebutuhan_mw_captive)} MW` : "-");
const dayaNilai = (r) => r.kebutuhan_mva ?? r.kebutuhan_mw_kek ?? r.kebutuhan_mw_captive ?? null;
const sumberDaftar = (r) => r.sumber.map((s) => ({ ...s, tanggal: s.tanggal }));
const celahHtml = () => `<ul class="sp-celah">${d.meta.celah.map((_, i) => `<li>${ikon("info", 18)}<p>${esc(t("kw2.celah." + (i + 1)))}</p></li>`).join("")}</ul>`;
const saring = () => d.baris.filter((r) => filter === "semua" || (filter === "diriset" ? r.diriset : r.jenis === filter));

function indeks() {
  const B = d.baris, cap = B.filter((r) => r.captive), mwCap = cap.reduce((a, r) => a + r.captive.mw_operasi, 0);
  khUbin("ubin", [
    { ikon: "kawasan", nilai: num(B.length), label: t("kw2.ubin.kawasan", { kek: num(d.meta.jumlah_kek) }) },
    { ikon: "tabel", nilai: num(d.meta.jumlah_diriset), satuan: `/ ${num(B.length)}`, label: t("kw2.ubin.diriset") },
    { ikon: "petir", nilai: num(mwCap), satuan: "MW", label: t("kw2.ubin.captive", { n: num(cap.length) }) },
  ]);
  const seg = ["semua", "kek", "ki", "diriset"].map((k) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${esc(t("kw2.f." + k))}</button>`).join("");
  $("isi").innerHTML = `<div id="s-peta"></div><div id="s-cap"></div><div id="s-tabel"></div><div id="s-celah"></div>`;
  const cc = [...cap].sort((a, z) => z.captive.mw_operasi + z.captive.mw_konstruksi - (a.captive.mw_operasi + a.captive.mw_konstruksi));
  $("s-peta").innerHTML = seksi({ id: "peta", ik: "peta", topik: t("kw2.peta.topik"), judul: t("kw2.peta.judul", { n: num(B.length), p: num(new Set(B.map((r) => r.kode).filter(Boolean)).size) }), sub: t("kw2.peta.sub"), turunan: false, isi: `${narasi(t("kw2.peta.narasi"))}<div id="peta-isi"></div>` });
  $("s-cap").innerHTML = seksi({ id: "captive", ik: "petir", topik: t("kw2.cap.topik"), judul: t("kw2.cap.judul", { n: num(cap.length), mw: num(mwCap) }), sub: t("kw2.cap.sub"), turunan: false,
    isi: `${narasi(t("kw2.cap.narasi"))}${legendaHtml([{ kelas: "kw-cap-o", teks: t("kw2.cap.ops") }, { kelas: "kw-cap-k", teks: t("kw2.cap.kons") }, { kelas: "kw-cap-r", teks: t("kw2.cap.rencana") }])}<div id="bar-cap">${batangHtml(cc.map((r) => ({ id: r.id, label: r.nama, labelHtml: `${lamb(r.kode)}${namaLink(r)}`, bagian: [{ nilai: r.captive.mw_operasi, kelas: "kw-cap-o" }, { nilai: r.captive.mw_konstruksi, kelas: "kw-cap-k" }, { nilai: r.captive.mw_rencana, kelas: "kw-cap-r" }], teks: `${num(r.captive.mw_operasi)} / ${num(r.captive.mw_konstruksi)} / ${num(r.captive.mw_rencana)} MW` })), { label: t("kw2.cap.label"), satuan: "MW" })}</div>` });
  pasangBar($("bar-cap"));
  $("s-tabel").innerHTML = seksi({ id: "tabel", ik: "tabel", topik: t("kw2.tabel.topik"), judul: t("kw2.tabel.judul", { n: num(B.length) }), sub: t("kw2.tabel.sub"), turunan: false, csv: true, isi: `<div class="jm-seg" role="group" aria-label="${esc(t("kw2.f.label"))}" id="kwSeg">${seg}</div><div id="t-kw"></div>` });
  const kol = [
    { k: "nama", label: t("kw2.kol.nama"), v: (r) => r.nama, f: (r) => namaLink(r) },
    { k: "jenis", label: t("kw2.kol.jenis"), v: (r) => r.jenis, f: pilJenis },
    { k: "prov", label: t("kw2.kol.prov"), v: (r) => r.provinsi, f: (r) => `<span class="inf-nama">${lamb(r.kode)}${esc(r.provinsi)}</span>` },
    { k: "pengelola", label: t("kw2.kol.pengelola"), v: (r) => r.pengelola ?? "", f: org },
    { k: "daya", label: t("kw2.kol.daya"), v: dayaNilai, num: true, f: daya },
    { k: "ebt", label: t("kw2.kol.ebt"), v: (r) => r.ebt_operasi_mw, num: true, f: (r) => (r.ebt_operasi_mw == null ? "-" : num(r.ebt_operasi_mw, 1) + " MW") },
    { k: "riset", label: t("kw2.kol.riset"), v: (r) => (r.diriset ? 1 : 0), tengah: true, f: pilRiset },
  ];
  const tb = tabelUrut($("t-kw"), { kolom: kol, baris: saring(), per: 10, urut: { k: "riset", arah: -1 }, label: t("kw2.tabel.label"), satuan: "kw2.satuan" });
  pasangSeg($("kwSeg"), "f", () => filter, (v) => { filter = v; }, () => tb.set(saring()), nanti);
  $("s-celah").innerHTML = seksi({ id: "metode", ik: "metode", topik: t("kw2.metode.topik"), judul: t("kw2.metode.judul"), sub: t("kw2.metode.sub"), turunan: false, isi: `${celahHtml()}${catatan(t("kw2.metode.tanggal", { tanggal: d.dibangun_pada }))}` });
  const hit = new Map(); for (const r of B) if (r.kode) hit.set(r.kode, (hit.get(r.kode) || 0) + 1);
  const mx = Math.max(...hit.values()), pet = new Map([...hit].map(([k, v]) => [k, { kelas: Math.min(4, Math.floor((v / mx) * 4.99)), tip: t("kw2.tip.prov", { p: B.find((r) => r.kode === k).provinsi, n: num(v) }) }]));
  petaKoroplet({ data: pet, nama: (k) => B.find((r) => r.kode === k)?.provinsi ?? k, label: t("kw2.peta.label"), legenda: [0, 1, 2, 3, 4].map((i) => ({ kelas: "inf-k" + i, teks: i === 0 ? "1" : i === 4 ? num(mx) : "" })).concat([{ kelas: "inf-kx", teks: t("kw2.peta.kosong") }]) }).then((h) => { $("peta-isi").innerHTML = h; });
}

function blok(judul, isi) { return `<div class="kw-blok${isi ? "" : " kw-blok-kosong"}"><h3>${esc(judul)}</h3><p>${isi ? esc(isi) : esc(t("kw2.belum_ada"))}</p></div>`; }
function profil(r) {
  document.title = t("kw2.judul_profil", { n: r.nama });
  for (const i of ["ey", "judul", "jawab"]) $(i).removeAttribute("data-i18n");
  $("ey").textContent = t("kw2.jenis." + r.jenis); $("judul").textContent = r.nama;
  $("jawab").textContent = r.diriset ? t("kw2.profil.lead", { p: r.provinsi }) : t("kw2.profil.lead_kosong", { p: r.provinsi });
  const s = r.kode ? sistemDari(r.kode) : null;
  khUbin("ubin", [
    { ikon: "petir", nilai: dayaNilai(r) == null ? "-" : num(dayaNilai(r)), satuan: r.kebutuhan_mva != null ? "MVA" : dayaNilai(r) != null ? "MW" : "", label: t("kw2.ubin.daya") },
    { ikon: "tek-bio", nilai: r.ebt_operasi_mw == null ? "-" : num(r.ebt_operasi_mw, 1), satuan: r.ebt_operasi_mw == null ? "" : "MW", label: t("kw2.ubin.ebt") },
    { ikon: "kawasan", nilai: r.luas_ha ? num(r.luas_ha) : "-", satuan: r.luas_ha ? "ha" : "", label: t("kw2.ubin.luas") },
  ]);
  const fakta = [
    [t("kw2.kol.pengelola"), org(r)], [t("kw2.kol.prov"), `<span class="inf-nama">${lamb(r.kode, 18)}${r.kode ? `<a href="/wilayah/${esc(r.kode)}">${esc(r.provinsi)}</a>` : esc(r.provinsi)}</span>`],
    [t("kw2.fakta.sektor"), esc(r.sektor || t("kw2.tak_tercatat"))], [t("kw2.fakta.status"), esc(r.status_ops ? L(r.status_ops, bahasa()) : r.status || t("kw2.tak_tercatat"))],
    [t("kw2.fakta.tenant"), r.tenant_jumlah != null ? num(r.tenant_jumlah) : esc(t("kw2.tak_tercatat"))],
    [t("kw2.fakta.sistem"), s ? `<a href="/sistem/${esc(s.id)}">${esc(namaSis(s))}</a>` : "-"],
    [t("kw2.fakta.koordinat"), r.lat != null ? tautan(`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=13/${r.lat}/${r.lng}`, `${num(r.lat, 3)}, ${num(r.lng, 3)}`) : "-"],
  ].map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("");
  const kegiatan = r.kegiatan.length ? `<div class="kw-pil">${r.kegiatan.map((x) => `<span class="jm-pil">${esc(x)}</span>`).join("")}</div>` : "";
  const cap = r.captive;
  const tabCap = cap?.pembangkit.length ? `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr><th>${esc(t("sp2.kol.pembangkit"))}</th><th>${esc(t("kw2.cap.bb"))}</th><th class="jm-num">${esc(t("kw2.cap.ops"))} (MW)</th><th class="jm-num">${esc(t("kw2.cap.kons"))} (MW)</th></tr></thead><tbody>${cap.pembangkit.map((p) => `<tr><td data-label="${esc(t("sp2.kol.pembangkit"))}">${tautan(p.url, p.nama)}</td><td data-label="${esc(t("kw2.cap.bb"))}">${esc(p.bahan_bakar || "-")}</td><td class="jm-num" data-label="${esc(t("kw2.cap.ops"))}">${num(p.mw_operasi)}</td><td class="jm-num" data-label="${esc(t("kw2.cap.kons"))}">${num(p.mw_konstruksi)}</td></tr>`).join("")}</tbody></table></div>` : "";
  const dekat = r.proyek_dekat.length ? `<ul class="kw-daftar">${r.proyek_dekat.map((x) => `<li>${ikon("petir", 16)}<span>${/^pj_/.test(x.id) ? `<a href="/p/${esc(x.id)}">${esc(x.nama)}</a>` : esc(x.nama)} <small>${esc(t("an.tek." + x.tek))}, ${num(x.mw, 1)} MW, ${num(x.km, 1)} km</small></span></li>`).join("")}</ul>` : "";
  const gardu = r.gardu ? `<p class="jm-bantu">${esc(t("kw2.gardu", { g: r.gardu.gardu ?? "-", kv: r.gardu.gardu_kv ?? "-", km: num(r.gardu.gardu_km, 1) }))}</p>` : "";
  $("isi").innerHTML = ["fakta", "listrik", "tenant", "captive", "permintaan", "sekitar", "celah"].map((i) => `<div id="k-${i}"></div>`).join("");
  $("k-fakta").innerHTML = seksi({ id: "fakta", ik: "kawasan", topik: t("kw2.fakta.topik"), judul: t("kw2.fakta.judul", { n: r.nama }), sub: t("kw2.fakta.sub"), turunan: false, isi: `<p class="sp-bc"><a href="/kawasan">${esc(t("kw2.semua"))}</a></p><dl class="kw-fakta">${fakta}</dl>${kegiatan}` });
  $("k-listrik").innerHTML = seksi({ id: "listrik", ik: "petir", topik: t("kw2.listrik.topik"), judul: t("kw2.listrik.judul"), sub: t("kw2.listrik.sub"), turunan: false,
    isi: `<div class="sp-grid2">${blok(t("kw2.listrik.kini"), r.listrik_kini && L(r.listrik_kini, bahasa()))}${blok(t("kw2.listrik.rencana"), r.rencana_ebt && L(r.rencana_ebt, bahasa()))}${blok(t("kw2.listrik.kebutuhan"), r.kebutuhan_ket && L(r.kebutuhan_ket, bahasa()))}</div>${r.diriset ? "" : catatan(t("kw2.catatan_belum"))}` });
  $("k-tenant").innerHTML = seksi({ id: "tenant", ik: "orang", topik: t("kw2.tenant.topik"), judul: t("kw2.tenant.judul", { n: num(r.tenant.length) }), sub: t("kw2.tenant.sub"), turunan: false, isi: r.tenant.length ? `<ul class="kw-daftar">${r.tenant.map((x) => `<li>${ikon("gedung", 16)}<span>${esc(x)}</span></li>`).join("")}</ul>` : `<p class="jm-bantu">${esc(t("kw2.belum_ada"))}</p>` });
  $("k-captive").innerHTML = cap ? seksi({ id: "captive", ik: "petir", topik: t("kw2.cap.topik"), judul: t("kw2.capp.judul", { ops: num(cap.mw_operasi), kons: num(cap.mw_konstruksi) }), sub: t("kw2.capp.sub"), turunan: false, isi: `${tabCap}${catatan(t("kw2.capp.catatan", { p: cap.pct_batubara == null ? "-" : num(cap.pct_batubara, 0) }))}` }) : "";
  $("k-permintaan").innerHTML = r.permintaan_baru.length ? seksi({ id: "permintaan", ik: "petir", topik: t("kw2.pb.topik"), judul: t("kw2.pb.judul", { n: num(r.permintaan_baru.length) }), sub: t("kw2.pb.sub"), turunan: false,
    isi: `<ul class="kw-daftar">${r.permintaan_baru.map((x) => `<li>${ikon("petir", 16)}<span>${esc(x.nama)} <small>${x.ragu ? esc(t("kw2.pb.ragu")) : esc(t("kw2.pb.mva", { v: num(x.mva_akhir) }))}, ${esc(x.halaman)}</small></span></li>`).join("")}</ul>${catatan(t("kw2.pb.catatan"))}` }) : "";
  $("k-sekitar").innerHTML = dekat || gardu ? seksi({ id: "sekitar", ik: "denah", topik: t("kw2.sekitar.topik"), judul: t("kw2.sekitar.judul"), sub: t("kw2.sekitar.sub"), turunan: false, isi: `${gardu}${dekat}` }) : "";
  $("k-celah").innerHTML = seksi({ id: "metode", ik: "metode", topik: t("kw2.metode.topik"), judul: t("kw2.sumber.judul"), sub: t("kw2.metode.sub"), turunan: false, isi: `${sumberKartu(sumberDaftar(r), d.dibangun_pada)}${catatan(t("kw2.metode.tanggal", { tanggal: d.dibangun_pada }))}` });
}

async function gambar() {
  const m = location.pathname.match(/^\/kawasan\/([a-z0-9_.-]+)$/);
  if (m) { const r = d.baris.find((x) => x.id === m[1]); if (r) return profil(r); }
  document.title = t("kw2.judul_halaman");
  indeks();
}
(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { [d, sis] = await Promise.all([muatData("kawasan_industri.json"), muatData("sistem_pln.json")]); } catch { tampilGalat($("isi"), () => location.reload()); return; }
  await gambar();
  saatBahasa(() => gambar());
})();
