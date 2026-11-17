/* mentor.js (F65-211, C-04): program mentor, dipasang di /portal.
   pasangMentor(el) -> kartu: daftar mentor yang disetujui admin, formulir daftar sebagai mentor, minta mentor, status kiriman saya, permintaan untuk saya.
   Semua pendaftaran dan permintaan lewat antrean admin METI. Tidak ada pencocokan otomatis, janji temu, surel, atau telepon. Teks pengguna lewat esc(). */
import { t, tanggal } from "/i18n.js";
import { esc, ikon, api, nanti, hantuHtml } from "/inti/umum.js";
import { exHtml, pilihHtml } from "/inti/komponen.js";

if (!document.querySelector('link[href="/forum.css"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/forum.css">');

const PIL = { menunggu: ["jm-pil-warn", "jam"], disetujui: ["jm-pil-ok", "centang"], ditolak: ["jm-pil-bad", "silang"], ditarik: ["", "balik"] };
const pilStatus = (s) => `<span class="jm-pil ${PIL[s]?.[0] || ""}">${ikon(PIL[s]?.[1] || "info", 14)}<span>${esc(t("kr.st." + s))}</span></span>`;
const tgl = (u) => tanggal(new Date(u * 1000).toISOString().slice(0, 10));
const galat = (e) => t({ 409: "mt.g.sama", 422: "mt.g.isi", 429: "mt.g.laju" }[e.status] || "mt.g.umum");
const aktif = (r) => r.status === "menunggu" || r.status === "disetujui";
const tarikHtml = (jenis, r) => (aktif(r) ? `<button type="button" class="jm-tbl" data-mt="tarik" data-jenis="${jenis}" data-id="${esc(r.id)}">${ikon("silang", 16)}<span>${esc(t("mt.tarik"))}</span></button>` : "");

export function pasangMentor(el) {
  let D = null;
  const $ = (s) => el.querySelector(s);
  const namaMentor = (id) => D.mentor.find((m) => m.id === id)?.nama || t("mt.mentor_lain");

  function daftarHtml() {
    if (!D.mentor.length) return `<p class="mt-ket">${esc(t("mt.kosong"))}</p>`;
    return `<ul class="mt-daftar">${D.mentor.map((m) => `<li data-mentor="${esc(m.id)}"><p class="mt-kepala"><b>${esc(m.nama)}</b><span class="jm-pil">${esc(t("bid.n." + m.bidang))}</span>${m.saya ? `<span class="jm-pil jm-pil-ok">${esc(t("mt.saya"))}</span>` : ""}</p>
      <p class="mt-uraian">${esc(m.uraian)}</p>${m.saya ? "" : `<div class="mt-aksi"><button type="button" class="jm-tbl" data-mt="buka" aria-expanded="false">${ikon("tambah", 16)}<span>${esc(t("mt.minta"))}</span></button></div>
      <div class="mt-form" hidden><label><span>${esc(t("mt.f.pesan"))}</span><textarea rows="3" maxlength="600"></textarea></label><p class="mt-ket">${esc(t("mt.f.ket"))}</p>
      <div class="mt-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-mt="minta">${ikon("surel", 16)}<span>${esc(t("mt.kirim"))}</span></button></div><p class="mt-pesan" role="alert" hidden></p></div>`}</li>`).join("")}</ul>`;
  }
  function sayaHtml() {
    const d = D.saya.mentor.find(aktif), riwayat = D.saya.mentor.find((r) => r.status === "ditolak");
    const daftar = d
      ? `<ul class="mt-minta"><li><p class="mt-kepala"><b>${esc(t("bid.n." + d.bidang))}</b>${pilStatus(d.status)}</p><p class="mt-uraian">${esc(d.uraian)}</p><div class="mt-aksi">${tarikHtml("mentor", d)}</div></li></ul>`
      : `${riwayat ? `<p class="mt-ket">${esc(t("mt.ditolak", { a: riwayat.alasan || "-" }))}</p>` : ""}<div class="mt-form" id="mtDaftar"><div class="mt-f"><span>${esc(t("mt.f.bidang"))}</span>${pilihHtml({ id: "mtBidang", ikon: "direktori", label: t("mt.f.bidang"), opsi: D.bidang.map((b) => [b, t("bid.n." + b)]), nilai: D.bidang[0] })}</div>
        <label><span>${esc(t("mt.f.uraian"))}</span><textarea id="mtUraian" rows="4" maxlength="600"></textarea></label><p class="mt-ket">${esc(t("mt.f.ket"))}</p>
        <div class="mt-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-mt="daftar">${ikon("surel", 16)}<span>${esc(t("mt.daftar"))}</span></button></div><p class="mt-pesan" role="alert" hidden></p></div>`;
    const minta = D.saya.minta.length ? `<ul class="mt-minta">${D.saya.minta.map((r) => `<li><p class="mt-kepala"><b>${esc(namaMentor(r.mentor_id))}</b>${pilStatus(r.status)}<small>${esc(tgl(r.dibuat))}</small></p><p class="mt-uraian">${esc(r.pesan)}</p>${r.alasan ? `<p class="mt-ket">${esc(t("mt.alasan", { a: r.alasan }))}</p>` : ""}<div class="mt-aksi">${tarikHtml("minta", r)}</div></li>`).join("")}</ul>` : `<p class="mt-ket">${esc(t("mt.minta_kosong"))}</p>`;
    const masuk = D.masuk.length ? `<h3 class="mt-h">${esc(t("mt.h.masuk"))}</h3><ul class="mt-minta">${D.masuk.map((r) => `<li><p class="mt-kepala"><b>${esc(r.nama)}</b></p><p class="mt-uraian">${esc(r.pesan)}</p></li>`).join("")}</ul><p class="mt-ket">${esc(t("mt.masuk_ket"))} <button type="button" class="kjm-taut fr-taut" data-mt="sekretariat">${esc(t("mt.kontak"))}</button></p>` : "";
    return `<h3 class="mt-h">${esc(t("mt.h.daftar"))}</h3>${daftar}<h3 class="mt-h">${esc(t("mt.h.minta"))}</h3>${minta}${masuk}`;
  }
  function gambar() {
    el.innerHTML = exHtml({ id: "mentor", ikon: "akademi", topik: t("mt.ey"), judulHtml: esc(t("mt.j")), subHtml: esc(t("mt.sub")),
      isiHtml: D ? `<p class="mt-catatan">${ikon("info", 16)}<span>${esc(t("mt.moderasi"))}</span></p><div class="mt-atur"><div class="mt-blok"><h3 class="mt-h">${esc(t("mt.h.mentor"))}</h3>${daftarHtml()}</div><div class="mt-blok">${sayaHtml()}</div></div>` : hantuHtml(3) });
    import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {});
  }
  async function muat() {
    try {
      const [m, saya, masuk] = await Promise.all([api("/api/mentor"), api("/api/kiriman/saya"), api("/api/mentor/permintaan")]);
      D = { mentor: m.baris, bidang: m.bidang, saya: { mentor: saya.mentor || [], minta: saya.minta || [] }, masuk: masuk.baris };
    } catch { el.hidden = true; return; } // fitur belum aktif (migrasi belum diterapkan): kartu tidak tampil
    el.hidden = false; gambar();
  }
  el.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-mt]"); if (!b) return;
    const aksi = b.dataset.mt, li = b.closest("li"), tulis = (w, x) => { b.disabled = false; const p = w.querySelector(".mt-pesan"); p.hidden = false; p.textContent = galat(x); };
    if (aksi === "sekretariat") return void document.getElementById("psFab")?.click();
    if (aksi === "buka") { const f = li.querySelector(".mt-form"), buka = f.hidden; f.hidden = !buka; b.setAttribute("aria-expanded", String(buka)); if (buka) f.querySelector("textarea").focus(); return; }
    if (aksi === "tarik" && !confirm(t("mt.tarik_tanya"))) return;
    b.disabled = true;
    try {
      if (aksi === "minta") await api(`/api/mentor/${li.dataset.mentor}/minta`, { metode: "POST", badan: { pesan: li.querySelector("textarea").value.trim() } });
      else if (aksi === "daftar") await api("/api/mentor", { metode: "POST", badan: { bidang: $("#mtBidang").value, uraian: $("#mtUraian").value.trim() } });
      else await api(`/api/kiriman/${b.dataset.jenis}/${b.dataset.id}`, { metode: "DELETE" });
      nanti(muat);
    } catch (x) { tulis(aksi === "minta" ? li : aksi === "daftar" ? $("#mtDaftar") : el, x); }
  });
  document.addEventListener("jm:bahasa", () => { if (D) gambar(); });
  gambar(); muat();
}
