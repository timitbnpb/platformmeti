/* /galeri#sosmed: kartu profil per platform (tautan dari inti/sosmed.js), unggahan pilihan admin (data/sosmed_pilihan.json, kartu fasad:
   iframe baru dimuat saat diklik), video YouTube METI dari data/video_kanal.json. Tanpa scraping; tanpa pihak ketiga sebelum klik. */
import { t, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { SOSMED, svgSosmed } from "/inti/sosmed.js";
import { muat, urlAman } from "/publik.js";
import { muatVideo, kartuVideo } from "/video_umum.js";

const EMBED = [[/^https:\/\/www\.instagram\.com\/(p|reel)\/[\w-]+\/?/, (u) => u.split("?")[0].replace(/\/?$/, "/") + "embed"], [/^https:\/\/www\.linkedin\.com\/embed\/feed\/update\/[\w:%-]+/, (u) => u]];
const embedUrl = (p) => { const u = p.embed || p.url, e = EMBED.find(([r]) => r.test(u)); return e ? e[1](u) : ""; };
const SOSMED_NAMA = Object.fromEntries(SOSMED.map((s) => [s.kunci, s.nama]));

const profilHtml = () => `<ul class="sos-profil">${SOSMED.map((s) => `<li class="sos-kartu sos-${s.kunci}"><span class="sos-ik">${svgSosmed(s.kunci, 28)}</span><b>${esc(s.nama)}</b><p>${esc(t("sos.d." + s.kunci))}</p><a class="jm-tbl jm-tbl-kecil" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("sos.ikuti"))}</span></a></li>`).join("")}</ul>`;
const pilihHtml = (baris) => baris.length ? `<ul class="sos-pilihan">${baris.map((p, i) => {
  const gb = p.gambar && /^\/img\/sosmed\/[\w.-]+$/.test(p.gambar);
  return `<li><button type="button" class="sos-fasad sos-${esc(p.platform)}" data-pos="${i}" aria-label="${esc(t("sos.buka", { judul: p.judul }))}">${gb ? `<img src="${esc(p.gambar)}" alt="" loading="lazy" decoding="async">` : ""}<span class="sos-ik">${svgSosmed(p.platform, 36)}</span><span class="sos-ket"><b>${esc(p.judul)}</b><small>${esc(SOSMED_NAMA[p.platform] || "")} - ${esc(tanggal(p.tanggal))}</small></span></button></li>`;
}).join("")}</ul>` : kosongHtml("sos.kosong");

export async function mulai() {
  const isi = document.getElementById("isiSosmed");
  isi.innerHTML = hantuHtml(3);
  let pil, vid;
  try { [pil, vid] = await Promise.all([muat("sosmed_pilihan").then((d) => d.baris.filter((p) => urlAman(p.url) && SOSMED_NAMA[p.platform])), muatVideo().then((d) => d.semua.filter((v) => v.segmen === "meti").slice(0, 3))]); } catch { isi.innerHTML = galatHtml("layanan"); return; }
  isi.innerHTML =
    exHtml({ id: "sos-profil", ikon: "tautan", topik: t("sos.profil.ey"), judulHtml: esc(t("sos.profil.j")), subHtml: esc(t("sos.profil.sub")), isiHtml: profilHtml() }) +
    exHtml({ id: "sos-pilihan", ikon: "bintang", topik: t("sos.pilihan.ey"), judulHtml: esc(t("sos.pilihan.j")), subHtml: esc(t("sos.pilihan.sub")), isiHtml: pilihHtml(pil) }) +
    exHtml({ id: "sos-yt", ikon: "youtube", topik: "YouTube", judulHtml: esc(t("sos.yt.j")), subHtml: esc(t("sos.yt.sub")), isiHtml: `<ul class="vid-kisi">${vid.map(kartuVideo).join("")}</ul>` });
  isi.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pos]");
    if (!b) return;
    const p = pil[Number(b.dataset.pos)], em = embedUrl(p);
    if (!em) { window.open(p.url, "_blank", "noopener,noreferrer"); return; }
    const f = document.createElement("iframe");
    f.src = em; f.className = "sos-embed"; f.title = p.judul; f.loading = "lazy"; f.referrerPolicy = "no-referrer"; f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups");
    b.replaceWith(f);
  });
}
mulai();
