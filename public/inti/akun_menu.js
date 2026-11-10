/* Menu akun di kepala (kanan, sebelum bahasa/tema): avatar bulat (foto profil atau inisial) membuka menu turun.
   Foto lewat /api/profil/saya/foto; bila akun belum punya foto, 404 pertama dicatat di sessionStorage supaya halaman berikutnya tak mengulang. */
import { t, bahasa, gantiBahasa } from "/i18n.js";
import { api, esc, ikon, nanti } from "/inti/umum.js";

const IK_PESAN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12.5h5"/></svg>';
const KUNCI_FOTO = "jm-foto";

const inisial = (nama) => ([...String(nama || "").trim().split(/\s+/).slice(0, 2).map((w) => [...w][0] || "")].join("") || "?").toUpperCase();
const fotoDicoba = () => { try { return sessionStorage.getItem(KUNCI_FOTO) !== "0"; } catch { return true; } };
const avatarIsi = (nama, foto) => `<span class="jm-ini" aria-hidden="true">${esc(inisial(nama))}</span>${foto ? `<img src="/api/profil/saya/foto${typeof foto === "string" ? "?v=" + esc(foto) : ""}" alt="" width="44" height="44" hidden>` : ""}`;
const butir = (aksi, ik, kunci, ekstra = "") => `<button type="button" role="menuitem" data-am="${aksi}" id="am-${aksi}">${ik}<span data-i18n="${kunci}">${esc(t(kunci))}</span>${ekstra}</button>`;
const taut = (href, ik, kunci) => `<a role="menuitem" href="${href}">${ik}<span data-i18n="${kunci}">${esc(t(kunci))}</span></a>`;

/** Gantikan tombol keluar: avatar + menu. Tombol Keluar memakai id "keluar" (ditangani pasangPenangan di kepala.js). */
export function akunMenuHtml(saya) {
  return `<div class="jm-akunwrap"><button type="button" class="iconbtn jm-bulat jm-avatar" id="akunBtn" aria-haspopup="menu" aria-expanded="false" aria-controls="akunMenu" data-i18n-attr="aria-label:am.akun;title:am.akun" aria-label="${esc(t("am.akun"))}" title="${esc(t("am.akun"))}">${avatarIsi(saya.nama, fotoDicoba())}</button>
    <div class="jm-akunmenu" id="akunMenu" role="menu" hidden data-i18n-attr="aria-label:am.akun" aria-label="${esc(t("am.akun"))}">
      <div class="jm-akun-ident"><span class="jm-avatar">${avatarIsi(saya.nama, fotoDicoba())}</span><span><b>${esc(saya.nama)}</b><small data-i18n="peran.${esc(saya.peran)}">${esc(t("peran." + saya.peran))}</small></span></div>
      <a role="menuitem" href="/saya" id="am-saya">${ikon("mahkota", 20)}<span data-i18n="am.saya">${esc(t("am.saya"))}</span><span class="jm-am-lencana" id="amIkuti" hidden></span></a>
      ${taut("/profil-saya", ikon("orang", 20), "am.profil")}
      ${taut("/kta", ikon("kartu", 20), "am.kta")}
      <a role="menuitem" href="/diikuti" id="am-diikuti">${ikon("lonceng", 20)}<span data-i18n="am.diikuti">${esc(t("am.diikuti"))}</span></a>
      ${taut("/portal", ikon("direktori", 20), "am.portal")}
      ${taut("/otorisasi", ikon("lencana", 20), "am.otorisasi")}
      ${butir("pesan", IK_PESAN, "am.pesan", '<span class="jm-am-lencana" id="amBelum" hidden></span>')}
      ${taut("/langganan", ikon("surel", 20), "am.langganan")}
      ${butir("surel", ikon("lencana", 20), "am.surel")}
      ${saya.peran === "admin" || saya.peran === "super" || saya.peran === "pengurus" ? taut("/admin", ikon("perisai", 20), "nav.admin") : ""}
      ${taut("/ganti-sandi", ikon("kunci", 20), "am.sandi")}
      <hr>
      <button type="button" role="menuitem" id="keluar" data-am="keluar">${ikon("keluar", 20)}<span data-i18n="jm.keluar">${esc(t("jm.keluar"))}</span></button>
    </div></div>`;
}

