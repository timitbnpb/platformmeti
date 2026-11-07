/* /admin: tab Konsultasi. Daftar dokumen forum (draf, terbit, arsip) dengan unggah/sunting naskah. Hak ditegakkan di server (pengurus ke atas). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatHtml, ikon } from "/inti/umum.js";

export function panelKonsultasi(el) {
  const S = { baris: [] };
  el.innerHTML = `<div id="akHost"></div>`;
  const host = el.querySelector("#akHost");
  host.addEventListener("click", async (e) => {
    const k = e.target.closest("[data-kelola]");
    if (k) { const { bukaKelola } = await import("/konsultasi_kelola.js"); return bukaKelola(S.baris.find((r) => r.id === k.dataset.kelola) || null, { selesai: muat }); }
    if (e.target.closest("[data-aksi=ulang]")) muat();
  });
  muat();
  async function muat() {
    host.innerHTML = hantuHtml(4);
    try { S.baris = (await api("/api/konsultasi")).baris; } catch (e) { host.innerHTML = galatHtml(e.kode || "umum"); return; }
    nanti(gambar);
  }
  function gambar() {
    host.innerHTML = `<p class="jm-bantu">${esc(t("kf.ad.bantu"))}</p><div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-kelola="">${ikon("tambah", 16)}<span>${esc(t("kf.dokumen_baru"))}</span></button></div>`
      + (S.baris.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["dok", "jenis", "status", "bagian", "usulan", "tenggat", "aksi"].map((k) => `<th scope="col">${esc(t("kf.ad.k." + k))}</th>`).join("")}</tr></thead><tbody>${S.baris.map((r) => `<tr>
        <td data-l="${esc(t("kf.ad.k.dok"))}"><strong>${esc(r.judul)}</strong></td><td data-l="${esc(t("kf.ad.k.jenis"))}">${esc(t("kons.jenis." + r.jenis))}</td>
        <td data-l="${esc(t("kf.ad.k.status"))}"><span class="jm-pil ${r.status === "terbit" ? "jm-pil-ok" : "jm-pil-warn"}">${esc(t("kf.status_dok." + r.status))}</span></td>
        <td class="jm-num" data-l="${esc(t("kf.ad.k.bagian"))}">${esc(angka(r.n_bagian))}</td><td class="jm-num" data-l="${esc(t("kf.ad.k.usulan"))}">${esc(angka(r.n_usulan))}</td>
        <td class="jm-nowrap" data-l="${esc(t("kf.ad.k.tenggat"))}">${r.tenggat ? esc(tanggal(r.tenggat)) : "-"}</td>
        <td data-l="${esc(t("kf.ad.k.aksi"))}"><button type="button" class="jm-tbl jm-tbl-kecil" data-kelola="${esc(r.id)}">${ikon("ubah", 16)}<span>${esc(t("kf.kelola"))}</span></button></td></tr>`).join("")}</tbody></table></div>` : kosongHtml("kons.kosong"));
  }
}
