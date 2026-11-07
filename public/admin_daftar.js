/* /admin: tab Persetujuan anggota (pendaftaran mandiri, migrasi 0021). Server: GET /api/admin/pendaftaran, /:id, /:id/setujui, /:id/tolak,
   /bukti/:bid (lihat dan putus bukti iuran), /pengaturan-daftar (iuran dan rekening, admin). Hak ditegakkan di server. */
import { t, angka, tanggalDariUnix } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";
import { kepalaTab, keadaan, aman } from "/admin_umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pilTek } from "/inti/ikon_tek.js";
import { PROV } from "/inti/prov_singkat.js";
import { pasangTabel } from "/admin_tabel.js";

const STATUS = ["menunggu", "disetujui", "ditolak"], JENIS = ["individu", "organisasi", "mahasiswa"];
const KUNCI_ATUR = ["iuran_individu", "iuran_organisasi", "iuran_mahasiswa", "rekening_bank", "rekening_nomor", "rekening_nama", "rekening_catatan"];
const PIL_BAYAR = { belum: "jm-pil-bad", menunggu: "jm-pil-warn", lunas: "jm-pil-ok" };
const PIL_BUKTI = { menunggu: "jm-pil-warn", diterima: "jm-pil-ok", ditolak: "jm-pil-bad" };