/** Ganti foto semua avatar tanpa memuat ulang halaman: ada = true (muat ulang foto), false (tampilkan inisial). */
export function segarkanAvatar(ada, nama) {
  try { if (ada) sessionStorage.removeItem(KUNCI_FOTO); else sessionStorage.setItem(KUNCI_FOTO, "0"); } catch { /* tanpa penyimpanan: tetap jalan */ }
  document.querySelectorAll(".jm-avatar").forEach((el) => {
    const n = nama ?? el.dataset.nama ?? "";
    el.innerHTML = avatarIsi(n || el.querySelector(".jm-ini")?.textContent, ada ? String(Date.now()) : false);
  });
}

export function pasangAkunMenu(kepala, saya) {
  const tombol = kepala.querySelector("#akunBtn"), menu = kepala.querySelector("#akunMenu");
  if (!tombol || !menu) return;
  const nama = saya.nama;
  kepala.querySelectorAll(".jm-avatar").forEach((a) => { a.dataset.nama = nama; });
  // foto: img tersembunyi sampai terbaca; galat (404 = belum punya foto) mengembalikan inisial dan mengingatnya satu sesi tab
  kepala.addEventListener("load", (e) => { if (e.target.matches?.(".jm-avatar img")) { e.target.hidden = false; e.target.parentElement.querySelector(".jm-ini")?.setAttribute("hidden", ""); } }, true);
  kepala.addEventListener("error", (e) => { if (e.target.matches?.(".jm-avatar img")) { try { sessionStorage.setItem(KUNCI_FOTO, "0"); } catch { /* abaikan */ } e.target.remove(); } }, true);

  const buka = (ya) => {
    tombol.setAttribute("aria-expanded", String(ya));
    menu.hidden = !ya;
    if (ya) nanti(muatBelum);
  };
  let sudahBelum = 0;
  const muatBelum = () => {
    if (Date.now() - sudahBelum < 20000) return;
    sudahBelum = Date.now();
    api("/api/pesan").then((d) => {
      const n = d.belum || 0, l = menu.querySelector("#amBelum");
      l.textContent = n > 99 ? "99+" : String(n); l.hidden = !n;
    }).catch((e) => { if (e.status === 503 || e.status === 404) menu.querySelector("#am-pesan").hidden = true; });
    api("/api/ikuti").then((d) => {
      const n = d.baru || 0, l = menu.querySelector("#amIkuti");
      l.textContent = n > 99 ? "99+" : String(n); l.hidden = !n;
    }).catch((e) => { if (e.status === 503 || e.status === 404) { menu.querySelector("#am-diikuti").hidden = true; menu.querySelector("#am-saya").hidden = true; } });
  };
  tombol.addEventListener("click", () => buka(menu.hidden));
  document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest(".jm-akunwrap")) buka(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { buka(false); tombol.focus(); } });
  menu.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const butir = [...menu.querySelectorAll('[role="menuitem"]')].filter((x) => !x.hidden), i = butir.indexOf(document.activeElement);
    butir[(i + (e.key === "ArrowDown" ? 1 : -1) + butir.length) % butir.length]?.focus();
    e.preventDefault();
  });
  menu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-am]");
    if (!b) { if (e.target.closest("a")) buka(false); return; }
    if (b.dataset.am === "pesan") { buka(false); document.getElementById("psFab")?.click(); }
    else if (b.dataset.am === "surel") { buka(false); import("/inti/surel_minta.js").then((m) => m.bukaMintaSurel()); }
    else if (b.dataset.am === "bahasa") { const baru = { id: "zh", zh: "en", en: "id" }[bahasa()]; /* urutan tombol: Indonesia, Mandarin, Inggris */ buka(false); nanti(() => gantiBahasa(baru, { masuk: true })); }
  });
  tombol.addEventListener("keydown", (e) => { if (e.key === "ArrowDown") { buka(true); menu.querySelector('[role="menuitem"]')?.focus(); e.preventDefault(); } });
}
