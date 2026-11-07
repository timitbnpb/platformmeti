/* /video/<id>: pemutar youtube-nocookie besar, kanal, ringkasan, tag topik, acara/berita/organisasi terkait, bagikan, video terkait + sebelumnya/berikutnya. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { muat, label, urlAman } from "/publik.js";
import { muatAcara, embedHtml, durasiTeks, tagHtml, bagikanHtml, pasangSalin, urlEvent } from "/event_umum.js";
import { muatVideo, kartuVideo, logoKanal, SERI_SLUG } from "/video_umum.js";

const id = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
const STOP = new Set(["indonesia", "energi", "terbarukan", "listrik", "dengan", "untuk", "video", "bincang", "session", "breakout", "highlight", "official"]);
const kata = (s) => new Set(s.toLowerCase().normalize("NFD").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length >= 5 && !STOP.has(w)));

async function organisasi(v) {
  try {
    const d = await muat("organisasi"), judul = v.judul.toLowerCase();
    const sama = d.baris.filter((o) => (v.oid || []).includes(o.id) || (o.nama.length >= 8 && judul.includes(o.nama.toLowerCase())) || (o.singkatan && o.singkatan.length >= 3 && new RegExp(`\\b${o.singkatan.replace(/[^A-Za-z0-9]/g, "")}\\b`).test(v.judul)));
    return [...new Map(sama.map((o) => [o.id, o])).values()].slice(0, 6);
  } catch { return []; }
}
async function beritaTerkait(v) {
  try {
    const k = kata(v.judul);
    return (await muat("berita")).baris.map((n) => ({ n, skor: [...kata(n.judul)].filter((w) => k.has(w)).length })).filter((x) => x.skor >= 2).sort((a, c) => c.skor - a.skor || c.n.terbit.localeCompare(a.n.terbit)).slice(0, 5).map((x) => x.n);
  } catch { return []; }
}

async function gambar(D, v) {
  const isi = document.getElementById("isi"), seg = D.semua.filter((x) => x.segmen === v.segmen), i = seg.findIndex((x) => x.id === v.id);
  const baru = seg[i - 1], lama = seg[i + 1];
  const [acara, org, berita] = await Promise.all([muatAcara().catch(() => []), organisasi(v), beritaTerkait(v)]);
  const ev = acara.find((b) => (b.video_ids || []).includes(v.id)) || acara.find((b) => b.slug === SERI_SLUG[v.seri]);
  const terkait = D.semua.filter((x) => x.id !== v.id && (x.seri === v.seri || x.topik.some((k) => v.topik.includes(k)))).sort((a, c) => (c.seri === v.seri) - (a.seri === v.seri) || c.tanggal.localeCompare(a.tanggal)).slice(0, 6);
  const url = `${location.origin}/video/${v.id}`;
  const logo = logoKanal(v);
  const kanalHtml = `<p class="vid-kanal">${logo ? `<img src="${esc(logo)}" alt="" width="36" height="34">` : `<span class="ev-mitra-in" aria-hidden="true">${esc(v.kanalNama.replace(/[^A-Za-z]/g, "").slice(0, 2))}</span>`}<span><b>${esc(v.kanalNama)}</b><small>${esc(tanggal(v.tanggal, { gaya: "panjang" }))}${v.durasi ? " - " + esc(durasiTeks(v.durasi)) : ""}${v.tonton ? " - " + esc(t("vid.tonton", { n: angka(v.tonton) })) : ""}</small></span></p>`;
  const tags = `${v.topik.map((k) => tagHtml(k)).join("")}<span class="ev-tag">${ikon("daftar2", 14)}${esc(t("vid.seri." + v.seri))}</span>`;
  const sisi = [
    ev ? `<div class="ev-blok"><h3>${esc(t("vid.acara"))}</h3><a class="jm-tbl jm-tbl-kecil" href="${esc(urlEvent(ev))}">${ikon("kalender-bintang", 16)}<span>${esc(ev.judulTampil)}</span></a></div>` : "",
    org.length ? `<div class="ev-blok"><h3>${esc(t("vid.organisasi"))}</h3><div class="ev-tags">${org.map((o) => `<a class="ev-tag" href="/o/${esc(o.id)}">${ikon("direktori", 14)}${esc(o.nama)}</a>`).join("")}</div></div>` : "",
    berita.length ? `<div class="ev-blok"><h3>${esc(t("vid.berita"))}</h3><ul class="ev-berita">${berita.map((n) => `<li><a href="${esc(n.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(n.judul)}</span><small>${esc(n.media)} - ${esc(tanggal(n.terbit.slice(0, 10)))}</small></a></li>`).join("")}</ul></div>` : "",
  ].join("");
  document.getElementById("judul").textContent = v.judul;
  document.title = `${v.judul} | Video METI`;
  document.getElementById("lead").textContent = `${v.kanalNama} - ${tanggal(v.tanggal)}`;
  isi.innerHTML = `<div class="ev-detail-kisi"><div class="ev-utama"><div class="vid-layar">${embedHtml(v.id, v.judul, false)}</div>
    ${exHtml({ id: "vid-tentang", ikon: "info", topik: t("vid.tentang.ey"), judulHtml: esc(t("vid.tentang.j")), isiHtml: `${kanalHtml}${v.ringkas ? `<p class="ev-isi">${esc(v.ringkas)}</p>` : `<p class="jm-bantu">${esc(t("vid.tanpa_ringkas"))}</p>`}<div class="ev-tags">${tags}</div><div class="vid-nav">${lama ? `<a class="jm-tbl jm-tbl-kecil" href="/video/${esc(lama.id)}" rel="prev">${ikon("panah-kiri", 16)}<span>${esc(t("vid.sebelumnya"))}</span></a>` : "<span></span>"}${baru ? `<a class="jm-tbl jm-tbl-kecil" href="/video/${esc(baru.id)}" rel="next"><span>${esc(t("vid.berikutnya"))}</span>${ikon("panah-kanan", 16)}</a>` : ""}</div>` })}
    ${terkait.length ? exHtml({ id: "vid-terkait", ikon: "video", topik: t("vid.terkait.ey"), judulHtml: esc(t("vid.terkait.j")), isiHtml: `<ul class="vid-kisi">${terkait.map(kartuVideo).join("")}</ul>` }) : ""}</div>
    <aside class="ev-sisi" aria-label="${esc(t("ev.panel"))}"><div class="ev-blok"><h3>${esc(t("ev.bagikan"))}</h3>${bagikanHtml(url, v.judul)}</div>
    <div class="ev-blok"><a class="jm-tbl jm-tbl-kecil" href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener noreferrer">${ikon("youtube", 16)}<span>${esc(t("vid.di_youtube"))}</span></a></div>${sisi}</aside></div>`;
}
async function main() {
  await mulaiHalaman();
  pasangSalin();
  const isi = document.getElementById("isi");
  isi.innerHTML = hantuHtml(6);
  let D;
  try { D = await muatVideo(); } catch { isi.innerHTML = galatHtml("layanan"); return; }
  const v = D.semua.find((x) => x.id === id);
  if (!v) { document.getElementById("judul").textContent = t("vid.tidak_ada"); isi.innerHTML = kosongHtml("vid.tidak_ada_isi"); return; }
  await gambar(D, v);
  document.addEventListener("jm:bahasa", () => gambar(D, v));
}
main();
