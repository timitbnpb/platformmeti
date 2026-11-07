/* /admin Anggota METI: formulir tambah/ubah (modal tengah). Aturan sama dengan periksaAnggota() di src/direktori.js; server tetap menghakimi. */
import { t, ada } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

export const TH_FORM = ["2022", "2023", "2024", "2025"];
const MAKS = { nama: 200, instansi: 200, jabatan: 200, provinsi: 100, surel: 120, telepon: 25, situs: 200, catatan: 500 };
const lab = (awalan, v) => (ada(awalan + v) ? t(awalan + v) : v);

const medan = (id, kunci, isi, galat, lebar) => `<div class="jm-medan${lebar ? " jm-lebar" : ""}"><label for="f_${id}">${esc(t(kunci))}</label>${isi}<small class="jm-adm-gl" id="g_${id}" role="alert">${esc(galat || "")}</small></div>`;
const teks = (id, v, tipe = "text") => `<input class="jm-isian" id="f_${id}" name="${id}" type="${tipe}" maxlength="${MAKS[id]}" autocomplete="off" value="${esc(v || "")}">`;

// r = baris yang disunting (atau null untuk tambah); bayar = fungsi layar untuk status iuran
export function formHtml(r, { jenis, status, bayar }) {
  const v = r || {}, opsi = (daftar, awalan, cur) => daftar.map((x) => `<option value="${x}"${x === cur ? " selected" : ""}>${esc(lab(awalan, x))}</option>`).join("");
  return `<form id="mFormIsi" novalidate data-id="${esc(v.id || "")}">
    <header><h2 id="mFormJudul">${esc(t(r ? "adm.anggota.form.ubah" : "adm.anggota.form.tambah"))}</h2>
      <button type="button" class="jm-tbl jm-tbl-kecil" data-m="form-tutup" aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 18)}</button></header>
    <div class="jm-adm-form">
      ${medan("nama", "adm.anggota.k.nama", teks("nama", v.nama), "", true)}
      ${medan("jenis", "adm.anggota.f.jenis", `<select data-ikon="jenis" class="jm-pilih" id="f_jenis" name="jenis">${opsi(jenis, "adm.anggota.jenis.", v.jenis || jenis[0])}</select>`)}
      ${medan("status", "adm.anggota.f.status", `<select data-ikon="status" class="jm-pilih" id="f_status" name="status">${opsi(status, "adm.anggota.status.", v.status || "aktif")}</select>`)}
      ${medan("instansi", "adm.anggota.k.instansi", teks("instansi", v.instansi))}
      ${medan("jabatan", "adm.anggota.k.jabatan", teks("jabatan", v.jabatan))}
      ${medan("provinsi", "adm.anggota.k.provinsi", teks("provinsi", v.provinsi))}
      ${medan("surel", "adm.anggota.k.surel", teks("surel", v.surel, "email"))}
      ${medan("telepon", "adm.anggota.k.telepon", teks("telepon", v.telepon, "tel"))}
      ${medan("situs", "adm.anggota.k.situs", teks("situs", Array.isArray(v.situs) ? v.situs[0] : v.situs, "url"), "", true)}
      <fieldset class="jm-lebar jm-adm-iuran"><legend>${esc(t("adm.anggota.form.iuran"))}</legend>${TH_FORM.map((th) => `<label><input type="checkbox" name="iuran" value="${th}"${r && bayar(r, th) ? " checked" : ""}> ${th}</label>`).join("")}<small class="jm-adm-gl" id="g_iuran" role="alert"></small></fieldset>
      ${medan("catatan", "adm.anggota.k.catatan", `<textarea class="jm-isian" id="f_catatan" name="catatan" rows="2" maxlength="${MAKS.catatan}"></textarea>`, "", true)}
    </div>
    <small class="jm-adm-gl" id="g__" role="alert"></small>
    <div class="jm-aksi jm-lebar"><button type="submit" class="jm-tbl jm-tbl-utama" id="mFormKirim">${esc(t("jm.simpan"))}</button><button type="button" class="jm-tbl" data-m="form-tutup">${esc(t("jm.batal"))}</button></div>
  </form>`;
}

// Mengembalikan { badan, galat:{kolom:pesan} }
export function bacaForm(form) {
  const f = new FormData(form), a = (k) => String(f.get(k) ?? "").trim(), galat = {};
  const badan = { nama: a("nama"), jenis: a("jenis"), status: a("status"), instansi: a("instansi"), jabatan: a("jabatan"), provinsi: a("provinsi"), surel: a("surel"), telepon: a("telepon"), situs: a("situs"), catatan: a("catatan"),
    iuran: Object.fromEntries(TH_FORM.map((th) => [th, f.getAll("iuran").includes(th)])) };
  if (!badan.nama) galat.nama = t("adm.anggota.e.nama");
  for (const [k, m] of Object.entries(MAKS)) if (badan[k].length > m) galat[k] = t("adm.anggota.e.panjang", { n: m });
  if (badan.surel && !galat.surel && !/^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/.test(badan.surel)) galat.surel = t("adm.anggota.e.surel");
  if (badan.telepon && !galat.telepon && !/^[0-9+()\-\s.]{5,25}$/.test(badan.telepon)) galat.telepon = t("adm.anggota.e.telepon");
  if (badan.situs && !galat.situs) { let ok = false; try { ok = new URL(badan.situs).protocol === "https:"; } catch (e) { /* tak sah */ } if (!ok) galat.situs = t("adm.anggota.e.situs"); }
  return { badan, galat };
}

export function tampilGalat(form, galat) {
  form.querySelectorAll(".jm-adm-gl").forEach((el) => { el.textContent = ""; });
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  for (const [k, m] of Object.entries(galat)) {
    const g = form.querySelector("#g_" + k), i = form.querySelector("#f_" + k);
    if (g) g.textContent = m;
    if (i) i.setAttribute("aria-invalid", "true");
  }
  form.querySelector("[aria-invalid]")?.focus();
}
