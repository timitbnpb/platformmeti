/* /program (indeks kartu) dan /program/<kode> (analisis satu program). Data = potret statis /data/program_analisis.json
   (scripts/pipa/program_analisis.mjs); /program#psn memuat bagian PSN energi dari psn.js. Teks data dwibahasa {id, en}; teks layar dari kamus. Bagian tanpa isi tidak dirender.
   INP: chrome filter (cari, tahap) berubah seketika, kartu menyusul lewat nanti(); peta dan tabel panjang dibuat sesudah bingkai tercat. */
import { mulaiHalaman } from "/inti/kepala.js";
import { pasangProdukTerkait } from "/inti/produk_meti.js";
import { t, ada, angka, tanggal, bahasa, bahasaData } from "/i18n.js";
import { navLokal, pasangLokal } from "/inti/paginasi.js";
import { esc, nanti, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { exHtml, sumberHtml, pilihHtml, cariHtml, hapusHtml, hitungHtml, unduhRegHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { ubinHtml, tampilGalat, saatBahasa } from "/analisis.js";
import { ikonTek, ikonStatus, pilStatus, pilTek } from "/inti/ikon_tek.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { muat, urlAman, kelasStatus, norm } from "/publik.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { kartuProgram, fotoProgram, pilTahap, teratas, berat, angkaTampil } from "/program_kartu.js";
import { geserPanel } from "/inti/panel_geser.js";

const $ = (id) => document.getElementById(id);
const TAHAP = ["rencana", "lelang", "konstruksi", "berjalan"];
const ST_IK = { rencana: "rencana", lelang: "izin", konstruksi: "konstruksi", berjalan: "beroperasi" };
const KELOMPOK = ["regulator", "pelaksana", "pengembang", "pendana", "pemda", "masyarakat"];
const IK_KEL = { regulator: "regulasi", pelaksana: "proyek", pengembang: "rantai", pendana: "kartu", pemda: "wilayah", masyarakat: "orang" };
const IK_ISU = { regulasi: "regulasi", lahan: "peta", pendanaan: "kartu", teknis: "analisis", sosial: "orang", tarif: "tabel" };
const BOBOT = { tinggi: 0, sedang: 1, rendah: 2 };
const WARNA_ST = { rencana: "--info", izin: "--data5", pendanaan: "--data1", konstruksi: "--warn", beroperasi: "--ok", dibatalkan: "--bad", "tidak-diketahui": "--ink2" };
const BATAS_PROYEK = 20;
const segmen = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
const HARI_INI = new Date().toISOString().slice(0, 10);
let D, PSN = null;
let peta = null, popup = null;

/* ---------- pembantu ---------- */

const L = (x) => (x && (x[bahasaData()] ?? x.id)) || "";
const num = (n, d = 0) => angka(n, { desimal: d });
const kecil = (svg) => svg.replace('class="jm-ikt"', 'class="jm-ikt jm-ikt-s"');
function tglTampil(s) {
  s = String(s || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return tanggal(s);
  if (/^\d{4}-\d{2}$/.test(s)) return new Intl.DateTimeFormat(bahasa(), { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(s + "-01T00:00:00Z"));
  return s;
}
const host = (u) => { try { return new URL(u).hostname.replace(/^(www|m|en|id|industri|insight|nasional|kabar24|ekonomi|finance|lestari)\./, ""); } catch (e) { return ""; } };
const sumberIkon = (u, tgl, bukti) => {
  const url = urlAman(u);
  return url ? sumberHtml(`${esc(host(url))}, ${esc(tglTampil(tgl))}, ${esc(t("pg.bukti." + bukti))} <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t("pg.sumber.buka"))}</a>`, t("pg.sumber")) : "";
};
const pilSev = (k) => `<span class="jm-pg-sev jm-pg-sev-${k}">${ikon(k === "tinggi" ? "peringatan" : "info", 14)}<span>${esc(t("pg.tingkat." + k))}</span></span>`;
const pilJenis = (k) => `<span class="jm-pg-jenis">${ikon(IK_ISU[k], 14)}<span>${esc(t("pg.isu." + k))}</span></span>`;
const kelasTgl = (s) => { const n = String(s).length === 4 ? s + "-12-31" : String(s).length === 7 ? s + "-28" : String(s); return n > HARI_INI ? "depan" : "lalu"; };
const tabel = (kunci, baris, kelas = "") => `<div class="jm-gulir"><table class="jm-tabel${kelas}"><thead><tr>${kunci.map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${baris}</tbody></table></div>`;
const sel = (k, v, kelas = "") => `<td data-label="${esc(t(k))}"${kelas ? ` class="${kelas}"` : ""}>${v}</td>`;
const bagian = (id, ik, kunci, { judulHtml, sub, isiHtml, csv = false }) =>
  isiHtml ? exHtml({ id, ikon: ik, topik: t(`pg.s.${kunci}.ey`), judulHtml, subHtml: sub || "", aksiHtml: aksiHtml({ csv }), isiHtml }) : "";
const kapTeks = (r) => (r.kap == null ? "-" : `${num(r.kap, r.kap % 1 ? 1 : 0)} ${esc(r.sat || "MW")}`);

/* ---------- indeks ---------- */

function gambarIndeks() {
  document.title = t("pg.title");
  $("pgFoto").hidden = true;
  $("pgStatus").hidden = true;
  const semua = [...D.baris].sort((a, z) => a.urut - z.urut);
  const idProyek = new Set(semua.flatMap((g) => g.proyek.map((p) => p.id)));
  const nBerat = semua.reduce((s, g) => s + berat(g), 0);
  $("judul").textContent = t("pg.judul");
  $("jawab").textContent = t("pg.lead");
  $("ubin").innerHTML = ubinHtml([
    { ikon: "proyek", nilai: num(semua.length), satuan: "", label: t("pg.u.program"), href: "#pgDaftar" },
    { ikon: "peta", nilai: num(idProyek.size), satuan: "", label: t("pg.u.proyek"), href: "#pgDaftar" },
    { ikon: "peringatan", nilai: num(nBerat), satuan: "", label: t("pg.u.isu"), href: "#pgDaftar" },
    PSN && { ikon: "bendera", nilai: num(PSN.baris.length), satuan: "", label: t("pg.u.psn"), href: "#psn" },
  ].filter(Boolean));
  $("ubin").style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))"; /* 4 ubin = 2x2, tanpa ubin yatim */
  const cacah = (k) => semua.filter((g) => g.tahap === k).length;
  const saring = `<div class="jm-saring" role="group" aria-label="${esc(t("pg.f.grup"))}">${cariHtml({ id: "pgQ", label: t("pg.cari") })}${pilihHtml({ id: "pgT", ikon: "status", label: t("pg.f.tahap"), opsi: [["", t("pg.f.semua")], ...TAHAP.map((k) => [k, t("pg.tahap." + k), "st:" + ST_IK[k], cacah(k)])] })}${hapusHtml({ id: "pgHapus", label: t("jm.kosong.reset") })}${hitungHtml({ id: "pgHitung", teks: "" })}</div>`;
  $("pgIsi").innerHTML = exHtml({
    id: "pgDaftar", ikon: "proyek", topik: t("pg.s.daftar.ey"), judulHtml: hlHtml("pg.s.daftar.j", num(semua.length), { tinggi: num(nBerat) }), subHtml: esc(t("pg.s.daftar.sub")),
    aksiHtml: aksiHtml({}), isiHtml: `${saring}<div class="jm-pk-grid" id="pgGrid"></div>`,
  }) + `<section class="psn-bagian" id="psn" aria-labelledby="psnJ"><div class="psn-judul"><h2 id="psnJ">${ikon("bendera", 22)}<span>${esc(t("pg.psn.j"))}</span></h2><p>${esc(t("pg.psn.sub"))}</p></div><div id="psnIsi" class="psn-isi">${hantuHtml(4)}</div></section>`;
  if (PSN) {
    /* bagian PSN energi (psn.js) dimuat sesudah kartu program tercat; #psn atau #psn-NNN menggulir ke sini */
    if (location.hash.startsWith("#psn")) $("psn").scrollIntoView();
    nanti(() => import("/psn.js").then(() => { if (location.hash.startsWith("#psn")) $("psn").scrollIntoView(); }).catch(() => { $("psnIsi").innerHTML = galatHtml("jaringan"); $("psnIsi").querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload()); }));
  } else $("psn").remove();
  const q = $("pgQ"), tp = $("pgT"), hapus = $("pgHapus"), hitung = $("pgHitung");
  const isi = () => {
    const kata = norm(q.value.trim());
    const f = semua.filter((g) => (!tp.value || g.tahap === tp.value) && (!kata || norm(`${L(g.nama)} ${L(g.ringkasan)}`).includes(kata)));
    $("pgGrid").innerHTML = f.length ? f.map(kartuProgram).join("") : `<p class="jm-pg-kosong">${esc(t("jm.kosong.cocok"))}</p>`;
    hitung.textContent = t("pg.hasil", { n: num(f.length) });
  };
  const ubah = () => { hapus.hidden = !q.value && !tp.value; nanti(isi); };
  q.addEventListener("input", ubah);
  tp.addEventListener("change", ubah);
  hapus.addEventListener("click", () => { q.value = ""; tp.value = ""; tp.dispatchEvent(new Event("change", { bubbles: true })); });
  isi();
}

/* ---------- detail ---------- */

function kepalaDetail(g) {
  const nama = L(g.nama);
  document.title = t("pg.title.det", { nama });
  $("judul").textContent = nama;
  $("jawab").textContent = L(g.ringkasan);
  const foto = $("pgFoto");
  if (g.gambar) {
    foto.innerHTML = `<img src="/img/beranda/${esc(g.gambar)}.webp" width="800" height="600" alt="" loading="eager" decoding="async">`;
    foto.hidden = false;
  } else foto.hidden = true;
  const st = $("pgStatus");
  st.hidden = false;
  st.innerHTML = `<a class="jm-pg-balik" href="/program">${ikon("panah-kiri", 16)}<span>${esc(t("pg.balik"))}</span></a>${pilTahap(g.tahap)}`;
  const tg = g.target[0], pr = g.proyek_ringkas;
  const kand = [
    tg && { ikon: "analisis", nilai: angkaTampil(tg.angka), satuan: L(tg.satuan), label: `${L(tg.label)}${tg.tahun ? ", " + tg.tahun : ""}`, href: "#pg-posisi" },
    { ikon: "proyek", nilai: pr.jumlah ? num(pr.jumlah) : "-", satuan: pr.kapasitas_mw ? `${num(pr.kapasitas_mw)} MW` : "", label: t("pg.u.proyek"), href: pr.jumlah ? "#pg-proyek" : "#pg-pihak" },
    { ikon: "peringatan", nilai: berat(g) ? num(berat(g)) : num(g.isu.length), satuan: "", label: t(berat(g) ? "pg.u.isu" : "pg.u.isu_semua"), href: "#pg-isu" },
  ].filter(Boolean);
  $("ubin").innerHTML = ubinHtml(kand);
}

function sTonggak(g) {
  if (!g.tonggak.length) return "";
  /* penanda "kini" = peristiwa terakhir yang sudah lewat */
  const lalu = g.tonggak.filter((x) => kelasTgl(x.tgl) === "lalu");
  const kini = lalu.length ? lalu[lalu.length - 1] : null;
  const li = g.tonggak.map((x) => `<li class="jm-pg-tl-${x === kini ? "kini" : kelasTgl(x.tgl)}"><span class="jm-pg-tl-t" aria-hidden="true"></span><time>${esc(tglTampil(x.tgl))}</time>${x.perkiraan ? `<span class="jm-pil">${esc(t("pg.perkiraan"))}</span>` : ""}<p>${esc(L(x.peristiwa))}</p>${sumberIkon(x.url, x.tgl, x.bukti)}</li>`).join("");
  return bagian("pg-tonggak", "linimasa", "tonggak", {
    judulHtml: hlHtml("pg.s.tonggak.j", num(g.tonggak.length), { terbit: tglTampil((kini || g.tonggak[0]).tgl) }), sub: esc(t("pg.s.tonggak.sub")),
    isiHtml: `<ol class="jm-pg-tl">${li}</ol>`,
  });
}

function sPosisi(g) {
  const idx = TAHAP.indexOf(g.tahap);
  const tiles = TAHAP.map((k, i) => {
    const ket = i < idx ? "sudah" : i === idx ? "kini" : "belum";
    return `<li class="jm-pg-th-${ket}"${ket === "kini" ? ' aria-current="step"' : ""}>${ikonStatus(ST_IK[k])}<b>${esc(t("pg.tahap." + k))}</b><small>${esc(t("pg.tahap." + ket))}</small></li>`;
  }).join("");
  const tgt = g.target.length ? `<h3 class="jm-pg-sub">${esc(t("pg.sub.target"))}</h3>` + tabel(["pg.c.target", "pg.c.nilai", "pg.c.tahun", "pg.c.sumber"], g.target.map((x) =>
    `<tr>${sel("pg.c.target", esc(L(x.label)))}${sel("pg.c.nilai", `<b>${esc(angkaTampil(x.angka))}</b> ${esc(L(x.satuan))}`, "jm-tengah")}${sel("pg.c.tahun", esc(x.tahun ?? "-"), "jm-tengah")}${sel("pg.c.sumber", sumberIkon(x.url, x.tgl, x.bukti) || "-", "jm-tengah")}</tr>`).join("")) : "";
  const real = g.realisasi.length ? `<h3 class="jm-pg-sub">${esc(t("pg.sub.realisasi"))}</h3>` + tabel(["pg.c.indikator", "pg.c.nilai", "pg.c.per", "pg.c.sumber"], g.realisasi.map((x) =>
    `<tr>${sel("pg.c.indikator", esc(L(x.label)))}${sel("pg.c.nilai", `<b>${esc(L(x.nilai))}</b>`, "jm-tengah")}${sel("pg.c.per", esc(tglTampil(x.per)), "jm-tengah")}${sel("pg.c.sumber", sumberIkon(x.url, x.per, x.bukti) || "-", "jm-tengah")}</tr>`).join("")) : `<p class="jm-pg-kosong">${esc(t("pg.realisasi.kosong"))}</p>`;
  return bagian("pg-posisi", "status", "posisi", {
    judulHtml: hlHtml("pg.s.posisi.j", t("pg.tahap." + g.tahap)), sub: esc(t("pg.s.posisi.sub")),
    isiHtml: `<ol class="jm-pg-th" aria-label="${esc(t("pg.s.posisi.ey"))}">${tiles}</ol><p class="jm-pg-ket">${esc(L(g.tahap_ket))}</p>${tgt}${real}`, csv: true,
  });
}

function sPeta(g) {
  const pts = g.proyek.filter((p) => p.lat != null && p.lng != null);
  if (!pts.length) return "";
  return `<section class="jm-pg-penuh" id="pg-peta" aria-label="${esc(t("pg.s.peta.ey"))}"><div class="jm-pg-area">
    <div id="pgKanvas" class="jm-pg-kanvas" role="application" aria-label="${esc(t("pg.s.peta.ey"))}"></div>
    <div class="jm-pg-peta-hd"><div class="jm-ex-teks"><span class="jm-ex-ey">${ikon("peta", 14)}${esc(t("pg.s.peta.ey"))}</span><h2 class="jm-ex-j">${hlHtml("pg.s.peta.j", num(pts.length))}</h2></div>${aksiHtml({ png: false, pdf: false })}</div>
    <details class="jm-pg-lapis" id="pgLapis" open><summary>${esc(t("pg.peta.legenda"))}</summary><div id="pgLegenda"></div></details>
    <details class="jm-pg-panel" id="pgDrawer"><summary>${esc(t("pg.peta.panel"))}</summary><div id="pgPanel" class="jm-pg-panel-isi"></div></details>
  </div></section>`;
}

function sProyek(g) {
  const pr = g.proyek_ringkas;
  if (!g.proyek.length) return exHtml({ id: "pg-proyek", ikon: "proyek", topik: t("pg.s.proyek.ey"), judulHtml: esc(t("pg.s.proyek.j0")), subHtml: esc(t("pg.s.proyek.sub0")), aksiHtml: aksiHtml({}), isiHtml: `<p class="jm-pg-kosong">${esc(t("pg.proyek.kosong"))}</p>` });
  const urut = [...g.proyek].sort((a, z) => (z.kap ?? -1) - (a.kap ?? -1) || a.nama.localeCompare(z.nama));
  const baris = urut.map((r, i) => `<tr${i >= BATAS_PROYEK ? " hidden" : ""}>${sel("pg.c.nama", `<a href="/p/${esc(r.id)}">${esc(r.nama)}</a>`)}${sel("pg.c.tek", r.tek ? pilTek(r.tek) : "-", "jm-tengah")}${sel("pg.c.prov", esc(r.prov || "-"), "jm-tengah")}${sel("pg.c.kap", kapTeks(r), "jm-tengah")}${sel("pg.c.status", pilStatus(r.st), "jm-tengah")}</tr>`).join("");
  const lebih = navLokal({ total: urut.length, per: BATAS_PROYEK, satuan: "jm.pag.u.proyek" });
  return bagian("pg-proyek", "tabel", "proyek", {
    judulHtml: hlHtml("pg.s.proyek.j", num(pr.jumlah), { mw: num(pr.kapasitas_mw) }), sub: esc(t("pg.s.proyek.sub")),
    isiHtml: tabel(["pg.c.nama", "pg.c.tek", "pg.c.prov", "pg.c.kap", "pg.c.status"], baris) + lebih, csv: true,
  });
}

function sPihak(g) {
  if (!g.pelaksana.length) return "";
  const grup = KELOMPOK.map((k) => [k, g.pelaksana.filter((x) => x.kel === k)]).filter(([, a]) => a.length);
  const baris = (x) => {
    const lg = x.org_id ? logoOrgSatu(x.org_id, x.nama, x.logo) : "";
    const nm = x.org_id ? `<a href="/o/${esc(x.org_id)}">${esc(x.nama)}</a>` : esc(x.nama);
    return `<li><span class="jm-pg-lg">${lg ? `<img src="${esc(lg)}" data-lg="1" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ikon("direktori", 22)}</span><span class="jm-pg-nm"><b>${nm}</b><small>${esc(L(x.peran))}</small>${x.orang_nama ? `<small class="jm-pg-orang">${esc(x.orang_nama)}${x.orang_jabatan ? ", " + esc(x.orang_jabatan) : ""}</small>` : ""}</span></li>`;
  };
  const kartu = grup.map(([k, a]) => `<section class="jm-pg-grup"><h3>${ikon(IK_KEL[k], 18)}<span>${esc(t("pg.kel." + k))}</span><b>${num(a.length)}</b></h3><ul>${a.map(baris).join("")}</ul></section>`).join("");
  return bagian("pg-pihak", "direktori", "pihak", {
    judulHtml: hlHtml("pg.s.pihak.j", num(g.pelaksana.length), { n: num(grup.length) }), sub: esc(t("pg.s.pihak.sub")), isiHtml: `<div class="jm-pg-pihak">${kartu}</div>`,
  });
}

function sIsu(g) {
  if (!g.isu.length) return "";
  const urut = [...g.isu].sort((a, z) => BOBOT[a.tingkat] - BOBOT[z.tingkat]);
  const kartu = urut.map((x) => `<article class="jm-pg-isu jm-pg-isu-${x.tingkat}"><div class="jm-pg-isu-atas">${pilSev(x.tingkat)}${pilJenis(x.jenis)}${sumberIkon(x.url, D.dibangun_pada, x.bukti)}</div><h3>${esc(L(x.judul))}</h3><p>${esc(L(x.uraian))}</p></article>`).join("");
  return bagian("pg-isu", "peringatan", "isu", {
    judulHtml: hlHtml("pg.s.isu.j", num(g.isu.length), { tinggi: num(berat(g)) }), sub: esc(t("pg.s.isu.sub")), isiHtml: `<div class="jm-pg-isu-daftar">${kartu}</div>`,
  });
}

function sDana(g) {
  const isi = (g.pendanaan.length ? `<ul class="jm-pg-dana">${g.pendanaan.map((x) => `<li><b>${esc(L(x.nilai))}</b><span>${esc(L(x.label))}</span>${sumberIkon(x.url, x.tgl, x.bukti)}</li>`).join("")}</ul>` : "")
    + (g.pendanaan_catatan ? `<p class="jm-pg-kosong">${esc(L(g.pendanaan_catatan))}</p>` : g.pendanaan.length ? "" : `<p class="jm-pg-kosong">${esc(t("pg.dana.kosong"))}</p>`);
  return bagian("pg-dana", "kartu", "dana", { judulHtml: esc(t("pg.s.dana.j")), sub: esc(t("pg.s.dana.sub")), isiHtml: isi });
}

function sHukum(g) {
  if (!g.dasar_hukum.length) return "";
  const ada_ = g.dasar_hukum.filter((x) => x.reg_id).length;
  const baris = g.dasar_hukum.map((x) => {
    const nama = x.reg_id ? `<a href="/regulasi?id=${encodeURIComponent(x.reg_id)}">${esc(x.nama)}</a>` : esc(x.nama);
    const stat = x.reg_id ? `<span class="jm-pil ${kelasStatus(x.status)}">${esc(ada("reg.status." + x.status) ? t("reg.status." + x.status) : x.status || "-")}</span>` : `<span class="jm-pil">${esc(t("pg.hukum.tak"))}</span>`;
    return `<tr>${sel("pg.c.regulasi", nama)}${sel("pg.c.tentang", esc(L(x.ket)) + (x.judul ? `<small>${esc(x.judul)}</small>` : ""))}${sel("pg.c.status", stat, "jm-tengah")}${sel("pg.c.unduh", x.reg_id ? unduhRegHtml({ judul: x.judul, url_pdf: x.url_pdf, url_sumber: x.url_sumber }) || "-" : "-", "jm-tengah")}</tr>`;
  }).join("");
  return bagian("pg-hukum", "regulasi", "hukum", {
    judulHtml: hlHtml("pg.s.hukum.j", num(g.dasar_hukum.length), { n: num(ada_) }), sub: esc(t("pg.s.hukum.sub")),
    isiHtml: tabel(["pg.c.regulasi", "pg.c.tentang", "pg.c.status", "pg.c.unduh"], baris), csv: true,
  });
}

function sBerita(g) {
  if (!g.berita.length && !g.siaran_pers.length) return "";
  /* tanpa foto atau foto gagal dimuat: foto program sebagai pengganti (galat_gambar.js, data-ganti) */
  const cad = fotoProgram(g), img = (src) => `<img class="jm-pg-bf" src="${esc(src)}"${cad && src !== cad ? ` data-ganti="${esc(cad)}"` : ""} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  const k1 = g.berita.slice(0, 8).map((b) => {
    const f = b.foto && b.id ? `/api/foto-berita/${encodeURIComponent(b.id)}` : "";
    return `<li><a href="${esc(urlAman(b.url) || "#")}" target="_blank" rel="noopener noreferrer">${f || cad ? img(f || cad) : `<span class="jm-pg-bk">${ikon("berita", 32)}</span>`}<span class="jm-pg-bt">${esc(b.judul)}</span><small>${esc(b.media)}, ${esc(tglTampil(b.terbit))}</small></a></li>`;
  }).join("");
  const k2 = g.siaran_pers.map((s) => `<li><a href="/siaran-pers/${encodeURIComponent(s.id)}">${s.foto || cad ? img(s.foto || cad) : `<span class="jm-pg-bk">${ikon("siaran", 32)}</span>`}<span class="jm-pg-bt">${esc(s.judul)}</span><small>${esc(tglTampil(s.tanggal))}</small></a></li>`).join("");
  return bagian("pg-berita", "berita", "berita", {
    judulHtml: hlHtml("pg.s.berita.j", num(g.berita.length)), sub: esc(t("pg.s.berita.sub")),
    isiHtml: (k1 ? `<ul class="jm-pg-berita">${k1}</ul>` : "") + (k2 ? `<h3 class="jm-pg-sub">${esc(t("pg.sub.siaran"))}</h3><ul class="jm-pg-berita">${k2}</ul>` : ""),
  });
}

function sMeti(g) {
  if (!g.posisi_meti.length) return "";
  const li = g.posisi_meti.map((x) => `<li>${ikon("bintang", 20)}<div><p>${esc(L(x.teks))}</p><small>${esc(x.sumber)}</small></div></li>`).join("");
  return bagian("pg-meti", "bintang", "meti", { judulHtml: hlHtml("pg.s.meti.j", num(g.posisi_meti.length)), sub: esc(t("pg.s.meti.sub")), isiHtml: `<ul class="jm-pg-meti">${li}</ul>` });
}

function sIndikator(g) {
  if (!g.indikator.length) return "";
  const li = g.indikator.map((x) => `<li>${ikon("centang", 20)}<p>${esc(L(x))}</p></li>`).join("");
  return bagian("pg-ind", "insight", "ind", { judulHtml: hlHtml("pg.s.ind.j", num(g.indikator.length)), sub: esc(t("pg.s.ind.sub")), isiHtml: `<ul class="jm-pg-ind">${li}</ul>` });
}

function sLain(g) {
  const li = [...D.baris].sort((a, z) => a.urut - z.urut).map((x) => `<li><a href="/program/${esc(x.kode)}"${x.kode === g.kode ? ' aria-current="page"' : ""}>${ikonTek(x.ikon)}<span>${esc(L(x.nama))}</span></a></li>`).join("");
  return exHtml({ id: "pg-lain", ikon: "proyek", topik: t("pg.s.lain.ey"), judulHtml: esc(t("pg.s.lain.j")), isiHtml: `<ul class="jm-pg-lain">${li}</ul>${g.kode === "nuklir" ? `<p class="jm-bantu"><a href="/nuklir?tab=rencana">${esc(t("nkl.dari_program"))}</a></p>` : ""}${g.kode === "wte" ? `<p class="jm-bantu"><a href="/sampah-energi?tab=kota">${esc(t("swe.ln.program"))}</a></p>` : g.kode === "plts-100gw" ? `<p class="jm-bantu"><a href="/surya?tab=proyek">${esc(t("sur.dari_program"))}</a></p>` : ""}` });
}

function sCara() {
  const li = ["pg.cara.1", "pg.cara.2", "pg.cara.3", "pg.cara.4"].map((k) => `<li>${esc(t(k))}</li>`).join("");
  return exHtml({ id: "pg-cara", ikon: "metode", topik: t("pg.s.cara.ey"), judulHtml: esc(t("pg.s.cara.j", { tanggal: tglTampil(D.dibangun_pada) })), isiHtml: `<ol class="jm-pg-cara">${li}</ol>` });
}

/* ---------- peta ---------- */

const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
/* label tempat di luar Indonesia disembunyikan (sama dengan peta /proyek) */
const INDONESIA = { type: "MultiPolygon", coordinates: [
  [[[94.8, 6.2], [97.8, 5.9], [100.8, 2.6], [102.6, 1.9], [104.5, 0.5], [106, -3], [106, -5], [124.9, -8], [124.9, -11.5], [105, -11.5], [94.5, -6.5], [94.8, 6.2]]],
  [[[108.8, 2.1], [111, 1.2], [114.5, 1.7], [115.8, 3.9], [117.8, 4.3], [119, 1], [119, -4.5], [108, -4.5], [108, 0], [108.8, 2.1]]],
  [[[118.5, 2.5], [125, 5], [128, 4.5], [135, 1], [141, 0], [141, -9.5], [128.5, -9.5], [128.5, -7.3], [125, -7.5], [119, -6], [118.5, 2.5]]],
] };
function rapikan(p) {
  for (const ly of p.getStyle().layers || []) {
    if (ly.type !== "symbol") continue;
    const sl = ly["source-layer"];
    if (/^(poi|housenumber|aerodrome_label|transportation_name|water_name)$/.test(sl) || /shield|road_number/i.test(ly.id)) { p.setLayoutProperty(ly.id, "visibility", "none"); continue; }
    if (sl === "place") {
      p.setLayerZoomRange(ly.id, 6, 24);
      p.setLayoutProperty(ly.id, "text-field", ["coalesce", ["get", "name:id"], ["get", "name:latin"], ["get", "name"]]);
      p.setFilter(ly.id, ly.filter ? ["all", ly.filter, ["within", INDONESIA]] : ["within", INDONESIA]);
    }
  }
}

function popupDom(r) {
  const d = document.createElement("div");
  d.className = "jm-pg-pop";
  d.innerHTML = `<b>${esc(r.nama)}</b><div>${pilStatus(r.st)}</div><span>${esc(r.prov || "-")}, ${kapTeks(r)}</span><a href="/p/${esc(r.id)}">${esc(t("pg.peta.profil"))}</a>`;
  return d;
}
function sorot(r) {
  if (!peta || r.lat == null) return;
  if (popup) popup.remove();
  peta.flyTo({ center: [r.lng, r.lat], zoom: Math.max(peta.getZoom(), 8), duration: 600 });
  popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, focusAfterOpen: false, offset: 14, maxWidth: "300px" }).setLngLat([r.lng, r.lat]).setDOMContent(popupDom(r)).addTo(peta);
}

