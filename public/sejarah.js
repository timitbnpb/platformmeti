/* /sejarah: linimasa energi terbarukan Indonesia per dekade + grafik kapasitas terpasang (IRENA). Data /data/sejarah.json
   (scripts/pipa/sejarah_bangun.mjs), teks /data/teks_sejarah.json. Tiap peristiwa bertaut ke proyek, organisasi, regulasi, istilah, topik. */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, ikon, hantuHtml, nanti } from "/inti/umum.js";
import { tanggal } from "/i18n.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { muatData, tampilGalat, ubinHtml } from "/analisis.js";
import { muatTeks, tt, L, num, tautan, seksi, catatan, narasi, sumber, saatBahasa } from "/info_kerangka.js";

const $ = (id) => document.getElementById(id);
const IK_KAT = { proyek: "proyek", regulasi: "regulasi", kelembagaan: "gedung", teknologi: "petir", pendanaan: "kartu" };
const IK_TAUT = { proyek: "proyek", org: "gedung", regulasi: "regulasi", istilah: "kamus", topik: "topik" };
const HREF = { proyek: (x) => `/p/${encodeURIComponent(x.id)}`, org: (x) => `/o/${encodeURIComponent(x.id)}`, regulasi: (x) => `/regulasi?id=${encodeURIComponent(x.id)}`, istilah: (x) => `/istilah#${encodeURIComponent(x.id)}`, topik: (x) => `/topik?id=${encodeURIComponent(x.id)}` };
const IK_BUKTI = { resmi: "lencana", media: "berita", ensiklopedia: "buku" };
let d = null;
const st = { kat: new Set(), dek: 0 };

const tglTeks = (e) => (e.t.length === 10 ? tanggal(e.t) : e.t);
const dekadeLabel = (n) => tt("dek.satu", { d: n });

function chipTaut(jenis, x) {
  const nama = jenis === "topik" ? L(x.nama) : x.nama;
  const logo = x.logo ? `<img class="sj-logo" src="${esc(x.logo)}" alt="" width="18" height="18" loading="lazy" data-galat="hapus">` : "";
  const sts = x.status && x.status !== "berlaku" ? `<small>${esc(tt("status." + x.status))}</small>` : "";
  return `<a class="sj-taut sj-t-${jenis}" href="${esc(HREF[jenis](x))}">${logo || ikon(IK_TAUT[jenis], 16)}<span>${esc(nama)}</span>${sts}</a>`;
}
function kartu(e) {
  const taut = ["proyek", "org", "regulasi", "istilah", "topik"].flatMap((j) => e.tautan[j].map((x) => chipTaut(j, x))).join("") + (e.tautan.regulasi_luar ? `<span class="sj-taut sj-t-regulasi">${ikon("regulasi", 16)}<span>${esc(e.tautan.regulasi_luar)}</span></span>` : "");
  const sm = e.sumber.map((s) => `<li>${tautan(s.url, s.judul)} <span class="jm-bantu">${esc(s.penerbit)}</span></li>`).join("");
  return `<li class="sj-kartu sj-k-${e.kat}" id="p-${esc(e.id)}"><div class="sj-tgl"><b>${esc(tglTeks(e))}</b>${e.tek ? `<span class="sj-tek" title="${esc(tt("seri." + e.tek))}">${ikonTek(e.tek)}</span>` : ""}</div>
<div class="sj-isi"><p class="sj-kat"><span class="sj-pil">${ikon(IK_KAT[e.kat], 16)}${esc(tt("kat." + e.kat))}</span><span class="sj-bukti" title="${esc(tt("bukti.judul"))}">${ikon(IK_BUKTI[e.bukti], 14)}${esc(tt("bukti." + e.bukti))}</span></p>
<h3>${esc(L(e.judul))}</h3><p>${esc(L(e.ringkas))}</p>${taut ? `<div class="sj-tauts">${taut}</div>` : ""}
<details class="sj-sumber"><summary>${esc(tt("sumber.judul", { n: e.sumber.length }))}</summary><ul>${sm}</ul></details></div></li>`;
}

