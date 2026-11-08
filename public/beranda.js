import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, kosongHtml, ikon, fotoBerita } from "/inti/umum.js";
import { gambarDataset, LOGO_ORG, ubinProyek, lokasiHtml } from "/beranda_data.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { namaMedia, logoLokal } from "/inti/nama_media.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { pelakuHtml, pasangPelaku } from "/beranda_pelaku.js";
import { pasangBawah, IKON } from "/beranda_bawah.js";
import { sumberHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { kontenBeranda, daftarKonten } from "/inti/konten_beranda.js";
import { muat, label, urlAman, norm, namaRegulasi, sembunyi } from "/publik.js";
import { pasangPita } from "/inti/riwayat.js";

const KARTU = ["kapasitas", "proyek", "regulasi", "organisasi"];
/* Bauran energi primer EBT: angka resmi tahunan Kementerian ESDM, ditulis tangan; perbarui saat capaian tahunan baru dirilis.
   Target menurut KEN (PP 40/2025): 23% pada 2030 (KEN lama PP 79/2014: 23% pada 2025). */
const BAURAN = { nilai: 15.75, tahun: 2025, target: 23, tahun_target: 2030, url: "https://katadata.co.id/berita/energi/695f76f7412bc/bauran-ebt-capai-15-75-pada-akhir-2025-plta-masih-yang-terbesar" };
const ALIAS = [[/pertamina power indonesia|pertamina nre/i, "Pertamina NRE"], [/kementerian energi dan sumber daya mineral/i, "Kementerian ESDM"], [/masyarakat energi terbarukan/i, "METI"], [/badan riset dan inovasi nasional/i, "BRIN"], [/asosiasi energi surya/i, "AESI"], [/asosiasi produsen biofuel/i, "APROBI"], [/asosiasi panas bumi/i, "API (panas bumi)"], [/kementerian investasi/i, "Kementerian Investasi/BKPM"], [/direktorat jenderal energi baru/i, "Ditjen EBTKE"], [/^pln$/i, "PLN"], [/otoritas jasa keuangan/i, "OJK"], [/medco energi internasional/i, "Medco Energi"], [/sumitomo/i, "Sumitomo"], [/barito renewables/i, "Barito Renewables"], [/pertamina geothermal/i, "Pertamina Geothermal"], [/badan usaha milik negara/i, "Kementerian BUMN"], [/kementerian investasi/i, "Kementerian Investasi"], [/pln nusantara power/i, "PLN Nusantara Power"], [/asosiasi panas bumi/i, "API Panas Bumi"]];
const namaPendek = (n) => { for (const [re, a] of ALIAS) if (re.test(n)) return a; return n.replace(/^PT\.?\s+/i, "").replace(/\s*\((Persero)\)/i, "").replace(/\s+Tbk$/i, ""); };
const URUT_ASOSIASI = [/metiires|masyarakat energi terbarukan/i, /surya/i, /biofuel/i, /panas bumi/i, /apamsi|modul surya/i, /applta|hidro/i, /aeski/i, /mki|ketenagalistrikan/i];
const URUT_LEMBAGA = [/energi dan sumber daya mineral/i, /dewan energi/i, /bappenas|perencanaan pembangunan/i, /riset dan inovasi/i, /kementerian keuangan/i, /perindustrian/i, /lingkungan hidup|kehutanan/i, /danantara|investasi/i];
const KAT_EKO = [["bumn", 1], ["swasta", 2], ["asosiasi", 3], ["lembaga", 4]];
const INSIGHT_KARTU = 17; // ponytail: jumlah kartu /insight ditulis tetap; hitung dari halaman itu bila kartunya sering berubah
/** 8 teratas per kategori: daftar sematan (id atau nama) lebih dulu, sisanya menurut total MW proyek terkait. Nama baru di data masuk otomatis. */
const PIN = {
  bumn: ["p_b1c52ad7b0", "p_10e0dde689", "p_dda1e51dae", "su_ed074ff5", "p_5a2e7d0c63", "p_ff7a390a42", "p_e0f3886341", "p_978ca76d57"] /* Pertamina di atas PLN (pemilik 8 Nov 2026) */,
  swasta: ["p_bdd0f2d140", "p_7a803f3b71", "p_27ae5a4203", "p_7f829f524e", "p_c6c4e478c0", "p_d99d5987f7", "ix_keen", "p_9de27fd5b9"],
  asosiasi: ["l_41bf1f0b41", "l_dd90c88f59", "l_d3dadc789e", "l_7e5f8d771d", "l_06d49428ac", "l_67ed5e1422", "l_1192cb8a15", "l_0974f82eba"],
  lembaga: ["l_7278e0528a", "l_38ba1d6f56", "l_973f60de15", "l_15e21f04fa", "l_7b43a2574c", "l_edde12ff1f", "l_05301f48a5", "l_3d20494e0a"],
};
function delapan(org, pro) {
  const proyek = new Map(pro.baris.map((p) => [p.id, p]));
  const skor = (o) => (o.proyek_ids || []).map((i) => proyek.get(i)).filter(Boolean).reduce((s, p) => s + (p.kapasitas?.[0]?.nilai || 0), 0);
  const kat = (k) => org.filter((o) => o.kategori?.kode === k || (k === "swasta" && o.id === "p_d99d5987f7"));
  const semua = new Map(org.map((o) => [o.id, o]));
  const hasil = {};
  for (const [k, pins] of Object.entries(PIN)) {
    const dasar = k === "lembaga" ? "kementerian-lembaga" : k, pool = [...new Map([...kat(dasar), ...org.filter((o) => pins.some((p) => typeof p === "string" ? p === o.id : p.test(o.nama)))].map((o) => [o.id, o])).values()];
    const pilih = [];
    for (const p of pins) { const o = typeof p === "string" ? semua.get(p) : pool.find((x) => p.test(x.nama)); if (o && !pilih.includes(o)) pilih.push(o); }
    for (const o of [...pool].sort((a, b) => skor(b) - skor(a))) { if (pilih.length >= 8) break; if (skor(o) > 0 && !pilih.includes(o)) pilih.push(o); }
    hasil[k] = { daftar: pilih.slice(0, 8), total: dasar === "lembaga" ? kat(dasar).length : kat(dasar).length };
  }
  return hasil;
}
let R = null; // ringkas
let indeks = null; // korpus cari

const IK = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const IKON_KPI = {
  proyek: IK('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  kapasitas: IK('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  organisasi: IK('<path d="M4 21V5l9-2v18M13 8h7v13M7 8h3M7 12h3M7 16h3M3 21h18"/>'),
  orang: IK('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M15 14c4-1 6 1 6 5"/>'),
  regulasi: IK('<path d="M12 3v18M6 21h12M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>'),
  bauran: IK('<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4"/>'),
  konstruksi: IK('<path d="M3 21h18M6 21V9h5v12M11 9 4 6M8 3l8 6M16 9v7l-2 2"/>'),
};
/** Ikon info bulat di pojok kanan atas tiap bagian (isi: catatan sumber). */
function pasangSumber(tgl) {
  const isi = { srcS01: t("beranda.sumber", { tanggal: tgl }), srcS02: t("beranda.eko_sumber"), srcBerita: t("beranda.src.berita", { tanggal: tgl }), srcProyek: t("beranda.src.proyek", { tanggal: tgl }) };
  for (const [id, teks] of Object.entries(isi)) { const el = document.getElementById(id); if (el) el.innerHTML = sumberHtml(esc(teks)); }
  const ak = document.getElementById("srcAkses");
  if (ak) ak.innerHTML = sumberHtml(`${esc(t("beranda.akses.kutip"))} <a href="/tentang">${esc(t("beranda.akses.tentang"))}</a>`);
}
function gambarKartu() {
  const el = document.getElementById("kartu"), tgl = tanggal(R.dibangun_pada);
  const urut = (k) => KARTU.indexOf(k.kode);
  const kartu = R.kartu.filter((k) => KARTU.includes(k.kode)).sort((a, b) => urut(a) - urut(b)).map((k) => ({ kode: k.kode, nilai: k.nilai, satuan: k.satuan }));
  const konstruksi = R.proyek_per_status?.konstruksi, pr = kartu.find((k) => k.kode === "proyek");
  if (pr && Number.isFinite(konstruksi)) pr.ctx = t("beranda.kpi.konstruksi", { n: angka(konstruksi) });
  const b = BAURAN, sisa = angka(b.target - b.nilai, { desimal: 2 });
  const bauran = `<div class="jm-kpi jm-kpi-bauran jm-w1"><div class="jm-kpi-ik">${IKON_KPI.bauran}</div><span class="jm-kpi-src">${sumberHtml(`${esc(t("beranda.src.bauran", { tahun: b.tahun }))} <a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">katadata.co.id</a>`)}</span>
    <div class="jm-kpi-lab"><span>${esc(t("beranda.kk.bauran"))}</span></div>
    <div class="jm-kpi-n"><b>${esc(angka(b.nilai, { desimal: 2 }))}%</b><small>${esc(t("beranda.u.bauran", { tahun: b.tahun }))}</small></div>
    <div class="jm-kpi-ctx">${esc(t("beranda.kpi.bauran_target", { target: angka(b.target), tahun: b.tahun_target, sisa }))}</div></div>`;
  el.innerHTML = bauran + kartu.map((k, i) => `<div class="jm-kpi jm-w${((i + 1) % 5) + 1}"><div class="jm-kpi-ik">${IKON_KPI[k.kode]}</div><span class="jm-kpi-src">${sumberHtml(esc(t("beranda.src." + k.kode, { tanggal: tgl, total: angka(R.hitung.regulasi) })))}</span>
    <div class="jm-kpi-lab"><span>${esc(t("beranda.kk." + k.kode))}</span>${k.kode === "kapasitas" ? `<span class="jm-pil jm-pil-est">EST</span>` : ""}</div>
    <div class="jm-kpi-n"><b>${esc(angka(k.nilai))}</b><small>${esc(t("beranda.u." + k.satuan))}</small></div>
    <div class="jm-kpi-ctx">${k.ctx ? esc(k.ctx) : ""}</div></div>`).join("");
  pasangSumber(tgl);
  const IKH = { proyek: "proyek", organisasi: "direktori", regulasi: "regulasi", berita: "berita" };
  document.getElementById("heroHitung").innerHTML = ["proyek", "organisasi", "regulasi", "berita"].map((k, i) => `<li class="jm-w${(i % 5) + 1}"><span class="jm-hh-ik" aria-hidden="true">${ikon(IKH[k], 20)}</span><span class="jm-hh-t"><b>${esc(angka(R.hitung[k]))}</b><span>${esc(t("beranda.hero.h." + k))}</span></span></li>`).join("") + `<li class="jm-hitung-src">${sumberHtml(esc(t("beranda.sumber", { tanggal: tgl })))}</li>`;
}

async function gambarBerita() {
  const el = document.getElementById("berita");
  try {
    const [b, foto] = await Promise.all([muat("berita"), muat("berita_foto").catch(() => ({}))]);
    const IK = { surya: "tek-surya", "panas-bumi": "tek-panas", bioenergi: "tek-bio", "biomassa-sampah": "tek-bio" };
    const pilih = daftarKonten(await kontenBeranda(), "berita_pilihan").map(String), byId = new Map(b.baris.map((x) => [x.id, x]));
    const manual = pilih.map((i) => byId.get(i)).filter((x) => x && urlAman(x.url)).slice(0, 6);
    const baris = manual.length ? manual : [...b.baris].filter((x) => urlAman(x.url) && x.terbit).sort((x, y) => String(y.terbit).localeCompare(String(x.terbit))).slice(0, 6);
    if (!baris.length) throw new Error("berita kosong");
    el.innerHTML = `<ul class="jm-feed">${baris.map((x) => `<li><a class="jm-feed-i jm-feed-foto" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><span class="jm-feed-th">${ikon(IK[x.kepakaran?.[0]] || "tek-listrik", 28)}${fotoBerita(foto, x.id) ? `<img src="${fotoBerita(foto, x.id)}" width="112" height="72" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}</span><span class="jm-feed-t"><strong>${esc(x.judul)}</strong><span class="jm-baris-meta">${x.kepakaran?.[0] ? pilTek(x.kepakaran[0]) : ""}<span class="jm-media">${logoLokal(x.media) ? `<img src="${esc(logoLokal(x.media))}" width="16" height="16" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}<span>${esc(namaMedia(x.media))}, ${esc(tanggal(String(x.terbit).slice(0, 10)))}</span></span></span></span></a></li>`).join("")}</ul>${lihatSemuaHtml("/berita", t("beranda.lihat.berita"))}`;
  } catch (e) { sembunyi(el, e); el.closest(".jm-ex").hidden = true; }
}

async function gambarProyek() {
  const el = document.getElementById("proyek");
  try {
    const p = await muat("proyek");
    const sorot = daftarKonten(await kontenBeranda(), "sorotan").filter((x) => x && x.jenis === "proyek"), byId = new Map(p.baris.map((x) => [x.id, x]));
    const manual = sorot.map((x) => byId.get(x.id)).filter(Boolean).slice(0, 6);
    const baru = manual.length ? manual : [...p.baris].sort((a, b) => String(b.sumber?.[0]?.tanggal).localeCompare(String(a.sumber?.[0]?.tanggal)) || b.id.localeCompare(a.id)).slice(0, 6);
    const foto = await muat("berita_foto").catch(() => ({}));
    el.innerHTML = `<ul class="jm-feed">${baru.map((x) => {
      const st = x.status?.[0]?.nilai || "tidak-diketahui", href = "/p/" + encodeURIComponent(x.id);
      return `<li><div class="jm-feed-i"><a class="jm-feed-th jm-pt-k jm-tek-${esc(x.teknologi || "lain")}" href="${href}" tabindex="-1" aria-hidden="true">${ubinProyek(x, foto)}</a><span class="jm-feed-t"><span class="jm-feed-nm"><a class="jm-feed-j" href="${href}"><strong>${esc(namaProyek(x))}</strong></a>${x.teknologi ? pilTek(x.teknologi) : ""}${pilStatus(st)}</span><span class="jm-baris-meta">${lokasiHtml(x)}</span></span></div></li>`;
    }).join("")}</ul>${lihatSemuaHtml("/proyek", t("beranda.lihat.proyek"))}`;
  } catch (e) { sembunyi(el, e); el.closest(".jm-ex").hidden = true; }
}

async function gambarAgenda() {
  const kartu = document.getElementById("agendaKartu"), el = document.getElementById("agenda");
  try {
    const ids = daftarKonten(await kontenBeranda(), "agenda").map(String);
    if (!ids.length) { kartu.hidden = true; return; }
    const k = await muat("kalender"), byId = new Map(k.baris.map((x) => [x.id, x])), baris = ids.map((i) => byId.get(i)).filter(Boolean).slice(0, 6);
    if (!baris.length) { kartu.hidden = true; return; }
    el.innerHTML = `<ul class="jm-feed">${baris.map((x) => `<li><a class="jm-feed-i" href="/kalender"><span class="jm-feed-t"><strong>${esc(x.judul)}</strong><span class="jm-baris-meta"><span>${esc(tanggal(String(x.tanggal).slice(0, 10)))}</span></span></span></a></li>`).join("")}</ul>${lihatSemuaHtml("/kalender", t("beranda.lihat.agenda"))}`;
    kartu.hidden = false;
  } catch (e) { kartu.hidden = true; }
}

/* ---------- ekosistem: hitungan per kategori + kisi logo ---------- */
const inisial = (n) => { const w = String(n).split(/\s+/).filter((x) => /^[A-Za-z]/.test(x)); return (w.length > 1 ? w.slice(0, 2).map((x) => x[0]).join("") : (w[0] || "?").slice(0, 3)).toUpperCase(); };
async function gambarEkosistem() {
  const hit = document.getElementById("ekoHitung"), kisi = document.getElementById("ekoLogo");
  try {
    const [org, pro] = await Promise.all([muat("organisasi"), muat("proyek")]);
    const n = (k) => org.baris.filter((o) => o.kategori?.kode === k).length;
    hit.innerHTML = pelakuHtml(org.baris, pro); pasangPelaku(hit);
    const d = delapan(org.baris, pro);
    kisi.innerHTML = KAT_EKO.map(([kat, w]) => {
      const { daftar } = d[kat];
      const tiles = daftar.map((o) => {
        const nama = namaPendek(o.nama), slug = LOGO_ORG[o.id];
        return `<a class="jm-logo" href="/direktori?tampil=lembaga" title="${esc(o.nama)}">${slug ? `<img src="/img/logo/${slug}.png" width="26" height="26" alt="" loading="lazy">` : `<span class="jm-logo-ini jm-w${w}" aria-hidden="true">${esc(inisial(nama))}</span>`}<span>${esc(nama)}</span></a>`;
      });
      return `<div class="jm-logo-kol"><h3><span class="jm-kotak jm-w${w}" aria-hidden="true"></span>${esc(t("beranda.eko.k." + kat))}</h3>${tiles.join("")}</div>`;
    }).join("");
    document.getElementById("ekoSemua").innerHTML = `${ikon("daftar2", 16)}<span>${esc(t("beranda.eko.semua", { n: angka(org.baris.length) }))}</span>`;
  } catch (e) { sembunyi(kisi, e); }
}

/* ---------- 8 pintu masuk (dulu di beranda_bawah.js) ---------- */
/** Deret mini (batang) dari angka; kosong bila kurang dari 2 titik. */
const spark = (v) => { v = v.filter(Number.isFinite).slice(-12); if (v.length < 2) return ""; const m = Math.max(...v) || 1, w = 80 / v.length; return `<svg class="jm-jalur-sp" viewBox="0 0 80 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">${v.map((x, i) => { const h = Math.max(2, (x / m) * 24); return `<rect x="${(i * w + 1).toFixed(1)}" y="${(24 - h).toFixed(1)}" width="${(w - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5"/>`; }).join("")}</svg>`; };
const hitungPer = (arr, f, urut) => { const m = new Map(); for (const x of arr) { const k = f(x); if (k) m.set(k, (m.get(k) || 0) + 1); } const e = [...m.entries()]; return (urut ? e.sort((a, b) => String(a[0]).localeCompare(String(b[0]))) : e.sort((a, b) => b[1] - a[1])).map((x) => x[1]); };
async function gambarJalur() {
  const el = document.getElementById("ekoJalur");
  try {
    const [pr, wl, rt, kl, pk, og, rg] = await Promise.all(["proyek", "wilayah", "rantai_plts", "kalender", "pustaka", "organisasi", "regulasi"].map(muat));
    const J = [
      ["proyek", "/proyek", "proyek", pr.baris.length, "proyek", spark(hitungPer(pr.baris, (p) => p.teknologi))],
      ["wilayah", "/wilayah", "wilayah", wl.baris.length, "provinsi", spark(wl.baris.map((w) => w.terpasang_mw?.nilai).filter((x) => x != null).sort((a, b) => b - a).slice(0, 12))],
      ["rantai", "/rantai", "rantai", rt.pabrikan.length, "pabrikan", spark([...rt.pabrikan].map((p) => p.mwp).sort((a, b) => b - a).slice(0, 12))],
      ["regulasi", "/regulasi", "regulasi", rg.baris.length, "regulasi", spark(hitungPer(rg.baris, (r) => r.tahun, true))],
      ["direktori", "/direktori", "direktori", og.baris.length, "organisasi", spark(hitungPer(og.baris, (o) => o.kategori?.kode))],
      ["pustaka", "/direktori?tampil=pustaka", "daftar", pk.baris.length, "dokumen", spark(hitungPer(pk.baris, (d) => String(d.tanggal || "").slice(0, 4), true))],
      ["kalender", "/kalender", "kalender", kl.baris.length, "acara", spark(hitungPer(kl.baris, (a) => String(a.tanggal || "").slice(0, 7), true))],
      ["insight", "/insight", "insight", INSIGHT_KARTU, "kartu", spark(hitungPer(pr.baris, (p) => p.status?.[0]?.nilai))],
    ];
    el.innerHTML = J.map(([k, href, ik, n, u, sp]) => `<a class="jm-jalur jm-jalur-${k}" href="${href}"><span class="jm-jalur-ik">${ikon(ik, 28)}</span>${k === "direktori" ? `<span class="jm-pil jm-jalur-kunci">${ikon("kunci", 12)}${esc(t("beranda.j.masuk"))}</span>` : ""}<b class="jm-jalur-n">${esc(angka(n))}<small>${esc(t("beranda.jn." + u))}</small></b><strong>${esc(t("beranda.j." + k))}</strong><span class="jm-jalur-ket">${esc(t("beranda.j." + k + ".ket"))}</span><span class="jm-jalur-viz">${sp}</span></a>`).join("");
  } catch (e) { sembunyi(el, e); }
}

/* ---------- banner akses: manfaat anggota + jumlah anggota dari meti-wilayah ---------- */
const MANFAAT = [["m1", "kartu"], ["m2", "buku"], ["m3", "lonceng"], ["m4", "gedung"]];
async function gambarAkses() {
  const el = document.getElementById("aksesManfaat");
  let n = null, sumber = "";
  try {
    const w = await muat("meti-wilayah");
    n = w.provinsi.reduce((a, p) => a + (p.individu || 0) + (p.organisasi || 0), 0);
    sumber = t("beranda.akses.sumber", { label: w.anggota_sumber.label, tanggal: tanggal(w.anggota_sumber.tanggal) });
  } catch (e) { /* tanpa angka anggota: kartu manfaat tetap tampil */ }
  el.innerHTML = (n ? `<p class="jm-akses-n">${ikon("orang", 16)}<span>${esc(t("beranda.akses.anggota", { n: angka(n) }))}</span></p>` : "") + `<ul class="jm-akses-m">${MANFAAT.map(([k, ik]) => `<li><span class="jm-akses-ik">${ikon(ik, 22)}</span><span><strong>${esc(t("beranda.akses." + k + ".j"))}</strong><small>${esc(t("beranda.akses." + k + ".d"))}</small></span></li>`).join("")}</ul>`;
  const ak = document.getElementById("srcAkses");
  if (ak) ak.innerHTML = sumberHtml(`${sumber ? esc(sumber) + " " : ""}${esc(t("beranda.akses.kutip"))} <a href="/tentang">${esc(t("beranda.akses.tentang"))}</a>`);
}

/* ---------- cari global ---------- */
const GRUP = [
  ["proyek", (x) => `${x.nama} ${x.lokasi?.provinsi || ""} ${x.teknologi || ""}`, (x) => x.nama, (x) => x.lokasi?.provinsi, () => "/direktori?tampil=proyek"],
  ["organisasi", (x) => `${x.nama} ${x.singkatan || ""}`, (x) => x.nama, (x) => x.kategori?.label, () => "/direktori?tampil=lembaga"],
  ["orang", (x) => `${x.nama} ${x.jabatan_terkini || ""} ${x.organisasi_terkini || ""}`, (x) => x.nama, (x) => x.organisasi_terkini, () => "/direktori?tampil=pakar"],
  ["regulasi", (x) => `${x.judul} ${namaRegulasi(x)} ${x.nomor} tahun ${x.tahun}`, (x) => namaRegulasi(x), (x) => x.judul, (x) => `/regulasi?id=${encodeURIComponent(x.id)}`],
];
async function siapkanIndeks() {
  indeks ??= Promise.all(GRUP.map(([k]) => muat(k))).then((d) => GRUP.map((g, i) => ({ g, baris: d[i].baris.map((x) => ({ x, c: norm(g[1](x)) })) })));
  return indeks;
}
let giliran = 0;
async function cari(q) {
  const hasil = document.getElementById("hasil"), ini = ++giliran, kunci = norm(q.trim());
  if (kunci.length < 2) { hasil.hidden = true; return; }
  hasil.hidden = false;
  let idx;
  try { hasil.innerHTML = hantuHtml(3); idx = await siapkanIndeks(); } catch (e) { indeks = null; hasil.hidden = true; console.warn("cari:", e); return; }
  if (ini !== giliran) return;
  const kata = kunci.split(/\s+/);
  const grup = idx.map(({ g, baris }) => ({ g, cocok: baris.filter((b) => kata.every((k) => b.c.includes(k))) })).filter((o) => o.cocok.length);
  hasil.innerHTML = grup.length ? grup.map(({ g, cocok }) => `<div><h3>${esc(t("beranda.cari." + g[0]))} (${esc(angka(cocok.length))})</h3><ul>${cocok.slice(0, 4).map(({ x }) => `<li><a href="${esc(g[4](x))}">${esc(g[2](x))}<small>${esc(g[3](x) || "")}</small></a></li>`).join("")}</ul></div>`).join("") : `<p>${esc(t("jm.kosong.cocok"))}</p>`;
}

async function main() {
  await mulaiHalaman();
  document.getElementById("kartu").innerHTML = hantuHtml(2);
  const mulai = async () => {
    try { R = await muat("ringkas"); } catch (e) { sembunyi(document.getElementById("kartu"), e); return; }
    try { const g = await muat("regulasi"); R.hitung.regulasi = g.jumlah; const k = R.kartu.find((x) => x.kode === "regulasi"); if (k) k.nilai = g.jumlah; } catch (e) { /* tetap pakai angka ringkasan */ }
    gambarKartu(); nanti(() => { gambarEkosistem(); gambarJalur(); gambarDataset(R); gambarBerita(); gambarProyek(); gambarAgenda(); gambarAkses(); });
  };
  await mulai();
  nanti(() => pasangPita(document.getElementById("pitaRiwayat")));
  pasangBawah(R);
  addEventListener("error", (e) => { if (e.target.tagName !== "IMG") return; if (e.target.closest(".jm-feed-th")) e.target.remove(); }, true);
  document.getElementById("kartu").addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai());
  const input = document.getElementById("cariBeranda");
  input.addEventListener("focus", () => siapkanIndeks().catch(() => { indeks = null; }), { once: true });
  const tunda = debounce((q) => cari(q));
  input.addEventListener("input", () => tunda(input.value));
  document.getElementById("cariTbl").addEventListener("click", () => cari(input.value));
  input.addEventListener("keydown", (e) => e.key === "Enter" && cari(input.value));
  document.addEventListener("jm:bahasa", () => nanti(() => { R && gambarKartu(); gambarEkosistem(); gambarJalur(); R && gambarDataset(R); gambarBerita(); gambarProyek(); gambarAgenda(); gambarAkses(); pasangPita(document.getElementById("pitaRiwayat")); input.value && cari(input.value); }));
}
main();
