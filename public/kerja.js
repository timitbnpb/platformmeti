/* /kerja: Green jobs. (1) lowongan dari halaman karir resmi organisasi (potret /data/kerja.json) dan dari anggota (D1, terbit setelah moderasi),
   (2) perkiraan kebutuhan tenaga kerja EST dari pipeline RUPTL x faktor kerja per MW, per teknologi per tahun dan per provinsi, (3) sertifikasi terkait. */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { PROV } from "/inti/prov_singkat.js";
import { logoOrg } from "/inti/logo_org.js";
import { pilTek } from "/inti/ikon_tek.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml, exHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { esc, ikon, api, galatTeks, kosongHtml, hantuHtml, debounce, nanti } from "/inti/umum.js";
import { t, tanggal, angka } from "/i18n.js";
import { sumberLipat, saatBahasa } from "/analisis.js";
import { kolomSvg, batangSvg, legendaHtml, tipHtml } from "/info_hijau.js";
import "/inti/galat_gambar.js";

const $ = (id) => document.getElementById(id);
const HAL = 9;
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"];
const JENJANG = ["magang", "pemula", "menengah", "senior", "pimpinan"];
const S = { q: "", tek: "", prov: "", jenjang: "", hal: 1, metrik: "total", basis: "oecd" };
let D = null, V = null, anggota = [], saya = null, geo = null, ORG = new Map();

const namaProv = (k) => PROV[k]?.[0] || "";
const httpsAman = (u) => { try { return new URL(u).protocol === "https:" ? u : ""; } catch { return ""; } };
const tglUnix = (u) => new Date(u * 1000).toISOString().slice(0, 10);

/* ---------- data lowongan gabungan ---------- */
function semuaLowongan() {
  const situs = (D?.lowongan || []).map((r) => ({ judul: r.judul, org_id: r.organisasi_id, org: r.organisasi, kode: r.provinsi || "", lokasi: r.lokasi, tek: r.teknologi, jenjang: r.jenjang, tanggal: r.tanggal, batas: r.batas, tautan: r.tautan, asal: "situs" }));
  const mem = anggota.map((r) => ({ judul: r.judul, org_id: r.organisasi_id, org: r.organisasi_nama, kode: r.kode_prov || "", lokasi: r.lokasi, tek: r.teknologi, jenjang: r.jenjang, tanggal: tglUnix(r.dibuat), batas: r.batas, tautan: r.tautan, asal: "anggota" }));
  return [...mem, ...situs];
}
const norm = (s) => String(s || "").toLowerCase();
function saring(semua) {
  const q = norm(S.q.trim());
  return semua.filter((r) => (!S.tek || r.tek === S.tek) && (!S.prov || r.kode === S.prov) && (!S.jenjang || r.jenjang === S.jenjang)
    && (!q || norm(`${r.judul} ${r.org} ${r.lokasi}`).includes(q)));
}

/* ---------- kepala ---------- */
function ubin(semua) {
  const a = D.analisis, tahunPuncak = puncak().tahun;
  khUbin("kjAngka", [
    { ikon: "koper", nilai: angka(semua.length), label: t("kj.u.lowongan") },
    { ikon: "gedung", nilai: angka(new Set(semua.map((r) => r.org_id)).size), label: t("kj.u.org") },
    { ikon: "grafik", nilai: angka(puncak().nilai), satuan: t("kj.u.sat"), label: t("kj.u.puncak", { tahun: tahunPuncak }) },
    { ikon: "cari2", nilai: angka(D.periksa?.diperiksa || 0), label: t("kj.u.situs", { n: angka(D.periksa?.dengan_lowongan || 0) }) },
  ]);
  return a;
}

