/* /dokumen-data: indeks /data/dokumen_data.json lalu satu dokumen /data/dokumen/<id>.json (scripts/pipa/ekstrak_pdf.mjs).
   Tabel diurutkan dan dipaginasi pada data penuh; angka menaut ke #page=N di PDF sumber bila URL-nya berkas PDF. Teks layar dari kamus. */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml } from "/inti/umum.js";
import { cariHtml } from "/inti/komponen.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { muatData, tampilGalat, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const PER = 25;
const S = { idx: null, dok: null, tab: 0, hal: 1, uk: null, ua: 1, q: "" };

const adaPdf = (u) => /^https:\/\/\S+\.pdf(\?\S*)?$/i.test(u || "");
const tautHal = (u, h) => (adaPdf(u) ? `${u.split("#")[0]}#page=${h}` : "");
const tglDok = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? tanggal(s) : s);
const nilaiTeks = (c, v) => (v == null ? "-" : c.tipe === "angka" ? angka(v, { desimal: Number.isInteger(v) ? 0 : v < 100 ? 2 : 1 }) : String(v));

function kolomUrut(tab) { return S.uk && tab.kolom.find((c) => c.k === S.uk); }
function barisSaring(tab) {
  const q = S.q.trim().toLocaleLowerCase();
  let b = tab.baris.filter((r) => !q || tab.kolom.some((c) => String(r[c.k] ?? "").toLocaleLowerCase().includes(q)));
  const c = kolomUrut(tab);
  if (c) b = [...b].sort((a, z) => { const x = a[c.k], y = z[c.k]; return ((x == null) - (y == null)) || (c.tipe === "angka" ? (x - y) * S.ua : String(x).localeCompare(String(y), "id") * S.ua); });
  return b;
}

function sel(d, tab, c, r) {
  const url = tautHal(r.sumber_url || d.sumber_url, r.halaman), v = nilaiTeks(c, r[c.k]);
  const isi = c.tipe === "angka" && url && r[c.k] != null ? `<a class="dd-angka" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("dd.ke_hlm", { n: r.halaman }))}">${esc(v)}</a>` : esc(v);
  const kosong = r[c.k] == null ? ` title="${esc(t("dd.kosong"))}"` : "";
  return `<td data-label="${esc(c.label)}"${c.tipe === "angka" ? ' class="dd-n"' : ""}${kosong}>${isi}</td>`;
}

function gambarTabel() {
  const d = S.dok, tab = d.tabel[S.tab], semua = barisSaring(tab), total = semua.length;
  const per = Math.min(Math.max(1, Math.ceil(total / PER)), S.hal);
  const potong = semua.slice((per - 1) * PER, per * PER);
  const kepala = tab.kolom.map((c) => `<th scope="col" aria-sort="${S.uk === c.k ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${esc(c.k)}">${esc(c.label)}</button></th>`).join("") + `<th scope="col">${esc(t("dd.hlm"))}</th>`;
  const badan = potong.map((r) => {
    const url = tautHal(r.sumber_url || d.sumber_url, r.halaman);
    const hlm = url ? `<a class="dd-hlm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${ikon("pdf", 14)}<span>${esc(t("dd.hlm_n", { n: r.halaman }))}</span></a>` : `<span class="dd-hlm">${esc(t("dd.hlm_n", { n: r.halaman }))}</span>`;
    const tinjau = r.perlu_tinjau ? ` <span class="jm-pil jm-pil-warn" title="${esc(t("dd.tinjau_tip"))}">${esc(t("dd.tinjau"))}</span>` : "";
    return `<tr>${tab.kolom.map((c) => sel(d, tab, c, r)).join("")}<td data-label="${esc(t("dd.hlm"))}">${hlm}${tinjau}</td></tr>`;
  }).join("");
  $("ddTabel").innerHTML = `${tab.catatan ? `<p class="dd-cat">${esc(tab.catatan)} ${esc(t("dd.satuan", { s: tab.satuan }))}</p>` : ""}<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${kepala}</tr></thead><tbody>${badan || `<tr><td colspan="${tab.kolom.length + 1}">${esc(t("dd.tak_ada"))}</td></tr>`}</tbody></table></div>${paginasiHtml({ hal: per, total, per: PER, satuan: "dd.u.baris" })}`;
}

