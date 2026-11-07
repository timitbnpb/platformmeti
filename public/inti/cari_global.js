/* Pencarian global: tombol kaca pembesar di kepala + Ctrl/Cmd+K + "/" membuka dialog. Indeks dimuat malas saat dibuka pertama. */
import { t } from "/i18n.js";
import { esc, ikon, nanti } from "/inti/umum.js";
import { norm, jerami, cari, sorot } from "/inti/cari_rumus.js";

const GRUP = [ // urutan tampil; kunci i18n literal agar terbaca gerbang-i18n
  ["proyek", "cari.g.proyek", "proyek"], ["org", "cari.g.org", "direktori"], ["orang", "cari.g.orang", "orang"], ["reg", "cari.g.reg", "regulasi"],
  ["berita", "cari.g.berita", "berita"], ["wilayah", "cari.g.wilayah", "wilayah"], ["halaman", "cari.g.halaman", "tautan"],
];
const HALAMAN = [["/", "nav.beranda"], ["/insight", "nav.insight_ringkasan"], ["/rantai", "nav.rantai"], ["/asean", "nav.asean"], ["/metode", "nav.sub.metode"], ["/proyek", "nav.proyek"],
  ["/wilayah", "nav.wilayah"], ["/regulasi", "nav.regulasi"], ["/berita", "nav.berita"], ["/kalender", "nav.kalender"], ["/tentang", "nav.tentang"]];
