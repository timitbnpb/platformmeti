/* /admin: tab Media sosial. Admin menempel URL kiriman LinkedIn METI (LinkedIn tidak membuka API feed tanpa persetujuan); tampil di /galeri#sosmed. */
import { t, tanggal } from "/i18n.js";
import { esc, api, ikon, pesanHtml, galatTeks, hantuHtml, kosongHtml, GalatApi } from "/inti/umum.js";

export function panelSosmed(el) {
  el.innerHTML = `<form id="soForm" class="jm-form" novalidate><div class="jm-medan"><label for="so_url">${esc(t("adm.so.url"))}</label><input class="jm-isian" id="so_url" name="url" type="url" required maxlength="400" placeholder="https://www.linkedin.com/posts/..."></div>
    <div class="jm-medan"><label for="so_judul">${esc(t("adm.so.judul"))}</label><input class="jm-isian" id="so_judul" name="judul" required maxlength="200"></div><div class="jm-medan"><label for="so_tanggal">${esc(t("adm.so.tgl"))}</label><input class="jm-isian" id="so_tanggal" name="tanggal" type="date" required></div>
    <button class="jm-tbl" type="submit">${ikon("tambah", 16)}<span>${esc(t("adm.so.tambah"))}</span></button></form><div id="soStatus" aria-live="polite"></div><div id="soDaftar"></div>`;
  const $ = (id) => el.querySelector("#" + id);
  const kabar = (j, teks) => { $("soStatus").innerHTML = teks ? pesanHtml(j, teks) : ""; };
  async function muat() {
    $("soDaftar").innerHTML = hantuHtml(2);
    try {
      const b = (await api("/api/sosmed/feed")).baris.filter((x) => x.platform === "linkedin");
      $("soDaftar").innerHTML = b.length ? `<ul class="jm-daftar">${b.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.judul)}</a> <small>${esc(tanggal(x.tanggal))}</small> <button type="button" class="jm-tbl jm-tbl-kecil" data-hapus="${esc(x.uid)}">${esc(t("adm.so.hapus"))}</button></li>`).join("")}</ul>` : kosongHtml("adm.so.kosong");
    } catch (e) { $("soDaftar").innerHTML = pesanHtml("galat", galatTeks(e instanceof GalatApi ? e.kode : "layanan")); }
  }
  el.addEventListener("submit", async (e) => {
    e.preventDefault(); kabar("", "");
    const f = Object.fromEntries(new FormData(e.target));
    try { await api("/api/admin/sosmed-linkedin", { metode: "POST", badan: f }); e.target.reset(); kabar("ok", t("adm.so.ok")); muat(); }
    catch (x) { kabar("galat", x instanceof GalatApi && x.status === 422 ? t("adm.so.salah") : galatTeks(x instanceof GalatApi ? x.kode : "layanan")); }
  });
  el.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-hapus]"); if (!b) return;
    try { await api("/api/admin/sosmed-linkedin-hapus", { metode: "POST", badan: { uid: b.dataset.hapus } }); muat(); } catch { kabar("galat", t("adm.so.gagal")); }
  });
  muat();
}
