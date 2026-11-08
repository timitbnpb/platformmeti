/* /panduan: panduan praktis langkah demi langkah, templat, mitos-fakta. Data /data/panduan.json (scripts/pipa/panduan_bangun.mjs);
   biaya dibaca dari biaya_bangun.json lewat kunci skala (tidak ada angka biaya baru di sini); durasi izin dari izin_kontrak.json;
   pelajaran gagal dari desa_energi_mandiri.json. Teks /data/teks_panduan.json. Informasi umum, bukan nasihat hukum. */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";
import { esc, ikon, hantuHtml, nanti } from "/inti/umum.js";
import { tanggal } from "/i18n.js";
import { muatData, tampilGalat, ubinHtml, batangHtml, pasangBar, pil } from "/analisis.js";
import { muatTeks, tt, L, num, tautan, seksi, catatan, narasi, sumber, saatBahasa } from "/info_kerangka.js";

const $ = (id) => document.getElementById(id);
const HREF = { regulasi: (x) => `/regulasi?id=${encodeURIComponent(x.id)}`, org: (x) => `/o/${encodeURIComponent(x.id)}`, istilah: (x) => `/panduan#istilah-${encodeURIComponent(x.id)}` };
const IK_TAUT = { regulasi: "regulasi", org: "gedung", istilah: "kamus" };
const VONIS = { salah: ["bad", "silang"], sebagian: ["warn", "info"], kedaluwarsa: ["info", "jam"] };
let d = null, biaya = null, izin = null, desa = null, tren = null, sel = "";

const rp = (juta) => (juta >= 1000 ? `Rp ${num(juta / 1000, 1)} ${tt("satuan.miliar")}` : `Rp ${num(juta, juta < 100 && !Number.isInteger(juta) ? 1 : 0)} ${tt("satuan.juta")}`);
const rentang = (a, b) => (Math.round(a * 10) === Math.round(b * 10) ? rp(a) : `${rp(a)} - ${rp(b)}`);
const buktiPil = (b) => (b === "hipotesis" ? pil("an.hipotesis") : pil("an.est"));
const skalaBy = (id) => biaya.skala.find((x) => x.id === id);

function chip(jenis, x) {
  const logo = x.logo ? `<img class="pd-logo" src="${esc(x.logo)}" alt="" width="18" height="18" loading="lazy" data-galat="hapus">` : "";
  const sts = x.status && x.status !== "berlaku" ? `<small>${esc(tt("status." + x.status))}</small>` : "";
  return `<a class="pd-taut pd-t-${jenis}" href="${esc(HREF[jenis](x))}"${x.judul ? ` title="${esc(x.judul)}"` : ""}>${logo || ikon(IK_TAUT[jenis], 16)}<span>${esc(x.nama)}</span>${sts}</a>`;
}
const kotakChip = (jenis, arr, kunci) => (arr.length ? `<div class="pd-blok"><h4>${ikon(IK_TAUT[jenis], 18)}${esc(tt(kunci))}</h4><div class="pd-tauts">${arr.map((x) => chip(jenis, x)).join("")}</div></div>` : "");

/* ---- biaya kisaran dari kunci skala ---- */
function biayaHtml(g) {
  if (!g.skala) return `<p>${esc(tt("biaya.tidak"))}</p>`;
  const s = skalaBy(g.skala.id), c = s?.capex_rp_juta_kw; if (!c) return `<p>${esc(tt("biaya.tidak"))}</p>`;
  const kw = g.skala.kw, perKw = `${rentang(c.rendah, c.tinggi)} / kW`;
  let isi = g.skala.per_kw ? `<p><b>${esc(perKw)}</b> ${buktiPil(c.tingkat_bukti)}</p>`
    : `<p><b>${esc(rentang(c.rendah * kw, c.tinggi * kw))}</b> ${buktiPil(c.tingkat_bukti)}</p><p class="jm-bantu">${esc(tt("biaya.contoh", { kw: num(kw), per: perKw }))}</p>`;
  const tb = g.skala.tambah;
  if (tb) {
    const c2 = skalaBy(tb.id).capex_rp_juta_kw, bess = skalaBy("bess-global").capex_rp_juta_kwh;
    isi += `<p>${esc(tt("biaya.alt", { kw: num(tb.kw) }))}: <b>${esc(rentang(c2.rendah * tb.kw, c2.tinggi * tb.kw))}</b> + ${esc(tt("biaya.baterai", { kwh: num(tb.bess_kwh) }))} <b>${esc(rentang(bess.rendah * tb.bess_kwh, bess.tinggi * tb.bess_kwh))}</b> ${buktiPil(c2.tingkat_bukti)}</p>`;
  }
  const ox = s.opex;
  if (ox?.persen_capex_per_tahun) isi += `<p class="jm-bantu">${esc(tt("biaya.opex", { a: num(ox.persen_capex_per_tahun.nilai), b: num(ox.ganti_inverter_persen_capex?.nilai ?? 0) }))}</p>`;
  return isi + `<p class="jm-bantu">${esc(tt("biaya.sumber", { id: g.skala.id }))}</p>`;
}
function durasiHtml(g) {
  let x = `<p>${esc(L(g.durasi))}</p>`;
  if (g.id === "izin-ipp") {
    const r = izin.lead_time.ringkas;
    x += r.n ? `<p><b>${esc(tt("durasi.izin", { m: num(r.median), n: r.n, min: num(r.min), maks: num(r.maks) }))}</b></p>` : "";
  }
  return x;
}

