/* /baterai-ev: bagian khas per tahap: mineral impor (tambang), captive power (olah), TKDN dan jejak karbon sel (sel), penjualan (kendaraan), SPKLU (pengisian).
   Hanya membaca berkas yang sudah ada + baterai_ev.json; angka turunan diberi label EST. */
import { D, X, L, t, esc, ikon, num, bukti, luar, bendera, namaNegara, chip, ex, catatan, buktiBe, tautSumber, sumberHtmlBe, logoHtml, namaOrg, lbl, sumberBerkas, juta } from "/be_umum.js";
import { seriHS } from "/be_bagian.js";
import { kolomSvg, batangSvg, legendaHtml, tipHtml, tabel, pilUbah } from "/info_hijau.js";

/* ---------- tambang: mineral baterai yang diimpor ---------- */
export function bagianImporKritis() {
  const K = [["260200", "mangan"], ["810520", "kobalt"], ["283691", "litium"], ["282520", "litium"]];
  const kartu = K.map(([hs, ik]) => {
    const S = seriHS(hs).impor, ths = Object.keys(S).map(Number).sort(), th = ths.at(-1); if (!th) return "";
    const v = S[th], p = S[th - 1], top = (v.mitra || [])[0];
    return `<div class="rg3-kartu bev-ubin"><span class="jm-kh-lbl">${esc(t("bev.hs." + hs))}</span><p class="bev-angka"><b>${esc(juta(v.usd, v.usd < 1e7 ? 2 : 1))}</b><span>${esc(t("bev.ex.u"))}</span></p>${p ? `<span class="rg3-ab">${pilUbah(((v.usd - p.usd) / Math.max(1, p.usd)) * 100)}<small class="rg3-catat">${esc(t("bev.tahun", { th }))}</small></span>` : ""}${top ? `<span class="rg3-neg">${bendera(top.iso, 18)}<small>${esc(t("bev.im.top", { n: namaNegara(top.iso) }))}</small></span>` : ""}${bukti("resmi", { sumber: "UN Comtrade", tanggal: X.be?.dibangun_pada })}</div>`;
  }).filter(Boolean);
  if (!kartu.length) return "";
  return ex({ id: "bev-tambang-impor", ikon: "kapal", topik: t("bev.ey.impor"), judulHtml: esc(t("bev.j.impor")), subHtml: esc(t("bev.s.impor")), isiHtml: `<div class="rg3-kisi">${kartu.join("")}</div>${catatan("bev.n.impor")}` });
}

/* ---------- olah: PLTU captive di kawasan nikel ---------- */
export function bagianCaptive() {
  const C = X.captive; if (!C?.kawasan?.length) return "";
  const kaw = [...C.kawasan].sort((a, b) => b.mw_operasi - a.mw_operasi);
  const m = C.meta || {};
  return ex({ id: "bev-olah-captive", ikon: "petir", topik: t("bev.ey.captive"), judulHtml: esc(t("bev.j.captive", { mw: num(m.mw_operasi_nikel || 0), p: num(m.pct_batubara || 0, 1) })), subHtml: esc(t("bev.s.captive")),
    isiHtml: `<div id="bev-olah-cpl">${legendaHtml([{ kelas: "rg3-s-h-tinggi", label: t("bev.cp.op") }, { kelas: "rg3-s-h-sedang", label: t("bev.cp.kon") }, { kelas: "rg3-s-banding", label: t("bev.cp.ren") }])}</div><div id="bev-olah-cp" class="ih-bagan"></div><p class="rg3-info rg3-info-ok">${ikon("info", 18)}<span>${esc(t("bev.cp.n"))} ${bukti("media", { sumber: "GEM", tanggal: C.dibangun_pada })} <a class="rg3-tautan" href="/industri">${esc(t("bev.cp.lihat"))}</a></span></p>`, kakiHtml: sumberBerkas(C) });
}
export function gambarCaptive(el) {
  const w = el.querySelector("#bev-olah-cp"); if (!w) return;
  const kaw = [...X.captive.kawasan].sort((a, b) => b.mw_operasi - a.mw_operasi);
  w.innerHTML = batangSvg({ el: w, d: 0, label: t("bev.cp.label"), satuan: "MW", seri: [{ k: "op", kelas: "rg3-s-h-tinggi" }, { k: "kon", kelas: "rg3-s-h-sedang" }, { k: "ren", kelas: "rg3-s-banding" }],
    baris: kaw.map((k) => ({ label: k.nama, ikon: "pabrik", tip: `${k.nama}: ${k.mw_operasi}`, th: tipHtml(k.nama, [[t("bev.cp.op"), `${num(k.mw_operasi)} MW`], [t("bev.cp.kon"), `${num(k.mw_konstruksi || 0)} MW`], [t("bev.cp.ren"), `${num(k.mw_rencana || 0)} MW`], [t("bev.cp.emisi"), `${num((k.emisi_tco2e || 0) / 1e6, 1)} Mt CO2e`], [t("bev.cp.batubara"), `${num(k.pct_batubara ?? 0, 0)}%`]]), bagian: [{ k: "op", nilai: k.mw_operasi }, { k: "kon", nilai: k.mw_konstruksi || 0 }, { k: "ren", nilai: k.mw_rencana || 0 }] })) });
}

