/* /saya: dasbor anggota "METI untuk saya" (PLAN-UTAMA G3). Tanpa rute server baru: memakai /api/profil/saya, /api/ikuti (+ /ringkasan, /lihat),
   /api/kerja, /api/konsultasi dan potret /data/*.json. Logika cocok murni ada di /saya_cocok.js (diuji tests/saya.test.mjs).
   INP: klik tab/halaman = chrome urgent sinkron (aria-selected, nomor), isi berat dirender sesudahnya lewat nanti(). */
import { t, tanggal, tanggalDariUnix, angka } from "/i18n.js";
import { api, esc, ikon, nanti } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { exHtml } from "/inti/komponen.js";
import { khSisi } from "/inti/kh.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { logoOrg } from "/inti/logo_org.js";
import { ikonTek, pilTek } from "/inti/ikon_tek.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import * as C from "/saya_cocok.js";

const saya = await mulaiHalaman();
const akar = document.getElementById("isi");
const kepala = document.getElementById("syKepala");
const PER = 6, KUNCI_LIHAT = "jm-sy-terakhir";
const JENIS_IKUTI = ["organisasi", "proyek", "provinsi", "topik", "regulasi"];
const UNTUK = ["pendanaan", "kerja", "acara", "diskusi", "proyek"];
const IK_IKUTI = { organisasi: "gedung", proyek: "proyek", provinsi: "peta", topik: "topik", regulasi: "regulasi" };
const IK_UNTUK = { pendanaan: "kartu", kerja: "koper", acara: "kalender", diskusi: "palu", proyek: "proyek" };
const TAUT_JELAJAH = { organisasi: "/direktori?tampil=lembaga", proyek: "/proyek", provinsi: "/wilayah", topik: "/topik", regulasi: "/regulasi" };
const IK_CEK = { foto: "kamera", jabatan: "koper", organisasi: "gedung", lokasi: "lokasi", bio: "orang", keahlian: "topik", riwayat: "linimasa", tautan: "tautan" };
const NOL = () => null;

const S = { p: {}, ikut: [], r: { item: [], baru: 0 }, kerja: [], kons: [], org: [], skema: [], kal: [], proyek: [], prov: [], topik: [], reg: [],
  tab: { syIkuti: "organisasi", syUntuk: "pendanaan" }, hal: { syBaru: 1, syIkuti: 1, syUntuk: 1 }, aktif: { ikuti: true, ringkasan: true } };
let ORG = new Map(), PROY = new Map(), REG = new Map(), KONS = new Map(), D = {};

const muatJson = (n) => fetch(`/data/${n}.json`).then((r) => (r.ok ? r.json() : null)).catch(NOL);
const aman = (u) => (/^https?:\/\//i.test(u || "") ? esc(u) : "");
const hariIni = () => new Date().toISOString().slice(0, 10);
const hl = (kunci, nilai, param = {}) => esc(t(kunci, { ...param, hl: "\u0001" })).replace("\u0001", `<span class="jm-hl">${esc(nilai)}</span>`);
const kapital = (s) => { const v = String(s ?? ""); return v ? v[0].toUpperCase() + v.slice(1) : v; };
const WARNA = 6;
const warna = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 997; return h % WARNA; };
const pil = (ik, teks, w = "") => `<span class="sy-pil sy-w${w || 0}">${ik ? ikon(ik, 14) : ""}<span>${esc(teks)}</span></span>`;
const pilJenis = (s) => pil("tag", kapital(s), warna(s));
const tgl = (s) => esc(tanggal(s));

