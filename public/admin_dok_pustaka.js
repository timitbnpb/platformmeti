/* /admin: tab "Dokumen Pustaka" (Konten). Dokumen unggahan METI (PDF, PPTX, DOCX, XLSX) yang tampil di /pustaka.
   Banyak berkas boleh berurutan: tiap berkas meminta metadatanya sendiri. Hak ditegakkan di server (admin dan super).
   INP: pilihan berkas dan klik mengubah chrome seketika; tabel dirender lewat nanti(). */
import { t, ada, angka, tanggal } from "/i18n.js";
import { cariHtml, pilihHtml, hitungHtml } from "/inti/komponen.js";
import { esc, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";
import { konfirmasiHapus, kirimBerkas, galatBerkas } from "/admin_konten.js";

const pilOtor = (o) => (o ? ` <span class="jm-pil ${o === "disahkan" ? "jm-pil-ok" : o === "ditolak" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(t("adm.otor." + o))}</span>` : "");
const EKS = ["pdf", "pptx", "docx", "xlsx"];
const MAKS = 50 * 1048576;
const MIME = { pdf: "application/pdf", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
const IK = { pdf: "pdf", pptx: "presentasi", docx: "teks", xlsx: "tabel" };
const JENIS = ["laporan", "kajian", "paparan", "regulasi", "panduan", "data", "lainnya"];
const ekstensi = (n) => (String(n).split(".").pop() || "").toLowerCase();
const judulDari = (n) => String(n).replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
const labelJenis = (j) => (ada("pu.jenis." + j) ? t("pu.jenis." + j) : j || "");
const ukuranTeks = (b) => (!b ? "-" : b < 1048576 ? t("pu.kb", { n: angka(Math.max(1, Math.round(b / 1024))) }) : t("pu.mb", { n: angka(Math.round(b / 104857.6) / 10) }));
const isiNol = (v) => (v == null ? "" : String(v));

export function panelDokPustaka(el) {
  const S = { baris: null, cari: "", jenis: "", ref: "", antre: [], i: 0, jumlah: 0, ctl: null, sibuk: false };
  const $ = (id) => el.querySelector("#" + id);
  const kabar = (jenis, teks) => { const s = $("dpStatus"); if (s) s.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };

  el.innerHTML = `<div id="dpHost"></div><div id="dpStatus" aria-live="polite"></div>`;
  const host = $("dpHost");
  host.addEventListener("click", klik);
  host.addEventListener("input", masuk);
  host.addEventListener("change", ubah);
  host.addEventListener("submit", (e) => { if (e.target.id === "dpForm") { e.preventDefault(); simpan(); } });
  host.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches && e.target.matches("tr[data-ref]")) bukaEdit(e.target.dataset.ref); });
  const cariTunda = debounce(() => isiTabel());
  muatDaftar();

  const urut = (l) => l.slice().sort((a, c) => String(c.dibuat || c.tanggal_terbit).localeCompare(String(a.dibuat || a.tanggal_terbit)));
  async function muatDaftar() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    host.innerHTML = hantuHtml(5);
    try {
      const d = await api("/api/pustaka-unggah", { signal: S.ctl.signal });
      S.baris = urut(Array.isArray(d) ? d : (d && d.baris) || []);
    } catch (e) {
      if (e.name === "AbortError") return;
      host.innerHTML = galatHtml(e.kode || "umum");
      return;
    }
    nanti(rangkaDaftar);
  }

  function rangkaDaftar() {
    S.ref = ""; S.antre = []; S.sibuk = false;
    host.innerHTML = `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("buku", 20)}<h3>${esc(t("adm.dp.judul_kartu"))}</h3>${hitungHtml({ id: "dpHitung", teks: "" })}<button type="button" class="jm-tbl jm-tbl-utama jm-tbl-kecil jm-ag-tambah" data-m="tambah">${ikon("unduh", 16)}${esc(t("adm.dp.tambah"))}</button></header>
      <div class="jm-adm-isi"><div class="jm-saring jm-ag-bar">${cariHtml({ id: "dpCari", label: t("adm.dp.cari") })}
        ${pilihHtml({ id: "dpJenisF", ikon: "jenis", label: t("adm.dp.f.jenis"), opsi: [["", t("adm.dp.semua_jenis")], ...JENIS.map((j) => [j, labelJenis(j)])], nilai: S.jenis })}</div>
      <div id="dpDaftar" aria-live="polite"></div></div></section>`;
    $("dpCari").value = S.cari;
    isiTabel();
  }

  function isiTabel() {
    const d = $("dpDaftar");
    if (!d) return;
    const q = S.cari.toLowerCase();
    const baris = S.baris.filter((b) => (!q || `${b.judul} ${b.penerbit || ""}`.toLowerCase().includes(q)) && (!S.jenis || b.jenis === S.jenis));
    $("dpHitung").textContent = t("adm.dp.n", { n: angka(baris.length) });
    if (!baris.length) { d.innerHTML = kosongHtml(S.baris.length ? "jm.kosong.cocok" : "adm.dp.kosong"); return; }
    const th = (k) => `<th scope="col">${esc(t("adm.dp.k." + k))}</th>`;
    d.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-ag-tabel"><thead><tr>${th("judul")}${th("penerbit")}${th("jenis")}${th("terbit")}${th("akses")}${th("ukuran")}</tr></thead><tbody>${baris.map((b) => `<tr class="jm-ag-baris" data-ref="${esc(b.ref)}" tabindex="0">
        <td data-l="${esc(t("adm.dp.k.judul"))}"><button type="button" class="jm-adm-nm" data-m="buka" data-ref="${esc(b.ref)}"><strong>${esc(b.judul)}</strong></button><small class="jm-ag-mitra">${esc(b.nama_berkas || "")}</small></td>
        <td data-l="${esc(t("adm.dp.k.penerbit"))}">${esc(b.penerbit || "-")}</td>
        <td data-l="${esc(t("adm.dp.k.jenis"))}"><span class="jm-pil">${esc(labelJenis(b.jenis))}</span></td>
        <td class="jm-nowrap" data-l="${esc(t("adm.dp.k.terbit"))}">${b.tanggal_terbit ? esc(tanggal(b.tanggal_terbit)) : "-"}</td>
        <td data-l="${esc(t("adm.dp.k.akses"))}"><span class="jm-pil ${b.akses === "pengurus" ? "jm-pil-warn" : "jm-pil-ok"}">${esc(t("adm.dp.akses." + (b.akses === "pengurus" ? "pengurus" : "anggota")))}</span>${pilOtor(b.otorisasi)}</td>
        <td class="jm-nowrap" data-l="${esc(t("adm.dp.k.ukuran"))}">${esc(ukuranTeks(b.ukuran))}</td></tr>`).join("")}</tbody></table></div>`;
  }

  /* ---------- zona unggah ---------- */

  function zona() {
    S.ref = ""; S.antre = []; S.i = 0; kabar("ok", "");
    host.innerHTML = `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("unduh", 20)}<h3>${esc(t("adm.dp.tambah"))}</h3></header>
      <div class="jm-adm-isi jm-form"><label class="jm-ag-zona" for="dpBerkas">${ikon("unduh", 28)}<strong>${esc(t("adm.dp.zona"))}</strong><small>${esc(t("adm.dp.zona_bantu"))}</small>
        <input class="sr" id="dpBerkas" type="file" multiple accept=".pdf,.pptx,.docx,.xlsx"></label>
        <div class="jm-aksi"><button type="button" class="jm-tbl" data-m="kembali">${ikon("panah-kiri", 18)}${esc(t("adm.agenda.kembali"))}</button></div></div></section>`;
  }
  function antrekan(daftar) {
    const baik = []; let galat = "";
    for (const f of [...daftar]) {
      if (!EKS.includes(ekstensi(f.name))) galat = t("adm.dp.g415");
      else if (f.size > MAKS) galat = t("adm.dp.g413");
      else baik.push(f);
    }
    kabar("galat", galat);
    if (!baik.length) return;
    S.antre = baik; S.i = 0; S.jumlah = 0;
    formBerkas();
  }

  /* ---------- formulir metadata (berkas baru atau ubah) ---------- */

  function medan(b, f) {
    const baru = !!f;
    const jenis = (b && b.jenis) || "laporan", akses = (b && b.akses) || "anggota", bhs = (b && b.bahasa) || "id";
    const pil = (id, ik, kunci, opsi, nilai) => `<div class="jm-medan"><label for="${id}">${esc(t(kunci))}</label>${pilihHtml({ id, ikon: ik, label: t(kunci), opsi, nilai })}</div>`;
    return `<div class="jm-medan"><label for="dpJudul">${esc(t("adm.dp.f.judul"))}</label><input class="jm-isian" id="dpJudul" maxlength="300" autocomplete="off" required value="${esc(baru ? judulDari(f.name) : isiNol(b.judul))}"></div>
      <div class="jm-medan"><label for="dpPenerbit">${esc(t("adm.dp.f.penerbit"))}</label><input class="jm-isian" id="dpPenerbit" maxlength="200" autocomplete="off" required value="${esc(isiNol(b && b.penerbit))}"></div>
      <div class="jm-ag-dua"><div class="jm-medan"><label for="dpTerbit">${esc(t("adm.dp.f.terbit"))}</label><input class="jm-isian" id="dpTerbit" type="date" value="${esc(isiNol(b && b.tanggal_terbit))}"></div>
      ${pil("dpJenis", "jenis", "adm.dp.f.jenis", JENIS.map((j) => [j, labelJenis(j)]), jenis)}</div>
      <div class="jm-ag-dua">${pil("dpBahasa", "bahasa", "adm.dp.f.bahasa", [["id", t("pu.bahasa.id")], ["en", t("pu.bahasa.en")]], bhs)}
      ${pil("dpAkses", "status", "adm.dp.f.akses", [["anggota", t("adm.dp.akses.anggota")], ["pengurus", t("adm.dp.akses.pengurus")]], akses)}</div>
      <div class="jm-medan"><label for="dpRingkasan">${esc(t("adm.dp.f.ringkasan"))}</label><textarea class="jm-isian jm-ag-teks jm-bm-ring" id="dpRingkasan" rows="4" maxlength="600">${esc(isiNol(b && b.ringkasan))}</textarea></div>`;
  }

  function formBerkas() {
    const f = S.antre[S.i];
    host.innerHTML = `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon(IK[ekstensi(f.name)] || "pdf", 20)}<h3>${esc(t("adm.dp.berkas_n", { n: angka(S.i + 1), total: angka(S.antre.length) }))}</h3></header>
      <form class="jm-adm-isi jm-form" id="dpForm" novalidate>
        <p class="jm-bantu"><b>${esc(f.name)}</b> | ${esc(ukuranTeks(f.size))}</p>
        ${medan(null, f)}
        <p class="jm-bantu" id="dpProgres" role="status"></p>
        <div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-utama" id="dpSimpan">${ikon("unduh", 18)}${esc(t("adm.dp.unggah"))}</button>
          ${S.antre.length > 1 ? `<button type="button" class="jm-tbl" data-m="lewati">${esc(t("adm.dp.lewati"))}</button>` : ""}
          <button type="button" class="jm-tbl" data-m="selesai">${esc(t("jm.batal"))}</button></div>
      </form></section>`;
  }

  async function bukaEdit(ref) {
    const b = S.baris.find((x) => x.ref === ref);
    if (!b) return;
    S.ref = ref; kabar("ok", "");
    host.innerHTML = `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon(IK[ekstensi(b.nama_berkas)] || "pdf", 20)}<h3>${esc(t("adm.dp.ubah_judul"))}</h3></header>
      <form class="jm-adm-isi jm-form" id="dpForm" novalidate>
        <p class="jm-bantu"><b>${esc(b.nama_berkas || "")}</b> | ${esc(ukuranTeks(b.ukuran))}</p>
        ${medan(b, null)}
        <div class="jm-aksi"><button type="button" class="jm-tbl" data-m="kembali">${ikon("panah-kiri", 18)}${esc(t("adm.agenda.kembali"))}</button>
          <button type="submit" class="jm-tbl jm-tbl-utama" id="dpSimpan">${ikon("centang", 18)}${esc(t("jm.simpan"))}</button>
          <a class="jm-tbl" href="/api/pustaka-unggah/${encodeURIComponent(ref)}/unduh" download>${ikon("unduh", 18)}${esc(t("pu.unduh"))}</a>
          <button type="button" class="jm-tbl jm-tbl-bahaya" data-m="hapus">${ikon("silang", 18)}${esc(t("adm.dp.hapus"))}</button></div>
      </form></section>`;
  }

  function bacaForm() {
    const v = (id) => $(id).value.trim();
    if (!v("dpJudul") || !v("dpPenerbit")) return { galat: t("adm.dp.g_wajib") };
    return { m: { judul: v("dpJudul"), penerbit: v("dpPenerbit"), jenis: $("dpJenis").value, akses: $("dpAkses").value, bahasa: $("dpBahasa").value, tanggal_terbit: $("dpTerbit").value, ringkasan: v("dpRingkasan") } };
  }

  async function simpan() {
    const { m, galat } = bacaForm();
    if (galat) { kabar("galat", galat); return; }
    const tbl = $("dpSimpan"); tbl.disabled = true; kabar("ok", "");
    if (S.ref) { // ubah metadata
      try {
        await api("/api/pustaka-unggah/" + encodeURIComponent(S.ref), { metode: "PATCH", badan: { ...m, tanggal_terbit: m.tanggal_terbit || null, ringkasan: m.ringkasan || null } });
        await muatUlang(t("adm.dp.tersimpan") + " " + t("adm.otor.pesan"));
      } catch (e) { tbl.disabled = false; kabar("galat", e.status === 422 ? t("adm.dp.g422") : galatTeks(e.kode || "umum")); }
      return;
    }
    const f = S.antre[S.i], q = new URLSearchParams({ judul: m.judul, penerbit: m.penerbit, jenis: m.jenis, akses: m.akses, bahasa: m.bahasa, nama: f.name });
    if (m.tanggal_terbit) q.set("tanggal_terbit", m.tanggal_terbit);
    if (m.ringkasan) q.set("ringkasan", m.ringkasan);
    const prog = $("dpProgres");
    prog.textContent = t("adm.dp.progres", { nama: f.name, persen: angka(0) });
    try {
      await kirimBerkas({ url: "/api/pustaka-unggah?" + q, tipe: MIME[ekstensi(f.name)], badan: f, onProgres: (p) => { prog.textContent = t("adm.dp.progres", { nama: f.name, persen: angka(p) }); } });
      S.jumlah++;
      lanjut();
    } catch (e) { tbl.disabled = false; prog.textContent = ""; kabar("galat", galatBerkas(e, "adm.dp")); if (e.status === 429 || e.status === 403) selesaiAntre(); }
  }
  function lanjut() {
    if (S.i + 1 < S.antre.length) { S.i++; kabar("ok", ""); formBerkas(); } else selesaiAntre();
  }
  async function selesaiAntre() {
    const n = S.jumlah;
    await muatUlang(n ? t("adm.dp.selesai", { n: angka(n) }) + " " + t("adm.otor.pesan") : "");
  }
  async function muatUlang(pesan) {
    try { const d = await api("/api/pustaka-unggah"); S.baris = urut(Array.isArray(d) ? d : (d && d.baris) || []); } catch (e) { /* daftar lama tetap */ }
    kabar("ok", pesan);
    nanti(rangkaDaftar);
  }
  async function hapus() {
    const ref = S.ref;
    try {
      await api("/api/pustaka-unggah/" + encodeURIComponent(ref), { metode: "DELETE" });
      S.baris = S.baris.filter((x) => x.ref !== ref);
      kabar("ok", t("adm.dp.terhapus"));
      nanti(rangkaDaftar);
    } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
  }

  /* ---------- penangan ---------- */

  function masuk(e) { if (e.target.id === "dpCari") { S.cari = e.target.value.trim(); cariTunda(); } }
  function ubah(e) {
    const x = e.target;
    if (x.id === "dpJenisF") { S.jenis = x.value; nanti(isiTabel); }
    else if (x.id === "dpBerkas" && x.files.length) antrekan(x.files);
  }
  function klik(e) {
    const b = e.target.closest("button");
    if (!b) { const tr = e.target.closest("tr[data-ref]"); if (tr) bukaEdit(tr.dataset.ref); return; }
    if (b.dataset.aksi === "ulang") { muatDaftar(); return; }
    switch (b.dataset.m) {
      case "buka": bukaEdit(b.dataset.ref); break;
      case "tambah": zona(); break;
      case "kembali": kabar("ok", ""); nanti(rangkaDaftar); break;
      case "lewati": lanjut(); break;
      case "selesai": selesaiAntre(); break;
      case "hapus": konfirmasiHapus({ judul: t("adm.dp.hapus_judul"), isi: t("adm.dp.hapus_isi"), ya: hapus }); break;
    }
  }
  host.addEventListener("dragover", (e) => { const z = e.target.closest(".jm-ag-zona"); if (z) { e.preventDefault(); z.classList.add("jm-ag-zona-on"); } });
  host.addEventListener("dragleave", (e) => { const z = e.target.closest(".jm-ag-zona"); if (z) z.classList.remove("jm-ag-zona-on"); });
  host.addEventListener("drop", (e) => {
    const z = e.target.closest(".jm-ag-zona");
    if (!z) return;
    e.preventDefault(); z.classList.remove("jm-ag-zona-on");
    if (e.dataTransfer.files.length) antrekan(e.dataTransfer.files);
  });
}
