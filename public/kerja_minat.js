/* kerja_minat.js (F65-212, C-03): minat lowongan anggota tanpa CV, dipasang di kartu lowongan /kerja.
   slotMinat(id)            -> wadah kosong di kaki kartu lowongan anggota
   pasangMinat(wadah, milik) -> penangan klik sekali; milik() = Set id lowongan yang saya pasang
   segarkanMinat(wadah)     -> isi ulang semua slot sesudah daftar digambar
   Bukan pemasang: tombol minat + pesan singkat opsional, atau tarik minat. Pemasang: jumlah peminat, nama dan pesan saja.
   Tidak ada surel atau telepon; kontak lanjut lewat pesan ke sekretariat. Semua teks pengguna lewat esc(). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, api, nanti } from "/inti/umum.js";

let ST = null, milikSaya = () => new Set();
const tgl = (u) => tanggal(new Date(u * 1000).toISOString().slice(0, 10));
const galat = (e) => t({ 404: "kjm.g.tutup", 409: "kjm.g.ganda", 422: "kjm.g.isi", 429: "kjm.g.laju" }[e.status] || "kjm.g.umum");
async function muat() { try { ST = await api("/api/kerja/minat"); } catch { ST = null; } }

export const slotMinat = (id) => `<div class="kjm" data-minat="${esc(id)}"></div>`;

function isiSlot(el) {
  if (!ST) { el.replaceChildren(); return; }
  const id = Number(el.dataset.minat);
  if (milikSaya().has(id)) {
    const n = ST.peminat[id] || 0;
    el.innerHTML = `<button type="button" class="jm-tbl" data-kjm="peminat" aria-expanded="false">${ikon("orang", 16)}<span>${esc(t("kjm.peminat", { n: angka(n) }))}</span></button><div class="kjm-daftar" hidden></div>`;
  } else if (ST.minat.includes(id)) {
    el.innerHTML = `<span class="jm-pil jm-pil-ok">${ikon("centang", 14)}<span>${esc(t("kjm.terkirim"))}</span></span><button type="button" class="jm-tbl" data-kjm="tarik">${ikon("silang", 16)}<span>${esc(t("kjm.tarik"))}</span></button><p class="kjm-pesan" role="alert" hidden></p>`;
  } else {
    el.innerHTML = `<button type="button" class="jm-tbl" data-kjm="buka" aria-expanded="false">${ikon("tambah", 16)}<span>${esc(t("kjm.minat"))}</span></button>
      <div class="kjm-form" hidden><label><span>${esc(t("kjm.pesan"))}</span><textarea rows="3" maxlength="500"></textarea></label><p class="kjm-ket">${esc(t("kjm.ket"))}</p>
      <div class="kjm-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-kjm="kirim">${ikon("surel", 16)}<span>${esc(t("kjm.kirim"))}</span></button><button type="button" class="jm-tbl" data-kjm="batal">${esc(t("kjm.batal"))}</button></div><p class="kjm-pesan" role="alert" hidden></p></div>`;
  }
}
export async function segarkanMinat(wadah) {
  const slot = [...wadah.querySelectorAll("[data-minat]")];
  if (!slot.length) return;
  if (!ST) await muat();
  slot.forEach(isiSlot);
}

async function peminatHtml(id) {
  const r = (await api(`/api/kerja/${id}/peminat`)).baris;
  if (!r.length) return `<p class="kjm-ket">${esc(t("kjm.peminat_kosong"))}</p>`;
  return `<ul>${r.map((x) => `<li><b>${esc(x.nama)}</b><small>${esc(tgl(x.dibuat))}</small>${x.pesan ? `<p>${esc(x.pesan)}</p>` : ""}</li>`).join("")}</ul>
    <p class="kjm-ket">${esc(t("kjm.kontak_ket"))} <button type="button" class="kjm-taut" data-kjm="sekretariat">${esc(t("kjm.kontak"))}</button></p>`;
}

export function pasangMinat(wadah, milik) {
  milikSaya = milik;
  wadah.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-kjm]"), el = b?.closest("[data-minat]");
    if (!b || !el) return;
    const id = el.dataset.minat, aksi = b.dataset.kjm, pesan = el.querySelector(".kjm-pesan");
    const gagal = (x) => { b.disabled = false; if (pesan) { pesan.hidden = false; pesan.textContent = galat(x); } };
    if (aksi === "sekretariat") return void document.getElementById("psFab")?.click();
    if (aksi === "buka" || aksi === "batal") { const f = el.querySelector(".kjm-form"), buka = aksi === "buka" && f.hidden; f.hidden = !buka; el.querySelector('[data-kjm="buka"]').setAttribute("aria-expanded", String(buka)); if (buka) f.querySelector("textarea").focus(); return; }
    if (aksi === "peminat") {
      const d = el.querySelector(".kjm-daftar"), buka = d.hidden; d.hidden = !buka; b.setAttribute("aria-expanded", String(buka));
      if (buka) { d.innerHTML = `<p class="kjm-ket">${esc(t("kjm.memuat"))}</p>`; try { d.innerHTML = await peminatHtml(id); } catch (x) { d.innerHTML = `<p class="kjm-pesan" role="alert">${esc(galat(x))}</p>`; } }
      return;
    }
    if (aksi === "tarik" && !confirm(t("kjm.tarik_tanya"))) return;
    b.disabled = true;
    try {
      if (aksi === "kirim") await api(`/api/kerja/${id}/minat`, { metode: "POST", badan: { pesan: el.querySelector("textarea").value.trim() || null } });
      else await api(`/api/kerja/${id}/minat`, { metode: "DELETE" });
      await muat(); nanti(() => isiSlot(el));
    } catch (x) { gagal(x); }
  });
}
