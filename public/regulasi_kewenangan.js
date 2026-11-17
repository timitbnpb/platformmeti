/* Tab "Kewenangan" di /regulasi (F65-110, dimuat malas): urusan energi per tingkat pemerintahan.
   Data: /data/kewenangan.json. Tiap butir disalin dari teks pasal di korpus hukum/ repo; sel tanpa teks pasal ditulis kosong dengan alasannya, tidak pernah diisi tebakan.
   Butir adalah teks peraturan (data luar): selalu lewat esc(), dan tetap berbahasa Indonesia di semua bahasa antarmuka. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { muat } from "/publik.js";

const TINGKAT = [["pusat", "bendera"], ["provinsi", "wilayah"], ["kabkota", "lokasi"]];
const teksButir = (b) => (typeof b === "string" ? b : b.teks);
const tautDok = (x) => `<a href="/regulasi?id=${encodeURIComponent(x.regulasi_id)}">${esc(x.teks)}</a> <a class="kw-baca" href="/regulasi#hd=${encodeURIComponent(x.dok)}">${ikon("buku", 14)}<span>${esc(t("kw.baca"))}</span></a>`;

function selHtml(u, k) {
  const x = u.tingkat[k], label = t("kw.t." + k);
  if (!x.butir.length) return `<td data-label="${esc(label)}"><p class="kw-kosong">${ikon("info", 16)}<span>${esc(t("kw.kosong." + x.kosong))}</span></p></td>`;
  const lingkup = (x.lingkup || []).length ? `<p class="kw-sub">${esc(t("kw.lingkup"))}</p><ul class="kw-l">${x.lingkup.map((s) => `<li>${esc(s)}</li>`).join("")}</ul><p class="kw-sub">${esc(t("kw.butir"))}</p>` : "";
  return `<td data-label="${esc(label)}"><p class="kw-ruj">${ikon("palu", 14)}<span>${esc(x.rujukan)}</span><span class="jm-pil">${esc(t("kw.n", { n: angka(x.butir.length) }))}</span></p>${lingkup}<ol class="kw-l">${x.butir.map((b) => `<li>${esc(teksButir(b))}</li>`).join("")}</ol></td>`;
}

function urusanHtml(u, d) {
  const n = TINGKAT.reduce((s, [k]) => s + u.tingkat[k].butir.length, 0);
  const dasar = u.dasar ? `<p class="kw-dasar">${ikon("regulasi", 16)}<span>${tautDok(u.dasar)}${u.diubah ? `, ${tautDok(u.diubah)}` : ""}</span></p>` : `<p class="kw-kosong">${ikon("info", 16)}<span>${esc(u.belum)}</span></p>`;
  const kepala = TINGKAT.map(([k, ik]) => `<th scope="col"><span class="kw-th">${ikon(ik, 16)}${esc(t("kw.t." + k))}</span></th>`).join("");
  return exHtml({ id: "kw-" + u.id, ikon: u.ikon, topik: t("kw.ey"), judulHtml: n ? hlHtml("kw.j", u.nama, { n: angka(n) }) : esc(t("kw.j.kosong", { nama: u.nama })), subHtml: esc(t(n ? "kw.sub" : "kw.sub.kosong")),
    aksiHtml: sumberHtml(esc(t("kw.sumber", { tanggal: tanggal(d.dibangun_pada) }))),
    isiHtml: dasar + (n ? `<div class="jm-gulir"><table class="jm-tabel kw-t" data-urut="tidak"><thead><tr>${kepala}</tr></thead><tbody><tr>${TINGKAT.map(([k]) => selHtml(u, k)).join("")}</tr></tbody></table></div>` : "") });
}

async function gambar() {
  const w = document.getElementById("panelKewenangan");
  w.innerHTML = hantuHtml(4);
  let d;
  try { d = await muat("kewenangan"); } catch (e) { w.innerHTML = galatHtml("layanan"); return; }
  const ada = d.urusan.filter((u) => u.dasar).length;
  w.innerHTML = `<p class="kw-cat">${ikon("info", 16)}<span>${esc(t("kw.catatan", { ada: angka(ada), total: angka(d.urusan.length) }))}</span></p>${d.urusan.map((u) => urusanHtml(u, d)).join("")}`;
  /* navigasi bawah (rel.js) membaca data-rel-label: tanpa ini keempat kartu bernama sama */
  for (const u of d.urusan) { const ex = document.getElementById("kw-" + u.id); if (ex) { ex.dataset.relLabel = u.nama; ex.dataset.relIkon = u.ikon; } }
}
document.addEventListener("jm:bahasa", () => { if (!document.getElementById("panelKewenangan").hidden) gambar(); });
gambar();
