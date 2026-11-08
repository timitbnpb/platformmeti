/* /pustaka: bagian "Dokumen resmi dari kegiatan METI" (GET /api/agenda/sumber-resmi). Tersembunyi bila kosong, belum masuk, atau galat. */
import { t, tanggal } from "/i18n.js";
import { esc, api, ikon } from "/inti/umum.js";

const IK = { pdf: "pdf", pptx: "presentasi", docx: "teks", xlsx: "tabel" };
const jenisBerkas = (d) => String(d.tipe || d.nama_berkas || "").toLowerCase().split(/[./]/).pop();

export async function pasangResmi() {
  const el = document.getElementById("puResmi"), isi = document.getElementById("puResmiIsi");
  if (!el || !isi) return;
  let daftar;
  try { daftar = await api("/api/agenda/sumber-resmi"); } catch (e) { return; }
  const l = Array.isArray(daftar) ? daftar : daftar?.dokumen;
  if (!Array.isArray(l) || !l.length) return;
  isi.innerHTML = l.map((d) => {
    const keg = d.kegiatan || {};
    return `<li class="pu-resmi-k">${ikon(IK[jenisBerkas(d)] || "pdf", 28)}<div class="pu-resmi-teks"><strong>${esc(d.nama_berkas)}</strong>
      ${d.keterangan ? `<span>${esc(d.keterangan)}</span>` : ""}
      <small>${esc(t("pu.resmi.penerbit", { nama: d.penerbit || "-" }))}${d.tanggal_terbit ? " | " + esc(t("pu.resmi.terbit", { tanggal: tanggal(d.tanggal_terbit) })) : ""}</small>
      ${keg.ref ? `<small>${esc(t("pu.resmi.kegiatan", { judul: "" }))}<a href="/kalender#acara-${encodeURIComponent(keg.ref)}">${esc(keg.judul || keg.ref)}</a></small>` : ""}</div>
      <a class="jm-tbl jm-tbl-kecil" href="/api/agenda/dokumen/${encodeURIComponent(d.id)}" download aria-label="${esc(t("pu.resmi.unduh", { nama: d.nama_berkas }))}">${ikon("unduh", 16)}<span>${esc(t("pu.unduh"))}</span></a></li>`;
  }).join("");
  el.hidden = false;
}