/* ---------- sel dan bess: TKDN paket baterai, jejak karbon ---------- */
const POLA = { sel: /lithium|lifepo|li-ion|battery pack|baterai lithium|lithium-ion/i, bess: /bess|energy storage|energi storage|storage system/i };
const barisTkdn = (jenis) => (X.tkdn?.baris || []).filter((b) => b.kategori === "baterai" && POLA[jenis].test(b.produk) && b.aktif !== false);
export function bagianTkdn(id) {
  const R = barisTkdn(id); if (!R.length) return "";
  const pabr = new Set(R.map((r) => r.pabrikan)).size, maks = Math.max(...R.map((r) => r.tkdn_persen));
  return ex({ id: `bev-${id}-tkdn`, ikon: "pabrik", topik: t("bev.ey.tkdn"), judulHtml: esc(t("bev.j.tkdn", { n: num(R.length), m: num(pabr) })), subHtml: esc(t("bev.s.tkdn", { mx: num(maks, 1) })),
    isiHtml: `<div id="bev-${id}-tkdnt"></div>${catatan("bev.n.tkdn")}`, kakiHtml: sumberBerkas(X.tkdn) });
}
export function gambarTkdn(id, el) {
  const w = el.querySelector(`#bev-${id}-tkdnt`); if (!w) return;
  tabel(w, { satuan: "bev.u.produk", per: 8, urutAwal: 3, menurun: true, baris: barisTkdn(id), kolom: [
    { label: t("bev.c.pabrikan"), v: (r) => r.pabrikan, f: (r) => `<span class="rg3-org">${logoHtml(r.pabrikan_org_id, r.pabrikan, "")}<b>${namaOrg(r.pabrikan_org_id, r.pabrikan)}</b></span>` },
    { label: t("bev.c.produk"), v: (r) => r.produk, f: (r) => `<span class="rg3-idk"><b>${esc(r.produk)}</b><small>${esc(r.merk || "")}</small></span>` },
    { label: t("bev.c.provinsi"), v: (r) => r.provinsi || "", f: (r) => esc(r.provinsi || "-") },
    { label: t("bev.c.tkdn"), num: true, v: (r) => r.tkdn_persen, f: (r) => `<b>${esc(num(r.tkdn_persen, 1))}%</b>` },
    { label: t("bev.c.berlaku"), v: (r) => r.berlaku_sampai || "", f: (r) => esc(r.berlaku_sampai || "-") },
    { label: t("bev.c.bukti"), v: (r) => r.tingkat_bukti || "", f: (r) => bukti(r.tingkat_bukti, { sumber: X.tkdn?.sumber?.[0]?.penerbit || "", tanggal: r.tanggal }) },
  ] });
}
export function bagianJejak() {
  const J = D.esg?.jejak_baterai || []; if (!J.length) return "";
  return ex({ id: "bev-sel-jejak", ikon: "karbon", topik: t("bev.ey.jejak"), judulHtml: esc(t("bev.j.jejak")), subHtml: esc(t("bev.s.jejak")), isiHtml: `<div id="bev-sel-jj" class="ih-bagan"></div>${catatan("bev.n.jejak")}`, kakiHtml: sumberBerkas(D.esg) });
}
export function gambarJejak(el) {
  const w = el.querySelector("#bev-sel-jj"); if (!w) return;
  const J = D.esg.jejak_baterai.map((j) => ({ ...j, v: j.nilai ?? (j.rentang ? (j.rentang.min + j.rentang.max) / 2 : 0) }));
  w.innerHTML = batangSvg({ el: w, d: 0, label: t("bev.j.jejak"), satuan: "kg CO2e/kWh", seri: [{ k: "v", kelas: "rg3-s-h-sedang" }],
    baris: J.map((j) => ({ label: `${j.wilayah} (${j.kimia})`, bendera: j.negara_iso2 ? j.negara_iso2.toLowerCase() : "", ikon: j.negara_iso2 ? "" : "globe", tip: `${j.wilayah}: ${j.v}`, th: tipHtml(j.wilayah, [[t("bev.jj.kimia"), j.kimia], [t("bev.jj.nilai"), j.rentang ? `${j.rentang.min} - ${j.rentang.max}` : String(j.nilai)]]), bagian: [{ k: "v", nilai: j.v }] })) });
}

