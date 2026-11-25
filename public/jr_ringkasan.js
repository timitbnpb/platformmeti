/* /jaringan?tab=ringkasan: tujuh bab bernomor dari ringkas.json (bab[] sudah dihitung pipa). Kontrak: KEMBARAN-JARINGAN.md §6 butir 3.
   Muatan tab HANYA ringkas.json: nama jalur dari bab[].teratas[].nama, komposisi kV dari sistem[].km_kv. */
import { t, esc, num, L, kosongTab } from "/jr_umum.js";
import { tanggal } from "/i18n.js";
import { muatKJ, chipSt, chipSrc, kakiFakta } from "/jr_kj.js";

const n1 = (v) => (v == null ? "-" : num(v, Number.isInteger(v) ? 0 : 1));
const tg = (s) => (s ? tanggal(s) : "");
const kaki = (st, src, tgl) => kakiFakta(st, src, tg(tgl));
const fokus = (id) => `?tab=peta&fokus=${encodeURIComponent(id)}`;
const KELAS = ["500", "230-275", "115-150", "66-70", "tak"];
const KV_KELAS = { 500: "500", 275: "230-275", 230: "230-275", 150: "115-150", 70: "66-70", null: "tak" };
const srcId = (s) => (s && typeof s === "object" ? s.id : s);

const ubin = (u, b) => {
  const kosong = u.v == null, st = kosong ? "menunggu" : u.st, luar = !kosong && u.src && !b.src.includes(u.src);
  return `<div class="kj-ang"><b>${esc(n1(u.v))}${!kosong && u.sat ? ` <small>${esc(t("kj.rk.sat." + u.sat))}</small>` : ""}</b><span>${esc(t("kj.rk.u." + u.k))}</span>${st !== b.st ? chipSt(st) : ""}${luar ? chipSrc(u.src) + (u.tgl ? `<span class="kj-tgl">${esc(t("kj.per", { tgl: tg(u.tgl) }))}</span>` : "") : ""}</div>`;
};
const ubinan = (b) => (b.ubin.length ? `<div class="kj-rk-ub">${b.ubin.map((u) => ubin(u, b)).join("")}</div>` : "");
const lainnya = (n) => (n > 0 ? `<p class="kj-cat">${esc(t("kj.rk.lainnya", { n: num(n) }))}</p>` : "");

const nomor = (i, isi) => `<li class="kj-rk-li"><b class="kj-ln">${i + 1}</b>${isi}</li>`;

