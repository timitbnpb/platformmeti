/* /admin: tab Anggota METI. Data pribadi: dimuat dari /api/admin/anggota-meti (hanya pengurus ke atas), disaring dan diurut di peramban.
   INP: chrome (nilai filter, tombol) berubah seketika; yang dirender hanya satu halaman (50 baris) lewat nanti(). Kontak tersamar sampai "tampilkan". */
import { t, ada, angka } from "/i18n.js";
import { esc, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml, galatTeks, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hitungHtml } from "/inti/komponen.js";
import { namaBaku } from "/inti/nama_baku.js";
import { formHtml, bacaForm, tampilGalat } from "/admin_anggota_form.js";

const BARIS = 50;
const TAHUN = ["2022", "2023", "2024", "2025"];
const JENIS = ["individu", "utama", "perusahaan", "organisasi", "koperasi", "baru-registrasi"];
const ORG = ["utama", "perusahaan", "organisasi", "koperasi"];
const IKON_SUB = { "": "daftar", individu: "orang", utama: "perisai", perusahaan: "direktori", organisasi: "rantai", koperasi: "wilayah", "baru-registrasi": "tambah" };
const aman = (u) => (/^https?:\/\//i.test(u) ? u : "");
const awal = (n) => String(n || "").replace(/^(pt|cv|ud)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const STATUS = ["aktif", "tidak-ditemukan", "nonaktif"];
const URUT = ["no_anggota", "nama", "jenis", "status"];

// nilai iuran di data: "1", "Sudah", "FREE", nomor seri tanggal bayar; kosong, "0", atau nomor telepon nyasar = belum
const bayar = (r, th) => { const v = r.iuran && r.iuran[th]; return v != null && v !== "" && v !== 0 && v !== "0" && !/\s\d/.test(String(v)); };
const label = (awalan, v) => (ada(awalan + v) ? t(awalan + v) : v || "");
const cmp = (a, b) => String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });
const csvSel = (v) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };

export function panelAnggota(panel, { boleh, kabari }) {
  const S = { semua: null, cari: "", jenis: "", status: "", iuran: "", urut: "no_anggota", arah: 1, hal: 1, buka: new Set(), konfirm: null, saring: [], ctl: null, tampilNo: true };
  const $ = (id) => panel.querySelector("#" + id);

  panel.innerHTML = `<div id="mHost"></div>`;
  const host = panel.firstElementChild;
  host.addEventListener("input", (e) => { if (e.target.id === "mCari") { S.cari = e.target.value.trim().toLowerCase(); cariTunda(); } });
  host.addEventListener("change", (e) => {
    const k = { mStatus: "status", mIuran: "iuran" }[e.target.id];
    if (k) { S[k] = e.target.value; S.hal = 1; nanti(isiTabel); }
  });
  host.addEventListener("click", klik);
  host.addEventListener("submit", (e) => { if (e.target.id === "mFormIsi") { e.preventDefault(); simpan(e.target); } });
  const cariTunda = debounce(() => { S.hal = 1; isiTabel(); });
  muat();

  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    host.innerHTML = hantuHtml(5);
    try {
      const d = await api("/api/admin/anggota-meti", { signal: S.ctl.signal });
      S.semua = Array.isArray(d) ? d : d.baris || [];
      S.penyunting = !Array.isArray(d) && d.penyunting === true;
      S.semua.forEach((r, i) => { r._i = i; { const b = namaBaku(r.nama); r.nama = b.nama; r._awalan = b.jenis; if (r.nama_lama) r.nama_lama = namaBaku(r.nama_lama).nama; } r._k = [r.nama, r.nama_lama, r.instansi, r.surel].join(" ").toLowerCase(); });
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
    const sem = S.semua, a = S.jenis ? sem.filter((r) => r.jenis === S.jenis) : sem, n = sem.length || 1, aktif = a.filter((r) => r.status === "aktif").length;
    const jum = JENIS.map((j) => [j, sem.filter((r) => r.jenis === j).length]).filter(([, c]) => c);
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

  function tabsHtml() {
    const hit = (j) => (j ? S.semua.filter((r) => r.jenis === j).length : S.semua.length);
    return `<div class="jm-tab jm-adm-sub" role="tablist" aria-label="${esc(t("adm.anggota.f.jenis"))}">${["", ...JENIS].filter((j) => !j || hit(j)).map((j) => `<button type="button" role="tab" data-m="sub" data-v="${j}" aria-selected="${S.jenis === j}">${ikon(IKON_SUB[j], 18)}<span>${esc(j ? label("adm.anggota.jenis.", j) : t("adm.anggota.sub.semua"))}</span><b class="jm-adm-n">${esc(angka(hit(j)))}</b></button>`).join("")}</div>`;
  }

  function isiStrip() {
    const st = $("mStrip");
    if (!st) return;
    st.innerHTML = ringkas();
    st.querySelectorAll(".jm-adm-seg[data-p]").forEach((el) => { el.style.flexGrow = el.dataset.p; });
    st.querySelectorAll(".jm-adm-iur [data-p] b").forEach((el) => { el.style.height = el.parentNode.dataset.p + "%"; });
    tandaStrip();
  }

  function rangka() {
    host.innerHTML = `
      ${tabsHtml()}
      <div class="jm-adm-strip" id="mStrip"></div>
      <div class="jm-saring jm-adm-saring">
        ${cariHtml({ id: "mCari", label: t("adm.anggota.cari") })}
        ${pilihHtml({ id: "mStatus", ikon: "status", label: t("adm.anggota.f.status"), opsi: [["", t("adm.anggota.semua_status")], ...STATUS.map((v) => [v, label("adm.anggota.status.", v)])], nilai: S.status })}
        ${pilihHtml({ id: "mIuran", ikon: "tahun", label: t("adm.anggota.f.iuran"), opsi: [["", t("adm.anggota.semua_iuran")], ...TAHUN.map((th) => [th, t("adm.anggota.iuran_th", { th })])], nilai: S.iuran })}
        ${S.penyunting ? `<button type="button" class="jm-tbl jm-tbl-utama" data-m="baru">${ikon("tambah", 18)}${esc(t("adm.anggota.form.tambah"))}</button>` : ""}
        ${boleh ? `<button type="button" class="jm-tbl" data-m="csv">${ikon("salin", 18)}${esc(t("adm.anggota.csv"))}</button>` : ""}
        ${hitungHtml({ id: "mHitung", teks: "" })}
      </div>
      <div id="mDaftar" aria-live="polite"></div>
      <div class="jm-hal" id="mHal"></div>
      <dialog class="jm-lembar" id="mLembar" aria-labelledby="mLembarJudul"></dialog>
      <dialog class="jm-modal" id="mForm" aria-labelledby="mFormJudul"></dialog>`;
    isiStrip();
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
    return `<span class="jm-adm-id"><button type="button" class="jm-adm-nm" data-m="profil" data-i="${r._i}" aria-label="${esc(t("adm.anggota.buka", { nama: r.nama }))}"><strong>${esc(r.nama)}</strong></button>`
      + (r.nama_lama ? `<small class="jm-adm-lama">${esc(t("adm.anggota.dahulu", { nama: r.nama_lama }))}</small>` : "")
      + (sub ? `<small>${esc(sub)}</small>` : "") + "</span>";
  };
  const pilJenis = (j, aw) => `<span class="jm-pil jm-adm-jn${j === "utama" ? " jm-pil-ok" : ""}">${esc(label("adm.anggota.jenis.", j))}</span>` + (aw && !(aw === "utama" && j === "utama") ? `<span class="jm-pil jm-adm-jn">${esc(t("adm.anggota.awalan." + aw))}</span>` : "");
  const orgTd = (r) => {
    const nm = r.org_id ? `<a href="/direktori?tampil=lembaga&amp;id=${encodeURIComponent(r.org_id)}"><strong>${esc(r.nama)}</strong></a>` : `<button type="button" data-m="profil" data-i="${r._i}" aria-label="${esc(t("adm.anggota.buka", { nama: r.nama }))}"><strong>${esc(r.nama)}</strong></button>`;
    return `<span class="jm-adm-lg"><span class="jm-adm-ava" aria-hidden="true">${esc(awal(r.nama))}</span><span class="jm-adm-id">${nm}${r.nama_lama ? `<small class="jm-adm-lama">${esc(t("adm.anggota.dahulu", { nama: r.nama_lama }))}</small>` : ""}</span></span>`;
  };
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
      const org = ORG.includes(S.jenis), semuaJ = !S.jenis;
      const garisKontak = (isi) => {
        const L = isi.map(([h]) => h), tampak = L.slice(0, 2), sisa = L.slice(2);
        return `<span class="jm-adm-kt">${tampak.map((x) => `<span>${x}</span>`).join("")}${sisa.map((x) => `<span hidden>${x}</span>`).join("")}${sisa.length ? `<button type="button" class="jm-adm-lebih" data-m="lebih" aria-expanded="false">+${sisa.length}</button>` : ""}</span>`;
      };
      const kontakTd = (r) => {
        /* pemilik 7 Nov 2026: kontak tampil penuh (layar hanya untuk pengurus ke atas). Surel = mailto, nomor = tel, hotline berpil label. */
        const pecah = (v) => String(v || "").split(/[;,/]+/).map((x) => x.trim()).filter(Boolean);
        const baris = [
          ...pecah(r.surel).filter((x) => x.includes("@")).map((x) => [`<a href="mailto:${esc(x)}">${esc(x)}</a>`]),
          ...[...pecah(r.seluler), ...pecah(r.telepon)].map((x) => [`<a href="tel:${esc(x.replace(/[^\d+]/g, ""))}">${esc(x)}</a>`]),
          ...pecah(r.hotline).map((x) => [`<span class="jm-pil jm-adm-hot">${esc(t("adm.anggota.k.hotline"))}</span> <a href="tel:${esc(x.replace(/[^\d+]/g, ""))}">${esc(x)}</a>`]),
        ];
        return baris.length ? garisKontak(baris) : "-";
      };
      const statusTd = (r) => `<span class="jm-pil ${r.status === "aktif" ? "jm-pil-ok" : r.status === "nonaktif" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(label("adm.anggota.status.", r.status))}</span>`;
      const situsTd = (r) => (r.situs || []).map(aman).filter(Boolean).slice(0, 2).map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t("adm.anggota.k.situs"))}" title="${esc(u)}">${ikon("tautan", 18)}</a>`).join("") || "-";
      const aksiTd = (r) => (S.konfirm === r._i
        ? `<span class="jm-adm-konfirm" role="alert">${esc(t("adm.anggota.hapus_tanya", { nama: r.nama }))}<button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-m="hapus-ya" data-i="${r._i}">${esc(t("adm.anggota.hapus_ya"))}</button><button type="button" class="jm-tbl jm-tbl-kecil" data-m="hapus-batal">${esc(t("jm.batal"))}</button></span>`
        : `<span class="jm-adm-acts"><button type="button" class="jm-tbl jm-tbl-kecil" data-m="ubah" data-i="${r._i}" aria-label="${esc(t("adm.anggota.ubah_aksi", { nama: r.nama }))}">${ikon("ubah", 16)}</button><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-m="hapus" data-i="${r._i}" aria-label="${esc(t("adm.anggota.hapus_aksi", { nama: r.nama }))}">${ikon("tutup", 16)}</button></span>`);
      const K = (kunci, td, o = {}) => ({ kunci, td, ...o });
      const kol = [
        ...(S.tampilNo && !org ? [K("adm.anggota.k.no", (r) => esc(r.no_anggota || "-"), { k: "no_anggota", kls: "jm-nowrap", w: 8 })] : []),
        K("adm.anggota.k.nama", org ? orgTd : identitas, { k: "nama", kls: "jm-adm-nama", w: 22 }),
        ...(org ? [K("adm.anggota.k.pic", (r) => esc(r.pic || "-"))] : []),
        ...(semuaJ ? [K("adm.anggota.f.jenis", (r) => pilJenis(r.jenis, r._awalan), { k: "jenis" })] : []),
        K("adm.anggota.k.kontak", kontakTd, { kls: "jm-adm-kontak", w: 30 }),
        ...(org ? [K("adm.anggota.k.situs", situsTd, { kls: "jm-adm-cek" })] : []),
        ...TAHUN.map((th) => K(th, (r) => centang(r, th), { th: 1, kls: "jm-adm-cek", w: 5 })),
        K("adm.anggota.f.status", statusTd, { k: "status", w: 10 }),
        ...(S.penyunting ? [K("adm.anggota.k.aksi", aksiTd, { w: 10 })] : []),
      ];
      const kepala = kol.map((c) => (c.k
        ? `<th scope="col"${c.w ? ` class="jm-adm-w${c.w}"` : ""} aria-sort="${S.urut === c.k ? (S.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-adm-urut" data-m="urut" data-k="${c.k}">${esc(c.th ? c.kunci : t(c.kunci))}</button></th>`
        
        : `<th scope="col"${c.w ? ` class="jm-adm-w${c.w}"` : ""}>${esc(c.th ? c.kunci : t(c.kunci))}</th>`)).join("");
      const baris = S.saring.slice((S.hal - 1) * BARIS, S.hal * BARIS).map((r) =>
        `<tr data-i="${r._i}">${kol.map((c) => `<td${c.kls ? ` class="${c.kls}"` : ""} data-l="${esc(c.th ? c.kunci : t(c.kunci))}">${c.td(r)}</td>`).join("")}</tr>`).join("");
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
    return `<header><div><h2 id="mLembarJudul">${esc(r.nama)}</h2>${r.nama_lama ? `<small class="jm-adm-lama">${esc(t("adm.anggota.dahulu", { nama: r.nama_lama }))}</small>` : ""}<p>${pilJenis(r.jenis, r._awalan)} <span class="jm-pil ${r.status === "aktif" ? "jm-pil-ok" : r.status === "nonaktif" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(label("adm.anggota.status.", r.status))}</span></p></div>
      <button type="button" class="jm-tbl jm-tbl-kecil" data-m="tutup" aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 18)}</button></header>
      <dl>${bar("adm.anggota.k.no", r.no_anggota)}${bar("adm.anggota.k.tahun", r.tahun_daftar)}${bar("adm.anggota.k.instansi", r.instansi)}${bar("adm.anggota.k.jabatan", r.jabatan)}${bar("adm.anggota.k.alamat", r.alamat)}${bar("adm.anggota.k.surel", r.surel)}${bar("adm.anggota.k.seluler", r.seluler)}${bar("adm.anggota.k.telepon", r.telepon)}${bar("adm.anggota.k.faks", r.faks)}${bar("adm.anggota.k.hotline", r.hotline)}${bar("adm.anggota.k.pic", r.pic)}${bar("adm.anggota.k.situs", (r.situs || []).filter(aman).join(" "))}</dl>
      <h3>${esc(t("adm.anggota.riwayat"))}</h3><ul class="jm-adm-riwayat">${TAHUN.map((th) => `<li class="${bayar(r, th) ? "jm-adm-ok" : ""}"><span>${th}</span>${centang(r, th)}</li>`).join("")}</ul>${dir}`;
  }

  function csv() {
    const kol = ["no_anggota", "jenis", "status", "tahun_daftar", "nama", "nama_lama", "pic", "jabatan", "instansi", "telepon", "seluler", "hotline", "surel"];
    const baris = [[...kol, ...TAHUN.map((th) => "iuran_" + th)].map(csvSel).join(",")]
      .concat(S.saring.map((r) => [...kol.map((k) => r[k]), ...TAHUN.map((th) => (bayar(r, th) ? 1 : 0))].map(csvSel).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + baris.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = "anggota-meti" + (S.jenis ? "-" + S.jenis : "") + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function klik(e) {
    const d = e.target;
    if (d.id === "mLembar" || d.id === "mForm") { d.close(); return; }
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
        for (const [id, kk] of [["mStatus", "status"], ["mIuran", "iuran"]]) $(id).value = S[kk];
        ubahSub(); break;
      }
      case "sub": S.jenis = b.dataset.v; S.hal = 1; ubahSub(); break;
      case "lebih": { const w = b.parentNode; w.querySelectorAll("[hidden]").forEach((x) => { x.hidden = false; }); b.remove(); break; }
      case "profil": bukaProfil(Number(b.dataset.i)); break;
      case "tutup": $("mLembar").close(); break;
      case "tampil": { const i = Number(b.dataset.i); S.buka.has(i) ? S.buka.delete(i) : S.buka.add(i); nanti(isiTabel); break; }
      case "urut": { const k = b.dataset.k; S.arah = S.urut === k ? -S.arah : 1; S.urut = URUT.includes(k) ? k : "no_anggota"; S.hal = 1; nanti(isiTabel); break; }
      case "hal-": S.hal = Math.max(1, S.hal - 1); nanti(isiTabel); break;
      case "hal+": S.hal += 1; nanti(isiTabel); break;
      case "csv": if (boleh) csv(); break;
      case "baru": bukaForm(null); break;
      case "ubah": bukaForm(S.semua[Number(b.dataset.i)]); break;
      case "form-tutup": $("mForm").close(); break;
      case "hapus": S.konfirm = Number(b.dataset.i); nanti(isiTabel); break;
      case "hapus-batal": S.konfirm = null; nanti(isiTabel); break;
      case "hapus-ya": hapus(S.semua[Number(b.dataset.i)]); break;
    }
  }

  /* chrome (tab, pil strip) seketika; strip dan tabel berat ditunda */
  function ubahSub() {
    host.querySelectorAll('.jm-adm-sub [role="tab"]').forEach((x) => x.setAttribute("aria-selected", String(x.dataset.v === S.jenis)));
    tandaStrip();
    nanti(() => { isiStrip(); isiTabel(); });
  }

  /* tambah/ubah/hapus: server menghakimi; layar memuat ulang daftar lalu mengabari */
  function bukaForm(r) {
    const dlg = $("mForm");
    if (!dlg) return;
    dlg.innerHTML = formHtml(r, { jenis: JENIS, status: STATUS, bayar });
    if (!dlg.open) dlg.showModal();
    dlg.querySelector("#f_nama").focus();
  }
  async function simpan(form) {
    const { badan, galat } = bacaForm(form);
    tampilGalat(form, galat);
    if (Object.keys(galat).length) return;
    const id = form.dataset.id, kirim = form.querySelector("#mFormKirim");
    kirim.disabled = true;
    try {
      await api(id ? "/api/admin/anggota-meti/" + encodeURIComponent(id) : "/api/admin/anggota-meti", { metode: id ? "PATCH" : "POST", badan });
    } catch (e) {
      kirim.disabled = false;
      form.querySelector("#g__").textContent = galatTeks(e.kode || "umum");
      return;
    }
    $("mForm").close();
    kabari("ok", t(id ? "adm.anggota.ubah_ok" : "adm.anggota.tambah_ok"));
    muat();
  }
  async function hapus(r) {
    S.konfirm = null;
    try { await api("/api/admin/anggota-meti/" + encodeURIComponent(r.id), { metode: "DELETE" }); } catch (e) { kabari("galat", galatTeks(e.kode || "umum")); nanti(isiTabel); return; }
    kabari("ok", t("adm.anggota.hapus_ok"));
    muat();
  }

  function bukaProfil(i) {
    const r = S.semua[i], dlg = $("mLembar");
    if (!r || !dlg) return;
    dlg.innerHTML = profil(r);
    if (!dlg.open) dlg.showModal();
  }
}
