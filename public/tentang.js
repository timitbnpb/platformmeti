/* Halaman /tentang (publik): hero berfoto warna asli, tentang METI dan Direktori, teknologi (panel bergambar), struktur organisasi (kartu foto penuh wajah), mitra, FAQ, kontak.
   Teks dari kamus (tn.*); data statis /data/pengurus-meti.json, mitra-meti.json, tentang-kredit.json, ringkas.json. */
import "/inti/tautan_org.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { t, tanggal, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

const muat = (n) => fetch(`/data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); });
const MI = "https://metiires.or.id";
const SURELP = "meti.ires@gmail.com";
const KONTAK = [["jm.kaki.surel", SURELP, "berita"], ["jm.kaki.situs", "www.meti.or.id", "tautan"], ["jm.kaki.kantor", "Taman Sari Parama Lt. 10, Jl. K.H. Wahid Hasyim No. 84-86, Kebon Sirih, Menteng, Jakarta Pusat 10340", "wilayah"], ["jm.kaki.rumah", "Jl. Jatinegara Barat IV No. 3A, Balimester, Jatinegara, Jakarta Timur 13310", "wilayah"]];
/* kode teknologi sama dengan /teknologi/<kode>; foto dari /img/beranda (tanpa foto: gradasi merek + ikon besar) */
const TEK = [["surya", "tek-surya", "surya-cirata"], ["bayu", "tek-listrik", "bayu-sidrap"], ["hidro", "tek-listrik", "hidro-saguling"], ["panas-bumi", "tek-panas", "panas-bumi-sibayak"], ["bioenergi", "tek-bio", "bioenergi-sawit"], ["biomassa-sampah", "tek-bio", "sampah-psel"], ["penyimpanan", "tek-listrik", "penyimpanan-baterai"], ["hidrogen", "tek-listrik", ""], ["nuklir", "perisai", "nuklir-siwabessy"]];
/* ponytail: logo lebar (wordmark) diganti lambang kecil + label; ganti lewat data bila daftar bertambah */
const LAMBANG = { "Ditjen EBTKE ESDM": ["/img/logo/ebtke.png", "Ditjen EBTKE"], "Kementerian ESDM": ["/img/logo/esdm.png", "Kementerian ESDM"] };
const LOGO_ASOS = { AESI: "/img/logo/aesi.png", APROBI: "/img/logo/aprobi.png", API: "/img/logo/api-inaga.png", APAMSI: "/img/logo/apamsi.png" };

const inisial = (n) => String(n).replace(/[^\p{L} ]/gu, "").split(/\s+/).filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const avatar = (o, besar) => o.foto ? `<img class="tn-av${besar ? " besar" : ""}" src="${esc(o.foto)}" alt="" width="${besar ? 96 : 48}" height="${besar ? 96 : 48}" loading="lazy">` : `<span class="tn-av tn-ini${besar ? " besar" : ""}" aria-hidden="true">${esc(inisial(o.nama))}</span>`;
const PERS = new Map();
const slug = (n) => String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/* kepala bagian standar: eyebrow berikon, judul, lead */
const kepala = (id, ik, ey, h2, l) => `<header class="tn-sh"><p class="tn-ey">${ikon(ik, 16)}<span>${esc(ey)}</span></p><h2 id="${id}">${esc(h2.replace(/\*/g, ""))}</h2>${l ? `<p class="tn-lead">${esc(l.replace(/\*/g, ""))}</p>` : ""}</header>`;

/* ---------- kartu orang: foto penuh wajah, nama dan jabatan di dalam foto ---------- */
const orang = (o, ukuran = "") => {
  if (o.kosong || !o.nama) return `<li class="tn-fk tn-fk-kosong ${ukuran}"><span class="tn-fk-bg" aria-hidden="true">${ikon("orang", 40)}</span><span class="tn-fk-t"><b>${esc(t("tn.lowong"))}</b><small>${esc(o.jabatan)}</small></span></li>`;
  const k = o.orang_id || slug(o.nama); PERS.set(k, o);
  const bg = o.foto ? `<img src="${esc(o.foto)}" alt="" width="360" height="480" loading="lazy">` : `<span class="tn-fk-ini" aria-hidden="true">${esc(inisial(o.nama))}</span>`;
  return `<li class="tn-fk ${ukuran}"><button type="button" class="tn-fk-b" data-p="${esc(k)}" aria-label="${esc(t("tn.p.buka", { nama: o.nama }))}"><span class="tn-fk-bg">${bg}</span><span class="tn-fk-t"><b>${esc(o.nama)}</b><small>${esc(o.jabatan)}</small></span></button></li>`;
};
const ul = (a, uk) => `<ul class="tn-fkg">${a.map((o) => orang(o, uk)).join("")}</ul>`;
const plus = (sisa, kunci = "tn.anggota_plus") => sisa.length ? `<details class="tn-unit"><summary><span>${esc(t(kunci, { n: sisa.length }))}</span>${ikon("panah-kanan", 16)}</summary>${ul(sisa, "kecil")}</details>` : "";
/* kelompok: pemimpin tampil, sisanya di tombol buka */
const kelompok = (judul, a, { semua = false, ekstra = "", ik = "orang", besar = "" } = {}) => {
  const tampil = semua || a.length <= 2 ? a : [a[0]], sisa = semua || a.length <= 2 ? [] : a.slice(1);
  return `<section class="tn-grp ${ekstra}"><h4>${ikon(ik, 16)}<span>${esc(judul)}</span></h4>${ul(tampil, besar)}${plus(sisa)}</section>`;
};

const tbl = (x, dup) => {
  const l = LAMBANG[x.nama], src = l ? l[0] : x.logo, lebar = !l && x.w / x.h > 3.2;
  return `<li${dup ? ' aria-hidden="true"' : ""}><a class="tn-logo"${dup ? ' tabindex="-1"' : ""} data-org-nama="${esc(x.nama)}" href="/direktori?cari=${encodeURIComponent(x.nama)}" title="${esc(x.nama)}"><img src="${esc(src)}" alt="${esc(x.nama)}" loading="lazy">${l || lebar ? `<span>${esc(l ? l[1] : x.nama)}</span>` : ""}</a></li>`;
};
const tblAsos = (a, dup) => `<li${dup ? ' aria-hidden="true"' : ""}><a class="tn-logo"${dup ? ' tabindex="-1"' : ""} href="/direktori?cari=${encodeURIComponent(a)}" title="${esc(a)}">${LOGO_ASOS[a] ? `<img src="${LOGO_ASOS[a]}" alt="${esc(a)}" loading="lazy">` : `<b class="tn-mono">${esc(a)}</b>`}</a></li>`;
/* ponytail: marquee CSS murni; daftar pendek diulang sampai >= 10 butir lalu digandakan untuk putaran mulus */
const jalur = (a, fn, balik) => { const r = Math.ceil(10 / a.length), basis = Array.from({ length: r }, (_, k) => a.map((x) => fn(x, k > 0))).flat(); return `<div class="tn-pita"><ul class="tn-trek${balik ? " balik" : ""}">${basis.join("")}${a.length ? Array.from({ length: r }, () => a.map((x) => fn(x, true))).flat().join("") : ""}</ul></div>`; };

/* ---------- bagian ---------- */
function hero(f) {
  const st = [["kalender", 1999, t("tn.stat.berdiri")], ["orang", f.pengurus, t("tn.stat.pengurus")], ["tautan", f.mitra, t("tn.stat.mitra")], ["proyek", f.proyek, t("tn.stat.proyek")]];
  return `<section class="tn-hero" aria-labelledby="tn-judul"><img class="tn-hero-foto" src="/img/beranda/surya-cirata.webp" alt="" width="1600" height="900" fetchpriority="high"><div class="tn-wrap tn-hero-isi"><h1 id="tn-judul">${esc(t("tn.judul"))}</h1><p class="tn-lead tn-hero-lead">${esc(t("tn.lead"))}</p>
    <div class="tn-aksi"><a class="tn-tbl tn-tbl-putih" href="/direktori">${esc(t("tn.cta_direktori"))}</a><a class="tn-tbl tn-tbl-garis" href="${MI}/membership" target="_blank" rel="noopener noreferrer">${esc(t("tn.cta_gabung"))}</a></div>
    <dl class="tn-angka" aria-label="${esc(t("tn.hero.aria"))}">${st.map(([ik, n, l]) => `<div>${ikon(ik, 20)}<dd>${esc(n === 1999 ? "1999" : angka(Number(n)))}</dd><dt>${esc(l)}</dt></div>`).join("")}</dl></div></section>`;
}

function tentang(f) {
  const st = [["kalender", "1999", t("tn.stat.berdiri")], ["tautan", angka(f.anggota), t("tn.stat.anggota")], ["orang", angka(f.pengurus), t("tn.stat.pengurus")]];
  const pr = ["jejak", "ubah", "perisai", "kunci"];
  return `<section class="tn-seksi" id="tentang" aria-labelledby="tn-meti">${kepala("tn-meti", "info", t("tn.ey.tentang"), t("tn.mengapa.h2"), t("tn.mengapa.lead"))}
  <div class="tn-dua"><article class="tn-kartu tn-fitur"><header><img src="/img/logo-meti-tanda.png" alt="" width="48" height="48"><h3>${esc(t("tn.meti.judul"))}</h3></header>
    <p class="tn-isi">${esc(t("tn.meti.isi"))}</p><p class="tn-isi">${esc(t("tn.meti.peran"))}</p>
    <dl class="tn-mini">${st.map(([ik, n, l]) => `<div>${ikon(ik, 20)}<dd>${esc(n)}</dd><dt>${esc(l)}</dt></div>`).join("")}</dl>
    <a class="tn-lanjut tn-bawah" href="#tim">${esc(t("tn.meti.link"))}</a></article>
  <article class="tn-kartu tn-fitur"><header><span class="tn-bulat">${ikon("direktori", 24)}</span><h3>${esc(t("tn.dir.judul"))}</h3></header>
    <p class="tn-isi">${esc(t("tn.dir.isi"))}</p>
    <ul class="tn-cek">${[1, 2, 3, 4].map((n) => `<li><span class="tn-cek-ik">${ikon(pr[n - 1], 18)}</span><span>${esc(t("tn.dir.b" + n))}</span></li>`).join("")}</ul>
    <a class="tn-lanjut tn-bawah" href="/metode">${esc(t("tn.dir.link"))}</a></article></div></section>`;
}

function teknologi() {
  const kartu = TEK.map(([k, ik, foto]) => `<a class="tn-tp" href="/teknologi/${k}" aria-label="${esc(t("tn.foto.buka", { nama: t("tn.tek." + k) }))}">${foto ? `<img src="/img/beranda/${foto}.webp" alt="" width="640" height="800" loading="lazy">` : `<span class="tn-tp-ik" aria-hidden="true">${ikon(ik, 72)}</span>`}<span class="tn-tp-t">${ikon(ik, 20)}<b>${esc(t("tn.tek." + k))}</b><i>${ikon("panah-kanan", 16)}</i></span></a>`).join("");
  return `<section class="tn-seksi tn-pita-bg" id="teknologi" aria-labelledby="tn-tek"><div class="tn-kepala-baris">${kepala("tn-tek", "tek-surya", t("tn.ey.teknologi"), t("tn.tek.h2"), t("tn.tek.lead"))}<div class="tn-nav"><button type="button" class="tn-nv" data-geser="-1" aria-label="${esc(t("tn.tek.sebelum"))}">${ikon("panah-kiri", 18)}</button><button type="button" class="tn-nv" data-geser="1" aria-label="${esc(t("tn.tek.sesudah"))}">${ikon("panah-kanan", 18)}</button></div></div>
  <div class="tn-tek" id="tnTek" tabindex="-1">${kartu}</div></section>`;
}

/* SDU: Chief dan Vice Chief terlihat; PMO di tombol buka, jabatan tanpa awalan "PMO " */
function sdu(a) {
  const inti = a.filter((o) => !o.pmo), pmo = a.filter((o) => o.pmo).map((o) => ({ ...o, jabatan: o.jabatan.replace(/^PMO\s+/, "") }));
  return `<section class="tn-grp tn-sdu"><h4>${ikon("direktori", 16)}<span>${esc(t("tn.u.sdu"))}</span></h4>${ul(inti)}${plus(pmo, "tn.u.pmo")}</section>`;
}

function struktur(p) {
  const U = p.unit, d = U.dewan || [], iPakar = d.findIndex((o) => /Ketua Dewan Pakar/.test(o.jabatan));
  const pengawas = iPakar < 0 ? d : d.slice(0, iPakar), pakar = iPakar < 0 ? [] : d.slice(iPakar);
  const bidang = p.bidang.filter((b) => b.nama);
  const kb = (b, i) => `<section class="tn-grp"><h4>${ikon("daftar", 16)}<span>${esc(t("tn.u.bk", { n: i + 1 }))}: ${esc(b.nama)}</span></h4>${ul(b.anggota, "kecil")}</section>`;
  const ket = (U.ketum || [])[0];
  const baris2 = [["waketum", "tn.u.waketum", true], ["sekjen", "tn.u.sekjen"], ["bendahara", "tn.u.bendahara"], ["eksekutif", "tn.u.eksekutif", true]].filter(([k]) => U[k]).map(([k, j, s]) => kelompok(t(j), U[k], { semua: !!s })).join("");
  return `<section class="tn-seksi tn-bagan-bg" id="tim" aria-labelledby="tn-struktur">${kepala("tn-struktur", "orang", t("tn.ey.struktur"), t("tn.struktur.h2"), t("tn.struktur.pengantar", { periode: p.periode }))}
  <div class="tn-pohon"><div class="tn-r tn-r0">${kelompok(t("tn.u.penasihat"), U.penasihat || [], { semua: true, ik: "perisai" })}${kelompok(t("tn.u.pengawas"), pengawas, { ik: "perisai" })}${kelompok(t("tn.u.pakar"), pakar, { semua: pakar.length <= 3, ik: "insight" })}</div>
    <div class="tn-konek" aria-hidden="true"></div>
    ${ket ? `<div class="tn-r tn-r1"><section class="tn-grp tn-ketum"><h4>${ikon("orang", 16)}<span>${esc(t("tn.u.ketum"))}</span></h4>${ul([ket], "besar")}</section></div><div class="tn-konek" aria-hidden="true"></div>` : ""}
    <div class="tn-r tn-r2">${baris2}</div></div>
    <h3 class="tn-sub">${ikon("daftar", 18)}<span>${esc(t("tn.u.bidang"))}</span></h3><div class="tn-bidang tn-bk9">${bidang.map(kb).join("")}</div>
    <h3 class="tn-sub">${ikon("wilayah", 18)}<span>${esc(t("tn.u.unit"))}</span></h3><div class="tn-bidang">${[U.institute && kelompok(t("tn.u.institute"), U.institute, { semua: true }), U.wilayah && kelompok(t("tn.u.wilayah"), U.wilayah, { semua: true, ik: "wilayah" }), U.muda && kelompok(t("tn.u.muda"), U.muda, { semua: true }), U.komite && kelompok(t("tn.u.komite"), U.komite), U.staf && kelompok(t("tn.u.staf"), U.staf), U.sdu && sdu(U.sdu)].filter(Boolean).join("")}</div>
    <p class="tn-kecil">${esc(t("tn.struktur.sumber", { sumber: p.sumber, tanggal: tanggal(p.diperbarui || p.diambil) }))}</p></section>`;
}

function mitra(m) {
  const grup = (kunci, a, fn, balik) => `<h3 class="tn-sub tn-tengah">${esc(t(kunci))}</h3>${jalur(a, fn, balik)}`;
  return `<section class="tn-seksi tn-pita-bg" id="mitra" aria-labelledby="tn-mitra">${kepala("tn-mitra", "tautan", t("tn.ey.mitra"), t("tn.mitra.h2"), t("tn.mitra.pengantar", { tanggal: tanggal(m.diambil) }))}
  ${grup("tn.mitra.kerja", m.mitra, tbl)}${grup("tn.mitra.anggota", m.anggota, tbl, true)}${grup("tn.mitra.asosiasi", m.asosiasi, tblAsos)}<p class="tn-tengah tn-pangkal"><a class="tn-lanjut" href="${esc(m.sumber)}" target="_blank" rel="noopener noreferrer">${esc(t("tn.mitra.lengkap"))}</a></p></section>`;
}

function faq(k) {
  const ik = ["direktori", "jejak", "orang", "ubah", "tautan", "perisai"];
  const butir = [1, 2, 3, 4, 5, 6].map((n) => `<details name="faq"><summary><span class="tn-q-ik">${ikon(ik[n - 1], 18)}</span><span class="tn-q-t">${esc(t("tn.faq.q" + n))}</span></summary><div class="tn-q-a"><p>${esc(t("tn.faq.a" + n))}</p></div></details>`).join("");
  return `<section class="tn-seksi" id="faq" aria-labelledby="tn-faq">${kepala("tn-faq", "info", t("tn.ey.faq"), t("tn.faq.h2"), "")}
  <div class="tn-faq-kisi"><div class="tn-faq">${butir}</div>${kotakKontak()}</div>
  <details class="tn-kr"><summary>${esc(t("tn.kredit.judul_n", { judul: t("tn.kredit.judul"), n: k.length }))}</summary><p>${esc(t("tn.kredit.pengantar"))}</p><ul>${k.map((x) => `<li><a href="${esc(x.sumber)}" target="_blank" rel="noopener noreferrer"><img src="/img/tentang/${esc(x.kunci)}.webp" alt="" width="64" height="40" loading="lazy"><span>${esc(x.judul)}<small>${esc(x.pencipta)}</small></span><em>${esc(x.lisensi)}</em></a></li>`).join("")}</ul></details></section>`;
}

/* kotak "Masih ada pertanyaan?" + kontak sekretariat; tombol gabung */
function kotakKontak() {
  return `<aside class="tn-ada" id="kontak" aria-labelledby="tn-ada"><span class="tn-ada-ik">${ikon("berita", 26)}</span><h3 id="tn-ada">${esc(t("tn.faq.ada"))}</h3><p class="tn-isi">${esc(t("tn.faq.ada_isi"))}</p>
  <ul class="tn-kk">${KONTAK.map(([k, v, ik]) => `<li>${ikon(ik, 20)}<span><small>${esc(t(k))}</small><b>${esc(v)}</b></span><button type="button" class="tn-salin" data-salin="${esc(v)}">${esc(t("tn.salin"))}</button></li>`).join("")}</ul>
  <div class="tn-aksi"><a class="tn-tbl tn-tbl-hijau" href="mailto:${SURELP}">${esc(t("tn.faq.surel"))}</a><a class="tn-tbl tn-tbl-tepi" href="${MI}/membership" target="_blank" rel="noopener noreferrer">${esc(t("tn.cta_gabung"))}</a></div></aside>`;
}

await mulaiHalaman();
const isi = document.getElementById("isi");
try {
  const [p, m, k, r] = await Promise.all([muat("pengurus-meti"), muat("mitra-meti"), muat("tentang-kredit"), muat("ringkas")]);
  const nama = new Set([...Object.values(p.unit).flat(), ...p.bidang.flatMap((b) => b.anggota)].filter((o) => o.nama).map((o) => o.nama));
  isi.innerHTML = hero({ pengurus: nama.size, mitra: m.asosiasi.length, proyek: r.hitung.proyek }) + `<div class="tn-wrap">` + tentang({ pengurus: nama.size, anggota: m.anggota.length }) + teknologi() + struktur(p) + mitra(m) + faq(k) + `</div>`;
} catch (e) {
  isi.innerHTML = `<p class="tn-wrap tn-galat jm-galat" role="alert">${esc(t("tn.galat"))}</p>`;
}
isi.addEventListener("click", (e) => {
  const b = e.target.closest("[data-salin]");
  if (b && navigator.clipboard) navigator.clipboard.writeText(b.dataset.salin).then(() => { b.textContent = t("tn.tersalin"); setTimeout(() => { b.textContent = t("tn.salin"); }, 1500); }, () => {});
  const g = e.target.closest("[data-geser]"), tk = document.getElementById("tnTek");
  if (g && tk) tk.scrollBy({ left: Number(g.dataset.geser) * tk.clientWidth * 0.8, behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" });
});
/* panel teknologi berganti pelan sendiri; berhenti saat disorot/difokus atau gerak dikurangi */
{
  const tk = document.getElementById("tnTek");
  if (tk && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
    let jeda = false;
    for (const ev of ["pointerenter", "focusin", "touchstart"]) tk.addEventListener(ev, () => { jeda = true; });
    for (const ev of ["pointerleave", "focusout"]) tk.addEventListener(ev, () => { jeda = false; });
    setInterval(() => {
      if (jeda || document.hidden) return;
      const habis = tk.scrollLeft + tk.clientWidth >= tk.scrollWidth - 4;
      tk.scrollTo({ left: habis ? 0 : tk.scrollLeft + tk.clientWidth * 0.5, behavior: "smooth" });
    }, 4500);
  }
}

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
