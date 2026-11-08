/* /admin: pembantu bersama tab konten (METI dalam berita, Dokumen Pustaka): dialog hapus dan unggah berkas dengan progres. */
import { t } from "/i18n.js";
import { esc, galatTeks, GalatApi } from "/inti/umum.js";

/** Dialog bawaan #dlg (bukan confirm()). Penutup "batal" dipasang admin.js. */
export function konfirmasiHapus({ judul, isi, ya }) {
  const dlg = document.getElementById("dlg");
  dlg.innerHTML = `<div class="jm-form"><h2 id="dlgJudul">${esc(judul)}</h2><p>${esc(isi)}</p>
    <div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-bahaya" data-ya="1">${esc(t("adm.agenda.hapus"))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></div>`;
  const tangan = (e) => { if (!e.target.closest("[data-ya]")) return; dlg.removeEventListener("click", tangan); dlg.close(); ya(); };
  dlg.addEventListener("click", tangan);
  dlg.addEventListener("close", () => dlg.removeEventListener("click", tangan), { once: true });
  if (!dlg.open) dlg.showModal();
}

/** Kirim badan mentah dengan progres 0..100 (XMLHttpRequest; fetch tidak punya progres unggah). Galat = GalatApi(kode, status). */
export function kirimBerkas({ metode = "POST", url, tipe, badan, onProgres }) {
  return new Promise((ok, gagal) => {
    const x = new XMLHttpRequest();
    x.open(metode, url);
    x.withCredentials = true;
    x.setRequestHeader("x-pb", "1");
    x.setRequestHeader("content-type", tipe);
    if (onProgres && x.upload) x.upload.onprogress = (e) => { if (e.lengthComputable) onProgres(Math.round((e.loaded / e.total) * 100)); };
    x.onerror = () => gagal(new GalatApi("jaringan", 0));
    x.onload = () => {
      let d = null;
      try { d = JSON.parse(x.responseText); } catch (e) { /* tubuh kosong */ }
      if (x.status >= 200 && x.status < 300) ok(d);
      else gagal(new GalatApi(d && typeof d.kode === "string" && /^[a-z][a-z0-9_-]{1,40}$/.test(d.kode) ? d.kode : "umum", x.status));
    };
    x.send(badan);
  });
}

/** 413, 415, 422 punya kalimat sendiri per tab (awalan kunci); selebihnya kamus galat umum. */
export const galatBerkas = (e, awalan) => (e.status === 413 || e.status === 415 || e.status === 422 ? t(`${awalan}.g${e.status}`) : galatTeks(e.kode || "umum"));