function saring() { return d.peristiwa.filter((e) => (!st.kat.size || st.kat.has(e.kat)) && (!st.dek || e.dekade === st.dek)); }
function isiLinimasa() {
  const a = saring();
  $("sj-hitung").textContent = tt("hitung", { n: num(a.length), m: num(d.peristiwa.length) });
  if (!a.length) { $("sj-daftar").innerHTML = `<p class="jm-bantu">${esc(tt("kosong"))}</p>`; return; }
  const per = new Map();
  for (const e of a) (per.get(e.dekade) ?? per.set(e.dekade, []).get(e.dekade)).push(e);
  $("sj-daftar").innerHTML = [...per].map(([dk, es]) => `<section class="sj-dekade" aria-labelledby="dk-${dk}"><h3 id="dk-${dk}" class="sj-dh">${ikon("tahun", 18)}${esc(dekadeLabel(dk))}<span class="jm-bantu">${esc(tt("n_peristiwa", { n: es.length }))}</span></h3><ol class="sj-gar">${es.map(kartu).join("")}</ol></section>`).join("");
}
function chipsHtml() {
  const hit = (k) => d.peristiwa.filter((e) => e.kat === k).length;
  const kat = d.kategori.map((k) => `<button type="button" class="sj-chip sj-k-${k}" data-kat="${k}" aria-pressed="${st.kat.has(k)}">${ikon(IK_KAT[k], 16)}<span>${esc(tt("kat." + k))}</span><b>${hit(k)}</b></button>`).join("");
  const dek = [...new Set(d.peristiwa.map((e) => e.dekade))].sort();
  const dk = [0, ...dek].map((n) => `<button type="button" class="sj-chip sj-dk" data-dek="${n}" aria-pressed="${st.dek === n}">${esc(n ? dekadeLabel(n) : tt("dek.semua"))}</button>`).join("");
  return `<div class="sj-saring"><p class="sj-lbl">${ikon("daftar2", 16)}${esc(tt("saring.kat"))}</p><div class="sj-chips" role="group" aria-label="${esc(tt("saring.kat"))}">${kat}</div>
<p class="sj-lbl">${ikon("tahun", 16)}${esc(tt("saring.dekade"))}</p><div class="sj-chips" role="group" aria-label="${esc(tt("saring.dekade"))}">${dk}</div>
<p class="jm-hitung" id="sj-hitung" role="status" aria-live="polite"></p></div>`;
}

/* ---- grafik kapasitas: kolom bertumpuk per teknologi; tiap segmen dan kolom bertooltip (<title> jadi tooltip lewat tip_grafik.js) ---- */
function grafik() {
  const k = d.kapasitas, n = k.tahun.length, M = innerWidth < 640;
  const W = M ? 420 : 680, H = M ? 260 : 280, Lm = 40, R = 8, T = 14, B = H - 30, fs = M ? 12 : 11;
  const tot = k.tahun.map((_, i) => Object.values(k.seri).reduce((s, v) => s + v[i], 0));
  const mx = Math.ceil(Math.max(...tot) / 5000) * 5000, Y = (v) => B - (v / mx) * (B - T), gap = (W - Lm - R) / n, bw = gap * 0.72;
  let g = [0, 0.5, 1].map((f) => `<line class="jm-gf-grid" x1="${Lm}" x2="${W - R}" y1="${Y(mx * f).toFixed(1)}" y2="${Y(mx * f).toFixed(1)}"/><text class="jm-gf-t2" x="${Lm - 6}" y="${(Y(mx * f) + 4).toFixed(1)}" text-anchor="end" font-size="${fs - 1}">${num(mx * f / 1000)}</text>`).join("");
  k.tahun.forEach((y, i) => {
    const x = Lm + i * gap + (gap - bw) / 2; let acc = 0;
    for (const s of Object.keys(k.seri)) {
      const v = k.seri[s][i]; if (!v) continue;
      const y1 = Y(acc + v), h = Y(acc) - y1; acc += v;
      g += `<rect class="sj-s-${s}" x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, h).toFixed(1)}"><title>${esc(tt("seri." + s))} ${y}: ${num(v / 1000, 2)} ${esc(tt("satuan.gw"))}</title></rect>`;
    }
    if (i % (M ? 5 : 4) === 0 || i === n - 1) g += `<text class="jm-gf-t2" x="${(x + bw / 2).toFixed(1)}" y="${B + 16}" text-anchor="middle" font-size="${fs}">${y}</text>`;
  });
  const sorot = n - 1, xs = Lm + sorot * gap + gap / 2;
  g += `<text class="jm-gf-t1 jm-gf-tb" x="${(xs - 4).toFixed(1)}" y="${(Y(tot[sorot]) - 6).toFixed(1)}" text-anchor="end" font-size="${fs}">${num(tot[sorot] / 1000, 1)} ${esc(tt("satuan.gw"))}</text>`;
  return `<svg class="jm-gf sj-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(tt("grafik.label"))}" focusable="false">${g}</svg>`;
}
const legenda = () => `<ul class="sj-leg">${Object.keys(d.kapasitas.seri).map((s) => `<li class="sj-l-${s}"><span class="sj-lik">${ikonTek(s)}</span>${esc(tt("seri." + s))}</li>`).join("")}</ul>`;

