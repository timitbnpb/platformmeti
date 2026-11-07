/* /kta/v/<token>: verifikasi publik tanpa login. Hanya nama, jenis, status, dan masa berlaku (server tidak mengirim yang lain). */
import { t, tanggal } from "/i18n.js";
import { api, esc, ikon } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { LEBAR, TINGGI, bikinQr, gambarDepan, muatGambar, pastikanFont } from "/kta_kartu.js";

await mulaiHalaman();
const akar = document.getElementById("ktav");
const token = location.pathname.split("/").pop();
const NADA = { aktif: ["ok", "centang", "kta.v.sah"], kedaluwarsa: ["warn", "peringatan", "kta.v.kedaluwarsa"], dicabut: ["bad", "peringatan", "kta.v.dicabut"] };
const logo = `<img class="ktav-logo" src="/img/logo-meti.png" width="50" height="72" alt="METI">`;

function gambar(d) {
  if (!d) {
    akar.innerHTML = `<section class="ktav-kartu">${logo}<span class="ktav-lencana bad">${ikon("silang", 32)}</span><h1>${esc(t("kta.v.tidak_ada"))}</h1><p class="ktav-catatan">${esc(t("kta.v.tidak_ada_isi"))}</p></section>`;
    return;
  }
  const [nada, ik, judul] = NADA[d.status] || NADA.dicabut;
  akar.innerHTML = `<section class="ktav-kartu" aria-labelledby="vJudul">${logo}<span class="ktav-lencana ${nada}">${ikon(ik, 32)}</span>
    <h1 id="vJudul">${esc(t(judul))}</h1><div class="kta-kilau ktav-kartu-kta"><canvas id="cVerif" width="${LEBAR}" height="${TINGGI}" role="img" aria-label="${esc(d.nama)}"></canvas></div><p class="ktav-nama">${esc(d.nama)}</p>
    <dl class="ktav-dl"><div><dt>${esc(t("kta.kartu.jenis"))}</dt><dd>${esc(t("kta.jenis." + d.jenis.replace(/ /g, "-")))}</dd></div>
    <div><dt>${esc(t("kta.kartu.berlaku"))}</dt><dd>${esc(tanggal(d.berlaku_sampai, { gaya: "panjang" }))}</dd></div></dl>
    <p class="ktav-catatan">${esc(t("kta.v.catatan"))}</p>
    <a href="https://metiires.or.id" target="_blank" rel="noopener noreferrer">${esc(t("kta.v.situs"))}</a></section>`;
  kartu(d);
}
/* kartu yang sama dengan /kta, versi baca saja: tanpa nomor dan instansi (server tidak mengirimnya) */
async function kartu(d) {
  await pastikanFont();
  const [logo, qr] = await Promise.all([muatGambar("/img/logo-meti-tanda.png"), bikinQr(location.href).catch(() => null)]);
  const c = document.getElementById("cVerif");
  if (c) gambarDepan(c.getContext("2d"), { nama: d.nama, nomor: "", jenis: d.jenis, instansi: "", berlaku: d.berlaku_sampai, status: d.status, qr, foto: null, logo });
}
let data = null;
try { data = await api("/api/kta/verifikasi/" + encodeURIComponent(token)); } catch (e) { data = null; }
gambar(data);
document.addEventListener("jm:bahasa", () => gambar(data));
