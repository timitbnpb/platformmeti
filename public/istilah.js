/* /istilah: kamus istilah dan singkatan (data: /data/istilah.json, dibangun scripts/pipa/istilah.mjs).
   Cari + huruf A-Z + kategori berikon warna + kartu + paginasi standar. #id langsung membuka halaman kartunya.
   INP: nilai kontrol berubah seketika; daftar kartu dirender sesudahnya lewat nanti(). */
import { khUbin } from "/inti/kh.js";
import { t, angka, bahasa } from "/i18n.js";
import { esc, ikon, nanti, debounce, hantuHtml, kosongHtml } from "/inti/umum.js";
import { cariHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { hoverAktif, aturHover } from "/inti/istilah.js";
import { muatData, tampilGalat, saatBahasa } from "/analisis.js";

const PER = 24;
const IK_KAT = { teknis: "petir", satuan: "kalkulator", aturan: "palu", uang: "kartu", lembaga: "gedung", rencana: "kompas", metode: "metode" };
const IK_SUMBER = { topik: "topik", pasal: "palu", metode: "metode", umum: "info" };
const S = { d: null, q: "", h: "", k: "", hal: 1, sorot: "" };
const $ = (id) => document.getElementById(id);
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const L = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o || "");
const huruf = (x) => { const c = norm(x.nama).charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : "#"; };

function siapkan(d) {
  d.istilah.forEach((x) => { x._h = huruf(x); x._q = norm([x.nama, x.panjang, ...x.alias, x.arti.id, x.arti.en].join(" ")); });
  d.peta = new Map(d.istilah.map((x) => [x.id, x]));
  return d;
}
const saring = () => {
  const q = norm(S.q.trim());
  return S.d.istilah.filter((x) => (!S.h || x._h === S.h) && (!S.k || x.kat === S.k) && (!q || x._q.includes(q)));
};
const labelSumber = (s) => s.jenis === "topik" ? t("is2.s.topik", { t: L(s.judul) }) : s.jenis === "pasal" ? t("is2.s.pasal", { r: s.judul || s.ref, p: s.pasal }) : s.jenis === "metode" ? t("is2.s.metode") : t("is2.s.umum");

function kartu(x) {
  const sumber = x.sumber.slice(0, 3).map((s) => {
    const isi = `${ikon(IK_SUMBER[s.jenis], 14)}<span>${esc(labelSumber(s))}</span>`;
    return s.href ? `<a class="jm-is-sum" href="${esc(s.href)}">${isi}</a>` : `<span class="jm-is-sum">${isi}</span>`;
  }).join("") + (x.sumber.length > 3 ? `<span class="jm-is-sum jm-is-lagi">+${x.sumber.length - 3}</span>` : "");
  const terkait = x.terkait.map((i) => S.d.peta.get(i)).filter(Boolean).slice(0, 6).map((o) => `<a class="jm-is-pil" href="#${esc(o.id)}" data-is-ke="${esc(o.id)}" aria-label="${esc(t("is2.tautan", { x: o.nama }))}">${esc(o.nama)}</a>`).join("");
  return `<article class="jm-is-kartu" id="${esc(x.id)}" data-kat="${x.kat}">
<header><span class="jm-is-ik jm-is-k-${x.kat}" title="${esc(t("is2.kat." + x.kat))}">${ikon(IK_KAT[x.kat], 20)}</span>
<div class="jm-is-nama"><h3><a href="#${esc(x.id)}" data-is-ke="${esc(x.id)}">${esc(x.nama)}</a></h3>${x.panjang ? `<p class="jm-is-pjg">${esc(x.panjang)}</p>` : ""}</div>
${x.resmi ? `<span class="jm-pil jm-pil-ok">${esc(t("is2.resmi"))}</span>` : `<span class="jm-pil jm-is-pk jm-is-k-${x.kat}">${esc(t("is2.kat." + x.kat))}</span>`}</header>
<p class="jm-is-arti">${esc(L(x.arti))}</p>
<div class="jm-is-sums">${sumber}</div>
${terkait ? `<div class="jm-is-terkait"><span>${esc(t("is2.terkait"))}</span>${terkait}</div>` : ""}</article>`;
}

function gambarDaftar() {
  const hasil = saring(), jumlah = Math.max(1, Math.ceil(hasil.length / PER));
  S.hal = Math.min(Math.max(1, S.hal), jumlah);
  $("isCacah").textContent = t("is2.n", { n: angka(hasil.length) });
  const w = $("isDaftar");
  if (!hasil.length) { w.innerHTML = kosongHtml("is2.kosong"); $("isPag").innerHTML = ""; return; }
  w.innerHTML = hasil.slice((S.hal - 1) * PER, S.hal * PER).map(kartu).join("");
  $("isPag").innerHTML = paginasiHtml({ hal: S.hal, total: hasil.length, per: PER, satuan: "is2.pag" });
  if (S.sorot) { const el = document.getElementById(S.sorot); if (el) { el.classList.add("jm-is-sorot"); el.scrollIntoView({ block: "center" }); } }
}
const jadwal = () => nanti(gambarDaftar);