/* ---------- nama dan tautan entitas ---------- */
const labelTopik = (id) => (t("reg.topik." + id) !== "reg.topik." + id ? t("reg.topik." + id) : t("pj.tek." + id) !== "pj.tek." + id ? t("pj.tek." + id) : id);
const lead = (ik, img = "", kelas = "") => `<span class="sy-lead ${kelas}">${ikon(ik, 22)}${img ? `<img src="${esc(img)}" alt="" width="44" height="44" loading="lazy" decoding="async" data-galat="hapus">` : ""}</span>`;
function entitas(jenis, ref) {
  if (jenis === "organisasi") { const o = ORG.get(ref); return { nama: o?.nama || ref, href: "/o/" + encodeURIComponent(ref), lead: lead("gedung", o ? logoOrg(o.id, o.nama, o.logo)[0] : "") }; }
  if (jenis === "proyek") { const p = PROY.get(ref); return { nama: p ? namaProyek(p) : ref, href: "/p/" + encodeURIComponent(ref), lead: `<span class="sy-lead">${ikonTek(p?.teknologi)}</span>` }; }
  if (jenis === "provinsi") { const n = D.provNama.get(ref); return { nama: n || ref, href: "/wilayah/" + encodeURIComponent(ref), lead: lead("peta", `/img/provinsi/${encodeURIComponent(ref)}.png`) }; }
  if (jenis === "topik") return { nama: labelTopik(ref), href: "/topik?id=" + encodeURIComponent(ref), lead: `<span class="sy-lead">${ikonTek(C.SEKTOR_TOPIK[ref] || ref)}</span>` };
  if (ref.startsWith("kons:")) { const k = KONS.get(ref.slice(5)); return { nama: k?.judul || ref.slice(5), href: "/regulasi?kd=" + encodeURIComponent(ref.slice(5)) + "#konsultasi", lead: lead("palu") }; }
  const r = REG.get(ref);
  return { nama: r?.judul || ref, href: "/regulasi?id=" + encodeURIComponent(ref), lead: lead("regulasi") };
}
const sebutan = (jenis, ref) => { const e = entitas(jenis, ref); return `<a href="${esc(e.href)}">${esc(e.nama)}</a>`; };

function apa(x) {
  if (x.tipe === "portal") return esc(t("dk.portal." + x.jenis_ajuan));
  if (x.tipe === "koreksi") return esc(t("dk.koreksi", { kolom: t("kor.k." + x.kolom) }));
  if (x.tipe === "topik") return esc(t("dk.topik_baru", { judul: x.judul || x.ref }));
  if (x.tipe === "konsultasi") return esc(t("dk.kons." + x.sub));
  if (x.tipe === "regulasi") return esc(t("dk.regulasi_baru", { judul: x.judul }));
  return `<a href="${aman(x.url) || "#"}" target="_blank" rel="noopener noreferrer">${esc(x.judul)}</a>${x.media ? ` <small>${esc(x.media)}</small>` : ""}`;
}

/* ---------- komponen kecil ---------- */
const kosong = (ik, kunci, href, label, param) => `<div class="sy-kosong"><span class="sy-kosong-ik">${ikon(ik, 28)}</span><p>${esc(t(kunci, param))}</p>${href ? `<a class="jm-tbl" href="${esc(href)}">${ikon("panah-kanan", 16)}<span>${esc(t(label))}</span></a>` : ""}</div>`;
const tabHtml = (id, daftar, aktif, ikonDari, hitung) => `<div class="sy-seg" role="tablist" aria-label="${esc(t("sy2.t.label"))}">${daftar.map((k) => {
  const n = hitung(k);
  return `<button type="button" role="tab" id="${id}-${k}" data-tab="${k}" aria-selected="${k === aktif}"${k === aktif ? "" : ' tabindex="-1"'}>${ikon(ikonDari[k], 16)}<span>${esc(t(`sy2.${id === "syIkuti" ? "j" : "t"}.${k}`))}</span><b class="sy-n">${esc(angka(n))}</b></button>`;
}).join("")}</div>`;
const potong = (a, hal) => a.slice((hal - 1) * PER, hal * PER);
const pag = (a, hal) => paginasiHtml({ hal, total: a.length, per: PER });
const lihatSemua = (href) => `<a class="jm-tbl jm-tbl-kecil" href="${esc(href)}">${ikon("panah-kanan", 16)}<span>${esc(t("sy2.lihat_semua"))}</span></a>`;

