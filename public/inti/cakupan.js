/* Angka proyek TUNGGAL + penjelasan cakupan kapasitas per teknologi (JM-S05). Sumber: /data/proyek_rekon.json.
   Kapasitas "terlacak" = baris beroperasi di daftar proyek; "nasional" = statistik terpasang. Selisih bukan galat. */
import { t, angka, tanggal } from "/i18n.js";
import { esc } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { buktiHtml } from "/inti/bukti.js";
const ADA = { status_tidak_diketahui: 1, operasi_tanpa_mw: 1, tanpa_cod: 1, tanpa_teknologi: 1, ragu: 1 };

let janji;
export const muatRekon = () => (janji ??= fetch("/data/proyek_rekon.json").then((r) => (r.ok ? r.json() : null)).catch(() => null));
/** Angka proyek terlacak (607) atau null bila rekon gagal dimuat; pemanggil jatuh ke hitungan lokal. */
export const jumlahProyek = async () => (await muatRekon())?.angka_proyek?.terlacak ?? null;

export function cakupanHtml(r, { id = "cakupanEx" } = {}) {
  const K = Object.entries(r?.kapasitas || {});
  if (!K.length) return "";
  const p = K.map(([, v]) => v.cakupan_persen), lo = Math.min(...p), hi = Math.max(...p);
  const tgl = tanggal(r.dibangun_pada), tglNas = tanggal(r.meta?.tanggal_nasional);
  const est = buktiHtml("est", { sumber: t("cak.sumber.est"), tanggal: r.meta?.tanggal_nasional || "", cara: t("cak.cara.isi") });
  const baris = K.map(([k, v]) => `<tr><td>${esc(t("pj.tek." + k))}</td><td class="jm-num">${angka(v.nasional_mw)}</td><td class="jm-num">${angka(v.terlacak_mw)}</td><td class="jm-num">${angka(Math.min(100, v.cakupan_persen), { desimal: 1 })}%${v.melebihi ? " (!)" : ""}</td><td class="jm-num">${angka(Math.max(0, 100 - v.cakupan_persen), { desimal: 1 })}%</td></tr>`).join("");
  const kartu = (r.sebab_selisih || []).filter((s) => s.n > 0 && ADA[s.kode]).map((s) => `<li><b>${angka(s.n)}</b><span>${esc(t("cak.sebab." + s.kode))}</span></li>`).join("");
  const isi = `<p class="jm-cak-jawab"><b>${esc(t("cak.jawaban"))}.</b> ${esc(t("cak.jawaban.isi", { lo: angka(lo), hi: angka(hi), n: angka(r.angka_proyek.terlacak) }))} ${est}</p>
    <div class="jm-tbl-bungkus"><table class="jm-tabel"><thead><tr><th>${esc(t("cak.k.tek"))}</th><th>${esc(t("cak.k.nas"))}</th><th>${esc(t("cak.k.terlacak"))}</th><th>${esc(t("cak.k.cakupan"))} ${est}</th><th>${esc(t("cak.k.sisa"))} ${est}</th></tr></thead><tbody>${baris}</tbody></table></div>
    <p class="jm-cak-sum"><span>${esc(t("cak.sumber.nas", { tanggal: tglNas }))}</span><span>${esc(t("cak.sumber.daftar", { tanggal: tgl }))}</span></p>
    <details class="jm-cak-hit" open><summary>${esc(t("cak.cara"))}</summary><p class="jm-cak-ket">${esc(t("cak.cara.isi"))}</p><p class="jm-cak-ket"><b>${esc(t("cak.sebab.judul"))}</b></p><ul class="jm-kisi jm-cak-kartu">${kartu}</ul><p class="jm-bantu">${esc(t("cak.batas"))}</p></details>`;
  return exHtml({ id, ikon: "analisis", topik: t("cak.ey"), judulHtml: `${esc(t("cak.j", { lo: angka(lo), hi: angka(hi) }))} ${est}`, subHtml: esc(t("cak.s")), isiHtml: isi });
}
