import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, kosongHtml, ikon } from "/inti/umum.js";
import { gambarDataset, LOGO_ORG } from "/beranda_data.js";
import { pasangBawah, IKON } from "/beranda_bawah.js";
import { sumberHtml } from "/inti/komponen.js";
import { muat, label, urlAman, norm, namaRegulasi, sembunyi } from "/publik.js";

const KARTU = ["proyek", "kapasitas", "organisasi", "orang", "regulasi"];
const ALIAS = [[/pertamina power indonesia|pertamina nre/i, "Pertamina NRE"], [/kementerian energi dan sumber daya mineral/i, "Kementerian ESDM"], [/masyarakat energi terbarukan/i, "METI"], [/badan riset dan inovasi nasional/i, "BRIN"], [/asosiasi energi surya/i, "AESI"], [/asosiasi produsen biofuel/i, "APROBI"], [/asosiasi panas bumi/i, "API (panas bumi)"], [/kementerian investasi/i, "Kementerian Investasi/BKPM"], [/direktorat jenderal energi baru/i, "Ditjen EBTKE"], [/^pln$/i, "PLN"], [/otoritas jasa keuangan/i, "OJK"], [/medco energi internasional/i, "Medco Energi"], [/sumitomo/i, "Sumitomo"], [/barito renewables/i, "Barito Renewables"], [/pertamina geothermal/i, "Pertamina Geothermal"], [/badan usaha milik negara/i, "Kementerian BUMN"], [/kementerian investasi/i, "Kementerian Investasi"], [/pln nusantara power/i, "PLN Nusantara Power"], [/asosiasi panas bumi/i, "API Panas Bumi"]];
const namaPendek = (n) => { for (const [re, a] of ALIAS) if (re.test(n)) return a; return n.replace(/^PT\.?\s+/i, "").replace(/\s*\((Persero)\)/i, "").replace(/\s+Tbk$/i, ""); };
const URUT_ASOSIASI = [/metiires|masyarakat energi terbarukan/i, /surya/i, /biofuel/i, /panas bumi/i, /apamsi|modul surya/i, /applta|hidro/i, /aeski/i, /mki|ketenagalistrikan/i];
const URUT_LEMBAGA = [/energi dan sumber daya mineral/i, /dewan energi/i, /bappenas|perencanaan pembangunan/i, /riset dan inovasi/i, /kementerian keuangan/i, /perindustrian/i, /lingkungan hidup|kehutanan/i, /danantara|investasi/i];
const KAT_EKO = [["bumn", 1], ["swasta", 2], ["asosiasi", 3], ["lembaga", 4]];
/** Strip hitungan: [kode kategori, warna, kunci label] */
const STRIP = [["bumn", 1, "beranda.eko.h.bumn"], ["swasta", 2, "beranda.eko.h.swasta"], ["internasional", 5, "beranda.eko.h.asing"], ["asosiasi", 3, "beranda.eko.h.asosiasi"], ["kementerian-lembaga", 4, "beranda.eko.h.lembaga"], ["koperasi", 1, "beranda.sensus.k.koperasi"], ["ormawa", 2, "beranda.sensus.k.ormawa"], ["perguruan-tinggi", 3, "beranda.sensus.k.perguruan-tinggi"], ["think-tank", 4, "beranda.sensus.k.think-tank"]];
const INSIGHT_KARTU = 17; // ponytail: jumlah kartu /insight ditulis tetap; hitung dari halaman itu bila kartunya sering berubah
/** 8 teratas per kategori: daftar sematan (id atau nama) lebih dulu, sisanya menurut total MW proyek terkait. Nama baru di data masuk otomatis. */
const PIN = {
  bumn: ["su_ed074ff5", "p_5a2e7d0c63", "p_ff7a390a42", "p_10e0dde689", "p_dda1e51dae", "p_b1c52ad7b0", "p_e0f3886341", "p_978ca76d57"],
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
  const kartu = R.kartu.filter((k) => KARTU.includes(k.kode)).map((k) => ({ kode: k.kode, nilai: k.nilai, satuan: k.satuan }));
  const konstruksi = R.proyek_per_status?.konstruksi;
  if (Number.isFinite(konstruksi)) kartu.push({ kode: "konstruksi", nilai: konstruksi, satuan: "proyek", dari: R.hitung.proyek });
  el.innerHTML = kartu.map((k, i) => `<div class="jm-kpi jm-w${(i % 5) + 1}"><div class="jm-kpi-ik">${IKON_KPI[k.kode]}</div><span class="jm-kpi-src">${sumberHtml(esc(t("beranda.src." + k.kode, { tanggal: tgl, total: angka(R.hitung.regulasi) })))}</span>
    <div class="jm-kpi-lab"><span>${esc(t("beranda.kk." + k.kode))}</span>${k.kode === "kapasitas" ? `<span class="jm-pil jm-pil-est">EST</span>` : ""}</div>
    <div class="jm-kpi-n"><b>${esc(angka(k.nilai))}</b><small>${esc(t("beranda.u." + k.satuan))}</small></div>
    <div class="jm-kpi-ctx">${k.dari ? esc(t("beranda.dari", { n: angka(k.nilai), total: angka(k.dari) })) : "&nbsp;"}</div></div>`).join("");
  pasangSumber(tgl);
  document.getElementById("heroHitung").innerHTML = ["proyek", "organisasi", "orang", "regulasi", "berita"].map((k, i) => `<li><span class="jm-kotak jm-w${(i % 5) + 1}" aria-hidden="true"></span><b>${esc(angka(R.hitung[k]))}</b> ${esc(t("beranda.hero.h." + k))}</li>`).join("") + `<li class="jm-hitung-src">${sumberHtml(esc(t("beranda.sumber", { tanggal: tgl })))}</li>`;
}