/* ---------- seksi: baru sejak kunjungan terakhir ---------- */
function seksiBaru() {
  const baru = S.r.item.slice(0, S.r.baru), hal = S.hal.syBaru;
  const terakhir = (() => { try { return Number(localStorage.getItem(KUNCI_LIHAT)) || 0; } catch { return 0; } })();
  const isi = baru.length
    ? `<ul class="sy-baru">${potong(baru, hal).map((x) => `<li><span class="sy-tgl">${ikon("kalender", 14)}<time>${tgl(tanggalDariUnix(x.waktu))}</time></span><span class="sy-baru-tx"><b>${sebutan(x.jenis, x.ref)}</b><span>${apa(x)}</span></span>${pil(IK_IKUTI[x.jenis] || "tag", t("sy2.j." + x.jenis), warna(x.jenis))}</li>`).join("")}</ul>${pag(baru, hal)}`
    : kosong("lonceng", terakhir ? "sy2.baru.kosong" : "sy2.baru.kosong0", null, null, { tgl: terakhir ? tanggal(tanggalDariUnix(terakhir)) : "" });
  return exHtml({ id: "syBaru", ikon: "lonceng", topik: t("sy2.baru.topik"), judulHtml: hl("sy2.baru.judul", angka(baru.length)), subHtml: esc(t("sy2.baru.sub")), aksiHtml: lihatSemua("/diikuti"), isiHtml: isi });
}

/* ---------- seksi: yang saya ikuti ---------- */
const daftarIkuti = (jenis) => S.ikut.filter((x) => x.jenis === jenis);
function barisIkuti(x, terbaru) {
  const e = entitas(x.jenis, x.ref), u = terbaru.get(x.jenis + "|" + x.ref);
  const meta = x.jenis === "organisasi" ? (ORG.get(x.ref)?.kategori?.label ? pil("gedung", ORG.get(x.ref).kategori.label, warna(ORG.get(x.ref).kategori.kode)) : "")
    : x.jenis === "proyek" ? pilTek(PROY.get(x.ref)?.teknologi) : x.jenis === "topik" ? pilTek(C.SEKTOR_TOPIK[x.ref] || x.ref) : "";
  const ubah = u ? `<span class="sy-ubah">${ikon("linimasa", 14)}<span><b>${apa(u)}</b><small>${tgl(tanggalDariUnix(u.waktu))}</small></span></span>` : `<span class="sy-ubah sy-ubah-0" title="${esc(t("sy2.ubah.tdk"))}">-</span>`;
  return `<li class="sy-ent">${e.lead}<span class="sy-ent-nama"><a href="${esc(e.href)}">${esc(e.nama)}</a><span class="sy-meta">${pil(IK_IKUTI[x.jenis], t("sy2.j." + x.jenis), warna(x.jenis))}${meta}</span></span>${ubah}${tombolIkuti({ jenis: x.jenis, id: x.ref, nama: e.nama })}</li>`;
}
function seksiIkuti() {
  const jenis = S.tab.syIkuti, a = daftarIkuti(jenis), hal = Math.min(S.hal.syIkuti, Math.max(1, Math.ceil(a.length / PER)));
  const terbaru = C.terbaruPerEntitas(S.r.item);
  const isi = tabHtml("syIkuti", JENIS_IKUTI, jenis, IK_IKUTI, (k) => daftarIkuti(k).length)
    + (a.length ? `<ul class="sy-daftar">${potong(a, hal).map((x) => barisIkuti(x, terbaru)).join("")}</ul>${pag(a, hal)}` : kosong(IK_IKUTI[jenis], "sy2.kosong." + jenis, TAUT_JELAJAH[jenis], "sy2.jelajah"));
  return exHtml({ id: "syIkuti", ikon: "bintang", topik: t("sy2.ikuti.topik"), judulHtml: hl("sy2.ikuti.judul", angka(S.ikut.length)), subHtml: esc(t("sy2.ikuti.sub")), isiHtml: isi });
}

