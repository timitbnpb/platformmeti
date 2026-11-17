/* /sertifikat/v/<token>: verifikasi publik sertifikat kehadiran acara, tanpa login (F65-202). Server hanya mengirim nama acara, tanggal, dan nama peserta.
   Memakai tata letak verifikasi KTA (kta.css, kelas ktav-*). Tombol cetak memakai cetak bawaan peramban. */
import { t, tanggal } from "/i18n.js";
import { api, esc, ikon } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";

await mulaiHalaman();
const akar = document.getElementById("ktav");
const token = location.pathname.split("/").pop();
const akademi = location.pathname.split("/").at(-2) === "a"; // /sertifikat/a/<token> = sertifikat akademi (F65-205); /sertifikat/v/<token> = kehadiran acara
const logo = `<img class="ktav-logo" src="/img/logo-meti.png" width="50" height="72" alt="METI">`;

function gambar(d) {
  document.title = t(akademi ? "sv.a.title" : "sv.title");
  if (!d) {
    akar.innerHTML = `<section class="ktav-kartu">${logo}<span class="ktav-lencana bad">${ikon("silang", 32)}</span><h1>${esc(t("sv.tidak_ada"))}</h1><p class="ktav-catatan">${esc(t(akademi ? "sv.a.tidak_ada_isi" : "sv.tidak_ada_isi"))}</p></section>`;
    return;
  }
  akar.innerHTML = `<section class="ktav-kartu" aria-labelledby="vJudul">${logo}<span class="ktav-lencana ok">${ikon("centang", 32)}</span>
    <h1 id="vJudul">${esc(t(akademi ? "sv.a.sah" : "sv.sah"))}</h1><p class="ktav-catatan">${esc(t(akademi ? "sv.a.menyatakan" : "sv.menyatakan"))}</p><p class="ktav-nama">${esc(d.nama)}</p>
    <dl class="ktav-dl"><div><dt>${esc(t(akademi ? "sv.a.program" : "sv.acara"))}</dt><dd>${esc(akademi ? t("sv.a.modul", { n: d.modul }) : d.acara)}</dd></div>
    <div><dt>${esc(t("sv.tanggal"))}</dt><dd>${esc(tanggal(d.tanggal, { gaya: "panjang" }))}</dd></div></dl>
    <p class="ktav-catatan">${esc(t(akademi ? "sv.a.catatan" : "sv.catatan"))}</p>
    <button type="button" class="jm-tbl" id="svCetak">${ikon("unduh", 18)}<span>${esc(t("sv.cetak"))}</span></button></section>`;
  document.getElementById("svCetak").addEventListener("click", () => window.print());
}
let data = null;
try { data = await api((akademi ? "/api/akademi/sertifikat/" : "/api/event/sertifikat/") + encodeURIComponent(token)); } catch (e) { data = null; }
gambar(data);
document.addEventListener("jm:bahasa", () => gambar(data));