/* ---------- lowongan ---------- */
const logoHtml = (r) => {
  const u = logoOrg(r.org_id, r.org)[0];
  return `<span class="kj-logo">${u ? `<img src="${esc(u)}" width="44" height="44" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}<span class="kj-logo-ik">${ikon("gedung", 22)}</span></span>`;
};
const lokasiHtml = (r) => `<span class="kj-lok">${r.kode ? `<img src="/img/provinsi/${esc(r.kode)}.png" width="18" height="18" alt="" loading="lazy">` : ikon("lokasi", 16)}<span>${esc(r.kode ? namaProv(r.kode) + (r.lokasi ? `, ${r.lokasi}` : "") : r.lokasi || t("kj.lok.nasional"))}</span></span>`;
function kartu(r) {
  const tautan = httpsAman(r.tautan);
  return `<article class="kj-kartu">
    <header>${logoHtml(r)}<div><h3>${esc(r.judul)}</h3><p class="kj-org">${esc(r.org)}</p></div></header>
    <div class="kj-pil">${r.tek ? pilTek(r.tek) : ""}<span class="kj-jj kj-jj-${esc(r.jenjang)}">${ikon("tingkat", 14)}<span>${esc(t("kj.jj." + r.jenjang))}</span></span></div>
    <div class="kj-meta">${lokasiHtml(r)}<span class="kj-tgl">${ikon("kalender", 16)}<span>${esc(r.tanggal ? tanggal(r.tanggal) : t("kj.tgl.kosong"))}</span></span></div>
    <footer>${tautan ? `<a class="jm-tbl jm-tbl-utama" href="${esc(tautan)}" target="_blank" rel="noopener noreferrer nofollow">${ikon("tautan", 16)}<span>${esc(t("kj.buka"))}</span></a>` : ""}<span class="jm-pil ${r.asal === "anggota" ? "jm-pil-ok" : ""}">${esc(t("kj.asal." + r.asal))}</span></footer>
  </article>`;
}
function gambarDaftar() {
  const semua = semuaLowongan(), hasil = saring(semua), jml = Math.max(1, Math.ceil(hasil.length / HAL));
  S.hal = Math.min(S.hal, jml);
  const aktif = S.q || S.tek || S.prov || S.jenjang;
  $("kjHapus").hidden = !aktif;
  $("kjHitung").textContent = t("kj.hitung", { a: angka(hasil.length), b: angka(semua.length) });
  const potong = hasil.slice((S.hal - 1) * HAL, S.hal * HAL);
  $("kjDaftar").innerHTML = potong.length ? `<div class="kj-grid">${potong.map(kartu).join("")}</div>` : kosongHtml(semua.length ? "kj.kosong.saring" : "kj.kosong");
  $("kjHal").innerHTML = paginasiHtml({ hal: S.hal, total: hasil.length, per: HAL, satuan: "kj.pag" });
}
function bagianLowongan() {
  const semua = semuaLowongan();
  const hit = (f) => semua.filter((r) => r[f.k] === f.v).length;
  const tek = TEK.filter((k) => semua.some((r) => r.tek === k)).map((k) => [k, t("pj.tek." + k), "tek:" + k, hit({ k: "tek", v: k })]);
  const prov = [...new Set(semua.map((r) => r.kode).filter(Boolean))].sort((a, b) => namaProv(a).localeCompare(namaProv(b))).map((k) => [k, namaProv(k), "prov:" + k, hit({ k: "kode", v: k })]);
  const jj = JENJANG.filter((k) => semua.some((r) => r.jenjang === k)).map((k) => [k, t("kj.jj." + k), "tingkat", hit({ k: "jenjang", v: k })]);
  const p = (id, ik, semuaKey, daftar) => pilihHtml({ id, ikon: ik, label: t(semuaKey), opsi: [["", t(semuaKey)], ...daftar], nilai: S[id.slice(2).toLowerCase()] });
  const per = D.periksa;
  const catatan = per ? `<p class="jm-bantu kj-catatan">${ikon("info", 16)}<span>${esc(t("kj.catatan", { n: angka(per.diperiksa), k: angka(per.halaman_karir), l: angka(per.dengan_lowongan), tgl: tanggal(per.tanggal) }))}</span></p>` : "";
  return exHtml({
    id: "lowongan", ikon: "koper", topik: t("kj.ey.lowongan"), judulHtml: hlHtml("kj.t.lowongan", angka(semua.length)), subHtml: esc(t("kj.s.lowongan")),
    isiHtml: `<div class="jm-saring" id="kjSaring">${cariHtml({ id: "kjQ", label: t("kj.cari") })}${p("kjTek", "topik", "kj.semua.tek", tek)}${p("kjProv", "wilayah", "kj.semua.prov", prov)}${p("kjJenjang", "tingkat", "kj.semua.jenjang", jj)}${hapusHtml({ id: "kjHapus", label: t("jm.kosong.reset") })}</div>
      <div class="kj-alat">${hitungHtml({ id: "kjHitung", teks: "" })}</div><div id="kjDaftar"></div><div class="jm-hal" id="kjHal"></div>${catatan}`,
  });
}

/* ---------- analisis kebutuhan tenaga kerja (EST) ---------- */
const peng = () => (S.basis === "asia" ? D.faktor.pengali_asia : 1);
const nilai = (c) => (S.metrik === "konstruksi" ? c.konstruksi : S.metrik === "om" ? c.om : c.konstruksi + c.om) * peng();
const teknNilai = (tek, y) => nilai(D.analisis.per_teknologi[tek][y]);
const teksTek = (k) => t("pj.tek." + k);
function totalTahun(y) { return Object.keys(D.analisis.per_teknologi).reduce((s, k) => s + teknNilai(k, y), 0); }
function puncak() {
  const sk = S.metrik; S.metrik = "total";
  const hasil = D.tahun.reduce((m, y) => { const v = totalTahun(y); return v > m.nilai ? { tahun: y, nilai: Math.round(v) } : m; }, { tahun: D.tahun[0], nilai: 0 });
  S.metrik = sk;
  return hasil;
}
const segHtml = (id, label, pilihan, kini) => `<div class="jm-tab" role="tablist" id="${id}" aria-label="${esc(t(label))}">${pilihan.map(([k, kunci]) => `<button type="button" role="tab" data-v="${k}" aria-selected="${k === kini}">${esc(t(kunci))}</button>`).join("")}</div>`;
function bagianAnalisis() {
  const a = D.analisis, pk = puncak();
  return exHtml({
    id: "analisis", ikon: "grafik", topik: t("kj.ey.analisis"), judulHtml: hlHtml("kj.t.analisis", angka(pk.nilai), { tahun: pk.tahun }) + ` <span class="jm-pil jm-pil-warn">${esc(t("an.est"))}</span>`,
    subHtml: esc(t("kj.s.analisis", { n: angka(a.proyek), mw: angka(a.mw) })), aksiHtml: aksiHtml({ csv: false }),
    isiHtml: `<div class="kj-segmen">${segHtml("kjMetrik", "kj.metrik", [["total", "kj.m.total"], ["konstruksi", "kj.m.konstruksi"], ["om", "kj.m.om"]], S.metrik)}${segHtml("kjBasis", "kj.basis", [["oecd", "kj.b.oecd"], ["asia", "kj.b.asia"]], S.basis)}</div>
      <div id="kjLegenda"></div><div id="kjGrafik" class="ih-bagan"></div>
      <p class="jm-bantu kj-catatan">${ikon("info", 16)}<span>${esc(t("kj.n.analisis", { m: angka(a.dikeluarkan.penyimpanan_mw), asia: angka(D.faktor.pengali_asia, { desimal: 1 }) }))}</span></p>
      ${sumberLipat(D.sumber.filter((s) => s.id !== "irena-jobs").map((s) => ({ sumber: s.penerbit, halaman: s.judul, url: s.url, tanggal: D.diperbarui })))}`,
  });
}
function gambarGrafik() {
  const tekAda = Object.keys(D.analisis.per_teknologi).sort((x, y) => D.tahun.reduce((s, yr) => s + teknNilai(y, yr) - teknNilai(x, yr), 0));
  const seri = tekAda.map((k) => ({ k, kelas: "kj-t-" + k, label: teksTek(k) }));
  $("kjLegenda").innerHTML = legendaHtml(seri);
  const kategori = D.tahun.map((y) => {
    const baris = seri.map((s) => [s.label, angka(Math.round(teknNilai(s.k, y)))]).filter((b) => b[1] !== "0");
    const jml = totalTahun(y);
    return { label: String(y), nilai: Object.fromEntries(seri.map((s) => [s.k, teknNilai(s.k, y)])), tip: String(y), th: tipHtml(`${y}`, [...baris, [t("kj.tip.total"), angka(Math.round(jml))]]) };
  });
  $("kjGrafik").innerHTML = kolomSvg({ kategori, seri, satuan: t("kj.sumbu"), el: $("kjGrafik"), label: t("kj.t.grafik") });
}

/* ---------- peta sebaran dan peringkat per provinsi ---------- */
const kuintil = (v, maks) => (v <= 0 ? 0 : Math.min(5, 1 + Math.floor((v / maks) * 5 - 1e-9)));
function perProvinsi() {
  const hasil = {};
  for (const [k, per] of Object.entries(D.analisis.per_provinsi)) hasil[k] = D.tahun.reduce((s, y) => s + nilai(per[y]), 0);
  return hasil;
}
function bagianPeta() {
  return exHtml({
    id: "peta", ikon: "peta", topik: t("kj.ey.peta"), judulHtml: esc(t("kj.t.peta")), subHtml: esc(t("kj.s.peta")), aksiHtml: aksiHtml({ csv: false }),
    isiHtml: `<div class="kj-petabagi"><div id="kjPeta" class="kj-petaw"></div><div id="kjPeringkat" class="ih-bagan"></div></div>`,
  });
}
function gambarPeta() {
  const per = perProvinsi(), tanpa = per.tanpa || 0, daftar = Object.entries(per).filter(([k]) => k !== "tanpa").sort((a, b) => b[1] - a[1]);
  const maks = daftar[0]?.[1] || 1, total = daftar.reduce((s, [, v]) => s + v, 0);
  const tipProv = (k, v) => tipHtml(namaProv(k), [[t("kj.tip.job"), angka(Math.round(v))], [t("kj.tip.porsi"), angka((v / total) * 100, { desimal: 1 }) + "%"], [t("kj.tip.rank"), `${daftar.findIndex(([x]) => x === k) + 1} / ${daftar.length}`]], { img: `/img/provinsi/${k}.png` });
  const el = $("kjPeta");
  if (geo) {
    const W = 1000, H = 440, jalur = jalurPerProvinsi(geo, W, H).filter((j) => j.d);
    el.innerHTML = `<svg class="ih-svg kj-peta" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${esc(t("kj.t.peta"))}">${jalur.map((j) => {
      const v = per[j.kode] || 0, q = kuintil(v, maks);
      return v ? `<path class="kj-q kj-q${q}" d="${j.d}" tabindex="0" data-tip="${esc(namaProv(j.kode))}" data-th="${esc(tipProv(j.kode, v))}"/>` : `<path class="kj-q kj-q0" d="${j.d}"/>`;
    }).join("")}</svg><div class="kj-lg" aria-label="${esc(t("kj.lg"))}">${[1, 2, 3, 4, 5].map((q) => `<span><i class="kj-q kj-q${q}"></i></span>`).join("")}<small>${esc(t("kj.lg.rendah"))}</small><small>${esc(t("kj.lg.tinggi"))}</small></div>`;
  } else el.innerHTML = `<p class="jm-bantu">${esc(t("kj.peta_gagal"))}</p>`;
  const sepuluh = daftar.slice(0, 10);
  $("kjPeringkat").innerHTML = batangSvg({
    baris: sepuluh.map(([k, v]) => ({ label: namaProv(k), logo: `/img/provinsi/${k}.png`, bagian: [{ k: "v", nilai: Math.round(v) }], tip: namaProv(k), th: tipHtml(namaProv(k), [[t("kj.tip.job"), angka(Math.round(v))]], { img: `/img/provinsi/${k}.png` }) })),
    seri: [{ k: "v", kelas: "kj-t-total" }], satuan: t("kj.sumbu_prov"), el: $("kjPeringkat"), label: t("kj.t.rank"),
  });
  if (tanpa) $("kjPeringkat").insertAdjacentHTML("beforeend", `<p class="jm-bantu kj-catatan">${ikon("info", 16)}<span>${esc(t("kj.n.tanpa", { n: angka(Math.round(tanpa)) }))}</span></p>`);
}

/* ---------- pasokan SDM vokasi vs kebutuhan (Hipotesis) ---------- */
function titikPasokan() {
  const m = {};
  for (const p of V.prodi) m[p.provinsi] = (m[p.provinsi] || 0) + 1;
  for (const l of V.lsp) if (l.provinsi) m[l.provinsi] = (m[l.provinsi] || 0) + 1;
  return m;
}
const topKebutuhan = () => Object.entries(perProvinsi()).filter(([k]) => k !== "tanpa").sort((a, b) => b[1] - a[1]).slice(0, 12);
function bagianVokasi() {
  const ada = titikPasokan(), top = topKebutuhan().slice(0, 10), celah = top.filter(([k]) => !ada[k]).length;
  const prodi = V.prodi.map((p) => `<li class="kj-prodi"><img src="/img/provinsi/${esc(p.provinsi)}.png" width="28" height="28" alt="" loading="lazy"><div><b>${esc(p.kampus)}</b><span>${esc(p.nama)}, ${esc(namaProv(p.provinsi))}</span></div><a class="jm-tbl" href="${esc(httpsAman(p.sumber_url))}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("kj.vk.sumber"))}</span></a></li>`).join("");
  return exHtml({
    id: "vokasi", ikon: "wisuda", topik: t("kj.ey.vokasi"), judulHtml: hlHtml("kj.t.vokasi", `${celah} ${t("kj.vk.dari")} ${top.length}`) + ` <span class="jm-pil jm-pil-warn">${esc(t("an.hipotesis"))}</span>`,
    subHtml: esc(t("kj.s.vokasi", { prodi: angka(V.prodi.length), lsp: angka(V.lsp.length) })), aksiHtml: aksiHtml({ csv: false }),
    isiHtml: `<div class="kj-petabagi"><div id="kjPetaV" class="kj-petaw"></div><div id="kjCelah" class="ih-bagan"></div></div>
      <p class="jm-bantu kj-catatan">${ikon("info", 16)}<span>${esc(t("kj.vk.baca"))}</span></p>
      <h3 class="kj-sub">${esc(t("kj.vk.prodi"))}</h3><ul class="kj-prodi-l">${prodi}</ul>
      <p class="jm-bantu kj-catatan">${ikon("info", 16)}<span>${esc(t("kj.vk.celah", { smk: angka(V.smk.length), lsp0: angka(V.lsp.filter((l) => !l.provinsi).length) }))}</span></p>
      ${sumberLipat(V.sumber.map((x) => ({ sumber: x.penerbit, halaman: x.judul, url: x.url, tanggal: V.diperbarui })))}`,
  });
}
function gambarVokasi() {
  const ada = titikPasokan(), top = topKebutuhan();
  const el = $("kjPetaV");
  if (geo) {
    const W = 1000, H = 440, jalur = jalurPerProvinsi(geo, W, H).filter((j) => j.d), maks = Math.max(1, ...Object.values(ada));
    el.innerHTML = `<svg class="ih-svg kj-peta" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${esc(t("kj.vk.peta"))}">${jalur.map((j) => {
      const n = ada[j.kode] || 0, pr = V.prodi.filter((p) => p.provinsi === j.kode).length, ls = V.lsp.filter((l) => l.provinsi === j.kode).length;
      return `<path class="kj-q kj-q${kuintil(n, maks)}" d="${j.d}" tabindex="0" data-tip="${esc(namaProv(j.kode))}" data-th="${esc(tipHtml(namaProv(j.kode), [[t("kj.tip.prodi"), angka(pr)], [t("kj.tip.lsp"), angka(ls)]], { img: `/img/provinsi/${j.kode}.png` }))}"/>`;
    }).join("")}</svg><div class="kj-lg" aria-label="${esc(t("kj.lg"))}">${[1, 2, 3, 4, 5].map((q) => `<span><i class="kj-q kj-q${q}"></i></span>`).join("")}<small>${esc(t("kj.lg.rendah"))}</small><small>${esc(t("kj.lg.tinggi"))}</small></div>`;
  } else el.innerHTML = `<p class="jm-bantu">${esc(t("kj.peta_gagal"))}</p>`;
  $("kjCelah").innerHTML = batangSvg({
    baris: top.map(([k, v]) => {
      const n = ada[k] || 0;
      return { label: namaProv(k), logo: `/img/provinsi/${k}.png`, sorot: !n, bagian: [{ k: "v", nilai: Math.round(v) }],
        tip: namaProv(k), th: tipHtml(namaProv(k), [[t("kj.tip.job"), angka(Math.round(v))], [t("kj.tip.titik"), angka(n)], [t("kj.tip.per_titik"), n ? angka(Math.round(v / n)) : t("kj.tip.tanpa")]], { img: `/img/provinsi/${k}.png` }) };
    }),
    seri: [{ k: "v", kelas: "kj-t-total" }], satuan: t("kj.sumbu_prov"), el: $("kjCelah"), label: t("kj.vk.celah_judul"),
  });
}