function bukaPeta(g) {
  const pts = g.proyek.filter((p) => p.lat != null && p.lng != null);
  const el = $("pgKanvas");
  if (!el) return;
  const per = {};
  for (const p of pts) per[p.st] = (per[p.st] || 0) + 1;
  $("pgLegenda").innerHTML = Object.keys(per).sort((a, z) => per[z] - per[a]).map((k) => `<p class="jm-pg-leg jm-st-${k}"><i></i><span>${esc(ada("pj.st." + k) ? t("pj.st." + k) : k)}</span><b>${num(per[k])}</b></p>`).join("");
  $("pgPanel").innerHTML = [...pts].sort((a, z) => (z.kap ?? -1) - (a.kap ?? -1)).slice(0, 60).map((r) => `<button type="button" class="jm-pg-pt" data-id="${esc(r.id)}"><span>${esc(r.nama)}</span><small>${esc(r.prov || "-")}, ${kapTeks(r)}</small></button>`).join("");
  $("pgPanel").addEventListener("click", (e) => { const b = e.target.closest("button[data-id]"); if (b) sorot(pts.find((p) => p.id === b.dataset.id)); });
  if (innerWidth >= 1000) { geserPanel($("pgLapis"), { kunci: "lapis" }); geserPanel($("pgDrawer"), { kunci: "drawer" }); }
  muatMapLibre().then(() => {
    if (!el.isConnected) return;
    const b = new maplibregl.LngLatBounds();
    for (const p of pts) b.extend([p.lng, p.lat]);
    peta = new maplibregl.Map({ container: el, style: gaya(), bounds: b, fitBoundsOptions: { padding: { top: 100, bottom: 48, left: 40, right: 40 }, maxZoom: 9 }, minZoom: 3, maxZoom: 16, dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true } });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => {
      rapikan(peta);
      peta.addSource("pts", { type: "geojson", cluster: true, clusterRadius: 50, clusterMaxZoom: 7, data: { type: "FeatureCollection", features: pts.map((r) => ({ type: "Feature", properties: { id: r.id, warna: warna(WARNA_ST[r.st] || "--ink2") }, geometry: { type: "Point", coordinates: [r.lng, r.lat] } })) } });
      peta.addLayer({ id: "pg-k", type: "circle", source: "pts", filter: ["has", "point_count"], paint: { "circle-color": warna("--accent-isi"), "circle-opacity": 0.85, "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 50, 24], "circle-stroke-color": warna("--paper"), "circle-stroke-width": 2 } });
      peta.addLayer({ id: "pg-kn", type: "symbol", source: "pts", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Regular"], "text-size": 12 }, paint: { "text-color": warna("--on-accent") } });
      peta.addLayer({ id: "pg-t", type: "circle", source: "pts", filter: ["!", ["has", "point_count"]], paint: { "circle-color": ["get", "warna"], "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 9, 8], "circle-stroke-color": warna("--paper"), "circle-stroke-width": 1.5 } });
    });
    peta.on("click", "pg-t", (e) => sorot(pts.find((p) => p.id === e.features[0].properties.id)));
    peta.on("click", "pg-k", (e) => {
      const f = e.features[0];
      peta.getSource("pts").getClusterExpansionZoom(f.properties.cluster_id).then((z) => peta.easeTo({ center: f.geometry.coordinates, zoom: z }));
    });
    for (const l of ["pg-t", "pg-k"]) {
      peta.on("mouseenter", l, () => { peta.getCanvas().style.cursor = "pointer"; });
      peta.on("mouseleave", l, () => { peta.getCanvas().style.cursor = ""; });
    }
    new ResizeObserver(() => peta.resize()).observe(el);
  }).catch(() => { el.textContent = t("pg.peta.galat"); });
}

/* ---------- mulai ---------- */

function gambarDetail(g) {
  if (peta) { peta.remove(); peta = null; }
  popup = null;
  kepalaDetail(g);
  $("pgIsi").innerHTML = [sTonggak(g), sPosisi(g), sPeta(g), sProyek(g), sPihak(g), sIsu(g), sDana(g), sHukum(g), sBerita(g), sMeti(g), sIndikator(g), sLain(g), sCara()].join("");
  nanti(() => bukaPeta(g));
}

await mulaiHalaman();
const isi = $("pgIsi");
isi.innerHTML = hantuHtml(6);
try {
  D = await muat("program_analisis");
  PSN = segmen ? null : await fetch("/data/psn.json", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
} catch (e) { D = null; }
if (!D) { isi.innerHTML = ""; tampilGalat(isi, () => location.reload()); } else {
  const g = segmen ? D.baris.find((x) => x.kode === segmen) : null;
  if (segmen && !g) {
    $("judul").textContent = t("pg.tak_dikenal");
    $("jawab").textContent = t("pg.tak_dikenal.ket");
    isi.innerHTML = `<ul class="jm-pg-lain">${D.baris.map((x) => `<li><a href="/program/${esc(x.kode)}">${ikonTek(x.ikon)}<span>${esc(L(x.nama))}</span></a></li>`).join("")}</ul>`;
  } else {
    const gambar = () => (g ? gambarDetail(g) : gambarIndeks());
    gambar();
    pasangProdukTerkait("pgProduk", g ? { j: "program", k: g.kode } : { halaman: "program" });
    saatBahasa(gambar);
    isi.addEventListener("error", (e) => {
      const im = e.target;
      if (im.tagName === "IMG" && im.dataset.lg) im.replaceWith(Object.assign(document.createElement("span"), { innerHTML: ikon("direktori", 22) }).firstChild);
    }, true);
    pasangLokal(isi, (w) => w.closest(".jm-ex-bd").querySelectorAll("tbody tr"));
  }
}
