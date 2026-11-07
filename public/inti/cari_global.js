/* Pencarian global: tombol kaca pembesar di kepala + Ctrl/Cmd+K + "/" membuka dialog. Indeks dimuat malas saat dibuka pertama. */
import { t, angka, tanggal, bahasa } from "/i18n.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { esc, ikon, nanti } from "/inti/umum.js";
import { norm, jerami, cari, sorot } from "/inti/cari_rumus.js";
import { catatCari } from "/inti/statistik.js";

const GRUP = [ // urutan tampil; kunci i18n literal agar terbaca gerbang-i18n
  ["proyek", "cari.g.proyek", "proyek"], ["org", "cari.g.org", "direktori"], ["orang", "cari.g.orang", "orang"], ["reg", "cari.g.reg", "regulasi"],
  ["berita", "cari.g.berita", "berita"], ["wilayah", "cari.g.wilayah", "wilayah"], ["pustaka", "cari.g.pustaka", "buku"], ["program", "cari.g.program", "kompas"], ["halaman", "cari.g.halaman", "tautan"],
];
const HALAMAN = [["/", "nav.beranda"], ["/insight", "nav.insight_ringkasan"], ["/rantai", "nav.rantai"], ["/asean", "nav.asean"], ["/jejaring", "nav.jejaring"], ["/metode", "nav.sub.metode"], ["/proyek", "nav.proyek"],
  ["/wilayah", "nav.wilayah"], ["/regulasi", "nav.regulasi"], ["/berita", "nav.berita"], ["/kalender", "nav.kalender"], ["/tentang", "nav.tentang"]];
const PINTAS = [["/proyek", "nav.proyek", "proyek"], ["/wilayah", "nav.wilayah_peta", "peta"], ["/regulasi", "nav.regulasi", "regulasi"], ["/pustaka", "nav.pustaka", "buku"],
  ["/direktori", "nav.direktori", "direktori"], ["/berita", "nav.berita", "berita"], ["/program", "nav.program", "kompas"], ["/indeks", "nav.indeks", "grafik"]];