function bagKapasitas() {
  const k = d.kapasitas, i = k.tahun.length - 1, total = Object.values(k.seri).reduce((s, v) => s + v[i], 0), awal = Object.values(k.seri).reduce((s, v) => s + v[0], 0);
  $("s-kap").innerHTML = seksi({ id: "kapasitas", ik: "grafik", topik: tt("grafik.topik"), judul: tt("grafik.judul", { gw: num(total / 1000, 1), tahun: k.tahun[i], x: num(total / awal, 1) }), turunan: false, sub: tt("grafik.sub"),
    isi: `${narasi(tt("grafik.narasi"))}${legenda()}<div class="sj-kotak">${grafik()}</div>${catatan(L({ id: k.catatan_id, en: k.catatan_en }))}${sumber(k.sumber.map((s) => ({ sumber: s.judul, url: s.url, tanggal: d.dibangun_pada })))}` });
}
function bagLinimasa() {
  $("s-lin").innerHTML = seksi({ id: "linimasa", ik: "linimasa", topik: tt("lin.topik"), judul: tt("lin.judul", { n: d.jumlah, a: d.peristiwa[0].tahun, b: d.peristiwa.at(-1).tahun }), turunan: false, sub: tt("lin.sub"),
    isi: `${narasi(tt("lin.narasi"))}<div id="sj-saring">${chipsHtml()}</div><div id="sj-daftar"></div>${catatan(tt("lin.catatan"))}` });
  isiLinimasa();
}
function bagMetode() {
  $("s-met").innerHTML = seksi({ id: "metode", ik: "metode", topik: tt("met.topik"), judul: tt("met.judul"), turunan: false, sub: tt("met.sub"),
    isi: `${narasi(tt("met.isi"))}<ul class="sj-celah">${d.celah.map((_, j) => `<li>${esc(tt("celah." + j))}</li>`).join("")}</ul>${catatan(tt("met.tanggal", { tanggal: tanggal(d.dibangun_pada) }))}` });
}

function ubin() {
  const k = d.kapasitas, i = k.tahun.length - 1, total = Object.values(k.seri).reduce((s, v) => s + v[i], 0);
  $("ubin").innerHTML = ubinHtml([
    { ikon: "linimasa", nilai: num(d.jumlah), label: tt("ubin.peristiwa"), href: "#linimasa" },
    { ikon: "tahun", nilai: num(d.peristiwa.at(-1).tahun - d.peristiwa[0].tahun), satuan: tt("satuan.tahun"), label: tt("ubin.rentang", { a: d.peristiwa[0].tahun, b: d.peristiwa.at(-1).tahun }), href: "#linimasa" },
    { ikon: "petir", nilai: num(total / 1000, 1), satuan: tt("satuan.gw"), label: tt("ubin.kap", { tahun: k.tahun[i] }), href: "#kapasitas" },
  ]);
}
function gambar() {
  ubin();
  for (const id of ["s-kap", "s-lin", "s-met"]) if (!$(id)) $("isi").insertAdjacentHTML("beforeend", `<div id="${id}"></div>`);
  bagKapasitas(); bagLinimasa(); bagMetode();
  document.querySelectorAll("[data-k]").forEach((e) => { e.textContent = tt(e.dataset.k); });
  document.title = tt("judul.halaman");
}
function pasang() {
  $("isi").addEventListener("click", (e) => {
    const b = e.target.closest(".sj-chip"); if (!b) return;
    if (b.dataset.kat) { st.kat.has(b.dataset.kat) ? st.kat.delete(b.dataset.kat) : st.kat.add(b.dataset.kat); b.setAttribute("aria-pressed", st.kat.has(b.dataset.kat)); }
    else { st.dek = +b.dataset.dek; b.parentElement.querySelectorAll(".sj-chip").forEach((x) => x.setAttribute("aria-pressed", +x.dataset.dek === st.dek)); }
    nanti(isiLinimasa);
  });
}
let resizeT = 0, lebar = innerWidth < 640;
(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { [d] = await Promise.all([muatData("sejarah.json"), muatTeks("sejarah")]); } catch (e) { tampilGalat($("isi"), () => location.reload()); return; }
  $("isi").innerHTML = "";
  gambar(); pasang();
  saatBahasa(() => gambar());
  addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if ((innerWidth < 640) !== lebar) { lebar = innerWidth < 640; bagKapasitas(); } }, 200); });
  if (location.hash) $(location.hash.slice(1))?.scrollIntoView();
})();
