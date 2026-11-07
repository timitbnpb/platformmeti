/* Bagian beranda di bawah lipatan: sensus per teknologi, halaman lain, cara data dibuat, akses data.
   Dirender saat mendekati layar (IntersectionObserver); angka dari public/data/*.json. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, galatHtml } from "/inti/umum.js";
import { muat, label } from "/publik.js";

const P = (d) => `<svg class="jm-ikon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const IKON = {
  surya: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
  bayu: P('<path d="M12 12V22M12 12l-1-9 3 8zM12 12l8 4-8 1zM12 12l-8 4 7 1.5"/>'),
  hidro: P('<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 14c3-3 6 3 9 0s6 3 9 0M3 19c3-3 6 3 9 0s6 3 9 0"/>'),
  "panas-bumi": P('<path d="M3 21 10 8l4 7 3-4 4 10zM9 3c-1 1 1 2 0 3M14 3c-1 1 1 2 0 3"/>'),
  bioenergi: P('<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15zM5 19 14 10"/>'),
  "biomassa-sampah": P('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/>'),
  nuklir: P('<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/>'),
  penyimpanan: P('<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M7 10v4M11 10v4"/>'),
  koperasi: P('<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6M15 14c4-1 7 1 7 5"/>'),
  ormawa: P('<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5"/>'),
  "perguruan-tinggi": P('<path d="M3 10l9-6 9 6zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>'),
  "think-tank": P('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>'),
};
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "penyimpanan"];
const ORG = [["koperasi", "koperasi"], ["ormawa", "ormawa"], ["perguruan-tinggi", "perguruan-tinggi"], ["think-tank", "think-tank"]];

async function sensus(el) {
  const [pro, org] = await Promise.all([muat("proyek"), muat("organisasi")]);
  const tek = TEK.map((k) => [k, pro.baris.filter((p) => p.teknologi === k).length, "/proyek", label("beranda.tek.", k), "beranda.tek.n"]);
  const jenis = ORG.map(([k, kode]) => [k, org.baris.filter((o) => o.kategori?.kode === kode).length, "/direktori?tampil=lembaga", t("beranda.sensus.k." + k), "beranda.sensus.org"]);
  el.innerHTML = [...tek, ...jenis].filter((x) => x[1] > 0).map(([k, n, href, nama, unit]) => `<a class="jm-tile" href="${href}">${IKON[k]}<strong>${esc(nama)}</strong><span class="jm-ds-n">${esc(angka(n))}</span><small>${esc(t(unit))}</small></a>`).join("");
  document.getElementById("sensusSumber").textContent = t("beranda.sensus.sumber", { tanggal: tanggal(pro.dibangun_pada) });
}

const BENTO = [["rantai", "/rantai", false], ["pembiaya", "", true], ["batal", "", true], ["pakar", "/direktori?tampil=pakar", false], ["rapor", "", true], ["cakupan", "/tentang", false]];
const CARA = ["sumber", "est", "tanggal", "bukti"];

function statis() {
  document.getElementById("bento").innerHTML = BENTO.map(([k, href, segera]) => {
    const isi = `<strong>${esc(t("beranda.bento." + k))}</strong><span>${esc(t("beranda.bento." + k + ".d"))}</span>${segera ? `<span class="jm-pil jm-pil-est">${esc(t("beranda.segera"))}</span>` : ""}`;
    return href ? `<a class="jm-bento" href="${href}">${isi}</a>` : `<div class="jm-bento jm-bento-mati">${isi}</div>`;
  }).join("");
  document.getElementById("cara").innerHTML = CARA.map((k, i) => `<div class="jm-cara"><span class="jm-ds-kep">0${i + 1}</span><h3>${esc(t("beranda.cara." + k))}</h3><p>${esc(t("beranda.cara." + k + ".d"))}</p></div>`).join("");
}

/** Pasang pengamat: tiap bagian berat dirender sekali saat 300px dari layar. */
export function pasangBawah() {
  const sensusEl = document.getElementById("sensus");
  const ulang = () => { statis(); if (sensusEl.dataset.siap) sensus(sensusEl).catch(() => { sensusEl.innerHTML = galatHtml("layanan"); }); };
  statis();
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { io.disconnect(); sensusEl.dataset.siap = "1"; sensus(sensusEl).catch(() => { sensusEl.innerHTML = galatHtml("layanan"); }); }
  }, { rootMargin: "300px" });
  io.observe(sensusEl);
  document.addEventListener("jm:bahasa", () => requestAnimationFrame(ulang));
}
