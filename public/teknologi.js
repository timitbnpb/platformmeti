/* /teknologi: hub. Satu kartu foto per teknologi menuju modul ujung ke ujung-nya (rumah tunggal; /teknologi/<kode>, /topik?id=<x> dan
   /pelacak?tek=<x> dialihkan 301 oleh src/alih_tek.js). Angka ringkas = jumlah terpasang dari peluang.json (turunan, pil EST).
   INP: tanpa kontrol; kartu adalah tautan biasa. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { num, pil, saatBahasa } from "/analisis.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { muat } from "/publik.js";
import { MODUL_TEK } from "/inti/rumah_tek.js";

const $ = (id) => document.getElementById(id);
/* kode = kunci tk.nama.*; foto di /img/beranda (berlisensi, kredit di beranda.foto.*); pel = kunci peluang.json; ik = ikon bila tanpa foto */
const KARTU = [
  { kode: "surya", foto: "surya-cirata", pel: "surya" }, { kode: "bayu", foto: "bayu-sidrap", pel: "bayu" }, { kode: "hidro", foto: "hidro-saguling", pel: "hidro" },
  { kode: "panas-bumi", foto: "panas-bumi-sibayak", pel: "panas_bumi" }, { kode: "bioenergi", foto: "bioenergi-sawit", pel: "bioenergi" },
  { kode: "biomassa-sampah", foto: "biomassa-bantargebang" }, { kode: "penyimpanan", foto: "penyimpanan-baterai" }, { kode: "hidrogen", foto: "hidrogen-spbu" },
  { kode: "nuklir", foto: "nuklir-siwabessy" }, { kode: "gas", ik: "gas" }, { kode: "pltu", foto: "transisi-berkeadilan", ik: "industri" },
];
const LINTAS = [["/pelacak", "nav.pelacak", "tingkat"], ["/proyek#terpadu", "pt2.nav", "petir"], ["/kinerja", "kn2.nav", "medali"], ["/keandalan", "kd2.nav", "jam"], ["/rantai-global?tab=tkdn", "nav.rantai", "rantai"], ["/rantai-global", "rg3.nav", "kapal"], ["/investasi#harga-komponen", "hk2.nav", "tag"], ["/kuadran", "nav.kuadran", "status"]];
let PEL;

const terpasang = (kunci) => (PEL ? PEL.baris.reduce((s, b) => s + (b.terpasang[kunci]?.mw || 0), 0) : 0);
function kartu(k) {
  const mw = k.pel ? terpasang(k.pel) : 0;
  const angka = mw ? `<span class="jm-tk-kt-a"><b>${esc(num(mw))}</b> MW ${esc(t("tk.u.terpasang").toLowerCase())} ${pil("an.est")}</span>` : "";
  const gambar = k.foto ? `<img src="/img/beranda/${esc(k.foto)}.webp" width="400" height="300" alt="" loading="lazy" decoding="async">` : `<span class="jm-tk-kt-ik">${ikonTek(k.ik)}</span>`;
  return `<a class="jm-tk-kt" href="${esc(MODUL_TEK[k.kode])}">${gambar}<span class="jm-tk-kt-n">${k.foto ? ikonTek(k.ik || k.kode) : ""}<span>${esc(t("tk.nama." + k.kode))}</span></span>${angka}</a>`;
}
function gambar() {
  document.title = t("tk.idx.judul") + " | " + t("jm.merek");
  $("judul").textContent = t("tk.idx.judul");
  $("jawab").textContent = t("tk.idx.lead");
  const lintas = LINTAS.map(([h, k, i]) => `<a class="jm-tk-pilih-a" href="${h}">${ikon(i, 28)}<span>${esc(t(k))}</span></a>`).join("");
  $("tkIsi").innerHTML = `<div class="jm-tk-idx">${KARTU.map(kartu).join("")}</div>` + exHtml({ id: "tk-lintas", ikon: "analisis", topik: t("tk.idx.ey"), judulHtml: esc(t("tk.lintas")), subHtml: esc(t("tk.lintas.sub")), isiHtml: `<div class="jm-tk-pilih">${lintas}</div>` });
}

await mulaiHalaman();
$("ubin").hidden = true;
$("tkFoto").hidden = true;
PEL = await muat("peluang").catch(() => null);
gambar();
saatBahasa(gambar);
