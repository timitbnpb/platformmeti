/* Minta alamat surel @metiires.or.id (migrasi 0030, /api/surel*). Dipakai /saya (seksi) dan menu akun (butir).
   Kotak surel dibuat MANUAL oleh admin; di sini hanya pengajuan + status + petunjuk masuk umum. Tanpa sandi apa pun.
   bukaMintaSurel() membuka dialog; sesudah kirim memancarkan "jm:surel" supaya seksi /saya menyegarkan diri. */
import { t, tanggal, tanggalDariUnix } from "/i18n.js";
import { api, esc, ikon, debounce, galatTeks, pesanHtml } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";

export const DOMAIN = "metiires.or.id";
const PIL = { diajukan: "jm-pil-warn", disetujui: "jm-pil-warn", ditolak: "jm-pil-bad", dibuat: "jm-pil-ok" };
const aktif = (baris) => (baris || []).find((r) => r.status !== "ditolak") || null;
const pil = (s) => `<span class="jm-pil ${PIL[s] || ""}">${esc(t("sm.status." + s))}</span>`;
const tgl = (u) => (u ? esc(tanggal(tanggalDariUnix(u))) : "");

/** Ringkasan status satu pengajuan (terbaru) + petunjuk sesuai status. */
export function statusHtml(baris) {
  const r = (baris || [])[0];
  if (!r) return "";
  const alamat = r.alamat_final ? `${r.alamat_final}@${DOMAIN}` : `${r.nama_lokal}@${DOMAIN}`;
  return `<div class="sm-status"><p class="sm-alamat"><b>${esc(alamat)}</b> ${pil(r.status)}</p>
    <p class="jm-bantu">${esc(t("sm.petunjuk." + r.status))}${r.dibuat ? ` <span>${tgl(r.dibuat)}</span>` : ""}</p>
    ${r.catatan_admin ? `<p class="jm-bantu"><b>${esc(t("sm.catatan"))}:</b> ${esc(r.catatan_admin)}</p>` : ""}</div>`;
}

/** Seksi /saya. baris null = fitur belum aktif (tidak ditampilkan). */
export function seksiSurelHtml(baris) {
  if (!baris) return "";
  const r = (baris || [])[0], bisa = !aktif(baris);
  const isi = (r ? statusHtml(baris) : `<p class="jm-bantu">${esc(t("sm.kosong"))}</p>`)
    + (bisa ? `<div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-surel="buka">${ikon("surel", 16)}<span>${esc(t("sm.tbl.ajukan"))}</span></button></div>` : "");
  return exHtml({ id: "sySurel", ikon: "surel", topik: t("sm.topik"), judulHtml: esc(t("sm.judul", { domain: DOMAIN })), subHtml: esc(t("sm.sub")), isiHtml: isi });
}

const medan = (id, kunci, bantu = "", wajib = false, maks = 32) =>
  `<div class="jm-medan"><label for="${id}">${esc(t(kunci))}</label><input class="jm-isian" id="${id}" maxlength="${maks}" autocomplete="off" autocapitalize="none" spellcheck="false"${wajib ? " required" : ""}>${bantu}</div>`;

let dlg = null;
async function muatDialog() {
  const d = await api("/api/surel/saya");
  const baris = d.baris || [], bisa = !aktif(baris);
  dlg.innerHTML = `<form class="jm-form" id="smForm" novalidate><h2 id="smJudul">${esc(t("sm.judul", { domain: DOMAIN }))}</h2>
    ${statusHtml(baris)}
    ${bisa ? `<p class="jm-bantu">${esc(t("sm.sub"))}</p>
      <div class="jm-medan"><label for="smNama">${esc(t("sm.f.nama"))}</label><div class="sm-baris"><input class="jm-isian" id="smNama" maxlength="32" required autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="smCek"><span class="sm-domain">@${DOMAIN}</span></div>
        <p class="jm-bantu" id="smCek" aria-live="polite">${esc(t("sm.f.nama_bantu"))}</p></div>
      <div class="jm-form-grid">${medan("smAlt1", "sm.f.alt1")}${medan("smAlt2", "sm.f.alt2")}</div>
      <div class="jm-medan"><label for="smAlasan">${esc(t("sm.f.alasan"))}</label><textarea class="jm-isian" id="smAlasan" rows="3" maxlength="300" required></textarea></div>
      ${medan("smOrg", "sm.f.organisasi", "", true, 120)}` : ""}
    <div id="smPesan" aria-live="polite"></div>
    <div class="jm-aksi">${bisa ? `<button type="submit" class="jm-tbl jm-tbl-utama">${ikon("surel", 16)}<span>${esc(t("sm.kirim"))}</span></button>` : ""}<button type="button" class="jm-tbl" data-surel="tutup">${esc(t("jm.tutup"))}</button></div></form>`;
}

function pasang() {
  dlg = document.createElement("dialog");
  dlg.className = "jm-dlg"; dlg.setAttribute("aria-labelledby", "smJudul");
  document.body.append(dlg);
  const $ = (i) => dlg.querySelector("#" + i);
  const cek = debounce(async () => {
    const n = $("smNama")?.value.trim().toLowerCase(), el = $("smCek");
    if (!n || !el) return;
    try { const r = (await api("/api/surel/cek?nama=" + encodeURIComponent(n))).hasil; if ($("smNama")?.value.trim().toLowerCase() === n) el.textContent = t("sm.cek." + r); } catch { /* cek bersifat saran; server tetap memutus */ }
  });
  dlg.addEventListener("input", (e) => { if (e.target.id === "smNama") cek(); });
  dlg.addEventListener("click", (e) => { if (e.target.closest("[data-surel=tutup]")) dlg.close(); });
  dlg.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tbl = dlg.querySelector("button[type=submit]"), v = (i) => $(i).value.trim();
    if (!v("smNama") || !v("smAlasan") || !v("smOrg")) { $("smPesan").innerHTML = pesanHtml("galat", t("sm.lengkapi")); return; }
    tbl.disabled = true;
    try {
      await api("/api/surel", { metode: "POST", badan: { nama: v("smNama"), alt1: v("smAlt1") || undefined, alt2: v("smAlt2") || undefined, alasan: v("smAlasan"), organisasi: v("smOrg") } });
      document.dispatchEvent(new CustomEvent("jm:surel"));
      await muatDialog(); $("smPesan").innerHTML = pesanHtml("ok", t("sm.terkirim"));
    } catch (er) {
      tbl.disabled = false;
      $("smPesan").innerHTML = pesanHtml("galat", er.status === 409 ? t("sm.konflik") : er.status === 422 ? t("sm.tak_sah") : galatTeks(er.kode || "umum"));
    }
  });
}

export async function bukaMintaSurel() {
  if (!dlg) pasang();
  dlg.innerHTML = `<div class="jm-hantu" role="status"><i></i><i></i></div>`;
  dlg.showModal();
  try { await muatDialog(); } catch (er) { dlg.innerHTML = `<div id="smPesan">${pesanHtml("galat", er.status === 503 ? t("sm.belum_aktif") : galatTeks(er.kode || "umum"))}</div><div class="jm-aksi"><button type="button" class="jm-tbl" data-surel="tutup">${esc(t("jm.tutup"))}</button></div>`; }
}
