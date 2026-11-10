/* /admin: tab "METI dalam berita" (Konten). Butir siaran pers, liputan media, dan liputan kegiatan yang tampil di /siaran-pers.
   Hak ditegakkan di server (admin dan super). INP: klik baris mengubah chrome seketika; tabel dirender lewat nanti(). */
import { t, angka, tanggal } from "/i18n.js";
import { cariHtml, pilihHtml, hitungHtml } from "/inti/komponen.js";
import { esc, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";
import { konfirmasiHapus, kirimBerkas, galatBerkas } from "/admin_konten.js";

const JENIS = ["liputan_media", "liputan_kegiatan", "siaran_pers"];
const IKON_JENIS = { siaran_pers: "siaran", liputan_media: "berita", liputan_kegiatan: "kalender" };
const TIPE_FOTO = ["image/jpeg", "image/png", "image/webp"];
const MAKS_FOTO = 5 * 1048576;
const urlHttps = (u) => /^https:\/\/[^\s/]+\S*$/i.test(u);
const pilOtor = (o) => (o ? ` <span class="jm-pil ${o === "disahkan" ? "jm-pil-ok" : o === "ditolak" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(t("adm.otor." + o))}</span>` : "");
const isiNol = (v) => (v == null ? "" : String(v));

export function panelBeritaMeti(el) {
  const S = { baris: null, cari: "", jenis: "", ref: "", foto: null, ctl: null };
  const $ = (id) => el.querySelector("#" + id);
  const kabar = (jenis, teks) => { const s = $("bmStatus"); if (s) s.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };

  el.innerHTML = `<div id="bmHost"></div><div id="bmStatus" aria-live="polite"></div>`;
  const host = $("bmHost");
  host.addEventListener("click", klik);
  host.addEventListener("input", masuk);
  host.addEventListener("change", ubah);
  host.addEventListener("submit", (e) => { if (e.target.id === "bmForm") { e.preventDefault(); simpan(); } });
  host.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches && e.target.matches("tr[data-ref]")) bukaEditor(e.target.dataset.ref); });
  const cariTunda = debounce(() => isiTabel());
  muatDaftar();

  async function muatDaftar() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    host.innerHTML = hantuHtml(5);
    try {
      const d = await api("/api/berita-meti", { signal: S.ctl.signal });
      S.baris = (Array.isArray(d) ? d : (d && d.baris) || []).slice().sort((a, c) => String(c.tanggal).localeCompare(String(a.tanggal)));
    } catch (e) {
      if (e.name === "AbortError") return;
      host.innerHTML = galatHtml(e.kode || "umum");
      return;
    }
    nanti(rangkaDaftar);
  }

  function rangkaDaftar() {
    S.ref = ""; S.foto = null;
    host.innerHTML = `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("berita", 20)}<h3>${esc(t("adm.bm.judul_kartu"))}</h3>${hitungHtml({ id: "bmHitung", teks: "" })}<button type="button" class="jm-tbl jm-tbl-utama jm-tbl-kecil jm-ag-tambah" data-m="tambah">${ikon("tambah", 16)}${esc(t("adm.bm.tambah"))}</button></header>
      <div class="jm-adm-isi"><div class="jm-saring jm-ag-bar">${cariHtml({ id: "bmCari", label: t("adm.bm.cari") })}
        ${pilihHtml({ id: "bmJenisF", ikon: "jenis", label: t("adm.bm.f.jenis"), opsi: [["", t("adm.bm.semua_jenis")], ...JENIS.map((j) => [j, t("sp.jenis." + j)])], nilai: S.jenis })}</div>
      <div id="bmDaftar" aria-live="polite"></div></div></section>`;
    $("bmCari").value = S.cari;
    isiTabel();
  }

  const blokTgl = (iso) => { const [h, ...sisa] = tanggal(iso).split(" "); return `<span class="jm-ag-tgl"><b>${esc(h)}</b><small>${esc(sisa.join(" "))}</small></span>`; };

  function isiTabel() {
    const d = $("bmDaftar");
    if (!d) return;
    const q = S.cari.toLowerCase();
    const baris = S.baris.filter((b) => (!q || `${b.judul} ${b.media || ""}`.toLowerCase().includes(q)) && (!S.jenis || b.jenis === S.jenis));
    $("bmHitung").textContent = t("adm.bm.n", { n: angka(baris.length) });
    if (!baris.length) { d.innerHTML = kosongHtml(S.baris.length ? "jm.kosong.cocok" : "adm.bm.kosong"); return; }
    const th = (k) => `<th scope="col">${esc(t("adm.bm.k." + k))}</th>`;
    d.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-ag-tabel"><thead><tr>${th("tgl")}${th("jenis")}${th("judul")}${th("media")}${th("status")}</tr></thead><tbody>${baris.map((b) => `<tr class="jm-ag-baris" data-ref="${esc(b.ref)}" tabindex="0">
        <td class="jm-nowrap" data-l="${esc(t("adm.bm.k.tgl"))}">${blokTgl(b.tanggal)}</td>
        <td data-l="${esc(t("adm.bm.k.jenis"))}"><span class="jm-pil">${esc(t("sp.jenis." + b.jenis))}</span></td>
        <td data-l="${esc(t("adm.bm.k.judul"))}"><button type="button" class="jm-adm-nm" data-m="buka" data-ref="${esc(b.ref)}"><strong>${esc(b.judul)}</strong></button></td>
        <td data-l="${esc(t("adm.bm.k.media"))}">${esc(b.media || "-")}</td>
        <td data-l="${esc(t("adm.bm.k.status"))}"><span class="jm-pil ${Number(b.terbit) ? "jm-pil-ok" : "jm-pil-mati"}">${esc(t(Number(b.terbit) ? "adm.bm.terbit" : "adm.bm.draf"))}</span>${pilOtor(b.otorisasi)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  /* ---------- formulir ---------- */

  async function bukaEditor(ref) {
    S.ref = ref; S.foto = null;
    kabar("ok", "");
    host.innerHTML = hantuHtml(4);
    let det;
    try { det = await api("/api/berita-meti/" + encodeURIComponent(ref)); } catch (e) { host.innerHTML = galatHtml(e.kode || "umum"); return; }
    if (S.ref !== ref) return;
    nanti(() => gambarForm(det && det.baris ? det.baris : det));
  }
  function formBaru() { S.ref = ""; S.foto = null; kabar("ok", ""); gambarForm(null); }

  function fotoBlok(b) {
    return `<div class="jm-medan"><span class="jm-bm-label">${esc(t("adm.bm.f.foto"))}</span>
      <div class="jm-bm-foto" id="bmFotoSaatIni">${b && b.foto ? `<img src="${esc(b.foto)}" alt="" loading="lazy" decoding="async"><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-m="hapus-foto">${ikon("silang", 16)}${esc(t("adm.bm.foto_hapus"))}</button>` : ""}</div>
      <label class="jm-ag-zona" for="bmFoto">${ikon("gambar", 28)}<strong>${esc(t("adm.bm.zona"))}</strong><small>${esc(t("adm.bm.zona_bantu"))}</small>
        <input class="sr" id="bmFoto" type="file" accept="image/jpeg,image/png,image/webp"></label>
      <small class="jm-bantu" id="bmFotoNama" role="status"></small></div>`;
  }

  function gambarForm(b) {
    const baru = !b;
    const jenis = (b && b.jenis) || "liputan_media";
    host.innerHTML = `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon(baru ? "tambah" : "ubah", 20)}<h3>${esc(t(baru ? "adm.bm.tambah_judul" : "adm.bm.ubah_judul"))}</h3></header>
      <form class="jm-adm-isi jm-form" id="bmForm" novalidate>
        <div class="jm-medan"><label for="bmJenis">${esc(t("adm.bm.f.jenis"))}</label>${pilihHtml({ id: "bmJenis", ikon: "jenis", label: t("adm.bm.f.jenis"), opsi: JENIS.map((j) => [j, t("sp.jenis." + j), IKON_JENIS[j]]), nilai: jenis })}</div>
        <div class="jm-medan"><label for="bmJudul">${esc(t("adm.bm.f.judul"))}</label><input class="jm-isian" id="bmJudul" maxlength="300" autocomplete="off" required value="${esc(isiNol(b && b.judul))}"></div>
        <div class="jm-ag-dua"><div class="jm-medan"><label for="bmTgl">${esc(t("adm.bm.f.tgl"))}</label><input class="jm-isian" id="bmTgl" type="date" required value="${esc(isiNol(b && b.tanggal))}"></div>
        <div class="jm-medan"><label for="bmKota">${esc(t("adm.bm.f.kota"))}</label><input class="jm-isian" id="bmKota" maxlength="120" autocomplete="off" value="${esc(isiNol(b && b.kota))}"></div></div>
        <div class="jm-ag-dua"><div class="jm-medan"><label for="bmMedia" id="bmMediaL">${esc(t(jenis === "liputan_media" ? "adm.bm.f.media_wajib" : "adm.bm.f.media"))}</label><input class="jm-isian" id="bmMedia" maxlength="160" autocomplete="off" value="${esc(isiNol(b && b.media))}"></div>
        <div class="jm-medan"><label for="bmUrl" id="bmUrlL">${esc(t(jenis === "liputan_media" ? "adm.bm.f.url_wajib" : "adm.bm.f.url"))}</label><input class="jm-isian" id="bmUrl" type="url" inputmode="url" maxlength="600" autocomplete="off" placeholder="${esc(t("adm.bm.url_ph"))}" value="${esc(isiNol(b && b.url))}"></div></div>
        <small class="jm-bantu" id="bmUrlBantu">${esc(t("adm.bm.url_bantu"))}</small>
        <div class="jm-medan"><label for="bmRingkasan">${esc(t("adm.bm.f.ringkasan"))}</label><textarea class="jm-isian jm-ag-teks jm-bm-ring" id="bmRingkasan" rows="3" maxlength="1000">${esc(isiNol(b && b.ringkasan))}</textarea></div>
        <div class="jm-medan"><label for="bmIsi">${esc(t("adm.bm.f.isi"))}</label><textarea class="jm-isian jm-ag-teks" id="bmIsi" rows="10" maxlength="30000">${esc(isiNol(b && b.isi))}</textarea><small class="jm-bantu">${esc(t("adm.bm.isi_bantu"))}</small></div>
        <div class="jm-medan"><label for="bmPenulis">${esc(t("adm.bm.f.penulis"))}</label><input class="jm-isian" id="bmPenulis" maxlength="160" autocomplete="off" value="${esc(isiNol(b && b.penulis))}"></div>
        ${fotoBlok(b)}
        <label class="jm-ag-cek"><input type="checkbox" id="bmTerbit"${b && Number(b.terbit) ? " checked" : ""}><span>${esc(t("adm.bm.f.terbit"))}</span></label>
        <small class="jm-bantu">${esc(t("adm.bm.terbit_bantu"))}</small>
        <p class="jm-bantu" id="bmProgres" role="status"></p>
        <div class="jm-aksi"><button type="button" class="jm-tbl" data-m="kembali">${ikon("panah-kiri", 18)}${esc(t("adm.agenda.kembali"))}</button>
          <button type="submit" class="jm-tbl jm-tbl-utama" id="bmSimpan">${ikon("centang", 18)}${esc(t("jm.simpan"))}</button>
          ${baru ? "" : `<button type="button" class="jm-tbl jm-tbl-bahaya" data-m="hapus">${ikon("silang", 18)}${esc(t("adm.bm.hapus"))}</button>`}</div>
      </form></section>`;
  }

  function badanForm() {
    const v = (id) => $(id).value.trim();
    const jenis = $("bmJenis").value, media = v("bmMedia"), url = v("bmUrl");
    if (!v("bmJudul") || !$("bmTgl").value) return { galat: t("adm.bm.g_wajib") };
    if (jenis === "liputan_media" && (!media || !url)) return { galat: t("adm.bm.g_media") };
    if (url && !urlHttps(url)) return { galat: t("adm.bm.g_url") };
    const badan = { jenis, judul: v("bmJudul"), tanggal: $("bmTgl").value, media, url, ringkasan: v("bmRingkasan"), isi: $("bmIsi").value.trim(), kota: v("bmKota"), penulis: v("bmPenulis"), terbit: $("bmTerbit").checked ? 1 : 0 };
    for (const k of ["media", "url", "ringkasan", "isi", "kota", "penulis"]) if (!badan[k]) { if (S.ref) badan[k] = null; else delete badan[k]; }
    return { badan };
  }

  async function unggahFoto(ref, berkas) {
    const prog = $("bmProgres");
    prog.textContent = t("adm.bm.progres", { persen: angka(0) });
    await kirimBerkas({ metode: "PUT", url: `/api/berita-meti/${encodeURIComponent(ref)}/foto`, tipe: berkas.type, badan: berkas, onProgres: (p) => { prog.textContent = t("adm.bm.progres", { persen: angka(p) }); } });
    prog.textContent = t("adm.bm.foto_ok");
  }

  async function simpan() {
    const { badan, galat } = badanForm();
    if (galat) { kabar("galat", galat); return; }
    const tbl = $("bmSimpan"); tbl.disabled = true; kabar("ok", "");
    let ref = S.ref;
    try {
      if (ref) await api("/api/berita-meti/" + encodeURIComponent(ref), { metode: "PATCH", badan });
      else ref = (await api("/api/berita-meti", { metode: "POST", badan })).ref;
    } catch (e) { tbl.disabled = false; kabar("galat", e.status === 422 ? t("adm.bm.g_422") : galatTeks(e.kode || "umum")); return; }
    if (S.foto) {
      try { await unggahFoto(ref, S.foto); }
      catch (e) { // butir sudah tersimpan; foto bisa diulang dari formulir ubah
        tbl.disabled = false; S.ref = ref;
        kabar("galat", t("adm.bm.tersimpan_tanpa_foto") + " " + galatBerkas(e, "adm.bm.foto"));
        return;
      }
    }
    await muatUlang(t(S.ref ? "adm.bm.tersimpan" : "adm.bm.dibuat") + " " + t("adm.otor.pesan"));
  }

  async function muatUlang(pesan) {
    try {
      const d = await api("/api/berita-meti");
      S.baris = (Array.isArray(d) ? d : (d && d.baris) || []).slice().sort((a, c) => String(c.tanggal).localeCompare(String(a.tanggal)));
    } catch (e) { /* daftar lama tetap */ }
    kabar("ok", pesan);
    nanti(rangkaDaftar);
  }

  async function hapusButir() {
    const ref = S.ref;
    try {
      await api("/api/berita-meti/" + encodeURIComponent(ref), { metode: "DELETE" });
      S.baris = S.baris.filter((x) => x.ref !== ref);
      kabar("ok", t("adm.bm.terhapus"));
      nanti(rangkaDaftar);
    } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
  }
  async function hapusFoto() {
    try {
      await api(`/api/berita-meti/${encodeURIComponent(S.ref)}/foto`, { metode: "DELETE" });
      const k = $("bmFotoSaatIni"); if (k) k.innerHTML = "";
      kabar("ok", t("adm.bm.foto_dihapus"));
    } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
  }

  /* ---------- penangan ---------- */

  function pilihFoto(f) {
    const nama = $("bmFotoNama");
    if (!f) return;
    if (!TIPE_FOTO.includes(f.type)) { S.foto = null; $("bmFoto").value = ""; nama.textContent = ""; kabar("galat", t("adm.bm.foto.g415")); return; }
    if (f.size > MAKS_FOTO) { S.foto = null; $("bmFoto").value = ""; nama.textContent = ""; kabar("galat", t("adm.bm.foto.g413")); return; }
    kabar("ok", ""); S.foto = f; nama.textContent = t("adm.bm.foto_dipilih", { nama: f.name });
  }
  function masuk(e) { if (e.target.id === "bmCari") { S.cari = e.target.value.trim(); cariTunda(); } }
  function ubah(e) {
    const x = e.target;
    if (x.id === "bmJenisF") { S.jenis = x.value; nanti(isiTabel); }
    else if (x.id === "bmJenis") { // chrome seketika: label wajib berubah menurut jenis
      const m = x.value === "liputan_media";
      $("bmMediaL").textContent = t(m ? "adm.bm.f.media_wajib" : "adm.bm.f.media");
      $("bmUrlL").textContent = t(m ? "adm.bm.f.url_wajib" : "adm.bm.f.url");
    } else if (x.id === "bmFoto") pilihFoto(x.files[0]);
  }
  function klik(e) {
    const b = e.target.closest("button");
    if (!b) { const tr = e.target.closest("tr[data-ref]"); if (tr) bukaEditor(tr.dataset.ref); return; }
    if (b.dataset.aksi === "ulang") { S.ref ? bukaEditor(S.ref) : muatDaftar(); return; }
    switch (b.dataset.m) {
      case "buka": bukaEditor(b.dataset.ref); break;
      case "tambah": formBaru(); break;
      case "kembali": kabar("ok", ""); nanti(rangkaDaftar); break;
      case "hapus": konfirmasiHapus({ judul: t("adm.bm.hapus_judul"), isi: t("adm.bm.hapus_isi"), ya: hapusButir }); break;
      case "hapus-foto": hapusFoto(); break;
    }
  }
  host.addEventListener("dragover", (e) => { const z = e.target.closest(".jm-ag-zona"); if (z) { e.preventDefault(); z.classList.add("jm-ag-zona-on"); } });
  host.addEventListener("dragleave", (e) => { const z = e.target.closest(".jm-ag-zona"); if (z) z.classList.remove("jm-ag-zona-on"); });
  host.addEventListener("drop", (e) => {
    const z = e.target.closest(".jm-ag-zona");
    if (!z) return;
    e.preventDefault(); z.classList.remove("jm-ag-zona-on");
    if (e.dataTransfer.files.length) pilihFoto(e.dataTransfer.files[0]);
  });
}
