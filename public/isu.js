/* /isu: modul isu energi (nasional, daerah, linimasa) + rincian satu isu di hash (#id). Data /data/isu.json (scripts/pipa/isu_bangun.mjs).
   INP: saringan menyalakan chrome seketika; grafik dan daftar menyusul lewat nanti(). Peta dan rincian dimuat malas. */
import { t } from "/i18n.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, nanti, ikon, hantuHtml, galatHtml, debounce } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, sumberHtml, cariHtml, pilihHtml, hapusHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { tabHalaman } from "/inti/tab_halaman.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { batangHtml, pasangBar } from "/analisis.js";
import { TEMA, STATUS, N, muatIsu, tgl, lengkap, pilTema, kartuIsu, saring, hitung } from "/isu_umum.js";

const $ = (id) => document.getElementById(id);
const S = { q: "", tema: "", status: "", hal: 1 };
const HAL = 20;
let D;
const sudah = new Set();
const info = () => sumberHtml(esc(t("isu.metode")));

await mulaiHalaman();
const akar = $("isi");
$("isuNasional").innerHTML = hantuHtml(5);
try { D = await muatIsu(); } catch (e) {
  $("isuNasional").innerHTML = galatHtml("jaringan");
  $("isuNasional").querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}

function kepalaAngka() {
  const b = D.baris, sumber = new Set(b.flatMap((i) => i.sumber.map((s) => s.url)));
  khUbin("isuAngka", [
    { ikon: "peringatan", nilai: N(b.length), label: t("isu.kh.total") },
    { ikon: "petir", nilai: N(b.filter((i) => i.status === "aktif").length), label: t("isu.kh.aktif") },
    { ikon: "wilayah", nilai: N(Object.keys(D.meta.per_provinsi).length), label: t("isu.kh.prov") },
    { ikon: "buku", nilai: N(sumber.size), label: t("isu.kh.sumber") },
  ]);
}

/* ---------- saringan bersama: satu state S, satu bar per tab (id berawalan) ---------- */
function saringHtml(p) {
  const tm = hitung(D.baris, "tema"), st = hitung(D.baris, "status");
  return `<div class="jm-saring pt2-saring" role="group" aria-label="${esc(t("isu.saring"))}" data-pre="${p}">
    ${cariHtml({ id: p + "Q", label: t("isu.cari"), placeholder: t("isu.cari.ph") })}
    ${pilihHtml({ id: p + "Tema", ikon: "jenis", label: t("isu.f.tema"), opsi: [["", t("isu.semua.tema")], ...Object.keys(TEMA).filter((k) => tm[k]).map((k) => [k, t("isu.tema." + k), TEMA[k], tm[k]])], nilai: S.tema })}
    ${pilihHtml({ id: p + "St", ikon: "status", label: t("isu.f.status"), opsi: [["", t("isu.semua.status")], ...STATUS.filter((k) => st[k]).map((k) => [k, t("isu.st." + k), k === "aktif" ? "petir" : k === "mereda" ? "jam" : "centang", st[k]])], nilai: S.status })}
    ${hapusHtml({ id: p + "Hapus", label: t("isu.f.hapus") })}</div>`;
}
function pasangSaring(p) {
  const q = $(p + "Q");
  q.value = S.q;
  const urg = () => { for (const q2 of document.querySelectorAll(".isu-akar input[type=search]")) if (q2 !== q) q2.value = S.q; };
  q.addEventListener("input", debounce(() => { S.q = q.value; S.hal = 1; urg(); segarkan(); }));
  for (const [id, k] of [[p + "Tema", "tema"], [p + "St", "status"]]) $(id).addEventListener("change", (e) => { S[k] = e.target.value; S.hal = 1; segarkan(); });
  $(p + "Hapus").addEventListener("click", () => { S.q = ""; S.tema = ""; S.status = ""; S.hal = 1; q.value = ""; for (const s of document.querySelectorAll(".isu-akar select")) s.value = ""; urg(); segarkan(); });
  import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {});
}
function sinkronSaring() { // chrome urgent: nilai kontrol semua tab mengikuti S
  for (const p of ["n", "d", "l"]) {
    const h = $(p + "Hapus"); if (!h) continue;
    h.hidden = !(S.q || S.tema || S.status);
    for (const [id, v] of [[p + "Tema", S.tema], [p + "St", S.status]]) { const el = $(id); if (el && el.value !== v) el.value = v; }
  }
}
function segarkan() {
  sinkronSaring();
  nanti(() => { if (sudah.has("n")) gambarNasional(); if (sudah.has("d")) import("/isu_daerah.js").then((m) => m.perbarui?.(D, S)); if (sudah.has("l")) gambarLini(); });
}

