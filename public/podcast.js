/* /podcast: kartu besar berwarna bergantian. Podcast METI diisi admin lewat data/podcast.json; podcast ekosistem hanya tautan keluar (tanpa salin sampul). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { muat, urlAman } from "/publik.js";

const kartu = (p, i, ep) => {
  const u = urlAman(ep ? ep.url : p.tautan);
  const kep = ep ? ep.judul : p.nama;
  return `<li class="pod-kartu pod-w${i % 3}"><span class="pod-sampul" aria-hidden="true">${ikon("mikrofon", 64)}</span><div class="pod-isi"><small>${esc(ep ? [p.nama, ep.tanggal && tanggal(ep.tanggal)].filter(Boolean).join(" - ") : p.penyelenggara)}</small><h3>${esc(kep)}</h3>${!ep && p.tema ? `<p>${esc(p.tema)}</p>` : ""}${ep && ep.durasi ? `<p>${esc(ep.durasi)}</p>` : ""}
    ${u ? `<a class="jm-tbl pod-putar" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${ikon("putar", 20)}<span>${esc(t(ep ? "pod.putar" : "pod.buka"))}</span></a>` : ""}</div></li>`;
};
function gambar(D) {
  const meti = (D.meti || []).map((e, i) => kartu({ nama: e.program || t("pod.meti") }, i, e)).join("");
  const eko = (D.ekosistem || []).map((p, i) => kartu(p, i + (D.meti || []).length)).join("");
  khUbin("khUbin", [{ ikon: "mikrofon", nilai: angka((D.meti || []).length), label: t("pod.n.meti") }, { ikon: "tautan", nilai: angka((D.ekosistem || []).length), label: t("pod.n.eko") }]);
  document.getElementById("isi").innerHTML =
    exHtml({ id: "pod-meti", ikon: "mikrofon", topik: t("pod.meti.ey"), judulHtml: esc(t("pod.meti.j")), subHtml: esc(t("pod.meti.sub")), isiHtml: meti ? `<ul class="pod-daftar">${meti}</ul>` : kosongHtml("pod.meti.kosong") })
    + exHtml({ id: "pod-eko", ikon: "tautan", topik: t("pod.eko.ey"), judulHtml: esc(t("pod.eko.j")), subHtml: esc(t("pod.eko.sub")), isiHtml: eko ? `<ul class="pod-daftar">${eko}</ul><p class="jm-bantu">${esc(t("pod.eko.catatan"))}</p>` : kosongHtml("pod.eko.kosong") });
}
async function main() {
  await mulaiHalaman();
  const isi = document.getElementById("isi");
  isi.innerHTML = hantuHtml(4);
  let D;
  try { D = await muat("podcast"); } catch { isi.innerHTML = galatHtml("layanan"); return; }
  gambar(D);
  document.addEventListener("jm:bahasa", () => gambar(D));
}
main();
