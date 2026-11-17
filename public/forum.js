/* forum.js (F65-210, C-04): forum diskusi satu bidang, dipasang di /bidang/<slug>.
   pasangForum(el, { bidang, nama, admin }) -> kartu: utas terbaru (berpaginasi), buka utas, balas, laporkan; admin menyembunyikan dengan alasan.
   Teks pengguna selalu teks polos: tiap keluaran lewat esc(), tidak ada markdown atau HTML yang dirender. Moderasi oleh admin METI (tertulis di kartu). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, api, nanti, hantuHtml, kosongHtml } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";

if (!document.querySelector('link[href="/forum.css"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/forum.css">');

const tgl = (u) => tanggal(new Date(u * 1000).toISOString().slice(0, 10));
const galat = (e) => t({ 404: "fr.g.hilang", 409: "fr.g.sama", 422: "fr.g.isi", 429: "fr.g.laju" }[e.status] || "fr.g.umum");
const pilSembunyi = (x) => (x.tersembunyi ? `<span class="jm-pil jm-pil-warn">${ikon("blokir", 14)}<span>${esc(t("fr.tersembunyi"))}</span></span>` : "");
const pesanEl = '<p class="fr-pesan" role="alert" hidden></p>';

export function pasangForum(el, { bidang, nama, admin = false }) {
  const S = { hal: 1, d: null, buka: null, utas: null };
  const $ = (s) => el.querySelector(s);
  const tulisGalat = (wadah, x) => { const p = wadah.querySelector(".fr-pesan"); if (p) { p.hidden = false; p.textContent = galat(x); } };

  const modHtml = (jenis, x) => `<span class="fr-mod">${x.tersembunyi ? "" : `<button type="button" class="fr-taut" data-fr="lapor" data-jenis="${jenis}" data-id="${esc(x.id)}">${ikon("bendera", 14)}<span>${esc(t("fr.lapor"))}</span></button>`}${admin
    ? `<button type="button" class="fr-taut" data-fr="sembunyi" data-jenis="${jenis}" data-id="${esc(x.id)}" data-ke="${x.tersembunyi ? 0 : 1}">${ikon(x.tersembunyi ? "centang" : "blokir", 14)}<span>${esc(t(x.tersembunyi ? "fr.pulihkan" : "fr.sembunyikan"))}</span></button>` : ""}</span>`;

  function utasHtml(u) {
    const balasan = u.balasan.length
      ? `<ol class="fr-balasan">${u.balasan.map((b) => `<li${b.tersembunyi ? ' class="fr-redup"' : ""}><p class="fr-meta"><b>${esc(b.nama)}</b><span>${esc(tgl(b.dibuat))}</span>${pilSembunyi(b)}${modHtml("balasan", b)}</p><p class="fr-isi">${esc(b.isi)}</p>${b.tersembunyi && b.alasan ? `<p class="fr-ket">${esc(t("fr.alasan", { a: b.alasan }))}</p>` : ""}</li>`).join("")}</ol>`
      : `<p class="fr-ket">${esc(t("fr.balasan_kosong"))}</p>`;
    return `<div class="fr-utas${u.tersembunyi ? " fr-redup" : ""}"><p class="fr-isi">${esc(u.isi)}</p>${u.tersembunyi && u.alasan ? `<p class="fr-ket">${esc(t("fr.alasan", { a: u.alasan }))}</p>` : ""}<p class="fr-meta">${modHtml("utas", u)}</p>
      <h4>${esc(t("fr.balasan", { n: angka(u.balasan.length) }))}</h4>${balasan}
      ${u.tersembunyi ? "" : `<div class="fr-form"><label><span>${esc(t("fr.f.balas"))}</span><textarea id="frBalas" rows="3" maxlength="2000"></textarea></label><div class="fr-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-fr="balas">${ikon("surel", 16)}<span>${esc(t("fr.kirim_balas"))}</span></button></div>${pesanEl}</div>`}</div>`;
  }
  const barisHtml = (u) => `<li class="fr-baris"><button type="button" class="fr-judul" data-fr="buka" data-id="${esc(u.id)}" aria-expanded="${S.buka === u.id}"><span class="fr-j"><b>${esc(u.judul)}</b>${pilSembunyi(u)}</span>
    <span class="fr-meta"><span>${esc(u.nama)}</span><span>${esc(tgl(u.dibuat))}</span><span>${ikon("teks", 14)}${esc(t("fr.n_balasan", { n: angka(u.balasan) }))}</span></span></button>
    <div class="fr-rinci" id="frRinci-${esc(u.id)}"${S.buka === u.id ? "" : " hidden"}>${S.buka === u.id && S.utas ? utasHtml(S.utas) : ""}</div></li>`;

  function daftarHtml() {
    const d = S.d;
    if (!d) return hantuHtml(3);
    return (d.baris.length ? `<ul class="fr-daftar">${d.baris.map(barisHtml).join("")}</ul>` : kosongHtml("fr.kosong")) + `<div id="frHal">${paginasiHtml({ hal: S.hal, total: d.total, per: d.per, satuan: "fr.pag" })}</div>`;
  }
  function kerangka() {
    el.innerHTML = exHtml({ id: "forum", ikon: "teks", topik: t("fr.ey"), judulHtml: esc(t("fr.j", { bidang: nama })), subHtml: esc(t("fr.sub")),
      isiHtml: `<p class="fr-catatan">${ikon("info", 16)}<span>${esc(t("fr.moderasi"))}</span></p>
      <div class="fr-atas"><button type="button" class="jm-tbl jm-tbl-utama" data-fr="baru" aria-expanded="false">${ikon("tambah", 16)}<span>${esc(t("fr.baru"))}</span></button></div>
      <div class="fr-form" id="frBaru" hidden><label><span>${esc(t("fr.f.judul"))}</span><input id="frJudul" type="text" maxlength="160" autocomplete="off"></label>
        <label><span>${esc(t("fr.f.isi"))}</span><textarea id="frIsi" rows="5" maxlength="4000"></textarea></label><p class="fr-ket">${esc(t("fr.f.ket"))}</p>
        <div class="fr-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-fr="kirim">${ikon("surel", 16)}<span>${esc(t("fr.kirim"))}</span></button><button type="button" class="jm-tbl" data-fr="baru">${esc(t("fr.batal"))}</button></div>${pesanEl}</div>
      ${admin ? '<div id="frLaporan"></div>' : ""}<div id="frDaftar">${daftarHtml()}</div>` });
  }
  async function muat() {
    try { S.d = await api(`/api/forum?bidang=${encodeURIComponent(bidang)}&hal=${S.hal}`); } catch (x) { S.d = null; $("#frDaftar").innerHTML = `<p class="fr-pesan" role="alert">${esc(galat(x))}</p>`; return; }
    if (S.buka != null) { try { S.utas = await api(`/api/forum/utas/${S.buka}`); } catch { S.buka = null; S.utas = null; } }
    $("#frDaftar").innerHTML = daftarHtml();
    if (admin) muatLaporan();
  }
  async function muatLaporan() {
    const w = $("#frLaporan"); if (!w) return;
    let d; try { d = await api(`/api/admin/forum/laporan?hal=${S.lapHal || 1}`); } catch { w.innerHTML = ""; return; }
    const r = d.baris;
    if (!r.length && (S.lapHal || 1) > 1) { S.lapHal = 1; return muatLaporan(); } // halaman terakhir habis sesudah menyembunyikan
    w.innerHTML = r.length ? `<div class="fr-laporan"><h4>${ikon("bendera", 16)}<span>${esc(t("fr.laporan", { n: angka(d.total) }))}</span></h4><ul>${r.map((x) => `<li><span><b>${esc(t("fr.lap." + x.jenis))}</b> ${esc(t("fr.lap.n", { n: angka(x.n) }))}: ${esc(x.alasan)}<small>${esc(x.cuplikan || "")}</small></span>
      <button type="button" class="jm-tbl" data-fr="sembunyi" data-jenis="${esc(x.jenis)}" data-id="${esc(x.id)}" data-ke="1">${ikon("blokir", 16)}<span>${esc(t("fr.sembunyikan"))}</span></button></li>`).join("")}</ul><div id="frLapHal">${paginasiHtml({ hal: S.lapHal || 1, total: d.total, per: d.per })}</div></div>` : "";
  }

  el.addEventListener("click", async (e) => {
    const lh = e.target.closest("#frLapHal [data-hal]");
    if (lh && !lh.disabled) { const n = +lh.dataset.hal; sorotHalaman(lh, n); return void nanti(() => { S.lapHal = n; muatLaporan(); }); }
    const hal = e.target.closest("#frHal [data-hal]");
    if (hal && !hal.disabled) { const n = +hal.dataset.hal; sorotHalaman(hal, n); return void nanti(() => { S.hal = n; S.buka = null; S.utas = null; muat(); }); }
    const b = e.target.closest("[data-fr]"); if (!b) return;
    const aksi = b.dataset.fr;
    if (aksi === "baru") { const f = $("#frBaru"), buka = f.hidden; f.hidden = !buka; el.querySelector('.fr-atas [data-fr="baru"]').setAttribute("aria-expanded", String(buka)); if (buka) $("#frJudul").focus(); return; }
    if (aksi === "buka") {
      const id = Number(b.dataset.id), sama = S.buka === id;
      b.setAttribute("aria-expanded", String(!sama)); // chrome dulu
      const r = el.querySelector("#frRinci-" + id);
      if (sama) { S.buka = null; S.utas = null; r.hidden = true; return; }
      for (const x of el.querySelectorAll(".fr-rinci")) x.hidden = true;
      for (const x of el.querySelectorAll('[data-fr="buka"]')) if (x !== b) x.setAttribute("aria-expanded", "false");
      S.buka = id; r.hidden = false; r.innerHTML = hantuHtml(2);
      try { S.utas = await api(`/api/forum/utas/${id}`); r.innerHTML = utasHtml(S.utas); } catch (x) { r.innerHTML = `<p class="fr-pesan" role="alert">${esc(galat(x))}</p>`; }
      return;
    }
    if (aksi === "kirim") {
      const f = $("#frBaru"); b.disabled = true;
      try { await api("/api/forum", { metode: "POST", badan: { bidang, judul: $("#frJudul").value.trim(), isi: $("#frIsi").value.trim() } }); S.hal = 1; S.buka = null; kerangka(); await muat(); }
      catch (x) { b.disabled = false; tulisGalat(f, x); }
      return;
    }
    if (aksi === "balas") {
      const f = b.closest(".fr-form"); b.disabled = true;
      try { await api(`/api/forum/utas/${S.buka}/balasan`, { metode: "POST", badan: { isi: $("#frBalas").value.trim() } }); await muat(); }
      catch (x) { b.disabled = false; tulisGalat(f, x); }
      return;
    }
    if (aksi === "lapor") {
      const alasan = prompt(t("fr.lapor_tanya")); if (alasan == null) return;
      try { await api("/api/forum/lapor", { metode: "POST", badan: { jenis: b.dataset.jenis, id: Number(b.dataset.id), alasan: alasan.trim() } }); b.disabled = true; b.querySelector("span").textContent = t("fr.dilaporkan"); }
      catch (x) { alert(galat(x)); }
      return;
    }
    if (aksi === "sembunyi") {
      const sembunyi = b.dataset.ke === "1", alasan = sembunyi ? prompt(t("fr.sembunyi_tanya")) : null;
      if (sembunyi && alasan == null) return;
      try { await api("/api/admin/forum/sembunyi", { metode: "POST", badan: sembunyi ? { jenis: b.dataset.jenis, id: Number(b.dataset.id), sembunyi, alasan: alasan.trim() } : { jenis: b.dataset.jenis, id: Number(b.dataset.id), sembunyi } }); await muat(); }
      catch (x) { alert(galat(x)); }
    }
  });
  kerangka(); muat();
}