/* ---------- kendaraan: penjualan ---------- */
export function bagianPenjualan() {
  const P = X.be?.penjualan; if (!P) return "";
  const motor = P.motor, bev25 = P.bev.at(-1), pangsa = P.pangsa_bev.at(-1), tot = P.total_motor?.[0];
  const ubin = [
    { l: t("bev.pj.bev", { th: bev25.tahun }), v: num(bev25.unit), s: t("bev.pj.unit"), b: buktiBe(bev25) },
    { l: t("bev.pj.pangsa", { th: pangsa.tahun }), v: num(pangsa.persen, 1) + "%", s: "", b: buktiBe(pangsa) },
    { l: t("bev.pj.byd"), v: num(P.merek_bev[0].pangsa) + "%", s: P.merek_bev[0].periode, b: buktiBe(P.merek_bev[0]) },
    { l: t("bev.pj.motor", { th: motor.at(-1).tahun }), v: num(motor.at(-1).unit), s: t("bev.pj.unit"), b: buktiBe(motor.at(-1)) },
  ];
  return ex({ id: "bev-kendaraan-jual", ikon: "grafik", topik: t("bev.ey.jual"), judulHtml: esc(t("bev.j.jual", { th: bev25.tahun, n: num(bev25.unit) })), subHtml: esc(t("bev.s.jual")),
    isiHtml: `<div class="rg3-kisi">${ubin.map((u) => `<div class="rg3-kartu bev-ubin"><span class="jm-kh-lbl">${esc(u.l)}</span><p class="bev-angka"><b>${esc(u.v)}</b><span>${esc(u.s)}</span></p><span class="rg3-ab">${u.b}</span></div>`).join("")}</div>
<h3 class="rg3-sub">${esc(t("bev.pj.mobil"))}</h3>${legendaHtml([{ kelas: "rg3-s-dunia", label: t("bev.pj.s.bev") }, { kelas: "rg3-s-banding", label: t("bev.pj.s.lain") }])}<div id="bev-kendaraan-jg" class="ih-bagan"></div>
<h3 class="rg3-sub">${esc(t("bev.pj.motor_j"))}</h3><div id="bev-kendaraan-jm" class="ih-bagan"></div>${catatan("bev.n.jual", { n: num(tot?.unit || 0) })}`, kakiHtml: `<span class="bev-sumber">${sumberHtmlBe([...P.bev, ...P.motor, ...P.elektrifikasi].map((r) => r.sumber_id))}</span>` });
}
export function gambarPenjualan(el) {
  const P = X.be?.penjualan, a = el.querySelector("#bev-kendaraan-jg"), b = el.querySelector("#bev-kendaraan-jm"); if (!P || !a) return;
  const lain = new Map(P.elektrifikasi.map((e) => [e.tahun, e.unit]));
  a.innerHTML = kolomSvg({ el: a, satuan: t("bev.pj.unit"), label: t("bev.pj.mobil"), seri: [{ k: "bev", kelas: "rg3-s-dunia", label: t("bev.pj.s.bev") }, { k: "lain", kelas: "rg3-s-banding", label: t("bev.pj.s.lain") }],
    kategori: P.bev.map((r, i) => { const l = lain.has(r.tahun) ? lain.get(r.tahun) - r.unit : 0, prev = P.bev[i - 1]; return { label: String(r.tahun), nilai: { bev: r.unit, lain: l }, tip: `${r.tahun}: ${num(r.unit)}`, th: tipHtml(String(r.tahun), [[t("bev.pj.s.bev"), num(r.unit)], ...(l ? [[t("bev.pj.s.lain"), num(l)]] : []), ...(prev ? [[t("bev.pj.tumbuh"), `${num(((r.unit - prev.unit) / prev.unit) * 100, 0)}%`]] : [])]) }; }) });
  b.innerHTML = kolomSvg({ el: b, satuan: t("bev.pj.unit"), label: t("bev.pj.motor_j"), seri: [{ k: "m", kelas: "rg3-s-id", label: t("bev.pj.motor_j") }],
    kategori: P.motor.map((r) => ({ label: String(r.tahun), nilai: { m: r.unit }, tip: `${r.tahun}: ${num(r.unit)}`, th: tipHtml(String(r.tahun), [[t("bev.pj.motor_j"), num(r.unit)]]) })) });
}

