/* Tab Dedieselisasi: PLTD per provinsi, BPP sistem terisolasi, proyek dedieselisasi RUPTL, dan estimasi penghematan BBM bila sebagian PLTD diganti PLTS + baterai.
   Rumus terbuka di radar_rumus.js (hemat); semua asumsi HIPOTESIS dan bisa diganti lewat dua segmen. Data: dedieselisasi.json (scripts/pipa/dedieselisasi.mjs). */
import { t, angka } from "/i18n.js";
import { esc, nanti, ikon } from "/inti/umum.js";
import { exHtml, sumberHtml, pilihHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { batang } from "/grafik.js";
import { hemat, ASUMSI, tingkatPrioritas } from "/radar_rumus.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const PER = 12;
const lambang = (kode, u = 20) => `<img src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">`;
const hl = (x) => `<span class="jm-hl">${esc(x)}</span>`;
const hipPil = () => `<span class="jm-pil jm-pil-warn">${esc(t("kl.hipotesis"))}</span>`;
const pilPrio = (x) => { const k = tingkatPrioritas(x); return k ? `<span class="jm-pil rd2-sk rd2-sk-${k}" title="${esc(t("rd2.d.prio." + k))}">${ikon(k === "t" ? "petir" : k === "s" ? "info" : "peringatan", 14)}<b>${esc(N(x, 1))}</b></span>` : `<span class="rd2-kosong">-</span>`; };
const ringkas = (x) => (Math.abs(x) >= 1000 ? `Rp${N(x / 1000, 1)} ${t("rd2.d.pT")}` : `Rp${N(x)} ${t("rd2.d.pM")}`);
const miliar = (x) => (Math.abs(x) >= 1000 ? `${N(x / 1000, 1)} ${t("rd2.d.triliun")}` : `${N(x, 1)} ${t("rd2.d.miliar")}`);

let D, isi;
const S = { s: 0.5, sk: "dasar", uk: "bbm", ua: -1, hal: 1 };

function hitung(b) {
  if (!b.pltd_gwh) return null;
  return hemat({ pltdGwh: b.pltd_gwh, s: S.s, hargaL: D.harga_solar.rp_per_liter, skenario: S.sk, pvout: b.pvout });
}
const rows = () => D.baris.filter((b) => b.pltd_gwh).map((b) => ({ b, h: hitung(b) }));
function urut() {
  const kunci = { prov: (r) => r.b.provinsi, pltd: (r) => r.b.pltd_mw, pangsa: (r) => r.b.pangsa_pltd, bpp: (r) => r.b.bpp_maks_terisolasi, bbm: (r) => r.h.bbm_miliar, bersih: (r) => r.h.bersih_miliar, mwp: (r) => r.h.mwp, prio: (r) => r.b.prioritas }[S.uk];
  return rows().sort((a, z) => { const x = kunci(a), y = kunci(z); if (x == null) return 1; if (y == null) return -1; return (typeof x === "string" ? x.localeCompare(y, "id") : x - y) * S.ua || a.b.provinsi.localeCompare(z.b.provinsi, "id"); });
}

function kerangka() {
  const seg = (nama, daftar, aktif, lab) => `<div class="rd2-seg-blok"><span class="rd2-seg-j">${esc(t(lab))}</span><div class="jm-pel-seg rd2-seg3" role="group" aria-label="${esc(t(lab))}">${daftar.map(([v, teks, ik]) => `<button type="button" class="jm-kl-tb" data-${nama}="${esc(v)}" aria-pressed="${String(aktif) === String(v)}">${ikon(ik, 20)}<span>${esc(teks)}</span></button>`).join("")}</div></div>`;
  isi.innerHTML = `
  <div id="dedAsumsi">${exHtml({ id: "exDedKontrol", ikon: "kalkulator", topik: t("rd2.d.ex.kontrol"), judulHtml: esc(t("rd2.d.ex.kontrol.j")), subHtml: `${esc(t("rd2.d.ex.kontrol.s", { dex: N(D.harga_solar.rp_per_liter), sfc: N(ASUMSI.sfc_l_kwh, 2), kurs: N(ASUMSI.kurs) }))} ${hipPil()}`, aksiHtml: sumberHtml(`${D.harga_solar.label ? `<span class="jm-pil jm-pil-warn">${esc(t("kl.hipotesis"))}</span> ` : ""}${esc(D.harga_solar.produk)} ${esc(D.harga_solar.wilayah)}${D.harga_solar.berlaku_sejak ? `, ${esc(t("rd2.d.sejak"))} ${esc(D.harga_solar.berlaku_sejak)}` : ""}<br>${D.sumber.map((x) => esc(x.judul)).join("<br>")}`),
    isiHtml: seg("s", ASUMSI.pangsa.map((p) => [p, `${N(p * 100)}%`, "petir"]), S.s, "rd2.d.pangsa") + seg("sk", Object.keys(ASUMSI.biaya_sen_usd_kwh).map((k) => [k, `${t("rd2.d.sk." + k)} (${N(ASUMSI.biaya_sen_usd_kwh[k])} ${t("rd2.d.sen")})`, "tek-surya"]), S.sk, "rd2.d.skenario") })}</div>
  <div id="dedGrafik">${exHtml({ id: "exDedGrafik", ikon: "grafik", topik: "", judulHtml: "", isiHtml: `<div id="dedBatang"></div>` })}</div>
  <div id="dedBpp">${exHtml({ id: "exDedBpp", ikon: "tag", topik: "", judulHtml: "", isiHtml: `<div id="dedBppIsi"></div>` })}</div>
  <div id="dedTabel">${exHtml({ id: "exDedTabel", ikon: "tabel", topik: "", judulHtml: "", isiHtml: `<div id="dedTabelIsi"></div>` })}</div>
  <div id="dedMetode"></div>`;
}
function kepala(id, d) {
  const m = $(id), tmp = document.createElement("div");
  tmp.innerHTML = exHtml({ ...d, isiHtml: "" });
  m.querySelector(".jm-ex-hd").replaceWith(tmp.querySelector(".jm-ex-hd"));
}
const src = () => sumberHtml(`${D.sumber.map((x) => esc(x.judul)).join("<br>")}<br>${esc(t("rd2.sumber.tgl", { tgl: D.dibangun_pada }))}`);

function grafik() {
  const r = urut().sort((a, z) => z.h.bbm_miliar - a.h.bbm_miliar), total = r.reduce((a, x) => a + x.h.bbm_miliar, 0), bersih = r.reduce((a, x) => a + x.h.bersih_miliar, 0);
  kepala("dedGrafik", { ikon: "grafik", topik: t("rd2.d.ex.grafik"), judulHtml: `${hl(miliar(total))} ${esc(t("rd2.d.ex.grafik.j", { s: N(S.s * 100) }))}`, subHtml: `${esc(t("rd2.d.ex.grafik.s", { bersih: miliar(bersih) }))} ${hipPil()}`, aksiHtml: aksiHtml({ csv: true }) + src() });
  $("dedBatang").innerHTML = batang(r.slice(0, 12).map((x, i) => ({ label: x.b.provinsi, v: Math.max(0.01, x.h.bbm_miliar), sorot: i === 0, teks: ringkas(x.h.bbm_miliar) })), { label: t("rd2.d.ex.grafik") });
  /* tooltip batang membawa rincian lewat <title>: ganti judul bawaan dengan rincian provinsi */
  $("dedBatang").querySelectorAll("rect.jm-gf-sorot title, rect.jm-gf-abu title").forEach((ti, i) => {
    const x = r[i]; if (!x) return;
    ti.textContent = `${x.b.provinsi}: ${t("rd2.d.tip", { bbm: miliar(x.h.bbm_miliar), l: N(x.h.liter / 1e6, 1), biaya: miliar(x.h.biaya_miliar), bersih: miliar(x.h.bersih_miliar), mwp: x.h.mwp === null ? "-" : N(x.h.mwp) })}`;
  });
}
function bpp() {
  const l = D.sistem_terisolasi.slice(0, 15), maks = D.sistem_terisolasi[0];
  kepala("dedBpp", { ikon: "tag", topik: t("rd2.d.ex.bpp"), judulHtml: `${hl(N(D.sistem_terisolasi.length))} ${esc(t("rd2.d.ex.bpp.j"))}`, subHtml: `${esc(t("rd2.d.ex.bpp.s", { nama: maks.nama, bpp: N(maks.bpp_rp_kwh), nas: N(1027.7) }))}`, aksiHtml: aksiHtml({ csv: true }) + src() });
  $("dedBppIsi").innerHTML = batang(l.map((x, i) => ({ label: x.nama, v: x.bpp_rp_kwh, sorot: i === 0, teks: `Rp${N(x.bpp_rp_kwh)}` })), { label: t("rd2.d.ex.bpp"), ref: 1027.7, teksRef: t("rd2.d.nasional") });
  $("dedBppIsi").querySelectorAll("rect.jm-gf-sorot title, rect.jm-gf-abu title").forEach((ti, i) => { const x = l[i]; if (x) ti.textContent = `${x.nama}, ${x.provinsi}: ${t("rd2.d.tip.bpp", { bpp: N(x.bpp_rp_kwh), p: N((x.bpp_rp_kwh / 1027.7 - 1) * 100) })}`; });
}

const KOL = [["prov", "rd2.d.c.prov", ""], ["pltd", "rd2.d.c.pltd", "MW"], ["pangsa", "rd2.d.c.pangsa", "%"], ["bpp", "rd2.d.c.bpp", "Rp/kWh"], ["bbm", "rd2.d.c.bbm", "rd2.d.miliar"], ["bersih", "rd2.d.c.bersih", "rd2.d.miliar"], ["mwp", "rd2.d.c.mwp", "MWp"], ["prio", "rd2.d.c.prio", ""]];
function tabel() {
  const semua = urut(), maks = Math.max(1, Math.ceil(semua.length / PER));
  S.hal = Math.min(S.hal, maks);
  const sat = (u) => (u.startsWith("rd2.") ? t(u) : u);
  const th = KOL.map(([k, lab, u]) => `<th scope="col" class="rd2-d-${k}" aria-sort="${S.uk === k ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${k}">${esc(t(lab))}</button>${u ? `<small>${esc(sat(u))}</small>` : ""}</th>`).join("");
  const td = (i, h, c = "") => `<td data-label="${esc(t(KOL[i][1]))}"${c ? ` class="${c}"` : ""}>${h}</td>`;
  const tr = semua.slice((S.hal - 1) * PER, S.hal * PER).map(({ b, h }) => {
    const pr = b.proyek.length ? `<small class="rd2-ruptl" title="${esc(b.proyek.map((p) => p.nama + " " + N(p.mw, 1) + " MW").join("; "))}">${ikon("proyek", 12)}${esc(t("rd2.d.ruptl", { mw: N(b.proyek_mw, 1) }))}</small>` : "";
    const hasil = h.bersih_miliar;
    return `<tr>${td(0, `<div class="rd2-sel"><span class="jm-pel-pj">${lambang(b.kode)}<a href="/wilayah/${esc(b.kode)}">${esc(b.provinsi)}</a></span>${pr}</div>`)}${td(1, N(b.pltd_mw), "jm-num")}${td(2, N(b.pangsa_pltd, 1), "jm-num")}${td(3, b.bpp_maks_terisolasi === null ? "-" : N(b.bpp_maks_terisolasi), "jm-num")}${td(4, N(h.bbm_miliar, 1), "jm-num")}${td(5, `<span class="jm-pil ${hasil >= 0 ? "jm-pil-ok" : "jm-pil-bad"}">${esc(N(hasil, 1))}</span>`, "jm-num")}${td(6, h.mwp === null ? "-" : N(h.mwp), "jm-num")}${td(7, pilPrio(b.prioritas), "jm-num")}</tr>`;
  }).join("");
  const nTotal = D.baris.length, nPltd = semua.length;
  kepala("dedTabel", { ikon: "tabel", topik: t("rd2.d.ex.tabel"), judulHtml: `${hl(N(nPltd))} ${esc(t("rd2.d.ex.tabel.j"))}`, subHtml: `${esc(t("rd2.d.ex.tabel.s", { n: N(nTotal) }))} ${hipPil()}`, aksiHtml: aksiHtml({ csv: true }) + src() });
  $("dedTabelIsi").innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap rd2-tabel rd2-tabel-d" data-urut="tidak"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>${paginasiHtml({ hal: S.hal, total: semua.length, per: PER, satuan: "rd2.d.pag" })}`;
}
function metode() {
  $("dedMetode").innerHTML = exHtml({ id: "exDedMetode", ikon: "metode", topik: t("an.cara"), judulHtml: `${esc(t("rd2.d.metode.j"))} ${hipPil()}`, tingkat: "h2",
    isiHtml: `<div class="rd2-metode"><section><h3>${ikon("kalkulator", 16)}<span>${esc(t("rd2.d.metode.rumus"))}</span></h3><ol class="rd2-langkah">${[1, 2, 3, 4, 5, 6].map((i) => `<li>${esc(t("rd2.d.r" + i))}</li>`).join("")}</ol></section>
      <section><h3>${ikon("analisis", 16)}<span>${esc(t("rd2.d.metode.prio"))}</span></h3><p class="rd2-p">${esc(t("rd2.d.prio.cara"))}</p><ul class="rd2-bobot">${Object.entries(D.bobot_prioritas).map(([id, w]) => `<li><b>${esc(t("rd2.d.b." + id))}</b><span>${esc(N(w * 100))}%</span></li>`).join("")}</ul></section>
      <section><h3>${ikon("peringatan", 16)}<span>${esc(t("rd2.metode.celah"))}</span></h3><ul class="rd2-celah">${D.celah.map((c, i) => `<li>${ikon("info", 14)}<span>${esc(t("rd2.d.celah." + (i + 1)))}</span></li>`).join("")}</ul></section></div>` });
}
function segarkan() { grafik(); tabel(); }
let terpasang = false;
function pasang() {
  isi.addEventListener("click", (e) => {
    const a = e.target.closest("[data-s],[data-sk]");
    if (a) {
      const k = a.dataset.s !== undefined ? "s" : "sk", v = k === "s" ? +a.dataset.s : a.dataset.sk;
      if (S[k] === v) return;
      S[k] = v; S.hal = 1;
      for (const x of a.parentElement.querySelectorAll("button")) x.setAttribute("aria-pressed", String(x === a));
      nanti(segarkan); return;
    }
    const u = e.target.closest("#exDedTabel .jm-urut");
    if (u) { const k = u.dataset.uk; S.ua = S.uk === k ? -S.ua : k === "prov" ? 1 : -1; S.uk = k; S.hal = 1; for (const th of u.closest("tr").children) th.setAttribute("aria-sort", th.contains(u) ? (S.ua > 0 ? "ascending" : "descending") : "none"); nanti(tabel); return; }
    const pg = e.target.closest("#exDedTabel .jm-pag [data-hal]");
    if (pg && !pg.disabled) { S.hal = +pg.dataset.hal; sorotHalaman(pg, S.hal); nanti(tabel); }
  });
  isi.addEventListener("jm:csv", (e) => {
    const ex = e.target.closest(".jm-ex"); if (!ex) return;
    if (ex.id === "exDedTabel" || ex.id === "exDedGrafik") e.detail.baris = [[t("rd2.d.c.prov"), t("rd2.d.c.pltd") + " MW", t("rd2.d.produksi") + " GWh", t("rd2.d.c.pangsa") + " %", t("rd2.d.c.bpp") + " Rp/kWh", t("rd2.d.c.bbm") + " " + t("rd2.d.miliar"), t("rd2.d.c.bersih") + " " + t("rd2.d.miliar"), t("rd2.d.c.mwp") + " MWp", t("rd2.d.c.prio")], ...urut().map(({ b, h }) => [b.provinsi, b.pltd_mw, b.pltd_gwh, b.pangsa_pltd, b.bpp_maks_terisolasi ?? "", Math.round(h.bbm_miliar * 10) / 10, Math.round(h.bersih_miliar * 10) / 10, h.mwp === null ? "" : Math.round(h.mwp), b.prioritas ?? ""])];
    else if (ex.id === "exDedBpp") e.detail.baris = [[t("rd2.d.c.sistem"), t("rd2.d.c.prov"), t("rd2.d.c.bpp") + " Rp/kWh"], ...D.sistem_terisolasi.map((x) => [x.nama, x.provinsi, x.bpp_rp_kwh])];
  }, true);
  document.addEventListener("jm:bahasa", () => nanti(() => { kerangka(); metode(); bpp(); segarkan(); }));
}
export function mulai(data) {
  isi = $("rdDedIsi"); D = data;
  if (!terpasang) { terpasang = true; pasang(); }
  kerangka(); metode(); bpp(); segarkan();
}
