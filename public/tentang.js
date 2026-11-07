/* Halaman /tentang (publik), anatomi halaman Tentang Posko Karhutla: hero berfoto, pita logo, seksi berpita foto, bagan organisasi, mitra, metode, kontak, FAQ, kredit foto.
   Teks dari kamus (tn.*); data statis /data/pengurus-meti.json, mitra-meti.json, tentang-kredit.json, ringkas.json. */
import "/inti/tautan_org.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { t, tanggal, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

const muat = (n) => fetch(`/data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); });
const IKT = { surya: "tek-surya", bayu: "tek-listrik", hidro: "tek-listrik", "panas-bumi": "tek-panas", bioenergi: "tek-bio" };
const FOTO = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi"], FILE = { surya: "solar", bayu: "bayu", hidro: "hidro", "panas-bumi": "panas-bumi", bioenergi: "bioenergi" };
const MI = "https://metiires.or.id";
const KONTAK = [["jm.kaki.surel", "meti.ires@gmail.com", "berita"], ["jm.kaki.situs", "www.meti.or.id", "tautan"], ["jm.kaki.kantor", "Taman Sari Parama Lt. 10, Jl. K.H. Wahid Hasyim No. 84-86, Kebon Sirih, Menteng, Jakarta Pusat 10340", "wilayah"], ["jm.kaki.rumah", "Jl. Jatinegara Barat IV No. 3A, Balimester, Jatinegara, Jakarta Timur 13310", "wilayah"]];
/* ponytail: logo lebar (wordmark) diganti lambang kecil + label; ganti lewat data bila daftar bertambah */
const LAMBANG = { "Ditjen EBTKE ESDM": ["/img/logo/ebtke.png", "Ditjen EBTKE"], "Kementerian ESDM": ["/img/logo/esdm.png", "Kementerian ESDM"] };
const LOGO_ASOS = { AESI: "/img/logo/aesi.png", APROBI: "/img/logo/aprobi.png", API: "/img/logo/api-inaga.png", APAMSI: "/img/logo/apamsi.png" };

const sorot = (s, tag) => esc(s).replace(/\*(.+?)\*/g, `<${tag}>$1</${tag}>`);
const inisial = (n) => String(n).replace(/[^\p{L} ]/gu, "").split(/\s+/).filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const avatar = (o, besar) => o.foto ? `<img class="tn-av${besar ? " besar" : ""}" src="${esc(o.foto)}" alt="" width="${besar ? 96 : 48}" height="${besar ? 96 : 48}" loading="lazy">` : `<span class="tn-av tn-ini${besar ? " besar" : ""}" aria-hidden="true">${esc(inisial(o.nama))}</span>`;
const PERS = new Map();
const slug = (n) => String(n).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const orang = (o, besar) => { const k = o.orang_id || slug(o.nama); PERS.set(k, o); return `<li class="tn-org${besar ? " besar" : ""}"><button type="button" class="tn-org-b" data-p="${esc(k)}" aria-label="${esc(t("tn.p.buka", { nama: o.nama }))}">${avatar(o, besar)}<span><b>${esc(o.nama)}</b><small>${esc(o.jabatan)}</small></span></button></li>`; };
const lowong = (jabatan) => `<li class="tn-org"><span class="tn-av tn-kosong" aria-hidden="true">${ikon("orang", 22)}</span><span><b>${esc(t("tn.lowong"))}</b><small>${esc(jabatan)}</small></span></li>`;
/* kartu unit: pemimpin tampil, sisanya terlipat */
const kartu = (judul, a, ekstra = "") => {
  const [ketua, ...sisa] = a;
  return `<section class="tn-kartu${ekstra}"><h4>${esc(judul)}</h4><ul class="tn-daftar">${ketua ? orang(ketua) : ""}</ul>${sisa.length ? `<details class="tn-unit"><summary><span>${esc(t("tn.anggota_plus", { n: sisa.length }))}</span></summary><ul class="tn-daftar">${sisa.map((o) => orang(o)).join("")}</ul></details>` : ""}</section>`;
};

const tbl = (x, dup) => {
  const l = LAMBANG[x.nama], src = l ? l[0] : x.logo, lebar = !l && x.w / x.h > 3.2;
  return `<li${dup ? ' aria-hidden="true"' : ""}><a class="tn-logo"${dup ? ' tabindex="-1"' : ""} data-org-nama="${esc(x.nama)}" href="/direktori?cari=${encodeURIComponent(x.nama)}" title="${esc(x.nama)}"><img src="${esc(src)}" alt="${esc(x.nama)}" loading="lazy">${l || lebar ? `<span>${esc(l ? l[1] : x.nama)}</span>` : ""}</a></li>`;
};
const tblAsos = (a, dup) => `<li${dup ? ' aria-hidden="true"' : ""}><a class="tn-logo"${dup ? ' tabindex="-1"' : ""} href="/direktori?cari=${encodeURIComponent(a)}" title="${esc(a)}">${LOGO_ASOS[a] ? `<img src="${LOGO_ASOS[a]}" alt="${esc(a)}" loading="lazy">` : `<b class="tn-mono">${esc(a)}</b>`}</a></li>`;

/* ponytail: marquee CSS murni; daftar pendek diulang sampai >= 10 butir lalu digandakan untuk putaran mulus */
const jalur = (a, fn, balik) => { const r = Math.ceil(10 / a.length), basis = Array.from({ length: r }, (_, k) => a.map((x) => fn(x, k > 0))).flat(); return `<div class="tn-pita"><ul class="tn-trek${balik ? " balik" : ""}">${basis.join("")}${a.length ? Array.from({ length: r }, () => a.map((x) => fn(x, true))).flat().join("") : ""}</ul></div>`; };
const lead = (s) => esc(s).replace(/\*(.+?)\*/g, '<span class="sorot">$1</span>');
const bandL = (id, foto, pos, h2, l) => `<div class="tn-band"><img class="tn-bg" src="${foto}" alt="" width="1600" height="900" loading="lazy" data-pos="${pos}"><div class="wrap"><header class="kepala"><h2 class="h2" id="${id}">${sorot(h2, "em")}</h2>${l ? `<p class="lead">${lead(l)}</p>` : ""}</header></div></div>`;

function hero(f) {
  const kol = FOTO.map((k, i) => `<a class="tn-kol${i === 0 ? " aktif" : ""}" href="/proyek?teknologi=${k}" aria-label="${esc(t("tn.foto.buka", { nama: t("tn.foto." + k) }))}"><img src="/img/tentang/${FILE[k]}.webp" alt="" width="1600" height="900" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}><span class="tn-kol-isi">${ikon(IKT[k], 18)}${esc(t("tn.foto." + k))}</span></a>`).join("");
  const st = [["kalender", 1999, t("tn.stat.berdiri")], ["orang", f.pengurus, t("tn.stat.pengurus")], ["tautan", f.mitra, t("tn.stat.mitra")], ["proyek", f.proyek, t("tn.stat.proyek")]];
  return `<section class="tn-hero" aria-labelledby="tn-judul"><div class="tn-kolom">${kol}</div><div class="wrap tn-hero-isi"><h1 id="tn-judul">${esc(t("tn.judul"))}</h1><p class="tn-misi">${esc(t("tn.lead"))}</p>
    <div class="aksi"><a class="tn-tbl tn-tbl-putih" href="/direktori">${esc(t("tn.cta_direktori"))}</a><a class="tn-tbl tn-tbl-garis" href="${MI}/membership" target="_blank" rel="noopener noreferrer">${esc(t("tn.cta_gabung"))}</a></div>
    <dl class="tn-angka" aria-label="${esc(t("tn.hero.aria"))}">${st.map(([ik, n, l]) => `<div>${ikon(ik, 22)}<dd>${esc(n === 1999 ? "1999" : angka(Number(n)))}</dd><dt>${esc(l)}</dt></div>`).join("")}</dl></div></section>`;
}

const pita = (m) => `<section class="tn-kredit" aria-label="${esc(t("tn.mitra.kerja"))}"><div class="wrap"><p>${esc(t("tn.mitra.kerja"))}</p></div>${jalur(m.mitra, tbl)}</section>`;

function mengapa(f) {
  const st = [["kalender", "1999", t("tn.stat.berdiri")], ["tautan", angka(f.anggota), t("tn.stat.anggota")], ["orang", angka(f.pengurus), t("tn.stat.pengurus")]];
  return `<section class="seksi kertas" aria-labelledby="tn-mengapa">${bandL("tn-mengapa", "/img/tentang/hidro.webp", "50% 50%", t("tn.mengapa.h2"), t("tn.mengapa.lead"))}
  <div class="wrap tn-dua"><article class="kartu tn-fitur"><header><img src="/img/logo-meti-tanda.png" alt="" width="48" height="48"><h3>${esc(t("tn.meti.judul"))}</h3></header><p>${esc(t("tn.meti.lead"))}</p>
    <dl class="tn-mini">${st.map(([ik, n, l]) => `<div>${ikon(ik, 20)}<dd>${esc(n)}</dd><dt>${esc(l)}</dt></div>`).join("")}</dl><a class="tn-lanjut tn-bawah" href="#tim">${esc(t("tn.meti.link"))}</a></article>
  <article class="kartu tn-fitur"><header><span class="tn-bulat">${ikon("direktori", 24)}</span><h3>${esc(t("tn.dir.judul"))}</h3></header>
    <ul class="tn-cek">${[1, 2, 3, 4].map((n) => `<li>${ikon("centang", 18)}<span>${esc(t("tn.dir.b" + n))}</span></li>`).join("")}</ul><a class="tn-lanjut tn-bawah" href="/metode">${esc(t("tn.dir.link"))}</a></article></div></section>`;
}

function struktur(p) {
  const U = p.unit, d = U.dewan || [], iPakar = d.findIndex((o) => /Ketua Dewan Pakar/.test(o.jabatan));
  const pengawas = iPakar < 0 ? d : d.slice(0, iPakar), pakar = iPakar < 0 ? [] : d.slice(iPakar);
  const bidang = p.bidang.filter((b) => b.nama).map((b) => [b.nama, b.anggota]).concat([[t("tn.u.institute"), U.institute], [t("tn.u.komite"), U.komite], [t("tn.u.staf"), U.staf]].filter((x) => x[1]));
  const kb = ([nama, a]) => `<section class="tn-kartu tn-bid"><h4>${esc(nama)}</h4><ul class="tn-daftar">${orang(a[0])}</ul><details class="tn-unit"><summary><span>${esc(t("tn.orang", { n: a.length }))}</span></summary><ul class="tn-daftar">${a.slice(1).map((o) => orang(o)).join("")}</ul></details></section>`;
  const ket = (U.ketum || [])[0];
  return `<section class="seksi putih" id="tim" aria-labelledby="tn-struktur">${bandL("tn-struktur", "/img/tentang/solar.webp", "50% 40%", t("tn.struktur.h2"), t("tn.struktur.pengantar", { periode: p.periode }))}
  <div class="wrap tn-bagan"><div class="tn-pohon"><div class="tn-r tn-r0 tn-turun">
    <section class="tn-kartu"><h4>${esc(t("tn.u.penasihat"))}</h4><ul class="tn-daftar">${lowong(t("tn.u.penasihat_ketua"))}</ul></section>${kartu(t("tn.u.pengawas"), pengawas)}${kartu(t("tn.u.pakar"), pakar)}</div>
    <div class="tn-konek" aria-hidden="true"></div>
    ${ket ? `<div class="tn-r tn-r1"><section class="tn-kartu tn-ketum"><h4>${esc(t("tn.u.ketum"))}</h4><ul class="tn-daftar">${orang(ket, true)}</ul></section></div>` : ""}
    <div class="tn-konek" aria-hidden="true"></div>
    <div class="tn-r tn-r2 tn-cabang">${[["waketum", "tn.u.waketum"], ["sekjen", "tn.u.sekjen"], ["bendahara", "tn.u.bendahara"], ["eksekutif", "tn.u.eksekutif"]].filter(([k]) => U[k]).map(([k, j]) => kartu(t(j), U[k])).join("")}</div></div>
    <h3 class="tn-sub">${esc(t("tn.u.bidang"))}</h3><div class="tn-bidang">${bidang.map(kb).join("")}<section class="tn-kartu tn-bid"><h4>${esc(t("tn.u.wilayah"))}</h4><p>${esc(t("tn.u.wilayah_isi"))}</p></section><section class="tn-kartu tn-bid"><h4>${esc(t("tn.u.muda"))}</h4><p>${esc(t("tn.u.muda_isi"))}</p></section></div>
    <p class="tn-kecil">${esc(t("tn.struktur.sumber", { tanggal: tanggal(p.diambil) }))} <a href="${esc(p.sumber)}" target="_blank" rel="noopener noreferrer">metiires.or.id</a></p></div></section>`;
}

function mitra(m) {
  const grup = (kunci, a, fn, balik) => `<h3 class="tn-sub tn-tengah">${esc(t(kunci))}</h3>${jalur(a, fn, balik)}`;
  return `<section class="seksi kertas" id="mitra" aria-labelledby="tn-mitra">${bandL("tn-mitra", "/img/tentang/panas-bumi.webp", "50% 50%", t("tn.mitra.h2"), t("tn.mitra.pengantar", { tanggal: tanggal(m.diambil) }))}
  <div class="wrap">${grup("tn.mitra.kerja", m.mitra, tbl)}${grup("tn.mitra.anggota", m.anggota, tbl, true)}${grup("tn.mitra.asosiasi", m.asosiasi, tblAsos)}<p class="tn-tengah tn-pangkal"><a class="tn-lanjut" href="${esc(m.sumber)}" target="_blank" rel="noopener noreferrer">${esc(t("tn.mitra.lengkap"))}</a></p></div></section>`;
}

function metode() {
  const ik = ["direktori", "jejak", "ubah"];
  return `<section class="seksi putih" id="metode" aria-labelledby="tn-met">${bandL("tn-met", "/img/tentang/bayu.webp", "50% 50%", t("tn.met.h2"), t("tn.met.lead"))}
  <div class="wrap"><ol class="tn-pilar">${[1, 2, 3].map((n, i) => `<li><span class="tn-no">${ikon(ik[i], 22)}</span><h3>${esc(t("tn.met." + n))}</h3></li>`).join("")}</ol><p class="tn-kanan"><a class="tn-lanjut" href="/metode">${esc(t("tn.met.lihat"))}</a></p></div></section>`;
}

function kontak() {
  return `<section class="seksi gelap tn-foto" id="kontak" aria-labelledby="tn-kontak"><img class="tn-bg" src="/img/tentang/bioenergi.webp" alt="" width="1600" height="900" loading="lazy"><div class="wrap tn-kontak"><div><span class="eyebrow">${esc(t("tn.kontak.judul"))}</span><h2 id="tn-kontak">${esc(t("tn.kontak.h2"))}</h2><p>${esc(t("tn.kontak.isi"))}</p></div>
  <ul class="tn-kk">${KONTAK.map(([k, v, ik]) => `<li>${ikon(ik, 22)}<span><small>${esc(t(k))}</small><b>${esc(v)}</b></span><button type="button" class="tn-salin" data-salin="${esc(v)}">${esc(t("tn.salin"))}</button></li>`).join("")}</ul></div></section>`;
}

function faq(k) {
  return `<section class="seksi kertas" id="faq" aria-labelledby="tn-faq">${bandL("tn-faq", "/img/tentang/hidro.webp", "50% 70%", t("tn.faq.h2"), "")}
  <div class="wrap"><div class="faq">${[1, 2, 3, 4, 5, 6].map((n) => `<details name="faq"><summary>${esc(t("tn.faq.q" + n))}</summary><div class="isi"><p>${esc(t("tn.faq.a" + n))}</p></div></details>`).join("")}</div>
  <details class="tn-kr"><summary>${esc(t("tn.kredit.judul_n", { judul: t("tn.kredit.judul"), n: k.length }))}</summary><p>${esc(t("tn.kredit.pengantar"))}</p><ul>${k.map((x) => `<li><a href="${esc(x.sumber)}" target="_blank" rel="noopener noreferrer"><img src="/img/tentang/${esc(x.kunci)}.webp" alt="" width="64" height="40" loading="lazy"><span>${esc(x.judul)}<small>${esc(x.pencipta)}</small></span><em>${esc(x.lisensi)}</em></a></li>`).join("")}</ul></details></div></section>`;
}

await mulaiHalaman();
const isi = document.getElementById("isi");
try {
  const [p, m, k, r] = await Promise.all([muat("pengurus-meti"), muat("mitra-meti"), muat("tentang-kredit"), muat("ringkas")]);
  const nama = new Set([...Object.values(p.unit).flat(), ...p.bidang.flatMap((b) => b.anggota)].map((o) => o.nama));
  isi.innerHTML = hero({ pengurus: nama.size, mitra: m.asosiasi.length, proyek: r.hitung.proyek }) + pita(m) + mengapa({ pengurus: nama.size, anggota: m.anggota.length }) + struktur(p) + mitra(m) + metode() + kontak() + faq(k);
} catch (e) {
  isi.innerHTML = `<p class="wrap tn-galat jm-galat" role="alert">${esc(t("tn.galat"))}</p>`;
}
/* CSP tanpa inline: posisi foto lewat DOM */
isi.querySelectorAll("[data-pos]").forEach((el) => { el.style.objectPosition = el.dataset.pos; });
isi.addEventListener("click", (e) => {
  const b = e.target.closest("[data-salin]");
  if (!b || !navigator.clipboard) return;
  navigator.clipboard.writeText(b.dataset.salin).then(() => { b.textContent = t("tn.tersalin"); setTimeout(() => { b.textContent = t("tn.salin"); }, 1500); }, () => {});
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
