/* /admin: tab Anggota METI. Data pribadi: dimuat dari /api/admin/anggota-meti (hanya pengurus ke atas), disaring dan diurut di peramban.
   INP: chrome (nilai filter, tombol) berubah seketika; yang dirender hanya satu halaman (50 baris) lewat nanti(). Kontak tersamar sampai "tampilkan". */
import { t, ada, angka } from "/i18n.js";
import { esc, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hitungHtml } from "/inti/komponen.js";
import { samarKontak } from "/inti/samar.js";

const BARIS = 50;
const TAHUN = ["2022", "2023", "2024", "2025"];
const JENIS = ["individu", "utama", "perusahaan", "organisasi", "koperasi", "baru-registrasi"];
const STATUS = ["aktif", "tidak-ditemukan", "nonaktif"];
const URUT = ["no_anggota", "nama", "jenis", "status"];

// nilai iuran di data: "1", "Sudah", "FREE", nomor seri tanggal bayar; kosong, "0", atau nomor telepon nyasar = belum
const bayar = (r, th) => { const v = r.iuran && r.iuran[th]; return v != null && v !== "" && v !== 0 && v !== "0" && !/\s\d/.test(String(v)); };
const label = (awalan, v) => (ada(awalan + v) ? t(awalan + v) : v || "");
const cmp = (a, b) => String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });
const csvSel = (v) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };

export function panelAnggota(panel, { boleh, kabari }) {
  const S = { semua: null, cari: "", jenis: "", status: "", iuran: "", urut: "no_anggota", arah: 1, hal: 1, buka: new Set(), saring: [], ctl: null, tampilNo: true };
  const $ = (id) => panel.querySelector("#" + id);

  panel.innerHTML = `<div id="mHost"></div>`;
  const host = panel.firstElementChild;
  host.addEventListener("input", (e) => { if (e.target.id === "mCari") { S.cari = e.target.value.trim().toLowerCase(); cariTunda(); } });
  host.addEventListener("change", (e) => {
    const k = { mJenis: "jenis", mStatus: "status", mIuran: "iuran" }[e.target.id];
    if (k) { S[k] = e.target.value; S.hal = 1; tandaStrip(); nanti(isiTabel); }
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
      S.semua.forEach((r, i) => { r._i = i; r._k = [r.nama, r.nama_lama, r.instansi, r.surel].join(" ").toLowerCase(); });
      S.tampilNo = S.semua.filter((r) => r.no_anggota).length / (S.semua.length || 1) >= 0.1;
    } catch (e) {
      if (e.name === "AbortError") return;
      host.innerHTML = galatHtml(e.kode || "umum");
      return;
    }
    nanti(rangka);
  }

  /* satu baris ringkasan: Total, Aktif, sebaran jenis (batang tersegmen), iuran per tahun (4 kolom mini); tiap bagian menyaring */
  function ringkas() {
    const a = S.semua, n = a.length || 1, aktif = a.filter((r) => r.status === "aktif").length;
    const jum = JENIS.map((j) => [j, a.filter((r) => r.jenis === j).length]).filter(([, c]) => c);
    const iur = TAHUN.map((th) => [th, a.filter((r) => bayar(r, th)).length]), maks = Math.max(1, ...iur.map(([, c]) => c));
    const kartu = (k, c, v, aksi) => `<button type="button" class="jm-adm-s" data-m="f" data-k="${aksi}" data-v="${v}" aria-pressed="false"><strong>${esc(angka(c))}</strong><small>${esc(k)}</small></button>`;
    return kartu(t("adm.anggota.total"), a.length, "", "reset") + kartu(t("adm.anggota.aktif"), aktif, "aktif", "status")
      + `<div class="jm-adm-s jm-adm-jenis" role="group" aria-label="${esc(t("adm.anggota.sebaran"))}"><div class="jm-adm-bar">${jum.map(([j, c], i) => `<button type="button" class="jm-adm-seg jm-adm-w${i % 5}" data-m="f" data-k="jenis" data-v="${j}" data-p="${(c / n * 100).toFixed(2)}" aria-pressed="false" title="${esc(label("adm.anggota.jenis.", j))}: ${esc(angka(c))}" aria-label="${esc(label("adm.anggota.jenis.", j))}: ${esc(angka(c))}"></button>`).join("")}</div>
        <small>${jum.map(([j, c], i) => `<span><i class="jm-adm-w${i % 5}"></i>${esc(label("adm.anggota.jenis.", j))} ${esc(angka(c))}</span>`).join("")}</small></div>`
      + `<div class="jm-adm-s jm-adm-iur" role="group" aria-label="${esc(t("adm.anggota.iuran_strip"))}">${iur.map(([th, c]) => `<button type="button" data-m="f" data-k="iuran" data-v="${th}" data-p="${(c / maks * 100).toFixed(1)}" aria-pressed="false" title="${esc(t("adm.anggota.iuran_th", { th }))}"><b></b><strong>${esc(angka(c))}</strong><small>${th}</small></button>`).join("")}</div>`;
  }

  function tandaStrip() {
    host.querySelectorAll('.jm-adm-strip [data-m="f"]').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k !== "reset" && S[b.dataset.k] === b.dataset.v)));
  }

  function rangka() {
    const opsi = (daftar, awalan, semua) => [["", t(semua)], ...daftar.map((v) => [v, label(awalan, v)])];
    host.innerHTML = `
      <div class="jm-adm-strip">${ringkas()}</div>
      <div class="jm-saring jm-adm-saring">
        ${cariHtml({ id: "mCari", label: t("adm.anggota.cari") })}
        ${pilihHtml({ id: "mJenis", ikon: "jenis", label: t("adm.anggota.f.jenis"), opsi: opsi(JENIS, "adm.anggota.jenis.", "adm.anggota.semua_jenis"), nilai: S.jenis })}
        ${pilihHtml({ id: "mStatus", ikon: "status", label: t("adm.anggota.f.status"), opsi: opsi(STATUS, "adm.anggota.status.", "adm.anggota.semua_status"), nilai: S.status })}
        ${pilihHtml({ id: "mIuran", ikon: "tahun", label: t("adm.anggota.f.iuran"), opsi: [["", t("adm.anggota.semua_iuran")], ...TAHUN.map((th) => [th, t("adm.anggota.iuran_th", { th })])], nilai: S.iuran })}
        ${boleh ? `<button type="button" class="jm-tbl" data-m="csv">${ikon("salin", 18)}${esc(t("adm.anggota.csv"))}</button>` : ""}
        ${hitungHtml({ id: "mHitung", teks: "" })}
      </div>
      <div id="mDaftar" aria-live="polite"></div>
      <div class="jm-hal" id="mHal"></div>
      <dialog class="jm-lembar" id="mLembar" aria-labelledby="mLembarJudul"></dialog>`;
    host.querySelectorAll("[data-p]").forEach((el) => el.style.setProperty("--p", el.dataset.p));
    tandaStrip();
    isiTabel();
  }

  function saring() {
    const { cari, jenis, status, iuran } = S;
    const s = S.semua.filter((r) => (!cari || r._k.includes(cari)) && (!jenis || r.jenis === jenis) && (!status || r.status === status) && (!iuran || bayar(r, iuran)));
    s.sort((a, b) => S.arah * cmp(a[S.urut], b[S.urut]) || a._i - b._i);
    S.saring = s;
  }

  const identitas = (r) => {
    const sub = [r.instansi, r.jabatan].filter(Boolean).join(", ");
    return `<button type="button" class="jm-adm-nm" data-m="profil" data-i="${r._i}" aria-label="${esc(t("adm.anggota.buka", { nama: r.nama }))}"><strong>${esc(r.nama)}</strong></button>`
      + (r.nama_lama ? `<small class="jm-adm-lama">${esc(t("adm.anggota.dahulu", { nama: r.nama_lama }))}</small>` : "")
      + (sub ? `<small>${esc(sub)}</small>` : "");
  };
  const pilJenis = (j) => `<span class="jm-pil jm-adm-jn${j === "utama" ? " jm-pil-ok" : ""}">${esc(label("adm.anggota.jenis.", j))}</span>`;
  const centang = (r, th) => (bayar(r, th) ? `${ikon("centang", 16)}<span class="sr">${esc(t("adm.anggota.lunas"))}</span>` : `<span aria-hidden="true">-</span><span class="sr">${esc(t("adm.anggota.belum"))}</span>`);

  function isiTabel() {
    const daftar = $("mDaftar");
    if (!daftar) return;
    saring();
    const n = S.saring.length, maks = Math.max(1, Math.ceil(n / BARIS));
    S.hal = Math.min(S.hal, maks);
    const hitung = $("mHitung");
    if (hitung) hitung.textContent = t("adm.anggota.n", { n: angka(n) });
    if (!n) daftar.innerHTML = kosongHtml("jm.kosong.cocok", { data: "reset", kunci: "jm.kosong.reset" });
    else {
      const urutTh = (k, kunci) => `<th scope="col" aria-sort="${S.urut === k ? (S.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-adm-urut" data-m="urut" data-k="${k}">${esc(t(kunci))}</button></th>`;
      const kepala = (S.tampilNo ? urutTh("no_anggota", "adm.anggota.k.no") : "") + urutTh("nama", "adm.anggota.k.nama") + urutTh("jenis", "adm.anggota.f.jenis") + urutTh("status", "adm.anggota.f.status")
        + TAHUN.map((th) => `<th scope="col">${esc(th)}</th>`).join("") + `<th scope="col">${esc(t("adm.anggota.k.kontak"))}</th>`;
      const baris = S.saring.slice((S.hal - 1) * BARIS, S.hal * BARIS).map((r) => {
        const terbuka = S.buka.has(r._i), hp = [r.seluler, r.telepon].filter(Boolean).join(" / ");
        const kontak = hp || r.surel
          ? `<span class="jm-adm-kt">${r.surel ? `<span>${esc(terbuka ? r.surel : samarKontak(r.surel))}</span>` : ""}${hp ? `<small>${esc(terbuka ? hp : samarKontak(hp))}</small>` : ""}</span><button type="button" class="jm-tbl jm-tbl-kecil" data-m="tampil" data-i="${r._i}" aria-pressed="${terbuka}">${esc(t(terbuka ? "adm.anggota.sembunyi" : "adm.anggota.tampilkan"))}</button>` : "-";
        return `<tr data-i="${r._i}">${S.tampilNo ? `<td class="jm-nowrap" data-l="${esc(t("adm.anggota.k.no"))}">${esc(r.no_anggota || "-")}</td>` : ""}
          <td class="jm-adm-id" data-l="${esc(t("adm.anggota.k.nama"))}">${identitas(r)}</td>
          <td data-l="${esc(t("adm.anggota.f.jenis"))}">${pilJenis(r.jenis)}</td>
          <td data-l="${esc(t("adm.anggota.f.status"))}"><span class="jm-pil ${r.status === "aktif" ? "jm-pil-ok" : r.status === "nonaktif" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(label("adm.anggota.status.", r.status))}</span></td>
          ${TAHUN.map((th) => `<td class="jm-adm-cek" data-l="${esc(th)}">${centang(r, th)}</td>`).join("")}
          <td class="jm-adm-kontak" data-l="${esc(t("adm.anggota.k.kontak"))}">${kontak}</td></tr>`;
      }).join("");
      daftar.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-adm-tabel"><thead><tr>${kepala}</tr></thead><tbody>${baris}</tbody></table></div>`;
    }
    $("mHal").innerHTML = `<button type="button" class="jm-tbl jm-tbl-kecil" data-m="hal-" ${S.hal <= 1 ? "disabled" : ""} aria-label="${esc(t("jm.sebelumnya"))}">${ikon("panah-kiri", 18)}</button>
      <span>${esc(t("adm.anggota.hal", { n: angka(S.hal), m: angka(maks) }))}</span>
      <button type="button" class="jm-tbl jm-tbl-kecil" data-m="hal+" ${S.hal >= maks ? "disabled" : ""} aria-label="${esc(t("jm.berikutnya"))}">${ikon("panah-kanan", 18)}</button>`;
  }

  /* lembar profil: kontak tampil penuh (pengurus sudah sah membukanya) */
  function profil(r) {
    const bar = (k, v) => (v ? `<dt>${esc(t(k))}</dt><dd>${esc(v)}</dd>` : "");
    const dir = r.org_id ? `<a class="jm-tbl" href="/direktori?tampil=lembaga&amp;id=${encodeURIComponent(r.org_id)}">${ikon("direktori", 18)}${esc(t("adm.anggota.ke_direktori"))}</a>` : "";
    return `<header><div><h2 id="mLembarJudul">${esc(r.nama)}</h2>${r.nama_lama ? `<small class="jm-adm-lama">${esc(t("adm.anggota.dahulu", { nama: r.nama_lama }))}</small>` : ""}<p>${pilJenis(r.jenis)} <span class="jm-pil ${r.status === "aktif" ? "jm-pil-ok" : r.status === "nonaktif" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(label("adm.anggota.status.", r.status))}</span></p></div>
      <button type="button" class="jm-tbl jm-tbl-kecil" data-m="tutup" aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 18)}</button></header>
      <dl>${bar("adm.anggota.k.no", r.no_anggota)}${bar("adm.anggota.k.tahun", r.tahun_daftar)}${bar("adm.anggota.k.instansi", r.instansi)}${bar("adm.anggota.k.jabatan", r.jabatan)}${bar("adm.anggota.k.alamat", r.alamat)}${bar("adm.anggota.k.surel", r.surel)}${bar("adm.anggota.k.seluler", r.seluler)}${bar("adm.anggota.k.telepon", r.telepon)}${bar("adm.anggota.k.faks", r.faks)}</dl>
      <h3>${esc(t("adm.anggota.riwayat"))}</h3><ul class="jm-adm-riwayat">${TAHUN.map((th) => `<li class="${bayar(r, th) ? "jm-adm-ok" : ""}"><span>${th}</span>${centang(r, th)}</li>`).join("")}</ul>${dir}`;
  }

  function csv() {
    const kol = ["no_anggota", "jenis", "status", "tahun_daftar", "nama", "nama_lama", "jabatan", "instansi", "telepon", "seluler", "surel"];
    const baris = [[...kol, ...TAHUN.map((th) => "iuran_" + th)].map(csvSel).join(",")]
      .concat(S.saring.map((r) => [...kol.map((k) => r[k]), ...TAHUN.map((th) => (bayar(r, th) ? 1 : 0))].map(csvSel).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + baris.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = "anggota-meti.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function klik(e) {
    const d = e.target;
    if (d.id === "mLembar") { d.close(); return; }
    const b = d.closest("button");
    if (!b) {
      const tr = d.closest("tr[data-i]");
      if (tr && !d.closest("a")) bukaProfil(Number(tr.dataset.i));
      return;
    }
    if (b.dataset.aksi === "ulang") { muat(); return; }
    if (b.dataset.aksi === "reset") { S.cari = S.jenis = S.status = S.iuran = ""; S.hal = 1; rangka(); return; }
    switch (b.dataset.m) {
      case "f": { // klik strip: pilih atau lepas filter; chrome (select, aria-pressed) sinkron, tabel ditunda
        const k = b.dataset.k;
        if (k === "reset") S.jenis = S.status = S.iuran = ""; else S[k] = S[k] === b.dataset.v ? "" : b.dataset.v;
        S.hal = 1;
        for (const [id, kk] of [["mJenis", "jenis"], ["mStatus", "status"], ["mIuran", "iuran"]]) $(id).value = S[kk];
        tandaStrip(); nanti(isiTabel); break;
      }
      case "profil": bukaProfil(Number(b.dataset.i)); break;
      case "tutup": $("mLembar").close(); break;
      case "tampil": { const i = Number(b.dataset.i); S.buka.has(i) ? S.buka.delete(i) : S.buka.add(i); nanti(isiTabel); break; }
      case "urut": { const k = b.dataset.k; S.arah = S.urut === k ? -S.arah : 1; S.urut = URUT.includes(k) ? k : "no_anggota"; S.hal = 1; nanti(isiTabel); break; }
      case "hal-": S.hal = Math.max(1, S.hal - 1); nanti(isiTabel); break;
      case "hal+": S.hal += 1; nanti(isiTabel); break;
      case "csv": if (boleh) csv(); break;
    }
  }

  function bukaProfil(i) {
    const r = S.semua[i], dlg = $("mLembar");
    if (!r || !dlg) return;
    dlg.innerHTML = profil(r);
    if (!dlg.open) dlg.showModal();
  }
}
