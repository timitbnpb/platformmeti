/* Pembantu bersama /proyek-besar dan /proyek-berhenti: muat potret turunan, tabel urut berpaginasi bernomor, sel pemilik berlogo.
   INP: urut/halaman menyorot chrome seketika, badan tabel menyusul lewat nanti(). */
import { t, ada, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { tautOrg, tautProvinsi } from "/inti/tautan.js";
import { logoOrgSatu } from "/inti/logo_org.js";

export const BATAS = 15;
export const num = (n, d) => angka(n, { desimal: d ?? (Number.isInteger(n) ? 0 : 1) });
export const labTek = (k) => (ada("pj.tek." + k) ? t("pj.tek." + k) : k || "-");
export const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
export const tgl = (s) => (s ? tanggal(String(s).slice(0, 10)) : "");
export const hl = (n) => `<span class="jm-hl">${esc(n)}</span>`;
export const estPil = () => `<span class="jm-pil jm-pil-est">${esc(t("pj.est"))}</span>`;

export const muatPotret = () => fetch("/data/proyek_besar.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("proyek_besar"); return r.json(); });

export const selProv = (p) => (p ? `<span class="jm-pj-provsel">${tautProvinsi(p)}</span>` : `<span class="jm-bantu">-</span>`);
export const selNamaProyek = (r) => `<b><a class="jm-pj-nm" href="/p/${esc(r.id)}">${esc(r.nama)}</a></b>`;
/* pemilik: logo kecil + nama (tautan /o/<id> bila ada), induk dan porsi di bawahnya */
export function selPemilik(r) {
  if (!r.pemilik) return `<span class="jm-bantu">-</span>`;
  const logo = r.org_id ? logoOrgSatu(r.org_id, r.pemilik) : "";
  const nama = r.org_id ? tautOrg(r.org_id, r.pemilik) : esc(r.pemilik);
  const kecil = [r.induk ? t("pb.induk", { nama: r.induk }) : "", r.porsi ? t("pb.porsi", { n: num(r.porsi) }) : ""].filter(Boolean).join(", ");
  return `<span class="pb-pem">${logo ? `<img class="pb-logo" src="${esc(logo)}" alt="" width="22" height="22" loading="lazy" data-galat="hapus">` : ""}<span class="pb-pem-t"><span>${nama}</span>${kecil ? `<small class="jm-bantu">${esc(kecil)}</small>` : ""}</span></span>`;
}
export const selSumber = (r) => { const u = urlAman(r.sumber_url); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(r.sumber_jenis || t("pb.sumber"))}</a>` : "-"; };

const kosongBanding = (v) => v === null || v === "" || v === undefined;
const bandingkan = (k, a) => (x, y) => {
  const u = x[k], v = y[k];
  if (u === v) return String(x.nama ?? x.kunci ?? x.tahun).localeCompare(String(y.nama ?? y.kunci ?? y.tahun));
  if (kosongBanding(u)) return 1;
  if (kosongBanding(v)) return -1;
  return (typeof u === "number" ? u - v : String(u).localeCompare(String(v))) * a;
};
/* kolom = [kunciUrut|null, kunciKamus, sel(r), kelas]. S = { k, arah, hal } ; kembali ke S yang sama */
export function pasangTabel(el, kolom, rows, S, kosongKunci = "jm.kosong.cocok") {
  const gambar = (fokus) => {
    const urut = rows.slice().sort(bandingkan(S.k, S.arah));
    if (!urut.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t(kosongKunci))}</p></div>`; return; }
    S.hal = Math.min(Math.max(1, S.hal || 1), Math.ceil(urut.length / BATAS));
    const kepala = kolom.map(([k, kt, , kls]) => `<th scope="col"${kls && kls.includes("jm-num") ? ' class="jm-num"' : ""}${k ? ` aria-sort="${S.k === k ? (S.arah > 0 ? "ascending" : "descending") : "none"}"` : ""}>${k ? `<button type="button" class="jm-urut" data-u="${k}">${esc(t(kt))}</button>` : esc(t(kt))}</th>`).join("");
    const dari = (S.hal - 1) * BATAS;
    const badan = urut.slice(dari, dari + BATAS).map((r) => `<tr>${kolom.map(([, kt, f, kls]) => `<td data-label="${esc(t(kt))}"${kls ? ` class="${kls}"` : ""}>${f(r)}</td>`).join("")}</tr>`).join("");
    el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel pb-tabel"><thead><tr>${kepala}</tr></thead><tbody>${badan}</tbody></table></div>${paginasiHtml({ hal: S.hal, total: urut.length, per: BATAS, satuan: "jm.pag.u.proyek" })}`;
    if (fokus) el.querySelector(fokus)?.focus();
  };
  el.addEventListener("click", (e) => {
    const u = e.target.closest("[data-u]"), l = e.target.closest("[data-hal]");
    if (u) {
      const k = u.dataset.u;
      S.hal = 1; S.arah = S.k === k ? -S.arah : (S.turun || []).includes(k) ? -1 : 1; S.k = k;
      for (const th of el.querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", th.contains(u) ? (S.arah > 0 ? "ascending" : "descending") : "none");
      nanti(() => gambar(`[data-u="${k}"]`));
    } else if (l && !l.disabled) { S.hal = +l.dataset.hal; sorotHalaman(l, S.hal); nanti(() => gambar()); }
  });
  gambar();
}
