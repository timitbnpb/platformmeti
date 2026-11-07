/* /admin: tab Anggota METI. Data pribadi: dimuat dari /api/admin/anggota-meti (hanya pengurus ke atas), disaring dan diurut di peramban.
   INP: chrome (nilai filter, tombol) berubah seketika; yang dirender hanya satu halaman (50 baris) lewat nanti(). Kontak tersamar sampai "tampilkan". */
import { t, ada, angka } from "/i18n.js";
import { esc, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml, ikon } from "/inti/umum.js";

const BARIS = 50;
const TAHUN = ["2022", "2023", "2024", "2025"];
const JENIS = ["individu", "utama", "perusahaan", "organisasi", "koperasi", "baru-registrasi"];
const STATUS = ["aktif", "tidak-ditemukan", "nonaktif"];
const URUT = ["no_anggota", "nama", "instansi", "jenis", "status"];

const bayar = (r, th) => { const v = r.iuran && r.iuran[th]; return v != null && v !== "" && v !== 0 && v !== "0"; };
const tamu = (s) => { s = String(s || ""); const d = s.replace(/\s/g, ""); return d.length > 8 ? d.slice(0, 4) + "****" + d.slice(-4) : d ? "****" : ""; };
const tamuSurel = (s) => { s = String(s || ""); const i = s.indexOf("@"); return i < 0 ? (s ? "****" : "") : s.slice(0, Math.min(2, i)) + "****" + s.slice(i); };
const label = (awalan, v) => (ada(awalan + v) ? t(awalan + v) : v || "");
const cmp = (a, b) => String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });
const csvSel = (v) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };

export function panelAnggota(panel, { boleh, kabari }) {
  const S = { semua: null, cari: "", jenis: "", status: "", iuran: "", urut: "no_anggota", arah: 1, hal: 1, buka: new Set(), saring: [], ctl: null };
  const $ = (id) => panel.querySelector("#" + id);

  panel.innerHTML = `<div id="mHost"></div>`;
  const host = panel.firstElementChild;
  host.addEventListener("input", (e) => { if (e.target.id === "mCari") { S.cari = e.target.value.trim().toLowerCase(); cariTunda(); } });
  host.addEventListener("change", (e) => {
    const k = { mJenis: "jenis", mStatus: "status", mIuran: "iuran" }[e.target.id];
    if (k) { S[k] = e.target.value; S.hal = 1; nanti(isiTabel); }
  });
  host.addEventListener("click", klik);
  const cariTunda = debounce(() => { S.hal = 1; isiTabel(); });
  muat();

  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    host.innerHTML = hantuHtml(5);
    try {
      const d = await api("/api/admin/anggota-meti", { signal: S.ctl.signal });
      S.semua = Array.isArray(d) ? d : d.baris || [];
      S.semua.forEach((r, i) => { r._i = i; r._k = [r.nama, r.instansi, r.surel].join(" ").toLowerCase(); });
    } catch (e) {
      if (e.name === "AbortError") return;
      host.innerHTML = galatHtml(e.kode || "umum");
      return;
    }
    nanti(rangka);
  }

  function ringkas() {
    const a = S.semua, aktif = a.filter((r) => r.status === "aktif").length;
    const kartu = (k, n) => `<div class="jm-adm-stat"><strong>${esc(angka(n))}</strong><small>${esc(k)}</small></div>`;
    return kartu(t("adm.anggota.total"), a.length) + kartu(t("adm.anggota.aktif"), aktif)
      + JENIS.map((j) => kartu(label("adm.anggota.jenis.", j), a.filter((r) => r.jenis === j).length)).join("")
      + TAHUN.map((th) => kartu(t("adm.anggota.iuran_th", { th }), a.filter((r) => bayar(r, th)).length)).join("");
  }

  function rangka() {
    const opsi = (daftar, awalan, semua) => `<option value="">${esc(t(semua))}</option>` + daftar.map((v) => `<option value="${esc(v)}">${esc(label(awalan, v))}</option>`).join("");
    host.innerHTML = `
      <div class="jm-adm-stats">${ringkas()}</div>
      <div class="jm-bar jm-adm-anggota">
        <div class="jm-medan"><label class="sr" for="mCari">${esc(t("adm.anggota.cari"))}</label>
          <input class="jm-isian" id="mCari" type="search" autocomplete="off" placeholder="${esc(t("adm.anggota.cari"))}"></div>
        <select class="jm-pilih" id="mJenis" aria-label="${esc(t("adm.anggota.f.jenis"))}">${opsi(JENIS, "adm.anggota.jenis.", "adm.anggota.semua_jenis")}</select>
        <select class="jm-pilih" id="mStatus" aria-label="${esc(t("adm.anggota.f.status"))}">${opsi(STATUS, "adm.anggota.status.", "adm.anggota.semua_status")}</select>
        <select class="jm-pilih" id="mIuran" aria-label="${esc(t("adm.anggota.f.iuran"))}"><option value="">${esc(t("adm.anggota.semua_iuran"))}</option>${TAHUN.map((th) => `<option value="${th}">${esc(t("adm.anggota.iuran_th", { th }))}</option>`).join("")}</select>
        ${boleh ? `<button type="button" class="jm-tbl" data-m="csv">${esc(t("adm.anggota.csv"))}</button>` : ""}
      </div>
      <div id="mDaftar" aria-live="polite"></div>
      <div class="jm-hal" id="mHal"></div>`;
    isiTabel();
  }

  function saring() {
    const { cari, jenis, status, iuran } = S;
    const s = S.semua.filter((r) => (!cari || r._k.includes(cari)) && (!jenis || r.jenis === jenis) && (!status || r.status === status) && (!iuran || bayar(r, iuran)));
    s.sort((a, b) => S.arah * cmp(a[S.urut], b[S.urut]) || a._i - b._i);
    S.saring = s;
  }

  function isiTabel() {
    const daftar = $("mDaftar");
    if (!daftar) return;
    saring();
    const n = S.saring.length, maks = Math.max(1, Math.ceil(n / BARIS));
    S.hal = Math.min(S.hal, maks);
    if (!n) daftar.innerHTML = kosongHtml("jm.kosong.cocok", { data: "reset", kunci: "jm.kosong.reset" });
    else {
      const kepala = [["no_anggota", "adm.anggota.k.no"], ["nama", "adm.anggota.k.nama"], [null, "adm.anggota.k.jabatan"], ["instansi", "adm.anggota.k.instansi"], ["jenis", "adm.anggota.f.jenis"], ["status", "adm.anggota.f.status"]]
        .map(([k, kunci]) => k
          ? `<th scope="col" aria-sort="${S.urut === k ? (S.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-adm-urut" data-m="urut" data-k="${k}">${esc(t(kunci))}</button></th>`
          : `<th scope="col">${esc(t(kunci))}</th>`).join("")
        + TAHUN.map((th) => `<th scope="col">${esc(th)}</th>`).join("") + `<th scope="col">${esc(t("adm.anggota.k.kontak"))}</th>`;
      const baris = S.saring.slice((S.hal - 1) * BARIS, S.hal * BARIS).map((r) => {
        const terbuka = S.buka.has(r._i), hp = r.seluler || r.telepon;
        const kontak = hp || r.surel
          ? `<span>${esc(terbuka ? r.surel || "" : tamuSurel(r.surel))}</span><small>${esc(terbuka ? hp || "" : tamu(hp))}</small><button type="button" class="jm-tbl jm-tbl-kecil" data-m="tampil" data-i="${r._i}" aria-pressed="${terbuka}">${esc(t(terbuka ? "adm.anggota.sembunyi" : "adm.anggota.tampilkan"))}</button>` : "-";
        return `<tr><td class="jm-nowrap" data-l="${esc(t("adm.anggota.k.no"))}">${esc(r.no_anggota)}</td>
          <td data-l="${esc(t("adm.anggota.k.nama"))}"><strong>${esc(r.nama)}</strong></td>
          <td data-l="${esc(t("adm.anggota.k.jabatan"))}">${esc(r.jabatan || "-")}</td>
          <td data-l="${esc(t("adm.anggota.k.instansi"))}">${esc(r.instansi || "-")}</td>
          <td data-l="${esc(t("adm.anggota.f.jenis"))}">${esc(label("adm.anggota.jenis.", r.jenis))}</td>
          <td data-l="${esc(t("adm.anggota.f.status"))}"><span class="jm-pil ${r.status === "aktif" ? "jm-pil-ok" : r.status === "nonaktif" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(label("adm.anggota.status.", r.status))}</span></td>
          ${TAHUN.map((th) => `<td class="jm-adm-cek" data-l="${esc(th)}">${bayar(r, th) ? `${ikon("centang", 16)}<span class="sr">${esc(t("adm.anggota.lunas"))}</span>` : `<span class="sr">${esc(t("adm.anggota.belum"))}</span>`}</td>`).join("")}
          <td data-l="${esc(t("adm.anggota.k.kontak"))}">${kontak}</td></tr>`;
      }).join("");
      daftar.innerHTML = `<p class="jm-bantu">${esc(t("adm.anggota.n", { n: angka(n) }))}</p><div class="jm-gulir"><table class="jm-tabel"><thead><tr>${kepala}</tr></thead><tbody>${baris}</tbody></table></div>`;
    }
    $("mHal").innerHTML = `<button type="button" class="jm-tbl jm-tbl-kecil" data-m="hal-" ${S.hal <= 1 ? "disabled" : ""} aria-label="${esc(t("jm.sebelumnya"))}">${ikon("panah-kiri", 18)}</button>
      <span>${esc(t("adm.anggota.hal", { n: angka(S.hal), m: angka(maks) }))}</span>
      <button type="button" class="jm-tbl jm-tbl-kecil" data-m="hal+" ${S.hal >= maks ? "disabled" : ""} aria-label="${esc(t("jm.berikutnya"))}">${ikon("panah-kanan", 18)}</button>`;
  }

  function csv() {
    const kol = ["no_anggota", "jenis", "status", "tahun_daftar", "nama", "jabatan", "instansi", "telepon", "seluler", "surel"];
    const baris = [[...kol, ...TAHUN.map((th) => "iuran_" + th)].map(csvSel).join(",")]
      .concat(S.saring.map((r) => [...kol.map((k) => r[k]), ...TAHUN.map((th) => (bayar(r, th) ? 1 : 0))].map(csvSel).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + baris.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = "anggota-meti.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function klik(e) {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.aksi === "ulang") { muat(); return; }
    if (b.dataset.aksi === "reset") { S.cari = S.jenis = S.status = S.iuran = ""; S.hal = 1; rangka(); return; }
    switch (b.dataset.m) {
      case "tampil": { const i = Number(b.dataset.i); S.buka.has(i) ? S.buka.delete(i) : S.buka.add(i); nanti(isiTabel); break; }
      case "urut": { const k = b.dataset.k; S.arah = S.urut === k ? -S.arah : 1; S.urut = URUT.includes(k) ? k : "no_anggota"; S.hal = 1; nanti(isiTabel); break; }
      case "hal-": S.hal = Math.max(1, S.hal - 1); nanti(isiTabel); break;
      case "hal+": S.hal += 1; nanti(isiTabel); break;
      case "csv": if (boleh) csv(); break;
    }
  }
}
