/* /admin: tab Akun (JM-B05) dan tab Jejak (JM-B07). Hak ditegakkan di server; layar hanya tidak menampilkan yang bukan haknya.
   INP: chrome (tab aktif, nilai filter, tombol) berubah seketika di handler; render tabel menyusul lewat nanti(). */
import { t, ada, angka, tanggal, tanggalDariUnix, jam } from "/i18n.js";
import { esc, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { panelAnggota } from "/admin_anggota.js";
import { panelAgenda } from "/admin_agenda.js";
import { panelEvent } from "/admin_event.js";
import { panelKoreksi, panelAudit } from "/admin_koreksi.js";
import { panelPortal } from "/admin_portal.js";
import { panelKesehatan } from "/admin_kesehatan.js";
import { panelStatistik } from "/admin_statistik.js";
import { panelPustaka } from "/admin_pustaka.js";
import { panelBeranda } from "/admin_beranda.js";
import { panelKta } from "/admin_kta.js";
import { panelLangganan } from "/admin_langganan.js";
import { panelPesan } from "/admin_pesan.js";
import { panelMetiWilayah } from "/admin_meti_wilayah.js";
import { teksLencana } from "/inti/pesan_umum.js";

const saya = await mulaiHalaman();
const $ = (id) => document.getElementById(id);
const isi = $("isi");
const dlg = $("dlg");

const PERAN = ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"];
const STATUS = ["menunggu", "aktif", "nonaktif"];
const BARIS_HAL = 50;
const STAF = ["kurator", "admin", "super"];

if (!saya.masuk) {
  location.replace("/masuk?ke=" + encodeURIComponent("/admin"));
} else if (!STAF.includes(saya.peran)) {
  isi.innerHTML = kosongHtml("jm.akses.ditolak");
} else {
  jalan();
}

function jalan() {
  const sa = saya.peran === "super";
  const peranBisa = sa ? PERAN : PERAN.filter((p) => p !== "super");
  // kurator: hanya tab Anggota (tab Akun dan Jejak tidak ada di DOM; server tetap menolak). CSV hanya admin dan super.
  const adm = ["admin", "super"].includes(saya.peran);
  const TAB = [...(adm ? [["akun", "admin.tab.akun", "orang"]] : []), ["koreksi", "admin.tab.koreksi", "ubah"], ...(adm ? [["jejak", "admin.tab.jejak", "jejak"]] : []), ["kesehatan", "admin.tab.kesehatan", "centang"],
    ...(adm ? [["statistik", "admin.tab.statistik", "analisis"], ["beranda", "admin.tab.beranda", "beranda"], ["pustaka", "adm.pu.tab", "unduh"]] : []), ["anggota", "adm.anggota.tab", "daftar"], ...(adm ? [["kta", "adm.kta.tab", "kartu"]] : []), ["agenda", "adm.agenda.tab", "kalender"], ...(adm ? [["event", "adm.event.tab", "kalender-bintang"]] : []), ...(adm ? [["langganan", "admin.tab.langganan", "berita"], ["pesan", "admin.tab.pesan", "info"], ["metiwilayah", "adm.mw.tab", "wilayah"], ["portal", "ap.tab", "centang"]] : [])];
  let tab = TAB[0][0];

  const A = { cari: "", peran: "", status: "", hal: 1, baris: [], galat: null, ctl: null };

  const daftarDari = (d, kunci) => (Array.isArray(d) ? d : d && (d[kunci] || d.data || d.baris)) || [];
  const opsi = (daftar, awalan, pilih, semua) =>
    (semua ? `<option value="">${esc(t(semua))}</option>` : "") +
    daftar.map((v) => `<option value="${v}"${v === pilih ? " selected" : ""}>${esc(t(awalan + v))}</option>`).join("");
  const kabari = (jenis, teks) => { $("status").innerHTML = teks ? pesanHtml(jenis, teks) : ""; };

  /* ---------- rangka dan tab ---------- */

  function rangka() {
    isi.innerHTML = `
      <div class="jm-tab" role="tablist" aria-label="${esc(t("admin.tab.label"))}">
        ${TAB.map(([k, kunci, ik]) => `<button type="button" role="tab" id="tab-${k}" data-tab="${k}" aria-selected="${k === tab}" aria-controls="panel" tabindex="${k === tab ? 0 : -1}">${ikon(ik, 18)}<span>${esc(t(kunci))}</span></button>`).join("")}
      </div>
      <section class="jm-kartu" id="panel" role="tabpanel" aria-labelledby="tab-${tab}"></section>
      <div class="jm-adm-status" id="status" aria-live="polite"></div>`;
    $("panel").addEventListener("click", klikPanel);
    $("panel").addEventListener("input", inputPanel);
    $("panel").addEventListener("change", ubahPanel);
    $("panel").addEventListener("submit", kirimPanel);
    isi.querySelector(".jm-tab").addEventListener("click", klikTab);
    isi.querySelector(".jm-tab").addEventListener("keydown", tombolTab);
    bukaTab(tab);
    lencanaTab();
  }

  // lencana jumlah pesan belum dibaca di tab Pesan; tab Pesan memberi kabar lewat peristiwa "pesan-belum"
  let belumPesan = 0;
  function lencanaTab() {
    const b = document.getElementById("tab-pesan");
    if (!b) return;
    b.querySelector(".ps-lencana")?.remove();
    if (belumPesan > 0) b.insertAdjacentHTML("beforeend", `<span class="ps-lencana ps-lencana-tab">${teksLencana(belumPesan)}</span>`);
  }
  if (adm) {
    document.addEventListener("pesan-belum", (e) => { belumPesan = e.detail; lencanaTab(); });
    api("/api/admin/pesan-belum").then((d) => { belumPesan = d.belum || 0; lencanaTab(); document.dispatchEvent(new CustomEvent("pesan-belum", { detail: belumPesan })); }).catch(() => {});
  }

  function klikTab(e) {
    const b = e.target.closest("[data-tab]");
    if (!b || b.getAttribute("aria-selected") === "true") return;
    for (const x of isi.querySelectorAll("[data-tab]")) { // chrome urgent
      const aktif = x === b;
      x.setAttribute("aria-selected", String(aktif));
      x.tabIndex = aktif ? 0 : -1;
    }
    nanti(() => bukaTab(b.dataset.tab));
  }
  function tombolTab(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const semua = [...isi.querySelectorAll("[data-tab]")];
    const i = semua.indexOf(document.activeElement);
    if (i < 0) return;
    const baru = semua[(i + (e.key === "ArrowRight" ? 1 : semua.length - 1)) % semua.length];
    baru.focus();
    baru.click();
  }

  function bukaTab(k) {
    tab = k;
    kabari("ok", "");
    $("panel").setAttribute("aria-labelledby", "tab-" + k);
    const P = $("panel");
    if (k === "akun") panelAkun(); else if (k === "jejak") panelAudit(P); else if (k === "koreksi") panelKoreksi(P); else if (k === "kesehatan") panelKesehatan(P);
    else if (k === "statistik") panelStatistik(P); else if (k === "pustaka") panelPustaka(P); else if (k === "beranda") panelBeranda(P); else if (k === "agenda") panelAgenda(P, saya); else if (k === "kta") panelKta(P); else if (k === "event") panelEvent(P); else if (k === "langganan") panelLangganan(P); else if (k === "pesan") panelPesan(P); else if (k === "metiwilayah") panelMetiWilayah(P); else if (k === "portal") panelPortal(P); else panelAnggota(P, { boleh: adm, kabari });
  }

  /* ---------- tab Akun ---------- */

  const kolomCakupan = (id, nilai) => `
    <div class="jm-medan" id="${id}Kolom"${nilai === undefined ? " hidden" : ""}>
      <label for="${id}">${esc(t("admin.prov"))}</label>
      <input class="jm-isian" id="${id}" inputmode="numeric" pattern="[0-9]{2}" maxlength="2" autocomplete="off" value="${esc(nilai || "")}">
    </div>`;

  function panelAkun() {
    $("panel").innerHTML = `
      <div class="jm-bar">
        <div class="jm-medan"><label class="sr" for="aCari">${esc(t("admin.cari"))}</label>
          <input class="jm-isian" id="aCari" type="search" autocomplete="off" placeholder="${esc(t("admin.cari"))}" value="${esc(A.cari)}"></div>
        <select data-ikon="orang" class="jm-pilih" id="aPeran" aria-label="${esc(t("admin.f.peran"))}">${opsi(PERAN, "peran.", A.peran, "admin.f.semua_peran")}</select>
        <select data-ikon="status" class="jm-pilih" id="aStatus" aria-label="${esc(t("admin.f.status"))}">${opsi(STATUS, "status.", A.status, "admin.f.semua_status")}</select>
        <button type="button" class="jm-tbl jm-tbl-utama" id="aBuat" aria-expanded="false" aria-controls="aForm">${ikon("tambah", 18)}${esc(t("admin.buat"))}</button>
      </div>
      <form class="jm-adm-form" id="aForm" novalidate hidden>
        <div class="jm-medan"><label for="fSurel">${esc(t("masuk.surel"))}</label><input class="jm-isian" id="fSurel" type="email" autocomplete="off" autocapitalize="none" spellcheck="false" required></div>
        <div class="jm-medan"><label for="fNama">${esc(t("admin.nama"))}</label><input class="jm-isian" id="fNama" autocomplete="off" maxlength="120" required></div>
        <div class="jm-medan"><label for="fPeran">${esc(t("admin.f.peran"))}</label><select data-ikon="orang" class="jm-pilih" id="fPeran">${opsi(peranBisa, "peran.", "anggota")}</select></div>
        ${kolomCakupan("fProv")}
        <div class="jm-lebar" id="fPesan"></div>
        <div class="jm-aksi jm-lebar"><button type="submit" class="jm-tbl jm-tbl-utama" id="fKirim">${esc(t("admin.buat"))}</button><button type="button" class="jm-tbl" data-aksi="batal-buat">${esc(t("jm.batal"))}</button></div>
      </form>
      <div id="aTaut"></div>
      <div id="aDaftar" aria-live="polite"></div>
      <div class="jm-hal" id="aHal"></div>`;
    muatAkun();
  }

  async function muatAkun() {
    if (A.ctl) A.ctl.abort();
    A.ctl = new AbortController();
    const sinyal = A.ctl.signal;
    $("aDaftar").innerHTML = hantuHtml(5);
    const q = new URLSearchParams({ hal: String(A.hal) });
    if (A.cari) q.set("cari", A.cari);
    if (A.peran) q.set("peran", A.peran);
    if (A.status) q.set("status", A.status);
    try {
      A.baris = daftarDari(await api("/api/admin/akun?" + q, { signal: sinyal }), "akun");
      A.galat = null;
    } catch (e) {
      if (e.name === "AbortError") return;
      A.galat = e.kode || "umum";
      A.baris = [];
    }
    nanti(() => { if (tab === "akun") gambarAkun(); });
  }

  const pil = (status) => `<span class="jm-pil ${status === "aktif" ? "jm-pil-ok" : status === "menunggu" ? "jm-pil-warn" : "jm-pil-bad"}">${esc(ada("status." + status) ? t("status." + status) : status)}</span>`;
  const labelPeran = (p) => (ada("peran." + p) ? t("peran." + p) : p);

  function gambarAkun() {
    const daftar = $("aDaftar");
    if (!daftar) return;
    if (A.galat) daftar.innerHTML = galatHtml(A.galat);
    else if (!A.baris.length) daftar.innerHTML = kosongHtml("jm.kosong.cocok", A.cari || A.peran || A.status ? { data: "reset", kunci: "jm.kosong.reset" } : null);
    else {
      const baris = A.baris.map((r) => {
        const kunciSA = r.peran === "super" && !sa; // Admin tidak mengubah akun super (server tetap menjaga)
        const aksi = [
          kunciSA ? "" : `<button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="peran" data-id="${esc(r.id)}">${ikon("ubah", 16)}${esc(t("admin.ubah_peran"))}</button>`,
          `<button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="taut" data-id="${esc(r.id)}">${ikon("tautan", 16)}${esc(t("admin.salin_taut"))}</button>`,
          kunciSA || r.status === "nonaktif" ? "" : `<button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-aksi="nonaktif" data-id="${esc(r.id)}">${ikon("blokir", 16)}${esc(t("admin.nonaktifkan"))}</button>`,
        ].join("");
        return `<tr>
          <td data-l="${esc(t("admin.k.akun"))}"><strong>${esc(r.nama)}</strong><small>${esc(r.surel)}</small></td>
          <td data-l="${esc(t("admin.f.peran"))}">${esc(labelPeran(r.peran))}${r.cakupan_prov ? `<small>${esc(t("admin.prov_n", { n: r.cakupan_prov }))}</small>` : ""}</td>
          <td data-l="${esc(t("admin.f.status"))}">${pil(r.status)}</td>
          <td class="jm-nowrap" data-l="${esc(t("admin.k.masuk"))}">${r.masuk_terakhir ? esc(tanggal(tanggalDariUnix(r.masuk_terakhir))) : "-"}</td>
          <td data-l="${esc(t("admin.k.aksi"))}"><div class="jm-sel-aksi">${aksi}</div></td></tr>`;
      }).join("");
      daftar.innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>
        <th scope="col">${esc(t("admin.k.akun"))}</th><th scope="col">${esc(t("admin.f.peran"))}</th><th scope="col">${esc(t("admin.f.status"))}</th><th scope="col">${esc(t("admin.k.masuk"))}</th><th scope="col">${esc(t("admin.k.aksi"))}</th>
        </tr></thead><tbody>${baris}</tbody></table></div>`;
    }
    halaman("aHal", A.hal, A.baris.length);
  }

  function halaman(id, hal, n) {
    const el = $(id);
    if (el) el.innerHTML = paginasiHtml({ hal, per: BARIS_HAL, n, ada: n >= BARIS_HAL, satuan: "jm.pag.u.akun" });
  }

  function tampilTaut(url) {
    const el = $("aTaut");
    if (!url) { el.innerHTML = pesanHtml("galat", galatTeks("umum")); return; }
    const penuh = /^https?:\/\//.test(url) ? url : url.startsWith("/") ? location.origin + url : `${location.origin}/aktivasi#t=${encodeURIComponent(url)}`;
    el.innerHTML = `<div class="jm-taut"><strong>${esc(t("admin.taut.judul"))}</strong><p class="jm-bantu">${esc(t("admin.taut.sekali"))}</p>
      <div class="jm-medan"><label class="sr" for="tautIsi">${esc(t("admin.taut.judul"))}</label><input class="jm-isian" id="tautIsi" readonly value="${esc(penuh)}"></div>
      <div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-aksi="salin">${ikon("salin", 18)}${esc(t("admin.salin_taut"))}</button><button type="button" class="jm-tbl" data-aksi="tutup-taut">${esc(t("jm.tutup"))}</button></div>
      <span class="jm-bantu" id="salinStatus" role="status"></span></div>`;
    $("tautIsi").select();
  }

  async function salin() {
    const k = $("tautIsi");
    k.select();
    let ok = false;
    try { await navigator.clipboard.writeText(k.value); ok = true; } catch (e) {}
    $("salinStatus").textContent = t(ok ? "admin.taut.tersalin" : "admin.taut.manual");
  }

  /* ---------- dialog ubah peran dan nonaktifkan ---------- */

  const cari = (id) => A.baris.find((r) => String(r.id) === String(id));

  function bukaDialog(html) { dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); }

  function dialogPeran(r) {
    bukaDialog(`<form class="jm-form" id="dForm" data-id="${esc(r.id)}" novalidate>
      <h2 id="dlgJudul">${esc(t("admin.ubah_peran"))}</h2><p class="jm-bantu">${esc(r.nama)}</p>
      <div id="dPesan"></div>
      <div class="jm-medan"><label for="dPeran">${esc(t("admin.f.peran"))}</label><select data-ikon="orang" class="jm-pilih" id="dPeran">${opsi(peranBisa, "peran.", r.peran)}</select></div>
      ${kolomCakupan("dProv", r.peran === "wilayah" ? r.cakupan_prov || "" : undefined)}
      <div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-utama">${esc(t("jm.simpan"))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></form>`);
  }
  function dialogNonaktif(r) {
    bukaDialog(`<form class="jm-form" id="nForm" data-id="${esc(r.id)}">
      <h2 id="dlgJudul">${esc(t("admin.nonaktifkan"))}</h2><p>${esc(t("admin.nonaktif.isi", { nama: r.nama }))}</p>
      <div id="dPesan"></div>
      <div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-bahaya">${esc(t("admin.nonaktifkan"))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></form>`);
  }

  async function kirimDialog(e) {
    e.preventDefault();
    const f = e.target;
    const tbl = f.querySelector('button[type="submit"]');
    let badan;
    if (f.id === "dForm") {
      const peran = $("dPeran").value;
      const prov = $("dProv").value.trim();
      if (peran === "wilayah" && !/^\d{2}$/.test(prov)) { $("dPesan").innerHTML = pesanHtml("galat", galatTeks("salah-masukan")); return; }
      badan = { peran, cakupan_prov: peran === "wilayah" ? prov : null };
    } else badan = { status: "nonaktif" };
    tbl.disabled = true;
    try {
      await api("/api/admin/akun/" + encodeURIComponent(f.dataset.id), { metode: "PATCH", badan });
      dlg.close();
      kabari("ok", t("admin.tersimpan"));
      muatAkun();
    } catch (err) {
      tbl.disabled = false;
      $("dPesan").innerHTML = pesanHtml("galat", galatTeks(err.kode || "umum"));
    }
  }
  dlg.addEventListener("submit", kirimDialog);
  dlg.addEventListener("click", (e) => { if (e.target.closest('[data-aksi="batal"]')) dlg.close(); });
  dlg.addEventListener("change", (e) => { if (e.target.id === "dPeran") $("dProvKolom").hidden = e.target.value !== "wilayah"; });

  /* ---------- penangan panel ---------- */

  const cariDebounce = debounce(() => { A.hal = 1; muatAkun(); });

  function inputPanel(e) {
    if (e.target.id === "aCari") { A.cari = e.target.value.trim(); cariDebounce(); }
  }
  function ubahPanel(e) {
    if (e.target.id === "aPeran") { A.peran = e.target.value; A.hal = 1; muatAkun(); }
    else if (e.target.id === "aStatus") { A.status = e.target.value; A.hal = 1; muatAkun(); }
    else if (e.target.id === "fPeran") $("fProvKolom").hidden = e.target.value !== "wilayah";
  }

  function klikPanel(e) {
    const b = e.target.closest("button");
    if (!b || tab !== "akun") return; // tab lain punya penangan sendiri
    const ke = A;
    if (b.dataset.hal) { ke.hal = +b.dataset.hal; sorotHalaman(b, ke.hal); muatAkun(); return; }
    switch (b.id === "aBuat" ? "buat" : b.dataset.aksi) {
      case "buat": {
        const form = $("aForm");
        const buka = form.hidden;
        form.hidden = !buka; // chrome urgent
        b.setAttribute("aria-expanded", String(buka));
        if (buka) $("fSurel").focus();
        break;
      }
      case "batal-buat": $("aForm").hidden = true; $("aBuat").setAttribute("aria-expanded", "false"); break;
      case "reset":
        A.cari = A.peran = A.status = ""; A.hal = 1; panelAkun();
        break;
      case "ulang": muatAkun(); break;
      case "peran": { const r = cari(b.dataset.id); if (r) dialogPeran(r); break; }
      case "nonaktif": { const r = cari(b.dataset.id); if (r) dialogNonaktif(r); break; }
      case "taut": buatTaut(b); break;
      case "salin": salin(); break;
      case "tutup-taut": $("aTaut").innerHTML = ""; break;
    }
  }

  async function buatTaut(b) {
    b.disabled = true;
    kabari("ok", "");
    try {
      const d = await api(`/api/admin/akun/${encodeURIComponent(b.dataset.id)}/aktivasi`, { metode: "POST" });
      tampilTaut(d && d.tautan_aktivasi);
      $("aTaut").scrollIntoView({ block: "nearest" });
    } catch (err) { kabari("galat", galatTeks(err.kode || "umum")); }
    b.disabled = false;
  }

  async function kirimPanel(e) {
    if (e.target.id !== "aForm") return;
    e.preventDefault();
    const peran = $("fPeran").value;
    const badan = { surel: $("fSurel").value.trim(), nama: $("fNama").value.trim(), peran };
    if (peran === "wilayah") badan.cakupan_prov = $("fProv").value.trim();
    if (!badan.surel.includes("@") || !badan.nama || (peran === "wilayah" && !/^\d{2}$/.test(badan.cakupan_prov))) {
      $("fPesan").innerHTML = pesanHtml("galat", galatTeks("salah-masukan"));
      return;
    }
    const kirim = $("fKirim");
    kirim.disabled = true;
    $("fPesan").innerHTML = "";
    try {
      const d = await api("/api/admin/akun", { metode: "POST", badan });
      $("aForm").reset();
      $("aForm").hidden = true;
      $("aBuat").setAttribute("aria-expanded", "false");
      tampilTaut(d && d.tautan_aktivasi);
      A.hal = 1;
      muatAkun();
    } catch (err) { $("fPesan").innerHTML = pesanHtml("galat", galatTeks(err.kode || "umum")); }
    kirim.disabled = false;
  }

  document.addEventListener("jm:bahasa", () => nanti(rangka));
  rangka();
}
