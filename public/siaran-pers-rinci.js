// /siaran-pers/<id>: detail satu siaran pers, liputan media (ringkasan + tautan sumber), atau liputan kegiatan.
import { mulaiHalaman } from "/inti/kepala.js";
import { t, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { bagikanHtml, sumberHtml, terkaitHtml } from "/inti/komponen.js";
import { urlAman, muat } from "/publik.js";
import { khSisi } from "/inti/kh.js";
import { logoLokal } from "/inti/nama_media.js";
import { muatSiaran, sampulHtml, jenisHtml, judulKartu, urlRinci, topikLabel, pasangGalatFoto, urlFoto } from "/siaran_umum.js";

const id = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");

const blokIsi = (x) => (x.k ? `<blockquote class="sp-kutip">${esc(x.k)}</blockquote>` : x.h ? `<h2 class="sp-sub">${esc(x.h)}</h2>` : `<p>${esc(x.p)}</p>`);
const galeriHtml = (r) => (r.galeri || []).length
  ? `<section class="sp-galeri" aria-label="${esc(t("sp.galeri"))}"><h2 class="sp-sub">${ikon("gambar", 18)}${esc(t("sp.galeri"))}</h2><ul>${r.galeri.map((g, i) => `<li><a href="${esc(g)}" target="_blank" rel="noopener noreferrer"><img src="${esc(g)}" alt="${esc(t("sp.galeri_alt", { n: i + 1 }))}" loading="lazy" decoding="async"></a></li>`).join("")}</ul></section>`
  : "";
function isiArtikel(r) {
  if (r.jenis !== "liputan_media") {
    const buka = r.kota ? `<strong>${esc(r.kota)}, ${esc(tanggal(r.tanggal, { gaya: "panjang" }))}</strong> - ` : "";
    const isi = (r.isi || []).map(blokIsi);
    if (isi.length && buka && isi[0].startsWith("<p>")) isi[0] = "<p>" + buka + isi[0].slice(3);
    return `<div class="sp-isi-teks">${isi.join("") || `<p>${esc(r.ringkasan)}</p>`}</div>${galeriHtml(r)}`;
  }
  return `<div class="sp-isi-teks"><p>${esc(r.ringkasan)}</p>${r.kutipan ? `<blockquote class="sp-kutip">${esc(r.kutipan)}</blockquote>` : ""}<p class="sp-catatan">${esc(t("sp.catatan", { media: r.media }))}</p></div>`;
}
const chips = (r, orgNama) => [
  ...(r.topik || []).map((k) => `<a class="sp-chip" href="/siaran-pers?jenis=${r.jenis}&amp;topik=${encodeURIComponent(k)}">${esc(topikLabel(k))}</a>`),
  ...(r.org_ids || []).filter((o) => orgNama.has(o)).map((o) => `<a class="sp-chip" href="/o/${encodeURIComponent(o)}">${esc(orgNama.get(o))}</a>`),
].join("");

function barisKecil(r, foto) {
  return `<li class="sp-mini" data-sp-id="${esc(r.id)}"><a href="${esc(urlRinci(r))}">${sampulHtml(r, foto, "sp-mini-foto")}<span><b>${esc(judulKartu(r))}</b><time datetime="${esc(r.tanggal)}">${esc(tanggal(r.tanggal))}</time></span></a></li>`;
}
function gambar(r, D, orgNama) {
  const j = judulKartu(r), href = urlRinci(r);
  document.title = `${j} | ${t("jm.merek")}`;
  document.getElementById("judul").textContent = j;
  document.getElementById("meta").innerHTML = `${jenisHtml(r)}<time datetime="${esc(r.tanggal)}">${esc(tanggal(r.tanggal, { gaya: "panjang" }))}</time>${r.kota ? `<span>${esc(r.kota)}</span>` : ""}`;
  const penulis = r.penulis ? `<p class="sp-penulis">${ikon("orang", 16)}<span>${esc(t("sp.penulis"))}: <b>${esc(r.penulis)}</b></span></p>` : "";
  const u = urlAman(r.url_sumber);
  document.getElementById("artikel").innerHTML = `${isiArtikel(r)}
<div class="sp-bawah">${penulis}<div class="sp-bagi">${sumberHtml(`${esc(t("sp.sumber_rinci"))} ${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(r.media)}</a>` : esc(r.media)}, ${esc(tanggal(D.dibangun))}.`)}</div></div>
${chips(r, orgNama) ? `<div class="sp-chips" aria-label="${esc(t("sp.topik"))}">${chips(r, orgNama)}</div>` : ""}`;
  const media = r.jenis === "liputan_media";
  khSisi(".sp-rkh", {
    gambar: { src: urlFoto(r, D.foto), alt: j, logo: media ? logoLokal(r.url_sumber || r.media) : "/img/logo-meti-tanda.png", judul: media ? r.media : t("jm.merek") },
    aksi: `<span class="sp-bagi"><span>${esc(t("sp.bagikan"))}</span>${bagikanHtml({ url: href, judul: j })}</span>${u ? `<a class="jm-tbl sp-baca" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t("sp.baca", { media: r.media }))}${ikon("tautan", 16)}</a>` : ""}`,
  });
  const lain = D.baris.filter((x) => x.id !== r.id);
  const terbaru = lain.slice(0, 5);
  const terkait = lain.filter((x) => x.jenis === r.jenis || (x.topik || []).some((k) => (r.topik || []).includes(k))).filter((x) => !terbaru.includes(x)).slice(0, 4);
  const info = [["sp.jenis_l", t("sp.jenis." + r.jenis)], ["sp.tanggal", tanggal(r.tanggal, { gaya: "panjang" })], ["sp.kota", r.kota], ["sp.media", r.jenis === "liputan_media" ? r.media : ""], ["sp.penulis", r.penulis]].filter((x) => x[1]);
  document.getElementById("samping").innerHTML = `