/** Batang komposisi kV dari sistem[].km_kv; lebar dan tinggi lewat skala() (CSP tanpa style=). */
function barKv(s) {
  const m = {};
  for (const [kv, km] of Object.entries(s.km_kv || {})) { const k = KV_KELAS[kv]; if (k && km > 0) m[k] = (m[k] || 0) + km; }
  const tot = KELAS.reduce((a, k) => a + (m[k] || 0), 0);
  if (!tot) return "";
  const isi = KELAS.filter((k) => m[k] > 0).map((k) => t("kj.rk.kv.tip", { kelas: t("kj.rk.kv." + k), km: n1(Math.round(m[k] * 10) / 10) }));
  return `<span class="kj-kvb" role="img" aria-label="${esc(t("kj.rk.kv.bar", { isi: isi.join("; ") }))}">${KELAS.filter((k) => m[k] > 0).map((k, i) => `<i class="kj-k-${k}" data-w="${(m[k] / tot) * 100}" title="${esc(isi[i])}"></i>`).join("")}</span>`;
}
function isiSistem(b) {
  return `<ol class="kj-rk-ol">${b.teratas.map((s, i) => nomor(i, `<a class="kj-rk-nm" href="${fokus(s.id)}">${esc(s.nama)}</a>
    <span class="kj-rk-md">${esc(t("kj.rk.sis.baris", { km: n1(s.km), gi: n1(s.gi), mw: n1(s.mw_pln) }))}${s.mva ? esc(", " + t("kj.rk.sis.mva", { mva: n1(s.mva) })) : ""}</span>
    ${barKv(s)}`)).join("")}</ol>${lainnya(b.lainnya)}`;
}
function isiTunggal(b, R) {
  const mx = Math.max(1, ...b.teratas.map((x) => x.gi || 0)), sis = new Map(R.sistem.map((s) => [s.id, s.nama]));
  return `<ol class="kj-rk-ol">${b.teratas.slice(0, 8).map((x, i) => nomor(i, `<a class="kj-rk-nm" href="${fokus(x.id)}">${esc(x.nama || (x.kv ? t("kj.rk.jl_n", { kv: num(x.kv) }) : t("kj.rk.jl_tak")))}</a>
    <span class="kj-rk-md">${esc(sis.get(x.sis) || "-")}, ${esc(t("kj.rk.b.tunggal.gi", { n: n1(x.gi) }))}</span>
    <span class="kj-rk-bar"><i data-w="${Math.round(((x.gi || 0) / mx) * 100)}"></i></span>`)).join("")}</ol>${lainnya(b.lainnya)}`;
}
function isiBertambah(b) {
  const bt = b.bertambah || {};
  const prov = (bt.per_prov || []).map((p) => `<tr><th scope="row">${esc(p.nama)}</th><td class="kj-rk-n">${esc(n1(p.km_osm))}</td><td class="kj-rk-n">${esc(n1(p.km_baru))}</td></tr>`).join("");
  const cat = bt.tersedia === false
    ? `<p class="kj-cat">${esc(t("kj.rk.b.bertambah.cakupan", { cakupan: (bt.cakupan || []).join(", ") }))}</p><p class="kj-kaki">${chipSt(bt.st)}${[].concat(bt.src || []).map(chipSrc).join("")}</p>`
    : `<div class="kj-rk-peringatan" role="note"><b>${esc(t("kj.rk.b.bertambah.bukan"))}</b><p>${esc(bt.catatan || "")}</p></div>
      <h3 class="kj-rk-h3">${esc(t("kj.rk.b.bertambah.cak_j"))}</h3>
      <p class="kj-cat">${esc(t("kj.rk.b.bertambah.cak", { dengan: (bt.cakupan_garis || []).join(", ") || "-" }))}${bt.tanpa_garis?.length ? ` ${esc(t("kj.rk.b.bertambah.tanpa", { tanpa: bt.tanpa_garis.join(", ") }))}` : ""}</p>
      ${prov ? `<div class="kj-tabel kj-rk-tb" tabindex="0" role="region" aria-label="${esc(t("kj.rk.b.bertambah.cak_j"))}"><table><thead><tr><th scope="col">${esc(t("kj.rk.b.bertambah.c.prov"))}</th><th scope="col" class="kj-rk-n">${esc(t("kj.rk.b.bertambah.c.osm"))}</th><th scope="col" class="kj-rk-n">${esc(t("kj.rk.b.bertambah.c.baru"))}</th></tr></thead><tbody>${prov}</tbody></table></div>` : ""}
      ${kakiFakta(bt.st, bt.src, tg(bt.tgl))}`;
  const ev = b.teratas.length ? `<h3 class="kj-rk-h3">${esc(t("kj.rk.b.bertambah.daftar"))}</h3><ul class="kj-rk-ul">${b.teratas.map((p) => `<li class="kj-rk-ev"><b>${esc(L(p.judul ?? p.nama ?? p.teks))}</b>${p.objek_id ? ` <a class="kj-rk-nm" href="${fokus(p.objek_id)}">${esc(t("kj.rk.peta"))}</a>` : ""}${kakiFakta(p.st || "sumber", srcId(p.src), tg(p.tanggal || p.tgl))}</li>`).join("")}</ul>${lainnya(b.lainnya)}` : `<p class="kj-cat">${esc(t("kj.rk.b.bertambah.kosong"))}</p>`;
  return cat + ev;
}
function isiNeraca(b) {
  const th = ["nama", "prod", "jual", "sel", "pct", "st"].map((k) => `<th scope="col"${k === "nama" || k === "st" ? "" : ` class="kj-rk-n"`}>${esc(t("kj.rk.nc." + k))}</th>`).join("");
  const tr = b.teratas.map((r) => `<tr><th scope="row">${esc(r.nama)}</th><td class="kj-rk-n">${esc(n1(r.produksi_gwh))}</td><td class="kj-rk-n">${esc(n1(r.penjualan_gwh))}</td><td class="kj-rk-n">${esc(n1(r.neraca_gwh))}</td><td class="kj-rk-n">${esc(n1(r.persen))}</td><td>${esc(t("kj.rk.ns." + r.status))}</td></tr>`).join("");
  return `<div class="kj-tabel kj-rk-tb" tabindex="0" role="region" aria-label="${esc(t("kj.rk.b.neraca.t"))}"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>${lainnya(b.lainnya)}<p class="kj-cat">${esc(t("kj.rk.b.neraca.ket"))}</p>`;
}
function isiTak(b) {
  const u = b.umur_gardu, mx = u ? Math.max(1, ...u.per_5_tahun.map((x) => x.n)) : 1;
  const daftar = `<ul class="kj-rk-ul">${b.ubin.map((x) => `<li class="kj-rk-tk"><span>${esc(t("kj.rk.u." + x.k))}</span>${chipSt("menunggu")}</li>`).join("")}</ul>`;
  const hist = u?.per_5_tahun?.length
    ? `<h3 class="kj-rk-h3">${esc(t("kj.rk.umur.j"))}</h3><ol class="kj-hist">${u.per_5_tahun.map((x) => `<li title="${esc(t("kj.rk.umur.bar", { mulai: x.mulai, akhir: x.mulai + 4, n: num(x.n) }))}"><i data-h="${Math.round((x.n / mx) * 100)}"></i><span>${esc(x.mulai)}</span></li>`).join("")}</ol>
       <p class="kj-cat">${esc(t("kj.rk.umur.ket", { n: num(u.n), dari: num(u.dari), median: u.median }))}</p>${kaki(u.st, u.src, u.tgl)}`
    : `<p class="kj-cat">${esc(t("kj.rk.umur.kosong"))}</p>`;
  return daftar + hist;
}
const nilaiPln = (v) => (v && typeof v === "object" ? Object.entries(v).map(([k, x]) => `${n1(x)} ${k.replace("total_", "")}`).join(", ") : n1(v));
const tabelPln = (arr) => `<div class="kj-tabel kj-rk-tb" tabindex="0" role="region" aria-label="${esc(t("kj.rk.cara.pln"))}"><table><thead><tr>${["nama", "nilai", "satuan", "tahun", "sumber"].map((k) => `<th scope="col"${k === "nilai" ? ` class="kj-rk-n"` : ""}>${esc(t("kj.rk.pc." + k))}</th>`).join("")}</tr></thead><tbody>${arr.map((x) => `<tr><th scope="row">${esc(x.nama)}</th><td class="kj-rk-n">${esc(nilaiPln(x.nilai))}</td><td>${esc(typeof x.nilai === "object" ? "" : x.satuan || "")}</td><td>${esc(x.tahun || "-")}</td><td>${chipSrc(srcId(x.src))}</td></tr>`).join("")}</tbody></table></div>`;
function isiCara(b) {
  const pln = b.angka_pln || [], luas = pln.filter((x) => x.cakupan !== "provinsi"), prov = pln.filter((x) => x.cakupan === "provinsi");
  return `<h3 class="kj-rk-h3">${esc(t("kj.rk.cara.sumber"))}</h3><p class="kj-kaki">${b.src.map(chipSrc).join("")}</p>
    <h3 class="kj-rk-h3">${esc(t("kj.rk.cara.pln"))}</h3>${pln.length ? tabelPln(luas) + (prov.length ? `<details class="kj-semua"><summary>${esc(t("kj.rk.pln.provinsi", { n: num(prov.length) }))}</summary>${tabelPln(prov)}</details>` : "") + kakiFakta("sumber", [...new Set(pln.map((x) => srcId(x.src)))], "") : `<p class="kj-cat">${esc(t("kj.rk.cara.pln_kosong"))}</p>`}
    <p class="kj-tautan"><a class="kj-lnk" href="?tab=sumber">${esc(t("kj.rk.cara.lihat"))}</a></p>`;
}
function isiSekilas(b) {
  const p = (b.pembanding || []).filter((x) => x.cakupan === "nasional" && x.satuan === "kms");
  return p.length ? `<div class="kj-rk-ub">${p.map((x) => `<div class="kj-ang"><b>${esc(n1(x.nilai))} <small>${esc(x.satuan)}</small></b><span>${esc(x.nama)}</span>${kakiFakta(x.st || "sumber", srcId(x.src), String(x.tahun || ""))}</div>`).join("")}</div><p class="kj-cat">${esc(t("kj.rk.sekilas.catatan"))}</p>` : "";
}