function kerangka() {
  const kat = [["", "is2.kat.semua", "daftar"], ...S.d.kat.map((k) => [k, "is2.kat." + k, IK_KAT[k]])];
  const abjad = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"], ada = new Set(S.d.istilah.map((x) => x._h));
  $("isIsi").innerHTML = `<section class="jm-is-bar" aria-label="${esc(t("is2.cari"))}">
<div class="jm-is-baris">${cariHtml({ id: "isCari", label: t("is2.cari"), placeholder: t("is2.cari") })}<span class="jm-is-n" id="isCacah" role="status" aria-live="polite"></span><button type="button" class="jm-is-sakelar" data-is-hover aria-pressed="${hoverAktif()}">${ikon("info", 16)}<span>${esc(t(hoverAktif() ? "is2.h.matikan" : "is2.h.nyalakan"))}</span></button></div>
<div class="jm-is-kat" role="group" aria-label="${esc(t("is2.kat"))}">${kat.map(([k, kunci, ik]) => `<button type="button" class="jm-is-k${k ? " jm-is-k-" + k : ""}" data-is-k="${k}" aria-pressed="${k === S.k}">${ikon(ik, 18)}<span>${esc(t(kunci))}</span></button>`).join("")}</div>
<div class="jm-is-abjad" role="group" aria-label="${esc(t("is2.huruf"))}"><button type="button" class="jm-is-h" data-is-h="" aria-pressed="${S.h === ""}">${esc(t("is2.semua"))}</button>${abjad.map((c) => `<button type="button" class="jm-is-h" data-is-h="${c}" aria-pressed="${S.h === c}"${ada.has(c) ? "" : " disabled"}>${c}</button>`).join("")}</div>
</section>
<div id="isDaftar" class="jm-is-daftar"></div><div id="isPag"></div><p class="jm-bantu jm-is-bantu">${esc(t("is2.bantu"))}</p>`;
  $("isCari").value = S.q;
}

function pasangEvent() {
  const isi = $("isIsi");
  isi.addEventListener("input", debounce((e) => { if (e.target.id === "isCari") { S.q = e.target.value; S.hal = 1; S.sorot = ""; jadwal(); } }));
  isi.addEventListener("click", (e) => {
    const b = e.target.closest("button"), a = e.target.closest("[data-is-ke]");
    if (a) { e.preventDefault(); lompat(a.dataset.isKe); return; }
    if (!b) return;
    if (b.dataset.isHover !== undefined) { const hidup = !hoverAktif(); aturHover(hidup); b.setAttribute("aria-pressed", String(hidup)); b.querySelector("span").textContent = t(hidup ? "is2.h.matikan" : "is2.h.nyalakan"); return; }
    if (b.dataset.isK !== undefined) { S.k = b.dataset.isK; S.hal = 1; S.sorot = ""; for (const x of isi.querySelectorAll("[data-is-k]")) x.setAttribute("aria-pressed", String(x === b)); jadwal(); }
    else if (b.dataset.isH !== undefined) { S.h = b.dataset.isH; S.hal = 1; S.sorot = ""; for (const x of isi.querySelectorAll("[data-is-h]")) x.setAttribute("aria-pressed", String(x === b)); jadwal(); }
    else if (b.dataset.hal) { S.hal = +b.dataset.hal; S.sorot = ""; sorotHalaman(b, S.hal); nanti(() => { gambarDaftar(); $("isCari").scrollIntoView({ block: "start" }); }); }
  });
}

/* tautan langsung #id: kosongkan saringan, cari halaman kartunya, sorot */
function lompat(id, ubahHash = true) {
  const x = S.d.peta.get(id); if (!x) return;
  S.q = ""; S.h = ""; S.k = ""; $("isCari").value = "";
  for (const b of document.querySelectorAll("[data-is-k],[data-is-h]")) b.setAttribute("aria-pressed", String(b.dataset.isK === "" || b.dataset.isH === ""));
  S.hal = Math.floor(S.d.istilah.indexOf(x) / PER) + 1; S.sorot = id;
  if (ubahHash) history.replaceState(null, "", "#istilah-" + id);
  document.querySelector(".jm-is-sorot")?.classList.remove("jm-is-sorot");
  jadwal();
}

async function mulai() {
  $("isIsi").innerHTML = hantuHtml(4);
  try { S.d = siapkan(await muatData("istilah.json")); } catch (e) { return tampilGalat($("isIsi"), mulai); }
  const h = S.d.sumber_hitung, nResmi = S.d.istilah.filter((x) => x.resmi).length;
  const ubin = () => khUbin("isUbin", [{ ikon: "kamus", nilai: angka(S.d.jumlah), label: t("is2.u.istilah") }, (nResmi ? { ikon: "palu", nilai: angka(nResmi), label: t("is2.u.resmi") } : { ikon: "daftar", nilai: angka(S.d.kat.length), label: t("is2.u.kat") }), { ikon: "buku", nilai: angka(new Set(S.d.istilah.flatMap((x) => x.sumber.filter((s) => s.jenis === "topik").map((s) => s.ref))).size), label: t("is2.u.topik") }, { ikon: "tag", nilai: angka(h.umum), label: t("is2.u.singkatan") }]);
  ubin();
  kerangka(); pasangEvent();
  const idHash = () => decodeURIComponent(location.hash.slice(1)).replace(/^istilah-/, "");
  const awal = idHash();
  if (S.d.peta.has(awal)) lompat(awal, false); else gambarDaftar();
  window.addEventListener("hashchange", () => { const id = idHash(); if (S.d.peta.has(id)) lompat(id, false); });
  saatBahasa(() => { ubin(); kerangka(); gambarDaftar(); });
}
mulai();
