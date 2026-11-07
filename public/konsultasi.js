/* Tab "Konsultasi" di /regulasi: RUU/RPP yang sedang dikonsultasikan, tahap, tenggat masukan, dan (nanti) posisi METI.
   Posisi METI butir 1-22 DISEMBUNYIKAN sampai pemilik setuju: ubah TAMPIL_POSISI ke true hanya atas persetujuan pemilik. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { sumberHtml } from "/inti/komponen.js";
import { muat, label, urlAman } from "/publik.js";

export const TAMPIL_POSISI = false;

const IK_JENIS = { ruu: "palu", rpp: "regulasi", rperpres: "perisai", rpermen: "gedung" };
const KELAS_TAHAP = { pembahasan: "jm-pil-warn", konsultasi: "jm-pil-warn", disahkan: "jm-pil-ok" };

function posisiHtml(r) {
  const p = r.posisi_meti;
  if (!p?.butir?.length) return "";
  const kepala = `<h4>${ikon("insight", 18)}<span>${esc(t("kons.posisi"))}</span><span class="jm-pil jm-pil-warn">${esc(t("kons.menunggu"))}</span></h4>`;
  if (!TAMPIL_POSISI) return `<div class="jm-ks-posisi">${kepala}<p>${esc(t("kons.posisi_tahan", { n: angka(p.butir.length) }))}</p></div>`;
  const baris = p.butir.map((b) => `<tr><td class="jm-num" data-label="${esc(t("kons.col.no"))}">${esc(angka(b.no))}</td><td data-label="${esc(t("kons.col.topik"))}"><b>${esc(b.topik)}</b></td><td data-label="${esc(t("kons.col.posisi"))}">${esc(b.posisi)}</td><td class="jm-nowrap" data-label="${esc(t("kons.col.pasal"))}">${esc(b.pasal || "-")}</td><td class="jm-tengah" data-label="${esc(t("kons.col.status"))}">${esc(b.status || "-")}</td></tr>`).join("");
  return `<div class="jm-ks-posisi">${kepala}<p class="jm-redup">${esc(p.sumber || "")}${p.tanggal ? " (" + esc(tanggal(p.tanggal)) + ")" : ""}</p>`
    + `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap" data-urut="tidak"><thead><tr>${["no", "topik", "posisi", "pasal", "status"].map((k) => `<th>${esc(t("kons.col." + k))}</th>`).join("")}</tr></thead><tbody>${baris}</tbody></table></div></div>`;
}

function kartu(r) {
  const tenggat = r.tenggat ? `<span class="jm-pil jm-pil-warn">${ikon("kalender", 14)}${esc(t("kons.tenggat"))}: ${esc(tanggal(r.tenggat))}</span>` : `<span class="jm-pil">${ikon("kalender", 14)}${esc(t("kons.tenggat_belum"))}</span>`;
  const src = urlAman(r.tautan) ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(r.tautan)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("kons.sumber"))}</span></a>` : "";
  return `<article class="jm-ks-k"><header><span class="jm-lm-jn">${ikon(IK_JENIS[r.jenis] || "regulasi", 14)}${esc(label("kons.jenis.", r.jenis))}</span><h3>${esc(r.judul)}</h3></header>
    <div class="jm-baris-meta"><span class="jm-pil ${KELAS_TAHAP[r.tahap] || ""}">${esc(label("kons.tahap.", r.tahap))}</span>${tenggat}<span class="jm-pil">${ikon("gedung", 14)}${esc(r.instansi || "-")}</span><span class="jm-pil">${ikon("tahun", 14)}${esc(tanggal(r.tanggal))}</span></div>
    ${r.catatan ? `<p class="jm-ks-cat">${esc(r.catatan)}</p>` : ""}${posisiHtml(r)}
    <footer>${src}<span class="jm-redup">${esc(t("kons.diperiksa", { tanggal: tanggal(r.tanggal_periksa) }))} ${sumberHtml(esc(t("kons.bukti", { bukti: label("kons.bukti.", r.tingkat_bukti) })))}</span></footer></article>`;
}

const akar = document.getElementById("panelKonsultasi");
async function gambar() {
  akar.innerHTML = hantuHtml(3);
  let d;
  try { d = await muat("konsultasi"); } catch { akar.innerHTML = galatHtml("layanan"); return; }
  const celah = (d.meta?.celah || []).map((c) => `<li>${esc(c)}</li>`).join("");
  akar.innerHTML = `<p class="jm-bantu">${esc(t("kons.lead"))}</p>` + (d.baris.length ? `<div class="jm-ks-daftar">${d.baris.map(kartu).join("")}</div>` : kosongHtml("kons.kosong"))
    + (celah ? `<div class="jm-td-cat"><b>${esc(t("td.celah"))}</b><ul>${celah}</ul></div>` : "");
}
akar.addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && gambar());
document.addEventListener("jm:bahasa", () => akar.isConnected && gambar());
await gambar();