const muat = (n) => fetch(`/data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); });
const httpAman = (u) => /^https?:\/\//i.test(u || "");

let indeks = null, logo = null;
async function bangun() {
  const [pj, og, or, rg, br, wl, pen] = await Promise.all([muat("proyek"), muat("organisasi"), muat("orang"), muat("regulasi"), muat("berita"), muat("wilayah"), import("/penerbit.js")]);
  logo = pen;
  const ix = [], tambah = (g, id, judul, sub, href, extra = "", o = {}) => ix.push({ g, id, judul, sub, href, j: norm(judul), h: jerami(judul, sub, extra), ...o });
  for (const p of pj.baris) tambah("proyek", p.id, p.nama, [p.teknologi, p.lokasi?.provinsi].filter(Boolean).join(", "), "/p/" + p.id, p.lokasi?.provinsi);
  const orgIds = new Set();
  for (const o of og.baris) { orgIds.add(o.id); tambah("org", o.id, o.nama, o.kategori?.label || "", "/o/" + o.id, o.kode_saham, { logo: true }); }
  for (const p of or.baris) if (p.kelompok?.kode === "tokoh-publik" && orgIds.has(p.organisasi_id)) tambah("orang", p.id, [p.gelar, p.nama].filter(Boolean).join(" "), p.jabatan_terkini || "", "/o/" + p.organisasi_id, p.organisasi_terkini);
  for (const r of rg.baris) tambah("reg", r.id, r.judul, [String(r.jenis || "").toUpperCase(), r.nomor && r.tahun ? `${r.nomor}/${r.tahun}` : r.tahun].filter(Boolean).join(" "), "/regulasi?id=" + encodeURIComponent(r.id), `${r.jenis} ${r.nomor} ${r.tahun}`);
  for (const b of br.baris) if (httpAman(b.url)) tambah("berita", b.id, b.judul, b.media || "", b.url, "", { luar: true });
  for (const w of wl.baris) tambah("wilayah", w.kode, w.nama, w.identitas?.ibu_kota || "", "/wilayah/" + w.kode, "provinsi", { lambang: w.kode });
  for (const [href, k] of HALAMAN) tambah("halaman", href, t(k), "", href);
  return ix;
}

function pasang() {
  const dlg = document.createElement("dialog");
  dlg.className = "jm-cari";
  dlg.setAttribute("aria-label", t("cari.judul"));
  dlg.innerHTML = `<div class="jm-cari-atas">${ikon("cari", 22)}<input type="search" class="jm-cari-isi" role="combobox" aria-expanded="true" aria-controls="jm-cari-daftar" autocomplete="off" spellcheck="false" placeholder="${esc(t("cari.placeholder"))}" aria-label="${esc(t("cari.placeholder"))}"><button type="button" class="iconbtn jm-cari-tutup" aria-label="${esc(t("cari.tutup"))}" title="${esc(t("cari.tutup"))}">${ikon("tutup", 20)}</button></div>
    <div class="jm-cari-hasil" id="jm-cari-daftar" role="listbox" aria-label="${esc(t("cari.judul"))}"></div>
    <p class="jm-cari-petunjuk">${esc(t("cari.petunjuk"))}</p>`;
  document.body.append(dlg);
  const isi = dlg.querySelector("input"), hasil = dlg.querySelector(".jm-cari-hasil");
  let aktif = -1, tunda = 0, seri = 0;
  const opsi = () => [...hasil.querySelectorAll("[role=option]")];
  const pilih = (i) => {
    const o = opsi(); if (!o.length) return;
    aktif = (i + o.length) % o.length;
    o.forEach((e, k) => e.setAttribute("aria-selected", String(k === aktif)));
    isi.setAttribute("aria-activedescendant", o[aktif].id); o[aktif].scrollIntoView({ block: "nearest" });
  };
  const pesan = (k, rusak) => { hasil.innerHTML = `<p class="jm-cari-info"${rusak ? ' role="alert"' : ""}>${esc(t(k))}</p>`; };
  const gambar = () => {
    const q = isi.value, per = indeks && cari(indeks, q, 6);
    if (!indeks) return;
    if (!norm(q)) { pesan("cari.mulai"); return; }
    if (!per.size) { hasil.innerHTML = `<p class="jm-cari-info">${esc(t("cari.kosong", { q }))}</p>`; return; }
    let n = 0;
    hasil.innerHTML = GRUP.filter(([g]) => per.has(g)).map(([g, kunci, ik]) => `<div class="jm-cari-grup" role="group" aria-label="${esc(t(kunci))}"><h3>${ikon(ik, 16)}<span>${esc(t(kunci))}</span></h3>${per.get(g).map((it) => {
      const lead = it.logo && logo ? `<img src="${esc(logo.logoUrl(it.judul))}" width="28" height="28" alt="" loading="lazy">` : it.lambang ? `<img src="/img/provinsi/${esc(it.lambang)}.png" width="28" height="28" alt="" loading="lazy">` : `<span class="jm-cari-ik">${ikon(ik, 18)}</span>`;
      return `<a class="jm-cari-baris" role="option" aria-selected="false" id="jm-cari-${n++}" href="${esc(it.href)}"${it.luar ? ' target="_blank" rel="noopener noreferrer"' : ""}>${lead}<span class="jm-cari-teks"><b>${sorot(it.judul, q)}</b>${it.sub ? `<small>${sorot(it.sub, q)}</small>` : ""}</span>${it.luar ? ikon("tautan", 14) : ""}</a>`;
    }).join("")}</div>`).join("");
    pilih(0);
  };
  hasil.addEventListener("error", (e) => { if (e.target.tagName === "IMG" && logo && !e.target.dataset.cad) { e.target.dataset.cad = "1"; e.target.src = logo.GEDUNG; } }, true);
  isi.addEventListener("input", () => { clearTimeout(tunda); tunda = setTimeout(() => nanti(gambar), 120); });
  isi.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); pilih(aktif + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); pilih(aktif - 1); }
    else if (e.key === "Enter") { const o = opsi()[aktif]; if (o) { e.preventDefault(); o.click(); } }
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest(".jm-cari-tutup")) dlg.close(); else if (e.target.closest("a")) dlg.close(); });
  dlg.addEventListener("close", () => { document.documentElement.classList.remove("jm-cari-buka"); });
  dlg.buka = async () => {
    if (!dlg.open) dlg.showModal();
    isi.focus(); isi.select();
    if (indeks) return;
    const s = ++seri; hasil.innerHTML = `<p class="jm-cari-info">${esc(t("cari.memuat"))}</p>`;
    try { indeks = await bangun(); if (s === seri) gambar(); } catch (err) { pesan("cari.galat", true); }
  };
  return dlg;
}

export function pasangCari(kepala) {
  let dlg = null;
  const buka = () => { dlg ||= pasang(); dlg.buka(); };
  kepala.querySelector("#cari")?.addEventListener("click", buka);
  document.addEventListener("keydown", (e) => {
    const k = e.key, el = e.target, ketik = el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    if ((k === "k" || k === "K") && (e.ctrlKey || e.metaKey) && !e.altKey) { e.preventDefault(); buka(); }
    else if (k === "/" && !ketik && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); buka(); }
  });
}
