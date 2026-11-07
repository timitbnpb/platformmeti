/* Sensus organisasi (tab Organisasi di /direktori): kepala terbelah, 5 ubin, cari, chip, tabel berpaginasi, laci profil ringkas.
   Perhitungan di /inti/org_sensus.js (dipakai juga profil /o/<id>). Chrome kontrol berubah sinkron; tabel dirender sesudah satu bingkai (nanti). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, nanti, debounce, hantuHtml } from "/inti/umum.js";
import { logoOrg } from "/inti/logo_org.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { muatSensus, TEK_PROYEK, NORM } from "/inti/org_sensus.js";

const PER = 25;
const SARING = ["proyek", "aplsi", "situs", "anak"];
const saringFn = { proyek: (r) => r.nProy > 0, aplsi: (r) => r.aplsi, situs: (r) => !!r.o.situs, anak: (r) => !r.anak };
const dim = (alasanKunci) => `<span class="so-dim" title="${esc(t(alasanKunci))}">-</span>`;
const infoIk = (kunci, p) => `<span class="so-ii" tabindex="0" role="img" title="${esc(t(kunci, p))}" aria-label="${esc(t(kunci, p))}">${ikon("info", 14)}</span>`;
const JENIS = { swasta: ["swasta", "koperasi"], bumn: ["bumn"], pemerintah: ["kementerian-lembaga", "pemda"], kampus: ["perguruan-tinggi", "think-tank"], asosiasi: ["asosiasi", "ormawa"], pendana: ["keuangan", "donor", "internasional"], lsm: ["lsm-yayasan"] };
const IKJ = { swasta: "gedung", bumn: "bintang", pemerintah: "palu", kampus: "wisuda", asosiasi: "orang", pendana: "kalkulator", lsm: "kajian" };
const jenisDari = (o) => Object.keys(JENIS).find((k) => JENIS[k].includes(o.kategori?.kode)) || "swasta";
const IKF = { proyek: "proyek", aplsi: "perisai", situs: "tautan", anak: "rantai" };
const namaSegSek = (id) => (id === "biomassa-sampah" ? t("so.sek.sampah") : id === "lintas" ? t("so.sek.lintas_s") : t("an.tek." + id));
const ikSek = (id) => IKON_TEK[id] || ikon(id === "lintas" ? "analisis" : "gedung", 16);
const sekPil = (id) => `<span class="so-sk so-w-${esc(id)}">${IKON_TEK[id] || ikon(id === "lintas" ? "analisis" : "gedung", 16)}<span>${esc(id === "lintas" ? namaSek(id) : namaSegSek(id))}</span></span>`;
const namaSek = (id) => (id === "lain" || id === "lintas" ? t("so.sek." + id) : t("an.tek." + id));
const logoHtml = (r, k = "so-lg") => { const u = logoOrg(r.id, r.nm, r.o.logo)[0]; return `<span class="${k}">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-ini="${esc(ini(r.nm))}">` : esc(ini(r.nm))}</span>`; };
const ini = (n) => String(n || "?").replace(/^(PT|CV|Yayasan|Pemerintah|Kementerian)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("");

export async function bangunSensus(akar) {
  akar.innerHTML = `<div class="so">${hantuHtml(5)}</div>`;
  let S;
  try { S = await muatSensus(); } catch { akar.innerHTML = `<div class="jm-kosong" role="alert">${ikon("info", 32)}<p>${esc(t("so.galat"))}</p></div>`; return; }
  const N = S.baris.length, tgl = tanggal(S.tgl), tglP = tanggal(S.tglProyek);
  const proyekUnik = new Map(); let mwUnik = 0;
  for (const r of S.baris) for (const p of r.ps) if (!proyekUnik.has(p.id)) { proyekUnik.set(p.id, p); mwUnik += (p.kapasitas || []).find((c) => /^MWp?$/.test(c.satuan) && Number.isFinite(c.nilai))?.nilai || 0; }
  const mwSemua = S.proyek.baris.reduce((s, p) => s + ((p.kapasitas || []).find((c) => /^MWp?$/.test(c.satuan) && Number.isFinite(c.nilai))?.nilai || 0), 0);
  const provSemua = new Set(S.proyek.baris.map((p) => p.lokasi?.provinsi).filter(Boolean)).size;
  const provTertaut = new Set([...proyekUnik.values()].map((p) => p.lokasi?.provinsi).filter(Boolean)).size;
  const nSitus = S.baris.filter(saringFn.situs).length;
  const cacahSek = new Map(); for (const r of S.baris) cacahSek.set(r.sek, (cacahSek.get(r.sek) || 0) + 1);
  const sekAda = [...TEK_PROYEK, "lintas"].filter((k) => cacahSek.has(k)).sort((a, b) => cacahSek.get(b) - cacahSek.get(a));
  const st = { q: "", sek: "", jenis: "", f: new Set(), urut: { k: "rank", arah: 1 }, hal: 1 };
  let hasil = S.baris;

  const ubin = (ik, nilai, label, sub, tip = "") => `<li class="so-ub"><span class="so-ub-ik">${ikon(ik, 20)}</span><div class="so-ub-t"><p class="so-ub-a"><b>${esc(nilai)}</b><span>${esc(label)}</span>${tip}</p><small>${esc(sub)}</small></div></li>`;
  const tipMin = infoIk("so.tip.min");
  akar.innerHTML = `<section class="so" aria-labelledby="soJudul">
    <header class="so-kepala">
      <div class="so-kiri"><p class="so-ey">${ikon("direktori", 16)}<span>${esc(t("so.ey"))}</span></p><h2 id="soJudul">${esc(t("so.judul"))}</h2><p class="so-sub">${esc(t("so.sub"))}</p></div>
      <div class="so-kanan">
        <div class="so-lead-baris"><p class="so-lead">${esc(t("so.lead", { n: angka(N), p: angka(proyekUnik.size), mw: angka(mwUnik), v: angka(provTertaut) }))}</p>
        <div class="so-aksi"><button type="button" class="so-tb so-tb-utama" id="soTelusuri">${ikon("cari", 18)}${esc(t("so.telusuri"))}</button><button type="button" class="so-tb" id="soPeta">${ikon("peta", 18)}${esc(t("so.peta"))}</button><a class="so-tb" href="/sektor">${ikon("analisis", 18)}${esc(t("so.sektor"))}</a></div></div>
        <blockquote class="so-kutip">${esc(t("so.kutip", { tgl, n: angka(N), s: angka(nSitus), p: angka(S.baris.filter(saringFn.proyek).length) }))}</blockquote>
      </div>
    </header>
    <ul class="so-ubin" id="soUbin">
      ${ubin("gedung", angka(N), t("so.u.org"), t("so.dari", { x: angka(N), n: angka(N) }))}
      ${ubin("proyek", angka(proyekUnik.size), t("so.u.proyek"), t("so.dari_proyek", { x: angka(proyekUnik.size), n: angka(S.proyek.baris.length) }), tipMin)}
      ${ubin("analisis", angka(mwUnik), t("so.u.mw"), t("so.dari_mw", { x: angka(mwUnik), n: angka(mwSemua) }), tipMin)}
      ${ubin("wilayah", angka(provTertaut), t("so.u.prov"), t("so.dari", { x: angka(provTertaut), n: angka(provSemua) }))}
      ${ubin("tautan", angka(nSitus), t("so.u.situs"), t("so.dari", { x: angka(nSitus), n: angka(N) }))}
    </ul>
    <label class="so-cari">${ikon("cari", 18)}<input type="search" id="soQ" placeholder="${esc(t("so.cari"))}" aria-label="${esc(t("so.cari"))}" autocomplete="off" maxlength="80"><span class="so-hitung" id="soHitung" aria-live="polite"></span></label>
    <div class="so-seg" id="soSek" role="group" aria-label="${esc(t("so.sektor_label"))}"></div>
    <div class="so-seg" id="soJenis" role="group" aria-label="${esc(t("so.jenis_label"))}"></div>
    <div class="so-bar"><div class="so-sakelar" id="soF" role="group" aria-label="${esc(t("so.saring_label"))}"></div></div>
    <div class="so-tab" id="soTab"></div>
    <div id="soPag"></div>
    <p class="so-kaki">${esc(t("so.kaki", { tgl, tglp: tglP }))}</p>
    <dialog class="so-laci" id="soLaci" aria-labelledby="soLaciJ"></dialog>
  </section>`;
  const $ = (id) => akar.querySelector("#" + id);

  const cocokQ = (r) => !st.q || NORM(r.nm + " " + (r.o.singkatan || "") + " " + (r.o.nama_lain || []).join(" ")).includes(st.q);
  const cocokF = (r) => [...st.f].every((k) => saringFn[k](r));
  const cocok = (r) => cocokQ(r) && cocokF(r) && (!st.sek || r.sek === st.sek) && (!st.jenis || jenisDari(r.o) === st.jenis);
  const seg = (atr, kini, k, ik, kls, label, n) => `<button type="button" class="so-sg ${kls}" data-${atr}="${esc(k)}" aria-pressed="${kini === k}">${ik}<span class="so-sl">${esc(label)}</span><span class="so-n">${esc(angka(n))}</span></button>`;
  function hitungChip() {
    const dasar = S.baris.filter((r) => cocokQ(r) && cocokF(r));
    const sj = dasar.filter((r) => !st.jenis || jenisDari(r.o) === st.jenis), ss = dasar.filter((r) => !st.sek || r.sek === st.sek);
    $("soSek").innerHTML = seg("sek", st.sek, "", ikon("tabel", 16), "so-w-semua", t("so.semua"), sj.length) + sekAda.map((k) => seg("sek", st.sek, k, ikSek(k), "so-w-" + k, namaSegSek(k), sj.filter((r) => r.sek === k).length)).join("");
    $("soJenis").innerHTML = seg("jenis", st.jenis, "", ikon("jenis", 16), "so-j0", t("so.j.semua"), ss.length) + Object.keys(JENIS).map((k, i) => seg("jenis", st.jenis, k, ikon(IKJ[k], 16), "so-j" + (i % 5 + 1), t("so.j." + k), ss.filter((r) => jenisDari(r.o) === k).length)).join("");
    const f0 = S.baris.filter((r) => cocokQ(r) && (!st.sek || r.sek === st.sek) && (!st.jenis || jenisDari(r.o) === st.jenis));
    $("soF").innerHTML = SARING.map((k) => `<button type="button" class="so-sw" data-f="${k}" aria-pressed="${st.f.has(k)}">${ikon(IKF[k], 16)}<span>${esc(t("so.f." + k))}</span><span class="so-n">${esc(angka(f0.filter(saringFn[k]).length))}</span></button>`).join("");
  }
  const kunciUrut = { rank: (r) => r.rank, nm: (r) => r.nm, nProy: (r) => -r.nProy, mw: (r) => -r.mw };
  function render() {
    hasil = S.baris.filter(cocok);
    const { k, arah } = st.urut, f = kunciUrut[k];
    hasil = [...hasil].sort((a, b) => { const x = f(a), y = f(b); return (typeof x === "string" ? x.localeCompare(y) : x - y) * arah || a.rank - b.rank; });
    const hal = Math.min(st.hal, Math.max(1, Math.ceil(hasil.length / PER))), a = (hal - 1) * PER;
    st.hal = hal;
    $("soHitung").textContent = t("so.tampil", { n: angka(hasil.length) });
    $("soUbin").querySelector("small").textContent = t("so.dari", { x: angka(hasil.length), n: angka(N) });
    const info = `<details class="so-i"><summary aria-label="${esc(t("so.info"))}">${ikon("info", 16)}</summary><span class="so-pop">${esc(t("so.tip.kolom", { tgl: tglP }))}</span></details>`;
    const th = (kk, kunci, num, inf) => `<th scope="col" class="${num ? "so-num" : ""}" aria-sort="${st.urut.k === kk ? (st.urut.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut so-th" data-urut="${kk}">${esc(t(kunci))}</button>${inf ? info : ""}</th>`;
    $("soTab").innerHTML = hasil.length ? `<table class="jm-tabel so-tabel"><caption class="so-sr">${esc(t("so.caption"))}</caption><colgroup><col class="so-c-no"><col class="so-c-org"><col class="so-c-sek"><col class="so-c-kota"><col class="so-c-n"><col class="so-c-n"></colgroup><thead><tr><th scope="col" class="so-no">${esc(t("so.c.no"))}</th>${th("nm", "so.c.org")}<th scope="col">${esc(t("so.c.sektor"))}</th><th scope="col">${esc(t("so.c.kota"))}</th>${th("nProy", "so.c.proyek", 1, 1)}${th("mw", "so.c.mw", 1, 1)}</tr></thead><tbody>${hasil.slice(a, a + PER).map((r, i) => baris(r, a + i + 1)).join("")}</tbody></table>`
      : `<div class="jm-kosong">${ikon("cari", 32)}<p>${esc(t("so.kosong"))}</p><button type="button" class="so-tb" id="soReset">${esc(t("so.reset"))}</button></div>`;
    $("soPag").innerHTML = paginasiHtml({ hal, total: hasil.length, per: PER, satuan: "so.satuan" });
  }
  const lencana = (r) => [r.aplsi && `<span class="so-len">${esc(t("so.len.aplsi"))}</span>`, r.o.meti && `<span class="so-len">${esc(t("pf.meti"))}</span>`, r.anak && `<span class="so-len so-len-pas">${esc(t("so.len.anak"))}</span>`].filter(Boolean).join("");
  const angkaSel = (n, tipKosong) => (n ? `<b>${esc(angka(n))}</b>` : dim(tipKosong));
  function baris(r, no) {
    return `<tr data-id="${esc(r.id)}"><td class="so-no" data-label="${esc(t("so.c.no"))}">${angka(no)}</td><td class="so-org" data-label="${esc(t("so.c.org"))}"><button type="button" class="so-nm" data-buka="${esc(r.id)}">${logoHtml(r)}<span class="so-nt"><span class="so-nn">${esc(r.nm)}</span>${lencana(r) ? `<span class="so-lens">${lencana(r)}</span>` : ""}</span></button></td>`
      + `<td data-label="${esc(t("so.c.sektor"))}">${sekPil(r.sek)}</td><td data-label="${esc(t("so.c.kota"))}">${r.o.lokasi?.kota ? esc(r.o.lokasi.kota) : dim("so.tip.tanpa_kota")}</td>`
      + `<td class="so-num" data-label="${esc(t("so.c.proyek"))}">${angkaSel(r.nProy, "so.tip.tanpa_proyek")}</td><td class="so-num" data-label="${esc(t("so.c.mw"))}">${angkaSel(Math.round(r.mw), r.nProy ? "so.tip.mw_tanpa" : "so.tip.tanpa_mw")}</td></tr>`;
  }
  const segar = () => { hitungChip(); nanti(render); };

  /* ---- laci profil ---- */
  const laci = $("soLaci"); let idx = 0;
  function isiLaci() {
    const r = hasil[idx]; if (!r) return;
    const fak = [[t("so.f.kategori"), r.o.kategori?.label], [t("so.c.kota"), r.o.lokasi?.kota], [t("so.u.proyek"), r.nProy ? angka(r.nProy) : ""], [t("so.u.mw"), r.mw ? angka(Math.round(r.mw)) + " MW" : ""], [t("so.f.tahun"), r.o.tahun_berdiri], [t("so.f.skor"), angka(r.yakin.skor, { desimal: 2 })]];
    laci.innerHTML = `<div class="so-lc-kepala"><span class="so-lc-pos">${esc(t("so.pos", { k: angka(idx + 1), n: angka(hasil.length) }))}</span><button type="button" class="so-tb" id="soLcTutup">${ikon("silang", 18)}${esc(t("so.tutup"))}</button></div>
      <div class="so-lc-isi"><div class="so-lc-nama">${logoHtml(r, "so-lg so-lg-b")}<div><h3 id="soLaciJ">${esc(r.nm)}</h3><p class="so-sub">${esc(namaSek(r.sek))}${r.o.lokasi?.kota ? ", " + esc(r.o.lokasi.kota) : ""}</p></div></div>
      <p class="so-lc-rank"><span class="so-pil">${esc(t("so.rank", { k: angka(r.rank), n: angka(N) }))}</span>${lencana(r)}</p>
      <dl class="so-lc-fakta">${fak.map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${v || v === 0 ? esc(v) : '<span class="so-dim">-</span>'}</dd></div>`).join("")}</dl>
      ${r.o.deskripsi ? `<p class="so-lc-desk">${esc(String(r.o.deskripsi).slice(0, 320))}</p>` : ""}</div>
      <div class="so-lc-kaki"><button type="button" class="so-tb" id="soLcPrev"${idx ? "" : " disabled"}>${ikon("panah-kiri", 18)}${esc(t("so.sebelumnya"))}</button><a class="so-tb so-tb-utama" href="/o/${esc(r.id)}">${ikon("direktori", 18)}${esc(t("so.profil"))}</a><button type="button" class="so-tb" id="soLcNext"${idx < hasil.length - 1 ? "" : " disabled"}>${esc(t("so.berikutnya"))}${ikon("panah-kanan", 18)}</button></div>`;
  }
  const bukaLaci = (id) => { idx = Math.max(0, hasil.findIndex((r) => r.id === id)); isiLaci(); if (!laci.open) laci.showModal(); };

  /* ---- peristiwa ---- */
  akar.addEventListener("click", (e) => {
    const sel = (s) => e.target.closest(s);
    let b;
    if ((b = sel("[data-sek]"))) { st.sek = b.dataset.sek; st.hal = 1; akar.querySelectorAll("[data-sek]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); nanti(() => { hitungChip(); render(); }); }
    else if ((b = sel("[data-jenis]"))) { st.jenis = b.dataset.jenis; st.hal = 1; akar.querySelectorAll("[data-jenis]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); nanti(() => { hitungChip(); render(); }); }
    else if ((b = sel("[data-f]"))) { const k = b.dataset.f; st.f.has(k) ? st.f.delete(k) : st.f.add(k); st.hal = 1; b.setAttribute("aria-pressed", String(st.f.has(k))); segar(); }
    else if ((b = sel("[data-urut]"))) { const k = b.dataset.urut; st.urut = st.urut.k === k ? { k, arah: -st.urut.arah } : { k, arah: 1 }; st.hal = 1; akar.querySelectorAll("th[aria-sort]").forEach((th) => th.setAttribute("aria-sort", th.contains(b) ? (st.urut.arah > 0 ? "ascending" : "descending") : "none")); nanti(render); }
    else if ((b = sel("[data-hal]")) && !b.disabled) { st.hal = +b.dataset.hal; sorotHalaman(b, st.hal); nanti(() => { render(); $("soTab").scrollIntoView({ block: "nearest" }); }); }
    else if ((b = sel("[data-buka]"))) bukaLaci(b.dataset.buka);
    else if (sel(".so-i")) { /* popover info kolom: native details */ }
    else if ((b = sel("tr[data-id]"))) bukaLaci(b.dataset.id);
    else if (sel("#soReset")) { st.q = ""; st.sek = ""; st.jenis = ""; st.f.clear(); $("soQ").value = ""; segar(); }
    else if (sel("#soTelusuri")) { $("soQ").scrollIntoView({ block: "center" }); $("soQ").focus(); }
    else if (sel("#soPeta")) document.querySelector('#akLS [data-v="peta"]')?.click();
    else if (sel("#soLcTutup")) laci.close();
    else if (sel("#soLcPrev") && idx > 0) { idx--; isiLaci(); laci.querySelector("#soLcNext")?.focus(); }
    else if (sel("#soLcNext") && idx < hasil.length - 1) { idx++; isiLaci(); laci.querySelector("#soLcPrev")?.focus(); }
    else if (e.target === laci) laci.close();
  });
  $("soQ").addEventListener("input", debounce((e) => { st.q = NORM(e.target.value); st.hal = 1; segar(); }));
  akar.addEventListener("error", (e) => { const im = e.target; if (im.tagName === "IMG" && im.dataset.ini !== undefined) im.replaceWith(document.createTextNode(im.dataset.ini)); }, true);
  laci.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" && idx > 0 && e.target.tagName !== "INPUT") { idx--; isiLaci(); } else if (e.key === "ArrowRight" && idx < hasil.length - 1) { idx++; isiLaci(); } });
  document.addEventListener("click", (e) => akar.querySelectorAll(".so-i[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; }));
  hitungChip(); render();
}