/* ---------- seksi: untuk saya ---------- */
const kartu = (kepalaHtml, judul, href, meta, kaki = "") => `<article class="sy-k"><div class="sy-k-atas">${kepalaHtml}</div><h3><${href ? `a href="${esc(href)}"${/^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ""}` : "span"}>${esc(judul)}</${href ? "a" : "span"}></h3>${meta ? `<div class="sy-k-meta">${meta}</div>` : ""}${kaki ? `<div class="sy-k-kaki">${kaki}</div>` : ""}</article>`;
const cocokKaki = (...bagian) => { const b = bagian.filter(Boolean); return b.length ? `<span class="sy-cocok">${ikon("centang", 14)}<b>${esc(t("sy2.cocok"))}</b>${b.join("")}</span>` : ""; };
function kartuUntuk(tab, r) {
  if (tab === "pendanaan") {
    const x = r.x, u = aman(x.url) || aman((x.sumber || [])[0]?.url);
    return kartu(`${lead("kartu", logoOrg(x.lembaga_id, x.pemberi)[0])}${pilJenis(x.jenis || "")}`, x.nama, u, `<small>${esc(x.pemberi || "")}</small>${(x.sasaran || []).slice(0, 3).map((s) => pil("orang", kapital(s), warna(s))).join("")}`,
      cocokKaki(...r.sasaran.map((s) => pil("orang", kapital(s), warna(s))), ...r.sektor.map(pilTek)));
  }
  if (tab === "kerja") {
    const x = r.x, u = aman(x.tautan);
    return kartu(`${lead("koper", logoOrg(x.organisasi_id, x.organisasi_nama)[0])}${pilTek(x.teknologi)}`, x.judul, u, `<small>${esc(x.organisasi_nama || "")}</small>${x.lokasi ? pil("lokasi", x.lokasi, warna(x.lokasi)) : ""}${x.jenjang ? pil("tingkat", kapital(x.jenjang), warna(x.jenjang)) : ""}${x.batas ? pil("jam", t("sy2.tenggat", { tgl: tanggal(x.batas) }), 2) : ""}`,
      cocokKaki(r.tek ? pil("topik", t("sy2.cocok.tek"), 0) : "", r.prov ? pil("lokasi", t("sy2.cocok.prov"), 1) : ""));
  }
  if (tab === "acara") {
    const x = r.x;
    return kartu(`<span class="sy-tglbox">${ikon("kalender", 16)}<b>${tgl(x.tanggal)}</b></span>${pilJenis(x.jenis || "")}`, x.judul, "/kalender#acara-" + encodeURIComponent(x.id), `<small>${esc(x.mitra || "")}</small>`, cocokKaki(r.diikuti ? pil("bintang", t("sy2.cocok.ikuti"), 3) : ""));
  }
  if (tab === "diskusi") {
    const x = r, sisa = x.tenggat ? Math.ceil((Date.parse(String(x.tenggat).slice(0, 10)) - Date.parse(hariIni())) / 86400000) : null;
    return kartu(`${lead("palu")}${sisa == null ? pil("jam", t("sy2.tanpa_tenggat"), 4) : pil("jam", t("sy2.sisa", { n: angka(sisa) }), sisa <= 7 ? 5 : 2)}`, x.judul, "/regulasi?kd=" + encodeURIComponent(x.id) + "#konsultasi",
      `<small>${esc(x.instansi || "")}</small>${pil("teks", t("sy2.komentar", { n: angka(x.n_komentar + x.n_usulan) }), 1)}${pil("orang", t("sy2.peserta", { n: angka(x.n_peserta) }), 0)}`, cocokKaki(x.diikuti ? pil("bintang", t("sy2.cocok.ikuti"), 3) : ""));
  }
  const x = r.x, kap = x.kapasitas?.[0], st = x.status?.[0]?.nilai;
  return kartu(`<span class="sy-lead">${ikonTek(x.teknologi)}</span>${pilTek(x.teknologi)}`, namaProyek(x), "/p/" + encodeURIComponent(x.id), `${x.lokasi?.provinsi ? pil("lokasi", x.lokasi.provinsi, warna(x.lokasi.provinsi)) : ""}${kap?.nilai ? pil("petir", `${angka(kap.nilai)} ${kap.satuan || ""}`.trim(), 2) : ""}${st ? pil("status", kapital(st), warna(st)) : ""}`,
    cocokKaki(r.prov ? pil("lokasi", t("sy2.cocok.provikut"), 1) : "", r.tek ? pil("topik", t("sy2.cocok.tek"), 0) : ""));
}
function seksiUntuk() {
  const tab = S.tab.syUntuk, a = D.untuk[tab], hal = Math.min(S.hal.syUntuk, Math.max(1, Math.ceil(a.length / PER)));
  const jelajah = { pendanaan: "/direktori?tampil=pendanaan", kerja: "/kerja", acara: "/kalender", diskusi: "/regulasi#konsultasi", proyek: "/proyek" }[tab];
  const isi = tabHtml("syUntuk", UNTUK, tab, IK_UNTUK, (k) => D.untuk[k].length)
    + (a.length ? `<div class="sy-kisi">${potong(a, hal).map((r) => kartuUntuk(tab, r)).join("")}</div>${pag(a, hal)}` : kosong(IK_UNTUK[tab], "sy2.k." + tab, tab === "pendanaan" || tab === "kerja" ? "/profil-saya" : jelajah, tab === "pendanaan" || tab === "kerja" ? "sy2.lengkapi" : "sy2.jelajah"));
  return exHtml({ id: "syUntuk", ikon: "mahkota", topik: t("sy2.untuk.topik"), judulHtml: hl("sy2.untuk.judul", angka(a.length), { tab: t("sy2.t." + tab).toLowerCase() }), subHtml: esc(t("sy2.untuk.sub")), aksiHtml: lihatSemua(jelajah), isiHtml: isi });
}

