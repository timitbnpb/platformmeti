/* /anggota/<akun_id>: profil anggota lain sesuai privasi pemiliknya (server hanya mengirim bagian yang boleh dilihat). */
import { t } from "/i18n.js";
import { api, esc, ikon, galatHtml, kosongHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { isiKepala, tampilHtml, namaProvinsi, pasangFoto } from "/profil_tampil.js";

await mulaiHalaman();
pasangFoto();
const panel = document.getElementById("pfPanel");
const id = location.pathname.match(/^\/anggota\/(\d+)$/)?.[1];

async function muat() {
  if (!id) { panel.innerHTML = kosongHtml("ag.tidak_ada"); return; }
  try {
    const [p, prov] = await Promise.all([api("/api/profil/" + id), namaProvinsi()]);
    isiKepala(p);
    const aksi = p.diri
      ? `<a class="jm-tbl jm-tbl-utama" href="/profil-saya">${ikon("ubah", 18)}<span>${esc(t("ag.ubah_saya"))}</span></a>`
      : `<button type="button" class="jm-tbl jm-tbl-utama" data-aksi="pesan">${ikon("surel", 18)}<span>${esc(t("ag.pesan"))}</span></button>`;
    const catatan = p.lengkap && !p.diri ? `<div class="jm-pesan jm-pesan-info" role="note">${ikon("info", 18)}<span>${esc(t("ag.catatan_admin"))}</span></div>` : "";
    panel.innerHTML = `<div class="pf-aksi">${aksi}</div>${catatan}<div class="pf-kisi">${tampilHtml(p, prov)}</div>`;
  } catch (e) {
    panel.innerHTML = e.status === 404 ? kosongHtml("ag.tidak_ada") : galatHtml(e.kode);
  }
}
panel.addEventListener("click", (e) => {
  const b = e.target.closest("[data-aksi]");
  if (!b) return;
  if (b.dataset.aksi === "ulang") muat();
  // Chat admin (widget): bila belum termuat atau fitur belum aktif, tombol tidak berefek apa pun.
  else if (b.dataset.aksi === "pesan") document.getElementById("psFab")?.click();
});
document.addEventListener("jm:bahasa", muat);
muat();