/** Satu kalimat jawaban per bab, disusun dari templat i18n. */
function jawab(b, R) {
  const A = (k) => R.angka.find((a) => a.k === k)?.v;
  const x = b.teratas[0];
  switch (b.id) {
    case "sekilas": return t("kj.rk.b.sekilas.a", { km: n1(A("panjang_total")), gi: n1(A("gardu")), pb: n1(A("pembangkit")) });
    case "sistem": return x ? t("kj.rk.b.sistem.a", { n: n1(A("sistem")), nama: x.nama, km: n1(x.km) }) : t("kj.rk.b.sistem.kosong");
    case "tunggal": return x ? t("kj.rk.b.tunggal.a", { n: n1(A("jalur_tunggal")), gi: n1(Math.max(...b.teratas.map((y) => y.gi || 0))) }) : t("kj.rk.b.tunggal.kosong");
    case "bertambah": { const n = b.teratas.length + b.lainnya; return n ? t("kj.rk.b.bertambah.a", { n: num(n) }) : t("kj.rk.b.bertambah.kosong"); }
    case "neraca": return x ? t("kj.rk.b.neraca.a", { nama: x.nama, gwh: n1(Math.abs(x.neraca_gwh)), persen: n1(Math.abs(x.persen)), n: num(b.teratas.length + b.lainnya) }) : "";
    case "tak-terlihat": return t("kj.rk.b.tak-terlihat.a", { n: num(b.ubin.length) });
    default: return t("kj.rk.b.cara.a");
  }
}
let E = null; /* energi.json: keandalan; dimuat bersama ringkas.json */