/* ---------- sertifikasi ---------- */
function bagianSertifikasi() {
  const kartuLsp = (l) => `<article class="kj-lsp"><header><span class="kj-lsp-ik">${ikon("lencana", 22)}</span><div><h3>${esc(l.nama)}</h3><p>${esc(l.lingkup)}</p></div></header>
    <p class="kj-lsp-lis">${ikon("centang", 16)}<span>${esc(l.lisensi)}</span></p>
    <div class="kj-pil">${l.teknologi.map(pilTek).join("")}</div>
    <footer><a class="jm-tbl" href="${esc(httpsAman(l.url))}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("kj.lsp.buka"))}</span></a><small>${esc(t("kj.lsp.cek", { tgl: tanggal(l.diperiksa) }))}</small></footer></article>`;
  return exHtml({
    id: "sertifikasi", ikon: "lencana", topik: t("kj.ey.sert"), judulHtml: hlHtml("kj.t.sert", angka(D.lsp.length)), subHtml: esc(t("kj.s.sert")),
    isiHtml: `<div class="kj-grid kj-grid-lsp">${D.lsp.map(kartuLsp).join("")}</div>`,
  });
}

/* ---------- pasang lowongan (anggota) ---------- */
const medan = (id, kunci, isi, penuh = false, ik = "") => `<div class="jm-medan${penuh ? " jm-penuh" : ""}"><label for="${id}">${ik ? ikon(ik, 16) : ""}<span>${esc(t(kunci))}</span></label>${isi}</div>`;
const bungkus = (ik, isi, kelas = "") => `<div class="pt-in${kelas}">${ikon(ik, 18)}${isi}</div>`;
const isian = (id, { tipe = "text", maks = 160, wajib = false, ph = "", ik = "" } = {}) => bungkus(ik, `<input class="jm-isian" id="${id}" type="${tipe}" maxlength="${maks}" autocomplete="off"${wajib ? " required" : ""}${ph ? ` placeholder="${esc(ph)}"` : ""}>`);
const pilihan = (id, opsi, ik) => `<select class="jm-pilih" id="${id}" data-ikon="${ik}">${opsi.map(([v, l, i]) => `<option value="${esc(v)}"${i ? ` data-ikon="${esc(i)}"` : ""}>${esc(l)}</option>`).join("")}</select>`;
const pilStatus = (s) => `<span class="jm-pil ${s === "terbit" ? "jm-pil-ok" : s === "tolak" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(t("kj.st." + s))}</span>`;

