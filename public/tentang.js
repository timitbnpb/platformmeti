/* Halaman /tentang (publik): hero berfoto warna asli, tentang METI dan Direktori, teknologi (panel bergambar), struktur organisasi (kartu foto penuh wajah), mitra, FAQ, kontak.
   Teks dari kamus (tn.*); data statis /data/pengurus-meti.json, mitra-meti.json, tentang-kredit.json, ringkas.json. */
import "/inti/tautan_org.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { t, tanggal, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { sumberHtml } from "/inti/komponen.js";
import { ikonTek } from "/inti/ikon_tek.js";

const muat = (n) => fetch(`/data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); });
const MI = "https://metiires.or.id";
const SURELP = "meti.ires@gmail.com";
const KONTAK = [["jm.kaki.surel", SURELP, "berita"], ["jm.kaki.situs", "www.meti.or.id", "tautan"], ["jm.kaki.kantor", "Taman Sari Parama Lt. 10, Jl. K.H. Wahid Hasyim No. 84-86, Kebon Sirih, Menteng, Jakarta Pusat 10340", "wilayah"]];
/* kode teknologi sama dengan /teknologi/<kode>; topik regulasi sama dengan CFG.reg di teknologi.js; foto dari /img/beranda */
const TEK = [["surya", ["surya"], "surya-cirata"], ["bayu", ["angin"], "bayu-sidrap"], ["hidro", ["hidro"], "hidro-saguling"], ["panas-bumi", ["panas_bumi"], "panas-bumi-sibayak"], ["bioenergi", ["bioenergi"], "bioenergi-sawit"], ["biomassa-sampah", ["bioenergi"], "biomassa-bantargebang"], ["penyimpanan", ["penyimpanan"], "penyimpanan-baterai"], ["hidrogen", ["hidrogen"], "hidrogen-spbu"], ["nuklir", ["nuklir"], "nuklir-menara"]];
/* ponytail: logo lebar (wordmark) diganti lambang kecil + label; ganti lewat data bila daftar bertambah */
const LAMBANG = { "Ditjen EBTKE ESDM": ["/img/logo/ebtke.png", "Ditjen EBTKE"], "Kementerian ESDM": ["/img/logo/esdm.png", "Kementerian ESDM"] };
const LOGO_ASOS = { AESI: "/img/logo/aesi.png", APROBI: "/img/logo/aprobi.png", API: "/img/logo/api-inaga.png", APAMSI: "/img/logo/apamsi.png" };

const inisial = (n) => String(n).replace(/[^\p{L} ]/gu, "").split(/\s+/).filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const avatar = (o, besar) => o.foto ? `<img class="tn-av${besar ? " besar" : ""}" src="${esc(o.foto)}" alt="" width="${besar ? 96 : 48}" height="${besar ? 96 : 48}" loading="lazy">` : `<span class="tn-av tn-ini${besar ? " besar" : ""}" aria-hidden="true">${esc(inisial(o.nama))}</span>`;
const PERS = new Map();
const slug = (n) => String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/* kepala bagian standar: eyebrow berikon, judul, lead */
const kepala = (id, ik, ey, h2, l) => `<header class="tn-sh"><p class="tn-ey">${ikon(ik, 16)}<span>${esc(ey)}</span></p><h2 id="${id}">${esc(h2.replace(/\*/g, ""))}</h2>${l ? `<p class="tn-lead">${esc(l.replace(/\*/g, ""))}</p>` : ""}</header>`;

/* ---------- kartu orang: foto persegi penuh; tanpa foto = inisial kecil di tengah atas, nama dan jabatan di bawahnya ---------- */
const TX = (k, f, par) => { const s = t(k, par); return s === k ? f.replace(/\{(\w+)\}/g, (m, n) => par[n]) : s; };
const orang = (o, ukuran = "") => {
  if (o.kosong || !o.nama) return `<li class="tn-fk tn-fk-kosong jm-batik ${ukuran}"><span class="tn-fk-bg" aria-hidden="true">${ikon("orang", 36)}</span><span class="tn-fk-t"><b>${esc(t("tn.lowong"))}</b><small>${esc(o.jabatan)}</small></span></li>`;
  const k = o.orang_id || slug(o.nama); PERS.set(k, o);
  const bg = o.foto ? `<img src="${esc(o.foto)}" alt="" width="360" height="360" loading="lazy">` : `<span class="tn-fk-ini" aria-hidden="true">${esc(inisial(o.nama))}</span>`;
  const kls = o.foto ? (/-b\.webp$/.test(o.foto) ? "tn-fk-pt jm-batik" : "tn-fk-ft") : "tn-fk-nf jm-batik";
  return `<li class="tn-fk ${kls} ${ukuran}"><button type="button" class="tn-fk-b" data-p="${esc(k)}" aria-label="${esc(t("tn.p.buka", { nama: o.nama }))}"><span class="tn-fk-bg">${bg}</span><span class="tn-fk-t"><b>${esc(o.nama)}</b><small>${esc(o.jabatan)}</small></span></button></li>`;
};
const ul = (a, uk) => `<ul class="tn-fkg">${a.map((o) => orang(o, uk)).join("")}</ul>`;
/* kepala unit seragam: ikon, nama, pil jumlah; rata tengah, pita aksen di bawah */
const nOrang = (a) => a.filter((o) => o.nama && !o.kosong).length;
const kepalaGrup = (ik, judul, a) => `<h4>${ikon(ik, 16)}<span>${esc(judul)}</span>${a ? `<em class="tn-n">${angka(nOrang(a))}</em>` : ""}</h4>`;
const kelompok = (judul, a, { ik = "orang", besar = "", ekstra = "" } = {}) => `<section class="tn-grp ${ekstra}" data-n="${Math.min(5, a.length || 1)}">${kepalaGrup(ik, judul, a)}${ul(a, besar)}</section>`;

/* kelompok ringkas: kartu pimpinan + deret avatar + tombol "Lihat semua" yang membuka popup berisi seluruh anggota */
const GR = new Map();
const PIM = /^(Ketua|Wakil Ketua|Sekretaris|Chief|Vice Chief|Koordinator)\b/;
function ringkas(judul, a, { ik = "orang", pimpinan = PIM } = {}) {
  /* tiga kartu foto seragam: pimpinan dulu, dilengkapi anggota berfoto bila pimpinan kurang dari tiga */
  const nyata = a.filter((o) => o.nama && !o.kosong), pim = a.filter((o) => pimpinan.test(o.jabatan || "")).slice(0, 3);
  for (const o of nyata.filter((x) => x.foto && !pim.includes(x))) { if (pim.length >= 3) break; pim.push(o); }
  const sisa = a.filter((o) => !pim.includes(o)), avat = sisa.filter((o) => o.nama && !o.kosong);
  const id = "g" + GR.size; GR.set(id, { judul, ik, a });
  const lr = pim.length ? `<ul class="tn-lr">${pim.map((o) => orang(o)).join("")}</ul>` : "";
  const tampil = avat.length > 12 ? avat.slice(0, 11) : avat, lebih = avat.length - tampil.length;
  const bawah = sisa.length ? `<ul class="tn-av-kisi">${tampil.map((o) => `<li title="${esc(o.nama)}">${avatar(o)}</li>`).join("")}${lebih ? `<li class="tn-plus" aria-label="${esc(TX("tn.anggota_plus", "+{n} anggota", { n: lebih }))}">+${angka(lebih)}</li>` : ""}</ul>
    <button type="button" class="tn-semua" data-grup="${id}">${ikon("orang", 18)}<span>${esc(TX("tn.lihat_semua", "Lihat semua {n} anggota", { n: nyata.length }))}</span></button>` : "";
  return `<section class="tn-grp tn-rg" data-n="3">${kepalaGrup(ik, judul, a)}${lr}${bawah}</section>`;
}

const kartuLogo = (href, nama, g, extra = "") => `<li><a class="tn-logo" ${extra} href="${esc(href)}" title="${esc(nama)}"><span class="tn-logo-g">${g}</span><span class="tn-logo-n">${esc(nama)}</span></a></li>`;
const mono = (n) => `<b class="tn-mono" aria-hidden="true">${esc(String(n).replace(/[^\p{L}]/gu, "").slice(0, 4).toUpperCase())}</b>`;
const tbl = (x) => {
  const l = LAMBANG[x.nama], src = l ? l[0] : x.logo;
  return kartuLogo("/direktori?cari=" + encodeURIComponent(x.nama), l ? l[1] : x.nama, src ? `<img src="${esc(src)}" alt="" loading="lazy">` : mono(x.nama), `data-org-nama="${esc(x.nama)}"`);
};
const tblAsos = (a, sudah) => kartuLogo("/direktori?cari=" + encodeURIComponent(a), a, LOGO_ASOS[a] && !sudah.has(LOGO_ASOS[a]) ? (sudah.add(LOGO_ASOS[a]), `<img src="${LOGO_ASOS[a]}" alt="" loading="lazy">`) : mono(a));
/* kisi kartu seragam; duplikat nama dibuang */
const jalur = (a, fn) => { const lihat = new Set(), sudah = new Set(); return `<ul class="tn-kisi">${a.filter((x) => { const k = typeof x === "string" ? x : x.nama; return lihat.has(k) ? false : lihat.add(k); }).map((x) => fn(x, sudah)).join("")}</ul>`; };

/* ---------- bagian ---------- */
const KOLFOTO = [["surya", "surya-cirata"], ["bayu", "bayu-sidrap"], ["hidro", "hidro-saguling"], ["panas-bumi", "panas-bumi-sibayak"], ["bioenergi", "bioenergi-sawit"]];
function hero(f) {
  const kol = KOLFOTO.map(([k, fl], i) => `<a class="tn-kol" href="/proyek?teknologi=${k}" aria-label="${esc(t("tn.foto.buka", { nama: t("tn.foto." + k) }))}"><img src="/img/beranda/${fl}.webp" alt="" width="1600" height="900" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}><span class="tn-kol-isi">${ikonTek(k)}${esc(t("tn.foto." + k))}</span></a>`).join("");
  const st = [["kalender", 1999, t("tn.stat.berdiri")], ["orang", f.pengurus, t("tn.stat.pengurus")], ["tautan", f.mitra, t("tn.stat.mitra")], ["proyek", f.proyek, t("tn.stat.proyek")]];
  return `<section class="tn-hero" aria-labelledby="tn-judul"><div class="tn-kolom">${kol}</div><div class="tn-wrap tn-hero-isi"><h1 id="tn-judul">${esc(t("tn.judul"))}</h1><p class="tn-lead tn-hero-lead">${esc(t("tn.lead"))}</p>
    <div class="tn-aksi"><a class="tn-tbl tn-tbl-putih" href="/direktori">${esc(t("tn.cta_direktori"))}</a><a class="tn-tbl tn-tbl-garis" href="${MI}/membership" target="_blank" rel="noopener noreferrer">${esc(t("tn.cta_gabung"))}</a></div>
    <dl class="tn-angka" aria-label="${esc(t("tn.hero.aria"))}">${st.map(([ik, n, l]) => `<div>${ikon(ik, 20)}<dd>${esc(n === 1999 ? "1999" : angka(Number(n)))}</dd><dt>${esc(l)}</dt></div>`).join("")}</dl></div></section>`;
}

function tentang(f) {
  const st = [["kalender", "1999", t("tn.stat.berdiri")], ["tautan", angka(f.anggota), t("tn.stat.anggota")], ["orang", angka(f.pengurus), t("tn.stat.pengurus")]];
  return `<section class="tn-seksi" id="tentang" aria-labelledby="tn-meti">${kepala("tn-meti", "info", t("tn.ey.tentang"), t("tn.mengapa.h2"), t("tn.mengapa.lead"))}
  <article class="tn-kartu tn-fitur tn-lebar"><header><span class="tn-bulat"><img src="/img/logo-meti-tanda.png" alt="" width="32" height="32"></span><h3>${esc(t("tn.meti.judul"))}</h3></header>
    <div class="tn-lebar-isi"><div class="tn-lebar-teks"><p class="tn-isi">${esc(t("tn.meti.isi"))}</p><p class="tn-isi">${esc(t("tn.meti.peran"))}</p>
    <a class="tn-tbl-hijau" href="#tim">${ikon("orang", 18)}<span>${esc(t("tn.meti.link"))}</span></a></div>
    <dl class="tn-mini">${st.map(([ik, n, l]) => `<div><span class="tn-cek-ik">${ikon(ik, 20)}</span><dd>${esc(n)}</dd><dt>${esc(l)}</dt></div>`).join("")}</dl></div></article></section>`;
}

function teknologi(D) {
  const kartu = TEK.map(([k, reg, foto]) => {
    const pj = D.proyek.filter((p) => p.teknologi === k), mw = pj.reduce((a, p) => a + (Number(p.kapasitas?.[0]?.nilai) || 0), 0);
    const n = [["proyek", angka(pj.length)], ["mw", mw ? angka(Math.round(mw)) : "-"], ["reg", angka(D.reg.filter((r) => reg.some((x) => r.topik.includes(x))).length)], ["op", angka(pj.filter((p) => p.status?.[0]?.nilai === "beroperasi").length)]];
    const nama = t("tn.tek." + k);
    return `<li><a class="tn-tp" href="/teknologi/${k}" aria-label="${esc(t("tn.foto.buka", { nama }))}"><span class="tn-tp-f"><img src="/img/beranda/${foto}.webp" alt="" width="800" height="600" loading="lazy"><span class="tn-tp-t"><i class="tn-tp-ik">${ikonTek(k)}</i><b>${esc(nama)}</b></span></span><span class="tn-tp-n">${n.map(([c, v], i) => `<span><i>${ikon(["proyek", "analisis", "regulasi", "centang"][i], 16)}</i><b>${esc(v)}</b><small>${esc(t("tn.tek.n." + c))}</small></span>`).join("")}</span></a></li>`;
  }).join("");
  const j = esc(t("tn.tek.h2", { n: TEK.length })).replace(String(TEK.length), `<span class="jm-hl">${TEK.length}</span>`);
  return `<section class="tn-seksi tn-pita-bg" id="teknologi" aria-labelledby="tn-tek"><div class="jm-ex"><header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey">${ikon("proyek", 14)}${esc(t("tn.ey.teknologi"))}</span><h2 class="jm-ex-j" id="tn-tek">${j}</h2><p class="jm-ex-sub">${esc(t("tn.tek.lead"))}</p></div></header>
  <div class="jm-ex-bd"><ul class="tn-tek">${kartu}</ul></div></div></section>`;
}

/* SDU: Chief dan Vice Chief jadi pimpinan; PMO di popup, jabatan tanpa awalan "PMO " */
const sdu = (a) => ringkas(t("tn.u.sdu"), a.map((o) => (o.pmo ? { ...o, jabatan: o.jabatan.replace(/^PMO\s+/, "") } : o)), { ik: "direktori", pimpinan: /^(Chief|Vice Chief)\b/ });

function struktur(p) {
  const U = p.unit, d = U.dewan || [], iPakar = d.findIndex((o) => /Ketua Dewan Pakar/.test(o.jabatan));
  const pengawas = iPakar < 0 ? d : d.slice(0, iPakar), pakar = iPakar < 0 ? [] : d.slice(iPakar);
  const bidang = p.bidang.filter((b) => b.nama);
  const kb = (b, i) => `<section class="tn-grp" data-n="${Math.min(5, b.anggota.length || 1)}">${kepalaGrup("daftar", t("tn.u.bk", { n: i + 1 }) + ": " + b.nama, b.anggota)}${ul(b.anggota, "kecil")}</section>`;
  const ket = (U.ketum || [])[0];
  const baris2 = [["waketum", "tn.u.waketum", true], ["sekjen", "tn.u.sekjen"], ["bendahara", "tn.u.bendahara"], ["eksekutif", "tn.u.eksekutif", true]].filter(([k]) => U[k]).map(([k, j, s]) => kelompok(t(j), U[k])).join("");
  return `<section class="tn-seksi tn-bagan-bg" id="tim" aria-labelledby="tn-struktur">${kepala("tn-struktur", "orang", t("tn.ey.struktur"), t("tn.struktur.h2"), t("tn.struktur.pengantar", { periode: p.periode }))}
  <div class="tn-pohon"><div class="tn-r tn-r0">${ringkas(t("tn.u.penasihat"), U.penasihat || [], { ik: "perisai" })}${ringkas(t("tn.u.pengawas"), pengawas, { ik: "perisai" })}${ringkas(t("tn.u.pakar"), pakar, { ik: "insight" })}</div>
    <div class="tn-konek" aria-hidden="true"></div>
    ${ket ? `<div class="tn-r tn-r1"><section class="tn-grp tn-ketum">${kepalaGrup("orang", t("tn.u.ketum"))}${ul([ket], "besar")}</section></div><div class="tn-konek" aria-hidden="true"></div>` : ""}
    <div class="tn-r tn-r2">${baris2}</div></div>
    <h3 class="tn-sub">${ikon("daftar", 18)}<span>${esc(t("tn.u.bidang"))}</span></h3><div class="tn-bidang tn-bk9">${bidang.map(kb).join("")}</div>
    <h3 class="tn-sub">${ikon("wilayah", 18)}<span>${esc(t("tn.u.unit"))}</span></h3><div class="tn-bidang">${[U.institute && ringkas(t("tn.u.institute"), U.institute), U.wilayah && ringkas(t("tn.u.wilayah"), U.wilayah, { ik: "wilayah" }), U.muda && ringkas(t("tn.u.muda"), U.muda), U.komite && ringkas(t("tn.u.komite"), U.komite), U.staf && ringkas(t("tn.u.staf"), U.staf), U.sdu && sdu(U.sdu)].filter(Boolean).join("")}</div></section>`;
}

function mitra(m) {
  const grup = (kunci, a, fn, ik) => `<h3 class="tn-sub tn-tengah">${ikon(ik, 18)}<span>${esc(t(kunci))}</span><span class="tn-jml">${angka(new Set(a.map((x) => (typeof x === "string" ? x : x.nama))).size)}</span></h3>${jalur(a, fn)}`;
  return `<section class="tn-seksi tn-pita-bg" id="mitra" aria-labelledby="tn-mitra">${kepala("tn-mitra", "tautan", t("tn.ey.mitra"), t("tn.mitra.h2"), t("tn.mitra.pengantar", { tanggal: tanggal(m.diambil) }))}
  ${grup("tn.mitra.kerja", m.mitra, tbl, "tautan")}${grup("tn.mitra.anggota", m.anggota, tbl, "gedung")}${grup("tn.mitra.asosiasi", m.asosiasi, tblAsos, "direktori")}</section>`;
}

function faq(k) {
  const ik = ["direktori", "jejak", "orang", "ubah", "tautan", "perisai"];
  const butir = [1, 2, 3, 4, 5, 6].map((n) => `<details name="faq"><summary><span class="tn-q-no">${n}</span><span class="tn-q-ik">${ikon(ik[n - 1], 18)}</span><span class="tn-q-t">${esc(t("tn.faq.q" + n))}</span></summary><div class="tn-q-a"><p>${esc(t("tn.faq.a" + n))}</p></div></details>`).join("");
  const kr = `<p>${esc(t("tn.kredit.pengantar"))}</p><ul class="tn-kr-l">${k.map((x) => `<li><a href="${esc(x.sumber)}" target="_blank" rel="noopener noreferrer">${esc(x.judul)}, ${esc(x.pencipta)}, ${esc(x.lisensi)}</a></li>`).join("")}</ul>`;
  return `<section class="tn-seksi tn-faq-bg" id="faq" aria-labelledby="tn-faq"><div class="tn-faq-pola jm-batik jm-batik-rata" aria-hidden="true"></div>
  <header class="tn-sh tn-sh-foto"><p class="tn-ey">${ikon("info", 16)}<span>${esc(t("tn.ey.faq"))}</span></p><h2 id="tn-faq">${esc(t("tn.faq.h2"))}</h2></header>
  <div class="tn-faq-kisi"><div class="tn-faq">${butir}</div>${kotakKontak()}</div>
  <div class="tn-kr">${sumberHtml(kr, t("tn.kredit.judul_n", { judul: t("tn.kredit.judul"), n: k.length }))}</div></section>`;
}

/* kotak "Masih ada pertanyaan?" + kontak sekretariat; tombol gabung */
function kotakKontak() {
  return `<aside class="tn-ada" id="kontak" aria-labelledby="tn-ada"><span class="tn-ada-ik jm-batik">${ikon("orang", 28)}</span><h3 id="tn-ada">${esc(t("tn.faq.ada"))}</h3><p class="tn-isi">${esc(t("tn.faq.ada_isi"))}</p>
  <ul class="tn-kk">${KONTAK.map(([k, v, ik]) => `<li>${ikon(ik, 20)}<span><small>${esc(t(k))}</small><b>${esc(v)}</b></span><button type="button" class="tn-salin" data-salin="${esc(v)}" title="${esc(t("tn.salin"))}" aria-label="${esc(t("tn.salin"))}">${ikon("salin", 16)}<span>${esc(t("tn.salin"))}</span></button></li>`).join("")}</ul>
  <div class="tn-aksi"><a class="tn-tbl tn-tbl-hijau" href="mailto:${SURELP}">${esc(t("tn.faq.surel"))}</a><a class="tn-tbl tn-tbl-tepi" href="${MI}/membership" target="_blank" rel="noopener noreferrer">${esc(t("tn.cta_gabung"))}</a></div></aside>`;
}

await mulaiHalaman();
const isi = document.getElementById("isi");
try {
  const [p, m, k, r, pry, rg, br] = await Promise.all([muat("pengurus-meti"), muat("mitra-meti"), muat("tentang-kredit"), muat("ringkas"), muat("proyek"), muat("regulasi"), muat("berita")]);
  const nama = new Set([...Object.values(p.unit).flat(), ...p.bidang.flatMap((b) => b.anggota)].filter((o) => o.nama).map((o) => o.nama));
  isi.innerHTML = hero({ pengurus: nama.size, mitra: m.asosiasi.length, proyek: r.hitung.proyek }) + `<div class="tn-wrap">` + tentang({ pengurus: nama.size, anggota: m.anggota.length }) + teknologi({ proyek: pry.baris, reg: rg.baris, ber: br.baris }) + struktur(p) + mitra(m) + faq(k) + `</div>`;
} catch (e) {
  isi.innerHTML = `<p class="tn-wrap tn-galat jm-galat" role="alert">${esc(t("tn.galat"))}</p>`;
}
isi.addEventListener("click", (e) => {
  const b = e.target.closest("[data-salin]");
  if (b && navigator.clipboard) navigator.clipboard.writeText(b.dataset.salin).then(() => { const sp = b.querySelector("span"); sp.textContent = b.title = t("tn.tersalin"); setTimeout(() => { sp.textContent = b.title = t("tn.salin"); }, 1500); }, () => {});
});
/* ---------- profil orang (dialog; sheet bawah di layar sempit) ---------- */
const http = (u) => /^https?:\/\//i.test(u || "");
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } };
const manusia = (k) => { const s = String(k).replace(/-/g, " "); return s.charAt(0).toUpperCase() + s.slice(1); };
const norm = (n) => String(n).toLowerCase().replace(/\b(dr|ir|prof|drs|drg|mt|msc|mba|ph\.?d|s\.?t|m\.?t|s\.?e|m\.?m)\b\.?/g, "").replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
let orangP;
const dataOrang = () => orangP ??= muat("orang").then((d) => d.baris || []).catch(() => []);
const bag = (judul, isi) => isi ? `<section class="tn-pb"><h4>${esc(judul)}</h4>${isi}</section>` : "";
function profil(p, o) {
  o = o || {};
  const jb = []; const lihat = new Set();
  for (const x of o.jabatan || []) { const k = (x.jabatan || "") + "|" + norm(x.organisasi || ""); if (!x.jabatan || lihat.has(k)) continue; lihat.add(k); jb.push(x); }
  const th = (x) => { const m = String(x.mulai || "").slice(0, 4), s = x.kini ? t("tn.p.sekarang") : String(x.selesai || "").slice(0, 4); return m || s ? `${m}${m && s ? " - " : ""}${s}` : ""; };
  const kini = o.jabatan_terkini || o.organisasi_terkini ? `<p class="tn-kini">${o.organisasi_id ? `<img class="tn-pl" src="/img/logo/org/${esc(o.organisasi_id)}.png" alt="" width="40" height="40">` : ""}<span><b>${esc(o.jabatan_terkini || "")}</b><small>${esc(o.organisasi_terkini || "")}</small></span></p>` : "";
  const pend = (o.pendidikan || []).map((x) => `<li>${esc(typeof x === "string" ? x : [x.jenjang, x.institusi, x.tahun].filter(Boolean).join(", "))}</li>`).join("");
  const tau = (o.tautan || []).filter((x) => http(x.url)).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(host(x.url))}</a>`).join("");
  const sum = [...new Set([o.sumber_url, ...jb.map((x) => x.sumber_url)].filter(http))].map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(host(u))}</a>`).join("");
  const ada = kini || o.ringkasan || (o.kepakaran || []).length || jb.length || pend || tau;
  return `<header class="tn-ph">${avatar(p, true)}<div><h3 id="tn-pj">${esc((o.gelar ? o.gelar + " " : "") + p.nama)}</h3><p class="tn-chip">${esc(t("tn.p.meti"))}: ${esc(p.jabatan)}</p></div></header>
  ${bag(t("tn.p.kini"), kini)}${o.ringkasan ? bag(t("tn.p.ringkas"), `<p>${esc(o.ringkasan)}</p>`) : ""}
  ${bag(t("tn.p.pakar"), (o.kepakaran || []).length ? `<p class="tn-pil">${o.kepakaran.map((x) => `<span>${esc(manusia(x.kode || x))}</span>`).join("")}</p>` : "")}
  ${bag(t("tn.p.jejak"), jb.length ? `<ol class="tn-jejak">${jb.map((x) => `<li><b>${esc(x.jabatan)}</b><small>${esc(x.organisasi || "")}${th(x) ? " , " + esc(th(x)) : ""}</small></li>`).join("")}</ol>` : "")}
  ${bag(t("tn.p.pendidikan"), pend ? `<ul class="tn-pend">${pend}</ul>` : "")}${bag(t("tn.p.tautan"), tau ? `<p class="tn-tau">${tau}</p>` : "")}${bag(t("tn.p.sumber"), sum ? `<p class="tn-tau">${sum}</p>` : "")}
  ${ada ? "" : `<p class="tn-kosongp">${esc(t("tn.p.kosong"))}</p>`}`;
}
/* popup daftar anggota: kotak cari + kisi kartu seragam; klik kartu membuka profil */
const dd = document.createElement("dialog");
dd.className = "tn-dlg tn-dlg-daftar"; dd.setAttribute("aria-labelledby", "tn-dd-j");
document.body.append(dd);
isi.addEventListener("click", (e) => {
  const b = e.target.closest("[data-grup]"); if (!b) return;
  const g = GR.get(b.dataset.grup), n = g.a.filter((o) => o.nama && !o.kosong).length;
  dd.innerHTML = `<button type="button" class="tn-x" data-tutup aria-label="${esc(t("tn.p.tutup"))}">${ikon("silang", 20)}</button><div class="tn-dd-kp jm-batik jm-batik-rata"><div class="tn-dd-k"><span class="tn-bulat">${ikon(g.ik, 24)}</span><div><h3 id="tn-dd-j">${esc(g.judul)}</h3><p>${ikon("orang", 14)}<span>${esc(TX("tn.n_anggota", "{n} anggota", { n }))}</span></p></div></div>
    <label class="tn-dd-cr">${ikon("cari", 18)}<input type="search" class="tn-dd-cari" placeholder="${esc(TX("tn.cari_nama", "Cari nama"))}" aria-label="${esc(TX("tn.cari_nama", "Cari nama"))}"></label></div><ul class="tn-fkg tn-dg">${g.a.map((o) => orang(o)).join("")}</ul>`;
  dd.showModal();
});
dd.addEventListener("input", (e) => { const q = norm(e.target.value || ""); dd.querySelectorAll(".tn-dg > li").forEach((li) => { li.hidden = !!q && !norm(li.textContent).includes(q); }); });
dd.addEventListener("click", (e) => { if (e.target === dd || e.target.closest("[data-tutup]")) dd.close(); const b = e.target.closest("[data-p]"); if (b) bukaProfil(b.dataset.p); });
const dlg = document.createElement("dialog");
dlg.className = "tn-dlg"; dlg.setAttribute("aria-labelledby", "tn-pj");
dlg.innerHTML = `<button type="button" class="tn-x" data-tutup aria-label="${esc(t("tn.p.tutup"))}">${ikon("silang", 20)}</button><div class="tn-pi"></div>`;
document.body.append(dlg);
const pi = dlg.querySelector(".tn-pi");
let tokenP = 0;
async function bukaProfil(k) {
  const p = PERS.get(k); if (!p) return;
  const tk = ++tokenP; pi.innerHTML = profil(p); if (!dlg.open) dlg.showModal();
  history.replaceState(null, "", "#pengurus-" + k);
  const semua = await dataOrang(); if (tk !== tokenP) return;
  const o = semua.find((x) => p.orang_id && x.id === p.orang_id) || semua.find((x) => norm(x.nama) === norm(p.nama));
  if (o) pi.innerHTML = profil(p, o);
}
isi.addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) bukaProfil(b.dataset.p); });
dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-tutup]")) dlg.close(); });
dlg.addEventListener("close", () => { tokenP++; if (location.hash.startsWith("#pengurus-")) history.replaceState(null, "", location.pathname + location.search); });
dlg.addEventListener("error", (e) => { if (e.target.classList && e.target.classList.contains("tn-pl")) e.target.hidden = true; }, true);
if (location.hash.startsWith("#pengurus-")) bukaProfil(decodeURIComponent(location.hash.slice(10)));
