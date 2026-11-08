/* Pencarian global: tombol kaca pembesar di kepala + Ctrl/Cmd+K + "/" membuka dialog. Indeks dimuat malas saat dibuka pertama. */
import { t, angka } from "/i18n.js";
import { esc, ikon, nanti } from "/inti/umum.js";
import { norm, cari } from "/inti/cari_rumus.js";
import { catatCari } from "/inti/statistik.js";
import { JENIS as GRUP, muatBanyak } from "/inti/cari_indeks.js";
import { barisCari } from "/inti/cari_baris.js";

const PINTAS = [["/proyek", "nav.proyek", "proyek"], ["/wilayah", "nav.wilayah_peta", "peta"], ["/regulasi", "nav.regulasi", "regulasi"], ["/pustaka", "nav.pustaka", "buku"],
  ["/direktori", "nav.direktori", "direktori"], ["/berita", "nav.berita", "berita"], ["/program", "nav.program", "kompas"], ["/indeks", "nav.indeks", "grafik"]];
const CONTOH = ["cari.c1", "cari.c2", "cari.c3", "cari.c4", "cari.c5"];
const BATAS = 5, BATAS_SEMUA = 50, KUNCI = "jm.cari.terakhir";
const terakhir = () => { try { const a = JSON.parse(localStorage.getItem(KUNCI) || "[]"); return Array.isArray(a) ? a.filter((x) => typeof x === "string").slice(0, 6) : []; } catch { return []; } };
const simpan = (q) => { q = q.trim(); if (norm(q).length < 2) return; try { localStorage.setItem(KUNCI, JSON.stringify([q, ...terakhir().filter((x) => x !== q)].slice(0, 6))); } catch { /* penyimpanan dilarang: abaikan */ } };
const lupa = () => { try { localStorage.removeItem(KUNCI); } catch { /* abaikan */ } };
const MAC = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "");

let indeks = [], logo = null, dimuat = null;
/* muat semua jenis paralel; tiap jenis yang tiba langsung masuk indeks dan memicu render ulang (bertahap) */
function muatSemua(tiap) {
  dimuat ||= (async () => {
    import("/penerbit.js").then((m) => { logo = m; tiap(); }).catch(() => {});
    const r = await muatBanyak(GRUP.map(([g]) => g), (g, a) => { indeks = indeks.concat(a); tiap(); });
    if (r.gagal === GRUP.length) { dimuat = null; throw new Error("indeks"); }
  })();
  return dimuat;
}