export function panelPersetujuan(panel, { boleh = false } = {}) {
  const S = { status: "menunggu", jenis: "", prov: "", ctl: null, hitung: {} };
  const bayarPil = (r) => `<span class="jm-pil ${PIL_BAYAR[r.bayar]}">${esc(t("pd.bayar." + r.bayar))}</span>${r.status === "disetujui" && r.tanpa_lunas ? ` <span class="jm-pil jm-pil-warn">${esc(t("pd.tanpa_lunas"))}</span>` : ""}`;
  panel.innerHTML = `${kepalaTab("daftar", "pd.ey", "pd.j", "pd.d")}
    <div class="jm-tab pd-seg" role="tablist" aria-label="${esc(t("pd.status"))}">${STATUS.map((s) => `<button type="button" role="tab" data-s="${s}" aria-selected="${s === S.status}" tabindex="${s === S.status ? 0 : -1}">${esc(t("pd.st." + s))} <span class="pd-n" data-n="${s}"></span></button>`).join("")}</div>
    <div class="jm-bar jm-adm-bar1">${pilihHtml({ id: "pdJenis", ikon: "jenis", label: t("pd.jenis"), opsi: [["", t("pd.semua_jenis")], ...JENIS.map((j) => [j, t("dft.jenis." + j)])] })}
      ${pilihHtml({ id: "pdProv", ikon: "wilayah", label: t("pd.prov"), opsi: [["", t("pd.semua_prov"), "wilayah"], ...Object.entries(PROV).map(([k, v]) => [k, v[0], "wilayah"])] })}</div>
    <div id="pdIsi" aria-live="polite"></div>
    ${boleh ? `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("kartu", 20)}<h3>${esc(t("pd.atur"))}</h3></header><div class="jm-adm-isi" id="pdAtur">${hantuHtml(2)}</div></section>` : ""}
    <dialog class="jm-dlg pd-dlg" id="pdDlg" aria-labelledby="pdDlgJudul"></dialog>`;
  const isi = panel.querySelector("#pdIsi"), dlg = panel.querySelector("#pdDlg");
  panel.addEventListener("change", (e) => {
    if (e.target.id === "pdJenis") { S.jenis = e.target.value; muat(); }
    if (e.target.id === "pdProv") { S.prov = e.target.value; muat(); }
  });
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-aksi=ulang]")) return muat();
    const s = e.target.closest("[data-s]");
    if (s && s.getAttribute("aria-selected") !== "true") {
      for (const x of panel.querySelectorAll(".pd-seg [data-s]")) { x.setAttribute("aria-selected", String(x === s)); x.tabIndex = x === s ? 0 : -1; }
      S.status = s.dataset.s; muat(); return;
    }
    const r = e.target.closest("[data-rincian]");
    if (r) rincian(r.dataset.rincian);
  });
  muat();
  if (boleh) atur();

  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    isi.innerHTML = hantuHtml(4);
    try {
      let baris = [], total = 0, d;
      // tabel urut pada data penuh: ambil semua halaman (maks 20 x 50) lalu urut dan paginasi di klien
      for (let hal = 1; hal <= 20; hal++) {
        d = await api(`/api/admin/pendaftaran?status=${S.status}&hal=${hal}${S.jenis ? "&jenis=" + S.jenis : ""}${S.prov ? "&prov=" + S.prov : ""}`, { signal: S.ctl.signal });
        baris = baris.concat(d.baris); total = d.total;
        if (baris.length >= total || !d.baris.length) break;
      }
      S.hitung = d.hitung || {};
      for (const el of panel.querySelectorAll("[data-n]")) el.textContent = angka(S.hitung[el.dataset.n] || 0);
      nanti(() => gambar(baris));
    } catch (e) { if (e.name !== "AbortError") isi.innerHTML = keadaan(e.kode || "umum"); }
  }
  function gambar(baris) {
    pasangTabel(isi, { baris, per: 10, kosong: "pd.kosong", satuan: "pd.satuan", awal: { k: "dibuat", arah: -1 }, kolom: [
      { k: "nama", judul: t("pd.c.nama"), nilai: (r) => r.nama, tampil: (r) => `<span class="jm-id"><b>${esc(r.nama)}</b><small>${esc(r.organisasi || "")}</small></span>` },
      { k: "jenis", judul: t("pd.c.jenis"), nilai: (r) => r.jenis, tampil: (r) => esc(t("dft.jenis." + r.jenis)) },
      { k: "prov", judul: t("pd.c.lokasi"), nilai: (r) => r.prov || "", tampil: (r) => esc([r.kota, PROV[r.prov]?.[1]].filter(Boolean).join(", ") || "-") },
      { k: "bayar", judul: t("pd.c.bayar"), nilai: (r) => r.bayar, tampil: bayarPil },
      { k: "dibuat", judul: t("pd.c.dibuat"), num: true, nilai: (r) => r.dibuat, tampil: (r) => esc(tanggalDariUnix(r.dibuat)) },
      { k: "aksi", judul: t("pd.c.aksi"), nilai: () => 0, tampil: (r) => `<button type="button" class="jm-tbl" data-rincian="${r.id}">${ikon("info", 16)}<span>${esc(t("pd.rincian"))}</span></button>` }] });
  }

  /* ---------- rincian di pop-up besar ---------- */
  const baris2 = (k, v) => (v ? `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>` : "");
  async function rincian(id) {
    dlg.innerHTML = `<div class="pd-dlg-isi">${hantuHtml(4)}</div>`;
    if (!dlg.open) dlg.showModal();
    let d;
    try { d = await api("/api/admin/pendaftaran/" + id); } catch (e) { dlg.innerHTML = `<div class="pd-dlg-isi">${pesanHtml("galat", galatTeks(e.kode || "umum"))}<button type="button" class="jm-tbl" data-d="tutup">${esc(t("pd.tutup"))}</button></div>`; return; }
    gambarRincian(d);
  }
  function gambarRincian(d) {
    const r = d.rinci || {}, p = PROV[d.prov];
    const tautan = (u) => (aman(u) ? `<a href="${esc(aman(u))}" target="_blank" rel="noopener noreferrer">${esc(u)}</a>` : esc(u || ""));
    const bukti = d.bukti.length ? `<ul class="pd-bukti">${d.bukti.map((b) => `<li>${ikon(b.tipe === "application/pdf" ? "pdf" : "gambar", 18)}<span>${esc(tanggalDariUnix(b.dibuat))}</span><span class="jm-pil ${PIL_BUKTI[b.status]}">${esc(t("pd.bukti." + b.status))}</span>
      <a class="jm-tbl" href="/api/admin/pendaftaran/bukti/${b.id}" target="_blank" rel="noopener noreferrer">${ikon("unduh", 16)}<span>${esc(t("pd.bukti.lihat"))}</span></a>
      ${b.status === "menunggu" ? `<button type="button" class="jm-tbl jm-tbl-utama" data-d="bukti" data-bid="${b.id}" data-aksi-b="terima">${esc(t("pd.bukti.terima"))}</button><button type="button" class="jm-tbl" data-d="bukti" data-bid="${b.id}" data-aksi-b="tolak">${esc(t("pd.bukti.tolak"))}</button>` : ""}</li>`).join("")}</ul>` : `<p class="jm-bantu">${esc(t("pd.bukti.kosong"))}</p>`;
    const org = d.jenis === "organisasi" ? `<h3>${esc(t("pd.org"))}</h3><dl class="pd-dl">${baris2("dft.badan.nama", esc(r.badan_nama))}${baris2("dft.badan.sektor", esc(r.badan_sektor))}${baris2("dft.badan.alamat", esc(r.badan_alamat))}${baris2("dft.badan.situs", tautan(r.badan_situs))}${baris2("dft.pj.nama", esc(r.pj_nama))}${baris2("dft.pj.kontak", esc(r.pj_kontak))}</dl>` : "";
    const aksi = d.status === "menunggu" ? `<div class="pd-putus" id="pdPutus">
        <div class="jm-medan" id="pdAlasanKolom" hidden><label for="pdAlasan">${esc(t("pd.alasan"))}</label><textarea class="jm-isian" id="pdAlasan" rows="2" maxlength="500"></textarea></div>
        <div id="pdPesan" aria-live="polite"></div>
        <div class="pd-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-d="setujui">${ikon("centang", 18)}<span>${esc(t("pd.setujui"))}</span></button><button type="button" class="jm-tbl" data-d="tolak">${ikon("silang", 18)}<span>${esc(t("pd.tolak"))}</span></button></div>
        ${d.bayar !== "lunas" ? `<p class="dft-info">${ikon("info", 18)}<span>${esc(t("pd.tanpa_lunas.d"))}</span></p>` : ""}</div>` : `<p class="jm-bantu">${esc(t("pd.st." + d.status))}${d.catatan_admin ? ": " + esc(d.catatan_admin) : ""}${d.diputus_pada ? " (" + esc(tanggalDariUnix(d.diputus_pada)) + ")" : ""}</p>`;
    dlg.innerHTML = `<div class="pd-dlg-isi" data-id="${d.id}">
      <header class="pd-dlg-kepala">${d.ada_foto ? `<img class="pd-foto" src="/api/admin/pendaftaran/${d.id}/foto" alt="" width="72" height="72">` : `<span class="pd-foto pd-foto-ik">${ikon("orang", 32)}</span>`}
        <div><h2 id="pdDlgJudul">${esc(d.nama)}${r.gelar ? `, ${esc(r.gelar)}` : ""}</h2><p class="jm-bantu">${esc(t("dft.jenis." + d.jenis))} <span class="jm-pil ${d.status === "disetujui" ? "jm-pil-ok" : d.status === "ditolak" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(t("pd.st." + d.status))}</span></p></div>
        <button type="button" class="jm-tbl" data-d="tutup" aria-label="${esc(t("pd.tutup"))}">${ikon("tutup", 18)}</button></header>
      <div class="pd-dlg-kolom">
        <section><h3>${esc(t("pd.data"))}</h3><dl class="pd-dl">${baris2("dft.surel", esc(d.surel))}${baris2("dft.hp", esc(d.hp))}${baris2("dft.jabatan", esc(r.jabatan))}${baris2("dft.organisasi", esc(d.organisasi))}${baris2("dft.kota", esc([d.kota, p?.[0]].filter(Boolean).join(", ")))}${baris2("dft.pendidikan", esc(r.pendidikan))}
          ${(r.kepakaran || []).length ? `<div><dt>${esc(t("dft.kepakaran"))}</dt><dd class="pd-tek">${r.kepakaran.map(pilTek).join(" ")}</dd></div>` : ""}${baris2("dft.pengalaman", esc(r.pengalaman))}${baris2("dft.tautan", tautan(r.tautan))}${baris2("dft.alasan", esc(r.alasan))}${baris2("pd.dibuat", esc(tanggalDariUnix(d.dibuat)))}</dl>${org}</section>
        <section><h3>${esc(t("pd.iuran"))}</h3><p class="pd-besar">${d.iuran ? esc("Rp " + angka(d.iuran)) : esc(t("pd.iuran.kosong"))} <span class="jm-pil ${PIL_BAYAR[d.bayar]}">${esc(t("pd.bayar." + d.bayar))}</span>${d.status === "disetujui" && d.tanpa_lunas ? ` <span class="jm-pil jm-pil-warn">${esc(t("pd.tanpa_lunas"))}</span>` : ""}</p>${bukti}<div id="pdBuktiPesan" aria-live="polite"></div></section></div>
      ${aksi}</div>`;
  }

  dlg.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-d]");
    if (!b) return;
    const kind = b.dataset.d, id = dlg.querySelector("[data-id]")?.dataset.id;
    if (kind === "tutup") { dlg.close(); return; }
    if (kind === "salin") { const no = dlg.querySelector("#pdTautan").value; try { await navigator.clipboard.writeText(no); } catch { dlg.querySelector("#pdTautan").select(); document.execCommand?.("copy"); } b.querySelector("span").textContent = t("pd.tersalin"); return; }
    if (kind === "selesai") { dlg.close(); muat(); return; }
    if (kind === "bukti") {
      b.disabled = true;
      try { await api(`/api/admin/pendaftaran/bukti/${b.dataset.bid}`, { metode: "POST", badan: { aksi: b.dataset.aksiB } }); muat(); rincian(id); }
      catch (er) { dlg.querySelector("#pdBuktiPesan").innerHTML = pesanHtml("galat", galatTeks(er.kode || "umum")); b.disabled = false; }
      return;
    }
    const pesan = dlg.querySelector("#pdPesan");
    if (kind === "tolak") {
      const kol = dlg.querySelector("#pdAlasanKolom"), alasan = dlg.querySelector("#pdAlasan").value.trim();
      if (kol.hidden) { kol.hidden = false; dlg.querySelector("#pdAlasan").focus(); return; }
      if (alasan.length < 3) { pesan.innerHTML = pesanHtml("galat", t("pd.alasan.wajib")); return; }
      b.disabled = true;
      try { await api(`/api/admin/pendaftaran/${id}/tolak`, { metode: "POST", badan: { catatan: alasan } }); dlg.close(); muat(); }
      catch (er) { pesan.innerHTML = pesanHtml("galat", galatTeks(er.kode || "umum")); b.disabled = false; }
      return;
    }
    if (kind === "setujui") {
      b.disabled = true;
      try {
        const d = await api(`/api/admin/pendaftaran/${id}/setujui`, { metode: "POST", badan: {} });
        dlg.querySelector("#pdPutus").innerHTML = `${pesanHtml("ok", t("pd.setuju_ok"))}<p class="jm-bantu">${esc(t("pd.tautan.d"))}</p>
          <div class="pd-tautan"><input class="jm-isian" id="pdTautan" readonly value="${esc(d.tautan_aktivasi)}" aria-label="${esc(t("pd.tautan"))}"><button type="button" class="jm-tbl" data-d="salin">${ikon("salin", 16)}<span>${esc(t("dft.salin"))}</span></button></div>
          <div class="pd-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-d="selesai">${esc(t("pd.selesai"))}</button></div>`;
      } catch (er) { pesan.innerHTML = pesanHtml("galat", galatTeks(er.kode || "umum")); b.disabled = false; }
    }
  });

  /* ---------- pengaturan iuran dan rekening (admin) ---------- */
  async function atur() {
    const kotak = panel.querySelector("#pdAtur");
    let d;
    try { d = await api("/api/admin/pengaturan-daftar"); } catch (e) { kotak.innerHTML = keadaan(e.kode || "umum"); return; }
    const f = (k, maks, mode) => `<div class="jm-medan"><label for="at_${k}">${esc(t("pd.at." + k))}</label><input class="jm-isian" id="at_${k}" name="${k}" maxlength="${maks}" value="${esc(d[k] || "")}"${mode ? ` inputmode="${mode}"` : ""}></div>`;
    kotak.innerHTML = `<form class="pd-atur" id="pdAturForm" novalidate><p class="jm-bantu">${esc(t("pd.atur.d"))}</p>
      <div class="pd-atur-kisi">${f("iuran_individu", 9, "numeric")}${f("iuran_organisasi", 9, "numeric")}${f("iuran_mahasiswa", 9, "numeric")}${f("rekening_bank", 80)}${f("rekening_nomor", 40, "numeric")}${f("rekening_nama", 120)}</div>${f("rekening_catatan", 300)}
      <div id="pdAturPesan" aria-live="polite"></div><div class="pd-aksi"><button type="submit" class="jm-tbl jm-tbl-utama">${ikon("centang", 18)}<span>${esc(t("pd.at.simpan"))}</span></button></div></form>`;
    kotak.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const badan = Object.fromEntries(KUNCI_ATUR.map((k) => [k, e.target.elements[k].value.trim()])), pesan = kotak.querySelector("#pdAturPesan");
      try { await api("/api/admin/pengaturan-daftar", { metode: "PUT", badan }); pesan.innerHTML = pesanHtml("ok", t("pd.at.ok")); } catch (er) { pesan.innerHTML = pesanHtml("galat", galatTeks(er.kode || "umum")); }
    });
  }
}