/* ---------- pengisian: SPKLU ---------- */
const prov = (kode) => (X.akses?.provinsi || []).find((p) => p.kode === kode);
export function bagianSpklu() {
  const A = X.akses; if (!A?.spklu) return "";
  const P = X.be?.pengisian || {}, pop4 = 223000, titik = P.spklu_titik?.at(-1);
  const rasio = titik ? Math.round(pop4 / titik.jumlah) : null;
  const ubin = [
    titik && { l: t("bev.sp.titik"), v: num(titik.jumlah), s: titik.periode, b: buktiBe(titik) },
    { l: t("bev.sp.spbklu"), v: num(P.spbklu[0].jumlah), s: t("bev.sp.spbklu_s", { b: num(P.spbklu[1].jumlah) }), b: buktiBe(P.spbklu[0]) },
    ...P.spklu_target.map((x) => ({ l: t("bev.sp.target", { th: x.tahun }), v: num(x.jumlah), s: titik ? t("bev.sp.kali", { k: num(x.jumlah / titik.jumlah, 0) }) : "", b: buktiBe(x) })),
    rasio && { l: t("bev.sp.rasio"), v: num(rasio), s: t("bev.sp.rasio_s"), b: bukti("est", { cara: t("bev.sp.rasio_cara", { p: num(pop4), s: num(titik.jumlah) }) }) },
  ].filter(Boolean);
  const std = P.konektor.map((k) => chip("rg3-w" + (k.arus === "AC" ? 4 : k.k === "ccs2" ? 3 : 1), ikon(k.arus === "AC" ? "petir" : "tek-listrik", 14), L(k.label))).join("");
  return [
    ex({ id: "bev-pengisian-ubin", ikon: "lokasi", topik: t("bev.ey.spklu"), judulHtml: esc(t("bev.j.spklu", { n: num(titik?.jumlah || 0) })), subHtml: esc(t("bev.s.spklu")),
      isiHtml: `<div class="rg3-kisi">${ubin.map((u) => `<div class="rg3-kartu bev-ubin"><span class="jm-kh-lbl">${esc(u.l)}</span><p class="bev-angka"><b>${esc(u.v)}</b><span>${esc(u.s)}</span></p><span class="rg3-ab">${u.b}</span></div>`).join("")}</div><p class="jm-bantu ih-catatan">${esc(L(P.spbklu_catatan))}</p>` }),
    ex({ id: "bev-pengisian-prov", ikon: "wilayah", topik: t("bev.ey.sprov"), judulHtml: esc(t("bev.j.sprov")), subHtml: esc(t("bev.s.sprov", { th: A.spklu.provinsi.periode })), isiHtml: `<div id="bev-pengisian-pv" class="ih-bagan"></div><h3 class="rg3-sub">${esc(t("bev.sp.pulau"))}</h3><div id="bev-pengisian-pl" class="ih-bagan"></div>${catatan("bev.n.sprov")}<p class="jm-bantu ih-catatan">${esc(L(A.spklu.tidak_terbaca))}</p>`, kakiHtml: sumberBerkas({ sumber: Object.entries(A.sumber || {}).filter(([k]) => k.startsWith("spklu")).map(([k, v]) => ({ ...v, id: k, penerbit: v.penerbit, judul: v.judul, url: v.url })) }) }),
    ex({ id: "bev-pengisian-std", ikon: "tek-listrik", topik: t("bev.ey.std"), judulHtml: esc(t("bev.j.std")), subHtml: esc(t("bev.s.std")), isiHtml: `<div class="rg3-chips">${std}</div>${catatan("bev.n.std")}<span class="rg3-ab">${tautSumber("s-konektor")}</span>` }),
  ].join("");
}
export function gambarSpklu(el) {
  const A = X.akses, pv = el.querySelector("#bev-pengisian-pv"), pl = el.querySelector("#bev-pengisian-pl"); if (!pv) return;
  const baris = A.spklu.provinsi.baris.map((r) => ({ ...r, nama: prov(r.kode)?.nama || r.kode }));
  pv.innerHTML = batangSvg({ el: pv, d: 0, label: t("bev.j.sprov"), satuan: t("bev.sp.unit"), seri: [{ k: "u", kelas: "rg3-s-dunia" }],
    baris: baris.map((r) => ({ label: r.nama, logo: `/img/provinsi/${r.kode}.png`, tip: `${r.nama}: ${r.unit}`, th: tipHtml(r.nama, [[t("bev.sp.unit"), num(r.unit)]], { img: `/img/provinsi/${r.kode}.png` }), bagian: [{ k: "u", nilai: r.unit }] })) });
  const pu = A.spklu.pulau.baris;
  pl.innerHTML = batangSvg({ el: pl, d: 0, label: t("bev.sp.pulau"), satuan: t("bev.sp.unit"), seri: [{ k: "u", kelas: "rg3-s-id" }],
    baris: pu.map((r) => ({ label: L(r.ket), ikon: "peta", tip: `${L(r.ket)}: ${r.unit}`, th: tipHtml(L(r.ket), [[t("bev.sp.unit"), num(r.unit)], [t("bev.sp.lokasi"), num(r.lokasi)]]), bagian: [{ k: "u", nilai: r.unit }] })) });
}