<section class="jm-ex sp-panel"><header class="jm-ex-hd"><div class="jm-ex-teks"><h2 class="jm-ex-j">${ikon("berita", 18)}${esc(t("sp.terbaru"))}</h2></div></header><div class="jm-ex-bd"><ul class="sp-minis">${terbaru.map((x) => barisKecil(x, D.foto)).join("")}</ul></div></section>
${terkait.length ? `<section class="jm-ex sp-panel"><header class="jm-ex-hd"><div class="jm-ex-teks"><h2 class="jm-ex-j">${ikon("tautan", 18)}${esc(t("sp.terkait"))}</h2></div></header><div class="jm-ex-bd"><ul class="sp-minis">${terkait.map((x) => barisKecil(x, D.foto)).join("")}</ul></div></section>` : ""}
<section class="jm-ex sp-panel"><header class="jm-ex-hd"><div class="jm-ex-teks"><h2 class="jm-ex-j">${ikon("info", 18)}${esc(t("sp.info"))}</h2></div></header><div class="jm-ex-bd"><dl class="sp-info">${info.map(([k, v]) => `<dt>${esc(t(k))}</dt><dd>${esc(v)}</dd>`).join("")}</dl>${u ? `<a class="sp-asli" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}${esc(t("sp.tautan_sumber"))}</a>` : ""}<a class="sp-asli" href="/siaran-pers?jenis=${r.jenis}">${ikon("panah-kiri", 16)}${esc(t("sp.kembali"))}</a></div></section>`;
  terkaitHtml("siaran", r.id).then((h) => { document.getElementById("terkait")?.remove(); if (h) document.getElementById("artikel")?.insertAdjacentHTML("beforeend", h); });
}

(async () => {
  await mulaiHalaman();
  let D;
  try { D = await muatSiaran(); } catch { D = null; }
  const r = D && D.baris.find((x) => x.id === id);
  if (!r) {
    document.getElementById("judul").textContent = t("sp.tidak_ada");
    khSisi(".sp-rkh", { fakta: [{ ikon: "siaran", label: t("sp.eyebrow"), nilai: t("sp.kembali"), href: "/siaran-pers" }] });
    document.getElementById("artikel").innerHTML = `<p><a class="jm-tbl" href="/siaran-pers">${esc(t("sp.kembali"))}</a></p>`;
    return;
  }
  window.__spMedia = new Map(D.baris.map((x) => [x.id, x]));
  pasangGalatFoto();
  const orgNama = new Map();
  gambar(r, D, orgNama);
  if ((r.org_ids || []).length) muat("organisasi").then((o) => { for (const x of o.baris) if (r.org_ids.includes(x.id)) orgNama.set(x.id, x.singkatan || x.nama); gambar(r, D, orgNama); }).catch(() => {});
})();
