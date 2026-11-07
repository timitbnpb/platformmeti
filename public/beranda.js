import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, kosongHtml, ikon } from "/inti/umum.js";
import { gambarDataset } from "/beranda_data.js";
import { pasangBawah, IKON } from "/beranda_bawah.js";
import { muat, label, urlAman, norm, namaRegulasi, sembunyi } from "/publik.js";

const KARTU = ["proyek", "kapasitas", "organisasi", "orang", "regulasi"];
const LOGO_ORG = { p_6998264f50: "pertamina-nre", p_dda1e51dae: "pge", p_5a2e7d0c63: "pln-indonesia-power", p_ff7a390a42: "pln-nusantara-power", p_27ae5a4203: "medco-power", p_bdd0f2d140: "barito-renewables", p_7a803f3b71: "star-energy", l_41bf1f0b41: "meti", l_dd90c88f59: "aesi", l_d3dadc789e: "aprobi", l_7278e0528a: "esdm", l_973f60de15: "brin" };
const ALIAS = [[/pertamina power indonesia|pertamina nre/i, "Pertamina NRE"], [/pertamina geothermal/i, "Pertamina Geothermal Energy"], [/kementerian energi dan sumber daya mineral/i, "Kementerian ESDM"], [/masyarakat energi terbarukan/i, "METI"], [/badan riset dan inovasi nasional/i, "BRIN"], [/asosiasi energi surya/i, "AESI"], [/asosiasi produsen biofuel/i, "APROBI"], [/asosiasi panas bumi/i, "API (panas bumi)"], [/kementerian investasi/i, "Kementerian Investasi/BKPM"]];
const namaPendek = (n) => { for (const [re, a] of ALIAS) if (re.test(n)) return a; return n.replace(/^PT\.?\s+/i, "").replace(/\s*\((Persero)\)/i, "").replace(/\s+Tbk$/i, ""); };
const URUT_ASOSIASI = [/metiires|masyarakat energi terbarukan/i, /surya/i, /biofuel/i, /panas bumi/i, /apamsi|modul surya/i, /applta|hidro/i, /aeski/i, /mki|ketenagalistrikan/i];
const URUT_LEMBAGA = [/energi dan sumber daya mineral/i, /dewan energi/i, /bappenas|perencanaan pembangunan/i, /riset dan inovasi/i, /kementerian keuangan/i, /perindustrian/i, /lingkungan hidup|kehutanan/i, /danantara|investasi/i];
const KAT_EKO = [["bumn", 1], ["swasta", 2], ["asosiasi", 3], ["lembaga", 4]];
const HITUNG = [["bumn", 1, "organisasi", "bumn"], ["swasta", 2, "organisasi", "swasta"], ["asing", 5, "organisasi", "internasional"], ["asosiasi", 3, "organisasi", "asosiasi"], ["lembaga", 4, "organisasi", "kementerian-lembaga"], ["kampus", 3, "organisasi", "perguruan-tinggi"], ["proyek", 2, "proyek"], ["regulasi", 1, "regulasi"]];
/** 8 terbesar per kategori: BUMN dan swasta menurut total MW proyek terkait lalu jumlah proyek; asosiasi menurut jumlah anggota lalu urutan tetap; lembaga menurut urutan tetap. */
function delapan(org, pro) {
  const proyek = new Map(pro.baris.map((p) => [p.id, p]));
  const skor = (o) => { const ps = (o.proyek_ids || []).map((i) => proyek.get(i)).filter(Boolean); return [ps.reduce((s, p) => s + (p.kapasitas?.[0]?.nilai || 0), 0), ps.length]; };
  const urutSkor = (a, b) => skor(b)[0] - skor(a)[0] || skor(b)[1] - skor(a)[1] || (LOGO_ORG[b.id] ? 1 : 0) - (LOGO_ORG[a.id] ? 1 : 0) || a.nama.localeCompare(b.nama);
  const anggota = new Map(); for (const o of org) for (const k of o.keanggotaan || []) anggota.set(k.organisasi_id, (anggota.get(k.organisasi_id) || 0) + 1);
  const tetap = (daftar, re) => { const idx = (o) => { const i = re.findIndex((r) => r.test(o.nama + " " + (o.singkatan || "") + " " + (o.situs || ""))); return i < 0 ? 99 : i; }; return [...daftar].sort((a, b) => idx(a) - idx(b) || a.nama.localeCompare(b.nama)); };
  const kat = (k) => org.filter((o) => o.kategori?.kode === k);
  return {
    bumn: kat("bumn").sort(urutSkor).slice(0, 8),
    swasta: kat("swasta").sort(urutSkor).slice(0, 8),
    asosiasi: [...kat("asosiasi")].sort((a, b) => (anggota.get(b.id) || 0) - (anggota.get(a.id) || 0) || tetap([a, b], URUT_ASOSIASI)[0] === a ? -1 : 1).slice(0, 8),
    lembaga: tetap(kat("kementerian-lembaga"), URUT_LEMBAGA).slice(0, 8),
  };
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
function gambarKartu() {
  const el = document.getElementById("kartu"), tgl = tanggal(R.dibangun_pada);
  const kartu = R.kartu.filter((k) => KARTU.includes(k.kode)).map((k) => ({ kode: k.kode, nilai: k.nilai, satuan: k.satuan }));
  const konstruksi = R.proyek_per_status?.konstruksi;
  if (Number.isFinite(konstruksi)) kartu.push({ kode: "konstruksi", nilai: konstruksi, satuan: "proyek", dari: R.hitung.proyek });
  el.innerHTML = kartu.map((k, i) => `<div class="jm-kpi jm-w${(i % 5) + 1}"><div class="jm-kpi-ik">${IKON_KPI[k.kode]}</div>
    <div class="jm-kpi-lab"><span>${esc(t("beranda.kk." + k.kode))}</span>${k.kode === "kapasitas" ? `<span class="jm-pil jm-pil-est">EST</span>` : ""}</div>
    <div class="jm-kpi-n"><b>${esc(angka(k.nilai))}</b><small>${esc(t("beranda.u." + k.satuan))}</small></div>
    <div class="jm-kpi-ctx">${k.dari ? esc(t("beranda.dari", { n: angka(k.nilai), total: angka(k.dari) })) : "&nbsp;"}</div>
    <div class="jm-kpi-src" title="${esc(t("beranda.src." + k.kode, { tanggal: tgl, total: angka(R.hitung.regulasi) }))}">${ikon("info", 14)}<span>${esc(t("beranda.srcs." + k.kode, { tanggal: tgl }))}</span></div></div>`).join("");
  document.getElementById("sumber").textContent = t("beranda.sumber", { tanggal: tgl });
  document.getElementById("heroHitung").innerHTML = ["proyek", "organisasi", "orang", "regulasi", "berita"].map((k, i) => `<li><span class="jm-kotak jm-w${(i % 5) + 1}" aria-hidden="true"></span><b>${esc(angka(R.hitung[k]))}</b> ${esc(t("beranda.hero.h." + k))}</li>`).join("");
}

async function gambarBerita() {
  const el = document.getElementById("berita");
  try {
    const b = await muat("berita");
    const baris = [...b.baris].filter((x) => urlAman(x.url) && x.terbit).sort((x, y) => String(y.terbit).localeCompare(String(x.terbit))).slice(0, 6);
    if (!baris.length) throw new Error("berita kosong");
    el.innerHTML = `<ul class="jm-feed">${baris.map((x) => `<li><a class="jm-feed-i" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><span class="jm-feed-ik">${esc(String(x.media || "?").replace(/^www\./, "").slice(0, 2).toUpperCase())}</span><span class="jm-feed-t"><strong>${esc(x.judul)}</strong><span class="jm-baris-meta"><span>${esc(x.media)}, ${esc(tanggal(String(x.terbit).slice(0, 10)))}</span>${x.kepakaran?.[0] ? `<span class="jm-pil">${esc(label("beranda.tek.", x.kepakaran[0]))}</span>` : ""}</span></span>${ikon("tautan", 16)}</a></li>`).join("")}</ul>`;
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
    const [org, pro, reg] = await Promise.all([muat("organisasi"), muat("proyek"), muat("regulasi")]);
    const n = (k) => org.baris.filter((o) => o.kategori?.kode === k).length;
    hit.innerHTML = HITUNG.map(([k, w, benda, kode]) => `<li><span class="jm-kotak jm-w${w}" aria-hidden="true"></span><b>${esc(angka(benda === "organisasi" ? n(kode) : benda === "proyek" ? pro.baris.length : reg.baris.length))}</b> ${esc(t("beranda.eko.h." + k))}</li>`).join("");
    const d = delapan(org.baris, pro);
    kisi.innerHTML = KAT_EKO.map(([kat, w]) => `<div class="jm-logo-kol"><h3><span class="jm-kotak jm-w${w}" aria-hidden="true"></span>${esc(t("beranda.eko.k." + kat))}</h3>${d[kat].map((o) => {
      const nama = namaPendek(o.nama), slug = LOGO_ORG[o.id];
      return `<a class="jm-logo" href="/direktori?tampil=lembaga" title="${esc(o.nama)}">${slug ? `<img src="/img/logo/${slug}.png" width="32" height="32" alt="" loading="lazy">` : `<span class="jm-logo-ini jm-w${w}" aria-hidden="true">${esc(inisial(nama))}</span>`}<span>${esc(nama)}</span></a>`;
    }).join("")}</div>`).join("");
    document.getElementById("ekoSemua").innerHTML = `${esc(t("beranda.eko.semua", { n: angka(org.baris.length) }))} &rarr;`;
  } catch (e) { sembunyi(kisi, e); }
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
    gambarKartu(); nanti(() => { gambarEkosistem(); gambarDataset(R); gambarBerita(); gambarProyek(); });
  };
  await mulai();
  pasangBawah(R);
  document.getElementById("kartu").addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai());
  const input = document.getElementById("cari");
  input.addEventListener("focus", () => siapkanIndeks().catch(() => { indeks = null; }), { once: true });
  const tunda = debounce((q) => cari(q));
  input.addEventListener("input", () => tunda(input.value));
  document.getElementById("cariTbl").addEventListener("click", () => cari(input.value));
  input.addEventListener("keydown", (e) => e.key === "Enter" && cari(input.value));
  document.addEventListener("jm:bahasa", () => nanti(() => { R && gambarKartu(); gambarEkosistem(); R && gambarDataset(R); gambarBerita(); gambarProyek(); input.value && cari(input.value); }));
}
main();