/* ---- pelajaran gagal desa (dari desa_energi_mandiri.json) ---- */
function pelajaranDesa() {
  const c = {}; for (const b of desa.baris) for (const p of b.penyebab) c[p] = (c[p] ?? 0) + 1;
  const mati = desa.baris.filter((b) => b.status !== "hidup").length;
  const rows = Object.entries(c).sort((a, z) => z[1] - a[1]).map(([k, n]) => ({ id: k, label: tt("sebab." + k), bagian: [{ nilai: n, kelas: "jm-an-c1" }], teks: num(n) }));
  return `<div class="pd-blok"><h4>${ikon("peringatan", 18)}${esc(tt("desa.judul", { m: mati, n: desa.baris.length }))}</h4><p class="jm-bantu">${esc(tt("desa.sub"))}</p>${batangHtml(rows, { label: tt("desa.judul", { m: mati, n: desa.baris.length }) })}<p class="jm-bantu">${esc(tt("desa.bias"))}</p></div>`;
}

function panel(g) {
  const langkah = g.langkah.map((l, i) => `<li><span class="pd-no">${i + 1}</span><span class="pd-lik">${ikon(l.ikon, 22)}</span><div><h4>${esc(L(l.judul))}${l.durasi ? ` <small>${ikon("jam", 14)}${esc(L(l.durasi))}</small>` : ""}</h4><p>${esc(L(l.isi))}</p></div></li>`).join("");
  const dok = g.dokumen.map((x) => `<li>${ikon("centang", 16)}<span>${esc(L(x))}</span></li>`).join("");
  const hal = g.halaman.map((h) => `<a class="pd-tombol" href="${esc(h.href)}">${ikon(h.ikon, 18)}<span>${esc(L(h.label))}</span></a>`).join("");
  const faq = g.faq.map((f) => `<details><summary>${ikon("tanya", 18)}<span>${esc(L(f.q))}</span></summary><p>${esc(L(f.a))}</p></details>`).join("");
  return `<article class="pd-panel" id="g-${esc(g.id)}" aria-labelledby="gh-${esc(g.id)}">
<header class="pd-ph"><span class="pd-ik">${ikon(g.ikon, 28)}</span><div><p class="pd-aud">${esc(L(g.audiens))}</p><h3 id="gh-${esc(g.id)}">${esc(L(g.judul))}</h3><p>${esc(L(g.ringkas))}</p></div></header>
<div class="pd-fakta"><div class="pd-fk"><h4>${ikon("jam", 18)}${esc(tt("fk.durasi"))}</h4>${durasiHtml(g)}</div><div class="pd-fk"><h4>${ikon("kartu", 18)}${esc(tt("fk.biaya"))}</h4>${biayaHtml(g)}</div></div>
<div class="pd-blok"><h4>${ikon("daftar2", 18)}${esc(tt("blok.langkah", { n: g.langkah.length }))}</h4><ol class="pd-langkah">${langkah}</ol></div>
<div class="pd-blok"><h4>${ikon("pdf", 18)}${esc(tt("blok.dokumen"))}</h4><ul class="pd-dok">${dok}</ul></div>
${kotakChip("regulasi", g.taut.regulasi, "blok.regulasi")}${kotakChip("org", g.taut.org, "blok.org")}${kotakChip("istilah", g.taut.istilah, "blok.istilah")}
${g.id === "desa-komunal" ? pelajaranDesa() : ""}
${hal ? `<div class="pd-blok"><h4>${ikon("tautan", 18)}${esc(tt("blok.halaman"))}</h4><div class="pd-tauts">${hal}</div></div>` : ""}
<div class="pd-blok"><h4>${ikon("tanya", 18)}${esc(tt("blok.faq"))}</h4><div class="pd-faq">${faq}</div></div>
<p class="pd-nafi">${ikon("info", 16)}${esc(L(d.penafian))}</p>
${g.sumber.length ? sumber(g.sumber.map((s) => ({ sumber: s.judul, url: s.url, tanggal: d.dibangun_pada }))) : ""}</article>`;
}

