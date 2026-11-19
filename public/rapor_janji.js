/* rapor_janji.js (F65-113): kartu skor target resmi bertanggal dibanding realisasi terbaru, di tab Rapor /target.
   Sumber tunggal: target_realisasi.json (dirakit scripts/pipa/target_realisasi.mjs). Tidak ada janji yang ditulis di sini; status dipakai apa adanya dari pipa (EST).
   Baris tanpa realisasi sebanding tetap tampil dengan "-" dan status "Tidak ada data". */
import { t, bahasaData, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { num, muatData, amanUrl } from "/analisis.js";
import { nt, pilSt } from "/target_format.js";
import { selisihTarget, ringkasJanji } from "/inti/rasio_rumus.js";

const L = (o) => (o && (o[bahasaData()] ?? o.id)) ?? "";
const taut = (url, teks) => { const u = amanUrl(url); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : esc(teks); };
/* waktu realisasi: tanggal penuh bila ada, selain itu tahun (pecahan tahun di data tidak pernah ditampilkan mentah) */
const kapan = (r) => (/^\d{4}-\d{2}-\d{2}$/.test(r.tanggal || "") ? tanggal(r.tanggal) : r.tanggal || String(Math.floor(r.t)));
const tenggat = (d) => String(d.tahunTampil ?? Math.floor(d.tahun));

function selisihTeks(d) {
  /* status "tidak-ada-data" dari pipa berarti realisasi tidak sebanding dengan target (ukuran atau arah beda, mis. batas emisi): selisih tidak ditulis supaya tidak menyesatkan */
  const s = d.status === "tidak-ada-data" ? null : selisihTarget(d.nilai, d.terbaru?.v, d.arah);
  if (s === null) return "-";
  if (s <= 0) return t(s < 0 ? "rp.janji.lewat" : "rp.janji.capai");
  return d.satuan === "persen" ? `${num(s, 1)} ${t("tg2.sat.poin")}` : nt(d.satuan, s);
}

function baris(d) {
  const lbl = (k) => esc(t("rp.janji.c." + k)), r = d.terbaru;
  const real = r ? `<b>${esc(nt(d.satuan, r.v))}</b><small>${esc(kapan(r))}${d.sumberRealisasi?.judul ? ", " + taut(d.sumberRealisasi.url, d.sumberRealisasi.judul) : ""}</small>` : "-";
  return `<tr><td data-label="${lbl("target")}"><b>${esc(L(d.nama))}</b><small>${taut(d.url, d.dokumen)}${d.pasal ? ", " + esc(d.pasal) : ""}</small></td>
    <td data-label="${lbl("tenggat")}" class="jm-tengah">${esc(tenggat(d))}</td>
    <td data-label="${lbl("angka")}" class="jm-num">${esc(nt(d.satuan, d.nilai) + (d.maks ? " - " + nt(d.satuan, d.maks) : ""))}</td>
    <td data-label="${lbl("real")}">${real}</td>
    <td data-label="${lbl("selisih")}" class="jm-num">${esc(selisihTeks(d))}</td>
    <td data-label="${lbl("status")}" class="jm-tengah">${pilSt(d.status)}</td></tr>`;
}

/** Isi wadah dengan kartu skor; gagal muat = wadah dikosongkan (rapor tetap utuh). */
export async function pasangJanji(el) {
  if (!el) return;
  let o;
  try { o = await muatData("target_realisasi.json"); } catch (e) { el.replaceChildren(); return; }
  const a = o.target, r = ringkasJanji(a), th = (k, kelas = "") => `<th scope="col"${kelas ? ` class="${kelas}"` : ""}>${esc(t("rp.janji.c." + k))}</th>`;
  el.innerHTML = `<section class="rp-bag" id="rpJanjiK" aria-labelledby="rpJanjiJ"><h2 class="rp-h2" id="rpJanjiJ">${ikon("bendera", 20)}<span>${esc(t("rp.janji.j", { baik: num(r.baik), berdata: num(r.berdata), total: num(r.total) }))}</span></h2>
    <p class="jm-bantu">${esc(t("rp.janji.sub", { tertinggal: num(r.tertinggal), tanpa: num(r.tanpaData) }))} <a href="/target">${esc(t("rp.janji.buka"))}</a></p>
    <div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${th("target")}${th("tenggat")}${th("angka")}${th("real")}${th("selisih")}${th("status")}</tr></thead><tbody>${a.map(baris).join("")}</tbody></table></div>
    <p class="jm-bantu">${esc(o.metode)}</p></section>`;
}
