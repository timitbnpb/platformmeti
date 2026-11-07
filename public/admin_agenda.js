/* /admin: tab Agenda (K20, JM-F11). Bukti kegiatan METI: tempat, notulensi, foto. Hak ditegakkan di server (DT §4.4).
   INP: klik baris/tombol mengubah chrome seketika; kisi foto dan tabel dirender lewat nanti(). */
import { t, ada, angka, tanggal } from "/i18n.js";
import { esc, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml, galatTeks, ikon, pesanHtml, GalatApi } from "/inti/umum.js";

const MAKS_NOTULEN = 30000;
const SISI = 2000;
const TIPE = ["image/jpeg", "image/png", "image/webp"];
const label = (j) => (ada("kal.jenis." + j) ? t("kal.jenis." + j) : j || "");

export function panelAgenda(el, saya) {
  const S = { acara: null, bukti: new Map(), cari: "", ref: "", ctl: null };
  const $ = (id) => el.querySelector("#" + id);
  const dlg = document.getElementById("dlg");
  const kabar = (jenis, teks) => { const s = $("agStatus"); if (s) s.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };

  el.innerHTML = `<div id="agHost"></div><div id="agStatus" aria-live="polite"></div>`;
  const host = $("agHost");
  host.addEventListener("click", klik);
  host.addEventListener("input", masuk);
  host.addEventListener("change", ubah);
  const cariTunda = debounce(() => isiTabel());
  muatDaftar();

  async function muatDaftar() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    host.innerHTML = hantuHtml(5);
    try {
      const [kal, ag] = await Promise.all([
        fetch("/data/kalender.json", { signal: S.ctl.signal }).then((r) => { if (!r.ok) throw new GalatApi("layanan", r.status); return r.json(); }),
        api("/api/agenda", { signal: S.ctl.signal }),
      ]);
      S.acara = (kal.baris || []).filter((b) => b.sumber && b.sumber.label === "arsip-meti").sort((a, c) => c.tanggal.localeCompare(a.tanggal));
      S.bukti = new Map(((ag && ag.bukti) || []).map((b) => [b.kegiatan_ref, b]));
    } catch (e) {
      if (e.name === "AbortError") return;
      host.innerHTML = galatHtml(e.kode || "umum");
      return;
    }
    nanti(rangkaDaftar);
  }

  function rangkaDaftar() {
    S.ref = "";
    host.innerHTML = `<div class="jm-bar jm-ag-bar"><div class="jm-medan"><label class="sr" for="agCari">${esc(t("adm.agenda.cari"))}</label>
        <input class="jm-isian" id="agCari" type="search" autocomplete="off" placeholder="${esc(t("adm.agenda.cari"))}" value="${esc(S.cari)}"></div>
        <span class="jm-hitung" id="agHitung" role="status"></span></div>
      <div id="agDaftar" aria-live="polite"></div>`;
    isiTabel();
  }

  function isiTabel() {
    const d = $("agDaftar");
    if (!d) return;
    const q = S.cari.toLowerCase();
    const baris = S.acara.filter((b) => !q || b.judul.toLowerCase().includes(q));
    $("agHitung").textContent = t("adm.agenda.n", { n: angka(baris.length) });
    if (!baris.length) { d.innerHTML = kosongHtml("jm.kosong.cocok"); return; }
    d.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-ag-tabel"><thead><tr>${["tgl", "judul", "mitra", "jenis", "foto", "notulen"].map((k) => `<th scope="col">${esc(t("adm.agenda.k." + k))}</th>`).join("")}</tr></thead><tbody>${baris.map((b) => {
      const x = S.bukti.get(b.id), n = x ? x.jumlah_foto || 0 : 0;
      return `<tr class="jm-ag-baris" data-ref="${esc(b.id)}" tabindex="0">
        <td class="jm-nowrap" data-l="${esc(t("adm.agenda.k.tgl"))}">${esc(tanggal(b.tanggal))}</td>
        <td data-l="${esc(t("adm.agenda.k.judul"))}"><button type="button" class="jm-adm-nm" data-m="buka" data-ref="${esc(b.id)}"><strong>${esc(b.judul)}</strong></button></td>
        <td data-l="${esc(t("adm.agenda.k.mitra"))}">${esc(b.mitra || "-")}</td>
        <td data-l="${esc(t("adm.agenda.k.jenis"))}"><span class="jm-pil">${esc(label(b.jenis))}</span></td>
        <td class="jm-num" data-l="${esc(t("adm.agenda.k.foto"))}">${n ? esc(angka(n)) : "-"}</td>
        <td data-l="${esc(t("adm.agenda.k.notulen"))}"><span class="jm-pil ${x && x.ada_notulensi ? "jm-pil-ok" : "jm-pil-warn"}">${esc(t(x && x.ada_notulensi ? "adm.agenda.ada" : "adm.agenda.belum"))}</span></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  /* ---------- penyunting ---------- */

  async function bukaEditor(ref) {
    const acara = S.acara.find((b) => b.id === ref);
    if (!acara) return;
    S.ref = ref;
    host.innerHTML = hantuHtml(4); // chrome seketika
    let det;
    try { det = await api("/api/agenda/" + encodeURIComponent(ref)); } catch (e) { host.innerHTML = galatHtml(e.kode || "umum"); return; }
    if (S.ref !== ref) return;
    nanti(() => gambarEditor(acara, det));
  }

  function gambarEditor(acara, det) {
    const b = det.bukti || {};
    host.dataset.ref = acara.id;
    host.innerHTML = `<div class="jm-ag-ed">
      <button type="button" class="jm-tbl jm-tbl-kecil" data-m="kembali">${ikon("panah-kiri", 18)}${esc(t("adm.agenda.kembali"))}</button>
      <header class="jm-ag-judul"><h2>${esc(acara.judul)}</h2><p class="jm-bantu">${esc(tanggal(acara.tanggal))}${acara.mitra ? ", " + esc(acara.mitra) : ""}</p></header>
      <form class="jm-form" id="agForm" novalidate>
        <div class="jm-medan"><label for="agTempat">${esc(t("adm.agenda.tempat"))}</label><input class="jm-isian" id="agTempat" maxlength="200" autocomplete="off" value="${esc(b.tempat || "")}"></div>
        <div class="jm-medan"><label for="agNotulen">${esc(t("adm.agenda.notulen"))}</label>
          <textarea class="jm-isian jm-ag-teks" id="agNotulen" rows="12" maxlength="${MAKS_NOTULEN}">${esc(b.notulensi || "")}</textarea>
          <small class="jm-bantu" id="agHitungK" aria-live="polite"></small></div>
        <div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-utama" id="agSimpan">${esc(t("jm.simpan"))}</button></div>
      </form>
      <section class="jm-ag-foto" aria-labelledby="agFotoJ"><h3 id="agFotoJ">${esc(t("adm.agenda.foto"))}</h3>
        <div class="jm-medan"><label for="agBerkas">${esc(t("adm.agenda.pilih_foto"))}</label>
          <input class="jm-isian" id="agBerkas" type="file" multiple accept="image/jpeg,image/png,image/webp"></div>
        <p class="jm-bantu" id="agProgres" role="status"></p>
        <div class="jm-ag-kisi" id="agKisi"></div></section></div>`;
    hitungKar();
    kisi(det.foto || []);
  }

  const hitungKar = () => { const a = $("agNotulen"), h = $("agHitungK"); if (a && h) h.textContent = t("adm.agenda.karakter", { n: angka(a.value.length), maks: angka(MAKS_NOTULEN) }); };

  function kisi(foto) {
    const k = $("agKisi");
    if (!k) return;
    k.innerHTML = foto.length ? foto.map((f) => `<figure class="jm-ag-f" data-id="${esc(f.id)}">
        <img src="/api/agenda/foto/${encodeURIComponent(f.id)}" alt="${esc(f.keterangan || t("adm.agenda.foto"))}" loading="lazy" decoding="async">
        <div class="jm-medan"><label class="sr" for="agK${esc(f.id)}">${esc(t("adm.agenda.keterangan"))}</label>
          <input class="jm-isian" id="agK${esc(f.id)}" data-ket="${esc(f.id)}" maxlength="300" autocomplete="off" placeholder="${esc(t("adm.agenda.keterangan"))}" value="${esc(f.keterangan || "")}"></div>
        <button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-m="hapus" data-id="${esc(f.id)}">${ikon("silang", 16)}${esc(t("adm.agenda.hapus"))}</button></figure>`).join("")
      : `<p class="jm-bantu">${esc(t("adm.agenda.foto_kosong"))}</p>`;
  }

  async function muatFoto() {
    try { const det = await api("/api/agenda/" + encodeURIComponent(S.ref)); kisi(det.foto || []); await segarkanRingkas(); } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
  }
  async function segarkanRingkas() {
    try { const ag = await api("/api/agenda"); S.bukti = new Map(((ag && ag.bukti) || []).map((b) => [b.kegiatan_ref, b])); } catch (e) {}
  }

  /* perkecil di canvas: sisi terpanjang 2000 px, JPEG 0,85; EXIF ikut terbuang */
  async function perkecil(berkas) {
    const bm = await createImageBitmap(berkas);
    const skala = Math.min(1, SISI / Math.max(bm.width, bm.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bm.width * skala));
    c.height = Math.max(1, Math.round(bm.height * skala));
    const g = c.getContext("2d");
    g.fillStyle = "white"; // PNG/WebP transparan tidak jadi hitam di JPEG
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(bm, 0, 0, c.width, c.height);
    if (bm.close) bm.close();
    return new Promise((ok, gagal) => c.toBlob((b) => (b ? ok(b) : gagal(new Error("blob"))), "image/jpeg", 0.85));
  }

  async function unggah(daftar) {
    const berkas = [...daftar].filter((f) => TIPE.includes(f.type));
    const prog = $("agProgres");
    if (!berkas.length) { kabar("galat", galatTeks("salah-masukan")); return; }
    kabar("ok", "");
    let gagal = 0;
    for (let i = 0; i < berkas.length; i++) {
      prog.textContent = t("adm.agenda.progres", { n: angka(i + 1), total: angka(berkas.length) });
      try {
        const blob = await perkecil(berkas[i]);
        const r = await fetch(`/api/agenda/${encodeURIComponent(S.ref)}/foto?keterangan=`, { method: "POST", credentials: "same-origin", headers: { "x-pb": "1", "content-type": "image/jpeg" }, body: blob });
        if (!r.ok) throw new GalatApi(r.status === 413 ? "terlalu-besar" : r.status === 429 ? "terlalu-sering" : r.status === 403 ? "dilarang" : "umum", r.status);
      } catch (e) { gagal++; kabar("galat", galatTeks(e.kode || "umum")); if (e.status === 429 || e.status === 403) break; }
    }
    prog.textContent = gagal ? "" : t("adm.agenda.selesai", { n: angka(berkas.length) });
    const inp = $("agBerkas"); if (inp) inp.value = "";
    await muatFoto();
  }

  /* ---------- dialog bawaan untuk konfirmasi hapus (bukan confirm()) ---------- */

  function konfirmasi(id) {
    dlg.innerHTML = `<div class="jm-form"><h2 id="dlgJudul">${esc(t("adm.agenda.hapus_judul"))}</h2><p>${esc(t("adm.agenda.hapus_isi"))}</p>
      <div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-bahaya" data-ag="ya">${esc(t("adm.agenda.hapus"))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></div>`;
    const tangan = (e) => {
      if (!e.target.closest('[data-ag="ya"]')) return;
      dlg.removeEventListener("click", tangan);
      dlg.close();
      hapusFoto(id);
    };
    dlg.addEventListener("click", tangan);
    dlg.addEventListener("close", () => dlg.removeEventListener("click", tangan), { once: true });
    if (!dlg.open) dlg.showModal();
  }

  async function hapusFoto(id) {
    const f = host.querySelector(`.jm-ag-f[data-id="${CSS.escape(String(id))}"]`);
    if (f) f.setAttribute("aria-busy", "true");
    try { await api("/api/agenda/foto/" + encodeURIComponent(id), { metode: "DELETE" }); kabar("ok", t("adm.agenda.terhapus")); await muatFoto(); }
    catch (e) { if (f) f.removeAttribute("aria-busy"); kabar("galat", galatTeks(e.kode || "umum")); }
  }

  async function simpan() {
    const tbl = $("agSimpan");
    tbl.disabled = true;
    kabar("ok", "");
    const tempat = $("agTempat").value.trim(), notulensi = $("agNotulen").value;
    try {
      await api("/api/agenda/" + encodeURIComponent(S.ref), { metode: "PUT", badan: { tempat: tempat || null, notulensi: notulensi.trim() ? notulensi : null } });
      kabar("ok", t("adm.agenda.tersimpan"));
      await segarkanRingkas();
    } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
    tbl.disabled = false;
  }

  /* ---------- penangan ---------- */

  function masuk(e) {
    if (e.target.id === "agCari") { S.cari = e.target.value.trim(); cariTunda(); }
    else if (e.target.id === "agNotulen") hitungKar();
  }
  async function ubah(e) {
    const x = e.target;
    if (x.id === "agBerkas") { if (x.files.length) unggah(x.files); }
    else if (x.dataset.ket) {
      try { await api("/api/agenda/foto/" + encodeURIComponent(x.dataset.ket), { metode: "PATCH", badan: { keterangan: x.value.trim() } }); kabar("ok", t("adm.agenda.tersimpan")); }
      catch (err) { kabar("galat", galatTeks(err.kode || "umum")); }
    }
  }
  function klik(e) {
    const b = e.target.closest("button");
    if (!b) {
      const tr = e.target.closest("tr[data-ref]");
      if (tr) bukaEditor(tr.dataset.ref);
      return;
    }
    if (b.dataset.aksi === "ulang") { S.ref ? bukaEditor(S.ref) : muatDaftar(); return; }
    switch (b.dataset.m) {
      case "buka": bukaEditor(b.dataset.ref); break;
      case "kembali": kabar("ok", ""); nanti(rangkaDaftar); break;
      case "hapus": konfirmasi(b.dataset.id); break;
    }
  }
  host.addEventListener("submit", (e) => { if (e.target.id === "agForm") { e.preventDefault(); simpan(); } });
  host.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches && e.target.matches("tr[data-ref]")) bukaEditor(e.target.dataset.ref); });
}