/* ---------- seksi: saran ikuti ---------- */
function seksiSaran() {
  const org = D.saranOrg.map((r) => `<li class="sy-ent">${lead("gedung", logoOrg(r.x.id, r.x.nama, r.x.logo)[0])}<span class="sy-ent-nama"><a href="/o/${encodeURIComponent(r.x.id)}">${esc(r.x.nama)}</a><span class="sy-meta">${r.x.kategori?.label ? pil("gedung", r.x.kategori.label, warna(r.x.kategori.kode)) : ""}${r.bersama.slice(0, 2).map(pilTek).join("")}</span></span>${tombolIkuti({ jenis: "organisasi", id: r.x.id, nama: r.x.nama })}</li>`).join("");
  const tpk = D.saranTopik.map((id) => `<li class="sy-ent"><span class="sy-lead">${ikonTek(C.SEKTOR_TOPIK[id] || id)}</span><span class="sy-ent-nama"><a href="/topik?id=${encodeURIComponent(id)}">${esc(labelTopik(id))}</a><span class="sy-meta">${pilTek(C.SEKTOR_TOPIK[id] || id)}</span></span>${tombolIkuti({ jenis: "topik", id, nama: labelTopik(id) })}</li>`).join("");
  const isi = org || tpk
    ? `<div class="sy-dua">${org ? `<div><h3 class="sy-sub">${ikon("gedung", 18)}<span>${esc(t("sy2.saran.org"))}</span></h3><ul class="sy-daftar">${org}</ul></div>` : ""}${tpk ? `<div><h3 class="sy-sub">${ikon("topik", 18)}<span>${esc(t("sy2.saran.topik"))}</span></h3><ul class="sy-daftar">${tpk}</ul></div>` : ""}</div>`
    : kosong("orang", "sy2.saran.kosong", "/profil-saya", "sy2.lengkapi");
  return exHtml({ id: "sySaran", ikon: "tambah", topik: t("sy2.saran.topik_ey"), judulHtml: hl("sy2.saran.judul", angka(D.saranOrg.length + D.saranTopik.length)), subHtml: esc(t("sy2.saran.sub")), isiHtml: isi });
}