function gambarDok() {
  const d = S.dok;
  $("ddDok").innerHTML = `<p class="dd-meta"><span>${ikon("direktori", 14)}${esc(d.penerbit)}</span><span>${ikon("tahun", 14)}${esc(t("dd.tgl_dok", { t: tglDok(d.tanggal_dokumen) }))}</span><span>${ikon("tabel", 14)}${esc(d.versi)}</span><span>${ikon("info", 14)}${esc(t("dd.metode." + d.metode))}</span><span>${ikon("pdf", 14)}<a href="${esc(d.sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(t("dd.sumber"))}</a></span></p>${d.catatan ? `<p class="dd-cat">${esc(d.catatan)}</p>` : ""}
  <div class="dd-tab" role="group" aria-label="${esc(t("dd.tabel"))}">${d.tabel.map((x, i) => `<button type="button" data-tab="${i}" aria-pressed="${i === S.tab}">${esc(x.judul)} (${esc(angka(x.jumlah_baris))})</button>`).join("")}</div>
  <div class="dd-alat">${cariHtml({ id: "ddCari", label: t("dd.cari"), placeholder: t("dd.cari") })}</div><div id="ddTabel"></div>`;
  $("ddCari").value = S.q;
  gambarTabel();
}

async function pilihDok(id) {
  S.tab = 0; S.hal = 1; S.uk = null; S.q = "";
  $("ddDok").innerHTML = hantuHtml(4);
  try { S.dok = await muatData(`dokumen/${id}.json`); } catch (e) { return tampilGalat($("ddDok"), () => pilihDok(id)); }
  document.querySelectorAll(".dd-dok button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
  gambarDok();
}

async function mulai() {
  await mulaiHalaman();
  const isi = $("isi");
  isi.innerHTML = hantuHtml(4);
  try { S.idx = await muatData("dokumen_data.json"); } catch (e) { return tampilGalat(isi, mulai); }
  const x = S.idx, tinjau = x.dokumen.reduce((n, d) => n + d.tabel.reduce((m, tb) => m + tb.perlu_tinjau, 0), 0);
  khUbin("ubin", [{ ikon: "pdf", nilai: angka(x.jumlah_dokumen), label: t("dd.u.dokumen") }, { ikon: "tabel", nilai: angka(x.jumlah_tabel), label: t("dd.u.tabel") }, { ikon: "daftar", nilai: angka(x.jumlah_baris), label: t("dd.u.baris") }, { ikon: "peringatan", nilai: angka(tinjau), label: t("dd.u.tinjau") }]);
  isi.innerHTML = `<div class="dd-dok">${x.dokumen.map((d) => `<button type="button" data-id="${esc(d.id)}" aria-pressed="false"><b>${ikon("pdf", 18)}<span>${esc(d.judul)}</span></b><small>${esc(d.penerbit)}, ${esc(tglDok(d.tanggal_dokumen))}</small><small>${esc(t("dd.ringkas", { t: angka(d.tabel.length), b: angka(d.tabel.reduce((n, tb) => n + tb.jumlah_baris, 0)) }))}</small></button>`).join("")}</div><div id="ddDok"></div>`;
  isi.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.id) pilihDok(b.dataset.id);
    else if (b.dataset.tab != null) { S.tab = +b.dataset.tab; S.hal = 1; S.uk = null; S.q = ""; gambarDok(); }
    else if (b.dataset.uk) { S.ua = S.uk === b.dataset.uk ? -S.ua : 1; S.uk = b.dataset.uk; S.hal = 1; gambarTabel(); }
    else if (b.dataset.hal) { S.hal = +b.dataset.hal; gambarTabel(); }
  });
  isi.addEventListener("input", (e) => { if (e.target.id === "ddCari") { S.q = e.target.value; S.hal = 1; gambarTabel(); } });
  const awal = decodeURIComponent(location.hash.slice(1));
  pilihDok(x.dokumen.some((d) => d.id === awal) ? awal : x.dokumen[0].id);
}
saatBahasa(() => { if (S.dok) gambarDok(); });
mulai();
