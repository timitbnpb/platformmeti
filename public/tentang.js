/* Halaman /tentang (publik): hero berfoto warna asli, tentang METI dan Direktori, visi dan misi, roadmap (draf), struktur organisasi (kartu foto penuh wajah), FAQ, kontak.
   Teks dari kamus (tn.*); data statis /data/pengurus-meti.json, mitra-meti.json, tentang-kredit.json, ringkas.json, roadmap.json. */
import "/inti/tautan_org.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { sumberHtml } from "/inti/komponen.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { namaGelar } from "/inti/nama_baku.js";

const muat = (n) => fetch(`/data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); });
const MI = "https://metiires.or.id";
const SURELP = "meti.ires@gmail.com";
const KONTAK = [["jm.kaki.surel", SURELP, "berita"], ["jm.kaki.situs", "www.meti.or.id", "tautan"], ["jm.kaki.kantor", "Taman Sari Parama Lt. 10, Jl. K.H. Wahid Hasyim No. 84-86, Kebon Sirih, Menteng, Jakarta Pusat 10340", "wilayah"]];
const inisial = (n) => String(n).replace(/[^\p{L} ]/gu, "").split(/\s+/).filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const avatar = (o, besar) => o.foto ? `<img class="tn-av${besar ? " besar" : ""}" src="${esc(o.foto)}" alt="" width="${besar ? 96 : 48}" height="${besar ? 96 : 48}" loading="lazy">` : `<span class="tn-av tn-ini tn-w${(inisial(o.nama).charCodeAt(0) || 0) % 5}${besar ? " besar" : ""}" aria-hidden="true">${esc(inisial(o.nama))}</span>`;
const PERS = new Map();
const slug = (n) => String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/* kepala bagian standar: eyebrow berikon, judul, lead */
const kepala = (id, ik, ey, h2, l) => `<header class="tn-sh"><p class="tn-ey">${ikon(ik, 16)}<span>${esc(ey)}</span></p><h2 id="${id}">${esc(h2.replace(/\*/g, ""))}</h2>${l ? `<p class="tn-lead">${esc(l.replace(/\*/g, ""))}</p>` : ""}</header>`;

/* ---------- kartu orang: foto persegi penuh; tanpa foto = inisial kecil di tengah atas, nama dan jabatan di bawahnya ---------- */
const TX = (k, f, par) => { const s = t(k, par); return s === k ? f.replace(/\{(\w+)\}/g, (m, n) => par[n]) : s; };
const orang = (o, ukuran = "") => {
  if (ukuran !== "besar") {
    /* satu bentuk kartu orang untuk seluruh bagan: foto atau monogram gradien brand di atas, pita nama di bawah */
    if (o.kosong || !o.nama) return `<li class="tn-kp tn-kp-kosong"><span class="tn-kp-b"><span class="tn-kp-f" aria-hidden="true">${ikon("orang", 36)}</span><span class="tn-kp-n"><b>${esc(t("tn.lowong"))}</b><small>${esc(o.jabatan)}</small></span></span></li>`;
    const k = o.orang_id || slug(o.nama); PERS.set(k, o);
    const f = o.foto ? `<img src="${esc(o.foto)}" alt="" width="360" height="360" loading="lazy">` : `<span class="tn-kp-ini" aria-hidden="true">${esc(inisial(o.nama))}</span>`;
    return `<li class="tn-kp"><button type="button" class="tn-kp-b" data-p="${esc(k)}" aria-label="${esc(t("tn.p.buka", { nama: o.nama }))}"><span class="tn-kp-f jm-batik tn-latar">${f}</span><span class="tn-kp-n"><b title="${esc(o.nama)}">${esc(o.nama)}</b><small title="${esc(o.jabatan)}">${esc(o.jabatan)}</small></span></button></li>`;
  }
  if (o.kosong || !o.nama) return `<li class="tn-fk tn-fk-kosong ${ukuran}"><span class="tn-fk-bg" aria-hidden="true">${ikon("orang", 36)}</span><span class="tn-fk-t"><b>${esc(t("tn.lowong"))}</b><small>${esc(o.jabatan)}</small></span></li>`;
  const k = o.orang_id || slug(o.nama); PERS.set(k, o);
  const bg = o.foto ? `<img src="${esc(o.foto)}" alt="" width="360" height="360" loading="lazy">` : `<span class="tn-fk-ini" aria-hidden="true">${esc(inisial(o.nama))}</span>`;
  const kls = o.foto ? (/-b\.webp$/.test(o.foto) ? "tn-fk-pt jm-batik" : "tn-fk-ft") : "tn-fk-nf jm-batik";
  return `<li class="tn-fk tn-latar ${kls} ${ukuran}"><button type="button" class="tn-fk-b" data-p="${esc(k)}" aria-label="${esc(t("tn.p.buka", { nama: o.nama }))}"><span class="tn-fk-bg">${bg}</span><span class="tn-fk-t"><b>${esc(o.nama)}</b><small>${esc(o.jabatan)}</small></span></button></li>`;
};
const ada = (o) => o.nama && !o.kosong;
/* posisi lowong tidak ditampilkan */
const ul = (a, uk) => `<ul class="tn-fkg">${a.filter(ada).map((o) => orang(o, uk)).join("")}</ul>`;
/* kepala unit seragam: ikon, nama, pil jumlah; rata tengah, pita aksen di bawah */
const nOrang = (a) => a.filter((o) => o.nama && !o.kosong).length;
const kepalaGrup = (ik, judul, a) => `<h4 title="${esc(judul)}">${ikon(ik, 16)}<span>${esc(judul)}</span>${a ? `<em class="tn-n">${angka(nOrang(a))}</em>` : ""}</h4>`;
const kelompok = (judul, a, { ik = "orang", besar = "", ekstra = "" } = {}) => `<section class="tn-grp ${ekstra}" data-n="${Math.min(5, a.filter(ada).length || 1)}">${kepalaGrup(ik, judul, a)}${ul(a, besar)}</section>`;

/* kelompok ringkas: kartu pimpinan + deret avatar + tombol "Lihat semua" yang membuka popup berisi seluruh anggota */
const GR = new Map();
const KW = /^(Ketua|Wakil Ketua)\b/;
/* bidang kerja dan unit khusus: hanya kartu ketua; anggota lain di deret avatar + "Lihat semua" (pemilik 8 Nov 2026) */
const KETUA = /^(Ketua|Chief|Koordinator)\b/;
const SATU = { pimpinan: KETUA, hanyaPim: true, maksPim: 1, semua: true };
const PIM = /^(Ketua|Wakil Ketua|Sekretaris|Chief|Vice Chief|Koordinator)\b/;
function ringkas(judul, a, { ik = "orang", pimpinan = PIM, maksPim = 3, hanyaPim = false, semua = false } = {}) {
  /* tiga kartu foto seragam: pimpinan dulu, dilengkapi anggota berfoto bila pimpinan kurang dari tiga */
  /* hanyaPim: kartu besar hanya Ketua dan Wakil Ketua (termasuk kursi lowong), tanpa diisi anggota berfoto (pemilik 8 Nov 2026) */
  const nyata = a.filter(ada), pim = (hanyaPim ? a : nyata).filter((o) => pimpinan.test(o.jabatan || "")).slice(0, maksPim);
  if (!hanyaPim) for (const o of nyata.filter((x) => x.foto && !pim.includes(x))) { if (pim.length >= 3) break; pim.push(o); }
  const sisa = a.filter((o) => !pim.includes(o)), avat = sisa.filter((o) => o.nama && !o.kosong);
  const id = "g" + GR.size; GR.set(id, { judul, ik, a });
  const lr = pim.length ? `<ul class="tn-lr">${pim.map((o) => orang(o)).join("")}</ul>` : "";
  /* kotak selebar isinya: n kartu pimpinan (maks 3) berukuran tetap; avatar 56px maks 2 baris lalu "+n" */
  const n = Math.min(maksPim, Math.max(hanyaPim ? 1 : 2, pim.length)), maks = { 1: 10, 2: 10, 3: 16, 4: 22 }[n];
  const tampil = avat.length > maks ? avat.slice(0, maks - 1) : avat, lebih = avat.length - tampil.length;
  const bawah = avat.length ? `<ul class="tn-av-kisi">${tampil.map((o) => { const k = o.orang_id || slug(o.nama); PERS.set(k, o); return `<li><button type="button" class="tn-av-b" data-p="${esc(k)}" title="${esc(o.nama)}, ${esc(o.jabatan)}" aria-label="${esc(t("tn.p.buka", { nama: o.nama }))}">${avatar(o)}</button></li>`; }).join("")}${lebih ? `<li><button type="button" class="tn-av-b tn-plus" data-grup="${id}" title="${esc(TX("tn.anggota_plus", "+{n} anggota", { n: lebih }))}">+${angka(lebih)}</button></li>` : ""}</ul>
    ${lebih || semua ? `<button type="button" class="tn-semua" data-grup="${id}">${ikon("orang", 16)}<span>${esc(TX("tn.lihat_semua", "Lihat semua {n} anggota", { n: nyata.length }))}</span></button>` : ""}` : "";
  return `<section class="tn-grp tn-rg" data-n="${n}">${kepalaGrup(ik, judul, a)}${lr}${bawah}</section>`;
}

/* ---------- bagian ---------- */
const KOLFOTO = [["surya", "surya-cirata"], ["bayu", "bayu-sidrap"], ["hidro", "hidro-saguling"], ["panas-bumi", "panas-bumi-sibayak"], ["bioenergi", "bioenergi-sawit"]];
function hero(f) {
  const kol = KOLFOTO.map(([k, fl], i) => `<a class="tn-kol" href="/proyek?teknologi=${k}" aria-label="${esc(t("tn.foto.buka", { nama: t("tn.foto." + k) }))}"><img src="/img/beranda/${fl}.webp" alt="" width="1600" height="900" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}><span class="tn-kol-isi">${ikonTek(k)}${esc(t("tn.foto." + k))}</span></a>`).join("");
  const st = [["kalender", 1999, t("tn.stat.berdiri")], ["orang", f.pengurus, t("tn.stat.pengurus")], ["tautan", f.mitra, t("tn.stat.mitra")], ["proyek", f.proyek, t("tn.stat.proyek")]];
  return `<section class="tn-hero" aria-labelledby="tn-judul"><div class="tn-kolom">${kol}</div><div class="tn-wrap tn-hero-isi"><h1 id="tn-judul">${esc(t("tn.judul"))}</h1><p class="tn-lead tn-hero-lead">${esc(t("tn.lead"))}</p>
    <div class="tn-aksi"><a class="tn-tbl tn-tbl-putih" href="/direktori">${esc(t("tn.cta_direktori"))}</a><a class="tn-tbl tn-tbl-garis" href="${MI}/membership" target="_blank" rel="noopener noreferrer">${esc(t("tn.cta_gabung"))}</a></div>
    <dl class="tn-angka" aria-label="${esc(t("tn.hero.aria"))}">${st.map(([ik, n, l]) => `<div><span class="tn-angka-ik">${ikon(ik, 20)}</span><dd>${esc(n === 1999 ? "1999" : angka(Number(n)))}</dd><dt>${esc(l)}</dt></div>`).join("")}</dl></div></section>`;
}

function tentang(f) {
  const st = [["kalender", "1999", t("tn.stat.berdiri")], ["orang", angka(f.individu), t("mw.u.individu")], ["direktori", angka(f.organisasi), t("mw.u.organisasi")], ["perisai", angka(f.pengurus), t("tn.stat.pengurus")], ["wilayah", angka(f.wilayah), t("tn.stat.wilayah")], ["tautan", angka(f.asosiasi), t("tn.stat.mitra")]];
  const pilar = [["tautan", 1], ["regulasi", 2], ["analisis", 3], ["wilayah", 4]];
  return `<section class="tn-seksi" id="tentang" aria-labelledby="tn-meti">${kepala("tn-meti", "info", t("tn.ey.tentang"), t("tn.mengapa.h2"))}
  <article class="tn-kartu tn-lebar"><div class="tn-lebar-isi"><div class="tn-lebar-teks"><p class="tn-isi">${esc(t("tn.meti.isi"))}</p><p class="tn-isi">${esc(t("tn.meti.peran"))}</p>
    <ul class="tn-pilar">${pilar.map(([ik, n]) => `<li><span class="tn-cek-ik">${ikon(ik, 20)}</span><span>${esc(t("tn.pilar." + n))}</span></li>`).join("")}</ul>
    <a class="tn-tbl-hijau" href="#tim">${ikon("orang", 18)}<span>${esc(t("tn.meti.link"))}</span></a></div>
    <dl class="tn-mini">${st.map(([ik, n, l]) => `<div><span class="tn-cek-ik">${ikon(ik, 20)}</span><dd>${esc(n)}</dd><dt>${esc(l)}</dt></div>`).join("")}</dl></div></article></section>`;
}

/* visi dan misi dari data/meti_profil.json (kamus tn.vm.*; uji tests/tentang-visimisi.test.mjs menjaga kesamaan teksnya) */
function visiMisi() {
  const misi = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<li><span class="tn-vm-no">${n}</span><span>${esc(t("tn.vm.m" + n))}</span></li>`).join("");
  return `<section class="tn-seksi" id="visi-misi" aria-labelledby="tn-vm">${kepala("tn-vm", "kompas", t("tn.ey.visimisi"), t("tn.vm.h2"))}
  <div class="tn-vm"><article class="tn-kartu tn-vm-visi"><h3>${ikon("kompas", 20)}<span>${esc(t("tn.vm.visi_j"))}</span></h3><p class="tn-isi">${esc(t("tn.vm.visi"))}</p></article>
  <article class="tn-kartu tn-vm-misi"><h3>${ikon("daftar", 20)}<span>${esc(t("tn.vm.misi_j"))}</span></h3><ol class="tn-vm-l">${misi}</ol></article></div>
  <p class="tn-vm-sumber">${ikon("info", 16)}<span>${esc(t("tn.vm.sumber"))}</span></p></section>`;
}