/* ---------- kepala ---------- */
function gambarKepala() {
  const p = S.p, org = ORG.get(p.organisasi_id), cek = C.kelengkapan(p), lengkap = cek.filter((c) => c[1]).length;
  const e = org ? entitas("organisasi", org.id) : null;
  kepala.innerHTML = `<p class="jm-kh-lead">${esc(t("sy2.sapa", { nama: saya.nama || p.nama || "" }))}</p>
    <div class="sy-ident">${pil("perisai", t("peran." + saya.peran), 0)}${org ? `<a class="sy-org" href="${esc(e.href)}">${e.lead}<span>${esc(org.nama)}</span></a>` : `<a class="sy-org sy-org-0" href="/profil-saya">${ikon("gedung", 18)}<span>${esc(t("sy2.org_belum"))}</span></a>`}</div>
    <div class="sy-lk"><p class="sy-lk-angka"><b>${esc(angka(lengkap))}</b><span>${esc(t("sy2.lengkap", { n: angka(lengkap), m: angka(cek.length) }))}</span></p>
    <ul class="sy-cek">${cek.map(([k, ok]) => `<li><a class="sy-cek-b${ok ? " ok" : ""}" href="/profil-saya" title="${esc(t("sy2.lk." + k))}">${ikon(ok ? "centang" : IK_CEK[k], 14)}<span>${esc(t("sy2.lk." + k))}</span></a></li>`).join("")}</ul></div>`;
  khSisi(document.getElementById("syKh"), { ubin: [
    { ikon: "bintang", nilai: angka(S.ikut.length), label: t("sy2.ubin.diikuti") }, { ikon: "lonceng", nilai: angka(S.r.baru), label: t("sy2.ubin.baru") },
    { ikon: "kartu", nilai: angka(D.untuk.pendanaan.length), label: t("sy2.ubin.cocok") }, { ikon: "kalender", nilai: angka(D.untuk.acara.length), label: t("sy2.ubin.acara") }] });
}

/* ---------- turunan data (murni dari state) ---------- */
function hitung() {
  const ikutSet = new Set(S.ikut.map((x) => x.jenis + "|" + x.ref)), per = (j) => S.ikut.filter((x) => x.jenis === j).map((x) => x.ref);
  const org = ORG.get(S.p.organisasi_id), topikIkut = per("topik"), provKode = per("provinsi");
  const sektor = C.sektorPengguna({ org, profil: S.p, topikIkut });
  D.provNama = new Map(S.prov.map((p) => [p.kode, p.nama]));
  const kons = S.kons.map((k) => ({ ...k, n_komentar: k.n_komentar || 0, n_usulan: k.n_usulan || 0, n_peserta: k.n_peserta || 0 }));
  D.untuk = {
    pendanaan: C.cocokSkema(S.skema, { org, profil: S.p, topikIkut }), kerja: C.cocokKerja(S.kerja, { kodeProv: S.p.kode_prov, sektor }),
    acara: C.acaraTerdekat(S.kal, hariIni(), per("organisasi")), diskusi: C.diskusiTerbuka(kons, hariIni()),
    proyek: C.proyekBaru(S.proyek, { provNama: provKode.map((k) => D.provNama.get(k)).filter(Boolean), teknologi: topikIkut.map((i) => C.SEKTOR_TOPIK[i] || i) }),
  };
  D.saranOrg = C.saranOrganisasi(S.org, org, ikutSet);
  D.saranTopik = C.saranTopik(sektor, S.topik.map((x) => x.id), ikutSet);
}

