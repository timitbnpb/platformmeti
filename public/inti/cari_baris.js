/* Baris hasil cari bersama (palet + /cari): lambang/logo/ikon jenis, judul dengan sorotan lewat DOM (bukan innerHTML), sub, label bukti. */
import { ikon } from "/inti/umum.js";
import { kata, norm } from "/inti/cari_rumus.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { buktiHtml } from "/inti/bukti.js";

/** Isi `el` dengan teks; kata yang berawalan kata kueri dibungkus <mark>. Aman: hanya node teks. */
export function sorotDom(el, teks, q) {
  const qk = kata(q), s = String(teks ?? "");
  el.textContent = "";
  if (!qk.length) { el.append(s); return el; }
  for (const m of s.split(/(\p{L}[\p{L}\p{N}]*|\p{N}+)/u)) {
    if (!m) continue;
    const n = norm(m);
    if (n && qk.some((k) => n.startsWith(k))) { const mk = document.createElement("mark"); mk.textContent = m; el.append(mk); } else el.append(m);
  }
  return el;
}
const el = (tag, kls, isi) => { const e = document.createElement(tag); if (kls) e.className = kls; if (isi != null) e.textContent = isi; return e; };
const html = (tag, kls, h) => { const e = el(tag, kls); e.innerHTML = h; return e; };   // h = markup tepercaya dari komponen sendiri (ikon, pil)

/** Satu baris <a role=option>. opsi: { ik: ikon jenis, logo: modul /penerbit.js, id: id elemen }. */
export function barisCari(it, q, { ik = "tautan", logo = null, id = "" } = {}) {
  const a = el("a", "jm-cari-baris");
  a.setAttribute("role", "option"); a.setAttribute("aria-selected", "false"); a.href = it.href; if (id) a.id = id;
  if (it.luar) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
  let lead;
  if (it.logo && logo) { lead = el("img"); lead.src = logo.logoUrl(it.judul); }
  else if (it.lambang) { lead = el("img"); lead.src = `/img/provinsi/${it.lambang}.png`; }
  if (lead) { lead.width = lead.height = 32; lead.alt = ""; lead.loading = "lazy"; a.append(lead); } else a.append(html("span", "jm-cari-ik", ikon(ik, 18)));
  const teks = el("span", "jm-cari-teks");
  teks.append(sorotDom(el("b"), it.judul, q));
  const meta = it.g === "proyek" ? html("span", "jm-cari-pil", (it.tek ? pilTek(it.tek) : "") + (it.st ? pilStatus(it.st) : "")) : null;
  if (it.sub) { const sm = sorotDom(el("small"), it.sub, q); meta ? (meta.append(sm), teks.append(meta)) : teks.append(sm); } else if (meta) teks.append(meta);
  a.append(teks);
  if (it.bukti) { const b = html("span", "jm-cari-bukti", buktiHtml(it.bukti, { tag: "span" })); a.append(b); }
  if (it.luar) a.append(html("span", "jm-cari-luar", ikon("tautan", 14)));
  a.append(html("span", "jm-cari-enter", ikon("panah-kanan", 14)));
  return a;
}