/* ringkasan roadmap dari /data/roadmap.json; wajib berlabel draf (buku saku 2025-2028 dan SK platform 2026-2028 belum selaras) */
function roadmap(R) {
  const P = R.PROGRAM || [], K = R.KUARTAL || [], n = (c) => P.filter((x) => x.kelas === c).length;
  const st = [["centang", String(n("Pasti")), t("rm.ub.pasti")], ["kunci", String(n("Bersyarat")), t("rm.ub.bersyarat")], ["kalender", `${K[0]} - ${K[K.length - 1]}`, t("tn.rm.periode")]];
  const nama = P.filter((x) => x.kelas === "Pasti").map((x) => `<li>${esc(x.nama)}</li>`).join("");
  return `<section class="tn-seksi" id="roadmap" aria-labelledby="tn-rm">${kepala("tn-rm", "kompas", t("tn.ey.roadmap"), t("tn.rm.h2"), t("tn.rm.lead"))}
  <article class="tn-kartu tn-rm"><p class="tn-rm-draf" role="note">${ikon("info", 18)}<span>${esc(t("tn.rm.draf"))}</span></p>
  <dl class="tn-mini tn-rm-st">${st.map(([ik, v, l]) => `<div><span class="tn-cek-ik">${ikon(ik, 20)}</span><dd>${esc(v)}</dd><dt>${esc(l)}</dt></div>`).join("")}</dl>
  <ul class="tn-rm-prog" aria-label="${esc(t("rm.ub.pasti"))}">${nama}</ul>
  <p class="tn-isi">${esc(t("tn.rm.catatan"))}</p>
  <a class="tn-tbl-hijau" href="/roadmap">${ikon("kompas", 18)}<span>${esc(t("tn.rm.link"))}</span></a></article></section>`;
}

