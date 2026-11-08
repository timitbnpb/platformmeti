/* /topik (hub) dan /topik?id=<id> (laporan topik). Satu cetakan untuk semua topik; skema data: docs/perencanaan/TOPIK-SKEMA.md, kerangka bab: TOPIK-MENDALAM.md.
   Data: data/topik/indeks.json (hub), dasar-<id>.json (irisan otomatis), <id>.json (naskah terkurasi, opsional), luar_karbon.json (benchmark).
   INP: kontrol (tabel, daftar periksa, daftar isi) mengubah chrome seketika; isi berat disusun lewat nanti(). Bab tanpa data bersumber tidak dirender. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, bahasa } from "/i18n.js";
import { nanti, hantuHtml } from "/inti/umum.js";
import { khSisi } from "/inti/kh.js";
import { kartuHtml, tampilGalat, saatBahasa } from "/analisis.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { S, L, u, num, tok, esc, ikon, tanggal, muat, eksibit, sumberHtml, pilu, pasangTabel, kosong } from "/topik_umum.js";
import { halaman } from "/topik_halaman.js";
import { rumahTopik } from "/inti/rumah_tek.js";

const $ = (id) => document.getElementById(id);

/* ---------- hub ---------- */
function hubHtml(ind) {
  const n = ind.topik;
  const kartu = n.map((x) => {
    const nama = L(S.ui.topik[x.id].nama), ket = L(S.ui.topik[x.id].ket);
    const angka = (x.angka || []).slice(0, 3).map((a) => `<li><b>${esc(a.nilai == null ? "-" : num(a.nilai, a.d || 0))}${a.satuan ? `<small>${esc(L(a.satuan))}</small>` : ""}</b><span>${esc(a.label ? L(a.label) : u(a.k))}</span></li>`).join("");
    const gambar = x.foto ? `<img src="${esc(x.foto)}" alt="" width="640" height="360" loading="lazy" decoding="async" data-galat="hapus">` : "";
    return `<a class="jm-tp-kt" href="${esc(rumahTopik(x.id))}" data-st="${esc(x.status)}"><div class="jm-tp-kt-foto jm-batik">${gambar}<span class="jm-tp-kt-ik">${ikonTek(x.ikon)}</span>${pilu("st." + x.status, x.status === "lengkap" ? "ok" : x.status === "terisi" ? "info" : "warn").replace("jm-pil ", "jm-pil jm-tp-kt-st ")}</div>
      <div class="jm-tp-kt-isi"><h2>${esc(nama)}</h2><p>${esc(ket)}</p>${angka ? `<ul class="jm-tp-kt-angka">${angka}</ul>` : `<p class="jm-bantu">${esc(u("sedang"))}</p>`}<small>${esc(x.bab ? u("kartu.bab") + ": " + num(x.bab) : u("kartu.sumber"))}</small></div></a>`;
  }).join("");
  return `<div class="jm-tp-kisi-hub">${kartu}</div>`;
}
async function hub() {
  const ind = await muat("/data/topik/indeks.json");
  if (!ind) throw new Error("data");
  const lengkap = ind.topik.filter((x) => x.status === "lengkap").length, disusun = ind.topik.filter((x) => x.status === "disusun").length;
  $("judul").textContent = u("hub.judul"); $("jawab").textContent = u("hub.lead");
  khSisi("#kh", { ubin: [{ ikon: "topik", nilai: num(ind.topik.length), label: u("hub.u.topik") }, { ikon: "centang", nilai: num(lengkap), label: u("hub.u.lengkap") }, { ikon: "peringatan", nilai: num(disusun), label: u("hub.u.disusun") }] });
  document.title = u("hub.eyebrow") + " | " + t("jm.merek");
  $("isi").innerHTML = hubHtml(ind);
}

/* ---------- laporan topik ---------- */
async function render(saya) {
  const id = new URLSearchParams(location.search).get("id");
  $("isi").innerHTML = hantuHtml(6);
  try { await (id ? halaman(id) : hub()); } catch (e) { console.error(e); tampilGalat($("isi"), () => render(saya)); }
}

const saya = await mulaiHalaman();
S.ui = await muat("/data/topik/ui.json");
if (!S.ui) tampilGalat($("isi"), () => location.reload());
else {
  pasangTabel();
  await render(saya);
  saatBahasa(() => nanti(() => render(saya)));
}