/** Ubin km saluran sedang dibangun per kelas kV (bab 1). */
function blokKonstruksi(R) {
  const k = R.konstruksi; if (!k) return "";
  const m = {};
  for (const x of k.km_per_kv || []) { const c = x.kelas === "tak-tercatat" ? "tak" : KV_KELAS[x.kelas]; if (c && x.km > 0) m[c] = (m[c] || 0) + x.km; }
  const ub = KELAS.filter((c) => m[c] > 0).map((c) => `<div class="kj-ang"><b>${esc(n1(Math.round(m[c] * 10) / 10))} <small>km</small></b><span>${esc(t("kj.rk.kv." + c))}</span></div>`).join("");
  return `<h3 class="kj-rk-h3">${esc(t("kj.rk.kons.j"))}</h3><p class="kj-cat">${esc(t("kj.rk.kons.a", { km: n1(k.km), ruas: num(k.ruas), gardu: num(k.gardu) }))}</p><div class="kj-rk-ub">${ub}</div>${kaki(k.st, k.src, k.tgl)}<p class="kj-cat">${esc(k.catatan || "")}</p>`;
}
/** Proyek pembangkit gas yang sedang dibangun atau pra-konstruksi (bab 4). */
function blokProyek(R) {
  const p = R.pembangkit_proyek; if (!p?.status?.length) return "";
  const grup = p.status.map((s) => `<h4 class="kj-rk-h3">${esc(t("kj.rk.pp.st." + s.status))}: ${esc(t("kj.rk.pp.tot", { n: num(s.n), mw: num(s.mw) }))}</h4><ul class="kj-rk-ul">${s.proyek.map((x) => `<li class="kj-rk-ev"><b>${esc(x.nama)}</b> <span class="kj-rk-md">${esc(t("kj.rk.pp.baris", { jenis: t("kj.ba.bbm." + x.jenis), mw: num(x.mw), tahun: x.tahun ?? t("kj.rk.pp.tak") }))}</span></li>`).join("")}</ul>`).join("");
  return `<h3 class="kj-rk-h3">${esc(t("kj.rk.pp.j"))}</h3>${grup}${kakiFakta(p.st, p.src, tg(p.tgl))}<p class="kj-cat">${esc(p.catatan || "")}</p>`;
}
/** Keandalan: SAIDI/SAIFI nasional per tahun dan lima unit terburuk tahun terakhir (sub-bagian bab 6). */
function blokKeandalan() {
  const kn = E?.keandalan_nasional || [], ku = E?.keandalan || []; if (!kn.length) return "";
  const per = new Map();
  for (const x of kn) { const k = x.pengukur + x.tahun; if (!per.has(k)) per.set(k, { ...x, srcs: [] }); per.get(k).srcs.push(x.src); }
  const rows = [...per.values()].sort((a, b) => b.tahun - a.tahun || a.pengukur.localeCompare(b.pengukur));
  const th = ["tahun", "pengukur", "saidi", "saifi", "sumber"].map((k) => `<th scope="col"${k === "saidi" || k === "saifi" ? ` class="kj-rk-n"` : ""}>${esc(t("kj.rk.ke.c." + k))}</th>`).join("");
  const tr = rows.map((x) => `<tr><th scope="row">${esc(x.tahun)}</th><td>${esc(x.pengukur)}</td><td class="kj-rk-n">${esc(n1(x.saidi))}</td><td class="kj-rk-n">${esc(n1(x.saifi))}</td><td>${[...new Set(x.srcs)].map(chipSrc).join("")}</td></tr>`).join("");
  const th0 = Math.max(...ku.map((x) => x.tahun)), top = ku.filter((x) => x.tahun === th0 && x.tingkat === "provinsi").sort((a, b) => b.saidi - a.saidi).slice(0, 5);
  const ter = top.length ? `<h4 class="kj-rk-h3">${esc(t("kj.rk.ke.terburuk", { tahun: th0 }))}</h4><ol class="kj-rk-ol">${top.map((x, i) => nomor(i, `<b class="kj-rk-nm">${esc(x.unit)}</b><span class="kj-rk-md">${esc(t("kj.rk.ke.baris", { saidi: n1(x.saidi), saifi: n1(x.saifi) }))}</span><span class="kj-kaki">${chipSt(x.st)}${chipSrc(x.src)}</span>`)).join("")}</ol><p class="kj-cat">${esc(t("kj.rk.ke.cat"))}</p>` : "";
  return `<h3 class="kj-rk-h3">${esc(t("kj.rk.ke.j"))}</h3><p class="kj-cat">${esc(t("kj.rk.ke.a"))}</p><div class="kj-tabel kj-rk-tb" tabindex="0" role="region" aria-label="${esc(t("kj.rk.ke.j"))}"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>${ter}`;
}
const ISI = { sekilas: (b, R) => isiSekilas(b) + blokKonstruksi(R), sistem: isiSistem, tunggal: isiTunggal, bertambah: (b, R) => isiBertambah(b) + blokProyek(R), neraca: isiNeraca, "tak-terlihat": (b) => isiTak(b) + blokKeandalan(), cara: isiCara };

