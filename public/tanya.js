/* /tanya: kotak tanya bahasa alami atas seluruh wiki. Riwayat HANYA di sessionStorage peramban (hilang saat tab ditutup, tidak pernah ke server). */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml, cariHtml } from "/inti/komponen.js";
import { khUbin } from "/inti/kh.js";
import { saatBahasa } from "/analisis.js";
import { kartuJawab, tanyaKirim, tanyaMuat, tanyaRusak } from "/inti/tanya_kartu.js";

const $ = (id) => document.getElementById(id), KUNCI = "jm.tanya.riwayat", MAKS = 20;
const CONTOH = ["tny.c1", "tny.c2", "tny.c3", "tny.c4"];
const baca = () => { try { const a = JSON.parse(sessionStorage.getItem(KUNCI) || "[]"); return Array.isArray(a) ? a.filter((x) => x && typeof x.pertanyaan === "string" && x.status).slice(0, MAKS) : []; } catch { return []; } };
const simpan = (a) => { try { sessionStorage.setItem(KUNCI, JSON.stringify(a.slice(0, MAKS))); } catch { /* penyimpanan dilarang: riwayat tak tersimpan */ } };
let riwayat = baca(), ctl = null;

const ubin = () => khUbin("tnyUbin", [{ ikon: "jejak", nilai: angka(riwayat.length), label: t("tny.kh.riwayat") }, { ikon: "centang", nilai: angka(riwayat.filter((r) => r.status === "jawab").length), label: t("tny.kh.dijawab") }, { ikon: "cari2", nilai: angka(riwayat.filter((r) => r.status === "kosong").length), label: t("tny.kh.kosong") }]);
const rangka = () => {
  $("tnyEx").innerHTML = exHtml({ id: "tnyIsi", ikon: "cari2", topik: t("tny.eyebrow"), judulHtml: esc(t("tny.mulai")), subHtml: esc(t("tny.petunjuk")),
    isiHtml: `<form class="tny-form" id="tnyForm">${cariHtml({ id: "tnyQ", label: t("tny.placeholder"), placeholder: t("tny.placeholder") })}<button type="submit" class="jm-tbl jm-tbl-utama">${esc(t("tny.kirim"))}</button></form>
      <ul class="tny-contoh">${CONTOH.map((k) => `<li><button type="button" data-q="${esc(t(k))}">${esc(t(k))}</button></li>`).join("")}</ul>
      <div class="tny-hasil" id="tnyHasil" aria-live="polite"></div>
      <div class="tny-riwayat-kepala" id="tnyRk" hidden><h3>${esc(t("tny.riwayat"))}</h3><button type="button" class="jm-tbl" id="tnyHapus">${esc(t("tny.hapus"))}</button></div>
      <div class="tny-hasil" id="tnyLama"></div>` });
};
function gambarRiwayat() {
  const lama = $("tnyLama"), lalu = riwayat.slice(1);
  $("tnyRk").hidden = !riwayat.length;
  lama.replaceChildren(...lalu.map((r, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "tny-lalu"; b.dataset.i = String(i + 1); b.textContent = r.pertanyaan; return b; }));
  ubin();
}
function tampil(r) { $("tnyHasil").replaceChildren(kartuJawab(r)); }
async function tanya(q) {
  q = q.trim();
  if (q.length < 5) return;
  ctl?.abort(); ctl = new AbortController();
  $("tnyHasil").innerHTML = tanyaMuat();
  try {
    const d = await tanyaKirim(q, ctl.signal);
    riwayat = [d, ...riwayat.filter((r) => r.pertanyaan !== d.pertanyaan)].slice(0, MAKS); simpan(riwayat);
    tampil(d); gambarRiwayat();
  } catch (e) { if (e.name !== "AbortError") $("tnyHasil").innerHTML = tanyaRusak(e); }
}
function pasang() {
  $("tnyForm").addEventListener("submit", (e) => { e.preventDefault(); tanya($("tnyQ").value); });
  $("tnyIsi").addEventListener("click", (e) => {
    const c = e.target.closest("[data-q]"), l = e.target.closest("[data-i]");
    if (c) { $("tnyQ").value = c.dataset.q; tanya(c.dataset.q); }
    else if (l) { const r = riwayat[+l.dataset.i]; if (r) { $("tnyQ").value = r.pertanyaan; riwayat = [r, ...riwayat.filter((x) => x !== r)]; simpan(riwayat); tampil(r); gambarRiwayat(); } }
    else if (e.target.closest("#tnyHapus")) { riwayat = []; simpan(riwayat); $("tnyHasil").replaceChildren(); gambarRiwayat(); }
  });
  $("tnyQ").focus();
}
(async () => {
  await mulaiHalaman();
  rangka(); pasang(); gambarRiwayat();
  if (riwayat[0]) tampil(riwayat[0]);
  const q = new URLSearchParams(location.search).get("q");
  if (q) { $("tnyQ").value = q; tanya(q); }
  saatBahasa(() => { rangka(); pasang(); gambarRiwayat(); if (riwayat[0]) tampil(riwayat[0]); });
})();
