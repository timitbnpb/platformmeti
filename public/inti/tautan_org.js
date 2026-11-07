/* Tautan otomatis nama organisasi ke profil publik /o/<id>: elemen bertanda data-org-nama="<nama>" dicocokkan PERSIS (nama,
   nama_lain, singkatan; huruf besar/kecil dan tanda baca diabaikan) dengan /data/organisasi.json. Tak cocok = dibiarkan.
   <a> dapat href baru; elemen lain dibungkus <a class="jm-org-tautan">. Cukup mengimpor modul ini. */
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
let indeks = null;
const muat = () => (indeks ??= fetch("/data/organisasi.json").then((r) => r.json()).then((d) => {
  const m = new Map(), amb = new Set();
  for (const o of d.baris) for (const n of [o.nama, ...(o.nama_lain || []), o.singkatan]) { const k = norm(n); if (k.length < 3) continue; if (m.has(k) && m.get(k) !== o.id) amb.add(k); else m.set(k, o.id); }
  for (const k of amb) m.delete(k);
  return m;
}).catch(() => { indeks = null; return new Map(); }));
export async function tautkanOrg(akar = document) {
  const el = [...akar.querySelectorAll("[data-org-nama]:not([data-org-tertaut])")];
  if (!el.length) return;
  const m = await muat();
  for (const e of el) {
    e.dataset.orgTertaut = "1";
    const id = m.get(norm(e.dataset.orgNama));
    if (!id) continue;
    if (e.tagName === "A") { e.setAttribute("href", "/o/" + id); continue; }
    const a = document.createElement("a"); a.className = "jm-org-tautan"; a.href = "/o/" + id;
    e.replaceWith(a); a.append(e);
  }
}
if (typeof document !== "undefined" && !window.__jmTautOrg) {
  window.__jmTautOrg = true;
  const jalan = () => tautkanOrg();
  new MutationObserver(() => { clearTimeout(window.__jmTautOrgT); window.__jmTautOrgT = setTimeout(jalan, 80); }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== "loading") jalan(); else document.addEventListener("DOMContentLoaded", jalan);
}