function babHtml(b, i, semua, R) {
  const nx = semua[i + 1], tgl = b.id === "neraca" ? b.teratas[0]?.tgl || b.tgl : b.tgl;
  const ub = b.id === "tak-terlihat" ? "" : ubinan(b);
  const next = nx ? `<a class="kj-next" href="#rk-${esc(nx.id)}">${esc(t("kj.rk.next", { bab: t(`kj.rk.b.${nx.id}.t`) }))}</a>` : `<a class="kj-next" href="?tab=sumber">${esc(t("kj.rk.next_sumber"))}</a>`;
  return `<article class="kj-bab" id="rk-${esc(b.id)}" aria-labelledby="rk-h-${esc(b.id)}">
    <header class="kj-bab-h"><span class="kj-bn" role="img" aria-label="${esc(t("kj.rk.bab", { n: b.n }))}">${esc(b.n)}</span><h2 id="rk-h-${esc(b.id)}">${esc(t(`kj.rk.b.${b.id}.t`))}</h2></header>
    <p class="kj-jawab">${esc(jawab(b, R))}</p>${ub}${ISI[b.id]?.(b, R) || ""}${kaki(b.st, b.src, tgl)}${next}</article>`;
}

/** Lebar dan tinggi batang lewat style.setProperty (CSP tanpa style=). */
function skala(panel) {
  for (const el of panel.querySelectorAll("[data-w]")) el.style.width = el.dataset.w + "%";
  for (const el of panel.querySelectorAll("[data-h]")) el.style.height = el.dataset.h + "%";
}

export async function mulai(panel) {
  const [R, En] = await Promise.all([muatKJ("ringkas"), muatKJ("energi")]);
  E = En;
  if (!R?.bab?.length) { panel.innerHTML = kosongTab("kj.rk.kosong"); return; }
  panel.innerHTML = `<div class="kj-rk"><h2 class="kj-rk-judul">${esc(t("kj.rk.judul"))}</h2>
    <nav class="kj-rk-nav" aria-label="${esc(t("kj.rk.nav"))}"><ol>${R.bab.map((b) => `<li><a href="#rk-${esc(b.id)}"><b>${esc(b.n)}</b> ${esc(t(`kj.rk.b.${b.id}.t`))}</a></li>`).join("")}</ol></nav>
    ${R.bab.map((b, i, a) => babHtml(b, i, a, R)).join("")}</div>`;
  skala(panel);
}
