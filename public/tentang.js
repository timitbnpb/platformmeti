/* Halaman /tentang (publik): hero bergambar, struktur organisasi METI interaktif, mitra, metode, kontak, kredit foto.
   Teks dari kamus (tn.*); data statis /data/pengurus-meti.json, mitra-meti.json, tentang-kredit.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, tanggal } from "/i18n.js";
import { esc } from "/inti/umum.js";

const muat = (n) => fetch(`/data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); });
const FOTO = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi"], FILE = { surya: "solar", bayu: "bayu", hidro: "hidro", "panas-bumi": "panas-bumi", bioenergi: "bioenergi" };
const MI = "https://metiires.or.id";

const inisial = (n) => String(n).replace(/[^\p{L} ]/gu, "").split(/\s+/).filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const ci = (n) => { let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 5; };
const avatar = (o, besar) => o.foto ? `<img class="tn-av${besar ? " besar" : ""}" src="${esc(o.foto)}" alt="" width="${besar ? 96 : 48}" height="${besar ? 96 : 48}" loading="lazy">` : `<span class="tn-av tn-ini tn-ci${ci(o.nama)}${besar ? " besar" : ""}" aria-hidden="true">${esc(inisial(o.nama))}</span>`;
const orang = (o, besar) => `<li class="tn-org${besar ? " besar" : ""}">${avatar(o, besar)}<span><b>${esc(o.nama)}</b><small>${esc(o.jabatan)}</small></span></li>`;
const unit = (judul, a, terbuka) => `<details class="tn-unit"${terbuka ? " open" : ""}><summary><span>${esc(judul)}</span><em>${esc(t("tn.orang", { n: a.length }))}</em></summary><ul class="tn-daftar">${a.map((o) => orang(o)).join("")}</ul></details>`;
const kartu = (judul, a) => `<section class="tn-kartu"><h4>${esc(judul)}</h4><ul class="tn-daftar">${a.map((o) => orang(o)).join("")}</ul></section>`;

function hero() {
  const gambar = FOTO.map((k, i) => `<figure class="tn-f tn-f${i}"><img src="/img/tentang/${FILE[k]}.webp" alt="${esc(t("tn.foto." + k))}" width="1600" height="900" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}><figcaption>${esc(t("tn.foto." + k))}</figcaption></figure>`).join("");
  return `<section class="tn-band" aria-labelledby="tn-judul"><div class="tn-isi"><h1 id="tn-judul">${esc(t("tn.judul"))}</h1><p>${esc(t("tn.lead"))}</p>
    <div class="tn-aksi"><a class="jm-tbl jm-tbl-utama" href="/direktori">${esc(t("tn.cta_direktori"))}</a><a class="jm-tbl tn-sekunder" href="${MI}/membership" target="_blank" rel="noopener noreferrer">${esc(t("tn.cta_gabung"))}</a></div></div></section>
    <div class="tn-isi tn-mosaik">${gambar}</div>
    <div class="tn-isi tn-dua"><article class="jm-kartu"><h2>${esc(t("tn.meti.judul"))}</h2><p>${esc(t("tn.meti.isi"))}</p></article><article class="jm-kartu"><h2>${esc(t("tn.dir.judul"))}</h2><p>${esc(t("tn.dir.isi"))}</p></article></div>`;
}

function struktur(p) {
  const U = p.unit, konek = '<div class="tn-konek" aria-hidden="true"></div>';
  const lowong = `<section class="tn-kartu tn-lowong"><h4>${esc(t("tn.u.penasihat"))}</h4><ul class="tn-daftar"><li class="tn-org"><span class="tn-av tn-ini tn-kosong" aria-hidden="true">?</span><span><b>${esc(t("tn.lowong"))}</b><small>${esc(t("tn.u.penasihat_ketua"))}</small></span></li></ul></section>`;
  const tetap = (k, jd) => U[k] ? kartu(jd, U[k]) : "";
  const bidang = p.bidang.filter((b) => b.nama).map((b) => unit(b.nama, b.anggota)).join("");
  return `<section class="tn-isi tn-bagan" aria-labelledby="tn-struktur"><h2 id="tn-struktur">${esc(t("tn.struktur.judul"))}</h2>
    <p class="tn-pengantar">${esc(t("tn.struktur.pengantar", { periode: p.periode }))}</p>
    <div class="tn-baris tn-r0">${lowong}<div class="tn-kartu">${unit(t("tn.u.dewan"), U.dewan || [])}</div></div>${konek}
    <div class="tn-baris tn-r1">${(U.ketum || []).map((o) => `<section class="tn-kartu tn-ketum"><h4>${esc(t("tn.u.ketum"))}</h4><ul class="tn-daftar">${orang(o, true)}</ul></section>`).join("")}</div>${konek}
    <div class="tn-baris tn-r2">${tetap("waketum", t("tn.u.waketum"))}${tetap("sekjen", t("tn.u.sekjen"))}${tetap("bendahara", t("tn.u.bendahara"))}${tetap("eksekutif", t("tn.u.eksekutif"))}</div>${konek}
    <div class="tn-baris tn-r3"><section class="tn-kartu tn-lebar"><h4>${esc(t("tn.u.bidang"))}</h4><div class="tn-bidang">${bidang}${U.institute ? unit(t("tn.u.institute"), U.institute) : ""}${U.komite ? unit(t("tn.u.komite"), U.komite) : ""}${U.staf ? unit(t("tn.u.staf"), U.staf) : ""}</div></section>
      <section class="tn-kartu tn-ringan"><h4>${esc(t("tn.u.wilayah"))}</h4><p>${esc(t("tn.u.wilayah_isi"))}</p></section><section class="tn-kartu tn-ringan"><h4>${esc(t("tn.u.muda"))}</h4><p>${esc(t("tn.u.muda_isi"))}</p></section></div>
    <p class="tn-kecil">${esc(t("tn.struktur.sumber", { tanggal: tanggal(p.diambil) }))} <a href="${esc(p.sumber)}" target="_blank" rel="noopener noreferrer">metiires.or.id</a></p></section>`;
}

function mitra(m) {
  const logo = (x) => `<li class="tn-logo${x.gelap ? " gelap" : ""}" title="${esc(x.nama)}"><img src="${esc(x.logo)}" alt="${esc(x.nama)}" width="${x.w}" height="${x.h}"></li>`;
  return `<section class="tn-isi tn-mitra" aria-labelledby="tn-mitra"><h2 id="tn-mitra">${esc(t("tn.mitra.judul"))}</h2><p class="tn-pengantar">${esc(t("tn.mitra.pengantar", { tanggal: tanggal(m.diambil) }))}</p>
    <h3>${esc(t("tn.mitra.kerja"))}</h3><ul class="tn-logos">${m.mitra.map(logo).join("")}</ul>
    <h3>${esc(t("tn.mitra.anggota"))}</h3><ul class="tn-logos">${m.anggota.map(logo).join("")}</ul>
    <h3>${esc(t("tn.mitra.asosiasi"))}</h3><ul class="tn-asos">${m.asosiasi.map((a) => `<li class="tn-asosiasi" title="${esc(t("tn.mitra.asosiasi_cat"))}"><b>${esc(a)}</b></li>`).join("")}</ul>
    <p class="tn-kecil"><a href="${esc(m.sumber)}" target="_blank" rel="noopener noreferrer">${esc(t("tn.mitra.lengkap"))}</a></p></section>`;
}

function bawah(k) {
  return `<section class="tn-isi tn-dua"><article class="jm-kartu"><h2>${esc(t("tn.metode.judul"))}</h2><p>${esc(t("tn.metode.isi"))}</p></article>
    <article class="jm-kartu"><h2>${esc(t("tn.kontak.judul"))}</h2><p>${esc(t("tn.kontak.isi"))}</p><p><a href="mailto:meti.ires@gmail.com">meti.ires@gmail.com</a>, <a href="https://www.meti.or.id" target="_blank" rel="noopener noreferrer">www.meti.or.id</a></p></article></section>
    <section class="tn-isi tn-kredit" aria-labelledby="tn-kredit"><h2 id="tn-kredit">${esc(t("tn.kredit.judul"))}</h2><p class="tn-pengantar">${esc(t("tn.kredit.pengantar"))}</p><ul>${k.map((x) => `<li><a href="${esc(x.sumber)}" target="_blank" rel="noopener noreferrer">${esc(t("tn.kredit.baris", { judul: x.judul, pencipta: x.pencipta, lisensi: x.lisensi }))}</a></li>`).join("")}</ul></section>`;
}

await mulaiHalaman();
const isi = document.getElementById("isi");
try {
  const [p, m, k] = await Promise.all([muat("pengurus-meti"), muat("mitra-meti"), muat("tentang-kredit")]);
  isi.innerHTML = hero() + struktur(p) + mitra(m) + bawah(k);
} catch (e) {
  isi.innerHTML = hero() + `<p class="tn-isi jm-galat" role="alert">${esc(t("tn.galat"))}</p>`;
}