function bagianPasang() {
  const setuju = (saya?.klaim || []).filter((k) => k.status === "setuju");
  if (!setuju.length) {
    return exHtml({ id: "pasang", ikon: "tambah", topik: t("kj.ey.pasang"), judulHtml: esc(t("kj.t.pasang")), subHtml: esc(t("kj.s.pasang")),
      isiHtml: `<p class="pt-bantu">${ikon("info", 16)}<span>${esc(t("kj.pasang.syarat"))}</span></p><div class="jm-aksi pt-aksi"><a class="jm-tbl jm-tbl-utama" href="/portal">${ikon("gedung", 16)}<span>${esc(t("kj.pasang.portal"))}</span></a></div>` });
  }
  const orgOpsi = setuju.map((k) => [k.organisasi_id, ORG.get(k.organisasi_id) || k.organisasi_id, "gedung"]);
  const provOpsi = [["", t("kj.f.prov_kosong"), "wilayah"], ...Object.entries(PROV).map(([k, [n]]) => [k, n, "prov:" + k])];
  const form = `<form class="jm-form" id="fKerja" novalidate><div class="jm-form-grid">
    ${medan("kjOrg", "kj.f.org", bungkus("gedung", pilihan("kjOrg", orgOpsi, "gedung")), false, "gedung")}
    ${medan("kjJudul", "kj.f.judul", isian("kjJudul", { wajib: true, ik: "koper" }), false, "koper")}
    ${medan("kjTekF", "kj.f.tek", bungkus("topik", pilihan("kjTekF", TEK.map((k) => [k, t("pj.tek." + k), "tek:" + k]), "topik")), false, "topik")}
    ${medan("kjJenjangF", "kj.f.jenjang", bungkus("tingkat", pilihan("kjJenjangF", JENJANG.map((k) => [k, t("kj.jj." + k), "tingkat"]), "tingkat")), false, "tingkat")}
    ${medan("kjProvF", "kj.f.prov", bungkus("wilayah", pilihan("kjProvF", provOpsi, "wilayah")), false, "wilayah")}
    ${medan("kjLokF", "kj.f.lokasi", isian("kjLokF", { maks: 80, ik: "lokasi" }), false, "lokasi")}
    ${medan("kjTautan", "kj.f.tautan", isian("kjTautan", { tipe: "url", maks: 600, wajib: true, ph: "https://", ik: "tautan" }), false, "tautan")}
    ${medan("kjBatas", "kj.f.batas", isian("kjBatas", { tipe: "date", maks: 10, ik: "kalender" }), false, "kalender")}
    ${medan("kjDes", "kj.f.deskripsi", `<div class="pt-in pt-area">${ikon("teks", 18)}<textarea class="jm-isian" id="kjDes" rows="4" maxlength="1500"></textarea></div>`, true, "teks")}</div>
    <p class="pt-bantu">${ikon("info", 16)}<span>${esc(t("kj.pasang.bantu"))}</span></p><div id="kjPesan" aria-live="polite"></div>
    <div class="jm-aksi pt-aksi"><button type="submit" class="jm-tbl jm-tbl-utama">${ikon("tambah", 16)}<span>${esc(t("kj.pasang.kirim"))}</span></button></div></form>`;
  const milik = (saya.lowongan || []);
  const daftar = milik.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["kj.c.judul", "kj.c.org", "kj.c.status"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${milik.map((m) => `<tr><td data-l="${esc(t("kj.c.judul"))}">${esc(m.judul)}</td><td data-l="${esc(t("kj.c.org"))}">${esc(m.organisasi_nama)}</td><td data-l="${esc(t("kj.c.status"))}">${pilStatus(m.status)}${m.catatan_admin ? `<small>${esc(m.catatan_admin)}</small>` : ""}</td></tr>`).join("")}</tbody></table></div>` : "";
  return exHtml({ id: "pasang", ikon: "tambah", topik: t("kj.ey.pasang"), judulHtml: esc(t("kj.t.pasang")), subHtml: esc(t("kj.s.pasang")), isiHtml: form + daftar });
}
async function kirimLowongan(e) {
  e.preventDefault();
  const v = (id) => $(id).value.trim();
  const badan = { organisasi_id: v("kjOrg"), judul: v("kjJudul"), teknologi: v("kjTekF"), jenjang: v("kjJenjangF"), kode_prov: v("kjProvF") || null, lokasi: v("kjLokF") || null, tautan: v("kjTautan"), batas: v("kjBatas") || null, deskripsi: v("kjDes") || null };
  const pesan = $("kjPesan");
  try {
    await api("/api/kerja", { metode: "POST", badan });
    pesan.innerHTML = `<p class="jm-pesan jm-pesan-ok" role="status">${esc(t("kj.pasang.ok"))}</p>`;
    e.target.reset();
    await muatSaya(); $("kjPasangW").innerHTML = bagianPasang(); pasangForm();
  } catch (err) { pesan.innerHTML = `<p class="jm-pesan jm-pesan-galat" role="alert">${esc(galatTeks(err.kode))}</p>`; }
}
function pasangForm() { $("fKerja")?.addEventListener("submit", kirimLowongan); import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {}); }

/* ---------- moderasi admin ---------- */
function kartuAntre(r) {
  return `<article class="kj-kartu kj-antre" data-id="${r.id}"><header>${logoHtml({ org_id: r.organisasi_id, org: r.organisasi_nama })}<div><h3>${esc(r.judul)}</h3><p class="kj-org">${esc(r.organisasi_nama)}</p></div></header>
    <div class="kj-pil">${pilTek(r.teknologi)}<span class="kj-jj kj-jj-${esc(r.jenjang)}">${ikon("tingkat", 14)}<span>${esc(t("kj.jj." + r.jenjang))}</span></span></div>
    <div class="kj-meta">${lokasiHtml({ kode: r.kode_prov || "", lokasi: r.lokasi })}<span class="kj-tgl">${ikon("orang", 16)}<span>${esc(r.pengaju || "-")}</span></span></div>
    ${r.deskripsi ? `<p class="kj-des">${esc(r.deskripsi)}</p>` : ""}
    <div class="kj-meta"><a class="kj-taut" href="${esc(httpsAman(r.tautan))}" target="_blank" rel="noopener noreferrer nofollow">${ikon("tautan", 16)}<span>${esc(r.tautan)}</span></a></div>
    <div class="kj-putus"><div class="pt-in">${ikon("teks", 18)}<input class="jm-isian" data-catatan maxlength="500" placeholder="${esc(t("kj.antre.catatan"))}"></div>
    <div class="kj-putus-b"><button type="button" class="jm-tbl jm-tbl-utama" data-aksi="terbit">${ikon("centang", 16)}<span>${esc(t("kj.antre.terbit"))}</span></button><button type="button" class="jm-tbl" data-aksi="tolak">${ikon("silang", 16)}<span>${esc(t("kj.antre.tolak"))}</span></button></div></div></article>`;
}
async function muatAntrean() {
  const wadah = $("kjAntre");
  try {
    const d = await api("/api/admin/kerja?status=menunggu");
    wadah.innerHTML = d.baris.length ? `<div class="kj-grid">${d.baris.map(kartuAntre).join("")}</div>` : kosongHtml("kj.antre.kosong");
  } catch (e) { wadah.innerHTML = `<p class="jm-pesan jm-pesan-galat" role="alert">${esc(galatTeks(e.kode))}</p>`; }
}
function bagianAntre() {
  return exHtml({ id: "moderasi", ikon: "perisai", topik: t("kj.ey.antre"), judulHtml: esc(t("kj.t.antre")), subHtml: esc(t("kj.s.antre")), isiHtml: `<div id="kjAntre">${hantuHtml(3)}</div>` });
}
async function putus(tombol) {
  const k = tombol.closest(".kj-antre"), catatan = k.querySelector("[data-catatan]").value.trim(), aksi = tombol.dataset.aksi;
  if (aksi === "tolak" && !catatan) { k.querySelector("[data-catatan]").focus(); return; }
  tombol.disabled = true;
  try { await api(`/api/admin/kerja/${k.dataset.id}`, { metode: "POST", badan: { aksi, catatan: catatan || null } }); await muatAntrean(); if (aksi === "terbit") { await muatAnggota(); gambarDaftar(); } }
  catch (e) { tombol.disabled = false; k.insertAdjacentHTML("beforeend", `<p class="jm-pesan jm-pesan-galat" role="alert">${esc(galatTeks(e.kode))}</p>`); }
}

/* ---------- muat ---------- */
async function muatAnggota() { try { anggota = (await api("/api/kerja")).baris || []; } catch { anggota = []; } }
async function muatSaya() {
  try { const p = await api("/api/portal/saya"); saya = { klaim: p.klaim || [], lowongan: [] }; } catch { saya = { klaim: [], lowongan: [] }; }
  try { saya.lowongan = (await api("/api/kerja/saya")).baris || []; } catch { /* tabel belum ada */ }
}
function pasangLowongan() {
  const ubah = (kunci) => (e) => { S[kunci] = e.target.value; S.hal = 1; gambarDaftar(); };
  $("kjQ").addEventListener("input", debounce((e) => { S.q = e.target.value; S.hal = 1; gambarDaftar(); }, 150));
  $("kjTek").addEventListener("change", ubah("tek"));
  $("kjProv").addEventListener("change", ubah("prov"));
  $("kjJenjang").addEventListener("change", ubah("jenjang"));
  $("kjHapus").addEventListener("click", () => {
    Object.assign(S, { q: "", tek: "", prov: "", jenjang: "", hal: 1 });
    $("kjQ").value = ""; for (const id of ["kjTek", "kjProv", "kjJenjang"]) { $(id).value = ""; $(id).dispatchEvent(new Event("change")); }
  });
  $("kjHal").addEventListener("click", (e) => {
    const b = e.target.closest("[data-hal]"); if (!b || b.disabled) return;
    const n = +b.dataset.hal; sorotHalaman(b, n); nanti(() => { S.hal = n; gambarDaftar(); $("lowongan").scrollIntoView({ block: "start" }); });
  });
}
function pasangSegmen() {
  for (const [id, kunci] of [["kjMetrik", "metrik"], ["kjBasis", "basis"]]) {
    $(id).addEventListener("click", (e) => {
      const b = e.target.closest("[data-v]"); if (!b) return;
      for (const x of $(id).querySelectorAll("[data-v]")) x.setAttribute("aria-selected", String(x === b));
      S[kunci] = b.dataset.v; nanti(() => { gambarGrafik(); gambarPeta(); if (V) gambarVokasi(); });
    });
  }
}

async function muat() {
  const isi = $("kjIsi");
  isi.innerHTML = hantuHtml(6);
  try {
    D = await (await fetch("/data/kerja.json", { credentials: "same-origin" })).json();
  } catch { isi.innerHTML = `<p class="jm-pesan jm-pesan-galat" role="alert">${esc(t("kj.galat"))}</p>`; return; }
  geo = await geoProvinsi();
  try { V = await (await fetch("/data/kerja_vokasi.json", { credentials: "same-origin" })).json(); } catch { V = null; }
  const muatOrg = fetch("/data/organisasi.json", { credentials: "same-origin" }).then((r) => r.json()).then((o) => { ORG = new Map((o.baris || []).map((x) => [x.id, x.nama])); }).catch(() => {});
  await Promise.all([muatAnggota(), muatSaya(), muatOrg]);
  ubin(semuaLowongan());
  isi.innerHTML = [bagianLowongan(), bagianAnalisis(), bagianPeta(), V ? bagianVokasi() : "", bagianSertifikasi(), `<div id="kjPasangW" class="jm-hal-pf">${bagianPasang()}</div>`, saya_admin ? bagianAntre() : ""].join("");
  gambarDaftar(); pasangLowongan(); gambarGrafik(); gambarPeta(); if (V) gambarVokasi(); pasangSegmen(); pasangForm();
  if (saya_admin) { muatAntrean(); $("kjAntre").addEventListener("click", (e) => { const b = e.target.closest("[data-aksi]"); if (b) putus(b); }); }
  import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {});
}
let saya_admin = false;
const sesi = await mulaiHalaman();
saya_admin = ["admin", "super"].includes(sesi?.peran);
await muat();
saatBahasa(() => { if (D) { ubin(semuaLowongan()); muat(); } });
addEventListener("resize", debounce(() => { if (D && $("kjGrafik")) { gambarGrafik(); gambarPeta(); if (V) gambarVokasi(); } }, 200));