function pasang() {
  const dlg = document.createElement("dialog");
  dlg.className = "jm-cari";
  dlg.setAttribute("aria-label", t("cari.judul"));
  const chip = (g, label, ik) => `<button type="button" class="jm-cari-chip" data-fil="${g}" aria-pressed="${g === "semua"}">${ikon(ik, 14)}<span>${esc(label)}</span><b data-n></b></button>`;
  const kbd = (...k) => k.map((x) => `<kbd>${x}</kbd>`).join("");
  dlg.innerHTML = `<div class="jm-cari-atas">${ikon("cari", 22)}<input type="search" class="jm-cari-isi" role="combobox" aria-expanded="true" aria-controls="jm-cari-daftar" autocomplete="off" spellcheck="false" placeholder="${esc(t("cari.placeholder"))}" aria-label="${esc(t("cari.placeholder"))}"><button type="button" class="iconbtn jm-cari-tutup" aria-label="${esc(t("cari.tutup"))}" title="${esc(t("cari.tutup"))}">${ikon("tutup", 20)}</button></div>
    <div class="jm-cari-mode" role="group" aria-label="${esc(t("tny.mode"))}"><button type="button" data-mode="cari" aria-pressed="true">${ikon("cari", 14)}<span>${esc(t("tny.mode.cari"))}</span></button><button type="button" data-mode="tanya" aria-pressed="false">${ikon("bintang", 14)}<span>${esc(t("tny.mode.tanya"))}</span></button></div>
    <div class="jm-cari-chips" role="group" aria-label="${esc(t("cari.saring"))}">${chip("semua", t("cari.chip.semua"), "cari2")}${GRUP.filter(([g]) => g !== "halaman").map(([g, k, ik]) => chip(g, t(k), ik)).join("")}</div>
    <div class="jm-cari-hasil" id="jm-cari-daftar" role="listbox" aria-label="${esc(t("cari.judul"))}"></div>
    <div class="jm-cari-tanya" id="jm-cari-tanya" hidden></div>
    <a class="jm-cari-penuh" href="/cari">${ikon("cari2", 16)}<span>${esc(t("cari.penuh"))}</span>${ikon("panah-kanan", 14)}</a>
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
  const penuh = dlg.querySelector(".jm-cari-penuh"), panelT = dlg.querySelector(".jm-cari-tanya"), chipsEl = dlg.querySelector(".jm-cari-chips");
  let tCatat = 0, mode = "cari", kartu = null, ctl = null;
  /* Tab Tanya: Enter mengirim pertanyaan ke /api/tanya (modul dimuat malas); hasil = kartu jawaban bersitasi. */
  const awalTanya = () => {
    panelT.innerHTML = `<p class="jm-cari-info">${ikon("bintang", 28)}<span>${esc(t("tny.petunjuk"))}</span></p><div class="jm-cari-contoh">${["tny.c1", "tny.c2", "tny.c3"].map((k) => `<button type="button" data-tq="${esc(t(k))}">${esc(t(k))}</button>`).join("")}</div>`;
  };
  const aturMode = (m) => {
    mode = m;
    dlg.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
    const ph = t(m === "tanya" ? "tny.placeholder" : "cari.placeholder");
    isi.placeholder = ph; isi.setAttribute("aria-label", ph);
    const tn = m === "tanya";
    chipsEl.hidden = hasil.hidden = penuh.hidden = tn; panelT.hidden = !tn;
    if (tn) { if (!kartu) awalTanya(); } else if (norm(isi.value)) gambar(); else awal();
    isi.focus();
  };
  const kirimTanya = async () => {
    const q = isi.value.trim(); if (q.length < 5) return;
    ctl?.abort(); ctl = new AbortController();
    panelT.innerHTML = `<div class="jm-hantu" role="status" aria-label="${esc(t("jm.memuat"))}"><i></i><i></i><i></i></div>`;
    try {
      const m = await import("/inti/tanya_kartu.js"); m.muatGayaTanya();
      try { kartu = m.kartuJawab(await m.tanyaKirim(q, ctl.signal)); panelT.replaceChildren(kartu); }
      catch (e) { if (e.name !== "AbortError") panelT.innerHTML = m.tanyaRusak(e); }
    } catch { panelT.innerHTML = `<p class="jm-cari-info" role="alert">${esc(t("cari.galat"))}</p>`; }
  };
  const gambar = () => {
    const q = isi.value, ada = !!norm(q), per = ada ? cari(indeks, q, Infinity) : new Map();
    /* satu tokoh bisa tercatat dua kali (direktori + pengurus): tampilkan sekali */
    if (per.has("orang")) { const lihat = new Set(); per.set("orang", per.get("orang").filter((x) => { const k = norm(x.judul); return !lihat.has(k) && lihat.add(k); })); }
    dlg.classList.toggle("jm-cari-ada", ada);
    penuh.href = ada ? "/cari?q=" + encodeURIComponent(q.trim()) : "/cari";
    const tot = (g) => (per.get(g) || []).length;
    chips.forEach((c) => { const g = c.dataset.fil, n = g === "semua" ? [...per.values()].reduce((x, y) => x + y.length, 0) : tot(g); c.querySelector("[data-n]").textContent = ada ? angka(n) : ""; c.hidden = ada && g !== "semua" && !n && g !== fil; });
    clearTimeout(tCatat); tCatat = setTimeout(() => catatCari(q), 1500);
    if (!ada) { awal(); return; }
    const gr = GRUP.filter(([g]) => per.has(g) && (fil === "semua" || fil === g));
    if (!gr.length) { hasil.innerHTML = `<p class="jm-cari-info">${ikon("cari2", 28)}<span>${esc(t(sedangMuat ? "cari.memuat" : "cari.kosong", { q }))}</span></p>`; aktif = -1; return; }
    let n = 0;
    const frag = document.createDocumentFragment();
    for (const [g, kunci, ik] of gr) {
      const sem = per.get(g), semua = fil !== "semua" || buka.has(g), tampil = sem.slice(0, semua ? BATAS_SEMUA : BATAS);
      const grup = document.createElement("div");
      grup.className = "jm-cari-grup"; grup.setAttribute("role", "group"); grup.setAttribute("aria-label", t(kunci));
      grup.innerHTML = `<h3>${ikon(ik, 16)}<span>${esc(t(kunci))}</span><em>${angka(sem.length)}</em>${sem.length > tampil.length && !semua ? `<button type="button" class="jm-cari-semua" data-semua="${g}">${esc(t("cari.semua", { n: angka(sem.length) }))}</button>` : ""}</h3>`;
      for (const it of tampil) grup.append(barisCari(it, q, { ik, logo, id: "jm-cari-" + n++ }));
      frag.append(grup);
    }
    hasil.replaceChildren(frag);
    pilih(0);
  };
  hasil.addEventListener("error", (e) => { if (e.target.tagName === "IMG" && logo && !e.target.dataset.cad) { e.target.dataset.cad = "1"; e.target.src = logo.GEDUNG; } }, true);
  isi.addEventListener("input", () => { if (mode === "tanya") return; clearTimeout(tunda); tunda = setTimeout(() => nanti(gambar), 120); });
  isi.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); pilih(aktif + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); pilih(aktif - 1); }
    else if (e.key === "Enter" && mode === "tanya") { e.preventDefault(); kirimTanya(); }
    else if (e.key === "Enter") { const o = opsi()[aktif]; if (o && !e.shiftKey) { e.preventDefault(); o.click(); } else if (norm(isi.value)) { e.preventDefault(); simpan(isi.value); location.href = penuh.href; } }
  });
  dlg.addEventListener("click", (e) => {
    const c = e.target, md = c.closest?.("[data-mode]"), tq = c.closest?.("[data-tq]"), f = c.closest?.("[data-fil]"), s = c.closest?.("[data-semua]"), q = c.closest?.("[data-q]");
    if (c === dlg || c.closest(".jm-cari-tutup")) dlg.close();
    else if (md) aturMode(md.dataset.mode);
    else if (tq) { isi.value = tq.dataset.tq; kirimTanya(); }
    else if (f) { fil = f.dataset.fil; buka.clear(); chips.forEach((x) => x.setAttribute("aria-pressed", String(x === f))); nanti(gambar); }
    else if (s) { buka.add(s.dataset.semua); nanti(gambar); }
    else if (q) { isi.value = q.dataset.q; isi.focus(); gambar(); }
    else if (c.closest("[data-hapus]")) { lupa(); gambar(); }
    else if (c.closest("a")) { if (mode === "cari") simpan(isi.value); dlg.close(); }
  });
  dlg.addEventListener("close", () => { document.documentElement.classList.remove("jm-cari-buka"); });
  let sedangMuat = true;
  const susul = () => nanti(() => { if (norm(isi.value)) gambar(); });
  dlg.buka = async () => {
    if (!dlg.open) dlg.showModal();
    isi.focus(); isi.select();
    if (!norm(isi.value)) awal();
    try { await muatSemua(susul); sedangMuat = false; gambar(); } catch (err) { sedangMuat = false; pesan("cari.galat", true); }
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