function bagPanduan() {
  const pilih = d.panduan.map((g) => `<button type="button" class="pd-chip" data-g="${esc(g.id)}" aria-pressed="${g.id === sel}">${ikon(g.ikon, 18)}<span>${esc(L(g.audiens))}</span></button>`).join("");
  $("s-pan").innerHTML = seksi({ id: "panduan", ik: "daftar2", topik: tt("pan.topik"), judul: tt("pan.judul", { n: d.jumlah }), turunan: false, sub: tt("pan.sub"),
    isi: `${narasi(tt("pan.narasi"))}<div class="pd-chips" role="group" aria-label="${esc(tt("pan.topik"))}">${pilih}</div><div id="pd-isi"></div>` });
  isiPanel();
}
function isiPanel() { $("pd-isi").innerHTML = panel(d.panduan.find((g) => g.id === sel)); pasangBar($("pd-isi")); }

function bagTemplat() {
  const t = d.templat.map((x) => `<details class="pd-templat" id="t-${esc(x.id)}"><summary>${ikon(x.ikon, 20)}<span><b>${esc(L(x.judul))}</b><small>${esc(L(x.ringkas))}</small></span></summary>
<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th class="jm-num">${esc(tt("tabel.no"))}</th><th>${esc(tt("tabel.butir"))}</th><th>${esc(tt("tabel.isi"))}</th></tr></thead><tbody>${x.butir.map((b, i) => `<tr><td class="jm-num" data-label="${esc(tt("tabel.no"))}">${i + 1}</td><td data-label="${esc(tt("tabel.butir"))}"><b>${esc(L(b[0]))}</b></td><td data-label="${esc(tt("tabel.isi"))}">${esc(L(b[1]))}</td></tr>`).join("")}</tbody></table></div></details>`).join("");
  $("s-tem").innerHTML = seksi({ id: "templat", ik: "pdf", topik: tt("tem.topik"), judul: tt("tem.judul", { n: d.templat.length }), turunan: false, sub: tt("tem.sub"),
    isi: `${narasi(tt("tem.narasi"))}${t}<p class="pd-nafi">${ikon("peringatan", 16)}${esc(tt("tem.penafian"))}</p>` });
}