async function gambarBerita() {
  const el = document.getElementById("berita");
  try {
    const [b, foto] = await Promise.all([muat("berita"), muat("berita_foto").catch(() => ({}))]);
    const IK = { surya: "tek-surya", "panas-bumi": "tek-panas", bioenergi: "tek-bio", "biomassa-sampah": "tek-bio" };
    const baris = [...b.baris].filter((x) => urlAman(x.url) && x.terbit).sort((x, y) => String(y.terbit).localeCompare(String(x.terbit))).slice(0, 6);
    if (!baris.length) throw new Error("berita kosong");
    el.innerHTML = `<ul class="jm-feed">${baris.map((x) => `<li><a class="jm-feed-i jm-feed-foto" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><span class="jm-feed-th">${ikon(IK[x.kepakaran?.[0]] || "tek-listrik", 28)}${urlAman(foto?.[x.id]) ? `<img src="${esc(foto[x.id])}" width="112" height="72" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}</span><span class="jm-feed-t"><strong>${esc(x.judul)}</strong><span class="jm-baris-meta"><span>${esc(x.media)}, ${esc(tanggal(String(x.terbit).slice(0, 10)))}</span>${x.kepakaran?.[0] ? `<span class="jm-pil">${esc(label("beranda.tek.", x.kepakaran[0]))}</span>` : ""}</span></span></a></li>`).join("")}</ul><a class="jm-lihat" href="/berita">${esc(t("beranda.lihat.berita"))} &rarr;</a>`;
  } catch (e) { sembunyi(el, e); el.closest(".jm-kartu").hidden = true; }
}

async function gambarProyek() {
  const el = document.getElementById("proyek");
  try {
    const p = await muat("proyek");
    const baru = [...p.baris].sort((a, b) => String(b.sumber?.[0]?.tanggal).localeCompare(String(a.sumber?.[0]?.tanggal)) || b.id.localeCompare(a.id)).slice(0, 6);
    el.innerHTML = `<ul class="jm-feed">${baru.map((x) => {
      const kap = x.kapasitas?.[0], st = x.status?.[0]?.nilai;
      return `<li><a class="jm-feed-i" href="/proyek#${encodeURIComponent(x.id)}"><span class="jm-feed-ik jm-feed-tek">${IKON[x.teknologi] || IKON.surya}</span><span class="jm-feed-t"><strong>${esc(x.nama)}</strong><span class="jm-baris-meta">${st ? `<span class="jm-pil">${esc(label("beranda.st.", st))}</span>` : ""}<span>${esc(x.lokasi?.provinsi || "-")}</span>${kap ? `<span class="jm-angka-tab">${esc(angka(kap.nilai, { desimal: kap.nilai % 1 ? 1 : 0 }))} ${esc(kap.satuan)}</span>` : ""}</span></span></a></li>`;
    }).join("")}</ul><a class="jm-lihat" href="/proyek">${esc(t("beranda.lihat.proyek"))} &rarr;</a>`;
  } catch (e) { sembunyi(el, e); el.closest(".jm-kartu").hidden = true; }
}

/* ---------- ekosistem: hitungan per kategori + kisi logo ---------- */
const inisial = (n) => { const w = String(n).split(/\s+/).filter((x) => /^[A-Za-z]/.test(x)); return (w.length > 1 ? w.slice(0, 2).map((x) => x[0]).join("") : (w[0] || "?").slice(0, 3)).toUpperCase(); };
async function gambarEkosistem() {
  const hit = document.getElementById("ekoHitung"), kisi = document.getElementById("ekoLogo");
  try {
    const [org, pro] = await Promise.all([muat("organisasi"), muat("proyek")]);
    const n = (k) => org.baris.filter((o) => o.kategori?.kode === k).length;
    hit.innerHTML = STRIP.map(([k, w, kunci]) => `<li><a href="/direktori?tampil=lembaga&amp;kat=${encodeURIComponent(k)}"><span class="jm-kotak jm-w${w}" aria-hidden="true"></span><b>${esc(angka(n(k)))}</b><span class="jm-strip-l">${esc(t(kunci))}</span></a></li>`).join("");
    const d = delapan(org.baris, pro);
    kisi.innerHTML = KAT_EKO.map(([kat, w]) => {
      const { daftar } = d[kat];
      const tiles = daftar.map((o) => {
        const nama = namaPendek(o.nama), slug = LOGO_ORG[o.id];
        return `<a class="jm-logo" href="/direktori?tampil=lembaga" title="${esc(o.nama)}">${slug ? `<img src="/img/logo/${slug}.png" width="26" height="26" alt="" loading="lazy">` : `<span class="jm-logo-ini jm-w${w}" aria-hidden="true">${esc(inisial(nama))}</span>`}<span>${esc(nama)}</span></a>`;
      });
      return `<div class="jm-logo-kol"><h3><span class="jm-kotak jm-w${w}" aria-hidden="true"></span>${esc(t("beranda.eko.k." + kat))}</h3>${tiles.join("")}</div>`;
    }).join("");
    document.getElementById("ekoSemua").innerHTML = `${esc(t("beranda.eko.semua", { n: angka(org.baris.length) }))} &rarr;`;
  } catch (e) { sembunyi(kisi, e); }
}

/* ---------- 8 pintu masuk (dulu di beranda_bawah.js) ---------- */
async function gambarJalur() {
  const el = document.getElementById("ekoJalur");
  try {
    const [rg, wl, rt, kl, pk, og] = await Promise.all(["ringkas", "wilayah", "rantai_plts", "kalender", "pustaka", "organisasi"].map(muat));
    const J = [["proyek", "/proyek", "pin", rg.hitung.proyek, "proyek"], ["wilayah", "/wilayah", "peta", wl.jumlah, "provinsi"], ["rantai", "/rantai", "pabrik", rt.ringkas.pabrikan, "pabrikan"], ["regulasi", "/regulasi", "timbangan", rg.hitung.regulasi, "regulasi"],
      ["direktori", "/direktori", "orangkunci", og.jumlah, "organisasi"], ["pustaka", "/direktori?tampil=pustaka", "buku", pk.jumlah, "dokumen"], ["kalender", "/kalender", "kalender", kl.jumlah, "acara"], ["insight", "/insight", "grafik", INSIGHT_KARTU, "kartu"]];
    el.innerHTML = J.map(([k, href, ik, n, u]) => `<a class="jm-jalur" href="${href}"><span class="jm-jalur-ik">${IKON[ik] || ""}</span>${k === "direktori" ? `<span class="jm-pil jm-jalur-kunci">${ikon("kunci", 12)}${esc(t("beranda.j.masuk"))}</span>` : ""}<strong>${esc(t("beranda.j." + k))}</strong><span class="jm-jalur-ket">${esc(t("beranda.j." + k + ".ket"))}</span><b class="jm-jalur-n">${esc(angka(n))} <small>${esc(t("beranda.jn." + u))}</small></b><span class="jm-jalur-panah" aria-hidden="true">&rarr;</span></a>`).join("");
  } catch (e) { sembunyi(el, e); }
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
    gambarKartu(); nanti(() => { gambarEkosistem(); gambarJalur(); gambarDataset(R); gambarBerita(); gambarProyek(); });
  };
  await mulai();
  pasangBawah(R);
  addEventListener("error", (e) => { if (e.target.tagName !== "IMG") return; if (e.target.closest(".jm-feed-th")) e.target.remove(); else if (e.target.closest(".jm-pm-lg")) e.target.replaceWith(Object.assign(document.createElement("span"), { className: "jm-pm-ini", textContent: e.target.dataset.ini || "" })); }, true);
  document.getElementById("kartu").addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai());
  const input = document.getElementById("cari");
  input.addEventListener("focus", () => siapkanIndeks().catch(() => { indeks = null; }), { once: true });
  const tunda = debounce((q) => cari(q));
  input.addEventListener("input", () => tunda(input.value));
  document.getElementById("cariTbl").addEventListener("click", () => cari(input.value));
  input.addEventListener("keydown", (e) => e.key === "Enter" && cari(input.value));
  document.addEventListener("jm:bahasa", () => nanti(() => { R && gambarKartu(); gambarEkosistem(); gambarJalur(); R && gambarDataset(R); gambarBerita(); gambarProyek(); input.value && cari(input.value); }));
}
main();
