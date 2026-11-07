/* /cari: halaman pencarian penuh. Indeks per jenis dimuat malas (inti/cari_indeks.js), peringkat di inti/cari_rumus.js.
   INP: ketik di-debounce, chip jenis menyala seketika lalu hasil dirender lewat nanti(); render maksimal 20 baris per halaman. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka } from "/i18n.js";
import { esc, ikon, nanti, debounce } from "/inti/umum.js";
import { norm, cari } from "/inti/cari_rumus.js";
import { JENIS, muatBanyak } from "/inti/cari_indeks.js";
import { barisCari } from "/inti/cari_baris.js";
import { exHtml, cariHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { khUbin } from "/inti/kh.js";
import { saatBahasa } from "/analisis.js";

const PER = 20, RINGKAS = 5, $ = (id) => document.getElementById(id);
const u = new URLSearchParams(location.search);
const S = { q: u.get("q") || "", j: JENIS.some(([g]) => g === u.get("j")) ? u.get("j") : "semua", hal: Math.max(1, +u.get("hal") || 1) };
let indeks = [], logo = null, sedangMuat = true, per = new Map(), aktif = -1;

const rangka = () => {
  $("cariEx").innerHTML = exHtml({ id: "cariIsi", ikon: "cari2", topik: t("cari.judul"), judulHtml: `<span id="cariJ">${esc(t("cari.mulai"))}</span>`,
    subHtml: esc(t("cari.petunjuk")),
    isiHtml: `<div class="cari-alat">${cariHtml({ id: "cariQ", label: t("cari.placeholder"), placeholder: t("cari.placeholder") })}
      <div class="jm-seg cari-seg" id="cariSeg" role="group" aria-label="${esc(t("cari.saring"))}"></div></div>
      <div class="cari-hasil" id="cariHasil" role="listbox" aria-label="${esc(t("cari.judul"))}"></div><div id="cariPag"></div>` });
  $("cariQ").value = S.q;
};
const segHtml = () => {
  const n = (g) => (g === "semua" ? [...per.values()].reduce((a, b) => a + b.length, 0) : (per.get(g) || []).length), ada = !!norm(S.q);
  return [["semua", "cari.chip.semua", "cari2"], ...JENIS.filter(([g]) => g !== "halaman")].map(([g, k, ik]) =>
    `<button type="button" data-j="${g}" aria-pressed="${g === S.j}">${ikon(ik, 14)}<span>${esc(t(k))}</span>${ada ? `<b>${angka(n(g))}</b>` : ""}</button>`).join("");
};
const sinkronUrl = debounce(() => { const p = new URLSearchParams(); if (S.q.trim()) p.set("q", S.q.trim()); if (S.j !== "semua") p.set("j", S.j); if (S.hal > 1) p.set("hal", S.hal); history.replaceState(null, "", location.pathname + (p.size ? "?" + p : "")); }, 400);

function render() {
  const ada = !!norm(S.q);
  per = ada ? cari(indeks, S.q, Infinity) : new Map();
  $("cariSeg").innerHTML = segHtml();
  const total = [...per.values()].reduce((a, b) => a + b.length, 0), hasil = $("cariHasil"), pag = $("cariPag");
  $("cariJ").textContent = ada ? (total ? t("cari.hasil_untuk", { n: angka(total), q: S.q.trim() }) : t(sedangMuat ? "cari.memuat" : "cari.kosong", { q: S.q.trim() })) : t("cari.mulai");
  khUbin("cariUbin", [{ ikon: "daftar", nilai: angka(indeks.length), label: t("cari.kh.butir") }, { ikon: "jenis", nilai: angka(new Set(indeks.map((x) => x.g)).size), label: t("cari.kh.jenis") }, { ikon: "cari2", nilai: ada ? angka(total) : "-", label: t("cari.kh.hasil") }]);
  aktif = -1; sinkronUrl();
  if (!ada || !total) {
    hasil.innerHTML = ada ? `<p class="jm-cari-info">${ikon("cari2", 28)}<span>${esc(t(sedangMuat ? "cari.memuat" : "cari.kosong", { q: S.q.trim() }))}</span></p>`
      : `<div class="jm-cari-contoh">${["cari.c1", "cari.c2", "cari.c3", "cari.c4", "cari.c5"].map((k) => `<button type="button" data-q="${esc(t(k))}">${esc(t(k))}</button>`).join("")}</div>`;
    pag.innerHTML = ""; return;
  }
  const frag = document.createDocumentFragment();
  if (S.j === "semua") {
    let n = 0;
    for (const [g, k, ik] of JENIS) {
      const a = per.get(g); if (!a) continue;
      const grup = document.createElement("div");
      grup.className = "jm-cari-grup";
      grup.innerHTML = `<h3>${ikon(ik, 16)}<span>${esc(t(k))}</span><em>${angka(a.length)}</em>${a.length > RINGKAS ? `<button type="button" class="jm-cari-semua" data-j="${g}">${esc(t("cari.semua", { n: angka(a.length) }))}</button>` : ""}</h3>`;
      for (const it of a.slice(0, RINGKAS)) grup.append(barisCari(it, S.q, { ik, logo, id: "cr-" + n++ }));
      frag.append(grup);
    }
    pag.innerHTML = "";
  } else {
    const a = per.get(S.j) || [], hal = Math.min(S.hal, Math.max(1, Math.ceil(a.length / PER))), ik = JENIS.find(([g]) => g === S.j)[2];
    S.hal = hal;
    a.slice((hal - 1) * PER, hal * PER).forEach((it, n) => frag.append(barisCari(it, S.q, { ik, logo, id: "cr-" + n })));
    pag.innerHTML = paginasiHtml({ hal, total: a.length, per: PER, satuan: "jm.pag.u.hasil" });
  }
  hasil.replaceChildren(frag);
}
const susul = debounce(() => nanti(render), 60);
const pilih = (i) => { const o = [...$("cariHasil").querySelectorAll("[role=option]")]; if (!o.length) return; aktif = (i + o.length) % o.length; o.forEach((e, k) => e.setAttribute("aria-selected", String(k === aktif))); o[aktif].scrollIntoView({ block: "nearest" }); };

function pasang() {
  const q = $("cariQ");
  q.addEventListener("input", debounce(() => { S.q = q.value; S.hal = 1; nanti(render); }, 140));
  q.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); pilih(aktif + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); pilih(aktif - 1); }
    else if (e.key === "Enter") { const o = [...$("cariHasil").querySelectorAll("[role=option]")][aktif]; if (o) { e.preventDefault(); o.click(); } }
  });
  $("cariIsi").addEventListener("click", (e) => {
    const j = e.target.closest("[data-j]"), c = e.target.closest("[data-q]"), h = e.target.closest("[data-hal]");
    if (j) { S.j = j.dataset.j; S.hal = 1; $("cariSeg").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === j))); nanti(render); }
    else if (c) { q.value = S.q = c.dataset.q; S.hal = 1; q.focus(); nanti(render); }
    else if (h) { S.hal = +h.dataset.hal; sorotHalaman(h, S.hal); nanti(() => { render(); $("cariIsi").scrollIntoView({ block: "start" }); }); }
  });
  $("cariHasil").addEventListener("error", (e) => { if (e.target.tagName === "IMG" && logo && !e.target.dataset.cad) { e.target.dataset.cad = "1"; e.target.src = logo.GEDUNG; } }, true);
  q.focus();
}

(async () => {
  await mulaiHalaman();
  rangka(); pasang(); render();
  import("/penerbit.js").then((m) => { logo = m; susul(); }).catch(() => {});
  await muatBanyak(JENIS.map(([g]) => g), (g, a) => { indeks = indeks.concat(a); susul(); });
  sedangMuat = false; render();
  saatBahasa(() => { rangka(); pasang(); render(); });
})();