const CONTOH = ["cari.c1", "cari.c2", "cari.c3", "cari.c4", "cari.c5"];
const BATAS = 5, BATAS_SEMUA = 50, KUNCI = "jm.cari.terakhir";
const muat = (n) => fetch(`/data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); });
const httpAman = (u) => /^https?:\/\//i.test(u || "");
const terakhir = () => { try { const a = JSON.parse(localStorage.getItem(KUNCI) || "[]"); return Array.isArray(a) ? a.filter((x) => typeof x === "string").slice(0, 6) : []; } catch { return []; } };
const simpan = (q) => { q = q.trim(); if (norm(q).length < 2) return; try { localStorage.setItem(KUNCI, JSON.stringify([q, ...terakhir().filter((x) => x !== q)].slice(0, 6))); } catch { /* penyimpanan dilarang: abaikan */ } };
const lupa = () => { try { localStorage.removeItem(KUNCI); } catch { /* abaikan */ } };
const MAC = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "");

let indeks = null, logo = null;
async function bangun() {
  const [pj, og, or, rg, br, wl, pk, pg, pen] = await Promise.all([muat("proyek"), muat("organisasi"), muat("orang"), muat("regulasi"), muat("berita"), muat("wilayah"), muat("pustaka"), muat("program_analisis"), import("/penerbit.js")]);
  logo = pen;
  const ix = [], tambah = (g, id, judul, sub, href, extra = "", o = {}) => ix.push({ g, id, judul, sub, href, j: norm(judul), h: jerami(judul, sub, extra), ...o });
  for (const p of pj.baris) tambah("proyek", p.id, p.nama, p.lokasi?.provinsi || "", "/p/" + p.id, p.teknologi, { tek: p.teknologi, st: p.status?.[0]?.nilai });
  const orgIds = new Set();
  for (const o of og.baris) { orgIds.add(o.id); tambah("org", o.id, o.nama, o.kategori?.label || "", "/o/" + o.id, o.kode_saham, { logo: true }); }
  for (const p of or.baris) if (p.kelompok?.kode === "tokoh-publik" && orgIds.has(p.organisasi_id)) tambah("orang", p.id, [p.gelar, p.nama].filter(Boolean).join(" "), p.jabatan_terkini || "", "/o/" + p.organisasi_id, p.organisasi_terkini);
  for (const r of rg.baris) tambah("reg", r.id, r.judul, [String(r.jenis || "").toUpperCase(), r.nomor && r.tahun ? `${r.nomor}/${r.tahun}` : r.tahun].filter(Boolean).join(" "), "/regulasi?id=" + encodeURIComponent(r.id), `${r.jenis} ${r.nomor} ${r.tahun}`);
  for (const b of br.baris) if (httpAman(b.url)) tambah("berita", b.id, b.judul, [b.media, b.terbit ? tanggal(String(b.terbit).slice(0, 10)) : ""].filter(Boolean).join(", "), b.url, "", { luar: true });
  for (const w of wl.baris) tambah("wilayah", w.kode, w.nama, w.identitas?.ibu_kota || "", "/wilayah/" + w.kode, "provinsi", { lambang: w.kode });
  for (const k of pk.baris) tambah("pustaka", k.id, k.judul, [k.penerbit, k.tanggal].filter(Boolean).join(", "), "/pustaka?id=" + encodeURIComponent(k.id), k.jenis);
  for (const g of pg.baris) tambah("program", g.kode, bahasa() === "en" ? g.nama.en || g.nama.id : g.nama.id, "", "/program/" + encodeURIComponent(g.kode), "program nasional");
  for (const [href, k] of HALAMAN) tambah("halaman", href, t(k), "", href);
  return ix;
}

function pasang() {
  const dlg = document.createElement("dialog");
  dlg.className = "jm-cari";
  dlg.setAttribute("aria-label", t("cari.judul"));
  const chip = (g, label, ik) => `<button type="button" class="jm-cari-chip" data-fil="${g}" aria-pressed="${g === "semua"}">${ikon(ik, 14)}<span>${esc(label)}</span><b data-n></b></button>`;
  const kbd = (...k) => k.map((x) => `<kbd>${x}</kbd>`).join("");
  dlg.innerHTML = `<div class="jm-cari-atas">${ikon("cari", 22)}<input type="search" class="jm-cari-isi" role="combobox" aria-expanded="true" aria-controls="jm-cari-daftar" autocomplete="off" spellcheck="false" placeholder="${esc(t("cari.placeholder"))}" aria-label="${esc(t("cari.placeholder"))}"><button type="button" class="iconbtn jm-cari-tutup" aria-label="${esc(t("cari.tutup"))}" title="${esc(t("cari.tutup"))}">${ikon("tutup", 20)}</button></div>
    <div class="jm-cari-chips" role="group" aria-label="${esc(t("cari.saring"))}">${chip("semua", t("cari.chip.semua"), "cari2")}${GRUP.filter(([g]) => g !== "halaman").map(([g, k, ik]) => chip(g, t(k), ik)).join("")}</div>
    <div class="jm-cari-hasil" id="jm-cari-daftar" role="listbox" aria-label="${esc(t("cari.judul"))}"></div>
    <div class="jm-cari-kaki" aria-hidden="true"><span>${kbd("↑", "↓")}${esc(t("cari.k.pilih"))}</span><span>${kbd("↵")}${esc(t("cari.k.buka"))}</span><span>${kbd("Esc")}${esc(t("cari.k.tutup"))}</span><span class="jm-cari-kaki-k">${kbd(MAC ? "⌘" : "Ctrl", "K")}</span></div>`;
  document.body.append(dlg);
  const isi = dlg.querySelector("input"), hasil = dlg.querySelector(".jm-cari-hasil"), chips = [...dlg.querySelectorAll(".jm-cari-chip")];
  let aktif = -1, tunda = 0, seri = 0, fil = "semua", buka = new Set();
  const opsi = () => [...hasil.querySelectorAll("[role=option]")];
  const pilih = (i) => {
    const o = opsi(); if (!o.length) return;
    aktif = (i + o.length) % o.length;
    o.forEach((e, k) => e.setAttribute("aria-selected", String(k === aktif)));
    isi.setAttribute("aria-activedescendant", o[aktif].id); o[aktif].scrollIntoView({ block: "nearest" });
  };
  const pesan = (k, rusak) => { hasil.innerHTML = `<p class="jm-cari-info"${rusak ? ' role="alert"' : ""}>${esc(t(k))}</p>`; };
  const awal = () => {
    const rc = terakhir();
    hasil.innerHTML = `${rc.length ? `<section class="jm-cari-bag"><h3>${ikon("jejak", 16)}<span>${esc(t("cari.terakhir"))}</span><button type="button" class="jm-cari-semua" data-hapus>${esc(t("cari.hapus"))}</button></h3>${rc.map((x) => `<button type="button" class="jm-cari-lalu" data-q="${esc(x)}">${ikon("cari", 16)}<span>${esc(x)}</span></button>`).join("")}</section>` : ""}
      <section class="jm-cari-bag"><h3>${ikon("tautan", 16)}<span>${esc(t("cari.pintas"))}</span></h3><div class="jm-cari-pintas">${PINTAS.map(([h, k, ik]) => `<a href="${h}">${ikon(ik, 20)}<span>${esc(t(k))}</span></a>`).join("")}</div></section>
      <section class="jm-cari-bag"><h3>${ikon("bintang", 16)}<span>${esc(t("cari.coba"))}</span></h3><div class="jm-cari-contoh">${CONTOH.map((k) => `<button type="button" data-q="${esc(t(k))}">${esc(t(k))}</button>`).join("")}</div></section>`;
    isi.removeAttribute("aria-activedescendant"); aktif = -1;
  };
  const sub = (it) => {
    const lok = it.sub ? `<small>${sorot(it.sub, isi.value)}</small>` : "";
    return it.g === "proyek" ? `<span class="jm-cari-pil">${it.tek ? pilTek(it.tek) : ""}${it.st ? pilStatus(it.st) : ""}${lok}</span>` : lok;
  };
  let tCatat = 0;
  const gambar = () => {
    if (!indeks) return;
    const q = isi.value, ada = !!norm(q), per = ada ? cari(indeks, q, Infinity) : new Map();
    const tot = (g) => (per.get(g) || []).length;
    chips.forEach((c) => { const g = c.dataset.fil, n = g === "semua" ? [...per.values()].reduce((a, b) => a + b.length, 0) : tot(g); c.querySelector("[data-n]").textContent = ada ? angka(n) : ""; c.classList.toggle("jm-cari-nol", ada && !n); });
    clearTimeout(tCatat); tCatat = setTimeout(() => catatCari(q), 1500);
    if (!ada) { awal(); return; }
    const gr = GRUP.filter(([g]) => per.has(g) && (fil === "semua" || fil === g));
    if (!gr.length) { hasil.innerHTML = `<p class="jm-cari-info">${ikon("cari2", 28)}<span>${esc(t("cari.kosong", { q }))}</span></p>`; aktif = -1; return; }
    let n = 0;
    hasil.innerHTML = gr.map(([g, kunci, ik]) => {
      const sem = per.get(g), penuh = fil !== "semua" || buka.has(g), tampil = sem.slice(0, penuh ? BATAS_SEMUA : BATAS);
      return `<div class="jm-cari-grup" role="group" aria-label="${esc(t(kunci))}"><h3>${ikon(ik, 16)}<span>${esc(t(kunci))}</span><em>${angka(sem.length)}</em>${sem.length > tampil.length && !penuh ? `<button type="button" class="jm-cari-semua" data-semua="${g}">${esc(t("cari.semua", { n: angka(sem.length) }))}</button>` : ""}</h3>${tampil.map((it) => {
        const lead = it.logo && logo ? `<img src="${esc(logo.logoUrl(it.judul))}" width="32" height="32" alt="" loading="lazy">` : it.lambang ? `<img src="/img/provinsi/${esc(it.lambang)}.png" width="32" height="32" alt="" loading="lazy">` : `<span class="jm-cari-ik">${ikon(ik, 18)}</span>`;
        return `<a class="jm-cari-baris" role="option" aria-selected="false" id="jm-cari-${n++}" href="${esc(it.href)}"${it.luar ? ' target="_blank" rel="noopener noreferrer"' : ""}>${lead}<span class="jm-cari-teks"><b>${sorot(it.judul, q)}</b>${sub(it)}</span>${it.luar ? ikon("tautan", 14) : ""}<span class="jm-cari-enter">${ikon("panah-kanan", 14)}</span></a>`;
      }).join("")}</div>`;
    }).join("");
    pilih(0);
  };
  hasil.addEventListener("error", (e) => { if (e.target.tagName === "IMG" && logo && !e.target.dataset.cad) { e.target.dataset.cad = "1"; e.target.src = logo.GEDUNG; } }, true);
  isi.addEventListener("input", () => { clearTimeout(tunda); tunda = setTimeout(() => nanti(gambar), 120); });
  isi.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); pilih(aktif + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); pilih(aktif - 1); }
    else if (e.key === "Enter") { const o = opsi()[aktif]; if (o) { e.preventDefault(); o.click(); } }
  });
  dlg.addEventListener("click", (e) => {
    const c = e.target, f = c.closest?.("[data-fil]"), s = c.closest?.("[data-semua]"), q = c.closest?.("[data-q]");
    if (c === dlg || c.closest(".jm-cari-tutup")) dlg.close();
    else if (f) { fil = f.dataset.fil; buka.clear(); chips.forEach((x) => x.setAttribute("aria-pressed", String(x === f))); nanti(gambar); }
    else if (s) { buka.add(s.dataset.semua); nanti(gambar); }
    else if (q) { isi.value = q.dataset.q; isi.focus(); gambar(); }
    else if (c.closest("[data-hapus]")) { lupa(); gambar(); }
    else if (c.closest("a")) { simpan(isi.value); dlg.close(); }
  });
  dlg.addEventListener("close", () => { document.documentElement.classList.remove("jm-cari-buka"); });
  dlg.buka = async () => {
    if (!dlg.open) dlg.showModal();
    isi.focus(); isi.select();
    if (indeks) { if (!norm(isi.value)) awal(); return; }
    awal(); const s = ++seri;
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