/* wadah exhibit standar: eyebrow, judul berangka "n kelompok, m orang", isi kisi kompartemen */
const wadah = (ik, ey, kunci, n, o, isi, kls) => `<div class="jm-ex tn-wd"><header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey">${ikon(ik, 14)}${esc(ey)}</span><h3 class="jm-ex-j">${esc(TX(kunci, "{n}, {o}", { n, o })).replace(String(n), `<span class="jm-hl">${n}</span>`)}</h3></div></header><div class="jm-ex-bd"><div class="tn-kisi ${kls}">${isi}</div></div></div>`;
let PERIODE = "";
function struktur(p) {
  PERIODE = p.periode || "";
  const U = p.unit, d = U.dewan || [], iPakar = d.findIndex((o) => /Ketua Dewan Pakar/.test(o.jabatan));
  const pengawas = iPakar < 0 ? d : d.slice(0, iPakar), pakar = iPakar < 0 ? [] : d.slice(iPakar);
  const bidang = p.bidang.filter((b) => b.nama);
  const kb = (b, i) => ringkas(t("tn.u.bk", { n: i + 1 }) + ": " + b.nama, b.anggota, { ik: "daftar", ...SATU });
  const ket = (U.ketum || [])[0];
  const unit = [[t("tn.u.institute"), U.institute, SATU], [t("tn.u.wilayah"), U.wilayah, { ik: "wilayah", ...SATU }], [t("tn.u.muda"), U.muda, SATU], [t("tn.u.komite"), U.komite, SATU], [t("tn.u.sdu"), U.sdu && U.sdu.map((o) => (o.pmo ? { ...o, jabatan: o.jabatan.replace(/^PMO\s+/, "") } : o)), { ik: "direktori", ...SATU }]].filter(([, a]) => a);
  /* susunan di bawah Ketua Umum (pemilik 8 Nov 2026): Waketum sejajar Direktur Eksekutif, lalu Sekretaris Jenderal dan Bendahara sejajar satu baris, kartu dikecilkan (pemilik 9 Nov 2026) */
  const baris = (daftar) => daftar.filter(([k]) => U[k]).map(([k, j, s]) => kelompok(t(j), U[k], { ekstra: k === "sekjen" || k === "bendahara" ? "tn-baris5" : "" })).join("");
  const rows = [[["waketum", "tn.u.waketum", true], ["eksekutif", "tn.u.eksekutif", true]], [["sekjen", "tn.u.sekjen"], ["bendahara", "tn.u.bendahara"]]].map(baris).filter(Boolean);
  return `<section class="tn-seksi tn-bagan-bg" id="tim" aria-labelledby="tn-struktur">${kepala("tn-struktur", "orang", t("tn.ey.struktur"), t("tn.struktur.h2"), t("tn.struktur.pengantar", { periode: p.periode }))}
  <div class="tn-pohon"><div class="tn-r tn-r0">${ringkas(t("tn.u.penasihat"), U.penasihat || [], { ik: "kompas", pimpinan: KW, hanyaPim: true })}${ringkas(t("tn.u.pengawas"), pengawas, { ik: "perisai", pimpinan: KW, hanyaPim: true })}${ringkas(t("tn.u.pakar"), pakar, { ik: "wisuda", pimpinan: KW, hanyaPim: true })}</div>
    <div class="tn-konek" aria-hidden="true"></div>
    ${ket ? `<div class="tn-r tn-r1"><section class="tn-grp tn-ketum">${kepalaGrup("orang", t("tn.u.ketum"))}${ul([ket], "besar")}</section></div><div class="tn-konek" aria-hidden="true"></div>` : ""}
    ${rows.map((r) => `<div class="tn-r tn-r2">${r}</div>`).join(`<div class="tn-konek" aria-hidden="true"></div>`)}</div>
    ${wadah("daftar", t("tn.u.bidang_ey"), "tn.u.bidang_h", bidang.length, bidang.reduce((u, b) => u + nOrang(b.anggota), 0), bidang.map(kb).join(""), "tn-kisi-b")}
    ${wadah("wilayah", t("tn.u.unit"), "tn.u.unit_h", unit.length, unit.reduce((u, [, a]) => u + nOrang(a), 0), unit.map(([j, a, o]) => ringkas(j, a, o)).join(""), "tn-kisi-u")}
    ${U.staf ? `<div class="tn-staf-baris">${ringkas(t("tn.u.staf"), U.staf, SATU)}</div>` : ""}</section>`;
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
  const [p, m, k, r, rm, mw] = await Promise.all([muat("pengurus-meti"), muat("mitra-meti"), muat("tentang-kredit"), muat("ringkas"), muat("roadmap").catch(() => null), muat("meti-wilayah").catch(() => ({ provinsi: [], versi_angka: [] }))]);
  /* angka anggota dan wilayah dari meti-wilayah.json (sama dengan kaki situs) */
  const prov = mw.provinsi || [], terbaru = [...(mw.versi_angka || [])].sort((x, y) => (y.tanggal || "").localeCompare(x.tanggal || ""))[0];
  const nama = new Set([...Object.values(p.unit).flat(), ...p.bidang.flatMap((b) => b.anggota)].filter((o) => o.nama).map((o) => o.nama));
  isi.innerHTML = hero({ pengurus: nama.size, mitra: m.asosiasi.length, proyek: r.hitung.proyek }) + `<div class="tn-wrap">` + tentang({ pengurus: nama.size, individu: prov.reduce((u, x) => u + (x.individu || 0), 0), organisasi: prov.reduce((u, x) => u + (x.organisasi || 0), 0), wilayah: terbaru?.berdiri || 0, asosiasi: m.asosiasi.length }) + visiMisi() + (rm ? roadmap(rm) : "") + struktur(p) + faq(k) + `</div>`;
} catch (e) {
  console.error("tentang", e);
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
/* angka jabatan seragam: "Wakil Ketua Umum 2" dan "... II" sama-sama jadi romawi */
const ROMAWI = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const seragam = (j) => String(j || "").replace(/^(Wakil (?:Ketua Umum|Sekretaris Jenderal|Bendahara Umum|Direktur Eksekutif)|Sekretaris Jenderal)\s+(\d{1,2})$/, (m, a, n) => `${a} ${ROMAWI[+n] || n}`);
const dasarJ = (j) => String(j || "").replace(/\s*\(.*$/, "").trim().toLowerCase();
const laMETI = (x) => /\bMETI\b|Masyarakat Energi Terbarukan/i.test(x.organisasi || "");
/* gabung butir ganda (jabatan sama dasar + organisasi sama): nama terpanjang menang, rentang tahun digabung */
function rekam(a) {
  const hasil = [];
  for (const x of a) {
    const d = hasil.find((y) => norm(y.organisasi || "") === norm(x.organisasi || "") && (dasarJ(y.jabatan) === dasarJ(x.jabatan)));
    if (!d) { hasil.push({ ...x }); continue; }
    if (String(x.jabatan).length > String(d.jabatan).length) d.jabatan = x.jabatan;
    d.mulai = [d.mulai, x.mulai].filter(Boolean).sort()[0] || d.mulai;
    d.selesai = [d.selesai, x.selesai].filter(Boolean).sort().pop() || d.selesai;
    d.kini = d.kini || x.kini; d.organisasi_id = d.organisasi_id || x.organisasi_id;
  }
  return hasil;
}
const logoOrg = (x) => (x.organisasi_id ? `<img class="tn-pl" src="/img/logo/org/${esc(x.organisasi_id)}.png" alt="" width="40" height="40">` : `<span class="tn-pl tn-pl-ik">${ikon("gedung", 18)}</span>`);
function profil(p, o) {
  o = o || {};
  /* jabatan METI mengikuti SK (pengurus-meti.json); butir panen METI yang bertentangan disembunyikan */
  const sk = seragam(p.jabatan);
  /* butir panen METI periode berjalan digantikan jabatan SK; butir METI periode lama tetap tampil */
  const jb = rekam(o.jabatan || []).filter((x) => x.jabatan && !(laMETI(x) && (x.kini || Number(String(x.mulai).slice(0, 4)) >= 2025)));
  const lain = jb.filter((x) => !laMETI(x));
  const th = (x) => { const m = String(x.mulai || "").slice(0, 4), s = x.kini ? t("tn.p.sekarang") : String(x.selesai || "").slice(0, 4); return m && s ? t("tn.p.sampai", { a: m, b: s }) : m || s; };
  const metiOrg = (o.organisasi_id && laMETI({ organisasi: o.organisasi_terkini })) ? o.organisasi_id : (jb.find(laMETI) || {}).organisasi_id;
  const pitaMeti = `<li class="tn-pk-r"><span class="tn-pk-t">${logoOrg({ organisasi_id: metiOrg })}</span><span><b>${esc(sk)}</b><small>${esc(t("tn.p.org_meti"))}${PERIODE ? ", " + esc(t("tn.p.periode_n", { p: PERIODE })) : ""}</small></span></li>`;
  const urut = [pitaMeti, ...lain.map((x) => `<li class="tn-pk-r"><span class="tn-pk-t">${logoOrg(x)}</span><span><b>${esc(seragam(x.jabatan))}</b><small>${esc(x.organisasi || "")}${th(x) ? ", " + esc(th(x)) : ""}</small></span></li>`)];
  const skrg = lain.find((x) => x.kini);
  const kini = skrg ? `<p class="tn-kini">${logoOrg(skrg)}<span>${esc(skrg.organisasi || "")}</span></p>` : "";
  const pend = (o.pendidikan || []).map((x) => `<li>${esc(typeof x === "string" ? x : [x.jenjang, x.institusi, x.tahun].filter(Boolean).join(", "))}</li>`).join("");
  const tautanAda = (o.tautan || []).filter((x) => http(x.url));
  const tau = [...new Map(tautanAda.map((x) => [x.url, x])).values()].map((x) => `<a class="tn-tbl-tau" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${ikon(/linkedin/i.test(x.url) ? "linkedin" : "tautan", 16)}<span>${esc(host(x.url))}</span></a>`).join("");
  const sudah = new Set(tautanAda.map((x) => x.url));
  const sum = [...new Set([o.sumber_url, ...jb.map((x) => x.sumber_url)].filter((u) => http(u) && !sudah.has(u)))].map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(host(u))}</a>`).join(" ");
  const nama = namaGelar(p.nama, o.gelar);
  const foto = p.foto ? `<img class="tn-pk-foto" src="${esc(p.foto)}" alt="" width="132" height="132">` : `<span class="tn-pk-foto tn-pk-ini" aria-hidden="true">${esc(inisial(p.nama))}</span>`;
  const ringkasBasi = /menjabat .+ di METI periode/i.test(o.ringkasan || "");
  const kiri = [o.ringkasan && !ringkasBasi ? bagI("info", t("tn.p.ringkas"), `<p>${esc(o.ringkasan)}</p>`) : "",
    (o.kepakaran || []).length ? bagI("insight", t("tn.p.pakar"), `<p class="tn-pil">${o.kepakaran.map((x) => `<span>${esc(manusia(x.kode || x))}</span>`).join("")}</p>`) : "",
    bagI("jejak", t("tn.p.jejak"), `<ol class="tn-pk-jejak">${urut.join("")}</ol>`),
    pend ? bagI("buku", t("tn.p.pendidikan"), `<ul class="tn-pend">${pend}</ul>`) : ""].join("");
  const kanan = `<section class="tn-pk-kartu"><h4>${ikon("orang", 16)}<span>${esc(t("tn.p.di_meti"))}</span></h4><p><b>${esc(sk)}</b>${PERIODE ? `<small>${esc(t("tn.p.periode_n", { p: PERIODE }))}</small>` : ""}</p></section>`
    + (tau ? `<section class="tn-pk-kartu"><h4>${ikon("tautan", 16)}<span>${esc(t("tn.p.tautan"))}</span></h4><div class="tn-tau">${tau}</div></section>` : "")
    + (sum ? `<p class="tn-pk-sumber">${sumberHtml(sum, t("tn.p.sumber"))}<span>${esc(t("tn.p.sumber"))}</span></p>` : "");
  return `<div class="tn-pk-pita jm-batik" aria-hidden="true"></div>
  <header class="tn-ph tn-pk-kepala">${foto}<div class="tn-pk-nama"><h3 id="tn-pj">${esc(nama)}</h3><p class="tn-chip">${ikon("orang", 16)}<span>${esc(sk)}</span></p>${kini}</div></header>
  <div class="tn-pk-isi"><div class="tn-pk-kiri">${kiri}</div><aside class="tn-pk-kanan">${kanan}</aside></div>`;
}
const bagI = (ik, judul, isi) => `<section class="tn-pb"><h4>${ikon(ik, 18)}<span>${esc(judul)}</span></h4>${isi}</section>`;

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
dlg.addEventListener("error", (e) => { if (e.target.classList && e.target.classList.contains("tn-pl")) e.target.replaceWith(Object.assign(document.createElement("span"), { className: "tn-pl tn-pl-ik", innerHTML: ikon("gedung", 18) })); }, true);
if (location.hash.startsWith("#pengurus-")) bukaProfil(decodeURIComponent(location.hash.slice(10)));
