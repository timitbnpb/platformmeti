/* /teknologi: hub. Satu kartu foto per teknologi menuju modul ujung ke ujung-nya (rumah tunggal; /teknologi/<kode>, /topik?id=<x> dan
   /pelacak?tek=<x> dialihkan 301 oleh src/alih_tek.js). Empat angka per kartu (proyek, MW tercatat, regulasi, beroperasi) dari proyek.json dan regulasi.json; gas dan PLTU dari data modulnya.
   INP: tanpa kontrol; kartu adalah tautan biasa. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { saatBahasa } from "/analisis.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { muat } from "/publik.js";
import { MODUL_TEK } from "/inti/rumah_tek.js";

const $ = (id) => document.getElementById(id);
/* kode = kunci tk.nama.*; foto di /img/beranda (berlisensi, kredit di beranda.foto.*); reg = topik regulasi.json; ik = ikon bila tanpa foto */
const KARTU = [
  { kode: "surya", foto: "surya-cirata", reg: ["surya"] }, { kode: "bayu", foto: "bayu-sidrap", reg: ["angin"] }, { kode: "hidro", foto: "hidro-saguling", reg: ["hidro"] },
  { kode: "panas-bumi", foto: "panas-bumi-sibayak", reg: ["panas_bumi"] }, { kode: "bioenergi", foto: "bioenergi-sawit", reg: ["bioenergi"] },
  { kode: "biomassa-sampah", foto: "biomassa-bantargebang", reg: ["bioenergi"] }, { kode: "penyimpanan", foto: "penyimpanan-baterai", reg: ["penyimpanan"] }, { kode: "hidrogen", foto: "hidrogen-spbu", reg: ["hidrogen"] },
  { kode: "nuklir", foto: "nuklir-siwabessy", reg: ["nuklir"] }, { kode: "gas", ik: "gas" }, { kode: "pltu", foto: "transisi-berkeadilan", ik: "industri" },
];
const LINTAS = [["/pelacak", "nav.pelacak", "tingkat"], ["/proyek#terpadu", "pt2.nav", "petir"], ["/kinerja", "kn2.nav", "medali"], ["/keandalan", "kd2.nav", "jam"], ["/rantai-global?tab=tkdn", "nav.rantai", "rantai"], ["/rantai-global", "rg3.nav", "kapal"], ["/investasi#harga-komponen", "hk2.nav", "tag"], ["/kuadran", "nav.kuadran", "status"]];
let PRY, RG, PLTU, GAS;

const jml = (a, f) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0);
/* Empat angka per kartu, hanya dari data yang ada; sel tanpa data dihilangkan (tidak dikarang). Gas dan PLTU tak punya baris di proyek.json:
   memakai daftar modulnya sendiri (gas.json pembangkit.proyek, pltu.json), dengan label sendiri. */
function angkaKartu(k) {
  if (k.kode === "pltu") {
    const b = (PLTU?.baris || []).filter((x) => x.st === "operasi");
    return PLTU ? [["proyek", angka(PLTU.baris.length), "tk.kt.pltu"], ["analisis", angka(Math.round(jml(b, (x) => x.mw_operasi))), "tk.kt.mw_op"]] : [];
  }
  if (k.kode === "gas") {
    const b = GAS?.pembangkit?.proyek || [];
    return b.length ? [["proyek", angka(b.length), "tk.kt.proyek"], ["analisis", angka(Math.round(jml(b, (x) => x.mw))), "tk.kt.mw"], ["centang", angka(b.filter((x) => x.status === "beroperasi").length), "tk.kt.op"]] : [];
  }
  const pj = (PRY?.baris || []).filter((p) => p.teknologi === k.kode), mw = jml(pj, (p) => p.kapasitas?.[0]?.nilai);
  const reg = RG ? [["regulasi", angka(RG.baris.filter((r) => k.reg.some((x) => r.topik.includes(x))).length), "tk.kt.reg"]] : [];
  if (!PRY) return reg;
  /* tanpa proyek tercatat (mis. hidrogen): jangan tampilkan MW "-"; satu catatan menggantikannya */
  if (!pj.length) return [...reg, ["proyek", null, "tk.kt.kosong"]];
  return [["proyek", angka(pj.length), "tk.kt.proyek"], ["analisis", mw ? angka(Math.round(mw)) : null, "tk.kt.mw"], ...reg, ["centang", angka(pj.filter((p) => p.status?.[0]?.nilai === "beroperasi").length), "tk.kt.op"]];
}
const sel = ([ik, v, kunci]) => v == null && ik === "proyek" ? `<span class="jm-tk-kt-nol">${ikon("info", 16)}<small>${esc(t(kunci))}</small></span>`
  : `<span><i>${ikon(ik, 16)}</i><b>${v == null ? esc(t("tk.kt.belum")) : esc(v)}</b><small>${esc(t(kunci))}</small></span>`;
function kartu(k) {
  const nama = t("tk.nama." + k.kode);
  const gambar = k.foto ? `<img src="/img/beranda/${esc(k.foto)}.webp" width="400" height="300" alt="" loading="lazy" decoding="async">` : `<span class="jm-tk-kt-ik">${ikonTek(k.ik)}</span>`;
  return `<a class="jm-tk-kt" href="${esc(MODUL_TEK[k.kode])}" aria-label="${esc(t("tk.kt.buka", { nama }))}"><span class="jm-tk-kt-f">${gambar}<span class="jm-tk-kt-n"><i class="jm-tk-kt-ic">${ikonTek(k.ik || k.kode)}</i><b>${esc(nama)}</b></span></span><span class="jm-tk-kt-g">${angkaKartu(k).map(sel).join("")}</span></a>`;
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
[PRY, RG, PLTU, GAS] = await Promise.all(["proyek", "regulasi", "pltu", "gas"].map((n) => muat(n).catch(() => null)));
gambar();
saatBahasa(gambar);
