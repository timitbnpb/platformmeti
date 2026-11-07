/* /video: banner kanal resmi, video unggulan tersemat (youtube-nocookie), segmen Video METI / IndoEBTKE ConEx / Video ekosistem, playlist per seri, filter. */
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { pilihHtml, exHtml } from "/inti/komponen.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { pemutarHtml, pasangPemutar, TOPIK, durasiTeks } from "/event_umum.js";
import { muatVideo, SEGMEN, kartuVideo, SERI } from "/video_umum.js";

const S = { seg: "meti", seri: "", tahun: "", topik: "", tampil: 24 };
let D = null;
const IK_SEG = { meti: "video", conex: "kalender-bintang", eko: "tautan" };
const YT = { meti: "https://www.youtube.com/@metiires", conex: "https://www.youtube.com/@IndoEBTKEConEx" };

const dalamSeg = () => D.semua.filter((v) => v.segmen === S.seg);
function ubin() {
  khUbin("khUbin", [{ ikon: "video", nilai: angka(D.semua.filter((v) => v.segmen === "meti").length), label: t("vid.n.meti") }, { ikon: "kalender-bintang", nilai: angka(D.semua.filter((v) => v.segmen === "conex").length), label: t("vid.n.conex") }, { ikon: "tautan", nilai: angka(D.semua.filter((v) => v.segmen === "eko").length), label: t("vid.n.eko") }]);
}
function tabHtml() {
  return `<div class="jm-tab" role="tablist" aria-label="${esc(t("vid.segmen"))}">${SEGMEN.map((k) => `<button type="button" role="tab" id="seg-${k}" data-seg="${k}" aria-selected="${S.seg === k}" tabindex="${S.seg === k ? 0 : -1}">${ikon(IK_SEG[k], 18)}<span>${esc(t("vid.seg." + k))}</span></button>`).join("")}</div>`;
}
function bannerHtml() {
  const k = D.kanal[S.seg];
  if (!k) return `<div class="vid-banner vid-banner-eko"><span class="vid-banner-ik">${ikon("tautan", 28)}</span><div><h3>${esc(t("vid.seg.eko"))}</h3><p>${esc(t("vid.banner.eko"))}</p></div></div>`;
  return `<div class="vid-banner vid-banner-${S.seg}"><img class="vid-banner-logo" src="/img/logo-meti-tanda.png" alt="" width="56" height="53"><div><h3>${esc(k.nama)}</h3><p>${esc(k.handle)} - ${esc(t("vid.banner.n", { n: angka(dalamSeg().length) }))}</p></div>
    <div class="vid-banner-aksi"><a class="jm-tbl" href="${esc(YT[S.seg])}" target="_blank" rel="noopener noreferrer">${ikon("youtube", 18)}<span>${esc(t("vid.kanal"))}</span></a><a class="jm-tbl jm-tbl-utama vid-langgan" href="${esc(YT[S.seg])}?sub_confirmation=1" target="_blank" rel="noopener noreferrer">${ikon("youtube", 18)}<span>${esc(t("vid.langgan"))}</span></a></div></div>`;
}
function unggulan() {
  const d = dalamSeg();
  if (S.seg === "meti") return d.find((v) => v.id === D.unggulan) || d[0];
  if (S.seg === "conex") return d.find((v) => /highlight day 1/i.test(v.judul)) || d[0];
  return [...d].sort((a, c) => (c.tonton || 0) - (a.tonton || 0))[0];
}
function unggulanHtml() {
  const v = unggulan();
  if (!v) return "";
  return exHtml({ id: "vid-sorot", ikon: "bintang", topik: t("vid.sorot.ey"), judulHtml: esc(t("vid.sorot.j")), isiHtml: `<div class="vid-sorot">${pemutarHtml(v)}<div class="vid-sorot-teks"><h3>${esc(v.judul)}</h3><p class="jm-bantu">${esc(v.kanalNama)} - ${esc(tanggal(v.tanggal, { gaya: "panjang" }))}${v.durasi ? " - " + esc(durasiTeks(v.durasi)) : ""}</p>${v.ringkas ? `<p>${esc(v.ringkas)}</p>` : ""}<a class="jm-tbl jm-tbl-kecil" href="/video/${esc(v.id)}">${ikon("panah-kanan", 16)}<span>${esc(t("vid.halaman"))}</span></a></div></div>` });
}
function saring() {
  return dalamSeg().filter((v) => (!S.seri || v.seri === S.seri) && (!S.tahun || v.tanggal.startsWith(S.tahun)) && (!S.topik || v.topik.includes(S.topik)));
}
function kisiIsi() {
  const rows = saring();
  if (!rows.length) return kosongHtml("vid.kosong");
  const tampil = rows.slice(0, S.tampil);
  let isi;
  if (S.seri) isi = `<ul class="vid-kisi">${tampil.map(kartuVideo).join("")}</ul>`;
  else {
    const g = new Map();
    for (const v of tampil) (g.get(v.seri) || g.set(v.seri, []).get(v.seri)).push(v);
    isi = [...g].map(([s, r]) => `<section class="vid-playlist"><h3>${ikon("daftar2", 18)}<span>${esc(t("vid.seri." + s))}</span><em>${esc(angka(rows.filter((v) => v.seri === s).length))}</em></h3><ul class="vid-kisi">${r.map(kartuVideo).join("")}</ul></section>`).join("");
  }
  return isi + (rows.length > tampil.length ? `<div class="ev-lagi"><button type="button" class="jm-tbl" data-lagi>${esc(t("ev.lagi", { n: angka(rows.length - tampil.length) }))}</button></div>` : "");
}
function kisiHtml() {
  const d = dalamSeg(), seri = [...new Set(d.map((v) => v.seri))], tahun = [...new Set(d.map((v) => v.tanggal.slice(0, 4)))].sort().reverse(), topik = TOPIK.map(([k, , ik]) => [k, t("ev.topik." + k), ik]).filter(([k]) => d.some((v) => v.topik.includes(k)));
  const saringHtml = `<div class="jm-saring ev-saring">${pilihHtml({ id: "vSeri", ikon: "daftar2", label: t("vid.f.seri"), opsi: [["", t("vid.f.semua_seri")], ...seri.map((s) => [s, t("vid.seri." + s)])], nilai: S.seri })}${pilihHtml({ id: "vTahun", ikon: "tahun", label: t("ev.f.tahun"), opsi: [["", t("ev.f.semua_tahun")], ...tahun.map((y) => [y, y])], nilai: S.tahun })}${pilihHtml({ id: "vTopik", ikon: "topik", label: t("vid.f.topik"), opsi: [["", t("vid.f.semua_topik")], ...topik], nilai: S.topik })}</div>`;
  return exHtml({ id: "vid-kisi", ikon: "daftar2", topik: t("vid.kisi.ey"), judulHtml: hlHtml("vid.kisi.j", angka(d.length)), subHtml: esc(t("vid.kisi.sub")), aksiHtml: saringHtml, isiHtml: `<div id="vidIsi">${kisiIsi()}</div>` });
}
function gambar() {
  document.getElementById("isiVideo").innerHTML = tabHtml() + bannerHtml() + unggulanHtml() + kisiHtml();
  ubin();
}
async function main() {
  const isi = document.getElementById("isiVideo"), p = new URLSearchParams(location.search);
  if (SEGMEN.includes(p.get("seg"))) S.seg = p.get("seg");
  pasangPemutar();
  const mulai = async () => {
    isi.innerHTML = hantuHtml(5);
    try { D = await muatVideo(); } catch { isi.innerHTML = galatHtml("layanan"); return; }
    gambar();
  };
  await mulai();
  isi.addEventListener("click", (e) => {
    const q = (s) => e.target.closest(s);
    let b;
    if (q("[data-aksi=ulang]")) mulai();
    else if ((b = q("[data-seg]"))) {
      S.seg = b.dataset.seg; S.seri = ""; S.tahun = ""; S.topik = ""; S.tampil = 24;
      for (const x of isi.querySelectorAll("[data-seg]")) { x.setAttribute("aria-selected", String(x === b)); x.tabIndex = x === b ? 0 : -1; } // chrome urgent
      history.replaceState(null, "", (S.seg === "meti" ? location.pathname : `${location.pathname}?seg=${S.seg}`) + "#video");
      nanti(() => { gambar(); });
    } else if (q("[data-lagi]")) { S.tampil += 24; nanti(() => { document.getElementById("vidIsi").innerHTML = kisiIsi(); }); }
  });
  isi.addEventListener("change", (e) => {
    const k = { vSeri: "seri", vTahun: "tahun", vTopik: "topik" }[e.target.id];
    if (!k) return;
    S[k] = e.target.value; S.tampil = 24; nanti(() => { document.getElementById("vidIsi").innerHTML = kisiIsi(); });
  });
  document.addEventListener("jm:bahasa", () => D && nanti(gambar));
}
main();
