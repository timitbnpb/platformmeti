/* Kelola dokumen Konsultasi (pengurus, kurator, admin, super): metadata, unggah berkas asli ke R2 privat, pecah naskah ke bab/pasal/ayat yang bisa disunting,
   lalu simpan sebagai draf atau terbitkan. Dipakai tab Konsultasi dan tab Konsultasi di Admin. PDF: tempel teksnya (peramban tak punya pengurai PDF). */
import { t, angka } from "/i18n.js";
import { esc, api, nanti, ikon, galatTeks } from "/inti/umum.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { pecahNaskah, ekstrakDocx } from "/inti/naskah.js";

const HAL = 12, JENIS = ["ruu", "rpp", "rperpres", "rpermen", "masukan"], TAHAP = ["usul", "pembahasan", "konsultasi", "disahkan"], TINGKAT = ["bab", "pasal", "ayat", "butir"];
const MAKS_BERKAS = 15 * 1024 * 1024;

export async function bukaKelola(dok, { selesai } = {}) {
  document.getElementById("kfDlg")?.remove();
  const dlg = document.createElement("dialog");
  dlg.id = "kfDlg"; dlg.className = "jm-dlg kf-dlg"; dlg.setAttribute("aria-labelledby", "kfDlgJ");
  dlg.style.width = "min(960px, calc(100vw - 24px))"; // lembar kerja lebar
  document.body.append(dlg);
  const S = { bagian: null, terkunci: false, hal: 1, berkas: null };
  const baru = !dok;
  if (!baru) {
    try { const d = await api("/api/konsultasi/" + encodeURIComponent(dok.id)); S.bagian = d.bagian.map(({ id, urutan, ...b }) => b); S.terkunci = d.utas.some((u) => u.bagian_id != null); dok = { ...dok, ...d.dokumen }; } catch { S.bagian = []; }
  } else S.bagian = [];
  const opsi = (daftar, awalan, pilih) => daftar.map((v) => `<option value="${v}"${v === pilih ? " selected" : ""}>${esc(t(awalan + v))}</option>`).join("");
  const f = (id, kunci, nilai, tipe = "text", ekstra = "") => `<div class="jm-medan"><label for="${id}">${esc(t(kunci))}</label><input class="jm-isian" id="${id}" type="${tipe}" value="${esc(nilai ?? "")}" ${ekstra}></div>`;
  const sel = (id, kunci, isi) => `<div class="jm-medan"><label for="${id}">${esc(t(kunci))}</label><select class="jm-isian" id="${id}" data-asli>${isi}</select></div>`;

  function pratinjau() {
    const el = dlg.querySelector("#kfBagian");
    if (!S.bagian.length) { el.innerHTML = `<p class="jm-bantu">${esc(t(S.terkunci ? "kf.kl.terkunci" : "kf.kl.belum_bagian"))}</p>`; return; }
    const awalH = (S.hal - 1) * HAL;
    el.innerHTML = `${S.terkunci ? `<p class="jm-bantu">${esc(t("kf.kl.terkunci"))}</p>` : ""}${S.bagian.slice(awalH, awalH + HAL).map((b, i) => { const n = awalH + i; return `<div class="kf-form" data-n="${n}">
      <div class="kf-meta"><select data-k="tingkat" class="jm-isian" data-asli aria-label="${esc(t("kf.kl.tingkat"))}">${opsi(TINGKAT, "kf.tingkat.", b.tingkat)}</select>
      <input data-k="nomor" class="jm-isian" value="${esc(b.nomor)}" maxlength="40" placeholder="${esc(t("kf.kl.nomor"))}" aria-label="${esc(t("kf.kl.nomor"))}">
      <input data-k="judul" class="jm-isian" value="${esc(b.judul)}" maxlength="300" placeholder="${esc(t("kf.kl.judul_bagian"))}" aria-label="${esc(t("kf.kl.judul_bagian"))}">
      <button type="button" class="jm-tbl jm-tbl-kecil" data-hapus-bagian="${n}"${S.terkunci ? " disabled" : ""}>${ikon("silang", 16)}<span>${esc(t("kf.hapus"))}</span></button></div>
      <textarea data-k="teks" maxlength="20000" aria-label="${esc(t("kf.kl.teks_bagian"))}"${S.terkunci ? " readonly" : ""}>${esc(b.teks)}</textarea>
      ${S.bagian[n].tingkat === "butir" ? `<input data-k="rujukan" class="jm-isian" value="${esc(b.rujukan)}" maxlength="200" placeholder="${esc(t("kf.rujukan"))}" aria-label="${esc(t("kf.rujukan"))}">` : ""}</div>`; }).join("")}${paginasiHtml({ hal: S.hal, total: S.bagian.length, per: HAL, satuan: "kf.pag_bagian" })}`;
  }
  dlg.innerHTML = `<form class="jm-form" id="kfFormKelola" novalidate><h2 id="kfDlgJ">${esc(t(baru ? "kf.dokumen_baru" : "kf.kl.sunting"))}</h2><p class="jm-bantu">${esc(t("kf.kl.bantu"))}</p>
    ${f("kfJudul", "kf.kl.judul", dok?.judul, "text", 'maxlength="300" required')}
    ${sel("kfJenis", "kf.kl.jenis", opsi(JENIS, "kf.jenis_dok.", dok?.jenis || "ruu"))}${sel("kfBentuk", "kf.kl.bentuk", opsi(["naskah", "butir"], "kf.bentuk.", dok?.bentuk || "naskah"))}
    ${f("kfInstansi", "kf.kl.instansi", dok?.instansi, "text", 'maxlength="200"')}${sel("kfTahap", "kf.kl.tahap", opsi(TAHAP, "kons.tahap.", dok?.tahap || "konsultasi"))}
    ${f("kfTenggat", "kf.kl.tenggat", dok?.tenggat, "date")}${f("kfUrl", "kf.kl.sumber", dok?.sumber_url, "url", 'maxlength="600" placeholder="https://"')}
    ${f("kfCatatan", "kf.kl.catatan", dok?.catatan, "text", 'maxlength="600"')}
    <div class="jm-medan"><label for="kfBerkas">${esc(t("kf.kl.berkas"))}</label><input class="jm-isian" id="kfBerkas" type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain"><p class="jm-bantu">${esc(t(dok?.berkas_nama ? "kf.kl.berkas_ada" : "kf.kl.berkas_bantu", { nama: dok?.berkas_nama || "" }))}</p></div>
    <div class="jm-medan"><label for="kfTempel">${esc(t("kf.kl.tempel"))}</label><textarea class="jm-isian" id="kfTempel" rows="6" maxlength="400000" placeholder="${esc(t("kf.kl.tempel_ph"))}"${S.terkunci ? " readonly" : ""}></textarea>
      <div class="kf-aksi"><button type="button" class="jm-tbl jm-tbl-kecil" id="kfPecah"${S.terkunci ? " disabled" : ""}>${ikon("tabel", 16)}<span>${esc(t("kf.kl.pecah"))}</span></button></div></div>
    <h3>${esc(t("kf.kl.bagian"))} <span class="jm-pil" id="kfJumlah">${esc(angka(S.bagian.length))}</span></h3><div id="kfBagian"></div>
    ${sel("kfStatus", "kf.kl.status", opsi(["draf", "terbit", "arsip"], "kf.status_dok.", dok?.status || "draf"))}
    <p class="ev-dlg-galat" id="kfGalat" role="alert" hidden></p>
    <div class="jm-aksi"><button type="button" class="jm-tbl" data-tutup-dlg>${esc(t("jm.batal"))}</button><button type="submit" class="jm-tbl jm-tbl-utama" id="kfSimpan">${esc(t("jm.simpan"))}</button></div></form>`;
  const $ = (id) => dlg.querySelector("#" + id), galat = (teks) => { const g = $("kfGalat"); g.textContent = teks; g.hidden = !teks; };
  pratinjau();
  dlg.querySelector("[data-tutup-dlg]").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => dlg.remove());

  $("kfBerkas").addEventListener("change", async (e) => {
    const b = e.target.files[0]; S.berkas = null; galat("");
    if (!b) return;
    if (b.size > MAKS_BERKAS) { e.target.value = ""; return galat(galatTeks("terlalu-besar")); }
    S.berkas = b;
    try {
      if (/\.docx$/i.test(b.name)) $("kfTempel").value = await ekstrakDocx(await b.arrayBuffer());
      else if (/\.txt$/i.test(b.name)) $("kfTempel").value = await b.text();
    } catch { galat(t("kf.kl.docx_gagal")); }
  });
  $("kfPecah").addEventListener("click", () => {
    const b = pecahNaskah($("kfTempel").value);
    if (!b.length) return galat(t("kf.kl.pecah_kosong"));
    galat(""); S.bagian = b.map((x) => ({ tingkat: x.tingkat, nomor: x.nomor, judul: x.judul, teks: x.teks, rujukan: "", alasan: "", status_asal: "", sumber_asal: "" })); S.hal = 1;
    $("kfJumlah").textContent = angka(S.bagian.length); nanti(pratinjau);
  });
  dlg.addEventListener("click", (e) => {
    const h = e.target.closest("[data-hal]");
    if (h) { S.hal = Number(h.dataset.hal); return nanti(pratinjau); }
    const x = e.target.closest("[data-hapus-bagian]");
    if (x) { S.bagian.splice(Number(x.dataset.hapusBagian), 1); $("kfJumlah").textContent = angka(S.bagian.length); nanti(pratinjau); }
  });
  dlg.addEventListener("change", (e) => {
    const k = e.target.dataset?.k, kartu = e.target.closest("[data-n]");
    if (!k || !kartu) return;
    S.bagian[Number(kartu.dataset.n)][k] = e.target.value;
  });
  $("kfFormKelola").addEventListener("submit", async (e) => {
    e.preventDefault(); galat("");
    const v = (id) => $(id).value.trim();
    if (v("kfJudul").length < 3) return galat(galatTeks("salah-masukan"));
    const badan = { judul: v("kfJudul"), jenis: v("kfJenis"), bentuk: v("kfBentuk"), instansi: v("kfInstansi") || null, tahap: v("kfTahap"), tenggat: v("kfTenggat") || null, sumber_url: v("kfUrl") || null, catatan: v("kfCatatan") || null };
    if (!S.terkunci && (baru || S.bagian.length)) badan.bagian = S.bagian;
    const tbl = $("kfSimpan"); tbl.disabled = true;
    try {
      const r = baru ? await api("/api/konsultasi", { metode: "POST", badan }) : await api("/api/konsultasi/" + encodeURIComponent(dok.id), { metode: "PUT", badan });
      if (S.berkas) {
        const fd = new FormData(); fd.set("berkas", S.berkas);
        const res = await fetch(`/api/konsultasi/${encodeURIComponent(r.id)}/berkas`, { method: "POST", body: fd, headers: { "x-pb": "1" }, credentials: "same-origin" });
        if (!res.ok) throw Object.assign(new Error("berkas"), { kode: res.status === 413 ? "terlalu-besar" : "salah-masukan" });
      }
      if (v("kfStatus") !== (dok?.status || "draf")) await api(`/api/konsultasi/${encodeURIComponent(r.id)}/status`, { metode: "POST", badan: { status: v("kfStatus") } });
      dlg.close(); selesai?.();
    } catch (er) { galat(galatTeks(er.kode || "umum")); tbl.disabled = false; }
  });
  dlg.showModal();
}
