/* /admin: tab Unduhan (Pustaka). Server: GET /api/admin/pustaka/unduhan?hal=N (rekap per dokumen + daftar akun, tujuan, waktu). */
import { t, angka, tanggal, tanggalDariUnix, jam } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { data, kepalaTab, ubinKepala, keadaan, detik } from "/admin_umum.js";

const HAL = 50;
const tgl = (w) => { const d = detik(w); return Number.isFinite(d) ? `<span data-urut="${d}">${esc(tanggal(tanggalDariUnix(d)))}<small>${esc(jam(d))}</small></span>` : "-"; };

export function panelPustaka(panel) {
  const S = { hal: 1, ctl: null, judul: new Map() };
  panel.innerHTML = `${kepalaTab("unduh", "adm.pu.ey", "adm.pu.j", "adm.pu.d")}<div id="puIsi" aria-live="polite"></div><div class="jm-hal" id="puHal"></div>`;
  const isi = panel.querySelector("#puIsi"), hal = panel.querySelector("#puHal");
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.hal) { S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); muat(); }
    else if (b.dataset.aksi === "ulang") muat();
  });
  muat();

  async function judulDok() {
    if (S.judul.size) return;
    for (const nama of ["pustaka", "pustaka_ulasan"]) {
      try { const d = await data(nama); for (const x of d.baris || d.dokumen || []) S.judul.set(x.id, x.judul); } catch (e) { /* tanpa judul: tampil id */ }
    }
  }
  const dok = (id) => `<b>${esc(S.judul.get(id) || id)}</b>`;
  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    isi.innerHTML = hantuHtml(5);
    let d;
    try { [d] = await Promise.all([api(`/api/admin/pustaka/unduhan?hal=${S.hal}`, { signal: S.ctl.signal }), judulDok()]); } catch (e) { if (e.name !== "AbortError") isi.innerHTML = keadaan(e.kode || "umum"); return; }
    ubinKepala(panel, [{ ikon: "unduh", nilai: d.total, label: t("adm.pu.k.total") }, { ikon: "pdf", nilai: d.rekap.length, label: t("adm.pu.k.dok") }, { ikon: "orang", nilai: d.rekap.reduce((x, r) => x + (r.akun || 0), 0), label: t("adm.pu.k.akun") }]);
    nanti(() => {
      const rekap = d.rekap.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th scope="col">${esc(t("adm.pu.c.dok"))}</th><th scope="col">${esc(t("adm.pu.c.unduhan"))}</th><th scope="col">${esc(t("adm.pu.c.akun"))}</th><th scope="col">${esc(t("adm.pu.c.terakhir"))}</th></tr></thead><tbody>${
        d.rekap.map((r) => `<tr><td data-label="${esc(t("adm.pu.c.dok"))}">${dok(r.dokumen_id)}</td><td class="jm-num" data-label="${esc(t("adm.pu.c.unduhan"))}">${esc(angka(r.n))}</td><td class="jm-num" data-label="${esc(t("adm.pu.c.akun"))}">${esc(angka(r.akun))}</td><td data-label="${esc(t("adm.pu.c.terakhir"))}">${tgl(r.terakhir)}</td></tr>`).join("")}</tbody></table></div>` : kosongHtml("adm.pu.kosong");
      const daftar = d.daftar.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["c.waktu", "c.akun", "c.instansi", "c.telepon", "c.dok", "c.berkas", "c.tujuan", "c.via"].map((k) => `<th scope="col">${esc(t("adm.pu." + k))}</th>`).join("")}</tr></thead><tbody>${
        d.daftar.map((r) => `<tr><td data-label="${esc(t("adm.pu.c.waktu"))}">${tgl(r.waktu)}</td><td data-label="${esc(t("adm.pu.c.akun"))}">${r.nama ? `<b>${esc(r.nama)}</b><small>${esc(r.surel || "")}</small>` : `<span class="jm-redup">${esc(t("adm.pu.akun_hapus"))}</span>`}</td><td data-label="${esc(t("adm.pu.c.instansi"))}">${esc(r.instansi || "-")}</td><td data-label="${esc(t("adm.pu.c.telepon"))}">${esc(r.telepon || "-")}</td><td data-label="${esc(t("adm.pu.c.dok"))}">${dok(r.dokumen_id)}</td><td data-label="${esc(t("adm.pu.c.berkas"))}">${esc(r.berkas_id)}</td><td data-label="${esc(t("adm.pu.c.tujuan"))}"><span class="jm-pil">${esc(t("pu.tujuan." + r.tujuan))}</span></td><td data-label="${esc(t("adm.pu.c.via"))}">${esc(t("adm.pu.via." + r.via))}</td></tr>`).join("")}</tbody></table></div>` : kosongHtml("adm.pu.kosong");
      const ex = (judul, sub, isiHtml) => exHtml({ ikon: "tabel", topik: t("adm.pu.ey"), tingkat: "h3", judulHtml: esc(judul), subHtml: esc(sub), isiHtml });
      isi.innerHTML = ex(t("adm.pu.rekap", { n: angka(d.total) }), t("adm.pu.sub.rekap"), rekap) + ex(t("adm.pu.daftar"), t("adm.pu.sub.daftar"), daftar);
      hal.innerHTML = paginasiHtml({ hal: S.hal, total: d.total, per: HAL, satuan: "jm.pag.u.dokumen" });
    });
  }
}