function dataMitos(m) {
  if (m.data === "biaya") {
    const s = biaya.tren.baru.find((x) => x.id === "surya-asia-lain"), a = s.titik[0], z = s.titik.at(-1);
    return tt("data.biaya", { a: num(a.y), ta: a.x, z: num(z.y), tz: z.x, p: num((1 - z.y / a.y) * 100) });
  }
  if (m.data === "beban") {
    const r = tren.baris.filter((x) => x.teknologi === "panas_bumi" && x.pembangkitan_gwh != null).sort((a, b) => b.tahun - a.tahun)[0];
    return tt("data.beban", { fk: num((r.pembangkitan_gwh / (r.kapasitas_mw * 8.76)) * 100, 0), mw: num(r.kapasitas_mw), gwh: num(r.pembangkitan_gwh), tahun: r.tahun });
  }
  if (m.data === "opex") { const o = skalaBy("plts-atap-rumah").opex; return tt("data.opex", { a: num(o.persen_capex_per_tahun.nilai), b: num(o.ganti_inverter_persen_capex.nilai) }); }
  if (m.data === "desa") { const n = desa.baris.length, k = desa.baris.filter((b) => b.status !== "hidup").length; return tt("data.desa", { k, n }); }
  return "";
}
function bagMitos() {
  const k = d.mitos.map((m) => {
    const [jenis, ik] = VONIS[m.vonis];
    const x = dataMitos(m);
    return `<article class="pd-mitos" id="m-${esc(m.id)}"><header>${ikon(m.ikon, 22)}<h3>${esc(L(m.mitos))}</h3><span class="jm-pil jm-pil-${jenis}">${ikon(ik, 14)}${esc(tt("vonis." + m.vonis))}</span></header>
<p>${esc(L(m.fakta))}</p>${x ? `<p class="pd-data">${ikon("grafik", 16)}${esc(x)} ${pil("an.est")}</p>` : ""}${m.taut_reg ? `<div class="pd-tauts">${chip("regulasi", m.taut_reg)}</div>` : ""}
<ul class="pd-sm">${m.sumber.map((s) => `<li>${tautan(s.url, s.judul)} <span class="jm-bantu">${esc(s.penerbit)}</span></li>`).join("")}</ul></article>`;
  }).join("");
  $("s-mit").innerHTML = seksi({ id: "mitos", ik: "tanya", topik: tt("mit.topik"), judul: tt("mit.judul", { n: d.mitos.length }), turunan: false, sub: tt("mit.sub"), isi: `${narasi(tt("mit.narasi"))}<div class="pd-mgrid">${k}</div>${catatan(tt("mit.catatan"))}` });
}
function bagMetode() {
  $("s-met").innerHTML = seksi({ id: "metode", ik: "metode", topik: tt("met.topik"), judul: tt("met.judul"), turunan: false, sub: tt("met.sub"),
    isi: `${narasi(tt("met.isi"))}<ul class="pd-celah">${d.celah.map((_, j) => `<li>${esc(tt("celah." + j))}</li>`).join("")}</ul>${catatan(tt("met.tanggal", { tanggal: tanggal(d.dibangun_pada) }))}` });
}
function ubin() {
  $("ubin").innerHTML = ubinHtml([
    { ikon: "daftar2", nilai: num(d.jumlah), label: tt("ubin.panduan"), href: "#panduan" },
    { ikon: "pdf", nilai: num(d.templat.length), label: tt("ubin.templat"), href: "#templat" },
    { ikon: "tanya", nilai: num(d.mitos.length), label: tt("ubin.mitos"), href: "#mitos" },
  ]);
}
function gambar() {
  ubin();
  for (const id of ["s-pan", "s-tem", "s-mit", "s-met"]) if (!$(id)) $("isi").insertAdjacentHTML("beforeend", `<div id="${id}"></div>`);
  bagPanduan(); bagTemplat(); bagMitos(); bagMetode();
  document.querySelectorAll("[data-k]").forEach((e) => { e.textContent = tt(e.dataset.k); });
  document.title = tt("judul.halaman");
}
function pasang() {
  $("isi").addEventListener("click", (e) => {
    const b = e.target.closest(".pd-chip"); if (!b || b.dataset.g === sel) return;
    sel = b.dataset.g; b.parentElement.querySelectorAll(".pd-chip").forEach((x) => x.setAttribute("aria-pressed", x.dataset.g === sel));
    history.replaceState(null, "", "#g-" + sel);
    nanti(isiPanel);
  });
}
(async () => {
  await mulaiHalaman();
  /* Belajar: Panduan (halaman ini), Akademi (akademi.js) dan Istilah (istilah.js), dua terakhir dimuat malas; jangkar istilah #istilah-<id> */
  tabHalaman("tabHal", { label: "bel.tab", tab: [
    { k: "panduan", ikon: "daftar2", teks: "bel.tab.panduan", panel: "pnPanduan", cocok: (h) => !/^#(akademi|istilah)/.test(h), muat: async () => {} },
    { k: "akademi", ikon: "akademi", teks: "bel.tab.akademi", panel: "pnAkademi", muat: () => import("/akademi.js") },
    { k: "istilah", ikon: "kamus", teks: "bel.tab.istilah", panel: "pnIstilah", cocok: (h) => /^#istilah/.test(h), muat: () => import("/istilah.js") },
  ] });
  $("isi").innerHTML = hantuHtml(6);
  try { [d, biaya, izin, desa, tren] = await Promise.all([muatData("panduan.json"), muatData("biaya_bangun.json"), muatData("izin_kontrak.json"), muatData("desa_energi_mandiri.json"), muatData("kapasitas_tren.json"), muatTeks("panduan")]); } catch (e) { tampilGalat($("isi"), () => location.reload()); return; }
  const h = location.hash.replace(/^#g-/, "");
  sel = d.panduan.some((g) => g.id === h) ? h : d.panduan[0].id;
  $("isi").innerHTML = "";
  gambar(); pasang();
  saatBahasa(() => gambar());
  if (/^#(templat|mitos|panduan|metode|t-|m-)/.test(location.hash)) $(location.hash.slice(1))?.scrollIntoView();
})();