function gambar() {
  hitung();
  gambarKepala();
  akar.innerHTML = seksiBaru() + seksiIkuti() + seksiUntuk() + seksiSaran();
  pasangIkuti(akar);
}
const ulang = (id) => {
  const fn = { syBaru: seksiBaru, syIkuti: seksiIkuti, syUntuk: seksiUntuk }[id], el = document.getElementById(id);
  if (!fn || !el) return;
  el.outerHTML = fn();
  pasangIkuti(document.getElementById(id));
};

async function ambil(jalur) { try { return await api(jalur); } catch { return null; } }
async function muat() {
  const [p, ik, rg, kj, ks, org, sk, kal, pj, wl, tp, reg] = await Promise.all([
    ambil("/api/profil/saya"), ambil("/api/ikuti"), ambil("/api/ikuti/ringkasan"), ambil("/api/kerja"), ambil("/api/konsultasi"),
    muatJson("organisasi"), muatJson("pendanaan"), muatJson("kalender"), muatJson("proyek"), muatJson("meti-wilayah"), muatJson("topik/indeks"), muatJson("regulasi")]);
  S.p = p || {}; S.ikut = ik?.baris || []; S.r = rg || { item: [], baru: 0 }; S.kerja = kj?.baris || []; S.kons = ks?.baris || [];
  S.org = org?.baris || []; S.skema = sk?.pendanaan || []; S.kal = Array.isArray(kal) ? kal : kal?.baris || []; S.proyek = pj?.baris || [];
  S.prov = wl?.provinsi || []; S.topik = tp?.topik || []; S.reg = reg?.baris || [];
  ORG = new Map(S.org.map((o) => [o.id, o])); PROY = new Map(S.proyek.map((x) => [x.id, x])); REG = new Map(S.reg.map((x) => [x.id, x])); KONS = new Map(S.kons.map((k) => [k.id, k]));
  gambar();
}
async function segarkanIkuti() {
  const [ik, rg] = await Promise.all([ambil("/api/ikuti"), ambil("/api/ikuti/ringkasan")]);
  if (ik) S.ikut = ik.baris; if (rg) S.r = rg;
  gambar();
}

akar.addEventListener("click", (e) => {
  const sek = e.target.closest(".jm-ex")?.id;
  const tab = e.target.closest("[data-tab]");
  if (tab && sek) {
    tab.parentElement.querySelectorAll("[data-tab]").forEach((b) => { b.setAttribute("aria-selected", String(b === tab)); b.tabIndex = b === tab ? 0 : -1; });
    S.tab[sek] = tab.dataset.tab; S.hal[sek] = 1;
    nanti(() => ulang(sek));
    return;
  }
  const h = e.target.closest("[data-hal]");
  if (h && sek && !h.disabled) {
    sorotHalaman(h, +h.dataset.hal);
    S.hal[sek] = +h.dataset.hal;
    nanti(() => ulang(sek));
  }
});
akar.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const b = e.target.closest?.("[data-tab]");
  if (!b) return;
  const semua = [...b.parentElement.querySelectorAll("[data-tab]")], i = semua.indexOf(b);
  semua[(i + (e.key === "ArrowRight" ? 1 : -1) + semua.length) % semua.length].focus();
});
document.addEventListener("jm:ikuti", () => nanti(segarkanIkuti));
document.addEventListener("jm:bahasa", () => { if (S.ikut) gambar(); });

await muat();
// Tandai sudah dilihat SESUDAH digambar (jumlah "baru" sudah terbaca); menurunkan lencana menu akun.
try { localStorage.setItem(KUNCI_LIHAT, String(Math.floor(Date.now() / 1000))); } catch { /* tanpa penyimpanan: tetap jalan */ }
if (S.r.baru) api("/api/ikuti/lihat", { metode: "POST", badan: {} }).catch(NOL);