/* ---------- tab Nasional ---------- */
function gambarNasional() {
  const baris = saring(D.baris.filter((i) => i.tingkat === "nasional"), S);
  if (!sudah.has("n")) {
    sudah.add("n");
    $("isuNasional").classList.add("isu-akar");
    $("isuNasional").innerHTML = [
      exHtml({ id: "isu-n-saring", ikon: "cari2", topik: t("isu.saring"), judulHtml: " ", subHtml: " ", isiHtml: saringHtml("n") }),
      exHtml({ id: "isu-n-tema", ikon: "grafik", topik: t("isu.ex.tema"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + info(), isiHtml: `<div id="isuTema"></div>` }),
      exHtml({ id: "isu-n-kartu", ikon: "peringatan", topik: t("isu.ex.kartu"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml({ csv: true }) + info(), isiHtml: `<ul class="isu-kartu-daftar" id="isuKartu"></ul>` }),
    ].join("");
    pasangSaring("n");
    $("isu-n-kartu").addEventListener("jm:csv", (e) => {
      e.detail.baris = [[t("isu.f.tema"), t("isu.f.status"), "Judul", "Mulai", "Terbaru", "Ringkasan"], ...saring(D.baris.filter((i) => i.tingkat === "nasional"), S).map((i) => [t("isu.tema." + i.tema), t("isu.st." + i.status), i.judul, i.mulai || "", i.terbaru || "", i.ringkas])];
    });
  }
  const j = (id, a, b) => { const ex = $(id); ex.querySelector(".jm-ex-j").innerHTML = a; ex.querySelector(".jm-ex-sub").innerHTML = b; };
  j("isu-n-kartu", hlHtml("isu.ex.kartu.j", N(baris.length)), esc(t("isu.ex.kartu.s")));
  const tm = hitung(baris, "tema"), arr = Object.entries(tm).sort((a, b) => b[1] - a[1]);
  j("isu-n-tema", hlHtml("isu.ex.tema.j", N(baris.length)), esc(t("isu.ex.tema.s")));
  $("isuTema").innerHTML = arr.length ? batangHtml(arr.map(([k, n]) => ({ id: k, label: t("isu.tema." + k), labelHtml: `<span class="isu-bar-l isu-t-${esc(k)}">${ikon(TEMA[k], 16)}<span>${esc(t("isu.tema." + k))}</span></span>`, bagian: [{ nilai: n, kelas: "isu-bg-" + k }], teks: N(n) })), { label: t("isu.ex.tema"), satuan: "" }) : `<p class="jm-kosong-teks">${esc(t("isu.kosong"))}</p>`;
  pasangBar($("isuTema"));
  $("isuKartu").innerHTML = baris.length ? baris.map(kartuIsu).join("") : `<li class="jm-kosong">${ikon("info", 32)}<p>${esc(t("isu.kosong"))}</p></li>`;
}

/* ---------- tab Linimasa ---------- */
function gambarLini() {
  if (!sudah.has("l")) {
    sudah.add("l");
    $("isuLini").classList.add("isu-akar");
    $("isuLini").innerHTML = [
      exHtml({ id: "isu-l-saring", ikon: "cari2", topik: t("isu.saring"), judulHtml: " ", subHtml: " ", isiHtml: saringHtml("l") }),
      exHtml({ id: "isu-l-lini", ikon: "linimasa", topik: t("isu.ex.lini"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml({ csv: true }) + info(), isiHtml: `<div id="isuLiniIsi"></div>` }),
    ].join("");
    pasangSaring("l");
    $("isuLiniIsi").addEventListener("click", (e) => { const b = e.target.closest("[data-hal]"); if (!b) return; S.hal = +b.dataset.hal; gambarLini(); $("isu-l-lini").scrollIntoView({ block: "start" }); });
    $("isu-l-lini").addEventListener("jm:csv", (e) => { e.detail.baris = [["Tanggal", t("isu.f.tema"), "Isu", "Peristiwa"], ...peristiwa().map((p) => [p.tanggal, t("isu.tema." + p.isu.tema), p.isu.judul, p.peristiwa])]; });
  }
  const ev = peristiwa(), dari = (S.hal - 1) * HAL;
  const ex = $("isu-l-lini");
  ex.querySelector(".jm-ex-j").innerHTML = hlHtml("isu.ex.lini.j", N(ev.length));
  ex.querySelector(".jm-ex-sub").innerHTML = esc(t("isu.ex.lini.s"));
  $("isuLiniIsi").innerHTML = ev.length ? `<ol class="isu-lini">${ev.slice(dari, dari + HAL).map((p) => {
    const s = p.sumber != null ? p.isu.sumber[p.sumber] : null;
    return `<li class="isu-lini-li isu-t-${esc(p.isu.tema)}"><time class="isu-lini-t" datetime="${esc(p.tanggal)}">${esc(tgl(p.tanggal))}</time><span class="isu-lini-titik" aria-hidden="true"></span>
      <div class="isu-lini-k"><span class="isu-pil-baris">${pilTema(p.isu.tema)}</span><a class="isu-lini-j" href="#${esc(p.isu.id)}">${esc(p.isu.judul)}</a><p>${esc(p.peristiwa)}</p>${s ? `<a class="isu-lini-s" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 14)}<span>${esc(s.penerbit)}</span></a>` : ""}</div></li>`;
  }).join("")}</ol>${paginasiHtml({ hal: S.hal, total: ev.length, per: HAL, satuan: "jm.pag.u.data" })}` : `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t("isu.kosong"))}</p></div>`;
}
const peristiwa = () => saring(D.baris, S).flatMap((i) => i.linimasa.map((e) => ({ ...e, isu: i }))).sort((a, b) => lengkap(b.tanggal).localeCompare(lengkap(a.tanggal)));

/* ---------- tab Daerah: modul sendiri (peta MapLibre dimuat malas) ---------- */
async function gambarDaerah() {
  const m = await import("/isu_daerah.js");
  if (!sudah.has("d")) {
    sudah.add("d");
    $("isuDaerah").classList.add("isu-akar");
    $("isuDaerah").innerHTML = exHtml({ id: "isu-d-saring", ikon: "cari2", topik: t("isu.saring"), judulHtml: " ", subHtml: " ", isiHtml: saringHtml("d") });
    pasangSaring("d");
    $("isuDaerah").insertAdjacentHTML("beforeend", `<div id="isuDaerahIsi"></div>`);
    await m.mulai($("isuDaerahIsi"), D, S, { info });
  } else m.perbarui(D, S);
}

/* ---------- rincian satu isu ---------- */
const TAB = new Set(["", "nasional", "daerah", "linimasa"]);
const dariHash = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch { return ""; } };
async function rute() {
  const h = dariHash(), det = $("isuDetail");
  const mode = !TAB.has(h);
  det.hidden = !mode; $("isuTab").hidden = mode;
  document.querySelector(".jm-kh").hidden = false;
  if (!mode) { document.title = t("isu.title"); return; }
  for (const p of ["isuNasional", "isuDaerah", "isuLini"]) $(p).hidden = true;
  det.innerHTML = hantuHtml(5);
  try { await (await import("/isu_detail.js")).tampilDetail(det, D, h); } catch { det.innerHTML = galatHtml("layanan"); }
  scrollTo({ top: 0 });
}

const tab = tabHalaman("isuTab", { label: "isu.tab.label", tab: [
  { k: "nasional", ikon: "globe", teks: "isu.tab.nasional", panel: "isuNasional", muat: async () => { gambarNasional(); sinkronSaring(); } },
  { k: "daerah", ikon: "peta", teks: "isu.tab.daerah", panel: "isuDaerah", muat: async () => { await gambarDaerah(); sinkronSaring(); } },
  { k: "linimasa", ikon: "linimasa", teks: "isu.tab.linimasa", panel: "isuLini", muat: async () => { gambarLini(); sinkronSaring(); } },
] });
kepalaAngka();
addEventListener("hashchange", rute);
document.addEventListener("jm:bahasa", () => { sudah.clear(); kepalaAngka(); $("isuNasional").innerHTML = ""; $("isuDaerah").innerHTML = ""; $("isuLini").innerHTML = ""; tab.buka(dariHash() || "nasional"); rute(); });
await rute();
